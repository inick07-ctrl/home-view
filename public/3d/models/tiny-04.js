// Tiny 04 — Wrenwood Cabin. Original PeakStead cozy cabin-style tiny home
// inspired by Amish-built park-model cabins with a front porch, dormered
// gable, a hearth, and bar seating (not a copy of any trademarked model).
// Plan feet: x east, y south. FRONT = south. 32' x 12' plus a front porch.
import { makeWalls } from '../lib.js';

const w = makeWalls();
const L = 32, Wd = 12, H = 9;
const XK = 13, XH = 20, XBR = 25;
const YP = Wd + 8;

w.seg(0, 0, L, 0, { ext: true, windows: [[2, 6.5, 2.6, 7.2], [8, 11.5, 2.6, 7.2], [15, 18.5, 3, 7.2], [27, 30.5, 2.6, 7.4]] });
w.seg(0, Wd, L, Wd, {
  ext: true,
  doors: [[3.5, 6.7, 7.6]],
  windows: [[8, 12, 3, 7], [14.5, 18.5, 3, 7], [21.2, 24, 3.5, 6.8], [27, 30.5, 2.6, 7.2]],
});
w.seg(0, 0, 0, Wd, { ext: true, windows: [[2.4, 9.6, 2.6, 7.2]] });
w.seg(L, 0, L, Wd, { ext: true, windows: [[2.4, 9.6, 2.6, 7.4]] });
// Living | kitchen: open
w.seg(XK, 0, XK, 1.05);
w.seg(XK, 10.95, XK, Wd);
// Kitchen | hall
w.seg(XH, 0, XH, Wd, { doors: [[0.6, 3.4, 6.9]] });
// Hall | bedroom
w.seg(XBR, 0, XBR, Wd, { doors: [[0.6, 3.4, 6.9]] });
// Bath south of hall
w.seg(XH, 4.5, XBR, 4.5, { doors: [[21.1, 24.0, 6.8]] });

export default {
  id: 'tiny-04',
  name: 'Wrenwood Cabin',
  title: 'Wrenwood Cabin',
  subtitle: 'A cozy cabin-style tiny home with a covered porch, a dormered gable, a fireplace, and a kitchen bar.',
  wallH: H,
  defaultStyle: 'english-country',
  buildType: 'tiny',
  walkStart: [5.1, 22, 0],
  materials: { ext: '#c4a574', int: '#f7f1e6', roofTex: 'shingle', roofUnder: '#d4c4a8', gable: 'ext', extSkin: true },
  walls: w,
  rooms: [
    ['Living', '13\'-0" x 12\'-0"', 'wood', 0, 0, XK, Wd, { vaulted: true }],
    ['Kitchen', '7\'-0" x 12\'-0"', 'wood', XK, 0, XH, Wd],
    ['Hall', '5\'-0" x 4\'-6"', 'wood', XH, 0, XBR, 4.5, { minor: true }],
    ['Bath', '5\'-0" x 7\'-6"', 'tile', XH, 4.5, XBR, Wd],
    ['Bedroom', '7\'-0" x 12\'-0"', 'wood', XBR, 0, L, Wd],
    ['Covered Porch', '18\'-0" x 8\'-0"', 'porch', 1, Wd, 19, YP, { outside: true }],
  ],
  slabs: [[-0.3, -0.3, L + 0.3, Wd + 0.3], [0.8, Wd, 19.2, YP + 0.15]],
  ceilings: [
    [XK, 0, L, Wd, H],
  ],
  roofs: [
    { x0: 0, y0: 0, x1: L, y1: Wd, pitch: 0.75, oh: 1.0, eave: H, ends: ['ext', 'ext'] },
    // Small dormer on the south slope over the kitchen
    { x0: 14, y0: 6, x1: 20, y1: 14.5, along: 'y', pitch: 0.7, oh: 0.4, eave: 8.4, ends: [null, 'ext'] },
    { shed: true, x0: 1, y0: Wd, x1: 19, y1: YP, hi: 8.5, lo: 7.3, oh: 0.35 },
  ],
  areas: { heated: 384, garage: 0, porch: 144 },
  furnish(k) {
    const CREAM = '#efe6d4', TIM = '#5a3c26';
    // Kitchen north run + a bar along the living opening
    k.block(XK + 0.2, 0.15, XH - 0.2, 2.15, 0, 3.0, CREAM, { solid: true });
    k.block(XK + 0.2, 0.15, XH - 0.2, 2.15, 3.0, 3.14, '#2c2c2e');
    k.block(XK + 0.15, 7.7, XK + 2.0, 11.8, 0, 3.55, CREAM, { solid: true });
    k.block(XK + 0.15, 7.7, XK + 2.0, 11.8, 3.55, 3.68, '#2c2c2e');
    // Fireplace on the west wall of the living room
    k.place && k.place('fpMasonry36', { x: 1.1, y: 6.0, rot: 270, w: 3.4, d: 2.3, h: 8.4, variant: 'stone' });
    // Porch posts
    for (const x of [1.3, 10, 18.6]) k.block(x - 0.18, YP - 0.35, x + 0.18, YP, 0, 7.5, TIM, { solid: true });
    k.block(1.15, YP - 0.3, 18.8, YP, 7.5, 7.95, TIM);
    k.block(3.3, YP, 6.9, YP + 1.2, -0.3, 0, TIM);
  },
};
