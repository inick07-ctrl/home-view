// PeakStead Designs — Builder room catalog, templates, and plan-to-model compiler.
import { makeWalls } from '/3d/lib.js';

export const GRID = 1;
export const SNAP = 3;
export const STAGING_TOP = -22;

export const OPEN_CONCEPT = /kitchen|dining|living|family|media|entry|foyer/i;
export const HALL_LIKE = /hall/i;
export const WET = /bath|closet|storage|laundry|utility|powder/i;
export const SLEEP = /bedroom|guest|master bedroom|primary bedroom/i;

const ftIn = (n) => {
  const f = Math.floor(n + 1e-6);
  const inch = Math.round((n - f) * 12);
  return inch ? `${f}'-${inch}"` : `${f}'-0"`;
};
export function formatDims(w, d) { return `${ftIn(w)} x ${ftIn(d)}`; }

export const ROOM_TYPES = [
  { id: 'master-bedroom', name: 'Master Bedroom', group: 'Sleep', floor: 'wood', color: '#c9a46a',
    sizes: { compact: [10, 12], medium: [13, 15], large: [16, 20] } },
  { id: 'bedroom', name: 'Standard Bedroom', group: 'Sleep', floor: 'wood', color: '#d4b483',
    sizes: { compact: [9, 10], medium: [11, 13], large: [14, 16] } },
  { id: 'guest-bedroom', name: 'Guest Bedroom', group: 'Sleep', floor: 'wood', color: '#cbb892',
    sizes: { compact: [8, 10], medium: [10, 12], large: [12, 14] } },
  { id: 'master-bath', name: 'Master Bathroom', group: 'Bath', floor: 'tile', color: '#8fa8b8',
    sizes: { compact: [6, 7], medium: [8, 10], large: [10, 14] } },
  { id: 'bathroom', name: 'Standard Bathroom', group: 'Bath', floor: 'tile', color: '#9bb3c0',
    sizes: { compact: [5, 7], medium: [6, 8], large: [8, 10] } },
  { id: 'living', name: 'Living Room', group: 'Living', floor: 'wood', color: '#c07a54',
    sizes: { compact: [11, 14], medium: [14, 18], large: [18, 24] } },
  { id: 'dining', name: 'Dining Room', group: 'Living', floor: 'wood', color: '#b8895a',
    sizes: { compact: [9, 11], medium: [11, 14], large: [14, 18] } },
  { id: 'kitchen', name: 'Kitchen', group: 'Living', floor: 'wood', color: '#d9c4a0',
    sizes: { compact: [7, 10], medium: [10, 13], large: [14, 18] } },
  { id: 'entry', name: 'Entry / Foyer', group: 'Living', floor: 'tile', color: '#cfc6b5',
    sizes: { compact: [5, 7], medium: [7, 10], large: [10, 14] } },
  { id: 'laundry', name: 'Laundry / Utility', group: 'Utility', floor: 'tile', color: '#a8b59a',
    sizes: { compact: [5, 7], medium: [6, 9], large: [8, 12] } },
  { id: 'office', name: 'Home Office / Study', group: 'Utility', floor: 'wood', color: '#8e7a62',
    sizes: { compact: [8, 10], medium: [10, 12], large: [12, 14] } },
  { id: 'family', name: 'Family / Media Room', group: 'Living', floor: 'wood', color: '#b5694a',
    sizes: { compact: [10, 14], medium: [13, 17], large: [16, 22] } },
  { id: 'closet', name: 'Walk-in Closet', group: 'Utility', floor: 'wood', color: '#b6a894',
    sizes: { compact: [4, 6], medium: [6, 9], large: [8, 12] } },
  { id: 'garage', name: 'Garage', group: 'Utility', floor: 'concrete', color: '#8b9098',
    sizes: { compact: [11, 20], medium: [14, 22], large: [20, 24], '3-car': [32, 24] } },
  { id: 'storage', name: 'Storage / Utility Room', group: 'Utility', floor: 'wood', color: '#9a927f',
    sizes: { compact: [4, 9], medium: [6, 9], large: [8, 12] } },
  { id: 'hallway', name: 'Hallway', group: 'Connect', floor: 'wood', color: '#e6dfd2',
    sizes: { compact: [4, 12], large: [4, 20] } },
  { id: 'porch', name: 'Covered Porch', group: 'Connect', floor: 'porch', color: '#c9b897', outside: true,
    sizes: { compact: [16, 8], large: [24, 10] } },
  { id: 'patio', name: 'Patio / Deck', group: 'Connect', floor: 'terrace', color: '#b9a890', outside: true,
    sizes: { compact: [12, 10], medium: [16, 12], large: [24, 14] } },
  { id: 'pool', name: 'Pool', group: 'Yard', floor: 'water', color: '#3a7ca5', outside: true, feature: 'pool',
    sizes: { plunge: [12, 8], small: [24, 12], medium: [32, 16], large: [40, 20], kidney: [32, 16], spa: [8, 8] } },
  { id: 'solar-ground', name: 'Ground solar array', group: 'Yard', floor: 'concrete', color: '#1e2a38', outside: true, feature: 'solar-ground',
    sizes: { '8-panel': [20, 10], '12-panel': [24, 12], '20-panel': [34, 14] } },
  { id: 'solar-roof', name: 'Roof solar array', group: 'Yard', floor: 'concrete', color: '#243044', outside: true, feature: 'solar-roof',
    sizes: { '6-panel': [18, 8], '12-panel': [24, 12], '20-panel': [28, 14], '30-panel': [34, 16] } },
];

