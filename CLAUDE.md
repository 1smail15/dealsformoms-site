# dealsformoms.us

Astro static site. Multi-retailer clearance / deals blog (Walmart, Target,
and more — **not** Amazon, see Affiliate links below) for the "Deals For
Moms" Facebook business. Owner: Ismail (GitHub `1smail15`).

## Stack

- Astro 5, static output, content collections
- Repo: `1smail15/dealsformoms-site` (private), branch `main`
- Host: Cloudflare Pages, project `dealsformoms-site`, auto-deploys on push
- Build: `npm run build` → `dist`. Node 22 via `.nvmrc`
- Live: https://dealsformoms.us and www (both Active, SSL)

```bash
npm run dev            # localhost:4321 — shows future-dated posts too
npm run build
npm run export:deals   # regenerate src/data/deals.json from AffiliateFlow
```

## Content rules — these are not style preferences

Google's **August 2026 spam update** hit exactly this site's shape: AI-drafted
affiliate content on templated pages. Documented cases lost 14k+ ranking
queries outright; recovery takes 5+ months. Everything below exists to stay on
the right side of that.

1. **Every post needs a real first-hand asset.** The `firsthand` frontmatter
   block is required and the build FAILS without it. A store photo, a receipt,
   a shelf tag, or an app screenshot Ismail took himself. This is the moat —
   he physically walks clearance aisles (any retailer), which no content farm
   can fake.
2. **Never scrape product data and republish it.** Product facts come from his
   own AffiliateFlow database or from the store.
3. **~12 posts/month, not daily.** A new `.us` domain publishing daily
   AI-assisted affiliate content is a velocity signature. Scale only after
   Search Console shows impressions rising.
4. **Human review before publish** for the first 90 days.
5. **No `Review` or `AggregateRating` schema** unless the ratings are genuinely
   his. Fabricated review schema is a manual-action magnet.

## Content pillars

`mechanics` (price-ending codes, penny items) · `calendar` (seasonal markdown
schedules — the best opening, low competition) · `tools` (app scanning) ·
`buying` (commercial guides — hold until month 4)

`content-queue.md` holds the planned posts. Work top-down.

## Scheduled publishing

Posts carry a future `pubDate`. `src/lib/content.ts` filters them out of the
production build until that date; `astro dev` shows them so you can preview.
`.github/workflows/scheduled-publish.yml` pings a Cloudflare deploy hook daily
(needs repo secret `CLOUDFLARE_DEPLOY_HOOK`) so queued posts go live on their
own. Write ahead in batches; don't generate at publish time.

## Affiliate links

- Networks: **Mavely, ShopYourLikes, BrandCycle**. These already cover
  Walmart and Target. **No Amazon Associates account** — never claim
  otherwise on the site, and don't post Amazon deals until that changes.
  "Multi-retailer" currently means Walmart + Target, not Amazon.
- Links route `/go/<code>` → `public/_redirects` → `dealshop.link/<code>`,
  which is his existing Cloudflare Worker on D1. Site clicks and Facebook
  clicks land in the same `clicks` table.
- `rel="sponsored nofollow noopener"`, `/go/*` is `noindex` and excluded from
  the sitemap.
- FTC disclosure renders above the first affiliate link on every post.

## Email list — needs a Worker route (not yet wired)

`src/components/Newsletter.astro` (homepage section + compact footer variant)
POSTs `{ email, source }` as JSON to `https://dealshop.link/subscribe`. That
route **does not exist yet** — it needs to be added to the existing
`dealshop.link` Cloudflare Worker (the same one that handles `/go/<code>`
redirects on D1), since that Worker's source isn't in this repo. Until it's
added, the form fails with the "couldn't sign you up" error state (by
design — it doesn't pretend to succeed).

What the route needs to do:
1. Accept `POST /subscribe`, body `{ email: string, source: string }`.
2. Validate `email` (basic shape check is enough).
3. Insert into a D1 table, e.g. `subscribers(email TEXT UNIQUE, source TEXT,
   created_at TEXT)` — dedupe on `email`.
4. Return `2xx` JSON on success; the form only checks `res.ok`.
5. CORS: allow `https://dealsformoms.us` to POST cross-origin (the Worker is
   on a different origin than the site).

## Known data issue

`walmart_products` and `affiliate_links` in AffiliateFlow's SQLite **cannot be
joined**: `walmart_product_id` is NULL on every row and `original_url` does not
overlap `product_url`. So `export-affiliateflow.mjs` exports product facts and
leaves `href: null`; supply the code per post via `dealCodes` frontmatter.

**The real fix is in AffiliateFlow** — make it write `walmart_product_id` when
creating an affiliate_links row. Then the automatic path works with no site change.

## Facebook context

Link demotion is **Page-level, not domain-level**. Confirmed: `dealsformoms.us`
posts fine from the "Deals Finder" Page (clickable, full preview card) while
affiliate domains stay flattened on the restricted Pages. Buying new domains
will not fix those Pages.

Site's `FACEBOOK` links in `src/consts.ts` point to the verified **"Deals For
Moms"** Page (7.3K followers, blue check, `facebook.com/profile.php?id=61556553736198`)
and the **"Amazing Deals & Steals for Moms & Families"** group
(`facebook.com/groups/deals4mama`, 36K+ members) — this is where deal finds
get sourced from. Ismail also runs several other Pages that post into the
same group (e.g. "Deals Finder", "The Bargain Bin") for reach; all are his.

## Other domains

`clearancefindsdaily.com` and `pennylistdaily.com` are registered and unused.
The clearance content plan fits `clearancefindsdaily.com` better than
`dealsformoms.us` — `.com` trust, no `.us` public-WHOIS or nexus constraints.
Cloning the site is one line in `src/consts.ts`.
