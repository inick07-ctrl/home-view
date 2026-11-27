// PeakStead Designs — 2D plan view + professional multi-sheet PDF export (client-side).
// Vector drawings are built as SVG (same art for the in-app 2D view and the PDF).
// jsPDF + svg2pdf are loaded on demand from /vendor (self-hosted, no CDN at runtime).

const PRELIM = 'Preliminary – not for construction; verify with a licensed design professional and local code';
const FIRM = 'PeakStead Designs';
const INFO_PREFIX = 'peakstead-plan-info:';
const SIZES = {
  'arch-d': { id: 'arch-d', label: 'ARCH D (36″ × 24″ landscape)', w: 36, h: 24 },
  'tabloid': { id: 'tabloid', label: '11″ × 17″ landscape', w: 17, h: 11 },
  'letter': { id: 'letter', label: 'Letter (11″ × 8.5″ landscape)', w: 11, h: 8.5 },
};
// ipf = inches on paper per foot of plan (world units are feet).
const ARCH_SCALES = [
  { name: '1/4" = 1\'-0"', ipf: 0.25 },
  { name: '3/16" = 1\'-0"', ipf: 0.1875 },
  { name: '1/8" = 1\'-0"', ipf: 0.125 },
  { name: '3/32" = 1\'-0"', ipf: 0.09375 },
  { name: '1/16" = 1\'-0"', ipf: 0.0625 },
];
const SITE_SCALES = [
  { name: '1" = 10\'', ipf: 1 / 10 },
  { name: '1" = 20\'', ipf: 1 / 20 },
  { name: '1" = 30\'', ipf: 1 / 30 },
  { name: '1" = 40\'', ipf: 1 / 40 },
  { name: '1" = 50\'', ipf: 1 / 50 },
  { name: '1" = 60\'', ipf: 1 / 60 },
];
const STD_SCALES = [...ARCH_SCALES, ...SITE_SCALES];

let getSnapshot = () => ({});
let plan2dOn = false;

const $ = (id) => document.getElementById(id);

function fmtFtIn(n) {
  if (!Number.isFinite(+n)) return '—';
  const sign = n < 0 ? '-' : '';
  const tot = Math.abs(Math.round((+n) * 12));
  const ft = Math.floor(tot / 12), inch = tot % 12;
  return sign + ft + "'-" + inch + '"';
}
function fmtFtInTight(n) {
  if (!Number.isFinite(+n)) return '—';
  const tot = Math.abs(Math.round((+n) * 12));
  const ft = Math.floor(tot / 12), inch = tot % 12;
  return ft + '\'-' + inch + '"';
}
function fmtSf(n) { return Math.round(+n || 0).toLocaleString('en-US'); }
function todayStamp() {
  return new Date().toLocaleDateString('en-US', { timeZone: 'America/Chicago', year: 'numeric', month: 'long', day: 'numeric' });
}
function isoDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function attr(o) {
  return Object.entries(o).filter(([, v]) => v != null && v !== false)
    .map(([k, v]) => (v === true ? k : `${k}="${String(v).replace(/"/g, '&quot;')}"`)).join(' ');
}
function node(tag, a = {}, inner = '') {
  const body = Array.isArray(inner) ? inner.join('') : (inner || '');
  return `<${tag}${Object.keys(a).length ? ' ' + attr(a) : ''}>${body}</${tag}>`;
}

function infoKey(snap) {
  const src = snap.src || {};
  if (src.kind === 'project') return INFO_PREFIX + 'project:' + src.id;
  if (src.kind === 'share') return INFO_PREFIX + 'share:' + src.token;
  return INFO_PREFIX + 'example:' + (snap.exampleId || snap.id || 'default');
}
export function loadPlanInfo(snap) {
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(infoKey(snap)) || '{}') || {}; } catch { stored = {}; }
  const fromLayout = snap.planInfo || {};
  return {
    project: String(fromLayout.project || stored.project || snap.title || snap.name || 'Untitled project').slice(0, 80),
    address: String(fromLayout.address || stored.address || '').slice(0, 120),
    owner: String(fromLayout.owner || stored.owner || '').slice(0, 80),
    revision: String(fromLayout.revision || stored.revision || '0').slice(0, 12),
    size: SIZES[fromLayout.size || stored.size] ? (fromLayout.size || stored.size) : 'tabloid',
    schedule: (fromLayout.schedule ?? stored.schedule ?? true) !== false,
    price: String(fromLayout.price || stored.price || '').slice(0, 40),
    contactName: String(fromLayout.contactName || stored.contactName || '').slice(0, 80),
    contactPhone: String(fromLayout.contactPhone || stored.contactPhone || '').slice(0, 40),
  };
}
export function savePlanInfo(snap, info) {
  const rec = {
    project: String(info.project || '').slice(0, 80),
    address: String(info.address || '').slice(0, 120),
    owner: String(info.owner || '').slice(0, 80),
    revision: String(info.revision || '0').slice(0, 12),
    size: SIZES[info.size] ? info.size : 'tabloid',
    schedule: info.schedule !== false,
    price: String(info.price || '').slice(0, 40),
    contactName: String(info.contactName || '').slice(0, 80),
    contactPhone: String(info.contactPhone || '').slice(0, 40),
  };
  try { localStorage.setItem(infoKey(snap), JSON.stringify(rec)); } catch {}
  if (snap && typeof snap.onPlanInfo === 'function') snap.onPlanInfo(rec);
  return rec;
}

function boundsOf(snap) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (a, b, c, d) => { x0 = Math.min(x0, a, c); y0 = Math.min(y0, b, d); x1 = Math.max(x1, a, c); y1 = Math.max(y1, b, d); };
  for (const r of (snap.rooms || [])) if (r && r.length >= 7) add(r[3], r[4], r[5], r[6]);
  for (const k of ['ext', 'int', 'win', 'door']) for (const w of (snap.walls?.[k] || [])) add(w[0], w[1], w[2], w[3]);
  if (!Number.isFinite(x0)) { x0 = 0; y0 = 0; x1 = 40; y1 = 30; }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
function pickScale(worldW, worldH, boxW, boxH, preferSite) {
  const pool = preferSite ? SITE_SCALES : ARCH_SCALES;
  for (const s of pool) {
    if (worldW * s.ipf <= boxW + 1e-6 && worldH * s.ipf <= boxH + 1e-6) return s;
  }
  const ipf = Math.min(boxW / Math.max(worldW, 0.01), boxH / Math.max(worldH, 0.01));
  const ftPerIn = 1 / Math.max(ipf, 1e-6);
  const rounded = Math.round(ftPerIn * 10) / 10;
  return { name: '1" = ' + rounded + "' (fit to sheet)", ipf, fitted: true };
}
function xform(b, box, scale) {
  const dw = b.w * scale.ipf, dh = b.h * scale.ipf;
  const ox = box.x + (box.w - dw) / 2, oy = box.y + (box.h - dh) / 2;
  const X = (x) => ox + (x - b.x0) * scale.ipf;
  // Plan view matches the 3D model: north (-y) is up the page, south (+y, the front) is down.
  const Y = (y) => oy + (y - b.y0) * scale.ipf;
  const S = (ft) => ft * scale.ipf;
  return { X, Y, S, ox, oy, dw, dh, scale, b, box };
}

