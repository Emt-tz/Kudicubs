/* Parent Dashboard / Team Console: every number is derived from a child's event log with the SAME rules as the app
   (prototype/assets/app.js KC.derive, KINDS, levels in mock-data.js). Pure; no storage, no network. Spec 005 FR-015, data-model. */
(function () {
  'use strict';
  /* money kinds add or take coins; the others carry xp, badges or pillar progress (same table as the app's KINDS) */
  var KINDS = {
    earn: { coins: 1, chart: 'missions' }, bonus: { coins: 1, chart: 'bonus' }, daily: { coins: 1, chart: 'daily' },
    save: { coins: -1, chart: 'savings', out: true }, spend: { coins: -1, chart: 'treats', out: true },
    xp: {}, badge: {}, pillar: {}, mission_done: {}, mission_replay: {}
  };
  var LEVELS = [
    { n: 1, name: 'Market Visitor', xpFrom: 0 }, { n: 2, name: 'Market Helper', xpFrom: 150 }, { n: 3, name: 'Stall Keeper', xpFrom: 400 },
    { n: 4, name: 'Market Star', xpFrom: 700 }, { n: 5, name: 'Pride Trader', xpFrom: 1100 }
  ];
  var PILLARS = [
    { id: 'know', name: 'Know' }, { id: 'understand', name: 'Understand' }, { id: 'decide', name: 'Decide' },
    { id: 'invest', name: 'Invest' }, { id: 'share', name: 'Share' }
  ];
  var BADGES = {
    'badge.first_coins': 'First Coins', 'badge.kind_friend': 'Kind Friend', 'badge.early_bird': 'Early Bird', 'badge.hard_worker': 'Hard Worker',
    'badge.smart_sorter': 'Smart Sorter', 'badge.smart_saver': 'Smart Saver', 'badge.market_explorer': 'Market Explorer', 'badge.pride_star': 'Pride Star'
  };
  var LABELS = {
    'history.market_walk': 'Market walk', 'history.tidy_bonus': 'Tidy bonus', 'history.saved': 'Saved in the jar', 'history.sticker': 'Sticker',
    'history.daily': 'Market day', 'history.helping': 'Helping at the stall', 'history.lost_coins': 'The Lost Coins',
    'history.lost_coins_bonus': 'Perfect sorting', 'history.found': 'Coins found', 'history.earlier': 'Earlier'
  };
  var BANDS = { b4_6: '4 to 6', b7_9: '7 to 9', b10_12: '10 to 12', b13_15: '13 to 15' };
  var REGIONS = {
    gh: { name: 'Ghana', symbol: 'GH₵', iso: 'GHS' }, ng: { name: 'Nigeria', symbol: '₦', iso: 'NGN' }, uk: { name: 'United Kingdom', symbol: '£', iso: 'GBP' }
  };

  function levelFor(xp) {
    var lv = LEVELS[0];
    LEVELS.forEach(function (l) { if (xp >= l.xpFrom) lv = l; });
    return lv;
  }
  /* events carry `ago` (days ago) in the sample family; the app stores dates. Same order rules: history is newest-appended first. */
  function derive(events) {
    var v = { coins: 0, savings: 0, xp: 0, badges: [], pillars: {}, history: [], chart: { missions: 0, bonus: 0, daily: 0, savings: 0, treats: 0 }, items: 0 };
    PILLARS.forEach(function (p) { v.pillars[p.id] = 0; });
    (events || []).forEach(function (e) {
      var k = KINDS[e.t];
      if (!k) return;
      if (k.chart) {
        v.coins += k.coins * e.n;
        v.chart[k.chart] += e.n;
        v.history.unshift({ kind: e.t, amount: e.n, label: LABELS[e.label] || e.label, daysAgo: e.ago, out: !!k.out });
      }
      if (e.t === 'save') v.savings += e.n;
      if (e.t === 'spend') v.items += 1;
      if (e.t === 'xp') v.xp += e.n;
      if (e.t === 'badge' && v.badges.indexOf(e.badge) === -1) v.badges.push(e.badge);
      if (e.t === 'pillar') v.pillars[e.pillar] = Math.min(1, v.pillars[e.pillar] + e.n / 100);
    });
    v.level = levelFor(v.xp);
    var next = LEVELS[v.level.n];
    v.levelProgress = next ? (v.xp - v.level.xpFrom) / (next.xpFrom - v.level.xpFrom) : 1;
    v.nextLevel = next || null;
    v.empty = !(events || []).length;
    return v;
  }
  /* last 7 days (index 0 = 6 days ago ... 6 = today): coins earned and plays, from events and play */
  function week(child) {
    var days = [];
    for (var i = 6; i >= 0; i--) days.push({ ago: i, earned: 0, plays: 0 });
    var at = function (ago) { return ago >= 0 && ago <= 6 ? days[6 - ago] : null; };
    (child.events || []).forEach(function (e) { var d = at(e.ago); if (d && (e.t === 'earn' || e.t === 'bonus' || e.t === 'daily')) d.earned += e.n; });
    (child.play || []).forEach(function (p) { var d = at(p.ago); if (d) d.plays += 1; });
    return days;
  }
  function lastActive(child) {
    var ago = null;
    (child.events || []).concat(child.play || []).forEach(function (x) { if (ago === null || x.ago < ago) ago = x.ago; });
    return ago;
  }
  function agoText(n) { return n === null || n === undefined ? 'Not yet' : n === 0 ? 'Today' : n === 1 ? 'Yesterday' : n + ' days ago'; }
  function money(n, region) { return (REGIONS[region] || REGIONS.gh).symbol + n; }

  window.KCDerive = { KINDS: KINDS, LEVELS: LEVELS, PILLARS: PILLARS, BADGES: BADGES, BANDS: BANDS, REGIONS: REGIONS, derive: derive, levelFor: levelFor, week: week, lastActive: lastActive, agoText: agoText, money: money };
})();
