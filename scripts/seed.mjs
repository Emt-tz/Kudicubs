// Idempotent seed for the local KudiCubs stack (spec 006).
//   node seed.mjs            seed (safe to run again)
//   node seed.mjs --reset    delete seed users and their data first, then seed
// Uses the service role key: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY, or `supabase status -o env`.
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnv } from './lib/env.mjs';

export const PIN = '5821';
export const PARENT = 'parent@example.com';
export const PARENT2 = 'parent2@example.com';
export const STAFF = 'staff@example.com';

const W = { b4_6: 'Money & Choices', b7_9: 'Build & Grow', b10_12: 'Founder Mode', b13_15: 'Side Hustle' };
const M = (band, list) => list.map(([slug, title], i) => ({ id: `m_${band.slice(1)}_${slug}`, age_band: band, world: W[band], title, position: i + 1, published: true }));
export const MISSIONS = [
  ...M('b4_6', [['lost_coins', 'The Lost Coins'], ['picnic', 'Shopping for a Picnic'], ['bicycle', 'Saving for a Bicycle'], ['playground', 'Building a Playground Together'], ['rainy_umbrella', 'The Rainy Day Umbrella']]),
  ...M('b7_9', [['birthday_party', 'Birthday Party Budget'], ['lemonade', 'The Lemonade Challenge'], ['toy_shop', 'The Toy Shop'], ['pizza_festival', 'The Pizza Festival']]),
  ...M('b10_12', [['clothing_brand', 'Start-up Funding for a Clothing Brand'], ['keep_running', 'Keep the Company Running'], ['business_island', 'Business Island'], ['battle_of_brands', 'Battle of the Brands']]),
  ...M('b13_15', [['side_hustle', 'Side Hustle Simulator'], ['budget_boss', 'Budget Boss Challenge'], ['investment_arena', 'Investment Arena'], ['big_purchase', 'The Big Purchase']]),
];
export const BADGES = [
  ['badge.first_coins', 'First Coins', 'know'], ['badge.kind_friend', 'Kind Friend', 'share'], ['badge.early_bird', 'Early Bird', null],
  ['badge.hard_worker', 'Hard Worker', 'decide'], ['badge.smart_sorter', 'Smart Sorter', 'understand'], ['badge.smart_saver', 'Smart Saver', 'decide'],
  ['badge.market_explorer', 'Market Explorer', 'know'], ['badge.pride_star', 'Pride Star', null],
].map(([id, title, pillar]) => ({ id, title, pillar }));

// Sample-family play titles -> mission ids (the family file predates the 17-mission list).
const PLAY_TO_MISSION = {
  'The Lost Coins': 'm_4_6_lost_coins', 'Market walk': 'm_4_6_lost_coins',
  'The Snack Stall': 'm_7_9_lemonade', 'The Lemonade Stand': 'm_10_12_clothing_brand', 'Side Hustle: first sale': 'm_13_15_side_hustle',
};

