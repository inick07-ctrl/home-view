import { handleUpload } from '@vercel/blob/client';
import { Readable } from 'node:stream';
import {
  currentUser, emailKey, userPath, newId, hashPassword, checkPassword,
  makeSessionCookie, clearSessionCookie,
} from '../server/auth.js';
import { readJSON, writeJSON, writeJSONIfAbsent, remove, listAll, headBlob, streamBlob } from '../server/store.js';
import { getExample, resolvedExampleName } from '../server/examples.js';
import {
  sanitizeBuildType, isAdmin, contactEmail,
  sanitizeSponsor, publicSponsor, sanitizeInquiry,
} from '../server/sponsors.js';

export const config = { maxDuration: 30 };

const MAX_UPLOAD = 50 * 1024 * 1024;
const SITE_MAX_UPLOAD = 25 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif', 'application/pdf'];
const SITE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MODEL_TYPES = ['application/json', 'model/gltf-binary', 'model/gltf+json', 'application/octet-stream'];
const SITE_KINDS = ['pano', 'ground'];

const projPath = (uid, pid) => `db/projects/${uid}/${pid}.json`;
const sharePath = (t) => `db/shares/${t}.json`;
const ID_RE = /^[A-Za-z0-9_-]{6,40}$/;

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const bad = (msg) => new HttpError(400, msg);

function send(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body || '{}'); } catch { throw bad('Invalid JSON'); } }
  const chunks = []; for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw bad('Invalid JSON'); }
}

// Mutating requests must be JSON: browsers can't send that cross-site without a CORS preflight we never approve.
function requireJson(req) {
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) throw new HttpError(415, 'Expected application/json');
}

async function requireUser(req) {
  const u = await currentUser(req);
  if (!u) throw new HttpError(401, 'Please log in');
  return u;
}
async function requireAdmin(req) {
  const u = await requireUser(req);
  if (!isAdmin(u)) throw new HttpError(403, 'Admin only');
  return u;
}

