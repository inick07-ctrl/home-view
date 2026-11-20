// PeakStead Designs — pool and solar items for Edit Plan / Builder.
import * as THREE from 'three';
export { extrasFromItems } from '../js/yard-extras.js';

const MATS = {};
function mat(color, o = {}) {
  const key = color + '|' + (o.r ?? 0.78) + '|' + (o.m ?? 0) + '|' + (o.e ?? 0) + '|' + (o.t ?? 0) + '|' + (o.op ?? 1);
  return MATS[key] ||= new THREE.MeshStandardMaterial({
    color,
    roughness: o.r ?? 0.78,
    metalness: o.m ?? 0,
    emissive: o.e ? new THREE.Color(color) : 0,
    emissiveIntensity: o.e || 0,
    transparent: !!o.t,
    opacity: o.op ?? 1,
    side: o.side || THREE.FrontSide,
  });
}

function add(g, geom, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geom, material);
  m.position.set(x, y, z);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}

const waterMat = () => mat('#2e7a9a', { r: 0.18, m: 0.35, t: 1, op: 0.78, side: THREE.DoubleSide });
const copingMat = () => mat('#e6e0d4', { r: 0.72 });
const deckMat = () => mat('#c4a574', { r: 0.78 });
const spaShell = () => mat('#cfc8bc', { r: 0.55 });

function rectPool(g, rec, { raised = false } = {}) {
  const W = rec.w || 16, D = rec.d || 32;
  const deck = Math.min(3.2, Math.max(1.6, Math.min(W, D) * 0.12));
  const innerW = Math.max(4, W - deck * 2);
  const innerD = Math.max(4, D - deck * 2);
  const deckH = raised ? 0.85 : 0.14;
  const waterY = raised ? 0.62 : 0.04;
  const depth = raised ? 0.7 : 0.55;
  add(g, new THREE.BoxGeometry(W, deckH, D), deckMat(), 0, deckH / 2, 0);
  // coping ring (inner lip)
  const lip = 0.55;
  const copeH = 0.12;
  add(g, new THREE.BoxGeometry(innerW + lip * 2, copeH, innerD + lip * 2), copingMat(), 0, deckH + copeH / 2, 0);
  // water basin
  const basin = add(g, new THREE.BoxGeometry(innerW, depth, innerD), mat('#1a4a5c', { r: 0.9 }), 0, waterY - depth / 2 + 0.02, 0);
  void basin;
  const water = add(g, new THREE.BoxGeometry(innerW - 0.08, 0.05, innerD - 0.08), waterMat(), 0, waterY, 0);
  water.castShadow = false;
  // shallow steps at one end
  const stepW = Math.min(innerW * 0.55, 8);
  for (let i = 0; i < 3; i++) {
    const z = -innerD / 2 + 0.7 + i * 0.55;
    add(g, new THREE.BoxGeometry(stepW, 0.1, 0.5), copingMat(), 0, waterY - 0.18 - i * 0.14, z);
  }
}

function kidneyShape(w, d, steps = 28) {
  // Two offset lobes forming a kidney / freeform pool outline in XZ.
  const shape = new THREE.Shape();
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const k = 0.22 * Math.sin(t) + 0.12 * Math.sin(2 * t + 0.6);
    const x = Math.cos(t) * (w / 2) * (0.86 + k);
    const z = Math.sin(t) * (d / 2) * (0.9 - 0.18 * Math.cos(t));
    pts.push(new THREE.Vector2(x, z));
  }
  shape.setFromPoints(pts);
  return shape;
}

function kidneyPool(g, rec) {
  const W = rec.w || 16, D = rec.d || 32;
  const deck = 2.4;
  const outer = kidneyShape(W, D, 36);
  const inner = kidneyShape(Math.max(6, W - deck * 2), Math.max(8, D - deck * 2), 36);
  const deckGeom = new THREE.ExtrudeGeometry(outer, { depth: 0.14, bevelEnabled: false });
  deckGeom.rotateX(-Math.PI / 2);
  const deckMesh = new THREE.Mesh(deckGeom, deckMat());
  deckMesh.position.y = 0;
  deckMesh.castShadow = deckMesh.receiveShadow = true;
  g.add(deckMesh);
  const cope = new THREE.Mesh(new THREE.ExtrudeGeometry(inner, { depth: 0.08, bevelEnabled: false }), copingMat());
  cope.rotation.x = -Math.PI / 2;
  cope.position.y = 0.14;
  g.add(cope);
  const waterShape = kidneyShape(Math.max(5, W - deck * 2 - 0.5), Math.max(7, D - deck * 2 - 0.5), 36);
  const waterG = new THREE.ShapeGeometry(waterShape);
  waterG.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterG, waterMat());
  water.position.y = 0.12;
  water.castShadow = false;
  water.receiveShadow = true;
  g.add(water);
}

