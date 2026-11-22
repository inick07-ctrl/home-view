// PeakStead Designs — placeable fireplaces for Edit Plan (Add item → Fireplaces).
// Styles follow common real-world product patterns: masonry wood-burning (36/42/48" openings),
// linear gas (48/60/72" wide, ~16" tall glass), floor-to-ceiling stone statement walls,
// farmhouse shiplap with a timber mantel, two-sided see-through, a freestanding wood stove,
// and a mid-century low horizontal hearth. Item space: origin at footprint centre, +z = front
// (the room side), back face against the wall. Flames animate in the engine loop.
import * as THREE from 'three';

const MATS = {};
function mat(color, o = {}) {
  const key = color + '|' + (o.r ?? 0.8) + '|' + (o.m ?? 0) + '|' + (o.e ?? 0);
  return MATS[key] ||= new THREE.MeshStandardMaterial({
    color, roughness: o.r ?? 0.8, metalness: o.m ?? 0,
    emissive: o.e ? new THREE.Color(o.ec || color) : 0, emissiveIntensity: o.e || 0,
  });
}
function add(g, geom, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geom, material);
  m.position.set(x, y, z);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}
const B = (w, h, d) => new THREE.BoxGeometry(Math.max(w, 0.01), Math.max(h, 0.01), Math.max(d, 0.01));

// ---- surface textures (canvas, shared) ----
function canvasTex(draw, size = 256, rep = [1, 1]) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(rep[0], rep[1]);
  return t;
}
const rnd = (i) => { const x = Math.sin(i * 91.7) * 43758.5453; return x - Math.floor(x); };
let TEX = null;
function tex() {
  if (TEX) return TEX;
  TEX = {
    brick: canvasTex((g, s) => {
      g.fillStyle = '#d8d0c4'; g.fillRect(0, 0, s, s);
      const rows = 12;
      for (let y = 0; y < rows; y++) for (let x = -1; x < 5; x++) {
        const v = 120 + rnd(x * 13 + y * 7) * 50;
        g.fillStyle = `rgb(${v + 50},${v - 5},${v - 30})`;
        g.fillRect(x * s / 4 + (y % 2) * s / 8 + 2, y * s / rows + 2, s / 4 - 4, s / rows - 4);
      }
    }, 256),
    stone: canvasTex((g, s) => {
      g.fillStyle = '#5f5a52'; g.fillRect(0, 0, s, s);
      let i = 0;
      for (let y = 0; y < 8; y++) {
        let x = -rnd(y + 4) * s * 0.3;
        while (x < s) {
          const w = s * (0.16 + rnd(i + 2) * 0.22), v = 125 + rnd(i) * 70, warm = rnd(i + 9) * 22;
          g.fillStyle = `rgb(${v + warm},${v + warm * 0.55},${v - 8})`;
          g.fillRect(x + 2, y * s / 8 + 2, w - 4, s / 8 - 4);
          x += w; i++;
        }
      }
    }, 256),
    shiplap: canvasTex((g, s) => {
      g.fillStyle = '#f5f3ee'; g.fillRect(0, 0, s, s);
      for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(0,0,0,.13)'; g.fillRect(0, i * s / 6, s, 2); }
    }, 256),
    marble: canvasTex((g, s) => {
      // warm light marble / porcelain slab with soft grey-taupe veining
      g.fillStyle = '#e9e4dc'; g.fillRect(0, 0, s, s);
      for (let i = 0; i < 22; i++) {
        g.strokeStyle = `rgba(${120 + (i % 3) * 20},${110 + (i % 3) * 18},${100 + (i % 3) * 15},${0.08 + (i % 4) * 0.05})`;
        g.lineWidth = 1 + (i % 3);
        g.beginPath();
        let x = (i * 53) % s, y = 0;
        g.moveTo(x, y);
        while (y < s) { x += ((i * 37 + y) % 23) - 11; y += 14; g.lineTo(x, y); }
        g.stroke();
      }
    }, 512),
    flame: canvasTex((g, s) => {
      g.clearRect(0, 0, s, s);
      const grd = g.createLinearGradient(s / 2, s, s / 2, 0);
      grd.addColorStop(0, 'rgba(255,80,0,0)'); grd.addColorStop(0.15, 'rgba(255,90,10,.85)');
      grd.addColorStop(0.45, 'rgba(255,160,20,.8)'); grd.addColorStop(0.75, 'rgba(255,230,80,.55)');
      grd.addColorStop(1, 'rgba(255,255,200,0)');
      g.fillStyle = grd; g.beginPath(); g.moveTo(s * 0.5, s);
      g.bezierCurveTo(s * 0.05, s * 0.7, s * 0.15, s * 0.25, s * 0.5, 0);
      g.bezierCurveTo(s * 0.85, s * 0.25, s * 0.95, s * 0.7, s * 0.5, s); g.fill();
    }, 128),
  };
  if (TEX.flame) TEX.flame.wrapS = TEX.flame.wrapT = THREE.ClampToEdgeWrapping;
  return TEX;
}
function texMat(kind, w, h, color = '#ffffff') {
  const t = tex()[kind];
  if (!t) return mat(kind === 'brick' ? '#a9654a' : kind === 'stone' ? '#8f877a' : '#f3f1ec');
  const k = `${kind}|${w.toFixed(1)}|${h.toFixed(1)}|${color}`;
  if (MATS[k]) return MATS[k];
  const tt = t.clone(); tt.needsUpdate = true;
  const per = kind === 'brick' ? 2.0 : kind === 'stone' ? 2.6 : kind === 'marble' ? 6.0 : 3.0; // feet per texture tile
  tt.repeat.set(Math.max(1, w / per), Math.max(1, h / per));
  return (MATS[k] = new THREE.MeshStandardMaterial({ map: tt, color, roughness: kind === 'shiplap' ? 0.7 : kind === 'marble' ? 0.35 : 0.92 }));
}
const TIMBER = () => mat('#7b5334', { r: 0.75 });
const BLACK = () => mat('#141414', { r: 0.55, m: 0.25 });
const SOOT = () => mat('#1b1612', { r: 0.95 });

/**
 * Firebox + fire: opening `ow` × `oh` with the bottom at `y0`, front face at z = `zf`, depth `fd`.
 * kind 'wood' = logs + tall flames; 'gas' = glass front, ember bed, short ribbon of flames.
 * twoSided puts glass/opening on both faces (front at +zf, back at -zf).
 */
