import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Phone, Clock, Star, Loader2, AlertCircle } from 'lucide-react';
import './Nearby.css';

const Nearby = () => {
  const [filter, setFilter] = useState('all');
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Try to get location on mount
    getUserLocation();
  }, []);

  const getUserLocation = () => {
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
        setError('Unable to retrieve your location. Please enable location permissions.');
        setIsLoading(false);
      }
    );
  };

  const fetchNearbyFacilities = async (lat, lng) => {
    setIsLoading(true);
    // Overpass API query for hospitals, pharmacies, clinics, and doctors within 5km
    const radius = 5000;
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lng});
        node["amenity"="pharmacy"](around:${radius},${lat},${lng});
        node["amenity"="clinic"](around:${radius},${lat},${lng});
        node["amenity"="doctors"](around:${radius},${lat},${lng});
        node["amenity"="dentist"](around:${radius},${lat},${lng});
      );
      out body;
      >;
      out skel qt;
    `;

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      
      const data = await response.json();
      
      const formattedLocations = data.elements
        .filter(el => el.tags && el.tags.name) // Only keep places with names
        .map(el => {
          // Calculate rough distance
          const R = 6371; // km
          const dLat = (el.lat - lat) * Math.PI / 180;
          const dLon = (el.lon - lng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(el.lat * Math.PI / 180) *
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
        .sort((a, b) => a.distanceVal - b.distanceVal)
        .slice(0, 30); // limit to 30 closest

      setLocations(formattedLocations);
    } catch (err) {
      setError('Failed to fetch nearby facilities. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLocations = locations.filter(loc => {
    if (filter === 'all') return true;
    if (filter === 'gynecologist') return loc.speciality.includes('gynaecology') || loc.speciality.includes('gynecology') || loc.name.toLowerCase().includes('gynec');
    if (filter === 'orthopedist') return loc.speciality.includes('orthopaedics') || loc.speciality.includes('orthopedics') || loc.name.toLowerCase().includes('ortho');
    if (filter === 'dentist') return loc.type === 'dentist' || loc.speciality.includes('dentist') || loc.name.toLowerCase().includes('dent');
    if (filter === 'pediatrician') return loc.speciality.includes('paediatrics') || loc.speciality.includes('pediatrics') || loc.name.toLowerCase().includes('pediatr') || loc.name.toLowerCase().includes('child');
    return loc.type === filter;
  });

  return (
    <div className="nearby-container container">
      <div className="nearby-header">
        <h1 className="page-title">Nearby Healthcare</h1>
        <p className="page-subtitle">Real-time data for hospitals, clinics, and pharmacies near your location.</p>
        
        <div className="filter-chips">
          <button 
            className={`chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`chip ${filter === 'hospital' ? 'active' : ''}`}
            onClick={() => setFilter('hospital')}
          >
            Hospitals
          </button>
          <button 
            className={`chip ${filter === 'pharmacy' ? 'active' : ''}`}
            onClick={() => setFilter('pharmacy')}
          >
            Pharmacies
          </button>
          <button 
            className={`chip ${filter === 'clinic' ? 'active' : ''}`}
            onClick={() => setFilter('clinic')}
          >
            Clinics
          </button>
          <button 
            className={`chip ${filter === 'gynecologist' ? 'active' : ''}`}
            onClick={() => setFilter('gynecologist')}
          >
            Gynecologists
          </button>
          <button 
            className={`chip ${filter === 'orthopedist' ? 'active' : ''}`}
            onClick={() => setFilter('orthopedist')}
          >
            Orthopedists
          </button>
          <button 
            className={`chip ${filter === 'pediatrician' ? 'active' : ''}`}
            onClick={() => setFilter('pediatrician')}
          >
            Pediatricians
          </button>
          <button 
            className={`chip ${filter === 'dentist' ? 'active' : ''}`}
            onClick={() => setFilter('dentist')}
          >
            Dentists
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
              <button className="btn btn-primary" onClick={getUserLocation}>Retry</button>
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
                  <h3>{loc.name}</h3>
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