const publicUser = (u) => ({ id: u.id, email: u.email, createdAt: u.createdAt, admin: isAdmin(u) });
const publicFile = (f) => ({ id: f.id, name: f.name, kind: f.kind, format: f.format || null, contentType: f.contentType, size: f.size, uploadedAt: f.uploadedAt });
function clampNum(v, lo, hi, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
}
function wrapDeg(v, fallback = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return ((n % 360) + 360) % 360;
}
function publicSite(p) {
  const site = p.site || {};
  const files = p.files || [];
  const pano = files.find(f => f.kind === 'pano');
  const ground = files.find(f => f.kind === 'ground');
  return {
    pano: pano ? {
      fileId: pano.id,
      yaw: wrapDeg(site.panoYaw, 0),
      height: clampNum(site.panoHeight, -20, 120, 6),
    } : null,
    ground: ground ? {
      fileId: ground.id,
      scale: clampNum(site.groundScale, 20, 2000, 200),
      rot: wrapDeg(site.groundRot, 0),
      x: clampNum(site.groundX, -2000, 2000, 0),
      y: clampNum(site.groundY, -2000, 2000, 0),
    } : null,
    parcel: site.parcel ? publicParcel(site.parcel) : null,
  };
}
function optCoord(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function publicParcel(parcel) {
  const front = String(parcel.front || 's').toLowerCase();
  return {
    rings: parcel.rings,
    rot: wrapDeg(parcel.rot, 0),
    x: clampNum(parcel.x, -2000, 2000, 0),
    y: clampNum(parcel.y, -2000, 2000, 0),
    anchorLat: optCoord(parcel.anchorLat),
    anchorLon: optCoord(parcel.anchorLon),
    sourceName: String(parcel.sourceName || '').slice(0, 160),
    houseX: clampNum(parcel.houseX, -2000, 2000, 0),
    houseY: clampNum(parcel.houseY, -2000, 2000, 0),
    houseYaw: wrapDeg(parcel.houseYaw, 0),
    setbackF: clampNum(parcel.setbackF, 0, 200, 0),
    setbackS: clampNum(parcel.setbackS, 0, 200, 0),
    setbackR: clampNum(parcel.setbackR, 0, 200, 0),
    front: /^[nesw]$/.test(front) ? front : 's',
  };
}
function sanitizeParcel(raw) {
  if (raw === null) return null;
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.rings)) throw bad('Invalid parcel');
  if (!raw.rings.length) throw bad('Parcel is missing coordinates');
  if (raw.rings.length > 20) throw bad('Too many parcel rings');
  const rings = raw.rings.map(ring => {
    if (!Array.isArray(ring) || ring.length < 3 || ring.length > 500) throw bad('Each parcel ring needs 3–500 points');
    const pts = ring.map(pt => {
      if (!Array.isArray(pt) || pt.length < 2) throw bad('Invalid parcel point');
      const x = clampNum(pt[0], -50000, 50000, NaN);
      const y = clampNum(pt[1], -50000, 50000, NaN);
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw bad('Invalid parcel point');
      return [x, y];
    });
    return pts;
  });
  const front = String(raw.front || 's').toLowerCase();
  return {
    rings,
    rot: wrapDeg(raw.rot, 0),
    x: clampNum(raw.x, -2000, 2000, 0),
    y: clampNum(raw.y, -2000, 2000, 0),
    anchorLat: optCoord(raw.anchorLat),
    anchorLon: optCoord(raw.anchorLon),
    sourceName: cleanText(raw.sourceName, 160),
    houseX: clampNum(raw.houseX, -2000, 2000, 0),
    houseY: clampNum(raw.houseY, -2000, 2000, 0),
    houseYaw: wrapDeg(raw.houseYaw, 0),
    setbackF: clampNum(raw.setbackF, 0, 200, 0),
    setbackS: clampNum(raw.setbackS, 0, 200, 0),
    setbackR: clampNum(raw.setbackR, 0, 200, 0),
    front: /^[nesw]$/.test(front) ? front : 's',
  };
}
function applySitePatch(prev, patch) {
  if (!patch || typeof patch !== 'object') throw bad('Invalid site settings');
  const next = { ...(prev || {}) };
  if (patch.panoYaw !== undefined) next.panoYaw = wrapDeg(patch.panoYaw, 0);
  if (patch.panoHeight !== undefined) next.panoHeight = clampNum(patch.panoHeight, -20, 120, 6);
  if (patch.groundScale !== undefined) next.groundScale = clampNum(patch.groundScale, 20, 2000, 200);
  if (patch.groundRot !== undefined) next.groundRot = wrapDeg(patch.groundRot, 0);
  if (patch.groundX !== undefined) next.groundX = clampNum(patch.groundX, -2000, 2000, 0);
  if (patch.groundY !== undefined) next.groundY = clampNum(patch.groundY, -2000, 2000, 0);
  if (patch.parcel !== undefined) next.parcel = sanitizeParcel(patch.parcel);
  return next;
}
async function persistExampleNameIfStale(p) {
  const next = resolvedExampleName(p);
  if (next !== p.name && p.owner && p.id) {
    p.name = next;
    await writeJSON(projPath(p.owner, p.id), p);
  }
  return p;
}


