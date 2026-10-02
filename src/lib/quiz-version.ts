import { QUIZ_CONTENT_VERSION } from "@/data/questions";

function versionParts(version: string) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return match ? match.slice(1).map(Number) : null;
}

export function quizQuestionsOrScoringChanged(savedVersion: string) {
  const saved = versionParts(savedVersion);
  const current = versionParts(QUIZ_CONTENT_VERSION)!;
  if (!saved) return true;
  for (let index = 0; index < current.length; index++) {
    if (saved[index] !== current[index]) return saved[index] < current[index];
  }
  return false;
}