export const TYPE_BY_ID = Object.fromEntries(ROOM_TYPES.map((t) => [t.id, t]));

let _seq = 1;
export function newId(prefix = 'rm') { return prefix + '_' + (_seq++) + '_' + Math.random().toString(36).slice(2, 7); }

export function defaultSizeKey(type) {
  const t = TYPE_BY_ID[type];
  if (!t) return 'medium';
  if (t.sizes.medium) return 'medium';
  if (t.sizes.large) return 'large';
  return Object.keys(t.sizes)[0];
}

export function newBlock(typeId, sizeKey, x, y, extras = {}) {
  const t = TYPE_BY_ID[typeId];
  if (!t) throw new Error('Unknown room type ' + typeId);
  const key = (sizeKey && t.sizes[sizeKey]) ? sizeKey : defaultSizeKey(typeId);
  const [w, d] = t.sizes[key];
  return {
    id: extras.id || newId(),
    type: typeId,
    name: t.name,
    x: +x || 0,
    y: +y || 0,
    w, d,
    rot: 0,
    sizeKey: key,
    staging: !!extras.staging,
    ...extras,
  };
}

export function blockRect(b) {
  return { x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.d, w: b.w, d: b.d };
}

export function rotateBlock(b) {
  const cx = b.x + b.w / 2, cy = b.y + b.d / 2;
  const w = b.d, d = b.w;
  return { ...b, w, d, x: snapGrid(cx - w / 2), y: snapGrid(cy - d / 2), rot: (b.rot + 90) % 180 };
}

export function snapGrid(n, step = GRID) { return Math.round(n / step) * step; }

export function isStaging(b) { return !!b.staging || b.y + b.d <= 0; }

export function onLot(b) { return !isStaging(b); }

export function overlapArea(a, b) {
  const x0 = Math.max(a.x, b.x), y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w), y1 = Math.min(a.y + a.d, b.y + b.d);
  return (x1 > x0 && y1 > y0) ? (x1 - x0) * (y1 - y0) : 0;
}

export function findOverlaps(blocks, target, ignoreId, minArea = 0.25) {
  return blocks.filter((b) => b.id !== ignoreId && overlapArea(target, b) > minArea);
}

