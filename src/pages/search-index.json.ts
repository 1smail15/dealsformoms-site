import type { APIRoute } from 'astro';
import { getPublished } from '../lib/content';
import catalog from '../data/catalog.json';
import promos from '../data/promos.json';

export const GET: APIRoute = async () => {
  const [deals, guides] = await Promise.all([
    getPublished('deals'),
    getPublished('guides'),
  ]);

  const items = [
    ...deals.map((e: any) => ({
      title: e.data.title,
      desc: e.data.description,
      url: `/deals/${e.id}`,
      type: 'This week',
    })),
    ...guides.map((e: any) => ({
      title: e.data.title,
      desc: e.data.description,
      url: `/guides/${e.id}`,
      type: 'Guide',
    })),
    ...(promos as any[]).map((p) => ({
      title: `${p.brand}: ${p.title}`,
      desc: p.description,
      url: `/promos/${p.id}`,
      type: 'Promo code',
    })),
    ...(catalog as any[]).map((p) => ({
      title: p.name,
      desc: p.price ? `${p.price} at ${p.categoryLabel}` : p.categoryLabel,
      url: `/shop/${p.category}`,
      type: 'Online deal',
    })),
  ];

  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json' },
  });
};
