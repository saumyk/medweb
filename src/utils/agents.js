import { supabase } from '../supabaseClient';

// AGENT 1: Diagnostics & OCR Agent
export const DiagnosticsOCRAgent = {
  async processPrescription(extractedText) {
    const lines = extractedText.split('\n');
    const detectedMedicines = lines.filter(line => line.trim().length > 0);
    return { success: true, medicines: detectedMedicines };
  }
};

// AGENT 2: Inventory & Supply Chain Agent
export const InventoryAgent = {
  async checkAndAddToCart(medicineName) {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .ilike('name', `%${medicineName}%`);

    if (error || !data || data.length === 0) {
      return { status: 'OUT_OF_STOCK', medicine: medicineName };
    }

    const item = data[0];
    const { error: cartError } = await supabase
      .from('cart')
      .insert([{ medicine_id: item.id, name: item.name, price: item.price, quantity: 1 }]);

    if (cartError) {
      return { status: 'CART_ERROR', message: cartError.message };
    }

    return { status: 'ADDED_TO_CART', item };
  }
};

// AGENT 3: Clinical Triage Agent
export const ClinicalTriageAgent = {
  async analyzeSymptomsAndRoute(symptomText) {
    const text = symptomText.toLowerCase();
    let specialty = "General Physician";

    if (text.includes("fever") || text.includes("cough") || text.includes("cold")) {
      specialty = "General Physician";
    } else if (text.includes("heart") || text.includes("chest pain")) {
      specialty = "Cardiologist";
    } else if (text.includes("skin") || text.includes("rash")) {
      specialty = "Dermatologist";
    }

    const { data: doctors } = await supabase
      .from('doctors')
      .select('*')
      .ilike('specialty', `%${specialty}%`);

    return {
      specialty,
      recommendedDoctor: doctors && doctors.length > 0 ? doctors[0] : null
    };
  }
};
