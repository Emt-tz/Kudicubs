/* KudiCubs prototype — 13–15 mission data: "Side hustle simulator, first sale" (docs/design/mission-extracts/13-15.md).
   Budget (how many to make) then Market (price). Profit and loss, margin, budget left. A loss is explained, never judged;
   Try again keeps everything earned. Product name from KC.regions[...].marketExamples; coins drawn by KC.money. */
(function () {
  'use strict';
  var KC = window.KC = window.KC || {};
  KC.missions = KC.missions || {};
  var BUDGET = 100, UNIT = 4;
  var DEMAND = { 6: 25, 9: 15, 12: 6 };
  KC.missions.m13 = {
    id: 'm13', band: 'b13_15', titleKey: 'm13.title', icon: 'badge-hard-worker', scene: 'scenes/stall.svg',
    intro: { line: 'm13.intro.say', facts: [{ icon: 'wallet-jar', labelKey: 'm13.fact_budget', money: BUDGET }, { icon: 'goal-coins', labelKey: 'm13.fact_unit', money: UNIT }] },
    steps: [{
      route: 'm13-budget', key: 'batch', line: 'm13.budget.say', hint: 'm13.budget.hint', promptKey: 'm13.budget.prompt',
      factsFn: function () { return [{ icon: 'wallet-jar', labelKey: 'm13.fact_budget', money: BUDGET }, { icon: 'goal-coins', labelKey: 'm13.fact_unit', money: UNIT }]; },
      options: function () {
        var d = KC.region().marketExamples.drink.label;
        return [10, 20, 25].map(function (n) {
          return { id: String(n), icon: 'goal-coins', labelKey: 'm13.batch', vars: { n: n, what: d }, subKey: 'm13.batch_sub', cost: n * UNIT };
        });
      }
    }, {
      route: 'm13-market', key: 'price', goKey: 'm.see', line: 'm13.market.say', hint: 'm13.market.hint', promptKey: 'm13.market.prompt',
      factsFn: function (sel) { return [{ icon: 'wallet-jar', labelKey: 'm13.fact_left', money: BUDGET - (Number(sel.batch) || 20) * UNIT }]; },
      options: function () {
        return [6, 9, 12].map(function (p) { return { id: String(p), icon: 'goal-coins', money: p, subKey: 'm13.price_sub', vars: { d: DEMAND[p] } }; });
      }
    }],
    retryTo: 'm13-budget',
    demo: { poor: { batch: '25', price: '12' }, good: { batch: '20', price: '9' } },
    evaluate: function (sel) {
      var batch = Number(sel.batch) || 20, price = Number(sel.price) || 9;
      var sold = Math.min(batch, DEMAND[price] || 15), rev = sold * price, costs = batch * UNIT, profit = rev - costs;
      var margin = rev ? Math.round(100 * profit / rev) : 0;
      var score = profit <= 0 ? 'poor' : (profit >= 50 ? 'great' : 'ok');
      return {
        score: score, line: { great: 'm13.result.great', ok: 'm13.result.ok', poor: 'm13.result.loss' }[score],
        titleKey: 'm13.res_title_' + score, explainKey: 'm13.res_text_' + score,
        rows: [{ icon: 'goal-coins', labelKey: 'm13.row_revenue', n: rev, sub: { key: 'm13.row_sold', vars: { sold: sold, made: batch } } },
               { icon: 'treat-sticker', labelKey: 'm13.row_costs', n: -costs },
               { icon: 'save', labelKey: profit < 0 ? 'm13.row_loss' : 'm13.row_profit', n: profit },
               { icon: 'path', labelKey: 'm13.row_margin', text: margin + '%' },
               { icon: 'wallet-jar', labelKey: 'm13.row_left', n: BUDGET - costs }],
        meter: { labelKey: 'm13.meter', value: costs, max: BUDGET }
      };
    },
    summary: { line: 'm13.summary.say', tiles: [{ icon: 'treat-sticker', textKey: 'm13.sum_1' }, { icon: 'goal-coins', textKey: 'm13.sum_2' }, { icon: 'save', textKey: 'm13.sum_3' }] },
    reward: { coins: 80, xp: 120, badge: 'badge.pride_star', bonusCoins: 10, pillars: { decide: 20, invest: 15, know: 10 }, replayXp: 5 }
  };
})();
