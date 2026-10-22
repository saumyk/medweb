/**
 * Unified Medicine Intelligence Pipeline
 * Integrates:
 * - Indian Medicine Knowledge Base (CDSCO schedules, NPPA DPCO pricing, IP formulations)
 * - Intelligent Search Engine (Typo-tolerance, fuzzy matching, strength awareness)
 * - RxNorm (NIH RxNav NLM standardized clinical drug concepts & RxCUIs)
 * - US openFDA & DailyMed (official pharmaceutical label monographs & warnings)
 * - 1mg retail listing proxy for real-time market availability
 */

import {
  searchMedicines,
  getQuickSuggestions,
  getMedicineById,
  normalizeMedicineQuery,
  getSpellingCorrection,
  formatCapitalized
} from './medicineSearchEngine';
import { INGREDIENT_SYNONYMS } from './indianMedicineDatabase';

export {
  searchMedicines,
  getQuickSuggestions,
  getMedicineById,
  normalizeMedicineQuery,
  getSpellingCorrection
};

const RXNAV_BASE = 'https://rxnav.nlm.nih.gov/REST';
const OPENFDA_LABEL = 'https://api.fda.gov/drug/label.json';
const DAILYMED_SPLS = 'https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json';



function fetchWithTimeout(url, timeoutMs = 4500) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error('Timeout'));
    }, timeoutMs);

    fetch(url, { signal: controller.signal })
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function normalizeQuery(query) {
  return normalizeMedicineQuery(query);
}

function toUsName(name) {
  const lower = (name || '').toLowerCase().trim();
  return INGREDIENT_SYNONYMS[lower] || lower;
}

