# Property Visual Explorer — Frontend

React + Vite dashboard and public property page for Property Visual
Explorer (Wayne E Solutions).

**This is the frontend only.** The API lives in a separate repo —
`property-visual-explorer-backend`. That repo must be running (locally or
deployed) for this app to actually do anything — this repo has no data of
its own.

## Setup

```bash
npm install
cp .env.example .env
```

## Running against a local backend

If the backend is running locally on its default port (3001), leave
`.env` blank — the dev server's proxy (see `vite.config.js`) forwards
`/api/...` calls there automatically.

```bash
npm run dev   # http://localhost:3000
```

## Running against a deployed backend (different address — e.g. AWS)

Set `VITE_API_BASE_URL` in `.env` to the backend's real URL, then build:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com npm run build
```

The URL gets baked into the compiled JS at build time — there's no
runtime config step after that. `dist/` is what you deploy (e.g. to
S3 + CloudFront on AWS).

**The backend also needs to know about this app's address** — its
`CORS_ORIGIN` env var must include wherever this frontend ends up
deployed, or every API call will be rejected by the browser. See the
backend repo's README.

## Project layout

```
src/
  api/
    config.js       # VITE_API_BASE_URL — where the backend lives
    apiClient.js     # axios instance, attaches the JWT automatically
  components/
    Login.jsx
    DashboardListings.jsx
    PropertyView.jsx        # the public, buyer-facing page
    PlotBoundaryTracer.jsx  # Google Maps polygon draw plot boundary tool
    ChangePassword.jsx
    PrivateRoute.jsx        # redirects to /login if not authenticated
```

## Dev login

Log in with the seed credentials from the backend repo:

| | |
|---|---|
| Email | admin@wayneesolutions.com |
| Password | Password123! |

## Known open item

Currently a plain client-side SPA — `/p/:slug` (the public, shareable
property page) has no server-rendered meta tags, so link previews on
WhatsApp/social won't show anything useful. Worth revisiting (e.g. moving
just that route to Next.js) before this is shared widely, since the whole
point of the product is the shareable link.
