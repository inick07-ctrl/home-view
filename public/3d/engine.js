import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import REGISTRY from './models/registry.js';

const $ = (id) => document.getElementById(id);
const canvas = $('c');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
catch (e) { const er = $('err'); er.style.display = 'flex'; er.textContent = 'Your browser could not start WebGL, which this 3D model needs.'; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#cfe3f2');
scene.fog = new THREE.Fog('#cfe3f2', 260, 560);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 2000);
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
Object.assign(labelRenderer.domElement.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: 3 });
document.body.appendChild(labelRenderer.domElement);

const hemi = new THREE.HemisphereLight('#ffffff', '#c9c1b2', 0.95);
scene.add(hemi);
const amb = new THREE.AmbientLight('#ffffff', 0);
scene.add(amb);
const sun = new THREE.DirectionalLight('#fff3df', 1.6);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006;
scene.add(sun, sun.target);

// ---------- textures ----------
function canvasTex(draw, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const rnd = (i) => { const x = Math.sin(i * 99.13) * 43758.5453; return x - Math.floor(x); };
const TEX = {
  wood: canvasTex((g, s) => { const n = 8; for (let i = 0; i < n; i++) { const v = 205 + rnd(i) * 22; g.fillStyle = `rgb(${v + 12},${v - 22},${v - 70})`; g.fillRect(0, i * s / n, s, s / n); g.fillStyle = 'rgba(90,60,30,.35)'; g.fillRect(0, i * s / n, s, 1.5); g.fillRect(rnd(i + 7) * s, i * s / n, 1.5, s / n); } }),
  tile: canvasTex((g, s) => { g.fillStyle = '#e7eaed'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(120,130,140,.45)'; g.lineWidth = 2; for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * s / 2, 0); g.lineTo(i * s / 2, s); g.moveTo(0, i * s / 2); g.lineTo(s, i * s / 2); g.stroke(); } }),
  concrete: canvasTex((g, s) => { g.fillStyle = '#b9bbbd'; g.fillRect(0, 0, s, s); for (let i = 0; i < 1400; i++) { const c = rnd(i) > .5 ? 255 : 60; g.fillStyle = `rgba(${c},${c},${c},.08)`; g.fillRect(rnd(i + 1) * s, rnd(i + 2) * s, 2, 2); } g.strokeStyle = 'rgba(80,80,80,.35)'; g.strokeRect(0, 0, s, s); }),
  porch: canvasTex((g, s) => { const n = 6; for (let i = 0; i < n; i++) { const v = 170 + rnd(i + 3) * 18; g.fillStyle = `rgb(${v + 10},${v - 32},${v - 80})`; g.fillRect(i * s / n, 0, s / n, s); g.fillStyle = 'rgba(50,30,10,.55)'; g.fillRect(i * s / n, 0, 2, s); } }),
  gym: canvasTex((g, s) => { g.fillStyle = '#8fa9c7'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(40,60,90,.35)'; g.lineWidth = 2; g.strokeRect(1, 1, s - 2, s - 2); }),
  stone: canvasTex((g, s) => { g.fillStyle = '#c9c4b8'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(90,85,75,.4)'; g.lineWidth = 2; g.strokeRect(1, 1, s - 2, s - 2); g.beginPath(); g.moveTo(s / 2, 0); g.lineTo(s / 2, s / 2); g.moveTo(0, s / 2); g.lineTo(s, s / 2); g.stroke(); }),
  terrace: canvasTex((g, s) => { g.fillStyle = '#d6d3cb'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(110,105,95,.45)'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.strokeRect(0, i * s / 4, s, s / 4); g.beginPath(); const o = (i % 2) * s / 4; g.moveTo(o + s / 4, i * s / 4); g.lineTo(o + s / 4, (i + 1) * s / 4); g.moveTo(o + 3 * s / 4, i * s / 4); g.lineTo(o + 3 * s / 4, (i + 1) * s / 4); g.stroke(); } }),
  paver: canvasTex((g, s) => { g.fillStyle = '#8f8d89'; g.fillRect(0, 0, s, s); for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { const v = 130 + rnd(x * 9 + y) * 30; g.fillStyle = `rgb(${v},${v - 2},${v - 6})`; g.fillRect(x * s / 4 + (y % 2) * s / 8 + 1, y * s / 8 + 1, s / 4 - 2, s / 8 - 2); } }),
  grass: canvasTex((g, s) => { g.fillStyle = '#7fb26a'; g.fillRect(0, 0, s, s); for (let i = 0; i < 3000; i++) { g.fillStyle = rnd(i) > .5 ? 'rgba(40,90,30,.18)' : 'rgba(200,230,150,.15)'; g.fillRect(rnd(i + 5) * s, rnd(i + 9) * s, 2, 3); } }),
  board: canvasTex((g, s) => { g.fillStyle = '#2a2c2f'; g.fillRect(0, 0, s, s); for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(i * s / 8, 0, 3, s); g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(i * s / 8 + 3, 0, 2, s); } }),
  brick: canvasTex((g, s) => { g.fillStyle = '#9a958e'; g.fillRect(0, 0, s, s); const rows = 16; for (let y = 0; y < rows; y++) for (let x = 0; x < 5; x++) { const v = 120 + rnd(x * 31 + y * 7) * 45; g.fillStyle = `rgb(${v},${v - 3},${v - 8})`; g.fillRect(x * s / 4 - (y % 2) * s / 8 + 1.5, y * s / rows + 1.5, s / 4 - 3, s / rows - 3); } }),
  metal: canvasTex((g, s) => { g.fillStyle = '#1d1e20'; g.fillRect(0, 0, s, s); for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(i * s / 4, 0, 3, s); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(i * s / 4 + 3, 0, 2, s); } }),
  shingle: canvasTex((g, s) => { g.fillStyle = '#4b5159'; g.fillRect(0, 0, s, s); for (let y = 0; y < 8; y++) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, y * s / 8, s, 2); for (let x = 0; x < 4; x++) g.fillRect(x * s / 4 + (y % 2) * s / 8, y * s / 8, 2, s / 8); } }),
  // English Country (bright, airy): cream limewash walls, pale plaster ceilings,
  // light oak board accents, honey/cream flagstone, pale limestone
  limewash: canvasTex((g, s) => {
    g.fillStyle = '#f7f3e8'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 1600; i++) {
      const v = 236 + rnd(i) * 16;
      g.fillStyle = `rgba(${v},${v - 6},${v - 18},${0.03 + rnd(i + 3) * 0.05})`;
      g.beginPath(); g.arc(rnd(i + 1) * s, rnd(i + 2) * s, 2 + rnd(i + 5) * 10, 0, 6.3); g.fill();
    }
  }, 512),
  palePlaster: canvasTex((g, s) => {
    g.fillStyle = '#faf7f0'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      const v = 242 + rnd(i + 9) * 12;
      g.fillStyle = `rgba(${v},${v - 3},${v - 10},${0.025 + rnd(i + 2) * 0.04})`;
      g.beginPath(); g.arc(rnd(i + 4) * s, rnd(i + 6) * s, 3 + rnd(i) * 12, 0, 6.3); g.fill();
    }
  }, 512),
  lightOak: canvasTex((g, s) => {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const v = 208 + rnd(i + 3) * 20;
      g.fillStyle = `rgb(${v + 16},${v - 4},${v - 42})`;
      g.fillRect(i * s / n, 0, s / n, s);
      g.fillStyle = 'rgba(150,125,90,.28)'; g.fillRect(i * s / n, 0, 2, s);
      g.fillStyle = 'rgba(255,250,240,.18)'; g.fillRect(i * s / n + 3, 0, 2, s);
    }
  }, 512),
  slate: canvasTex((g, s) => {
    g.fillStyle = '#e4dccf'; g.fillRect(0, 0, s, s);
    const stones = [
      [0, 0, 0.42, 0.38], [0.43, 0, 1, 0.28], [0.43, 0.29, 0.72, 0.58], [0.73, 0.29, 1, 0.62],
      [0, 0.39, 0.28, 0.7], [0.29, 0.39, 0.62, 0.78], [0, 0.71, 0.35, 1], [0.36, 0.79, 0.7, 1],
      [0.63, 0.59, 1, 1], [0.71, 0, 1, 0.28],
    ];
    const palettes = [
      [228, 214, 186], [234, 224, 206], [214, 212, 204], [236, 220, 190], [208, 202, 192],
    ];
    for (let i = 0; i < stones.length; i++) {
      const [x0, y0, x1, y1] = stones[i];
      const [pr, pgv, pb] = palettes[i % palettes.length];
      const j = rnd(i + 21) * 14 - 7;
      g.fillStyle = `rgb(${pr + j},${pgv + j * 0.8},${pb + j * 0.5})`;
      const pad = 2;
      g.fillRect(x0 * s + pad, y0 * s + pad, (x1 - x0) * s - pad * 2, (y1 - y0) * s - pad * 2);
      g.strokeStyle = 'rgba(170,158,140,.4)'; g.lineWidth = 2;
      g.strokeRect(x0 * s + pad, y0 * s + pad, (x1 - x0) * s - pad * 2, (y1 - y0) * s - pad * 2);
      g.fillStyle = 'rgba(255,255,255,.16)';
      g.fillRect(x0 * s + pad + 2, y0 * s + pad + 2, (x1 - x0) * s * 0.4, 3);
    }
  }, 512),
  lightStone: canvasTex((g, s) => {
    g.fillStyle = '#e8e0d2'; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(180,170,150,.35)'; g.lineWidth = 2;
    g.strokeRect(1, 1, s - 2, s - 2);
    g.beginPath(); g.moveTo(s / 2, 0); g.lineTo(s / 2, s / 2); g.moveTo(0, s / 2); g.lineTo(s, s / 2); g.stroke();
    for (let i = 0; i < 400; i++) {
      const v = 220 + rnd(i) * 25;
      g.fillStyle = `rgba(${v},${v - 8},${v - 20},.08)`;
      g.fillRect(rnd(i + 1) * s, rnd(i + 2) * s, 3, 3);
    }
  }, 256),
};
TEX.grass.repeat.set(90, 90);
const TEXSCALE = { wood: 6, tile: 4, concrete: 10, porch: 4, gym: 4, stone: 3, terrace: 6, paver: 6, board: 4, brick: 5, metal: 6, shingle: 4, limewash: 8, palePlaster: 10, lightOak: 5, slate: 8, lightStone: 3 };
const MAT = {};
for (const k of ['wood', 'tile', 'concrete', 'porch', 'gym', 'stone', 'terrace', 'paver']) MAT[k] = new THREE.MeshLambertMaterial({ map: TEX[k] });
MAT.brick = new THREE.MeshStandardMaterial({ map: TEX.brick, roughness: .95 });
MAT.board = new THREE.MeshStandardMaterial({ map: TEX.board, roughness: .85 });
MAT.glass = new THREE.MeshStandardMaterial({ color: '#9fd0ee', roughness: .1, metalness: .1, transparent: true, opacity: .45, side: THREE.DoubleSide });
MAT.water = new THREE.MeshStandardMaterial({ color: '#36b3d9', roughness: .08, metalness: .15, transparent: true, opacity: .88, emissive: '#0b4f66', emissiveIntensity: .25 });
MAT.slab = new THREE.MeshLambertMaterial({ color: '#9a9a96' });
MAT.ceiling = new THREE.MeshLambertMaterial({ color: '#faf8f3', side: THREE.DoubleSide });
MAT.limewash = new THREE.MeshStandardMaterial({ map: TEX.limewash, roughness: .95, color: '#ffffff' });
MAT.palePlaster = new THREE.MeshStandardMaterial({ map: TEX.palePlaster, roughness: .96, color: '#ffffff', side: THREE.DoubleSide });
MAT.lightOak = new THREE.MeshStandardMaterial({ map: TEX.lightOak, roughness: .8, color: '#ffffff' });
MAT.slate = new THREE.MeshStandardMaterial({ map: TEX.slate, roughness: .5, metalness: .04, color: '#ffffff' });
MAT.lightStone = new THREE.MeshStandardMaterial({ map: TEX.lightStone, roughness: .88, color: '#ffffff' });
MAT.softFrame = new THREE.MeshStandardMaterial({ color: '#8c927c', roughness: .75 });

const STYLES = {
  default: { id: 'default', name: 'Default' },
  'english-country': {
    id: 'english-country', name: 'English Country',
    floors: { wood: 'slate', tile: 'slate', gym: 'slate', stone: 'slate' },
    intWalls: 'limewash', ceiling: 'palePlaster',
    ambient: 0.55, ambColor: '#fff8f0',
    hemi: 1.5, hemiColor: '#fff8f0', groundColor: '#d5ccba',
    sun: 2.2, sunColor: '#fff6e4', bg: '#e8eef4',
    fogNear: 280, fogFar: 620,
    amber: '#ffd9a0',
    frame: '#8c927c',
  },
};
let currentStyle = 'default';
let loadedModel = null;


const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshLambertMaterial({ map: TEX.grass }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.6; ground.receiveShadow = true; scene.add(ground);

// ---------- per-model state ----------
let M = null, root = null, wallsFull, wallsCut, roof, labels, planOverlay, ceilings;
let fires = [];
let CX = 0, CZ = 0, BW = 90, BH = 80, solids = [];
const Wx = (x) => x - CX, Wz = (y) => y - CZ;

function boxRect(x0, y0, x1, y1, h0, h1, uvScale) {
  const g = new THREE.BoxGeometry(Math.max(x1 - x0, .01), Math.max(h1 - h0, .01), Math.max(y1 - y0, .01));
  g.translate(Wx((x0 + x1) / 2), (h0 + h1) / 2, Wz((y0 + y1) / 2));
  if (uvScale) { // world-space UVs so textures tile at a real scale
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
      const u = ay > .5 ? p.getX(i) : (ax > .5 ? p.getZ(i) : p.getX(i));
      const v = ay > .5 ? p.getZ(i) : p.getY(i);
      uv.setXY(i, u / uvScale, v / uvScale);
    }
  }
  return g;
}
function planeRect(x0, y0, x1, y1, h, scale) {
  const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0);
  g.rotateX(-Math.PI / 2); g.translate(Wx((x0 + x1) / 2), h, Wz((y0 + y1) / 2));
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / scale, -p.getZ(i) / scale);
  return g;
}
function mesh(geos, mat, cast = true) {
  if (!geos.length) return null;
  const m = new THREE.Mesh(mergeGeometries(geos), mat); m.castShadow = cast; m.receiveShadow = true; return m;
}


