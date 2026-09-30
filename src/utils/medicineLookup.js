/**
 * Medicine lookup: RxNorm (name → ingredients) + openFDA/DailyMed labels.
 * Never invents clinical facts. 1mg is pricing/listing only.
 */

const RXNAV_BASE = 'https://rxnav.nlm.nih.gov/REST';
const OPENFDA_LABEL = 'https://api.fda.gov/drug/label.json';
const DAILYMED_SPLS = 'https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json';

/** Indian / common brand → active ingredient INNs (US name where different). */
const INDIA_ALIASES = {
  paracetamol: ['acetaminophen'],
  pcm: ['acetaminophen'],
  crocin: ['acetaminophen'],
  dolo: ['acetaminophen'],
  calpol: ['acetaminophen'],
  combiflam: ['ibuprofen', 'acetaminophen'],
  saridon: ['acetaminophen', 'propyphenazone', 'caffeine'],
  disprin: ['aspirin'],
  cetirizine: ['cetirizine'],
  citirizine: ['cetirizine'],
  okacet: ['cetirizine'],
  allegra: ['fexofenadine'],
  augmentin: ['amoxicillin', 'clavulanate'],
  pantop: ['pantoprazole'],
  pantocid: ['pantoprazole'],
  pan: ['pantoprazole'],
  'pan-d': ['pantoprazole', 'domperidone'],
  omez: ['omeprazole'],
  aciloc: ['ranitidine'],
  ranitidine: ['ranitidine'],
  zantac: ['ranitidine'],
  digene: ['aluminum hydroxide', 'magnesium hydroxide', 'simethicone'],
  lipitor: ['atorvastatin'],
  atorva: ['atorvastatin'],
  crestor: ['rosuvastatin'],
  thyronorm: ['levothyroxine'],
  synthroid: ['levothyroxine'],
  viagra: ['sildenafil'],
  brufen: ['ibuprofen'],
  meftal: ['mefenamic acid'],
  azithral: ['azithromycin'],
  monocef: ['ceftriaxone'],
  taxim: ['cefixime'],
  stemetil: ['prochlorperazine'],
  avomine: ['promethazine'],
  montair: ['montelukast'],
  cosavil: ['acetaminophen', 'phenylephrine', 'chlorpheniramine'],
};

const US_SYNONYMS = {
  paracetamol: 'acetaminophen',
  acetaminophen: 'acetaminophen',
  'clavulanic acid': 'clavulanate',
};

function fetchWithTimeout(url, timeoutMs = 8000) {
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
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b(\d+\s*mg|\d+\s*ml|\d+)\b/gi, '')
    .replace(/\b(ds|sr|xr|er|cr|mr|forte|plus|kid|junior|suspension|tablet|tablets|capsule|capsules|syrup|injection)\b/gi, '')
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findIndiaAlias(normalized) {
  const keys = Object.keys(INDIA_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of keys) {
    if (normalized === alias || normalized.startsWith(`${alias} `) || normalized.startsWith(`${alias}-`)) {
      return { alias, ingredients: INDIA_ALIASES[alias] };
    }
  }
  return null;
}

