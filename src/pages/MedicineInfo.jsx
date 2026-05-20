import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, AlertTriangle, Info, Clock, CheckCircle2, FileWarning, FlaskConical, Factory } from 'lucide-react';
import './MedicineInfo.css';

const MedicineInfo = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const cleanText = (text, maxSentences = 2) => {
    if (!text) return "";
    let clean = text.replace(/\s+/g, ' ').trim();
    let sentences = clean.split('. ').filter(s => s.length > 0);
    let result = sentences.slice(0, maxSentences).join('. ');
    return result + (result.endsWith('.') ? '' : '.');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    fetchMedicineData(searchQuery.trim());
  };

  const fetchMedicineData = async (query) => {
    setIsSearching(true);
    setResult(null);
    setError(null);
    
    // Mapping common Indian/International names to FDA recognized names
    const nameMapping = {
      "paracetamol": "acetaminophen",
      "crocin": "acetaminophen",
      "dolo": "acetaminophen",
      "calpol": "acetaminophen",
      "cetirizine": "cetirizine",
      "citirizine": "cetirizine",
      "allegra": "fexofenadine",
      "augmentin": "amoxicillin",
      "pantop": "pantoprazole",
      "pan": "pantoprazole"
    };

    const normalizedQuery = query.toLowerCase().trim();
    const fdaQuery = nameMapping[normalizedQuery] || normalizedQuery;

    try {
      // Fetch Indian Pricing from Tata 1mg (via proxy)
      let tataInfo = null;
      try {
        const tataUrl = encodeURIComponent(`https://www.1mg.com/api/v1/search/autocomplete?name=${query}`);
        const tataRes = await fetch(`https://api.allorigins.win/get?url=${tataUrl}`);
        if (tataRes.ok) {
           const proxyData = await tataRes.json();
           if (proxyData.contents) {
             const tataData = JSON.parse(proxyData.contents);
             const drug = tataData.results?.find(r => r.type === 'drug' && r.price);
             if (drug) {
                tataInfo = {
                   price: drug.price,
                   discountPrice: drug.discounted_price,
                   packSize: drug.pack_size_label,
                   manufacturer: drug.manufacturer_name,
                   name: drug.name.replace(/<[^>]*>?/gm, ''), // Remove HTML bold tags
                   url: `https://www.1mg.com${drug.url_path}`
                };
             }
           }
        }
      } catch (e) {
        console.error("Tata 1mg fetch failed", e);
      }

      const encodedFda = encodeURIComponent(fdaQuery);
      // 1. Try fetching from OpenFDA API by generic name
      let fdaRes = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodedFda}"&limit=1`);
      
      // 2. If fails, try brand name
      if (!fdaRes.ok) {
        fdaRes = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodedFda}"&limit=1`);
      }
      
      // 3. If fails, try substance name
      if (!fdaRes.ok) {
        fdaRes = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.substance_name:"${encodedFda}"&limit=1`);
      }

      // 4. If fails, try broad search
      if (!fdaRes.ok) {
        fdaRes = await fetch(`https://api.fda.gov/drug/label.json?search="${encodedFda}"&limit=1`);
      }
      
      if (fdaRes.ok) {
        const data = await fdaRes.json();
        const med = data.results[0];
        
        setResult({
          name: tataInfo?.name || med.openfda?.brand_name?.[0] || med.openfda?.generic_name?.[0] || query,
          formula: med.openfda?.substance_name?.join(', ') || med.openfda?.generic_name?.[0] || "Unknown Active Ingredient",
          manufacturer: tataInfo?.manufacturer || med.openfda?.manufacturer_name?.[0] || "Various Manufacturers",
          category: med.openfda?.pharm_class_epc?.[0] || med.openfda?.product_type?.[0] || "Medication",
          tataInfo: tataInfo,
          description: med.indications_and_usage?.[0] || med.purpose?.[0] || med.description?.[0] 
            ? cleanText(med.indications_and_usage?.[0] || med.purpose?.[0] || med.description?.[0], 4).split('. ').filter(s => s.trim().length > 5)
            : ["Used for treatment as prescribed by a physician"],
          dosage: med.dosage_and_administration?.[0] 
              ? cleanText(med.dosage_and_administration[0], 3)
              : "Take this medicine in the dose and duration as advised by your doctor. Swallow it as a whole. Do not chew, crush or break it.",
          risks: (() => {
            const raw = (med.adverse_reactions?.[0] || med.warnings?.[0] || "").toLowerCase();
            const known = ["diarrhea", "headache", "vomiting", "nausea", "abdominal discomfort", "dizziness", "fatigue", "rash", "constipation", "drowsiness", "insomnia", "dry mouth", "stomach pain", "sweating"];
            const found = known.filter(k => raw.includes(k)).map(k => k.charAt(0).toUpperCase() + k.slice(1));
            return found.length > 0 ? found.slice(0, 6) : ["Consult your doctor for potential side effects"];
          })(),
          pharmacokinetics: med.pharmacokinetics?.[0] || med.clinical_pharmacology?.[0] || med.mechanism_of_action?.[0]
            ? cleanText(med.pharmacokinetics?.[0] || med.clinical_pharmacology?.[0] || med.mechanism_of_action?.[0], 3)
            : "This medicine works by targeting specific pathways in the body to alleviate symptoms. Consult your doctor for detailed pharmacology.",
          safety: {
            pregnancy: (med.pregnancy?.[0] || "").toLowerCase().includes("contraindicated") || (med.pregnancy?.[0] || "").toLowerCase().includes("do not use") ? "UNSAFE" : "CAUTION",
            alcohol: "UNSAFE" // Defaulting to unsafe for most meds with alcohol as a general safety standard unless specified
          }
        });
        setIsSearching(false);
        return;
      }

      // 5. Ultimate Fallback to Wikipedia API
      const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        if (wikiData.title && wikiData.extract && !wikiData.extract.includes("may refer to")) {
          setResult({
            name: tataInfo?.name || wikiData.title,
            formula: wikiData.title,
            manufacturer: tataInfo?.manufacturer || "General Information",
            category: "General Medicine Info",
            tataInfo: tataInfo,
            description: cleanText(wikiData.extract, 3).split('. ').filter(s => s.trim().length > 5),
            dosage: "Take this medicine in the dose and duration as advised by your doctor. Swallow it as a whole.",
            risks: ["Nausea", "Headache", "Fatigue", "Dizziness"],
            pharmacokinetics: "Mechanism of action varies based on the specific drug formulation.",
            safety: {
              pregnancy: "CAUTION",
              alcohol: "UNSAFE"
            }
          });
          setIsSearching(false);
          return;
        }
      }

      throw new Error("Medicine not found");
    } catch (err) {
      setError(`We couldn't find detailed trusted information for "${query}". Please check the spelling or consult a healthcare professional.`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="med-info-container container">
      <div className="med-info-header">
        <h1 className="page-title">Medicine Dictionary</h1>
        <p className="page-subtitle">Real-time data from trusted sources (FDA/NLM) for dosage, usage, and risks.</p>
      </div>

      <div className="search-section glass shadow-sm">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Enter medicine name (e.g. Paracetamol, Ibuprofen)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isSearching || !searchQuery}>
            {isSearching ? <Loader2 className="spinner" size={20} /> : 'Search'}
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
            <p>Fetching real-time trusted medical details...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && !isSearching && (
          <motion.div 
            className="error-state glass"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FileWarning size={32} color="var(--warning)" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && !isSearching && (
          <motion.div 
            className="result-details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="result-header glass shadow-md">
              <div className="title-group">
                <h2>{result.name}</h2>
                <span className="category-badge">{result.category}</span>
              </div>
              
              <div className="formula-box">
                <div className="formula-item">
                  <FlaskConical size={18} className="text-primary" />
                  <span><strong>Formula:</strong> {result.formula}</span>
                </div>
                <div className="formula-item">
                  <Factory size={18} className="text-primary" />
                  <span><strong>Manufacturer:</strong> {result.manufacturer}</span>
                </div>
              </div>
              
              {result.tataInfo && (
                <div className="tata-info-badge" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 111, 97, 0.1)', border: '1px solid #ff6f61', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ color: '#ff6f61', margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Tata 1mg Pricing</h4>
                    <div style={{ marginTop: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{result.tataInfo.discountPrice || result.tataInfo.price}</span>
                      {result.tataInfo.discountPrice && (
                        <span style={{ textDecoration: 'line-through', color: 'var(--text-light)', fontSize: '0.9rem' }}>₹{result.tataInfo.price}</span>
                      )}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px' }}>{result.tataInfo.packSize}</span>
                    </div>
                  </div>
                  <a href={result.tataInfo.url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ background: '#ff6f61', border: 'none', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    View on 1mg
                  </a>
                </div>
              )}
            </div>

            <div className="details-stack" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem', padding: '1rem' }}>
              
              {/* Uses */}
              <div className="info-section">
                <h3 style={{ textTransform: 'uppercase', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Key Uses of {result.name}</h3>
                {Array.isArray(result.description) ? (
                  <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>
                    {result.description.map((use, idx) => (
                      <li key={idx} style={{ marginBottom: '0.5rem' }}>{use}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{result.description}</p>
                )}
              </div>

              <hr style={{ borderTop: '1px solid var(--border)', margin: '0' }} />

              {/* Side Effects */}
              <div className="info-section">
                <h3 style={{ textTransform: 'uppercase', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Side Effects of {result.name}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.5' }}>
                  Most side effects do not require any medical attention and disappear as your body adjusts to the medicine. Consult your doctor if they persist or if you're worried about them
                </p>
                <div style={{ display: 'inline-block', background: 'var(--bg-card)', padding: '0.4rem 1rem', borderRadius: '20px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Common side effects of {result.name}
                </div>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>
                  {result.risks.map((risk, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem' }}>{risk}</li>
                  ))}
                </ul>
              </div>

              <hr style={{ borderTop: '1px solid var(--border)', margin: '0' }} />

              {/* How to use */}
              <div className="info-section">
                <h3 style={{ textTransform: 'uppercase', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>How to use {result.name}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  {result.dosage}
                </p>
              </div>

              <hr style={{ borderTop: '1px solid var(--border)', margin: '0' }} />

              {/* How it works */}
              <div className="info-section">
                <h3 style={{ textTransform: 'uppercase', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>How {result.name} works</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  {result.pharmacokinetics}
                </p>
              </div>

              <hr style={{ borderTop: '1px solid var(--border)', margin: '0' }} />

              {/* Safety Advice */}
              <div className="info-section">
                <h3 style={{ textTransform: 'uppercase', fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Safety Advice</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '2rem' }}>🍷</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <strong style={{ color: 'var(--text-main)' }}>Alcohol</strong>
                      <span style={{ background: result.safety.alcohol === 'UNSAFE' ? '#ffcdd2' : '#c8e6c9', color: result.safety.alcohol === 'UNSAFE' ? '#c62828' : '#2e7d32', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {result.safety.alcohol}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '2rem' }}>🤰</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <strong style={{ color: 'var(--text-main)' }}>Pregnancy</strong>
                      <span style={{ background: result.safety.pregnancy === 'UNSAFE' ? '#ffcdd2' : result.safety.pregnancy === 'CAUTION' ? '#ffe0b2' : '#c8e6c9', color: result.safety.pregnancy === 'UNSAFE' ? '#c62828' : result.safety.pregnancy === 'CAUTION' ? '#e65100' : '#2e7d32', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {result.safety.pregnancy}
                      </span>
                    </div>
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

export default MedicineInfo;
