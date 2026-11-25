/**
 * Furniture placement solver and validator.
 *
 * Runs after auto-furnish, model place(), and dressRooms so every home,
 * style, and saved layout is cleaned the same way. Floor-standing items
 * are never left in halls, foyers, galleries, geometric circulation, or
 * within ~3 ft of a hallway mouth. Overlaps, firebox/hearth, door swings,
 * stair zones, unbacked tall pieces, and blocked walk paths are resolved
 * by dropping the offending item when it cannot sit validly.
 *
 * Also enforces: clear door approaches inside and on porches; exactly one
 * washer and one dryer per laundry (a single side-by-side pair); no duplicate
 * appliances; bath fixtures backed to walls with the door zone clear; every
 * bed's headboard flush to a solid wall with nightstands at the head; and at
 * most one sofa per porch or outdoor space.
 */
import {
  CATALOG, itemRect, itemFootprint, overlap, intersect, area,
  isCirculationName, isPorchLike, isWallHungType, clearanceHit,
  circulationRects, hallwayMouthZones, isCirculationRoom, roomOpenings,
  makeItem,
} from './furniture.js';

export const HALL_MOUTH_FT = 3;
export const DOOR_CLEAR_FT = 3;
export const WALK_PATH_FT = 3;

const LOCKED = new Set([
  'counter', 'island', 'range', 'fridge', 'sink', 'washerDryer',
  'vanity', 'tub', 'toilet', 'shower',
]);

const SURFACE = new Set([
  'tableLamp', 'deskLamp', 'monitor', 'sink', 'counterItems',
]);

const TALL_BACK = new Set([
  'dresser', 'cabinet', 'bookshelf', 'mediaConsole', 'mudBench', 'bed',
]);

const SEATING = new Set(['sofa', 'sectional', 'morroBay', 'outdoorSofa']);
const BATH_FIXTURE = new Set(['vanity', 'tub', 'toilet', 'shower']);
const APPLIANCE = new Set(['fridge', 'range']);
const OUTDOOR_CHAIR = new Set(['outdoorLounge', 'accentChair', 'diningChair']);

/** Types that do not occupy floor circulation (walkable or hanging). */
export function isNonBlockingType(type) {
  return type === 'rug' || type === 'pendant' || type === 'curtains' || isWallHungType(type);
}

export function isFloorStanding(it) {
  if (!it || isNonBlockingType(it.type)) return false;
  if ((it.z || 0) > 7.5) return false;
  if (SURFACE.has(it.type)) return false;
  return true;
}

function catOf(it) {
  return CATALOG[it?.type] || null;
}

export function isLockedItem(it) {
  if (!it) return false;
  const c = catOf(it);
  if (c?.category === 'fireplace') return true;
  if (c?.stair) return true;
  if (c?.category === 'garage' || c?.category === 'yard' || c?.category === 'outbuilding') return true;
  if (LOCKED.has(it.type)) return true;
  return false;
}

function roomAt(rooms, x, y) {
  return (rooms || []).find((r) => x > r[3] && x < r[5] && y > r[4] && y < r[6]) || null;
}

function padRect(r, p) {
  return [r[0] - p, r[1] - p, r[2] + p, r[3] + p];
}

/** Front direction in plan coords: rot 0 faces +y (south). */
function frontDir(rot) {
  const a = (((rot || 0) % 360) + 360) % 360 * Math.PI / 180;
  return { x: -Math.sin(a), y: Math.cos(a) };
}

function expandFront(rect, fx, fy, dist) {
  if (Math.abs(fx) >= Math.abs(fy)) {
    return fx < 0 ? [rect[0] - dist, rect[1], rect[2], rect[3]] : [rect[0], rect[1], rect[2] + dist, rect[3]];
  }
  return fy < 0 ? [rect[0], rect[1] - dist, rect[2], rect[3]] : [rect[0], rect[1], rect[2], rect[3] + dist];
}

export function fireplaceZones(items) {
  const out = [];
  for (const it of items || []) {
    if (catOf(it)?.category !== 'fireplace') continue;
    const rect = itemRect(it);
    const f = frontDir(it.rot);
    out.push({ kind: 'firebox', item: it, rect: padRect(rect, 0.05) });
    out.push({ kind: 'hearth', item: it, rect: expandFront(rect, f.x, f.y, 2.0) });
  }
  return out;
}

export function stairZones(items) {
  const out = [];
  for (const it of items || []) {
    if (!catOf(it)?.stair) continue;
    out.push({ kind: 'stair', item: it, rect: padRect(itemRect(it), 0.25) });
  }
  return out;
}

function intersectsZone(rect, zone, minArea = 0.2) {
  const iv = intersect(rect, zone.rect || zone);
  return iv && area(iv) > minArea;
}

