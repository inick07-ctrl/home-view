// PeakStead Designs — detailed furniture, doorway/hallway clearance, and auto-layout.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const CATEGORIES = [
  { id: 'living', name: 'Living' },
  { id: 'bedroom', name: 'Bedroom' },
  { id: 'kitchen', name: 'Kitchen & Dining' },
  { id: 'bath', name: 'Bath' },
  { id: 'office', name: 'Office' },
  { id: 'gym', name: 'Gym' },
  { id: 'patio', name: 'Patio' },
  { id: 'decor', name: 'Decor' },
];

export const FINISHES = {
  linen: { upholstery: '#e7e1d4', welt: '#d9d2c4', name: 'Linen' },
  charcoal: { upholstery: '#4c545c', welt: '#3a4148', name: 'Charcoal' },
  sage: { upholstery: '#8b9a8c', welt: '#7a8a7b', name: 'Sage' },
  camel: { upholstery: '#c4a06a', welt: '#b08c58', name: 'Camel' },
  navy: { upholstery: '#3c4a5c', welt: '#2f3b4a', name: 'Navy' },
  cream: { upholstery: '#f3efe6', welt: '#e4ddd0', name: 'Cream' },
  slate: { upholstery: '#7a8490', welt: '#686f78', name: 'Slate' },
};

const WOOD = {
  oak: '#8d6a42',
  walnut: '#5a3a22',
  espresso: '#3a2a1c',
  black: '#242220',
  light: '#c4a574',
};

const MATS = {};
function mat(color, o = {}) {
  const key = color + '|' + (o.r ?? 0.78) + '|' + (o.m ?? 0) + '|' + (o.e ?? 0);
  return MATS[key] ||= new THREE.MeshStandardMaterial({
    color, roughness: o.r ?? 0.78, metalness: o.m ?? 0,
    emissive: o.e ? new THREE.Color(color) : 0, emissiveIntensity: o.e || 0,
  });
}

const GEO = {};
function tag(g) { g.userData.shared = true; return g; }
function box(w, h, d) {
  const k = `b:${w}:${h}:${d}`;
  return GEO[k] ||= tag(new THREE.BoxGeometry(w, h, d));
}
function rbox(w, h, d, rad = 0.04) {
  const r = Math.min(rad, w * 0.45, h * 0.45, d * 0.45);
  const k = `r:${w}:${h}:${d}:${r}`;
  return GEO[k] ||= tag(new RoundedBoxGeometry(w, h, d, 3, r));
}
function cyl(rt, rb, h, seg = 14) {
  const k = `c:${rt}:${rb}:${h}:${seg}`;
  return GEO[k] ||= tag(new THREE.CylinderGeometry(rt, rb, h, seg));
}
function sph(r, seg = 14) {
  const k = `s:${r}:${seg}`;
  return GEO[k] ||= tag(new THREE.SphereGeometry(r, seg, seg));
}

function add(g, geom, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geom, material);
  m.position.set(x, y, z);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}

function finishOf(rec) {
  return FINISHES[rec.finish] || FINISHES.linen;
}
function woodOf(rec) {
  return mat(WOOD[rec.wood] || WOOD.oak, { r: 0.62 });
}

/** Place a part in item space: origin at footprint center, y up, +z is the front. */
function taperedLegs(g, w, d, legH, wood, inset = 0.12, top = 0.055, bot = 0.035) {
  const hx = w / 2 - inset, hz = d / 2 - inset;
  for (const [x, z] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]]) {
    add(g, cyl(top, bot, legH, 10), wood, x, legH / 2, z);
  }
}

function turnedLegs(g, w, d, legH, wood, inset = 0.14) {
  const hx = w / 2 - inset, hz = d / 2 - inset;
  for (const [x, z] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]]) {
    add(g, cyl(0.04, 0.05, legH * 0.22, 10), wood, x, legH * 0.11, z);
    add(g, cyl(0.028, 0.032, legH * 0.5, 10), wood, x, legH * 0.47, z);
    add(g, cyl(0.045, 0.04, legH * 0.28, 10), wood, x, legH * 0.86, z);
  }
}

function books(g, x0, y0, z0, w, h, d) {
  const colors = ['#6b4a32', '#2f3e50', '#7a5a3a', '#4a5a48', '#8a3a32', '#d9d0c0', '#3d4a5c', '#5c4a3a'];
  let x = x0;
  const end = x0 + w;
  let i = 0;
  while (x < end - 0.08) {
    const tw = 0.07 + (i * 17 % 5) * 0.015;
    const th = h * (0.72 + (i * 13 % 6) * 0.045);
    const td = d * (0.78 + (i % 3) * 0.06);
    if (x + tw > end) break;
    add(g, box(tw, th, td), mat(colors[i % colors.length], { r: 0.85 }), x + tw / 2, y0 + th / 2, z0);
    x += tw + 0.01;
    i++;
  }
}

function buildSofa(g, rec) {
  const f = finishOf(rec);
  const wood = woodOf(rec);
  const W = rec.w || 7.67, D = rec.d || 3.33, H = rec.h || 2.75;
  const variant = rec.variant || 'roll-arm';
  const legH = 0.42, armW = variant === 'track-arm' ? 0.5 : 0.68;
  const armH = 2.08, seatH = 1.58, backH = H, deck = 1.08;
  const seatD = D - 0.55, cushionH = 0.48;
  // legs + hidden rail
  taperedLegs(g, W - 0.1, D - 0.15, legH, wood, 0.16, 0.05, 0.032);
  add(g, box(W - armW * 0.4, 0.1, D - 0.2), wood, 0, legH + 0.05, 0);
  // deck
  add(g, rbox(W - armW * 2 + 0.08, deck - legH, seatD, 0.03), mat(f.upholstery, { r: 0.86 }), 0, (legH + deck) / 2, 0.08);
  // arms
  const armX = W / 2 - armW / 2;
  const armZ = 0.02;
  if (variant === 'track-arm') {
    for (const s of [-1, 1]) {
      add(g, rbox(armW, armH - legH, D - 0.08, 0.04), mat(f.upholstery, { r: 0.82 }), s * armX, (legH + armH) / 2, armZ);
    }
  } else {
    for (const s of [-1, 1]) {
      add(g, rbox(armW * 0.7, armH - legH - 0.25, D - 0.2, 0.05), mat(f.upholstery, { r: 0.82 }), s * armX, (legH + armH - 0.15) / 2, armZ);
      add(g, cyl(armW * 0.48, armW * 0.48, D - 0.22, 16), mat(f.upholstery, { r: 0.8 }), s * armX, armH - armW * 0.15, 0, Math.PI / 2, 0, 0);
    }
  }
  // back frame + loose back cushions
  add(g, rbox(W - armW * 2 + 0.06, backH - deck, 0.42, 0.05), mat(f.upholstery, { r: 0.84 }), 0, (deck + backH) / 2, -D / 2 + 0.28);
  const seats = Math.max(2, Math.min(4, Math.round((W - armW * 2) / 2.15)));
  const innerW = W - armW * 2 - 0.08;
  const cw = innerW / seats - 0.06;
  for (let i = 0; i < seats; i++) {
    const x = -innerW / 2 + cw / 2 + 0.03 + i * (cw + 0.06);
    add(g, rbox(cw, cushionH, seatD - 0.28, 0.07), mat(f.upholstery, { r: 0.8 }), x, seatH - cushionH / 2 + 0.02, 0.16);
    add(g, rbox(cw * 0.96, 0.7, 0.28, 0.08), mat(f.welt, { r: 0.82 }), x, seatH + 0.55, -D / 2 + 0.55);
  }
  // throw pillows, slightly rotated
  const pillow = mat(rec.pillow || '#d7c4a8', { r: 0.78 });
  const px = innerW / 2 - 0.45;
  const p1 = add(g, rbox(0.55, 0.48, 0.22, 0.07), pillow, -px, seatH + 0.42, -D / 2 + 0.7, 0, 0.35, 0.1);
  const p2 = add(g, rbox(0.5, 0.44, 0.2, 0.07), mat('#f4eee4', { r: 0.8 }), px, seatH + 0.4, -D / 2 + 0.68, 0, -0.4, -0.08);
  void p1; void p2;
}

function buildSectional(g, rec) {
  buildSofa(g, { ...rec, w: (rec.w || 8.5) * 0.72 });
  // chaise on the front-right or front-left of the remaining width
  const side = rec.chaise || 'right';
  const W = rec.w || 8.5, D = rec.d || 6.2;
  const sofaW = W * 0.72, sofaD = Math.min(3.33, D * 0.55);
  const f = finishOf(rec);
  const wood = woodOf(rec);
  const sign = side === 'left' ? -1 : 1;
  const cw = W - sofaW + 0.15;
  const cd = D;
  const cx = sign * (W / 2 - cw / 2);
  const legH = 0.42, seatH = 1.58, cushionH = 0.48;
  taperedLegs(g, cw - 0.1, cd - 0.15, legH, wood, 0.14, 0.05, 0.032);
  add(g, rbox(cw - 0.08, 0.62, cd - 0.2, 0.03), mat(f.upholstery, { r: 0.86 }), cx, (legH + 1.08) / 2, 0);
  add(g, rbox(cw - 0.16, cushionH, cd - 0.7, 0.07), mat(f.upholstery, { r: 0.8 }), cx, seatH - cushionH / 2 + 0.02, 0.12);
  add(g, rbox(cw - 0.2, 0.7, 0.28, 0.08), mat(f.welt, { r: 0.82 }), cx, seatH + 0.55, -cd / 2 + 0.5);
  // shift the already-built sofa toward the opposite side
  // (sofa was built at origin — move its children)
  // Instead offset sofa group: we built sofa at 0; nudge sofa meshes is hard.
  // Rebuild approach: leave sofa at center and place chaise overlapping the end.
  void sofaD;
}

function buildAccentChair(g, rec) {
  const f = finishOf(rec);
  const wood = woodOf(rec);
  const W = rec.w || 2.5, D = rec.d || 2.6, H = rec.h || 3.0;
  const variant = rec.variant || 'wing';
  const legH = 0.55, seatH = 1.5;
  if (variant === 'spindle') {
    // Windsor-like
    taperedLegs(g, W * 0.78, D * 0.7, seatH - 0.08, wood, 0.12, 0.035, 0.025);
    add(g, cyl(0.015, 0.015, W * 0.7, 8), wood, 0, 0.7, 0, 0, 0, Math.PI / 2);
    add(g, cyl(0.015, 0.015, D * 0.55, 8), wood, 0, 0.7, 0, Math.PI / 2, 0, 0);
    add(g, rbox(W, 0.1, D * 0.72, 0.03), wood, 0, seatH - 0.12, 0.05);
    add(g, rbox(W * 0.9, 0.14, D * 0.64, 0.04), mat(f.upholstery, { r: 0.8 }), 0, seatH, 0.08);
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = -W * 0.35 + t * W * 0.7;
      add(g, cyl(0.018, 0.016, H - seatH, 8), wood, x, (seatH + H) / 2, -D / 2 + 0.22);
    }
    add(g, cyl(0.02, 0.02, W * 0.75, 8), wood, 0, H - 0.06, -D / 2 + 0.22, 0, 0, Math.PI / 2);
  } else {
    taperedLegs(g, W * 0.82, D * 0.78, legH, wood, 0.14, 0.045, 0.03);
    add(g, rbox(W, seatH - legH, D * 0.78, 0.05), mat(f.upholstery, { r: 0.84 }), 0, (legH + seatH) / 2, 0.05);
    add(g, rbox(W * 0.92, 0.4, D * 0.7, 0.06), mat(f.upholstery, { r: 0.8 }), 0, seatH + 0.08, 0.08);
    add(g, rbox(W * 0.92, H - seatH, 0.38, 0.06), mat(f.upholstery, { r: 0.82 }), 0, (seatH + H) / 2, -D / 2 + 0.28);
    for (const s of [-1, 1]) add(g, rbox(0.22, 1.15, D * 0.7, 0.05), mat(f.upholstery, { r: 0.82 }), s * (W / 2 - 0.12), seatH + 0.4, 0);
  }
}

