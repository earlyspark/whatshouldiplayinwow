# What Should I Pick?

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

| Version | Auth | Marketplaces |
| --- | --- | --- |
| `3.1` | Login with Amazon | US, CA, MX, BR |
| `3.2` | Login with Amazon | UK, DE, FR, IT, ES |
| `3.3` | Login with Amazon | JP, IN, AU |
| `2.1` / `2.2` / `2.3` | Cognito | Legacy equivalents of the above |

### Pool, pinning and rotation

Products are fetched once per cache cycle into a **pool**, then sampled per
request. Variety therefore costs no extra API calls: one pool refresh every six
hours is four requests per day against a starting budget of 8,640.

- `AMAZON_AD_ASINS` — a comma-separated list of up to ten ASINs to use as the
  pool. When empty, the pool is filled by a keyword search.
- `AMAZON_AD_KEYWORDS` — the search that fills the pool.
- `AMAZON_AD_POOL_SIZE` — how many products to pull, 1 to 100 (`searchItems`
  caps `itemCount` at 100). Clamped to that range.
- `AMAZON_AD_PINNED_ASIN` — an evergreen product that always takes the first
  banner slot. It is fetched separately, so it appears even when the pool does
  not contain it, and it is never duplicated further down.

Banner slots after the pinned one are shuffled per request, so a repeat visitor
does not see the same banner twice. Shuffling happens on the server; doing it in
a client component would desynchronise the markup React hydrates against.

### Two ad formats

`AmazonBanner` fills the sidebar and inline slots. `ContextualPick` renders an
in-content text link inside the result prose — the format that actually converts
for affiliates, since it sits next to the content rather than in a banner slot.

Contextual picks are **deterministic by seed** rather than shuffled, so a shared
permalink reads the same on every visit. They also skip the pinned product,
which already has the banner slot. Both formats draw from the same pool, so
adding the second format costs no additional API calls.

`AdSlot` renders reserved ad space whenever credentials are absent or Amazon is
unreachable, and `ContextualPick` renders nothing at all, so ads never break a
page. Product data is cached for six hours, which keeps prices inside the 24 hour
freshness window required by the Associates Program Operating Agreement.

### Where the ads appear

| Route | Format | Products |
| --- | --- | --- |
| `/` (quiz) | Banner under the question card | Generic `AMAZON_AD_KEYWORDS` pool, rotating one product per question |
| `/result/[id]` | Sidebar and inline banners | Searched on the recommended class |
| `/result/[id]` | In-content text links | Searched on the recommended class |

The quiz is a client-side stepper on a statically rendered page, so it reads the
pool from `/api/ads/pool` rather than taking server props, which keeps the
landing page static. That route serves public catalog data only and reads the
same six hour cache, so it costs no extra Amazon calls.

### Local development

Put credentials in `.env.local` (gitignored). The same variables go into the
Vercel dashboard for preview and production — tick Preview as well as
Production so preview deploys show ads.

Restart `npm run dev` after editing `.env.local`; Next reads the file at startup.

Run `npm run amazon:check` to verify credentials without the app. It reports
which step failed — token exchange, `searchItems`, or the pinned ASIN — rather
than failing silently behind a placeholder ad slot.
