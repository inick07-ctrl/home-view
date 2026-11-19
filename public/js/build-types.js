// Shared by the project UI and the API (Node can import this file).
export const BUILD_TYPES = [
  { id: 'home', label: 'Home' },
  { id: 'tiny', label: 'Tiny home' },
  { id: 'trailer', label: 'Trailer / Mobile home' },
  { id: 'adu', label: 'ADU / Cabin' },
];

export const BUILD_TYPE_IDS = BUILD_TYPES.map(t => t.id);

export function sanitizeBuildType(v, fallback = 'home') {
  const id = String(v || '').trim().toLowerCase();
  return BUILD_TYPE_IDS.includes(id) ? id : fallback;
}

export function buildTypeLabel(id) {
  return BUILD_TYPES.find(t => t.id === id)?.label || BUILD_TYPES[0].label;
}

export function buildTypeOptionsHtml(selected = 'home') {
  const cur = sanitizeBuildType(selected);
  return BUILD_TYPES.map(t => `<option value="${t.id}"${t.id === cur ? ' selected' : ''}>${t.label}</option>`).join('');
}
