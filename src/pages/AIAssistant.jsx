import { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Bot, Send, Mic, MicOff, AlertOctagon, RotateCcw, ShieldAlert, Sparkles, MapPin, Phone, ArrowRight } from 'lucide-react';
import { generateClinicalAIResponse, isPhysicalEmergency } from '../utils/aiAssistantEngine';
import { useLanguage } from '../components/LanguageContext';
import { enforceMaxLength } from '../utils/security';
import './AIAssistant.css';

// Emergency symptom patterns
const checkEmergencySymptoms = (text) => isPhysicalEmergency(text);

const AIAssistant = () => {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: t('welcomeMsg') || 'Hello! I am your Arogya AI Health Assistant. Ask me about a symptom or health concern, and I will guide you with self-care steps and let you know when to seek immediate medical help.',
      isFirst: true
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState(() => {
    return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const [lastFailedQuery, setLastFailedQuery] = useState(null);
  const [speechError, setSpeechError] = useState('');

  const chatEndRef = useRef(null);
  const messageIdCounter = useRef(1);
  const recognitionRef = useRef(null);
  const hasHandledSearchRef = useRef(false);
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
      setSpeechError('Speech recognition is not supported in this browser. Please try Chrome or Edge, or type your question instead.');
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
        setSpeechError('');
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
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setSpeechError('Microphone access denied. Please allow microphone permission in your browser settings.');
        } else if (event.error === 'network') {
          setSpeechError('Network error: speech recognition requires an internet connection.');
        } else if (event.error === 'no-speech') {
          // Transient — no message
        } else if (event.error !== 'aborted') {
          setSpeechError(`Voice recognition error: ${event.error}. Please try again.`);
        }
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
    if (isTyping) return;
    const rawQuery = (textToSend !== undefined ? textToSend : query).trim();
    if (!rawQuery) return;
    const userQuery = enforceMaxLength(rawQuery, 2000);

    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
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

    try {
      const historyContext = messages.slice(-8).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        text: msg.text
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: userQuery,
          history: historyContext,
          language
        })
      });
      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        messageIdCounter.current += 1;
        const botMsgId = `bot-msg-${messageIdCounter.current}`;

        setMessages(prev => [
          ...prev,
          {
            id: botMsgId,
            sender: 'bot',
            text: (data.text || '').replace(/\*/g, ''),
            suggestedAction: data.suggestedAction || null,
            isEmergency: isEmergency || Boolean(data.isEmergency),
            offlineMode: Boolean(data.offlineMode),
            modelUsed: data.modelUsed || (data.offlineMode ? 'offline-rules' : 'gemini-1.5-flash')
          }
        ]);
        setIsTyping(false);
        return;
      }

      // If Quota exhausted (HTTP 429)
      if (response.status === 429 || data?.error === 'QUOTA_EXHAUSTED') {
        messageIdCounter.current += 1;
        const botMsgId = `bot-msg-${messageIdCounter.current}`;
        setMessages(prev => [
          ...prev,
          {
            id: botMsgId,
            sender: 'bot',
            text: data?.fallbackText || 'The AI assistant has temporarily reached its usage limit. Please try again later.',
            suggestedAction: data?.suggestedAction || null,
            isEmergency: isEmergency || Boolean(data?.isEmergency)
          }
        ]);
        setIsTyping(false);
        return;
      }

      throw new Error(data?.userMessage || data?.message || `Assistant returned status ${response.status}`);
    } catch (err) {
      console.warn('[AIAssistant] Backend call failed, using clinical fallback engine:', err.message);

      // Graceful offline fallback
      try {
        const aiResponse = generateClinicalAIResponse(userQuery, { language, isEmergency });
        const responseText = aiResponse.text.replace(/\*/g, '');
        const finalEmergency = isEmergency || aiResponse.isEmergency;

        messageIdCounter.current += 1;
        const botMsgId = `bot-msg-${messageIdCounter.current}`;

        setMessages(prev => [
          ...prev,
          {
            id: botMsgId,
            sender: 'bot',
            text: responseText,
            isEmergency: finalEmergency,
            offlineMode: true
          }
        ]);
        setIsTyping(false);
      } catch (fallbackErr) {
        console.error('Fallback error:', fallbackErr);
        messageIdCounter.current += 1;
        setMessages(prev => [
          ...prev,
          {
            id: `err-msg-${messageIdCounter.current}`,
            sender: 'bot',
            isError: true,
            text: t('errorOccurred') || 'Unable to complete AI response right now. Please try again or check emergency services if urgent.'
          }
        ]);
        setLastFailedQuery(userQuery);
        setIsTyping(false);
      }
    }
  };

  // Handle URL query parameter ?search=... or ?q=...
  useEffect(() => {
    const searchVal = searchParams.get('search') || searchParams.get('q');
    if (searchVal && !hasHandledSearchRef.current) {
      hasHandledSearchRef.current = true;
      const timer = setTimeout(() => {
        handleSend(searchVal);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ai-assistant-container container">
      {/* Page Header */}
      <div className="ai-assistant-header">
        <div className="ai-hero-badge">
          <Sparkles size={16} />
          <span>{t('aiHeroTitle') || 'AROGYA AI'}</span>
        </div>
        <h1 className="page-title">{t('aiHeroSubtitle') || 'Your personal health companion'}</h1>
        <p className="page-subtitle">&ldquo;{t('aiHeroPrompt') || 'How can I help you today?'}&rdquo;</p>
      </div>

      {/* Clear Medical Disclaimer Banner */}
      <div className="medical-disclaimer-banner glass shadow-sm">
        <ShieldAlert size={20} className="disclaimer-icon" />
        <div className="disclaimer-text">
          <strong>{t('disclaimerBannerTitle') || 'Medical Disclaimer'}:</strong>{' '}
          <span>{t('disclaimerBannerText') || 'Arogya AI provides general health information and guidance only. It does not provide medical diagnoses or prescriptions. If experiencing an emergency, immediately seek urgent medical attention.'}</span>
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
                      <a href="tel:112" className="btn btn-emergency-hotline">
                        <Phone size={16} />
                        <span>{t('callEmergencyBtn') || 'Call Emergency (112)'}</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Source Badge: Live Gemini AI vs Offline Fallback */}
                {msg.sender === 'bot' && !msg.isFirst && (
                  <div className="msg-source-row">
                    {msg.offlineMode ? (
                      <span className="msg-source-indicator offline-source-indicator" title="Using offline fallback rules. Redeploy on Vercel with GEMINI_API_KEY to activate live Gemini AI.">
                        ⚠️ Offline Fallback Rules
                      </span>
                    ) : (
                      <span className="msg-source-indicator gemini-source-indicator">
                        <Sparkles size={11} />
                        Gemini AI • {msg.modelUsed || '1.5 Flash'}
                      </span>
                    )}
                  </div>
                )}

                {/* Formatted Content */}
                {msg.sender === 'bot' && !msg.isFirst ? (
                  <div className="formatted-bot-text">
                    {msg.text.split('\n').map((line, index) => {
                      const trimmed = line.trim();
                      if (!trimmed) {
                        return <div key={index} className="msg-spacer" />;
                      }

                      const isDangerHeader = line.startsWith('🚨') || 
                        /^(\*{1,3}|#{1,4}\s*)?(When to Seek Medical Attention|Emergency Warning Signs|Red Flags)/i.test(trimmed);

                      if (isDangerHeader) {
                        return <h4 key={index} className="msg-section-header danger-header">{line.replace(/^[#*]+\s*/, '')}</h4>;
                      }

                      const isSectionHeader = (
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
                        line.startsWith('🚫') ||
                        /^(\*{1,3}|#{1,4}\s*)?(Overview|Clinical Guidance|Supportive Care Methods?|Supportive Care Steps?|Dietary Considerations?|Recommended Foods|What to Eat|What to Avoid)/i.test(trimmed)
                      );

                      if (isSectionHeader) {
                        return <h4 key={index} className="msg-section-header">{line.replace(/^[#*]+\s*/, '')}</h4>;
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

                {/* Intelligently Routed Feature Action Card */}
                {msg.suggestedAction && msg.suggestedAction.route && (
                  <div className="msg-feature-card">
                    <div className="msg-feature-card-header">
                      <span className="msg-feature-badge">
                        <Sparkles size={12} style={{ marginRight: 5 }} />
                        Recommended Feature
                      </span>
                      {msg.suggestedAction.description && (
                        <p className="msg-feature-desc">{msg.suggestedAction.description}</p>
                      )}
                    </div>
                    <Link to={msg.suggestedAction.route} className="btn-feature-link">
                      <span>{msg.suggestedAction.label}</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
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
              title={isListening ? 'Stop listening' : 'Speak your question'}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              aria-pressed={isListening}
              disabled={isTyping}
            >
              {isListening ? <MicOff size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
              <span className="voice-btn-text">
                {isListening ? (t('listening') || 'Listening...') : (t('speakBtn') || 'Speak')}
              </span>
            </button>
          )}

          {/* Speech error message — shown inline, no alert() */}
          {speechError && (
            <p
              className="speech-error-msg"
              role="alert"
              style={{ width: '100%', order: 10, padding: '0.4rem 0.75rem', fontSize: '0.78rem', color: 'var(--error, #DC2626)', background: 'rgba(239,68,68,0.08)', borderRadius: '0.5rem', margin: '0 0 0.25rem 0' }}
            >
              {speechError}
            </p>
          )}

          <input 
            type="text"
            placeholder={isListening ? (t('listening') || "Listening to your voice...") : (t('askPlaceholder') || "Ask about symptoms, self-care, or health guidance...")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className={`chat-input-field ${isListening ? 'input-listening' : ''}`}
            disabled={isTyping}
          />

          <button 
            type="submit" 
            className="chat-send-btn btn-primary"
            disabled={isTyping || !query.trim()}
            aria-label="Send message"
            title="Send Message"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
