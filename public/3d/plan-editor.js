// PeakStead Designs — interactive Edit panel: Items, Rooms, and Walls.
import * as THREE from 'three';
import {
  CATALOG, CATEGORIES, FINISHES, makeItem, itemRect, clearanceHit, isHallName,
  newItemId, roomOfPoint,
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
  if (!items && !rooms && !walls) return null;
  return { version: 1, items, rooms, walls };
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
  let selected = null; // { kind: 'item'|'room'|'wall', id, index, ... }
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
      version: 1,
      items: cloneItems(ctrl.getItems()),
      rooms: cloneRooms(ctrl.getRooms()),
      walls: cloneWalls(ctrl.getWalls()),
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
  drawer.querySelector('[data-act=undo]').onclick = () => {
    const prev = undo.pop();
    if (!prev) return;
    ctrl.applyLayout(prev);
    selected = null;
    render();
    ctrl.highlight(null);
    persist();
  };
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
  drawer.querySelector('[data-act=save]').onclick = () => persist();
  drawer.querySelectorAll('#editTabs button').forEach((b) => {
    b.onclick = () => { tab = b.dataset.tab; placing = null; drawingWall = null; render(); };
  });

  function render() {
    drawer.querySelectorAll('#editTabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    const body = $('editBody');
    body.innerHTML = '';
    if (tab === 'items') renderItems(body);
    else if (tab === 'rooms') renderRooms(body);
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
      const g = room ? room[0] : 'Unplaced';
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
        b.onclick = () => { placing = placing === id ? null : id; paintTypes(); $('editHint').textContent = placing ? 'Click the floor in the 3D view to place the ' + t.name.toLowerCase() + '.' : 'Click an item in the list or in the 3D view.'; };
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
    const hit = clearanceHit(itemRect(next), ctrl.getRooms(), ctrl.getWalls(), 0.05);
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
    body.appendChild(el('p', { id: 'editHint', text: canEdit() ? 'Select a room to move, resize, rename, or cut it out. Add a room, then click the floor to place it.' : 'View only.' }));
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

  function renderWalls(body) {
    const WS = ctrl.getWalls();
    body.appendChild(el('p', { id: 'editHint', text: canEdit() ? 'Select a wall to cut a doorway, move it, or remove it. Add a wall, then click two points on the floor.' : 'View only.' }));
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
    const del = el('button', { type: 'button', class: 'danger', text: 'Remove / cut out wall' });
    del.onclick = () => {
      pushUndo();
      ctrl.removeWall(kind, index);
      select(null);
      persist();
      render();
    };
    acts.append(door, del);
    wrap.appendChild(acts);
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
        if (obj?.userData.itemId) return { kind: 'item', id: obj.userData.itemId, point: hits[0].point };
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
    if (placing && placing[0] !== '_' && at.kind === 'floor') {
      ev.preventDefault(); ev.stopPropagation();
      const t = CATALOG[placing];
      const rec = makeItem(placing, { x: at.x, y: at.y, rot: 0 });
      const hitC = clearanceHit(itemRect(rec), ctrl.getRooms(), ctrl.getWalls(), 0.05);
      showClearance(!!hitC, hitC?.kind);
      if (hitC) return;
      pushUndo();
      ctrl.setItems([...ctrl.getItems(), rec]);
      placing = null;
      select({ kind: 'item', id: rec.id });
      persist();
      return;
    }
    if (at.kind === 'item') {
      ev.preventDefault(); ev.stopPropagation();
      select({ kind: 'item', id: at.id });
      if (tab !== 'items') { tab = 'items'; render(); }
      dragging = { id: at.id, lx: at.x ?? 0, ly: at.y ?? 0, start: currentLayout() };
      return;
    }
    if (at.kind === 'floor') {
      const rooms = ctrl.getRooms();
      const room = roomOfPoint(rooms, at.x, at.y);
      if (room && tab === 'rooms') {
        ev.preventDefault(); ev.stopPropagation();
        const index = rooms.indexOf(room);
        select({ kind: 'room', index });
        dragging = { room: index, lx: at.x, ly: at.y, start: currentLayout() };
        return;
      }
      if (tab === 'walls') {
        const found = nearestWall(at.x, at.y);
        if (found) {
          ev.preventDefault(); ev.stopPropagation();
          select(found);
        }
      }
    }
  }, true);

  canvas.addEventListener('pointermove', (ev) => {
    if (!dragging) {
      if (placing && drawer.classList.contains('open')) {
        const at = eventToPlan(ev);
        if (at?.kind === 'floor' && placing[0] !== '_') {
          const rec = makeItem(placing, { x: at.x, y: at.y });
          const hitC = clearanceHit(itemRect(rec), ctrl.getRooms(), ctrl.getWalls(), 0.05);
          showClearance(!!hitC, hitC?.kind);
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
      const hitC = clearanceHit(itemRect(it), ctrl.getRooms(), ctrl.getWalls(), 0.05);
      showClearance(!!hitC, hitC?.kind);
      if (hitC) return;
      ctrl.setItems(items, { soft: true });
      ctrl.highlight({ kind: 'item', id: it.id });
    } else if (dragging.room != null) {
      const dx = plan.x - dragging.lx, dy = plan.y - dragging.ly;
      dragging.lx = plan.x; dragging.ly = plan.y;
      ctrl.patchRoom(dragging.room, { dx, dy, soft: true });
      ctrl.highlight({ kind: 'room', index: dragging.room });
    }
  });
  const endDrag = () => {
    if (!dragging) return;
    if (dragging.start) {
      undo.push(dragging.start);
      if (undo.length > 40) undo.shift();
    }
    dragging = null;
    persist();
    render();
    showClearance(false);
  };
  window.addEventListener('pointerup', endDrag);

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
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const horiz = Math.abs(x1 - x0) >= Math.abs(y1 - y0);
    if (horiz) {
      if (px < Math.min(x0, x1) || px > Math.max(x0, x1)) return Math.hypot(px - cx, py - cy);
      return Math.abs(py - cy);
    }
    if (py < Math.min(y0, y1) || py > Math.max(y0, y1)) return Math.hypot(px - cx, py - cy);
    return Math.abs(px - cx);
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
  );
  d.append(header, tabs, el('div', { id: 'editBody' }), el('div', { id: 'editStatus', text: '' }));
  return d;
}
