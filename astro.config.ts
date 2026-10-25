import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mikepred.github.io',
  base: '/build-log',
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