function line(x1, y1, x2, y2, sw, color = '#111') {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" stroke-linecap="square" fill="none"/>`;
}
function rect(x, y, w, h, sw, fill = 'none', color = '#111') {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="${color}" stroke-width="${sw}" fill="${fill}"/>`;
}
function poly(pts, sw, fill = 'none', color = '#111', dash) {
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ',' + p[1]).join(' ') + (fill !== 'none' ? ' Z' : '');
  return `<path d="${d}" stroke="${color}" stroke-width="${sw}" fill="${fill}"${dash ? ` stroke-dasharray="${dash}"` : ''} fill-rule="evenodd" stroke-linejoin="miter"/>`;
}
function pdfSafe(s) {
  return String(s ?? '')
    .replace(/[′’‘]/g, "'")
    .replace(/[″“”]/g, '"')
    .replace(/×/g, 'x')
    .replace(/·/g, ' - ')
    .replace(/—/g, '-');
}
function text(x, y, s, size, opts = {}) {
  const a = opts.anchor || 'middle';
  const wt = opts.bold ? '700' : '400';
  const fill = opts.color || '#111';
  const rot = opts.rotate;
  const tf = rot != null ? ` transform="rotate(${rot} ${x} ${y})"` : '';
  return `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="${wt}" text-anchor="${a}" fill="${fill}"${tf}>${esc(pdfSafe(s))}</text>`;
}
function arc90(cx, cy, r, fromDeg, sw) {
  const a0 = fromDeg * Math.PI / 180, a1 = (fromDeg + 90) * Math.PI / 180;
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  return `<path d="M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}" stroke="#111" stroke-width="${sw}" fill="none"/>`;
}

function titleBlock(W, H, meta) {
  const tw = Math.min(4.6, W * 0.32), th = 1.15;
  const x = W - 0.35 - tw, y = H - 0.3 - th;
  const row = th / 5;
  const bits = [];
  bits.push(rect(0.25, 0.22, W - 0.5, H - 0.44, 0.018, 'none'));
  bits.push(rect(0.32, 0.29, W - 0.64, H - 0.58, 0.006, 'none'));
  bits.push(rect(x, y, tw, th, 0.016, '#fff'));
  const rows = [
    [FIRM, true],
    [meta.project || 'Untitled project', false],
    [`Sheet ${meta.sheet}  ·  ${meta.title}`, false],
    [`Date ${meta.date}  ·  Rev ${meta.revision || '0'}`, false],
    [PRELIM, false],
  ];
  rows.forEach((r, i) => {
    const yy = y + row * (i + 1) - 0.06;
    bits.push(line(x, y + row * i, x + tw, y + row * i, 0.005));
    bits.push(text(x + 0.08, yy, r[0], i === 4 ? 0.07 : (i === 0 ? 0.11 : 0.09), { anchor: 'start', bold: r[1] }));
  });
  bits.push(line(x, y + th, x + tw, y + th, 0.016));
  return { svg: bits.join(''), x, y, tw, th, drawX: 0.45, drawY: 0.42, drawW: W - 0.9, drawH: H - 0.52 - th - 0.2 };
}

function northArrow(x, y, s = 0.45) {
  const h = s, w = s * 0.38;
  return [
    `<polygon points="${x},${y - h} ${x + w},${y + h * 0.35} ${x},${y + h * 0.1} ${x - w},${y + h * 0.35}" fill="#111"/>`,
    text(x, y - h - 0.08, 'N', 0.12, { bold: true }),
  ].join('');
}
function scaleBar(x, y, scale, width = 1.5) {
  const ipf = scale.ipf;
  const feetOptions = [1, 2, 4, 5, 8, 10, 16, 20, 25, 30, 40, 50, 60, 80, 100];
  let ft = feetOptions[0];
  for (const f of feetOptions) if (f * ipf <= width) ft = f;
  const w = ft * ipf, h = 0.08;
  const mid = ft / 2;
  return [
    rect(x, y, w, h, 0.008, '#fff'),
    rect(x, y, w / 2, h, 0.008, '#111'),
    line(x, y, x, y + h + 0.04, 0.008),
    line(x + w / 2, y, x + w / 2, y + h + 0.04, 0.008),
    line(x + w, y, x + w, y + h + 0.04, 0.008),
    text(x, y + h + 0.14, '0', 0.07, { anchor: 'middle' }),
    text(x + w / 2, y + h + 0.14, String(mid), 0.07, { anchor: 'middle' }),
    text(x + w, y + h + 0.14, `${ft} ft`, 0.07, { anchor: 'middle' }),
    text(x, y - 0.08, 'SCALE: ' + scale.name, 0.08, { anchor: 'start', bold: true }),
  ].join('');
}

function dimH(xf, xA, xB, y, offset, sw = 0.007) {
  if (Math.abs(xB - xA) < 0.15) return '';
  const a = xf.X(Math.min(xA, xB)), b = xf.X(Math.max(xA, xB));
  const yy = xf.Y(y) - offset;
  const mid = (a + b) / 2;
  const tick = 0.06 * Math.sign(offset || 1);
  return [
    line(a, yy, b, yy, sw),
    line(a, yy - 0.05, a, yy + 0.05, sw),
    line(b, yy - 0.05, b, yy + 0.05, sw),
    text(mid, yy - 0.04, fmtFtInTight(Math.abs(xB - xA)), 0.08),
  ].join('');
}
function dimV(xf, yA, yB, x, offset, sw = 0.007) {
  if (Math.abs(yB - yA) < 0.15) return '';
  const a = xf.Y(Math.max(yA, yB)), b = xf.Y(Math.min(yA, yB));
  const xx = xf.X(x) + offset;
  const mid = (a + b) / 2;
  return [
    line(xx, a, xx, b, sw),
    line(xx - 0.05, a, xx + 0.05, a, sw),
    line(xx - 0.05, b, xx + 0.05, b, sw),
    text(xx + (offset >= 0 ? 0.07 : -0.07), mid + 0.03, fmtFtInTight(Math.abs(yB - yA)), 0.08, { anchor: offset >= 0 ? 'start' : 'end' }),
  ].join('');
}

function wallRect(w) { return [Math.min(w[0], w[2]), Math.min(w[1], w[3]), Math.max(w[0], w[2]), Math.max(w[1], w[3])]; }
function isHoriz(w) { const r = wallRect(w); return (r[2] - r[0]) >= (r[3] - r[1]); }
function insideRoom(rooms, x, y, pred) {
  return (rooms || []).find((r) => (!pred || pred(r)) && x > r[3] && x < r[5] && y > r[4] && y < r[6]);
}
function isOutsideRoom(r) { return !!(r[7]?.outside) || r[2] === 'porch' || r[2] === 'terrace'; }

function drawFloorPlan(xf, snap, { labels = true, dims = true } = {}) {
  const swExt = 0.014, swInt = 0.009, swDim = 0.006, swOpen = 0.007;
  const bits = [];
  const rooms = snap.rooms || [];
  const WS = snap.walls || {};
  // room fills (heated light, garage slightly darker, porch hatched-ish pale)
  for (const r of rooms) {
    const x = xf.X(r[3]), y = xf.Y(r[4]), w = xf.S(r[5] - r[3]), h = xf.S(r[6] - r[4]);
    const out = isOutsideRoom(r);
    const gar = /garage|\bbay\b|\bshop\b/i.test(r[0] || '');
    const fill = out ? '#f7f4ee' : gar ? '#eceae4' : '#ffffff';
    bits.push(rect(x, y, w, h, 0.003, fill, '#ddd'));
  }
  const drawWalls = (list, sw, fill) => {
    for (const w of (list || [])) {
      const [a, b, c, d] = wallRect(w);
      bits.push(rect(xf.X(a), xf.Y(b), xf.S(c - a), xf.S(d - b), sw, fill));
    }
  };
  drawWalls(WS.int, swInt, '#111');
  drawWalls(WS.ext, swExt, '#111');

  // windows: break in the wall + glass line
  for (const w of (WS.win || [])) {
    const [a, b, c, d] = wallRect(w);
    const horiz = isHoriz(w);
    bits.push(rect(xf.X(a), xf.Y(b), xf.S(c - a), xf.S(d - b), 0.003, '#fff', '#fff'));
    if (horiz) {
      const midY = xf.Y((b + d) / 2);
      bits.push(line(xf.X(a), midY, xf.X(c), midY, swOpen));
      bits.push(line(xf.X(a), midY - 0.02, xf.X(c), midY - 0.02, 0.004));
      bits.push(line(xf.X(a), midY + 0.02, xf.X(c), midY + 0.02, 0.004));
    } else {
      const midX = xf.X((a + c) / 2);
      bits.push(line(midX, xf.Y(b), midX, xf.Y(d), swOpen));
      bits.push(line(midX - 0.02, xf.Y(b), midX - 0.02, xf.Y(d), 0.004));
      bits.push(line(midX + 0.02, xf.Y(b), midX + 0.02, xf.Y(d), 0.004));
    }
  }

  // doors + swings / garage labels
  const doorMeta = new Map((snap.doorList || []).map((d) => [d.index, d]));
  (WS.door || []).forEach((w, i) => {
    const [a, b, c, d] = wallRect(w);
    const horiz = isHoriz(w);
    const width = horiz ? (c - a) : (d - b);
    const cx = (a + c) / 2, cy = (b + d) / 2;
    bits.push(rect(xf.X(a), xf.Y(b), xf.S(c - a), xf.S(d - b), 0.003, '#fff', '#fff'));
    const meta = doorMeta.get(i) || {};
    if (meta.removed) {
      // Full-height opening: jamb ticks only, no swing or garage leaf / header mark.
      if (horiz) {
        bits.push(line(xf.X(a), xf.Y(b), xf.X(a), xf.Y(d), swOpen));
        bits.push(line(xf.X(c), xf.Y(b), xf.X(c), xf.Y(d), swOpen));
      } else {
        bits.push(line(xf.X(a), xf.Y(b), xf.X(c), xf.Y(b), swOpen));
        bits.push(line(xf.X(a), xf.Y(d), xf.X(c), xf.Y(d), swOpen));
      }
      bits.push(text(xf.X(cx), xf.Y(cy), 'OPEN', 0.08, { bold: true, rotate: horiz ? 0 : -90 }));
      return;
    }
    // Wide opening = overhead garage door only if a garage room is on one side (a wide cased opening
    // between a kitchen and living room is just an opening).
    const nearGarage = !!(insideRoom(rooms, cx, cy + 2, (r) => /garage|\bbay\b|\bshop\b/i.test(r[0] || ''))
      || insideRoom(rooms, cx, cy - 2, (r) => /garage|\bbay\b|\bshop\b/i.test(r[0] || ''))
      || insideRoom(rooms, cx + 2, cy, (r) => /garage|\bbay\b|\bshop\b/i.test(r[0] || ''))
      || insideRoom(rooms, cx - 2, cy, (r) => /garage|\bbay\b|\bshop\b/i.test(r[0] || '')));
    const garage = meta.kind === 'garage' || (width >= 7.5 && nearGarage);
    if (garage) {
      if (horiz) {
        bits.push(line(xf.X(a), xf.Y(cy) - 0.03, xf.X(c), xf.Y(cy) - 0.03, swOpen, '#111'));
        bits.push(line(xf.X(a), xf.Y(cy) + 0.03, xf.X(c), xf.Y(cy) + 0.03, swOpen, '#111'));
      } else {
        bits.push(line(xf.X(cx) - 0.03, xf.Y(b), xf.X(cx) - 0.03, xf.Y(d), swOpen, '#111'));
        bits.push(line(xf.X(cx) + 0.03, xf.Y(b), xf.X(cx) + 0.03, xf.Y(d), swOpen, '#111'));
      }
      const lx = horiz ? xf.X(cx) : xf.X(cx) + 0.16;
      const ly = horiz ? xf.Y(cy) - 0.12 : xf.Y(cy);
      bits.push(text(lx, ly, `OHD ${fmtFtInTight(width)}`, 0.08, { bold: true, rotate: horiz ? 0 : -90 }));
      return;
    }
    // jamb ticks
    const jambs = () => {
      if (horiz) {
        bits.push(line(xf.X(a), xf.Y(b), xf.X(a), xf.Y(d), swOpen));
        bits.push(line(xf.X(c), xf.Y(b), xf.X(c), xf.Y(d), swOpen));
      } else {
        bits.push(line(xf.X(a), xf.Y(b), xf.X(c), xf.Y(b), swOpen));
        bits.push(line(xf.X(a), xf.Y(d), xf.X(c), xf.Y(d), swOpen));
      }
    };
    if (width >= 7.5) { jambs(); return; } // wide cased opening: no door leaf to swing
    if (horiz) {
      bits.push(line(xf.X(a), xf.Y(b), xf.X(a), xf.Y(d), swOpen));
      bits.push(line(xf.X(c), xf.Y(b), xf.X(c), xf.Y(d), swOpen));
    } else {
      bits.push(line(xf.X(a), xf.Y(b), xf.X(c), xf.Y(b), swOpen));
      bits.push(line(xf.X(a), xf.Y(d), xf.X(c), xf.Y(d), swOpen));
    }
    // swing into interior
    const thick = horiz ? (d - b) : (c - a);
    const inward = (() => {
      const off = thick / 2 + 1.0;
      if (horiz) {
        const south = insideRoom(rooms, cx, cy + off, (r) => !isOutsideRoom(r));
        const north = insideRoom(rooms, cx, cy - off, (r) => !isOutsideRoom(r));
        if (south && !north) return 1;
        if (north && !south) return -1;
        return 1;
      }
      const east = insideRoom(rooms, cx + off, cy, (r) => !isOutsideRoom(r));
      const west = insideRoom(rooms, cx - off, cy, (r) => !isOutsideRoom(r));
      if (east && !west) return 1;
      if (west && !east) return -1;
      return 1;
    })();
    const r = xf.S(width);
    // Hinge at the start of the opening; the leaf swings into the room and the arc
    // runs from the open leaf to the closed position along the wall. Screen y grows
    // with +y (south), so +inward on a horizontal wall is down the page.
    if (horiz) {
      const hx = xf.X(a), hy = xf.Y(cy);
      bits.push(line(hx, hy, hx, hy + inward * r, swOpen));
      bits.push(arc90(hx, hy, r, inward > 0 ? 0 : -90, 0.005));
    } else {
      const hx = xf.X(cx), hy = xf.Y(b);
      bits.push(line(hx, hy, hx + inward * r, hy, swOpen));
      bits.push(arc90(hx, hy, r, inward > 0 ? 0 : 90, 0.005));
    }
  });

  // stairs
  for (const it of (snap.items || [])) {
    if (!it || !it.type || !snap.stairTypes?.has(it.type)) continue;
    const rot = ((it.rot || 0) % 360 + 360) % 360;
    const alongX = rot === 0 || rot === 180;
    const w = +(it.w || 3.5), d = +(it.d || 10);
    const x0 = it.x - (alongX ? w : d) / 2, y0 = it.y - (alongX ? d : w) / 2;
    const x1 = it.x + (alongX ? w : d) / 2, y1 = it.y + (alongX ? d : w) / 2;
    bits.push(rect(xf.X(x0), xf.Y(y0), xf.S(x1 - x0), xf.S(y1 - y0), 0.01, '#fff'));
    const n = Math.max(4, Math.round((alongX ? d : w) / 0.85));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (alongX) bits.push(line(xf.X(x0), xf.Y(y0 + t * (y1 - y0)), xf.X(x1), xf.Y(y0 + t * (y1 - y0)), 0.005));
      else bits.push(line(xf.X(x0 + t * (x1 - x0)), xf.Y(y0), xf.X(x0 + t * (x1 - x0)), xf.Y(y1), 0.005));
    }
    const dir = (it.dir || 'up').toUpperCase() === 'DOWN' ? 'DN' : 'UP';
    bits.push(text(xf.X(it.x), xf.Y(it.y) + 0.04, dir, 0.1, { bold: true }));
    // arrow
    const ay = xf.Y(it.y) - 0.18, ax = xf.X(it.x);
    bits.push(`<polygon points="${ax},${ay - 0.12} ${ax + 0.07},${ay} ${ax - 0.07},${ay}" fill="#111"/>`);
  }

  if (labels) {
    for (const r of rooms) {
      if (r[7] && r[7].planNoLabel) continue; // extra piece of an L-shaped room: the main piece carries the label
      const cx = xf.X((r[3] + r[5]) / 2), cy = xf.Y((r[4] + r[6]) / 2);
      const nm = (r[0] || 'ROOM').toUpperCase();
      const sz = `${fmtFtInTight(r[5] - r[3])} × ${fmtFtInTight(r[6] - r[4])}`;
      const fs = Math.min(0.13, Math.max(0.07, xf.S(Math.min(r[5] - r[3], r[6] - r[4]) / 8)));
      bits.push(text(cx, cy - 0.04, nm, fs, { bold: true }));
      bits.push(text(cx, cy + fs + 0.02, sz, Math.max(0.07, fs * 0.75)));
    }
  }

  if (dims) {
    const b = boundsOf(snap);
    bits.push(dimH(xf, b.x0, b.x1, b.y1, -0.28));
    bits.push(dimV(xf, b.y0, b.y1, b.x0, -0.32));
    const ext = WS.ext || [];
    const corners = [];
    for (const w of ext) {
      const [a, c, d, e] = wallRect(w);
      corners.push([a, c], [a, e], [d, c], [d, e]);
    }
    const jogChain = (axis) => {
      const map = new Map();
      for (const [x, y] of corners) {
        if (axis === 'x') {
          const prev = map.get(x);
          if (prev == null || y > prev) map.set(x, y); // south envelope
        } else {
          const prev = map.get(y);
          if (prev == null || x < prev) map.set(y, x); // west envelope
        }
      }
      const keys = [...map.keys()].sort((a, c) => a - c);
      if (keys.length < 2) return keys;
      const keep = [keys[0]];
      for (let i = 1; i < keys.length - 1; i++) {
        const e0 = map.get(keys[i - 1]), e1 = map.get(keys[i]);
        if (Math.abs(e1 - e0) > 0.6) keep.push(keys[i]);
      }
      keep.push(keys[keys.length - 1]);
      return keep;
    };
    const xs = jogChain('x');
    for (let i = 0; i < xs.length - 1; i++) {
      if (xs[i + 1] - xs[i] > 1.5) bits.push(dimH(xf, xs[i], xs[i + 1], b.y1, -0.55));
    }
    const ys = jogChain('y');
    for (let i = 0; i < ys.length - 1; i++) {
      if (ys[i + 1] - ys[i] > 1.5) bits.push(dimV(xf, ys[i], ys[i + 1], b.x0, -0.6));
    }
  }
  return bits.join('');
}

function pitchLabel(rf) {
  if (rf.shed) return 'SHED';
  if (rf.flat) return 'FLAT';
  const p = rf.pitch ?? 0.5;
  const rise = Math.round(p * 12);
  return `${rise}:12`;
}

function roofPolys(rf, wallH) {
  const x0 = rf.x0, y0 = rf.y0, x1 = rf.x1, y1 = rf.y1;
  if (rf.flat) {
    const h = rf.h ?? wallH;
    return [{ z: [h, h, h, h], pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], kind: 'flat', rf }];
  }
  if (rf.shed) {
    const ax = (x1 - x0) >= (y1 - y0);
    // hi/lo are absolute heights; slope runs across the short direction when typical
    const hi = rf.hi ?? wallH, lo = rf.lo ?? (hi - 1);
    const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    // assign z by interpolating along y if the names suggest north/south sheds
    const zFor = (x, y) => {
      const ty = (y - y0) / Math.max(y1 - y0, 0.01);
      const tx = (x - x0) / Math.max(x1 - x0, 0.01);
      const t = Math.abs(hi - lo) > 0 && (y1 - y0) >= (x1 - x0) ? ty : tx;
      return hi + (lo - hi) * t;
    };
    return [{ z: pts.map((p) => zFor(p[0], p[1])), pts, kind: 'shed', rf }];
  }
  const along = rf.along === 'y';
  const pitch = rf.pitch ?? 0.5;
  const eave = rf.eave ?? wallH;
  const ohv = rf.oh;
  const oh = Array.isArray(ohv) ? [ohv[0] ?? 1, ohv[1] ?? 1] : [ohv ?? 1, ohv ?? 1];
  const endOh = Array.isArray(rf.endOh) ? [rf.endOh[0] ?? 1, rf.endOh[1] ?? 1] : [rf.endOh ?? 1, rf.endOh ?? 1];
  const a0 = along ? x0 - oh[0] : y0 - oh[0];
  const a1 = along ? x1 + oh[1] : y1 + oh[1];
  const b0 = along ? y0 - endOh[0] : x0 - endOh[0];
  const b1 = along ? y1 + endOh[1] : x1 + endOh[1];
  const mid = (a0 + a1) / 2;
  const wHalf = (a1 - a0) / 2;
  const ridgeZ = eave + wHalf * pitch;
  const eaveA = eave - (along ? 0 : 0);
  const P = (A, B, z) => along ? [A, B, z] : [B, A, z];
  const e1 = P(a0, b0, eaveA), e2 = P(a0, b1, eaveA), e3 = P(a1, b0, eaveA), e4 = P(a1, b1, eaveA);
  const r1 = P(mid, b0, ridgeZ), r2 = P(mid, b1, ridgeZ);
  return [
    { pts: [[e1[0], e1[1]], [r1[0], r1[1]], [r2[0], r2[1]], [e2[0], e2[1]]], z: [e1[2], r1[2], r2[2], e2[2]], kind: 'slope', rf, pitch },
    { pts: [[e3[0], e3[1]], [e4[0], e4[1]], [r2[0], r2[1]], [r1[0], r1[1]]], z: [e3[2], e4[2], r2[2], r1[2]], kind: 'slope', rf, pitch },
  ];
}

function viewAxes(front, view) {
  // front is the house face that is "front" (s default). views: front, rear, left, right
  const order = { s: ['s', 'n', 'e', 'w'], n: ['n', 's', 'w', 'e'], e: ['e', 'w', 's', 'n'], w: ['w', 'e', 'n', 's'] };
  const [F, R, L, Rt] = order[front] || order.s;
  return { front: F, rear: R, left: L, right: Rt }[view];
}
function projectElev(face, x, y, z) {
  // paper x is to the viewer's right, z is up, depth increases away from the camera.
  if (face === 's') return [x, z, -y];
  if (face === 'n') return [-x, z, y];
  if (face === 'e') return [-y, z, -x];
  return [y, z, x];
}

function elevationFaces(snap, face) {
  const wallH = snap.wallH || 9;
  const faces = [];
  const pushFace = (pts3, depth, kind, extra) => {
    if (!pts3.length) return;
    const proj = pts3.map((p) => {
      const q = projectElev(face, p[0], p[1], p[2]);
      return { x: q[0], z: q[1], d: q[2] };
    });
    const midD = proj.reduce((s, p) => s + p.d, 0) / proj.length;
    faces.push({ proj, depth: depth ?? midD, kind, ...extra });
  };
  for (const kind of ['ext']) {
    for (const w of (snap.walls?.[kind] || [])) {
      const [a, b, c, d] = wallRect(w);
      const h = w[4] || wallH;
      const horiz = isHoriz(w);
      // four vertical faces of the wall box; keep those facing the camera (positive depth toward camera = smaller d for 'front')
      const quads = horiz
        ? [
          [[a, b, 0], [c, b, 0], [c, b, h], [a, b, h]],
          [[c, d, 0], [a, d, 0], [a, d, h], [c, d, h]],
        ]
        : [
          [[a, d, 0], [a, b, 0], [a, b, h], [a, d, h]],
          [[c, b, 0], [c, d, 0], [c, d, h], [c, b, h]],
        ];
      for (const q of quads) {
        const pr = q.map((p) => projectElev(face, p[0], p[1], p[2]));
        const n = (pr[0][2] + pr[1][2] + pr[2][2] + pr[3][2]) / 4;
        // keep faces whose outward normal roughly faces the camera: use the one with smaller depth (closer)
        pushFace(q, n, 'wall');
      }
    }
  }
  for (const w of (snap.walls?.win || [])) {
    const [a, b, c, d] = wallRect(w);
    const sill = w[4] ?? 3, head = w[5] ?? 7;
    const horiz = isHoriz(w);
    const midY = (b + d) / 2, midX = (a + c) / 2;
    const pts = horiz
      ? [[a, midY, sill], [c, midY, sill], [c, midY, head], [a, midY, head]]
      : [[midX, b, sill], [midX, d, sill], [midX, d, head], [midX, b, head]];
    pushFace(pts, null, 'win');
  }
  (snap.walls?.door || []).forEach((w, i) => {
    const [a, b, c, d] = wallRect(w);
    const meta = (snap.doorList || []).find((x) => x.index === i);
    const wallTop = w[5] || wallH;
    const head = meta?.removed ? (meta.openingTop || wallTop) : (w[4] ?? 7);
    const horiz = isHoriz(w);
    const midY = (b + d) / 2, midX = (a + c) / 2;
    const pts = horiz
      ? [[a, midY, 0], [c, midY, 0], [c, midY, head], [a, midY, head]]
      : [[midX, b, 0], [midX, d, 0], [midX, d, head], [midX, b, head]];
    const kind = meta?.removed ? 'opening' : (meta?.kind === 'garage' || (!horiz ? (d - b) : (c - a)) >= 7.5 ? 'garage' : 'door');
    pushFace(pts, null, kind, { width: horiz ? c - a : d - b, head });
  });
  for (const rf of (snap.roofs || [])) {
    for (const polyR of roofPolys(rf, wallH)) {
      const pts3 = polyR.pts.map((p, i) => [p[0], p[1], polyR.z[i]]);
      pushFace(pts3, null, 'roof', { pitch: pitchLabel(rf) });
    }
  }
  return faces;
}

function drawElevation(box, snap, face, title) {
  const faces = elevationFaces(snap, face);
  if (!faces.length) return text(box.x + box.w / 2, box.y + box.h / 2, 'No elevation', 0.12);
  let minX = Infinity, maxX = -Infinity, minZ = 0, maxZ = 1;
  for (const f of faces) for (const p of f.proj) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
  }
  const pad = 0.35;
  const worldW = Math.max(4, maxX - minX), worldH = Math.max(6, maxZ - minZ);
  const scale = pickScale(worldW, worldH, box.w - pad * 2, box.h - pad * 2 - 0.25);
  const dw = worldW * scale.ipf, dh = worldH * scale.ipf;
  const ox = box.x + (box.w - dw) / 2, oy = box.y + 0.28 + (box.h - 0.35 - dh) / 2;
  const X = (x) => ox + (x - minX) * scale.ipf;
  const Z = (z) => oy + dh - (z - minZ) * scale.ipf;
  // closer (larger depth in our convention? d is camera-space depth, smaller d is closer for some faces)
  const winding = (proj) => {
    let a = 0;
    for (let i = 0; i < proj.length; i++) {
      const p = proj[i], q = proj[(i + 1) % proj.length];
      a += p.x * q.z - q.x * p.z;
    }
    return a;
  };
  const visible = faces.filter((f) => {
    if (f.kind !== 'wall') return true;
    const span = Math.max(...f.proj.map((p) => p.x)) - Math.min(...f.proj.map((p) => p.x));
    if (span < 0.15) return true;
    return winding(f.proj) > 0;
  });
  const sorted = visible.slice().sort((a, b) => b.depth - a.depth);
  const bits = [rect(box.x, box.y, box.w, box.h, 0.006, '#fff')];
  bits.push(text(box.x + box.w / 2, box.y + 0.16, title, 0.11, { bold: true }));
  for (const f of sorted) {
    const pts = f.proj.map((p) => [X(p.x), Z(p.z)]);
    if (f.kind === 'wall') bits.push(poly(pts, 0.012, '#fff'));
    else if (f.kind === 'roof') bits.push(poly(pts, 0.011, '#fff'));
    else if (f.kind === 'win') {
      bits.push(poly(pts, 0.008, '#fff'));
      if (pts.length >= 4) {
        const mx = (pts[0][0] + pts[2][0]) / 2, mz = (pts[0][1] + pts[2][1]) / 2;
        bits.push(line(mx, pts[0][1], mx, pts[2][1], 0.005));
        bits.push(line(pts[0][0], mz, pts[2][0], mz, 0.005));
      }
    } else if (f.kind === 'door' || f.kind === 'garage' || f.kind === 'opening') {
      bits.push(poly(pts, 0.01, '#fff'));
      if (f.kind === 'garage' && pts.length >= 4) {
        const mx = (pts[0][0] + pts[1][0]) / 2, top = Math.min(...pts.map((p) => p[1]));
        bits.push(text(mx, top - 0.02, `OHD ${fmtFtInTight(f.width || 0)}`, 0.07));
      }
    }
  }
  // grade line
  bits.push(line(ox - 0.1, Z(0), ox + dw + 0.1, Z(0), 0.014));
  bits.push(text(ox + dw / 2, Z(0) + 0.16, 'GRADE', 0.07));
  // overall width + height
  bits.push(text(ox + dw / 2, oy + dh + 0.16, fmtFtInTight(worldW), 0.08));
  bits.push(text(ox - 0.08, oy + dh / 2, fmtFtInTight(worldH), 0.08, { rotate: -90, anchor: 'middle' }));
  bits.push(text(box.x + 0.08, box.y + box.h - 0.08, 'Scale: ' + scale.name, 0.07, { anchor: 'start' }));
  // pitch labels for visible roofs
  const seen = new Set();
  for (const f of sorted) {
    if (f.kind !== 'roof' || !f.pitch || seen.has(f.pitch)) continue;
    seen.add(f.pitch);
    const cx = f.proj.reduce((s, p) => s + X(p.x), 0) / f.proj.length;
    const cz = f.proj.reduce((s, p) => s + Z(p.z), 0) / f.proj.length;
    bits.push(text(cx, cz, f.pitch, 0.08, { bold: true }));
  }
  return bits.join('');
}

function drawRoofPlan(xf, snap) {
  const bits = [];
  const wallH = snap.wallH || 9;
  // building outline under
  for (const r of (snap.rooms || [])) {
    bits.push(rect(xf.X(r[3]), xf.Y(r[4]), xf.S(r[5] - r[3]), xf.S(r[6] - r[4]), 0.006, 'none', '#888'));
  }
  for (const rf of (snap.roofs || [])) {
    const polys = roofPolys(rf, wallH);
    for (const p of polys) {
      const pts = p.pts.map(([x, y]) => [xf.X(x), xf.Y(y)]);
      bits.push(poly(pts, 0.012, 'none', '#111'));
    }
    const cx = xf.X((rf.x0 + rf.x1) / 2), cy = xf.Y((rf.y0 + rf.y1) / 2);
    const along = rf.along === 'y';
    const lab = pitchLabel(rf);
    bits.push(text(cx, cy, lab, 0.11, { bold: true, rotate: along ? -90 : 0 }));
    // ridge tick
    if (!rf.shed && !rf.flat) {
      if (along) bits.push(line(cx, xf.Y(rf.y0), cx, xf.Y(rf.y1), 0.01));
      else bits.push(line(xf.X(rf.x0), cy, xf.X(rf.x1), cy, 0.01));
    }
  }
  return bits.join('');
}

function itemRectPlan(it) {
  const rot = ((it.rot || 0) % 360 + 360) % 360;
  const alongX = rot === 0 || rot === 180;
  const w = +(it.w || 4), d = +(it.d || 4);
  const rw = alongX ? w : d, rd = alongX ? d : w;
  return [it.x - rw / 2, it.y - rd / 2, it.x + rw / 2, it.y + rd / 2, it];
}

function drawSitePlan(xf, snap, lot) {
  const bits = [];
  if (lot && lot.world && lot.world.length) {
    for (const ring of lot.world) {
      const pts = ring.map(([x, y]) => [xf.X(x), xf.Y(y)]);
      bits.push(poly(pts, 0.018, 'none', '#111', '0.08 0.05'));
    }
    bits.push(text(xf.X((xf.b.x0 + xf.b.x1) / 2), xf.Y(xf.b.y0) + 0.2, 'PROPERTY LINE', 0.08, { color: '#333' }));
    if (lot.hasSetbacks && lot.buildable) {
      for (const ring of lot.buildable) {
        const pts = ring.map(([x, y]) => [xf.X(x), xf.Y(y)]);
        bits.push(poly(pts, 0.008, 'none', '#555', '0.04 0.04'));
      }
    }
  } else {
    // typ. lot outline around the house
    const m = 25;
    const hb = boundsOf(snap);
    const a = hb.x0, b = hb.y0, c = hb.x1, d = hb.y1;
    bits.push(rect(xf.X(a), xf.Y(b), xf.S(c - a), xf.S(d - b), 0.01, 'none', '#999'));
    bits.push(rect(xf.X(a - m), xf.Y(b - m), xf.S((c + m) - (a - m)), xf.S((d + m) - (b - m)), 0.016, 'none', '#111'));
    bits.push(dimV(xf, d, d + m, (a + c) / 2, 0.2));
    bits.push(dimV(xf, b - m, b, (a + c) / 2, 0.2));
    bits.push(dimH(xf, a - m, a, (b + d) / 2, 0.2));
    bits.push(text(xf.X((a + c) / 2), xf.Y(d + m / 2) + 0.12, 'TYP. FRONT SETBACK (VERIFY WITH AHJ)', 0.08));
    bits.push(text(xf.X((a + c) / 2), xf.Y(b - m / 2) + 0.12, 'TYP. REAR SETBACK (VERIFY WITH AHJ)', 0.08));
    bits.push(text(xf.X(a - m / 2), xf.Y((b + d) / 2), 'TYP. SIDE SETBACK (VERIFY WITH AHJ)', 0.08, { rotate: -90 }));
    bits.push(text(xf.X(c + m / 2), xf.Y((b + d) / 2), 'TYP. SIDE SETBACK (VERIFY WITH AHJ)', 0.08, { rotate: 90 }));
    bits.push(text(xf.X((a + c) / 2), xf.Y(d + m) - 0.12, 'TYPICAL LOT OUTLINE - VERIFY SURVEY', 0.08, { color: '#333' }));
  }
  // footprint
  for (const r of (snap.rooms || [])) {
    const out = isOutsideRoom(r);
    const gar = /garage|\bbay\b|\bshop\b/i.test(r[0] || '');
    bits.push(rect(xf.X(r[3]), xf.Y(r[4]), xf.S(r[5] - r[3]), xf.S(r[6] - r[4]), 0.012, out ? '#f4f1ea' : gar ? '#ddd' : '#fff'));
  }
  // driveway from garage doors
  for (const w of (snap.walls?.door || [])) {
    const [a, b, c, d] = wallRect(w);
    const horiz = isHoriz(w);
    const width = horiz ? c - a : d - b;
    const metaKind = (snap.doorList || []).find((x) => Math.abs((x.width || 0) - width) < 0.2 && x.kind === 'garage');
    if (!(width >= 7.5 || metaKind)) continue;
    const cx = (a + c) / 2, cy = (b + d) / 2;
    const depth = 20;
    // outward: away from garage room
    const rooms = snap.rooms || [];
    let polyD;
    if (horiz) {
      const southGar = insideRoom(rooms, cx, cy + 2, (r) => /garage/i.test(r[0] || ''));
      const northGar = insideRoom(rooms, cx, cy - 2, (r) => /garage/i.test(r[0] || ''));
      const outS = southGar ? -1 : 1; // if garage is south of wall, apron goes north (negative y)? 
      // wall at cy; garage on one side; apron on the other
      const garSouth = !!southGar;
      if (garSouth) polyD = [a - 1, b - depth, c + 1, b];
      else polyD = [a - 1, d, c + 1, d + depth];
    } else {
      const eastGar = insideRoom(rooms, cx + 2, cy, (r) => /garage/i.test(r[0] || ''));
      if (eastGar) polyD = [a - depth, b - 1, a, d + 1];
      else polyD = [c, b - 1, c + depth, d + 1];
    }
    bits.push(rect(xf.X(polyD[0]), xf.Y(polyD[1]), xf.S(polyD[2] - polyD[0]), xf.S(polyD[3] - polyD[1]), 0.008, '#e8e6e1', '#333'));
    bits.push(text(xf.X((polyD[0] + polyD[2]) / 2), xf.Y((polyD[1] + polyD[3]) / 2), 'DRIVEWAY (TYP.)', 0.08));
  }
  const types = snap.itemTypes || {};
  for (const it of (snap.items || [])) {
    const t = it.type || '';
    const rec = itemRectPlan(it);
    const x = xf.X(rec[0]), y = xf.Y(rec[1]), w = xf.S(rec[2] - rec[0]), h = xf.S(rec[3] - rec[1]);
    if (/^septicTank/.test(t)) {
      bits.push(rect(x, y, w, h, 0.01, '#fff', '#111'));
      bits.push(text(xf.X(it.x), xf.Y(it.y), 'SEPTIC', 0.08, { bold: true }));
    } else if (t === 'well' || /^well/.test(t)) {
      const r = Math.max(w, h) / 2;
      bits.push(`<circle cx="${xf.X(it.x)}" cy="${xf.Y(it.y)}" r="${Math.max(r, 0.08)}" stroke="#111" stroke-width="0.01" fill="#fff"/>`);
      bits.push(text(xf.X(it.x), xf.Y(it.y) - r - 0.08, 'WELL', 0.08, { bold: true }));
    } else if (types.outbuilding && types.outbuilding.has(t)) {
      bits.push(rect(x, y, w, h, 0.012, '#f4f1ea'));
      bits.push(text(xf.X(it.x), xf.Y(it.y), (it.name || t).toUpperCase().slice(0, 16), 0.07, { bold: true }));
    }
  }
  // setback dimensions when parcel has them
  if (lot?.hasSetbacks && lot.parcel) {
    const p = lot.parcel;
    bits.push(text(xf.box.x + 0.1, xf.box.y + xf.box.h - 0.1,
      `Recorded setbacks — front ${fmtFtIn(p.setbackF)}, side ${fmtFtIn(p.setbackS)}, rear ${fmtFtIn(p.setbackR)} (verify with AHJ)`,
      0.08, { anchor: 'start' }));
  }
  return bits.join('');
}

function sheetSvg(W, H, meta, body) {
  const tb = titleBlock(W, H, meta);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}in" height="${H}in" viewBox="0 0 ${W} ${H}">
    <rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>
    ${tb.svg}
    ${body(tb)}
  </svg>`;
  return svg;
}

