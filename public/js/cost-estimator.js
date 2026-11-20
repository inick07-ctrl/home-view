// PeakStead local-rate build cost estimator (2025–2026 US benchmarks).
// Land is never included. Figures are planning ranges, not bids.

export const LS_ZIP = 'peakstead-cost-zip';
export const LS_TIER = 'peakstead-cost-tier';

export const TIERS = [
  { id: 'economy', label: 'Economy', short: 'Builder', factor: 0.82 },
  { id: 'standard', label: 'Mid-Range', short: 'Mid-Range', factor: 1.00 },
  { id: 'custom', label: 'Custom', short: 'High-End', factor: 1.38 },
];

// National mid-range (standard) turnkey construction $/sf, 2026 planning rates.
// Home: Autodesk / NAHB-adjacent median ~$166 in 2025, rounded up for 2026.
// Tiny: higher $/sf from fixed kitchens/baths (typically $150–$400).
// A-frame: usually a bit under stick-built ($100–$300, mid ~$165).
// Trailer / manufactured: ~$101/sf unit + site/setup (~$110 mid).
// ADU: typically 20–35% above a comparable house $/sf.
export const HEATED_RATE = { home: 180, tiny: 280, aframe: 165, trailer: 110, adu: 225 };
export const GARAGE_RATE = 60; // attached garage mid ($35–$70 typical)
export const PORCH_RATE = 70;  // covered porch / deck mid ($40–$120)

/** Typical 2025–2026 US planning rates, land excluded. Pool is in-ground $/sf of footprint; spa is a lump sum; solar is $/W DC. */
export const POOL_RATE = 85;
export const SPA_COST = 12500;
export const SOLAR_PER_WATT = 3.00;


// Allocation of the heated-structure cost, adapted from NAHB 2024 Cost of
// Constructing a Home (shares of construction cost, land excluded).
export const BREAKDOWN = [
  { id: 'foundation', label: 'Foundation & Site Prep', pct: 0.12 },
  { id: 'framing', label: 'Framing & Lumber', pct: 0.17 },
  { id: 'envelope', label: 'Roofing & Siding', pct: 0.10 },
  { id: 'openings', label: 'Windows & Doors', pct: 0.04 },
  { id: 'mep', label: 'Plumbing / HVAC / Electrical', pct: 0.19 },
  { id: 'drywall', label: 'Insulation & Drywall', pct: 0.05 },
  { id: 'interior', label: 'Interior Finishes & Cabinetry', pct: 0.19 },
  { id: 'soft', label: 'Permits, Soft Costs & Contingency', pct: 0.14 },
];

