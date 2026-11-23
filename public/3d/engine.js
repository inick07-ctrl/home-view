import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import REGISTRY from './models/registry.js';
import { parcelDefaults, lotStats, formatLotArea, worldRings, buildableRings, xfHouse, houseFromWorld } from '../js/parcel.js';
import { sanitizeWalls, clipCounters, autoFurnish, installFurniture, buildItemMesh, makeItem, itemRect, clearanceHit, isCoveredPorch, isPorchLike, CATALOG as ITEM_CATALOG } from './furniture.js';
import { mountPlanEditor, cloneWalls, cloneRooms, cloneItems, cloneRoofs, loadLocalLayout, sanitizeLayout } from './plan-editor.js';
import { createWalkAudio } from './walk-audio.js';
import { mountPlanExport, setPlan2d, openExportDialog, exportPlansPdf, buildPlanSvgSet } from './plan-export.js';

const $ = (id) => document.getElementById(id);
const canvas = $('c');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: true }); }
catch (e) { const er = $('err'); er.style.display = 'flex'; er.textContent = 'Your browser could not start WebGL, which this 3D model needs.'; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#cfe3f2');
scene.fog = new THREE.Fog('#cfe3f2', 260, 560);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.2, 1000);
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
Object.assign(labelRenderer.domElement.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: 3 });
document.body.appendChild(labelRenderer.domElement);

