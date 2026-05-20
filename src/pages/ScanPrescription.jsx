import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import Tesseract from 'tesseract.js';
import './ScanPrescription.css';

const ScanPrescription = () => {
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    setFile(selectedFile);
    performRealScan(selectedFile);
  };

  const performRealScan = async (scanFile) => {
    setIsScanning(true);
    
    try {
      const ocrResult = await Tesseract.recognize(scanFile, 'eng');
      const text = ocrResult.data.text;
      
      const ignoreWords = ['tablet', 'tablets', 'capsule', 'capsules', 'syrup', 'mg', 'ml', 'take', 'daily', 'the', 'and', 'with', 'for', 'keep', 'out', 'reach', 'children'];

      // Extract alphanumeric words that look like medicine names (>=3 chars)
      const words = text.split(/[\s\n]+/)
                        .map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase())
                        .filter(w => w.length >= 3 && !ignoreWords.includes(w));
                        
      // Grab up to 3 distinct valid words to display
      const uniqueWords = [...new Set(words)].slice(0, 3);
      
      if (uniqueWords.length > 0) {
        const parsedResults = uniqueWords.map((word, index) => {
          const formattedName = word.charAt(0).toUpperCase() + word.slice(1);
          return {
            id: index + 1,
            nameEn: formattedName,
            nameHi: "दवा",
            purposeEn: "Scanned from photo",
            purposeHi: "फोटो से स्कैन किया गया",
            dosage: "Please consult doctor",
          };
        });
        setResults(parsedResults);
      } else {
        setResults([{
          id: 1,
          nameEn: "We can't scan some medicines from the image.",
          nameHi: "कोई दवा नहीं मिली",
          purposeEn: "You can search manually next",
          purposeHi: "आप इसे मैन्युअली खोज सकते हैं",
          dosage: "-",
        }]);
      }
    } catch (err) {
      console.error(err);
      setResults([{
        id: 1,
        nameEn: "We can't scan some medicines from the image.",
        nameHi: "त्रुटि",
        purposeEn: "You can search manually next",
        purposeHi: "स्कैन विफल",
        dosage: "-",
      }]);
    } finally {
      setIsScanning(false);
    }
  };

  const resetScan = () => {
    setFile(null);
    setResults(null);
  };

  return (
    <div className="scan-container container">
      <div className="scan-header">
        <h1 className="scan-title">Scan Prescription</h1>
        <p className="scan-subtitle">Upload your doctor's handwritten note and let AI do the rest.</p>
      </div>

      <div className="scan-content">
        {!file && (
          <motion.div 
            className="upload-zone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileInput} 
              accept="image/*,.pdf" 
              style={{ display: 'none' }} 
            />
            <div className="upload-icon-wrapper">
              <UploadCloud size={48} className="upload-icon" />
            </div>
            <h3>Drag & Drop your prescription</h3>
            <p>or click to browse from your device</p>
            <span className="upload-hint">Supports JPG, PNG, PDF (Max 10MB)</span>
          </motion.div>
        )}

        <AnimatePresence>
          {isScanning && (
            <motion.div 
              className="scanning-state glass shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="scanner-animation-wrapper">
                <div className="doc-preview"></div>
                <div className="laser-line"></div>
              </div>
              <div className="scanning-text">
                <Loader2 className="spinner" size={24} />
                <h2>Analyzing Prescription...</h2>
                <p>Decoding handwriting and identifying medications.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {results && !isScanning && (
            <motion.div 
              className="results-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="results-header">
                <div className="success-badge">
                  <CheckCircle2 size={20} />
                  <span>Scan Complete</span>
                </div>
                <button onClick={resetScan} className="btn btn-outline">Scan Another</button>
              </div>

              <div className="medication-list">
                {results.map((med, index) => (
                  <motion.div 
                    key={med.id} 
                    className="med-card shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="med-info">
                      <div className="med-names">
                        <h4>{med.nameEn}</h4>
                        <span className="med-hi">{med.nameHi}</span>
                      </div>
                      <div className="med-purposes">
                        <div className="purpose-en badge-blue">{med.purposeEn}</div>
                        <div className="purpose-hi">{med.purposeHi}</div>
                      </div>
                    </div>
                    <div className="med-dosage">
                      <strong>Dosage:</strong> {med.dosage}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="actions-footer">
                <button className="btn btn-primary btn-full">
                  Save to Medical History
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ScanPrescription;
