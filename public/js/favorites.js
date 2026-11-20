// PeakStead Designs — favorite/like helpers (localStorage for examples, API for saved projects).
import { api } from './common.js';

export const FAV_LS = 'peakstead-favorites-v1';

export const HEART_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.1 20.7c-.3.2-.8.2-1.1 0C6.4 17.3 2 13.4 2 8.9 2 6 4.3 3.8 7.1 3.8c1.6 0 3.1.8 3.9 2 .9-1.2 2.3-2 3.9-2 2.8 0 5.1 2.2 5.1 5.1 0 4.5-4.4 8.4-8.9 11.8z"/></svg>';

export function favButtonHtml({ on = false, className = 'fav-btn', id = '' } = {}) {
  const label = on ? 'Remove from favorites' : 'Add to favorites';
  const idAttr = id ? ` id="${id}"` : '';
  return `<button type="button"${idAttr} class="${className}${on ? ' on' : ''}" aria-pressed="${on ? 'true' : 'false'}" aria-label="${label}" title="${label}">${HEART_SVG}</button>`;
}

export function paintFavButton(el, on) {
  if (!el) return;
  el.classList.toggle('on', !!on);
  el.setAttribute('aria-pressed', on ? 'true' : 'false');
  const label = on ? 'Remove from favorites' : 'Add to favorites';
  el.setAttribute('aria-label', label);
  el.title = label;
}

function readLs() {
  try {
    const raw = JSON.parse(localStorage.getItem(FAV_LS) || 'null');
    if (Array.isArray(raw)) return { examples: [...new Set(raw.map(String))], other: {} };
    const examples = Array.isArray(raw?.examples) ? raw.examples.map(String) : [];
    const other = raw?.other && typeof raw.other === 'object' ? raw.other : {};
    return { examples: [...new Set(examples)], other };
  } catch {
    return { examples: [], other: {} };
  }
}

function writeLs(state) {
  try { localStorage.setItem(FAV_LS, JSON.stringify({ examples: state.examples, other: state.other || {}, v: 1 })); } catch {}
}

export function listExampleFavorites() { return readLs().examples; }
export function isExampleFavorite(id) { return readLs().examples.includes(String(id)); }

export function toggleExampleFavorite(id) {
  const s = readLs();
  const k = String(id);
  const i = s.examples.indexOf(k);
  if (i >= 0) s.examples.splice(i, 1);
  else s.examples.push(k);
  writeLs(s);
  return i < 0;
}

export function isLocalFavorite(key) { return !!readLs().other[String(key)]; }

export function toggleLocalFavorite(key) {
  const s = readLs();
  const k = String(key);
  const on = !s.other[k];
  if (on) s.other[k] = true;
  else delete s.other[k];
  writeLs(s);
  return on;
}

export async function setProjectFavorite(projectId, favorited) {
  return api('projects/' + encodeURIComponent(projectId), { method: 'PATCH', body: { favorited: !!favorited } });
}
