import React, { useState } from 'react';
import { useArogyaOrchestrator } from '../hooks/useArogyaOrchestrator';

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
    <div className="max-w-2xl mx-auto my-8 p-6 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700">
      <h2 className="text-xl font-bold text-emerald-400 mb-2">ArogyaAI Autonomous Multi-Agent Engine</h2>
      <p className="text-xs text-slate-400 mb-6">Real-time execution across OCR, Inventory & Triage Agents</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h3 className="font-semibold text-emerald-300 text-sm mb-2">Prescription OCR & Auto-Cart</h3>
          <button
            onClick={handleMockPrescription}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded text-sm font-medium transition"
          >
            Process Prescription
          </button>
        </div>

        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h3 className="font-semibold text-emerald-300 text-sm mb-2">Clinical Symptom Triage</h3>
          <form onSubmit={handleSymptomSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. Chest pain and fever"
              className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-xs transition"
            >
              Analyze
            </button>
          </form>
        </div>
      </div>

      <div className="bg-black/50 p-4 rounded-lg border border-slate-800 h-64 overflow-y-auto font-mono text-xs space-y-2">
        <div className="text-slate-500">// Live Agent Execution Logs:</div>
        {logs.map((log, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="text-slate-500">[{log.timestamp}]</span>
            <span className="text-emerald-400 font-semibold">[{log.agent}]:</span>
            <span className="text-slate-200">{log.message}</span>
          </div>
        ))}
        {loading && <div className="text-yellow-400 animate-pulse">Agents executing actions...</div>}
      </div>
    </div>
  );
}
