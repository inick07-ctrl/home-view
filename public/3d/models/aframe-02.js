// A-Frame 02 — Lodgepole A-Frame. Classic timber A-frame with side dormers,
// two bedrooms plus a loft, two baths, and a wrap-around deck.
// Plan feet: x east, y south. FRONT = south. 28' x 36' plus decks.
import { makeWalls } from '../lib.js';

const w = makeWalls();
const X = 28, Y = 36, KW = 1.4;
const YB = 16; // bedrooms/baths under the loft
const YD = Y + 10;

w.seg(0, 0, 0, 3, { ext: true, h: KW });
w.seg(0, 11, 0, Y, { ext: true, h: KW });
w.seg(X, 0, X, 3, { ext: true, h: KW });
w.seg(X, 11, X, Y, { ext: true, h: KW });
// Center hall opening into the great room (kept clear of the fireplace)
w.seg(13.0, YB, 15.0, YB);
const YBED = 11.2;
// Bedroom 1 (west) | hall
w.seg(6.0, 0.8, 13.0, 0.8);
w.seg(6.0, 0.8, 6.0, YBED);
w.seg(6.0, YBED, 13.0, YBED, { doors: [[8.4, 11.6, 6.9]] });
w.seg(13.0, 0.8, 13.0, YBED);
// Bedroom 2 (east)
w.seg(15.0, 0.8, 22.0, 0.8);
w.seg(22.0, 0.8, 22.0, YBED);
w.seg(15.0, YBED, 22.0, YBED, { doors: [[16.6, 19.8, 6.9]] });
w.seg(15.0, 0.8, 15.0, YBED);
// Bath 1 west of the hall, south of bed 1
w.seg(6.0, YBED, 6.0, YB);
w.seg(6.0, YB, 13.0, YB, { doors: [[8.2, 11.4, 6.9]] });
// Bath 2
w.seg(22.0, YBED, 22.0, YB);
w.seg(15.0, YB, 22.0, YB, { doors: [[16.8, 20.0, 6.9]] });
// Dormer cheek / face walls (west and east bumps)
w.seg(-4, 3, -4, 11, { ext: true, h: 8.6, windows: [[5.2, 8.8, 2.8, 7.0]] });
w.seg(-4, 3, 0, 3, { ext: true, h: 8.6 });
w.seg(-4, 11, 0, 11, { ext: true, h: 8.6 });
w.seg(X, 3, X + 4, 3, { ext: true, h: 8.6 });
w.seg(X, 11, X + 4, 11, { ext: true, h: 8.6 });
w.seg(X + 4, 3, X + 4, 11, { ext: true, h: 8.6, windows: [[5.2, 8.8, 2.8, 7.0]] });

export default {
  id: 'aframe-02',
  name: 'Lodgepole A-Frame',
  title: 'Lodgepole A-Frame',
  subtitle: 'A classic timber A-frame with side dormers, two bedrooms plus a loft, two baths, and a wrap-around deck.',
  wallH: 8,
  defaultStyle: 'english-country',
  buildType: 'aframe',
  walkStart: [14, 48, 0],
  materials: { ext: '#c4a676', int: '#f7f2e9', roofTex: 'shingle', roofUnder: '#e6d9c4', gable: 'glass', extSkin: true },
  walls: w,
  rooms: [
    ['Great Room', '16\'-0" x 20\'-0"', 'wood', 6, YB, 22, Y, { vaulted: true }],
    ['Kitchen', '10\'-0" x 12\'-0"', 'wood', 6, 22, 16, 34],
    ['Bedroom 1', '6\'-0" x 11\'-7"', 'wood', 7.2, 0.8, 13.2, 12.4],
    ['Bedroom 2', '6\'-0" x 11\'-7"', 'wood', 14.8, 0.8, 20.8, 12.4],
    ['Bath 1', '6\'-0" x 3\'-7"', 'tile', 7.2, 12.4, 13.2, YB],
    ['Bath 2', '6\'-0" x 3\'-7"', 'tile', 14.8, 12.4, 20.8, YB],
    ['West Dormer', '4\'-0" x 8\'-0"', 'wood', -4, 3, 0, 11, { minor: true }],
    ['East Dormer', '4\'-0" x 8\'-0"', 'wood', X, 3, X + 4, 11, { minor: true }],
    ['Sleeping Loft', '12\'-0" x 16\'-0"', 'wood', 8, 0, 20, 16, { noFloor: true, loft: true, deckZ: 9.22, labelZ: 11.4, labelAt: [14, 8] }],
    ['Front Deck', '36\'-0" x 10\'-0"', 'porch', -4, Y, X + 4, YD, { outside: true }],
    ['West Deck', '8\'-0" x 36\'-0"', 'porch', -8, 8, -2, Y, { outside: true, minor: true }],
    ['East Deck', '8\'-0" x 36\'-0"', 'porch', X + 2, 8, X + 8, Y, { outside: true, minor: true }],
  ],
  slabs: [[-0.4, -0.4, X + 0.4, Y + 0.4], [-4.3, 2.7, 0.2, 11.3], [X - 0.2, 2.7, X + 4.3, 11.3], [-8.2, 7.8, X + 8.2, YD + 0.2]],
  ceilings: [],
  roofs: [
    { aframe: true, along: 'y', x0: 0, y0: 0, x1: X, y1: Y, pitch: 1.65, eave: 1.35, oh: 0.55, endOh: [0.4, 0.4], ends: ['glass', 'glass'], doorEnd: 1, timber: '#6b4a30', rafters: true },
    { x0: -4, y0: 3, x1: 5, y1: 11, along: 'y', pitch: 0.7, oh: 0.4, eave: 8.6, ends: ['ext', 'ext'] },
    { x0: 23, y0: 3, x1: X + 4, y1: 11, along: 'y', pitch: 0.7, oh: 0.4, eave: 8.6, ends: ['ext', 'ext'] },
  ],
  areas: { heated: 1450, garage: 0, porch: 640 },
  furnish(k) {
    const TIM = '#6b4a30', CREAM = '#efe7d8', STONE = '#8d8a84';
    k.block(6.2, 22.3, 15.7, 24.4, 0, 3.0, CREAM, { solid: true });
    k.block(6.2, 22.3, 15.7, 24.4, 3.0, 3.14, '#2a2a2c');
    // Fireplace east of the hall so the center walk stays clear
    k.place && k.place('fpStoneTrad', { x: 20.3, y: YB + 0.925, rot: 0, w: 7.8, d: 2.15, h: 8.6, variant: 'traditional' });
    k.block(8.1, 0.2, 19.9, 15.8, 9.00, 9.22, 'wood');
    k.block(8.1, 15.65, 19.9, 15.85, 9.22, 11.8, 'wood');
    k.block(8.1, 15.65, 19.9, 15.85, 11.68, 11.9, TIM);
    // Stair up to the loft (placeable, removable item: Edit Plan → Stairs)
    k.place && k.place('stairStraight', { x: (8.2 + 11.2) / 2, y: (15.8 + 24.85) / 2, rot: 0, w: 3.0, d: 24.85 - 15.8, dir: 'up', level: true, levelH: 9.22, variant: 'oak', rail: 'wood' });
    for (const x of [-3.6, 14, 31.6]) k.block(x - 0.2, YD - 0.35, x + 0.2, YD, 0, 3.4, TIM, { solid: true });
    k.block(-3.7, YD - 0.25, 31.7, YD, 3.4, 3.7, TIM);
  },
};
