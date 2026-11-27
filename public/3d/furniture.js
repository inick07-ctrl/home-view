// PeakStead Designs — detailed furniture, doorway/hallway clearance, and auto-layout.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { YARD_CATEGORIES, YARD_CATALOG } from './yard-items.js';
import { FIREPLACE_CATEGORIES, FIREPLACE_CATALOG } from './fireplace-items.js';
import { STAIR_CATEGORIES, STAIR_CATALOG } from './stair-items.js';
import { OUTBUILDING_CATEGORIES, OUTBUILDING_CATALOG } from './outbuilding-items.js';

export const CATEGORIES = [
  { id: 'living', name: 'Living' },
  ...FIREPLACE_CATEGORIES,
  ...STAIR_CATEGORIES,
  { id: 'bedroom', name: 'Bedroom' },
  { id: 'kitchen', name: 'Kitchen & Dining' },
  { id: 'bath', name: 'Bath' },
  { id: 'office', name: 'Office' },
  { id: 'gym', name: 'Gym' },
  { id: 'patio', name: 'Patio' },
  { id: 'garage', name: 'Garage' },
  { id: 'decor', name: 'Decor' },
  ...YARD_CATEGORIES,
];

export const VEHICLE_FINISHES = {
  silver: { name: 'Silver', paint: '#8a8680' },
  black: { name: 'Black', paint: '#161616' },
  white: { name: 'White', paint: '#e8e6e1' },
  blue: { name: 'Blue', paint: '#1e3a5f' },
  red: { name: 'Red', paint: '#7a1c1c' },
  graphite: { name: 'Graphite', paint: '#3f3f46' },
};

export const FINISHES = {
  linen: { upholstery: '#e7e1d4', welt: '#d9d2c4', name: 'Linen' },
  charcoal: { upholstery: '#4c545c', welt: '#3a4148', name: 'Charcoal' },
  sage: { upholstery: '#8b9a8c', welt: '#7a8a7b', name: 'Sage' },
  camel: { upholstery: '#c4a06a', welt: '#b08c58', name: 'Camel' },
  navy: { upholstery: '#3c4a5c', welt: '#2f3b4a', name: 'Navy' },
  cream: { upholstery: '#f3efe6', welt: '#e4ddd0', name: 'Cream' },
  slate: { upholstery: '#7a8490', welt: '#686f78', name: 'Slate' },
  boucle: { upholstery: '#ece8df', welt: '#ddd7cb', name: 'Bouclé' },
  cognac: { upholstery: '#a9643a', welt: '#8e5230', name: 'Cognac leather' },
  greige: { upholstery: '#b9ae9f', welt: '#a69b8c', name: 'Greige' },
};

const WOOD = {
  oak: '#8d6a42',
  walnut: '#5a3a22',
  espresso: '#3a2a1c',
  black: '#242220',
  light: '#c4a574',
  whiteOak: '#b8946a',
  teak: '#9a6a3f',
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
// Legs run from the floor to `legH` (the underside of whatever they hold up) and sink EMBED into it,
// so seats, tops, and carcasses always rest on their legs with no visible gap.
const EMBED = 0.04;
function taperedLegs(g, w, d, legH, wood, inset = 0.12, top = 0.055, bot = 0.035, ox = 0, oz = 0) {
  const hx = w / 2 - inset, hz = d / 2 - inset, h = legH + EMBED;
  for (const [x, z] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]]) {
    add(g, cyl(top, bot, h, 10), wood, ox + x, h / 2, oz + z);
  }
  return { hx, hz, ox, oz };
}

function turnedLegs(g, w, d, legH, wood, inset = 0.14) {
  const hx = w / 2 - inset, hz = d / 2 - inset, h = legH + EMBED;
  for (const [x, z] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]]) {
    // foot, spindle, and block overlap slightly so the turning reads as one piece
    add(g, cyl(0.04, 0.05, h * 0.24, 10), wood, x, h * 0.12, z);
    add(g, cyl(0.028, 0.032, h * 0.54, 10), wood, x, h * 0.47, z);
    add(g, cyl(0.045, 0.04, h * 0.3, 10), wood, x, h * 0.85, z);
  }
  return { hx, hz, ox: 0, oz: 0 };
}

/** Stretchers that run leg-centre to leg-centre, so both ends bury into the legs. */
function stretchers(g, L, y, r, wood, sides = 'fblr') {
  const { hx, hz, ox = 0, oz = 0 } = L;
  if (sides.includes('f')) add(g, cyl(r, r, hx * 2, 8), wood, ox, y, oz + hz, 0, 0, Math.PI / 2);
  if (sides.includes('b')) add(g, cyl(r, r, hx * 2, 8), wood, ox, y, oz - hz, 0, 0, Math.PI / 2);
  if (sides.includes('l')) add(g, cyl(r, r, hz * 2, 8), wood, ox - hx, y, oz, Math.PI / 2, 0, 0);
  if (sides.includes('r')) add(g, cyl(r, r, hz * 2, 8), wood, ox + hx, y, oz, Math.PI / 2, 0, 0);
}

/**
 * Chair frame: four legs under a seat board, rear legs continue up as back posts,
 * stretchers between the legs, and back rails/slats between the posts. Every joint overlaps.
 */
function chairFrame(g, { W, D, H, seatH, wood, seatT = 0.12, legR = [0.032, 0.022], footY = 0.55, footR = 0.014, slats = 5, ring = false }) {
  const sw = W * 0.92, sd = D * 0.8;
  const seatBot = seatH - seatT;
  const inset = 0.1;
  const hx = sw / 2 - inset, hz = sd / 2 - inset;
  // front legs to the seat underside
  for (const x of [-hx, hx]) add(g, cyl(legR[0], legR[1], seatBot + EMBED, 10), wood, x, (seatBot + EMBED) / 2, hz);
  // rear legs run straight up as back posts
  for (const x of [-hx, hx]) add(g, cyl(legR[0] * 0.9, legR[1], H, 10), wood, x, H / 2, -hz);
  // seat board sits on all four legs
  add(g, rbox(sw, seatT, sd, 0.02), wood, 0, seatH - seatT / 2, 0);
  // stretchers
  const L = { hx, hz };
  if (ring) stretchers(g, L, footY, footR, wood, 'fblr');
  else { stretchers(g, L, footY, footR, wood, 'lr'); stretchers(g, L, footY + 0.12, footR, wood, 'fb'); }
  // back: crest rail + lower rail between the posts, slats between the rails
  const crestY = H - 0.1, lowY = seatH + 0.28;
  add(g, box(hx * 2, 0.16, 0.05), wood, 0, crestY, -hz);
  add(g, box(hx * 2, 0.06, 0.04), wood, 0, lowY, -hz);
  if (slats > 0) {
    const sh = crestY - 0.08 - (lowY + 0.03);
    for (let i = 0; i < slats; i++) {
      const x = -hx + (i + 1) * (hx * 2 / (slats + 1));
      add(g, box(0.05, sh + 0.04, 0.03), wood, x, lowY + 0.01 + sh / 2, -hz);
    }
  }
  return { sw, sd, hx, hz };
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

// Living Spaces Morro Bay II 128" 3-piece power dual-reclining modular sofa (#303817):
// 128"W x 44"D x 31"H, seat 34"W x 24"D, seat height 18.9", track arms 12"W x 28"H, 1.5" legs,
// two power-recliner end modules (47.5") + armless centre seat (35"), power headrests, beige woven fabric.
// variant 'reclined' extends the footrests and tips the end backs; modules butt together (no gaps).
const MORRO = { beige: ['#cbbca5', '#bfae95'], ivory: ['#e3dccf', '#d6cdbd'], gray: ['#a9a59e', '#9a958d'] };
function buildMorroBay(g, rec) {
  const [cA, cB] = MORRO[rec.finish] || MORRO.beige;
  const fab = mat(cA, { r: 0.92 }), fab2 = mat(cB, { r: 0.94 }), seam = mat('#9d8e78', { r: 0.95 });
  const blk = mat('#1d1d1d', { r: 0.5, m: 0.4 });
  const IN = 1 / 12, W = (rec.w || 10.67), D = rec.d || 3.67, H = 31 * IN;
  const scale = W / (128 * IN);
  const armW = 12 * IN * scale, endW = 47.5 * IN * scale - 0.5 * IN, midW = W - 2 * endW;
  const legH = 1.5 * IN, baseTop = 9.5 * IN, seatH = 18.9 * IN, armH = 28 * IN, backD = 9 * IN;
  const recl = rec.variant === 'reclined';
  const z0 = -D / 2;
  const mods = [[-W / 2 + endW / 2, endW, -1], [0, midW, 0], [W / 2 - endW / 2, endW, 1]];
  for (const [mx, mw, side] of mods) {
    // plinth base (power mechanism housing) on low block feet
    for (const fx of [-1, 1]) for (const fz of [-1, 1]) add(g, box(0.16, legH, 0.16), blk, mx + fx * (mw / 2 - 0.22), legH / 2, fz * (D / 2 - 0.3));
    add(g, rbox(mw, baseTop - legH, D - 0.12, 0.03), fab2, mx, legH + (baseTop - legH) / 2, 0.02);
    // closed rear panel: base up to the back frame so the back reads solid from behind
    add(g, rbox(mw - 0.01, seatH + 0.05 - legH, backD, 0.03), fab2, mx, legH + (seatH + 0.05 - legH) / 2, z0 + backD / 2 + 0.05);
    // seat platform + seat cushion (one 34" cushion per module)
    const seatX0 = side < 0 ? mx - mw / 2 + armW : mx - mw / 2, seatX1 = side > 0 ? mx + mw / 2 - armW : mx + mw / 2;
    const sw = seatX1 - seatX0, scx = (seatX0 + seatX1) / 2;
    const sd = 24 * IN + 4 * IN, sz = D / 2 - sd / 2 - 0.02;
    add(g, rbox(sw - 0.02, seatH - 5 * IN - baseTop, sd, 0.03), fab2, scx, baseTop + (seatH - 5 * IN - baseTop) / 2, sz);
    add(g, rbox(sw - 0.04, 5 * IN, sd, 0.12), fab, scx, seatH - 2.5 * IN, sz + 0.01);
    // back: frame + deep feather back cushion + power headrest pad on top (tips back when reclined)
    const tilt = recl && side !== 0 ? -0.32 : 0;
    const back = new THREE.Group(); back.position.set(scx, seatH - 0.1, z0 + backD + 0.05); back.rotation.x = tilt; g.add(back);
    add(back, rbox(sw, H - seatH - 5 * IN + 0.1, backD, 0.05), fab2, 0, (H - seatH - 5 * IN + 0.1) / 2, -backD / 2);
    add(back, rbox(sw - 0.08, H - seatH - 3 * IN, 7 * IN, 0.13), fab, 0, (H - seatH - 3 * IN) / 2 + 0.05, 3.5 * IN);
    add(back, rbox(sw - 0.1, 6 * IN, 5 * IN, 0.1), fab, 0, H - seatH - 3.5 * IN + 0.12, 2.5 * IN);  // headrest pad
    add(back, box(sw - 0.12, 0.02, 0.02), seam, 0, H - seatH - 6.6 * IN + 0.12, 5.1 * IN);          // headrest seam
    // track arm on the outer end of each recliner (full depth, 12" wide, 28" tall)
    if (side) {
      const ax = side < 0 ? mx - mw / 2 + armW / 2 : mx + mw / 2 - armW / 2;
      add(g, rbox(armW, armH - legH, D - 0.06, 0.06), fab, ax, legH + (armH - legH) / 2, 0);
      add(g, box(0.02, 0.06, 0.14), mat('#8a8a86', { r: 0.4, m: 0.6 }), ax + side * (armW / 2 + 0.01), seatH - 0.25, D / 2 - 0.9); // power buttons
    }
    // footrest: tucked under the seat front, flips out when reclined
    if (side) {
      if (recl) {
        add(g, box(sw - 0.14, 0.1, 0.1), blk, scx, baseTop - 0.1, D / 2 + 0.35);
        add(g, rbox(sw - 0.12, 3.5 * IN, 1.3, 0.08), fab, scx, baseTop + 0.05, D / 2 + 0.7);
      } else add(g, box(sw - 0.1, 0.02, 0.02), seam, scx, baseTop + 0.4, D / 2 + 0.02);
    }
  }
  // module seams (where the three boxes butt)
  for (const x of [-W / 2 + endW, W / 2 - endW]) add(g, box(0.015, baseTop - legH - 0.04, 0.012), seam, x, legH + (baseTop - legH) / 2, D / 2 - 0.035);
  // two throw pillows on the end seats
  for (const s of [-1, 1]) add(g, rbox(1.35, 1.25, 0.35, 0.12), mat('#e9e2d6', { r: 0.9 }), s * (W / 2 - armW - 0.85), seatH + 0.62, z0 + backD + 0.9, -0.15, s * 0.2, s * 0.08);
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
  taperedLegs(g, cw - 0.1, cd - 0.15, legH, wood, 0.14, 0.05, 0.032, cx, 0); // legs under the chaise, not the sofa centre
  add(g, box(cw - 0.12, 0.1, cd - 0.2), wood, cx, legH + 0.05, 0); // rail on the legs
  add(g, rbox(cw - 0.08, 1.08 - legH, cd - 0.2, 0.03), mat(f.upholstery, { r: 0.86 }), cx, (legH + 1.08) / 2, 0);
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
  if (variant === 'lounge') {
    // mid-century "womb" lounge: moulded upholstered shell on a chrome rod base, with matching ottoman in front
    const chrome = mat('#c9ccd0', { r: 0.25, m: 0.85 });
    const up = mat(f.upholstery, { r: 0.6 });
    const shellY = 1.05, sw = W * 0.98;
    // rod base: four legs from the floor up into a rail ring that the shell sits on
    const hx = sw * 0.36, hz = D * 0.28;
    for (const [x, z] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]]) add(g, cyl(0.025, 0.02, shellY + EMBED, 8), chrome, x, (shellY + EMBED) / 2, z);
    add(g, box(hx * 2 + 0.05, 0.05, 0.05), chrome, 0, shellY, hz); add(g, box(hx * 2 + 0.05, 0.05, 0.05), chrome, 0, shellY, -hz);
    add(g, box(0.05, 0.05, hz * 2), chrome, hx, shellY, 0); add(g, box(0.05, 0.05, hz * 2), chrome, -hx, shellY, 0);
    // moulded shell: a cupped part-sphere resting on the rail, open to the front, with seat + back cushions
    const shellGeo = new THREE.SphereGeometry(1, 28, 18, Math.PI * 0.95, Math.PI * 1.1, Math.PI * 0.12, Math.PI * 0.6);
    const sh = new THREE.Mesh(shellGeo, new THREE.MeshStandardMaterial({ color: f.upholstery, roughness: 0.6, side: THREE.DoubleSide }));
    sh.scale.set(sw / 2, (H - shellY) * 0.62, D * 0.5);
    sh.rotation.set(-0.38, 0, 0);
    sh.position.set(0, shellY + (H - shellY) * 0.5, -0.05);
    sh.castShadow = sh.receiveShadow = true; g.add(sh);
    add(g, rbox(sw * 0.9, 0.2, D * 0.66, 0.08), up, 0, shellY + 0.1, 0.05);                  // shell base on the rail
    add(g, rbox(sw * 0.74, 0.24, D * 0.58, 0.1), mat(f.welt, { r: 0.6 }), 0, shellY + 0.32, 0.1); // seat cushion
    add(g, rbox(sw * 0.62, 0.8, 0.22, 0.1), mat(f.welt, { r: 0.6 }), 0, shellY + 0.95, -D * 0.22, -0.32, 0, 0);
    // ottoman (part of this item, in front)
    const oz = D / 2 + 0.85, oy = 1.05;
    for (const [x, z] of [[-0.55, -0.4], [0.55, -0.4], [-0.55, 0.4], [0.55, 0.4]]) add(g, cyl(0.022, 0.018, oy - 0.1 + EMBED, 8), chrome, x, (oy - 0.1 + EMBED) / 2, oz + z);
    add(g, rbox(1.45, 0.08, 1.05, 0.03), chrome, 0, oy - 0.08, oz);
    add(g, rbox(1.6, 0.36, 1.2, 0.14), up, 0, oy + 0.1, oz);
    return;
  }
  if (variant === 'spindle') {
    // Windsor-like
    // Windsor-like: splayed-look legs into a thick seat, H-stretcher, spindles socketed into seat + crest
    const sw = W * 0.9, sd = D * 0.78, seatT = 0.14, seatBot = seatH - 0.07 - seatT / 2;
    const L = taperedLegs(g, sw, sd, seatBot, wood, 0.16, 0.035, 0.025);
    stretchers(g, L, 0.55, 0.016, wood, 'lr');
    add(g, cyl(0.015, 0.015, L.hx * 2, 8), wood, 0, 0.55, 0, 0, 0, Math.PI / 2); // centre bar joins the side stretchers
    add(g, rbox(sw, seatT, sd, 0.03), wood, 0, seatBot + seatT / 2, 0);
    add(g, rbox(sw * 0.9, 0.1, sd * 0.85, 0.04), mat(f.upholstery, { r: 0.8 }), 0, seatBot + seatT + 0.04, 0.04);
    const spZ = -sd / 2 + 0.12, spY0 = seatBot + seatT - 0.02, crestY = H - 0.06;
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = -sw * 0.38 + t * sw * 0.76;
      add(g, cyl(0.018, 0.016, crestY - spY0, 8), wood, x, (spY0 + crestY) / 2, spZ);
    }
    add(g, rbox(sw * 0.86, 0.12, 0.09, 0.03), wood, 0, crestY, spZ);
  } else {
    taperedLegs(g, W * 0.82, D * 0.72, legH, wood, 0.14, 0.045, 0.03, 0, 0.05);
    add(g, box(W * 0.86, 0.08, D * 0.74), wood, 0, legH + 0.04, 0.05); // seat rail the legs mount into
    add(g, rbox(W, seatH - legH, D * 0.78, 0.05), mat(f.upholstery, { r: 0.84 }), 0, (legH + seatH) / 2, 0.05);
    add(g, rbox(W * 0.92, 0.4, D * 0.7, 0.06), mat(f.upholstery, { r: 0.8 }), 0, seatH + 0.08, 0.08);
    add(g, rbox(W * 0.92, H - seatH, 0.38, 0.06), mat(f.upholstery, { r: 0.82 }), 0, (seatH + H) / 2, -D / 2 + 0.28);
    for (const s of [-1, 1]) add(g, rbox(0.22, 1.15, D * 0.7, 0.05), mat(f.upholstery, { r: 0.82 }), s * (W / 2 - 0.12), seatH + 0.4, 0);
  }
}

