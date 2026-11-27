// PeakStead Designs — Free Draw: turn a freehand sketch into a PeakStead plan model.
//
// Input sketch (board units, roughly CSS px of a 1200 x 800 board):
//   { strokes: [{ tool: 'wall' | 'door' | 'window', pts: [[x, y], ...] }],
//     labels:  [{ x, y, type }] }
// Size: { mode: 'dims', width, depth } (feet) or { mode: 'sqft', sqft }.
//
// Steps: simplify strokes, snap each piece to horizontal / vertical (45° pieces are
// kept for display and squared off in the model), cluster nearby lines so corners
// meet, close small gaps, flood-fill the closed areas into rooms, scale to feet,
// then emit rooms + walls + doors + windows + roofs in the same JSON format the
// Builder uses, so the existing 2D plan, 3D viewer, furnishing, and Edit Plan work.
import { makeWalls } from '/3d/lib.js';
import { TYPE_BY_ID, newBlock, compileModel, serializeModel, formatDims } from '/js/builder-catalog.js';

export const LABEL_TYPES = [
  { id: 'living', label: 'Living' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'dining', label: 'Dining' },
  { id: 'master-bedroom', label: 'Primary Bed' },
  { id: 'bedroom', label: 'Bed' },
  { id: 'bathroom', label: 'Bath' },
  { id: 'laundry', label: 'Laundry' },
  { id: 'office', label: 'Office' },
  { id: 'closet', label: 'Closet' },
  { id: 'hallway', label: 'Hall' },
  { id: 'entry', label: 'Entry' },
  { id: 'garage', label: 'Garage' },
  { id: 'porch', label: 'Porch' },
];

// Display names for rooms (furnishing keys off these words).
const ROOM_NAME = {
  living: 'Living Room', kitchen: 'Kitchen', dining: 'Dining Room', 'master-bedroom': 'Primary Bedroom',
  bedroom: 'Bedroom', bathroom: 'Bathroom', laundry: 'Laundry', office: 'Office', closet: 'Closet',
  hallway: 'Hallway', entry: 'Entry', garage: 'Garage', porch: 'Covered Porch', family: 'Family Room',
};
const OPEN = new Set(['living', 'kitchen', 'dining', 'entry', 'family']);
const HUB = new Set(['living', 'kitchen', 'dining', 'entry', 'family', 'hallway']);

/* ---------------- geometry helpers ---------------- */
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function rdp(pts, eps) {
  if (pts.length < 3) return pts.slice();
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let idx = -1, best = 0;
  const L = dist(a, b) || 1e-9;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    const d = Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / L;
    if (d > best) { best = d; idx = i; }
  }
  if (best <= eps) return [a, b];
  const l = rdp(pts.slice(0, idx + 1), eps);
  const r = rdp(pts.slice(idx), eps);
  return l.slice(0, -1).concat(r);
}

function strokeLength(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]);
  return s;
}

function classify(p, q) {
  const dx = q[0] - p[0], dy = q[1] - p[1];
  let ang = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI); // 0..180
  if (ang > 90) ang = 180 - ang; // 0..90
  if (ang <= 22) return 'h';
  if (ang >= 68) return 'v';
  if (Math.abs(ang - 45) <= 14) return 'd';
  return ang < 45 ? 'h' : 'v';
}

/** Turn one freehand stroke into straight pieces. */
function strokeToSegs(pts, tol) {
  if (pts.length < 2) return [];
  let poly = rdp(pts, tol * 0.55);
  // Close nearly-closed loops.
  if (poly.length >= 3 && dist(poly[0], poly[poly.length - 1]) < tol * 3 && strokeLength(pts) > tol * 8) {
    poly = poly.concat([poly[0]]);
  }
  const raw = [];
  for (let i = 1; i < poly.length; i++) {
    const p = poly[i - 1], q = poly[i];
    const len = dist(p, q);
    if (len < tol * 0.5) continue;
    raw.push({ o: classify(p, q), p, q, len });
  }
  // Merge consecutive pieces with the same direction class.
  const merged = [];
  for (const s of raw) {
    const last = merged[merged.length - 1];
    if (last && last.o === s.o && s.o !== 'd') {
      last.parts.push(s); last.q = s.q; last.len += s.len;
    } else merged.push({ ...s, parts: [s] });
  }
  return merged.map((m) => {
    if (m.o === 'h') {
      const c = m.parts.reduce((t, s) => t + (s.p[1] + s.q[1]) / 2 * s.len, 0) / m.len;
      return { o: 'h', c, a: Math.min(m.p[0], m.q[0]), b: Math.max(m.p[0], m.q[0]) };
    }
    if (m.o === 'v') {
      const c = m.parts.reduce((t, s) => t + (s.p[0] + s.q[0]) / 2 * s.len, 0) / m.len;
      return { o: 'v', c, a: Math.min(m.p[1], m.q[1]), b: Math.max(m.p[1], m.q[1]) };
    }
    return { o: 'd', p: m.p, q: m.q };
  });
}

function cluster(values, tol) {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const groups = [];
  for (const v of sorted) {
    const g = groups[groups.length - 1];
    if (g && v - g.max <= tol) { g.vals.push(v); g.max = v; }
    else groups.push({ vals: [v], max: v });
  }
  const map = new Map();
  const centers = groups.map((g) => g.vals.reduce((a, b) => a + b, 0) / g.vals.length);
  groups.forEach((g, i) => g.vals.forEach((v) => map.set(v, centers[i])));
  return { map, centers };
}

