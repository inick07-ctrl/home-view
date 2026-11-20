// PeakStead Designs — Builder workspace: drag, snap, compile, 3D preview, save.
import { $, esc, api, me, header, toast } from '/js/common.js';
import { loadPrefs, estimateBuild, fmtRange } from '/js/cost-estimator.js';
import { loginUrlFor } from '/js/example-save.js';
import { upload } from '/js/blob-client.js';
import {
  ROOM_TYPES, TYPE_BY_ID, TEMPLATES, templateById, defaultSizeKey, newBlock, newId,
  rotateBlock, snapGrid, snapPlacement, findOverlaps, onLot, isStaging, overlapArea,
  compileModel, serializeModel, planStats, formatDims, STAGING_TOP,
  blockEdges, addRemovedWall,
} from '/js/builder-catalog.js';
import { extrasFromItems } from '/js/yard-extras.js';

const LS_STATE = 'peakstead-builder-v1';
const LS_MODEL = 'peakstead-builder-draft-model';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
const bodyEl = $('#body');
const inspector = $('#inspector');
const warnEl = $('#warn');
const statsEl = $('#stats');
const hint = $('#hint');
const frame = $('#view3dFrame');
const previewEmpty = $('#previewEmpty');

let user = null;
let blocks = [];
let selectedId = null;
let paletteType = 'living';
let paletteSize = {};
let viewMode = '2d'; // 2d | split | 3d
let camera = { x: -4, y: -28, scale: 16 }; // world origin in px, px/ft
let drag = null; // { kind, id, ox, oy, start, handle }
let guide = null;
let hoverId = null;
let selectedWall = null;
let hoverWall = null;
let history = [];
let future = [];
let dirty3d = true;
let previewTimer = 0;

ROOM_TYPES.forEach((t) => { paletteSize[t.id] = defaultSizeKey(t.id); });

function cloneBlocks(list = blocks) {
  return list.map((b) => ({ ...b }));
}

function pushHistory() {
  history.push(JSON.stringify(cloneBlocks()));
  if (history.length > 80) history.shift();
  future = [];
  persist();
}

function persist() {
  try { localStorage.setItem(LS_STATE, JSON.stringify({ blocks: cloneBlocks(), viewMode, camera, v: 1 })); } catch {}
  updateStats();
  schedulePreview();
}

function restore() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_STATE) || 'null');
    if (raw && Array.isArray(raw.blocks) && raw.blocks.length) {
      blocks = raw.blocks.map((b) => ({ ...b, id: b.id || newId() }));
      if (raw.camera) camera = { ...camera, ...raw.camera };
      if (raw.viewMode) viewMode = raw.viewMode;
      return true;
    }
  } catch {}
  return false;
}

function applyTemplate(id, { record = true } = {}) {
  if (record) pushHistory();
  const t = templateById(id);
  blocks = t.build();
  selectedId = null;
  fitCamera();
  persist();
  render();
  toast('Loaded ' + t.name);
}

function fitCamera() {
  const lot = blocks.length ? blocks : [{ x: 0, y: 0, w: 40, d: 30 }];
  const x0 = Math.min(...lot.map((b) => b.x)) - 6;
  const y0 = Math.min(...lot.map((b) => b.y)) - 8;
  const x1 = Math.max(...lot.map((b) => b.x + b.w)) + 6;
  const y1 = Math.max(...lot.map((b) => b.y + b.d)) + 6;
  const w = canvas.clientWidth || 800, h = canvas.clientHeight || 600;
  const scale = Math.max(10, Math.min(22, Math.min(w / Math.max(20, x1 - x0), h / Math.max(16, y1 - y0)) * 0.92));
  camera.scale = scale;
  camera.x = -((x0 + x1) / 2) * scale + w / 2;
  camera.y = -((y0 + y1) / 2) * scale + h / 2;
}

function toWorld(px, py) {
  return { x: (px - camera.x) / camera.scale, y: (py - camera.y) / camera.scale };
}
function toScreen(x, y) {
  return { x: x * camera.scale + camera.x, y: y * camera.scale + camera.y };
}

function resizeCanvas() {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, r.width * dpr);
  canvas.height = Math.max(1, r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
}

