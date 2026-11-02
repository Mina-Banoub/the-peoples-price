#!/usr/bin/env python3
"""Build docs/data.json for The People's Price from the BLS Public Data API.

Usage:
  BLS_API_KEY=... python3 scripts/update.py          # fetch from BLS and rebuild
  python3 scripts/update.py --seed data/seed.json    # rebuild from a saved summary (no network)

Rules (see README):
  * Base price = average of the base year's monthly values (needs all 12 months
    unless the item sets "min2019" in config/items.json).
  * The latest value must be no older than `freshMonths` behind the newest month
    in the data, or the item/region is left out (regions then fall back to national).
  * An item with no usable national figure is dropped and listed in the report.
  * If the run looks broken (API errors, or more than 10% of items missing), the
    script exits with an error and leaves the existing data.json untouched.
"""
import json, os, sys, time, urllib.request, urllib.error, datetime, argparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG_PATH = os.path.join(ROOT, "config", "items.json")
OUT_PATH = os.path.join(ROOT, "docs", "data.json")
REPORT_PATH = os.path.join(ROOT, "data", "report.md")
API = "https://api.bls.gov/publicAPI/v2/timeseries/data/"


def series_id(src, code, area):
    kind = src.split(":")[0]
    if kind == "AP":
        return "APU" + area + code
    if kind == "CU":
        return "CUUR" + area + code  # not seasonally adjusted
    raise ValueError(src)


def fetch(ids, key, start, end):
    """Return {series_id: [(YYYY-MM, value), ...]} using batches of 50."""
    out, problems = {}, []
    for i in range(0, len(ids), 50):
        body = {"seriesid": ids[i:i + 50], "startyear": str(start), "endyear": str(end)}
        if key:
            body["registrationkey"] = key
        req = urllib.request.Request(API, data=json.dumps(body).encode(),
                                     headers={"Content-Type": "application/json",
                                              "User-Agent": "the-peoples-price/1.0"})
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=60) as r:
                    res = json.load(r)
                break
            except (urllib.error.URLError, TimeoutError) as e:
                if attempt == 2:
                    raise SystemExit(f"BLS API request failed: {e}")
                time.sleep(5 * (attempt + 1))
        if res.get("status") != "REQUEST_SUCCEEDED":
            raise SystemExit(f"BLS API error: {res.get('status')} {res.get('message')}")
        for m in res.get("message") or []:
            if "does not exist" not in m and "No Data Available" not in m:
                problems.append(m)
        for s in res["Results"]["series"]:
            pts = []
            for d in s.get("data", []):
                p = d.get("period", "")
                try:
                    v = float(d["value"])
                except (ValueError, KeyError):
                    continue
                if p.startswith("M") and p != "M13":
                    pts.append((f"{d['year']}-{p[1:]}", v))
                elif p.startswith("Q"):
                    pts.append((f"{d['year']}-Q{int(p[1:])}", v))
            if pts:
                out[s["seriesID"]] = sorted(pts)
        time.sleep(1)
    return out, problems


def summarize(points, base_year):
    base = [v for ym, v in points if ym.startswith(f"{base_year}-")]
    last = points[-1]
    return [sum(base) / len(base) if base else None, len(base), last[0], last[1]]


def months_between(a, b):
    ya, ma = map(int, a.split("-")); yb, mb = map(int, b.split("-"))
    return (yb - ya) * 12 + (mb - ma)