const stableId = (...parts) => {
  const h = createHash('sha1').update('kudicubs-seed:' + parts.join(':')).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const daysAgo = (n, extraMin = 0) => new Date(Date.now() - n * 864e5 + extraMin * 6e4).toISOString();
const must = (label, { error, data }) => { if (error) throw new Error(`${label}: ${error.message}`); return data; };

export async function seed({ reset = false, log = console.log } = {}) {
  const env = loadEnv();
  const db = createClient(env.url, env.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const family = JSON.parse(readFileSync(resolve(env.root, 'shared/sample-family.json'), 'utf8'));

  async function allUsers() {
    const out = []; let page = 1;
    for (;;) {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      out.push(...data.users);
      if (data.users.length < 200) return out;
      page++;
    }
  }
  const emails = [PARENT, PARENT2, STAFF];
  if (reset) {
    for (const u of (await allUsers()).filter((u) => emails.includes(u.email))) {
      must('delete user', await db.auth.admin.deleteUser(u.id));
    }
    must('clear contact', await db.from('contact_messages').delete().in('email', emails));
    log('reset: seed users and their data removed');
  }
  async function ensureUser(email) {
    const found = (await allUsers()).find((u) => u.email === email);
    if (found) return found.id;
    const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true });
    if (error) throw error;
    return data.user.id;
  }
  const parentId = await ensureUser(PARENT);
  const parent2Id = await ensureUser(PARENT2);
  const staffId = await ensureUser(STAFF);

  // staff: a staff_users row (admin) and no family row
  must('staff', await db.from('staff_users').upsert({ user_id: staffId, email: STAFF, role: 'admin' }));
  must('staff parent row', await db.from('parents').delete().eq('id', staffId));

  // catalogue
  must('missions', await db.from('missions').upsert(MISSIONS, { onConflict: 'id' }));
  must('badges', await db.from('badges').upsert(BADGES, { onConflict: 'id' }));
  const missionIds = new Set(MISSIONS.map((m) => m.id));
  const badgeIds = new Set(BADGES.map((b) => b.id));

  // parents
  const regionOf = { [parentId]: family.family.region, [parent2Id]: 'uk' };
  for (const id of [parentId, parent2Id]) {
    must('parent', await db.from('parents').update({ region: regionOf[id], consented_at: daysAgo(10) }).eq('id', id));
    must('pin', await db.rpc('seed_set_pin', { p_user: id, p_pin: PIN }));
  }

  async function seedChild(owner, ownerEmail, c, fallbackMission) {
    const id = stableId(ownerEmail, c.nickname);
    must('child', await db.from('child_profiles').upsert({ id, parent_id: owner, nickname: c.nickname, age_band: c.ageBand, region: c.region, avatar: c.avatar, deleted_at: null }));
    for (const t of ['wallet_events', 'mission_attempts', 'child_badges']) must('clear ' + t, await db.from(t).delete().eq('child_id', id));
    const attempts = (c.play || []).map((p, i) => {
      const mission_id = PLAY_TO_MISSION[p.title] || fallbackMission;
      if (!missionIds.has(mission_id)) throw new Error('unknown mission ' + mission_id);
      return { id: stableId(ownerEmail, c.nickname, 'attempt', i), child_id: id, mission_id, outcome: 'success', started_at: daysAgo(p.ago, -10), finished_at: daysAgo(p.ago) };
    });
    if (attempts.length) must('attempts', await db.from('mission_attempts').insert(attempts));
    const wallet = [], badges = [];
    for (const e of c.events || []) {
      if (e.t === 'badge') { if (!badgeIds.has(e.badge)) throw new Error('unknown badge ' + e.badge); badges.push({ child_id: id, badge_id: e.badge, earned_at: daysAgo(e.ago) }); }
      else if (['earn', 'spend', 'save', 'bonus', 'daily', 'xp'].includes(e.t)) wallet.push({ child_id: id, kind: e.t, amount: e.n, label: e.label, created_at: daysAgo(e.ago, wallet.length) });
      // 'pillar' events have no table in the core schema; they stay in the sample file for the prototypes.
    }
    if (wallet.length) must('wallet', await db.from('wallet_events').insert(wallet));
    if (badges.length) must('child_badges', await db.from('child_badges').upsert(badges));
    return { nickname: c.nickname, wallet: wallet.length, attempts: attempts.length, badges: badges.length };
  }
  const summary = [];
  for (const c of family.children) summary.push(await seedChild(parentId, PARENT, c, MISSIONS.find((m) => m.age_band === c.ageBand).id));
  summary.push(await seedChild(parent2Id, PARENT2, {
    nickname: 'Nia', ageBand: 'b7_9', region: 'uk', avatar: 'cub-friend-5',
    events: [{ t: 'earn', n: 80, ago: 3, label: 'history.market_walk' }, { t: 'xp', n: 200, ago: 3, label: 'xp' }, { t: 'save', n: 30, ago: 2, label: 'history.saved' }, { t: 'badge', n: 0, ago: 3, label: 'badge', badge: 'badge.first_coins' }],
    play: [{ ago: 3, title: 'Birthday Party Budget', outcome: 'Stayed on budget' }],
  }, 'm_7_9_birthday_party'));

  // devices (family 1 from the sample file; family 2 one phone)
  const lastSeen = (s) => (s === 'Today' ? daysAgo(0) : daysAgo(parseInt(s, 10) || 1));
  const devices = [
    ...family.family.devices.map((d, i) => ({ id: stableId(PARENT, 'device', i), parent_id: parentId, label: d.label, mode: d.mode, last_seen: lastSeen(d.lastSeen) })),
    { id: stableId(PARENT2, 'device', 0), parent_id: parent2Id, label: 'Parent2 phone', mode: 'my-phone', last_seen: daysAgo(0) },
  ];
  must('devices', await db.from('devices').upsert(devices));

  log(`seeded: ${MISSIONS.length} missions, ${BADGES.length} badges, 3 users, children: ` + summary.map((s) => `${s.nickname}(${s.wallet}w/${s.attempts}a/${s.badges}b)`).join(' '));
  return { parentId, parent2Id, staffId };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed({ reset: process.argv.includes('--reset') }).catch((e) => { console.error(e); process.exit(1); });
}
