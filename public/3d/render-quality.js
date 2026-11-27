// PeakStead Designs — higher-quality 3D: PBR texture maps, a physical sky with
// image-based lighting, ACES filmic tone mapping, optional GTAO, and a
// Standard / High quality switch that stays gentle on phones.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/** Slot name on MAT/TEX → folder under /tex (CC0 from ambientCG, see /tex/LICENSE.txt). */
const PBR_SLOTS = {
  wood: 'wood-oak',
  lightOak: 'wood-oak',
  porch: 'wood-oak',
  walnutPlank: 'wood-walnut',
  grass: 'grass',
  darkShingle: 'shingles',
  shingle: 'shingles',
  metal: 'metal-roof',
  brick: 'brick',
  ledgestone: 'stone',
  stone: 'stone',
  lightStone: 'stone',
  tile: 'tile',
  subway: 'subway',
  concrete: 'concrete',
  paver: 'paver',
  terrace: 'paver',
  gym: 'concrete',
  board: 'siding-dark',
};

const QUALITY_KEY = 'peakstead-render-quality';

export function isCoarseDevice() {
  try {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPod|Android.+Mobile/i.test(ua)) return true;
    const touch = (navigator.maxTouchPoints || 0) > 1;
    const small = Math.min(screen.width, screen.height) < 900;
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if ((touch || coarse) && small) return true;
    if (/iPad/i.test(ua) || (touch && /Mac/.test(ua) && coarse)) return true;
  } catch {}
  return false;
}

export function readQualityMode() {
  try {
    const v = localStorage.getItem(QUALITY_KEY);
    if (v === 'auto' || v === 'standard' || v === 'high') return v;
  } catch {}
  return 'auto';
}

export function writeQualityMode(mode) {
  try { localStorage.setItem(QUALITY_KEY, mode); } catch {}
}

export function startingLevel(mode) {
  if (mode === 'high') return 2;
  if (mode === 'standard') return 1;
  return isCoarseDevice() ? 1 : 2;
}

/** Build a tangent-space normal map from a canvas or image source. */
export function normalFromImage(image, strength = 1.4) {
  if (!image) return null;
  const w = image.width, h = image.height;
  if (!w || !h) return null;
  const src = document.createElement('canvas');
  src.width = w; src.height = h;
  const sctx = src.getContext('2d', { willReadFrequently: true });
  try { sctx.drawImage(image, 0, 0); } catch { return null; }
  let srcData;
  try { srcData = sctx.getImageData(0, 0, w, h); } catch { return null; }
  const dst = sctx.createImageData(w, h);
  const d = srcData.data, o = dst.data;
  const lum = (x, y) => {
    const i = (((y + h) % h) * w + ((x + w) % w)) * 4;
    return (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (lum(x - 1, y) - lum(x + 1, y)) * strength;
      const ny = (lum(x, y - 1) - lum(x, y + 1)) * strength;
      const inv = 1 / Math.hypot(nx, ny, 1);
      const i = (y * w + x) * 4;
      o[i] = (nx * inv * 0.5 + 0.5) * 255;
      o[i + 1] = (ny * inv * 0.5 + 0.5) * 255;
      o[i + 2] = (1 * inv * 0.5 + 0.5) * 255;
      o[i + 3] = 255;
    }
  }
  sctx.putImageData(dst, 0, 0);
  const t = new THREE.CanvasTexture(src);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  t.flipY = false;
  return t;
}

function applyAniso(tex, value) {
  if (!tex) return;
  tex.anisotropy = value;
  tex.needsUpdate = true;
}

function copyRepeat(from, to) {
  if (!from || !to) return;
  to.wrapS = from.wrapS ?? THREE.RepeatWrapping;
  to.wrapT = from.wrapT ?? THREE.RepeatWrapping;
  to.repeat.copy(from.repeat);
  to.offset.copy(from.offset);
  to.rotation = from.rotation || 0;
}

