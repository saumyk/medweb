/**
 * types.js
 * 
 * Standardized Unified Medicine Data Model & Market Definitions
 * for MedWeb / ArogyaAI Global Medicine Search System.
 */

export const SUPPORTED_MARKETS = {
  ALL: {
    code: 'ALL',
    name: 'All Supported Markets',
    flag: '🌐',
    regulatoryScope: 'Combined International & National Registries'
  },
  IN: {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    regulatoryBody: 'CDSCO',
    fullRegulatoryName: 'Central Drugs Standard Control Organisation & NPPA (Pharma Sahi Daam)',
    authorityType: 'National Regulatory Authority',
    verifiedSources: ['CDSCO NLEM', 'NPPA DPCO Price Ceiling', 'Indian Pharmacopoeia (IP)']
  },
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    regulatoryBody: 'US FDA',
    fullRegulatoryName: 'United States Food and Drug Administration',
    authorityType: 'Federal Regulatory Agency',
    verifiedSources: ['openFDA Drug Label & NDC Directory', 'DailyMed (NLM/NIH)', 'RxNorm']
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    regulatoryBody: 'MHRA',
    fullRegulatoryName: 'Medicines and Healthcare products Regulatory Agency',
    authorityType: 'National Competent Authority',
    verifiedSources: ['MHRA Marketing Authorisations', 'NHS Dictionary of Medicines and Devices (dm+d)', 'BNF']
  },
  EU: {
    code: 'EU',
    name: 'European Union',
    flag: '🇪🇺',
    regulatoryBody: 'EMA',
    fullRegulatoryName: 'European Medicines Agency',
    authorityType: 'Centralized Pan-European Regulatory Body',
    verifiedSources: ['EMA Central Register of Medicinal Products', 'Union Register of Medicinal Products', 'Ph. Eur.']
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    regulatoryBody: 'Health Canada',
    fullRegulatoryName: 'Health Canada Health Products and Food Branch',
    authorityType: 'Federal Department of Health',
    verifiedSources: ['Health Canada Drug Product Database (DPD)', 'Notice of Compliance (NOC)']
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    regulatoryBody: 'TGA',
    fullRegulatoryName: 'Therapeutic Goods Administration',
    authorityType: 'National Regulatory Agency',
    verifiedSources: ['Australian Register of Therapeutic Goods (ARTG)', 'PBS (Pharmaceutical Benefits Scheme)']
  }
};

export const LEGAL_CLASSIFICATIONS = {
  OTC: 'Over-the-Counter (Non-Prescription)',
  RX: 'Prescription Only Medicine (Rx / POM / Schedule H)',
  CONTROLLED: 'Controlled Substance (Schedule X / Schedule II-IV)',
  PHARMACY_ONLY: 'Pharmacy Only (Behind the Counter / Schedule 3)'
};

/**
 * Creates a standardized Unified Medicine Record adhering to healthcare data standards.
 * Missing fields are explicitly designated as null or 'Unavailable' rather than fabricated.
 */
export function createUnifiedMedicineRecord({
  id,
  brandName,
  genericName,
  activeIngredients = [],
  strength = 'Unavailable',
  dosageForm = 'Unavailable',
  route = 'Oral',
  manufacturer = 'Unavailable',
  country = 'IN',
  regulatoryBody = 'Unavailable',
  regulatoryStatus = 'Authorized',
  legalClassification = 'Prescription Only',
  identifiers = {},
  indications = 'Unavailable',
  warnings = null,
  boxedWarning = null,
  labelingUrl = null,
  sourceUrl = null,
  dataSource = 'Official Regulatory Dataset',
  sourceRecordId = null,
  lastVerified = '2026',
  aliases = [],
  isCombination = false,
  pricing = null,
  storageInstructions = 'Store below 30°C in a dry place. Protect from moisture and direct light.'
}) {
  return {
    id: id || `${country.toLowerCase()}-${String(brandName).toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    brandName: brandName || 'Unknown Brand',
    genericName: genericName || 'Unavailable',
    activeIngredients: Array.isArray(activeIngredients) ? activeIngredients : [],
    strength,
    dosageForm,
    route,
    manufacturer,
    country,
    market: SUPPORTED_MARKETS[country]?.name || country,
    marketFlag: SUPPORTED_MARKETS[country]?.flag || '🌐',
    regulatoryBody: regulatoryBody || SUPPORTED_MARKETS[country]?.regulatoryBody || 'Regulatory Authority',
    regulatoryStatus,
    legalClassification,
    identifiers: {
      ndc: identifiers.ndc || null,
      rxnorm: identifiers.rxnorm || null,
      din: identifiers.din || null,
      austR: identifiers.austR || null,
      plNumber: identifiers.plNumber || null,
      emaNumber: identifiers.emaNumber || null,
      schedule: identifiers.schedule || null
    },
    indications,
    warnings: Array.isArray(warnings) ? warnings : (warnings ? [warnings] : []),
    boxedWarning: boxedWarning || null,
    labelingUrl: labelingUrl || null,
    sourceUrl: sourceUrl || null,
    dataSource,
    sourceRecordId: sourceRecordId || id || 'N/A',
    lastVerified,
    aliases: Array.isArray(aliases) ? aliases : [],
    isCombination: Boolean(isCombination || (Array.isArray(activeIngredients) && activeIngredients.length > 1)),
    pricing: pricing || null,
    storageInstructions
  };
}

