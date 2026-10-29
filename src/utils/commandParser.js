/**
 * commandParser.js
 *
 * Pure, side-effect-free voice command parsing for MedWeb.
 *
 * ALL exported functions are:
 *   - stateless
 *   - free of browser APIs (window, SpeechRecognition, etc.)
 *   - free of React imports
 *   - fully unit-testable
 *
 * Actual navigation / speech synthesis is the caller's responsibility.
 *
 * Command taxonomy (verified against App.jsx routes):
 *   NAVIGATE_HOME          /
 *   NAVIGATE_ASSISTANT     /assistant
 *   NAVIGATE_MEDICINE      /medicine?search=<term>   (requires term)
 *   NAVIGATE_SYMPTOMS      /symptoms?search=<term>   (requires term)
 *   NAVIGATE_NEARBY        /nearby?search=<term>     (optional term)
 *   NAVIGATE_EMERGENCY     /nearby?emergency=true    (requires confirmation)
 *   QUERY_ASSISTANT        /assistant?search=<text>  (fallback for free-form)
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. TEXT NORMALIZATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes a raw voice transcript for matching:
 *  - lowercase
 *  - collapse whitespace
 *  - strip leading/trailing punctuation tokens (commas, full-stops, question marks)
 *  - normalize common contractions to their spoken equivalents
 */
