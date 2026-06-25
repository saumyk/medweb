import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, FileText, CheckCircle, AlertCircle, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { useLanguage } from '../components/LanguageContext';
import './PrescriptionOCR.css';

const KNOWN_DRUGS = [
  // Painkillers & Anti-inflammatories
  "paracetamol", "dolo", "crocin", "calpol", "acetaminophen", "ibuprofen", "aspirin", 
  "combiflam", "saridon", "disprin", "naproxen", "diclofenac", "aceclofenac", "voveran", 
  "ultramcet", "vicodin", "advil", "tylenol", "pcm",
  
  // Antibiotics, Antivirals & Antifungals
  "amoxicillin", "augmentin", "azithromycin", "zithromax", "ciprofloxacin", "ciplox", 
  "levofloxacin", "doxycycline", "cephalexin", "metronidazole", "flagyl", "ofloxacin", 
  "cefixime", "taxim", "penicillin", "amox",
  
  // Anti-allergies, Cough & Cold
  "cetirizine", "okacet", "allegra", "fexofenadine", "levocetirizine", "montelukast", 
  "montair", "loratadine", "claritin", "avil", "pheniramine", "cheston", "singulair",
  
  // Gastrointestinal & Acidity
  "pantoprazole", "pantocid", "pantop", "pan-d", "pan", "omeprazole", "omez", "ranitidine", 
  "aciloc", "zantac", "famotidine", "rabeprazole", "rabicip", "esomeprazole", "nexium", "digene", "sucrafil",
  
  // Heart, BP & Cholesterol
  "lisinopril", "amlodipine", "amtas", "stamlo", "losartan", "telmisartan", "telma", "concor",
  "atorvastatin", "lipitor", "atorva", "rosuvastatin", "crestor", "clopidogrel", "metoprolol", "propranolol",
  "plavix",
  
  // Diabetes
  "metformin", "glycomet", "glimepiride", "insulin", "sitagliptin", "januvia", "gliclazide",
  
  // Vitamins & Supplements
  "becosules", "cobadex", "zincovit", "limcee", "calcium", "neurobion", "folic acid",
  
  // Hormones & Thyroid
  "levothyroxine", "thyronorm", "synthroid", "progesterone",
  
  // Central Nervous System & Anxiety
  "gabapentin", "xanax", "alprazolam", "diazepam", "valium", "clonazepam", "clonotril", "sertraline",
  
  // Respiratory
  "albuterol", "salbutamol", "asthelin", "seroflo", "duolin",
  
  // Steroids & Misc
  "prednisolone", "dexona", "dexamethasone", "sildenafil", "viagra", "deflazacort"
];

const levenshteinDistance = (s, t) => {
  if (!s || !t) return 99;
  const m = s.length;
  const n = t.length;
  const d = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return d[m][n];
};

const preprocessImage = (imageFile) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(imageFile);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      
      // Convert to grayscale and boost contrast
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Boost contrast by stretching values
        const factor = 1.35;
        let finalVal = factor * (gray - 128) + 128;
        finalVal = Math.max(0, Math.min(255, finalVal));
        
        data[i] = finalVal;
        data[i + 1] = finalVal;
        data[i + 2] = finalVal;
      }
      
      ctx.putImageData(imgData, 0, 0);
      
      canvas.toBlob((blob) => {
        resolve(blob || imageFile);
      }, 'image/jpeg', 0.9);
    };
    img.onerror = () => {
      resolve(imageFile);
    };
  });
};