function updateStats() {
  const s = planStats(blocks);
  const overlaps = countOverlaps();
  const prefs = loadPrefs();
  const extras = extrasFromBuilder(blocks);
  const est = s.rooms ? estimateBuild({ heatedSqFt: s.heated, garageSqFt: s.garage, porchSqFt: s.porch || 0, buildType: 'home', zip: prefs.zip, tier: prefs.tier, extras }) : null;
  statsEl.innerHTML = s.rooms
    ? `<span class="sf"><b>${s.heated.toLocaleString()}</b> sf heated</span>` +
      (s.garage ? `<span><b>${s.garage.toLocaleString()}</b> sf garage</span>` : '') +
      (est && est.mid ? `<span class="sf" title="${fmtRange(est)} mid, land not included">${fmtRange(est, { compact: true })}</span>` : '') +
      `<span>Footprint <b>${s.width}' × ${s.depth}'</b></span>` +
      `<span><b>${s.rooms}</b> room${s.rooms === 1 ? '' : 's'}</span>`
    : `<span>Drag a room onto the lot to start</span>`;
  if (overlaps) {
    warnEl.hidden = false;
    warnEl.textContent = overlaps === 1 ? 'Two rooms overlap' : `${overlaps} rooms overlap`;
  } else warnEl.hidden = true;
}

function extrasFromBuilder(list) {
  let poolSf = 0, spaCount = 0, solarKw = 0;
  for (const b of (list || []).filter(onLot)) {
    const typ = TYPE_BY_ID[b.type] || {};
    if (typ.feature === 'pool') {
      if (b.sizeKey === 'spa') spaCount += 1;
      else poolSf += (b.w || 0) * (b.d || 0);
    } else if (typ.feature === 'solar-ground' || typ.feature === 'solar-roof') {
      solarKw += (parseInt(b.sizeKey, 10) || 12) * 0.4;
    }
  }
  return { poolSf, spaCount, solarKw };
}

function distToEdge(wx, wy, e) {
  if (e.horiz) {
    if (wx < Math.min(e.a, e.b) || wx > Math.max(e.a, e.b)) {
      const cx = (e.a + e.b) / 2;
      return Math.hypot(wx - cx, wy - e.c);
    }
    return Math.abs(wy - e.c);
  }
  if (wy < Math.min(e.a, e.b) || wy > Math.max(e.a, e.b)) {
    const cy = (e.a + e.b) / 2;
    return Math.hypot(wx - e.c, wy - cy);
  }
  return Math.abs(wx - e.c);
}

function wallAt(wx, wy, maxFt = 0.7) {
  let best = null, bestD = maxFt;
  for (const b of blocks.filter(onLot)) {
    if ((TYPE_BY_ID[b.type] || {}).feature) continue;
    const edges = blockEdges(b);
    for (const e of Object.values(edges)) {
      const d = distToEdge(wx, wy, e);
      if (d < bestD) {
        bestD = d;
        best = { blockId: b.id, side: e.side, s: e.a, e: e.b, horiz: e.horiz, c: e.c };
      }
    }
  }
  if (best) {
    const b = blocks.find((x) => x.id === best.blockId);
    const other = neighborOnSide(b, best.side);
    if (other) {
      best.otherId = other.block.id;
      best.otherSide = other.side;
      best.os = other.s;
      best.oe = other.e;
    }
  }
  return best;
}

function neighborOnSide(b, side) {
  if (!b) return null;
  const edges = blockEdges(b);
  const e = edges[side];
  for (const o of blocks.filter(onLot)) {
    if (o.id === b.id || (TYPE_BY_ID[o.type] || {}).feature) continue;
    const oe = blockEdges(o);
    const opp = { n: 's', s: 'n', e: 'w', w: 'e' }[side];
    const f = oe[opp];
    if (!f) continue;
    if (Math.abs(f.c - e.c) > 0.6) continue;
    const overlap = Math.min(e.b, f.b) - Math.max(e.a, f.a);
    if (overlap > 1) return { block: o, side: opp, s: Math.max(e.a, f.a), e: Math.min(e.b, f.b) };
  }
  return null;
}

function removeSelectedWall() {
  if (!selectedWall) return;
  const b = blocks.find((x) => x.id === selectedWall.blockId);
  if (!b) return;
  pushHistory();
  const next = addRemovedWall(b, selectedWall.side, selectedWall.s, selectedWall.e);
  Object.assign(b, next);
  if (selectedWall.otherId) {
    const o = blocks.find((x) => x.id === selectedWall.otherId);
    if (o) Object.assign(o, addRemovedWall(o, selectedWall.otherSide, selectedWall.os ?? selectedWall.s, selectedWall.oe ?? selectedWall.e));
  }
  selectedWall = null;
  persist();
  render();
}

function countOverlaps() {

  const lot = blocks.filter(onLot);
  let n = 0;
  for (let i = 0; i < lot.length; i++) {
    for (let j = i + 1; j < lot.length; j++) if (overlapArea(lot[i], lot[j]) > 0.25) n++;
  }
  return n;
}

