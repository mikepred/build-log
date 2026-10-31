import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { site, base } from './scripts/site-settings.mjs';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: false,
      langAlias: {
        ps: 'powershell',
        ps1: 'powershell',
        pwsh: 'powershell',
      },
    },
  },
});
