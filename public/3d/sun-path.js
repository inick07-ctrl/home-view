// PeakStead Designs — solar position, house facing, and sun-path helpers.
// Coordinates: model -Z is the default (south-facing house) north, +X is east.
// "House faces" rotates the sun/sky (and compass), not the model, so walk and
// furniture placement stay put. Front of the house is at +Z (the bottom of the
// 2D plan) and defaults to facing south.

export const PAYNESVILLE = { lat: 45.3802, lon: -94.7219, label: 'Paynesville, MN' };

export const FACING = {
  n:  { id: 'n',  label: 'North',      bearing: 0 },
  ne: { id: 'ne', label: 'Northeast',  bearing: 45 },
  e:  { id: 'e',  label: 'East',       bearing: 90 },
  se: { id: 'se', label: 'Southeast',  bearing: 135 },
  s:  { id: 's',  label: 'South',      bearing: 180 },
  sw: { id: 'sw', label: 'Southwest',  bearing: 225 },
  w:  { id: 'w',  label: 'West',       bearing: 270 },
  nw: { id: 'nw', label: 'Northwest',  bearing: 315 },
};
export const FACING_ORDER = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
export const DEFAULT_FACING = 's';

// Season shortcuts use the current year's usual dates (good to a day).
export const SEASONS = {
  winter:  { id: 'winter',  label: 'Winter solstice', month: 12, day: 21 },
  equinox: { id: 'equinox', label: 'Equinox',         month: 3,  day: 20 },
  summer:  { id: 'summer',  label: 'Summer solstice', month: 6,  day: 21 },
  date:    { id: 'date',    label: 'Date' },
};

// Fraction of the time-of-day slider that maps sunrise → sunset.
export const DAYLIGHT_END = 0.86;

export function parseFacing(id) {
  const k = String(id || '').toLowerCase();
  return FACING[k] ? k : DEFAULT_FACING;
}

export function facingBearing(id) {
  return FACING[parseFacing(id)].bearing;
}

/** Degrees to rotate the 2D-plan north arrow (clockwise, front stays at the bottom). */
export function planNorthRotation(facing) {
  return facingBearing(facing) - 180;
}

/**
 * Compass azimuth of true north, in model space (0 = model -Z).
 * House facing south → north stays at -Z. House facing north → true north is +Z.
 */
export function modelAzimuthForCompass(compassAzDeg, facing) {
  const face = facingBearing(facing);
  return ((compassAzDeg - face + 180) % 360 + 360) % 360;
}