export function installRenderQuality({ renderer, scene, camera, sun, hemi, amb, ground, MAT, TEX }) {
  const maxAniso = Math.min(16, renderer.capabilities.getMaxAnisotropy?.() || 8);

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Upgrade leftover Lambert materials so every surface is in the PBR path.
  const lambertKeys = ['subway', 'concrete', 'porch', 'gym', 'terrace', 'paver', 'slab', 'ceiling'];
  for (const k of lambertKeys) {
    const old = MAT[k];
    if (!old || old.isMeshStandardMaterial || old.isMeshPhysicalMaterial) continue;
    const std = new THREE.MeshStandardMaterial({
      map: old.map || null,
      color: old.color ? old.color.clone() : new THREE.Color('#ffffff'),
      roughness: k === 'slab' ? 0.9 : 0.82,
      metalness: 0,
      side: old.side,
      transparent: old.transparent,
      opacity: old.opacity,
      envMapIntensity: 0.85,
    });
    old.dispose?.();
    MAT[k] = std;
  }
  if (ground && ground.material && !ground.material.isMeshStandardMaterial) {
    const old = ground.material;
    ground.material = new THREE.MeshStandardMaterial({
      map: old.map || TEX.grass,
      roughness: 0.92,
      metalness: 0,
      envMapIntensity: 0.55,
    });
    ground.material.color.set('#f3f7eb');
    old.dispose?.();
  }
  ground?.material && (ground.receiveShadow = true);

  // Physical glass (transmission is toggled with quality).
  {
    const old = MAT.glass;
    const glass = new THREE.MeshPhysicalMaterial({
      color: old?.color ? old.color.clone() : new THREE.Color('#9fd0ee'),
      roughness: 0.06,
      metalness: 0,
      transmission: 0,
      thickness: 0.14,
      ior: 1.52,
      transparent: true,
      opacity: old?.opacity ?? 0.45,
      envMapIntensity: 1.35,
      side: THREE.DoubleSide,
      specularIntensity: 1,
    });
    if (old?.emissive) glass.emissive.copy(old.emissive);
    glass.emissiveIntensity = old?.emissiveIntensity || 0;
    old?.dispose?.();
    MAT.glass = glass;
  }

  // Shared stone / carpet materials used by furniture (maps filled in when textures land).
  MAT.quartz = new THREE.MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.28, metalness: 0.04, envMapIntensity: 1.15 });
  MAT.carpet = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, metalness: 0, envMapIntensity: 0.35 });

  // Procedural bump on surfaces we keep canvas-painted (white siding, plaster, limewash, slate).
  for (const k of ['whiteBoard', 'limewash', 'palePlaster', 'slate', 'lightStone']) {
    const mat = MAT[k], tex = TEX[k];
    if (!mat || !tex?.image) continue;
    const nrm = normalFromImage(tex.image, k === 'whiteBoard' ? 2.4 : 0.9);
    if (!nrm) continue;
    copyRepeat(tex, nrm);
    nrm.anisotropy = maxAniso;
    mat.normalMap = nrm;
    mat.normalScale = new THREE.Vector2(k === 'whiteBoard' ? 0.85 : 0.45, k === 'whiteBoard' ? 0.85 : 0.45);
    mat.envMapIntensity = 0.7;
  }
  if (MAT.whiteBoard) MAT.whiteBoard.roughness = 0.78;

  // --- Physical sky + IBL ---
  const sky = new Sky();
  sky.scale.setScalar(450000);
  sky.name = 'ps-sky';
  sky.material.fog = false;
  scene.add(sky);
  const skyU = sky.material.uniforms;
  skyU['turbidity'].value = 3.2;
  skyU['rayleigh'].value = 1.15;
  skyU['mieCoefficient'].value = 0.005;
  skyU['mieDirectionalG'].value = 0.8;

  const skyScene = new THREE.Scene();
  const skyClone = new Sky();
  skyClone.scale.setScalar(450000);
  skyScene.add(skyClone);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  let envRT = null;
  let envTimer = 0;
  const _sunDir = new THREE.Vector3();

  function copySkyUniforms() {
    const a = sky.material.uniforms, b = skyClone.material.uniforms;
    for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG', 'sunPosition']) {
      if (a[k] && b[k]) {
        if (a[k].value && a[k].value.clone) b[k].value.copy(a[k].value);
        else b[k].value = a[k].value;
      }
    }
  }

  function rebuildEnv() {
    copySkyUniforms();
    let next = null;
    try { next = pmrem.fromScene(skyScene, 0.0, 0.1, 2000); } catch (err) { console.warn('PMREM sky failed', err); return; }
    if (envRT) envRT.dispose();
    envRT = next;
    scene.environment = envRT.texture;
  }

  function updateSky({ night = 0, allowSky = true, immediate = false } = {}) {
    if (!allowSky) {
      sky.visible = false;
      return;
    }
    sky.visible = night < 0.92;
    _sunDir.copy(sun.position).normalize();
    if (_sunDir.lengthSq() < 1e-6) _sunDir.set(0.4, 0.8, 0.45).normalize();
    // Keep the sun slightly above the horizon so the sky doesn't go black at dawn/dusk.
    if (_sunDir.y < 0.02 && night < 0.7) _sunDir.y = 0.02;
    skyU['sunPosition'].value.copy(_sunDir);
    const elev = Math.max(0, _sunDir.y);
    skyU['turbidity'].value = 2.4 + (1 - elev) * 4.5 + night * 6;
    skyU['rayleigh'].value = night > 0.5 ? 0.25 : 0.9 + (1 - elev) * 0.7;
    skyU['mieCoefficient'].value = 0.005 + night * 0.01;
    skyU['mieDirectionalG'].value = 0.8;
    if (immediate) {
      clearTimeout(envTimer);
      rebuildEnv();
    } else {
      clearTimeout(envTimer);
      envTimer = setTimeout(rebuildEnv, 140);
    }
  }

  // --- Post (High only) ---
  let composer = null, gtaoPass = null, useComposer = false, composerOk = true;
  function ensureComposer() {
    if (composer || !composerOk) return composer;
    try {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      gtaoPass = new GTAOPass(scene, camera, innerWidth, innerHeight);
      gtaoPass.output = GTAOPass.OUTPUT.Default;
      gtaoPass.blendIntensity = 0.5;
      if (gtaoPass.updateGtaoMaterial) {
        gtaoPass.updateGtaoMaterial({
          radius: 0.22,
          distanceExponent: 2,
          thickness: 1,
          scale: 1.1,
          samples: 16,
          screenSpaceRadius: false,
        });
      }
      composer.addPass(gtaoPass);
      composer.addPass(new OutputPass());
      composer.setSize(innerWidth, innerHeight);
    } catch (err) {
      console.warn('GTAO composer unavailable, staying on the forward path', err);
      composer = null;
      gtaoPass = null;
      composerOk = false;
    }
    return composer;
  }

  function applyLevel(q) {
    const aniso = q >= 2 ? maxAniso : q === 1 ? Math.min(8, maxAniso) : 4;
    for (const t of Object.values(TEX)) applyAniso(t, aniso);
    if (MAT.glass) {
      const hi = q >= 2;
      MAT.glass.transmission = hi ? 0.78 : 0;
      MAT.glass.opacity = hi ? 1 : Math.min(0.55, MAT.glass.userData.baseOpacity ?? 0.45);
      MAT.glass.roughness = hi ? 0.045 : 0.08;
      MAT.glass.thickness = hi ? 0.16 : 0.08;
      MAT.glass.needsUpdate = true;
    }
    useComposer = q >= 2 && composerOk;
    if (useComposer) ensureComposer();
    if (gtaoPass) gtaoPass.enabled = useComposer;
    sun.shadow.bias = -0.00028;
    sun.shadow.normalBias = 0.035;
    renderer.toneMappingExposure = q >= 2 ? 0.5 : 0.48;
  }

  function tuneLights(night = 0) {
    // IBL already fills the scene; pull down the old hemi/sun so it doesn't wash out.
    hemi.intensity *= 0.45;
    if (amb && amb.intensity) amb.intensity *= 0.55;
    sun.intensity *= 0.95;
    renderer.toneMappingExposure = night > 0.55 ? 0.38 : 0.5;
    if (scene.environment) {
      // r160 has no scene.environmentIntensity; dim via material defaults at night only.
      const envI = night > 0.5 ? 0.2 : 0.9;
      for (const m of Object.values(MAT)) {
        if (m && m.envMapIntensity != null && !m.userData.lockEnv) m.envMapIntensity = envI * (m.userData.envScale ?? 1);
      }
    }
  }

  function setSize(w, h) {
    if (composer) composer.setSize(w, h);
    if (gtaoPass && gtaoPass.setSize) gtaoPass.setSize(w, h);
  }

  function render() {
    if (useComposer && composer) {
      try { composer.render(); return; }
      catch (err) {
        console.warn('Composer render failed, disabling GTAO', err);
        useComposer = false;
        composerOk = false;
      }
    }
    renderer.render(scene, camera);
  }

  // --- Load CC0 PBR maps and swap them onto existing materials ---
  const loader = new THREE.TextureLoader();
  const loaded = {};
  const ready = new Promise((resolve) => {
    const jobs = [];
    const unique = [...new Set(Object.values(PBR_SLOTS))];
    unique.push('quartz', 'carpet');
    for (const folder of unique) {
      for (const kind of ['color', 'normal', 'rough']) {
        jobs.push(new Promise((res) => {
          loader.load(`/tex/${folder}/${kind}.jpg`, (t) => {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.anisotropy = maxAniso;
            t.colorSpace = kind === 'color' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
            t.flipY = true;
            (loaded[folder] ||= {})[kind] = t;
            res();
          }, undefined, () => res());
        }));
      }
    }
    Promise.all(jobs).then(() => {
      const assign = (mat, folder, { colorTint, repeat, envScale, roughness, metalness, normalScale } = {}) => {
        const pack = loaded[folder];
        if (!mat || !pack?.color) return;
        const color = pack.color.clone(); color.needsUpdate = true;
        const normal = pack.normal ? pack.normal.clone() : null;
        const rough = pack.rough ? pack.rough.clone() : null;
        if (normal) normal.needsUpdate = true;
        if (rough) rough.needsUpdate = true;
        const base = mat.map || TEX[Object.keys(PBR_SLOTS).find((k) => MAT[k] === mat)] || TEX.grass;
        if (repeat != null) {
          color.repeat.set(repeat, repeat);
          if (normal) normal.repeat.set(repeat, repeat);
          if (rough) rough.repeat.set(repeat, repeat);
        } else {
          copyRepeat(base, color);
          if (normal) copyRepeat(base, normal);
          if (rough) copyRepeat(base, rough);
        }
        color.anisotropy = normal && (normal.anisotropy = maxAniso);
        if (rough) rough.anisotropy = maxAniso;
        mat.map = color;
        if (normal) { mat.normalMap = normal; mat.normalScale = new THREE.Vector2(normalScale ?? 0.85, normalScale ?? 0.85); }
        if (rough) { mat.roughnessMap = rough; }
        if (colorTint) mat.color.set(colorTint);
        if (roughness != null) mat.roughness = roughness;
        if (metalness != null) mat.metalness = metalness;
        mat.envMapIntensity = envScale ?? 0.9;
        mat.needsUpdate = true;
      };

      for (const [key, folder] of Object.entries(PBR_SLOTS)) {
        if (!MAT[key]) continue;
        const extras = {};
        if (key === 'metal') { extras.colorTint = '#4a4c50'; extras.roughness = 0.38; extras.metalness = 0.55; extras.envScale = 1.2; extras.normalScale = 1.1; }
        if (key === 'darkShingle' || key === 'shingle') { extras.colorTint = '#8a8c90'; extras.roughness = 0.82; extras.metalness = 0.02; extras.normalScale = 1.15; }
        if (key === 'board') { extras.roughness = 0.8; extras.normalScale = 1; }
        if (key === 'wood' || key === 'lightOak' || key === 'porch' || key === 'walnutPlank') {
          extras.roughness = 0.55; extras.envScale = 0.85; extras.normalScale = 0.7; extras.colorTint = '#ffffff';
        }
        if (key === 'brick' || key === 'ledgestone' || key === 'stone' || key === 'lightStone') {
          extras.roughness = 0.9; extras.normalScale = 1.05;
        }
        if (key === 'tile' || key === 'subway') { extras.roughness = 0.35; extras.envScale = 1.05; extras.metalness = 0.04; }
        if (key === 'paver' || key === 'concrete' || key === 'terrace' || key === 'gym') { extras.roughness = 0.88; extras.normalScale = 1; }
        assign(MAT[key], folder, extras);
        // Keep TEX[key] pointing at the new color map so UV helpers that read TEX still work.
        if (MAT[key].map) TEX[key] = MAT[key].map;
      }
      if (ground?.material) {
        assign(ground.material, 'grass', { repeat: 90, roughness: 0.94, envScale: 0.35, normalScale: 0.5, colorTint: '#ffffff' });
        if (TEX.grass) TEX.grass.repeat.set(90, 90);
        if (ground.material.map) ground.material.map.repeat.set(90, 90);
        if (ground.material.normalMap) ground.material.normalMap.repeat.set(90, 90);
        if (ground.material.roughnessMap) ground.material.roughnessMap.repeat.set(90, 90);
      }
      assign(MAT.quartz, 'quartz', { roughness: 0.26, metalness: 0.05, envScale: 1.2, normalScale: 0.55, colorTint: '#f4f2ee' });
      assign(MAT.carpet, 'carpet', { roughness: 0.95, envScale: 0.3, normalScale: 0.9 });
      if (MAT.quartz?.map) MAT.quartz.map.repeat.set(3.4, 3.4);
      if (MAT.quartz?.normalMap) MAT.quartz.normalMap.repeat.set(3.4, 3.4);
      if (MAT.quartz?.roughnessMap) MAT.quartz.roughnessMap.repeat.set(3.4, 3.4);
      rebuildEnv();
      resolve(loaded);
    });
  });

  // First env from the default morning sun so early frames aren't unlit.
  updateSky({ night: 0, allowSky: true, immediate: true });

  return {
    sky,
    applyLevel,
    updateSky,
    tuneLights,
    setSize,
    render,
    ready,
    get usingComposer() { return useComposer; },
    getMat: () => MAT,
  };
}
