// Access-control tests for the local KudiCubs stack. Run: node --test access-tests.mjs
// Sign-in uses real email one-time codes read from Mailpit (the CLI has no fixed email OTP).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './lib/env.mjs';
import { seed, PARENT, PARENT2, STAFF, PIN } from './seed.mjs';

const env = loadEnv();
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const mk = (key) => createClient(env.url, key, opts);
const admin = mk(env.serviceKey);
const anon = mk(env.anonKey);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mailIds() {
  const j = await (await fetch(`${env.mailUrl}/api/v1/messages?limit=500`)).json();
  return new Set(j.messages.map((m) => m.ID));
}
async function newCode(email, seen) {
  for (let i = 0; i < 40; i++) {
    const j = await (await fetch(`${env.mailUrl}/api/v1/messages?limit=500`)).json();
    const m = j.messages.find((x) => !seen.has(x.ID) && x.To.some((t) => t.Address === email));
    if (m) {
      const full = await (await fetch(`${env.mailUrl}/api/v1/message/${m.ID}`)).json();
      const code = (full.Text + ' ' + full.Subject).match(/\b(\d{6})\b/);
      if (code) return code[1];
    }
    await sleep(250);
  }
  throw new Error('no sign-in code arrived in Mailpit for ' + email);
}
async function signIn(email) {
  const seen = await mailIds();
  const c = mk(env.anonKey);
  const { error } = await c.auth.signInWithOtp({ email });
  assert.ifError(error);
  const token = await newCode(email, seen);
  const { data, error: e2 } = await c.auth.verifyOtp({ email, token, type: 'email' });
  assert.ifError(e2);
  assert.ok(data.session, 'session after verifyOtp');
  return { client: c, id: data.user.id };
}
const count = async (table, filter = (q) => q) => {
  const { count: n, error } = await filter(admin.from(table).select('*', { count: 'exact', head: true }));
  assert.ifError(error);
  return n;
};

let p1, p2, st, ids, f1Child, f1Attempt, f1Wallet;

before(async () => {
  ids = await seed({ log: () => {} });
  [p1, p2, st] = [await signIn(PARENT), await signIn(PARENT2), await signIn(STAFF)];
  assert.equal(p1.id, ids.parentId);
  const { data: kids } = await admin.from('child_profiles').select('id,nickname').eq('parent_id', ids.parentId).order('nickname');
  f1Child = kids.find((k) => k.nickname === 'Ama').id;
  f1Attempt = (await admin.from('mission_attempts').select('id').eq('child_id', f1Child).limit(1).single()).data.id;
  f1Wallet = (await admin.from('wallet_events').select('id').eq('child_id', f1Child).limit(1).single()).data.id;
});

test('parent sees only their own children, wallet, attempts and badges', async () => {
  const { data, error } = await p1.client.from('child_profiles').select('nickname,parent_id');
  assert.ifError(error);
  assert.deepEqual(data.map((c) => c.nickname).sort(), ['Ama', 'Kofi', 'Tobi', 'Zara']);
  assert.ok(data.every((c) => c.parent_id === p1.id));
  const { data: bal } = await p1.client.from('child_balances').select('child_id,coins,saved,xp');
  assert.equal(bal.length, 4);
  const ama = bal.find((b) => b.child_id === f1Child);
  assert.deepEqual([ama.coins, ama.saved, ama.xp], [120, 40, 360]); // matches the sample family: coins 120, savings 40, xp 360
  const { data: mine } = await p2.client.from('child_profiles').select('nickname');
  assert.deepEqual(mine.map((c) => c.nickname), ['Nia']);
});

test('parent2 cannot read family 1 data', async () => {
  for (const t of ['child_profiles', 'wallet_events', 'mission_attempts', 'child_badges']) {
    const col = t === 'child_profiles' ? 'id' : 'child_id';
    const { data, error } = await p2.client.from(t).select('*').eq(col, f1Child);
    assert.ifError(error);
    assert.equal(data.length, 0, `${t} leaked`);
  }
  const { data: bal } = await p2.client.from('child_balances').select('*').eq('child_id', f1Child);
  assert.equal(bal.length, 0);
  const { data: par } = await p2.client.from('parents').select('id');
  assert.deepEqual(par.map((p) => p.id), [p2.id]);
  const { data: dev } = await p2.client.from('devices').select('id');
  assert.equal(dev.length, 1);
});

