/* KudiCubs prototype — 10–12 mission data: "Secure start-up funding for a clothing brand" (docs/design/mission-extracts/10-12.md).
   Resource Management (how to raise the money) then Market Simulation (one month, price). Light time cue: weeks 1 to 4,
   never ends the round. Names from KC.regions[...].marketExamples, coins drawn by KC.money. Game coins, not money. */
(function () {
  'use strict';
  var KC = window.KC = window.KC || {};
  KC.missions = KC.missions || {};
  var COST_EACH = 2, NEED = 100;
  var FUNDS = { loan: { cap: 40, repay: 10 }, investor: { cap: 40, share: 0.2 }, savings: { cap: 20 } };
  var DEMAND = { 3: 40, 5: 28, 8: 10 };
  KC.missions.m10 = {
    id: 'm10', band: 'b10_12', titleKey: 'm10.title', icon: 'goal-coins', scene: 'scenes/stall.svg',
    intro: { line: 'm10.intro.say', facts: [{ icon: 'wallet-jar', labelKey: 'm10.fact_need', money: NEED }] },
    steps: [{
      route: 'm10-resource', key: 'funding', line: 'm10.resource.say', hint: 'm10.resource.hint', promptKey: 'm10.resource.prompt',
      factsFn: function () { return [{ icon: 'wallet-jar', labelKey: 'm10.fact_need', money: NEED }]; },
      options: function () {
        return [
          { id: 'loan', icon: 'wallet-jar', labelKey: 'm10.fund_loan', subKey: 'm10.fund_loan_sub', money: 100 },
          { id: 'investor', icon: 'badge-pride-star', labelKey: 'm10.fund_investor', subKey: 'm10.fund_investor_sub', money: 100 },
          { id: 'savings', icon: 'save', labelKey: 'm10.fund_savings', subKey: 'm10.fund_savings_sub', money: 50 }
        ];
      }
    }, {
      route: 'm10-market', key: 'price', goKey: 'm.see', line: 'm10.market.say', hint: 'm10.market.hint', promptKey: 'm10.market.prompt', weeks: true,
      factsFn: function () { return [{ icon: 'path', labelKey: 'm10.fact_made', textFn: function (sel) { return String((FUNDS[sel.funding] || FUNDS.loan).cap); }, vars: { what: KC.region().marketExamples.clothes.label } }]; },
      options: function () {
        return [
          { id: '3', icon: 'goal-coins', money: 3, subKey: 'm10.price_3_sub', vars: { d: DEMAND[3] } },
          { id: '5', icon: 'goal-coins', money: 5, subKey: 'm10.price_5_sub', vars: { d: DEMAND[5] } },
          { id: '8', icon: 'goal-coins', money: 8, subKey: 'm10.price_8_sub', vars: { d: DEMAND[8] } }
        ];
      }
    }],
    retryTo: 'm10-resource',
    demo: { poor: { funding: 'loan', price: '8' }, good: { funding: 'savings', price: '5' } },
    evaluate: function (sel) {
      var f = FUNDS[sel.funding] || FUNDS.loan, price = Number(sel.price) || 5;
      var sold = Math.min(f.cap, DEMAND[price] || 28), made = f.cap, rev = sold * price, prod = made * COST_EACH, pre = rev - prod;
      var fin = f.repay ? f.repay : (f.share ? Math.round(f.share * Math.max(0, pre)) : 0), net = pre - fin;
      var score = net <= 0 || net < 25 ? 'poor' : (net >= 50 ? 'great' : 'ok');
      return {
        score: score, line: { great: 'm10.result.great', ok: 'm10.result.ok', poor: 'm10.result.slow' }[score],
        titleKey: 'm10.res_title_' + score, explainKey: 'm10.res_text_' + score, explainVars: { fund: sel.funding || 'loan' },
        rows: [{ icon: 'goal-coins', labelKey: 'm10.row_sales', n: rev, sub: { key: 'm10.row_sales_sub', vars: { sold: sold, made: made } } },
               { icon: 'treat-sticker', labelKey: 'm10.row_making', n: -prod },
               { icon: 'wallet-jar', labelKey: 'm10.row_money_' + (sel.funding || 'loan'), n: -fin },
               { icon: 'save', labelKey: net < 0 ? 'm10.row_loss' : 'm10.row_net', n: net }],
        meter: { labelKey: 'm10.meter', value: sold, max: made }
      };
    },
    summary: { line: 'm10.summary.say', tiles: [{ icon: 'wallet-jar', textKey: 'm10.sum_1' }, { icon: 'badge-pride-star', textKey: 'm10.sum_2' }, { icon: 'save', textKey: 'm10.sum_3' }] },
    reward: { coins: 60, xp: 90, badge: 'badge.market_explorer', bonusCoins: 10, pillars: { understand: 15, invest: 20, decide: 10 }, replayXp: 5 }
  };
})();
