// PeakStead Designs — Free Draw: sketch a house, then see it as a 2D plan and a 3D model.
import { $, esc, api, me, header, toast } from '/js/common.js';
import { loginUrlFor } from '/js/example-save.js';
import { upload } from '/js/blob-client.js';
import { interpretSketch, LABEL_TYPES, SAMPLE_SKETCHES } from '/js/freedraw-interpret.js';

const LS = 'peakstead-freedraw-v1';
const LS_MODEL = 'peakstead-freedraw-model';
const BOARD = { w: 1200, h: 800 };
const INK = { wall: '#2b2f33', door: '#c4552d', window: '#2f74b5' };

const pad = $('#pad');
const ctx = pad.getContext('2d');
const stage = $('#stage');
const frame = $('#viewer');
const resultEl = $('#result');
const statsEl = $('#stats');

let user = null;
let sketch = { strokes: [], labels: [] };
let size = { mode: 'dims', width: 56, depth: 30, sqft: 1800 };
let tool = 'wall';
let labelType = 'living';
let view = 'sketch';
let undoStack = [], redoStack = [];
let result = null;      // last interpretSketch() result
let stale = true;       // sketch changed since the last plan
let fit = { s: 1, ox: 0, oy: 0 };
let drawing = null;     // { id, stroke }
let penSeen = false;
let frameReady = false;

/* ---------- state ---------- */
function persist() {
  try { localStorage.setItem(LS, JSON.stringify({ v: 1, sketch, size })); } catch {}
}
function restore() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS) || 'null');
    if (raw && raw.sketch) { sketch = raw.sketch; size = { ...size, ...(raw.size || {}) }; return true; }
  } catch {}
  return false;
}
function snapshot() { return JSON.stringify(sketch); }
function record() { undoStack.push(snapshot()); if (undoStack.length > 120) undoStack.shift(); redoStack = []; }
function changed() { stale = true; persist(); updateButtons(); render(); }

/* ---------- board <-> screen ---------- */
function resize() {
  const r = pad.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  pad.width = Math.max(1, Math.round(r.width * dpr));
  pad.height = Math.max(1, Math.round(r.height * dpr));
  const s = Math.min(r.width / BOARD.w, r.height / BOARD.h) * 0.96;
  fit = { s, ox: (r.width - BOARD.w * s) / 2, oy: (r.height - BOARD.h * s) / 2, dpr };
  render();
}
const toBoard = (e) => {
  const r = pad.getBoundingClientRect();
  return [(e.clientX - r.left - fit.ox) / fit.s, (e.clientY - r.top - fit.oy) / fit.s];
};

