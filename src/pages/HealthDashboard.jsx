import { useState, useEffect, useRef } from 'react';
import { Heart, Activity, Thermometer, Trash2, ShieldAlert, BarChart3, Clock, PlusCircle, Cloud, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../components/LanguageContext';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { validateVitalsForm, validateSymptomName, validateSeverity } from '../utils/vitalsValidation';
import { enforceMaxLength } from '../utils/security';
import './HealthDashboard.css';

// ─────────────────────────────────────────────────────────────────────────────
// DB ↔ App shape mappers
// (Preserve existing database column names)
// ─────────────────────────────────────────────────────────────────────────────

const mapVitalToDB = (log, userId) => ({
  user_id: userId,
  // Store ISO timestamp so ordering by created_at is always stable.
  // The "date" column is kept as a human-readable label.
  date: log.date,
  heart_rate: log.heartRate !== null && log.heartRate !== undefined ? log.heartRate : null,
  sys_bp:     log.sysBP     !== null && log.sysBP     !== undefined ? log.sysBP     : null,
  dia_bp:     log.diaBP     !== null && log.diaBP     !== undefined ? log.diaBP     : null,
  blood_sugar: log.bloodSugar !== null && log.bloodSugar !== undefined ? log.bloodSugar : null,
  temp:       log.temp       !== null && log.temp       !== undefined ? log.temp       : null,
  // createdAt is set by Supabase (created_at column); we carry it locally too.
  created_at: log.createdAt,
});

const mapVitalFromDB = (row) => ({
  id:          row.id,
  date:        row.date,
  createdAt:   row.created_at,
  heartRate:   row.heart_rate   !== null ? row.heart_rate   : null,
  sysBP:       row.sys_bp       !== null ? row.sys_bp       : null,
  diaBP:       row.dia_bp       !== null ? row.dia_bp       : null,
  bloodSugar:  row.blood_sugar  !== null ? row.blood_sugar  : null,
  temp:        row.temp         !== null ? row.temp         : null,
});

const mapSymptomToDB = (log, userId) => ({
  user_id:      userId,
  date:         log.date,
  symptom_name: log.symptomName,
  severity:     log.severity,
  notes:        log.notes,
  created_at:   log.createdAt,
});

const mapSymptomFromDB = (row) => ({
  id:          row.id,
  date:        row.date,
  createdAt:   row.created_at,
  symptomName: row.symptom_name,
  severity:    row.severity,
  notes:       row.notes,
});

// ─────────────────────────────────────────────────────────────────────────────
// Stable, sortable timestamp label
// Returns ISO string for sorting and a human-readable display label.
// ─────────────────────────────────────────────────────────────────────────────

function makeTimestamp() {
  const now = new Date();
  return {
    iso: now.toISOString(),
    label: now.toLocaleString(undefined, {
      month: 'short',
      day:   'numeric',
      hour:  '2-digit',
      minute:'2-digit',
    }),
  };
}

// Sort logs newest-first by createdAt ISO string (falls back to date label)
function sortNewestFirst(logs) {
  return [...logs].sort((a, b) => {
    const ta = a.createdAt || a.date || '';
    const tb = b.createdAt || b.date || '';
    return tb.localeCompare(ta);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast-style notification state helper
// ─────────────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'warning', message }
  const timerRef = useRef(null);

  const show = (type, message, duration = 5000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ type, message });
    timerRef.current = setTimeout(() => setToast(null), duration);
  };

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  };

  return { toast, show, dismiss };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const HealthDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [loadingDb, setLoadingDb]     = useState(false);
  const [dataLoaded, setDataLoaded]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  // Separate error state per form so range warnings don't block submission
  const [vitalsFormatErrors, setVitalsFormatErrors]   = useState([]);
  const [vitalsRangeWarnings, setVitalsRangeWarnings] = useState([]);
  const [symptomFormatErrors, setSymptomFormatErrors] = useState([]);

  // Logs
  const [vitalsLogs, setVitalsLogs]     = useState([]);
  const [symptomsLogs, setSymptomsLogs] = useState([]);

  // Vitals inputs
  const [heartRate,   setHeartRate]   = useState('');
  const [sysBP,       setSysBP]       = useState('');
  const [diaBP,       setDiaBP]       = useState('');
  const [bloodSugar,  setBloodSugar]  = useState('');
  const [temp,        setTemp]        = useState('');

  // Symptom inputs
  const [symptomName, setSymptomName] = useState('');
  const [severity,    setSeverity]    = useState(5);
  const [notes,       setNotes]       = useState('');

  // Chart
  const [activeChartTab, setActiveChartTab] = useState('heartRate');

  // ─── Duplicate-submission guard ───────────────────────────────────────────
  // Track the ISO timestamps of the last successful submission per form.
  const lastVitalSubmit   = useRef(null);
  const lastSymptomSubmit = useRef(null);
  const prevUserIdRef     = useRef(user?.id);

  // ─── Persist local logs ONLY when not logged in AND not logging out ────────
  useEffect(() => {
    if (!user && !prevUserIdRef.current && dataLoaded) {
      localStorage.setItem('medweb_vitals_logs',   JSON.stringify(vitalsLogs));
    }
  }, [vitalsLogs, user, dataLoaded]);

  useEffect(() => {
    if (!user && !prevUserIdRef.current && dataLoaded) {
      localStorage.setItem('medweb_symptoms_logs', JSON.stringify(symptomsLogs));
    }
  }, [symptomsLogs, user, dataLoaded]);

  // ─── Load logs on user change ──────────────────────────────────────────────
  useEffect(() => {
    const fetchLogs = async () => {
      setDataLoaded(false);
      setVitalsLogs([]);
      setSymptomsLogs([]);

      if (!user || !supabase) {
        // If transitioning from logged in to logged out, clear sensitive local storage
        if (prevUserIdRef.current) {
          localStorage.removeItem('medweb_vitals_logs');
          localStorage.removeItem('medweb_symptoms_logs');
          prevUserIdRef.current = null;
        }
        // Unauthenticated: fall back to localStorage
        const savedVitals   = localStorage.getItem('medweb_vitals_logs');
        const savedSymptoms = localStorage.getItem('medweb_symptoms_logs');
        setVitalsLogs(  savedVitals   ? JSON.parse(savedVitals)   : []);
        setSymptomsLogs(savedSymptoms ? JSON.parse(savedSymptoms) : []);
        setDataLoaded(true);
        return;
      }

      prevUserIdRef.current = user.id;

      setLoadingDb(true);
      try {
        // Fetch only this user's records (RLS also enforces this server-side)
        const { data: vitalsData, error: vitalsError } = await supabase
          .from('vitals_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (vitalsError) throw vitalsError;

        const { data: symptomsData, error: symptomsError } = await supabase
          .from('symptom_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (symptomsError) throw symptomsError;

        setVitalsLogs(  vitalsData.map(mapVitalFromDB));
        setSymptomsLogs(symptomsData.map(mapSymptomFromDB));
      } catch (err) {
        // Do not log health measurement values; only log non-PHI error type
        console.error('Failed to fetch health logs from database:', err.code || 'unknown error');
        showToast('error', 'Could not load your saved data. Please refresh the page.');
      } finally {
        setLoadingDb(false);
        setDataLoaded(true);
      }
    };

    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ─── Add Vitals ────────────────────────────────────────────────────────────

  const handleAddVitals = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // Validate
    const { valid, formatErrors, rangeWarnings, values } = validateVitalsForm({
      heartRate, sysBP, diaBP, bloodSugar, temp,
    });

    setVitalsFormatErrors(formatErrors);
    setVitalsRangeWarnings(rangeWarnings);

    if (!valid) return;

    // Duplicate-submission guard (within 2 seconds)
    const now = Date.now();
    if (lastVitalSubmit.current && (now - lastVitalSubmit.current) < 2000) {
      showToast('error', 'Duplicate submission detected. Please wait a moment before saving again.');
      return;
    }
    lastVitalSubmit.current = now;

    const { iso, label } = makeTimestamp();

    const newLog = {
      id:          `vital-${iso}-${Math.random().toString(36).slice(2, 7)}`,
      date:        label,
      createdAt:   iso,
      heartRate:   values.heartRate,
      sysBP:       values.sysBP,
      diaBP:       values.diaBP,
      bloodSugar:  values.bloodSugar,
      temp:        values.temp,
    };

    if (user && supabase) {
      setSubmitting(true);
      setLoadingDb(true);
      try {
        const { data, error } = await supabase
          .from('vitals_logs')
          .insert([mapVitalToDB(newLog, user.id)])
          .select()
          .single();

        if (error) throw error;

        // Use the server-assigned id/created_at to avoid ID collisions
        const savedLog = mapVitalFromDB(data);
        setVitalsLogs(prev => [...prev, savedLog]);
        showToast('success', 'Vitals saved to cloud.');
      } catch (err) {
        console.error('Failed to save vital log:', err.code || 'db error');
        showToast('error', 'Failed to save vitals to the cloud. Your data was NOT saved.');
        setSubmitting(false);
        setLoadingDb(false);
        return; // Do not update local state on failure
      } finally {
        setSubmitting(false);
        setLoadingDb(false);
      }
    } else {
      // Offline / unauthenticated mode — save to local state only
      setVitalsLogs(prev => [...prev, newLog]);
      if (rangeWarnings.length === 0) {
        showToast('success', 'Vitals saved locally.');
      }
    }

    // Show range warnings after successful save
    if (rangeWarnings.length > 0) {
      showToast('warning', `Vitals saved. Note: ${rangeWarnings.join(' ')}`);
    }

    // Clear form
    setHeartRate('');
    setSysBP('');
    setDiaBP('');
    setBloodSugar('');
    setTemp('');
    setVitalsFormatErrors([]);
    setVitalsRangeWarnings([]);
  };

  // ─── Add Symptom ───────────────────────────────────────────────────────────

  const handleAddSymptom = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const nameResult = validateSymptomName(symptomName);
    const sevResult  = validateSeverity(severity);

    const errors = [];
    if (!nameResult.ok) errors.push(nameResult.message);
    if (!sevResult.ok)  errors.push(sevResult.message);
    setSymptomFormatErrors(errors);
    if (errors.length > 0) return;

    // Duplicate guard
    const now = Date.now();
    if (lastSymptomSubmit.current && (now - lastSymptomSubmit.current) < 2000) {
      showToast('error', 'Duplicate submission detected. Please wait a moment.');
      return;
    }
    lastSymptomSubmit.current = now;

    const { iso, label } = makeTimestamp();

    const newLog = {
      id:          `symptom-${iso}-${Math.random().toString(36).slice(2, 7)}`,
      date:        label,
      createdAt:   iso,
      symptomName: nameResult.value,
      severity:    sevResult.value,
      notes:       enforceMaxLength(notes.trim(), 2000),
    };

    if (user && supabase) {
      setSubmitting(true);
      setLoadingDb(true);
      try {
        const { data, error } = await supabase
          .from('symptom_logs')
          .insert([mapSymptomToDB(newLog, user.id)])
          .select()
          .single();

        if (error) throw error;

        const savedLog = mapSymptomFromDB(data);
        setSymptomsLogs(prev => [...prev, savedLog]);
        showToast('success', 'Symptom saved to cloud.');
      } catch (err) {
        console.error('Failed to save symptom log:', err.code || 'db error');
        showToast('error', 'Failed to save symptom to the cloud. Your data was NOT saved.');
        setSubmitting(false);
        setLoadingDb(false);
        return;
      } finally {
        setSubmitting(false);
        setLoadingDb(false);
      }
    } else {
      setSymptomsLogs(prev => [...prev, newLog]);
      showToast('success', 'Symptom saved locally.');
    }

    setSymptomName('');
    setSeverity(5);
    setNotes('');
    setSymptomFormatErrors([]);
  };

  // ─── Delete ────────────────────────────────────────────────────────────────

  const deleteVitalLog = async (id) => {
    if (user && supabase) {
      setLoadingDb(true);
      try {
        const { error } = await supabase
          .from('vitals_logs')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id); // Authorization: only delete own records

        if (error) throw error;
      } catch (err) {
        console.error('Failed to delete vital log:', err.code || 'db error');
        showToast('error', 'Failed to delete this record. Please try again.');
        setLoadingDb(false);
        return;
      } finally {
        setLoadingDb(false);
      }
    }
    setVitalsLogs(prev => prev.filter(log => log.id !== id));
  };

  const deleteSymptomLog = async (id) => {
    if (user && supabase) {
      setLoadingDb(true);
      try {
        const { error } = await supabase
          .from('symptom_logs')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id); // Authorization: only delete own records

        if (error) throw error;
      } catch (err) {
        console.error('Failed to delete symptom log:', err.code || 'db error');
        showToast('error', 'Failed to delete this record. Please try again.');
        setLoadingDb(false);
        return;
      } finally {
        setLoadingDb(false);
      }
    }
    setSymptomsLogs(prev => prev.filter(log => log.id !== id));
  };

  const clearAllLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all your logged data history?')) return;

    if (user && supabase) {
      setLoadingDb(true);
      try {
        const { error: vError } = await supabase
          .from('vitals_logs')
          .delete()
          .eq('user_id', user.id);
        if (vError) throw vError;

        const { error: sError } = await supabase
          .from('symptom_logs')
          .delete()
          .eq('user_id', user.id);
        if (sError) throw sError;
      } catch (err) {
        console.error('Failed to clear logs:', err.code || 'db error');
        showToast('error', 'Failed to clear all logs. Please try again.');
        setLoadingDb(false);
        return;
      } finally {
        setLoadingDb(false);
      }
    }

    setVitalsLogs([]);
    setSymptomsLogs([]);
    if (!user) {
      localStorage.removeItem('medweb_vitals_logs');
      localStorage.removeItem('medweb_symptoms_logs');
    }
  };

  // ─── Statistics ────────────────────────────────────────────────────────────

  const getAverageHeartRate = () => {
    const validLogs = vitalsLogs.filter(l => l.heartRate !== null && l.heartRate !== undefined);
    if (validLogs.length === 0) return '--';
    const sum = validLogs.reduce((acc, log) => acc + log.heartRate, 0);
    return Math.round(sum / validLogs.length);
  };

  const getLatestBPReading = () => {
    const validLogs = vitalsLogs.filter(l => l.sysBP !== null && l.diaBP !== null);
    if (validLogs.length === 0) return null;
    return sortNewestFirst(validLogs)[0];
  };

  const getLatestBloodPressureStatus = () => {
    const latest = getLatestBPReading();
    if (!latest) return '--';
    if (latest.sysBP >= 140 || latest.diaBP >= 90) return t('hypertensive');
    if (latest.sysBP >= 130 || latest.diaBP >= 80) return t('prehypertensive');
    return t('normal');
  };

  const getMaxBloodSugar = () => {
    const validLogs = vitalsLogs.filter(l => l.bloodSugar !== null && l.bloodSugar !== undefined);
    if (validLogs.length === 0) return '--';
    return Math.max(...validLogs.map(l => l.bloodSugar));
  };

  const getAverageTemp = () => {
    const validLogs = vitalsLogs.filter(l => l.temp !== null && l.temp !== undefined);
    if (validLogs.length === 0) return '--';
    const sum = validLogs.reduce((acc, log) => acc + log.temp, 0);
    return (sum / validLogs.length).toFixed(1);
  };

  // ─── Health alerts ─────────────────────────────────────────────────────────

  const hasHighSugarAlert = () => {
    const validLogs = vitalsLogs.filter(l => l.bloodSugar !== null && l.bloodSugar !== undefined);
    if (validLogs.length === 0) return false;
    const latest = sortNewestFirst(validLogs)[0];
    return latest.bloodSugar > 140;
  };

  const hasFeverAlert = () => {
    const validLogs = vitalsLogs.filter(l => l.temp !== null && l.temp !== undefined);
    if (validLogs.length === 0) return false;
    const latest = sortNewestFirst(validLogs)[0];
    return latest.temp >= 100.4;
  };

  // ─── SVG Chart ─────────────────────────────────────────────────────────────

  const getSVGCoordinates = (valueKey, minVal, maxVal) => {
    const width   = 450;
    const height  = 120;
    const xOffset = 25;
    const yOffset = 20;

    const validLogs = vitalsLogs.filter(l => l[valueKey] !== null && l[valueKey] !== undefined);
    if (validLogs.length === 0) return { path: '', points: [] };

    // Sort oldest→newest for the chart line
    const sorted = [...validLogs].sort((a, b) => {
      const ta = a.createdAt || a.date || '';
      const tb = b.createdAt || b.date || '';
      return ta.localeCompare(tb);
    });

    const recent = sorted.slice(-7);

    const points = recent.map((item, index) => {
      const val = parseFloat(item[valueKey]);
      const x = xOffset + (index / Math.max(recent.length - 1, 1)) * width;
      const percent = (val - minVal) / (maxVal - minVal);
      const y = yOffset + height - (Math.min(Math.max(percent, 0), 1) * height);
      return { x, y, value: val, date: item.date };
    });

    const path = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return { path, points };
  };

  const getChartParams = () => {
    switch (activeChartTab) {
      case 'bloodSugar':
        return { key: 'bloodSugar', min: 60, max: 200, label: 'Blood Sugar (mg/dL)', color: '#F59E0B' };
      case 'temp':
        return { key: 'temp', min: 96, max: 104, label: 'Temperature (°F)', color: '#EF4444' };
      case 'heartRate':
      default:
        return { key: 'heartRate', min: 50, max: 150, label: 'Heart Rate (bpm)', color: '#0F766E' };
    }
  };

  const chartParams = getChartParams();
  const chartData   = getSVGCoordinates(chartParams.key, chartParams.min, chartParams.max);

  const sortedVitals   = sortNewestFirst(vitalsLogs);
  const sortedSymptoms = sortNewestFirst(symptomsLogs);

  const bpStatus = getLatestBloodPressureStatus();
  const bpIsHigh = bpStatus === t('hypertensive');

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="dashboard-container container">

      {/* Toast notification */}
      {toast && (
        <div className={`dashboard-toast toast-${toast.type}`} role="alert" aria-live="polite">
          {toast.type === 'success' && <CheckCircle size={18} />}
          {toast.type === 'error'   && <ShieldAlert  size={18} />}
          {toast.type === 'warning' && <AlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="toast-dismiss" onClick={dismissToast} aria-label="Dismiss">×</button>
        </div>
      )}

      {/* Dashboard Header */}
      <div className="dashboard-header text-center">
        <h1 className="page-title">{t('dashTitle')}</h1>
        <p className="page-subtitle">{t('dashSubtitle')}</p>

        {/* Cloud Sync Status Badge */}
        {user && (
          <div className="sync-status-badge-container">
            <div className="sync-badge synced glass">
              {loadingDb ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-primary" />
                  <span>Syncing with Cloud…</span>
                </>
              ) : (
                <>
                  <Cloud size={14} className="text-primary" />
                  <span>Cloud Connected</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Critical Warnings Bar */}
      {dataLoaded && (hasHighSugarAlert() || hasFeverAlert()) && (
        <div className="critical-vitals-alert glass shadow-sm" role="alert">
          <ShieldAlert size={26} className="alert-icon text-error animate-pulse" />
          <div className="alert-text">
            <strong>Critical Health Flags Detected</strong>
            <ul>
              {hasHighSugarAlert() && <li>🚨 {t('highSugarAlert')}</li>}
              {hasFeverAlert()     && <li>🌡️ {t('feverAlert')}</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="stats-summary-grid">
        <div className="stat-card glass shadow-sm hr-stat">
          <div className="stat-icon-wrapper"><Heart size={24} color="#0F766E" /></div>
          <div className="stat-info">
            <span className="stat-label">{t('avgHeartRate')}</span>
            <span className="stat-value">
              {getAverageHeartRate()}
              {getAverageHeartRate() !== '--' && <span className="unit"> bpm</span>}
            </span>
          </div>
        </div>

        <div className="stat-card glass shadow-sm bp-stat">
          <div className="stat-icon-wrapper"><Activity size={24} color="#3B82F6" /></div>
          <div className="stat-info">
            <span className="stat-label">{t('latestBp')}</span>
            <span className={`stat-value bp-status-text${bpIsHigh ? ' text-error' : ''}`}>
              {bpStatus}
            </span>
          </div>
        </div>

        <div className="stat-card glass shadow-sm bs-stat">
          <div className="stat-icon-wrapper"><BarChart3 size={24} color="#F59E0B" /></div>
          <div className="stat-info">
            <span className="stat-label">{t('maxSugar')}</span>
            <span className="stat-value">
              {getMaxBloodSugar()}
              {getMaxBloodSugar() !== '--' && <span className="unit"> mg/dL</span>}
            </span>
          </div>
        </div>

        <div className="stat-card glass shadow-sm bt-stat">
          <div className="stat-icon-wrapper"><Thermometer size={24} color="#EF4444" /></div>
          <div className="stat-info">
            <span className="stat-label">{t('avgTemp')}</span>
            <span className="stat-value">
              {getAverageTemp()}
              {getAverageTemp() !== '--' && <span className="unit">°F</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Log Form Columns */}
      <div className="dashboard-forms-grid">

        {/* Vitals Form */}
        <div className="dashboard-card glass shadow-md">
          <h2><PlusCircle size={20} className="icon-pre" />{t('logVitals')}</h2>

          {/* Format errors block submission */}
          {vitalsFormatErrors.length > 0 && (
            <div className="form-error-box" role="alert">
              <ul>
                {vitalsFormatErrors.map((msg, i) => (
                  <li key={i}><AlertTriangle size={14} /> {msg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Range warnings: displayed in form, do not block */}
          {vitalsRangeWarnings.length > 0 && (
            <div className="form-warning-box" role="status">
              <ul>
                {vitalsRangeWarnings.map((msg, i) => (
                  <li key={i}><AlertTriangle size={14} /> {msg}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleAddVitals} className="vitals-form" noValidate>
            <div className="form-group-row">
              <div className="form-item">
                <label htmlFor="input-heart-rate">{t('heartRate')} <span className="unit-label">(bpm)</span></label>
                <input
                  id="input-heart-rate"
                  type="number"
                  placeholder="e.g., 72"
                  value={heartRate}
                  min={20}
                  max={300}
                  step={1}
                  onChange={e => setHeartRate(e.target.value)}
                  aria-describedby={vitalsFormatErrors.length ? 'vitals-errors' : undefined}
                />
              </div>
              <div className="form-item">
                <label htmlFor="input-temp">{t('bodyTemp')} <span className="unit-label">(°F)</span></label>
                <input
                  id="input-temp"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 98.6"
                  value={temp}
                  min={85}
                  max={115}
                  onChange={e => setTemp(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-item">
                <label htmlFor="input-sys-bp">{t('systolic')} <span className="unit-label">(mmHg)</span></label>
                <input
                  id="input-sys-bp"
                  type="number"
                  placeholder="e.g., 120"
                  value={sysBP}
                  min={50}
                  max={300}
                  step={1}
                  onChange={e => setSysBP(e.target.value)}
                />
              </div>
              <div className="form-item">
                <label htmlFor="input-dia-bp">{t('diastolic')} <span className="unit-label">(mmHg)</span></label>
                <input
                  id="input-dia-bp"
                  type="number"
                  placeholder="e.g., 80"
                  value={diaBP}
                  min={20}
                  max={200}
                  step={1}
                  onChange={e => setDiaBP(e.target.value)}
                />
              </div>
            </div>

            <div className="form-item">
              <label htmlFor="input-blood-sugar">{t('bloodSugar')} <span className="unit-label">(mg/dL)</span></label>
              <input
                id="input-blood-sugar"
                type="number"
                placeholder="e.g., 95"
                value={bloodSugar}
                min={20}
                max={800}
                step={1}
                onChange={e => setBloodSugar(e.target.value)}
              />
            </div>

            <button
              type="submit"
              id="btn-save-vitals"
              className="btn btn-primary w-full submit-log-btn"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : t('saveVitals')}
            </button>
          </form>
        </div>

        {/* Symptoms Form */}
        <div className="dashboard-card glass shadow-md">
          <h2><Activity size={20} className="icon-pre" />{t('logSymptoms')}</h2>

          {symptomFormatErrors.length > 0 && (
            <div className="form-error-box" role="alert">
              <ul>
                {symptomFormatErrors.map((msg, i) => (
                  <li key={i}><AlertTriangle size={14} /> {msg}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleAddSymptom} className="symptoms-form" noValidate>
            <div className="form-item">
              <label htmlFor="input-symptom-name">{t('symptomsInputLabel')}</label>
              <input
                id="input-symptom-name"
                type="text"
                placeholder="e.g., Headache, Stomach cramp…"
                value={symptomName}
                onChange={e => setSymptomName(e.target.value)}
              />
            </div>

            <div className="form-item">
              <div className="severity-label-row">
                <label htmlFor="input-severity">{t('symptomSeverity')}</label>
                <span className={`severity-indicator-badge severity-${severity}`}>
                  {severity}
                </span>
              </div>
              <input
                id="input-severity"
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                className="severity-slider"
              />
            </div>

            <div className="form-item">
              <label htmlFor="input-notes">{t('notes')}</label>
              <textarea
                id="input-notes"
                placeholder="Describe how you feel, triggers, or specific patterns…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows="3"
              />
            </div>

            <button
              type="submit"
              id="btn-save-symptom"
              className="btn btn-primary w-full submit-log-btn"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : t('saveSymptom')}
            </button>
          </form>
        </div>
      </div>

      {/* SVG Trend Graph */}
      <div className="dashboard-card glass shadow-md chart-full-card">
        <div className="chart-header">
          <h2><BarChart3 size={20} className="icon-pre" />{t('vitalsTrends')}</h2>
          <div className="chart-tabs-bar">
            {['heartRate', 'bloodSugar', 'temp'].map(tab => (
              <button
                key={tab}
                className={`chart-tab${activeChartTab === tab ? ' active' : ''}`}
                onClick={() => setActiveChartTab(tab)}
              >
                {tab === 'heartRate' ? t('heartRate') : tab === 'bloodSugar' ? t('bloodSugar') : t('bodyTemp')}
              </button>
            ))}
          </div>
        </div>

        <div className="svg-chart-container glass">
          {!dataLoaded ? (
            <div className="no-chart-data">
              <RefreshCw size={36} className="animate-spin text-muted" />
              <p>Loading…</p>
            </div>
          ) : chartData.points.length === 0 ? (
            <div className="no-chart-data">
              <Clock size={36} className="text-muted" />
              <p>Add at least one {chartParams.label.split(' (')[0].toLowerCase()} reading to view the trend chart.</p>
            </div>
          ) : (
            <svg viewBox="0 0 500 180" className="health-svg-graph" aria-label={`${chartParams.label} trend chart`}>
              <line x1="25" y1="20"  x2="475" y2="20"  stroke="var(--border)" strokeDasharray="3,3" />
              <line x1="25" y1="80"  x2="475" y2="80"  stroke="var(--border)" strokeDasharray="3,3" />
              <line x1="25" y1="140" x2="475" y2="140" stroke="var(--border)" strokeDasharray="3" />

              {chartData.path && (
                <path
                  d={chartData.path}
                  fill="none"
                  stroke={chartParams.color}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {chartData.points.map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r="5" fill={chartParams.color} stroke="var(--surface)" strokeWidth="2" />
                  <text x={pt.x} y={pt.y - 10} textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--text-main)">
                    {pt.value}
                  </text>
                  <text x={pt.x} y="160" textAnchor="middle" fontSize="8" fill="var(--text-muted)">
                    {pt.date.split(',')[0]}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </div>
      </div>

      {/* History Log Tables */}
      <div className="dashboard-history-tables-grid">

        {/* Vitals History */}
        <div className="dashboard-card glass shadow-md">
          <div className="card-title-row">
            <h3>📈 Vitals Log History</h3>
            {vitalsLogs.length > 0 && (
              <button className="btn btn-outline btn-sm clear-btn" onClick={clearAllLogs}>
                <Trash2 size={14} />
                <span>{t('clearAll')}</span>
              </button>
            )}
          </div>
          <div className="log-table-wrapper">
            {!dataLoaded ? (
              <p className="no-data-text">Loading…</p>
            ) : sortedVitals.length === 0 ? (
              <p className="no-data-text">{t('noVitalsLogged')}</p>
            ) : (
              <table className="log-table">
                <thead>
                  <tr>
                    <th>{t('date')}</th>
                    <th>{t('vitals')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVitals.map(log => (
                    <tr key={log.id}>
                      <td className="date-cell" title={log.createdAt || log.date}>{log.date}</td>
                      <td className="vitals-values-cell">
                        {log.heartRate  !== null && <span className="tag-vital">💓 {log.heartRate} bpm</span>}
                        {log.sysBP !== null && log.diaBP !== null && (
                          <span className="tag-vital">🩸 {log.sysBP}/{log.diaBP} mmHg</span>
                        )}
                        {log.bloodSugar !== null && <span className="tag-vital">🍭 {log.bloodSugar} mg/dL</span>}
                        {log.temp       !== null && <span className="tag-vital">🌡️ {log.temp}°F</span>}
                      </td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => deleteVitalLog(log.id)}
                          title="Delete this record"
                          aria-label={`Delete vital log from ${log.date}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Symptoms History */}
        <div className="dashboard-card glass shadow-md">
          <div className="card-title-row">
            <h3>📋 Symptoms Log History</h3>
          </div>
          <div className="log-table-wrapper">
            {!dataLoaded ? (
              <p className="no-data-text">Loading…</p>
            ) : sortedSymptoms.length === 0 ? (
              <p className="no-data-text">{t('noSymptomsLogged')}</p>
            ) : (
              <table className="log-table">
                <thead>
                  <tr>
                    <th>{t('date')}</th>
                    <th>Symptom</th>
                    <th>{t('severity')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSymptoms.map(log => (
                    <tr key={log.id}>
                      <td className="date-cell" title={log.createdAt || log.date}>{log.date}</td>
                      <td className="symptom-name-cell">
                        <strong>{log.symptomName}</strong>
                        {log.notes && <p className="notes-desc">{log.notes}</p>}
                      </td>
                      <td>
                        <span className={`severity-badge severity-${log.severity}`}>
                          {log.severity}/10
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => deleteSymptomLog(log.id)}
                          title="Delete this record"
                          aria-label={`Delete symptom log from ${log.date}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthDashboard;