/** Allowed item-item overlaps (intentional groupings). */
export function allowedOverlap(a, b) {
  if (!a || !b) return true;
  const pair = new Set([a.type, b.type]);
  if (pair.has('rug') || pair.has('pendant') || pair.has('curtains') || isWallHungType(a.type) || isWallHungType(b.type)) return true;
  const host = (surface, hosts) =>
    (a.type === surface && hosts.has(b.type)) || (b.type === surface && hosts.has(a.type));
  if (host('tableLamp', new Set(['sideTable', 'nightstand', 'desk', 'dresser', 'cabinet', 'coffeeTable', 'bench', 'mediaConsole']))) return true;
  if (host('deskLamp', new Set(['desk', 'nightstand', 'sideTable']))) return true;
  if (host('monitor', new Set(['desk']))) return true;
  if (host('sink', new Set(['counter', 'island', 'range']))) return true;
  if (host('counterItems', new Set(['counter', 'island', 'range']))) return true;
  if (host('diningChair', new Set(['diningTable']))) return true;
  if (host('barstool', new Set(['island', 'counter']))) return true;
  if (host('deskChair', new Set(['desk']))) return true;
  if (host('nightstand', new Set(['bed']))) return true;
  if (host('bench', new Set(['bed']))) return true;
  if (host('barbell', new Set(['powerRack', 'weightBench']))) return true;
  if (host('washerDryer', new Set(['counter']))) return true;
  if (host('fridge', new Set(['counter']))) return true;
  if (host('range', new Set(['counter']))) return true;
  if (host('accentChair', new Set(['sideTable'])) && area(intersect(itemRect(a), itemRect(b)) || [0, 0, 0, 0]) < 0.2) return true;
  // two locked kitchen fixtures may graze (fridge/counter, etc.)
  if (isLockedItem(a) && isLockedItem(b)) return true;
  return false;
}

function dropScore(it) {
  if (isLockedItem(it)) return 1000;
  if (it.type === 'morroBay' || it.type === 'sofa' || it.type === 'sectional' || it.type === 'bed') return 800;
  if (it.type === 'diningTable' || it.type === 'desk') return 600;
  if (it.type === 'dresser' || it.type === 'cabinet' || it.type === 'bookshelf' || it.type === 'mediaConsole') return 500;
  if (it.type === 'mudBench') return 450;
  if (SEATING.has(it.type)) return 800;
  if (it.type === 'coffeeTable' || it.type === 'nightstand') return 200;
  if (it.type === 'accentChair' || it.type === 'deskChair' || it.type === 'diningChair' || it.type === 'barstool') return 180;
  if (it.type === 'sideTable' || it.type === 'bench') return 120;
  if (it.type === 'plant') return 40;
  if (it.dress) return 30;
  return 100;
}

function walkPathClear(room, items, rooms, WS) {
  if (!room || room[7]?.outside) return true;
  const n = String(room[0] || '');
  if (isPorchLike(room) || isCirculationRoom(room, rooms)) return true;
  if (/bath|powder|shwr|shower|\bwc\b|w\.c|toilet|closet|wic|pantry|laundry|utility|garage|\bbay\b|shop|mech|storage|attic|sauna|linen/i.test(n)) return true;
  const openings = roomOpenings(room, rooms, WS);
  if (openings.length < 2) return true;
  const x0 = room[3], y0 = room[4], x1 = room[5], y1 = room[6];
  const cell = 0.25;
  const nx = Math.max(1, Math.ceil((x1 - x0) / cell));
  const ny = Math.max(1, Math.ceil((y1 - y0) / cell));
  if (nx * ny > 20000) return true; // huge rooms / outdoor — skip
  const rad = WALK_PATH_FT / 2 - cell * 0.5 - 0.02;
  const blocked = new Uint8Array(nx * ny);
  const ix = (x) => Math.max(0, Math.min(nx - 1, Math.floor((x - x0) / cell)));
  const iy = (y) => Math.max(0, Math.min(ny - 1, Math.floor((y - y0) / cell)));
  for (const it of items) {
    if (!isFloorStanding(it) && !isLockedItem(it)) continue;
    if (isNonBlockingType(it.type)) continue;
    if (catOf(it)?.stair) continue; // stairs live in their own room
    const r = itemRect(it);
    if (!overlap(r, [x0, y0, x1, y1])) continue;
    const a = ix(r[0] - rad), b = iy(r[1] - rad), c = ix(r[2] + rad - 0.01), d = iy(r[3] + rad - 0.01);
    for (let j = b; j <= d; j++) for (let i = a; i <= c; i++) blocked[j * nx + i] = 1;
  }
  const key = (i, j) => j * nx + i;
  const flood = (seedPts) => {
    const seen = new Uint8Array(nx * ny);
    const q = [];
    for (const p of seedPts || []) {
      const si = ix(p[0]), sj = iy(p[1]);
      const k = key(si, sj);
      if (seen[k]) continue;
      seen[k] = 1;
      q.push([si, sj]);
    }
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let nq = 0; nq < q.length; nq++) {
      const [i, j] = q[nq];
      for (const [di, dj] of dirs) {
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= nx || nj >= ny) continue;
        const k = key(ni, nj);
        if (seen[k] || blocked[k]) continue;
        seen[k] = 1;
        q.push([ni, nj]);
      }
    }
    return { seen, n: q.length };
  };
  for (const [si, sj] of openings.flatMap((op) => (op.pts || []).map((p) => [ix(p[0]), iy(p[1])]))) {
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ni = si + di, nj = sj + dj;
      if (ni >= 0 && nj >= 0 && ni < nx && nj < ny) blocked[nj * nx + ni] = 0;
    }
  }
  // Skip openings whose samples sit in an isolated pocket (door tight against a cabinet).
  const usable = [];
  for (const op of openings) {
    const { n, seen } = flood(op.pts);
    if (n >= 20) usable.push(op);
  }
  if (usable.length < 2) return true;
  const { seen } = flood(usable[0].pts);
  const hit = (op) => (op.pts || []).some((p) => seen[iy(p[1]) * nx + ix(p[0])]);
  return usable.every(hit);

}

