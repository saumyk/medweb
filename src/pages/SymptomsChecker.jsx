import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Search, Loader2, ShieldAlert } from 'lucide-react';
import './SymptomsChecker.css';

const SymptomsChecker = () => {
  const [searchParams] = useSearchParams();
  const [symptoms, setSymptoms] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [symptomContext, setSymptomContext] = useState(null);

  const handleSearch = (e, overrideQuery) => {
    if (e) e.preventDefault();
    const queryVal = overrideQuery !== undefined ? overrideQuery : symptoms;
    if (!queryVal.trim()) return;
    
    setIsSearching(true);
    setSymptomContext(null);

    // Simulate search delay for medical AI processing
    setTimeout(() => {
      const text = queryVal.toLowerCase();
      let selfCareSteps;
      let seekHelpAdvice;

      if (text.includes("fever") || text.includes("temp") || text.includes("cold") || text.includes("cough") || text.includes("flu") || text.includes("throat")) {
        selfCareSteps = [
          "Drink plenty of fluids (water, ORS, herbal teas) to prevent dehydration.",
          "Ensure adequate resting hours to assist your body's immune system.",
          "Use warm saline water gargles (for throat irritation) or vapor inhalation.",
          "Use a damp washcloth on your forehead to reduce temperature discomfort."
        ];
        seekHelpAdvice = "Consult a doctor if the fever exceeds 103°F (39.4°C), lasts more than 3 days, or is accompanied by a stiff neck, severe headache, confusion, or difficulty breathing.";
      } else if (text.includes("head") || text.includes("migraine") || text.includes("headache") || text.includes("tension")) {
        selfCareSteps = [
          "Rest in a quiet, dark room away from screens and bright lights.",
          "Place a cold washcloth or ice pack on your forehead or temples.",
          "Stay hydrated by drinking a full glass of water immediately.",
          "Massage neck and shoulder muscles to relieve built-up tension."
        ];
        seekHelpAdvice = "Seek emergency medical help immediately if you experience a sudden, severe 'thunderclap' headache, or if it is accompanied by fever, stiff neck, confusion, double vision, or weakness.";
      } else if (text.includes("burn") || text.includes("scald") || text.includes("sunburn")) {
        selfCareSteps = [
          "Cool the area under gentle, running cool tap water for 10-15 minutes.",
          "Cover the burn loosely with a clean, sterile, non-stick bandage.",
          "Avoid breaking any blisters to prevent introducing bacteria.",
          "Apply pure aloe vera gel or a light moisturizer after the burn has cooled."
        ];
        seekHelpAdvice = "Seek professional medical help if the burn is larger than 3 inches, covers the face, hands, feet, or major joints, or shows signs of infection (increased pain, redness, swelling, pus).";
      } else if (text.includes("chest") || text.includes("breath") || text.includes("heart") || text.includes("lungs")) {
        selfCareSteps = [
          "Stop all physical activity and rest immediately.",
          "Sit upright to help expand your lungs and ease breathing.",
          "Loosen tight collars, ties, or belts to facilitate open airways."
        ];
        seekHelpAdvice = "🚨 CALL EMERGENCY SERVICES (108 / 911) IMMEDIATELY if you experience chest pain, pressure, tightness, or shortness of breath, especially if it spreads to your arm, neck, jaw, or back.";
      } else if (text.includes("stomach") || text.includes("belly") || text.includes("nausea") || text.includes("vomit") || text.includes("diarrhea") || text.includes("cramp")) {
        selfCareSteps = [
          "Sip clear fluids or Oral Rehydration Salts (ORS) slowly to avoid stomach spasms.",
          "Follow the BRAT diet (Bananas, Rice, Applesauce, Toast) once nausea subsides.",
          "Avoid dairy, alcohol, caffeine, and greasy or spicy foods for 24-48 hours.",
          "Apply a warm hot-water bag to your abdomen to relieve cramps."
        ];
        seekHelpAdvice = "Seek clinical care if you cannot retain liquids for over 24 hours, notice blood in your stool or vomit, show signs of severe dehydration, or have severe, constant abdominal pain.";
      } else {
        selfCareSteps = [
          "Prioritize rest and avoid strenuous physical activities.",
          "Ensure you stay hydrated by drinking water or clear fluids.",
          "Monitor your symptoms closely and note changes in severity over time."
        ];
        seekHelpAdvice = "Consult a healthcare professional if symptoms worsen, persist for more than 48 hours, or interfere significantly with your daily activities.";
      }

      setSymptomContext({
        symptom: queryVal.trim(),
        selfCare: selfCareSteps,
        seekHelp: seekHelpAdvice
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
          <h1 className="page-title">Symptom Care Center</h1>
        </div>
        <p className="page-subtitle">Search a symptom to view instant, structured home care instructions and emergency severity criteria.</p>
      </div>

      <div className="disclaimer-alert glass shadow-sm">
        <ShieldAlert size={24} className="alert-icon" />
        <div className="alert-text">
          <strong>Not Medical Advice</strong>
          <p>This tool is for informational purposes only. It recommends self-care protocols for symptoms but does not diagnose diseases. Always consult a healthcare professional for clinical advice.</p>
        </div>
      </div>

      <div className="search-section glass shadow-sm">
        <form onSubmit={handleSearch} className="symptoms-form">
          <div className="input-group">
            <label htmlFor="symptoms-input">Your Symptoms</label>
            <div className="textarea-wrapper">
              <Search className="search-icon" size={20} />
              <textarea 
                id="symptoms-input"
                placeholder="E.g., severe headache, nausea, sensitivity to light..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="symptoms-input"
                rows="3"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary analyze-btn" disabled={isSearching || !symptoms.trim()}>
            {isSearching ? <Loader2 className="spinner" size={20} /> : 'Analyze Symptoms'}
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
            <p>Analyzing symptoms and preparing care guidelines...</p>
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
              <div className="guidance-header">
                <Activity size={24} className="guidance-header-icon" />
                <h2>AI Care Guidance for "{symptomContext.symptom}"</h2>
              </div>
              
              <div className="guidance-content-grid">
                <div className="guidance-selfcare">
                  <h3>Home Self-Care Steps</h3>
                  <ul className="guidance-selfcare-list">
                    {symptomContext.selfCare.map((step, idx) => (
                      <li key={idx}>
                        <span className="check-icon">✓</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="guidance-seekhelp">
                  <h3>When to Seek Medical Help</h3>
                  <div className="guidance-seekhelp-box">
                    <ShieldAlert size={20} className="guidance-alert-icon" />
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
