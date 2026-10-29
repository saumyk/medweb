/**
 * aiAssistantEngine.js
 *
 * Clinical Natural Language Understanding & Conversational Intelligence Engine for Arogya AI.
 * 
 * Pipeline:
 * 1. Intent & Semantic Classification:
 *    - Amputation / Severe Laceration / Trauma Preservation
 *    - Acute Injury & First Aid (Cuts, Burns, Bites, Fractures, Nosebleeds)
 *    - Hypothetical / Educational Injury Inquiries
 *    - General Health Concept Questions ("What is a fever?", "What is hypertension?")
 *    - Active Symptom Descriptions ("I have a headache")
 *    - Medicine Knowledge & Drug Interactions
 *    - Prescription Boundary Enforcement
 *    - Crisis & Self-Harm Intervention (Tele-MANAS 14416 & 112)
 *    - Physical Life-Threatening Emergencies (Chest pain, Stroke, Anaphylaxis)
 *    - Greetings & Polite Conversation
 *    - Contradictory Input Detection
 *    - Off-topic Non-Medical Queries
 *    - Unclear / Ambiguous Messages
 * 
 * 2. Natural Context-Aware Response Generation:
 *    - Adapts response tone and structure dynamically.
 *    - Eliminates forced rigid templates ("What to Eat") for injuries, emergencies, and definitions.
 *    - Provides precise medical first aid, preservation protocols, and clinical thresholds.
 */

import { lookupSymptom } from './symptomDatabase';
import { searchMedicines, getMedicineById } from './medicineSearchEngine';

// ─────────────────────────────────────────────────────────────────────────────
// REGEX & SEMANTIC PATTERNS
// ─────────────────────────────────────────────────────────────────────────────

// Crisis & Self-Harm Patterns
const CRISIS_PATTERNS = [
  /\b(suicid|kill\s*myself|end\s*my\s*life|want\s*to\s*die|self[- ]harm|overdos(e|ing)|cut\s*my\s*(wrists?|arms?|throat)|cutting\s*my\s*(wrists?|body|throat)|hurt\s*myself|hanging\s*myself)\b/i
];

// Amputation, Severed Limb, or Cutting Body Part with Preservation/Refrigeration
const AMPUTATION_TRAUMA_PATTERNS = [
  /\b(cutting|cut|severed?|amputat(ed|ing)?|chop(ped|ping)?|sliced?|detach(ed|ing)?)\s+(my\s+|a\s+|the\s+)?(hand|finger|thumb|arm|leg|foot|toe|ear|limb|flesh)\b.*\b(refrigerator|fridge|freezer|ice|cold\s*storage|storing|preserve|preserving|bag)\b/i,
  /\b(storing|store|put|keep|keeping|preserved?)\s+(my\s+|a\s+|the\s+)?(severed|cut|amputated|detached)\s+(hand|finger|thumb|arm|leg|foot|toe|ear|limb)\b/i,
  /\b(amputat(ed|ion)|severed\s+(hand|finger|thumb|arm|leg|foot|toe|limb)|cut\s*off\s+(my|a|the)\s+(hand|finger|thumb|arm|leg|foot|toe|ear|limb))\b/i,
  /\bcutting\s+(my\s+|a\s+)?(hand|finger|thumb|arm|leg|foot|toe)\s+and\s+(storing|putting|keeping)\b/i
];

// General Cuts, Bleeding & Wounds
const CUTS_AND_WOUNDS_PATTERNS = [
  /\b(cut|lacerat(ion|ed)|sliced?|gash|puncture\s*wound|stab\s*wound)\b/i,
  /\bbleed(ing)?\s+from\s+(my\s+|a\s+)?(cut|hand|finger|arm|leg|wound|head|face)\b/i,
  /\b(cut\s+(my|a)\s+(hand|finger|thumb|skin|arm|leg|foot|face)|deep\s*cut)\b/i
];

// First-Aid & Specific Injuries (Burns, Nosebleeds, Choking, Fractures, Sprains, Bites)
const FIRST_AID_PATTERNS = [
  /\b(first\s*aid|how\s*to\s*treat|how\s*to\s*stop|how\s*to\s*clean|how\s*to\s*bandage)\b/i,
  /\b(burn(ed|t|ing)?\s*(my|a)?\s*(finger|hand|skin)|hot\s*oil|hot\s*water|boiling\s*water|steam\s*burn)\b/i,
  /\b(nosebleed|bleeding\s*from\s*(the\s*)?nose|epistaxis)\b/i,
  /\b(choking|foreign\s*object\s*in\s*throat|heimlich)\b/i,
  /\b(fracture|broken\s*(bone|arm|leg|wrist|finger)|dislocat(ed|ion))\b/i,
  /\b(sprain(ed)?|twisted\s*(my\s*)?ankle|swollen\s*ankle)\b/i,
  /\b(dog\s*bite|animal\s*bite|snake\s*bite|monkey\s*bite|bee\s*sting|wasp\s*sting)\b/i
];

// General Health Questions & Concept Definitions ("What is X?", "What causes X?", "How does X work?")
const GENERAL_HEALTH_QUESTION_PATTERNS = [
  /^(what\s*is|what\s*are|what\s*causes|how\s*does|why\s*do\s*we|why\s*does|tell\s*me\s*about|explain|define)\s+(a\s+|an\s+|the\s+)?([a-z0-9\s-]+)\??$/i,
  /\b(what\s*is\s*a\s*fever|what\s*is\s*fever|normal\s*body\s*temperature|what\s*is\s*hypertension|normal\s*blood\s*pressure|what\s*is\s*diabetes|how\s*does\s*the\s*heart\s*work|what\s*is\s*cholesterol|what\s*is\s*jaundice)\b/i,
  /\bwhat\s*happens\s*if\s*someone\s*(cuts|breaks|burns|sprains|injures|faints|swallows)\b/i
];