function buildCoffeeTable(g, rec) {
  const wood = woodOf(rec);
  const stone = mat(rec.top === 'stone' ? '#d8d3ca' : (WOOD[rec.wood] || WOOD.oak), { r: rec.top === 'stone' ? 0.4 : 0.55, m: rec.top === 'stone' ? 0.08 : 0 });
  const W = rec.w || 4.2, D = rec.d || 2.3, H = rec.h || 1.5;
  const legH = H - 0.12;
  taperedLegs(g, W, D, legH, wood, 0.12, 0.05, 0.035);
  add(g, box(W - 0.25, 0.08, D - 0.25), wood, 0, 0.28, 0); // lower shelf
  add(g, box(W - 0.18, 0.07, 0.06), wood, 0, H - 0.2, D / 2 - 0.14); // apron
  add(g, box(W - 0.18, 0.07, 0.06), wood, 0, H - 0.2, -D / 2 + 0.14);
  add(g, box(0.06, 0.07, D - 0.18), wood, W / 2 - 0.14, H - 0.2, 0);
  add(g, box(0.06, 0.07, D - 0.18), wood, -W / 2 + 0.14, H - 0.2, 0);
  add(g, rbox(W, 0.1, D, 0.02), stone, 0, H - 0.04, 0);
  // tray, books, vase
  add(g, rbox(0.7, 0.04, 0.45, 0.01), mat('#c9b496', { r: 0.55 }), -0.7, H + 0.03, 0.15);
  add(g, box(0.32, 0.04, 0.22), mat('#6b4a32', { r: 0.85 }), 0.55, H + 0.03, -0.15);
  add(g, box(0.3, 0.035, 0.2), mat('#2f3e50', { r: 0.85 }), 0.58, H + 0.07, -0.12);
  add(g, cyl(0.07, 0.05, 0.28, 12), mat('#ece6dc', { r: 0.3, m: 0.1 }), 0.2, H + 0.16, 0.25);
  add(g, sph(0.07, 12), mat('#2e6b4a', { r: 0.6 }), 0.2, H + 0.38, 0.25);
}

function buildSideTable(g, rec) {
  const wood = woodOf(rec);
  const W = rec.w || 1.7, D = rec.d || 1.7, H = rec.h || 2.1;
  taperedLegs(g, W, D, H - 0.1, wood, 0.1, 0.04, 0.028);
  add(g, rbox(W, 0.08, D, 0.015), wood, 0, H - 0.04, 0);
  add(g, rbox(W - 0.2, 0.04, D - 0.2, 0.01), wood, 0, 0.55, 0);
}

function buildTableLamp(g, rec) {
  const base = mat(rec.base || '#c4a35a', { r: 0.35, m: 0.35 });
  const shade = mat(rec.shade || '#f4eee4', { r: 0.9 });
  const H = rec.h || 2.15;
  add(g, cyl(0.12, 0.16, 0.08, 16), base, 0, 0.04, 0);
  add(g, cyl(0.03, 0.035, H - 1.0, 10), base, 0, (H - 1.0) / 2 + 0.08, 0);
  add(g, cyl(0.28, 0.22, 0.7, 16), shade, 0, H - 0.4, 0);
  add(g, cyl(0.01, 0.01, 0.15, 8), base, 0, H - 0.02, 0);
}

function buildRug(g, rec) {
  const W = rec.w || 8, D = rec.d || 6;
  const col = rec.color || '#c4b8a4';
  add(g, box(W, 0.04, D), mat(col, { r: 0.95 }), 0, 0.025, 0);
  add(g, box(W - 0.25, 0.005, D - 0.25), mat(rec.field || '#ddd4c6', { r: 0.97 }), 0, 0.048, 0);
}

function buildMediaConsole(g, rec) {
  const wood = woodOf(rec);
  const W = rec.w || 6, D = rec.d || 1.6, H = rec.h || 2.2;
  add(g, rbox(W, H - 0.25, D, 0.02), wood, 0, (H - 0.25) / 2 + 0.25, 0);
  taperedLegs(g, W, D, 0.25, wood, 0.1, 0.04, 0.03);
  const doors = 3;
  const dw = (W - 0.2) / doors;
  for (let i = 0; i < doors; i++) {
    const x = -W / 2 + 0.12 + dw / 2 + i * dw;
    add(g, rbox(dw - 0.08, H - 0.55, 0.04, 0.01), mat('#cfc3ae', { r: 0.7 }), x, (H + 0.2) / 2, D / 2 - 0.04);
    add(g, cyl(0.025, 0.025, 0.04, 8), mat('#c4a35a', { r: 0.3, m: 0.5 }), x + dw * 0.28, (H + 0.2) / 2, D / 2 - 0.01, Math.PI / 2, 0, 0);
  }
}

function buildPlant(g, rec) {
  const kind = rec.variant || 'fiddle';
  const potC = mat(rec.pot || '#c9b49a', { r: 0.7 });
  const leaf = mat(kind === 'olive' ? '#6b7d4c' : '#2f6a3a', { r: 0.7 });
  const trunk = mat('#5a3d28', { r: 0.85 });
  const H = rec.h || 6.2;
  add(g, cyl(0.32, 0.26, 0.7, 14), potC, 0, 0.35, 0);
  add(g, cyl(0.34, 0.34, 0.08, 14), potC, 0, 0.72, 0);
  add(g, cyl(0.28, 0.22, 0.12, 12), mat('#4a3a2a', { r: 0.95 }), 0, 0.68, 0);
  if (kind === 'olive') {
    add(g, cyl(0.05, 0.07, H * 0.45, 8), trunk, 0, 0.8 + H * 0.22, 0);
    for (let i = 0; i < 18; i++) {
      const a = i * 2.3, r = 0.5 + (i % 5) * 0.12, y = H * 0.45 + (i % 6) * 0.35;
      add(g, sph(0.32 + (i % 3) * 0.06, 10), leaf, Math.cos(a) * r, y, Math.sin(a) * r * 0.8);
    }
  } else {
    add(g, cyl(0.045, 0.07, H * 0.55, 8), trunk, 0, 0.85 + H * 0.25, 0);
    for (let i = 0; i < 14; i++) {
      const a = i * 0.9, r = 0.15 + (i % 4) * 0.12;
      const y = H * 0.5 + (i % 5) * 0.28;
      const lf = add(g, rbox(0.55, 0.04, 0.9, 0.02), leaf, Math.cos(a) * r, y, Math.sin(a) * r, 0.5, a, 0.3);
      void lf;
    }
  }
}

function buildBed(g, rec) {
  const f = finishOf(rec);
  const wood = woodOf(rec);
  const W = rec.w || 5.3, D = rec.d || 6.8, H = rec.h || 3.8;
  const variant = rec.variant || 'upholstered';
  const frameH = 0.95, mattH = 0.7, headH = H;
  // platform + rails
  add(g, rbox(W, 0.22, D, 0.02), wood, 0, 0.45, 0);
  taperedLegs(g, W, D, 0.38, wood, 0.12, 0.05, 0.035);
  add(g, box(W - 0.1, 0.16, D - 0.15), mat('#e8e4dc', { r: 0.9 }), 0, frameH - 0.05, 0);
  // mattress
  add(g, rbox(W - 0.16, mattH, D - 0.28, 0.08), mat('#f4f1ea', { r: 0.9 }), 0, frameH + mattH / 2, 0.02);
  // duvet with a folded-back cuff at the head and a slight rumple at the foot
  const duvet = mat(rec.duvet || f.upholstery, { r: 0.88 });
  add(g, rbox(W - 0.1, 0.16, D * 0.62, 0.06), duvet, 0, frameH + mattH + 0.1, D * 0.08);
  add(g, rbox(W - 0.18, 0.1, 0.55, 0.05), mat('#f8f5ef', { r: 0.9 }), 0, frameH + mattH + 0.2, -D * 0.22);
  // headboard
  if (variant === 'panel') {
    add(g, rbox(W + 0.15, headH, 0.16, 0.02), wood, 0, headH / 2, -D / 2 - 0.02);
    add(g, rbox(W - 0.2, headH * 0.55, 0.04, 0.01), mat(f.upholstery, { r: 0.82 }), 0, headH * 0.55, -D / 2 + 0.08);
  } else {
    add(g, rbox(W + 0.1, headH - 0.1, 0.22, 0.05), mat(f.upholstery, { r: 0.82 }), 0, headH / 2, -D / 2 + 0.02);
    add(g, rbox(W + 0.12, 0.08, 0.24, 0.02), wood, 0, 0.12, -D / 2 + 0.02);
  }
  // footboard (lower)
  add(g, rbox(W + 0.06, 1.7, 0.12, 0.03), variant === 'panel' ? wood : mat(f.upholstery, { r: 0.82 }), 0, 0.9, D / 2 - 0.04);
  // sleeping pillows + shams + accent
  const pw = W * 0.38, ph = 0.38, pd = 0.55;
  add(g, rbox(pw, ph, pd, 0.08), mat('#f8f5ef', { r: 0.88 }), -W * 0.2, frameH + mattH + 0.32, -D / 2 + 0.7);
  add(g, rbox(pw, ph, pd, 0.08), mat('#f8f5ef', { r: 0.88 }), W * 0.2, frameH + mattH + 0.32, -D / 2 + 0.7);
  add(g, rbox(pw * 0.9, 0.32, 0.28, 0.07), mat(f.welt, { r: 0.84 }), -W * 0.2, frameH + mattH + 0.4, -D / 2 + 0.95);
  add(g, rbox(pw * 0.9, 0.32, 0.28, 0.07), mat(f.welt, { r: 0.84 }), W * 0.2, frameH + mattH + 0.4, -D / 2 + 0.95);
  add(g, rbox(0.5, 0.3, 0.18, 0.06), mat(rec.pillow || '#c4a574', { r: 0.8 }), 0, frameH + mattH + 0.42, -D / 2 + 1.15, 0, 0.2, 0);
}