/** Snap a moving rect against a 1 ft grid and flush against neighboring edges. */
export function snapPlacement(blocks, moving, ignoreId) {
  let x = snapGrid(moving.x), y = snapGrid(moving.y);
  const w = moving.w, d = moving.d;
  let guide = null;
  const others = blocks.filter((b) => b.id !== ignoreId && onLot(b) === onLot({ ...moving, x, y }));
  let best = SNAP + 0.001;
  const consider = (dist, nx, ny, g) => {
    if (Math.abs(dist) < best) { best = Math.abs(dist); x = nx; y = ny; guide = g; }
  };
  for (const o of others) {
    const ox0 = o.x, oy0 = o.y, ox1 = o.x + o.w, oy1 = o.y + o.d;
    const yOv = Math.min(y + d, oy1) - Math.max(y, oy0);
    const xOv = Math.min(x + w, ox1) - Math.max(x, ox0);
    // Flush vertical edges (A's east to B's west, etc.) when the rooms would share a y-span
    if (yOv > 1.5) {
      consider(x + w - ox0, ox0 - w, y, { kind: 'v', x: ox0, y0: Math.max(y, oy0), y1: Math.min(y + d, oy1) });
      consider(x - ox1, ox1, y, { kind: 'v', x: ox1, y0: Math.max(y, oy0), y1: Math.min(y + d, oy1) });
      consider(x - ox0, ox0, y, { kind: 'v', x: ox0, align: true });
      consider(x + w - ox1, ox1 - w, y, { kind: 'v', x: ox1, align: true });
    }
    if (xOv > 1.5) {
      consider(y + d - oy0, x, oy0 - d, { kind: 'h', y: oy0, x0: Math.max(x, ox0), x1: Math.min(x + w, ox1) });
      consider(y - oy1, x, oy1, { kind: 'h', y: oy1, x0: Math.max(x, ox0), x1: Math.min(x + w, ox1) });
      consider(y - oy0, x, oy0, { kind: 'h', y: oy0, align: true });
      consider(y + d - oy1, x, oy1 - d, { kind: 'h', y: oy1, align: true });
    }
  }
  // Re-grid after edge snap so we stay on whole feet
  x = snapGrid(x); y = snapGrid(y);
  return { x, y, guide };
}

export function starterParts() {
  return [
    newBlock('bedroom', 'medium', 0, STAGING_TOP + 2, { staging: true }),
    newBlock('bathroom', 'medium', 13, STAGING_TOP + 2, { staging: true }),
    newBlock('hallway', 'compact', 21, STAGING_TOP + 2, { staging: true }),
    newBlock('porch', 'compact', 27, STAGING_TOP + 4, { staging: true }),
    newBlock('patio', 'compact', 46, STAGING_TOP + 4, { staging: true }),
  ];
}

export const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    blurb: 'A parts tray and an empty lot — grab a block and start snapping.',
    build() { return starterParts(); },
  },
  {
    id: 'ranch',
    name: 'Starter Ranch Core',
    blurb: 'Kitchen, dining, and living in an open row, with an entry on the front.',
    build() {
      const kitchen = newBlock('kitchen', 'medium', 0, 0);
      const dining = newBlock('dining', 'medium', 10, 0);
      const living = newBlock('living', 'medium', 21, 0);
      const entry = newBlock('entry', 'medium', 21, 18);
      return [kitchen, dining, living, entry, ...starterParts()];
    },
  },
  {
    id: 'lshape',
    name: 'L-Shape Starter',
    blurb: 'A bedroom wing off a hallway, open living and kitchen around the corner.',
    build() {
      const bed = newBlock('bedroom', 'medium', 0, 0);
      const bath = newBlock('bathroom', 'medium', 0, 13);
      const hall = newBlock('hallway', 'large', 11, 0);
      // rotate hall to run south from the bedrooms? 4x20 default is 4 wide 20 deep if we rotate
      const hallR = { ...hall, w: 4, d: 20, x: 11, y: 0 };
      const living = newBlock('living', 'medium', 15, 0);
      const kitchen = newBlock('kitchen', 'medium', 15, 18);
      const entry = newBlock('entry', 'compact', 11, 20);
      entry.w = 4; entry.d = 7; entry.x = 11; entry.y = 20;
      return [bed, bath, hallR, living, kitchen, entry, ...starterParts().map((p, i) => ({ ...p, x: 36 + i * 12 }))];
    },
  },
];

export function templateById(id) { return TEMPLATES.find((t) => t.id === id) || TEMPLATES[1]; }

function openingKind(a, b) {
  const names = `${a.name} ${b.name}`;
  if (/porch/i.test(names)) return 'french';
  if (OPEN_CONCEPT.test(a.name) && OPEN_CONCEPT.test(b.name)) return 'cased';
  if (HALL_LIKE.test(a.name) && OPEN_CONCEPT.test(b.name)) return 'cased';
  if (HALL_LIKE.test(b.name) && OPEN_CONCEPT.test(a.name)) return 'cased';
  return 'door';
}

const EPS = 0.08;

