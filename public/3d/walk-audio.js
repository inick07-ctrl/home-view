// PeakStead Designs — walk-through audio (garage-door roll-up + fireplace).
// All sounds are synthesized with the Web Audio API (no external files).
// Nothing plays outside walk-through, and the graph starts only after a user gesture.

const FIRE_NEAR = 6;   // ft: full but gentle crackle
const FIRE_FAR = 20;   // ft: silent
const GARAGE_FAR = 48; // ft: inaudible motor/rumble
const SOUND_PREF = 'peakstead-walk-sound';

function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function distGain(d, near, far) {
  if (d <= near) return 1;
  if (d >= far) return 0;
  const t = (d - near) / (far - near);
  return (1 - t) * (1 - t); // ease out so it fades gently
}

function makeNoise(ctx, seconds = 2) {
  const n = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    // mild brown-ish noise (better rumble / fire bed than white)
    last = (last + (Math.random() * 2 - 1) * 0.08) * 0.97;
    d[i] = last * 3.2 + (Math.random() * 2 - 1) * 0.15;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  return src;
}

function thunk(ctx, dest, t, freq, dur, gain) {
  const o = ctx.createOscillator();
  o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.45), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = freq * 4;
  o.connect(lp); lp.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + 0.02);
}

function click(ctx, dest, t, gain) {
  const n = ctx.sampleRate * 0.04;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700 + Math.random() * 900; bp.Q.value = 1.4;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  src.connect(bp); bp.connect(g); g.connect(dest);
  src.start(t); src.stop(t + 0.05);
}

