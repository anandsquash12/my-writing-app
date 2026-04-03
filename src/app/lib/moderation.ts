export const BANNED_WORDS: string[] = ["spamword1", "spamword2", "abuseword"];

export function findBannedWords(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_WORDS.filter((word) => lower.includes(word.toLowerCase()));
}

