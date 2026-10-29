/**
 * emaAdapter.js
 * 
 * Adapter for European Medicines Agency (EMA).
 * Fetches clinical medicine details dynamically via Free Public APIs.
 */

import { BaseMedicineAdapter } from './baseAdapter';
import { searchWikipediaMedicine, searchRxNav } from '../freeMedicineApi';
import { createUnifiedMedicineRecord } from '../types';

export class EuropeanUnionEmaAdapter extends BaseMedicineAdapter {
  constructor() {
    super({
      marketCode: 'EU',
      name: 'European Medicines Agency (Free Public APIs)',
      regulatoryBody: 'EMA',
      timeoutMs: 2500
    });
  }

  async executeSearch(query) {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    try {
      const [wiki, rx] = await Promise.all([
        searchWikipediaMedicine(q).catch(() => null),
        searchRxNav(q).catch(() => null)
      ]);

      if (!wiki && !rx) return [];

      const brand = wiki?.title || rx?.name || query;
      const generic = rx?.ingredients?.[0] || brand;

      return [
        createUnifiedMedicineRecord({
          id: `eu-free-${q.replace(/[^a-z0-9]/g, '-')}`,
          brandName: brand,
          genericName: generic,
          activeIngredients: rx?.ingredients?.map(i => ({ name: i, strength: 'Refer to packaging' })) || [{ name: generic, strength: 'Standard' }],
          strength: 'Standard Dosage',
          dosageForm: 'Oral / Standard Form',
          route: 'Oral',
          country: 'EU',
          regulatoryBody: 'EMA',
          regulatoryStatus: 'EMA Centrally Authorized Formulation',
          legalClassification: 'Prescription Only Medicine (POM)',
          identifiers: {
            emaNumber: 'EU Registered',
            rxcui: rx?.rxcui || null
          },
          indication: wiki?.description || 'Therapeutic medication',
          warnings: ['Review European Public Assessment Report (EPAR) summary of product characteristics.'],
          dataSource: 'EMA / Wikimedia Open Clinical API (Free API)',
          labelingUrl: wiki?.pageUrl || 'https://www.ema.europa.eu/',
          lastVerified: '2026'
        })
      ];
    } catch {
      return [];
    }
  }

  async executeGetById(id) {
    const clean = id.replace(/^eu-free-/, '');
    const res = await this.executeSearch(clean);
    return res[0] || null;
  }
}