export function findAdjacencies(blocks) {
  const lot = blocks.filter(onLot);
  const hits = [];
  for (let i = 0; i < lot.length; i++) {
    for (let j = i + 1; j < lot.length; j++) {
      const a = lot[i], b = lot[j];
      const ax0 = a.x, ay0 = a.y, ax1 = a.x + a.w, ay1 = a.y + a.d;
      const bx0 = b.x, by0 = b.y, bx1 = b.x + b.w, by1 = b.y + b.d;
      const x0 = Math.max(ax0, bx0), x1 = Math.min(ax1, bx1);
      const y0 = Math.max(ay0, by0), y1 = Math.min(ay1, by1);
      if (x1 - x0 >= 2 && Math.abs(ay1 - by0) < EPS) {
        hits.push({ a, b, horiz: true, y: ay1, x0, x1, sideA: 's', sideB: 'n', kind: openingKind(a, b) });
      } else if (x1 - x0 >= 2 && Math.abs(by1 - ay0) < EPS) {
        hits.push({ a, b, horiz: true, y: by1, x0, x1, sideA: 'n', sideB: 's', kind: openingKind(a, b) });
      } else if (y1 - y0 >= 2 && Math.abs(ax1 - bx0) < EPS) {
        hits.push({ a, b, horiz: false, x: ax1, y0, y1, sideA: 'e', sideB: 'w', kind: openingKind(a, b) });
      } else if (y1 - y0 >= 2 && Math.abs(bx1 - ax0) < EPS) {
        hits.push({ a, b, horiz: false, x: bx1, y0, y1, sideA: 'w', sideB: 'e', kind: openingKind(a, b) });
      }
    }
  }
  return hits;
}

function openingSpan(hit) {
  const span = hit.horiz ? (hit.x1 - hit.x0) : (hit.y1 - hit.y0);
  if (hit.kind === 'cased') {
    const mid = hit.horiz ? (hit.x0 + hit.x1) / 2 : (hit.y0 + hit.y1) / 2;
    const half = Math.min(span / 2 - 0.4, Math.max(3.5, span / 2 - 0.5));
    return [mid - half, mid + half];
  }
  if (hit.kind === 'french') {
    const mid = hit.horiz ? (hit.x0 + hit.x1) / 2 : (hit.y0 + hit.y1) / 2;
    const half = Math.min(3, span / 2 - 0.3);
    return [mid - Math.max(1.5, half), mid + Math.max(1.5, half)];
  }
  const mid = hit.horiz ? (hit.x0 + hit.x1) / 2 : (hit.y0 + hit.y1) / 2;
  const half = Math.min(1.5, span / 2 - 0.25);
  return [mid - Math.max(1.25, half), mid + Math.max(1.25, half)];
}

function edgeOpenings(block, adj) {
  const sides = { n: [], s: [], e: [], w: [] };
  for (const h of adj) {
    const mine = h.a.id === block.id ? h.sideA : h.b.id === block.id ? h.sideB : null;
    if (!mine) continue;
    const [s, e] = openingSpan(h);
    sides[mine].push({ s, e, kind: h.kind, ext: /porch/i.test(h.a.name) || /porch/i.test(h.b.name), hit: h });
  }
  return sides;
}

function addWindows(segLen, a, b) {
  if (segLen < 5) return [];
  const wins = [];
  if (segLen < 10) {
    const mid = (a + b) / 2;
    const half = Math.min(2, (b - a) / 2 - 0.4);
    if (half > 1) wins.push([mid - half, mid + half, 3, 7]);
  } else {
    const n = segLen > 22 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const mid = a + ((i + 0.5) / n) * (b - a);
      wins.push([mid - 2, mid + 2, 3, 7]);
    }
  }
  return wins;
}

function garageDoorSpans(a, b, bays) {
  const span = b - a;
  const door = Math.min(9, Math.max(8, (span - (bays + 1) * 1.5) / bays));
  const used = bays * door + (bays + 1) * 1.5;
  let cur = a + (span - used) / 2 + 1.5;
  const doors = [];
  for (let i = 0; i < bays; i++) {
    doors.push([cur, cur + door, 8]);
    cur += door + 1.5;
  }
  return doors;
}

function preferredFront(block, sides) {
  // Prefer a south exterior stretch; else the longest exterior side.
  const scores = { s: 4, n: 2, e: 1, w: 1 };
  let best = null, bestScore = -1;
  for (const side of ['s', 'n', 'e', 'w']) {
    if (sides[side].length) continue; // has an interior opening — still may have leftover ext, but skip for simplicity
    const len = (side === 'n' || side === 's') ? block.w : block.d;
    const score = (scores[side] || 0) * len;
    if (score > bestScore) { best = side; bestScore = score; }
  }
  return best;
}

