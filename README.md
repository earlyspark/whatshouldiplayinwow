# What Should I Play?

A deterministic, shareable World of Warcraft: Forever race and class quiz.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local`. Redis is optional in development; an in-memory result store is used when Redis variables are absent. Redis is required in production. Result creation is deliberately not rate-limited on localhost, even when local testing uses the shared Redis database. Vercel preview and production deployments retain the hourly limit.

## Vercel configuration

Set these environment variables:

```text
NEXT_PUBLIC_SITE_URL=https://whatshouldiplayinwowforever.com
WOWFOREVER_KV_REST_API_URL=
WOWFOREVER_KV_REST_API_TOKEN=
CRON_SECRET=
STATS_PASSWORD=
NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
AMAZON_CREATORS_CREDENTIAL_ID=
AMAZON_CREATORS_CREDENTIAL_SECRET=
AMAZON_CREATORS_VERSION=3.1
AMAZON_CREATORS_MARKETPLACE=www.amazon.com
AMAZON_AD_ASINS=
AMAZON_AD_KEYWORDS=World of Warcraft
AMAZON_AD_PINNED_ASIN=
AMAZON_AD_POOL_SIZE=50
```

The Upstash aliases `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are also supported. Connect the repository to Vercel and provision Upstash from the Vercel Marketplace. `vercel.json` schedules the authenticated daily keepalive route.

## Quiz statistics

Set a strong, unique `STATS_PASSWORD` in Vercel's **Production** environment. After deployment, open `https://www.whatshouldiplayinwowforever.com/stats` and sign in with username `admin` and that password. The private page shows all-time and monthly answer totals, first-ranked choices, and recommended races/classes. It is excluded from search indexing. Without the password, the page fails closed.

A quiz is counted only after its creator reaches the result page with the private completion receipt. Redis marks each result ID counted and increments its monthly totals in one atomic operation, so reloads and shared-link visits cannot add duplicates. Only a Vercel production deployment (`VERCEL=1` and `VERCEL_ENV=production`) writes statistics; local and preview tests never tally, even if they share production Redis credentials. Totals start at deployment and do not backfill older results. Each retake is another completed result, not a unique person.

## Data updates

Forever source data, compatibility, and the public checked date live in `src/data/forever.ts`. Scoring weights live separately in `src/data/scoring-config.ts`. Update `DATA_VERSION`, `DATA_CHECKED_AT`, and `DATA_CHECKED_LABEL` whenever the source data is reviewed.

## Amazon affiliate banners

Amazon retired the Product Advertising API (PA-API 5.0) on 15 May 2026, along with
the static banner and iframe creatives that used to be pasted into a page. Banners
are now built from catalog data returned by the **Creators API**.

Create a credential in Associates Central under Tools → Creators API, then set
`AMAZON_CREATORS_CREDENTIAL_ID` and `AMAZON_CREATORS_CREDENTIAL_SECRET`. The secret
is shown only once. These are server-only and must never carry a `NEXT_PUBLIC_`
prefix.

`AMAZON_CREATORS_VERSION` decides which token endpoint is used and which
marketplaces the credential can query:

The value supplied by Amazon as `v3.1` is accepted as-is; the app normalizes
the optional `v` prefix. Use the same value in `.env.local` and Vercel.

| Version | Auth | Marketplaces |
| --- | --- | --- |
| `3.1` | Login with Amazon | US, CA, MX, BR |
| `3.2` | Login with Amazon | UK, DE, FR, IT, ES |
| `3.3` | Login with Amazon | JP, IN, AU |
| `2.1` / `2.2` / `2.3` | Cognito | Legacy equivalents of the above |

### Pool, pinning and rotation

Products are fetched into a **pool** that is cached for six hours. Amazon
SearchItems returns at most ten products per request, so a 50-product pool
requires up to five paginated searches per keyword query (and possibly one
extra request to confirm that results are exhausted). The pinned product is
fetched separately. Rotating the cached products does not call Amazon again.

- `AMAZON_AD_ASINS` — a comma-separated list of up to ten ASINs to use as the
  pool. When empty, the pool is filled by a keyword search.
- `AMAZON_AD_KEYWORDS` — the search that fills the pool.
- `AMAZON_AD_POOL_SIZE` — how many products to pull, 1 to 100, across up to ten
  search pages. Clamped to that range.
- `AMAZON_AD_PINNED_ASIN` — an evergreen product that always takes the first
  quiz banner slot. It is fetched separately, so it appears even when the pool
  does not contain it, and it is never duplicated further down. Result-specific
  searches do not force this generic product into the results banners.

The quiz shows the pinned product plus up to three rotating products in a
responsive four-product grid. The visible selection changes with each question
and is offset per visit. Result pages show up to four products in a sidebar,
searched by the primary recommendation's class and filtered to titles that
mention that class. Each class-specific pool is limited to one ten-item search
request and cached for six hours. If no relevant products are available, the
sidebar remains reserved rather than showing unrelated items.

`AdSlot` renders reserved ad space whenever credentials are absent or Amazon is
unreachable, so ads never break a page. Product titles, images, and links are
cached for six hours. Prices and other offer data are not requested or displayed,
since Amazon's offer-data cache guidance allows only one hour.

### Where the ads appear

| Route | Format | Products |
| --- | --- | --- |
| `/` (quiz) | Banner below the start button on the intro, above questions after starting | Pinned product plus generic `AMAZON_AD_KEYWORDS` pool, rotating by question and visit |
| `/methodology` | Inline banner above the shared footer | Four products from a World of Warcraft search, without the pinned product |
| `/result/[id]` | Four-product sidebar on desktop, below the first explanation on mobile | Searched on the primary class, then filtered by class title match; no pinned product |

The quiz is a client-side stepper on a statically rendered page, so it reads the
pool from `/api/product-pool` rather than taking server props, which keeps the
landing page static. That route serves public catalog data only and reads the
same six-hour pool cache, so it costs no extra Amazon calls after pool creation.

### Local development

Put credentials in `.env.local` (gitignored). The same variables go into the
Vercel dashboard for preview and production — tick Preview as well as
Production so preview deploys show ads.

Restart `npm run dev` after editing `.env.local`; Next reads the file at startup.

Run `npm run amazon:check` to verify credentials without the app. It reports
which step failed — token exchange, `searchItems`, or the pinned ASIN — rather
than failing silently behind a placeholder ad slot.
