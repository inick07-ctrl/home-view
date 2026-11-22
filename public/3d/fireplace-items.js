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
};
