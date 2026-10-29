/**
 * VoiceAssistant.jsx
 *
 * Global floating voice assistant for MedWeb.
 *
 * Architecture:
 *  - All command matching is in utils/commandParser.js (pure, testable)
 *  - This component owns: speech API lifecycle, UI state, TTS, navigation
 *  - Text-based fallback is provided when speech APIs are unavailable
 *
 * Design constraints (per spec):
 *  - Emergency: require explicit user confirmation before navigating
 *  - Medicine: pass raw transcript term; never silently substitute another name
 *  - No auto-navigation on ambiguous / too-short transcripts
 *  - No duplicate recognition event listeners
 *  - No repeated spoken confirmations for the same utterance
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, X, AlertOctagon, AlertTriangle, Keyboard } from 'lucide-react';
import {
  normalizeText,
  parseVoiceCommand,
  getSpokenConfirmation,
  getNavigationPath,
  classifySpeechError,
} from '../utils/commandParser';
import './VoiceAssistant.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** ms of silence before we process the latest interim transcript */
const SILENCE_TIMEOUT_MS = 2000;

/**
 * Only process a final transcript if the recognized text has changed by at
 * least this many characters since the last processing attempt.
 * Prevents repeated announcements for tiny interim updates.
 */
const MIN_TRANSCRIPT_DELTA = 3;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isSpeechApiSupported() {
  return typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const VoiceAssistant = () => {
  const navigate = useNavigate();

  // ── UI State ────────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingCommand, setPendingCommand] = useState(null); // command awaiting confirmation
  const [showTextInput, setShowTextInput] = useState(false); // text fallback mode
  const [textInputValue, setTextInputValue] = useState('');

  // ── Feature detection (stable across renders) ───────────────────────────────
  const speechSupported = isSpeechApiSupported();
  const synthesisSupported = isSpeechSynthesisSupported();

  // ── Refs ────────────────────────────────────────────────────────────────────
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);    // desired listening state
  const silenceTimerRef = useRef(null);
  const lastTranscriptRef = useRef('');     // latest interim transcript
  const lastProcessedRef = useRef('');      // last transcript we acted on
  const lastSpokenRef = useRef('');         // last TTS message spoken (dedupe)
  const textInputRef = useRef(null);

  const startListeningRef = useRef(null);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      clearTimeout(silenceTimerRef.current);
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      if (synthesisSupported) window.speechSynthesis.cancel();
    };
  }, [synthesisSupported]);

  // ── Focus text input when it appears ───────────────────────────────────────
  useEffect(() => {
    if (showTextInput) {
      textInputRef.current?.focus();
    }
  }, [showTextInput]);

  // ─────────────────────────────────────────────────────────────────────────
  // Core recognition lifecycle: stopListening
  // ─────────────────────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    clearTimeout(silenceTimerRef.current);
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setIsListening(false);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // TTS — deduplicated
  // ─────────────────────────────────────────────────────────────────────────
  const speak = useCallback((msg) => {
    if (!synthesisSupported || !msg) return;
    // Don't repeat the same message within the same session
    if (msg === lastSpokenRef.current) return;
    lastSpokenRef.current = msg;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(msg);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [synthesisSupported]);

  // ─────────────────────────────────────────────────────────────────────────
  // Open / close
  // ─────────────────────────────────────────────────────────────────────────
  const closeAssistant = useCallback(() => {
    stopListening();
    setIsOpen(false);
    setTranscript('');
    setPendingCommand(null);
    setErrorMessage('');
    setShowTextInput(false);
    setTextInputValue('');
    lastTranscriptRef.current = '';
    lastProcessedRef.current = '';
    lastSpokenRef.current = '';
    if (synthesisSupported) window.speechSynthesis.cancel();
  }, [stopListening, synthesisSupported]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeAssistant();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeAssistant]);

  // ─────────────────────────────────────────────────────────────────────────
  // Execute a parsed command
  // ─────────────────────────────────────────────────────────────────────────
  const executeCommand = useCallback((command) => {
    if (!command) return;

    const spoken = getSpokenConfirmation(command);

    if (command.type === 'NAVIGATE_EMERGENCY') {
      // Always require user confirmation
      speak(spoken);
      setPendingCommand(command);
      stopListening();
      return;
    }

    const path = getNavigationPath(command);
    if (!path) return;

    speak(spoken);
    navigate(path);
    closeAssistant();
  }, [navigate, speak, stopListening, closeAssistant]);

  // ─────────────────────────────────────────────────────────────────────────
  // Silence timeout — process the latest interim transcript
  // ─────────────────────────────────────────────────────────────────────────
  const handleSilenceTimeout = useCallback(() => {
    const text = lastTranscriptRef.current.trim();
    if (!text) return;

    // Deduplicate: don't re-process if we've already acted on this text
    const delta = Math.abs(text.length - lastProcessedRef.current.length);
    if (normalizeText(text) === normalizeText(lastProcessedRef.current)) return;
    if (delta < MIN_TRANSCRIPT_DELTA && lastProcessedRef.current) return;

    lastProcessedRef.current = text;
    const command = parseVoiceCommand(text);
    executeCommand(command);
  }, [executeCommand]);

  const startListening = useCallback((lang = 'en-US') => {
    if (!speechSupported) return;

    // Prevent duplicate recognition instances
    if (recognitionRef.current && shouldListenRef.current) {
      return; // already running
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage('');
      setTranscript('');
      lastTranscriptRef.current = '';
      lastProcessedRef.current = '';
    };

    recognition.onresult = (event) => {
      let current = '';
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
      lastTranscriptRef.current = current;

      // Check for emergency immediately (don't wait for silence timer)
      const command = parseVoiceCommand(current);
      if (command?.type === 'NAVIGATE_EMERGENCY') {
        speak(getSpokenConfirmation(command));
        setPendingCommand(command);
        stopListening();
        return;
      }

      // For all other commands: (re)start the silence timer
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(handleSilenceTimeout, SILENCE_TIMEOUT_MS);
    };

    recognition.onerror = (event) => {
      const userMsg = classifySpeechError(event.error);
      if (userMsg) {
        setErrorMessage(userMsg);
      }
      if (event.error === 'not-allowed' || event.error === 'permission-denied' ||
          event.error === 'audio-capture' || event.error === 'service-not-allowed') {
        shouldListenRef.current = false;
        setIsListening(false);
      }
      // language-not-supported: fall back to en-US
      if (event.error === 'language-not-supported') {
        shouldListenRef.current = false;
        setIsListening(false);
        setTimeout(() => startListeningRef.current?.('en-US'), 300);
      }
    };

    recognition.onend = () => {
      // Auto-restart while we still want to listen
      if (shouldListenRef.current) {
        setTimeout(() => {
          if (shouldListenRef.current) {
            try { recognition.start(); }
            catch (e) {
              console.warn('Voice restart failed:', e);
              setIsListening(false);
            }
          }
        }, 150);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    shouldListenRef.current = true;

    try {
      recognition.start();
    } catch (e) {
      console.warn('Speech engine start error:', e);
      setIsListening(false);
      setErrorMessage('Could not start the microphone. Please check your device settings.');
    }
  }, [speechSupported, speak, stopListening, handleSilenceTimeout]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const handleToggleOpen = useCallback(() => {
    if (isOpen) {
      closeAssistant();
      return;
    }

    // Open the panel first
    setIsOpen(true);
    setPendingCommand(null);
    setErrorMessage('');
    setShowTextInput(false);
    lastSpokenRef.current = '';

    if (!speechSupported) {
      // Show text fallback immediately
      setErrorMessage(
        'Speech recognition is not available in this browser. ' +
        'Use Chrome or Edge for voice, or type your command below.'
      );
      setShowTextInput(true);
      return;
    }

    startListening();
    speak('How can I help you?');
  }, [isOpen, speechSupported, closeAssistant, startListening, speak]);

  // ─────────────────────────────────────────────────────────────────────────
  // Emergency confirmation / cancellation
  // ─────────────────────────────────────────────────────────────────────────
  const confirmEmergency = useCallback(() => {
    if (!pendingCommand) return;
    speak('Routing to emergency services.');
    navigate(getNavigationPath(pendingCommand));
    closeAssistant();
  }, [pendingCommand, navigate, speak, closeAssistant]);

  const cancelEmergency = useCallback(() => {
    setPendingCommand(null);
    setTranscript('');
    lastProcessedRef.current = '';
    // Resume listening after cancellation
    if (speechSupported) startListening();
  }, [speechSupported, startListening]);

  // ─────────────────────────────────────────────────────────────────────────
  // Text input fallback
  // ─────────────────────────────────────────────────────────────────────────
  const handleTextSubmit = useCallback((e) => {
    e.preventDefault();
    const val = textInputValue.trim();
    if (!val) return;
    const command = parseVoiceCommand(val);
    if (command?.type === 'NAVIGATE_EMERGENCY') {
      setPendingCommand(command);
      return;
    }
    executeCommand(command);
  }, [textInputValue, executeCommand]);

  // ─────────────────────────────────────────────────────────────────────────
  // Status text
  // ─────────────────────────────────────────────────────────────────────────
  const statusText = (() => {
    if (pendingCommand?.type === 'NAVIGATE_EMERGENCY') return 'Emergency phrase detected — confirm below';
    if (isListening) return 'Listening for your command…';
    if (showTextInput) return 'Type a command below';
    return 'Microphone inactive';
  })();

  // ─────────────────────────────────────────────────────────────────────────
  // Hint text for placeholder / prompt
  // ─────────────────────────────────────────────────────────────────────────
  const COMMAND_EXAMPLES = [
    '"Go home"',
    '"Open assistant"',
    '"Check fever"',
    '"Search paracetamol"',
    '"Find a pharmacy near me"',
    '"Emergency"',
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Floating Trigger Button ─────────────────────────────────────── */}
      <button
        id="voice-assistant-trigger"
        className={`floating-voice-trigger ${isOpen ? 'active-pulse' : ''}`}
        onClick={handleToggleOpen}
        title={isOpen ? 'Close Voice Assistant' : 'Open Voice Assistant'}
        aria-label={isOpen ? 'Close voice assistant' : 'Open voice assistant'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {isOpen
          ? <MicOff size={24} aria-hidden="true" />
          : <Mic size={24} aria-hidden="true" />}
      </button>

      {/* ── Voice Panel ─────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="voice-assistant-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="va-title"
        >
          <div className="voice-assistant-card glass">

            {/* Close button */}
            <button
              className="voice-close-btn"
              onClick={closeAssistant}
              aria-label="Close voice assistant"
            >
              <X size={20} aria-hidden="true" />
            </button>

            {/* Visualizer */}
            <div className="voice-visualizer-section">
              <div
                className="voice-visualizer"
                aria-hidden="true"
              >
                <div className={`wave-ring ring-1 ${!isListening ? 'paused' : ''}`} />
                <div className={`wave-ring ring-2 ${!isListening ? 'paused' : ''}`} />
                <div className={`wave-ring ring-3 ${!isListening ? 'paused' : ''}`} />
                <div className="wave-mic-core">
                  <Mic size={32} color="white" />
                </div>
              </div>
              <h3 id="va-title">MedWeb Voice</h3>
              <p
                className="voice-status-text"
                aria-live="polite"
                aria-atomic="true"
              >
                {statusText}
              </p>
            </div>

            {/* Transcript */}
            <div
              className="voice-transcript-box"
              aria-live="polite"
              aria-atomic="true"
              aria-label="Voice transcript"
            >
              <p className="transcript-text">
                {transcript || (
                  <span className="transcript-placeholder">
                    {COMMAND_EXAMPLES.join(' · ')}
                  </span>
                )}
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="voice-error-banner" role="alert">
                <AlertTriangle size={16} aria-hidden="true" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Emergency confirmation */}
            {pendingCommand?.type === 'NAVIGATE_EMERGENCY' && (
              <div className="voice-emergency-confirm" role="alertdialog" aria-labelledby="va-sos-heading">
                <div className="voice-emergency-confirm-header">
                  <AlertOctagon size={20} aria-hidden="true" />
                  <strong id="va-sos-heading">Emergency phrase detected</strong>
                </div>
                <p>
                  Tap <strong>Confirm</strong> to open emergency contacts and find
                  nearby hospitals. Only confirm if this was intentional.
                </p>
                <div className="voice-emergency-confirm-actions">
                  <button
                    className="voice-sos-confirm-btn"
                    onClick={confirmEmergency}
                    autoFocus
                    aria-label="Confirm emergency and open emergency services"
                  >
                    ✔ Confirm — Open Emergency Services
                  </button>
                  <button
                    className="voice-sos-cancel-btn"
                    onClick={cancelEmergency}
                    aria-label="Cancel and resume listening"
                  >
                    ✕ Cancel — Resume Listening
                  </button>
                </div>
              </div>
            )}

            {/* Text fallback input */}
            {showTextInput && (
              <form className="va-text-fallback" onSubmit={handleTextSubmit} noValidate>
                <label htmlFor="va-text-input" className="va-text-label">
                  Type a command:
                </label>
                <div className="va-text-input-row">
                  <input
                    id="va-text-input"
                    ref={textInputRef}
                    type="text"
                    className="va-text-input"
                    placeholder='e.g. "check fever" or "find a pharmacy"'
                    value={textInputValue}
                    onChange={e => setTextInputValue(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Type your voice command here"
                  />
                  <button
                    type="submit"
                    className="va-text-submit"
                    disabled={!textInputValue.trim()}
                    aria-label="Submit command"
                  >
                    Go
                  </button>
                </div>
              </form>
            )}

            {/* Toggle text/voice input */}
            {speechSupported && (
              <div className="va-mode-toggle">
                <button
                  type="button"
                  className="va-toggle-text-btn"
                  onClick={() => setShowTextInput(v => !v)}
                  aria-pressed={showTextInput}
                >
                  <Keyboard size={14} aria-hidden="true" />
                  <span>{showTextInput ? 'Switch to voice' : 'Type instead'}</span>
                </button>
              </div>
            )}

            {/* Command cheatsheet */}
            <details className="va-commands-help">
              <summary>What can I say?</summary>
              <ul className="va-commands-list">
                <li><code>go home</code> — Return to home page</li>
                <li><code>open assistant</code> — Open AI Health Chat</li>
                <li><code>open symptom checker</code> — Open symptom checker</li>
                <li><code>open medicine search</code> — Open medicine search</li>
                <li><code>find a pharmacy near me</code> — Nearby facilities</li>
                <li><code>check fever</code> — Look up a symptom</li>
                <li><code>search paracetamol</code> — Look up a medicine</li>
                <li><code>emergency</code> — Open emergency contacts <em>(requires confirmation)</em></li>
              </ul>
            </details>

          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAssistant;
