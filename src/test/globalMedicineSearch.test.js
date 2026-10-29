import { describe, it, expect } from 'vitest';
import {
  searchGlobalMedicines,
  getGlobalSpellingCorrection,
  getGlobalQuickSuggestions,
  getGlobalMedicineById
} from '../services/medicine/globalMedicineSearchService';
import {
  getFreeMedicineDetails,
  searchOpenFda,
  searchWikipediaMedicine
} from '../services/medicine/freeMedicineApi';
import {
  getDamerauLevenshteinDistance,
  isWithinTypoThreshold
} from '../services/medicine/damerauLevenshtein';
import {
  GLOBAL_INGREDIENT_SYNONYMS
} from '../services/medicine/normalization';

describe('Global Medicine Search & Free Public APIs System Tests', () => {

  describe('1. Damerau-Levenshtein Distance & Typo Tolerance', () => {
    it('detects adjacent transpositions correctly with distance 1', () => {
      // In classic Levenshtein, transposition of adjacent characters is distance 2.
      // In Damerau-Levenshtein, transposition is distance 1!
      expect(getDamerauLevenshteinDistance('paracetamlo', 'paracetamol')).toBe(1); // 'ol' transposed to 'lo'
      expect(getDamerauLevenshteinDistance('avdil', 'advil')).toBe(1); // 'dv' transposed to 'vd'
      expect(getDamerauLevenshteinDistance('tylenlo', 'tylenol')).toBe(1); // 'ol' transposed to 'lo'
    });

    it('handles insertions, deletions, and substitutions', () => {
      expect(getDamerauLevenshteinDistance('paracetmol', 'paracetamol')).toBe(1); // deletion of 'a'
      expect(getDamerauLevenshteinDistance('paracetamoll', 'paracetamol')).toBe(1); // insertion of 'l'
      expect(getDamerauLevenshteinDistance('amoxilin', 'amoxicillin')).toBe(3); // missing 'c', 'i', 'l'
    });

    it('enforces length-adaptive thresholds', () => {
      // For short words (< 4 chars), distance > 0 is rejected
      expect(isWithinTypoThreshold('pan', 'pen', 2)).toBe(false);
      // For medium and long words
      expect(isWithinTypoThreshold('amoxicilin', 'amoxicillin', 2)).toBe(true);
      expect(isWithinTypoThreshold('paracetmol', 'paracetamol', 2)).toBe(true);
      expect(isWithinTypoThreshold('amoxilin', 'amoxicillin', 3)).toBe(true);
    });

    it('provides "Did you mean?" suggestions for common and calculated typos', () => {
      const paracetamolTypo = getGlobalSpellingCorrection('paracetmol');
      expect(paracetamolTypo.hasCorrection).toBe(true);
      expect(paracetamolTypo.didYouMean).toContain('Paracetamol');

      const amoxilTypo = getGlobalSpellingCorrection('amoxilin');
      expect(amoxilTypo.hasCorrection).toBe(true);
      expect(amoxilTypo.didYouMean).toContain('Amoxicillin');
    });
  });

  describe('2. Multi-Market Medicine Retrieval via Free Public APIs', () => {
    it('retrieves Indian medicines with CDSCO & NPPA data', async () => {
      const res = await searchGlobalMedicines('Dolo 650', { market: 'IN' });
      expect(res.results.length).toBeGreaterThan(0);
      const top = res.results[0];
      expect(top.brandName).toBe('Dolo 650');
      expect(top.country).toBe('IN');
      expect(top.regulatoryBody).toBe('CDSCO');
      expect(top.dataSource).toContain('CDSCO');
      expect(top.pricing).not.toBeNull();
      expect(top.pricing.pricingAuthority).toBe('NPPA DPCO');
    });

    it('retrieves US medicines via free openFDA & DailyMed APIs', async () => {
      const res = await searchGlobalMedicines('Tylenol', { market: 'US' });
      expect(res.results.length).toBeGreaterThan(0);
      const top = res.results[0];
      expect(top.brandName.toLowerCase()).toContain('tylenol');
      expect(top.country).toBe('US');
      expect(top.regulatoryBody).toBe('US FDA');
      expect(top.dataSource).toContain('Free');
    });

    it('retrieves UK medicines via free public registry APIs', async () => {
      const res = await searchGlobalMedicines('Panadol', { market: 'GB' });
      expect(res.results.length).toBeGreaterThan(0);
      const top = res.results[0];
      expect(top.country).toBe('GB');
      expect(top.regulatoryBody).toBe('MHRA');
      expect(top.dataSource).toContain('Free API');
    });

    it('retrieves European Union medicines via free public registry APIs', async () => {
      const res = await searchGlobalMedicines('Paxlovid', { market: 'EU' });
      expect(res.results.length).toBeGreaterThan(0);
      const top = res.results[0];
      expect(top.country).toBe('EU');
      expect(top.regulatoryBody).toBe('EMA');
      expect(top.dataSource).toContain('Free API');
    });

    it('retrieves Canadian medicines via free public registry APIs', async () => {
      const res = await searchGlobalMedicines('Amoxicillin', { market: 'CA' });
      expect(res.results.length).toBeGreaterThan(0);
      const top = res.results[0];
      expect(top.country).toBe('CA');
      expect(top.regulatoryBody).toBe('Health Canada');
      expect(top.dataSource).toContain('Free API');
    });

    it('retrieves Australian medicines via free public registry APIs', async () => {
      const res = await searchGlobalMedicines('Panadol', { market: 'AU' });
      expect(res.results.length).toBeGreaterThan(0);
      const top = res.results[0];
      expect(top.country).toBe('AU');
      expect(top.regulatoryBody).toBe('TGA');
      expect(top.dataSource).toContain('Free API');
    });
  });

  describe('3. Cross-Market Active Ingredient & Synonym Resolution', () => {
    it('matches Acetaminophen queries to Paracetamol products in international markets', async () => {
      const res = await searchGlobalMedicines('acetaminophen', { market: 'ALL' });
      expect(res.results.length).toBeGreaterThan(0);
      const brands = res.results.map(r => r.brandName.toLowerCase());
      expect(brands.some(b => b.includes('dolo') || b.includes('crocin') || b.includes('tylenol') || b.includes('paracetamol'))).toBe(true);
    });

    it('resolves INN and USAN synonyms for Salbutamol and Albuterol', () => {
      expect(GLOBAL_INGREDIENT_SYNONYMS['salbutamol']).toBe('albuterol');
      expect(GLOBAL_INGREDIENT_SYNONYMS['albuterol']).toBe('salbutamol');
    });

    it('matches Furosemide and Frusemide synonyms', () => {
      expect(GLOBAL_INGREDIENT_SYNONYMS['frusemide']).toBe('furosemide');
      expect(GLOBAL_INGREDIENT_SYNONYMS['furosemide']).toBe('frusemide');
    });
  });

  describe('4. Strength Discrepancy & Dosage Form Filtering', () => {
    it('detects strength discrepancy when user requests non-standard strength', async () => {
      const res = await searchGlobalMedicines('Dolo 1000mg', { market: 'IN' });
      expect(res.results.length).toBeGreaterThan(0);
      const top = res.results[0];
      expect(top.strengthDiscrepancy).not.toBeNull();
      expect(top.strengthDiscrepancy.requested).toBe('1000 mg');
      expect(top.strengthDiscrepancy.verified).toBe('650 mg');
      expect(top.strengthDiscrepancy.message).toContain('You searched for 1000 mg');
    });

    it('filters accurately by dosage form', async () => {
      const res = await searchGlobalMedicines('Syrup', { market: 'IN', dosageForm: 'Syrup / Liquid' });
      expect(res.results.length).toBeGreaterThan(0);
      for (const r of res.results) {
        expect(r.dosageForm.toLowerCase()).toContain('syrup');
      }
    });

    it('filters accurately by legal classification (OTC vs Prescription)', async () => {
      const otcRes = await searchGlobalMedicines('paracetamol', { market: 'IN', legalClassification: 'OTC' });
      expect(otcRes.results.length).toBeGreaterThan(0);
      for (const r of otcRes.results) {
        expect(r.legalClassification.toLowerCase()).toMatch(/otc|general sale|over-the-counter/);
      }
    });
  });

  describe('5. Free Public APIs Integration & Non-Fabrication', () => {
    it('returns empty results gracefully for nonexistent fabricated medicine', async () => {
      const res = await searchGlobalMedicines('Xylofakecillin9999');
      expect(res.results.length).toBe(0);
      expect(res.total).toBe(0);
    });

    it('fetches medicine details dynamically from 100% Free Public APIs', async () => {
      const details = await getFreeMedicineDetails('paracetamol');
      expect(details).not.toBeNull();
      expect(details.genericName.toLowerCase()).toMatch(/paracetamol|acetaminophen/);
      expect(details.sources.length).toBeGreaterThan(0);
      expect(details.sources.some(s => s.includes('Free'))).toBe(true);
    });

    it('queries openFDA free API directly for package label data', async () => {
      const fdaRecords = await searchOpenFda('ibuprofen', 1);
      expect(fdaRecords.length).toBeGreaterThan(0);
      expect(fdaRecords[0].dataSource).toContain('openFDA');
      expect(fdaRecords[0].country).toBe('US');
    });

    it('queries Wikimedia free API for global clinical overview', async () => {
      const wiki = await searchWikipediaMedicine('metformin');
      expect(wiki).not.toBeNull();
      expect(wiki.title.toLowerCase()).toBe('metformin');
      expect(wiki.dataSource).toContain('Free API');
    });

    it('retrieves single medicine record by ID via getGlobalMedicineById', async () => {
      const med = await getGlobalMedicineById('in-dolo-650');
      expect(med).not.toBeNull();
      expect(med.brandName).toBe('Dolo 650');
      expect(med.country).toBe('IN');
    });

    it('provides quick suggestions as user types prefix', () => {
      const suggestions = getGlobalQuickSuggestions('dolo', 5);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].text).toContain('Dolo');
    });
  });
});