function sanitizeLayout(raw) {
  if (raw === null) return null;
  if (!raw || typeof raw !== 'object') return undefined;
  const num = (v, lo, hi) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null;
  };
  const items = Array.isArray(raw.items) ? raw.items.slice(0, 400).map((it) => {
    if (!it || typeof it !== 'object' || typeof it.type !== 'string') return null;
    const x = num(it.x, -500, 500), y = num(it.y, -500, 500);
    if (x == null || y == null) return null;
    const rec = {
      id: String(it.id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || undefined,
      type: String(it.type).slice(0, 40),
      x, y,
      rot: num(it.rot, -3600, 3600) ?? 0,
      w: num(it.w, 0.2, 40) ?? undefined,
      d: num(it.d, 0.2, 40) ?? undefined,
    };
    if (it.finish) rec.finish = String(it.finish).slice(0, 24);
    if (it.variant) rec.variant = String(it.variant).slice(0, 24);
    if (it.wood) rec.wood = String(it.wood).slice(0, 24);
    if (it.chaise) rec.chaise = String(it.chaise).slice(0, 12);
    return rec;
  }).filter(Boolean) : undefined;
  const rooms = Array.isArray(raw.rooms) ? raw.rooms.slice(0, 200).map((r) => {
    if (!Array.isArray(r) || r.length < 7) return null;
    const x0 = num(r[3], -500, 500), y0 = num(r[4], -500, 500), x1 = num(r[5], -500, 500), y1 = num(r[6], -500, 500);
    if (x0 == null || y0 == null || x1 == null || y1 == null) return null;
    const opts = r[7] && typeof r[7] === 'object' ? {
      outside: !!r[7].outside, minor: !!r[7].minor, noLabel: !!r[7].noLabel, noFloor: !!r[7].noFloor, vaulted: !!r[7].vaulted,
    } : {};
    return [String(r[0] || 'Room').slice(0, 60), String(r[1] || '').slice(0, 40), String(r[2] || 'wood').slice(0, 24), x0, y0, x1, y1, opts];
  }).filter(Boolean) : undefined;
  let walls;
  if (raw.walls && typeof raw.walls === 'object') {
    walls = {};
    for (const k of ['ext', 'int', 'win', 'door', 'counter']) {
      const list = raw.walls[k];
      if (!Array.isArray(list)) continue;
      walls[k] = list.slice(0, 2000).filter((r) => Array.isArray(r) && r.length >= 4 && r.slice(0, 4).every((n) => Number.isFinite(Number(n)))).map((r) => r.slice(0, 8).map((n, i) => (i < 4 || typeof n === 'number') ? n : n));
    }
  }
  if (!items && !rooms && !walls) return undefined;
  return { version: 1, items, rooms, walls };
}

function publicProject(p, { owner = false } = {}) {
  const out = {
    id: p.id, name: resolvedExampleName(p), notes: p.notes || '', createdAt: p.createdAt, updatedAt: p.updatedAt,
    files: (p.files || []).map(publicFile),
    site: publicSite(p),
    buildType: sanitizeBuildType(p.buildType),
  };
  if (p.exampleId) out.exampleId = p.exampleId;
  if (p.layout) out.layout = p.layout;
  if (owner) out.shareToken = p.shareToken || null;
  return out;
}

const cleanText = (s, max) => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, max);

async function loadOwnProject(user, pid) {
  if (!ID_RE.test(pid || '')) throw new HttpError(404, 'Project not found');
  const p = await readJSON(projPath(user.id, pid));
  if (!p || p.owner !== user.id) throw new HttpError(404, 'Project not found');
  return p;
}

async function deleteProjectData(uid, p) {
  await remove((p.files || []).map(f => f.pathname));
  if (p.shareToken) await remove(sharePath(p.shareToken));
  await remove(projPath(uid, p.id));
}

function detectFormat(name, contentType) {
  const n = name.toLowerCase();
  if (n.endsWith('.glb')) return 'glb';
  if (n.endsWith('.gltf')) return 'gltf';
  if (n.endsWith('.json') || contentType === 'application/json') return 'json';
  return null;
}

async function streamFile(res, f) {
  const r = await streamBlob(f.pathname);
  if (!r) throw new HttpError(404, 'File not found');
  res.statusCode = 200;
  res.setHeader('Content-Type', r.blob.contentType || f.contentType || 'application/octet-stream');
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(f.name)}"`);
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox");
  Readable.fromWeb(r.stream).pipe(res);
}

const advertiseHits = new Map();
function allowAdvertise(ip) {
  const now = Date.now();
  const key = ip || 'unknown';
  const recent = (advertiseHits.get(key) || []).filter(t => now - t < 30 * 60 * 1000);
  if (recent.length >= 5) { advertiseHits.set(key, recent); return false; }
  recent.push(now);
  advertiseHits.set(key, recent);
  return true;
}

