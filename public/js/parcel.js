// Parse a US parcel outline from GeoJSON, KML, or lat/long corners into
// local plan feet (x east, y south) around the parcel centroid.
export const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
  ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
  ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
  ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
  ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

export function parcelSearchTip(stateName, countyName) {
  const county = (countyName || '').trim() || 'your county';
  const state = (stateName || '').trim() || 'state';
  return `search "${county} ${state} GIS parcel viewer"`;
}

const FT_PER_DEG_LAT = 364000; // ~111.3 km, good enough for a single lot

function closeRing(ring) {
  if (ring.length < 3) return ring;
  const a = ring[0], b = ring[ring.length - 1];
  if (a[0] !== b[0] || a[1] !== b[1]) return ring.concat([a.slice()]);
  return ring;
}

function extractGeoRings(geom) {
  if (!geom || typeof geom !== 'object') return [];
  const t = geom.type;
  if (t === 'Polygon') return (geom.coordinates || []).slice();
  if (t === 'MultiPolygon') return (geom.coordinates || []).flat();
  if (t === 'LineString') return [geom.coordinates || []];
  if (t === 'MultiLineString') return geom.coordinates || [];
  if (t === 'GeometryCollection') return (geom.geometries || []).flatMap(extractGeoRings);
  return [];
}

function geojsonRings(obj) {
  if (!obj || typeof obj !== 'object') return [];
  if (obj.type === 'FeatureCollection') return (obj.features || []).flatMap(geojsonRings);
  if (obj.type === 'Feature') return extractGeoRings(obj.geometry);
  return extractGeoRings(obj);
}

function looksGeographic(points) {
  return points.length > 0 && points.every(p => {
    const lon = p[0], lat = p[1];
    return Number.isFinite(lon) && Number.isFinite(lat) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  }) && points.every(p => Math.abs(p[1]) >= 14 && Math.abs(p[1]) <= 72 && p[0] <= -64 && p[0] >= -180);
}

function toPlanFeet(ringsLonLatOrXY) {
  const pts = ringsLonLatOrXY.flat();
  if (!pts.length) throw new Error('No coordinates found in that file.');
  const geographic = looksGeographic(pts);
  let anchorLat = null, anchorLon = null;
  let rings;
  if (geographic) {
    // GeoJSON / KML order is lon, lat
    const lat0 = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const lon0 = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    anchorLat = lat0; anchorLon = lon0;
    const cos = Math.cos(lat0 * Math.PI / 180);
    rings = ringsLonLatOrXY.map(ring => closeRing(ring.map(([lon, lat]) => [
      (lon - lon0) * FT_PER_DEG_LAT * cos, // east
      (lat0 - lat) * FT_PER_DEG_LAT,       // south
    ])));
  } else {
    // Already in a linear unit — treat as feet, Y north → plan Y south
    const x0 = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const y0 = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    rings = ringsLonLatOrXY.map(ring => closeRing(ring.map(([x, y]) => [x - x0, -(y - y0)])));
  }
  const cleaned = rings.map(r => r.filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]))).filter(r => r.length >= 4);
  if (!cleaned.length) throw new Error('That outline did not have enough points to draw a lot.');
  return { rings: cleaned, anchorLat, anchorLon };
}

function parseKmlRings(xml) {
  const rings = [];
  const re = /<(?:LinearRing|LineString)\b[^>]*>[\s\S]*?<coordinates[^>]*>([\s\S]*?)<\/coordinates>/gi;
  let m;
  while ((m = re.exec(xml))) {
    const ring = [];
    for (const chunk of m[1].trim().split(/[\s]+/)) {
      const parts = chunk.split(',').map(Number);
      if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) ring.push([parts[0], parts[1]]);
    }
    if (ring.length >= 3) rings.push(ring);
  }
  return rings;
}