/* ---------- drawing ---------- */
function render() {
  const { s, ox, oy, dpr = 1 } = fit;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, pad.width, pad.height);
  ctx.save();
  ctx.translate(ox, oy); ctx.scale(s, s);
  // Paper with a light grid.
  ctx.fillStyle = '#fbfaf6'; ctx.fillRect(0, 0, BOARD.w, BOARD.h);
  ctx.lineWidth = 1 / s;
  for (let x = 0; x <= BOARD.w; x += 20) { ctx.strokeStyle = x % 100 ? 'rgba(60,110,160,.08)' : 'rgba(60,110,160,.18)'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BOARD.h); ctx.stroke(); }
  for (let y = 0; y <= BOARD.h; y += 20) { ctx.strokeStyle = y % 100 ? 'rgba(60,110,160,.08)' : 'rgba(60,110,160,.18)'; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BOARD.w, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.strokeRect(0, 0, BOARD.w, BOARD.h);

  const showClean = $('#showClean').checked && result && result.ok && !stale;
  if (showClean) {
    // Room fills under the ink.
    for (const rm of result.rooms) {
      ctx.fillStyle = rm.type === 'garage' ? 'rgba(139,144,152,.16)' : rm.type === 'porch' ? 'rgba(201,184,151,.22)' : 'rgba(224,169,90,.13)';
      for (const q of rm.rects) ctx.fillRect(q.x0, q.y0, q.x1 - q.x0, q.y1 - q.y0);
    }
  }
  // Ink.
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const st of sketch.strokes) drawStroke(st, showClean ? 0.45 : 1);
  if (drawing) drawStroke(drawing.stroke, 1);
  if (showClean) {
    ctx.lineCap = 'square';
    for (const l of result.cleaned) {
      ctx.strokeStyle = l.kind === 'ext' ? '#b06a1c' : '#d08a33';
      ctx.lineWidth = l.kind === 'ext' ? 6 : 3.5;
      ctx.beginPath(); ctx.moveTo(l.x0, l.y0); ctx.lineTo(l.x1, l.y1); ctx.stroke();
    }
    ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(176,106,28,.8)'; ctx.lineWidth = 2;
    for (const d of result.diags) { ctx.beginPath(); ctx.moveTo(d.p[0], d.p[1]); ctx.lineTo(d.q[0], d.q[1]); ctx.stroke(); }
    ctx.setLineDash([]);
    for (const o of result.openings) {
      const half = o.len / 2;
      ctx.strokeStyle = o.kind === 'win' ? '#2f74b5' : (o.garage ? '#6b7178' : '#fbfaf6');
      ctx.lineWidth = o.kind === 'win' ? 4 : 7;
      ctx.beginPath();
      if (o.horiz) { ctx.moveTo(o.x - half, o.y); ctx.lineTo(o.x + half, o.y); } else { ctx.moveTo(o.x, o.y - half); ctx.lineTo(o.x, o.y + half); }
      ctx.stroke();
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const rm of result.rooms) {
      ctx.font = '700 15px -apple-system, Segoe UI, sans-serif'; ctx.fillStyle = '#3a2a14';
      ctx.fillText(rm.name, rm.cx, rm.cy - 8);
      ctx.font = '600 12px -apple-system, Segoe UI, sans-serif'; ctx.fillStyle = '#6b5a44';
      ctx.fillText(rm.dims, rm.cx, rm.cy + 9);
    }
  }
  // Label chips.
  if (!showClean) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 15px -apple-system, Segoe UI, sans-serif';
    for (const lb of sketch.labels) {
      const t = (LABEL_TYPES.find((x) => x.id === lb.type) || {}).label || lb.type;
      const w = ctx.measureText(t).width + 18;
      ctx.fillStyle = 'rgba(224,169,90,.92)';
      roundRect(lb.x - w / 2, lb.y - 13, w, 26, 13); ctx.fill();
      ctx.fillStyle = '#1d1d1d'; ctx.fillText(t, lb.x, lb.y + 1);
    }
  }
  ctx.restore();
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function drawStroke(st, alpha) {
  const pts = st.pts;
  if (!pts.length) return;
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = INK[st.tool] || INK.wall;
  ctx.lineWidth = st.tool === 'wall' ? 3.2 : 4.5;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 1) ctx.lineTo(pts[0][0] + 0.1, pts[0][1] + 0.1);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  if (st.tool !== 'wall') {
    const c = pts[Math.floor(pts.length / 2)];
    ctx.fillStyle = INK[st.tool]; ctx.font = '700 11px -apple-system, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(st.tool === 'door' ? 'D' : 'W', c[0], c[1] - 12);
  }
  ctx.globalAlpha = 1;
}

/* ---------- input (mouse, touch, Apple Pencil) ---------- */
pad.addEventListener('pointerdown', (e) => {
  if (view !== 'sketch') return;
  if (e.pointerType === 'pen') penSeen = true;
  if (penSeen && e.pointerType === 'touch') return; // palm rejection once a pencil is in use
  if (drawing) return;
  e.preventDefault();
  const p = toBoard(e);
  if (tool === 'label') { record(); placeLabel(p); changed(); return; }
  if (tool === 'erase') { const hit = eraseAt(p); if (hit) changed(); return; }
  pad.setPointerCapture(e.pointerId);
  drawing = { id: e.pointerId, stroke: { tool, pts: [p] } };
  render();
});
pad.addEventListener('pointermove', (e) => {
  if (!drawing || e.pointerId !== drawing.id) return;
  const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const ev of (list.length ? list : [e])) {
    const p = toBoard(ev);
    const last = drawing.stroke.pts[drawing.stroke.pts.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= 1.5) drawing.stroke.pts.push([Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]);
  }
  render();
});
function endStroke(e) {
  if (!drawing || e.pointerId !== drawing.id) return;
  const st = drawing.stroke; drawing = null;
  const len = st.pts.reduce((t, p, i) => i ? t + Math.hypot(p[0] - st.pts[i - 1][0], p[1] - st.pts[i - 1][1]) : 0, 0);
  if (st.tool === 'wall' && len < 12) { render(); return; }
  record();
  sketch.strokes.push(st);
  changed();
}
pad.addEventListener('pointerup', endStroke);
pad.addEventListener('pointercancel', endStroke);

