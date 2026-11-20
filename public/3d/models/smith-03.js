// Smith 03 — Back Forty Building Co. barndominium plan: 104' x 58' overall, 3 bed + office, great room open to above, 39'4" x 46'6" shop garage.
// Plan feet: x east, y south (north = top of drawing); origin = north-west exterior wall centre lines.
// Scale 8.472 px/ft on the 1024-px view (28.99 px/ft on the source), from the 104' dimension line; the 58' line (to the front porch edge) checks within 0.5'.
// The drawing shows no roof: the metal gable roofs, eave heights and porch roofs below are a sensible guess, not from the plan.
import { makeWalls } from '../lib.js';

const w = makeWalls();
const E = { ext: true }, F = { ext: true, h: 10.8 }, G = { ext: true, h: 14 }, GI = { t: 0.6, h: 14 };
// ---- house exterior (10' walls) ----
w.seg(0, 0, 23.4, 0, { ...E, windows: [[2.9, 5.8, 4.5, 7], [10.3, 13, 3, 7], [17.5, 20.5, 3, 7]] });
w.seg(0, 0, 0, 47.3, { ...E, windows: [[8.1, 11, 3.5, 7], [20, 22.9, 5, 7], [28.2, 31.2, 4.5, 7], [36.3, 39.2, 3, 7]] });
w.seg(0, 47.3, 24.4, 47.3, { ...F, windows: [[2.6, 5.6, 3, 7], [8.7, 11.6, 3, 7]] });
w.seg(24.4, 47.3, 24.4, 49.3, E);
w.seg(24.4, 49.3, 63.8, 49.3, { ...E, doors: [[40.8, 47.1, 8]], windows: [[26.4, 29.2, 3, 7], [33.3, 36.3, 3, 7], [51.7, 54.6, 3, 7], [58.7, 61.5, 3, 7]] });
w.seg(23.4, 0, 23.4, 13.9, { ...E, doors: [[4.2, 10.3, 8]] });  // master bedroom slider to back porch
w.seg(23.4, 13.9, 63.8, 13.9, { ...E, doors: [[40.8, 47.1, 8]], windows: [[24.7, 27.8, 2.5, 8], [28.5, 31.6, 2.5, 8], [32.2, 35.4, 2.5, 8], [52.6, 56, 4, 7.5], [56.3, 59.5, 4, 7.5], [60.1, 63.1, 4, 7.5]] });
// ---- garage / shop (14' walls) ----
w.seg(63.8, 0, 63.8, 13.9, { ...G, doors: [[4, 7]] });  // laundry / mudroom door to back porch
w.seg(63.8, 0, 104, 0, { ...G, doors: [[82.8, 85.6]], windows: [[75.8, 78.6, 4, 7], [89.9, 92.8, 4, 7]] });
w.seg(104, 0, 104, 47.3, { ...G, doors: [[4.7, 20.4, 12], [26.7, 42.4, 12]] });
w.seg(63.8, 47.3, 104, 47.3, { ...G, windows: [[73.1, 76.2, 4, 7], [82.8, 85.8, 4, 7], [92.5, 95.5, 4, 7]] });
w.seg(63.8, 13.9, 63.8, 36.7, { ...GI, doors: [[16.3, 19.7]] });  // kitchen | mud hall + garage
w.seg(63.8, 36.7, 63.8, 47.3, GI);                                  // office | mech
// ---- laundry, pantry, mech (inside the garage footprint) ----
w.seg(63.8, 14.1, 75.1, 14.1, { doors: [[65.3, 68.4]] });
w.seg(69.1, 14.1, 69.1, 22.6, { doors: [[16.8, 19.7]] });
w.seg(63.8, 22.6, 75.1, 22.6, { doors: [[64.1, 66.6]] });
w.seg(75.1, 0, 75.1, 22.6, {});
w.seg(63.8, 36.7, 72.3, 36.7, { doors: [[69.2, 72]] });
w.seg(72.3, 36.7, 72.3, 47.3, {});
// ---- bedroom wing ----
w.seg(8.4, 0, 8.4, 24.6, { doors: [[7.4, 10.3], [14.8, 17.8]] });
w.seg(8.4, 13.9, 23.4, 13.9, { doors: [[19.7, 22.7]] });
w.seg(16.1, 13.9, 16.1, 30.9, { doors: [[26, 28.9]] });
w.seg(0, 24.6, 16.1, 24.6, {});
w.seg(4.8, 18.2, 4.8, 24.6, {});
w.seg(4.8, 18.2, 8.4, 18.2, { doors: [[5.2, 7.9]] });
w.seg(6.5, 24.6, 6.5, 34.9, { doors: [[29.4, 32]] });
w.seg(12.9, 24.6, 12.9, 34.9, { doors: [[31.6, 34.4]] });
w.seg(12.9, 30.9, 16.1, 30.9, {});
w.seg(0, 34.9, 14.6, 34.9, {});
w.seg(14.6, 34.9, 14.6, 47.3, { doors: [[35.2, 37.9], [44.1, 46.8]] });
w.seg(14.6, 40.9, 24.4, 40.9, {});
w.seg(19.2, 40.9, 19.2, 47.3, {});
w.seg(24.4, 36.7, 24.4, 47.3, { doors: [[37.1, 39.8], [44.1, 46.8]] });
w.seg(24.4, 36.7, 40.6, 36.7, {});
w.seg(38.8, 36.7, 38.8, 49.3, {});
w.seg(40.6, 36.7, 40.6, 41, { doors: [[37.5, 40.8]] });
w.seg(38.8, 41, 40.6, 41, {});
// ---- entry, half bath, office ----
w.seg(48.1, 36.7, 63.8, 36.7, {});
w.seg(48.1, 36.7, 48.1, 49.3, { doors: [[38.9, 42], [46.1, 49]] });
w.seg(52.7, 36.7, 52.7, 45, {});
w.seg(48.1, 45, 52.7, 45, {});

