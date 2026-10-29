/**
 * freeMedicineApi.js
 * 
 * Free Public Medicine APIs Integration for MedWeb / ArogyaAI.
 * 
 * Consolidates live medical details from 100% free, publicly accessible government
 * and institutional endpoints requiring NO paid subscriptions and NO private keys:
 * 
 * 1. US openFDA Drug Label & NDC Directory APIs (US Food & Drug Administration)
 *    - Official package labels, boxed warnings, indications, contraindications, dosage
 *    - Free public domain, open CORS
 * 
 * 2. NIH NLM RxNav / RxNorm REST API (US National Library of Medicine)
 *    - Normalized clinical drug naming, ingredients, RxCUIs, and typo tolerance
 *    - Free open public API, CORS enabled
 * 
 * 3. NIH DailyMed REST API (National Library of Medicine)
 *    - Official Structured Product Labeling (SPL) and packaging inserts
 *    - Free public API
 * 
 * 4. Wikimedia / Wikipedia Medical REST API (Wikimedia Foundation)
 *    - Worldwide global medicine summaries, international brand names, mechanism of action,
 *      legal classification, and pregnancy safety
 *    - Free open REST API, CORS enabled
 */

import { createUnifiedMedicineRecord } from './types';

const OPENFDA_LABEL_URL = 'https://api.fda.gov/drug/label.json';
const RXNAV_REST_URL = 'https://rxnav.nlm.nih.gov/REST';
const DAILYMED_SPLS_URL = 'https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json';
const WIKIPEDIA_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary';

/**
 * Fetch wrapper with strict timeout and AbortController
 */
