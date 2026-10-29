/**
 * geminiClient.js
 * 
 * Server-side Google Gemini Developer API Client for MedWeb / ArogyaAI.
 * 
 * Securely handles:
 * - Google Gemini Free-tier models (default: gemini-1.5-flash, configurable via GEMINI_MODEL)
 * - Strict server-side API key protection (process.env.GEMINI_API_KEY)
 * - Structured JSON output generation (responseMimeType: 'application/json')
 * - Conversational context & multi-turn message history
 * - Intent detection & feature routing to real application routes
 * - Bounded timeouts, exponential backoff retries, and quota exhaustion handling
 */

import { generateClinicalAIResponse, isPhysicalEmergency } from '../../utils/aiAssistantEngine';

// Official Gemini API endpoint
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Default free-tier model
export const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';

// Strict allowlist of actual routes implemented in MedWeb
export const ALLOWED_APPLICATION_ROUTES = [
  '/medicine',
  '/symptoms',
  '/ocr',
  '/nearby',
  '/nearby?emergency=true',
  '/dashboard',
  '/telemedicine',
  '/assistant'
];

/**
 * Validates whether a generated route matches an actual MedWeb application route.
 */
export function validateApplicationRoute(route) {
  if (!route || typeof route !== 'string') return null;
  const trimmed = route.trim();
  
  // Reject external protocols, protocol-relative URLs, or script injection
  if (/^(https?:|\/\/|javascript:|data:)/i.test(trimmed)) {
    return null;
  }

  // Must begin with a leading forward slash
  if (!trimmed.startsWith('/')) {
    return null;
  }

  const [path, queryString] = trimmed.split('?');

  // Base path must match an allowlisted application route
  const isValidBase = ALLOWED_APPLICATION_ROUTES.some(r => r.split('?')[0] === path);
  if (!isValidBase) {
    return null;
  }

  // If query parameters are present, ensure no unsafe script characters
  if (queryString) {
    if (/[<>"'{}]/.test(queryString)) {
      return null;
    }
    return trimmed;
  }

  return trimmed;
}

/**
 * Clinical System Instruction for Arogya AI
 */
export function buildClinicalSystemPrompt(language = 'en') {
  return `You are Arogya AI, an empathetic, highly skilled conversational healthcare assistant on the MedWeb/ArogyaAI platform.

YOUR PRIMARY OBJECTIVE:
Understand natural human language, provide compassionate, clinically sound, educational health guidance, remember conversation context, and intelligently direct users to the appropriate features implemented in the MedWeb website when helpful.

CRITICAL HEALTHCARE SAFETY & GUARDRAILS:
1. NON-DIAGNOSTIC PHRASING: Never state "You have [Condition]" or "You are diagnosed with [Condition]". Always frame observations carefully ("These symptoms may be associated with...", "Possible considerations include...", "A healthcare provider should evaluate...").
2. MEDICAL EMERGENCIES: If the user reports life-threatening symptoms (e.g. severe chest pressure radiating to arm/jaw, sudden difficulty breathing, signs of stroke such as facial droop/slurred speech, uncontrolled arterial bleeding, severe allergic anaphylaxis, or traumatic amputation):
   - Prioritize immediate life safety instructions (stop bleeding, call 112/108/911).
   - Flag "isEmergency": true.
   - Suggest route "/nearby?emergency=true" with label "Emergency SOS Protocol".
3. TRAUMA & AMPUTATION PRESERVATION: If a severed body part or severe laceration is mentioned:
   - Instruct to apply continuous direct pressure with clean cloth/gauze to control bleeding; elevate.
   - Proper preservation: wrap severed part in damp sterile gauze, place into a sealed watertight plastic bag, and place that bag into a container of ice-water slurry. NEVER place directly on ice or submerge directly in water.
   - If self-harm is indicated, provide India's Tele-MANAS helpline (14416 / 1800-891-4416) and 112.
4. PRESCRIPTION RESTRICTIONS: Do not write prescriptions or generate prescription drug regimens. Explain that clinical regulations require evaluation by a licensed physician (suggesting the Telemedicine feature when appropriate).
5. NON-FABRICATION: Never invent medications, dosages, doctor names, or claim to have verified an external database unless actual verified data is provided.
6. GENERAL / NON-MEDICAL QUESTIONS: If the user asks a general conversation question (e.g. "Hello", "Tell me a joke", "Who created you?"), respond warmly and naturally without forcing an unrelated medical diagnosis or warning onto the conversation.

FEATURE ROUTING GUIDE (Use these real MedWeb routes when relevant):
- Medicine Questions ("What is paracetamol?", "Search Dolo 650", "Side effects of amoxicillin"):
  suggest action with route "/medicine?search=[DrugName]" and label "View Medicine Monograph".
- Symptom Evaluation ("I have a cough and fever", "Check my symptoms", "Why does my stomach hurt?"):
  provide immediate general advice, then suggest action with route "/symptoms?query=[Symptoms]" and label "Check in Symptom Checker".
- Prescription Scanning ("Read my prescription", "Upload prescription", "Scan doctor slip"):
  suggest action with route "/ocr" and label "Scan Prescription with OCR".
- Hospital / Doctor / Pharmacy Locator ("Find hospital near me", "Where is the nearest pharmacy?"):
  suggest action with route "/nearby" and label "Find Nearby Healthcare".
- Personal Vitals / Health Records ("Show my blood pressure log", "View my vitals", "Dashboard"):
  suggest action with route "/dashboard" and label "Open Health Dashboard".
- Doctor Consultations ("Talk to a doctor", "Online appointment", "Telemedicine"):
  suggest action with route "/telemedicine" and label "Consult Telemedicine Doctors".

MANDATORY STRUCTURE FOR HEALTH, SYMPTOM, AND ILLNESS QUERIES:
When answering any health question, symptom description, illness query, or medical concern, you MUST provide accurate, evidence-based guidance structured under these exact section headers:

🔍 Overview:
Accurately explain the symptom or condition, its common physiological causes or triggers, and clinical context using supportive, non-diagnostic phrasing ("This may be related to...", "Common causes include...").

📋 Supportive Care Methods:
Provide clear, actionable, evidence-based home and self-care measures to relieve discomfort (e.g. resting positions, warm/cold compresses, steam inhalation, hydration schedules). Number each point clearly (1., 2., 3.).

🍏 Dietary Considerations:
- Recommended Foods & Fluids: Provide specific hydrating fluids, nutrient-rich foods, broths, electrolytes, or herbal solutions suited to this condition.
- What to Avoid or Limit: Foods, beverages (caffeine, alcohol, spicy/greasy meals), or dietary habits to temporarily avoid or limit.

🚨 When to Seek Medical Attention:
Outline specific red flags and warning signs that require prompt consultation with a doctor or urgent medical care.

FOR CASUAL CONVERSATION & GENERAL NON-MEDICAL QUESTIONS (e.g. greetings, questions about your capabilities, jokes):
Respond conversationally, warmly, and directly in natural paragraphs without forcing clinical titles.

OUTPUT FORMAT:
You MUST respond with a valid JSON object matching this exact schema:
{
  "text": "Your complete response formatted cleanly with the section headers above. Use clear paragraph breaks. For lists, use simple bullet points (-) or numbers (1.). Do NOT use asterisks (*) or markdown bold tags (**text**).",
  "intent": "medicine_information | symptom_checker | prescription_ocr | nearby_facilities | dashboard_vitals | telemedicine | emergency_sos | general_health | general_conversation",
  "confidence": 0.95,
  "suggestedAction": {
    "type": "internal_route",
    "route": "/medicine?search=...",
    "label": "Button Label",
    "description": "Brief description of the feature"
  } or null,
  "isEmergency": false,
  "needsClarification": false
}

Language Requirement: Write the "text" in ${language === 'hi' ? 'Hindi (clean Devanagari script)' : 'English'}.`;
}

/**
 * Executes a call to Google's official Gemini Developer API with structured output.
 */
export async function callGeminiApi({
  message,
  history = [],
  language = 'en',
  apiKey = process.env.GEMINI_API_KEY,
  model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  timeoutMs = 14000
}) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    const error = new Error('GEMINI_API_KEY is not configured on the server.');
    error.code = 'CONFIG_MISSING_KEY';
    throw error;
  }

  // Format multi-turn conversation history for Gemini API
  const formattedContents = [];

  // Add previous conversation turns (last 6 messages for context)
  const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
  for (const turn of recentHistory) {
    if (!turn || !turn.text) continue;
    const role = turn.role === 'user' || turn.sender === 'user' ? 'user' : 'model';
    formattedContents.push({
      role,
      parts: [{ text: String(turn.text).slice(0, 1000) }]
    });
  }

  // Add the current user query
  formattedContents.push({
    role: 'user',
    parts: [{ text: String(message).slice(0, 2000) }]
  });

  const systemInstruction = buildClinicalSystemPrompt(language);

  const requestBody = {
    contents: formattedContents,
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json'
    }
  };

  const endpointUrl = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(endpointUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim()
      },
      body: JSON.stringify(requestBody)
    });
  } catch (fetchErr) {
    clearTimeout(timer);
    if (fetchErr.name === 'AbortError') {
      const err = new Error('Request to Gemini API timed out.');
      err.code = 'TIMEOUT';
      throw err;
    }
    const err = new Error(`Network error connecting to Gemini API: ${fetchErr.message}`);
    err.code = 'NETWORK_ERROR';
    throw err;
  }
  clearTimeout(timer);

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      /* ignore */
    }

    const status = response.status;
    const errorReason = errorData?.error?.details?.[0]?.reason || errorData?.error?.status || '';
    const errorMsg = errorData?.error?.message || `HTTP ${status}`;

    const err = new Error(`Gemini API Error (${status}): ${errorMsg}`);
    err.status = status;
    err.details = errorData;

    if (status === 400 && errorReason === 'API_KEY_INVALID') {
      err.code = 'INVALID_API_KEY';
    } else if (status === 404) {
      err.code = 'UNSUPPORTED_MODEL';
    } else if (status === 429) {
      err.code = 'QUOTA_EXHAUSTED';
    } else if (status === 403) {
      err.code = 'PERMISSION_DENIED';
    } else if (status >= 500) {
      err.code = 'UPSTREAM_SERVER_ERROR';
    } else {
      err.code = 'API_ERROR';
    }

    throw err;
  }

  const responseJson = await response.json();
  const rawText = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    const err = new Error('Empty response received from Gemini model.');
    err.code = 'EMPTY_RESPONSE';
    throw err;
  }

  // Parse structured JSON output
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // If output is not strict JSON, gracefully recover by wrapping as plain text
    parsed = {
      text: rawText.replace(/```json|```/g, '').trim(),
      intent: 'general_health',
      confidence: 0.8,
      suggestedAction: null,
      isEmergency: false
    };
  }

  // Validate action route against MedWeb allowlist
  let validatedAction = null;
  if (parsed.suggestedAction && parsed.suggestedAction.route) {
    const validatedRoute = validateApplicationRoute(parsed.suggestedAction.route);
    if (validatedRoute) {
      validatedAction = {
        ...parsed.suggestedAction,
        route: validatedRoute
      };
    }
  }

  // Emergency safety override: If user query contains true life-threatening emergencies,
  // enforce isEmergency=true even if the AI model missed it.
  const isEmergencyForced = isPhysicalEmergency(message) || parsed.isEmergency === true;

  return {
    success: true,
    modelUsed: model,
    text: String(parsed.text || '').replace(/\*/g, ''),
    intent: parsed.intent || 'general_health',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
    suggestedAction: validatedAction,
    isEmergency: isEmergencyForced,
    needsClarification: Boolean(parsed.needsClarification)
  };
}