function buildNightstand(g, rec) {
  const wood = woodOf(rec);
  const W = rec.w || 1.85, D = rec.d || 1.4, H = rec.h || 2.25;
  taperedLegs(g, W, D, 0.35, wood, 0.1, 0.04, 0.028);
  add(g, rbox(W, H - 0.35, D, 0.02), wood, 0, (H + 0.35) / 2, 0);
  // two drawer fronts
  for (const [y, hh] of [[H * 0.62, 0.42], [H * 0.38, 0.38]]) {
    add(g, rbox(W - 0.16, hh, 0.04, 0.01), mat('#c9b496', { r: 0.65 }), 0, y, D / 2 - 0.03);
    add(g, box(0.22, 0.03, 0.04), mat('#c4a35a', { r: 0.3, m: 0.5 }), 0, y, D / 2 - 0.01);
  }
}

function buildDresser(g, rec) {
  const wood = woodOf(rec);
  const W = rec.w || 5.2, D = rec.d || 1.7, H = rec.h || 3.2;
  taperedLegs(g, W, D, 0.32, wood, 0.12, 0.045, 0.03);
  add(g, rbox(W, H - 0.32, D, 0.02), wood, 0, (H + 0.32) / 2, 0);
  const rows = 3, cols = 2;
  const dw = (W - 0.3) / cols, dh = (H - 0.7) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -W / 2 + 0.18 + dw / 2 + c * dw;
      const y = 0.55 + dh / 2 + r * dh;
      add(g, rbox(dw - 0.1, dh - 0.08, 0.04, 0.01), mat('#c9b496', { r: 0.65 }), x, y, D / 2 - 0.03);
      add(g, box(0.18, 0.025, 0.04), mat('#c4a35a', { r: 0.3, m: 0.5 }), x, y, D / 2 - 0.01);
    }
  }
}

function buildBench(g, rec) {
  const f = finishOf(rec);
  const wood = woodOf(rec);
  const W = rec.w || 4.2, D = rec.d || 1.45, H = rec.h || 1.55;
  taperedLegs(g, W, D, H - 0.16, wood, 0.12, 0.04, 0.03);
  add(g, rbox(W, 0.16, D, 0.04), mat(f.upholstery, { r: 0.82 }), 0, H - 0.08, 0);
  add(g, box(W - 0.3, 0.06, 0.06), wood, 0, 0.55, 0);
}

function buildDiningTable(g, rec) {
  const wood = woodOf(rec);
  const W = rec.w || 6.5, D = rec.d || 3.2, H = rec.h || 2.5;
  const variant = rec.variant || 'tapered';
  if (variant === 'turned') turnedLegs(g, W, D, H - 0.12, wood, 0.16);
  else taperedLegs(g, W, D, H - 0.12, wood, 0.16, 0.065, 0.04);
  // apron
  add(g, box(W - 0.3, 0.18, 0.07), wood, 0, H - 0.28, D / 2 - 0.16);
  add(g, box(W - 0.3, 0.18, 0.07), wood, 0, H - 0.28, -D / 2 + 0.16);
  add(g, box(0.07, 0.18, D - 0.3), wood, W / 2 - 0.16, H - 0.28, 0);
  add(g, box(0.07, 0.18, D - 0.3), wood, -W / 2 + 0.16, H - 0.28, 0);
  // chamfered top (two layers)
  add(g, rbox(W, 0.07, D, 0.02), wood, 0, H - 0.085, 0);
  add(g, rbox(W - 0.08, 0.05, D - 0.08, 0.015), mat(WOOD[rec.wood] || WOOD.oak, { r: 0.45 }), 0, H - 0.02, 0);
}

function buildDiningChair(g, rec) {
  const f = finishOf(rec);
  const wood = woodOf(rec);
  const W = rec.w || 1.6, D = rec.d || 1.75, H = rec.h || 3.15;
  const seatH = 1.5;
  taperedLegs(g, W * 0.85, D * 0.75, seatH - 0.08, wood, 0.1, 0.032, 0.022);
  // stretchers
  add(g, cyl(0.012, 0.012, W * 0.7, 8), wood, 0, 0.55, 0.15, 0, 0, Math.PI / 2);
  add(g, cyl(0.012, 0.012, D * 0.55, 8), wood, W * 0.28, 0.55, 0, Math.PI / 2, 0, 0);
  add(g, cyl(0.012, 0.012, D * 0.55, 8), wood, -W * 0.28, 0.55, 0, Math.PI / 2, 0, 0);
  add(g, rbox(W * 0.92, 0.12, D * 0.7, 0.02), wood, 0, seatH - 0.08, 0.05);
  add(g, rbox(W * 0.84, 0.1, D * 0.62, 0.04), mat(f.upholstery, { r: 0.82 }), 0, seatH + 0.02, 0.06);
  // slatted / curved back
  add(g, box(W * 0.85, 0.06, 0.04), wood, 0, H - 0.08, -D / 2 + 0.16);
  add(g, box(W * 0.85, 0.05, 0.04), wood, 0, seatH + 0.2, -D / 2 + 0.16);
  const slats = 5;
  for (let i = 0; i < slats; i++) {
    const x = -W * 0.32 + i * (W * 0.64 / (slats - 1));
    add(g, box(0.05, H - seatH - 0.15, 0.035), wood, x, (seatH + H) / 2, -D / 2 + 0.16);
  }
}

function buildBarstool(g, rec) {
  const f = finishOf(rec);
  const wood = woodOf(rec);
  const W = rec.w || 1.45, D = rec.d || 1.5, H = rec.h || 3.5;
  const seatH = 2.15; // counter height
  taperedLegs(g, W * 0.8, D * 0.8, seatH - 0.08, wood, 0.1, 0.032, 0.022);
  add(g, cyl(0.015, 0.015, W * 0.7, 8), wood, 0, 0.85, 0.2, 0, 0, Math.PI / 2); // footrest
  add(g, cyl(0.015, 0.015, D * 0.55, 8), wood, W * 0.28, 0.85, 0, Math.PI / 2, 0, 0);
  add(g, cyl(0.015, 0.015, D * 0.55, 8), wood, -W * 0.28, 0.85, 0, Math.PI / 2, 0, 0);
  add(g, rbox(W * 0.9, 0.12, D * 0.8, 0.04), mat(f.upholstery, { r: 0.8 }), 0, seatH, 0);
  add(g, box(W * 0.7, H - seatH, 0.08), wood, 0, (seatH + H) / 2, -D / 2 + 0.18);
  add(g, rbox(W * 0.7, 0.1, 0.1, 0.02), mat(f.upholstery, { r: 0.8 }), 0, H - 0.08, -D / 2 + 0.2);
}

function buildPendant(g, rec) {
  const metal = mat(rec.metal || '#c4a35a', { r: 0.3, m: 0.55 });
  const H = rec.h || 1.6;
  add(g, cyl(0.015, 0.015, 1.1, 8), metal, 0, 0.8, 0); // this item hangs; y=0 is the canopy top? We'll position so origin is shade center and caller sets y.
  add(g, cyl(0.08, 0.08, 0.04, 12), metal, 0, 1.35, 0);
  add(g, cyl(0.32, 0.18, 0.5, 16), mat(rec.shade || '#d4b07a', { r: 0.5, m: 0.15 }), 0, 0.15, 0);
  add(g, cyl(0.02, 0.02, 0.12, 8), metal, 0, -0.15, 0);
}

function buildRange(g, rec) {
  const body = mat('#d8dce0', { r: 0.45, m: 0.35 });
  const black = mat('#1a1a1a', { r: 0.4, m: 0.2 });
  const W = rec.w || 2.5, D = rec.d || 2.2, H = rec.h || 3.0;
  add(g, rbox(W, H - 0.2, D, 0.02), body, 0, (H - 0.2) / 2, 0);
  add(g, box(W + 0.04, 0.06, D + 0.06), mat('#c5c8cc', { r: 0.35, m: 0.4 }), 0, H - 0.1, 0);
  // cooktop grates
  for (const [x, z] of [[-0.55, -0.4], [0.55, -0.4], [-0.55, 0.4], [0.55, 0.4]]) {
    add(g, cyl(0.18, 0.18, 0.04, 16), black, x, H - 0.05, z);
  }
  add(g, rbox(W - 0.2, 0.55, 0.04, 0.01), mat('#111', { r: 0.3 }), 0, 0.7, D / 2 - 0.03);
  // hood if requested
  if (rec.hood !== false) {
    add(g, rbox(W + 0.15, 0.5, D * 0.7, 0.02), mat('#e8e6e1', { r: 0.5, m: 0.15 }), 0, 6.2, -0.1);
    add(g, box(0.55, 1.4, 0.45), mat('#e8e6e1', { r: 0.5 }), 0, 7.15, -0.15);
  }
}

function buildFridge(g, rec) {
  const body = mat(rec.color || '#e8eaed', { r: 0.45, m: 0.25 });
  const W = rec.w || 3.0, D = rec.d || 2.4, H = rec.h || 7.0;
  add(g, rbox(W, H, D, 0.03), body, 0, H / 2, 0);
  add(g, box(W - 0.12, 0.04, 0.02), mat('#cfd3d6', { r: 0.4 }), 0, H * 0.62, D / 2 + 0.01);
  // handles
  add(g, cyl(0.03, 0.03, 1.1, 8), mat('#c4a35a', { r: 0.3, m: 0.55 }), W / 2 - 0.18, H * 0.35, D / 2 + 0.04);
  add(g, cyl(0.03, 0.03, 0.5, 8), mat('#c4a35a', { r: 0.3, m: 0.55 }), W / 2 - 0.18, H * 0.78, D / 2 + 0.04);
}

function buildSink(g, rec) {
  const top = mat('#e8e4dc', { r: 0.45, m: 0.05 });
  const metal = mat('#c5c8cc', { r: 0.25, m: 0.65 });
  const W = rec.w || 2.6, D = rec.d || 1.8;
  add(g, rbox(W, 0.08, D, 0.01), top, 0, 3.04, 0);
  add(g, rbox(W * 0.5, 0.2, D * 0.45, 0.04), metal, 0, 2.92, 0);
  // faucet
  add(g, cyl(0.04, 0.05, 0.12, 10), metal, 0, 3.16, -D * 0.28);
  add(g, cyl(0.025, 0.025, 0.55, 10), metal, 0, 3.5, -D * 0.28);
  add(g, cyl(0.022, 0.022, 0.35, 10), metal, 0, 3.72, -D * 0.12, Math.PI / 2, 0, 0);
  add(g, cyl(0.02, 0.03, 0.08, 8), metal, 0, 3.5, -D * 0.02);
}

function buildCounterItems(g, rec) {
  // cutting board, bowl, coffee maker — sits on a 3' counter, local y is 0 at floor if rec.onCounter
  const y = rec.onCounter ? 0 : 3.05;
  add(g, rbox(0.55, 0.04, 0.38, 0.01), mat('#c4a06a', { r: 0.7 }), -0.4, y + 0.03, 0.1);
  add(g, cyl(0.14, 0.1, 0.12, 14), mat('#efece5', { r: 0.5 }), 0.25, y + 0.1, 0.05);
  add(g, rbox(0.28, 0.32, 0.2, 0.02), mat('#2b2b2b', { r: 0.4, m: 0.15 }), 0.55, y + 0.18, -0.05);
  add(g, cyl(0.08, 0.08, 0.16, 12), mat('#2b2b2b', { r: 0.4 }), 0.55, y + 0.42, -0.05);
}