/** True when the item's BACK edge (opposite the front / foot) sits on a wall. */
export function backAgainstWall(it, WS, maxGap = 0.9, opts = {}) {
  const f = itemFootprint(it);
  const rot = (((it.rot || 0) % 360) + 360) % 360;
  let horiz, mid, a, b;
  if (rot < 45 || rot >= 315) { // front +y, back -y
    horiz = true; mid = f.y - f.d / 2; a = f.x - f.w / 2; b = f.x + f.w / 2;
  } else if (rot >= 45 && rot < 135) { // front -x, back +x
    horiz = false; mid = f.x + f.w / 2; a = f.y - f.d / 2; b = f.y + f.d / 2;
  } else if (rot >= 135 && rot < 225) { // front -y, back +y
    horiz = true; mid = f.y + f.d / 2; a = f.x - f.w / 2; b = f.x + f.w / 2;
  } else {
    horiz = false; mid = f.x - f.w / 2; a = f.y - f.d / 2; b = f.y + f.d / 2;
  }
  const span = Math.max(0.4, b - a);
  const segs = [...(WS?.int || []), ...(WS?.ext || [])];
  if (opts.windows !== false) segs.push(...(WS?.win || []));
  let cov = 0;
  for (const w of segs) {
    const x0 = Math.min(w[0], w[2]), x1 = Math.max(w[0], w[2]);
    const y0 = Math.min(w[1], w[3]), y1 = Math.max(w[1], w[3]);
    const wHoriz = (x1 - x0) >= (y1 - y0);
    if (wHoriz !== horiz) continue;
    const wMid = wHoriz ? (y0 + y1) / 2 : (x0 + x1) / 2;
    if (Math.abs(wMid - mid) > maxGap) continue;
    const lo = wHoriz ? x0 : y0, hi = wHoriz ? x1 : y1;
    cov += Math.max(0, Math.min(b, hi) - Math.max(a, lo));
  }
  return cov >= span * 0.45;
}

function itemAgainstWall(it, WS, maxGap = 0.9) {
  if (backAgainstWall(it, WS, maxGap)) return true;
  const f = itemFootprint(it);
  const walls = [...(WS?.int || []), ...(WS?.ext || [])];
  // also accept any side sitting flush to a wall (wrong-facing but against it)
  const sides = [
    { horiz: true, mid: f.y - f.d / 2, a: f.x - f.w / 2, b: f.x + f.w / 2 },
    { horiz: true, mid: f.y + f.d / 2, a: f.x - f.w / 2, b: f.x + f.w / 2 },
    { horiz: false, mid: f.x - f.w / 2, a: f.y - f.d / 2, b: f.y + f.d / 2 },
    { horiz: false, mid: f.x + f.w / 2, a: f.y - f.d / 2, b: f.y + f.d / 2 },
  ];
  for (const s of sides) {
    for (const w of walls) {
      const x0 = Math.min(w[0], w[2]), x1 = Math.max(w[0], w[2]);
      const y0 = Math.min(w[1], w[3]), y1 = Math.max(w[1], w[3]);
      const wHoriz = (x1 - x0) >= (y1 - y0);
      if (wHoriz !== s.horiz) continue;
      const wMid = wHoriz ? (y0 + y1) / 2 : (x0 + x1) / 2;
      if (Math.abs(wMid - s.mid) > maxGap) continue;
      const lo = wHoriz ? x0 : y0, hi = wHoriz ? x1 : y1;
      const cov = Math.min(s.b, hi) - Math.max(s.a, lo);
      if (cov >= Math.max(0.4, s.b - s.a) * 0.45) return true;
    }
  }
  return false;
}

function hostsNear(it, list, maxDist = 2.2) {
  return (list || []).some((h) => h !== it && Math.hypot((h.x || 0) - it.x, (h.y || 0) - it.y) < maxDist);
}

/**
 * Why this floor-standing item is invalid, or null if it is fine.
 * `ctx.zones` holds fireplace/stair keep-outs. `others` is the current item list.
 */
export function itemViolation(it, rooms, WS, others, ctx) {
  if (!it) return null;
  if (isLockedItem(it) || isNonBlockingType(it.type)) return null;
  if ((it.z || 0) > 7.5) return null;
  if (SURFACE.has(it.type)) return null;
  const room = roomAt(rooms, it.x, it.y);
  const outdoor = !!(room && (isPorchLike(room) || room[7]?.outside));
  if (outdoor && it.type === 'plant') return { kind: 'porch', message: 'plant on porch or outside' };
  if (isFloorStanding(it)) {
    if (!outdoor && room && isCirculationRoom(room, rooms)) {
      return { kind: 'hallway', message: `floor item '${it.type}' in circulation room '${room[0] || '(unnamed)'}'` };
    }
    const rect = itemRect(it);
    const hit = clearanceHit(rect, rooms, WS, 0.05, outdoor ? { ignoreHall: true } : {});
    if (!outdoor && hit?.kind === 'hallway') return { kind: 'hallway', message: `floor item '${it.type}' in a hallway, foyer, or hallway mouth` };
    if (hit?.kind === 'doorway') return { kind: 'doorway', message: `floor item '${it.type}' in a door clearance` };
    if (outdoor) return null;
    for (const z of (ctx?.fireplace || [])) {
      if (z.item === it) continue;
      if (intersectsZone(rect, z, 0.25)) return { kind: 'fireplace', message: `item '${it.type}' in a fireplace firebox or hearth` };
    }
    for (const z of (ctx?.stairs || [])) {
      if (z.item === it) continue;
      if (intersectsZone(rect, z, 0.3)) return { kind: 'stair', message: `item '${it.type}' in a stair zone` };
    }
    if (it.type === 'bed' && !backAgainstWall(it, WS)) {
      return { kind: 'bed', message: "bed headboard is not flush against a wall" };
    }
    if (TALL_BACK.has(it.type) && it.type !== 'bed' && !itemAgainstWall(it, WS)) {
      return { kind: 'unbacked', message: `tall item '${it.type}' is not backed against a wall` };
    }
  }
  return null;
}

