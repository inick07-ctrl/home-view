// Smith 05 — modern farmhouse: three steep front-facing gables (bedroom wing, great room, primary wing) joined by low flat-roof connectors.
// 4 bed + office, vaulted great room / dining / kitchen open to a 41'-4" x 15'-8" vaulted back porch, 22'-3" x 22'-0" side-entry garage.
// Plan feet: x east, y south (north = top of drawing, back porch side); origin = west exterior wall / back-porch north edge.
// The plan has no overall dimension lines: scale 11.45 px/ft on the 1206-px source (floor plan below the renders),
// set by the 41'-4" back porch and 22'-3" great room and checked against the garage, primary suite, office, pantry and 18' garage door.
// Roof pitches, heights and the porch/connector roofs are read from the renders, not dimensioned.
import { makeWalls } from '../lib.js';

const w = makeWalls();
const E = { ext: true }, C = { ext: true, h: 11 }, CI = { h: 11 };
// ---- bedroom wing (9' ceilings) ----
w.seg(0, 30.7, 0, 63.8, { ...E, windows: [[33, 36, 4.5, 7], [54.5, 60.5, 2.5, 7.5]] });
w.seg(0, 30.7, 6.3, 30.7, { ...E, windows: [[2, 4.5, 5, 7]] });
w.seg(6.3, 28.8, 6.3, 30.7, E);
w.seg(6.3, 28.8, 17.8, 28.8, { ...E, windows: [[7.5, 16.6, 2, 8]] });             // bedroom 2: wide black window in the side gable
w.seg(17.8, 28.8, 17.8, 30.7, E);
w.seg(17.8, 30.7, 23.6, 30.7, { ...E, windows: [[19.5, 22, 5, 7]] });
w.seg(23.6, 30.7, 23.6, 42.7, {});                                                // hall bath | entry hall
w.seg(6.3, 30.7, 6.3, 47.2, { doors: [[38.5, 41.1]] });                          // bedroom 2 -> bath
w.seg(17.8, 30.7, 17.8, 42.7, {});
w.seg(0, 41.6, 6.3, 41.6, { doors: [[3.1, 5.7]] });                               // bath -> 5'-4" x 5'-0" closet
w.seg(6.3, 42.7, 23.6, 42.7, { doors: [[14.4, 16.8], [18.4, 21.1]] });           // bedroom 2 + hall bath doors
w.seg(8, 42.7, 8, 47.2, { doors: [[43.6, 46.2]] });                               // linen
w.seg(0, 47.2, 24, 47.2, { doors: [[8.7, 11.8], [12.4, 15]] });                  // bedrooms 3 + 4
w.seg(12, 47.2, 12, 63.8, {});
w.seg(0, 51.1, 8, 51.1, { doors: [[2, 5]] }); w.seg(8, 47.2, 8, 51.1, {});
w.seg(16.2, 47.2, 16.2, 51.1, {}); w.seg(16.2, 51.1, 24, 51.1, { doors: [[19, 22]] });
w.seg(0, 63.8, 24, 63.8, { ...E, windows: [[2.5, 9.5, 2, 7.5], [14.5, 21.5, 2, 7.5]] });
w.seg(24, 47.2, 24, 63.8, { ...E, windows: [[57.5, 61.5, 3, 7.5]] });
// ---- entry hall connector ----
w.seg(23.6, 31.7, 32, 31.7, { ...E, doors: [[25.8, 30.1, 8]] });                 // glass door to the back porch
w.seg(24, 47.2, 32, 47.2, { ...E, doors: [[26.2, 30.2, 8.5]] });                 // black-framed glass front door
// ---- great room / dining / kitchen (11' walls, vaulted) ----
w.seg(32, 16.5, 55.4, 16.5, { ...C, windows: [[32.6, 41.2, 0.5, 10.6], [46.2, 54.8, 0.5, 10.6]] });  // full-height glass either side of the fireplace
w.seg(32, 16.5, 32, 31.7, { ...C, windows: [[20, 28.5, 2, 8]] });
w.seg(32, 47.2, 32, 60, { ...C, windows: [[50.5, 54, 4, 7]] });
w.seg(32, 60, 55.4, 60, { ...C, windows: [[37.5, 42.5, 3.5, 7]] });
w.seg(55.4, 16.5, 55.4, 31.7, { ...C, windows: [[20, 28.5, 2, 8]] });
w.seg(55.4, 31.7, 55.4, 42.4, CI);
w.seg(55.4, 46.7, 55.4, 56, CI);
w.seg(55.4, 56, 55.4, 60, C);
// ---- office / pantry connector ----
w.seg(55.4, 31.7, 63.9, 31.7, { ...E, doors: [[57.2, 62, 8]] });                 // glass door to the back porch
w.seg(55.4, 42.4, 63.9, 42.4, { doors: [[60.3, 62.9]] });
w.seg(55.4, 46.7, 63.9, 46.7, { doors: [[56.2, 59.8]] });
w.seg(55.4, 56, 63.9, 56, E);
w.seg(63.9, 31.7, 63.9, 42.4, {});
w.seg(63.9, 46.7, 63.9, 56, {});
// ---- primary wing ----
w.seg(63.9, 26, 63.9, 31.7, { ...E, windows: [[27, 30.5, 3, 7.5]] });
w.seg(63.9, 26, 79.7, 26, { ...E, windows: [[66.2, 77.4, 2, 8]] });              // primary: wide black window in the side gable
w.seg(79.7, 26, 79.7, 27.3, E);
w.seg(79.7, 27.3, 91.3, 27.3, { ...E, windows: [[81, 89, 4.5, 7]] });
w.seg(91.3, 27.3, 91.3, 51.1, { ...E, windows: [[30.5, 35, 4.5, 7.5]] });
w.seg(79.7, 27.3, 79.7, 42.4, { doors: [[33, 35.8]] });
w.seg(63.9, 42.4, 91.3, 42.4, { doors: [[64.5, 67.1], [83.4, 85.8]] });         // primary door; bath -> closet
w.seg(67.9, 42.4, 67.9, 51.1, { doors: [[43.5, 45.8]] });                         // utility
w.seg(77.5, 42.4, 77.5, 51.1, {});
w.seg(87.2, 51.1, 91.3, 51.1, E);
// ---- garage (side entry, 18' x 8' door on the east wall) ----
w.seg(63.9, 51.1, 87.2, 51.1, { doors: [[64.2, 66.8]] });
w.seg(63.9, 56, 63.9, 74.3, E);
w.seg(63.9, 74.3, 87.2, 74.3, { ...E, windows: [[71, 76, 4, 6.5]] });
w.seg(87.2, 51.1, 87.2, 74.3, { ...E, doors: [[53.3, 71.3, 8]] });

