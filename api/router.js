import { handleUpload } from '@vercel/blob/client';
import { Readable } from 'node:stream';
import {
  currentUser, emailKey, userPath, newId, hashPassword, checkPassword,
  makeSessionCookie, clearSessionCookie,
} from '../server/auth.js';
import { readJSON, writeJSON, writeJSONIfAbsent, remove, listAll, headBlob, streamBlob } from '../server/store.js';

export const config = { maxDuration: 30 };

const MAX_UPLOAD = 50 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif', 'application/pdf'];
const MODEL_TYPES = ['application/json', 'model/gltf-binary', 'model/gltf+json', 'application/octet-stream'];

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

const publicUser = (u) => ({ id: u.id, email: u.email, createdAt: u.createdAt });
const publicFile = (f) => ({ id: f.id, name: f.name, kind: f.kind, format: f.format || null, contentType: f.contentType, size: f.size, uploadedAt: f.uploadedAt });
function publicProject(p, { owner = false } = {}) {
  const out = {
    id: p.id, name: p.name, notes: p.notes || '', createdAt: p.createdAt, updatedAt: p.updatedAt,
    files: (p.files || []).map(publicFile),
  };
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
    const projects = (await Promise.all(metas.map(m => readJSON(m.pathname)))).filter(Boolean)
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .map(p => publicProject(p, { owner: true }));
    send(res, 200, { projects });
  },
  'POST projects': async (req, res) => {
    requireJson(req);
    const user = await requireUser(req);
    const { name, notes } = await readBody(req);
    const metas = await listAll(`db/projects/${user.id}/`);
    if (metas.length >= 50) throw bad('Project limit reached (50)');
    const now = new Date().toISOString();
    const p = { id: newId(9), owner: user.id, name: cleanText(name, 120).trim() || 'Untitled project', notes: cleanText(notes, 20000), files: [], shareToken: null, createdAt: now, updatedAt: now };
    await writeJSON(projPath(user.id, p.id), p);
    send(res, 201, { project: publicProject(p, { owner: true }) });
  },
  'GET projects/:id': async (req, res, { id }) => {
    const user = await requireUser(req);
    send(res, 200, { project: publicProject(await loadOwnProject(user, id), { owner: true }) });
  },
  'PATCH projects/:id': async (req, res, { id }) => {
    requireJson(req);
    const user = await requireUser(req);
    const p = await loadOwnProject(user, id);
    const body = await readBody(req);
    if (body.name !== undefined) p.name = cleanText(body.name, 120).trim() || 'Untitled project';
    if (body.notes !== undefined) p.notes = cleanText(body.notes, 20000);
    if (body.share === true && !p.shareToken) {
      p.shareToken = newId(18);
      await writeJSON(sharePath(p.shareToken), { uid: user.id, pid: p.id });
    } else if (body.share === false && p.shareToken) {
      await remove(sharePath(p.shareToken)); p.shareToken = null;
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
        const types = cp.kind === 'model' ? MODEL_TYPES : IMAGE_TYPES;
        return { allowedContentTypes: types, maximumSizeInBytes: MAX_UPLOAD, addRandomSuffix: true, allowOverwrite: false };
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
    if (!['image', 'model'].includes(kind)) throw bad('Invalid kind');
    if ((p.files || []).some(f => f.pathname === pathname)) throw bad('Already added');
    if ((p.files || []).length >= 100) throw bad('File limit reached (100 per project)');
    const meta = await headBlob(pathname);
    if (!meta) throw bad('Upload not found');
    const fname = cleanText(name, 160).trim() || pathname.split('/').pop();
    const f = { id: newId(8), pathname, name: fname, kind, contentType: meta.contentType, size: meta.size, uploadedAt: new Date().toISOString() };
    if (kind === 'model') {
      f.format = detectFormat(fname, meta.contentType);
      if (!f.format) { await remove(pathname); throw bad('3D models must be .json (Home View format), .glb or .gltf'); }
      const old = p.files.filter(x => x.kind === 'model');
      await remove(old.map(x => x.pathname));
      p.files = p.files.filter(x => x.kind !== 'model');
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