/* ---------------- main entry ---------------- */
export function interpretSketch(sketch, size = {}) {
  const warnings = [];
  const strokes = (sketch && sketch.strokes) || [];
  const wallStrokes = strokes.filter((s) => (s.tool || 'wall') === 'wall' && s.pts && s.pts.length > 1 && strokeLength(s.pts) > 12);
  if (!wallStrokes.length) return { ok: false, error: 'Draw the outside walls of your house first.' };

  const allPts = wallStrokes.flatMap((s) => s.pts);
  const minX0 = Math.min(...allPts.map((p) => p[0])), maxX0 = Math.max(...allPts.map((p) => p[0]));
  const minY0 = Math.min(...allPts.map((p) => p[1])), maxY0 = Math.max(...allPts.map((p) => p[1]));
  const S = Math.max(maxX0 - minX0, maxY0 - minY0, 60);
  const tol = Math.max(7, S * 0.022);
  const cen = [(minX0 + maxX0) / 2, (minY0 + maxY0) / 2];

  // 1) Straighten strokes.
  let segs = [];
  const diags = [];
  for (const s of wallStrokes) segs.push(...strokeToSegs(s.pts, tol));
  // 45° pieces: keep for display; square off for the model with the corner toward the middle of the house.
  const ortho = [];
  for (const s of segs) {
    if (s.o !== 'd') { ortho.push(s); continue; }
    diags.push({ p: s.p.slice(), q: s.q.slice() });
    const c1 = [s.p[0], s.q[1]], c2 = [s.q[0], s.p[1]];
    const corner = dist(c1, cen) < dist(c2, cen) ? c1 : c2;
    for (const [a, b] of [[s.p, corner], [corner, s.q]]) {
      if (Math.abs(a[1] - b[1]) < 0.01) ortho.push({ o: 'h', c: a[1], a: Math.min(a[0], b[0]), b: Math.max(a[0], b[0]), diag: true });
      else ortho.push({ o: 'v', c: a[0], a: Math.min(a[1], b[1]), b: Math.max(a[1], b[1]), diag: true });
    }
  }
  segs = ortho.filter((s) => s.b - s.a > tol * 0.5);
  if (diags.length) warnings.push('Angled walls were squared off in the model.');

  // 2) Cluster x and y lines so corners meet exactly.
  const xs = [], ys = [];
  for (const s of segs) {
    if (s.o === 'h') { ys.push(s.c); xs.push(s.a, s.b); } else { xs.push(s.c); ys.push(s.a, s.b); }
  }
  const cx = cluster(xs, tol), cy = cluster(ys, tol);
  const X = (v) => cx.map.get(v) ?? v, Y = (v) => cy.map.get(v) ?? v;
  segs = segs.map((s) => s.o === 'h' ? { ...s, c: Y(s.c), a: X(s.a), b: X(s.b) } : { ...s, c: X(s.c), a: Y(s.a), b: Y(s.b) })
    .filter((s) => s.b - s.a > 0.5);

  // 3) Close small gaps: extend a loose end to the nearest crossing wall line.
  const snapEnd = (s, val, isA) => {
    let best = null, bestD = tol * 2.6;
    for (const o of segs) {
      if (o === s || o.o === s.o) continue;
      // o is perpendicular: its c is along s's axis; s.c must be within o's span (with slack)
      if (s.c < o.a - tol || s.c > o.b + tol) continue;
      const d = Math.abs(o.c - val);
      if (d < 0.01) return val; // already on a line
      if (d < bestD && ((isA && o.c < val + tol * 0.4) || (!isA && o.c > val - tol * 0.4))) { bestD = d; best = o.c; }
    }
    return best ?? val;
  };
  for (const s of segs) { s.a = snapEnd(s, s.a, true); s.b = snapEnd(s, s.b, false); }
  // Perpendicular walls whose span stops just short of this one: stretch their span too.
  for (const s of segs) {
    for (const o of segs) {
      if (o.o === s.o) continue;
      if (Math.abs(o.c - s.a) <= tol * 0.01 || Math.abs(o.c - s.b) <= tol * 0.01) {
        if (s.c < o.a && o.a - s.c < tol * 1.6) o.a = s.c;
        if (s.c > o.b && s.c - o.b < tol * 1.6) o.b = s.c;
      }
    }
  }

  // 4) Grid from all line coordinates (plus an outside ring).
  const uniq = (arr) => [...new Set(arr.map((v) => Math.round(v * 100) / 100))].sort((a, b) => a - b);
  const gx0 = uniq(segs.flatMap((s) => s.o === 'v' ? [s.c] : [s.a, s.b]));
  const gy0 = uniq(segs.flatMap((s) => s.o === 'h' ? [s.c] : [s.a, s.b]));
  if (gx0.length < 2 || gy0.length < 2) return { ok: false, error: 'Close the outline of the house so it forms a loop.' };
  const GX = [gx0[0] - 50, ...gx0, gx0[gx0.length - 1] + 50];
  const GY = [gy0[0] - 50, ...gy0, gy0[gy0.length - 1] + 50];
  const nx = GX.length - 1, ny = GY.length - 1;
  const r2 = (v) => Math.round(v * 100) / 100;
  const covers = (o, c, a, b) => {
    const span = b - a;
    let cov = 0;
    for (const s of segs) {
      if (s.o !== o || Math.abs(r2(s.c) - r2(c)) > 0.02) continue;
      cov += Math.max(0, Math.min(b, s.b) - Math.max(a, s.a));
    }
    return cov >= span * 0.5;
  };
  // blockedV[i][j]: edge between cell (i,j) and (i+1,j) at x = GX[i+1]
  const blockedV = [], blockedH = [];
  for (let i = 0; i < nx - 1; i++) { blockedV[i] = []; for (let j = 0; j < ny; j++) blockedV[i][j] = covers('v', GX[i + 1], GY[j], GY[j + 1]); }
  for (let i = 0; i < nx; i++) { blockedH[i] = []; for (let j = 0; j < ny - 1; j++) blockedH[i][j] = covers('h', GY[j + 1], GX[i], GX[i + 1]); }
  const nbrs = (i, j) => {
    const out = [];
    if (i > 0 && !blockedV[i - 1][j]) out.push([i - 1, j]);
    if (i < nx - 1 && !blockedV[i][j]) out.push([i + 1, j]);
    if (j > 0 && !blockedH[i][j - 1]) out.push([i, j - 1]);
    if (j < ny - 1 && !blockedH[i][j]) out.push([i, j + 1]);
    return out;
  };
  const region = Array.from({ length: nx }, () => new Array(ny).fill(-2)); // -2 unvisited, -1 outside
  const flood = (si, sj, id) => {
    const st = [[si, sj]]; region[si][sj] = id; const cells = [];
    while (st.length) {
      const [i, j] = st.pop(); cells.push([i, j]);
      for (const [a, b] of nbrs(i, j)) if (region[a][b] === -2) { region[a][b] = id; st.push([a, b]); }
    }
    return cells;
  };
  flood(0, 0, -1);
  const regions = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    if (region[i][j] !== -2) continue;
    const id = regions.length;
    regions.push({ id, cells: flood(i, j, id) });
  }
  if (!regions.length) return { ok: false, error: 'The outline has a gap. Make sure the outside walls meet so the house is closed.' };

  // 5) Scale to feet.
  const cellArea = (i, j) => (GX[i + 1] - GX[i]) * (GY[j + 1] - GY[j]);
  // Size off the house itself (porches can hang outside the width x depth).
  const inside = regions.flatMap((r) => r.cells);
  const ix0 = Math.min(...inside.map(([i]) => GX[i])), ix1 = Math.max(...inside.map(([i]) => GX[i + 1]));
  const iy0 = Math.min(...inside.map(([, j]) => GY[j])), iy1 = Math.max(...inside.map(([, j]) => GY[j + 1]));
  let hx0 = ix0, hx1 = ix1, hy0 = iy0, hy1 = iy1;

  // Labels first (we need porch/garage to size by heated area).
  const cellAt = (x, y) => {
    let i = -1, j = -1;
    for (let k = 0; k < nx; k++) if (x >= GX[k] && x < GX[k + 1]) { i = k; break; }
    for (let k = 0; k < ny; k++) if (y >= GY[k] && y < GY[k + 1]) { j = k; break; }
    return i < 0 || j < 0 ? null : [i, j];
  };
  for (const lb of (sketch.labels || [])) {
    const c = cellAt(lb.x, lb.y);
    if (!c) continue;
    const rid = region[c[0]][c[1]];
    if (rid >= 0 && TYPE_BY_ID[lb.type]) regions[rid].type = lb.type;
  }
  const unitArea = (r) => r.cells.reduce((t, [i, j]) => t + cellArea(i, j), 0);
  {
    const house = regions.filter((r) => r.type !== 'porch').flatMap((r) => r.cells);
    if (house.length) {
      hx0 = Math.min(...house.map(([i]) => GX[i])); hx1 = Math.max(...house.map(([i]) => GX[i + 1]));
      hy0 = Math.min(...house.map(([, j]) => GY[j])); hy1 = Math.max(...house.map(([, j]) => GY[j + 1]));
    }
  }
  let sx, sy;
  if (size.mode === 'sqft' && +size.sqft > 100) {
    const heatedU = regions.filter((r) => r.type !== 'garage' && r.type !== 'porch').reduce((t, r) => t + unitArea(r), 0) || 1;
    sx = sy = Math.sqrt(+size.sqft / heatedU);
  } else {
    const W = Math.max(12, Math.min(400, +size.width || 50));
    const D = Math.max(12, Math.min(400, +size.depth || 34));
    sx = W / Math.max(1, hx1 - hx0); sy = D / Math.max(1, hy1 - hy0);
    const ratio = sx / sy;
    if (ratio > 1.6 || ratio < 0.62) warnings.push('The size you entered stretches your sketch a lot. Check width and depth.');
  }
  // Feet coordinates per grid line, rounded to whole feet, collapsing lines under 2.5 ft apart.
  const toFeet = (G, min, s) => {
    const out = G.map((v) => Math.round((v - min) * s));
    for (let k = 1; k < out.length; k++) {
      if (out[k] - out[k - 1] < 2.5 && out[k] !== out[k - 1]) {
        // collapse the thinner sliver into its neighbor
        out[k] = out[k - 1];
      }
    }
    return out;
  };
  const FX = toFeet(GX.slice(1, -1), ix0, sx), FY = toFeet(GY.slice(1, -1), iy0, sy);
  const fx = (i) => i === 0 ? FX[0] - 10 : i === nx ? FX[FX.length - 1] + 10 : FX[i - 1];
  const fy = (j) => j === 0 ? FY[0] - 10 : j === ny ? FY[FY.length - 1] + 10 : FY[j - 1];

  // 6) Room types: labels, then size heuristics for the rest.
  for (const r of regions) {
    r.sf = r.cells.reduce((t, [i, j]) => t + (fx(i + 1) - fx(i)) * (fy(j + 1) - fy(j)), 0);
    const ci = r.cells.map(([i]) => i), cj = r.cells.map(([, j]) => j);
    r.bx0 = fx(Math.min(...ci)); r.bx1 = fx(Math.max(...ci) + 1);
    r.by0 = fy(Math.min(...cj)); r.by1 = fy(Math.max(...cj) + 1);
    r.labeled = !!r.type;
  }
  const live = regions.filter((r) => r.sf >= 6);
  regions.filter((r) => r.sf < 6).forEach((r) => { r.dead = true; });
  const unl = live.filter((r) => !r.type).sort((a, b) => b.sf - a.sf);
  const has = (t) => live.some((r) => r.type === t);
  for (const r of unl) {
    const w = r.bx1 - r.bx0, d = r.by1 - r.by0;
    const minD = Math.min(w, d), maxD = Math.max(w, d);
    if (minD <= 5.5 && maxD / Math.max(1, minD) >= 2.2) r.type = 'hallway';
    else if (r.sf < 30) r.type = 'closet';
    else if (r.sf < 90 && minD <= 9) r.type = 'bathroom';
    else if (!has('living')) r.type = 'living';
    else if (r.sf >= 260 && minD >= 13 && !has('family')) r.type = 'family';
    else r.type = 'bedroom';
  }
  if (!has('kitchen')) warnings.push('No kitchen is labeled yet. Use Label to tap the kitchen.');
  if (unl.length) warnings.push(`${unl.length} unlabeled room${unl.length === 1 ? ' was' : 's were'} named by size. Tap Label to set them.`);
  // Names, numbered when repeated.
  const counts = {};
  for (const r of live) counts[r.type] = (counts[r.type] || 0) + 1;
  const seen = {};
  for (const r of live) {
    seen[r.type] = (seen[r.type] || 0) + 1;
    const base = ROOM_NAME[r.type] || (TYPE_BY_ID[r.type] || {}).name || 'Room';
    r.name = counts[r.type] > 1 && r.type !== 'hallway' && seen[r.type] > 1 ? `${base} ${seen[r.type]}` : base;
    r.outside = r.type === 'porch';
  }

  // 7) Each room → rectangles (greedy on the compressed grid).
  const pieces = [];
  for (const r of live) {
    const set = new Set(r.cells.filter(([i, j]) => fx(i + 1) > fx(i) && fy(j + 1) > fy(j)).map(([i, j]) => i + ',' + j));
    const used = new Set();
    const sorted = [...set].map((k) => k.split(',').map(Number)).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const okCell = (i, j) => set.has(i + ',' + j) && !used.has(i + ',' + j);
    const nextI = (i) => { let k = i + 1; while (k < nx && fx(k + 1) === fx(k)) k++; return k; };
    const nextJ = (j) => { let k = j + 1; while (k < ny && fy(k + 1) === fy(k)) k++; return k; };
    const rects = [];
    for (const [i0, j0] of sorted) {
      if (!okCell(i0, j0)) continue;
      let i1 = i0; // inclusive
      while (true) { const n = nextI(i1); if (n < nx && okCell(n, j0)) i1 = n; else break; }
      const colsOf = () => { const c = []; for (let i = i0; i <= i1; i++) if (fx(i + 1) > fx(i)) c.push(i); return c; };
      const cols = colsOf();
      let j1 = j0;
      while (true) {
        const n = nextJ(j1);
        if (n < ny && fy(n + 1) > fy(n) && cols.every((i) => okCell(i, n))) j1 = n; else break;
      }
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) used.add(i + ',' + j);
      rects.push({ x0: fx(i0), y0: fy(j0), x1: fx(i1 + 1), y1: fy(j1 + 1) });
    }
    rects.sort((a, b) => (b.x1 - b.x0) * (b.y1 - b.y0) - (a.x1 - a.x0) * (a.y1 - a.y0));
    rects.forEach((rc, k) => pieces.push({ ...rc, region: r, primary: k === 0 }));
    r.rects = rects;
  }
  if (!pieces.length) return { ok: false, error: 'No rooms were found. Draw closed shapes for the house and its rooms.' };
  // The 3D engine uses screen-style axes (north = -y), same as the sketch: top of the sketch is north.

  // Lookup: which room covers a point (feet)?
  const roomAt = (x, y) => {
    for (const p of pieces) if (x > p.x0 && x < p.x1 && y > p.y0 && y < p.y1) return p.region;
    return null;
  };

  // 8) Wall runs from piece edges.
  const lines = new Map(); // key -> { horiz, c, pts:Set }
  const addLine = (horiz, c, a, b) => {
    const k = (horiz ? 'h' : 'v') + c;
    if (!lines.has(k)) lines.set(k, { horiz, c, pts: new Set() });
    const L = lines.get(k); L.pts.add(a); L.pts.add(b);
  };
  for (const p of pieces) {
    addLine(true, p.y0, p.x0, p.x1); addLine(true, p.y1, p.x0, p.x1);
    addLine(false, p.x0, p.y0, p.y1); addLine(false, p.x1, p.y0, p.y1);
  }
  const runs = [];
  for (const L of lines.values()) {
    const pts = [...L.pts].sort((a, b) => a - b);
    let cur = null;
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1], b = pts[k], m = (a + b) / 2;
      const A = L.horiz ? roomAt(m, L.c - 0.25) : roomAt(L.c - 0.25, m);
      const B = L.horiz ? roomAt(m, L.c + 0.25) : roomAt(L.c + 0.25, m);
      let kind = null;
      if (A === B) kind = null;
      else if (!A || !B) { const R = A || B; kind = R.outside ? null : 'ext'; }
      else if (A.outside && B.outside) kind = null;
      else if (A.outside || B.outside) kind = 'ext';
      else kind = 'int';
      const key = kind ? `${kind}|${A ? A.id : '-'}|${B ? B.id : '-'}` : null;
      if (cur && cur.key === key && cur.b === a) { cur.b = b; continue; }
      if (cur && cur.key) runs.push(cur);
      cur = { key, kind, horiz: L.horiz, c: L.c, a, b, A, B, ops: [] };
    }
    if (cur && cur.key) runs.push(cur);
  }
  const runLen = (r) => r.b - r.a;
  // Outward side of an exterior run: which side has no house room.
  for (const r of runs) {
    if (r.kind !== 'ext') continue;
    const inner = (!r.A || r.A.outside) ? r.B : r.A;
    r.inner = inner;
    r.porch = (r.A && r.A.outside) ? r.A : (r.B && r.B.outside) ? r.B : null;
    r.outSide = (inner === r.A) ? +1 : -1; // +1: outside is on the +y / +x side
  }

  // 9) Marks (doors / windows) in feet.
  const toF = (p) => [(p[0] - ix0) * sx, (p[1] - iy0) * sy];
  const marks = strokes.filter((s) => s.tool === 'door' || s.tool === 'window').map((s) => {
    const fp = s.pts.map(toF);
    const c = [fp.reduce((t, p) => t + p[0], 0) / fp.length, fp.reduce((t, p) => t + p[1], 0) / fp.length];
    return { tool: s.tool, c, len: strokeLength(fp) };
  });
  const runForMark = (m, maxD = 3.2) => {
    let best = null, bestD = maxD;
    for (const r of runs) {
      const along = r.horiz ? m.c[0] : m.c[1], perp = r.horiz ? m.c[1] : m.c[0];
      if (along < r.a - 0.5 || along > r.b + 0.5) continue;
      const d = Math.abs(perp - r.c);
      if (d < bestD) { bestD = d; best = r; }
    }
    return best;
  };
  const doorMarks = [], winMarks = [];
  for (const m of marks) {
    const r = runForMark(m);
    if (!r) continue;
    const at = Math.max(r.a, Math.min(r.b, r.horiz ? m.c[0] : m.c[1]));
    (m.tool === 'door' ? doorMarks : winMarks).push({ run: r, at, len: m.len });
  }

  // 10) Interior openings: connect every room with as few doors as feel natural.
  const intRuns = runs.filter((r) => r.kind === 'int');
  const pairKey = (a, b) => [a.id, b.id].sort((p, q) => p - q).join('-');
  const pairs = new Map();
  for (const r of intRuns) {
    const k = pairKey(r.A, r.B);
    if (!pairs.has(k)) pairs.set(k, { a: r.A, b: r.B, runs: [] });
    pairs.get(k).runs.push(r);
  }
  const markedPairs = new Set(doorMarks.filter((d) => d.run.kind === 'int').map((d) => pairKey(d.run.A, d.run.B)));
  const anyIntMarks = markedPairs.size > 0;
  const cost = (p) => {
    const ta = p.a.type, tb = p.b.type;
    const best = Math.max(...p.runs.map(runLen));
    if (best < 3.4) return 99;
    if (markedPairs.has(pairKey(p.a, p.b))) return -2;
    if (OPEN.has(ta) && OPEN.has(tb)) return -1;
    if (HUB.has(ta) && HUB.has(tb)) return 0;
    const pair = [ta, tb].sort().join('+');
    if (pair === 'bathroom+master-bedroom' || pair === 'closet+master-bedroom') return 0.5;
    if (HUB.has(ta) || HUB.has(tb)) {
      const hub = HUB.has(ta) ? ta : tb, other = hub === ta ? tb : ta;
      const privateRoom = /bed|bath|closet|office/.test(other);
      // Bedrooms and baths open off a hall first, then living spaces, kitchens last.
      const w = { hallway: 0.8, entry: 1.1, living: 1.2, family: 1.2, dining: 1.6, kitchen: 2.4 }[hub] ?? 1.2;
      return (privateRoom ? w : 1) + (other === 'garage' ? 0.5 : 0);
    }
    if (/laundry/.test(pair) && /garage/.test(pair)) return 1.2;
    if (/closet/.test(pair) && /bed/.test(pair)) return 1.4;
    if (/bathroom/.test(pair) && /bed/.test(pair)) return 3;
    if (/laundry/.test(pair) && /bathroom/.test(pair)) return 4;
    if (/bed/.test(ta) && /bed/.test(tb)) return 7;
    return 5.5;
  };
  const parent = new Map();
  const find = (x) => { while (parent.get(x) !== x) x = parent.get(x); return x; };
  live.forEach((r) => parent.set(r.id, r.id));
  const chosen = [];
  const sortedPairs = [...pairs.values()].map((p) => ({ ...p, cost: cost(p) })).filter((p) => p.cost < 99).sort((a, b) => a.cost - b.cost);
  for (const p of sortedPairs) {
    const ra = find(p.a.id), rb = find(p.b.id);
    const always = p.cost <= -1; // marked doors and open-concept pairs always connect
    if (ra !== rb) { parent.set(ra, rb); chosen.push(p); }
    else if (always) chosen.push(p);
  }
  void anyIntMarks;
  // A primary suite closet / bath reachable only through the hall when the bedroom is next to it: fine either way.

  const DOOR_W = (p) => (/bathroom|closet/.test(p.a.type + p.b.type) ? 2.67 : 3);
  for (const p of chosen) {
    const mk = doorMarks.find((d) => d.run.kind === 'int' && pairKey(d.run.A, d.run.B) === pairKey(p.a, p.b));
    const run = mk ? mk.run : p.runs.slice().sort((a, b) => runLen(b) - runLen(a))[0];
    const L = runLen(run);
    const open = OPEN.has(p.a.type) && OPEN.has(p.b.type);
    const hallOpen = (p.a.type === 'hallway' && OPEN.has(p.b.type)) || (p.b.type === 'hallway' && OPEN.has(p.a.type));
    if (open || hallOpen) {
      const half = Math.max(1.6, Math.min(L / 2 - 0.5, open ? 6 : 2.5));
      const mid = (run.a + run.b) / 2;
      run.ops.push({ s: mid - half, e: mid + half, kind: 'door', top: 8 });
    } else {
      const w = DOOR_W(p);
      if (L < w + 0.6) continue;
      // Doors sit near a corner (leaves wall for furniture) unless a mark says where.
      let mid = mk ? mk.at : (run.a + 0.4 + w / 2);
      mid = Math.max(run.a + 0.3 + w / 2, Math.min(run.b - 0.3 - w / 2, mid));
      run.ops.push({ s: mid - w / 2, e: mid + w / 2, kind: 'door', top: 7 });
    }
  }

  // 11) Exterior openings.
  const extRuns = runs.filter((r) => r.kind === 'ext');
  const userWindows = winMarks.filter((w) => w.run.kind === 'ext');
  const addOp = (run, op) => {
    if (op.s < run.a + 0.25 || op.e > run.b - 0.25) {
      const w = op.e - op.s;
      if (w > runLen(run) - 0.5) return false;
      const mid = Math.max(run.a + 0.3 + w / 2, Math.min(run.b - 0.3 - w / 2, (op.s + op.e) / 2));
      op = { ...op, s: mid - w / 2, e: mid + w / 2 };
    }
    if (run.ops.some((o) => o.kind === 'door' && Math.min(o.e, op.e) - Math.max(o.s, op.s) > -0.6)) return false;
    if (op.kind === 'door') run.ops = run.ops.filter((o) => !(o.kind === 'win' && Math.min(o.e, op.e) - Math.max(o.s, op.s) > -0.5));
    else if (run.ops.some((o) => Math.min(o.e, op.e) - Math.max(o.s, op.s) > -0.5)) return false;
    run.ops.push(op);
    return true;
  };
  // Prefer the south (front, bottom of the sketch) face: outside on +y.
  const frontScore = (r) => runLen(r) * (r.horiz ? (r.outSide > 0 ? 3 : 1.4) : 1);
  // Garage bays (open, no panels) on the garage's best outside wall.
  for (const g of live.filter((r) => r.type === 'garage')) {
    const cands = extRuns.filter((r) => r.inner === g && !r.porch && runLen(r) >= 10).sort((a, b) => frontScore(b) - frontScore(a));
    const run = cands[0];
    if (!run) { warnings.push(`${g.name} has no outside wall long enough for a garage door.`); continue; }
    const bays = runLen(run) >= 28 ? 3 : runLen(run) >= 18 ? 2 : 1;
    const span = runLen(run) - 0.8;
    const door = Math.min(9, Math.max(8, (span - (bays + 1) * 1.5) / bays));
    const used = bays * door + (bays + 1) * 1.5;
    let cur = run.a + 0.4 + (span - used) / 2 + 1.5;
    for (let k = 0; k < bays; k++) { run.ops.push({ s: cur, e: cur + door, kind: 'door', top: 8, garage: true }); cur += door + 1.5; }
  }
  // Porches: one wide door from the house.
  for (const pr of live.filter((r) => r.outside)) {
    const cands = extRuns.filter((r) => r.porch === pr && r.inner && runLen(r) >= 4).sort((a, b) => runLen(b) - runLen(a));
    const run = cands[0];
    if (!run) continue;
    const mid = (run.a + run.b) / 2, half = Math.min(3, runLen(run) / 2 - 0.4);
    addOp(run, { s: mid - half, e: mid + half, kind: 'door', top: 8, porchDoor: true });
  }
  // User exterior door marks.
  let frontDone = false;
  for (const d of doorMarks.filter((m) => m.run.kind === 'ext')) {
    if (d.run.inner && d.run.inner.type === 'garage' && d.run.ops.some((o) => o.garage)) continue;
    if (addOp(d.run, { s: d.at - 1.75, e: d.at + 1.75, kind: 'door', top: 8 })) frontDone = true;
  }
  if (!frontDone && !live.some((r) => r.outside)) {
    const want = live.find((r) => r.type === 'entry') || live.find((r) => r.type === 'living') || live.find((r) => HUB.has(r.type) && r.type !== 'hallway') || live.find((r) => r.type !== 'garage');
    const cands = extRuns.filter((r) => r.inner === want && !r.porch && runLen(r) >= 5).sort((a, b) => frontScore(b) - frontScore(a));
    if (cands[0]) {
      const r = cands[0], mid = (r.a + r.b) / 2;
      addOp(r, { s: mid - 1.75, e: mid + 1.75, kind: 'door', top: 8 });
      if (!doorMarks.length) warnings.push('No front door was marked, so one was added to the ' + want.name.toLowerCase() + '.');
    }
  }
  // Windows: the user's marks if any, otherwise evenly spaced on outside walls.
  if (userWindows.length) {
    for (const w of userWindows) {
      if (w.run.inner && w.run.inner.type === 'garage') continue;
      addOp(w.run, { s: w.at - 1.75, e: w.at + 1.75, kind: 'win', sill: 3, head: 7 });
    }
  } else {
    for (const r of extRuns) {
      if (r.porch || !r.inner) continue;
      if (/garage|closet|hallway/.test(r.inner.type)) continue;
      const L = runLen(r);
      if (L < 5) continue;
      const n = L < 10 ? 1 : L > 22 ? 3 : 2;
      for (let k = 0; k < n; k++) {
        const mid = r.a + ((k + 0.5) / n) * L;
        const half = L < 10 ? Math.min(2, L / 2 - 0.6) : 2;
        if (half < 1) continue;
        addOp(r, { s: mid - half, e: mid + half, kind: 'win', sill: 3, head: 7 });
      }
    }
  }

  // 12) Emit walls.
  const wallH = 9;
  const walls = makeWalls();
  for (const r of runs) {
    const ext = r.kind === 'ext';
    const ops = r.ops.slice().sort((p, q) => p.s - q.s);
    const doors = ops.filter((o) => o.kind === 'door').map((o) => [o.s, o.e, o.top || 7]);
    const windows = ops.filter((o) => o.kind === 'win').map((o) => [o.s, o.e, o.sill ?? 3, o.head ?? 7]);
    if (r.horiz) walls.seg(r.a, r.c, r.b, r.c, { ext, h: wallH, doors, windows });
    else walls.seg(r.c, r.a, r.c, r.b, { ext, h: wallH, doors, windows });
  }

  // 13) Rooms, slabs, ceilings, porch posts via the Builder compiler (walls/roofs replaced below).
  const blocks = pieces.map((p, k) => {
    const b = newBlock(p.region.type === 'family' ? 'family' : p.region.type, 'medium', p.x0, p.y0, {
      id: 'fd_' + k, w: p.x1 - p.x0, d: p.y1 - p.y0, name: p.region.name, sizeKey: 'custom',
    });
    return b;
  });
  const base = compileModel(blocks, { name: 'My Free Draw home', wallH });
  // Secondary pieces of an L-shaped room share the room's furniture; label only the main piece.
  base.rooms = base.rooms.map((rm, k) => {
    const p = pieces[k];
    const o = { ...(rm[7] || {}) };
    if (!p.primary) { o.noAuto = true; o.minor = true; o.noLabel = true; o.planNoLabel = true; }
    const region = p.region;
    const label = p.primary ? region.name : region.name;
    const dims = p.primary && region.rects.length === 1 ? rm[1] : `${Math.round(region.sf)} sf`;
    return [label, dims, rm[2], rm[3], rm[4], rm[5], rm[6], o];
  });
  // Drop the compiler's kitchen counters; we place our own that respect doors.
  const furnish = (base.furnish || []).filter((f) => !(f[0] === 'block' && f[7] === '#efe7da'));

  // Kitchen counters along open stretches of wall, clear of door swings.
  const doorZones = [];
  for (const r of runs) for (const o of r.ops) {
    if (o.kind !== 'door') continue;
    const pad = 3.6;
    doorZones.push(r.horiz ? [o.s - 0.4, r.c - pad, o.e + 0.4, r.c + pad] : [r.c - pad, o.s - 0.4, r.c + pad, o.e + 0.4]);
  }
  const hitsDoor = (q) => doorZones.some((z) => q[0] < z[2] && q[2] > z[0] && q[1] < z[3] && q[3] > z[1]);
  for (const k of live.filter((r) => r.type === 'kitchen')) {
    const main = pieces.find((p) => p.region === k && p.primary);
    if (!main) continue;
    const depth = 2, inset = 0.25;
    const cands = [];
    const sides = [
      ['n', true, main.y0, main.x0, main.x1, +1], ['s', true, main.y1, main.x0, main.x1, -1],
      ['w', false, main.x0, main.y0, main.y1, +1], ['e', false, main.x1, main.y0, main.y1, -1],
    ];
    for (const [side, horiz, c, a, b, inward] of sides) {
      // Must be a real wall on this side (not open to another open room).
      const mid = (a + b) / 2;
      const other = horiz ? roomAt(mid, c - inward * 0.3) : roomAt(c - inward * 0.3, mid);
      if (other && OPEN.has(other.type)) continue;
      // Slide along in 0.5 ft steps collecting door-free stretches.
      let start = null;
      const push = (s, e) => { if (e - s >= 4) cands.push({ side, horiz, c, s, e, inward }); };
      for (let t = a + inset; t <= b - inset + 1e-6; t += 0.5) {
        const q = horiz
          ? [t, inward > 0 ? c + inset : c - inset - depth, t + 0.5, inward > 0 ? c + inset + depth : c - inset]
          : [inward > 0 ? c + inset : c - inset - depth, t, inward > 0 ? c + inset + depth : c - inset, t + 0.5];
        const bad = hitsDoor(q) || t + 0.5 > b - inset + 1e-6;
        if (!bad && start === null) start = t;
        if (bad && start !== null) { push(start, t); start = null; }
      }
      if (start !== null) push(start, b - inset);
    }
    cands.sort((p, q) => (q.e - q.s) - (p.e - p.s));
    const picked = [];
    for (const cnd of cands) {
      if (picked.length >= 2) break;
      if (picked.some((p) => p.horiz === cnd.horiz)) continue;
      picked.push(cnd);
    }
    const rects = picked.map((p) => p.horiz
      ? [p.s, p.inward > 0 ? p.c + inset : p.c - inset - depth, p.e, p.inward > 0 ? p.c + inset + depth : p.c - inset]
      : [p.inward > 0 ? p.c + inset : p.c - inset - depth, p.s, p.inward > 0 ? p.c + inset + depth : p.c - inset, p.e]);
    // Trim the second run so the two don't overlap at the corner.
    if (rects.length === 2) {
      const [a, b] = rects;
      if (a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]) {
        if (picked[1].horiz) { if (b[0] < a[2] && b[0] >= a[0]) b[0] = a[2]; else b[2] = a[0]; }
        else { if (b[1] < a[3] && b[1] >= a[1]) b[1] = a[3]; else b[3] = a[1]; }
      }
    }
    for (const q of rects) if (Math.max(q[2] - q[0], q[3] - q[1]) >= 3) furnish.push(['block', q[0], q[1], q[2], q[3], 0, 3.0, '#efe7da']);
  }

  // 14) Roofs: gable over each main rectangle of the house, the garage on its own, shed porches.
  const roofs = [];
  const houseCells = [];
  for (const r of live) if (!r.outside && r.type !== 'garage') houseCells.push(...r.rects);
  const gable = (q) => {
    if (q.x1 - q.x0 < 2 || q.y1 - q.y0 < 2) return;
    roofs.push({ x0: q.x0, y0: q.y0, x1: q.x1, y1: q.y1, along: (q.x1 - q.x0) >= (q.y1 - q.y0) ? 'x' : 'y', pitch: 0.45, oh: 1, eave: wallH, ends: ['ext', 'ext'] });
  };
  for (const q of mergeRects(houseCells)) gable(q);
  for (const g of live.filter((r) => r.type === 'garage')) for (const q of mergeRects(g.rects)) gable(q);
  for (const pr of live.filter((r) => r.outside)) {
    for (const q of pr.rects) {
      const touch = extRuns.find((r) => r.porch === pr && r.inner);
      let shed = { shed: true, x0: q.x0, y0: q.y0, x1: q.x1, y1: q.y1, hi: 8.8, lo: 7.5, oh: 0.5 };
      if (touch) {
        if (touch.horiz) shed = touch.c <= q.y0 + 0.01 ? { ...shed, hi: 8.8, lo: 7.5 } : { ...shed, hi: 7.5, lo: 8.8 };
        else shed = touch.c <= q.x0 + 0.01 ? { ...shed, along: 'y', hi: 8.8, lo: 7.5 } : { ...shed, along: 'y', hi: 7.5, lo: 8.8 };
      }
      roofs.push(shed);
    }
  }

  // 15) Stats.
  let heated = 0, garage = 0, porch = 0;
  for (const r of live) {
    if (r.type === 'garage') garage += r.sf; else if (r.outside) porch += r.sf; else heated += r.sf;
  }
  const allX = pieces.flatMap((p) => [p.x0, p.x1]), allY = pieces.flatMap((p) => [p.y0, p.y1]);
  const width = Math.max(...allX) - Math.min(...allX), depthFt = Math.max(...allY) - Math.min(...allY);
  const entry = live.find((r) => r.type === 'entry') || live.find((r) => r.type === 'living') || live[0];
  const ep = pieces.find((p) => p.region === entry && p.primary) || pieces[0];
  const stats = { heated: Math.round(heated), garage: Math.round(garage), porch: Math.round(porch), width, depth: depthFt, rooms: live.length };
  const subtitle = `${stats.heated.toLocaleString()} sf heated` + (stats.garage ? ` · ${stats.garage.toLocaleString()} sf garage` : '') + ` · ${width}' × ${depthFt}' footprint`;

  const model = serializeModel({
    ...base,
    id: 'freedraw-draft',
    name: 'My Free Draw home',
    title: 'My Free Draw home',
    subtitle,
    walls,
    furnish,
    roofs,
    walkStart: [(ep.x0 + ep.x1) / 2, ep.y0 + (ep.y1 - ep.y0) * 0.6, 0],
    freedraw: { v: 1 },
  });

  // Cleaned lines back in board units, for drawing over the sketch.
  const invX = (f) => ix0 + f / sx, invY = (f) => iy0 + f / sy;
  const cleaned = runs.map((r) => r.horiz
    ? { kind: r.kind, x0: invX(r.a), y0: invY(r.c), x1: invX(r.b), y1: invY(r.c) }
    : { kind: r.kind, x0: invX(r.c), y0: invY(r.a), x1: invX(r.c), y1: invY(r.b) });
  const roomsOut = live.map((r) => {
    const p = pieces.find((q) => q.region === r && q.primary);
    return {
      id: r.id, name: r.name, type: r.type, sf: Math.round(r.sf), labeled: r.labeled,
      cx: invX((p.x0 + p.x1) / 2), cy: invY((p.y0 + p.y1) / 2),
      rects: r.rects.map((q) => ({ x0: invX(q.x0), y0: invY(q.y0), x1: invX(q.x1), y1: invY(q.y1) })),
      dims: r.rects.length === 1 ? formatDims(r.rects[0].x1 - r.rects[0].x0, r.rects[0].y1 - r.rects[0].y0) : `${Math.round(r.sf)} sf`,
    };
  });
  const openingsOut = runs.flatMap((r) => r.ops.map((o) => {
    const m = (o.s + o.e) / 2;
    return { kind: o.kind, garage: !!o.garage, x: r.horiz ? invX(m) : invX(r.c), y: r.horiz ? invY(r.c) : invY(m), horiz: r.horiz, len: (o.e - o.s) / (r.horiz ? sx : sy) };
  }));
  return { ok: true, model, stats, warnings, cleaned, diags, rooms: roomsOut, openings: openingsOut, blocks };
}

