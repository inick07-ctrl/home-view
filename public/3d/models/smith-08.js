// Smith 08 — single-story ranch from Nick's plan (garage left, living centre, bedroom wing right),
// plus Nick's 13'x11' gym (north of the utility), 13'x11' office/library (east of the primary suite),
// and 13'x11' storage/safe room (interior, south of the family foyer in the garage/dining notch).
// Plan feet: x east, y south. FRONT = south (bottom of the plan).
// Plan PNG is generated (clean, no watermark) by s08/gen08.py from the same wall/room lists.
import { makeWalls } from '../lib.js';

const w = makeWalls();
w.seg(24, 10.5833, 37, 10.5833, { ext: true, windows: [[26, 30, 3, 7], [31, 35, 3, 7]] });
w.seg(24, 10.5833, 24, 21.5833, { ext: true });
w.seg(37, 10.5833, 37, 21.5833, { ext: true, windows: [[13.5833, 18.5833, 3, 7]] });
w.seg(4, 21.5833, 24, 21.5833, { ext: true, h: 12, windows: [[10, 16, 5, 8]] });
w.seg(0, 34.4167, 0, 46.5833, { ext: true, h: 12, doors: [[35.9167, 45.0833, 8]] });
w.seg(0, 34.4167, 4, 34.4167, { ext: true, h: 12 });
w.seg(0, 46.5833, 4, 46.5833, { ext: true, h: 12 });
w.seg(4, 21.5833, 4, 34.4167, { ext: true, h: 12, doors: [[23.3833, 32.6167, 8]] });
w.seg(4, 46.5833, 4, 59.4167, { ext: true, h: 12, doors: [[48.3833, 57.6167, 8]] });
w.seg(4, 59.4167, 24, 59.4167, { ext: true, h: 12, windows: [[12, 18, 4, 7]] });
w.seg(24, 48.9167, 24, 59.4167, { ext: true, h: 12 });
w.seg(25, 48.9167, 38, 48.9167, { ext: true });
w.seg(38, 47.5833, 38, 48.9167, { ext: true });
w.seg(37, 21.5833, 38, 21.5833, { ext: true, h: 14 });
w.seg(38, 21.5833, 56, 21.5833, { ext: true, h: 14, windows: [[42, 47, 3.5, 7.5], [49, 54, 3.5, 7.5]] });
w.seg(56, 21.5833, 56, 27.5833, { ext: true, h: 14, doors: [[22.7833, 25.9833, 8]] });
w.seg(38, 47.5833, 56, 47.5833, { ext: true, h: 14, windows: [[43, 51, 3, 7.5]] });
w.seg(56, 47.5833, 76, 47.5833, { ext: true, h: 12, windows: [[60, 65, 3, 7.5], [67, 72, 3, 7.5]] });
w.seg(56, 27.5833, 76, 27.5833, { ext: true, h: 12, doors: [[62, 70, 8]] });
w.seg(76, 27.5833, 85.1667, 27.5833, { ext: true, windows: [[78, 83, 2.5, 7.5]] });
w.seg(76, 42.9167, 85.1667, 42.9167, { ext: true, doors: [[79, 82.4, 8]] });
w.seg(85.1667, 0, 105.1667, 0, { ext: true, h: 12, windows: [[89.1667, 94.1667, 3, 7], [96.1667, 101.1667, 3, 7]] });
w.seg(105.1667, 0, 105.1667, 3, { ext: true, h: 12 });
w.seg(105.1667, 3, 118.1667, 3, { ext: true, windows: [[107.6667, 112.1667, 3, 7], [113.1667, 116.6667, 3, 7]] });
w.seg(118.1667, 3, 118.1667, 14, { ext: true, windows: [[5, 11, 3, 7]] });
w.seg(85.1667, 0, 85.1667, 27.5833, { ext: true, h: 12, windows: [[3, 10, 3, 7]] });
w.seg(85.1667, 42.9167, 85.1667, 53.9167, { ext: true, windows: [[45.9167, 50.9167, 3, 7]] });
w.seg(85.1667, 53.9167, 99.8333, 53.9167, { ext: true, windows: [[89.1667, 95.1667, 3, 7]] });
w.seg(99.8333, 53.9167, 105.8333, 53.9167, { ext: true });
w.seg(105.8333, 31.9167, 105.8333, 53.9167, { ext: true, windows: [[34.9167, 39.9167, 3, 7]] });
w.seg(105.1667, 31.9167, 105.8333, 31.9167, { ext: true });
w.seg(105.1667, 17, 105.1667, 31.9167, { ext: true, windows: [[26.75, 30.25, 3, 7]] });
w.seg(24, 21.5833, 37, 21.5833, { doors: [[26, 29]] });
w.seg(24, 21.5833, 24, 48.9167, { h: 10, doors: [[32.9167, 35.9167]] });
w.seg(31, 21.5833, 31, 30.9167, {});
w.seg(24, 30.9167, 31, 30.9167, { doors: [[26, 29]] });
w.seg(31, 30.9167, 38, 30.9167, { doors: [[33, 36]] });
w.seg(38, 21.5833, 38, 30.9167, { h: 14, doors: [[24.5833, 27.5833]] });
w.seg(38, 30.9167, 38, 37.9167, { h: 14, doors: [[32.4167, 36.4167, 8]] });
w.seg(25, 37.9167, 38, 37.9167, { doors: [[30, 33]] });
w.seg(38, 37.9167, 38, 47.5833, { h: 14 });
w.seg(56, 27.5833, 56, 47.5833, { h: 12, doors: [[32.5833, 42.5833, 8]] });
w.seg(76, 27.5833, 76, 42.9167, { h: 12, doors: [[38.9167, 41.9167, 8]] });
w.seg(85.1667, 27.5833, 85.1667, 42.9167, { doors: [[31.5833, 35.0833, 8]] });
w.seg(85.1667, 14, 91.5, 14, { doors: [[87.1667, 90.1667]] });
w.seg(91.5, 14, 105.1667, 14, {});
w.seg(105.1667, 3, 105.1667, 14, { doors: [[11, 13.5]] });
w.seg(105.1667, 14, 118.1667, 14, { doors: [[106.1667, 109.1667]] });
w.seg(91.5, 14, 91.5, 31.9167, { doors: [[18, 21], [27.25, 30.25]] });
w.seg(91.5, 31.9167, 105.1667, 31.9167, {});
w.seg(85.1667, 31.9167, 92.5833, 31.9167, { doors: [[86.6667, 89.6667]] });
w.seg(92.5833, 31.9167, 105.8333, 31.9167, { doors: [[94.5833, 97.5833]] });
w.seg(92.5833, 31.9167, 92.5833, 42.9167, { doors: [[35.9167, 38.9167]] });
w.seg(85.1667, 42.9167, 99.8333, 42.9167, { doors: [[88.1667, 91.1667]] });
w.seg(99.8333, 42.9167, 99.8333, 48.25, { doors: [[44.1167, 46.7167]] });
w.seg(99.8333, 48.25, 99.8333, 53.9167, { doors: [[49.45, 52.05]] });
w.seg(99.8333, 48.25, 105.8333, 48.25, {});
w.seg(99.8333, 42.9167, 105.8333, 42.9167, { doors: [[101.3333, 103.8333]] });