const STATES = {
  AL: { name: 'Alabama', mult: 0.85 },
  AK: { name: 'Alaska', mult: 1.38 },
  AZ: { name: 'Arizona', mult: 0.98 },
  AR: { name: 'Arkansas', mult: 0.84 },
  CA: { name: 'California', mult: 1.26 },
  CO: { name: 'Colorado', mult: 1.08 },
  CT: { name: 'Connecticut', mult: 1.22 },
  DE: { name: 'Delaware', mult: 1.08 },
  DC: { name: 'District of Columbia', mult: 1.26 },
  FL: { name: 'Florida', mult: 0.98 },
  GA: { name: 'Georgia', mult: 0.92 },
  HI: { name: 'Hawaii', mult: 1.55 },
  ID: { name: 'Idaho', mult: 0.96 },
  IL: { name: 'Illinois', mult: 1.08 },
  IN: { name: 'Indiana', mult: 0.94 },
  IA: { name: 'Iowa', mult: 0.92 },
  KS: { name: 'Kansas', mult: 0.90 },
  KY: { name: 'Kentucky', mult: 0.88 },
  LA: { name: 'Louisiana', mult: 0.90 },
  ME: { name: 'Maine', mult: 1.05 },
  MD: { name: 'Maryland', mult: 1.10 },
  MA: { name: 'Massachusetts', mult: 1.28 },
  MI: { name: 'Michigan', mult: 0.98 },
  MN: { name: 'Minnesota', mult: 1.00 },
  MS: { name: 'Mississippi', mult: 0.82 },
  MO: { name: 'Missouri', mult: 0.92 },
  MT: { name: 'Montana', mult: 1.00 },
  NE: { name: 'Nebraska', mult: 0.90 },
  NV: { name: 'Nevada', mult: 1.02 },
  NH: { name: 'New Hampshire', mult: 1.10 },
  NJ: { name: 'New Jersey', mult: 1.22 },
  NM: { name: 'New Mexico', mult: 0.92 },
  NY: { name: 'New York', mult: 1.28 },
  NC: { name: 'North Carolina', mult: 0.92 },
  ND: { name: 'North Dakota', mult: 0.95 },
  OH: { name: 'Ohio', mult: 0.95 },
  OK: { name: 'Oklahoma', mult: 0.86 },
  OR: { name: 'Oregon', mult: 1.12 },
  PA: { name: 'Pennsylvania', mult: 1.05 },
  RI: { name: 'Rhode Island', mult: 1.18 },
  SC: { name: 'South Carolina', mult: 0.90 },
  SD: { name: 'South Dakota', mult: 0.92 },
  TN: { name: 'Tennessee', mult: 0.90 },
  TX: { name: 'Texas', mult: 0.92 },
  UT: { name: 'Utah', mult: 1.00 },
  VT: { name: 'Vermont', mult: 1.08 },
  VA: { name: 'Virginia', mult: 1.02 },
  WA: { name: 'Washington', mult: 1.18 },
  WV: { name: 'West Virginia', mult: 0.88 },
  WI: { name: 'Wisconsin', mult: 0.98 },
  WY: { name: 'Wyoming', mult: 0.96 },
  PR: { name: 'Puerto Rico', mult: 0.80 },
};

// [lo, hi, state] inclusive ZIP-3 ranges (USPS sectional centers).
const ZIP3_RANGES = [
  [5, 5, 'NY'], [6, 9, 'PR'], [10, 27, 'MA'], [28, 29, 'RI'], [30, 38, 'NH'],
  [39, 49, 'ME'], [50, 59, 'VT'], [60, 69, 'CT'], [70, 89, 'NJ'],
  [100, 149, 'NY'], [150, 196, 'PA'], [197, 199, 'DE'], [200, 205, 'DC'],
  [206, 219, 'MD'], [220, 246, 'VA'], [247, 268, 'WV'], [270, 289, 'NC'],
  [290, 299, 'SC'], [300, 319, 'GA'], [320, 349, 'FL'], [350, 369, 'AL'],
  [370, 385, 'TN'], [386, 397, 'MS'], [398, 399, 'GA'], [400, 427, 'KY'],
  [430, 459, 'OH'], [460, 479, 'IN'], [480, 499, 'MI'], [500, 528, 'IA'],
  [530, 549, 'WI'], [550, 567, 'MN'], [570, 577, 'SD'], [580, 588, 'ND'],
  [590, 599, 'MT'], [600, 629, 'IL'], [630, 658, 'MO'], [660, 679, 'KS'],
  [680, 693, 'NE'], [700, 714, 'LA'], [716, 729, 'AR'], [730, 749, 'OK'],
  [750, 799, 'TX'], [800, 816, 'CO'], [820, 831, 'WY'], [832, 838, 'ID'],
  [840, 847, 'UT'], [850, 865, 'AZ'], [870, 884, 'NM'], [885, 885, 'TX'],
  [889, 898, 'NV'], [900, 961, 'CA'], [967, 968, 'HI'], [969, 969, 'HI'],
  [970, 979, 'OR'], [980, 994, 'WA'], [995, 999, 'AK'],
];

