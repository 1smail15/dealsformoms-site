#!/usr/bin/env node
/**
 * Pull products + affiliate links out of AffiliateFlow's SQLite database
 * and write them to src/data/deals.json for the site build.
 *
 *   npm run export:deals
 *   npm run export:deals -- --db "C:\path\to\automation.db" --limit 200
 *
 * Uses sql.js (pure WASM SQLite reader) instead of better-sqlite3 — no
 * native build toolchain (Python/VS Build Tools) required on this machine.
 *
 * Known-issue update (2026-09-10): affiliate_links.walmart_product_id is
 * NULL on every row (the FK is never written by AffiliateFlow), but
 * affiliate_links.original_url matches walmart_products.product_url
 * exactly — 199/199 rows joined cleanly on that basis. Joining on the URL
 * instead of the FK is the actual fix; no AffiliateFlow-side change needed.
 *
 * The database is read-only here. Nothing is written back to AffiliateFlow.
 */
import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
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

const DEFAULT_DB = join(os.homedir(), 'AppData', 'Roaming', 'AffiliateFlow', 'automation.db');

const dbPath = resolve(arg('db', DEFAULT_DB));
const limit = Number(arg('limit', 300));
const out = join(ROOT, 'src', 'data', 'deals.json');

if (!existsSync(dbPath)) {
  console.error(`\n  AffiliateFlow database not found:\n    ${dbPath}\n\n  Pass the path explicitly:\n    npm run export:deals -- --db "C:\\path\\to\\automation.db"\n`);
  process.exit(1);
}

const SQL = await initSqlJs();
const db = new SQL.Database(readFileSync(dbPath));

const q = (sql) => {
  const r = db.exec(sql);
  if (!r[0]) return [];
  const cols = r[0].columns;
  return r[0].values.map((row) => Object.fromEntries(row.map((v, i) => [cols[i], v])));
};

const rows = q(`
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
  LEFT JOIN affiliate_links a ON a.original_url = w.product_url
  WHERE w.product_name IS NOT NULL AND TRIM(w.product_name) <> ''
  ORDER BY w.id DESC
  LIMIT ${limit}
`);

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
