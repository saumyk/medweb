/**
 * baseAdapter.js
 * 
 * Base medicine data adapter providing standardized interface,
 * in-memory caching, request timeouts, and error isolation.
 */

export class BaseMedicineAdapter {
  constructor({ marketCode, name, regulatoryBody, timeoutMs = 3500 }) {
    this.marketCode = marketCode;
    this.name = name;
    this.regulatoryBody = regulatoryBody;
    this.timeoutMs = timeoutMs;
    this.cache = new Map();
    this.maxCacheSize = 100;
  }

  async search(query, options = {}) {
    if (!query || typeof query !== 'string') {
      return { success: true, results: [], source: this.name };
    }

    const cacheKey = `${query.toLowerCase().trim()}_${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      return { success: true, results: this.cache.get(cacheKey), source: this.name, cached: true };
    }

    try {
      const results = await this.executeSearch(query, options);
      this.addToCache(cacheKey, results);
      return { success: true, results, source: this.name };
    } catch (err) {
      console.warn(`[Adapter ${this.name}] Search failed or timed out:`, err.message || err);
      // Gracefully return empty results or fallback without crashing
      const fallbackResults = await this.fallbackSearch(query, options);
      return {
        success: false,
        results: fallbackResults,
        source: this.name,
        error: err.message || 'Network/Service unavailable'
      };
    }
  }

  async getById(id) {
    try {
      return await this.executeGetById(id);
    } catch (err) {
      console.warn(`[Adapter ${this.name}] getById failed:`, err.message || err);
      return null;
    }
  }

  // Abstract methods to be overridden by subclasses
  async executeSearch() {
    return [];
  }

  async executeGetById() {
    return null;
  }

  async fallbackSearch() {
    return [];
  }

  addToCache(key, value) {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clearCache() {
    this.cache.clear();
  }
}

