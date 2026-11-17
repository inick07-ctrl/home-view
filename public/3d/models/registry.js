// Example homes shown on /examples and in the viewer (?ex=smith-0N).
export default [
  { id: 'smith-01', name: 'Smith 01', title: 'Smith 01 — Single-Story U-Plan', blurb: 'Single story · ~2,636 sf living · 3 bed + office · 3-car garage', load: () => import('./smith-01.js') },
  { id: 'smith-02', name: 'Smith 02', title: 'Smith 02 — Modern Farmhouse with Pool', blurb: 'Single story · 3 bed + office · vaulted living wing · 3-car garage · terrace, pool & pool house', load: () => import('./smith-02.js') },
  { id: 'smith-03', name: 'Smith 03', title: 'Smith 03 — Back Forty Barndominium', blurb: 'Single story · 3 bed + office · great room open to above · 39\'4" x 46\'6" shop garage · front & back porches (roof is a guess)', load: () => import('./smith-03.js') },
  { id: 'smith-04', name: 'Smith 04', title: 'Smith 04 — Modern Ranch, Two Master Suites', blurb: 'Single story · 2 master suites + 3 bedrooms + office · vaulted great room, dining & kitchen · 3-car garage · terraces front & back (roof is a guess)', load: () => import('./smith-04.js') },
  { id: 'smith-05', name: 'Smith 05', title: 'Smith 05 — Modern Farmhouse, Three Gables', blurb: 'Single story · 4 bed + office · vaulted great room, dining & kitchen · 41\'-4" vaulted back porch · side-entry garage (roof read from the renders)', load: () => import('./smith-05.js') },
  { id: 'smith-06', name: 'Smith 06', title: 'Smith 06 — Original Breezeway Farmhouse', blurb: 'Original design · primary suite + 3 bed left · kitchen / dining / living breezeway centre · library, gym, safe room, 3-car garage right · screened porch with see-through fireplace', load: () => import('./smith-06.js') },
];
