import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
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

const generateMockFacilities = (lat) => {
  const names = {
    hospital: ["Apollo Hospital", "Max Super Speciality Hospital", "Fortis Hospital", "Metro Hospital & Heart Institute", "Kailash Hospital"],
    pharmacy: ["Apollo Pharmacy", "MedPlus Pharmacy", "Wellness Care Pharmacy", "Life Line Chemist", "CureAll Pharmacy"],
    clinic: ["Care First Family Clinic", "Apex Pediatric Clinic", "Divine Gynecological Center", "Starlight Dental Clinic", "Heal Care Clinic"],
    doctor: ["Dr. Sharma (Cardiologist)", "Dr. Kapoor (Pediatrician)", "Dr. Patel (General Physician)", "Dr. Verma (Orthopedist)", "Dr. Das (Neurologist)"],
    dentist: ["Smile Dental Care Center", "Apex Dentists", "Tooth Care Clinic", "Cosmetic Dentistry Center", "Dental Wellness Clinic"]
  };

  const types = ['hospital', 'pharmacy', 'clinic', 'doctor', 'dentist'];
  const specialities = {
    hospital: "general medicine",
    pharmacy: "chemist",
    clinic: "family care",
    doctor: "cardiology",
    dentist: "dentistry"
  };

  return Array.from({ length: 8 }).map((_, idx) => {
    // Generate slight offset for lat/lng (within ~2km)
    const offsetLat = (Math.random() - 0.5) * 0.03;
    const offsetLng = (Math.random() - 0.5) * 0.03;
    const itemLat = lat + offsetLat;

    // Calculate distance
    const R = 6371; // km
    const dLat = (offsetLat) * Math.PI / 180;
    const dLon = (offsetLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat * Math.PI / 180) * Math.cos(itemLat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;

    const type = types[idx % types.length];
    const nameList = names[type];
    const name = nameList[idx % nameList.length];

    return {
      id: `mock-${idx}-${idx + 100}`,
      name: name,
      type: type,
      speciality: specialities[type],
      distance: d.toFixed(1) + ' km',
      distanceVal: d,
      rating: (4.1 + Math.random() * 0.8).toFixed(1),
      isOpen: Math.random() > 0.2,
      timing: "9:00 AM - 9:00 PM",
      website: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + type + ' Street #' + (idx + 10) + ', Medical District')}`,
      address: `Street #${idx + 10}, Medical District`,
      phone: "+91 98765 43210",
      isSimulated: true
    };
  }).sort((a, b) => a.distanceVal - b.distanceVal);
};

