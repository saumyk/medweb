import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, Send } from 'lucide-react';
import { lookupSymptom } from '../utils/symptomDatabase';
import { useLanguage } from '../components/LanguageContext';
import './AIAssistant.css';

const AIAssistant = () => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! I am your MedWeb AI Health Assistant. Ask me about a symptom or health concern, and I will guide you with self-care steps and let you know when to seek immediate medical help.',
      isFirst: true
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const messageIdCounter = useRef(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const presetPrompts = [
    { label: 'Self-care for mild fever', query: 'What are the self-care steps for a mild fever?' },
    { label: 'When to seek help for chest pain?', query: 'I have chest pressure, should I go to the hospital?' },
    { label: 'How to manage minor burns', query: 'Self-care steps for a minor kitchen burn' },
    { label: 'Hydration in food poisoning', query: 'How to manage stomach flu and dehydration at home?' }
  ];

  const handleSend = async (textToSend) => {
    const userQuery = textToSend || query;
    if (!userQuery.trim()) return;

    // Increment counter for user message ID
    messageIdCounter.current += 1;
    const userMsgId = `user-msg-${messageIdCounter.current}`;

    // Add user message
    const userMessage = {
      id: userMsgId,
      sender: 'user',
      text: userQuery
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsTyping(true);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
    console.log("AI Chatbot API Key status:", apiKey ? "FOUND (calling Gemini API)" : "MISSING (falling back to local database)");

    if (apiKey) {
      try {
        // Construct conversation history context for Gemini (last 6 messages)
        const historyContext = messages.slice(-6).map(msg => {
          return `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`;
        }).join('\n');

        const promptText = `You are a supportive and professional Medical AI Health Assistant on the MedWeb portal.
        
        Recent Conversation History:
        ${historyContext}
        
        Current User Inquiry: "${userQuery}"
        
        Provide a detailed response. When recommending for symptoms or diseases, structure your response using these exact section headers (WITHOUT any asterisks around them):
        🔍 What is it?
        (Explain the condition/issue)

        📋 Take Care Steps:
        1. (Step 1)
        2. (Step 2)
        ...

        🍏 What to Eat:
        - (Food 1)
        - (Food 2)
        ...

        🚫 What to Avoid:
        - (Avoid 1)
        - (Avoid 2)
        ...

        🚨 Seek Help If:
        (When to consult a doctor or go to emergency)

        IMPORTANT: Do not use any asterisks (*) or markdown bold formatting (like **text**) anywhere in your response. Write all headings, subheadings, and lists in plain text without asterisk characters.
        
        Keep the formatting clean, clear, and highly structured so the web UI can parse it.`;

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

          const botMessage = {
            id: botMsgId,
            sender: 'bot',
            text: responseText
          };
          setMessages(prev => [...prev, botMessage]);
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

    // Fallback to local database response
    setTimeout(() => {
      const responseText = generateMockAIResponse(userQuery).replace(/\*/g, '');
      
      // Increment counter for bot message ID
      messageIdCounter.current += 1;
      const botMsgId = `bot-msg-${messageIdCounter.current}`;

      const botMessage = {
        id: botMsgId,
        sender: 'bot',
        text: responseText
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateMockAIResponse = (input) => {
    const match = lookupSymptom(input);
    
    let emojiHeader = "💬";
    if (match.keys) {
      if (match.keys.includes("fever")) emojiHeader = "🌡️";
      else if (match.keys.includes("headache")) emojiHeader = "🤕";
      else if (match.keys.includes("stomach")) emojiHeader = "🤢";
      else if (match.keys.includes("acidity")) emojiHeader = "🔥";
      else if (match.keys.includes("burn")) emojiHeader = "🔥";
      else if (match.keys.includes("chest")) emojiHeader = "⚠️";
      else if (match.keys.includes("allergy")) emojiHeader = "🍁";
    }

    const careStepsText = match.selfCare.map((step, i) => `${i + 1}. ${step}`).join('\n');
    const eatText = match.whatToEat.map(food => `- ${food}`).join('\n');
    const avoidText = match.whatToAvoid.map(food => `- ${food}`).join('\n');

    let response = `${emojiHeader} AI Guidance: ${match.disease}

🔍 What is it?
${match.explanation}

📋 Take Care Steps:
${careStepsText}

🍏 What to Eat:
${eatText}

🚫 What to Avoid:
${avoidText}

🚨 Seek Help If:
${match.seekHelp}`;

    return response;
  };

  const [searchParams] = useSearchParams();

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
      <div className="ai-assistant-header">
        <h1 className="page-title">{t('aiAssistantTitle')}</h1>
        <p className="page-subtitle">{t('aiAssistantSubtitle')}</p>
      </div>

      <div className="chat-interface-wrapper glass shadow-md">
        <div className="chat-box-header">
          <div className="bot-info-card">
            <div className="bot-avatar-active">
              <Bot size={22} color="white" />
            </div>
            <div className="bot-details-status">
              <h3>{t('medicalAiAssistant')}</h3>
              <span className="online-indicator"><span className="indicator-dot"></span>{t('activeReady')}</span>
            </div>
          </div>
        </div>

        <div className="chat-messages-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-bubble-wrapper ${msg.sender === 'user' ? 'user-wrapper' : 'bot-wrapper'}`}>
              {msg.sender === 'bot' && (
                <div className="msg-bot-avatar">
                  <Bot size={16} color="white" />
                </div>
              )}
              <div className={`message-bubble ${msg.sender === 'user' ? 'user-msg' : 'bot-msg'}`}>
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
                      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                        return <p key={index} className="msg-bullet-item">{line}</p>;
                      }
                      return <p key={index}>{line}</p>;
                    })}
                  </div>
                ) : (
                  <p>{msg.id === 'welcome' ? t('welcomeMsg') : msg.text}</p>
                )}
              </div>
            </div>
          ))}
          
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

        <form 
          className="chat-input-bar" 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input 
            type="text"
            placeholder={t('askPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="chat-input-field"
            disabled={isTyping}
          />
          <button 
            type="submit" 
            className="chat-send-btn btn-primary"
            disabled={isTyping || !query.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