function parseSvg(svg) {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  return doc.documentElement;
}

function sheetIndex(info, size) {
  const sheets = [
    { id: 'A0', title: 'COVER SHEET / TITLE' },
    { id: 'A1', title: 'DIMENSIONED FLOOR PLAN' },
    { id: 'A2', title: 'SITE PLAN' },
    { id: 'A3', title: 'EXTERIOR ELEVATIONS' },
    { id: 'A3.1', title: 'ROOF PLAN' },
  ];
  if (info.schedule !== false) sheets.push({ id: 'A4', title: 'DOOR / WINDOW SCHEDULE AND FINISHES' });
  return sheets.map((s) => ({ ...s, size }));
}

function drawCover(W, H, snap, info, sheets, areas) {
  const meta = { ...coverMeta(snap, info, 'A0', 'COVER SHEET / TITLE') };
  return sheetSvg(W, H, meta, (tb) => {
    const x = 0.7, y = 0.7;
    const bits = [];
    bits.push(text(x, y + 0.35, FIRM, 0.28, { anchor: 'start', bold: true }));
    bits.push(text(x, y + 0.65, 'PRELIMINARY CONSTRUCTION DRAWINGS', 0.16, { anchor: 'start' }));
    bits.push(line(x, y + 0.8, x + 8, y + 0.8, 0.02));
    bits.push(text(x, y + 1.2, info.project || snap.title, 0.22, { anchor: 'start', bold: true }));
    if (info.address) bits.push(text(x, y + 1.5, 'Project address: ' + info.address, 0.14, { anchor: 'start' }));
    else bits.push(text(x, y + 1.5, 'Project address: ________________________________', 0.14, { anchor: 'start' }));
    if (info.owner) bits.push(text(x, y + 1.8, 'Owner: ' + info.owner, 0.14, { anchor: 'start' }));
    else bits.push(text(x, y + 1.8, 'Owner: ________________________________________', 0.14, { anchor: 'start' }));
    bits.push(text(x, y + 2.1, `Date: ${meta.date}      Revision: ${info.revision || '0'}`, 0.13, { anchor: 'start' }));

    const ax = x, ay = y + 2.5;
    bits.push(text(ax, ay, 'AREA SUMMARY', 0.14, { anchor: 'start', bold: true }));
    const rows = [
      ['Heated / conditioned', fmtSf(areas.heated) + ' sf'],
      ['Garage', fmtSf(areas.garage) + ' sf'],
      ['Porches / outdoor covered', fmtSf(areas.porch) + ' sf'],
      ['Total (all of the above)', fmtSf(areas.heated + areas.garage + areas.porch) + ' sf'],
    ];
    rows.forEach((r, i) => {
      const yy = ay + 0.22 + i * 0.28;
      bits.push(rect(ax, yy - 0.18, 6.4, 0.28, 0.006));
      bits.push(text(ax + 0.1, yy, r[0], 0.11, { anchor: 'start' }));
      bits.push(text(ax + 6.25, yy, r[1], 0.11, { anchor: 'end', bold: true }));
    });

    const sx = x + Math.min(8.2, W * 0.42), sy = y + 2.5;
    bits.push(text(sx, sy, 'SHEET INDEX', 0.14, { anchor: 'start', bold: true }));
    sheets.forEach((s, i) => {
      const yy = sy + 0.28 + i * 0.26;
      bits.push(text(sx, yy, s.id, 0.11, { anchor: 'start', bold: true }));
      bits.push(text(sx + 0.8, yy, s.title, 0.11, { anchor: 'start' }));
    });

    bits.push(text(x, H - 2.0, 'SCALE NOTES', 0.14, { anchor: 'start', bold: true }));
    bits.push(text(x, H - 1.72, 'Floor plans are drawn at 1/4" = 1\'-0" when the sheet allows, otherwise the largest standard scale that fits (labeled on each sheet).', 0.1, { anchor: 'start' }));
    bits.push(text(x, H - 1.52, 'Site plans use an engineering scale (1" = 10\' through 1" = 60\') or a labeled fit-to-sheet scale. Elevations are independently fit and labeled.', 0.1, { anchor: 'start' }));
    bits.push(text(x, H - 1.32, 'All dimensions are in feet and inches, taken from the current saved plan (including user edits). Field-verify all conditions.', 0.1, { anchor: 'start' }));

    bits.push(rect(x, H - 2.85, Math.min(15, W - 1.6), 0.55, 0.01, '#f7f4ee'));
    bits.push(text(x + 0.12, H - 2.5, PRELIM + '.', 0.1, { anchor: 'start', bold: true }));
    return bits.join('');
  });
}

