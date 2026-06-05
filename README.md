# Field Project Tracker

A lightweight web app for tracking field projects — create, edit, complete, and manage projects with
a **title, status, priority, notes, due date, and location** — shown both as a **table** and on an
interactive **map**. Each project also carries a live **Site Risk** indicator derived from current
weather at its coordinates. Locations can be entered as coordinates or found by typing an address.

## Third-party integrations

All three are keyless, so the app runs locally with no API keys or accounts.

| Integration | Used for | Why it's behind a seam |
| --- | --- | --- |
| **Open-Meteo** (weather) | Live conditions per project location → computed Site Risk | Reached only through the `WeatherProvider` port; swap providers by writing one adapter |
| **MapLibre GL + OpenFreeMap** (map) | Plotting projects, marker/row selection, risk popups | Reached only through the `MapAdapter` port; swap to Mapbox/Google by writing one adapter |
| **Nominatim** (OpenStreetMap geocoding) | Find a site by typing an address; fills its coordinates | Reached only through the `Geocoder` port; swap geocoders by writing one adapter |

## Architecture

One rule, applied symmetrically on both sides: **dependencies point in one direction, and every
external system is reached through an interface (a "port") whose concrete implementation (an
"adapter") is injected at a composition root.**

**Backend** (`packages/server`)

```
api/      Express routers + zod validation        (HTTP <-> domain)
  v
domain/   services + risk thresholds              (business rules)
  v
ports/    ProjectRepository, WeatherProvider, Geocoder   (interfaces)
  ^ implemented by
adapters/ SQLite, Open-Meteo, Nominatim                  (the seams)
```

**Frontend** (`packages/web`) — the mirror image

```
ui/                React components                 (render + events)
  v
app/               hooks / view-models              (state + orchestration)
  v
data/              ProjectGateway (interface)        Map: MapAdapter (interface)
  ^ implemented by                                    ^ implemented by
HttpProjectGateway (fetch — the API seam)            MapLibre adapter (the map seam)
```

`packages/shared` holds the TypeScript contract (Project, enums, DTOs, weather/risk types) imported
by both sides — the single source of truth across the API seam. See [CLAUDE.md](./CLAUDE.md) for the
layer rules in detail.

## Tech stack

TypeScript end-to-end · Express + better-sqlite3 + zod (API) · React + Vite + MapLibre GL (web) ·
Vitest (tests) · npm workspaces.

## Project layout

```
packages/
  shared/   contract types shared across the API seam
  server/   Express API (api / domain / ports / adapters / main.ts)
  web/      React app   (ui / app / data / integrations/map / main.tsx)
```

## Getting started

Prerequisites: Node.js 20+ (developed on 22) and npm.

```bash
npm install            # installs all workspaces (compiles better-sqlite3 natively)
npm run dev            # starts API on :4000 and web on :5173
```

Open http://localhost:5173. No configuration is required; defaults are sensible and the external
APIs are keyless. To customize, copy `.env.example` to `.env`.

### Useful commands

```bash
npm run dev:server     # API only
npm run dev:web        # web only
npm test               # run all tests
npm run typecheck      # type-check all workspaces
```

## API

Base URL `http://localhost:4000`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Liveness check |
| GET | `/api/projects` | List projects (newest first) |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/:id` | Get one project |
| PUT | `/api/projects/:id` | Update (partial) |
| PATCH | `/api/projects/:id/complete` | Mark complete |
| DELETE | `/api/projects/:id` | Delete |
| GET | `/api/projects/:id/weather` | Current weather + computed Site Risk |
| GET | `/api/geocode?q=` | Search an address → candidate coordinates |

## Configuration

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `4000` | API port |
| `DB_PATH` | `./data/field-tracker.db` | SQLite file; `:memory:` for ephemeral |
| `OPEN_METEO_BASE_URL` | `https://api.open-meteo.com` | Weather provider base URL |
| `NOMINATIM_BASE_URL` | `https://nominatim.openstreetmap.org` | Geocoding provider base URL |
| `GEOCODER_USER_AGENT` | `field-project-tracker/0.1` | Identifies the app to Nominatim (its usage policy) |
| `WEB_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `VITE_API_BASE_URL` | `http://localhost:4000` | API base URL the web app calls |
| `VITE_MAP_STYLE_URL` | OpenFreeMap "liberty" | Map style URL |

## Testing

Backend logic (project lifecycle, risk thresholds, weather normalization) is covered by Vitest:

```bash
npm run test --workspace @field-tracker/server
```

The full UI flow (CRUD, map marker ↔ row selection, risk badges and popups) was verified end-to-end
in a real browser during development.

## Deployment

In production the app runs as a **single service**: the API also serves the built React app, so the
whole thing is one origin (no CORS, one URL). `npm run build` produces `packages/web/dist` (static
SPA) and `packages/server/dist/main.cjs` (the API bundled with esbuild); `npm start` runs the bundle,
which serves the SPA when that build is present.

Run the production build locally:

```bash
npm run build
PORT=8080 npm start     # open http://localhost:8080
```

### Render (one-click via Blueprint)

The repo ships a [`render.yaml`](./render.yaml) Blueprint for a free Render web service:

1. Push to GitHub.
2. Render dashboard → **New → Blueprint** → select this repo → **Apply**.
3. Render runs `npm ci --include=dev && npm run build`, starts it with `npm start`, and health-checks
   `/api/health`. No secrets needed — every integration is keyless.

Notes: the free tier sleeps after ~15 min idle (first request cold-starts); data uses **ephemeral
SQLite** and resets on each redeploy. For durable data, mount a disk and point `DB_PATH` at it, or
swap the repository adapter for Postgres.
