// A-Frame 03 — Whitepine Homestead. Grand A-frame with a cathedral glass
// great room, three bedrooms, a loft, mudroom/laundry, and a side garage wing.
// Plan feet: x east, y south. FRONT = south. A-frame 32' x 36', plus north wing.
import { makeWalls } from '../lib.js';

const w = makeWalls();
const X = 32, Y = 36, KW = 1.4;
const YB = 16;
const YD = Y + 12;
// North wing: mud/laundry x=10-22, y=-12-0; garage x=22-46, y=-12-12
const XM0 = 10, XM1 = 22, XG1 = 46, YN = -12, YG = 12;

w.seg(0, 0, 0, Y, { ext: true, h: KW });
w.seg(X, 0, X, Y, { ext: true, h: KW });
// Bedrooms under the loft
w.seg(6.8, 0.8, 15.2, 0.8);
w.seg(6.8, 0.8, 6.8, 11.6);
w.seg(6.8, 11.6, 15.2, 11.6, { doors: [[9.4, 12.6, 6.9]] });
w.seg(15.2, 0.8, 15.2, 11.6);
w.seg(16.8, 0.8, 25.2, 0.8);
w.seg(25.2, 0.8, 25.2, 11.6);
w.seg(16.8, 11.6, 25.2, 11.6, { doors: [[19.0, 22.2, 6.9]] });
w.seg(16.8, 0.8, 16.8, 11.6);
// Bath 1 (full) and Bath 2 (3/4) between bedrooms and great room
w.seg(6.8, 11.6, 6.8, YB);
w.seg(6.8, YB, 15.2, YB, { doors: [[9.2, 12.4, 6.9]] });
w.seg(16.8, 11.6, 16.8, YB);
w.seg(16.8, YB, 25.2, YB, { doors: [[19.0, 22.2, 6.9]] });
// Mudroom / laundry north of the back gable
w.seg(XM0, YN, XM1, YN, { ext: true, windows: [[12, 16, 3, 7]] });
w.seg(XM0, YN, XM0, 0, { ext: true, windows: [[-9, -4, 3, 7]] });
// Garage enclosure
w.seg(XM1, YN, XG1, YN, { ext: true });
w.seg(XG1, YN, XG1, YG, { ext: true, windows: [[-6, -1, 3, 7], [3, 8, 3, 7]] });
w.seg(XM1, YG, XG1, YG, { ext: true, doors: [[26, 35, 8], [37, 46, 8]] });
w.seg(XM1, 0, XM1, YG, { ext: true, doors: [[2, 5.2, 6.9]] });
// Mud | garage
w.seg(XM1, YN, XM1, 0, { doors: [[-8, -5, 6.9]] });
// Powder room in the west of the mudroom (the 1/2 bath)
w.seg(10.2, -6.8, 14.6, -6.8);
w.seg(14.6, -11.8, 14.6, -6.8, { doors: [[-11.0, -8.0, 6.9]] });