/** Compile lot blocks into a PeakStead JSON model (rooms, walls, roofs, slabs…). */
export function compileModel(allBlocks, meta = {}) {
  const blocks = allBlocks.filter(onLot);
  const walls = makeWalls();
    const adj = findAdjacencies(blocks.filter((b) => !(TYPE_BY_ID[b.type] || {}).feature));
  const rooms = [];
  const slabs = [];
  const ceilings = [];
  const furnish = [];
  const placedItems = [];
  const wallH = meta.wallH || 9;

  const featureType = (b) => (TYPE_BY_ID[b.type] || {}).feature || null;
  const poolSizeToItem = (b) => {
    const map = { plunge: 'poolPlunge', small: 'poolSmall', medium: 'poolMedium', large: 'poolLarge', kidney: 'poolKidney', spa: 'hotTub' };
    return map[b.sizeKey] || 'poolMedium';
  };
  const solarSizeToItem = (b, ground) => {
    const n = parseInt(b.sizeKey, 10) || (ground ? 12 : 12);
    if (ground) return n >= 20 ? 'solarGround20' : n >= 12 ? 'solarGround12' : 'solarGround8';
    return n >= 30 ? 'solarRoof30' : n >= 20 ? 'solarRoof20' : n >= 12 ? 'solarRoof12' : 'solarRoof6';
  };

  for (const b of blocks) {
    const t = TYPE_BY_ID[b.type] || {};
    if (t.feature) {
      const item = {
        type: t.feature === 'pool' ? poolSizeToItem(b) : solarSizeToItem(b, t.feature === 'solar-ground'),
        x: b.x + b.w / 2,
        y: b.y + b.d / 2,
        w: b.w,
        d: b.d,
        rot: b.rot || 0,
      };
      if (t.feature === 'pool' && b.sizeKey === 'kidney') item.variant = 'kidney';
      if (t.feature === 'pool' && b.sizeKey === 'spa') item.variant = 'spa';
      placedItems.push(item);
      continue;
    }
    const outside = !!t.outside || /porch|patio|deck/i.test(b.name);
    const vaulted = /living|family/i.test(b.name) && Math.max(b.w, b.d) >= 16;
    const opts = { };
    if (outside) opts.outside = true;
    if (vaulted) opts.vaulted = true;
    if (/closet|storage|hallway|bath/i.test(b.name) && Math.min(b.w, b.d) <= 7) opts.minor = true;
    rooms.push([b.name, formatDims(b.w, b.d), t.floor || 'wood', b.x, b.y, b.x + b.w, b.y + b.d, opts]);
    slabs.push([b.x - 0.3, b.y - 0.3, b.x + b.w + 0.3, b.y + b.d + 0.3]);
    if (!vaulted) ceilings.push([b.x, b.y, b.x + b.w, b.y + b.d, outside ? 8.8 : wallH]);
  }

  // Emit each room's four edges, punching openings and decorating exteriors.
  const emittedOpen = new Set();
  const openKey = (h) => [h.a.id, h.b.id].sort().join('|') + (h.horiz ? `@y${h.y}` : `@x${h.x}`);

  for (const b of blocks) {
    const t = TYPE_BY_ID[b.type] || {};
    if (t.feature) continue;
    const outside = !!t.outside;
    const sides = edgeOpenings(b, adj);
    const edges = {
      n: { horiz: true, c: b.y, a: b.x, b: b.x + b.w },
      s: { horiz: true, c: b.y + b.d, a: b.x, b: b.x + b.w },
      w: { horiz: false, c: b.x, a: b.y, b: b.y + b.d },
      e: { horiz: false, c: b.x + b.w, a: b.y, b: b.y + b.d },
    };

    // Porches: only emit the shared (house) edge; the outer edges stay open with posts.
    if (outside) {
      for (const side of ['n', 's', 'e', 'w']) {
        for (const op of sides[side]) {
          const key = openKey(op.hit);
          if (emittedOpen.has(key)) continue;
          emittedOpen.add(key);
          const e = edges[side];
          const doors = [[op.s, op.e, 8]];
          if (spanRemoved(b, side, op.s, op.e)) continue;
          if (e.horiz) walls.seg(op.s, e.c, op.e, e.c, { ext: true, h: wallH, doors });
          else walls.seg(e.c, op.s, e.c, op.e, { ext: true, h: wallH, doors });
        }
      }
      // Posts at outer corners
      const post = (x, y) => furnish.push(['block', x - 0.28, y - 0.28, x + 0.28, y + 0.28, 0, 8.2, '#d8c8a8', { solid: true }]);
      post(b.x + 0.4, b.y + 0.4);
      post(b.x + b.w - 0.4, b.y + 0.4);
      post(b.x + 0.4, b.y + b.d - 0.4);
      post(b.x + b.w - 0.4, b.y + b.d - 0.4);
      if (b.w > 16) { post(b.x + b.w / 2, b.y + 0.4); post(b.x + b.w / 2, b.y + b.d - 0.4); }
      continue;
    }

    const front = preferredFront(b, sides);
    const isGarage = /garage/i.test(b.name);
    const isEntry = /entry|foyer/i.test(b.name);
    const garageBays = isGarage ? (b.w >= 28 || b.d >= 28 ? 3 : (Math.max(b.w, b.d) >= 18 ? 2 : 1)) : 0;

    for (const side of ['n', 's', 'e', 'w']) {
      const e = edges[side];
      const ops = [...sides[side]].sort((p, q) => p.s - q.s);
      // Special exterior door / garage door on the preferred front if that side has no openings
      const extras = [];
      if (!ops.length && side === front && isGarage) {
        extras.push(...garageDoorSpans(e.a + 0.4, e.b - 0.4, garageBays).map((d) => ({ s: d[0], e: d[1], kind: 'door', top: 8, ext: true })));
      } else if (!ops.length && side === front && isEntry) {
        const mid = (e.a + e.b) / 2;
        extras.push({ s: mid - 1.75, e: mid + 1.75, kind: 'door', top: 8, ext: true });
      }

      const cuts = [...ops.map((o) => ({ ...o, ext: !!o.ext })), ...extras].sort((p, q) => p.s - q.s);
      let cur = e.a;
      const emitSolid = (s, ee, ext) => {
        if (ee - s < 0.2) return;
        const leftovers = subtractRemoved(b, side, s, ee);
        for (const [ss, ee2] of leftovers) {
          if (ee2 - ss < 0.2) continue;
          const windows = (!ext || isGarage) ? [] : addWindows(ee2 - ss, ss, ee2);
          if (e.horiz) walls.seg(ss, e.c, ee2, e.c, { ext, h: wallH, windows });
          else walls.seg(e.c, ss, e.c, ee2, { ext, h: wallH, windows });
        }
      };
      for (const cut of cuts) {
        // Solid leftover before this opening is exterior unless it sits inside a shared interval
        const share = ops.find((o) => cut.s >= o.hit.x0 - 0.2 && cut.e <= (o.hit.x1 || o.hit.y1) + 0.2);
        // leftover between cur and cut.s: exterior if not covered by any adjacency overlap
        emitSolid(cur, cut.s, !isCovered(b, side, cur, cut.s, adj));
        const key = cut.hit ? openKey(cut.hit) : null;
        if (!key || !emittedOpen.has(key)) {
          if (key) emittedOpen.add(key);
          const ext = cut.ext || /porch/i.test((cut.hit && (cut.hit.a.name + cut.hit.b.name)) || '');
          const doors = [[cut.s, cut.e, cut.top || 7, null, ext ? 1 : 0]];
          if (e.horiz) walls.seg(cut.s, e.c, cut.e, e.c, { ext, h: wallH, doors: [[cut.s, cut.e, cut.top || (cut.kind === 'cased' || cut.kind === 'french' ? 8 : 7)]] });
          else walls.seg(e.c, cut.s, e.c, cut.e, { ext, h: wallH, doors: [[cut.s, cut.e, cut.top || (cut.kind === 'cased' || cut.kind === 'french' ? 8 : 7)]] });
        }
        cur = cut.e;
      }
      emitSolid(cur, e.b, !isCovered(b, side, cur, e.b, adj));
    }

    // Simple kitchen counters along walls without openings (not in halls).
    if (/^kitchen$/i.test(b.name) || b.type === 'kitchen') {
      addKitchenCounters(b, sides, furnish);
    }
  }

  const roofs = buildRoofs(blocks, wallH);
  const lotBlocks = blocks;
  const xs = lotBlocks.flatMap((b) => [b.x, b.x + b.w]);
  const ys = lotBlocks.flatMap((b) => [b.y, b.y + b.d]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), x1 = Math.max(...xs), y1 = Math.max(...ys);
  const entry = lotBlocks.find((b) => /entry|foyer/i.test(b.name)) || lotBlocks.find((b) => /living/i.test(b.name)) || lotBlocks[0];

  return {
    id: 'builder-draft',
    name: meta.name || 'Builder home',
    title: meta.name || 'Builder home',
    subtitle: meta.subtitle || 'Designed in the PeakStead Builder.',
    wallH,
    defaultStyle: 'default',
    walkStart: entry ? [entry.x + entry.w / 2, entry.y + entry.d * 0.7, 0] : [(x0 + x1) / 2, (y0 + y1) / 2, 0],
    materials: { ext: '#f5f4f0', int: '#f8f6f1', roofTex: 'metal', roofUnder: '#d8c7a8', gable: 'ext', extSkin: true },
    walls,
    rooms,
    slabs,
    ceilings,
    roofs,
    furnish,
    placedItems,
    _format: 'Home View model v1',
  };
}

