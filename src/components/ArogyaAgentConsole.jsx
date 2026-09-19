import React, { useState } from 'react';
import { useArogyaOrchestrator } from '../hooks/useArogyaOrchestrator';
import './ArogyaAgentConsole.css';

export default function ArogyaAgentConsole() {
  const [prescriptionText, setPrescriptionText] = useState('');
  const [symptomText, setSymptomText] = useState('');
  const { logs, loading, processPrescriptionFlow, processSymptomFlow } = useArogyaOrchestrator();

  const handlePrescriptionSubmit = (e) => {
    e.preventDefault();
    if (!prescriptionText.trim()) return;
    processPrescriptionFlow(prescriptionText);
    setPrescriptionText('');
  };

  const handleSymptomSubmit = (e) => {
    e.preventDefault();
    if (!symptomText.trim()) return;
    processSymptomFlow(symptomText);
    setSymptomText('');
  };

  return (
    <div className="agent-console-container">
      <div className="agent-console-header">
        <h2 className="agent-console-title">ArogyaAI Autonomous Multi-Agent Engine</h2>
        <p className="agent-console-subtitle">Real-time user input validation across OCR, Inventory & Triage Agents</p>
      </div>

      <div className="agent-grid">
        {/* Real User Input Prescription Form */}
        <div className="agent-card">
          <h3 className="agent-card-title">Prescription OCR & Auto-Cart</h3>
          <form onSubmit={handlePrescriptionSubmit} className="agent-form-col">
            <textarea
              rows="3"
              value={prescriptionText}
              onChange={(e) => setPrescriptionText(e.target.value)}
              placeholder="Type or paste prescription medicines (one per line)..."
              className="agent-input"
            />
            <button type="submit" disabled={loading} className="agent-btn">
              Process User Prescription
            </button>
          </form>
        </div>

        {/* Real User Input Symptom Form */}
        <div className="agent-card">
          <h3 className="agent-card-title">Clinical Symptom Triage</h3>
          <form onSubmit={handleSymptomSubmit} className="agent-form-col">
            <input
              type="text"
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              placeholder="e.g. Chest pain and high blood pressure"
              className="agent-input"
            />
            <button type="submit" disabled={loading} className="agent-btn">
              Analyze User Symptoms
            </button>
          </form>
        </div>
      </div>

      {/* Execution Console Logs */}
      <div className="agent-logs-box">
        <div style={{ color: '#64748b' }}>// Live Agent Execution Logs:</div>
        {logs.map((log, idx) => (
          <div key={idx} className="agent-log-item">
            <span className="log-time">[{log.timestamp}]</span>
            <span className="log-agent">[{log.agent}]:</span>
            <span className="log-msg">{log.message}</span>
          </div>
        ))}
        {loading && <div className="log-pulse">Agents executing actions...</div>}
      </div>
    </div>
  );
}