const V = { vaulted: true }, M = { minor: true }, O = { outside: true };
export default {
  id: 'smith-05',
  name: "Triple Gable",
  title: "Triple Gable",
  subtitle: "A three-gable modern farmhouse with a deep, vaulted back porch.",
  wallH: 9,
  planImage: { src: new URL("./smith-05-plan.jpg", import.meta.url).href, pxPerFt: 11.45, originPx: [80, 537], sizePx: [1206, 1436] },
  materials: { ext: '#f4f3ef', int: '#f8f6f1', roofTex: 'metal', roofUnder: '#d8c7a8', gable: 'ext', extSkin: true },
  walls: w,
  rooms: [
    ['Bath', '', 'tile', 0, 30.7, 6.3, 41.6, M],
    ['Closet', '', 'wood', 0, 41.6, 6.3, 47.2, M],
    ['Bedroom 2', "11'-0\" x 13'-0\"", 'wood', 6.3, 28.8, 17.8, 42.7, {}],
    ['Hall Bath', '', 'tile', 17.8, 30.7, 23.6, 42.7, M],
    ['', '', 'wood', 6.3, 42.7, 8, 47.2, { noLabel: true }],
    ['Hall', '', 'wood', 8, 42.7, 23.6, 47.2, M],
    ['Bedroom 3', "11'-0\" x 12'-0\"", 'wood', 0, 51.1, 12, 63.8, {}],
    ['Closet', '', 'wood', 0, 47.2, 8, 51.1, M],
    ['', '', 'wood', 8, 47.2, 12, 51.1, { noLabel: true }],
    ['Bedroom 4', "11'-0\" x 12'-0\"", 'wood', 12, 51.1, 24, 63.8, {}],
    ['', '', 'wood', 12, 47.2, 16.2, 51.1, { noLabel: true }],
    ['Closet', '', 'wood', 16.2, 47.2, 24, 51.1, M],
    ['Entry Hall', "8'-3\" x 14'-4\"", 'tile', 23.6, 31.7, 32, 47.2, {}],
    ['Great Room', "22'-3\" x 20'-0\"", 'wood', 32, 16.5, 55.4, 37.4, V],
    ['Dining', "22'-3\" x 10'-0\"", 'wood', 32, 37.4, 55.4, 47.2, V],
    ['Kitchen', "22'-3\" x 11'-0\"", 'wood', 32, 47.2, 55.4, 60, { vaulted: true, labelAt: [43.7, 57] }],
    ['Office', "8'-0\" x 10'-0\"", 'wood', 55.4, 31.7, 63.9, 42.4, {}],
    ['Hall', '', 'wood', 55.4, 42.4, 67.9, 46.7, M],
    ['', '', 'wood', 63.9, 46.7, 67.9, 51.1, { noLabel: true }],
    ['Pantry', "8'-0\" x 8'-5\"", 'wood', 55.4, 46.7, 63.9, 56, M],
    ['Primary Suite', "15'-0\" x 16'-0\"", 'wood', 63.9, 26, 79.7, 42.4, V],
    ['Primary Bath', '', 'tile', 79.7, 27.3, 91.3, 42.4, {}],
    ['Utility', "8'-8\" x 8'-0\"", 'tile', 67.9, 42.4, 77.5, 51.1, {}],
    ['Closet', "13'-0\" x 8'-0\"", 'wood', 77.5, 42.4, 91.3, 51.1, {}],
    ['Garage', "22'-3\" x 22'-0\"", 'concrete', 63.9, 51.1, 87.2, 74.3, {}],
    ['Back Porch', "41'-4\" x 15'-8\" · vaulted", 'porch', 32, 0, 55.4, 16.5, { ...O, labelAt: [43.7, 7] }],
    ['', '', 'porch', 23.1, 2.3, 32, 31.7, { ...O, noLabel: true }],
    ['', '', 'porch', 55.4, 2.3, 63.9, 26, { ...O, noLabel: true }],
    ['', '', 'porch', 55.4, 26, 63.9, 31.7, { ...O, noLabel: true }],
    ['Front Porch', "6'-9\" x 8'-8\"", 'porch', 24, 47.2, 32, 56.2, { ...O, minor: true }],
  ],
  slabs: [[-0.4, 28.4, 24.4, 64.2], [23.2, 31.3, 32.4, 47.6], [31.6, 16.1, 55.8, 60.4], [55, 31.3, 64.3, 56.4], [63.5, 25.6, 91.7, 51.5], [63.5, 50.7, 87.6, 74.7]],
  ceilings: [[0, 28.8, 24, 63.8], [23.6, 31.7, 32, 47.2], [55.4, 31.7, 63.9, 56], [79.7, 27.3, 91.3, 51.1], [63.9, 42.4, 79.7, 51.1], [63.9, 51.1, 87.2, 74.3]],
  roofs: [
    // centre gable: great room / dining / kitchen, 11' eave, steep (~11/12) standing seam, glass gable end facing the back porch ...
    { x0: 32, y0: 16.5, x1: 55.4, y1: 60, along: 'y', pitch: 0.9, oh: 1.2, eave: 11, endOh: [0, 1.2], ends: ['glass', 'ext'] },
    // ... carried out over the vaulted back porch (open gable end on posts)
    { x0: 32, y0: 0, x1: 55.4, y1: 16.5, along: 'y', pitch: 0.9, oh: 1.2, eave: 11, endOh: [1.2, 0], ends: [null, null] },
    // side gables: bedroom wing and primary wing (9' eaves) ...
    { x0: 0, y0: 28.8, x1: 24, y1: 63.8, along: 'y', pitch: 0.75, oh: 1, ends: ['ext', 'ext'] },
    { x0: 63.9, y0: 26, x1: 91.3, y1: 51.1, along: 'y', pitch: 0.75, oh: 1, ends: ['ext', 'ext'] },
    // ... garage gable (ridge east-west, gable over the side-entry door)
    { x0: 63.9, y0: 51.1, x1: 87.2, y1: 74.3, along: 'x', pitch: 0.5, oh: 1, ends: ['ext', 'ext'] },
    // low flat-roof connectors + side porch roofs, flat dark canopy over the front entry
    { flat: true, x0: 23.1, y0: 2.3, x1: 32, y1: 31.7, h: 10 },
    { flat: true, x0: 55.4, y0: 2.3, x1: 63.9, y1: 31.7, h: 10 },
    { flat: true, x0: 23.6, y0: 31.7, x1: 32, y1: 47.2, h: 9.6 },
    { flat: true, x0: 55.4, y0: 31.7, x1: 63.9, y1: 56, h: 9.6 },
    { flat: true, x0: 23.6, y0: 47.2, x1: 32.4, y1: 56.8, h: 8.8 },
  ],
  walkStart: [28.2, 66, 0],
  furnish(k) {
    const post = (x, y, h) => k.block(x - .35, y - .35, x + .35, y + .35, 0, h, '#1e1f21', { solid: true });
    // back porch posts + beam, side porch posts, front porch post
    post(32.4, 0.5, 11); post(55, 0.5, 11); k.block(32, 0.2, 55.4, 0.8, 10.3, 11, '#1e1f21');
    post(23.6, 2.8, 10); post(63.4, 2.8, 10);
    // chimney at the centre ridge + fireplace on the great room back wall
    k.block(41.5, 14.4, 46, 18.6, 0, 24.5, '#f1efea', { solid: true }); k.block(41.4, 14.3, 46.1, 18.7, 24.5, 25, '#1d1e20');
    k.block(42.4, 18.6, 45.1, 19, 0.6, 3.4, '#151515');
    // site: walk to the front porch, driveway to the side-entry garage door
    k.plane(26.5, 56.2, 30, 85, 'paver');
    k.plane(87.2, 52.5, 110, 72, 'paver'); k.plane(100, 72, 110, 95, 'paver');
    // great room: sofas facing the fireplace, rug table
    k.block(38, 25, 49.5, 27.2, 0, 2.6, '#7b8590'); k.block(35, 20, 37.2, 25, 0, 2.6, '#7b8590'); k.block(50.4, 20, 52.6, 25, 0, 2.6, '#7b8590');
    k.block(41, 21, 46.5, 23.5, 0, 1.3, '#6b4a2f');
    // dining table + chairs
    k.block(39, 40.5, 48.5, 43.5, 0, 2.5, '#6b4a2f');
    for (let x = 39.5; x < 48; x += 2.2) { k.block(x, 39.2, x + 1.2, 40.3, 0, 1.6, '#2a2b2d'); k.block(x, 43.7, x + 1.2, 44.8, 0, 1.6, '#2a2b2d'); }
    // kitchen: island, back counter, range + fridge walls
    k.block(37, 50, 49, 53.5, 0, 3, '#f0ede6', { solid: true }); k.block(36.8, 49.8, 49.2, 53.7, 3, 3.15, '#2b2c2e');
    k.block(32.5, 57.8, 54.9, 59.6, 0, 3, '#f0ede6', { solid: true });
    k.block(32.5, 47.8, 35, 51.5, 0, 7, '#c9ccd0', { m: .4, r: .4, solid: true });
    k.block(52.6, 49.5, 54.9, 57.5, 0, 3, '#f0ede6', { solid: true });
    // bedrooms
    k.bed(9, 30, 15.5, 36.5, 'n'); k.bed(3, 57, 9.5, 63.3, 's'); k.bed(15, 57, 21.5, 63.3, 's');
    k.block(18.3, 31.2, 23.1, 33.6, 0, 2, '#f4f6f8'); k.block(0.5, 31.2, 3.5, 34.2, 0, 0.3, '#bfe0f0');
    // office desk, pantry shelves
    k.block(56, 32.3, 63.3, 34.3, 2.4, 2.6, '#6b4a2f'); k.block(56, 47.3, 57.5, 55.4, 0, 7, '#9a7a55'); k.block(62, 47.3, 63.4, 55.4, 0, 7, '#9a7a55');
    // primary suite + bath
    k.bed(68, 28, 75, 35, 'n'); k.block(81, 27.8, 87.5, 29.8, 0, 3, '#e8e2d6'); k.block(88, 28.5, 90.8, 34.5, 0, 2, '#f4f6f8'); k.block(87.8, 35.5, 90.8, 40, 0, 0.3, '#bfe0f0');
    // utility, closet
    k.block(68.4, 49, 76.9, 50.6, 0, 3, '#f4f4f4'); k.block(78, 49.2, 90.8, 50.6, 0, 7, '#6b4a2f');
    // garage: two cars, closed overhead door
    k.car(68, 54, 84, 60.5, '#8a8680', 'golf-r', 'e'); k.car(68, 64.5, 84, 71, '#161616', 'lexus-gx', 'e');
    k.block(87.25, 53.3, 87.5, 71.3, 0, 8, '#2a2b2d');
  },
};