function buildCounter(g, rec) {
  const body = mat(rec.carcass || '#efe7da', { r: 0.82 });
  const top = mat(rec.top || '#e8e4dc', { r: 0.5 });
  const W = rec.w || 4, D = rec.d || 2.0, H = rec.h || 3.0;
  add(g, box(W, 0.12, D - 0.08), mat('#4a4038', { r: 0.8 }), 0, 0.06, 0.02); // toe kick
  add(g, rbox(W, H - 0.22, D - 0.08, 0.01), body, 0, (H - 0.1) / 2, 0.02);
  const doors = Math.max(1, Math.round(W / 1.5));
  const dw = W / doors;
  for (let i = 0; i < doors; i++) {
    const x = -W / 2 + dw / 2 + i * dw;
    add(g, rbox(dw - 0.08, H - 0.55, 0.03, 0.01), mat('#e8dfd0', { r: 0.75 }), x, (H - 0.05) / 2, D / 2 - 0.08);
    add(g, cyl(0.015, 0.015, 0.08, 8), mat('#c4a35a', { r: 0.3, m: 0.5 }), x + dw * 0.28, (H - 0.05) / 2, D / 2 - 0.05, Math.PI / 2, 0, 0);
  }
  add(g, rbox(W + 0.1, 0.12, D + 0.08, 0.015), top, 0, H - 0.04, -0.02);
}

function buildIsland(g, rec) {
  buildCounter(g, rec);
  if (rec.stools !== false) { /* stools are separate items */ }
}

function buildCabinet(g, rec) {
  const body = mat(rec.carcass || '#efe7da', { r: 0.82 });
  const W = rec.w || 3, D = rec.d || 1.15, H = rec.h || 3.2;
  const y0 = rec.upper ? 4.3 : 0.1;
  add(g, rbox(W, H, D, 0.015), body, 0, y0 + H / 2, 0);
  const doors = Math.max(1, Math.round(W / 1.4));
  const dw = W / doors;
  for (let i = 0; i < doors; i++) {
    const x = -W / 2 + dw / 2 + i * dw;
    add(g, rbox(dw - 0.08, H - 0.2, 0.03, 0.01), mat('#e8dfd0', { r: 0.75 }), x, y0 + H / 2, D / 2 - 0.03);
    add(g, cyl(0.015, 0.015, 0.08, 8), mat('#c4a35a', { r: 0.3, m: 0.5 }), x + dw * 0.22, y0 + H / 2, D / 2, Math.PI / 2, 0, 0);
  }
}

function buildDesk(g, rec) {
  const wood = woodOf(rec);
  const W = rec.w || 5.5, D = rec.d || 2.5, H = rec.h || 2.5;
  if (rec.variant === 'pedestal') {
    add(g, rbox(1.4, H - 0.12, D - 0.1, 0.02), wood, -W / 2 + 0.75, (H - 0.12) / 2, 0);
    add(g, rbox(1.4, H - 0.12, D - 0.1, 0.02), wood, W / 2 - 0.75, (H - 0.12) / 2, 0);
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        add(g, rbox(1.2, 0.35, 0.04, 0.01), mat('#c9b496', { r: 0.65 }), s * (W / 2 - 0.75), 0.45 + i * 0.5, D / 2 - 0.08);
        add(g, box(0.16, 0.02, 0.04), mat('#c4a35a', { r: 0.3, m: 0.5 }), s * (W / 2 - 0.75), 0.45 + i * 0.5, D / 2 - 0.05);
      }
    }
  } else {
    taperedLegs(g, W, D, H - 0.12, wood, 0.14, 0.05, 0.035);
    add(g, box(W - 0.3, 0.16, 0.07), wood, 0, H - 0.28, D / 2 - 0.16);
    add(g, box(W - 0.3, 0.16, 0.07), wood, 0, H - 0.28, -D / 2 + 0.16);
  }
  add(g, rbox(W, 0.1, D, 0.015), wood, 0, H - 0.04, 0);
}

function buildDeskChair(g, rec) {
  const f = finishOf(rec);
  const metal = mat('#4a4e52', { r: 0.4, m: 0.4 });
  const W = rec.w || 2.0, D = rec.d || 2.0, H = rec.h || 3.2;
  add(g, cyl(0.18, 0.18, 0.07, 16), metal, 0, 0.12, 0);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    add(g, cyl(0.02, 0.02, 0.85, 8), metal, Math.cos(a) * 0.42, 0.12, Math.sin(a) * 0.42, 0, 0, Math.PI / 2 + a);
    add(g, sph(0.06, 10), metal, Math.cos(a) * 0.82, 0.08, Math.sin(a) * 0.82);
  }
  add(g, cyl(0.04, 0.05, 1.15, 10), metal, 0, 0.85, 0);
  add(g, rbox(W * 0.85, 0.14, D * 0.7, 0.04), mat(f.upholstery, { r: 0.8 }), 0, 1.5, 0.05);
  add(g, rbox(W * 0.8, 1.15, 0.28, 0.05), mat(f.upholstery, { r: 0.8 }), 0, 2.25, -D * 0.22);
  add(g, rbox(0.12, 0.35, 0.55, 0.03), mat(f.upholstery, { r: 0.8 }), W * 0.38, 1.7, 0.05);
  add(g, rbox(0.12, 0.35, 0.55, 0.03), mat(f.upholstery, { r: 0.8 }), -W * 0.38, 1.7, 0.05);
}

function buildMonitor(g, rec) {
  const black = mat('#1c1c1c', { r: 0.4, m: 0.15 });
  add(g, box(0.28, 0.04, 0.16), black, 0, 0.04, 0);
  add(g, box(0.06, 0.55, 0.05), black, 0, 0.32, 0);
  add(g, rbox(1.7, 0.95, 0.06, 0.015), black, 0, 1.05, 0);
  add(g, box(1.55, 0.82, 0.02), mat('#9db8cc', { r: 0.25, m: 0.1, e: 0.08 }), 0, 1.05, 0.04);
}

function buildDeskLamp(g, rec) {
  const metal = mat('#c4a35a', { r: 0.3, m: 0.55 });
  add(g, cyl(0.1, 0.12, 0.05, 12), metal, 0, 0.03, 0);
  add(g, cyl(0.015, 0.015, 0.7, 8), metal, 0, 0.4, 0, 0, 0, 0.5);
  add(g, cyl(0.015, 0.015, 0.45, 8), metal, 0.2, 0.85, 0, 0, 0, -0.8);
  add(g, cyl(0.08, 0.12, 0.14, 12), metal, 0.38, 0.95, 0, 0.8, 0, 0);
}

function buildBookshelf(g, rec) {
  const wood = woodOf(rec);
  const W = rec.w || 3.2, D = rec.d || 1.15, H = rec.h || 7.2;
  add(g, box(0.08, H, D), wood, -W / 2 + 0.04, H / 2, 0);
  add(g, box(0.08, H, D), wood, W / 2 - 0.04, H / 2, 0);
  add(g, box(W, 0.08, D), wood, 0, 0.04, 0);
  add(g, box(W, 0.08, D), wood, 0, H - 0.04, 0);
  add(g, box(W, H, 0.05), wood, 0, H / 2, -D / 2 + 0.03);
  const shelves = 5;
  for (let i = 1; i < shelves; i++) {
    const y = i * (H / shelves);
    add(g, box(W - 0.1, 0.05, D - 0.08), wood, 0, y, 0.02);
    books(g, -W / 2 + 0.15, y + 0.03, 0.05, W - 0.3, 0.85, D - 0.25);
  }
}

function buildVanity(g, rec) {
  buildCounter(g, { ...rec, w: rec.w || 4.5, d: rec.d || 1.85, h: rec.h || 2.7 });
  const metal = mat('#c5c8cc', { r: 0.25, m: 0.65 });
  const W = rec.w || 4.5, D = rec.d || 1.85;
  add(g, rbox(1.4, 0.18, 1.0, 0.04), metal, 0, 2.62, 0.05);
  add(g, cyl(0.035, 0.04, 0.1, 10), metal, 0, 2.8, -D * 0.28);
  add(g, cyl(0.02, 0.02, 0.45, 8), metal, 0, 3.05, -D * 0.28);
  add(g, cyl(0.018, 0.018, 0.28, 8), metal, 0, 3.22, -D * 0.12, Math.PI / 2, 0, 0);
  // mirror
  add(g, rbox((rec.w || 4.5) * 0.7, 2.4, 0.05, 0.015), mat('#cfe6f0', { r: 0.15, m: 0.3 }), 0, 5.1, -D / 2 + 0.08);
  add(g, box((rec.w || 4.5) * 0.74, 2.5, 0.04), woodOf(rec), 0, 5.1, -D / 2 + 0.05);
  // sconces
  for (const s of [-1, 1]) {
    add(g, cyl(0.05, 0.05, 0.15, 10), mat('#c4a35a', { r: 0.3, m: 0.5 }), s * ((rec.w || 4.5) * 0.45), 5.2, -D / 2 + 0.2);
    add(g, cyl(0.08, 0.1, 0.28, 12), mat('#f4eee4', { r: 0.85, e: 0.12 }), s * ((rec.w || 4.5) * 0.45), 4.9, -D / 2 + 0.2);
  }
}

function buildTub(g, rec) {
  const porcelain = mat('#f5f3ee', { r: 0.35 });
  const W = rec.w || 5.5, D = rec.d || 2.8, H = rec.h || 2.0;
  add(g, rbox(W, H, D, 0.18), porcelain, 0, H / 2, 0);
  add(g, rbox(W - 0.4, H - 0.15, D - 0.4, 0.15), mat('#e8f0f4', { r: 0.2, m: 0.05 }), 0, H / 2 + 0.05, 0);
  const metal = mat('#c4a35a', { r: 0.3, m: 0.55 });
  add(g, cyl(0.04, 0.05, 0.7, 10), metal, 0, H + 0.2, -D / 2 + 0.25);
  add(g, cyl(0.03, 0.03, 0.4, 8), metal, 0, H + 0.5, -D / 2 + 0.45, Math.PI / 2, 0, 0);
}

function buildToilet(g, rec) {
  const p = mat('#f5f3ee', { r: 0.35 });
  add(g, rbox(1.2, 1.2, 0.4, 0.08), p, 0, 1.85, -0.55); // tank
  add(g, rbox(1.05, 0.12, 0.38, 0.04), p, 0, 2.5, -0.55); // lid
  add(g, rbox(1.05, 0.85, 1.5, 0.18), p, 0, 0.85, 0.25); // bowl
  add(g, rbox(1.0, 0.08, 1.15, 0.05), p, 0, 1.32, 0.3); // seat
  add(g, cyl(0.02, 0.02, 0.12, 8), mat('#c4a35a', { r: 0.3, m: 0.5 }), 0.4, 2.45, -0.35);
}

