/**
 * damerauLevenshtein.js
 * 
 * Clinical-grade Damerau-Levenshtein distance calculation with
 * adjacent transposition support and length-sensitive confidence scoring.
 */

/**
 * Calculates Damerau-Levenshtein distance (optimal string alignment)
 * between strings a and b.
 * Supports:
 * - Deletions
 * - Insertions
 * - Substitutions
 * - Transpositions of adjacent characters
 */
export function getDamerauLevenshteinDistance(a = '', b = '') {
  const s1 = String(a).toLowerCase().trim();
  const s2 = String(b).toLowerCase().trim();

  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  const len1 = s1.length;
  const len2 = s2.length;
  const d = Array.from({ length: len1 + 1 }, () => new Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) d[i][0] = i;
  for (let j = 0; j <= len2; j++) d[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;

      d[i][j] = Math.min(
        d[i - 1][j] + 1,       // deletion
        d[i][j - 1] + 1,       // insertion
        d[i - 1][j - 1] + cost // substitution
      );

      // Adjacent transposition check
      if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[len1][len2];
}

/**
 * Determines whether a distance is within an acceptable clinical tolerance
 * based on the character length of the query token.
 */
export function isWithinTypoThreshold(token, candidate, maxThreshold = 3) {
  if (!token || !candidate) return false;
  const tLen = token.length;
  const cLen = candidate.length;

  // Very short tokens (< 4 chars) require exact match
  if (tLen < 4 || cLen < 4) {
    return token.toLowerCase() === candidate.toLowerCase();
  }

  const distance = getDamerauLevenshteinDistance(token, candidate);

  // Short words (4-5 chars): allowed distance 1
  if (tLen <= 5) {
    return distance <= 1;
  }

  // Medium words (6-7 chars): allowed distance up to 2
  if (tLen <= 7) {
    return distance <= Math.min(2, maxThreshold);
  }

  // Long words (8+ chars): allowed distance up to 3
  return distance <= Math.min(3, maxThreshold);
}

/**
 * Computes a normalized similarity ratio (0 to 1) using Damerau-Levenshtein distance.
 */
export function getSimilarityRatio(a = '', b = '') {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = getDamerauLevenshteinDistance(a, b);
  return Math.max(0, 1 - dist / maxLen);
}
