#!/usr/bin/env python3
"""Load every catalog model, add/resize single and double garage doors,
and assert the door geometry stays inside the garage wall opening.

Also asserts that removing any door (keep opening) clears the wall header
above it (full-height opening), that undo/restore brings the header back,
that a saved-layout reload keeps the opening full-height, and that
fill-with-wall still produces a solid wall.

Usage:
  python3 scripts/check-garage-doors.py [--url http://127.0.0.1:3000] [--shots /workspace/shots]
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

# Close-ups of a resized/added double door on these models (plus any others requested).
SHOT_MODELS = ["smith-13", "smith-14", "smith-01", "smith-10"]

CHROME_ARGS = [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disk-cache-size=0",
]

# In-page assertions: opening length, mesh width, garage frontage, overlaps, T-junctions, pier.
CHECK_JS = r"""
() => {
  const PIER = 0.35;
  const GARAGE_RX = /garage|\bbay\b|\bshop\b/i;
  const rooms = window.app.getRooms() || [];
  const walls = window.app.getWalls() || {};
  const gds = window.app.getGarageDoors() || [];
  const list = (window.app.doorList() || []).filter(d => d.kind === 'garage');
  const isGarage = (r) => GARAGE_RX.test((r && r[0]) || '') && !/carport/i.test((r && r[0]) || '');
  const roomAt = (x, y, pred) => rooms.find(r => (!pred || pred(r)) && x > r[3] && x < r[5] && y > r[4] && y < r[6]);
  const issues = [];
  const items = [];

  const doorGeom = (idx) => {
    const w = (walls.door || [])[idx];
    if (!w) return null;
    const horiz = (w[2] - w[0]) >= (w[3] - w[1]);
    const a = horiz ? w[0] : w[1], b = horiz ? w[2] : w[3];
    const perp = horiz ? (w[1] + w[3]) / 2 : (w[0] + w[2]) / 2;
    const cx = (w[0] + w[2]) / 2, cy = (w[1] + w[3]) / 2;
    const width = b - a;
    return { horiz, a, b, perp, cx, cy, width, w };
  };

  // Mesh list should match every *present* (not removed) plan garage door.
  for (const d of list) {
    const g = doorGeom(d.index);
    if (!g) { issues.push({ door: d.index, issue: 'missing wall' }); continue; }
    const mesh = gds.find(m => Math.abs(m.cx - g.cx) < 0.2 && Math.abs(m.cy - g.cy) < 0.2);
    if (d.removed) {
      if (mesh) issues.push({ door: d.index, issue: 'removed door still has a 3D leaf/opener mesh', cx: g.cx, cy: g.cy });
      continue;
    }
    if (!mesh) issues.push({ door: d.index, issue: 'no 3D mesh for opening', cx: g.cx, cy: g.cy, width: g.width });
    else if (Math.abs(mesh.width - g.width) > 0.06) {
      issues.push({ door: d.index, issue: 'mesh width != opening', mesh: mesh.width, opening: g.width });
    }
    if (Math.abs((d.width || 0) - g.width) > 0.06) {
      issues.push({ door: d.index, issue: 'doorList width != opening', list: d.width, opening: g.width });
    }

    const mx = g.cx, my = g.cy, t = g.horiz ? (g.w[3] - g.w[1]) : (g.w[2] - g.w[0]);
    const dd = t / 2 + 1.2;
    const anyAt = (x,y) => roomAt(x,y);
    const frontageOk = (r) => {
      if (!r || (r[7] && r[7].outside)) return false;
      if (isGarage(r)) return true;
      return !String(r[0] || '').trim();
    };
    const sample = (along, sign) => g.horiz ? anyAt(along, g.perp + sign * dd) : anyAt(g.perp + sign * dd, along);
    const gA = frontageOk(sample(g.horiz ? mx : my, -1));
    const gB = frontageOk(sample(g.horiz ? mx : my, 1));
    if (!gA === !gB) issues.push({ door: d.index, issue: 'opening not on a one-sided garage facade' });
    const inward = gA ? -1 : 1;
    const inset = 0.2;
    for (let s = g.a + inset; s <= g.b - inset + 1e-6; s += 0.25) {
      if (!frontageOk(sample(s, inward))) {
        issues.push({ door: d.index, issue: 'span leaves garage frontage', along: s, a: g.a, b: g.b });
        break;
      }
    }

    // Overlap other openings on the same facade (doors + windows).
    const others = [];
    (walls.door || []).forEach((w, j) => { if (j !== d.index) others.push({ kind: 'door', j, w }); });
    (walls.win || []).forEach((w, j) => others.push({ kind: 'win', j, w }));
    for (const o of others) {
      const w = o.w;
      const oh = (w[2] - w[0]) >= (w[3] - w[1]);
      if (oh !== g.horiz) continue;
      const operp = oh ? (w[1] + w[3]) / 2 : (w[0] + w[2]) / 2;
      if (Math.abs(operp - g.perp) > 0.4) continue;
      const oa = oh ? w[0] : w[1], ob = oh ? w[2] : w[3];
      if (g.a < ob - 0.02 && g.b > oa + 0.02) {
        issues.push({ door: d.index, issue: 'overlaps ' + o.kind, other: o.j, a: g.a, b: g.b, oa, ob });
      }
    }

    // A perpendicular wall that reaches inward and meets this facade must not
    // cut through the opening. Corner-wall thickness at the jamb (≤ 0.5') is ok;
    // porch/wing walls that only touch the outward face do not count.
    for (const kind of ['int', 'ext']) {
      for (const w of (walls[kind] || [])) {
        const h2 = (w[2] - w[0]) >= (w[3] - w[1]);
        if (h2 === g.horiz) continue;
        const across0 = g.horiz ? w[1] : w[0], across1 = g.horiz ? w[3] : w[2];
        const a0 = g.horiz ? w[0] : w[1], a1 = g.horiz ? w[2] : w[3];
        const acrossLo = Math.min(across0, across1), acrossHi = Math.max(across0, across1);
        if (acrossLo - 0.45 > g.perp || acrossHi + 0.45 < g.perp) continue;
        const inwardPt = g.perp + inward * 0.8;
        const reachesInward = inward < 0 ? acrossLo <= inwardPt + 0.2 : acrossHi >= inwardPt - 0.2;
        if (!reachesInward) continue;
        if (Math.abs(a1 - a0) < 0.12) continue;
        const sa = Math.min(a0, a1), sb = Math.max(a0, a1);
        const overlap = Math.min(g.b, sb) - Math.max(g.a, sa);
        if (overlap > 0.5) {
          issues.push({ door: d.index, issue: 'crosses ' + kind + ' T-junction', sa, sb, a: g.a, b: g.b, overlap });
        }
      }
    }

    items.push({ index: d.index, width: +g.width.toFixed(3), cx: +g.cx.toFixed(3), cy: +g.cy.toFixed(3), horiz: g.horiz });
  }

  // Every 3D garage mesh should have a matching opening.
  for (const m of gds) {
    const hit = list.some(d => {
      const g = doorGeom(d.index);
      return g && Math.abs(m.cx - g.cx) < 0.2 && Math.abs(m.cy - g.cy) < 0.2;
    });
    if (!hit) issues.push({ issue: 'orphan 3D garage mesh', mesh: m });
  }

  // Opener motor / rails / tracks / hangers: one assembly per present door,
  // none for a removed door, and sized / centered to match the opening.
  const present = list.filter(d => !d.removed);
  const openers = (window.app.getGarageOpeners && window.app.getGarageOpeners()) || [];
  if (window.app.getGarageOpeners) {
    if (openers.length !== present.length) {
      issues.push({ issue: 'opener count != present garage doors', openers: openers.length, doors: present.length });
    }
    for (const op of openers) {
      if (!op.hasOpener || (op.meshes || 0) < 8) issues.push({ issue: 'opener missing motor/rails/tracks', op });
      const g = present.map(d => doorGeom(d.index)).find(dg => dg && Math.abs(dg.cx - op.cx) < 0.3 && Math.abs(dg.cy - op.cy) < 0.3);
      if (!g) issues.push({ issue: 'opener not lined up with a door', op });
      else if (Math.abs(op.width - g.width) > 0.1) issues.push({ issue: 'opener width != door', opener: op.width, door: g.width });
    }
    // Scene-graph orphans: a garageOpener group with no matching live door.
    const root = window.app.dbg && window.app.dbg().root;
    if (root) {
      let orphan = 0, tagged = 0;
      root.traverse(o => {
        if (!(o.userData && o.userData.garageOpener)) return;
        tagged++;
        const holder = o.parent;
        const hx = holder ? holder.position.x : null;
        const match = openers.some(op => Math.abs((op.cx ?? 1e9) - (holder && holder.userData && 0)) < 9e9) || openers.length;
        // Match by doorIndex on the holder.
        const idx = holder && holder.userData && holder.userData.doorIndex;
        const live = idx == null ? true : present.some(d => d.index === idx);
        if (present.length === 0) orphan++;
        else if (idx != null && !present.some(d => d.index === idx) && !openers.some(op => op.doorIndex === idx)) orphan++;
      });
      if (present.length === 0 && tagged > 0) issues.push({ issue: 'orphaned opener groups after all doors removed', tagged });
    }
  }
  return { issues, doors: items, meshCount: gds.length, openerCount: openers.length };
}
"""

FIND_EXT_JS = r"""
() => {
  const walls = window.app.getWalls() || {};
  const idx = [];
  (walls.ext || []).forEach((_, i) => {
    if (window.app.garageWallInfo('ext', i)) idx.push(i);
  });
  return idx;
}
"""

GARAGE_IDX_JS = r"""
() => (window.app.doorList() || []).filter(d => d.kind === 'garage').map(d => d.index)
"""



def collect_door_headers(page):
    return page.evaluate(
        """() => {
      const list = (window.app.doorList && window.app.doorList()) || [];
      return list.map((d) => {
        const p = window.app.probeDoorHeader ? window.app.probeDoorHeader(d.index) : null;
        const c = window.app.probeOpeningClear ? window.app.probeOpeningClear(d.index) : null;
        return Object.assign({
          index: d.index, kind: d.kind, width: d.width, room: d.room,
          removed: !!d.removed, openingTop: d.openingTop, missing: !p,
          openingClear: c ? c.clear : null, trimHits: c ? (c.nHits || 0) : 0,
        }, p || {});
      });
    }"""
    )


def header_fail(probes, expect_clear, label, stock_by=None):
    """If expect_clear, the header band must be empty. Otherwise compare to stock
    (some catalog doors are already full-height / have no header strip)."""
    issues = []
    stock_by = stock_by or {}
    for p in probes or []:
        tag = f"{label} {p.get('kind') or 'door'}[{p.get('index')}]"
        if p.get("missing"):
            issues.append(f"{tag}: probe missing")
            continue
        s = stock_by.get(p.get("index")) or {}
        if p.get("midSkipped") or s.get("midSkipped"):
            continue
        clear = bool(p.get("headerClear"))
        if expect_clear:
            if not clear:
                issues.append(f"{tag}: wall still occupies the header band at y={p.get('midY')}")
            if p.get("openingClear") is False:
                issues.append(f"{tag}: door, frame, or trim still in the opening ({p.get('trimHits')} hits)")
            if p.get("ceilingIntact") is False and s.get("ceilingIntact") is True:
                issues.append(f"{tag}: ceiling/roof missing above the full-height opening")
            if p.get("removed") is False:
                issues.append(f"{tag}: door record was not marked removed (noLeaf)")
        else:
            # Restored / stock: header occupancy should match the original plan.
            if s and bool(s.get("headerClear")) != clear:
                issues.append(f"{tag}: header state {clear} did not match stock {bool(s.get('headerClear'))}")
            if p.get("removed"):
                issues.append(f"{tag}: door still marked removed")
    return issues


def check_door_headers(page, url, mid, bust):
    """Remove every door as a keep-opening, then undo, reload, and fill-with-wall."""
    out = {"ok": True, "errors": [], "steps": [], "nDoors": 0}

    def fail(step, issues, extra=None):
        out["ok"] = False
        rec = {"step": step, "issues": issues}
        if extra:
            rec["extra"] = extra
        out["errors"].append(rec)

    load_model(page, url, mid, bust + 700)
    doors = page.evaluate("() => (window.app.doorList && window.app.doorList()) || []")
    out["nDoors"] = len(doors)
    if not doors:
        out["steps"].append({"label": "headers", "nDoors": 0, "note": "no doors"})
        return out

    layout_before = page.evaluate("() => window.app.getLayout && window.app.getLayout()")
    stock = collect_door_headers(page)
    stock_by = {p.get("index"): p for p in (stock or [])}
    stock_issues = header_fail(stock, False, "stock")
    out["steps"].append({"label": "header-stock", "n": len(stock), "issues": stock_issues})
    if stock_issues:
        fail("header-stock", stock_issues)

    indexes = [d["index"] for d in doors]
    removed_ok = page.evaluate(
        """(idxs) => idxs.map((i) => !!window.app.removeDoor(i, 'opening'))""",
        indexes,
    )
    page.wait_for_timeout(200)
    after_rm = collect_door_headers(page)
    rm_issues = header_fail(after_rm, True, "remove", stock_by)
    if not all(removed_ok):
        rm_issues.append("removeDoor returned false for one or more doors: " + str(removed_ok))
    layout_removed = page.evaluate("() => window.app.getLayout && window.app.getLayout()")
    # 2D plan / snapshot should flag removed doors as full-height openings.
    snap = page.evaluate(
        """() => {
      const list = (window.app.doorList && window.app.doorList()) || [];
      return {
        removed: list.filter((d) => d.removed).length,
        total: list.length,
        openingTops: list.filter((d) => d.removed).map((d) => ({ i: d.index, top: d.openingTop, h: d.height })),
      };
    }"""
    )
    if snap.get("removed") != snap.get("total"):
        rm_issues.append(f"doorList removed count {snap.get('removed')} != {snap.get('total')}")
    out["steps"].append({"label": "header-remove-all", "issues": rm_issues, "snap": snap})
    if rm_issues:
        fail("header-remove-all", rm_issues)

    restored_ok = page.evaluate(
        """(idxs) => idxs.map((i) => !!window.app.restoreDoor(i))""",
        indexes,
    )
    page.wait_for_timeout(200)
    after_rs = collect_door_headers(page)
    rs_issues = header_fail(after_rs, False, "restore", stock_by)
    if not all(restored_ok):
        rs_issues.append("restoreDoor returned false for one or more doors: " + str(restored_ok))
    out["steps"].append({"label": "header-restore-all", "issues": rs_issues})
    if rs_issues:
        fail("header-restore-all", rs_issues)

    # Reload the removed layout as a saved project would.
    if layout_removed and page.evaluate("() => typeof window.app.applyLayout === 'function'"):
        load_model(page, url, mid, bust + 750)
        page.evaluate("(L) => window.app.applyLayout(L)", layout_removed)
        page.wait_for_timeout(250)
        after_ld = collect_door_headers(page)
        ld_issues = header_fail(after_ld, True, "reload", stock_by)
        out["steps"].append({"label": "header-reload-removed", "issues": ld_issues})
        if ld_issues:
            fail("header-reload-removed", ld_issues)

    # Undo via the pre-remove layout brings headers and leaves back.
    if layout_before and page.evaluate("() => typeof window.app.applyLayout === 'function'"):
        page.evaluate("(L) => window.app.applyLayout(L)", layout_before)
        page.wait_for_timeout(250)
        after_un = collect_door_headers(page)
        un_issues = header_fail(after_un, False, "undo", stock_by)
        out["steps"].append({"label": "header-undo-layout", "issues": un_issues})
        if un_issues:
            fail("header-undo-layout", un_issues)

    # Fill-with-wall still produces a solid wall (header band and leaf height).
    load_model(page, url, mid, bust + 780)
    doors2 = page.evaluate("() => (window.app.doorList && window.app.doorList()) || []")
    pick = next((d for d in doors2 if d.get("kind") in ("int", "ext") and d.get("hasLeaf") and 2.0 <= (d.get("width") or 0) <= 4.5), None)
    if pick is None:
        pick = next((d for d in doors2 if d.get("hasLeaf") and (d.get("width") or 0) < 7), None)
    if pick is None:
        pick = doors2[0] if doors2 else None
    if pick and page.evaluate("() => typeof window.app.probeBandAt === 'function'"):
        info = page.evaluate("(i) => window.app.probeDoorHeader(i)", pick["index"])
        layout_fill_before = page.evaluate("() => window.app.getLayout && window.app.getLayout()")
        filled = page.evaluate("(i) => window.app.removeDoor(i, 'wall')", pick["index"])
        page.wait_for_timeout(200)
        midY = (info or {}).get("midY") or (((info or {}).get("leafTop") or 7) + 0.6)
        cx, cy, horiz = (info or {}).get("cx"), (info or {}).get("cy"), (info or {}).get("horiz")
        half = (info or {}).get("half")
        band = page.evaluate(
            """({ cx, cy, horiz, y, half }) => window.app.probeBandAt(cx, cy, horiz, y, half)""",
            {"cx": cx, "cy": cy, "horiz": horiz, "y": midY, "half": half},
        )
        leafY = ((info or {}).get("leafTop") or 7) * 0.5
        leaf = page.evaluate(
            """({ cx, cy, horiz, y, half }) => window.app.probeBandAt(cx, cy, horiz, y, half)""",
            {"cx": cx, "cy": cy, "horiz": horiz, "y": leafY, "half": half},
        )
        fill_issues = []
        if not filled:
            fill_issues.append("removeDoor(..., 'wall') returned false")
        if band and band.get("headerClear"):
            fill_issues.append(f"fill-with-wall left the header band open at y={midY}")
        if leaf and leaf.get("headerClear"):
            fill_issues.append("fill-with-wall left the door-height span open")
        # door should no longer be in the list at that index as a door
        still = page.evaluate(
            """({ cx, cy }) => ((window.app.doorList && window.app.doorList()) || []).some((d) => {
                const walls = (window.app.getWalls && window.app.getWalls()) || {};
                const rec = (walls.door || [])[d.index];
                if (!rec) return false;
                const mx = (rec[0] + rec[2]) / 2, my = (rec[1] + rec[3]) / 2;
                return Math.hypot(mx - cx, my - cy) < 0.4;
              })""",
            {"cx": cx, "cy": cy},
        )
        if still:
            fill_issues.append(f"door at ({cx}, {cy}) still listed after fill-with-wall")
        out["steps"].append({"label": "header-fill-wall", "issues": fill_issues, "pick": pick, "band": band, "leaf": leaf})
        if fill_issues:
            fail("header-fill-wall", fill_issues)
        if layout_fill_before:
            page.evaluate("(L) => window.app.applyLayout(L)", layout_fill_before)
            page.wait_for_timeout(200)

    return out


def wait_app(page, timeout=60000):
    page.wait_for_function("() => window.app && window.app.getGarageDoors && window.app.garageSize && window.app.getRooms", timeout=timeout)
    page.wait_for_timeout(400)


def load_model(page, url, mid, bust, first=False):
    if first or not page.evaluate("() => !!(window.app && window.app.loadExample)"):
        page.goto(f"{url}/viewer?ex={mid}&_v={bust}", wait_until="domcontentloaded", timeout=60000)
        wait_app(page)
        return
    # fresh:true reloads the stock catalog plan and ignores any in-device layout.
    page.evaluate("""async (id) => { await window.app.loadExample(id, { fresh: true }); }""", mid)
    page.wait_for_timeout(350)


def check(page, label):
    res = page.evaluate(CHECK_JS)
    res["label"] = label
    return res


def shot_door(page, path, close=False):
    moved = page.evaluate(
        """(close) => {
      const gds = window.app.getGarageDoors() || [];
      if (!gds.length || !window.app.planToWorld) return false;
      const g = gds.slice().sort((a,b) => b.width - a.width)[0];
      const along = close ? (g.horiz ? g.cx : g.cy) - g.width/2 : (g.horiz ? g.cx : g.cy);
      const x = g.horiz ? along : g.cx;
      const y = g.horiz ? g.cy : along;
      const [wx, wz] = window.app.planToWorld(x, y);
      // Stand outside: offset along the wall normal using a second plan point.
      const [wx2, wz2] = window.app.planToWorld(g.cx + (g.horiz ? 0 : 2), g.cy + (g.horiz ? 2 : 0));
      let nx = wx2 - wx, nz = wz2 - wz;
      const len = Math.hypot(nx, nz) || 1;
      nx /= len; nz /= len;
      // Choose the outward side by seeing which offset is farther from the model origin.
      const camDist = close ? 12 : 24;
      window.app.setMode && window.app.setMode('orbit');
      window.app.camera.position.set(wx - nx * camDist, close ? 5.5 : 8, wz - nz * camDist);
      window.app.orbit.target.set(wx, 4, wz + (close ? 2 : 0));
      window.app.orbit.update();
      return { width: g.width, cx: g.cx, cy: g.cy };
    }""",
        close,
    )
    page.wait_for_timeout(500)
    path.parent.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(path))
    return moved


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://127.0.0.1:3000")
    ap.add_argument("--shots", default="/workspace/shots")
    ap.add_argument("--chrome", default="/usr/bin/google-chrome")
    args = ap.parse_args()
    shots = Path(args.shots)
    shots.mkdir(parents=True, exist_ok=True)

    from playwright.sync_api import sync_playwright

    bust = int(time.time())
    report = []
    failed = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=args.chrome, args=CHROME_ARGS)
        page = browser.new_page(viewport={"width": 1400, "height": 900})
        for mid in MODELS:
            row = {"model": mid, "steps": [], "ok": True, "errors": []}
            try:
                load_model(page, args.url, mid, bust, first=True)
                title = page.evaluate("() => (document.querySelector('#hud h2, .hud h2, #exTitle')||{}).textContent || ''")
                row["title"] = (title or "").strip().split("\n")[0][:80]
                stock_idx = page.evaluate(GARAGE_IDX_JS)
                row["stockDoors"] = stock_idx
                stock = check(page, "stock")
                row["steps"].append(stock)
                if stock["issues"]:
                    row["ok"] = False
                    row["errors"].append({"step": "stock", "issues": stock["issues"]})

                # Removing any door (keep opening) must also clear the wall header
                # above it. Undo/restore brings the header back; a saved-layout
                # reload keeps the full-height opening; fill-with-wall stays solid.
                header = check_door_headers(page, args.url, mid, bust)
                row["nDoors"] = header.get("nDoors")
                row["steps"].extend(header.get("steps") or [])
                if not header["ok"]:
                    row["ok"] = False
                    row["errors"].extend(header["errors"])

                # Remove each garage door: the opener (motor, rails, tracks, hangers)
                # must disappear with it, come back on restore, and stay gone after a
                # saved-layout reload that already has the door removed.
                for di, door_i in enumerate(stock_idx):
                    load_model(page, args.url, mid, bust + 400 + di)
                    before_op = page.evaluate("() => (window.app.getGarageOpeners && window.app.getGarageOpeners()) || []")
                    before_g = page.evaluate("() => window.app.getGarageDoors() || []")
                    layout_before = page.evaluate("() => window.app.getLayout && window.app.getLayout()")
                    removed = page.evaluate("(i) => window.app.removeDoor(i, 'opening')", door_i)
                    after_rm = check(page, f"remove-{door_i}")
                    after_op = page.evaluate("() => (window.app.getGarageOpeners && window.app.getGarageOpeners()) || []")
                    after_g = page.evaluate("() => window.app.getGarageDoors() || []")
                    layout_removed = page.evaluate("() => window.app.getLayout && window.app.getLayout()")
                    after_rm["op"] = {"removed": removed, "openersBefore": len(before_op), "openersAfter": len(after_op), "doorsBefore": len(before_g), "doorsAfter": len(after_g)}
                    row["steps"].append(after_rm)
                    if after_rm["issues"]:
                        row["ok"] = False
                        row["errors"].append({"step": after_rm["label"], "issues": after_rm["issues"], "op": after_rm["op"]})
                    if not removed:
                        row["ok"] = False
                        row["errors"].append({"step": after_rm["label"], "op": "removeDoor returned false"})
                    if len(after_op) != len(before_op) - 1 or len(after_g) != len(before_g) - 1:
                        row["ok"] = False
                        row["errors"].append({"step": after_rm["label"], "issue": "opener or door not removed with the leaf", "op": after_rm["op"]})
                    restored = page.evaluate("(i) => window.app.restoreDoor(i)", door_i)
                    after_rs = check(page, f"restore-{door_i}")
                    after_rs_op = page.evaluate("() => (window.app.getGarageOpeners && window.app.getGarageOpeners()) || []")
                    after_rs["op"] = {"restored": restored, "openers": len(after_rs_op)}
                    row["steps"].append(after_rs)
                    if after_rs["issues"] or not restored or len(after_rs_op) != len(before_op):
                        row["ok"] = False
                        row["errors"].append({"step": after_rs["label"], "issues": after_rs.get("issues") or [], "op": after_rs["op"]})
                    # Reload the removed layout as a saved project would.
                    if layout_removed and page.evaluate("() => typeof window.app.applyLayout === 'function'"):
                        load_model(page, args.url, mid, bust + 450 + di)
                        page.evaluate("(L) => window.app.applyLayout(L)", layout_removed)
                        page.wait_for_timeout(250)
                        after_ld = check(page, f"reload-removed-{door_i}")
                        after_ld_op = page.evaluate("() => (window.app.getGarageOpeners && window.app.getGarageOpeners()) || []")
                        after_ld["op"] = {"openers": len(after_ld_op), "expect": len(before_op) - 1}
                        row["steps"].append(after_ld)
                        if after_ld["issues"] or len(after_ld_op) != len(before_op) - 1:
                            row["ok"] = False
                            row["errors"].append({"step": after_ld["label"], "issues": after_ld.get("issues") or [], "op": after_ld["op"]})
                    # Undo via applying the pre-remove layout should bring the opener back.
                    if layout_before and page.evaluate("() => typeof window.app.applyLayout === 'function'"):
                        page.evaluate("(L) => window.app.applyLayout(L)", layout_before)
                        page.wait_for_timeout(250)
                        after_un = check(page, f"undo-layout-{door_i}")
                        after_un_op = page.evaluate("() => (window.app.getGarageOpeners && window.app.getGarageOpeners()) || []")
                        after_un["op"] = {"openers": len(after_un_op)}
                        row["steps"].append(after_un)
                        if after_un["issues"] or len(after_un_op) != len(before_op):
                            row["ok"] = False
                            row["errors"].append({"step": after_un["label"], "issues": after_un.get("issues") or [], "op": after_un["op"]})

                # Resize every existing garage door to single, then (fresh load) to double —
                # one mutation per load so later doors are not tested on a dirty plan.
                sizes = ["single", "double"] if stock_idx else []
                for size in sizes:
                    for di, door_i in enumerate(stock_idx):
                        load_model(page, args.url, mid, bust + 1 + di + (0 if size == "single" else 50))
                        # indices are stable on a fresh load
                        res = page.evaluate("(args) => window.app.garageSize(args[0], args[1])", [door_i, size])
                        chk = check(page, f"resize-{door_i}-{size}")
                        chk["op"] = res
                        row["steps"].append(chk)
                        if not res or not res.get("ok"):
                            # Refusing because there truly is not enough wall is acceptable;
                            # a thrown/malformed result is not.
                            if res and res.get("why") and "not enough" in (res.get("why") or ""):
                                pass
                            else:
                                row["ok"] = False
                                row["errors"].append({"step": chk["label"], "op": res})
                        if chk["issues"]:
                            row["ok"] = False
                            row["errors"].append({"step": chk["label"], "issues": chk["issues"], "op": res})
                        # Screenshot the most interesting double-door result.
                        if size == "double" and mid in SHOT_MODELS and di == 0 and res and res.get("ok"):
                            shot_door(page, shots / f"gd_double_{mid}_after.png", close=False)
                            shot_door(page, shots / f"gd_double_{mid}_after_close.png", close=True)

                # Add single + double on a fresh load, trying each exterior garage wall.
                for size in ("single", "double"):
                    load_model(page, args.url, mid, bust + 200 + (1 if size == "double" else 0))
                    ext = page.evaluate(FIND_EXT_JS)
                    added = None
                    for ei in ext:
                        added = page.evaluate("(args) => window.app.addGarageDoor('ext', args[0], args[1])", [ei, size])
                        if added and added.get("ok"):
                            break
                    chk = check(page, f"add-{size}")
                    chk["op"] = added
                    chk["extWalls"] = ext
                    row["steps"].append(chk)
                    if ext and added and added.get("ok") and chk["issues"]:
                        row["ok"] = False
                        row["errors"].append({"step": chk["label"], "issues": chk["issues"], "op": added})
                    # If a wall was a garage wall and the add returned something other than
                    # ok or a clear "not enough" / in-the-way refusal, flag it.
                    if ext and added and not added.get("ok"):
                        why = (added.get("why") or "").lower()
                        if "not enough" not in why and "in the way" not in why and "shorter" not in why:
                            row["ok"] = False
                            row["errors"].append({"step": chk["label"], "op": added})
                    if size == "double" and mid in SHOT_MODELS and (not stock_idx) and added and added.get("ok"):
                        shot_door(page, shots / f"gd_double_{mid}_after.png", close=False)
                        shot_door(page, shots / f"gd_double_{mid}_after_close.png", close=True)

            except Exception as e:
                row["ok"] = False
                row["errors"].append({"step": "run", "error": repr(e)})
            if not row["ok"]:
                failed += 1
            report.append(row)
            status = "PASS" if row["ok"] else "FAIL"
            nstock = len(row.get("stockDoors") or [])
            print(f"{status}  {mid:16s}  stock={nstock}  doors={row.get('nDoors')}  errors={len(row['errors'])}", flush=True)
            if row["errors"]:
                print("   ", json.dumps(row["errors"], default=str)[:800], flush=True)

        browser.close()

    out = shots / "gd_check_report.json"
    out.write_text(json.dumps({"failed": failed, "passed": len(report) - failed, "total": len(report), "models": report}, indent=2))
    print(f"\n{len(report) - failed}/{len(report)} models passed. Report: {out}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