function selected() { return blocks.find((b) => b.id === selectedId) || null; }

/* ---------- palette ---------- */
function renderPalette() {
  const list = $('#paletteList');
  list.innerHTML = '';
  let group = '';
  for (const t of ROOM_TYPES) {
    if (t.group !== group) {
      group = t.group;
      const g = document.createElement('div');
      g.className = 'pal-group';
      g.textContent = group;
      list.appendChild(g);
    }
    const card = document.createElement('div');
    card.className = 'pal-card' + (paletteType === t.id ? ' on' : '');
    card.draggable = true;
    card.dataset.type = t.id;
    const keys = Object.keys(t.sizes);
    const cur = paletteSize[t.id] || keys[0];
    const [w, d] = t.sizes[cur];
    card.innerHTML = `<div class="row-top"><span class="swatch" style="background:${t.color}"></span><span class="nm">${esc(t.name)}</span></div>
      <div class="pills">${keys.map((k) => `<button type="button" data-size="${k}" class="${k === cur ? 'on' : ''}">${labelSize(k)}${k === cur ? ` ${w}×${d}` : ''}</button>`).join('')}</div>`;
    card.addEventListener('click', (e) => {
      if (e.target.dataset.size) {
        paletteSize[t.id] = e.target.dataset.size;
        paletteType = t.id;
        renderPalette();
        return;
      }
      paletteType = t.id;
      renderPalette();
    });
    card.addEventListener('dragstart', (e) => {
      paletteType = t.id;
      e.dataTransfer.setData('text/peakstead-room', JSON.stringify({ type: t.id, size: paletteSize[t.id] }));
      e.dataTransfer.effectAllowed = 'copy';
    });
    list.appendChild(card);
  }
}
function labelSize(k) {
  if (k === 'compact') return 'Compact';
  if (k === 'medium') return 'Medium';
  if (k === 'large') return 'Large';
  if (k === '3-car') return '3-Car';
  return k;
}

/* ---------- canvas draw ---------- */
function render() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  // paper lot
  ctx.fillStyle = '#d7ddcc';
  ctx.fillRect(0, 0, w, h);

  // staging band
  const st0 = toScreen(-80, STAGING_TOP - 2);
  const st1 = toScreen(200, 0);
  ctx.fillStyle = 'rgba(232, 222, 200, .95)';
  ctx.fillRect(0, st0.y, w, st1.y - st0.y);
  ctx.fillStyle = '#6b6254';
  ctx.font = '700 12px/1.2 system-ui, sans-serif';
  const label = toScreen(0, STAGING_TOP - 1.2);
  ctx.fillText('PARTS TRAY  —  drag these onto the lot', Math.max(12, label.x), label.y);

  drawGrid(w, h);
  // lot origin axes
  const o = toScreen(0, 0);
  ctx.strokeStyle = 'rgba(80,90,70,.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, o.y); ctx.lineTo(w, o.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(o.x, 0); ctx.lineTo(o.x, h); ctx.stroke();
  ctx.fillStyle = '#4a5346';
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText('LOT', o.x + 6, o.y + 14);

  for (const b of blocks) drawBlock(b, b.id === selectedId, b.id === hoverId);
  drawWallMarks();
  if (guide) drawGuide(guide);
  drawInspector();
}

function drawGrid(w, h) {
  const s = camera.scale;
  const step = s >= 14 ? 1 : s >= 8 ? 2 : 5;
  const p0 = toWorld(0, 0), p1 = toWorld(w, h);
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(70,80,60,.18)';
  ctx.lineWidth = 1;
  for (let x = Math.floor(p0.x / step) * step; x <= p1.x; x += step) {
    const p = toScreen(x, 0);
    ctx.moveTo(p.x, 0); ctx.lineTo(p.x, h);
  }
  for (let y = Math.floor(p0.y / step) * step; y <= p1.y; y += step) {
    const p = toScreen(0, y);
    ctx.moveTo(0, p.y); ctx.lineTo(w, p.y);
  }
  ctx.stroke();
}

function strokeWall(w, color, width) {
  if (!w) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'square';
  const a = w.horiz ? toScreen(w.s, w.c) : toScreen(w.c, w.s);
  const b = w.horiz ? toScreen(w.e, w.c) : toScreen(w.c, w.e);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  ctx.restore();
}

function drawWallMarks() {
  if (hoverWall && (!selectedWall || hoverWall.blockId !== selectedWall.blockId || hoverWall.side !== selectedWall.side)) {
    strokeWall(hoverWall, 'rgba(224,169,90,.85)', 5);
  }
  if (selectedWall) strokeWall(selectedWall, '#e0a95a', 7);
}

