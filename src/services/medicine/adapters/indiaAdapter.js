/**
 * indiaAdapter.js
 * 
 * Adapter for Indian Regulatory Medicine Knowledge Base (CDSCO / NPPA / IP).
 */

import { BaseMedicineAdapter } from './baseAdapter';
import { INDIA_MEDICINE_RECORDS } from '../database/indiaRecords';

export class IndiaCdscoAdapter extends BaseMedicineAdapter {
  constructor() {
    super({
      marketCode: 'IN',
      name: 'CDSCO & NPPA (India)',
      regulatoryBody: 'CDSCO',
      timeoutMs: 1000
    });
  }

  async executeSearch(query, options = {}) {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const limit = options.limit || 15;
    const matches = [];

    for (const record of INDIA_MEDICINE_RECORDS) {
      if (this.isMatch(record, q)) {
        matches.push(record);
        if (matches.length >= limit) break;
      }
    }

    return matches;
  }

  async executeGetById(id) {
    return INDIA_MEDICINE_RECORDS.find(r => r.id === id || r.id === `in-${id}`) || null;
  }

  isMatch(record, query) {
    if (record.brandName.toLowerCase().includes(query)) return true;
    if (record.genericName.toLowerCase().includes(query)) return true;
    if (record.aliases.some(a => a.toLowerCase().includes(query))) return true;
    if (record.activeIngredients.some(i => i.name.toLowerCase().includes(query) || (i.usName && i.usName.toLowerCase().includes(query)))) return true;
    return false;
  }
}