const hemi = new THREE.HemisphereLight('#ffffff', '#c9c1b2', 0.95);
scene.add(hemi);
const amb = new THREE.AmbientLight('#ffffff', 0);
scene.add(amb);
const sun = new THREE.DirectionalLight('#fff3df', 1.6);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
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
  subway: canvasTex((g, s) => {
    g.fillStyle = '#f3f5f6'; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(100,106,112,.42)'; g.lineWidth = 3;
    const h = s / 4, w = s / 2;
    for (let row = 0; row < 5; row++) {
      const off = (row % 2) * (w / 2);
      for (let col = -1; col < 3; col++) g.strokeRect(col * w + off, row * h, w, h);
    }
  }),
  concrete: canvasTex((g, s) => { g.fillStyle = '#b9bbbd'; g.fillRect(0, 0, s, s); for (let i = 0; i < 1400; i++) { const c = rnd(i) > .5 ? 255 : 60; g.fillStyle = `rgba(${c},${c},${c},.08)`; g.fillRect(rnd(i + 1) * s, rnd(i + 2) * s, 2, 2); } g.strokeStyle = 'rgba(80,80,80,.35)'; g.strokeRect(0, 0, s, s); }),
  porch: canvasTex((g, s) => { const n = 6; for (let i = 0; i < n; i++) { const v = 170 + rnd(i + 3) * 18; g.fillStyle = `rgb(${v + 10},${v - 32},${v - 80})`; g.fillRect(i * s / n, 0, s / n, s); g.fillStyle = 'rgba(50,30,10,.55)'; g.fillRect(i * s / n, 0, 2, s); } }),
  gym: canvasTex((g, s) => { g.fillStyle = '#8fa9c7'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(40,60,90,.35)'; g.lineWidth = 2; g.strokeRect(1, 1, s - 2, s - 2); }),
  stone: canvasTex((g, s) => { g.fillStyle = '#c9c4b8'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(90,85,75,.4)'; g.lineWidth = 2; g.strokeRect(1, 1, s - 2, s - 2); g.beginPath(); g.moveTo(s / 2, 0); g.lineTo(s / 2, s / 2); g.moveTo(0, s / 2); g.lineTo(s, s / 2); g.stroke(); }),
  terrace: canvasTex((g, s) => { g.fillStyle = '#d6d3cb'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(110,105,95,.45)'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.strokeRect(0, i * s / 4, s, s / 4); g.beginPath(); const o = (i % 2) * s / 4; g.moveTo(o + s / 4, i * s / 4); g.lineTo(o + s / 4, (i + 1) * s / 4); g.moveTo(o + 3 * s / 4, i * s / 4); g.lineTo(o + 3 * s / 4, (i + 1) * s / 4); g.stroke(); } }),
  paver: canvasTex((g, s) => { g.fillStyle = '#8f8d89'; g.fillRect(0, 0, s, s); for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { const v = 130 + rnd(x * 9 + y) * 30; g.fillStyle = `rgb(${v},${v - 2},${v - 6})`; g.fillRect(x * s / 4 + (y % 2) * s / 8 + 1, y * s / 8 + 1, s / 4 - 2, s / 8 - 2); } }),
  grass: canvasTex((g, s) => { g.fillStyle = '#7fb26a'; g.fillRect(0, 0, s, s); for (let i = 0; i < 3000; i++) { g.fillStyle = rnd(i) > .5 ? 'rgba(40,90,30,.18)' : 'rgba(200,230,150,.15)'; g.fillRect(rnd(i + 5) * s, rnd(i + 9) * s, 2, 3); } }),
  board: canvasTex((g, s) => { g.fillStyle = '#2a2c2f'; g.fillRect(0, 0, s, s); for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(i * s / 8, 0, 3, s); g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(i * s / 8 + 3, 0, 2, s); } }),
  brick: canvasTex((g, s) => { g.fillStyle = '#9a958e'; g.fillRect(0, 0, s, s); const rows = 16; for (let y = 0; y < rows; y++) for (let x = 0; x < 5; x++) { const v = 120 + rnd(x * 31 + y * 7) * 45; g.fillStyle = `rgb(${v},${v - 3},${v - 8})`; g.fillRect(x * s / 4 - (y % 2) * s / 8 + 1.5, y * s / rows + 1.5, s / 4 - 3, s / rows - 3); } }),
  // white board-and-batten siding (modern farmhouse)
  whiteBoard: canvasTex((g, s) => { g.fillStyle = '#f4f3ef'; g.fillRect(0, 0, s, s); for (let i = 0; i < 4; i++) { const x = i * s / 4; g.fillStyle = 'rgba(0,0,0,.10)'; g.fillRect(x + 7, 0, 2, s); g.fillStyle = '#fbfaf7'; g.fillRect(x, 0, 7, s); g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(x - 1, 0, 1, s); } }),
  // stacked ledgestone for wainscots and pillar bases
  ledgestone: canvasTex((g, s) => {
    g.fillStyle = '#6d665d'; g.fillRect(0, 0, s, s);
    const rows = 9; let i = 0;
    for (let y = 0; y < rows; y++) {
      let x = -rnd(y + 40) * s * 0.3;
      while (x < s) {
        const w = s * (0.14 + rnd(i + 3) * 0.22), v = 120 + rnd(i) * 70, warm = rnd(i + 11) * 18;
        g.fillStyle = `rgb(${v + warm},${v + warm * 0.6 - 4},${v - 10})`;
        g.fillRect(x + 2, y * s / rows + 2, w - 4, s / rows - 4);
        g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(x + 2, y * s / rows + 2, w - 4, 3);
        x += w; i++;
      }
    }
  }, 512),
  metal: canvasTex((g, s) => { g.fillStyle = '#1d1e20'; g.fillRect(0, 0, s, s); for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(i * s / 4, 0, 3, s); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(i * s / 4 + 3, 0, 2, s); } }),
  // dark charcoal architectural (dimensional) shingles: staggered tabs with tonal variation
  darkShingle: canvasTex((g, s) => { g.fillStyle = '#26282b'; g.fillRect(0, 0, s, s); const rows = 10; let i = 0; for (let y = 0; y < rows; y++) { let x = -rnd(y + 70) * s * 0.2; while (x < s) { const w = s * (0.08 + rnd(i + 5) * 0.12), v = 34 + rnd(i) * 26; g.fillStyle = `rgb(${v},${v + 1},${v + 4})`; g.fillRect(x + 1, y * s / rows + 1, w - 2, s / rows - 3); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x, (y + 1) * s / rows - 3, w, 3); x += w; i++; } } }, 256),
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
const TEXSCALE = { whiteBoard: 6, ledgestone: 5, wood: 6, tile: 4, subway: 3, concrete: 10, porch: 4, gym: 4, stone: 3, terrace: 6, paver: 6, board: 4, brick: 5, metal: 6, shingle: 4, darkShingle: 5, limewash: 8, palePlaster: 10, lightOak: 5, slate: 8, lightStone: 3 };
const MAT = {};
for (const k of ['wood', 'tile', 'subway', 'concrete', 'porch', 'gym', 'stone', 'terrace', 'paver']) MAT[k] = new THREE.MeshLambertMaterial({ map: TEX[k] });
MAT.brick = new THREE.MeshStandardMaterial({ map: TEX.brick, roughness: .95 });
MAT.board = new THREE.MeshStandardMaterial({ map: TEX.board, roughness: .85 });
MAT.whiteBoard = new THREE.MeshStandardMaterial({ map: TEX.whiteBoard, roughness: .82 });
MAT.ledgestone = new THREE.MeshStandardMaterial({ map: TEX.ledgestone, roughness: .95 });
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

// ---------- project site photos (optional 360 pano + aerial ground) ----------
const SITE_DEFAULTS = { panoYaw: 0, panoHeight: 6, groundScale: 200, groundRot: 0, groundX: 0, groundY: 0 };
const GLASS_DEFAULT = { opacity: 0.45, color: '#9fd0ee' };
let siteCfg = { ...SITE_DEFAULTS };
let siteCanEdit = false, sitePanoUrl = null, siteGroundUrl = null;
let sitePanoTex = null, siteGroundTex = null, sitePanoUrlLoaded = null, siteGroundUrlLoaded = null;
let panoSphere = null, groundPhoto = null, parcelGroup = null, siteObjUrls = [];
let siteSaveTimer = 0, sitePending = {}, styleFog = { color: '#cfe3f2', near: 260, far: 560 }, styleBg = '#cfe3f2';

function disposeSiteMesh(mesh) {
  if (!mesh) return;
  scene.remove(mesh);
  mesh.geometry?.dispose();
  mesh.material?.map?.dispose?.();
  mesh.material?.dispose?.();
}
function clearSiteEnv({ restore = true } = {}) {
  disposeSiteMesh(panoSphere); panoSphere = null;
  disposeSiteMesh(groundPhoto); groundPhoto = null;
  if (parcelGroup) {
    parcelGroup.traverse(o => { o.geometry?.dispose(); if (o.material) { if (Array.isArray(o.material)) o.material.forEach(m => m.dispose()); else o.material.dispose(); } });
    scene.remove(parcelGroup); parcelGroup = null;
  }
  sitePanoTex = siteGroundTex = null;
  sitePanoUrlLoaded = siteGroundUrlLoaded = null;
  for (const u of siteObjUrls) URL.revokeObjectURL(u);
  siteObjUrls = [];
  sitePanoUrl = siteGroundUrl = null;
  siteCanEdit = false;
  siteCfg = { ...SITE_DEFAULTS };
  ground.visible = true;
  ground.position.y = -0.6;
  if (restore) {
    MAT.glass.opacity = (currentStyle === 'english-country') ? 0.3 : GLASS_DEFAULT.opacity;
    scene.background = new THREE.Color(styleBg);
    if (!scene.fog) scene.fog = new THREE.Fog(styleBg, styleFog.near, styleFog.far);
    else { scene.fog.color.set(styleBg); scene.fog.near = styleFog.near; scene.fog.far = styleFog.far; }
  }
  syncSiteHud();
}
async function textureFromUrl(url) {
  const r = await fetch(url, { credentials: 'same-origin' });
  if (!r.ok) throw new Error('Could not load site photo');
  const obj = URL.createObjectURL(await r.blob());
  siteObjUrls.push(obj);
  const tex = await new Promise((res, rej) => {
    new THREE.TextureLoader().load(obj, t => res(t), undefined, () => rej(new Error('Could not decode site photo')));
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}
function applySiteEnv() {
  const hasPano = !!(sitePanoTex || (panoSphere && sitePanoUrl));
  if (sitePanoTex) {
    if (!panoSphere) {
      const mat = new THREE.MeshBasicMaterial({ map: sitePanoTex, side: THREE.BackSide, depthWrite: false, fog: false });
      panoSphere = new THREE.Mesh(new THREE.SphereGeometry(750, 64, 40), mat);
      panoSphere.renderOrder = -10;
      panoSphere.frustumCulled = false;
      scene.add(panoSphere);
    } else if (panoSphere.material.map !== sitePanoTex) {
      panoSphere.material.map = sitePanoTex;
      panoSphere.material.needsUpdate = true;
    }
    // yaw=0: center of the equirectangular photo faces model north (-Z). See heading slider.
    panoSphere.rotation.y = Math.PI / 2 + THREE.MathUtils.degToRad(siteCfg.panoYaw || 0);
    panoSphere.position.set(0, siteCfg.panoHeight ?? 6, 0);
    scene.background = new THREE.Color('#0a1220');
    scene.fog = null;
    MAT.glass.opacity = Math.min(MAT.glass.opacity, 0.22);
  } else if (panoSphere) {
    disposeSiteMesh(panoSphere); panoSphere = null;
    MAT.glass.opacity = (currentStyle === 'english-country') ? 0.3 : GLASS_DEFAULT.opacity;
    scene.background = new THREE.Color(styleBg);
    if (!scene.fog) scene.fog = new THREE.Fog(styleBg, styleFog.near, styleFog.far);
    else { scene.fog.color.set(styleBg); scene.fog.near = styleFog.near; scene.fog.far = styleFog.far; }
  }
  if (siteGroundTex) {
    const img = siteGroundTex.image;
    const aspect = (img && img.height && img.width) ? (img.height / img.width) : 1;
    const w = siteCfg.groundScale || 200, d = w * aspect;
    if (groundPhoto) {
      groundPhoto.geometry.dispose();
      groundPhoto.geometry = new THREE.PlaneGeometry(w, d);
    } else {
      const mat = new THREE.MeshLambertMaterial({ map: siteGroundTex, side: THREE.DoubleSide });
      groundPhoto = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
      groundPhoto.receiveShadow = true;
      scene.add(groundPhoto);
    }
    // North-up aerial: image top → model north. Slider adds rotation.
    groundPhoto.rotation.set(-Math.PI / 2, 0, Math.PI + THREE.MathUtils.degToRad(siteCfg.groundRot || 0), 'XYZ');
    groundPhoto.position.set(siteCfg.groundX || 0, -0.6, siteCfg.groundY || 0);
    ground.position.y = -0.85;
    ground.visible = true;
  } else {
    if (groundPhoto) { disposeSiteMesh(groundPhoto); groundPhoto = null; }
    ground.position.y = -0.6;
    ground.visible = true;
  }
  applyParcelLines();
  applyHouseXform();
  syncLotStatus();
  syncSiteHud();
}
function applyParcelLines() {
  if (parcelGroup) {
    parcelGroup.traverse(o => { o.geometry?.dispose(); if (o.material) { if (Array.isArray(o.material)) o.material.forEach(m => m.dispose()); else o.material.dispose(); } });
    scene.remove(parcelGroup); parcelGroup = null;
  }
  const parcel = siteCfg.parcel ? parcelDefaults(siteCfg.parcel) : null;
  const rings = parcel ? worldRings(parcel) : null;
  if (!rings?.length) return;
  parcelGroup = new THREE.Group();
  const lineMat = new THREE.LineBasicMaterial({ color: 0xe0a95a, linewidth: 2 });
  const fillMat = new THREE.MeshBasicMaterial({ color: 0xe0a95a, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
  const dashMat = new THREE.LineDashedMaterial({ color: 0xf3e2b8, linewidth: 2, dashSize: 1.6, gapSize: 1.1 });
  const postMat = new THREE.MeshStandardMaterial({ color: 0xf3e2b8, roughness: 0.55, metalness: 0.1 });
  const addRingLine = (plan, mat, y, dashed) => {
    const pts = plan.map(([x, yy]) => new THREE.Vector3(x, y, yy));
    if (!pts[0].equals(pts[pts.length - 1])) pts.push(pts[0].clone());
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    if (dashed) geo.computeLineDistances();
    const line = new THREE.Line(geo, mat);
    line.renderOrder = 3;
    parcelGroup.add(line);
  };
  for (const ring of rings) {
    if (!ring || ring.length < 2) continue;
    const plan = ring.map(([x, y]) => [x, y]);
    addRingLine(plan, lineMat, 0.06, false);
    if (plan.length >= 3) {
      const shape = new THREE.Shape(plan.map(([x, y]) => new THREE.Vector2(x, -y)));
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), fillMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.03;
      mesh.renderOrder = 2;
      parcelGroup.add(mesh);
    }
  }
  const hasSetbacks = parcel.setbackF > 0 || parcel.setbackS > 0 || parcel.setbackR > 0;
  if (hasSetbacks) {
    const buildable = buildableRings(rings, parcel);
    for (const ring of buildable) {
      if (!ring || ring.length < 2) continue;
      const plan = ring.map(([x, y]) => [x, y]);
      addRingLine(plan, dashMat, 0.10, true);
      // low posts at envelope corners
      const seen = new Set();
      for (const [x, y] of plan) {
        const key = x.toFixed(2) + ',' + y.toFixed(2);
        if (seen.has(key)) continue;
        seen.add(key);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 2.6, 8), postMat);
        post.position.set(x, 1.3, y);
        post.castShadow = false;
        post.receiveShadow = false;
        parcelGroup.add(post);
      }
    }
  }
  scene.add(parcelGroup);
}
let lastHouseX = 0, lastHouseZ = 0;
function housePose() {
  const p = siteCfg.parcel ? parcelDefaults(siteCfg.parcel) : null;
  return p ? { x: p.houseX, z: p.houseY, yaw: p.houseYaw } : { x: 0, z: 0, yaw: 0 };
}
function applyHouseXform() {
  const h = housePose();
  if (root) {
    root.position.set(h.x, 0, h.z);
    root.rotation.y = -THREE.MathUtils.degToRad(h.yaw);
  }
  const dx = h.x - lastHouseX, dz = h.z - lastHouseZ;
  if ((dx || dz) && orbit && mode !== 'walk') {
    camera.position.x += dx; camera.position.z += dz;
    orbit.target.x += dx; orbit.target.z += dz;
  }
  lastHouseX = h.x; lastHouseZ = h.z;
}
function syncLotStatus() {
  const lotEl = $('sfLot'), warnEl = $('lotWarn'), sf = $('sf');
  const parcel = siteCfg.parcel ? parcelDefaults(siteCfg.parcel) : null;
  if (!parcel) {
    if (lotEl) { lotEl.textContent = ''; lotEl.hidden = true; }
    if (warnEl) { warnEl.textContent = ''; warnEl.hidden = true; }
    return;
  }
  const bounds = { cx: CX, cz: CZ, bw: BW, bh: BH };
  const st = lotStats(parcel, M, bounds);
  if (lotEl) {
    const cov = st.coverage == null ? '' : ` · Coverage ${st.coverage < 10 ? st.coverage.toFixed(1) : Math.round(st.coverage)}%`;
    lotEl.textContent = 'Lot ' + formatLotArea(st.area) + cov;
    lotEl.hidden = false;
    if (sf && lotEl.textContent) sf.style.display = 'block';
  }
  if (warnEl) {
    warnEl.textContent = st.warning || '';
    warnEl.hidden = !st.warning;
    if (st.warning && sf) sf.style.display = 'block';
  }
}

function siteFromProject(p) {
  const s = p?.site || {};
  siteCfg = {
    panoYaw: s.pano ? s.pano.yaw : SITE_DEFAULTS.panoYaw,
    panoHeight: s.pano ? s.pano.height : SITE_DEFAULTS.panoHeight,
    groundScale: s.ground ? s.ground.scale : SITE_DEFAULTS.groundScale,
    groundRot: s.ground ? s.ground.rot : SITE_DEFAULTS.groundRot,
    groundX: s.ground ? s.ground.x : SITE_DEFAULTS.groundX,
    groundY: s.ground ? s.ground.y : SITE_DEFAULTS.groundY,
  };
  siteCanEdit = SRC.kind === 'project';
  sitePanoUrl = (s.pano && assetBase) ? `${assetBase}/files/${s.pano.fileId}` : null;
  siteGroundUrl = (s.ground && assetBase) ? `${assetBase}/files/${s.ground.fileId}` : null;
  siteCfg.parcel = s.parcel ? parcelDefaults(s.parcel) : null;
}
async function loadProjectSite(p) {
  siteFromProject(p);
  try {
    if (sitePanoUrl && sitePanoUrl !== sitePanoUrlLoaded) {
      sitePanoTex = await textureFromUrl(sitePanoUrl);
      sitePanoUrlLoaded = sitePanoUrl;
    }
    if (siteGroundUrl && siteGroundUrl !== siteGroundUrlLoaded) {
      siteGroundTex = await textureFromUrl(siteGroundUrl);
      siteGroundUrlLoaded = siteGroundUrl;
    }
  } catch (e) { console.warn(e); }
  applySiteEnv();
}
function syncSiteHud() {
  const hud = $('siteHud'), panoHud = $('panoHud'), groundHud = $('groundHud');
  if (!hud) return;
  const show = siteCanEdit && (sitePanoUrl || siteGroundUrl || siteCfg.parcel);
  hud.hidden = !show;
  if (panoHud) panoHud.hidden = !sitePanoUrl;
  if (groundHud) groundHud.hidden = !siteGroundUrl;
  const parcelHud = $('parcelHud');
  if (parcelHud) parcelHud.hidden = !siteCfg.parcel;
  const set = (id, v, fmt) => {
    const el = $(id), out = $(id + 'Val');
    if (el && document.activeElement !== el) el.value = v;
    if (out) out.textContent = fmt;
  };
  set('panoYaw', siteCfg.panoYaw, Math.round(siteCfg.panoYaw) + '°');
  set('panoHeight', siteCfg.panoHeight, (Math.round(siteCfg.panoHeight * 10) / 10) + ' ft');
  set('groundScale', siteCfg.groundScale, String(Math.round(siteCfg.groundScale)));
  set('groundRot', siteCfg.groundRot, Math.round(siteCfg.groundRot) + '°');
  set('groundX', siteCfg.groundX, '');
  set('groundY', siteCfg.groundY, '');
  if ($('groundX') && document.activeElement !== $('groundX')) $('groundX').value = siteCfg.groundX;
  if ($('groundY') && document.activeElement !== $('groundY')) $('groundY').value = siteCfg.groundY;
  if (siteCfg.parcel) {
    const p = parcelDefaults(siteCfg.parcel);
    set('parcelRot', p.rot || 0, Math.round(p.rot || 0) + '°');
    if ($('parcelX') && document.activeElement !== $('parcelX')) $('parcelX').value = p.x || 0;
    if ($('parcelY') && document.activeElement !== $('parcelY')) $('parcelY').value = p.y || 0;
    if ($('setbackF') && document.activeElement !== $('setbackF')) $('setbackF').value = p.setbackF;
    if ($('setbackS') && document.activeElement !== $('setbackS')) $('setbackS').value = p.setbackS;
    if ($('setbackR') && document.activeElement !== $('setbackR')) $('setbackR').value = p.setbackR;
    if ($('lotFront') && document.activeElement !== $('lotFront')) $('lotFront').value = p.front;
    set('houseYaw', p.houseYaw, Math.round(p.houseYaw) + '°');
    if ($('houseX') && document.activeElement !== $('houseX')) $('houseX').value = p.houseX;
    if ($('houseY') && document.activeElement !== $('houseY')) $('houseY').value = p.houseY;
  }
}
function queueSiteSave(partial) {
  if (partial.parcel) {
    siteCfg.parcel = { ...(siteCfg.parcel || {}), ...partial.parcel };
    const pendingParcel = { ...(sitePending.parcel || siteCfg.parcel), ...partial.parcel };
    const rest = { ...partial };
    delete rest.parcel;
    Object.assign(siteCfg, rest);
    Object.assign(sitePending, rest);
    sitePending.parcel = pendingParcel;
  } else {
    Object.assign(siteCfg, partial);
    Object.assign(sitePending, partial);
  }
  applySiteEnv();
  if (!siteCanEdit || SRC.kind !== 'project') return;
  clearTimeout(siteSaveTimer);
  siteSaveTimer = setTimeout(async () => {
    const body = sitePending; sitePending = {};
    try {
      await fetch(`/api/projects/${encodeURIComponent(SRC.id)}`, {
        method: 'PATCH', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: body }),
      });
    } catch (e) { console.warn(e); }
  }, 400);
}
function bindSiteHud() {
  const bindRange = (id, key, fmt) => {
    const el = $(id); if (!el) return;
    el.addEventListener('input', () => {
      const v = +el.value;
      if ($(id + 'Val') && fmt) $(id + 'Val').textContent = fmt(v);
      queueSiteSave({ [key]: v });
    });
  };
  bindRange('panoYaw', 'panoYaw', v => Math.round(v) + '°');
  bindRange('panoHeight', 'panoHeight', v => (Math.round(v * 10) / 10) + ' ft');
  bindRange('groundScale', 'groundScale', v => String(Math.round(v)));
  bindRange('groundRot', 'groundRot', v => Math.round(v) + '°');
  for (const [id, key] of [['groundX', 'groundX'], ['groundY', 'groundY']]) {
    $(id)?.addEventListener('change', () => queueSiteSave({ [key]: +$(id).value || 0 }));
  }
  const parcelPartial = (extra) => ({ parcel: { ...(siteCfg.parcel || { rings: [] }), ...extra } });
  $('parcelRot')?.addEventListener('input', () => {
    const v = +$('parcelRot').value;
    if ($('parcelRotVal')) $('parcelRotVal').textContent = Math.round(v) + '°';
    queueSiteSave(parcelPartial({ rot: v }));
  });
  $('parcelX')?.addEventListener('change', () => queueSiteSave(parcelPartial({ x: +$('parcelX').value || 0 })));
  $('parcelY')?.addEventListener('change', () => queueSiteSave(parcelPartial({ y: +$('parcelY').value || 0 })));
  for (const key of ['setbackF', 'setbackS', 'setbackR', 'houseX', 'houseY']) {
    $(key)?.addEventListener('change', () => queueSiteSave(parcelPartial({ [key]: +$(key).value || 0 })));
  }
  $('lotFront')?.addEventListener('change', () => queueSiteSave(parcelPartial({ front: $('lotFront').value })));
  $('houseYaw')?.addEventListener('input', () => {
    const v = +$('houseYaw').value;
    if ($('houseYawVal')) $('houseYawVal').textContent = Math.round(v) + '°';
    queueSiteSave(parcelPartial({ houseYaw: v }));
  });
}
bindSiteHud();

// ---------- per-model state ----------
let M = null, root = null, wallsFull, wallsCut, roof, labels, planOverlay, ceilings;
let fires = [];
let CX = 0, CZ = 0, BW = 90, BH = 80, solids = [];
const Wx = (x) => x - CX, Wz = (y) => y - CZ;

// Butt perpendicular wall boxes at corners so they no longer share a volume (z-fighting).
function trimCornerOverlaps(rects) {
  const out = rects.map((r) => r.slice());
  const isH = (r) => (r[2] - r[0]) >= (r[3] - r[1]);
  const ov = (a, b) => {
    const x0 = Math.max(a[0], b[0]), x1 = Math.min(a[2], b[2]);
    const y0 = Math.max(a[1], b[1]), y1 = Math.min(a[3], b[3]);
    return (x1 - x0 > 0.001 && y1 - y0 > 0.001) ? [x0, y0, x1, y1] : null;
  };
  const at = (r, axis, o, eps = 0.06) => axis === 'x'
    ? (Math.abs(o[0] - r[0]) < eps || Math.abs(o[2] - r[2]) < eps)
    : (Math.abs(o[1] - r[1]) < eps || Math.abs(o[3] - r[3]) < eps);
  const shrink = (r, axis, o) => {
    if (axis === 'y') {
      if (Math.abs(o[1] - r[1]) < 0.06) r[1] = o[3];
      else if (Math.abs(o[3] - r[3]) < 0.06) r[3] = o[1];
    } else {
      if (Math.abs(o[0] - r[0]) < 0.06) r[0] = o[2];
      else if (Math.abs(o[2] - r[2]) < 0.06) r[2] = o[0];
    }
  };
  for (let i = 0; i < out.length; i++) {
    for (let j = i + 1; j < out.length; j++) {
      const a = out[i], b = out[j];
      if (isH(a) === isH(b)) continue;
      const o = ov(a, b); if (!o) continue;
      const v = isH(a) ? b : a, h = isH(a) ? a : b;
      const vEnd = at(v, 'y', o), hEnd = at(h, 'x', o);
      if (vEnd && !hEnd) shrink(v, 'y', o);
      else if (hEnd && !vEnd) shrink(h, 'x', o);
      else if (vEnd && hEnd) shrink(v, 'y', o);
    }
  }
  return out.filter((r) => (isH(r) ? r[2] - r[0] : r[3] - r[1]) > 0.02);
}

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


// ---------- plan edit / furniture layout ----------
let planOriginal = null;
let activeLayout = null;
let currentItems = [];
let itemsGroup = null;
let highlightGroup = null;
let wallPickGroup = null;
let wallPickMat = null;
let itemsOn = true;
let itemFire = { flames: [], lights: [], glows: [] }; // animated flames inside placed fireplace items
let chimneyMeshes = []; // model chimney/flue blocks tagged { chimney: [x, y] }: shown only while a wood-burning fireplace item sits near (x, y)
let editMode = false;
let defaultItems = [];
const hlMat = new THREE.MeshStandardMaterial({ color: '#e0a95a', emissive: '#e0a95a', emissiveIntensity: 0.45, transparent: true, opacity: 0.35, depthWrite: false, depthTest: false });
const hlEdge = new THREE.MeshBasicMaterial({ color: '#e0a95a', transparent: true, opacity: 0.95, depthTest: false });

function snapshotOriginal(model) {
  planOriginal = { source: model, rooms: cloneRooms(model.rooms), walls: cloneWalls(model.walls) };
}
function modelWithLayout(source, layout) {
  return {
    ...source,
    rooms: layout?.rooms ? cloneRooms(layout.rooms) : cloneRooms(planOriginal ? planOriginal.rooms : source.rooms),
    walls: layout?.walls ? cloneWalls(layout.walls) : cloneWalls((planOriginal ? planOriginal.walls : source.walls)),
    roofs: layout?.roofs ? cloneRoofs(layout.roofs) : cloneRoofs((planOriginal ? planOriginal.roofs : source.roofs) || source.roofs),
  };
}
function currentPlanId() {
  return SRC.kind === 'project' ? 'p:' + SRC.id : SRC.kind === 'share' ? 's:' + SRC.token : 'ex:' + (currentId || 'default');
}
function layoutFromStorage() {
  const saved = loadLocalLayout(SRC.kind === 'project' ? 'project:' + SRC.id : SRC.kind === 'share' ? 'share:' + SRC.token : 'example:' + (currentId || 'default'));
  return sanitizeLayout(saved);
}
function wallsOnRoom(WS, room, slack = 0.6) {
  const R = [room[3] - slack, room[4] - slack, room[5] + slack, room[6] + slack];
  const inner = [room[3] + 0.35, room[4] + 0.35, room[5] - 0.35, room[6] - 0.35];
  const hit = [];
  const midIn = (w, box) => {
    const mx = (w[0] + w[2]) / 2, my = (w[1] + w[3]) / 2;
    return mx >= box[0] && mx <= box[2] && my >= box[1] && my <= box[3];
  };
  for (const kind of ['ext', 'int', 'win', 'door', 'counter']) {
    (WS[kind] || []).forEach((w, i) => {
      if (midIn(w, R) && !midIn(w, inner)) hit.push({ kind, i, w });
    });
  }
  return hit;
}
function translateSeg(w, dx, dy) { w[0] += dx; w[1] += dy; w[2] += dx; w[3] += dy; }
function captureLayout() {
  activeLayout = { version: 3, items: cloneItems(currentItems), rooms: cloneRooms(M.rooms), walls: cloneWalls(M.walls), roofs: cloneRoofs(M.roofs), finishes: JSON.parse(JSON.stringify(finishes || {})), deleted: JSON.parse(JSON.stringify(deletedRooms || [])), planInfo: (activeLayout && activeLayout.planInfo) ? { ...activeLayout.planInfo } : undefined };
  return activeLayout;
}
function rebuildPlan() {
  if (!planOriginal) return;
  captureLayout();
  const keep = { mode, roofOn, labelsOn, cutOn, planOn };
  buildModel(planOriginal.source, { layout: activeLayout });
  setRoof(keep.roofOn); setLabels(keep.labelsOn); setCut(keep.cutOn); setPlan(keep.planOn);
  try { dispatchEvent(new CustomEvent('peakstead-plan-changed')); } catch {}
}
let floorCtx = null, floorGroup = null, floorSig = '';
function stairHoles() {
  return currentItems.filter(it => ITEM_CATALOG[it.type]?.stair && it.dir === 'down').map(it => itemRect(it));
}
function rectMinus(r, holes) {
  let parts = [r];
  for (const h of holes) {
    const next = [];
    for (const p of parts) {
      const ix0 = Math.max(p[0], h[0]), iy0 = Math.max(p[1], h[1]), ix1 = Math.min(p[2], h[2]), iy1 = Math.min(p[3], h[3]);
      if (ix1 <= ix0 || iy1 <= iy0) { next.push(p); continue; }
      if (iy0 > p[1]) next.push([p[0], p[1], p[2], iy0]);
      if (iy1 < p[3]) next.push([p[0], iy1, p[2], p[3]]);
      if (ix0 > p[0]) next.push([p[0], iy0, ix0, iy1]);
      if (ix1 < p[2]) next.push([ix1, iy0, p[2], iy1]);
    }
    parts = next;
  }
  return parts.filter(p => p[2] - p[0] > 0.01 && p[3] - p[1] > 0.01);
}
function buildFloors() {
  if (!M || !root || !floorCtx) return;
  if (floorGroup && floorGroup.parent) floorGroup.parent.remove(floorGroup);
  floorGroup = new THREE.Group(); floorGroup.name = 'floors'; root.add(floorGroup);
  const st = floorCtx.st, holes = stairHoles();
  floorSig = JSON.stringify(holes.map(h => h.map(v => +v.toFixed(2))));
  const slabs = [];
  for (const r of (M.slabs || [])) for (const p of rectMinus([r[0], r[1], r[2], r[3]], holes)) slabs.push(boxRect(...p, -0.6, -0.01));
  const sm = mesh(slabs, MAT.slab, false); if (sm) floorGroup.add(sm);
  const byType = {};
  for (const r of M.rooms) {
    const [, , type, a, b, c, d, o = {}] = r;
    if (o.noFloor) continue;
    const ft = (st.floors && st.floors[type]) || type;
    const tint = tileTintFor(r);
    const key = ft + '|' + (tint || '');
    const bucket = (byType[key] ||= { ft, tint, geos: [] });
    for (const p of rectMinus([a, b, c, d], holes)) bucket.geos.push(planeRect(p[0], p[1], p[2], p[3], 0.02, TEXSCALE[ft] || TEXSCALE[type] || 4));
  }
  for (const { ft, tint, geos } of Object.values(byType)) {
    const base = MAT[ft] || MAT.wood;
    const mat = tint ? tintedMat(base, finishHex(tint)) : base;
    const m = mesh(geos, mat, false); if (m) floorGroup.add(m);
  }
}
// walk-through collision for furniture & stairs (rugs, lights, roof/yard items excluded)
let itemSolids = [], itemDoors = [];
const NO_COLLIDE = /rug|pendant|chandelier|fan|lamp|sconce|plant|art|mirror|curtain|solar|light|mat\b|towel|septic|well|lawn|tree|shrub|grass|flower|path|patio|paver/i;
function collectItemSolids() {
  itemSolids = [];
  for (const it of currentItems) {
    const t = ITEM_CATALOG[it.type]; if (!t) continue;
    if (t.outbuilding) {
      if (!t.enclosed) continue;
      const W = it.w || t.w, D = it.d || t.d, a = ((it.rot || 0) * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
      const P = (lx, lz) => [it.x + lx * c - lz * sn, it.y + lx * sn + lz * c];
      for (const [x0, z0, x1, z1] of [[-W / 2, -D / 2, W / 2, -D / 2 + 0.3], [-W / 2, -D / 2, -W / 2 + 0.3, D / 2], [W / 2 - 0.3, -D / 2, W / 2, D / 2]]) {
        const p = [P(x0, z0), P(x1, z1)];
        itemSolids.push([Wx(Math.min(p[0][0], p[1][0])), Wz(Math.min(p[0][1], p[1][1])), Wx(Math.max(p[0][0], p[1][0])), Wz(Math.max(p[0][1], p[1][1]))]);
      }
      continue;
    }
    if (t.mount === 'roof' || NO_COLLIDE.test(it.type) || (t.h != null && t.h < 1.3 && !t.stair)) continue;
    if (it.onCounter || it.upper || (it.z || 0) > 2) continue;
    const r = itemRect(it), sh = t.stair ? 0 : 0.15; // stairs: blocked at the edge (no walkable upper/lower level modelled)
    if (r[2] - r[0] < 0.5 || r[3] - r[1] < 0.5) continue;
    itemSolids.push([Wx(r[0] + sh), Wz(r[1] + sh), Wx(r[2] - sh), Wz(r[3] - sh)]);
  }
}
function refreshItems() {
  if (!itemsGroup) return;
  if (floorCtx && JSON.stringify(stairHoles().map(h => h.map(v => +v.toFixed(2)))) !== floorSig) buildFloors();
  while (itemsGroup.children.length) itemsGroup.remove(itemsGroup.children[0]);
  const mt = M?.materials || {};
  const roofCol = mt.roof || ({ metal: '#2b2c2e', darkShingle: '#2e2f31', shingle: '#5d5952' }[mt.roofTex] || '#3a3b3d');
  const ctx = { Wx, Wz, ceiling: (M?.wallH || 9), house: { ext: mt.ext || '#e9e5dc', trim: mt.trim || (new THREE.Color(mt.ext || '#ffffff').getHSL({}).l < 0.35 ? '#1d1e20' : '#f4f2ec'), roof: roofCol, metal: mt.roofTex === 'metal' } };
  for (const rec of currentItems) {
    const painted = recWithFinishes(rec);
    const mesh = buildItemMesh(painted, ctx);
    if (!mesh) continue;
    if (painted.woodGrain) applyWoodGrain(mesh);
    applyItemHardware(rec, mesh);
    if (mesh.userData.mount === 'roof') mesh.visible = !!roofOn;
    itemsGroup.add(mesh);
  }
  itemsGroup.visible = itemsOn;
  addSepticRun();
  updateChimneys();
  itemFire = { flames: [], lights: [], glows: [] };
  itemDoors = [];
  itemsGroup.traverse((o) => {
    if (o.userData?.itemDoor) itemDoors.push({ piv: o, ...o.userData.itemDoor, open: 0 });
    if (o.userData?.flame) itemFire.flames.push(o);
    if (o.userData?.fireLight) itemFire.lights.push(o);
    if (o.userData?.emberGlow) itemFire.glows.push(o);
  });
  collectItemSolids();
}
/** Chimneys/flue chases on the roof follow the fuel type of the fireplace they serve (wood = shown, electric/none = hidden). */
// Morro Bay II is the default living / great-room sofa: swap model-placed sofas & sectionals in those rooms
// (back stays against the same wall, same facing). Applied to example defaults and, once, to saved v<3 layouts.
const MORRO_ROOM = /living|family|great|hearth|lounge|\bden\b/i;
function morroize(items, rooms) {
  return items.map((it) => {
    if (!it || (it.type !== 'sofa' && it.type !== 'sectional')) return it;
    const room = (rooms || []).find(r => it.x > r[3] && it.x < r[5] && it.y > r[4] && it.y < r[6] && !(r[7]?.outside));
    if (!room || !MORRO_ROOM.test(room[0] || '')) return it;
    const a = ((it.rot || 0) * Math.PI) / 180, fx = -Math.sin(a), fy = Math.cos(a);
    const along = Math.abs(fx) > 0.5 ? room[6] - room[4] : room[5] - room[3];
    if (along < 11.2) return it;
    const od = it.d || (it.type === 'sectional' ? 6.4 : 3.33), nd = 3.67;
    const bx = it.x - fx * od / 2, by = it.y - fy * od / 2;
    let x = bx + fx * nd / 2, y = by + fy * nd / 2;
    // keep the 128" sofa inside the room along its length
    if (Math.abs(fx) > 0.5) y = Math.max(room[4] + 5.6, Math.min(room[6] - 5.6, y)); else x = Math.max(room[3] + 5.6, Math.min(room[5] - 5.6, x));
    return makeItem('morroBay', { id: it.id, x, y, rot: it.rot, w: 10.67, d: nd, finish: 'beige', variant: 'upright' });
  });
}
function isFireplaceItem(it) { return ITEM_CATALOG[it?.type]?.category === 'fireplace'; }
function fuelOf(it) { return it.fuel || ITEM_CATALOG[it.type]?.defaultFuel || 'wood'; }
function updateChimneys() {
  for (const m of chimneyMeshes) {
    const [x, y] = m.userData.chimneyAt;
    let best = null, bd = 7;
    for (const it of currentItems || []) {
      if (!isFireplaceItem(it)) continue;
      const d = Math.hypot(it.x - x, it.y - y);
      if (d < bd) { bd = d; best = it; }
    }
    m.visible = !!best && fuelOf(best) === 'wood';
  }
}
/** Faint dashed run from the house to each septic tank and on to the nearest drain field. */
function addSepticRun() {
  if (!itemsGroup || !M?.rooms?.length) return;
  const tanks = (currentItems || []).filter((i) => /^septicTank/.test(i.type));
  if (!tanks.length) return;
  const fields = (currentItems || []).filter((i) => /^drainField/.test(i.type));
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const r of M.rooms) { if (r[7]?.outside || isPorchLike(r)) continue; x0 = Math.min(x0, r[3]); y0 = Math.min(y0, r[4]); x1 = Math.max(x1, r[5]); y1 = Math.max(y1, r[6]); }
  if (x0 > x1) return;
  const mat = new THREE.LineDashedMaterial({ color: '#5a4632', dashSize: 1.4, gapSize: 1.0, transparent: true, opacity: 0.8 });
  for (const t of tanks) {
    const hx = Math.max(x0, Math.min(t.x, x1)), hy = Math.max(y0, Math.min(t.y, y1));
    const pts = [[hx, hy], [t.x, t.y]];
    let best = null, bd = 1e9;
    for (const f of fields) { const d = Math.hypot(f.x - t.x, f.y - t.y); if (d < bd) { bd = d; best = f; } }
    if (best) pts.push([best.x, best.y]);
    const geo = new THREE.BufferGeometry().setFromPoints(pts.map(([x, y]) => new THREE.Vector3(Wx(x), 0.14, Wz(y))));
    const line = new THREE.Line(geo, mat); line.computeLineDistances(); line.userData.septicRun = true; line.raycast = () => {};
    itemsGroup.add(line);
  }
}
function setItemsList(items, { soft } = {}) {
  currentItems = cloneItems(items);
  if (activeLayout) activeLayout.items = cloneItems(items);
  refreshItems();
  try { dispatchEvent(new CustomEvent('peakstead-areas')); } catch {}
}
function addItemOp(type, opts = {}) {
  const rec = makeItem(type, opts);
  setItemsList([...(currentItems || []), rec]);
  return rec;
}
function highlightSel(sel) {
  if (!highlightGroup) return;
  while (highlightGroup.children.length) highlightGroup.remove(highlightGroup.children[0]);
  if (!sel || !M) return;
  const addBox = (x0, y0, x1, y1, h0, h1, mat = hlMat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(x1 - x0, 0.08), Math.max(h1 - h0, 0.04), Math.max(y1 - y0, 0.08)), mat);
    m.position.set(Wx((x0 + x1) / 2), (h0 + h1) / 2, Wz((y0 + y1) / 2));
    m.castShadow = false; m.receiveShadow = false;
    highlightGroup.add(m);
    return m;
  };
  if (sel.kind === 'item') {
    const it = currentItems.find(x => x.id === sel.id);
    if (!it) return;
    const r = itemRect(it);
    addBox(r[0] - 0.08, r[1] - 0.08, r[2] + 0.08, r[3] + 0.08, 0.03, 0.08, hlEdge);
  } else if (sel.kind === 'room') {
    const room = M.rooms[sel.index];
    if (!room) return;
    addBox(room[3], room[4], room[5], room[6], 0.02, 0.12);
    addBox(room[3] - 0.08, room[4] - 0.08, room[5] + 0.08, room[6] + 0.08, 0.12, 0.2, hlEdge);
    if (isPorchLike(room)) {
      const midX = (room[3] + room[5]) / 2, midY = (room[4] + room[6]) / 2;
      const handles = [
        ['w', room[3], midY], ['e', room[5], midY], ['n', midX, room[4]], ['s', midX, room[6]],
      ];
      for (const [edge, x, y] of handles) {
        const m = addBox(x - 0.35, y - 0.35, x + 0.35, y + 0.35, 0.15, 1.15, hlEdge);
        m.userData.resizeEdge = edge;
        m.userData.resizeRoom = sel.index;
      }
    }
  } else if (sel.kind === 'wall') {
    const w = (M.walls[sel.wallKind] || [])[sel.index];
    if (!w) return;
    const t = sel.hover ? 0.18 : 0.28;
    const h = sel.hover ? 3.2 : 4.2;
    addBox(w[0] - t, w[1] - t, w[2] + t, w[3] + t, 0, h, sel.hover ? hlEdge : hlMat);
  }
}
function patchRoomOp(index, patch) {
  const room = M.rooms[index];
  if (!room) return;
  const before = room.slice();
  if (patch.name != null) room[0] = String(patch.name).slice(0, 60);
  if (patch.floor != null) room[2] = patch.floor;
  if (patch.w != null) room[5] = room[3] + Math.max(3, +patch.w);
  if (patch.d != null) room[6] = room[4] + Math.max(3, +patch.d);
  if (Array.isArray(patch.resizeTo) && patch.resizeTo.length === 4 && patch.resizeTo.every(Number.isFinite)) {
    const [a, b, c, d] = patch.resizeTo;
    const x0 = Math.min(a, c), y0 = Math.min(b, d), x1 = Math.max(a, c), y1 = Math.max(b, d);
    if (x1 - x0 >= 3 && y1 - y0 >= 3) {
      room[3] = x0; room[4] = y0; room[5] = x1; room[6] = y1;
    }
  }
  if (patch.w != null || patch.d != null || patch.resizeTo) {
    room[1] = `${Math.round((room[5] - room[3]) * 10) / 10}' x ${Math.round((room[6] - room[4]) * 10) / 10}'`;
  }
  let dx = patch.dx || 0, dy = patch.dy || 0;
  if (patch.x0 != null && patch.move) dx = +patch.x0 - before[3];
  if (patch.y0 != null && patch.move) dy = +patch.y0 - before[4];
  if (patch.x0 != null && patch.move) { /* applied via dx */ }
  if (dx || dy) {
    room[3] += dx; room[4] += dy; room[5] += dx; room[6] += dy;
    const oldR = [before[3], before[4], before[5], before[6]];
    for (const it of currentItems) {
      if (it.x >= oldR[0] && it.x <= oldR[2] && it.y >= oldR[1] && it.y <= oldR[3]) { it.x += dx; it.y += dy; }
    }
    for (const { w } of wallsOnRoom(M.walls, before)) translateSeg(w, dx, dy);
  }
  if (room[5] !== before[5] || room[6] !== before[6] || room[3] !== before[3] || room[4] !== before[4]) {
    syncPorchGeometry(before, room);
  }
  if (!patch.soft) rebuildPlan();
  else { captureLayout(); refreshItems(); syncAreaUi(M); }
}