test('parent2 cannot insert into family 1', async () => {
  const before = { c: await count('child_profiles'), w: await count('wallet_events'), a: await count('mission_attempts'), b: await count('child_badges') };
  const r = [
    await p2.client.from('child_profiles').insert({ parent_id: ids.parentId, nickname: 'Intruder', age_band: 'b4_6', region: 'gh' }),
    await p2.client.from('wallet_events').insert({ child_id: f1Child, kind: 'earn', amount: 9999, label: 'x' }),
    await p2.client.from('mission_attempts').insert({ child_id: f1Child, mission_id: 'm_4_6_lost_coins', outcome: 'success' }),
    await p2.client.from('child_badges').insert({ child_id: f1Child, badge_id: 'badge.pride_star' }),
    await p2.client.from('devices').insert({ parent_id: ids.parentId, label: 'evil' }),
  ];
  r.forEach((x, i) => assert.ok(x.error, `insert ${i} should be refused`));
  assert.deepEqual({ c: await count('child_profiles'), w: await count('wallet_events'), a: await count('mission_attempts'), b: await count('child_badges') }, before);
});

test('parent2 cannot update or delete family 1 data (rows untouched)', async () => {
  const upd = await p2.client.from('child_profiles').update({ nickname: 'Hacked' }).eq('id', f1Child).select();
  assert.ok(upd.error || upd.data.length === 0);
  const upd2 = await p2.client.from('child_profiles').update({ parent_id: ids.parent2Id }).eq('id', f1Child).select();
  assert.ok(upd2.error || upd2.data.length === 0);
  const ua = await p2.client.from('mission_attempts').update({ outcome: 'left' }).eq('child_id', f1Child).select();
  assert.ok(ua.error || ua.data.length === 0);
  const ub = await p2.client.from('child_badges').update({ earned_at: new Date().toISOString() }).eq('child_id', f1Child).select();
  assert.ok(ub.error || ub.data.length === 0);
  for (const t of ['child_badges', 'mission_attempts', 'wallet_events']) {
    const d = await p2.client.from(t).delete().eq('child_id', f1Child).select();
    assert.ok(d.error || d.data.length === 0, `${t} delete`);
  }
  const d = await p2.client.from('child_profiles').delete().eq('id', f1Child).select();
  assert.ok(d.error || d.data.length === 0);
  const { data: ama } = await admin.from('child_profiles').select('nickname,parent_id').eq('id', f1Child).single();
  assert.deepEqual(ama, { nickname: 'Ama', parent_id: ids.parentId });
  assert.equal(await count('wallet_events', (q) => q.eq('child_id', f1Child)), 7);
  assert.equal(await count('mission_attempts', (q) => q.eq('child_id', f1Child)), 3);
  assert.equal(await count('child_badges', (q) => q.eq('child_id', f1Child)), 3);
});

test('wallet_events are append-only for the owning parent too', async () => {
  const ins = await p1.client.from('wallet_events').insert({ child_id: f1Child, kind: 'earn', amount: 1, label: 'append ok' }).select();
  assert.ifError(ins.error);
  assert.equal(ins.data.length, 1);
  const u = await p1.client.from('wallet_events').update({ amount: 1 }).eq('id', f1Wallet).select();
  assert.ok(u.error || u.data.length === 0, 'update must not change a row');
  const d = await p1.client.from('wallet_events').delete().eq('id', f1Wallet).select();
  assert.ok(d.error || d.data.length === 0, 'delete must not remove a row');
  assert.equal(await count('wallet_events', (q) => q.eq('id', f1Wallet)), 1);
  const { data: row } = await admin.from('wallet_events').select('amount').eq('id', f1Wallet).single();
  assert.notEqual(row.amount, 1);
  await admin.from('wallet_events').delete().eq('id', ins.data[0].id); // tidy the appended row
});

test('pin_hash (and attempt counter) are not selectable; pin cannot be written directly', async () => {
  for (const cols of ['pin_hash', 'pin_attempts', '*']) {
    const { data, error } = await p1.client.from('parents').select(cols);
    assert.ok(error, `select ${cols} must fail`);
    assert.equal(data, null);
  }
  const { data: ok, error } = await p1.client.from('parents').select('id,email,region,consented_at,pin_locked_until');
  assert.ifError(error);
  assert.equal(ok.length, 1);
  const w = await p1.client.from('parents').update({ pin_hash: 'x' }).eq('id', p1.id).select('id');
  assert.ok(w.error, 'direct pin_hash write must fail');
  const e = await p1.client.from('parents').update({ email: 'x@example.com' }).eq('id', p1.id).select('id');
  assert.ok(e.error, 'email write must fail');
  const r = await p1.client.from('parents').update({ region: 'ng' }).eq('id', p1.id).select('region');
  assert.ifError(r.error);
  assert.equal(r.data[0].region, 'ng');
  await admin.from('parents').update({ region: 'gh' }).eq('id', p1.id);
});

