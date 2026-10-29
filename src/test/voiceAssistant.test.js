/**
 * voiceAssistant.test.js
 *
 * Tests for src/utils/commandParser.js — the pure, side-effect-free voice
 * command parsing module.
 *
 * No browser APIs, no React, no SpeechRecognition objects are used here.
 * The tests also cover mock-based speech API error handling behaviour by
 * directly calling the classifier functions.
 *
 * Test groups:
 *  1. Text normalization
 *  2. Emergency detection (SOS_PATTERNS)
 *  3. Home command matching
 *  4. AI Assistant command matching
 *  5. Symptom checker page command matching
 *  6. Medicine search page command matching
 *  7. Nearby facilities command matching
 *  8. Facility type extraction
 *  9. Medicine term extraction (no silent substitution)
 * 10. Symptom term extraction
 * 11. Master parseVoiceCommand — full phrase to result
 * 12. Spoken confirmation strings
 * 13. Navigation path building
 * 14. Speech error classifier
 * 15. Edge cases: empty, too-short, all-whitespace
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  isEmergencyPhrase,
  matchHome,
  matchAssistant,
  matchSymptomCheckerPage,
  matchMedicineSearchPage,
  matchNearbyPage,
  extractFacilityType,
  extractMedicineTerm,
  extractSymptomTerm,
  parseVoiceCommand,
  getSpokenConfirmation,
  getNavigationPath,
  classifySpeechError,
} from '../utils/commandParser';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Text normalization
// ─────────────────────────────────────────────────────────────────────────────
describe('normalizeText', () => {
  it('lowercases input', () => {
    expect(normalizeText('GO HOME')).toBe('go home');
  });

  it('collapses repeated whitespace', () => {
    expect(normalizeText('go   home')).toBe('go home');
  });

  it('strips leading and trailing whitespace', () => {
    expect(normalizeText('  go home  ')).toBe('go home');
  });

  it('replaces punctuation with spaces', () => {
    expect(normalizeText('go home!')).toBe('go home');
    expect(normalizeText('go home?')).toBe('go home');
    expect(normalizeText('go home.')).toBe('go home');
    // The comma is replaced by a space, then the whitespace-collapse step
    // reduces the resulting double-space to a single space.
    expect(normalizeText('go, home')).toBe('go home');
  });

  it('normalizes contractions', () => {
    expect(normalizeText("I can't breathe")).toContain('cannot');
    expect(normalizeText("I won't open")).toContain('will not');
    expect(normalizeText("don't navigate")).toContain('do not');
  });

  it('handles null/undefined gracefully', () => {
    expect(normalizeText(null)).toBe('');
    expect(normalizeText(undefined)).toBe('');
    expect(normalizeText('')).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Emergency detection
// ─────────────────────────────────────────────────────────────────────────────
describe('isEmergencyPhrase', () => {
  // True positives
  it('detects "SOS"', () => expect(isEmergencyPhrase('SOS')).toBe(true));
  it('detects "emergency"', () => expect(isEmergencyPhrase('this is an emergency')).toBe(true));
  it('detects "ambulance"', () => expect(isEmergencyPhrase('call an ambulance')).toBe(true));
  it('detects "accident"', () => expect(isEmergencyPhrase('there was an accident')).toBe(true));
  it('detects "help me"', () => expect(isEmergencyPhrase('please help me')).toBe(true));
  it('detects "call for help"', () => expect(isEmergencyPhrase('call for help now')).toBe(true));
  it('detects "heart attack"', () => expect(isEmergencyPhrase('I think I am having a heart attack')).toBe(true));
  it('detects "cardiac arrest"', () => expect(isEmergencyPhrase('cardiac arrest')).toBe(true));
  it('detects "not breathing"', () => expect(isEmergencyPhrase('he is not breathing')).toBe(true));
  it('detects "cannot breathe"', () => expect(isEmergencyPhrase('I cannot breathe')).toBe(true));
  it('detects "difficulty breathing"', () => expect(isEmergencyPhrase('difficulty breathing since an hour')).toBe(true));
  it('detects "chest pain"', () => expect(isEmergencyPhrase('I have chest pain')).toBe(true));
  it('detects "unconscious"', () => expect(isEmergencyPhrase('she is unconscious')).toBe(true));
  it('detects "seizure"', () => expect(isEmergencyPhrase('he is having a seizure')).toBe(true));
  it('detects "stroke"', () => expect(isEmergencyPhrase('I think I am having a stroke')).toBe(true));
  it('detects "bleeding badly"', () => expect(isEmergencyPhrase('she is bleeding badly')).toBe(true));
  it('detects "severe bleeding"', () => expect(isEmergencyPhrase('severe bleeding from a wound')).toBe(true));
  it('detects Hindi emergency "मदद करो"', () => expect(isEmergencyPhrase('मेरी मदद करो')).toBe(true));
  it('detects Hindi emergency "सीने में दर्द"', () => expect(isEmergencyPhrase('सीने में दर्द है')).toBe(true));
  it('detects Hindi emergency "एम्बुलेंस"', () => expect(isEmergencyPhrase('एम्बुलेंस बुलाओ')).toBe(true));

  // Case-insensitive
  it('is case-insensitive', () => {
    expect(isEmergencyPhrase('Emergency')).toBe(true);
    expect(isEmergencyPhrase('EMERGENCY')).toBe(true);
    expect(isEmergencyPhrase('emergency')).toBe(true);
  });

  // True negatives — must NOT false-positive
  it('does not trigger on "find a hospital"', () => expect(isEmergencyPhrase('find a hospital near me')).toBe(false));
  it('does not trigger on mild fever query', () => expect(isEmergencyPhrase('I have a mild fever')).toBe(false));
  it('does not trigger on medicine search', () => expect(isEmergencyPhrase('search for paracetamol')).toBe(false));
  it('does not trigger on "I need help" alone', () => expect(isEmergencyPhrase('I need help')).toBe(false));
  it('does not trigger on empty string', () => expect(isEmergencyPhrase('')).toBe(false));
  it('does not trigger on null', () => expect(isEmergencyPhrase(null)).toBe(false));
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Home command matching
// ─────────────────────────────────────────────────────────────────────────────
describe('matchHome', () => {
  const truths = [
    'home', 'homepage', 'go home', 'go to home', 'go to homepage',
    'take me home', 'take me to home', 'return home', 'return to home',
    'open home', 'open homepage',
  ];
  truths.forEach(phrase => {
    it(`matches: "${phrase}"`, () => expect(matchHome(phrase)).toBe(true));
  });

  const falses = ['hospital', 'homework', 'homerun', 'open assistant', ''];
  falses.forEach(phrase => {
    it(`does not match: "${phrase}"`, () => expect(matchHome(phrase)).toBe(false));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. AI Assistant command matching
// ─────────────────────────────────────────────────────────────────────────────
describe('matchAssistant', () => {
  const truths = [
    'assistant', 'chat', 'chatbot',
    'open assistant', 'open the assistant', 'open chat', 'open chatbot',
    'ai assistant', 'health assistant', 'arogya assistant',
    'ask the ai', 'ask the bot',
  ];
  truths.forEach(phrase => {
    it(`matches: "${phrase}"`, () => expect(matchAssistant(phrase)).toBe(true));
  });

  const falses = ['home', 'medicine', 'nearby', ''];
  falses.forEach(phrase => {
    it(`does not match: "${phrase}"`, () => expect(matchAssistant(phrase)).toBe(false));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Symptom checker page command matching
// ─────────────────────────────────────────────────────────────────────────────
describe('matchSymptomCheckerPage', () => {
  const truths = [
    'symptoms', 'symptom checker', 'open symptom checker',
    'check symptoms', 'check my symptoms', 'symptoms page',
  ];
  truths.forEach(phrase => {
    it(`matches: "${phrase}"`, () => expect(matchSymptomCheckerPage(phrase)).toBe(true));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Medicine search page command matching
// ─────────────────────────────────────────────────────────────────────────────
describe('matchMedicineSearchPage', () => {
  const truths = [
    'medicine', 'medicines', 'medicine search', 'open medicine search',
    'search medicine', 'look up medicine', 'medicine page',
    'open medicine database',
  ];
  truths.forEach(phrase => {
    it(`matches: "${phrase}"`, () => expect(matchMedicineSearchPage(phrase)).toBe(true));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Nearby facilities page command matching
// ─────────────────────────────────────────────────────────────────────────────
describe('matchNearbyPage', () => {
  const truths = [
    'nearby', 'find nearby', 'near me', 'open nearby',
    'find facilities', 'find hospitals',
  ];
  truths.forEach(phrase => {
    it(`matches: "${phrase}"`, () => expect(matchNearbyPage(phrase)).toBe(true));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Facility type extraction
// ─────────────────────────────────────────────────────────────────────────────
describe('extractFacilityType', () => {
  it('extracts "pharmacy" from "find a pharmacy near me"', () => {
    expect(extractFacilityType('find a pharmacy near me')).toBe('pharmacy');
  });

  it('extracts "dentist" from "search for a dentist"', () => {
    expect(extractFacilityType('search for a dentist')).toBe('dentist');
  });

  it('extracts "hospital" from "hospital near me"', () => {
    expect(extractFacilityType('hospital near me')).toBe('hospital');
  });

  it('extracts "clinic" from "find a clinic"', () => {
    expect(extractFacilityType('find a clinic')).toBe('clinic');
  });

  it('extracts "doctor" from "find a doctor"', () => {
    expect(extractFacilityType('find a doctor')).toBe('doctor');
  });

  it('extracts "pediatrician" from "I need a pediatrician"', () => {
    expect(extractFacilityType('i need a pediatrician')).toBe('pediatrician');
  });

  it('extracts "cardiologist" from "cardiologist near me"', () => {
    expect(extractFacilityType('cardiologist near me')).toBe('cardiologist');
  });

  it('handles plural "pharmacies"', () => {
    expect(extractFacilityType('pharmacies near me')).toBe('pharmacy');
  });

  it('returns null for non-facility phrases', () => {
    expect(extractFacilityType('open home')).toBeNull();
    expect(extractFacilityType('check fever')).toBeNull();
    expect(extractFacilityType('')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Medicine term extraction — no silent substitution
// ─────────────────────────────────────────────────────────────────────────────
describe('extractMedicineTerm', () => {
  it('extracts "paracetamol" from "search for paracetamol"', () => {
    expect(extractMedicineTerm('search for paracetamol')).toBe('paracetamol');
  });

  it('extracts "dolo 650" from "tell me about dolo 650"', () => {
    expect(extractMedicineTerm('tell me about dolo 650')).toBe('dolo 650');
  });

  it('extracts "ibuprofen" from "what is ibuprofen"', () => {
    expect(extractMedicineTerm('what is ibuprofen')).toBe('ibuprofen');
  });

  it('extracts "amoxicillin" from "look up amoxicillin"', () => {
    expect(extractMedicineTerm('look up amoxicillin')).toBe('amoxicillin');
  });

  it('extracts term from "medicine for paracetamol"', () => {
    expect(extractMedicineTerm('medicine for paracetamol')).toBe('paracetamol');
  });

  it('returns null for phrases without a medicine term', () => {
    expect(extractMedicineTerm('go home')).toBeNull();
    expect(extractMedicineTerm('emergency')).toBeNull();
    expect(extractMedicineTerm('')).toBeNull();
  });

  it('does NOT correct a garbled medicine name — returns it raw', () => {
    // If the user says "parasetamol" (typo), we must pass it raw to the search
    // engine. The commandParser must NOT silently substitute "paracetamol".
    const result = extractMedicineTerm('search for parasetamol');
    // Should return the raw transcript term, not a corrected version
    expect(result).toBe('parasetamol');
    expect(result).not.toBe('paracetamol');
  });

  it('strips "tablet" suffix from extracted term', () => {
    const result = extractMedicineTerm('search for paracetamol tablet');
    // "tablet" should be stripped per the implementation
    expect(result).not.toContain('tablet');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Symptom term extraction
// ─────────────────────────────────────────────────────────────────────────────
describe('extractSymptomTerm', () => {
  it('extracts "fever" from "check fever"', () => {
    expect(extractSymptomTerm('check fever')).toBe('fever');
  });

  it('extracts "headache" from "I have a headache"', () => {
    expect(extractSymptomTerm('i have a headache')).toBe('headache');
  });

  it('extracts "migraine" from "what to do for migraine"', () => {
    expect(extractSymptomTerm('what to do for migraine')).toBe('migraine');
  });

  it('extracts term from "help with stomach pain"', () => {
    expect(extractSymptomTerm('help with stomach pain')).toBe('stomach pain');
  });

  it('extracts "fever" from "I am suffering from fever"', () => {
    expect(extractSymptomTerm('i am suffering from fever')).toBe('fever');
  });

  it('returns null for non-symptom phrases', () => {
    expect(extractSymptomTerm('go home')).toBeNull();
    expect(extractSymptomTerm('')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. Master parseVoiceCommand
// ─────────────────────────────────────────────────────────────────────────────
describe('parseVoiceCommand', () => {
  // ── Emergency (highest priority) ──────────────────────────────────────────
  it('returns NAVIGATE_EMERGENCY for "emergency"', () => {
    expect(parseVoiceCommand('emergency')).toEqual({ type: 'NAVIGATE_EMERGENCY' });
  });

  it('returns NAVIGATE_EMERGENCY for "call ambulance"', () => {
    expect(parseVoiceCommand('call ambulance')).toEqual({ type: 'NAVIGATE_EMERGENCY' });
  });

  it('NAVIGATE_EMERGENCY takes priority over home-sounding phrases', () => {
    // "SOS go home" — emergency wins
    const result = parseVoiceCommand('SOS go home');
    expect(result.type).toBe('NAVIGATE_EMERGENCY');
  });

  // ── Home ──────────────────────────────────────────────────────────────────
  it('returns NAVIGATE_HOME for "go home"', () => {
    expect(parseVoiceCommand('go home')).toEqual({ type: 'NAVIGATE_HOME' });
  });

  it('returns NAVIGATE_HOME for "take me to homepage"', () => {
    expect(parseVoiceCommand('take me to homepage')).toEqual({ type: 'NAVIGATE_HOME' });
  });

  it('returns NAVIGATE_HOME for "Go Home" (case)', () => {
    expect(parseVoiceCommand('Go Home')).toEqual({ type: 'NAVIGATE_HOME' });
  });

  // ── Assistant ─────────────────────────────────────────────────────────────
  it('returns NAVIGATE_ASSISTANT for "open assistant"', () => {
    expect(parseVoiceCommand('open assistant')).toEqual({ type: 'NAVIGATE_ASSISTANT' });
  });

  it('returns NAVIGATE_ASSISTANT for "open the health assistant"', () => {
    expect(parseVoiceCommand('open the health assistant')).toEqual({ type: 'NAVIGATE_ASSISTANT' });
  });

  it('returns NAVIGATE_ASSISTANT for "chat"', () => {
    expect(parseVoiceCommand('chat')).toEqual({ type: 'NAVIGATE_ASSISTANT' });
  });

  // ── Symptom checker page ──────────────────────────────────────────────────
  it('returns NAVIGATE_SYMPTOMS (empty term) for "open symptom checker"', () => {
    const result = parseVoiceCommand('open symptom checker');
    expect(result.type).toBe('NAVIGATE_SYMPTOMS');
    expect(result.term).toBe('');
  });

  it('returns NAVIGATE_SYMPTOMS (empty term) for "check symptoms"', () => {
    expect(parseVoiceCommand('check symptoms')).toMatchObject({ type: 'NAVIGATE_SYMPTOMS', term: '' });
  });

  // ── Medicine search page ──────────────────────────────────────────────────
  it('returns NAVIGATE_MEDICINE (empty term) for "open medicine search"', () => {
    const result = parseVoiceCommand('open medicine search');
    expect(result.type).toBe('NAVIGATE_MEDICINE');
    expect(result.term).toBe('');
  });

  it('returns NAVIGATE_MEDICINE (empty term) for "medicine"', () => {
    expect(parseVoiceCommand('medicine')).toMatchObject({ type: 'NAVIGATE_MEDICINE', term: '' });
  });

  // ── Nearby ────────────────────────────────────────────────────────────────
  it('returns NAVIGATE_NEARBY for "find a pharmacy near me"', () => {
    const result = parseVoiceCommand('find a pharmacy near me');
    expect(result.type).toBe('NAVIGATE_NEARBY');
    expect(result.facilityType).toBe('pharmacy');
  });

  it('returns NAVIGATE_NEARBY with null facilityType for "nearby"', () => {
    const result = parseVoiceCommand('nearby');
    expect(result.type).toBe('NAVIGATE_NEARBY');
    expect(result.facilityType).toBeNull();
  });

  it('returns NAVIGATE_NEARBY for "find a dentist near me"', () => {
    expect(parseVoiceCommand('find a dentist near me')).toMatchObject({
      type: 'NAVIGATE_NEARBY',
      facilityType: 'dentist',
    });
  });

  // ── Specific medicine ─────────────────────────────────────────────────────
  it('returns NAVIGATE_MEDICINE with term for "search for paracetamol"', () => {
    const result = parseVoiceCommand('search for paracetamol');
    expect(result.type).toBe('NAVIGATE_MEDICINE');
    expect(result.term).toBe('paracetamol');
  });

  it('returns NAVIGATE_MEDICINE with raw term for garbled medicine name', () => {
    const result = parseVoiceCommand('search for parasetamol');
    expect(result.type).toBe('NAVIGATE_MEDICINE');
    // Raw term returned — no silent substitution
    expect(result.term).toBe('parasetamol');
    expect(result.term).not.toBe('paracetamol');
  });

  it('returns NAVIGATE_MEDICINE for "tell me about dolo 650"', () => {
    const result = parseVoiceCommand('tell me about dolo 650');
    expect(result.type).toBe('NAVIGATE_MEDICINE');
    expect(result.term).toContain('dolo');
  });

  // ── Specific symptom ─────────────────────────────────────────────────────
  it('returns NAVIGATE_SYMPTOMS with term for "I have a headache"', () => {
    const result = parseVoiceCommand('I have a headache');
    expect(result.type).toBe('NAVIGATE_SYMPTOMS');
    expect(result.term).toContain('headache');
  });

  it('returns NAVIGATE_SYMPTOMS with term for "check fever"', () => {
    const result = parseVoiceCommand('check fever');
    expect(result.type).toBe('NAVIGATE_SYMPTOMS');
    expect(result.term).toBe('fever');
  });

  // ── Fallback ──────────────────────────────────────────────────────────────
  it('returns QUERY_ASSISTANT for a long unrecognized phrase', () => {
    const result = parseVoiceCommand('what should I eat if I have diabetes');
    expect(result.type).toBe('QUERY_ASSISTANT');
    expect(result.text).toBeTruthy();
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  it('returns null for empty string', () => {
    expect(parseVoiceCommand('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(parseVoiceCommand('   ')).toBeNull();
  });

  it('returns null for single-character input', () => {
    expect(parseVoiceCommand('a')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(parseVoiceCommand(null)).toBeNull();
  });

  it('handles excessive whitespace gracefully', () => {
    const result = parseVoiceCommand('  go   home  ');
    expect(result).toEqual({ type: 'NAVIGATE_HOME' });
  });

  it('handles ALL-CAPS input', () => {
    expect(parseVoiceCommand('GO HOME')).toEqual({ type: 'NAVIGATE_HOME' });
  });

  it('handles punctuation in input', () => {
    expect(parseVoiceCommand('go home!')).toEqual({ type: 'NAVIGATE_HOME' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. Spoken confirmation strings
// ─────────────────────────────────────────────────────────────────────────────
describe('getSpokenConfirmation', () => {
  it('returns a non-empty string for NAVIGATE_HOME', () => {
    const msg = getSpokenConfirmation({ type: 'NAVIGATE_HOME' });
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('includes medicine name in NAVIGATE_MEDICINE with term', () => {
    const msg = getSpokenConfirmation({ type: 'NAVIGATE_MEDICINE', term: 'paracetamol' });
    expect(msg.toLowerCase()).toContain('paracetamol');
  });

  it('includes facility type in NAVIGATE_NEARBY with facilityType', () => {
    const msg = getSpokenConfirmation({ type: 'NAVIGATE_NEARBY', facilityType: 'pharmacy' });
    expect(msg.toLowerCase()).toContain('pharmacy');
  });

  it('mentions confirmation requirement for NAVIGATE_EMERGENCY', () => {
    const msg = getSpokenConfirmation({ type: 'NAVIGATE_EMERGENCY' });
    expect(msg.toLowerCase()).toMatch(/confirm|emergency/);
  });

  it('returns empty string for null command', () => {
    expect(getSpokenConfirmation(null)).toBe('');
  });

  it('returns empty string for unknown command type', () => {
    expect(getSpokenConfirmation({ type: 'UNKNOWN_TYPE' })).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. Navigation path building
// ─────────────────────────────────────────────────────────────────────────────
describe('getNavigationPath', () => {
  it('returns "/" for NAVIGATE_HOME', () => {
    expect(getNavigationPath({ type: 'NAVIGATE_HOME' })).toBe('/');
  });

  it('returns "/assistant" for NAVIGATE_ASSISTANT', () => {
    expect(getNavigationPath({ type: 'NAVIGATE_ASSISTANT' })).toBe('/assistant');
  });

  it('returns "/medicine?search=..." for NAVIGATE_MEDICINE with term', () => {
    const path = getNavigationPath({ type: 'NAVIGATE_MEDICINE', term: 'paracetamol' });
    expect(path).toBe('/medicine?search=paracetamol');
  });

  it('returns "/medicine" for NAVIGATE_MEDICINE with empty term', () => {
    expect(getNavigationPath({ type: 'NAVIGATE_MEDICINE', term: '' })).toBe('/medicine');
  });

  it('returns "/symptoms?search=..." for NAVIGATE_SYMPTOMS with term', () => {
    const path = getNavigationPath({ type: 'NAVIGATE_SYMPTOMS', term: 'fever' });
    expect(path).toBe('/symptoms?search=fever');
  });

  it('returns "/symptoms" for NAVIGATE_SYMPTOMS with empty term', () => {
    expect(getNavigationPath({ type: 'NAVIGATE_SYMPTOMS', term: '' })).toBe('/symptoms');
  });

  it('returns "/nearby?search=pharmacy" for NAVIGATE_NEARBY with facilityType', () => {
    const path = getNavigationPath({ type: 'NAVIGATE_NEARBY', facilityType: 'pharmacy' });
    expect(path).toBe('/nearby?search=pharmacy');
  });

  it('returns "/nearby" for NAVIGATE_NEARBY without facilityType', () => {
    expect(getNavigationPath({ type: 'NAVIGATE_NEARBY', facilityType: null })).toBe('/nearby');
  });

  it('returns "/nearby?emergency=true" for NAVIGATE_EMERGENCY', () => {
    expect(getNavigationPath({ type: 'NAVIGATE_EMERGENCY' })).toBe('/nearby?emergency=true');
  });

  it('returns "/assistant?search=..." for QUERY_ASSISTANT', () => {
    const path = getNavigationPath({ type: 'QUERY_ASSISTANT', text: 'what is malaria' });
    expect(path).toContain('/assistant?search=');
    expect(path).toContain('malaria');
  });

  it('URL-encodes medicine names with special characters', () => {
    const path = getNavigationPath({ type: 'NAVIGATE_MEDICINE', term: 'dolo 650' });
    expect(path).toContain('dolo%20650');
  });

  it('returns null for null input', () => {
    expect(getNavigationPath(null)).toBeNull();
  });

  it('returns null for unknown command type', () => {
    expect(getNavigationPath({ type: 'UNKNOWN' })).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. Speech error classifier
// ─────────────────────────────────────────────────────────────────────────────
describe('classifySpeechError', () => {
  it('returns user-friendly message for "not-allowed"', () => {
    const msg = classifySpeechError('not-allowed');
    expect(msg).toBeTruthy();
    expect(msg.toLowerCase()).toMatch(/microphone|permission/);
  });

  it('returns user-friendly message for "permission-denied"', () => {
    const msg = classifySpeechError('permission-denied');
    expect(msg).toBeTruthy();
    expect(msg.toLowerCase()).toMatch(/microphone|permission/);
  });

  it('returns user-friendly message for "network"', () => {
    const msg = classifySpeechError('network');
    expect(msg.toLowerCase()).toContain('network');
  });

  it('returns user-friendly message for "audio-capture"', () => {
    const msg = classifySpeechError('audio-capture');
    expect(msg.toLowerCase()).toContain('microphone');
  });

  it('returns user-friendly message for "service-not-allowed"', () => {
    const msg = classifySpeechError('service-not-allowed');
    expect(msg).toBeTruthy();
  });

  it('returns user-friendly message for "language-not-supported"', () => {
    const msg = classifySpeechError('language-not-supported');
    expect(msg).toBeTruthy();
  });

  it('returns null for "no-speech" (transient — do not show to user)', () => {
    expect(classifySpeechError('no-speech')).toBeNull();
  });

  it('returns null for "aborted" (intentional stop)', () => {
    expect(classifySpeechError('aborted')).toBeNull();
  });

  it('returns a generic message for an unknown error code', () => {
    const msg = classifySpeechError('some-unknown-error');
    expect(msg).toBeTruthy();
    expect(msg).toContain('some-unknown-error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. Deduplication / stale callback — parseVoiceCommand stability
// ─────────────────────────────────────────────────────────────────────────────
describe('parseVoiceCommand — repeated activation stability', () => {
  it('produces the same result for the same input (pure function)', () => {
    const input = 'go home';
    const r1 = parseVoiceCommand(input);
    const r2 = parseVoiceCommand(input);
    expect(r1).toEqual(r2);
  });

  it('does not mutate its input', () => {
    const input = 'open assistant';
    const before = input;
    parseVoiceCommand(input);
    expect(input).toBe(before);
  });

  it('emergency detection is independent of call order', () => {
    // Calling isEmergencyPhrase multiple times on same text should not change result
    const text = 'this is an emergency';
    const results = Array.from({ length: 5 }, () => isEmergencyPhrase(text));
    expect(results.every(r => r === true)).toBe(true);
  });
});
