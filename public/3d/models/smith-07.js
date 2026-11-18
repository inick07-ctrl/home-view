// Smith 07 — single-story farmhouse from Nick's plan image (60'-class farmhouse: bedroom wing left, open living / dining / kitchen centre,
// study + foyer + flex room across the front, mudroom / drop zone / powder / laundry, side-load 3-car garage on the right).
// The plan image's room labels don't all agree with its overall dimension, so the model follows the room labels: the house is 66' wide
// (plus a 24' garage) and 61' deep. Plan PNG is generated (clean, no watermark) by s07/gen07.py from the same wall list.
// Plan feet: x east, y south. FRONT = south (bottom of the plan), rear porch = north.
import { makeWalls } from '../lib.js';

const w = makeWalls();
w.seg(0, 0, 16, 0, { ext: true, windows: [[3, 7, 3, 7], [9, 13, 3, 7]] });
w.seg(0, 0, 0, 61, { ext: true, windows: [[4, 10, 3, 7], [24, 29, 4.5, 7], [35, 40, 3, 7], [45, 48, 4.5, 7], [53, 58, 3, 7]] });
w.seg(0, 61, 16, 61, { ext: true, windows: [[3.5, 8.5, 3, 7]] });
w.seg(16, 0, 16, 12, { ext: true, windows: [[4, 9, 3, 7]] });
w.seg(16, 46, 16, 61, { ext: true });
w.seg(16, 12, 66, 12, { ext: true, doors: [[38.5, 43.5, 8]], windows: [[19, 24, 2.5, 7.5], [26, 31, 2.5, 7.5], [50, 57, 4, 7]] });
w.seg(16, 46, 48, 46, { ext: true, doors: [[30.2, 33.8, 8]], windows: [[19, 25, 2.5, 7.5], [29, 30, 1, 7.5], [34, 35, 1, 7.5], [39, 45, 2.5, 7.5]] });
w.seg(48, 44, 48, 46, { ext: true });
w.seg(48, 44, 66, 44, { ext: true, windows: [[49.5, 51.5, 4.5, 7], [57, 62, 4, 7]] });
w.seg(66, 12, 90, 12, { ext: true, h: 10, windows: [[74, 82, 5, 7.5]] });
w.seg(90, 12, 90, 46, { ext: true, h: 10, doors: [[13.5, 22.5, 8], [24.5, 33.5, 8], [35.5, 44.5, 8]] });
w.seg(66, 46, 90, 46, { ext: true, h: 10, doors: [[70, 73]], windows: [[80, 86, 4, 7]] });
w.seg(66, 44, 66, 46, { ext: true, h: 10 });
w.seg(66, 12, 66, 44, { h: 10, doors: [[31, 34]] });
w.seg(0, 14, 16, 14, { doors: [[2.5, 5], [12.5, 15.5]] });
w.seg(12, 14, 12, 61, { doors: [[38, 41], [45, 47.5], [51, 54]] });
w.seg(8, 14, 8, 21, {  });
w.seg(0, 21, 12, 21, { doors: [[3, 5.5], [8.8, 11.2]] });
w.seg(0, 32, 12, 32, {  });
w.seg(0, 43, 12, 43, {  });
w.seg(0, 50, 12, 50, {  });
w.seg(12, 54, 16, 54, { doors: [[12.6, 15.4]] });
w.seg(16, 12, 16, 46, { doors: [[30.3, 33.7, 8]] });
w.seg(16, 34, 48, 34, { doors: [[29, 35, 8]] });
w.seg(28, 34, 28, 46, { doors: [[38, 42]] });
w.seg(36, 34, 36, 46, { doors: [[38, 42]] });
w.seg(60, 22, 60, 30, { doors: [[25, 27.6]] });
w.seg(60, 22, 66, 22, {  });
w.seg(48, 30, 66, 30, { doors: [[49, 52]] });
w.seg(48, 30, 48, 44, { doors: [[30.5, 33.5]] });
w.seg(58, 30, 58, 36, { doors: [[31, 35, 8]] });
w.seg(48, 36, 66, 36, { doors: [[49.2, 51.8], [55, 58]] });
w.seg(53, 36, 53, 44, {  });

