#!/usr/bin/env node
/**
 * Pull ALL products + affiliate links out of AffiliateFlow's SQLite database
 * and write them, categorized, to src/data/catalog.json for the site's
 * "Online Deals" section — sourced deals with retailer photos and AI-written
 * copy, explicitly NOT the firsthand in-store finds in src/data/deals.json.
 * Keep those two files and their site sections separate.
 *
 *   npm run export:catalog
 *   npm run export:catalog -- --db "C:\path\to\automation.db"
 *
 * Uses sql.js (pure WASM SQLite reader) — no native build toolchain needed.
 * Joins affiliate_links.original_url = walmart_products.product_url (the
 * walmart_product_id FK is NULL on every row; see export-affiliateflow.mjs).
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
const out = join(ROOT, 'src', 'data', 'catalog.json');

if (!existsSync(dbPath)) {
  console.error(`\n  AffiliateFlow database not found:\n    ${dbPath}\n\n  Pass the path explicitly:\n    npm run export:catalog -- --db "C:\\path\\to\\automation.db"\n`);
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

/** The AI-generated deal copy is stored as a pretty-printed, unquoted-key
 * object literal (not valid JSON) — parse it line by line. */
function parseDealBlob(blob) {
  if (!blob) return {};
  const out = {};
  const body = blob.replace(/^\{\s*/, '').replace(/\s*\}$/, '');
  let curKey = null;
  for (const line of body.split(/,?\n/)) {
    const m = line.match(/^\s*(\w+):\s*(.*)$/);
    if (m) {
      curKey = m[1];
      out[curKey] = m[2].replace(/,$/, '').trim();
    } else if (curKey) {
      out[curKey] += ' ' + line.trim();
    }
  }
  return out;
}