export function createWalkAudio() {
  let ctx = null, master = null, fireGain = null, humGain = null;
  let fireSrc = null, humOsc = null, crackleDest = null;
  let nextCrackle = 0;
  let enabled = true;
  try { enabled = localStorage.getItem(SOUND_PREF) !== '0'; } catch {}
  let inWalk = false;
  let unlocked = false;
  const garageVoices = new Map();
  const debug = {
    muted: () => !enabled,
    unlocked: () => unlocked,
    inWalk: () => inWalk,
    fire: { dist: null, gain: 0, fuel: null },
    garage: [],
  };

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    master.connect(ctx.destination);

    // --- fire bed + crackle bus ---
    fireGain = ctx.createGain(); fireGain.gain.value = 0;
    fireGain.connect(master);
    const bed = makeNoise(ctx, 2.4);
    const bedLp = ctx.createBiquadFilter(); bedLp.type = 'lowpass'; bedLp.frequency.value = 420; bedLp.Q.value = 0.6;
    const bedG = ctx.createGain(); bedG.gain.value = 0.22;
    bed.connect(bedLp); bedLp.connect(bedG); bedG.connect(fireGain);
    fireSrc = bed; bed.start();
    // occasional hiss
    const hiss = makeNoise(ctx, 1.6);
    const hissBp = ctx.createBiquadFilter(); hissBp.type = 'highpass'; hissBp.frequency.value = 1800;
    const hissG = ctx.createGain(); hissG.gain.value = 0.05;
    hiss.connect(hissBp); hissBp.connect(hissG); hissG.connect(fireGain);
    hiss.start();
    crackleDest = fireGain;

    // --- faint electric hum ---
    humGain = ctx.createGain(); humGain.gain.value = 0;
    humGain.connect(master);
    const h1 = ctx.createOscillator(); h1.type = 'sine'; h1.frequency.value = 120;
    const h2 = ctx.createOscillator(); h2.type = 'sine'; h2.frequency.value = 240;
    const hg1 = ctx.createGain(); hg1.gain.value = 0.035;
    const hg2 = ctx.createGain(); hg2.gain.value = 0.012;
    h1.connect(hg1); h2.connect(hg2); hg1.connect(humGain); hg2.connect(humGain);
    h1.start(); h2.start(); humOsc = h1;
    return ctx;
  }

  function burst(t) {
    if (!ctx || !crackleDest) return;
    const n = Math.floor(ctx.sampleRate * 0.12);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 0.6);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 700 + Math.random() * 2800;
    bp.Q.value = 0.9 + Math.random() * 1.4;
    const g = ctx.createGain();
    const amp = 0.08 + Math.random() * 0.16;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(amp, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 + Math.random() * 0.07);
    src.connect(bp); bp.connect(g); g.connect(crackleDest);
    src.start(t); src.stop(t + 0.14);
  }

  function scheduleCrackles() {
    if (!ctx || !inWalk || !enabled) return;
    const t = ctx.currentTime;
    if (nextCrackle < t) nextCrackle = t;
    while (nextCrackle < t + 0.25) {
      burst(nextCrackle);
      nextCrackle += 0.05 + Math.random() * 0.22;
    }
  }

  function garageVoice() {
    const gBus = ctx.createGain(); gBus.gain.value = 0;
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) { gBus.connect(panner); panner.connect(master); }
    else gBus.connect(master);

    const motor = ctx.createOscillator(); motor.type = 'triangle'; motor.frequency.value = 58;
    const motor2 = ctx.createOscillator(); motor2.type = 'sawtooth'; motor2.frequency.value = 116;
    const mLp = ctx.createBiquadFilter(); mLp.type = 'lowpass'; mLp.frequency.value = 260;
    const mG = ctx.createGain(); mG.gain.value = 0.16;
    motor.connect(mLp); motor2.connect(mLp); mLp.connect(mG); mG.connect(gBus);
    motor.start(); motor2.start();

    const rumble = makeNoise(ctx, 1.8);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 280; bp.Q.value = 0.7;
    const rG = ctx.createGain(); rG.gain.value = 0.55;
    rumble.connect(bp); bp.connect(rG); rG.connect(gBus);
    rumble.start();

    // slow amplitude wobble on the rumble (rolling panels)
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 3.4;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.18;
    lfo.connect(lfoG); lfoG.connect(rG.gain); lfo.start();

    return { gBus, panner, motor, motor2, lastOpen: 0, dir: 0, target: 0, ending: false };
  }

  function unlock() {
    const c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    unlocked = true;
    applyMaster();
  }

  function applyMaster() {
    if (!master || !ctx) return;
    const on = inWalk && enabled && unlocked;
    const v = on ? 1 : 0;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setTargetAtTime(v, t, 0.04);
    if (!on) {
      if (fireGain) fireGain.gain.setTargetAtTime(0, t, 0.05);
      if (humGain) humGain.gain.setTargetAtTime(0, t, 0.05);
      debug.fire.gain = 0;
    }
  }

  function setEnabled(v) {
    enabled = !!v;
    try { localStorage.setItem(SOUND_PREF, enabled ? '1' : '0'); } catch {}
    if (enabled) unlock();
    applyMaster();
    syncBtn();
  }

  function syncBtn() {
    const b = document.getElementById('bSound');
    if (!b) return;
    b.classList.toggle('on', enabled);
    b.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    b.textContent = enabled ? 'Sound: On' : 'Sound: Off';
    b.title = enabled
      ? 'Walk-through sounds are on (garage door and fireplace). Click to mute.'
      : 'Walk-through sounds are muted. Click to turn them on.';
  }

  function enterWalk() { inWalk = true; unlock(); applyMaster(); }
  function exitWalk() { inWalk = false; applyMaster(); debug.fire = { dist: null, gain: 0, fuel: null }; debug.garage = []; }

  function update(state) {
    const { mode, player, garageDoors, fireplaces } = state;
    if (mode === 'walk' && !inWalk) enterWalk();
    if (mode !== 'walk' && inWalk) exitWalk();
    if (!ctx || !inWalk || !enabled || !unlocked) {
      if (fireGain && ctx) fireGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      if (humGain && ctx) humGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      return debug;
    }
    const t = ctx.currentTime;
    const px = player.x, pz = player.y;

    // fireplaces: closest wood crackle + closest electric hum, distance-faded
    let wood = { d: Infinity, fuel: 'wood' }, elec = { d: Infinity, fuel: 'electric' };
    for (const f of (fireplaces || [])) {
      const d = Math.hypot(px - f.x, pz - f.z);
      if ((f.fuel || 'wood') === 'electric') { if (d < elec.d) elec = { d, fuel: 'electric' }; }
      else if (d < wood.d) wood = { d, fuel: 'wood' };
    }
    const wGain = Number.isFinite(wood.d) ? distGain(wood.d, FIRE_NEAR, FIRE_FAR) * 0.28 : 0;
    const eGain = Number.isFinite(elec.d) ? distGain(elec.d, FIRE_NEAR, FIRE_FAR) * 0.045 : 0;
    fireGain.gain.setTargetAtTime(wGain, t, 0.08);
    humGain.gain.setTargetAtTime(eGain, t, 0.1);
    if (wGain > 0.002) scheduleCrackles();
    const use = wGain >= eGain ? wood : elec;
    debug.fire = {
      dist: Number.isFinite(use.d) ? +use.d.toFixed(2) : null,
      gain: +((wGain >= eGain ? wGain : eGain).toFixed(4)),
      woodGain: +wGain.toFixed(4),
      electricGain: +eGain.toFixed(4),
      fuel: Number.isFinite(use.d) ? use.fuel : null,
    };

    // garage doors
    const seen = new Set();
    debug.garage = [];
    (garageDoors || []).forEach((g, i) => {
      const id = g.id ?? i;
      seen.add(id);
      let v = garageVoices.get(id);
      if (!v) { v = garageVoice(); v.lastOpen = g.open || 0; garageVoices.set(id, v); }
      const open = g.open || 0;
      const dOpen = open - v.lastOpen;
      const moving = Math.abs(dOpen) > 0.0008;
      const dir = dOpen > 0.0008 ? 1 : dOpen < -0.0008 ? -1 : 0;
      if (dir && dir !== v.dir) {
        // starting to move: thunk + (if opening) a slightly brighter motor
        thunk(ctx, v.gBus, t, dir > 0 ? 90 : 70, 0.16, dir > 0 ? 0.35 : 0.22);
        v.ending = false;
      }
      if (!dir && v.dir && (open < 0.02 || open > 0.98) && !v.ending) {
        thunk(ctx, v.gBus, t, 55, 0.22, 0.4);
        click(ctx, v.gBus, t + 0.02, 0.18);
        v.ending = true;
      }
      if (dir && Math.random() < 0.08) click(ctx, v.gBus, t, 0.05 + Math.random() * 0.06);
      const dist = Math.hypot(px - g.x, pz - g.z);
      const atten = distGain(dist, 8, GARAGE_FAR);
      v.target = moving ? atten : 0;
      const cur = v.gBus.gain.value;
      v.gBus.gain.setTargetAtTime(v.target, t, moving ? 0.05 : 0.12);
      if (v.panner && dist > 0.1) {
        // rough stereo: doors to the right of view pan right. Use raw dx if no yaw provided.
        const yaw = state.yaw || 0;
        const rx = Math.cos(yaw), rz = -Math.sin(yaw);
        const side = (g.x - px) * rx + (g.z - pz) * rz;
        v.panner.pan.setTargetAtTime(clamp01(0.5 + side / (dist + 4) * 0.5) * 2 - 1, t, 0.1);
      }
      debug.garage.push({
        i, dist: +dist.toFixed(2), open: +open.toFixed(3),
        moving, dir, gain: +((moving ? atten : cur) ).toFixed(4), atten: +atten.toFixed(4),
      });
      v.lastOpen = open; v.dir = dir;
    });
    for (const [id, v] of garageVoices) {
      if (seen.has(id)) continue;
      v.gBus.gain.setTargetAtTime(0, t, 0.08);
    }
    return debug;
  }

  // first gesture unlocks audio (browser autoplay policy)
  const gesture = () => { if (inWalk || document.getElementById('bWalk')?.classList.contains('on')) unlock(); };
  for (const ev of ['pointerdown', 'keydown', 'touchstart', 'click']) {
    document.addEventListener(ev, gesture, { capture: true, passive: true });
  }

  syncBtn();
  const btn = document.getElementById('bSound');
  if (btn) btn.onclick = () => { setEnabled(!enabled); if (enabled) unlock(); };

  return {
    unlock, enterWalk, exitWalk, update, setEnabled,
    isEnabled: () => enabled,
    syncBtn,
    debug,
    prefKey: SOUND_PREF,
  };
}