function parseCornerLines(text) {
  const ring = [];
  for (const raw of String(text || '').split(/\n+/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const nums = line.split(/[,\s;]+/).map(s => s.trim()).filter(Boolean).map(Number);
    if (nums.length < 2 || !Number.isFinite(nums[0]) || !Number.isFinite(nums[1])) {
      throw new Error('Each corner should be "latitude, longitude" on its own line.');
    }
    let lat = nums[0], lon = nums[1];
    // If someone pasted lon, lat (first number is clearly a US longitude), swap.
    if (Math.abs(lat) > 90 && Math.abs(lon) <= 90) { const t = lat; lat = lon; lon = t; }
    ring.push([lon, lat]); // store as lon,lat to share the same projector
  }
  if (ring.length < 3) throw new Error('Enter at least three corners as latitude, longitude.');
  return [ring];
}

export function parseParcelText(text, filename = '') {
  const raw = String(text || '').trim();
  if (!raw) throw new Error('No parcel data to import.');
  const name = (filename || '').toLowerCase();
  const looksKml = name.endsWith('.kml') || /<kml[\s>]|<Polygon[\s>]/i.test(raw);
  const looksJson = name.endsWith('.geojson') || name.endsWith('.json') || raw.startsWith('{') || raw.startsWith('[');
  let rings;
  if (looksKml) {
    rings = parseKmlRings(raw);
    if (!rings.length) throw new Error('No polygon or line coordinates were found in that KML.');
  } else if (looksJson) {
    let obj;
    try { obj = JSON.parse(raw); } catch { throw new Error('That file is not valid GeoJSON.'); }
    rings = geojsonRings(obj);
    if (!rings.length) throw new Error('That GeoJSON did not contain a polygon or line for the lot.');
  } else {
    rings = parseCornerLines(raw);
  }
  const parsed = toPlanFeet(rings);
  const span = parsed.rings.reduce((m, ring) => {
    for (const [x, y] of ring) m = Math.max(m, Math.abs(x), Math.abs(y));
    return m;
  }, 0);
  if (span > 40000) throw new Error('That outline is larger than a typical lot. Check that the coordinates are for one parcel.');
  parsed.sourceName = (filename || '').split(/[/\\]/).pop().slice(0, 160);
  parsed.rot = 0; parsed.x = 0; parsed.y = 0;
  return parsed;
}

export async function parseParcelFile(file) {
  const text = await file.text();
  return parseParcelText(text, file.name || '');
}

// ---------- geometry, survey entry, footprint, setbacks ----------

export function openRing(ring) {
  if (!ring || !ring.length) return [];
  const p = ring.map(pt => [Number(pt[0]), Number(pt[1])]).filter(pt => Number.isFinite(pt[0]) && Number.isFinite(pt[1]));
  if (p.length >= 2) {
    const a = p[0], b = p[p.length - 1];
    if (a[0] === b[0] && a[1] === b[1]) p.pop();
  }
  return p;
}

export function ringArea(ring) {
  const p = openRing(ring);
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

export function pointInRing(x, y, ring) {
  const p = openRing(ring);
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi) inside = !inside;
  }
  return inside;
}

export function pointInLot(x, y, rings) {
  if (!rings?.length) return false;
  if (!pointInRing(x, y, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) if (pointInRing(x, y, rings[i])) return false;
  return true;
}

export function worldRings(parcel) {
  if (!parcel?.rings?.length) return [];
  const rot = ((parcel.rot || 0) * Math.PI) / 180;
  const ox = parcel.x || 0, oy = parcel.y || 0;
  const c = Math.cos(rot), si = Math.sin(rot);
  const xf = (x, y) => [ox + x * c - y * si, oy + x * si + y * c];
  return parcel.rings.map(ring => ring.map(([x, y]) => xf(x, y)));
}

export function lotAreaSqFt(rings) {
  if (!rings?.length) return 0;
  let a = Math.abs(ringArea(rings[0]));
  for (let i = 1; i < rings.length; i++) a -= Math.abs(ringArea(rings[i]));
  return Math.max(0, a);
}

export function formatLotArea(sqft) {
  const sf = Math.round(sqft || 0);
  const acres = (sqft || 0) / 43560;
  const acreStr = acres >= 0.1 ? acres.toFixed(2) : acres.toFixed(3);
  const acreWord = Math.abs(acres - 1) < 0.0005 ? 'acre' : 'acres';
  return `${sf.toLocaleString('en-US')} sf (${acreStr} ${acreWord})`;
}

export function coveragePct(footSf, lotSf) {
  if (!lotSf || lotSf <= 0) return null;
  return (footSf / lotSf) * 100;
}

export const FRONT_VEC = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };

function lineIntersect(a, b, c, d) {
  const rx = b[0] - a[0], ry = b[1] - a[1];
  const sx = d[0] - c[0], sy = d[1] - c[1];
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-12) return null;
  const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den;
  return [a[0] + t * rx, a[1] + t * ry];
}

