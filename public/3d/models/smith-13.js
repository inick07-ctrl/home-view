// Smith 13 — "Close to Home": modern farmhouse from Nick's floor plan + exterior renderings.
// Plan feet: x east, y south. FRONT = south. Origin = garage west wall (x = 0) / future-porch north edge (y = 0).
//
// White board-and-batten, dark standing-seam metal roof, timber-framed cathedral gables front and back
// (stone-wrapped pillars, king-post trusses, exposed rafters), black windows, and a 3-car side-load
// garage clad in dark board siding. The great room, foyer and both cathedral porches vault under one
// tall north-south cross gable; the west (kitchen/office) and east (bedroom) wings die into it with
// proper valleys (roof skins below) instead of exposed gable triangles.
import { makeWalls } from '../lib.js';

// ----- grid -----
const XG1 = 26;            // garage / exercise east
const XW = 36.3333;        // pantry-mud-laundry east / dining-kitchen-office west
const XD = 48.8333;        // dining-kitchen-office east / great room west
const XFE = 64.25;         // foyer east / Bed 2 WIC west
const XGR = 69.75;         // great room east
const XM = 74;             // M. Bed west / stair east
const XB2 = 82.3333;       // Bed 2 east / Bed 3 west
const XMB = 88.1667;       // M. Bed east
const XB3 = 94.6667;       // Bed 3 east / WICs west
const XE = 103.75;         // east wall
const CXR = (XD + XGR) / 2; // cross-gable ridge line (59.29)

const YRP = 7;             // rear cathedral porch north edge
const YEX = 9.25;          // exercise north
const YST = 13.3333;       // rear strip porch north edge
const YEP = 14;            // east porches north edge
const YDN = 18.5;          // dining north
const YMB = 21.6667;       // M. Bed north
const YGN = 23.3333;       // garage north / exercise south
const YGR = 27.75;         // great room + pantry north
const YMBA = 30.75;        // M. Bath north
const YDK = 31;            // dining / kitchen
const YSTR = 34.1;         // stair top / built-in alcove south
const YPS = 35.25;         // pantry south
const YMS = 38.25;         // M. Bed south
const YMUD = 40.75;        // mud room north
const YH = 44.25;          // hall north / Bed 3 north
const YK = 47.75;          // kitchen south / foyer + Bed 2 north
const YL = 49.75;          // laundry north
const YW = 51.5;           // WIC split
const YLS = 55.25;         // laundry south
const YFS = 56;            // foyer south (front wall)
const YB3W = 57;           // Bed 3 WIC south
const YB3 = 58;            // Bed 3 south
const YB2 = 59.75;         // Bed 2 / office south
const YGS = 61;            // garage south
const YFP = 67;            // front porch south

const GH = 10.27;          // garage + exercise wall height (10'-3 1/4")
const WH = 9.1;            // house wall height (9'-1 1/8")

function makeCloseToHomeWalls(o = {}) {
const w = makeWalls();
const EXT_WIN = []; // exterior window rects for black frames: [x0,y0,x1,y1,sill,head,horiz]
const xw = (x0, y0, x1, y1, o = {}) => {
  w.seg(x0, y0, x1, y1, { ext: true, ...o });
  const horiz = Math.abs(y1 - y0) < Math.abs(x1 - x0);
  for (const [s, e, sill = 3, head = 7] of o.windows || []) EXT_WIN.push(horiz ? [s, y0, e, y0, sill, head, true] : [x0, s, x0, e, sill, head, false]);
};

// =====================================================================
// EXTERIOR
// =====================================================================
// Garage block (exercise room + 3-car side-load garage)
xw(0, YEX, XG1, YEX, { h: GH, windows: [[4, 9, 3, 7], [17, 22, 3, 7]] });
xw(0, YEX, 0, YGS, { h: GH, windows: [[12, 17, 3, 7]], doors: [[24.6, 34.6, 8], [37.2, 47.2, 8], [49.7, 59.7, 8]] });
xw(0, YGS, XG1, YGS, { h: GH, windows: [[7.5, 11, 3.5, 7], [15, 18.5, 3.5, 7]] });
xw(XG1, YEX, XG1, YGR, { h: GH, windows: [[13.5, 17, 3, 7]], doors: [[24.3, 27.3, 7]] }); // faces the west covered porch
xw(XG1, YLS, XG1, YGS, { h: GH });

// West wing
xw(XG1, YGR, XW, YGR, {});                                                        // pantry north (porch)
xw(XW, YDN, XW, YGR, { doors: [[22, 25, 8]] });                                   // dining west French door
xw(XW, YDN, XD, YDN, { windows: [[38.3, 42.3, 2.5, 7.5], [42.9, 46.9, 2.5, 7.5]] });
xw(XD, YDN, XD, YGR, { windows: [[20.5, 25.5, 2.5, 7.5]] });
xw(XG1, YLS, XW, YLS, { windows: [[32, 34.5, 4, 7]] });                           // laundry south
xw(XW, YLS, XW, YB2, {});
xw(XW, YB2, XD, YB2, { windows: [[38.6, 42.2, 3, 7], [43, 46.6, 3, 7]] });        // office south (porch)
xw(XD, YFS, XD, YB2, { windows: [[56.8, 59, 3, 7]] });

// Cross-gable core
xw(XD, YGR, XGR, YGR, { windows: [[50.6, 55.2, 2, 8], [63.4, 68, 2, 8]], doors: [[56.8, 61.8, 8]] });
xw(XD, YFS, XGR, YFS, { windows: [[55.35, 56.45, 0.6, 8], [62.05, 63.15, 0.6, 8]], doors: [[56.75, 61.75, 8]] });

// East wing
xw(XGR, YGR, XM, YGR, {});
xw(XM, YMB, XM, YGR, { windows: [[23, 26.5, 3, 7.5]] });
xw(XM, YMB, XMB, YMB, { windows: [[75.8, 80.2, 2.5, 7.5]], doors: [[82, 87, 8]] });
xw(XMB, YMB, XMB, YMBA, { windows: [[24, 28, 3, 7.5]] });
xw(XMB, YMBA, XE, YMBA, { windows: [[90.6, 93.4, 4.5, 7.5], [95.6, 98.4, 4.5, 7.5], [100.7, 102.6, 4.5, 7]] });
xw(XE, YMBA, XE, YB3W, { windows: [[33.2, 37.2, 4, 7.5]] });
xw(XB3, YB3W, XE, YB3W, {});
xw(XB3, YB3W, XB3, YB3, {});
xw(XB2, YB3, XB3, YB3, { windows: [[85, 91.9, 3, 7]] });
xw(XB2, YB3, XB2, YB2, {});
xw(XGR, YB2, XB2, YB2, { windows: [[73, 78.5, 3, 7]] });
xw(XGR, YFS, XGR, YB2, {});

// =====================================================================
// INTERIOR
// =====================================================================
w.seg(0, YDN, 7.9, YDN, { h: GH, doors: [[2.5, 5, 7]] });              // exercise 1/2 bath
w.seg(7.9, YDN, 7.9, YGN, { h: GH });
w.seg(0, YGN, XG1, YGN, { h: GH, doors: [[21.5, 24.5, 7]] });          // exercise → garage
w.seg(XG1, YGR, XG1, YLS, { h: GH, t: 0.5, doors: [[46, 48.75, 7]] }); // garage → mud room
w.seg(XG1, YPS, XW, YPS, {});
w.seg(31, YPS, 31, YMUD, {});
w.seg(XG1, YMUD, XW, YMUD, { doors: [[28, 30.5, 7], [32, 35.5, 7]] }); // mud 1/2 bath + closet
w.seg(XW, YGR, XW, YLS, { doors: [[28.25, 30.75, 7], [44.5, 47.25, 7]] }); // pantry, mud → kitchen
w.seg(XG1, YL, XW, YL, { doors: [[29, 31.75, 7]] });                   // laundry
w.seg(XW, YK, XD, YK, { doors: [[40, 45, 7]] });                        // office double doors
w.seg(XD, YK, XD, YFS, {});                                             // office / foyer built-ins
w.seg(XD, YK, 55.75, YK, {});                                           // foyer ↔ great room: wide cased opening
w.seg(62.75, YK, XFE, YK, {});
w.seg(XFE, YK, XFE, YFS, {});                                           // foyer / Bed 2 WIC
w.seg(XFE, YK, XGR, YK, {});                                            // WIC north
w.seg(XGR, YK, XGR, YFS, { doors: [[50.5, 53, 7]] });                   // Bed 2 → WIC
w.seg(XGR, YK, XB2, YK, { doors: [[70.25, 73, 7]] });                   // Bed 2 door from hall
w.seg(XGR, YSTR, XGR, YH, { t: 0.5 });                                  // fireplace wall (stair behind)
w.seg(XGR, YSTR, XM, YSTR, {});                                         // built-in alcove / stair
w.seg(XM, YGR, XM, YH, { doors: [[28.25, 31.25, 7]] });                 // M. Bed door from the alcove
w.seg(XM, YMS, XMB, YMS, {});
w.seg(XMB, YMBA, XMB, YH, { doors: [[32.25, 35, 7]] });                 // M. Bed → M. Bath
w.seg(XM, YH, XB3, YH, { doors: [[78.5, 81, 7]] });                     // hall bath
w.seg(XB3, YMS, XE, YMS, { doors: [[97, 100, 7]] });                    // M. Bath → WIC
w.seg(99.5, YMBA, 99.5, 35, {});                                        // WC
w.seg(99.5, 35, XE, 35, { doors: [[100.2, 102.6, 7]] });
w.seg(XB3, YMS, XB3, YB3W, { doors: [[52.2, 54.7, 7]] });               // Bed 3 → WIC
w.seg(XB3, YW, XE, YW, {});
w.seg(XB2, YH, XB2, YB3, { doors: [[44.6, 47.4, 7]] });                 // Bed 3 door

  return { w, EXT_WIN };
}