function applyEnglishCountry(kit, st, H, WS) {
  const amber = st.amber || '#ffd9a0';
  const frame = st.frame || '#8c927c';
  const inside = (x, y) => M.rooms.some(r => !(r[7]?.outside) && x > r[3] && x < r[5] && y > r[4] && y < r[6]);
  // light oak wainscot and chair-rail accents on hall / foyer / mudroom walls
  const accentRooms = /^(Entry|Family Foyer|Foyer|Hall|Mudroom|Utility)/i;
  for (const room of M.rooms) {
    const [name, , , a, b, c, d, o = {}] = room;
    if (o.outside || !accentRooms.test(name || '')) continue;
    const inset = 0.1, rail = 3.15;
    if ((c - a) >= (d - b)) {
      kit.block(a + 0.35, b + inset, c - 0.35, b + inset + 0.06, 0, rail, 'lightOak');
      kit.block(a + 0.35, d - inset - 0.06, c - 0.35, d - inset, 0, rail, 'lightOak');
      kit.block(a + 0.35, b + inset, c - 0.35, b + inset + 0.08, rail, rail + 0.12, 'lightOak');
      kit.block(a + 0.35, d - inset - 0.08, c - 0.35, d - inset, rail, rail + 0.12, 'lightOak');
    } else {
      kit.block(a + inset, b + 0.35, a + inset + 0.06, d - 0.35, 0, rail, 'lightOak');
      kit.block(c - inset - 0.06, b + 0.35, c - inset, d - 0.35, 0, rail, 'lightOak');
      kit.block(a + inset, b + 0.35, a + inset + 0.08, d - 0.35, rail, rail + 0.12, 'lightOak');
      kit.block(c - inset - 0.08, b + 0.35, c - inset, d - 0.35, rail, rail + 0.12, 'lightOak');
    }
  }
  // soft sage / warm-gray window frames + daylight spilling in
  for (const w of (WS?.win || [])) {
    const x0 = w[0], y0 = w[1], x1 = w[2], y1 = w[3], sill = w[4] ?? 3, head = w[5] ?? 7;
    const vert = (x1 - x0) < (y1 - y0);
    const t = 0.12;
    if (vert) {
      kit.block(x0 - t, y0, x1 + t, y0 + t, sill - t, head + t, frame);
      kit.block(x0 - t, y1 - t, x1 + t, y1, sill - t, head + t, frame);
      kit.block(x0 - t, y0, x1 + t, y1, sill - t, sill + t, frame);
      kit.block(x0 - t, y0, x1 + t, y1, head - t, head + t, frame);
    } else {
      kit.block(x0, y0 - t, x0 + t, y1 + t, sill - t, head + t, frame);
      kit.block(x1 - t, y0 - t, x1, y1 + t, sill - t, head + t, frame);
      kit.block(x0, y0 - t, x1, y1 + t, sill - t, sill + t, frame);
      kit.block(x0, y0 - t, x1, y1 + t, head - t, head + t, frame);
    }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ch = (sill + head) / 2;
    let lx = cx, ly = cy;
    if (vert) lx = inside(cx - 0.8, cy) ? cx - 0.45 : cx + 0.45;
    else ly = inside(cx, cy - 0.8) ? cy - 0.45 : cy + 0.45;
    const dl = new THREE.PointLight('#fff6e8', 1.35, 16, 2);
    dl.position.set(Wx(lx), ch, Wz(ly));
    dl.castShadow = false;
    root.add(dl);
  }
  // a couple of brighter work lights in the garage so Nick's cars read clearly
  for (const room of M.rooms) {
    const [name, , , a, b, c, d, o = {}] = room;
    if (!/^Bay /.test(name || '')) continue;
    const light = new THREE.PointLight('#fff3e0', 1.8, 24, 2);
    light.position.set(Wx((a + c) / 2), 8.5, Wz((b + d) / 2));
    root.add(light);
  }
  const pendantRooms = /^(Family|Dining|Kitchen|Entry|Family Foyer|Office|Primary Suite|Hall)$/i;
  for (const room of M.rooms) {
    const [name, , , a, b, c, d, o = {}] = room;
    if (o.outside || !pendantRooms.test(name || '')) continue;
    const cx = (a + c) / 2, cy = (b + d) / 2;
    const ch = /Kitchen|Dining/.test(name) ? 14 : (/Family$/.test(name) ? 12 : 10);
    const ph = ch - 2.4;
    kit.block(cx - 0.15, cy - 0.15, cx + 0.15, cy + 0.15, ph + 0.6, ch - 0.2, '#c4b08a');
    kit.block(cx - 0.45, cy - 0.45, cx + 0.45, cy + 0.45, ph, ph + 0.55, '#d4b07a', { r: .45, m: .15 });
    const light = new THREE.PointLight(amber, 0.9, 22, 2);
    light.position.set(Wx(cx), ph, Wz(cy));
    light.castShadow = false;
    root.add(light);
  }
  // wall sconces near a few doorways (foyer / hall / entry)
  const sconceAt = (x, y, h = 5.6) => {
    kit.block(x - 0.18, y - 0.18, x + 0.18, y + 0.18, h, h + 0.7, '#e0c788', { r: .4, m: .2 });
    const sl = new THREE.PointLight(amber, 0.45, 10, 2);
    sl.position.set(Wx(x), h + 0.3, Wz(y));
    root.add(sl);
  };
  for (const r of M.rooms) {
    const [name, , , a, b, c, d, o = {}] = r;
    if (o.outside || !/Foyer|Entry|Hall$/.test(name || '')) continue;
    sconceAt((a + c) / 2, b + 0.5);
    sconceAt((a + c) / 2, d - 0.5);
  }
}

