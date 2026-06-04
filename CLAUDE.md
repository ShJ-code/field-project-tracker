# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A lightweight **field project tracker**: CRUD over projects (title, status, priority, notes, due
date, lat/long) shown in a **table** and on a **map**, with a live **site-risk** indicator derived
from on-site weather. Built as a clean, layered architecture demo — keep it legible.

## Commands

Run from the repo root unless noted. The repo uses npm workspaces (`packages/*`).

```bash
npm install                              # install all workspaces (compiles better-sqlite3)
npm run dev                              # run API + web together (concurrently)
npm run dev:server                       # API only  -> http://localhost:4000
npm run dev:web                          # web only  -> http://localhost:5173
npm test                                 # all workspace tests
npm run typecheck                        # tsc --noEmit across workspaces
npm run build                            # production build (web)

# Backend tests (vitest) — run a subset:
npm run test --workspace @field-tracker/server -- risk        # only files matching "risk"
npm run test --workspace @field-tracker/server -- -t "high wind"   # only tests matching a name
```

There is no separate build step for `@field-tracker/shared`: its TypeScript source is consumed
directly via a path alias (see below). SQLite auto-migrates on boot. Open-Meteo and the OpenFreeMap
map tiles are keyless, so no secrets are needed for local dev.

## Architecture — the one rule

**Dependencies point in one direction, and every external system is reached through an interface (a
"port") whose concrete implementation (an "adapter") is injected at a composition root.** This is
applied symmetrically on the backend and the frontend. When adding code, put it in the right layer
and never make a lower layer import an upper one.

### Backend (`packages/server/src`)
```
api/        Express routers + app factory + zod validation     (HTTP <-> domain)
domain/     ProjectService, SiteWeatherService, GeocodingService, risk.ts   (business rules)
ports/      ProjectRepository, WeatherProvider, Geocoder         (interfaces only)
adapters/   Sqlite…, OpenMeteo…, Nominatim… (geocoder)           (the seams)
main.ts     composition root: builds adapters, injects them, starts the server
```
- `domain/` imports only `ports/` + `@field-tracker/shared`. It must not import Express, the DB
  driver, or `fetch`.
- `adapters/` are the **only** files allowed to import `better-sqlite3` / call `fetch` to an external
  service (Open-Meteo, Nominatim).
- Risk thresholds live in `domain/risk.ts` (a business rule), **not** in the weather adapter. The
  adapter only normalizes the provider response into `WeatherSnapshot`.
- Repository methods are `async` even though SQLite is synchronous, so the port can later be backed
  by a remote store without changing the domain.

### Frontend (`packages/web/src`) — mirror image
```
ui/                 React components (render + events only)
app/                gateway-context (DI), use-projects, use-site-weather (state/orchestration)
data/               ProjectGateway (port) + HttpProjectGateway (the API seam; only file using fetch)
integrations/map/   MapAdapter (port) + maplibre-adapter (only file importing maplibre-gl)
main.tsx            composition root: builds gateway + map factory, injects via props/context
```
- UI components never call `fetch` and never import `maplibre-gl`; they go through the gateway and
  the `MapAdapter`. To swap the map provider, write a new adapter satisfying `MapAdapter` and change
  the one line in `main.tsx`.

### Shared contract (`packages/shared/src/index.ts`)
Types only (Project, enums, DTOs, weather/risk), imported by both sides as `@field-tracker/shared`.
This is the single source of truth across the API seam.

## Conventions that aren't obvious

- **Local imports use explicit `.js` extensions** (e.g. `./risk.js` for `risk.ts`). This is required
  for the server's Node ESM runtime and works for the web via Vite; keep it consistent on both sides.
- **The shared package is resolved to source via a path alias**, declared in three places that must
  stay in sync: each `tsconfig.json` (`paths`), `packages/web/vite.config.ts` (`resolve.alias`), and
  `packages/server/vitest.config.ts` (`resolve.alias`).
- **Config**: the server reads env via `process.loadEnvFile()` + `src/config.ts` defaults; the web
  reads `import.meta.env.VITE_*`. See `.env.example`.
- New API request bodies are validated with zod in `api/validation.ts`; domain errors
  (`NotFoundError`) are translated to status codes in `api/app.ts`'s error handler.

## Verifying changes

Backend logic is covered by vitest (`packages/server/tests`). For anything user-facing, run the app
(`npm run dev`) and drive a real browser — the project was built and checked end-to-end with
Playwright (CRUD, map marker<->row sync, risk badges/popups), not by reading code alone.
