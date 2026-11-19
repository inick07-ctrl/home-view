import { toast } from './common.js';
import { loginUrlFor, saveExample, savedExampleMap, renderSaveControl } from './example-save.js';

const params = new URLSearchParams(location.search);
const isExampleView = !params.get('s') && !params.get('p');
const wrap = document.getElementById('saveWrap');
if (!isExampleView || !wrap) {
  // Project and share views don't offer "Save to my projects".
} else {
  wrap.style.display = 'flex';
  let byId = new Map();
  let user = null;
  let saving = false;

  function currentExampleId() {
    return new URLSearchParams(location.search).get('ex') || window.app?.current || null;
  }

  async function refresh() {
    const id = currentExampleId();
    if (!id) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'flex';
    const btn = renderSaveControl(wrap, {
      exampleId: id,
      savedProject: byId.get(id) || null,
      saving,
      btnClass: 'save-ctl',
    });
    btn?.addEventListener('click', () => onSave(id));
  }

  async function onSave(id) {
    if (!user) {
      const u = new URL(location.href);
      u.searchParams.set('save', '1');
      location.href = loginUrlFor(u.pathname + u.search);
      return;
    }
    saving = true;
    await refresh();
    try {
      const data = await saveExample(id);
      byId.set(id, data.project);
      toast(data.alreadySaved ? 'Already in My projects' : 'Saved to My projects');
    } catch (e) {
      toast(e.message || 'Could not save');
    } finally {
      saving = false;
      await refresh();
    }
  }

  const state = await savedExampleMap();
  user = state.user;
  byId = state.byId;

  if (user && params.get('save')) {
    const id = currentExampleId();
    if (id) await onSave(id);
    const u = new URL(location.href);
    u.searchParams.delete('save');
    history.replaceState(null, '', u.pathname + u.search + u.hash);
  }

  const orig = window.app?.loadExample;
  if (typeof orig === 'function') {
    window.app.loadExample = async (id) => {
      await orig(id);
      await refresh();
    };
  }
  await refresh();
}
