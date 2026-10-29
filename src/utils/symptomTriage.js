/**
 * symptomTriage.js
 *
 * Clinical Triage Utilities for MedWeb:
 * - Symptom negation detection (prevents false-positive emergencies and incorrect matching)
 * - Worsening symptoms detection
 * - Emergency keyword analysis with negation awareness
 * - Multi-symptom synthesis
 */

// Negation triggers in clinical reporting
const NEGATION_TRIGGERS = [
  'no', 'not', 'without', 'denies', 'denied', 'negative for', 'never had', 'rule out'
];

/**
 * Splits text into affirmed segments and negated segments.
 * Example: "I have severe headache, but no fever and no chest pain"
 * Affirmed: "I have severe headache"
 * Negated: ["fever", "chest pain"]
 */
export function partitionNegatedSymptoms(text) {
  if (!text || typeof text !== 'string') {
    return { affirmedText: '', negatedTokens: [] };
  }

  // Split by clauses / conjunctions
  const clauses = text.split(/[,;.\n]+|\b(?:but|however|except|although)\b/i);
  const affirmedClauses = [];
  const negatedTokens = [];

  for (const clause of clauses) {
    const trimmed = clause.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();
    const hasNegation = NEGATION_TRIGGERS.some(trigger => {
      const regex = new RegExp(`\\b${trigger}\\b`, 'i');
      return regex.test(lower);
    });

    if (hasNegation) {
      // Extract what was negated
      const match = lower.match(/\b(?:no|not|without|denies|denied|negative for|never had)\s+([^,;.]+)/i);
      if (match && match[1]) {
        negatedTokens.push(match[1].trim());
      }
    } else {
      affirmedClauses.push(trimmed);
    }
  }

  return {
    affirmedText: affirmedClauses.join(' ').trim(),
    negatedTokens
  };
}

/**
 * Detects whether the patient describes rapidly worsening or progressive symptoms.
 */
export function checkWorseningProgression(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  const worseningPatterns = [
    /\b(worsen(ing|ed)?|getting\s*worse|deteriorat(ing|ed)?|rapidly\s*progressing|intensify(ing|ied)?|spreading\s*rapidly|sudden\s*onset|unbearable)\b/i
  ];
  return worseningPatterns.some(p => p.test(lower));
}

/**
 * Checks for true emergencies, ignoring symptoms that the patient explicitly negated.
 */
export function checkEmergencyWithNegation(text) {
  if (!text || typeof text !== 'string') return false;

  const { affirmedText } = partitionNegatedSymptoms(text);
  if (!affirmedText) return false;

  const lower = affirmedText.toLowerCase();

  const emergencyPatterns = [
    /\bchest\s*(pain|pressure|tightness|heaviness|crushing)\b/i,
    /\b(difficulty|trouble|can't|cannot|unable\s*to)\s*breath(e|ing)?\b/i,
    /\bshortness\s*of\s*breath\b/i,
    /\bunconscious|fainted|passing\s*out|passed\s*out|blackout|unresponsive\b/i,
    /\b(severe|uncontrolled)\s*bleed(ing)?|coughing\s*(up\s*)?blood\b/i,
    /\bstroke|facial\s*droop|slurred\s*speech|one[- ]side(d)?\s*weakness|arm\s*numbness\b/i,
    /\bsuicid|kill\s*myself|end\s*my\s*life|self[- ]harm\b/i,
    /\banaphylax(is)?|throat\s*(is\s*)?clos(ing|es|ed)|swelling\s*of\s*(the\s*)?(tongue|throat)\b/i,
    /\bheart\s*attack|cardiac\s*arrest\b/i,
    /\bseizure|convulsion\b/i
  ];

  return emergencyPatterns.some(p => p.test(lower));
}

