// Client welcome, contact, level switch, Start Tour UI + soft WebAudio bed.
// Generic for every catalog model and saved project — never invents an address or phone.

function $(id) { return document.getElementById(id); }

const MUSIC_PREF = 'peakstead-tour-music';

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- soft tour music (WebAudio, no files) ---------- */
function createTourMusic() {
  let ctx = null, master = null, nodes = [], playing = false, muted = false;
  try { muted = localStorage.getItem(MUSIC_PREF) === '0'; } catch {}

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.7;
    master.connect(lp); lp.connect(ctx.destination);
    return ctx;
  }

  function buildPad() {
    if (!ctx || nodes.length) return;
    const freqs = [196, 246.94, 293.66, 392]; // G-minor-ish open fifths, soft
    for (let i = 0; i < freqs.length; i++) {
      const o = ctx.createOscillator();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = freqs[i];
      const g = ctx.createGain();
      g.gain.value = 0.045 - i * 0.006;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine'; lfo.frequency.value = 0.07 + i * 0.03;
      const lg = ctx.createGain(); lg.gain.value = 0.012;
      lfo.connect(lg); lg.connect(g.gain);
      o.connect(g); g.connect(master);
      o.start(); lfo.start();
      nodes.push(o, lfo, g);
    }
  }

  function start() {
    if (!ensure()) return;
    buildPad();
    ctx.resume?.();
    playing = true;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(muted ? 0 : 0.22, now + 1.2);
  }
  function stop() {
    if (!ctx || !master) { playing = false; return; }
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 1.0);
    playing = false;
  }
  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem(MUSIC_PREF, muted ? '0' : '1'); } catch {}
    if (ctx && master && playing) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(muted ? 0 : 0.22, now + 0.25);
    }
    syncMusicUi();
  }
  function syncMusicUi() {
    const btn = $('bTourMute');
    if (btn) {
      btn.textContent = muted ? 'Music: Off' : 'Music: On';
      btn.setAttribute('aria-pressed', muted ? 'false' : 'true');
      btn.classList.toggle('on', !muted);
    }
  }
  return { start, stop, setMuted, isMuted: () => muted, isPlaying: () => playing, syncMusicUi };
}

const music = createTourMusic();

function currentInfo() {
  if (window.app && typeof window.app.getClientInfo === 'function') return window.app.getClientInfo();
  return { project: '', address: '', price: '', contactName: '', contactPhone: '' };
}

function fillWelcome() {
  const info = currentInfo();
  const nameEl = $('welcomeName');
  if (nameEl) nameEl.value = info.project || '';
  const addr = $('welcomeAddress');
  if (addr) addr.value = info.address || '';
  const price = $('welcomePrice');
  if (price) price.value = info.price || '';
  const cn = $('contactName');
  if (cn) cn.value = info.contactName || '';
  const cp = $('contactPhone');
  if (cp) cp.value = info.contactPhone || '';
  syncContactBtn(info);
}

function persistWelcome() {
  if (!window.app || typeof window.app.setClientInfo !== 'function') return;
  window.app.setClientInfo({
    project: $('welcomeName')?.value || '',
    address: $('welcomeAddress')?.value || '',
    price: $('welcomePrice')?.value || '',
    contactName: $('contactName')?.value || '',
    contactPhone: $('contactPhone')?.value || '',
  });
  syncContactBtn(currentInfo());
}

function syncContactBtn(info) {
  const btn = $('bContact');
  const call = $('contactCall');
  if (!btn) return;
  const name = (info.contactName || '').trim();
  const phone = (info.contactPhone || '').trim();
  btn.textContent = name ? ('Contact ' + name) : 'Contact';
  if (call) {
    if (phone) {
      const tel = phone.replace(/[^\d+]/g, '');
      call.hidden = false;
      call.href = 'tel:' + tel;
      call.textContent = name ? `Call ${name} · ${phone}` : `Call ${phone}`;
    } else {
      call.hidden = true;
      call.removeAttribute('href');
    }
  }
}

export function showWelcome() {
  const el = $('welcome');
  if (!el) return;
  fillWelcome();
  el.hidden = false;
  document.body.classList.add('welcome-open');
}

export function hideWelcome() {
  const el = $('welcome');
  if (el) el.hidden = true;
  document.body.classList.remove('welcome-open');
  const sheet = $('contactSheet');
  if (sheet) sheet.hidden = true;
}

function toggleContact(force) {
  const sheet = $('contactSheet');
  if (!sheet) return;
  const open = force == null ? sheet.hidden : !!force;
  sheet.hidden = !open;
  if (open) fillWelcome();
}