const PrescriptionOCR = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [rawText, setRawText] = useState('');
  const [identifiedMeds, setIdentifiedMeds] = useState([]);
  const [unverifiedMeds, setUnverifiedMeds] = useState([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file (PNG, JPG, or JPEG).");
      return;
    }
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRawText('');
    setIdentifiedMeds([]);
    setUnverifiedMeds([]);
    setHasScanned(false);
    setProgress(0);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const runOCR = async () => {
    if (!image) return;
    
    setIsProcessing(true);
    setProgress(0);
    setStatusText("Preprocessing image for better accuracy...");
    setHasScanned(false);

    try {
      const preprocessedBlob = await preprocessImage(image);
      setStatusText(t('ocrInit'));
      
      const result = await Tesseract.recognize(
        preprocessedBlob,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
              setStatusText(`${t('ocrProgress')} (${Math.round(m.progress * 100)}%)`);
            } else {
              setStatusText(t('ocrInit'));
            }
          }
        }
      );

      const text = result.data.text;
      setRawText(text);
      
      // Parse medicines from text
      const { identified, unverified } = parseMedicines(text);
      setIdentifiedMeds(identified);
      setUnverifiedMeds(unverified);
      setHasScanned(true);
      setProgress(100);
      setStatusText(t('ocrSuccess'));
    } catch (err) {
      console.error("OCR operation failed:", err);
      setStatusText("Failed to process image. Try a clearer photo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const parseMedicines = (text) => {
    const identified = new Set();
    const otherDetected = new Set();
    
    // 1. Identify known drugs using fuzzy Levenshtein matching
    const words = text.toLowerCase().split(/[^a-z0-9-]+/);
    words.forEach(word => {
      let cleanWord = word.trim().replace(/^-+|-+$/g, '');
      if (cleanWord.length < 3) return;
      
      cleanWord = cleanWord.replace(/(?:500|650|100|250|50|20|10|5|mg|ml|mcg|g)$/, '').replace(/-$/, '');
      if (cleanWord.length < 3) return;

      KNOWN_DRUGS.forEach(drug => {
        if (cleanWord.includes(drug) || drug.includes(cleanWord)) {
          identified.add(drug);
          return;
        }
        
        const distance = levenshteinDistance(cleanWord, drug);
        const threshold = drug.length <= 5 ? 1 : (drug.length <= 8 ? 2 : 3);
        
        if (distance <= threshold) {
          identified.add(drug);
        }
      });
    });

    // 2. Identify other potential drug names using line patterns & capital letter words
    const lines = text.split('\n');
    lines.forEach(line => {
      // Look for capitalized words (e.g. "Tab Dolo", "Rx Amoxicillin")
      const matches = line.match(/\b(Tab|Cap|Syr|Inj|Rx)?\.?\s*([A-Z][a-zA-Z0-9-]{3,15})\b/g);
      if (matches) {
        matches.forEach(match => {
          const namePart = match.replace(/^(?:Tab|Cap|Syr|Inj|Rx)?\.?\s*/i, '').trim();
          if (namePart.length >= 4) {
            let cleanedName = namePart.replace(/(?:500|650|100|250|50|20|10|5|mg|ml|mcg|g)$/i, '').replace(/-$/, '');
            if (cleanedName.length >= 4) {
              const lowerClean = cleanedName.toLowerCase();
              let isKnown = false;
              identified.forEach(known => {
                if (lowerClean.includes(known) || known.includes(lowerClean)) {
                  isKnown = true;
                }
              });
              
              // Filter out common instructions, headers, or metadata words
              const commonWords = [
                "tab", "tablet", "cap", "capsule", "syr", "syrup", "daily", "twice", "thrice", "morning", "noon",
                "night", "after", "food", "before", "take", "dose", "days", "weeks", "patient", "doctor", "name",
                "date", "signature", "hospital", "clinic", "medical", "prescription", "pharmacy", "history"
              ];
              if (!isKnown && !commonWords.includes(lowerClean)) {
                otherDetected.add(cleanedName);
              }
            }
          }
        });
      }
    });

    return {
      identified: Array.from(identified).map(drugName => {
        return drugName.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('-');
      }),
      unverified: Array.from(otherDetected).map(name => {
        return name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('-');
      })
    };
  };

  const resetScanner = () => {
    setImage(null);
    setPreviewUrl(null);
    setRawText('');
    setIdentifiedMeds([]);
    setUnverifiedMeds([]);
    setHasScanned(false);
    setProgress(0);
    setStatusText('');
  };

  return (
    <div className="ocr-container container">
      <div className="ocr-header text-center">
        <h1 className="page-title">{t('ocrTitle')}</h1>
        <p className="page-subtitle">{t('ocrSubtitle')}</p>
      </div>

      <div className="ocr-content-grid">
        {/* Upload & Scanning Card */}
        <div className="ocr-card-wrapper glass shadow-md">
          {!previewUrl ? (
            <div 
              className={`drag-drop-zone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <Upload className="upload-icon" size={48} />
              <h3>{t('dragDrop')}</h3>
              <p>{t('supportedFormats')}</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="preview-scan-zone">
              <div className="preview-image-wrapper glass">
                <img src={previewUrl} alt="Prescription preview" className="prescription-preview-img" />
                {isProcessing && <div className="scanner-laser-line"></div>}
              </div>
              
              <div className="scan-actions-panel">
                {!isProcessing && !hasScanned && (
                  <button className="btn btn-primary btn-lg scan-btn" onClick={runOCR}>
                    <Camera size={20} />
                    Scan Prescription
                  </button>
                )}
                
                {isProcessing && (
                  <div className="scan-progress-wrapper">
                    <div className="progress-info">
                      <span className="status-label">
                        <Loader2 className="spinner" size={16} />
                        {statusText}
                      </span>
                      <span className="pct">{progress}%</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )}

                {hasScanned && (
                  <div className="scanned-actions">
                    <div className="success-alert">
                      <CheckCircle className="text-success" size={20} />
                      <span>{t('ocrSuccess')}</span>
                    </div>
                    <button className="btn btn-outline reset-btn" onClick={resetScanner}>
                      <RefreshCw size={18} />
                      Scan New Photo
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="ocr-results-wrapper">
          <AnimatePresence mode="wait">
            {!hasScanned && !isProcessing && (
              <motion.div 
                className="results-placeholder glass shadow-md text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="placeholder"
              >
                <FileText className="doc-icon" size={48} />
                <h3>Waiting for Scan</h3>
                <p>Upload a prescription image on the left and click Scan to extract medicine info.</p>
              </motion.div>
            )}

            {isProcessing && (
              <motion.div 
                className="results-placeholder glass shadow-md text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="loading-placeholder"
              >
                <Loader2 className="spinner large text-primary" size={48} />
                <h3>Analyzing Prescription Text</h3>
                <p>Using Tesseract neural network to scan medical terms and detect prescriptions.</p>
              </motion.div>
            )}

            {hasScanned && (
              <motion.div 
                className="results-active-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key="results"
              >
                {/* Medicines Found section */}
                <div className="ocr-results-card glass shadow-md">
                  <h2>{t('ocrMedsFound')}</h2>
                  
                  {identifiedMeds.length === 0 && unverifiedMeds.length === 0 ? (
                    <div className="no-meds-alert">
                      <AlertCircle className="text-warning" size={24} />
                      <p>{t('ocrNoMeds')}</p>
                    </div>
                  ) : (
                    <div className="ocr-results-lists-wrapper">
                      {identifiedMeds.length > 0 && (
                        <div className="results-section">
                          <h3 className="section-subtitle">Verified Drug Matches</h3>
                          <div className="meds-list-grid">
                            {identifiedMeds.map((med, idx) => (
                              <motion.div 
                                key={med}
                                className="med-match-chip glass verified"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                              >
                                <div className="med-match-info">
                                  <span className="pill-dot">💊</span>
                                  <h4>{med}</h4>
                                </div>
                                <button 
                                  className="btn btn-primary btn-sm view-info-btn"
                                  onClick={() => navigate(`/medicine?search=${encodeURIComponent(med)}`)}
                                >
                                  <span>{t('ocrViewClinicalInfo')}</span>
                                  <ArrowRight size={14} />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {unverifiedMeds.length > 0 && (
                        <div className="results-section" style={{ marginTop: '1.5rem' }}>
                          <h3 className="section-subtitle">Other Extracted Terms</h3>
                          <p className="section-help-text" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                            These terms were detected in the prescription but didn't match our database. You can still search for them.
                          </p>
                          <div className="meds-list-grid">
                            {unverifiedMeds.map((med, idx) => (
                              <motion.div 
                                key={med}
                                className="med-match-chip glass unverified"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: (identifiedMeds.length + idx) * 0.05 }}
                              >
                                <div className="med-match-info">
                                  <span className="pill-dot">❓</span>
                                  <h4>{med}</h4>
                                </div>
                                <button 
                                  className="btn btn-outline btn-sm view-info-btn"
                                  onClick={() => navigate(`/medicine?search=${encodeURIComponent(med)}`)}
                                >
                                  <span>Search Info</span>
                                  <ArrowRight size={14} />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Raw Text Inspector */}
                <div className="raw-text-card glass shadow-md">
                  <h3>🔍 {t('rawText')}</h3>
                  <div className="raw-text-display">
                    {rawText.split('\n').map((line, i) => (
                      <p key={i}>{line || '\u00A0'}</p>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionOCR;
