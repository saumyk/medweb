import { supabase } from './supabaseClient';
import { parsePrescriptionText } from './prescriptionParser';
import { enforceMaxLength } from './security';

// AGENT 1: Diagnostics & OCR Agent (Parses exact user prescription input)
export const DiagnosticsOCRAgent = {
  async processPrescription(extractedText) {
    const cleanText = enforceMaxLength(extractedText || '', 10000).trim();
    if (!cleanText || cleanText.length === 0) {
      return { success: false, medicines: [], parsedDetails: [], message: 'No prescription text provided.' };
    }

    const parsed = parsePrescriptionText(cleanText);
    const medicineNames = parsed.medicines.length > 0
      ? parsed.medicines.map((m) => m.name)
      : cleanText
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

    return { 
      success: true, 
      medicines: medicineNames,
      parsedDetails: parsed.medicines,
      metadata: parsed.metadata,
      safetyAlerts: parsed.safetyAlerts
    };
  }
};

// AGENT 2: Inventory & Supply Chain Agent (Direct Supabase query on user input)
export const InventoryAgent = {
  async checkAndAddToCart(medicineName) {
    const cleanMedicineName = enforceMaxLength(medicineName || '', 100).trim();
    if (!cleanMedicineName) {
      return { status: 'ERROR', message: 'Invalid medicine name.' };
    }

    if (!supabase) {
      // Offline fallback: simulate verified medicine inventory
      return {
        status: 'ADDED_TO_CART',
        item: {
          id: `local-${Date.now()}`,
          name: cleanMedicineName,
          price: '₹140',
        },
      };
    }

    // Queries Supabase database directly for the exact item typed by the user
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .ilike('name', `%${cleanMedicineName}%`);

    if (error) {
      return { status: 'ERROR', message: error.message };
    }

    if (!data || data.length === 0) {
      return { status: 'OUT_OF_STOCK', medicine: cleanMedicineName };
    }

    const item = data[0];
    const { data: { user } } = await supabase.auth.getUser();
    const cartRecord = {
      medicine_id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      ...(user?.id ? { user_id: user.id } : {})
    };

    const { error: cartError } = await supabase
      .from('cart')
      .insert([cartRecord]);

    if (cartError) {
      return { status: 'CART_ERROR', message: cartError.message };
    }

    return { status: 'ADDED_TO_CART', item };
  }
};

// AGENT 3: Clinical Triage Agent (Parses exact user symptoms & queries DB)
export const ClinicalTriageAgent = {
  async analyzeSymptomsAndRoute(symptomText) {
    const cleanText = enforceMaxLength(symptomText || '', 2000).toLowerCase();
    let specialty = "General Physician";

    if (cleanText.includes("heart") || cleanText.includes("chest pain") || cleanText.includes("bp")) {
      specialty = "Cardiologist";
    } else if (cleanText.includes("skin") || cleanText.includes("rash") || cleanText.includes("itching")) {
      specialty = "Dermatologist";
    } else if (cleanText.includes("pediatric") || cleanText.includes("child") || cleanText.includes("baby")) {
      specialty = "Pediatrician";
    }

    if (!supabase) {
      return {
        specialty,
        recommendedDoctor: {
          name: `Dr. Consultant (${specialty})`,
          specialty,
        },
      };
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
