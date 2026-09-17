import { expect, it } from "vitest";
import { needsEuropeanConsent } from "@/lib/consent-region";

it("uses the European consent flow for the EEA, UK, Switzerland, and unknown production locations", () => {
  for (const country of ["DE", "FR", "NO", "GB", "CH"]) {
    expect(needsEuropeanConsent(country, true)).toBe(true);
  }
  expect(needsEuropeanConsent("US", true)).toBe(false);
  expect(needsEuropeanConsent(null, true)).toBe(true);
  expect(needsEuropeanConsent(null, false)).toBe(false);
});
