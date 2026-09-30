import { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Bot, Send, Mic, MicOff, AlertOctagon, RotateCcw, ShieldAlert, Sparkles, MapPin, Phone } from 'lucide-react';
import { lookupSymptom } from '../utils/symptomDatabase';
import { useLanguage } from '../components/LanguageContext';
import './AIAssistant.css';

// Emergency symptom patterns
const checkEmergencySymptoms = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  const patterns = [
    /chest\s*(pain|pressure|tightness|heaviness|discomfort)/i,
    /(difficulty|trouble|can't|cannot|unable to)\s*breath/i,
    /shortness\s*of\s*breath/i,
    /unconscious|fainted|passing\s*out|passed\s*out|blackout|unresponsive/i,
    /severe\s*bleed(ing)?|coughing\s*(up\s*)?blood/i,
    /stroke|facial\s*droop|slurred\s*speech|one[- ]side(d)?\s*weakness|arm\s*numbness/i,
    /suicid|kill\s*myself|end\s*my\s*life|self[- ]harm/i,
    /anaphylax|severe\s*allergic|throat\s*closing|swelling\s*of\s*(the\s*)?(tongue|throat|mouth)/i,
    /heart\s*attack|cardiac\s*arrest/i,
    /seizure|convulsion/i
  ];
  return patterns.some(pattern => pattern.test(lower));
};

