// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from "@astrojs/cloudflare";

// Fully static, client-side-only site — no server output, no endpoints.
// Tailwind v4 is wired in through its Vite plugin (the @astrojs/tailwind
// integration is deprecated); the theme lives in src/styles/global.css.
export default defineConfig({
  output: 'static',

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare()
});