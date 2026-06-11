import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, Send } from 'lucide-react';
import { lookupSymptom } from '../utils/symptomDatabase';
import './AIAssistant.css';

const AIAssistant = () => {
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

  const handleSend = (textToSend) => {
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

    // Mock AI response delay
    setTimeout(() => {
      const responseText = generateMockAIResponse(userQuery);
      
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

    let response = `${emojiHeader} **AI Guidance: ${match.disease}**

🔍 **What is it?**
${match.explanation}

📋 **Take Care Steps:**
${careStepsText}

🍏 **What to Eat:**
${eatText}

🚫 **What to Avoid:**
${avoidText}

🚨 **Seek Help If:**
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
        <h1 className="page-title">AI Health Assistant</h1>
        <p className="page-subtitle">Consult our medical chatbot to receive immediate self-care recommendations and severity warnings.</p>
      </div>

      <div className="chat-interface-wrapper glass shadow-md">
        <div className="chat-box-header">
          <div className="bot-info-card">
            <div className="bot-avatar-active">
              <Bot size={22} color="white" />
            </div>
            <div className="bot-details-status">
              <h3>Medical AI Assistant</h3>
              <span className="online-indicator"><span className="indicator-dot"></span>Active & Ready</span>
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
                  <p>{msg.text}</p>
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
          <span className="presets-label">Suggested Queries:</span>
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
            placeholder="Ask about a symptom, self-care steps, or health concerns..."
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
