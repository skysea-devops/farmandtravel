# Farm & Travel — Frontend

React SPA for the Farm & Travel platform. Lives in the same repo as the infra
(monorepo) so it can deploy through the same GitHub OIDC role later.

**Stack:** Vite 8 · React 19 · TypeScript · Tailwind CSS v4 · React Router 7

## Run locally

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Other scripts:
```bash
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
npm run lint       # oxlint
```

## Structure

```
src/
  main.tsx              app entry (BrowserRouter)
  App.tsx               routes
  index.css             Tailwind import + design tokens (@theme)
  config/
    site.ts             brand + nav
    membership.ts       the 4 membership types (single source of truth)
  types/
    domain.ts           Experience, Project, SupporterPreview, ...
  data/
    mock.ts             placeholder content (swap for apiFetch in Sprint 2/3)
  lib/
    api.ts              thin fetch client -> VITE_API_URL
    cn.ts               className joiner
  components/
    ui/                 Button, Card, Eyebrow, Tag
    layout/             Header, Footer, RootLayout
  features/
    home/               HomePage (hero + diptych + membership strip)
    experiences/        ExperiencesPage (browse, mock data + stub filters)
    projects/           ProjectsPage (+ supporter privacy preview)
    misc/               NotFoundPage
```

Feature-based: each module (`experiences`, `projects`, `auth` later) owns its
pages under `features/`. Shared primitives live in `components/ui`.

## Design tokens

The eco/almanac identity lives in `src/index.css` under `@theme`. Change a token
there and it propagates everywhere (e.g. `--color-field`, `--color-harvest`,
`--font-display`). Fonts (Fraunces + Public Sans) load from Google Fonts in
`index.html`.

| token            | value     | use                    |
|------------------|-----------|------------------------|
| `--color-paper`  | `#eef0e6` | page background        |
| `--color-ink`    | `#1d3527` | primary text (pine)    |
| `--color-field`  | `#2c5a3f` | primary green          |
| `--color-harvest`| `#c79328` | accent (harvest gold)  |
| `--color-stone`  | `#cbc9b6` | hairlines / borders    |

## Backend wiring (later)

- `VITE_API_URL` is empty until Sprint 1. Copy `.env.example` to `.env` and set it
  once the API Gateway URL exists. `src/lib/api.ts` is the only place that reads it.
- Auth (Cognito) and real data replace the mock arrays in Sprint 2/3.
- Hosting (S3 + CloudFront) and a deploy workflow are deferred until the app is
  further along.