function drawBlock(b, sel, hover) {

  const t = TYPE_BY_ID[b.type] || {};
  const p = toScreen(b.x, b.y);
  const w = b.w * camera.scale, h = b.d * camera.scale;
  const overlapping = findOverlaps(blocks, b, b.id).length > 0;
  const r = Math.min(8, camera.scale * 0.45);
  ctx.save();
  roundRect(p.x, p.y, w, h, r);
  ctx.fillStyle = overlapping ? '#e0574f' : (t.color || '#ccc');
  ctx.globalAlpha = overlapping ? 0.72 : (isStaging(b) ? 0.85 : 0.95);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = sel ? '#1d1d1d' : hover ? 'rgba(20,24,28,.7)' : 'rgba(20,24,28,.35)';
  ctx.lineWidth = sel ? 2.6 : 1.2;
  ctx.stroke();
  if (sel) {
    ctx.strokeStyle = '#e0a95a';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(p.x - 4, p.y - 4, w + 8, h + 8);
    ctx.setLineDash([]);
    drawHandles(p.x, p.y, w, h);
  }
  // labels
  ctx.fillStyle = '#1d1d1d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const nameSize = Math.max(9, Math.min(14, Math.min(w, h) / 8));
  ctx.font = `700 ${nameSize}px/1.15 system-ui, sans-serif`;
  const cx = p.x + w / 2, cy = p.y + h / 2;
  wrapLabel(b.name, cx, cy - (h > 28 ? 7 : 0), w - 8);
  if (h > 28 && w > 40) {
    ctx.font = `500 ${Math.max(8, nameSize - 2)}px system-ui, sans-serif`;
    ctx.globalAlpha = 0.8;
    ctx.fillText(formatDims(b.w, b.d), cx, cy + nameSize);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function wrapLabel(text, x, y, maxW) {
  const words = String(text).split(' ');
  if (ctx.measureText(text).width <= maxW || words.length === 1) { ctx.fillText(text, x, y); return; }
  ctx.fillText(words.slice(0, -1).join(' '), x, y - 6);
  ctx.fillText(words[words.length - 1], x, y + 6);
}

function roundRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawHandles(x, y, w, h) {
  const pts = [
    [x, y, 'nw'], [x + w / 2, y, 'n'], [x + w, y, 'ne'],
    [x + w, y + h / 2, 'e'], [x + w, y + h, 'se'], [x + w / 2, y + h, 's'],
    [x, y + h, 'sw'], [x, y + h / 2, 'w'],
  ];
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#1d1d1d';
  ctx.lineWidth = 1;
  for (const [hx, hy] of pts) {
    ctx.beginPath(); ctx.rect(hx - 4, hy - 4, 8, 8); ctx.fill(); ctx.stroke();
  }
}

function handleAt(b, sx, sy) {
  const p = toScreen(b.x, b.y);
  const w = b.w * camera.scale, h = b.d * camera.scale;
  const pts = [
    [p.x, p.y, 'nw'], [p.x + w / 2, p.y, 'n'], [p.x + w, p.y, 'ne'],
    [p.x + w, p.y + h / 2, 'e'], [p.x + w, p.y + h, 'se'], [p.x + w / 2, p.y + h, 's'],
    [p.x, p.y + h, 'sw'], [p.x, p.y + h / 2, 'w'],
  ];
  for (const [hx, hy, name] of pts) {
    if (Math.abs(sx - hx) <= 7 && Math.abs(sy - hy) <= 7) return name;
  }
  return null;
}

function drawGuide(g) {
  ctx.save();
  ctx.strokeStyle = '#e0a95a';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  if (g.kind === 'v' && g.y0 != null) {
    const a = toScreen(g.x, g.y0), b = toScreen(g.x, g.y1);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  } else if (g.kind === 'h' && g.x0 != null) {
    const a = toScreen(g.x0, g.y), b = toScreen(g.x1, g.y);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  } else if (g.kind === 'v') {
    const a = toScreen(g.x, -40), b = toScreen(g.x, 80);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  } else if (g.kind === 'h') {
    const a = toScreen(-40, g.y), b = toScreen(80, g.y);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.restore();
}

function blockAt(wx, wy) {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.d) return b;
  }
  return null;
}

/* ---------- inspector ---------- */
function drawInspector() {
  if (selectedWall) {
    inspector.hidden = false;
    const b = blocks.find((x) => x.id === selectedWall.blockId);
    const name = b ? b.name : 'Wall';
    const kind = selectedWall.otherId ? 'Interior wall' : 'Exterior wall';
    inspector.innerHTML = `<h3>${esc(kind)}</h3>
      <p class="muted" style="margin:0 0 8px">${esc(name)} · ${selectedWall.side.toUpperCase()} edge</p>
      <div class="acts">
        <button type="button" class="btn small danger" data-act="del-wall">Remove wall</button>
      </div>
      <p class="muted" style="margin:8px 0 0">Rooms stay in place. Undo or Save as usual.</p>`;
    return;
  }
  const b = selected();
  if (!b) { inspector.hidden = true; return; }
  inspector.hidden = false;
  const t = TYPE_BY_ID[b.type] || {};
  const keys = Object.keys(t.sizes || {});
  inspector.innerHTML = `<h3>${esc(b.name)}</h3>
    <div class="pills" style="margin:0 0 8px">${keys.map((k) => `<button type="button" data-act="size" data-size="${k}" class="${b.sizeKey === k ? 'on' : ''}">${labelSize(k)}</button>`).join('')}</div>
    <div class="dims">
      <div><label>Width (ft)</label><input id="iw" type="number" min="3" max="80" step="1" value="${b.w}"></div>
      <div><label>Depth (ft)</label><input id="id" type="number" min="3" max="80" step="1" value="${b.d}"></div>
    </div>
    <div class="acts">
      <button type="button" class="btn small" data-act="rotate">Rotate 90°</button>
      <button type="button" class="btn small" data-act="dup">Duplicate</button>
      <button type="button" class="btn small danger" data-act="del">Remove</button>
    </div>`;
}

inspector.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  if (btn.dataset.act === 'del-wall') { removeSelectedWall(); return; }
  const b = selected(); if (!b) return;
  if (btn.dataset.act === 'rotate') rotateSelected();
  if (btn.dataset.act === 'dup') duplicateSelected();
  if (btn.dataset.act === 'del') deleteSelected();
  if (btn.dataset.act === 'size') applySize(b, btn.dataset.size);
});
inspector.addEventListener('change', (e) => {
  const b = selected(); if (!b) return;
  if (e.target.id === 'iw' || e.target.id === 'id') {
    pushHistory();
    const w = Math.max(3, Math.min(80, snapGrid(+(($('#iw') || {}).value) || b.w)));
    const d = Math.max(3, Math.min(80, snapGrid(+(($('#id') || {}).value) || b.d)));
    b.w = w; b.d = d; b.sizeKey = 'custom';
    if (b.y + b.d > 0) b.staging = false;
    persist(); render();
  }
});