def build(cfg, summ, wage, prev):
    regions = list(cfg["regions"].keys())
    newest = max(s[2] for it in summ.values() for s in it.values() if s)
    items, dropped, notes = [], [], []
    prev_cur = {it["id"]: it["r"]["0000"].get("cur") for it in (prev or {}).get("items", []) if "0000" in it.get("r", {})}
    for it in cfg["items"]:
        need = it.get("min2019", 12)
        r = {}
        for a in regions:
            s = summ.get(it["series"], {}).get(a)
            if not s or s[0] is None:
                continue
            base, n, dt, cur = s
            if n < (need if a == "0000" else min(need, 6)):
                continue
            fresh = months_between(dt, newest) <= cfg["freshMonths"]
            if not fresh and a != "0000":
                continue
            if it.get("kind") == "index":
                cur, base = 100 * cur / base, 100.0
            r[a] = {"base": round(base, 4), "cur": round(cur, 4), "dt": dt}
            if not fresh:
                r[a]["stale"] = True
        if "0000" not in r or r["0000"].get("stale"):
            dropped.append(f"{it['name']} ({it['series']}): no usable national {'base' if '0000' not in r else 'current'} price")
            continue
        pc = prev_cur.get(it["id"])
        if pc:
            ch = (r["0000"]["cur"] / pc - 1) * 100
            if abs(ch) >= cfg["jumpWarnPct"]:
                notes.append(f"{it['name']}: national price moved {ch:+.0f}% since the last update ({pc} → {r['0000']['cur']}). Check before publishing.")
        out = {k: it[k] for k in ("id", "name", "desc", "unit", "cat") if k in it}
        out["note"] = it.get("note", "")
        if it.get("kind"):
            out["kind"] = it["kind"]
        out["r"] = r
        items.append(out)
    y, m = map(int, newest.split("-"))
    asof_months = (y - cfg["baseYear"]) * 12 + m - 7  # months from mid-base-year
    data = {"asof": newest, "monthsSinceBase": asof_months,
            "wage19": round(wage["base"], 2), "wageNow": wage["now"], "wageQ": wage["label"],
            "updated": datetime.date.today().isoformat(), "items": items}
    return data, dropped, notes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", help="build from a saved summary JSON instead of the API")
    args = ap.parse_args()
    cfg = json.load(open(CFG_PATH))
    prev = json.load(open(OUT_PATH)) if os.path.exists(OUT_PATH) else None
    regions = list(cfg["regions"].keys())
    problems = []
    if args.seed:
        seed = json.load(open(args.seed))
        summ = {}
        for it in cfg["items"]:
            kind, code = it["series"].split(":")
            summ[it["series"]] = seed[kind].get(code, {})
        wage = seed["wage"]
    else:
        key = os.environ.get("BLS_API_KEY", "")
        if not key:
            raise SystemExit("BLS_API_KEY is not set.")
        year = datetime.date.today().year
        ids, back = [], {}
        for it in cfg["items"]:
            for a in regions:
                sid = series_id(it["series"], it["series"].split(":")[1], a)
                ids.append(sid); back[sid] = (it["series"], a)
        ids.append(cfg["wageSeries"])
        raw, problems = fetch(ids, key, cfg["baseYear"], year)
        summ = {}
        for sid, pts in raw.items():
            if sid in back:
                src, a = back[sid]
                summ.setdefault(src, {})[a] = summarize(pts, cfg["baseYear"])
        w = raw.get(cfg["wageSeries"])
        if not w:
            raise SystemExit("Wage series missing from BLS response.")
        base = [v for p, v in w if p.startswith(f"{cfg['baseYear']}-Q")]
        if len(base) != 4:
            raise SystemExit("Wage series is missing base-year quarters.")
        lp, lv = w[-1]
        wage = {"base": sum(base) / 4, "now": lv, "label": f"Q{lp[-1]} {lp[:4]}"}
    data, dropped, notes = build(cfg, summ, wage, prev)
    if prev:
        strip = lambda d: {k: v for k, v in d.items() if k != "updated"}
        if strip(data) == strip(prev):
            data["updated"] = prev.get("updated", data["updated"])
            print("No new BLS data since the last update.")
    if len(data["items"]) < 0.9 * len(cfg["items"]):
        raise SystemExit(f"Only {len(data['items'])} of {len(cfg['items'])} items are usable. Not overwriting data.json.\n" + "\n".join(dropped))
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(data, f, separators=(",", ":"), ensure_ascii=False)
    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    lines = [f"# Data report — {data['updated']}", "",
             f"- Prices through **{data['asof']}**; pay from **{data['wageQ']}** (${data['wage19']} in {cfg['baseYear']} → ${data['wageNow']}).",
             f"- Items published: **{len(data['items'])}** of {len(cfg['items'])}.", ""]
    lines += ["## Needs a look", ""] + ([f"- {n}" for n in notes] or ["- Nothing unusual."]) + [""]
    lines += ["## Left out", ""] + ([f"- {d}" for d in dropped] or ["- None."]) + [""]
    if problems:
        lines += ["## Messages from BLS", ""] + [f"- {p}" for p in problems] + [""]
    open(REPORT_PATH, "w").write("\n".join(lines))
    print("\n".join(lines))


if __name__ == "__main__":
    main()