function spanRemoved(block, side, s, e) {
  const cuts = block.removedWalls || [];
  return cuts.some((r) => r.side === side && Math.min(e, r.e) - Math.max(s, r.s) > 0.4);
}

function subtractRemoved(block, side, s, e) {
  const cuts = (block.removedWalls || []).filter((r) => r.side === side).sort((a, b) => a.s - b.s);
  if (!cuts.length) return [[s, e]];
  const out = [];
  let cur = s;
  for (const c of cuts) {
    const a = Math.max(s, c.s), b = Math.min(e, c.e);
    if (b - a < 0.2) continue;
    if (a > cur + 0.2) out.push([cur, a]);
    cur = Math.max(cur, b);
  }
  if (e - cur > 0.2) out.push([cur, e]);
  return out;
}

function isCovered(block, side, s, e, adj) {

  if (e - s < 0.2) return false;
  const mid = (s + e) / 2;
  for (const h of adj) {
    const mine = h.a.id === block.id ? h.sideA : h.b.id === block.id ? h.sideB : null;
    if (mine !== side) continue;
    if (h.horiz) { if (mid > h.x0 + 0.05 && mid < h.x1 - 0.05) return true; }
    else { if (mid > h.y0 + 0.05 && mid < h.y1 - 0.05) return true; }
  }
  return false;
}