function spaTub(g, rec) {
  const W = rec.w || 8, D = rec.d || 8;
  const deck = 1.3;
  add(g, new THREE.BoxGeometry(W, 0.18, D), deckMat(), 0, 0.09, 0);
  add(g, new THREE.BoxGeometry(W - 0.4, 0.95, D - 0.4), spaShell(), 0, 0.55, 0);
  const iw = W - deck * 2, id = D - deck * 2;
  add(g, new THREE.BoxGeometry(iw + 0.3, 0.12, id + 0.3), copingMat(), 0, 1.0, 0);
  add(g, new THREE.BoxGeometry(iw, 0.7, id), mat('#1a4a5c', { r: 0.85 }), 0, 0.62, 0);
  const water = add(g, new THREE.BoxGeometry(iw - 0.1, 0.06, id - 0.1), waterMat(), 0, 0.92, 0);
  water.castShadow = false;
  // corner seats
  for (const [x, z] of [[-iw * 0.28, -id * 0.28], [iw * 0.28, -id * 0.28], [-iw * 0.28, id * 0.28], [iw * 0.28, id * 0.28]]) {
    add(g, new THREE.BoxGeometry(1.1, 0.22, 1.1), spaShell(), x, 0.72, z);
  }
  // steps
  add(g, new THREE.BoxGeometry(2.2, 0.28, 0.7), copingMat(), 0, 0.28, D / 2 - 0.5);
  add(g, new THREE.BoxGeometry(2.2, 0.18, 0.55), copingMat(), 0, 0.55, D / 2 - 0.85);
}

export function buildPool(g, rec) {
  const kind = rec.variant || rec.poolKind || 'rect';
  if (kind === 'kidney') kidneyPool(g, rec);
  else if (kind === 'spa') spaTub(g, rec);
  else rectPool(g, rec, { raised: kind === 'spa' });
}

const PANEL_W = 5.5, PANEL_D = 3.4, PANEL_H = 0.12;
const glass = () => mat('#15253c', { r: 0.22, m: 0.45 });
const frame = () => mat('#1a1c1e', { r: 0.4, m: 0.6 });
const rail = () => mat('#8a9096', { r: 0.35, m: 0.7 });

function onePanel(g, x, y, z, rx = 0) {
  const grp = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(PANEL_W, PANEL_H, PANEL_D), glass());
  const rim = new THREE.Mesh(new THREE.BoxGeometry(PANEL_W + 0.08, PANEL_H + 0.02, PANEL_D + 0.08), frame());
  body.position.y = 0.02;
  grp.add(rim, body);
  // cell lines
  const line = mat('#0e1826', { r: 0.4 });
  for (let i = -2; i <= 2; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, PANEL_D - 0.1), line);
    m.position.set(i * (PANEL_W / 6), PANEL_H / 2 + 0.03, 0);
    grp.add(m);
  }
  for (let j = -1; j <= 1; j++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(PANEL_W - 0.1, 0.02, 0.03), line);
    m.position.set(0, PANEL_H / 2 + 0.03, j * (PANEL_D / 3));
    grp.add(m);
  }
  grp.position.set(x, y, z);
  grp.rotation.x = rx;
  g.add(grp);
  return grp;
}

function layoutPanels(count) {
  // Prefer rows of 4, then 5, then 6 for larger arrays.
  const cols = count <= 6 ? Math.min(3, count) : count <= 12 ? 4 : count <= 20 ? 5 : 6;
  const rows = Math.ceil(count / cols);
  return { cols, rows };
}

export function arrayFootprint(count, { gap = 0.15, ground = false } = {}) {
  const { cols, rows } = layoutPanels(count);
  const w = cols * PANEL_W + (cols - 1) * gap;
  const d = rows * PANEL_D + (rows - 1) * gap;
  if (ground) return { w: w + 1.2, d: d * Math.cos(28 * Math.PI / 180) + 2.4, cols, rows };
  return { w: w + 0.4, d: d + 0.4, cols, rows };
}

