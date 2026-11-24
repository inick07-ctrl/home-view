// Tiny 03 — Tamarack Porch. Original PeakStead park-model cabin inspired by
// rustic timber Vermont tinies with a covered porch, steep gable, and a
// private main-floor bedroom (not a copy of any trademarked model).
// Plan feet: x east, y south. FRONT = south. 36' x 12' plus an 8' porch.
import { makeWalls } from '../lib.js';

const w = makeWalls();
const L = 36, Wd = 12, H = 9;
const XK = 13, XB = 22, XBR = 28;
const YP = Wd + 8;

// Exterior
w.seg(0, 0, L, 0, { ext: true, windows: [[2, 6.5, 2.6, 7.2], [8, 11.5, 2.6, 7.2], [15, 19.5, 3, 7.2], [30, 34, 2.6, 7.4]] });
w.seg(0, Wd, L, Wd, {
  ext: true,
  doors: [[4.2, 7.4, 7.6]],
  windows: [[8.5, 12, 3, 7], [15, 19.5, 3, 7], [23.5, 26.5, 3.5, 6.8], [30, 34, 2.6, 7.2]],
});
w.seg(0, 0, 0, Wd, { ext: true, windows: [[2.5, 9.5, 2.6, 7.2]] });
w.seg(L, 0, L, Wd, { ext: true, windows: [[2.5, 9.5, 2.6, 7.4]] });
// Living | kitchen: open cased opening
w.seg(XK, 0, XK, 1.05);
w.seg(XK, 10.95, XK, Wd);
// Kitchen | hall/bath — door into the hall, clear of counters
w.seg(XB, 0, XB, Wd, { doors: [[0.6, 3.5, 6.9]] });
// Hall | bedroom
w.seg(XBR, 0, XBR, Wd, { doors: [[0.6, 3.5, 6.9]] });
// Bath south of the hall (hall is the north 4' of the 22–28 bay)
w.seg(XB, 4.2, XBR, 4.2, { doors: [[23.1, 26.3, 6.8]] });

export default {
  id: 'tiny-03',
  name: 'Tamarack Porch',
  title: 'Tamarack Porch',
  subtitle: 'A rustic timber tiny cabin with a covered front porch, a steep gable, a private bedroom, and a loft overhang.',
  wallH: H,
  defaultStyle: 'english-country',
  buildType: 'tiny',
  walkStart: [5.8, 22, 0],
  materials: { ext: '#c8a878', int: '#f6f0e6', roofTex: 'shingle', roofUnder: '#d2c3a8', gable: 'ext', extSkin: true },
  walls: w,
  rooms: [
    ['Living', '13\'-0" x 12\'-0"', 'wood', 0, 0, XK, Wd, { vaulted: true }],
    ['Kitchen', '9\'-0" x 12\'-0"', 'wood', XK, 0, XB, Wd],
    ['Hall', '6\'-0" x 4\'-2"', 'wood', XB, 0, XBR, 4.2, { minor: true }],
    ['Bath', '6\'-0" x 7\'-10"', 'tile', XB, 4.2, XBR, Wd],
    ['Bedroom', '8\'-0" x 12\'-0"', 'wood', XBR, 0, L, Wd],
    ['Sleeping Loft', '12\'-4" x 5\'-6"', 'wood', 0.4, 3.2, XK - 0.4, 8.8, { noFloor: true, loft: true, deckZ: 7.22, labelZ: 9.0, labelAt: [6.5, 6] }],
    ['Covered Porch', '16\'-0" x 8\'-0"', 'porch', 2, Wd, 18, YP, { outside: true }],
  ],
  slabs: [[-0.3, -0.3, L + 0.3, Wd + 0.3], [1.7, Wd, 18.3, YP + 0.15]],
  ceilings: [
    [XK, 0, L, Wd, H],
  ],
  roofs: [
    { x0: 0, y0: 0, x1: L, y1: Wd, pitch: 0.9, oh: 1.0, eave: H, ends: ['ext', 'ext'] },
    { shed: true, x0: 2, y0: Wd, x1: 18, y1: YP, hi: 8.6, lo: 7.4, oh: 0.4 },
  ],
  areas: { heated: 540, garage: 0, porch: 128 },
  furnish(k) {
    const CREAM = '#efe6d4', WOOD = '#8a5a32', TIM = '#5c3d24';
    // Kitchen: north run + a short peninsula / bar toward the living
    k.block(XK + 0.2, 0.15, XB - 0.2, 2.15, 0, 3.0, CREAM, { solid: true });
    k.block(XK + 0.2, 0.15, XB - 0.2, 2.15, 3.0, 3.14, '#2c2c2e');
    // Loft over the living, open toward the kitchen
    k.block(0.12, 0.1, XK - 0.15, Wd - 0.1, 7.00, 7.22, 'wood');
    k.block(XK - 0.28, 0.1, XK - 0.12, 3.4, 7.22, 9.3, 'wood');
    k.block(XK - 0.28, 8.6, XK - 0.12, Wd - 0.1, 7.22, 9.3, 'wood');
    // Ladder at the loft's east edge (placeable, removable item: Edit Plan → Stairs)
    k.place && k.place('stairLadder', { x: (XK - 0.05 + XK + 1.7) / 2, y: (4.4 + 6.4) / 2, rot: 0, w: 1.75, d: 2.0, dir: 'up', level: true, levelH: 7.22, rail: 'wood' });
    // Porch posts and beam
    for (const x of [2.3, 10, 17.5]) k.block(x - 0.18, YP - 0.35, x + 0.18, YP, 0, 7.6, TIM, { solid: true });
    k.block(2.1, YP - 0.3, 17.7, YP, 7.6, 8.0, TIM);
    k.block(4.0, YP, 7.6, YP + 1.2, -0.3, 0, TIM);
  },
};