function applySize(b, key) {
  const t = TYPE_BY_ID[b.type];
  if (!t?.sizes[key]) return;
  pushHistory();
  const [w, d] = t.sizes[key];
  // keep top-left; if currently rotated (w/d swapped vs catalog), swap the preset too
  const rotated = b.rot === 90 || (b.w === t.sizes[b.sizeKey]?.[1] && b.d === t.sizes[b.sizeKey]?.[0]);
  b.w = rotated ? d : w;
  b.d = rotated ? w : d;
  b.sizeKey = key;
  persist(); render();
}

function rotateSelected() {
  const b = selected(); if (!b) return;
  pushHistory();
  Object.assign(b, rotateBlock(b));
  persist(); render();
}
function duplicateSelected() {
  const b = selected(); if (!b) return;
  pushHistory();
  const copy = { ...b, id: newId(), x: b.x + 2, y: b.y + 2 };
  blocks.push(copy);
  selectedId = copy.id;
  persist(); render();
}
function deleteSelected() {
  if (selectedWall) { removeSelectedWall(); return; }
  const b = selected(); if (!b) return;
  pushHistory();
  blocks = blocks.filter((x) => x.id !== b.id);
  selectedId = null;
  persist(); render();
}

/* ---------- pointer ---------- */
function canvasPos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

canvas.addEventListener('pointerdown', (e) => {
  if (e.button === 1 || e.shiftKey || e.button === 2) return startPan(e);
  const p = canvasPos(e);
  const w = toWorld(p.x, p.y);
  const b = selected();
  if (b) {
    const h = handleAt(b, p.x, p.y);
    if (h) {
      pushHistory();
      drag = { kind: 'resize', id: b.id, handle: h, ox: w.x, oy: w.y, orig: { ...b } };
      canvas.setPointerCapture(e.pointerId);
      return;
    }
  }
  const edge = wallAt(w.x, w.y, 0.65);
  if (edge) {
    selectedWall = edge;
    selectedId = null;
    drag = null;
    render();
    return;
  }
  const hit = blockAt(w.x, w.y);
  if (hit) {
    selectedId = hit.id;
    selectedWall = null;
    pushHistory();
    drag = { kind: 'move', id: hit.id, ox: w.x - hit.x, oy: w.y - hit.y };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
    render();
    return;
  }
  selectedId = null;
  selectedWall = null;
  startPan(e);
  render();
});

