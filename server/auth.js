import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { readJSON } from './store.js';

const COOKIE = 'hm_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET is not configured');
  return s;
}
const b64u = (buf) => Buffer.from(buf).toString('base64url');
const sign = (data) => crypto.createHmac('sha256', secret()).update(data).digest('base64url');

export const emailKey = (email) => crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex');
export const userPath = (ek) => `db/users/${ek}.json`;
export const newId = (n = 12) => crypto.randomBytes(n).toString('base64url');

export const hashPassword = (pw) => bcrypt.hash(pw, 11);
export const checkPassword = (pw, hash) => bcrypt.compare(pw, hash);

export function makeSessionCookie(user) {
  const payload = b64u(JSON.stringify({ u: user.id, e: user.ek, v: user.sv || 0, x: Math.floor(Date.now() / 1000) + MAX_AGE }));
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}
export const clearSessionCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('='); if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

// Returns the user record for a valid session, or null.
export async function currentUser(req) {
  const tok = parseCookies(req.headers.cookie)[COOKIE];
  if (!tok || !tok.includes('.')) return null;
  const [payload, sig] = tok.split('.');
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  let p; try { p = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { return null; }
  if (!p || p.x < Date.now() / 1000) return null;
  const user = await readJSON(userPath(p.e));
  if (!user || user.id !== p.u || (user.sv || 0) !== p.v) return null;
  return user;
}