function buildCoffeeTable(g, rec) {
  const wood = woodOf(rec);
  if (rec.variant === 'organic') {
    // single organic oval table on a solid drum pedestal (not two overlapping tops)
    const W = rec.w || 4.6, D = rec.d || 2.6;
    const ell = (w, d, h) => { const geo = cyl(0.5, 0.5, h, 40); return { geo, sx: w, sz: d }; };
    const part = (w, d, h, y, x, z, m) => { const e = ell(w, d, h); const mm = add(g, e.geo, m, x, y, z); mm.scale.set(e.sx, 1, e.sz); return mm; };
    const top = mat(WOOD[rec.wood] || WOOD.walnut, { r: 0.35 });
    part(W * 0.96, D * 0.92, 0.12, 1.22, 0, 0, top);
    part(W * 0.28, D * 0.28, 1.16, 0.58, 0, 0, wood);
    add(g, box(0.6, 0.06, 0.42), mat('#ece6dc', { r: 0.6 }), 0.15, 1.32, 0.1);
    add(g, cyl(0.08, 0.06, 0.4, 12), mat('#e8e4dc', { r: 0.2, m: 0.1 }), 0.45, 1.48, 0.05);
    return;
  }
  const stone = mat(rec.top === 'stone' ? '#d8d3ca' : (WOOD[rec.wood] || WOOD.oak), { r: rec.top === 'stone' ? 0.4 : 0.55, m: rec.top === 'stone' ? 0.08 : 0 });
  const W = rec.w || 4.2, D = rec.d || 2.3, H = rec.h || 1.5;
  const topBot = H - 0.09; // underside of the 0.1 top
  const L = taperedLegs(g, W, D, topBot, wood, 0.12, 0.05, 0.035);
  add(g, box(L.hx * 2 + 0.06, 0.08, L.hz * 2 + 0.06), wood, 0, 0.28, 0); // lower shelf, corners notched into the legs
  // apron rails run leg-to-leg and butt up under the top
  add(g, box(L.hx * 2, 0.12, 0.06), wood, 0, topBot - 0.06, L.hz);
  add(g, box(L.hx * 2, 0.12, 0.06), wood, 0, topBot - 0.06, -L.hz);
  add(g, box(0.06, 0.12, L.hz * 2), wood, L.hx, topBot - 0.06, 0);
  add(g, box(0.06, 0.12, L.hz * 2), wood, -L.hx, topBot - 0.06, 0);
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
  const L = taperedLegs(g, W, D, H - 0.08, wood, 0.1, 0.04, 0.028);
  add(g, rbox(W, 0.08, D, 0.015), wood, 0, H - 0.04, 0);
  add(g, rbox(L.hx * 2 + 0.05, 0.04, L.hz * 2 + 0.05, 0.01), wood, 0, 0.55, 0);
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

let JUTE = null;
function juteTex() { // chunky natural jute / sisal basket weave
  if (JUTE !== null || typeof document === 'undefined') return JUTE;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#a88a5c'; g.fillRect(0, 0, 256, 256);
  const n = 16, q = 256 / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const hz = (x + y) % 2 === 0, v = Math.sin((x * 31 + y * 17) * 12.9898) * 43758.5453 % 1;
    const L = 0.92 + Math.abs(v) * 0.16;
    for (let k = 0; k < 4; k++) { // four plies per block
      const shade = (k % 2 ? 0.9 : 1.04) * L;
      g.fillStyle = `rgb(${Math.min(255, 196 * shade)},${Math.min(255, 164 * shade)},${Math.min(255, 112 * shade)})`;
      if (hz) g.fillRect(x * q + 1, y * q + k * q / 4 + 1, q - 2, q / 4 - 1); else g.fillRect(x * q + k * q / 4 + 1, y * q + 1, q / 4 - 1, q - 2);
    }
    g.fillStyle = 'rgba(60,40,15,.25)'; g.fillRect(x * q, y * q, q, 1); g.fillRect(x * q, y * q, 1, q);
  }
  JUTE = new THREE.CanvasTexture(c); JUTE.wrapS = JUTE.wrapT = THREE.RepeatWrapping; JUTE.colorSpace = THREE.SRGBColorSpace;
  return JUTE;
}

function buildArt(g, rec) {
  const W = rec.w || 3.2, H = rec.h || 2.4, D = rec.d || 0.1;
  const y0 = rec.hang != null ? rec.hang : 4.4;
  const frame = mat(rec.frame || '#2a2824', { r: 0.55, m: 0.08 });
  const field = mat(rec.color || '#c4b49a', { r: 0.85 });
  const accent = mat(rec.accent || '#6d7a63', { r: 0.8 });
  add(g, box(W, H, D * 0.5), frame, 0, y0 + H / 2, -D * 0.15);
  add(g, box(W - 0.16, H - 0.16, 0.03), field, 0, y0 + H / 2, D * 0.15);
  add(g, box(W * 0.42, H * 0.28, 0.02), accent, -W * 0.12, y0 + H / 2 + H * 0.08, D * 0.2);
  add(g, box(W * 0.22, H * 0.45, 0.02), mat(rec.accent2 || '#8a6a4a', { r: 0.8 }), W * 0.18, y0 + H / 2 - H * 0.06, D * 0.2);
}

function buildRug(g, rec) {
  const W = rec.w || 8, D = rec.d || 6;
  if (rec.variant === 'jute') {
    const t = juteTex();
    let m;
    if (t) { const tt = t.clone(); tt.needsUpdate = true; tt.repeat.set(W / 1.6, D / 1.6); m = new THREE.MeshStandardMaterial({ map: tt, roughness: 1 }); } else m = mat('#b89a6a', { r: 1 });
    add(g, box(W, 0.05, D), mat('#8c6f45', { r: 1 }), 0, 0.025, 0);           // bound edge
    add(g, box(W - 0.3, 0.006, D - 0.3), m, 0, 0.053, 0);
    return;
  }
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
  const L = taperedLegs(g, W, D, H - 0.16, wood, 0.12, 0.04, 0.03);
  add(g, box(W - 0.1, 0.08, D - 0.1), wood, 0, H - 0.2, 0); // frame under the cushion
  add(g, rbox(W, 0.16, D, 0.04), mat(f.upholstery, { r: 0.82 }), 0, H - 0.08, 0);
  stretchers(g, L, 0.5, 0.025, wood, 'lr');
  add(g, box(L.hx * 2, 0.06, 0.06), wood, 0, 0.5, 0); // centre rail ends in the side stretchers
}


