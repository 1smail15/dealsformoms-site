# dealsformoms.us

Astro site for Deals For Moms. Static output, deployed on Cloudflare Pages from
the `main` branch.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321 — shows queued posts too
npm run build      # what Cloudflare runs
```

## Cloudflare Pages settings

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 22 (`.nvmrc`) |

## Writing a post

Markdown goes in `src/content/guides/` or `src/content/deals/`. The frontmatter
schema is enforced at build time (`src/content.config.ts`) — a post that is
missing a `firsthand` block will fail the build on purpose.

**Scheduled publishing:** set `pubDate` in the future. The post is committed and
merged now but stays out of the built site until that date. The daily GitHub
Action (`.github/workflows/scheduled-publish.yml`) pings a Cloudflare deploy hook
so queued posts go live without anyone touching the repo. `npm run dev` ignores
the filter so you can preview what is queued.

## Deals data

`src/data/deals.json` is generated from AffiliateFlow's SQLite database:

```bash
npm run export:deals
npm run export:deals -- --db "C:\path\to\automation.db" --limit 200
```

Then reference the ids from a post's frontmatter:

```yaml
dealIds: ["1042", "1043"]
```

Links whose affiliate URL points at `dealshop.link/<code>` are rewritten to
`/go/<code>`, which `public/_redirects` sends to the existing dealshop-worker —
so site clicks and Facebook clicks land in the same D1 `clicks` table.

## Things that are deliberate

- `/go/*` is `noindex` (`public/_headers`) and excluded from the sitemap.
- Affiliate anchors carry `rel="sponsored nofollow noopener"`.
- The FTC disclosure renders above the first affiliate link on every post.
- No `Review` or `AggregateRating` schema. Do not add it unless the ratings are real.
