/**
 * normalization.js
 * 
 * Clinical normalization and ingredient synonym mappings for global medicines.
 * Maps British Approved Names (BAN), International Nonproprietary Names (INN),
 * and United States Adopted Names (USAN).
 */

export const GLOBAL_INGREDIENT_SYNONYMS = {
  // Paracetamol / Acetaminophen (UK/India/EU/Aus vs US/Japan)
  'paracetamol': 'acetaminophen',
  'acetaminophen': 'paracetamol',
  'apap': 'paracetamol',

  // Salbutamol / Albuterol (UK/India/EU/Aus vs US)
  'salbutamol': 'albuterol',
  'albuterol': 'salbutamol',

  // Adrenaline / Epinephrine
  'adrenaline': 'epinephrine',
  'epinephrine': 'adrenaline',

  // Noradrenaline / Norepinephrine
  'noradrenaline': 'norepinephrine',
  'norepinephrine': 'noradrenaline',

  // Frusemide / Furosemide (Former BAN vs INN/USAN)
  'frusemide': 'furosemide',
  'furosemide': 'frusemide',

  // Co-amoxiclav / Amoxicillin + Clavulanate
  'co-amoxiclav': 'amoxicillin and clavulanate potassium',
  'coamoxiclav': 'amoxicillin and clavulanate potassium',
  'augmentin': 'amoxicillin and clavulanate potassium',

  // Co-codamol / Paracetamol + Codeine
  'co-codamol': 'paracetamol and codeine',
  'cocodamol': 'paracetamol and codeine',

  // Lignocaine / Lidocaine
  'lignocaine': 'lidocaine',
  'lidocaine': 'lignocaine',

  // Hyoscine / Scopolamine
  'hyoscine': 'scopolamine',
  'scopolamine': 'hyoscine',

  // Bendrofluazide / Bendroflumethiazide
  'bendrofluazide': 'bendroflumethiazide',
  'bendroflumethiazide': 'bendrofluazide',

  // Dothiepin / Dosulepin
  'dothiepin': 'dosulepin',
  'dosulepin': 'dothiepin',

  // Vitamins
  'cholecalciferol': 'vitamin d3',
  'vitamin d3': 'cholecalciferol',
  'cyanocobalamin': 'vitamin b12',
  'vitamin b12': 'cyanocobalamin',
  'ascorbic acid': 'vitamin c',
  'vitamin c': 'ascorbic acid',
  'calcium carbonate': 'calcium',
  'elemental calcium': 'calcium'
};

export const COMMON_GLOBAL_TYPOS = {
  // Paracetamol / Acetaminophen
  'paracetmol': 'paracetamol',
  'paracitamol': 'paracetamol',
  'paracetamoll': 'paracetamol',
  'paracetoaml': 'paracetamol',
  'parcetamol': 'paracetamol',
  'acetominophen': 'acetaminophen',
  'acetaminofen': 'acetaminophen',
  'acetamophen': 'acetaminophen',
  'tylenol': 'tylenol',
  'tylenole': 'tylenol',
  'panadol': 'panadol',
  'panadoll': 'panadol',
  'dolo': 'dolo',
  'dollo': 'dolo',
  'crocin': 'crocin',
  'crocine': 'crocin',

  // Amoxicillin / Antibiotics
  'amoxilin': 'amoxicillin',
  'amoxicilin': 'amoxicillin',
  'amoxcillin': 'amoxicillin',
  'amoxil': 'amoxil',
  'augmentin': 'augmentin',
  'augumentin': 'augmentin',
  'azithromycin': 'azithromycin',
  'azithromicin': 'azithromycin',
  'azithral': 'azithral',
  'ciprofloxacin': 'ciprofloxacin',
  'ciprofloxacine': 'ciprofloxacin',

  // NSAIDs & Pain
  'ibuprofen': 'ibuprofen',
  'ibuprophen': 'ibuprofen',
  'ibubrofen': 'ibuprofen',
  'advil': 'advil',
  'motrin': 'motrin',
  'nurofen': 'nurofen',
  'combiflam': 'combiflam',
  'combiflan': 'combiflam',
  'aspirin': 'aspirin',
  'asprin': 'aspirin',
  'disprin': 'disprin',
  'naproxen': 'naproxen',
  'naprosyn': 'naproxen',
  'aleve': 'aleve',

  // Acid suppression / GI
  'omeprazole': 'omeprazole',
  'omeprazol': 'omeprazole',
  'prilosec': 'prilosec',
  'pantoprazole': 'pantoprazole',
  'pantoprazol': 'pantoprazole',
  'pantocid': 'pantocid',
  'pantosec': 'pantocid',
  'ranitidine': 'ranitidine',
  'aciloc': 'aciloc',

  // Allergies & Respiratory
  'cetirizine': 'cetirizine',
  'cetrizine': 'cetirizine',
  'ceterizine': 'cetirizine',
  'zyrtec': 'zyrtec',
  'claritin': 'claritin',
  'loratadine': 'loratadine',
  'loratidine': 'loratadine',
  'allegra': 'allegra',
  'fexofenadine': 'fexofenadine',
  'salbutamol': 'salbutamol',
  'albuterol': 'albuterol',
  'ventolin': 'ventolin',
  'asthalin': 'asthalin',

  // Cardiovascular & Metabolic
  'atorvastatin': 'atorvastatin',
  'atorvastatine': 'atorvastatin',
  'lipitor': 'lipitor',
  'metformin': 'metformin',
  'metformine': 'metformin',
  'glucophage': 'glucophage',
  'glycomet': 'glycomet',
  'amlodipine': 'amlodipine',
  'norvasc': 'norvasc',
  'losartan': 'losartan',
  'cozaar': 'cozaar',
  'telmisartan': 'telmisartan',
  'telma': 'telma',
  'levothyroxine': 'levothyroxine',
  'synthroid': 'synthroid',
  'thyronorm': 'thyronorm'
};