function cleanText(text, maxSentences = 3) {
  if (!text) return '';
  let clean = String(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const sentences = clean.split(/(?<=[.!?])\s+/).filter((s) => s.length > 0);
  const sliced = sentences.slice(0, maxSentences).join(' ');
  if (!sliced) return '';
  return sliced.endsWith('.') || sliced.endsWith('!') || sliced.endsWith('?')
    ? sliced
    : `${sliced}.`;
}

function textToList(text, maxItems = 6) {
  if (!text) return [];
  const cleaned = cleanText(text, maxItems + 2);
  if (!cleaned) return [];
  const parts = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
  return parts.slice(0, maxItems);
}

function firstField(med, keys) {
  for (const key of keys) {
    const val = med?.[key];
    if (Array.isArray(val) && val[0]) return val[0];
    if (typeof val === 'string' && val.trim()) return val;
  }
  return null;
}

/**
 * Queries RxNorm for concepts
 */
async function resolveViaRxNorm(term) {
  try {
    const approxUrl = `${RXNAV_BASE}/approximateTerm.json?term=${encodeURIComponent(term)}&maxEntries=5`;
    const approxRes = await fetchWithTimeout(approxUrl, 3500);
    if (!approxRes.ok) return null;
    const approxData = await approxRes.json();
    const candidates = approxData?.approximateGroup?.candidate || [];
    if (!candidates.length) return null;

    const rxcui = candidates[0].rxcui;
    const sources = ['RxNorm Concept'];

    const relatedUrl = `${RXNAV_BASE}/rxcui/${rxcui}/related.json?tty=IN+PIN+BN+MIN`;
    const relatedRes = await fetchWithTimeout(relatedUrl, 3500);
    let ingredients = [];
    let brands = [];
    let displayName = term;

    if (relatedRes.ok) {
      const relatedData = await relatedRes.json();
      const groups = relatedData?.relatedGroup?.conceptGroup || [];
      const inNames = [];
      const pinNames = [];
      for (const group of groups) {
        const concepts = group.conceptProperties || [];
        if (group.tty === 'IN') {
          for (const c of concepts) {
            if (c.name && !inNames.includes(c.name)) inNames.push(c.name);
          }
        } else if (group.tty === 'PIN') {
          for (const c of concepts) {
            if (c.name && !pinNames.includes(c.name)) pinNames.push(c.name);
          }
        }
        if (group.tty === 'BN') {
          for (const c of concepts) {
            if (c.name && !brands.includes(c.name)) brands.push(c.name);
          }
        }
        if (group.tty === 'MIN' && concepts[0]?.name) {
          displayName = concepts[0].name;
        }
      }
      ingredients = inNames.length ? inNames : pinNames.slice(0, 3);
    }

    return {
      rxcui,
      displayName,
      ingredients: ingredients.map(toUsName),
      brands,
      sources,
    };
  } catch {
    return null;
  }
}

/**
 * Queries openFDA label API
 */
async function fetchOpenFdaByQuery(searchExpr) {
  try {
    const url = `${OPENFDA_LABEL}?search=${encodeURIComponent(searchExpr)}&limit=3`;
    const res = await fetchWithTimeout(url, 4000);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.results || [];
  } catch {
    return null;
  }
}

async function fetchOpenFdaLabel(ingredientNames) {
  const names = [...new Set(ingredientNames.map(toUsName).filter(Boolean))];
  if (!names.length) return null;

  for (const name of names) {
    const attempts = [
      `openfda.generic_name:"${name}"`,
      `openfda.substance_name:"${name}"`,
      `openfda.brand_name:"${name}"`
    ];
    for (const expr of attempts) {
      try {
        const results = await fetchOpenFdaByQuery(expr);
        if (results && results[0]) {
          return { med: results[0], labelSource: 'US openFDA' };
        }
      } catch {
        /* try next */
      }
    }
  }
  return null;
}

async function fetchDailyMedThenOpenFda(drugName) {
  try {
    const dmUrl = `${DAILYMED_SPLS}?drug_name=${encodeURIComponent(drugName)}&pagesize=1`;
    const dmRes = await fetchWithTimeout(dmUrl, 3500);
    if (!dmRes.ok) return null;
    const dmData = await dmRes.json();
    const setId = dmData?.data?.[0]?.setid;
    if (!setId) return null;

    const results = await fetchOpenFdaByQuery(`set_id:"${setId}"`);
    const med = results?.[0];
    if (med) return { med, labelSource: 'DailyMed / openFDA' };
    return null;
  } catch {
    return null;
  }
}

async function fetchOneMgListing(query) {
  try {
    const tataUrl = encodeURIComponent(
      `https://www.1mg.com/api/v1/search/autocomplete?name=${query}`
    );
    const tataProxyUrl = `https://api.allorigins.win/get?url=${tataUrl}`;
    const res = await fetchWithTimeout(tataProxyUrl, 1500);
    if (!res.ok) return null;
    const proxyData = await res.json();
    if (!proxyData.contents) return null;
    const tataData = JSON.parse(proxyData.contents);
    const drug = tataData.results?.find((r) => r.type === 'drug' && r.price);
    if (!drug) return null;
    return {
      price: drug.price,
      discountPrice: drug.discounted_price,
      packSize: drug.pack_size_label,
      manufacturer: drug.manufacturer_name,
      name: String(drug.name || '').replace(/<[^>]*>?/gm, ''),
      url: `https://www.1mg.com${drug.url_path}`,
    };
  } catch {
    return null;
  }
}

/**
 * Formats a local Indian medicine record into the standard monograph object
 */
function formatLocalMedicineMonograph(localMed, searchedName, externalLabel, tataInfo) {
  const sources = [...(localMed.sources || [])];
  if (tataInfo) sources.push('1mg (Retail Listing)');
  if (externalLabel?.labelSource) sources.push(externalLabel.labelSource);

  // If external openFDA has extra boxed warnings or pharmacokinetics, merge gracefully
  const externalMed = externalLabel?.med;
  const fdaBoxed = externalMed ? firstField(externalMed, ['boxed_warning']) : null;
  const fdaPharmacokinetics = externalMed ? firstField(externalMed, ['mechanism_of_action', 'clinical_pharmacology']) : null;

  return {
    id: localMed.id,
    name: localMed.brandName,
    searchedName: searchedName,
    genericName: localMed.genericName,
    formula: localMed.activeIngredients.map(i => `${i.name} ${i.strength}`).join(' + ') || localMed.genericName,
    ingredients: localMed.activeIngredients.map(i => i.name),
    strength: localMed.strength,
    dosageForm: localMed.dosageForm,
    route: localMed.route,
    manufacturer: localMed.manufacturer,
    market: localMed.market,
    schedule: localMed.schedule,
    cdscoStatus: localMed.cdscoStatus,
    nppaPricing: localMed.nppaPricing,
    category: localMed.category,
    tataInfo: tataInfo || (localMed.nppaPricing ? {
      price: localMed.nppaPricing.ceilingPrice,
      packSize: localMed.nppaPricing.packSize,
      manufacturer: localMed.manufacturer
    } : null),
    description: localMed.description || [localMed.indication],
    boxedWarning: localMed.boxedWarning || (fdaBoxed ? cleanText(fdaBoxed, 4) : null),
    precautions: localMed.precautions || [],
    doNotUse: localMed.doNotUse || [],
    interactions: localMed.interactions || [],
    dosage: localMed.instructions ? `${localMed.instructions} Standard dosage: ${localMed.standardDosage || 'As directed by physician.'}` : localMed.standardDosage,
    risks: localMed.sideEffects || [],
    pharmacokinetics: localMed.pharmacokinetics || (fdaPharmacokinetics ? cleanText(fdaPharmacokinetics, 3) : null),
    seekHelp: localMed.seekHelp || 'Stop use and seek immediate medical assistance if severe adverse effects or allergic reactions occur.',
    pregnancyDetail: localMed.safety?.pregnancyNote || null,
    lactationDetail: localMed.safety?.lactationNote || null,
    safety: {
      alcohol: localMed.safety?.alcohol || 'CAUTION',
      alcoholNote: localMed.safety?.alcoholNote || 'Consult doctor before combining with alcohol.',
      pregnancy: localMed.safety?.pregnancy || 'CAUTION',
      pregnancyNote: localMed.safety?.pregnancyNote || 'Consult doctor before using during pregnancy.'
    },
    sources: [...new Set(sources)],
    disclaimer: 'Clinical monograph compiled from CDSCO, NPPA, Indian Pharmacopoeia, and US FDA labeling. For informational and healthcare hackathon reference only. Strictly confirm all prescriptions with a licensed physician or registered pharmacist.'
  };
}

/**
 * Main entry: resolve medicine and return structured clinical result or throw.
 * Backwards compatible with existing lookupMedicine(rawQuery) callers!
 */
export async function lookupMedicine(rawQuery) {
  const searchedName = (rawQuery || '').trim();
  if (!searchedName) {
    throw new Error('Empty query');
  }

  // 1. First, search local Indian Medicine Knowledge Base
  const localMatch = getMedicineById(searchedName);
  const oneMgPromise = fetchOneMgListing(searchedName);

  if (localMatch) {
    // Attempt non-blocking external enrichment for FDA labels
    let externalLabel = null;
    try {
      const ingNames = localMatch.activeIngredients.map(i => i.usName || i.name);
      externalLabel = await fetchOpenFdaLabel(ingNames);
    } catch {
      /* ignore timeout, local data is complete */
    }

    const tataInfo = await oneMgPromise;
    return formatLocalMedicineMonograph(localMatch, searchedName, externalLabel, tataInfo);
  }

  // 2. If not found in local DB, attempt intelligent search
  const searchResults = searchMedicines(searchedName, { limit: 1 });
  if (searchResults.results.length > 0 && searchResults.results[0].score >= 70) {
    const topMatch = searchResults.results[0];
    let externalLabel = null;
    try {
      const ingNames = topMatch.activeIngredients.map(i => i.usName || i.name);
      externalLabel = await fetchOpenFdaLabel(ingNames);
    } catch {
      /* ignore */
    }
    const tataInfo = await oneMgPromise;
    return formatLocalMedicineMonograph(topMatch, searchedName, externalLabel, tataInfo);
  }

  // 3. Fallback: External RxNorm + openFDA / DailyMed Pipeline
  const normalized = normalizeMedicineQuery(searchedName);
  const rxResult = await resolveViaRxNorm(normalized);
  const rxTerm = rxResult?.ingredients?.[0] || toUsName(normalized);

  let labelBundle = await fetchOpenFdaLabel(rxResult?.ingredients || [rxTerm]);
  if (!labelBundle) {
    labelBundle = await fetchDailyMedThenOpenFda(rxTerm);
  }
  if (!labelBundle && rxResult?.displayName) {
    labelBundle = await fetchDailyMedThenOpenFda(rxResult.displayName);
  }

  const tataInfo = await oneMgPromise;

  if (labelBundle?.med) {
    const med = labelBundle.med;
    const openfda = med.openfda || {};
    const ingredients = rxResult?.ingredients || openfda.generic_name || [normalized];
    const sources = ['openFDA', ...(rxResult?.sources || [])];
    if (tataInfo) sources.push('1mg (Retail Listing)');

    const usesRaw = firstField(med, ['indications_and_usage', 'purpose', 'description']);
    const boxed = firstField(med, ['boxed_warning']);
    const adverse = firstField(med, ['adverse_reactions']);
    const dosageRaw = firstField(med, ['dosage_and_administration']);
    const interactionsRaw = firstField(med, ['drug_interactions']);
    const stopUse = firstField(med, ['stop_use', 'warnings']);

    return {
      name: rxResult?.displayName || formatCapitalized(searchedName),
      searchedName,
      genericName: ingredients.join(', '),
      formula: ingredients.join(', '),
      ingredients,
      strength: 'Consult product packaging',
      dosageForm: 'Oral / Standard Form',
      route: 'Oral',
      manufacturer: tataInfo?.manufacturer || openfda.manufacturer_name?.[0] || 'Various Manufacturers',
      market: 'Global / US FDA',
      schedule: 'Prescription / Regulated',
      cdscoStatus: 'International Labeling Record',
      category: openfda.pharm_class_epc?.[0] || 'Medication',
      tataInfo,
      description: usesRaw ? textToList(usesRaw, 5) : ['Approved clinical uses available on official product label.'],
      boxedWarning: boxed ? cleanText(boxed, 4) : null,
      precautions: textToList(firstField(med, ['warnings', 'precautions']) || '', 4),
      doNotUse: textToList(firstField(med, ['do_not_use', 'contraindications']) || '', 4),
      interactions: interactionsRaw ? textToList(interactionsRaw, 4) : [],
      dosage: dosageRaw ? cleanText(dosageRaw, 3) : 'Follow the dosage and administration directions on the prescribed package.',
      risks: adverse ? textToList(adverse, 6) : ['Mild gastrointestinal upset', 'Headache'],
      pharmacokinetics: firstField(med, ['mechanism_of_action', 'pharmacokinetics']) ? cleanText(firstField(med, ['mechanism_of_action', 'pharmacokinetics']), 3) : null,
      seekHelp: stopUse ? cleanText(stopUse, 3) : 'Seek immediate medical attention if allergic reactions occur.',
      pregnancyDetail: null,
      lactationDetail: null,
      safety: {
        alcohol: 'CAUTION',
        alcoholNote: 'Check package label and follow advice of healthcare provider.',
        pregnancy: 'CAUTION',
        pregnancyNote: 'Follow doctor advice during pregnancy.'
      },
      sources: [...new Set(sources)],
      disclaimer: 'Clinical information retrieved from US FDA labeling (openFDA / DailyMed) and RxNorm concepts. Always confirm with a qualified healthcare practitioner.'
    };
  }

  throw new Error('NOT_FOUND');
}
