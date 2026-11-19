// Double-Wide 01 — manufactured home, about 28' x 56'. Architecture only:
// no furniture and no cars. Plan feet: x east, y south. FRONT = south.
import { makeWalls } from '../lib.js';

const w = makeWalls();
const H = 8;
// Exterior
w.seg(0, 0, 56, 0, { ext: true, windows: [[3, 8, 3, 6.5], [16, 22, 3.5, 6.8], [43, 50, 3, 6.5]] });
w.seg(0, 28, 56, 28, { ext: true, doors: [[12, 15.2, 7]], windows: [[3, 8, 3, 6.5], [18, 23, 3, 6.5], [29, 34, 3, 6.5], [44, 50, 3, 6.5]] });
w.seg(0, 0, 0, 28, { ext: true, windows: [[3, 9, 3, 6.5], [17, 24, 3, 6.5]] });
w.seg(56, 0, 56, 28, { ext: true, windows: [[3, 9, 3, 6.5], [19, 25, 3, 6.5]] });
// Dining | kitchen
w.seg(14, 0, 14, 14, { doors: [[4, 10, 7]] });
// Kitchen | utility/hall and living (kitchen ends at x=26, y=0-14)
w.seg(26, 0, 26, 14, { doors: [[8, 12.5, 7]] });
// Living | hall/bedrooms at x=26, y=14-28 — opening into south hall
w.seg(26, 17, 26, 28);
// Utility | north hall
w.seg(26, 6, 32, 6);
// North hall | WIC / master bath, opening into the hall
w.seg(32, 0, 32, 14, { doors: [[8.2, 12.2, 7]] });
// WIC | master bath
w.seg(32, 7, 40, 7, { doors: [[33.3, 36.3, 7]] });
// WIC+bath | master
w.seg(40, 0, 40, 14, { doors: [[3, 6.2, 7]] });
// South hall (y=14-17) is open to living; wall under bedrooms at y=17
w.seg(26, 17, 56, 17, { doors: [[30, 33, 7], [45, 48, 7]] });
// Bed 2 | Bed 3
w.seg(40, 17, 40, 28);
// Master | south hall (already y=14 is the marriage line — add wall where master meets hall)
w.seg(40, 14, 56, 14, { doors: [[46, 49, 7]] });
// Living | dining (y=14, x=0-14): opening
w.seg(0, 14, 14, 14, { doors: [[3, 9, 7]] });
// Living | kitchen (y=14, x=14-26): opening
w.seg(14, 14, 26, 14, { doors: [[17, 23, 7]] });

export default {
  id: 'double-wide-01',
  name: 'Double-Wide 01',
  title: 'Double-Wide 01 — 28\' × 56\' Manufactured Home',
  subtitle: "Double-wide · 28' × 56' · 3 bed, 2 bath · living, dining and kitchen · ~1,568 sf heated · English Country interior",
  wallH: H,
  defaultStyle: 'english-country',
  buildType: 'trailer',
  walkStart: [13.6, 30.6, 0],
  planImage: { src: new URL('./double-wide-01-plan.png', import.meta.url).href, pxPerFt: 16, originPx: [96, 84], sizePx: [1088, 640] },
  materials: { ext: '#ebe4d4', int: '#f3efe6', roofTex: 'shingle', roofUnder: '#d8c7a8', gable: 'ext', extSkin: true },
  walls: w,
  rooms: [
    ['Dining', '14\'-0" x 14\'-0"', 'wood', 0, 0, 14, 14],
    ['Kitchen', '12\'-0" x 14\'-0"', 'wood', 14, 0, 26, 14],
    ['Utility', '6\'-0" x 6\'-0"', 'tile', 26, 0, 32, 6, { minor: true }],
    ['Hall', '', 'wood', 26, 6, 32, 14, { minor: true, noLabel: true }],
    ['WIC', '8\'-0" x 7\'-0"', 'wood', 32, 0, 40, 7, { minor: true }],
    ['Master Bath', '8\'-0" x 7\'-0"', 'tile', 32, 7, 40, 14],
    ['Master Bedroom', '16\'-0" x 14\'-0"', 'wood', 40, 0, 56, 14],
    ['Living', '26\'-0" x 14\'-0"', 'wood', 0, 14, 26, 28, { vaulted: true }],
    ['Hall', '30\'-0" x 3\'-0"', 'wood', 26, 14, 56, 17, { minor: true }],
    ['Bedroom 2', '14\'-0" x 11\'-0"', 'wood', 26, 17, 40, 28],
    ['Bedroom 3', '16\'-0" x 11\'-0"', 'wood', 40, 17, 56, 28],
    ['Porch', '12\'-0" x 4\'-0"', 'porch', 8, 28, 20, 32, { outside: true }],
  ],
  slabs: [[-0.4, -0.4, 56.4, 28.4], [8, 28, 20, 32]],
  roofs: [
    { x0: 0, y0: 0, x1: 56, y1: 28, pitch: 0.3, oh: 1.1, eave: H, ends: ['ext', 'ext'] },
    { shed: true, x0: 8, y0: 28, x1: 20, y1: 32, hi: 8.2, lo: 7.2, oh: 0.4 },
  ],
  areas: { heated: 1568, garage: 0, porch: 48 },
  furnish(k) {
    const CREAM = '#e8dcc6', SKIRT = '#5c5146', POST = '#d8c8a8';
    // Kitchen counters along the north wall
    k.block(14.3, 0.2, 25.7, 2.15, 0, 3, CREAM, { solid: true });
    k.block(14.3, 0.2, 25.7, 2.15, 3, 3.15, '#2b2c2e');
    // Master bath vanity
    k.block(32.25, 10.4, 36.3, 13.8, 0, 2.6, CREAM, { solid: true });
    // Skirting
    k.block(-0.15, -0.15, 56.15, 0.2, -1.6, 0, SKIRT);
    k.block(-0.15, 27.8, 56.15, 28.15, -1.6, 0, SKIRT);
    k.block(-0.15, -0.15, 0.2, 28.15, -1.6, 0, SKIRT);
    k.block(55.8, -0.15, 56.15, 28.15, -1.6, 0, SKIRT);
    for (const x of [8.3, 19.7]) k.block(x - 0.2, 31.55, x + 0.2, 31.95, 0, 7.4, POST);
  },
};
