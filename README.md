# Manan Tracker — Deployment Guide

## Project Structure

```
tracker/
├── netlify.toml                    # Netlify config + scheduled functions
├── package.json
├── supabase-schema.sql             # Paste into Supabase SQL editor
├── public/
│   ├── index.html                  # Main frontend
│   ├── sw.js                       # Service worker (push + offline)
│   └── manifest.json               # PWA manifest
└── netlify/
    └── functions/
        ├── save-day.js             # POST: upsert daily log to Supabase
        ├── get-days.js             # GET: fetch logs
        ├── ai-analyze.js           # POST: Gemini AI (summarize/analyze/suggest)
        ├── save-subscription.js    # POST: save push subscription
        └── send-reminder.js        # SCHEDULED: 7:30 AM IST daily push

your-repo/
├── netlify.toml
├── package.json
├── README.md
├── supabase-schema.sql
├── public/
│   ├── index.html
│   ├── sw.js
│   ├── manifest.json
│   └── icons/           ← create this folder, add your icon PNGs here
└── netlify/
    └── functions/
        ├── save-day.js
        ├── get-days.js
        ├── ai-analyze.js
        ├── save-subscription.js
        └── send-reminder.js
```

---

## Step 1 — Supabase Setup

1. Go to https://supabase.com → open your project
2. Left sidebar → **SQL Editor** → New query
3. Paste the entire contents of `supabase-schema.sql` → click **Run**
4. Verify you see `daily_logs` and `push_subscriptions` in the Table Editor
5. Go to **Settings → API** and copy:
   - `Project URL` → you'll need this
   - `anon public` key → you'll need this
   - `service_role` key → you'll need this (keep it secret)

---

## Step 2 — Frontend: Add Your Keys

Open `public/index.html` and replace these two lines near the top of the `<script>` block:

```javascript
const SUPABASE_URL     = 'YOUR_SUPABASE_URL';       // ← paste Project URL
const SUPABASE_ANON    = 'YOUR_SUPABASE_ANON_KEY';  // ← paste anon public key
```

The VAPID_PUBLIC_KEY is already filled in. Do not change it.

---

## Step 3 — Add PWA Icons

You need two icon files for the PWA manifest and push notifications:

1. Create folder: `public/icons/`
2. Add `icon-192.png` (192×192 px) and `icon-512.png` (512×512 px)
3. A simple placeholder works fine — any square image resized to those dimensions

If you skip this step the app still works, but push notifications won't show an icon.

---

## Step 4 — Deploy to Netlify

### Option A — Netlify CLI (recommended)

```bash
# In the tracker/ directory:
npm install
npx netlify login
npx netlify init    # Select "Create & configure a new site"
                    # Build command: (leave blank)
                    # Publish directory: public
```

### Option B — Netlify UI (drag and drop)

1. Go to https://app.netlify.com
2. Sites → **Add new site → Import an existing project**
3. Connect your GitHub repo (push this folder to a GitHub repo first)
4. Build command: *(leave blank)*
5. Publish directory: `public`
6. Click **Deploy site**

---

## Step 5 — Set Environment Variables in Netlify

Go to: **Netlify → Site → Site configuration → Environment variables → Add a variable**

Add all of these:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_SERVICE_KEY` | Your Supabase `service_role` key |
| `GEMINI_API_KEY` | Your Gemini API key from aistudio.google.com |
| `VAPID_PUBLIC_KEY` | `BL7n3jZIUobBTFGMSbsKEcQdzaKjGsqHPSINdcoZh_fVit8kuGPznwaFUHG-c1w0a4k7mYCneohmrcFQAqB6NeY` |
| `VAPID_PRIVATE_KEY` | `MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgslT6NkJ3PRgSfOdDLghHXOCuAab-K6qKm6eQqHBpo6ChRANCAAS-5942SFKGwUxRjEm7ChHEHc2ioxrKhz0iDXXKGYf31YrfJLhj858GhVBxvnNcNGuJO5mAp3qIZq3BUAKgejXm` |

After adding variables → **Trigger deploy** (Deploys tab → Trigger deploy → Deploy site)

---

## Step 6 — Enable Push Reminders

1. Open your live Netlify URL in Chrome on your phone
2. Tap the **🔔 Reminders** button
3. Allow notifications when prompted
4. Done — you'll get a push at 7:30 AM IST every day

To install as a PWA on your phone:
- Chrome on Android → three-dot menu → **Add to Home screen**

---

## Scheduled Reminder Timing

The `send-reminder` function runs at `0 2 * * *` UTC = **7:30 AM IST**.
To change the time, edit `netlify.toml`:

```toml
[functions."send-reminder"]
  schedule = "0 2 * * *"    # UTC time — IST is UTC+5:30
```

Examples:
- 8:00 AM IST = `30 2 * * *`
- 9:00 AM IST = `30 3 * * *`

---

## Troubleshooting

**Tasks not saving:** Check Netlify Functions log (Site → Functions tab) for errors. Verify `SUPABASE_SERVICE_KEY` is set correctly (not the anon key).

**AI buttons returning error:** Check that `GEMINI_API_KEY` is set in env vars and the Gemini free tier hasn't been exhausted.

**Push notifications not arriving:** Supabase → Table Editor → `push_subscriptions` — verify your subscription was saved. Check Functions log for `send-reminder` errors.

**CORS errors locally:** Run with `npx netlify dev` instead of opening the HTML directly — this proxies the functions correctly.