function firebox(g, { ow, oh, y0, zf, fd, kind = 'wood', twoSided = false }) {
  const zc = twoSided ? 0 : zf - fd / 2;
  const depth = twoSided ? zf * 2 : fd;
  // sooty liner (back + sides + floor + top), left open at the front(s)
  if (!twoSided) add(g, B(ow, oh, 0.08), SOOT(), 0, y0 + oh / 2, zf - fd + 0.04);
  add(g, B(0.08, oh, depth), SOOT(), -ow / 2 + 0.04, y0 + oh / 2, zc);
  add(g, B(0.08, oh, depth), SOOT(), ow / 2 - 0.04, y0 + oh / 2, zc);
  add(g, B(ow, 0.06, depth), SOOT(), 0, y0 + 0.03, zc);
  add(g, B(ow, 0.08, depth), SOOT(), 0, y0 + oh - 0.04, zc);
  const flames = [];
  const fmat = (i) => new THREE.MeshBasicMaterial({
    map: tex().flame, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    opacity: 0.7, color: i % 2 ? '#ffe08a' : '#ff9a3a', blending: THREE.AdditiveBlending,
  });
  const ember = new THREE.MeshStandardMaterial({ color: '#ff6a1a', emissive: '#ff4a00', emissiveIntensity: 1.3, roughness: 1 });
  if (kind === 'wood') {
    const logC = ['#3a2416', '#4a2e18', '#2a1a10', '#5a3820'];
    const n = Math.max(2, Math.round(ow / 1.1));
    for (let i = 0; i < n; i++) {
      const x = -ow / 2 + (i + 0.5) * ow / n;
      add(g, new THREE.CylinderGeometry(0.16, 0.18, Math.min(1.2, depth * 0.7), 10), mat(logC[i % 4], { r: 0.9 }), x, y0 + 0.24, zc, Math.PI / 2, 0, (i % 2 ? 0.25 : -0.25));
    }
    const em = add(g, B(ow - 0.4, 0.1, Math.min(1.2, depth * 0.7)), ember, 0, y0 + 0.1, zc); em.castShadow = false;
  } else {
    // ember / crushed-glass bed
    const em = add(g, B(ow - 0.25, 0.08, depth * 0.55), ember, 0, y0 + 0.1, zc); em.castShadow = false;
    for (let i = 0; i < Math.round(ow * 3); i++) {
      add(g, new THREE.SphereGeometry(0.06, 8, 6), mat(i % 3 ? '#cfc9bf' : '#7c766d', { r: 0.6 }), -ow / 2 + 0.2 + rnd(i) * (ow - 0.4), y0 + 0.16, zc + (rnd(i + 5) - 0.5) * depth * 0.4);
    }
  }
  const tall = kind === 'wood' ? Math.min(oh * 0.75, 2.2) : Math.min(oh * 0.7, 0.9);
  const nF = Math.max(3, Math.round(ow / (kind === 'wood' ? 0.6 : 0.42)));
  for (let i = 0; i < nF; i++) {
    const x = -ow / 2 + (i + 0.5) * ow / nF;
    const h = tall * (0.8 + (i % 3) * 0.12);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(kind === 'wood' ? 0.65 : 0.5, h), fmat(i));
    m.position.set(x, y0 + 0.18 + h / 2, zc + (twoSided ? 0 : 0.05));
    m.rotation.y = i % 2 ? 0.6 : -0.6;
    m.userData.flame = { baseH: h, phase: i * 1.3, y0: y0 + 0.18 };
    m.castShadow = m.receiveShadow = false;
    g.add(m); flames.push(m);
  }
  if (kind === 'gas') {
    const glass = new THREE.MeshStandardMaterial({ color: '#9fb8c6', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.18 });
    add(g, B(ow, oh, 0.03), glass, 0, y0 + oh / 2, zf - 0.02).castShadow = false;
    if (twoSided) add(g, B(ow, oh, 0.03), glass, 0, y0 + oh / 2, -zf + 0.02).castShadow = false;
  }
  for (const z of twoSided ? [zf + 0.6, -zf - 0.6] : [zf + 0.6]) {
    const light = new THREE.PointLight('#ffb056', kind === 'wood' ? 1.4 : 1.0, 16, 2);
    light.position.set(0, y0 + 1.0, z); light.castShadow = false;
    light.userData.fireLight = { base: light.intensity, t0: rnd(ow * 7) * 10 };
    g.add(light);
  }
  return flames;
}

function hearth(g, w, d, zf, col = '#3d3a36') {
  add(g, B(w, 0.3, d), mat(col, { r: 0.6 }), 0, 0.15, zf + d / 2 - 0.02);
}
function mantel(g, w, y, zf, col) {
  add(g, B(w, 0.5, 0.75), col || TIMBER(), 0, y + 0.25, zf + 0.3);
}

// ---------------- builders ----------------
function buildMasonry(g, rec) {
  const W = rec.w || 6, D = rec.d || 2.2, H = rec.h || 5.2;
  const open = rec.opening || 3.5; // ft (36" = 3.0)
  const oh = open * 0.78;
  const surf = rec.variant === 'stone' ? 'stone' : 'brick';
  const zf = D / 2 - 0.55;
  // chimney breast / surround
  add(g, B(W, H, D - 0.55), texMat(surf, W, H), 0, H / 2, -0.275);
  // carve the opening visually: firebox sits in front of the breast face
  firebox(g, { ow: open, oh, y0: 0.32, zf: zf + 0.02, fd: 1.6, kind: 'wood' });
  // arch/lintel band
  add(g, B(open + 0.6, 0.35, 0.12), mat(surf === 'brick' ? '#6f3e2c' : '#585249', { r: 0.9 }), 0, 0.32 + oh + 0.18, zf + 0.06);
  mantel(g, W + 0.4, 0.32 + oh + 0.75, zf, TIMBER());
  hearth(g, W + 0.6, 1.9, zf - 0.3, surf === 'brick' ? '#4a3f37' : '#3d3a36');
}

function buildLinear(g, rec) {
  const W = rec.w || 7.2, D = rec.d || 1.6, H = rec.h || 8;
  const open = rec.opening || 5; // 60" glass
  const oh = 1.35; // ~16" tall
  const y0 = 1.6;
  const zf = D / 2;
  const plaster = rec.variant === 'plaster';
  const face = plaster ? mat('#ece8e0', { r: 0.95 }) : mat('#d9d6cf', { r: 0.35, m: 0.05 });
  // bump-out surround in pieces around the opening so the flames are visible
  add(g, B(W, y0, D), face, 0, y0 / 2, 0);
  add(g, B(W, H - y0 - oh, D), face, 0, y0 + oh + (H - y0 - oh) / 2, 0);
  add(g, B((W - open) / 2, oh, D), face, -(W + open) / 4, y0 + oh / 2, 0);
  add(g, B((W - open) / 2, oh, D), face, (W + open) / 4, y0 + oh / 2, 0);
  if (!plaster) for (let i = 1; i < 4; i++) add(g, B(W + 0.01, 0.015, D + 0.01), mat('#bdb9b0', { r: 0.4 }), 0, y0 + oh + i * (H - y0 - oh) / 4, 0); // slab seams
  firebox(g, { ow: open, oh, y0, zf: zf - 0.02, fd: 1.1, kind: 'gas' });
  add(g, B(open + 0.2, 0.08, 0.06), BLACK(), 0, y0 + oh + 0.04, zf + 0.01);
  add(g, B(open + 0.2, 0.08, 0.06), BLACK(), 0, y0 - 0.04, zf + 0.01);
  // floating shelf / bench option look: thin slab ledge
  add(g, B(W, 0.18, 0.9), mat('#3a3734', { r: 0.5 }), 0, y0 - 0.5, zf + 0.42);
}

