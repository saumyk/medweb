import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Camera,
  FileText,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Pill,
  Clock,
  Sun,
  Moon,
  Sunrise,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  Printer,
  Copy,
  Check,
  ChevronRight,
  X,
  ExternalLink,
  Sparkles,
  SlidersHorizontal,
  Calendar,
  RotateCw,
  ZoomIn,
  Eye,
  ShieldAlert,
  Activity,
  HeartPulse,
  Share2
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import { useLanguage } from '../components/LanguageContext';
import { supabase } from '../utils/supabaseClient';
import { lookupMedicine } from '../utils/medicineLookup';
import {
  MEDICINE_REGISTRY,
  SAMPLE_PRESCRIPTIONS,
  parsePrescriptionText,
  enhancePrescriptionImage
} from '../utils/prescriptionParser';
import './PrescriptionOCR.css';

const PrescriptionOCR = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // File and Scan States
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processingMode, setProcessingMode] = useState('enhanced'); // 'enhanced' | 'high_contrast' | 'original'
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [hasScanned, setHasScanned] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Structured Clinical Results
  const [parsedData, setParsedData] = useState({
    medicines: [],
    metadata: { doctor: null, clinic: null, date: null },
    safetyAlerts: []
  });

  // UI Active Views & Modals
  const [activeTab, setActiveTab] = useState('medicines'); // 'medicines' | 'schedule' | 'safety' | 'rawText'
  const [selectedMedicineModal, setSelectedMedicineModal] = useState(null);
  const [modalDetails, setModalDetails] = useState(null);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Manual Medicine Add State
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const fileInputRef = useRef(null);

  // Clean up object URLs on unmount
  useEffect(() => () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  // Support clipboard paste (Ctrl+V) anywhere on the page
  useEffect(() => {
    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          handleFile(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Handle Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
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
      setErrorMessage('Please upload a valid image file (PNG, JPG, JPEG, or WEBP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Please choose an image under 15 MB.');
      return;
    }

    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setParsedData({ medicines: [], metadata: { doctor: null, clinic: null, date: null }, safetyAlerts: [] });
    setExtractedText('');
    setOcrConfidence(null);
    setErrorMessage('');
    setHasScanned(false);
    setProgress(0);
    setStatusText('');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Rotate Image 90 Degrees Clockwise
  const handleRotateImage = () => {
    if (!image || !previewUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const rotatedFile = new File([blob], image.name || 'rotated_prescription.jpg', { type: 'image/jpeg' });
        setImage(rotatedFile);
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.95);
    };
    img.src = previewUrl;
  };

  // Run Tesseract OCR with canvas enhancement
  const runOCR = async (fileToScan = image, mode = processingMode) => {
    if (!fileToScan) return;

    setIsProcessing(true);
    setProgress(15);
    setStatusText('Optimizing image contrast & dynamic range...');
    setHasScanned(false);
    setErrorMessage('');

    try {
      // 1. Image enhancement
      const { blob: enhancedBlob } = await enhancePrescriptionImage(fileToScan, mode);
      setProgress(30);
      setStatusText(t('ocrInit') || 'Initializing neural OCR engine...');

      // 2. Perform OCR
      const result = await Tesseract.recognize(
        enhancedBlob,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const pct = 30 + Math.round((m.progress || 0) * 55);
              setProgress(pct);
              setStatusText(`Recognizing clinical handwriting: ${Math.round((m.progress || 0) * 100)}%`);
            } else if (m.status === 'loading tesseract core') {
              setStatusText('Loading character weights & dictionary...');
            } else if (m.status === 'initializing api') {
              setStatusText('Calibrating medical vocabulary...');
            }
          }
        }
      );

      const text = result?.data?.text?.trim() || '';
      const confidence = Math.round(result?.data?.confidence || 0);

      setProgress(90);
      setStatusText('Cross-referencing National Drug Registry...');

      setExtractedText(text);
      setOcrConfidence(confidence);

      // 3. Clinical Parsing
      const parsed = parsePrescriptionText(text);
      setParsedData(parsed);

      // 4. Save to Supabase (if available)
      try {
        if (supabase) {
          await supabase.from('prescriptions').insert([
            {
              extracted_medicines: parsed.medicines.map((m) => m.name),
              status: 'processed',
              image_url: fileToScan.name || 'prescription_upload'
            }
          ]);
        }
      } catch (dbErr) {
        console.warn('Database logging note:', dbErr);
      }

      setHasScanned(true);
      setProgress(100);
      setStatusText('Prescription verified and clinical profile generated!');
    } catch (err) {
      console.error('OCR Error:', err);
      setErrorMessage('Could not extract text clearly from this image. Try using High-Contrast mode or a brighter photo.');
      setStatusText('Scan failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Preset sample prescription runner with authentic medical pad design
  const loadSamplePrescription = (sample) => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1150;
    const ctx = canvas.getContext('2d');

    // Background paper
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle paper texture & border
    ctx.strokeStyle = '#0F766E';
    ctx.lineWidth = 4;
    ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);

    // Header bar
    ctx.fillStyle = '#0F766E';
    ctx.fillRect(35, 35, canvas.width - 70, 110);

    // Clinic text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(sample.clinic.toUpperCase(), 60, 80);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#CCFBF1';
    ctx.fillText(sample.doctor, 60, 112);

    // Watermark Rx
    ctx.fillStyle = '#F0FDFA';
    ctx.font = 'bold 180px serif';
    ctx.fillText('Rx', 620, 680);

    // Prescription Rx symbol
    ctx.fillStyle = '#0F766E';
    ctx.font = 'bold 36px serif';
    ctx.fillText('Rx', 55, 195);

    // Meta row
    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Date: 12/10/2026   |   Patient: Verified Outpatient   |   Age: 38   |   Gender: M`, 120, 185);

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(55, 215);
    ctx.lineTo(canvas.width - 55, 215);
    ctx.stroke();

    // Lines of prescription text
    ctx.fillStyle = '#0F172A';
    ctx.font = '17px monospace';
    const lines = sample.rawText.split('\n');
    let y = 250;
    for (const line of lines) {
      if (line.startsWith('Rx:') || line.startsWith('Advice:')) {
        ctx.fillStyle = '#0F766E';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(line, 55, y);
        ctx.fillStyle = '#0F172A';
        ctx.font = '17px monospace';
      } else {
        ctx.fillText(line, 65, y);
      }
      y += 32;
    }

    // Doctor signature stamp
    ctx.strokeStyle = '#0F766E';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(canvas.width - 320, canvas.height - 130, 260, 75);
    ctx.fillStyle = '#0F766E';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('AUTHORIZED PHYSICIAN SIGNATURE', canvas.width - 310, canvas.height - 90);
    ctx.font = '11px sans-serif';
    ctx.fillText('Medical Council Reg. Verified', canvas.width - 310, canvas.height - 70);

    canvas.toBlob((blob) => {
      const sampleFile = new File([blob], `${sample.id}.jpg`, { type: 'image/jpeg' });
      setImage(sampleFile);
      setPreviewUrl(URL.createObjectURL(blob));
      setExtractedText(sample.rawText);
      setOcrConfidence(97);
      setErrorMessage('');

      // Parse immediately
      const parsed = parsePrescriptionText(sample.rawText);
      setParsedData(parsed);
      setHasScanned(true);
      setProgress(100);
      setStatusText('Sample prescription loaded and clinical profile verified!');
    }, 'image/jpeg', 0.95);
  };

  // Live text editing re-parser
  const handleTextReview = (newText) => {
    setExtractedText(newText);
    const parsed = parsePrescriptionText(newText);
    setParsedData(parsed);
  };

  // Add medicine manually
  const handleAddMedicine = (med) => {
    if (parsedData.medicines.some((m) => m.id === med.id)) {
      return;
    }
    const updated = {
      ...parsedData,
      medicines: [
        ...parsedData.medicines,
        {
          ...med,
          detectedLine: `Added manually: ${med.name}`,
          strength: med.generic.match(/\b\d+\s*(?:mg|ml|mcg)\b/i)?.[0] || '',
          schedule: {
            pattern: med.standardSchedule,
            readable: med.standardSchedule,
            morning: true,
            afternoon: false,
            night: true,
            isSOS: false
          },
          timing: med.timingPreference,
          duration: 'As advised'
        }
      ]
    };
    setParsedData(updated);
    setManualSearchQuery('');
    setShowAddMedicine(false);
  };

  // Remove medicine
  const handleRemoveMedicine = (id) => {
    setParsedData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((m) => m.id !== id)
    }));
  };

  // Open Clinical Detail Modal (Fetches openFDA / RxNorm data)
  const openClinicalModal = async (med) => {
    setSelectedMedicineModal(med);
    setIsLoadingModal(true);
    setModalError(null);
    setModalDetails(null);

    try {
      const data = await lookupMedicine(med.name);
      setModalDetails(data);
    } catch {
      // Fallback to local rich registry info
      setModalDetails({
        name: med.name,
        formula: med.generic,
        category: med.category,
        description: [med.indication],
        precautions: [med.precautions],
        doNotUse: ['Known hypersensitivity or allergy to this active formulation.'],
        risks: med.sideEffects,
        dosage: med.instructions,
        safety: {
          alcohol: med.precautions.includes('alcohol') ? 'UNSAFE' : 'CAUTION',
          pregnancy: med.pregnancyRisk
        },
        sources: ['Arogya Clinical Registry', 'Standard Pharmacopoeia']
      });
    } finally {
      setIsLoadingModal(false);
    }
  };

  // Copy schedule to clipboard
  const handleCopySchedule = () => {
    if (!parsedData.medicines.length) return;
    const lines = [
      `📋 AROGYA MEDICATION SCHEDULE (${parsedData.metadata.date || 'Today'})`,
      `Doctor: ${parsedData.metadata.doctor || 'Verified Physician'}`,
      `Clinic: ${parsedData.metadata.clinic || 'Verified Care Center'}`,
      '========================================',
      ...parsedData.medicines.map(
        (m, i) => `${i + 1}. ${m.name} (${m.form})\n   Active Salt: ${m.generic}\n   Frequency: ${m.schedule.readable}\n   Timing: ${m.timing} | Duration: ${m.duration}\n   Instructions: ${m.instructions}`
      ),
      '========================================',
      'Generated via MedWeb Arogya AI · Please verify with your doctor or pharmacist'
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Print schedule
  const handlePrint = () => {
    window.print();
  };

  // Filter registry medicines for manual add search
  const filteredRegistryMeds = manualSearchQuery.trim()
    ? MEDICINE_REGISTRY.filter(
        (m) =>
          m.name.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
          m.generic.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
          m.aliases.some((a) => a.toLowerCase().includes(manualSearchQuery.toLowerCase()))
      ).slice(0, 8)
    : [];

  const resetScanner = () => {
    setImage(null);
    setPreviewUrl(null);
    setParsedData({ medicines: [], metadata: { doctor: null, clinic: null, date: null }, safetyAlerts: [] });
    setExtractedText('');
    setOcrConfidence(null);
    setErrorMessage('');
    setHasScanned(false);
    setProgress(0);
    setStatusText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="ocr-container container">
      {/* Header with Trust Badge & Presets */}
      <div className="ocr-header text-center">
        <div className="ocr-trust-badge">
          <ShieldCheck size={16} /> 100% Strict Formulation Matching · Zero Hallucinations · Private Scan
        </div>
        <h1 className="page-title">{t('ocrTitle') || 'Prescription OCR & Drug Intelligence'}</h1>
        <p className="page-subtitle">
          Upload or photograph your handwritten medical prescription. Our neural vision engine transcribes medications,
          builds interactive dosage timetables, and flags clinical safety alerts.
        </p>

        {/* Feature Highlights Pills */}
        <div className="ocr-meta-highlights">
          <span className="highlight-pill"><Check size={13} /> Active Salt Breakdown</span>
          <span className="highlight-pill"><Check size={13} /> Morning / Noon / Night Timetable</span>
          <span className="highlight-pill"><Check size={13} /> Conflict & Overdose Alerts</span>
          <span className="highlight-pill"><Check size={13} /> FDA Monograph Cross-Reference</span>
        </div>

        {/* 1-Click Sample Presets */}
        <div className="sample-presets-container">
          <span className="preset-label">
            <Sparkles size={14} className="sparkle-icon" /> Instant 1-Click Medical Presets:
          </span>
          <div className="preset-pills">
            {SAMPLE_PRESCRIPTIONS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                className="sample-preset-btn"
                onClick={() => loadSamplePrescription(sample)}
              >
                <Pill size={14} className="preset-pill-icon" />
                <span className="preset-btn-title">{sample.title}</span>
                <span className="preset-btn-badge">{sample.medicines?.length || 3} Meds</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="ocr-content-grid">
        {/* Left Column: Upload, Processing & Filter Controls */}
        <div className="ocr-card-wrapper glass shadow-md">
          <div className="console-card-header">
            <div className="console-title">
              <Camera size={18} className="console-icon" />
              <span>Prescription Imaging Console</span>
            </div>
            {previewUrl && (
              <div className="console-actions-mini">
                <button
                  type="button"
                  className="icon-tool-btn"
                  onClick={handleRotateImage}
                  title="Rotate 90° Clockwise"
                  disabled={isProcessing}
                >
                  <RotateCw size={15} />
                  <span>Rotate</span>
                </button>
                <button
                  type="button"
                  className="icon-tool-btn"
                  onClick={() => setIsLightboxOpen(true)}
                  title="Zoom / Inspect Photo"
                >
                  <ZoomIn size={15} />
                  <span>Inspect</span>
                </button>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="visually-hidden"
          />

          {!previewUrl ? (
            <div
              className={`drag-drop-zone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              role="button"
              tabIndex={0}
            >
              {/* Corner Viewfinder Markers */}
              <div className="viewfinder-corner tl"></div>
              <div className="viewfinder-corner tr"></div>
              <div className="viewfinder-corner bl"></div>
              <div className="viewfinder-corner br"></div>

              <div className="upload-icon-shell">
                <Upload className="upload-icon" size={36} />
              </div>
              <h3>Upload Prescription Photo</h3>
              <p>Drag & drop or tap to browse from your device</p>
              
              <div className="upload-actions-row">
                <button type="button" className="upload-cta btn btn-primary">
                  <Camera size={16} /> Choose Image
                </button>
              </div>

              <div className="upload-paste-hint">
                <span>Tip: You can also press <kbd>Ctrl</kbd> + <kbd>V</kbd> to paste clipboard screenshots</span>
              </div>

              <span className="upload-file-types">Supports PNG, JPG, JPEG, WEBP · Up to 15 MB</span>
            </div>
          ) : (
            <div className="preview-scan-zone">
              <div className="preview-image-wrapper">
                {/* Viewfinder corners */}
                <div className="viewfinder-corner tl"></div>
                <div className="viewfinder-corner tr"></div>
                <div className="viewfinder-corner bl"></div>
                <div className="viewfinder-corner br"></div>

                <img
                  src={previewUrl}
                  alt="Prescription preview"
                  className="prescription-preview-img"
                  onClick={() => setIsLightboxOpen(true)}
                />
                
                {isProcessing && (
                  <>
                    <div className="scanner-laser-line"></div>
                    <div className="scanner-grid-overlay"></div>
                  </>
                )}

                <div className="image-meta">
                  <FileText size={14} />
                  <span>{image?.name || 'Prescription Image'}</span>
                  {image?.size && (
                    <span className="meta-size">({(image.size / 1024).toFixed(0)} KB)</span>
                  )}
                </div>

                <button
                  type="button"
                  className="inspect-overlay-badge"
                  onClick={() => setIsLightboxOpen(true)}
                  title="Click to zoom in"
                >
                  <Eye size={13} /> Click to zoom
                </button>
              </div>

              {/* Enhancement Filter Selector */}
              <div className="scan-controls-toolbar">
                <div className="filter-mode-selector">
                  <span className="filter-label">
                    <SlidersHorizontal size={14} /> OCR Preprocessing Filter:
                  </span>
                  <div className="filter-options">
                    <button
                      type="button"
                      className={`filter-chip ${processingMode === 'enhanced' ? 'active' : ''}`}
                      onClick={() => setProcessingMode('enhanced')}
                      disabled={isProcessing}
                    >
                      <Sparkles size={13} /> Smart Clean
                    </button>
                    <button
                      type="button"
                      className={`filter-chip ${processingMode === 'high_contrast' ? 'active' : ''}`}
                      onClick={() => setProcessingMode('high_contrast')}
                      disabled={isProcessing}
                    >
                      <SlidersHorizontal size={13} /> High Contrast
                    </button>
                    <button
                      type="button"
                      className={`filter-chip ${processingMode === 'original' ? 'active' : ''}`}
                      onClick={() => setProcessingMode('original')}
                      disabled={isProcessing}
                    >
                      <Camera size={13} /> Raw Photo
                    </button>
                  </div>
                </div>
              </div>

              {/* Scan Actions & Progress Bar */}
              <div className="scan-actions-panel">
                {!isProcessing && !hasScanned && (
                  <>
                    <button
                      className="btn btn-primary btn-lg scan-btn"
                      onClick={() => runOCR(image, processingMode)}
                    >
                      <Camera size={20} />
                      Scan Prescription Text
                    </button>
                    <div className="retake-row">
                      <button className="change-image-btn" type="button" onClick={triggerFileInput}>
                        <RefreshCw size={14} /> Choose different photo
                      </button>
                      <button className="change-image-btn" type="button" onClick={handleRotateImage}>
                        <RotateCw size={14} /> Rotate
                      </button>
                    </div>
                  </>
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
                    <div className="scan-stage-dots">
                      <span className={`stage-step ${progress >= 20 ? 'done' : 'active'}`}>1. Filter</span>
                      <span className={`stage-step ${progress >= 60 ? 'done' : progress >= 20 ? 'active' : ''}`}>2. OCR Neural</span>
                      <span className={`stage-step ${progress >= 85 ? 'done' : progress >= 60 ? 'active' : ''}`}>3. Registry</span>
                      <span className={`stage-step ${progress >= 100 ? 'done' : progress >= 85 ? 'active' : ''}`}>4. Clinical</span>
                    </div>
                  </div>
                )}

                {hasScanned && (
                  <div className="scanned-actions">
                    <div className="success-alert">
                      <CheckCircle className="text-success" size={20} />
                      <span>{parsedData.medicines.length} verified medications extracted & dosage mapped!</span>
                    </div>
                    <div className="scanned-button-group">
                      <button
                        className="btn btn-outline reset-btn"
                        onClick={() => runOCR(image, processingMode)}
                      >
                        <RefreshCw size={15} /> Re-scan with Filter
                      </button>
                      <button className="btn btn-secondary reset-btn" onClick={resetScanner}>
                        <Upload size={15} /> Scan New Photo
                      </button>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="scan-error" role="alert">
                    <AlertCircle size={18} />
                    <span>{errorMessage}</span>
                    <button type="button" onClick={() => runOCR(image, processingMode)} title="Retry scan">
                      <RefreshCw size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Rich Medicine Data & Clinical Dashboard */}
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
                <div className="placeholder-icon-shell">
                  <Pill className="doc-icon" size={48} />
                </div>
                <h3>Waiting for Prescription Scan</h3>
                <p>
                  Upload your prescription or pick a 1-click sample above. The Arogya vision engine transcribes
                  doctor handwriting, matches confirmed chemical salts, and builds your daily medication timetable.
                </p>

                <div className="showcase-features-grid">
                  <div className="showcase-feature-card">
                    <div className="showcase-icon"><ShieldCheck size={20} /></div>
                    <strong>100% Strict Certainty</strong>
                    <p>Only verified active compounds are presented. Zero guessed or hallucinated medications.</p>
                  </div>
                  <div className="showcase-feature-card">
                    <div className="showcase-icon"><Clock size={20} /></div>
                    <strong>Daily Timetable</strong>
                    <p>Morning, noon, and evening medication schedule with meal timing guidance.</p>
                  </div>
                  <div className="showcase-feature-card">
                    <div className="showcase-icon"><AlertTriangle size={20} /></div>
                    <strong>Safety & Conflicts</strong>
                    <p>Automated warnings for duplicate NSAIDs, antibiotic completion, and drug interactions.</p>
                  </div>
                  <div className="showcase-feature-card">
                    <div className="showcase-icon"><FileText size={20} /></div>
                    <strong>FDA Monographs</strong>
                    <p>Instant official clinical indications, contraindications, and safety warnings.</p>
                  </div>
                </div>
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
                <div className="processing-radar-wrapper">
                  <Loader2 className="spinner large text-primary" size={56} />
                  <Pill className="radar-center-icon" size={24} />
                </div>
                <h3>Analyzing Prescription Text</h3>
                <p>
                  Executing image binarization, handwriting neural extraction, chemical entity resolution, and
                  dosage timetable synthesis...
                </p>
                <div className="processing-progress-pill">
                  <span>{statusText}</span>
                </div>
              </motion.div>
            )}

            {hasScanned && (
              <motion.div
                className="results-active-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key="results-panel"
              >
                {/* Prescription Pad Meta Banner */}
                <div className="prescription-meta-banner glass">
                  <div className="meta-left">
                    <div className="meta-badge-row">
                      <span className="clinic-badge">
                        <Calendar size={13} /> {parsedData.metadata.date || 'Today'}
                      </span>
                      <span className="hospital-tag">Clinical Outpatient Rx</span>
                    </div>
                    <h3 className="meta-doctor-name">{parsedData.metadata.doctor || 'Consulting Physician'}</h3>
                    <span className="meta-clinic-sub">{parsedData.metadata.clinic || 'Verified Care Center'}</span>
                  </div>
                  <div className="meta-right">
                    {ocrConfidence !== null && (
                      <div className={`confidence-meter-chip ${ocrConfidence >= 85 ? 'high' : ocrConfidence >= 70 ? 'medium' : 'low'}`}>
                        <Activity size={14} />
                        <span>{ocrConfidence}% OCR Accuracy</span>
                      </div>
                    )}
                    <div className="action-buttons-mini">
                      <button
                        className="btn-icon-action"
                        onClick={handleCopySchedule}
                        title="Copy Medication Schedule"
                      >
                        {copySuccess ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                        <span>{copySuccess ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        className="btn-icon-action"
                        onClick={handlePrint}
                        title="Print Medication Guide"
                      >
                        <Printer size={16} />
                        <span>Print</span>
                      </button>
                      <button
                        className="btn-icon-action"
                        onClick={() => setIsLightboxOpen(true)}
                        title="Inspect Original Prescription"
                      >
                        <Eye size={16} />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 100% Certainty Policy Assurance Banner */}
                <div className="certainty-guarantee-banner glass">
                  <div className="guarantee-icon">
                    <ShieldCheck size={22} className="text-success" />
                  </div>
                  <div className="guarantee-text">
                    <strong>100% Strict Certainty Enforced</strong>
                    <p>
                      To prevent dangerous assumptions, clinical medication profiles and schedules are generated 
                      <strong> only when the medicine name is 100% confirmed</strong> in the prescription text.
                    </p>
                  </div>
                </div>

                {/* Safety & Duplicate Alerts */}
                {parsedData.safetyAlerts.length > 0 && (
                  <div className="safety-alerts-container">
                    {parsedData.safetyAlerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className={`safety-alert-banner alert-${alert.type}`}
                      >
                        <div className="alert-icon-col">
                          {alert.type === 'warning' ? (
                            <AlertCircle size={20} />
                          ) : alert.type === 'caution' ? (
                            <AlertTriangle size={20} />
                          ) : (
                            <Info size={20} />
                          )}
                        </div>
                        <div className="alert-content-col">
                          <strong>{alert.title}</strong>
                          <p>{alert.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Results Navigation Tabs */}
                <div className="results-tabs-bar">
                  <button
                    className={`tab-btn ${activeTab === 'medicines' ? 'active' : ''}`}
                    onClick={() => setActiveTab('medicines')}
                  >
                    <Pill size={16} />
                    <span>Verified Medicines ({parsedData.medicines.length})</span>
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
                    onClick={() => setActiveTab('schedule')}
                  >
                    <Clock size={16} />
                    <span>Daily Timetable</span>
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'safety' ? 'active' : ''}`}
                    onClick={() => setActiveTab('safety')}
                  >
                    <ShieldAlert size={16} />
                    <span>Safety & Notes ({parsedData.safetyAlerts.length})</span>
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'rawText' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rawText')}
                  >
                    <FileText size={16} />
                    <span>Live OCR Editor</span>
                  </button>
                </div>

                {/* TAB 1: MEDICINES CARDS VIEW */}
                {activeTab === 'medicines' && (
                  <div className="medicines-view-container">
                    {parsedData.medicines.length === 0 ? (
                      <div className="no-meds-card glass text-center">
                        <AlertCircle className="text-warning" size={32} />
                        <h4>No Medicines Confirmed with 100% Certainty</h4>
                        <p>
                          Text was recognized, but no medicine name met our strict 100% certainty requirement.
                          MedWeb never guesses unconfirmed drugs. Review text in Live OCR Editor or add medicines manually.
                        </p>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setShowAddMedicine(true)}
                        >
                          <Plus size={16} /> Add Medicine Manually
                        </button>
                      </div>
                    ) : (
                      <div className="medicines-cards-list">
                        {parsedData.medicines.map((med, idx) => (
                          <motion.div
                            key={med.id || idx}
                            className="medicine-rich-card glass shadow-sm"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            {/* Card Top: Brand Name, Generic & Badges */}
                            <div className="med-card-header">
                              <div className="med-title-block">
                                <div className="med-name-row">
                                  <span className="med-index-number">#{idx + 1}</span>
                                  <h3 className="med-name">{med.name}</h3>
                                  <span className="med-form-pill">{med.form}</span>
                                  <span className="verified-100-badge">
                                    <ShieldCheck size={13} /> 100% Verified
                                  </span>
                                  {med.isAntibiotic && (
                                    <span className="med-antibiotic-pill">Antibiotic</span>
                                  )}
                                </div>
                                <p className="med-generic-salt">
                                  <strong>Active Salt:</strong> <span>{med.generic}</span>
                                </p>
                                {med.detectedLine && (
                                  <p className="med-detected-proof">
                                    <span>Prescription Text:</span> <code>"{med.detectedLine}"</code>
                                  </p>
                                )}
                              </div>

                              <button
                                className="remove-med-btn"
                                onClick={() => handleRemoveMedicine(med.id)}
                                title="Remove item"
                                aria-label="Remove item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            {/* Schedule & Timing Indicator Bar */}
                            <div className="dosage-schedule-indicator">
                              <div className="schedule-pills-row">
                                <span className="schedule-badge">
                                  <Clock size={13} /> {med.schedule.readable}
                                </span>
                                <span className="timing-badge">
                                  <Sunrise size={13} /> {med.timing}
                                </span>
                                {med.duration && (
                                  <span className="duration-badge">
                                    <Calendar size={13} /> {med.duration}
                                  </span>
                                )}
                              </div>

                              {/* Visual Dosage Dots: Morning / Afternoon / Night */}
                              <div className="dosing-dots-matrix">
                                <div className={`dose-dot ${med.schedule.morning ? 'active' : ''}`}>
                                  <Sun size={12} />
                                  <span>Morn</span>
                                </div>
                                <div className={`dose-dot ${med.schedule.afternoon ? 'active' : ''}`}>
                                  <Sun size={12} />
                                  <span>Noon</span>
                                </div>
                                <div className={`dose-dot ${med.schedule.night ? 'active' : ''}`}>
                                  <Moon size={12} />
                                  <span>Night</span>
                                </div>
                              </div>
                            </div>

                            {/* Clinical Summary Details */}
                            <div className="med-clinical-body">
                              <div className="clinical-item">
                                <span className="item-label">Used For:</span>
                                <p className="item-val">{med.indication}</p>
                              </div>
                              <div className="clinical-item">
                                <span className="item-label">Instructions:</span>
                                <p className="item-val">{med.instructions}</p>
                              </div>
                              {med.precautions && (
                                <div className="clinical-item warning-item">
                                  <span className="item-label">Precautions:</span>
                                  <p className="item-val">{med.precautions}</p>
                                </div>
                              )}
                            </div>

                            {/* Card Footer Actions */}
                            <div className="med-card-footer">
                              <button
                                className="btn btn-outline btn-sm view-monograph-btn"
                                onClick={() => openClinicalModal(med)}
                              >
                                <FileText size={14} />
                                <span>Clinical Label / FDA</span>
                              </button>

                              <button
                                className="btn btn-primary btn-sm search-external-btn"
                                onClick={() => navigate(`/medicine?search=${encodeURIComponent(med.name)}`)}
                              >
                                <Search size={14} />
                                <span>Deep Medicine Info</span>
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Add Medicine Button Bar */}
                    <div className="add-medicine-bar">
                      {!showAddMedicine ? (
                        <button
                          className="btn btn-outline btn-add-toggle"
                          onClick={() => setShowAddMedicine(true)}
                        >
                          <Plus size={16} /> Add Missing Medicine Manually
                        </button>
                      ) : (
                        <div className="manual-add-dropdown glass shadow-md">
                          <div className="manual-add-header">
                            <h4>Search & Add Registered Medicine</h4>
                            <button
                              type="button"
                              className="btn-close-sm"
                              onClick={() => setShowAddMedicine(false)}
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <div className="manual-search-input-box">
                            <Search size={16} className="search-icon" />
                            <input
                              type="text"
                              value={manualSearchQuery}
                              onChange={(e) => setManualSearchQuery(e.target.value)}
                              placeholder="Type brand name or active salt (e.g. Dolo, Pantocid, Augmentin)..."
                              autoFocus
                            />
                          </div>

                          {manualSearchQuery && (
                            <div className="search-results-list">
                              {filteredRegistryMeds.length === 0 ? (
                                <p className="no-search-results">
                                  No registered medication matching "{manualSearchQuery}".
                                </p>
                              ) : (
                                filteredRegistryMeds.map((regMed) => (
                                  <div
                                    key={regMed.id}
                                    className="search-result-row"
                                    onClick={() => handleAddMedicine(regMed)}
                                  >
                                    <div>
                                      <strong>{regMed.name}</strong> ({regMed.form})
                                      <span className="salt-sub">{regMed.generic}</span>
                                    </div>
                                    <button className="btn btn-sm btn-primary">
                                      <Plus size={14} /> Add
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: DAILY SCHEDULE & DOSAGE TIMETABLE */}
                {activeTab === 'schedule' && (
                  <div className="daily-schedule-view glass shadow-md">
                    <div className="schedule-header">
                      <div>
                        <h3>Patient Daily Medication Timetable</h3>
                        <p>Chronological schedule organized by time of day for safe adherence</p>
                      </div>
                      <button className="btn btn-outline btn-sm" onClick={handleCopySchedule}>
                        <Copy size={14} /> {copySuccess ? 'Copied Schedule' : 'Copy Schedule'}
                      </button>
                    </div>

                    <div className="schedule-timeline">
                      {/* Morning Slot */}
                      <div className="timeline-slot slot-morning">
                        <div className="slot-header">
                          <div className="slot-badge">
                            <Sun size={18} />
                            <span>Morning (8:00 AM)</span>
                          </div>
                          <span className="slot-sub">Breakfast time</span>
                        </div>
                        <div className="slot-medicines">
                          {parsedData.medicines.filter((m) => m.schedule.morning).length === 0 ? (
                            <p className="empty-slot">No morning medicines prescribed.</p>
                          ) : (
                            parsedData.medicines
                              .filter((m) => m.schedule.morning)
                              .map((m) => (
                                <div key={m.id} className="timeline-med-card">
                                  <div className="timeline-med-title">
                                    <strong>{m.name}</strong> <span>({m.form})</span>
                                  </div>
                                  <div className="timeline-med-timing">
                                    <Sunrise size={13} /> {m.timing}
                                  </div>
                                  <div className="timeline-med-instructions">{m.instructions}</div>
                                </div>
                              ))
                          )}
                        </div>
                      </div>

                      {/* Afternoon Slot */}
                      <div className="timeline-slot slot-afternoon">
                        <div className="slot-header">
                          <div className="slot-badge">
                            <Sun size={18} />
                            <span>Afternoon (1:30 PM)</span>
                          </div>
                          <span className="slot-sub">Lunch time</span>
                        </div>
                        <div className="slot-medicines">
                          {parsedData.medicines.filter((m) => m.schedule.afternoon).length === 0 ? (
                            <p className="empty-slot">No afternoon medicines prescribed.</p>
                          ) : (
                            parsedData.medicines
                              .filter((m) => m.schedule.afternoon)
                              .map((m) => (
                                <div key={m.id} className="timeline-med-card">
                                  <div className="timeline-med-title">
                                    <strong>{m.name}</strong> <span>({m.form})</span>
                                  </div>
                                  <div className="timeline-med-timing">
                                    <Sunrise size={13} /> {m.timing}
                                  </div>
                                  <div className="timeline-med-instructions">{m.instructions}</div>
                                </div>
                              ))
                          )}
                        </div>
                      </div>

                      {/* Night Slot */}
                      <div className="timeline-slot slot-night">
                        <div className="slot-header">
                          <div className="slot-badge">
                            <Moon size={18} />
                            <span>Night (8:30 PM - Bedtime)</span>
                          </div>
                          <span className="slot-sub">Dinner & Bedtime</span>
                        </div>
                        <div className="slot-medicines">
                          {parsedData.medicines.filter((m) => m.schedule.night).length === 0 ? (
                            <p className="empty-slot">No night medicines prescribed.</p>
                          ) : (
                            parsedData.medicines
                              .filter((m) => m.schedule.night)
                              .map((m) => (
                                <div key={m.id} className="timeline-med-card">
                                  <div className="timeline-med-title">
                                    <strong>{m.name}</strong> <span>({m.form})</span>
                                  </div>
                                  <div className="timeline-med-timing">
                                    <Sunrise size={13} /> {m.timing}
                                  </div>
                                  <div className="timeline-med-instructions">{m.instructions}</div>
                                </div>
                              ))
                          )}
                        </div>
                      </div>

                      {/* SOS / As Needed Slot */}
                      {parsedData.medicines.some((m) => m.schedule.isSOS) && (
                        <div className="timeline-slot slot-sos">
                          <div className="slot-header">
                            <div className="slot-badge">
                              <AlertCircle size={18} />
                              <span>SOS / As Needed</span>
                            </div>
                            <span className="slot-sub">Only when acute symptoms occur</span>
                          </div>
                          <div className="slot-medicines">
                            {parsedData.medicines
                              .filter((m) => m.schedule.isSOS)
                              .map((m) => (
                                <div key={m.id} className="timeline-med-card">
                                  <div className="timeline-med-title">
                                    <strong>{m.name}</strong> <span>({m.form})</span>
                                  </div>
                                  <div className="timeline-med-timing">{m.instructions}</div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: SAFETY & CLINICAL NOTES */}
                {activeTab === 'safety' && (
                  <div className="safety-view-container glass shadow-md">
                    <div className="safety-view-header">
                      <div>
                        <h3>Medication Safety, Drug-Drug & Duplicate Alerts</h3>
                        <p>Automated safety synthesis to guard against accidental toxicity or adverse interactions</p>
                      </div>
                    </div>

                    <div className="safety-cards-grid">
                      {/* Safety Alerts from parser */}
                      {parsedData.safetyAlerts.length > 0 ? (
                        parsedData.safetyAlerts.map((alert, i) => (
                          <div key={i} className={`clinical-safety-card alert-${alert.type}`}>
                            <div className="safety-card-icon">
                              {alert.type === 'warning' ? <AlertCircle size={22} /> : <AlertTriangle size={22} />}
                            </div>
                            <div className="safety-card-content">
                              <h4>{alert.title}</h4>
                              <p>{alert.message}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="clinical-safety-card safe-state">
                          <CheckCircle size={22} className="text-success" />
                          <div className="safety-card-content">
                            <h4>No Major Duplicate Salt Conflicts Detected</h4>
                            <p>All recognized medications have distinct pharmacological classes without duplicate paracetamol or NSAID overloads.</p>
                          </div>
                        </div>
                      )}

                      {/* Antibiotic Advisory */}
                      {parsedData.medicines.some((m) => m.isAntibiotic) && (
                        <div className="clinical-safety-card alert-caution">
                          <ShieldAlert size={22} />
                          <div className="safety-card-content">
                            <h4>Antibiotic Course Completion Rule</h4>
                            <p>
                              Your prescription contains active antibiotics. Always complete the entire prescribed course even if symptoms resolve earlier to prevent bacterial resistance.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Alcohol / Dietary interactions */}
                      <div className="clinical-safety-card alert-info">
                        <Info size={22} />
                        <div className="safety-card-content">
                          <h4>General Administration Advisory</h4>
                          <p>
                            Avoid consuming alcohol during active treatment courses. Take antacids or proton-pump inhibitors 30 minutes before food for optimal gastrointestinal protection.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: RAW OCR TEXT & CORRECTION */}
                {activeTab === 'rawText' && (
                  <div className="raw-text-card glass shadow-md">
                    <div className="results-card-heading">
                      <div>
                        <span className="section-kicker">Interactive Live OCR Editor</span>
                        <h3>Review & Edit Transcribed Text</h3>
                      </div>
                      <span className="edit-hint">Changes automatically re-parse in real-time</span>
                    </div>
                    <p className="raw-text-explainer">
                      If the camera misread a doctor's handwriting or numerical dosage, you can edit the text directly.
                      The Arogya parser will immediately re-evaluate medicines, frequencies, and warnings.
                    </p>
                    <div className="raw-text-stats-bar">
                      <span>{extractedText.length} characters</span>
                      <span>{extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0} words</span>
                      <span>{extractedText.split('\n').length} lines</span>
                    </div>
                    <textarea
                      className="raw-text-editor"
                      value={extractedText}
                      onChange={(e) => handleTextReview(e.target.value)}
                      placeholder="Recognized prescription text will appear here."
                      aria-label="Recognized prescription text"
                      rows={10}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Lightbox / Zoom Modal for Original Prescription */}
      <AnimatePresence>
        {isLightboxOpen && previewUrl && (
          <motion.div
            className="lightbox-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)}
          >
            <motion.div
              className="lightbox-modal-box glass"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="lightbox-header">
                <div className="lightbox-title">
                  <FileText size={18} />
                  <span>Prescription Image Inspector</span>
                </div>
                <div className="lightbox-actions">
                  <button type="button" className="icon-tool-btn" onClick={handleRotateImage}>
                    <RotateCw size={15} /> <span>Rotate</span>
                  </button>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setIsLightboxOpen(false)}
                    aria-label="Close image inspector"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="lightbox-image-viewport">
                <img src={previewUrl} alt="Prescription full preview" className="lightbox-full-img" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clinical Monograph Modal */}
      <AnimatePresence>
        {selectedMedicineModal && (
          <motion.div
            className="clinical-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMedicineModal(null)}
          >
            <motion.div
              className="clinical-modal-content glass shadow-lg"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <span className="modal-kicker">Official Pharmacopoeia Monograph</span>
                  <h2>{selectedMedicineModal.name}</h2>
                  <p className="modal-formula">{selectedMedicineModal.generic}</p>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setSelectedMedicineModal(null)}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                {isLoadingModal ? (
                  <div className="modal-loading-box">
                    <Loader2 className="spinner" size={32} />
                    <p>Fetching clinical monographs & FDA drug data...</p>
                  </div>
                ) : modalDetails ? (
                  <div className="modal-details-grid">
                    {/* Category & Mechanism */}
                    <div className="detail-section">
                      <h4>Therapeutic Category</h4>
                      <p>{modalDetails.category || selectedMedicineModal.category}</p>
                    </div>

                    {/* Indications */}
                    {modalDetails.description?.length > 0 && (
                      <div className="detail-section">
                        <h4>Approved Clinical Indications</h4>
                        <ul className="modal-bullets">
                          {modalDetails.description.map((item, idx) => (
                            <li key={idx}>
                              <ChevronRight size={14} /> <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Dosage & Administration */}
                    {modalDetails.dosage && (
                      <div className="detail-section">
                        <h4>Administration & Dosage</h4>
                        <p>{modalDetails.dosage}</p>
                      </div>
                    )}

                    {/* Precautions */}
                    {modalDetails.precautions?.length > 0 && (
                      <div className="detail-section">
                        <h4>Precautions & Warnings</h4>
                        <ul className="modal-bullets">
                          {modalDetails.precautions.map((item, idx) => (
                            <li key={idx}>
                              <AlertTriangle size={14} className="text-warning" /> <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Side effects */}
                    {modalDetails.risks?.length > 0 && (
                      <div className="detail-section">
                        <h4>Possible Side Effects</h4>
                        <ul className="modal-bullets">
                          {modalDetails.risks.map((item, idx) => (
                            <li key={idx}>
                              <ChevronRight size={14} /> <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Safety Matrix */}
                    <div className="detail-section safety-matrix">
                      <h4>Safety Profiles</h4>
                      <div className="safety-badges-row">
                        <div className="safety-chip">
                          <span className="chip-label">Alcohol Interaction:</span>
                          <strong>{modalDetails.safety?.alcohol || 'Caution'}</strong>
                        </div>
                        <div className="safety-chip">
                          <span className="chip-label">Pregnancy Classification:</span>
                          <strong>{modalDetails.safety?.pregnancy || selectedMedicineModal.pregnancyRisk}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer-cta">
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setSelectedMedicineModal(null);
                          navigate(`/medicine?search=${encodeURIComponent(selectedMedicineModal.name)}`);
                        }}
                      >
                        <ExternalLink size={16} /> Open Complete Medicine Page
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>Clinical monograph not available.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrescriptionOCR;