function buildShower(g, rec) {
  const tile = mat('#e8e6e1', { r: 0.6 });
  const glass = new THREE.MeshStandardMaterial({ color: '#cfe6f6', roughness: 0.15, metalness: 0.05, transparent: true, opacity: 0.3 });
  const W = rec.w || 4, D = rec.d || 3.2, H = rec.h || 8;
  add(g, box(W, 0.08, D), mat('#d5d2cc', { r: 0.7 }), 0, 0.04, 0);
  add(g, box(0.08, H, D), tile, -W / 2 + 0.04, H / 2, 0);
  add(g, box(W, H, 0.08), tile, 0, H / 2, -D / 2 + 0.04);
  add(g, box(0.04, H - 0.4, D - 0.1), glass, W / 2 - 0.1, (H - 0.2) / 2, 0);
  const metal = mat('#c5c8cc', { r: 0.25, m: 0.65 });
  add(g, cyl(0.02, 0.02, 2.2, 8), metal, -W / 2 + 0.25, 5.2, 0);
  add(g, cyl(0.12, 0.12, 0.04, 16), metal, -W / 2 + 0.25, 6.3, 0.15, Math.PI / 2, 0, 0);
}

function buildMudBench(g, rec) {
  const wood = woodOf(rec);
  const f = finishOf(rec);
  const W = rec.w || 5, D = rec.d || 1.5, H = rec.h || 1.55;
  buildBench(g, rec);
  // cubbies / hooks behind
  add(g, rbox(W, 3.2, 0.35, 0.02), wood, 0, 3.3, -D / 2 - 0.05);
  const n = Math.max(3, Math.round(W / 1.4));
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + 0.3 + i * ((W - 0.6) / Math.max(1, n - 1));
    add(g, cyl(0.03, 0.02, 0.12, 8), mat('#c4a35a', { r: 0.3, m: 0.5 }), x, 4.4, -D / 2 + 0.15, Math.PI / 2, 0, 0);
  }
}

function buildWasherDryer(g, rec) {
  const body = mat('#e8eaed', { r: 0.45, m: 0.2 });
  const W = rec.w || 2.25, D = rec.d || 2.3, H = rec.h || 3.3;
  add(g, rbox(W, H, D, 0.03), body, 0, H / 2, 0);
  add(g, cyl(0.55, 0.55, 0.08, 24), mat('#9aa0a6', { r: 0.3, m: 0.3 }), 0, 1.6, D / 2 - 0.02, Math.PI / 2, 0, 0);
  add(g, cyl(0.42, 0.42, 0.04, 24), mat('#c5d0d8', { r: 0.2, m: 0.1 }), 0, 1.6, D / 2 + 0.02, Math.PI / 2, 0, 0);
  add(g, box(W - 0.2, 0.15, 0.04), mat('#333', { r: 0.4 }), 0, H - 0.3, D / 2 + 0.01);
}

function buildPowerRack(g, rec) {
  const steel = mat('#2b2c2e', { r: 0.45, m: 0.4 });
  const W = rec.w || 4.2, D = rec.d || 4, H = rec.h || 7.5;
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    add(g, box(0.12, H, 0.12), steel, x * (W / 2 - 0.1), H / 2, z * (D / 2 - 0.1));
  }
  add(g, box(W, 0.1, 0.1), steel, 0, H - 0.1, -D / 2 + 0.1);
  add(g, box(W, 0.1, 0.1), steel, 0, H - 0.1, D / 2 - 0.1);
  add(g, box(0.1, 0.1, D), steel, -W / 2 + 0.1, H - 0.1, 0);
  add(g, box(0.1, 0.1, D), steel, W / 2 - 0.1, H - 0.1, 0);
  add(g, box(W - 0.2, 0.08, 0.08), steel, 0, 3.6, -D / 2 + 0.1);
  add(g, box(W - 0.2, 0.08, 0.08), steel, 0, 3.6, D / 2 - 0.1);
}

function buildWeightBench(g, rec) {
  const steel = mat('#2b2c2e', { r: 0.45, m: 0.4 });
  const pad = mat('#2a2a2a', { r: 0.85 });
  add(g, rbox(1.0, 0.14, 3.6, 0.03), pad, 0, 1.35, 0);
  add(g, rbox(1.0, 0.14, 1.1, 0.03), pad, 0, 2.1, -1.4, 0.7, 0, 0);
  add(g, box(0.08, 1.2, 0.08), steel, -0.35, 0.6, 1.3);
  add(g, box(0.08, 1.2, 0.08), steel, 0.35, 0.6, 1.3);
  add(g, box(0.08, 1.2, 0.08), steel, -0.35, 0.6, -1.3);
  add(g, box(0.08, 1.2, 0.08), steel, 0.35, 0.6, -1.3);
}

function buildBarbell(g, rec) {
  const steel = mat('#c5c8cc', { r: 0.3, m: 0.6 });
  const plate = mat('#1c1c1c', { r: 0.5, m: 0.2 });
  add(g, cyl(0.04, 0.04, 7.2, 12), steel, 0, 0.55, 0, 0, 0, Math.PI / 2);
  for (const s of [-1, 1]) {
    add(g, cyl(0.35, 0.35, 0.12, 20), plate, s * 3.1, 0.55, 0, 0, 0, Math.PI / 2);
    add(g, cyl(0.28, 0.28, 0.1, 20), plate, s * 3.3, 0.55, 0, 0, 0, Math.PI / 2);
  }
}

function buildDumbbellRack(g, rec) {
  const steel = mat('#2b2c2e', { r: 0.45, m: 0.4 });
  const W = rec.w || 3.5, D = rec.d || 1.4, H = rec.h || 3.2;
  add(g, box(W, 0.08, D), steel, 0, 0.04, 0);
  add(g, box(0.08, H, 0.08), steel, -W / 2 + 0.08, H / 2, -D / 2 + 0.08);
  add(g, box(0.08, H, 0.08), steel, W / 2 - 0.08, H / 2, -D / 2 + 0.08);
  add(g, box(0.08, H, 0.08), steel, -W / 2 + 0.08, H / 2, D / 2 - 0.08);
  add(g, box(0.08, H, 0.08), steel, W / 2 - 0.08, H / 2, D / 2 - 0.08);
  for (const y of [1.0, 1.9, 2.8]) {
    add(g, box(W, 0.06, 0.06), steel, 0, y, 0);
    for (let i = 0; i < 5; i++) {
      const x = -W / 2 + 0.4 + i * ((W - 0.8) / 4);
      add(g, cyl(0.07, 0.07, 0.7, 10), mat('#2a2a2a', { r: 0.6 }), x, y + 0.12, 0, 0, 0, Math.PI / 2);
      add(g, cyl(0.12, 0.12, 0.08, 12), mat('#1c1c1c', { r: 0.5 }), x - 0.28, y + 0.12, 0, 0, 0, Math.PI / 2);
      add(g, cyl(0.12, 0.12, 0.08, 12), mat('#1c1c1c', { r: 0.5 }), x + 0.28, y + 0.12, 0, 0, 0, Math.PI / 2);
    }
  }
}

function buildOutdoorLounge(g, rec) {
  const f = finishOf({ finish: rec.finish || 'sage' });
  const frame = mat(rec.frame || '#3a2a1c', { r: 0.7 });
  const W = rec.w || 2.4, D = rec.d || 6.2, H = rec.h || 1.3;
  add(g, rbox(W, 0.12, D, 0.03), frame, 0, 0.95, 0);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    add(g, box(0.08, 0.9, 0.08), frame, x * (W / 2 - 0.12), 0.45, z * (D / 2 - 0.12));
  }
  add(g, rbox(W - 0.1, 0.16, D - 0.1, 0.05), mat(f.upholstery, { r: 0.88 }), 0, 1.12, 0);
  add(g, rbox(W - 0.15, 0.18, 0.7, 0.05), mat('#f4eee4', { r: 0.88 }), 0, 1.28, -D / 2 + 0.6);
}

function buildOutdoorSofa(g, rec) {
  buildSofa(g, { ...rec, finish: rec.finish || 'sage', variant: 'track-arm', wood: rec.wood || 'espresso' });
}

function buildOutdoorDining(g, rec) {
  buildDiningTable(g, { ...rec, wood: rec.wood || 'espresso', w: rec.w || 5.5, d: rec.d || 3.0 });
}

function buildFirepit(g, rec) {
  const stone = mat('#8a8680', { r: 0.7 });
  add(g, cyl(1.5, 1.6, 0.55, 20), stone, 0, 0.28, 0);
  add(g, cyl(1.15, 1.15, 0.2, 20), mat('#3a2a1c', { r: 0.9 }), 0, 0.5, 0);
  add(g, cyl(0.15, 0.2, 0.3, 8), mat('#5a3a28', { r: 0.85 }), 0.2, 0.7, 0.1, 0.4, 0.2, 0);
  add(g, cyl(0.12, 0.16, 0.28, 8), mat('#4a3020', { r: 0.85 }), -0.15, 0.7, -0.1, -0.3, 0, 0.2);
}