export function insetRing(ring, offsetForEdge) {
  const p = openRing(ring);
  const n = p.length;
  if (n < 3) return closeRing(p);
  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = p[i], b = p[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const off = Math.max(0, Number(offsetForEdge(a, b, i)) || 0);
    const n1x = -dy / len, n1y = dx / len;
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const inward = pointInRing(mx + n1x * Math.min(0.2, len / 4), my + n1y * Math.min(0.2, len / 4), p);
    const nx = inward ? n1x : -n1x, ny = inward ? n1y : -n1y;
    lines.push({
      a: [a[0] + nx * off, a[1] + ny * off],
      b: [b[0] + nx * off, b[1] + ny * off],
    });
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    const l0 = lines[(i + n - 1) % n], l1 = lines[i];
    out.push(lineIntersect(l0.a, l0.b, l1.a, l1.b) || l1.a);
  }
  return closeRing(out);
}

export function buildableRings(rings, { front = 's', setbackF = 0, setbackS = 0, setbackR = 0 } = {}) {
  const fv = FRONT_VEC[front] || FRONT_VEC.s;
  const cos45 = Math.cos(Math.PI / 4);
  return (rings || []).map((ring) => insetRing(ring, (a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const n1x = -dy / len, n1y = dx / len;
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const inward = pointInRing(mx + n1x * Math.min(0.2, len / 4), my + n1y * Math.min(0.2, len / 4), ring);
    const ox = inward ? -n1x : n1x, oy = inward ? -n1y : n1y;
    const dot = ox * fv[0] + oy * fv[1];
    if (dot >= cos45) return setbackF;
    if (dot <= -cos45) return setbackR;
    return setbackS;
  }));
}

export function xfHouse(lx, lz, houseX = 0, houseY = 0, houseYaw = 0) {
  const t = (-houseYaw * Math.PI) / 180;
  const c = Math.cos(t), s = Math.sin(t);
  return [houseX + lx * c + lz * s, houseY + -lx * s + lz * c];
}

export function houseFromWorld(wx, wz, houseX = 0, houseY = 0, houseYaw = 0) {
  const t = (-houseYaw * Math.PI) / 180;
  const c = Math.cos(t), s = Math.sin(t);
  const dx = wx - houseX, dz = wz - houseY;
  return [dx * c - dz * s, dx * s + dz * c];
}

export function modelBounds(model) {
  const rooms = model?.rooms || [];
  if (!rooms.length) return { cx: 0, cz: 0, bw: 0, bh: 0 };
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of rooms) {
    if (r[3] == null || r[6] == null) continue;
    x0 = Math.min(x0, r[3], r[5]); y0 = Math.min(y0, r[4], r[6]);
    x1 = Math.max(x1, r[3], r[5]); y1 = Math.max(y1, r[4], r[6]);
  }
  if (!Number.isFinite(x0)) return { cx: 0, cz: 0, bw: 0, bh: 0 };
  return { cx: (x0 + x1) / 2, cz: (y0 + y1) / 2, bw: x1 - x0, bh: y1 - y0 };
}

export function footprintRects(model) {
  const rooms = model?.rooms || [];
  return rooms.filter(r => r[3] != null && r[6] != null && !r[7]?.outside).map(r => [r[3], r[4], r[5], r[6]]);
}

export function footprintArea(rects) {
  return (rects || []).reduce((s, [x0, y0, x1, y1]) => s + Math.abs((x1 - x0) * (y1 - y0)), 0);
}

export function coverageFootprintSf(model) {
  if (model?.areas && typeof model.areas.heated === 'number') {
    return (model.areas.heated || 0) + (model.areas.garage || 0);
  }
  let sf = 0;
  for (const r of (model?.rooms || [])) {
    const [name, , type, a, b, c, d, o = {}] = r;
    if (a == null || d == null) continue;
    if (o.outside || type === 'porch' || type === 'terrace') continue;
    sf += Math.abs((c - a) * (d - b));
  }
  return sf;
}

export function rectWorldPoly(rect, cx, cz, houseX, houseY, houseYaw) {
  const [x0, y0, x1, y1] = rect;
  return [
    xfHouse(x0 - cx, y0 - cz, houseX, houseY, houseYaw),
    xfHouse(x1 - cx, y0 - cz, houseX, houseY, houseYaw),
    xfHouse(x1 - cx, y1 - cz, houseX, houseY, houseYaw),
    xfHouse(x0 - cx, y1 - cz, houseX, houseY, houseYaw),
  ];
}

function samplePoly(poly) {
  const p = openRing(poly);
  const out = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    out.push(a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  }
  return out;
}

