# nightcomic v44 — deployment fix

Railway serves `public/` from `server.js`. The previous bootstrap could keep an old embedded frontend.

This version replaces that behavior: on every server startup, `bootstrap.js` copies the committed root
HTML/CSS/JS/assets into `public/`. Therefore the frontend actually deployed by Railway matches the
files committed to GitHub `main`.

UI changes retained from the project:
- Homepage genres are a vertical list styled like the works sections.
- Explore filter/rating controls are reduced on mobile.
- Empty bookmarks library card is hidden.
