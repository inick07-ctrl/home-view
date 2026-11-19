// Display names must stay in sync with public/3d/models/registry.js (`name`).
export const EXAMPLES = [
  { id: 'smith-01', name: 'Smith 01', type: 'home' },
  { id: 'smith-02', name: 'Smith 02', type: 'home' },
  { id: 'smith-03', name: 'Smith 03', type: 'home' },
  { id: 'smith-04', name: 'Smith 04', type: 'home' },
  { id: 'smith-05', name: 'Smith 05', type: 'home' },
  { id: 'smith-06', name: 'Smith 06', type: 'home' },
  { id: 'smith-07', name: 'Smith 07', type: 'home' },
  { id: 'smith-08', name: 'Smith 08', type: 'home' },
  { id: 'smith-09', name: 'Smith 09', type: 'home' },
  { id: 'smith-10', name: 'Smith 10', type: 'home' },
  { id: 'smith-11', name: 'Smith 11', type: 'home' },
  { id: 'tiny-01', name: 'Tiny 01', type: 'tiny' },
  { id: 'single-wide-01', name: 'Single-Wide 01', type: 'trailer' },
  { id: 'double-wide-01', name: 'Double-Wide 01', type: 'trailer' },
];

export function getExample(id) {
  const s = String(id || '');
  return EXAMPLES.find(e => e.id === s) || null;
}