function buildModel(model) {
  if (root) {
    root.traverse(o => { if (o.element?.parentNode) o.element.parentNode.removeChild(o.element); if (o.geometry) o.geometry.dispose(); });
    scene.remove(root);
  }
  M = model; loadedModel = model; root = new THREE.Group(); scene.add(root);
  solids = [];
  fires = [];
  const mats = M.materials || {};
  const H = M.wallH || 9;
  const st = STYLES[currentStyle] || STYLES.default;
  hemi.intensity = st.hemi ?? 0.95; hemi.color.set(st.hemiColor || '#ffffff'); hemi.groundColor.set(st.groundColor || '#c9c1b2');
  amb.intensity = st.ambient ?? 0; amb.color.set(st.ambColor || '#ffffff');
  sun.intensity = st.sun ?? 1.6; sun.color.set(st.sunColor || '#fff3df');
  if (currentStyle === 'english-country') {
    MAT.glass.color.set('#cfe6f6'); MAT.glass.opacity = 0.3;
    MAT.glass.emissive.set('#fff3d2'); MAT.glass.emissiveIntensity = 0.4;
  } else {
    MAT.glass.color.set('#9fd0ee'); MAT.glass.opacity = 0.45;
    MAT.glass.emissive.set('#000000'); MAT.glass.emissiveIntensity = 0;
  }
  const bg = st.bg || '#cfe3f2'; scene.background.set(bg);
  if (scene.fog) { scene.fog.color.set(bg); scene.fog.near = st.fogNear || 260; scene.fog.far = st.fogFar || 560; }
  // bounds from rooms
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const r of M.rooms) { x0 = Math.min(x0, r[3]); y0 = Math.min(y0, r[4]); x1 = Math.max(x1, r[5]); y1 = Math.max(y1, r[6]); }
  CX = (x0 + x1) / 2; CZ = (y0 + y1) / 2; BW = x1 - x0; BH = y1 - y0;
  const R = Math.max(BW, BH) * 0.8 + 10;
  sun.position.set(R * .7, 110, R * .9); sun.target.position.set(0, 0, 0);
  Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 10, far: 400 }); sun.shadow.camera.updateProjectionMatrix();

  const extMat = mats.extTex ? MAT[mats.extTex] : new THREE.MeshStandardMaterial({ color: mats.ext || '#ece5d8', roughness: .9 });
  const intMat = (st.intWalls && MAT[st.intWalls]) ? MAT[st.intWalls] : new THREE.MeshStandardMaterial({ color: mats.int || '#f8f6f1', roughness: .95 });

  // slabs + floors
  root.add(mesh((M.slabs || []).map(r => boxRect(...r, -0.6, -0.01)), MAT.slab, false));
  const byType = {};
  for (const r of M.rooms) {
    const [, , type, a, b, c, d, o = {}] = r;
    if (o.noFloor) continue;
    const ft = (st.floors && st.floors[type]) || type;
    (byType[ft] ||= []).push(planeRect(a, b, c, d, 0.02, TEXSCALE[ft] || TEXSCALE[type] || 4));
  }
  for (const [type, geos] of Object.entries(byType)) root.add(mesh(geos, MAT[type] || MAT.wood, false));

  // footprint for exterior-skin side detection
  const inside = (x, y) => M.rooms.some(r => !(r[7]?.outside) && x > r[3] && x < r[5] && y > r[4] && y < r[6]);
  const WS = M.walls;
  function skinSplit(r, h0, h1, out) {
    // r = [x0,y0,x1,y1]; push {geo, mat} pieces: thin dark skin on the outside face, light core inside
    if (!mats.extSkin) { out.ext.push(boxRect(r[0], r[1], r[2], r[3], h0, h1, 4)); return; }
    const horiz = (r[2] - r[0]) >= (r[3] - r[1]);
    const t = horiz ? r[3] - r[1] : r[2] - r[0], sk = Math.min(0.15, t / 3);
    const mx = (r[0] + r[2]) / 2, my = (r[1] + r[3]) / 2, d = t / 2 + 0.7;
    const inA = horiz ? inside(mx, r[1] - d) : inside(r[0] - d, my);  // north / west side
    const inB = horiz ? inside(mx, r[3] + d) : inside(r[2] + d, my);  // south / east side
    if (inA && inB) { out.int.push(boxRect(...r, h0, h1)); return; }
    if (!inA && !inB) { out.ext.push(boxRect(...r, h0, h1, 4)); return; }
    const skinOnA = !inA;
    let skin, core;
    if (horiz) { skin = skinOnA ? [r[0], r[1], r[2], r[1] + sk] : [r[0], r[3] - sk, r[2], r[3]]; core = skinOnA ? [r[0], r[1] + sk, r[2], r[3]] : [r[0], r[1], r[2], r[3] - sk]; }
    else { skin = skinOnA ? [r[0], r[1], r[0] + sk, r[3]] : [r[2] - sk, r[1], r[2], r[3]]; core = skinOnA ? [r[0] + sk, r[1], r[2], r[3]] : [r[0], r[1], r[2] - sk, r[3]]; }
    out.ext.push(boxRect(...skin, h0, h1, 4)); out.int.push(boxRect(...core, h0, h1));
  }
  function buildWalls(cut) {
    const grp = new THREE.Group();
    const out = { ext: [], int: [], glass: [] };
    const top = (h) => cut ? Math.min(4, h) : h;
    for (const r of WS.ext) skinSplit(r, 0, top(r[4] || H), out);
    for (const r of WS.int) out.int.push(boxRect(r[0], r[1], r[2], r[3], 0, top(r[4] || H)));
    for (const r of WS.win) {
      const sill = r[4] ?? 3, head = r[5] ?? 7, h = r[6] || H, T = top(h);
      if (sill > 0.05) skinSplit(r, 0, Math.min(sill, T), out);
      if (!cut && h > head + 0.05) skinSplit(r, head, h, out);
      const vert = (r[2] - r[0]) < (r[3] - r[1]);
      const g = vert ? [(r[0] + r[2]) / 2 - .05, r[1], (r[0] + r[2]) / 2 + .05, r[3]] : [r[0], (r[1] + r[3]) / 2 - .05, r[2], (r[1] + r[3]) / 2 + .05];
      if (T > sill) out.glass.push(boxRect(...g, sill, Math.min(head, T)));
    }
    if (!cut) for (const r of WS.door) {
      const tp = r[4] ?? 7, h = r[5] || H;
      if (h > tp + 0.05) { if (r[6]) skinSplit(r, tp, h, out); else out.int.push(boxRect(r[0], r[1], r[2], r[3], tp, h)); }
    }
    for (const [g, m, cs] of [[out.ext, extMat, true], [out.int, intMat, true], [out.glass, MAT.glass, false]]) { const ms = mesh(g, m, cs); if (ms) grp.add(ms); }
    return grp;
  }
  wallsFull = buildWalls(false); wallsCut = buildWalls(true);
  root.add(wallsFull, wallsCut);
  if (WS.counter?.length) root.add(mesh(WS.counter.map(r => boxRect(...r, 0, 3)), new THREE.MeshStandardMaterial({ color: '#e8dcc6', roughness: .8 })));
  for (const r of [...WS.ext, ...WS.int, ...WS.win, ...(WS.counter || [])]) solids.push([Wx(r[0]), Wz(r[1]), Wx(r[2]), Wz(r[3])]);

  // furniture / site via a small kit
  const furn = new THREE.Group(); root.add(furn);
  const colorMats = {};
  const getMat = (c, o = {}) => {
    if (currentStyle === 'english-country' && c === 'stone') c = 'lightStone';
    if (MAT[c]) return MAT[c];
    const key = c + (o.m ?? 0) + (o.r ?? .8);
    return colorMats[key] ||= new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? .8, metalness: o.m ?? 0 });
  };
  const kit = {
    THREE, W: Wx, Z: Wz,
    block(a, b, c, d, h0, h1, color, o = {}) {
      const m = new THREE.Mesh(boxRect(a, b, c, d, h0, h1, MAT[color] ? TEXSCALE[color] : 0), getMat(color, o));
      m.castShadow = m.receiveShadow = true; furn.add(m);
      if (o.solid) solids.push([Wx(a), Wz(b), Wx(c), Wz(d)]);
      return m;
    },
    plane(a, b, c, d, type) { const m = new THREE.Mesh(planeRect(a, b, c, d, -0.55, TEXSCALE[type] || 6), MAT[type]); m.receiveShadow = true; furn.add(m); },
    water(a, b, c, d) {
      const m = new THREE.Mesh(planeRect(a, b, c, d, 0.06, 8), MAT.water); furn.add(m);
      const cp = '#efece5', e = 0.6;
      kit.block(a - e, b - e, c + e, b, 0, .12, cp); kit.block(a - e, d, c + e, d + e, 0, .12, cp);
      kit.block(a - e, b, a, d, 0, .12, cp); kit.block(c, b, c + e, d, 0, .12, cp);
      solids.push([Wx(a), Wz(b), Wx(c), Wz(d)]);
    },
    bed(a, b, c, d, head = 'n', color = '#8fa6c4') {
      kit.block(a, b, c, d, 0, 1.9, color);
      const P = .9, T = .45;
      if (head === 'n') { kit.block(a, b, c, b + P, 1.9, 2.2, '#ffffff'); kit.block(a - .1, b - T, c + .1, b, 0, 3.6, '#7a5a3a'); }
      if (head === 's') { kit.block(a, d - P, c, d, 1.9, 2.2, '#ffffff'); kit.block(a - .1, d, c + .1, d + T, 0, 3.6, '#7a5a3a'); }
      if (head === 'w') { kit.block(a, b, a + P, d, 1.9, 2.2, '#ffffff'); kit.block(a - T, b - .1, a, d + .1, 0, 3.6, '#7a5a3a'); }
      if (head === 'e') { kit.block(c - P, b, c, d, 1.9, 2.2, '#ffffff'); kit.block(c, b - .1, c + T, d + .1, 0, 3.6, '#7a5a3a'); }
    },
    firewood(a, b, c, d, h = 6.5) {
      const alongX = (c - a) >= (d - b);
      const long = alongX ? (c - a) : (d - b);
      const n = Math.max(4, Math.round(long / 0.55));
      const logC = ['#5a3a28', '#6a4a32', '#4a3020', '#7a5a3c', '#3d2818'];
      for (let i = 0; i < n; i++) {
        for (let z = 0; z < Math.max(4, Math.floor(h / 0.55)); z++) {
          const o = (z % 2) * 0.15;
          const t0 = (i + o) / n, t1 = Math.min(1, (i + 0.85 + o) / n);
          const col = logC[(i * 5 + z) % logC.length];
          if (alongX) kit.block(a + t0 * (c - a), b, a + t1 * (c - a), d, 0.15 + z * 0.55, 0.6 + z * 0.55, col);
          else kit.block(a, b + t0 * (d - b), c, b + t1 * (d - b), 0.15 + z * 0.55, 0.6 + z * 0.55, col);
        }
      }
      // niche frame
      kit.block(a - 0.08, b - 0.08, c + 0.08, b, 0, h, 'lightOak');
      kit.block(a - 0.08, d, c + 0.08, d + 0.08, 0, h, 'lightOak');
    },
    zDoor(a, b, c, d, face = 'n') {
      const horiz = (c - a) >= (d - b);
      const WD = '#d2c0a0', IR = '#b9a07c';
      kit.block(a, b, c, d, 0, 7, WD, { r: .85 });
      // Z brace + ledges
      if (horiz) {
        const mid = (b + d) / 2;
        kit.block(a + 0.1, b + 0.05, c - 0.1, b + 0.22, 0.05, 6.9, IR);
        kit.block(a + 0.1, d - 0.22, c - 0.1, d - 0.05, 0.05, 6.9, IR);
        kit.block(a + 0.1, mid - 0.08, c - 0.1, mid + 0.08, 0.05, 6.9, IR);
        kit.block(a + 0.15, b + 0.15, a + 0.32, d - 0.15, 0.08, 6.85, IR);
      } else {
        const mid = (a + c) / 2;
        kit.block(a + 0.05, b + 0.1, a + 0.22, d - 0.1, 0.05, 6.9, IR);
        kit.block(c - 0.22, b + 0.1, c - 0.05, d - 0.1, 0.05, 6.9, IR);
        kit.block(mid - 0.08, b + 0.1, mid + 0.08, d - 0.1, 0.05, 6.9, IR);
        kit.block(a + 0.15, b + 0.15, c - 0.15, b + 0.32, 0.08, 6.85, IR);
      }
    },
    car(a, b, c, d, color, type = 'generic', face) {
      const alongX = (c - a) >= (d - b), L = alongX ? (c - a) : (d - b), Wd = alongX ? (d - b) : (c - a);
      const nose = (face === 'e' || face === 'w' || face === 'n' || face === 's') ? face : (alongX ? 'e' : 's');
      const r = (s0, s1, t0, t1) => {
        if (nose === 'w') return [a + s0 * L, b + t0 * Wd, a + s1 * L, b + t1 * Wd];
        if (nose === 'e') return [c - s1 * L, b + t0 * Wd, c - s0 * L, b + t1 * Wd];
        if (nose === 'n') return [a + t0 * Wd, b + s0 * L, a + t1 * Wd, b + s1 * L];
        return [a + t0 * Wd, d - s1 * L, a + t1 * Wd, d - s0 * L];
      };
      const mid = (s, t) => { const q = r(s, s, t, t); return [(q[0] + q[2]) / 2, (q[1] + q[3]) / 2]; };
      const addCyl = (s, t, rad, len, ax, col, o = {}) => {
        const [x, y] = mid(s, t);
        const g = new THREE.CylinderGeometry(rad, rad, len, o.seg || 16);
        if (ax === 'x') g.rotateZ(Math.PI / 2);
        else if (ax === 'z') g.rotateX(Math.PI / 2);
        g.translate(Wx(x), o.h || rad, Wz(y));
        const m = new THREE.Mesh(g, getMat(col, { m: o.m ?? 0.2, r: o.r ?? 0.4 }));
        m.castShadow = m.receiveShadow = true; furn.add(m);
      };
      const wheelAx = (nose === 'e' || nose === 'w') ? 'z' : 'x';
      const typeKey = type || 'generic';
      if (typeKey === 'golf-r') {
        const body = '#8a8680', glass = '#7ea0b8', bronze = '#6e4f2a', dark = '#1a1a1a';
        kit.block(...r(0.02, 0.98, 0.06, 0.94), 0.55, 2.15, body, { m: .55, r: .35 });
        kit.block(...r(0.08, 0.55, 0.10, 0.90), 2.15, 2.55, body, { m: .55, r: .35 }); // hood
        kit.block(...r(0.36, 0.92, 0.10, 0.90), 2.15, 4.55, body, { m: .5, r: .38 }); // cabin / hatch
        kit.block(...r(0.40, 0.86, 0.14, 0.86), 2.55, 4.45, glass, { m: .2, r: .12 });
        kit.block(...r(0.88, 0.98, 0.18, 0.82), 2.15, 3.6, glass, { m: .2, r: .12 }); // rear hatch glass
        kit.block(...r(0.00, 0.06, 0.18, 0.82), 1.15, 1.85, '#cfc8b8', { m: .3, r: .4 }); // grille
        kit.block(...r(-0.01, 0.02, 0.22, 0.38), 1.35, 1.85, '#f4f0d8');
        kit.block(...r(-0.01, 0.02, 0.62, 0.78), 1.35, 1.85, '#f4f0d8');
        kit.block(...r(0.94, 1.0, 0.18, 0.38), 1.6, 2.15, '#a03030'); // tails
        kit.block(...r(0.94, 1.0, 0.62, 0.82), 1.6, 2.15, '#a03030');
        for (const [ws, wt] of [[0.18, 0.0], [0.72, 0.0], [0.18, 0.90], [0.72, 0.90]]) {
          addCyl(ws, wt + 0.05, 0.72, 0.38, wheelAx, bronze, { h: 0.72, m: .4, r: .35 });
          addCyl(ws, wt + 0.05, 0.28, 0.40, wheelAx, dark, { h: 0.72, m: .2, r: .6 });
        }
      } else if (typeKey === 'lexus-gx') {
        const body = color || '#161616', glass = '#5a6a72', blk = '#0d0d0d';
        kit.block(...r(0.02, 0.98, 0.05, 0.95), 0.85, 3.15, body, { m: .15, r: .72 }); // matte/satin
        kit.block(...r(0.10, 0.55, 0.08, 0.92), 3.15, 3.55, body, { m: .15, r: .72 });
        kit.block(...r(0.38, 0.95, 0.08, 0.92), 3.15, 5.85, body, { m: .15, r: .72 });
        kit.block(...r(0.42, 0.88, 0.14, 0.86), 3.55, 5.7, glass, { m: .15, r: .15 });
        // spindle grille (wide at bottom, pinched mid) + roof rack
        kit.block(...r(0.00, 0.07, 0.22, 0.78), 1.15, 2.15, blk, { m: .2, r: .5 });
        kit.block(...r(0.00, 0.07, 0.30, 0.70), 2.15, 2.85, blk, { m: .2, r: .5 });
        kit.block(...r(-0.01, 0.03, 0.18, 0.36), 1.7, 2.4, '#e8e4d4');
        kit.block(...r(-0.01, 0.03, 0.64, 0.82), 1.7, 2.4, '#e8e4d4');
        kit.block(...r(0.42, 0.90, 0.12, 0.18), 5.9, 6.25, blk);
        kit.block(...r(0.42, 0.90, 0.82, 0.88), 5.9, 6.25, blk);
        kit.block(...r(0.42, 0.48, 0.12, 0.88), 5.9, 6.2, blk);
        kit.block(...r(0.84, 0.90, 0.12, 0.88), 5.9, 6.2, blk);
        for (const [ws, wt] of [[0.20, 0.0], [0.78, 0.0], [0.20, 0.90], [0.78, 0.90]]) {
          addCyl(ws, wt + 0.05, 0.85, 0.42, wheelAx, blk, { h: 0.85, m: .15, r: .5 });
          addCyl(ws, wt + 0.05, 0.32, 0.44, wheelAx, '#222', { h: 0.85, m: .1, r: .6 });
        }
      } else if (typeKey === 'g63') {
        const body = color || '#0a0a0a', glass = '#4a5560', chrome = '#c8c8cc', blk = '#050505', red = '#c01010';
        // boxy upright body, gloss black
        kit.block(...r(0.01, 0.99, 0.04, 0.96), 0.95, 3.35, body, { m: .75, r: .18 });
        kit.block(...r(0.12, 0.50, 0.06, 0.94), 3.35, 3.7, body, { m: .75, r: .18 });
        kit.block(...r(0.32, 0.98, 0.06, 0.94), 3.35, 6.35, body, { m: .75, r: .18 }); // almost-vertical cabin
        kit.block(...r(0.38, 0.92, 0.12, 0.88), 3.7, 6.2, glass, { m: .2, r: .1 });
        // Panamericana vertical-slat grille + big star
        kit.block(...r(0.00, 0.06, 0.20, 0.80), 1.35, 2.85, blk, { m: .4, r: .4 });
        for (let i = 0; i < 7; i++) {
          const t0 = 0.24 + i * 0.075, t1 = t0 + 0.03;
          kit.block(...r(0.00, 0.055, t0, t1), 1.45, 2.75, chrome, { m: .8, r: .25 });
        }
        kit.block(...r(-0.01, 0.04, 0.44, 0.56), 1.85, 2.45, chrome, { m: .85, r: .2 }); // star disc
        // round halo headlights
        addCyl(0.01, 0.22, 0.42, 0.12, (wheelAx === 'z' ? 'x' : 'z'), '#e8f4ff', { h: 2.15, m: .1, r: .15, seg: 20 });
        addCyl(0.01, 0.78, 0.42, 0.12, (wheelAx === 'z' ? 'x' : 'z'), '#e8f4ff', { h: 2.15, m: .1, r: .15, seg: 20 });
        addCyl(0.01, 0.22, 0.18, 0.13, (wheelAx === 'z' ? 'x' : 'z'), '#f8fbff', { h: 2.15, m: .1, r: .1, seg: 16 });
        addCyl(0.01, 0.78, 0.18, 0.13, (wheelAx === 'z' ? 'x' : 'z'), '#f8fbff', { h: 2.15, m: .1, r: .1, seg: 16 });
        // chrome side trim + side steps
        kit.block(...r(0.15, 0.85, 0.02, 0.06), 2.35, 2.55, chrome, { m: .8, r: .25 });
        kit.block(...r(0.15, 0.85, 0.94, 0.98), 2.35, 2.55, chrome, { m: .8, r: .25 });
        kit.block(...r(0.18, 0.80, -0.04, 0.04), 0.95, 1.2, chrome, { m: .7, r: .3 });
        kit.block(...r(0.18, 0.80, 0.96, 1.04), 0.95, 1.2, chrome, { m: .7, r: .3 });
        for (const [ws, wt] of [[0.22, 0.0], [0.78, 0.0], [0.22, 0.90], [0.78, 0.90]]) {
          addCyl(ws, wt + 0.05, 0.88, 0.44, wheelAx, blk, { h: 0.88, m: .4, r: .35 });
          addCyl(ws, wt + 0.05, 0.34, 0.46, wheelAx, '#1a1a1a', { h: 0.88, m: .2, r: .5 });
          // red brake calipers
          const [wx, wy] = mid(ws, wt + 0.05);
          kit.block(wx - 0.18, wy - 0.18, wx + 0.18, wy + 0.18, 0.55, 1.15, red, { m: .2, r: .4 });
        }
      } else {
        kit.block(...r(0, 1, .03, .97), 0.6, 3.3, color, { m: .3, r: .35 });
        kit.block(...r(.25, .68, .1, .9), 3.3, 4.9, '#9fc4dc', { m: .2, r: .2 });
        for (const [ws, wt] of [[.12, 0], [.75, 0], [.12, .93], [.75, .93]]) kit.block(...r(ws, ws + .1, wt, wt + .07), 0, 1.6, '#151515');
      }
    },
    fire(a, b, c, d, face = 'e') {
      // Built-in firebox: logs, glowing embers, a few flickering flame planes, and a warm light.
      const alongX = (c - a) >= (d - b);
      const len = alongX ? (c - a) : (d - b);
      const nLogs = Math.max(2, Math.round(len / 1.15));
      const logC = ['#3a2416', '#4a2e18', '#2a1a10', '#5a3820'];
      for (let i = 0; i < nLogs; i++) {
        const t0 = (i + 0.12) / nLogs, t1 = Math.min(0.98, (i + 0.82) / nLogs);
        const col = logC[i % logC.length];
        if (alongX) kit.block(a + t0 * (c - a), b + 0.12, a + t1 * (c - a), d - 0.12, 0.12, 0.55, col, { r: .85 });
        else kit.block(a + 0.12, b + t0 * (d - b), c - 0.12, b + t1 * (d - b), 0.12, 0.55, col, { r: .85 });
      }
      const ember = new THREE.MeshStandardMaterial({ color: '#ff6a1a', emissive: '#ff4a00', emissiveIntensity: 1.4, roughness: 1 });
      const ex0 = a + 0.15, ey0 = b + 0.15, ex1 = c - 0.15, ey1 = d - 0.15;
      const em = new THREE.Mesh(boxRect(ex0, ey0, ex1, ey1, 0.08, 0.22, 0), ember);
      em.castShadow = false; furn.add(em);
      if (!TEX.flame) {
        TEX.flame = canvasTex((g, s) => {
          g.clearRect(0, 0, s, s);
          const grd = g.createLinearGradient(s / 2, s, s / 2, 0);
          grd.addColorStop(0, 'rgba(255,80,0,0)');
          grd.addColorStop(0.15, 'rgba(255,90,10,.85)');
          grd.addColorStop(0.45, 'rgba(255,160,20,.8)');
          grd.addColorStop(0.75, 'rgba(255,230,80,.55)');
          grd.addColorStop(1, 'rgba(255,255,200,0)');
          g.fillStyle = grd;
          g.beginPath();
          g.moveTo(s * 0.5, s);
          g.bezierCurveTo(s * 0.05, s * 0.7, s * 0.15, s * 0.25, s * 0.5, 0);
          g.bezierCurveTo(s * 0.85, s * 0.25, s * 0.95, s * 0.7, s * 0.5, s);
          g.fill();
        }, 128);
        TEX.flame.wrapS = TEX.flame.wrapT = THREE.ClampToEdgeWrapping;
      }
      const flames = [];
      const nF = Math.max(3, Math.round(len / 1.4) + 1);
      const cx = (a + c) / 2, cy = (b + d) / 2;
      const inward = { e: [0.35, 0], w: [-0.35, 0], n: [0, -0.35], s: [0, 0.35] }[face] || [0.35, 0];
      for (let i = 0; i < nF; i++) {
        const t = (i + 0.5) / nF;
        const fx = alongX ? a + t * (c - a) : cx;
        const fy = alongX ? cy : b + t * (d - b);
        const mat = new THREE.MeshBasicMaterial({
          map: TEX.flame, transparent: true, depthWrite: false, side: THREE.DoubleSide,
          opacity: 0.7, color: i % 2 ? '#ffe08a' : '#ff9a3a', blending: THREE.AdditiveBlending,
        });
        const h = 2.1 + (i % 3) * 0.25;
        const g = new THREE.PlaneGeometry(0.7 + (i % 2) * 0.15, h);
        const m = new THREE.Mesh(g, mat);
        m.position.set(Wx(fx + inward[0] * 0.15), 0.7 + h / 2, Wz(fy + inward[1] * 0.15));
        m.rotation.y = (i % 2 ? 0.7 : -0.7);
        m.castShadow = m.receiveShadow = false;
        furn.add(m);
        flames.push({ mesh: m, baseH: h, phase: i * 1.3 });
      }
      const light = new THREE.PointLight('#ffb056', 1.55, 18, 2);
      light.position.set(Wx(cx + inward[0]), 2.1, Wz(cy + inward[1]));
      light.castShadow = false;
      root.add(light);
      fires.push({ light, base: 1.55, flames, ember, t0: Math.random() * 12 });
    },
  };
  if (typeof M.furnish === 'function') M.furnish(kit);
  else if (Array.isArray(M.furnish)) { // JSON models: a list of [method, ...args] calls on the kit
    for (const op of M.furnish) {
      if (!Array.isArray(op) || !['block', 'plane', 'water', 'bed', 'car', 'firewood', 'zDoor', 'fire'].includes(op[0])) continue;
      const args = op.slice(1).map(v => (typeof v === 'number' || typeof v === 'string' || (v && typeof v === 'object' && !Array.isArray(v))) ? v : undefined);
      try { kit[op[0]](...args); } catch (e) { console.warn('skipped furnish op', op, e); }
    }
  }
  if (currentStyle === 'english-country') applyEnglishCountry(kit, st, H, WS);
  syncAreaUi(M);

  // roofs
  roof = new THREE.Group(); roof.visible = roofOn; root.add(roof);
  const roofTex = TEX[mats.roofTex || 'shingle'];
  const roofTop = new THREE.MeshStandardMaterial({ map: roofTex, color: '#ffffff', roughness: mats.roofTex === 'metal' ? .45 : .85, metalness: mats.roofTex === 'metal' ? .35 : 0, side: THREE.FrontSide });
  const roofUnder = new THREE.MeshStandardMaterial({ color: mats.roofUnder || '#d9d4ca', roughness: .9, side: THREE.BackSide });
  const gableInside = new THREE.MeshStandardMaterial({ color: mats.int || '#f8f6f1', roughness: .95, side: THREE.BackSide });
  const gableMat = { int: intMat, ext: extMat, brick: MAT.brick, board: MAT.board, glass: MAT.glass };
  for (const rf of M.roofs || []) {
    if (rf.flat) { const m = new THREE.Mesh(boxRect(rf.x0, rf.y0, rf.x1, rf.y1, rf.h, rf.h + .8), new THREE.MeshStandardMaterial({ color: '#1d1e20', roughness: .7 })); m.castShadow = true; roof.add(m); continue; }
    if (rf.shed) { // single-slope roof: high edge at y0 (or x0 when along:'y'), low edge at y1 (x1)
      const ax = rf.along !== 'y', o = rf.oh ?? 0.8, span = ax ? rf.y1 - rf.y0 : rf.x1 - rf.x0, k = (rf.lo - rf.hi) / span;
      const a0 = (ax ? rf.x0 : rf.y0) - o, a1 = (ax ? rf.x1 : rf.y1) + o, s0 = ax ? rf.y0 : rf.x0, s1 = (ax ? rf.y1 : rf.x1) + o, h1 = rf.lo + k * o;
      const V = (a, sv, h) => ax ? new THREE.Vector3(Wx(a), h, Wz(sv)) : new THREE.Vector3(Wx(sv), h, Wz(a));
      const q = [V(a0, s0, rf.hi), V(a1, s0, rf.hi), V(a1, s1, h1), V(a0, s1, h1)], pos = [], uvs = [];
      for (const [i, j, l] of [[0, 1, 2], [0, 2, 3]]) {
        let t = [q[i], q[j], q[l]];
        const n = new THREE.Vector3().subVectors(t[1], t[0]).cross(new THREE.Vector3().subVectors(t[2], t[0]));
        if (n.y < 0) t = [t[0], t[2], t[1]];
        for (const v of t) { pos.push(v.x, v.y, v.z); uvs.push((ax ? v.z : v.x) / 6, (ax ? v.x : v.z) / 6); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.computeVertexNormals();
      const top = new THREE.Mesh(g, roofTop); top.castShadow = true; top.receiveShadow = true;
      roof.add(top, new THREE.Mesh(g, roofUnder));
      continue;
    }
    const along = rf.along === 'y', pitch = rf.pitch ?? .5, ohv = rf.oh ?? 1.5, eaveW = rf.eave ?? H;
    const oh = Array.isArray(ohv) ? ohv : [ohv, ohv], endOh = rf.endOh ?? [Math.max(...oh), Math.max(...oh)];
    const a = along ? [rf.x0 - oh[0], rf.x1 + oh[1]] : [rf.y0 - oh[0], rf.y1 + oh[1]];
    const b = along ? [rf.y0 - endOh[0], rf.y1 + endOh[1]] : [rf.x0 - endOh[0], rf.x1 + endOh[1]];
    const wHalf = along ? (rf.x1 - rf.x0) / 2 : (rf.y1 - rf.y0) / 2, mid = along ? (rf.x0 + rf.x1) / 2 : (rf.y0 + rf.y1) / 2;
    const eaveA = eaveW - oh[0] * pitch, eaveB = eaveW - oh[1] * pitch, ridge = eaveW + wHalf * pitch;
    const P = (acr, alo, h) => along ? new THREE.Vector3(Wx(acr), h, Wz(alo)) : new THREE.Vector3(Wx(alo), h, Wz(acr));
    const pos = [], uvs = [];
    const tri = (p, q, r) => {
      const n = new THREE.Vector3().subVectors(q, p).cross(new THREE.Vector3().subVectors(r, p));
      const pts = n.y < 0 ? [p, r, q] : [p, q, r];
      for (const v of pts) { pos.push(v.x, v.y, v.z); uvs.push((along ? v.z : v.x) / 6, (along ? v.x : v.z) / 6); }
    };
    const quad = (p, q, r, s) => { tri(p, q, r); tri(p, r, s); };
    quad(P(a[0], b[0], eaveA), P(mid, b[0], ridge), P(mid, b[1], ridge), P(a[0], b[1], eaveA));
    quad(P(a[1], b[0], eaveB), P(a[1], b[1], eaveB), P(mid, b[1], ridge), P(mid, b[0], ridge));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.computeVertexNormals();
    const top = new THREE.Mesh(g, roofTop); top.castShadow = true; top.receiveShadow = true;
    const under = new THREE.Mesh(g, roofUnder);
    roof.add(top, under);
    // gable end triangles over the walls
    const wa = along ? [rf.x0, rf.x1] : [rf.y0, rf.y1], wb = along ? [rf.y0, rf.y1] : [rf.x0, rf.x1];
    const rw = eaveW + ((wa[1] - wa[0]) / 2) * pitch;
    const ends = rf.ends || [mats.gable || 'ext', mats.gable || 'ext'];
    ends.forEach((em, i) => {
      if (!em) return;
      const e = wb[i];
      const tg = new THREE.BufferGeometry();
      let p1 = P(wa[0], e, eaveW), p2 = P(wa[1], e, eaveW); const p3 = P((wa[0] + wa[1]) / 2, e, rw);
      { // orient the face outward (away from the roof's other end)
        const n = new THREE.Vector3().subVectors(p2, p1).cross(new THREE.Vector3().subVectors(p3, p1));
        const outward = along ? (i === 0 ? -1 : 1) * n.z : (i === 0 ? -1 : 1) * n.x;
        if (outward < 0) [p1, p2] = [p2, p1];
      }
      tg.setAttribute('position', new THREE.Float32BufferAttribute([p1, p2, p3].flatMap(v => [v.x, v.y, v.z]), 3));
      tg.setAttribute('uv', new THREE.Float32BufferAttribute([p1, p2, p3].flatMap(v => [(along ? v.x : v.z) / 5, v.y / 5]), 2));
      tg.computeVertexNormals();
      const mat = (gableMat[em] || extMat).clone(); mat.side = em === 'glass' ? THREE.DoubleSide : THREE.FrontSide;
      const tm = new THREE.Mesh(tg, mat); tm.castShadow = em !== 'glass'; roof.add(tm);
      if (em !== 'glass') roof.add(new THREE.Mesh(tg, gableInside));
      if (em === 'glass') { // dark mullions on a glass gable
        const fm = '#151618';
        for (let k2 = 1; k2 < 4; k2++) { const s = wa[0] + (wa[1] - wa[0]) * k2 / 4, hh = eaveW + (Math.min(s - wa[0], wa[1] - s)) * pitch; roof.add(kit.block(along ? s - .1 : e - .1, along ? e - .1 : s - .1, along ? s + .1 : e + .1, along ? e + .1 : s + .1, eaveW, hh, fm)); }
      }
    });
  }
  // flat ceilings for 9' rooms (visible with the roof on; vaulted rooms show the roof underside)
  ceilings = mesh((M.ceilings || []).map(r => { const g = planeRect(r[0], r[1], r[2], r[3], r[4] || H, 4); return g; }), (st.ceiling && MAT[st.ceiling]) || MAT.ceiling, false);
  if (ceilings) { ceilings.visible = roofOn; root.add(ceilings); }

  // labels
  labels = new THREE.Group(); root.add(labels);
  for (const r of M.rooms) {
    const [name, dims, , a, b, c, d, o = {}] = r;
    if (o.noLabel || !name) continue;
    const div = document.createElement('div');
    const minor = o.minor || !dims;
    div.className = 'label' + (minor ? ' minor' : '');
    div.textContent = String(name);
    if (dims || o.vaulted) { const sm = document.createElement('small'); sm.textContent = `${dims || ''}${o.vaulted ? (dims ? ' · ' : '') + 'vaulted' : ''}`; div.appendChild(sm); }
    const obj = new CSS2DObject(div);
    const [lx, ly] = o.labelAt || [(a + c) / 2, (b + d) / 2];
    obj.position.set(Wx(lx), minor ? 3 : 4.5, Wz(ly));
    labels.add(obj);
  }
  setLabels(labelsOn);

  // plan overlay
  const pi = M.planImage;
  if (pi) {
    const tex = new THREE.TextureLoader().load(resolveAsset(pi.src)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const IW = pi.sizePx[0] / pi.pxPerFt, IH = pi.sizePx[1] / pi.pxPerFt, IX0 = -pi.originPx[0] / pi.pxPerFt, IY0 = -pi.originPx[1] / pi.pxPerFt;
    planOverlay = new THREE.Mesh(new THREE.PlaneGeometry(IW, IH), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: .92, depthWrite: false }));
    planOverlay.rotation.x = -Math.PI / 2; planOverlay.position.set(Wx(IX0 + IW / 2), 0.12, Wz(IY0 + IH / 2)); planOverlay.renderOrder = 2;
    planOverlay.visible = planOn; root.add(planOverlay);
  }
  setCut(cutOn); setRoof(roofOn);
  $('mtitle').textContent = M.title || M.name; $('msub').textContent = M.subtitle || '';
  document.title = `${M.name || M.title || 'Model'} — Home View`;
  setModelUi(true);
}

