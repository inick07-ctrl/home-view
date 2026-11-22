// A-Frame 01 — Fernhollow A-Frame. Compact woodland getaway with a true
// steep A-frame roof to the deck, full-height glass gables, and a sleeping loft.
// Plan feet: x east, y south. FRONT = south. 24' x 28' plus a 10' front deck.
import { makeWalls } from '../lib.js';

const w = makeWalls();
const X = 24, Y = 28, KW = 1.4;
const YB = 12; // loft / bath north of the great room
const YD = Y + 10;

// Short kneewalls only on the sloped sides — the roof is the wall.
w.seg(0, 0, 0, Y, { ext: true, h: KW });
w.seg(X, 0, X, Y, { ext: true, h: KW });
// Bath enclosure under the loft (center-east, standing height)
w.seg(13.2, 1.0, 13.2, YB, { h: 8, doors: [[7.2, 10.2, 6.9]] });
w.seg(13.2, YB, 19.6, YB);
w.seg(19.6, 1.0, 19.6, YB);
w.seg(13.2, 1.0, 19.6, 1.0);

export default {
  id: 'aframe-01',
  name: 'Fernhollow A-Frame',
  title: 'Fernhollow A-Frame',
  subtitle: 'A compact woodland A-frame with a glass front gable, an open great room and fireplace, one bath, and a sleeping loft.',
  wallH: 8,
  defaultStyle: 'english-country',
  buildType: 'aframe',
  walkStart: [12, 40, 0],
  materials: { ext: '#c9b089', int: '#f6f1e8', roofTex: 'shingle', roofUnder: '#e8dcc8', gable: 'glass', extSkin: true },
  walls: w,
  rooms: [
    ['Great Room', '14\'-0" x 16\'-0"', 'wood', 5, YB, 19, Y, { vaulted: true }],
    ['Kitchen', '7\'-0" x 10\'-0"', 'wood', 5.2, 16, 12.4, 26],
    ['Bath', '6\'-5" x 11\'-0"', 'tile', 13.2, 1.0, 19.6, YB],
    ['Sleeping Loft', '10\'-0" x 13\'-6"', 'wood', 7, 0, 17, 13.5, { noFloor: true, loft: true, deckZ: 9.22, labelZ: 11.2, labelAt: [12, 6.5] }],
    ['Front Deck', '28\'-0" x 10\'-0"', 'porch', -2, Y, X + 2, YD, { outside: true }],
  ],
  slabs: [[-0.4, -0.4, X + 0.4, Y + 0.4], [-2.2, Y - 0.1, X + 2.2, YD + 0.2]],
  ceilings: [],
  roofs: [
    { aframe: true, along: 'y', x0: 0, y0: 0, x1: X, y1: Y, pitch: 1.72, eave: 1.35, oh: 0.55, endOh: [0.4, 0.4], ends: ['glass', 'glass'], doorEnd: 1, timber: '#6b4a30', rafters: true },
  ],
  areas: { heated: 950, garage: 0, porch: 280 },
  furnish(k) {
    const TIM = '#6b4a30', CREAM = '#efe7d8', STONE = '#8d8a84';
    // Kitchen run along the west-center, clear of the open walk
    k.block(5.4, 16.3, 11.6, 18.3, 0, 3.0, CREAM, { solid: true });
    k.block(5.4, 16.3, 11.6, 18.3, 3.0, 3.14, '#2a2a2c');
    // Fireplace under the loft, facing the great room / glass
    k.place && k.place('fpStoneTrad', { x: 12, y: YB - 0.425, rot: 0, w: 7.2, d: 2.15, h: 8.6, variant: 'traditional' });
    // Loft deck and railing toward the great room
    k.block(7.1, 0.15, 16.9, 13.35, 9.00, 9.22, 'wood');
    k.block(7.1, 13.2, 16.9, 13.38, 9.22, 11.8, 'wood'); // rail
    k.block(7.1, 13.2, 16.9, 13.38, 11.68, 11.9, TIM);
    // Stair up to the loft (placeable, removable item: Edit Plan → Stairs); top lands on the loft deck edge
    k.place && k.place('stairStraight', { x: 8.7, y: 13.35 + 8.8 / 2, rot: 0, w: 3.2, d: 8.8, dir: 'up', level: true, levelH: 9.22, variant: 'oak', rail: 'wood' });
    // Deck posts
    for (const x of [-1.6, 12, 25.6]) k.block(x - 0.2, YD - 0.35, x + 0.2, YD, 0, 3.4, TIM, { solid: true });
    k.block(-1.7, YD - 0.25, 25.7, YD, 3.4, 3.7, TIM);
  },
};