const Nearby = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [manualLocationText, setManualLocationText] = useState('');
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [searchRadius, setSearchRadius] = useState(10000); // 10km default search radius
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(
    !!(typeof window !== 'undefined' && window.google && window.google.maps)
  );
  const apiKeyUsed = (typeof window !== 'undefined' && (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || localStorage.getItem('google_maps_api_key'))) || '';

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
          setFilter(searchVal);
        }
        if (emergencyVal === 'true') {
          setFilter('hospital');
          setShowEmergencyModal(true);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    // Try to get location on mount
    getUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getUserLocation() {
    setIsLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      // Geolocation not supported, default to Noida
      const defaultLat = 28.5706;
      const defaultLng = 77.3272;
      setUserLocation({ lat: defaultLat, lng: defaultLng });
      fetchNearbyFacilities(defaultLat, defaultLng);
      setError('Geolocation not supported. Defaulted to Noida (Delhi NCR).');
      setIsLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: false, // Set to false to resolve faster and avoid satellite GPS hangs
      timeout: 3000,             // 3 seconds timeout to prevent long hangs on startup
      maximumAge: 60000          // Allow location from last 1 minute
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        fetchNearbyFacilities(latitude, longitude);
      },
      (err) => {
        console.error("GPS Error, defaulting to Noida:", err);
        const defaultLat = 28.5706;
        const defaultLng = 77.3272;
        setUserLocation({ lat: defaultLat, lng: defaultLng });
        fetchNearbyFacilities(defaultLat, defaultLng);
        
        let msg = 'Could not retrieve GPS location automatically. Defaulted to Noida (Delhi NCR).';
        if (err.code === 1) { // PERMISSION_DENIED
          msg = 'Location permission denied. Defaulted to Noida. Search your city manually below.';
        }
        setError(msg);
        setIsLoading(false);
      },
      options
    );
  }

  const handleManualLocationSearch = async (e) => {
    if (e) e.preventDefault();
    if (!manualLocationText.trim()) return;

    setIsResolvingLocation(true);
    setError(null);
    setIsLoading(true);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocationText)}&limit=1`;
      const res = await fetchWithTimeout(url, {}, 4000); // 4 seconds timeout
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setUserLocation({ lat, lng });
          await fetchNearbyFacilities(lat, lng);
        } else {
          setError(`Could not find coordinates for "${manualLocationText}". Try adding city or country name.`);
          setIsLoading(false);
        }
      } else {
        setError('Location search service failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
      setError('Failed to contact location service. Please check your internet connection.');
      setIsLoading(false);
    } finally {
      setIsResolvingLocation(false);
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
        
        // De-duplicate
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
            speciality: type === 'hospital' ? 'general medicine' : 'healthcare practitioner',
            distance: d.toFixed(1) + ' km',
            distanceVal: d,
            isOpen: place.opening_hours ? (typeof place.opening_hours.isOpen === 'function' ? place.opening_hours.isOpen() : !!place.opening_hours.open_now) : true,
            website: `https://www.google.com/maps/search/?api=1&query=${queryText}`
          };
        })
        .sort((a, b) => a.distanceVal - b.distanceVal)
        .slice(0, 30);

        setLocations(formatted);
        setIsLoading(false);
      }).catch(err => {
        console.error("Google Places processing failed, falling back to OSM:", err);
        fetchNearbyFacilitiesOSM(lat, lng, radius);
      });
    } catch (err) {
      console.error("Google Places Service failed, falling back to OSM:", err);
      fetchNearbyFacilitiesOSM(lat, lng, radius);
    }
  };

  async function fetchNearbyFacilities(lat, lng, customRadius) {
    const radius = customRadius || searchRadius;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || localStorage.getItem('google_maps_api_key');
    
    if (apiKey && window.google && window.google.maps && window.google.maps.places) {
      fetchFromGooglePlaces(lat, lng, radius);
    } else {
      fetchNearbyFacilitiesOSM(lat, lng, radius);
    }
  }

  async function fetchNearbyFacilitiesOSM(lat, lng, radius) {
    setIsLoading(true);
    // Overpass API query for hospitals, pharmacies, clinics, and doctors (using nwr to fetch ways/relations)
    const query = `
      [out:json][timeout:25];
      (
        nwr["amenity"="hospital"](around:${radius},${lat},${lng});
        nwr["amenity"="pharmacy"](around:${radius},${lat},${lng});
        nwr["amenity"="clinic"](around:${radius},${lat},${lng});
        nwr["amenity"="doctors"](around:${radius},${lat},${lng});
        nwr["amenity"="dentist"](around:${radius},${lat},${lng});
      );
      out center;
    `;

    // Try multiple public Overpass API servers in case of rate limits or downtime
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://api.openstreetmap.fr/oapi/interpreter'
    ];

    let data = null;
    let lastError = null;

    for (const url of endpoints) {
      try {
        const response = await fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `data=${encodeURIComponent(query)}`
        }, 3500); // 3.5 seconds timeout per endpoint
        
        if (response.ok) {
          data = await response.json();
          break; // Successfully fetched
        }
        lastError = new Error(`Server returned status ${response.status}`);
      } catch (err) {
        lastError = err;
      }
    }

    if (!data) {
      console.warn("All Overpass endpoints failed. Falling back to simulated nearby facilities.", lastError);
      const mocks = generateMockFacilities(lat, lng);
      setLocations(mocks);
      setIsLoading(false);
      return;
    }

    try {
      const formattedLocations = data.elements
        .filter(el => el.tags && el.tags.name) // Only keep places with names
        .map(el => {
          // Calculate rough distance using node lat/lon or way center coordinates
          const itemLat = el.lat || el.center?.lat;
          const itemLon = el.lon || el.center?.lon;
          if (!itemLat || !itemLon) return null;

          const R = 6371; // km
          const dLat = (itemLat - lat) * Math.PI / 180;
          const dLon = (itemLon - lng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(itemLat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const d = R * c; // Distance in km
 
          const type = el.tags.amenity === 'doctors' ? 'doctor' : el.tags.amenity;
          const speciality = (el.tags['healthcare:speciality'] || '').toLowerCase();

          const timing = el.tags['opening_hours'] || 'Hours vary';
          const website = el.tags.website || el.tags['contact:website'] || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(el.tags.name + ' ' + type + ' ' + (el.tags['addr:street'] || '') + ' ' + (el.tags['addr:city'] || ''))}`;

          return {
            id: el.id,
            name: el.tags.name,
            type: type, // hospital, pharmacy, clinic, doctor, dentist
            speciality: speciality,
            distance: d.toFixed(1) + ' km',
            distanceVal: d,
            rating: (4 + Math.random()).toFixed(1), // Mock rating since OSM doesn't have it
            isOpen: true, // Assuming open for now, OSM sometimes has opening_hours
            timing: timing,
            website: website,
            address: el.tags['addr:full'] || el.tags['addr:street'] || 'Address unavailable',
            phone: el.tags.phone || el.tags['contact:phone'] || 'N/A'
          };
        })
        .filter(Boolean) // Filter out null items (items with missing coordinates)
        .sort((a, b) => a.distanceVal - b.distanceVal)
        .slice(0, 30); // limit to 30 closest

      setLocations(formattedLocations);
    } catch (err) {
      console.error(err);
      setError('Failed to format nearby facilities. Please try again.');
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

  const filteredLocations = locations.filter(loc => {
    if (filter === 'all') return true;
    if (filter === 'gynecologist') return loc.speciality.includes('gynaecology') || loc.speciality.includes('gynecology') || loc.name.toLowerCase().includes('gynec');
    if (filter === 'orthopedist') return loc.speciality.includes('orthopaedics') || loc.speciality.includes('orthopedics') || loc.name.toLowerCase().includes('ortho');
    if (filter === 'dentist') return loc.type === 'dentist' || loc.speciality.includes('dentist') || loc.name.toLowerCase().includes('dent');
    if (filter === 'pediatrician') return loc.speciality.includes('paediatrics') || loc.speciality.includes('pediatrics') || loc.name.toLowerCase().includes('pediatr') || loc.name.toLowerCase().includes('child');
    return loc.type === filter || loc.name.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="nearby-container container">
      {showEmergencyModal && (
        <div className="emergency-sos-overlay">
          <div className="emergency-sos-modal glass animate-scale-up">
            <div className="sos-badge pulsing-sos">{t('emergencyAlert')}</div>
            <h2>{t('emergencyAlert')}</h2>
            <p className="sos-desc">{t('emergencyGuidelines')}</p>
            <div className="sos-instructions">
              <div className="sos-step">
                <span className="step-num">1</span>
                <span>{t('sosStep1')}</span>
              </div>
              <div className="sos-step">
                <span className="step-num">2</span>
                <span>{t('sosStep2')}</span>
              </div>
              <div className="sos-step">
                <span className="step-num">3</span>
                <span>{t('sosStep3')}</span>
              </div>
            </div>
            <button className="btn btn-primary btn-lg sos-close-btn" onClick={() => setShowEmergencyModal(false)}>
              Close and view nearest hospitals
            </button>
          </div>
        </div>
      )}

      <div className="nearby-header">
        <h1 className="page-title">{t('nearbyTitle')}</h1>
        <p className="page-subtitle">{t('nearbySubtitle')}</p>
        
        {/* Manual Geocoding Location Search */}
        <form onSubmit={handleManualLocationSearch} className="location-search-container">
          <div className="location-input-wrapper">
            <MapPin size={18} />
            <input 
              type="text" 
              placeholder="Search town, city or area (e.g. Noida, Delhi)..."
              value={manualLocationText}
              onChange={(e) => setManualLocationText(e.target.value)}
            />
          </div>

          <select 
            className="radius-select" 
            value={searchRadius} 
            onChange={(e) => {
              const r = parseInt(e.target.value);
              setSearchRadius(r);
              if (userLocation) {
                fetchNearbyFacilities(userLocation.lat, userLocation.lng, r);
              }
            }}
          >
            <option value={2000}>2 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
            <option value={20000}>20 km</option>
            <option value={50000}>50 km</option>
          </select>

          <button type="submit" className="btn btn-primary location-search-btn" disabled={isResolvingLocation || isLoading}>
            {isResolvingLocation ? <Loader2 className="spinner" size={16} /> : 'Search'}
          </button>
          <button type="button" onClick={getUserLocation} className="gps-btn" title="Use GPS Location" disabled={isLoading}>
            <Navigation size={18} />
          </button>
        </form>


        <div className="filter-chips">
          <button 
            className={`chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {getChipLabel('All', 'all')}
          </button>
          <button 
            className={`chip ${filter === 'hospital' ? 'active' : ''}`}
            onClick={() => setFilter('hospital')}
          >
            {getChipLabel('Hospitals', 'hospital')}
          </button>
          <button 
            className={`chip ${filter === 'pharmacy' ? 'active' : ''}`}
            onClick={() => setFilter('pharmacy')}
          >
            {getChipLabel('Pharmacies', 'pharmacy')}
          </button>
          <button 
            className={`chip ${filter === 'clinic' ? 'active' : ''}`}
            onClick={() => setFilter('clinic')}
          >
            {getChipLabel('Clinics', 'clinic')}
          </button>
          <button 
            className={`chip ${filter === 'gynecologist' ? 'active' : ''}`}
            onClick={() => setFilter('gynecologist')}
          >
            {getChipLabel('Gynecologists', 'gynecologist')}
          </button>
          <button 
            className={`chip ${filter === 'orthopedist' ? 'active' : ''}`}
            onClick={() => setFilter('orthopedist')}
          >
            {getChipLabel('Orthopedists', 'orthopedist')}
          </button>
          <button 
            className={`chip ${filter === 'pediatrician' ? 'active' : ''}`}
            onClick={() => setFilter('pediatrician')}
          >
            {getChipLabel('Pediatricians', 'pediatrician')}
          </button>
          <button 
            className={`chip ${filter === 'dentist' ? 'active' : ''}`}
            onClick={() => setFilter('dentist')}
          >
            {getChipLabel('Dentists', 'dentist')}
          </button>
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
            <div className="loading-state">
              <Loader2 className="spinner" size={40} />
              <p>Locating facilities near you...</p>
            </div>
          ) : filteredLocations.length === 0 && userLocation ? (
            <div className="empty-state">
              <p>No facilities found in your area. Try expanding the search radius above.</p>
            </div>
          ) : (
            filteredLocations.map((loc, index) => (
              <motion.div 
                key={loc.id}
                className="location-card glass shadow-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="loc-header">
                  <div>
                    <h3>{loc.name}</h3>
                    <span className={`card-category-tag ${loc.type}`}>
                      {loc.type}
                    </span>
                  </div>
                  <span className={`status-dot ${loc.isOpen ? 'open' : 'closed'}`}></span>
                </div>
                
                <div className="loc-actions" style={{ marginTop: '1rem' }}>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(loc.name + ' ' + loc.type)}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                    <Navigation size={16} />
                    Directions
                  </a>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="map-placeholder glass shadow-md">
          {!userLocation ? (
            <>
              <div className="map-illustration">
                <MapPin size={48} className="map-pin-icon" />
                <div className="pulse-ring"></div>
                <div className="pulse-ring delay"></div>
              </div>
              <h3>Interactive Map View</h3>
              <p>Location access required to show live map.</p>
              <button className="btn btn-primary" onClick={getUserLocation} disabled={isLoading}>
                {isLoading ? 'Enabling...' : 'Enable Location'}
              </button>
            </>
          ) : (
            <div className="map-active-state">
              {googleMapsLoaded && apiKeyUsed ? (
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 'none', borderRadius: '1rem', height: '100%', minHeight: '400px' }}
                  src={`https://www.google.com/maps/embed/v1/search?key=${apiKeyUsed}&q=${encodeURIComponent(filter === 'all' ? 'healthcare' : filter)}+near+${userLocation.lat},${userLocation.lng}&zoom=13`}
                  allowFullScreen
                ></iframe>
              ) : (
                <>
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight="0" 
                    marginWidth="0" 
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${userLocation.lng - ((searchRadius / 1000) * 0.009)}%2C${userLocation.lat - ((searchRadius / 1000) * 0.009)}%2C${userLocation.lng + ((searchRadius / 1000) * 0.009)}%2C${userLocation.lat + ((searchRadius / 1000) * 0.009)}&layer=mapnik&marker=${userLocation.lat}%2C${userLocation.lng}`}
                    style={{ border: 'none', borderRadius: '1rem', height: '100%', minHeight: '400px' }}
                  ></iframe>
                  <br/>
                  <small>
                    <a href={`https://www.openstreetmap.org/?mlat=${userLocation.lat}&mlon=${userLocation.lng}#map=15/${userLocation.lat}/${userLocation.lng}`} target="_blank" rel="noreferrer">
                      View Larger Map
                    </a>
                  </small>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Nearby;