function roofOverlapsRoom(rf, room, slack = 1.25) {
  if (!rf) return false;
  const ax0 = Math.min(rf.x0, rf.x1) - slack, ay0 = Math.min(rf.y0, rf.y1) - slack;
  const ax1 = Math.max(rf.x0, rf.x1) + slack, ay1 = Math.max(rf.y0, rf.y1) + slack;
  const bx0 = Math.min(room[3], room[5]), by0 = Math.min(room[4], room[6]);
  const bx1 = Math.max(room[3], room[5]), by1 = Math.max(room[4], room[6]);
  return ax0 < bx1 && ax1 > bx0 && ay0 < by1 && ay1 > by0;
}

function syncPorchGeometry(before, after) {
  const dx0 = after[3] - before[3], dy0 = after[4] - before[4];
  const dx1 = after[5] - before[5], dy1 = after[6] - before[6];
  const tol = 1.6;
  for (const rf of (M.roofs || [])) {
    if (!roofOverlapsRoom(rf, before, 1.4)) continue;
    if (Math.abs(rf.x0 - before[3]) < tol) rf.x0 += dx0;
    if (Math.abs(rf.y0 - before[4]) < tol) rf.y0 += dy0;
    if (Math.abs(rf.x1 - before[5]) < tol) rf.x1 += dx1;
    if (Math.abs(rf.y1 - before[6]) < tol) rf.y1 += dy1;
  }
  // Resize (not just translate) walls that sat on a moved edge.
  if (dx0 || dy0 || dx1 || dy1) {
    for (const { w } of wallsOnRoom(M.walls, before, 0.75)) {
      const mx = (w[0] + w[2]) / 2, my = (w[1] + w[3]) / 2;
      const horiz = Math.abs(w[2] - w[0]) >= Math.abs(w[3] - w[1]);
      if (horiz) {
        if (Math.abs(my - before[4]) < 0.75) { w[1] += dy0; w[3] += dy0; }
        else if (Math.abs(my - before[6]) < 0.75) { w[1] += dy1; w[3] += dy1; }
        if (Math.abs(w[0] - before[3]) < 0.9) w[0] += dx0;
        if (Math.abs(w[2] - before[5]) < 0.9) w[2] += dx1;
      } else {
        if (Math.abs(mx - before[3]) < 0.75) { w[0] += dx0; w[2] += dx0; }
        else if (Math.abs(mx - before[5]) < 0.75) { w[0] += dx1; w[2] += dx1; }
        if (Math.abs(w[1] - before[4]) < 0.9) w[1] += dy0;
        if (Math.abs(w[3] - before[6]) < 0.9) w[3] += dy1;
      }
    }
  }
}
function removeRoomOp(index) {
  const room = M.rooms[index];
  if (!room) return;
  const R = [room[3], room[4], room[5], room[6]];
  currentItems = currentItems.filter(it => !(it.x >= R[0] && it.x <= R[2] && it.y >= R[1] && it.y <= R[3]));
  const doomed = new Set();
  for (const hit of wallsOnRoom(M.walls, room, 0.55)) {
    const mid = [(hit.w[0] + hit.w[2]) / 2, (hit.w[1] + hit.w[3]) / 2];
    const shared = M.rooms.some((r, i) => i !== index && !r[7]?.outside && mid[0] >= r[3] - 0.5 && mid[0] <= r[5] + 0.5 && mid[1] >= r[4] - 0.5 && mid[1] <= r[6] + 0.5
      && (Math.abs(mid[0] - r[3]) < 0.7 || Math.abs(mid[0] - r[5]) < 0.7 || Math.abs(mid[1] - r[4]) < 0.7 || Math.abs(mid[1] - r[6]) < 0.7));
    if (!shared) doomed.add(hit.kind + ':' + hit.i);
  }
  for (const kind of ['ext', 'int', 'win', 'door', 'counter']) {
    M.walls[kind] = (M.walls[kind] || []).filter((w, i) => !doomed.has(kind + ':' + i));
  }
  M.rooms.splice(index, 1);
  // kept interior walls that now face the outside become exterior walls (siding outside, paint inside)
  const insideNow = (x, y) => M.rooms.some(r => !(r[7]?.outside) && x > r[3] && x < r[5] && y > r[4] && y < r[6]);
  const flip = (w) => {
    const horiz = (w[2] - w[0]) >= (w[3] - w[1]), t = horiz ? w[3] - w[1] : w[2] - w[0], d = t / 2 + 0.7;
    const mx = (w[0] + w[2]) / 2, my = (w[1] + w[3]) / 2;
    const a = horiz ? insideNow(mx, w[1] - d) : insideNow(w[0] - d, my), b = horiz ? insideNow(mx, w[3] + d) : insideNow(w[2] + d, my);
    return a !== b;
  };
  const keepInt = [];
  for (const w of (M.walls.int || [])) { if (flip(w)) M.walls.ext.push(w); else keepInt.push(w); }
  M.walls.int = keepInt;
  for (const d of (M.walls.door || [])) if (!d[6] && flip(d)) d[6] = 1;
  for (const w of (M.walls.win || [])) void w;
  // roofs that sat mostly over the removed room go too (the rest of the roof stays closed over the house)
  const ov = (rf) => { const ix = Math.max(0, Math.min(rf.x1, R[2]) - Math.max(rf.x0, R[0])), iy = Math.max(0, Math.min(rf.y1, R[3]) - Math.max(rf.y0, R[1])); const A = Math.max(1e-6, (rf.x1 - rf.x0) * (rf.y1 - rf.y0)); return ix * iy / A; };
  if (Array.isArray(M.roofs)) M.roofs = M.roofs.filter(rf => !(rf && Number.isFinite(rf.x0) && ov(rf) > 0.6));
  const nm = (room[0] || '').toLowerCase(), area = Math.abs((R[2] - R[0]) * (R[3] - R[1]));
  const cat = (room[7]?.outside || room[2] === 'porch' || room[2] === 'terrace') ? 'porch' : (/\bbay\b|garage|\bshop\b/.test(nm) ? 'garage' : 'heated');
  deletedRooms.push({ name: room[0] || 'Room', rect: R, cat, area });
  rebuildPlan();
}
function removeRoomByName(name) {
  const i = (M?.rooms || []).findIndex(r => (r[0] || '') === name);
  if (i < 0) return false;
  removeRoomOp(i); return true;
}
// ---------- doors: remove / restore / colour; garage doors: add + resize ----------
function wallPerp(w, horiz) { return horiz ? (w[1] + w[3]) / 2 : (w[0] + w[2]) / 2; }
function removeDoorOp(i, as = 'opening') {
  const d = M.walls.door[i]; if (!d) return false;
  if (as === 'wall') {
    M.walls.door.splice(i, 1);
    const seg = [d[0], d[1], d[2], d[3]]; if (d[5]) seg.push(d[5]);
    (d[6] ? M.walls.ext : M.walls.int).push(seg);
  } else d[7] = { ...doorOpts(d), noLeaf: true };
  rebuildPlan(); return true;
}
function restoreDoorOp(i) {
  const d = M.walls.door[i]; if (!d) return false;
  const o = { ...doorOpts(d) }; delete o.noLeaf; d[7] = o; rebuildPlan(); return true;
}
function setDoorColorOp(i, color) {
  const d = M.walls.door[i]; if (!d) return false;
  const o = { ...doorOpts(d) }; if (color) o.color = color; else delete o.color; d[7] = o; rebuildDoorsOnly(); return true;
}
// rewrite an exterior wall line so it has openings exactly at `spans` inside region [A,B]
function setOpeningSpans(tmpl, horiz, perp, A, B, spans, oldIdx) {
  const WS = M.walls, H = M.wallH || 9, tol = 0.35;
  const along0 = (w) => horiz ? w[0] : w[1], along1 = (w) => horiz ? w[2] : w[3];
  const onLine = (w) => { const h2 = (w[2] - w[0]) >= (w[3] - w[1]); return h2 === horiz && Math.abs(wallPerp(w, horiz) - perp) < tol && along1(w) > A + 0.05 && along0(w) < B - 0.05; };
  // the whole region must be plain wall or the old door — no windows / other doors in the way
  for (const k of ['win', 'door']) for (let j = 0; j < (WS[k] || []).length; j++) {
    if (k === 'door' && j === oldIdx) continue;
    if (onLine(WS[k][j])) return { ok: false, why: k === 'win' ? 'a window is in the way' : 'another door is in the way' };
  }
  const walls = WS.ext.map((w, j) => [w, j]).filter(([w]) => onLine(w));
  const cov = walls.map(([w]) => [along0(w), along1(w)]);
  if (oldIdx != null) { const d = WS.door[oldIdx]; cov.push([along0(d), along1(d)]); }
  cov.sort((a, b) => a[0] - b[0]);
  let reach = A;
  for (const [a, b] of cov) { if (a > reach + 0.15) break; reach = Math.max(reach, b); }
  if (reach < B - 0.15) return { ok: false, why: 'not enough garage wall there' };
  const hWall = walls[0]?.[0]?.[4] || tmpl[5] || null;
  let t0 = perp - 0.2, t1 = perp + 0.2;
  if (walls[0]) { const w = walls[0][0]; t0 = horiz ? w[1] : w[0]; t1 = horiz ? w[3] : w[2]; }
  else if (oldIdx != null) { const d = WS.door[oldIdx]; t0 = horiz ? d[1] : d[0]; t1 = horiz ? d[3] : d[2]; }
  const mk = (a, b) => horiz ? [a, t0, b, t1] : [t0, a, t1, b];
  const drop = new Set(walls.map(([, j]) => j));
  const keep = [];
  for (const [w] of walls) {
    if (along0(w) < A - 0.01) { const p = mk(along0(w), A); if (w[4]) p.push(w[4]); keep.push(p); }
    if (along1(w) > B + 0.01) { const p = mk(B, along1(w)); if (w[4]) p.push(w[4]); keep.push(p); }
  }
  WS.ext = WS.ext.filter((_, j) => !drop.has(j)).concat(keep);
  if (oldIdx != null) WS.door.splice(oldIdx, 1);
  const sp = spans.slice().sort((a, b) => a[0] - b[0]);
  let cur = A;
  for (const [a, b] of sp) {
    if (a > cur + 0.05) { const p = mk(cur, a); if (hWall) p.push(hWall); WS.ext.push(p); }
    const dr = mk(a, b).concat([tmpl[4] ?? 8, tmpl[5] ?? null, 1, { ...doorOpts(tmpl), garage: true }]);
    delete dr[7].noLeaf;
    WS.door.push(dr); cur = b;
  }
  if (B > cur + 0.05) { const p = mk(cur, B); if (hWall) p.push(hWall); WS.ext.push(p); }
  return { ok: true };
}
const GD_SIZES = { single: 9, double: 16 };
const GD_TWO = { each: 9, gap: 1.5 };
function fmtFtIn(w) {
  const n = Math.max(0, +w || 0), tot = Math.round(n * 12), ft = Math.floor(tot / 12), inch = tot % 12;
  return ft + '′' + (inch ? '-' + inch + '″' : '');
}
// clear run along the garage wall that this door can expand into (stops at other openings / wall end)
function garageClearSpan(i) {
  const d = M.walls.door[i]; if (!d) return null;
  const info = doorInfo(d);
  const horiz = info.horiz, perp = wallPerp(d, horiz), tol = 0.35;
  const aOf = (w) => horiz ? w[0] : w[1], bOf = (w) => horiz ? w[2] : w[3];
  const onLine = (w) => {
    const h2 = (w[2] - w[0]) >= (w[3] - w[1]);
    return h2 === horiz && Math.abs(wallPerp(w, horiz) - perp) < tol;
  };
  const segs = [];
  for (const w of (M.walls.ext || [])) if (onLine(w)) segs.push({ a: aOf(w), b: bOf(w), kind: 'wall' });
  (M.walls.door || []).forEach((w, j) => { if (onLine(w)) segs.push({ a: aOf(w), b: bOf(w), kind: 'door', j }); });
  (M.walls.win || []).forEach((w) => { if (onLine(w)) segs.push({ a: aOf(w), b: bOf(w), kind: 'win' }); });
  const me = segs.find((s) => s.kind === 'door' && s.j === i);
  if (!me) return null;
  let lo = me.a, hi = me.b, changed = true;
  while (changed) {
    changed = false;
    for (const s of segs) {
      if (s.kind !== 'wall') continue;
      if (s.b > lo - 0.16 && s.a < lo + 0.16 && s.a < lo - 0.01) { lo = s.a; changed = true; }
      if (s.a < hi + 0.16 && s.b > hi - 0.16 && s.b > hi + 0.01) { hi = s.b; changed = true; }
    }
  }
  for (const s of segs) {
    if (s.kind === 'wall' || (s.kind === 'door' && s.j === i)) continue;
    if (s.b <= me.a + 0.05) lo = Math.max(lo, s.b);
    if (s.a >= me.b - 0.05) hi = Math.min(hi, s.a);
  }
  return { lo, hi, horiz, perp, info, a0: me.a, b0: me.b };
}
function garageSizeOp(i, size) {
  const d = M.walls.door[i]; if (!d) return { ok: false, why: 'no door' };
  const info = doorInfo(d); if (!info.garage) return { ok: false, why: 'not a garage door' };
  const range = garageClearSpan(i);
  if (!range) return { ok: false, why: 'not enough garage wall there' };
  const { lo, hi, horiz, perp, a0, b0 } = range;
  const avail = hi - lo;
  const twoW = GD_TWO.each * 2 + GD_TWO.gap;
  const want = size === 'two' ? twoW : GD_SIZES[size];
  if (!want) return { ok: false, why: 'unknown size' };
  let W = want, clamped = false, placed = size;
  if (W > avail + 0.02) { W = Math.floor(avail * 4) / 4; clamped = true; }
  if (W < 7.5) return { ok: false, why: 'not enough garage wall there (only ' + fmtFtIn(avail) + ' clear next to neighboring openings)' };
  const c0 = (a0 + b0) / 2;
  let c = Math.min(Math.max(c0, lo + W / 2), hi - W / 2);
  let spans;
  if (size === 'two' && W >= twoW - 0.05) {
    const half = twoW / 2;
    spans = [[c - half, c - GD_TWO.gap / 2], [c + GD_TWO.gap / 2, c + half]];
    placed = 'two';
  } else if (size === 'two') {
    spans = [[c - W / 2, c + W / 2]];
    placed = W > 12 ? 'double' : 'single';
    clamped = true;
  } else {
    spans = [[c - W / 2, c + W / 2]];
    placed = W > 12 ? 'double' : 'single';
  }
  const A = Math.min(a0, spans[0][0]), B = Math.max(b0, spans[spans.length - 1][1]);
  const snap = cloneWalls(M.walls);
  const tmpl = d.slice(); tmpl[4] = 8;
  const res = setOpeningSpans(tmpl, horiz, perp, A, B, spans, i);
  if (!res.ok) { M.walls = snap; return res; }
  rebuildPlan();
  const idxs = [];
  for (const [sa, sb] of spans) {
    const sc = (sa + sb) / 2;
    const j = (M.walls.door || []).findIndex((dr, di) => {
      if (idxs.includes(di)) return false;
      const inf = doorInfo(dr);
      if (!inf.garage) return false;
      const mid = inf.horiz ? inf.cx : inf.cy;
      const pr = inf.horiz ? inf.cy : inf.cx;
      return Math.abs(mid - sc) < 0.25 && Math.abs(pr - perp) < 0.45;
    });
    if (j >= 0) idxs.push(j);
  }
  let why;
  if (clamped) {
    why = size === 'two' && placed !== 'two'
      ? 'Two 9′ doors need ' + fmtFtIn(twoW) + ' of clear wall; fitted a ' + fmtFtIn(W) + ' door instead.'
      : 'A ' + (size === 'double' ? '16′' : size === 'single' ? '9′' : fmtFtIn(twoW)) + ' door needs more clear wall; fitted ' + fmtFtIn(W) + ' (the most that fits next to neighboring openings).';
  }
  return { ok: true, index: idxs[0] ?? i, indexes: idxs, width: W, clamped, shifted: Math.abs(c - c0) > 0.15, why, size: placed };
}
function garageWallInfo(kind, index) {
  const w = (M.walls[kind] || [])[index]; if (!w || kind !== 'ext') return null;
  const horiz = (w[2] - w[0]) >= (w[3] - w[1]), len = horiz ? w[2] - w[0] : w[3] - w[1];
  const mx = (w[0] + w[2]) / 2, my = (w[1] + w[3]) / 2, t = horiz ? w[3] - w[1] : w[2] - w[0], dd = t / 2 + 1.2;
  const gA = horiz ? roomAtPt(mx, my - dd, isGarageRoom) : roomAtPt(mx - dd, my, isGarageRoom);
  const gB = horiz ? roomAtPt(mx, my + dd, isGarageRoom) : roomAtPt(mx + dd, my, isGarageRoom);
  if (!gA === !gB) return null;
  return { horiz, len, mid: horiz ? mx : my, perp: horiz ? my : mx, w };
}
function addGarageDoorOp(kind, index, size = 'single') {
  const g = garageWallInfo(kind, index); if (!g) return { ok: false, why: 'pick an exterior garage wall' };
  const W = GD_SIZES[size] || 9; if (g.len < W + 0.6) return { ok: false, why: 'wall is shorter than the door' };
  const span = [g.mid - W / 2, g.mid + W / 2];
  const snap = cloneWalls(M.walls);
  const res = setOpeningSpans([0, 0, 0, 0, 8, g.w[4] || null, 1, { garage: true }], g.horiz, g.perp, span[0], span[1], [span], null);
  if (!res.ok) { M.walls = snap; return res; }
  rebuildPlan(); return res;
}
function doorList() {
  return (M?.walls?.door || []).map((d, i) => {
    const info = doorInfo(d);
    const near = roomAtPt(info.cx + (info.horiz ? 0 : 1.2), info.cy + (info.horiz ? 1.2 : 0)) || roomAtPt(info.cx - (info.horiz ? 0 : 1.2), info.cy - (info.horiz ? 1.2 : 0));
    const hinged = !info.garage && info.width >= 1.6 && info.top >= 6 && info.width <= (info.ext ? 7.2 : 6.2);
    return { index: i, kind: info.kind, width: info.width, height: info.top, removed: info.noLeaf, color: info.color || null, room: near ? near[0] : '', hasLeaf: info.garage || hinged };
  });
}
// ---------- colours & finishes (live: re-tints materials / vertex colours; no model rebuild) ----------
let finishes = {}; let deletedRooms = []; let baseIntColor = null;
const HW_FINISHES = {
  'matte-black': { label: 'Matte Black', color: '#1c1c1c', metalness: 0.35, roughness: 0.6 },
  'brushed-nickel': { label: 'Brushed Nickel', color: '#b8b7b0', metalness: 0.9, roughness: 0.36 },
  'polished-chrome': { label: 'Polished Chrome', color: '#eef0f2', metalness: 1, roughness: 0.07 },
  'satin-brass': { label: 'Satin Brass / Gold', color: '#c9a45c', metalness: 0.9, roughness: 0.3 },
  'oil-rubbed-bronze': { label: 'Oil-Rubbed Bronze', color: '#3d2b20', metalness: 0.65, roughness: 0.45 },
};
const hwMatCache = {};
function hwMat(key) { const f = HW_FINISHES[key]; if (!f) return null; return hwMatCache[key] ||= new THREE.MeshStandardMaterial({ color: f.color, metalness: f.metalness, roughness: f.roughness }); }
const leafCache = {};
function leafMats(color, ext) {
  const k = color + (ext ? 'e' : 'i');
  if (leafCache[k]) return leafCache[k];
  const wood = /^wood:/.test(color), c = new THREE.Color(wood ? color.slice(5) : color);
  const tex = wood ? MAT.wood?.map : null;
  const leaf = new THREE.MeshStandardMaterial({ color: c, roughness: wood ? 0.6 : (ext ? 0.42 : 0.55), metalness: ext && !wood ? 0.15 : 0, map: tex || null });
  const panel = leaf.clone(); panel.color = c.clone().multiplyScalar(0.93);
  return leafCache[k] = { leaf, panel };
}
function doorColorFor(r, ext) { const o = doorOpts(r); return o.color || (ext ? finishes.doorExt : finishes.doorInt) || null; }
function rebuildDoorsOnly() {
  if (!doorsGroup || !M) return;
  const open = doors.map(d => d.open), gopen = gdoors.map(g => g.open);
  if (doorsGroup.parent) doorsGroup.parent.remove(doorsGroup);
  buildDoors(M.walls);
  doors.forEach((d, i) => { if (open[i] != null) d.open = open[i]; });
  gdoors.forEach((g, i) => { if (gopen[i] != null) { g.open = gopen[i]; poseGarage(g); } });
  applyHardwareDoors();
  if (typeof setCut === 'function') doorsGroup.visible = !cutOn;
}
function roomColorAt(x, y) {
  const r = roomAtPt(x, y, rr => !(rr[7]?.outside));
  const rc = r && finishes.rooms ? finishes.rooms[r[0] || ''] : null;
  return rc || finishes.wall || null;
}
function applyWallPaint() {
  const any = finishes.wall || (finishes.rooms && Object.keys(finishes.rooms).length);
  const tmp = new THREE.Color();
  for (const grp of [wallsFull, wallsCut, roof]) {
    if (!grp) continue;
    grp.traverse(o => {
      if (!o.isMesh || !(o.userData.intWalls || o.userData.extWalls)) return;
      if (o.userData.extWalls && !mats0().extSkin) return; // single-material exterior walls: leave siding as is
      if (!any) { if (o.userData.paintOrig) { o.material = o.userData.paintOrig; delete o.userData.paintOrig; } return; }
      if (o.userData.extWalls) return;
      if (!o.userData.paintOrig) { o.userData.paintOrig = o.material; const pm = o.material.clone(); pm.vertexColors = true; pm.color = new THREE.Color('#ffffff'); o.material = pm; }
      const g = o.geometry, pos = g.attributes.position, nor = g.attributes.normal;
      let col = g.attributes.color;
      if (!col || col.count !== pos.count) { col = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3); g.setAttribute('color', col); }
      const v = new THREE.Vector3(), n = new THREE.Vector3();
      const idx = g.index ? g.index.array : null, triN = idx ? idx.length / 3 : pos.count / 3;
      for (let t = 0; t < triN; t++) {
        const ia = idx ? idx[t * 3] : t * 3, ib = idx ? idx[t * 3 + 1] : t * 3 + 1, ic = idx ? idx[t * 3 + 2] : t * 3 + 2;
        v.set(0, 0, 0); for (const q of [ia, ib, ic]) v.add(new THREE.Vector3().fromBufferAttribute(pos, q)); v.multiplyScalar(1 / 3);
        n.fromBufferAttribute(nor, ia);
        // mesh-local == root space: x = Wx(planX), z = Wz(planY)
        const px = v.x + n.x * 0.45 + CX, py = v.z + n.z * 0.45 + CZ;
        const c = Math.abs(n.y) > 0.5 ? null : roomColorAt(px, py);
        tmp.copy(c ? new THREE.Color(c) : baseIntColor || new THREE.Color('#f8f6f1'));
        for (const q of [ia, ib, ic]) col.setXYZ(q, tmp.r, tmp.g, tmp.b);
      }
      col.needsUpdate = true;
    });
  }
}
function mats0() { return M?.materials || {}; }
function applyHardwareDoors() {
  const f = HW_FINISHES[finishes.hardware];
  const base = { brass: ['#c4a35a', 0.7, 0.3], black: ['#121212', 0.55, 0.35] };
  for (const k of ['brass', 'black']) {
    const m = DOOR_MAT[k];
    if (f) { m.color.set(f.color); m.metalness = f.metalness; m.roughness = f.roughness; }
    else { m.color.set(base[k][0]); m.metalness = base[k][1]; m.roughness = base[k][2]; }
  }
}
const HW_TYPES = /fridge|refrig|oven|dishwash|wine|sink|faucet|vanity|kitchen|island|counter|cabinet|pantry|pendant|chandelier|lamp|sconce|light|shower|tub|bath|toilet|dresser|nightstand|sideboard|buffet|desk|bar|hutch|wardrobe|credenza|range|hood/i;
function itemHwFinish(rec) { return rec.hw || finishes.hardware || null; }
function applyItemHardware(rec, mesh) {
  const key = itemHwFinish(rec); if (!key) return;
  if (!HW_TYPES.test(rec.type || '') && !rec.hw) return;
  const mt = hwMat(key); if (!mt) return;
  mesh.traverse(o => {
    if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
    const m = o.material;
    if (m.transparent || m.emissiveIntensity > 0.2 && m.emissive && m.emissive.getHex() !== 0) return;
    if ((m.metalness ?? 0) >= 0.45 && (o.geometry?.boundingSphere ? true : true)) {
      o.geometry.computeBoundingBox?.();
      const bb = o.geometry.boundingBox; if (bb) { const sz = new THREE.Vector3(); bb.getSize(sz); if (Math.max(sz.x, sz.y, sz.z) > 4.5) return; } // big stainless appliance faces stay as-is
      o.material = mt;
    }
  });
}
function finishHex(c) { return typeof c === 'string' ? c.replace(/^wood:/i, '') : c; }
function isWoodFinish(c) { return typeof c === 'string' && /^wood:/i.test(c); }
let archFinishMeshes = [];
const tintMatCache = {};
function tintedMat(base, hex, mapOverride) {
  const key = (base.uuid || 'm') + '|' + hex + '|' + (mapOverride ? 'x' : '');
  if (tintMatCache[key]) return tintMatCache[key];
  const m = base.clone();
  m.color = new THREE.Color(hex);
  if (mapOverride) { m.map = mapOverride; m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping; }
  return tintMatCache[key] = m;
}
function tileTintFor(room) {
  const typ = room[2], tiles = finishes.tiles || {};
  if (typ !== 'tile' && typ !== 'stone') return null;
  const n = (room[0] || '').toLowerCase();
  if (/bath|shower|powder|\bwc\b|toilet|spa/.test(n)) return tiles.bathFloor || null;
  if (/kitchen|pantry/.test(n)) return tiles.floor || null;
  return tiles.floor || null;
}
function classifyArch(a, b, c, d, h0, h1, color, o = {}) {
  if (o.roof || o.chimney || o.role === 'structure' || o.role === 'trim') return null;
  const col = String(color || '');
  if (['glass', 'water', 'lightOak', 'limewash', 'palePlaster', 'slate', 'lightStone', 'wood', 'concrete', 'grass'].includes(col)) return null;
  const w = Math.abs(c - a), dep = Math.abs(d - b), h = (h1 || 0) - (h0 || 0);
  if (w < 0.08 && dep < 0.08) return null; // placeholder custom() blocks
  const room = roomAtPt((a + c) / 2, (b + d) / 2, rr => !(rr[7]?.outside));
  if (!room) return null;
  const name = (room[0] || '').toLowerCase();
  const thin = Math.min(w, dep) <= 0.45;
  const isKit = /kitchen|pantry/.test(name);
  const isBath = /bath|shower|powder|\bwc\b|toilet|spa/.test(name);
  if (isKit && (h0 || 0) >= 2.85 && (h1 || 0) <= 5.6 && thin && h >= 0.8) return 'backsplash';
  if (isKit && Math.min(w, dep) >= 0.7 && Math.min(w, dep) <= 2.2 && Math.max(w, dep) >= 1.2) {
    if ((h0 || 0) >= 3.8 && (h1 || 0) <= 9.8 && h >= 0.35) return 'cabinet';
    if ((h0 || 0) <= 0.35 && (h1 || 0) >= 2.5 && (h1 || 0) <= 9 && h >= 2) return 'cabinet';
  }
  if (isBath && thin && (h0 || 0) <= 0.5 && (h1 || 0) >= 5 && h >= 4 && !/glass|#cfe6|#e8f0/i.test(col)) return 'shower';
  return null;
}
function recWithFinishes(rec) {
  const out = { ...rec };
  if (/^(counter|island|cabinet)$/.test(rec.type)) {
    const col = rec.type === 'island' ? (finishes.island || finishes.cabinet) : finishes.cabinet;
    if (col) {
      const hex = finishHex(col);
      out.carcass = hex; out.door = hex; out.woodGrain = isWoodFinish(col);
    }
  }
  if (rec.type === 'shower') {
    if (finishes.tiles?.shower) out.tile = finishHex(finishes.tiles.shower);
    if (finishes.tiles?.bathFloor) out.floorTile = finishHex(finishes.tiles.bathFloor);
  }
  return out;
}
function applyWoodGrain(mesh) {
  if (!mesh) return;
  mesh.traverse(o => {
    if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
    const m = o.material;
    if ((m.metalness || 0) > 0.2 || (m.roughness || 1) < 0.6) return;
    if (m.transparent) return;
    const nm = m.clone();
    nm.map = TEX.wood;
    if (nm.map) { nm.map.wrapS = nm.map.wrapT = THREE.RepeatWrapping; }
    o.material = nm;
  });
}
function paintArchMesh(m, kind, color) {
  if (!m) return;
  if (!m.userData.finishOrig) m.userData.finishOrig = m.material;
  if (!color) { m.material = m.userData.finishOrig; return; }
  const hex = finishHex(color);
  if (kind === 'backsplash') m.material = tintedMat(MAT.subway || MAT.tile, hex, TEX.subway || TEX.tile);
  else if (kind === 'shower') m.material = tintedMat(MAT.tile, hex, TEX.tile);
  else {
    const base = m.userData.finishOrig.clone();
    base.color = new THREE.Color(hex);
    if (isWoodFinish(color)) { base.map = TEX.wood; if (base.map) { base.map.wrapS = base.map.wrapT = THREE.RepeatWrapping; } }
    else if (base.map && base.map === TEX.wood) base.map = null;
    m.material = base;
  }
}
function applyArchFinishes() {
  for (const m of archFinishMeshes) {
    const kind = m.userData.finishKind;
    if (kind === 'cabinet') paintArchMesh(m, kind, finishes.cabinet);
    else if (kind === 'backsplash') paintArchMesh(m, kind, finishes.tiles?.backsplash);
    else if (kind === 'shower') paintArchMesh(m, kind, finishes.tiles?.shower);
  }
}
function setFinishesOp(patch) {
  const next = { ...finishes, ...patch };
  if (patch.rooms) next.rooms = { ...(finishes.rooms || {}), ...patch.rooms };
  if (patch.tiles) next.tiles = { ...(finishes.tiles || {}), ...patch.tiles };
  for (const k of Object.keys(next)) if (next[k] == null || next[k] === '') delete next[k];
  if (next.rooms) { for (const k of Object.keys(next.rooms)) if (!next.rooms[k]) delete next.rooms[k]; if (!Object.keys(next.rooms).length) delete next.rooms; }
  if (next.tiles) { for (const k of Object.keys(next.tiles)) if (!next.tiles[k]) delete next.tiles[k]; if (!Object.keys(next.tiles).length) delete next.tiles; }
  const doorsChanged = next.doorInt !== finishes.doorInt || next.doorExt !== finishes.doorExt;
  const hwChanged = next.hardware !== finishes.hardware;
  const cabChanged = next.cabinet !== finishes.cabinet || next.island !== finishes.island;
  const tilesChanged = JSON.stringify(next.tiles || {}) !== JSON.stringify(finishes.tiles || {});
  finishes = next;
  applyWallPaint();
  if (doorsChanged) rebuildDoorsOnly();
  if (hwChanged) applyHardwareDoors();
  if (cabChanged || tilesChanged || hwChanged) refreshItems();
  if (tilesChanged) buildFloors();
  applyArchFinishes();
  captureLayout();
  return finishes;
}
function addRoomOp(x0, y0, w, d) {
  const room = ['Room', `${w.toFixed(0)}' x ${d.toFixed(0)}'`, 'wood', x0, y0, x0 + w, y0 + d, {}];
  M.rooms.push(room);
  const t = 0.4, a = x0, b = y0, c = x0 + w, e = y0 + d;
  const segs = [
    [a - t / 2, b - t / 2, c + t / 2, b + t / 2],
    [a - t / 2, e - t / 2, c + t / 2, e + t / 2],
    [a - t / 2, b - t / 2, a + t / 2, e + t / 2],
    [c - t / 2, b - t / 2, c + t / 2, e + t / 2],
  ];
  (M.walls.int ||= []).push(...segs);
  // doorway into an overlapping neighbor
  const others = M.rooms.slice(0, -1);
  for (const o of others) {
    if (o[7]?.outside) continue;
    // shared vertical edge
    const shareX = Math.abs(c - o[3]) < 0.6 || Math.abs(a - o[5]) < 0.6;
    const shareY = Math.abs(e - o[4]) < 0.6 || Math.abs(b - o[6]) < 0.6;
    const overlapY = Math.min(e, o[6]) - Math.max(b, o[4]);
    const overlapX = Math.min(c, o[5]) - Math.max(a, o[3]);
    if (shareX && overlapY > 3.5) {
      const ymid = (Math.max(b, o[4]) + Math.min(e, o[6])) / 2;
      const x = Math.abs(c - o[3]) < 0.6 ? c : a;
      M.walls.door.push([x - 0.2, ymid - 1.5, x + 0.2, ymid + 1.5, 7, null, 0]);
      break;
    } else if (shareY && overlapX > 3.5) {
      const xmid = (Math.max(a, o[3]) + Math.min(c, o[5])) / 2;
      const y = Math.abs(e - o[4]) < 0.6 ? e : b;
      M.walls.door.push([xmid - 1.5, y - 0.2, xmid + 1.5, y + 0.2, 7, null, 0]);
      break;
    }
  }
  rebuildPlan();
  return M.rooms.length - 1;
}

function addPorchPosts(kit, model) {
  if (!kit || typeof kit.block !== 'function') return;
  const rooms = model.rooms || [];
  const post = (x, y, h = 8.2) => kit.block(x - 0.28, y - 0.28, x + 0.28, y + 0.28, 0, h, '#d8c8a8', { solid: true });
  const shared = (room, side) => {
    for (const o of rooms) {
      if (o === room || (o[7] && o[7].outside)) continue;
      const ox0 = o[3], oy0 = o[4], ox1 = o[5], oy1 = o[6];
      if (side === 'n' && Math.abs(room[4] - oy1) < 0.7) {
        if (Math.min(room[5], ox1) - Math.max(room[3], ox0) > 1) return true;
      }
      if (side === 's' && Math.abs(room[6] - oy0) < 0.7) {
        if (Math.min(room[5], ox1) - Math.max(room[3], ox0) > 1) return true;
      }
      if (side === 'w' && Math.abs(room[3] - ox1) < 0.7) {
        if (Math.min(room[6], oy1) - Math.max(room[4], oy0) > 1) return true;
      }
      if (side === 'e' && Math.abs(room[5] - ox0) < 0.7) {
        if (Math.min(room[6], oy1) - Math.max(room[4], oy0) > 1) return true;
      }
    }
    return false;
  };
  for (const r of rooms) {
    if (!isCoveredPorch(r)) continue;
    if (r[7] && r[7].noPosts) continue; // model draws its own columns
    const x0 = r[3], y0 = r[4], x1 = r[5], y1 = r[6];
    const inset = 0.45;
    const pts = [];
    const addLine = (ax, ay, bx, by) => {
      const len = Math.hypot(bx - ax, by - ay);
      const n = Math.max(2, Math.round(len / 8.5) + 1);
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1);
        pts.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
      }
    };
    if (!shared(r, 'n')) addLine(x0 + inset, y0 + inset, x1 - inset, y0 + inset);
    if (!shared(r, 's')) addLine(x0 + inset, y1 - inset, x1 - inset, y1 - inset);
    if (!shared(r, 'w')) addLine(x0 + inset, y0 + inset, x0 + inset, y1 - inset);
    if (!shared(r, 'e')) addLine(x1 - inset, y0 + inset, x1 - inset, y1 - inset);
    // corners always if any free edge
    const seen = new Set();
    for (const [x, y] of pts) {
      const key = x.toFixed(2) + ',' + y.toFixed(2);
      if (seen.has(key)) continue;
      seen.add(key);
      post(x, y);
    }
  }
}