export function classifyPlacement(footprintPolys, lotRings, setbackRings, hasSetbacks) {
  const out = { overLot: false, overSetback: false, ok: true };
  if (!lotRings?.length) return out;
  for (const poly of footprintPolys || []) {
    for (const [x, y] of samplePoly(poly)) {
      if (!pointInLot(x, y, lotRings)) out.overLot = true;
      if (hasSetbacks && setbackRings?.length && !pointInLot(x, y, setbackRings)) out.overSetback = true;
    }
  }
  out.ok = !out.overLot && !out.overSetback;
  return out;
}

export function warningText(cls) {
  if (cls.overLot && cls.overSetback) return 'The house crosses a setback and the lot line.';
  if (cls.overLot) return 'The house crosses a lot line.';
  if (cls.overSetback) return 'The house crosses a setback.';
  return '';
}

export function parcelDefaults(p) {
  if (!p || !Array.isArray(p.rings)) return null;
  const front = String(p.front || 's').toLowerCase();
  return {
    rings: p.rings,
    rot: Number(p.rot) || 0,
    x: Number(p.x) || 0,
    y: Number(p.y) || 0,
    anchorLat: Number.isFinite(Number(p.anchorLat)) ? Number(p.anchorLat) : null,
    anchorLon: Number.isFinite(Number(p.anchorLon)) ? Number(p.anchorLon) : null,
    sourceName: p.sourceName || '',
    houseX: Number(p.houseX) || 0,
    houseY: Number(p.houseY) || 0,
    houseYaw: Number(p.houseYaw) || 0,
    setbackF: Math.max(0, Number(p.setbackF) || 0),
    setbackS: Math.max(0, Number(p.setbackS) || 0),
    setbackR: Math.max(0, Number(p.setbackR) || 0),
    front: /^[nesw]$/.test(front) ? front : 's',
  };
}

function centerRings(rings) {
  const pts = rings.flat();
  if (!pts.length) return rings;
  const x0 = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const y0 = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return rings.map(ring => closeRing(ring.map(([x, y]) => [x - x0, y - y0])));
}

function wrapSurvey(rings, sourceName) {
  const cleaned = rings.map(r => r.filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]))).filter(r => r.length >= 4);
  if (!cleaned.length) throw new Error('That survey did not close enough points to draw a lot.');
  const span = cleaned.reduce((m, ring) => {
    for (const [x, y] of ring) m = Math.max(m, Math.abs(x), Math.abs(y));
    return m;
  }, 0);
  if (span > 40000) throw new Error('That outline is larger than a typical lot. Check the distances in the survey.');
  return { rings: cleaned, rot: 0, x: 0, y: 0, anchorLat: null, anchorLon: null, sourceName };
}

function dmsToDeg(d, m, s) {
  return (Number(d) || 0) + (Number(m) || 0) / 60 + (Number(s) || 0) / 3600;
}

function azimuthFromBearing(ns, deg, ew) {
  const n = String(ns)[0].toUpperCase();
  const e = String(ew)[0].toUpperCase();
  if (n === 'N' && e === 'E') return deg;
  if (n === 'N' && e === 'W') return (360 - deg) % 360;
  if (n === 'S' && e === 'E') return 180 - deg;
  if (n === 'S' && e === 'W') return 180 + deg;
  return deg;
}

function azimuthFromCardinal(dir) {
  return { north: 0, south: 180, east: 90, west: 270 }[String(dir).toLowerCase()];
}

function walkAz(x, y, azDeg, dist) {
  const az = (azDeg * Math.PI) / 180;
  return [x + dist * Math.sin(az), y - dist * Math.cos(az)];
}

