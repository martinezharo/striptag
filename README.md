# StripTag

A single-page web app that **cleans pasted HTML** — removing or keeping the tags
and attributes you choose. It runs **entirely in your browser** (no backend, no
uploads) and is built with [Astro](https://astro.build/) so it deploys as a fully
static site.

Parsing uses the browser's native `DOMParser` (never regex); every transformation
runs on the parsed DOM and is serialized back to a string.

## Features

- **Two modes:**
  - **Blacklist** (default) — remove the tags/attributes you select; keep the rest.
  - **Whitelist** — keep only the tags/attributes you select; remove everything else.
- **Tag removal behaviour:**
  - **Unwrap** (default) — drop the tag but keep its inner content
    (`<div>text</div>` → `text`).
  - **Remove with contents** — delete the element and its whole subtree.
- `<script>`, `<style>`, `<noscript>` and HTML comments are removed with their
  contents by default (comments can be kept with a checkbox).
- **Auto-detected checkboxes:** the tag and attribute lists are generated from the
  tags and attributes actually present in the pasted HTML, and update live as you
  edit — so you only ever see what's really in the document. Your selections are
  preserved across edits.
- **Live output** (debounced) with a Preview / Code toggle:
  - **Preview** renders in a sandboxed `<iframe>` (no script execution).
  - **Code** shows the cleaned HTML, pretty-printed with Prettier.
- **Copy** button copies the cleaned HTML source.
- **Select all / Clear** helpers for each checkbox group.
- **Load sample** button drops in a small messy snippet to play with.

## Requirements

- Node 20+ (developed on Node 24)
- [pnpm](https://pnpm.io/)

## Getting started

```bash
pnpm install
pnpm dev          # start the dev server (http://localhost:4321)
```

## Other scripts

```bash
pnpm build        # produce a static site in dist/
pnpm preview      # preview the production build locally
pnpm test         # run the unit tests (Vitest + happy-dom)
pnpm check        # Astro/TypeScript type checking
```

## Project structure

```
src/
├── lib/
│   ├── constants.ts     # common tag/attribute lists + always-strip set
│   ├── cleaner.ts       # core DOM cleaning logic (pure, reusable, tested)
│   ├── cleaner.test.ts  # unit tests for the cleaning logic
│   └── format.ts        # Prettier wrapper for the Code view
├── pages/
│   └── index.astro      # layout, scoped styles, and client-side wiring
└── styles/
    └── global.css       # Tailwind v4 design tokens + component classes
```

The cleaning logic in `src/lib/cleaner.ts` is intentionally decoupled from the
page markup, so it can be unit-tested headlessly and reused elsewhere. Its entry
point is:

```ts
cleanHtml(input: string, opts: CleanOptions, parser?: DOMParser): string
```

## Deployment

`pnpm build` emits a static site to `dist/` that can be hosted on any static
host (GitHub Pages, Cloudflare Pages, Netlify, etc.) — there is no server
component.
