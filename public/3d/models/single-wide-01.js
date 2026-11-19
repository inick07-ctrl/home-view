// Single-Wide 01 — manufactured home, about 16' x 76', 3 bed and 2 bath.
// Architecture only: no furniture and no cars. Plan feet: x east, y south. FRONT = south.
import { makeWalls } from '../lib.js';

const w = makeWalls();
const H = 8;
// Exterior
w.seg(0, 0, 76, 0, { ext: true, windows: [[3, 8, 3, 6.5], [11, 16, 3, 6.5], [22, 27, 3.5, 6.8], [40, 45, 3, 6.5], [52, 57, 3, 6.5], [65, 71, 3, 6.5]] });
w.seg(0, 16, 76, 16, { ext: true, doors: [[24, 27.2, 7]], windows: [[4, 9, 3, 6.5], [12, 17, 3, 6.5], [43, 47.5, 3, 6.5], [53, 57.5, 3, 6.5], [64, 70, 3, 6.5]] });
w.seg(0, 0, 0, 16, { ext: true, windows: [[4, 12, 3, 6.5]] });
w.seg(76, 0, 76, 16, { ext: true, windows: [[3, 8, 3, 6.5]] });
// Living | kitchen/dining — wide opening
w.seg(20, 0, 20, 3.5);
w.seg(20, 13, 20, 16);
// Kitchen/dining/utility line at x=32 — opening into the west hall
w.seg(32, 0, 32, 6);
w.seg(32, 10, 32, 16);
// Utility | west hall
w.seg(32, 6, 38, 6);
// West hall | bath 1
w.seg(32, 10, 38, 10, { doors: [[33.5, 36.3, 7]] });
// East edge of utility/bath, bedrooms start — hall continues along the north
w.seg(38, 4, 38, 16);
// Hall | bedrooms (doors into Bed 2 and Bed 3)
w.seg(38, 4, 62, 4, { doors: [[42, 45, 7], [54, 57, 7]] });
// Bed 2 | Bed 3
w.seg(50, 4, 50, 16);
// Hall / Bed 3 | master suite
w.seg(62, 0, 62, 16, { doors: [[0.6, 3.6, 7]] });
// Master | bath + closet
w.seg(62, 11, 76, 11, { doors: [[63.2, 66.2, 7], [71.2, 74.2, 7]] });
// Master bath | WIC
w.seg(70, 11, 70, 16);
// Bath 1 east wall already at x=38. Porch is outside (no walls required).

export default {
  id: 'single-wide-01',
  name: "Lakeshore Longhouse",
  title: "Lakeshore Longhouse",
  subtitle: "A long, single-wide home with three bedrooms, two baths, and a front porch.",
  wallH: H,
  defaultStyle: 'english-country',
  buildType: 'trailer',
  walkStart: [25.6, 18.8, 0],
  planImage: { src: new URL('./single-wide-01-plan.png', import.meta.url).href, pxPerFt: 14, originPx: [84, 112], sizePx: [1232, 420] },
  materials: { ext: '#ebe4d4', int: '#f3efe6', roofTex: 'shingle', roofUnder: '#d8c7a8', gable: 'ext', extSkin: true },
  walls: w,
  rooms: [
    ['Living', '20\'-0" x 16\'-0"', 'wood', 0, 0, 20, 16, { vaulted: true }],
    ['Kitchen', '12\'-0" x 9\'-0"', 'wood', 20, 0, 32, 9],
    ['Dining', '12\'-0" x 7\'-0"', 'wood', 20, 9, 32, 16],
    ['Utility', '6\'-0" x 6\'-0"', 'tile', 32, 0, 38, 6, { minor: true }],
    ['Hall', '', 'wood', 32, 6, 38, 10, { minor: true, noLabel: true }],
    ['Bath 1', '6\'-0" x 6\'-0"', 'tile', 32, 10, 38, 16],
    ['Hall', '24\'-0" x 4\'-0"', 'wood', 38, 0, 62, 4, { minor: true }],
    ['Bedroom 2', '12\'-0" x 12\'-0"', 'wood', 38, 4, 50, 16],
    ['Bedroom 3', '12\'-0" x 12\'-0"', 'wood', 50, 4, 62, 16],
    ['Master Bedroom', '14\'-0" x 11\'-0"', 'wood', 62, 0, 76, 11],
    ['Master Bath', '8\'-0" x 5\'-0"', 'tile', 62, 11, 70, 16],
    ['WIC', '6\'-0" x 5\'-0"', 'wood', 70, 11, 76, 16, { minor: true }],
    ['Porch', '8\'-0" x 4\'-0"', 'porch', 8, 16, 16, 20, { outside: true }],
  ],
  slabs: [[-0.4, -0.4, 76.4, 16.4], [8, 16, 16, 20]],
  roofs: [
    { x0: 0, y0: 0, x1: 76, y1: 16, pitch: 0.35, oh: 1, eave: H, ends: ['ext', 'ext'] },
    { shed: true, x0: 8, y0: 16, x1: 16, y1: 20, hi: 8.2, lo: 7.2, oh: 0.4 },
  ],
  areas: { heated: 1216, garage: 0, porch: 32 },
  furnish(k) {
    // Built-ins and skirting only. No furniture and no cars.
    const CREAM = '#e8dcc6', SKIRT = '#5c5146', POST = '#d8c8a8';
    // Kitchen counters along the north wall
    k.block(20.3, 0.2, 31.7, 2.1, 0, 3, CREAM, { solid: true });
    k.block(20.3, 0.2, 31.7, 2.1, 3, 3.15, '#2b2c2e');
    // Vanities
    k.block(32.25, 13.4, 35.4, 15.8, 0, 2.6, CREAM, { solid: true });
    k.block(62.25, 13.5, 66.4, 15.8, 0, 2.6, CREAM, { solid: true });
    // Skirting under the box (sited manufactured home)
    k.block(-0.15, -0.15, 76.15, 0.2, -1.6, 0, SKIRT);
    k.block(-0.15, 15.8, 76.15, 16.15, -1.6, 0, SKIRT);
    k.block(-0.15, -0.15, 0.2, 16.15, -1.6, 0, SKIRT);
    k.block(75.8, -0.15, 76.15, 16.15, -1.6, 0, SKIRT);
    // Porch posts
    for (const x of [8.3, 15.7]) k.block(x - 0.2, 19.55, x + 0.2, 19.95, 0, 7.4, POST);
  },
};
