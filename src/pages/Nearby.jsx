import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Phone, Clock, Star, Loader2, AlertCircle } from 'lucide-react';
import './Nearby.css';

const Nearby = () => {
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [manualLocationText, setManualLocationText] = useState('');
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

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
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        fetchNearbyFacilities(latitude, longitude);
      },
      (err) => {
        console.error(err);
        setError('Unable to retrieve your location automatically. Type your city/area in the search bar below.');
        setIsLoading(false);
      }
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
      const res = await fetch(url);
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

  async function fetchNearbyFacilities(lat, lng) {
    setIsLoading(true);
    // Overpass API query for hospitals, pharmacies, clinics, and doctors within 5km (using nwr to fetch ways/relations)
    const radius = 5000;
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
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `data=${encodeURIComponent(query)}`
        });
        
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
      console.error("All Overpass endpoints failed:", lastError);
      setError('Failed to fetch nearby facilities. The healthcare data service is currently overloaded. Please try again.');
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
          const website = el.tags.website || el.tags['contact:website'] || `https://www.google.com/search?q=${encodeURIComponent(el.tags.name + ' ' + type + ' website')}`;

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
          <div className="emergency-sos-modal glass">
            <div className="sos-badge pulsing-sos">EMERGENCY ALERT</div>
            <h2>Critical Triage Command</h2>
            <p className="sos-desc">We have detected an emergency command. Please follow these guidelines immediately:</p>
            <div className="sos-instructions">
              <div className="sos-step">
                <span className="step-num">1</span>
                <span><strong>Call Help Immediately:</strong> Dial <strong>108</strong> (India) or <strong>911</strong> (US). Do not drive yourself.</span>
              </div>
              <div className="sos-step">
                <span className="step-num">2</span>
                <span><strong>Navigate to Hospital:</strong> Close this modal and click <strong>"Directions"</strong> on the nearest hospital card below.</span>
              </div>
              <div className="sos-step">
                <span className="step-num">3</span>
                <span><strong>Rest & Air:</strong> Stay sitting upright. Loosen any tight clothing. Do not drink/eat anything.</span>
              </div>
            </div>
            <button className="btn btn-primary btn-lg sos-close-btn" onClick={() => setShowEmergencyModal(false)}>
              Close and view nearest hospitals
            </button>
          </div>
        </div>
      )}

      <div className="nearby-header">
        <h1 className="page-title">Nearby Healthcare</h1>
        <p className="page-subtitle">Real-time data for hospitals, clinics, and pharmacies near your location.</p>
        
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
          {isLoading ? (
            <div className="loading-state">
              <Loader2 className="spinner" size={40} />
              <p>Locating facilities near you...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <AlertCircle size={40} />
              <p>{error}</p>
              <button className="btn btn-primary" onClick={() => userLocation ? fetchNearbyFacilities(userLocation.lat, userLocation.lng) : getUserLocation()}>
                Retry
              </button>
            </div>
          ) : filteredLocations.length === 0 && userLocation ? (
            <div className="empty-state">
              <p>No facilities found in your immediate area.</p>
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
                
                <div className="loc-details">
                  <div className="detail-item">
                    <MapPin size={16} />
                    <span className="address-text">{loc.address}</span>
                  </div>
                  <div className="detail-row">
                    <div className="detail-item">
                      <Navigation size={16} />
                      <span>{loc.distance}</span>
                    </div>
                    {loc.phone !== 'N/A' && (
                      <div className="detail-item">
                        <Phone size={16} />
                        <span>{loc.phone}</span>
                      </div>
                    )}
                    <div className="detail-item rating">
                      <Star size={16} fill="currentColor" />
                      <span>{loc.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="loc-actions">
                  <a href={loc.website} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" title={loc.timing}>
                    <Clock size={16} />
                    {loc.timing.length < 15 ? loc.timing : 'View Timings'}
                  </a>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${loc.name} ${loc.type}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
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
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight="0" 
                marginWidth="0" 
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${userLocation.lng-0.02}%2C${userLocation.lat-0.02}%2C${userLocation.lng+0.02}%2C${userLocation.lat+0.02}&layer=mapnik&marker=${userLocation.lat}%2C${userLocation.lng}`}
                style={{ border: 'none', borderRadius: '1rem', height: '100%', minHeight: '400px' }}
              ></iframe>
              <br/>
              <small>
                <a href={`https://www.openstreetmap.org/?mlat=${userLocation.lat}&mlon=${userLocation.lng}#map=15/${userLocation.lat}/${userLocation.lng}`} target="_blank" rel="noreferrer">
                  View Larger Map
                </a>
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Nearby;
