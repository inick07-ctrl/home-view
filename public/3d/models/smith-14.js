// Smith 14 — "Home away from Home": dark board-and-batten mountain ranch from Nick's rendering + floor plan.
// Plan feet: x east, y south. FRONT = south (front porch at the bottom of the plan).
// Origin: x = 0 at the west wall of Bedroom #2, y = 0 at the north edge of the covered deck.
//
// Charcoal board-and-batten, dark architectural shingles over a cluster of gables, a timber-framed
// front entry gable on stone pillars, stone wainscot, two stone chimneys and black windows.
// Room sizes follow the plan's labels; positions follow the drawing's proportions.
import { makeWalls } from '../lib.js';

// ----- x grid -----
const X0 = 0;              // Bedroom #2 west
const XMBA = 5.5;          // master bath / W.I.C. west
const XBW = 7.8;           // shared baths west
const XB2 = 15.7;          // Bedroom #2 east / hall west
const XBS = 16.6;          // bath 2 / bath 3 split
const XMB = 22.4;          // master bath east / master bedroom west
const XSF = 24.7;          // W.I.C. east / safe room west
const XB3 = 25.5;          // Bedroom #3 west / bath 3 east
const XSFE = 31.8;         // safe room east
const XB3C = 32;           // Bedroom #3 closet east
const XMBE = 39;           // master bedroom east / office, laundry, Bedroom #4 west
const XB3E = 40.6;         // Bedroom #3 east
const XOF = 50;            // office + laundry east / landing + stair west
const XB4 = 51;            // Bedroom #4 east / entry west
const XGR = 54;            // great room west (fireplace wall)
const XP0 = 58.5;          // front porch west
const CXP = 66.5;          // front porch / entry centre line
const XP1 = 74.5;          // front porch east
const XGRE = 76;           // great room east / kitchen west
const XSV = 79.4;          // mud wing west
const XPD = 83.5;          // powder east / service hall west
const XDN = 84;            // dining west
const XPN = 87.8;          // pantry west
const XK = 97.6;           // kitchen + dining east / sun room + garage west
const XSUN = 115.3;        // sun room east
const XG = 124.6;          // garage east

// ----- y grid -----
const YDK0 = 0;            // covered deck north
const YDNN = 5.65;         // dining north
const YSD = 6.3;           // side decks / covered strips
const YMBN = 9;            // master bedroom north
const YSUN = 12.5;         // sun room north
const YGRN = 14.3;         // great room + office north (deck wall)
const YMBA = 15;           // master bath north
const YLND = 22;           // landing / stair top
const YDK = 22.4;          // dining / kitchen
const YOFS = 26;           // office south
const YGN = 27;            // garage north / sun room south
const YMBS = 27.1;         // master bedroom south
const YLAU = 28.5;         // laundry north
const YSF = 29.17;         // safe room north
const YWIC = 29.5;         // master bath south / W.I.C. north
const YH = 37;             // hall north
const YGRS = 37.4;         // great room + kitchen south / entry north
const YB4 = 42.8;          // hall south / Bedroom #4 north
const YPAN = 44.4;         // pantry south
const YFR = 45.2;          // front wall (entry) / mud room north
const YB2S = 52.1;         // Bedroom #2 south / baths north
const YB3 = 55;            // Bedroom #3 north / Bedroom #4 south
const YPW = 56;            // porch wings south
const YSV = 58.5;          // mud wing south
const YPF = 60;            // front porch south
const YBTH = 63;           // baths south
const YB3S = 70.7;         // Bedroom #3 south
const YGS = 78.1;          // garage south

const WH = 9.5;            // house wall height
const GH = 11;             // garage wall height
const FP_Y = 25.7;         // great-room fireplace centre (red mark on the west wall)

const w = makeWalls();
const EXT_WIN = []; // [x0,y0,x1,y1,sill,head,horiz]
const xw = (x0, y0, x1, y1, o = {}) => {
  w.seg(x0, y0, x1, y1, { ext: true, ...o });
  const horiz = Math.abs(y1 - y0) < Math.abs(x1 - x0);
  for (const [s, e, sill = 3, head = 7] of o.windows || []) EXT_WIN.push(horiz ? [s, y0, e, y0, sill, head, true] : [x0, s, x0, e, sill, head, false]);
};

// =====================================================================
// EXTERIOR (clockwise from Bedroom #2)
// =====================================================================
xw(X0, YH, XMBA, YH, {});
xw(XMBA, YMBA, XMBA, YH, { windows: [[18.5, 22.5, 4, 7.5], [31, 34, 4.5, 7.5]] });            // master bath + W.I.C. west
xw(XMBA, YMBA, XMB, YMBA, { windows: [[9.5, 14.5, 4, 7.5]] });                                // tub window
xw(XMB, YMBN, XMB, YMBA, {});
xw(XMB, YMBN, XMBE, YMBN, { windows: [[25, 29.5, 2.5, 7.5], [32, 36.5, 2.5, 7.5]] });          // master bedroom north
xw(XMBE, YMBN, XMBE, YGRN, { doors: [[10, 13, 8]] });                                          // master → side deck
xw(XMBE, YGRN, XGR, YGRN, { windows: [[41.5, 47.5, 3, 7]] });                                 // office north (covered strip)
xw(XGR, YGRN, XDN, YGRN, { windows: [[55.5, 60.5, 2, 8], [72.5, 75.5, 2, 8], [77, 82.5, 3.5, 7.5]], doors: [[62, 69, 8]] }); // great room → covered deck
xw(XDN, YDNN, XDN, YGRN, { doors: [[8, 11, 8]] });                                             // dining → side deck
xw(XDN, YDNN, XK, YDNN, { windows: [[86.5, 90.5, 2.5, 7.5], [91.3, 95.3, 2.5, 7.5]] });
xw(XK, YDNN, XK, YSUN, {});
xw(XK, YSUN, XSUN, YSUN, { windows: [[99.5, 104.5, 2, 8], [105.5, 110.5, 2, 8]] });           // sun room: big glass
xw(XSUN, YSUN, XSUN, YGN, { windows: [[13.5, 18.5, 2, 8]] });                                // (chimney + fireplace at y≈21.5)
xw(XSUN, YGN, XG, YGN, { h: GH, windows: [[117.5, 122.5, 4, 7]] });
xw(XG, YGN, XG, YGS, { h: GH, doors: [[31, 40, 8], [42.5, 51.5, 8], [54, 63, 8], [65.5, 74.5, 8]] }); // four 9' side-load bays
xw(XK, YGS, XG, YGS, { h: GH, windows: [[104, 107, 3.5, 8], [109.6, 112.6, 3.5, 8], [115.2, 118.2, 3.5, 8]] }); // garage front gable (stone)
xw(XK, YSV, XK, YGS, { h: GH, windows: [[66, 70, 4, 7.5]] });
xw(XSV, YSV, XK, YSV, { windows: [[83, 86.5, 3, 7.5], [89.5, 93, 3, 7.5]] });                  // mud wing front gable
xw(XSV, YFR, XSV, YSV, { doors: [[50, 53, 7.5]] });                                            // side entry from the porch wing
xw(XB4, YFR, XSV, YFR, { windows: [[60, 63.3, 1.5, 8], [69.7, 73, 1.5, 8], [76, 78.6, 3, 7]], doors: [[64, 69, 8.5]] }); // entry
xw(XB4, YFR, XB4, YB3, { windows: [[48, 52, 3, 7]] });
xw(XB3E, YB3, XB4, YB3, { windows: [[43, 48.5, 3, 7]] });                                     // Bedroom #4 front
xw(XB3E, YB3, XB3E, YB3S, { windows: [[60.5, 65.5, 3, 7]] });
xw(XB3, YB3S, XB3E, YB3S, { windows: [[28, 32.5, 2.5, 7.5], [33.5, 38, 2.5, 7.5]] });          // Bedroom #3 front gable
xw(XB3, YBTH, XB3, YB3S, {});
xw(XBW, YBTH, XB3, YBTH, { windows: [[11, 13.5, 4.5, 7], [20, 22.5, 4.5, 7]] });
xw(XBW, YB2S, XBW, YBTH, {});
xw(X0, YB2S, XBW, YB2S, {});
xw(X0, YH, X0, YB2S, { windows: [[40, 44.5, 2.5, 7.5], [46, 50.5, 2.5, 7.5]] });              // Bedroom #2 west gable

