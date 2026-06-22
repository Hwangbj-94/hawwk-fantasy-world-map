# Fantasy World Map

Interactive React + TypeScript + Vite fantasy map for a static GitHub Pages site.

The app uses Leaflet with `CRS.Simple`, so the map is based on pixel coordinates from a custom image instead of real-world latitude and longitude.

## Run Locally

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

The static output is generated in `dist/`.

## Test

```bash
pnpm test
```

The tests cover marker filtering, the two-step spoiler confirmation flow, and the rule that hidden markers are not rendered.

## Deploy

This repository includes `.github/workflows/deploy.yml`.

1. Push to `main`.
2. In GitHub, open the repository settings.
3. Go to **Pages**.
4. Set the source to **GitHub Actions**.
5. The workflow builds, tests, uploads `dist/`, and deploys it to GitHub Pages.

The Vite `base` path is calculated from `GITHUB_REPOSITORY` during GitHub Actions builds, so project Pages URLs like `https://OWNER.github.io/REPO/` work without editing the config.

## Add Markers

Edit `public/data/markers.json`.

Each marker uses this shape:

```json
{
  "id": "grayharbor",
  "name": "Grayharbor",
  "type": "Port City",
  "position": { "x": 330, "y": 730 },
  "revealOrder": 1,
  "revealLabel": "Known from the prologue",
  "summary": "A short region summary.",
  "image": {
    "src": "assets/grayharbor.svg",
    "alt": "Grayharbor skyline"
  },
  "relatedEpisodes": ["Prologue", "Episode 1"],
  "tags": ["coast", "trade"]
}
```

`position.x` and `position.y` are pixel coordinates on the map image. A marker is visible only when its `revealOrder` is less than or equal to the selected progress level's `maxRevealOrder`.

The `image` field is optional. Marker images are only rendered when the marker is visible and its region detail modal is opened.

## Edit Progress Levels

Edit `public/data/progress-levels.json`.

Each level uses this shape:

```json
{
  "id": "episode-3",
  "label": "Episode 3",
  "maxRevealOrder": 3,
  "description": "Reveals places known after the first major journey."
}
```

The default level is set in `public/data/map.config.json`:

```json
{
  "defaultProgressLevelId": "prologue"
}
```

The user's selected level is saved in `localStorage` under:

```text
fantasy-map-progress-level
```

If the saved value does not match an existing progress level, the app falls back to the default level from `map.config.json`.

## Edit The Map Image

Edit `public/data/map.config.json`:

```json
{
  "mapImage": {
    "src": "assets/placeholder-map.svg",
    "alt": "Placeholder fantasy terrain map",
    "width": 1600,
    "height": 1000
  }
}
```

Put replacement images under `public/assets/`. SVG, PNG, JPG, and WebP all work in a static Pages build.

## Spoiler Protection Limits

This app hides spoiler markers from the rendered page and does not preload hidden marker images. That protects casual browsing and prevents hidden markers from appearing in the DOM.

Because GitHub Pages serves a public static repository, the JSON files and assets are still publicly accessible to anyone who opens the repository or directly downloads files from `public/data`. Do not place unreleased secrets, private plot notes, or sensitive canon in a public repo.
