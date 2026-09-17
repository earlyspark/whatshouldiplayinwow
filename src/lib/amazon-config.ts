const VERSION_ENDPOINTS: Record<string, string> = {
  "2.1": "https://creatorsapi.auth.us-east-1.amazoncognito.com/oauth2/token",
  "2.2": "https://creatorsapi.auth.eu-south-2.amazoncognito.com/oauth2/token",
  "2.3": "https://creatorsapi.auth.us-west-2.amazoncognito.com/oauth2/token",
  "3.1": "https://api.amazon.com/auth/o2/token",
  "3.2": "https://api.amazon.co.uk/auth/o2/token",
  "3.3": "https://api.amazon.co.jp/auth/o2/token",
};

export const CREATORS_API_HOST = "https://creatorsapi.amazon";

export const COGNITO_SCOPE = "creatorsapi/default";
export const LWA_SCOPE = "creatorsapi::default";

export interface AmazonConfig {
  credentialId: string;
  credentialSecret: string;
  version: string;
  marketplace: string;
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

const MAX_POOL_SIZE = 100;
const DEFAULT_POOL_SIZE = 50;

/** Explicit ASINs win over keywords for the legacy methodology ad pool. */
export function adSelection() {
  const asins = (value("AMAZON_AD_ASINS") ?? "")
    .split(",")
    .map((asin) => asin.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 10);

  const requestedPool = Number(value("AMAZON_AD_POOL_SIZE") ?? DEFAULT_POOL_SIZE);
  const poolSize = Number.isFinite(requestedPool)
    ? Math.min(Math.max(Math.trunc(requestedPool), 1), MAX_POOL_SIZE)
    : DEFAULT_POOL_SIZE;

  return {
    asins,
    keywords: value("AMAZON_AD_KEYWORDS") ?? "World of Warcraft",
    poolSize,
  };
}
