// PeakStead Designs — placeable sheds & outbuildings (Edit Plan → Add item → Outbuildings).
// Five popular backyard designs (enclosed + open), each with 3 common sizes and body / trim / roof colours
// ('match house' by default). Everything sits on real supports: skids on concrete blocks (sheds) or posts on
// concrete footings (woodshed, pole shelter); roofs ride on rafters. Enclosed sheds have doors that swing open
// in walk-through (engine: userData.itemDoor pivots, respects Auto-open doors).
// Item space: origin at footprint centre, y = grade, +z = front (door side).
import * as THREE from 'three';

const MC = {};
const mat = (c, r = 0.8, m = 0) => MC[c + r + m] ||= new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const B = (w, h, d) => new THREE.BoxGeometry(Math.max(w, 0.02), Math.max(h, 0.02), Math.max(d, 0.02));
function add(g, geo, m, x, y, z, rx = 0, ry = 0, rz = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
const bx = (g, m, x0, y0, z0, x1, y1, z1) => add(g, B(x1 - x0, y1 - y0, z1 - z0), m, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
// sloped plank from (x0,y0) to (x1,y1) in the x/y plane, depth d along z, centred at z
function slab(g, m, x0, y0, x1, y1, t, d, z = 0) { const L = Math.hypot(x1 - x0, y1 - y0); return add(g, B(L, t, d), m, (x0 + x1) / 2, (y0 + y1) / 2, z, 0, 0, Math.atan2(y1 - y0, x1 - x0)); }
function prism(g, m, pts, z0, z1) { // extrude an x/y polygon between z0..z1 (gable / gambrel end walls)
  const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(sh, { depth: z1 - z0, bevelEnabled: false }); geo.translate(0, 0, z0);
  const o = new THREE.Mesh(geo, m); o.castShadow = o.receiveShadow = true; g.add(o); return o;
}
export const OB_BODY = [['match', 'Match house'], ['#f2f0ea', 'White'], ['#8b2e24', 'Barn red'], ['#8f9a80', 'Sage'], ['#8a8d8f', 'Gray'], ['#3a3c3f', 'Charcoal'], ['#c9b28f', 'Tan'], ['#9a7450', 'Natural cedar']];
export const OB_TRIM = [['match', 'Match house'], ['#f4f2ec', 'White'], ['#1d1e20', 'Black'], ['#9a7450', 'Natural wood']];
export const OB_ROOF = [['match', 'Match house'], ['#1f2022', 'Black'], ['#45474a', 'Charcoal shingle'], ['#7b2a22', 'Red metal'], ['#b9bcbe', 'Galvalume'], ['#3f5240', 'Forest green']];
function colors(rec, ctx) {
  const h = ctx?.house || {};
  const pick = (v, dflt) => (v && v !== 'match') ? v : dflt;
  const body = pick(rec.body, h.ext || '#e9e5dc'), trim = pick(rec.trim, h.trim || '#f4f2ec'), roof = pick(rec.roofColor, h.roof || '#2b2c2e');
  return { body: mat(body, 0.85), bat: mat(new THREE.Color(body).multiplyScalar(0.92).getStyle(), 0.85), trim: mat(trim, 0.7), roof: mat(roof, 0.55, h.metal ? 0.3 : 0.05),
    wood: mat('#9a7450', 0.85), lumber: mat('#b7925f', 0.85), conc: mat('#a7a39b', 0.95), glass: new THREE.MeshStandardMaterial({ color: '#9fb7c4', roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.45 }),
    hw: mat('#1c1c1c', 0.45, 0.6), gravel: mat('#9c968c', 1), log: mat('#8a6a48', 0.9), logEnd: mat('#d8b98a', 0.9) };
}
// skids on concrete blocks + plywood floor deck (enclosed sheds)
function base(g, C, W, D) {
  for (const x of [-W / 2 + 0.35, 0, W / 2 - 0.35]) {
    for (const z of [-D / 2 + 0.6, 0, D / 2 - 0.6]) bx(g, C.conc, x - 0.33, 0, z - 0.66, x + 0.33, 0.33, z + 0.66);
    bx(g, C.lumber, x - 0.15, 0.33, -D / 2, x + 0.15, 0.66, D / 2);
  }
  bx(g, C.lumber, -W / 2, 0.66, -D / 2, W / 2, 1.0, D / 2);
  return 1.0;
}
// board-and-batten wall panel between x0..x1 at face z (front/back) or along z at face x (sides)
function wallZ(g, C, x0, x1, y0, y1, z, t = 0.3) { bx(g, C.body, x0, y0, z - t / 2, x1, y1, z + t / 2); for (let x = x0 + 0.5; x < x1 - 0.2; x += 1) bx(g, C.bat, x - 0.05, y0, z + (z > 0 ? t / 2 : -t / 2) - 0.02, x + 0.05, y1, z + (z > 0 ? t / 2 + 0.03 : -t / 2 + 0.02)); }
function wallX(g, C, z0, z1, y0, y1, x, t = 0.3) { bx(g, C.body, x - t / 2, y0, z0, x + t / 2, y1, z1); for (let z = z0 + 0.5; z < z1 - 0.2; z += 1) bx(g, C.bat, x + (x > 0 ? t / 2 - 0.02 : -t / 2 - 0.03), y0, z - 0.05, x + (x > 0 ? t / 2 + 0.03 : -t / 2 + 0.02), y1, z + 0.05); }
function corners(g, C, W, D, y0, y1) { for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, C.trim, sx * W / 2 - 0.22 * (sx > 0 ? 1 : 0) - (sx < 0 ? 0.02 : -0.02), y0, sz * D / 2 - (sz > 0 ? 0.2 : 0) - 0.02, sx * W / 2 + (sx < 0 ? 0.22 : 0) + (sx > 0 ? 0.02 : -0.02) - (sx < 0 ? 0 : 0), y1, sz * D / 2 + (sz < 0 ? 0.2 : 0) + 0.02); }
// a hinged door leaf (pivot on its hinge edge) — engine swings these in walk-through
function door(g, C, xh, y0, z, w, h, side, opts = {}) {
  const piv = new THREE.Group(); piv.position.set(xh, y0, z); g.add(piv);
  const s = side; // +1: leaf extends toward +x from the hinge, -1 toward -x
  const leaf = new THREE.Group(); piv.add(leaf);
  bx(leaf, opts.glass ? C.trim : C.body, s > 0 ? 0 : -w, 0, -0.06, s > 0 ? w : 0, h, 0.06);
  if (opts.glass) bx(leaf, C.glass, (s > 0 ? 0.25 : -w + 0.25), 0.9, 0.07, (s > 0 ? w - 0.25 : -0.25), h - 0.3, 0.09);
  else {
    for (const [y0b, y1b] of [[0, 0.35], [h - 0.35, h], [h / 2 - 0.18, h / 2 + 0.18]]) bx(leaf, C.trim, s > 0 ? 0 : -w, y0b, 0.06, s > 0 ? w : 0, y1b, 0.12);
    for (const [a, b] of [[0, 1], [1, 0]]) { const xa = s > 0 ? 0.15 : -w + 0.15, xb = s > 0 ? w - 0.15 : -0.15; slab(leaf, C.trim, a ? xa : xb, 0.35, a ? xb : xa, h / 2 - 0.18, 0.2, 0.05, 0.09); slab(leaf, C.trim, a ? xa : xb, h / 2 + 0.18, a ? xb : xa, h - 0.35, 0.2, 0.05, 0.09); }
  }
  bx(leaf, C.hw, s > 0 ? w - 0.35 : -w + 0.3, h * 0.48, 0.1, s > 0 ? w - 0.3 : -w + 0.35, h * 0.55, 0.18);
  piv.userData.itemDoor = { sign: -s, max: THREE.MathUtils.degToRad(opts.max || 100) };
  return piv;
}
function windowZ(g, C, x, y, z, w, h) { bx(g, C.trim, x - w / 2 - 0.2, y - 0.2, z - 0.05, x + w / 2 + 0.2, y + h + 0.2, z + 0.05); bx(g, C.glass, x - w / 2, y, z + 0.04, x + w / 2, y + h, z + 0.07); bx(g, C.trim, x - 0.04, y, z + 0.06, x + 0.04, y + h, z + 0.1); }
function windowX(g, C, x, y, z, w, h) { bx(g, C.trim, x - 0.05, y - 0.2, z - w / 2 - 0.2, x + 0.05, y + h + 0.2, z + w / 2 + 0.2); bx(g, C.glass, x + (x > 0 ? 0.04 : -0.07), y, z - w / 2, x + (x > 0 ? 0.07 : -0.04), y + h, z + w / 2); }

// (1) classic gable garden shed: ridge front-to-back, 6/12 pitch, double doors + side window
function buildGable(g, rec, ctx) {
  const C = colors(rec, ctx), W = rec.w, D = rec.d, f = base(g, C, W, D), wh = f + 7, rise = (W / 2) * 0.5, oh = 0.6;
  const dw = Math.min(6, W - 3);
  wallZ(g, C, -W / 2, -dw / 2, f, wh, D / 2 - 0.15); wallZ(g, C, dw / 2, W / 2, f, wh, D / 2 - 0.15); wallZ(g, C, -dw / 2, dw / 2, f + 6.5, wh, D / 2 - 0.15);
  wallZ(g, C, -W / 2, W / 2, f, wh, -D / 2 + 0.15);
  wallX(g, C, -D / 2, D / 2, f, wh, -W / 2 + 0.15); wallX(g, C, -D / 2, D / 2, f, wh, W / 2 - 0.15);
  for (const z of [D / 2 - 0.3, -D / 2]) prism(g, C.body, [[-W / 2, wh], [W / 2, wh], [0, wh + rise]], z, z + 0.3);
  corners(g, C, W, D, f, wh);
  bx(g, C.trim, -dw / 2 - 0.25, f, D / 2 - 0.02, -dw / 2, f + 6.75, D / 2 + 0.08); bx(g, C.trim, dw / 2, f, D / 2 - 0.02, dw / 2 + 0.25, f + 6.75, D / 2 + 0.08); bx(g, C.trim, -dw / 2 - 0.25, f + 6.5, D / 2 - 0.02, dw / 2 + 0.25, f + 6.75, D / 2 + 0.08);
  door(g, C, -dw / 2, f, D / 2 + 0.02, dw / 2, 6.5, 1); door(g, C, dw / 2, f, D / 2 + 0.02, dw / 2, 6.5, -1);
  windowX(g, C, W / 2 + 0.02, f + 3.2, 0, 2.2, 2.4); windowZ(g, C, 0, wh + rise * 0.25, D / 2 + 0.02, 1.4, 1.0);
  // rafters + sheathing + fascia
  const n = Math.max(3, Math.round(D / 2) + 1);
  for (let i = 0; i < n; i++) { const z = -D / 2 + 0.1 + (i * (D - 0.2)) / (n - 1); for (const s of [-1, 1]) slab(g, C.lumber, s * (W / 2 + oh), wh - oh * 0.5, 0, wh + rise, 0.45, 0.15, z); }
  bx(g, C.lumber, -0.08, wh + rise - 0.35, -D / 2 - oh, 0.08, wh + rise + 0.05, D / 2 + oh);
  for (const s of [-1, 1]) { slab(g, C.roof, s * (W / 2 + oh + 0.05), wh - oh * 0.5 + 0.22, 0, wh + rise + 0.25, 0.12, D + oh * 2); slab(g, C.trim, s * (W / 2 + oh + 0.05), wh - oh * 0.5 - 0.05, s * (W / 2 + oh + 0.06), wh - oh * 0.5 + 0.35, 0.12, D + oh * 2); }
  for (const z of [D / 2 + oh, -D / 2 - oh]) for (const s of [-1, 1]) slab(g, C.trim, s * (W / 2 + oh), wh - oh * 0.5 + 0.05, 0, wh + rise + 0.1, 0.35, 0.1, z);
  bx(g, C.lumber, -dw / 2, 0.33, D / 2, dw / 2, 1.0, D / 2 + 1.6); // ramp-ish step at the doors
}
// (2) gambrel barn with a storage loft
function buildGambrel(g, rec, ctx) {
  const C = colors(rec, ctx), W = rec.w, D = rec.d, f = base(g, C, W, D), wh = f + 6.3, oh = 0.5;
  const P = [[-W / 2, wh], [-W / 2 + W * 0.18, wh + W * 0.3], [0, wh + W * 0.42], [W / 2 - W * 0.18, wh + W * 0.3], [W / 2, wh]];
  const dw = Math.min(6, W - 3);
  wallZ(g, C, -W / 2, -dw / 2, f, wh, D / 2 - 0.15); wallZ(g, C, dw / 2, W / 2, f, wh, D / 2 - 0.15); wallZ(g, C, -dw / 2, dw / 2, f + 6.2, wh, D / 2 - 0.15);
  wallZ(g, C, -W / 2, W / 2, f, wh, -D / 2 + 0.15);
  wallX(g, C, -D / 2, D / 2, f, wh, -W / 2 + 0.15); wallX(g, C, -D / 2, D / 2, f, wh, W / 2 - 0.15);
  for (const z of [D / 2 - 0.3, -D / 2]) prism(g, C.body, P, z, z + 0.3);
  corners(g, C, W, D, f, wh);
  door(g, C, -dw / 2, f, D / 2 + 0.02, dw / 2, 6.2, 1); door(g, C, dw / 2, f, D / 2 + 0.02, dw / 2, 6.2, -1);
  bx(g, C.trim, -dw / 2 - 0.25, f + 6.2, D / 2 - 0.02, dw / 2 + 0.25, f + 6.45, D / 2 + 0.08);
  windowZ(g, C, 0, wh + W * 0.12, D / 2 + 0.02, 2.0, 1.6); // loft window
  bx(g, C.lumber, -W / 2 + 0.3, wh - 0.1, -D / 2 + 0.3, W / 2 - 0.3, wh + 0.15, -D / 2 + D * 0.45); // loft deck
  const n = Math.max(3, Math.round(D / 2) + 1), ext = (a, b, k) => [a[0] + (a[0] - b[0]) * k, a[1] + (a[1] - b[1]) * k];
  for (let i = 0; i < n; i++) { const z = -D / 2 + 0.1 + (i * (D - 0.2)) / (n - 1); for (let s = 0; s < 4; s++) slab(g, C.lumber, ...(s === 0 ? ext(P[0], P[1], 0.12) : P[s]), ...P[s + 1], 0.4, 0.15, z); }
  for (let s = 0; s < 4; s++) { const a = s === 0 ? ext(P[0], P[1], 0.14) : P[s], b = s === 3 ? ext(P[4], P[3], 0.14) : P[s + 1]; const nx = -(b[1] - a[1]), ny = b[0] - a[0], L = Math.hypot(nx, ny); slab(g, C.roof, a[0] + nx / L * 0.25, a[1] + ny / L * 0.25, b[0] + nx / L * 0.25, b[1] + ny / L * 0.25, 0.12, D + oh * 2); }
  for (const z of [D / 2 + oh, -D / 2 - oh]) for (let s = 0; s < 4; s++) slab(g, C.trim, ...P[s], ...P[s + 1], 0.3, 0.1, z);
}
// (3) modern lean-to studio: single slope (high front), clerestory band, glass door, vertical siding
function buildStudio(g, rec, ctx) {
  const C = colors(rec, ctx), W = rec.w, D = rec.d, f = base(g, C, W, D), hf = f + 9.5, hb = f + 7.5, oh = 0.9;
  const dw = 3, dx = W / 2 - 2.6;
  // front: solid below 6.8', clerestory glass band above
  wallZ(g, C, -W / 2, dx - dw / 2, f, f + 6.9, D / 2 - 0.15); wallZ(g, C, dx + dw / 2, W / 2, f, f + 6.9, D / 2 - 0.15);
  bx(g, C.trim, -W / 2, f + 6.9, D / 2 - 0.25, W / 2, f + 7.15, D / 2 - 0.05);
  bx(g, C.glass, -W / 2 + 0.2, f + 7.15, D / 2 - 0.18, W / 2 - 0.2, hf - 0.2, D / 2 - 0.12);
  for (let x = -W / 2; x <= W / 2 + 0.01; x += W / Math.max(2, Math.round(W / 3))) bx(g, C.trim, x - 0.08, f + 7.15, D / 2 - 0.25, x + 0.08, hf, D / 2 - 0.05);
  bx(g, C.trim, -W / 2, hf - 0.2, D / 2 - 0.25, W / 2, hf, D / 2 - 0.05);
  wallZ(g, C, -W / 2, W / 2, f, hb, -D / 2 + 0.15);
  for (const x of [-W / 2 + 0.15, W / 2 - 0.15]) {
    wallX(g, C, -D / 2, D / 2, f, hb, x);
    // raked upper side wall: shape in (plan z, y), extruded across the wall thickness
    const tri = new THREE.Shape([new THREE.Vector2(-D / 2, hb), new THREE.Vector2(D / 2 - 0.3, hb), new THREE.Vector2(D / 2 - 0.3, hb + (hf - hb) * (D - 0.3) / D), new THREE.Vector2(-D / 2, hb)]);
    const geo = new THREE.ExtrudeGeometry(tri, { depth: 0.3, bevelEnabled: false }); geo.rotateY(-Math.PI / 2);
    const m = new THREE.Mesh(geo, C.body); m.position.set(x + 0.15, 0, 0); m.castShadow = m.receiveShadow = true; g.add(m);
  }
  corners(g, C, W, D, f, hb);
  door(g, C, dx - dw / 2, f, D / 2 + 0.02, dw, 6.8, 1, { glass: true });
  windowX(g, C, -W / 2 - 0.02, f + 3, 0, 3, 2.6);
  const slope = (hf - hb) / D;
  for (let x = -W / 2 + 0.1; x <= W / 2 - 0.05; x += (W - 0.2) / Math.max(3, Math.round(W / 2))) { const m = add(g, B(0.15, 0.5, D + oh * 2), C.lumber, x, (hf + hb) / 2 + 0.05, 0, Math.atan(slope), 0, 0); m.rotation.x = -Math.atan(slope); }
  const r = add(g, B(W + oh * 2, 0.14, Math.hypot(D + oh * 2, (hf - hb) + slope * oh * 2)), C.roof, 0, (hf + hb) / 2 + 0.38, 0); r.rotation.x = -Math.atan(slope);
  const fa = add(g, B(W + oh * 2 + 0.05, 0.55, 0.12), C.trim, 0, hf + slope * oh + 0.3, D / 2 + oh); void fa;
  bx(g, C.wood, dx - 2, 0.33, D / 2, dx + 2, 1.0, D / 2 + 3); // small deck at the door
}
// (4) open-front woodshed: lean-to on 4x4 posts + footings, slatted back/sides, stacked firewood
function buildWoodshed(g, rec, ctx) {
  const C = colors(rec, ctx), W = rec.w, D = rec.d, hf = 7.2, hb = 5.6, oh = 0.7;
  const posts = [];
  const nx = Math.max(2, Math.round(W / 6) + 1);
  for (let i = 0; i < nx; i++) { const x = -W / 2 + 0.25 + (i * (W - 0.5)) / (nx - 1); posts.push([x, D / 2 - 0.25, hf], [x, -D / 2 + 0.25, hb]); }
  for (const [x, z, h] of posts) { add(g, new THREE.CylinderGeometry(0.42, 0.42, 0.5, 14), C.conc, x, 0.25, z); bx(g, C.wood, x - 0.18, 0.5, z - 0.18, x + 0.18, h, z + 0.18); }
  // floor runners (keep wood off the ground) + pallet deck
  for (const x of [-W / 2 + 0.4, 0, W / 2 - 0.4]) bx(g, C.lumber, x - 0.15, 0, -D / 2 + 0.25, x + 0.15, 0.5, D / 2 - 0.25);
  for (let z = -D / 2 + 0.4; z < D / 2 - 0.2; z += 0.55) bx(g, C.lumber, -W / 2 + 0.25, 0.5, z - 0.2, W / 2 - 0.25, 0.62, z + 0.2);
  // headers + slatted back & sides (gaps for airflow)
  bx(g, C.wood, -W / 2, hf - 0.6, D / 2 - 0.45, W / 2, hf, D / 2 - 0.05); bx(g, C.wood, -W / 2, hb - 0.6, -D / 2 + 0.05, W / 2, hb, -D / 2 + 0.45);
  for (let y = 0.8; y < hb - 0.7; y += 0.55) bx(g, C.body, -W / 2 + 0.05, y, -D / 2 + 0.03, W / 2 - 0.05, y + 0.35, -D / 2 + 0.1);
  for (const sx of [-1, 1]) for (let y = 0.8; y < hb - 0.4; y += 0.55) bx(g, C.body, sx * (W / 2 - 0.08) - 0.04, y, -D / 2 + 0.25, sx * (W / 2 - 0.08) + 0.04, y + 0.35, D / 2 - 0.25);
  // rafters + roof
  const slope = (hf - hb) / (D - 0.5);
  const nr = Math.max(3, Math.round(W / 2) + 1);
  for (let i = 0; i < nr; i++) { const x = -W / 2 + 0.1 + (i * (W - 0.2)) / (nr - 1); const m = add(g, B(0.15, 0.45, D + oh * 2), C.lumber, x, (hf + hb) / 2 + 0.2, 0); m.rotation.x = -Math.atan(slope); }
  const r = add(g, B(W + oh * 2, 0.12, Math.hypot(D + oh * 2, (D + oh * 2) * slope)), C.roof, 0, (hf + hb) / 2 + 0.5, 0); r.rotation.x = -Math.atan(slope);
  // firewood: split logs stacked in rows (ends showing at the open front)
  const lg = new THREE.CylinderGeometry(0.22, 0.24, 1.4, 7);
  const rows = Math.max(1, Math.floor((D - 1.4) / 1.5));
  for (let rI = 0; rI < rows; rI++) {
    const z = -D / 2 + 0.95 + rI * 1.5;
    for (let y = 0; y < 8; y++) for (let x = -W / 2 + 0.6; x < W / 2 - 0.5; x += 0.47) {
      if (y > 6 - ((x * 7 + rI) % 2)) continue;
      const m = add(g, lg, C.log, x + (y % 2) * 0.22, 0.86 + y * 0.42, z, Math.PI / 2, 0, 0); m.castShadow = false;
      if (rI === rows - 1) add(g, new THREE.CircleGeometry(0.21, 7), C.logEnd, x + (y % 2) * 0.22, 0.86 + y * 0.42, z + 0.71);
    }
  }
}
// (5) open pole-barn lean-to equipment shelter: 6x6 posts on footings, girts/purlins, metal roof, gravel pad
function buildPole(g, rec, ctx) {
  const C = colors(rec, ctx), W = rec.w, D = rec.d, hf = 11, hb = 9, oh = 1;
  bx(g, C.gravel, -W / 2 - 1, 0, -D / 2 - 1, W / 2 + 1, 0.12, D / 2 + 1);
  const nx = Math.max(2, Math.round(W / 10) + 1);
  const xs = [...Array(nx)].map((_, i) => -W / 2 + 0.3 + (i * (W - 0.6)) / (nx - 1));
  for (const x of xs) for (const [z, h] of [[D / 2 - 0.3, hf], [-D / 2 + 0.3, hb]]) { add(g, new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16), C.conc, x, 0.2, z); bx(g, C.wood, x - 0.25, 0.4, z - 0.25, x + 0.25, h, z + 0.25); }
  // headers (doubled 2x10) on both post lines + knee braces
  for (const [z, h] of [[D / 2 - 0.3, hf], [-D / 2 + 0.3, hb]]) {
    for (const dz of [-0.33, 0.33]) bx(g, C.lumber, -W / 2, h - 0.85, z + dz - 0.07, W / 2, h, z + dz + 0.07);
    for (const x of xs) for (const s of [-1, 1]) if (Math.abs(x + s * 2) < W / 2) slab(g, C.lumber, x + s * 0.25, h - 2.6, x + s * 2.2, h - 0.85, 0.3, 0.14, z);
  }
  // back wall girts + metal panel (lean-to back is closed to weather), open front and sides
  for (let y = 1.5; y < hb - 1; y += 2.2) bx(g, C.lumber, -W / 2, y, -D / 2 + 0.03, W / 2, y + 0.3, -D / 2 + 0.05 + 0.1);
  bx(g, C.body, -W / 2, 0.5, -D / 2 - 0.02, W / 2, hb - 0.9, -D / 2 + 0.03);
  const slope = (hf - hb) / (D - 0.6);
  const nr = Math.max(3, Math.round(W / 2) + 1);
  for (let i = 0; i < nr; i++) { const x = -W / 2 + 0.1 + (i * (W - 0.2)) / (nr - 1); const m = add(g, B(0.16, 0.7, D + oh * 2), C.lumber, x, (hf + hb) / 2 + 0.35, 0); m.rotation.x = -Math.atan(slope); }
  const r = add(g, B(W + oh * 2, 0.1, Math.hypot(D + oh * 2, (D + oh * 2) * slope)), C.roof, 0, (hf + hb) / 2 + 0.75, 0); r.rotation.x = -Math.atan(slope);
  for (let x = -W / 2 - oh; x <= W / 2 + oh; x += 0.75) { const m = add(g, B(0.04, 0.05, Math.hypot(D + oh * 2, (D + oh * 2) * slope)), C.roof, x, (hf + hb) / 2 + 0.82, 0); m.rotation.x = -Math.atan(slope); } // standing seams
}
const O = (name, build, sizes, extra = {}) => ({
  name, category: 'outbuilding', outdoor: true, noAuto: true, sizes, w: sizes[0][0], d: sizes[0][1], h: 10, outbuilding: true, ...extra,
  build: (g, rec, ctx) => build(g, { ...rec, w: rec.w || sizes[0][0], d: rec.d || sizes[0][1] }, ctx),
});
export const OUTBUILDING_CATEGORIES = [{ id: 'outbuilding', name: 'Outbuildings' }];
export const OUTBUILDING_CATALOG = {
  shedGable: O('Classic gable garden shed', buildGable, [[10, 12], [8, 10], [12, 16]], { enclosed: true }),
  shedGambrel: O('Gambrel barn shed (loft)', buildGambrel, [[12, 16], [10, 12], [12, 20]], { enclosed: true }),
  shedStudio: O('Modern lean-to studio shed', buildStudio, [[10, 12], [12, 16], [12, 20]], { enclosed: true }),
  woodshed: O('Open-front woodshed', buildWoodshed, [[12, 8], [10, 6], [16, 8]]),
  poleShelter: O('Pole-barn lean-to shelter (open)', buildPole, [[20, 12], [24, 12], [24, 16]]),
};
