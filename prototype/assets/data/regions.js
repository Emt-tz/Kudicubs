/* KudiCubs prototype — region coin sets (spec 002 data-model §7, research D7).
   Coins are stylised tokens, not replicas of real money. Switching region changes presentation only. */
window.KC = window.KC || {};

KC.defaultRegion = 'gh';

KC.regions = {
  gh: {
    code: 'gh', name: 'Ghana',
    currency: { iso: 'GHS', symbol: 'GH₵', majorName: 'cedi', majorPlural: 'cedis', minorName: 'pesewa', minorPlural: 'pesewas' },
    voiceLang: 'en-GH',
    coinIcon: 'ghs1',
    denominations: [
      { id: 'p10', kind: 'coin', label: '10 pesewas', faceValueMinor: 10, accent: 'gold-500' },
      { id: 'p20', kind: 'coin', label: '20 pesewas', faceValueMinor: 20, accent: 'gold-500' },
      { id: 'p50', kind: 'coin', label: '50 pesewas', faceValueMinor: 50, accent: 'terracotta-600' },
      { id: 'ghs1', kind: 'coin', label: '1 cedi', faceValueMinor: 100, accent: 'gold-600' },
      { id: 'ghs2', kind: 'coin', label: '2 cedis', faceValueMinor: 200, accent: 'gold-600' },
      { id: 'ghs5-note', kind: 'note', label: '5 cedis', faceValueMinor: 500, accent: 'green-700' }
    ],
    lostCoinsSet: ['p10', 'p50', 'ghs1'],
    marketExamples: {
      treat: { label: 'kelewele', art: 'treat-sticker' },
      drink: { label: 'sobolo', art: 'goal-coins' },
      snack: { label: 'groundnuts', art: 'goal-coins' }
    }
  },
  ng: {
    code: 'ng', name: 'Nigeria',
    currency: { iso: 'NGN', symbol: '₦', majorName: 'naira', majorPlural: 'naira', minorName: 'kobo', minorPlural: 'kobo' },
    voiceLang: 'en-NG',
    coinIcon: 'ngn1',
    denominations: [
      { id: 'k50', kind: 'coin', label: '50 kobo', faceValueMinor: 50, accent: 'terracotta-600' },
      { id: 'ngn1', kind: 'coin', label: '1 naira', faceValueMinor: 100, accent: 'gold-500' },
      { id: 'ngn2', kind: 'coin', label: '2 naira', faceValueMinor: 200, accent: 'gold-600' },
      { id: 'ngn5-note', kind: 'note', label: '5 naira', faceValueMinor: 500, accent: 'green-700' },
      { id: 'ngn10-note', kind: 'note', label: '10 naira', faceValueMinor: 1000, accent: 'green-700' }
    ],
    lostCoinsSet: ['k50', 'ngn1', 'ngn2'],
    marketExamples: {
      treat: { label: 'puff-puff', art: 'treat-sticker' },
      drink: { label: 'zobo', art: 'goal-coins' },
      snack: { label: 'chin-chin', art: 'goal-coins' }
    }
  },
  uk: {
    code: 'uk', name: 'United Kingdom',
    currency: { iso: 'GBP', symbol: '£', majorName: 'pound', majorPlural: 'pounds', minorName: 'penny', minorPlural: 'pence' },
    voiceLang: 'en-GB',
    coinIcon: 'gbp1',
    denominations: [
      { id: 'p10', kind: 'coin', label: '10 pence', faceValueMinor: 10, accent: 'gold-500' },
      { id: 'p20', kind: 'coin', label: '20 pence', faceValueMinor: 20, accent: 'gold-500' },
      { id: 'p50', kind: 'coin', label: '50 pence', faceValueMinor: 50, accent: 'gold-500' },
      { id: 'gbp1', kind: 'coin', label: '1 pound', faceValueMinor: 100, accent: 'gold-600' },
      { id: 'gbp2', kind: 'coin', label: '2 pounds', faceValueMinor: 200, accent: 'gold-600' },
      { id: 'gbp5-note', kind: 'note', label: '5 pounds', faceValueMinor: 500, accent: 'green-700' }
    ],
    lostCoinsSet: ['p10', 'p50', 'gbp1'],
    marketExamples: {
      treat: { label: 'biscuit', art: 'treat-sticker' },
      drink: { label: 'lemonade', art: 'goal-coins' },
      snack: { label: 'crisps', art: 'goal-coins' }
    }
  }
};
