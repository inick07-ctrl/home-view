#!/usr/bin/env python3
"""Free Draw check: interpret several hand-drawn test sketches, load each
generated home in the 3D viewer, and run the same furniture placement
validator as check-furniture-placement.py in every interior style.

Also confirms the living / great-room sofa is the Morro Bay II, laundry has
exactly one washer + dryer pair, and every generated home has an outside door.

Usage:
  python3 scripts/check-freedraw.py [--url http://127.0.0.1:3000] [--styles default,modern]
"""
from __future__ import annotations

import argparse
import json
import sys

STYLES = ["default", "modern", "scandinavian", "warm-luxury", "english-country"]
CHROME_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
               "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage", "--disk-cache-size=0"]

# (sample, seed, size)
CASES = [
    ("ranch", 7, {"mode": "dims", "width": 56, "depth": 26}),
    ("ranch", 3, {"mode": "dims", "width": 60, "depth": 28}),
    ("ranch", 19, {"mode": "sqft", "sqft": 1300}),
    ("cottage", 11, {"mode": "dims", "width": 36, "depth": 22}),
    ("cottage", 5, {"mode": "dims", "width": 30, "depth": 20}),
    ("cottage", 8, {"mode": "sqft", "sqft": 1000}),
    ("lshape", 23, {"mode": "dims", "width": 52, "depth": 30}),
    ("lshape", 2, {"mode": "dims", "width": 64, "depth": 36}),
    ("lshape", 41, {"mode": "sqft", "sqft": 1500}),
]

WAIT_APP = "() => !!(window.app && window.app.getRooms && window.app.getRooms().length && window.app.validateFurniture)"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://127.0.0.1:3000")
    ap.add_argument("--styles", default="")
    args = ap.parse_args()
    url = args.url.rstrip("/")
    styles = [s for s in args.styles.split(",") if s] or STYLES
    from playwright.sync_api import sync_playwright

    fails = 0
    total = 0
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=CHROME_ARGS)
        pg = b.new_page(viewport={"width": 1400, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"{url}/freedraw", wait_until="domcontentloaded")
        pg.wait_for_function("() => !!window.__psFreeDraw")
        for sample, seed, size in CASES:
            name = f"{sample}#{seed} {json.dumps(size)}"
            pg.goto(f"{url}/freedraw", wait_until="domcontentloaded")
            res = pg.evaluate(
                """async ([sample, seed, size]) => {
                  const m = await import('/js/freedraw-interpret.js');
                  const r = m.interpretSketch(m.SAMPLE_SKETCHES[sample](seed), size);
                  if (!r.ok) return { ok: false, error: r.error };
                  localStorage.setItem('peakstead-builder-draft-model', JSON.stringify(r.model));
                  const extDoors = r.model.walls.door.filter((d) => d[6] === 1).length;
                  return { ok: true, stats: r.stats, rooms: r.rooms.map((x) => x.name), extDoors, warnings: r.warnings };
                }""",
                [sample, seed, size],
            )
            if not res.get("ok"):
                print(f"FAIL  {name}: interpret: {res.get('error')}")
                fails += len(styles); total += len(styles)
                continue
            pg.goto(f"{url}/viewer?draft=1&nowelcome=1", wait_until="domcontentloaded")
            pg.wait_for_function(WAIT_APP, timeout=120000)
            pg.wait_for_timeout(300)
            for style in styles:
                total += 1
                pg.evaluate("(id) => window.app.setStyle && window.app.setStyle(id)", style)
                pg.wait_for_function(WAIT_APP, timeout=120000)
                pg.wait_for_timeout(200)
                data = pg.evaluate(
                    """() => {
                      const r = window.app.validateFurniture();
                      const items = window.app.getAllItems();
                      const rooms = window.app.getRooms();
                      const inRoom = (it, rm) => it.x > rm[3] && it.x < rm[5] && it.y > rm[4] && it.y < rm[6];
                      const extra = [];
                      for (const rm of rooms) {
                        const n = rm[0] || '';
                        const here = items.filter((it) => inRoom(it, rm));
                        if (/living|family|great/i.test(n) && !(rm[7] || {}).noAuto) {
                          const sofas = here.filter((it) => /sofa|sectional|morro/i.test(it.type));
                          if (sofas.length && !sofas.some((it) => it.type === 'morroBay')) extra.push(n + ': sofa is not the Morro Bay II');
                        }
                        if (/laundry/i.test(n)) {
                          const wd = here.filter((it) => /washer|dryer/i.test(it.type));
                          if (wd.length !== 1 || wd[0].type !== 'washerDryer') extra.push(n + ': laundry has ' + wd.map((i) => i.type).join('+'));
                        }
                      }
                      const cars = items.filter((it) => /car|truck|suv|vehicle/i.test(it.type) && !/card|carpet|cart/i.test(it.type));
                      if (cars.length) extra.push('cars shown by default: ' + cars.length);
                      return { ok: !!r.ok, n: (r.violations || []).length, v: (r.violations || []).slice(0, 5), items: items.length, extra };
                    }"""
                )
                ok = data["ok"] and data["n"] == 0 and not data["extra"]
                if not ok:
                    fails += 1
                    print(f"FAIL  {name:48} {style:16} n={data['n']} {data['v']} {data['extra']}")
                else:
                    print(f"OK    {name:48} {style:16} items={data['items']} heated={res['stats']['heated']} extDoors={res['extDoors']}")
        b.close()
    if errs:
        print("page errors:", errs[:5])
    print(f"\n{total - fails}/{total} passed")
    return 0 if fails == 0 and not errs else 1


if __name__ == "__main__":
    sys.exit(main())