/** Merge touching rectangles that line up exactly into bigger ones (roof planning). */
function mergeRects(list) {
  let rects = list.map((r) => ({ ...r }));
  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j];
        let m = null;
        if (a.y0 === b.y0 && a.y1 === b.y1 && (a.x1 === b.x0 || b.x1 === a.x0)) m = { x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), y0: a.y0, y1: a.y1 };
        else if (a.x0 === b.x0 && a.x1 === b.x1 && (a.y1 === b.y0 || b.y1 === a.y0)) m = { y0: Math.min(a.y0, b.y0), y1: Math.max(a.y1, b.y1), x0: a.x0, x1: a.x1 };
        if (m) { rects.splice(j, 1); rects[i] = m; changed = true; break outer; }
      }
    }
  }
  // Drop tiny slivers into nothing (they still have walls; roofs from neighbors overhang).
  return rects.filter((r) => (r.x1 - r.x0) >= 3 && (r.y1 - r.y0) >= 3).sort((a, b) => (b.x1 - b.x0) * (b.y1 - b.y0) - (a.x1 - a.x0) * (a.y1 - a.y0));
}

/* ---------------- sample sketches (hand-drawn look) ---------------- */
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/** A wobbly hand-drawn line from a to b. */
export function wobblyLine(a, b, rand, amp = 3.2, overshoot = 6) {
  const L = dist(a, b), n = Math.max(6, Math.round(L / 9));
  const ux = (b[0] - a[0]) / (L || 1), uy = (b[1] - a[1]) / (L || 1);
  const start = [a[0] - ux * overshoot * rand(), a[1] - uy * overshoot * rand()];
  const end = [b[0] + ux * overshoot * (rand() - 0.3), b[1] + uy * overshoot * (rand() - 0.3)];
  const bow = (rand() - 0.5) * amp * 2.2;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = start[0] + (end[0] - start[0]) * t, y = start[1] + (end[1] - start[1]) * t;
    const off = Math.sin(t * Math.PI) * bow + (rand() - 0.5) * amp;
    pts.push([x - uy * off, y + ux * off]);
  }
  return pts;
}