function addKitchenCounters(b, sides, furnish) {
  const C = '#efe7da';
  const depth = 2.0;
  const inset = 0.12;
  const run = (x0, y0, x1, y1) => {
    if (Math.abs(x1 - x0) < 2.2 && Math.abs(y1 - y0) < 2.2) return;
    furnish.push(['block', x0, y0, x1, y1, 0, 3.0, C]);
  };
  // Prefer a north run and a west run if those sides have no full-length opening
  if (!sides.n.length) run(b.x + inset, b.y + inset, b.x + b.w - inset, b.y + inset + depth);
  if (!sides.w.length) run(b.x + inset, b.y + inset, b.x + inset + depth, b.y + b.d - inset);
  else if (!sides.e.length) run(b.x + b.w - inset - depth, b.y + inset, b.x + b.w - inset, b.y + b.d - inset);
}

function buildRoofs(blocks, wallH) {
  const roofs = [];
  const porches = blocks.filter((b) => /porch/i.test(b.name));
  const garages = blocks.filter((b) => /garage/i.test(b.name));
  const main = blocks.filter((b) => !/porch|garage|patio|deck|pool|solar/i.test(b.name) && !(TYPE_BY_ID[b.type] || {}).feature);
  const bbox = (list) => {
    if (!list.length) return null;
    return {
      x0: Math.min(...list.map((b) => b.x)),
      y0: Math.min(...list.map((b) => b.y)),
      x1: Math.max(...list.map((b) => b.x + b.w)),
      y1: Math.max(...list.map((b) => b.y + b.d)),
    };
  };
  const addGable = (bb, eave = wallH, along) => {
    if (!bb || bb.x1 - bb.x0 < 2 || bb.y1 - bb.y0 < 2) return;
    const auto = (bb.x1 - bb.x0) >= (bb.y1 - bb.y0) ? 'x' : 'y';
    roofs.push({ x0: bb.x0, y0: bb.y0, x1: bb.x1, y1: bb.y1, along: along || auto, pitch: 0.45, oh: 1, eave, ends: ['ext', 'ext'] });
  };
  if (main.length) addGable(bbox(main), wallH);
  for (const g of garages) addGable(blockRect(g), wallH, g.w >= g.d ? 'x' : 'y');
  for (const p of porches) {
    // High edge toward the attached house, if we can guess it
    const adj = findAdjacencies([p, ...main, ...garages]).filter((h) => h.a.id === p.id || h.b.id === p.id);
    let hiNorth = true;
    const houseHit = adj[0];
    if (houseHit) {
      const mySide = houseHit.a.id === p.id ? houseHit.sideA : houseHit.sideB;
      if (mySide === 'n') hiNorth = true;      // house is north of porch? wait: side on porch that touches house
      if (mySide === 's') hiNorth = false;
      if (mySide === 'n') { // porch's north edge touches house — house is north, high at y0
        roofs.push({ shed: true, x0: p.x, y0: p.y, x1: p.x + p.w, y1: p.y + p.d, hi: 8.8, lo: 7.5, oh: 0.5 });
        continue;
      }
      if (mySide === 's') {
        roofs.push({ shed: true, x0: p.x, y0: p.y, x1: p.x + p.w, y1: p.y + p.d, hi: 7.5, lo: 8.8, oh: 0.5 });
        continue;
      }
      if (mySide === 'w') {
        roofs.push({ shed: true, along: 'y', x0: p.x, y0: p.y, x1: p.x + p.w, y1: p.y + p.d, hi: 8.8, lo: 7.5, oh: 0.5 });
        continue;
      }
      if (mySide === 'e') {
        roofs.push({ shed: true, along: 'y', x0: p.x, y0: p.y, x1: p.x + p.w, y1: p.y + p.d, hi: 7.5, lo: 8.8, oh: 0.5 });
        continue;
      }
    }
    roofs.push({ shed: true, x0: p.x, y0: p.y, x1: p.x + p.w, y1: p.y + p.d, hi: 8.8, lo: 7.5, oh: 0.5 });
  }
  return roofs;
}