export const CATALOG = {
  sofa: { name: 'Sofa', category: 'living', w: 7.67, d: 3.33, h: 2.75, variants: ['roll-arm', 'track-arm'], finishes: Object.keys(FINISHES), build: buildSofa },
  sectional: { name: 'Sectional', category: 'living', w: 9.5, d: 6.5, h: 2.75, variants: ['roll-arm', 'track-arm'], finishes: Object.keys(FINISHES), build: buildSectional },
  accentChair: { name: 'Accent chair', category: 'living', w: 2.55, d: 2.6, h: 3.05, variants: ['wing', 'spindle'], finishes: Object.keys(FINISHES), build: buildAccentChair },
  coffeeTable: { name: 'Coffee table', category: 'living', w: 4.2, d: 2.3, h: 1.5, variants: ['wood', 'stone'], build: buildCoffeeTable },
  sideTable: { name: 'Side table', category: 'living', w: 1.7, d: 1.7, h: 2.1, build: buildSideTable },
  tableLamp: { name: 'Table lamp', category: 'decor', w: 1.0, d: 1.0, h: 2.15, build: buildTableLamp },
  rug: { name: 'Area rug', category: 'decor', w: 8, d: 6, h: 0.06, build: buildRug },
  mediaConsole: { name: 'Media console', category: 'living', w: 6, d: 1.6, h: 2.2, build: buildMediaConsole },
  plant: { name: 'Potted tree', category: 'decor', w: 2.2, d: 2.2, h: 6.2, variants: ['fiddle', 'olive'], build: buildPlant },
  bed: { name: 'Bed', category: 'bedroom', w: 5.3, d: 6.8, h: 3.8, variants: ['upholstered', 'panel'], finishes: Object.keys(FINISHES), build: buildBed },
  nightstand: { name: 'Nightstand', category: 'bedroom', w: 1.85, d: 1.4, h: 2.25, build: buildNightstand },
  dresser: { name: 'Dresser', category: 'bedroom', w: 5.2, d: 1.7, h: 3.2, build: buildDresser },
  bench: { name: 'Bench', category: 'bedroom', w: 4.2, d: 1.45, h: 1.55, finishes: Object.keys(FINISHES), build: buildBench },
  diningTable: { name: 'Dining table', category: 'kitchen', w: 6.5, d: 3.2, h: 2.5, variants: ['tapered', 'turned'], build: buildDiningTable },
  diningChair: { name: 'Dining chair', category: 'kitchen', w: 1.6, d: 1.75, h: 3.15, finishes: Object.keys(FINISHES), build: buildDiningChair },
  barstool: { name: 'Barstool', category: 'kitchen', w: 1.45, d: 1.5, h: 3.5, finishes: Object.keys(FINISHES), build: buildBarstool },
  pendant: { name: 'Pendant light', category: 'decor', w: 1.1, d: 1.1, h: 2.2, build: buildPendant },
  range: { name: 'Range & hood', category: 'kitchen', w: 2.5, d: 2.2, h: 7.5, build: buildRange },
  fridge: { name: 'Refrigerator', category: 'kitchen', w: 3.0, d: 2.4, h: 7.0, build: buildFridge },
  sink: { name: 'Sink & faucet', category: 'kitchen', w: 2.6, d: 1.8, h: 3.2, build: buildSink },
  counterItems: { name: 'Countertop items', category: 'kitchen', w: 1.6, d: 0.8, h: 0.6, build: buildCounterItems },
  counter: { name: 'Counter', category: 'kitchen', w: 4, d: 2, h: 3, build: buildCounter },
  island: { name: 'Kitchen island', category: 'kitchen', w: 6, d: 3, h: 3, build: buildIsland },
  cabinet: { name: 'Cabinet', category: 'kitchen', w: 3, d: 1.15, h: 3.2, build: buildCabinet },
  desk: { name: 'Desk', category: 'office', w: 5.5, d: 2.5, h: 2.5, variants: ['legs', 'pedestal'], build: buildDesk },
  deskChair: { name: 'Desk chair', category: 'office', w: 2.0, d: 2.0, h: 3.2, finishes: Object.keys(FINISHES), build: buildDeskChair },
  monitor: { name: 'Monitor', category: 'office', w: 1.8, d: 0.5, h: 1.6, build: buildMonitor },
  deskLamp: { name: 'Desk lamp', category: 'office', w: 0.8, d: 0.8, h: 1.4, build: buildDeskLamp },
  bookshelf: { name: 'Bookshelf', category: 'office', w: 3.2, d: 1.15, h: 7.2, build: buildBookshelf },
  vanity: { name: 'Vanity', category: 'bath', w: 4.5, d: 1.85, h: 7.2, build: buildVanity },
  tub: { name: 'Soaking tub', category: 'bath', w: 5.5, d: 2.8, h: 2.0, build: buildTub },
  toilet: { name: 'Toilet', category: 'bath', w: 1.4, d: 2.4, h: 2.55, build: buildToilet },
  shower: { name: 'Shower', category: 'bath', w: 4, d: 3.2, h: 8, build: buildShower },
  mudBench: { name: 'Mudroom bench', category: 'bath', w: 5, d: 1.6, h: 5.0, build: buildMudBench },
  washerDryer: { name: 'Washer / dryer', category: 'bath', w: 2.25, d: 2.3, h: 3.3, build: buildWasherDryer },
  powerRack: { name: 'Power rack', category: 'gym', w: 4.2, d: 4, h: 7.5, build: buildPowerRack },
  weightBench: { name: 'Weight bench', category: 'gym', w: 2.2, d: 4, h: 2.4, build: buildWeightBench },
  barbell: { name: 'Barbell', category: 'gym', w: 7.2, d: 0.8, h: 1.0, build: buildBarbell },
  dumbbellRack: { name: 'Dumbbell rack', category: 'gym', w: 3.5, d: 1.4, h: 3.2, build: buildDumbbellRack },
  outdoorLounge: { name: 'Lounge chair', category: 'patio', w: 2.4, d: 6.2, h: 1.3, finishes: Object.keys(FINISHES), build: buildOutdoorLounge },
  outdoorSofa: { name: 'Outdoor sofa', category: 'patio', w: 7.0, d: 3.2, h: 2.6, finishes: Object.keys(FINISHES), build: buildOutdoorSofa },
  outdoorDining: { name: 'Outdoor dining table', category: 'patio', w: 5.5, d: 3.0, h: 2.5, build: buildOutdoorDining },
  firepit: { name: 'Fire pit', category: 'patio', w: 3.4, d: 3.4, h: 1.2, build: buildFirepit },
};

export function itemFootprint(rec) {
  const t = CATALOG[rec.type] || CATALOG.sofa;
  const w = rec.w || t.w, d = rec.d || t.d;
  const rot = ((rec.rot || 0) % 360 + 360) % 360;
  const swapped = rot === 90 || rot === 270;
  return { w: swapped ? d : w, d: swapped ? w : d, x: rec.x, y: rec.y };
}

export function itemRect(rec) {
  const f = itemFootprint(rec);
  return [f.x - f.w / 2, f.y - f.d / 2, f.x + f.w / 2, f.y + f.d / 2];
}

export function overlap(a, b) {
  return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
}
export function intersect(a, b) {
  const x0 = Math.max(a[0], b[0]), y0 = Math.max(a[1], b[1]);
  const x1 = Math.min(a[2], b[2]), y1 = Math.min(a[3], b[3]);
  if (x1 <= x0 || y1 <= y0) return null;
  return [x0, y0, x1, y1];
}
export function area(r) { return Math.max(0, r[2] - r[0]) * Math.max(0, r[3] - r[1]); }

export function isHallName(name) {
  const n = String(name || '').trim();
  if (/bath|bed|kitchen|dining|garage|bay|closet|wic|pantry/i.test(n)) return false;
  return /^(entry\s+)?hall(way)?$|^mud\s+hall$|hall$/i.test(n) && !/limewash/i.test(n);
}

export function hallwayRects(rooms, inset = 0.2) {
  const out = [];
  for (const r of rooms || []) {
    if (r[7]?.outside) continue;
    if (!isHallName(r[0])) continue;
    const a = r[3] + inset, b = r[4] + inset, c = r[5] - inset, d = r[6] - inset;
    if (c > a && d > b) out.push([a, b, c, d]);
  }
  return out;
}

export function doorwayZones(WS, walk = 2.4, edge = 0.15) {
  const zones = [];
  for (const d of (WS?.door || [])) {
    const r = [d[0], d[1], d[2], d[3]];
    const vert = (r[2] - r[0]) < (r[3] - r[1]);
    const walkR = vert
      ? [r[0] - walk, r[1] - edge, r[2] + walk, r[3] + edge]
      : [r[0] - edge, r[1] - walk, r[2] + edge, r[3] + walk];
    zones.push({ door: r, walk: walkR });
  }
  return zones;
}

/** Punch door openings through any wall segment that still fills them. */
export function sanitizeWalls(WS, minLen = 0.08) {
  if (!WS) return WS;
  const doors = WS.door || [];
  const cutList = (list) => {
    const out = [];
    for (const w of list || []) {
      let pieces = [w.slice()];
      for (const d of doors) {
        const next = [];
        for (const p of pieces) next.push(...subtractDoorFromWall(p, d));
        pieces = next;
      }
      for (const p of pieces) {
        if (p[2] - p[0] > minLen && p[3] - p[1] > minLen) out.push(p);
      }
    }
    return out;
  };
  WS.ext = cutList(WS.ext);
  WS.int = cutList(WS.int);
  return WS;
}

function subtractDoorFromWall(wall, door) {
  const wr = [wall[0], wall[1], wall[2], wall[3]];
  const iv = intersect(wr, [door[0] - 0.04, door[1] - 0.04, door[2] + 0.04, door[3] + 0.04]);
  if (!iv || area(iv) < 0.12) return [wall];
  const wallVert = (wr[2] - wr[0]) < (wr[3] - wr[1]);
  const doorVert = (door[2] - door[0]) < (door[3] - door[1]);
  const rest = wall.slice(4);
  if (wallVert === doorVert) {
    // colinear: split along the long axis around the door
    const pieces = [];
    if (wallVert) {
      if (wr[1] < door[1] - 0.02) pieces.push([wr[0], wr[1], wr[2], Math.min(wr[3], door[1]), ...rest]);
      if (wr[3] > door[3] + 0.02) pieces.push([wr[0], Math.max(wr[1], door[3]), wr[2], wr[3], ...rest]);
    } else {
      if (wr[0] < door[0] - 0.02) pieces.push([wr[0], wr[1], Math.min(wr[2], door[0]), wr[3], ...rest]);
      if (wr[2] > door[2] + 0.02) pieces.push([Math.max(wr[0], door[2]), wr[1], wr[2], wr[3], ...rest]);
    }
    return pieces;
  }
  // perpendicular: clip the wall so it does not enter the door opening
  const pieces = [];
  if (wallVert) {
    // wall is vertical (thin in x), door is horizontal — clip y if it runs into the door x-range
    if (wr[1] < door[1] && wr[3] > door[1] && overlap(wr, door)) {
      if (Math.abs((wr[0] + wr[2]) / 2 - (door[0] + door[2]) / 2) < Math.max(door[2] - door[0], 0.6)) {
        if ((wr[1] + wr[3]) / 2 < (door[1] + door[3]) / 2) pieces.push([wr[0], wr[1], wr[2], Math.min(wr[3], door[1]), ...rest]);
        else pieces.push([wr[0], Math.max(wr[1], door[3]), wr[2], wr[3], ...rest]);
        return pieces.length ? pieces : [];
      }
    }
  } else if (overlap(wr, door)) {
    if (Math.abs((wr[1] + wr[3]) / 2 - (door[1] + door[3]) / 2) < Math.max(door[3] - door[1], 0.6)) {
      if ((wr[0] + wr[2]) / 2 < (door[0] + door[2]) / 2) pieces.push([wr[0], wr[1], Math.min(wr[2], door[0]), wr[3], ...rest]);
      else pieces.push([Math.max(wr[0], door[2]), wr[1], wr[2], wr[3], ...rest]);
      return pieces.length ? pieces : [];
    }
  }
  return [wall];
}

export function clipCounters(WS, rooms) {
  if (!WS?.counter?.length) return WS;
  const halls = hallwayRects(rooms, 0.1);
  const doors = doorwayZones(WS, 2.2, 0.05);
  const keep = [];
  for (const c of WS.counter) {
    let rect = [c[0], c[1], c[2], c[3]];
    let ok = true;
    for (const h of halls) {
      const iv = intersect(rect, h);
      if (iv && area(iv) > 0.2) {
        const clipped = clipRect(rect, h);
        if (!clipped) { ok = false; break; }
        rect = clipped;
      }
    }
    if (!ok) continue;
    for (const z of doors) {
      const iv = intersect(rect, z.walk);
      if (iv && area(iv) > 0.35) {
        const clipped = clipRect(rect, z.walk);
        if (!clipped || area(clipped) < 0.8) { ok = false; break; }
        rect = clipped;
      }
    }
    if (ok) keep.push([...rect, ...c.slice(4)]);
  }
  WS.counter = keep;
  return WS;
}