// ---------- controls / modes ----------
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true; orbit.dampingFactor = .08; orbit.maxPolarAngle = Math.PI * 0.49; orbit.minDistance = 8; orbit.maxDistance = 450;
orbit.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }; orbit.screenSpacePanning = true;
let mode = 'orbit', roofOn = false, labelsOn = true, cutOn = false, planOn = false;
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const HELP = {
  orbit: isTouch ? 'Drag to rotate · pinch to zoom · two fingers to pan.' : 'Drag to rotate · scroll to zoom · right-drag (or Shift+drag) to pan.',
  top: 'Top-down plan view. Drag to pan/rotate, scroll or pinch to zoom.',
  walk: isTouch ? 'Drag to look around · use the arrow pad to walk.' : 'Click the view to look with the mouse · W A S D / arrows to walk · Shift to run · Esc to release the mouse. Turn the Roof on to see vaulted ceilings.',
};
const setBtn = (id, on) => $(id).classList.toggle('on', !!on);
function animateCam(pos, target, ms = 700) {
  const p0 = camera.position.clone(), t0 = orbit.target.clone(), start = performance.now();
  (function step(now) {
    const k = Math.min(1, (now - start) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    camera.position.lerpVectors(p0, pos, e); orbit.target.lerpVectors(t0, target, e); camera.lookAt(orbit.target);
    if (k < 1) requestAnimationFrame(step);
  })(start);
}
function exitWalk() {
  if (document.pointerLockElement) document.exitPointerLock();
  $('pad').style.display = 'none'; $('walkmsg').style.display = 'none'; $('cross').style.display = 'none';
  camera.fov = 50; camera.updateProjectionMatrix(); orbit.enabled = true;
}
function setMode(m, instant = false) {
  if (mode === 'walk' && m !== 'walk') exitWalk();
  mode = m;
  document.body.classList.toggle('walk-pad', m === 'walk' && typeof isTouch !== 'undefined' && isTouch);
  setBtn('bOrbit', m === 'orbit'); setBtn('bTop', m === 'top'); setBtn('bWalk', m === 'walk');
  $('help').textContent = HELP[m];
  const size = Math.max(BW, BH) / 91;
  if (m === 'orbit') {
    const k = Math.max(0.85, 0.95 / camera.aspect) * size;
    const pos = new THREE.Vector3(52, 66, 92).multiplyScalar(k), tgt = new THREE.Vector3(0, 0, 4);
    if (instant) { camera.position.copy(pos); orbit.target.copy(tgt); camera.lookAt(tgt); } else animateCam(pos, tgt);
  } else if (m === 'top') {
    setRoof(false);
    const span = Math.max(BH + 10, (BW + 14) / camera.aspect);
    const pos = new THREE.Vector3(0, span / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) + 12, 0.01), tgt = new THREE.Vector3(0, 0, 0);
    if (instant) { camera.position.copy(pos); orbit.target.copy(tgt); camera.lookAt(tgt); } else animateCam(pos, tgt);
  } else if (m === 'walk') {
    orbit.enabled = false; camera.fov = 70; camera.updateProjectionMatrix();
    const s = M.walkStart || [CX, CZ + BH / 2 + 5, 0];
    player.set(Wx(s[0]), Wz(s[1])); yaw = s[2] || 0; pitch = -0.05;
    $('cross').style.display = 'block';
    if (isTouch) $('pad').style.display = 'grid'; else $('walkmsg').style.display = 'block';
  }
}
function setRoof(v) { roofOn = v; if (roof) roof.visible = v; if (ceilings) ceilings.visible = v; setBtn('bRoof', v); if (v && cutOn) setCut(false); }
function setLabels(v) { labelsOn = v; if (labels) { labels.visible = v; labels.children.forEach(o => { o.visible = v; }); } setBtn('bLabels', v); }
function setCut(v) { cutOn = v; if (wallsCut) { wallsCut.visible = v; wallsFull.visible = !v; } setBtn('bCut', v); if (v && roofOn) setRoof(false); }
function setPlan(v) { planOn = v; if (planOverlay) planOverlay.visible = v; setBtn('bPlan', v); }
$('bRoof').onclick = () => setRoof(!roofOn);
$('bLabels').onclick = () => setLabels(!labelsOn);
$('bCut').onclick = () => setCut(!cutOn);
$('bPlan').onclick = () => setPlan(!planOn);
$('bOrbit').onclick = () => setMode('orbit');
$('bTop').onclick = () => setMode('top');
$('bWalk').onclick = () => setMode('walk');
$('toggleHud').onclick = () => { const h = $('hud'); h.classList.toggle('collapsed'); $('toggleHud').textContent = h.classList.contains('collapsed') ? '▸' : '▾'; };

