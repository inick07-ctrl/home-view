// Tiny 01 — THOW, about 8.5' x 24' on a trailer, with a loft over the
// kitchenette and bath. Architecture only: no furniture and no cars.
// Plan feet: x east, y south. FRONT = south (curbside door). Hitch is west.
import { makeWalls } from '../lib.js';

const w = makeWalls();
const H = 11.5;
// Exterior
w.seg(0, 0, 24, 0, { ext: true, h: H, windows: [[2, 5, 3, 6.5], [7, 10, 3, 6.5], [13, 16.5, 3, 6.5], [19.5, 22, 4, 6.5]] });
w.seg(0, 8.5, 24, 8.5, { ext: true, h: H, doors: [[3.5, 6.5, 7]], windows: [[8, 10.8, 3, 6.5], [13, 16.5, 3, 6.5], [20, 22.5, 4, 6.5]] });
w.seg(0, 0, 0, 8.5, { ext: true, h: H, windows: [[2.2, 6.3, 3, 6.5]] });
w.seg(24, 0, 24, 8.5, { ext: true, h: H, windows: [[3.8, 6.8, 4, 6.5]] });
// Living | kitchenette — wide opening
w.seg(11.5, 0, 11.5, 1.1);
w.seg(11.5, 7.4, 11.5, 8.5);
// Kitchenette | closet + bath
w.seg(18.5, 0, 18.5, 8.5, { doors: [[0.4, 2.85, 6.8], [4.7, 7.5, 6.8]] });
// Closet | bath
w.seg(18.5, 3.25, 24, 3.25);

export default {
  id: 'tiny-01',
  name: "Pine Nook",
  title: "Pine Nook",
  subtitle: "A tiny house on wheels, with a loft over the kitchenette and bath.",
  wallH: H,
  defaultStyle: 'english-country',
  buildType: 'tiny',
  walkStart: [5, 11.2, 0],
  planImage: { src: new URL('./tiny-01-plan.png', import.meta.url).href, pxPerFt: 28, originPx: [196, 84], sizePx: [1120, 504] },
  materials: { ext: '#ebe4d4', int: '#f3efe6', roofTex: 'shingle', roofUnder: '#d8c7a8', gable: 'ext', extSkin: true },
  walls: w,
  rooms: [
    ['Living', '11\'-6" x 8\'-6"', 'wood', 0, 0, 11.5, 8.5, { vaulted: true }],
    ['Kitchenette', '7\'-0" x 8\'-6"', 'wood', 11.5, 0, 18.5, 8.5],
    ['Bath', '5\'-6" x 5\'-3"', 'tile', 18.5, 3.25, 24, 8.5],
    ['Closet', '5\'-6" x 3\'-3"', 'wood', 18.5, 0, 24, 3.25, { minor: true }],
    ['Loft', '12\'-6" x 8\'-6"', 'wood', 11.5, 0, 24, 8.5, { noFloor: true, loft: true, labelZ: 8.3, labelAt: [18.2, 4.25] }],
  ],
  slabs: [[-0.3, -0.3, 24.3, 8.8]],
  ceilings: [
    [11.5, 0, 24, 8.5, 6.85],
  ],
  roofs: [
    { x0: 0, y0: 0, x1: 24, y1: 8.5, pitch: 0.5, oh: 0.7, eave: H, ends: ['ext', 'ext'] },
  ],
  areas: { heated: 310, garage: 0, porch: 0 },
  furnish(k) {
    // Built-ins and trailer gear only. No furniture and no cars.
    const STEEL = '#4a4e54', STEEL2 = '#2e3236', WOOD = 'wood', CREAM = '#e8dcc6', TILE = '#cfd4d8';
    // Galley counter along the north wall of the kitchenette
    k.block(11.7, 0.2, 18.3, 2.05, 0, 3, CREAM, { solid: true });
    k.block(11.7, 0.2, 18.3, 2.05, 3, 3.15, '#2b2c2e');
    // Bath: shower pan east, vanity west
    k.block(21.3, 3.5, 23.85, 8.3, 0, 0.08, TILE);
    k.block(18.7, 5.3, 21.0, 8.3, 0, 2.6, CREAM, { solid: true });
    k.block(18.7, 5.3, 21.0, 8.3, 2.6, 2.72, '#d8dde0');
    // Loft deck (starts 2' in so a ladder can reach it) and a low rail
    k.block(13.5, 0.08, 23.92, 8.42, 6.9, 7.12, WOOD);
    k.block(13.5, 0.08, 13.68, 3.15, 7.12, 9.1, WOOD);
    k.block(13.5, 5.35, 13.68, 8.42, 7.12, 9.1, WOOD);
    k.block(13.5, 0.08, 23.92, 0.26, 7.12, 8.7, WOOD);
    k.block(13.5, 8.24, 23.92, 8.42, 7.12, 8.7, WOOD);
    // Ladder at the west edge of the loft, mid-width
    for (let i = 0; i < 7; i++) {
      const z = 0.4 + i * 0.95;
      k.block(11.7, 3.35, 13.45, 5.15, z, z + 0.1, STEEL2);
    }
    k.block(11.7, 3.3, 11.85, 3.45, 0, 7.0, STEEL2);
    k.block(11.7, 5.05, 11.85, 5.2, 0, 7.0, STEEL2);
    k.block(13.3, 3.3, 13.48, 3.45, 0, 7.1, STEEL2);
    k.block(13.3, 5.05, 13.48, 5.2, 0, 7.1, STEEL2);
    // Trailer frame, tongue, and wheels (architecture, not vehicles)
    k.block(0, 1.7, 24, 2.15, -1.15, -0.55, STEEL);
    k.block(0, 6.35, 24, 6.8, -1.15, -0.55, STEEL);
    k.block(-5.2, 3.85, 0.2, 4.65, -1.05, -0.45, STEEL);
    k.block(-5.2, 2.55, -0.1, 3.0, -1.05, -0.45, STEEL);
    k.block(-5.2, 5.5, -0.1, 5.95, -1.05, -0.45, STEEL);
    k.block(-5.55, 3.95, -4.7, 4.55, -0.55, 0.55, STEEL2); // coupler
    k.block(-4.4, 4.1, -4.05, 4.4, -2.0, -0.4, STEEL2); // tongue jack
    // Dual axle, wheels outboard of the 8.5' box so they read in 3D
    for (const x of [13.2, 16.6]) {
      k.block(x, -0.85, x + 1.5, -0.15, -1.55, 0.15, STEEL2);
      k.block(x, 8.65, x + 1.5, 9.35, -1.55, 0.15, STEEL2);
    }
    // Entry steps on the south door
    k.block(3.4, 8.5, 6.6, 10.1, -1.55, -0.05, STEEL);
    k.block(3.6, 8.5, 6.4, 9.6, -0.05, 0.0, STEEL);
  },
};