function clipRect(rect, zone) {
  // shrink rect to remove overlap, preferring to cut the overlapping edge
  const iv = intersect(rect, zone);
  if (!iv) return rect;
  const options = [
    [rect[0], rect[1], iv[0], rect[3]],
    [iv[2], rect[1], rect[2], rect[3]],
    [rect[0], rect[1], rect[2], iv[1]],
    [rect[0], iv[3], rect[2], rect[3]],
  ].filter(r => r[2] - r[0] > 0.4 && r[3] - r[1] > 0.4);
  if (!options.length) return null;
  options.sort((a, b) => area(b) - area(a));
  return options[0];
}

export function clearanceHit(rect, rooms, WS, margin = 0.1) {
  const r = [rect[0] + margin, rect[1] + margin, rect[2] - margin, rect[3] - margin];
  if (r[2] <= r[0] || r[3] <= r[1]) return { kind: 'tight' };
  for (const h of hallwayRects(rooms, 0.15)) {
    if (intersect(r, h) && area(intersect(r, h)) > 0.35) return { kind: 'hallway' };
  }
  for (const z of doorwayZones(WS, 2.2, 0.05)) {
    if (intersect(r, z.walk) && area(intersect(r, z.walk)) > 0.4) return { kind: 'doorway' };
  }
  return null;
}

const COUNTER_COLORS = /#efe7da|#f0ede6|#e8dcc6|#efece5|#e8e2d6|#f4f4f4|#e8dfd0/i;

export function looksLikeLooseFurniture(a, b, c, d, h0, h1, color, o = {}) {
  if (o.solid || o.keep || o.trim || o.role === 'structure' || o.role === 'trim' || o.role === 'lighting') return false;
  const w = Math.abs(c - a), depth = Math.abs(d - b);
  const thin = Math.min(w, depth) <= 0.35;
  if (thin) return false;
  if (h0 >= 6.8) return false;
  if (h1 <= 0.15) return false;
  if (h0 <= 0.05 && h1 <= 0.4) return true; // rugs
  if (h0 <= 0.05 && h1 >= 1.15 && h1 <= 2.85 && !COUNTER_COLORS.test(String(color || ''))) return true;
  if (h0 >= 1.8 && h1 <= 2.85 && (h1 - h0) <= 0.4) return true; // table tops
  if (Math.max(w, depth) <= 2.2 && h0 <= 0.05 && h1 >= 3 && h1 <= 4.2 && !COUNTER_COLORS.test(String(color || ''))) return true;
  return false;
}

export function looksLikeCounter(a, b, c, d, h0, h1, color, o = {}) {
  if (o.solid || o.keep || o.role === 'structure') return false;
  if (h0 > 0.2 || h1 < 2.85 || h1 > 3.25) return false;
  const w = Math.abs(c - a), depth = Math.abs(d - b);
  if (Math.min(w, depth) < 0.9 || Math.max(w, depth) < 1.4) return false;
  return true;
}

let _idSeq = 1;
export function newItemId() { return 'it_' + (_idSeq++) + '_' + Math.random().toString(36).slice(2, 7); }

export function makeItem(type, opts = {}) {
  const t = CATALOG[type];
  if (!t) throw new Error('Unknown item type: ' + type);
  return {
    id: opts.id || newItemId(),
    type,
    x: +opts.x || 0,
    y: +opts.y || 0,
    rot: ((+opts.rot || 0) % 360 + 360) % 360,
    w: opts.w != null ? +opts.w : t.w,
    d: opts.d != null ? +opts.d : t.d,
    finish: opts.finish || (t.finishes ? t.finishes[0] : undefined),
    variant: opts.variant || (t.variants ? t.variants[0] : undefined),
    wood: opts.wood,
    chaise: opts.chaise,
    top: opts.top,
    pillow: opts.pillow,
    duvet: opts.duvet,
    hood: opts.hood,
    onCounter: opts.onCounter,
    upper: opts.upper,
  };
}

export function buildItemMesh(rec, ctx) {
  const t = CATALOG[rec.type];
  if (!t) return null;
  const g = new THREE.Group();
  g.userData.itemId = rec.id;
  g.userData.item = rec;
  t.build(g, rec);
  // hang pendants from a typical ceiling
  if (rec.type === 'pendant') g.position.y = 0; // builder already uses local y; we'll lift the group below
  const lift = rec.type === 'pendant' ? (ctx?.ceiling || 8.2) - 2.0 : 0;
  const { Wx, Wz } = ctx;
  g.position.set(Wx(rec.x), lift, Wz(rec.y));
  g.rotation.y = -((rec.rot || 0) * Math.PI) / 180;
  return g;
}

export function roomOfPoint(rooms, x, y) {
  for (const r of rooms || []) {
    if (r[7]?.outside) continue;
    if (x >= r[3] && x <= r[5] && y >= r[4] && y <= r[6]) return r;
  }
  return null;
}

function roomCenter(r) { return [(r[3] + r[5]) / 2, (r[4] + r[6]) / 2]; }
function roomSize(r) { return [r[5] - r[3], r[6] - r[4]]; }

function doorsOnRoom(room, WS) {
  const R = [room[3], room[4], room[5], room[6]];
  const hits = [];
  for (const d of (WS?.door || [])) {
    const dr = [d[0], d[1], d[2], d[3]];
    const infl = [R[0] - 0.5, R[1] - 0.5, R[2] + 0.5, R[3] + 0.5];
    if (!overlap(dr, infl)) continue;
    const vert = (dr[2] - dr[0]) < (dr[3] - dr[1]);
    let edge = 'n';
    if (vert) edge = Math.abs((dr[0] + dr[2]) / 2 - R[0]) < Math.abs((dr[0] + dr[2]) / 2 - R[2]) ? 'w' : 'e';
    else edge = Math.abs((dr[1] + dr[3]) / 2 - R[1]) < Math.abs((dr[1] + dr[3]) / 2 - R[3]) ? 'n' : 's';
    hits.push({ edge, rect: dr });
  }
  return hits;
}

function againstWall(room, edge, w, d, inset = 0.55) {
  const [x0, y0, x1, y1] = [room[3], room[4], room[5], room[6]];
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (edge === 'n') return { x: cx, y: y0 + inset + d / 2, rot: 0 };
  if (edge === 's') return { x: cx, y: y1 - inset - d / 2, rot: 180 };
  if (edge === 'w') return { x: x0 + inset + d / 2, y: cy, rot: 270 }; // face east, into the room
  return { x: x1 - inset - d / 2, y: cy, rot: 90 }; // face west, into the room
}

function longestWallWithoutDoor(room, doors) {
  const [W, D] = roomSize(room);
  const used = new Set(doors.map(d => d.edge));
  const edges = W >= D ? ['n', 's', 'w', 'e'] : ['w', 'e', 'n', 's'];
  return edges.find(e => !used.has(e)) || edges[0];
}

const SKIP_ROOMS = /closet|wic|w\.i\.c|pantry|garage|bay |shop|mech|safe|attic|unfinished/i;

