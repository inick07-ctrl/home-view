// PeakStead Designs — pool/solar metadata used by the cost estimator and Builder
// (kept free of three.js so it can load on pages without an import map).

export const YARD_ITEM_META = {
  poolPlunge: { category: 'pool', w: 11.2, d: 15.2 },
  poolSmall: { category: 'pool', w: 15.2, d: 27.2 },
  poolMedium: { category: 'pool', w: 20, d: 36 },
  poolLarge: { category: 'pool', w: 24, d: 44 },
  poolKidney: { category: 'pool', w: 20.8, d: 36.8 },
  hotTub: { category: 'pool', spa: true, w: 10.6, d: 10.6 },
  solarRoof6: { category: 'solar', panels: 6, kw: 2.4 },
  solarRoof12: { category: 'solar', panels: 12, kw: 4.8 },
  solarRoof20: { category: 'solar', panels: 20, kw: 8.0 },
  solarRoof30: { category: 'solar', panels: 30, kw: 12.0 },
  solarGround8: { category: 'solar', panels: 8, kw: 3.2 },
  solarGround12: { category: 'solar', panels: 12, kw: 4.8 },
  solarGround20: { category: 'solar', panels: 20, kw: 8.0 },
};

export function extrasFromItems(items) {
  let poolSf = 0, spaCount = 0, solarKw = 0;
  for (const it of items || []) {
    const t = YARD_ITEM_META[it.type];
    if (!t) continue;
    if (t.category === 'pool') {
      if (t.spa) spaCount += 1;
      else poolSf += Math.max(0, (it.w || t.w || 0) * (it.d || t.d || 0));
    }
    if (t.category === 'solar') solarKw += t.kw || ((t.panels || 0) * 0.4);
  }
  return { poolSf, spaCount, solarKw };
}
