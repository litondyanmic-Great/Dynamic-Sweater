# Factory QMS (Quality Management System)

A React + Vite web app for garment factory production & quality tracking:
orders, yarn/stage stock transfer, hourly DHU% entry, defect tracking,
traffic-light audits, "0" thread rating boards, dashboards, and CSV/print
reports.

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
```

This outputs a static site to `dist/`.

## Deploy to Netlify

**Option A — drag & drop (fastest):**
1. Run `npm run build` locally.
2. Go to https://app.netlify.com/drop and drag the `dist` folder in.

**Option B — connect a Git repo:**
1. Push this project to a GitHub/GitLab repo.
2. In Netlify: "Add new site" → "Import an existing project" → pick the repo.
3. Netlify will read `netlify.toml` automatically:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Click Deploy.

## Data storage — important

By default this app stores **all data in the browser's localStorage** —
no backend required, works immediately after deploy. This means data is
per-device/per-browser (clearing browser data will erase it, and it
won't sync between different computers/phones).

If you want real multi-device / multi-user cloud sync, you can optionally
connect Firebase:

1. Create a free project at https://console.firebase.google.com
2. Enable **Firestore Database** and **Anonymous Authentication**.
3. Copy your Firebase Web config.
4. Create a `.env` file (see `.env.example`) and set:
   ```
   VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}
   ```
5. In Netlify: Site settings → Environment variables → add the same variable,
   then redeploy.

## Optional: AI Daily Report

The "AI Report" feature calls the Google Gemini API. To enable it, get a
free key at https://aistudio.google.com/apikey and set `VITE_GEMINI_API_KEY`
the same way as above (`.env` locally, Netlify env vars in production).
Without a key, that one button simply won't generate a report — everything
else works normally.

## Logo

Replace `public/logo.png` with your company's own logo (same filename,
or update `COMPANY_LOGO` near the top of `src/App.jsx`).

## Default login accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@factory.com | Password123 |
| Yarn Manager | yarnstore@factory.com | 123 |
| Section QI (per stage) | `<stage>@factory.com` e.g. `knitting@factory.com`, `sewing@factory.com`, `pqc@factory.com` | 123 |

(Stages: Knitting, Linking, Trimming, Mending, Light Check, Wash, Final Light
Check, Iron, Sewing, Attachment, PQC, Final/Getup — email is the stage name
lowercased with spaces/slashes removed.)

**⚠️ Change these credentials before using this in production** — they're
hardcoded in `src/App.jsx` (`ALL_USERS`) for demo purposes and are not a
real authentication system.