// Metro / regional overrides: zip3 → { region, multiplier } (absolute vs US avg).
const METRO = {
  // Minnesota — 56362 Paynesville / St. Cloud sits a bit under the national avg.
  '554': { region: 'Minneapolis, MN', mult: 1.08 },
  '551': { region: 'St. Paul, MN', mult: 1.07 },
  '553': { region: 'West Metro, MN', mult: 1.05 },
  '550': { region: 'East Metro, MN', mult: 1.03 },
  '563': { region: 'St. Cloud / Central Minnesota', mult: 0.98 },
  '557': { region: 'Northeast Minnesota', mult: 0.97 },
  '558': { region: 'Duluth, MN', mult: 1.00 },
  '559': { region: 'Rochester, MN', mult: 1.03 },
  '560': { region: 'Southern Minnesota', mult: 0.96 },
  '561': { region: 'Southwest Minnesota', mult: 0.94 },
  '562': { region: 'Western Minnesota', mult: 0.94 },
  '564': { region: 'Brainerd Lakes, MN', mult: 0.96 },
  '565': { region: 'Northwest Minnesota', mult: 0.94 },
  '566': { region: 'Northern Minnesota', mult: 0.93 },
  '567': { region: 'Northwest Minnesota', mult: 0.93 },
  // Major metros
  '100': { region: 'Manhattan, NY', mult: 1.62 },
  '101': { region: 'Manhattan, NY', mult: 1.62 },
  '102': { region: 'Manhattan, NY', mult: 1.62 },
  '103': { region: 'Staten Island, NY', mult: 1.42 },
  '104': { region: 'Bronx, NY', mult: 1.45 },
  '111': { region: 'Queens, NY', mult: 1.48 },
  '112': { region: 'Brooklyn, NY', mult: 1.50 },
  '113': { region: 'Queens, NY', mult: 1.48 },
  '114': { region: 'Queens, NY', mult: 1.48 },
  '116': { region: 'Queens, NY', mult: 1.48 },
  '105': { region: 'Westchester, NY', mult: 1.38 },
  '106': { region: 'Westchester, NY', mult: 1.38 },
  '107': { region: 'Westchester, NY', mult: 1.38 },
  '108': { region: 'Westchester, NY', mult: 1.38 },
  '070': { region: 'Northern New Jersey', mult: 1.28 },
  '071': { region: 'Newark, NJ', mult: 1.26 },
  '073': { region: 'Jersey City, NJ', mult: 1.32 },
  '076': { region: 'Bergen County, NJ', mult: 1.30 },
  '941': { region: 'San Francisco, CA', mult: 1.52 },
  '940': { region: 'Peninsula, CA', mult: 1.48 },
  '943': { region: 'Palo Alto, CA', mult: 1.50 },
  '944': { region: 'San Mateo, CA', mult: 1.46 },
  '945': { region: 'East Bay, CA', mult: 1.38 },
  '946': { region: 'Oakland, CA', mult: 1.40 },
  '947': { region: 'Berkeley, CA', mult: 1.42 },
  '948': { region: 'East Bay, CA', mult: 1.36 },
  '950': { region: 'South Bay, CA', mult: 1.44 },
  '951': { region: 'San Jose, CA', mult: 1.44 },
  '900': { region: 'Los Angeles, CA', mult: 1.32 },
  '901': { region: 'Los Angeles, CA', mult: 1.32 },
  '902': { region: 'West Los Angeles, CA', mult: 1.36 },
  '904': { region: 'Santa Monica, CA', mult: 1.38 },
  '910': { region: 'Pasadena, CA', mult: 1.30 },
  '911': { region: 'Pasadena, CA', mult: 1.30 },
  '912': { region: 'Glendale, CA', mult: 1.28 },
  '913': { region: 'San Fernando Valley, CA', mult: 1.26 },
  '914': { region: 'San Fernando Valley, CA', mult: 1.26 },
  '916': { region: 'Hollywood, CA', mult: 1.30 },
  '917': { region: 'San Gabriel Valley, CA', mult: 1.24 },
  '918': { region: 'San Gabriel Valley, CA', mult: 1.24 },
  '920': { region: 'San Diego County, CA', mult: 1.24 },
  '921': { region: 'San Diego, CA', mult: 1.26 },
  '926': { region: 'Orange County, CA', mult: 1.28 },
  '927': { region: 'Orange County, CA', mult: 1.26 },
  '928': { region: 'Orange County, CA', mult: 1.24 },
  '958': { region: 'Sacramento, CA', mult: 1.14 },
  '981': { region: 'Seattle, WA', mult: 1.28 },
  '980': { region: 'Eastside Seattle, WA', mult: 1.26 },
  '021': { region: 'Boston, MA', mult: 1.38 },
  '022': { region: 'Boston, MA', mult: 1.38 },
  '024': { region: 'Greater Boston, MA', mult: 1.34 },
  '017': { region: 'MetroWest, MA', mult: 1.30 },
  '018': { region: 'North of Boston, MA', mult: 1.26 },
  '200': { region: 'Washington, DC', mult: 1.26 },
  '202': { region: 'Washington, DC', mult: 1.26 },
  '222': { region: 'Arlington, VA', mult: 1.24 },
  '223': { region: 'Alexandria, VA', mult: 1.22 },
  '208': { region: 'Montgomery County, MD', mult: 1.20 },
  '209': { region: 'Montgomery County, MD', mult: 1.18 },
  '606': { region: 'Chicago, IL', mult: 1.18 },
  '607': { region: 'Chicago, IL', mult: 1.16 },
  '600': { region: 'North Shore, IL', mult: 1.14 },
  '601': { region: 'West Suburban Chicago, IL', mult: 1.10 },
  '605': { region: 'West Suburban Chicago, IL', mult: 1.10 },
  '802': { region: 'Denver, CO', mult: 1.14 },
  '801': { region: 'South Denver Metro, CO', mult: 1.12 },
  '800': { region: 'Denver Metro, CO', mult: 1.12 },
  '803': { region: 'Boulder, CO', mult: 1.18 },
  '972': { region: 'Portland, OR', mult: 1.16 },
  '970': { region: 'Portland Metro, OR', mult: 1.14 },
  '850': { region: 'Phoenix, AZ', mult: 1.02 },
  '852': { region: 'East Valley, AZ', mult: 1.02 },
  '853': { region: 'West Valley, AZ', mult: 0.98 },
  '331': { region: 'Miami, FL', mult: 1.12 },
  '330': { region: 'Miami-Dade, FL', mult: 1.10 },
  '333': { region: 'Fort Lauderdale, FL', mult: 1.08 },
  '334': { region: 'Palm Beach, FL', mult: 1.10 },
  '328': { region: 'Orlando, FL', mult: 0.98 },
  '336': { region: 'Tampa, FL', mult: 0.98 },
  '752': { region: 'Dallas, TX', mult: 0.98 },
  '750': { region: 'North Dallas, TX', mult: 0.98 },
  '751': { region: 'Dallas Metro, TX', mult: 0.96 },
  '760': { region: 'Fort Worth, TX', mult: 0.94 },
  '770': { region: 'Houston, TX', mult: 0.96 },
  '774': { region: 'Southwest Houston, TX', trans: 0.96, mult: 0.96 },
  '773': { region: 'North Houston, TX', mult: 0.96 },
  '787': { region: 'Austin, TX', mult: 1.04 },
  '782': { region: 'San Antonio, TX', mult: 0.90 },
  '303': { region: 'Atlanta, GA', mult: 0.98 },
  '300': { region: 'Metro Atlanta, GA', mult: 0.96 },
  '301': { region: 'Metro Atlanta, GA', mult: 0.96 },
  '191': { region: 'Philadelphia, PA', mult: 1.14 },
  '190': { region: 'Philadelphia Suburbs, PA', mult: 1.12 },
  '212': { region: 'Baltimore, MD', mult: 1.08 },
  '282': { region: 'Charlotte, NC', mult: 0.96 },
  '276': { region: 'Raleigh, NC', mult: 0.96 },
  '372': { region: 'Nashville, TN', mult: 0.98 },
  '841': { region: 'Salt Lake City, UT', mult: 1.04 },
  '891': { region: 'Las Vegas, NV', mult: 1.02 },
  '968': { region: 'Honolulu, HI', mult: 1.58 },
  '995': { region: 'Anchorage, AK', mult: 1.38 },
  '967': { region: 'Hawaii', mult: 1.52 },
};

