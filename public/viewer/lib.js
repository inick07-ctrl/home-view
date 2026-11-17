// Helpers for authoring models in plan feet (x east, y south).
// seg(): axis-aligned wall centre-line with door / window openings -> rect lists the engine understands.
export function makeWalls() {
  const W = { ext: [], int: [], win: [], door: [], counter: [] };
  W.seg = (x0, y0, x1, y1, o = {}) => {
    const t = o.t ?? (o.ext ? 0.8 : 0.4), h = o.h, ext = !!o.ext, half = t / 2;
    const horiz = Math.abs(y1 - y0) < Math.abs(x1 - x0);
    let a = horiz ? Math.min(x0, x1) : Math.min(y0, y1), b = horiz ? Math.max(x0, x1) : Math.max(y0, y1);
    const c = horiz ? y0 : x0;
    a -= half; b += half; // overlap corners
    const R = (s, e) => horiz ? [s, c - half, e, c + half] : [c - half, s, c + half, e];
    const ops = [];
    for (const d of o.doors || []) ops.push({ s: d[0], e: d[1], kind: 'door', top: d[2] ?? 7 });
    for (const w of o.windows || []) ops.push({ s: w[0], e: w[1], kind: 'win', sill: w[2] ?? 3, head: w[3] ?? 7 });
    ops.sort((p, q) => p.s - q.s);
    let cur = a;
    const solid = (s, e) => { if (e - s > 0.01) (ext ? W.ext : W.int).push(h ? [...R(s, e), h] : R(s, e)); };
    for (const op of ops) {
      solid(cur, op.s);
      if (op.kind === 'door') W.door.push([...R(op.s, op.e), op.top, h ?? null, ext ? 1 : 0]);
      else W.win.push([...R(op.s, op.e), op.sill, op.head, h ?? null]);
      cur = op.e;
    }
    solid(cur, b);
    return W;
  };
  return W;
}