function buildTablescape(g, rec) {
  const W = rec.w || 6.5, D = rec.d || 3.2, H = rec.h || 2.5;
  const along = Math.min(W, rec.variant === 'round' ? Math.min(W, D) : W);
  add(g, box(Math.min(along * 0.62, 4.6), 0.015, Math.min(D * 0.32, 1.05)), mat('#efe8dc', { r: 0.92 }), 0, H + 0.012, 0);
  add(g, cyl(0.2, 0.16, 0.1, 16), mat('#efece5', { r: 0.5 }), 0, H + 0.07, 0);
  add(g, sph(0.14, 10), mat('#3d6a3a', { r: 0.72 }), 0, H + 0.18, 0);
  const seats = Math.max(2, Math.min(6, Math.round(along / 1.7)));
  const span = Math.min(along - 1.3, (seats - 1) * 1.7);
  for (let i = 0; i < seats; i++) {
    const t = seats === 1 ? 0 : (i - (seats - 1) / 2) * (span / Math.max(1, seats - 1));
    for (const s of [-1, 1]) {
      const z = s * Math.min(D * 0.28, 0.95);
      add(g, cyl(0.13, 0.13, 0.02, 16), mat('#f4f1ea', { r: 0.6 }), t, H + 0.03, z);
      add(g, cyl(0.09, 0.09, 0.012, 16), mat('#e8e2d6', { r: 0.55 }), t, H + 0.042, z);
      add(g, cyl(0.035, 0.03, 0.09, 10), mat('#d7e8ee', { r: 0.2, m: 0.12 }), t + 0.15, H + 0.08, z);
    }
  }
}

function buildDiningTable(g, rec) {
  const wood = woodOf(rec);
  const W = rec.w || 6.5, D = rec.d || 3.2, H = rec.h || 2.5;
  const variant = rec.variant || 'tapered';
  if (variant === 'round') {
    // round top on a fluted pedestal + foot, all stacked so every piece touches the next
    const R = Math.min(W, D) / 2;
    const dark = mat(WOOD[rec.wood] || WOOD.espresso, { r: 0.5 });
    add(g, cyl(R * 0.42, R * 0.48, 0.12, 32), dark, 0, 0.06, 0);
    const n = 14;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; add(g, cyl(0.07, 0.09, H - 0.24, 6), dark, Math.cos(a) * R * 0.22, 0.12 + (H - 0.24) / 2, Math.sin(a) * R * 0.22); }
    add(g, cyl(R * 0.2, R * 0.2, H - 0.24, 20), dark, 0, 0.12 + (H - 0.24) / 2, 0);
    add(g, cyl(R, R, 0.1, 48), mat(WOOD[rec.wood] || WOOD.espresso, { r: 0.42 }), 0, H - 0.07, 0);
    if (rec.setTable !== false) buildTablescape(g, rec);
    return;
  }
  if (variant === 'turned') turnedLegs(g, W, D, H - 0.12, wood, 0.16);
  else taperedLegs(g, W, D, H - 0.12, wood, 0.16, 0.065, 0.04);
  // apron: leg-to-leg, flush under the top (top underside is H - 0.12)
  const hx = W / 2 - 0.16, hz = D / 2 - 0.16;
  add(g, box(hx * 2, 0.2, 0.07), wood, 0, H - 0.22, hz);
  add(g, box(hx * 2, 0.2, 0.07), wood, 0, H - 0.22, -hz);
  add(g, box(0.07, 0.2, hz * 2), wood, hx, H - 0.22, 0);
  add(g, box(0.07, 0.2, hz * 2), wood, -hx, H - 0.22, 0);
  // chamfered top (two layers)
  add(g, rbox(W, 0.07, D, 0.02), wood, 0, H - 0.085, 0);
  add(g, rbox(W - 0.08, 0.05, D - 0.08, 0.015), mat(WOOD[rec.wood] || WOOD.oak, { r: 0.45 }), 0, H - 0.02, 0);
  if (rec.setTable !== false) buildTablescape(g, rec);
}

function buildDiningChair(g, rec) {
  const f = finishOf(rec);
  const wood = woodOf(rec);
  const W = rec.w || 1.6, D = rec.d || 1.75, H = rec.h || 3.15;
  const seatH = 1.5;
  const fr = chairFrame(g, { W, D, H, seatH, wood, slats: 5 });
  add(g, rbox(fr.sw * 0.9, 0.1, fr.sd * 0.84, 0.04), mat(f.upholstery, { r: 0.82 }), 0, seatH + 0.04, 0.04);
}

function buildBarstool(g, rec) {
  const f = finishOf(rec);
  const wood = woodOf(rec);
  const W = rec.w || 1.45, D = rec.d || 1.5, H = rec.h || 3.5;
  const seatH = 2.15; // counter height
  // footrest ring + a lower ring, all leg-to-leg; rear legs rise into the low back
  const fr = chairFrame(g, { W, D, H, seatH, wood, ring: true, footY: 0.85, footR: 0.018, legR: [0.036, 0.026], slats: 0 });
  stretchers(g, { hx: fr.hx, hz: fr.hz }, 0.35, 0.014, wood, 'lr');
  add(g, box(fr.hx * 2, 0.3, 0.05), wood, 0, H - 0.28, -fr.hz); // back panel between the posts
  add(g, rbox(fr.sw * 0.92, 0.12, fr.sd * 0.9, 0.04), mat(f.upholstery, { r: 0.8 }), 0, seatH + 0.05, 0.02);
}

function buildPendant(g, rec) {
  const metal = mat(rec.metal || '#c4a35a', { r: 0.3, m: 0.55 });
  const H = rec.h || 1.6;
  const v = rec.variant || 'bell';
  const glow = mat('#fff4d6', { r: 0.4, e: 0.9 });
  if (v === 'rattan') {
    // rectangular woven rattan shade (as staged over the island), two cords to the canopy
    const W = (rec.w || 2.6) - 0.1;
    for (const s of [-1, 1]) add(g, cyl(0.01, 0.01, 1.2, 6), metal, s * W * 0.35, 0.85, 0);
    add(g, box(W * 0.8, 0.04, 0.12), metal, 0, 1.45, 0);
    add(g, box(W, 0.55, 0.95), mat('#d6b58a', { r: 0.9 }), 0, 0.0, 0);
    add(g, box(W - 0.1, 0.5, 0.85), glow, 0, 0.0, 0);
    return;
  }
  if (v === 'sputnik') {
    // branching brass chandelier with globe-cup shades
    add(g, cyl(0.015, 0.015, 1.25, 8), metal, 0, 0.85, 0);
    add(g, cyl(0.08, 0.08, 0.04, 12), metal, 0, 1.47, 0);
    add(g, sph(0.1, 12), metal, 0, 0.2, 0);
    const arms = rec.arms || 7;
    for (let i = 0; i < arms; i++) {
      const a = (i / arms) * Math.PI * 2, L = 1.15 + (i % 2) * 0.35, e = (i % 3 - 1) * 0.25;
      const m = add(g, cyl(0.018, 0.018, L, 6), metal, Math.cos(a) * L / 2, 0.2 + e / 2, Math.sin(a) * L / 2);
      m.rotation.set(0, -a, Math.PI / 2 - Math.atan2(e, L));
      add(g, cyl(0.16, 0.06, 0.12, 14), metal, Math.cos(a) * L, 0.2 + e + 0.02, Math.sin(a) * L);
      add(g, sph(0.07, 10), glow, Math.cos(a) * L, 0.2 + e - 0.04, Math.sin(a) * L);
    }
    return;
  }
  if (v === 'linear') {
    // linear brass chandelier with hanging cylinder lights (dining)
    const W = (rec.w || 3.4) - 0.2;
    for (const s of [-1, 1]) add(g, cyl(0.01, 0.01, 1.0, 6), metal, s * W * 0.45, 0.95, 0);
    add(g, box(W, 0.06, 0.08), metal, 0, 0.45, 0);
    const n = 9;
    for (let i = 0; i < n; i++) {
      const x = -W / 2 + 0.1 + i * (W - 0.2) / (n - 1), drop = 0.25 + ((i * 7) % 4) * 0.12;
      add(g, cyl(0.008, 0.008, drop, 5), metal, x, 0.45 - drop / 2, 0);
      add(g, cyl(0.07, 0.07, 0.42, 10), mat('#1d1c1a', { r: 0.4, m: 0.4 }), x, 0.45 - drop - 0.2, 0);
      add(g, cyl(0.072, 0.072, 0.08, 10), metal, x, 0.45 - drop - 0.38, 0);
    }
    return;
  }
  if (v === 'globe') {
    add(g, cyl(0.012, 0.012, 1.2, 6), metal, 0, 0.85, 0);
    add(g, cyl(0.08, 0.08, 0.04, 12), metal, 0, 1.47, 0);
    add(g, sph(0.38, 18), mat('#f6f2ea', { r: 0.3, e: 0.5 }), 0, 0.0, 0);
    return;
  }
  add(g, cyl(0.015, 0.015, 1.1, 8), metal, 0, 0.8, 0); // this item hangs; y=0 is the canopy top? We'll position so origin is shade center and caller sets y.
  add(g, cyl(0.08, 0.08, 0.04, 12), metal, 0, 1.35, 0);
  add(g, cyl(0.32, 0.18, 0.5, 16), mat(rec.shade || '#d4b07a', { r: 0.5, m: 0.15 }), 0, 0.15, 0);
  add(g, cyl(0.02, 0.02, 0.12, 8), metal, 0, -0.15, 0);
}

function buildTv(g, rec) {
  // wall-mounted flat screen: z = mounting height of the screen bottom (default 4.4'); bracket meets the wall plane (back, -z)
  const W = rec.w || 5.3, D = rec.d || 0.3, H = W * 0.5625;
  const y0 = 4.4;
  add(g, box(1.2, 0.8, D - 0.08), mat('#2a2a2a', { r: 0.5, m: 0.4 }), 0, y0 + H / 2, -D / 2 + (D - 0.08) / 2);
  add(g, rbox(W, H, 0.08, 0.01), mat('#121314', { r: 0.25, m: 0.3 }), 0, y0 + H / 2, D / 2 - 0.04);
  add(g, box(W - 0.1, H - 0.1, 0.01), mat('#1d2630', { r: 0.1, m: 0.2 }), 0, y0 + H / 2, D / 2 + 0.002);
}

function buildCurtains(g, rec) {
  // pair of sheer drapery panels on a black rod that spans the opening and returns to the wall
  const W = rec.w || 8, H = rec.h || 8.6, D = rec.d || 0.5;
  const rod = mat(rec.metal || '#1d1d1f', { r: 0.4, m: 0.5 });
  add(g, cyl(0.03, 0.03, W, 8), rod, 0, H, 0, 0, 0, Math.PI / 2);
  for (const s of [-1, 1]) { add(g, box(0.05, 0.05, D), rod, s * (W / 2), H, -D / 2 + 0.02); }
  const sheer = new THREE.MeshStandardMaterial({ color: rec.color || '#f4f1ea', roughness: 0.95, transparent: true, opacity: 0.82, side: THREE.DoubleSide });
  const pw = Math.min(2.6, W * 0.22);
  for (const s of [-1, 1]) {
    const folds = 7;
    for (let i = 0; i < folds; i++) {
      const x = s * (W / 2 - pw / 2) + (i - (folds - 1) / 2) * (pw / folds);
      const m = add(g, box(pw / folds + 0.02, H - 0.05, 0.03), sheer, x, (H - 0.05) / 2 + 0.02, (i % 2 ? 0.06 : -0.02));
      m.rotation.y = (i % 2 ? 0.35 : -0.35);
      m.castShadow = false;
    }
  }
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
  const topCol = rec.top && rec.top.startsWith('#') ? rec.top : '#e8e4dc';
  const top = mat(topCol, { r: 0.42, m: 0.03 });
  const doorM = mat(rec.door || rec.carcass || '#e8dfd0', { r: 0.72 });
  const pull = mat(rec.metal || '#c4a35a', { r: 0.3, m: 0.55 });
  const W = rec.w || 4, D = rec.d || 2.0, H = rec.h || 3.0;
  const v = rec.variant || '';
  add(g, box(W, 0.12, D - 0.08), mat('#4a4038', { r: 0.8 }), 0, 0.06, 0.02); // toe kick
  add(g, rbox(W, H - 0.22, D - 0.08, 0.01), body, 0, (H - 0.1) / 2, 0.02);
  if (v === 'fluted' || v === 'fluted-waterfall') {
    // seating side (back, -z) and front both get vertical slats in the carcass colour
    const n = Math.floor(W / 0.16);
    for (const zs of [-1, 1]) for (let i = 0; i < n; i++) {
      const x = -W / 2 + 0.08 + i * (W - 0.16) / Math.max(1, n - 1);
      add(g, cyl(0.045, 0.045, H - 0.3, 6), doorM, x, (H - 0.18) / 2 + 0.06, zs * (D / 2 - 0.05));
    }
  } else {
    const doors = Math.max(1, Math.round(W / 1.5));
    const dw = W / doors;
    for (let i = 0; i < doors; i++) {
      const x = -W / 2 + dw / 2 + i * dw;
      add(g, rbox(dw - 0.08, H - 0.55, 0.03, 0.01), doorM, x, (H - 0.05) / 2, D / 2 - 0.08);
      add(g, rbox(dw - 0.26, H - 0.8, 0.02, 0.01), mat(rec.door || rec.carcass || '#e8dfd0', { r: 0.68 }), x, (H - 0.05) / 2, D / 2 - 0.06); // shaker panel
      add(g, cyl(0.015, 0.015, 0.4, 8), pull, x + dw * 0.32, H - 0.75, D / 2 - 0.03);
    }
  }
  add(g, rbox(W + 0.1, 0.12, D + 0.08, 0.015), top, 0, H - 0.04, -0.02);
  if (v === 'waterfall' || v === 'fluted-waterfall') {
    // stone wraps down both ends to the floor (sits on the floor, butts the top)
    for (const s of [-1, 1]) add(g, box(0.12, H - 0.1, D + 0.08), top, s * (W / 2 + 0.05 - 0.06), (H - 0.1) / 2, -0.02);
  }
}

