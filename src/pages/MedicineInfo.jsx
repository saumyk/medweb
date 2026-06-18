import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, FileWarning, FlaskConical, Factory, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../components/LanguageContext';
import './MedicineInfo.css';

const getMedCareInstructions = (query) => {
  const raw = query.toLowerCase().trim();
  let selfCare;
  let seekHelp;

  if (raw.includes("acetaminophen") || raw.includes("paracetamol") || raw.includes("dolo") || raw.includes("crocin") || raw.includes("calpol") || raw.includes("ibuprofen")) {
    selfCare = [
      "Drink plenty of fluids to avoid dehydration from fever.",
      "Get adequate bed rest to help your body recover.",
      "Avoid alcohol as it increases liver risk when combined with acetaminophen.",
      "Check labels of other cold medications to avoid double-dosing on pain relievers."
    ];
    seekHelp = "Consult a doctor immediately if you develop skin rashes, swelling of the face/mouth, yellowing of skin/eyes (jaundice), or severe stomach pain.";
  } else if (raw.includes("amoxicillin") || raw.includes("augmentin") || raw.includes("antibiotic")) {
    selfCare = [
      "Complete the entire prescribed course of antibiotics, even if you feel better.",
      "Take with food if the medicine causes stomach upset.",
      "Consider taking probiotics to help replenish healthy gut flora.",
      "Stay well-hydrated throughout the day."
    ];
    seekHelp = "Seek immediate medical help if you experience breathing difficulties, severe hives/itching, facial swelling, or severe watery diarrhea with stomach cramps.";
  } else if (raw.includes("pantop") || raw.includes("pan") || raw.includes("omeprazole") || raw.includes("acid")) {
    selfCare = [
      "Eat smaller, more frequent meals rather than large heavy dishes.",
      "Avoid eating close to bedtime (within 2-3 hours).",
      "Limit trigger substances like caffeine, spicy foods, and carbonated beverages.",
      "Do not lie down immediately after eating."
    ];
    seekHelp = "Consult a doctor if you experience difficulty swallowing, unexplained weight loss, vomiting blood, black stools, or severe chest pain.";
  } else if (raw.includes("cetirizine") || raw.includes("allegra") || raw.includes("allergy") || raw.includes("fexofenadine")) {
    selfCare = [
      "Take the medication at night if it causes drowsiness.",
      "Avoid alcohol or other sedatives while taking antihistamines.",
      "Use saline nasal sprays for natural congestion relief.",
      "Keep windows closed during high-pollen seasons."
    ];
    seekHelp = "Seek medical help if you develop signs of an allergic reaction (hives, difficulty breathing, swelling of your face, lips, tongue, or throat), or if your symptoms worsen.";
  } else {
    selfCare = [
      "Take the medication exactly as prescribed by your physician.",
      "Do not skip doses or change the schedule without consulting your doctor.",
      "Keep a list of all current medications to share with your healthcare provider.",
      "Store the medication in a cool, dry place away from direct sunlight."
    ];
    seekHelp = "Seek medical help if you develop signs of an allergic reaction (hives, difficulty breathing, swelling of your face, lips, tongue, or throat), or if your underlying symptoms worsen.";
  }

  return { selfCare, seekHelp };
};

// Helper function to fetch with a timeout using AbortController
const fetchWithTimeout = (url, timeoutMs) => {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error("Timeout"));
    }, timeoutMs);

    fetch(url, { signal: controller.signal })
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