function startPan(e) {
  const p = canvasPos(e);
  drag = { kind: 'pan', ox: p.x, oy: p.y, cx: camera.x, cy: camera.y };
  canvas.setPointerCapture(e.pointerId);
  canvas.classList.add('dragging');
}

canvas.addEventListener('pointermove', (e) => {
  const p = canvasPos(e);
  const w = toWorld(p.x, p.y);
  if (!drag) {
    const edge = wallAt(w.x, w.y, 0.7);
    const hit = blockAt(w.x, w.y);
    const cur = hit?.id || null;
    const wallKey = edge ? edge.blockId + edge.side : null;
    const prevKey = hoverWall ? hoverWall.blockId + hoverWall.side : null;
    if (cur !== hoverId || wallKey !== prevKey) { hoverId = cur; hoverWall = edge; render(); }
    if (selected()) {
      const h = handleAt(selected(), p.x, p.y);
      canvas.style.cursor = h ? resizeCursor(h) : (edge ? 'pointer' : (hit ? 'grab' : 'grab'));
    } else {
      canvas.style.cursor = edge ? 'pointer' : (hit ? 'grab' : 'grab');
    }
    return;
  }
  if (drag.kind === 'pan') {
    camera.x = drag.cx + (p.x - drag.ox);
    camera.y = drag.cy + (p.y - drag.oy);
    render();
    return;
  }
  const b = blocks.find((x) => x.id === drag.id);
  if (!b) return;
  if (drag.kind === 'move') {
    const raw = { ...b, x: w.x - drag.ox, y: w.y - drag.oy };
    const snapped = snapPlacement(blocks, raw, b.id);
    b.x = snapped.x; b.y = snapped.y;
    b.staging = (b.y + b.d <= 0);
    guide = snapped.guide;
    render();
    return;
  }
  if (drag.kind === 'resize') {
    resizeByHandle(b, drag.handle, w, drag.orig);
    b.staging = (b.y + b.d <= 0);
    guide = null;
    render();
  }
});

canvas.addEventListener('pointerup', () => {
  if (drag && (drag.kind === 'move' || drag.kind === 'resize')) persist();
  drag = null; guide = null;
  canvas.classList.remove('dragging');
  canvas.style.cursor = 'grab';
  render();
});
canvas.addEventListener('pointercancel', () => { drag = null; guide = null; canvas.classList.remove('dragging'); });

canvas.addEventListener('dblclick', (e) => {
  const p = canvasPos(e);
  const w = toWorld(p.x, p.y);
  if (blockAt(w.x, w.y)) return;
  // Place the currently selected palette type
  placeAt(paletteType, paletteSize[paletteType], w.x, w.y);
});

function resizeCursor(h) {
  if (h === 'n' || h === 's') return 'ns-resize';
  if (h === 'e' || h === 'w') return 'ew-resize';
  if (h === 'ne' || h === 'sw') return 'nesw-resize';
  return 'nwse-resize';
}

function resizeByHandle(b, handle, wpt, orig) {
  let x0 = orig.x, y0 = orig.y, x1 = orig.x + orig.w, y1 = orig.y + orig.d;
  const x = snapGrid(wpt.x), y = snapGrid(wpt.y);
  if (handle.includes('w')) x0 = x;
  if (handle.includes('e')) x1 = x;
  if (handle.includes('n')) y0 = y;
  if (handle.includes('s')) y1 = y;
  if (x1 < x0) [x0, x1] = [x1, x0];
  if (y1 < y0) [y0, y1] = [y1, y0];
  const min = 3;
  if (x1 - x0 < min) { if (handle.includes('w')) x0 = x1 - min; else x1 = x0 + min; }
  if (y1 - y0 < min) { if (handle.includes('n')) y0 = y1 - min; else y1 = y0 + min; }
  b.x = x0; b.y = y0; b.w = snapGrid(x1 - x0) || min; b.d = snapGrid(y1 - y0) || min;
  b.sizeKey = 'custom';
}

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = canvasPos(e);
  const before = toWorld(p.x, p.y);
  const factor = e.deltaY > 0 ? 0.92 : 1.09;
  camera.scale = Math.max(6, Math.min(36, camera.scale * factor));
  const after = toWorld(p.x, p.y);
  camera.x += (after.x - before.x) * camera.scale;
  camera.y += (after.y - before.y) * camera.scale;
  render();
}, { passive: false });