function placeLabel(p) {
  sketch.labels = sketch.labels.filter((l) => Math.hypot(l.x - p[0], l.y - p[1]) > 40);
  sketch.labels.push({ x: Math.round(p[0]), y: Math.round(p[1]), type: labelType });
}
function eraseAt(p) {
  const li = sketch.labels.findIndex((l) => Math.hypot(l.x - p[0], l.y - p[1]) < 30);
  if (li >= 0) { record(); sketch.labels.splice(li, 1); return true; }
  let best = -1, bestD = 14;
  sketch.strokes.forEach((st, i) => {
    for (let k = 0; k < st.pts.length; k++) {
      const a = st.pts[k], b = st.pts[k + 1] || a;
      const d = segDist(p, a, b);
      if (d < bestD) { bestD = d; best = i; }
    }
  });
  if (best >= 0) { record(); sketch.strokes.splice(best, 1); return true; }
  return false;
}
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = dx * dx + dy * dy;
  let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/* ---------- side panel ---------- */
function setTool(t) {
  tool = t;
  document.querySelectorAll('.tools button').forEach((b) => b.classList.toggle('on', b.dataset.tool === t));
  $('#labelPick').hidden = t !== 'label';
  const hints = {
    wall: 'Draw the outside walls of your house, then the inside walls. Lines don\'t need to be straight.',
    door: 'Draw a short line across a wall where you want a door. The first one on an outside wall becomes the front door.',
    window: 'Draw a short line along an outside wall for each window. If you mark none, windows are added for you.',
    label: 'Pick a room name, then tap inside that room.',
    erase: 'Tap a line, mark, or label to erase it.',
  };
  $('#hint').textContent = hints[t];
}
document.querySelectorAll('.tools button').forEach((b) => { b.onclick = () => setTool(b.dataset.tool); });
$('#labelPick').innerHTML = LABEL_TYPES.map((t) => `<button type="button" data-type="${t.id}">${esc(t.label)}</button>`).join('');
const markLabel = () => document.querySelectorAll('#labelPick button').forEach((b) => b.classList.toggle('on', b.dataset.type === labelType));
document.querySelectorAll('#labelPick button').forEach((b) => { b.onclick = () => { labelType = b.dataset.type; markLabel(); }; });
markLabel();

$('#undo').onclick = () => { if (!undoStack.length) return; redoStack.push(snapshot()); sketch = JSON.parse(undoStack.pop()); changed(); };
$('#redo').onclick = () => { if (!redoStack.length) return; undoStack.push(snapshot()); sketch = JSON.parse(redoStack.pop()); changed(); };
$('#clear').onclick = () => {
  if (!sketch.strokes.length && !sketch.labels.length) return;
  if (!confirm('Clear your sketch?')) return;
  record(); sketch = { strokes: [], labels: [] }; result = null; changed(); setView('sketch');
};
$('#sample').onchange = (e) => {
  const k = e.target.value; e.target.value = '';
  if (!k || !SAMPLE_SKETCHES[k]) return;
  record();
  sketch = SAMPLE_SKETCHES[k]();
  const dims = { ranch: [56, 26], cottage: [36, 22], lshape: [52, 30] }[k];
  if (dims) { size.mode = 'dims'; size.width = dims[0]; size.depth = dims[1]; syncSizeUi(); }
  result = null; changed(); setView('sketch');
};
addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, select')) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); (e.shiftKey ? $('#redo') : $('#undo')).click(); }
});

function syncSizeUi() {
  document.querySelectorAll('#sizeMode button').forEach((b) => b.classList.toggle('on', b.dataset.mode === size.mode));
  $('#dimsRow').hidden = size.mode !== 'dims';
  $('#sqftRow').hidden = size.mode !== 'sqft';
  $('#w').value = size.width; $('#d').value = size.depth; $('#sf').value = size.sqft;
}
document.querySelectorAll('#sizeMode button').forEach((b) => { b.onclick = () => { size.mode = b.dataset.mode; syncSizeUi(); stale = true; persist(); updateButtons(); render(); }; });
for (const [id, key] of [['w', 'width'], ['d', 'depth'], ['sf', 'sqft']]) {
  $('#' + id).addEventListener('input', (e) => { size[key] = +e.target.value; stale = true; persist(); updateButtons(); render(); });
}
$('#showClean').onchange = render;