function buildStoneWall(g, rec) {
  const W = rec.w || 7.5, D = rec.d || 2.4, H = rec.h || 9;
  const linear = rec.variant === 'linear';
  const zf = D / 2;
  if (rec.variant === 'marble-slab') {
    // floor-to-ceiling book-matched slab with a low linear gas insert and a recessed TV niche above (no mantel)
    const open = Math.min(W - 1.6, rec.opening || 5), oh = 1.25, y0 = 0.95;
    const m = (w, h) => texMat('marble', w, h);
    add(g, B(W, y0, D), m(W, y0), 0, y0 / 2, 0);
    add(g, B(W, H - y0 - oh, D), m(W, H - y0 - oh), 0, y0 + oh + (H - y0 - oh) / 2, 0);
    add(g, B((W - open) / 2, oh, D), m((W - open) / 2, oh), -(W + open) / 4, y0 + oh / 2, 0);
    add(g, B((W - open) / 2, oh, D), m((W - open) / 2, oh), (W + open) / 4, y0 + oh / 2, 0);
    firebox(g, { ow: open, oh, y0, zf: zf - 0.02, fd: 1.2, kind: 'gas' });
    add(g, B(open + 0.2, 0.08, 0.06), BLACK(), 0, y0 + oh + 0.04, zf + 0.01);
    add(g, B(open + 0.2, 0.08, 0.06), BLACK(), 0, y0 - 0.04, zf + 0.01);
    return;
  }
  if (linear) {
    const open = Math.min(W - 2, rec.opening || 5), oh = 1.35, y0 = 1.8;
    const s = (w, h) => texMat('stone', w, h);
    add(g, B(W, y0, D), s(W, y0), 0, y0 / 2, 0);
    add(g, B(W, H - y0 - oh, D), s(W, H - y0 - oh), 0, y0 + oh + (H - y0 - oh) / 2, 0);
    add(g, B((W - open) / 2, oh, D), s((W - open) / 2, oh), -(W + open) / 4, y0 + oh / 2, 0);
    add(g, B((W - open) / 2, oh, D), s((W - open) / 2, oh), (W + open) / 4, y0 + oh / 2, 0);
    firebox(g, { ow: open, oh, y0, zf: zf - 0.02, fd: 1.2, kind: 'gas' });
    mantel(g, W * 0.7, y0 + oh + 1.1, zf - 0.05);
    add(g, B(W + 0.4, 0.35, 1.6), mat('#3d3a36', { r: 0.6 }), 0, 0.175, zf + 0.6);
  } else {
    const open = rec.opening || 3.5, oh = open * 0.8, y0 = 0.45;
    add(g, B(W, H, D - 0.5), texMat('stone', W, H), 0, H / 2, -0.25);
    firebox(g, { ow: open, oh, y0, zf: zf - 0.48, fd: 1.6, kind: 'wood' });
    mantel(g, W - 0.6, y0 + oh + 0.8, zf - 0.5);
    // raised stone hearth bench across the full width
    add(g, B(W + 0.3, 0.45, 1.7), texMat('stone', W, 0.45), 0, 0.225, zf + 0.35);
    add(g, B(W + 0.4, 0.08, 1.8), mat('#4a4640', { r: 0.6 }), 0, 0.49, zf + 0.35);
  }
}

function buildFarmhouse(g, rec) {
  const W = rec.w || 6.5, D = rec.d || 2.0, H = rec.h || 9;
  const open = rec.opening || 3.5, oh = open * 0.72, y0 = 0.35;
  const tint = rec.variant === 'greige' ? '#e3ddd2' : rec.variant === 'charcoal' ? '#3c3f42' : '#ffffff';
  add(g, B(W, H, D - 0.5), texMat('shiplap', W, H, tint), 0, H / 2, -0.25);
  // painted firebox surround (tile/plaster) + black insert
  add(g, B(open + 1.4, oh + 0.9, 0.1), mat('#efece6', { r: 0.6 }), 0, y0 + (oh + 0.9) / 2, D / 2 - 0.48);
  add(g, B(open + 0.3, oh + 0.25, 0.1), BLACK(), 0, y0 + (oh + 0.25) / 2, D / 2 - 0.42);
  firebox(g, { ow: open, oh, y0, zf: D / 2 - 0.36, fd: 1.4, kind: 'wood' });
  // chunky reclaimed beam mantel with corbels
  const my = y0 + oh + 1.15;
  add(g, B(W - 0.2, 0.62, 0.85), TIMBER(), 0, my, D / 2 - 0.12);
  for (const s of [-1, 1]) add(g, B(0.35, 0.7, 0.55), TIMBER(), s * (W / 2 - 0.6), my - 0.6, D / 2 - 0.25);
  hearth(g, open + 2.2, 1.6, D / 2 - 0.5, '#2f2d2b');
  // a couple of mantel accents
  add(g, new THREE.CylinderGeometry(0.12, 0.1, 0.5, 12), mat('#e8e2d6', { r: 0.4 }), -W * 0.3, my + 0.56, D / 2 - 0.12);
  add(g, B(1.4, 0.9, 0.06), mat('#c9b48e', { r: 0.6 }), W * 0.15, my + 0.76, D / 2 - 0.4);
}

function buildSeeThrough(g, rec) {
  const W = rec.w || 6.5, D = rec.d || 3.0, H = rec.h || 8;
  const open = rec.opening || 4, oh = 1.8, y0 = 1.4;
  const s = (w, h) => texMat('stone', w, h);
  add(g, B(W, y0, D), s(W, y0), 0, y0 / 2, 0);
  add(g, B(W, H - y0 - oh, D), s(W, H - y0 - oh), 0, y0 + oh + (H - y0 - oh) / 2, 0);
  add(g, B((W - open) / 2, oh, D), s((W - open) / 2, oh), -(W + open) / 4, y0 + oh / 2, 0);
  add(g, B((W - open) / 2, oh, D), s((W - open) / 2, oh), (W + open) / 4, y0 + oh / 2, 0);
  firebox(g, { ow: open, oh, y0, zf: D / 2 - 0.02, fd: D, kind: rec.variant === 'wood' ? 'wood' : 'gas', twoSided: true });
  for (const z of [1, -1]) add(g, B(W + 0.2, 0.12, 0.5), mat('#3a3734', { r: 0.5 }), 0, y0 - 0.06, z * (D / 2 + 0.2));
}

function buildStove(g, rec) {
  const W = rec.w || 3.2, D = rec.d || 3.2;
  const steel = mat(rec.variant === 'enamel-red' ? '#7a1f1a' : '#1d1d1d', { r: 0.5, m: 0.4 });
  // hearth pad
  add(g, B(W, 0.12, D), mat('#4a4743', { r: 0.7 }), 0, 0.06, 0);
  const bw = 2.0, bh = 2.3, bd = 1.7, by = 0.85;
  for (const s of [-1, 1]) for (const t of [-1, 1]) add(g, B(0.12, by - 0.12, 0.12), steel, s * (bw / 2 - 0.15), 0.12 + (by - 0.12) / 2, t * (bd / 2 - 0.15));
  add(g, B(bw, bh, bd), steel, 0, by + bh / 2, 0);
  add(g, B(bw + 0.12, 0.12, bd + 0.12), steel, 0, by + bh + 0.06, 0);
  // glass door window with fire
  firebox(g, { ow: 1.25, oh: 1.0, y0: by + 0.45, zf: bd / 2 + 0.01, fd: 1.2, kind: 'wood' });
  add(g, B(1.45, 0.1, 0.06), steel, 0, by + 1.5, bd / 2 + 0.02);
  add(g, B(1.45, 0.1, 0.06), steel, 0, by + 0.4, bd / 2 + 0.02);
  // stove pipe up toward the ceiling
  const top = (rec.h || 8.6) - (by + bh + 0.12);
  add(g, new THREE.CylinderGeometry(0.28, 0.28, top, 16), steel, 0, by + bh + 0.12 + top / 2, -0.25);
}

function buildMidCentury(g, rec) {
  const W = rec.w || 9, D = rec.d || 2.0, H = 2.1;
  const brick = rec.variant === 'brick';
  const face = brick ? texMat('brick', W, H) : mat('#dcd6cb', { r: 0.6 });
  const open = Math.min(W * 0.45, 4), oh = 1.1, y0 = 0.5;
  add(g, B(W, y0, D), face, 0, y0 / 2, 0);
  add(g, B(W, H - y0 - oh, D), face, 0, y0 + oh + (H - y0 - oh) / 2, 0);
  const side = (W - open) / 2;
  add(g, B(side, oh, D), face, -(W - side) / 2, y0 + oh / 2, 0);
  add(g, B(side, oh, D), face, (W - side) / 2, y0 + oh / 2, 0);
  firebox(g, { ow: open, oh, y0, zf: D / 2 - 0.02, fd: 1.3, kind: 'gas' });
  // long cantilevered walnut ledge (doubles as a bench) + a slim black hood band
  add(g, B(W + 1.2, 0.2, D + 0.3), mat('#5b3a24', { r: 0.6 }), 0.6, H + 0.1, 0.05);
  add(g, B(open + 0.3, 0.12, 0.08), BLACK(), 0, y0 + oh + 0.06, D / 2 + 0.02);
}

