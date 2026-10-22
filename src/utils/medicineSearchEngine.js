/**
 * Intelligent Medicine Search & Clinical Recommendation Engine
 * 
 * Features:
 * - Case-insensitive, whitespace & punctuation normalization
 * - Concatenated brand+strength resolution (e.g. Dolo650 -> Dolo 650)
 * - Typo-tolerance with Levenshtein fuzzy distance & Medical Typo Dictionary
 * - Active ingredient & US/INN synonym matching (Paracetamol <=> Acetaminophen)
 * - Strength-aware search (mg, mcg, g, ml, IU)
 * - Dosage-form awareness (tablets, capsules, syrups, inhalers, injections, gels)
 * - Combination medicine decomposition (e.g. Combiflam, Augmentin 625 Duo, Pan-D, Montair-LC)
 * - "Did you mean?" intelligent spelling corrections
 * - CDSCO Indian Regulatory & NPPA Pharma Sahi Daam price integration
 * - Relevance-based multi-factor ranking & deduplication
 */

import { INDIAN_MEDICINE_DATABASE, COMMON_TYPO_MAP } from './indianMedicineDatabase';

/**
 * Computes Levenshtein distance between two strings
 */
export function getLevenshteinDistance(a = '', b = '') {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  const m = s1.length;
  const n = s2.length;
  const matrix = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) matrix[i][0] = i;
  for (let j = 0; j <= n; j++) matrix[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[m][n];
}

/**
 * Extracts strength tokens (e.g. 650, 650mg, 40mg, 500mg, 625, 50mcg, 10mg)
 */
export function extractStrength(text) {
  if (!text) return null;
  // Match patterns like "650 mg", "650mg", "625", "40 mg", "50 mcg", "100mcg"
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|iu)?\b/i);
  if (match) {
    return {
      raw: match[0],
      number: match[1],
      unit: (match[2] || '').toLowerCase()
    };
  }
  return null;
}

/**
 * Extracts dosage form (tablet, capsule, syrup, inhaler, injection, etc.)
 */
export function extractDosageForm(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (/\b(?:tablets?|tabs?)\b/.test(lower)) return 'Tablet';
  if (/\b(?:capsules?|caps?)\b/.test(lower)) return 'Capsule';
  if (/\b(?:syrups?|suspensions?|liquids?|syp)\b/.test(lower)) return 'Syrup';
  if (/\b(?:inhalers?|puffs?|mdi|rotacaps?)\b/.test(lower)) return 'Inhaler';
  if (/\b(?:injections?|inj|vials?|amps?)\b/.test(lower)) return 'Injection';
  if (/\b(?:gels?|ointments?|creams?)\b/.test(lower)) return 'Gel';
  if (/\b(?:drops?)\b/.test(lower)) return 'Drops';
  return null;
}

/**
 * Normalizes query string with spacing, punctuation, and splits joined alphanumeric tokens
 * (e.g. "Dolo650" -> "dolo 650", "metformin500mg" -> "metformin 500 mg")
 */
export function normalizeMedicineQuery(query = '') {
  if (!query) return '';
  let str = String(query).toLowerCase().trim();

  // Replace punctuation and symbols with space
  str = str.replace(/[_\-+/,:;()\[\]]/g, ' ');

  // Split concatenated letters and digits (e.g. "dolo650" -> "dolo 650", "40mg" -> "40 mg")
  str = str.replace(/([a-z])(\d)/gi, '$1 $2');
  str = str.replace(/(\d)([a-z])/gi, '$1 $2');

  // Collapse multiple whitespaces
  str = str.replace(/\s+/g, ' ').trim();
  return str;
}

/**
 * Builds all canonical tokens and evaluates typo corrections
 */
