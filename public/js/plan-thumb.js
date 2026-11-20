// PeakStead Designs — house-card thumbnails and plan-preview fallbacks.
// Never leave a card with a blank or broken image.

const FLOOR_FILL = {
  wood: '#c4a574',
  tile: '#9aa7b0',
  concrete: '#8b9098',
  porch: '#c9b897',
  gym: '#8a8f7a',
  stone: '#a8a39a',
  terrace: '#b9a890',
  paver: '#9a9590',
  water: '#3a7ca5',
};

export function isPorchLike(room) {
  if (!room) return false;
  const name = String(room[0] || '');
  const floor = String(room[2] || '');
  const n = (name + ' ' + floor).toLowerCase();
  return !!(room[7] && room[7].outside) || /porch|patio|deck|terrace/.test(n);
}

export function isCoveredPorch(room) {
  if (!isPorchLike(room)) return false;
  const n = String(room[0] || '').toLowerCase();
  if (/uncovered|open patio|open deck/.test(n)) return false;
  if (/patio|deck|terrace/.test(n) && !/cover|porch/.test(n)) return false;
  return /porch|cover/.test(n) || String(room[2] || '') === 'porch';
}

export function houseFallbackSvg(title = 'Home') {
  const label = escapeXml(String(title || 'Home').slice(0, 28));
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="800" height="500" fill="#14191e"/>
  <rect x="40" y="40" width="720" height="420" rx="22" fill="#1b2229"/>
  <g transform="translate(400 268)">
    <path d="M-210 70 L-210 -10 L0 -150 L210 -10 L210 70 Z" fill="#2a323b" stroke="#3d4854" stroke-width="6"/>
    <path d="M-168 70 L-168 8 L-52 8 L-52 70 Z" fill="#d7c4a0"/>
    <path d="M52 70 L52 8 L168 8 L168 70 Z" fill="#d7c4a0"/>
    <rect x="-36" y="8" width="72" height="62" fill="#1a1f25"/>
    <path d="M-230 8 L0 -158 L230 8 L200 8 L0 -132 L-200 8 Z" fill="#DFB974"/>
    <path d="M20 -132 L200 8 L230 8 L0 -158 Z" fill="#F4F1EA"/>
    <rect x="-200" y="70" width="400" height="18" fill="#3d4854"/>
  </g>
  <text x="400" y="430" text-anchor="middle" fill="#c9c2b4" font-family="system-ui,sans-serif" font-size="28" font-weight="700">${label}</text>
</svg>`;
}

export function planThumbSvg(rooms, title = '') {
  const list = (rooms || []).filter((r) => Array.isArray(r) && r.length >= 7);
  if (!list.length) return houseFallbackSvg(title);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of list) {
    x0 = Math.min(x0, r[3], r[5]); y0 = Math.min(y0, r[4], r[6]);
    x1 = Math.max(x1, r[3], r[5]); y1 = Math.max(y1, r[4], r[6]);
  }
  const pad = 4;
  x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
  const bw = Math.max(8, x1 - x0), bh = Math.max(8, y1 - y0);
  const W = 800, H = 500, inset = 48;
  const scale = Math.min((W - inset * 2) / bw, (H - inset * 2 - (title ? 24 : 0)) / bh);
  const ox = (W - bw * scale) / 2 - x0 * scale;
  const oy = (H - bh * scale) / 2 - y0 * scale + (title ? 8 : 0);
  const tx = (x, y) => [+(ox + x * scale).toFixed(1), +(oy + y * scale).toFixed(1)];
  const parts = [];
  parts.push(`<rect width="${W}" height="${H}" fill="#14191e"/>`);
  parts.push(`<rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="18" fill="#1b2229"/>`);
  // lawn
  const [lx0, ly0] = tx(x0, y0), [lx1, ly1] = tx(x1, y1);
  parts.push(`<rect x="${lx0}" y="${ly0}" width="${lx1 - lx0}" height="${ly1 - ly0}" rx="8" fill="#2a3a2c"/>`);
  const heated = list.filter((r) => !(r[7] && r[7].outside) && !isPorchLike(r));
  const outdoor = list.filter((r) => (r[7] && r[7].outside) || isPorchLike(r));
  const drawRoom = (r) => {
    const ax = Math.min(r[3], r[5]), ay = Math.min(r[4], r[6]);
    const w = Math.abs(r[5] - r[3]), d = Math.abs(r[6] - r[4]);
    const [px, py] = tx(ax, ay);
    const rw = +(w * scale).toFixed(1), rd = +(d * scale).toFixed(1);
    const fill = FLOOR_FILL[r[2]] || ((r[7] && r[7].outside) ? '#c9b897' : '#d7c4a0');
    parts.push(`<rect x="${px}" y="${py}" width="${rw}" height="${rd}" fill="${fill}" stroke="#2a2620" stroke-width="1.4"/>`);
    if (rw > 36 && rd > 16) {
      const name = escapeXml(String(r[0] || '').split(' ').slice(0, 3).join(' '));
      const fs = Math.max(8, Math.min(13, Math.min(rw / 8, rd / 2.2)));
      parts.push(`<text x="${px + rw / 2}" y="${py + rd / 2 + 4}" text-anchor="middle" fill="#2a2620" font-family="system-ui,sans-serif" font-size="${fs.toFixed(1)}" font-weight="650">${name}</text>`);
    }
  };
  outdoor.forEach(drawRoom);
  heated.forEach(drawRoom);
  if (title) {
    parts.push(`<text x="${W / 2}" y="46" text-anchor="middle" fill="#e8e0d2" font-family="system-ui,sans-serif" font-size="18" font-weight="700">${escapeXml(title)}</text>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${parts.join('')}</svg>`;
}

export function svgDataUrl(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export function planThumbDataUrl(rooms, title = '') {
  return svgDataUrl(planThumbSvg(rooms, title));
}

export function houseFallbackDataUrl(title = 'Home') {
  return svgDataUrl(houseFallbackSvg(title));
}

export function exampleThumbSources(id, name = '') {
  const srcs = [];
  if (id) srcs.push('/img/' + encodeURIComponent(id) + '.jpg');
  srcs.push(houseFallbackDataUrl(name || id || 'Home'));
  return srcs;
}

function fileUrl(projectId, file) {
  return `/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(file.id)}`;
}

/** Ordered thumbnail candidates for a saved project. Last entry always renders. */
export function projectThumbSources(p) {
  const srcs = [];
  if (!p) return [houseFallbackDataUrl('Home')];
  const files = Array.isArray(p.files) ? p.files : [];
  const thumb = files.find((f) => f.kind === 'thumb' && f.id);
  const img = files.find((f) => f.kind === 'image' && f.id && String(f.contentType || 'image/').startsWith('image/'));
  if (thumb) srcs.push(fileUrl(p.id, thumb));
  if (p.id) srcs.push(`/api/projects/${encodeURIComponent(p.id)}/thumb`);
  if (p.exampleId) srcs.push('/img/' + encodeURIComponent(p.exampleId) + '.jpg');
  if (img && (!thumb || img.id !== thumb.id)) srcs.push(fileUrl(p.id, img));
  if (p.layout && Array.isArray(p.layout.rooms) && p.layout.rooms.length) {
    srcs.push(planThumbDataUrl(p.layout.rooms, p.name || ''));
  }
  srcs.push(houseFallbackDataUrl(p.name || 'Home'));
  return srcs;
}

export function bindThumbImg(img, sources) {
  if (!img) return;
  const srcs = (sources || []).filter(Boolean);
  if (!srcs.length) {
    img.src = houseFallbackDataUrl(img.alt || 'Home');
    return;
  }
  let i = 0;
  const apply = () => {
    if (i >= srcs.length) return;
    img.src = srcs[i];
  };
  const fail = () => {
    i += 1;
    apply();
  };
  img.addEventListener('error', fail);
  img.addEventListener('load', () => {
    if (!img.naturalWidth) fail();
  });
  apply();
}

function escapeXml(s) {
  return String(s || '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

export async function canvasToJpegBlob(canvas, quality = 0.86) {
  return new Promise((resolve, reject) => {
    if (!canvas || !canvas.toBlob) {
      reject(new Error('No canvas'));
      return;
    }
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not capture image'))), 'image/jpeg', quality);
  });
}