// Greetings & Pleasantries
const GREETINGS_PATTERNS = [
  /^(hi|hello|hey|namaste|namaskar|good\s*morning|good\s*afternoon|good\s*evening|greetings|howdy|hola)\b/i,
  /^(who\s*are\s*you|what\s*is\s*your\s*name|what\s*can\s*you\s*do|tell\s*me\s*about\s*yourself)\b/i,
  /^(thank\s*you|thanks|dhanyawad|shukriya|bye|goodbye|see\s*you)\b/i
];

// Prescription Requests
const PRESCRIPTION_REQUEST_PATTERNS = [
  /\b(prescribe\s*(me)?|write\s*(me)?\s*(a)?\s*prescription|give\s*me\s*(a)?\s*prescription|need\s*(a)?\s*prescription\s*for)\b/i
];

// Off-topic Non-Medical
const OFF_TOPIC_PATTERNS = [
  /\b(repair\s*car|fix\s*car|weather\s*forecast|write\s*code|python\s*code|javascript|capital\s*of|president\s*of|prime\s*minister|stock\s*market|bitcoin|cryptocurrency|recipe\s*for\s*cake|movie\s*review|who\s*won\s*the\s*match|football\s*score|cricket\s*score)\b/i
];

// ─────────────────────────────────────────────────────────────────────────────
// 1. INTENT & MESSAGE UNDERSTANDING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classifies user message intent using syntactic and semantic cues.
 */