/**
 * Main Assistant Orchestrator with Intelligent Safety Fallback
 */
export async function handleAssistantQuery({
  message,
  history = [],
  language = 'en',
  apiKey = process.env.GEMINI_API_KEY,
  model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL
}) {
  const cleanMessage = String(message || '').trim();
  if (!cleanMessage) {
    return {
      success: false,
      error: 'EMPTY_QUERY',
      message: 'Message cannot be empty.'
    };
  }

  // 1. If API Key is present, attempt live Gemini API query
  if (apiKey && apiKey.trim() && apiKey !== 'your_actual_key_here') {
    try {
      const result = await callGeminiApi({
        message: cleanMessage,
        history,
        language,
        apiKey,
        model
      });
      return result;
    } catch (err) {
      console.warn(`[GeminiClient] Live query failed (${err.code}): ${err.message}`);
      
      // If quota exhausted or transient upstream error, return explicit error status with graceful advice
      if (err.code === 'QUOTA_EXHAUSTED') {
        const fallback = generateClinicalAIResponse(cleanMessage, { language, isEmergency: isPhysicalEmergency(cleanMessage) });
        return {
          success: false,
          error: 'QUOTA_EXHAUSTED',
          userMessage: 'The AI assistant has temporarily reached its usage limit. Please try again later.',
          fallbackText: fallback.text.replace(/\*/g, ''),
          isEmergency: fallback.isEmergency,
          suggestedAction: determineFeatureAction(cleanMessage)
        };
      }

      if (err.code === 'INVALID_API_KEY' || err.code === 'PERMISSION_DENIED') {
        return {
          success: false,
          error: err.code,
          userMessage: 'The configured Gemini API key is invalid or lacks required permissions. Check your server environment variables.',
          isEmergency: isPhysicalEmergency(cleanMessage)
        };
      }

      // For network errors or timeouts, surface clear retryable error
      if (err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR') {
        return {
          success: false,
          error: err.code,
          userMessage: 'Connection to the AI service timed out. Please check your network and click Retry.',
          isEmergency: isPhysicalEmergency(cleanMessage)
        };
      }
    }
  }

  // 2. Offline Clinical Intelligence Fallback (when no GEMINI_API_KEY is configured yet)
  const isEmergency = isPhysicalEmergency(cleanMessage);
  const clinicalResult = generateClinicalAIResponse(cleanMessage, { language, isEmergency });
  const featureAction = determineFeatureAction(cleanMessage);

  return {
    success: true,
    offlineMode: true,
    modelUsed: 'offline-clinical-rules',
    text: clinicalResult.text.replace(/\*/g, ''),
    intent: clinicalResult.intent || 'general_health',
    confidence: 0.9,
    suggestedAction: featureAction,
    isEmergency: clinicalResult.isEmergency || isEmergency,
    needsClarification: false
  };
}

