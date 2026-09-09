# nightcomic v41 UI Fix

Applied directly to the nightcomic v40 project source.

## Changes
- Homepage `همه ژانرها` is forced into a vertical full-width list, matching the compact card rhythm of the latest/newest work sections.
- Explore search/filter/rating controls are compact on mobile.
- The old empty-library card is removed: when bookmarks are empty or the user is not logged in, the large empty-state card is not rendered.
- CSS and JS assets use `?v=41` cache-busting so an older browser cache is less likely to keep the previous UI.

## Validation
- `node --check public/js/app.js`
- `node --check server.js`
- ZIP archive integrity test passed with `unzip -t`.
