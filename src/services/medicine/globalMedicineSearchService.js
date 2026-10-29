/**
 * globalMedicineSearchService.js
 * 
 * Unified Global Medicine Search Service for MedWeb / ArogyaAI.
 * 
 * Orchestrates multi-market search across:
 * - India (CDSCO / NPPA)
 * - United States (US FDA / openFDA / DailyMed)
 * - United Kingdom (MHRA / dm+d)
 * - European Union (EMA)
 * - Canada (Health Canada DPD)
 * - Australia (TGA ARTG)
 * 
 * Features:
 * - Damerau-Levenshtein typo-tolerance & intelligent "Did you mean?" corrections
 * - Cross-market ingredient synonym resolution (INN, USAN, BAN)
 * - Dosage-form & strength discrepancy detection
 * - Country/market filtering with official regulatory traceability
 */

import { ALL_VERIFIED_MEDICINE_RECORDS } from './database/index';
import { IndiaCdscoAdapter } from './adapters/indiaAdapter';
import { UnitedStatesFdaAdapter } from './adapters/openFdaAdapter';
import { UnitedKingdomMhraAdapter } from './adapters/ukMhraAdapter';
import { EuropeanUnionEmaAdapter } from './adapters/emaAdapter';
import { HealthCanadaAdapter } from './adapters/healthCanadaAdapter';
import { AustraliaTgaAdapter } from './adapters/australiaTgaAdapter';
import {
  normalizeQueryString,
  extractStrength,
  extractDosageForm,
  evaluateStrengthDiscrepancy,
  getEquivalentIngredients,
  COMMON_GLOBAL_TYPOS
} from './normalization';
import {
  getDamerauLevenshteinDistance,
  isWithinTypoThreshold,
  getSimilarityRatio
} from './damerauLevenshtein';
import { SUPPORTED_MARKETS } from './types';
import { getFreeMedicineDetails } from './freeMedicineApi';

// Instantiate market adapters
const ADAPTERS = {
  IN: new IndiaCdscoAdapter(),
  US: new UnitedStatesFdaAdapter(),
  GB: new UnitedKingdomMhraAdapter(),
  EU: new EuropeanUnionEmaAdapter(),
  CA: new HealthCanadaAdapter(),
  AU: new AustraliaTgaAdapter()
};

/**
 * Generates spelling corrections and "Did you mean?" suggestions using
 * clinical typo dictionaries and Damerau-Levenshtein distance.
 */
export function getGlobalSpellingCorrection(rawQuery = '') {
  const norm = normalizeQueryString(rawQuery);
  if (!norm) {
    return { corrected: '', hasCorrection: false, didYouMean: null, suggestions: [] };
  }

  const tokens = norm.split(' ');
  const correctedTokens = [];
  let changed = false;
  const alternateSuggestions = new Set();

  for (const token of tokens) {
    // 1. Direct match in common typo dictionary
    if (COMMON_GLOBAL_TYPOS[token]) {
      const canonical = COMMON_GLOBAL_TYPOS[token];
      correctedTokens.push(canonical);
      if (canonical !== token) changed = true;
      alternateSuggestions.add(canonical);
      continue;
    }

    // 2. Check Damerau-Levenshtein against global medicine vocabulary
    let bestCandidate = null;
    let minDistance = 999;
    let maxSim = 0;

    if (token.length >= 4 && !/^\d+$/.test(token)) {
      for (const med of ALL_VERIFIED_MEDICINE_RECORDS) {
        const candidateNames = [
          med.brandName.toLowerCase().split(' ')[0],
          ...med.activeIngredients.map(i => i.name.toLowerCase().split(' ')[0]),
          ...med.aliases.map(a => a.split(' ')[0])
        ];

        for (const cand of candidateNames) {
          if (!cand || cand.length < 3) continue;

          // Check if distance is acceptable
          if (isWithinTypoThreshold(token, cand, 2)) {
            const dist = getDamerauLevenshteinDistance(token, cand);
            const sim = getSimilarityRatio(token, cand);

            if (dist < minDistance || (dist === minDistance && sim > maxSim)) {
              minDistance = dist;
              maxSim = sim;
              bestCandidate = cand;
            }

            if (sim >= 0.75) {
              alternateSuggestions.add(cand);
            }
          }
        }
      }
    }

    if (bestCandidate && minDistance <= 2) {
      correctedTokens.push(bestCandidate);
      changed = true;
    } else {
      correctedTokens.push(token);
    }
  }

  const corrected = correctedTokens.join(' ').replace(/\s+/g, ' ').trim();
  const hasCorrection = changed && corrected.toLowerCase() !== norm.toLowerCase();

  return {
    corrected,
    hasCorrection,
    didYouMean: hasCorrection ? formatCapitalized(corrected) : null,
    suggestions: Array.from(alternateSuggestions).slice(0, 5).map(formatCapitalized)
  };
}

