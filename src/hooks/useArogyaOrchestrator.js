import { useState } from 'react';
import { DiagnosticsOCRAgent, InventoryAgent, ClinicalTriageAgent } from '../utils/agents';

export function useArogyaOrchestrator() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const logAction = (agentName, message) => {
    setLogs((prev) => [...prev, { agent: agentName, message, timestamp: new Date().toLocaleTimeString() }]);
  };

  const processPrescriptionFlow = async (rawText) => {
    setLoading(true);
    logAction("OCR Agent", "Prescription scan shuru ho gaya hai...");

    const ocrResult = await DiagnosticsOCRAgent.processPrescription(rawText);
    logAction("OCR Agent", `Medicines detect hui: ${ocrResult.medicines.join(', ')}`);

    for (const med of ocrResult.medicines) {
      logAction("Inventory Agent", `'${med}' ke liye stock check ho raha hai...`);
      const stockResult = await InventoryAgent.checkAndAddToCart(med);

      if (stockResult.status === 'ADDED_TO_CART') {
        logAction("Inventory Agent", `⚡ '${stockResult.item.name}' Cart me add ho gaya.`);
      } else {
        logAction("Inventory Agent", `⚠️ '${med}' Filhal out of stock hai.`);
      }
    }
    setLoading(false);
  };

  const processSymptomFlow = async (userPrompt) => {
    setLoading(true);
    logAction("Triage Agent", "Symptoms analyze ho rahe hain...");

    const triageResult = await ClinicalTriageAgent.analyzeSymptomsAndRoute(userPrompt);
    
    if (triageResult.recommendedDoctor) {
      logAction(
        "Triage Agent",
        `⚡ Specialty: ${triageResult.specialty}. Recommended Doctor: ${triageResult.recommendedDoctor.name}`
      );
    } else {
      logAction("Triage Agent", `Specialty: ${triageResult.specialty}. Doctor slot search in progress.`);
    }
    setLoading(false);
  };

  return { logs, loading, processPrescriptionFlow, processSymptomFlow };
}
