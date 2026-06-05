import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // happy-dom gives us a global DOMParser so the cleaning logic can be
    // unit-tested headlessly, exactly as it runs in the browser.
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
});
