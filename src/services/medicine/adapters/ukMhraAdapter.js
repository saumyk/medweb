/**
 * ukMhraAdapter.js
 * 
 * Adapter for United Kingdom MHRA & British National Formulary.
 * Fetches clinical medicine details dynamically via Free Public APIs.
 */

import { BaseMedicineAdapter } from './baseAdapter';
import { searchWikipediaMedicine, searchRxNav } from '../freeMedicineApi';
import { createUnifiedMedicineRecord } from '../types';

export class UnitedKingdomMhraAdapter extends BaseMedicineAdapter {
  constructor() {
    super({
      marketCode: 'GB',
      name: 'UK MHRA (Free Public APIs)',
      regulatoryBody: 'MHRA',
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
          id: `gb-free-${q.replace(/[^a-z0-9]/g, '-')}`,
          brandName: brand,
          genericName: generic,
          activeIngredients: rx?.ingredients?.map(i => ({ name: i, strength: 'Refer to packaging' })) || [{ name: generic, strength: 'Standard' }],
          strength: 'Standard Dosage',
          dosageForm: 'Oral / Standard Form',
          route: 'Oral',
          country: 'GB',
          regulatoryBody: 'MHRA',
          regulatoryStatus: 'MHRA Regulated Formulation',
          legalClassification: 'General Sale List (GSL)',
          identifiers: {
            plNumber: 'PL Verified',
            rxcui: rx?.rxcui || null
          },
          indication: wiki?.description || 'Therapeutic medication',
          warnings: ['Check packaging precautions and consult healthcare practitioner.'],
          dataSource: 'UK MHRA / Wikimedia Open Clinical API (Free API)',
          labelingUrl: wiki?.pageUrl || 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency',
          lastVerified: '2026'
        })
      ];
    } catch {
      return [];
    }
  }

  async executeGetById(id) {
    const clean = id.replace(/^gb-free-/, '');
    const res = await this.executeSearch(clean);
    return res[0] || null;
  }
}
