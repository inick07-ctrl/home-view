// Smith 06 — ORIGINAL design (not from a submitted plan), drawing on Smith 01-05: white board-and-batten + black metal three-gable modern farmhouse.
// Left wing: primary suite (bedroom, bath, walk-in) + 3 bedrooms with walk-ins, jack & jill + hall bath, linen.
// Centre: kitchen -> dining -> living, front to back, under one tall vaulted glass gable. Folding glass at the kitchen end and sliders
// either side of a two-sided (see-through) fireplace at the living end open the whole centre into a front-to-back breezeway
// between the front porch and the screened back porch. Right wing: library + gym across the back, gallery, powder, mud hall,
// safe/storage room, utility, and a side-load 3-car garage toward the front.
// Room sizes follow Nick's chart: medium for most rooms, large for the primary suite/bath/closet and the garage.
// Plan feet: x east, y south. FRONT = south (bottom of the plan), back yard / screened porch = north.
// models/smith-06-plan.png is generated from these same walls (s06/gen.py), so the plan overlay lines up exactly.
import { makeWalls } from '../lib.js';

const w = makeWalls();
w.seg(0, 0, 40, 0, { ext: true, windows: [[3, 10, 5, 7], [24, 38, 1.5, 8]] });
w.seg(0, 0, 0, 40, { ext: true, windows: [[16, 22.5, 2.5, 7.5], [24, 28.5, 5, 7], [30, 36.5, 2.5, 7.5]] });
w.seg(0, 40, 18, 40, { ext: true, windows: [[2.5, 9, 2.5, 7.5]] });
w.seg(18, 40, 18, 44.5, { ext: true });
w.seg(18, 44.5, 33, 44.5, { ext: true, windows: [[21, 30, 3, 7.5]] });
w.seg(33, 44.5, 40, 44.5, { ext: true, doors: [[34.2, 38, 8.5]] });
w.seg(13.5, 0, 13.5, 12.5, { doors: [[4, 7]] });
w.seg(22, 0, 22, 38.5, { doors: [[3.5, 6.5], [14, 17], [31, 34]] });
w.seg(0, 12.5, 22, 12.5, {  });
w.seg(11.5, 12.5, 11.5, 40, { doors: [[12.8, 15.2], [16.5, 19.5], [23, 25.5], [27, 29.5], [31.5, 34.5], [37.3, 39.7]] });
w.seg(18, 12.5, 18, 40, { doors: [[12.8, 15.3], [37.2, 39.8]] });
w.seg(0, 26, 11.5, 26, {  });
w.seg(11.5, 15.5, 18, 15.5, {  });
w.seg(11.5, 22, 18, 22, {  });
w.seg(11.5, 30.5, 18, 30.5, {  });
w.seg(11.5, 37, 18, 37, {  });
w.seg(22, 20.5, 40, 20.5, {  });
w.seg(28.5, 20.5, 28.5, 38.5, { doors: [[26.5, 29.2]] });
w.seg(22, 30, 28.5, 30, {  });
w.seg(28.5, 34, 40, 34, { doors: [[35, 38]] });
w.seg(22, 38.5, 33, 38.5, { doors: [[29.5, 32]] });
w.seg(33, 34, 33, 38.5, {  });
w.seg(40, 4, 58.5, 4, { ext: true, h: 11, doors: [[40.6, 46.3, 8.5], [52.2, 57.9, 8.5]] });
w.seg(40, 0, 40, 4, { ext: true, h: 11 });
w.seg(40, 4, 40, 34, { h: 11 });
w.seg(40, 34, 40, 40.5, { h: 11, doors: [[34.6, 39.8, 8]] });
w.seg(40, 40.5, 40, 44.5, { ext: true });
w.seg(40, 40.5, 53.5, 40.5, { ext: true, h: 11, doors: [[40.6, 53.2, 8.5]] });
w.seg(53.5, 40.5, 58.5, 40.5, { ext: true, h: 11 });
w.seg(53.5, 30, 53.5, 40.5, { doors: [[31, 33.6]] });
w.seg(53.5, 30, 58.5, 30, {  });
w.seg(58.5, 4, 58.5, 8, { ext: true, h: 11, windows: [[4.8, 7.5, 3, 8]] });
w.seg(58.5, 8, 58.5, 18.5, { h: 11, doors: [[10, 15.5, 8]] });
w.seg(58.5, 18.5, 58.5, 20.5, { h: 11 });
w.seg(58.5, 24.5, 58.5, 34, { h: 11 });
w.seg(58.5, 34, 58.5, 40.5, { ext: true, h: 11, windows: [[36, 39, 4, 7]] });
w.seg(58.5, 8, 69, 8, { ext: true, windows: [[60, 67.5, 2, 8]] });
w.seg(69, 6, 69, 8, { ext: true });
w.seg(69, 6, 85.5, 6, { ext: true, windows: [[70.5, 84, 1, 8]] });
w.seg(85.5, 6, 85.5, 68, { ext: true, doors: [[37, 46, 8], [47.5, 56.5, 8], [58, 67, 8]], windows: [[9, 18, 2, 8], [27, 31, 4.5, 7]] });
w.seg(69, 6, 69, 20.5, {  });
w.seg(58.5, 20.5, 85.5, 20.5, { doors: [[64, 67], [75, 78]] });
w.seg(58.5, 24.5, 85.5, 24.5, { doors: [[59.5, 62], [64, 67.5], [70, 72.8, 7], [76, 79], [82, 84.5]] });
w.seg(63.5, 24.5, 63.5, 34, {  });
w.seg(68, 24.5, 68, 34, { t: 0.8 });
w.seg(74.5, 24.5, 74.5, 34, { t: 0.8 });
w.seg(81, 24.5, 81, 34, {  });
w.seg(58.5, 34, 61, 34, { ext: true });
w.seg(61, 34, 85.5, 34, { doors: [[64, 66.8], [76.5, 79.3]] });
w.seg(68, 34, 74.5, 34, { t: 0.8 });
w.seg(61, 34, 61, 68, { ext: true, doors: [[58, 61]], windows: [[48, 52, 4, 6.5]] });
w.seg(61, 68, 85.5, 68, { ext: true, windows: [[65, 70, 4, 6.5], [76.5, 81.5, 4, 6.5]] });