const AIAssistant = () => {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: t('welcomeMsg') || 'Hello! I am your MedWeb AI Health Assistant. Ask me about a symptom or health concern, and I will guide you with self-care steps and let you know when to seek immediate medical help.',
      isFirst: true
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState(() => {
    return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const [lastFailedQuery, setLastFailedQuery] = useState(null);

  const chatEndRef = useRef(null);
  const messageIdCounter = useRef(1);
  const recognitionRef = useRef(null);
  const [searchParams] = useSearchParams();

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Suggested preset questions as requested
  const presetPrompts = [
    { label: t('promptFever') || 'I have a fever', query: 'I have a fever. What are the recommended home self-care steps?' },
    { label: t('promptExplainSymptoms') || 'Explain my symptoms', query: 'Can you explain what could cause a headache with mild nausea and sensitivity to light?' },
    { label: t('promptExplainMedicine') || 'Explain a medicine', query: 'Can you explain how Paracetamol works, safe adult dosages, and precautions?' },
    { label: t('promptAnalyzeReport') || 'Analyze my report', query: 'What does a normal fasting blood sugar and blood pressure range look like?' }
  ];

  // Inline Voice Dictation Handler
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setQuery(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition failed to start:', err);
      setIsListening(false);
    }
  };

  const handleSend = async (textToSend) => {
    const userQuery = (textToSend !== undefined ? textToSend : query).trim();
    if (!userQuery) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    // Add user message to conversation
    messageIdCounter.current += 1;
    const userMsgId = `user-msg-${messageIdCounter.current}`;
    const newUserMessage = {
      id: userMsgId,
      sender: 'user',
      text: userQuery
    };

    setMessages(prev => [...prev, newUserMessage]);
    setQuery('');
    setIsTyping(true);
    setLastFailedQuery(null);

    // 1. EMERGENCY CHECK
    const isEmergency = checkEmergencySymptoms(userQuery);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
    console.log("AI Chatbot API Key status:", apiKey ? "FOUND (calling Gemini API)" : "MISSING (falling back to local database)");

    if (apiKey) {
      try {
        // Construct conversation history context for Gemini (last 6 messages)
        const historyContext = messages.slice(-6).map(msg => {
          return `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`;
        }).join('\n');

        const promptText = `You are a supportive, professional Medical AI Health Assistant on the MedWeb healthcare platform.

CRITICAL MEDICAL SAFETY & GUARDRAILS:
- You must NEVER claim to diagnose a patient. Never state "You have X disease" or "You are diagnosed with X".
- ALWAYS use careful, non-diagnostic wording:
  "may be associated with"
  "possible causes include"
  "general information"
  "consider speaking with a healthcare professional"
- If the user describes potentially dangerous symptoms (chest pain, shortness of breath, unconsciousness, severe bleeding, stroke signs, suicidal ideation, anaphylaxis), prioritize emergency guidance immediately.
${isEmergency ? "URGENT NOTE: The user's query mentions potentially life-threatening symptoms. Prioritize emergency guidance, advise immediate emergency care (108 / 112 or ER), and discourage waiting or casual self-treatment." : ""}

Language requirement: Answer in ${language === 'hi' ? 'Hindi (clean Devanagari script)' : 'English'}.

Recent Conversation History:
${historyContext}

Current User Inquiry: "${userQuery}"

Structure your response clearly with these exact section headers:
🔍 What is it?
(General information and possible associations)

📋 Take Care Steps:
1. (Actionable step 1)
2. (Actionable step 2)
...

🍏 What to Eat:
- (Beneficial food 1)
- (Beneficial food 2)

🚫 What to Avoid:
- (Trigger or harmful item 1)
- (Trigger or harmful item 2)

🚨 When to Seek Help:
(Warning thresholds and when to seek urgent medical care)

IMPORTANT: Do NOT use any asterisks (*) or markdown bold formatting (like **text**) anywhere in your response. Write plain text headers and lists without asterisk characters. Keep tone compassionate, clear, and reassuring.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: promptText }]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const responseText = data.candidates[0].content.parts[0].text.replace(/\*/g, '');

          messageIdCounter.current += 1;
          const botMsgId = `bot-msg-${messageIdCounter.current}`;

          setMessages(prev => [
            ...prev,
            {
              id: botMsgId,
              sender: 'bot',
              text: responseText,
              isEmergency: isEmergency
            }
          ]);
          setIsTyping(false);
          return;
        } else {
          const errBody = await response.text().catch(() => '');
          throw new Error(`Gemini API returned status: ${response.status} - ${errBody}`);
        }
      } catch (err) {
        console.error("Gemini API call failed, falling back to local database:", err);
      }
    }

    // Graceful fallback to offline local database response
    setTimeout(() => {
      try {
        const responseText = generateMockAIResponse(userQuery, isEmergency).replace(/\*/g, '');
        messageIdCounter.current += 1;
        const botMsgId = `bot-msg-${messageIdCounter.current}`;

        setMessages(prev => [
          ...prev,
          {
            id: botMsgId,
            sender: 'bot',
            text: responseText,
            isEmergency: isEmergency
          }
        ]);
        setIsTyping(false);
      } catch (mockErr) {
        console.error("Local database error:", mockErr);
        messageIdCounter.current += 1;
        setMessages(prev => [
          ...prev,
          {
            id: `err-msg-${messageIdCounter.current}`,
            sender: 'bot',
            isError: true,
            text: t('errorOccurred') || "Unable to complete AI response right now. Please try again or check emergency services if urgent."
          }
        ]);
        setLastFailedQuery(userQuery);
        setIsTyping(false);
      }
    }, 1000);
  };

  const generateMockAIResponse = (input, isEmergency) => {
    const match = lookupSymptom(input);

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

    let response = `${emojiHeader} AI Guidance (General Information):
Possible causes or conditions may include: ${match.disease}

🔍 What is it?
${match.explanation}

📋 Take Care Steps:
${careStepsText}

🍏 What to Eat:
${eatText}

🚫 What to Avoid:
${avoidText}

🚨 Seek Help If:
${match.seekHelp}

Note: This information is for general educational guidance only and does not constitute a formal diagnosis. Consider speaking with a healthcare professional.`;

    if (isEmergency) {
      response = `🚨 POSSIBLE MEDICAL EMERGENCY

Your inquiry describes symptoms that may require urgent clinical evaluation.

🔍 What is it?
Symptoms such as severe chest pain, extreme breathlessness, sudden weakness, or unconsciousness may be associated with acute cardiovascular, neurological, or pulmonary conditions.

📋 Immediate Action Steps:
1. Stop all physical exertion and sit or lie down in a safe, comfortable position.
2. Loosen all tight clothing to aid natural respiration.
3. Call emergency dispatch (108 / 112) or have someone drive you to the nearest emergency department.
4. Do not attempt to drive yourself.

🚨 Seek Help If:
Seek emergency medical evaluation immediately. Do not delay.`;
    }

    return response;
  };

  // Handle URL query parameter ?search=...
  useEffect(() => {
    const searchVal = searchParams.get('search');
    if (searchVal) {
      const timer = setTimeout(() => {
        handleSend(searchVal);
      }, 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="ai-assistant-container container">
      {/* Page Header */}
      <div className="ai-assistant-header">
        <div className="ai-hero-badge">
          <Sparkles size={16} />
          <span>{t('aiHeroTitle') || 'MEDWEB AI'}</span>
        </div>
        <h1 className="page-title">{t('aiHeroSubtitle') || 'Your personal health companion'}</h1>
        <p className="page-subtitle">&ldquo;{t('aiHeroPrompt') || 'How can I help you today?'}&rdquo;</p>
      </div>

      {/* Clear Medical Disclaimer Banner */}
      <div className="medical-disclaimer-banner glass shadow-sm">
        <ShieldAlert size={20} className="disclaimer-icon" />
        <div className="disclaimer-text">
          <strong>{t('disclaimerBannerTitle') || 'Medical Disclaimer'}:</strong>{' '}
          <span>{t('disclaimerBannerText') || 'MedWeb AI provides general health information and guidance only. It does not provide medical diagnoses or prescriptions. If experiencing an emergency, immediately seek urgent medical attention.'}</span>
        </div>
      </div>

      {/* Chat Interface Container */}
      <div className="chat-interface-wrapper glass shadow-md">
        <div className="chat-box-header">
          <div className="bot-info-card">
            <div className="bot-avatar-active">
              <Bot size={22} color="white" />
            </div>
            <div className="bot-details-status">
              <h3>{t('medicalAiAssistant')}</h3>
              <span className="online-indicator">
                <span className="indicator-dot"></span>
                {t('activeReady')}
              </span>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="chat-messages-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-bubble-wrapper ${msg.sender === 'user' ? 'user-wrapper' : 'bot-wrapper'}`}>
              {msg.sender === 'bot' && (
                <div className={`msg-bot-avatar ${msg.isEmergency ? 'avatar-emergency' : ''}`}>
                  <Bot size={16} color="white" />
                </div>
              )}

              <div className={`message-bubble ${msg.sender === 'user' ? 'user-msg' : 'bot-msg'} ${msg.isEmergency ? 'emergency-bubble' : ''} ${msg.isError ? 'error-bubble' : ''}`}>
                {/* Emergency Alert Banner inside message */}
                {msg.isEmergency && (
                  <div className="emergency-alert-card">
                    <div className="emergency-alert-title-row">
                      <AlertOctagon size={22} className="pulse-emergency-icon" />
                      <h4>{t('emergencyAlertTitle') || 'POSSIBLE MEDICAL EMERGENCY'}</h4>
                    </div>
                    <p className="emergency-alert-desc">
                      {t('emergencyAlertText') || 'Your symptoms may require immediate medical attention. Please contact your local emergency service or go to the nearest emergency department.'}
                    </p>
                    <div className="emergency-action-buttons">
                      <Link to="/nearby?emergency=true" className="btn btn-emergency-hospital">
                        <MapPin size={16} />
                        <span>{t('findNearbyHospitalBtn') || 'Find Nearby Hospital'}</span>
                      </Link>
                      <a href="tel:108" className="btn btn-emergency-hotline">
                        <Phone size={16} />
                        <span>{t('callEmergencyBtn') || 'Call Emergency (108 / 112)'}</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Formatted Content */}
                {msg.sender === 'bot' && !msg.isFirst ? (
                  <div className="formatted-bot-text">
                    {msg.text.split('\n').map((line, index) => {
                      const trimmed = line.trim();
                      if (
                        line.startsWith('⚠️') || 
                        line.startsWith('🌡️') || 
                        line.startsWith('🔥') || 
                        line.startsWith('🤕') || 
                        line.startsWith('🤢') || 
                        line.startsWith('💬') || 
                        line.startsWith('🍁') ||
                        line.startsWith('🔍') ||
                        line.startsWith('📋') ||
                        line.startsWith('🍏') ||
                        line.startsWith('🚫')
                      ) {
                        return <h4 key={index} className="msg-section-header">{line}</h4>;
                      }
                      if (line.startsWith('🚨')) {
                        return <h4 key={index} className="msg-section-header danger-header">{line}</h4>;
                      }
                      if (/^\d+\./.test(trimmed)) {
                        return <p key={index} className="msg-list-item">{line}</p>;
                      }
                      if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                        return <p key={index} className="msg-bullet-item">{line}</p>;
                      }
                      if (line.includes('Note:') || line.includes('नोट:')) {
                        return <p key={index} className="msg-disclaimer-note">{line}</p>;
                      }
                      return <p key={index}>{line}</p>;
                    })}
                  </div>
                ) : (
                  <p>{msg.id === 'welcome' ? (t('welcomeMsg') || msg.text) : msg.text}</p>
                )}

                {/* Error State with Retry Button */}
                {msg.isError && lastFailedQuery && (
                  <button 
                    className="btn-retry"
                    onClick={() => handleSend(lastFailedQuery)}
                  >
                    <RotateCcw size={14} />
                    <span>{t('retryBtn') || 'Retry'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="message-bubble-wrapper bot-wrapper">
              <div className="msg-bot-avatar">
                <Bot size={16} color="white" />
              </div>
              <div className="message-bubble bot-msg typing-indicator-bubble">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Queries Chips */}
        <div className="chat-presets-bar">
          <span className="presets-label">{t('suggestedQueries')}</span>
          <div className="presets-list">
            {presetPrompts.map((preset, index) => (
              <button 
                key={index} 
                className="preset-chip"
                onClick={() => handleSend(preset.query)}
                disabled={isTyping}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input & Voice Bar */}
        <form 
          className="chat-input-bar" 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          {/* Inline Voice Button */}
          {speechSupported && (
            <button
              type="button"
              className={`chat-voice-btn ${isListening ? 'listening-active' : ''}`}
              onClick={toggleListening}
              title={isListening ? "Stop listening" : "Speak your question"}
              disabled={isTyping}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              <span className="voice-btn-text">
                {isListening ? (t('listening') || 'Listening...') : (t('speakBtn') || 'Speak')}
              </span>
            </button>
          )}

          <input 
            type="text"
            placeholder={isListening ? (t('listening') || "Listening to your voice...") : (t('askPlaceholder') || "Ask about symptoms, self-care, or health guidance...")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`chat-input-field ${isListening ? 'input-listening' : ''}`}
            disabled={isTyping}
          />

          <button 
            type="submit" 
            className="chat-send-btn btn-primary"
            disabled={isTyping || !query.trim()}
            title="Send Message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