// =====================================================================
// Helpers for the furnish pass
// =====================================================================
function makeHelpers(k) {
  const T = k.THREE;
  const keep = { keep: true };
  const roofP = { keep: true, roof: true };
  const blk = (a, b, c, d, z0, z1, col, o = keep) => k.block(Math.min(a, c), Math.min(b, d), Math.max(a, c), Math.max(b, d), z0, z1, col, o);
  // swap a placeholder block's geometry for a custom world-space geometry (keeps kit material + shadows + roof grouping)
  const custom = (geo, col, o = keep) => {
    const m = k.block(0, 0, 0.05, 0.05, 0, 0.05, col, o);
    if (!m) return null;
    m.geometry.dispose();
    m.geometry = geo;
    return m;
  };
  // batched boxes (one mesh per colour) — keeps draw calls down for frames, rafters, trim
  const batches = {};
  const box = (col, a, b, c, d, z0, z1, roof = false) => {
    const g = new T.BoxGeometry(Math.abs(c - a), z1 - z0, Math.abs(d - b));
    g.translate(k.W((a + c) / 2), (z0 + z1) / 2, k.Z((b + d) / 2));
    (batches[col + (roof ? '|r' : '')] ||= []).push(g.toNonIndexed());
  };
  // sloped member in a vertical plane of constant plan-y: from (x0,z0) to (x1,z1), depth = vertical size, width along y
  const slope = (col, y, x0, z0, x1, z1, depth, width, roof = true) => {
    const L = Math.hypot(x1 - x0, z1 - z0);
    const g = new T.BoxGeometry(L, depth, width);
    g.rotateZ(Math.atan2(z1 - z0, x1 - x0));
    g.translate(k.W((x0 + x1) / 2), (z0 + z1) / 2, k.Z(y));
    (batches[col + (roof ? '|r' : '')] ||= []).push(g.toNonIndexed());
  };
  const flush = () => {
    for (const [key, list] of Object.entries(batches)) {
      const [col, r] = key.split('|');
      const n = list.reduce((s, g) => s + g.attributes.position.count, 0);
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
      let o = 0;
      for (const g of list) {
        pos.set(g.attributes.position.array, o * 3);
        nor.set(g.attributes.normal.array, o * 3);
        uv.set(g.attributes.uv.array, o * 2);
        o += g.attributes.position.count;
        g.dispose();
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new T.BufferAttribute(nor, 3));
      geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
      custom(geo, col, r ? roofP : keep);
      delete batches[key];
    }
  };
  // triangle mesh in world space from plan points [x, y, z]; normals forced upward (roof skins)
  const triMesh = (tris, col, o, uvFn) => {
    const pos = [], uvs = [];
    for (let [p, q, r] of tris) {
      const P = [p, q, r].map(([x, y, z]) => new T.Vector3(k.W(x), z, k.Z(y)));
      const n = new T.Vector3().subVectors(P[1], P[0]).cross(new T.Vector3().subVectors(P[2], P[0]));
      const pts = n.y < 0 ? [P[0], P[2], P[1]] : P;
      for (const v of pts) { pos.push(v.x, v.y, v.z); uvs.push(...uvFn(v)); }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    g.computeVertexNormals();
    return custom(g, col, o);
  };
  // flat polygon (with optional holes) standing in the vertical plane of constant plan-y; pts are [x, z]
  const gablePanel = (y, outline, holes, col, thick, uvScale, o = roofP) => {
    const shape = new T.Shape(outline.map(([x, z]) => new T.Vector2(x, z)));
    for (const h of holes || []) shape.holes.push(new T.Path(h.map(([x, z]) => new T.Vector2(x, z))));
    const g = new T.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false });
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * uvScale, uv.getY(i) * uvScale);
    // shape space: x → plan x, y → height, extrude z → plan y
    g.translate(0, 0, -thick / 2);
    const m = new T.Matrix4().makeTranslation(-0, 0, 0);
    g.applyMatrix4(m);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setXYZ(i, k.W(pos.getX(i)), pos.getY(i), k.Z(y + pos.getZ(i)));
    g.computeVertexNormals();
    return custom(g, col, o);
  };
  return { blk, box, slope, flush, triMesh, gablePanel, keep, roofP };
}

const roofZ = (x) => WH + 0.9 * (x < CXR ? x - XD : XGR - x); // cross-gable roof plane height at plan x

