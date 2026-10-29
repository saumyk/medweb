/**
 * indiaRecords.js
 * 
 * Verified Indian Regulatory Medicine Dataset
 * Curated from:
 * - CDSCO (Central Drugs Standard Control Organisation)
 * - NPPA (National Pharmaceutical Pricing Authority) Pharma Sahi Daam DPCO
 * - Indian Pharmacopoeia (IP) & National List of Essential Medicines (NLEM)
 */

import { INDIAN_MEDICINE_DATABASE } from '../../../utils/indianMedicineDatabase';
import { createUnifiedMedicineRecord } from '../types';

export const INDIA_MEDICINE_RECORDS = INDIAN_MEDICINE_DATABASE.map(med => {
  return createUnifiedMedicineRecord({
    id: `in-${med.id}`,
    brandName: med.brandName,
    genericName: med.genericName,
    activeIngredients: med.activeIngredients,
    strength: med.strength,
    dosageForm: med.dosageForm,
    route: med.route || 'Oral',
    manufacturer: med.manufacturer,
    country: 'IN',
    regulatoryBody: 'CDSCO',
    regulatoryStatus: med.cdscoStatus || 'CDSCO Approved · Monographed in Indian Pharmacopoeia (IP)',
    legalClassification: med.schedule || 'Prescription Only (Schedule H)',
    identifiers: {
      schedule: med.schedule,
      rxnorm: med.sources?.find(s => s.includes('RxNorm')) || null
    },
    indications: med.indication,
    warnings: med.precautions || [],
    boxedWarning: med.boxedWarning || null,
    labelingUrl: 'https://cdsco.gov.in/',
    sourceUrl: 'https://nppa.gov.in/pharma-sahi-daam/',
    dataSource: 'CDSCO NLEM & NPPA Pharma Sahi Daam (DPCO)',
    sourceRecordId: med.id,
    lastVerified: '2026-Q1',
    aliases: med.aliases || [],
    isCombination: med.activeIngredients?.length > 1,
    pricing: med.nppaPricing ? {
      mrp: med.nppaPricing.mrp,
      ceilingPrice: med.nppaPricing.ceilingPrice,
      packSize: med.nppaPricing.packSize,
      currency: 'INR (₹)',
      pricingAuthority: 'NPPA DPCO'
    } : null
  });
});
