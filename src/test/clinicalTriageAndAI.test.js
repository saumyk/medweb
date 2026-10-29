import { describe, it, expect } from 'vitest';
import {
  generateClinicalAIResponse,
  classifyUserIntent,
  isRandomOrGibberish,
  hasContradictorySymptoms,
  isPhysicalEmergency
} from '../utils/aiAssistantEngine';
import {
  partitionNegatedSymptoms,
  checkWorseningProgression,
  checkEmergencyWithNegation
} from '../utils/symptomTriage';
import { parsePrescriptionText } from '../utils/prescriptionParser';
import {
  searchMedicines,
  getSpellingCorrection,
  normalizeMedicineQuery
} from '../utils/medicineSearchEngine';
import { lookupMedicine } from '../utils/medicineLookup';

describe('1. Medicine Search QA & Adversarial Tests', () => {
  it('corrects common misspellings to registered medicines', () => {
    const correction1 = getSpellingCorrection('paracetmol');
    expect(correction1.hasCorrection).toBe(true);
    expect(correction1.didYouMean.toLowerCase()).toContain('paracetamol');

    const correction2 = getSpellingCorrection('crocn');
    expect(correction2.hasCorrection).toBe(true);
    expect(correction2.didYouMean.toLowerCase()).toContain('crocin');
  });

  it('normalizes concatenated alphanumeric queries like "dolo650"', () => {
    expect(normalizeMedicineQuery('dolo650')).toBe('dolo 650');
    expect(normalizeMedicineQuery('metformin500mg')).toBe('metformin 500 mg');
  });

  it('finds top match for concatenated brand and strength', () => {
    const results = searchMedicines('dolo650', { limit: 1 });
    expect(results.results.length).toBeGreaterThan(0);
    expect(results.results[0].brandName).toBe('Dolo 650');
  });

  it('throws NOT_FOUND error for nonexistent / fabricated drug names', async () => {
    await expect(lookupMedicine('xyznotarealdrug99999')).rejects.toThrow();
  }, 15000);

  it('throws Empty query error when given empty or whitespace-only string', async () => {
    await expect(lookupMedicine('')).rejects.toThrow('Empty query');
    await expect(lookupMedicine('   ')).rejects.toThrow('Empty query');
  });
});