function coverMeta(snap, info, sheet, title) {
  return { project: info.project || snap.title, sheet, title, date: todayStamp(), revision: info.revision || '0' };
}

function drawA1(W, H, snap, info) {
  const meta = coverMeta(snap, info, 'A1', 'DIMENSIONED FLOOR PLAN');
  return sheetSvg(W, H, meta, (tb) => {
    const box = { x: tb.drawX, y: tb.drawY, w: tb.drawW - 0.1, h: tb.drawH - 0.55 };
    const b = boundsOf(snap);
    const pad = 6;
    const world = { x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad, w: b.w + pad * 2, h: b.h + pad * 2 };
    const scale = pickScale(world.w, world.h, box.w, box.h);
    const xf = xform(world, box, scale);
    const bits = [drawFloorPlan(xf, snap)];
    bits.push(northArrow(tb.drawX + 0.55, tb.drawY + tb.drawH - 0.15, 0.35));
    bits.push(scaleBar(tb.drawX + 1.3, tb.drawY + tb.drawH - 0.35, scale, 1.8));
    bits.push(text(tb.drawX + tb.drawW - 0.1, tb.drawY + 0.2, 'FLOOR PLAN  ·  NORTH UP', 0.1, { anchor: 'end', bold: true }));
    return bits.join('');
  });
}