export default {
  id: 'smith-07',
  name: 'Smith 07',
  title: 'Smith 07 — Single-Story Farmhouse',
  subtitle: "Single story · ~2,640 sf living · 3 bed + study + flex room · open living / dining / kitchen with walk-in pantry · 50' front & rear porches · side-load 3-car garage",
  wallH: 9,
  planImage: { src: new URL("./smith-07-plan.png", import.meta.url).href, pxPerFt: 12, originPx: [76, 88], sizePx: [1268, 990] },
  materials: { ext: '#f5f4f0', int: '#f8f6f1', roofTex: 'metal', roofUnder: '#d8c7a8', gable: 'ext', extSkin: true },
  walls: w,
  rooms: [
    ["Master Bedroom", "15'-6\" x 13'-6\"", 'wood', 0, 0, 16, 14, {  }],
    ["Walk-in Closet", "7'-6\" x 6'-6\"", 'wood', 0, 14, 8, 21, { minor: true }],
    ["W.C.", "", 'tile', 8, 14, 12, 21, { minor: true }],
    ["Master Bath", "11'-6\" x 10'-6\"", 'tile', 0, 21, 12, 32, {  }],
    ["Bedroom 2", "11'-6\" x 10'-6\"", 'wood', 0, 32, 12, 43, {  }],
    ["Bath 2", "11'-6\" x 6'-6\"", 'tile', 0, 43, 12, 50, { minor: true }],
    ["Bedroom 3", "11'-6\" x 10'-6\"", 'wood', 0, 50, 12, 61, {  }],
    ["Hall", "", 'wood', 12, 14, 16, 54, { minor: true, labelAt: [14, 26] }],
    ["Closet", "", 'wood', 12, 54, 16, 61, { minor: true }],
    ["Living Room", "17'-6\" x 17'-6\"", 'wood', 16, 12, 34, 30, { vaulted: true }],
    ["Dining Area", "12'-6\" x 17'-6\"", 'wood', 34, 12, 47, 30, { vaulted: true }],
    ["Kitchen", "12'-6\" x 17'-6\"", 'wood', 47, 12, 60, 30, { vaulted: true, labelAt: [53.5, 26.5] }],
    ["", "", 'wood', 60, 12, 66, 22, { noLabel: true }],
    ["Walk-in Pantry", "5'-6\" x 7'-6\"", 'wood', 60, 22, 66, 30, { minor: true }],
    ["", "", 'wood', 16, 30, 48, 34, { noLabel: true }],
    ["Study / Office", "11'-6\" x 11'-6\"", 'wood', 16, 34, 28, 46, {  }],
    ["Foyer", "7'-6\" x 11'-6\"", 'tile', 28, 34, 36, 46, {  }],
    ["Flex Room", "11'-6\" x 11'-6\"", 'wood', 36, 34, 48, 46, {  }],
    ["Mudroom", "9'-6\" x 5'-6\"", 'tile', 48, 30, 58, 36, { minor: true }],
    ["Drop Zone", "7'-6\" x 5'-6\"", 'tile', 58, 30, 66, 36, { minor: true }],
    ["Powder", "4'-6\" x 7'-6\"", 'tile', 48, 36, 53, 44, { minor: true }],
    ["Laundry", "12'-6\" x 7'-6\"", 'tile', 53, 36, 66, 44, { minor: true }],
    ["3-Car Garage", "23'-6\" x 33'-6\"", 'concrete', 66, 12, 90, 46, {  }],
    ["Rear Porch", "49'-6\" x 9'-6\"", 'porch', 16, 2, 66, 12, { outside: true }],
    ["Front Porch", "49'-6\" x 7'-6\"", 'porch', 16, 46, 66, 54, { outside: true, labelAt: [32, 50.5] }],
    ["", "", 'porch', 48, 44, 66, 46, { outside: true, noLabel: true }],
  ],
  slabs: [[-0.4, -0.4, 16.4, 61.4], [15.6, 11.6, 66.4, 46.4], [65.6, 11.6, 90.4, 46.4], [16, 2, 66, 12], [16, 46, 66, 54]],
  ceilings: [[0, 0, 16, 61], [16, 34, 48, 46], [48, 30, 66, 44], [60, 12, 66, 30], [66, 12, 90, 46, 10]],
  roofs: [
    // main house: one long side-gable over the centre (ridge east-west), 8/12, gable ends to the bedroom wing and the garage
    { x0: 16, y0: 12, x1: 66, y1: 46, pitch: 0.67, oh: [0.4, 0.4], endOh: [0, 0], ends: ['ext', 'ext'] },
    // bedroom wing: front-facing gable (ridge north-south) so the wing reads as its own gable from the street
    { x0: 0, y0: 0, x1: 16, y1: 61, along: 'y', pitch: 0.67, oh: 1, ends: ['ext', 'ext'] },
    // garage: lower side gable, gable end over the side-load doors
    { x0: 66, y0: 12, x1: 90, y1: 46, pitch: 0.5, oh: 1, eave: 10, endOh: [0, 1], ends: [null, 'ext'] },
    // full-length shed roofs over the rear and front porches (low edge outboard)
    { shed: true, x0: 16, y0: 1.4, x1: 66, y1: 12, hi: 8.2, lo: 9.4, oh: 0.6 },
    { shed: true, x0: 16, y0: 46, x1: 66, y1: 54.6, hi: 9.4, lo: 8.2, oh: 0.6 },
  ],
  walkStart: [32, 70, 0],
  furnish(k) {
    const BK = '#1e1f21', WD = '#8a6440';
    const post = (x, y) => k.block(x - .35, y - .35, x + .35, y + .35, 0, 8.2, WD, { solid: true });
    // porch posts (cedar) + beams
    for (const x of [16.4, 28.9, 41.4, 53.9, 65.6]) { post(x, 2.05); post(x, 53.6); }
    k.block(16, 1.7, 66, 2.4, 7.7, 8.3, WD); k.block(16, 53.25, 66, 53.95, 7.7, 8.3, WD);
    // front steps, walk and the driveway to the side-load garage
    k.block(29.5, 54, 34.5, 55.6, -0.6, -0.25, '#9a9a96');
    k.plane(30, 55.6, 34, 80, 'paver'); k.plane(90, 13, 116, 45, 'paver'); k.plane(104, 45, 116, 80, 'paver');
    // fireplace on the living room's west wall + chimney through the roof
    k.block(16.2, 17.5, 18.4, 24.5, 0, 9, '#c9c4b8', { solid: true }); k.block(18.3, 19, 18.5, 23, 0.8, 3.4, '#141414');
    k.block(18.4, 17, 20.2, 25, 0, 0.3, '#5c5852');
    k.block(16.4, 18.5, 18.4, 23.5, 9, 23.5, '#c9c4b8'); k.block(16.3, 18.4, 18.5, 23.6, 23.5, 24, BK);
    // living: sofa + chairs facing the fireplace, rug-table
    k.block(26.5, 17, 28.8, 26, 0, 2.6, '#7b8590'); k.block(21, 15, 25, 16.8, 0, 2.6, '#9aa0a6'); k.block(21, 25.2, 25, 27, 0, 2.6, '#9aa0a6');
    k.block(21.5, 19.5, 24.5, 22.5, 0, 1.3, '#6b4a2f');
    // dining table + chairs
    k.block(38, 17, 42.5, 25, 0, 2.5, '#6b4a2f');
    for (let y = 17.6; y < 24.6; y += 2.2) { k.block(36.6, y, 37.7, y + 1.1, 0, 1.6, '#2a2b2d'); k.block(42.8, y, 43.9, y + 1.1, 0, 1.6, '#2a2b2d'); }
    // kitchen: island with stools, back counter + range, fridge, pantry shelves
    k.block(51, 18, 56, 22.5, 0, 3, '#f0ede6', { solid: true }); k.block(50.8, 17.8, 56.2, 22.7, 3, 3.15, '#2b2c2e');
    for (let y = 18.3; y < 22.3; y += 1.4) k.block(49.4, y, 50.4, y + 1, 0, 2.6, BK);
    k.block(57.6, 12.6, 59.9, 22, 0, 3, '#f0ede6', { solid: true }); k.block(57.8, 15.5, 59.8, 18, 3, 3.1, '#2f2f2f');
    k.block(60.4, 12.6, 63, 15.4, 0, 7, '#c9ccd0', { m: .4, r: .4 }); k.block(63.2, 12.6, 65.6, 22, 0, 3, '#f0ede6', { solid: true });
    k.block(60.4, 22.6, 61.5, 29.6, 0, 7, '#9a7a55'); k.block(64.5, 22.6, 65.6, 29.6, 0, 7, '#9a7a55');
    // bedrooms + baths
    k.bed(4.5, 3, 11.5, 10, 'n'); k.block(0.6, 1, 3.4, 3, 0, 2.2, '#6b4a2f'); k.block(12.6, 1, 15.4, 3, 0, 2.2, '#6b4a2f');
    k.block(0.6, 14.6, 7.4, 15.6, 0, 7, '#6b4a2f'); k.block(0.6, 20, 7.4, 20.6, 0, 7, '#6b4a2f');
    k.block(8.6, 15, 11.4, 17.2, 0, 1.4, '#f4f6f8');
    k.block(0.6, 21.6, 6, 24.4, 0, 0.3, '#bfe0f0'); k.block(0.6, 26, 2.6, 31.4, 0, 3, '#e8e2d6'); k.block(6.5, 28, 11.4, 31.4, 0, 2, '#f4f6f8');
    k.bed(1, 34.5, 7.5, 41, 'w'); k.bed(1, 52.5, 7.5, 59, 'w');
    k.block(0.6, 43.6, 4.5, 46, 0, 3, '#e8e2d6'); k.block(7, 43.6, 11.4, 46.4, 0, 0.3, '#bfe0f0');
    // study desk, flex sofa, laundry
    k.block(19, 39, 25, 41.5, 2.4, 2.6, '#6b4a2f'); k.block(21.3, 41.8, 22.8, 43.3, 0, 3.3, '#2f2f2f');
    k.block(38.5, 43, 45.5, 45.4, 0, 2.6, '#7b8590');
    k.block(60, 41.4, 62.2, 43.4, 0, 3, '#f4f4f4'); k.block(62.6, 41.4, 64.8, 43.4, 0, 3, '#f4f4f4');
    k.block(58.6, 30.6, 65.4, 31.8, 0, 6, '#6b4a2f');                       // drop-zone lockers
    // rear porch dining table; front porch rockers
    k.block(46, 5, 56, 8, 0, 2.5, '#6b4a2f');
    for (const x of [20, 23, 40, 43]) { k.block(x, 49.6, x + 1.6, 51.2, 1.2, 1.5, BK); k.block(x, 51, x + 1.6, 51.2, 1.5, 3.3, BK); }
    // garage: three cars nosed toward the side-load doors (closed)
    k.car(70, 14.5, 87, 21.5, '#2b3a4a'); k.car(70, 25.5, 87, 32.5, '#9aa3ab'); k.car(70, 36.5, 87, 43.5, '#6d6f72');
    for (const [a, b] of [[13.5, 22.5], [24.5, 33.5], [35.5, 44.5]]) k.block(90.05, a, 90.3, b, 0, 8, '#2a2b2d');
  },
};