describe('2. AI Assistant Intent Understanding & Contextual Responses', () => {
  describe('Severed Body Part / Amputation with Storage / Refrigeration', () => {
    const amputationQuery = 'I am cutting my hand and storing it in the refrigerator.';

    it('classifies "I am cutting my hand and storing it in the refrigerator." as AMPUTATION_SEVERE_TRAUMA', () => {
      const classification = classifyUserIntent(amputationQuery);
      expect(classification.intent).toBe('AMPUTATION_SEVERE_TRAUMA');
      expect(classification.isEmergency).toBe(true);
      expect(classification.bodyPart).toBe('hand');
    });

    it('generates immediate trauma emergency response instead of generic body aches / fatigue', () => {
      const res = generateClinicalAIResponse(amputationQuery);
      
      // Must NOT return generic body aches, fatigue, or dehydration
      expect(res.text).not.toContain('General Symptom / Discomfort');
      expect(res.text).not.toContain('Unspecified body aches, fatigue');
      expect(res.text).not.toContain('Drink 8-10 glasses of water');

      // 1. Recognizes the situation
      expect(res.text.toLowerCase()).toContain('cutting your hand and storing it');
      expect(res.isEmergency).toBe(true);

      // 2. Explains immediate first aid: direct pressure to control bleeding & elevate
      expect(res.text).toContain('Control the Bleeding');
      expect(res.text).toContain('continuous direct pressure');
      expect(res.text).toContain('gauze');
      expect(res.text).toContain('Elevate');

      // 3. Explains proper preservation: damp sterile gauze, sealed watertight plastic bag in ice-water slurry
      expect(res.text).toContain('PROPER MEDICAL PRESERVATION');
      expect(res.text).toContain('damp');
      expect(res.text).toContain('sealed plastic bag');
      expect(res.text).toContain('cold water and ice');

      // 4. Critical warnings against direct ice or water submersion
      expect(res.text).toContain('Do NOT place the severed part directly on ice');
      expect(res.text).toContain('Do NOT place the severed part directly in water');

      // 5. Crisis / Mental health helpline (Tele-MANAS) in case of self-harm
      expect(res.text).toContain('Tele-MANAS');
      expect(res.text).toContain('14416');
      expect(res.text).toContain('112');
    });

    it('generates Hindi trauma response when language is "hi"', () => {
      const res = generateClinicalAIResponse(amputationQuery, { language: 'hi' });
      expect(res.isEmergency).toBe(true);
      expect(res.text).toContain('कटे हुए अंग');
      expect(res.text).toContain('112');
      expect(res.text).toContain('Tele-MANAS');
    });
  });

  describe('Hypothetical & Educational Injury Queries', () => {
    const cutQuestion = 'What happens if someone cuts their hand?';

    it('classifies "What happens if someone cuts their hand?" as INJURY_EDUCATIONAL', () => {
      const classification = classifyUserIntent(cutQuestion);
      expect(classification.intent).toBe('INJURY_EDUCATIONAL');
      expect(classification.bodyPart).toBe('hand');
      expect(classification.isHypothetical).toBe(true);
    });

    it('explains anatomical structures, first aid, and red flags without generic symptom templates', () => {
      const res = generateClinicalAIResponse(cutQuestion);
      expect(res.type).toBe('injury_educational');
      expect(res.text).toContain('Hand Injury & Laceration');
      expect(res.text).toContain('nerves, tendons');
      expect(res.text.toLowerCase()).toContain('direct pressure');
      expect(res.text).toContain('Tetanus');
      expect(res.text).not.toContain('General Symptom / Discomfort');
    });
  });

  describe('General Health Concept Questions ("What is a fever?")', () => {
    const feverQuestion = 'What is a fever?';

    it('classifies "What is a fever?" as GENERAL_HEALTH_QUESTION', () => {
      const classification = classifyUserIntent(feverQuestion);
      expect(classification.intent).toBe('GENERAL_HEALTH_QUESTION');
      expect(classification.concept).toBe('fever');
    });

    it('explains clinical temperature ranges, immune mechanisms, and causes without diet lists', () => {
      const res = generateClinicalAIResponse(feverQuestion);
      expect(res.type).toBe('general_health_question');
      expect(res.text).toContain('What is a Fever?');
      expect(res.text).toContain('98.6°F');
      expect(res.text).toContain('100.4°F');
      expect(res.text).toContain('103°F');
      expect(res.text).toContain('hypothalamus');
      expect(res.text).toContain('pyrogens');
      expect(res.text).not.toContain('General Symptom / Discomfort');
      expect(res.text).not.toContain('🍏 What to Eat:');
    });

    it('explains blood pressure concepts for "What is normal blood pressure?"', () => {
      const res = generateClinicalAIResponse('What is normal blood pressure?');
      expect(res.type).toBe('general_health_question');
      expect(res.text).toContain('120/80 mmHg');
      expect(res.text).toContain('Hypertension');
    });
  });

  describe('Active Symptom Reporting ("I have a headache")', () => {
    const headacheQuery = 'I have a headache.';

    it('classifies "I have a headache." as SYMPTOM_REPORT', () => {
      const classification = classifyUserIntent(headacheQuery);
      expect(classification.intent).toBe('SYMPTOM_REPORT');
    });

    it('acknowledges headache, asks clarifying questions, and provides supportive care and red flags', () => {
      const res = generateClinicalAIResponse(headacheQuery);
      expect(res.type).toBe('symptom_report');
      expect(res.text).toContain('Clinical Guidance: Headache');
      expect(res.text).toContain('Clarifying Questions to Consider');
      expect(res.text).toContain('Quiet, Dark Room');
      expect(res.text).toContain('thunderclap');
      expect(res.text).not.toContain('General Symptom / Discomfort');
    });
  });

  describe('First-Aid Queries (Burns, Nosebleeds)', () => {
    it('provides burn first-aid protocol', () => {
      const res = generateClinicalAIResponse('I burned my finger on hot pan');
      expect(res.type).toBe('first_aid');
      expect(res.text).toContain('Burn Care');
      expect(res.text).toContain('cool (not ice cold) running water');
      expect(res.text).toContain('Do NOT apply ice');
    });

    it('provides nosebleed first-aid protocol', () => {
      const res = generateClinicalAIResponse('How do I stop a nosebleed?');
      expect(res.type).toBe('first_aid');
      expect(res.text).toContain('Nosebleed');
      expect(res.text).toContain('Lean Slightly Forward');
      expect(res.text).toContain('Pinch the Soft Part');
    });
  });

  describe('Medicine Inquiries', () => {
    it('provides monograph details for "What is paracetamol?"', () => {
      const res = generateClinicalAIResponse('What is paracetamol?');
      expect(res.type).toBe('medicine_inquiry');
      expect(res.text).toContain('Paracetamol');
      expect(res.text).toContain('Analgesic');
    });
  });

  describe('Greetings and pleasantries', () => {
    it('returns welcoming greeting for "hello", "hi", "namaste" without diagnosing illness', () => {
      const res = generateClinicalAIResponse('hello');
      expect(res.type).toBe('greeting');
      expect(res.text).toContain('Hello! I am Arogya AI');
      expect(res.text).not.toContain('General Symptom / Discomfort');
    });

    it('returns Hindi greeting when language is "hi"', () => {
      const res = generateClinicalAIResponse('namaste', { language: 'hi' });
      expect(res.type).toBe('greeting');
      expect(res.text).toContain('नमस्ते');
    });
  });

  describe('Unrelated and off-topic inquiries', () => {
    it('politely informs user of medical scope when asked off-topic questions', () => {
      const res = generateClinicalAIResponse('how do I repair car engine?');
      expect(res.type).toBe('off_topic');
      expect(res.text).toContain('MedWeb Scope Reminder');
    });
  });

  describe('Random characters and gibberish', () => {
    it('detects keyboard smashes and asks for clear symptom description', () => {
      expect(isRandomOrGibberish('asdfghjklqwerty')).toBe(true);
      expect(isRandomOrGibberish('zzzzzzz')).toBe(true);

      const res = generateClinicalAIResponse('asdfghjkl');
      expect(res.type).toBe('gibberish');
      expect(res.text).toContain('Unclear Input');
    });
  });

  describe('Contradictory inputs', () => {
    it('detects contradiction when user claims both no pain and severe pain', () => {
      expect(hasContradictorySymptoms('I have no pain but severe pain in my leg')).toBe(true);
      const res = generateClinicalAIResponse('I have no pain but severe pain in my leg');
      expect(res.type).toBe('contradiction');
      expect(res.text).toContain('Clarification Needed');
    });
  });

  describe('Unsafe requests (Crisis, suicide, prescription generation)', () => {
    it('triggers crisis helpline resources for self-harm / suicide mentions', () => {
      const res = generateClinicalAIResponse('I want to kill myself');
      expect(res.type).toBe('crisis');
      expect(res.isEmergency).toBe(true);
      expect(res.text).toContain('Tele-MANAS');
      expect(res.text).toContain('14416');
      expect(res.text).toContain('112');
    });

    it('detects physical medical emergencies and accounts for negation', () => {
      expect(isPhysicalEmergency('I have crushing chest pain and shortness of breath')).toBe(true);
      expect(isPhysicalEmergency('I have no chest pain and no difficulty breathing')).toBe(false);
      const res = generateClinicalAIResponse('I am having sudden crushing chest pain radiating to left arm');
      expect(res.type).toBe('emergency');
      expect(res.isEmergency).toBe(true);
      expect(res.text).toContain('POSSIBLE MEDICAL EMERGENCY');
    });

    it('refuses to issue prescriptions and provides clinical explanation', () => {
      const res = generateClinicalAIResponse('Please prescribe me antibiotics');
      expect(res.type).toBe('prescription_refusal');
      expect(res.text).toContain('Clinical Policy Notice');
      expect(res.text).toContain('cannot issue prescriptions');
    });
  });
});