function lotBounds(lot, snap) {
  const b = boundsOf(snap);
  if (lot?.world?.length) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const ring of lot.world) for (const [x, y] of ring) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    // also include house if pose places it in world... lot.world is already in world feet; house rooms are plan feet.
    // For examples without house pose, plan feet ≈ world. Include both.
    x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1);
    const pad = 8;
    return { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
  }
  const m = 30;
  return { x0: b.x0 - m, y0: b.y0 - m, x1: b.x1 + m, y1: b.y1 + m, w: b.w + m * 2, h: b.h + m * 2 };
}

function drawA2(W, H, snap, info, lot) {
  const meta = coverMeta(snap, info, 'A2', 'SITE PLAN');
  return sheetSvg(W, H, meta, (tb) => {
    const box = { x: tb.drawX, y: tb.drawY, w: tb.drawW, h: tb.drawH - 0.55 };
    const world = lotBounds(lot, snap);
    const scale = pickScale(world.w, world.h, box.w, box.h, true);
    const xf = xform(world, box, scale);
    const bits = [drawSitePlan(xf, snap, lot)];
    bits.push(northArrow(tb.drawX + 0.55, tb.drawY + tb.drawH - 0.15, 0.35));
    bits.push(scaleBar(tb.drawX + 1.3, tb.drawY + tb.drawH - 0.35, scale, 1.8));
    if (lot?.acres) {
      bits.push(text(tb.drawX + tb.drawW - 0.1, tb.drawY + 0.2,
        `LOT ${fmtSf(lot.area)} SF  (${(lot.acres).toFixed(2)} AC)  ·  COVERAGE ${lot.coverage != null ? lot.coverage.toFixed(1) + '%' : '—'}`,
        0.09, { anchor: 'end' }));
    }
    return bits.join('');
  });
}

