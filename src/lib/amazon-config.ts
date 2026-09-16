/**
 * Resolves Amazon Creators API credentials from the environment.
 *
 * Amazon retired the Product Advertising API (PA-API 5.0) on 15 May 2026 and
 * replaced it with the Creators API. The two differ at the auth layer: PA-API
 * signed every request with AWS Signature V4, while the Creators API issues a
 * short-lived OAuth2 bearer token from a credential id and secret created in
 * Associates Central.
 *
 * Empty values are treated as absent, so placeholder variables copied from
 * .env.example do not register as configured credentials.
 */

/** Token endpoint for each credential version. 2.x uses Cognito, 3.x uses Login with Amazon. */
const VERSION_ENDPOINTS: Record<string, string> = {
  "2.1": "https://creatorsapi.auth.us-east-1.amazoncognito.com/oauth2/token",
  "2.2": "https://creatorsapi.auth.eu-south-2.amazoncognito.com/oauth2/token",
  "2.3": "https://creatorsapi.auth.us-west-2.amazoncognito.com/oauth2/token",
  "3.1": "https://api.amazon.com/auth/o2/token",
  "3.2": "https://api.amazon.co.uk/auth/o2/token",
  "3.3": "https://api.amazon.co.jp/auth/o2/token",
};

export const CREATORS_API_HOST = "https://creatorsapi.amazon";

/** The version family decides the scope, the token encoding, and the Authorization format. */
export const COGNITO_SCOPE = "creatorsapi/default";
export const LWA_SCOPE = "creatorsapi::default";

export interface AmazonConfig {
  credentialId: string;
  credentialSecret: string;
  /** Credential version from Associates Central, e.g. "3.1". Decides the token endpoint. */
  version: string;
  /** Target locale sent as the x-marketplace header, e.g. "www.amazon.com". */
  marketplace: string;
  /** Associates tracking id appended to every outbound link, e.g. "mytag-20". */
  partnerTag: string;
  tokenEndpoint: string;
  isLwa: boolean;
}

function value(key: string) {
  const raw = process.env[key];
  return raw && raw.trim() ? raw.trim() : null;
}

export function partnerTag() {
  // The public variable already drives the "As an Amazon Associate" disclosure,
  // so it stays the default source. A tracking id is not a secret.
  return value("AMAZON_ASSOCIATE_TAG") ?? value("NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG");
}

export function amazonConfig(): AmazonConfig | null {
  const credentialId = value("AMAZON_CREATORS_CREDENTIAL_ID");
  const credentialSecret = value("AMAZON_CREATORS_CREDENTIAL_SECRET");
  const tag = partnerTag();
  if (!credentialId || !credentialSecret || !tag) return null;

  // Associates Central shows versions as "3.1", but "v3.1" is a natural way to
  // copy it. Accept both, since an unknown version silently disables every ad.
  const version = (value("AMAZON_CREATORS_VERSION") ?? "3.1").replace(/^v/i, "");
  const tokenEndpoint = VERSION_ENDPOINTS[version];
  if (!tokenEndpoint) return null;

  return {
    credentialId,
    credentialSecret,
    version,
    marketplace: value("AMAZON_CREATORS_MARKETPLACE") ?? "www.amazon.com",
    partnerTag: tag,
    tokenEndpoint,
    isLwa: version.startsWith("3."),
  };
}

export function hasAmazonConfig() {
  return Boolean(amazonConfig());
}

/** searchItems accepts an itemCount between 1 and 100. */
const MAX_POOL_SIZE = 100;
const DEFAULT_POOL_SIZE = 50;

/**
 * Which products fill the rotation pool.
 *
 * A pool is fetched once per cache cycle and then sampled per request, so
 * variety costs no extra API calls. An explicit ASIN list wins when set;
 * otherwise a keyword search fills the pool.
 *
 * The pinned ASIN is separate: it always occupies the first slot, so an
 * evergreen product is guaranteed a placement no matter what the pool holds.
 */
export function adSelection() {
  const asins = (value("AMAZON_AD_ASINS") ?? "")
    .split(",")
    .map((asin) => asin.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 10); // getItems accepts at most 10 item ids per request

  const requestedPool = Number(value("AMAZON_AD_POOL_SIZE") ?? DEFAULT_POOL_SIZE);
  const poolSize = Number.isFinite(requestedPool)
    ? Math.min(Math.max(Math.trunc(requestedPool), 1), MAX_POOL_SIZE)
    : DEFAULT_POOL_SIZE;

  return {
    asins,
    keywords: value("AMAZON_AD_KEYWORDS") ?? "World of Warcraft",
    pinnedAsin: value("AMAZON_AD_PINNED_ASIN")?.toUpperCase() ?? null,
    poolSize,
  };
}
