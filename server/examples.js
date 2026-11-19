// Display names must stay in sync with public/3d/models/registry.js (`name`).
export const EXAMPLES = [
  { id: 'smith-01', name: 'Smith 01' },
  { id: 'smith-02', name: 'Smith 02' },
  { id: 'smith-03', name: 'Smith 03' },
  { id: 'smith-04', name: 'Smith 04' },
  { id: 'smith-05', name: 'Smith 05' },
  { id: 'smith-06', name: 'Smith 06' },
  { id: 'smith-07', name: 'Smith 07' },
  { id: 'smith-08', name: 'Smith 08' },
  { id: 'smith-09', name: 'Smith 09' },
  { id: 'smith-10', name: 'Smith 10' },
  { id: 'smith-11', name: 'Smith 11' },
];

export function getExample(id) {
  const s = String(id || '');
  return EXAMPLES.find(e => e.id === s) || null;
}