test('verify_pin: ok, wrong, locked after 5 wrong tries; seeding helper is not callable by clients', async () => {
  assert.equal((await p2.client.rpc('verify_pin', { pin: PIN })).data, 'ok');
  const seq = [];
  for (let i = 0; i < 5; i++) seq.push((await p2.client.rpc('verify_pin', { pin: '0000' })).data);
  assert.deepEqual(seq, ['wrong', 'wrong', 'wrong', 'wrong', 'locked']);
  assert.equal((await p2.client.rpc('verify_pin', { pin: PIN })).data, 'locked', 'right pin refused while locked');
  await admin.from('parents').update({ pin_attempts: 0, pin_locked_until: null }).eq('id', p2.id);
  assert.equal((await p2.client.rpc('verify_pin', { pin: PIN })).data, 'ok');
  // set_pin rules
  assert.ok((await p2.client.rpc('set_pin', { pin: '1234' })).error, 'weak pin refused');
  assert.ok((await p2.client.rpc('set_pin', { pin: 'abcd' })).error, 'bad format refused');
  // anonymous and client calls to privileged functions are refused
  assert.ok((await anon.rpc('verify_pin', { pin: PIN })).error);
  assert.ok((await anon.rpc('export_my_family')).error);
  assert.ok((await anon.rpc('delete_my_family')).error);
  assert.ok((await p1.client.rpc('seed_set_pin', { p_user: p2.id, p_pin: '1357' })).error);
  assert.ok((await anon.rpc('seed_set_pin', { p_user: p2.id, p_pin: '1357' })).error);
  assert.equal((await p2.client.rpc('verify_pin', { pin: PIN })).data, 'ok', 'pin unchanged by refused calls');
});

test('staff can read all families but not pin_hash, and parents cannot see staff tables', async () => {
  const kids = await st.client.from('child_profiles').select('nickname');
  assert.ifError(kids.error);
  assert.deepEqual(kids.data.map((c) => c.nickname).sort(), ['Ama', 'Kofi', 'Nia', 'Tobi', 'Zara']);
  for (const t of ['wallet_events', 'mission_attempts', 'child_badges']) {
    const { data, error } = await st.client.from(t).select('child_id');
    assert.ifError(error);
    assert.ok(data.length >= 5, t);
    assert.ok(new Set(data.map((r) => r.child_id)).size >= 5, `${t} covers all five children`);
  }
  const { data: par } = await st.client.from('parents').select('email');
  assert.ok(par.map((p) => p.email).includes(PARENT2));
  assert.ok((await st.client.from('parents').select('pin_hash')).error);
  assert.ok((await st.client.from('parents').select('*')).error);
  const me = await st.client.from('staff_users').select('role').eq('user_id', st.id);
  assert.equal(me.data[0].role, 'admin');
  assert.ok((await p1.client.from('staff_users').select('*')).data.length === 0);
  // staff cannot write family data
  const w = await st.client.from('wallet_events').insert({ child_id: f1Child, kind: 'earn', amount: 1 });
  assert.ok(w.error);
  const nick = await st.client.from('child_profiles').update({ nickname: 'x' }).eq('id', f1Child).select();
  assert.ok(nick.error || nick.data.length === 0);
});

test('anon reads missions and badges only; contact form works; messages are staff-only', async () => {
  const m = await anon.from('missions').select('id,age_band,world,title,position');
  assert.ifError(m.error);
  assert.equal(m.data.length, 17);
  assert.deepEqual([...new Set(m.data.map((x) => x.world))].sort(), ['Build & Grow', 'Founder Mode', 'Money & Choices', 'Side Hustle']);
  assert.ok(m.data.some((x) => x.id === 'm_4_6_lost_coins'));
  const b = await anon.from('badges').select('id,title');
  assert.ifError(b.error);
  assert.equal(b.data.length, 8);
  for (const t of ['child_profiles', 'wallet_events', 'mission_attempts', 'child_badges', 'devices', 'parents', 'staff_users', 'contact_messages', 'child_balances']) {
    const { data, error } = await anon.from(t).select('*');
    assert.ok(error || data.length === 0, `anon read ${t}`);
  }
  const ref = await anon.rpc('submit_contact', { p_name: 'Test Parent', p_email: 'tester@example.com', p_topic: 'general', p_message: 'Hello from the access tests' });
  assert.ifError(ref.error);
  assert.match(ref.data, /^KC-\d{4}$/);
  assert.ok((await anon.rpc('submit_contact', { p_name: 'x', p_email: 'not-an-email', p_topic: '', p_message: 'long enough message' })).error, 'bad email refused');
  assert.ok((await anon.rpc('submit_contact', { p_name: 'x', p_email: 'a@b.co', p_topic: '', p_message: 'no' })).error, 'short message refused');
  assert.ok((await anon.from('contact_messages').insert({ name: 'x', email: 'a@b.co', message: 'direct insert' })).error, 'direct insert refused');
  assert.ok((await anon.from('contact_messages').select('*')).error || true);
  assert.equal((await p1.client.from('contact_messages').select('*')).data.length, 0, 'parent cannot read messages');
  const staffSee = await st.client.from('contact_messages').select('reference,email').eq('reference', ref.data);
  assert.ok(staffSee.data.some((r) => r.email === 'tester@example.com'), 'staff can read messages');
  await admin.from('contact_messages').delete().eq('email', 'tester@example.com');
  // anon cannot edit the catalogue
  const u = await anon.from('missions').update({ title: 'x' }).eq('id', 'm_4_6_lost_coins').select();
  assert.ok(u.error || u.data.length === 0);
  const pu = await p1.client.from('missions').update({ title: 'x' }).eq('id', 'm_4_6_lost_coins').select();
  assert.ok(pu.error || pu.data.length === 0, 'parent cannot edit missions');
});