function addDoorwayOp(kind, index) {
  const w = (M.walls[kind] || [])[index];
  if (!w) return;
  const horiz = (w[2] - w[0]) >= (w[3] - w[1]);
  const mid = horiz ? (w[0] + w[2]) / 2 : (w[1] + w[3]) / 2;
  const half = 1.5;
  if (horiz) M.walls.door.push([mid - half, w[1], mid + half, w[3], 7, w[4] || null, kind === 'ext' ? 1 : 0]);
  else M.walls.door.push([w[0], mid - half, w[2], mid + half, 7, w[4] || null, kind === 'ext' ? 1 : 0]);
  rebuildPlan();
}
function removeWallOp(kind, index) {
  const w = (M.walls[kind] || [])[index];
  if (!w) return;
  M.walls[kind].splice(index, 1);
  const mx = (w[0] + w[2]) / 2, my = (w[1] + w[3]) / 2;
  for (const k of ['door', 'win']) {
    M.walls[k] = (M.walls[k] || []).filter(d => {
      const dx = (d[0] + d[2]) / 2, dy = (d[1] + d[3]) / 2;
      return Math.hypot(dx - mx, dy - my) > 1.2;
    });
  }
  rebuildPlan();
}
function patchWallOp(kind, index, patch) {
  const w = (M.walls[kind] || [])[index];
  if (!w) return;
  if (patch.dx || patch.dy) translateSeg(w, patch.dx || 0, patch.dy || 0);
  if (patch.length) {
    const horiz = (w[2] - w[0]) >= (w[3] - w[1]);
    const mid = horiz ? (w[0] + w[2]) / 2 : (w[1] + w[3]) / 2;
    const half = Math.max(1, +patch.length) / 2;
    if (horiz) { w[0] = mid - half; w[2] = mid + half; }
    else { w[1] = mid - half; w[3] = mid + half; }
  }
  rebuildPlan();
}
function addWallOp(x0, y0, x1, y1) {
  const t = 0.4;
  if (Math.abs(x1 - x0) >= Math.abs(y1 - y0)) {
    const y = (y0 + y1) / 2;
    M.walls.int.push([Math.min(x0, x1), y - t / 2, Math.max(x0, x1), y + t / 2]);
  } else {
    const x = (x0 + x1) / 2;
    M.walls.int.push([x - t / 2, Math.min(y0, y1), x + t / 2, Math.max(y0, y1)]);
  }
  rebuildPlan();
}
async function saveLayoutRemote(layout) {
  if (SRC.kind !== 'project') return;
  const r = await fetch('/api/projects/' + encodeURIComponent(SRC.id), {
    method: 'PATCH', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ layout: layout || null }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Could not save layout');
}

function hitRoof(ndc) {
  if (!roof || !roof.visible) return null;
  const rc = new THREE.Raycaster();
  rc.setFromCamera(ndc, camera);
  const hits = rc.intersectObjects(roof.children, true);
  const hit = hits.find((h) => {
    let o = h.object;
    while (o) {
      if (o.userData && o.userData.roofSurface) return true;
      o = o.parent;
    }
    return false;
  }) || hits[0];
  if (!hit) return null;
  let spec = null, obj = hit.object;
  while (obj) {
    if (obj.userData && obj.userData.roofSpec) { spec = obj.userData.roofSpec; break; }
    obj = obj.parent;
  }
  const n = hit.face && hit.object ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
  const pitch = Math.max(0, Math.min(70, (Math.acos(Math.min(1, Math.max(-1, n.y))) * 180) / Math.PI));
  const along = Math.abs(n.x) > Math.abs(n.z) ? 'y' : 'x';
  return { point: hit.point.clone(), normal: n, pitch, along, spec };
}

function captureThumb({ width = 1000, height = 625 } = {}) {
  if (!renderer) return Promise.reject(new Error('No renderer'));
  const prevW = canvas.width, prevH = canvas.height;
  // Capture the current view into a cropped JPEG.
  renderer.render(scene, camera);
  const src = renderer.domElement;
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  const sw = src.width, sh = src.height;
  const scale = Math.max(width / sw, height / sh);
  const dw = sw * scale, dh = sh * scale;
  ctx.drawImage(src, (width - dw) / 2, (height - dh) / 2, dw, dh);
  return new Promise((resolve, reject) => {
    out.toBlob((b) => b ? resolve(b) : reject(new Error('Could not capture thumbnail')), 'image/jpeg', 0.86);
  });
}

function ensureEditor() {
  mountPlanEditor({
    canvas,
    camera,
    src: SRC,
    canEdit: SRC.kind !== 'share',
    get exampleId() { return currentId; },
    set exampleId(_) {},
    getItems: () => currentItems,
    setItems: setItemsList,
    getRooms: () => M?.rooms || [],
    getWalls: () => M?.walls || { ext: [], int: [], win: [], door: [], counter: [] },
    applyLayout: (layout) => {
      activeLayout = sanitizeLayout(layout) || layout;
      if (planOriginal) buildModel(planOriginal.source, { layout: activeLayout });
    },
    resetLayout: () => {
      activeLayout = null;
      currentItems = cloneItems(defaultItems);
      if (planOriginal) buildModel(planOriginal.source, { layout: { items: currentItems } });
    },
    highlight: highlightSel,
    setEditMode: (on) => {
      editMode = !!on;
      // Keep the user's cutaway setting. Wall picks work at full height;
      // doors stay visible in edit mode so openings remain selectable.
      if (doorsGroup) doorsGroup.visible = !cutOn || editMode;
    },
    pickDoor,
    pickWall,
    itemsGroup: () => itemsGroup,
    CX: () => CX, CZ: () => CZ,
    saveRemote: saveLayoutRemote,
    addRoom: addRoomOp,
    removeRoom: removeRoomOp,
    patchRoom: patchRoomOp,
    addWall: addWallOp,
    removeWall: removeWallOp,
    patchWall: patchWallOp,
    addDoorway: addDoorwayOp,
    removeRoomByName,
    doorList, removeDoor: removeDoorOp, restoreDoor: restoreDoorOp, setDoorColor: setDoorColorOp,
    garageSize: garageSizeOp, addGarageDoor: addGarageDoorOp, garageWallInfo: (k, i) => !!garageWallInfo(k, i),
    getFinishes: () => finishes, setFinishes: setFinishesOp, hwFinishes: HW_FINISHES,
    getDeleted: () => deletedRooms,
    highlightDoor: (i) => highlightSel(i == null ? null : { kind: 'wall', wallKind: 'door', index: i }),
    setWindowsMode, getWindowsMode: () => winsMode,
    setOrbitEnabled: (on) => { if (orbit) orbit.enabled = !!on; },
    rebuildPlan,
    getAreas: () => M ? modelAreas(M) : { heated: 0, garage: 0, porch: 0 },
    getBuildType: () => M?.buildType || 'home',
    getRoofs: () => M?.roofs || [],
    roofGroup: () => roof,
    highlightGroup: () => highlightGroup,
    renderer: () => renderer,
    scene: () => scene,
    captureThumb,
    hitRoof,
  });
}

function buildModel(model, opts = {}) {
  if (root) {
    root.traverse(o => { if (o.element?.parentNode) o.element.parentNode.removeChild(o.element); if (o.geometry && !o.geometry.userData?.shared) o.geometry.dispose(); });
    scene.remove(root);
  }
  const srcModel = opts.source || planOriginal?.source || model;
  if (!planOriginal || planOriginal.source !== srcModel && !opts.layout) {
    /* snapshot is set by the loader */
  }
  const layout = opts.layout || activeLayout;
  M = modelWithLayout(srcModel.rooms ? srcModel : model, layout);
  finishes = (layout && layout.finishes && typeof layout.finishes === 'object') ? JSON.parse(JSON.stringify(layout.finishes)) : {};
  deletedRooms = (layout && Array.isArray(layout.deleted)) ? JSON.parse(JSON.stringify(layout.deleted)) : [];
  if (deletedRooms.length && Array.isArray(M.ceilings)) M.ceilings = M.ceilings.filter(c => !deletedRooms.some(d => { const cx = (c[0] + c[2]) / 2, cy = (c[1] + c[3]) / 2; return cx > d.rect[0] && cx < d.rect[2] && cy > d.rect[1] && cy < d.rect[3] && !roomAtPt(cx, cy); }));
  loadedModel = M;
  root = new THREE.Group(); scene.add(root);
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
  styleBg = bg; styleFog = { color: bg, near: st.fogNear || 260, far: st.fogFar || 560 };
  if (scene.fog) { scene.fog.color.set(bg); scene.fog.near = styleFog.near; scene.fog.far = styleFog.far; }
  else scene.fog = new THREE.Fog(bg, styleFog.near, styleFog.far);
  // bounds from rooms
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const r of M.rooms) { x0 = Math.min(x0, r[3]); y0 = Math.min(y0, r[4]); x1 = Math.max(x1, r[5]); y1 = Math.max(y1, r[6]); }
  CX = (x0 + x1) / 2; CZ = (y0 + y1) / 2; BW = x1 - x0; BH = y1 - y0;
  const R = Math.max(BW, BH) * 0.8 + 10;
  sun.position.set(R * .7, 110, R * .9); sun.target.position.set(0, 0, 0);
  Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 10, far: 400 }); sun.shadow.camera.updateProjectionMatrix();

  const extMat = mats.extTex ? MAT[mats.extTex] : new THREE.MeshStandardMaterial({ color: mats.ext || '#ece5d8', roughness: .9 });
  const intMat = (st.intWalls && MAT[st.intWalls]) ? MAT[st.intWalls] : new THREE.MeshStandardMaterial({ color: mats.int || '#f8f6f1', roughness: .95 });

  // slabs + floors (built by buildFloors() once the items are known: stairs going down cut a floor opening)
  floorCtx = { st };

  // footprint for exterior-skin side detection
  const inside = (x, y) => M.rooms.some(r => !(r[7]?.outside) && x > r[3] && x < r[5] && y > r[4] && y < r[6]);
  const WS = M.walls;
  sanitizeWalls(WS);
  clipCounters(WS, M.rooms);

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
    const extTrim = trimCornerOverlaps((WS.ext || []).map((r) => r.slice()));
    const intTrim = trimCornerOverlaps((WS.int || []).map((r) => r.slice()));
    for (const r of extTrim) skinSplit(r, 0, top(r[4] || H), out);
    for (const r of intTrim) out.int.push(boxRect(r[0], r[1], r[2], r[3], 0, top(r[4] || H)));
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
    for (const [g, m, cs, tag] of [[out.ext, extMat, true, 'extWalls'], [out.int, intMat, true, 'intWalls'], [out.glass, MAT.glass, false, 'winGlass']]) { const ms = mesh(g, m, cs); if (ms) { ms.userData[tag] = true; grp.add(ms); } }
    return grp;
  }
  wallsFull = buildWalls(false); wallsCut = buildWalls(true);
  root.add(wallsFull, wallsCut);
  buildWallPicks(WS, H);
  // baseboards: a 4" painted base on every interior wall face (both sides) and the inside face of exterior walls
  {
    const bb = [], bh = 0.33, bt = 0.04;
    const face = (r, sideA, sideB) => {
      const horiz = (r[2] - r[0]) >= (r[3] - r[1]);
      if (horiz) {
        if (sideA) bb.push(boxRect(r[0], r[1] - bt, r[2], r[1], 0, bh));
        if (sideB) bb.push(boxRect(r[0], r[3], r[2], r[3] + bt, 0, bh));
      } else {
        if (sideA) bb.push(boxRect(r[0] - bt, r[1], r[0], r[3], 0, bh));
        if (sideB) bb.push(boxRect(r[2], r[1], r[2] + bt, r[3], 0, bh));
      }
    };
    const sides = (r) => {
      const horiz = (r[2] - r[0]) >= (r[3] - r[1]), t = horiz ? r[3] - r[1] : r[2] - r[0], d = t / 2 + 0.5;
      const mx = (r[0] + r[2]) / 2, my = (r[1] + r[3]) / 2;
      return [horiz ? inside(mx, r[1] - d) : inside(r[0] - d, my), horiz ? inside(mx, r[3] + d) : inside(r[2] + d, my)];
    };
    for (const r of WS.int) { if (Math.max(r[2] - r[0], r[3] - r[1]) > 0.8 && (r[4] || H) > 2) { const [a, b] = sides(r); face(r, a, b); } }
    for (const r of WS.ext) { if (Math.max(r[2] - r[0], r[3] - r[1]) > 0.8) { const [a, b] = sides(r); face(r, a, b); } }
    for (const r of WS.win) { if ((r[4] ?? 3) > 0.6) { const [a, b] = sides(r); face(r, a, b); } }
    const bm = mesh(bb, new THREE.MeshStandardMaterial({ color: '#f4f2ec', roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }), false);
    if (bm) { bm.userData.baseboard = true; wallsFull.add(bm); }
  }
  baseIntColor = intMat.color ? intMat.color.clone() : new THREE.Color('#f8f6f1');
  buildDoors(WS);
  buildWindows(WS);
  applyWallPaint();
  applyHardwareDoors();
  // Counters are clipped and rendered as detailed items (not hallway/doorway slabs).
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
  const offsetMats = {};
  const withOffset = (mat) => {
    if (!mat) return mat;
    if (mat.userData && mat.userData.po) return mat;
    return offsetMats[mat.uuid] ||= (() => {
      const m = mat.clone();
      m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -2;
      m.userData = { ...(m.userData || {}), po: true };
      return m;
    })();
  };
  const kit = {
    THREE, W: Wx, Z: Wz,
    block(a, b, c, d, h0, h1, color, o = {}) {
      const thin = !!(o && o.overlay) || Math.min(Math.abs(c - a), Math.abs(d - b)) <= 0.22;
      const mat = thin ? withOffset(getMat(color, o)) : getMat(color, o);
      const m = new THREE.Mesh(boxRect(a, b, c, d, h0, h1, MAT[color] ? TEXSCALE[color] : 0), mat);
      m.castShadow = m.receiveShadow = true; furn.add(m);
      if (o.solid) solids.push([Wx(a), Wz(b), Wx(c), Wz(d)]);
      if (o.roof) m.userData.roofPart = true; // shown/hidden with the Roof toggle (gable timbers, chimneys, vault beams)
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
      // Default garage vehicles are not auto-rendered. Users place cars in Edit Plan → Items → Garage.
      return;
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
  itemsGroup = new THREE.Group(); itemsGroup.name = 'items'; root.add(itemsGroup);
  archFinishMeshes = [];
  highlightGroup = new THREE.Group(); highlightGroup.name = 'highlight'; highlightGroup.renderOrder = 2; root.add(highlightGroup);
  const detected = {};
  installFurniture(kit, { rooms: M.rooms, WS, detected, Wx, Wz, itemsGroup, ceiling: H });
  chimneyMeshes = [];
  const _kitBlock = kit.block ? kit.block.bind(kit) : null;
  if (_kitBlock) {
    kit.block = (a, b, c, d, z0, z1, color, opts) => {
      const w = Math.abs(c - a), dep = Math.abs(d - b), h = (z1 || 0) - (z0 || 0);
      const cx = (a + c) / 2, cy = (b + d) / 2;
      if (!(opts && opts.keep) && h >= 6 && w <= 1.25 && dep <= 1.25 && (M.rooms || []).some((r) => isCoveredPorch(r) && !(r[7] && r[7].noPosts) && cx >= r[3] && cx <= r[5] && cy >= r[4] && cy <= r[6])) {
        return;
      }
      if (inDeleted(cx, cy)) return new THREE.Group();
      const m = _kitBlock(a, b, c, d, z0, z1, color, opts);
      if (m && opts && Array.isArray(opts.chimney)) { m.userData.chimneyAt = opts.chimney; chimneyMeshes.push(m); }
      if (m) {
        const kind = classifyArch(a, b, c, d, z0, z1, color, opts || {});
        if (kind) { m.userData.finishKind = kind; archFinishMeshes.push(m); }
      }
      return m;
    };
  }
  if (deletedRooms.length) for (const fn of ['plane', 'bed', 'car', 'firewood', 'water', 'fire', 'zDoor']) {
    if (typeof kit[fn] !== 'function') continue;
    const orig = kit[fn].bind(kit);
    kit[fn] = (...a) => { const nums = a.filter(v => typeof v === 'number'); if (nums.length >= 2) { const cx = nums.length >= 4 ? (nums[0] + nums[2]) / 2 : nums[0], cy = nums.length >= 4 ? (nums[1] + nums[3]) / 2 : nums[1]; if (inDeleted(cx, cy)) return new THREE.Group(); } return orig(...a); };
  }
  kit.openingsOnX = (x, tol = 0.85) => openingsOnAxis('x', x, tol);
  kit.openingsOnY = (y, tol = 0.85) => openingsOnAxis('y', y, tol);
  kit.garageDoorsOnX = (x, tol = 0.85) => garageDoorsOnAxis('x', x, tol);
  kit.garageDoorsOnY = (y, tol = 0.85) => garageDoorsOnAxis('y', y, tol);
  function openingsOnAxis(axis, pos, tol) {
    const holes = [];
    const add = (r, isDoor) => {
      const horiz = (r[2] - r[0]) >= (r[3] - r[1]);
      if (axis === 'x' && horiz) return;
      if (axis === 'y' && !horiz) return;
      const perp = horiz ? (r[1] + r[3]) / 2 : (r[0] + r[2]) / 2;
      if (Math.abs(perp - pos) > tol) return;
      const s = horiz ? r[0] : r[1], e = horiz ? r[2] : r[3];
      const z0 = isDoor ? -1 : (r[4] ?? 3);
      const z1 = isDoor ? (r[4] ?? 8) : (r[5] ?? 7);
      holes.push([s, e, z0, z1]);
    };
    for (const r of (WS.win || [])) add(r, false);
    for (const r of (WS.door || [])) add(r, true);
    return holes.sort((a, b) => a[0] - b[0]);
  }
  function garageDoorsOnAxis(axis, pos, tol) {
    const out = [];
    for (const r of (WS.door || [])) {
      const inf = doorInfo(r);
      if (!inf.garage || inf.noLeaf) continue;
      const perp = inf.horiz ? inf.cy : inf.cx;
      if (axis === 'x' && inf.horiz) continue;
      if (axis === 'y' && !inf.horiz) continue;
      if (Math.abs(perp - pos) > tol) continue;
      out.push({ cx: inf.cx, cy: inf.cy, width: inf.width, top: inf.top, horiz: inf.horiz });
    }
    return out;
  }
  if (typeof M.furnish === 'function') M.furnish(kit);
  else if (Array.isArray(M.furnish)) { // JSON models: a list of [method, ...args] calls on the kit
    for (const op of M.furnish) {
      if (!Array.isArray(op) || !['block', 'plane', 'water', 'bed', 'car', 'firewood', 'zDoor', 'fire'].includes(op[0])) continue;
      const args = op.slice(1).map(v => (typeof v === 'number' || typeof v === 'string' || (v && typeof v === 'object' && !Array.isArray(v))) ? v : undefined);
      try { kit[op[0]](...args); } catch (e) { console.warn('skipped furnish op', op, e); }
    }
  }
  addPorchPosts(kit, M);
  if (currentStyle === 'english-country') applyEnglishCountry(kit, st, H, WS);
  // Convert leftover wall-counter slabs into detailed items, then auto-furnish (or restore saved items).
  const fromCounters = [];
  for (const c of (WS.counter || [])) {
    const w = Math.abs(c[2] - c[0]), d = Math.abs(c[3] - c[1]);
    fromCounters.push(makeItem(w < 4 && d < 4 && Math.min(w, d) >= 1.8 ? 'island' : 'counter', {
      x: (c[0] + c[2]) / 2, y: (c[1] + c[3]) / 2, w: Math.max(w, d), d: Math.min(w, d), rot: w >= d ? 0 : 90,
    }));
  }
  WS.counter = [];
  let auto = autoFurnish(M, WS);
  if ((detected.counters || []).length || fromCounters.length) {
    auto = auto.filter(it => it.type !== 'island' && it.type !== 'counter' && it.type !== 'barstool');
  }
  defaultItems = [...auto, ...(detected.counters || []), ...fromCounters, ...(detected.placed || [])];
  if (Array.isArray(M.placedItems) && M.placedItems.length) {
    for (const raw of M.placedItems) {
      try { defaultItems.push(makeItem(raw.type, raw)); } catch (e) { console.warn('skipped placed item', raw, e); }
    }
  }
  defaultItems = morroize(defaultItems, M.rooms);
  if (layout?.items) {
    currentItems = cloneItems(layout.items);
    // v1 layouts were saved before built-in fireplaces became items: bring the model's fireplace back
    // unless the saved plan already has a fireplace at (about) that spot.
    if (!(+layout.version >= 2)) {
      for (const fp of defaultItems.filter(isFireplaceItem)) {
        if (!currentItems.some((it) => isFireplaceItem(it) && Math.hypot(it.x - fp.x, it.y - fp.y) < 4)) currentItems.push({ ...fp });
      }
    }
    if (!(+layout.version >= 3)) {
      currentItems = morroize(currentItems, M.rooms);
      // v<3: built-in model stairs became items — bring them back if the saved plan has none near
      for (const st of defaultItems.filter(it => ITEM_CATALOG[it.type]?.stair)) {
        if (!currentItems.some((it) => ITEM_CATALOG[it.type]?.stair && Math.hypot(it.x - st.x, it.y - st.y) < 5)) currentItems.push({ ...st });
      }
    }
  } else currentItems = cloneItems(defaultItems);
  activeLayout = { version: 3, items: cloneItems(currentItems), rooms: cloneRooms(M.rooms), walls: cloneWalls(M.walls), roofs: cloneRoofs(M.roofs), finishes: JSON.parse(JSON.stringify(finishes || {})), deleted: JSON.parse(JSON.stringify(deletedRooms || [])), planInfo: (activeLayout && activeLayout.planInfo) ? { ...activeLayout.planInfo } : undefined };
  buildFloors();
  refreshItems();
  applyArchFinishes();
  ensureEditor();
  syncAreaUi(M);

  // roofs
  roof = new THREE.Group(); roof.visible = roofOn; root.add(roof);
  for (const c of [...furn.children]) if (c.userData.roofPart) roof.add(c);
  const roofTex = TEX[mats.roofTex || 'shingle'];
  const roofTop = new THREE.MeshStandardMaterial({ map: roofTex, color: '#ffffff', roughness: mats.roofTex === 'metal' ? .45 : .85, metalness: mats.roofTex === 'metal' ? .35 : 0, side: THREE.FrontSide });
  const roofUnder = new THREE.MeshStandardMaterial({ color: mats.roofUnder || '#d9d4ca', roughness: .9, side: THREE.BackSide, ...(mats.roofUnderGlow ? { emissive: mats.roofUnder || '#d9d4ca', emissiveIntensity: mats.roofUnderGlow } : {}) });
  const gableInside = new THREE.MeshStandardMaterial({ color: mats.int || '#f8f6f1', roughness: .95, side: THREE.BackSide });
  const gableMat = { int: intMat, ext: extMat, brick: MAT.brick, board: MAT.board, glass: MAT.glass, whiteBoard: MAT.whiteBoard };
  // model-authored roof skins (e.g. valley infill where a wing roof dies into a taller cross gable)
  for (const c of [...roof.children]) if (c.userData.roofSkin) { c.material = roofTop; const u = new THREE.Mesh(c.geometry, roofUnder); roof.add(u); }
  // Eaves/rakes that would push through a wall into a neighbouring heated room (a porch shed or a lower wing
  // butting a taller one) stop at the wall line, so no roof edge shows indoors.
  const IN_WALL = 0.12; // stop just inside the wall so the edge never shows on the far face
  const heatedAt = (x, y) => M.rooms.some(r => !(r[7]?.outside) && !isPorchLike(r) && x > r[3] && x < r[5] && y > r[4] && y < r[6]);
  const wallAlong = (horizLine, v, s0, s1) => [...WS.ext, ...WS.int, ...WS.win, ...WS.door].some(r => horizLine
    ? Math.abs((r[1] + r[3]) / 2 - v) < 0.5 && (r[3] - r[1]) < 1.5 && Math.min(r[2], s1) - Math.max(r[0], s0) > 0.5
    : Math.abs((r[0] + r[2]) / 2 - v) < 0.5 && (r[2] - r[0]) < 1.5 && Math.min(r[3], s1) - Math.max(r[1], s0) > 0.5);
  // edge: 'x0' | 'x1' | 'y0' | 'y1' of the roof rect; true when a heated room sits just past a wall on that edge
  const abutsRoom = (rf, edge) => {
    const vx = edge[0] === 'x', lo = edge[1] === '0', v = rf[edge], s0 = vx ? rf.y0 : rf.x0, s1 = vx ? rf.y1 : rf.x1;
    if (!(s1 - s0 > 0.5)) return false;
    const out = lo ? -0.8 : 0.8;
    let hits = 0, n = 5;
    for (let k = 0; k < n; k++) { const sv = s0 + (s1 - s0) * (k + 0.5) / n; if (vx ? heatedAt(v + out, sv) : heatedAt(sv, v + out)) hits++; }
    if (!hits) return false;
    // only where the neighbouring room is not already under this roof's footprint
    return wallAlong(!vx, v, s0, s1);
  };
  for (const rf of M.roofs || []) {
    if (rf.flat) { const m = new THREE.Mesh(boxRect(rf.x0, rf.y0, rf.x1, rf.y1, rf.h, rf.h + .8), new THREE.MeshStandardMaterial({ color: '#1d1e20', roughness: .7 })); m.castShadow = true; m.userData.flatRoof = true; roof.add(m); continue; }
    if (rf.shed) { // single-slope roof: high edge at y0 (or x0 when along:'y'), low edge at y1 (x1)
      const ax = rf.along !== 'y', o = rf.oh ?? 0.8, span = ax ? rf.y1 - rf.y0 : rf.x1 - rf.x0, k = (rf.lo - rf.hi) / span;
      const oA0 = abutsRoom(rf, ax ? 'x0' : 'y0') ? IN_WALL : o, oA1 = abutsRoom(rf, ax ? 'x1' : 'y1') ? IN_WALL : o, oS1 = abutsRoom(rf, ax ? 'y1' : 'x1') ? IN_WALL : o;
      const a0 = (ax ? rf.x0 : rf.y0) - oA0, a1 = (ax ? rf.x1 : rf.y1) + oA1, s0 = ax ? rf.y0 : rf.x0, s1 = (ax ? rf.y1 : rf.x1) + oS1, h1 = rf.lo + k * oS1;
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
      const top = new THREE.Mesh(g, roofTop); top.castShadow = true; top.receiveShadow = true; top.userData.roofSurface = true; top.userData.roofSpec = rf;
      { const um = new THREE.Mesh(g, roofUnder); um.userData.specU = rf; roof.add(top, um); }
      continue;
    }
    const aframe = !!rf.aframe;
    const along = rf.along === 'y', pitch = rf.pitch ?? (aframe ? 1.7 : .5), ohv = rf.oh ?? (aframe ? 0.55 : 1.5), eaveW = rf.eave ?? (aframe ? 1.35 : H);
    const oh = (Array.isArray(ohv) ? ohv : [ohv, ohv]).slice(), endOh = (rf.endOh ?? [Math.max(...oh), Math.max(...oh)]).slice();
    if (!aframe && !rf.keepOverhang) {
      // across = eave sides, along = rake ends
      if (rf.oh == null || !Array.isArray(rf.oh)) { if (abutsRoom(rf, along ? 'x0' : 'y0')) oh[0] = IN_WALL; if (abutsRoom(rf, along ? 'x1' : 'y1')) oh[1] = IN_WALL; }
      if (rf.endOh == null) { if (abutsRoom(rf, along ? 'y0' : 'x0')) endOh[0] = IN_WALL; if (abutsRoom(rf, along ? 'y1' : 'x1')) endOh[1] = IN_WALL; }
    }
    const a = along ? [rf.x0 - oh[0], rf.x1 + oh[1]] : [rf.y0 - oh[0], rf.y1 + oh[1]];
    const b = along ? [rf.y0 - endOh[0], rf.y1 + endOh[1]] : [rf.x0 - endOh[0], rf.x1 + endOh[1]];
    const wHalf = along ? (rf.x1 - rf.x0) / 2 : (rf.y1 - rf.y0) / 2, mid = along ? (rf.x0 + rf.x1) / 2 : (rf.y0 + rf.y1) / 2;
    let eaveA = eaveW - oh[0] * pitch, eaveB = eaveW - oh[1] * pitch, ridge = eaveW + wHalf * pitch;
    if (aframe) {
      const minE = rf.minEave ?? 0.28;
      eaveA = Math.max(minE, eaveA);
      eaveB = Math.max(minE, eaveB);
    }
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
    const top = new THREE.Mesh(g, roofTop); top.castShadow = true; top.receiveShadow = true; top.userData.roofSurface = true; top.userData.roofSpec = rf;
    const under = new THREE.Mesh(g, roofUnder); under.userData.specU = rf;
    roof.add(top, under);
    // gable end triangles (A-frame: full-height from the floor; otherwise sit on the wall eave)
    const wa = along ? [rf.x0, rf.x1] : [rf.y0, rf.y1], wb = along ? [rf.y0, rf.y1] : [rf.x0, rf.x1];
    const rw = eaveW + ((wa[1] - wa[0]) / 2) * pitch;
    const ends = rf.ends || [mats.gable || 'ext', mats.gable || 'ext'];
    const gableZ = aframe ? (rf.gableFloor ?? 0.05) : eaveW;
    const addGableMesh = (pts, em) => {
      const tg = new THREE.BufferGeometry();
      const flat = pts.flatMap(v => [v.x, v.y, v.z]);
      tg.setAttribute('position', new THREE.Float32BufferAttribute(flat, 3));
      tg.setAttribute('uv', new THREE.Float32BufferAttribute(pts.flatMap(v => [(along ? v.x : v.z) / 5, v.y / 5]), 2));
      tg.computeVertexNormals();
      const mat = (gableMat[em] || extMat).clone(); mat.side = em === 'glass' ? THREE.DoubleSide : THREE.FrontSide;
      const tm = new THREE.Mesh(tg, mat); tm.castShadow = em !== 'glass'; roof.add(tm);
      if (em !== 'glass') roof.add(new THREE.Mesh(tg, gableInside));
    };
    const orientOut = (p1, p2, p3, i) => {
      const n = new THREE.Vector3().subVectors(p2, p1).cross(new THREE.Vector3().subVectors(p3, p1));
      const outward = along ? (i === 0 ? -1 : 1) * n.z : (i === 0 ? -1 : 1) * n.x;
      return outward < 0 ? [p2, p1, p3] : [p1, p2, p3];
    };
    ends.forEach((em, i) => {
      if (!em) return;
      const e = wb[i];
      const midA = (wa[0] + wa[1]) / 2;
      const apex = P(midA, e, rw);
      const door = aframe && (rf.doorEnd === i || rf.doorEnd === (i === 0 ? 'start' : 'end') || (Array.isArray(rf.doorEnds) && rf.doorEnds.includes(i)));
      const dw = rf.doorWidth ?? 3.2, dh = rf.doorHeight ?? 7.2;
      const ds = midA - dw / 2, de = midA + dw / 2;
      const tris = [];
      if (door) {
        const L = P(wa[0], e, gableZ), R = P(wa[1], e, gableZ);
        const DL = P(ds, e, gableZ), DR = P(de, e, gableZ);
        const DLt = P(ds, e, dh), DRt = P(de, e, dh);
        tris.push([L, DL, DLt], [L, DLt, apex], [DLt, DRt, apex], [DRt, R, apex], [DRt, DR, R]);
        const fm = '#3a2a1c', leaf = '#5a3f2a';
        const t = 0.18;
        if (along) {
          roof.add(kit.block(ds - t, e - t, ds + t, e + t, gableZ, dh, fm));
          roof.add(kit.block(de - t, e - t, de + t, e + t, gableZ, dh, fm));
          roof.add(kit.block(ds - t, e - t, de + t, e + t, dh - t, dh + t, fm));
          roof.add(kit.block(ds + 0.05, e - 0.12, de - 0.9, e + 0.12, gableZ, dh - 0.08, leaf));
        } else {
          roof.add(kit.block(e - t, ds - t, e + t, ds + t, gableZ, dh, fm));
          roof.add(kit.block(e - t, de - t, e + t, de + t, gableZ, dh, fm));
          roof.add(kit.block(e - t, ds - t, e + t, de + t, dh - t, dh + t, fm));
          roof.add(kit.block(e - 0.12, ds + 0.05, e + 0.12, de - 0.9, gableZ, dh - 0.08, leaf));
        }
      } else {
        tris.push([P(wa[0], e, gableZ), P(wa[1], e, gableZ), apex]);
      }
      for (const [p1, p2, p3] of tris) addGableMesh(orientOut(p1, p2, p3, i), em);
      if (em === 'glass') {
        const fm = '#151618';
        const divs = aframe ? 6 : 4;
        for (let k2 = 1; k2 < divs; k2++) {
          const s = wa[0] + (wa[1] - wa[0]) * k2 / divs;
          if (door && s > ds - 0.15 && s < de + 0.15) continue;
          const hh = gableZ + (Math.min(s - wa[0], wa[1] - s)) * pitch;
          roof.add(kit.block(along ? s - .08 : e - .08, along ? e - .08 : s - .08, along ? s + .08 : e + .08, along ? e + .08 : s + .08, gableZ, hh, fm, { keep: true }));
        }
        if (aframe) {
          for (const frac of [0.28, 0.55]) {
            const z = gableZ + (rw - gableZ) * frac;
            const half = Math.max(0.4, (rw - z) / pitch);
            const s0 = midA - half, s1 = midA + half;
            roof.add(kit.block(along ? s0 : e - .07, along ? e - .07 : s0, along ? s1 : e + .07, along ? e + .07 : s1, z - 0.06, z + 0.06, fm));
          }
        }
      }
    });
    if (aframe && rf.rafters !== false) {
      const TIM = rf.timber || '#6b4a30';
      const y0 = along ? rf.y0 : rf.x0, y1 = along ? rf.y1 : rf.x1;
      const x0 = along ? rf.x0 : rf.y0, x1 = along ? rf.x1 : rf.y1;
      // ridge beam (axis-aligned along the peak)
      if (along) roof.add(kit.block(mid - 0.2, y0 - 0.15, mid + 0.2, y1 + 0.15, ridge - 0.45, ridge + 0.1, TIM));
      else roof.add(kit.block(y0 - 0.15, mid - 0.2, y1 + 0.15, mid + 0.2, ridge - 0.45, ridge + 0.1, TIM));
      // collar ties across the A at loft height — true horizontal timbers
      const tieZ = rf.tieZ ?? Math.min(ridge - 3, Math.max(8.5, eaveW + wHalf * pitch * 0.45));
      const inset = Math.max(1.2, (tieZ - eaveW) / pitch * 0.15);
      const half = Math.max(3, (ridge - tieZ) / pitch - 0.2);
      const step = rf.rafterStep || 6;
      for (let s = y0 + 2; s < y1 - 1; s += step) {
        if (along) roof.add(kit.block(mid - half, s - 0.12, mid + half, s + 0.12, tieZ - 0.16, tieZ + 0.16, TIM));
        else roof.add(kit.block(s - 0.12, mid - half, s + 0.12, mid + half, tieZ - 0.16, tieZ + 0.16, TIM));
      }
    }
  }
  // flat ceilings for 9' rooms (visible with the roof on; vaulted rooms show the roof underside)
  // Engine-level ceiling closure: every enclosed, non-vaulted room that the model left without a ceiling gets a
  // flat one at its wall top, so no roof framing / underside / sky shows from inside (A-frames are open to the roof by design).
  const ceilRects = (M.ceilings || []).slice();
  if (M.buildType !== 'aframe' && !M.noAutoCeilings) {
    const covered = (x, y) => ceilRects.some(c => x > c[0] - 0.05 && x < c[2] + 0.05 && y > c[1] - 0.05 && y < c[3] + 0.05);
    for (const r of M.rooms) {
      const [nm, , type, a, b, c, d, o = {}] = r;
      if (o.outside || o.vaulted || o.tray || o.noCeiling || o.noFloor || type === 'porch' || type === 'terrace' || /porch|patio|deck|terrace|carport|loft|stair|open to/i.test(nm || '')) continue;
      if ((c - a) * (d - b) < 4) continue;
      const pts = [[(a + c) / 2, (b + d) / 2], [a + 0.6, b + 0.6], [c - 0.6, b + 0.6], [a + 0.6, d - 0.6], [c - 0.6, d - 0.6]];
      if (pts.every(([x, y]) => covered(x, y))) continue;
      if (pts.some(([x, y]) => covered(x, y))) continue; // partially ceiled by the model: trust its design
      ceilRects.push([a, b, c, d, o.h || o.wallH || H, 'auto']);
    }
  }
  if (deletedRooms.length) for (let i = ceilRects.length - 1; i >= 0; i--) { const c = ceilRects[i]; if (c[5] === 'auto' && inDeleted((c[0] + c[2]) / 2, (c[1] + c[3]) / 2)) ceilRects.splice(i, 1); }
  ceilings = mesh(ceilRects.map(r => planeRect(r[0], r[1], r[2], r[3], (r[4] || H) - (r[5] === 'auto' ? 0.02 : 0), 4)), (st.ceiling && MAT[st.ceiling]) || MAT.ceiling, false);
  if (ceilings) { ceilings.visible = roofOn; root.add(ceilings); }

  // Engine-level wall-top closure: where a full-height wall stops at its plate but the roof rises above it (vaulted
  // rooms, cross gables, wings under a taller roof), fill the wall up to the roof underside so walk-through never
  // sees over a partition into the next room's attic, or out to the sky. Inset inside the wall so it never z-fights
  // with model-authored gables; lives in the roof group so it hides with the roof / cutaway.
  if (M.buildType !== 'aframe' && !M.noWallInfill) {
    root.updateMatrixWorld(true);
    const hitMeshes = roof.children.filter(c => c.isMesh && (c.material === roofUnder || c.userData.flatRoof));
    const rcI = new THREE.Raycaster(); rcI.far = 26;
    const up = new THREE.Vector3(0, 1, 0), o3 = new THREE.Vector3();
    const heated = (x, y) => M.rooms.some(r => !(r[7]?.outside) && !isPorchLike(r) && x > r[3] && x < r[5] && y > r[4] && y < r[6]);
    const ceiled = (x, y, h) => ceilRects.some(c => x > c[0] - 0.05 && x < c[2] + 0.05 && y > c[1] - 0.05 && y < c[3] + 0.05 && (c[4] || H) <= h + 0.15);
    const rootInv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const facesI = [], facesE = [];
    const quad = (list, a, b, c, d) => list.push(a, b, c, a, c, d);
    const segs = [...WS.int.map(r => [r, r[4] || H, false]), ...WS.ext.map(r => [r, r[4] || H, true]),
      ...WS.win.map(r => [r, r[6] || H, true]), ...WS.door.map(r => [r, r[5] || H, !!r[6]])];
    for (const [r, top, ext] of segs) {
      const horiz = (r[2] - r[0]) >= (r[3] - r[1]), len = horiz ? r[2] - r[0] : r[3] - r[1], t = horiz ? r[3] - r[1] : r[2] - r[0];
      if (len < 0.3 || top < H - 0.5 || t > 2) continue;
      const mx = (r[0] + r[2]) / 2, my = (r[1] + r[3]) / 2, d = t / 2 + 0.6;
      const sA = horiz ? [mx, r[1] - d] : [r[0] - d, my], sB = horiz ? [mx, r[3] + d] : [r[2] + d, my];
      const inA = heated(...sA), inB = heated(...sB);
      if (!inA && !inB) continue;
      if ((!inA || ceiled(...sA, top)) && (!inB || ceiled(...sB, top))) continue; // nothing open above either side
      const n = Math.max(2, Math.ceil(len / 1.0) + 1), hs = [];
      for (let k = 0; k < n; k++) {
        const u = (horiz ? r[0] : r[1]) + (len * k) / (n - 1) + (k === 0 ? 0.02 : k === n - 1 ? -0.02 : 0);
        const px = horiz ? u : mx, py = horiz ? my : u;
        o3.set(Wx(px), top + 0.03, Wz(py)).applyMatrix4(root.matrixWorld);
        rcI.set(o3, up);
        const hits = rcI.intersectObjects(hitMeshes, false);
        const y1 = hits[0] ? hits[0].point.clone().applyMatrix4(rootInv).y : null;
        const yN = hits.length ? hits[hits.length - 1].point.clone().applyMatrix4(rootInv).y : null;
        hs.push([u, y1, yN, hits[0]?.object.userData.specU || null]);
      }
      // sampled just inside the ends; built slightly past them so neighbouring pieces (door / wall / window) overlap
      hs[0][0] = (horiz ? r[0] : r[1]) - 0.06; hs[n - 1][0] = (horiz ? r[2] : r[3]) + 0.06;
      const ti = Math.min(t * 0.3, 0.12); // half-thickness of the infill (inside the wall faces)
      for (let k = 0; k < n - 1; k++) {
        const [u0, h0, g0, sp0] = hs[k], [u1, h1, g1] = hs[k + 1];
        if (h0 == null || h1 == null) continue;
        // a lower roof dies into this wall below a taller one (e.g. foyer roof against a vaulted great room):
        // carry the wall on up to the taller roof, sided on the face the lower roof covers
        if (g0 - h0 > 0.25 || g1 - h1 > 0.25) {
          const inSpec = (pt) => sp0 && pt[0] > Math.min(sp0.x0, sp0.x1) && pt[0] < Math.max(sp0.x0, sp0.x1) && pt[1] > Math.min(sp0.y0, sp0.y1) && pt[1] < Math.max(sp0.y0, sp0.y1);
          const b0 = Math.max(h0, top) - 0.05, b1 = Math.max(h1, top) - 0.05, c0 = Math.max(g0, b0) - 0.03, c1 = Math.max(g1, b1) - 0.03;
          for (const side of [-1, 1]) {
            const P = (u, y) => horiz ? new THREE.Vector3(Wx(u), y, Wz(my + side * ti)) : new THREE.Vector3(Wx(mx + side * ti), y, Wz(u));
            const sp = side < 0 ? sA : sB, isIn = side < 0 ? inA : inB;
            const list = (!isIn || inSpec(sp)) ? facesE : facesI;
            const p = [P(u0, b0), P(u1, b1), P(u1, c1), P(u0, c0)];
            const nrm = new THREE.Vector3().subVectors(p[1], p[0]).cross(new THREE.Vector3().subVectors(p[2], p[0]));
            if ((horiz ? side * nrm.z : side * nrm.x) < 0) quad(list, p[0], p[3], p[2], p[1]); else quad(list, ...p);
          }
          const T2 = (u, y, sd) => horiz ? new THREE.Vector3(Wx(u), y, Wz(my + sd * ti)) : new THREE.Vector3(Wx(mx + sd * ti), y, Wz(u));
          const c = [T2(u0, c0, -1), T2(u1, c1, -1), T2(u1, c1, 1), T2(u0, c0, 1)];
          const cn = new THREE.Vector3().subVectors(c[1], c[0]).cross(new THREE.Vector3().subVectors(c[2], c[0]));
          { const cl = ext ? facesE : facesI; if (cn.y < 0) quad(cl, c[0], c[3], c[2], c[1]); else quad(cl, ...c); }
        }
        if (h0 - top < 0.25 && h1 - top < 0.25) continue;
        const y0 = top - 0.02, a0 = Math.max(h0, top) - 0.03, a1 = Math.max(h1, top) - 0.03;
        for (const side of [-1, 1]) {
          const P = (u, y) => horiz ? new THREE.Vector3(Wx(u), y, Wz(my + side * ti)) : new THREE.Vector3(Wx(mx + side * ti), y, Wz(u));
          const isIn = side < 0 ? inA : inB;
          const list = (ext && !isIn) ? facesE : facesI;
          // wind so the face normal points away from the wall centre
          const p = [P(u0, y0), P(u1, y0), P(u1, a1), P(u0, a0)];
          const nrm = new THREE.Vector3().subVectors(p[1], p[0]).cross(new THREE.Vector3().subVectors(p[2], p[0]));
          const want = horiz ? side * nrm.z : side * nrm.x;
          if (want < 0) quad(list, p[0], p[3], p[2], p[1]); else quad(list, ...p);
        }
        // sloped top cap
        const T = (u, y, sd) => horiz ? new THREE.Vector3(Wx(u), y, Wz(my + sd * ti)) : new THREE.Vector3(Wx(mx + sd * ti), y, Wz(u));
        const c = [T(u0, a0, -1), T(u1, a1, -1), T(u1, a1, 1), T(u0, a0, 1)];
        const cn = new THREE.Vector3().subVectors(c[1], c[0]).cross(new THREE.Vector3().subVectors(c[2], c[0]));
        { const cl = ext ? facesE : facesI; if (cn.y < 0) quad(cl, c[0], c[3], c[2], c[1]); else quad(cl, ...c); }
      }
    }
    const mk = (pts, matl, tag) => {
      if (!pts.length) return;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap(v => [v.x, v.y, v.z]), 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(pts.flatMap(v => [(v.x + v.z) / 6, v.y / 6]), 2));
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, matl); m.castShadow = true; m.receiveShadow = true;
      m.userData[tag] = true; m.userData.roofPart = true; m.userData.wallInfill = true; roof.add(m);
    };
    mk(facesI, intMat, 'intWalls'); mk(facesE, extMat, 'extInfill');
  }
  applyWallPaint();

  // labels
  labels = new THREE.Group(); root.add(labels);
  for (const r of M.rooms) {
    const [name, dims, , a, b, c, d, o = {}] = r;
    if (o.noLabel || !name) continue;
    const div = document.createElement('div');
    const minor = o.minor || !dims;
    div.className = 'label' + (minor ? ' minor' : '');
    div.textContent = String(name);
    if (dims || o.vaulted || o.tray) { const sm = document.createElement('small'); const extra = [o.vaulted && 'vaulted', o.tray && 'tray'].filter(Boolean).join(' · '); sm.textContent = `${dims || ''}${extra ? (dims ? ' · ' : '') + extra : ''}`; div.appendChild(sm); }
    const obj = new CSS2DObject(div);
    const [lx, ly] = o.labelAt || [(a + c) / 2, (b + d) / 2];
    obj.position.set(Wx(lx), o.labelZ || (minor ? 3 : 4.5), Wz(ly));
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
  document.title = `${M.name || M.title || 'Model'} — PeakStead Designs`;
  setModelUi(true);
  applySiteEnv();
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
  walk: isTouch ? 'Drag to look around · use the arrow pad to walk. Doors open as you walk up (turn off with Auto-open doors).' : 'Click the view to look with the mouse · W A S D / arrows to walk · Shift to run · Esc to release the mouse. Doors swing open as you walk up — use Auto-open doors to keep them shut. Turn the Roof on to see vaulted ceilings.',
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
  if (m !== 'walk' && walkSaved) {
    const w = walkSaved; walkSaved = null;
    amb.intensity = w.amb; camera.near = 0.2; camera.far = 1000; camera.updateProjectionMatrix();
    setRoof(w.roofOn); setCut(w.cutOn); setLabels(w.labelsOn);
  }
  if (mode === 'walk' && m !== 'walk') { exitWalk(); walkAudio.exitWalk(); }
  mode = m;
  document.body.classList.toggle('walk-pad', m === 'walk' && typeof isTouch !== 'undefined' && isTouch);
  setBtn('bOrbit', m === 'orbit'); setBtn('bTop', m === 'top'); setBtn('bWalk', m === 'walk');
  $('help').textContent = HELP[m];
  const size = Math.max(BW, BH, 48) / 91; // keep tiny homes and short trailers in frame
  const hp = housePose();
  if (m === 'orbit') {
    const k = Math.max(0.85, 0.95 / camera.aspect) * size;
    const pos = new THREE.Vector3(52, 66, 92).multiplyScalar(k).add(new THREE.Vector3(hp.x, 0, hp.z)), tgt = new THREE.Vector3(hp.x, 0, hp.z + 4);
    if (instant) { camera.position.copy(pos); orbit.target.copy(tgt); camera.lookAt(tgt); } else animateCam(pos, tgt);
  } else if (m === 'top') {
    setRoof(false);
    const span = Math.max(BH + 10, (BW + 14) / camera.aspect);
    const pos = new THREE.Vector3(hp.x, span / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) + 12, hp.z + 0.01), tgt = new THREE.Vector3(hp.x, 0, hp.z);
    if (instant) { camera.position.copy(pos); orbit.target.copy(tgt); camera.lookAt(tgt); } else animateCam(pos, tgt);
  } else if (m === 'walk') {
    if (!walkSaved) walkSaved = { roofOn, cutOn, labelsOn, amb: amb.intensity };
    setCut(false); setRoof(true); setLabels(false);
    amb.intensity = (walkSaved.amb || 0) + 0.32; // interior fill so closed rooms are never pitch dark
    orbit.enabled = false; camera.fov = 70; camera.near = 0.1; camera.far = 800; camera.updateProjectionMatrix();
    const s = M.walkStart || [CX, CZ + BH / 2 + 5, 0];
    const w = xfHouse(Wx(s[0]), Wz(s[1]), hp.x, hp.z, hp.yaw);
    player.set(w[0], w[1]); yaw = (s[2] || 0) - THREE.MathUtils.degToRad(hp.yaw); pitch = -0.05;
    $('cross').style.display = 'block';
    if (isTouch) $('pad').style.display = 'grid'; else $('walkmsg').style.display = 'block';
    walkAudio.enterWalk();
  }
}
function setRoof(v) {
  roofOn = v;
  if (roof) roof.visible = v;
  if (ceilings) ceilings.visible = v;
  if (itemsGroup) itemsGroup.traverse((o) => { if (o.userData && o.userData.mount === 'roof') o.visible = !!v; });
  setBtn('bRoof', v);
  if (v && cutOn) setCut(false);
}
function setLabels(v) { labelsOn = v; if (labels) { labels.visible = v; labels.children.forEach(o => { o.visible = v; }); } setBtn('bLabels', v); }
function buildWallPicks(WS, H) {
  if (!wallPickMat) wallPickMat = new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
  });
  wallPickGroup = new THREE.Group();
  wallPickGroup.name = 'wallPicks';
  const pad = 0.18; // pad thickness only, so neighboring segments on the same line stay distinct
  for (const kind of ['ext', 'int']) {
    (WS[kind] || []).forEach((w, i) => {
      if (!w) return;
      const x0 = Math.min(w[0], w[2]), x1 = Math.max(w[0], w[2]);
      const y0 = Math.min(w[1], w[3]), y1 = Math.max(w[1], w[3]);
      const horiz = (x1 - x0) >= (y1 - y0);
      const h = Math.max(1.2, w[4] || H || 9);
      const gx = Math.max(x1 - x0, 0.06) + (horiz ? 0 : pad * 2);
      const gz = Math.max(y1 - y0, 0.06) + (horiz ? pad * 2 : 0);
      const m = new THREE.Mesh(new THREE.BoxGeometry(gx, h, gz), wallPickMat);
      m.position.set(Wx((x0 + x1) / 2), h / 2, Wz((y0 + y1) / 2));
      m.castShadow = m.receiveShadow = false;
      m.frustumCulled = false;
      m.userData.wallPick = true;
      m.userData.wallKind = kind;
      m.userData.wallIndex = i;
      m.userData.wallRect = [x0, y0, x1, y1];
      wallPickGroup.add(m);
    });
  }
  root.add(wallPickGroup);
}
function pickWall(ndc) {
  if (!wallPickGroup || !camera || !ndc) return null;
  const rc = new THREE.Raycaster();
  rc.setFromCamera(ndc, camera);
  const hits = rc.intersectObjects(wallPickGroup.children, false).filter((x) => x.object && x.object.userData && x.object.userData.wallPick);
  if (!hits.length) return null;
  const d0 = hits[0].distance;
  const near = hits.filter((h) => h.distance <= d0 + 0.4);
  let best = null, bestDist = Infinity, bestLen = Infinity;
  for (const h of near) {
    const ud = h.object.userData;
    const r = ud.wallRect;
    if (!r) continue;
    const px = h.point.x + CX, py = h.point.z + CZ;
    const dx = Math.max(r[0] - px, 0, px - r[2]);
    const dy = Math.max(r[1] - py, 0, py - r[3]);
    const dist = Math.hypot(dx, dy);
    const len = Math.max(r[2] - r[0], r[3] - r[1]);
    if (dist < bestDist - 0.02 || (Math.abs(dist - bestDist) < 0.02 && len < bestLen)) {
      bestDist = dist; bestLen = len;
      best = { kind: 'wall', wallKind: ud.wallKind, index: ud.wallIndex };
    }
  }
  return best || { kind: 'wall', wallKind: hits[0].object.userData.wallKind, index: hits[0].object.userData.wallIndex };
}
function pickDoor(ndc) {
  if (!doorsGroup || !camera || !ndc) return null;
  const was = doorsGroup.visible;
  doorsGroup.visible = true;
  const rc = new THREE.Raycaster();
  rc.setFromCamera(ndc, camera);
  const hits = rc.intersectObjects(doorsGroup.children, true);
  doorsGroup.visible = was;
  for (const h of hits) {
    let o = h.object;
    while (o) {
      if (o.userData && o.userData.doorIndex != null) return { kind: 'door', index: o.userData.doorIndex };
      o = o.parent;
    }
  }
  return null;
}
function setCut(v) { cutOn = v; if (wallsCut) { wallsCut.visible = v; wallsFull.visible = !v; } if (doorsGroup) doorsGroup.visible = !v || editMode; syncWindows(); setBtn('bCut', v); if (v && roofOn) setRoof(false); }
function setPlan(v) { planOn = v; if (planOverlay) planOverlay.visible = v; setBtn('bPlan', v); }
$('bRoof').onclick = () => setRoof(!roofOn);
$('bLabels').onclick = () => setLabels(!labelsOn);
$('bCut').onclick = () => setCut(!cutOn);
if ($('bWindows')) $('bWindows').onclick = () => setWindowsMode(!winsMode);
$('bPlan').onclick = () => setPlan(!planOn);
function setItemsVisible(v) {
  itemsOn = v;
  if (itemsGroup) itemsGroup.visible = v;
  if ($('bItems')) { $('bItems').classList.toggle('on', v); $('bItems').textContent = v ? 'Items' : 'Items off'; }
}
if ($('bItems')) { setItemsVisible(true); $('bItems').onclick = () => setItemsVisible(!itemsOn); }

