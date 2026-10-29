/**
 * locationService.js
 * All geolocation, geocoding, and facility-search logic lives here.
 * Contract: NEVER fabricate names, addresses, phones, ratings, distances, or hours.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Well-known coordinates used only when GPS is unavailable and the user has
 *  not manually searched.  Always labelled clearly in the UI. */
export const DEFAULT_DEMO_LOCATION = {
  lat: 28.5706,
  lng: 77.3272,
  name: 'Noida, Delhi NCR',
  isDemo: true,
};

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://api.openstreetmap.fr/oapi/interpreter',
];

const GEOCODER_TIMEOUT_MS = 4000;
const OSM_FETCH_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------------
// Lat/Lng validation
// ---------------------------------------------------------------------------

/** Returns true only for finite numbers in the valid WGS-84 range. */
export function isValidCoord(lat, lng) {
  return (
    typeof lat === 'number' && isFinite(lat) && lat >= -90 && lat <= 90 &&
    typeof lng === 'number' && isFinite(lng) && lng >= -180 && lng <= 180
  );
}

// ---------------------------------------------------------------------------
// Haversine distance (km)
// ---------------------------------------------------------------------------

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Fetch with timeout + abort support
// ---------------------------------------------------------------------------

export function fetchWithTimeout(url, options = {}, timeoutMs = 5000, signal = null) {
  return new Promise((resolve, reject) => {
    const internalController = new AbortController();
    let settled = false;

    function onAbort() {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      internalController.abort();
      reject(new DOMException('Aborted', 'AbortError'));
    }

    // Propagate external abort
    if (signal) {
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      internalController.abort();
      reject(new DOMException('Request timed out', 'TimeoutError'));
    }, timeoutMs);

    fetch(url, { ...options, signal: internalController.signal })
      .then(res => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        resolve(res);
      })
      .catch(err => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        reject(err);
      });
  });
}

// ---------------------------------------------------------------------------
// GPS acquisition
// ---------------------------------------------------------------------------

/**
 * Attempts to acquire the device's GPS position.
 * Returns { lat, lng } on success.
 * Throws a typed error on failure.
 */
export function acquireGpsPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      const err = new Error('Geolocation is not supported by this browser.');
      err.code = 'UNSUPPORTED';
      reject(err);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      geoErr => {
        const err = new Error(geoErr.message);
        // GeolocationPositionError codes: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
        err.code = geoErr.code === 1 ? 'PERMISSION_DENIED'
          : geoErr.code === 2 ? 'POSITION_UNAVAILABLE'
          : geoErr.code === 3 ? 'TIMEOUT'
          : 'UNKNOWN';
        reject(err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000, ...options }
    );
  });
}

// ---------------------------------------------------------------------------
// Reverse geocoding (coord → human-readable name)
// ---------------------------------------------------------------------------