function buildIsland(g, rec) {
  buildCounter(g, { ...rec, d: rec.d || 3 });
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
    add(g, rbox(dw - 0.08, H - 0.2, 0.03, 0.01), mat(rec.door || rec.carcass || '#e8dfd0', { r: 0.75 }), x, y0 + H / 2, D / 2 - 0.03);
    add(g, cyl(0.015, 0.015, 0.08, 8), mat(rec.metal || '#c4a35a', { r: 0.3, m: 0.5 }), x + dw * 0.22, y0 + H / 2, D / 2, Math.PI / 2, 0, 0);
  }
}

function buildDesk(g, rec) {
  const wood = woodOf(rec);
  const W = rec.w || 5.5, D = rec.d || 2.5, H = rec.h || 2.5;
  if (rec.variant === 'pedestal') {
    add(g, rbox(1.4, H - 0.08, D - 0.1, 0.02), wood, -W / 2 + 0.75, (H - 0.08) / 2, 0);
    add(g, rbox(1.4, H - 0.08, D - 0.1, 0.02), wood, W / 2 - 0.75, (H - 0.08) / 2, 0);
    add(g, box(W - 2.9, H * 0.45, 0.06), wood, 0, H - 0.09 - H * 0.225, -D / 2 + 0.12); // modesty panel ties the pedestals
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        add(g, rbox(1.2, 0.35, 0.04, 0.01), mat('#c9b496', { r: 0.65 }), s * (W / 2 - 0.75), 0.45 + i * 0.5, D / 2 - 0.08);
        add(g, box(0.16, 0.02, 0.04), mat('#c4a35a', { r: 0.3, m: 0.5 }), s * (W / 2 - 0.75), 0.45 + i * 0.5, D / 2 - 0.05);
      }
    }
  } else {
    const L = taperedLegs(g, W, D, H - 0.09, wood, 0.14, 0.05, 0.035);
    add(g, box(L.hx * 2, 0.16, 0.07), wood, 0, H - 0.17, L.hz);
    add(g, box(L.hx * 2, 0.16, 0.07), wood, 0, H - 0.17, -L.hz);
    add(g, box(0.07, 0.16, L.hz * 2), wood, L.hx, H - 0.17, 0);
    add(g, box(0.07, 0.16, L.hz * 2), wood, -L.hx, H - 0.17, 0);
  }
  add(g, rbox(W, 0.1, D, 0.015), wood, 0, H - 0.04, 0);
}

function buildDeskChair(g, rec) {
  const f = finishOf(rec);
  const metal = mat('#4a4e52', { r: 0.4, m: 0.4 });
  const W = rec.w || 2.0, D = rec.d || 2.0, H = rec.h || 3.2;
  add(g, cyl(0.18, 0.18, 0.08, 16), metal, 0, 0.14, 0); // hub
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    // spoke lies flat, running from the hub out to its caster
    add(g, box(0.78, 0.05, 0.07), metal, Math.cos(a) * 0.46, 0.14, Math.sin(a) * 0.46, 0, -a, 0);
    add(g, cyl(0.025, 0.025, 0.06, 8), metal, Math.cos(a) * 0.82, 0.1, Math.sin(a) * 0.82);
    add(g, sph(0.06, 10), mat('#1c1c1c', { r: 0.5 }), Math.cos(a) * 0.82, 0.06, Math.sin(a) * 0.82);
  }
  const seatY = 1.5, seatT = 0.14;
  add(g, cyl(0.04, 0.05, seatY - 0.14 - 0.05, 10), metal, 0, 0.14 + (seatY - 0.14 - 0.05) / 2, 0); // gas column hub → seat plate
  add(g, box(0.5, 0.06, 0.5), metal, 0, seatY - seatT / 2 - 0.02, 0); // seat plate
  add(g, rbox(W * 0.85, seatT, D * 0.7, 0.04), mat(f.upholstery, { r: 0.8 }), 0, seatY, 0.05);
  const backZ = -D * 0.3;
  add(g, box(0.16, 0.95, 0.06), metal, 0, seatY + 0.2, backZ - 0.02); // back spine from seat into the backrest
  add(g, box(0.16, 0.06, D * 0.3), metal, 0, seatY - seatT / 2 - 0.02, backZ / 2);
  add(g, rbox(W * 0.8, 1.15, 0.28, 0.05), mat(f.upholstery, { r: 0.8 }), 0, seatY + 0.72, backZ + 0.1);
  for (const s of [-1, 1]) {
    add(g, box(0.06, 0.32, 0.06), metal, s * W * 0.38, seatY + 0.2, 0.05); // arm post from the seat
    add(g, rbox(0.12, 0.08, 0.6, 0.03), mat('#2a2a2a', { r: 0.6 }), s * W * 0.38, seatY + 0.38, 0.05);
  }
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
  const tileCol = (rec.tile && String(rec.tile).replace(/^wood:/, '')) || '#e8e6e1';
  const tile = mat(tileCol, { r: 0.62 });
  const glass = new THREE.MeshStandardMaterial({ color: '#cfe6f6', roughness: 0.15, metalness: 0.05, transparent: true, opacity: 0.3 });
  const W = rec.w || 4, D = rec.d || 3.2, H = rec.h || 8;
  const floorCol = (rec.floorTile && String(rec.floorTile).replace(/^wood:/, '')) || '#d5d2cc';
  add(g, box(W, 0.08, D), mat(floorCol, { r: 0.7 }), 0, 0.04, 0);
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
  const W = rec.w || 4.5, D = rec.d || 2.3, H = rec.h || 3.3;
  const pair = W >= 3.6;
  const unitW = pair ? (W - 0.08) / 2 : W;
  const drawUnit = (cx, kind) => {
    const body = mat(kind === 'dryer' ? '#e6e8eb' : '#eef0f3', { r: 0.45, m: 0.2 });
    add(g, rbox(unitW, H, D, 0.03), body, cx, H / 2, 0);
    add(g, cyl(0.55, 0.55, 0.08, 24), mat('#9aa0a6', { r: 0.3, m: 0.3 }), cx, 1.6, D / 2 - 0.02, Math.PI / 2, 0, 0);
    add(g, cyl(0.42, 0.42, 0.04, 24), mat(kind === 'dryer' ? '#b8c0c8' : '#c5d0d8', { r: 0.2, m: 0.1 }), cx, 1.6, D / 2 + 0.02, Math.PI / 2, 0, 0);
    add(g, box(Math.max(0.4, unitW - 0.2), 0.15, 0.04), mat('#333', { r: 0.4 }), cx, H - 0.3, D / 2 + 0.01);
    if (kind === 'dryer') add(g, cyl(0.08, 0.08, 0.06, 12), mat('#555', { r: 0.4 }), cx + unitW / 2 - 0.25, H - 0.3, D / 2 + 0.04);
    else add(g, cyl(0.06, 0.06, 0.05, 12), mat('#888', { r: 0.4 }), cx - unitW / 2 + 0.25, H - 0.3, D / 2 + 0.04);
  };
  if (pair) {
    drawUnit(-W / 2 + unitW / 2, 'washer');
    drawUnit(W / 2 - unitW / 2, 'dryer');
  } else {
    drawUnit(0, 'washer');
  }
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
  add(g, box(0.25, 0.1, 3.4), steel, 0, 1.23, 0); // spine under the pad
  add(g, rbox(1.0, 0.14, 3.6, 0.03), pad, 0, 1.35, 0);
  for (const z of [1.3, -1.3]) {
    for (const x of [-0.35, 0.35]) add(g, box(0.08, 1.24, 0.08), steel, x, 0.62, z);
    add(g, box(0.78, 0.08, 0.08), steel, 0, 0.06, z); // foot bar joins each leg pair
    add(g, box(0.78, 0.08, 0.08), steel, 0, 1.2, z);
  }
  // incline pad: lower edge rests on the flat pad, upper end on a strut
  const th = 0.7, half = 0.55;
  add(g, rbox(1.0, 0.14, 1.1, 0.03), pad, 0, 1.42 + 0.07 + half * Math.sin(th), -1.0 - half * Math.cos(th), th, 0, 0);
  add(g, box(0.08, 0.47, 0.08), steel, 0, 1.42 + 0.235, -1.45);
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
    add(g, box(W - 0.16, 0.06, 0.06), steel, 0, y, 0);
    for (const s of [-1, 1]) add(g, box(0.08, 0.06, D - 0.16), steel, s * (W / 2 - 0.08), y, 0); // side rails post-to-post
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
  morroBay: { name: 'Morro Bay II 128" power dual-reclining modular sofa', category: 'living', w: 10.67, d: 3.67, h: 2.58, variants: ['upright', 'reclined'], finishes: ['beige', 'ivory', 'gray'], build: buildMorroBay },
  sofa: { name: 'Sofa', category: 'living', w: 7.67, d: 3.33, h: 2.75, variants: ['roll-arm', 'track-arm'], finishes: Object.keys(FINISHES), build: buildSofa },
  sectional: { name: 'Sectional', category: 'living', w: 9.5, d: 6.5, h: 2.75, variants: ['roll-arm', 'track-arm'], finishes: Object.keys(FINISHES), build: buildSectional },
  accentChair: { name: 'Accent chair', category: 'living', w: 2.55, d: 2.6, h: 3.05, variants: ['wing', 'spindle', 'lounge'], finishes: Object.keys(FINISHES), build: buildAccentChair },
  coffeeTable: { name: 'Coffee table', category: 'living', w: 4.2, d: 2.3, h: 1.5, variants: ['wood', 'stone', 'organic'], build: buildCoffeeTable },
  sideTable: { name: 'Side table', category: 'living', w: 1.7, d: 1.7, h: 2.1, build: buildSideTable },
  tableLamp: { name: 'Table lamp', category: 'decor', w: 1.0, d: 1.0, h: 2.15, build: buildTableLamp },
  rug: { name: 'Area rug', category: 'decor', w: 8, d: 6, h: 0.06, variants: ['plain', 'jute'], build: buildRug },
  mediaConsole: { name: 'Media console', category: 'living', w: 6, d: 1.6, h: 2.2, build: buildMediaConsole },
  plant: { name: 'Potted tree', category: 'decor', w: 2.2, d: 2.2, h: 6.2, variants: ['fiddle', 'olive'], build: buildPlant },
  art: { name: 'Wall art', category: 'decor', w: 3.2, d: 0.12, h: 2.4, build: buildArt },
  bed: { name: 'Bed', category: 'bedroom', w: 5.3, d: 6.8, h: 3.8, variants: ['upholstered', 'panel'], finishes: Object.keys(FINISHES), build: buildBed },
  nightstand: { name: 'Nightstand', category: 'bedroom', w: 1.85, d: 1.4, h: 2.25, build: buildNightstand },
  dresser: { name: 'Dresser', category: 'bedroom', w: 5.2, d: 1.7, h: 3.2, build: buildDresser },
  bench: { name: 'Bench', category: 'bedroom', w: 4.2, d: 1.45, h: 1.55, finishes: Object.keys(FINISHES), build: buildBench },
  diningTable: { name: 'Dining table', category: 'kitchen', w: 6.5, d: 3.2, h: 2.5, variants: ['tapered', 'turned', 'round'], build: buildDiningTable },
  diningChair: { name: 'Dining chair', category: 'kitchen', w: 1.6, d: 1.75, h: 3.15, finishes: Object.keys(FINISHES), build: buildDiningChair },
  barstool: { name: 'Barstool', category: 'kitchen', w: 1.45, d: 1.5, h: 3.5, finishes: Object.keys(FINISHES), build: buildBarstool },
  pendant: { name: 'Pendant light', category: 'decor', w: 1.1, d: 1.1, h: 2.2, variants: ['bell', 'globe', 'rattan', 'linear', 'sputnik'], build: buildPendant },
  tv: { name: 'Wall TV', category: 'living', w: 5.3, d: 0.3, h: 7.4, build: buildTv },
  curtains: { name: 'Sheer curtains', category: 'decor', w: 8, d: 0.5, h: 8.6, build: buildCurtains },
  range: { name: 'Range & hood', category: 'kitchen', w: 2.5, d: 2.2, h: 7.5, build: buildRange },
  fridge: { name: 'Refrigerator', category: 'kitchen', w: 3.0, d: 2.4, h: 7.0, build: buildFridge },
  sink: { name: 'Sink & faucet', category: 'kitchen', w: 2.6, d: 1.8, h: 3.2, build: buildSink },
  counterItems: { name: 'Countertop items', category: 'kitchen', w: 1.6, d: 0.8, h: 0.6, build: buildCounterItems },
  counter: { name: 'Counter', category: 'kitchen', w: 4, d: 2, h: 3, variants: ['shaker', 'waterfall'], build: buildCounter },
  island: { name: 'Kitchen island', category: 'kitchen', w: 6, d: 3, h: 3, variants: ['shaker', 'waterfall', 'fluted', 'fluted-waterfall'], build: buildIsland },
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
  washerDryer: { name: 'Washer / dryer', category: 'bath', w: 4.5, d: 2.3, h: 3.3, build: buildWasherDryer },
  powerRack: { name: 'Power rack', category: 'gym', w: 4.2, d: 4, h: 7.5, build: buildPowerRack },
  weightBench: { name: 'Weight bench', category: 'gym', w: 2.2, d: 4, h: 2.4, build: buildWeightBench },
  barbell: { name: 'Barbell', category: 'gym', w: 7.2, d: 0.8, h: 1.0, build: buildBarbell },
  dumbbellRack: { name: 'Dumbbell rack', category: 'gym', w: 3.5, d: 1.4, h: 3.2, build: buildDumbbellRack },
  outdoorLounge: { name: 'Lounge chair', category: 'patio', w: 2.4, d: 6.2, h: 1.3, finishes: Object.keys(FINISHES), build: buildOutdoorLounge },
  outdoorSofa: { name: 'Outdoor sofa', category: 'patio', w: 7.0, d: 3.2, h: 2.6, finishes: Object.keys(FINISHES), build: buildOutdoorSofa },
  outdoorDining: { name: 'Outdoor dining table', category: 'patio', w: 5.5, d: 3.0, h: 2.5, build: buildOutdoorDining },
  firepit: { name: 'Fire pit', category: 'patio', w: 3.4, d: 3.4, h: 1.2, build: buildFirepit },
  sedan: { name: 'Sedan / Hatchback', category: 'garage', w: 15.4, d: 6.2, h: 4.8, finishes: Object.keys(VEHICLE_FINISHES), build: buildSedan },
  suv: { name: 'SUV', category: 'garage', w: 16.6, d: 6.6, h: 6.2, finishes: Object.keys(VEHICLE_FINISHES), build: buildSuv },
  pickup: { name: 'Pickup Truck', category: 'garage', w: 18.4, d: 6.6, h: 6.0, finishes: Object.keys(VEHICLE_FINISHES), build: buildPickup },
  sportsCar: { name: 'Sports Car', category: 'garage', w: 14.6, d: 6.0, h: 4.2, finishes: Object.keys(VEHICLE_FINISHES), build: buildSportsCar },
};

