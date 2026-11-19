// Smith 04 — single-story modern ranch: 2 master suites + 3 bedrooms, vaulted great room / dining / kitchen, 3-car garage.
// Plan feet: x east, y south (north = top of drawing); origin = west exterior wall / bedroom-wing north wall centre lines.
// The plan has no overall dimension lines, so scale comes from room sizes: 9.37 px/ft on the 1206-px source,
// set by the garage (39'0" x 24'6") and checked against the 27'0" east hallway, the bedrooms and the closets (all within ~0.5').
// The drawing shows no roof or elevations: the gable roofs, 5/12 pitch and porch/terrace roofs below are a sensible guess.
import { makeWalls } from '../lib.js';

const w = makeWalls();
const E = { ext: true };
// ---- west wing: master suite 1 + bedroom 1 ----
w.seg(0, 3.6, 24.4, 3.6, { ...E, windows: [[3, 9.5, 3, 7.5], [13.5, 20, 3, 7.5]] });
w.seg(0, 3.6, 0, 44.6, { ...E, windows: [[6.5, 12.5, 3, 7.5], [21.5, 25.5, 4.5, 7.5], [33, 39.5, 3, 7.5]] });
w.seg(24.4, 3.6, 24.4, 10.4, { ...E, windows: [[5, 9.6, 3, 7.5]] });
w.seg(0, 44.6, 24.4, 44.6, { ...E, windows: [[1.2, 7.5, 3, 7.5]] });              // bedroom 1 -> side terrace
w.seg(24.4, 10.4, 24.4, 44.6, { doors: [[10.8, 13.8], [29.4, 32.2]] });             // master 1 | great room; closet; bath 1 | hall
w.seg(24.4, 44.6, 24.4, 52.5, { ...E, windows: [[45.2, 52, 1, 8]] });             // hallway glass to the side terrace
w.seg(0, 17.8, 24.4, 17.8, { doors: [[16.1, 19.9]] });
w.seg(13.1, 17.8, 13.1, 28.5, { doors: [[18.6, 21.4]] });
w.seg(0, 28.5, 24.4, 28.5, {});
w.seg(12.9, 28.5, 12.9, 44.6, { doors: [[40.2, 43.4]] });
w.seg(18.2, 28.5, 18.2, 44.6, { doors: [[29.2, 32]] });
// ---- great room / dining / kitchen (vaulted) ----
w.seg(24.4, 10.4, 82.4, 10.4, { ...E, doors: [[24.8, 30.6, 8], [45.6, 57.6, 8]], windows: [[67.3, 73.7, 3.5, 8]] });
w.seg(45.5, 30.6, 82.4, 30.6, { ...E, doors: [[46, 56.8, 8], [57.2, 68, 8]] });     // sliders to the south terrace
w.seg(77.5, 10.4, 77.5, 25.1, { doors: [[10.9, 13.7], [20.8, 23.6]] });          // pantry + powder doors from the kitchen
w.seg(77.5, 18.1, 82.4, 18.1, {});
w.seg(77.5, 25.1, 82.4, 25.1, {});
// ---- foyer, front door, hallway to master 2 ----
w.seg(45.5, 30.6, 45.5, 39, E);
w.seg(30.1, 39, 45.5, 39, { ...E, windows: [[30.5, 34.6, 1, 8]], doors: [[34.8, 40.6, 8]] });
w.seg(30.1, 39, 30.1, 52.5, E);
// ---- master suite 2 ----
w.seg(0, 52.5, 24.4, 52.5, { ...E, windows: [[1.7, 5.4, 4, 7.5]], doors: [[13.3, 21.4, 8]] });
w.seg(24.4, 52.5, 30.3, 52.5, { doors: [[26.8, 29.8]] });
w.seg(0, 52.5, 0, 76.9, { ...E, windows: [[54.5, 59.5, 4, 7.5]] });
w.seg(0, 76.9, 30.3, 76.9, { ...E, windows: [[19, 29.6, 1, 8]] });
w.seg(30.3, 52.5, 30.3, 76.9, { ...E, windows: [[57, 63.5, 3, 7.5]] });
w.seg(12.9, 52.5, 12.9, 76.9, { doors: [[58, 61.5], [70.5, 73.5]] });
w.seg(0, 66.2, 12.9, 66.2, { doors: [[4.5, 7.5]] });
// ---- east wing: bedrooms 2 + 3, hall, office, laundry, mech, mudroom ----
w.seg(82.4, 0, 98.1, 0, { ...E, windows: [[86.5, 94, 3, 7.5]] });
w.seg(106.1, 0, 121.9, 0, { ...E, windows: [[110, 117.5, 3, 7.5]] });
w.seg(82.4, 0, 82.4, 10.4, { ...E, windows: [[3, 8, 3, 7.5]] });
w.seg(82.4, 10.4, 82.4, 25.1, {});
w.seg(82.4, 30.6, 82.4, 39.1, { ...E, windows: [[32.5, 37, 3, 7]] });
w.seg(98.1, 0, 98.1, 24, { ...E, windows: [[3, 9, 3, 7.5]] });                  // rear porch side walls
w.seg(106.1, 0, 106.1, 24, { ...E, windows: [[3, 9, 3, 7.5]] });
w.seg(98.1, 24, 106.1, 24, { ...E, windows: [[98.6, 105.6, 1, 8]] });             // glass from the hall to the courtyard
w.seg(121.9, 0, 121.9, 39.1, { ...E, windows: [[3, 9, 3, 7.5]], doors: [[31.3, 34.3]] });
for (const [a, b] of [[82.4, 98.1], [106.1, 121.9]]) {
  w.seg(a, 12.5, b, 12.5, { doors: [[a + 0.5, a + 5.2]] });                       // bedroom -> W.I.C. opening
  w.seg(a, 17.8, b, 17.8, { doors: [[b - 4.5, b - 1.7]] });                       // W.I.C. -> bath
  w.seg(a, 24, b, 24, { doors: [[a + 0.8, a + 3.8]] });                           // bath -> hallway
}
w.seg(109.4, 24, 109.4, 39.1, { doors: [[25.7, 28.6], [32, 35]] });             // mech + mudroom doors
w.seg(109.4, 30.6, 121.9, 30.6, {});
w.seg(82.4, 30.6, 105.8, 30.6, { doors: [[89.4, 92.2], [102.5, 105.3]] });      // office + laundry doors
w.seg(92.4, 30.6, 92.4, 39.1, {});
w.seg(105.8, 30.6, 105.8, 39.1, {});
// ---- garage ----
w.seg(82.4, 39.1, 121.9, 39.1, { doors: [[106.2, 109]] });                      // garage | office, laundry, vestibule, mudroom
w.seg(82.4, 39.1, 82.4, 63.9, { ...E, windows: [[45, 49, 4, 7]] });
w.seg(121.9, 39.1, 121.9, 63.9, { ...E, windows: [[49, 54, 4, 7]] });
w.seg(82.4, 63.9, 121.9, 63.9, { ...E, doors: [[83.3, 103.6, 8], [110, 121.2, 8]] });

