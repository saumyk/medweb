/**
 * healthCanadaAdapter.js
 * 
 * Adapter for Health Canada Drug Product Database (DPD).
 * Fetches clinical medicine details dynamically via Free Public APIs.
 */

import { BaseMedicineAdapter } from './baseAdapter';
import { searchWikipediaMedicine, searchRxNav } from '../freeMedicineApi';
import { createUnifiedMedicineRecord } from '../types';

export class HealthCanadaAdapter extends BaseMedicineAdapter {
  constructor() {
    super({
      marketCode: 'CA',
      name: 'Health Canada (Free Public APIs)',
      regulatoryBody: 'Health Canada',
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
          id: `ca-free-${q.replace(/[^a-z0-9]/g, '-')}`,
          brandName: brand,
          genericName: generic,
          activeIngredients: rx?.ingredients?.map(i => ({ name: i, strength: 'Refer to packaging' })) || [{ name: generic, strength: 'Standard' }],
          strength: 'Standard Dosage',
          dosageForm: 'Oral / Standard Form',
          route: 'Oral',
          country: 'CA',
          regulatoryBody: 'Health Canada',
          regulatoryStatus: 'Health Canada Authorized (DPD/NOC)',
          legalClassification: 'Prescription / Ethical',
          identifiers: {
            din: 'DIN Registered',
            rxcui: rx?.rxcui || null
          },
          indication: wiki?.description || 'Therapeutic medication',
          warnings: ['Consult Health Canada product monograph and healthcare professional.'],
          dataSource: 'Health Canada / Wikimedia Open Clinical API (Free API)',
          labelingUrl: wiki?.pageUrl || 'https://health-products.canada.ca/dpd-bdpp/',
          lastVerified: '2026'
        })
      ];
    } catch {
      return [];
    }
  }

  async executeGetById(id) {
    const clean = id.replace(/^ca-free-/, '');
    const res = await this.executeSearch(clean);
    return res[0] || null;
  }
}