$('bOrbit').onclick = () => setMode('orbit');
$('bTop').onclick = () => setMode('top');
$('bWalk').onclick = () => setMode('walk');
$('toggleHud').onclick = () => { const h = $('hud'); h.classList.toggle('collapsed'); $('toggleHud').textContent = h.classList.contains('collapsed') ? '▸' : '▾'; };


// ---------- doors: hinged leaves in every door opening; they swing open as you walk up ----------
const DOOR_PREF = 'peakstead-auto-doors';
let autoDoors = true;
try { autoDoors = localStorage.getItem(DOOR_PREF) !== '0'; } catch {}
let doors = [], doorsGroup = null;
const DOOR_MAT = {
  int: new THREE.MeshStandardMaterial({ color: '#f4f2eb', roughness: .55 }),
  intPanel: new THREE.MeshStandardMaterial({ color: '#ebe8de', roughness: .6 }),
  ext: new THREE.MeshStandardMaterial({ color: '#1d1e20', roughness: .42, metalness: .3 }),
  glass: new THREE.MeshStandardMaterial({ color: '#a8c6d8', roughness: .06, metalness: .2, transparent: true, opacity: .38, side: THREE.DoubleSide }),
  casing: new THREE.MeshStandardMaterial({ color: '#f7f5ef', roughness: .7, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }),
  casingExt: new THREE.MeshStandardMaterial({ color: '#232427', roughness: .6, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }),
  brass: new THREE.MeshStandardMaterial({ color: '#c4a35a', roughness: .3, metalness: .7 }),
  black: new THREE.MeshStandardMaterial({ color: '#121212', roughness: .35, metalness: .55 }),
};
function doorPart(g, w, h, d, m, x, y, z) {
  const ms = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  ms.position.set(x, y, z); ms.castShadow = ms.receiveShadow = true; g.add(ms); return ms;
}
/** One leaf, centred on its own origin: width along x, height up from y=0, thickness along z. */
function makeLeaf(lw, lh, lt, ext, freeSide, color) {
  const g = new THREE.Group();
  const LM = color ? leafMats(color, ext) : null;
  const handleX = freeSide * (lw / 2 - 0.25);
  if (ext) {
    // black steel-and-glass entry leaf (matches black window frames)
    const st = Math.min(0.32, lw * 0.16);
    const EM = LM ? LM.leaf : DOOR_MAT.ext;
    doorPart(g, st, lh, lt, EM, -lw / 2 + st / 2, lh / 2, 0);
    doorPart(g, st, lh, lt, EM, lw / 2 - st / 2, lh / 2, 0);
    doorPart(g, lw - st * 2 + 0.02, st, lt, EM, 0, lh - st / 2, 0);
    doorPart(g, lw - st * 2 + 0.02, 0.85, lt, EM, 0, 0.425, 0);
    doorPart(g, lw - st * 2 + 0.02, lh - st - 0.85 + 0.02, 0.04, DOOR_MAT.glass, 0, 0.85 + (lh - st - 0.85) / 2, 0);
    for (const s of [-1, 1]) doorPart(g, 0.05, 1.5, 0.06, DOOR_MAT.black, handleX, 3.5, s * (lt / 2 + 0.06));
  } else {
    // painted two-panel shaker leaf with brass knobs
    doorPart(g, lw, lh, lt, LM ? LM.leaf : DOOR_MAT.int, 0, lh / 2, 0);
    const pw = lw - 0.55;
    if (pw > 0.3) for (const s of [-1, 1]) {
      doorPart(g, pw, lh * 0.36, 0.02, LM ? LM.panel : DOOR_MAT.intPanel, 0, lh * 0.72, s * (lt / 2 + 0.005));
      doorPart(g, pw, lh * 0.34, 0.02, LM ? LM.panel : DOOR_MAT.intPanel, 0, lh * 0.27, s * (lt / 2 + 0.005));
    }
    for (const s of [-1, 1]) {
      const k = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), DOOR_MAT.brass);
      k.position.set(handleX, 3.0, s * (lt / 2 + 0.09)); g.add(k);
      doorPart(g, 0.04, 0.04, 0.1, DOOR_MAT.brass, handleX, 3.0, s * (lt / 2 + 0.04));
    }
  }
  return g;
}
// ---------- door classification, overhead garage doors, operable windows ----------
const GARAGE_RX = /garage|\bbay\b|\bshop\b/i;
function roomAtPt(x, y, pred) { return (M?.rooms || []).find(r => (!pred || pred(r)) && x > r[3] && x < r[5] && y > r[4] && y < r[6]); }
function insideAny(x, y) { return !!roomAtPt(x, y, r => !(r[7]?.outside)); }
const isGarageRoom = (r) => GARAGE_RX.test(r[0] || '') && !/carport/i.test(r[0] || '');
function doorOpts(r) { return (r && r[7] && typeof r[7] === 'object') ? r[7] : {}; }
function doorInfo(r) {
  const [x0, y0, x1, y1] = r; const horiz = (x1 - x0) >= (y1 - y0);
  const width = horiz ? x1 - x0 : y1 - y0, thick = horiz ? y1 - y0 : x1 - x0;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, top = r[4] ?? 7, ext = !!r[6];
  const opt = doorOpts(r), d = thick / 2 + 1.2;
  const pA = horiz ? [cx, cy - d] : [cx - d, cy], pB = horiz ? [cx, cy + d] : [cx + d, cy];
  const gA = roomAtPt(pA[0], pA[1], isGarageRoom), gB = roomAtPt(pB[0], pB[1], isGarageRoom);
  let garage = false, inward = 1;
  if (opt.garage || (ext && width >= 7.5 && top <= 14.5)) {
    if (gA && !gB) { garage = true; inward = -1; } else if (gB && !gA) { garage = true; inward = 1; }
    else if (opt.garage) { garage = true; inward = insideAny(pB[0], pB[1]) ? 1 : -1; }
  }
  return { horiz, width, thick, cx, cy, top, ext, garage, inward, noLeaf: !!opt.noLeaf, color: opt.color, kind: garage ? 'garage' : ext ? 'ext' : 'int' };
}
let gdoors = [];
function buildGarageDoor(r, info, doorIndex) {
  const style = M.garageDoor || {};
  const H = r[5] || M.wallH || 9, top = info.top;
  const R = Math.max(0.25, Math.min(0.9, H - top - 0.2));
  const w = info.width - 0.08, n = Math.max(4, Math.round(top / 2)), ph = top / n, in0 = info.thick / 2 + 0.1;
  const holder = new THREE.Group(); holder.position.set(Wx(info.cx), 0, Wz(info.cy));
  if (doorIndex != null) holder.userData.doorIndex = doorIndex;
  holder.rotation.y = info.horiz ? (info.inward > 0 ? 0 : Math.PI) : (info.inward > 0 ? Math.PI / 2 : -Math.PI / 2);
  const col = info.color || style.color || '#e9e7e2';
  const pm = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.12 });
  const inset = new THREE.MeshStandardMaterial({ color: new THREE.Color(col).multiplyScalar(0.86), roughness: 0.55, metalness: 0.12 });
  const gl = new THREE.MeshStandardMaterial({ color: '#3d4650', roughness: 0.1, metalness: 0.3 });
  const panels = [];
  for (let i = 0; i < n; i++) {
    const pg = new THREE.Group();
    doorPart(pg, w, ph - 0.03, 0.12, pm, 0, 0, 0);
    const k = Math.max(2, Math.round(w / 2.2)), cw = w / k;
    for (let j = 0; j < k; j++) doorPart(pg, cw - 0.32, ph - 0.5, 0.02, style.glass && i === n - 1 ? gl : inset, -w / 2 + cw * (j + 0.5), 0, -0.07);
    pg.userData.garagePanel = true;
    holder.add(pg); panels.push(pg);
  }
  // steel tracks: vertical at the jambs, a quarter-round radius, then horizontal under the ceiling; centre opener rail
  const steel = new THREE.MeshStandardMaterial({ color: '#8a8d90', roughness: 0.45, metalness: 0.6 });
  const L = top + 0.4;
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 + 0.08);
    doorPart(holder, 0.07, top, 0.12, steel, x, top / 2, in0);
    for (let a = 0; a < 4; a++) { const t0 = (a + 0.5) / 4 * Math.PI / 2; doorPart(holder, 0.07, 0.12, 0.12, steel, x, top + R * Math.sin(t0), in0 + R * (1 - Math.cos(t0))); }
    doorPart(holder, 0.07, 0.12, L, steel, x, top + R, in0 + R + L / 2);
  }
  doorPart(holder, 0.18, 0.1, L + 0.6, steel, 0, top + R + 0.15, in0 + R + (L + 0.6) / 2);
  doorPart(holder, 0.9, 0.45, 1.2, new THREE.MeshStandardMaterial({ color: '#d8d8d4', roughness: 0.6 }), 0, top + R + 0.05, in0 + R + L + 0.6);
  doorsGroup.add(holder);
  const g = { holder, panels, n, ph, top, R, in0, cx: info.cx, cy: info.cy, half: info.width / 2, horiz: info.horiz, open: 0, hold: null };
  poseGarage(g); gdoors.push(g);
}
function poseGarage(g) {
  const o = g.hold != null ? g.hold : g.open;
  const e = o * o * (3 - 2 * o), q = Math.PI * g.R / 2;
  const shift = e * (g.top + q + 0.15);
  for (let i = 0; i < g.n; i++) {
    const p = i * g.ph + g.ph / 2 + shift; let z, y, t;
    if (p <= g.top) { z = g.in0; y = p; t = 0; }
    else if (p <= g.top + q) { const a = (p - g.top) / g.R; z = g.in0 + g.R * (1 - Math.cos(a)); y = g.top + g.R * Math.sin(a); t = a; }
    else { z = g.in0 + g.R + (p - g.top - q); y = g.top + g.R; t = Math.PI / 2; }
    const pn = g.panels[i]; pn.position.set(0, y, z); pn.rotation.x = t;
  }
}
// operable windows (Open windows toggle / click a window): hung sash slides up, casements swing out, sliders slide
let winsMode = false, wins = [], winsGroup = null;
function winType(r) {
  const horiz = (r[2] - r[0]) >= (r[3] - r[1]), w = horiz ? r[2] - r[0] : r[3] - r[1];
  const sill = r[4] ?? 3, head = r[5] ?? 7, h = head - sill;
  if (w >= 1.25 * h || (sill < 1 && w > 5)) return 'slider';
  if (w <= 2.4 && h >= 1.6 * w) return 'casement';
  return 'hung';
}
function makeSash(w, h, fm) {
  const g = new THREE.Group();
  const t = 0.09;
  doorPart(g, w, t, 0.08, fm, 0, h - t / 2, 0); doorPart(g, w, t, 0.08, fm, 0, t / 2, 0);
  doorPart(g, t, h, 0.08, fm, -w / 2 + t / 2, h / 2, 0); doorPart(g, t, h, 0.08, fm, w / 2 - t / 2, h / 2, 0);
  const gm = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.05, w - 2 * t), Math.max(0.05, h - 2 * t), 0.02), MAT.glass); gm.position.set(0, h / 2, 0); g.add(gm);
  return g;
}
function buildWindows(WS) {
  if (winsGroup && winsGroup.parent) winsGroup.parent.remove(winsGroup);
  wins = []; winsGroup = new THREE.Group(); winsGroup.name = 'windows'; root.add(winsGroup);
  const fm = new THREE.MeshStandardMaterial({ color: (M.materials && M.materials.winFrame) || '#2e3033', roughness: 0.5, metalness: 0.2 });
  (WS.win || []).forEach((r, idx) => {
    const horiz = (r[2] - r[0]) >= (r[3] - r[1]), w = horiz ? r[2] - r[0] : r[3] - r[1], thick = horiz ? r[3] - r[1] : r[2] - r[0];
    const sill = r[4] ?? 3, head = r[5] ?? 7, h = head - sill, cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
    if (w < 0.8 || h < 0.8) return;
    const d = thick / 2 + 0.7;
    const inP = horiz ? insideAny(cx, cy + d) : insideAny(cx + d, cy), inN = horiz ? insideAny(cx, cy - d) : insideAny(cx - d, cy);
    const out = inP && !inN ? -1 : 1; // +1 = outside toward plan +y / +x
    const holder = new THREE.Group(); holder.position.set(Wx(cx), sill, Wz(cy));
    holder.rotation.y = horiz ? (out > 0 ? 0 : Math.PI) : (out > 0 ? Math.PI / 2 : -Math.PI / 2);
    const type = winType(r), parts = [];
    if (type === 'hung') {
      const up = makeSash(w, h / 2 + 0.05, fm); up.position.set(0, h / 2 - 0.05, 0.05); holder.add(up);
      const lo = makeSash(w, h / 2 + 0.05, fm); lo.position.set(0, 0, -0.05); holder.add(lo);
      parts.push({ m: lo, kind: 'up', amt: h * 0.44 });
    } else if (type === 'casement') {
      const nS = w > 3.2 ? 2 : 1, sw = w / nS;
      for (let i = 0; i < nS; i++) {
        const left = i === 0, piv = new THREE.Group(); piv.position.set(left ? -w / 2 : w / 2, 0, 0.04);
        const sa = makeSash(sw, h, fm); sa.position.x = left ? sw / 2 : -sw / 2; piv.add(sa); holder.add(piv);
        parts.push({ m: piv, kind: 'swing', sign: left ? -1 : 1 });
      }
    } else {
      const sw = w / 2 + 0.05;
      const a = makeSash(sw, h, fm); a.position.set(-w / 4, 0, 0.05); holder.add(a);
      const b = makeSash(sw, h, fm); b.position.set(w / 4, 0, -0.05); holder.add(b);
      parts.push({ m: b, kind: 'slide', amt: -w * 0.47, x0: w / 4 });
    }
    holder.traverse(o => { o.userData.winIdx = idx; });
    winsGroup.add(holder);
    wins.push({ holder, type, parts, open: 0, manual: null, delay: (idx % 7) * 0.12 });
  });
  syncWindows();
}
function poseWindow(wn) {
  const e = wn.open * wn.open * (3 - 2 * wn.open);
  for (const p of wn.parts) {
    if (p.kind === 'up') p.m.position.y = e * p.amt;
    else if (p.kind === 'swing') p.m.rotation.y = p.sign * e * THREE.MathUtils.degToRad(65);
    else p.m.position.x = p.x0 + e * p.amt;
  }
}
function syncWindows() {
  const show = winsMode || wins.some(w => w.open > 0.001);
  if (winsGroup) winsGroup.visible = show && !cutOn;
  for (const g of [wallsFull, wallsCut]) if (g) g.traverse(o => { if (o.userData?.winGlass) o.visible = !(show && !cutOn); });
  const b = $('bWindows');
  if (b) { b.classList.toggle('on', winsMode); b.setAttribute('aria-pressed', winsMode ? 'true' : 'false'); b.textContent = winsMode ? 'Open windows: On' : 'Open windows: Off'; }
}
function setWindowsMode(v) {
  winsMode = !!v;
  if (winsMode && !wins.length && M?.walls) buildWindows(M.walls);
  for (const w of wins) w.manual = null;
  syncWindows();
}
function updateWindows(dt) {
  if (!wins.length) return;
  let moving = false;
  for (const w of wins) {
    const target = w.manual != null ? (w.manual ? 1 : 0) : (winsMode ? 1 : 0);
    if (w.open === target) continue;
    if (target && w.delay > 0) { w.delay -= dt; continue; }
    moving = true;
    w.open = target > w.open ? Math.min(1, w.open + dt * 0.9) : Math.max(0, w.open - dt * 0.9);
    poseWindow(w);
  }
  if (moving || (!winsMode && winsGroup?.visible)) syncWindows();
}
function buildDoors(WS) {
  doors = []; gdoors = [];
  doorsGroup = new THREE.Group(); doorsGroup.name = 'doors'; root.add(doorsGroup);
  const cas = [], casExt = [];
  (WS.door || []).forEach((r, di) => {
    const [x0, y0, x1, y1] = r, top = r[4] ?? 7, ext = !!r[6];
    const horiz = (x1 - x0) >= (y1 - y0);
    const width = horiz ? x1 - x0 : y1 - y0;
    const info = doorInfo(r);
    // garage doors: overhead sectional door on tracks (unless removed → open opening)
    if (info.garage) { if (!info.noLeaf) buildGarageDoor(r, info, di); return; }
    // wide cased openings stay open (no hinged leaf)
    if (width < 1.6 || top < 6 || width > (ext ? 7.2 : 6.2)) return;
    const jt = 0.12, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const list = ext ? casExt : cas;
    if (horiz) list.push(boxRect(x0, y0 - 0.03, x0 + jt, y1 + 0.03, 0, top), boxRect(x1 - jt, y0 - 0.03, x1, y1 + 0.03, 0, top), boxRect(x0, y0 - 0.03, x1, y1 + 0.03, top - jt, top));
    else list.push(boxRect(x0 - 0.03, y0, x1 + 0.03, y0 + jt, 0, top), boxRect(x0 - 0.03, y1 - jt, x1 + 0.03, y1, 0, top), boxRect(x0 - 0.03, y0, x1 + 0.03, y1, top - jt, top));
    if (info.noLeaf) return; // door removed in Edit Plan: keep the cased opening
    const clear = width - jt * 2;
    const n = clear > 4.0 ? 2 : 1;
    const lw = clear / n - 0.03, lh = top - jt - 0.06, lt = 0.15;
    const leaves = [];
    for (let i = 0; i < n; i++) {
      const dirSign = i === 0 ? 1 : -1; // leaf runs from its hinge toward the middle of the opening
      const pivot = new THREE.Group();
      const hx = horiz ? (i === 0 ? x0 + jt + 0.015 : x1 - jt - 0.015) : cx;
      const hy = horiz ? cy : (i === 0 ? y0 + jt + 0.015 : y1 - jt - 0.015);
      pivot.position.set(Wx(hx), 0.04, Wz(hy));
      const holder = new THREE.Group();
      if (!horiz) holder.rotation.y = -Math.PI / 2; // local +x → plan +y (world +z)
      const leaf = makeLeaf(lw, lh, lt, ext, dirSign, doorColorFor(r, ext));
      leaf.position.x = dirSign * lw / 2;
      holder.add(leaf); pivot.add(holder); doorsGroup.add(pivot);
      pivot.userData.doorIndex = di;
      // +θ swings a +x leaf toward -z, a -x leaf toward +z, a +z leaf toward +x, a -z leaf toward -x
      leaves.push({ pivot, sign: horiz ? -dirSign : dirSign });
    }
    doors.push({ cx, cy, horiz, half: width / 2, ext, leaves, open: 0, side: 1, maxDeg: n === 2 ? 95 : 92, rec: r });
  });
  const a = mesh(cas, DOOR_MAT.casing, true), b = mesh(casExt, DOOR_MAT.casingExt, true);
  if (a) doorsGroup.add(a); if (b) doorsGroup.add(b);
  doorsGroup.visible = !cutOn;
}
function updateDoors(dt) {
  updateWindows(dt);
  if (!doors.length && !gdoors.length) return;
  let px = null, pz = null;
  if (mode === 'walk' && autoDoors) {
    const hp = housePose();
    const loc = houseFromWorld(player.x, player.y, hp.x, hp.z, hp.yaw);
    px = loc[0]; pz = loc[1];
  }
  if (itemDoors.length) {
    const wp = new THREE.Vector3();
    for (const d of itemDoors) {
      let target = 0;
      if (mode === 'walk' && autoDoors) { d.piv.getWorldPosition(wp); if (Math.hypot(player.x - wp.x, player.y - wp.z) < 6.5) target = 1; }
      if (d.open === target) continue;
      d.open = target > d.open ? Math.min(1, d.open + dt * 1.6) : Math.max(0, d.open - dt * 1.2);
      const e = d.open * d.open * (3 - 2 * d.open);
      d.piv.rotation.y = d.sign * e * d.max;
    }
  }
  for (const g of gdoors) {
    let target = 0;
    if (px != null) {
      const dx = px - Wx(g.cx), dz = pz - Wz(g.cy);
      const along = g.horiz ? dx : dz, across = g.horiz ? dz : dx;
      if (Math.abs(along) < g.half + 2 && Math.abs(across) < 9.5) target = 1; // starts rolling up well before you reach it
    }
    if (g.hold != null || g.open === target) continue;
    g.open = target > g.open ? Math.min(1, g.open + dt * 0.48) : Math.max(0, g.open - dt * 0.4);
    poseGarage(g);
  }
  for (const d of doors) {
    let target = 0;
    if (px != null) {
      const dx = px - Wx(d.cx), dz = pz - Wz(d.cy);
      const along = d.horiz ? dx : dz, across = d.horiz ? dz : dx;
      if (Math.abs(along) < d.half + 1.3 && Math.abs(across) < 4.6) target = 1;
      // pick the swing direction when it starts to open: away from whoever walked up
      if (target && d.open < 0.02) d.side = across > 0 ? -1 : 1;
    }
    if (d.open === target) continue;
    const step = dt * 1.9;
    d.open = target > d.open ? Math.min(target, d.open + step) : Math.max(target, d.open - step * 0.75);
    const e = d.open * d.open * (3 - 2 * d.open);
    const ang = e * THREE.MathUtils.degToRad(d.maxDeg);
    for (const lf of d.leaves) lf.pivot.rotation.y = d.side * lf.sign * ang;
  }
}
function syncDoorsBtn() {
  const b = $('bDoors'); if (!b) return;
  b.classList.toggle('on', autoDoors);
  b.setAttribute('aria-pressed', autoDoors ? 'true' : 'false');
  b.textContent = autoDoors ? 'Auto-open doors: On' : 'Auto-open doors: Off';
  b.title = autoDoors ? 'Doors swing open as you walk up to them (click to keep them closed)' : 'Doors stay closed (click to let them open as you walk up)';
}
function setAutoDoors(v) {
  autoDoors = !!v;
  try { localStorage.setItem(DOOR_PREF, autoDoors ? '1' : '0'); } catch {}
  syncDoorsBtn();
}
if ($('bDoors')) { syncDoorsBtn(); $('bDoors').onclick = () => setAutoDoors(!autoDoors); }
const walkAudio = createWalkAudio();
function walkAudioState() {
  const hp = housePose();
  const fireplaces = (currentItems || []).filter(isFireplaceItem).map((it) => {
    const w = xfHouse(Wx(it.x), Wz(it.y), hp.x, hp.z, hp.yaw);
    return { x: w[0], z: w[1], fuel: fuelOf(it) };
  });
  const garageDoors = (gdoors || []).map((g, i) => {
    const w = xfHouse(Wx(g.cx), Wz(g.cy), hp.x, hp.z, hp.yaw);
    return { id: i, x: w[0], z: w[1], open: g.hold != null ? g.hold : g.open };
  });
  return { mode, player, yaw, garageDoors, fireplaces };
}

