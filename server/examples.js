// Display names must stay in sync with public/3d/models/registry.js (`name`, `tagline`).
// formerNames are previous official defaults; projects still using one are updated to `name`.
export const EXAMPLES = [
  { id: 'smith-01', name: 'Willow Court', type: 'home', formerNames: ['Smith 01'], tagline: 'A U-shaped single-story home that gathers three bedrooms and an office around a quiet court.' },
  { id: 'smith-02', name: 'Poolside Gables', type: 'home', formerNames: ['Smith 02'], tagline: 'A modern farmhouse with a vaulted living wing, an open terrace, and a pool house.' },
  { id: 'smith-03', name: 'The Back Forty', type: 'home', formerNames: ['Smith 03'], tagline: 'A barndominium with a soaring great room and a shop garage built for serious work.' },
  { id: 'smith-04', name: 'Twin Oaks', type: 'home', formerNames: ['Smith 04'], tagline: 'A modern ranch with two master suites and terraces that open front and back.' },
  { id: 'smith-05', name: 'Triple Gable', type: 'home', formerNames: ['Smith 05'], tagline: 'A three-gable modern farmhouse with a deep, vaulted back porch.' },
  { id: 'smith-06', name: 'Breezeway Hearth', type: 'home', formerNames: ['Smith 06'], tagline: 'A farmhouse centered on a breezeway, with a screened porch and a see-through fireplace.' },
  { id: 'smith-07', name: 'Porchlight Farm', type: 'home', formerNames: ['Smith 07'], tagline: 'A classic farmhouse with fifty-foot porches front and back, plus a study and flex room.' },
  { id: 'smith-08', name: 'Limewash Hall', type: 'home', formerNames: ['Smith 08'], tagline: 'An English Country ranch with a library, gym, and a long back porch.' },
  { id: 'smith-09', name: 'The Prairie Lantern', type: 'home', formerNames: ['Smith 09'], tagline: 'An English Country house with a sixty-foot front porch and a vaulted great room.' },
  { id: 'smith-10', name: 'Ember Ranch', type: 'home', formerNames: ['Smith 10'], tagline: 'A compact English Country ranch with a linear fireplace, mudroom, and butler\'s pantry.' },
  { id: 'smith-11', name: 'Hearth Patio', type: 'home', formerNames: ['Smith 11'], tagline: 'An English Country house with four bedrooms, a study, and a covered patio.' },
  { id: 'smith-12', name: 'Twin Porch Homestead', type: 'home', formerNames: ['Smith 12'], tagline: 'A farmhouse with matching covered porches front and back, an open kitchen-dining-living core, and a two-car garage.' },
  { id: 'tiny-01', name: 'Pine Nook', type: 'tiny', formerNames: ['Tiny 01'], tagline: 'A tiny house on wheels, with a loft over the kitchenette and bath.' },
  { id: 'tiny-02', name: 'Duskfen Loft', type: 'tiny', tagline: 'A sleek Nordic tiny home with dark siding, a clerestory roofline, a wall of glass, and a sleeping loft.' },
  { id: 'tiny-03', name: 'Tamarack Porch', type: 'tiny', tagline: 'A rustic timber tiny cabin with a covered front porch, a steep gable, a private bedroom, and a loft overhang.' },
  { id: 'tiny-04', name: 'Wrenwood Cabin', type: 'tiny', tagline: 'A cozy cabin-style tiny home with a covered porch, a dormered gable, a fireplace, and a kitchen with bar seating.' },
  { id: 'aframe-01', name: 'Fernhollow A-Frame', type: 'aframe', tagline: 'A compact woodland A-frame with a glass front gable, an open great room and fireplace, one bath, and a sleeping loft.' },
  { id: 'aframe-02', name: 'Lodgepole A-Frame', type: 'aframe', tagline: 'A classic timber A-frame with side dormers, two bedrooms plus a loft, two baths, and a wrap-around deck.' },
  { id: 'aframe-03', name: 'Whitepine Homestead', type: 'aframe', tagline: 'A grand A-frame homestead with cathedral glass, three bedrooms and a loft, a kitchen island, mudroom, and a garage wing.' },
  { id: 'single-wide-01', name: 'Lakeshore Longhouse', type: 'trailer', formerNames: ['Single-Wide 01'], tagline: 'A long, single-wide home with three bedrooms, two baths, and a front porch.' },
  { id: 'double-wide-01', name: 'Meadow Glen', type: 'trailer', formerNames: ['Double-Wide 01'], tagline: 'A double-wide with three bedrooms, two baths, and a wide front porch.' },
];

export function getExample(id) {
  const s = String(id || '');
  return EXAMPLES.find(e => e.id === s) || null;
}

/** Return the current official name when a project still has a former default name. */
export function resolvedExampleName(p) {
  const ex = p && p.exampleId ? getExample(p.exampleId) : null;
  if (!ex) return p?.name;
  const n = String(p.name || '').trim();
  if ((ex.formerNames || []).includes(n)) return ex.name;
  return p.name;
}