// ---------------- old-world limestone (antique French Louis XV style) ----------------
// Deep stepped cornice shelf, plain frieze with a bead, console (S-scroll) jambs with reeding that
// swell into the opening near the floor, a wide low sooty firebox, worn flagstone hearth slabs,
// wrought-iron andirons with brass ball finials and a plain plaster chimney breast up to the ceiling.
let OW = null;
function owTex() {
  if (OW) return OW;
  const lime = (base, soot) => canvasTex((g, s) => {
    // warm grey-beige French limestone: broad cloudy mottling, fine pitting, rust/ochre blooms, grime streaks
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    const blob = (x, y, r, c) => { const grd = g.createRadialGradient(x, y, 0, x, y, r); grd.addColorStop(0, c); grd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2); };
    let i = 0;
    for (; i < 260; i++) { // big soft clouds (light + dark), wrapped so the tile repeats cleanly
      const r = 40 + rnd(i * 3 + 1) * 120, x = rnd(i * 5 + 2) * s, y = rnd(i * 7 + 3) * s, v = rnd(i * 11 + 4), w = rnd(i * 13 + 5);
      const c = v < 0.5 ? `rgba(${104 + w * 26},${96 + w * 18},${82 + w * 8},${0.05 + v * 0.1})` : `rgba(${222 + w * 18},${212 + w * 14},${190 + w * 6},${0.05 + (v - 0.5) * 0.12})`;
      for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) if (x + dx > -r && x + dx < s + r && y + dy > -r && y + dy < s + r) blob(x + dx, y + dy, r, c);
    }
    for (let j = 0; j < 700; j++) { // small mottles
      const r = 4 + rnd(j * 3 + 7) * 22, v = rnd(j * 11 + 8);
      blob(rnd(j * 5 + 9) * s, rnd(j * 7 + 10) * s, r, v < 0.6 ? `rgba(92,84,70,${0.06 + v * 0.1})` : `rgba(236,228,210,${0.08 + (v - 0.6) * 0.2})`);
    }
    for (let j = 0; j < 30; j++) blob(rnd(j * 43 + 1) * s, rnd(j * 47 + 2) * s, 10 + rnd(j * 53) * 34, `rgba(160,118,62,${0.06 + rnd(j * 59) * 0.08})`); // ochre iron stains
    for (let j = 0; j < 2200; j++) { // pits, fossil specks
      const v = rnd(j * 17 + 9);
      g.fillStyle = v < 0.72 ? `rgba(70,62,52,${0.08 + v * 0.2})` : `rgba(246,240,226,${0.15 + (v - 0.72) * 0.9})`;
      const sz = v > 0.93 ? 2 : 1;
      g.fillRect(rnd(j * 19 + 6) * s, rnd(j * 23 + 7) * s, sz + (v > 0.985 ? 1 : 0), sz);
    }
    for (let j = 0; j < 34; j++) { // vertical weathering / grime streaks
      const x = rnd(j * 29 + 3) * s, w = 2 + rnd(j * 31) * 16, h = s * (0.25 + rnd(j * 37) * 0.75), y = rnd(j * 41) * s * 0.5;
      const grd = g.createLinearGradient(0, y, 0, y + h);
      grd.addColorStop(0, `rgba(54,47,38,${soot})`); grd.addColorStop(1, 'rgba(54,47,38,0)');
      g.fillStyle = grd; g.fillRect(x, y, w, h);
    }
  }, 512);
  const rubble = canvasTex((g, s) => {
    // aged firebox: irregular rough stone/brick courses, heavily blackened toward the top
    g.fillStyle = '#0d0b09'; g.fillRect(0, 0, s, s);
    let y = 0, i = 0;
    while (y < s) {
      const rh = s * (0.1 + rnd(i * 3 + 1) * 0.1);
      let x = -rnd(i + 2) * s * 0.15;
      while (x < s) {
        const w = s * (0.14 + rnd(i * 7 + 3) * 0.3), v = rnd(i * 11 + 4), warm = rnd(i * 13 + 5);
        const t = 1 - y / s; // 1 at bottom (lit), 0 at top (sooty)
        const L = 22 + t * t * 70 + v * 28;
        g.fillStyle = `rgb(${L + warm * 22 + t * 18},${L * 0.86 + warm * 10},${L * 0.72})`;
        g.beginPath(); // slightly irregular, rounded block
        const j = (k) => (rnd(i * 17 + k) - 0.5) * 10, x0 = x + 2 + rnd(i * 5) * 4, y0 = y + 2 + rnd(i * 9) * 5, x1 = x + w - 2 - rnd(i * 6) * 4, y1 = y + rh - 2 - rnd(i * 8) * 5, r = 9;
        g.moveTo(x0 + r + j(1), y0 + j(2)); g.lineTo(x1 - r + j(3), y0 + j(4)); g.quadraticCurveTo(x1 + j(5), y0, x1 + j(6), y0 + r);
        g.lineTo(x1 + j(7), y1 - r); g.quadraticCurveTo(x1, y1 + j(8), x1 - r, y1 + j(9)); g.lineTo(x0 + r + j(10), y1 + j(11));
        g.quadraticCurveTo(x0 + j(12), y1, x0 + j(13), y1 - r); g.lineTo(x0 + j(14), y0 + r); g.closePath(); g.fill();
        for (let k = 0; k < 40; k++) { // pitted face
          g.fillStyle = `rgba(0,0,0,${0.1 + rnd(i * 23 + k) * 0.25})`;
          g.fillRect(x + 4 + rnd(i * 29 + k) * (w - 8), y + 4 + rnd(i * 31 + k) * (rh - 8), 2, 2);
        }
        x += w; i++;
      }
      y += rh;
    }
    const sootG = g.createLinearGradient(0, 0, 0, s); // heavy soot from the top down
    sootG.addColorStop(0, 'rgba(6,5,4,.92)'); sootG.addColorStop(0.45, 'rgba(8,6,5,.6)'); sootG.addColorStop(0.8, 'rgba(10,8,6,.15)'); sootG.addColorStop(1, 'rgba(10,8,6,0)');
    g.fillStyle = sootG; g.fillRect(0, 0, s, s);
    for (let j = 0; j < 46; j++) { // soot plumes
      const x = rnd(j * 3) * s, yy = rnd(j * 5) * s * 0.75, r = 18 + rnd(j * 7) * 70;
      const gr = g.createRadialGradient(x, yy, 0, x, yy, r);
      gr.addColorStop(0, 'rgba(4,3,2,.45)'); gr.addColorStop(1, 'rgba(4,3,2,0)');
      g.fillStyle = gr; g.fillRect(x - r, yy - r, r * 2, r * 2);
    }
  }, 512);
  const glow = canvasTex((g, s) => { // warm fire glow on the firebox walls (bottom-centre hot)
    g.fillStyle = '#000'; g.fillRect(0, 0, s, s);
    const gr = g.createRadialGradient(s / 2, s * 1.05, 0, s / 2, s * 1.05, s * 0.85);
    gr.addColorStop(0, 'rgba(255,170,90,1)'); gr.addColorStop(0.35, 'rgba(200,90,30,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  }, 128);
  OW = {
    lime: lime('#dacbb0', 0.1),
    limeDark: lime('#9d927f', 0.22),
    brick: rubble,
    glow,
    plaster: canvasTex((g, s) => {
      g.fillStyle = '#f1ebe0'; g.fillRect(0, 0, s, s);
      for (let j = 0; j < 4000; j++) {
        const v = rnd(j * 7 + 1);
        g.fillStyle = v < 0.5 ? `rgba(160,150,132,${0.05 + v * 0.08})` : `rgba(255,252,244,${0.05 + (v - 0.5) * 0.12})`;
        const r = 1 + rnd(j * 3) * 3; g.fillRect(rnd(j * 11) * s, rnd(j * 13) * s, r, r);
      }
    }, 256),
    wicker: canvasTex((g, s) => {
      g.fillStyle = '#8a6a44'; g.fillRect(0, 0, s, s);
      const n = 16;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const l = ((x + y) % 2) ? '#b08a5a' : '#9a7648';
        g.fillStyle = l; g.fillRect(x * s / n + 1, y * s / n + 1, s / n - 2, s / n - 2);
        g.fillStyle = 'rgba(255,240,200,.18)'; g.fillRect(x * s / n + 2, y * s / n + 2, s / n - 4, 2);
      }
    }, 128),
  };
  return OW;
}
const owMats = {};
// limestone material; `per` = feet per texture tile for geometry whose UVs are in feet (extrusions)
function limeMat(kind = 'lime', rx = 1, ry = 1, tint = '#ffffff') {
  const key = kind + rx.toFixed(2) + ry.toFixed(2) + tint;
  if (owMats[key]) return owMats[key];
  const t = owTex()[kind];
  if (!t) return (owMats[key] = mat(kind === 'brick' ? '#3a2e24' : '#b2aa9b', { r: 0.95 }));
  const tt = t.clone(); tt.needsUpdate = true; tt.repeat.set(rx, ry);
  const m = new THREE.MeshStandardMaterial({ map: tt, color: tint, roughness: kind === 'wicker' ? 0.85 : 0.93 });
  if (kind === 'lime' || kind === 'limeDark') { m.emissiveMap = tt; m.emissive = new THREE.Color('#cdbb9c'); m.emissiveIntensity = 0.16; } // pale limestone bounce light
  return (owMats[key] = m);
}
const boxL = (w, h, kind = 'lime', tint) => limeMat(kind, Math.max(0.35, w / 4), Math.max(0.35, h / 4), tint);

let OWF = null;
function owFlameTex() {
  if (OWF) return OWF;
  const mk = (draw) => { const t = canvasTex(draw, 256); if (t) t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; };
  const tongue = (g, s, w, blur, stops) => {
    g.clearRect(0, 0, s, s); g.filter = `blur(${blur}px)`;
    const grd = g.createLinearGradient(0, s, 0, 0);
    stops.forEach(([o, c]) => grd.addColorStop(o, c));
    g.fillStyle = grd; g.beginPath(); g.moveTo(s * 0.5, s * 0.97);
    g.bezierCurveTo(s * (0.5 - w), s * 0.85, s * (0.5 - w * 0.75), s * 0.42, s * 0.47, s * 0.08);
    g.bezierCurveTo(s * 0.52, s * 0.3, s * (0.5 + w * 0.9), s * 0.45, s * (0.5 + w * 0.55), s * 0.2);
    g.bezierCurveTo(s * (0.5 + w * 1.05), s * 0.55, s * (0.5 + w), s * 0.85, s * 0.5, s * 0.97); g.fill(); g.filter = 'none';
  };
  OWF = {
    outer: mk((g, s) => tongue(g, s, 0.36, 10, [[0, 'rgba(255,60,0,0)'], [0.08, 'rgba(255,70,10,.75)'], [0.4, 'rgba(255,110,20,.55)'], [0.8, 'rgba(220,60,10,.2)'], [1, 'rgba(160,30,0,0)']])),
    mid: mk((g, s) => tongue(g, s, 0.3, 7, [[0, 'rgba(255,150,40,0)'], [0.1, 'rgba(255,190,70,.85)'], [0.5, 'rgba(255,150,40,.55)'], [0.85, 'rgba(255,110,20,.15)'], [1, 'rgba(255,90,10,0)']])),
    core: mk((g, s) => tongue(g, s, 0.26, 6, [[0, 'rgba(255,250,220,0)'], [0.08, 'rgba(255,250,215,.95)'], [0.45, 'rgba(255,220,130,.6)'], [1, 'rgba(255,180,60,0)']])),
    lick: mk((g, s) => tongue(g, s, 0.22, 5, [[0, 'rgba(255,120,30,0)'], [0.15, 'rgba(255,150,50,.8)'], [0.7, 'rgba(255,90,20,.3)'], [1, 'rgba(255,60,0,0)']])),
    pool: mk((g, s) => { g.clearRect(0, 0, s, s); const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,150,60,.9)'); gr.addColorStop(0.45, 'rgba(255,90,20,.4)'); gr.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }),
  };
  return OWF;
}

// age/soot staining baked into vertex colours: fn(x, y, z) -> darkening 0..1 (item space)
function sootify(geo, fn, toItem = (x, y, z) => [x, y, z]) {
  const p = geo.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const [x, y, z] = toItem(p.getX(i), p.getY(i), p.getZ(i));
    const d = Math.max(0, Math.min(0.85, fn(x, y, z)));
    c[i * 3] = 1 - d; c[i * 3 + 1] = 1 - d * 1.04; c[i * 3 + 2] = 1 - d * 1.1;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return geo;
}
function vcMat(m) { const k = m.uuid + '|vc'; return owMats[k] ||= Object.assign(m.clone(), { vertexColors: true }); }
function glowMat(kind, rx, ry, I) {
  const k = 'glow|' + kind + rx.toFixed(2) + ry.toFixed(2) + I;
  if (owMats[k]) return owMats[k];
  const m = limeMat(kind, rx, ry).clone();
  const gt = owTex().glow; if (gt) { m.emissiveMap = gt; m.emissive = new THREE.Color('#ff8a3c'); m.emissiveIntensity = I; }
  return (owMats[k] = m);
}

function buildOldWorld(g, rec) {
  const H = rec.h || 9;
  const W = rec.w || 8.2;                       // overall mantel width (outer jamb to outer jamb)
  const D = rec.d || 3.55;
  const styled = rec.variant !== 'plain';
  const JW = Math.min(1.25, W * 0.15);          // jamb width
  const xi = W / 2 - JW;                        // inner jamb line (top of the opening)
  const ow = xi * 2;
  const y0 = 0.22;                              // hearth top
  const oh = Math.min(ow * 0.7, 3.8);          // opening height (wide + low, as in the photo)
  const JH = y0 + oh;                           // underside of the frieze
  const FH = Math.max(0.62, W * 0.085);         // frieze band height
  const CH = 0.72;                              // cornice / shelf height
  const shelfTop = JH + FH + CH;
  const zb = -D / 2;                            // back (wall)
  const zP = zb + 1.0;                          // chimney-breast face
  const JD = 0.85;                              // jamb projection
  const zJ = zP + JD;                           // jamb face
  const zF = zJ - 0.05;                         // frieze face
  const LIME = limeMat('lime', 0.25, 0.25);     // extrusions carry UVs in feet
  const SLIME = vcMat(LIME);
  const sst = (a, b, v) => Math.max(0, Math.min(1, (v - a) / (b - a)));
  // soot climbs the inner jamb faces toward the lintel; grime at the feet
  const jambSoot = (x, y) => 0.42 * (1 - sst(xi - 0.5, xi + 0.55, Math.abs(x))) * (0.35 + 0.65 * sst(0, JH, y)) + 0.12 * (1 - sst(0, 0.5, y));
  // frieze: smoke-darkened over the opening, strongest at the lintel and centre
  const friezeSoot = (x, y) => 0.42 * (1 - sst(ow * 0.15, ow * 0.62, Math.abs(x))) * (1 - sst(JH, JH + FH * 1.1, y)) + 0.08 * (1 - sst(JH, JH + FH, y)) + 0.03;

  // ---- chimney breast: plaster above the shelf (to the ceiling), mass behind the mantel below it
  const BW = W * 0.78;
  if (H > shelfTop + 0.05) add(g, B(BW, H - shelfTop, zP - zb), limeMat('plaster', BW / 3, (H - shelfTop) / 3), 0, shelfTop + (H - shelfTop) / 2, (zb + zP) / 2);
  add(g, B(JW, shelfTop, zP - zb), boxL(JW, shelfTop), -(xi + JW / 2), shelfTop / 2, (zb + zP) / 2);
  add(g, B(JW, shelfTop, zP - zb), boxL(JW, shelfTop), xi + JW / 2, shelfTop / 2, (zb + zP) / 2);
  add(g, B(ow, shelfTop - JH, zP - zb), boxL(ow, 1), 0, JH + (shelfTop - JH) / 2, (zb + zP) / 2);

  // ---- console jambs: front elevation with the S-scroll swelling into the opening, extruded + softened
  const bulge = [[0, 0.34], [0.42, 0.34], [0.5, 0.2], [0.62, 0.17], [1.0, 0.36], [1.35, 0.4], [1.75, 0.27], [2.2, 0.09], [2.6, 0.02]];
  const sc = oh / 3.1; // scale the scroll to the opening height
  const prof = bulge.map(([y, b]) => [y * sc, 0.8 * b * Math.min(1, sc * 1.05)]);
  const innerAt = (y) => { // bulge at height y (linear between keys, 0 above)
    for (let i = 1; i < prof.length; i++) if (y <= prof[i][0]) { const [ya, ba] = prof[i - 1], [yb, bb] = prof[i]; return ba + (bb - ba) * (y - ya) / Math.max(1e-6, yb - ya); }
    return y > JH - 0.32 ? 0.1 : 0; // capital
  };
  const jamb = (side) => {
    const s = new THREE.Shape();
    const X = (x) => side * x;
    s.moveTo(X(W / 2), 0);
    s.lineTo(X(xi - prof[0][1]), 0);
    s.lineTo(X(xi - prof[1][1]), prof[1][0]);
    s.splineThru(prof.slice(2).map(([y, b]) => new THREE.Vector2(X(xi - b), y)));
    s.lineTo(X(xi), JH - 0.34);
    s.quadraticCurveTo(X(xi - 0.12), JH - 0.28, X(xi - 0.12), JH - 0.14);
    s.lineTo(X(xi - 0.12), JH);
    s.lineTo(X(W / 2), JH);
    s.lineTo(X(W / 2), 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: JD - 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 3, curveSegments: 18, steps: 1 });
    sootify(geo, (x, y) => jambSoot(x, y));
    const m = add(g, geo, SLIME, 0, 0, zP + 0.04);
    // reeding: raised rounded ribs that follow the scroll on the jamb face
    for (const [o, wdt] of [[0.12, 0.07], [0.27, 0.07], [0.42, 0.07]]) {
      const pts = [];
      for (let k = 0; k <= 26; k++) { const y = 0.5 * sc + (JH - 0.5 * sc - 0.42) * k / 26; pts.push([xi - innerAt(y) + o, y]); }
      const r = new THREE.Shape();
      r.moveTo(X(pts[0][0]), pts[0][1]);
      for (const [x, y] of pts.slice(1)) r.lineTo(X(x), y);
      for (const [x, y] of pts.slice().reverse()) r.lineTo(X(x + wdt), y);
      const rg = new THREE.ExtrudeGeometry(r, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.012, bevelSegments: 2 });
      sootify(rg, (x, y) => jambSoot(x, y) * 0.9);
      add(g, rg, vcMat(limeMat('lime', 0.25, 0.25, '#ece5d8')), 0, 0, zJ + 0.005);
    }
    return m;
  };
  jamb(1); jamb(-1);

  // ---- frieze band + bead along the lintel, a fillet above
  const fg = new THREE.BoxGeometry(W, FH, zF - zP, 28, 6, 1);
  sootify(fg, friezeSoot, (x, y, z) => [x, y + JH + FH / 2, z]);
  add(g, fg, vcMat(boxL(W, FH)), 0, JH + FH / 2, (zP + zF) / 2);
  const bead = new THREE.CylinderGeometry(0.06, 0.06, ow - 0.1, 14);
  const bdM = add(g, bead, mat('#6f675a', { r: 0.95 }), 0, JH + 0.07, zF + 0.01, 0, 0, Math.PI / 2); // smoke-blackened lintel bead
  add(g, B(W + 0.04, 0.08, 0.1), boxL(W, 0.1), 0, JH + FH - 0.04, zF + 0.03);
  // soot smudged up the frieze above the fire
  const sootTex = canvasTex((c, s) => { const gr = c.createLinearGradient(0, s, 0, 0); gr.addColorStop(0, 'rgba(20,16,12,.55)'); gr.addColorStop(1, 'rgba(20,16,12,0)'); c.fillStyle = gr; c.fillRect(0, 0, s, s); }, 64);
  if (sootTex) {
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(ow * 0.6, FH * 0.75), new THREE.MeshBasicMaterial({ map: sootTex, transparent: true, depthWrite: false }));
    sp.position.set(0, JH + FH * 0.37, zF + 0.072); g.add(sp);
  }

  // ---- deep stepped cornice shelf (ogee + cove + rounded nose), extruded along the width
  const cs = new THREE.Shape();
  const bk = zF - zP;
  cs.moveTo(-bk, 0); cs.lineTo(0.06, 0); cs.lineTo(0.06, 0.05);
  cs.bezierCurveTo(0.2, 0.06, 0.12, 0.26, 0.3, 0.27);       // ogee
  cs.lineTo(0.34, 0.27); cs.lineTo(0.34, 0.33);              // fillet
  cs.quadraticCurveTo(0.36, 0.45, 0.52, 0.46);              // cove
  cs.lineTo(0.6, 0.46);
  cs.bezierCurveTo(0.68, 0.46, 0.7, 0.6, 0.66, 0.66);       // rounded nose
  cs.lineTo(0.66, CH); cs.lineTo(-bk, CH); cs.lineTo(-bk, 0);
  const L = W + 0.55;
  const cg = new THREE.ExtrudeGeometry(cs, { depth: L, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 2, curveSegments: 14 });
  // under the shelf + low mouldings carry grime; the top/nose is worn lighter
  sootify(cg, (x, y, z) => 0.3 * (1 - sst(0.05, 0.5, y)) * (0.55 + 0.45 * (1 - sst(0, L / 2, Math.abs(x)))) + 0.03 - 0.06 * sst(0.6, CH, y), (x, y, z) => [L / 2 - z, y, x]);
  const cm = add(g, cg, SLIME, L / 2, JH + FH, zF, 0, -Math.PI / 2, 0);

  // ---- firebox: splayed sooty brick sides + back, smoke-shelf ceiling, all closed to the jambs
  const fbBack = zb + 0.12, bwid = ow * 0.8;
  add(g, B(bwid, oh, 0.1), glowMat('brick', bwid / 3.6, 1, 0.55), 0, y0 + oh / 2, fbBack);
  for (const sd of [-1, 1]) {
    const dx = xi - bwid / 2, dz = zP - fbBack, len = Math.hypot(dx, dz);
    const sw = add(g, B(0.1, oh, len), glowMat('brick', len / 3.6, 1, 0.35), sd * (bwid / 2 + dx / 2), y0 + oh / 2, (fbBack + zP) / 2);
    sw.rotation.y = sd * Math.atan2(dx, dz);
  }
  add(g, B(ow, 0.1, zP - fbBack), SOOT(), 0, JH + 0.05, (fbBack + zP) / 2);

  // ---- worn flagstone hearth: big uneven slabs out front and inside, over a dark mortar bed
  add(g, B(W + 0.7, y0 - 0.04, zJ + 1.7 - fbBack + 0.02), mat('#6a645a', { r: 1 }), 0, (y0 - 0.04) / 2, (fbBack + zJ + 1.7) / 2);
  const slab = (x0, x1, z0, z1, i) => {
    const h = y0 - 0.02 + (rnd(i * 3) - 0.5) * 0.03;
    const w = x1 - x0 - 0.035, d = z1 - z0 - 0.035;
    const m = add(g, B(w, h, d), boxL(w, d, 'lime', i % 2 ? '#f2ede4' : '#e4ddd0'), (x0 + x1) / 2, h / 2, (z0 + z1) / 2);
    m.rotation.y = (rnd(i * 7) - 0.5) * 0.012;
  };
  const xs = [-W / 2 - 0.35, -W * 0.24, W * 0.12, W / 2 + 0.35];
  xs.slice(0, -1).forEach((x, i) => slab(x, xs[i + 1], zJ, zJ + 1.7, i + 1));
  slab(-xi + 0.02, -0.15, fbBack + 0.05, zJ, 7); slab(-0.15, xi - 0.02, fbBack + 0.05, zJ, 8);

  // ---- fire: crossed logs on the andiron bars, glowing ember bed, animated flame planes, warm lights
  const fz = (fbBack + zJ) / 2 - 0.05;
  const ember = new THREE.MeshStandardMaterial({ color: '#9a3412', emissive: '#ff4a00', emissiveIntensity: 0.65, roughness: 1 });
  const ash = add(g, B(ow * 0.5, 0.05, 1.1), mat('#2a2420', { r: 1 }), 0, y0 + 0.025, fz); ash.castShadow = false;
  for (let i = 0; i < 46; i++) { // bed of glowing coals under the logs
    const c = add(g, new THREE.DodecahedronGeometry(0.06 + rnd(i * 5) * 0.05, 0), i % 2 ? ember : mat('#2a1a12', { r: 1 }), (rnd(i * 3) - 0.5) * ow * 0.42, y0 + 0.07, fz + (rnd(i * 7) - 0.5) * 0.9);
    c.rotation.set(rnd(i), rnd(i + 1) * 3, 0); c.castShadow = false;
  }
  const bark = mat('#3a2a1d', { r: 0.95 }), charred = mat('#1a1410', { r: 1 });
  const logs = [[-0.3, 0.44, 0.35, 2.3], [0.35, 0.46, -0.3, 2.1], [0.0, 0.42, 0.05, 2.4], [0.1, 0.78, 0.5, 1.9], [-0.15, 0.8, -0.45, 1.8]];
  logs.forEach(([x, y, ry, len], i) => {
    const lg = add(g, new THREE.CylinderGeometry(0.2, 0.22, Math.min(len, ow * 0.55), 12), i % 3 === 2 ? charred : bark, x, y0 + y, fz, 0, ry, Math.PI / 2);
    // glowing log end
    const endM = new THREE.Mesh(new THREE.CircleGeometry(0.19, 12), ember);
    lg.add(endM); endM.position.set(0, Math.min(len, ow * 0.55) / 2 + 0.002, 0); endM.rotation.x = -Math.PI / 2;
  });
  // layered, soft flames: wide deep-orange outer tongues, brighter yellow mid tongues, a pale core
  // and small licks off the logs; all additive so overlaps bloom. Each flickers on its own phase.
  const ft = owFlameTex();
  const fl = (texK, color, op) => new THREE.MeshBasicMaterial({ map: ft[texK], color, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: op, blending: THREE.AdditiveBlending });
  const fTall = Math.min(oh * 0.78, 2.7);
  const layers = [
    // [texture, colour, op, x(frac of ow), height k, width, rotY, sway]
    ['outer', '#ff5a14', 0.55, 0.0, 1.0, 1.5, 0.0, 0.07], ['outer', '#ff6a1c', 0.5, -0.17, 0.78, 1.25, 0.7, 0.08], ['outer', '#ff6a1c', 0.5, 0.18, 0.82, 1.25, -0.7, 0.08],
    ['outer', '#ff5a14', 0.45, 0.02, 0.9, 1.3, 1.57, 0.06], ['outer', '#e8480e', 0.4, -0.33, 0.5, 0.9, -0.3, 0.1], ['outer', '#e8480e', 0.4, 0.34, 0.48, 0.9, 0.3, 0.1],
    ['mid', '#ffb23c', 0.7, -0.04, 0.78, 0.85, 0.35, 0.06], ['mid', '#ffb23c', 0.7, 0.08, 0.7, 0.8, -0.45, 0.06], ['mid', '#ffc04a', 0.6, -0.2, 0.5, 0.6, 1.2, 0.08], ['mid', '#ffc04a', 0.6, 0.22, 0.46, 0.6, -1.1, 0.08],
    ['core', '#fff0b8', 0.75, 0.0, 0.42, 0.55, 0.0, 0.05], ['core', '#ffe6a0', 0.7, 0.05, 0.36, 0.5, 1.57, 0.05],
    ['lick', '#ff8a2a', 0.6, -0.27, 0.32, 0.35, 0.2, 0.12], ['lick', '#ff8a2a', 0.6, 0.29, 0.3, 0.35, -0.2, 0.12], ['lick', '#ffa040', 0.55, -0.1, 0.28, 0.3, 0.9, 0.12],
  ];
  layers.forEach(([tk, col, op, xf, hk, wk, ry, sway], i) => {
    const h = fTall * hk, fy0 = y0 + 0.5;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wk, h), fl(tk, col, op));
    m.position.set(xf * ow * 0.42, fy0 + h / 2, fz + (rnd(i + 3) - 0.5) * 0.25); m.rotation.y = ry;
    m.userData.flame = { baseH: h, phase: 0.6 + i * 0.83, y0: fy0, op: op / 0.55, sway };
    m.renderOrder = 3; m.castShadow = m.receiveShadow = false; g.add(m);
  });
  // warm ember glow pooled on the ash bed and spilling onto the hearth stones
  for (const [gw, gd, gz, op] of [[ow * 0.7, 1.5, fz, 0.85], [ow * 0.95, 1.6, zJ + 0.45, 0.32]]) {
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(gw, gd), new THREE.MeshBasicMaterial({ map: ft.pool, color: '#ff7a2a', transparent: true, depthWrite: false, opacity: op, blending: THREE.AdditiveBlending }));
    gm.rotation.x = -Math.PI / 2; gm.position.set(0, y0 + 0.012 + (gz === fz ? 0.04 : 0), gz);
    gm.userData.emberGlow = { base: op, t0: rnd(gz * 13) * 10 }; gm.renderOrder = 2; g.add(gm);
  }
  for (const [z, I, dist] of [[zJ + 1.0, 1.8, 18], [fz - 0.2, 0.9, 3.6], [zJ + 0.3, 0.5, 5]]) {
    const light = new THREE.PointLight(z === zJ + 0.3 ? '#ff7a30' : '#ffa04a', I, dist, 2);
    light.position.set(0, y0 + 1.0, z); light.castShadow = false;
    light.userData.fireLight = { base: I, t0: rnd(W * 7 + z) * 10 };
    g.add(light);
  }

  // ---- wrought-iron andirons with brass ball finials, standing on the hearth
  // polished brass reads dark without an env map, so give it a warm self-lit sheen + clearcoat highlight
  const iron = mat('#1c1a18', { r: 0.6, m: 0.5 });
  const brass = owMats.brass ||= new THREE.MeshPhysicalMaterial({ color: '#e6b84f', metalness: 0.55, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, emissive: '#8a5a12', emissiveIntensity: 0.55 });
  const baluster = new THREE.LatheGeometry([
    [0.0, 0], [0.1, 0], [0.1, 0.05], [0.06, 0.1], [0.055, 0.45], [0.09, 0.55], [0.055, 0.65], [0.05, 1.05], [0.075, 1.1], [0.035, 1.16], [0, 1.16],
  ].map(([r, y]) => new THREE.Vector2(r, y)), 16);
  for (const sd of [-1, 1]) {
    const ax = sd * Math.min(ow * 0.3, 1.6), az = zJ - 0.18, base = y0 + 0.16;
    add(g, baluster, iron, ax, base, az);
    add(g, new THREE.SphereGeometry(0.14, 18, 14), brass, ax, base + 1.16 + 0.13, az);
    // scroll feet: arched legs from the post base down onto the hearth, curled toes resting on the stone
    for (const fx of [-1, 1]) {
      const leg = new THREE.TorusGeometry(0.16, 0.026, 8, 16, Math.PI / 2);
      const lm = add(g, leg, iron, ax + fx * 0.16, y0 + 0.0, az + 0.03, 0, 0, fx > 0 ? Math.PI / 2 : 0);
      lm.position.set(ax + fx * 0.16, y0 + 0.0, az + 0.03);
      add(g, new THREE.TorusGeometry(0.045, 0.02, 6, 12), iron, ax + fx * 0.32, y0 + 0.045, az + 0.03);
      add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8), iron, ax + fx * 0.32, y0 + 0.01, az + 0.03);
    }
    add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), iron, ax, y0 + 0.08, az + 0.03);
    // log bar back into the firebox with a short rear leg
    const barL = az - (fz - 0.55);
    add(g, B(0.07, 0.07, barL), iron, ax, y0 + 0.32, az - barL / 2);
    add(g, B(0.07, 0.32, 0.07), iron, ax, y0 + 0.16, az - barL + 0.035);
  }

  if (!styled) return;
  // ---- styling from the photo: woven log basket at the left, potted plant + brass ball stake on the shelf
  const bx = -W / 2 - 1.05, bz = zJ + 0.55, bh = 1.35, br = 0.62;
  const wick = limeMat('wicker', 4, 1.5);
  const bk2 = add(g, new THREE.CylinderGeometry(br, br * 0.85, bh, 28, 1, true), new THREE.MeshStandardMaterial({ map: wick.map, roughness: 0.85, side: THREE.DoubleSide }), bx, bh / 2, bz);
  add(g, new THREE.CylinderGeometry(br * 0.85, br * 0.85, 0.06, 28), wick, bx, 0.03, bz);
  add(g, new THREE.TorusGeometry(br, 0.04, 8, 28), mat('#7a5a36', { r: 0.8 }), bx, bh, bz, Math.PI / 2);
  [[-0.2, 0.15, 0.3], [0.18, -0.1, -0.25], [0.0, 0.25, 0.1], [-0.05, -0.22, -0.05]].forEach(([dx, dz, rz], i) => {
    add(g, new THREE.CylinderGeometry(0.14, 0.15, 1.5, 10), mat(i % 2 ? '#7d6a55' : '#a08a6e', { r: 0.9 }), bx + dx, bh - 0.35 + i * 0.04, bz + dz, 0.15 * (i - 1.5), 0, rz);
  });
  const px = W / 2 + 0.2 - 0.55, pz = zF + 0.15, pyt = shelfTop;
  const pot = new THREE.LatheGeometry([[0, 0], [0.24, 0], [0.3, 0.1], [0.34, 0.5], [0.37, 0.55], [0.36, 0.6], [0, 0.6]].map(([r, y]) => new THREE.Vector2(r, y)), 22);
  add(g, pot, limeMat('plaster', 1, 1, '#e0d6c4'), px, pyt, pz);
  const leaf = mat('#3f5a2e', { r: 0.7 }), leaf2 = mat('#56753c', { r: 0.7 });
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4, rr = 0.12 + rnd(i) * 0.3, hy = 0.62 + rnd(i + 4) * 0.55;
    const lf = add(g, new THREE.SphereGeometry(0.13, 8, 6), i % 3 ? leaf : leaf2, px + Math.cos(a) * rr, pyt + hy, pz + Math.sin(a) * rr * 0.7);
    lf.scale.set(1.2, 0.35, 0.7); lf.rotation.set(rnd(i) * 0.6, a, 0.4);
    add(g, new THREE.CylinderGeometry(0.008, 0.008, hy - 0.5, 4), leaf, px + Math.cos(a) * rr * 0.5, pyt + 0.5 + (hy - 0.5) / 2, pz + Math.sin(a) * rr * 0.35, 0, 0, (rr * 0.5) * Math.sign(Math.cos(a)) * -0.8);
  }
  add(g, new THREE.CylinderGeometry(0.012, 0.012, 1.45, 6), brass, px - 0.05, pyt + 0.55 + 0.72, pz);
  add(g, new THREE.SphereGeometry(0.11, 16, 12), brass, px - 0.05, pyt + 0.55 + 1.45 + 0.1, pz);
}

