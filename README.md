# StripTag

StripTag cleans pasted HTML in the browser. It parses with the native
`DOMParser`, applies tag and attribute rules to the parsed DOM, and returns
cleaned HTML; there is no backend or upload.

## Capabilities

- Blacklist mode removes selected tags and attributes; whitelist mode keeps only
  the selected ones.
- Removed tags can be unwrapped (keep their children) or removed with their
  contents.
- `<script>`, `<style>`, and `<noscript>` are always removed with their
  contents. Comments are removed unless **Keep HTML comments** is enabled.
- Tag and attribute controls are detected from the current input and update as
  it changes; selections are retained across edits.
- Debounced live output includes a sandboxed Preview with script execution
  disabled and a Prettier-formatted Code view. Copy, Select all, Clear, and
  Load sample actions are included.

## Development

Requires Node.js 22+ and pnpm. Wrangler, used by the preview and deploy
scripts, requires Node.js 22 or newer.

```bash
pnpm install
pnpm dev          # Astro development server
pnpm check        # Astro and TypeScript checks
pnpm test         # Vitest unit tests
pnpm build        # production output in dist/
pnpm preview      # build and run the Wrangler preview
pnpm deploy       # build and deploy with Wrangler
```

The reusable cleaner is [`cleanHtml`](src/lib/cleaner.ts), with tests in
[`src/lib/cleaner.test.ts`](src/lib/cleaner.test.ts). Cloudflare deployment is
configured in [`wrangler.jsonc`](wrangler.jsonc).