Object.assign(CATALOG, YARD_CATALOG, FIREPLACE_CATALOG, STAIR_CATALOG, OUTBUILDING_CATALOG);

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

/** Halls, foyers, entries, and other circulation paths — not living rooms or porches. */
export function isCirculationName(name) {
  const n = String(name || '').trim();
  if (isHallName(n)) return true;
  if (/limewash/i.test(n)) return false;
  return /^(foyer|entry|entryway|vestibule|corridor|passage|passageway|gallery)$/i.test(n)
    || /\b(foyer|entryway|vestibule|corridor|passageway|gallery)\b/i.test(n)
    || /^entry(\s+hall)?$/i.test(n);
}

/** Rooms that are never treated as halls by geometry alone (they may still be halls by name). */
function isGeomHallExempt(name) {
  const n = String(name || '').trim();
  if (!n) return false;
  return /bath|powder|\bwc\b|toilet|shower|closet|wic|w\.i\.c|pantry|laundry|utility|mud|garage|\bbay\b|shop|mech|storage|attic|unfinished|safe|bed|kitchen|dining|office|living|great|family|hearth|lounge|\bden\b|exercise|gym|porch|patio|master|suite|guest|loft|nook|alcove/i.test(n);
}

function roomsAbut(a, b, eps = 0.2) {
  const oX = Math.min(a[5], b[5]) - Math.max(a[3], b[3]);
  const oY = Math.min(a[6], b[6]) - Math.max(a[4], b[4]);
  const gapX = Math.max(a[3], b[3]) - Math.min(a[5], b[5]);
  const gapY = Math.max(a[4], b[4]) - Math.min(a[6], b[6]);
  if (oX > 0.4 && gapY <= eps && gapY >= -eps) {
    const perp = (a[6] <= b[4] + eps && a[6] >= b[4] - eps) ? a[6] : a[4];
    const intoB = (perp <= (b[4] + b[6]) / 2) ? 1 : -1;
    return { horiz: true, a: Math.max(a[3], b[3]), b: Math.min(a[5], b[5]), perp, intoB };
  }
  if (oY > 0.4 && gapX <= eps && gapX >= -eps) {
    const shared = (Math.abs(a[5] - b[3]) <= eps) ? a[5] : a[3];
    const intoB = (shared <= (b[3] + b[5]) / 2) ? 1 : -1;
    return { horiz: false, a: Math.max(a[4], b[4]), b: Math.min(a[6], b[6]), perp: shared, intoB };
  }
  return null;
}

function neighborCount(room, rooms, eps = 0.2) {
  let n = 0;
  for (const other of rooms || []) {
    if (other === room || other[7]?.outside) continue;
    if (roomsAbut(room, other, eps)) n++;
  }
  return n;
}

/** Narrow connector (< ~5 ft) between two or more rooms, not a named bath/closet/etc. */
export function isGeometricCirculation(room, rooms) {
  if (!room || room[7]?.outside || isPorchLike(room)) return false;
  if (isCirculationName(room[0])) return false;
  if (isGeomHallExempt(room[0])) return false;
  const w = room[5] - room[3], d = room[6] - room[4];
  if (Math.min(w, d) >= 5 - 1e-6) return false;
  return neighborCount(room, rooms) >= 2;
}

export function isCirculationRoom(room, rooms) {
  if (!room || room[7]?.outside || isPorchLike(room)) return false;
  if (isCirculationName(room[0])) return true;
  return isGeometricCirculation(room, rooms);
}

export function circulationRects(rooms, inset = 0.15) {
  const out = [];
  for (const r of rooms || []) {
    if (!isCirculationRoom(r, rooms)) continue;
    const a = r[3] + inset, b = r[4] + inset, c = r[5] - inset, d = r[6] - inset;
    if (c > a && d > b) out.push([a, b, c, d]);
  }
  return out;
}

function mergeIntervals(ivs) {
  const a = ivs.slice().sort((p, q) => p[0] - q[0]);
  const out = [];
  for (const iv of a) {
    if (!out.length || iv[0] > out[out.length - 1][1] + 0.05) out.push(iv.slice());
    else out[out.length - 1][1] = Math.max(out[out.length - 1][1], iv[1]);
  }
  return out;
}

function subtractIntervals(span, covers) {
  let gaps = [span.slice()];
  for (const [c0, c1] of covers) {
    const next = [];
    for (const [a, b] of gaps) {
      if (c1 <= a || c0 >= b) { next.push([a, b]); continue; }
      if (c0 > a + 0.12) next.push([a, c0]);
      if (c1 < b - 0.12) next.push([c1, b]);
    }
    gaps = next;
  }
  return gaps.filter(([a, b]) => b - a >= 1.15);
}

function wallCoversOnEdge(edge, WS) {
  const walls = [...(WS?.int || []), ...(WS?.ext || [])];
  const ivs = [];
  for (const w of walls) {
    const x0 = Math.min(w[0], w[2]), x1 = Math.max(w[0], w[2]);
    const y0 = Math.min(w[1], w[3]), y1 = Math.max(w[1], w[3]);
    const wHoriz = (x1 - x0) >= (y1 - y0);
    if (wHoriz !== edge.horiz) continue;
    const mid = wHoriz ? (y0 + y1) / 2 : (x0 + x1) / 2;
    if (Math.abs(mid - edge.perp) > 0.5) continue;
    const lo = wHoriz ? x0 : y0, hi = wHoriz ? x1 : y1;
    const a = Math.max(edge.a, lo), b = Math.min(edge.b, hi);
    if (b - a > 0.2) ivs.push([a, b]);
  }
  return mergeIntervals(ivs);
}

function doorOpensOnEdge(edge, WS) {
  const ivs = [];
  for (const d of (WS?.door || [])) {
    const x0 = Math.min(d[0], d[2]), x1 = Math.max(d[0], d[2]);
    const y0 = Math.min(d[1], d[3]), y1 = Math.max(d[1], d[3]);
    const dHoriz = (x1 - x0) >= (y1 - y0);
    if (dHoriz !== edge.horiz) continue;
    const mid = dHoriz ? (y0 + y1) / 2 : (x0 + x1) / 2;
    if (Math.abs(mid - edge.perp) > 0.6) continue;
    const lo = dHoriz ? x0 : y0, hi = dHoriz ? x1 : y1;
    const a = Math.max(edge.a, lo), b = Math.min(edge.b, hi);
    if (b - a > 0.5) ivs.push([a, b]);
  }
  return ivs;
}

/**
 * 3 ft keep-out in the receiving room at every opening out of a circulation
 * space, including ~3 ft along the wall on either side of the mouth
 * (covers the gap between a fireplace and a hall entrance).
 */
export function hallwayMouthZones(rooms, WS, mouth = 3) {
  const out = [];
  const list = rooms || [];
  for (const hall of list) {
    if (!isCirculationRoom(hall, list)) continue;
    for (const rec of list) {
      if (rec === hall || rec[7]?.outside || isPorchLike(rec) || isCirculationRoom(rec, list)) continue;
      const edge = roomsAbut(hall, rec, 0.25);
      if (!edge) continue;
      const covers = wallCoversOnEdge(edge, WS);
      let opens = subtractIntervals([edge.a, edge.b], covers);
      for (const d of doorOpensOnEdge(edge, WS)) {
        if (!opens.some((iv) => !(d[1] <= iv[0] || d[0] >= iv[1]))) opens.push(d);
      }
      if (!opens.length && !covers.length) opens = [[edge.a, edge.b]];
      opens = mergeIntervals(opens);
      for (const [lo0, hi0] of opens) {
        const lo = Math.max(rec[3], rec[4] && !edge.horiz ? rec[4] : rec[3], lo0 - mouth);
        // clamp the expanded mouth to the receiving room along the edge axis
        let a, b, x0, y0, x1, y1;
        if (edge.horiz) {
          a = Math.max(rec[3], lo0 - mouth);
          b = Math.min(rec[5], hi0 + mouth);
          if (edge.intoB > 0) { y0 = edge.perp; y1 = Math.min(rec[6], edge.perp + mouth); }
          else { y0 = Math.max(rec[4], edge.perp - mouth); y1 = edge.perp; }
          x0 = a; x1 = b;
        } else {
          a = Math.max(rec[4], lo0 - mouth);
          b = Math.min(rec[6], hi0 + mouth);
          if (edge.intoB > 0) { x0 = edge.perp; x1 = Math.min(rec[5], edge.perp + mouth); }
          else { x0 = Math.max(rec[3], edge.perp - mouth); x1 = edge.perp; }
          y0 = a; y1 = b;
        }
        if (x1 - x0 > 0.3 && y1 - y0 > 0.3) out.push([x0, y0, x1, y1]);
      }
    }
  }
  return out;
}

/** Sample points along a 1-D opening so a wide cased opening is reachable at any clear stretch. */
function sampleSpan(lo, hi, step = 1.4) {
  const a = lo + Math.min(0.5, (hi - lo) / 3);
  const b = hi - Math.min(0.5, (hi - lo) / 3);
  if (b <= a) return [(lo + hi) / 2];
  const pts = [];
  for (let t = a; t <= b + 1e-6; t += step) pts.push(Math.min(t, b));
  if (pts[pts.length - 1] < b - 0.2) pts.push(b);
  return pts;
}

function doorOnRoomPerimeter(room, d) {
  const cx = (d[0] + d[2]) / 2, cy = (d[1] + d[3]) / 2;
  const x0 = room[3], y0 = room[4], x1 = room[5], y1 = room[6];
  const alongX = cx >= x0 - 0.4 && cx <= x1 + 0.4 && (Math.abs(cy - y0) <= 0.4 || Math.abs(cy - y1) <= 0.4);
  const alongY = cy >= y0 - 0.4 && cy <= y1 + 0.4 && (Math.abs(cx - x0) <= 0.4 || Math.abs(cx - x1) <= 0.4);
  return alongX || alongY;
}

/**
 * Real openings (doors or wall gaps) on a room, each with sample points
 * along the opening. A long opening is reachable if ANY sample is.
 */