const V = { vaulted: true }, M = { minor: true }, O = { outside: true };
export default {
  id: 'smith-04',
  name: 'Smith 04',
  title: 'Smith 04 — Modern Ranch, Two Master Suites',
  subtitle: 'Single story · 2 master suites + 3 bedrooms + office · vaulted great room, dining & kitchen · 3-car garage · terraces front & back (roof is a guess)',
  wallH: 10,
  planImage: { src: new URL("./smith-04-plan.jpg", import.meta.url).href, pxPerFt: 9.37, originPx: [29, 105], sizePx: [1206, 876] },
  materials: { ext: '#f1eee8', int: '#f8f6f1', roofTex: 'metal', roofUnder: '#d8c7a8', gable: 'ext', extSkin: true },
  walls: w,
  rooms: [
    ['Master Bedroom 1', "20'10\" x 13'7\"", 'wood', 0, 3.6, 24.4, 17.8, V],
    ['Master Bath 1', "12'7\" x 10'9\"", 'tile', 0, 17.8, 13.1, 28.5, V],
    ['Master Closet 1', "10'11\" x 10'9\"", 'wood', 13.1, 17.8, 24.4, 28.5, V],
    ['Bedroom 1', "12'7\" x 15'4\"", 'wood', 0, 28.5, 12.9, 44.6, V],
    ['W.I.C.', '', 'wood', 12.9, 28.5, 18.2, 44.6, M],
    ['Bath', '', 'tile', 18.2, 28.5, 24.4, 44.6, M],
    ['Great Room', "21'1\" x 19'11\"", 'wood', 24.4, 10.4, 45.5, 30.6, V],
    ['Dining Room', "13'11\" x 19'11\"", 'wood', 45.5, 10.4, 59.3, 30.6, V],
    ['Kitchen', "16'3\" x 19'11\"", 'wood', 59.3, 10.4, 77.5, 30.6, V],
    ['Pantry', '', 'wood', 77.5, 10.4, 82.4, 18.1, M],
    ['Powder', '', 'tile', 77.5, 18.1, 82.4, 25.1, M],
    ['', '', 'wood', 77.5, 25.1, 82.4, 30.6, { noLabel: true }],
    ['Hall', '', 'wood', 24.4, 30.6, 34.8, 39, M],
    ['Foyer', "10'0\" x 8'0\"", 'tile', 34.8, 30.6, 45.5, 39, V],
    ['Hallway', '', 'wood', 24.4, 39, 30.1, 52.5, M],
    ['Master Bedroom 2', "16'8\" x 23'9\"", 'wood', 12.9, 52.5, 30.3, 76.9, V],
    ['Master Bath 2', "12'7\" x 13'6\"", 'tile', 0, 52.5, 12.9, 66.2, V],
    ['Master Closet 2', "12'7\" x 9'9\"", 'wood', 0, 66.2, 12.9, 76.9, V],
    ['Bedroom 2', "15'4\" x 12'3\"", 'wood', 82.4, 0, 98.1, 12.5, {}],
    ['W.I.C.', '', 'wood', 82.4, 12.5, 98.1, 17.8, M],
    ['Bath', '', 'tile', 82.4, 17.8, 98.1, 24, M],
    ['Bedroom 3', "15'4\" x 12'3\"", 'wood', 106.1, 0, 121.9, 12.5, {}],
    ['W.I.C.', '', 'wood', 106.1, 12.5, 121.9, 17.8, M],
    ['Bath', '', 'tile', 106.1, 17.8, 121.9, 24, M],
    ['Hallway', '', 'wood', 82.4, 24, 109.4, 30.6, M],
    ['Mech', '', 'concrete', 109.4, 24, 121.9, 30.6, M],
    ['Mudroom', '', 'tile', 109.4, 30.6, 121.9, 39.1, M],
    ['Office', "9'8\" x 7'9\"", 'wood', 82.4, 30.6, 92.4, 39.1, {}],
    ['Laundry', "13'3\" x 8'1\"", 'tile', 92.4, 30.6, 105.8, 39.1, {}],
    ['', '', 'tile', 105.8, 30.6, 109.4, 39.1, { noLabel: true }],
    ['Garage', "39'0\" x 24'6\" · 3 car", 'concrete', 82.4, 39.1, 121.9, 63.9, {}],
    ['Rear Porch', '', 'porch', 98.1, 0, 106.1, 24, { ...O, minor: true, labelAt: [102.1, 6] }],
    ['Rear Terrace', '', 'terrace', 0, -8.2, 82.4, 3.6, { ...O, labelAt: [50, -2] }],
    ['', '', 'terrace', 24.4, 3.6, 82.4, 10.4, { ...O, noLabel: true }],
    ['Terrace', "36'5\" x 8'2\" · covered", 'terrace', 45.5, 30.6, 82.4, 39, O],
    ['Porch', '', 'porch', 30.1, 39, 45.5, 52.5, O],
    ['Side Terrace', '', 'terrace', 0, 44.6, 24.4, 52.5, { ...O, minor: true }],
  ],
  slabs: [[-0.4, 3.2, 24.8, 45], [24, 10, 82.8, 31], [24, 30.2, 46, 39.4], [24, 39, 30.7, 53], [-0.4, 52.1, 30.7, 77.3], [82, -0.4, 122.3, 64.3]],
  ceilings: [[82.4, 0, 98.1, 39.1], [98.1, 24, 121.9, 39.1], [106.1, 0, 121.9, 24], [82.4, 39.1, 121.9, 63.9], [77.5, 10.4, 82.4, 25.1]],
  roofs: [
    // guessed: 5/12 standing-seam gables — west wing (ridge north-south) ...
    { x0: 0, y0: 3.6, x1: 24.4, y1: 44.6, along: 'y', pitch: 0.42, oh: 1.2, ends: ['ext', 'ext'] },
    // ... great room / dining / kitchen (ridge east-west, runs into the east wing roof as a cross gable) ...
    { x0: 24.4, y0: 10.4, x1: 92.4, y1: 30.6, along: 'x', pitch: 0.42, oh: 1.2, endOh: [0, 0], ends: ['ext', null] },
    // ... master suite 2 ...
    { x0: 0, y0: 52.5, x1: 30.3, y1: 76.9, along: 'x', pitch: 0.42, oh: 1.2, ends: ['ext', 'ext'] },
    // ... east wing + garage under one gable (ridge north-south, flat 10' ceilings below) ...
    { x0: 82.4, y0: 0, x1: 121.9, y1: 63.9, along: 'y', pitch: 0.35, oh: 1.2, ends: ['ext', 'ext'] },
    // ... flat roofs over the hall/foyer link and the covered part of the side terrace, sheds over the porch and south terrace
    { flat: true, x0: 24.4, y0: 30.6, x1: 45.9, y1: 39.3, h: 10 },
    { flat: true, x0: 24.4, y0: 39, x1: 30.5, y1: 52.5, h: 10 },
    { flat: true, x0: -0.4, y0: 44.6, x1: 12.9, y1: 52.5, h: 10 },
    { shed: true, x0: 30.1, y0: 39.3, x1: 45.5, y1: 52.5, hi: 9.8, lo: 9, oh: 0.6 },
    { shed: true, x0: 45.9, y0: 30.6, x1: 82.4, y1: 39, hi: 9.6, lo: 8.9, oh: 0.6 },
  ],
  walkStart: [37.7, 60, 0],
  furnish(k) {
    const post = (x, y, h) => k.block(x - .3, y - .3, x + .3, y + .3, 0, h, '#3b3f44', { solid: true });
    // porch + south terrace posts
    for (const x of [30.4, 45.2]) post(x, 52.2, 9);
    for (const x of [46.2, 55, 64, 73, 82]) post(x, 38.7, 8.9);
    // site: driveway to the garage doors, front walk, side-terrace garden
    k.plane(82.4, 64.2, 121.9, 95, 'paver');
    k.plane(35.2, 52.5, 40.2, 80, 'paver');
    k.block(14, 45.5, 23.5, 51.6, 0, 0.6, '#7f9a63');
    k.block(99, 13, 105.2, 23.4, 0, 0.6, '#7f9a63');
    // rear terrace: lounge + outdoor dining
    k.block(30, -5, 41, -2.8, 0, 2.3, '#8a8f96'); k.block(33, -2, 38, 1, 0, 1.3, '#6b4a2f');
    k.block(56, -4.5, 66, -1.5, 0, 2.6, '#6b4a2f');
    // master suite 1
    k.bed(3, 6, 10, 13, 'w'); k.block(16, 5, 21, 8, 0, 2.6, '#9aa0a6');
    k.block(1, 23.5, 5.5, 26.5, 0, 2, '#f4f6f8'); k.block(6, 18.3, 12.4, 20, 0, 3, '#e8e2d6');
    k.block(14, 21, 23.6, 23, 0, 7, '#6b4a2f');
    // bedroom 1 + bath
    k.bed(1, 33, 7.5, 39.5, 'w'); k.block(19, 29, 23.8, 31, 0, 3, '#e8e2d6'); k.block(13.4, 29, 14.6, 39, 0, 7, '#6b4a2f');
    // great room: sectional, coffee table, rug
    k.block(29.5, 13.5, 31.5, 25, 0, 2.6, '#7b8590'); k.block(29.5, 13.5, 40, 15.5, 0, 2.6, '#7b8590'); k.block(38, 13.5, 40, 18, 0, 2.6, '#7b8590');
    k.block(33.5, 18, 37.5, 22, 0, 1.3, '#6b4a2f');
    // dining table + chairs
    k.block(50, 14, 53, 25, 0, 2.5, '#6b4a2f');
    for (let y = 15; y < 25; y += 2.2) { k.block(48.4, y, 49.6, y + 1.2, 0, 1.6, '#3a3d40'); k.block(53.4, y, 54.6, y + 1.2, 0, 1.6, '#3a3d40'); }
    // kitchen: island, back counter + range
    k.block(64, 15, 69, 24, 0, 3, '#f0ede6', { solid: true }); k.block(63.8, 14.8, 69.2, 24.2, 3, 3.15, '#3a3d40');
    k.block(75.3, 11, 77.3, 25, 0, 3, '#f0ede6', { solid: true });
    // master suite 2
    k.bed(17, 58, 24.5, 65, 'w'); k.block(1, 53, 4.5, 58.5, 0, 2, '#f4f6f8'); k.block(10.6, 54, 12.4, 64, 0, 3, '#e8e2d6');
    k.block(1, 67, 3, 76, 0, 7, '#6b4a2f');
    // bedrooms 2 + 3
    k.bed(86.5, 2, 93.5, 9, 'n'); k.bed(110, 2, 117, 9, 'n');
    k.block(83, 15.6, 97.5, 17.6, 0, 7, '#6b4a2f'); k.block(106.6, 15.6, 121.3, 17.6, 0, 7, '#6b4a2f');
    // office desk, laundry, mech
    k.block(83, 36.7, 91.8, 38.6, 0, 2.5, '#6b4a2f');
    k.block(101, 36.3, 103, 38.6, 0, 3, '#f4f4f4'); k.block(103.2, 36.3, 105.2, 38.6, 0, 3, '#f4f4f4'); k.block(93, 31.2, 105.2, 32.8, 0, 7, '#e8e2d6');
    k.block(118, 25, 121.3, 28, 0, 5, '#b8bcc0');
    // garage: car, pickup, pickup; overhead doors (closed)
    k.car(85, 45, 92, 61.5, '#8a8680', 'golf-r', 's'); k.car(95, 43, 102, 62, '#161616', 'lexus-gx', 's'); k.car(112, 41, 119.5, 61.5, '#0a0a0a', 'g63', 's');
    k.block(83.3, 63.95, 103.6, 64.2, 0, 8, '#d9d6cf'); k.block(110, 63.95, 121.2, 64.2, 0, 8, '#d9d6cf');
  },
};