/**
 * Primary search function across global medicine registries.
 */
export async function searchGlobalMedicines(query = '', options = {}) {
  const clean = String(query).trim();
  if (!clean) {
    return {
      query: '',
      results: [],
      total: 0,
      correction: { hasCorrection: false, didYouMean: null },
      marketsSearched: [],
      executionTimeMs: 0
    };
  }

  const startTime = Date.now();
  const normQuery = normalizeQueryString(clean);
  const queryStrength = extractStrength(clean);
  const queryDosageForm = extractDosageForm(clean);
  const targetMarket = options.market || 'ALL';
  const targetForm = options.dosageForm || null;
  const targetClass = options.legalClassification || null;
  const limit = options.limit || 25;

  // 1. Compute spelling correction
  const spelling = getGlobalSpellingCorrection(clean);

  // 2. Determine target markets
  const marketsToSearch = targetMarket === 'ALL'
    ? Object.keys(ADAPTERS)
    : (ADAPTERS[targetMarket] ? [targetMarket] : Object.keys(ADAPTERS));

  // 3. Search local index candidates
  let candidatePool = ALL_VERIFIED_MEDICINE_RECORDS.filter(med => {
    if (targetMarket !== 'ALL' && med.country !== targetMarket) {
      return false;
    }
    if (targetForm) {
      const formKey = targetForm.toLowerCase().split(/[\s/]+/)[0];
      if (!med.dosageForm.toLowerCase().includes(formKey)) {
        return false;
      }
    }
    if (targetClass) {
      if (targetClass === 'OTC' && !med.legalClassification.toLowerCase().includes('otc') && !med.legalClassification.toLowerCase().includes('general sale')) {
        return false;
      }
      if (targetClass === 'RX' && !med.legalClassification.toLowerCase().includes('prescription') && !med.legalClassification.toLowerCase().includes('pom') && !med.legalClassification.toLowerCase().includes('schedule h')) {
        return false;
      }
    }
    return true;
  });

  // 4. Score and rank every candidate record
  const scoredResults = [];

  for (const med of candidatePool) {
    const scoreObj = scoreMedicineRecord(med, normQuery, queryStrength, queryDosageForm);
    if (scoreObj.score >= 50) {
      // Evaluate strength discrepancy if requested
      const discrepancy = evaluateStrengthDiscrepancy(queryStrength, med.strength);

      scoredResults.push({
        ...med,
        searchScore: scoreObj.score,
        matchType: scoreObj.matchType,
        matchExplanation: scoreObj.explanation,
        strengthDiscrepancy: discrepancy
      });
    }
  }

  // 5. Query Free APIs via Market Adapters if no local results or querying specific international market
  if ((scoredResults.length === 0 && targetMarket === 'ALL') || (targetMarket !== 'ALL' && targetMarket !== 'IN')) {
    const adaptersToQuery = targetMarket === 'ALL'
      ? ['US']
      : (ADAPTERS[targetMarket] ? [targetMarket] : ['US']);

    for (const mCode of adaptersToQuery) {
      try {
        const liveRes = await ADAPTERS[mCode].search(clean, { limit: 5 });
        if (liveRes.success && liveRes.results.length > 0) {
          for (const liveMed of liveRes.results) {
            if (targetClass === 'OTC' && !liveMed.legalClassification?.toLowerCase().includes('otc') && !liveMed.legalClassification?.toLowerCase().includes('general sale')) {
              continue;
            }
            if (targetClass === 'RX' && !liveMed.legalClassification?.toLowerCase().includes('prescription') && !liveMed.legalClassification?.toLowerCase().includes('pom')) {
              continue;
            }
            const scoreObj = scoreMedicineRecord(liveMed, normQuery, queryStrength, queryDosageForm);
            scoredResults.push({
              ...liveMed,
              searchScore: Math.max(scoreObj.score, 65),
              matchType: scoreObj.matchType || 'free_api',
              matchExplanation: scoreObj.explanation || `Retrieved dynamically from free public APIs (${liveMed.dataSource || 'openFDA / RxNav / Wikipedia'})`,
              strengthDiscrepancy: null
            });
          }
        }
      } catch {
        // Ignore network error
      }
    }
  }

  // 6. Sort results by relevance score descending
  scoredResults.sort((a, b) => b.searchScore - a.searchScore);

  const finalResults = scoredResults.slice(0, limit);
  const executionTimeMs = Date.now() - startTime;

  return {
    query: clean,
    normalizedQuery: normQuery,
    total: finalResults.length,
    results: finalResults,
    correction: spelling,
    marketsSearched: marketsToSearch.map(m => SUPPORTED_MARKETS[m]?.name || m),
    selectedMarket: targetMarket,
    executionTimeMs
  };
}