function overlapViolation(a, b) {
  if (a === b || allowedOverlap(a, b)) return null;
  if ((a.z || 0) > 7.5 || (b.z || 0) > 7.5) return null;
  const iv = intersect(itemRect(a), itemRect(b));
  if (!iv || area(iv) < 0.28) return null;
  return { kind: 'overlap', message: `'${a.type}' overlaps '${b.type}'`, area: +area(iv).toFixed(2), a, b };
}

function dedupeCoffeeTables(list) {
  const byRoom = new Map();
  const roomKey = (it, rooms) => {
    const r = roomAt(rooms, it.x, it.y);
    return r ? `${r[0]}|${r[3]}|${r[4]}` : `xy:${it.x | 0}:${it.y | 0}`;
  };
  return { roomKey, byRoom };
}


function washerMachineCount(it) {
  if (!it || it.type !== 'washerDryer') return 0;
  return (it.w || catOf(it)?.w || 2.25) >= 3.6 ? 2 : 1;
}

function isSkippedFixtureCat(it) {
  const c = catOf(it);
  return !!(c && (c.category === 'garage' || c.category === 'yard' || c.category === 'outbuilding' || c.category === 'fireplace' || c.stair));
}

function wetEntryBlocked(it, rooms, WS) {
  const room = roomAt(rooms, it.x, it.y);
  if (!room) return false;
  const n = String(room[0] || '');
  if (!/bath|powder|wc|toilet|shwr|shower|laundry|utility/i.test(n)) {
    // still keep laundry/bath fixtures out of a generic 3 ft door box when they
    // sit in a non-wet room (should not happen).
    const hit = clearanceHit(itemRect(it), rooms, WS, 0.05, { ignoreHall: true });
    return hit?.kind === 'doorway';
  }
  const rect = itemRect(it);
  const rw = room[5] - room[3], rd = room[6] - room[4];
  const depth = Math.min(2.0, Math.max(1.35, 0.4 * Math.min(rw, rd)));
  for (const d of (WS?.door || [])) {
    const dr = [d[0], d[1], d[2], d[3]];
    const infl = [room[3] - 0.5, room[4] - 0.5, room[5] + 0.5, room[6] + 0.5];
    if (!overlap(dr, infl)) continue;
    const vert = (dr[2] - dr[0]) < (dr[3] - dr[1]);
    const cx = (dr[0] + dr[2]) / 2, cy = (dr[1] + dr[3]) / 2;
    // Landing only on the side that is inside this room.
    let landing;
    if (vert) {
      const inward = cx < (room[3] + room[5]) / 2 ? 1 : -1; // door on west -> +x into room
      const x0 = inward > 0 ? cx : cx - depth;
      const x1 = inward > 0 ? cx + depth : cx;
      landing = [x0, dr[1] - 0.1, x1, dr[3] + 0.1];
    } else {
      const inward = cy < (room[4] + room[6]) / 2 ? 1 : -1;
      const y0 = inward > 0 ? cy : cy - depth;
      const y1 = inward > 0 ? cy + depth : cy;
      landing = [dr[0] - 0.1, y0, dr[2] + 0.1, y1];
    }
    const iv = intersect(rect, landing);
    if (!iv || area(iv) <= 0.45) continue;
    // Fixtures on the wall opposite the door are the far side of a small room, not in the doorway.
    if (backAgainstWall(it, WS, 1.1)) {
      const f = itemFootprint(it);
      const backMid = (((it.rot || 0) % 360 + 360) % 360);
      const backIsDoorWall = vert
        ? (backMid >= 45 && backMid < 135 ? Math.abs((f.x + f.w / 2) - cx) < 1.2 : (backMid >= 225 && backMid < 315 ? Math.abs((f.x - f.w / 2) - cx) < 1.2 : false))
        : (backMid < 45 || backMid >= 315 ? Math.abs((f.y - f.d / 2) - cy) < 1.2 : (backMid >= 135 && backMid < 225 ? Math.abs((f.y + f.d / 2) - cy) < 1.2 : false));
      if (!backIsDoorWall) continue;
    }
    return true;
  }
  return false;
}

/** Door-zone / unbacked checks that also apply to locked bath and laundry fixtures. */
export function fixtureViolation(it, rooms, WS) {
  if (!it || isSkippedFixtureCat(it)) return null;
  if (!BATH_FIXTURE.has(it.type) && it.type !== 'washerDryer') return null;
  if (wetEntryBlocked(it, rooms, WS)) {
    return { kind: 'doorway', message: `${it.type} is in a door swing or entry zone` };
  }
  if (BATH_FIXTURE.has(it.type) && !backAgainstWall(it, WS, 1.1)) {
    return { kind: 'unbacked', message: `bath fixture '${it.type}' is not backed against a wall` };
  }
  return null;
}

function againstWallPose(room, edge, w, d, inset = 0.35) {
  const [x0, y0, x1, y1] = [room[3], room[4], room[5], room[6]];
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (edge === 'n') return { x: cx, y: y0 + inset + d / 2, rot: 0 };
  if (edge === 's') return { x: cx, y: y1 - inset - d / 2, rot: 180 };
  if (edge === 'w') return { x: x0 + inset + d / 2, y: cy, rot: 270 };
  return { x: x1 - inset - d / 2, y: cy, rot: 90 };
}

