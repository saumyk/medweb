import { useState, useEffect } from 'react';
import { Heart, Activity, Thermometer, Trash2, ShieldAlert, BarChart3, Clock, PlusCircle } from 'lucide-react';
import { useLanguage } from '../components/LanguageContext';
import './HealthDashboard.css';

const HealthDashboard = () => {
  const { t } = useLanguage();

  // Logs States
  const [vitalsLogs, setVitalsLogs] = useState(() => {
    const saved = localStorage.getItem('medweb_vitals_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [symptomsLogs, setSymptomsLogs] = useState(() => {
    const saved = localStorage.getItem('medweb_symptoms_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Vitals Inputs
  const [heartRate, setHeartRate] = useState('');
  const [sysBP, setSysBP] = useState('');
  const [diaBP, setDiaBP] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [temp, setTemp] = useState('');

  // Symptom Inputs
  const [symptomName, setSymptomName] = useState('');
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState('');

  // Active Tab for chart display ('heartRate' | 'bloodSugar' | 'temp')
  const [activeChartTab, setActiveChartTab] = useState('heartRate');

  // Persist logs
  useEffect(() => {
    localStorage.setItem('medweb_vitals_logs', JSON.stringify(vitalsLogs));
  }, [vitalsLogs]);

  useEffect(() => {
    localStorage.setItem('medweb_symptoms_logs', JSON.stringify(symptomsLogs));
  }, [symptomsLogs]);

  // Form Handlers
  const handleAddVitals = (e) => {
    e.preventDefault();
    if (!heartRate && !sysBP && !diaBP && !bloodSugar && !temp) return;

    const newLog = {
      id: `vital-${Date.now()}`,
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      heartRate: heartRate ? parseFloat(heartRate) : null,
      sysBP: sysBP ? parseFloat(sysBP) : null,
      diaBP: diaBP ? parseFloat(diaBP) : null,
      bloodSugar: bloodSugar ? parseFloat(bloodSugar) : null,
      temp: temp ? parseFloat(temp) : null,
    };

    setVitalsLogs(prev => [...prev, newLog]);
    setHeartRate('');
    setSysBP('');
    setDiaBP('');
    setBloodSugar('');
    setTemp('');
  };

  const handleAddSymptom = (e) => {
    e.preventDefault();
    if (!symptomName.trim()) return;

    const newLog = {
      id: `symptom-${Date.now()}`,
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      symptomName: symptomName.trim(),
      severity: parseInt(severity, 10),
      notes: notes.trim(),
    };

    setSymptomsLogs(prev => [...prev, newLog]);
    setSymptomName('');
    setSeverity(5);
    setNotes('');
  };

  const deleteVitalLog = (id) => {
    setVitalsLogs(prev => prev.filter(log => log.id !== id));
  };

  const deleteSymptomLog = (id) => {
    setSymptomsLogs(prev => prev.filter(log => log.id !== id));
  };

  const clearAllLogs = () => {
    if (window.confirm("Are you sure you want to clear all your logged data history?")) {
      setVitalsLogs([]);
      setSymptomsLogs([]);
    }
  };

  // Statistic Calculations
  const getAverageHeartRate = () => {
    const validLogs = vitalsLogs.filter(l => l.heartRate);
    if (validLogs.length === 0) return "--";
    const sum = validLogs.reduce((acc, log) => acc + log.heartRate, 0);
    return Math.round(sum / validLogs.length);
  };

  const getLatestBloodPressureStatus = () => {
    const validLogs = vitalsLogs.filter(l => l.sysBP && l.diaBP);
    if (validLogs.length === 0) return "--";
    const latest = validLogs[validLogs.length - 1];
    
    if (latest.sysBP >= 130 || latest.diaBP >= 80) return t('hypertensive');
    if (latest.sysBP >= 120 || latest.diaBP >= 80) return t('prehypertensive');
    return t('normal');
  };

  const getMaxBloodSugar = () => {
    const validLogs = vitalsLogs.filter(l => l.bloodSugar);
    if (validLogs.length === 0) return "--";
    return Math.max(...validLogs.map(l => l.bloodSugar));
  };

  const getAverageTemp = () => {
    const validLogs = vitalsLogs.filter(l => l.temp);
    if (validLogs.length === 0) return "--";
    const sum = validLogs.reduce((acc, log) => acc + log.temp, 0);
    return (sum / validLogs.length).toFixed(1);
  };

  // Warnings Alerts
  const hasHighSugarAlert = () => {
    const validLogs = vitalsLogs.filter(l => l.bloodSugar);
    if (validLogs.length === 0) return false;
    return validLogs[validLogs.length - 1].bloodSugar > 140;
  };

  const hasFeverAlert = () => {
    const validLogs = vitalsLogs.filter(l => l.temp);
    if (validLogs.length === 0) return false;
    return validLogs[validLogs.length - 1].temp >= 100.4;
  };

  // SVG Chart Helper
  const getSVGCoordinates = (valueKey, minVal, maxVal) => {
    const width = 450;
    const height = 120;
    const xOffset = 25;
    const yOffset = 20;

    const validLogs = vitalsLogs.filter(l => l[valueKey] !== null && l[valueKey] !== undefined);
    if (validLogs.length === 0) return { path: '', points: [] };

    const recent = validLogs.slice(-7);

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
  const chartData = getSVGCoordinates(chartParams.key, chartParams.min, chartParams.max);

  return (
    <div className="dashboard-container container">
      {/* Dashboard Header */}
      <div className="dashboard-header text-center">
        <h1 className="page-title">{t('dashTitle')}</h1>
        <p className="page-subtitle">{t('dashSubtitle')}</p>
      </div>

      {/* Critical Warnings Bar */}
      {(hasHighSugarAlert() || hasFeverAlert()) && (
        <div className="critical-vitals-alert glass shadow-sm">
          <ShieldAlert size={26} className="alert-icon text-error animate-pulse" />
          <div className="alert-text">
            <strong>Critical Health Flags Detected</strong>
            <ul>
              {hasHighSugarAlert() && <li>🚨 {t('highSugarAlert')}</li>}
              {hasFeverAlert() && <li>🌡️ {t('feverAlert')}</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Top statistics summary */}
      <div className="stats-summary-grid">
        <div className="stat-card glass shadow-sm hr-stat">
          <div className="stat-icon-wrapper">
            <Heart size={24} color="#0F766E" />
          </div>
          <div className="stat-info">
            <span className="stat-label">{t('avgHeartRate')}</span>
            <span className="stat-value">{getAverageHeartRate()} <span className="unit">bpm</span></span>
          </div>
        </div>

        <div className="stat-card glass shadow-sm bp-stat">
          <div className="stat-icon-wrapper">
            <Activity size={24} color="#3B82F6" />
          </div>
          <div className="stat-info">
            <span className="stat-label">{t('latestBp')}</span>
            <span className={`stat-value bp-status-text ${getLatestBloodPressureStatus().includes('High') ? 'text-error' : ''}`}>
              {getLatestBloodPressureStatus()}
            </span>
          </div>
        </div>

        <div className="stat-card glass shadow-sm bs-stat">
          <div className="stat-icon-wrapper">
            <BarChart3 size={24} color="#F59E0B" />
          </div>
          <div className="stat-info">
            <span className="stat-label">{t('maxSugar')}</span>
            <span className="stat-value">{getMaxBloodSugar()} <span className="unit">mg/dL</span></span>
          </div>
        </div>

        <div className="stat-card glass shadow-sm bt-stat">
          <div className="stat-icon-wrapper">
            <Thermometer size={24} color="#EF4444" />
          </div>
          <div className="stat-info">
            <span className="stat-label">{t('avgTemp')}</span>
            <span className="stat-value">{getAverageTemp()} <span className="unit">°F</span></span>
          </div>
        </div>
      </div>

      {/* Log Form Columns */}
      <div className="dashboard-forms-grid">
        {/* Vitals Form */}
        <div className="dashboard-card glass shadow-md">
          <h2><PlusCircle size={20} className="icon-pre" />{t('logVitals')}</h2>
          <form onSubmit={handleAddVitals} className="vitals-form">
            <div className="form-group-row">
              <div className="form-item">
                <label>{t('heartRate')} (bpm)</label>
                <input 
                  type="number" 
                  placeholder="e.g., 72" 
                  value={heartRate} 
                  onChange={e => setHeartRate(e.target.value)} 
                />
              </div>
              <div className="form-item">
                <label>{t('bodyTemp')} (°F)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  placeholder="e.g., 98.6" 
                  value={temp} 
                  onChange={e => setTemp(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-item">
                <label>{t('systolic')} (mmHg)</label>
                <input 
                  type="number" 
                  placeholder="e.g., 120" 
                  value={sysBP} 
                  onChange={e => setSysBP(e.target.value)} 
                />
              </div>
              <div className="form-item">
                <label>{t('diastolic')} (mmHg)</label>
                <input 
                  type="number" 
                  placeholder="e.g., 80" 
                  value={diaBP} 
                  onChange={e => setDiaBP(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-item">
              <label>{t('bloodSugar')} (mg/dL)</label>
              <input 
                type="number" 
                placeholder="e.g., 95" 
                value={bloodSugar} 
                onChange={e => setBloodSugar(e.target.value)} 
              />
            </div>

            <button type="submit" className="btn btn-primary w-full submit-log-btn">
              {t('saveVitals')}
            </button>
          </form>
        </div>

        {/* Symptoms Form */}
        <div className="dashboard-card glass shadow-md">
          <h2><Activity size={20} className="icon-pre" />{t('logSymptoms')}</h2>
          <form onSubmit={handleAddSymptom} className="symptoms-form">
            <div className="form-item">
              <label>{t('symptomsInputLabel')}</label>
              <input 
                type="text" 
                placeholder="e.g., Headache, Stomach cramp..." 
                value={symptomName} 
                onChange={e => setSymptomName(e.target.value)} 
                required
              />
            </div>

            <div className="form-item">
              <div className="severity-label-row">
                <label>{t('symptomSeverity')}</label>
                <span className={`severity-indicator-badge severity-${severity}`}>
                  {severity}
                </span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={severity} 
                onChange={e => setSeverity(e.target.value)}
                className="severity-slider"
              />
            </div>

            <div className="form-item">
              <label>{t('notes')}</label>
              <textarea 
                placeholder="Describe how you feel, triggers, or specific patterns..." 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                rows="3"
              />
            </div>

            <button type="submit" className="btn btn-primary w-full submit-log-btn">
              {t('saveSymptom')}
            </button>
          </form>
        </div>
      </div>

      {/* Visual SVG Trend Graph Card */}
      <div className="dashboard-card glass shadow-md chart-full-card">
        <div className="chart-header">
          <h2><BarChart3 size={20} className="icon-pre" />{t('vitalsTrends')}</h2>
          <div className="chart-tabs-bar">
            <button 
              className={`chart-tab ${activeChartTab === 'heartRate' ? 'active' : ''}`}
              onClick={() => setActiveChartTab('heartRate')}
            >
              {t('heartRate')}
            </button>
            <button 
              className={`chart-tab ${activeChartTab === 'bloodSugar' ? 'active' : ''}`}
              onClick={() => setActiveChartTab('bloodSugar')}
            >
              {t('bloodSugar')}
            </button>
            <button 
              className={`chart-tab ${activeChartTab === 'temp' ? 'active' : ''}`}
              onClick={() => setActiveChartTab('temp')}
            >
              {t('bodyTemp')}
            </button>
          </div>
        </div>

        <div className="svg-chart-container glass">
          {chartData.points.length === 0 ? (
            <div className="no-chart-data">
              <Clock size={36} className="text-muted" />
              <p>Not enough logs to show graph trends. Add at least one vital reading to view the chart.</p>
            </div>
          ) : (
            <svg viewBox="0 0 500 180" className="health-svg-graph">
              {/* Grid Lines */}
              <line x1="25" y1="20" x2="475" y2="20" stroke="var(--border)" strokeDasharray="3,3" />
              <line x1="25" y1="80" x2="475" y2="80" stroke="var(--border)" strokeDasharray="3,3" />
              <line x1="25" y1="140" x2="475" y2="140" stroke="var(--border)" strokeDasharray="3" />
              
              {/* Trend Polyline */}
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

              {/* Data points and labels */}
              {chartData.points.map((pt, idx) => (
                <g key={idx}>
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="5" 
                    fill={chartParams.color} 
                    stroke="var(--surface)" 
                    strokeWidth="2" 
                  />
                  <text 
                    x={pt.x} 
                    y={pt.y - 10} 
                    textAnchor="middle" 
                    fontSize="9.5" 
                    fontWeight="bold" 
                    fill="var(--text-main)"
                  >
                    {pt.value}
                  </text>
                  <text 
                    x={pt.x} 
                    y="160" 
                    textAnchor="middle" 
                    fontSize="8" 
                    fill="var(--text-muted)"
                  >
                    {pt.date.split(',')[0]}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </div>
      </div>

      {/* History Log Tables list */}
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
            {vitalsLogs.length === 0 ? (
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
                  {vitalsLogs.slice().reverse().map((log) => (
                    <tr key={log.id}>
                      <td className="date-cell">{log.date}</td>
                      <td className="vitals-values-cell">
                        {log.heartRate && <span className="tag-vital">💓 {log.heartRate} bpm</span>}
                        {log.sysBP && log.diaBP && <span className="tag-vital">🩸 {log.sysBP}/{log.diaBP} mmHg</span>}
                        {log.bloodSugar && <span className="tag-vital">🍭 {log.bloodSugar} mg/dL</span>}
                        {log.temp && <span className="tag-vital">🌡️ {log.temp}°F</span>}
                      </td>
                      <td>
                        <button className="btn-delete" onClick={() => deleteVitalLog(log.id)} title="Delete log">
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
            {symptomsLogs.length === 0 ? (
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
                  {symptomsLogs.slice().reverse().map((log) => (
                    <tr key={log.id}>
                      <td className="date-cell">{log.date}</td>
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
                        <button className="btn-delete" onClick={() => deleteSymptomLog(log.id)} title="Delete log">
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