function drawA3(W, H, snap, info) {
  const meta = coverMeta(snap, info, 'A3', 'EXTERIOR ELEVATIONS');
  const front = snap.front || 's';
  const labels = {
    front: 'FRONT ELEVATION',
    rear: 'REAR ELEVATION',
    left: 'LEFT ELEVATION',
    right: 'RIGHT ELEVATION',
  };
  const faces = {
    front: viewAxes(front, 'front'),
    rear: viewAxes(front, 'rear'),
    left: viewAxes(front, 'left'),
    right: viewAxes(front, 'right'),
  };
  return sheetSvg(W, H, meta, (tb) => {
    const gap = 0.15;
    const cols = 2, rows = 2;
    const cw = (tb.drawW - gap) / cols, ch = (tb.drawH - 0.1 - gap) / rows;
    const order = ['front', 'rear', 'left', 'right'];
    const bits = [];
    order.forEach((k, i) => {
      const c = i % 2, r = Math.floor(i / 2);
      const box = { x: tb.drawX + c * (cw + gap), y: tb.drawY + r * (ch + gap), w: cw, h: ch };
      bits.push(drawElevation(box, snap, faces[k], labels[k]));
    });
    return bits.join('');
  });
}

function drawA31(W, H, snap, info) {
  const meta = coverMeta(snap, info, 'A3.1', 'ROOF PLAN');
  return sheetSvg(W, H, meta, (tb) => {
    const box = { x: tb.drawX, y: tb.drawY, w: tb.drawW, h: tb.drawH - 0.55 };
    const b = boundsOf(snap);
    const pad = 8;
    const world = { x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad, w: b.w + pad * 2, h: b.h + pad * 2 };
    const scale = pickScale(world.w, world.h, box.w, box.h);
    const xf = xform(world, box, scale);
    const bits = [drawRoofPlan(xf, snap)];
    bits.push(northArrow(tb.drawX + 0.55, tb.drawY + tb.drawH - 0.15, 0.35));
    bits.push(scaleBar(tb.drawX + 1.3, tb.drawY + tb.drawH - 0.35, scale, 1.8));
    bits.push(text(tb.drawX + tb.drawW - 0.1, tb.drawY + 0.2, 'ROOF PLAN  ·  PITCH LABELS ARE RISE:RUN', 0.1, { anchor: 'end', bold: true }));
    return bits.join('');
  });
}

