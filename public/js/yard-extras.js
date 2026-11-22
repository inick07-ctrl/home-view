// PeakStead Designs — pool/solar/fireplace/septic/well metadata used by the cost estimator and Builder
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
  // Fireplaces — rough installed cost (mid tier, national average) before tier/location multipliers.
  fpMasonry36: { category: 'fireplace', cost: 15000 },
  fpMasonry42: { category: 'fireplace', cost: 18000 },
  fpMasonry48: { category: 'fireplace', cost: 22000 },
  fpLinear48: { category: 'fireplace', cost: 7500 },
  fpLinear60: { category: 'fireplace', cost: 9500 },
  fpLinear72: { category: 'fireplace', cost: 12000 },
  fpStoneTrad: { category: 'fireplace', cost: 26000 },
  fpStoneLinear: { category: 'fireplace', cost: 21000 },
  fpFarmhouse36: { category: 'fireplace', cost: 10000 },
  fpFarmhouse42: { category: 'fireplace', cost: 11000 },
  fpSeeThrough: { category: 'fireplace', cost: 24000 },
  fpStove: { category: 'fireplace', cost: 5500 },
  fpMidCentury: { category: 'fireplace', cost: 8000 },
  // Septic + well — ROUGH placeholders; soils, perc tests, mound vs. trench and well depth swing these a lot.
  septicTank1000: { category: 'site', septic: true, cost: 4000 },
  septicTank1250: { category: 'site', septic: true, cost: 4800 },
  septicTank1500: { category: 'site', septic: true, cost: 5600 },
  drainFieldSmall: { category: 'site', septic: true, cost: 7000 },
  drainFieldMedium: { category: 'site', septic: true, cost: 10000 },
  drainFieldLarge: { category: 'site', septic: true, cost: 14000 },
  well: { category: 'site', well: true, cost: 15000 },
};

export function extrasFromItems(items) {
  let poolSf = 0, spaCount = 0, solarKw = 0;
  let fireplaceCost = 0, fireplaceCount = 0, septicCost = 0, wellCost = 0, wellCount = 0;
  for (const it of items || []) {
    const t = YARD_ITEM_META[it.type];
    if (!t) continue;
    if (t.category === 'pool') {
      if (t.spa) spaCount += 1;
      else poolSf += Math.max(0, (it.w || t.w || 0) * (it.d || t.d || 0));
    }
    if (t.category === 'solar') solarKw += t.kw || ((t.panels || 0) * 0.4);
    if (t.category === 'fireplace') { fireplaceCost += t.cost || 0; fireplaceCount += 1; }
    if (t.septic) septicCost += t.cost || 0;
    if (t.well) { wellCost += t.cost || 0; wellCount += 1; }
  }
  return { poolSf, spaCount, solarKw, fireplaceCost, fireplaceCount, septicCost, wellCost, wellCount };
}