export function autoFurnish(M, WS) {
  const items = [];
  const rooms = M.rooms || [];
  const roomContains = (room, rec, pad = 0.12) => {
    if (!room) return true;
    const r = itemRect(rec);
    return r[0] >= room[3] + pad && r[1] >= room[4] + pad && r[2] <= room[5] - pad && r[3] <= room[6] - pad;
  };
  let currentRoom = null;
  const put = (type, opts) => {
    const rec = makeItem(type, opts);
    if (clearanceHit(itemRect(rec), rooms, WS, 0.05)) return null;
    if (currentRoom && !roomContains(currentRoom, rec)) return null;
    items.push(rec);
    return rec;
  };

  for (const room of rooms) {
    currentRoom = room;
    const [name, , , , , , , o = {}] = room;
    if (o.outside && !/porch|patio|terrace|screen/i.test(name || '')) continue;
    if (!o.outside && SKIP_ROOMS.test(name || '')) continue;
    if (isHallName(name)) continue;
    const [rw, rd] = roomSize(room);
    if (rw < 4 || rd < 4) continue;
    const doors = doorsOnRoom(room, WS);
    const n = name || '';
    const [cx, cy] = roomCenter(room);

    if (/porch|patio|terrace|screen/i.test(n) || o.outside) {
      if (Math.max(rw, rd) >= 8 && Math.min(rw, rd) >= 5) {
        const sofa = put('outdoorSofa', { x: cx, y: cy - 0.4, rot: 0, finish: 'sage' })
          || put('outdoorSofa', { x: cx + Math.min(6, rw * 0.22), y: cy, rot: 0, finish: 'sage' })
          || put('outdoorSofa', { x: cx - Math.min(6, rw * 0.22), y: cy, rot: 0, finish: 'sage' });
        if (sofa) put('coffeeTable', { x: sofa.x, y: sofa.y + 2.0, w: 3.2, d: 1.8, wood: 'espresso' });
      } else if (Math.min(rw, rd) >= 3.5) {
        put('outdoorLounge', { x: cx, y: cy, rot: rw > rd ? 90 : 0 });
      }
      continue;
    }

    if (/\bgym\b|exercise|workout/i.test(n)) {
      const wall = longestWallWithoutDoor(room, doors);
      const rack = againstWall(room, wall, 4.2, 4, 0.5);
      put('powerRack', { ...rack });
      put('weightBench', { x: cx, y: cy, rot: rack.rot });
      put('barbell', { x: cx, y: cy - 0.2, rot: rack.rot });
      const side = againstWall(room, wall === 'n' ? 'e' : 'n', 3.5, 1.4, 0.5);
      put('dumbbellRack', { ...side, rot: (side.rot + 0) % 360 });
      continue;
    }

    if (/laundry|utility|mud/i.test(n) && !/hall/i.test(n)) {
      const wall = longestWallWithoutDoor(room, doors);
      if (/laundry|utility/i.test(n)) {
        const a = againstWall(room, wall, 2.25, 2.3, 0.4);
        put('washerDryer', { ...a });
        put('washerDryer', { x: a.x + (a.rot === 0 || a.rot === 180 ? 2.4 : 0), y: a.y + (a.rot === 90 || a.rot === 270 ? 2.4 : 0), rot: a.rot });
      }
      if (/mud/i.test(n)) {
        const bWall = /laundry|utility/i.test(n) ? (wall === 'n' ? 's' : wall === 's' ? 'n' : wall === 'e' ? 'w' : 'e') : wall;
        const b = againstWall(room, bWall, Math.min(rw, rd, 6), 1.5, 0.4);
        put('mudBench', { ...b, w: Math.min(5.5, Math.max(rw, rd) - 1.5) });
      }
      continue;
    }

    if (/bath|powder|wc|toilet/i.test(n)) {
      const wall = longestWallWithoutDoor(room, doors);
      if (Math.max(rw, rd) >= 8 && Math.min(rw, rd) >= 5.5) {
        const t = againstWall(room, wall, 5.5, 2.8, 0.5);
        put('tub', { ...t });
      }
      const vEdge = wall === 'n' ? 's' : wall === 's' ? 'n' : wall === 'e' ? 'w' : 'e';
      if (Math.min(rw, rd) >= 5) {
        const v = againstWall(room, vEdge, Math.min(4.5, Math.max(rw, rd) - 2), 1.85, 0.35);
        put('vanity', { ...v, w: Math.min(4.5, Math.max(3.2, (vEdge === 'n' || vEdge === 's' ? rw : rd) - 2.2)) });
      }
      const to = againstWall(room, doors[0]?.edge === 'w' ? 'e' : 'w', 1.4, 2.4, 0.35);
      put('toilet', { ...to });
      continue;
    }

    if (/office|study|library|flex/i.test(n)) {
      const wall = longestWallWithoutDoor(room, doors);
      const desk = againstWall(room, wall, Math.min(5.5, (wall === 'n' || wall === 's' ? rw : rd) - 1.2), 2.5, 0.4);
      put('desk', { ...desk, variant: 'pedestal', w: Math.min(5.5, (wall === 'n' || wall === 's' ? rw : rd) - 1.2) });
      const front = desk.rot * Math.PI / 180;
      // clockwise plan rot: facing is (-sin, cos). Chair sits in front of the desk.
      const dx = -Math.sin(front) * 2.0, dy = Math.cos(front) * 2.0;
      put('deskChair', { x: desk.x + dx, y: desk.y + dy, rot: (desk.rot + 180) % 360, finish: 'charcoal' });
      put('monitor', { x: desk.x - dx * 0.15, y: desk.y - dy * 0.15, rot: desk.rot });
      put('deskLamp', { x: desk.x + (desk.rot === 0 || desk.rot === 180 ? 1.6 : 0), y: desk.y + (desk.rot === 90 || desk.rot === 270 ? 1.6 : 0), rot: desk.rot });
      const bw = againstWall(room, wall === 'n' ? 'e' : 'w', 3.2, 1.15, 0.35);
      put('bookshelf', { ...bw });
      continue;
    }

    if (/kitchen|kitchenette/i.test(n)) {
      // stools + island if the room is large enough; counters stay as architecture
      if (rw * rd >= 80) {
        put('island', { x: cx, y: cy, w: Math.min(7, Math.max(4.5, rw * 0.35)), d: Math.min(3.2, Math.max(2.2, rd * 0.28)), rot: rw >= rd ? 0 : 90 });
        const isl = items[items.length - 1];
        if (isl) {
          const along = (isl.rot === 0 || isl.rot === 180);
          const nStools = 3;
          for (let i = 0; i < nStools; i++) {
            const t = (i - (nStools - 1) / 2) * 1.7;
            put('barstool', {
              x: isl.x + (along ? t : 2.0),
              y: isl.y + (along ? 2.0 : t),
              rot: along ? 180 : 90,
              finish: 'camel',
            });
          }
          put('pendant', { x: isl.x, y: isl.y, rot: 0 });
          put('counterItems', { x: isl.x, y: isl.y, onCounter: true });
        }
      }
      continue;
    }

    if (/dining/i.test(n)) {
      const tw = Math.min(7.5, rw - 3.2), td = Math.min(3.4, rd - 3.2);
      put('diningTable', { x: cx, y: cy, w: Math.max(4.5, tw), d: Math.max(2.8, td), variant: 'tapered', wood: 'walnut' });
      const chairs = Math.max(4, Math.min(8, Math.round(tw / 1.7) * 2));
      const per = Math.round(chairs / 2);
      for (let i = 0; i < per; i++) {
        const t = (i - (per - 1) / 2) * 1.75;
        put('diningChair', { x: cx + t, y: cy - td / 2 - 0.95, rot: 0, finish: 'linen' });
        put('diningChair', { x: cx + t, y: cy + td / 2 + 0.95, rot: 180, finish: 'linen' });
      }
      put('pendant', { x: cx, y: cy });
      continue;
    }

    if (/living|family|great|hearth|lounge/i.test(n)) {
      const rugW = Math.min(rw - 2, 10), rugD = Math.min(rd - 2, 8);
      put('rug', { x: cx, y: cy, w: rugW, d: rugD, color: '#b7a68c', field: '#d8cfc0' });
      const wall = longestWallWithoutDoor(room, doors);
      const sofaW = Math.min(8.5, (wall === 'n' || wall === 's' ? rw : rd) - 2.4);
      const useSectional = Math.min(rw, rd) >= 13;
      const seatD = useSectional ? 6.4 : 3.33;
      const sofa = againstWall(room, wall, sofaW, seatD, 0.7);
      let seat = null;
      if (useSectional) {
        seat = put('sectional', { ...sofa, w: sofaW + 1.5, d: 6.4, finish: 'linen', chaise: 'right' });
      }
      if (!seat) {
        const s2 = againstWall(room, wall, sofaW, 3.33, 0.7);
        seat = put('sofa', { ...s2, w: sofaW, d: 3.33, finish: 'linen', variant: 'roll-arm' });
      }
      if (!seat) {
        const mid = { x: cx, y: cy, rot: wall === 'w' ? 270 : wall === 'e' ? 90 : wall === 's' ? 180 : 0 };
        seat = put('sofa', { ...mid, w: Math.min(7.5, sofaW), d: 3.2, finish: 'linen', variant: 'roll-arm' });
      }
      const pose = seat || sofa;
      const front = pose.rot * Math.PI / 180;
      const fx = -Math.sin(front), fy = Math.cos(front);
      put('coffeeTable', { x: pose.x + fx * 2.7, y: pose.y + fy * 2.7, rot: pose.rot, top: 'wood', wood: 'walnut' });
      const sideA = { x: pose.x + fx * 0.4 - fy * (sofaW / 2 + 0.3), y: pose.y + fy * 0.4 + fx * (sofaW / 2 + 0.3), rot: pose.rot };
      put('sideTable', sideA);
      put('tableLamp', { ...sideA });
      put('accentChair', { x: pose.x + fx * 4.4 + fy * 2.2, y: pose.y + fy * 4.4 - fx * 2.2, rot: (pose.rot + 140) % 360, variant: 'wing', finish: 'camel' });
      put('accentChair', { x: pose.x + fx * 4.4 - fy * 2.2, y: pose.y + fy * 4.4 + fx * 2.2, rot: (pose.rot + 220) % 360, variant: 'spindle', finish: 'sage' });
      // Put the media console on a side wall so it doesn't cover a fireplace on the opposite wall.
      const mediaWall = (wall === 'n' || wall === 's') ? 'e' : 's';
      const media = againstWall(room, mediaWall, Math.min(6.5, (mediaWall === 'n' || mediaWall === 's' ? rw : rd) - 2), 1.6, 0.4);
      put('mediaConsole', { ...media });
      const plantWall = mediaWall === 's' ? 'n' : mediaWall === 'n' ? 'w' : 'n';
      const corner = againstWall(room, plantWall, 2.2, 2.2, 0.6);
      put('plant', { ...corner, variant: 'fiddle' });
      continue;
    }

    if (/bed|primary|master|suite|guest/i.test(n)) {
      const king = Math.min(rw, rd) >= 12 && Math.max(rw, rd) >= 13;
      const bw = king ? 6.4 : 5.3, bd = king ? 7.1 : 6.8;
      const wall = longestWallWithoutDoor(room, doors);
      const bed = againstWall(room, wall, bw, bd, 0.45);
      put('bed', { ...bed, w: bw, d: bd, finish: /primary|master|suite/i.test(n) ? 'linen' : 'sage', variant: /primary|master/i.test(n) ? 'upholstered' : 'panel', duvet: /primary|master/i.test(n) ? '#e8e2d6' : '#c5d0c8' });
      const along = (bed.rot === 0 || bed.rot === 180);
      const sideOff = bw / 2 + 0.95;
      const ns1 = { x: bed.x - (along ? sideOff : 0), y: bed.y - (along ? 0 : sideOff), rot: bed.rot };
      const ns2 = { x: bed.x + (along ? sideOff : 0), y: bed.y + (along ? 0 : sideOff), rot: bed.rot };
      // clockwise plan rot: facing/foot = (-sin, cos), head/back = (sin, -cos)
      const br = bed.rot * Math.PI / 180;
      const hx = Math.sin(br) * (bd / 2 - 0.5), hy = -Math.cos(br) * (bd / 2 - 0.5);
      put('nightstand', { x: ns1.x + hx, y: ns1.y + hy, rot: bed.rot });
      put('tableLamp', { x: ns1.x + hx, y: ns1.y + hy, rot: bed.rot });
      put('nightstand', { x: ns2.x + hx, y: ns2.y + hy, rot: bed.rot });
      put('tableLamp', { x: ns2.x + hx, y: ns2.y + hy, rot: bed.rot });
      const foot = { x: bed.x - Math.sin(br) * (bd / 2 + 0.9), y: bed.y + Math.cos(br) * (bd / 2 + 0.9), rot: bed.rot };
      if (Math.max(rw, rd) >= 13) put('bench', { ...foot, w: Math.min(bw - 0.4, 4.4), finish: 'camel' });
      const dwall = wall === 'n' ? 'e' : wall === 's' ? 'w' : 's';
      const dr = againstWall(room, dwall, Math.min(5.2, 4.8), 1.7, 0.4);
      put('dresser', { ...dr });
      put('rug', { x: bed.x - Math.sin(br) * 0.6, y: bed.y + Math.cos(br) * 0.6, w: bw + 2.2, d: bd - 0.4, rot: bed.rot, color: '#c4b8a4', field: '#e4ddd0' });
      continue;
    }
  }
  return items;
}

export function installFurniture(kit, ctx) {
  const { rooms, WS, detected } = ctx;
  const origBlock = kit.block.bind(kit);
  const origBed = kit.bed ? kit.bed.bind(kit) : null;
  kit.block = (a, b, c, d, h0, h1, color, o = {}) => {
    if (looksLikeLooseFurniture(a, b, c, d, h0, h1, color, o)) return null;
    if (looksLikeCounter(a, b, c, d, h0, h1, color, o)) {
      const w = Math.abs(c - a), depth = Math.abs(d - b);
      const rec = makeItem(w < 4 && depth < 4 && Math.min(w, depth) >= 1.8 ? 'island' : 'counter', {
        x: (a + c) / 2, y: (b + d) / 2,
        w: Math.max(w, depth), d: Math.min(w, depth),
        rot: w >= depth ? 0 : 90,
      });
      if (clearanceHit(itemRect(rec), rooms, WS, 0.02)) return null;
      (detected.counters ||= []).push(rec);
      if (rec.type === 'island') (detected.islands ||= []).push(rec);
      return null; // detailed mesh is built later with the item list
    }
    return origBlock(a, b, c, d, h0, h1, color, o);
  };
  kit.bed = () => null; // replaced by auto-layout / saved items
  kit.place = (type, opts) => {
    const rec = makeItem(type, opts);
    (detected.placed ||= []).push(rec);
    return rec;
  };
  return { origBlock, origBed };
}
