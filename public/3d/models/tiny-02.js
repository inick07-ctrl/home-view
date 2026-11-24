// Tiny 02 — Duskfen Loft. Original PeakStead design inspired by modern
// Scandinavian park-model tinies with dark vertical siding, a shed
// clerestory, and a wall of glass (not a copy of any trademarked model).
// Plan feet: x east, y south. FRONT = south. 34' x 10', plus a 5' entry deck.
import { makeWalls } from '../lib.js';

const w = makeWalls();
const L = 34, Wd = 10, HN = 13.2, HS = 9.0;
const XK = 14, XB = 22, XU = 28;
const YD = Wd + 5; // deck south

// North (high clerestory wall)
w.seg(0, 0, L, 0, { ext: true, h: HN, windows: [[1.5, 6.5, 8.6, 12.4], [8, 13, 8.6, 12.4], [15, 20.5, 8.6, 12.4], [23.5, 27, 8.6, 12.4], [29.5, 32.8, 8.6, 12.4]] });
// South (view wall + entry)
w.seg(0, Wd, L, Wd, {
  ext: true, h: HS,
  doors: [[3.2, 6.4, 7.6]],
  windows: [[7.2, 13.4, 0.4, 8.4], [15.2, 20.8, 3.0, 7.4], [23, 27, 3.6, 7.4], [29.5, 32.8, 3.6, 7.4]],
});
w.seg(0, 0, 0, Wd, { ext: true, h: HN, windows: [[1.5, 8.5, 0.4, 8.6]] });
w.seg(L, 0, L, Wd, { ext: true, h: HS, windows: [[2.5, 7.5, 3.2, 7.4]] });
// Living | kitchen: wide cased opening, stubs only
w.seg(XK, 0, XK, 1.0, { h: HS });
w.seg(XK, 9.0, XK, Wd, { h: HS });
// Kitchen | bath + a door to the bath, opening stays clear
w.seg(XB, 0, XB, Wd, { h: HS, doors: [[1.0, 3.4, 7]] });
// Bath | utility
w.seg(XU, 0, XU, Wd, { h: HS, doors: [[1.0, 3.2, 6.8]] });

export default {
  id: 'tiny-02',
  name: 'Duskfen Loft',
  title: 'Duskfen Loft',
  subtitle: 'A sleek Nordic tiny home with dark siding, a clerestory roofline, a wall of glass, and a sleeping loft.',
  wallH: HS,
  defaultStyle: 'default',
  buildType: 'tiny',
  walkStart: [4.8, 16.5, 0],
  materials: { ext: '#2a2d31', int: '#f4f1ea', roofTex: 'metal', roofUnder: '#c9c2b6', gable: 'ext', extSkin: true },
  walls: w,
  rooms: [
    ['Living', '14\'-0" x 10\'-0"', 'wood', 0, 0, XK, Wd, { vaulted: true }],
    ['Kitchen', '8\'-0" x 10\'-0"', 'wood', XK, 0, XB, Wd],
    ['Bath', '6\'-0" x 10\'-0"', 'tile', XB, 0, XU, Wd],
    ['Utility', '6\'-0" x 10\'-0"', 'tile', XU, 0, L, Wd, { minor: true }],
    ['Sleeping Loft', '20\'-0" x 5\'-0"', 'wood', XK, 0, L, 5.0, { noFloor: true, loft: true, deckZ: 7.16, labelZ: 8.6, labelAt: [25, 2.4] }],
    ['Deck', '10\'-0" x 5\'-0"', 'porch', 0, Wd, 14, YD, { outside: true, minor: true }],
  ],
  slabs: [[-0.3, -0.3, L + 0.3, Wd + 0.3], [-0.2, Wd, 14.2, YD + 0.15]],
  ceilings: [
    [XK, 0, L, Wd, 6.9],
  ],
  roofs: [
    { shed: true, x0: 0, y0: 0, x1: L, y1: Wd, hi: HN, lo: HS, oh: 0.7 },
    { shed: true, x0: 0, y0: Wd, x1: 14, y1: YD, hi: 8.6, lo: 7.6, oh: 0.35 },
  ],
  areas: { heated: 500, garage: 0, porch: 70 },
  furnish(k) {
    const CREAM = '#ece7dc', CHAR = '#1f2226', WOOD = 'wood', TILE = '#d5dadc';
    // Galley run along the north wall of the kitchen
    k.block(XK + 0.2, 0.15, XB - 0.2, 2.05, 0, 3.0, CREAM, { solid: true });
    k.block(XK + 0.2, 0.15, XB - 0.2, 2.05, 3.0, 3.14, CHAR);
    // Spa bath: soaker along the east, vanity west
    k.block(XB + 0.2, 5.4, XU - 0.2, 9.75, 0, 0.08, TILE);
    k.block(XB + 0.2, 0.2, XB + 2.4, 4.6, 0, 2.55, CREAM, { solid: true });
    k.block(XB + 0.2, 0.2, XB + 2.4, 4.6, 2.55, 2.68, '#d8dde0');
    // Loft deck over kitchen/bath/utility, open to the living at the west
    k.block(XK + 2.0, 0.08, L - 0.08, Wd - 0.08, 6.95, 7.16, WOOD);
    k.block(XK + 2.0, 0.08, XK + 2.16, 3.2, 7.16, 9.2, WOOD);
    k.block(XK + 2.0, 6.8, XK + 2.16, Wd - 0.08, 7.16, 9.2, WOOD);
    // Ladder at the living/kitchen opening (placeable, removable item: Edit Plan → Stairs)
    k.place && k.place('stairLadder', { x: (XK - 0.05 + XK + 1.95) / 2, y: (3.55 + 5.55) / 2, rot: 0, w: 2.0, d: 2.0, dir: 'up', level: true, levelH: 7.16, rail: 'black', open: [XK, 0.08, XK + 2.0, 5.0, 7.16] });
    // Dark vertical battens on the long south wall, between openings
    for (const x of [0.4, 1.6, 7.0, 13.7, 14.6, 21.3, 22.2, 27.4, 28.3, 33.5]) {
      k.block(x - 0.04, Wd - 0.02, x + 0.04, Wd + 0.06, 0, HS, CHAR);
    }
    // Deck posts and simple steps
    k.block(0.35, YD - 0.35, 0.7, YD, 0, 7.4, CHAR, { solid: true });
    k.block(13.3, YD - 0.35, 13.65, YD, 0, 7.4, CHAR, { solid: true });
    k.block(3.0, YD, 6.6, YD + 1.3, -0.35, 0, CHAR);
  },
};
