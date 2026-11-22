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
  // Fireplaces — rough installed cost = style/size SURROUND (mantel, facing, framing) + FUEL SYSTEM (see FIREPLACE_FUEL).
  // `sys` picks the fuel-system class: 'open' masonry/built-in firebox, 'two' two-sided, 'stove' freestanding.
  fpMasonry36: { category: 'fireplace', label: 'Masonry 36"', surround: 3000, sys: 'open' },
  fpMasonry42: { category: 'fireplace', label: 'Masonry 42"', surround: 3800, sys: 'open' },
  fpMasonry48: { category: 'fireplace', label: 'Masonry 48"', surround: 5000, sys: 'open', large: true },
  fpLinear48: { category: 'fireplace', label: 'Linear 48"', surround: 2500, sys: 'open' },
  fpLinear60: { category: 'fireplace', label: 'Linear 60"', surround: 3000, sys: 'open', large: true },
  fpLinear72: { category: 'fireplace', label: 'Linear 72"', surround: 3600, sys: 'open', large: true },
  fpStoneTrad: { category: 'fireplace', label: 'Floor-to-ceiling stone 42"', surround: 9000, sys: 'open' },
  fpStoneLinear: { category: 'fireplace', label: 'Floor-to-ceiling stone 60"', surround: 8000, sys: 'open', large: true },
  fpFarmhouse36: { category: 'fireplace', label: 'Farmhouse shiplap 36"', surround: 2500, sys: 'open' },
  fpFarmhouse42: { category: 'fireplace', label: 'Farmhouse shiplap 42"', surround: 2900, sys: 'open' },
  fpSeeThrough: { category: 'fireplace', label: 'Two-sided see-through 48"', surround: 5000, sys: 'two' },
  fpStove: { category: 'fireplace', label: 'Freestanding stove', surround: 0, sys: 'stove' },
  fpMidCentury: { category: 'fireplace', label: 'Mid-century low horizontal', surround: 3000, sys: 'open', large: true },
  fpOldWorld60: { category: 'fireplace', label: 'Old-world limestone 60"', surround: 18000, sys: 'open', large: true },
  fpOldWorld72: { category: 'fireplace', label: 'Old-world limestone 72"', surround: 22000, sys: 'open', large: true },
  // Septic + well — ROUGH placeholders; soils, perc tests, mound vs. trench and well depth swing these a lot.
  septicTank1000: { category: 'site', septic: true, cost: 4000 },
  septicTank1250: { category: 'site', septic: true, cost: 4800 },
  septicTank1500: { category: 'site', septic: true, cost: 5600 },
  drainFieldSmall: { category: 'site', septic: true, cost: 7000 },
  drainFieldMedium: { category: 'site', septic: true, cost: 10000 },
  drainFieldLarge: { category: 'site', septic: true, cost: 14000 },
  well: { category: 'site', well: true, cost: 15000 },
};

// Rough fuel-system costs (mid tier, national, installed, before tier/location multipliers). Sources, read Nov 2026:
// - Wood-burning masonry fireplace $8k–$30k installed, ~$18k typical; chimney $2.5k–$12k (avg ~$6k); firebox
//   $2k–$5k; smoke chamber/damper $0.8k–$1.5k; hearth $0.5k–$2.5k; permits $150–$1k
//   (danburyrenovation.com/cost-build-wood-burning-fireplace, hammerio.com/blog/fireplace-installation-cost).
//   Wood-burning stove/insert $2.5k–$6k installed (hammerio.com).
// - Electric: built-in install $1k–$3.5k + unit (electricfireplacesdirect.com); 50–60" linear unit $0.9k–$4k
//   (noremcontracting.com); dedicated 120V/20A circuit $250–$900, permit $50–$85 (HomeGuide via mdlelectricllc.com,
//   electricianhelpnow.com); freestanding unit $200–$1.5k + outlet $150–$350 (HomeGuide).
export const FIREPLACE_FUEL = {
  wood: { label: 'wood-burning', open: 12000, openLarge: 14000, two: 16000, stove: 5500 }, // firebox + damper + chimney/flue/liner/cap + hearth ext. + permit
  electric: { label: 'electric', open: 1900, openLarge: 3000, two: 3500, stove: 900 },     // insert/unit + install + dedicated circuit + permit
};
export const FIREPLACE_DEFAULT_FUEL = {
  fpMasonry36: 'wood', fpMasonry42: 'wood', fpMasonry48: 'wood', fpStoneTrad: 'wood', fpStove: 'wood', fpOldWorld60: 'wood', fpOldWorld72: 'wood',
  fpLinear48: 'electric', fpLinear60: 'electric', fpLinear72: 'electric', fpStoneLinear: 'electric', fpFarmhouse36: 'electric', fpFarmhouse42: 'electric',
  fpSeeThrough: 'electric', fpMidCentury: 'electric',
};
export function fireplaceCostOf(it) {
  const t = YARD_ITEM_META[it?.type];
  if (!t || t.category !== 'fireplace') return null;
  const fuel = it.fuel === 'electric' || it.fuel === 'wood' ? it.fuel : (FIREPLACE_DEFAULT_FUEL[it.type] || 'wood');
  const F = FIREPLACE_FUEL[fuel];
  const sys = t.sys === 'open' && t.large ? F.openLarge : F[t.sys] ?? F.open;
  return { fuel, surround: t.surround || 0, system: sys, cost: (t.surround || 0) + sys, label: `Fireplace — ${t.label} (${F.label}, rough)` };
}

export function extrasFromItems(items) {
  let poolSf = 0, spaCount = 0, solarKw = 0;
  let fireplaceCost = 0, fireplaceCount = 0, fireplaceRough = true; const fireplaceLines = []; let septicCost = 0, wellCost = 0, wellCount = 0;
  for (const it of items || []) {
    const t = YARD_ITEM_META[it.type];
    if (!t) continue;
    if (t.category === 'pool') {
      if (t.spa) spaCount += 1;
      else poolSf += Math.max(0, (it.w || t.w || 0) * (it.d || t.d || 0));
    }
    if (t.category === 'solar') solarKw += t.kw || ((t.panels || 0) * 0.4);
    if (t.category === 'fireplace') { const fc = fireplaceCostOf(it); fireplaceCost += fc.cost; fireplaceCount += 1; fireplaceLines.push({ label: fc.label, cost: fc.cost, fuel: fc.fuel }); }
    if (t.septic) septicCost += t.cost || 0;
    if (t.well) { wellCost += t.cost || 0; wellCount += 1; }
  }
  return { poolSf, spaCount, solarKw, fireplaceCost, fireplaceCount, fireplaceRough, fireplaceLines, septicCost, wellCost, wellCount };
}