function openingPenaltyOnEdge(room, WS, edge, along0, along1) {
  let pen = 0;
  const [x0, y0, x1, y1] = [room[3], room[4], room[5], room[6]];
  const edgeMid = edge === 'n' ? y0 : edge === 's' ? y1 : edge === 'w' ? x0 : x1;
  const horiz = edge === 'n' || edge === 's';
  const hits = (r) => {
    const rx0 = Math.min(r[0], r[2]), rx1 = Math.max(r[0], r[2]);
    const ry0 = Math.min(r[1], r[3]), ry1 = Math.max(r[1], r[3]);
    const rHoriz = (rx1 - rx0) >= (ry1 - ry0);
    if (rHoriz !== horiz) return false;
    const mid = horiz ? (ry0 + ry1) / 2 : (rx0 + rx1) / 2;
    if (Math.abs(mid - edgeMid) > 0.8) return false;
    const lo = horiz ? rx0 : ry0, hi = horiz ? rx1 : ry1;
    return Math.min(along1, hi) - Math.max(along0, lo) > 0.3;
  };
  for (const d of (WS?.door || [])) if (hits(d)) pen += 40;
  for (const w of (WS?.win || [])) if (hits(w)) pen += 15;
  return pen;
}

function poseFitsRoom(it, room) {
  const r = itemRect(it);
  return r[0] >= room[3] + 0.05 && r[1] >= room[4] + 0.05 && r[2] <= room[5] - 0.05 && r[3] <= room[6] - 0.05;
}

function nightstandPoses(bed) {
  const f = itemFootprint(bed);
  const rot = (((bed.rot || 0) % 360) + 360) % 360;
  const nsW = 1.85, nsD = 1.4, gap = 0.12;
  const dummy = { w: nsW, d: nsD, rot, x: 0, y: 0 };
  const nf = itemFootprint(dummy);
  const poses = [];
  if (rot < 45 || rot >= 315) {
    const y = f.y - f.d / 2 + nf.d / 2;
    poses.push({ x: f.x - f.w / 2 - gap - nf.w / 2, y, rot });
    poses.push({ x: f.x + f.w / 2 + gap + nf.w / 2, y, rot });
  } else if (rot >= 45 && rot < 135) {
    const x = f.x + f.w / 2 - nf.w / 2;
    poses.push({ x, y: f.y - f.d / 2 - gap - nf.d / 2, rot });
    poses.push({ x, y: f.y + f.d / 2 + gap + nf.d / 2, rot });
  } else if (rot >= 135 && rot < 225) {
    const y = f.y + f.d / 2 - nf.d / 2;
    poses.push({ x: f.x - f.w / 2 - gap - nf.w / 2, y, rot });
    poses.push({ x: f.x + f.w / 2 + gap + nf.w / 2, y, rot });
  } else {
    const x = f.x - f.w / 2 + nf.w / 2;
    poses.push({ x, y: f.y - f.d / 2 - gap - nf.d / 2, rot });
    poses.push({ x, y: f.y + f.d / 2 + gap + nf.d / 2, rot });
  }
  return poses;
}

function relocateNightstands(bed, list, rooms, WS, drop) {
  const room = roomAt(rooms, bed.x, bed.y);
  if (!room) return;
  const stands = list.filter((it) => it.type === 'nightstand' && roomAt(rooms, it.x, it.y) === room);
  const poses = nightstandPoses(bed).filter((p) => {
    const rec = { type: 'nightstand', x: p.x, y: p.y, rot: p.rot, w: 1.85, d: 1.4 };
    if (!poseFitsRoom(rec, room)) return false;
    const hit = clearanceHit(itemRect(rec), rooms, WS, 0.05);
    return !hit || hit.kind !== 'doorway';
  });
  const used = new Set();
  for (const st of stands) {
    let best = -1, bestD = 99;
    for (let i = 0; i < poses.length; i++) {
      if (used.has(i)) continue;
      const d = Math.hypot(st.x - poses[i].x, st.y - poses[i].y);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best < 0) continue;
    used.add(best);
    st.x = poses[best].x;
    st.y = poses[best].y;
    st.rot = poses[best].rot;
  }
  // Restore a missing partner when one nightstand already exists and the other slot is free.
  if (stands.length === 1 && poses.length === 2 && used.size === 1) {
    const i = used.has(0) ? 1 : 0;
    const p = poses[i];
    list.push(makeItem('nightstand', { x: p.x, y: p.y, rot: p.rot, finish: stands[0].finish, wood: stands[0].wood }));
  }
}