// ---------- walk-through ----------
const EYE = 5.5, RADIUS = 0.75, player = new THREE.Vector2();
let yaw = 0, pitch = 0;
const keys = {};
function blocked(x, z) {
  for (const [a, b, c, d] of solids) {
    const nx = Math.max(a, Math.min(x, c)), nz = Math.max(b, Math.min(z, d));
    if ((x - nx) ** 2 + (z - nz) ** 2 < RADIUS * RADIUS) return true;
  }
  return false;
}
addEventListener('keydown', e => { keys[e.code] = true; if (mode === 'walk' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', e => { keys[e.code] = false; });
$('walkmsg').onclick = () => renderer.domElement.requestPointerLock?.();
renderer.domElement.addEventListener('click', () => { if (mode === 'walk' && !isTouch && !document.pointerLockElement) renderer.domElement.requestPointerLock?.(); });
document.addEventListener('pointerlockchange', () => { if (mode === 'walk') $('walkmsg').style.display = document.pointerLockElement ? 'none' : 'block'; });
document.addEventListener('mousemove', e => {
  if (mode !== 'walk' || !document.pointerLockElement) return;
  yaw -= e.movementX * 0.0025; pitch = Math.max(-1.3, Math.min(1.3, pitch - e.movementY * 0.0025));
});
let drag = null;
renderer.domElement.addEventListener('pointerdown', e => { if (mode === 'walk' && !document.pointerLockElement) drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
addEventListener('pointermove', e => {
  if (!drag || mode !== 'walk' || e.pointerId !== drag.id) return;
  yaw += (e.clientX - drag.x) * 0.005; pitch = Math.max(-1.3, Math.min(1.3, pitch + (e.clientY - drag.y) * 0.005));
  drag.x = e.clientX; drag.y = e.clientY;
});
addEventListener('pointerup', () => drag = null); addEventListener('pointercancel', () => drag = null);
const pad = {};
for (const b of document.querySelectorAll('#pad button[data-k]')) {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); pad[k] = true; });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => pad[k] = false);
}
function walkStep(dt) {
  let f = 0, s = 0;
  if (keys.KeyW || keys.ArrowUp || pad.f) f += 1;
  if (keys.KeyS || keys.ArrowDown || pad.b) f -= 1;
  if (keys.KeyD || keys.ArrowRight || pad.r) s += 1;
  if (keys.KeyA || keys.ArrowLeft || pad.l) s -= 1;
  const speed = (keys.ShiftLeft || keys.ShiftRight ? 12 : 6) * dt;
  if (f || s) {
    const len = Math.hypot(f, s); f /= len; s /= len;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const dx = (fx * f + rx * s) * speed, dz = (fz * f + rz * s) * speed;
    if (!blocked(player.x + dx, player.y)) player.x += dx;
    if (!blocked(player.x, player.y + dz)) player.y += dz;
  }
  camera.position.set(player.x, EYE, player.y);
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
}

// ---------- north arrow ----------
const narrow = $('narrow'), dir = new THREE.Vector3();
function updateNorth() {
  camera.getWorldDirection(dir);
  let ang;
  if (Math.hypot(dir.x, dir.z) < 1e-3) { const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion); ang = Math.atan2(up.x, -up.z); }
  else ang = Math.atan2(dir.x, -dir.z);
  narrow.setAttribute('transform', `rotate(${(-ang * 180 / Math.PI).toFixed(1)})`);
}