function zip3Of(zip) {
  const s = String(zip || '').replace(/\D/g, '').padStart(5, '').slice(0, 5);
  if (s.length < 3) return null;
  return parseInt(s.slice(0, 3), 10);
}

function stateForZip3(z3) {
  for (const [lo, hi, st] of ZIP3_RANGES) {
    if (z3 >= lo && z3 <= hi) return st;
  }
  return null;
}

export function normalizeZip(raw) {
  const s = String(raw || '').replace(/\D/g, '').slice(0, 5);
  return s.length === 5 ? s : '';
}

export function sanitizeTier(t) {
  return TIERS.some((x) => x.id === t) ? t : 'standard';
}

export function sanitizeBuildType(t) {
  return HEATED_RATE[t] ? t : 'home';
}

export function resolveLocation(zip) {
  const z = normalizeZip(zip);
  if (!z) {
    return {
      zip: '',
      state: null,
      stateName: 'United States',
      region: 'US average',
      multiplier: 1,
      note: 'Using the 2026 US national average. Enter a 5-digit ZIP to apply local material and labor rates.',
      found: false,
    };
  }
  const z3 = zip3Of(z);
  const st = stateForZip3(z3);
  const state = st && STATES[st] ? STATES[st] : null;
  const metro = METRO[String(z3).padStart(3, '0')] || METRO[z3];
  const multiplier = metro?.mult || state?.mult || 1;
  const stateName = state?.name || 'United States';
  const region = metro?.region || (state ? `${stateName}` : 'US average');
  const pct = Math.round((multiplier - 1) * 100);
  const vs = pct === 0
    ? 'about even with the US average'
    : pct > 0
      ? `${pct}% above the US average`
      : `${Math.abs(pct)}% below the US average`;
  return {
    zip: z,
    state: st || null,
    stateName,
    region,
    multiplier,
    note: `Local rates for ${region} (ZIP ${z}) are ${vs}, based on 2025–2026 RSMeans / NAHB-style regional cost indices.`,
    found: !!(state || metro),
  };
}