const CALL_RE = /(?:thence|then)?\s*(?:due\s+(north|south|east|west)|(n|s|north|south)\s*(\d+(?:\.\d+)?)(?:\s*[°d])?(?:\s*[-]?\s*(\d+(?:\.\d+)?)(?:\s*['′m])?(?:\s*[-]?\s*(\d+(?:\.\d+)?)(?:\s*["″s])?)?)?\s*(e|w|east|west))\s+(\d+(?:\.\d+)?)\s*(?:ft|feet|')?/gi;

export function looksLikeBearings(text) {
  const t = String(text || '');
  CALL_RE.lastIndex = 0;
  return CALL_RE.test(t);
}

export function parseBearingCalls(text) {
  const src = String(text || '').replace(/#.*$/gm, '');
  const calls = [];
  CALL_RE.lastIndex = 0;
  let m;
  while ((m = CALL_RE.exec(src))) {
    let az, dist = Number(m[7]);
    if (m[1]) {
      az = azimuthFromCardinal(m[1]);
    } else {
      az = azimuthFromBearing(m[2], dmsToDeg(m[3], m[4], m[5]), m[6]);
    }
    if (!Number.isFinite(az) || !Number.isFinite(dist) || dist <= 0) continue;
    calls.push({ az, dist });
  }
  if (calls.length < 3) throw new Error('Enter at least three bearing and distance calls, like N 45° E 150 or Due North 80.');
  let x = 0, y = 0;
  const ring = [[0, 0]];
  for (const c of calls) {
    [x, y] = walkAz(x, y, c.az, c.dist);
    ring.push([x, y]);
  }
  return centerRings([closeRing(ring)]);
}

function headingFromStart(text) {
  const due = text.match(/start(?:ing)?(?:\s+heading)?\s*(?:due\s+)?(north|south|east|west)\b/i);
  if (due) return azimuthFromCardinal(due[1]);
  const br = text.match(/start(?:ing)?(?:\s+heading)?\s*([NS])\s*(\d+(?:\.\d+)?)\s*([EW])/i);
  if (br) return azimuthFromBearing(br[1], Number(br[2]), br[3]);
  return 90; // due east
}

export function looksLikeSides(text) {
  const lines = String(text || '').split(/\n+/).map(l => l.trim()).filter(l => l && !l.startsWith('#') && !/^start/i.test(l));
  const numeric = lines.filter(l => (l.match(/-?\d+(?:\.\d+)?/g) || []).length >= 1);
  return numeric.length >= 3;
}

export function parseSidesAndAngles(text) {
  const src = String(text || '').replace(/#.*$/gm, '');
  let heading = headingFromStart(src);
  const pairs = [];
  for (const raw of src.split(/\n+/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || /^start/i.test(line)) continue;
    const nums = line.match(/-?\d+(?:\.\d+)?/g);
    if (!nums || !nums.length) continue;
    const len = Number(nums[0]);
    if (!Number.isFinite(len) || len <= 0) continue;
    const ang = nums.length >= 2 ? Number(nums[1]) : 90;
    if (!Number.isFinite(ang)) continue;
    pairs.push([len, ang]);
  }
  if (pairs.length < 3) throw new Error('Enter at least three sides as “length, interior angle”, e.g. 150, 90.');
  let x = 0, y = 0;
  const ring = [[0, 0]];
  for (let i = 0; i < pairs.length; i++) {
    const [len, ang] = pairs[i];
    const az = (heading * Math.PI) / 180;
    x += len * Math.sin(az);
    y += -len * Math.cos(az);
    ring.push([x, y]);
    heading += 180 - ang; // interior angle, walking counterclockwise
  }
  return centerRings([closeRing(ring)]);
}

export function parseSurveyText(text) {
  const raw = String(text || '').trim();
  if (!raw) throw new Error('Enter survey calls or side lengths and angles.');
  if (looksLikeBearings(raw)) return wrapSurvey(parseBearingCalls(raw), 'survey');
  if (looksLikeSides(raw)) return wrapSurvey(parseSidesAndAngles(raw), 'sides');
  throw new Error('Could not read that as bearing/distance calls or as side lengths and angles.');
}

export function lotStats(parcel, model, bounds) {
  const p = parcelDefaults(parcel);
  if (!p) return { area: 0, acres: 0, coverage: null, warning: '', world: [], buildable: [], footprint: [], hasSetbacks: false };
  const world = worldRings(p);
  const area = lotAreaSqFt(world);
  const hasSetbacks = (p.setbackF > 0 || p.setbackS > 0 || p.setbackR > 0);
  const buildable = hasSetbacks ? buildableRings(world, p) : world;
  const b = bounds || modelBounds(model);
  const rects = (model && footprintRects(model).length) ? footprintRects(model)
    : (b.bw && b.bh ? [[b.cx - b.bw / 2, b.cz - b.bh / 2, b.cx + b.bw / 2, b.cz + b.bh / 2]] : []);
  const polys = rects.map(r => rectWorldPoly(r, b.cx, b.cz, p.houseX, p.houseY, p.houseYaw));
  const footSf = (model && coverageFootprintSf(model)) || footprintArea(rects);
  const cov = coveragePct(footSf, area);
  const cls = classifyPlacement(polys, world, buildable, hasSetbacks);
  return {
    area, acres: area / 43560, coverage: cov, footSf,
    warning: warningText(cls), cls,
    world, buildable, footprint: polys, hasSetbacks, parcel: p, bounds: b,
  };
}
