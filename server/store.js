// Tiny JSON "database" on top of a private Vercel Blob store.
import * as real from '@vercel/blob';
import * as local from './local-blob.js';
// LOCAL_BLOB_DIR switches to a filesystem stand-in for local development only.
const B = process.env.LOCAL_BLOB_DIR ? local : real;
const { put, get, del, list, head } = B;

const OPT = { access: 'private' };

export async function readJSON(pathname) {
  const r = await get(pathname, { ...OPT, useCache: false });
  if (!r || r.statusCode !== 200) return null;
  const text = await new Response(r.stream).text();
  try { return JSON.parse(text); } catch { return null; }
}

export async function writeJSON(pathname, data) {
  await put(pathname, JSON.stringify(data), {
    ...OPT, addRandomSuffix: false, allowOverwrite: true,
    contentType: 'application/json', cacheControlMaxAge: 60,
  });
}

export async function writeJSONIfAbsent(pathname, data) {
  // allowOverwrite:false makes the put fail if the pathname already exists
  try {
    await put(pathname, JSON.stringify(data), { ...OPT, addRandomSuffix: false, allowOverwrite: false, contentType: 'application/json', cacheControlMaxAge: 60 });
    return true;
  } catch (e) {
    if (/already exists|exists/i.test(String(e?.message))) return false;
    throw e;
  }
}

export async function remove(pathnames) {
  const arr = (Array.isArray(pathnames) ? pathnames : [pathnames]).filter(Boolean);
  if (arr.length) await del(arr);
}

export async function listAll(prefix) {
  const out = []; let cursor;
  do {
    const r = await list({ prefix, cursor, limit: 1000 });
    out.push(...r.blobs); cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return out;
}

export async function headBlob(pathname) {
  try { return await head(pathname); } catch { return null; }
}

export async function streamBlob(pathname) {
  const r = await get(pathname, { ...OPT });
  if (!r || r.statusCode !== 200) return null;
  return r;
}
