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
