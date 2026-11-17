// Filesystem stand-in for @vercel/blob, used only by scripts/dev-server.mjs (LOCAL_BLOB_DIR).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const dir = () => process.env.LOCAL_BLOB_DIR;
const fp = (p) => path.join(dir(), p.replace(/^\/+/, ''));
const meta = (p) => { const st = fs.statSync(fp(p)); let ct = 'application/octet-stream'; try { ct = fs.readFileSync(fp(p) + '.ct', 'utf8'); } catch {} return { pathname: p, size: st.size, contentType: ct, uploadedAt: st.mtime, url: 'local:' + p, etag: String(st.mtimeMs) }; };
export async function put(p, body, o = {}) {
  if (o.addRandomSuffix) { const ext = path.extname(p); p = p.slice(0, p.length - ext.length) + '-' + crypto.randomBytes(6).toString('hex') + ext; }
  if (!o.allowOverwrite && fs.existsSync(fp(p))) throw new Error('Vercel Blob: This blob already exists');
  fs.mkdirSync(path.dirname(fp(p)), { recursive: true });
  fs.writeFileSync(fp(p), typeof body === 'string' ? body : Buffer.from(body));
  fs.writeFileSync(fp(p) + '.ct', o.contentType || 'application/octet-stream');
  return { pathname: p, url: 'local:' + p };
}
export async function get(p) {
  if (!fs.existsSync(fp(p))) return null;
  const m = meta(p);
  return { statusCode: 200, stream: new Response(fs.readFileSync(fp(p))).body, headers: new Headers(), blob: m };
}
export async function head(p) { if (!fs.existsSync(fp(p))) throw new Error('not found'); return meta(p); }
export async function del(ps) { for (const p of [].concat(ps)) { fs.rmSync(fp(p), { force: true }); fs.rmSync(fp(p) + '.ct', { force: true }); } }
export async function list({ prefix }) {
  const out = []; const base = dir();
  const walk = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (!f.endsWith('.ct')) { const rel = path.relative(base, f); if (rel.startsWith(prefix)) out.push(meta(rel)); } } };
  walk(base);
  return { blobs: out, hasMore: false };
}
