import { api, me } from './common.js';

export function loginUrlFor(returnPath) {
  return `/?next=${encodeURIComponent(returnPath)}#login`;
}

export async function saveExample(exampleId) {
  return api('projects/from-example', { method: 'POST', body: { exampleId } });
}

export async function savedExampleMap() {
  const user = await me();
  if (!user) return { user: null, byId: new Map() };
  const { projects } = await api('projects');
  const byId = new Map();
  for (const p of projects) if (p.exampleId) byId.set(p.exampleId, p);
  return { user, byId };
}

export function projectViewerHref(project) {
  return '/viewer?p=' + encodeURIComponent(project.id);
}

/** Render a save / already-saved control into `el`. Returns the save button, if any. */
export function renderSaveControl(el, { exampleId, savedProject, saving = false, btnClass = 'btn small' }) {
  el.replaceChildren();
  if (saving) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = btnClass;
    b.disabled = true;
    b.textContent = 'Saving…';
    el.appendChild(b);
    return null;
  }
  if (savedProject) {
    const a = document.createElement('a');
    a.className = btnClass;
    a.href = projectViewerHref(savedProject);
    a.textContent = 'Open in my projects';
    a.title = 'Already saved to My projects';
    el.appendChild(a);
    return null;
  }
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `${btnClass} primary`;
  b.dataset.exampleId = exampleId;
  b.textContent = 'Save to my projects';
  el.appendChild(b);
  return b;
}