export function planStats(allBlocks) {
  const blocks = allBlocks.filter(onLot);
  let heated = 0, garage = 0, porch = 0;
  for (const b of blocks) {
    const sf = b.w * b.d;
    const typ = TYPE_BY_ID[b.type] || {};
    if (typ.feature) continue;
    if (/garage/i.test(b.name)) garage += sf;
    else if (/porch|patio|deck/i.test(b.name) || typ.outside) porch += sf;
    else heated += sf;
  }
  const xs = blocks.flatMap((b) => [b.x, b.x + b.w]);
  const ys = blocks.flatMap((b) => [b.y, b.y + b.d]);
  const fw = blocks.length ? Math.max(...xs) - Math.min(...xs) : 0;
  const fd = blocks.length ? Math.max(...ys) - Math.min(...ys) : 0;
  return {
    heated: Math.round(heated),
    garage: Math.round(garage),
    porch: Math.round(porch),
    footprint: Math.round(fw * fd),
    width: Math.round(fw * 10) / 10,
    depth: Math.round(fd * 10) / 10,
    rooms: blocks.length,
  };
}

export function serializeModel(model) {
  const walls = model.walls || {};
  const out = { ...model, walls: {} };
  for (const k of ['ext', 'int', 'win', 'door', 'counter']) out.walls[k] = Array.isArray(walls[k]) ? walls[k] : [];
  delete out.walls.seg;
  return out;
}

export function blockEdges(b) {
  return {
    n: { side: 'n', horiz: true, c: b.y, a: b.x, b: b.x + b.w },
    s: { side: 's', horiz: true, c: b.y + b.d, a: b.x, b: b.x + b.w },
    w: { side: 'w', horiz: false, c: b.x, a: b.y, b: b.y + b.d },
    e: { side: 'e', horiz: false, c: b.x + b.w, a: b.y, b: b.y + b.d },
  };
}

export function addRemovedWall(block, side, s, e) {
  const next = { ...(block || {}) };
  const list = Array.isArray(block.removedWalls) ? block.removedWalls.map((x) => ({ ...x })) : [];
  list.push({ side, s: Math.min(s, e), e: Math.max(s, e) });
  next.removedWalls = list;
  return next;
}