const routes = {
  // ---------- auth ----------
  'POST auth/signup': async (req, res) => {
    requireJson(req);
    const { email, password } = await readBody(req);
    const e = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 200) throw bad('Enter a valid email address');
    if (typeof password !== 'string' || password.length < 8 || password.length > 200) throw bad('Password must be at least 8 characters');
    const ek = emailKey(e);
    const user = { id: newId(), ek, email: e, passHash: await hashPassword(password), sv: 0, createdAt: new Date().toISOString() };
    const created = await writeJSONIfAbsent(userPath(ek), user);
    if (!created) throw new HttpError(409, 'An account with that email already exists. Try logging in.');
    send(res, 201, { user: publicUser(user) }, { 'Set-Cookie': makeSessionCookie(user) });
  },
  'POST auth/login': async (req, res) => {
    requireJson(req);
    const { email, password } = await readBody(req);
    const user = await readJSON(userPath(emailKey(email || '')));
    const ok = user && typeof password === 'string' && await checkPassword(password, user.passHash);
    if (!ok) throw new HttpError(401, 'Wrong email or password');
    send(res, 200, { user: publicUser(user) }, { 'Set-Cookie': makeSessionCookie(user) });
  },
  'POST auth/logout': async (req, res) => {
    send(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
  },
  'GET auth/me': async (req, res) => {
    const u = await currentUser(req);
    send(res, 200, { user: u ? publicUser(u) : null });
  },
  'POST account/delete': async (req, res) => {
    requireJson(req);
    const user = await requireUser(req);
    const { password } = await readBody(req);
    if (typeof password !== 'string' || !(await checkPassword(password, user.passHash))) throw new HttpError(401, 'Wrong password');
    const metas = await listAll(`db/projects/${user.id}/`);
    for (const m of metas) { const p = await readJSON(m.pathname); if (p) await deleteProjectData(user.id, p); }
    const leftovers = await listAll(`files/${user.id}/`);
    await remove(leftovers.map(b => b.pathname));
    await remove(userPath(user.ek));
    send(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
  },

  // ---------- projects ----------
  'GET projects': async (req, res) => {
    const user = await requireUser(req);
    const metas = await listAll(`db/projects/${user.id}/`);
    const raw = (await Promise.all(metas.map(m => readJSON(m.pathname)))).filter(Boolean);
    await Promise.all(raw.map(p => persistExampleNameIfStale(p)));
    const projects = raw
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .map(p => publicProject(p, { owner: true }));
    send(res, 200, { projects });
  },
  'POST projects': async (req, res) => {
    requireJson(req);
    const user = await requireUser(req);
    const { name, notes, buildType } = await readBody(req);
    const metas = await listAll(`db/projects/${user.id}/`);
    if (metas.length >= 50) throw bad('Project limit reached (50)');
    const now = new Date().toISOString();
    const p = { id: newId(9), owner: user.id, name: cleanText(name, 120).trim() || 'Untitled project', notes: cleanText(notes, 20000), files: [], shareToken: null, buildType: sanitizeBuildType(buildType), createdAt: now, updatedAt: now };
    await writeJSON(projPath(user.id, p.id), p);
    send(res, 201, { project: publicProject(p, { owner: true }) });
  },
  'POST projects/from-example': async (req, res) => {
    requireJson(req);
    const user = await requireUser(req);
    const { exampleId } = await readBody(req);
    const ex = getExample(exampleId);
    if (!ex) throw bad('Unknown example');
    const metas = await listAll(`db/projects/${user.id}/`);
    const existing = (await Promise.all(metas.map(m => readJSON(m.pathname)))).filter(Boolean);
    const already = existing.find(p => p.exampleId === ex.id);
    if (already) {
      send(res, 200, { project: publicProject(already, { owner: true }), alreadySaved: true });
      return;
    }
    if (metas.length >= 50) throw bad('Project limit reached (50)');
    const now = new Date().toISOString();
    const p = {
      id: newId(9), owner: user.id, name: ex.name, notes: '', files: [],
      shareToken: null, exampleId: ex.id, buildType: sanitizeBuildType(ex.type), createdAt: now, updatedAt: now,
    };
    await writeJSON(projPath(user.id, p.id), p);
    send(res, 201, { project: publicProject(p, { owner: true }), alreadySaved: false });
  },
  'GET projects/:id': async (req, res, { id }) => {
    const user = await requireUser(req);
    const p = await loadOwnProject(user, id);
    await persistExampleNameIfStale(p);
    send(res, 200, { project: publicProject(p, { owner: true }) });
  },
  'PATCH projects/:id': async (req, res, { id }) => {
    requireJson(req);
    const user = await requireUser(req);
    const p = await loadOwnProject(user, id);
    const body = await readBody(req);
    if (body.name !== undefined) p.name = cleanText(body.name, 120).trim() || 'Untitled project';
    else p.name = resolvedExampleName(p);
    if (body.notes !== undefined) p.notes = cleanText(body.notes, 20000);
    if (body.buildType !== undefined) p.buildType = sanitizeBuildType(body.buildType);
    if (body.share === true && !p.shareToken) {
      p.shareToken = newId(18);
      await writeJSON(sharePath(p.shareToken), { uid: user.id, pid: p.id });
    } else if (body.share === false && p.shareToken) {
      await remove(sharePath(p.shareToken)); p.shareToken = null;
    }
    if (body.site !== undefined) p.site = applySitePatch(p.site, body.site);
    if (body.layout !== undefined) {
      if (body.layout === null) delete p.layout;
      else {
        const layout = sanitizeLayout(body.layout);
        if (layout === undefined) throw bad('Invalid layout');
        p.layout = layout;
      }
    }
    p.updatedAt = new Date().toISOString();
    await writeJSON(projPath(user.id, p.id), p);
    send(res, 200, { project: publicProject(p, { owner: true }) });
  },
  'DELETE projects/:id': async (req, res, { id }) => {
    const user = await requireUser(req);
    const p = await loadOwnProject(user, id);
    await deleteProjectData(user.id, p);
    send(res, 200, { ok: true });
  },

  // ---------- uploads ----------
  // Step 1: the browser asks for a short-lived client token (only for its own project folder).
  'POST upload': async (req, res) => {
    requireJson(req);
    const user = await requireUser(req);
    const body = await readBody(req);
    const result = await handleUpload({
      body, request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let cp = {}; try { cp = JSON.parse(clientPayload || '{}'); } catch {}
        const p = await loadOwnProject(user, cp.pid);
        if (!pathname.startsWith(`files/${user.id}/${p.id}/`) || pathname.includes('..')) throw bad('Invalid upload path');
        const isSite = SITE_KINDS.includes(cp.kind);
        const types = cp.kind === 'model' ? MODEL_TYPES : (isSite ? SITE_IMAGE_TYPES : IMAGE_TYPES);
        return { allowedContentTypes: types, maximumSizeInBytes: isSite ? SITE_MAX_UPLOAD : MAX_UPLOAD, addRandomSuffix: true, allowOverwrite: false };
      },
    });
    send(res, 200, result);
  },
  // Step 2: after the browser uploads, it registers the blob on the project.
  'POST projects/:id/files': async (req, res, { id }) => {
    requireJson(req);
    const user = await requireUser(req);
    const p = await loadOwnProject(user, id);
    const { pathname, name, kind } = await readBody(req);
    if (typeof pathname !== 'string' || !pathname.startsWith(`files/${user.id}/${p.id}/`) || pathname.includes('..')) throw bad('Invalid file');
    if (!['image', 'model', 'pano', 'ground'].includes(kind)) throw bad('Invalid kind');
    if ((p.files || []).some(f => f.pathname === pathname)) throw bad('Already added');
    if ((p.files || []).length >= 100) throw bad('File limit reached (100 per project)');
    const meta = await headBlob(pathname);
    if (!meta) throw bad('Upload not found');
    const fname = cleanText(name, 160).trim() || pathname.split('/').pop();
    const f = { id: newId(8), pathname, name: fname, kind, contentType: meta.contentType, size: meta.size, uploadedAt: new Date().toISOString() };
    if (kind === 'model') {
      f.format = detectFormat(fname, meta.contentType);
      if (!f.format) { await remove(pathname); throw bad('3D models must be .json (PeakStead Designs format), .glb or .gltf'); }
      const old = p.files.filter(x => x.kind === 'model');
      await remove(old.map(x => x.pathname));
      p.files = p.files.filter(x => x.kind !== 'model');
    } else if (SITE_KINDS.includes(kind)) {
      if (!SITE_IMAGE_TYPES.includes(meta.contentType)) { await remove(pathname); throw bad('Site photos must be a JPG, PNG or WebP image'); }
      if (meta.size > SITE_MAX_UPLOAD) { await remove(pathname); throw bad('Site photos must be 25 MB or smaller'); }
      const old = p.files.filter(x => x.kind === kind);
      await remove(old.map(x => x.pathname));
      p.files = p.files.filter(x => x.kind !== kind);
      p.site = p.site || {};
      if (kind === 'pano') {
        if (p.site.panoYaw === undefined) p.site.panoYaw = 0;
        if (p.site.panoHeight === undefined) p.site.panoHeight = 6;
      } else {
        if (p.site.groundScale === undefined) p.site.groundScale = 200;
        if (p.site.groundRot === undefined) p.site.groundRot = 0;
        if (p.site.groundX === undefined) p.site.groundX = 0;
        if (p.site.groundY === undefined) p.site.groundY = 0;
      }
    } else if (!IMAGE_TYPES.includes(meta.contentType)) { await remove(pathname); throw bad('Unsupported image type'); }
    p.files.push(f);
    p.updatedAt = new Date().toISOString();
    await writeJSON(projPath(user.id, p.id), p);
    send(res, 201, { project: publicProject(p, { owner: true }) });
  },
  'DELETE projects/:id/files/:fid': async (req, res, { id, fid }) => {
    const user = await requireUser(req);
    const p = await loadOwnProject(user, id);
    const f = (p.files || []).find(x => x.id === fid);
    if (!f) throw new HttpError(404, 'File not found');
    await remove(f.pathname);
    p.files = p.files.filter(x => x.id !== fid);
    p.updatedAt = new Date().toISOString();
    await writeJSON(projPath(user.id, p.id), p);
    send(res, 200, { project: publicProject(p, { owner: true }) });
  },
  'GET projects/:id/files/:fid': async (req, res, { id, fid }) => {
    const user = await requireUser(req);
    const p = await loadOwnProject(user, id);
    const f = (p.files || []).find(x => x.id === fid);
    if (!f) throw new HttpError(404, 'File not found');
    await streamFile(res, f);
  },

  // ---------- public share links (read-only) ----------
  'GET share/:token': async (req, res, { token }) => {
    const p = await loadShared(token);
    send(res, 200, { project: publicProject(p) });
  },
  'GET share/:token/files/:fid': async (req, res, { token, fid }) => {
    const p = await loadShared(token);
    const f = (p.files || []).find(x => x.id === fid);
    if (!f) throw new HttpError(404, 'File not found');
    await streamFile(res, f);
  },

  // ---------- sponsors (public read of active only; admin write) ----------
  'GET sponsors': async (req, res) => {
    const metas = await listAll('db/sponsors/');
    const all = (await Promise.all(metas.map(m => readJSON(m.pathname)))).filter(Boolean);
    const sponsors = all.filter(s => s && s.active).map(publicSponsor);
    send(res, 200, { sponsors });
  },
  'GET advertise': async (req, res) => {
    send(res, 200, { contactEmail: contactEmail() || null });
  },
  'POST advertise': async (req, res) => {
    requireJson(req);
    const body = await readBody(req);
    if (body.website) { // honeypot
      send(res, 201, { ok: true });
      return;
    }
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    if (!allowAdvertise(ip)) throw new HttpError(429, 'Please wait a little before sending another message.');
    const inquiry = sanitizeInquiry(body);
    const now = new Date().toISOString();
    const rec = { id: newId(8), ...inquiry, createdAt: now };
    await writeJSON(`db/advertise/${rec.id}.json`, rec);
    send(res, 201, { ok: true });
  },
  'GET admin/sponsors': async (req, res) => {
    await requireAdmin(req);
    const metas = await listAll('db/sponsors/');
    const sponsors = (await Promise.all(metas.map(m => readJSON(m.pathname)))).filter(Boolean)
      .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
    send(res, 200, { sponsors });
  },
  'POST admin/sponsors': async (req, res) => {
    requireJson(req);
    await requireAdmin(req);
    const body = await readBody(req);
    const now = new Date().toISOString();
    const fields = sanitizeSponsor(body);
    const s = { id: newId(8), ...fields, createdAt: now, updatedAt: now };
    await writeJSON(`db/sponsors/${s.id}.json`, s);
    send(res, 201, { sponsor: s });
  },
  'PATCH admin/sponsors/:id': async (req, res, { id }) => {
    requireJson(req);
    await requireAdmin(req);
    if (!ID_RE.test(id || '')) throw new HttpError(404, 'Sponsor not found');
    const prev = await readJSON(`db/sponsors/${id}.json`);
    if (!prev) throw new HttpError(404, 'Sponsor not found');
    const body = await readBody(req);
    const fields = sanitizeSponsor(body, { partial: true, prev });
    const s = { ...prev, ...fields, id: prev.id, createdAt: prev.createdAt, updatedAt: new Date().toISOString() };
    await writeJSON(`db/sponsors/${s.id}.json`, s);
    send(res, 200, { sponsor: s });
  },
  'DELETE admin/sponsors/:id': async (req, res, { id }) => {
    await requireAdmin(req);
    if (!ID_RE.test(id || '')) throw new HttpError(404, 'Sponsor not found');
    const prev = await readJSON(`db/sponsors/${id}.json`);
    if (!prev) throw new HttpError(404, 'Sponsor not found');
    await remove(`db/sponsors/${id}.json`);
    send(res, 200, { ok: true });
  },
  'GET admin/inquiries': async (req, res) => {
    await requireAdmin(req);
    const metas = await listAll('db/advertise/');
    const inquiries = (await Promise.all(metas.map(m => readJSON(m.pathname)))).filter(Boolean)
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, 200);
    send(res, 200, { inquiries });
  },
};

async function loadShared(token) {
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token || '')) throw new HttpError(404, 'This share link is not active');
  const s = await readJSON(sharePath(token));
  if (!s) throw new HttpError(404, 'This share link is not active');
  const p = await readJSON(projPath(s.uid, s.pid));
  if (!p || p.shareToken !== token) throw new HttpError(404, 'This share link is not active');
  return p;
}

const compiled = Object.entries(routes).map(([key, fn]) => {
  const [method, pattern] = key.split(' ');
  const names = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, n) => { names.push(n); return '([^/]+)'; }) + '$');
  return { method, re, names, fn };
});

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://x');
    let route = url.searchParams.get('route') || url.pathname.replace(/^\/api\/?/, '');
    route = route.replace(/^\/+|\/+$/g, '');
    for (const r of compiled) {
      if (r.method !== req.method) continue;
      const m = route.match(r.re); if (!m) continue;
      const params = Object.fromEntries(r.names.map((n, i) => [n, decodeURIComponent(m[i + 1])]));
      return await r.fn(req, res, params);
    }
    throw new HttpError(404, 'Not found');
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error(e);
    if (!res.headersSent) send(res, status, { error: status >= 500 ? 'Something went wrong. Please try again.' : e.message });
    else res.end();
  }
}