describe('3. Symptom Checker Negation & Triage Tests', () => {
  it('correctly partitions affirmed vs negated symptoms', () => {
    const { affirmedText, negatedTokens } = partitionNegatedSymptoms(
      'I have severe headache, but no fever and no chest pain'
    );
    expect(affirmedText.toLowerCase()).toContain('severe headache');
    expect(negatedTokens.length).toBeGreaterThan(0);
    expect(negatedTokens.some(t => t.includes('chest pain'))).toBe(true);
  });

  it('does not trigger emergency when emergency symptoms are negated', () => {
    expect(checkEmergencyWithNegation('I have cough, but no chest pain and no breathing trouble')).toBe(false);
  });

  it('triggers emergency when true emergency symptom is affirmed', () => {
    expect(checkEmergencyWithNegation('I have severe chest tightness and difficulty breathing')).toBe(true);
  });

  it('detects worsening symptom progression keywords', () => {
    expect(checkWorseningProgression('my symptoms are rapidly worsening')).toBe(true);
    expect(checkWorseningProgression('pain is getting worse every hour')).toBe(true);
    expect(checkWorseningProgression('stable mild headache')).toBe(false);
  });
});

describe('4. Prescription OCR Strength & Quality Tests', () => {
  it('flags isStrengthUncertain when prescription text does not specify strength', () => {
    const rawText = `Dr. Sharma Clinic
Rx:
1. Tab. Dolo - 1-0-1 after food x 5 days`;

    const parsed = parsePrescriptionText(rawText);
    expect(parsed.medicines.length).toBe(1);
    const dolo = parsed.medicines[0];
    expect(dolo.isStrengthUncertain).toBe(true);
    expect(dolo.strengthWarning).toContain('Strength not explicitly specified');
    expect(parsed.safetyAlerts.some(a => a.title.includes('Uncertain Dosage Strength'))).toBe(true);
  });

  it('marks isStrengthUncertain as false when exact strength is explicitly extracted', () => {
    const rawText = `Dr. Sharma Clinic
Rx:
1. Tab. Dolo 650mg - 1-0-1 after food x 5 days`;

    const parsed = parsePrescriptionText(rawText);
    expect(parsed.medicines.length).toBe(1);
    const dolo = parsed.medicines[0];
    expect(dolo.isStrengthUncertain).toBe(false);
    expect(dolo.strength).toContain('650');
  });
});
