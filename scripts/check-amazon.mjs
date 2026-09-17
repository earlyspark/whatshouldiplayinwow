import { readFileSync } from "node:fs";

const VERSION_ENDPOINTS = {
  "2.1": "https://creatorsapi.auth.us-east-1.amazoncognito.com/oauth2/token",
  "2.2": "https://creatorsapi.auth.eu-south-2.amazoncognito.com/oauth2/token",
  "2.3": "https://creatorsapi.auth.us-west-2.amazoncognito.com/oauth2/token",
  "3.1": "https://api.amazon.com/auth/o2/token",
  "3.2": "https://api.amazon.co.uk/auth/o2/token",
  "3.3": "https://api.amazon.co.jp/auth/o2/token",
};

function loadEnvFile(path) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!match) continue;
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!(match[1] in process.env) && value) process.env[match[1]] = value;
    }
    return true;
  } catch {
    return false;
  }
}

const found = loadEnvFile(".env.local");
console.log(found ? "Read .env.local" : "No .env.local found, using the current environment");

const id = process.env.AMAZON_CREATORS_CREDENTIAL_ID;
const secret = process.env.AMAZON_CREATORS_CREDENTIAL_SECRET;
const tag = process.env.AMAZON_ASSOCIATE_TAG ?? process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG;
const version = (process.env.AMAZON_CREATORS_VERSION ?? "3.1").replace(/^v/i, "");
const marketplace = process.env.AMAZON_CREATORS_MARKETPLACE ?? "www.amazon.com";
const keywords = process.env.AMAZON_AD_KEYWORDS ?? "World of Warcraft";
const creatorBookAsin = "B0HGNX657R";

const missing = [
  ["AMAZON_CREATORS_CREDENTIAL_ID", id],
  ["AMAZON_CREATORS_CREDENTIAL_SECRET", secret],
  ["associate tag", tag],
].filter(([, value]) => !value);

if (missing.length) {
  console.error(`\nMissing: ${missing.map(([name]) => name).join(", ")}`);
  console.error("Add them to .env.local, then run this again.");
  process.exit(1);
}

const tokenEndpoint = VERSION_ENDPOINTS[version];
if (!tokenEndpoint) {
  console.error(`\nAMAZON_CREATORS_VERSION="${version}" is not a known version.`);
  console.error(`Expected one of: ${Object.keys(VERSION_ENDPOINTS).join(", ")}`);
  process.exit(1);
}

const isLwa = version.startsWith("3.");
console.log(`Version ${version} (${isLwa ? "Login with Amazon" : "Cognito"}), marketplace ${marketplace}`);
console.log(`Partner tag ${tag}\n`);

const body = {
  grant_type: "client_credentials",
  client_id: id,
  client_secret: secret,
  scope: isLwa ? "creatorsapi::default" : "creatorsapi/default",
};

const tokenResponse = await fetch(tokenEndpoint, {
  method: "POST",
  headers: { "Content-Type": isLwa ? "application/json" : "application/x-www-form-urlencoded" },
  body: isLwa ? JSON.stringify(body) : new URLSearchParams(body).toString(),
});

if (!tokenResponse.ok) {
  console.error(`Step 1 FAILED: token request returned ${tokenResponse.status}`);
  console.error(await tokenResponse.text());
  console.error("\nUsual causes: wrong credential id or secret, or the wrong");
  console.error("AMAZON_CREATORS_VERSION for the marketplace the credential was made in.");
  process.exit(1);
}

const { access_token: token } = await tokenResponse.json();
console.log("Step 1 OK: got a bearer token");

async function catalog(operation, payload) {
  return fetch(`https://creatorsapi.amazon/catalog/v1/${operation}`, {
    method: "POST",
    headers: {
      Authorization: isLwa ? `Bearer ${token}` : `Bearer ${token}, Version ${version}`,
      "Content-Type": "application/json",
      "x-marketplace": marketplace,
    },
    body: JSON.stringify({
      partnerTag: tag,
      resources: ["images.primary.large", "itemInfo.title"],
      ...payload,
    }),
  });
}

const searchResponse = await catalog("searchItems", { keywords, itemCount: 5 });
if (!searchResponse.ok) {
  console.error(`\nStep 2 FAILED: searchItems returned ${searchResponse.status}`);
  console.error(await searchResponse.text());
  if (searchResponse.status === 401 || searchResponse.status === 403) {
    console.error("\n403 usually means the partner tag is not approved for this");
    console.error("marketplace, or the account has not yet made its qualifying sales.");
  }
  process.exit(1);
}

const items = (await searchResponse.json()).searchResult?.items ?? [];
console.log(`Step 2 OK: searchItems("${keywords}") returned ${items.length} products`);
for (const item of items.slice(0, 3)) {
  console.log(`   - ${item.itemInfo?.title?.displayValue ?? item.asin}`);
}

const bookResponse = await catalog("getItems", { itemIds: [creatorBookAsin] });
if (!bookResponse.ok) {
  console.error(`\nStep 3 FAILED: getItems(${creatorBookAsin}) returned ${bookResponse.status}`);
  console.error(await bookResponse.text());
  process.exit(1);
}
const bookItems = (await bookResponse.json()).itemsResult?.items ?? [];
if (!bookItems.length) {
  console.error(`\nStep 3 WARNING: ${creatorBookAsin} returned no product.`);
  console.error("Check the ASIN exists in this marketplace.");
} else {
  console.log(`Step 3 OK: creator book ${creatorBookAsin} is "${bookItems[0].itemInfo?.title?.displayValue}"`);
}

console.log("\nCredentials work. If ads still do not appear, restart `npm run dev`.");