function placeArray(g, rec, { tilted = false } = {}) {
  const count = rec.panels || rec.count || 12;
  const { cols, rows } = layoutPanels(count);
  const gap = 0.16;
  const pitch = (rec.pitch != null ? rec.pitch : (tilted ? 28 : 0)) * Math.PI / 180;
  const totalW = cols * PANEL_W + (cols - 1) * gap;
  const totalD = rows * PANEL_D + (rows - 1) * gap;
  let n = 0;
  for (let r = 0; r < rows && n < count; r++) {
    for (let c = 0; c < cols && n < count; c++, n++) {
      const x = -totalW / 2 + PANEL_W / 2 + c * (PANEL_W + gap);
      const z = -totalD / 2 + PANEL_D / 2 + r * (PANEL_D + gap);
      if (tilted) {
        // rack
        const h0 = 0.55, h1 = h0 + Math.sin(pitch) * PANEL_D;
        add(g, new THREE.BoxGeometry(0.08, h0 + 0.15, 0.08), rail(), x - PANEL_W * 0.35, h0 / 2, z + PANEL_D * 0.35);
        add(g, new THREE.BoxGeometry(0.08, h1 + 0.1, 0.08), rail(), x + PANEL_W * 0.35, h1 / 2, z - PANEL_D * 0.35);
        add(g, new THREE.BoxGeometry(0.08, h0 + 0.15, 0.08), rail(), x + PANEL_W * 0.35, h0 / 2, z + PANEL_D * 0.35);
        add(g, new THREE.BoxGeometry(0.08, h1 + 0.1, 0.08), rail(), x - PANEL_W * 0.35, h1 / 2, z - PANEL_D * 0.35);
        const railLen = PANEL_D + 0.2;
        const midH = (h0 + h1) / 2;
        add(g, new THREE.BoxGeometry(PANEL_W + 0.1, 0.06, 0.06), rail(), x, midH, z, 0, 0, 0);
        onePanel(g, x, midH + 0.08, z, -pitch);
      } else {
        onePanel(g, x, 0.08, z, -pitch);
      }
    }
  }
  void totalD;
}

export function buildRoofSolar(g, rec) {
  placeArray(g, rec, { tilted: false });
}

export function buildGroundSolar(g, rec) {
  placeArray(g, rec, { tilted: true });
}

function poolEntry(name, w, d, variant, extra = {}) {
  const deck = variant === 'spa' ? 1.3 : variant === 'kidney' ? 2.4 : Math.min(3.2, Math.max(1.6, Math.min(w, d) * 0.12));
  // catalog w/d are water size; overall footprint includes deck
  const fw = +(w + deck * 2).toFixed(2);
  const fd = +(d + deck * 2).toFixed(2);
  return {
    name, category: 'pool', w: fw, d: fd, h: variant === 'spa' ? 2.2 : 1.2,
    variant, poolKind: variant, waterW: w, waterD: d, outdoor: true, build: buildPool, ...extra,
  };
}

function solarEntry(name, panels, mount) {
  const fp = arrayFootprint(panels, { ground: mount === 'ground' });
  return {
    name, category: 'solar', w: +fp.w.toFixed(2), d: +fp.d.toFixed(2), h: mount === 'ground' ? 4.2 : 0.4,
    panels, mount, outdoor: true, kw: +(panels * 0.4).toFixed(2),
    build: mount === 'roof' ? buildRoofSolar : buildGroundSolar,
  };
}

export const YARD_CATEGORIES = [
  { id: 'pool', name: 'Pool' },
  { id: 'solar', name: 'Solar' },
];

export const YARD_CATALOG = {
  poolPlunge: poolEntry('Plunge 8×12', 8, 12, 'rect'),
  poolSmall: poolEntry('Small 12×24', 12, 24, 'rect'),
  poolMedium: poolEntry('Medium 16×32', 16, 32, 'rect'),
  poolLarge: poolEntry('Large 20×40', 20, 40, 'rect'),
  poolKidney: poolEntry('Kidney ~16×32', 16, 32, 'kidney'),
  hotTub: poolEntry('Hot tub / spa 8×8', 8, 8, 'spa', { spa: true }),
  solarRoof6: solarEntry('Roof array — 6 panels', 6, 'roof'),
  solarRoof12: solarEntry('Roof array — 12 panels', 12, 'roof'),
  solarRoof20: solarEntry('Roof array — 20 panels', 20, 'roof'),
  solarRoof30: solarEntry('Roof array — 30 panels', 30, 'roof'),
  solarGround8: solarEntry('Ground array — 8 panels', 8, 'ground'),
  solarGround12: solarEntry('Ground array — 12 panels', 12, 'ground'),
  solarGround20: solarEntry('Ground array — 20 panels', 20, 'ground'),
};