// =====================================================================
// INTERIOR
// =====================================================================
// master suite
w.seg(XMB, YMBA, XMB, YWIC, { doors: [[23.6, 26.4, 7]] });              // master bed → bath
w.seg(XMB, YMBS, XMBE, YMBS, { doors: [[34.5, 37.3, 7]] });             // master bed → vestibule
w.seg(XMBA, YWIC, XSF, YWIC, { doors: [[14, 16.8, 7]] });               // bath → W.I.C.
w.seg(XSF, YWIC, XSF, YH, {});
w.seg(XSF, YSF, XSFE, YSF, { doors: [[27.5, 30.3, 7]] });               // safe room (steel door)
w.seg(XSFE, YSF, XSFE, YH, {});
w.seg(XMBA, YH, XOF, YH, { doors: [[34.6, 37.4, 7], [43, 45.8, 7]] });   // hall north: vestibule, laundry
// office / closet / laundry / landing / stair
w.seg(XMBE, YGRN, XMBE, YH, {});
w.seg(XMBE, YOFS, XOF, YOFS, {});
w.seg(XMBE, YLAU, XOF, YLAU, {});
w.seg(XOF, YGRN, XOF, YH, { doors: [[16.6, 19.4, 7], [26.4, 28.1, 7]] }); // office + coat closet from the landing
w.seg(XOF, YLND, XGR, YLND, { h: 3.2 });                                // stair-well guard
w.seg(XGR, 18.6, XGR, YGRS, { t: 0.6 });                               // fireplace wall (landing opens at the north end)
// bedrooms + baths
w.seg(XB2, YH, XB2, YB2S, { doors: [[39.2, 42, 7]] });                 // Bedroom #2 door
w.seg(XBW, YB2S, XB2, YB2S, { doors: [[12.4, 15.1, 7]] });             // Bedroom #2 → bath 2
w.seg(XB2, YB2S, XB3C, YB2S, { doors: [[19.8, 22.4, 7]] });             // hall → bath 3
w.seg(XBS, YB2S, XBS, YBTH, {});
w.seg(XB3, YB2S, XB3, YBTH, {});
w.seg(XB3C, YB2S, XB3C, YB3, {});
w.seg(XB3, YB3, XB3E, YB3, { doors: [[27, 29.8, 7], [34.6, 37.4, 7]] }); // Bedroom #3 closet + door
w.seg(XMBE, YB4, XB4, YB4, { doors: [[44.8, 47.6, 7]] });               // Bedroom #4 door
w.seg(XMBE, YB4, XMBE, YB3, {});
w.seg(XB4, YB4, XB4, YFR, {});
// service: powder, pantry, mud room, garage
w.seg(XGRE, YGRS, XGRE, YFR, { doors: [[39.6, 42.3, 7]] });             // powder from the entry
w.seg(XGRE, YGRS, XPD, YGRS, {});
w.seg(XPD, YGRS, XPD, YFR, {});
w.seg(XPN, YGRS, XK, YGRS, { doors: [[88.1, 90.6, 7]] });              // pantry from the kitchen
w.seg(XPN, YGRS, XPN, YPAN, {});
w.seg(XPN, YPAN, XK, YPAN, {});
w.seg(XGRE, YFR, XPD, YFR, {});
w.seg(XK, YDNN + 6.8, XK, YGN, { doors: [[16.6, 21.4, 8]] });          // dining → sun room French doors
w.seg(XK, YGN, XSUN, YGN, { h: GH });                                 // sun room / garage
w.seg(XK, YGN, XK, YSV, { h: GH, t: 0.6, doors: [[45.3, 47.6, 7]] });  // garage wall, door from the mud room

function makeHelpers(k) {
  const T = k.THREE;
  const keep = { keep: true };
  const roofP = { keep: true, roof: true };
  const blk = (a, b, c, d, z0, z1, col, o = keep) => k.block(Math.min(a, c), Math.min(b, d), Math.max(a, c), Math.max(b, d), z0, z1, col, o);
  const custom = (geo, col, o = keep) => { const m = k.block(0, 0, 0.05, 0.05, 0, 0.05, col, o); if (!m) return null; m.geometry.dispose(); m.geometry = geo; return m; };
  const batches = {};
  const box = (col, a, b, c, d, z0, z1, roof = false) => {
    const g = new T.BoxGeometry(Math.abs(c - a), z1 - z0, Math.abs(d - b));
    g.translate(k.W((a + c) / 2), (z0 + z1) / 2, k.Z((b + d) / 2));
    (batches[col + (roof ? '|r' : '')] ||= []).push(g.toNonIndexed());
  };
  // sloped member in the vertical plane of constant plan-y
  const slope = (col, y, x0, z0, x1, z1, depth, width, roof = true) => {
    const L = Math.hypot(x1 - x0, z1 - z0);
    const g = new T.BoxGeometry(L, depth, width);
    g.rotateZ(Math.atan2(z1 - z0, x1 - x0));
    g.translate(k.W((x0 + x1) / 2), (z0 + z1) / 2, k.Z(y));
    (batches[col + (roof ? '|r' : '')] ||= []).push(g.toNonIndexed());
  };
  // sloped member in the vertical plane of constant plan-x
  const slopeY = (col, x, y0, z0, y1, z1, depth, width, roof = true) => {
    const L = Math.hypot(y1 - y0, z1 - z0);
    const g = new T.BoxGeometry(width, depth, L);
    g.rotateX(Math.atan2(z1 - z0, y1 - y0));
    g.translate(k.W(x), (z0 + z1) / 2, k.Z((y0 + y1) / 2));
    (batches[col + (roof ? '|r' : '')] ||= []).push(g.toNonIndexed());
  };
  const flush = () => {
    for (const [key, list] of Object.entries(batches)) {
      const [col, r] = key.split('|');
      const n = list.reduce((s, g) => s + g.attributes.position.count, 0);
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
      let o = 0;
      for (const g of list) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); uv.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; g.dispose(); }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new T.BufferAttribute(nor, 3));
      geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
      custom(geo, col, r ? roofP : keep);
      delete batches[key];
    }
  };
  // wall infill in the vertical plane of constant plan-x, outline pts [y, z] (closes interior walls up to a vault)
  const panelX = (x, outline, col, thick = 0.5) => {
    const shape = new T.Shape(outline.map(([y, z]) => new T.Vector2(y, z)));
    const g = new T.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false });
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setXYZ(i, k.W(x + pos.getZ(i) - thick / 2), pos.getY(i), k.Z(pos.getX(i)));
    g.computeVertexNormals();
    return custom(g, col, keep);
  };
  return { blk, box, slope, slopeY, flush, panelX, keep, roofP };
}

