#!/usr/bin/env node
/**
 * Pull products + affiliate links out of AffiliateFlow's SQLite database
 * and write them to src/data/deals.json for the site build.
 *
 *   npm run export:deals
 *   npm run export:deals -- --db "C:\path\to\automation.db" --limit 200
 *
 * The database is read-only here. Nothing is written back to AffiliateFlow.
 */
import Database from 'better-sqlite3';
import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import os from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const DEFAULT_DB = join(
  os.homedir(),
  'OneDrive', 'Desktop', 'AffiliateFlow', 'fb-automation-app', 'database', 'automation.db'
);

const dbPath = resolve(arg('db', DEFAULT_DB));
const limit = Number(arg('limit', 300));
const out = join(ROOT, 'src', 'data', 'deals.json');

if (!existsSync(dbPath)) {
  console.error(`\n  AffiliateFlow database not found:\n    ${dbPath}\n\n  Pass the path explicitly:\n    npm run export:deals -- --db "C:\\path\\to\\automation.db"\n`);
  process.exit(1);
}

const db = new Database(dbPath, { readonly: true, fileMustExist: true });

const rows = db.prepare(`
  SELECT
    w.id            AS id,
    w.product_name  AS name,
    w.product_image_url AS image,
    w.product_price     AS price,
    w.product_price_old AS priceOld,
    w.product_url       AS productUrl,
    a.affiliate_link    AS affiliateLink,
    a.platform          AS platform
  FROM walmart_products w
  LEFT JOIN affiliate_links a ON a.walmart_product_id = w.id
  WHERE w.product_name IS NOT NULL AND TRIM(w.product_name) <> ''
  ORDER BY w.id DESC
  LIMIT ?
`).all(limit);

/** dealshop.link/<code> -> /go/<code>, so clicks land in the existing D1 tracker. */
const toHref = (affiliateLink, productUrl) => {
  if (!affiliateLink) return productUrl ?? null;
  const m = String(affiliateLink).match(/dealshop\.link\/([A-Za-z0-9_-]+)/i);
  return m ? `/go/${m[1]}` : affiliateLink;
};

const seen = new Set();
const deals = [];

for (const r of rows) {
  const href = toHref(r.affiliateLink, r.productUrl);
  if (!href) continue;                       // no link, no deal card
  const id = String(r.id);
  if (seen.has(id)) continue;
  seen.add(id);

  deals.push({
    id,
    name: String(r.name).trim(),
    image: r.image || undefined,
    price: r.price || undefined,
    priceOld: r.priceOld || undefined,
    href,
    platform: r.platform || 'mavely',
  });
}

writeFileSync(out, JSON.stringify(deals, null, 2) + '\n');
db.close();

const withGo = deals.filter((d) => d.href.startsWith('/go/')).length;
console.log(`\n  ${deals.length} deals written to src/data/deals.json`);
console.log(`  ${withGo} routed through /go/ (dealshop tracker), ${deals.length - withGo} direct.`);
console.log(`  Reference them from a post's frontmatter:  dealIds: ["${deals[0]?.id ?? '123'}"]\n`);