function wobblyPoly(corners, rand, amp) {
  const pts = [];
  for (let i = 0; i < corners.length; i++) {
    const seg = wobblyLine(corners[i], corners[(i + 1) % corners.length], rand, amp, 0);
    pts.push(...(i ? seg.slice(1) : seg));
  }
  // leave a small gap at the end like a real sketch
  pts.pop();
  pts.push([corners[0][0] + (rand() - 0.5) * 8, corners[0][1] + 6 * rand()]);
  return pts;
}

const tick = (x, y, horiz, rand) => {
  const L = 16;
  return horiz
    ? [[x - L / 2, y + (rand() - 0.5) * 3], [x, y + (rand() - 0.5) * 3], [x + L / 2, y + (rand() - 0.5) * 3]]
    : [[x + (rand() - 0.5) * 3, y - L / 2], [x + (rand() - 0.5) * 3, y], [x + (rand() - 0.5) * 3, y + L / 2]];
};

export const SAMPLE_SKETCHES = {
  // Ranch with an attached two-car garage, front porch, two bedrooms (about 56' x 26').
  ranch(seed = 7) {
    const r = rng(seed), A = 3.4;
    const S = (a, b) => ({ tool: 'wall', pts: wobblyLine(a, b, r, A) });
    const strokes = [
      { tool: 'wall', pts: wobblyPoly([[96, 120], [1104, 120], [1104, 588], [96, 588]], r, A) },
      S([492, 120], [492, 588]),            // garage | house
      S([492, 336], [1104, 336]),           // bedroom wing | living
      S([708, 120], [708, 336]),            // bedroom 2 | bath + hall
      S([852, 120], [852, 336]),            // bath | primary
      S([708, 264], [852, 264]),            // bath | hall
      S([852, 336], [852, 588]),            // living | kitchen
      { tool: 'wall', pts: wobblyPoly([[600, 588], [960, 588], [960, 696], [600, 696]], r, A) }, // porch
    ];
    const labels = [
      { x: 290, y: 350, type: 'garage' }, { x: 600, y: 225, type: 'bedroom' }, { x: 780, y: 190, type: 'bathroom' },
      { x: 780, y: 300, type: 'hallway' }, { x: 980, y: 225, type: 'master-bedroom' }, { x: 670, y: 460, type: 'living' },
      { x: 980, y: 460, type: 'kitchen' }, { x: 780, y: 642, type: 'porch' },
    ];
    const marks = [
      { tool: 'window', pts: tick(600, 120, true, r) }, { tool: 'window', pts: tick(980, 120, true, r) },
      { tool: 'window', pts: tick(1104, 225, false, r) }, { tool: 'window', pts: tick(1104, 460, false, r) },
      { tool: 'window', pts: tick(540, 588, true, r) }, { tool: 'window', pts: tick(1030, 588, true, r) },
    ];
    return { strokes: [...strokes, ...marks], labels };
  },
  // Simple cottage (about 36' x 22'): kitchen + living, a bedroom, bath, laundry. Bedroom left unlabeled.
  cottage(seed = 11) {
    const r = rng(seed), A = 3;
    const S = (a, b) => ({ tool: 'wall', pts: wobblyLine(a, b, r, A) });
    return {
      strokes: [
        { tool: 'wall', pts: wobblyPoly([[276, 202], [924, 202], [924, 598], [276, 598]], r, A) },
        S([636, 202], [636, 598]),
        S([276, 382], [636, 382]),
        S([636, 382], [924, 382]),
        S([780, 382], [780, 598]),
        { tool: 'door', pts: tick(456, 598, true, r) },
      ],
      labels: [
        { x: 456, y: 290, type: 'kitchen' }, { x: 456, y: 490, type: 'living' },
        { x: 708, y: 490, type: 'bathroom' }, { x: 852, y: 490, type: 'laundry' },
      ],
    };
  },
  // L-shaped home (about 52' x 30') with a 45° corner on the bedroom wing.
  lshape(seed = 23) {
    const r = rng(seed), A = 3.2;
    const S = (a, b) => ({ tool: 'wall', pts: wobblyLine(a, b, r, A) });
    return {
      strokes: [
        { tool: 'wall', pts: wobblyPoly([[132, 130], [546, 130], [600, 184], [600, 400], [1068, 400], [1068, 670], [132, 670]], r, A) },
        S([132, 328], [600, 328]),            // bedrooms | hall
        S([384, 130], [384, 328]),            // bed 1 | bed 2
        S([132, 400], [600, 400]),            // hall | bath + living
        S([330, 400], [330, 670]),            // bath + laundry | living
        S([132, 526], [330, 526]),            // bath | laundry
        S([780, 400], [780, 670]),            // living | kitchen
        { tool: 'door', pts: tick(560, 670, true, r) },
      ],
      labels: [
        { x: 250, y: 230, type: 'bedroom' }, { x: 480, y: 230, type: 'master-bedroom' }, { x: 360, y: 364, type: 'hallway' },
        { x: 230, y: 462, type: 'bathroom' }, { x: 230, y: 600, type: 'laundry' }, { x: 560, y: 530, type: 'living' },
        { x: 920, y: 530, type: 'kitchen' },
      ],
    };
  },
};