export function normalizeText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .toLowerCase()
    // normalize contractions spoken by STT engines
    .replace(/won't/g, 'will not')
    .replace(/can't/g, 'cannot')
    .replace(/don't/g, 'do not')
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\bit's\b/g, 'it is')
    // collapse runs of whitespace and strip surrounding punctuation
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. EMERGENCY DETECTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Broad SOS pattern set — multiple overlapping patterns survive partial or
 * mis-transcribed speech. Returning true means the caller MUST show a
 * confirmation step before navigating. Never navigate automatically on these.
 *
 * Verified: any match → NAVIGATE_EMERGENCY after user confirmation.
 */
export const SOS_PATTERNS = [
  /\bsos\b/i,
  /\bemergency\b/i,
  /\bambulance\b/i,
  /\baccident\b/i,
  /\bhelp\s+me\b/i,
  /\bcall\s+(for\s+)?help\b/i,
  /\bheart\s+attack\b/i,
  /\bcardiac\s+arrest\b/i,
  /\bnot\s+breath(ing)?\b/i,
  /\bcan't\s+breath(e)?\b/i,
  /\bcannot\s+breath(e)?\b/i,
  /\bdifficulty\s+breath(ing)?\b/i,
  /\bchest\s+pain\b/i,
  /\bunconsci(ous)?\b/i,
  /\bseizure\b/i,
  /\bstroke\b/i,
  /\bbleeding\s+badly\b/i,
  /\bsevere\s+bleed(ing)?\b/i,
  // Hindi Emergency phrases
  /(?:मदद|सहायता)\s*करो/i,
  /(?:आपातकाल|आपातकालीन)/i,
  /(?:एम्बुलेंस|एंबुलेंस)/i,
  /(?:दुर्घटना|एक्सीडेंट)/i,
  /(?:दिल\s*का\s*दौरा|हार्ट\s*अटैक)/i,
  /(?:सांस\s*नहीं\s*आ\s*रही|सांस\s*लेने\s*में\s*तकलीफ)/i,
  /(?:सीने\s*में\s*दर्द)/i,
  /(?:बेहोश|अचेत)/i,
  /(?:खून\s*बह\s*रहा)/i,
];

/** Returns true if the (normalized) text matches any SOS pattern. */
export function isEmergencyPhrase(text) {
  if (!text) return false;
  return SOS_PATTERNS.some(p => p.test(text));
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMMAND MATCHERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Home navigation.
 * Accepts: "home", "homepage", "go home", "go to home", "take me home",
 *          "open home", "back to home", "return home", etc.
 */
export function matchHome(text) {
  return /\b(go\s+(to\s+)?)?\s*(the\s+)?home(page)?\b/.test(text) ||
    /\btake\s+me\s+(to\s+)?home\b/.test(text) ||
    /\breturn\s+(to\s+)?home\b/.test(text) ||
    /\bopen\s+(the\s+)?home(page)?\b/.test(text) ||
    /^home(page)?$/.test(text.trim());
}

/**
 * AI Assistant navigation.
 * Accepts: "assistant", "chat", "chatbot", "ask ai", "open assistant",
 *          "open chat", "ai assistant", "health assistant", "open the assistant"
 */
export function matchAssistant(text) {
  return /\b(open\s+)?(the\s+)?(ai\s+|health\s+|arogya\s+)?(assistant|chatbot|chat)\b/.test(text) ||
    /\bask\s+(the\s+)?(ai|bot)\b/.test(text) ||
    /^(assistant|chat|chatbot)$/.test(text.trim());
}

/**
 * Symptom checker navigation — no specific symptom term required.
 * Accepts: "check symptoms", "symptom checker", "open symptom checker",
 *          "check my symptoms", "symptoms"
 */
export function matchSymptomCheckerPage(text) {
  return /\b(open\s+)?(the\s+)?(symptom\s*checker|symptoms?\s+page|check\s+(my\s+)?symptoms?)\b/.test(text) ||
    /^symptoms?$/.test(text.trim());
}

/**
 * Medicine search page — no specific medicine required.
 * Accepts: "medicine", "medicines", "open medicine search", "medicine search",
 *          "search medicine", "look up medicine"
 */
export function matchMedicineSearchPage(text) {
  return /\b(open\s+)?(the\s+)?(medicine\s*(search|info|page|database)?|search\s+(for\s+)?medicines?|look\s+up\s+medicines?)\b/.test(text) ||
    /^medicines?$/.test(text.trim());
}

/**
 * Nearby facilities page — generic (no specific facility type).
 * Accepts: "nearby", "find nearby", "near me", "hospitals near me",
 *          "facilities near me", "find facilities", "open nearby"
 */
export function matchNearbyPage(text) {
  return /\b(open\s+)?(the\s+)?(nearby|near\s+me)\b/.test(text) ||
    /\bfind\s+(nearby|facilities|hospitals)\b/.test(text) ||
    /^nearby$/.test(text.trim());
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ENTITY EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Facility types recognized for the /nearby route.
 * Order matters — more specific types first.
 */
const FACILITY_TYPES = [
  'pediatrician', 'gynecologist', 'orthopedist', 'cardiologist',
  'dermatologist', 'neurologist', 'dentist', 'ophthalmologist',
  'pharmacist', 'pharmacy', 'clinic', 'hospital', 'doctor',
];

/**
 * Irregular-plural overrides for facility type matching.
 * Maps the plural form to the canonical singular stored in FACILITY_TYPES.
 */
const FACILITY_PLURAL_MAP = {
  pharmacies: 'pharmacy',
  clinics: 'clinic',
  hospitals: 'hospital',
  doctors: 'doctor',
  dentists: 'dentist',
  pediatricians: 'pediatrician',
  gynecologists: 'gynecologist',
  cardiologists: 'cardiologist',
  neurologists: 'neurologist',
  dermatologists: 'dermatologist',
  ophthalmologists: 'ophthalmologist',
  pharmacists: 'pharmacist',
};

/**
 * Extracts a facility type from a phrase like "find a dentist near me"
 * or "search for pharmacies".
 * Returns the canonical (singular) facility string or null.
 */
export function extractFacilityType(text) {
  // Check irregular plurals first
  for (const [plural, canonical] of Object.entries(FACILITY_PLURAL_MAP)) {
    if (new RegExp(`\\b${plural}\\b`, 'i').test(text)) {
      return canonical;
    }
  }
  // Then check singular/regular plural (e.g. "pharmacy", "pharmacys" is rare but covered)
  for (const fac of FACILITY_TYPES) {
    if (new RegExp(`\\b${fac}s?\\b`, 'i').test(text)) {
      return fac;
    }
  }
  return null;
}

/**
 * Extracts a medicine search term from phrases like:
 *   "tell me about paracetamol"
 *   "search for paracetamol"
 *   "look up dolo 650"
 *   "what is ibuprofen"
 *   "medicine paracetamol"
 *   "paracetamol information"
 *
 * Returns the extracted term (trimmed string) or null.
 *
 * CRITICAL: this function does NOT fuzzy-correct the extracted term.
 * The caller must pass it straight to the medicine search engine.
 * Never silently substitute a different medicine name.
 */
export function extractMedicineTerm(text) {
  // Explicit search/lookup patterns
  const patterns = [
    /\b(?:search\s+(?:for\s+)?|look\s+up\s+|tell\s+me\s+about\s+|what\s+is\s+|about\s+|find\s+(?:medicine\s+)?|medicine\s+(?:info(?:rmation)?\s+(?:for\s+|about\s+)?|for\s+))(.+)/i,
    /\b(?:how\s+(?:to\s+use|do\s+i\s+take|does)\s+)(.+?)(?:\s+work)?$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const candidate = match[1].trim()
        .replace(/\bplease\b/gi, '')
        .replace(/\btablet(s)?\b/gi, '')
        .replace(/\bcapsule(s)?\b/gi, '')
        .trim();
      if (candidate.length >= 2) return candidate;
    }
  }
  return null;
}

/**
 * Extracts a symptom search term from phrases like:
 *   "check fever"
 *   "I have a headache"
 *   "what to do for migraine"
 *   "symptom fever"
 *   "help with stomach pain"
 *
 * Returns the extracted symptom text or null.
 * Does NOT map to a corrected symptom — passes raw to the symptom search engine.
 */
export function extractSymptomTerm(text) {
  // Reject interrogative/conditional phrases that embed "I have" in a longer sentence.
  // These are questions that should fall through to QUERY_ASSISTANT.
  // e.g. "what should I eat if I have diabetes"
  if (/\bif\s+i\s+have\b/i.test(text) || /\bwhat\s+(should|can|do)\b/i.test(text)) {
    return null;
  }

  const patterns = [
    /\b(?:check\s+(?:for\s+)?|i\s+have\s+(?:a\s+)?|what\s+(?:to\s+do\s+for|causes?|is)\s+|help\s+with\s+|symptom\s+(?:for\s+)?)(.+)/i,
    /\b(?:suffering\s+from|dealing\s+with|experiencing)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const candidate = match[1].trim();
      if (candidate.length >= 2) return candidate;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MASTER COMMAND PARSER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Result shapes:
 *   { type: 'NAVIGATE_HOME' }
 *   { type: 'NAVIGATE_ASSISTANT' }
 *   { type: 'NAVIGATE_MEDICINE',  term: string }
 *   { type: 'NAVIGATE_SYMPTOMS',  term: string }
 *   { type: 'NAVIGATE_NEARBY',    facilityType: string | null }
 *   { type: 'NAVIGATE_EMERGENCY' }            ← MUST be confirmed by user
 *   { type: 'QUERY_ASSISTANT',    text: string }   ← fallback
 *   null   ← could not parse; transcript too short/ambiguous to act on
 */
export function parseVoiceCommand(rawText) {
  const text = normalizeText(rawText);

  // Guard: empty after normalization
  if (!text || text.length < 2) return null;

  // 1. Emergency — highest priority; requires user confirmation
  if (isEmergencyPhrase(text)) {
    return { type: 'NAVIGATE_EMERGENCY' };
  }

  // 2. Home
  if (matchHome(text)) {
    return { type: 'NAVIGATE_HOME' };
  }

  // 3. AI Assistant page
  if (matchAssistant(text)) {
    return { type: 'NAVIGATE_ASSISTANT' };
  }

  // 4. Symptom checker page (generic, no entity)
  if (matchSymptomCheckerPage(text)) {
    return { type: 'NAVIGATE_SYMPTOMS', term: '' };
  }

  // 5. Medicine search page (generic, no entity)
  if (matchMedicineSearchPage(text)) {
    return { type: 'NAVIGATE_MEDICINE', term: '' };
  }

  // 6. Nearby with optional facility type
  const facilityType = extractFacilityType(text);
  if (facilityType || matchNearbyPage(text)) {
    return { type: 'NAVIGATE_NEARBY', facilityType: facilityType ?? null };
  }

  // 7. Specific medicine search — extract and pass raw term
  const medicineTerm = extractMedicineTerm(text);
  if (medicineTerm) {
    return { type: 'NAVIGATE_MEDICINE', term: medicineTerm };
  }

  // 8. Specific symptom search — extract and pass raw term
  const symptomTerm = extractSymptomTerm(text);
  if (symptomTerm) {
    return { type: 'NAVIGATE_SYMPTOMS', term: symptomTerm };
  }

  // 9. Fallback: route to AI assistant with the raw query
  //    Only do this for phrases that are at least 3 words (to avoid random garbage)
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 3) {
    return { type: 'QUERY_ASSISTANT', text: rawText.trim() };
  }

  // 10. Unknown / too short — don't act
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SPOKEN RESPONSE STRINGS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the spoken confirmation message for each command type.
 * Kept here so they are testable independently of the TTS API.
 */
export function getSpokenConfirmation(command) {
  if (!command) return '';
  switch (command.type) {
    case 'NAVIGATE_HOME':
      return 'Returning to the home page.';
    case 'NAVIGATE_ASSISTANT':
      return 'Opening the AI Health Assistant.';
    case 'NAVIGATE_MEDICINE':
      return command.term
        ? `Searching for medicine: ${command.term}.`
        : 'Opening Medicine Search.';
    case 'NAVIGATE_SYMPTOMS':
      return command.term
        ? `Checking symptoms for: ${command.term}.`
        : 'Opening the Symptom Checker.';
    case 'NAVIGATE_NEARBY':
      return command.facilityType
        ? `Searching for a ${command.facilityType} near you.`
        : 'Searching for nearby medical facilities.';
    case 'NAVIGATE_EMERGENCY':
      return 'Emergency phrase detected. Please confirm by pressing the button.';
    case 'QUERY_ASSISTANT':
      return `Sending your question to the health assistant.`;
    default:
      return '';
  }
}

/**
 * Builds the navigation path for a given command.
 * Returns a string suitable for react-router's navigate().
 * Returns null for commands that require confirmation (NAVIGATE_EMERGENCY)
 * or have no associated route.
 */
export function getNavigationPath(command) {
  if (!command) return null;
  switch (command.type) {
    case 'NAVIGATE_HOME':
      return '/';
    case 'NAVIGATE_ASSISTANT':
      return '/assistant';
    case 'NAVIGATE_MEDICINE':
      return command.term
        ? `/medicine?search=${encodeURIComponent(command.term)}`
        : '/medicine';
    case 'NAVIGATE_SYMPTOMS':
      return command.term
        ? `/symptoms?search=${encodeURIComponent(command.term)}`
        : '/symptoms';
    case 'NAVIGATE_NEARBY':
      return command.facilityType
        ? `/nearby?search=${encodeURIComponent(command.facilityType)}`
        : '/nearby';
    case 'NAVIGATE_EMERGENCY':
      return '/nearby?emergency=true'; // only used after explicit confirmation
    case 'QUERY_ASSISTANT':
      return `/assistant?search=${encodeURIComponent(command.text)}`;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SPEECH ERROR CLASSIFIER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a SpeechRecognitionErrorEvent.error code into a user-facing
 * message string. Returns null for transient / intentional errors that
 * should not be surfaced to the user.
 */
export function classifySpeechError(errorCode) {
  switch (errorCode) {
    case 'not-allowed':
    case 'permission-denied':
      return 'Microphone access was denied. Please allow microphone permission in your browser settings and try again.';
    case 'network':
      return 'Network error: speech recognition requires an internet connection.';
    case 'audio-capture':
      return 'No microphone was detected. Please connect a microphone and try again.';
    case 'service-not-allowed':
      return 'Speech recognition is blocked on this site. Please check your browser settings.';
    case 'language-not-supported':
      return 'Your chosen language is not supported by your browser\'s speech recognition. Switching to English.';
    case 'no-speech':
    case 'aborted':
      // Transient / intentional — do not display
      return null;
    default:
      return `Voice recognition failed (${errorCode}). Please try again.`;
  }
}