export function classifyUserIntent(text) {
  if (!text || typeof text !== 'string') {
    return { intent: 'AMBIGUOUS_UNCLEAR', confidence: 1.0 };
  }

  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Amputation / Severed Body Part / Severe Trauma with Storage
  for (const p of AMPUTATION_TRAUMA_PATTERNS) {
    if (p.test(lower)) {
      return {
        intent: 'AMPUTATION_SEVERE_TRAUMA',
        isSevereTrauma: true,
        isEmergency: true,
        isHarmfulAct: /\b(cutting\s+my|cut\s+my|storing\s+my)\b/i.test(lower),
        bodyPart: extractBodyPart(lower)
      };
    }
  }

  // 2. Crisis & Self-Harm
  for (const p of CRISIS_PATTERNS) {
    if (p.test(lower)) {
      return { intent: 'CRISIS_SELF_HARM', isEmergency: true };
    }
  }

  // 3. Physical Medical Emergency (Chest pain, breathing distress, stroke, anaphylaxis)
  if (isPhysicalEmergency(lower)) {
    return { intent: 'EMERGENCY_SITUATION', isEmergency: true };
  }

  // 4. Prescription generation requests
  for (const p of PRESCRIPTION_REQUEST_PATTERNS) {
    if (p.test(lower)) {
      return { intent: 'PRESCRIPTION_REQUEST', isEmergency: false };
    }
  }

  // 5. Hypothetical Injury / "What happens if someone cuts their hand?"
  if (/\bwhat\s*happens\s*if\s*(someone|you|a\s*person)\s*(cuts?|injures?|lacerates?)\s*(their|a|the)?\s*(hand|finger|arm|leg|skin)\b/i.test(lower)) {
    return {
      intent: 'INJURY_EDUCATIONAL',
      bodyPart: extractBodyPart(lower) || 'hand',
      isHypothetical: true
    };
  }

  // 6. Active Injury & First Aid (Cuts, Burns, Nosebleeds, Bites)
  for (const p of FIRST_AID_PATTERNS) {
    if (p.test(lower)) {
      return {
        intent: 'INJURY_FIRST_AID',
        subType: detectFirstAidType(lower),
        isHypothetical: isHypotheticalQuery(lower)
      };
    }
  }

  for (const p of CUTS_AND_WOUNDS_PATTERNS) {
    if (p.test(lower)) {
      return {
        intent: 'INJURY_FIRST_AID',
        subType: 'cut',
        bodyPart: extractBodyPart(lower) || 'skin',
        isHypothetical: isHypotheticalQuery(lower)
      };
    }
  }

  // 7. Medicine inquiries ("What is paracetamol?", "Tell me about Dolo 650")
  const medIntent = detectMedicineInquiry(clean);
  if (medIntent) {
    return medIntent;
  }

  // 8. General Health Concepts & Educational Definitions ("What is a fever?", "What is hypertension?")
  if (isGeneralConceptQuestion(clean)) {
    const concept = extractConceptSubject(clean);
    return {
      intent: 'GENERAL_HEALTH_QUESTION',
      concept: concept
    };
  }

  // 9. Greetings & Chit-chat
  for (const p of GREETINGS_PATTERNS) {
    if (p.test(lower) && clean.split(/\s+/).length <= 5) {
      return { intent: 'GREETING_OR_CHITCHAT' };
    }
  }

  // 10. Random characters / Gibberish
  if (isRandomOrGibberish(clean)) {
    return { intent: 'AMBIGUOUS_UNCLEAR' };
  }

  // 11. Off-topic Non-Medical
  for (const p of OFF_TOPIC_PATTERNS) {
    if (p.test(lower)) {
      return { intent: 'NON_MEDICAL_QUESTION' };
    }
  }

  // 12. Contradictory statements
  if (hasContradictorySymptoms(clean)) {
    return { intent: 'CONTRADICTORY_INPUT' };
  }

  // 13. Active Symptom Description (e.g. "I have a headache", "My back hurts", "cough and cold")
  return {
    intent: 'SYMPTOM_REPORT',
    query: clean
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER PARSERS
// ─────────────────────────────────────────────────────────────────────────────

function extractBodyPart(text) {
  const match = text.match(/\b(hand|finger|thumb|wrist|arm|forearm|leg|foot|ankle|toe|knee|elbow|face|eye|ear|head|chest|stomach|neck)\b/i);
  return match ? match[1].toLowerCase() : null;
}

function detectFirstAidType(text) {
  if (/burn/i.test(text)) return 'burn';
  if (/nosebleed|bleeding.*nose/i.test(text)) return 'nosebleed';
  if (/chok/i.test(text)) return 'choking';
  if (/fracture|broken\s*bone/i.test(text)) return 'fracture';
  if (/sprain|twisted/i.test(text)) return 'sprain';
  if (/bite/i.test(text)) return 'bite';
  if (/sting/i.test(text)) return 'sting';
  return 'general';
}

function isHypotheticalQuery(text) {
  return /\b(what\s*happens|what\s*if|hypothetically|if\s*someone|if\s*a\s*person|can\s*someone|how\s*does\s*one)\b/i.test(text);
}

function isGeneralConceptQuestion(text) {
  for (const p of GENERAL_HEALTH_QUESTION_PATTERNS) {
    if (p.test(text)) return true;
  }
  return false;
}

function extractConceptSubject(text) {
  const lower = text.toLowerCase();
  const feverMatch = lower.match(/\b(fever|pyrexia|high\s*temperature)\b/);
  if (feverMatch) return 'fever';

  const bpMatch = lower.match(/\b(hypertension|high\s*blood\s*pressure|normal\s*blood\s*pressure|bp)\b/);
  if (bpMatch) return 'blood_pressure';

  const diabetesMatch = lower.match(/\b(diabetes|sugar|hyperglycemia|insulin)\b/);
  if (diabetesMatch) return 'diabetes';

  const heartMatch = lower.match(/\b(heart|cardiac|cholesterol)\b/);
  if (heartMatch) return 'heart';

  const clean = text.replace(/^(what\s*is|what\s*are|what\s*causes|how\s*does|tell\s*me\s*about|explain|define)\s+(a\s+|an\s+|the\s+)?/i, '')
                    .replace(/\?+$/, '')
                    .trim();
  return clean || 'general';
}

function detectMedicineInquiry(text) {
  const lower = text.toLowerCase();
  const match = lower.match(/\b(what\s*is|tell\s*me\s*about|side\s*effects\s*of|how\s*to\s*take|dosage\s*of|information\s*on)\s+([a-zA-Z0-9\s-]+)\??$/i);
  if (match && match[2]) {
    const candidateName = match[2].trim().replace(/^(a|an|the)\s+/i, '').trim();
    if (!candidateName) return null;

    // Filter out common health terms, anatomical parts, or symptoms that shouldn't be matched as drug queries
    const nonMedicineTerms = [
      'fever', 'headache', 'cough', 'cold', 'pain', 'body ache', 'vomiting',
      'nausea', 'diarrhea', 'hypertension', 'blood pressure', 'bp', 'diabetes',
      'sugar', 'asthma', 'allergy', 'hand', 'skin', 'wound', 'cut', 'burn'
    ];
    if (nonMedicineTerms.includes(candidateName.toLowerCase())) {
      return null;
    }

    const localMatch = getMedicineById(candidateName);
    if (localMatch) {
      return {
        intent: 'MEDICINE_INQUIRY',
        medicine: localMatch,
        medicineName: localMatch.brandName || localMatch.name
      };
    }

    const searchRes = searchMedicines(candidateName, { limit: 3 });
    if (searchRes.results && searchRes.results.length > 0) {
      const candLower = candidateName.toLowerCase();
      const top = searchRes.results.find(m => {
        const brand = (m.brandName || m.name || '').toLowerCase();
        const generic = (m.genericName || '').toLowerCase();
        return brand.includes(candLower) || generic.includes(candLower) || candLower.includes(brand) || candLower.includes(generic);
      });

      if (top) {
        return {
          intent: 'MEDICINE_INQUIRY',
          medicine: top,
          medicineName: top.brandName || top.name
        };
      }
    }
  }
  return null;
}

export function isRandomOrGibberish(text) {
  if (!text) return true;
  const clean = text.trim();
  if (clean.length < 2) return false;

  const symbolCount = (clean.match(/[^a-zA-Z0-9\s]/g) || []).length;
  if (symbolCount / clean.length > 0.45 && clean.length > 4) {
    return true;
  }

  if (/^\d+$/.test(clean) && clean.length > 5) {
    return true;
  }

  const words = clean.toLowerCase().split(/\s+/);
  for (const w of words) {
    if (w.length >= 6) {
      if (!/[aeiouy]/.test(w)) return true;
      if (/(.)\1{3,}/.test(w)) return true;
      if (/asdf|dfgh|ghjk|hjkl|qwer|wert|erty|rtyu|tyui|yuio|uiop|zxcv|xcvb|cvbn|vbnm/.test(w)) {
        return true;
      }
    }
  }

  return false;
}

export function hasContradictorySymptoms(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  const contradictions = [
    { negated: /\bno\s+pain\b/i, affirmed: /\b(severe|terrible|excruciating|sharp)\s+pain\b/i },
    { negated: /\bno\s+fever\b/i, affirmed: /\b(high|burning|severe)\s+fever\b/i },
    { negated: /\bnot\s+bleeding\b/i, affirmed: /\b(severe|heavy|active)\s+bleed(ing)?\b/i },
    { negated: /\bno\s+cough\b/i, affirmed: /\b(persistent|severe|chronic)\s+cough\b/i },
  ];
  return contradictions.some(c => c.negated.test(lower) && c.affirmed.test(lower));
}

export function isPhysicalEmergency(text) {
  if (!text) return false;
  const lower = text.toLowerCase();

  const hasNegatedChest = /\b(no|not|without|denies?|never)\s+(chest\s*(pain|pressure|tightness)|difficulty\s*breathing)\b/i.test(lower);

  const emergencyPatterns = [
    /\bchest\s*(pain|pressure|tightness|heaviness|crushing)\b/i,
    /\b(difficulty|trouble|can't|cannot|unable\s*to)\s*breath(e|ing)?\b/i,
    /\bshortness\s*of\s*breath\b/i,
    /\bunconscious|fainted|passing\s*out|passed\s*out|blackout|unresponsive\b/i,
    /\b(severe|uncontrolled)\s*bleed(ing)?|coughing\s*(up\s*)?blood\b/i,
    /\bstroke|facial\s*droop|slurred\s*speech|one[- ]side(d)?\s*weakness|arm\s*numbness\b/i,
    /\banaphylax(is)?|throat\s*(is\s*)?clos(ing|es|ed)|swelling\s*of\s*(the\s*)?(tongue|throat)\b/i,
    /\bheart\s*attack|cardiac\s*arrest\b/i,
    /\bseizure|convulsion\b/i,
  ];

  if (hasNegatedChest) {
    return emergencyPatterns.slice(3).some(p => p.test(lower));
  }

  return emergencyPatterns.some(p => p.test(lower));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. RELEVANT CONTEXTUAL RESPONSE GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main AI generation entry: Understands natural language, determines intent,
 * and generates a relevant, medically sound answer without generic symptom templates.
 */
export function generateClinicalAIResponse(userQuery, { language = 'en', isEmergency = false } = {}) {
  const cleanInput = (userQuery || '').trim();
  const analysis = classifyUserIntent(cleanInput);

  // 1. AMPUTATION / SEVERED BODY PART / SEVERE TRAUMA & PRESERVATION PROTOCOL
  if (analysis.intent === 'AMPUTATION_SEVERE_TRAUMA') {
    const part = analysis.bodyPart || 'hand';
    
    if (language === 'hi') {
      return {
        text: `🚨 आपातकालीन चिकित्सा चेतावनी: कटे हुए अंग एवं गंभीर चोट (Critical Trauma Emergency)

आपने ${part} कटने एवं उसे सुरक्षित रखने का उल्लेख किया है। शरीर के किसी अंग का कटना अथवा गंभीर आघात एक अत्यंत गंभीर चिकित्सीय आपातकाल है। कृपया तुरंत 112 / 108 पर कॉल करें अथवा निकटतम अस्पताल के ट्रॉमा सेंटर जाएं।

🛑 घायल व्यक्ति के लिए प्राथमिक उपचार:
1. रक्तस्राव रोकें: घाव पर साफ गॉज (पट्टी) या साफ कपड़े से लगातार दृढ़ दबाव (Firm Direct Pressure) बनाएं।
2. अंग को ऊपर उठाएं: यदि संभव हो तो घायल हिस्से को हृदय के स्तर से ऊपर रखें ताकि रक्तस्राव कम हो सके।
3. व्यक्ति को शांत रखें, सीधा लिटाएं और ठंड से बचाने के लिए चादर ओढ़ाएं (शॉक की रोकथाम)।

🧊 कटे हुए अंग को सुरक्षित रखने का सही चिकित्सकीय तरीका:
1. कटे हुए अंग को किसी साफ, हल्के नम (सलाइन या साफ पानी से नम) सूती कपड़े या गॉज में लपेटें।
2. लपेटे हुए हिस्से को एक साफ, वॉटरप्रूफ प्लास्टिक बैग (Ziploc बैग) में रखकर सील कर दें।
3. इस सीलबंद बैग को ठंडे पानी और बर्फ के मिश्रण (Ice Slurry) वाले कंटेनर में रखें।
⚠️ महत्वपूर्ण सावधानियां:
- अंग को कभी भी सीधे बर्फ या सूखी बर्फ (Dry Ice) पर न रखें (इससे ऊतक हमेशा के लिए मृत हो जाते हैं और दोबारा जुड़ना असंभव हो जाता है)।
- अंग को सीधे पानी में न डुबोएं।
- अंग पर साबुन या केमिकल न लगाएं।
तुरंत अस्पताल पहुंचें ताकि समय रहते अंग को पुनः प्रत्यारोपित (Replantation) किया जा सके।

🤝 मानसिक स्वास्थ्य सहायता:
यदि आप गंभीर मानसिक तनाव अथवा आत्म-हानि के विचारों से जूझ रहे हैं:
- Tele-MANAS राष्ट्रीय मानसिक स्वास्थ्य हेल्पलाइन: 14416 (24/7 निःशुल्क)
- राष्ट्रीय आपातकालीन सेवा: 112`,
        isEmergency: true,
        type: 'amputation_trauma'
      };
    }

    return {
      text: `🚨 CRITICAL TRAUMA EMERGENCY: Severed Body Part / Severe Injury

You mentioned cutting your ${part} and storing it. A severed hand or amputated body part is a time-critical surgical emergency. Please call emergency services immediately (112 or 108 in India, or your local emergency number) or have someone transport you to the nearest trauma hospital right now.

🛑 IMMEDIATE FIRST AID FOR THE INJURED PERSON:
1. Control the Bleeding: Apply firm, continuous direct pressure to the wound using clean sterile gauze, a clean cloth, or a clean towel. Do not release pressure to check the wound.
2. Elevate the Limb: If possible, keep the injured arm elevated above the level of the heart to slow arterial blood flow.
3. Prevent Shock: Keep the person lying flat, calm, and covered with a blanket to keep warm. Do not give anything to eat or drink.

🧊 PROPER MEDICAL PRESERVATION OF THE SEVERED BODY PART:
Standard refrigeration or freezing can permanently destroy delicate capillary and nerve structures. Follow this hospital-approved protocol immediately:
1. Wrap the severed part in clean, sterile, slightly damp gauze or a clean damp cloth (moistened with clean saline or drinking water).
2. Place the wrapped part inside a clean, watertight sealed plastic bag.
3. Place that sealed bag into an insulated container or second bag filled with cold water and ice (an ice-water slurry).
⚠️ CRITICAL PRECAUTIONS:
- Do NOT place the severed part directly in water or allow it to get soaked.
- Do NOT place the severed part directly on ice or dry ice (direct freezing causes severe frostbite and tissue necrosis, making surgical re-attachment/replantation impossible).
- Do NOT scrub the severed tissue or apply soaps/antiseptics.
- Bring the properly cooled, sealed bag with you to the emergency hospital immediately.

🤝 MENTAL HEALTH & CRISIS SUPPORT:
If this situation involves self-inflicted injury, distress, or thoughts of self-harm, please know that compassionate, confidential support is available right now:
- Tele-MANAS (Govt. of India 24/7 National Mental Health Helpline): Call 14416 or 1800-891-4416 (toll-free)
- National Emergency Services: Call 112`,
      isEmergency: true,
      type: 'amputation_trauma'
    };
  }

  // 2. CRISIS & SELF-HARM
  if (analysis.intent === 'CRISIS_SELF_HARM') {
    if (language === 'hi') {
      return {
        text: `🚨 तत्काल सहायता उपलब्ध है (Mental Health Crisis Support):
यदि आप या आपका कोई प्रियजन अत्यधिक तनाव, संकट या आत्म-हानि के विचारों से जूझ रहे हैं, तो कृपया तुरंत इन निःशुल्क और गोपनीय हेल्पलाइन पर संपर्क करें:

📞 Tele-MANAS (भारत सरकार राष्ट्रीय मानसिक स्वास्थ्य हेल्पलाइन): 14416 या 1800-891-4416 (24/7 निःशुल्क)
🚨 राष्ट्रीय आपातकालीन नंबर: 112
🤝 वंद्रेवाला फाउंडेशन: +91 9999 666 555

आप अकेले नहीं हैं। पेशेवर काउंसलर आपकी सहायता के लिए सदैव उपलब्ध हैं।`,
        isEmergency: true,
        type: 'crisis'
      };
    }

    return {
      text: `🚨 IMMEDIATE CRISIS SUPPORT AVAILABLE:
If you or someone you know is going through emotional distress, crisis, or having thoughts of self-harm, please reach out right now. Free, compassionate, and confidential support is available 24/7:

📞 Tele-MANAS (Govt. of India National Mental Health Helpline): Call 14416 or 1800-891-4416 (Toll-free, 24/7)
🚨 National Emergency Services: Call 112
🤝 Vandrevala Foundation Helpline: +91 9999 666 555

Please talk to someone who can help. You are not alone, and supportive assistance is immediately available.`,
      isEmergency: true,
      type: 'crisis'
    };
  }

  // 3. PHYSICAL MEDICAL EMERGENCY
  if (analysis.intent === 'EMERGENCY_SITUATION' || isEmergency) {
    return {
      text: `🚨 POSSIBLE MEDICAL EMERGENCY

Your inquiry describes symptoms that may require immediate emergency medical evaluation.

🔍 Clinical Overview:
Symptoms such as severe chest pain, extreme breathlessness, sudden weakness, or unconsciousness may be associated with acute cardiovascular, neurological, or pulmonary conditions.

📋 Immediate Action Steps:
1. Stop all physical exertion and sit or lie down in a safe, comfortable position.
2. Loosen tight clothing around the neck and chest to aid breathing.
3. Call India's emergency number (112), or have someone call an ambulance (108 where available).
4. Do not attempt to drive yourself to the emergency department.

🚨 Seek Help If:
Seek emergency medical evaluation immediately. Do not delay under any circumstances.`,
      isEmergency: true,
      type: 'emergency'
    };
  }

  // 4. HYPOTHETICAL / EDUCATIONAL INJURY ("What happens if someone cuts their hand?")
  if (analysis.intent === 'INJURY_EDUCATIONAL') {
    const part = analysis.bodyPart || 'hand';
    return {
      text: `🩹 Medical Overview: ${part.charAt(0).toUpperCase() + part.slice(1)} Injury & Laceration

When a person experiences a cut or laceration to the ${part}, the clinical consequences depend on the depth and location of the wound:

🔍 Anatomical Considerations:
- Superficial cuts affect only the outer skin layers (epidermis and dermis) and generally heal well with basic wound care.
- Deep cuts can damage critical structures located close to the surface of the ${part}, including sensory nerves, tendons (which control finger movement), and major blood vessels (radial and ulnar arteries).

📋 Standard First-Aid Protocol:
1. Direct Pressure & Bleeding Control: Apply firm, continuous direct pressure with a clean cloth or sterile gauze for at least 5 to 10 minutes.
2. Clean the Wound: Once bleeding stops, gently rinse the cut under clean, cool running water to flush out debris. Avoid harsh chemicals like hydrogen peroxide or undiluted alcohol, which damage healing tissue.
3. Dress and Protect: Apply a thin layer of antibacterial ointment or petroleum jelly, and cover with a sterile bandage or gauze dressing.
4. Keep Elevated: Keeping the hand elevated above heart level helps reduce swelling and throbbing pain.

🚨 Red Flags Requiring Immediate Medical Attention:
- Blood spurts from the wound or bleeding does not stop after 10 minutes of direct pressure.
- Numbness, tingling, or loss of sensation in any of the fingers.
- Inability to bend or straighten a finger (suggests tendon laceration).
- The wound is deep, gaping, exposes yellowish fat or muscle/bone, or requires stitches (ideally placed within 6 to 8 hours).
- The injury was caused by a dirty, rusty, or contaminated object, which requires an updated Tetanus toxoid booster if none was received in the past 5-10 years.`,
      isEmergency: false,
      type: 'injury_educational'
    };
  }

  // 5. ACTIVE INJURY & FIRST AID
  if (analysis.intent === 'INJURY_FIRST_AID') {
    const subType = analysis.subType;

    if (subType === 'burn') {
      return {
        text: `🔥 First-Aid Guidance: Burn Care

Immediate, correct action prevents deeper tissue damage and promotes proper healing:

📋 Immediate Steps:
1. Cool Immediately: Hold the burned area under cool (not ice cold) running water for 10 to 20 minutes.
2. Remove Tight Items: Gently remove rings, bracelets, or tight clothing around the burn before swelling begins.
3. Protect the Skin: Cover loosely with a sterile, non-adherent dressing or clean plastic wrap.
⚠️ What to Avoid:
- Do NOT apply ice or ice water (causes tissue ischemia and further cell damage).
- Do NOT apply butter, oil, toothpaste, or home remedies (traps heat and increases infection risk).
- Do NOT pop or puncture blisters.

🚨 Seek Medical Help If:
- The burn covers a large area (larger than the person's palm), or involves the face, hands, joints, or groin.
- The burn is charred white, brown, or leathery (third-degree burn).
- The burn is caused by chemicals or high-voltage electricity.`,
        isEmergency: false,
        type: 'first_aid'
      };
    }

    if (subType === 'nosebleed') {
      return {
        text: `🩸 First-Aid Guidance: Nosebleed (Epistaxis)

Most nosebleeds originate from small vessels in the front of the nasal septum and can be stopped with proper technique:

📋 Proper Steps:
1. Sit Up and Lean Slightly Forward: Do NOT tilt the head backward (tilting back causes blood to drain down the throat, leading to choking or vomiting).
2. Pinch the Soft Part: Using your thumb and index finger, firmly pinch the soft fleshy part of the nose just below the nasal bone.
3. Hold Continuous Pressure: Maintain firm pressure for a full 10 to 15 minutes without releasing to check.
4. Breathe Through Mouth: Stay calm and breathe through your mouth.
5. Cold Compress: An ice pack wrapped in a cloth placed over the bridge of the nose can help constrict blood vessels.

🚨 Seek Medical Help If:
- Bleeding continues after 20 minutes of continuous firm pressure.
- The bleeding is very heavy or accompanied by dizziness, faintness, or difficulty breathing.
- The nosebleed occurred following a direct blow or severe head injury.`,
        isEmergency: false,
        type: 'first_aid'
      };
    }

    // General Cut / Wound
    const part = analysis.bodyPart || 'skin';
    return {
      text: `🩹 First-Aid Guidance: Cut / Wound on ${part.charAt(0).toUpperCase() + part.slice(1)}

Immediate first-aid steps to control bleeding and prevent infection:

📋 Immediate Action Steps:
1. Stop the Bleeding: Apply continuous, firm direct pressure over the cut with clean sterile gauze, cloth, or paper towel for 5 to 10 minutes.
2. Elevate: Keep the ${part} elevated above heart level if practical to reduce throbbing and blood loss.
3. Clean Gently: After bleeding stops, rinse the wound under clean running tap water. Wash surrounding skin with mild soap, but avoid getting harsh soap directly inside deep tissue.
4. Cover: Apply a thin layer of antibacterial ointment or clean petroleum jelly, and protect with a sterile bandage.

🚨 When to Seek Medical Evaluation:
- Bleeding does not stop after 10 minutes of direct, uninterrupted pressure.
- You cannot bend your fingers or feel numbness in the skin (possible nerve/tendon injury).
- The cut is deep, gaping, or exposes underlying tissue (may require stitches).
- Wounds from rusty metal, animal bites, or soil contamination (requires evaluation for Tetanus booster or antibiotics).`,
      isEmergency: false,
      type: 'first_aid'
    };
  }

  // 6. GENERAL HEALTH CONCEPT QUESTION ("What is a fever?", "What is hypertension?")
  if (analysis.intent === 'GENERAL_HEALTH_QUESTION') {
    const concept = analysis.concept;

    if (concept === 'fever') {
      return {
        text: `🌡️ Medical Explanation: What is a Fever?

A fever (clinically known as pyrexia) is a temporary elevation of body temperature above its normal baseline. It is an intentional immune defense mechanism, not a disease itself.

🔍 Clinical Temperature Thresholds:
- Normal Baseline: Approximately 98.6°F (37°C), with natural daily variations between 97°F and 99°F.
- Low-Grade Fever: 100.4°F to 102.2°F (38°C to 39°C).
- High-Grade Fever: 103°F (39.4°C) or higher in adults.

🔬 Why Does the Body Develop a Fever?
When the immune system detects infectious agents (like viruses or bacteria), white blood cells release chemical signals called pyrogens. These signals prompt the hypothalamus—the temperature-regulating center in the brain—to elevate the body's internal thermostat. The higher temperature helps the immune system fight the pathogen by making the environment less hospitable for viral and bacterial replication.

📋 Common Causes:
- Viral infections (influenza, common cold, viral upper respiratory infections, dengue).
- Bacterial infections (strep throat, urinary tract infections, pneumonia).
- Post-vaccination immune response.
- Heat exhaustion or extreme inflammatory conditions.

💡 General Supportive Measures:
- Stay well-hydrated with water, electrolyte solutions, and warm broths to replace fluids lost through sweating.
- Rest and avoid heavy physical exertion.
- Wear light, breathable clothing and keep room temperature comfortable.

🚨 When to Seek Medical Attention:
- Fever exceeds 103°F (39.4°C) in adults or fails to respond to antipyretics.
- Fever persists for more than 3 consecutive days.
- Accompanied by red flags: severe headache, stiff neck, shortness of breath, confusion, or a persistent unexplained rash.
- Any fever in infants under 3 months of age requires immediate emergency evaluation.`,
        isEmergency: false,
        type: 'general_health_question'
      };
    }

    if (concept === 'blood_pressure') {
      return {
        text: `💓 Medical Explanation: Blood Pressure & Hypertension

Blood pressure is the measurement of the force exerted by circulating blood against the walls of the arteries.

🔍 Standard Clinical Categories:
- Normal: Systolic less than 120 mmHg AND Diastolic less than 80 mmHg (< 120/80 mmHg).
- Elevated: Systolic 120–129 mmHg AND Diastolic less than 80 mmHg.
- Hypertension Stage 1: Systolic 130–139 mmHg OR Diastolic 80–89 mmHg.
- Hypertension Stage 2: Systolic 140 mmHg or higher OR Diastolic 90 mmHg or higher.
- Hypertensive Crisis: Systolic over 180 mmHg and/or Diastolic over 120 mmHg (requires immediate emergency medical care).

💡 Important Health Facts:
- High blood pressure is often termed the "silent killer" because it typically produces no noticeable symptoms until organ damage occurs.
- Long-term uncontrolled hypertension significantly increases the risk of heart attack, stroke, heart failure, and chronic kidney disease.
- Management involves regular monitoring, sodium reduction, physical activity, stress management, and prescribed antihypertensive medications when indicated.`,
        isEmergency: false,
        type: 'general_health_question'
      };
    }

    // Generic health question fallback
    return {
      text: `📚 Clinical Health Explanation: ${concept.charAt(0).toUpperCase() + concept.slice(1)}

Medical concepts and physiological mechanisms:

🔍 Definition & Function:
${concept} represents a key physiological or clinical health topic. In medical science, understanding the underlying cause, biological mechanism, and normal clinical ranges allows healthcare providers to diagnose and manage health conditions effectively.

📋 Key Considerations:
1. Understanding baseline ranges and biological functions.
2. Identifying typical triggers or risk factors.
3. Consulting licensed healthcare providers for clinical diagnosis, routine screenings, or personalized treatment plans.

If you are experiencing specific symptoms related to this topic or have a personal health reading, feel free to describe them so I can provide relevant guidance!`,
      isEmergency: false,
      type: 'general_health_question'
    };
  }

  // 7. MEDICINE INQUIRY
  if (analysis.intent === 'MEDICINE_INQUIRY') {
    const med = analysis.medicine;
    return {
      text: `💊 Medication Monograph: ${med.brandName || med.name}

Generic Salt: ${med.genericName || med.generic || 'Standard formulation'}
Category: ${med.category || 'Pharmaceutical Product'}

📋 Clinical Overview & Indications:
${med.indication || 'Used under clinical guidance for approved indications.'}

💡 Usage & Administration Guidelines:
${med.instructions || med.standardDosage || 'Take strictly as prescribed by your doctor or as instructed on the package label.'}

⚠️ Important Precautions & Safety:
- Precautions: ${med.precautions || 'Consult your physician before combining with other medications.'}
- Side Effects: ${Array.isArray(med.sideEffects) ? med.sideEffects.join(', ') : 'Mild gastrointestinal upset or drowsiness in sensitive individuals.'}
- Alcohol Interaction: Avoid alcohol consumption while on medication unless specifically cleared by your doctor.`,
      isEmergency: false,
      type: 'medicine_inquiry'
    };
  }

  // 8. PRESCRIPTION REQUEST (Refusal & Guidance)
  if (analysis.intent === 'PRESCRIPTION_REQUEST') {
    return {
      text: `🛡️ Clinical Policy Notice: Prescription Request

I cannot issue prescriptions or specify individualized drug dosages. Medical ethics and regulatory standards strictly require a licensed physician or Registered Medical Practitioner (RMP) to perform an evaluation before prescribing medications.

📋 What you can do:
1. Consult a licensed doctor in person or via an authorized telemedicine service.
2. If you are experiencing symptoms, I can provide general educational guidance on possible causes, home comfort measures, and warning signs.
3. Use MedWeb's "Nearby Facilities" feature to find registered doctors, clinics, or hospitals near you.`,
      isEmergency: false,
      type: 'prescription_refusal'
    };
  }

  // 9. GREETINGS & CHIT-CHAT
  if (analysis.intent === 'GREETING_OR_CHITCHAT') {
    if (language === 'hi') {
      return {
        text: `🙏 नमस्ते! मैं आरोग्य एआई (Arogya AI) हूँ — मेदवेब पर आपका व्यक्तिगत स्वास्थ्य सहायक।

मैं आपकी किस प्रकार सहायता कर सकता हूँ?
- अपने लक्षणों के बारे में पूछ सकते हैं (जैसे 'मुझे सिरदर्द है')
- सामान्य स्वास्थ्य प्रश्न (जैसे 'बुखार क्या होता है?')
- प्राथमिक उपचार एवं घाव देखभाल
- दवाओं की सामान्य जानकारी एवं सावधानियां

कृपया अपना स्वास्थ्य संबंधी प्रश्न बताएं!`,
        isEmergency: false,
        type: 'greeting'
      };
    }

    return {
      text: `👋 Hello! I am Arogya AI, your personal clinical health assistant on MedWeb.

How can I help you today?
- Ask about symptoms you are experiencing (e.g. "I have a headache")
- General health questions (e.g. "What is a fever?", "What is normal blood pressure?")
- First-aid guidance and wound care steps
- Medicine information, schedules, and safety precautions

Please feel free to describe any symptoms, injuries, or health questions you have!`,
      isEmergency: false,
      type: 'greeting'
    };
  }

  // 10. RANDOM CHARACTERS & GIBBERISH
  if (analysis.intent === 'AMBIGUOUS_UNCLEAR') {
    return {
      text: `❓ Unclear Input

I wasn't able to understand your query. Please describe your symptoms, injury, or health question in clear words.

Examples of questions you can ask:
- "What should I do for a mild burn?"
- "What is a fever and when is it dangerous?"
- "I have had a throbbing headache for 2 days, what could it be?"`,
      isEmergency: false,
      type: 'gibberish'
    };
  }

  // 11. OFF-TOPIC NON-MEDICAL
  if (analysis.intent === 'NON_MEDICAL_QUESTION') {
    return {
      text: `🩺 MedWeb Scope Reminder

I am specialized exclusively as a clinical health and medical information assistant. I cannot provide assistance with non-medical topics such as vehicle repairs, computer programming, weather forecasts, or financial matters.

If you have any health questions, symptoms, or medical wellness inquiries, I am here to assist!`,
      isEmergency: false,
      type: 'off_topic'
    };
  }

  // 12. CONTRADICTORY INPUT
  if (analysis.intent === 'CONTRADICTORY_INPUT') {
    return {
      text: `⚠️ Clarification Needed

Your description contains contradictory statements (for example, mentioning both having and not having the same symptom).

To provide accurate and safe guidance:
1. Please clarify whether you are currently experiencing this symptom.
2. Note how severe it feels and how long it has been present.`,
      isEmergency: false,
      type: 'contradiction'
    };
  }

  // 13. ACTIVE SYMPTOM REPORT (Contextual Clinical Guidance)
  const match = lookupSymptom(cleanInput);

  // If input matches headache specifically:
  if (/headache|head\s*pain|migraine/i.test(cleanInput)) {
    return {
      text: `🤕 Clinical Guidance: Headache

I understand you are dealing with a headache. Headaches are very common and can stem from several distinct causes, ranging from tension to migraines.

🔍 Clarifying Questions to Consider:
- Location: Is the pain on one side of your head (common in migraines), across your forehead, or does it feel like a tight band around your entire head (typical of tension headaches)?
- Quality: Is it throbbing and pulsating, or a steady dull ache?
- Accompanying Symptoms: Are you experiencing sensitivity to bright light or sound, nausea, or nasal congestion?

📋 General Supportive Measures:
1. Rest in a Quiet, Dark Room: Minimizing visual and auditory stimulation helps reduce sensory overload.
2. Hydrate: Mild dehydration is a frequent trigger; drink a full glass of cool water.
3. Temperature Compress: Apply a cool, damp washcloth to the forehead or temples, or a warm compress to the back of the neck if muscle tension is present.
4. Screen Break: Give your eyes a rest from phones, computers, and television screens.

🚨 Red Flags Requiring Immediate Emergency Evaluation:
- Sudden, excruciating onset that peaks within seconds ("thunderclap" headache).
- Headache accompanied by a stiff neck, high fever, confusion, or altered mental state.
- Accompanying neurological signs: slurred speech, facial drooping, one-sided weakness, or vision loss.
- Headache following a recent blow to the head or fall.`,
      isEmergency: false,
      type: 'symptom_report'
    };
  }

  // If a specific recognized symptom matched in the clinical database:
  if (match && match.disease && match.disease !== 'General Symptom / Discomfort') {
    let emojiHeader = "💬";
    if (match.keys) {
      if (match.keys.includes("fever")) emojiHeader = "🌡️";
      else if (match.keys.includes("headache")) emojiHeader = "🤕";
      else if (match.keys.includes("stomach")) emojiHeader = "🤢";
      else if (match.keys.includes("acidity")) emojiHeader = "🔥";
      else if (match.keys.includes("burn")) emojiHeader = "🔥";
      else if (match.keys.includes("chest")) emojiHeader = "🚨";
      else if (match.keys.includes("allergy")) emojiHeader = "🍁";
    }

    const careStepsText = match.selfCare.map((step, i) => `${i + 1}. ${step}`).join('\n');
    const eatText = match.whatToEat.map(food => `- ${food}`).join('\n');
    const avoidText = match.whatToAvoid.map(food => `- ${food}`).join('\n');

    return {
      text: `${emojiHeader} Clinical Guidance: ${match.disease}

🔍 Overview:
${match.explanation}

📋 Supportive Care Steps:
${careStepsText}

🍏 Dietary Considerations:
${eatText}

🚫 What to Avoid:
${avoidText}

🚨 When to Seek Medical Attention:
${match.seekHelp}

Note: This guidance is for educational and supportive reference only. If symptoms persist or worsen, consult a qualified healthcare professional.`,
      isEmergency: false,
      type: 'symptom_report'
    };
  }

  // 14. GENERAL CONVERSATIONAL HEALTH QUERY (Not matched to a specific illness)
  return {
    text: `🩺 Health Assistant Guidance

Thank you for your inquiry. 

🔍 Understanding Your Query:
You mentioned: "${cleanInput}". 

📋 General Guidance & Recommendations:
1. Observe and Track: Keep note of when symptoms began, whether they are constant or intermittent, and what makes them better or worse.
2. Supportive Care: Maintain adequate hydration, prioritize restful sleep, and avoid heavy physical exertion while your body recovers.
3. Specific Details Help: To give you more targeted information, feel free to tell me more about:
   - Where the discomfort is located.
   - How long you have noticed it.
   - Any other symptoms you are experiencing alongside it.

🚨 Warning Signs Requiring Prompt Evaluation:
If you develop high fever, difficulty breathing, intense sharp pain, dizziness, or progressive worsening, please consult a qualified healthcare professional or visit a local clinic for an in-person assessment.`,
    isEmergency: false,
    type: 'general_guidance'
  };
}
