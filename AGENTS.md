# Project Instructions

This is a static React + TypeScript + Vite app for an interactive fantasy world map.

- Keep the app static. Do not add a backend, server database, analytics, ads, or network-only runtime features.
- Keep map content data-driven through `public/data/map.config.json`, `public/data/progress-levels.json`, and `public/data/markers.json`.
- Use Leaflet or React Leaflet with `CRS.Simple` for the custom image map.
- Hidden spoiler markers must not be rendered in the DOM, and hidden marker images must not be preloaded.
- Preserve the two-step confirmation flow before changing progress levels.
- Store selected progress in `localStorage` using `fantasy-map-progress-level`.
- Keep code small and maintainable; prefer plain React state and focused utility functions.
- Run `pnpm test` and `pnpm build` before publishing changes.
