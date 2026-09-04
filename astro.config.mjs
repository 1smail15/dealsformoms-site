import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://dealsformoms.us',
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    sitemap({
      // /go/* are affiliate redirects — never in the sitemap
      filter: (page) => !page.includes('/go/'),
    }),
  ],
  build: { format: 'directory' },
});
