// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Prototype stage: GitHub Pages demo (noindex). At production cutover switch
// site to the purchased domain and drop `base`.
export default defineConfig({
  site: 'https://jimjabid.github.io',
  base: '/cafe-urbano',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
