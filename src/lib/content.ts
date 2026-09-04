import { getCollection, type CollectionKey } from 'astro:content';

/**
 * Scheduled publishing for a static site.
 *
 * A post with a future `pubDate` is written, committed and merged now, but
 * stays out of the build until its date arrives. The daily GitHub Action
 * rebuild is what actually makes it appear. In `astro dev` everything shows,
 * so you can preview what is queued.
 */
export async function getPublished<K extends CollectionKey>(key: K) {
  const now = Date.now();
  const isDev = import.meta.env.DEV;

  const entries = await getCollection(key, ({ data }: any) => {
    if (data.published === false) return false;
    if (isDev) return true;
    return data.pubDate.getTime() <= now;
  });

  return entries.sort(
    (a: any, b: any) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
  );
}

export function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