export default {
  id: 'aframe-03',
  name: 'Whitepine Homestead',
  title: 'Whitepine Homestead',
  subtitle: 'A grand A-frame homestead with cathedral glass, three bedrooms and a loft, a kitchen island, mudroom, and a garage wing.',
  wallH: 8,
  defaultStyle: 'english-country',
  buildType: 'aframe',
  walkStart: [16, 50, 0],
  materials: { ext: '#cbb48a', int: '#f7f2e8', roofTex: 'shingle', roofUnder: '#e8dcc8', gable: 'glass', extSkin: true },
  walls: w,
  rooms: [
    ['Great Room', '18\'-0" x 20\'-0"', 'wood', 7, YB, 25, Y, { vaulted: true }],
    ['Kitchen', '14\'-0" x 14\'-0"', 'wood', 8, 20, 22, 34],
    ['Bedroom 1', '8\'-5" x 10\'-10"', 'wood', 6.8, 0.8, 15.2, 11.6],
    ['Bedroom 2', '8\'-5" x 10\'-10"', 'wood', 16.8, 0.8, 25.2, 11.6],
    ['Bath 1', '8\'-5" x 4\'-5"', 'tile', 6.8, 11.6, 15.2, YB],
    ['Bath 2', '8\'-5" x 4\'-5"', 'tile', 16.8, 11.6, 25.2, YB],
    ['Bedroom 3', '7\'-7" x 10\'-8"', 'wood', 8.2, 0.3, 15.8, 11.0, { noFloor: true, loft: true, deckZ: 9.22, labelZ: 11.4, labelAt: [12.0, 5.5] }],
    ['Upper Lounge', '7\'-10" x 15\'-2"', 'wood', 16.0, 0.3, 23.8, 15.5, { noFloor: true, loft: true, deckZ: 9.22, labelZ: 11.4, labelAt: [20.0, 8] }],
    ['Mudroom / Laundry', '7\'-5" x 12\'-0"', 'tile', 14.6, YN, XM1, 0],
    ['Powder', '4\'-5" x 5\'-0"', 'tile', 10.2, -11.8, 14.6, -6.8],
    ['Garage', '24\'-0" x 24\'-0"', 'concrete', XM1, YN, XG1, YG, { minor: true }],
    ['Front Deck', '40\'-0" x 12\'-0"', 'porch', -4, Y, X + 4, YD, { outside: true }],
  ],
  slabs: [[-0.4, -0.4, X + 0.4, Y + 0.4], [XM0 - 0.3, YN - 0.3, XG1 + 0.3, YG + 0.3], [-4.2, Y - 0.1, X + 4.2, YD + 0.2]],
  ceilings: [
    [XM0, YN, XM1, 0, 9],
    [XM1, YN, XG1, YG, 9],
  ],
  roofs: [
    { aframe: true, along: 'y', x0: 0, y0: 0, x1: X, y1: Y, pitch: 1.6, eave: 1.4, oh: 0.55, endOh: [0.4, 0.4], ends: ['ext', 'glass'], doorEnds: [0, 1], timber: '#6b4a30', rafters: true },
    { x0: XM0, y0: YN, x1: XM1, y1: 0, pitch: 0.45, oh: 0.8, eave: 9, ends: ['ext', 'ext'] },
    { x0: XM1, y0: YN, x1: XG1, y1: YG, pitch: 0.4, oh: 1.0, eave: 9, ends: ['ext', 'ext'] },
  ],
  areas: { heated: 2150, garage: 576, porch: 480 },
  furnish(k) {
    const TIM = '#6b4a30', CREAM = '#efe7d8', STONE = '#8d8a84';
    k.block(8.3, 20.3, 21.6, 22.3, 0, 3.0, CREAM, { solid: true });
    k.block(8.3, 20.3, 21.6, 22.3, 3.0, 3.14, '#2a2a2c');
    k.block(11.5, 25.2, 18.5, 29.0, 0, 3.05, CREAM, { solid: true });
    k.block(11.5, 25.2, 18.5, 29.0, 3.05, 3.2, '#2a2a2c');
    // Fireplace east of the center hall so circulation stays clear
    k.place && k.place('fpStoneTrad', { x: 22.6, y: YB + 0.95, rot: 0, w: 7.6, d: 2.2, h: 8.8, variant: 'traditional' });
    k.block(8.1, 0.2, 23.9, 15.8, 9.00, 9.22, 'wood');
    k.block(8.1, 15.65, 23.9, 15.85, 9.22, 11.8, 'wood');
    k.block(8.1, 15.65, 23.9, 15.85, 11.68, 11.9, TIM);
    // Loft bedroom partition with a clear opening at the south-east corner
    k.block(15.85, 0.25, 16.05, 9.3, 9.22, 11.8, 'wood');
    k.block(8.15, 11.0, 13.2, 11.2, 9.22, 11.8, 'wood');
    for (let i = 0; i < 12; i++) {
      const z = i * (9.0 / 12);
      const y = 15.8 + i * 0.75;
      k.block(8.3, y, 11.3, y + 0.8, z, z + 0.18, 'wood');
    }
    for (const x of [-3.4, 16, 35.4]) k.block(x - 0.22, YD - 0.35, x + 0.22, YD, 0, 3.5, TIM, { solid: true });
    k.block(-3.5, YD - 0.25, 35.5, YD, 3.5, 3.85, TIM);
  },
};