canvas.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const p = canvasPos(e);
  const w = toWorld(p.x, p.y);
  let type = paletteType, size = paletteSize[type];
  try {
    const data = e.dataTransfer.getData('text/peakstead-room') || e.dataTransfer.getData('text/plain');
    if (data) { const o = JSON.parse(data); type = o.type || type; size = o.size || size; }
  } catch {}
  placeAt(type, size, w.x, w.y);
});

function placeAt(type, sizeKey, x, y) {
  const t = TYPE_BY_ID[type]; if (!t) return;
  pushHistory();
  const raw = newBlock(type, sizeKey, x, y);
  raw.x = x - raw.w / 2; raw.y = y - raw.d / 2;
  const snapped = snapPlacement(blocks, raw, raw.id);
  raw.x = snapped.x; raw.y = snapped.y;
  raw.staging = raw.y + raw.d <= 0;
  blocks.push(raw);
  selectedId = raw.id;
  persist(); render();
}

/* ---------- history / keyboard ---------- */
function undo() {
  if (!history.length) return;
  future.push(JSON.stringify(cloneBlocks()));
  blocks = JSON.parse(history.pop());
  selectedId = null;
  persist(); render();
}
function redo() {
  if (!future.length) return;
  history.push(JSON.stringify(cloneBlocks()));
  blocks = JSON.parse(future.pop());
  selectedId = null;
  persist(); render();
}

$('#undo').onclick = undo;
$('#redo').onclick = redo;
$('#fit').onclick = () => { fitCamera(); render(); };
$('#clear').onclick = () => {
  if (!blocks.length) return;
  if (!confirm('Clear the lot and parts tray?')) return;
  pushHistory();
  blocks = [];
  selectedId = null;
  persist(); render();
};

addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, select')) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSelected(); }
  else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); }
  else if (e.key.toLowerCase() === 'r' && !e.ctrlKey) rotateSelected();
  else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && selected()) {
    e.preventDefault();
    pushHistory();
    const b = selected();
    const step = e.shiftKey ? 4 : 1;
    if (e.key === 'ArrowLeft') b.x -= step;
    if (e.key === 'ArrowRight') b.x += step;
    if (e.key === 'ArrowUp') b.y -= step;
    if (e.key === 'ArrowDown') b.y += step;
    b.staging = b.y + b.d <= 0;
    persist(); render();
  }
});

/* ---------- view toggle + 3D ---------- */
function setView(mode) {
  viewMode = mode;
  bodyEl.classList.remove('view2d', 'view3d', 'split');
  bodyEl.classList.add(mode === 'split' ? 'split' : (mode === '3d' ? 'view3d' : 'view2d'));
  $('#view2d').classList.toggle('on', mode === '2d');
  $('#viewSplit').classList.toggle('on', mode === 'split');
  $('#view3d').classList.toggle('on', mode === '3d');
  persist();
  requestAnimationFrame(() => { resizeCanvas(); if (mode !== '2d') ensurePreview(true); });
}
$('#view2d').onclick = () => setView('2d');
$('#viewSplit').onclick = () => setView('split');
$('#view3d').onclick = () => setView('3d');

function currentModel() {
  const lot = blocks.filter(onLot);
  if (!lot.length) return null;
  const s = planStats(blocks);
  return serializeModel(compileModel(blocks, {
    name: 'Builder home',
    subtitle: `${s.heated.toLocaleString()} sf heated` + (s.garage ? ` · ${s.garage.toLocaleString()} sf garage` : '') + ` · ${s.width}' × ${s.depth}' footprint`,
  }));
}

function writeDraft(model) {
  try { localStorage.setItem(LS_MODEL, JSON.stringify(model)); } catch {}
}

function schedulePreview() {
  dirty3d = true;
  if (viewMode === '2d') return;
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => ensurePreview(false), 280);
}

function ensurePreview(force) {
  const model = currentModel();
  previewEmpty.style.display = model ? 'none' : 'flex';
  if (!model) return;
  writeDraft(model);
  if (!frame.dataset.ready) {
    frame.src = '/viewer?embed=1';
    frame.dataset.ready = '1';
    frame.addEventListener('load', () => postModel(model), { once: true });
    return;
  }
  if (force || dirty3d) postModel(model);
}

