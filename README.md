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
```

The Upstash aliases `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are also supported. Connect the repository to Vercel and provision Upstash from the Vercel Marketplace. `vercel.json` schedules the authenticated daily keepalive route.

## Data updates

Forever source data, compatibility, and the public checked date live in `src/data/forever.ts`. Scoring weights live separately in `src/data/scoring-config.ts`. Update `DATA_VERSION`, `DATA_CHECKED_AT`, and `DATA_CHECKED_LABEL` whenever the source data is reviewed.
