# Lunaris — Quick Start

This is a complete, ready-to-run project. See the step-by-step guide in the
chat for full instructions, but the short version once Node.js and VS Code
are installed:

```
npm install
npm run dev
```

Then open the link it prints (usually http://localhost:5173) in your browser.

## What's inside

```
index.html          ← the page shell
package.json         ← lists the few packages this project needs
vite.config.js        ← build tool config (Vite) — no need to touch this
tailwind.config.js     ← Tailwind setup (scans src/ for classes used)
postcss.config.js      ← wires Tailwind into the build
src/
  main.jsx           ← starts the app, imports index.css
  index.css           ← Tailwind's three @tailwind directives — that's it
  Lunaris.jsx         ← the whole Lunaris site/app
  data/
    opportunities.js  ← the 54 scholarships/schemes — edit this to add more
  utils/
    matching.js        ← the eligibility-matching logic
```

## Note on styling

Tailwind is installed as a real build dependency (not a CDN script), so the
site works fully offline and in restricted networks — `npm install` pulls
everything it needs once, and every `npm run dev`/`build` after that compiles
your own local copy.

## Theme system (dark/light)

Colors live in one place: the CSS custom properties defined near the top of
`GlobalStyles()` inside `Lunaris.jsx`, under `:root, [data-theme="dark"]` and
`[data-theme="light"]`. Everything else in the app — text, borders, glows,
buttons, cards, the starfield canvas — reads from those variables (via the
small `tokens` object or directly), so retouching the palette only ever
means editing those two blocks. The dark/light toggle is the existing Sun
icon in the navbar; it flips a `data-theme` attribute on `<html>` and
remembers the choice in `localStorage`.