function snapBeds(list, rooms, WS, drop) {
  for (const bed of list.filter((it) => it.type === 'bed')) {
    const room = roomAt(rooms, bed.x, bed.y);
    if (!room || isPorchLike(room) || room[7]?.outside) continue;
    if (backAgainstWall(bed, WS)) {
      relocateNightstands(bed, list, rooms, WS, drop);
      continue;
    }
    const saved = { x: bed.x, y: bed.y, rot: bed.rot };
    // Flip in place: if the foot was on a wall, the headboard lands on that wall.
    bed.rot = (bed.rot + 180) % 360;
    if (backAgainstWall(bed, WS) && poseFitsRoom(bed, room)) {
      relocateNightstands(bed, list, rooms, WS, drop);
      continue;
    }
    bed.x = saved.x; bed.y = saved.y; bed.rot = saved.rot;
    const w = bed.w || catOf(bed)?.w || 5.3;
    const d = bed.d || catOf(bed)?.d || 6.8;
    const edges = [
      { edge: 'n', rot: 0 },
      { edge: 's', rot: 180 },
      { edge: 'w', rot: 270 },
      { edge: 'e', rot: 90 },
    ];
    let best = null, bestScore = 1e9;
    for (const e of edges) {
      const base = againstWallPose(room, e.edge, w, d, 0.25);
      for (const off of [0, -1, 1, -2, 2, -3, 3, -4, 4]) {
        const p = { ...base, rot: e.rot };
        if (e.edge === 'n' || e.edge === 's') p.x = base.x + off;
        else p.y = base.y + off;
        bed.x = p.x; bed.y = p.y; bed.rot = p.rot;
        if (!poseFitsRoom(bed, room) || !backAgainstWall(bed, WS)) continue;
        const f = itemFootprint(bed);
        const along0 = (e.edge === 'n' || e.edge === 's') ? f.x - f.w / 2 : f.y - f.d / 2;
        const along1 = (e.edge === 'n' || e.edge === 's') ? f.x + f.w / 2 : f.y + f.d / 2;
        let score = openingPenaltyOnEdge(room, WS, e.edge, along0, along1);
        score += Math.hypot(p.x - saved.x, p.y - saved.y) * 0.4;
        const hit = clearanceHit(itemRect(bed), rooms, WS, 0.05);
        if (hit?.kind === 'doorway') score += 80;
        if (hit?.kind === 'hallway') score += 60;
        if (score < bestScore) { bestScore = score; best = { ...p }; }
      }
    }
    if (best) {
      bed.x = best.x; bed.y = best.y; bed.rot = best.rot;
      relocateNightstands(bed, list, rooms, WS, drop);
    } else {
      bed.x = saved.x; bed.y = saved.y; bed.rot = saved.rot;
    }
  }
}

function snapFixtureOutOfDoor(it, rooms, WS) {
  if (!fixtureViolation(it, rooms, WS)) return false;
  const room = roomAt(rooms, it.x, it.y);
  if (!room) return false;
  const saved = { x: it.x, y: it.y, rot: it.rot };
  // Flip in place first (foot-against-wall tubs / vanities).
  it.rot = (it.rot + 180) % 360;
  if (poseFitsRoom(it, room) && !fixtureViolation(it, rooms, WS)) return true;
  it.x = saved.x; it.y = saved.y; it.rot = saved.rot;
  const w = it.w || catOf(it)?.w || 2, d = it.d || catOf(it)?.d || 2;
  // Prefer the current wall, then others.
  const prefer = [];
  const f = itemFootprint({ ...it });
  const cx = (room[3] + room[5]) / 2, cy = (room[4] + room[6]) / 2;
  const dist = { n: Math.abs(f.y - f.d / 2 - room[4]), s: Math.abs(f.y + f.d / 2 - room[6]), w: Math.abs(f.x - f.w / 2 - room[3]), e: Math.abs(f.x + f.w / 2 - room[5]) };
  prefer.push(...['n', 's', 'w', 'e'].sort((a, b) => dist[a] - dist[b]));
  for (const edge of prefer) {
    const base = againstWallPose(room, edge, w, d, 0.3);
    for (const off of [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5]) {
      const p = { ...base };
      if (edge === 'n' || edge === 's') p.x = base.x + off;
      else p.y = base.y + off;
      it.x = p.x; it.y = p.y; it.rot = p.rot;
      if (!poseFitsRoom(it, room)) continue;
      if (!fixtureViolation(it, rooms, WS)) return true;
    }
  }
  it.x = saved.x; it.y = saved.y; it.rot = saved.rot;
  return false;
}

