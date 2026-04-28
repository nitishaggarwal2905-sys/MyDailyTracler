# MyDailyTracler

A simple, fast website to track your day-to-day time usage and get a weekly productivity report. Local-first; optionally syncs to Supabase so your data follows you across devices.

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
- `config.js` — paste your Supabase URL + anon key here
- `sync.js` — Supabase sync layer (no-op if config is empty)
- `supabase/schema.sql` — table + row-level-security setup
- `vercel.json` — Vercel deployment config

## Get your files locally

In a terminal on your computer:

```bash
cd ~/Desktop
git clone https://github.com/nitishaggarwal2905-sys/MyDailyTracler.git tracker
cd tracker
git checkout claude/activity-time-tracker-AfzIq
```

You'll have a `tracker/` folder on your desktop with everything.

## Connect Supabase (so data persists across devices)

1. Sign up at <https://supabase.com> and create a new project (free tier is fine).
2. In **Project Settings → API**, copy the **Project URL** and **anon public** key.
3. Open `config.js` and paste them in:
   ```js
   window.SUPABASE_CONFIG = {
     url: "https://xxxxx.supabase.co",
     anonKey: "eyJhbGci...",
   };
   ```
4. In the Supabase dashboard, open **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and click **Run**.
5. In **Authentication → Providers**, enable **Anonymous Sign-Ins** (toggle on, save). This lets the app create an identity for you on first load — no login screen.
6. Reload the site. The badge under the title should turn green and say **Synced**.

If `config.js` is left blank, the app keeps running entirely in localStorage (offline-only mode). Nothing breaks.

## Deploy to Vercel

**Option A — via the Vercel dashboard (easiest):**

1. Push the repo to GitHub (already done).
2. Go to <https://vercel.com/new> and **Import** the `MyDailyTracler` repo.
3. Framework preset: **Other** (it's a static site).
4. Root directory: leave as `./`. Build command and output directory: leave blank.
5. Click **Deploy**. You'll get a `*.vercel.app` URL.

**Option B — via CLI:**

```bash
npm i -g vercel
cd ~/Desktop/tracker
vercel
# follow prompts; accept defaults
vercel --prod   # to ship the production URL
```

Because `config.js` is committed (it only contains *public* anon keys, which is fine — security comes from Supabase Row Level Security), Vercel needs no environment variables. Just deploy.

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