// front porch gable: ridge on the porch centre line
const PP = 0.6;                                    // porch gable pitch
const porchZ = (x) => WH + PP * (x < CXP ? x - XP0 : XP1 - x);
const coreZ = (y) => WH + 0.55 * (y < 29.75 ? y - YGRN : YFR - y); // main core roof plane height at plan y

export default {
  id: 'smith-14',
  name: 'Home away from Home',
  title: 'Home away from Home',
  subtitle: 'A dark board-and-batten mountain ranch with a timber entry gable, two stone fireplaces, a sun room, a safe room, and a 4-car garage.',
  wallH: WH,
  defaultStyle: 'default',
  walkStart: [CXP, YPF + 3.5, 0],
  garageDoor: { color: '#2b2d30', glass: true },
  materials: { extTex: 'board', ext: '#2a2c2f', int: '#efebe4', roofTex: 'darkShingle', roofUnder: '#c9a57c', roofUnderGlow: 0.3, gable: 'ext', extSkin: true },
  planImage: { src: new URL('./smith-14-plan.jpg', import.meta.url).href, pxPerFt: 9.06, originPx: [3, 76], sizePx: [1206, 826] },
  walls: w,
  rooms: [
    // west wing
    ['Master Bedroom', "16'-4\" x 18'-1\"", 'wood', XMB, YMBN, XMBE, YMBS, { noAuto: true, labelAt: [30.7, 16] }],
    ['Master Bath', '', 'tile', XMBA, YMBA, XMB, YWIC, { noAuto: true, labelAt: [14, 22] }],
    ['W.I.C.', "19'-2\" x 7'-4\"", 'wood', XMBA, YWIC, XSF, YH, { noAuto: true, labelAt: [15, 33.2] }],
    ['Safe Room', "7'-1\" x 7'-10\"", 'concrete', XSF, YSF, XSFE, YH, { noAuto: true }],
    ['', '', 'wood', XMB, YMBS, XMBE, YSF, { noLabel: true, noAuto: true }],
    ['', '', 'wood', XSFE, YSF, XMBE, YH, { noLabel: true, noAuto: true }],
    ['Office', "10'-11\" x 11'-8\"", 'wood', XMBE, YGRN, XOF, YOFS, { noAuto: true }],
    ['Closet', '', 'wood', XMBE, YOFS, XOF, YLAU, { minor: true, noAuto: true }],
    ['Laundry', "10'-11\" x 8'-6\"", 'tile', XMBE, YLAU, XOF, YH, { noAuto: true }],
    ['', '', 'wood', XOF, YGRN, XGR, YLND, { noLabel: true, noAuto: true }],
    ['Stair (Dn)', '', 'wood', XOF, YLND, XGR, YH, { minor: true, noAuto: true }],
    ['Hall', '', 'wood', XB2, YH, XB4, YB4, { minor: true, noAuto: true, labelAt: [28, 40] }],
    ['', '', 'wood', XB2, YB4, XMBE, YB2S, { noLabel: true, noAuto: true }],
    ['', '', 'wood', XB3C, YB2S, XMBE, YB3, { noLabel: true, noAuto: true }],
    ['Bedroom #2', "15'-8\" x 15'-1\"", 'wood', X0, YH, XB2, YB2S, { noAuto: true }],
    ['Bath', '', 'tile', XBW, YB2S, XBS, YBTH, { noAuto: true }],
    ['Bath', '', 'tile', XBS, YB2S, XB3, YBTH, { noAuto: true }],
    ['Closet', '', 'wood', XB3, YB2S, XB3C, YB3, { minor: true, noAuto: true }],
    ['Bedroom #3', "15'-1\" x 15'-8\"", 'wood', XB3, YB3, XB3E, YB3S, { noAuto: true }],
    ['Bedroom #4', "12'-0\" x 12'-3\"", 'wood', XMBE, YB4, XB4, YB3, { noAuto: true }],
    // core
    ['Great Room', "22'-0\" x 23'-1\"", 'wood', XGR, YGRN, XGRE, YGRS, { vaulted: true, noAuto: true, labelAt: [65, 18] }],
    ['Entry', '', 'wood', XB4, YGRS, XGRE, YFR, { vaulted: true, noAuto: true, labelAt: [CXP, 42.5] }],
    ['Kitchen', "20'-6\" x 15'-0\"", 'wood', XGRE, YDK, XK, YGRS, { vaulted: true, noAuto: true, labelAt: [82, 35.6] }],
    ['', '', 'wood', XGRE, YGRN, XDN, YDK, { noLabel: true, vaulted: true, noAuto: true }],
    ['Dining', "13'-1\" x 16'-9\"", 'wood', XDN, YDNN, XK, YDK, { noAuto: true, labelAt: [90.8, 8.5] }],
    ['Sun Room', "17'-8\" x 14'-6\"", 'wood', XK, YSUN, XSUN, YGN, { vaulted: true, noAuto: true, labelAt: [104, 15] }],
    ['1/2 Bath', '', 'tile', XGRE, YGRS, XPD, YFR, { minor: true, noAuto: true }],
    ['', '', 'wood', XPD, YGRS, XPN, YFR, { noLabel: true, noAuto: true }],
    ['Pantry', "9'-9\" x 7'-0\"", 'wood', XPN, YGRS, XK, YPAN, { noAuto: true }],
    ['', '', 'tile', XPN, YPAN, XK, YFR, { noLabel: true, noAuto: true }],
    ['Mud Rm', '', 'tile', XSV, YFR, XK, YSV, { noAuto: true, labelAt: [86, 52] }],
    ['4-Car Garage', "27'-0\" x 51'-1\"", 'concrete', XK, YGN, XG, YGS, { noAuto: true, labelAt: [111, 52] }],
    // outdoor
    ['Covered Deck', '', 'porch', XGR, YDK0, XGRE, YGRN, { outside: true, noAuto: true, noPosts: true, labelAt: [65, 5] }],
    ['', '', 'porch', XMBE, YSD, XGR, YGRN, { outside: true, noLabel: true, noAuto: true, noPosts: true }],
    ['', '', 'porch', XGRE, YSD, XDN, YGRN, { outside: true, noLabel: true, noAuto: true, noPosts: true }],
    ['Deck', '', 'terrace', XMBE, 0.6, XGR, YSD, { outside: true, noAuto: true, noPosts: true }],
    ['Deck', '', 'terrace', XGRE, 1.3, XDN, YSD, { outside: true, noAuto: true, noPosts: true }],
    ['Front Porch', '', 'porch', XP0, YFR, XP1, YPF, { outside: true, noAuto: true, noPosts: true, labelAt: [CXP, 53] }],
    ['', '', 'porch', XB4, YFR, XP0, YPW, { outside: true, noLabel: true, noAuto: true, noPosts: true }],
    ['', '', 'porch', XP1, YFR, XSV, YPW, { outside: true, noLabel: true, noAuto: true, noPosts: true }],
  ],
  slabs: [
    [X0 - 0.4, YH - 0.4, XB2 + 0.4, YB2S + 0.4],
    [XMBA - 0.4, YMBA - 0.4, XMBE + 0.4, YH + 0.4],
    [XMB - 0.4, YMBN - 0.4, XMBE + 0.4, YMBA],
    [XBW - 0.4, YH, XMBE + 0.4, YBTH + 0.4],
    [XB3 - 0.4, YB3, XB3E + 0.4, YB3S + 0.4],
    [XMBE - 0.4, YGRN - 0.4, XK + 0.4, YB3 + 0.4],
    [XDN - 0.4, YDNN - 0.4, XK + 0.4, YGRN],
    [XK - 0.4, YSUN - 0.4, XSUN + 0.4, YGN + 0.4],
    [XSV - 0.4, YFR, XK + 0.4, YSV + 0.4],
    [XK - 0.4, YGN - 0.4, XG + 0.4, YGS + 0.4],
    [XP0, YFR, XP1, YPF + 0.4],
  ],
  ceilings: [
    [XMBA, YMBA, XMBE, YH, WH], [XMB, YMBN, XMBE, YMBA, WH],
    [X0, YH, XB2, YB2S, WH], [XBW, YH, XMBE, YBTH, WH], [XB3, YB3, XB3E, YB3S, WH],
    [XMBE, YGRN, XGR, YH, WH], [XMBE, YH, XB4, YB3, WH],
    [XDN, YDNN, XK, YDK, WH], [XGRE, YGRS, XK, YFR, WH], [XSV, YFR, XK, YSV, WH],
    [XK, YGN, XG, YGS, GH],
  ],
  roofs: [
    // master suite — east-west ridge, board gables both ends (east gable rises over the side deck)
    { x0: XMBA, y0: YMBN, x1: XMBE, y1: YH, along: 'x', pitch: 0.55, oh: 1, endOh: [1, 0.6], eave: WH, ends: ['ext', 'ext'] },
    // Bedroom #2 — west gable
    { x0: X0, y0: YH, x1: XB2, y1: YB2S, along: 'x', pitch: 0.55, oh: 1, endOh: [1, 0], eave: WH, ends: ['ext', 'ext'] },
    // bedroom hall + baths block
    { x0: XBW, y0: YH, x1: XMBE, y1: YBTH, along: 'x', pitch: 0.5, oh: [0, 1], endOh: [1, 0.3], eave: WH, ends: ['ext', 'ext'] },
    // Bedroom #3 — big front gable
    { x0: XB3, y0: YB3 - 4, x1: XB3E, y1: YB3S, along: 'y', pitch: 0.6, oh: 1, endOh: [0, 1.2], eave: WH, ends: ['ext', 'ext'] },
    // Bedroom #4 — small front gable
    { x0: XMBE, y0: YFR - 2, x1: XB4, y1: YB3, along: 'y', pitch: 0.6, oh: 0.8, endOh: [0, 1], eave: WH, ends: ['ext', 'ext'] },
    // main core: office → great room → kitchen (east-west ridge, vaulted inside)
    { x0: XMBE, y0: YGRN, x1: XK, y1: YFR, along: 'x', pitch: 0.55, oh: 1, endOh: [0, 0], eave: WH, ends: ['ext', 'ext'] },
    // dining — north gable
    { x0: XDN, y0: YDNN, x1: XK, y1: YDK + 4, along: 'y', pitch: 0.6, oh: 1, endOh: [1, 0], eave: WH, ends: ['ext', null] },
    // sun room — north gable (vaulted)
    { x0: XK, y0: YSUN, x1: XSUN, y1: YGN + 3, along: 'y', pitch: 0.6, oh: 1, endOh: [1, 0], eave: WH, ends: ['ext', null] },
    // 4-car garage — gables front (stone) and back
    { x0: XK, y0: YGN, x1: XG, y1: YGS, along: 'y', pitch: 0.5, oh: 1, endOh: [1, 1], eave: GH, ends: ['ext', 'ext'] },
    // mud wing — front gable right of the entry
    { x0: XSV, y0: YFR, x1: XK, y1: YSV, along: 'y', pitch: 0.6, oh: 1, endOh: [0, 1], eave: WH, ends: ['ext', 'ext'] },
    // front entry gable — open timber truss at the porch
    { x0: XP0, y0: YFR, x1: XP1, y1: YPF, along: 'y', pitch: PP, oh: 0.3, endOh: [0, 1.3], eave: WH, ends: ['ext', null] },
    // porch wings + rear covered deck (sheds with exposed rafters)
    { shed: true, x0: XB4, y0: YFR - 0.4, x1: XP0, y1: YPW, hi: 9.0, lo: 8.0, oh: 0.5 },
    { shed: true, x0: XP1, y0: YFR - 0.4, x1: XSV, y1: YPW, hi: 9.0, lo: 8.0, oh: 0.5 },
    { shed: true, x0: XGR, y0: YDK0, x1: XGRE, y1: YGRN + 0.4, hi: 7.7, lo: 9.25, oh: 0.6 },
    { shed: true, x0: XMBE, y0: YSD, x1: XGR, y1: YGRN + 0.4, hi: 8.4, lo: 9.25, oh: 0.4 },
    { shed: true, x0: XGRE, y0: YSD, x1: XDN, y1: YGRN + 0.4, hi: 8.4, lo: 9.25, oh: 0.4 },
  ],
  // Measured from the room rectangles (wall centre-lines): heated rooms 4,435 sf; garage 27'-0" x 51'-1";
  // porch = front porch + wings + covered deck + the two small open decks.
  areas: { heated: 4435, garage: 1380, porch: 995 },
  furnish(k) {
    const H = makeHelpers(k);
    const { blk, box, slope, slopeY, flush, panelX, roofP } = H;
    const TIMBER = '#9a6a3c', TIMBER_D = '#6e4524', BLACK = '#1b1c1e', CAP = '#a9a49a';
    const WOODSHELF = '#c7a27a';

    // ------------------------------------------------------------ front entry: timber truss on stone pillars
    const pillar = (x, y, top) => {
      blk(x - 0.9, y - 0.9, x + 0.9, y + 0.9, 0, 3.2, 'ledgestone', { keep: true, solid: true });
      box(CAP, x - 1.02, y - 1.02, x + 1.02, y + 1.02, 3.2, 3.45);
      blk(x - 0.45, y - 0.45, x + 0.45, y + 0.45, 3.45, top, TIMBER, { keep: true, solid: true });
    };
    const FY = YPF - 0.75, TIE = 8.6;
    for (const x of [XP0 + 0.75, XP1 - 0.75]) pillar(x, FY, TIE);
    box(TIMBER, XP0 - 0.3, FY - 0.4, XP1 + 0.3, FY + 0.4, TIE, WH);                       // tie beam
    for (const x of [XP0 + 0.75, XP1 - 0.75]) box(TIMBER, x - 0.35, YFR, x + 0.35, FY, TIE, WH); // eave beams
    const rz = porchZ(CXP);
    slope(TIMBER, FY, XP0 - 0.4, WH - 0.15, CXP, rz - 0.55, 0.8, 0.7);
    slope(TIMBER, FY, CXP, rz - 0.55, XP1 + 0.4, WH - 0.15, 0.8, 0.7);
    box(TIMBER, CXP - 0.35, FY - 0.33, CXP + 0.35, FY + 0.33, WH, rz - 0.85, true);         // king post
    slope(TIMBER, FY, CXP - 0.3, WH + 0.6, 61.6, porchZ(61.6) - 0.85, 0.5, 0.5);
    slope(TIMBER, FY, CXP + 0.3, WH + 0.6, 71.4, porchZ(71.4) - 0.85, 0.5, 0.5);
    slope(TIMBER, FY, XP0 + 1.2, 6.8, XP0 + 2.8, TIE, 0.45, 0.45, false);                 // knee braces
    slope(TIMBER, FY, XP1 - 1.2, 6.8, XP1 - 2.8, TIE, 0.45, 0.45, false);
    for (let y = YFR + 1.4; y < FY - 0.8; y += 2.0) {                                     // exposed rafters
      slope(TIMBER_D, y, XP0, WH - 0.45, CXP, rz - 0.45, 0.55, 0.26);
      slope(TIMBER_D, y, CXP, rz - 0.45, XP1, WH - 0.45, 0.55, 0.26);
    }
    box(TIMBER, CXP - 0.3, YFR, CXP + 0.3, FY + 0.9, rz - 1.2, rz - 0.35, true);           // ridge beam
    // wing porches: stone-based timber posts + beams + rafter tails
    const WY = YPW - 0.6;
    for (const x of [XB4 + 0.75, XSV - 0.7]) pillar(x, WY, 7.55);
    box(TIMBER, XB4, WY - 0.33, XP0 + 0.3, WY + 0.33, 7.55, 8.15);
    box(TIMBER, XP1 - 0.3, WY - 0.33, XSV, WY + 0.33, 7.55, 8.15);
    for (const [a, b] of [[XB4 + 0.6, XP0], [XP1 + 0.6, XSV]]) for (let x = a; x < b; x += 2) box(TIMBER_D, x - 0.12, YFR + 0.4, x + 0.12, YPW + 0.5, 7.75, 8.0, true);
    // entry gable wall above the doors: glass transom with black mullions (under the porch roof)
    box(BLACK, 63.6, YFR + 0.4, 69.4, YFR + 0.55, 8.5, 8.7);
    for (const x of [62.9, 70.1]) { box(BLACK, x - 0.22, YFR + 0.42, x + 0.22, YFR + 0.75, 6.0, 7.1); box('#f6e2a8', x - 0.14, YFR + 0.5, x + 0.14, YFR + 0.7, 6.15, 6.95); }

    // ------------------------------------------------------------ rear covered deck: timber posts, beam, rafters, rails
    const DY = YDK0 + 0.6;
    for (const x of [XGR + 0.6, 61.3, 68.7, XGRE - 0.6]) blk(x - 0.4, DY - 0.4, x + 0.4, DY + 0.4, 0, 7.0, TIMBER, { keep: true, solid: true });
    box(TIMBER, XGR - 0.3, DY - 0.4, XGRE + 0.3, DY + 0.4, 7.0, 7.62);
    for (const x of [XMBE + 0.5, XGR - 0.4]) blk(x - 0.35, YSD + 0.4 - 0.35, x + 0.35, YSD + 0.4 + 0.35, 0, 8.4, TIMBER, { keep: true, solid: true });
    for (const x of [XGRE + 0.4, XDN - 0.5]) blk(x - 0.35, YSD + 0.4 - 0.35, x + 0.35, YSD + 0.4 + 0.35, 0, 8.4, TIMBER, { keep: true, solid: true });
    box(TIMBER, XMBE, YSD + 0.1, XGR, YSD + 0.7, 8.0, 8.5);
    box(TIMBER, XGRE, YSD + 0.1, XDN, YSD + 0.7, 8.0, 8.5);
    // deck rails (black metal) around the open decks
    for (const [a, b, y] of [[XMBE, XGR, 0.6], [XGRE, XDN, 1.3]]) {
      box(BLACK, a, y - 0.06, b, y + 0.06, 3.0, 3.12);
      for (let x = a + 0.4; x < b; x += 0.45) box(BLACK, x - 0.03, y - 0.03, x + 0.03, y + 0.03, -0.3, 3.0);
    }
    for (let i = 0; i < 3; i++) blk(61.5, -1.5 - i * 1.2, 68.5, -0.3 - i * 1.2, -0.55, -0.55 - (i - 2.5) * 0.18, '#7a6a58'); // deck steps

    // ------------------------------------------------------------ chimneys (ledgestone, two)
    blk(50.6, FP_Y - 2.2, 53.6, FP_Y + 2.2, WH, coreZ(FP_Y) + 3.4, 'ledgestone', { ...roofP, chimney: [XGR + 0.3 + 3.55 / 2, FP_Y] });
    blk(50.45, FP_Y - 2.35, 53.75, FP_Y + 2.35, coreZ(FP_Y) + 3.4, coreZ(FP_Y) + 3.75, CAP, { ...roofP, chimney: [XGR + 0.3 + 3.55 / 2, FP_Y] });
    blk(51.4, FP_Y - 1.2, 52.8, FP_Y + 1.2, coreZ(FP_Y) + 3.75, coreZ(FP_Y) + 4.6, BLACK, { ...roofP, chimney: [XGR + 0.3 + 3.55 / 2, FP_Y] });
    const SC_Y = 21.5;
    blk(XSUN + 0.4, SC_Y - 2.3, XSUN + 3.4, SC_Y + 2.3, -0.5, 18.4, 'ledgestone', { keep: true, solid: true, chimney: [XSUN - 0.3 - 3.4 / 2, 21.5] });
    blk(XSUN + 0.25, SC_Y - 2.45, XSUN + 3.55, SC_Y + 2.45, 18.4, 18.75, CAP, { keep: true, chimney: [XSUN - 0.3 - 3.4 / 2, 21.5] });
    blk(XSUN + 1.2, SC_Y - 1.2, XSUN + 2.6, SC_Y + 1.2, 18.75, 19.6, BLACK, { keep: true, chimney: [XSUN - 0.3 - 3.4 / 2, 21.5] });

    // ------------------------------------------------------------ stone wainscot + garage front stone
    const skinY = (y, xa, xb, z0, z1, holes, col, out = 1) => {
      const cuts = holes.slice().sort((p, q) => p[0] - q[0]);
      let cur = xa; const y1 = y + 0.1 * out;
      for (const [s, e, b0, t0] of cuts) {
        if (s > cur) blk(cur, y, s, y1, z0, z1, col);
        if (b0 > z0) blk(s, y, e, y1, z0, b0, col);
        if (t0 < z1) blk(s, y, e, y1, t0, z1, col);
        cur = e;
      }
      if (cur < xb) blk(cur, y, xb, y1, z0, z1, col);
    };
    const skinX = (x, ya, yb, z0, z1, holes, col, out = 1) => {
      const cuts = holes.slice().sort((p, q) => p[0] - q[0]);
      let cur = ya; const x1 = x + 0.1 * out;
      for (const [s, e, b0, t0] of cuts) {
        if (s > cur) blk(x, cur, x1, s, z0, z1, col);
        if (b0 > z0) blk(x, s, x1, e, z0, b0, col);
        if (t0 < z1) blk(x, s, x1, e, t0, z1, col);
        cur = e;
      }
      if (cur < yb) blk(x, cur, x1, yb, z0, z1, col);
    };
    const wain = (y, xa, xb, holes = []) => { skinY(y, xa, xb, -0.4, 2.6, holes, 'ledgestone', 1); box(CAP, xa - 0.05, y, xb + 0.05, y + 0.22, 2.6, 2.75); };
    wain(YB3S + 0.41, XB3 - 0.4, XB3E + 0.4);
    wain(YB3 + 0.41, XB3E + 0.4, XB4 + 0.4);
    wain(YFR + 0.41, XB4 + 0.4, XSV - 0.4, [[64, 69, -1, 9], [60, 63.3, -1, 9], [69.7, 73, -1, 9]]);
    wain(YSV + 0.41, XSV - 0.4, XK);
    wain(YBTH + 0.41, XBW - 0.4, XB3);
    wain(YB2S + 0.41, X0 - 0.4, XBW);
    // garage front: stone to the window heads under a metal shed awning (as rendered)
    skinY(YGS + 0.41, XK - 0.4, XG + 0.4, -0.4, 8.2, [[104, 107, 3.5, 8], [109.6, 112.6, 3.5, 8], [115.2, 118.2, 3.5, 8]], 'ledgestone', 1);
    box(CAP, XK - 0.45, YGS + 0.4, XG + 0.45, YGS + 0.66, 8.2, 8.35);
    { const T = k.THREE; const g = new T.BoxGeometry(17.5, 0.18, 3.4); g.rotateX(0.32); g.translate(k.W(111.2), 9.05, k.Z(YGS + 2.0)); const m = k.block(0, 0, 0.05, 0.05, 0, 0.05, '#2b2d30', { keep: true }); if (m) { m.geometry.dispose(); m.geometry = g; } }
    for (const x of [102.6, 119.8]) slopeY(BLACK, x, YGS + 0.45, 7.6, YGS + 3.1, 8.6, 0.16, 0.16, false);
    const eastHoles = k.openingsOnX ? k.openingsOnX(XG) : [[31, 40, -1, 9], [42.5, 51.5, -1, 9], [54, 63, -1, 9], [65.5, 74.5, -1, 9]];
    skinX(XG + 0.41, YGN - 0.4, YGS + 0.4, -0.4, 2.6, eastHoles, 'ledgestone', 1);
    // overhead garage doors (charcoal, closed) — open interior bays, no stall walls, no cars
    // door leaves: engine overhead sectional doors (M.garageDoor); lights follow current door centers
    const eastDoors = k.garageDoorsOnX ? k.garageDoorsOnX(XG) : [{ cy: 35.5 }, { cy: 47 }, { cy: 58.5 }, { cy: 70 }];
    for (const g of eastDoors) {
      const y = g.cy;
      box(BLACK, XG + 0.42, y - 0.12, XG + 0.9, y + 0.12, 8.6, 8.72); box('#f6e2a8', XG + 0.75, y - 0.2, XG + 1.05, y + 0.2, 8.42, 8.6);
    }

    // ------------------------------------------------------------ black window frames (both faces)
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

    // ------------------------------------------------------------ site: drive to the side-load garage, walk, steps, beds
    k.plane(XG + 0.5, YGN - 4, XG + 34, YGS + 4, 'concrete');
    k.plane(XG + 18, YGS + 4, XG + 34, 140, 'concrete');
    k.plane(CXP - 3, YPF + 1.5, CXP + 3, 112, 'paver');
    k.plane(CXP + 3, 106, XG + 18, 112, 'paver');
    for (let i = 0; i < 2; i++) blk(XP0 + 1.8, YPF + i * 0.9, XP1 - 1.8, YPF + 1.8, -0.55, -0.27 - i * 0.14, '#a9a59c');
    for (const [a, b, y] of [[XB3E + 0.6, XB4 - 0.2, YB3 + 0.7], [XSV + 0.4, XK - 0.4, YSV + 0.7], [XB3 + 0.4, XB3E - 0.4, YB3S + 0.7]]) {
      blk(a, y, b, y + 2.0, -0.55, -0.42, '#3a2c20');
      for (let x = a + 1; x < b - 0.5; x += 3) blk(x - 0.55, y + 0.45, x + 0.55, y + 1.55, -0.45, 0.8, '#4d6b3c');
    }
    for (const [x, y] of [[XB4 + 1.6, YPW + 1.6], [XSV - 1.6, YPW + 1.6]]) blk(x - 0.45, y - 0.45, x + 0.45, y + 0.45, -0.45, 3.6, '#3f5a35'); // arborvitae

    // ------------------------------------------------------------ interior trim
    // close the interior walls up to the vault (fireplace wall + kitchen/sun-room wall), so the vault reads as one room
    const vaultOutline = (ya, yb) => [[ya, WH], [yb, WH], [yb, coreZ(yb) - 0.15], ...(ya < 29.75 && yb > 29.75 ? [[29.75, coreZ(29.75) - 0.15]] : []), [ya, coreZ(ya) - 0.15]];
    panelX(XGR, vaultOutline(YGRN + 0.1, YGRS + 0.3), '#efebe4', 0.6);
    panelX(XK, vaultOutline(YGRN + 0.1, YGRS + 0.3), '#efebe4', 0.6);
    // great-room vault: timber ties + ridge beam (the chandelier hangs from the ridge)
    for (const x of [59.5, 65, 70.5]) box(TIMBER, x - 0.3, 21.2, x + 0.3, 38.3, 12.3, 12.9, true);
    box(TIMBER, XGR + 0.3, 29.45, XK - 0.3, 30.05, coreZ(29.75) - 1.3, coreZ(29.75) - 0.35, true);
    // sun room: exposed ridge + ties
    box(TIMBER, 106.15, YSUN + 0.2, 106.75, YGN - 0.2, WH + 0.6 * 8.85 - 1.2, WH + 0.6 * 8.85 - 0.35, true);
    for (const y of [16.5, 23]) box(TIMBER, XK + 3.1, y - 0.25, XSUN - 3.1, y + 0.25, 10.6, 11.1, true);
    // stairs are placeable, removable items (Edit Plan → Stairs): DN to the basement from the hall, UP from the mud room to the bonus space
    k.place && k.place('stairStraight', { x: (XOF + XGR) / 2, y: (YLND + YH) / 2, rot: 0, w: XGR - XOF - 0.1, d: YH - YLND - 0.1, dir: 'down', variant: 'oak', rail: 'black' });
    k.place && k.place('stairStraight', { x: (93.6 + XK - 0.3) / 2, y: YSV - 0.4 - 11.1 / 2, rot: 0, w: XK - 0.3 - 93.6, d: 11.1, dir: 'up', level: true, levelH: 8.1, variant: 'oak', rail: 'black' });
    // kitchen uppers on the east wall + hood surround; open shelves
    blk(XK - 1.35, 24.0, XK - 0.25, 29.2, 4.7, 8.6, '#3f3f3d');
    blk(XK - 1.35, 32.6, XK - 0.25, 36.9, 4.7, 8.6, '#3f3f3d');
    blk(XK - 0.37, 24.0, XK - 0.25, 36.9, 3.1, 4.7, '#e9e5de'); // backsplash
    for (const [ya, yb] of [[24.0, 29.2], [32.6, 36.9]]) {             // upper door seams + brass pulls
      const n = Math.round((yb - ya) / 1.5);
      for (let i = 1; i < n; i++) { const y = ya + (i * (yb - ya)) / n; box('#2a2a29', XK - 1.4, y - 0.03, XK - 1.33, y + 0.03, 4.75, 8.55); box('#c9a35a', XK - 1.45, y - 0.15, XK - 1.38, y - 0.11, 5.0, 5.6); }
      box('#2a2a29', XK - 1.4, ya, XK - 1.33, yb, 7.55, 7.6);
    }
    // pantry + closets + W.I.C. shelving
    blk(XPN + 0.3, YGRS + 0.3, XK - 0.3, YGRS + 1.8, 0, 7.4, WOODSHELF);
    blk(XK - 1.8, YGRS + 1.8, XK - 0.3, YPAN - 0.3, 0, 7.4, WOODSHELF);
    blk(XMBA + 0.4, YWIC + 0.3, XSF - 0.3, YWIC + 1.8, 0, 7.2, WOODSHELF);
    blk(XMBA + 0.4, YH - 1.8, XSF - 0.3, YH - 0.3, 0, 7.2, WOODSHELF);
    blk(XMBE + 0.3, YOFS + 0.3, XOF - 0.3, YOFS + 1.6, 0, 7.2, WOODSHELF);
    blk(XB3 + 0.3, YB2S + 0.3, XB3C - 0.3, YB2S + 1.7, 0, 7.2, WOODSHELF);
    // safe room: steel shelving + a reinforced door frame look
    blk(XSF + 0.3, YH - 1.6, XSFE - 0.3, YH - 0.3, 0, 7.0, '#6b6f75');
    box('#3a3d42', 27.3, YSF - 0.3, 30.5, YSF + 0.3, 7.0, 7.4);
    // garage: storage cabinets + workbench on the west wall
    blk(XK + 0.3, 30, XK + 2.3, 44, 0, 7.4, '#5d6066');
    blk(XK + 0.3, 60, XK + 2.6, 66, 0, 3.1, '#6b5a46');
    blk(XK + 0.3, 60, XK + 1.4, 66, 4.5, 7.5, '#5d6066');

    flush();

    // ------------------------------------------------------------ furniture
    if (!k.place) return;
    const P = (t, o) => k.place(t, o);
    const KC = { carcass: '#3b3b3a', door: '#444442', top: '#eeebe5', metal: '#c9a35a' };
    // Great room — old-world limestone fireplace on the west wall (the red mark), plaster breast, no TV
    P('fpOldWorld72', { x: XGR + 0.3 + 3.55 / 2, y: FP_Y, rot: 270, h: coreZ(FP_Y - 3.3) - 0.1, variant: 'styled' }); // plaster breast rises into the vault
    P('rug', { x: 64.6, y: FP_Y, w: 12.5, d: 10, rot: 90, variant: 'jute', color: '#b9a37c', field: '#cdb994' });
    P('sectional', { x: 69.6, y: FP_Y + 0.3, rot: 90, w: 10.5, d: 6.4, finish: 'boucle', variant: 'track-arm', chaise: 'right', wood: 'walnut', pillow: '#b9ae9f' });
    P('coffeeTable', { x: 64.4, y: FP_Y, rot: 90, variant: 'organic', w: 4.8, d: 2.7, wood: 'walnut' });
    P('accentChair', { x: 62.4, y: 19.6, rot: 330, variant: 'lounge', finish: 'cognac' });
    P('accentChair', { x: 62.4, y: 31.8, rot: 210, variant: 'wing', finish: 'boucle', wood: 'walnut' });
    P('sideTable', { x: 64.6, y: 32.6, wood: 'walnut' });
    P('tableLamp', { x: 64.6, y: 32.6, z: 2.1 });
    P('pendant', { x: 65, y: FP_Y, variant: 'sputnik', metal: '#b08a4a', ceil: 12.3 });
    P('curtains', { x: 58.0, y: YGRN + 0.75, rot: 0, w: 5.6, h: 7.4, d: 0.5, color: '#f1ede6' });
    P('curtains', { x: 73.9, y: YGRN + 0.75, rot: 0, w: 3.6, h: 7.4, d: 0.5, color: '#f1ede6' });
    P('plant', { x: 74.6, y: 16.0, variant: 'olive' });
    // Entry
    P('rug', { x: CXP, y: 41.6, w: 7, d: 5, rot: 90, variant: 'jute', color: '#b9a37c', field: '#cdb994' });
    P('bench', { x: 55.0, y: 43.7, rot: 0, finish: 'cognac' });
    P('plant', { x: 52.6, y: 43.8, variant: 'fiddle', w: 1.6, d: 1.6 });
    P('cabinet', { x: 72.3, y: YFR - 0.75, w: 5, rot: 180, carcass: '#3b3b3a', door: '#444442', metal: '#c9a35a' });
    // Kitchen — charcoal shaker perimeter, fluted walnut island, rattan pendants
    P('counter', { x: XK - 1.2, y: 27.4, w: 4.4, d: 2, rot: 90, ...KC });
    P('range', { x: XK - 1.3, y: 30.9, rot: 90 });
    P('counter', { x: XK - 1.2, y: 33.8, w: 3.2, d: 2, rot: 90, ...KC });
    P('counter', { x: 94.3, y: YGRS - 1.2, w: 6.6, d: 2, rot: 180, ...KC });
    P('fridge', { x: XK - 1.4, y: 23.6, rot: 90, color: '#c9ccd0' });
    P('counterItems', { x: XK - 1.2, y: 34.4, rot: 90 });
    P('island', { x: 89.0, y: 29.3, w: 7.6, d: 4, rot: 90, variant: 'fluted-waterfall', carcass: '#3a2c22', door: '#4a382b', top: '#eeebe5' });
    P('sink', { x: 89.6, y: 29.3, rot: 90 });
    for (const y of [26.5, 28.4, 30.3, 32.2]) P('barstool', { x: 86.1, y, rot: 270, finish: 'cream', wood: 'espresso' });
    for (const y of [27.4, 31.2]) P('pendant', { x: 89.0, y, rot: 90, variant: 'rattan', w: 2.8, metal: '#c9a35a', ceil: coreZ(y) - 0.2 });
    // breakfast nook (the curved banquette on the plan)
    P('diningTable', { x: 79.6, y: 25.6, w: 4.2, d: 4.2, variant: 'round', wood: 'walnut' });
    for (const [dx, dy, r] of [[0, -2.4, 0], [0, 2.4, 180], [2.4, 0, 90], [-2.4, 0, 270]]) P('diningChair', { x: 79.6 + dx, y: 25.6 + dy, rot: r, finish: 'cognac', wood: 'espresso' });
    P('pendant', { x: 79.6, y: 25.6, variant: 'globe', metal: '#b8913f', ceil: coreZ(25.6) - 0.2 });
    // Dining
    P('rug', { x: 90.8, y: 13.6, w: 8.5, d: 11, color: '#cfc7ba', field: '#e4ded3' });
    P('diningTable', { x: 90.8, y: 13.6, w: 7.5, d: 3.6, rot: 90, variant: 'turned', wood: 'walnut' });
    for (const y of [11.1, 13.6, 16.1]) { P('diningChair', { x: 88.4, y, rot: 270, finish: 'cream', wood: 'espresso' }); P('diningChair', { x: 93.2, y, rot: 90, finish: 'cream', wood: 'espresso' }); }
    P('diningChair', { x: 90.8, y: 9.1, rot: 0, finish: 'cream', wood: 'espresso' });
    P('diningChair', { x: 90.8, y: 18.1, rot: 180, finish: 'cream', wood: 'espresso' });
    P('pendant', { x: 90.8, y: 13.6, rot: 90, variant: 'linear', w: 4.2, metal: '#b8913f' });
    P('cabinet', { x: XDN + 0.75, y: 18.6, w: 5, rot: 270, carcass: '#3b3b3a', door: '#444442', metal: '#c9a35a' });
    // Sun room — smaller old-world limestone fireplace on the east wall
    P('fpOldWorld60', { x: XSUN - 0.3 - 3.4 / 2, y: 21.5, rot: 90, h: WH, variant: 'styled' });
    P('rug', { x: 106.2, y: 21.0, w: 10, d: 8, rot: 90, variant: 'jute', color: '#b9a37c', field: '#cdb994' });
    P('sofa', { x: 102.6, y: 21.0, rot: 270, finish: 'linen', variant: 'track-arm', w: 7.8, wood: 'walnut' });
    P('coffeeTable', { x: 105.6, y: 21.0, rot: 90, variant: 'wood', wood: 'walnut' });
    P('accentChair', { x: 108.2, y: 15.8, rot: 300, variant: 'wing', finish: 'cognac', wood: 'walnut' });
    P('plant', { x: 99.4, y: 14.4, variant: 'olive' });
    P('plant', { x: 113.6, y: 14.4, variant: 'fiddle' });
    P('pendant', { x: 106.4, y: 23, variant: 'rattan', w: 2.4, metal: '#c9a35a', ceil: 10.6 });
    // Master suite
    P('bed', { x: XMB + 0.25 + 3.5, y: 18.6, rot: 270, w: 6.4, d: 7.0, variant: 'upholstered', finish: 'greige' });
    P('nightstand', { x: XMB + 0.95, y: 14.6, rot: 270 });
    P('nightstand', { x: XMB + 0.95, y: 22.6, rot: 270 });
    for (const y of [14.6, 22.6]) P('pendant', { x: XMB + 0.95, y, variant: 'globe', metal: '#b8913f' });
    P('bench', { x: 30.6, y: 18.6, rot: 90, finish: 'cognac' });
    P('rug', { x: 28.4, y: 18.6, w: 10, d: 8, rot: 90 });
    P('dresser', { x: XMBE - 1.05, y: 21.0, rot: 90, w: 5 });
    P('accentChair', { x: 25.4, y: 25.2, rot: 30, variant: 'wing', finish: 'boucle', wood: 'walnut' });
    P('curtains', { x: 30.7, y: YMBN + 0.75, rot: 0, w: 12.4, h: 8.2, color: '#f1ede6' });
    P('vanity', { x: 9.5, y: YWIC - 1.0, rot: 180, w: 6 });
    P('tub', { x: 12.0, y: YMBA + 1.9, rot: 0 });
    P('toilet', { x: XMBA + 1.4, y: 24.6, rot: 270 });
    P('shower', { x: XMB - 2.9, y: YMBA + 2.8, w: 5.4, d: 5.2, rot: 0 });
    P('bench', { x: 15.0, y: 32.9, rot: 0, finish: 'greige' });
    // Office
    P('desk', { x: 44.5, y: YGRN + 0.3 + 1.25, rot: 0, variant: 'pedestal', w: 5.5 });
    P('deskChair', { x: 44.5, y: 18.2, rot: 180, finish: 'cognac' });
    P('monitor', { x: 44.5, y: YGRN + 1.0, rot: 0 });
    P('deskLamp', { x: 46.6, y: YGRN + 1.0, rot: 0 });
    P('bookshelf', { x: XMBE + 0.8, y: 20.0, rot: 270 });
    P('bookshelf', { x: XMBE + 0.8, y: 23.3, rot: 270 });
    P('rug', { x: 44.5, y: 19.4, w: 8, d: 6 });
    // Laundry
    P('washerDryer', { x: XMBE + 1.4, y: 30.0, rot: 270 });
    P('washerDryer', { x: XMBE + 1.4, y: 32.4, rot: 270 });
    P('counter', { x: XOF - 1.2, y: 32.5, w: 5.4, d: 2, rot: 90, ...KC });
    // Bedroom #2
    P('bed', { x: X0 + 0.25 + 3.4, y: 44.6, rot: 270, w: 5.3, d: 6.8, variant: 'panel', finish: 'sage' });
    P('nightstand', { x: X0 + 0.95, y: 41.1, rot: 270 });
    P('nightstand', { x: X0 + 0.95, y: 48.1, rot: 270 });
    P('dresser', { x: XB2 - 1.05, y: 47.8, rot: 90, w: 4.4 });
    P('rug', { x: 7.4, y: 44.6, w: 7, d: 5, rot: 90 });
    // Bedroom #3
    P('bed', { x: 33.0, y: YB3S - 0.25 - 3.4, rot: 180, w: 5.3, d: 6.8, variant: 'upholstered', finish: 'linen' });
    P('nightstand', { x: 29.5, y: YB3S - 0.95, rot: 180 });
    P('nightstand', { x: 36.5, y: YB3S - 0.95, rot: 180 });
    P('dresser', { x: XB3 + 1.05, y: 59.0, rot: 270, w: 4.4 });
    P('rug', { x: 33.0, y: 64.0, w: 8, d: 6 });
    // Bedroom #4
    P('bed', { x: 45.0, y: YB3 - 0.25 - 3.4, rot: 180, w: 5.3, d: 6.8, variant: 'panel', finish: 'linen' });
    P('nightstand', { x: 41.6, y: YB3 - 0.95, rot: 180 });
    P('nightstand', { x: 48.4, y: YB3 - 0.95, rot: 180 });
    P('rug', { x: 45.0, y: 50.0, w: 7, d: 5 });
    // shared baths + powder + mud
    P('tub', { x: XBW + 1.45, y: 59.6, rot: 270, w: 5.4 });
    P('toilet', { x: XBW + 1.2, y: 54.4, rot: 270 });
    P('vanity', { x: XBS - 1.0, y: 57.6, rot: 90, w: 4.4 });
    P('vanity', { x: XBS + 1.0, y: 57.6, rot: 270, w: 4.4 });
    P('toilet', { x: XB3 - 1.2, y: 54.4, rot: 90 });
    P('shower', { x: XB3 - 2.5, y: YBTH - 2.4, w: 4.6, d: 4.4, rot: 180 });
    P('toilet', { x: 81.0, y: YGRS + 1.4, rot: 0 });
    P('vanity', { x: XPD - 1.0, y: 42.6, rot: 90, w: 2.8 });
    P('mudBench', { x: XSV + 0.95, y: 47.6, rot: 270, w: 3.6 });
    P('mudBench', { x: 86.6, y: YSV - 0.95, rot: 180, w: 5.0 });
    // Hall
    P('rug', { x: 28.0, y: 39.9, w: 12, d: 3.6, variant: 'jute', color: '#b9a37c', field: '#cdb994' });
    P('bench', { x: 33.5, y: 47.6, rot: 270, finish: 'cognac' });
    // Covered deck + decks + front porch
    P('outdoorSofa', { x: 65.0, y: 7.4, rot: 180, finish: 'charcoal' });
    P('coffeeTable', { x: 65.0, y: 4.6, rot: 0, w: 3.6, d: 1.9, wood: 'espresso' });
    P('outdoorLounge', { x: 59.5, y: 6.8, rot: 150 });
    P('outdoorLounge', { x: 70.6, y: 6.8, rot: 210 });
    P('outdoorDining', { x: 46.6, y: 10.4, rot: 0, wood: 'teak' });
    P('firepit', { x: 46.6, y: 3.3 });
    P('outdoorLounge', { x: 80.0, y: 3.8, rot: 180 });
    P('outdoorSofa', { x: 54.8, y: 51.6, rot: 90, finish: 'charcoal' });
    P('accentChair', { x: 77.0, y: 50.0, rot: 270, variant: 'spindle', finish: 'cognac', wood: 'walnut' });
    P('plant', { x: XP0 + 2.3, y: YFR + 1.4, variant: 'olive', w: 1.6, d: 1.6 });
    P('plant', { x: XP1 - 2.3, y: YFR + 1.4, variant: 'olive', w: 1.6, d: 1.6 });
  },
};
