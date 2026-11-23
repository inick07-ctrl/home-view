// PeakStead Designs — interactive Edit panel: Items, Rooms, and Walls.
import * as THREE from 'three';
import {
  CATALOG, CATEGORIES, FINISHES, makeItem, itemRect, clearanceHit, isHallName,
  newItemId, roomOfPoint, isOutdoorItem, isPorchLike, isCoveredPorch,
} from './furniture.js';

const STORE_PREFIX = 'peakstead-plan-v1:';

function $(id, root = document) { return root.getElementById(id); }
function el(tag, attrs = {}, kids = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const c of kids) n.appendChild(c);
  return n;
}

export function cloneWalls(WS) {
  return {
    ext: (WS.ext || []).map((r) => r.slice()),
    int: (WS.int || []).map((r) => r.slice()),
    win: (WS.win || []).map((r) => r.slice()),
    door: (WS.door || []).map((r) => r.slice()),
    counter: (WS.counter || []).map((r) => r.slice()),
  };
}
export function cloneRooms(rooms) {
  return (rooms || []).map((r) => [r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7] ? { ...r[7] } : {}]);
}
export function cloneItems(items) {
  return (items || []).map((it) => ({ ...it }));
}
export function cloneRoofs(roofs) {
  return (roofs || []).map((rf) => (rf && typeof rf === 'object' ? { ...rf } : rf)).filter(Boolean);
}

function wallId(kind, i) { return `${kind}-${i}`; }
function wallLen(w) {
  const horiz = (w[2] - w[0]) >= (w[3] - w[1]);
  return horiz ? (w[2] - w[0]) : (w[3] - w[1]);
}
function wallMid(w) { return [(w[0] + w[2]) / 2, (w[1] + w[3]) / 2]; }

function fmtFt(n) {
  const ft = Math.floor(n + 1e-6), inch = Math.round((n - ft) * 12);
  return inch ? `${ft}'-${inch}"` : `${ft}'-0"`;
}