export function loadPrefs() {
  try {
    return {
      zip: normalizeZip(localStorage.getItem(LS_ZIP) || ''),
      tier: sanitizeTier(localStorage.getItem(LS_TIER) || 'standard'),
    };
  } catch {
    return { zip: '', tier: 'standard' };
  }
}

export function savePrefs({ zip, tier } = {}) {
  try {
    if (zip !== undefined) {
      const z = normalizeZip(zip);
      if (z) localStorage.setItem(LS_ZIP, z);
      else localStorage.removeItem(LS_ZIP);
    }
    if (tier !== undefined) localStorage.setItem(LS_TIER, sanitizeTier(tier));
  } catch { /* ignore */ }
}

export function estimateBuild({
  heatedSqFt = 0, garageSqFt = 0, porchSqFt = 0,
  buildType = 'home', zip = '', tier = 'standard', location,
  extras = {},
} = {}) {
  const loc = location || resolveLocation(zip);
  const t = TIERS.find((x) => x.id === sanitizeTier(tier)) || TIERS[1];
  const kind = sanitizeBuildType(buildType);
  const heatedSf = Math.max(0, Number(heatedSqFt) || 0);
  const garageSf = Math.max(0, Number(garageSqFt) || 0);
  const porchSf = Math.max(0, Number(porchSqFt) || 0);
  const heatedRate = (HEATED_RATE[kind] || HEATED_RATE.home) * t.factor * loc.multiplier;
  const garageRate = GARAGE_RATE * (t.id === 'economy' ? 0.85 : t.id === 'custom' ? 1.30 : 1) * loc.multiplier;
  const porchRate = PORCH_RATE * (t.id === 'economy' ? 0.80 : t.id === 'custom' ? 1.28 : 1) * loc.multiplier;
  const heatedCost = heatedSf * heatedRate;
  const garageCost = garageSf * garageRate;
  const porchCost = porchSf * porchRate;
  const poolSf = Math.max(0, Number(extras.poolSf) || 0);
  const spaCount = Math.max(0, Number(extras.spaCount) || 0);
  const solarKw = Math.max(0, Number(extras.solarKw) || 0);
  const poolRate = POOL_RATE * (t.id === 'economy' ? 0.80 : t.id === 'custom' ? 1.35 : 1) * loc.multiplier;
  const spaEach = SPA_COST * (t.id === 'economy' ? 0.85 : t.id === 'custom' ? 1.25 : 1) * loc.multiplier;
  const solarWatt = SOLAR_PER_WATT * (t.id === 'economy' ? 0.85 : t.id === 'custom' ? 1.15 : 1) * loc.multiplier;
  const poolCost = poolSf * poolRate;
  const spaCost = spaCount * spaEach;
  const solarCost = solarKw * 1000 * solarWatt;
  const mid = heatedCost + garageCost + porchCost + poolCost + spaCost + solarCost;
  const low = mid * 0.88;
  const high = mid * 1.14;
  const items = BREAKDOWN.map((b) => {
    const amount = heatedCost * b.pct;
    return { id: b.id, label: b.label, amount, pct: mid > 0 ? amount / mid : 0 };
  });
  if (garageCost + porchCost > 0) {
    const amount = garageCost + porchCost;
    items.push({
      id: 'garage-porch',
      label: 'Garage & Porches',
      amount,
      pct: mid > 0 ? amount / mid : 0,
    });
  }
  if (poolCost > 0) items.push({ id: 'pool', label: 'In-ground pool', amount: poolCost, pct: mid > 0 ? poolCost / mid : 0 });
  if (spaCost > 0) items.push({ id: 'spa', label: 'Hot tub / spa', amount: spaCost, pct: mid > 0 ? spaCost / mid : 0 });
  if (solarCost > 0) items.push({ id: 'solar', label: `Solar PV (${solarKw.toFixed(1)} kW)`, amount: solarCost, pct: mid > 0 ? solarCost / mid : 0 });
  return {
    heatedSqFt: heatedSf,
    garageSqFt: garageSf,
    porchSqFt: porchSf,
    buildType: kind,
    tier: t.id,
    tierLabel: t.label,
    zip: loc.zip,
    location: loc,
    multiplier: loc.multiplier,
    heatedRate,
    perHeatedSf: heatedSf > 0 ? mid / heatedSf : 0,
    heatedCost,
    garageCost,
    porchCost,
    poolCost,
    spaCost,
    solarCost,
    poolSf,
    spaCount,
    solarKw,
    mid,
    low,
    high,
    items,
    landExcluded: true,
  };
}

