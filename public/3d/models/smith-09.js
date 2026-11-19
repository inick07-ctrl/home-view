// Smith 09 — single-story from Nick's plan (master suites and Bedroom 1 on the west,
// living centre, Bedroom 2/3 and a 3-car garage on the east). Master Bedroom 2 was
// shrunk to 14'x12' with a 12'4"x5'1" closet and 12'4"x5'0" bath like Bedrooms 2 and 3.
// No furniture and no cars (Nick). The source plan does not show a fireplace.
// Plan feet: x east, y south. FRONT = south (bottom of the plan).
// Plan PNG is generated (clean, no watermark) by s09/gen09.py from the same wall/room lists.
import { makeWalls } from '../lib.js';

const w = makeWalls();
w.seg(0, 4, 19, 4, { ext: true, h: 12, windows: [[3, 8, 2.5, 7.5], [11, 16, 2.5, 7.5]] });
w.seg(0, 4, 0, 65.6667, { ext: true, windows: [[8, 13, 3, 7], [19, 24, 3, 7], [28.5, 34.5, 3, 7], [45.5833, 51.5833, 3, 7]] });
w.seg(0, 65.6667, 6.6667, 65.6667, { ext: true });
w.seg(6.6667, 65.6667, 6.6667, 55.5833, { ext: true });
w.seg(6.6667, 65.6667, 19, 65.6667, { ext: true, windows: [[9.6667, 14.6667, 3, 7]] });
w.seg(5, 55.5833, 6.6667, 55.5833, { ext: true });
w.seg(0, 43.5833, 5, 43.5833, { ext: true });
w.seg(5, 43.5833, 19, 43.5833, { ext: true });
w.seg(0, 37.5833, 19, 37.5833, { ext: true, doors: [[3, 6, 7]], windows: [[8, 11, 3, 7]] });
w.seg(19, 4, 19, 8.1667, { ext: true });
w.seg(19, 8.1667, 81.9167, 8.1667, { ext: true, h: 14, doors: [[25, 33, 8], [43.5833, 50.5833, 8], [57.5, 65.5, 8]] });
w.seg(71.9167, 8.1667, 81.9167, 8.1667, { ext: true, h: 14 });
w.seg(81.9167, 8.1667, 81.9167, 22.0833, { ext: true });
w.seg(40.5833, 28.0833, 71.9167, 28.0833, { ext: true, h: 14, windows: [[44.5833, 50.5833, 3, 7.5], [58.5, 66.5, 3, 7.5]] });
w.seg(71.9167, 22.1667, 76.9167, 22.1667, { ext: true });
w.seg(23, 36.25, 40.5833, 36.25, { ext: true, doors: [[28, 34.5, 8]] });
w.seg(23, 28.0833, 23, 36.25, { ext: true });
w.seg(40.5833, 28.0833, 40.5833, 36.25, { ext: true });
w.seg(23, 36.25, 23, 43.5833, { ext: true, doors: [[35.5833, 42.3833, 7]] });
w.seg(19, 37.5833, 19, 43.5833, { ext: true });
w.seg(81.9167, 0, 96.5833, 0, { ext: true, h: 12, windows: [[84.9167, 92.9167, 2.5, 7.5]] });
w.seg(101.5, 0, 116.1667, 0, { ext: true, h: 12, windows: [[104.5, 112.5, 2.5, 7.5]] });
w.seg(81.9167, 0, 81.9167, 8.1667, { ext: true, windows: [[3, 8, 3, 7]] });
w.seg(116.1667, 0, 116.1667, 59.5833, { ext: true, windows: [[3, 9, 3, 7], [13.5, 17.0833, 3, 7], [41.0833, 49.0833, 4, 8]] });
w.seg(96.5833, 0, 96.5833, 22.5833, { ext: true, doors: [[4, 8, 7]] });
w.seg(101.5, 0, 101.5, 22.5833, { ext: true, doors: [[4, 8, 7]] });
w.seg(86.25, 28.0833, 86.25, 35.0833, { ext: true, windows: [[29.5833, 33.0833, 3, 7]] });
w.seg(86.25, 35.0833, 86.25, 41.5, { ext: true, h: 12 });
w.seg(86.25, 41.5, 86.25, 59.5833, { ext: true, h: 12, windows: [[44.5, 49.5, 4, 7]] });
w.seg(86.25, 59.5833, 116.1667, 59.5833, { ext: true, h: 12, doors: [[87.05, 95.4222, 8], [97.0222, 105.3944, 8], [106.9944, 115.3667, 8]] });
w.seg(0, 17, 19, 17, { doors: [[2, 5, 7], [12, 15, 7]] });
w.seg(8.9167, 17, 8.9167, 26.5, { doors: [[20, 23, 7]] });
w.seg(8.9167, 26.5, 19, 26.5, { doors: [[13, 16, 7]] });
w.seg(19, 8.1667, 19, 26.5, { doors: [[19, 22.5, 7]] });
w.seg(0, 27, 5, 27, { doors: [[1.2, 3.6, 7]] });
w.seg(5, 27, 5, 30.5833, {});
w.seg(0, 30.5833, 5, 30.5833, {});
w.seg(12.5833, 26.5, 12.5833, 37.5833, { doors: [[29.5, 32.5, 7]] });
w.seg(15.3333, 26.5, 15.3333, 37.5833, { doors: [[29.5, 32.5, 7]] });
w.seg(5, 26.5, 19, 26.5, { doors: [[13.0833, 15.5833, 7], [15.7333, 17.8333, 7]] });
w.seg(19, 28.0833, 19, 37.5833, { doors: [[29.0833, 36.0833, 8]] });
w.seg(23, 28.0833, 23, 36.25, { doors: [[29.0833, 35.75, 8]] });
w.seg(19, 43.5833, 19, 55.5833, { doors: [[45.0833, 48.0833, 7]] });
w.seg(5, 55.5833, 19, 55.5833, { doors: [[15, 17.8, 7]] });
w.seg(6.6667, 60.6667, 19, 60.6667, { doors: [[15, 17.8, 7]] });
w.seg(6.6667, 55.5833, 6.6667, 65.6667, {});
w.seg(5, 43.5833, 5, 55.5833, {});
w.seg(71.9167, 8.1667, 71.9167, 22.1667, { doors: [[10.1667, 13.1667, 7], [17.1667, 20.1667, 7]] });
w.seg(71.9167, 16.1667, 81.9167, 16.1667, { doors: [[72.9167, 75.4167, 7]] });
w.seg(76.9167, 8.1667, 76.9167, 22.0833, { doors: [[17.1667, 19.6667, 7]] });
w.seg(76.9167, 22.0833, 81.9167, 22.0833, { doors: [[77.9167, 80.4167, 7]] });
w.seg(81.9167, 8.1667, 81.9167, 28.0833, { doors: [[23.5833, 26.5833, 7]] });
w.seg(81.9167, 12.5, 94.25, 12.5, { doors: [[85.9167, 88.9167, 7]] });
w.seg(81.9167, 17.5833, 94.25, 17.5833, { doors: [[85.9167, 88.9167, 7]] });
w.seg(94.25, 12.5, 94.25, 22.5833, {});
w.seg(81.9167, 22.5833, 94.25, 22.5833, { doors: [[85.9167, 88.9167, 7]] });
w.seg(81.9167, 12.5, 81.9167, 8.1667, {});
w.seg(103.8333, 12.5, 116.1667, 12.5, { doors: [[107.8333, 110.8333, 7]] });
w.seg(103.8333, 17.5833, 116.1667, 17.5833, { doors: [[107.8333, 110.8333, 7]] });
w.seg(103.8333, 12.5, 103.8333, 22.5833, {});
w.seg(103.8333, 22.5833, 116.1667, 22.5833, { doors: [[107.8333, 110.8333, 7]] });
w.seg(81.9167, 28.0833, 86.25, 28.0833, { doors: [[83.25, 85.75, 7]] });
w.seg(86.25, 28.0833, 95.9167, 28.0833, { doors: [[89.25, 92.25, 7]] });
w.seg(95.9167, 27, 109.1667, 27, { doors: [[99.9167, 102.9167, 7]] });
w.seg(95.9167, 27, 95.9167, 28.0833, {});
w.seg(109.1667, 27, 109.1667, 28.0833, {});
w.seg(95.9167, 28.0833, 95.9167, 35.0833, {});
w.seg(109.1667, 28.0833, 109.1667, 35.0833, { doors: [[30.0833, 33.0833, 7]] });
w.seg(109.1667, 22.5833, 109.1667, 35.0833, { doors: [[23.5833, 26.5833, 7], [30.0833, 33.0833, 7]] });
w.seg(109.1667, 29.5, 116.1667, 29.5, {});
w.seg(86.25, 35.0833, 116.1667, 35.0833, { doors: [[110.6667, 113.6667, 7]] });

