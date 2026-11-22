import { loadPrefs, savePrefs, estimateBuild, renderZipTierBar, renderBreakdown, fmtRange, fmtMoney } from '/js/cost-estimator.js';
import { extrasFromItems, garageDoorExtras } from '/js/yard-extras.js';

function areasFromApp() {
  const a = window.app?.getAreas?.();
  if (a && (a.heated || a.garage || a.porch)) return { ...a, buildType: window.app.getBuildType?.() || 'home' };
  return { heated: 0, garage: 0, porch: 0, buildType: 'home' };
}

function estimate(prefs, areas = areasFromApp()) {
  const extras = { ...extrasFromItems(window.app?.getItems?.() || []), ...garageDoorExtras(window.app?.getGarageDoors?.() || []) };
  return estimateBuild({
    heatedSqFt: areas.heated, garageSqFt: areas.garage, porchSqFt: areas.porch,
    buildType: areas.buildType || 'home', zip: prefs.zip, tier: prefs.tier,
    extras,
  });
}

export function mountViewerCost() {
  const pill = document.getElementById('costPill');
  const drawer = document.getElementById('costDrawer');
  const breakdown = document.getElementById('costBreakdown');
  const bar = document.getElementById('costBar');
  if (!pill || !drawer || !breakdown || !bar) return;

  let prefs = loadPrefs();
  const paint = () => {
    const est = estimate(prefs);
    const has = est.heatedSqFt > 0 || est.garageSqFt > 0 || est.porchSqFt > 0;
    pill.textContent = has ? fmtRange(est, { compact: true }) : 'Estimate';
    pill.title = has ? `${fmtRange(est)} · mid ${fmtMoney(est.mid)} · land not included` : 'Build cost estimate';
    renderBreakdown(breakdown, has ? est : null);
  };

  renderZipTierBar(bar, {
    zip: prefs.zip, tier: prefs.tier, idPrefix: 'viewerCost',
    onChange: (next) => { prefs = { ...prefs, ...next }; savePrefs(prefs); paint(); },
  });

  const toggle = () => {
    const open = !drawer.classList.contains('open');
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    pill.classList.toggle('on', open);
    pill.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  pill.addEventListener('click', toggle);
  drawer.querySelector('.cost-drawer-close')?.addEventListener('click', () => {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    pill.classList.remove('on');
    pill.setAttribute('aria-expanded', 'false');
  });

  addEventListener('peakstead-areas', paint);
  paint();
  return { paint, open: () => { if (!drawer.classList.contains('open')) toggle(); } };
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mountViewerCost);
else mountViewerCost();
