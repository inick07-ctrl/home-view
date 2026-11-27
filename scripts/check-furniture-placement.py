#!/usr/bin/env python3
"""Load every catalog model in every interior style and fail if the
furniture placement validator reports any violation.

Checks: floor-standing items in halls/foyers/galleries/geometric
circulation or within ~3 ft of a hallway mouth; item overlaps (except
intentional groupings); items in a fireplace firebox/hearth, door
clearance (inside and outside, including porch approaches), or stair
zone; tall pieces not backed against a wall; blocked 36-inch walk
paths; duplicate coffee tables in one group; laundry rooms have
exactly one washer and one dryer; no duplicate appliances; bath
fixtures backed to walls with the door zone clear; every bed
headboard flush against a wall; at most one sofa per porch or
outdoor space.

Usage:
  python3 scripts/check-furniture-placement.py [--url http://127.0.0.1:3000] [--shots /workspace/shots]
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

MODELS = [
    "smith-01", "smith-02", "smith-03", "smith-04", "smith-05", "smith-06",
    "smith-07", "smith-08", "smith-09", "smith-10", "smith-11", "smith-12",
    "smith-13", "smith-14", "tiny-01", "tiny-02", "tiny-03", "tiny-04",
    "aframe-01", "aframe-02", "aframe-03", "single-wide-01", "double-wide-01",
]

STYLES = ["default", "modern", "scandinavian", "warm-luxury", "english-country", "nordic-modern"]

CHROME_ARGS = [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disk-cache-size=0",
]

WAIT_APP = "() => !!(window.app && window.app.getRooms && window.app.getRooms().length && window.app.validateFurniture)"


def load_home(page, url, model, timeout=90000):
    page.goto(f"{url}/viewer?ex={model}&nowelcome=1", wait_until="domcontentloaded", timeout=timeout)
    page.wait_for_function(WAIT_APP, timeout=timeout)
    page.wait_for_timeout(250)


def set_style(page, style, timeout=90000):
    page.evaluate(
        """(id) => {
          if (window.app.setStyle) window.app.setStyle(id);
          const sel = document.getElementById('bStyle');
          if (sel && sel.value !== id) { sel.value = id; sel.dispatchEvent(new Event('change', { bubbles: true })); }
        }""",
        style,
    )
    page.wait_for_function(WAIT_APP, timeout=timeout)
    page.wait_for_timeout(200)


def validate(page):
    return page.evaluate(
        """() => {
          const r = window.app.validateFurniture() || { ok: false, violations: [{ kind: 'missing', message: 'validateFurniture returned nothing' }], counts: {} };
          const items = (window.app.getAllItems && window.app.getAllItems()) || [];
          return {
            ok: !!r.ok,
            counts: r.counts || {},
            n: (r.violations || []).length,
            violations: (r.violations || []).slice(0, 25),
            itemCount: items.length,
            style: (document.getElementById('bStyle') || {}).value || null,
          };
        }"""
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://127.0.0.1:3000")
    ap.add_argument("--shots", default="")
    ap.add_argument("--models", default="")
    ap.add_argument("--styles", default="")
    args = ap.parse_args()
    models = [m.strip() for m in args.models.split(",") if m.strip()] or MODELS
    styles = [s.strip() for s in args.styles.split(",") if s.strip()] or STYLES
    url = args.url.rstrip("/")

    from playwright.sync_api import sync_playwright

    results = []
    failures = 0
    t0 = time.time()
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=CHROME_ARGS)
        page = browser.new_page(viewport={"width": 1400, "height": 900})
        for mid, model in enumerate(models):
            try:
                load_home(page, url, model)
            except Exception as e:
                print(f"FAIL  {model:18} load: {e}")
                failures += len(styles)
                results.append({"model": model, "error": str(e)})
                continue
            for style in styles:
                try:
                    if style != "default":
                        set_style(page, style)
                    elif mid == 0 or True:
                        # default is the style the model loads in; still confirm
                        cur = page.evaluate("() => (document.getElementById('bStyle')||{}).value")
                        if cur and cur != "default":
                            set_style(page, "default")
                    data = validate(page)
                except Exception as e:
                    print(f"FAIL  {model:18} {style:18} {e}")
                    failures += 1
                    results.append({"model": model, "style": style, "error": str(e)})
                    continue
                ok = data.get("ok") and data.get("n", 1) == 0
                if ok:
                    print(f"OK    {model:18} {style:18} items={data.get('itemCount')}")
                else:
                    failures += 1
                    print(f"FAIL  {model:18} {style:18} n={data.get('n')} counts={data.get('counts')} sample={data.get('violations')[:4]}")
                results.append({"model": model, "style": style, **data, "ok": ok})
        browser.close()

    elapsed = time.time() - t0
    total = len(models) * len(styles)
    print(f"\n{total - failures}/{total} passed in {elapsed:.1f}s")
    if args.shots:
        out = Path(args.shots) / "placement_check_report.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps({"failures": failures, "total": total, "results": results}, indent=2))
        print(f"wrote {out}")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