const V = { vaulted: true }, M = { minor: true };
export default {
  id: 'smith-03',
  name: "The Back Forty",
  title: "The Back Forty",
  subtitle: "A barndominium with a soaring great room and a shop garage built for serious work.",
  wallH: 10,
  planImage: { src: new URL("./smith-03-plan.jpg", import.meta.url).href, pxPerFt: 11.583, originPx: [54.28, 54.0], sizePx: [1400, 884] },
  materials: { ext: '#ebe7de', int: '#f7f4ee', roofTex: 'metal', roofUnder: '#d6c3a2', gable: 'ext', extSkin: true },
  walls: w,
  rooms: [
    ['Master Bath', '', 'tile', 0, 0, 8.4, 24.6, {}],
    ['Master Bdrm', "14'4\" x 13'7\"", 'wood', 8.4, 0, 23.4, 13.9, {}],
    ['M. Closet', '', 'wood', 8.4, 13.9, 16.1, 24.6, M],
    ['Hall', '', 'wood', 16.1, 13.9, 24.4, 30.9, M],
    ['Linen', '', 'wood', 12.9, 24.6, 16.1, 30.9, M],
    ['Shared Bath', '', 'tile', 0, 24.6, 12.9, 34.9, {}],
    ['Hall', '', 'wood', 14.6, 30.9, 24.4, 40.9, M],
    ['Bedroom #3', "14'0\" x 12'0\"", 'wood', 0, 34.9, 14.6, 47.3, {}],
    ['W.I.C.', '', 'wood', 14.6, 40.9, 19.2, 47.3, M],
    ['W.I.C.', '', 'wood', 19.2, 40.9, 24.4, 47.3, M],
    ['Bedroom #2', "14'0\" x 12'0\"", 'wood', 24.4, 36.7, 38.8, 49.3, {}],
    ['Great Room', "23'6\" x 22'1\" · open to above", 'wood', 24.4, 13.9, 48.1, 36.7, V],
    ['Kitchen', '', 'wood', 48.1, 13.9, 63.8, 36.7, { vaulted: true, labelAt: [55, 26] }],
    ['Closet', '', 'wood', 38.8, 36.7, 40.6, 41, M],
    ['Entry', '', 'tile', 40.6, 36.7, 48.1, 49.3, V],
    ['', '', 'tile', 38.8, 41, 40.6, 49.3, { noLabel: true }],
    ['½ Bath', '', 'tile', 48.1, 36.7, 52.7, 45, M],
    ['Office', "10'7\" x 12'1\"", 'wood', 52.7, 36.7, 63.8, 49.3, {}],
    ['', '', 'wood', 48.1, 45, 52.7, 49.3, { noLabel: true }],
    ['Laundry / Mudroom', '', 'tile', 63.8, 0, 75.1, 14.1, {}],
    ['Hall', '', 'tile', 63.8, 14.1, 69.1, 22.6, M],
    ['Pantry', '', 'wood', 69.1, 14.1, 75.1, 22.6, M],
    ['Mech', '', 'concrete', 63.8, 36.7, 72.3, 47.3, M],
    ['Garage', "39'4\" x 46'6\" · 14' walls", 'concrete', 75.1, 0, 104, 47.3, { labelAt: [88, 24] }],
    ['', '', 'concrete', 63.8, 22.6, 75.1, 36.7, { noLabel: true }],
    ['', '', 'concrete', 72.3, 36.7, 75.1, 47.3, { noLabel: true }],
    ['Back Porch', "40'2\" x 11'11\"", 'porch', 23.4, 0.9, 63.8, 13.9, { outside: true }],
    ['Front Porch', "~56' x 8' (not labeled)", 'porch', 24.4, 49.3, 63.8, 57.6, { outside: true, labelAt: [33, 54] }],
    ['', '', 'porch', 15.9, 47.3, 24.4, 57.6, { noLabel: true, outside: true }],
    ['', '', 'porch', 63.8, 47.3, 72, 57.6, { noLabel: true, outside: true }],
  ],
  slabs: [[-0.4, -0.4, 64.2, 47.7], [23.4, 0.5, 63.8, 14], [24, 47, 64.2, 49.7], [63.4, -0.4, 104.4, 47.7], [15.5, 47.3, 72.4, 58]],
  ceilings: [[0, 0, 24.4, 36.7], [0, 34.9, 24.4, 47.3], [24.4, 36.7, 38.8, 49.3], [38.8, 36.7, 40.6, 41], [48.1, 36.7, 63.8, 49.3], [63.8, 0, 75.1, 22.6], [63.8, 36.7, 72.3, 47.3]],
  roofs: [
    // guessed: 5/12 standing-seam metal gable over the living block (ridge east-west, back porch tucked under the main roof) ...
    { x0: 0, y0: 0, x1: 63.8, y1: 49.3, along: 'x', pitch: 0.42, oh: 1.2, endOh: [1.2, 0], ends: ['ext', null] },
    // ... a taller 14'-eave gable over the shop garage (overhead doors in the east gable end) ...
    { x0: 63.8, y0: 0, x1: 104, y1: 47.3, along: 'x', pitch: 0.42, oh: 1.2, eave: 14, endOh: [0, 1.2], ends: ['ext', 'ext'] },
    // ... and a low shed roof over the long front porch
    { shed: true, x0: 15.9, y0: 49.3, x1: 72, y1: 57.6, hi: 9.6, lo: 7.9, oh: 0.8 },
    { flat: true, x0: 63.8, y0: 47.3, x1: 72.8, y1: 49.6, h: 9.3 },
  ],
  walkStart: [44, 55, 0],
  furnish(k) {
    const post = (x, y, h) => k.block(x - .3, y - .3, x + .3, y + .3, 0, h, '#5a4330', { solid: true });
    // front porch posts + beam, back porch posts + beam
    for (const x of [15.9, 23.5, 31.1, 38.7, 49.1, 56.8, 64.4, 72]) post(x, 57.6, 7.9);
    k.block(15.6, 57.3, 72.3, 57.9, 7.4, 7.9, '#5a4330');
    for (const x of [31.6, 39.7, 48.1, 56.2]) post(x, 1.7, 10.6);
    k.block(23.4, 1.4, 63.8, 2, 10, 10.7, '#5a4330');
    // site: driveway to the garage overhead doors, front walk
    k.plane(104, 2, 150, 45, 'paver');
    k.plane(41.5, 57.6, 46.5, 75, 'paver');
    // master suite
    k.bed(13, 3.5, 19.5, 10.5, 'w'); k.block(9, 0.6, 11.5, 2.2, 0, 2.6, '#6b4a2f');
    k.block(1.5, 1.2, 6.8, 4.2, 0, 2, '#f4f6f8');                       // freestanding tub
    k.block(0.5, 5.5, 2.6, 15.5, 0, 3, '#e8e2d6');                      // double vanity
    k.block(0.5, 18.6, 4.4, 24.1, 0, 0.3, '#bfe0f0');                  // shower
    k.block(9.3, 14.8, 10.3, 23.8, 0, 7, '#6b4a2f'); k.block(14.6, 14.8, 15.6, 23.8, 0, 7, '#6b4a2f');
    // shared bath, bedrooms
    k.block(0.5, 25, 4.5, 27, 0, 1.8, '#f4f6f8'); k.block(10.4, 25, 12.4, 30.4, 0, 3, '#e8e2d6');
    k.bed(1, 38.5, 7.5, 45, 'w'); k.bed(31, 41, 37.5, 47.5, 'e');
    // great room: fireplace built-in on the west wall, sectional, faux beams x3
    k.block(21.6, 19.1, 24.2, 31.1, 0, 3, '#e8e2d6', { solid: true }); k.block(22.2, 23.2, 24.2, 27, 0, 9.6, 'brick', { solid: true });
    k.block(23.6, 24, 24.25, 26.2, 0.5, 3.2, '#1a1a1a');
    k.block(28.5, 19.5, 31, 31, 0, 2.6, '#7b8590'); k.block(28.5, 31, 37, 33.5, 0, 2.6, '#7b8590'); k.block(32, 23.5, 36, 28, 0, 1.3, '#6b4a2f');
    for (const x of [31.8, 39.3, 48.5]) k.block(x - .35, 14.3, x + .35, 36.3, 13, 13.8, '#6b4a2f');
    // kitchen: island, back counter + sink run, range wall, peninsula
    k.block(51.4, 21, 56.5, 29.9, 0, 3, '#f0ede6', { solid: true }); k.block(51.2, 20.8, 56.7, 30.1, 3, 3.15, '#3a3d40');
    k.block(53.5, 14.3, 63.3, 16.3, 0, 3, '#f0ede6', { solid: true }); k.block(49, 14.3, 52.5, 16.3, 0, 7, '#c9ccd0', { m: .4, r: .4, solid: true });
    k.block(61.3, 19.9, 63.3, 35.1, 0, 3, '#f0ede6', { solid: true }); k.block(61.3, 25.5, 63.3, 29, 4.5, 7.5, '#f0ede6');
    k.block(48.5, 32.9, 61.3, 35.1, 0, 3, '#f0ede6', { solid: true });
    // office, laundry, pantry shelves, mech
    k.block(57.5, 46.6, 63.2, 48.8, 2.4, 2.6, '#6b4a2f'); k.block(59.6, 44.6, 61.2, 46.2, 0, 3.3, '#2f2f2f');
    k.block(72.6, 3.5, 74.6, 11, 0, 3, '#f4f4f4'); k.block(64.3, 0.5, 74.6, 2.3, 0, 3, '#e8e2d6');
    k.block(69.6, 14.6, 74.6, 16, 0, 7, '#9a7a55'); k.block(73.2, 16, 74.6, 22.1, 0, 7, '#9a7a55');
    k.block(64.6, 41.5, 67.4, 44.3, 0, 5, '#b8bcc0'); k.block(64.6, 38, 67, 40.4, 0, 5.5, '#d9dde0');
    // garage: chest freezers on the kitchen wall, pickup + SUV
    k.block(64.3, 28.6, 66.4, 35.2, 0, 3, '#e9e9e9');
    // steel overhead doors (closed), workbench
    k.block(104.05, 4.8, 104.3, 20.3, 0, 12, '#d9d6cf'); k.block(104.05, 26.8, 104.3, 42.3, 0, 12, '#d9d6cf');
    k.block(86, 44.7, 100, 46.7, 0, 3.2, '#6b4a2f');
  },
};
