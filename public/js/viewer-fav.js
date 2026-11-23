// PeakStead Designs — Favorite/like control in the 3D viewer top bar.
import { api } from '/js/common.js';
import {
  paintFavButton, isExampleFavorite, toggleExampleFavorite,
  isLocalFavorite, toggleLocalFavorite, setProjectFavorite,
} from '/js/favorites.js';

const params = new URLSearchParams(location.search);
const btn = document.getElementById('favBtn');
if (!btn || params.get('embed') === '1' || document.body.classList.contains('embed')) {
  if (btn) btn.style.display = 'none';
} else {
  const kind = params.get('s') ? 'share'
    : params.get('p') ? 'project'
    : params.get('draft') === '1' ? 'draft'
    : 'example';

  let projectFavorited = false;
  let ready = false;

  function currentExampleId() {
    return new URLSearchParams(location.search).get('ex') || window.app?.current || null;
  }

  function isOn() {
    if (kind === 'project') return projectFavorited;
    if (kind === 'example') {
      const id = currentExampleId();
      return id ? isExampleFavorite(id) : false;
    }
    if (kind === 'draft') return isLocalFavorite('draft');
    if (kind === 'share') return isLocalFavorite('share:' + params.get('s'));
    return false;
  }

  function refresh() {
    paintFavButton(btn, isOn());
    btn.style.display = (kind === 'example' && !currentExampleId()) ? 'none' : 'inline-flex';
  }

  async function init() {
    if (kind === 'project') {
      try {
        const data = await api('projects/' + encodeURIComponent(params.get('p')));
        projectFavorited = !!data.project?.favorited;
      } catch {
        projectFavorited = false;
      }
    }
    ready = true;
    refresh();
  }

  btn.addEventListener('click', async () => {
    if (!ready) return;
    btn.disabled = true;
    try {
      if (kind === 'project') {
        const next = !projectFavorited;
        paintFavButton(btn, next);
        const data = await setProjectFavorite(params.get('p'), next);
        projectFavorited = !!(data.project?.favorited ?? next);
        paintFavButton(btn, projectFavorited);
      } else if (kind === 'example') {
        const id = currentExampleId();
        if (id) toggleExampleFavorite(id);
        refresh();
      } else if (kind === 'draft') {
        toggleLocalFavorite('draft');
        refresh();
      } else if (kind === 'share') {
        toggleLocalFavorite('share:' + params.get('s'));
        refresh();
      }
    } catch (err) {
      if (kind === 'project') paintFavButton(btn, projectFavorited);
      console.warn('Could not update favorite', err);
    } finally {
      btn.disabled = false;
    }
  });

  function hookLoadExample() {
    const orig = window.app?.loadExample;
    if (typeof orig !== 'function' || orig._favHooked) return !!orig;
    const wrapped = async (id, opts) => {
      const r = await orig(id, opts);
      refresh();
      return r;
    };
    wrapped._favHooked = true;
    window.app.loadExample = wrapped;
    return true;
  }
  document.getElementById('tabs')?.addEventListener('click', () => {
    queueMicrotask(refresh);
  });
  await init();
  if (!hookLoadExample()) {
    const started = Date.now();
    const t = setInterval(() => {
      if (hookLoadExample() || Date.now() - started > 20000) clearInterval(t);
    }, 50);
  }
}