// Approximate US ZIP-prefix centroids (first two digits). Fine for sun path.
const ZIP2 = {
  0:[18.3,-66.5], 1:[42.4,-71.4], 2:[42.9,-71.6], 3:[42.9,-72.5], 4:[42.3,-71.8],
  5:[41.7,-71.5], 6:[41.6,-72.7], 7:[40.8,-74.0], 8:[40.7,-74.2], 9:[40.8,-73.3],
  10:[40.8,-73.9], 11:[40.7,-73.8], 12:[42.7,-73.8], 13:[43.0,-76.1], 14:[43.0,-78.8],
  15:[40.4,-80.0], 16:[41.4,-80.1], 17:[40.3,-76.9], 18:[40.6,-75.5], 19:[40.0,-75.3],
  20:[38.9,-77.0], 21:[39.3,-76.6], 22:[38.0,-77.5], 23:[37.4,-77.4], 24:[37.1,-80.0],
  25:[38.4,-81.6], 26:[39.3,-80.3], 27:[36.1,-79.8], 28:[35.5,-80.8], 29:[34.0,-81.0],
  30:[33.8,-84.4], 31:[32.6,-83.6], 32:[27.8,-81.7], 33:[26.1,-80.2], 34:[27.3,-82.5],
  35:[33.5,-86.8], 36:[32.4,-86.3], 37:[36.2,-86.8], 38:[35.1,-89.0], 39:[32.3,-90.2],
  40:[38.2,-85.7], 41:[37.6,-83.5], 42:[37.0,-86.4], 43:[40.0,-83.0], 44:[41.4,-81.7],
  45:[39.3,-84.5], 46:[40.0,-86.2], 47:[39.2,-86.1], 48:[42.5,-83.3], 49:[43.0,-85.7],
  50:[41.6,-93.6], 51:[42.5,-96.4], 52:[42.0,-91.7], 53:[43.1,-88.2], 54:[44.5,-90.0],
  55:[44.9,-93.3], 56:[45.5,-94.2], 57:[44.0,-100.3], 58:[47.0,-100.8], 59:[46.9,-110.0],
  60:[41.8,-87.8], 61:[40.8,-89.6], 62:[39.0,-89.5], 63:[38.6,-90.4], 64:[39.1,-94.6],
  65:[38.6,-92.2], 66:[39.0,-95.7], 67:[37.7,-97.3], 68:[41.3,-96.0], 69:[41.1,-100.8],
  70:[29.9,-90.1], 71:[32.5,-93.7], 72:[34.7,-92.3], 73:[35.5,-97.5], 74:[36.1,-95.9],
  75:[32.8,-96.8], 76:[32.8,-97.3], 77:[29.8,-95.4], 78:[30.3,-97.7], 79:[31.8,-102.0],
  80:[39.7,-105.0], 81:[38.3,-104.6], 82:[43.0,-107.6], 83:[43.6,-116.2], 84:[40.8,-111.9],
  85:[33.4,-112.0], 86:[34.5,-112.0], 87:[35.1,-106.6], 88:[32.3,-106.8], 89:[39.5,-119.8],
  90:[34.0,-118.2], 91:[34.2,-118.1], 92:[33.7,-117.8], 93:[35.4,-119.0], 94:[37.8,-122.3],
  95:[38.6,-121.5], 96:[19.6,-155.5], 97:[45.5,-122.7], 98:[47.5,-122.3], 99:[47.7,-117.4],
};

export function zipToLatLon(zip) {
  const z = String(zip || '').replace(/\D/g, '').slice(0, 5);
  if (z.length < 2) return null;
  // Paynesville and nearby 563xx (central Minnesota) stay exact.
  if (z.startsWith('563')) return { lat: 45.3802, lon: -94.7219, label: 'near Paynesville, MN', zip: z };
  const two = ZIP2[parseInt(z.slice(0, 2), 10)];
  if (!two) return null;
  return { lat: two[0], lon: two[1], label: `ZIP ${z}`, zip: z };
}

export function resolveObserver({ lat, lon, zip, parcelLat, parcelLon, label } = {}) {
  if (Number.isFinite(+lat) && Number.isFinite(+lon)) {
    return { lat: +lat, lon: +lon, label: label || 'site coordinates', source: 'coords' };
  }
  if (Number.isFinite(+parcelLat) && Number.isFinite(+parcelLon)) {
    return { lat: +parcelLat, lon: +parcelLon, label: label || 'lot', source: 'parcel' };
  }
  const fromZip = zipToLatLon(zip);
  if (fromZip) return { ...fromZip, source: 'zip' };
  return { ...PAYNESVILLE, source: 'default' };
}

export function dayOfYear(date) {
  const y = date.getFullYear();
  const start = Date.UTC(y, 0, 0);
  const now = Date.UTC(y, date.getMonth(), date.getDate());
  return (now - start) / 86400000;
}

/** Declination in radians (Spencer). */
export function solarDeclination(date) {
  const n = dayOfYear(date);
  const g = 2 * Math.PI / 365 * (n - 1);
  return (0.006918
    - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
    - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
    - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g));
}

/**
 * Sun position at an apparent-solar-time hour (12 = solar noon).
 * Azimuth is degrees clockwise from true north (90 = east, 180 = south).
 * Elevation is degrees above the horizon (negative after sunset).
 */
export function solarPosition(latDeg, date, solarHour) {
  const lat = (latDeg * Math.PI) / 180;
  const dec = solarDeclination(date);
  const H = ((solarHour - 12) * 15 * Math.PI) / 180;
  const sinEl = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H);
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinEl))) * 180 / Math.PI;
  const az = Math.atan2(
    Math.sin(H),
    Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat),
  );
  // atan2 convention here: 0 at south, clockwise. Convert to clockwise-from-north.
  const azimuth = ((az * 180 / Math.PI) + 180 + 360) % 360;
  return { azimuth, elevation, solarHour, declination: dec * 180 / Math.PI };
}

