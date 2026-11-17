// Local dev server: mimics vercel.json (cleanUrls + rewrites) and runs api/router.js.
// Uses a filesystem blob stand-in (LOCAL_BLOB_DIR) and a stub upload client, so no cloud credentials are needed.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.resolve(new URL('..', import.meta.url).pathname);
process.env.LOCAL_BLOB_DIR ||= path.join(root, '.localblob');
process.env.SESSION_SECRET ||= crypto.randomBytes(32).toString('hex');
const { default: handler } = await import('../api/router.js');
const local = await import('../server/local-blob.js');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const STUB = `export async function upload(pathname, file, o) {
  const r = await fetch('/__dev/upload?pathname=' + encodeURIComponent(pathname) + '&ct=' + encodeURIComponent(o.contentType || file.type), { method: 'PUT', body: file });
  if (!r.ok) throw new Error('dev upload failed'); return r.json(); }`;
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  // Secure cookies don't stick on http://localhost in some browsers; strip the flag locally.
  const sh = res.setHeader.bind(res); res.setHeader = (k, v) => sh(k, k.toLowerCase() === 'set-cookie' ? String(v).replace('; Secure', '') : v);
  if (u.pathname.startsWith('/api/')) { req.url = '/api/router?route=' + encodeURIComponent(u.pathname.slice(5)) + (u.search ? '&' + u.search.slice(1) : ''); return handler(req, res); }
  if (u.pathname === '/__dev/upload') {
    const chunks = []; for await (const c of req) chunks.push(c);
    const r = await local.put(u.searchParams.get('pathname'), Buffer.concat(chunks), { addRandomSuffix: true, contentType: u.searchParams.get('ct') });
    res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(r));
  }
  if (u.pathname === '/js/blob-client.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(STUB); }
  let p = u.pathname;
  const m = p.match(/^\/s\/([^/]+)$/); if (m) p = '/share';
  let f = path.join(root, 'public', p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  else if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  if (!fs.existsSync(f)) { res.statusCode = 404; return res.end('not found'); }
  res.setHeader('Content-Type', TYPES[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
}).listen(process.env.PORT || 3000, () => console.log('dev server on', process.env.PORT || 3000));
