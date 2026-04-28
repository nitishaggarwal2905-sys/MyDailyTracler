# MyDailyTracler

A simple, fast, no-backend website to track your day-to-day time usage and get a weekly productivity report.

## Features

- **Quick Track**: Tap a category to start a live timer. Tap "Stop & Log" to save it.
- **Manual entry**: Already finished an activity? Log it directly in seconds.
- **9 default categories**: Sleep, Work, University, Exercise, Eating, Travel, Friends/Out, Scrolling, Misc.
- **Today view**: See a stacked bar of where your day is going, plus a chronological log you can edit or delete.
- **History**: Browse every past day grouped by date.
- **Weekly Report**: At the end of each week, get an overview, category breakdown, and personalized insights — including where you're wasting time and how to be more productive.
- **Local-first**: All data is stored in your browser's localStorage. Nothing leaves your device.
- **Export / Import**: JSON backup so you never lose your history.

## Run it

It's a static site — no build step, no dependencies.

```bash
# from the project root
python3 -m http.server 8000
# then open http://localhost:8000
```

Or open `index.html` directly in a browser.

## Files

- `index.html` — markup and tab structure
- `styles.css` — dark UI, mobile-friendly
- `app.js` — all logic (timer, storage, history, report, insights)

## Data

Entries are stored under the localStorage key `mydailytracler.entries.v1`. Each entry:

```json
{
  "id": "string",
  "categoryId": "sleep|work|university|exercise|eating|travel|social|scrolling|misc",
  "start": "ISO timestamp",
  "end":   "ISO timestamp",
  "minutes": 45,
  "note": ""
}
```