export default {
  id: 'smith-08',
  name: 'Smith 08',
  title: 'Smith 08 — Single-Story Ranch, English Country',
  subtitle: "Single story · ~2,798 sf heated · 3 bed + office/library + gym + safe room · 14' kitchen/dining, 12' family, vaulted primary · 31' back porch · side-load 3-car garage · English Country interior",
  wallH: 10,
  defaultStyle: 'english-country',
  planImage: { src: new URL("./smith-08-plan.png", import.meta.url).href, pxPerFt: 12, originPx: [112, 88], sizePx: [1642, 1017] },
  materials: { ext: '#ebe4d4', int: '#f3efe6', roofTex: 'shingle', roofUnder: '#d8c7a8', gable: 'ext', extSkin: true },
  walls: w,
  rooms: [
    ["Gym", "13'-0\" x 11'-0\"", 'gym', 24, 10.5833, 37, 21.5833, {  }],
    ["Utility", "6'-10\" x 9'-4\"", 'tile', 24, 21.5833, 31, 30.9167, { minor: true }],
    ["Pantry", "6'-10\" x 9'-4\"", 'wood', 31, 21.5833, 38, 30.9167, { minor: true }],
    ["Family Foyer", "14'-0\" x 7'-0\"", 'tile', 24, 30.9167, 38, 37.9167, {  }],
    ["Storage / Safe Room", "13'-0\" x 11'-0\"", 'concrete', 25, 37.9167, 38, 48.9167, {  }],
    ["Kitchen", "18'-0\" x 12'-0\"", 'wood', 38, 21.5833, 56, 33.5833, { labelAt: [47, 27.0833] }],
    ["Dining", "18'-0\" x 14'-0\"", 'wood', 38, 33.5833, 56, 47.5833, {  }],
    ["Family", "20'-0\" x 20'-0\"", 'wood', 56, 27.5833, 76, 47.5833, {  }],
    ["Entry", "9'-2\" x 15'-4\"", 'tile', 76, 27.5833, 85.1667, 42.9167, {  }],
    ["Primary Suite", "20'-0\" x 14'-0\"", 'wood', 85.1667, 0, 105.1667, 14, { vaulted: true }],
    ["Office / Library", "13'-0\" x 11'-0\"", 'wood', 105.1667, 3, 118.1667, 14, {  }],
    ["Hall", "", 'wood', 85.1667, 14, 91.5, 31.9167, { minor: true, labelAt: [88.3333, 19.625] }],
    ["", "", 'wood', 91.5, 14, 118.1667, 17, { noLabel: true }],
    ["Primary Bath", "", 'tile', 91.5, 17, 105.1667, 25.25, { labelAt: [98.3333, 21.125] }],
    ["Closet", "13'-8\" x 6'-8\"", 'wood', 91.5, 25.25, 105.1667, 31.9167, { minor: true }],
    ["Hall Bath", "", 'tile', 85.1667, 31.9167, 92.5833, 42.9167, { minor: true }],
    ["Bedroom 2", "13'-3\" x 11'-0\"", 'wood', 92.5833, 31.9167, 105.8333, 42.9167, {  }],
    ["Bedroom 3", "14'-8\" x 11'-0\"", 'wood', 85.1667, 42.9167, 99.8333, 53.9167, {  }],
    ["Closet", "6'-0\" x 5'-4\"", 'wood', 99.8333, 42.9167, 105.8333, 48.25, { minor: true }],
    ["Closet", "6'-0\" x 5'-4\"", 'wood', 99.8333, 48.25, 105.8333, 53.9167, { minor: true }],
    ["Bay 1", "20'-0\" x 12'-10\"", 'concrete', 4, 21.5833, 24, 34.4167, { labelAt: [16, 28] }],
    ["Bay 2 Truck", "24'-0\" x 12'-2\"", 'concrete', 0, 34.4167, 24, 46.5833, { labelAt: [14, 40.5] }],
    ["Bay 3", "20'-0\" x 12'-10\"", 'concrete', 4, 46.5833, 24, 59.4167, { labelAt: [16, 53] }],
    ["Back Porch", "31'-0\" x 13'-7\"", 'porch', 56, 14, 87, 27.5833, { outside: true }],
    ["Front Porch", "10'-0\" x 6'-0\"", 'porch', 76, 42.9167, 86, 48.9167, { outside: true }],
  ],
  slabs: [
    [3.6, 21.1833, 24.4, 59.8167],
    [-0.4, 34.0167, 4.4, 46.9833],
    [23.6, 10.1833, 37.4, 21.9833],
    [23.6, 21.1833, 38.4, 49.3167],
    [37.6, 21.1833, 56.4, 47.9833],
    [55.6, 27.1833, 85.5667, 43.3167],
    [84.7667, -0.4, 105.5667, 54.3167],
    [104.7667, 2.6, 118.5667, 14.4],
    [104.7667, 31.5167, 106.2333, 54.3167],
    [56, 14, 87, 27.5833],
    [76, 42.9167, 86, 48.9167]
  ],
  ceilings: [
    [24, 10.5833, 37, 21.5833, 10],
    [24, 21.5833, 38, 48.9167, 10],
    [38, 21.5833, 56, 47.5833, 14],
    [56, 27.5833, 76, 47.5833, 12],
    [76, 27.5833, 85.1667, 42.9167, 10],
    [85.1667, 14, 105.1667, 53.9167, 10],
    [105.1667, 3, 118.1667, 14, 10],
    [105.1667, 14, 118.1667, 17, 10],
    [105.1667, 31.9167, 105.8333, 53.9167, 10],
    [0, 21.5833, 24, 59.4167, 10]
  ],
  roofs: [
    // kitchen / dining — 14' eave, ridge east-west
    { x0: 38, y0: 21.5833, x1: 56, y1: 47.5833, pitch: 0.67, oh: 1, eave: 14, ends: ['ext', 'ext'] },
    // family — 12' eave
    { x0: 56, y0: 27.5833, x1: 76, y1: 47.5833, pitch: 0.67, oh: 1, eave: 12, endOh: [0, 1], ends: [null, 'ext'] },
    // entry
    { x0: 76, y0: 27.5833, x1: 85.1667, y1: 42.9167, pitch: 0.5, oh: 0.8, eave: 10, ends: ['ext', 'ext'] },
    // utility / foyer / safe / gym
    { x0: 24, y0: 10.5833, x1: 38, y1: 48.9167, pitch: 0.5, oh: 0.8, eave: 10, ends: ['ext', 'ext'] },
    // garage — lower gable, gable end over the west side-load doors
    { x0: 0, y0: 21.5833, x1: 24, y1: 59.4167, along: 'y', pitch: 0.5, oh: 1, eave: 10, endOh: [1, 0], ends: ['ext', null] },
    // primary + office — front-facing gable (ridge north-south)
    { x0: 85.1667, y0: 0, x1: 118.1667, y1: 14, along: 'y', pitch: 0.67, oh: 1, eave: 12, ends: ['ext', 'ext'] },
    // bedroom wing south of the primary
    { x0: 85.1667, y0: 14, x1: 105.8333, y1: 53.9167, along: 'y', pitch: 0.67, oh: 1, eave: 10, endOh: [0, 1], ends: [null, 'ext'] },
    // back porch shed (low edge outboard / north)
    { shed: true, x0: 56, y0: 13.4, x1: 87, y1: 27.5833, hi: 8.2, lo: 9.4, oh: 0.6 },
    // front porch shed (low edge outboard / south)
    { shed: true, x0: 76, y0: 42.9167, x1: 86, y1: 49.5167, hi: 9.4, lo: 8.2, oh: 0.6 },
  ],
  walkStart: [81, 52.9167, 0],
  furnish(k) {
    const BK = '#1e1f21', WD = '#8a6440', OAK = '#6b4a2f', CREAM = '#f0ede6';
    const post = (x, y, h=8.2) => k.block(x - .35, y - .35, x + .35, y + .35, 0, h, WD, { solid: true });
    // back porch posts + beam
    for (const x of [56.5, 71.5, 86.5]) post(x, 14.7);
    k.block(56, 14.4, 87, 15.1, 7.7, 8.3, WD);
    // front porch posts + beam
    for (const x of [76.5, 85.5]) post(x, 48.2167);
    k.block(76, 47.8167, 86, 48.5167, 7.7, 8.3, WD);
    k.block(79, 48.9167, 82.5, 50.5167, -0.6, -0.25, '#9a9a96');
    k.plane(79.2, 50.5167, 82.3, 62.9167, 'paver');
    // driveway west of the side-load garage, then south to the street
    k.plane(-16, 22.5833, 0, 58.4167, 'paver');
    k.plane(-16, 58.4167, 8, 77.4167, 'paver');
    // 60" linear fireplace on the family/entry wall, stone surround
    const fmx = 76, fmy = 37.5833;
    k.block(fmx - 0.55, fmy - 2.7, fmx + 0.35, fmy + 2.7, 0, 6.4, 'stone', { solid: true });
    k.block(fmx - 0.12, fmy - 2.5, fmx + 0.18, fmy + 2.5, 1.1, 3.5, '#1a1a1a');
    k.block(fmx - 0.4, fmy - 1.1, fmx + 0.3, fmy + 1.1, 6.4, 16, 'stone');
    // family furniture
    k.block(61, 33.5833, 64, 41.5833, 0, 2.6, '#7b8590');
    k.block(65, 31.5833, 72, 33.7833, 0, 2.6, '#9aa0a6');
    k.block(66, 35.5833, 71, 39.5833, 0, 1.3, OAK);
    // dining table
    k.block(43.5, 37.0833, 50.5, 44.0833, 0, 2.5, OAK);
    for (let y = 37.7833; y < 43.5833; y += 2.1) {
      k.block(42.2, y, 43.3, y + 1.1, 0, 1.6, BK);
      k.block(50.7, y, 51.8, y + 1.1, 0, 1.6, BK);
    }
    // kitchen: island, stools, back counter, range, fridge
    k.block(44, 25.5833, 50, 29.5833, 0, 3, CREAM, { solid: true });
    k.block(43.8, 25.3833, 50.2, 29.7833, 3, 3.15, '#2b2c2e');
    for (let x = 44.3; x < 49.5; x += 1.5) k.block(x, 29.9833, x + 1.1, 30.9833, 0, 2.6, BK);
    k.block(38.6, 22.1833, 55.4, 24.3833, 0, 3, CREAM, { solid: true });
    k.block(46, 22.1833, 49, 24.2833, 3, 3.1, '#2f2f2f');
    k.block(52.8, 22.1833, 55.4, 25.1833, 0, 7, '#c9ccd0', { m: .4, r: .4 });
    // pantry shelves
    k.block(31.4, 21.9833, 32.4, 30.5167, 0, 7, OAK);
    k.block(36.6, 21.9833, 37.6, 30.5167, 0, 7, OAK);
    // utility washer / dryer
    k.block(24.5, 22.0833, 26.7, 24.2833, 0, 3, '#f4f4f4');
    k.block(27, 22.0833, 29.2, 24.2833, 0, 3, '#f4f4f4');
    // family foyer: cubbies / bench, coats, stacked-firewood niche on the garage wall
    k.block(25, 36.5167, 37, 37.5167, 0, 1.6, OAK);
    k.block(35.6, 31.3167, 37.6, 36.3167, 0, 7, OAK);
    if (k.firewood) k.firewood(24.3, 31.4167, 25.5, 36.1167, 6.5);
    else {
      for (let y = 31.6167; y < 35.9167; y += 0.55)
        for (let z = 0; z < 5; z++) k.block(24.35, y, 25.4, y + 0.45, 0.2 + z * 0.55, 0.65 + z * 0.55, '#6a4a32');
    }
    // safe room: shelves + Z-brace plank door on the foyer side
    k.block(25.4, 39.4167, 26.6, 48.4167, 0, 7, '#4a4d52');
    k.block(36.4, 39.4167, 37.6, 48.4167, 0, 7, '#4a4d52');
    if (k.zDoor) k.zDoor(30, 37.6667, 33, 38.1667, 'n');
    // primary suite
    k.bed(90.1667, 1.5, 98.1667, 8.5, 'n');
    k.block(86.1667, 0.6, 89.1667, 2.6, 0, 2.2, OAK);
    k.block(101.1667, 0.6, 104.1667, 2.6, 0, 2.2, OAK);
    // primary bath: vanity, tub, toilet
    k.block(92.1, 17.4, 96.5, 19.4, 0, 2.6, CREAM);
    k.block(99.1667, 21.05, 104.5667, 24.75, 0, 0.3, '#bfe0f0');
    k.block(92.1, 22.85, 93.9, 24.65, 0, 1.4, '#f4f6f8');
    // WIC shelves
    k.block(91.9, 25.65, 104.7667, 26.55, 0, 7, OAK);
    k.block(91.9, 30.6167, 104.7667, 31.5167, 0, 7, OAK);
    // bedrooms
    k.bed(95.5833, 33.9167, 102.5833, 40.4167, 'e');
    k.bed(88.1667, 44.9167, 95.1667, 51.4167, 'w');
    // hall bath
    k.block(85.6667, 32.4167, 89.6667, 34.5167, 0, 3, CREAM);
    k.block(87.5833, 38.9167, 92.0833, 42.4167, 0, 0.3, '#bfe0f0');
    // office / library: shelves + desk
    k.block(105.5667, 3.4, 106.4667, 13.6, 0, 8, OAK);
    k.block(116.8667, 3.4, 117.7667, 13.6, 0, 8, OAK);
    k.block(108.6667, 6.5, 114.6667, 9.2, 2.4, 2.6, OAK);
    k.block(110.6667, 9.4, 112.3667, 11, 0, 3.3, '#2f2f2f');
    // gym: rack, bench, treadmill, mirror
    k.block(25, 11.5833, 29, 15.5833, 0, 7, '#2a2b2d');
    k.block(30.5, 14.5833, 35, 16.0833, 0, 1.6, '#2a2b2d');
    k.block(33.8, 12.0833, 36.4, 20.0833, 0, 1.4, '#3a3d40');
    k.block(24.4, 21.0833, 36.6, 21.4333, 0.5, 7.5, '#cfe6f3');
    // back porch dining; front porch rockers
    k.block(60, 19, 70, 23, 0, 2.5, OAK);
    for (const x of [77.2, 79.2]) {
      k.block(x, 44.5167, x + 1.6, 46.1167, 1.2, 1.5, BK);
      k.block(x, 45.9167, x + 1.6, 46.1167, 1.5, 3.3, BK);
    }
    // garage cars: Golf R in Bay 1, Lexus GX in Bay 2 Truck, G-Wagon in Bay 3; all nose west toward the doors
    k.car(6.2, 23.9833, 22.2, 32.0167, '#8a8680', 'golf-r', 'w');
    k.car(3, 36.6167, 22.2, 44.3833, '#161616', 'lexus-gx', 'w');
    k.car(6, 48.7833, 22.4, 57.2167, '#0a0a0a', 'g63', 'w');
    // closed overhead doors
    k.block(3.75, 23.3833, 4.15, 32.6167, 0, 8, '#2a2b2d');
    k.block(-0.25, 35.9167, 0.15, 45.0833, 0, 8, '#2a2b2d');
    k.block(3.75, 48.3833, 4.15, 57.6167, 0, 8, '#2a2b2d');
  },
};