export function roomOpenings(room, rooms, WS) {
  const out = [];
  if (!room) return out;
  for (const d of (WS?.door || [])) {
    if (!doorOnRoomPerimeter(room, d)) continue;
    const vert = (d[2] - d[0]) < (d[3] - d[1]);
    const pts = vert
      ? sampleSpan(Math.min(d[1], d[3]), Math.max(d[1], d[3])).map((y) => [(d[0] + d[2]) / 2, y])
      : sampleSpan(Math.min(d[0], d[2]), Math.max(d[0], d[2])).map((x) => [x, (d[1] + d[3]) / 2]);
    out.push({ pts, kind: 'door' });
  }
  for (const rec of rooms || []) {
    if (rec === room || rec[7]?.outside) continue;
    const edge = roomsAbut(room, rec, 0.25);
    if (!edge) continue;
    const covers = wallCoversOnEdge(edge, WS);
    let opens = subtractIntervals([edge.a, edge.b], covers);
    for (const d of doorOpensOnEdge(edge, WS)) {
      if (!opens.some((iv) => !(d[1] <= iv[0] || d[0] >= iv[1]))) opens.push(d);
    }
    if (!opens.length && !covers.length) opens = [[edge.a, edge.b]];
    for (const [lo, hi] of mergeIntervals(opens)) {
      if (hi - lo < 1.15) continue;
      const pts = sampleSpan(lo, hi).map((t) => edge.horiz ? [t, edge.perp] : [edge.perp, t]);
      out.push({ pts, kind: 'opening' });
    }
  }
  return out;
}

export function roomOpeningMids(room, rooms, WS) {
  const mids = [];
  for (const op of roomOpenings(room, rooms, WS)) {
    const pts = op.pts || [];
    if (!pts.length) continue;
    const mid = pts[Math.floor(pts.length / 2)];
    if (!mids.some((q) => Math.hypot(q[0] - mid[0], q[1] - mid[1]) < 1.0)) mids.push(mid);
  }
  return mids;
}

export function isWallHungType(type) {
  return type === 'art' || type === 'tv';
}

function wallFace(w) {
  const x0 = Math.min(w[0], w[2]), x1 = Math.max(w[0], w[2]);
  const y0 = Math.min(w[1], w[3]), y1 = Math.max(w[1], w[3]);
  const horiz = (x1 - x0) >= (y1 - y0);
  const thick = Math.max(0.2, horiz ? (y1 - y0) : (x1 - x0));
  const mid = horiz ? (y0 + y1) / 2 : (x0 + x1) / 2;
  const a = horiz ? x0 : y0, b = horiz ? x1 : y1;
  return { horiz, thick, mid, a, b, x0, y0, x1, y1 };
}

/** True when two wall rectangles share a centerline and overlap along it. */
export function wallRefMatches(ref, w, pad = 0.45) {
  if (!ref || !w) return false;
  const a = [ref.x0, ref.y0, ref.x1, ref.y1];
  const ax0 = Math.min(a[0], a[2]), ax1 = Math.max(a[0], a[2]);
  const ay0 = Math.min(a[1], a[3]), ay1 = Math.max(a[1], a[3]);
  const bx0 = Math.min(w[0], w[2]), bx1 = Math.max(w[0], w[2]);
  const by0 = Math.min(w[1], w[3]), by1 = Math.max(w[1], w[3]);
  const overlapX = Math.min(ax1, bx1) + pad >= Math.max(ax0, bx0);
  const overlapY = Math.min(ay1, by1) + pad >= Math.max(ay0, by0);
  const midY = Math.abs(((ay0 + ay1) / 2) - ((by0 + by1) / 2));
  const midX = Math.abs(((ax0 + ax1) / 2) - ((bx0 + bx1) / 2));
  return (midY <= 0.2 && overlapX) || (midX <= 0.2 && overlapY);
}

export function wallStillExists(ref, WS) {
  if (!ref || !WS) return false;
  for (const kind of ['int', 'ext']) {
    for (const w of (WS[kind] || [])) if (wallRefMatches(ref, w)) return true;
  }
  return false;
}

function openingOnWall(opening, w) {
  return wallRefMatches({ x0: opening[0], y0: opening[1], x1: opening[2], y1: opening[3] }, w, 0.4);
}

function hangSpanClear(w, WS, along0, along1) {
  const f = wallFace(w);
  const lo = Math.min(along0, along1), hi = Math.max(along0, along1);
  for (const k of ['door', 'win']) {
    for (const o of (WS?.[k] || [])) {
      if (!openingOnWall(o, w)) continue;
      const oa = f.horiz ? Math.min(o[0], o[2]) : Math.min(o[1], o[3]);
      const ob = f.horiz ? Math.max(o[0], o[2]) : Math.max(o[1], o[3]);
      if (Math.min(hi, ob) - Math.max(lo, oa) > 0.25) return false;
    }
  }
  return true;
}

function wallRefOf(w, kind) {
  return { kind, x0: +w[0], y0: +w[1], x1: +w[2], y1: +w[3] };
}

/**
 * Hang a thin wall item flush on the interior face of a real wall segment
 * of an interior room. Never returns a pose for porches, exterior space, or
 * an edge that has no wall (those used to leave art floating by porch posts).
 */
export function hangOnInteriorWall(room, WS, itemW, itemD, opts = {}) {
  if (!room || !WS) return null;
  const o = room[7] || {};
  const n = room[0] || '';
  if (o.outside || isPorchLike(room) || isCirculationName(n)) return null;
  const rx0 = room[3], ry0 = room[4], rx1 = room[5], ry1 = room[6];
  const rcx = (rx0 + rx1) / 2, rcy = (ry0 + ry1) / 2;
  const prefer = opts.preferKind;
  const nearX = opts.x, nearY = opts.y;
  const candidates = [];
  for (const kind of ['int', 'ext']) {
    (WS[kind] || []).forEach((w, index) => {
      const f = wallFace(w);
      const len = f.b - f.a;
      if (len < itemW + 0.6) return;
      const alongRoom = f.horiz
        ? (f.mid >= ry0 - 0.5 && f.mid <= ry1 + 0.5 && Math.min(f.b, rx1) - Math.max(f.a, rx0) >= itemW + 0.5)
        : (f.mid >= rx0 - 0.5 && f.mid <= rx1 + 0.5 && Math.min(f.b, ry1) - Math.max(f.a, ry0) >= itemW + 0.5);
      if (!alongRoom) return;
      const sign = f.horiz ? (Math.sign(rcy - f.mid) || 1) : (Math.sign(rcx - f.mid) || 1);
      // Item must sit inside this room, not on the far (outside / neighbor) face.
      const inside = f.horiz
        ? (sign > 0 ? rcy > f.mid - 0.05 : rcy < f.mid + 0.05)
        : (sign > 0 ? rcx > f.mid - 0.05 : rcx < f.mid + 0.05);
      if (!inside) return;
      const overlapA = f.horiz ? Math.max(f.a, rx0) : Math.max(f.a, ry0);
      const overlapB = f.horiz ? Math.min(f.b, rx1) : Math.min(f.b, ry1);
      let along = (overlapA + overlapB) / 2;
      if (nearX != null && nearY != null) {
        along = f.horiz ? nearX : nearY;
      }
      const half = itemW / 2 + 0.3;
      along = Math.max(overlapA + half, Math.min(overlapB - half, along));
      if (!hangSpanClear(w, WS, along - itemW / 2, along + itemW / 2)) return;
      const innerFace = f.mid + sign * (f.thick / 2);
      const centerOff = innerFace + sign * (itemD / 2 + 0.02);
      const x = f.horiz ? along : centerOff;
      const y = f.horiz ? centerOff : along;
      // Face into the room (same convention as againstWall).
      const rot = f.horiz ? (sign > 0 ? 0 : 180) : (sign > 0 ? 270 : 90);
      let score = (kind === 'int' ? 20 : 0) + Math.min(20, overlapB - overlapA);
      if (prefer && prefer === kind) score += 8;
      if (nearX != null && nearY != null) score -= Math.hypot(x - nearX, y - nearY);
      candidates.push({ x, y, rot, kind, index, wallRef: wallRefOf(w, kind), score });
    });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] || null;
}

export function snapWallDecor(type, x, y, rooms, WS) {
  if (!isWallHungType(type)) return null;
  const t = CATALOG[type] || {};
  const itemW = t.w || 3.2, itemD = t.d || 0.12;
  let room = (rooms || []).find((r) => !r[7]?.outside && !isPorchLike(r) && !isCirculationName(r[0])
    && x > r[3] && x < r[5] && y > r[4] && y < r[6]);
  if (!room) {
    // click may land in the wall thickness; pick the nearest interior room
    let best = null, bestD = 3;
    for (const r of (rooms || [])) {
      if (r[7]?.outside || isPorchLike(r) || isCirculationName(r[0])) continue;
      const cx = Math.max(r[3], Math.min(r[5], x)), cy = Math.max(r[4], Math.min(r[6], y));
      const d = Math.hypot(x - cx, y - cy);
      if (d < bestD) { bestD = d; room = r; }
    }
  }
  if (!room) return null;
  return hangOnInteriorWall(room, WS, itemW, itemD, { x, y });
}

/** Place a plant in a room corner, inset from walls and away from door swings and walk paths. */
export function plantCornerAwayFromDoors(room, WS, w = 2.0, d = 2.0) {
  if (!room) return null;
  if (isCirculationName(room[0]) || isPorchLike(room) || room[7]?.outside) return null;
  const x0 = room[3], y0 = room[4], x1 = room[5], y1 = room[6];
  const insetX = 0.55 + w / 2, insetY = 0.55 + d / 2;
  if (x1 - x0 < insetX * 2 + 0.4 || y1 - y0 < insetY * 2 + 0.4) return null;
  const corners = [
    { x: x0 + insetX, y: y0 + insetY, rot: 0 },
    { x: x1 - insetX, y: y0 + insetY, rot: 0 },
    { x: x0 + insetX, y: y1 - insetY, rot: 0 },
    { x: x1 - insetX, y: y1 - insetY, rot: 0 },
  ];
  const zones = typeof doorwayZones === 'function' ? doorwayZones(WS, 2.2, 0.2) : [];
  const doors = typeof doorsOnRoom === 'function' ? doorsOnRoom(room, WS) : [];
  const doorPts = doors.map((h) => {
    const r = h.rect || [0, 0, 0, 0];
    return [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];
  });
  let best = null, bestScore = -1e9;
  for (const c of corners) {
    const rec = { x: c.x, y: c.y, w, d, rot: c.rot };
    const rect = itemRect(rec);
    if (zones.some((z) => rect[0] < z[2] && rect[2] > z[0] && rect[1] < z[3] && rect[3] > z[1])) continue;
    if (typeof clearanceHit === 'function' && clearanceHit(rect, [room], WS, 0.05)) continue;
    const minDoor = doorPts.reduce((m, p) => Math.min(m, Math.hypot(c.x - p[0], c.y - p[1])), 99);
    if (minDoor < 2.4) continue;
    if (minDoor > bestScore) { bestScore = minDoor; best = c; }
  }
  return best;
}

export function hallwayRects(rooms, inset = 0.2) {
  return circulationRects(rooms, inset);
}

export function doorwayZones(WS, walk = 2.4, edge = 0.15) {
  const zones = [];
  for (const d of (WS?.door || [])) {
    const r = [d[0], d[1], d[2], d[3]];
    const vert = (r[2] - r[0]) < (r[3] - r[1]);
    const walkR = vert
      ? [r[0] - walk, r[1] - edge, r[2] + walk, r[3] + edge]
      : [r[0] - edge, r[1] - walk, r[2] + edge, r[3] + walk];
    zones.push({ door: r, walk: walkR, kind: 'doorway' });
  }
  return zones;
}

/**
 * Door clearances plus a 3–6 ft walk path from an exterior / porch door
 * out across the porch to the steps or far edge, so sofas and rails cannot
 * sit in front of an entry.
 */