export async function fetchWithTimeout(url, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Clean and truncate medical text
 */
function cleanText(text, maxSentences = 3) {
  if (!text) return '';
  const clean = String(text)
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

function textToList(text, maxItems = 5) {
  if (!text) return [];
  const cleaned = cleanText(text, maxItems + 2);
  if (!cleaned) return [];
  return cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .slice(0, maxItems);
}

function getFirstField(obj, keys) {
  for (const k of keys) {
    const val = obj?.[k];
    if (Array.isArray(val) && val[0]) return val[0];
    if (typeof val === 'string' && val.trim()) return val;
  }
  return null;
}

/**
 * FREE API 1: US openFDA Drug Label Search
 */
export async function searchOpenFda(query, limit = 5) {
  const clean = (query || '').trim();
  if (!clean) return [];

  try {
    const encoded = encodeURIComponent(clean);
    const searchExpr = `openfda.brand_name:"${encoded}"+openfda.generic_name:"${encoded}"`;
    const url = `${OPENFDA_LABEL_URL}?search=${searchExpr}&limit=${limit}`;
    const res = await fetchWithTimeout(url, 2500);
    if (!res.ok) return [];

    const data = await res.json();
    const results = data?.results || [];

    return results.map((item, idx) => {
      const openfda = item.openfda || {};
      const brand = openfda.brand_name?.[0] || clean;
      const generic = openfda.generic_name?.[0] || clean;
      const ndc = openfda.product_ndc?.[0] || null;
      const rxcui = openfda.rxcui?.[0] || null;
      const splId = item.id || null;

      const usesRaw = getFirstField(item, ['indications_and_usage', 'purpose', 'description']);
      const boxed = getFirstField(item, ['boxed_warning']);
      const dosageRaw = getFirstField(item, ['dosage_and_administration']);
      const adverse = getFirstField(item, ['adverse_reactions']);
      const contraindications = getFirstField(item, ['contraindications', 'do_not_use']);
      const warnings = getFirstField(item, ['warnings', 'precautions']);

      return createUnifiedMedicineRecord({
        id: `free-openfda-${ndc || idx}-${brand.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        brandName: brand,
        genericName: generic,
        activeIngredients: openfda.substance_name?.map(s => ({ name: s, strength: 'Per Package Label' })) || [{ name: generic, strength: 'Per Package Label' }],
        strength: 'As Labeled',
        dosageForm: openfda.dosage_form?.[0] || 'Oral Form',
        route: openfda.route?.[0] || 'Oral',
        country: 'US',
        regulatoryBody: 'US FDA',
        legalClassification: 'Prescription / Regulated',
        manufacturer: openfda.manufacturer_name?.[0] || 'Regulated Manufacturer',
        dataSource: 'US openFDA (Free Public API)',
        verificationStatus: 'VERIFIED_REGULATORY',
        approvalStatus: 'Approved (US FDA)',
        indication: usesRaw ? cleanText(usesRaw, 2) : 'Approved pharmaceutical indication as listed in official FDA labeling.',
        standardDosage: dosageRaw ? cleanText(dosageRaw, 2) : 'Consult healthcare practitioner and packaging instructions.',
        boxedWarning: boxed ? cleanText(boxed, 3) : null,
        contraindications: contraindications ? textToList(contraindications, 4) : [],
        sideEffects: adverse ? textToList(adverse, 5) : ['Adverse reactions detailed on FDA label'],
        precautions: warnings ? textToList(warnings, 4) : [],
        identifiers: {
          ndc,
          rxcui,
          splId
        },
        labelingUrl: splId ? `https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${splId}` : 'https://open.fda.gov/apis/drug/label/'
      });
    });
  } catch {
    return [];
  }
}

/**
 * FREE API 2: NIH RxNav / RxNorm Search
 */
export async function searchRxNav(query) {
  const clean = (query || '').trim();
  if (!clean) return null;

  try {
    const url = `${RXNAV_REST_URL}/approximateTerm.json?term=${encodeURIComponent(clean)}&maxEntries=4`;
    const res = await fetchWithTimeout(url, 2000);
    if (!res.ok) return null;

    const data = await res.json();
    const candidates = data?.approximateGroup?.candidate || [];
    if (!candidates.length) return null;

    const top = candidates[0];
    const rxcui = top.rxcui;

    // Fetch related names & ingredients
    const relUrl = `${RXNAV_REST_URL}/rxcui/${rxcui}/related.json?tty=IN+PIN+BN+MIN`;
    const relRes = await fetchWithTimeout(relUrl, 2000);
    const ingredients = [];
    const brands = [];

    if (relRes.ok) {
      const relData = await relRes.json();
      const groups = relData?.relatedGroup?.conceptGroup || [];
      for (const g of groups) {
        const props = g.conceptProperties || [];
        if (g.tty === 'IN' || g.tty === 'PIN') {
          for (const p of props) if (p.name && !ingredients.includes(p.name)) ingredients.push(p.name);
        } else if (g.tty === 'BN') {
          for (const p of props) if (p.name && !brands.includes(p.name)) brands.push(p.name);
        }
      }
    }

    return {
      rxcui,
      name: top.name || clean,
      score: top.score,
      ingredients,
      brands,
      dataSource: 'NIH RxNorm / RxNav (Free Public API)'
    };
  } catch {
    return null;
  }
}

/**
 * FREE API 3: Wikimedia / Wikipedia Medical Summary API
 * Global coverage: Covers Indian, UK, EU, Canadian, Australian, and worldwide medicines.
 */
export async function searchWikipediaMedicine(query) {
  const clean = (query || '').trim();
  if (!clean) return null;

  try {
    const url = `${WIKIPEDIA_SUMMARY_URL}/${encodeURIComponent(clean)}`;
    const res = await fetchWithTimeout(url, 2000);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.type === 'disambiguation' || !data.extract) {
      return null;
    }

    return {
      title: data.title,
      description: data.description || 'Pharmaceutical formulation',
      extract: data.extract,
      thumbnail: data.thumbnail?.source || null,
      pageUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(clean)}`,
      dataSource: 'Wikimedia / Wikipedia Medical Summary (Free API)'
    };
  } catch {
    return null;
  }
}

/**
 * FREE API 4: NIH DailyMed SPL Search
 */
export async function searchDailyMed(query) {
  const clean = (query || '').trim();
  if (!clean) return null;

  try {
    const url = `${DAILYMED_SPLS_URL}?drug_name=${encodeURIComponent(clean)}&pagesize=1`;
    const res = await fetchWithTimeout(url, 2000);
    if (!res.ok) return null;

    const data = await res.json();
    const item = data?.data?.[0];
    if (!item) return null;

    return {
      setId: item.setid,
      title: item.title,
      publishedDate: item.published_date,
      labelUrl: `https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${item.setid}`,
      dataSource: 'NIH DailyMed (Free Public API)'
    };
  } catch {
    return null;
  }
}

/**
 * UNIFIED FREE API ORCHESTRATOR
 * Retrieves full medicine details by combining results from all connected free APIs.
 */
export async function getFreeMedicineDetails(query) {
  const clean = String(query || '').trim();
  if (!clean) return null;

  // Run free APIs concurrently
  const [openFdaList, rxNavData, wikiData, dailyMedData] = await Promise.all([
    searchOpenFda(clean, 3).catch(() => []),
    searchRxNav(clean).catch(() => null),
    searchWikipediaMedicine(clean).catch(() => null),
    searchDailyMed(clean).catch(() => null)
  ]);

  const fdaItem = openFdaList[0] || null;

  // If none of the free APIs returned data, return null
  if (!fdaItem && !rxNavData && !wikiData && !dailyMedData) {
    return null;
  }

  // Synthesize complete details from the free API responses
  const brandName = fdaItem?.brandName || wikiData?.title || clean;
  const genericName = rxNavData?.ingredients?.[0] || fdaItem?.genericName || wikiData?.title || clean;
  const ingredients = rxNavData?.ingredients?.length ? rxNavData.ingredients : (fdaItem?.activeIngredients?.map(i => i.name) || [genericName]);
  
  const sources = [];
  if (fdaItem) sources.push('US openFDA (Free Public API)');
  if (rxNavData) sources.push('NIH RxNorm (Free Public API)');
  if (wikiData) sources.push('Wikimedia Medical (Free API)');
  if (dailyMedData) sources.push('NIH DailyMed (Free Public API)');

  const description = fdaItem?.indication
    ? [fdaItem.indication]
    : (wikiData?.extract ? textToList(wikiData.extract, 4) : ['Clinical information retrieved from open regulatory data.']);

  return {
    id: `free-api-${clean.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    name: brandName,
    searchedName: clean,
    genericName,
    formula: ingredients.join(' + '),
    ingredients,
    strength: fdaItem?.strength || 'Refer to packaging',
    dosageForm: fdaItem?.dosageForm || 'Oral / Standard Form',
    route: fdaItem?.route || 'Oral',
    manufacturer: fdaItem?.manufacturer || 'Regulated Pharmaceutical Manufacturer',
    market: fdaItem?.country || 'Global / International',
    schedule: fdaItem?.legalClassification || 'Prescription / Regulated Medicine',
    cdscoStatus: fdaItem?.approvalStatus || 'Regulated Formulation',
    category: wikiData?.description || 'Therapeutic Agent',
    description,
    boxedWarning: fdaItem?.boxedWarning || null,
    precautions: fdaItem?.precautions || ['Use only as directed by a licensed physician.'],
    doNotUse: fdaItem?.contraindications || ['Hypersensitivity or known allergy to active ingredients.'],
    interactions: ['Consult pharmacist or physician regarding concurrent medications.'],
    dosage: fdaItem?.standardDosage || 'Follow packaging instructions or physician recommendation.',
    risks: fdaItem?.sideEffects || ['Mild headache or gastrointestinal discomfort'],
    pharmacokinetics: wikiData?.extract ? cleanText(wikiData.extract, 2) : null,
    seekHelp: 'Discontinue use and seek urgent medical evaluation if severe allergic symptoms or adverse reactions occur.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Review product label and consult doctor regarding alcohol interactions.',
      pregnancy: 'CAUTION',
      pregnancyNote: 'Consult healthcare professional before use during pregnancy or lactation.'
    },
    identifiers: {
      ndc: fdaItem?.identifiers?.ndc || null,
      rxcui: rxNavData?.rxcui || null,
      splId: dailyMedData?.setId || fdaItem?.identifiers?.splId || null
    },
    sources: sources.length ? sources : ['Public Domain Medicine APIs'],
    disclaimer: 'Medicine information retrieved dynamically from free public APIs (US openFDA, NIH RxNav, NIH DailyMed, Wikimedia). Verify with a licensed medical professional before clinical use.'
  };
}