function renderLevels() {
  const wrap = $('levelWrap');
  if (!wrap || !window.app?.listLevels) return;
  const levels = window.app.listLevels() || [];
  if (levels.length <= 1) { wrap.hidden = true; wrap.innerHTML = ''; return; }
  wrap.hidden = false;
  const cur = window.app.getLevel ? window.app.getLevel() : (levels[0] && levels[0].id);
  wrap.innerHTML = '<span>Level</span>' + levels.map((lv) =>
    `<button type="button" data-level="${escapeHtml(lv.id)}" class="${lv.id === cur ? 'on' : ''}">${escapeHtml(lv.label)}</button>`
  ).join('');
  wrap.onclick = (e) => {
    const b = e.target.closest('button[data-level]');
    if (!b || !window.app.setLevel) return;
    window.app.setLevel(b.dataset.level);
    renderLevels();
  };
}

function setTourLabel(rec) {
  const el = $('tourLabel');
  if (!el) return;
  if (!rec) { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  el.innerHTML = `<strong>${escapeHtml(rec.name)}</strong><span>${escapeHtml(rec.size || '')}</span>${rec.point ? `<em>${escapeHtml(rec.point)}</em>` : ''}`;
}

function syncTourBtn(on) {
  const btn = $('bTour');
  if (btn) {
    btn.classList.toggle('on', !!on);
    btn.textContent = on ? 'Stop tour' : 'Start Tour';
  }
  const mute = $('bTourMute');
  if (mute) mute.hidden = !on;
  if (on) music.syncMusicUi();
}

function startTour() {
  hideWelcome();
  togglePlanReadoutSafe(false);
  if (!window.app?.startTour) return;
  music.setMuted(music.isMuted());
  music.start();
  window.app.startTour({
    onStop: () => { music.stop(); setTourLabel(null); syncTourBtn(false); },
    onLabel: (rec) => setTourLabel(rec),
  });
  syncTourBtn(true);
}

function stopTour() {
  if (window.app?.stopTour) window.app.stopTour();
  music.stop();
  setTourLabel(null);
  syncTourBtn(false);
}

function togglePlanReadoutSafe(v) {
  const ev = new CustomEvent('peakstead-toggle-readout', { detail: { open: v } });
  dispatchEvent(ev);
}

function shouldAutoWelcome() {
  const q = new URLSearchParams(location.search);
  if (q.get('nowelcome') === '1' || q.get('embed') === '1' || q.get('draft') === '1') return false;
  return true;
}

export function mountClientTour() {
  const start = $('welcomeStart');
  if (start) start.addEventListener('click', () => { persistWelcome(); hideWelcome(); });
  const skip = $('welcomeSkip');
  if (skip) skip.addEventListener('click', () => { persistWelcome(); hideWelcome(); });
  for (const id of ['welcomeName', 'welcomeAddress', 'welcomePrice', 'contactName', 'contactPhone']) {
    const el = $(id);
    if (el) el.addEventListener('change', persistWelcome);
    if (el) el.addEventListener('blur', persistWelcome);
  }
  const contact = $('bContact');
  if (contact) contact.addEventListener('click', () => toggleContact());
  const contactClose = $('contactClose');
  if (contactClose) contactClose.addEventListener('click', () => toggleContact(false));
  const contactSave = $('contactSave');
  if (contactSave) contactSave.addEventListener('click', () => { persistWelcome(); toggleContact(false); });
  const welcomeContact = $('welcomeContact');
  if (welcomeContact) welcomeContact.addEventListener('click', () => toggleContact(true));
  const tourBtn = $('bTour');
  if (tourBtn) tourBtn.addEventListener('click', () => {
    if (tourBtn.classList.contains('on')) stopTour();
    else startTour();
  });
  const mute = $('bTourMute');
  if (mute) mute.addEventListener('click', () => music.setMuted(!music.isMuted()));
  addEventListener('peakstead-plan-changed', () => {
    fillWelcome();
    renderLevels();
  });
  addEventListener('peakstead-tour-label', (e) => setTourLabel(e.detail));
  addEventListener('peakstead-tour-stop', () => { music.stop(); setTourLabel(null); syncTourBtn(false); });
  addEventListener('peakstead-levels-changed', renderLevels);

  if (shouldAutoWelcome()) {
    // wait until a model is loaded
    const once = () => { showWelcome(); fillWelcome(); renderLevels(); };
    if (window.app && window.app.getRooms && window.app.getRooms().length) once();
    else addEventListener('peakstead-plan-changed', once, { once: true });
  } else {
    hideWelcome();
    renderLevels();
  }
}

export { fillWelcome, renderLevels, hideWelcome as hideClientWelcome, showWelcome as showClientWelcome };
