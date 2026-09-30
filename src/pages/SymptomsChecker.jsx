import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Search, Loader2, ShieldAlert, Volume2, VolumeX, 
  AlertOctagon, CheckSquare, Square, Clock, AlertTriangle, 
  User, Thermometer, Heart, Pill, MessageSquare, MapPin, Phone, RotateCcw
} from 'lucide-react';
import { lookupSymptom } from '../utils/symptomDatabase';
import { useLanguage } from '../components/LanguageContext';
import './SymptomsChecker.css';

const COMMON_SYMPTOMS = [
  { id: 'fever', labelEn: 'Fever', labelHi: 'बुखार', icon: '🌡️' },
  { id: 'headache', labelEn: 'Headache', labelHi: 'सिरदर्द', icon: '🤕' },
  { id: 'sore_throat', labelEn: 'Sore throat', labelHi: 'गले में खराश', icon: '🗣️' },
  { id: 'body_ache', labelEn: 'Body ache', labelHi: 'बदन दर्द', icon: '🦴' },
  { id: 'cough', labelEn: 'Cough', labelHi: 'खांसी', icon: '🫁' },
  { id: 'vomiting', labelEn: 'Vomiting / Nausea', labelHi: 'उल्टी / मतली', icon: '🤢' },
  { id: 'fatigue', labelEn: 'Fatigue / Weakness', labelHi: 'थकान / कमजोरी', icon: '⚡' },
  { id: 'runny_nose', labelEn: 'Runny / Stuffy Nose', labelHi: 'सर्दी / बंद नाक', icon: '👃' },
  { id: 'shortness_breath', labelEn: 'Difficulty Breathing', labelHi: 'सांस लेने में तकलीफ', icon: '😮‍💨', isEmergency: true },
  { id: 'chest_pain', labelEn: 'Chest Pressure / Pain', labelHi: 'सीने में दर्द / भारीपन', icon: '⚠️', isEmergency: true },
  { id: 'chills', labelEn: 'Chills / Shivering', labelHi: 'कंपकंपी / ठंड लगना', icon: '🥶' },
  { id: 'stomach_ache', labelEn: 'Stomach Pain / Acidity', labelHi: 'पेट दर्द / एसिडिटी', icon: '🔥' }
];

const checkEmergencyKeywords = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  const patterns = [
    /chest\s*(pain|pressure|tightness|heaviness)/i,
    /(difficulty|trouble|can't|cannot)\s*breath/i,
    /shortness\s*of\s*breath/i,
    /unconscious|fainted|blackout/i,
    /severe\s*bleed/i,
    /stroke|facial\s*droop|slurred\s*speech/i,
    /suicid|self[- ]harm/i,
    /anaphylax|throat\s*closing/i
  ];
  return patterns.some(p => p.test(lower));
};