// ---------- walk-through ----------
const EYE = 5.5, RADIUS = 0.75, player = new THREE.Vector2();
let yaw = 0, pitch = 0, walkSaved = null, walkVel = { x: 0, z: 0 };
const keys = {};
function blocked(x, z) {
  const hp = housePose();
  const loc = houseFromWorld(x, z, hp.x, hp.z, hp.yaw);
  const lx = loc[0], lz = loc[1];
  for (const [a, b, c, d] of solids) {
    const nx = Math.max(a, Math.min(lx, c)), nz = Math.max(b, Math.min(lz, d));
    if ((lx - nx) ** 2 + (lz - nz) ** 2 < RADIUS * RADIUS) return true;
  }
  // furniture: a smaller body radius, and never trap the walker if they start inside a piece
  const cur = houseFromWorld(player.x, player.y, hp.x, hp.z, hp.yaw), rr = 0.45;
  for (const [a, b, c, d] of itemSolids) {
    if (cur[0] > a - rr && cur[0] < c + rr && cur[1] > b - rr && cur[1] < d + rr) continue;
    if (lx > a - rr && lx < c + rr && lz > b - rr && lz < d + rr) return true;
  }
  return false;
}
addEventListener('keydown', e => { keys[e.code] = true; if (mode === 'walk' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', e => { keys[e.code] = false; });
$('walkmsg').onclick = () => renderer.domElement.requestPointerLock?.();
renderer.domElement.addEventListener('click', (ev) => {
  if (mode === 'walk' && !editMode && clickWindow(ev)) return;
  if (mode === 'walk' && !isTouch && !document.pointerLockElement) renderer.domElement.requestPointerLock?.();
});
// click / tap a window in walk-through to open or close just that window
function clickWindow(ev) {
  if (!winsGroup || !wins.length) return false;
  const rc = new THREE.Raycaster(); rc.far = 14;
  if (document.pointerLockElement) rc.setFromCamera(new THREE.Vector2(0, 0), camera);
  else { const r = renderer.domElement.getBoundingClientRect(); rc.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), camera); }
  const was = winsGroup.visible; winsGroup.visible = true; winsGroup.updateMatrixWorld(true);
  const hits = rc.intersectObjects(winsGroup.children, true);
  winsGroup.visible = was;
  const h = hits.find(x => x.object.userData.winIdx != null);
  if (!h) return false;
  const blockers = rc.intersectObjects([wallsFull].filter(Boolean), true).filter(x => !x.object.userData.winGlass);
  if (blockers.length && blockers[0].distance < h.distance - 0.3) return false;
  const wn = wins.find(w => w.holder.userData.winIdx === h.object.userData.winIdx) || wins.find(w => { let o = h.object; while (o) { if (o === w.holder) return true; o = o.parent; } return false; });
  if (!wn) return false;
  const isOpen = wn.manual != null ? wn.manual : winsMode;
  wn.manual = !isOpen; wn.delay = 0; syncWindows();
  return true;
}
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
  const vmax = keys.ShiftLeft || keys.ShiftRight ? 12 : 6;
  let tx = 0, tz = 0;
  if (f || s) {
    const len = Math.hypot(f, s); f /= len; s /= len;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    tx = (fx * f + rx * s) * vmax; tz = (fz * f + rz * s) * vmax;
  }
  const k = 1 - Math.exp(-dt * 10); // ease velocity toward the target (smooth start/stop, no jitter)
  walkVel.x += (tx - walkVel.x) * k; walkVel.z += (tz - walkVel.z) * k;
  if (Math.abs(walkVel.x) < 0.01) walkVel.x = 0; if (Math.abs(walkVel.z) < 0.01) walkVel.z = 0;
  const dx = walkVel.x * dt, dz = walkVel.z * dt;
  if (dx && !blocked(player.x + dx, player.y)) player.x += dx; else if (dx) walkVel.x = 0;
  if (dz && !blocked(player.x, player.y + dz)) player.y += dz; else if (dz) walkVel.z = 0;
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
  if (!Number.isFinite(ang)) return;
  narrow.setAttribute('transform', `rotate(${(-ang * 180 / Math.PI).toFixed(1)})`);
}

