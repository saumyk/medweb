import React, { useState } from 'react';
import { useArogyaOrchestrator } from '../hooks/useArogyaOrchestrator';
import './ArogyaAgentConsole.css'; // CSS File Import

export default function ArogyaAgentConsole() {
  const [inputText, setInputText] = useState('');
  const { logs, loading, processPrescriptionFlow, processSymptomFlow } = useArogyaOrchestrator();

  const handleSymptomSubmit = (e) => {
    e.preventDefault();
    if (!inputText) return;
    processSymptomFlow(inputText);
    setInputText('');
  };

  const handleMockPrescription = () => {
    const mockOCRText = "Paracetamol\nCetirizine";
    processPrescriptionFlow(mockOCRText);
  };

  return (
    <div className="agent-console-container">
      <div className="agent-console-header">
        <h2 className="agent-console-title">ArogyaAI Autonomous Multi-Agent Engine</h2>
        <p className="agent-console-subtitle">Real-time execution across OCR, Inventory & Triage Agents</p>
      </div>

      <div className="agent-grid">
        <div className="agent-card">
          <h3 className="agent-card-title">Prescription OCR & Auto-Cart</h3>
          <button
            onClick={handleMockPrescription}
            disabled={loading}
            className="agent-btn"
          >
            Process Prescription
          </button>
        </div>

        <div className="agent-card">
          <h3 className="agent-card-title">Clinical Symptom Triage</h3>
          <form onSubmit={handleSymptomSubmit} className="agent-form">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. Chest pain and fever"
              className="agent-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="agent-btn"
              style={{ width: 'auto' }}
            >
              Analyze
            </button>
          </form>
        </div>
      </div>

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
