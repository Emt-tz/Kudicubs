/* KudiCubs prototype — configuration and example data only (spec 002 FR-012; 004 data-model §5).
   A new player starts from zero (004 FR-023): there is no preset balance, history or badge here any more.
   KC.sample is used only by the reviewer's "Load sample data". Nothing here is a real person.
   The parent-gate email and PIN are never added to this object. */
window.KC = window.KC || {};

KC.version = { prototype: '0.3.0', tokens: '0.3.0' };

KC.data = {
  nicknames: ['Ama', 'Kofi', 'Zara', 'Tobi'],
  avatars: ['cub-friend-1', 'cub-friend-2', 'cub-friend-3', 'cub-friend-4'],

  levels: [
    { n: 1, nameKey: 'level.market_visitor', xpFrom: 0 },
    { n: 2, nameKey: 'level.market_helper', xpFrom: 150 },
    { n: 3, nameKey: 'level.stall_keeper', xpFrom: 400 },
    { n: 4, nameKey: 'level.market_star', xpFrom: 700 },
    { n: 5, nameKey: 'level.pride_trader', xpFrom: 1100 }
  ],

  badges: [
    { id: 'badge.first_coins', nameKey: 'badge.first_coins', icon: 'badge-first-coins' },
    { id: 'badge.kind_friend', nameKey: 'badge.kind_friend', icon: 'badge-kind-friend' },
    { id: 'badge.early_bird', nameKey: 'badge.early_bird', icon: 'badge-early-bird' },
    { id: 'badge.hard_worker', nameKey: 'badge.hard_worker', icon: 'badge-hard-worker' },
    { id: 'badge.smart_sorter', nameKey: 'badge.smart_sorter', icon: 'badge-smart-sorter' },
    { id: 'badge.smart_saver', nameKey: 'badge.smart_saver', icon: 'badge-smart-saver' },
    { id: 'badge.market_explorer', nameKey: 'badge.market_explorer', icon: 'badge-market-explorer' },
    { id: 'badge.pride_star', nameKey: 'badge.pride_star', icon: 'badge-pride-star' }
  ],

  pillarGain: { know: 20, understand: 15 },          /* percent points per first completion */

  daily: { titleKey: 'daily.title', goal: 3, rewardCoins: 10 },

  lostCoins: {
    hidden: 8,
    jars: 3,
    firstReward: { coins: 30, xp: 40, badge: 'badge.hard_worker' },
    perfectSortBonus: { coins: 10, xp: 10, badge: 'badge.smart_sorter' },
    replay: { xp: 5 }
  },

  /* UI strings only (visible text + screen-reader text, 003 FR-046). Spoken lines live in
     docs/design/narration/lines.json → audio-manifest.js (003 FR-017); never duplicated here. */
  strings: {
    'app.name': 'KudiCubs',
    'welcome.title': 'Join the Pride!', 'welcome.sub': 'Play, learn and grow your money skills!', 'welcome.go': "Let's Go",
    'age.title': 'How old are you?', 'age.soon': 'Coming soon',
    'avatar.title': 'Pick your friend', 'avatar.done': "That's me!",
    'gate.title': 'For grown-ups', 'gate.hold': 'Grown-ups: press and hold for 3 seconds', 'gate.hold_btn': 'Hold',
    'gate.maths': 'What is {a} times {b}?', 'gate.check': 'Check', 'gate.retry': 'Not quite — here is a new question.',
    'gate.pin': 'Choose a 4-digit parent PIN', 'gate.pin_weak': 'Please choose a harder PIN',
    'gate.region': 'Where does your family live?', 'gate.email': 'Parent email', 'gate.email_placeholder': 'parent@example.com',
    'gate.email_bad': 'Please check the email address', 'gate.join': 'Join the Pride',
    'gate.note': 'Prototype only — nothing you type here is saved or sent.',
    'joined.title': 'You joined the Pride!',
    'home.hi': 'Hi, {name}!', 'home.hi_friend': 'Hi there!', 'home.continue': 'Continue', 'home.mission': 'The Lost Coins', 'home.next': 'Next: {level}',
    'daily.title': 'Market day',
    'nav.home_label': 'Home', 'nav.wallet_label': 'Wallet', 'nav.progress_label': 'Progress', 'nav.back_home': 'Back to Home',
    'intro.title': 'The Lost Coins', 'intro.start': 'Start', 'intro.yes_label': 'Yes!',
    'next': 'Next',
    'decide.title': 'What will you do with your coins?', 'decide.ok': 'OK',
    'decide.save_label': 'Save it', 'decide.save_sub': 'Keep for later',
    'decide.spend_label': 'Spend it', 'decide.spend_sub': 'A {treat} sticker',
    'result.save.title': 'Great saving!', 'result.spend.title': 'Yum!',
    'summary.found_label': 'You found {n} coins', 'summary.sorted_label': 'You sorted them into jars', 'summary.counted_label': 'You counted every coin',
    'summary.saved_label': 'I saved my coins', 'summary.spent_label': 'I chose a treat',
    'reward.title': 'Amazing work!', 'reward.replay_title': 'Great practice!', 'reward.levelup': 'Level up! You are now a {level}!',
    'wallet.title': 'My Wallet', 'wallet.coins': 'Coins', 'wallet.savings': 'Savings', 'wallet.chart': 'Where my coins came from and went',
    'progress.title': 'My Progress', 'progress.badges': 'Badges', 'progress.pillars': 'What I am learning',
    'today': 'Today', 'days_ago': '{n} days ago', 'yesterday': 'Yesterday',
    'coin.one': 'coin', 'coin.many': 'coins',
    'level.market_visitor': 'Market Visitor', 'level.market_helper': 'Market Helper', 'level.stall_keeper': 'Stall Keeper',
    'level.market_star': 'Market Star', 'level.pride_trader': 'Pride Trader',
    'badge.first_coins': 'First Coins', 'badge.kind_friend': 'Kind Friend', 'badge.early_bird': 'Early Bird',
    'badge.hard_worker': 'Hard Worker', 'badge.smart_sorter': 'Smart Sorter', 'badge.smart_saver': 'Smart Saver',
    'badge.market_explorer': 'Market Explorer', 'badge.pride_star': 'Pride Star',
    'history.market_walk': 'Market walk', 'history.tidy_bonus': 'Tidy bonus', 'history.saved': 'Saved in my jar',
    'history.sticker': 'Sun sticker', 'history.daily': 'Market day', 'history.helping': 'Helping at the stall',
    'history.lost_coins': 'The Lost Coins', 'history.lost_coins_bonus': 'Perfect sorting', 'history.found': 'Coins I found', 'history.earlier': 'Earlier',
    'cat.missions': 'Games', 'cat.bonus': 'Bonus', 'cat.daily': 'Market day', 'cat.treats': 'Treats', 'cat.savings': 'Saved',
    'pillar.know': 'Know', 'pillar.understand': 'Understand', 'pillar.decide': 'Decide', 'pillar.invest': 'Invest', 'pillar.share': 'Share',
    'voice.pending': 'Recording pending', 'voice.scratch': 'Scratch voice', 'voice.tap_replay': 'Tap ↻ to listen',
    'empty.home': "Let's find some coins!", 'empty.wallet': 'Play The Lost Coins to fill your jar!', 'empty.play': 'Play',
    'empty.progress': 'Play to earn your first badge!', 'empty.daily': 'Play a game to light the first sun!',
    'empty.pillars': 'Play to start learning!',
    'gate.pin_confirm': 'Enter the PIN again', 'gate.pin_mismatch': "Those PINs don't match. Let's try again.",
    'review.title': 'Reviewer menu', 'review.intro': 'For the client and design team. Children never see this menu.',
    'review.region': 'Region', 'review.voice': 'Voice language', 'review.voice_auto': 'Auto', 'review.recorded': 'Recordings',
    'review.jump': 'Jump to screen', 'review.sound': 'Sound', 'review.notes': 'Show screen notes', 'review.notes_label': 'Screen notes:',
    'review.restart': 'Restart prototype', 'review.sample': 'Load sample data',
    'review.memory_only': 'This browser is not keeping progress (private mode or storage blocked). It lasts until the tab closes.',
    'review.voice_counts': '{lang}: recorded {r} · scratch {s} · pending {p}',
    'review.build': 'Prototype v{v} · built {d}{c} · tokens {t}', 'review.close': 'Close', 'review.not_wired': 'Not in this prototype',
    'a11y.main_nav': 'Main navigation', 'a11y.kudi': 'Kudi the Cub', 'a11y.listen': 'Listen again', 'a11y.replay': 'Replay what Kudi said', 'a11y.back': 'Back',
    'a11y.delete': 'Delete', 'a11y.clear': 'Clear', 'a11y.minus': 'minus', 'a11y.name': 'Name',
    'a11y.age': 'Age {age}', 'a11y.age_soon': 'Age {age}, coming soon', 'a11y.friend': 'Friend {n}', 'a11y.your_friend': 'Your friend',
    'a11y.xp': '{xp} XP', 'a11y.daily': 'Market day, {n} of {goal}', 'a11y.yes_help': 'Yes, I will help',
    'a11y.market_scene': 'A market-day park with stalls', 'a11y.market_stall': 'A market stall',
    'a11y.find_scene': 'Market scene. Find {total} coins.', 'a11y.found_of': '{n} of {total} coins found',
    'a11y.coins_to_sort': 'Coins to sort', 'a11y.jar_for': 'Jar for {coin}', 'a11y.coins_of': '{region} coins',
    'a11y.pin_of': '{n} of 4 digits', 'a11y.savings_jar': 'Savings jar', 'a11y.treat_sticker': 'Treat sticker',
    'a11y.history': 'History', 'a11y.level_path': 'Level path', 'a11y.level': 'Level {n}: {name}', 'a11y.locked': '(locked)',
    'a11y.not_earned': '(not yet earned)'
  },
  /* Per-region visible-label overrides (003 FR-033/FR-034). */
  strings_gh: { 'history.sticker': 'Kelewele sticker' },
  strings_ng: { 'history.sticker': 'Puff-puff sticker' },
  strings_uk: { 'history.sticker': 'Biscuit sticker' }
};