// ---------- GLB / glTF models (uploaded by users) ----------
function disposeRoot() {
  if (!root) return;
  root.traverse(o => { if (o.element?.parentNode) o.element.parentNode.removeChild(o.element); if (o.geometry && !o.geometry.userData?.shared) o.geometry.dispose(); });
  scene.remove(root); root = null;
}
function buildGLB(gltfScene, meta = {}) {
  disposeRoot();
  root = new THREE.Group(); scene.add(root);
  wallsFull = wallsCut = labels = planOverlay = ceilings = null; solids = []; doors = []; doorsGroup = null;
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
  document.title = `${M.name} — PeakStead Designs`;
  setModelUi(false, roofNodes.length > 0);
  if (roofNodes.length) setRoof(true);
  applySiteEnv();
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
  if (!Array.isArray(m.rooms) || !m.rooms.length) throw new Error('This model file has no "rooms" list, so it is not in the PeakStead Designs JSON format.');
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
const SRC = params.get('s') ? { kind: 'share', token: params.get('s') } : params.get('p') ? { kind: 'project', id: params.get('p') } : params.get('draft') === '1' ? { kind: 'draft' } : params.get('embed') === '1' ? { kind: 'embed' } : { kind: 'example' };
let assetBase = null, projectFiles = [];
function resolveAsset(src) {
  if (!src) return src;
  const f = projectFiles.find(x => x.kind === 'image' && (x.name === src || x.id === src));
  if (f && assetBase) return `${assetBase}/files/${f.id}`;
  return src;
}
function setModelUi(engine, hasRoof = true) {
  for (const id of ['bLabels', 'bCut', 'bPlan', 'bEdit', 'bItems', 'bDoors', 'bWindows', 'bSound', 'bPlan2d', 'bExportPlans']) if ($(id)) $(id).style.display = engine ? '' : 'none';
  if ($('editPlanBtn')) $('editPlanBtn').style.display = engine ? 'inline-flex' : 'none';
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
else if (SRC.kind === 'draft' || SRC.kind === 'embed') {
  back.href = '/builder'; back.textContent = '← Builder';
  if (SRC.kind === 'embed') {
    document.body.classList.add('embed');
    if ($('topbar')) $('topbar').style.display = 'none';
    document.documentElement.style.setProperty('--tbh', '0px');
  }
}
else { back.href = `/s/${encodeURIComponent(SRC.token)}`; back.textContent = '← Project'; }
// Keep the HUD, compass, and Edit drawer below the top bar on every screen size.
const syncTopbar = () => {
  const bar = $('topbar');
  if (!bar || document.body.classList.contains('embed')) {
    document.documentElement.style.setProperty('--tbh', '0px');
    return;
  }
  document.documentElement.style.setProperty('--tbh', Math.ceil(bar.getBoundingClientRect().height) + 'px');
};
syncTopbar();
addEventListener('resize', syncTopbar);
if (typeof ResizeObserver === 'function' && $('topbar')) {
  new ResizeObserver(syncTopbar).observe($('topbar'));
}
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
  clearSiteEnv();
  currentStyle = (mod.default && mod.default.defaultStyle) || 'default';
  syncStyleUi();
  snapshotOriginal(mod.default);
  activeLayout = layoutFromStorage();
  buildModel(mod.default, { layout: activeLayout });
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
  if (p.exampleId && !model) {
    const entry = REGISTRY.find(r => r.id === p.exampleId);
    if (!entry) return showError('This saved example is no longer available.');
    const mod = await entry.load();
    if (mode === 'walk') exitWalk();
    disposeRoot();
    currentStyle = (mod.default && mod.default.defaultStyle) || 'default';
    syncStyleUi();
    snapshotOriginal(mod.default);
    activeLayout = sanitizeLayout(p.layout) || layoutFromStorage();
    buildModel(mod.default, { layout: activeLayout });
    setMode('orbit', true);
    window.app.current = entry.id;
    await loadProjectSite(p);
    return;
  }
  if (!model) return showError('This project has no 3D model yet. Add one from the project page.');
  const fr = await fetch(`${assetBase}/files/${model.id}`, { credentials: 'same-origin' });
  if (!fr.ok) return showError('Could not download the 3D model file.');
  try {
    if (model.format === 'json') {
      {
        const jsonModel = normalizeJsonModel(await fr.json(), p.name);
        snapshotOriginal(jsonModel);
        activeLayout = sanitizeLayout(p.layout) || layoutFromStorage();
        buildModel(jsonModel, { layout: activeLayout });
      }
    } else {
      const buf = await fr.arrayBuffer();
      const gltf = await new Promise((res, rej) => new GLTFLoader().parse(buf, '', res, rej));
      buildGLB(gltf.scene, { name: p.name, subtitle: model.name });
    }
  } catch (e) { console.error(e); return showError('This 3D model could not be opened: ' + (e.message || e)); }
  setMode('orbit', true);
  await loadProjectSite(p);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); labelRenderer.setSize(innerWidth, innerHeight);
});
const clock = new THREE.Clock();

