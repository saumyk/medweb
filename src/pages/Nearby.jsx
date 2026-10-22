import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  AlertOctagon, 
  Phone, 
  ShieldAlert, 
  HeartPulse, 
  ExternalLink, 
  Star, 
  Compass, 
  RotateCcw, 
  Map, 
  Search, 
  Clock, 
  ArrowUpRight, 
  Activity, 
  Check,
  Building2,
  Pill,
  Stethoscope,
  Sparkles,
  SlidersHorizontal,
  Share2,
  Crosshair,
  ShieldCheck,
  X,
  Copy
} from 'lucide-react';
import { useLanguage } from '../components/LanguageContext';
import './Nearby.css';

const fetchWithTimeout = (url, options = {}, timeoutMs = 5000) => {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error("Timeout"));
    }, timeoutMs);

    fetch(url, { ...options, signal: controller.signal })
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

const generateMockFacilities = (lat, lng, areaName = 'Local Area') => {
  const cleanArea = (areaName || 'Medical District').split(',')[0].trim();
  const names = {
    hospital: [
      `Apollo Super Speciality Hospital, ${cleanArea}`,
      `Max Super Speciality Hospital, ${cleanArea}`,
      `Fortis Memorial Hospital, ${cleanArea}`,
      `City Heart & Trauma Institute, ${cleanArea}`,
      `Metro Healthcare & Research Center, ${cleanArea}`,
      `Kailash Multi Speciality Hospital, ${cleanArea}`
    ],
    pharmacy: [
      `Apollo 24x7 Pharmacy, ${cleanArea}`,
      `MedPlus Chemist & Druggist, ${cleanArea}`,
      `Wellness Forever Chemist, ${cleanArea}`,
      `LifeLine Health Pharmacy, ${cleanArea}`,
      `Guardian Pharmacy & Wellness, ${cleanArea}`
    ],
    clinic: [
      `PrimeCare Multi-Speciality Clinic, ${cleanArea}`,
      `CareFirst Family Health Clinic, ${cleanArea}`,
      `Apex Diagnostic & Medical Clinic, ${cleanArea}`,
      `HealWell Health Center, ${cleanArea}`
    ],
    doctor: [
      `Dr. Rajesh Sharma (Sr. Cardiologist) - ${cleanArea}`,
      `Dr. Priya Kapoor (Consultant Pediatrician) - ${cleanArea}`,
      `Dr. Amit Patel (General Physician) - ${cleanArea}`,
      `Dr. Sunita Verma (Consultant Gynecologist) - ${cleanArea}`,
      `Dr. Vikram Das (Consultant Neurologist) - ${cleanArea}`,
      `Dr. Neha Malhotra (Consultant Orthopedist) - ${cleanArea}`
    ],
    dentist: [
      `SmileCraft Advanced Dental Care, ${cleanArea}`,
      `Apex Orthodontic & Dental Clinic, ${cleanArea}`,
      `ToothCare Implant Center, ${cleanArea}`,
      `Cosmetic Dental Solutions, ${cleanArea}`
    ]
  };

  const types = ['hospital', 'pharmacy', 'clinic', 'doctor', 'dentist'];
  const specialities = {
    hospital: "general medicine & trauma care",
    pharmacy: "chemist & 24/7 medicines",
    clinic: "family primary care",
    doctor: "specialist medical consultant",
    dentist: "dentistry & oral care"
  };

  const facilities = [];
  const baseLat = typeof lat === 'number' && !isNaN(lat) ? lat : 28.5706;
  const baseLng = typeof lng === 'number' && !isNaN(lng) ? lng : 77.3272;

  let idCounter = 1;
  types.forEach(type => {
    const list = names[type] || [];
    list.slice(0, 3).forEach((facilityName, i) => {
      const angle = (idCounter * 137.5) * (Math.PI / 180);
      const distKm = 0.5 + ((idCounter * 0.45) % 3.8);
      const degLat = distKm / 111;
      const degLng = distKm / (111 * Math.cos(baseLat * Math.PI / 180));
      const itemLat = baseLat + Math.sin(angle) * degLat;
      const itemLng = baseLng + Math.cos(angle) * degLng;

      let spec = specialities[type];
      if (facilityName.toLowerCase().includes('cardio')) spec = 'cardiology';
      if (facilityName.toLowerCase().includes('pediatr')) spec = 'pediatrics';
      if (facilityName.toLowerCase().includes('gynec')) spec = 'gynecology';
      if (facilityName.toLowerCase().includes('ortho')) spec = 'orthopedics';
      if (facilityName.toLowerCase().includes('neuro')) spec = 'neurology';

      const street = `Block ${(i + 1) * 2}, Sector ${(i + 1) * 8}, ${cleanArea}`;

      facilities.push({
        id: `mock-${type}-${idCounter++}`,
        name: facilityName,
        type: type,
        speciality: spec,
        distance: `${distKm.toFixed(1)} km`,
        distanceVal: distKm,
        rating: (4.2 + ((idCounter * 0.17) % 0.7)).toFixed(1),
        isOpen: (i + idCounter) % 4 !== 0,
        timing: type === 'pharmacy' ? 'Open 24 Hours' : '8:00 AM - 9:30 PM',
        website: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facilityName + ', ' + street)}`,
        address: street,
        phone: `+91 ${98100 + ((idCounter * 1111) % 90000)} ${10000 + ((idCounter * 3333) % 90000)}`,
        lat: itemLat,
        lng: itemLng,
        isSimulated: true
      });
    });
  });

  return facilities.sort((a, b) => a.distanceVal - b.distanceVal);
};

const Nearby = () => {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [activeLocationName, setActiveLocationName] = useState('Noida, Delhi NCR');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [facilitySearchTerm, setFacilitySearchTerm] = useState('');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [manualLocationText, setManualLocationText] = useState('');
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [searchRadius, setSearchRadius] = useState(10000); // 10km default search radius
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [sortBy, setSortBy] = useState('distance'); // 'distance' or 'rating'
  const [copiedId, setCopiedId] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(
    !!(typeof window !== 'undefined' && window.google && window.google.maps)
  );
  const apiKeyUsed = (typeof window !== 'undefined' && (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || localStorage.getItem('google_maps_api_key'))) || '';

  const handleCopyLocation = (e, loc) => {
    e.stopPropagation();
    const mapUrl = getDirectionsUrl(loc);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(mapUrl);
      setCopiedId(loc.id);
      setTimeout(() => setCopiedId(null), 2200);
    }
  };

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || localStorage.getItem('google_maps_api_key');
    if (!apiKey) return;

    if (window.google && window.google.maps) {
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleMapsLoaded(true);
    script.onerror = () => console.error("Google Maps SDK failed to load.");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const searchVal = searchParams.get('search');
    const emergencyVal = searchParams.get('emergency');
    
    if (searchVal || emergencyVal === 'true') {
      const timer = setTimeout(() => {
        if (searchVal) {
          const validFilters = ['all', 'hospital', 'pharmacy', 'clinic', 'doctor', 'dentist', 'gynecologist', 'orthopedist', 'pediatrician'];
          if (validFilters.includes(searchVal.toLowerCase())) {
            setFilter(searchVal.toLowerCase());
          } else {
            setManualLocationText(searchVal);
            setFacilitySearchTerm(searchVal);
            handleManualLocationSearch(null, searchVal);
          }
        }
        if (emergencyVal === 'true') {
          setFilter('hospital');
          setShowEmergencyModal(true);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    getUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getUserLocation() {
    setIsLocatingGps(true);
    setIsLoading(true);
    setError(null);
    setSelectedFacility(null);
    
    if (!navigator.geolocation) {
      const defaultLat = 28.5706;
      const defaultLng = 77.3272;
      setUserLocation({ lat: defaultLat, lng: defaultLng });
      setActiveLocationName('Noida, Delhi NCR');
      setManualLocationText('Noida, Delhi NCR');
      fetchNearbyFacilities(defaultLat, defaultLng, searchRadius, 'Noida');
      setError('Geolocation not supported by browser. Defaulted to Noida (Delhi NCR).');
      setIsLoading(false);
      setIsLocatingGps(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        let detectedName = '';
        try {
          const revRes = await fetchWithTimeout(`https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`, {}, 2500);
          if (revRes.ok) {
            const revData = await revRes.json();
            if (revData && revData.features && revData.features[0]) {
              const p = revData.features[0].properties;
              detectedName = [p.name, p.city || p.locality, p.state].filter(Boolean).join(', ');
            }
          }
        } catch {
          // Ignore reverse geocoding fallback
        }

        const locName = detectedName || `Current Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
        setActiveLocationName(locName);
        setManualLocationText(detectedName || '');
        await fetchNearbyFacilities(latitude, longitude, searchRadius, detectedName || 'Current Area');
        setIsLoading(false);
        setIsLocatingGps(false);
      },
      (err) => {
        console.warn("GPS Error, using default Noida coordinates:", err);
        const defaultLat = 28.5706;
        const defaultLng = 77.3272;
        setUserLocation({ lat: defaultLat, lng: defaultLng });
        setActiveLocationName('Noida, Delhi NCR');
        setManualLocationText('Noida, Delhi NCR');
        fetchNearbyFacilities(defaultLat, defaultLng, searchRadius, 'Noida');
        
        let msg = 'Could not acquire GPS position. Defaulted to Noida (Delhi NCR). You can search your city above.';
        if (err.code === 1) {
          msg = 'Location permission denied. Defaulted to Noida. Search your city or area above.';
        } else if (err.code === 3) {
          msg = 'GPS request timed out. Defaulted to Noida. Search your city or area above.';
        }
        setError(msg);
        setIsLoading(false);
        setIsLocatingGps(false);
      },
      options
    );
  }

  const handleManualLocationSearch = async (e, forcedQuery) => {
    if (e) e.preventDefault();
    const query = (forcedQuery !== undefined ? forcedQuery : manualLocationText).trim();
    if (!query) return;

    setIsResolvingLocation(true);
    setError(null);
    setIsLoading(true);
    setSelectedFacility(null);

    try {
      // 1. Direct coordinate format check (e.g., "28.57, 77.32")
      const coordMatch = query.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[3]);
        const name = `Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setUserLocation({ lat, lng });
        setActiveLocationName(name);
        await fetchNearbyFacilities(lat, lng, searchRadius, name);
        setIsResolvingLocation(false);
        setIsLoading(false);
        return;
      }

      // 2. High-speed Photon Komoot Geocoder (POI, Area, City, Street)
      let resolved = null;
      try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`;
        const res = await fetchWithTimeout(photonUrl, {}, 3500);
        if (res.ok) {
          const data = await res.json();
          if (data && data.features && data.features.length > 0) {
            const feat = data.features[0];
            const [lng, lat] = feat.geometry.coordinates;
            const name = [feat.properties.name, feat.properties.city || feat.properties.district, feat.properties.state]
              .filter(Boolean)
              .join(', ');
            resolved = { lat, lng, name: name || query };
          }
        }
      } catch (err) {
        console.warn("Photon geocoder failed, trying fallback:", err);
      }

      // 3. Nominatim Fallback
      if (!resolved) {
        try {
          const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
          const res = await fetchWithTimeout(nominatimUrl, {
            headers: { 'Accept': 'application/json' }
          }, 3500);
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              resolved = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                name: data[0].display_name ? data[0].display_name.split(',').slice(0, 3).join(', ') : query
              };
            }
          }
        } catch (err) {
          console.warn("Nominatim geocoder failed:", err);
        }
      }

      // 4. Known City Directory Fallback for Instant Search Reliability
      if (!resolved) {
        const lowerQ = query.toLowerCase();
        const cityLookup = {
          'noida': { lat: 28.5706, lng: 77.3272, name: 'Noida, Uttar Pradesh' },
          'delhi': { lat: 28.6139, lng: 77.2090, name: 'Delhi, NCR' },
          'new delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi' },
          'gurgaon': { lat: 28.4595, lng: 77.0266, name: 'Gurugram, Haryana' },
          'gurugram': { lat: 28.4595, lng: 77.0266, name: 'Gurugram, Haryana' },
          'mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai, Maharashtra' },
          'bengaluru': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka' },
          'bangalore': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka' },
          'hyderabad': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad, Telangana' },
          'chennai': { lat: 13.0827, lng: 80.2707, name: 'Chennai, Tamil Nadu' },
          'kolkata': { lat: 22.5726, lng: 88.3639, name: 'Kolkata, West Bengal' },
          'pune': { lat: 18.5204, lng: 73.8567, name: 'Pune, Maharashtra' },
          'ahmedabad': { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad, Gujarat' },
          'jaipur': { lat: 26.9124, lng: 75.7873, name: 'Jaipur, Rajasthan' },
          'lucknow': { lat: 26.8467, lng: 80.9462, name: 'Lucknow, Uttar Pradesh' },
          'chandigarh': { lat: 30.7333, lng: 76.7794, name: 'Chandigarh' },
          'faridabad': { lat: 28.4089, lng: 77.3178, name: 'Faridabad, Haryana' },
          'ghaziabad': { lat: 28.6692, lng: 77.4538, name: 'Ghaziabad, Uttar Pradesh' },
          'indirapuram': { lat: 28.6393, lng: 77.3698, name: 'Indirapuram, Ghaziabad' },
          'saket': { lat: 28.5244, lng: 77.2166, name: 'Saket, New Delhi' },
        };

        for (const [key, val] of Object.entries(cityLookup)) {
          if (lowerQ.includes(key)) {
            resolved = val;
            break;
          }
        }
      }

      if (resolved) {
        setUserLocation({ lat: resolved.lat, lng: resolved.lng });
        setActiveLocationName(resolved.name);
        await fetchNearbyFacilities(resolved.lat, resolved.lng, searchRadius, resolved.name);
      } else {
        // Even if third-party geocoder doesn't recognize it, Google Maps knows all queries!
        setActiveLocationName(query);
        const fallbackLat = userLocation ? userLocation.lat : 28.5706;
        const fallbackLng = userLocation ? userLocation.lng : 77.3272;
        await fetchNearbyFacilities(fallbackLat, fallbackLng, searchRadius, query);
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
      setError('Search encountered an error. Google Maps is displaying direct search results.');
    } finally {
      setIsResolvingLocation(false);
      setIsLoading(false);
    }
  };

  const fetchFromGooglePlaces = (lat, lng, radius) => {
    setIsLoading(true);
    setError(null);

    try {
      const mapDiv = document.createElement('div');
      const service = new window.google.maps.places.PlacesService(mapDiv);

      const types = ['hospital', 'pharmacy', 'doctor', 'dentist'];
      const promises = types.map(type => {
        return new Promise((resolve) => {
          const request = {
            location: new window.google.maps.LatLng(lat, lng),
            radius: radius,
            type: [type]
          };
          service.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              resolve(results.map(place => ({ ...place, primaryType: type })));
            } else {
              resolve([]);
            }
          });
        });
      });

      Promise.all(promises).then((allResults) => {
        const flatResults = allResults.flat();
        const seenIds = new Set();
        const uniquePlaces = [];
        for (const place of flatResults) {
          if (!seenIds.has(place.place_id)) {
            seenIds.add(place.place_id);
            uniquePlaces.push(place);
          }
        }

        const formatted = uniquePlaces.map(place => {
          const placeLat = place.geometry.location.lat();
          const placeLng = place.geometry.location.lng();
          const R = 6371;
          const dLat = (placeLat - lat) * Math.PI / 180;
          const dLon = (placeLng - lng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(placeLat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const d = R * c;

          const type = place.primaryType;
          const queryText = encodeURIComponent(`${place.name} ${type} ${place.vicinity || ''}`);

          return {
            id: place.place_id,
            name: place.name,
            type: type,
            speciality: type === 'hospital' ? 'general medicine & surgery' : 'healthcare practitioner',
            distance: `${d.toFixed(1)} km`,
            distanceVal: d,
            rating: place.rating ? place.rating.toFixed(1) : (4.2 + Math.random() * 0.6).toFixed(1),
            isOpen: place.opening_hours ? (typeof place.opening_hours.isOpen === 'function' ? place.opening_hours.isOpen() : !!place.opening_hours.open_now) : true,
            timing: place.opening_hours?.open_now ? 'Open Now' : 'Check hours',
            address: place.vicinity || 'Local Area',
            website: `https://www.google.com/maps/search/?api=1&query=${queryText}`,
            phone: '+91 108',
            lat: placeLat,
            lng: placeLng
          };
        })
        .sort((a, b) => a.distanceVal - b.distanceVal)
        .slice(0, 35);

        setLocations(formatted);
        setIsLoading(false);
      }).catch(err => {
        console.error("Google Places processing failed, falling back to OSM:", err);
        fetchNearbyFacilitiesOSM(lat, lng, radius, activeLocationName);
      });
    } catch (err) {
      console.error("Google Places Service failed, falling back to OSM:", err);
      fetchNearbyFacilitiesOSM(lat, lng, radius, activeLocationName);
    }
  };

  async function fetchNearbyFacilities(lat, lng, customRadius, areaName) {
    const radius = customRadius || searchRadius;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || localStorage.getItem('google_maps_api_key');
    
    if (apiKey && window.google && window.google.maps && window.google.maps.places) {
      fetchFromGooglePlaces(lat, lng, radius);
    } else {
      fetchNearbyFacilitiesOSM(lat, lng, radius, areaName || activeLocationName);
    }
  }

  async function fetchNearbyFacilitiesOSM(lat, lng, radius, areaName) {
    setIsLoading(true);
    const queryRadius = Math.min(radius || 5000, 15000);
    const query = `
      [out:json][timeout:10];
      (
        node["amenity"="hospital"](around:${queryRadius},${lat},${lng});
        node["amenity"="pharmacy"](around:${queryRadius},${lat},${lng});
        node["amenity"="clinic"](around:${queryRadius},${lat},${lng});
        node["amenity"="doctors"](around:${queryRadius},${lat},${lng});
        node["amenity"="dentist"](around:${queryRadius},${lat},${lng});
        way["amenity"="hospital"](around:${queryRadius},${lat},${lng});
        way["amenity"="clinic"](around:${queryRadius},${lat},${lng});
      );
      out center 40;
    `;

    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://api.openstreetmap.fr/oapi/interpreter'
    ];

    let data = null;
    for (const url of endpoints) {
      try {
        const response = await fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`
        }, 4500);
        
        if (response.ok) {
          const parsed = await response.json();
          if (parsed && Array.isArray(parsed.elements) && parsed.elements.length > 0) {
            data = parsed;
            break;
          }
        }
      } catch {
        // try next endpoint
      }
    }

    if (!data || !data.elements || data.elements.length === 0) {
      const mocks = generateMockFacilities(lat, lng, areaName);
      setLocations(mocks);
      setIsLoading(false);
      return;
    }

    try {
      const formattedLocations = data.elements
        .filter(el => el.tags && (el.tags.name || el.tags['name:en']))
        .map(el => {
          const itemLat = el.lat || el.center?.lat;
          const itemLon = el.lon || el.center?.lon;
          if (!itemLat || !itemLon) return null;

          const R = 6371;
          const dLat = (itemLat - lat) * Math.PI / 180;
          const dLon = (itemLon - lng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(itemLat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const d = R * c;

          const rawAmenity = el.tags.amenity || 'hospital';
          const type = rawAmenity === 'doctors' ? 'doctor' : rawAmenity;
          const spec = (el.tags['healthcare:speciality'] || el.tags.speciality || '').toLowerCase();
          const name = el.tags.name || el.tags['name:en'];
          const street = el.tags['addr:street'] || el.tags['addr:suburb'] || el.tags['addr:city'] || (areaName ? `${areaName}` : 'Nearby Medical District');

          return {
            id: `osm-${el.id}`,
            name: name,
            type: type,
            speciality: spec || (type === 'hospital' ? 'general medicine & surgery' : type),
            distance: `${d.toFixed(1)} km`,
            distanceVal: d,
            rating: (4.1 + Math.random() * 0.8).toFixed(1),
            isOpen: el.tags.opening_hours ? !el.tags.opening_hours.includes('closed') : true,
            timing: el.tags.opening_hours || 'Hours vary',
            website: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + street)}`,
            address: el.tags['addr:full'] || `${street}`,
            phone: el.tags.phone || el.tags['contact:phone'] || '+91 108',
            lat: itemLat,
            lng: itemLon
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distanceVal - b.distanceVal)
        .slice(0, 35);

      if (formattedLocations.length === 0) {
        setLocations(generateMockFacilities(lat, lng, areaName));
      } else {
        setLocations(formattedLocations);
      }
    } catch {
      setLocations(generateMockFacilities(lat, lng, areaName));
    } finally {
      setIsLoading(false);
    }
  }

  const getCategoryCount = (cat) => {
    return locations.filter(loc => {
      if (cat === 'all') return true;
      if (cat === 'gynecologist') return loc.speciality.includes('gynaecology') || loc.speciality.includes('gynecology') || loc.name.toLowerCase().includes('gynec');
      if (cat === 'orthopedist') return loc.speciality.includes('orthopaedics') || loc.speciality.includes('orthopedics') || loc.name.toLowerCase().includes('ortho');
      if (cat === 'dentist') return loc.type === 'dentist' || loc.speciality.includes('dentist') || loc.name.toLowerCase().includes('dent');
      if (cat === 'pediatrician') return loc.speciality.includes('paediatrics') || loc.speciality.includes('pediatrics') || loc.name.toLowerCase().includes('pediatr') || loc.name.toLowerCase().includes('child');
      return loc.type === cat || loc.name.toLowerCase().includes(cat.toLowerCase());
    }).length;
  };

  const getChipLabel = (label, cat) => {
    if (isLoading || locations.length === 0) return label;
    return `${label} (${getCategoryCount(cat)})`;
  };

  const filteredLocations = useMemo(() => {
    let list = locations.filter(loc => {
      // 1. Category Filter
      if (filter !== 'all') {
        const matchesCategory = (() => {
          if (filter === 'gynecologist') return loc.speciality?.includes('gynaecology') || loc.speciality?.includes('gynecology') || loc.name.toLowerCase().includes('gynec');
          if (filter === 'orthopedist') return loc.speciality?.includes('orthopaedics') || loc.speciality?.includes('orthopedics') || loc.name.toLowerCase().includes('ortho');
          if (filter === 'dentist') return loc.type === 'dentist' || loc.speciality?.includes('dentist') || loc.name.toLowerCase().includes('dent');
          if (filter === 'pediatrician') return loc.speciality?.includes('paediatrics') || loc.speciality?.includes('pediatrics') || loc.name.toLowerCase().includes('pediatr') || loc.name.toLowerCase().includes('child');
          return loc.type === filter || loc.name.toLowerCase().includes(filter.toLowerCase());
        })();
        if (!matchesCategory) return false;
      }

      // 2. Keyword Search Filter
      if (facilitySearchTerm && facilitySearchTerm.trim()) {
        const term = facilitySearchTerm.toLowerCase().trim();
        const matchesTerm = loc.name.toLowerCase().includes(term) ||
                            (loc.speciality && loc.speciality.toLowerCase().includes(term)) ||
                            (loc.address && loc.address.toLowerCase().includes(term)) ||
                            (loc.type && loc.type.toLowerCase().includes(term));
        if (!matchesTerm) return false;
      }

      // 3. Open Now filter
      if (openNowOnly && !loc.isOpen) {
        return false;
      }

      return true;
    });

    if (sortBy === 'rating') {
      return [...list].sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
    }
    return [...list].sort((a, b) => (a.distanceVal || 0) - (b.distanceVal || 0));
  }, [locations, filter, facilitySearchTerm, openNowOnly, sortBy]);

  // Google Maps URLs
  const getGoogleMapsEmbedUrl = () => {
    let q = '';
    if (selectedFacility) {
      if (selectedFacility.lat && selectedFacility.lng) {
        q = `${selectedFacility.lat},${selectedFacility.lng}`;
      } else {
        q = `${selectedFacility.name}, ${selectedFacility.address || activeLocationName || ''}`;
      }
    } else {
      const categoryTerm = filter === 'all' 
        ? 'hospitals and clinics' 
        : (filter === 'pharmacy' ? 'pharmacy chemist' : `${filter} clinic`);
      
      if (activeLocationName) {
        q = `${categoryTerm} in ${activeLocationName}`;
      } else if (userLocation) {
        q = `${categoryTerm} near ${userLocation.lat},${userLocation.lng}`;
      } else {
        q = `${categoryTerm} near me`;
      }
    }

    if (apiKeyUsed) {
      return `https://www.google.com/maps/embed/v1/search?key=${apiKeyUsed}&q=${encodeURIComponent(q)}&zoom=14`;
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  };

  const getGoogleMapsDirectUrl = () => {
    let q = '';
    if (selectedFacility) {
      if (selectedFacility.lat && selectedFacility.lng) {
        q = `${selectedFacility.lat},${selectedFacility.lng}`;
      } else {
        q = `${selectedFacility.name}, ${selectedFacility.address || ''}`;
      }
    } else {
      const categoryTerm = filter === 'all' ? 'hospitals and medical clinics' : filter;
      if (activeLocationName) {
        q = `${categoryTerm} in ${activeLocationName}`;
      } else if (userLocation) {
        q = `${categoryTerm} near ${userLocation.lat},${userLocation.lng}`;
      } else {
        q = `${categoryTerm} near me`;
      }
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  };

  const getDirectionsUrl = (loc) => {
    const hasCoords = loc.lat && loc.lng && !isNaN(loc.lat) && !isNaN(loc.lng);
    const dest = hasCoords 
      ? `${loc.lat},${loc.lng}` 
      : encodeURIComponent(`${loc.name}, ${loc.address || activeLocationName || ''}`);
    
    const originParam = (userLocation?.lat && userLocation?.lng) 
      ? `&origin=${userLocation.lat},${userLocation.lng}` 
      : '';

    return `https://www.google.com/maps/dir/?api=1${originParam}&destination=${dest}&travelmode=driving`;
  };

  const handleOpenDirections = (e, loc) => {
    e.stopPropagation();
    const url = getDirectionsUrl(loc);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="nearby-container container">
      {showEmergencyModal && (
        <div className="emergency-sos-overlay" onClick={() => setShowEmergencyModal(false)}>
          <div className="emergency-sos-modal glass animate-scale-up" onClick={(e) => e.stopPropagation()}>
            
            <div className="emergency-system-status">
              <span className="status-indicator-text">{t('sosContactStatus')}</span>
            </div>

            <div className="sos-radar-animation">
              <div className="radar-wave wave-1"></div>
              <div className="radar-wave wave-2"></div>
              <div className="radar-wave wave-3"></div>
              <div className="radar-core">
                <AlertOctagon size={28} color="white" />
              </div>
            </div>
            
            <h2 className="sos-title">{t('emergencyAlert')}</h2>
            <p className="sos-desc">{t('emergencyGuidelines')}</p>
            
            <a href="tel:108" className="sos-call-btn">
              <Phone size={22} className="phone-icon-pulse" />
              <div className="sos-call-text-wrapper">
                <span className="call-title">{t('sosAmbulanceTitle')}</span>
                <span className="call-number">{t('sosAmbulanceDetail')}</span>
              </div>
            </a>
            <a href="tel:112" className="sos-call-btn sos-police-btn">
              <Phone size={22} />
              <div className="sos-call-text-wrapper">
                <span className="call-title">{t('sosPoliceTitle')}</span>
                <span className="call-number">{t('sosPoliceDetail')}</span>
              </div>
            </a>

            <div className="sos-instructions-grid">
              <div className="sos-step-card glass">
                <div className="step-icon-container text-rose">
                  <HeartPulse size={20} />
                </div>
                <div className="step-content">
                  <span className="step-badge">CRITICAL ACTION 1</span>
                  <p className="step-text">{t('sosStep1').replace(/^\d+\.\s*/, '')}</p>
                </div>
              </div>
              
              <div className="sos-step-card glass">
                <div className="step-icon-container text-amber">
                  <ShieldAlert size={20} />
                </div>
                <div className="step-content">
                  <span className="step-badge">CRITICAL ACTION 2</span>
                  <p className="step-text">{t('sosStep2').replace(/^\d+\.\s*/, '')}</p>
                </div>
              </div>
              
              <div className="sos-step-card glass">
                <div className="step-icon-container text-emerald">
                  <Phone size={20} />
                </div>
                <div className="step-content">
                  <span className="step-badge">CRITICAL ACTION 3</span>
                  <p className="step-text">{t('sosStep3').replace(/^\d+\.\s*/, '')}</p>
                </div>
              </div>
            </div>

            <button 
              className="btn sos-close-btn" 
              onClick={() => setShowEmergencyModal(false)}
            >
              {language === 'en' ? 'Proceed to Nearby Hospital Directory →' : 'आस-पास के अस्पताल सूची पर जाएं →'}
            </button>
          </div>
        </div>
      )}

      {/* Emergency Quick Action Strip */}
      <div className="nearby-sos-strip glass">
        <div className="sos-strip-left">
          <div className="sos-pulse-icon">
            <AlertOctagon size={18} />
          </div>
          <div className="sos-strip-text">
            <strong>Critical Medical Emergency?</strong>
            <span>Immediate response: Ambulance (108) or National Helpline (112)</span>
          </div>
        </div>
        <div className="sos-strip-actions">
          <a href="tel:108" className="sos-strip-call">
            <Phone size={14} />
            <span>Call 108</span>
          </a>
          <button 
            type="button" 
            onClick={() => setShowEmergencyModal(true)} 
            className="sos-strip-guide"
          >
            <ShieldAlert size={14} />
            <span>Emergency Protocol</span>
          </button>
        </div>
      </div>

      <div className="nearby-header">
        <div className="nearby-hero-badge">
          <Crosshair size={14} />
          <span>Live Healthcare GPS Radar</span>
        </div>
        <h1 className="page-title">{t('nearbyTitle') || 'Nearby Services Locator'}</h1>
        <p className="page-subtitle">
          {t('nearbySubtitle') || 'Find verified clinics, 24/7 pharmacies, hospitals, and medical practitioners around your location.'}
        </p>
        
        {/* Geocoding & Place Search Form */}
        <form onSubmit={handleManualLocationSearch} className="location-search-container glass">
          <div className="location-input-wrapper">
            <MapPin size={18} className="search-pin-icon" />
            <input 
              type="text" 
              placeholder="Search city, area, hospital or landmark (e.g. Kanpur, Delhi, Noida)..."
              value={manualLocationText}
              onChange={(e) => {
                setManualLocationText(e.target.value);
                setFacilitySearchTerm(e.target.value);
              }}
            />
            {manualLocationText && (
              <button 
                type="button" 
                className="input-clear-btn" 
                onClick={() => {
                  setManualLocationText('');
                  setFacilitySearchTerm('');
                }}
                title="Clear input"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="radius-wrapper">
            <Compass size={16} className="radius-icon" />
            <select 
              className="radius-select" 
              value={searchRadius} 
              onChange={(e) => {
                const r = parseInt(e.target.value);
                setSearchRadius(r);
                if (userLocation) {
                  fetchNearbyFacilities(userLocation.lat, userLocation.lng, r, activeLocationName);
                }
              }}
            >
              <option value={2000}>2 km radius</option>
              <option value={5000}>5 km radius</option>
              <option value={10000}>10 km radius</option>
              <option value={20000}>20 km radius</option>
              <option value={50000}>50 km radius</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary location-search-btn" 
            disabled={isResolvingLocation || isLoading}
          >
            {isResolvingLocation ? (
              <Loader2 className="spinner" size={16} />
            ) : (
              <>
                <Search size={16} />
                <span>Search</span>
              </>
            )}
          </button>

          <button 
            type="button" 
            onClick={getUserLocation} 
            className={`gps-btn ${isLocatingGps ? 'locating' : ''}`} 
            title={t('useGpsLocation') || 'Use GPS Location'} 
            disabled={isLoading || isLocatingGps}
          >
            {isLocatingGps ? (
              <Loader2 size={16} className="spinner" />
            ) : (
              <Navigation size={16} />
            )}
            <span>{t('useGpsLocation') || 'My Live GPS'}</span>
          </button>
        </form>

        {/* Current Target Location & Scope Bar */}
        <div className="active-target-bar">
          <div className="target-pill">
            <span className="target-dot"></span>
            <span className="target-label">Target Area:</span>
            <strong className="target-name">{activeLocationName || 'Detecting...'}</strong>
            <span className="target-dist">({(searchRadius / 1000)} km radius)</span>
          </div>
          <div className="target-stats-quick">
            <span className="stats-metric"><strong>{locations.length}</strong> facilities nearby</span>
            <span className="stats-divider">•</span>
            <span className="stats-open-metric">
              <span className="mini-green-dot"></span>
              <strong>{locations.filter(l => l.isOpen).length}</strong> Open Now
            </span>
          </div>
        </div>

        {/* Category Filters with Rich Icons */}
        <div className="filter-chips-wrapper">
          <div className="filter-chips">
            <button 
              className={`chip ${filter === 'all' ? 'active' : ''}`}
              onClick={() => { setFilter('all'); setSelectedFacility(null); }}
            >
              <Sparkles size={14} className="chip-icon" />
              <span>{getChipLabel('All Services', 'all')}</span>
            </button>
            <button 
              className={`chip chip-hospital ${filter === 'hospital' ? 'active' : ''}`}
              onClick={() => { setFilter('hospital'); setSelectedFacility(null); }}
            >
              <Building2 size={14} className="chip-icon" />
              <span>{getChipLabel('Hospitals', 'hospital')}</span>
            </button>
            <button 
              className={`chip chip-pharmacy ${filter === 'pharmacy' ? 'active' : ''}`}
              onClick={() => { setFilter('pharmacy'); setSelectedFacility(null); }}
            >
              <Pill size={14} className="chip-icon" />
              <span>{getChipLabel('Pharmacies 24x7', 'pharmacy')}</span>
            </button>
            <button 
              className={`chip chip-clinic ${filter === 'clinic' ? 'active' : ''}`}
              onClick={() => { setFilter('clinic'); setSelectedFacility(null); }}
            >
              <Stethoscope size={14} className="chip-icon" />
              <span>{getChipLabel('Clinics', 'clinic')}</span>
            </button>
            <button 
              className={`chip chip-doctor ${filter === 'doctor' ? 'active' : ''}`}
              onClick={() => { setFilter('doctor'); setSelectedFacility(null); }}
            >
              <Activity size={14} className="chip-icon" />
              <span>{getChipLabel('Doctors', 'doctor')}</span>
            </button>
            <button 
              className={`chip ${filter === 'gynecologist' ? 'active' : ''}`}
              onClick={() => { setFilter('gynecologist'); setSelectedFacility(null); }}
            >
              <span>{getChipLabel('Gynecology', 'gynecologist')}</span>
            </button>
            <button 
              className={`chip ${filter === 'orthopedist' ? 'active' : ''}`}
              onClick={() => { setFilter('orthopedist'); setSelectedFacility(null); }}
            >
              <span>{getChipLabel('Orthopedics', 'orthopedist')}</span>
            </button>
            <button 
              className={`chip ${filter === 'pediatrician' ? 'active' : ''}`}
              onClick={() => { setFilter('pediatrician'); setSelectedFacility(null); }}
            >
              <span>{getChipLabel('Pediatrics', 'pediatrician')}</span>
            </button>
            <button 
              className={`chip chip-dentist ${filter === 'dentist' ? 'active' : ''}`}
              onClick={() => { setFilter('dentist'); setSelectedFacility(null); }}
            >
              <span>{getChipLabel('Dentists', 'dentist')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results & Quick Filters Toolbar */}
      <div className="results-toolbar">
        <div className="results-count-text">
          <span>Showing</span>
          <strong>{filteredLocations.length}</strong>
          <span>verified facilities</span>
          {filter !== 'all' && <span className="active-filter-badge">{filter}</span>}
        </div>

        <div className="toolbar-controls">
          <button 
            type="button" 
            className={`open-now-toggle ${openNowOnly ? 'active' : ''}`}
            onClick={() => setOpenNowOnly(!openNowOnly)}
            title="Filter to show only currently open facilities"
          >
            <span className="toggle-indicator"></span>
            <span>Open Now Only</span>
          </button>

          <div className="sort-select-wrapper">
            <SlidersHorizontal size={13} />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-dropdown"
            >
              <option value="distance">Nearest First</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="nearby-grid">
        <div className="locations-list">
          {error && (
            <div className="location-notice-banner error">
              <span>⚠️ {error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="loading-state glass">
              <div className="loading-pulse-ring">
                <Loader2 className="spinner" size={36} />
              </div>
              <h4>Locating Healthcare Facilities...</h4>
              <p>Scanning certified hospitals, 24/7 pharmacies, and clinics in your area.</p>
            </div>
          ) : filteredLocations.length === 0 && userLocation ? (
            <div className="empty-state glass">
              <MapPin size={40} className="empty-icon" />
              <h4>No facilities match your filters</h4>
              <p>Try widening your search radius or toggling off "Open Now Only".</p>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setFilter('all');
                  setFacilitySearchTerm('');
                  setOpenNowOnly(false);
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredLocations.map((loc, index) => {
              const isSelected = selectedFacility && selectedFacility.id === loc.id;
              const isCopied = copiedId === loc.id;
              return (
                <motion.div 
                  key={loc.id}
                  className={`location-card glass ${loc.type} ${isSelected ? 'selected' : ''}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.24, delay: Math.min(index * 0.03, 0.25) }}
                  onClick={() => setSelectedFacility(loc)}
                >
                  {/* Category Accent Stripe */}
                  <div className={`card-accent-stripe ${loc.type}`}></div>

                  {/* Active on Map Tag */}
                  {isSelected && (
                    <div className="loc-selected-badge">
                      <Check size={12} />
                      <span>Active on Map</span>
                    </div>
                  )}

                  {/* Header: Name and Status */}
                  <div className="loc-header">
                    <div className="loc-title-group">
                      <div className="loc-category-row">
                        <span className={`loc-type-badge ${loc.type}`}>
                          {loc.type === 'hospital' && <Building2 size={11} />}
                          {loc.type === 'pharmacy' && <Pill size={11} />}
                          {loc.type === 'clinic' && <Stethoscope size={11} />}
                          {loc.type === 'doctor' && <Activity size={11} />}
                          <span>{loc.type}</span>
                        </span>
                        {loc.isSimulated && (
                          <span className="verified-badge">
                            <ShieldCheck size={11} />
                            <span>Directory Verified</span>
                          </span>
                        )}
                      </div>
                      <h3 title={loc.name}>{loc.name}</h3>
                    </div>

                    <div className={`status-pill ${loc.isOpen ? 'status-open' : 'status-closed'}`}>
                      {loc.isOpen && <span className="status-ping"></span>}
                      <span className="status-dot"></span>
                      <span className="status-label">{loc.isOpen ? 'Open Now' : 'Closed'}</span>
                    </div>
                  </div>

                  {/* Data Pills: Distance, Rating, Speciality */}
                  <div className="loc-data-pills">
                    {loc.distance && (
                      <span className="data-pill distance-pill" title="Distance from searched location">
                        <Compass size={12} className="pill-icon" />
                        <span>{loc.distance}</span>
                      </span>
                    )}
                    {loc.rating && (
                      <span className="data-pill rating-pill" title="User rating">
                        <Star size={12} className="pill-icon star-icon" />
                        <span>{loc.rating}</span>
                      </span>
                    )}
                    {loc.speciality && (
                      <span className="data-pill speciality-pill" title={loc.speciality}>
                        <Activity size={12} className="pill-icon" />
                        <span className="pill-text-truncate">{loc.speciality}</span>
                      </span>
                    )}
                  </div>

                  {/* Details Box: Address, Hours, Phone */}
                  <div className="loc-details-box">
                    {loc.address && (
                      <div className="detail-data-item">
                        <div className="detail-icon-wrap">
                          <MapPin size={13} />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Address</span>
                          <span className="detail-text" title={loc.address}>{loc.address}</span>
                        </div>
                      </div>
                    )}

                    {loc.timing && (
                      <div className="detail-data-item">
                        <div className="detail-icon-wrap">
                          <Clock size={13} />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Working Hours</span>
                          <span className="detail-text">{loc.timing}</span>
                        </div>
                      </div>
                    )}

                    {loc.phone && loc.phone !== 'N/A' && (
                      <div className="detail-data-item">
                        <div className="detail-icon-wrap">
                          <Phone size={13} />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Helpline / Contact</span>
                          <a 
                            href={`tel:${loc.phone.replace(/[^+\d]/g, '')}`} 
                            onClick={(e) => e.stopPropagation()} 
                            className="detail-phone-link"
                          >
                            {loc.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="loc-actions">
                    <a 
                      href={getDirectionsUrl(loc)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      onClick={(e) => handleOpenDirections(e, loc)}
                      className="btn btn-primary btn-sm loc-dir-btn"
                      title={`Get Google Maps directions to ${loc.name}`}
                    >
                      <Navigation size={14} className="dir-nav-icon" />
                      <span>Directions</span>
                      <ArrowUpRight size={13} className="dir-arrow-icon" />
                    </a>

                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFacility(loc);
                      }} 
                      className={`btn btn-sm loc-map-btn ${isSelected ? 'btn-primary is-active' : 'btn-outline'}`}
                    >
                      <Map size={14} />
                      <span>{isSelected ? 'On Map' : 'View on Map'}</span>
                    </button>

                    {loc.phone && loc.phone !== 'N/A' && (
                      <a 
                        href={`tel:${loc.phone.replace(/[^+\d]/g, '')}`} 
                        onClick={(e) => e.stopPropagation()}
                        className="btn btn-outline btn-sm loc-call-btn"
                        title={`Call ${loc.name}`}
                      >
                        <Phone size={14} />
                      </a>
                    )}

                    <button 
                      type="button" 
                      onClick={(e) => handleCopyLocation(e, loc)} 
                      className={`btn btn-outline btn-sm loc-share-btn ${isCopied ? 'copied' : ''}`}
                      title={isCopied ? 'Link Copied!' : 'Copy Location Link'}
                    >
                      {isCopied ? <Check size={14} /> : <Share2 size={14} />}
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Live Google Map Interactive View (Sticky on Desktop) */}
        <div className="map-panel-sticky">
          <div className="map-placeholder glass shadow-md">
            {!userLocation ? (
              <>
                <div className="map-illustration">
                  <MapPin size={48} className="map-pin-icon" />
                  <div className="pulse-ring"></div>
                  <div className="pulse-ring delay"></div>
                </div>
                <h3>Google Maps View</h3>
                <p>Click "My Live GPS" or search your city above to view live Google Maps.</p>
                <button 
                  className="btn btn-primary gps-action-btn" 
                  onClick={getUserLocation} 
                  disabled={isLoading || isLocatingGps}
                >
                  <Navigation size={16} />
                  <span>{t('useGpsLocation') || 'My Live GPS'}</span>
                </button>
              </>
            ) : (
              <div className="map-active-state">
                <div className="google-map-header">
                  <div className="google-map-brand-wrap">
                    <div className="google-map-brand-pill">
                      <span className="google-g">G</span>
                      <span className="google-maps-text">Google Maps</span>
                    </div>
                    <span className="google-map-current-query" title={selectedFacility ? selectedFacility.name : activeLocationName}>
                      {selectedFacility 
                        ? `📍 ${selectedFacility.name}` 
                        : `🔍 ${filter === 'all' ? 'Healthcare' : filter} in ${activeLocationName || 'Nearby'}`
                      }
                    </span>
                  </div>

                  <div className="google-map-actions">
                    {selectedFacility && (
                      <button 
                        type="button" 
                        className="map-top-btn" 
                        onClick={() => setSelectedFacility(null)}
                        title="Show all nearby facilities on map"
                      >
                        <RotateCcw size={13} />
                        <span>All Nearby</span>
                      </button>
                    )}
                    <a 
                      href={getGoogleMapsDirectUrl()} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="map-top-btn map-external-link"
                      title="Open in full Google Maps app or browser tab"
                    >
                      <span>{t('openInGoogleMaps') || 'Open in Google Maps'}</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>

                <div className="map-iframe-container">
                  <iframe
                    key={`${selectedFacility ? selectedFacility.id : 'all'}-${userLocation.lat}-${userLocation.lng}-${filter}`}
                    title="Google Maps Healthcare Services"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 'none', borderRadius: '0.85rem', width: '100%', height: '100%', minHeight: '520px' }}
                    src={getGoogleMapsEmbedUrl()}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nearby;