/* ---------- make my plan ---------- */
function makePlan({ quiet = false } = {}) {
  result = interpretSketch(sketch, size);
  stale = false;
  if (!result.ok) {
    resultEl.hidden = false;
    resultEl.innerHTML = `<p class="err">${esc(result.error)}</p>`;
    statsEl.innerHTML = '';
    updateButtons(); render();
    if (!quiet) toast(result.error, 3200);
    return false;
  }
  const s = result.stats;
  statsEl.innerHTML = `<span class="sf">≈ ${s.heated.toLocaleString()} sq ft</span>`
    + (s.garage ? `<span><b>${s.garage.toLocaleString()}</b> sf garage</span>` : '')
    + (s.porch ? `<span><b>${s.porch.toLocaleString()}</b> sf porch</span>` : '')
    + `<span><b>${s.width}′ × ${s.depth}′</b></span>`;
  resultEl.hidden = false;
  resultEl.innerHTML = `<b>${result.rooms.length} rooms found</b><ul>${result.rooms.map((r) => `<li>${esc(r.name)} <span class="muted">· ${esc(r.dims)}</span></li>`).join('')}</ul>`
    + result.warnings.map((w) => `<p class="warn">${esc(w)}</p>`).join('');
  try { localStorage.setItem(LS_MODEL, JSON.stringify(result.model)); } catch {}
  frameReady = false; // reload the model into the viewer on next view
  updateButtons(); render();
  return true;
}
$('#make').onclick = () => { if (makePlan()) { setView('2d'); } };

function updateButtons() {
  const ready = !!(result && result.ok && !stale);
  $('#v2d').disabled = !ready; $('#v3d').disabled = !ready;
  $('#save').disabled = !ready;
  $('#make').textContent = result && result.ok && stale ? 'Update my plan' : 'Make my plan';
}

/* ---------- views: Sketch / 2D Plan / 3D Model ---------- */
function setView(v) {
  if (v !== 'sketch' && !(result && result.ok && !stale)) v = 'sketch';
  view = v;
  $('#vSketch').classList.toggle('on', v === 'sketch');
  $('#v2d').classList.toggle('on', v === '2d');
  $('#v3d').classList.toggle('on', v === '3d');
  stage.classList.toggle('viewing', v !== 'sketch');
  frame.hidden = v === 'sketch';
  if (v === 'sketch') { requestAnimationFrame(resize); return; }
  showInViewer(v);
}
$('#vSketch').onclick = () => setView('sketch');
$('#v2d').onclick = () => setView('2d');
$('#v3d').onclick = () => setView('3d');

function showInViewer(v) {
  const model = result.model;
  const apply = () => {
    const app = frame.contentWindow && frame.contentWindow.app;
    if (!app) return;
    try {
      const doc = frame.contentDocument;
      const hud = doc && doc.getElementById('hud');
      if (hud && !hud.dataset.fdCollapsed) { hud.dataset.fdCollapsed = '1'; if (!hud.classList.contains('collapsed')) doc.getElementById('toggleHud')?.click(); }
    } catch {}
    try { app.setPlan2d && app.setPlan2d(v === '2d'); } catch (err) { console.warn(err); }
    if (v === '3d' && !frame.dataset.fronted) { frame.dataset.fronted = '1'; frontView(app); }
  };
  if (!frame.dataset.loaded) {
    frame.dataset.loaded = '1';
    frame.addEventListener('load', () => {
      waitForApp().then(() => { post(model); frameReady = true; setTimeout(apply, 200); });
    }, { once: true });
    frame.src = '/viewer?embed=1&nowelcome=1';
    return;
  }
  if (!frameReady) { post(model); frameReady = true; delete frame.dataset.fronted; setTimeout(apply, 250); return; }
  apply();
}
// Start the 3D view from the front (south, the bottom of the sketch), a little to one side.
function frontView(app) {
  try {
    const rooms = app.getRooms();
    if (!rooms.length) return;
    const x0 = Math.min(...rooms.map((r) => r[3])), x1 = Math.max(...rooms.map((r) => r[5]));
    const y0 = Math.min(...rooms.map((r) => r[4])), y1 = Math.max(...rooms.map((r) => r[6]));
    const w = x1 - x0, d = y1 - y0, big = Math.max(w, d);
    const [tx, tz] = app.planToWorld((x0 + x1) / 2, (y0 + y1) / 2);
    const [px, pz] = app.planToWorld(x0 + w * 0.2, y1 + big * 0.85);
    if (app.setMode) app.setMode('orbit', true);
    app.orbit.target.set(tx, 3, tz);
    app.camera.position.set(px, big * 0.5, pz);
    app.orbit.update();
  } catch (err) { console.warn(err); }
}
function post(model) {
  try { frame.contentWindow.postMessage({ type: 'peakstead-builder-model', model, view: 'orbit' }, location.origin); } catch {}
}
function waitForApp(timeout = 30000) {
  const t0 = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      const app = frame.contentWindow && frame.contentWindow.app;
      if (app && app.setPlan2d) return resolve(app);
      if (Date.now() - t0 > timeout) return resolve(null);
      setTimeout(tick, 120);
    };
    tick();
  });
}