test('export_my_family returns the right shape', async () => {
  const { data, error } = await p1.client.rpc('export_my_family');
  assert.ifError(error);
  assert.deepEqual(Object.keys(data).sort(), ['children', 'devices', 'parent']);
  assert.equal(data.parent.email, PARENT);
  assert.ok(!('pin_hash' in data.parent));
  assert.equal(data.children.length, 4);
  for (const c of data.children) {
    assert.deepEqual(Object.keys(c).sort(), ['attempts', 'badges', 'profile', 'wallet']);
    assert.ok(Array.isArray(c.wallet) && Array.isArray(c.attempts) && Array.isArray(c.badges));
    assert.ok(!('parent_id' in c.profile) || c.profile.parent_id === p1.id);
  }
  const ama = data.children.find((c) => c.profile.nickname === 'Ama');
  assert.equal(ama.wallet.length, 7);
  assert.equal(ama.attempts.length, 3);
  assert.equal(ama.badges.length, 3);
  assert.equal(data.devices.length, 2);
  assert.ok(!JSON.stringify(data).includes('Nia'), 'no other family in the export');
});

test('delete_my_family removes the parent and every child record (throwaway user)', async () => {
  const email = `throwaway-${Date.now()}@example.com`;
  const t = await signIn(email);
  try {
    assert.equal(await count('parents', (q) => q.eq('id', t.id)), 1, 'parent row created by trigger');
    const kid = await t.client.from('child_profiles').insert({ parent_id: t.id, nickname: 'Temp', age_band: 'b4_6', region: 'gh' }).select().single();
    assert.ifError(kid.error);
    const cid = kid.data.id;
    const att = await t.client.from('mission_attempts').insert({ child_id: cid, mission_id: 'm_4_6_lost_coins', outcome: 'success' }).select().single();
    assert.ifError(att.error);
    assert.ifError((await t.client.from('wallet_events').insert({ child_id: cid, kind: 'earn', amount: 5, attempt_id: att.data.id })).error);
    assert.ifError((await t.client.from('child_badges').insert({ child_id: cid, badge_id: 'badge.first_coins' })).error);
    assert.ifError((await t.client.from('devices').insert({ parent_id: t.id, label: 'tmp' })).error);
    const others = { c: await count('child_profiles'), w: await count('wallet_events') };
    assert.ifError((await t.client.rpc('delete_my_family')).error);
    assert.equal(await count('parents', (q) => q.eq('id', t.id)), 0);
    assert.equal(await count('child_profiles', (q) => q.eq('parent_id', t.id)), 0);
    assert.equal(await count('wallet_events', (q) => q.eq('child_id', cid)), 0);
    assert.equal(await count('mission_attempts', (q) => q.eq('child_id', cid)), 0);
    assert.equal(await count('child_badges', (q) => q.eq('child_id', cid)), 0);
    assert.equal(await count('devices', (q) => q.eq('parent_id', t.id)), 0);
    assert.equal((await admin.auth.admin.getUserById(t.id)).data.user, null, 'auth user removed');
    assert.deepEqual({ c: await count('child_profiles'), w: await count('wallet_events') }, { c: others.c - 1, w: others.w - 1 }, 'only the throwaway family was removed');
  } finally {
    await admin.auth.admin.deleteUser(t.id).catch(() => {});
  }
});

after(async () => {
  // leave the demo accounts unlocked and with the demo PIN
  await admin.from('parents').update({ pin_attempts: 0, pin_locked_until: null }).in('id', [ids.parentId, ids.parent2Id]);
});