const MedicineInfo = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
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
    const encodedFda = encodeURIComponent(fdaQuery);

    try {
      // URLs for parallel fetch
      const tataUrl = encodeURIComponent(`https://www.1mg.com/api/v1/search/autocomplete?name=${query}`);
      const tataProxyUrl = `https://api.allorigins.win/get?url=${tataUrl}`;

      const fdaUrls = [
        `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodedFda}"&limit=1`,
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodedFda}"&limit=1`,
        `https://api.fda.gov/drug/label.json?search=openfda.substance_name:"${encodedFda}"&limit=1`,
        `https://api.fda.gov/drug/label.json?search="${encodedFda}"&limit=1`
      ];

      // 1. Fetch Indian Pricing from Tata 1mg (via proxy) in parallel with 1500ms timeout
      const fetchTataPromise = fetchWithTimeout(tataProxyUrl, 1500)
        .then(async (res) => {
          if (res.ok) {
             const proxyData = await res.json();
             if (proxyData.contents) {
               const tataData = JSON.parse(proxyData.contents);
               const drug = tataData.results?.find(r => r.type === 'drug' && r.price);
               if (drug) {
                  return {
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
          return null;
        })
        .catch(err => {
          console.warn("Tata 1mg fetch failed or timed out:", err);
          return null;
        });

      // 2. Fetch FDA configurations in parallel to get first matching category
      const fetchFdaPromises = fdaUrls.map((url, idx) => 
        fetch(url)
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              if (data.results && data.results.length > 0) {
                return { data: data.results[0], index: idx };
              }
            }
            return null;
          })
          .catch(() => null)
      );

      // Resolve both Tata and FDA requests concurrently
      const [tataInfo, ...fdaResults] = await Promise.all([
        fetchTataPromise,
        ...fetchFdaPromises
      ]);

      // Prioritize the best matching FDA result based on search index
      let med = null;
      for (const fdaRes of fdaResults) {
        if (fdaRes) {
          med = fdaRes.data;
          break;
        }
      }
      
      if (med) {
        const care = getMedCareInstructions(fdaQuery);
        
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
          },
          selfCare: care.selfCare,
          seekHelp: care.seekHelp
        });
        setIsSearching(false);
        return;
      }

      // 3. Ultimate Fallback to Wikipedia API
      const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        if (wikiData.title && wikiData.extract && !wikiData.extract.includes("may refer to")) {
          const care = getMedCareInstructions(query);
          
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
            },
            selfCare: care.selfCare,
            seekHelp: care.seekHelp
          });
          setIsSearching(false);
          return;
        }
      }

      throw new Error("Medicine not found");
    } catch (err) {
      console.error(err);
      setError(`We couldn't find detailed trusted information for "${query}". Please check the spelling or consult a healthcare professional.`);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const searchVal = searchParams.get('search');
    if (searchVal) {
      const timer = setTimeout(() => {
        setSearchQuery(searchVal);
        fetchMedicineData(searchVal);
      }, 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="med-info-container container">
      <div className="med-info-header">
        <h1 className="page-title">{t('medTitle')}</h1>
        <p className="page-subtitle">{t('medSubtitle')}</p>
      </div>

      <div className="search-section glass shadow-sm">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder={t('medInputPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isSearching || !searchQuery}>
            {isSearching ? <Loader2 className="spinner" size={20} /> : t('search')}
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
            <p>{t('searchingMed')}</p>
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
                  <span><strong>{t('medFormula')}</strong> {result.formula}</span>
                </div>
                <div className="formula-item">
                  <Factory size={18} className="text-primary" />
                  <span><strong>{t('medManufacturer')}</strong> {result.manufacturer}</span>
                </div>
              </div>
              
              {result.tataInfo && (
                <div className="tata-info-badge">
                  <div className="tata-details-column">
                    <h4 className="tata-badge-title">Tata 1mg Pricing</h4>
                    <div className="tata-price-row">
                      <span className="tata-current-price">₹{result.tataInfo.discountPrice || result.tataInfo.price}</span>
                      {result.tataInfo.discountPrice && (
                        <span className="tata-original-price">₹{result.tataInfo.price}</span>
                      )}
                      <span className="tata-pack-label">{result.tataInfo.packSize}</span>
                    </div>
                  </div>
                  <a href={result.tataInfo.url} target="_blank" rel="noreferrer" className="btn btn-primary tata-view-btn">
                    View on 1mg
                  </a>
                </div>
              )}
            </div>


            <div className="details-stack">
              
              {/* Uses */}
              <div className="info-section">
                <h3 className="info-section-title">{t('medDescription')}</h3>
                {Array.isArray(result.description) ? (
                  <ul className="uses-list">
                    {result.description.map((use, idx) => (
                      <li key={idx}>{use}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="uses-text">{result.description}</p>
                )}
              </div>

              <hr className="section-divider" />

              {/* Side Effects */}
              <div className="info-section">
                <h3 className="info-section-title">{t('medRisks')}</h3>
                <p className="side-effects-intro">
                  Most side effects do not require any medical attention and disappear as your body adjusts to the medicine. Consult your doctor if they persist or if you're worried about them.
                </p>
                <div className="side-effects-pill">
                  Common side effects of {result.name}
                </div>
                <ul className="side-effects-list">
                  {result.risks.map((risk, idx) => (
                    <li key={idx}>{risk}</li>
                  ))}
                </ul>
              </div>

              <hr className="section-divider" />

              {/* How to use */}
              <div className="info-section">
                <h3 className="info-section-title">{t('medDosage')}</h3>
                <p className="dosage-text">
                  {result.dosage}
                </p>
              </div>

              <hr className="section-divider" />

              {/* How it works */}
              <div className="info-section">
                <h3 className="info-section-title">How {result.name} works</h3>
                <p className="pharmacokinetics-text">
                  {result.pharmacokinetics}
                </p>
              </div>

              <hr className="section-divider" />

              {/* Recovery Self-Care Steps */}
              <div className="info-section">
                <h3 className="info-section-title">Self-Care Steps During Treatment</h3>
                <p className="side-effects-intro">
                  Follow these healthy habits and precautions to aid your recovery while taking {result.name}:
                </p>
                <ul className="uses-list">
                  {result.selfCare.map((step, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem' }}>{step}</li>
                  ))}
                </ul>
              </div>

              <hr className="section-divider" />

              {/* When to Seek Help Warning */}
              <div className="info-section">
                <h3 className="info-section-title danger-header">{t('whenSeekHelp')}</h3>
                <div className="warning-box-medicine">
                  <ShieldAlert size={20} className="warning-icon-medicine" />
                  <div className="warning-text-medicine">
                    <strong>Critical Warning Signs:</strong>
                    <p>{result.seekHelp}</p>
                  </div>
                </div>
              </div>

              <hr className="section-divider" />

              {/* Safety Advice */}
              <div className="info-section">
                <h3 className="info-section-title">{t('medSafety')}</h3>
                
                <div className="safety-advice-list">
                  <div className="safety-advice-item">
                    <div className="safety-icon-wrapper">🍷</div>
                    <div className="safety-label-wrapper">
                      <strong className="safety-substance-name">{t('alcoholSafety')}</strong>
                      <span className={`safety-status-badge status-${result.safety.alcohol.toLowerCase()}`}>
                        {result.safety.alcohol}
                      </span>
                    </div>
                  </div>

                  <div className="safety-advice-item">
                    <div className="safety-icon-wrapper">🤰</div>
                    <div className="safety-label-wrapper">
                      <strong className="safety-substance-name">{t('pregnancySafety')}</strong>
                      <span className={`safety-status-badge status-${result.safety.pregnancy.toLowerCase()}`}>
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