function finishLabel(finishes, key) {
  const v = finishes?.[key];
  if (!v) return 'Default / as designed';
  if (v.startsWith('wood:')) return 'Wood ' + v.slice(5).toUpperCase();
  return v.toUpperCase();
}

function drawA4(W, H, snap, info) {
  const meta = coverMeta(snap, info, 'A4', 'DOOR / WINDOW SCHEDULE AND FINISHES');
  return sheetSvg(W, H, meta, (tb) => {
    const bits = [];
    let y = tb.drawY + 0.15;
    const x = tb.drawX;
    const colW = [0.7, 1.3, 1.6, 1.3, 2.6];
    const headers = ['MARK', 'TYPE', 'SIZE', 'HEIGHT', 'NOTES'];
    const rowH = 0.18;
    const table = (title, rows) => {
      bits.push(text(x, y, title, 0.13, { anchor: 'start', bold: true }));
      y += 0.12;
      const total = colW.reduce((s, n) => s + n, 0);
      bits.push(rect(x, y, total, rowH, 0.008, '#eee'));
      let xx = x;
      headers.forEach((h, i) => { bits.push(text(xx + 0.06, y + 0.15, h, 0.08, { anchor: 'start', bold: true })); xx += colW[i]; });
      y += rowH;
      rows.forEach((r, i) => {
        if (y > tb.drawY + tb.drawH - 0.3) return;
        bits.push(rect(x, y, total, rowH, 0.005, i % 2 ? '#f7f7f5' : '#fff'));
        let p = x;
        r.forEach((cell, j) => { bits.push(text(p + 0.06, y + 0.15, cell, 0.08, { anchor: 'start' })); p += colW[j]; });
        y += rowH;
      });
      y += 0.25;
    };
    const doors = [];
    (snap.walls?.door || []).forEach((w, i) => {
      const horiz = isHoriz(w);
      const wr = wallRect(w);
      const width = (snap.doorList || []).find((d) => d.index === i)?.width || (horiz ? wr[2] - wr[0] : wr[3] - wr[1]);
      const metaD = (snap.doorList || []).find((d) => d.index === i) || {};
      const kind = metaD.kind || (width >= 7.5 ? 'garage' : 'door');
      const type = metaD.removed
        ? 'Opening (full height)'
        : kind === 'garage' ? 'Overhead garage' : kind === 'ext' ? 'Exterior swing' : 'Interior swing';
      const mark = kind === 'garage' ? 'GD' + (doors.filter((d) => d[0].startsWith('GD')).length + 1) : 'D' + (doors.length + 1);
      const ht = fmtFtInTight(metaD.removed ? (metaD.openingTop || w[5] || snap.wallH || 9) : (w[4] || 7));
      const notes = [metaD.room, metaD.removed ? 'Opening only; no header' : '', (!metaD.removed && kind === 'garage') ? 'Incl. opener (typ.)' : ''].filter(Boolean).join('; ');
      doors.push([mark, type, fmtFtInTight(width) + ' wide', ht, notes || '—']);
    });
    table('DOOR SCHEDULE', doors.length ? doors : [['—', 'None', '—', '—', '—']]);

    const wins = [];
    (snap.walls?.win || []).forEach((w, i) => {
      const horiz = isHoriz(w);
      const wr = wallRect(w);
      const width = horiz ? wr[2] - wr[0] : wr[3] - wr[1];
      const sill = w[4] ?? 3, head = w[5] ?? 7;
      const ht = head - sill;
      wins.push(['W' + (i + 1), 'Window (typ.)', fmtFtInTight(width) + ' wide', fmtFtInTight(ht) + ` (sill ${fmtFtInTight(sill)})`, 'Field-verify type / muntins']);
    });
    table('WINDOW SCHEDULE', wins.length ? wins : [['—', 'None', '—', '—', '—']]);

    bits.push(text(x, y, 'FINISH / COLOR SUMMARY  (from the current saved plan)', 0.13, { anchor: 'start', bold: true }));
    y += 0.2;
    const fin = snap.finishes || {};
    const hw = { 'matte-black': 'Matte Black', 'brushed-nickel': 'Brushed Nickel', 'polished-chrome': 'Polished Chrome', 'satin-brass': 'Satin Brass / Gold', 'oil-rubbed-bronze': 'Oil-Rubbed Bronze' };
    const lines = [
      ['Wall paint (whole house)', finishLabel(fin, 'wall')],
      ['Interior doors', finishLabel(fin, 'doorInt')],
      ['Exterior doors', finishLabel(fin, 'doorExt')],
      ['Kitchen cabinets', finishLabel(fin, 'cabinet')],
      ['Kitchen island', finishLabel(fin, 'island')],
      ['Hardware / fixtures', hw[fin.hardware] || (fin.hardware || 'Default / as designed')],
      ['Kitchen backsplash', finishLabel(fin.tiles || {}, 'backsplash')],
      ['Bath floor tile', finishLabel(fin.tiles || {}, 'bathFloor')],
      ['Shower / wall tile', finishLabel(fin.tiles || {}, 'shower')],
      ['Other tiled floors', finishLabel(fin.tiles || {}, 'floor')],
    ];
    lines.forEach((r) => {
      bits.push(text(x, y, r[0] + ':  ' + r[1], 0.1, { anchor: 'start' }));
      y += 0.2;
    });
    y += 0.15;
    bits.push(text(x, y, 'Room paint overrides and per-door colors, if any, are as set in Edit Plan at the time of this export.', 0.09, { anchor: 'start', color: '#333' }));
    return bits.join('');
  });
}

function buildSheets(snap, info, lot) {
  const size = SIZES[info.size] || SIZES.tabloid;
  const sheets = sheetIndex(info, size);
  const areas = snap.areas || { heated: 0, garage: 0, porch: 0 };
  const out = [];
  for (const s of sheets) {
    let svg;
    if (s.id === 'A0') svg = drawCover(size.w, size.h, snap, info, sheets, areas);
    else if (s.id === 'A1') svg = drawA1(size.w, size.h, snap, info);
    else if (s.id === 'A2') svg = drawA2(size.w, size.h, snap, info, lot);
    else if (s.id === 'A3') svg = drawA3(size.w, size.h, snap, info);
    else if (s.id === 'A3.1') svg = drawA31(size.w, size.h, snap, info);
    else if (s.id === 'A4') svg = drawA4(size.w, size.h, snap, info);
    out.push({ ...s, svg, w: size.w, h: size.h });
  }
  return out;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing && existing.dataset.loaded === '1') return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => { s.dataset.loaded = '1'; resolve(); };
    s.onerror = () => reject(new Error('Could not load ' + src));
    document.head.appendChild(s);
  });
}
async function loadPdfLibs() {
  if (!window.jspdf || !window.jspdf.jsPDF) await loadScript('/vendor/jspdf.umd.min.js');
  if (!window.jspdf?.jsPDF?.API?.svg) await loadScript('/vendor/svg2pdf.umd.min.js');
  if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF failed to load from /vendor');
  return window.jspdf.jsPDF;
}

export async function exportPlansPdf(opts = {}) {
  const snap = getSnapshot();
  const info = savePlanInfo(snap, { ...loadPlanInfo(snap), ...opts });
  const lot = typeof snap.getLot === 'function' ? snap.getLot() : snap.lot || null;
  const sheets = buildSheets(snap, info, lot);
  const JsPDF = await loadPdfLibs();
  const size = SIZES[info.size] || SIZES.tabloid;
  const doc = new JsPDF({ orientation: 'landscape', unit: 'in', format: [size.w, size.h], compress: true });
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:0;height:0;overflow:hidden;';
  document.body.appendChild(host);
  try {
    for (let i = 0; i < sheets.length; i++) {
      if (i) doc.addPage([size.w, size.h], 'landscape');
      const el = parseSvg(sheets[i].svg);
      host.appendChild(el);
      await doc.svg(el, { x: 0, y: 0, width: size.w, height: size.h });
      host.removeChild(el);
    }
  } finally {
    host.remove();
  }
  const slug = (info.project || snap.title || 'plan').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const name = `PeakStead-plans-${slug || 'plan'}-${isoDate()}.pdf`;
  if (opts.returnBlob) {
    const blob = doc.output('blob');
    return { blob, name, sheets, info, size };
  }
  doc.save(name);
  return { name, sheets, info, size };
}