const F = (name, build, w, d, h, extra = {}) => ({
  name, category: 'fireplace', w, d, h, ...extra,
  build: (g, rec) => build(g, { ...rec, opening: rec.opening || extra.opening, h: rec.h || h }),
});
export const FIREPLACE_CATEGORIES = [{ id: 'fireplace', name: 'Fireplaces' }];
export const FIREPLACE_CATALOG = {
  fpMasonry36: F('Masonry wood-burning 36"', buildMasonry, 5.4, 2.4, 5.2, { opening: 3.0, variants: ['brick', 'stone'] }),
  fpMasonry42: F('Masonry wood-burning 42"', buildMasonry, 6.2, 2.5, 5.6, { opening: 3.5, variants: ['brick', 'stone'] }),
  fpMasonry48: F('Masonry wood-burning 48"', buildMasonry, 7.0, 2.6, 6.0, { opening: 4.0, variants: ['stone', 'brick'] }),
  fpLinear48: F('Linear gas 48"', buildLinear, 6.2, 1.6, 8.0, { opening: 4.0, variants: ['stone-slab', 'plaster'] }),
  fpLinear60: F('Linear gas 60"', buildLinear, 7.4, 1.6, 8.0, { opening: 5.0, variants: ['stone-slab', 'plaster'] }),
  fpLinear72: F('Linear gas 72"', buildLinear, 8.6, 1.6, 8.0, { opening: 6.0, variants: ['plaster', 'stone-slab'] }),
  fpStoneTrad: F('Floor-to-ceiling stone — 42" wood', buildStoneWall, 7.5, 2.6, 9.0, { opening: 3.5, variants: ['traditional', 'linear'] }),
  fpStoneLinear: F('Floor-to-ceiling stone — 60" linear', buildStoneWall, 8.5, 2.6, 9.0, { opening: 5.0, variants: ['linear', 'traditional', 'marble-slab'] }),
  fpFarmhouse36: F('Farmhouse shiplap + beam mantel 36"', buildFarmhouse, 6.0, 2.0, 9.0, { opening: 3.0, variants: ['white', 'greige', 'charcoal'] }),
  fpFarmhouse42: F('Farmhouse shiplap + beam mantel 42"', buildFarmhouse, 7.0, 2.0, 9.0, { opening: 3.5, variants: ['white', 'greige', 'charcoal'] }),
  fpSeeThrough: F('Two-sided see-through 48"', buildSeeThrough, 6.5, 3.0, 8.0, { opening: 4.0, variants: ['gas', 'wood'] }),
  fpStove: F('Freestanding wood stove', buildStove, 3.4, 3.4, 8.6, { variants: ['black', 'enamel-red'] }),
  fpMidCentury: F('Mid-century low horizontal', buildMidCentury, 9.0, 2.0, 2.3, { variants: ['plaster', 'brick'] }),
  fpOldWorld60: F('Old-world limestone — 60" opening', buildOldWorld, 6.9, 3.4, 9.0, { variants: ['styled', 'plain'] }),
  fpOldWorld72: F('Old-world limestone — 72" opening', buildOldWorld, 8.2, 3.55, 9.0, { variants: ['styled', 'plain'] }),
};