export function getSpellingCorrection(rawQuery = '') {
  const norm = normalizeMedicineQuery(rawQuery);
  if (!norm) return { corrected: '', hasCorrection: false, didYouMean: null };

  const tokens = norm.split(' ');
  let correctedTokens = [];
  let changed = false;

  for (const token of tokens) {
    if (COMMON_TYPO_MAP[token]) {
      correctedTokens.push(COMMON_TYPO_MAP[token]);
      changed = true;
    } else {
      // Check Levenshtein against all database brands and ingredients
      let bestCandidate = null;
      let minDistance = 99;

      if (token.length >= 4 && !/^\d+$/.test(token)) {
        for (const med of INDIAN_MEDICINE_DATABASE) {
          const namesToCheck = [
            med.brandName.toLowerCase().split(' ')[0],
            ...med.activeIngredients.map(i => i.name.toLowerCase().split(' ')[0]),
            ...med.aliases.map(a => a.split(' ')[0])
          ];

          for (const cand of namesToCheck) {
            if (!cand || cand.length < 3) continue;
            const dist = getLevenshteinDistance(token, cand);
            if (dist > 0 && dist <= 2 && dist < minDistance) {
              minDistance = dist;
              bestCandidate = cand;
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
  }

  const corrected = correctedTokens.join(' ').replace(/\s+/g, ' ').trim();
  return {
    corrected,
    hasCorrection: changed && corrected.toLowerCase() !== norm.toLowerCase(),
    didYouMean: changed && corrected.toLowerCase() !== norm.toLowerCase() ? formatCapitalized(corrected) : null
  };
}

export function formatCapitalized(str) {
  if (!str) return '';
  return str.replace(/\b[a-z]/g, c => c.toUpperCase());
}

/**
 * Scores a medicine candidate against the query
 */
function scoreMedicineRecord(med, queryClean, queryStrength, queryForm) {
  const queryTokens = queryClean.split(' ').filter(Boolean);
  let maxScore = 0;
  let matchType = 'none';

  const brandLower = med.brandName.toLowerCase();
  const genericLower = med.genericName.toLowerCase();
  const formLower = med.dosageForm.toLowerCase();

  // 1. Exact Brand Match
  if (brandLower === queryClean) {
    maxScore = 100;
    matchType = 'exact';
  } else if (brandLower.startsWith(queryClean) || queryClean.startsWith(brandLower)) {
    maxScore = 95;
    matchType = 'brand';
  }

  // 2. Exact or Deep Alias Match
  for (const alias of med.aliases) {
    const aliasLower = alias.toLowerCase();
    if (aliasLower === queryClean) {
      if (maxScore < 98) {
        maxScore = 98;
        matchType = 'exact';
      }
    } else if (aliasLower.startsWith(queryClean) || queryClean.startsWith(aliasLower)) {
      if (maxScore < 90) {
        maxScore = 90;
        matchType = 'brand';
      }
    }
  }

  // 3. Generic Name / Active Ingredient Match
  for (const ing of med.activeIngredients) {
    const ingName = ing.name.toLowerCase();
    const ingUs = (ing.usName || '').toLowerCase();

    if (queryClean === ingName || queryClean === ingUs) {
      if (maxScore < 96) {
        maxScore = 96;
        matchType = 'ingredient';
      }
    } else if (queryClean.includes(ingName) || (ingUs && queryClean.includes(ingUs))) {
      if (maxScore < 92) {
        maxScore = 92;
        matchType = 'ingredient';
      }
    } else if (ingName.startsWith(queryClean) || (ingUs && ingUs.startsWith(queryClean))) {
      if (maxScore < 88) {
        maxScore = 88;
        matchType = 'ingredient';
      }
    }
  }

  // 4. Token Intersection Match
  let matchedTokens = 0;
  for (const t of queryTokens) {
    if (/^\d+$/.test(t)) continue; // skip pure numbers for text token matching
    if (
      brandLower.includes(t) ||
      genericLower.includes(t) ||
      med.aliases.some(a => a.toLowerCase().includes(t))
    ) {
      matchedTokens++;
    }
  }

  if (queryTokens.length > 0) {
    const tokenRatio = matchedTokens / queryTokens.length;
    if (tokenRatio >= 1 && maxScore < 85) {
      maxScore = 85;
      matchType = 'brand';
    } else if (tokenRatio >= 0.5 && maxScore < 70) {
      maxScore = 70;
      matchType = 'brand';
    }
  }

  // 5. Typo & Levenshtein Fuzzy Match on Primary Name
  if (maxScore < 80) {
    const mainBrand = brandLower.split(' ')[0];
    const firstQueryToken = queryTokens[0] || '';
    if (firstQueryToken.length >= 4) {
      const dist = getLevenshteinDistance(firstQueryToken, mainBrand);
      if (dist <= 2) {
        const fuzzyScore = 80 - dist * 10;
        if (fuzzyScore > maxScore) {
          maxScore = fuzzyScore;
          matchType = 'fuzzy';
        }
      }
    }
  }

  // 6. Strength Bonus / Adjustment
  if (queryStrength) {
    const medStrength = extractStrength(med.strength);
    if (medStrength && medStrength.number === queryStrength.number) {
      maxScore += 18; // strong reward for exact strength match
    } else if (medStrength && medStrength.number !== queryStrength.number) {
      // Query specifically requested a different strength (e.g. searching 500 when product is 650)
      maxScore -= 15;
    }
  }

  // 7. Dosage Form Bonus / Adjustment
  if (queryForm) {
    if (formLower.includes(queryForm.toLowerCase())) {
      maxScore += 10;
    } else {
      maxScore -= 10;
    }
  }

  return { score: maxScore, matchType };
}

/**
 * Searches the Indian medicine knowledge base with intelligent ranking & filtering
 */
export function searchMedicines(rawQuery = '', options = {}) {
  const { formFilter = 'all', scheduleFilter = 'all', limit = 25 } = options;

  if (!rawQuery || !rawQuery.trim()) {
    return {
      query: '',
      normalizedQuery: '',
      correctedQuery: '',
      didYouMean: null,
      hasCorrection: false,
      results: [],
      totalCount: 0,
      sources: []
    };
  }

  const normalized = normalizeMedicineQuery(rawQuery);
  const spelling = getSpellingCorrection(rawQuery);
  const queryToSearch = spelling.hasCorrection ? spelling.corrected : normalized;

  const queryStrength = extractStrength(normalized) || extractStrength(spelling.corrected);
  const queryForm = extractDosageForm(normalized);

  const scoredList = [];

  for (const med of INDIAN_MEDICINE_DATABASE) {
    // Score against both normalized and typo-corrected queries
    const scoreNorm = scoreMedicineRecord(med, normalized, queryStrength, queryForm);
    const scoreCorr = spelling.hasCorrection
      ? scoreMedicineRecord(med, spelling.corrected, queryStrength, queryForm)
      : { score: 0, matchType: 'none' };

    const bestScore = Math.max(scoreNorm.score, scoreCorr.score);
    const matchType = scoreNorm.score >= scoreCorr.score ? scoreNorm.matchType : 'fuzzy';

    if (bestScore >= 50) {
      // Apply Form Filter
      if (formFilter !== 'all') {
        const medForm = med.dosageForm.toLowerCase();
        if (!medForm.includes(formFilter.toLowerCase())) {
          continue;
        }
      }

      // Apply Schedule / Regulatory Filter
      if (scheduleFilter !== 'all') {
        const medSched = med.schedule.toLowerCase();
        if (scheduleFilter === 'otc' && !medSched.includes('otc')) continue;
        if (scheduleFilter === 'rx' && medSched.includes('otc')) continue;
        if (scheduleFilter === 'h1' && !medSched.includes('h1')) continue;
      }

      scoredList.push({
        ...med,
        score: bestScore,
        matchType: matchType === 'none' ? 'fuzzy' : matchType
      });
    }
  }

  // Sort by score descending, then by brand name length
  scoredList.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.brandName.length - b.brandName.length;
  });

  // Collect distinct data sources
  const allSources = new Set();
  scoredList.forEach(item => {
    (item.sources || []).forEach(src => allSources.add(src));
  });

  const slicedResults = scoredList.slice(0, limit);

  return {
    query: rawQuery,
    normalizedQuery: normalized,
    correctedQuery: spelling.corrected,
    didYouMean: spelling.didYouMean,
    hasCorrection: spelling.hasCorrection,
    results: slicedResults,
    totalCount: scoredList.length,
    sources: Array.from(allSources)
  };
}

/**
 * Returns fast auto-complete suggestions while the user types in the search bar
 */
export function getQuickSuggestions(input = '', limit = 8) {
  if (!input || !input.trim() || input.trim().length < 2) {
    return [];
  }

  const normalized = normalizeMedicineQuery(input);
  const spelling = getSpellingCorrection(input);
  const searchResult = searchMedicines(input, { limit });

  const suggestions = [];

  // 1. If there's a Did You Mean correction, offer it first
  if (spelling.hasCorrection && spelling.didYouMean) {
    suggestions.push({
      type: 'spelling',
      title: spelling.didYouMean,
      subtitle: `Search for "${spelling.didYouMean}"`,
      badge: 'Did you mean?',
      query: spelling.corrected
    });
  }

  // 2. Add top matched medicine items
  for (const item of searchResult.results.slice(0, limit)) {
    suggestions.push({
      type: 'medicine',
      id: item.id,
      title: item.brandName,
      subtitle: item.genericName,
      strength: item.strength,
      form: item.dosageForm,
      manufacturer: item.manufacturer,
      schedule: item.schedule,
      price: item.nppaPricing?.mrp || item.nppaPricing?.ceilingPrice,
      matchType: item.matchType,
      item
    });
  }

  return suggestions.slice(0, limit);
}

/**
 * Returns the exact medicine record by ID or query
 */
export function getMedicineById(idOrQuery) {
  if (!idOrQuery) return null;
  const target = String(idOrQuery).toLowerCase().trim();

  // Try direct ID match
  let found = INDIAN_MEDICINE_DATABASE.find(m => m.id === target);
  if (found) return found;

  // Try brand name match
  found = INDIAN_MEDICINE_DATABASE.find(m => m.brandName.toLowerCase() === target);
  if (found) return found;

  // Try alias match
  found = INDIAN_MEDICINE_DATABASE.find(m => m.aliases.some(a => a.toLowerCase() === target));
  if (found) return found;

  // Fallback to top scored match
  const searchRes = searchMedicines(target, { limit: 1 });
  return searchRes.results[0] || null;
}