export function fmtMoney(n, { compact = false } = {}) {
  const v = Math.round(Number(n) || 0);
  if (compact) {
    const abs = Math.abs(v);
    if (abs >= 1_000_000) {
      const m = v / 1_000_000;
      return '$' + (Math.abs(m) >= 10 ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, '')) + 'M';
    }
    if (abs >= 1000) return '$' + Math.round(v / 1000) + 'k';
    return '$' + v.toLocaleString('en-US');
  }
  return '$' + v.toLocaleString('en-US');
}

export function fmtRange(est, { compact = false } = {}) {
  if (!est || !est.mid) return 'Est. —';
  if (compact) return `Est. ${fmtMoney(est.low, { compact: true })}–${fmtMoney(est.high, { compact: true })}`;
  return `${fmtMoney(est.low)} – ${fmtMoney(est.high)}`;
}

export function fmtMult(m) {
  const n = Number(m) || 1;
  return n.toFixed(2) + '×';
}

export async function fetchLocalRates(params = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') q.set(k, String(v));
  }
  const r = await fetch('/api/local-rates?' + q.toString(), { credentials: 'same-origin' });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Could not look up local rates');
  return data;
}

export function renderZipTierBar(el, { zip, tier, onChange, idPrefix = 'cost' } = {}) {
  if (!el) return;
  const z = normalizeZip(zip);
  const t = sanitizeTier(tier);
  el.classList.add('cost-bar');
  el.innerHTML = `
    <div class="cost-bar-l">
      <span class="cost-bar-k">Local rates</span>
      <label class="cost-zip-wrap">ZIP
        <input class="cost-zip" id="${idPrefix}Zip" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="5" placeholder="US ZIP" value="${z}" autocomplete="postal-code" aria-label="ZIP code for local build rates">
      </label>
      <span class="cost-bar-dot">·</span>
      <div class="cost-tiers" role="tablist" aria-label="Finish tier">
        ${TIERS.map((x) => `<button type="button" class="pill cost-tier${x.id === t ? ' on' : ''}" data-tier="${x.id}">${x.label}</button>`).join('')}
      </div>
    </div>
    <div class="cost-bar-note muted" id="${idPrefix}Note"></div>
  `;
  const input = el.querySelector('.cost-zip');
  const note = el.querySelector('.cost-bar-note');
  const paintNote = (loc) => {
    if (note) note.textContent = loc.note || '';
  };
  paintNote(resolveLocation(z));
  const emit = (next) => {
    savePrefs(next);
    paintNote(resolveLocation(next.zip ?? z));
    onChange?.({ zip: next.zip ?? z, tier: next.tier ?? t });
  };
  input.addEventListener('input', () => {
    const raw = input.value.replace(/\D/g, '').slice(0, 5);
    if (input.value !== raw) input.value = raw;
    if (raw.length === 5 || raw.length === 0) emit({ zip: raw, tier: t });
  });
  input.addEventListener('change', () => emit({ zip: input.value, tier: t }));
  el.querySelectorAll('.cost-tier').forEach((b) => {
    b.addEventListener('click', () => {
      el.querySelectorAll('.cost-tier').forEach((x) => x.classList.toggle('on', x === b));
      emit({ zip: input.value, tier: b.dataset.tier });
    });
  });
  return { input, setNote: paintNote };
}