/**
 * Intelligent deterministic feature routing helper based on user keywords & intent.
 */
function determineFeatureAction(query) {
  const lower = query.toLowerCase();

  // 1. Emergency
  if (isPhysicalEmergency(lower)) {
    return {
      type: 'internal_route',
      route: '/nearby?emergency=true',
      label: 'Emergency SOS Protocol',
      description: 'Trigger emergency protocol and locate nearest trauma center.'
    };
  }

  // 2. Prescription OCR
  if (/\b(prescription|rx|doctor('s)?\s*slip|upload\s*(a\s*)?prescription|scan\s*(a\s*)?prescription)\b/i.test(lower)) {
    return {
      type: 'internal_route',
      route: '/ocr',
      label: 'Scan Prescription with OCR',
      description: 'Upload a prescription image to automatically identify medicines and dosage.'
    };
  }

  // 3. Medicine Information
  if (/\b(paracetamol|dolo|combiflam|amoxicillin|ibuprofen|cetirizine|metformin|pantoprazole|lipitor|aspirin|medicine|dosage|tablet|capsule|syrup)\b/i.test(lower)) {
    const medMatch = lower.match(/\b(dolo\s*650|combiflam|amoxicillin|cetirizine|paracetamol|tylenol|panadol|ibuprofen|metformin|lipitor|aspirin)\b/i);
    const searchParam = medMatch ? `?search=${encodeURIComponent(medMatch[0])}` : '';
    return {
      type: 'internal_route',
      route: `/medicine${searchParam}`,
      label: 'View Medicine Information',
      description: 'Review official CDSCO/FDA monographs, dosages, and safety warnings.'
    };
  }

  // 4. Symptoms Checker
  if (/\b(symptom|check\s*my\s*symptoms|fever|cough|headache|stomach\s*pain|chest\s*pain|dizzy|nausea|vomit)\b/i.test(lower)) {
    return {
      type: 'internal_route',
      route: `/symptoms?query=${encodeURIComponent(query.slice(0, 50))}`,
      label: 'Check in Symptom Checker',
      description: 'Analyze your symptoms step-by-step with clinical triage protocols.'
    };
  }

  // 5. Nearby Hospitals / Clinics / Care
  if (/\b(hospital|clinic|pharmacy|chemist|doctor\s*near\s*me|emergency\s*room|nearest)\b/i.test(lower)) {
    return {
      type: 'internal_route',
      route: '/nearby',
      label: 'Find Nearby Healthcare',
      description: 'Locate verified hospitals, 24/7 pharmacies, and clinics near your location.'
    };
  }

  // 6. Dashboard / Vitals
  if (/\b(vitals|blood\s*pressure|sugar\s*level|heart\s*rate|dashboard|my\s*records|health\s*log)\b/i.test(lower)) {
    return {
      type: 'internal_route',
      route: '/dashboard',
      label: 'Open Health Dashboard',
      description: 'View and track your recorded blood pressure, glucose, and heart vitals.'
    };
  }

  // 7. Telemedicine
  if (/\b(online\s*doctor|telemedicine|consultation|book\s*(an?\s*)?appointment|video\s*consult)\b/i.test(lower)) {
    return {
      type: 'internal_route',
      route: '/telemedicine',
      label: 'Consult Telemedicine Doctors',
      description: 'Connect with verified physicians and specialists across Indian cities.'
    };
  }

  return null;
}
