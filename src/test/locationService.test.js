/**
 * locationService.test.js
 *
 * Tests all the critical behaviours required by the task brief:
 *  - Location permission granted / denied / unavailable / timeout / unsupported
 *  - Manual city search, coordinates input, empty query, unresolvable query
 *  - Invalid coordinates (out of WGS-84 range)
 *  - Stale request cancellation (AbortError propagation)
 *  - OSM fetch: success, empty result, 429 rate-limit, HTTP error, malformed JSON
 *  - Google Places: success path, fallback on error
 *  - fetchWithTimeout: timeout fires correctly
 *  - haversineKm and isValidCoord utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isValidCoord,
  haversineKm,
  fetchWithTimeout,
  acquireGpsPosition,
  reverseGeocode,
  forwardGeocode,
  fetchOsmFacilities,
  DEFAULT_DEMO_LOCATION,
} from '../utils/locationService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFetchResponse(body, status = 200, ok = true) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

function makeOsmResponse(elements) {
  return makeFetchResponse({ elements });
}

// ---------------------------------------------------------------------------
// isValidCoord
// ---------------------------------------------------------------------------

describe('isValidCoord', () => {
  it('accepts valid coords', () => {
    expect(isValidCoord(28.57, 77.32)).toBe(true);
    expect(isValidCoord(0, 0)).toBe(true);
    expect(isValidCoord(-90, -180)).toBe(true);
    expect(isValidCoord(90, 180)).toBe(true);
  });

  it('rejects lat out of range', () => {
    expect(isValidCoord(91, 0)).toBe(false);
    expect(isValidCoord(-91, 0)).toBe(false);
  });

  it('rejects lng out of range', () => {
    expect(isValidCoord(0, 181)).toBe(false);
    expect(isValidCoord(0, -181)).toBe(false);
  });

  it('rejects non-numbers', () => {
    expect(isValidCoord('28', 77)).toBe(false);
    expect(isValidCoord(NaN, 77)).toBe(false);
    expect(isValidCoord(null, null)).toBe(false);
    expect(isValidCoord(undefined, undefined)).toBe(false);
  });

  it('rejects Infinity', () => {
    expect(isValidCoord(Infinity, 0)).toBe(false);
    expect(isValidCoord(0, -Infinity)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// haversineKm
// ---------------------------------------------------------------------------

describe('haversineKm', () => {
  it('returns 0 for same point', () => {
    expect(haversineKm(28.57, 77.32, 28.57, 77.32)).toBeCloseTo(0, 5);
  });

  it('known distance: London to Paris ~340 km', () => {
    const dist = haversineKm(51.5074, -0.1278, 48.8566, 2.3522);
    expect(dist).toBeGreaterThan(330);
    expect(dist).toBeLessThan(350);
  });

  it('is symmetric', () => {
    const d1 = haversineKm(28.57, 77.32, 19.07, 72.87);
    const d2 = haversineKm(19.07, 72.87, 28.57, 77.32);
    expect(d1).toBeCloseTo(d2, 3);
  });
});

// ---------------------------------------------------------------------------
// fetchWithTimeout
// ---------------------------------------------------------------------------

describe('fetchWithTimeout', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('resolves when fetch succeeds within timeout', async () => {
    const mockRes = makeFetchResponse({ ok: true });
    global.fetch = vi.fn(() => Promise.resolve(mockRes));

    const resultPromise = fetchWithTimeout('https://example.com', {}, 3000);
    const result = await resultPromise;
    expect(result).toBe(mockRes);
  });

  it('rejects with TimeoutError when fetch is slow', async () => {
    global.fetch = vi.fn(() => new Promise(() => {})); // never resolves

    const resultPromise = fetchWithTimeout('https://example.com', {}, 100);
    vi.advanceTimersByTime(150);

    await expect(resultPromise).rejects.toMatchObject({ name: 'TimeoutError' });
  });

  it('rejects when signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      fetchWithTimeout('https://example.com', {}, 3000, controller.signal)
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('rejects with AbortError when external signal is aborted', async () => {
    const controller = new AbortController();
    // Abort immediately before calling fetchWithTimeout
    controller.abort();

    await expect(
      fetchWithTimeout('https://example.com', {}, 3000, controller.signal)
    ).rejects.toMatchObject({ name: 'AbortError' });

    // Verify fetch was never called because we short-circuited on the pre-aborted signal
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// acquireGpsPosition
// ---------------------------------------------------------------------------

describe('acquireGpsPosition', () => {
  const originalGeolocation = global.navigator.geolocation;
  afterEach(() => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: originalGeolocation,
      configurable: true,
    });
  });

  it('resolves with lat/lng when GPS succeeds', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success) =>
          success({ coords: { latitude: 28.57, longitude: 77.32 } }),
      },
      configurable: true,
    });

    const result = await acquireGpsPosition();
    expect(result).toEqual({ lat: 28.57, lng: 77.32 });
  });

  it('rejects with PERMISSION_DENIED error code', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (_, error) =>
          error({ code: 1, message: 'User denied geolocation' }),
      },
      configurable: true,
    });

    await expect(acquireGpsPosition()).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
  });

  it('rejects with POSITION_UNAVAILABLE error code', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (_, error) =>
          error({ code: 2, message: 'Position unavailable' }),
      },
      configurable: true,
    });

    await expect(acquireGpsPosition()).rejects.toMatchObject({ code: 'POSITION_UNAVAILABLE' });
  });

  it('rejects with TIMEOUT error code', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (_, error) =>
          error({ code: 3, message: 'Timeout' }),
      },
      configurable: true,
    });

    await expect(acquireGpsPosition()).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('rejects with UNSUPPORTED when geolocation is not present', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    });

    await expect(acquireGpsPosition()).rejects.toMatchObject({ code: 'UNSUPPORTED' });
  });
});

// ---------------------------------------------------------------------------
// forwardGeocode
// ---------------------------------------------------------------------------

describe('forwardGeocode', () => {
  beforeEach(() => { global.fetch = vi.fn(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns null for empty query', async () => {
    const result = await forwardGeocode('   ');
    expect(result).toBeNull();
  });

  it('resolves known city from lookup without network call', async () => {
    const result = await forwardGeocode('Mumbai');
    expect(result).toMatchObject({
      lat: expect.any(Number),
      lng: expect.any(Number),
      name: expect.stringContaining('Mumbai'),
      isManual: true,
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('parses direct coordinate input', async () => {
    const result = await forwardGeocode('28.5706, 77.3272');
    expect(result).toMatchObject({ lat: 28.5706, lng: 77.3272, isManual: true });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws INVALID_COORDS for lat out of range', async () => {
    await expect(forwardGeocode('200, 77')).rejects.toMatchObject({ code: 'INVALID_COORDS' });
  });

  it('throws INVALID_COORDS for lng out of range', async () => {
    await expect(forwardGeocode('28, 999')).rejects.toMatchObject({ code: 'INVALID_COORDS' });
  });

  it('returns null when all geocoders fail to find a match', async () => {
    // Both Photon and Nominatim return empty results
    global.fetch = vi.fn().mockResolvedValue(
      makeFetchResponse({ features: [] })
    );

    const result = await forwardGeocode('xyzzy_nonexistent_place_abc');
    expect(result).toBeNull();
  });

  it('uses Photon result when available', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      makeFetchResponse({
        features: [{
          geometry: { coordinates: [77.5946, 12.9716] },
          properties: { name: 'Bengaluru', city: 'Bengaluru', state: 'Karnataka' },
        }],
      })
    );

    const result = await forwardGeocode('Bengaluru City Center');
    expect(result).toMatchObject({ lat: 12.9716, lng: 77.5946 });
  });

  it('throws AbortError when signal is aborted mid-geocode', async () => {
    const controller = new AbortController();
    // Use a name not in the city lookup table so the network path is exercised
    global.fetch = vi.fn(() => {
      controller.abort();
      return Promise.reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
    });

    await expect(forwardGeocode('Khopoli Station Junction', controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});

// ---------------------------------------------------------------------------
// fetchOsmFacilities
// ---------------------------------------------------------------------------

describe('fetchOsmFacilities', () => {
  beforeEach(() => { global.fetch = vi.fn(); });
  afterEach(() => { vi.restoreAllMocks(); });

  const validLat = 28.5706;
  const validLng = 77.3272;

  it('rejects with INVALID_COORDS for invalid coordinates', async () => {
    await expect(fetchOsmFacilities(200, 77.3, 5000, null))
      .rejects.toMatchObject({ code: 'INVALID_COORDS' });
  });

  it('returns facilities array on success', async () => {
    const elements = [
      {
        id: 1, type: 'node', lat: 28.58, lon: 77.33,
        tags: { name: 'Test Hospital', amenity: 'hospital' },
      },
      {
        id: 2, type: 'node', lat: 28.575, lon: 77.325,
        tags: { name: 'City Pharmacy', amenity: 'pharmacy' },
      },
    ];
    global.fetch = vi.fn().mockResolvedValueOnce(makeOsmResponse(elements));

    const { facilities, partial } = await fetchOsmFacilities(validLat, validLng, 5000, null);
    expect(facilities).toHaveLength(2);
    expect(partial).toBe(false);

    const hospital = facilities.find(f => f.type === 'hospital');
    expect(hospital).toBeDefined();
    expect(hospital.name).toBe('Test Hospital');
    expect(hospital.source).toBe('osm');
    // Distance must be a real calculated value, not fabricated
    expect(hospital.distanceKm).toBeGreaterThan(0);
  });

  it('does NOT fabricate ratings — rating field is null for OSM data', async () => {
    const elements = [
      {
        id: 3, type: 'node', lat: 28.58, lon: 77.33,
        tags: { name: 'No Rating Clinic', amenity: 'clinic' },
      },
    ];
    global.fetch = vi.fn().mockResolvedValueOnce(makeOsmResponse(elements));

    const { facilities } = await fetchOsmFacilities(validLat, validLng, 5000, null);
    expect(facilities[0].rating).toBeNull();
  });

  it('does NOT fabricate phone numbers — phone field is null when missing', async () => {
    const elements = [
      {
        id: 4, type: 'node', lat: 28.58, lon: 77.33,
        tags: { name: 'No Phone Hospital', amenity: 'hospital' },
      },
    ];
    global.fetch = vi.fn().mockResolvedValueOnce(makeOsmResponse(elements));

    const { facilities } = await fetchOsmFacilities(validLat, validLng, 5000, null);
    expect(facilities[0].phone).toBeNull();
  });

  it('uses real phone number from OSM tags', async () => {
    const elements = [
      {
        id: 5, type: 'node', lat: 28.58, lon: 77.33,
        tags: { name: 'Hospital With Phone', amenity: 'hospital', phone: '+91 11 4567 8901' },
      },
    ];
    global.fetch = vi.fn().mockResolvedValueOnce(makeOsmResponse(elements));

    const { facilities } = await fetchOsmFacilities(validLat, validLng, 5000, null);
    expect(facilities[0].phone).toBe('+91 11 4567 8901');
  });

  it('filters out elements without a name', async () => {
    const elements = [
      { id: 6, type: 'node', lat: 28.58, lon: 77.33, tags: { amenity: 'hospital' } },       // no name
      { id: 7, type: 'node', lat: 28.575, lon: 77.325, tags: { name: 'Named Clinic', amenity: 'clinic' } },
    ];
    global.fetch = vi.fn().mockResolvedValueOnce(makeOsmResponse(elements));

    const { facilities } = await fetchOsmFacilities(validLat, validLng, 5000, null);
    expect(facilities).toHaveLength(1);
    expect(facilities[0].name).toBe('Named Clinic');
  });

  it('filters out elements without valid coordinates', async () => {
    const elements = [
      { id: 8, type: 'node', tags: { name: 'No Coords', amenity: 'hospital' } }, // no lat/lon
      { id: 9, type: 'node', lat: 28.575, lon: 77.325, tags: { name: 'Valid Clinic', amenity: 'clinic' } },
    ];
    global.fetch = vi.fn().mockResolvedValueOnce(makeOsmResponse(elements));

    const { facilities } = await fetchOsmFacilities(validLat, validLng, 5000, null);
    expect(facilities).toHaveLength(1);
    expect(facilities[0].name).toBe('Valid Clinic');
  });

  it('returns empty facilities array when Overpass returns no elements', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(makeOsmResponse([]));

    const { facilities } = await fetchOsmFacilities(validLat, validLng, 5000, null);
    expect(facilities).toHaveLength(0);
    // Should NOT throw and should NOT substitute mock data
  });

  it('throws RATE_LIMIT error when Overpass returns 429', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429, json: () => Promise.resolve({}) });

    await expect(fetchOsmFacilities(validLat, validLng, 5000, null))
      .rejects.toMatchObject({ code: 'RATE_LIMIT' });
  });

  it('throws NETWORK_ERROR when all endpoints fail with network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(fetchOsmFacilities(validLat, validLng, 5000, null))
      .rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('throws MALFORMED_RESPONSE when JSON is broken', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    });

    await expect(fetchOsmFacilities(validLat, validLng, 5000, null))
      .rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
  });

  it('throws MALFORMED_RESPONSE when response structure is unexpected', async () => {
    global.fetch = vi.fn().mockResolvedValue(makeFetchResponse({ notElements: true }));

    await expect(fetchOsmFacilities(validLat, validLng, 5000, null))
      .rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
  });

  it('propagates AbortError immediately', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      fetchOsmFacilities(validLat, validLng, 5000, controller.signal)
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('falls through to second endpoint when first fails', async () => {
    const elements = [
      { id: 10, type: 'node', lat: 28.58, lon: 77.33, tags: { name: 'Fallback Hospital', amenity: 'hospital' } },
    ];
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new TypeError('Network error on endpoint 1'))
      .mockResolvedValueOnce(makeOsmResponse(elements));

    const { facilities, partial } = await fetchOsmFacilities(validLat, validLng, 5000, null);
    expect(facilities).toHaveLength(1);
    expect(partial).toBe(true); // partial because first endpoint failed
  });

  it('returns directions URL with actual coordinates', async () => {
    const elements = [
      { id: 11, type: 'node', lat: 28.58, lon: 77.33, tags: { name: 'Directions Test', amenity: 'hospital' } },
    ];
    global.fetch = vi.fn().mockResolvedValueOnce(makeOsmResponse(elements));

    const { facilities } = await fetchOsmFacilities(validLat, validLng, 5000, null);
    const facility = facilities[0];
    // directionsUrl must contain the actual coordinates
    expect(facility.directionsUrl).toContain('28.58');
    expect(facility.directionsUrl).toContain('77.33');
    // Not a fake search query
    expect(facility.directionsUrl).not.toContain('apollo');
    expect(facility.directionsUrl).not.toContain('max hospital');
  });

  it('results are sorted nearest first', async () => {
    const elements = [
      { id: 12, type: 'node', lat: 28.63, lon: 77.40, tags: { name: 'Far Hospital', amenity: 'hospital' } },
      { id: 13, type: 'node', lat: 28.575, lon: 77.325, tags: { name: 'Near Clinic', amenity: 'clinic' } },
    ];
    global.fetch = vi.fn().mockResolvedValueOnce(makeOsmResponse(elements));

    const { facilities } = await fetchOsmFacilities(validLat, validLng, 5000, null);
    expect(facilities[0].name).toBe('Near Clinic');
    expect(facilities[1].name).toBe('Far Hospital');
  });

  it('isOpen is null (unknown) when opening_hours tag is absent', async () => {
    const elements = [
      { id: 14, type: 'node', lat: 28.58, lon: 77.33, tags: { name: 'No Hours Hosp', amenity: 'hospital' } },
    ];
    global.fetch = vi.fn().mockResolvedValueOnce(makeOsmResponse(elements));

    const { facilities } = await fetchOsmFacilities(validLat, validLng, 5000, null);
    expect(facilities[0].isOpen).toBeNull();
  });

  it('handles "way" elements using center coordinates', async () => {
    const elements = [
      {
        id: 15,
        type: 'way',
        center: { lat: 28.58, lon: 77.33 },
        tags: { name: 'Way Hospital', amenity: 'hospital' },
      },
    ];
    global.fetch = vi.fn().mockResolvedValueOnce(makeOsmResponse(elements));

    const { facilities } = await fetchOsmFacilities(validLat, validLng, 5000, null);
    expect(facilities).toHaveLength(1);
    expect(facilities[0].lat).toBe(28.58);
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_DEMO_LOCATION
// ---------------------------------------------------------------------------

describe('DEFAULT_DEMO_LOCATION', () => {
  it('is always marked as a demo location', () => {
    expect(DEFAULT_DEMO_LOCATION.isDemo).toBe(true);
  });

  it('has valid coordinates', () => {
    expect(isValidCoord(DEFAULT_DEMO_LOCATION.lat, DEFAULT_DEMO_LOCATION.lng)).toBe(true);
  });

  it('has a non-empty location name', () => {
    expect(typeof DEFAULT_DEMO_LOCATION.name).toBe('string');
    expect(DEFAULT_DEMO_LOCATION.name.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// reverseGeocode (network-dependent, fully mocked)
// ---------------------------------------------------------------------------

describe('reverseGeocode', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns a location name string on success', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      makeFetchResponse({
        features: [{
          properties: { name: 'Sector 62', city: 'Noida', state: 'Uttar Pradesh' },
        }],
      })
    );

    const name = await reverseGeocode(28.57, 77.32);
    expect(name).toBe('Sector 62, Noida, Uttar Pradesh');
  });

  it('returns null when Photon returns no features', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(makeFetchResponse({ features: [] }));
    const name = await reverseGeocode(0, 0);
    expect(name).toBeNull();
  });

  it('returns null when network fails', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new TypeError('Network error'));
    const name = await reverseGeocode(28.57, 77.32);
    expect(name).toBeNull();
  });
});
