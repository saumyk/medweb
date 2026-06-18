import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Search, Loader2, ShieldAlert } from 'lucide-react';
import { lookupSymptom } from '../utils/symptomDatabase';
import { useLanguage } from '../components/LanguageContext';
import './SymptomsChecker.css';

const SymptomsChecker = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [symptoms, setSymptoms] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [symptomContext, setSymptomContext] = useState(null);


  const handleSearch = async (e, overrideQuery) => {
    if (e) e.preventDefault();
    const queryVal = overrideQuery !== undefined ? overrideQuery : symptoms;
    if (!queryVal.trim()) return;
    
    setIsSearching(true);
    setSymptomContext(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
    console.log("Symptoms Checker API Key status:", apiKey ? "FOUND (calling Gemini API)" : "MISSING (falling back to local database)");

    if (apiKey) {
      try {
        const promptText = `You are a professional medical assistant. Analyze these symptoms: "${queryVal}".
        Return a JSON object containing:
        {
          "disease": "Likely disease/condition name",
          "explanation": "Brief description of the condition and why it happens",
          "selfCare": ["4-5 home care steps"],
          "whatToEat": ["4-5 recommended foods/drinks"],
          "whatToAvoid": ["4-5 foods/items to avoid"],
          "seekHelp": "Specific warning symptoms that require clinical attention"
        }
        Do not include markdown wrappers (like \`\`\`json). Just return the raw JSON object string.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: promptText }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => '');
          throw new Error(`Gemini API returned status: ${response.status} - ${errBody}`);
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(text);

        setSymptomContext({
          symptom: queryVal.trim(),
          disease: parsed.disease,
          explanation: parsed.explanation,
          selfCare: parsed.selfCare || [],
          whatToEat: parsed.whatToEat || [],
          whatToAvoid: parsed.whatToAvoid || [],
          seekHelp: parsed.seekHelp
        });
        setIsSearching(false);
        return;
      } catch (err) {
        console.error("Gemini API call failed, falling back to local database:", err);
      }
    }

    // Fallback to local database response
    setTimeout(() => {
      const match = lookupSymptom(queryVal);

      setSymptomContext({
        symptom: queryVal.trim(),
        disease: match.disease,
        explanation: match.explanation,
        selfCare: match.selfCare,
        whatToEat: match.whatToEat,
        whatToAvoid: match.whatToAvoid,
        seekHelp: match.seekHelp
      });
      setIsSearching(false);
    }, 1000);
  };

  useEffect(() => {
    const searchVal = searchParams.get('search');
    if (searchVal) {
      const timer = setTimeout(() => {
        setSymptoms(searchVal);
        handleSearch(null, searchVal);
      }, 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="symptoms-container container">
      <div className="symptoms-header">
        <div className="title-wrapper">
          <Activity size={32} className="header-icon" color="var(--primary)" />
          <h1 className="page-title">{t('symptomTitle')}</h1>
        </div>
        <p className="page-subtitle">{t('symptomSubtitle')}</p>
      </div>

      <div className="disclaimer-alert glass shadow-sm">
        <ShieldAlert size={24} className="alert-icon" />
        <div className="alert-text">
          <strong>{t('notMedicalAdvice')}</strong>
          <p>{t('disclaimer')}</p>
        </div>
      </div>

      <div className="search-section glass shadow-sm">
        <form onSubmit={handleSearch} className="symptoms-form">
          <div className="input-group">
            <label htmlFor="symptoms-input">{t('symptomsInputLabel')}</label>
            <div className="textarea-wrapper">
              <Search className="search-icon" size={20} />
              <textarea 
                id="symptoms-input"
                placeholder={t('symptomsInputPlaceholder')}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="symptoms-input"
                rows="3"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary analyze-btn" disabled={isSearching || !symptoms.trim()}>
            {isSearching ? <Loader2 className="spinner" size={20} /> : t('analyzeBtn')}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {isSearching && (
          <motion.div 
            className="searching-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="spinner large" size={40} />
            <p>{t('analyzingState')}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isSearching && symptomContext && (
          <motion.div 
            className="results-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Context-aware Self-Care & Severity Guidance Card */}
            <div className="symptom-guidance-card glass shadow-md">
              <div className="guidance-header-block">
                <div className="guidance-header">
                  <Activity size={24} className="guidance-header-icon" />
                  <h2>{t('resultsTitle')} &ldquo;{symptomContext.symptom}&rdquo;</h2>
                </div>
                {symptomContext.disease && (
                  <div className="disease-info-header glass">
                    <h3 className="disease-title">{t('possibleCondition')} {symptomContext.disease}</h3>
                    <p className="disease-explanation">{symptomContext.explanation}</p>
                  </div>
                )}
              </div>
              
              <div className="guidance-content-grid">
                <div className="guidance-col guidance-selfcare">
                  <h3>{t('homeSelfCare')}</h3>
                  <ul className="guidance-selfcare-list">
                    {symptomContext.selfCare.map((step, idx) => (
                      <li key={idx}>
                        <span className="check-icon">✓</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="guidance-col guidance-dietary">
                  <div className="dietary-section eat-section">
                    <h3>🍏 {t('whatToEat')}</h3>
                    <ul className="guidance-eat-list">
                      {symptomContext.whatToEat.map((food, idx) => (
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
                      {symptomContext.whatToAvoid.map((food, idx) => (
                        <li key={idx}>
                          <span className="avoid-cross">✕</span>
                          <span>{food}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="guidance-col guidance-seekhelp">
                  <h3>{t('whenSeekHelp')}</h3>
                  <div className="guidance-seekhelp-box">
                    <ShieldAlert size={22} className="guidance-alert-icon" />
                    <p>{symptomContext.seekHelp}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SymptomsChecker;