export function closeToHome(opts = {}) {
  const STAGE = opts.staging || 'mountain'; // interior staged from the plan's published renderings
  const DARK_GARAGE = opts.garage !== 'white';
  const MTN = STAGE === 'mountain';
  const { w, EXT_WIN } = makeCloseToHomeWalls();
  return {
  id: opts.id || 'smith-13',
  name: opts.name || 'Close to Home',
  title: opts.name || 'Close to Home',
  subtitle: opts.subtitle || 'A modern farmhouse with a timber-framed front porch, an open cathedral great room, a 3-car garage, and an exercise room.',
  wallH: WH,
  defaultStyle: 'default',
  walkStart: [59.29, 64.5, 0],
  materials: { extTex: 'whiteBoard', ext: '#f4f3ef', int: MTN ? '#efebe4' : '#f8f6f1', roofTex: 'metal', roofUnder: MTN ? '#f3eee6' : '#ead8bc', roofUnderGlow: 0.45, gable: 'ext', extSkin: true },
  planImage: opts.planImage || { src: new URL('./smith-13-plan.jpg', import.meta.url).href, pxPerFt: 10.85, originPx: [16, 10], sizePx: [1160, 770] },
  walls: w,
  rooms: [
    // Garage block
    ['Exercise Rm', "25'-4\" x 13'-8\"", 'gym', 0, YEX, XG1, YDN, { noAuto: true, labelAt: [15, 15] }],
    ['', '', 'gym', 7.9, YDN, XG1, YGN, { noLabel: true, noAuto: true }],
    ['1/2 Bath', '', 'tile', 0, YDN, 7.9, YGN, { minor: true, noAuto: true }],
    ['3 Car Garage', "25'-4\" x 37'-5\"", 'concrete', 0, YGN, XG1, YGS, { noAuto: true, labelAt: [14, 44] }],

    // West wing
    ['Covered Porch', "10'-0\" x 13'-6\"", 'porch', XG1, YST, XW, YGR, { outside: true, noAuto: true, noPosts: true, labelAt: [31.2, 22.5] }],
    ['', '', 'porch', XW, YST, XD, YDN, { outside: true, noLabel: true, noAuto: true, noPosts: true }],
    ['Pantry', "10'-0\" x 7'-2\"", 'wood', XG1, YGR, XW, YPS, { noAuto: true }],
    ['1/2 Bath', '', 'tile', XG1, YPS, 31, YMUD, { minor: true, noAuto: true }],
    ['Closet', '', 'wood', 31, YPS, XW, YMUD, { minor: true, noAuto: true }],
    ['Mud Rm', "10'-0\" x 8'-8\"", 'tile', XG1, YMUD, XW, YL, { noAuto: true }],
    ['Laundry', "10'-0\" x 5'-2\"", 'tile', XG1, YL, XW, YLS, { noAuto: true }],
    ['Dining', "12'-1\" x 12'-6\"", 'wood', XW, YDN, XD, YDK, { noAuto: true, labelAt: [42.6, 20.4] }],
    ['Kitchen', "12'-1\" x 12'-11\"", 'wood', XW, YDK, XD, YK, { noAuto: true, labelAt: [40.4, 46.2] }],
    ['Office', "12'-1\" x 11'-8\"", 'wood', XW, YK, XD, YB2, { noAuto: true, labelAt: [42.6, 53.0] }],

    // Cathedral core
    ['Covered Porch', "21'-2\" x 20'-6\" cathedral", 'porch', XD, YRP, XGR, YGR, { outside: true, vaulted: true, noAuto: true, noPosts: true, labelAt: [CXR, 11] }],
    ['Great Rm', "20'-4\" x 20'-0\" cathedral", 'wood', XD, YGR, XGR, YK, { vaulted: true, noAuto: true, labelAt: [CXR, 31.5] }],
    ['', '', 'wood', XGR, YGR, XM, YSTR, { noLabel: true, noAuto: true }],          // built-in cabinet alcove
    ['Stair (Dn)', '', 'wood', XGR, YSTR, XM, YH, { minor: true, noAuto: true }],
    ['Hall', '', 'wood', XGR, YH, XB2, YK, { minor: true, noAuto: true }],
    ['Foyer', "9'-9\" x 8'-0\"", 'wood', XD, YK, XFE, YFS, { vaulted: true, noAuto: true, labelAt: [57.5, 51.8] }],
    ['WIC', '', 'wood', XFE, YK, XGR, YFS, { minor: true, noAuto: true }],
    ['Front Porch', "20'-0\" x 11'-0\" cathedral", 'porch', XD, YFS, XGR, YFP, { outside: true, vaulted: true, noAuto: true, noPosts: true, labelAt: [CXR, 63.2] }],
    ['', '', 'porch', XW, YB2, XD, YFP, { outside: true, noLabel: true, noAuto: true, noPosts: true }],
    ['', '', 'porch', XGR, YB2, 83, YFP, { outside: true, noLabel: true, noAuto: true, noPosts: true }],

    // East wing
    ['Covered Porch', "15'-0\" x 7'-6\"", 'porch', XM, YEP, XMB, YMB, { outside: true, noAuto: true, noPosts: true, labelAt: [81, 16.2] }],
    ['', '', 'porch', XGR, YEP, XM, YGR, { outside: true, noLabel: true, noAuto: true, noPosts: true }],
    ['Covered Porch', "14'-11\" x 16'-8\"", 'porch', XMB, YEP, XE, YMBA, { outside: true, noAuto: true, noPosts: true, labelAt: [96, 27.6] }],
    ['M. Bed', "14'-1\" x 16'-8\"", 'wood', XM, YMB, XMB, YMS, { noAuto: true, labelAt: [81, 27.2] }],
    ['M. Bath', '', 'tile', XMB, YMBA, 99.5, YMS, { noAuto: true, labelAt: [93.8, 34.2] }],
    ['', '', 'tile', 99.5, 35, XE, YMS, { noLabel: true, noAuto: true }],
    ['WC', '', 'tile', 99.5, YMBA, XE, 35, { minor: true, noAuto: true }],
    ['Tile Shwr', '', 'tile', XMB, YMS, XB3, YH, { minor: true, noAuto: true }],
    ['Bath', '', 'tile', XM, YMS, XMB, YH, { noAuto: true, labelAt: [81, 42.6] }],
    ['WIC', '', 'wood', XB3, YMS, XE, YW, { minor: true, noAuto: true }],
    ['WIC', '', 'wood', XB3, YW, XE, YB3W, { minor: true, noAuto: true }],
    ['Bed #2', "12'-0\" x 11'-8\"", 'wood', XGR, YK, XB2, YB2, { noAuto: true, labelAt: [76, 50.2] }],
    ['Bed #3', "12'-0\" x 13'-4\"", 'wood', XB2, YH, XB3, YB3, { noAuto: true, labelAt: [88.5, 52.6] }],

    // Site
    ['Future Porch', 'size & shape TBD', 'terrace', 0, 0.9, XW, YEX, { outside: true, noAuto: true, noPosts: true, labelAt: [16, 4.8] }],
  ],
  slabs: [
    [-0.4, YEX - 0.4, XG1 + 0.4, YGS + 0.4],
    [XG1, YST, XD + 0.4, YB2 + 0.4],
    [XW - 0.4, YB2, 83.4, YFP + 0.4],
    [XD - 0.4, YRP, XGR + 0.4, YFP + 0.4],
    [XGR, YEP, XE + 0.4, YB2 + 0.4],
  ],
  ceilings: [
    [0, YEX, XG1, YGS, GH],                   // exercise + garage
    [XG1, YDN, XW, YLS, WH],                  // west porch (under main roof), pantry, mud, laundry
    [XW, YDN, XD, YB2, WH],                   // dining, kitchen, office
    [XFE, YK, XGR, YFS, WH],                  // Bed 2 WIC
    [XGR, YGR, XM, YB2, WH],                  // alcove, stair, hall, Bed 2 west strip
    [XM, YMB, XE, YB2, WH],                   // east wing + recessed east porch
  ],
  roofs: [
    // Garage — ridge north-south, dark board gables front and back
    { x0: 0, y0: YEX, x1: XG1, y1: YGS, along: 'y', pitch: 0.5, oh: 1, endOh: [1, 1], eave: GH, ends: DARK_GARAGE ? ['board', 'board'] : ['ext', 'ext'] },
    // West wing — ridge east-west; white gable rises above the garage roof, east end dies into the cross gable (valley skin)
    { x0: XG1, y0: YDN, x1: XD, y1: YB2, along: 'x', pitch: 0.45, oh: [0, 1], endOh: [0.5, 0], eave: WH, ends: ['ext', null] },
    // Tall cathedral cross gable over rear porch → great room → foyer → front porch (open timber trusses at both ends)
    { x0: XD, y0: YRP, x1: XGR, y1: YFP, along: 'y', pitch: 0.9, oh: 0, endOh: [1.2, 1.2], eave: WH, ends: [null, null] },
    // East (bedroom) wing — ridge east-west, white gable on the east end
    { x0: XGR, y0: YMB, x1: XE, y1: YB2, along: 'x', pitch: 0.45, oh: [0, 1], endOh: [0, 1], eave: WH, ends: [null, 'ext'] },
    // Shed porches with exposed rafters
    { shed: true, x0: XG1, y0: YST - 0.5, x1: XD, y1: YDN - 0.4, hi: 7.9, lo: 8.7, oh: 0.2 },        // rear strip (north)
    { shed: true, x0: XGR, y0: YEP - 0.6, x1: XE, y1: YMB - 0.4, hi: 7.9, lo: 8.7, oh: 0.25 },      // east porch (north)
    { shed: true, x0: XW, y0: YB2 + 0.4, x1: XD, y1: YFP, hi: 8.55, lo: 7.85, oh: 0.6 },            // front wing west
    { shed: true, x0: XGR, y0: YB2 + 0.4, x1: 83, y1: YFP, hi: 8.55, lo: 7.85, oh: 0.6 },           // front wing east
  ],
  // Published heated area for this plan (Architectural Designs 135255GRA) is 2,489 sf; the exercise room (366 sf incl. 1/2 bath)
  // is not counted as heated. Garage + porches measured to wall centre-lines from the plan.
  areas: { heated: 2489, garage: 979, porch: 1492 },
  furnish(k) {
    const H = makeHelpers(k);
    const { blk, box, slope, flush, triMesh, gablePanel, roofP } = H;
    const TIMBER = '#8a5a32';
    const TIMBER_D = '#6e4524';
    const BLACK = '#1b1c1e';
    const CAP = '#b9b4aa';
    const CAB = '#f1ede4';
    const CAB_G = '#4b5547'; // sage-green island
    const WOODSHELF = '#c7a27a';

    // ------------------------------------------------------------ valley roof skins
    const roofUv = (v) => [v.x / 6, v.z / 6];
    {
      const dW = (YB2 - YDN) / 2, zW = WH + 0.45 * dW, xW = XD + 0.5 * dW, yW = YDN + dW;
      triMesh([
        [[XD, YDN, WH], [xW, yW, zW], [XD, yW, zW]],
        [[XD, yW, zW], [xW, yW, zW], [XD, YB2, WH]],
      ], '#1d1e20', { keep: true, roof: true }, roofUv).userData.roofSkin = true;
      const dE = (YB2 - YMB) / 2, zE = WH + 0.45 * dE, xE = XGR - 0.5 * dE, yE = YMB + dE;
      triMesh([
        [[XGR, YMB, WH], [xE, yE, zE], [XGR, yE, zE]],
        [[XGR, yE, zE], [xE, yE, zE], [XGR, YB2, WH]],
      ], '#1d1e20', { keep: true, roof: true }, roofUv).userData.roofSkin = true;
    }

    // ------------------------------------------------------------ gable infills on the cross gable
    const ridgeZ = roofZ(CXR);
    // Great room north wall: full glass clerestory above the French doors
    gablePanel(YGR, [[XD + 0.2, WH], [XGR - 0.2, WH], [CXR, ridgeZ - 0.25]], [], 'glass', 0.12, 1 / 6);
    box(BLACK, XD + 0.2, YGR - 0.12, XGR - 0.2, YGR + 0.12, WH, WH + 0.22, true);
    for (const x of [51.9, 55.4, CXR, 63.2, 66.7]) box(BLACK, x - 0.09, YGR - 0.1, x + 0.09, YGR + 0.1, WH, roofZ(x) - 0.25, true);
    slope(BLACK, YGR, XD + 0.2, WH + 0.1, CXR, ridgeZ - 0.3, 0.22, 0.24);
    slope(BLACK, YGR, CXR, ridgeZ - 0.3, XGR - 0.2, WH + 0.1, 0.22, 0.24);
    // Front wall over the entry: board-and-batten with a tall shaped window following the roof
    const fx0 = 53.9, fx1 = 64.7, fz0 = 9.6;
    const winPoly = [[fx0, fz0], [fx1, fz0], [fx1, roofZ(fx1) - 1.25], [CXR, ridgeZ - 1.25], [fx0, roofZ(fx0) - 1.25]];
    gablePanel(YFS, [[XD + 0.1, WH], [XGR - 0.1, WH], [CXR, ridgeZ - 0.05]], [winPoly.slice().reverse()], 'whiteBoard', 0.7, 1 / 6);
    gablePanel(YFS, winPoly, [], 'glass', 0.1, 1 / 6);
    {
      const yo = YFS + 0.4;
      box(BLACK, fx0, yo - 0.05, fx1, yo + 0.08, fz0 - 0.15, fz0 + 0.1, true);
      for (const x of [fx0, 56.6, CXR, 62.0, fx1]) box(BLACK, x - 0.1, yo - 0.05, x + 0.1, yo + 0.08, fz0, roofZ(x) - 1.25, true);
      box(BLACK, fx0, yo - 0.05, fx1, yo + 0.08, 12.0, 12.18, true);
      slope(BLACK, yo, fx0, roofZ(fx0) - 1.2, CXR, ridgeZ - 1.2, 0.2, 0.13);
      slope(BLACK, yo, CXR, ridgeZ - 1.2, fx1, roofZ(fx1) - 1.2, 0.2, 0.13);
    }

    // ------------------------------------------------------------ porch posts: stone-wrapped pillars + timber posts
    const pillar = (x, y, top) => {
      blk(x - 0.85, y - 0.85, x + 0.85, y + 0.85, 0, 3.0, 'ledgestone', { keep: true, solid: true });
      box(CAP, x - 0.98, y - 0.98, x + 0.98, y + 0.98, 3.0, 3.25);
      blk(x - 0.42, y - 0.42, x + 0.42, y + 0.42, 3.25, top, TIMBER, { keep: true, solid: true });
    };
    const post = (x, y, top) => blk(x - 0.36, y - 0.36, x + 0.36, y + 0.36, 0, top, TIMBER, { keep: true, solid: true });
    const TIE0 = 8.35, TIE1 = WH; // tie / eave beams under the cathedral eaves
    // Front cathedral porch
    const FY = YFP - 0.65;
    for (const x of [XD + 0.62, XGR - 0.62]) pillar(x, FY, TIE0);
    box(TIMBER, XD - 0.2, FY - 0.36, XGR + 0.2, FY + 0.36, TIE0, TIE1);                 // tie beam
    for (const x of [XD + 0.62, XGR - 0.62]) box(TIMBER, x - 0.33, YFS, x + 0.33, FY, TIE0, TIE1); // eave beams
    // front wings (under the sheds)
    const wingTop = 7.25;
    pillar(XW + 0.7, FY, wingTop);
    pillar(82.35, FY, wingTop);
    box(TIMBER, XW, FY - 0.33, XD + 0.3, FY + 0.33, wingTop, 7.85);
    box(TIMBER, XGR - 0.3, FY - 0.33, 83.2, FY + 0.33, wingTop, 7.85);
    // Rear cathedral porch
    const RY0 = YRP + 0.6, RY1 = YST + 0.3;
    for (const x of [XD + 0.62, XGR - 0.62]) { pillar(x, RY0, TIE0); pillar(x, RY1, TIE0); }
    box(TIMBER, XD - 0.2, RY0 - 0.36, XGR + 0.2, RY0 + 0.36, TIE0, TIE1);
    for (const x of [XD + 0.62, XGR - 0.62]) box(TIMBER, x - 0.33, RY0, x + 0.33, YGR, TIE0, TIE1);
    // Rear strip porch (north of dining / west porch) and east porch: simpler timber posts on stone
    const SY = YST + 0.35;
    for (const x of [XG1 + 0.75, XW]) pillar(x, SY, 7.3);
    box(TIMBER, XG1, SY - 0.33, XD, SY + 0.33, 7.3, 7.92);
    box(TIMBER, XG1, YDN - 0.2, XW, YDN + 0.2, 8.6, WH);                                // closes the gap under the main eave
    const EY = YEP + 0.25;
    for (const x of [XGR + 0.6, XMB, XE - 0.6]) pillar(x, EY, 7.25);
    box(TIMBER, XGR, EY - 0.33, XE, EY + 0.33, 7.25, 7.9);
    pillar(XE - 0.6, YMBA - 0.6, 8.45);
    box(TIMBER, XE - 0.93, YMB - 0.4, XE - 0.27, YMBA, 8.45, WH);
    box(TIMBER, XMB, YMB - 0.33, XE, YMB + 0.0, 8.45, WH);

    // ------------------------------------------------------------ timber king-post trusses (front + rear gables)
    const truss = (y) => {
      const d = 0.75, wd = 0.62;
      slope(TIMBER, y, XD - 0.3, WH + 0.1 - 0.27, CXR, ridgeZ - 0.62, d, wd);
      slope(TIMBER, y, CXR, ridgeZ - 0.62, XGR + 0.3, WH + 0.1 - 0.27, d, wd);
      box(TIMBER, CXR - 0.33, y - 0.31, CXR + 0.33, y + 0.31, TIE1, ridgeZ - 0.9, true);     // king post
      slope(TIMBER, y, CXR - 0.3, TIE1 + 0.7, 54.0, roofZ(54.0) - 0.9, 0.5, 0.5);           // struts
      slope(TIMBER, y, CXR + 0.3, TIE1 + 0.7, 64.58, roofZ(64.58) - 0.9, 0.5, 0.5);
      slope(TIMBER, y, XD + 1.04, 6.6, XD + 2.6, TIE0, 0.42, 0.45, false);                 // knee braces
      slope(TIMBER, y, XGR - 1.04, 6.6, XGR - 2.6, TIE0, 0.42, 0.45, false);
    };
    truss(FY);
    truss(RY0);
    // exposed rafters + ridge beam under both cathedral porch ceilings
    const rafters = (ya, yb) => {
      for (let y = ya; y <= yb; y += 2.0) {
        slope(TIMBER_D, y, XD, WH - 0.45, CXR, ridgeZ - 0.45, 0.6, 0.28);
        slope(TIMBER_D, y, CXR, ridgeZ - 0.45, XGR, WH - 0.45, 0.6, 0.28);
      }
      box(TIMBER, CXR - 0.3, ya - 1, CXR + 0.3, yb + 1, ridgeZ - 1.25, ridgeZ - 0.35, true);
    };
    rafters(RY0 + 2, YGR - 1);
    rafters(YFS + 1.2, FY - 1.2);
    // exposed rafter tails under the shed porches
    for (const [x0, x1] of [[XW + 0.2, XD - 0.2], [XGR + 0.2, 83]]) {
      for (let x = x0 + 0.8; x < x1; x += 2.0) box(TIMBER_D, x - 0.13, YB2 + 0.4, x + 0.13, YFP + 0.45, 7.45, 7.75, true);
    }
    for (let x = XG1 + 1; x < XD; x += 2.0) box(TIMBER_D, x - 0.13, YST - 0.4, x + 0.13, YDN - 0.4, 7.55, 7.85, true);
    for (let x = XGR + 1; x < XE; x += 2.0) box(TIMBER_D, x - 0.13, YEP - 0.5, x + 0.13, YMB - 0.4, 7.55, 7.85, true);

    // ------------------------------------------------------------ chimney (stone) over the great-room fireplace
    blk(70.0, 37.0, 72.9, 41.4, WH, 21.2, 'ledgestone', { ...roofP, chimney: [XGR - 0.25 - 3.55 / 2, 39.2] });
    blk(69.85, 36.85, 73.05, 41.55, 21.2, 21.55, CAP, { ...roofP, chimney: [XGR - 0.25 - 3.55 / 2, 39.2] });
    blk(70.6, 37.6, 71.2, 38.4, 21.55, 22.3, BLACK, { ...roofP, chimney: [XGR - 0.25 - 3.55 / 2, 39.2] });
    blk(71.7, 40.0, 72.3, 40.8, 21.55, 22.3, BLACK, { ...roofP, chimney: [XGR - 0.25 - 3.55 / 2, 39.2] });

    // ------------------------------------------------------------ exterior cladding: dark board garage, stone wainscot
    const skinX = (x, ya, yb, z0, z1, holes, col, out = -1) => {
      // vertical skin on a north-south wall face; holes = [[s,e,bottom,top]]
      const cuts = holes.slice().sort((p, q) => p[0] - q[0]);
      const x1 = x + 0.1 * out;
      let cur = ya;
      for (const [s, e, b0, t0] of cuts) {
        if (s > cur) blk(x, cur, x1, s, z0, z1, col);
        if (b0 > z0) blk(x, s, x1, e, z0, b0, col);
        if (t0 < z1) blk(x, s, x1, e, t0, z1, col);
        cur = e;
      }
      if (cur < yb) blk(x, cur, x1, yb, z0, z1, col);
    };
    const skinY = (y, xa, xb, z0, z1, holes, col, out = 1) => {
      const cuts = holes.slice().sort((p, q) => p[0] - q[0]);
      let cur = xa;
      const y1 = y + 0.1 * out;
      for (const [s, e, b0, t0] of cuts) {
        if (s > cur) blk(cur, y, s, y1, z0, z1, col);
        if (b0 > z0) blk(s, y, e, y1, z0, b0, col);
        if (t0 < z1) blk(s, y, e, y1, t0, z1, col);
        cur = e;
      }
      if (cur < xb) blk(cur, y, xb, y1, z0, z1, col);
    };
    if (DARK_GARAGE) {
    // garage west face (x = -0.4): three 10' overhead doors + exercise window
    skinX(-0.41, YEX - 0.5, YGS + 0.5, -0.3, GH, [[12, 17, 3, 7], [24.6, 34.6, -1, 8], [37.2, 47.2, -1, 8], [49.7, 59.7, -1, 8]], 'board');
    skinY(YEX - 0.41, -0.5, XG1 + 0.5, -0.3, GH, [[4, 9, 3, 7], [17, 22, 3, 7]], 'board', -1);
    skinY(YGS + 0.41, -0.5, XG1 + 0.5, 2.9, GH, [[7.5, 11, 3.5, 7], [15, 18.5, 3.5, 7]], 'board', 1);
    skinY(YGS + 0.41, -0.5, XG1 + 0.5, -0.3, 2.9, [], 'ledgestone', 1);
    box(CAP, -0.55, YGS + 0.4, XG1 + 0.55, YGS + 0.66, 2.85, 3.0);
    // east face of the garage block toward the west porch
    blk(XG1 + 0.41, YEX - 0.5, XG1 + 0.51, 13.5, -0.3, GH, 'board');
    blk(XG1 + 0.41, 17, XG1 + 0.51, 24.3, 0, GH, 'board');
    blk(XG1 + 0.41, 13.5, XG1 + 0.51, 17, 0, 3, 'board');
    blk(XG1 + 0.41, 13.5, XG1 + 0.51, 17, 7, GH, 'board');
    blk(XG1 + 0.41, 24.3, XG1 + 0.51, 27.3, 7, GH, 'board');
    blk(XG1 + 0.41, 27.3, XG1 + 0.51, YGR + 0.4, 0, GH, 'board');
    blk(XG1 + 0.41, YLS - 0.4, XG1 + 0.51, YGS + 0.5, -0.3, GH, 'board');
    } else {
      skinX(-0.41, YEX - 0.5, YGS + 0.5, -0.3, 2.85, [[24.6, 34.6, -1, 8], [37.2, 47.2, -1, 8], [49.7, 59.7, -1, 8]], 'ledgestone');
      skinY(YGS + 0.41, -0.5, XG1 + 0.5, -0.3, 2.9, [], 'ledgestone', 1);
      box(CAP, -0.55, YGS + 0.4, XG1 + 0.55, YGS + 0.66, 2.85, 3.0);
      skinY(YEX - 0.41, -0.5, XG1 + 0.5, -0.3, 2.85, [], 'ledgestone', -1);
    }
    // closed overhead garage doors (black, panel grooves + glass top row)
    for (const [s, e] of [[24.6, 34.6], [37.2, 47.2], [49.7, 59.7]]) {
      blk(-0.18, s, 0.0, e, 0, 8, '#26282b');
      for (let z = 1.6; z < 6.4; z += 1.6) box('#141516', -0.24, s + 0.15, -0.17, e - 0.15, z - 0.04, z + 0.04);
      for (let i = 0; i < 5; i++) { const a = s + 0.35 + i * 1.9; box('#3d4650', -0.22, a, -0.17, a + 1.6, 6.65, 7.55); }
      box(BLACK, -0.62, s - 0.25, -0.38, s, 0, 8.25); box(BLACK, -0.62, e, -0.38, e + 0.25, 0, 8.25); box(BLACK, -0.62, s - 0.25, -0.38, e + 0.25, 8, 8.25);
    }
    // gooseneck lights over the garage doors
    for (const y of [29.6, 42.2, 54.7]) { box(BLACK, -0.9, y - 0.12, -0.42, y + 0.12, 8.6, 8.72); box('#f6e2a8', -1.05, y - 0.2, -0.75, y + 0.2, 8.42, 8.6); }
    // stone wainscot on the front (south) faces
    const wain = (y, xa, xb, holes = []) => { skinY(y, xa, xb, -0.3, 2.85, holes, 'ledgestone', 1); box(CAP, xa - 0.05, y, xb + 0.05, y + 0.22, 2.85, 3.0); };
    wain(YB2 + 0.41, XW - 0.4, XD + 0.4);
    wain(YFS + 0.41, XD + 0.4, XGR - 0.4, [[56.75, 61.75, -1, 9], [55.35, 56.45, -1, 9], [62.05, 63.15, -1, 9]]);
    wain(YB2 + 0.41, XGR - 0.4, XB2 + 0.4);
    wain(YB3 + 0.41, XB2 + 0.4, XB3 + 0.4);
    wain(YLS + 0.41, XG1 + 0.4, XW + 0.4);

    // ------------------------------------------------------------ black window frames (both faces) + exterior door casings
    for (const [x0, y0, x1, y1, sill, head, horiz] of EXT_WIN) {
      const f = 0.16, dp = 0.06;
      for (const side of [-1, 1]) {
        const off = side * 0.42;
        if (horiz) {
          const y = y0 + off, ya = Math.min(y, y + side * dp), yb = Math.max(y, y + side * dp);
          box(BLACK, x0, ya, x1, yb, sill, sill + f); box(BLACK, x0, ya, x1, yb, head - f, head);
          box(BLACK, x0, ya, x0 + f, yb, sill, head); box(BLACK, x1 - f, ya, x1, yb, sill, head);
          const n = Math.max(1, Math.round((x1 - x0) / 2.6));
          for (let i = 1; i < n; i++) { const x = x0 + (i * (x1 - x0)) / n; box(BLACK, x - 0.05, ya, x + 0.05, yb, sill, head); }
          if (head - sill > 4.5) box(BLACK, x0, ya, x1, yb, sill + (head - sill) * 0.62 - 0.05, sill + (head - sill) * 0.62 + 0.05);
        } else {
          const x = x0 + off, xa = Math.min(x, x + side * dp), xb = Math.max(x, x + side * dp);
          box(BLACK, xa, y0, xb, y1, sill, sill + f); box(BLACK, xa, y0, xb, y1, head - f, head);
          box(BLACK, xa, y0, xb, y0 + f, sill, head); box(BLACK, xa, y1 - f, xb, y1, sill, head);
          const n = Math.max(1, Math.round((y1 - y0) / 2.6));
          for (let i = 1; i < n; i++) { const y = y0 + (i * (y1 - y0)) / n; box(BLACK, xa, y - 0.05, xb, y + 0.05, sill, head); }
          if (head - sill > 4.5) box(BLACK, xa, y0, xb, y1, sill + (head - sill) * 0.62 - 0.05, sill + (head - sill) * 0.62 + 0.05);
        }
      }
    }
    // front entry: transom glass band + black surround, porch lanterns
    box(BLACK, 55.2, YFS + 0.4, 63.3, YFS + 0.52, 8.0, 8.2);
    for (const x of [54.7, 63.8]) { box(BLACK, x - 0.22, YFS + 0.42, x + 0.22, YFS + 0.75, 6.0, 7.1); box('#f6e2a8', x - 0.14, YFS + 0.5, x + 0.14, YFS + 0.7, 6.15, 6.95); }

    // ------------------------------------------------------------ site: driveway, walks, steps, beds
    k.plane(-30, YGN - 2, -0.45, YGS + 1.5, 'concrete');
    k.plane(-30, YGS + 1.5, -12, 120, 'concrete');
    k.plane(56.4, YFP + 1.5, 62.1, 100, 'paver');
    k.plane(-12, 92, 56.4, 97, 'paver');
    blk(54.9, YFP, 63.6, YFP + 1.5, -0.55, -0.27, '#a9a59c');                    // front step
    for (let i = 0; i < 3; i++) blk(XW + 0.2, YEX + i * 1.35, XD - 0.2, YST, -0.55, -0.55 + (i + 1) * 0.183, '#a9a59c'); // rear steps
    blk(XW, YEX - 0.2, XW + 0.25, YST, -0.55, 2.6, TIMBER_D); blk(XD - 0.25, YEX - 0.2, XD, YST, -0.55, 2.6, TIMBER_D);
    // landscape beds along the front
    for (const [a, b] of [[XW - 0.4, XD - 1.2], [XGR + 1.2, XB2 + 0.4], [XB2 + 0.4, XB3 + 0.4]]) {
      const y0 = a < 50 || a > 80 ? (a > 80 ? YB3 + 0.55 : YB2 + 0.55) : YB2 + 0.55;
      if (a > XGR) continue; // east wing beds sit under the porch roof line; keep the porch clear
      blk(a, y0, b, y0 + 0.01, -0.5, -0.45, '#3a2c20');
    }
    blk(XB2 + 0.6, YB3 + 0.55, XB3 + 0.2, YB3 + 2.6, -0.55, -0.42, '#3a2c20');
    blk(XB3 + 0.6, YB3W + 0.55, XE + 0.2, YB3W + 2.6, -0.55, -0.42, '#3a2c20');
    for (const [x, y] of [[85, 59.6], [88.5, 59.6], [92, 59.6], [97, 58.6], [101, 58.6]]) blk(x - 0.7, y - 0.7, x + 0.7, y + 0.7, -0.45, 0.9, '#4d6b3c');

    // ------------------------------------------------------------ interior trim
    // built-in cabinetry (foyer west wall, great-room alcove) + kitchen uppers
    blk(XD + 0.2, YK + 0.4, XD + 1.6, YFS - 0.6, 0, 3.0, CAB);
    box('#d9cdb9', XD + 0.15, YK + 0.35, XD + 1.7, YFS - 0.55, 3.0, 3.15);
    for (const y of [YK + 0.4, 50.9, 52.95, YFS - 0.75]) box(CAB, XD + 0.2, y, XD + 1.2, y + 0.15, 3.15, 8.4);
    for (let z = 4.4; z < 8.4; z += 1.35) box(WOODSHELF, XD + 0.2, YK + 0.4, XD + 1.2, YFS - 0.6, z, z + 0.1);
    box(CAB, XD + 0.2, YK + 0.4, XD + 1.2, YFS - 0.6, 8.3, 8.6);
    blk(XGR + 0.25, YSTR - 1.6, XM - 0.2, YSTR - 0.2, 0, 3.0, CAB);
    box('#d9cdb9', XGR + 0.2, YSTR - 1.65, XM - 0.15, YSTR - 0.15, 3.0, 3.15);
    blk(XGR + 0.25, YSTR - 1.25, XM - 0.2, YSTR - 0.2, 4.6, 8.0, CAB);
    // stair: treads stepping down (visible from the hall) + rail
    for (let i = 0; i < 9; i++) { const y = YH - 0.2 - i * 1.0; blk(XGR + 0.45, y - 1.0, XM - 0.2, y, -0.05 - i * 0.6, -0.45 - i * 0.6 + 0.4, '#b98d5f'); }
    box(BLACK, XGR + 0.25, YSTR, XGR + 0.4, YH, 3.0, 3.12);
    for (let y = YSTR + 0.5; y < YH; y += 0.9) box(BLACK, XGR + 0.28, y, XGR + 0.37, y + 0.06, 0, 3.0);
    // kitchen uppers (west wall) + open shelves
    const UP = MTN ? '#3f3f3d' : CAB;
    blk(XW + 0.2, YDK + 0.25, XW + 1.4, 35.85, 4.7, 7.9, UP);
    blk(XW + 0.2, 38.45, XW + 1.4, 40.35, 4.7, 7.9, UP);
    box(UP, XW + 0.2, YDK + 0.25, XW + 1.4, 40.35, 7.9, 8.4);
    box(MTN ? '#e9e5de' : '#f3f1ec', XW + 0.2, YDK + 0.25, XW + 0.32, 40.35, 3.1, 4.7); // backsplash
    // great room vault beams (scissor ties) + fan
    for (const y of [32.5, 37.75, 43.0]) box(TIMBER, XD + 0.3, y - 0.3, XGR - 0.3, y + 0.3, 12.6, 13.2, true);
    box(TIMBER, CXR - 0.33, YGR, CXR + 0.33, YK, ridgeZ - 1.3, ridgeZ - 0.4, true);
    // dining coffered beams
    for (const y of [21.6, 25.0, 28.4]) box(TIMBER, XW + 0.2, y - 0.2, XD - 0.2, y + 0.2, 8.65, WH);
    // tray trim in the primary bedroom
    for (const [a, b, c, d] of [[75.4, 23.1, 86.8, 23.3], [75.4, 36.7, 86.8, 36.9], [75.4, 23.1, 75.6, 36.9], [86.6, 23.1, 86.8, 36.9]]) box('#e8e2d4', a, b, c, d, 8.75, 9.0);
    // shower glass + bench (M. Bath)
    blk(XMB + 0.25, YMS - 0.05, 92.2, YMS + 0.05, 0.0, 7.2, 'glass');
    blk(XB3 - 0.25, YMS + 0.3, XB3 - 0.15, YH - 0.3, 0.0, 0.0, 'glass');
    blk(XMB + 0.25, YH - 1.6, 91.6, YH - 0.25, 0, 1.55, '#d9d4cb');
    // walk-in closet shelving
    const shelves = (a, b, c, d) => { blk(a, b, c, d, 0, 7.2, WOODSHELF); };
    shelves(XE - 1.95, YMS + 0.3, XE - 0.45, YW - 0.3);
    shelves(XB3 + 0.3, 41.0, XB3 + 1.8, YW - 0.3);
    shelves(XB3 + 0.3, YW + 0.3, XE - 0.45, YW + 1.8);
    shelves(XFE + 0.25, YK + 0.25, XGR - 0.25, YK + 1.75);
    shelves(XFE + 0.25, YK + 1.75, XFE + 1.75, YFS - 0.45);
    blk(31.25, YPS + 0.25, XW - 0.25, YPS + 1.75, 0, 7.2, WOODSHELF);          // mud closet
    // pantry shelving (U)
    blk(XG1 + 0.45, YGR + 0.45, XW - 0.25, YGR + 1.95, 0, 7.4, WOODSHELF);
    blk(XG1 + 0.45, YGR + 1.95, XG1 + 1.95, YPS - 0.25, 0, 7.4, WOODSHELF);
    // garage: storage cabinets + workbench on the east wall
    blk(XG1 - 2.25, 30, XG1 - 0.3, 44, 0, 7.0, '#5d6066');
    blk(XG1 - 2.6, 50, XG1 - 0.3, 54.5, 0, 3.1, '#6b5a46');
    blk(XG1 - 1.2, 50, XG1 - 0.3, 54.5, 4.5, 7.5, '#5d6066');

    flush();

    // ------------------------------------------------------------ furniture (detailed items)
    if (!k.place) return;
    const P = (t, o) => k.place(t, o);
    const TIE_Z = 12.6; // underside of the great-room scissor ties (chandeliers hang from the middle one)
    if (MTN) {
      // ---- staged from the Mountain Ranch interior renderings: warm-modern, cream bouclé, cognac leather,
      // walnut organic tables, charcoal shaker kitchen with a fluted island + marble waterfall, rattan + brass light.
      // old-world French limestone mantel (Nick's reference photo): plain plaster breast above, no TV
      P('fpOldWorld72', { x: XGR - 0.25 - 3.55 / 2, y: 39.2, rot: 90, h: WH, variant: 'styled' });
      P('rug', { x: 60.6, y: 39.2, w: 12.5, d: 10, rot: 90, variant: 'jute', color: '#b9a37c', field: '#cdb994' }); // jute
      P('sectional', { x: 57.2, y: 39.6, rot: 270, w: 10.5, d: 6.4, finish: 'boucle', variant: 'track-arm', chaise: 'left', wood: 'walnut', pillow: '#b9ae9f' });
      P('coffeeTable', { x: 62.0, y: 39.4, rot: 90, variant: 'organic', w: 4.8, d: 2.7, wood: 'walnut' });
      P('accentChair', { x: 63.8, y: 33.4, rot: 20, variant: 'lounge', finish: 'cognac' });
      P('pendant', { x: 61.0, y: 37.75, variant: 'sputnik', metal: '#b08a4a', ceil: TIE_Z });
      P('curtains', { x: CXR, y: YGR + 0.75, rot: 0, w: 18.2, h: 8.6, d: 0.55 });
      P('plant', { x: 50.4, y: 29.4, variant: 'olive' });
      P('plant', { x: 67.6, y: 45.6, variant: 'olive', w: 1.8, d: 1.8 });
      // Kitchen — charcoal shaker perimeter, brass pulls, marble tops; fluted walnut island with waterfall ends
      const KC = { carcass: '#3b3b3a', door: '#444442', top: '#eeebe5', metal: '#c9a35a' };
      P('counter', { x: XW + 1.2, y: 33.55, w: 4.7, d: 2, rot: 270, ...KC });
      P('range', { x: XW + 1.3, y: 37.15, rot: 270 });
      P('counter', { x: XW + 1.2, y: 39.4, w: 1.9, d: 2, rot: 270, ...KC });
      P('fridge', { x: XW + 1.4, y: 42.0, rot: 270, color: '#c9ccd0' });
      P('counter', { x: XW + 1.2, y: 43.9, w: 0.9, d: 2, rot: 270, ...KC });
      P('island', { x: 44.1, y: 37.6, w: 11, d: 4, rot: 90, variant: 'fluted-waterfall', carcass: '#3a2c22', door: '#4a382b', top: '#eeebe5' });
      P('sink', { x: 43.4, y: 37.6, rot: 270 });
      for (const y of [33.9, 36.5, 39.1, 41.7]) P('barstool', { x: 47.15, y, rot: 90, finish: 'cream', wood: 'espresso' });
      for (const y of [35.1, 40.1]) P('pendant', { x: 44.1, y, rot: 90, variant: 'rattan', w: 3.0, metal: '#c9a35a' });
      P('counterItems', { x: XW + 1.2, y: 32.6, rot: 270 });
      // Dining — round dark pedestal table, cream upholstered chairs, linear brass chandelier
      P('rug', { x: 42.6, y: 24.6, w: 9, d: 9, color: '#cfc7ba', field: '#e4ded3' });
      P('diningTable', { x: 42.6, y: 24.6, w: 4.8, d: 4.8, variant: 'round', wood: 'espresso' });
      for (const [dx, dy, r] of [[0, -2.75, 0], [0, 2.75, 180], [-2.75, 0, 270], [2.75, 0, 90]]) P('diningChair', { x: 42.6 + dx, y: 24.6 + dy, rot: r, finish: 'cream', wood: 'espresso' });
      P('pendant', { x: 42.6, y: 24.6, variant: 'linear', w: 3.4, metal: '#b8913f' });
      P('cabinet', { x: 42.6, y: YDK - 0.8, w: 5, rot: 180, carcass: '#3b3b3a', door: '#444442', metal: '#c9a35a' });
    } else {
      // ---- Close to Home: modern-farmhouse staging — stone fireplace, linen + camel, white shaker with a sage island
      P('fpStoneTrad', { x: XGR - 0.25 - 1.3, y: 39.2, rot: 90, variant: 'traditional' });
      P('rug', { x: 62.0, y: 39.2, w: 11, d: 9, rot: 90, color: '#b9a78c', field: '#e2d8c6' });
      P('sofa', { x: 57.0, y: 39.2, rot: 270, finish: 'linen', variant: 'track-arm', w: 8.4, wood: 'walnut' });
      P('coffeeTable', { x: 61.1, y: 39.2, rot: 90, variant: 'wood', wood: 'walnut' });
      P('accentChair', { x: 62.2, y: 33.9, rot: 0, variant: 'wing', finish: 'camel', wood: 'walnut' });
      P('accentChair', { x: 62.2, y: 44.5, rot: 180, variant: 'wing', finish: 'camel', wood: 'walnut' });
      P('sideTable', { x: 57.0, y: 34.0, wood: 'walnut' });
      P('sideTable', { x: 57.0, y: 44.4, wood: 'walnut' });
      P('tableLamp', { x: 57.0, y: 34.0, z: 2.1 });
      P('tableLamp', { x: 57.0, y: 44.4, z: 2.1 });
      P('pendant', { x: 60.5, y: 37.75, variant: 'sputnik', metal: '#1d1d1f', ceil: TIE_Z });
      P('curtains', { x: CXR, y: YGR + 0.75, rot: 0, w: 18.2, h: 8.6, d: 0.55, color: '#efe9de' });
      P('plant', { x: 50.5, y: 29.6, variant: 'fiddle' });
      P('plant', { x: 67.9, y: 29.6, variant: 'olive' });
      P('bench', { x: 59.3, y: 29.6, rot: 0, finish: 'charcoal' });
      // Kitchen
      const KC = { carcass: '#f1ede4', door: '#f4f1ea', top: '#efece6', metal: '#2b2b2b' };
      P('counter', { x: XW + 1.2, y: 33.55, w: 4.7, d: 2, rot: 270, ...KC });
      P('range', { x: XW + 1.3, y: 37.15, rot: 270 });
      P('counter', { x: XW + 1.2, y: 39.4, w: 1.9, d: 2, rot: 270, ...KC });
      P('fridge', { x: XW + 1.4, y: 42.0, rot: 270, color: '#d4d7da' });
      P('counter', { x: XW + 1.2, y: 43.9, w: 0.9, d: 2, rot: 270, ...KC });
      P('island', { x: 44.1, y: 37.6, w: 11, d: 4, rot: 90, variant: 'waterfall', carcass: '#5d6a5c', door: '#66735f', top: '#efece6', metal: '#c9a35a' });
      P('sink', { x: 43.4, y: 37.6, rot: 270 });
      for (const y of [33.6, 35.6, 37.6, 39.6, 41.6]) P('barstool', { x: 47.15, y, rot: 90, finish: 'camel', wood: 'walnut' });
      for (const y of [34.4, 37.6, 40.8]) P('pendant', { x: 44.1, y, variant: 'globe', metal: '#2b2b2b' });
      P('counterItems', { x: XW + 1.2, y: 32.6, rot: 270 });
      // Dining
      P('rug', { x: 42.6, y: 24.8, w: 10, d: 7.5, color: '#9c8a70', field: '#d8cdb9' });
      P('diningTable', { x: 42.6, y: 24.8, w: 7.5, d: 3.6, variant: 'turned', wood: 'walnut' });
      for (const x of [40.1, 42.6, 45.1]) { P('diningChair', { x, y: 22.35, rot: 0, finish: 'linen', wood: 'walnut' }); P('diningChair', { x, y: 27.25, rot: 180, finish: 'linen', wood: 'walnut' }); }
      P('diningChair', { x: 37.95, y: 24.8, rot: 270, finish: 'linen', wood: 'walnut' });
      P('diningChair', { x: 47.25, y: 24.8, rot: 90, finish: 'linen', wood: 'walnut' });
      P('pendant', { x: 42.6, y: 24.8, variant: 'linear', w: 4.4, metal: '#2b2b2b' });
      P('cabinet', { x: 42.6, y: YDK - 0.8, w: 5, rot: 180, carcass: '#f1ede4', metal: '#2b2b2b' });
    }
    // Office
    P('desk', { x: 42.6, y: 57.4, rot: 180, variant: 'pedestal', w: 5.5 });
    P('deskChair', { x: 42.6, y: 55.4, rot: 0, finish: 'charcoal' });
    P('monitor', { x: 42.6, y: 57.8, rot: 180 });
    P('deskLamp', { x: 44.6, y: 57.6, rot: 180 });
    P('bookshelf', { x: XW + 0.8, y: 49.6, rot: 270 });
    P('bookshelf', { x: XW + 0.8, y: 52.9, rot: 270 });
    P('accentChair', { x: 47.1, y: 50.6, rot: 90, variant: 'spindle', finish: 'sage' });
    P('sideTable', { x: 47.3, y: 52.7 });
    P('rug', { x: 42.8, y: 53.2, w: 8, d: 6 });
    // Foyer
    P('rug', { x: 58.9, y: 52.0, w: 6, d: 4.2, rot: 90 });
    P('bench', { x: 63.2, y: 52.0, rot: 90, finish: 'camel' });
    P('plant', { x: 51.2, y: 54.9, variant: 'olive' });
    // Primary suite
    P('bed', { x: 81.1, y: YMS - 0.2 - 3.5, rot: 180, w: 6.4, d: 7.0, variant: 'upholstered', finish: MTN ? 'greige' : 'linen' });
    P('nightstand', { x: 76.9, y: YMS - 0.95, rot: 180 });
    P('nightstand', { x: 85.3, y: YMS - 0.95, rot: 180 });
    if (MTN) { for (const x of [76.9, 85.3]) P('pendant', { x, y: YMS - 0.95, variant: 'globe', metal: '#b8913f' }); }
    else { P('tableLamp', { x: 76.9, y: YMS - 0.95, z: 2.25 }); P('tableLamp', { x: 85.3, y: YMS - 0.95, z: 2.25 }); }
    P('curtains', { x: 84.5, y: YMB + 0.75, rot: 0, w: 7.6, h: 8.6, color: MTN ? '#f1ede6' : '#efe9de' });
    P('curtains', { x: 78.0, y: YMB + 0.75, rot: 0, w: 5.6, h: 8.2, color: MTN ? '#f1ede6' : '#efe9de' });
    P('bench', { x: 81.1, y: 30.4, rot: 180, finish: 'charcoal' });
    P('rug', { x: 81.1, y: 32.0, w: 10, d: 8 });
    P('dresser', { x: XM + 1.05, y: 34.6, rot: 270, w: 4.6 });
    P('accentChair', { x: 76.1, y: 24.6, rot: 20, variant: MTN ? 'wing' : 'spindle', finish: MTN ? 'boucle' : 'linen', wood: 'walnut' });
    P('plant', { x: 87.0, y: 23.1, variant: 'fiddle' });
    // M. Bath
    P('vanity', { x: 94.5, y: YMBA + 1.35, rot: 0, w: 6.5 });
    P('tub', { x: 94.6, y: 36.7, rot: 0 });
    P('toilet', { x: 101.6, y: YMBA + 1.55, rot: 0 });
    P('shower', { x: 91.4, y: 41.25, w: 6.0, d: 5.6, rot: 180 });
    // Hall bath
    P('vanity', { x: 77.6, y: YMS + 1.15, rot: 0, w: 5.5 });
    P('toilet', { x: 82.4, y: YMS + 1.45, rot: 0 });
    P('tub', { x: 86.6, y: 41.25, rot: 270, w: 5.4 });
    // Bed 2
    P('bed', { x: 78.65, y: 53.9, rot: 270, w: 5.3, d: 6.8, variant: 'panel', finish: 'sage' });
    P('nightstand', { x: 81.4, y: 50.35, rot: 270 });
    P('nightstand', { x: 81.4, y: 57.45, rot: 270 });
    P('dresser', { x: 71.05, y: 57.0, rot: 90, w: 4.2 });
    P('rug', { x: 77.0, y: 53.9, w: 7, d: 5, rot: 90 });
    // Bed 3
    P('bed', { x: 89.0, y: YH + 0.2 + 3.4, rot: 0, w: 5.3, d: 6.8, variant: 'panel', finish: 'linen' });
    P('nightstand', { x: 85.45, y: YH + 0.95, rot: 0 });
    P('nightstand', { x: 92.55, y: YH + 0.95, rot: 0 });
    P('dresser', { x: XB2 + 1.05, y: 52.4, rot: 270, w: 4.4 });
    P('rug', { x: 89.0, y: 50.5, w: 7, d: 5 });
    // Mud + laundry + powder rooms
    P('mudBench', { x: XG1 + 0.95, y: 42.7, rot: 270, w: 3.4 });
    P('mudBench', { x: 33.8, y: YL - 0.95, rot: 180, w: 4.4 });
    P('washerDryer', { x: 27.6, y: YLS - 1.35, rot: 180 });
    P('washerDryer', { x: 30.0, y: YLS - 1.35, rot: 180 });
    P('counter', { x: 33.9, y: YLS - 1.2, w: 4.2, d: 2, rot: 180 });
    P('toilet', { x: 29.7, y: YPS + 1.4, rot: 0 });
    P('vanity', { x: XG1 + 1.05, y: 37.2, rot: 270, w: 2.6 });
    P('toilet', { x: 5.9, y: YGN - 1.4, rot: 180 });
    P('vanity', { x: 1.35, y: 21.2, rot: 270, w: 2.6 });
    // Exercise room
    P('powerRack', { x: 5.6, y: YEX + 2.4, rot: 0 });
    P('barbell', { x: 5.6, y: YEX + 2.6, rot: 0 });
    P('weightBench', { x: 13.5, y: 14.2, rot: 90 });
    P('dumbbellRack', { x: XG1 - 1.15, y: 14.0, rot: 270 });
    P('dumbbellRack', { x: XG1 - 1.15, y: 18.0, rot: 270 });
    P('rug', { x: 17.5, y: 14.8, w: 8, d: 6, rot: 0 });
    // Porches
    P('outdoorDining', { x: 54.3, y: 18.0, rot: 90, wood: 'teak' });
    P('outdoorSofa', { x: 66.4, y: 18.0, rot: 90, finish: 'sage' });
    P('coffeeTable', { x: 63.4, y: 18.0, rot: 90, w: 3.4, d: 1.9, wood: 'espresso' });
    P('outdoorLounge', { x: 62.0, y: 11.0, rot: 180 });
    P('firepit', { x: CXR, y: 1.5 });
    P('outdoorSofa', { x: 42.6, y: YB2 + 2.1, rot: 0, finish: 'charcoal' });
    P('outdoorSofa', { x: 76.0, y: YB2 + 2.1, rot: 0, finish: 'charcoal' });
    P('plant', { x: 54.6, y: 57.6, variant: 'olive', w: 1.6, d: 1.6 });
    P('plant', { x: 63.9, y: 57.6, variant: 'olive', w: 1.6, d: 1.6 });
    P('outdoorLounge', { x: 95.5, y: 24.5, rot: 0 });
    P('outdoorLounge', { x: 99.5, y: 24.5, rot: 0 });
    P('outdoorDining', { x: 80.8, y: 17.9, rot: 0, wood: 'teak' });
    P('outdoorDining', { x: 31.2, y: 21.5, rot: 90, wood: 'teak' });
  },
};
}

export default closeToHome();
