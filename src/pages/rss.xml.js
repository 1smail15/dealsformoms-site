import rss from '@astrojs/rss';
import { getPublished } from '../lib/content';
import { SITE } from '../consts';

export async function GET(context) {
  const [guides, deals] = await Promise.all([
    getPublished('guides'),
    getPublished('deals'),
  ]);
  const items = [
    ...guides.map((e) => ({ ...e, _section: 'guides' })),
    ...deals.map((e) => ({ ...e, _section: 'deals' })),
  ].sort((a, b) => b.data.pubDate - a.data.pubDate);

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items: items.map((e) => ({
      title: e.data.title,
      description: e.data.description,
      pubDate: e.data.pubDate,
      link: `/${e._section}/${e.id}`,
    })),
  });
}