function mergeWashers(list, rooms, WS, drop) {
  const groups = new Map();
  for (const it of list) {
    if (it.type !== 'washerDryer') continue;
    const room = roomAt(rooms, it.x, it.y);
    const key = room || `xy:${it.x | 0}:${it.y | 0}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it);
  }
  for (const [key, group] of groups) {
    const keep = group.slice().sort((a, b) => washerMachineCount(b) - washerMachineCount(a))[0];
    keep.w = 4.5;
    keep.d = keep.d || 2.3;
    const room = Array.isArray(key) ? key : roomAt(rooms, keep.x, keep.y);
    if (room) {
      const saved = { x: keep.x, y: keep.y, rot: keep.rot };
      if (!backAgainstWall(keep, WS) || fixtureViolation(keep, rooms, WS) || !poseFitsRoom(keep, room)) {
        let snapped = false;
        for (const edge of ['n', 's', 'w', 'e']) {
          const base = againstWallPose(room, edge, 4.5, 2.3, 0.35);
          for (const off of [0, -1, 1, -2, 2]) {
            keep.x = (edge === 'n' || edge === 's') ? base.x + off : base.x;
            keep.y = (edge === 'e' || edge === 'w') ? base.y + off : base.y;
            keep.rot = base.rot;
            if (poseFitsRoom(keep, room) && backAgainstWall(keep, WS) && !fixtureViolation(keep, rooms, WS)) {
              snapped = true;
              break;
            }
          }
          if (snapped) break;
        }
        if (!snapped) { keep.x = saved.x; keep.y = saved.y; keep.rot = saved.rot; }
      }
    }
    for (const extra of group) if (extra !== keep) drop(extra, 'duplicate-appliance');
  }
}

function capOutdoorSofas(list, rooms, WS, drop) {
  const groups = new Map();
  for (const it of list) {
    const room = roomAt(rooms, it.x, it.y);
    if (!room || !(isPorchLike(room) || room[7]?.outside)) continue;
    if (!groups.has(room)) groups.set(room, { sofas: [], chairs: [] });
    if (SEATING.has(it.type)) groups.get(room).sofas.push(it);
    else if (OUTDOOR_CHAIR.has(it.type)) groups.get(room).chairs.push(it);
  }
  const doorScore = (it) => (clearanceHit(itemRect(it), rooms, WS, 0.05, { ignoreHall: true })?.kind === 'doorway' ? 1 : 0);
  for (const { sofas, chairs } of groups.values()) {
    if (sofas.length > 1) {
      sofas.sort((a, b) => doorScore(a) - doorScore(b) || dropScore(b) - dropScore(a));
      for (const extra of sofas.slice(1)) drop(extra, 'outdoor-sofa');
    }
    if (chairs.length > 2) {
      chairs.sort((a, b) => doorScore(a) - doorScore(b) || dropScore(b) - dropScore(a));
      for (const extra of chairs.slice(2)) drop(extra, 'outdoor-chair');
    }
  }
}

function dedupeAppliances(list, rooms, drop) {
  const groups = new Map();
  for (const it of list) {
    if (!APPLIANCE.has(it.type)) continue;
    const room = roomAt(rooms, it.x, it.y);
    const key = (room ? `${room[0]}|${room[3]}|${room[4]}` : `xy:${it.x | 0}:${it.y | 0}`) + '|' + it.type;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => dropScore(b) - dropScore(a));
    for (const extra of group.slice(1)) drop(extra, 'duplicate-appliance');
  }
}

/**
 * Validate a finished item list. Does not mutate.
 * Returns { ok, violations, counts }.
 */
export function validateLayout(rooms, WS, items) {
  const list = items || [];
  const ctx = { fireplace: fireplaceZones(list), stairs: stairZones(list) };
  const violations = [];
  for (const it of list) {
    const v = itemViolation(it, rooms, WS, list, ctx);
    if (v) violations.push({ ...v, type: it.type, x: it.x, y: it.y, id: it.id });
  }
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const v = overlapViolation(list[i], list[j]);
      if (v) violations.push({ kind: v.kind, message: v.message, area: v.area, type: list[i].type, other: list[j].type, x: list[i].x, y: list[i].y, x2: list[j].x, y2: list[j].y });
    }
  }
  // duplicate coffee tables in one seating group
  const tables = list.filter((it) => it.type === 'coffeeTable');
  for (let i = 0; i < tables.length; i++) {
    for (let j = i + 1; j < tables.length; j++) {
      const a = tables[i], b = tables[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) < 8) {
        const ra = roomAt(rooms, a.x, a.y), rb = roomAt(rooms, b.x, b.y);
        if (ra && ra === rb) {
          violations.push({ kind: 'duplicate', message: 'two coffee tables in the same seating group', type: 'coffeeTable', x: a.x, y: a.y, x2: b.x, y2: b.y });
        }
      }
    }
  }
  for (const room of rooms || []) {
    if (!walkPathClear(room, list, rooms, WS)) {
      violations.push({ kind: 'walk', message: `no 36-inch walk path through '${room[0] || '(unnamed)'}'`, room: room[0] });
    }
  }
  for (const it of list) {
    const v = fixtureViolation(it, rooms, WS);
    if (v) violations.push({ ...v, type: it.type, x: it.x, y: it.y, id: it.id });
  }
  const applGroups = new Map();
  for (const it of list) {
    if (it.type !== 'washerDryer' && !APPLIANCE.has(it.type)) continue;
    const room = roomAt(rooms, it.x, it.y);
    const key = room || `xy:${it.x | 0}:${it.y | 0}`;
    if (!applGroups.has(key)) applGroups.set(key, []);
    applGroups.get(key).push(it);
  }
  for (const group of applGroups.values()) {
    const washers = group.filter((it) => it.type === 'washerDryer');
    const units = washers.reduce((s, it) => s + washerMachineCount(it), 0);
    if (units > 2 || units === 1) {
      const a = washers[0];
      violations.push({ kind: 'laundry', message: `laundry must have exactly one washer and one dryer (found ${units} machines)`, type: 'washerDryer', x: a?.x, y: a?.y, n: units });
    }
    for (const typ of APPLIANCE) {
      const dup = group.filter((it) => it.type === typ);
      if (dup.length > 1) {
        violations.push({ kind: 'duplicate-appliance', message: `duplicate ${typ} in the same room`, type: typ, x: dup[0].x, y: dup[0].y, n: dup.length });
      }
    }
  }
  for (const room of rooms || []) {
    if (!isPorchLike(room) && !room[7]?.outside) continue;
    const sofas = list.filter((it) => SEATING.has(it.type) && roomAt(rooms, it.x, it.y) === room);
    if (sofas.length > 1) {
      violations.push({ kind: 'outdoor-sofa', message: `more than one sofa on '${room[0] || 'outdoor space'}'`, type: sofas[0].type, x: sofas[0].x, y: sofas[0].y, n: sofas.length, room: room[0] });
    }
  }
  const counts = {};
  for (const v of violations) counts[v.kind] = (counts[v.kind] || 0) + 1;
  return { ok: violations.length === 0, violations, counts };
}

function tryNudge(it, rooms, WS, others, ctx) {
  if (!it || isLockedItem(it)) return false;
  const f = itemFootprint(it);
  const room = roomAt(rooms, it.x, it.y);
  const dirs = [];
  if (room) {
    const cx = (room[3] + room[5]) / 2, cy = (room[4] + room[6]) / 2;
    const len = Math.hypot(cx - it.x, cy - it.y) || 1;
    dirs.push({ dx: (cx - it.x) / len, dy: (cy - it.y) / len });
  }
  dirs.push({ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 });
  const saved = { x: it.x, y: it.y };
  for (const d of dirs) {
    for (const step of [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3]) {
      it.x = saved.x + d.dx * step;
      it.y = saved.y + d.dy * step;
      if (room) {
        const r = itemRect(it);
        if (r[0] < room[3] + 0.2 || r[1] < room[4] + 0.2 || r[2] > room[5] - 0.2 || r[3] > room[6] - 0.2) continue;
      }
      if (!itemViolation(it, rooms, WS, others, ctx)) return true;
    }
  }
  it.x = saved.x;
  it.y = saved.y;
  return false;
}

function sameHost(dropped, it) {
  if (!SURFACE.has(it.type) && it.type !== 'tableLamp' && it.type !== 'deskLamp' && it.type !== 'monitor' && it.type !== 'counterItems') return false;
  return dropped.some((d) => Math.hypot((d.x || 0) - it.x, (d.y || 0) - it.y) < 1.8);
}

/**
 * Fix a layout: drop invalid / duplicate items rather than force a pose.
 * Returns { items, dropped, report }.
 */
export function solveLayout(rooms, WS, items) {
  const dropped = [];
  let list = (items || []).slice();
  const ctxFor = (arr) => ({ fireplace: fireplaceZones(arr), stairs: stairZones(arr) });

  const drop = (it, reason) => {
    if (!it) return;
    const idx = list.indexOf(it);
    if (idx >= 0) list.splice(idx, 1);
    dropped.push({ type: it.type, x: it.x, y: it.y, id: it.id, reason });
  };

  // 0. structural placement: beds, appliances, outdoor sofas, bath door zones
  snapBeds(list, rooms, WS, drop);
  mergeWashers(list, rooms, WS, drop);
  dedupeAppliances(list, rooms, drop);
  capOutdoorSofas(list, rooms, WS, drop);
  for (const it of list.slice()) {
    if (BATH_FIXTURE.has(it.type) || it.type === 'washerDryer') snapFixtureOutOfDoor(it, rooms, WS);
  }

  // 1. circulation / doorway / fireplace / stair / unbacked.
  // High-value pieces (sofas, beds, tables) get a short nudge first; otherwise drop.
  let ctx = ctxFor(list);
  for (const it of list.slice()) {
    if (isLockedItem(it)) continue;
    const v = itemViolation(it, rooms, WS, list, ctx);
    if (!v) continue;
    if ((v.kind === 'hallway' || v.kind === 'doorway') && dropScore(it) >= 600 && tryNudge(it, rooms, WS, list, ctx)) continue;
    drop(it, v.kind);
  }

  // 2. one coffee table per seating group (keep the one closest to a sofa)
  const tables = list.filter((it) => it.type === 'coffeeTable');
  const used = new Set();
  for (const a of tables) {
    if (used.has(a)) continue;
    const group = tables.filter((b) => !used.has(b) && Math.hypot(a.x - b.x, a.y - b.y) < 8 && roomAt(rooms, a.x, a.y) === roomAt(rooms, b.x, b.y));
    if (group.length < 2) continue;
    const sofas = list.filter((it) => SEATING.has(it.type) && roomAt(rooms, it.x, it.y) === roomAt(rooms, a.x, a.y));
    group.sort((p, q) => {
      const ds = (t) => sofas.reduce((m, s) => Math.min(m, Math.hypot(t.x - s.x, t.y - s.y)), 99);
      return ds(p) - ds(q);
    });
    used.add(group[0]);
    for (const extra of group.slice(1)) {
      used.add(extra);
      drop(extra, 'duplicate');
    }
  }

  // 3. overlaps — drop the lower-priority item
  let changed = true, guard = 0;
  while (changed && guard++ < 40) {
    changed = false;
    let worst = null;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const v = overlapViolation(list[i], list[j]);
        if (!v) continue;
        const a = list[i], b = list[j];
        const dropIt = dropScore(a) <= dropScore(b) ? a : b;
        const keepIt = dropIt === a ? b : a;
        if (isLockedItem(dropIt) && isLockedItem(keepIt)) continue;
        if (isLockedItem(dropIt)) {
          if (!isLockedItem(keepIt)) worst = { it: keepIt, kind: 'overlap' };
          continue;
        }
        if (!worst || dropScore(dropIt) < dropScore(worst.it)) worst = { it: dropIt, kind: 'overlap' };
      }
    }
    if (worst) { drop(worst.it, worst.kind); changed = true; }
  }

  // 4. walk paths — drop lowest-priority blockers in the room
  for (const room of rooms || []) {
    let safety = 0;
    while (!walkPathClear(room, list, rooms, WS) && safety++ < 20) {
      const candidates = list.filter((it) => {
        if (isLockedItem(it) || isNonBlockingType(it.type)) return false;
        if (it.type === 'morroBay' || it.type === 'sofa' || it.type === 'sectional' || it.type === 'bed' || it.type === 'diningTable') return false;
        const r = itemRect(it);
        return overlap(r, [room[3], room[4], room[5], room[6]]);
      });
      if (!candidates.length) break;
      candidates.sort((a, b) => dropScore(a) - dropScore(b));
      drop(candidates[0], 'walk');
    }
  }

  // 5. surface items whose host was removed
  for (const it of list.slice()) {
    if (sameHost(dropped, it) && !hostsNear(it, list, 2.0)) drop(it, 'orphan-surface');
  }

  const report = validateLayout(rooms, WS, list);
  return { items: list, dropped, report };
}

export function itemBlocksCirculation(it, rooms, WS) {
  if (!it || !isFloorStanding(it) || isLockedItem(it)) return false;
  const room = roomAt(rooms, it.x, it.y);
  if (room && isCirculationRoom(room, rooms)) return true;
  const hit = clearanceHit(itemRect(it), rooms, WS, 0.05);
  return hit?.kind === 'hallway';
}