export async function reverseGeocode(lat, lng, signal) {
  try {
    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
    const res = await fetchWithTimeout(url, {}, GEOCODER_TIMEOUT_MS, signal);
    if (!res.ok) return null;
    const data = await res.json();
    const p = data?.features?.[0]?.properties;
    if (!p) return null;
    return [p.name, p.city || p.locality, p.state].filter(Boolean).join(', ') || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Forward geocoding (text → { lat, lng, name })
// ---------------------------------------------------------------------------

/** Small lookup for common Indian cities to avoid a round-trip when possible. */
const CITY_LOOKUP = {
  noida:       { lat: 28.5706, lng: 77.3272, name: 'Noida, Uttar Pradesh' },
  delhi:       { lat: 28.6139, lng: 77.2090, name: 'Delhi, NCR' },
  'new delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi' },
  gurgaon:     { lat: 28.4595, lng: 77.0266, name: 'Gurugram, Haryana' },
  gurugram:    { lat: 28.4595, lng: 77.0266, name: 'Gurugram, Haryana' },
  mumbai:      { lat: 19.0760, lng: 72.8777, name: 'Mumbai, Maharashtra' },
  bengaluru:   { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka' },
  bangalore:   { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka' },
  hyderabad:   { lat: 17.3850, lng: 78.4867, name: 'Hyderabad, Telangana' },
  chennai:     { lat: 13.0827, lng: 80.2707, name: 'Chennai, Tamil Nadu' },
  kolkata:     { lat: 22.5726, lng: 88.3639, name: 'Kolkata, West Bengal' },
  pune:        { lat: 18.5204, lng: 73.8567, name: 'Pune, Maharashtra' },
  ahmedabad:   { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad, Gujarat' },
  jaipur:      { lat: 26.9124, lng: 75.7873, name: 'Jaipur, Rajasthan' },
  lucknow:     { lat: 26.8467, lng: 80.9462, name: 'Lucknow, Uttar Pradesh' },
  chandigarh:  { lat: 30.7333, lng: 76.7794, name: 'Chandigarh' },
  faridabad:   { lat: 28.4089, lng: 77.3178, name: 'Faridabad, Haryana' },
  ghaziabad:   { lat: 28.6692, lng: 77.4538, name: 'Ghaziabad, Uttar Pradesh' },
  indirapuram: { lat: 28.6393, lng: 77.3698, name: 'Indirapuram, Ghaziabad' },
  saket:       { lat: 28.5244, lng: 77.2166, name: 'Saket, New Delhi' },
  kanpur:      { lat: 26.4499, lng: 80.3319, name: 'Kanpur, Uttar Pradesh' },
  patna:       { lat: 25.5941, lng: 85.1376, name: 'Patna, Bihar' },
  surat:       { lat: 21.1702, lng: 72.8311, name: 'Surat, Gujarat' },
  nagpur:      { lat: 21.1458, lng: 79.0882, name: 'Nagpur, Maharashtra' },
  indore:      { lat: 22.7196, lng: 75.8577, name: 'Indore, Madhya Pradesh' },
  bhopal:      { lat: 23.2599, lng: 77.4126, name: 'Bhopal, Madhya Pradesh' },
  visakhapatnam:{ lat: 17.6868, lng: 83.2185, name: 'Visakhapatnam, Andhra Pradesh' },
  kochi:       { lat: 9.9312,  lng: 76.2673, name: 'Kochi, Kerala' },
  coimbatore:  { lat: 11.0168, lng: 76.9558, name: 'Coimbatore, Tamil Nadu' },
};

/**
 * Resolves a text query to { lat, lng, name }.
 * Returns null if nothing matches (never falls back to a made-up location).
 */
export async function forwardGeocode(query, signal) {
  const q = query.trim();
  if (!q) return null;

  // 1. Direct coordinate input e.g. "28.57, 77.32"
  const coordMatch = q.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]); // group 2: non-capturing groups don't count
    if (!isValidCoord(lat, lng)) {
      const err = new Error('Coordinates are outside valid WGS-84 range (lat -90..90, lng -180..180).');
      err.code = 'INVALID_COORDS';
      throw err;
    }
    return { lat, lng, name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, isManual: true };
  }

  // 2. Known city lookup (instant, no network)
  const lower = q.toLowerCase();
  for (const [key, val] of Object.entries(CITY_LOOKUP)) {
    if (lower === key || lower.startsWith(key + ' ') || lower.endsWith(' ' + key) || lower.includes(key)) {
      return { ...val, isManual: true };
    }
  }

  // 3. Photon (Komoot)
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`;
    const res = await fetchWithTimeout(url, {}, GEOCODER_TIMEOUT_MS, signal);
    if (res.ok) {
      const data = await res.json();
      const feat = data?.features?.[0];
      if (feat) {
        const [lng, lat] = feat.geometry.coordinates;
        if (isValidCoord(lat, lng)) {
          const p = feat.properties;
          const name = [p.name, p.city || p.district, p.state].filter(Boolean).join(', ') || q;
          return { lat, lng, name, isManual: true };
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    // fall through to Nominatim
  }

  // 4. Nominatim fallback
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
    const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, GEOCODER_TIMEOUT_MS, signal);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (isValidCoord(lat, lng)) {
          const name = data[0].display_name
            ? data[0].display_name.split(',').slice(0, 3).join(', ')
            : q;
          return { lat, lng, name, isManual: true };
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
  }

  return null; // Caller decides what to do with a null result
}

// ---------------------------------------------------------------------------
// OSM facility fetching
// ---------------------------------------------------------------------------

/**
 * Builds an Overpass query for medical facilities.
 * Uses `around` so all results are actually within `radiusMeters`.
 */
function buildOverpassQuery(lat, lng, radiusMeters) {
  const r = Math.min(Math.max(radiusMeters, 500), 25000);
  return `
[out:json][timeout:12];
(
  node["amenity"="hospital"](around:${r},${lat},${lng});
  node["amenity"="pharmacy"](around:${r},${lat},${lng});
  node["amenity"="clinic"](around:${r},${lat},${lng});
  node["amenity"="doctors"](around:${r},${lat},${lng});
  node["amenity"="dentist"](around:${r},${lat},${lng});
  way["amenity"="hospital"](around:${r},${lat},${lng});
  way["amenity"="clinic"](around:${r},${lat},${lng});
  way["amenity"="pharmacy"](around:${r},${lat},${lng});
);
out center 50;
`.trim();
}

/**
 * Maps a raw OSM element to our normalised facility object.
 * Only real data from OSM tags is used.  Missing fields are null / undefined.
 */
function osmElementToFacility(el, userLat, userLng) {
  const itemLat = el.lat ?? el.center?.lat;
  const itemLng = el.lon ?? el.center?.lon;
  if (!isValidCoord(itemLat, itemLng)) return null;

  const name = el.tags?.name || el.tags?.['name:en'];
  if (!name) return null; // skip unnamed nodes

  const distKm = haversineKm(userLat, userLng, itemLat, itemLng);
  const rawAmenity = el.tags?.amenity || 'hospital';
  const type = rawAmenity === 'doctors' ? 'doctor' : rawAmenity;
  const spec = (el.tags?.['healthcare:speciality'] || el.tags?.speciality || '').toLowerCase() || null;

  // Address: only real OSM data, never invented
  const addressParts = [
    el.tags?.['addr:housenumber'],
    el.tags?.['addr:street'],
    el.tags?.['addr:suburb'],
    el.tags?.['addr:city'],
  ].filter(Boolean);
  const address = el.tags?.['addr:full'] || (addressParts.length > 0 ? addressParts.join(', ') : null);

  // Phone: only from OSM tags
  const phone = el.tags?.phone || el.tags?.['contact:phone'] || null;

  // Opening hours: from OSM tag, otherwise null
  const openingHours = el.tags?.opening_hours || null;

  // Rating: OSM has no rating field — never invent one
  const rating = null;

  // isOpen: only determinable if we have opening_hours data; otherwise null = unknown
  const isOpen = openingHours
    ? !openingHours.toLowerCase().includes('closed')
    : null; // unknown

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${itemLat},${itemLng}&travelmode=driving`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${itemLat},${itemLng}`;

  return {
    id: `osm-${el.id}`,
    name,
    type,
    speciality: spec,
    distanceKm: distKm,
    distance: `${distKm.toFixed(1)} km`,
    rating,                    // null = not available from this source
    isOpen,                    // null = unknown
    openingHours,
    address,
    phone,
    lat: itemLat,
    lng: itemLng,
    directionsUrl,
    mapsUrl,
    source: 'osm',
  };
}

/**
 * Fetches medical facilities from Overpass API.
 *
 * @param {number}      lat         Centre latitude
 * @param {number}      lng         Centre longitude
 * @param {number}      radiusM     Search radius in metres (capped at 25 km)
 * @param {AbortSignal} signal      Caller passes this to cancel stale requests
 * @returns {Promise<{ facilities: Array, partial: boolean }>}
 *   `partial` is true when some endpoints failed but at least one succeeded.
 *   Throws on total failure.
 */
export async function fetchOsmFacilities(lat, lng, radiusM, signal) {
  if (!isValidCoord(lat, lng)) {
    throw Object.assign(new Error('Invalid coordinates supplied to fetchOsmFacilities.'), { code: 'INVALID_COORDS' });
  }

  const query = buildOverpassQuery(lat, lng, radiusM);
  let lastError = null;
  let partial = false;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    try {
      const res = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
        },
        OSM_FETCH_TIMEOUT_MS,
        signal
      );

      if (res.status === 429) {
        lastError = Object.assign(new Error('Overpass API rate limit reached. Please try again in a moment.'), { code: 'RATE_LIMIT' });
        partial = true;
        continue;
      }

      if (!res.ok) {
        lastError = Object.assign(new Error(`Overpass returned HTTP ${res.status}.`), { code: 'HTTP_ERROR' });
        partial = true;
        continue;
      }

      let parsed;
      try {
        parsed = await res.json();
      } catch {
        lastError = Object.assign(new Error('Malformed JSON from Overpass API.'), { code: 'MALFORMED_RESPONSE' });
        partial = true;
        continue;
      }

      if (!Array.isArray(parsed?.elements)) {
        lastError = Object.assign(new Error('Unexpected Overpass response structure.'), { code: 'MALFORMED_RESPONSE' });
        partial = true;
        continue;
      }

      const facilities = parsed.elements
        .map(el => osmElementToFacility(el, lat, lng))
        .filter(Boolean)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 40);

      return { facilities, partial };
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      lastError = err;
      partial = true;
    }
  }

  // All endpoints failed
  throw Object.assign(
    lastError || new Error('All Overpass endpoints failed.'),
    { code: lastError?.code || 'NETWORK_ERROR' }
  );
}

// ---------------------------------------------------------------------------
// Google Places (optional, only when SDK + API key present)
// ---------------------------------------------------------------------------

/**
 * Maps a Google Places result to our normalised facility object.
 * Only uses data actually returned by the API — never invents ratings.
 */
function googlePlaceToFacility(place, userLat, userLng, primaryType) {
  const placeLat = place.geometry.location.lat();
  const placeLng = place.geometry.location.lng();
  const distKm = haversineKm(userLat, userLng, placeLat, placeLng);

  // Rating: only if the API returns one
  const rating = (place.rating != null && !isNaN(place.rating))
    ? place.rating.toFixed(1)
    : null;

  // isOpen: only if opening_hours data is present
  let isOpen = null;
  if (place.opening_hours) {
    isOpen = typeof place.opening_hours.isOpen === 'function'
      ? place.opening_hours.isOpen()
      : !!place.opening_hours.open_now;
  }

  // Phone: not available in nearbySearch response (requires place details call)
  const phone = null;

  const dest = `${placeLat},${placeLng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
  const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;

  return {
    id: place.place_id,
    name: place.name,
    type: primaryType,
    speciality: null,
    distanceKm: distKm,
    distance: `${distKm.toFixed(1)} km`,
    rating,
    isOpen,
    openingHours: null,
    address: place.vicinity || null,
    phone,
    lat: placeLat,
    lng: placeLng,
    directionsUrl,
    mapsUrl,
    source: 'google',
  };
}

export function fetchGooglePlacesFacilities(lat, lng, radiusM) {
  return new Promise((resolve, reject) => {
    try {
      const mapDiv = document.createElement('div');
      const service = new window.google.maps.places.PlacesService(mapDiv);
      const types = ['hospital', 'pharmacy', 'doctor', 'dentist'];

      const promises = types.map(type =>
        new Promise(res => {
          service.nearbySearch(
            {
              location: new window.google.maps.LatLng(lat, lng),
              radius: Math.min(radiusM, 50000),
              type: [type],
            },
            (results, status) => {
              const OK = window.google.maps.places.PlacesServiceStatus.OK;
              if (status === OK && results) {
                res(results.map(p => googlePlaceToFacility(p, lat, lng, type)));
              } else {
                res([]);
              }
            }
          );
        })
      );

      Promise.all(promises).then(allResults => {
        const seen = new Set();
        const unique = allResults.flat().filter(f => {
          if (seen.has(f.id)) return false;
          seen.add(f.id);
          return true;
        });
        resolve(
          unique.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 40)
        );
      }).catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}