// ---------- GLB / glTF models (uploaded by users) ----------
function disposeRoot() {
  if (!root) return;
  root.traverse(o => { if (o.element?.parentNode) o.element.parentNode.removeChild(o.element); if (o.geometry) o.geometry.dispose(); });
  scene.remove(root); root = null;
}
function buildGLB(gltfScene, meta = {}) {
  disposeRoot();
  root = new THREE.Group(); scene.add(root);
  wallsFull = wallsCut = labels = planOverlay = ceilings = null; solids = [];
  const box = new THREE.Box3().setFromObject(gltfScene), size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.z) || 1;
  const k = maxDim < 80 ? 3.28084 : 1; // most exporters write metres; the engine works in feet
  gltfScene.scale.multiplyScalar(k);
  box.setFromObject(gltfScene); const c = box.getCenter(new THREE.Vector3());
  gltfScene.position.sub(new THREE.Vector3(c.x, box.min.y, c.z));
  gltfScene.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
  root.add(gltfScene);
  const roofNodes = [];
  gltfScene.traverse(o => { if (/roof/i.test(o.name || '')) roofNodes.push(o); });
  roof = roofNodes.length ? { set visible(v) { roofNodes.forEach(n => { n.visible = v; }); } } : null;
  box.setFromObject(gltfScene); const s2 = box.getSize(new THREE.Vector3());
  CX = 0; CZ = 0; BW = s2.x; BH = s2.z;
  const R = Math.max(BW, BH) * 0.8 + 10;
  sun.position.set(R * .7, 110, R * .9);
  Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 10, far: 400 }); sun.shadow.camera.updateProjectionMatrix();
  M = { name: meta.name || 'Model', title: meta.name || 'Model', subtitle: meta.subtitle || '', rooms: [], walkStart: [0, BH / 2 + 6, 0] };
  $('mtitle').textContent = M.title; $('msub').textContent = M.subtitle;
  document.title = `${M.name} — Home View`;
  setModelUi(false, roofNodes.length > 0);
  if (roofNodes.length) setRoof(true);
}

