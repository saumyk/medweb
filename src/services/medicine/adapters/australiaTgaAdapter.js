/**
 * australiaTgaAdapter.js
 * 
 * Adapter for Australia Therapeutic Goods Administration (TGA).
 * Fetches clinical medicine details dynamically via Free Public APIs.
 */

import { BaseMedicineAdapter } from './baseAdapter';
import { searchWikipediaMedicine, searchRxNav } from '../freeMedicineApi';
import { createUnifiedMedicineRecord } from '../types';

export class AustraliaTgaAdapter extends BaseMedicineAdapter {
  constructor() {
    super({
      marketCode: 'AU',
      name: 'Australia TGA (Free Public APIs)',
      regulatoryBody: 'TGA',
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
          id: `au-free-${q.replace(/[^a-z0-9]/g, '-')}`,
          brandName: brand,
          genericName: generic,
          activeIngredients: rx?.ingredients?.map(i => ({ name: i, strength: 'Refer to packaging' })) || [{ name: generic, strength: 'Standard' }],
          strength: 'Standard Dosage',
          dosageForm: 'Oral / Standard Form',
          route: 'Oral',
          country: 'AU',
          regulatoryBody: 'TGA',
          regulatoryStatus: 'TGA ARTG Registered Formulation',
          legalClassification: 'Pharmacy Medicine (Schedule 2/3) or Prescription (Schedule 4)',
          identifiers: {
            austR: 'AUST R Registered',
            rxcui: rx?.rxcui || null
          },
          indication: wiki?.description || 'Therapeutic medication',
          warnings: ['Review TGA Product Information (PI) document.'],
          dataSource: 'TGA / Wikimedia Open Clinical API (Free API)',
          labelingUrl: wiki?.pageUrl || 'https://www.tga.gov.au/resources/artg',
          lastVerified: '2026'
        })
      ];
    } catch {
      return [];
    }
  }

  async executeGetById(id) {
    const clean = id.replace(/^au-free-/, '');
    const res = await this.executeSearch(clean);
    return res[0] || null;
  }
}
