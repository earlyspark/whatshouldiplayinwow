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

Set `AMAZON_AD_ASINS` to a comma-separated list of up to ten ASINs to promote a
curated set of products. When it is empty the banner falls back to a keyword
search using `AMAZON_AD_KEYWORDS`.

`AdSlot` renders reserved ad space whenever credentials are absent or Amazon is
unreachable, so a banner never breaks a page. Product data is fetched on the
server and cached for six hours, which keeps prices inside the 24 hour freshness
window required by the Associates Program Operating Agreement.