// JSON models: same shape as models/smith-0N.js but plain data (no code).
function sanitize(v, depth = 0) {
  if (depth > 12) return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') return v.slice(0, 300);
  if (typeof v === 'boolean' || v === null) return v;
  if (Array.isArray(v)) return v.slice(0, 20000).map(x => sanitize(x, depth + 1));
  if (typeof v === 'object') { const o = {}; for (const [kk, x] of Object.entries(v)) if (!/^(__proto__|constructor|prototype)$/.test(kk)) o[kk] = sanitize(x, depth + 1); return o; }
  return undefined;
}
function normalizeJsonModel(raw, fallbackName) {
  const m = sanitize(raw) || {};
  if (!Array.isArray(m.rooms) || !m.rooms.length) throw new Error('This model file has no "rooms" list, so it is not in the Home View JSON format.');
  m.rooms = m.rooms.filter(r => Array.isArray(r) && r.length >= 7 && [3, 4, 5, 6].every(i => typeof r[i] === 'number'));
  if (!m.rooms.length) throw new Error('No valid rooms in this model file.');
  const w = m.walls && typeof m.walls === 'object' ? m.walls : {};
  m.walls = { ext: [], int: [], win: [], door: [], counter: [] };
  for (const key of Object.keys(m.walls)) m.walls[key] = (Array.isArray(w[key]) ? w[key] : []).filter(r => Array.isArray(r) && r.length >= 4 && r.slice(0, 4).every(n => typeof n === 'number'));
  m.name ||= fallbackName || 'Model';
  return m;
}