const SymptomsChecker = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Intake State
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [freeTextSymptoms, setFreeTextSymptoms] = useState('');
  const [duration, setDuration] = useState('1-2 days');
  const [severity, setSeverity] = useState('Moderate');
  const [ageGroup, setAgeGroup] = useState('Adult (18-59)');
  const [temperature, setTemperature] = useState('');
  const [existingCondition, setExistingCondition] = useState('None');
  const [currentMedicines, setCurrentMedicines] = useState('');

  // Execution State
  const [isSearching, setIsSearching] = useState(false);
  const [symptomSummary, setSymptomSummary] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Toggle structured symptom checkbox
  const toggleSymptom = (symptomId) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  // Text to Speech
  const toggleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!symptomSummary) return;

    const causesText = symptomSummary.possibleCauses.join('. ');
    const careText = symptomSummary.selfCare.join('. ');
    const textToSpeak = `
      Symptom Summary for ${symptomSummary.symptomsList.join(', ')}.
      Duration: ${symptomSummary.duration}.
      Severity: ${symptomSummary.severity}.
      Possible causes include: ${causesText}.
      Home self-care steps: ${careText}.
      Seek medical help if: ${symptomSummary.seekHelp}.
    `;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle Symptom Analysis
  const handleAnalyze = async (e, overrideQuery) => {
    if (e) e.preventDefault();

    // Compile active symptoms list
    const selectedLabels = selectedSymptoms.map(id => {
      const match = COMMON_SYMPTOMS.find(s => s.id === id);
      return language === 'hi' ? match.labelHi : match.labelEn;
    });

    const queryInput = overrideQuery !== undefined ? overrideQuery : freeTextSymptoms;
    const combinedQuery = [
      selectedLabels.length > 0 ? selectedLabels.join(', ') : '',
      queryInput.trim()
    ].filter(Boolean).join('. ');

    if (!combinedQuery.trim()) return;

    setIsSearching(true);
    setSymptomSummary(null);

    const hasEmergencyTrigger = 
      selectedSymptoms.some(id => {
        const item = COMMON_SYMPTOMS.find(s => s.id === id);
        return item && item.isEmergency;
      }) || checkEmergencyKeywords(combinedQuery);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
    console.log("Symptoms Checker API Key status:", apiKey ? "FOUND (calling Gemini API)" : "MISSING (falling back to local database)");

    if (apiKey) {
      try {
        const promptText = `You are a licensed medical decision support assistant on the MedWeb healthcare platform.
Analyze the following patient reported symptoms and context:

Symptoms: "${combinedQuery}"
Duration: "${duration}"
Severity: "${severity}"
Age Group: "${ageGroup}"
Temperature: "${temperature || 'Not specified'}"
Pre-existing Conditions: "${existingCondition}"
Current Medicines: "${currentMedicines || 'None reported'}"

CRITICAL NON-DIAGNOSTIC SAFETY RULES:
- You must NEVER declare a definitive diagnosis like "You have X disease".
- ALWAYS use careful non-diagnostic phrasing: "Possible causes include...", "May be associated with...".
- Return ONLY a valid JSON object string with these exact keys:
{
  "symptoms": ["${selectedLabels.length > 0 ? selectedLabels.join('", "') : combinedQuery}"],
  "duration": "${duration}",
  "severity": "${severity}",
  "possibleCauses": ["Possible Cause 1 with brief non-diagnostic explanation", "Possible Cause 2 with explanation", "Possible Cause 3 with explanation"],
  "selfCare": ["Actionable home self-care step 1", "Actionable home care step 2", "Actionable home care step 3", "Actionable home care step 4"],
  "whatToEat": ["Nutrient-rich food/drink 1", "Beneficial item 2", "Beneficial item 3"],
  "whatToAvoid": ["Irritant or trigger 1", "Trigger 2", "Trigger 3"],
  "seekHelp": "Specific red flags and thresholds when to consult a physician or go to the emergency department",
  "isEmergency": ${hasEmergencyTrigger}
}
Language: ${language === 'hi' ? 'Hindi (Devanagari)' : 'English'}.
Do not include markdown wrappers like \`\`\`json. Return raw JSON string only.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates[0].content.parts[0].text;
          const parsed = JSON.parse(text);

          setSymptomSummary({
            symptomsList: parsed.symptoms || [combinedQuery],
            duration: parsed.duration || duration,
            severity: parsed.severity || severity,
            ageGroup: ageGroup,
            temperature: temperature,
            existingCondition: existingCondition,
            possibleCauses: Array.isArray(parsed.possibleCauses) ? parsed.possibleCauses : [parsed.possibleCauses],
            selfCare: parsed.selfCare || [],
            whatToEat: parsed.whatToEat || [],
            whatToAvoid: parsed.whatToAvoid || [],
            seekHelp: parsed.seekHelp || '',
            isEmergency: parsed.isEmergency || hasEmergencyTrigger
          });
          setIsSearching(false);
          return;
        } else {
          const errBody = await response.text().catch(() => '');
          throw new Error(`Gemini API returned status: ${response.status} - ${errBody}`);
        }
      } catch (err) {
        console.error("Gemini API call failed, falling back to local database:", err);
      }
    }

    // Graceful Fallback to Local Medical Database
    setTimeout(() => {
      const match = lookupSymptom(combinedQuery);
      setSymptomSummary({
        symptomsList: selectedLabels.length > 0 ? selectedLabels : [combinedQuery],
        duration: duration,
        severity: severity,
        ageGroup: ageGroup,
        temperature: temperature,
        existingCondition: existingCondition,
        possibleCauses: [
          `${match.disease}: ${match.explanation}`,
          "Viral or seasonal infection",
          "General physical exhaustion or environmental factors"
        ],
        selfCare: match.selfCare || [
          "Drink plenty of hydrating fluids and electrolytes.",
          "Ensure adequate rest and avoid heavy exertion.",
          "Keep track of temperature and symptom progression."
        ],
        whatToEat: match.whatToEat || ["Warm broths and soups", "Fresh hydrating fruits", "Herbal teas"],
        whatToAvoid: match.whatToAvoid || ["Caffeine and alcohol", "Oily, spicy, or fried meals", "Cold drinks"],
        seekHelp: match.seekHelp || "Consult a doctor if symptoms worsen, high fever lasts beyond 3 days, or severe breathing difficulties arise.",
        isEmergency: hasEmergencyTrigger
      });
      setIsSearching(false);
    }, 1000);
  };

  // Preload from URL search param
  useEffect(() => {
    const searchVal = searchParams.get('search');
    if (searchVal) {
      const timer = setTimeout(() => {
        setFreeTextSymptoms(searchVal);
        handleAnalyze(null, searchVal);
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Discuss in AI Assistant
  const handleConsultAssistant = () => {
    if (!symptomSummary) return;
    const summaryText = `I have symptoms: ${symptomSummary.symptomsList.join(', ')} for ${symptomSummary.duration} with ${symptomSummary.severity} severity. Can you provide more details and self-care tips?`;
    navigate(`/assistant?search=${encodeURIComponent(summaryText)}`);
  };

  const hasAnyInput = selectedSymptoms.length > 0 || freeTextSymptoms.trim().length > 0;

  return (
    <div className="symptoms-container container">
      {/* Header */}
      <div className="symptoms-header">
        <div className="title-wrapper">
          <Activity size={32} className="header-icon" color="var(--primary)" />
          <h1 className="page-title">{t('symptomTitle')}</h1>
        </div>
        <p className="page-subtitle">{t('symptomSubtitle')}</p>
      </div>

      {/* Medical Disclaimer Banner */}
      <div className="disclaimer-alert glass shadow-sm">
        <ShieldAlert size={24} className="alert-icon" />
        <div className="alert-text">
          <strong>{t('notMedicalAdvice')}</strong>
          <p>{t('disclaimer')}</p>
        </div>
      </div>

      {/* Intake Section: Dual-Mode Checkbox + Natural Language + Triage Form */}
      <div className="symptom-intake-card glass shadow-md">
        <form onSubmit={handleAnalyze} className="symptoms-form">
          {/* 1. Structured Symptom Checkboxes */}
          <div className="intake-section">
            <div className="intake-section-header">
              <CheckSquare size={20} className="section-icon" />
              <div>
                <h3 className="section-title">{t('selectSymptomsTitle') || 'What are you experiencing?'}</h3>
                <p className="section-subtitle">{t('selectSymptomsSubtitle') || 'Select common symptoms below or describe how you feel in your own words.'}</p>
              </div>
            </div>

            <div className="symptom-checkbox-grid">
              {COMMON_SYMPTOMS.map((item) => {
                const isSelected = selectedSymptoms.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSymptom(item.id)}
                    className={`symptom-pill-checkbox ${isSelected ? 'pill-selected' : ''} ${item.isEmergency ? 'pill-emergency' : ''}`}
                  >
                    <span className="pill-icon">{item.icon}</span>
                    <span className="pill-label">{language === 'hi' ? item.labelHi : item.labelEn}</span>
                    {isSelected ? <CheckSquare size={16} className="pill-check-state" /> : <Square size={16} className="pill-check-state" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Natural Language Input */}
          <div className="intake-section">
            <label htmlFor="symptoms-free-text" className="input-field-label">
              <Search size={16} />
              <span>{t('symptomsInputLabel') || 'Describe Your Symptoms in Your Own Words'}</span>
            </label>
            <div className="textarea-wrapper">
              <textarea
                id="symptoms-free-text"
                placeholder={t('symptomsInputPlaceholder') || 'E.g., high fever for 2 days, accompanied by throbbing headache and sore throat...'}
                value={freeTextSymptoms}
                onChange={(e) => setFreeTextSymptoms(e.target.value)}
                className="symptoms-input"
                rows="3"
              />
            </div>
          </div>

          {/* 3. Streamlined Follow-up Context Information */}
          <div className="intake-section triage-context-section">
            <div className="intake-section-header">
              <Clock size={18} className="section-icon" />
              <div>
                <h4 className="context-group-title">{t('followUpTitle') || 'Follow-Up Health Information'}</h4>
                <p className="context-group-subtitle">{t('followUpSubtitle') || 'Help us tailor safe home-care guidance (all fields optional).'}</p>
              </div>
            </div>

            <div className="triage-fields-grid">
              {/* Duration */}
              <div className="triage-field">
                <label><Clock size={15} /> {t('durationLabel') || 'Duration'}</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)} className="triage-select">
                  <option value="Today">Today (Hours)</option>
                  <option value="1-2 days">1 - 2 days</option>
                  <option value="3-7 days">3 - 7 days</option>
                  <option value="More than a week">&gt; 1 week</option>
                </select>
              </div>

              {/* Severity */}
              <div className="triage-field">
                <label><AlertTriangle size={15} /> {t('severityLabel') || 'Severity'}</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="triage-select">
                  <option value="Mild">Mild (manageable at home)</option>
                  <option value="Moderate">Moderate (uncomfortable)</option>
                  <option value="Severe">Severe (limiting activity)</option>
                </select>
              </div>

              {/* Age Group */}
              <div className="triage-field">
                <label><User size={15} /> {t('ageGroupLabel') || 'Age Group'}</label>
                <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className="triage-select">
                  <option value="Child (0-12)">Child (0-12 yrs)</option>
                  <option value="Teen (13-17)">Teen (13-17 yrs)</option>
                  <option value="Adult (18-59)">Adult (18-59 yrs)</option>
                  <option value="Senior (60+)">Senior (60+ yrs)</option>
                </select>
              </div>

              {/* Body Temperature */}
              <div className="triage-field">
                <label><Thermometer size={15} /> {t('temperatureLabel') || 'Temperature (optional)'}</label>
                <input
                  type="text"
                  placeholder="e.g. 100.4°F or normal"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="triage-input"
                />
              </div>

              {/* Pre-existing Conditions */}
              <div className="triage-field">
                <label><Heart size={15} /> {t('conditionsLabel') || 'Existing Conditions'}</label>
                <select value={existingCondition} onChange={(e) => setExistingCondition(e.target.value)} className="triage-select">
                  <option value="None">None / Healthy</option>
                  <option value="Diabetes">Diabetes</option>
                  <option value="Hypertension">Hypertension (High BP)</option>
                  <option value="Asthma / Respiratory">Asthma / Respiratory</option>
                  <option value="Cardiac History">Cardiac / Heart Disease</option>
                  <option value="Other">Other Chronic Condition</option>
                </select>
              </div>

              {/* Current Medicines */}
              <div className="triage-field">
                <label><Pill size={15} /> {t('medicinesLabel') || 'Current Medicines'}</label>
                <input
                  type="text"
                  placeholder="e.g. Metformin, Amlodipine..."
                  value={currentMedicines}
                  onChange={(e) => setCurrentMedicines(e.target.value)}
                  className="triage-input"
                />
              </div>
            </div>
          </div>

          {/* Analyze CTA */}
          <button 
            type="submit" 
            className="btn btn-primary analyze-btn" 
            disabled={isSearching || !hasAnyInput}
          >
            {isSearching ? <Loader2 className="spinner" size={20} /> : (t('analyzeBtn') || 'Analyze Symptoms')}
          </button>
        </form>
      </div>

      {/* Searching State */}
      <AnimatePresence>
        {isSearching && (
          <motion.div 
            className="searching-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="spinner large" size={40} />
            <p>{t('analyzingState') || 'Analyzing symptoms and preparing clinical guidance...'}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Polished SYMPTOM SUMMARY Result */}
      <AnimatePresence>
        {!isSearching && symptomSummary && (
          <motion.div 
            className="results-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Emergency Alert Banner if Emergency Risk is detected */}
            {symptomSummary.isEmergency && (
              <div className="symptom-emergency-banner glass shadow-md">
                <div className="emergency-banner-title">
                  <AlertOctagon size={26} className="emergency-icon-pulse" />
                  <h3>🚨 {t('emergencyAlertTitle') || 'POSSIBLE MEDICAL EMERGENCY'}</h3>
                </div>
                <p className="emergency-banner-text">
                  {t('emergencyAlertText') || 'Your reported symptoms may require immediate medical attention. Please contact your local emergency service or go to the nearest emergency department.'}
                </p>
                <div className="emergency-banner-actions">
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

            {/* Main Symptom Summary Card */}
            <div className="symptom-guidance-card glass shadow-lg">
              {/* Summary Header & Metadata Badges */}
              <div className="summary-card-header">
                <div className="summary-title-row">
                  <div className="summary-title-left">
                    <span className="summary-badge">{t('symptomSummaryTitle') || 'SYMPTOM SUMMARY'}</span>
                    <h2 className="summary-heading">
                      {symptomSummary.symptomsList.join(', ')}
                    </h2>
                  </div>

                  <div className="summary-header-actions">
                    <button 
                      className={`btn-speak-results glass-btn ${isSpeaking ? 'active-speaking' : ''}`}
                      onClick={toggleSpeak}
                      title={isSpeaking ? "Stop speaking" : "Read aloud"}
                    >
                      {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      <span>{isSpeaking ? (language === 'en' ? 'Stop' : 'रोकें') : (language === 'en' ? 'Listen' : 'सुनें')}</span>
                    </button>
                  </div>
                </div>

                {/* Context Badges */}
                <div className="summary-meta-chips">
                  <span className="meta-chip">
                    <Clock size={14} /> <strong>{t('durationLabel') || 'Duration'}:</strong> {symptomSummary.duration}
                  </span>
                  <span className={`meta-chip severity-${symptomSummary.severity.toLowerCase()}`}>
                    <AlertTriangle size={14} /> <strong>{t('severityLabel') || 'Severity'}:</strong> {symptomSummary.severity}
                  </span>
                  <span className="meta-chip">
                    <User size={14} /> <strong>{t('ageGroupLabel') || 'Age'}:</strong> {symptomSummary.ageGroup}
                  </span>
                  {symptomSummary.temperature && (
                    <span className="meta-chip">
                      <Thermometer size={14} /> <strong>{t('temperatureLabel') || 'Temp'}:</strong> {symptomSummary.temperature}
                    </span>
                  )}
                  {symptomSummary.existingCondition && symptomSummary.existingCondition !== 'None' && (
                    <span className="meta-chip">
                      <Heart size={14} /> <strong>Condition:</strong> {symptomSummary.existingCondition}
                    </span>
                  )}
                </div>
              </div>

              {/* Possible Causes Section */}
              <div className="possible-causes-section glass">
                <h3 className="section-block-title">🔍 {t('possibleCausesTitle') || 'Possible Causes'}</h3>
                <p className="causes-disclaimer-note">
                  {t('possibleCausesNotice') || 'General non-diagnostic information only. Possible causes may include:'}
                </p>
                <div className="causes-list">
                  {symptomSummary.possibleCauses.map((cause, idx) => (
                    <div key={idx} className="cause-item">
                      <span className="cause-bullet">•</span>
                      <p>{cause}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid: Self Care, Dietary, When to Seek Help */}
              <div className="guidance-content-grid">
                {/* Home Self-Care */}
                <div className="guidance-col guidance-selfcare">
                  <h3>📋 {t('homeSelfCare')}</h3>
                  <ul className="guidance-selfcare-list">
                    {symptomSummary.selfCare.map((step, idx) => (
                      <li key={idx}>
                        <span className="check-icon">✓</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dietary Guidance */}
                <div className="guidance-col guidance-dietary">
                  <div className="dietary-section eat-section">
                    <h3>🍏 {t('whatToEat')}</h3>
                    <ul className="guidance-eat-list">
                      {symptomSummary.whatToEat.map((food, idx) => (
                        <li key={idx}>
                          <span className="eat-check">✓</span>
                          <span>{food}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="dietary-section avoid-section">
                    <h3>🚫 {t('whatToAvoid')}</h3>
                    <ul className="guidance-avoid-list">
                      {symptomSummary.whatToAvoid.map((food, idx) => (
                        <li key={idx}>
                          <span className="avoid-cross">✕</span>
                          <span>{food}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Red Flags & Seek Help */}
                <div className="guidance-col guidance-seekhelp">
                  <h3>🚨 {t('whenSeekHelp')}</h3>
                  <div className="guidance-seekhelp-box">
                    <ShieldAlert size={22} className="guidance-alert-icon" />
                    <p>{symptomSummary.seekHelp}</p>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="summary-footer-actions">
                <button 
                  className="btn btn-primary btn-consult-assistant"
                  onClick={handleConsultAssistant}
                >
                  <MessageSquare size={18} />
                  <span>{t('talkToAiBtn') || 'Discuss with AI Assistant'}</span>
                </button>

                <button 
                  className="btn btn-secondary btn-new-check"
                  onClick={() => {
                    setSymptomSummary(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <RotateCcw size={16} />
                  <span>Check Other Symptoms</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SymptomsChecker;
