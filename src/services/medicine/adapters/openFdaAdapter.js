/**
 * openFdaAdapter.js
 * 
 * Adapter for United States FDA Drug Database.
 * Live queries US openFDA free public API (labels, ndc, indications, boxed warnings).
 */

import { BaseMedicineAdapter } from './baseAdapter';
import { searchOpenFda } from '../freeMedicineApi';

export class UnitedStatesFdaAdapter extends BaseMedicineAdapter {
  constructor() {
    super({
      marketCode: 'US',
      name: 'US FDA (Free openFDA API)',
      regulatoryBody: 'US FDA',
      timeoutMs: 3000
    });
  }

  async executeSearch(query, options = {}) {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    try {
      const liveMatches = await searchOpenFda(q, options.limit || 10);
      return liveMatches;
    } catch {
      return [];
    }
  }

  async fallbackSearch() {
    return [];
  }

  async executeGetById(id) {
    try {
      const results = await searchOpenFda(id, 1);
      return results[0] || null;
    } catch {
      return null;
    }
  }
}