/* ---------- save to My Projects (then keep going in Edit Plan) ---------- */
const safeName = (n) => n.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+/, '').slice(-80) || 'file';
async function sketchThumb() {
  const keep = $('#showClean').checked;
  $('#showClean').checked = true; render();
  const out = document.createElement('canvas'); out.width = 1000; out.height = 625;
  const g = out.getContext('2d');
  g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, 1000, 625);
  g.drawImage(pad, 0, 0, pad.width, pad.height, 0, 0, 1000, 625);
  $('#showClean').checked = keep; render();
  return await new Promise((resolve) => out.toBlob(resolve, 'image/jpeg', 0.86));
}
async function saveToProjects() {
  if (!(result && result.ok && !stale) && !makePlan()) return;
  const model = { ...result.model, freedraw: { v: 1, sketch, size } };
  if (!user) { location.href = loginUrlFor('/freedraw?save=1'); return; }
  const btn = $('#save');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const name = 'Free Draw home';
    const { project } = await api('projects', { method: 'POST', body: { name, buildType: 'home' } });
    const file = new File([JSON.stringify({ ...model, title: name, name }, null, 2)], 'free-draw-plan.json', { type: 'application/json' });
    const blob = await upload(`files/${user.id}/${project.id}/${safeName(file.name)}`, file, {
      access: 'private', handleUploadUrl: '/api/upload',
      clientPayload: JSON.stringify({ pid: project.id, kind: 'model' }), contentType: 'application/json',
    });
    await api(`projects/${encodeURIComponent(project.id)}/files`, { method: 'POST', body: { pathname: blob.pathname, name: file.name, kind: 'model' } });
    try {
      const tb = await sketchThumb();
      if (tb) {
        const tf = new File([tb], 'thumb.jpg', { type: 'image/jpeg' });
        const up = await upload(`files/${user.id}/${project.id}/thumb.jpg`, tf, {
          access: 'private', handleUploadUrl: '/api/upload',
          clientPayload: JSON.stringify({ pid: project.id, kind: 'thumb' }), contentType: 'image/jpeg',
        });
        await api(`projects/${encodeURIComponent(project.id)}/files`, { method: 'POST', body: { pathname: up.pathname, name: 'thumb.jpg', kind: 'thumb' } });
      }
    } catch (err) { console.warn('Could not save the sketch thumbnail', err); }
    toast('Saved to My projects. Use Edit Plan to keep going.', 3200);
    location.href = '/viewer?p=' + encodeURIComponent(project.id);
  } catch (e) {
    toast(e.message || 'Could not save');
    btn.disabled = false; btn.textContent = 'Save to My Projects';
  }
}
$('#save').onclick = saveToProjects;

window.__psFreeDraw = {
  getSketch: () => sketch, setSketch: (s) => { sketch = s; changed(); }, setSize: (o) => { size = { ...size, ...o }; syncSizeUi(); changed(); },
  makePlan, setView, result: () => result, toBoard, boardToClient: (x, y) => { const r = pad.getBoundingClientRect(); return [r.left + fit.ox + x * fit.s, r.top + fit.oy + y * fit.s]; },
  frame: () => frame,
};

/* ---------- boot ---------- */
(async function boot() {
  user = await me().catch(() => null);
  header(user, 'freedraw');
  restore();
  syncSizeUi();
  setTool('wall');
  addEventListener('resize', resize);
  resize();
  updateButtons();
  const params = new URLSearchParams(location.search);
  if (params.get('save') === '1') {
    const u = new URL(location.href); u.searchParams.delete('save'); history.replaceState(null, '', u.pathname + u.search);
    if (user && sketch.strokes.length && makePlan({ quiet: true })) await saveToProjects();
  }
})();
