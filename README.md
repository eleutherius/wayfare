# Wayfare — personal travel guide

Static site built with Astro 5. Each place is a Markdown file with typed
frontmatter; routes reference places by slug. Deployed to GitHub Pages.

## Quick start

```bash
pnpm install
pnpm dev             # → http://localhost:4321
pnpm build           # production build in dist/
pnpm preview         # serve dist/ locally
```

## Adding a place

Create `src/content/places/<slug>.md`:

```markdown
---
title: "Roast Coffee Co."
lat: 13.7296
lng: 100.5393
category: coffee       # coffee | food | sight | viewpoint | stay | other
city: Bangkok
date: 2025-03-15
cover: ../../assets/images/roast-coffee.jpg   # optional, relative from the file
rating: 4              # optional, 1-5
---

Your story here in Markdown.
```

The slug becomes the URL: `/places/<slug>`. The `cover` image is optimized
at build time via `astro:assets` — keep originals ≤ 2 MB in the repo, or
reference a URL from R2/Cloudinary for large galleries.

## Adding a route

Create `src/content/routes/<slug>.md`:

```markdown
---
title: "Afternoon in Silom"
city: Bangkok
mode: walking          # walking | transit | mixed
date: 2025-03-15       # optional
track: tracks/silom.geojson   # optional, path inside public/
stops:
  - place: bangkok-roots-coffee    # must match a slug in places/
    arrive: "14:00"
    stay: 45
    note: "Optional stop note shown in the timeline."
  - place: bangkok-wat-pho
    arrive: "15:30"
    stay: 60
---

Intro narrative for the route.
```

Build will fail loudly if a `place` slug doesn't exist — that's intentional.

## KML workflow (Google My Maps → route line)

1. Draw your route line in [Google My Maps](https://mymaps.google.com).
2. Open the layer menu (⋮) → **Download KML**.
3. Convert:
   ```bash
   node scripts/kml-to-geojson.mjs my-route.kml public/tracks/my-route.geojson
   ```
4. Set `track: "tracks/my-route.geojson"` in the route frontmatter.
5. Commit and push.

The Leaflet map on the route page will draw the line over the stop markers.

## Generating a PDF

The print view for a route lives at `/routes/<slug>.print`.
It uses a separate print-only layout with no interactive widgets.

The script starts the dev server automatically if none is running.

```bash
# Generate PDF (server auto-starts if needed)
pnpm build-pdf morning-bangkok
# → morning-bangkok.pdf saved in the project root

# Custom output path
pnpm build-pdf morning-bangkok output/guides/morning-bangkok.pdf

# Against a deployed site
node scripts/build-pdf.mjs morning-bangkok \
  --base-url https://you.github.io \
  --base /wayfare
```

If Playwright browser binaries are missing on first run:

```bash
pnpm exec playwright install chromium
```

## Deploy (GitHub Pages)

Push to `main` — the Actions workflow builds and deploys automatically.

For a **project pages** site (`github.com/you/repo`):
- Set `SITE_URL` and `BASE_PATH` in the workflow, or rely on the defaults
  that read `github.repository_owner` and `github.event.repository.name`.

For a **user/org site** (`you.github.io`):
- Set `BASE_PATH` to `""` in the workflow env.

## Image hosting

Photos ≤ 2 MB: commit to `src/assets/images/` and reference from frontmatter.

Large galleries: host on [Cloudflare R2](https://developers.cloudflare.com/r2/)
or [Cloudinary](https://cloudinary.com/) and reference by URL in Markdown body.
Astro's `<Image>` component accepts remote URLs when `domains` is configured in
`astro.config.mjs`.

## Project layout

```
src/
  assets/images/       photos (git-tracked, optimized at build)
  components/
    LeafletMap.astro   client-side map, never SSR
    MapLinks.astro     Google + Apple buttons
    PlaceCard.astro
    RouteTimeline.astro
  content/
    config.ts          zod schemas for places + routes
    places/            one .md per place
    routes/            one .md per route
  layouts/
    Base.astro         screen layout
    print/
      RoutePrint.astro  print-only layout (no Leaflet, @page CSS)
  lib/
    maplinks.ts        URL helpers (no API keys)
    validate-references.ts  build-time slug check
  pages/
    index.astro
    map.astro
    places/[slug].astro
    category/[category].astro
    city/[city].astro
    routes/[slug].astro
    routes/[slug].print.astro
public/
  favicon.svg
  tracks/              GeoJSON track files
scripts/
  kml-to-geojson.mjs
  build-pdf.mjs
```
