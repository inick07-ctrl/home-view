import { mountClientTour } from './client-tour.js';
// Generic showcase UI: plan readout, dollhouse, touch joystick.
// Works for every catalog model and saved project — no per-model data.

function $(id) { return document.getElementById(id); }

function fmtFt(n) {
  if (!Number.isFinite(n)) return '—';
  const ft = Math.floor(n + 1e-6), inch = Math.round((n - ft) * 12);
  if (inch === 12) return `${ft + 1}'-0"`;
  return inch ? `${ft}'-${inch}"` : `${ft}'-0"`;
}

function fmtArea(a) {
  if (!Number.isFinite(a)) return '—';
  return Math.round(a).toLocaleString('en-US') + ' sf';
}

function renderReadout(data) {
  const panel = $('planReadout');
  const body = $('planReadoutBody');
  if (!panel || !body) return;
  if (!data || !data.rooms) { body.innerHTML = '<p class="pr-empty">No plan is loaded.</p>'; return; }
  const flagged = data.flagged || data.rooms.filter((r) => r.flags && r.flags.length);
  const bits = [];
  bits.push(`<div class="pr-sum">${data.rooms.length} rooms · default wall height ${fmtFt(data.wallH)}${flagged.length ? ` · <strong>${flagged.length} flagged</strong>` : ''}</div>`);
  for (const r of data.rooms) {
    const flags = (r.flags || []).map((f) => `<li>${escapeHtml(f)}</li>`).join('');
    const heights = (r.wallHeights || []).map(fmtFt).join(', ') || fmtFt(data.wallH);
    const doors = (r.doors || []).map((d) => `${d.kind || 'door'}${d.width ? ' ' + fmtFt(d.width) : ''}${d.removed ? ' (opening)' : ''}`).join(', ') || 'none';
    const wins = r.windows == null ? '—' : String(r.windows);
    const stairs = (r.stairs || []).map((s) => s.dir ? `${s.name || 'stair'} ${s.dir}` : (s.name || 'stair')).join(', ') || 'none';
    const typ = r.outside ? 'exterior' : (r.floor || 'interior');
    const notes = (r.notes || []).map((n) => `<li>${escapeHtml(n)}</li>`).join('');
    bits.push(`<article class="pr-room${r.flags && r.flags.length ? ' pr-flag' : ''}">
      <h3>${escapeHtml(r.name)} <small>${escapeHtml(typ)}</small></h3>
      <div class="pr-grid">
        <div><span>Size</span>${escapeHtml(r.sizeLabel)} · ${fmtArea(r.area)}</div>
        <div><span>Wall heights</span>${escapeHtml(heights)}</div>
        <div><span>Doors</span>${escapeHtml(doors)}</div>
        <div><span>Windows</span>${escapeHtml(wins)}</div>
        <div><span>Stairs</span>${escapeHtml(stairs)}</div>
      </div>
      ${flags ? `<ul class="pr-flags">${flags}</ul>` : ''}
      ${notes ? `<ul class="pr-notes">${notes}</ul>` : ''}
    </article>`);
  }
  body.innerHTML = bits.join('');
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function refreshPlanReadout() {
  if (!$('planReadout') || $('planReadout').hidden) return;
  if (window.app && typeof window.app.planReadout === 'function') renderReadout(window.app.planReadout());
}

export function togglePlanReadout(force) {
  const panel = $('planReadout');
  const btn = $('bReadout');
  if (!panel) return;
  const open = force == null ? panel.hidden : !!force;
  panel.hidden = !open;
  if (btn) btn.classList.toggle('on', open);
  if (open) refreshPlanReadout();
}

function bindJoystick() {
  const base = $('joystick');
  const knob = $('joystickKnob');
  if (!base || !knob) return;
  let active = null;
  const set = (ax, ay) => {
    if (window.app.setWalkStick) window.app.setWalkStick(ax, ay);
    const r = 28;
    knob.style.transform = `translate(${ax * r}px, ${ay * r}px)`;
  };
  const fromEvent = (e) => {
    const rec = base.getBoundingClientRect();
    const cx = rec.left + rec.width / 2, cy = rec.top + rec.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    const max = rec.width * 0.42;
    const k = Math.min(1, len / max);
    set((dx / len) * k, (dy / len) * k);
  };
  const down = (e) => {
    e.preventDefault(); e.stopPropagation();
    active = e.pointerId;
    try { base.setPointerCapture(e.pointerId); } catch {}
    fromEvent(e);
  };
  const move = (e) => { if (active == null || e.pointerId !== active) return; e.preventDefault(); fromEvent(e); };
  const up = (e) => { if (active != null && e.pointerId !== active) return; active = null; set(0, 0); };
  base.addEventListener('pointerdown', down);
  base.addEventListener('pointermove', move);
  base.addEventListener('pointerup', up);
  base.addEventListener('pointercancel', up);
  base.addEventListener('pointerleave', (e) => { if (e.pointerId === active) up(e); });
}

export function mountShowcase() {
  const readoutBtn = $('bReadout');
  if (readoutBtn) readoutBtn.addEventListener('click', () => togglePlanReadout());
  const close = $('planReadoutClose');
  if (close) close.addEventListener('click', () => togglePlanReadout(false));
  const doll = $('bDollhouse');
  if (doll) doll.addEventListener('click', () => {
    togglePlanReadout(false);
    if (window.app && window.app.setDollhouse) window.app.setDollhouse();
  });
  bindJoystick();
  addEventListener('peakstead-plan-changed', refreshPlanReadout);
  addEventListener('peakstead-toggle-readout', (e) => togglePlanReadout(!!(e.detail && e.detail.open)));
}

function bootShowcase() { mountShowcase(); mountClientTour(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootShowcase);
else bootShowcase();