export function loadLocalLayout(key) {
  try {
    const raw = localStorage.getItem(STORE_PREFIX + key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : null;
  } catch { return null; }
}
export function saveLocalLayout(key, layout) {
  try { localStorage.setItem(STORE_PREFIX + key, JSON.stringify(layout)); } catch {}
}
export function clearLocalLayout(key) {
  try { localStorage.removeItem(STORE_PREFIX + key); } catch {}
}

import { OB_BODY, OB_TRIM, OB_ROOF } from './outbuilding-items.js';
export function sanitizeLayout(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const items = Array.isArray(raw.items) ? raw.items.slice(0, 400).map((it) => {
    if (!it || !CATALOG[it.type]) return null;
    const rec = makeItem(it.type, it);
    rec.id = String(it.id || rec.id).slice(0, 40);
    return rec;
  }).filter(Boolean) : undefined;
  const rooms = Array.isArray(raw.rooms) ? raw.rooms.slice(0, 200).map((r) => {
    if (!Array.isArray(r) || r.length < 7) return null;
    const x0 = +r[3], y0 = +r[4], x1 = +r[5], y1 = +r[6];
    if (![x0, y0, x1, y1].every(Number.isFinite)) return null;
    return [String(r[0] || 'Room').slice(0, 60), String(r[1] || ''), String(r[2] || 'wood').slice(0, 24), x0, y0, x1, y1, r[7] && typeof r[7] === 'object' ? r[7] : {}];
  }).filter(Boolean) : undefined;
  let walls;
  if (raw.walls && typeof raw.walls === 'object') {
    const copy = {};
    for (const k of ['ext', 'int', 'win', 'door', 'counter']) {
      const list = raw.walls[k];
      if (!Array.isArray(list)) continue;
      copy[k] = list.slice(0, 2000).filter((r) => Array.isArray(r) && r.length >= 4 && r.slice(0, 4).every((n) => typeof n === 'number'));
    }
    walls = copy;
  }
  let roofs;
  if (Array.isArray(raw.roofs)) {
    roofs = raw.roofs.slice(0, 80).map((rf) => {
      if (!rf || typeof rf !== 'object') return null;
      const x0 = +rf.x0, y0 = +rf.y0, x1 = +rf.x1, y1 = +rf.y1;
      if (![x0, y0, x1, y1].every(Number.isFinite)) return null;
      return { ...rf, x0, y0, x1, y1 };
    }).filter(Boolean);
  }
  const finishes = sanitizeFinishes(raw.finishes);
  const deleted = Array.isArray(raw.deleted) ? raw.deleted.slice(0, 100).filter((d) => d && Array.isArray(d.rect) && d.rect.length === 4 && d.rect.every(Number.isFinite))
    .map((d) => ({ name: String(d.name || 'Room').slice(0, 60), rect: d.rect.slice(), cat: ['heated', 'garage', 'porch'].includes(d.cat) ? d.cat : 'heated', area: +d.area || 0 })) : undefined;
  let planInfo;
  if (raw.planInfo && typeof raw.planInfo === 'object') {
    planInfo = {
      project: String(raw.planInfo.project || '').slice(0, 80),
      address: String(raw.planInfo.address || '').slice(0, 120),
      owner: String(raw.planInfo.owner || '').slice(0, 80),
      revision: String(raw.planInfo.revision || '0').slice(0, 12),
      size: ['arch-d', 'tabloid', 'letter'].includes(raw.planInfo.size) ? raw.planInfo.size : 'tabloid',
      schedule: raw.planInfo.schedule !== false,
    };
  }
  if (!items && !rooms && !walls && !roofs && !finishes && !planInfo) return null;
  return { version: Math.max(1, Math.min(3, Math.floor(+raw.version) || 1)), items, rooms, walls, roofs, finishes, deleted, planInfo };
}
const COLOR_RX = /^(wood:)?#[0-9a-f]{6}$/i;
function sanitizeFinishes(f) {
  if (!f || typeof f !== 'object') return undefined;
  const out = {};
  for (const k of ['wall', 'doorInt', 'doorExt', 'cabinet', 'island']) if (typeof f[k] === 'string' && COLOR_RX.test(f[k])) out[k] = f[k];
  if (typeof f.hardware === 'string' && /^[a-z-]{3,30}$/.test(f.hardware)) out.hardware = f.hardware;
  if (f.rooms && typeof f.rooms === 'object') {
    const r = {};
    for (const [k, v] of Object.entries(f.rooms).slice(0, 200)) if (typeof v === 'string' && COLOR_RX.test(v)) r[String(k).slice(0, 60)] = v;
    if (Object.keys(r).length) out.rooms = r;
  }
  if (f.tiles && typeof f.tiles === 'object') {
    const tiles = {};
    for (const k of ['backsplash', 'bathFloor', 'shower', 'floor']) if (typeof f.tiles[k] === 'string' && COLOR_RX.test(f.tiles[k])) tiles[k] = f.tiles[k];
    if (Object.keys(tiles).length) out.tiles = tiles;
  }
  return Object.keys(out).length ? out : undefined;
}
export const WALL_PALETTE = [
  ['Pure White', '#f6f5f0'], ['Alabaster', '#efe9dc'], ['Swiss Coffee', '#ece4d4'], ['Agreeable Gray', '#d1cbc1'], ['Accessible Beige', '#cdc0ad'],
  ['Repose Gray', '#c3c0b8'], ['Edgecomb Gray', '#d8d1c3'], ['Evergreen Fog', '#a3a796'], ['Sage', '#b3b9a0'], ['Pale Oak', '#ddd3c4'],
  ['Hale Navy', '#3d4652'], ['Naval', '#2f3d4c'], ['Iron Ore', '#4a4847'], ['Urbane Bronze', '#55504a'], ['Tricorn Black', '#2b2b2b'], ['Terracotta Blush', '#c99a83'],
];
export const DOOR_PALETTE = [
  ['White', '#f4f2eb'], ['Black', '#1d1e20'], ['Natural oak', 'wood:#d2a679'], ['Walnut', 'wood:#6b4630'], ['Navy', '#2f3d4c'], ['Sage', '#97a088'], ['Charcoal', '#45474a'],
];
export const CABINET_PALETTE = [
  ['White', '#f4f1ea'], ['Cream', '#efe4d0'], ['Greige', '#c4b7a6'], ['Sage green', '#7d8b74'],
  ['Navy', '#2c3a4a'], ['Charcoal', '#3a3b3d'], ['Black', '#1c1c1c'],
  ['Natural oak', 'wood:#c4a06a'], ['Walnut', 'wood:#5c3a24'],
];
export const TILE_PALETTE = [
  ['White subway', '#eef1f3'], ['Ivory', '#f0e6d4'], ['Soft gray', '#c5c8cc'], ['Warm beige', '#d9cbb8'],
  ['Carrara marble', '#e8e4dc'], ['Charcoal', '#4a4d50'], ['Navy', '#3a4654'], ['Sage', '#9aa58e'],
  ['Terracotta', '#c67b5c'], ['Slate', '#6d7378'], ['Black', '#2a2b2d'],
];
export function defaultIslandFor(cabinet) {
  const hex = String(cabinet || '').replace(/^wood:/, '').toLowerCase();
  if (!hex || !hex.startsWith('#')) return 'wood:#5c3a24';
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.45 ? 'wood:#5c3a24' : '#efe4d0';
}

export function mountPlanEditor(ctrl) {
  if (document.getElementById('editDrawer')) { if (ctrl) Object.assign(mountPlanEditor._ctrl || {}, ctrl); return mountPlanEditor._api; }
  ensureStyles();
  const btn = ensureEditButton();
  const drawer = buildDrawer();
  document.body.appendChild(drawer);
  const banner = el('div', { id: 'clearanceBanner', text: 'This placement blocks a hallway or doorway' });
  document.body.appendChild(banner);

  let tab = 'items';
  let selected = null; // { kind: 'item'|'room'|'wall'|'door', id, index, ... }
  let doorNote = '';
  let placing = null; // catalog type to place
  let drawingWall = null; // { x0, y0 } while adding a wall
  let undo = [];
  let dragging = null;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  function storeKey() {
    if (ctrl.src?.kind === 'project') return 'project:' + ctrl.src.id;
    if (ctrl.src?.kind === 'example') return 'example:' + (ctrl.exampleId || 'default');
    if (ctrl.src?.kind === 'share') return 'share:' + ctrl.src.token;
    return 'example:' + (ctrl.exampleId || 'default');
  }
  function canEdit() {
    return ctrl.src?.kind !== 'share' && ctrl.canEdit !== false;
  }
  function currentLayout() {
    return {
      version: 3,
      items: cloneItems(ctrl.getItems()),
      rooms: cloneRooms(ctrl.getRooms()),
      walls: cloneWalls(ctrl.getWalls()),
      roofs: cloneRoofs(ctrl.getRoofs ? ctrl.getRoofs() : []),
      finishes: JSON.parse(JSON.stringify(ctrl.getFinishes ? ctrl.getFinishes() : {})),
      deleted: JSON.parse(JSON.stringify(ctrl.getDeleted ? ctrl.getDeleted() : [])),
      planInfo: (ctrl.getLayout && ctrl.getLayout()?.planInfo) || (typeof window !== 'undefined' && window.app?.getPlanSnapshot?.()?.planInfo) || undefined,
    };
  }
  function pushUndo() {
    undo.push(currentLayout());
    if (undo.length > 40) undo.shift();
  }
  function showClearance(on, kind) {
    banner.classList.toggle('show', !!on);
    if (kind) banner.textContent = kind === 'hallway'
      ? 'That spot is in a hallway — choose another location'
      : 'That spot blocks a doorway — leave a clear walkway';
  }

  function select(next) {
    selected = next;
    placing = null;
    render();
    ctrl.highlight(selected);
  }

  function applyLayout(layout, { recordUndo = false } = {}) {
    if (recordUndo) pushUndo();
    ctrl.applyLayout(layout);
    selected = selected && stillExists(selected) ? selected : null;
    render();
    ctrl.highlight(selected);
    persist();
  }

  function stillExists(sel) {
    if (!sel) return false;
    if (sel.kind === 'item') return ctrl.getItems().some((it) => it.id === sel.id);
    if (sel.kind === 'door') return !!(ctrl.getWalls().door || [])[sel.index];
    if (sel.kind === 'room') return !!ctrl.getRooms()[sel.index];
    if (sel.kind === 'wall') {
      const list = ctrl.getWalls()[sel.wallKind] || [];
      return !!list[sel.index];
    }
    return false;
  }

  let persistTimer = 0;
  function persist() {
    const layout = currentLayout();
    saveLocalLayout(storeKey(), layout);
    $('editStatus').textContent = canEdit()
      ? (ctrl.src?.kind === 'project' ? 'Saving…' : 'Saved on this device')
      : 'View only';
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => persistRemote(layout), 400);
  }
  async function persistRemote(layout) {
    if (ctrl.src?.kind !== 'project' || !ctrl.saveRemote) {
      if (canEdit()) $('editStatus').textContent = 'Saved on this device';
      return;
    }
    try {
      await ctrl.saveRemote(layout);
      $('editStatus').textContent = 'Saved to your project';
    } catch (e) {
      $('editStatus').textContent = e.message || 'Could not save to project (kept on this device)';
    }
  }

  function setEditButtons(on) {
    document.querySelectorAll('#bEdit, #editPlanBtn').forEach((el) => {
      el.classList.toggle('on', !!on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function open() {
    drawer.classList.add('open');
    setEditButtons(true);
    render();
    ctrl.setEditMode(true);
  }
  function close() {
    drawer.classList.remove('open');
    setEditButtons(false);
    placing = null;
    drawingWall = null;
    selected = null;
    ctrl.highlight(null);
    ctrl.setEditMode(false);
    showClearance(false);
  }

  const toggle = () => { drawer.classList.contains('open') ? close() : open(); };
  btn.addEventListener('click', toggle);
  const topBtn = document.getElementById('editPlanBtn');
  if (topBtn && topBtn !== btn) topBtn.addEventListener('click', toggle);
  drawer.querySelector('[data-act=close]').onclick = close;
  function undoLast() {
    const prev = undo.pop();
    if (!prev) return;
    ctrl.applyLayout(prev);
    selected = null;
    render();
    ctrl.highlight(null);
    persist();
  }
  function confirmRemoveWall(kind) {
    if (kind !== 'ext') return true;
    return confirm('Remove this exterior wall? The house will open to the outside at that edge, and the roof or ceiling may change. You can undo after.');
  }
  function deleteSelected() {
    if (!selected || !canEdit()) return;
    if (selected.kind === 'wall') {
      if (!confirmRemoveWall(selected.wallKind)) return;
      pushUndo();
      ctrl.removeWall(selected.wallKind, selected.index);
      select(null);
      persist();
      render();
      return;
    }
    if (selected.kind === 'item') {
      pushUndo();
      ctrl.setItems(ctrl.getItems().filter((x) => x.id !== selected.id));
      select(null);
      persist();
      render();
      return;
    }
  }
  drawer.querySelector('[data-act=undo]').onclick = undoLast;

  window.addEventListener('peakstead-plan-changed', () => { if (canEdit()) persist(); });
  window.addEventListener('keydown', (ev) => {
    if (!drawer.classList.contains('open') || !canEdit()) return;
    const typing = ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName);
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z' && !ev.shiftKey) {
      ev.preventDefault();
      undoLast();
      return;
    }
    if (typing) return;
    if ((ev.key === 'Delete' || ev.key === 'Backspace') && selected) {
      ev.preventDefault();
      deleteSelected();
    }
  });
  drawer.querySelector('[data-act=reset]').onclick = () => {
    if (!confirm('Reset this plan’s items, rooms, and walls to the original layout?')) return;
    pushUndo();
    clearLocalLayout(storeKey());
    ctrl.resetLayout();
    selected = null;
    render();
    ctrl.highlight(null);
    $('editStatus').textContent = 'Reset to the original layout';
    if (ctrl.src?.kind === 'project' && ctrl.saveRemote) ctrl.saveRemote(null).catch(() => {});
  };
  drawer.querySelector('[data-act=save]').onclick = () => { persist(); if (ctrl.captureThumb && ctrl.src?.kind === 'project') uploadProjectThumb(ctrl).catch(() => {}); };
  drawer.querySelectorAll('#editTabs button').forEach((b) => {
    b.onclick = () => { tab = b.dataset.tab; placing = null; drawingWall = null; render(); };
  });

  function render() {
    drawer.querySelectorAll('#editTabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    const body = $('editBody');
    body.innerHTML = '';
    if (tab === 'items') renderItems(body);
    else if (tab === 'rooms') renderRooms(body);
    else if (tab === 'doors') renderDoors(body);
    else if (tab === 'colors') renderColors(body);
    else renderWalls(body);
  }

  function renderItems(body) {
    const items = ctrl.getItems();
    const rooms = ctrl.getRooms();
    body.appendChild(el('p', { id: 'editHint', class: 'edit-hint', text: canEdit() ? 'Click an item in the list or in the 3D view to edit it. Add an item, then click the floor to place it.' : 'View only.' }));
    const filter = el('input', { id: 'editFilter', type: 'search', placeholder: 'Filter items…' });
    body.appendChild(filter);
    const list = el('div', { id: 'editList' });
    const groups = new Map();
    for (const it of items) {
      const room = roomOfPoint(rooms, it.x, it.y);
      const typ = CATALOG[it.type];
      const g = typ?.outdoor || typ?.category === 'pool' || typ?.category === 'solar' ? 'Yard / lot' : (room ? room[0] : 'Unplaced');
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(it);
    }
    const q = () => (filter.value || '').toLowerCase();
    const paint = () => {
      list.innerHTML = '';
      const query = q();
      for (const [g, arr] of groups) {
        const shown = arr.filter((it) => {
          const t = CATALOG[it.type];
          const label = (t?.name || it.type) + ' ' + g;
          return !query || label.toLowerCase().includes(query);
        });
        if (!shown.length) continue;
        list.appendChild(el('div', { class: 'group', text: g }));
        for (const it of shown) {
          const t = CATALOG[it.type];
          const b = el('button', { class: 'item' + (selected?.kind === 'item' && selected.id === it.id ? ' on' : ''), type: 'button' });
          b.appendChild(document.createTextNode(t?.name || it.type));
          b.appendChild(el('small', { text: `${fmtFt(it.w || t.w)} × ${fmtFt(it.d || t.d)}` }));
          b.onclick = () => select({ kind: 'item', id: it.id });
          list.appendChild(b);
        }
      }
      if (!items.length) list.appendChild(el('p', { class: 'edit-hint', text: 'No items yet. Add one below.' }));
    };
    filter.addEventListener('input', paint);
    paint();
    body.appendChild(list);
    const it = selected?.kind === 'item' ? items.find((x) => x.id === selected.id) : null;
    if (it && canEdit()) body.appendChild(itemInspector(it));
    if (canEdit()) body.appendChild(addPalette());
  }

  function itemInspector(it) {
    const t = CATALOG[it.type] || {};
    const wrap = el('div', { id: 'editInspect' });
    wrap.appendChild(el('h3', { text: t.name || it.type }));
    const row = (label, node) => { wrap.appendChild(el('label', { text: label })); wrap.appendChild(node); };
    const num = (key, step = 0.1) => {
      const i = el('input', { type: 'number', step: String(step), value: String(+(it[key] ?? 0).toFixed(2)) });
      i.onchange = () => patchItem(it.id, { [key]: parseFloat(i.value) });
      return i;
    };
    const xy = el('div', { class: 'row' });
    const x = num('x'); const y = num('y');
    xy.append(x, y);
    row('Position (east, south, ft)', xy);
    const nudges = el('div', { class: 'nudge' });
    for (const [lab, dx, dy] of [['W −0.5', -0.5, 0], ['E +0.5', 0.5, 0], ['N −0.5', 0, -0.5], ['S +0.5', 0, 0.5]]) {
      const b = el('button', { type: 'button', text: lab });
      b.onclick = () => patchItem(it.id, { x: it.x + dx, y: it.y + dy });
      nudges.appendChild(b);
    }
    wrap.appendChild(nudges);
    const rotRow = el('div', { class: 'row' });
    const rot = num('rot', 1);
    rotRow.appendChild(rot);
    for (const deg of [-15, 15, 90]) {
      const b = el('button', { type: 'button', text: (deg > 0 ? '+' : '') + deg + '°' });
      b.onclick = () => patchItem(it.id, { rot: (it.rot + deg + 360) % 360 });
      rotRow.appendChild(b);
    }
    row('Rotation', rotRow);
    const size = el('div', { class: 'row' });
    size.append(num('w'), num('d'));
    row('Width / depth (ft)', size);
    if (t.finishes) {
      const s = el('select');
      for (const f of t.finishes) {
        const o = el('option', { value: f, text: FINISHES[f]?.name || f });
        if (it.finish === f) o.selected = true;
        s.appendChild(o);
      }
      s.onchange = () => patchItem(it.id, { finish: s.value });
      row('Finish', s);
    }
    if (t.variants) {
      const s = el('select');
      for (const v of t.variants) {
        const o = el('option', { value: v, text: v.replace(/-/g, ' ') });
        if (it.variant === v) o.selected = true;
        s.appendChild(o);
      }
      s.onchange = () => patchItem(it.id, { variant: s.value });
      row('Style', s);
    }
    if (t.fuels) {
      // fuel type: wood-burning (logs, andirons, chimney/flue) vs electric (insert + circuit); drives the estimate
      const s = el('select', { id: 'editFuel' });
      const cur = it.fuel || t.defaultFuel;
      for (const [k, lab] of [['wood', 'Wood-burning'], ['electric', 'Electric']]) {
        if (!t.fuels.includes(k)) continue;
        const o = el('option', { value: k, text: lab });
        if (cur === k) o.selected = true;
        s.appendChild(o);
      }
      s.onchange = () => patchItem(it.id, { fuel: s.value });
      row('Fuel type', s);
    }
    if (t.sizes) {
      const ss = el('select', { id: 'editObSize' });
      const cur = `${Math.round(it.w)}x${Math.round(it.d)}`;
      for (const [w, d] of t.sizes) { const k = `${w}x${d}`; const o = el('option', { value: k, text: `${w}′ × ${d}′` }); if (k === cur) o.selected = true; ss.appendChild(o); }
      ss.onchange = () => { const [w, d] = ss.value.split('x').map(Number); patchItem(it.id, { w, d }); };
      row('Size', ss);
      for (const [key, lab, pal] of [['body', 'Body color', OB_BODY], ['trim', 'Trim color', OB_TRIM], ['roofColor', 'Roof color', OB_ROOF]]) {
        const cs = el('select', { id: 'editOb_' + key });
        for (const [v, l] of pal) { const o = el('option', { value: v, text: l }); if ((it[key] || 'match') === v) o.selected = true; cs.appendChild(o); }
        cs.onchange = () => patchItem(it.id, { [key]: cs.value === 'match' ? undefined : cs.value });
        row(lab, cs);
      }
    }
    if (t.stair) {
      const ds = el('select', { id: 'editStairDir' });
      for (const [k, lab] of [['up', 'Up (to a loft / upper level)'], ['down', 'Down (to the basement — cuts a floor opening)']]) { const o = el('option', { value: k, text: lab }); if ((it.dir || 'up') === k) o.selected = true; ds.appendChild(o); }
      ds.onchange = () => patchItem(it.id, { dir: ds.value });
      row('Direction', ds);
      const rs = el('select', { id: 'editStairRail' });
      for (const k of (t.rails || ['black'])) { const o = el('option', { value: k, text: { black: 'Black metal balusters', wood: 'Wood rail + white balusters', glass: 'Glass panels' }[k] || k }); if ((it.rail || 'black') === k) o.selected = true; rs.appendChild(o); }
      rs.onchange = () => patchItem(it.id, { rail: rs.value });
      row('Railing', rs);
    }
    if (ctrl.hwFinishes && /sink|faucet|vanity|kitchen|island|counter|cabinet|pantry|pendant|chandelier|lamp|sconce|light|shower|tub|bath|toilet|dresser|nightstand|sideboard|buffet|desk|bar|hutch|wardrobe|credenza|range|hood/i.test(it.type)) {
      const s = el('select', { id: 'editHw' });
      s.appendChild(el('option', { value: '', text: 'House default' }));
      for (const [k, f] of Object.entries(ctrl.hwFinishes)) { const o = el('option', { value: k, text: f.label }); if (it.hw === k) o.selected = true; s.appendChild(o); }
      s.onchange = () => patchItem(it.id, { hw: s.value || undefined });
      row('Hardware / metal finish', s);
    }
    const acts = el('div', { class: 'row' });
    const dup = el('button', { type: 'button', text: 'Duplicate' });
    dup.onclick = () => {
      pushUndo();
      const copy = makeItem(it.type, { ...it, id: newItemId(), x: it.x + 1.2, y: it.y + 1.2 });
      ctrl.setItems([...ctrl.getItems(), copy]);
      select({ kind: 'item', id: copy.id });
      persist();
    };
    const del = el('button', { type: 'button', class: 'danger', text: 'Remove' });
    del.onclick = () => {
      pushUndo();
      ctrl.setItems(ctrl.getItems().filter((x) => x.id !== it.id));
      select(null);
      persist();
    };
    acts.append(dup, del);
    wrap.appendChild(acts);
    return wrap;
  }

  function addPalette() {
    const wrap = el('div', { id: 'editPalette' });
    wrap.appendChild(el('h3', { text: 'Add item' }));
    let cat = 'living';
    const cats = el('div', { class: 'cats' });
    const types = el('div', { class: 'types' });
    const paintTypes = () => {
      types.innerHTML = '';
      for (const [id, t] of Object.entries(CATALOG)) {
        if (t.category !== cat) continue;
        const b = el('button', { type: 'button', text: t.name, class: placing === id ? 'primary' : '' });
        b.onclick = () => {
          placing = placing === id ? null : id;
          paintTypes();
          if (!placing) { $('editHint').textContent = 'Click an item in the list or in the 3D view.'; return; }
          const mount = t.mount === 'roof' ? 'Click a roof plane in the 3D view to snap the ' + t.name.toLowerCase() + ' to the pitch.' : (t.outdoor || t.category === 'pool' || t.category === 'solar' ? 'Click the lawn or lot to place the ' + t.name.toLowerCase() + '.' : 'Click the floor in the 3D view to place the ' + t.name.toLowerCase() + '.');
          $('editHint').textContent = mount;
        };
        types.appendChild(b);
      }
    };
    for (const c of CATEGORIES) {
      const b = el('button', { type: 'button', text: c.name, class: c.id === cat ? 'on' : '' });
      b.onclick = () => { cat = c.id; cats.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.textContent === c.name)); paintTypes(); };
      cats.appendChild(b);
    }
    wrap.append(cats, types);
    paintTypes();
    return wrap;
  }

  function patchItem(id, patch) {
    const items = cloneItems(ctrl.getItems());
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const next = { ...it, ...patch };
    const hit = isOutdoorItem(it.type) ? null : clearanceHit(itemRect(next), ctrl.getRooms(), ctrl.getWalls(), 0.05);
    showClearance(!!hit, hit?.kind);
    if (hit && (patch.x != null || patch.y != null || patch.rot != null || patch.w != null || patch.d != null)) {
      // still allow, but warn — user asked for live feedback; block only on hallway/doorway
      if (hit.kind === 'hallway' || hit.kind === 'doorway') return;
    }
    pushUndo();
    Object.assign(it, patch);
    ctrl.setItems(items);
    persist();
    render();
    ctrl.highlight(selected);
  }

  function renderRooms(body) {
    const rooms = ctrl.getRooms();
    body.appendChild(el('p', { id: 'editHint', text: canEdit() ? 'Click any room in 3D and drag to move it. Porches, patios, and decks also have edge handles so you can shorten or extend them. Resize, rename, or nudge here — furniture, walls, and porch roofs come along.' : 'View only.' }));
    const list = el('div', { id: 'editList' });
    rooms.forEach((r, i) => {
      if (r[7]?.noLabel && !r[0]) return;
      const w = r[5] - r[3], d = r[6] - r[4], sf = Math.abs(w * d);
      const b = el('button', { class: 'item' + (selected?.kind === 'room' && selected.index === i ? ' on' : ''), type: 'button' });
      b.appendChild(document.createTextNode(r[0] || 'Room'));
      b.appendChild(el('small', { text: `${r[2] || 'wood'} · ${fmtFt(w)} × ${fmtFt(d)} · ${Math.round(sf)} sf` }));
      b.onclick = () => select({ kind: 'room', index: i });
      list.appendChild(b);
    });
    if (canEdit() && rooms.length) {
      const box = el('div', { class: 'row', id: 'delRoomRow' });
      const sel = el('select', { id: 'delRoomSel', title: 'Pick a room to delete' });
      sel.appendChild(el('option', { value: '', text: 'Delete room by name…' }));
      rooms.forEach((r, i) => { if (r[0]) sel.appendChild(el('option', { value: String(i), text: r[0] })); });
      if (selected?.kind === 'room') sel.value = String(selected.index);
      const go = el('button', { type: 'button', class: 'danger', id: 'delRoomBtn', text: 'Delete room' });
      go.onclick = () => {
        const i = sel.value === '' ? (selected?.kind === 'room' ? selected.index : -1) : +sel.value;
        const r = rooms[i]; if (!r) return;
        if (!confirm(`Delete “${r[0] || 'Room'}”? Its floor, furniture and unshared walls go; shared walls stay and become exterior walls. Undo brings it back.`)) return;
        pushUndo(); ctrl.removeRoom(i); select(null); persist(); render();
      };
      box.append(sel, go);
      body.appendChild(box);
    }
    body.appendChild(list);
    const room = selected?.kind === 'room' ? rooms[selected.index] : null;
    if (room && canEdit()) body.appendChild(roomInspector(room, selected.index));
    if (canEdit()) {
      const add = el('button', { class: 'add-btn primary', type: 'button', text: '+ Add room' });
      add.onclick = () => { placing = '__room__'; $('editHint').textContent = 'Click the floor to drop a new 12′ × 10′ room.'; };
      body.appendChild(add);
    }
  }

  function roomInspector(room, index) {
    const wrap = el('div', { id: 'editInspect' });
    wrap.appendChild(el('h3', { text: room[0] || 'Room' }));
    const name = el('input', { type: 'text', value: room[0] || '' });
    name.onchange = () => patchRoom(index, { name: name.value });
    wrap.appendChild(el('label', { text: 'Name' }));
    wrap.appendChild(name);
    const types = ['Bedroom', 'Office', 'Gym', 'Bath', 'Kitchen', 'Dining', 'Living', 'Hallway', 'Mudroom', 'Utility', 'Library', 'Patio'];
    const typ = el('select');
    const cur = room[0] || '';
    typ.appendChild(el('option', { value: cur, text: cur || 'Custom' }));
    for (const t of types) typ.appendChild(el('option', { value: t, text: t }));
    typ.value = types.includes(cur) ? cur : cur;
    typ.onchange = () => {
      const floor = /bath|laundry|mud|utility|wc/i.test(typ.value) ? 'tile' : /porch|patio/i.test(typ.value) ? 'porch' : 'wood';
      patchRoom(index, { name: typ.value, floor });
    };
    wrap.appendChild(el('label', { text: 'Type' }));
    wrap.appendChild(typ);
    const w = room[5] - room[3], d = room[6] - room[4];
    const size = el('div', { class: 'row' });
    const wi = el('input', { type: 'number', step: '0.5', value: String(+w.toFixed(2)) });
    const di = el('input', { type: 'number', step: '0.5', value: String(+d.toFixed(2)) });
    wi.onchange = () => patchRoom(index, { w: parseFloat(wi.value) });
    di.onchange = () => patchRoom(index, { d: parseFloat(di.value) });
    size.append(wi, di);
    wrap.appendChild(el('label', { text: 'Width / depth (ft)' }));
    wrap.appendChild(size);
    const pos = el('div', { class: 'row' });
    const x = el('input', { type: 'number', step: '0.5', value: String(+room[3].toFixed(2)) });
    const y = el('input', { type: 'number', step: '0.5', value: String(+room[4].toFixed(2)) });
    x.onchange = () => patchRoom(index, { x0: parseFloat(x.value), move: true });
    y.onchange = () => patchRoom(index, { y0: parseFloat(y.value), move: true });
    pos.append(x, y);
    wrap.appendChild(el('label', { text: 'Origin (east, south, ft)' }));
    wrap.appendChild(pos);
    const nudges = el('div', { class: 'nudge' });
    for (const [lab, dx, dy] of [['W −1', -1, 0], ['E +1', 1, 0], ['N −1', 0, -1], ['S +1', 0, 1]]) {
      const b = el('button', { type: 'button', text: lab });
      b.onclick = () => patchRoom(index, { dx, dy });
      nudges.appendChild(b);
    }
    wrap.appendChild(nudges);
    const acts = el('div', { class: 'row' });
    const del = el('button', { type: 'button', class: 'danger', text: 'Remove / cut out room' });
    del.onclick = () => {
      if (!confirm('Remove this room and the items inside it? Shared walls with other rooms are kept.')) return;
      pushUndo();
      ctrl.removeRoom(index);
      select(null);
      persist();
      render();
    };
    acts.appendChild(del);
    wrap.appendChild(acts);
    return wrap;
  }

  function patchRoom(index, patch) {
    pushUndo();
    ctrl.patchRoom(index, patch);
    persist();
    render();
    ctrl.highlight(selected);
  }

  function renderDoors(body) {
    const list0 = ctrl.doorList ? ctrl.doorList() : [];
    body.appendChild(el('p', { id: 'editHint', class: doorNote ? 'warn' : '', text: doorNote || (canEdit() ? 'Pick a door to remove it (leaves an open cased opening, or fill it with wall), recolor it, or resize a garage door. Add a garage door from Walls → select an exterior garage wall. Click a door in the 3D view to select it.' : 'View only.') }));
    const list = el('div', { id: 'editList' });
    const groups = [['garage', 'Garage doors'], ['ext', 'Exterior doors'], ['int', 'Interior doors']];
    for (const [k, lab] of groups) {
      const ds = list0.filter((d) => d.kind === k);
      if (!ds.length) continue;
      list.appendChild(el('div', { class: 'group', text: lab }));
      ds.forEach((d, n) => {
        const b = el('button', { class: 'item' + (selected?.kind === 'door' && selected.index === d.index ? ' on' : ''), type: 'button', 'data-door': String(d.index) });
        b.appendChild(document.createTextNode(`${lab.replace(/s$/, '')} ${n + 1}${d.room ? ' · ' + d.room : ''}`));
        b.appendChild(el('small', { text: `${fmtFt(d.width)} wide${d.removed ? ' · removed (open)' : d.hasLeaf ? '' : ' · cased opening'}` }));
        b.onclick = () => { selected = { kind: 'door', index: d.index }; render(); ctrl.highlightDoor(d.index); };
        list.appendChild(b);
      });
    }
    body.appendChild(list);
    const d = selected?.kind === 'door' ? list0.find((x) => x.index === selected.index) : null;
    if (!d || !canEdit()) return;
    const wrap = el('div', { id: 'editInspect' });
    wrap.appendChild(el('h3', { text: (d.kind === 'garage' ? 'Garage door' : d.kind === 'ext' ? 'Exterior door' : 'Interior door') + (d.room ? ' — ' + d.room : '') }));
    const acts = el('div', { class: 'row' });
    const done = () => { persist(); render(); };
    if (d.removed) {
      const b = el('button', { type: 'button', text: 'Restore door' });
      b.onclick = () => { pushUndo(); ctrl.restoreDoor(d.index); done(); ctrl.highlightDoor(d.index); };
      acts.appendChild(b);
    } else if (d.hasLeaf) {
      const b = el('button', { type: 'button', class: 'danger', id: 'removeDoorBtn', text: 'Remove door (keep opening)' });
      b.onclick = () => { pushUndo(); ctrl.removeDoor(d.index, 'opening'); done(); ctrl.highlightDoor(d.index); };
      acts.appendChild(b);
    }
    const w = el('button', { type: 'button', class: 'danger', text: 'Remove & fill with wall' });
    w.onclick = () => { pushUndo(); ctrl.removeDoor(d.index, 'wall'); selected = null; ctrl.highlightDoor(null); done(); };
    acts.appendChild(w);
    wrap.appendChild(acts);
    if (d.kind === 'garage') {
      wrap.appendChild(el('label', { text: 'Garage door size' }));
      const s = el('select', { id: 'gdSize' });
      const cur = d.width > 12 ? 'double' : 'single';
      for (const [k, lab] of [['single', 'Single-car 9′ × 8′'], ['double', 'Double-car 16′ × 8′'], ['two', 'Two single 9′ doors']]) { const o = el('option', { value: k, text: lab }); if (k === cur) o.selected = true; s.appendChild(o); }
      s.onchange = () => {
        pushUndo();
        const r = ctrl.garageSize(d.index, s.value);
        if (!r.ok) {
          undo.pop();
          doorNote = 'Could not resize: ' + r.why;
          if ($('editHint')) $('editHint').textContent = doorNote;
          let note = $('gdSizeNote');
          if (!note) { note = el('p', { id: 'gdSizeNote', class: 'editWarn' }); s.insertAdjacentElement('afterend', note); }
          note.textContent = doorNote;
          s.value = cur;
          return;
        }
        doorNote = r.why || (r.shifted ? 'Door shifted slightly along the wall so the new size would fit.' : '');
        selected = { kind: 'door', index: r.index != null ? r.index : d.index };
        ctrl.highlightDoor(selected.index);
        done();
      };
      wrap.appendChild(s);
      if (doorNote) wrap.appendChild(el('p', { id: 'gdSizeNote', class: 'editWarn', text: doorNote }));
    }
    wrap.appendChild(el('label', { text: 'Door color' }));
    wrap.appendChild(swatches(DOOR_PALETTE, d.color, (c) => { pushUndo(); ctrl.setDoorColor(d.index, c); persist(); render(); }, true));
    body.appendChild(wrap);
  }
  function swatches(pal, cur, onPick, allowClear) {
    const box = el('div', { class: 'swatches' });
    for (const [lab, c] of pal) {
      const hex = c.replace(/^wood:/, '');
      const b = el('button', { type: 'button', class: 'sw' + (cur === c ? ' on' : ''), title: lab, 'data-color': c });
      b.style.background = c.startsWith('wood:') ? `repeating-linear-gradient(100deg, ${hex}, ${hex} 4px, rgba(0,0,0,.12) 5px, ${hex} 7px)` : hex;
      b.onclick = () => onPick(c);
      box.appendChild(b);
    }
    const pick = el('input', { type: 'color', title: 'Custom color', value: cur && /^#/.test(cur) ? cur : '#d8d1c3' });
    pick.onchange = () => onPick(pick.value);
    box.appendChild(pick);
    if (allowClear) { const x = el('button', { type: 'button', class: 'sw-clear', text: 'Default' }); x.onclick = () => onPick(null); box.appendChild(x); }
    return box;
  }
  function renderColors(body) {
    const fin = ctrl.getFinishes ? ctrl.getFinishes() : {};
    const ok = canEdit();
    const set = (patch) => { pushUndo(); ctrl.setFinishes(patch); persist(); render(); };
    body.appendChild(el('p', { id: 'editHint', text: ok ? 'Colors apply live. Pick a whole-house wall color, then override single rooms; door colors, kitchen cabinets, tiles, and the fixture/hardware finish work the same way. Per-door colors: Doors tab. Per-item metal finish: select the item.' : 'View only.' }));
    if (!ok) return;
    body.appendChild(el('h3', { text: 'Wall paint — whole house' }));
    body.appendChild(swatches(WALL_PALETTE, fin.wall, (c) => set({ wall: c }), true));
    body.appendChild(el('h3', { text: 'Wall paint — one room' }));
    const rooms = ctrl.getRooms().filter((r) => r[0] && !r[7]?.outside);
    const names = [...new Set(rooms.map((r) => r[0]))];
    const rs = el('select', { id: 'paintRoom' });
    for (const n of names) rs.appendChild(el('option', { value: n, text: n + (fin.rooms && fin.rooms[n] ? ' ●' : '') }));
    const selRoom = selected?.kind === 'room' ? ctrl.getRooms()[selected.index]?.[0] : null;
    rs.value = (renderColors._room && names.includes(renderColors._room)) ? renderColors._room : (selRoom && names.includes(selRoom) ? selRoom : names[0]);
    rs.onchange = () => { renderColors._room = rs.value; render(); };
    body.appendChild(rs);
    const curRoom = rs.value;
    body.appendChild(swatches(WALL_PALETTE, fin.rooms?.[curRoom], (c) => { renderColors._room = curRoom; set({ rooms: { [curRoom]: c } }); }, true));
    body.appendChild(el('h3', { text: 'Doors' }));
    body.appendChild(el('label', { text: 'All interior doors' }));
    body.appendChild(swatches(DOOR_PALETTE, fin.doorInt, (c) => set({ doorInt: c }), true));
    body.appendChild(el('label', { text: 'All exterior doors' }));
    body.appendChild(swatches(DOOR_PALETTE, fin.doorExt, (c) => set({ doorExt: c }), true));
    body.appendChild(el('h3', { text: 'Fixtures & hardware' }));
    body.appendChild(el('small', { text: 'Faucets, door knobs & levers, cabinet pulls, light-fixture metal, shower & bath fixtures' }));
    const hw = el('div', { class: 'hwlist', id: 'hwList' });
    const opt = [['', 'As designed']].concat(Object.entries(ctrl.hwFinishes || {}).map(([k, f]) => [k, f.label]));
    for (const [k, lab] of opt) {
      const f = (ctrl.hwFinishes || {})[k];
      const b = el('button', { type: 'button', class: 'hw' + ((fin.hardware || '') === k ? ' on' : ''), 'data-hw': k });
      const dot = el('span', { class: 'hwdot' }); dot.style.background = f ? f.color : 'linear-gradient(135deg,#c9a45c,#1c1c1c)';
      b.append(dot, document.createTextNode(lab));
      b.onclick = () => set({ hardware: k || null });
      hw.appendChild(b);
    }
    body.appendChild(hw);

    body.appendChild(el('h3', { text: 'Kitchen cabinets' }));
    body.appendChild(el('small', { text: 'Base cabinets, uppers and the island. Countertops stay as designed.' }));
    body.appendChild(swatches(CABINET_PALETTE, fin.cabinet, (c) => {
      const patch = { cabinet: c };
      if (fin.island) patch.island = fin.island; // keep a two-tone island when the perimeter color changes
      set(patch);
    }, true));
    const toneRow = el('label', { class: 'chk-row' });
    const tone = el('input', { type: 'checkbox', id: 'twoToneIsland' });
    tone.checked = !!fin.island;
    tone.onchange = () => {
      if (tone.checked) set({ island: fin.island || defaultIslandFor(fin.cabinet) });
      else set({ island: null });
    };
    toneRow.append(tone, document.createTextNode(' Two-tone island (different color from the perimeter cabinets)'));
    body.appendChild(toneRow);
    if (fin.island) {
      body.appendChild(el('label', { text: 'Island color' }));
      body.appendChild(swatches(CABINET_PALETTE, fin.island, (c) => set({ island: c || defaultIslandFor(fin.cabinet) }), true));
    }

    body.appendChild(el('h3', { text: 'Tiles' }));
    body.appendChild(el('small', { text: 'Each area can have its own color. “Default” restores the finish as designed.' }));
    const setTile = (k, c) => set({ tiles: { [k]: c } });
    body.appendChild(el('label', { text: 'Kitchen backsplash' }));
    body.appendChild(swatches(TILE_PALETTE, fin.tiles?.backsplash, (c) => setTile('backsplash', c), true));
    body.appendChild(el('label', { text: 'Bathroom floor' }));
    body.appendChild(swatches(TILE_PALETTE, fin.tiles?.bathFloor, (c) => setTile('bathFloor', c), true));
    body.appendChild(el('label', { text: 'Shower / wall tile' }));
    body.appendChild(swatches(TILE_PALETTE, fin.tiles?.shower, (c) => setTile('shower', c), true));
    body.appendChild(el('label', { text: 'Other tiled floors (entry, laundry, mud)' }));
    body.appendChild(swatches(TILE_PALETTE, fin.tiles?.floor, (c) => setTile('floor', c), true));
  }

  function renderWalls(body) {
    const WS = ctrl.getWalls();
    body.appendChild(el('p', { id: 'editHint', text: canEdit() ? 'Click any wall in the 3D view to select it (hover highlights it) — interior, exterior, garage, closet, and segments split by doors or windows. Press Delete or use Remove wall. Removing an exterior wall asks for confirmation. Add a wall, then click two points on the floor.' : 'View only.' }));
    const list = el('div', { id: 'editList' });
    const addKind = (kind, label) => {
      (WS[kind] || []).forEach((w, i) => {
        const horiz = (w[2] - w[0]) >= (w[3] - w[1]);
        const b = el('button', { class: 'item' + (selected?.kind === 'wall' && selected.wallKind === kind && selected.index === i ? ' on' : ''), type: 'button' });
        b.appendChild(document.createTextNode(`${label} ${i + 1}`));
        b.appendChild(el('small', { text: `${horiz ? 'east–west' : 'north–south'} · ${fmtFt(wallLen(w))}` }));
        b.onclick = () => select({ kind: 'wall', wallKind: kind, index: i });
        list.appendChild(b);
      });
    };
    list.appendChild(el('div', { class: 'group', text: 'Interior' }));
    addKind('int', 'Interior wall');
    list.appendChild(el('div', { class: 'group', text: 'Exterior' }));
    addKind('ext', 'Exterior wall');
    body.appendChild(list);
    const wall = selected?.kind === 'wall' ? (WS[selected.wallKind] || [])[selected.index] : null;
    if (wall && canEdit()) body.appendChild(wallInspector(wall, selected.wallKind, selected.index));
    if (canEdit()) {
      const add = el('button', { class: 'add-btn primary', type: 'button', text: '+ Add interior wall' });
      add.onclick = () => { placing = '__wall__'; drawingWall = null; $('editHint').textContent = 'Click a start point on the floor, then an end point.'; };
      body.appendChild(add);
    }
  }

  function wallInspector(wall, kind, index) {
    const wrap = el('div', { id: 'editInspect' });
    const horiz = (wall[2] - wall[0]) >= (wall[3] - wall[1]);
    wrap.appendChild(el('h3', { text: (kind === 'ext' ? 'Exterior' : 'Interior') + ' wall' }));
    const len = el('input', { type: 'number', step: '0.5', value: String(+wallLen(wall).toFixed(2)) });
    len.onchange = () => patchWall(kind, index, { length: parseFloat(len.value) });
    wrap.appendChild(el('label', { text: 'Length (ft)' }));
    wrap.appendChild(len);
    const nudges = el('div', { class: 'nudge' });
    for (const [lab, dx, dy] of [['W −0.5', -0.5, 0], ['E +0.5', 0.5, 0], ['N −0.5', 0, -0.5], ['S +0.5', 0, 0.5]]) {
      const b = el('button', { type: 'button', text: lab });
      b.onclick = () => patchWall(kind, index, { dx, dy });
      nudges.appendChild(b);
    }
    wrap.appendChild(nudges);
    const acts = el('div', { class: 'row' });
    const door = el('button', { type: 'button', text: 'Add doorway' });
    door.onclick = () => { pushUndo(); ctrl.addDoorway(kind, index); persist(); render(); };
    const del = el('button', { type: 'button', class: 'danger', text: 'Remove wall' });
    del.onclick = () => {
      if (!confirmRemoveWall(kind)) return;
      pushUndo();
      ctrl.removeWall(kind, index);
      select(null);
      persist();
      render();
    };
    acts.append(door, del);
    wrap.appendChild(acts);
    if (ctrl.garageWallInfo && ctrl.garageWallInfo(kind, index)) {
      const g = el('div', { class: 'row' });
      for (const [sz, lab] of [['single', '+ Garage door 9′×8′'], ['double', '+ Garage door 16′×8′']]) {
        const b = el('button', { type: 'button', text: lab });
        b.onclick = () => { pushUndo(); const r = ctrl.addGarageDoor(kind, index, sz); if (!r.ok) { undo.pop(); $('editHint').textContent = 'Could not add: ' + r.why; return; } select(null); persist(); tab = 'doors'; render(); };
        g.appendChild(b);
      }
      wrap.appendChild(g);
    }
    void horiz;
    return wrap;
  }

  function patchWall(kind, index, patch) {
    pushUndo();
    ctrl.patchWall(kind, index, patch);
    persist();
    render();
    ctrl.highlight(selected);
  }

  // ----- pointer interaction in the 3D view -----
  function eventToPlan(ev) {
    const canvas = ctrl.canvas;
    const rec = canvas.getBoundingClientRect();
    ndc.x = ((ev.clientX - rec.left) / rec.width) * 2 - 1;
    ndc.y = -((ev.clientY - rec.top) / rec.height) * 2 + 1;
    raycaster.setFromCamera(ndc, ctrl.camera);
    // prefer item meshes
    const itemsGroup = ctrl.itemsGroup();
    if (itemsGroup) {
      const hits = raycaster.intersectObjects(itemsGroup.children, true);
      if (hits[0]) {
        let obj = hits[0].object;
        while (obj && !obj.userData.itemId) obj = obj.parent;
        if (obj?.userData.itemId) {
          const pt = hits[0].point;
          return { kind: 'item', id: obj.userData.itemId, x: pt.x + ctrl.CX(), y: pt.z + ctrl.CZ(), point: pt };
        }
      }
    }
    plane.constant = 0;
    if (raycaster.ray.intersectPlane(plane, hit)) {
      const x = hit.x + ctrl.CX();
      const y = hit.z + ctrl.CZ();
      return { kind: 'floor', x, y, point: hit.clone() };
    }
    return null;
  }

  const canvas = ctrl.canvas;
  canvas.addEventListener('pointerdown', (ev) => {
    if (!drawer.classList.contains('open') || !canEdit()) return;
    if (ev.button !== 0) return;
    const at = eventToPlan(ev);
    if (!at) return;
    if (placing === '__room__' && at.kind === 'floor') {
      ev.preventDefault(); ev.stopPropagation();
      pushUndo();
      const idx = ctrl.addRoom(at.x - 6, at.y - 5, 12, 10);
      placing = null;
      select({ kind: 'room', index: idx });
      persist();
      return;
    }
    if (placing === '__wall__' && at.kind === 'floor') {
      ev.preventDefault(); ev.stopPropagation();
      if (!drawingWall) {
        drawingWall = { x0: at.x, y0: at.y };
        $('editHint').textContent = 'Click the end point of the wall.';
      } else {
        pushUndo();
        ctrl.addWall(drawingWall.x0, drawingWall.y0, at.x, at.y);
        drawingWall = null;
        placing = null;
        persist();
        render();
      }
      return;
    }
    if (placing && placing[0] !== '_') {
      const typ = CATALOG[placing];
      if (typ?.mount === 'roof') {
        const recNdc = new THREE.Vector2();
        const box = canvas.getBoundingClientRect();
        recNdc.x = ((ev.clientX - box.left) / box.width) * 2 - 1;
        recNdc.y = -((ev.clientY - box.top) / box.height) * 2 + 1;
        const rh = ctrl.hitRoof?.(recNdc);
        if (!rh) {
          ev.preventDefault(); ev.stopPropagation();
          if ($('editHint')) $('editHint').textContent = 'Click a roof plane to place the ' + typ.name.toLowerCase() + '.';
          return;
        }
        ev.preventDefault(); ev.stopPropagation();
        pushUndo();
        const rec = makeItem(placing, {
          x: rh.point.x + ctrl.CX(), y: rh.point.z + ctrl.CZ(), z: rh.point.y,
          pitch: rh.pitch, along: rh.along, rot: 0,
        });
        ctrl.setItems([...ctrl.getItems(), rec]);
        placing = null;
        select({ kind: 'item', id: rec.id });
        persist();
        return;
      }
      if (at.kind === 'floor' || typ?.outdoor) {
        const x = at.x, y = at.y;
        if (x == null) return;
        ev.preventDefault(); ev.stopPropagation();
        const rec = makeItem(placing, { x, y, rot: 0 });
        const hitC = isOutdoorItem(placing) ? null : clearanceHit(itemRect(rec), ctrl.getRooms(), ctrl.getWalls(), 0.05);
        showClearance(!!hitC, hitC?.kind);
        if (hitC) return;
        pushUndo();
        ctrl.setItems([...ctrl.getItems(), rec]);
        placing = null;
        select({ kind: 'item', id: rec.id });
        persist();
        return;
      }
    }
    if (!placing) {
      const doorHit = pickDoorAt(ev);
      if (doorHit) {
        ev.preventDefault(); ev.stopPropagation();
        tab = 'doors';
        select({ kind: 'door', index: doorHit.index });
        ctrl.highlightDoor(doorHit.index);
        return;
      }
      const wallHit = pickWallAt(ev);
      if (wallHit) {
        ev.preventDefault(); ev.stopPropagation();
        tab = 'walls';
        select({ kind: 'wall', wallKind: wallHit.wallKind, index: wallHit.index });
        return;
      }
    }
    if (!placing) {
      const handle = hitResizeHandle(ev);
      if (handle) {
        ev.preventDefault(); ev.stopPropagation();
        try { ev.target.setPointerCapture?.(ev.pointerId); } catch {}
        const r = ctrl.getRooms()[handle.room];
        tab = 'rooms';
        select({ kind: 'room', index: handle.room });
        dragging = { resize: handle.room, edge: handle.edge, startX: at.x, startY: at.y, origin: [r[3], r[4], r[5], r[6]], start: currentLayout() };
        ctrl.setOrbitEnabled?.(false);
        return;
      }
    }
    if (at.kind === 'item') {
      ev.preventDefault(); ev.stopPropagation();
      try { ev.target.setPointerCapture?.(ev.pointerId); } catch {}
      select({ kind: 'item', id: at.id });
      if (tab !== 'items') { tab = 'items'; render(); }
      dragging = { id: at.id, lx: at.x ?? 0, ly: at.y ?? 0, start: currentLayout() };
      ctrl.setOrbitEnabled?.(false);
      return;
    }
    if (at.kind === 'floor') {
      const rooms = ctrl.getRooms();
      const wallMax = tab === 'walls' ? 1.8 : 0.65;
      const found = !placing ? nearestWall(at.x, at.y, wallMax) : null;
      const room = roomAtPlan(rooms, at.x, at.y);
      if (found && (tab === 'walls' || !room)) {
        ev.preventDefault(); ev.stopPropagation();
        if (tab !== 'walls') tab = 'walls';
        select(found);
        return;
      }
      if (room && !placing) {
        ev.preventDefault(); ev.stopPropagation();
        try { ev.target.setPointerCapture?.(ev.pointerId); } catch {}
        const index = rooms.indexOf(room);
        if (tab !== 'rooms') tab = 'rooms';
        select({ kind: 'room', index });
        const r = rooms[index];
        dragging = { room: index, startX: at.x, startY: at.y, origin: [r[3], r[4], r[5], r[6]], start: currentLayout() };
        ctrl.setOrbitEnabled?.(false);
        return;
      }
      if (found) {
        ev.preventDefault(); ev.stopPropagation();
        if (tab !== 'walls') tab = 'walls';
        select(found);
      }
    }
  }, true);

  canvas.addEventListener('pointermove', (ev) => {
    if (!dragging) {
      if (drawer.classList.contains('open') && canEdit()) {
        if (placing && placing[0] !== '_') {
          const at = eventToPlan(ev);
          if (at?.kind === 'floor') {
            const rec = makeItem(placing, { x: at.x, y: at.y });
            const hitC = isOutdoorItem(placing) ? null : clearanceHit(itemRect(rec), ctrl.getRooms(), ctrl.getWalls(), 0.05);
            showClearance(!!hitC, hitC?.kind);
          }
        } else {
          const w = pickWallAt(ev);
          if (w) {
            const isSel = selected?.kind === 'wall' && selected.wallKind === w.wallKind && selected.index === w.index;
            ctrl.highlight(isSel ? selected : { ...w, hover: true });
          } else if (selected?.kind === 'wall') ctrl.highlight(selected);
          else if (selected?.kind === 'door') ctrl.highlightDoor(selected.index);
          else if (selected) ctrl.highlight(selected);
          else ctrl.highlight(null);
        }
      }
      return;
    }
    const at = eventToPlan(ev);
    if (!at || at.kind === 'item' && !at.x) {
      // try floor
    }
    const plan = eventToPlan(ev);
    if (!plan || plan.x == null) return;
    if (dragging.id) {
      const items = cloneItems(ctrl.getItems());
      const it = items.find((x) => x.id === dragging.id);
      if (!it) return;
      it.x = plan.x;
      it.y = plan.y;
      const typ = CATALOG[it.type];
      const hitC = typ && isOutdoorItem(it.type) ? null : clearanceHit(itemRect(it), ctrl.getRooms(), ctrl.getWalls(), 0.05);
      showClearance(!!hitC, hitC?.kind);
      if (hitC) return;
      ctrl.setItems(items, { soft: true });
      ctrl.highlight({ kind: 'item', id: it.id });
    } else if (dragging.resize != null) {
      const o = dragging.origin;
      let x0 = o[0], y0 = o[1], x1 = o[2], y1 = o[3];
      const min = 3;
      if (dragging.edge === 'w') x0 = Math.min(snapFt(plan.x), x1 - min);
      if (dragging.edge === 'e') x1 = Math.max(snapFt(plan.x), x0 + min);
      if (dragging.edge === 'n') y0 = Math.min(snapFt(plan.y), y1 - min);
      if (dragging.edge === 's') y1 = Math.max(snapFt(plan.y), y0 + min);
      const cur = ctrl.getRooms()[dragging.resize];
      if (cur && (cur[3] !== x0 || cur[4] !== y0 || cur[5] !== x1 || cur[6] !== y1)) {
        ctrl.patchRoom(dragging.resize, { resizeTo: [x0, y0, x1, y1], soft: true });
      }
      ctrl.highlight({ kind: 'room', index: dragging.resize });
    } else if (dragging.room != null) {
      const rooms = ctrl.getRooms();
      const [dx, dy] = snapRoomDelta(dragging.origin, plan.x - dragging.startX, plan.y - dragging.startY, rooms, dragging.room);
      const cur = rooms[dragging.room];
      if (!cur) return;
      const adx = (dragging.origin[0] + dx) - cur[3];
      const ady = (dragging.origin[1] + dy) - cur[4];
      if (Math.abs(adx) > 0.001 || Math.abs(ady) > 0.001) {
        ctrl.patchRoom(dragging.room, { dx: adx, dy: ady, soft: true });
      }
      ctrl.highlight({ kind: 'room', index: dragging.room });
    }
  });
  const endDrag = () => {
    if (!dragging) return;
    const moved = dragging.start;
    if (moved) {
      undo.push(moved);
      if (undo.length > 40) undo.shift();
    }
    const wasRoom = dragging.room != null || dragging.resize != null;
    dragging = null;
    ctrl.setOrbitEnabled?.(true);
    if (wasRoom) ctrl.rebuildPlan?.();
    persist();
    render();
    showClearance(false);
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  function snapFt(v, step = 0.5) { return Math.round(v / step) * step; }
  function snapRoomDelta(origin, rawDx, rawDy, rooms, index) {
    let x0 = snapFt(origin[0] + rawDx), y0 = snapFt(origin[1] + rawDy);
    const w = origin[2] - origin[0], d = origin[3] - origin[1];
    const snap = 0.75;
    let adjX = 0, adjY = 0, bestX = snap, bestY = snap;
    for (let i = 0; i < (rooms || []).length; i++) {
      if (i === index) continue;
      const r = rooms[i];
      if (r[7]?.outside) continue;
      for (const edge of [r[3], r[5]]) {
        for (const mine of [x0, x0 + w]) {
          const delta = edge - mine;
          if (Math.abs(delta) < bestX) { bestX = Math.abs(delta); adjX = delta; }
        }
      }
      for (const edge of [r[4], r[6]]) {
        for (const mine of [y0, y0 + d]) {
          const delta = edge - mine;
          if (Math.abs(delta) < bestY) { bestY = Math.abs(delta); adjY = delta; }
        }
      }
    }
    return [snapFt(x0 + adjX) - origin[0], snapFt(y0 + adjY) - origin[1]];
  }
  function roomAtPlan(rooms, x, y) {
    let outdoor = null;
    for (const r of rooms || []) {
      if (x >= r[3] && x <= r[5] && y >= r[4] && y <= r[6]) {
        if ((r[7] && r[7].outside) || isPorchLike(r)) outdoor = r;
        else return r;
      }
    }
    return outdoor;
  }
  function hitResizeHandle(ev) {
    const group = ctrl.highlightGroup?.();
    if (!group || !group.children.length) return null;
    const box = canvas.getBoundingClientRect();
    ndc.x = ((ev.clientX - box.left) / box.width) * 2 - 1;
    ndc.y = -((ev.clientY - box.top) / box.height) * 2 + 1;
    raycaster.setFromCamera(ndc, ctrl.camera);
    const hits = raycaster.intersectObjects(group.children, true);
    for (const h of hits) {
      let o = h.object;
      while (o) {
        if (o.userData && o.userData.resizeEdge != null) {
          return { edge: o.userData.resizeEdge, room: o.userData.resizeRoom };
        }
        o = o.parent;
      }
    }
    return null;
  }
  function pickWallAt(ev) {
    const rec = canvas.getBoundingClientRect();
    ndc.x = ((ev.clientX - rec.left) / rec.width) * 2 - 1;
    ndc.y = -((ev.clientY - rec.top) / rec.height) * 2 + 1;
    if (ctrl.pickWall) {
      const hit = ctrl.pickWall(ndc);
      if (hit) return hit;
    }
    const at = eventToPlan(ev);
    if (!at || at.x == null) return null;
    return nearestWall(at.x, at.y, 1.8);
  }
  function pickDoorAt(ev) {
    const rec = canvas.getBoundingClientRect();
    ndc.x = ((ev.clientX - rec.left) / rec.width) * 2 - 1;
    ndc.y = -((ev.clientY - rec.top) / rec.height) * 2 + 1;
    if (ctrl.pickDoor) {
      const hit = ctrl.pickDoor(ndc);
      if (hit) return hit;
    }
    const at = eventToPlan(ev);
    if (!at || at.x == null) return null;
    return nearestDoor(at.x, at.y, 0.85);
  }
  function nearestDoor(x, y, max = 0.85) {
    const list = ctrl.getWalls()?.door || [];
    let best = null, bestD = max;
    list.forEach((w, i) => {
      const d = distToSeg(x, y, w[0], w[1], w[2], w[3]);
      if (d < bestD) { bestD = d; best = { kind: 'door', index: i }; }
    });
    return best;
  }
  function nearestWall(x, y, max = 1.2) {

    const WS = ctrl.getWalls();
    let best = null, bestD = max;
    for (const kind of ['int', 'ext']) {
      (WS[kind] || []).forEach((w, i) => {
        const d = distToSeg(x, y, w[0], w[1], w[2], w[3]);
        if (d < bestD) { bestD = d; best = { kind: 'wall', wallKind: kind, index: i }; }
      });
    }
    return best;
  }
  function distToSeg(px, py, x0, y0, x1, y1) {
    // distance to the wall rectangle in plan (axis-aligned or a thin angled box)
    const minx = Math.min(x0, x1), maxx = Math.max(x0, x1);
    const miny = Math.min(y0, y1), maxy = Math.max(y0, y1);
    const dx = Math.max(minx - px, 0, px - maxx);
    const dy = Math.max(miny - py, 0, py - maxy);
    const lenx = maxx - minx, leny = maxy - miny;
    if (lenx > 0.3 && leny > 0.3 && Math.min(lenx, leny) > 0.6) {
      // likely a fat/angled segment: also compare to the centerline
      const ax = x1 - x0, ay = y1 - y0, l2 = ax * ax + ay * ay || 1;
      let t = ((px - x0) * ax + (py - y0) * ay) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.min(Math.hypot(dx, dy), Math.hypot(px - (x0 + t * ax), py - (y0 + t * ay)));
    }
    return Math.hypot(dx, dy);
  }

  const api = {
    open, close, isOpen: () => drawer.classList.contains('open'),
    refresh: () => { if (drawer.classList.contains('open')) render(); },
    select,
  };
  ctrl._editor = api;
  mountPlanEditor._api = api;
  mountPlanEditor._ctrl = ctrl;
  return api;
}

function ensureStyles() {
  if (document.querySelector('link[data-plan-editor]')) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = new URL('../css/plan-editor.css', import.meta.url).href;
  l.dataset.planEditor = '1';
  document.head.appendChild(l);
}
function ensureEditButton() {
  let b = document.getElementById('bEdit');
  if (b) return b;
  const bar = document.querySelector('#hud .btns') || document.getElementById('hud');
  b = el('button', { id: 'bEdit', type: 'button', text: 'Edit' });
  if (bar) bar.appendChild(b);
  return b;
}
function buildDrawer() {
  const d = el('aside', { id: 'editDrawer', role: 'dialog', 'aria-label': 'Edit plan' });
  const header = el('header');
  header.appendChild(el('strong', { text: 'Edit plan' }));
  const acts = el('div', { class: 'edit-actions' });
  acts.append(
    el('button', { type: 'button', 'data-act': 'undo', text: 'Undo' }),
    el('button', { type: 'button', 'data-act': 'reset', text: 'Reset' }),
    el('button', { type: 'button', 'data-act': 'save', class: 'primary', text: 'Save' }),
    el('button', { type: 'button', 'data-act': 'close', text: '✕' }),
  );
  header.appendChild(acts);
  const tabs = el('div', { id: 'editTabs' });
  tabs.append(
    el('button', { type: 'button', 'data-tab': 'items', class: 'on', text: 'Items' }),
    el('button', { type: 'button', 'data-tab': 'rooms', text: 'Rooms' }),
    el('button', { type: 'button', 'data-tab': 'walls', text: 'Walls' }),
    el('button', { type: 'button', 'data-tab': 'doors', text: 'Doors', title: 'Remove, restore, recolor doors; add or resize garage doors' }),
    el('button', { type: 'button', 'data-tab': 'colors', text: 'Colors', title: 'Wall paint, doors, cabinets, tiles, fixture & hardware finishes' }),
  );
  d.append(header, tabs, el('div', { id: 'editBody' }), el('div', { id: 'editStatus', text: '' }));
  return d;
}


async function uploadProjectThumb(ctrl) {
  if (!ctrl?.captureThumb || ctrl.src?.kind !== 'project' || !ctrl.src.id) return;
  try {
    const { upload } = await import('/js/blob-client.js');
    const { me, api } = await import('/js/common.js');
    const user = await me();
    if (!user) return;
    const blob = await ctrl.captureThumb();
    if (!blob) return;
    const file = new File([blob], 'thumb.jpg', { type: 'image/jpeg' });
    const up = await upload(`files/${user.id}/${ctrl.src.id}/thumb.jpg`, file, {
      access: 'private',
      handleUploadUrl: '/api/upload',
      clientPayload: JSON.stringify({ pid: ctrl.src.id, kind: 'thumb' }),
      contentType: 'image/jpeg',
    });
    await api('projects/' + encodeURIComponent(ctrl.src.id) + '/files', {
      method: 'POST',
      body: { pathname: up.pathname, name: 'thumb.jpg', kind: 'thumb' },
    });
  } catch (e) {
    console.warn('Could not save project thumbnail', e);
  }
}