export default {
  id: 'smith-09',
  name: 'Smith 09',
  title: 'Smith 09 — Single-Story, English Country',
  subtitle: "Single story \u00b7 ~3,359 sf heated \u00b7 4 bed (Master 2 is 14'x12') + office \u00b7 vaulted great room, dining & kitchen \u00b7 60' front porch \u00b7 3-car garage \u00b7 English Country interior",
  wallH: 10,
  defaultStyle: 'english-country',
  walkStart: [31.7917, 34.45, 0],
  planImage: { src: new URL("./smith-09-plan.png", import.meta.url).href, pxPerFt: 11, originPx: [106, 84], sizePx: [1511, 1014] },
  materials: { ext: '#ebe4d4', int: '#f3efe6', roofTex: 'shingle', roofUnder: '#d8c7a8', gable: 'ext', extSkin: true },
  walls: w,
  rooms: [
    ["Master Bedroom 1", "19'-0\" x 13'-0\"", 'wood', 0, 4, 19, 17, { vaulted: true }],
    ["Master Bathroom 1", "13'-7\" x 10'-0\"", 'tile', 0, 17, 8.9167, 27, { vaulted: true }],
    ["Master Closet 1", "10'-1\" x 9'-6\"", 'wood', 8.9167, 17, 19, 26.5, { vaulted: true, minor: true }],
    ["", "", 'tile', 0, 27, 5, 30.5833, { noLabel: true }],
    ["Bedroom 1", "12'-7\" x 11'-1\"", 'wood', 5, 26.5, 12.5833, 37.5833, { vaulted: true }],
    ["", "", 'wood', 0, 30.5833, 5, 37.5833, { noLabel: true }],
    ["WIC 1", "4'-0\" x 11'-1\"", 'wood', 12.5833, 26.5, 15.3333, 37.5833, { vaulted: true, minor: true }],
    ["Bath", "10'-0\" x 5'-11\"", 'tile', 15.3333, 26.5, 19, 37.5833, { vaulted: true, minor: true }],
    ["Hall", "4'-0\" x 12'-0\"", 'wood', 19, 28.0833, 23, 43.5833, { vaulted: true, minor: true, labelAt: [21, 40.5833] }],
    ["Side Terrace", "", 'terrace', 0, 37.5833, 12.5833, 43.5833, { outside: true }],
    ["Court", "", 'porch', 12.5833, 37.5833, 19, 43.5833, { outside: true }],
    ["Master Bedroom 2", "14'-0\" x 12'-0\"", 'wood', 5, 43.5833, 19, 55.5833, { vaulted: true }],
    ["Closet", "12'-4\" x 5'-1\"", 'wood', 6.6667, 55.5833, 19, 60.6667, { vaulted: true, minor: true }],
    ["Master Bathroom 2", "12'-4\" x 5'-0\"", 'tile', 6.6667, 60.6667, 19, 65.6667, { vaulted: true }],
    ["Great Room", "21'-7\" x 19'-11\"", 'wood', 19, 8.1667, 40.5833, 28.0833, { vaulted: true }],
    ["Dining", "19'-11\" x 12'-11\"", 'wood', 40.5833, 8.1667, 53.5, 28.0833, { vaulted: true }],
    ["Kitchen", "18'-5\" x 19'-11\"", 'wood', 53.5, 8.1667, 71.9167, 28.0833, { vaulted: true }],
    ["Foyer", "15'-2\" x 8'-2\"", 'tile', 23, 28.0833, 40.5833, 36.25, { vaulted: true }],
    ["Walk-in Pantry", "5'-0\" x 8'-0\"", 'wood', 71.9167, 8.1667, 76.9167, 16.1667, { vaulted: true, minor: true }],
    ["", "", 'wood', 76.9167, 8.1667, 81.9167, 16.1667, { noLabel: true }],
    ["Beverage", "5'-0\" x 6'-0\"", 'wood', 71.9167, 16.1667, 76.9167, 22.5833, { minor: true }],
    ["Powder", "5'-0\" x 5'-11\"", 'tile', 76.9167, 16.1667, 81.9167, 22.5833, { minor: true }],
    ["Rear Terrace", "", 'terrace', 19, 0, 81.9167, 8.1667, { outside: true }],
    ["Front Porch", "60'-3\" x 13'-5\"", 'porch', 23, 28.0833, 86.25, 41.5, { outside: true, labelAt: [56.25, 34.7917] }],
    ["", "", 'porch', 23, 41.5, 40.5833, 49.6667, { outside: true, noLabel: true }],
    ["Bedroom 2", "14'-8\" x 12'-6\"", 'wood', 81.9167, 0, 96.5833, 12.5, { vaulted: true }],
    ["WIC 2", "12'-4\" x 5'-1\"", 'wood', 81.9167, 12.5, 94.25, 17.5833, { vaulted: true, minor: true }],
    ["Bath 2", "12'-4\" x 5'-0\"", 'tile', 81.9167, 17.5833, 94.25, 22.5833, { vaulted: true }],
    ["Rear Porch", "", 'porch', 96.5833, 0, 101.5, 17.5833, { outside: true }],
    ["", "", 'terrace', 96.5833, 17.5833, 101.5, 22.5833, { outside: true, noLabel: true }],
    ["Bedroom 3", "14'-8\" x 12'-6\"", 'wood', 101.5, 0, 116.1667, 12.5, { vaulted: true }],
    ["WIC 3", "12'-4\" x 5'-1\"", 'wood', 103.8333, 12.5, 116.1667, 17.5833, { vaulted: true, minor: true }],
    ["Bath 3", "12'-4\" x 5'-0\"", 'tile', 103.8333, 17.5833, 116.1667, 22.5833, { vaulted: true }],
    ["Hall", "27'-3\" x 5'-6\"", 'wood', 81.9167, 22.5833, 95.9167, 28.0833, { vaulted: true }],
    ["", "", 'wood', 95.9167, 22.5833, 109.1667, 27, { noLabel: true }],
    ["Office", "9'-8\" x 7'-0\"", 'wood', 86.25, 28.0833, 95.9167, 35.0833, { vaulted: true }],
    ["Laundry", "13'-3\" x 8'-1\"", 'tile', 95.9167, 27, 109.1667, 35.0833, { vaulted: true }],
    ["Mechanical", "7'-0\" x 6'-11\"", 'concrete', 109.1667, 22.5833, 116.1667, 29.5, { minor: true }],
    ["Mudroom", "13'-0\" x 7'-0\"", 'tile', 109.1667, 28.0833, 116.1667, 35.0833, { vaulted: true }],
    ["Bay 1", "10'-0\" x 24'-6\"", 'concrete', 86.25, 35.0833, 96.2222, 59.5833, { labelAt: [91.2361, 47.3333] }],
    ["Bay 2 Truck", "10'-0\" x 24'-6\"", 'concrete', 96.2222, 35.0833, 106.1944, 59.5833, { labelAt: [101.2083, 47.3333] }],
    ["Bay 3", "10'-0\" x 24'-6\"", 'concrete', 106.1944, 35.0833, 116.1667, 59.5833, { labelAt: [111.1806, 47.3333] }],
  ],
  slabs: [
    [-0.4, 3.6, 19.4, 37.9833],
    [4.6, 43.1833, 19.4, 66.0667],
    [6.2667, 55.1833, 19.4, 66.0667],
    [18.6, 27.6833, 23.4, 43.9833],
    [18.6, 7.7667, 82.3167, 28.4833],
    [22.6, 27.6833, 40.9833, 36.65],
    [81.5167, -0.4, 116.5667, 35.4833],
    [85.85, 34.6833, 116.5667, 59.9833],
    [23, 28.0833, 86.25, 41.5],
    [23, 41.5, 40.5833, 49.6667],
    [19, 0, 81.9167, 8.1667],
    [0, 37.5833, 19, 43.5833],
    [96.5833, 0, 101.5, 22.5833]
  ],
  ceilings: [
    [86.25, 35.0833, 116.1667, 59.5833, 10],
    [0, 27, 5, 30.5833, 10]
  ],
  roofs: [
    // living — vaulted great room / dining / kitchen / pantry, ridge east-west
    { x0: 19, y0: 8.1667, x1: 81.9167, y1: 28.0833, pitch: 0.67, oh: 1, eave: 14, ends: ['ext', 'ext'] },
    // foyer
    { x0: 23, y0: 28.0833, x1: 40.5833, y1: 36.25, pitch: 0.5, oh: 0.8, eave: 10, ends: ['ext', 'ext'] },
    // front porch sheds
    { shed: true, x0: 23, y0: 28.0833, x1: 86.25, y1: 41.5, hi: 9.4, lo: 8.0, oh: 0.6 },
    { shed: true, x0: 23, y0: 41.5, x1: 40.5833, y1: 49.6667, hi: 8.4, lo: 7.4, oh: 0.6 },
    // west wing — Master 1, bath, closet, Bedroom 1 (ridge north-south)
    { x0: 0, y0: 4, x1: 19, y1: 37.5833, along: 'y', pitch: 0.67, oh: 1, eave: 10, ends: ['ext', 'ext'] },
    // left hall
    { x0: 19, y0: 28.0833, x1: 23, y1: 43.5833, along: 'y', pitch: 0.5, oh: 0.6, eave: 10, ends: ['ext', 'ext'] },
    // side terrace shed
    { shed: true, x0: 0, y0: 37.5833, x1: 19, y1: 43.5833, hi: 8.4, lo: 7.4, oh: 0.5 },
    // Master 2 (shrunk)
    { x0: 5, y0: 43.5833, x1: 19, y1: 65.6667, along: 'y', pitch: 0.67, oh: 1, eave: 10, ends: ['ext', 'ext'] },
    // east bedroom wing
    { x0: 81.9167, y0: 0, x1: 116.1667, y1: 28.0833, pitch: 0.67, oh: 1, eave: 10, ends: ['ext', 'ext'] },
    // rear porch shed
    { shed: true, x0: 96.5833, y0: 0, x1: 101.5, y1: 17.5833, hi: 9.2, lo: 8.0, oh: 0.5 },
    // office / laundry / mud
    { x0: 86.25, y0: 27, x1: 116.1667, y1: 35.0833, pitch: 0.5, oh: 0.8, eave: 10, ends: ['ext', 'ext'] },
    // garage — gable facing the south doors
    { x0: 86.25, y0: 35.0833, x1: 116.1667, y1: 59.5833, along: 'y', pitch: 0.5, oh: 1, eave: 10, ends: ['ext', 'ext'] },
  ],
  furnish(k) {
    // Architecture only: porch posts. No furniture and no cars (Nick).
    // The source plan does not show a fireplace, so none is modeled.
    const POST = '#d8c8a8';
    for (const x of [23.6, 63.4167, 85.65]) {
      k.block(x - 0.25, 40.8, x + 0.25, 41.3, 0, 8.2, POST);
    }
    for (const x of [23.6, 39.9833]) {
      k.block(x - 0.25, 48.9667, x + 0.25, 49.4667, 0, 7.6, POST);
    }
  },
};
