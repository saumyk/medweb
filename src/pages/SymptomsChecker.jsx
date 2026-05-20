import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Search, Loader2, AlertTriangle, ChevronRight, MapPin, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SymptomsChecker.css';

const SymptomsChecker = () => {
  const [symptoms, setSymptoms] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    
    setIsSearching(true);
    setResults([]);
    setError(null);

    try {
      // Append keywords to force medical results
      const query = encodeURIComponent(`${symptoms.trim()} symptoms condition disease`);
      const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&utf8=&format=json&origin=*`);
      
      if (!response.ok) throw new Error("Network response was not ok");
      
      const data = await response.json();
      const hits = data.query?.search || [];
      
      // Filter out meta Wikipedia pages (talk pages, etc) and get top 3
      const validHits = hits.filter(hit => !hit.title.includes(':')).slice(0, 3);
      
      if (validHits.length === 0) {
        throw new Error("No specific conditions found for these symptoms.");
      }

      const formattedResults = validHits.map(hit => ({
        title: hit.title,
        // Remove HTML tags from snippet
        snippet: hit.snippet.replace(/<[^>]*>?/gm, '') + '...',
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title)}`
      }));

      setResults(formattedResults);
    } catch (err) {
      setError(err.message === "No specific conditions found for these symptoms." 
        ? err.message 
        : "Failed to analyze symptoms. Please try again or consult a doctor immediately.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleDoctorRedirect = (specialty) => {
    // In a fully integrated app, we could pass state. For now, we redirect to Nearby.
    navigate('/nearby');
  };

  return (
    <div className="symptoms-container container">
      <div className="symptoms-header">
        <div className="title-wrapper">
          <Activity size={32} className="header-icon" color="var(--primary)" />
          <h1 className="page-title">Symptoms Checker</h1>
        </div>
        <p className="page-subtitle">Describe what you are feeling to see possible related conditions.</p>
      </div>

      <div className="disclaimer-alert glass shadow-sm">
        <ShieldAlert size={24} className="alert-icon" />
        <div className="alert-text">
          <strong>Not Medical Advice</strong>
          <p>This tool is for informational purposes only. It uses search algorithms to find matching conditions but cannot provide a medical diagnosis. Always consult a healthcare professional for medical advice.</p>
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
            <p>Analyzing symptoms and checking medical databases...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && !isSearching && (
          <motion.div 
            className="error-state glass shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertTriangle size={32} color="var(--warning)" />
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => navigate('/nearby')}>
              Find a Doctor Nearby Instead
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {results.length > 0 && !isSearching && (
          <motion.div 
            className="results-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="results-title">Possible Related Conditions</h2>
            <div className="results-grid">
              {results.map((result, idx) => (
                <div key={idx} className="condition-card glass shadow-sm">
                  <div className="condition-header">
                    <h3>{result.title}</h3>
                    <a href={result.url} target="_blank" rel="noreferrer" className="read-more">
                      Details <ChevronRight size={16} />
                    </a>
                  </div>
                  <div className="condition-body">
                    <ul className="concise-list">
                      <li><strong>Overview:</strong> {result.snippet}</li>
                      <li><strong>Action:</strong> Medical evaluation recommended.</li>
                      <li><strong>Urgency:</strong> Varies by severity. Seek emergency care if symptoms are severe.</li>
                    </ul>
                  </div>
                  <div className="condition-footer">
                    <button className="btn btn-outline btn-sm find-doc-btn" onClick={() => handleDoctorRedirect()}>
                      <MapPin size={16} />
                      Consult Doctor Nearby
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SymptomsChecker;
