// PeakStead Designs — placeable staircases for Edit Plan (Add item → Stairs).
// Typologies after common references: straight, quarter-turn (L) with landing, half-turn (U / switchback)
// with landing, spiral on a centre pole, open curved/helical (floating curve with a solid outer stringer),
// and a bifurcated "grand" stair. Real proportions: ~7.5" rise (9" on the spiral), ~10.5" run, 39" wide.
// Item space: origin at footprint centre, y = finished floor, +z = front. Stairs start at the front edge
// and travel toward the back; dir 'down' descends into a basement well (the engine cuts the floor opening).
import * as THREE from 'three';

const MC = {};
const mat = (color, o = {}) => MC[color + JSON.stringify(o)] ||= new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.6, metalness: o.m ?? 0, transparent: !!o.t, opacity: o.t ?? 1, side: o.ds ? THREE.DoubleSide : THREE.FrontSide, depthWrite: o.t ? false : true });
const TREAD = { oak: '#c8995f', walnut: '#6b4630', 'white-risers': '#c8995f' };
function mats(rec) {
  const f = rec.stairFinish || 'oak', rail = rec.rail || 'black';
  return {
    tread: mat(TREAD[f] || TREAD.oak, { r: 0.55 }),
    riser: mat(f === 'white-risers' ? '#f2f0ea' : f === 'walnut' ? '#5a3a27' : '#b88a55', { r: 0.6 }),
    stringer: mat(f === 'white-risers' ? '#f2f0ea' : f === 'walnut' ? '#553724' : '#b0824f', { r: 0.62 }),
    metal: mat('#1c1c1c', { r: 0.4, m: 0.6 }),
    rail, railWood: mat(f === 'walnut' ? '#5a3a27' : '#a8784a', { r: 0.5 }),
    baluster: rail === 'wood' ? mat('#f2f0ea', { r: 0.55 }) : mat('#1c1c1c', { r: 0.4, m: 0.6 }),
    glass: mat('#cfe3ea', { r: 0.05, m: 0.1, t: 0.28, ds: true }),
    well: mat('#d8d2c6', { r: 0.9 }), basement: mat('#8d877d', { r: 0.95 }),
  };
}
function add(g, geo, m, x, y, z, ry = 0, rx = 0, rz = 0) {
  const ms = new THREE.Mesh(geo, m); ms.position.set(x, y, z); ms.rotation.set(rx, ry, rz, 'YXZ');
  ms.castShadow = ms.receiveShadow = true; g.add(ms); return ms;
}
const B = (w, h, d) => new THREE.BoxGeometry(Math.max(w, 0.01), Math.max(h, 0.01), Math.max(d, 0.01));
export const STAIR_RISE = 0.625, STAIR_RUN = 0.875, STAIR_W = 3.25, RAIL_H = 3.0;
function totals(rec, ctx) {
  const T = (rec.levelH || ((ctx?.ceiling || 9) + 1)); // finished floor to finished floor (ceiling + ~1' floor structure)
  const n = Math.max(4, Math.round(T / STAIR_RISE));
  return { T, n, r: T / n, s: rec.dir === 'down' ? -1 : 1 };
}
// one straight flight in a frame: starts at (x0, z0), travels along -z rotated by yaw, from height y0, k treads
function flight(g, M, { x0, z0, yaw = 0, y0, k, r, s, W = STAIR_W, run = STAIR_RUN, rails = [true, true], first = true }) {
  const f = new THREE.Group(); f.position.set(x0, 0, z0); f.rotation.y = yaw; g.add(f);
  const len = k * run, dy = k * r * s;
  for (let i = 0; i < k; i++) {
    const top = y0 + (i + 1) * r * s, z = -(i + 0.5) * run;
    add(f, B(W, 0.12, run + 0.08), M.tread, 0, top - 0.06, z + 0.04);              // tread with 1" nosing
    const rb = s > 0 ? top - r : top;                                            // riser fills the face below the nose
    add(f, B(W - 0.04, r - 0.1, 0.06), M.riser, 0, rb + (r - 0.1) / 2 - (s > 0 ? 0 : 0) + (s > 0 ? 0 : -0.02), -i * run + (s > 0 ? -0.03 : -run + 0.03));
  }
  // sloped stringers (closed) on both sides: tie every tread end together down to the start/landing
  const slope = Math.atan2(dy, len), L = Math.hypot(len, dy) + 0.6, sh = 0.95;
  for (const sx of [-1, 1]) add(f, B(0.14, sh, L), M.stringer, sx * (W / 2 + 0.07), y0 + dy / 2 - (sh / 2 - 0.15) * Math.cos(slope) * (s > 0 ? 1 : 1) , -len / 2, 0, slope);
  // railings
  for (const [si, sx] of [[0, -1], [1, 1]]) {
    if (!rails[si]) continue;
    const xr = sx * (W / 2 + 0.07);
    if (M.rail === 'glass') {
      for (let i = 0; i < k; i++) { const top = y0 + (i + 1) * r * s; add(f, B(0.04, RAIL_H - 0.2, run), M.glass, xr, top + (RAIL_H - 0.2) / 2 + 0.05, -(i + 0.5) * run); }
    } else {
      for (let i = 0; i < k; i++) for (const q of [0.25, 0.75]) {
        const top = y0 + (i + 1) * r * s, h = RAIL_H - 0.08 + (q - 0.5) * run * Math.tan(slope);
        add(f, B(0.06, h, 0.06), M.baluster, xr, top + h / 2, -(i + q) * run);
      }
    }
    for (const [zz, yy] of [[0, y0], [-len, y0 + dy]]) if (first || zz !== 0) add(f, B(0.3, RAIL_H + 0.25, 0.3), M.rail === 'wood' ? M.railWood : M.metal, xr, yy + (RAIL_H + 0.25) / 2, zz + (zz === 0 ? -0.15 : 0.15));
    add(f, B(M.rail === 'glass' ? 0.12 : 0.18, 0.12, L - 0.3), M.rail === 'black' ? M.metal : M.railWood, xr, y0 + dy / 2 + RAIL_H, -len / 2, 0, slope);
  }
  return { len, end: y0 + dy };
}
function landing(g, M, x, z, w, d, y, s, rails = []) {
  add(g, B(w, 0.5, d), M.tread, x, y - 0.25, z);
  add(g, B(w - 0.1, 0.06, d - 0.1), M.stringer, x, y - 0.53, z);
  // posts under a landing so it is carried to the floor (or the well floor)
  const H = Math.abs(y) - 0.5;
  if (H > 0.3) for (const [px, pz] of [[x - w / 2 + 0.2, z - d / 2 + 0.2], [x + w / 2 - 0.2, z - d / 2 + 0.2]]) add(g, B(0.35, H, 0.35), M.stringer, px, s > 0 ? H / 2 : y - 0.5 - H / 2 + 0 , pz);
  for (const [ax, az, bx, bz] of rails) {
    const L = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az);
    add(g, B(0.16, 0.12, L), M.rail === 'black' ? M.metal : M.railWood, (ax + bx) / 2, y + RAIL_H, (az + bz) / 2, yaw);
    if (M.rail === 'glass') add(g, B(0.04, RAIL_H - 0.2, L), M.glass, (ax + bx) / 2, y + RAIL_H / 2, (az + bz) / 2, yaw);
    else for (let t = 0.2; t < L; t += 0.45) add(g, B(0.06, RAIL_H, 0.06), M.baluster, ax + (bx - ax) * t / L, y + RAIL_H / 2, az + (bz - az) * t / L);
  }
}
// floor well for stairs going down (liner walls + basement floor) and a guard rail on the open edges
function well(g, M, w, d, T, s, ctx) {
  if (s > 0) return;
  for (const [x, z, ww, dd] of [[0, -d / 2, w, 0.1], [-w / 2, 0, 0.1, d], [w / 2, 0, 0.1, d], [0, d / 2, w, 0.1]]) add(g, B(ww, T, dd), M.well, x, -T / 2 - 0.02, z);
  add(g, B(w, 0.1, d), M.basement, 0, -T - 0.05, 0);
  const gr = (ax, az, bx, bz) => {
    const L = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az);
    add(g, B(0.16, 0.12, L), M.rail === 'black' ? M.metal : M.railWood, (ax + bx) / 2, RAIL_H, (az + bz) / 2, yaw);
    if (M.rail === 'glass') add(g, B(0.04, RAIL_H - 0.15, L), M.glass, (ax + bx) / 2, RAIL_H / 2, (az + bz) / 2, yaw);
    else for (let t = 0; t <= L + 1e-6; t += 0.45) add(g, B(0.06, RAIL_H, 0.06), M.baluster, ax + (bx - ax) * Math.min(1, t / L), RAIL_H / 2, az + (bz - az) * Math.min(1, t / L));
  };
  gr(-w / 2, d / 2 - STAIR_RUN, -w / 2, -d / 2); gr(-w / 2, -d / 2, w / 2, -d / 2); gr(w / 2, -d / 2, w / 2, d / 2 - STAIR_RUN);
  void ctx;
}
function buildStraight(g, rec, ctx) {
  const M = mats(rec), { T, n, r, s } = totals(rec, ctx);
  const W = rec.w || STAIR_W + 0.3, d = rec.d || n * STAIR_RUN;
  // going up: the flight fits the footprint; going down: true 10.5" runs, the lower treads run on under the floor
  const run = s > 0 ? Math.max(0.6, d / n) : STAIR_RUN;
  flight(g, M, { x0: 0, z0: d / 2, y0: 0, k: n, r, s, W: W - 0.3, run });
  well(g, M, W, d, T, s, ctx);
}
function buildL(g, rec, ctx) {
  const M = mats(rec), { T, n, r, s } = totals(rec, ctx);
  const W = STAIR_W, w = rec.w, d = rec.d;
  const n1 = Math.round((d - W - 0.3) / STAIR_RUN), n2 = Math.max(2, n - n1 - 1);
  const run2 = (w - W - 0.3) / n2;
  const xR = w / 2 - W / 2 - 0.15;
  const f1 = flight(g, M, { x0: xR, z0: d / 2, y0: 0, k: n1, r, s, W, rails: [false, true] });
  const yL = f1.end + r * s, zL = d / 2 - f1.len - (W + 0.3) / 2;
  landing(g, M, xR, zL, W + 0.3, W + 0.3, yL, s, [[xR + W / 2 + 0.1, zL + W / 2, xR + W / 2 + 0.1, zL - W / 2 - 0.1], [xR + W / 2 + 0.1, zL - W / 2 - 0.1, xR - W / 2, zL - W / 2 - 0.1]]);
  flight(g, M, { x0: xR - (W + 0.3) / 2, z0: zL, yaw: -Math.PI / 2, y0: yL, k: n2, r, s, W, run: run2, rails: [true, true], first: false });
  well(g, M, w, d, T, s, ctx);
}
function buildU(g, rec, ctx) {
  const M = mats(rec), { T, n, r, s } = totals(rec, ctx);
  const W = STAIR_W, w = rec.w, d = rec.d;
  const n1 = Math.ceil((n - 1) / 2), n2 = Math.max(2, n - 1 - n1);
  const run = (d - W - 0.3) / n1;
  const xR = w / 2 - W / 2 - 0.15, xL = -w / 2 + W / 2 + 0.15;
  const f1 = flight(g, M, { x0: xR, z0: d / 2, y0: 0, k: n1, r, s, W, run, rails: [false, true] });
  const yL = f1.end + r * s, zL = -d / 2 + (W + 0.3) / 2;
  landing(g, M, 0, zL, w, W + 0.3, yL, s, [[w / 2, zL + W / 2 + 0.15, w / 2, -d / 2], [w / 2, -d / 2, -w / 2, -d / 2], [-w / 2, -d / 2, -w / 2, zL + W / 2 + 0.15]]);
  flight(g, M, { x0: xL, z0: zL + (W + 0.3) / 2, yaw: Math.PI, y0: yL, k: n2, r, s, W, run, rails: [false, true], first: false });
  // centre wall between the flights (open-well U uses a newel + rail instead)
  add(g, B(w - 2 * W - 0.3 > 0.2 ? w - 2 * W - 0.3 : 0.25, Math.abs(yL) + 0.2, d - W - 0.3), M.stringer, 0, s > 0 ? (yL + 0.2) / 2 : yL / 2, zL + (W + 0.3) / 2 + (d - W - 0.3) / 2);
  well(g, M, w, d, T, s, ctx);
}
function buildBifurcated(g, rec, ctx) {
  const M = mats(rec), { T, n, r, s } = totals(rec, ctx);
  const w = rec.w, d = rec.d, Wc = 4.6, Ws = 3.4;
  const n1 = Math.ceil((n - 1) / 2), n2 = Math.max(2, n - 1 - n1);
  const run = (d - 4.2) / n1;
  const f1 = flight(g, M, { x0: 0, z0: d / 2, y0: 0, k: n1, r, s, W: Wc, run });
  const yL = f1.end + r * s, zL = -d / 2 + 2.1;
  landing(g, M, 0, zL, w, 4.2, yL, s, [[-w / 2, -d / 2, w / 2, -d / 2]]);
  for (const sx of [-1, 1]) flight(g, M, { x0: sx * (w / 2 - Ws / 2 - 0.1), z0: zL + 2.1, yaw: Math.PI, y0: yL, k: n2, r, s, W: Ws, run, rails: sx < 0 ? [false, true] : [true, false], first: false });
  well(g, M, w, d, T, s, ctx);
}
function sectorGeo(r0, r1, a0, a1, h) {
  const sh = new THREE.Shape(), seg = 10;
  for (let i = 0; i <= seg; i++) { const a = a0 + (a1 - a0) * i / seg; const p = [Math.cos(a) * r1, Math.sin(a) * r1]; i ? sh.lineTo(...p) : sh.moveTo(...p); }
  for (let i = seg; i >= 0; i--) { const a = a0 + (a1 - a0) * i / seg; sh.lineTo(Math.cos(a) * r0, Math.sin(a) * r0); }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 8 });
  geo.rotateX(-Math.PI / 2); // extrude upward (+y), shape in x/z
  return geo;
}
function helixRail(g, m, R, a0, a1, y0, y1, thick = 0.07, off = 0) {
  const pts = [];
  for (let i = 0; i <= 48; i++) { const t = i / 48, a = a0 + (a1 - a0) * t; pts.push(new THREE.Vector3(Math.cos(a) * R, y0 + (y1 - y0) * t + off, -Math.sin(a) * R)); }
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, thick, 8, false), m);
  tube.castShadow = true; g.add(tube); return tube;
}
function buildSpiral(g, rec, ctx) {
  const M = mats(rec), { T, s } = totals(rec, ctx);
  const R = Math.min(rec.w, rec.d) / 2 - 0.05, n = Math.max(8, Math.round(T / 0.75)), r = T / n, step = (2 * Math.PI * 0.85) / n;
  const a0 = -Math.PI / 2; // first tread points to the front
  add(g, new THREE.CylinderGeometry(0.15, 0.15, T + RAIL_H, 16), M.metal, 0, s > 0 ? (T + RAIL_H) / 2 : -T / 2 + RAIL_H / 2, 0);
  for (let i = 0; i < n; i++) {
    const top = (i + 1) * r * s, a = a0 + i * step;
    const geo = sectorGeo(0.12, R, a, a + step * 1.08, 0.12);
    add(g, geo, M.tread, 0, top - 0.12, 0);
    const bx = Math.cos(a + step * 0.5) * (R - 0.08), bz = -Math.sin(a + step * 0.5) * (R - 0.08);
    add(g, B(0.05, RAIL_H, 0.05), M.baluster, bx, top + RAIL_H / 2, bz);
  }
  helixRail(g, M.rail === 'black' ? M.metal : M.railWood, R - 0.08, a0, a0 + (n - 1) * step + step * 0.5, r * s + RAIL_H, n * r * s + RAIL_H);
  // top landing (quarter disc) so the stair arrives somewhere
  if (s > 0) add(g, sectorGeo(0.12, R, a0 + n * step - 0.05, a0 + n * step + Math.PI / 2, 0.3), M.tread, 0, T - 0.3, 0);
  well(g, M, rec.w, rec.d, T, s, ctx);
}
function buildCurved(g, rec, ctx) {
  // open curved / helical stair with a solid outer stringer (floating treads cantilever from it), no centre pole
  const M = mats(rec), { T, n, r, s } = totals(rec, ctx);
  const Ro = Math.min(rec.w, rec.d * 2) / 2 - 0.1, Ri = Math.max(1.2, Ro - 3.6), sweep = Math.PI * 1.05, step = sweep / n;
  const cx = 0, cz = rec.d / 2 - Ro - 0.05;
  const sub = new THREE.Group(); sub.position.set(cx, 0, cz); g.add(sub);
  const a0 = -Math.PI / 2;
  for (let i = 0; i < n; i++) {
    const top = (i + 1) * r * s, a = a0 - i * step;
    add(sub, sectorGeo(Ri, Ro + 0.05, a - step * 1.06, a, 0.16), M.tread, 0, top - 0.16, 0);
  }
  // outer + inner curved stringers: ribbons following the helix (solid band 1' deep under the treads)
  for (const [R, th] of [[Ro + 0.12, 0.12], [Ri - 0.06, 0.08]]) {
    const pos = [], idx = [], N = 60;
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = a0 - t * sweep, y = t * T * s;
      const x = Math.cos(a) * R, z = -Math.sin(a) * R;
      pos.push(x, y + 0.1, z, x, y - 0.95, z);
      if (i) { const b = (i - 1) * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, R > Ro ? (rec.stairFinish === 'white-risers' ? M.riser : M.stringer) : M.stringer);
    m.material = m.material.clone(); m.material.side = THREE.DoubleSide; m.castShadow = true; sub.add(m);
    void th;
  }
  // balusters on the outer edge + a continuous helical handrail
  for (let i = 0; i < n; i++) { const a = a0 - (i + 0.5) * step, top = (i + 1) * r * s; add(sub, B(0.05, RAIL_H, 0.05), M.baluster, Math.cos(a) * (Ro - 0.02), top + RAIL_H / 2, -Math.sin(a) * (Ro - 0.02)); }
  if (M.rail === 'glass') for (let i = 0; i < n; i++) { const a = a0 - (i + 0.5) * step, top = (i + 1) * r * s; add(sub, B(0.03, RAIL_H - 0.2, step * Ro), M.glass, Math.cos(a) * Ro, top + RAIL_H / 2, -Math.sin(a) * Ro, a); }
  helixRail(sub, M.rail === 'black' ? M.metal : M.railWood, Ro - 0.02, a0, a0 - sweep, r * s + RAIL_H, T * s + RAIL_H, 0.08);
  well(g, M, rec.w, rec.d, T, s, ctx);
}
const S = (name, build, w, d, extra = {}) => ({
  name, category: 'stairs', w, d, h: 10, stair: true, variants: ['oak', 'walnut', 'white-risers'], rails: ['black', 'wood', 'glass'], noAuto: true, ...extra,
  build: (g, rec, ctx) => build(g, { ...rec, w: rec.w || w, d: rec.d || d, stairFinish: rec.stairFinish || rec.variant || 'oak' }, ctx),
});
function buildLadder(g, rec, ctx) {
  const M = mats(rec);
  const w = rec.w || 1.8, d = rec.d || 1.85;
  const T = Math.max(4, rec.levelH || ((ctx?.ceiling || 9) * 0.8));
  const rail = rec.rail === 'wood' ? M.railWood : M.metal;
  const rw = 0.12;
  const xL = -w / 2 + rw, xR = w / 2 - rw, zF = -d / 2 + rw, zB = d / 2 - rw;
  add(g, B(rw, T, rw), rail, xL, T / 2, zF);
  add(g, B(rw, T, rw), rail, xL, T / 2, zB);
  add(g, B(rw, T, rw), rail, xR, T / 2, zF);
  add(g, B(rw, T, rw), rail, xR, T / 2, zB);
  const n = Math.max(5, Math.round(T / 0.95));
  for (let i = 0; i < n; i++) {
    const y = (i + 0.4) * (T / n);
    add(g, B(w - 0.2, 0.1, d - 0.28), rail, 0, y, 0);
  }
}
export const STAIR_CATEGORIES = [{ id: 'stairs', name: 'Stairs' }];
export const STAIR_CATALOG = {
  stairStraight: S('Straight stair', buildStraight, 3.55, 14.0),
  stairL: S('L-shaped (quarter-turn, landing)', buildL, 9.4, 10.6),
  stairU: S('U-shaped switchback (half-turn, landing)', buildU, 7.3, 10.0),
  stairSpiral: S('Spiral (centre pole) 5′', buildSpiral, 5.2, 5.2, { rails: ['black', 'wood'] }),
  stairCurved: S('Curved / helical (open, floating)', buildCurved, 10.5, 9.0),
  stairBifurcated: S('Bifurcated grand stair', buildBifurcated, 12.4, 12.6),
  stairLadder: S('Loft ladder', buildLadder, 1.8, 1.85, { h: 8, rails: ['black', 'wood'] }),
};
export const isStairType = (t) => !!STAIR_CATALOG[t];
