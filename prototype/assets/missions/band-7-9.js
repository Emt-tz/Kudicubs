/* KudiCubs prototype — 7–9 mission data: "Budget for your birthday party" (docs/design/mission-extracts/7-9.md).
   Built only from the six screen types by the band-mission engine in screens-bands.js. Words live in mock-data.js;
   spoken lines in docs/design/narration/lines.json. Every example name comes from KC.regions[...].marketExamples and every
   coin is drawn by KC.money, so nothing here names a currency. Numbers are game coins, not money (Constitution V). */
(function () {
  'use strict';
  var KC = window.KC = window.KC || {};
  KC.missions = KC.missions || {};
  var BUDGET = 60;
  var PLANS = { fancy: 70, smart: 45, simple: 30 };       // the deck's example: drinks at 10 or 50, cake at 20 (coins here)
  KC.missions.m7 = {
    id: 'm7', band: 'b7_9', titleKey: 'm7.title', icon: 'piggy', scene: 'scenes/market-park.svg',
    intro: { line: 'm7.intro.say', facts: [{ icon: 'wallet-jar', labelKey: 'm7.fact_budget', money: BUDGET }] },
    steps: [{
      route: 'm7-decision', key: 'plan', goKey: 'm.see', line: 'm7.decide.say', hint: 'm7.decide.hint', promptKey: 'm7.decide.prompt', kudi: true,
      factsFn: function () { return [{ icon: 'wallet-jar', labelKey: 'm7.fact_budget', money: BUDGET }]; },
      options: function () {
        var ex = KC.region().marketExamples;
        return [
          { id: 'fancy', icon: 'treat-sticker', labelKey: 'm7.plan_fancy', subKey: 'm7.plan_fancy_sub', vars: { cake: ex.cake.label, drink: ex.drink.label }, cost: PLANS.fancy },
          { id: 'smart', icon: 'piggy', labelKey: 'm7.plan_smart', subKey: 'm7.plan_smart_sub', vars: { cake: ex.cake.label, drink: ex.drink.label, snack: ex.snack.label }, cost: PLANS.smart },
          { id: 'simple', icon: 'goal-coins', labelKey: 'm7.plan_simple', subKey: 'm7.plan_simple_sub', vars: { cake: ex.cake.label, drink: ex.drink.label }, cost: PLANS.simple }
        ];
      }
    }],
    retryTo: 'm7-decision',
    demo: { poor: { plan: 'fancy' }, good: { plan: 'smart' } },
    evaluate: function (sel) {
      var cost = PLANS[sel.plan] || PLANS.smart, left = BUDGET - cost;
      var score = left < 0 ? 'poor' : (left <= 20 ? 'great' : 'ok');
      return {
        score: score, line: { great: 'm7.result.great', ok: 'm7.result.ok', poor: 'm7.result.over' }[score],
        titleKey: 'm7.res_title_' + score, explainKey: 'm7.res_text_' + score,
        rows: [{ icon: 'wallet-jar', labelKey: 'm7.row_budget', n: BUDGET }, { icon: 'treat-sticker', labelKey: 'm7.row_cost', n: -cost },
               { icon: 'save', labelKey: 'm7.row_left', n: left }],
        meter: { labelKey: 'm7.meter', value: cost, max: BUDGET }
      };
    },
    summary: { line: 'm7.summary.say', tiles: [{ icon: 'wallet-jar', textKey: 'm7.sum_1' }, { icon: 'goal-coins', textKey: 'm7.sum_2' }, { icon: 'replay', textKey: 'm7.sum_3' }] },
    reward: { coins: 40, xp: 60, badge: 'badge.smart_saver', bonusCoins: 10, pillars: { know: 15, decide: 20 }, replayXp: 5 }
  };
})();
