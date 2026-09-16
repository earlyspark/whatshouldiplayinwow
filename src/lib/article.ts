/**
 * Chooses the English indefinite article for a display name.
 *
 * English selects the article by sound rather than spelling, so short prefix
 * lists cover the mismatches: vowel-spelled words that open with a consonant
 * sound ("a one-handed weapon") and consonant-spelled words that open with a
 * vowel sound ("an hour").
 */
const CONSONANT_SOUND_PREFIXES = ["eu", "one", "uni", "use", "usu", "uti"];
const VOWEL_SOUND_PREFIXES = ["hono", "honest", "hour"];

export function indefiniteArticle(name: string) {
  const word = name.trim().toLowerCase();
  if (VOWEL_SOUND_PREFIXES.some((prefix) => word.startsWith(prefix))) return "an";
  if (CONSONANT_SOUND_PREFIXES.some((prefix) => word.startsWith(prefix))) return "a";
  return /^[aeiou]/.test(word) ? "an" : "a";
}

/** Returns the name preceded by its indefinite article, e.g. "an Orc Warrior". */
export function withArticle(name: string) {
  return `${indefiniteArticle(name)} ${name}`;
}