export function doorApproachZones(rooms, WS, walk = 3, edge = 0.15) {
  const zones = doorwayZones(WS, walk, edge);
  const at = (x, y) => (rooms || []).find((r) => x > r[3] && x < r[5] && y > r[4] && y < r[6]) || null;
  for (const d of (WS?.door || [])) {
    const r = [d[0], d[1], d[2], d[3]];
    const vert = (r[2] - r[0]) < (r[3] - r[1]);
    const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
    const doorW = vert ? (r[3] - r[1]) : (r[2] - r[0]);
    const pathW = Math.max(3.2, Math.min(doorW, 6.0));
    const probes = vert
      ? [[cx - 2, cy, -1, 0], [cx + 2, cy, 1, 0]]
      : [[cx, cy - 2, 0, -1], [cx, cy + 2, 0, 1]];
    for (const [px, py, dx, dy] of probes) {
      const room = at(px, py);
      if (!room || !(isPorchLike(room) || room[7]?.outside)) continue;
      const far = vert ? (dx < 0 ? room[3] : room[5]) : (dy < 0 ? room[4] : room[6]);
      const start = vert ? cx : cy;
      const span = Math.abs(far - start);
      if (span < 1) continue;
      const end = start + (vert ? dx : dy) * Math.min(span, 12);
      const half = pathW / 2;
      const walkR = vert
        ? [Math.min(cx, end) - edge, cy - half, Math.max(cx, end) + edge, cy + half]
        : [cx - half, Math.min(cy, end) - edge, cx + half, Math.max(cy, end) + edge];
      zones.push({ door: r, walk: walkR, kind: 'approach' });
    }
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

export function clearanceHit(rect, rooms, WS, margin = 0.1, opts = {}) {
  const r = [rect[0] + margin, rect[1] + margin, rect[2] - margin, rect[3] - margin];
  if (r[2] <= r[0] || r[3] <= r[1]) return { kind: 'tight' };
  if (!opts.ignoreHall) {
    for (const h of circulationRects(rooms, 0.15)) {
      const iv = intersect(r, h);
      if (iv && area(iv) > 0.2) return { kind: 'hallway' };
    }
    for (const h of hallwayMouthZones(rooms, WS, 3)) {
      const iv = intersect(r, h);
      if (iv && area(iv) > 0.2) return { kind: 'hallway' };
    }
  }
  if (!opts.ignoreDoor) {
    const zones = (rooms && rooms.length)
      ? doorApproachZones(rooms, WS, 3.0, 0.05)
      : doorwayZones(WS, 3.0, 0.05);
    for (const z of zones) {
      const iv = intersect(r, z.walk);
      if (iv && area(iv) > 0.35) return { kind: 'doorway' };
    }
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
    hw: opts.hw || undefined,
    stairFinish: opts.stairFinish || undefined,
    rail: opts.rail || undefined,
    dir: opts.dir || undefined,
    level: opts.level || undefined,
    levelH: opts.levelH != null ? +opts.levelH : undefined,
    body: opts.body || undefined,
    trim: opts.trim || undefined,
    roofColor: opts.roofColor || undefined,
    chaise: opts.chaise,
    top: opts.top,
    pillow: opts.pillow,
    duvet: opts.duvet,
    hood: opts.hood,
    onCounter: opts.onCounter,
    upper: opts.upper,
    z: opts.z != null ? +opts.z : 0,
    pitch: opts.pitch != null ? +opts.pitch : undefined,
    along: opts.along,
    panels: opts.panels,
    poolKind: opts.poolKind || opts.variant,
    h: opts.h != null ? +opts.h : undefined,
    sizeKey: opts.sizeKey,
    color: opts.color,
    field: opts.field,
    carcass: opts.carcass,
    door: opts.door,
    metal: opts.metal,
    shade: opts.shade,
    ceil: opts.ceil != null ? +opts.ceil : undefined,
    fuel: t.fuels ? (t.fuels.includes(opts.fuel) ? opts.fuel : t.defaultFuel) : undefined,
    pot: opts.pot,
    hang: opts.hang,
    accent: opts.accent,
    accent2: opts.accent2,
    frame: opts.frame,
    dress: opts.dress,
    setTable: opts.setTable,
    wallRef: opts.wallRef && typeof opts.wallRef === 'object' ? {
      kind: opts.wallRef.kind === 'ext' ? 'ext' : 'int',
      x0: +opts.wallRef.x0, y0: +opts.wallRef.y0,
      x1: +opts.wallRef.x1, y1: +opts.wallRef.y1,
    } : undefined,
    open: sanitizeStairOpen(opts.open),
  };
}
function sanitizeStairOpen(open) {
  if (!open) return undefined;
  if (Array.isArray(open) && open.length >= 4 && open.slice(0, 4).every(Number.isFinite)) {
    const x0 = Math.min(+open[0], +open[2]), y0 = Math.min(+open[1], +open[3]);
    const x1 = Math.max(+open[0], +open[2]), y1 = Math.max(+open[1], +open[3]);
    const out = [x0, y0, x1, y1];
    if (open[4] != null && Number.isFinite(+open[4])) out.z = +open[4];
    return out;
  }
  if (typeof open === 'object') {
    const x0 = +open.x0, y0 = +open.y0, x1 = +open.x1, y1 = +open.y1;
    if (![x0, y0, x1, y1].every(Number.isFinite)) return undefined;
    const out = [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)];
    if (open.z != null && Number.isFinite(+open.z)) out.z = +open.z;
    return out;
  }
  return undefined;
}

export function buildItemMesh(rec, ctx) {
  const t = CATALOG[rec.type];
  if (!t) return null;
  const g = new THREE.Group();
  g.userData.itemId = rec.id;
  g.userData.item = rec;
  if (rec.wallRef) g.userData.wallRef = rec.wallRef;
  t.build(g, rec, ctx);
  // hang pendants from a typical ceiling
  if (rec.type === 'pendant') g.position.y = 0; // builder already uses local y; we'll lift the group below
  const typ = CATALOG[rec.type] || t;
  const baseZ = rec.z || 0;
  let lift = rec.type === 'pendant' ? baseZ + ((ctx?.ceiling || 8.2) - 2.0) : baseZ;
  if (rec.type === 'pendant') {
    // carry the cord all the way up so the fixture hangs from the ceiling (or a beam) instead of floating
    const top = (rec.ceil || ctx?.ceiling || 8.2) - lift;
    const brass = new THREE.MeshStandardMaterial({ color: rec.metal || '#c4a35a', roughness: 0.3, metalness: 0.55 });
    if (top > 1.45) {
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, top - 1.4, 6), brass);
      cord.position.set(0, 1.4 + (top - 1.4) / 2, 0); g.add(cord);
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 14), brass);
      can.position.set(0, top - 0.03, 0); g.add(can);
    }
  }
  if (typ.mount === 'roof' && rec.z != null) lift = rec.z;
  const { Wx, Wz } = ctx;
  g.position.set(Wx(rec.x), lift, Wz(rec.y));
  g.rotation.y = -((rec.rot || 0) * Math.PI) / 180;
  if (typ.mount === 'roof' && rec.pitch && rec.along !== 'lock') {
    // rec.pitch is the roof slope in degrees; along 'x' means ridge runs east-west (tilt around X).
    const rad = (rec.pitch * Math.PI) / 180;
    if (rec.along === 'y') g.rotation.z += rad;
    else g.rotation.x -= rad;
  }
  if (typ.mount === 'roof') g.userData.mount = 'roof';
  return g;
}