/* Reviewer "Load sample data" (004 FR-029, data-model §5): a fixed fictional log; `ago` = days before today.
   It derives to coins 120, savings 40, XP 360 (level 2), 3 badges, 6 history rows and some pillar progress. */
KC.sample = {
  profile: { nickname: 'Ama', avatarId: 'cub-friend-2' },
  events: [
    { t: 'earn', n: 100, ago: 3, label: 'history.market_walk' },
    { t: 'daily', n: 10, ago: 3, label: 'history.daily' },
    { t: 'xp', n: 360, ago: 3, label: 'xp' },
    { t: 'badge', n: 0, ago: 3, label: 'badge', badge: 'badge.first_coins' },
    { t: 'earn', n: 50, ago: 2, label: 'history.helping' },
    { t: 'badge', n: 0, ago: 2, label: 'badge', badge: 'badge.kind_friend' },
    { t: 'bonus', n: 15, ago: 1, label: 'history.tidy_bonus' },
    { t: 'save', n: 40, ago: 1, label: 'history.saved' },
    { t: 'badge', n: 0, ago: 1, label: 'badge', badge: 'badge.early_bird' },
    { t: 'spend', n: 15, ago: 0, label: 'history.sticker' },
    { t: 'pillar', n: 30, ago: 1, label: 'pillar', pillar: 'know' },
    { t: 'pillar', n: 20, ago: 1, label: 'pillar', pillar: 'understand' },
    { t: 'pillar', n: 10, ago: 1, label: 'pillar', pillar: 'decide' },
    { t: 'pillar', n: 10, ago: 1, label: 'pillar', pillar: 'share' }
  ]
};