// Order matters: more specific buckets are checked before broad catch-alls
// (e.g. an "Outdoor Halloween Decoration" should land in Seasonal, not Patio,
// so Seasonal has to be checked first).
const CATEGORIES = [
  { key: 'seasonal-holiday', label: 'Seasonal & Holiday', match: /\b(halloween|christmas|easter|holiday lights|pi.?ata|party decor|cold spark)\b/i },
  { key: 'baby-nursery', label: 'Baby & Nursery', match: /\b(baby|nursery|nursing pillow|swaddle|bassinet|car seat)\b/i },
  { key: 'pet-supplies', label: 'Pet Supplies', match: /\b(cat carrier|cat house|dog bed|dog house|dog playpen|pet carrier|pet playpen|chicken coop|rabbit hutch|for dogs|for cats|\bpet\b|dog chew|dog treat)\b/i },
  { key: 'kids-toys', label: 'Kids & Toys', match: /\b(kids|toddler|ride[- ]?on|\btoy\b|toys\b|figurine|trampoline|ball pit|picnic table)\b/i },
  { key: 'fitness-exercise', label: 'Fitness & Exercise', match: /\b(barbell|squat rack|treadmill|exercise bike|smith machine|bumper plate|knee pads?|dumbbell|kettlebell|yoga|home gym|mountain bike|snorkel)\b/i },
  { key: 'electric-rides', label: 'Electric Bikes & Scooters', match: /\b(electric bike|e-bike|e-trike|electric scooter|gas bike|moped)\b/i },
  { key: 'electronics-tech', label: 'Electronics & Tech', match: /\b(iphone|tablet|android|smart ?tv|blu-?ray|\bdvd\b|wifi|bluetooth|laptop|tv wall mount|speaker|headphone|action camera|ink cartridge|sound system|video doorbell|co2 monitor|gaming monitor|controller|phone case|ipad case|power station)\b/i },
  { key: 'kitchen-appliances', label: 'Kitchen & Appliances', match: /\b(vacuum|dispenser|air conditioner|dehumidifier|blender|coffee|cooker|air fryer|microwave|refrigerator|roaster|ice maker|griddle|smoker|\bgrill\b)\b/i },
  { key: 'furniture-storage', label: 'Furniture & Storage', match: /\b(sofa|couch|bed frame|cabinet|bookshelf|drawer|desk|dresser|nightstand|platform bed|dining chair|safe box|folders?)\b/i },
  { key: 'home-decor-bath', label: 'Home Decor & Bath', match: /\b(wall art|ceiling fan|pillowcase|comforter|\brug\b|mirror|toilet seat|trash can|air freshener[s]?|table cloth|bathroom)\b/i },
  { key: 'health-mobility', label: 'Health & Mobility', match: /\b(mobility scooter|shower chair|incontinence|wheelchair|elderly|disabled|cane|walker)\b/i },
  { key: 'beauty-personal-care', label: 'Beauty & Personal Care', match: /\b(eau de|fragrance|perfume|cologne|skincare|makeup|shampoo|conditioner|hair (serum|dryer|brush)|\bserum\b|thermal brush|teeth whitening|ear wax)\b/i },
  { key: 'jewelry-accessories', label: 'Jewelry & Accessories', match: /\b(moissanite|bracelet|necklace|earrings)\b/i },
  { key: 'shoes', label: 'Shoes & Slippers', match: /\b(clogs|slippers|sandals|sneakers|shoes|boots)\b/i },
  { key: 'patio-outdoor', label: 'Patio & Outdoor', match: /\b(patio|outdoor|tent|camping|garden|hammock|lawn mower|boat cover|pool cover|round pool|planter|volleyball net|storage shed)\b/i },
  { key: 'womens-fashion', label: "Women's Fashion", match: /\bwomen'?s?\b/i },
  { key: 'mens-fashion', label: "Men's Fashion", match: /\bmen'?s?\b/i },
];
const FALLBACK = { key: 'more-finds', label: 'More Online Finds' };

function categorize(name) {
  for (const c of CATEGORIES) {
    if (c.match.test(name)) return c;
  }
  return FALLBACK;
}

const rows = q(`
  SELECT
    w.id            AS id,
    w.product_name  AS name,
    w.product_image_url AS image,
    w.product_price     AS price,
    a.affiliate_link     AS href,
    a.product_name        AS ai_blob
  FROM walmart_products w
  JOIN affiliate_links a ON a.original_url = w.product_url
  WHERE w.product_name IS NOT NULL AND TRIM(w.product_name) <> ''
    AND a.affiliate_link IS NOT NULL AND TRIM(a.affiliate_link) <> ''
`);

const seen = new Set();
const catalog = [];
for (const r of rows) {
  const id = String(r.id);
  if (seen.has(id)) continue;
  seen.add(id);

  const ai = parseDealBlob(r.ai_blob);
  // Match against both the raw Walmart title and the AI-cleaned one —
  // they pluralize/word differently often enough to matter.
  const cat = categorize(`${r.name} ${ai.product_title ?? ''} ${ai.deal_description ?? ''}`);

  catalog.push({
    id,
    category: cat.key,
    categoryLabel: cat.label,
    // Source titles use a bare backslash for inches (e.g. `26\`) instead of a quote mark.
    name: (ai.product_title || r.name).trim().replace(/\\(?=\s|$)/g, '"'),
    image: r.image || undefined,
    price: ai.current_price?.replace(/^Now:\s*/, '') || r.price || undefined,
    priceOld: ai.original_price?.replace(/^Was:\s*/, '') || undefined,
    description: ai.deal_description || undefined,
    href: r.href,
  });
}

writeFileSync(out, JSON.stringify(catalog, null, 2) + '\n');
db.close();

const byCategory = {};
for (const p of catalog) byCategory[p.categoryLabel] = (byCategory[p.categoryLabel] || 0) + 1;

console.log(`\n  ${catalog.length} products written to src/data/catalog.json\n`);
for (const [label, n] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}  ${label}`);
}
console.log('');
