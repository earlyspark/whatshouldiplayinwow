const europeanCountries = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
]);

export function needsEuropeanConsent(country: string | null, production: boolean) {
  return country ? europeanCountries.has(country.toUpperCase()) : production;
}
