// Smith 12 — Twin Porch Homestead, from Nick's attached floor plan.
// Plan feet: x east, y south. FRONT = south. Origin = west edge of the garage / rear-most wall (y = 0).
//
// The open core is specified 34'-10" wide, but Kitchen 7'-11" + Dining 9'-4" + Living 15'-7" = 32'-10".
// The leftover 2'-0" is a clear no-label gallery on the west of the core, so the 3'-10" left hall
// opens into the center with no walls, counters, or cabinets in the hallway or doorways.
// Left-wing rooms stack to 40'-5"; a 2'-5" linen closet between the bath and Bedroom 2 makes the
// porch-to-porch depth of 42'-10". Right-wing mid band is 7'-10" (15'+10'-6"+9'-6" vs 42'-10").
import { makeWalls } from '../lib.js';

const w = makeWalls();

// ----- overall grid -----
const XG0 = 0;
const XG1 = 26.5;            // garage east / left wing west
const XL1 = 41.5;            // left wing east / core west
const XC1 = 76.3333;         // core east / right wing west (41.5 + 34.8333)
const XR1 = 91.3333;         // right wing east

const Y0 = 0;
const YRP = 9.9167;          // 9'-11" rear porch south / core north
const YC1 = 34.9167;         // core south / front porch north
const Y1 = 42.8333;          // 7'-11" front porch south  (42'-10" overall)

// Left wing
const YB3 = 11;              // Bedroom 3 south
const YLAU = 17.3333;        // Laundry 6'-4"
const YPAN = 23.75;          // Pantry 6'-5"
const YBT = 29.4167;         // Bath 5'-8"
const YLN = 31.8333;         // linen 2'-5" / Bedroom 2 north
const LHX = 37.6667;         // hall west (3'-10" hall to XL1); mid rooms are 11'-2" wide
const CL = 2;                // reach-in closet depth
const CLX = 33.5;            // closet east (7' wide, west side of bedrooms)

// Core
const XGAL = 43.5;           // 2' gallery east / kitchen west
const XK = 51.4167;          // kitchen 7'-11"
const XD = 60.75;            // dining 9'-4"
// living runs XD → XC1 (15'-7")

// Right wing
const YPR = 15;              // Primary Bedroom south (15' deep)
const YPB = 25.5;            // Primary Bath 10'-6"
const YST = 33.3333;         // Study north (9'-6" to Y1); mid band 7'-10"
const RHX = 79.3333;         // right hall east (3'-0" hall)
const PX = 83.6663;          // powder/storage east (4'-4"); WIC west
const YPD = 28.8333;         // storage south / powder north (powder 4'-6" deep)
const SCL = 35.3333;         // study closet south (2' on north wall, east side)
const SCLX = 85.3333;

// =====================================================================
// EXTERIOR
// =====================================================================
// Bedroom 3 north
w.seg(XG1, Y0, XL1, Y0, { ext: true, windows: [[28.5, 33.5, 2.5, 7.5], [35.5, 39.5, 2.5, 7.5]] });
// Primary Bedroom north
w.seg(XC1, Y0, XR1, Y0, { ext: true, windows: [[78.3333, 83.3333, 2.5, 7.5], [85.3333, 89.3333, 2.5, 7.5]] });
// Right wing east
w.seg(XR1, Y0, XR1, Y1, { ext: true, windows: [[3, 8, 2.5, 7.5], [17, 22, 3, 7], [36, 40.5, 3, 7]] });
// Study south
w.seg(XC1, Y1, XR1, Y1, { ext: true, windows: [[78.8333, 83.8333, 3, 7], [85.8333, 89.8333, 3, 7]] });
// Bedroom 2 south
w.seg(XG1, Y1, XL1, Y1, { ext: true, windows: [[28.5, 33.5, 3, 7], [35.5, 39.5, 3, 7]] });
// Bedroom 2 west (south of garage)
w.seg(XG1, YC1, XG1, Y1, { ext: true, windows: [[36.2, 40.5, 3, 7]] });
// Garage south — two 9' front-entry doors
w.seg(XG0, YC1, XG1, YC1, { ext: true, doors: [[2.25, 11.25, 8], [15.25, 24.25, 8]] });
// Garage west
w.seg(XG0, YRP, XG0, YC1, { ext: true });
// Garage north — two rear windows
w.seg(XG0, YRP, XG1, YRP, { ext: true, windows: [[4, 9, 3, 7], [17.5, 22.5, 3, 7]] });
// Bedroom 3 west (north of garage)
w.seg(XG1, Y0, XG1, YRP, { ext: true, windows: [[2, 6.5, 2.5, 7.5]] });