/**
 * Multi-factor relevance scoring for global medicine records.
 */
function scoreMedicineRecord(med, normQuery, queryStrength, queryDosageForm) {
  const brandLower = med.brandName.toLowerCase();
  const genericLower = med.genericName.toLowerCase();
  const queryTokens = normQuery.split(' ').filter(Boolean);

  let maxScore = 0;
  let matchType = 'none';
  let explanation = '';

  // 1. Exact Brand Name match
  if (brandLower === normQuery) {
    return { score: 100, matchType: 'exact_brand', explanation: 'Exact brand name match' };
  }

  // 2. Exact Generic Name match
  if (genericLower === normQuery) {
    return { score: 98, matchType: 'exact_generic', explanation: 'Exact generic / nonproprietary name match' };
  }

  // 3. Exact Alias match
  for (const alias of med.aliases) {
    const aliasLower = alias.toLowerCase();
    if (aliasLower === normQuery) {
      return { score: 96, matchType: 'exact_alias', explanation: `Matched verified alias "${alias}"` };
    }
  }

  // 4. Active Ingredient match (including INN / USAN / BAN cross-equivalents)
  for (const ing of med.activeIngredients) {
    const ingLower = ing.name.toLowerCase();
    const equivalents = getEquivalentIngredients(ingLower);

    for (const eq of equivalents) {
      if (eq === normQuery) {
        return { score: 95, matchType: 'active_ingredient', explanation: `Matched active ingredient "${ing.name}"` };
      }
      if (normQuery.includes(eq) || eq.includes(normQuery)) {
        if (maxScore < 90) {
          maxScore = 90;
          matchType = 'ingredient_substring';
          explanation = `Contains active ingredient "${ing.name}"`;
        }
      }
    }
  }

  // 5. Brand prefix or substring match
  if (brandLower.startsWith(normQuery) || normQuery.startsWith(brandLower)) {
    if (maxScore < 92) {
      maxScore = 92;
      matchType = 'brand_prefix';
      explanation = 'Brand name prefix match';
    }
  } else if (brandLower.includes(normQuery)) {
    if (maxScore < 86) {
      maxScore = 86;
      matchType = 'brand_substring';
      explanation = 'Brand name substring match';
    }
  }

  // 6. Token intersection match
  let matchedTokens = 0;
  for (const token of queryTokens) {
    if (/^\d+$/.test(token)) continue; // ignore numbers for word token count

    if (
      brandLower.includes(token) ||
      genericLower.includes(token) ||
      med.aliases.some(a => a.toLowerCase().includes(token)) ||
      med.activeIngredients.some(i => i.name.toLowerCase().includes(token))
    ) {
      matchedTokens++;
    }
  }

  if (queryTokens.length > 0) {
    const tokenRatio = matchedTokens / queryTokens.length;
    if (tokenRatio >= 1 && maxScore < 84) {
      maxScore = 84;
      matchType = 'token_match';
      explanation = 'All search terms matched product record';
    } else if (tokenRatio >= 0.5 && maxScore < 72) {
      maxScore = 72;
      matchType = 'partial_token_match';
      explanation = 'Multiple search terms matched product record';
    }
  }

  // 7. Damerau-Levenshtein Fuzzy Spelling Match on Brand or Primary Ingredient
  if (maxScore < 80) {
    const primaryBrand = brandLower.split(' ')[0];
    const firstQueryWord = queryTokens[0] || '';

    if (firstQueryWord.length >= 4) {
      const dist = getDamerauLevenshteinDistance(firstQueryWord, primaryBrand);
      if (isWithinTypoThreshold(firstQueryWord, primaryBrand, 2)) {
        const sim = getSimilarityRatio(firstQueryWord, primaryBrand);
        const fuzzyScore = Math.round(75 + sim * 15);
        if (fuzzyScore > maxScore) {
          maxScore = fuzzyScore;
          matchType = 'fuzzy_spelling';
          explanation = `Typo-tolerant match for "${primaryBrand}" (distance ${dist})`;
        }
      }
    }
  }

  // Adjust score based on strength alignment
  if (queryStrength && med.strength && maxScore >= 60) {
    const prodStrength = extractStrength(med.strength);
    if (prodStrength && queryStrength.number === prodStrength.number && queryStrength.unit === prodStrength.unit) {
      maxScore = Math.min(100, maxScore + 5);
    }
  }

  // Adjust score based on dosage form alignment
  if (queryDosageForm && med.dosageForm && maxScore >= 60) {
    if (med.dosageForm.toLowerCase().includes(queryDosageForm.toLowerCase())) {
      maxScore = Math.min(100, maxScore + 4);
    }
  }

  return { score: maxScore, matchType, explanation };
}