function toUsName(name) {
  const lower = name.toLowerCase().trim();
  return US_SYNONYMS[lower] || lower;
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

async function resolveViaRxNorm(term) {
  const sources = [];
  try {
    const approxUrl = `${RXNAV_BASE}/approximateTerm.json?term=${encodeURIComponent(term)}&maxEntries=5`;
    const approxRes = await fetchWithTimeout(approxUrl, 6000);
    if (!approxRes.ok) return null;
    const approxData = await approxRes.json();
    const candidates = approxData?.approximateGroup?.candidate || [];
    if (!candidates.length) return null;

    const rxcui = candidates[0].rxcui;
    sources.push('RxNorm');

    const relatedUrl = `${RXNAV_BASE}/rxcui/${rxcui}/related.json?tty=IN+PIN+BN+MIN`;
    const relatedRes = await fetchWithTimeout(relatedUrl, 6000);
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
      // Prefer base ingredients (IN) over salt/precise forms (PIN)
      ingredients = inNames.length ? inNames : pinNames.slice(0, 3);
    }

    if (!ingredients.length) {
      const propsUrl = `${RXNAV_BASE}/rxcui/${rxcui}/properties.json`;
      const propsRes = await fetchWithTimeout(propsUrl, 4000);
      if (propsRes.ok) {
        const propsData = await propsRes.json();
        const name = propsData?.properties?.name;
        if (name) {
          displayName = name;
          ingredients = [name];
        }
      }
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

async function fetchOpenFdaByQuery(searchExpr) {
  const url = `${OPENFDA_LABEL}?search=${encodeURIComponent(searchExpr)}&limit=5`;
  const res = await fetchWithTimeout(url, 8000);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.results || [];
}

function scoreLabelMatch(med, wantedIngredients) {
  const wanted = wantedIngredients.map((n) => n.toLowerCase());
  const substances = [
    ...(med.openfda?.substance_name || []),
    ...(med.openfda?.generic_name || []),
  ].map((n) => n.toLowerCase());

  if (!substances.length) return 0;

  let score = 0;
  for (const w of wanted) {
    if (substances.some((s) => s.includes(w) || w.includes(s))) score += 10;
  }
  // Prefer fewer extra actives (plain acetaminophen over cold combo)
  const extra = substances.filter(
    (s) => !wanted.some((w) => s.includes(w) || w.includes(s))
  ).length;
  score -= extra * 4;
  if (wanted.length === 1 && substances.length === 1) score += 8;
  return score;
}

async function fetchOpenFdaLabel(ingredientNames) {
  const names = [...new Set(ingredientNames.map(toUsName).filter(Boolean))];
  if (!names.length) return null;

  let best = null;
  let bestScore = -Infinity;

  for (const name of names) {
    const encoded = `"${name}"`;
    const attempts = [
      `openfda.generic_name:${encoded}`,
      `openfda.substance_name:${encoded}`,
      `openfda.brand_name:${encoded}`,
    ];
    for (const expr of attempts) {
      try {
        const results = await fetchOpenFdaByQuery(expr);
        for (const med of results) {
          const score = scoreLabelMatch(med, names);
          if (score > bestScore) {
            bestScore = score;
            best = med;
          }
        }
        if (best && bestScore >= 10) {
          return { med: best, labelSource: 'openFDA' };
        }
      } catch {
        /* try next */
      }
    }
  }

  if (best) return { med: best, labelSource: 'openFDA' };
  return null;
}

async function fetchDailyMedThenOpenFda(drugName) {
  try {
    const dmUrl = `${DAILYMED_SPLS}?drug_name=${encodeURIComponent(drugName)}&pagesize=1`;
    const dmRes = await fetchWithTimeout(dmUrl, 8000);
    if (!dmRes.ok) return null;
    const dmData = await dmRes.json();
    const setId = dmData?.data?.[0]?.setid;
    if (!setId) return null;

    const results = await fetchOpenFdaByQuery(`set_id:"${setId}"`);
    const med = results?.[0];
    if (med) return { med, labelSource: 'DailyMed/openFDA' };
    return null;
  } catch {
    return null;
  }
}

function deriveAlcoholStatus(med) {
  const blobs = [
    firstField(med, ['drug_interactions', 'warnings', 'precautions', 'ask_doctor']),
    firstField(med, ['boxed_warning']),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!blobs) return { status: 'UNKNOWN', note: 'Not stated on this label' };
  if (/\balcohol/i.test(blobs)) {
    const snippet =
      blobs.match(/[^.]*alcohol[^.]*\.?/i)?.[0] ||
      'Label mentions alcohol; follow label advice.';
    return {
      status: 'CAUTION',
      note: cleanText(snippet, 1),
    };
  }
  return { status: 'UNKNOWN', note: 'Not stated on this label' };
}

function derivePregnancyStatus(med) {
  const pregnancy = firstField(med, ['pregnancy', 'pregnancy_or_breast_feeding']);
  const nursing = firstField(med, ['nursing_mothers']);
  const combined = [pregnancy, nursing].filter(Boolean).join(' ');
  if (!combined) return { status: 'UNKNOWN', note: 'Not stated on this label', detail: null };

  const lower = combined.toLowerCase();
  let status = 'CAUTION';
  if (
    lower.includes('contraindicated') ||
    lower.includes('do not use') ||
    lower.includes('should not be used')
  ) {
    status = 'UNSAFE';
  } else if (lower.includes('category a') || lower.includes('no evidence of risk')) {
    status = 'CAUTION';
  }

  return {
    status,
    note: cleanText(combined, 2),
    detail: cleanText(combined, 3),
  };
}

function mapLabelToResult(med, meta) {
  const openfda = med.openfda || {};
  const formula =
    meta.ingredients?.length
      ? meta.ingredients.join(', ')
      : openfda.substance_name?.join(', ') ||
        openfda.generic_name?.join(', ') ||
        'Unknown active ingredient';

  const usesRaw =
    firstField(med, ['indications_and_usage', 'purpose', 'description']);
  const description = usesRaw
    ? textToList(usesRaw, 5)
    : [];

  const boxedWarning = firstField(med, ['boxed_warning'])
    ? cleanText(firstField(med, ['boxed_warning']), 4)
    : null;

  const precautionsParts = [
    firstField(med, ['warnings']),
    firstField(med, ['precautions']),
    firstField(med, ['ask_doctor']),
    firstField(med, ['ask_doctor_or_pharmacist']),
  ].filter(Boolean);
  const precautions = precautionsParts.length
    ? textToList(precautionsParts.join(' '), 5)
    : [];

  const doNotUse = firstField(med, ['do_not_use', 'contraindications'])
    ? textToList(firstField(med, ['do_not_use', 'contraindications']), 4)
    : [];

  const interactionsRaw = firstField(med, ['drug_interactions']);
  const interactions = interactionsRaw ? textToList(interactionsRaw, 4) : [];

  const stopUse = firstField(med, ['stop_use']);
  const seekHelp = stopUse
    ? cleanText(stopUse, 3)
    : firstField(med, ['warnings'])
      ? cleanText(firstField(med, ['warnings']), 2)
      : null;

  const adverse = firstField(med, ['adverse_reactions']);
  const risks = adverse ? textToList(adverse, 6) : [];

  const dosageRaw = firstField(med, ['dosage_and_administration']);
  const dosage = dosageRaw
    ? `${cleanText(dosageRaw, 3)} Strength and pack size can differ by country; follow your prescribed product label.`
    : null;

  const howItWorks = firstField(med, [
    'mechanism_of_action',
    'clinical_pharmacology',
    'pharmacokinetics',
  ]);
  const pharmacokinetics = howItWorks ? cleanText(howItWorks, 3) : null;

  const alcohol = deriveAlcoholStatus(med);
  const pregnancy = derivePregnancyStatus(med);
  const lactation = firstField(med, ['nursing_mothers'])
    ? cleanText(firstField(med, ['nursing_mothers']), 2)
    : null;

  return {
    name: meta.displayName,
    searchedName: meta.searchedName,
    formula,
    ingredients: meta.ingredients || [],
    manufacturer:
      meta.tataInfo?.manufacturer ||
      openfda.manufacturer_name?.[0] ||
      'Various manufacturers',
    category:
      openfda.pharm_class_epc?.[0] ||
      openfda.product_type?.[0] ||
      'Medication',
    tataInfo: meta.tataInfo || null,
    description,
    boxedWarning,
    precautions,
    doNotUse,
    interactions,
    dosage,
    risks,
    pharmacokinetics,
    seekHelp,
    pregnancyDetail: pregnancy.detail || pregnancy.note,
    lactationDetail: lactation,
    safety: {
      alcohol: alcohol.status,
      alcoholNote: alcohol.note,
      pregnancy: pregnancy.status,
      pregnancyNote: pregnancy.note,
    },
    sources: meta.sources,
    disclaimer:
      'Clinical text is from US FDA labeling (openFDA/DailyMed). Indian pack inserts can differ in strength, combinations, and wording. This is not medical advice — confirm with a doctor or pharmacist.',
  };
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
 * Main entry: resolve medicine and return structured clinical result or throw.
 */
export async function lookupMedicine(rawQuery) {
  const searchedName = rawQuery.trim();
  if (!searchedName) {
    throw new Error('Empty query');
  }

  const normalized = normalizeQuery(searchedName);
  const alias = findIndiaAlias(normalized);
  const sources = [];

  const oneMgPromise = fetchOneMgListing(searchedName);

  let ingredients = [];
  let displayName = searchedName;
  let rxcui = null;

  // Known combo brands: prefer alias ingredients so Combiflam is not ibuprofen-only
  if (alias && alias.ingredients.length > 1) {
    ingredients = alias.ingredients.map(toUsName);
    displayName = alias.alias.charAt(0).toUpperCase() + alias.alias.slice(1);
    sources.push('India brand map');
  }

  const rxTerm = alias ? alias.ingredients[0] : normalized;
  const rxResult = await resolveViaRxNorm(rxTerm);

  // Also try original normalized if alias path used a synonym
  let rxFallback = null;
  if (!rxResult && alias) {
    rxFallback = await resolveViaRxNorm(normalized);
  }
  if (!rxResult && !alias) {
    // try US synonym expansion
    const us = toUsName(normalized);
    if (us !== normalized) {
      rxFallback = await resolveViaRxNorm(us);
    }
  }

  const resolved = rxResult || rxFallback;
  if (resolved) {
    rxcui = resolved.rxcui;
    if (resolved.sources) sources.push(...resolved.sources.filter((s) => !sources.includes(s)));
    if (!ingredients.length) {
      ingredients = resolved.ingredients.length
        ? resolved.ingredients
        : [toUsName(resolved.displayName)];
    }
    if (!alias || alias.ingredients.length === 1) {
      displayName = resolved.displayName || displayName;
    }
  } else if (alias && !ingredients.length) {
    ingredients = alias.ingredients.map(toUsName);
    displayName = alias.alias.charAt(0).toUpperCase() + alias.alias.slice(1);
    if (!sources.includes('India brand map')) sources.push('India brand map');
  }

  if (!ingredients.length) {
    // Last attempt: search RxNorm with raw query as-is
    const rawRx = await resolveViaRxNorm(searchedName);
    if (rawRx?.ingredients?.length) {
      ingredients = rawRx.ingredients;
      displayName = rawRx.displayName;
      rxcui = rawRx.rxcui;
      sources.push('RxNorm');
    }
  }

  if (!ingredients.length && !rxcui) {
    const tataInfo = await oneMgPromise;
    if (tataInfo) {
      // Still no clinical identity — refuse to invent facts
      throw new Error('NOT_FOUND');
    }
    throw new Error('NOT_FOUND');
  }

  let labelBundle = await fetchOpenFdaLabel(ingredients);
  if (!labelBundle) {
    for (const name of ingredients) {
      labelBundle = await fetchDailyMedThenOpenFda(name);
      if (labelBundle) break;
    }
  }
  if (!labelBundle && displayName) {
    labelBundle = await fetchDailyMedThenOpenFda(displayName);
  }

  const tataInfo = await oneMgPromise;
  if (tataInfo) sources.push('1mg (retail listing)');

  if (!labelBundle?.med) {
    throw new Error('NOT_FOUND');
  }

  if (labelBundle.labelSource && !sources.includes(labelBundle.labelSource)) {
    sources.push(labelBundle.labelSource);
  }
  if (!sources.includes('openFDA') && labelBundle.labelSource === 'openFDA') {
    sources.push('openFDA');
  }

  // Prefer resolved INN / searched brand over a mismatched 1mg product title
  const formulaTitle =
    ingredients.length > 1
      ? ingredients.map((n) => n.charAt(0).toUpperCase() + n.slice(1)).join(' + ')
      : ingredients[0]
        ? ingredients[0].charAt(0).toUpperCase() + ingredients[0].slice(1)
        : displayName;

  const oneMgName = tataInfo?.name || '';
  const oneMgLooksRelated =
    oneMgName &&
    ingredients.some((ing) => oneMgName.toLowerCase().includes(ing.toLowerCase().slice(0, 6)));

  const title =
    (alias ? searchedName.replace(/\b\w/g, (c) => c.toUpperCase()) : null) ||
    (oneMgLooksRelated ? oneMgName : null) ||
    formulaTitle;

  return mapLabelToResult(labelBundle.med, {
    displayName: title,
    searchedName,
    ingredients,
    tataInfo,
    sources: [...new Set(sources)],
  });
}