// Core north (faces the open rear porch): kitchen window, dining French doors, living windows
w.seg(XL1, YRP, XC1, YRP, {
  ext: true,
  windows: [[45.5, 50.5, 3, 7], [64, 69, 2.5, 7.5], [70.5, 75.5, 2.5, 7.5]],
  doors: [[54.75, 60.75, 8]],
});
// Core south (faces the open front porch): centered front French doors + living windows
w.seg(XL1, YC1, XC1, YC1, {
  ext: true,
  windows: [[64, 69, 3, 7.5], [71, 75.5, 3, 7.5]],
  doors: [[55.9167, 61.9167, 8]],
});

// Left wing east against the porches / a sliver of the gallery (Bedroom 3 and Bedroom 2 only).
// There is intentionally NO wall at x=41.5 from y=11 to y=31.8333 — the hall opens into the core.
w.seg(XL1, Y0, XL1, YB3, { ext: true });
w.seg(XL1, YLN, XL1, Y1, { ext: true });

// Right wing west against the porches
w.seg(XC1, Y0, XC1, YRP, { ext: true, doors: [[3.5, 6.5, 8]] });           // Primary → rear porch
w.seg(XC1, YC1, XC1, Y1, { ext: true });                                    // Study west / front porch

// =====================================================================
// INTERIOR — garage / left wing
// =====================================================================
// Garage east / left mid rooms + bedroom slivers, door into Laundry
w.seg(XG1, YRP, XG1, YC1, { doors: [[12.5, 15.5, 7]] });

// Bedroom 3 south + closet (reach-in on the south wall, west side; door from the hall on the east)
w.seg(XG1, YB3, XL1, YB3, { doors: [[37.8, 40.8, 7]] });
w.seg(XG1, YB3 - CL, CLX, YB3 - CL, { doors: [[28.5, 31.5, 7]] });
w.seg(CLX, YB3 - CL, CLX, YB3, {});

// Hall west (doors into Laundry, Pantry, Bath, Linen)
w.seg(LHX, YB3, LHX, YLN, { doors: [[13, 16, 7], [19.2, 22.2, 7], [25.6, 28.6, 7], [29.7, 31.7, 7]] });
w.seg(XG1, YLAU, LHX, YLAU, {});
w.seg(XG1, YPAN, LHX, YPAN, {});
w.seg(XG1, YBT, LHX, YBT, {});

// Bedroom 2 north + closet (reach-in on the north wall, west side; door from the hall on the east)
w.seg(XG1, YLN, XL1, YLN, { doors: [[37.8, 40.8, 7]] });
w.seg(XG1, YLN + CL, CLX, YLN + CL, { doors: [[28.5, 31.5, 7]] });
w.seg(CLX, YLN, CLX, YLN + CL, {});

// =====================================================================
// INTERIOR — right wing
// =====================================================================
// Living / Primary + Primary Bath west: door from Living into Primary (south of the porch door)
w.seg(XC1, YRP, XC1, YPB, { doors: [[11, 14, 7]] });
// Living / hall + study sliver: door from Living into the right hall, south of the fireplace
w.seg(XC1, YPB, XC1, YC1, { doors: [[26.5, 29.5, 7]] });

// Primary / Primary Bath, door near the middle
w.seg(XC1, YPR, XR1, YPR, { doors: [[81, 84, 7]] });
// Primary Bath / mid band (hall, storage, WIC); door into the walk-in closet
w.seg(XC1, YPB, XR1, YPB, { doors: [[85.8, 88.8, 7]] });
// Hall east — doors into Storage and Powder
w.seg(RHX, YPB, RHX, YST, { doors: [[26.2, 28.4, 7], [30, 32.8, 7]] });
w.seg(RHX, YPD, PX, YPD, {});
// WIC west (entered from the bath, not the hall)
w.seg(PX, YPB, PX, YST, {});
// Mid / Study, door from the hall; study reach-in on the north wall, east side
w.seg(XC1, YST, XR1, YST, { doors: [[76.5, 79.2, 7]] });
w.seg(SCLX, YST, XR1, SCL, {});
w.seg(SCLX, SCL, XR1, SCL, { doors: [[86.5, 89.5, 7]] });

