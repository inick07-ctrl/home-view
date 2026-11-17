// Smith 01 — single-story U plan (~2,636 sf). Walls/windows/doors auto-extracted from the plan image.
import DATA from './smith-01-data.js';

// half-size image px -> feet (furniture positions read off the drawing)
const DX = (x) => (x * 1.996 - 323) / 17.5, DY = (y) => (y * 1.996 - 83) / 17.5;

export default {
  id: 'smith-01',
  name: 'Smith 01',
  title: 'Smith 01 — Single-Story U-Plan',
  subtitle: 'Single story · ~2,636 sf living · 3 bed + office · 3-car garage',
  wallH: 9,
  planImage: { src: new URL("./smith-01-plan.png", import.meta.url).href, pxPerFt: 17.5, originPx: [323, 83], sizePx: [2044, 1473] },
  materials: { ext: '#ece5d8', int: '#f8f6f1', roof: '#4b5159', roofTex: 'shingle', roofUnder: '#d9d4ca', gable: 'ext', extSkin: false },
  walls: DATA,
  rooms: DATA.rooms,
  slabs: [[-0.1, 10.4, 24.4, 74.9], [24.2, 39.2, 65.4, 60.0], [65.1, -0.1, 91.6, 74.9], [24.2, 59.8, 65.4, 70.4]],
  roofs: [
    { x0: 0.06, y0: 10.57, x1: 24.29, y1: 74.8, along: 'y', pitch: 0.5, oh: 1.5 },
    { x0: 65.2, y0: 0.06, x1: 91.49, y1: 74.8, along: 'y', pitch: 0.5, oh: 1.5 },
    { x0: 24.29, y0: 39.37, x1: 65.2, y1: 70.1, along: 'x', pitch: 0.5, oh: 1.5, endOh: [0, 0] },
  ],
  walkStart: [46.3, 67, 0],
  furnish(k) {
    const b = (x0, y0, x1, y1, h0, h1, c, o) => k.block(DX(x0), DY(y0), DX(x1), DY(y1), h0, h1, c, o);
    k.plane(91.5, 0.5, 112, 36, 'concrete'); // apron outside the east garage doors
    k.plane(42.5, 70, 50, 84, 'stone');      // front walk
    for (const [x0, y0, x1, y1] of [[230, 150, 295, 220], [180, 318, 240, 376], [222, 594, 305, 686]]) k.bed(DX(x0), DY(y0), DX(x1), DY(y1), 'n');
    b(170, 175, 184, 222, 0, 2.6, '#7a5a3a'); b(170, 332, 180, 360, 0, 2.6, '#7a5a3a');
    b(198, 594, 215, 604, 0, 2.2, '#7a5a3a'); b(304, 594, 322, 604, 0, 2.2, '#7a5a3a'); b(172, 618, 188, 664, 0, 3, '#5f4630');
    b(183, 404, 323, 413, 0, 7, '#7a5a3a'); b(170, 404, 178, 465, 0, 7, '#7a5a3a'); b(325, 404, 333, 465, 0, 7, '#7a5a3a');
    b(222, 528, 272, 553, 0, 1.8, '#d9eef8'); b(168, 474, 213, 513, 0, .3, '#bfe0f0');
    b(311, 248, 333, 287, 0, 1.8, '#d9eef8'); b(308, 293, 333, 318, 0, .3, '#bfe0f0');
    b(462, 462, 489, 553, 0, 2.6, '#5d7f9e'); b(373, 433, 406, 465, 0, 2.8, '#8aa86e'); b(420, 410, 484, 420, 0, 2.2, '#4a4a4a'); b(378, 517, 420, 545, 0, 1.5, '#b07c4a');
    b(535, 502, 590, 535, 2.3, 2.6, '#8a5a3a'); b(555, 512, 570, 525, 0, 2.3, '#6b4329');
    for (const cx of [546, 562, 578]) b(cx - 5, 535, cx + 5, 546, 0, 1.6, '#9a6a3f');
    b(645, 512, 700, 531, 0, 3, '#efe7da'); b(621, 545, 737, 558, 0, 3, '#efe7da'); b(722, 498, 738, 545, 0, 6.5, '#c9ccd0', { m: .4, r: .4 }); b(568, 427, 668, 437, 0, 6, '#9a7a55');
    b(861, 399, 886, 443, 0, 4, '#555555'); b(912, 388, 941, 443, 0, 5.5, '#555555');
    b(795, 470, 817, 486, 0, 3, '#f4f4f4'); b(818, 470, 840, 486, 0, 3, '#f4f4f4');
    b(775, 586, 955, 597, 0, 6.5, '#6a5a44'); b(943, 474, 955, 550, 0, 6, '#8b6a45');
    b(830, 631, 886, 659, 2.4, 2.6, '#8a5a3a'); b(846, 610, 866, 626, 0, 3.4, '#2f2f2f'); b(945, 611, 955, 690, 0, 7.5, '#6b4a2f'); b(800, 677, 945, 689, 0, 7.5, '#6b4a2f');
    for (const x of [404, 432, 505, 533, 616, 644]) b(x, 606, x + 20, 627, 0, 3, '#2f6f5e');
    b(493, 606, 511, 625, 0, 2, '#7a5a3a');
    k.car(DX(784), DY(79), DX(936), DY(139), '#4a4a4a'); k.car(DX(784), DY(178), DX(936), DY(238), '#b33a3a'); k.car(DX(784), DY(278), DX(936), DY(338), '#3b6ea5');
    for (const x of [24.8, 34.8, 44.8, 54.8, 64.8]) k.block(x - .35, 69.4, x + .35, 70.1, 0, 9, '#ffffff', { solid: true });
    k.block(42.5, 70, 50, 71.2, -0.6, -0.2, '#9a9a96'); k.block(42.5, 70, 50, 70.6, -0.6, -0.01, '#9a9a96');
  },
};