export function estimatePillHtml(est, { href, className = '' } = {}) {
  if (!est || !(est.heatedSqFt > 0 || est.garageSqFt > 0 || est.porchSqFt > 0)) {
    return `<span class="badge cost-pill ${className}">Est. —</span>`;
  }
  const label = fmtRange(est, { compact: true });
  const title = `${fmtRange(est)} mid ${fmtMoney(est.mid)} · ${fmtMoney(est.perHeatedSf)}/heated sf · land not included`;
  if (href) return `<a class="badge acc cost-pill ${className}" href="${href}" title="${title}">${label}</a>`;
  return `<span class="badge acc cost-pill ${className}" title="${title}">${label}</span>`;
}

export function renderBreakdown(el, est) {
  if (!el) return;
  if (!est || !est.mid) {
    el.innerHTML = '<p class="muted">Add heated floor area to see a build cost estimate.</p>';
    return;
  }
  const loc = est.location || resolveLocation(est.zip);
  const rows = est.items.map((it) => `
    <tr>
      <th scope="row">${it.label}</th>
      <td>${fmtMoney(it.amount)}</td>
      <td>${Math.round(it.pct * 1000) / 10}%</td>
    </tr>`).join('');
  el.innerHTML = `
    <div class="cost-head">
      <div>
        <div class="cost-kicker">Estimated build range</div>
        <div class="cost-range">${fmtRange(est)}</div>
        <div class="muted">Midpoint ${fmtMoney(est.mid)} · ${fmtMoney(est.perHeatedSf)} per heated sq ft</div>
      </div>
      <div class="cost-meta muted">
        <div>${est.tierLabel} finish · ${est.buildType}</div>
        <div>${loc.region}${loc.zip ? ` · ZIP ${loc.zip}` : ''}</div>
        <div>Local rate ${fmtMult(est.multiplier)}</div>
      </div>
    </div>
    <p class="cost-note muted">${loc.note} Land is not included. This is a planning range from 2025–2026 US construction benchmarks, not a contractor bid.</p>
    <table class="cost-table">
      <thead><tr><th>Item</th><th>Amount</th><th>Share</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><th>Midpoint total</th><td>${fmtMoney(est.mid)}</td><td>100%</td></tr>
        <tr class="cost-range-row"><th>Estimated range</th><td colspan="2">${fmtRange(est)}</td></tr>
      </tfoot>
    </table>
  `;
}
