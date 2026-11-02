# The People's Price

What everyday items would cost today if their prices had risen only as fast as a typical paycheck since 2019.

**People's Price = 2019 average price × (median weekly pay now ÷ median weekly pay in 2019)**

The site compares that with today's average price, and with a stricter benchmark: the 2019 price grown 2% a year (the Federal Reserve's inflation target).

## What's in this repository

| Path | What it is |
|---|---|
| `docs/index.html` | The website (served by GitHub Pages). Built from `src/`. |
| `docs/data.json` | All prices and pay figures the site shows. Updated when BLS publishes new data (once a month). |
| `config/items.json` | The list of tracked items and the rules. Edit this to add or remove items. |
| `scripts/update.py` | Downloads the latest data from the BLS Public Data API and rebuilds `docs/data.json`. |
| `scripts/build_site.py` | Rebuilds `docs/index.html` from `src/head.html`, `src/body.html` and `src/app.js`. |
| `data/report.md` | A short report from the latest update: what changed, anything that needs a look, anything left out. |
| `data/seed.json` | The BLS figures used for the first version (from the October 14, 2026 release). |
| `.github/workflows/update.yml` | Checks BLS for new data every Wednesday, and on demand. Commits only when something changed. |

## Data sources

- **Goods:** BLS Average Price Data (series `APU…`), national and the four census regions.
- **Services:** BLS Consumer Price Index, not seasonally adjusted (series `CUUR…`). Services have no single price, so the site shows them **per $100 spent in 2019**.
- **Pay:** BLS median usual weekly earnings, full-time wage and salary workers (`LEU0252881500`).

## Rules for including an item

1. The 2019 average needs all 12 months of 2019 (an item can allow fewer with `min2019`, e.g. coffee).
2. The latest price must be no more than 6 months older than the newest month in the data (`freshMonths`).
3. A region is used only when it passes both rules; otherwise the item falls back to national figures.
4. An item without a usable national price is left out and listed in `data/report.md`.
5. If more than 10% of items fail, or the BLS request errors, the update stops and keeps the previous data.
6. Any national price that moves 30% or more since the last update is flagged in the report (`jumpWarnPct`).

## Everyday tasks

- **Update now:** Actions → Weekly price check → Run workflow.
- **Pause updates:** Actions → Weekly price check → ⋯ → Disable workflow.
- **Add an item:** add an entry to `config/items.json`, e.g.
  `{"id": "honey", "series": "AP:718631", "name": "Honey", "desc": "", "unit": "lb", "cat": "Pantry"}`
  or for a service `{"id": "...", "series": "CU:SEXX", ..., "unit": "$100 spent in 2019", "cat": "Services", "kind": "index"}`.
  Item and CPI codes are listed in https://download.bls.gov/pub/time.series/ap/ap.item and https://download.bls.gov/pub/time.series/cu/cu.item.
  Then run the update.
- **Change the page:** edit files in `src/`, then run `python3 scripts/build_site.py` and commit `docs/index.html`.
- **Run locally:** `BLS_API_KEY=… python3 scripts/update.py` (or `python3 scripts/update.py --seed data/seed.json` without a key), then `python3 -m http.server -d docs` and open http://localhost:8000.

## A note on interpretation

A price above the People's Price isn't proof of overcharging. Some items cost more for real reasons (supply shocks, crop failures, herd sizes). The People's Price is a benchmark for affordability, not a judgment on any store.