// ---------- source routing ----------
// ?ex=smith-01        public example (tabs for all examples)
// ?p=<projectId>      your own project (needs login)
// ?s=<shareToken>     read-only shared project
const params = new URLSearchParams(location.search);
const SRC = params.get('s') ? { kind: 'share', token: params.get('s') } : params.get('p') ? { kind: 'project', id: params.get('p') } : { kind: 'example' };
let assetBase = null, projectFiles = [];
function resolveAsset(src) {
  if (!src) return src;
  const f = projectFiles.find(x => x.kind === 'image' && (x.name === src || x.id === src));
  if (f && assetBase) return `${assetBase}/files/${f.id}`;
  return src;
}
function setModelUi(engine, hasRoof = true) {
  for (const id of ['bLabels', 'bCut', 'bPlan']) if ($(id)) $(id).style.display = engine ? '' : 'none';
  if ($('bRoof')) $('bRoof').style.display = engine || hasRoof ? '' : 'none';
  if (engine && $('bPlan')) $('bPlan').style.display = M.planImage ? '' : 'none';
  if ($('styleWrap')) $('styleWrap').style.display = engine ? '' : 'none';
}
function showError(msg) { const er = $('err'); er.style.display = 'flex'; er.textContent = msg; }

const tabs = $('tabs');
const back = $('back');
if (SRC.kind === 'example') {
  back.href = '/examples'; back.textContent = '← Examples';
  for (const r of REGISTRY) {
    const b = document.createElement('button'); b.textContent = r.name; b.dataset.id = r.id;
    b.onclick = () => { const u = new URL(location.href); u.searchParams.set('ex', r.id); history.replaceState(null, '', u); loadExample(r.id); };
    tabs.appendChild(b);
  }
} else if (SRC.kind === 'project') { back.href = `/project?id=${encodeURIComponent(SRC.id)}`; back.textContent = '← Project'; }
else { back.href = `/s/${encodeURIComponent(SRC.token)}`; back.textContent = '← Project'; }
// keep the HUD / compass below the tab bar when the tabs wrap onto two rows on phones
const syncTopbar = () => document.documentElement.style.setProperty('--tbh', $('topbar').offsetHeight + 'px');
syncTopbar(); addEventListener('resize', syncTopbar);
let currentId = null;
async function loadExample(id) {
  const entry = REGISTRY.find(r => r.id === id) || REGISTRY[0];
  if (entry.id === currentId) return;
  currentId = entry.id;
  for (const b of tabs.children) b.classList.toggle('on', b.dataset.id === entry.id);
  const mod = await entry.load();
  if (currentId !== entry.id) return;
  if (mode === 'walk') exitWalk();
  disposeRoot();
  currentStyle = (mod.default && mod.default.defaultStyle) || 'default';
  syncStyleUi();
  buildModel(mod.default);
  setMode('orbit', true);
  window.app.current = entry.id;
}
async function loadProjectModel() {
  assetBase = SRC.kind === 'share' ? `/api/share/${encodeURIComponent(SRC.token)}` : `/api/projects/${encodeURIComponent(SRC.id)}`;
  const r = await fetch(assetBase, { credentials: 'same-origin' });
  if (r.status === 401) { location.href = `/?next=${encodeURIComponent(location.pathname + location.search)}`; return; }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return showError(data.error || 'Could not load this project.');
  const p = data.project; projectFiles = p.files || [];
  const model = projectFiles.find(f => f.kind === 'model');
  $('brandName').textContent = p.name;
  if (!model) return showError('This project has no 3D model yet. Add one from the project page.');
  const fr = await fetch(`${assetBase}/files/${model.id}`, { credentials: 'same-origin' });
  if (!fr.ok) return showError('Could not download the 3D model file.');
  try {
    if (model.format === 'json') {
      buildModel(normalizeJsonModel(await fr.json(), p.name));
    } else {
      const buf = await fr.arrayBuffer();
      const gltf = await new Promise((res, rej) => new GLTFLoader().parse(buf, '', res, rej));
      buildGLB(gltf.scene, { name: p.name, subtitle: model.name });
    }
  } catch (e) { console.error(e); return showError('This 3D model could not be opened: ' + (e.message || e)); }
  setMode('orbit', true);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); labelRenderer.setSize(innerWidth, innerHeight);
});
const clock = new THREE.Clock();

function modelAreas(M) {
  if (M?.areas && typeof M.areas.heated === 'number') {
    return { heated: M.areas.heated, garage: M.areas.garage || 0, porch: M.areas.porch || 0 };
  }
  let heated = 0, garage = 0, porch = 0;
  for (const r of (M?.rooms || [])) {
    const [name, , type, a, b, c, d, o = {}] = r;
    if (a == null || d == null) continue;
    const area = Math.abs((c - a) * (d - b));
    const nm = (name || '').toLowerCase();
    if (o.outside || type === 'porch' || type === 'terrace') porch += area;
    else if (/\bbay\b|garage|shop garage|\bshop\b/.test(nm)) garage += area;
    else heated += area;
  }
  return { heated, garage, porch };
}
function fmtSf(n) { return Math.round(n).toLocaleString('en-US'); }
function syncAreaUi(M) {
  const el = $('sf'), h = $('sfHeated'), sub = $('sfSub');
  if (!el) return;
  if (!M?.rooms?.length && !M?.areas) { el.style.display = 'none'; return; }
  const { heated, garage, porch } = modelAreas(M);
  if (!heated && !garage && !porch) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  h.textContent = fmtSf(heated);
  const bits = [];
  if (garage > 1) bits.push('Garage ' + fmtSf(garage) + ' sf');
  if (porch > 1) bits.push('Porches ' + fmtSf(porch) + ' sf');
  if (sub) { sub.textContent = bits.join(' · '); sub.style.display = bits.length ? '' : 'none'; }
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (mode === 'walk') walkStep(dt); else orbit.update();
  updateNorth();
  if (labelsOn && labels) for (const o of labels.children) {
    const show = mode !== 'walk' || Math.hypot(o.position.x - camera.position.x, o.position.z - camera.position.z) < 16;
    o.visible = show;
  }
  if (fires.length) {
    const t = performance.now() / 1000;
    for (const f of fires) {
      const flick = 0.82 + 0.18 * Math.sin(t * 11 + f.t0) + 0.1 * Math.sin(t * 27 + 1.4);
      f.light.intensity = f.base * flick;
      if (f.ember) (f.ember.material || f.ember).emissiveIntensity = 1.1 + 0.5 * flick;
      for (const fl of f.flames) {
        const k = 0.84 + 0.22 * Math.sin(t * (8.5 + fl.phase) + fl.phase);
        fl.mesh.scale.y = k;
        fl.mesh.material.opacity = 0.5 + 0.35 * Math.sin(t * (6.5 + fl.phase * 0.7) + fl.phase);
      }
    }
  }
  renderer.render(scene, camera); labelRenderer.render(scene, camera);
  requestAnimationFrame(loop);
}
function syncStyleUi() {
  const sel = $('bStyle'), wrap = $('styleWrap');
  if (!sel) return;
  sel.value = STYLES[currentStyle] ? currentStyle : 'default';
  if (wrap) wrap.style.display = loadedModel || currentStyle ? '' : 'none';
}
function setStyle(id) {
  if (!STYLES[id]) id = 'default';
  if (id === currentStyle) return;
  currentStyle = id;
  syncStyleUi();
  if (!loadedModel) return;
  const keep = mode, keepRoof = roofOn, keepLabels = labelsOn, keepCut = cutOn, keepPlan = planOn;
  const walkPos = mode === 'walk' ? player.clone() : null, walkYaw = yaw, walkPitch = pitch;
  if (mode === 'walk') exitWalk();
  buildModel(loadedModel);
  setMode(keep, true);
  if (keep === 'walk' && walkPos) { player.copy(walkPos); yaw = walkYaw; pitch = walkPitch; }
  setRoof(keepRoof); setLabels(keepLabels); setCut(keepCut); setPlan(keepPlan);
}
if ($('bStyle')) $('bStyle').addEventListener('change', e => setStyle(e.target.value));

window.app = {
  loadExample, scene, setMode, setRoof, setLabels, setCut, setPlan, setStyle, camera, orbit, player,
  setLook: (y, p) => { yaw = y; pitch = p; }, setPlayer: (fx, fy) => player.set(Wx(fx), Wz(fy)), current: null,
};
if (SRC.kind === 'example') await loadExample(params.get('ex') || REGISTRY[0].id);
else await loadProjectModel();
loop();
