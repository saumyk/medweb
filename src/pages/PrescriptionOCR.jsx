import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, FileText, CheckCircle, AlertCircle, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { useLanguage } from '../components/LanguageContext';
import './PrescriptionOCR.css';

const KNOWN_DRUGS = [
  "paracetamol", "dolo", "crocin", "calpol", "cetirizine", "allegra", "augmentin",
  "pantop", "pan", "ibuprofen", "amoxicillin", "fexofenadine", "pantoprazole", "omeprazole",
  "aspirin", "acetaminophen", "penicillin", "metformin", "atorvastatin", "albuterol",
  "lisinopril", "gabapentin", "sildenafil", "levothyroxine", "losartan", "lipitor",
  "xanax", "vicodin", "zithromax", "synthroid", "nexium", "plavix", "singulair",
  "crestor", "advil", "tylenol", "insulin", "combiflam", "becosules", "saridon"
];

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
    setStatusText(t('ocrInit'));
    setHasScanned(false);

    try {
      const result = await Tesseract.recognize(
        image,
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
      const parsedMeds = parseMedicines(text);
      setIdentifiedMeds(parsedMeds);
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
    const words = text.toLowerCase().split(/[\s,?.!\n()[\]]+/);
    const found = new Set();
    
    words.forEach(word => {
      if (word.length < 3) return;
      
      KNOWN_DRUGS.forEach(drug => {
        // Direct matching or exact substring matching to capture common forms (e.g. Dolo-650 matches Dolo)
        if (word.includes(drug) || drug.includes(word)) {
          found.add(drug);
        }
      });
    });

    return Array.from(found).map(drugName => {
      // Capitalize first letter
      return drugName.charAt(0).toUpperCase() + drugName.slice(1);
    });
  };

  const resetScanner = () => {
    setImage(null);
    setPreviewUrl(null);
    setRawText('');
    setIdentifiedMeds([]);
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
                  
                  {identifiedMeds.length === 0 ? (
                    <div className="no-meds-alert">
                      <AlertCircle className="text-warning" size={24} />
                      <p>{t('ocrNoMeds')}</p>
                    </div>
                  ) : (
                    <div className="meds-list-grid">
                      {identifiedMeds.map((med, idx) => (
                        <motion.div 
                          key={med}
                          className="med-match-chip glass"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.08 }}
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