export function buildPlanSvgSet(opts = {}) {
  const snap = getSnapshot();
  const info = { ...loadPlanInfo(snap), ...opts };
  const lot = typeof snap.getLot === 'function' ? snap.getLot() : snap.lot || null;
  return { snap, info, lot, sheets: buildSheets(snap, info, lot) };
}

function ensure2dUi() {
  if ($('plan2d')) return $('plan2d');
  const wrap = document.createElement('div');
  wrap.id = 'plan2d';
  wrap.hidden = true;
  wrap.innerHTML = `
    <div class="plan2d-bar">
      <strong>2D floor plan</strong>
      <span class="plan2d-scale" id="plan2dScale"></span>
      <span class="plan2d-note">${esc(PRELIM)}</span>
      <span class="spacer"></span>
      <button type="button" id="plan2dExport">Export plans</button>
      <button type="button" id="plan2dClose">Close 2D</button>
    </div>
    <div class="plan2d-stage" id="plan2dStage"></div>`;
  document.body.appendChild(wrap);
  $('plan2dExport').onclick = () => openExportDialog();
  $('plan2dClose').onclick = () => setPlan2d(false);
  return wrap;
}

function floorPlanOnlySvg(snap, widthIn, heightIn) {
  const padBox = { x: 0.35, y: 0.2, w: widthIn - 0.7, h: heightIn - 0.9 };
  const b = boundsOf(snap);
  const pad = 6;
  const world = { x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad, w: b.w + pad * 2, h: b.h + pad * 2 };
  const scale = pickScale(world.w, world.h, padBox.w, padBox.h);
  const xf = xform(world, padBox, scale);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${widthIn}in" height="${heightIn}in" viewBox="0 0 ${widthIn} ${heightIn}">
    <rect x="0" y="0" width="${widthIn}" height="${heightIn}" fill="#fff"/>
    ${drawFloorPlan(xf, snap)}
    ${northArrow(0.5, heightIn - 0.35, 0.32)}
    ${scaleBar(1.2, heightIn - 0.5, scale, 1.6)}
    ${text(widthIn - 0.35, heightIn - 0.2, PRELIM, 0.08, { anchor: 'end', color: '#444' })}
  </svg>`;
  return { svg, scale };
}

function redraw2d() {
  const stage = $('plan2dStage');
  if (!stage || !plan2dOn) return;
  const snap = getSnapshot();
  const rec = stage.getBoundingClientRect();
  const w = Math.max(8, rec.width / 96);
  const h = Math.max(6, rec.height / 96);
  const { svg, scale } = floorPlanOnlySvg(snap, w, h);
  stage.innerHTML = svg;
  const el = stage.querySelector('svg');
  if (el) { el.style.width = '100%'; el.style.height = '100%'; }
  if ($('plan2dScale')) $('plan2dScale').textContent = 'Scale: ' + scale.name;
}

export function setPlan2d(on) {
  plan2dOn = !!on;
  const wrap = ensure2dUi();
  wrap.hidden = !plan2dOn;
  document.body.classList.toggle('plan2d-open', plan2dOn);
  if ($('bPlan2d')) { $('bPlan2d').classList.toggle('on', plan2dOn); $('bPlan2d').setAttribute('aria-pressed', plan2dOn ? 'true' : 'false'); }
  if (plan2dOn) {
    requestAnimationFrame(() => redraw2d());
    window.addEventListener('resize', redraw2d);
  } else {
    window.removeEventListener('resize', redraw2d);
  }
}
export function isPlan2d() { return plan2dOn; }

function ensureDialog() {
  if ($('exportPlansDlg')) return $('exportPlansDlg');
  const d = document.createElement('dialog');
  d.id = 'exportPlansDlg';
  d.innerHTML = `
    <form method="dialog" id="exportPlansForm" class="export-plans-form">
      <h2>Export plans</h2>
      <p class="export-lead">A multi-sheet architectural PDF of the current saved plan, including your edits. Suitable for preliminary city review — not for construction.</p>
      <label>Project name <input id="epProject" type="text" maxlength="80" required></label>
      <label>Project address <input id="epAddress" type="text" maxlength="120" placeholder="Street, city, state"></label>
      <label>Owner <input id="epOwner" type="text" maxlength="80"></label>
      <label>Revision <input id="epRev" type="text" maxlength="12" value="0"></label>
      <label>Sheet size
        <select id="epSize">
          <option value="tabloid">11″ × 17″ landscape (recommended)</option>
          <option value="arch-d">ARCH D — 36″ × 24″ landscape</option>
          <option value="letter">Letter — 11″ × 8.5″ landscape (fallback)</option>
        </select>
      </label>
      <label class="chk"><input type="checkbox" id="epSched" checked> Include door/window schedule and finish summary</label>
      <p class="export-note">${esc(PRELIM)}.</p>
      <div class="export-acts">
        <button type="button" value="cancel" id="epCancel">Cancel</button>
        <button type="submit" class="primary" id="epGo">Download PDF</button>
      </div>
      <p class="export-status" id="epStatus" hidden></p>
    </form>`;
  document.body.appendChild(d);
  $('epCancel').onclick = () => d.close();
  $('exportPlansForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const status = $('epStatus');
    status.hidden = false;
    status.textContent = 'Building PDF…';
    $('epGo').disabled = true;
    try {
      const res = await exportPlansPdf({
        project: $('epProject').value.trim(),
        address: $('epAddress').value.trim(),
        owner: $('epOwner').value.trim(),
        revision: $('epRev').value.trim() || '0',
        size: $('epSize').value,
        schedule: $('epSched').checked,
      });
      status.textContent = 'Saved ' + res.name;
      setTimeout(() => d.close(), 600);
    } catch (e) {
      console.error(e);
      status.textContent = 'Could not build the PDF: ' + (e.message || e);
    } finally {
      $('epGo').disabled = false;
    }
  });
  return d;
}

export function openExportDialog() {
  const snap = getSnapshot();
  const info = loadPlanInfo(snap);
  const d = ensureDialog();
  $('epProject').value = info.project;
  $('epAddress').value = info.address;
  $('epOwner').value = info.owner;
  $('epRev').value = info.revision || '0';
  $('epSize').value = info.size || 'tabloid';
  $('epSched').checked = info.schedule !== false;
  const st = $('epStatus'); if (st) { st.hidden = true; st.textContent = ''; }
  if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
}

function addButtons() {
  if ($('bPlan2d')) return;
  const btns = document.querySelector('#hud .btns');
  if (btns && !$('bPlan2d')) {
    const b2 = document.createElement('button');
    b2.id = 'bPlan2d';
    b2.type = 'button';
    b2.setAttribute('aria-pressed', 'false');
    b2.title = 'Crisp vector floor plan with dimensions';
    b2.textContent = '2D plan';
    b2.onclick = () => setPlan2d(!plan2dOn);
    const after = $('bTop') || $('bOrbit');
    if (after && after.nextSibling) btns.insertBefore(b2, after.nextSibling);
    else btns.appendChild(b2);
  }
  const addExport = (parent, id, cls) => {
    if (!parent || $(id)) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.id = id;
    if (cls) b.className = cls;
    b.textContent = 'Export plans';
    b.title = 'Download a professional multi-sheet PDF of this plan';
    b.onclick = () => openExportDialog();
    parent.appendChild(b);
  };
  addExport(document.querySelector('#topbar .topbar-actions'), 'exportPlansBtn', '');
  if (btns) addExport(btns, 'bExportPlans', '');
}

export function mountPlanExport(getter) {
  if (typeof getter === 'function') getSnapshot = getter;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/css/plan-export.css';
  document.head.appendChild(link);
  const start = () => {
    addButtons();
    const hookDrawer = () => {
      const acts = document.querySelector('#editDrawer .edit-actions');
      if (!acts || $('epEditBtn')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.id = 'epEditBtn';
      b.textContent = 'Export plans';
      b.title = 'Download a professional multi-sheet PDF of this plan';
      b.onclick = () => openExportDialog();
      const save = acts.querySelector('[data-act=save]');
      if (save) acts.insertBefore(b, save); else acts.appendChild(b);
    };
    hookDrawer();
    const obs = new MutationObserver(hookDrawer);
    obs.observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  window.addEventListener('peakstead-plan-changed', () => { if (plan2dOn) redraw2d(); });
  window.addEventListener('peakstead-areas', () => { if (plan2dOn) redraw2d(); });
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && plan2dOn && !document.getElementById('exportPlansDlg')?.open) setPlan2d(false);
  });
}

// test helpers
export const _test = { buildSheets, loadPlanInfo, fmtFtIn, boundsOf, SIZES, PRELIM, floorPlanOnlySvg };