export default {
  id: 'smith-06',
  name: 'Smith 06',
  title: 'Smith 06 — Original Breezeway Farmhouse',
  subtitle: 'Original design · primary suite + 3 bed left · kitchen / dining / living breezeway centre · library, gym, safe room, 3-car garage right · screened porch with see-through fireplace',
  wallH: 9,
  planImage: { src: new URL("./smith-06-plan.png", import.meta.url).href, pxPerFt: 12, originPx: [76, 220], sizePx: [1268, 1218] },
  materials: { ext: '#f4f3ef', int: '#f8f6f1', roofTex: 'metal', roofUnder: '#d8c7a8', gable: 'ext', extSkin: true },
  walls: w,
  rooms: [
    ["Primary Bath", "13'-0\" x 12'-0\"", 'tile', 0, 0, 13.5, 12.5, { vaulted: true }],
    ["Primary Closet", "8'-0\" x 12'-0\"", 'wood', 13.5, 0, 22, 12.5, { minor: true, labelAt: [17.75, 6.25] }],
    ["Primary Suite", "17'-6\" x 20'-0\"", 'wood', 22, 0, 40, 20.5, { vaulted: true }],
    ["Bedroom 2", "11'-0\" x 13'-0\"", 'wood', 0, 12.5, 11.5, 26, {  }],
    ["", "", 'wood', 11.5, 12.5, 18, 15.5, { noLabel: true }],
    ["W.I.C.", "", 'wood', 11.5, 15.5, 18, 22, { minor: true }],
    ["Jack & Jill", "", 'tile', 11.5, 22, 18, 30.5, { minor: true }],
    ["W.I.C.", "", 'wood', 11.5, 30.5, 18, 37, { minor: true }],
    ["", "", 'wood', 11.5, 37, 18, 40, { noLabel: true }],
    ["Bedroom 3", "11'-0\" x 13'-6\"", 'wood', 0, 26, 11.5, 40, {  }],
    ["Hall", "", 'wood', 18, 12.5, 22, 38.5, { minor: true, labelAt: [20, 27] }],
    ["W.I.C.", "", 'wood', 22, 20.5, 28.5, 30, { minor: true }],
    ["Bedroom 4", "11'-0\" x 13'-0\"", 'wood', 28.5, 20.5, 40, 34, {  }],
    ["Hall Bath", "6'-0\" x 8'-0\"", 'tile', 22, 30, 28.5, 38.5, { minor: true }],
    ["Linen", "", 'wood', 28.5, 34, 33, 38.5, { minor: true }],
    ["", "", 'wood', 18, 38.5, 33, 44.5, { noLabel: true }],
    ["Foyer", "6'-6\" x 10'-0\"", 'tile', 33, 34, 40, 44.5, {  }],
    ["Living Room", "18'-0\" x 14'-0\"", 'wood', 40, 4, 58.5, 18.5, { vaulted: true }],
    ["Dining", "18'-0\" x 11'-0\"", 'wood', 40, 18.5, 58.5, 30, { vaulted: true }],
    ["Kitchen", "13'-0\" x 10'-0\"", 'wood', 40, 30, 53.5, 40.5, { vaulted: true, labelAt: [46.75, 37.5] }],
    ["Pantry", "4'-6\" x 10'-0\"", 'wood', 53.5, 30, 58.5, 40.5, { minor: true }],
    ["Office / Library", "10'-0\" x 12'-0\"", 'wood', 58.5, 8, 69, 20.5, {  }],
    ["Gym", "16'-0\" x 14'-0\"", 'gym', 69, 6, 85.5, 20.5, {  }],
    ["Gallery", "", 'wood', 58.5, 20.5, 85.5, 24.5, { minor: true, labelAt: [72, 22.5] }],
    ["Powder", "", 'tile', 58.5, 24.5, 63.5, 34, { minor: true }],
    ["Mud Hall", "", 'tile', 63.5, 24.5, 68, 34, { minor: true }],
    ["Safe / Storage", "6'-0\" x 9'-0\"", 'concrete', 68, 24.5, 74.5, 34, { minor: true }],
    ["Utility / Laundry", "6'-0\" x 9'-0\"", 'tile', 74.5, 24.5, 81, 34, { minor: true }],
    ["Gym Shower", "", 'tile', 81, 24.5, 85.5, 34, { minor: true }],
    ["3-Car Garage", "24'-0\" x 33'-6\"", 'concrete', 61, 34, 85.5, 68, {  }],
    ["Screened Porch", "18'-0\" x 15'-6\"", 'porch', 40, -12, 58.5, 4, { outside: true, labelAt: [49.25, -6] }],
    ["Front Porch", "18'-0\" x 7'-6\"", 'porch', 40, 40.5, 58.5, 48.5, { outside: true }],
    ["", "", 'porch', 33, 44.5, 40, 48.5, { outside: true, noLabel: true }],
    ["", "", 'porch', 0, 40, 18, 44.5, { outside: true, noLabel: true }],
    ["", "", 'terrace', 58.5, 4, 69, 8, { outside: true, noLabel: true }],
  ],
  slabs: [[-0.4, -0.4, 40.4, 44.9], [39.6, 3.6, 58.9, 40.9], [58.1, 5.6, 85.9, 34.4], [60.6, 33.6, 85.9, 68.4], [39.6, -12.4, 58.9, 4], [39.6, 40.5, 58.9, 48.9]],
  ceilings: [[0, 12.5, 22, 44.5], [22, 20.5, 40, 44.5], [13.5, 0, 22, 12.5], [53.5, 30, 58.5, 40.5], [58.5, 6, 85.5, 34], [61, 34, 85.5, 68]],
  roofs: [
    // centre: tall ~13/12 vaulted gable with glass gable ends, carried out over the screened porch (screened gable) and the front porch
    { x0: 40, y0: 4, x1: 58.5, y1: 40.5, along: 'y', pitch: 1.1, oh: 1.2, eave: 11, endOh: [0, 0], ends: ['glass', 'glass'] },
    { x0: 40, y0: -12, x1: 58.5, y1: 4, along: 'y', pitch: 1.1, oh: 1.2, eave: 11, endOh: [1.2, 0], ends: ['glass', null] },
    { x0: 40, y0: 40.5, x1: 58.5, y1: 48.5, along: 'y', pitch: 1.1, oh: 1.2, eave: 11, endOh: [0, 1.2], ends: [null, null] },
    // left (bedroom) wing gable and right wing gable, lower; garage gets its own front-facing gable
    { x0: 0, y0: 0, x1: 40, y1: 44.5, along: 'y', pitch: 0.45, oh: [1, 0], ends: ['ext', 'ext'] },
    { x0: 58.5, y0: 6, x1: 85.5, y1: 34, along: 'y', pitch: 0.45, oh: [0, 1], ends: ['ext', 'ext'] },
    { x0: 61, y0: 34, x1: 85.5, y1: 68, along: 'y', pitch: 0.55, oh: 1, ends: ['ext', 'ext'] },
    // flat black canopy over the front door
    { flat: true, x0: 32.6, y0: 44.5, x1: 40.4, y1: 48.6, h: 8.3 },
  ],
  walkStart: [36.5, 62, 0],
  furnish(k) {
    const T = k.THREE, BK = '#1e1f21';
    const post = (x, y, h) => k.block(x - .35, y - .35, x + .35, y + .35, 0, h, BK, { solid: true });
    const screen = (a, b, c, d) => { const m = k.block(a, b, c, d, 0.3, 9.6, BK, { solid: true }); m.material = new T.MeshStandardMaterial({ color: '#1b1d20', transparent: true, opacity: 0.32, side: T.DoubleSide, depthWrite: false }); m.castShadow = false; };
    // screened porch: posts, screen panels (screen door centred on the back), knee rail
    for (const [x, y] of [[40, -12], [58.5, -12], [40, -4], [58.5, -4], [47.3, -12], [51.2, -12]]) post(x, y, 11);
    screen(39.95, -11.6, 40.05, 3.6); screen(58.45, -11.6, 58.55, 3.6); screen(40.3, -12.05, 47, -11.95); screen(51.5, -12.05, 58.2, -11.95);
    k.block(40, -12.2, 58.5, -11.8, 10.3, 11, BK);
    // two-sided see-through fireplace in the living room's back wall + chimney through the centre ridge
    k.block(46.6, 2.6, 52, 5.4, 0, 11, '#e9e6df', { solid: true });
    k.block(47.6, 2.5, 51, 5.5, 0.8, 3.6, '#141414');
    k.block(46.4, 1.2, 52.2, 2.6, 0, 0.35, '#5c5852'); k.block(46.4, 5.4, 52.2, 6.8, 0, 0.35, '#5c5852');   // hearths both sides
    k.block(47.4, 2.9, 51.2, 5.1, 11, 24.5, '#e9e6df'); k.block(47.3, 2.8, 51.3, 5.2, 24.5, 25, BK);
    // front porch posts, site paths, driveway to the side-load garage
    post(40.4, 48.2, 11); post(58.1, 48.2, 11);
    k.plane(34.5, 48.5, 38.5, 85, 'paver'); k.plane(46, 48.5, 52.5, 56, 'paver');
    k.plane(85.5, 36, 112, 67.5, 'paver'); k.plane(100, 67.5, 112, 92, 'paver');
    // screened porch furniture facing the fireplace
    k.block(43, -9.5, 55.5, -7.4, 0, 2.5, '#7b8590'); k.block(46.5, -5, 52, -2.8, 0, 1.3, '#6b4a2f');
    // living: sofa + chairs facing the fireplace
    k.block(43, 13, 55.5, 15.2, 0, 2.6, '#7b8590'); k.block(42, 8, 44, 12, 0, 2.6, '#9aa0a6'); k.block(54.5, 8, 56.5, 12, 0, 2.6, '#9aa0a6');
    k.block(46.5, 9, 52, 11.5, 0, 1.3, '#6b4a2f');
    // dining table + chairs (kept clear of the breezeway centre line on the sides)
    k.block(45, 22.5, 53.5, 25.5, 0, 2.5, '#6b4a2f');
    for (let x = 45.5; x < 53; x += 2.2) { k.block(x, 21.2, x + 1.2, 22.3, 0, 1.6, '#2a2b2d'); k.block(x, 25.7, x + 1.2, 26.8, 0, 1.6, '#2a2b2d'); }
    // kitchen: island + side counters, fridge
    k.block(43, 31.6, 50.5, 34.4, 0, 3, '#f0ede6', { solid: true }); k.block(42.8, 31.4, 50.7, 34.6, 3, 3.15, '#2b2c2e');
    k.block(40.5, 30.4, 42.5, 39.5, 0, 3, '#f0ede6', { solid: true }); k.block(51, 30.4, 53.1, 40, 0, 3, '#f0ede6', { solid: true });
    k.block(51, 30.4, 53.1, 33, 0, 7, '#c9ccd0', { m: .4, r: .4 });
    k.block(54, 30.5, 55.3, 40, 0, 7, '#9a7a55'); k.block(56.7, 30.5, 58, 40, 0, 7, '#9a7a55');
    // primary suite, baths, closets
    k.bed(26, 3, 33, 10, 'n'); k.block(36, 1, 39.5, 5, 0, 2.5, '#9aa0a6');
    k.block(1, 1, 6, 3.5, 0, 2, '#f4f6f8'); k.block(8.5, 0.6, 12.8, 3.6, 0, 0.3, '#bfe0f0'); k.block(0.6, 6, 2.6, 11.5, 0, 3, '#e8e2d6');
    k.block(14, 0.6, 21.5, 2, 0, 7, '#6b4a2f'); k.block(14, 10.9, 21.5, 12, 0, 7, '#6b4a2f');
    k.bed(1, 16, 7.5, 22.5, 'w'); k.bed(1, 32, 7.5, 38.5, 'w'); k.bed(32.5, 24, 39, 30.5, 'e');
    k.block(12, 23.5, 17.5, 25, 0, 3, '#e8e2d6'); k.block(22.5, 30.5, 28, 32.5, 0, 2, '#f4f6f8');
    // library: shelves + desk; gym: rack, bench, treadmill, mirror wall
    k.block(59, 8.5, 59.9, 20, 0, 8, '#6b4a2f'); k.block(63, 12, 68, 14.5, 2.4, 2.6, '#6b4a2f');
    k.block(70, 7, 74, 11, 0, 7, '#2a2b2d'); k.block(76, 10, 80.5, 11.5, 0, 1.6, '#2a2b2d'); k.block(81.5, 8, 84.5, 14.5, 0, 1.4, '#3a3d40');
    k.block(69.5, 19.5, 85, 19.9, 0.5, 7.5, '#cfe6f3');
    // safe room: vault door; utility: washer/dryer
    k.block(70.3, 24.2, 72.5, 24.6, 0, 7, '#4a4d52');
    k.block(75, 31.5, 77.2, 33.5, 0, 3, '#f4f4f4'); k.block(77.6, 31.5, 79.8, 33.5, 0, 3, '#f4f4f4');
    // garage: three cars facing the side-load doors (closed)
    k.car(66, 38, 82, 44.5, '#2b3a4a'); k.car(66, 48.5, 82, 55, '#9aa3ab'); k.car(66, 59, 82, 65.5, '#6d6f72');
    for (const [a, b] of [[37, 46], [47.5, 56.5], [58, 67]]) k.block(85.55, a, 85.8, b, 0, 8, '#2a2b2d');
  },
};