/** Sunrise / sunset in apparent solar hours, including standard refraction. */
export function sunriseSunset(latDeg, date, horizonDeg = -0.833) {
  const lat = (latDeg * Math.PI) / 180;
  const dec = solarDeclination(date);
  const h = (horizonDeg * Math.PI) / 180;
  const cosH = (Math.sin(h) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec));
  if (cosH >= 1) return { sunrise: 12, sunset: 12, polar: 'night' };
  if (cosH <= -1) return { sunrise: 0, sunset: 24, polar: 'day' };
  const H = Math.acos(Math.max(-1, Math.min(1, cosH))) * 180 / Math.PI;
  const sunrise = 12 - H / 15;
  const sunset = 12 + H / 15;
  return { sunrise, sunset, polar: null, dayLength: sunset - sunrise };
}

export function seasonDate(season, year, custom) {
  const y = year || new Date().getFullYear();
  if (season === 'date' && custom) {
    const d = custom instanceof Date ? custom : parseISODate(custom);
    if (d) return d;
  }
  const s = SEASONS[season] || SEASONS.equinox;
  if (!s.month) return new Date(y, new Date().getMonth(), new Date().getDate());
  return new Date(y, s.month - 1, s.day);
}

export function parseISODate(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function isoDate(d) {
  if (!(d instanceof Date) || !Number.isFinite(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Map slider 0–1 (dawn…night) onto solar hours: 0 ≈ 45 min before sunrise, 0.86 = sunset, 1 ≈ 45 min after. */
export function solarHourFromSlider(u, latDeg, date) {
  const { sunrise, sunset, polar } = sunriseSunset(latDeg, date);
  if (polar === 'night') return 12; // sun stays down
  if (polar === 'day') return 5 + Math.max(0, Math.min(1, u)) * 14;
  const pad = 0.75;
  const start = sunrise - pad;
  const mid = sunset;
  const end = sunset + pad;
  const t = Math.max(0, Math.min(1, +u || 0));
  if (t <= DAYLIGHT_END) return start + (t / DAYLIGHT_END) * (mid - start);
  return mid + ((t - DAYLIGHT_END) / (1 - DAYLIGHT_END)) * (end - mid);
}

export function sliderFromSolarHour(hour, latDeg, date) {
  const { sunrise, sunset, polar } = sunriseSunset(latDeg, date);
  if (polar) return 0.5;
  const pad = 0.75;
  const start = sunrise - pad;
  const mid = sunset;
  const end = sunset + pad;
  if (hour <= mid) return DAYLIGHT_END * (hour - start) / Math.max(0.01, mid - start);
  return DAYLIGHT_END + (1 - DAYLIGHT_END) * (hour - mid) / Math.max(0.01, end - mid);
}

export function formatSolarHour(hour) {
  if (!Number.isFinite(hour)) return '';
  let h = ((hour % 24) + 24) % 24;
  const m = Math.round((h % 1) * 60);
  let hh = Math.floor(h);
  if (m === 60) { hh += 1; }
  const mm = m === 60 ? 0 : m;
  const ap = hh % 24 >= 12 ? 'PM' : 'AM';
  const h12 = (hh % 12) || 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${ap}`;
}

/** Precompute the day's arc (true-north azimuth / elevation samples) for the overlay. */
export function sunArcSamples(latDeg, date, steps = 24) {
  const { sunrise, sunset, polar } = sunriseSunset(latDeg, date);
  if (polar === 'night') return { polar, points: [] };
  const t0 = polar === 'day' ? 0 : sunrise;
  const t1 = polar === 'day' ? 24 : sunset;
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = t0 + (t1 - t0) * (i / steps);
    points.push(solarPosition(latDeg, date, t));
  }
  return { polar, sunrise, sunset, points };
}

export function seasonLabel(season, date) {
  if (season === 'winter') return 'Winter solstice';
  if (season === 'summer') return 'Summer solstice';
  if (season === 'equinox') return 'Equinox';
  const d = date instanceof Date ? date : parseISODate(date);
  if (!d) return 'Date';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
