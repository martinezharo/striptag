// @ts-check
import { defineConfig } from 'astro/config';

// Fully static, client-side-only site — no server output, no endpoints.
export default defineConfig({
  output: 'static',
});