export function isPorchLike(room) {
  if (!room) return false;
  const n = (String(room[0] || '') + ' ' + String(room[2] || '')).toLowerCase();
  return !!(room[7] && room[7].outside) || /porch|patio|deck|terrace/.test(n);
}
export function isCoveredPorch(room) {
  if (!isPorchLike(room)) return false;
  const n = String(room[0] || '').toLowerCase();
  if (/uncovered|open patio|open deck/.test(n)) return false;
  if (/patio|deck|terrace/.test(n) && !/cover|porch/.test(n)) return false;
  return /porch|cover/.test(n) || String(room[2] || '') === 'porch';
}
export function isOutdoorItem(type) {
  const t = CATALOG[type] || {};
  const c = t.category;
  return !!t.outdoor || c === 'garage' || c === 'patio' || c === 'pool' || c === 'solar' || c === 'site' || c === 'outbuilding';
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

const SKIP_ROOMS = /closet|wic|w\.i\.c|pantry|garage|bay |shop|mech|safe|attic|unfinished|storage/i;

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
    const ro = currentRoom?.[7] || {};
    const loftZ = (ro.loft || ro.noFloor) ? (ro.deckZ ?? ro.loftZ ?? 10.55) : 0;
    const rec = makeItem(type, { z: loftZ, ...opts });
    // Loft items sit above main-floor door swings and halls.
    if (!(rec.z > 7.5) && clearanceHit(itemRect(rec), rooms, WS, 0.05, { ignoreHall: rec.type === 'rug' || rec.type === 'pendant' || rec.type === 'curtains' || isWallHungType(rec.type), ignoreDoor: rec.type === 'rug' || rec.type === 'pendant' || rec.type === 'curtains' || isWallHungType(rec.type) })) return null;
    if (currentRoom && !roomContains(currentRoom, rec)) return null;
    items.push(rec);
    return rec;
  };

  for (const room of rooms) {
    currentRoom = room;
    const [name, , , , , , , o = {}] = room;
    if (o.noAuto) continue; // the model furnishes this room itself
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
        const a = againstWall(room, wall, 4.5, 2.3, 0.4);
        put('washerDryer', { ...a, w: 4.5, d: 2.3 });
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

    if (/entry|foyer/i.test(n)) {
      put('rug', { x: cx, y: cy, w: Math.min(rw - 1, 8), d: Math.min(rd - 1, 6), color: '#c4b8a4', field: '#e4ddd0' });
      const wall = longestWallWithoutDoor(room, doors);
      const b = againstWall(room, wall, Math.min(4.8, (wall === 'n' || wall === 's' ? rw : rd) - 1), 1.6, 0.35);
      put('mudBench', { ...b, w: Math.min(4.8, (wall === 'n' || wall === 's' ? rw : rd) - 1.2) });
      // Plants stay out of foyers and other circulation paths.
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
      // default living / great-room sofa: Morro Bay II 128" modular power recliner (when the wall fits it)
      if ((wall === 'n' || wall === 's' ? rw : rd) >= 12.2) {
        const mb = againstWall(room, wall, 10.67, 3.67, 0.7);
        seat = put('morroBay', { ...mb, w: 10.67, d: 3.67, finish: 'beige', variant: 'upright' });
      }
      if (!seat && useSectional) {
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
      const corner = plantCornerAwayFromDoors(room, WS, 2.2, 2.2);
      if (corner) put('plant', { ...corner, variant: 'fiddle' });
      continue;
    }

    if (/loft/i.test(n)) {
      const wall = longestWallWithoutDoor(room, doors) || 'n';
      const bw = Math.min(6.6, rw - 1.4), bd = Math.min(5.2, rd - 1.2);
      const bed = againstWall(room, wall, bw, bd, 0.45);
      put('bed', { ...bed, w: bw, d: bd });
      const br = bed.rot || 0;
      put('nightstand', { x: bed.x + Math.cos(br * Math.PI / 180) * (bw / 2 + 0.7), y: bed.y + Math.sin(br * Math.PI / 180) * (bw / 2 + 0.7), rot: br });
      if (rw * rd >= 70) put('dresser', againstWall(room, wall === 'n' || wall === 's' ? 'e' : 's', 3.2, 1.6, 0.4));
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
      if (clearanceHit(itemRect(rec), rooms, WS, 0.02, { ignoreHall: rec.type === 'rug' || rec.type === 'pendant' || rec.type === 'curtains' || isWallHungType(rec.type), ignoreDoor: rec.type === 'rug' || rec.type === 'pendant' || rec.type === 'curtains' || isWallHungType(rec.type) })) return null;
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


function vehiclePaint(rec, fallback) {
  const f = VEHICLE_FINISHES[rec.finish];
  return (f && f.paint) || rec.color || fallback;
}

function addWheel(g, x, z, rad = 0.72, width = 0.32, col = '#1a1a1a') {
  const tire = mat(col, { r: 0.55, m: 0.15 });
  const rim = mat('#c8c8cc', { r: 0.35, m: 0.55 });
  add(g, cyl(rad, rad, width, 16), tire, x, rad, z, 0, 0, Math.PI / 2);
  add(g, cyl(rad * 0.42, rad * 0.42, width + 0.04, 12), rim, x, rad, z, 0, 0, Math.PI / 2);
}

function buildSedan(g, rec) {
  const W = rec.w || 15.4, D = rec.d || 6.2;
  const body = mat(vehiclePaint(rec, '#8a8680'), { r: 0.38, m: 0.5 });
  const glass = mat('#7ea0b8', { r: 0.12, m: 0.2 });
  add(g, box(W * 0.96, 1.55, D * 0.88), body, 0, 1.35, 0);
  add(g, box(W * 0.48, 0.4, D * 0.8), body, -W * 0.12, 2.3, 0); // hood
  add(g, box(W * 0.5, 2.0, D * 0.8), body, W * 0.08, 3.15, 0); // cabin
  add(g, box(W * 0.42, 1.7, D * 0.72), glass, W * 0.08, 3.25, 0);
  add(g, box(0.12, 0.7, D * 0.64), mat('#cfc8b8', { r: 0.4, m: 0.3 }), -W / 2 + 0.08, 1.5, 0);
  add(g, box(0.1, 0.45, 0.35), mat('#f4f0d8', { r: 0.3 }), -W / 2 + 0.02, 1.55, -D * 0.22);
  add(g, box(0.1, 0.45, 0.35), mat('#f4f0d8', { r: 0.3 }), -W / 2 + 0.02, 1.55, D * 0.22);
  add(g, box(0.1, 0.4, 0.35), mat('#a03030', { r: 0.5 }), W / 2 - 0.04, 1.7, -D * 0.22);
  add(g, box(0.1, 0.4, 0.35), mat('#a03030', { r: 0.5 }), W / 2 - 0.04, 1.7, D * 0.22);
  const wx = W * 0.32, wz = D * 0.42;
  for (const x of [-wx, wx]) for (const z of [-wz, wz]) addWheel(g, x, z, 0.7, 0.34);
}

function buildSuv(g, rec) {
  const W = rec.w || 16.6, D = rec.d || 6.6;
  const body = mat(vehiclePaint(rec, '#161616'), { r: 0.72, m: 0.15 });
  const glass = mat('#5a6a72', { r: 0.15, m: 0.15 });
  const blk = mat('#0d0d0d', { r: 0.5, m: 0.2 });
  add(g, box(W * 0.96, 2.2, D * 0.9), body, 0, 1.95, 0);
  add(g, box(W * 0.42, 0.4, D * 0.84), body, -W * 0.16, 3.25, 0);
  add(g, box(W * 0.55, 2.3, D * 0.84), body, W * 0.1, 4.25, 0);
  add(g, box(W * 0.46, 1.9, D * 0.72), glass, W * 0.1, 4.35, 0);
  add(g, box(0.18, 1.2, D * 0.5), blk, -W / 2 + 0.1, 2.0, 0);
  add(g, box(0.1, 0.45, 0.38), mat('#e8e4d4', { r: 0.3 }), -W / 2 + 0.02, 2.05, -D * 0.22);
  add(g, box(0.1, 0.45, 0.38), mat('#e8e4d4', { r: 0.3 }), -W / 2 + 0.02, 2.05, D * 0.22);
  add(g, box(W * 0.48, 0.12, 0.12), blk, W * 0.06, 5.55, -D * 0.34); // roof rails
  add(g, box(W * 0.48, 0.12, 0.12), blk, W * 0.06, 5.55, D * 0.34);
  const wx = W * 0.3, wz = D * 0.42;
  for (const x of [-wx, wx]) for (const z of [-wz, wz]) addWheel(g, x, z, 0.84, 0.4);
}

function buildPickup(g, rec) {
  const W = rec.w || 18.4, D = rec.d || 6.6;
  const body = mat(vehiclePaint(rec, '#3f3f46'), { r: 0.45, m: 0.35 });
  const glass = mat('#6a7a84', { r: 0.15, m: 0.2 });
  const bed = mat('#2a2c2e', { r: 0.7, m: 0.1 });
  add(g, box(W * 0.96, 1.7, D * 0.88), body, 0, 1.7, 0);
  add(g, box(W * 0.38, 2.15, D * 0.84), body, -W * 0.18, 3.55, 0); // cab
  add(g, box(W * 0.28, 1.7, D * 0.72), glass, -W * 0.16, 3.7, 0);
  add(g, box(W * 0.46, 1.15, D * 0.82), bed, W * 0.22, 2.55, 0); // bed walls
  add(g, box(W * 0.42, 0.12, D * 0.7), mat('#3a3d42', { r: 0.8 }), W * 0.22, 2.05, 0); // bed floor
  add(g, box(0.14, 1.1, D * 0.5), mat('#111', { r: 0.5 }), -W / 2 + 0.1, 1.8, 0);
  add(g, box(0.1, 0.45, 0.38), mat('#f4f0d8', { r: 0.3 }), -W / 2 + 0.02, 1.85, -D * 0.22);
  add(g, box(0.1, 0.45, 0.38), mat('#f4f0d8', { r: 0.3 }), -W / 2 + 0.02, 1.85, D * 0.22);
  const wx = W * 0.32, wz = D * 0.42;
  for (const x of [-wx, wx]) for (const z of [-wz, wz]) addWheel(g, x, z, 0.82, 0.38);
}

function buildSportsCar(g, rec) {
  const W = rec.w || 14.6, D = rec.d || 6.0;
  const body = mat(vehiclePaint(rec, '#7a1c1c'), { r: 0.22, m: 0.65 });
  const glass = mat('#4a6080', { r: 0.1, m: 0.25 });
  add(g, box(W * 0.96, 1.15, D * 0.86), body, 0, 1.05, 0);
  add(g, box(W * 0.55, 0.35, D * 0.8), body, -W * 0.12, 1.75, 0); // long hood
  add(g, box(W * 0.36, 1.15, D * 0.78), body, W * 0.12, 2.2, 0);
  add(g, box(W * 0.28, 0.95, D * 0.68), glass, W * 0.1, 2.3, 0);
  add(g, box(0.16, 0.45, D * 0.62), mat('#111', { r: 0.4 }), -W / 2 + 0.08, 1.1, 0);
  add(g, box(0.08, 0.28, 0.4), mat('#f8fbff', { r: 0.2, m: 0.2 }), -W / 2 + 0.02, 1.15, -D * 0.22);
  add(g, box(0.08, 0.28, 0.4), mat('#f8fbff', { r: 0.2, m: 0.2 }), -W / 2 + 0.02, 1.15, D * 0.22);
  const wx = W * 0.3, wz = D * 0.4;
  for (const x of [-wx, wx]) for (const z of [-wz, wz]) addWheel(g, x, z, 0.62, 0.32);
}


const DRESS_PALETTES = {
  default: { rug: '#b7a68c', field: '#d8cfc0', art: '#c4b49a', accent: '#6d7a63', accent2: '#8a6a4a', frame: '#2a2824', pot: '#c9b49a', plant: 'fiddle', wood: 'walnut' },
  modern: { rug: '#d9d6d0', field: '#f0eeea', art: '#e8e6e1', accent: '#2c2c2c', accent2: '#8a8a8a', frame: '#1a1a1a', pot: '#4a4a4a', plant: 'olive', wood: 'oak' },
  scandinavian: { rug: '#e8e2d6', field: '#f7f3ec', art: '#efe8dc', accent: '#8aa0a8', accent2: '#c9d4c8', frame: '#d7d2c8', pot: '#efece5', plant: 'olive', wood: 'oak' },
  'warm-luxury': { rug: '#6e3b2e', field: '#c4a574', art: '#e8dcc8', accent: '#3d2b20', accent2: '#c9a45c', frame: '#3d2b20', pot: '#3d2b20', plant: 'fiddle', wood: 'walnut' },
  'nordic-modern': { rug: '#ddd5c6', field: '#efe9de', art: '#e9e2d4', accent: '#1c1a17', accent2: '#c08a4e', frame: '#1c1a17', pot: '#2a2724', plant: 'olive', wood: 'oak' },
  'english-country': { rug: '#c4b8a4', field: '#e4ddd0', art: '#e4ddd0', accent: '#8c927c', accent2: '#d4b07a', frame: '#8c927c', pot: '#c9b49a', plant: 'olive', wood: 'oak' },
};

function dressOverlaps(a, b, pad = 0.12) {
  const ra = itemRect(a), rb = itemRect(b);
  return ra[0] < rb[2] - pad && ra[2] > rb[0] + pad && ra[1] < rb[3] - pad && ra[3] > rb[1] + pad;
}

/** Add missing designer decor to every room, including ones the model furnished itself. Does not replace existing items. */
export function dressRooms(M, WS, existing, styleId, opts = {}) {
  const pal = DRESS_PALETTES[styleId] || DRESS_PALETTES.default;
  const wallDecor = !!opts.wallDecor;
  const rooms = M.rooms || [];
  const items = (existing || []).slice();
  const extra = [];
  const add = (type, opts, room) => {
    const ro = room?.[7] || {};
    const loftZ = (ro.loft || ro.noFloor) ? (ro.deckZ ?? ro.loftZ ?? 10.55) : 0;
    const rec = makeItem(type, { z: loftZ, dress: true, ...opts });
    if (room) {
      const r = itemRect(rec);
      const pad = type === 'rug' ? 0.05 : 0.08;
      if (r[0] < room[3] + pad || r[1] < room[4] + pad || r[2] > room[5] - pad || r[3] > room[6] - pad) return null;
    }
    if (!(rec.z > 7.5) && clearanceHit(itemRect(rec), rooms, WS, type === 'rug' ? 0.02 : 0.05, { ignoreHall: type === 'rug' || type === 'pendant' || type === 'curtains' || isWallHungType(type), ignoreDoor: type === 'rug' || type === 'pendant' || type === 'curtains' || isWallHungType(type) })) return null;
    const collide = items.some((it) => {
      if (type === 'rug' && it.type !== 'rug') return false;
      if (type === 'art' && (it.type === 'rug' || it.type === 'tableLamp' || it.type === 'deskLamp')) return false;
      if ((type === 'tableLamp' || type === 'deskLamp') && it.type === 'rug') return false;
      if (type === 'counterItems') return it.type === 'counterItems';
      return dressOverlaps(rec, it, type === 'plant' ? 0.2 : 0.12);
    });
    if (collide) return null;
    items.push(rec); extra.push(rec); return rec;
  };

  for (const room of rooms) {
    const [name, , , x0, y0, x1, y1, o = {}] = room;
    const n = name || '';
    if (o.outside && !/porch|patio|terrace|screen/i.test(n)) continue;
    if (/garage|\bbay\b|shop|mech|safe|attic|unfinished|storage|closet|wic|w\.i\.c|pantry/i.test(n) && !/mud|laundry|utility/i.test(n)) continue;
    const rw = x1 - x0, rd = y1 - y0;
    if (rw < 5 || rd < 5) continue;
    const here = items.filter((it) => it.x > x0 && it.x < x1 && it.y > y0 && it.y < y1 && !(it.z > 7.5 && !((o.loft || o.noFloor))));
    const has = (t) => here.some((it) => it.type === t);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const living = /living|family|great|hearth|lounge|\bden\b|dining|entry|foyer/i.test(n);
    const sleeping = /bed|primary|master|suite|guest|loft/i.test(n);
    const kitchen = /kitchen|kitchenette/i.test(n);

    if ((living || sleeping) && !has('rug') && Math.min(rw, rd) >= 6) {
      add('rug', { x: cx, y: cy, w: Math.min(rw - 2, living ? 10 : 8), d: Math.min(rd - 2, living ? 8 : 6), color: pal.rug, field: pal.field, variant: styleId === 'scandinavian' ? 'jute' : 'plain' }, room);
    }
    const circulation = isCirculationName(n) || isPorchLike(room) || !!o.outside;
    if (!has('plant') && !circulation && Math.min(rw, rd) >= 7 && !/bath|powder|laundry|toilet/i.test(n)) {
      const spot = plantCornerAwayFromDoors(room, WS, 2.0, 2.0);
      if (spot) add('plant', { ...spot, variant: pal.plant, pot: pal.pot }, room);
    }
    if (wallDecor && !circulation && !/bath|powder|laundry|toilet|kitchen|garage|\bbay\b/i.test(n) && Math.min(rw, rd) >= 6) {
      const living = /living|family|great|hearth|lounge|\bden\b/i.test(n);
      if (living && !has('tv')) {
        const tvHang = hangOnInteriorWall(room, WS, 5.3, 0.3);
        if (tvHang) add('tv', { x: tvHang.x, y: tvHang.y, rot: tvHang.rot, wallRef: tvHang.wallRef }, room);
      }
      if (!has('art')) {
        const artW = Math.min(3.6, Math.min(rw, rd) * 0.35);
        const artHang = hangOnInteriorWall(room, WS, artW, 0.12);
        // Don't cover a TV on the same stretch of wall.
        if (artHang && !here.some((it) => it.type === 'tv' && Math.hypot(it.x - artHang.x, it.y - artHang.y) < 4)
            && !extra.some((it) => it.type === 'tv' && Math.hypot(it.x - artHang.x, it.y - artHang.y) < 4)) {
          add('art', { x: artHang.x, y: artHang.y, rot: artHang.rot, w: artW, color: pal.art, accent: pal.accent, accent2: pal.accent2, frame: pal.frame, wallRef: artHang.wallRef }, room);
        }
      }
    }
    if (sleeping) {
      for (const ns of here.filter((it) => it.type === 'nightstand')) {
        if (here.some((it) => (it.type === 'tableLamp' || it.type === 'deskLamp') && Math.hypot(it.x - ns.x, it.y - ns.y) < 1.6)) continue;
        add('tableLamp', { x: ns.x, y: ns.y, rot: ns.rot }, room);
      }
    }
    if (living) {
      for (const st of here.filter((it) => it.type === 'sideTable')) {
        if (here.some((it) => it.type === 'tableLamp' && Math.hypot(it.x - st.x, it.y - st.y) < 1.6)) continue;
        add('tableLamp', { x: st.x, y: st.y, rot: st.rot }, room);
      }
    }
    if (kitchen && !has('counterItems')) {
      const host = here.find((it) => it.type === 'island') || here.find((it) => it.type === 'counter');
      if (host) add('counterItems', { x: host.x, y: host.y, rot: host.rot, onCounter: true }, room);
    }
  }
  return extra;
}
