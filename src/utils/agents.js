import { supabase } from '../supabaseClient';

// AGENT 1: Diagnostics & OCR Agent (Parses exact user prescription input)
export const DiagnosticsOCRAgent = {
  async processPrescription(extractedText) {
    if (!extractedText || extractedText.trim().length === 0) {
      return { success: false, medicines: [], message: 'No prescription text provided.' };
    }

    // Dynamic line-by-line parsing from user input
    const detectedMedicines = extractedText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return { success: true, medicines: detectedMedicines };
  }
};

// AGENT 2: Inventory & Supply Chain Agent (Direct Supabase query on user input)
export const InventoryAgent = {
  async checkAndAddToCart(medicineName) {
    // Queries Supabase database directly for the exact item typed by the user
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .ilike('name', `%${medicineName}%`);

    if (error) {
      return { status: 'ERROR', message: error.message };
    }

    if (!data || data.length === 0) {
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

// AGENT 3: Clinical Triage Agent (Parses exact user symptoms & queries DB)
export const ClinicalTriageAgent = {
  async analyzeSymptomsAndRoute(symptomText) {
    const text = symptomText.toLowerCase();
    let specialty = "General Physician";

    if (text.includes("heart") || text.includes("chest pain") || text.includes("bp")) {
      specialty = "Cardiologist";
    } else if (text.includes("skin") || text.includes("rash") || text.includes("itching")) {
      specialty = "Dermatologist";
    } else if (text.includes("fever") || text.includes("cough") || text.includes("cold") || text.includes("headache")) {
      specialty = "General Physician";
    } else {
      specialty = "General Physician";
    }

    // Queries doctors table for the evaluated specialty
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select('*')
      .ilike('specialty', `%${specialty}%`);

    if (error || !doctors || doctors.length === 0) {
      return {
        specialty,
        recommendedDoctor: null,
        message: `No doctor found in database for ${specialty}`
      };
    }

    return {
      specialty,
      recommendedDoctor: doctors[0]
    };
  }
};