function inDeleted(x, y) { return deletedRooms.some(d => x > d.rect[0] && x < d.rect[2] && y > d.rect[1] && y < d.rect[3]) && !roomAtPt(x, y); }
function modelAreas(M) {
  if (M?.areas && typeof M.areas.heated === 'number') {
    const sub = { heated: 0, garage: 0, porch: 0 };
    for (const d of deletedRooms) sub[d.cat] = (sub[d.cat] || 0) + (d.area || 0);
    return { heated: Math.max(0, M.areas.heated - sub.heated), garage: Math.max(0, (M.areas.garage || 0) - sub.garage), porch: Math.max(0, (M.areas.porch || 0) - sub.porch) };
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
  const hasLot = !!(siteCfg.parcel && siteCfg.parcel.rings);
  if (!M?.rooms?.length && !M?.areas && !hasLot) { el.style.display = 'none'; return; }
  const { heated, garage, porch } = modelAreas(M);
  if (!heated && !garage && !porch && !hasLot) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  if (h) h.textContent = heated ? fmtSf(heated) : (hasLot ? '—' : fmtSf(heated));
  const bits = [];
  if (garage > 1) bits.push('Garage ' + fmtSf(garage) + ' sf');
  if (porch > 1) bits.push('Porches ' + fmtSf(porch) + ' sf');
  if (sub) { sub.textContent = bits.join(' · '); sub.style.display = bits.length ? '' : 'none'; }
  syncLotStatus();
  try {
    window.dispatchEvent(new CustomEvent('peakstead-areas', { detail: { ...modelAreas(M), buildType: M?.buildType || 'home' } }));
  } catch {}
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (mode === 'walk') walkStep(dt); else orbit.update();
  updateDoors(dt);
  walkAudio.update(walkAudioState());
  updateNorth();
  if (labelsOn && labels) for (const o of labels.children) {
    const wp = o.getWorldPosition(new THREE.Vector3());
    const show = mode !== 'walk' || Math.hypot(wp.x - camera.position.x, wp.z - camera.position.z) < 16;
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
  if (itemFire.flames.length || itemFire.lights.length || itemFire.glows.length) {
    const t = performance.now() / 1000;
    for (const l of itemFire.lights) {
      const u = l.userData.fireLight;
      l.intensity = u.base * (0.82 + 0.18 * Math.sin(t * 11 + u.t0) + 0.1 * Math.sin(t * 27 + 1.4));
    }
    for (const m of itemFire.flames) {
      const u = m.userData.flame;
      const k = 0.84 + 0.22 * Math.sin(t * (8.5 + u.phase) + u.phase);
      m.scale.y = k; m.position.y = u.y0 + (u.baseH * k) / 2;
      if (u.sway) m.scale.x = 1 + u.sway * Math.sin(t * (4.3 + u.phase * 0.5) + u.phase * 2.1);
      m.material.opacity = (u.op ?? 1) * (0.5 + 0.35 * Math.sin(t * (6.5 + u.phase * 0.7) + u.phase));
    }
    for (const m of itemFire.glows) {
      const u = m.userData.emberGlow;
      m.material.opacity = u.base * (0.8 + 0.14 * Math.sin(t * 3.1 + u.t0) + 0.06 * Math.sin(t * 13.7 + u.t0 * 2));
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
  buildModel(planOriginal?.source || loadedModel, { layout: activeLayout });
  setMode(keep, true);
  if (keep === 'walk' && walkPos) { player.copy(walkPos); yaw = walkYaw; pitch = walkPitch; }
  setRoof(keepRoof); setLabels(keepLabels); setCut(keepCut); setPlan(keepPlan);
}
if ($('bStyle')) $('bStyle').addEventListener('change', e => setStyle(e.target.value));

function frameModel(modeHint = 'orbit') {
  const rooms = M?.rooms || [];
  if (!rooms.length) return;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const r of rooms) { x0 = Math.min(x0, r[3]); y0 = Math.min(y0, r[4]); x1 = Math.max(x1, r[5]); y1 = Math.max(y1, r[6]); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const span = Math.max(x1 - x0, y1 - y0, 12);
  if (modeHint === 'top') lookTopSafe(cx, cy, Math.max(36, span * 1.8));
  else {
    setMode('orbit', true);
    const wx = Wx(cx), wz = Wz(cy);
    const dist = Math.max(18, span * 1.05), height = Math.max(8, span * 0.32);
    orbit.target.set(wx, 1.4, wz);
    camera.position.set(wx + dist * 0.65, height, wz + dist * 0.85);
    orbit.update();
  }
}
function lookTopSafe(fx, fy, height = 48) {
  const wx = Wx(fx), wz = Wz(fy);
  setMode('top', true);
  orbit.target.set(wx, 0, wz);
  camera.position.set(wx, height, wz + 0.01);
  orbit.update();
}
function loadJsonModel(raw, fallbackName = 'Builder home', view = 'orbit') {
  const rooms = raw && Array.isArray(raw.rooms) ? raw.rooms : [];
  if (!rooms.length) return false;
  const jsonModel = normalizeJsonModel(raw, fallbackName);
  if (mode === 'walk') exitWalk();
  disposeRoot();
  if (typeof clearSiteEnv === 'function') clearSiteEnv({ restore: true });
  currentStyle = jsonModel.defaultStyle || currentStyle || 'default';
  syncStyleUi();
  snapshotOriginal(jsonModel);
  activeLayout = null;
  buildModel(jsonModel, { layout: null });
  setMode('orbit', true);
  setRoof(true);
  setLabels(true);
  setItemsVisible?.(true);
  frameModel(view);
  window.app.current = jsonModel.id || 'builder';
  if ($('back') && (SRC.kind === 'draft' || SRC.kind === 'embed')) { $('back').href = '/builder'; $('back').textContent = '← Builder'; }
  return true;
}
function loadBuilderDraft() {
  try {
    const raw = JSON.parse(localStorage.getItem('peakstead-builder-draft-model') || 'null');
    if (!loadJsonModel(raw, 'Builder home', 'orbit')) showError('No builder plan is saved on this device yet. Go back to the Builder and place a room.');
  } catch (e) {
    showError('Could not open the builder plan: ' + (e.message || e));
  }
}
window.addEventListener('message', (ev) => {
  if (ev.origin !== location.origin) return;
  if (ev.data && ev.data.type === 'peakstead-builder-model' && ev.data.model) {
    loadJsonModel(ev.data.model, ev.data.model.title || 'Builder home', ev.data.view || 'orbit');
  }
});
if (SRC.kind === 'embed' && window.parent && window.parent !== window) {
  try { window.parent.postMessage({ type: 'peakstead-builder-ready' }, location.origin); } catch {}
}

window.__walkAudio = walkAudio.debug;
window.app = {
  loadExample, loadJsonModel, scene, setMode, setRoof, setLabels, setCut, setPlan, setStyle, camera, orbit, player,
  setLook: (y, p) => { yaw = y; pitch = p; }, setPlayer: (fx, fy) => player.set(Wx(fx), Wz(fy)), current: null,
  planToWorld: (fx, fy) => [Wx(fx), Wz(fy)],
  getRooms: () => M?.rooms || [],
  getItems: () => currentItems,
  addItem: addItemOp,
  setItems: (list) => setItemsList(list),
  lookAtPlan: (fx, fy, dist = 22, height = 9) => {
    const wx = Wx(fx), wz = Wz(fy);
    orbit.target.set(wx, 1.4, wz);
    camera.position.set(wx + dist * 0.65, height, wz + dist * 0.85);
    orbit.update();
  },
  lookTop: lookTopSafe,
  getAreas: () => M ? modelAreas(M) : { heated: 0, garage: 0, porch: 0 },
  getBuildType: () => M?.buildType || 'home',
  getRoofs: () => M?.roofs || [],
  captureThumb,
  rebuildPlan,
  setAutoDoors,
  getAutoDoors: () => autoDoors,
  getDoors: () => doors.map(d => ({ cx: d.cx, cy: d.cy, ext: d.ext, leaves: d.leaves.length, open: +d.open.toFixed(2) })),
  getGarageDoors: () => gdoors.map(g => ({ cx: g.cx, cy: g.cy, width: +(g.half * 2).toFixed(2), open: +g.open.toFixed(2), hold: g.hold })),
  holdGarage: (i, v) => { const g = gdoors[i]; if (g) { g.hold = v == null ? null : +v; poseGarage(g); } },
  getItemDoors: () => itemDoors.map(d => +d.open.toFixed(2)),
  getWindows: () => wins.map(w => ({ type: w.type, open: +w.open.toFixed(2) })),
  setWindowsMode, doorList, removeDoor: removeDoorOp, restoreDoor: restoreDoorOp, garageSize: garageSizeOp, addGarageDoor: addGarageDoorOp, pickDoor, pickWall,
  removeRoomByName, getFinishes: () => finishes, setFinishes: setFinishesOp, getWalls: () => M?.walls,
  getWalkAudio: () => ({
    muted: !walkAudio.isEnabled(), unlocked: !!walkAudio.debug.unlocked(), inWalk: !!walkAudio.debug.inWalk(),
    fire: { ...(walkAudio.debug.fire || {}) }, garage: (walkAudio.debug.garage || []).map((g) => ({ ...g })),
  }),
  setWalkSound: (v) => walkAudio.setEnabled(!!v),
  getWalkPos: () => ({ x: player.x, y: player.y }),
  setWalkPos: (x, z) => { player.x = +x; player.y = +z; walkVel.x = 0; walkVel.z = 0; if (mode === 'walk') camera.position.set(+x, EYE, +z); },
  setWalkPlan: (fx, fy) => {
    const hp = housePose();
    const w = xfHouse(Wx(fx), Wz(fy), hp.x, hp.z, hp.yaw);
    player.x = w[0]; player.y = w[1]; walkVel.x = 0; walkVel.z = 0;
    if (mode === 'walk') camera.position.set(w[0], EYE, w[1]);
    return { x: w[0], y: w[1] };
  },
  getLayout: () => captureLayout(),
  dbg: () => ({ roof, root, ceilings, wallsFull, M, itemsGroup }),
};
if (SRC.kind === 'example') await loadExample(params.get('ex') || REGISTRY[0].id);
else if (SRC.kind === 'draft') loadBuilderDraft();
else if (SRC.kind !== 'embed') await loadProjectModel();
loop();


function getPlanSnapshot() {
  const info = (activeLayout && activeLayout.planInfo) ? { ...activeLayout.planInfo } : undefined;
  const stairTypes = new Set(Object.entries(ITEM_CATALOG).filter(([, v]) => v && v.stair).map(([k]) => k));
  const outbuilding = new Set(Object.entries(ITEM_CATALOG).filter(([, v]) => v && (v.outbuilding || v.category === 'outbuilding')).map(([k]) => k));
  const parcel = siteCfg.parcel ? parcelDefaults(siteCfg.parcel) : null;
  let lot = null;
  if (parcel) {
    try { lot = lotStats(parcel, M, { cx: CX, cz: CZ, bw: BW, bh: BH }); } catch (e) { console.warn('lot stats', e); }
  }
  return {
    id: (M && (M.id || M.name)) || currentId || 'plan',
    exampleId: currentId,
    title: (M && (M.title || M.name)) || 'Untitled plan',
    subtitle: (M && M.subtitle) || '',
    name: (M && (M.name || M.title)) || '',
    rooms: M?.rooms || [],
    walls: M?.walls || { ext: [], int: [], win: [], door: [] },
    roofs: M?.roofs || [],
    items: currentItems || [],
    finishes: finishes || {},
    areas: M ? modelAreas(M) : { heated: 0, garage: 0, porch: 0 },
    wallH: M?.wallH || 9,
    doorList: typeof doorList === 'function' ? doorList() : [],
    front: (parcel && parcel.front) || 's',
    parcel,
    lot,
    getLot: () => lot,
    src: SRC,
    planInfo: info,
    stairTypes,
    itemTypes: { outbuilding },
    onPlanInfo: (rec) => {
      if (!activeLayout) captureLayout();
      if (activeLayout) activeLayout.planInfo = rec;
    },
  };
}
window.app.getPlanSnapshot = getPlanSnapshot;
window.app.setPlan2d = setPlan2d;
window.app.openExportDialog = openExportDialog;
window.app.exportPlansPdf = exportPlansPdf;
window.app.buildPlanSvgSet = buildPlanSvgSet;
mountPlanExport(getPlanSnapshot);
