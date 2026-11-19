// Top-down lot editor: draw or drag corners (tracing an aerial if one is
// uploaded) and move / rotate the house footprint on the same plan.
import {
  openRing, worldRings, parcelDefaults, lotStats, xfHouse,
} from './parcel.js';

function closeRingSafe(ring) {
  if (ring.length < 3) return ring;
  const a = ring[0], b = ring[ring.length - 1];
  if (a[0] !== b[0] || a[1] !== b[1]) return ring.concat([a.slice()]);
  return ring;
}

export function mountLotEditor(canvas, { getState, onChange, onLive } = {}) {
  const ctx = canvas.getContext('2d');
  let view = { x: 0, y: 0, scale: 2.4 }; // world feet → css pixels (y south is down)
  let mode = 'edit'; // edit | draw | house
  let drawing = [];
  let drag = null;
  let hover = null;
  let dpr = 1;

  function state() { return getState() || {}; }

  function cssSize() {
    const w = Math.max(240, canvas.clientWidth || 320);
    const h = Math.max(240, canvas.clientHeight || 360);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    return { w, h };
  }

  function toScreen(x, y, sz) {
    return [sz.w / 2 + (x - view.x) * view.scale, sz.h / 2 + (y - view.y) * view.scale];
  }
  function toWorld(sx, sy, sz) {
    return [(sx - sz.w / 2) / view.scale + view.x, (sy - sz.h / 2) / view.scale + view.y];
  }

  function parcelWorld(st) {
    const p = parcelDefaults(st.parcel);
    return p ? worldRings(p) : [];
  }

  function fit(force) {
    const sz = cssSize();
    const st = state();
    const bounds = [];
    for (const ring of parcelWorld(st)) for (const pt of openRing(ring)) bounds.push(pt);
    const stats = st.parcel ? lotStats(st.parcel, st.model, st.bounds) : null;
    if (stats) for (const poly of stats.footprint) for (const pt of poly) bounds.push(pt);
    const g = st.ground;
    if (g && g.image && g.image.naturalWidth) {
      const w = g.scale || 200, h = w * (g.image.naturalHeight / g.image.naturalWidth);
      bounds.push([g.x - w / 2, g.y - h / 2], [g.x + w / 2, g.y + h / 2]);
    }
    if (!bounds.length) { if (force) { view.x = 0; view.y = 0; view.scale = 2.4; } return; }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of bounds) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y);
      x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    const pad = 16;
    const spanX = Math.max(20, x1 - x0), spanY = Math.max(20, y1 - y0);
    view.scale = Math.max(0.15, Math.min(12, Math.min((sz.w - pad * 2) / spanX, (sz.h - pad * 2) / spanY)));
    view.x = (x0 + x1) / 2;
    view.y = (y0 + y1) / 2;
  }

  function drawImageNorthUp(g, sz) {
    if (!g?.image?.naturalWidth) return;
    const wFt = g.scale || 200;
    const hFt = wFt * (g.image.naturalHeight / g.image.naturalWidth);
    const [cx, cy] = toScreen(g.x || 0, g.y || 0, sz);
    const rot = ((g.rot || 0) * Math.PI) / 180;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.globalAlpha = 0.92;
    ctx.drawImage(g.image, -wFt * view.scale / 2, -hFt * view.scale / 2, wFt * view.scale, hFt * view.scale);
    ctx.restore();
  }

  function strokeRing(ring, style, dashed) {
    const p = openRing(ring);
    if (p.length < 2) return;
    const sz = cssSize();
    ctx.beginPath();
    p.forEach((pt, i) => {
      const [x, y] = toScreen(pt[0], pt[1], sz);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    if (style.fill) { ctx.fillStyle = style.fill; ctx.fill(); }
    ctx.strokeStyle = style.stroke || '#e0a95a';
    ctx.lineWidth = style.width || 2;
    ctx.setLineDash(dashed ? [7, 5] : []);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function handlesFor(ring, sz) {
    return openRing(ring).map((pt, i) => {
      const [x, y] = toScreen(pt[0], pt[1], sz);
      return { i, x, y, wx: pt[0], wy: pt[1] };
    });
  }

  function redraw() {
    const sz = cssSize();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, sz.w, sz.h);
    // grid
    ctx.fillStyle = '#0d1218';
    ctx.fillRect(0, 0, sz.w, sz.h);
    const st = state();
    drawImageNorthUp(st.ground, sz);

    const step = niceStep(40 / view.scale);
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    ctx.lineWidth = 1;
    const [x0, y0] = toWorld(0, 0, sz), [x1, y1] = toWorld(sz.w, sz.h, sz);
    ctx.beginPath();
    for (let x = Math.floor(x0 / step) * step; x <= x1; x += step) {
      const [sx] = toScreen(x, 0, sz); ctx.moveTo(sx, 0); ctx.lineTo(sx, sz.h);
    }
    for (let y = Math.floor(y0 / step) * step; y <= y1; y += step) {
      const [, sy] = toScreen(0, y, sz); ctx.moveTo(0, sy); ctx.lineTo(sz.w, sy);
    }
    ctx.stroke();
    // north tick
    ctx.fillStyle = '#e0574f';
    ctx.font = '700 11px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', sz.w / 2, 14);

    const p = parcelDefaults(st.parcel);
    const stats = p ? lotStats(p, st.model, st.bounds) : null;
    if (stats) {
      for (const ring of stats.world) strokeRing(ring, { fill: 'rgba(224,169,90,.14)', stroke: '#e0a95a', width: 2 });
      if (stats.hasSetbacks) {
        for (const ring of stats.buildable) strokeRing(ring, { stroke: '#f3e2b8', width: 1.6 }, true);
      }
      ctx.fillStyle = 'rgba(90,140,180,.45)';
      ctx.strokeStyle = '#cfe3f2';
      ctx.lineWidth = 1.5;
      for (const poly of stats.footprint) {
        ctx.beginPath();
        poly.forEach((pt, i) => {
          const [x, y] = toScreen(pt[0], pt[1], sz);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath(); ctx.fill(); ctx.setLineDash([]); ctx.stroke();
      }
      if (mode === 'house' || mode === 'edit') {
        const hx = p.houseX, hy = p.houseY;
        const [cx, cy] = toScreen(hx, hy, sz);
        const [rx, ry] = toScreen(...xfHouse(0, -18, hx, hy, p.houseYaw));
        ctx.strokeStyle = '#f4f1ea';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(rx, ry); ctx.stroke();
        ctx.fillStyle = '#f4f1ea';
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx, ry, 6, 0, Math.PI * 2); ctx.fill();
      }
      if (mode === 'edit') {
        for (const ring of stats.world) {
          for (const h of handlesFor(ring, sz)) {
            ctx.fillStyle = hover && hover.kind === 'corner' && hover.i === h.i ? '#fff' : '#e0a95a';
            ctx.beginPath(); ctx.arc(h.x, h.y, 6, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#1a1e22'; ctx.lineWidth = 1; ctx.stroke();
          }
        }
      }
    }
    if (mode === 'draw' && drawing.length) {
      strokeRing(closeRingSafe(drawing), { stroke: '#8ec8f0', width: 1.8 }, true);
      const [mx, my] = hover && hover.kind === 'cursor' ? [hover.x, hover.y] : [null, null];
      if (mx != null) {
        const last = drawing[drawing.length - 1];
        const [sx, sy] = toScreen(last[0], last[1], sz);
        ctx.strokeStyle = 'rgba(142,200,240,.7)';
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(mx, my); ctx.stroke();
      }
      for (const pt of drawing) {
        const [x, y] = toScreen(pt[0], pt[1], sz);
        ctx.fillStyle = '#8ec8f0';
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    // scale bar
    const barFt = niceStep(80 / view.scale);
    const barPx = barFt * view.scale;
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(10, sz.h - 28, barPx + 16, 18);
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(18, sz.h - 18, barPx, 3);
    ctx.font = '11px system-ui,sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(barFt + ' ft', 18, sz.h - 20);
  }

  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 0.5))));
    const u = raw / p;
    return (u < 2 ? 2 : u < 5 ? 5 : 10) * p;
  }

  function hit(sx, sy, st) {
    const sz = cssSize();
    const p = parcelDefaults(st.parcel);
    if (mode === 'draw') return { kind: 'cursor', x: sx, y: sy };
    if (p && (mode === 'house' || mode === 'edit')) {
      const [rx, ry] = toScreen(...xfHouse(0, -18, p.houseX, p.houseY, p.houseYaw));
      if (Math.hypot(sx - rx, sy - ry) <= 10) return { kind: 'yaw' };
      const [cx, cy] = toScreen(p.houseX, p.houseY, sz);
      if (mode === 'house' && Math.hypot(sx - cx, sy - cy) <= 16) return { kind: 'house' };
      if (mode === 'house') {
        const stats = lotStats(p, st.model, st.bounds);
        for (const poly of stats.footprint) {
          // rough: if inside bbox of poly
          const xs = poly.map(q => { const s = toScreen(q[0], q[1], sz); return s; });
          let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
          for (const [x, y] of xs) { minx = Math.min(minx, x); miny = Math.min(miny, y); maxx = Math.max(maxx, x); maxy = Math.max(maxy, y); }
          if (sx >= minx && sx <= maxx && sy >= miny && sy <= maxy) return { kind: 'house' };
        }
      }
    }
    if (p && mode === 'edit') {
      const world = worldRings(p);
      for (let ri = 0; ri < world.length; ri++) {
        const hs = handlesFor(world[ri], sz);
        for (const h of hs) if (Math.hypot(sx - h.x, sy - h.y) <= 9) return { kind: 'corner', ring: ri, i: h.i };
        // edge insert
        const pts = openRing(world[ri]);
        for (let i = 0; i < pts.length; i++) {
          const a = toScreen(pts[i][0], pts[i][1], sz);
          const b = toScreen(pts[(i + 1) % pts.length][0], pts[(i + 1) % pts.length][1], sz);
          if (distToSeg(sx, sy, a[0], a[1], b[0], b[1]) <= 7) return { kind: 'edge', ring: ri, i };
        }
      }
    }
    return { kind: 'pan' };
  }

  function distToSeg(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function worldFromEvent(e) {
    const sz = cssSize();
    const r = canvas.getBoundingClientRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;
    return { sx, sy, w: toWorld(sx, sy, sz), sz };
  }

  function inverseWorldPoint(wx, wy, parcel) {
    // world = offset + R * local  →  local = R^T * (world - offset)
    const rot = ((parcel.rot || 0) * Math.PI) / 180;
    const c = Math.cos(rot), si = Math.sin(rot);
    const dx = wx - (parcel.x || 0), dy = wy - (parcel.y || 0);
    return [dx * c + dy * si, -dx * si + dy * c];
  }

  function emit(parcel, live) {
    const next = parcelDefaults(parcel);
    if (live) onLive?.(next); else onChange?.(next);
  }

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture?.(e.pointerId);
    const st = state();
    const { sx, sy, w } = worldFromEvent(e);
    if (mode === 'draw') {
      if (drawing.length >= 3 && Math.hypot(w[0] - drawing[0][0], w[1] - drawing[0][1]) * view.scale <= 10) {
        finishDraw();
        return;
      }
      drawing.push(w);
      redraw();
      return;
    }
    const h = hit(sx, sy, st);
    hover = h;
    if (h.kind === 'corner') {
      drag = { kind: 'corner', ring: h.ring, i: h.i };
    } else if (h.kind === 'edge') {
      const p = parcelDefaults(st.parcel);
      const world = worldRings(p);
      const local = world[h.ring].map(pt => inverseWorldPoint(pt[0], pt[1], p));
      const open = openRing(closeRingSafe(local));
      const [lx, ly] = inverseWorldPoint(w[0], w[1], p);
      open.splice(h.i + 1, 0, [lx, ly]);
      const rings = p.rings.map((r, i) => i === h.ring ? closeRingSafe(open) : r);
      const next = { ...p, rings };
      emit(next, true);
      drag = { kind: 'corner', ring: h.ring, i: h.i + 1 };
    } else if (h.kind === 'house') {
      const p = parcelDefaults(st.parcel);
      drag = { kind: 'house', dx: w[0] - p.houseX, dy: w[1] - p.houseY };
    } else if (h.kind === 'yaw') {
      drag = { kind: 'yaw' };
    } else {
      drag = { kind: 'pan', x: view.x, y: view.y, sx, sy };
    }
    redraw();
  });

  canvas.addEventListener('pointermove', (e) => {
    const st = state();
    const { sx, sy, w } = worldFromEvent(e);
    if (!drag) {
      hover = hit(sx, sy, st);
      if (mode === 'draw') hover = { kind: 'cursor', x: sx, y: sy };
      canvas.style.cursor = cursorFor(hover);
      if (mode === 'draw') redraw();
      return;
    }
    const p = parcelDefaults(st.parcel) || { rings: [], rot: 0, x: 0, y: 0 };
    if (drag.kind === 'pan') {
      view.x = drag.x - (sx - drag.sx) / view.scale;
      view.y = drag.y - (sy - drag.sy) / view.scale;
      redraw();
      return;
    }
    if (drag.kind === 'corner') {
      const world = worldRings(p);
      const local = openRing(world[drag.ring] || []).map(pt => inverseWorldPoint(pt[0], pt[1], p));
      if (local[drag.i]) local[drag.i] = inverseWorldPoint(w[0], w[1], p);
      const rings = p.rings.map((r, i) => i === drag.ring ? closeRingSafe(local) : r);
      emit({ ...p, rings }, true);
    } else if (drag.kind === 'house') {
      emit({ ...p, houseX: w[0] - drag.dx, houseY: w[1] - drag.dy }, true);
    } else if (drag.kind === 'yaw') {
      const ang = Math.atan2(w[0] - p.houseX, -(w[1] - p.houseY)) * 180 / Math.PI;
      // handle is at house-local (0, -18) = 18 ft north; yaw clockwise from north
      emit({ ...p, houseYaw: (ang + 360) % 360 }, true);
    }
    redraw();
  });

  function endDrag(commit) {
    if (drag && drag.kind !== 'pan' && commit) {
      const st = state();
      if (st.parcel) emit(st.parcel, false);
    }
    drag = null;
  }
  canvas.addEventListener('pointerup', () => endDrag(true));
  canvas.addEventListener('pointercancel', () => endDrag(false));

  canvas.addEventListener('dblclick', (e) => {
    if (mode !== 'edit') return;
    const st = state();
    const { sx, sy } = worldFromEvent(e);
    const h = hit(sx, sy, st);
    if (h.kind !== 'corner') return;
    const p = parcelDefaults(st.parcel);
    const local = openRing(worldRings(p)[h.ring] || []).map(pt => inverseWorldPoint(pt[0], pt[1], p));
    if (local.length <= 3) return;
    local.splice(h.i, 1);
    const rings = p.rings.map((r, i) => i === h.ring ? closeRingSafe(local) : r);
    emit({ ...p, rings }, false);
    redraw();
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const { sx, sy, w } = worldFromEvent(e);
    const next = Math.max(0.12, Math.min(20, view.scale * (e.deltaY > 0 ? 0.9 : 1.11)));
    const sz = cssSize();
    // keep point under cursor
    view.scale = next;
    const w2 = toWorld(sx, sy, sz);
    view.x += w[0] - w2[0];
    view.y += w[1] - w2[1];
    redraw();
  }, { passive: false });

  function cursorFor(h) {
    if (!h) return 'crosshair';
    if (h.kind === 'corner' || h.kind === 'edge') return 'pointer';
    if (h.kind === 'house') return 'move';
    if (h.kind === 'yaw') return 'grab';
    if (h.kind === 'pan') return 'grab';
    return 'crosshair';
  }

  function setMode(m) {
    mode = m;
    if (m !== 'draw') drawing = [];
    if (m === 'draw' && !drawing.length) drawing = [];
    canvas.style.cursor = m === 'draw' ? 'crosshair' : 'grab';
    redraw();
  }

  function finishDraw() {
    if (drawing.length < 3) return false;
    const st = state();
    const cur = parcelDefaults(st.parcel) || { rot: 0, x: 0, y: 0, houseX: 0, houseY: 0, houseYaw: 0, setbackF: 0, setbackS: 0, setbackR: 0, front: 's' };
    const ring = closeRingSafe(drawing);
    const next = { ...cur, rings: [ring], rot: 0, x: 0, y: 0, sourceName: cur.sourceName || 'drawn' };
    drawing = [];
    mode = 'edit';
    emit(next, false);
    redraw();
    return true;
  }

  function cancelDraw() {
    drawing = [];
    mode = 'edit';
    redraw();
  }

  const ro = new ResizeObserver(() => redraw());
  ro.observe(canvas);
  fit(true);
  redraw();

  return {
    redraw, fit, setMode, finishDraw, cancelDraw,
    getMode: () => mode,
    destroy() { ro.disconnect(); },
  };
}