/**
 * Returns instant autocomplete suggestions for dropdown search
 */
export function getGlobalQuickSuggestions(prefix = '', limit = 6) {
  const norm = normalizeQueryString(prefix);
  if (!norm || norm.length < 2) return [];

  const suggestions = [];
  const seen = new Set();

  for (const med of ALL_VERIFIED_MEDICINE_RECORDS) {
    const brand = med.brandName;
    const generic = med.genericName;

    if (!seen.has(brand) && brand.toLowerCase().includes(norm)) {
      seen.add(brand);
      suggestions.push({
        id: med.id,
        text: brand,
        subtext: `${med.marketFlag} ${med.strength} · ${med.market}`,
        type: 'brand',
        country: med.country
      });
    }

    if (!seen.has(generic) && generic.toLowerCase().includes(norm)) {
      seen.add(generic);
      suggestions.push({
        id: med.id,
        text: generic,
        subtext: `${med.marketFlag} ${med.dosageForm} · ${med.market}`,
        type: 'generic',
        country: med.country
      });
    }

    if (suggestions.length >= limit) break;
  }

  return suggestions;
}

/**
 * Retrieves a single medicine record by ID from all connected markets.
 */
export async function getGlobalMedicineById(id = '') {
  if (!id) return null;
  const match = ALL_VERIFIED_MEDICINE_RECORDS.find(m => m.id === id);
  if (match) return match;

  // Search through adapters
  for (const adapter of Object.values(ADAPTERS)) {
    const res = await adapter.getById(id);
    if (res) return res;
  }

  // Fallback to Free Medicine APIs
  try {
    const freeRes = await getFreeMedicineDetails(id);
    if (freeRes) return freeRes;
  } catch {
    // Ignore error
  }

  return null;
}

function formatCapitalized(str = '') {
  return str.replace(/\b[a-z]/g, c => c.toUpperCase());
}