function postModel(model) {
  dirty3d = false;
  try {
    frame.contentWindow?.postMessage({ type: 'peakstead-builder-model', model, view: 'orbit' }, location.origin);
  } catch {}
}
window.addEventListener('message', (ev) => {
  if (ev.origin !== location.origin) return;
  if (ev.data && ev.data.type === 'peakstead-builder-ready') {
    const model = currentModel();
    if (model) postModel(model);
  }
});

$('#open3d').onclick = () => {
  const model = currentModel();
  if (!model) { toast('Place a room on the lot first'); return; }
  writeDraft(model);
  location.href = '/viewer?draft=1';
};

/* ---------- save to projects ---------- */
const safeName = (n) => n.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+/, '').slice(-80) || 'file';

async function captureBuilderThumb() {
  const lot = blocks.filter(onLot);
  const src = canvas;
  const out = document.createElement('canvas');
  out.width = 1000; out.height = 625;
  const g = out.getContext('2d');
  g.fillStyle = '#14191e';
  g.fillRect(0, 0, 1000, 625);
  if (!lot.length) {
    return await new Promise((resolve) => out.toBlob(resolve, 'image/jpeg', 0.86));
  }
  // Redraw current canvas scaled into the card.
  const r = src.getBoundingClientRect();
  g.drawImage(src, 0, 0, src.width, src.height, 0, 0, 1000, 625);
  void r;
  return await new Promise((resolve) => out.toBlob(resolve, 'image/jpeg', 0.86));
}

async function saveToProjects() {

  const model = currentModel();
  if (!model) { toast('Place a room on the lot first'); return; }
  writeDraft(model);
  if (!user) {
    location.href = loginUrlFor('/builder?save=1');
    return;
  }
  const btn = $('#save');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const { project } = await api('projects', { method: 'POST', body: { name: model.title || 'Builder home', buildType: 'home' } });
    const file = new File([JSON.stringify(model, null, 2)], 'builder-plan.json', { type: 'application/json' });
    const blob = await upload(`files/${user.id}/${project.id}/${safeName(file.name)}`, file, {
      access: 'private', handleUploadUrl: '/api/upload',
      clientPayload: JSON.stringify({ pid: project.id, kind: 'model' }),
      contentType: 'application/json',
    });
    await api(`projects/${encodeURIComponent(project.id)}/files`, {
      method: 'POST', body: { pathname: blob.pathname, name: file.name, kind: 'model' },
    });
    try {
      const thumbBlob = await captureBuilderThumb();
      if (thumbBlob && user) {
        const tf = new File([thumbBlob], 'thumb.jpg', { type: 'image/jpeg' });
        const up = await upload(`files/${user.id}/${project.id}/thumb.jpg`, tf, {
          access: 'private', handleUploadUrl: '/api/upload',
          clientPayload: JSON.stringify({ pid: project.id, kind: 'thumb' }),
          contentType: 'image/jpeg',
        });
        await api(`projects/${encodeURIComponent(project.id)}/files`, {
          method: 'POST', body: { pathname: up.pathname, name: 'thumb.jpg', kind: 'thumb' },
        });
      }
    } catch (err) { console.warn('Could not save builder thumbnail', err); }
    toast('Saved to My projects');
    location.href = '/viewer?p=' + encodeURIComponent(project.id);
  } catch (e) {
    toast(e.message || 'Could not save');
    btn.disabled = false; btn.textContent = 'Save to My Projects';
  }
}
$('#save').onclick = saveToProjects;

window.__psBuilder = {
  toScreen, toWorld, getBlocks: () => blocks, getCamera: () => ({ ...camera }),
  currentModel, selectedId: () => selectedId, getView: () => viewMode, fitCamera,
};
/* ---------- boot ---------- */
function fillTemplates() {
  const sel = $('#template');
  sel.innerHTML = TEMPLATES.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
  sel.value = 'ranch';
  sel.onchange = () => applyTemplate(sel.value);
}

(async function boot() {
  user = await me();
  header(user, 'builder');
  fillTemplates();
  renderPalette();
  const restored = restore();
  if (!restored) blocks = templateById('ranch').build();
  $('#template').value = restored ? '' : 'ranch';
  if (!restored) {
    // keep a blank option? leave ranch selected
  }
  addEventListener('resize', resizeCanvas);
  resizeCanvas();
  if (!restored) fitCamera();
  render();
  updateStats();
  setView(viewMode || '2d');

  const params = new URLSearchParams(location.search);
  if (user && params.get('save') === '1') {
    const u = new URL(location.href);
    u.searchParams.delete('save');
    history.replaceState(null, '', u.pathname + u.search);
    await saveToProjects();
  }
})();
