const CONSONANT_SOUND_PREFIXES = ["eu", "one", "uni", "use", "usu", "uti"];
const VOWEL_SOUND_PREFIXES = ["hono", "honest", "hour"];

export function indefiniteArticle(name: string) {
  const word = name.trim().toLowerCase();
  if (VOWEL_SOUND_PREFIXES.some((prefix) => word.startsWith(prefix))) return "an";
  if (CONSONANT_SOUND_PREFIXES.some((prefix) => word.startsWith(prefix))) return "a";
  return /^[aeiou]/.test(word) ? "an" : "a";
}

export function withArticle(name: string) {
  return `${indefiniteArticle(name)} ${name}`;
}
