import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, X } from 'lucide-react';
import './VoiceAssistant.css';

const VoiceAssistant = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeechSupported] = useState(() => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    return !!SpeechRecognition;
  });

  const recognitionRef = useRef(null);
  const shouldBeListeningRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const latestTranscriptRef = useRef('');

  useEffect(() => {
    return () => {
      shouldBeListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = (msg) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      latestTranscriptRef.current = '';
    };

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
      latestTranscriptRef.current = currentTranscript;

      // 1. Check direct keywords (navigates instantly if matched)
      const matched = parseCommand(currentTranscript);

      // 2. If no keywords matched, refresh the silence timer.
      // Once the user stops speaking, we submit it as a general query fallback.
      if (!matched) {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = setTimeout(() => {
          handleSilenceTimeout();
        }, 2200);
      }
    };

    recognition.onerror = (event) => {
      console.error('Global voice assistant error:', event.error);
      if (event.error === 'not-allowed') {
        shouldBeListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (shouldBeListeningRef.current) {
        setTimeout(() => {
          if (shouldBeListeningRef.current) {
            try {
              recognition.start();
            } catch (e) {
              console.error('Speech restart failed:', e);
            }
          }
        }, 150);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    shouldBeListeningRef.current = true;
    try {
      recognition.start();
      speak("How can I help you?");
    } catch (e) {
      console.error('Speech engine start error:', e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    shouldBeListeningRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    setIsListening(false);
  };

  const handleToggleOpen = () => {
    if (!isSpeechSupported) {
      alert("Speech Recognition is not supported by your browser. Please try Chrome, Safari, or Edge.");
      return;
    }

    if (isOpen) {
      closeAssistant();
    } else {
      setIsOpen(true);
      startListening();
    }
  };

  const closeAssistant = () => {
    stopListening();
    setIsOpen(false);
    setTranscript('');
    latestTranscriptRef.current = '';
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleSilenceTimeout = () => {
    const finalText = latestTranscriptRef.current.trim();
    if (!finalText) return;

    // Final check for keywords
    const matched = parseCommand(finalText);
    if (!matched) {
      speak(`Asking health assistant about: ${finalText}`);
      navigate(`/assistant?search=${encodeURIComponent(finalText)}`);
      closeAssistant();
    }
  };

  const parseCommand = (phrase) => {
    const text = phrase.toLowerCase().trim();

    // 1. SOS / Emergency command
    if (text.includes('emergency') || text.includes('sos') || text.includes('ambulance') || text.includes('accident')) {
      speak("Emergency mode activated. Routing to nearby hospitals.");
      navigate('/nearby?emergency=true');
      closeAssistant();
      return true;
    }

    // 2. Navigation
    if (text === 'home' || text === 'homepage' || text === 'go home') {
      speak("Returning to the homepage.");
      navigate('/');
      closeAssistant();
      return true;
    }
    if (text === 'assistant' || text === 'chat' || text === 'chatbot' || text === 'ask ai') {
      speak("Opening AI Health Assistant.");
      navigate('/assistant');
      closeAssistant();
      return true;
    }

    // 3. Match Medicines (e.g. "aspirin" or "find paracetamol")
    const medicines = ["paracetamol", "dolo", "crocin", "calpol", "aspirin", "ibuprofen", "amoxicillin", "augmentin", "pantoprazole", "omeprazole", "cetirizine", "allegra", "fexofenadine"];
    for (const med of medicines) {
      const regex = new RegExp(`\\b${med}\\b`, 'i');
      if (regex.test(text)) {
        speak(`Searching medicine details for ${med}`);
        navigate(`/medicine?search=${encodeURIComponent(med)}`);
        closeAssistant();
        return true;
      }
    }

    // 4. Match Symptoms (e.g. "fever" or "diagnose headache")
    const symptomsList = ["fever", "cough", "cold", "burn", "headache", "migraine", "chest pain", "stomach ache", "stomach pain", "acid"];
    for (const sym of symptomsList) {
      const regex = new RegExp(`\\b${sym}\\b`, 'i');
      if (regex.test(text)) {
        speak(`Analyzing care instructions for ${sym}`);
        navigate(`/symptoms?search=${encodeURIComponent(sym)}`);
        closeAssistant();
        return true;
      }
    }

    // 5. Match Facilities (Specific names or general categories e.g. "Apollo Hospital" or "pharmacy")
    const facilities = ["hospital", "clinic", "pharmacy", "doctor", "dentist", "pediatrician", "orthopedist", "gynecologist"];
    for (const fac of facilities) {
      if (text.includes(fac)) {
        speak(`Searching facilities for ${text}`);
        navigate(`/nearby?search=${encodeURIComponent(text)}`);
        closeAssistant();
        return true;
      }
    }

    return false;
  };

  return (
    <>
      {/* Floating Assist Trigger Button */}
      <button 
        className={`floating-voice-trigger ${isOpen ? 'active-pulse' : ''}`} 
        onClick={handleToggleOpen}
        title="Consult Global Voice Assistant"
      >
        {isOpen ? <MicOff size={24} /> : <Mic size={24} />}
      </button>

      {/* Voice Dashboard Overlay */}
      {isOpen && (
        <div className="voice-assistant-overlay">
          <div className="voice-assistant-card glass shadow-lg">
            <button className="voice-close-btn" onClick={closeAssistant} title="Close Voice Assistant">
              <X size={20} />
            </button>
            
            <div className="voice-visualizer-section">
              <div className="voice-visualizer">
                <div className="wave-ring ring-1"></div>
                <div className="wave-ring ring-2"></div>
                <div className="wave-ring ring-3"></div>
                <div className="wave-mic-core">
                  <Mic size={32} color="white" />
                </div>
              </div>
              <h3>MedWeb Voice Command</h3>
              <p className="voice-status-text">
                {isListening ? 'Listening for your voice...' : 'Microphone disabled'}
              </p>
            </div>

            <div className="voice-transcript-box">
              <p className="transcript-text">
                {transcript || '"Say a medicine, symptom, facility, or query..."'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAssistant;