export default {
  id: 'smith-12',
  name: "Twin Porch Homestead",
  title: "Twin Porch Homestead",
  subtitle: "A farmhouse with matching covered porches front and back, an open kitchen-dining-living core, and a two-car garage.",
  wallH: 10,
  defaultStyle: 'default',
  walkStart: [58.9, 32.5, 0],
  materials: { ext: '#f5f4f0', int: '#f8f6f1', roofTex: 'metal', roofUnder: '#d8c7a8', gable: 'ext', extSkin: true },
  walls: w,
  rooms: [
    // Garage
    ["Garage", "26'-6\" x 25'-0\"", 'concrete', XG0, YRP, XG1, YC1, { labelAt: [13.25, 22.4] }],

    // Left wing
    ["Bedroom 3", "15'-0\" x 11'-0\"", 'wood', XG1, Y0, XL1, YB3 - CL, { labelAt: [34, 5] }],
    ["", "", 'wood', CLX, YB3 - CL, XL1, YB3, { noLabel: true }],
    ["Closet", "7'-0\" x 2'-0\"", 'wood', XG1, YB3 - CL, CLX, YB3, { minor: true }],
    ["Laundry/Mud", "11'-2\" x 6'-4\"", 'tile', XG1, YB3, LHX, YLAU],
    ["Walk-in Pantry", "11'-2\" x 6'-5\"", 'wood', XG1, YLAU, LHX, YPAN, { minor: true }],
    ["Bath", "11'-2\" x 5'-8\"", 'tile', XG1, YPAN, LHX, YBT],
    ["Linen", "11'-2\" x 2'-5\"", 'wood', XG1, YBT, LHX, YLN, { minor: true }],
    ["Hall", "3'-10\"", 'wood', LHX, YB3, XL1, YLN, { minor: true }],
    ["Bedroom 2", "15'-0\" x 11'-0\"", 'wood', XG1, YLN + CL, XL1, Y1, { labelAt: [34, 38.3] }],
    ["", "", 'wood', CLX, YLN, XL1, YLN + CL, { noLabel: true }],
    ["Closet", "7'-0\" x 2'-0\"", 'wood', XG1, YLN, CLX, YLN + CL, { minor: true }],

    // Center core + porches
    ["Rear Covered Porch", "34'-10\" x 9'-11\"", 'porch', XL1, Y0, XC1, YRP, { outside: true, labelAt: [58.9, 4.96] }],
    ["", "", 'wood', XL1, YRP, XGAL, YC1, { noLabel: true }], // 2' gallery — hall opens cleanly into the core
    ["Kitchen", "7'-11\" x 25'-0\"", 'wood', XGAL, YRP, XK, YC1, { labelAt: [47.45, 28] }],
    ["Dining", "9'-4\" x 25'-0\"", 'wood', XK, YRP, XD, YC1, { labelAt: [56.08, 22.4] }],
    ["Living", "15'-7\" x 25'-0\"", 'wood', XD, YRP, XC1, YC1, { vaulted: true, labelAt: [68.54, 22.4] }],
    ["Front Covered Porch", "34'-10\" x 7'-11\"", 'porch', XL1, YC1, XC1, Y1, { outside: true, labelAt: [58.9, 38.87] }],

    // Right wing
    ["Primary Bedroom", "15'-0\" x 15'-0\"", 'wood', XC1, Y0, XR1, YPR, { tray: true, labelAt: [83.83, 7.5] }],
    ["Primary Bath", "15'-0\" x 10'-6\"", 'tile', XC1, YPR, XR1, YPB],
    ["Hall", "3'-0\"", 'wood', XC1, YPB, RHX, YST, { minor: true }],
    ["Storage", "4'-4\" x 3'-4\"", 'wood', RHX, YPB, PX, YPD, { minor: true }],
    ["Powder Room", "4'-4\" x 4'-6\"", 'tile', RHX, YPD, PX, YST, { minor: true }],
    ["Primary Closet", "9'-9\" x 8'-0\"", 'wood', PX, YPB, XR1, YST, { minor: true }],
    ["Study", "15'-0\" x 9'-6\"", 'wood', XC1, SCL, XR1, Y1, { labelAt: [83.83, 39.1] }],
    ["", "", 'wood', XC1, YST, SCLX, SCL, { noLabel: true }],
    ["Closet", "6'-0\" x 2'-0\"", 'wood', SCLX, YST, XR1, SCL, { minor: true }],
  ],
  slabs: [
    [XG0 - 0.4, YRP - 0.4, XG1 + 0.4, YC1 + 0.4],
    [XG1 - 0.4, Y0 - 0.4, XL1 + 0.4, Y1 + 0.4],
    [XL1 - 0.4, Y0 - 0.4, XC1 + 0.4, Y1 + 0.4],
    [XC1 - 0.4, Y0 - 0.4, XR1 + 0.4, Y1 + 0.4],
  ],
  ceilings: [
    [XG0, YRP, XG1, YC1, 10],                 // garage
    [XG1, Y0, XL1, Y1, 10],                   // left wing
    [XL1, YRP, XD, YC1, 10],                  // gallery + kitchen + dining (living is vaulted)
    [XC1, Y0, XR1, Y1, 10],                   // right wing
    [XL1, Y0, XC1, YRP, 9],                   // rear porch
    [XL1, YC1, XC1, Y1, 9],                   // front porch
  ],
  roofs: [
    // Garage — ridge east-west, gables facing the south doors and the rear wall
    { x0: XG0, y0: YRP, x1: XG1, y1: YC1, along: 'x', pitch: 0.5, oh: 1, eave: 10, ends: ['ext', 'ext'] },
    // Left bedroom wing — ridge north-south, gables at the front and back bedrooms
    { x0: XG1, y0: Y0, x1: XL1, y1: Y1, along: 'y', pitch: 0.5, oh: 1, eave: 10, ends: ['ext', 'ext'] },
    // Open core — ridge east-west so the living vaults over the 25' depth
    { x0: XL1, y0: YRP, x1: XC1, y1: YC1, along: 'x', pitch: 0.55, oh: 1, eave: 10, ends: ['ext', 'ext'] },
    // Right primary / study wing
    { x0: XC1, y0: Y0, x1: XR1, y1: Y1, along: 'y', pitch: 0.5, oh: 1, eave: 10, ends: ['ext', 'ext'] },
    // Matching shed porches: high at the house wall, low at the outer edge
    { shed: true, x0: XL1, y0: Y0, x1: XC1, y1: YRP, hi: 8.0, lo: 9.3, oh: 0.6 },
    { shed: true, x0: XL1, y0: YC1, x1: XC1, y1: Y1, hi: 9.3, lo: 8.0, oh: 0.6 },
  ],
  furnish(k) {
    const POST = '#d8c8a8';
    const CREAM = '#efe7da';
    const STONE = '#c9c4b8';
    const BEAM = '#8a6440';
    const GD = '#2a2b2d';

    // Porch columns along the outer edges, plus a beam at each eave
    const posts = [42.1, 50.7, 58.9167, 67.1, 75.7];
    for (const x of posts) {
      k.block(x - 0.28, 0.25, x + 0.28, 0.81, 0, 8.2, POST, { solid: true });
      k.block(x - 0.28, Y1 - 0.81, x + 0.28, Y1 - 0.25, 0, 8.2, POST, { solid: true });
    }
    k.block(XL1, 0.2, XC1, 0.75, 8.05, 8.55, POST);
    k.block(XL1, Y1 - 0.75, XC1, Y1 - 0.2, 8.05, 8.55, POST);

    // Front walk and a driveway at the two-car garage
    k.block(55.9, Y1, 61.9, Y1 + 1.6, -0.6, -0.25, '#9a9a96');
    k.plane(56.4, Y1 + 1.6, 61.4, Y1 + 18, 'paver');
    k.plane(-2, YC1, 28.5, YC1 + 22, 'paver');

    // Kitchen: L-shaped perimeter. Sink/DW/trash under the rear window (north run).
    // Refrigerator + cooktop on the west work wall, starting east of the 2' gallery
    // so the left hall opens cleanly — no counters in the hallway.
    k.block(XGAL + 0.05, YRP + 0.1, XK - 0.15, YRP + 2.05, 0, 3.0, CREAM);           // north sink run
    k.block(XGAL + 0.05, YRP + 0.1, XGAL + 2.2, 24.2, 0, 3.0, CREAM);                // west run (ref + cooktop)
    // Large island, stools face dining (east)
    k.block(47.15, 15.2, 50.55, 24.4, 0, 3.0, CREAM);
    if (k.place) {
      k.place('sink', { x: 48.0, y: YRP + 1.05, rot: 180 });
      k.place('fridge', { x: XGAL + 1.1, y: 12.4, rot: 90 });
      k.place('range', { x: XGAL + 1.1, y: 19.6, rot: 90 });
      k.place('barstool', { x: 51.35, y: 16.6, rot: 90, finish: 'camel' });
      k.place('barstool', { x: 51.35, y: 18.3, rot: 90, finish: 'camel' });
      k.place('barstool', { x: 51.35, y: 20.0, rot: 90, finish: 'camel' });
      k.place('barstool', { x: 51.35, y: 21.7, rot: 90, finish: 'camel' });
      k.place('pendant', { x: 48.85, y: 19.8 });
      k.place('outdoorDining', { x: 48.6, y: 5.0, rot: 0, wood: 'espresso' });
      k.place('shower', { x: 88.3, y: 17.6, rot: 0 });
    }

    // Dining ceiling beams (east-west, under the 10' ceiling)
    for (const y of [14.5, 20.5, 26.5, 32.0]) {
      k.block(XK + 0.15, y - 0.12, XD - 0.15, y + 0.12, 9.35, 10, BEAM);
    }

    // Animated fireplace on the living's east wall, facing west, north of the hall door.
    // Back + sides + mantel leave an open firebox (a solid slab would hide the flames).
    k.block(75.95, 18.55, 76.30, 25.25, 0, 5.3, STONE, { solid: true });           // back
    k.block(75.50, 18.55, 76.30, 19.15, 0, 5.3, STONE, { solid: true });           // south jamb
    k.block(75.50, 24.65, 76.30, 25.25, 0, 5.3, STONE, { solid: true });           // north jamb
    k.block(75.50, 18.55, 76.30, 25.25, 4.15, 5.35, STONE, { solid: true });       // lintel
    k.block(75.35, 18.35, 76.30, 25.45, 5.2, 5.55, STONE, { solid: true });        // mantel
    k.block(75.50, 19.15, 75.62, 24.65, 0.15, 4.15, '#1a1410', { keep: true });    // dark firebox
    k.fire(75.52, 19.25, 75.90, 24.55, 'w');
    k.block(75.45, 19.6, 77.05, 24.2, 10, 22.5, STONE, { solid: true });           // chimney
    k.block(75.3, 19.45, 77.2, 24.35, 22.5, 23.1, '#1e1f21');

    // Tray ceiling: perimeter trim only (a solid slab hid the room in the cutaway)
    const tx0 = XC1 + 1.4, ty0 = Y0 + 1.4, tx1 = XR1 - 1.4, ty1 = YPR - 1.4;
    const TRIM = '#e8e2d4';
    k.block(tx0, ty0, tx1, ty0 + 0.18, 9.55, 9.85, TRIM, { keep: true, role: 'trim' });
    k.block(tx0, ty1 - 0.18, tx1, ty1, 9.55, 9.85, TRIM, { keep: true, role: 'trim' });
    k.block(tx0, ty0, tx0 + 0.18, ty1, 9.55, 9.85, TRIM, { keep: true, role: 'trim' });
    k.block(tx1 - 0.18, ty0, tx1, ty1, 9.55, 9.85, TRIM, { keep: true, role: 'trim' });

    // Two-car garage: closed door panels + cars nosed toward the south doors
    k.block(2.3, YC1 - 0.22, 11.2, YC1 + 0.05, 0, 8, GD);
    k.block(15.3, YC1 - 0.22, 24.2, YC1 + 0.05, 0, 8, GD);
    k.car(3.2, 13.8, 10.3, 32.6, '#8a8680', 'golf-r', 's');
    k.car(16.2, 13.8, 23.3, 32.6, '#161616', 'lexus-gx', 's');
  },
};
