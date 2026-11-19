// Writes public/3d/models/template-smith-02.json: Smith 02 as a plain-data PeakStead Designs model (example for uploads). The _format id stays "Home View model v1" so existing uploads still parse.
import fs from 'node:fs';
const { default: m } = await import('../public/3d/models/smith-02.js');
const ops = [];
const kit = new Proxy({}, { get: (_, k) => (...a) => { ops.push([k, ...a]); return {}; } });
m.furnish(kit);
const out = { ...m, furnish: ops };
delete out.planImage;
out._format = 'Home View model v1. Units: feet; x east, y south. rooms: [name, dims, floorType, x0, y0, x1, y1, opts]. walls.ext/int: [x0,y0,x1,y1,height?]; win: [x0,y0,x1,y1,sill,head,h?]; door: [x0,y0,x1,y1,top,h?,isExt]. furnish: [method, ...args] with method in block|plane|water|bed|car.';
fs.writeFileSync(new URL('../public/3d/models/template-smith-02.json', import.meta.url), JSON.stringify(out));
console.log('ops', ops.length, Object.keys(out));