/**
 * Normalizes query string with spacing, punctuation, and splits joined alphanumeric tokens.
 */
export function normalizeQueryString(query = '') {
  if (!query) return '';
  let str = String(query).toLowerCase().trim();

  // Replace punctuation and symbols with space
  str = str.replace(/[_\-+/,:;()[\]]/g, ' ');

  // Split concatenated letters and digits (e.g. "dolo650" -> "dolo 650", "amoxil500mg" -> "amoxil 500 mg")
  str = str.replace(/([a-z])(\d)/gi, '$1 $2');
  str = str.replace(/(\d)([a-z])/gi, '$1 $2');

  // Collapse multiple whitespaces
  str = str.replace(/\s+/g, ' ').trim();
  return str;
}

/**
 * Extracts strength tokens (number and unit) from text
 */
export function extractStrength(text = '') {
  if (!text) return null;
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|iu|%)\b/i);
  if (match) {
    return {
      raw: match[0].toLowerCase(),
      number: parseFloat(match[1]),
      unit: (match[2] || '').toLowerCase()
    };
  }
  return null;
}

/**
 * Extracts dosage form (Tablet, Capsule, Syrup, Inhaler, Injection, etc.)
 */
export function extractDosageForm(text = '') {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (/\b(?:tablets?|tabs?|caplets?)\b/.test(lower)) return 'Tablet';
  if (/\b(?:capsules?|caps?)\b/.test(lower)) return 'Capsule';
  if (/\b(?:syrups?|suspensions?|liquids?|elixirs?|solutions?)\b/.test(lower)) return 'Syrup / Liquid';
  if (/\b(?:inhalers?|puffs?|mdi|rotacaps?|aerosols?)\b/.test(lower)) return 'Inhaler';
  if (/\b(?:injections?|inj|vials?|amps?|infusions?)\b/.test(lower)) return 'Injection';
  if (/\b(?:gels?|ointments?|creams?|topicals?)\b/.test(lower)) return 'Topical / Cream';
  if (/\b(?:drops?|eye\s*drops?|ear\s*drops?)\b/.test(lower)) return 'Drops';
  return null;
}

/**
 * Checks if a queried strength differs significantly from a product's verified strength
 */
export function evaluateStrengthDiscrepancy(queryStrength, productStrength) {
  if (!queryStrength || !productStrength) return null;
  const prodParsed = extractStrength(productStrength);
  if (!prodParsed) return null;

  if (
    queryStrength.unit &&
    prodParsed.unit &&
    queryStrength.unit === prodParsed.unit &&
    queryStrength.number !== prodParsed.number
  ) {
    return {
      requested: `${queryStrength.number} ${queryStrength.unit}`,
      verified: productStrength,
      message: `You searched for ${queryStrength.number} ${queryStrength.unit}, but this verified product formulation is ${productStrength}.`
    };
  }
  return null;
}

/**
 * Returns equivalent ingredient names across INN, USAN, and BAN.
 */
export function getEquivalentIngredients(name = '') {
  const clean = name.toLowerCase().trim();
  const eq = GLOBAL_INGREDIENT_SYNONYMS[clean];
  if (eq) {
    return [clean, eq];
  }
  return [clean];
}

