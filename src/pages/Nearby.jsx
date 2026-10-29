import { useState, useEffect, useMemo, useRef, useCallback, useId } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Info,
  AlertTriangle,
  WifiOff,
} from 'lucide-react';
import { useLanguage } from '../components/LanguageContext';
import {
  DEFAULT_DEMO_LOCATION,
  acquireGpsPosition,
  reverseGeocode,
  forwardGeocode,
  fetchOsmFacilities,
  fetchGooglePlacesFacilities,
  isValidCoord,
} from '../utils/locationService';
import { sanitizeUrl, enforceMaxLength } from '../utils/security';
import './Nearby.css';

// ---------------------------------------------------------------------------
// Error message helpers
// ---------------------------------------------------------------------------

/** Returns a user-friendly string for a typed error from locationService. */
function gpsErrorMessage(err) {
  switch (err?.code) {
    case 'PERMISSION_DENIED':
      return 'Location access was denied. You can search your city or area manually using the search box above.';
    case 'POSITION_UNAVAILABLE':
      return 'GPS signal is unavailable (indoor or no network). Search your city or area manually above.';
    case 'TIMEOUT':
      return 'Location timed out. Search your city or area manually above.';
    case 'UNSUPPORTED':
      return 'Your browser does not support Geolocation. Search your city or area manually above.';
    default:
      return 'Could not determine your location. Search your city or area manually above.';
  }
}

function apiErrorMessage(err) {
  switch (err?.code) {
    case 'RATE_LIMIT':
      return 'The facility search API is rate-limited. Please wait a moment and try again.';
    case 'NETWORK_ERROR':
      return 'Network error: could not reach any facility search server. Check your internet connection.';
    case 'MALFORMED_RESPONSE':
      return 'The facility search server returned unexpected data. Try again or use a different search radius.';
    case 'INVALID_COORDS':
      return err.message;
    default:
      return err?.message || 'Failed to fetch nearby facilities.';
  }
}

// ---------------------------------------------------------------------------
// Stable request-id ref — cancels stale fetches
// ---------------------------------------------------------------------------

let _globalRequestId = 0;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Nearby = () => {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- State ---
  const [filter, setFilter] = useState('all');
  const [facilities, setFacilities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);   // GPS/geocoding errors
  const [searchError, setSearchError] = useState(null);       // Facility-fetch errors
  const [userLocation, setUserLocation] = useState(null);     // { lat, lng }
  const [activeLocationName, setActiveLocationName] = useState('');
  const [isDemoLocation, setIsDemoLocation] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [facilitySearchTerm, setFacilitySearchTerm] = useState('');
  const [manualLocationText, setManualLocationText] = useState('');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const sosModalRef = useRef(null);
  const sosOpenBtnRef = useRef(null); // element that opened the modal — for focus restoration
  const sosModalTitleId = useId();
  const [searchRadius, setSearchRadius] = useState(10000);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [sortBy, setSortBy] = useState('distance');
  const [copiedId, setCopiedId] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(
    !!(typeof window !== 'undefined' && window.google?.maps)
  );

  // Abort controller ref — cancelled on every new search
  const abortRef = useRef(null);

  const apiKeyUsed = typeof window !== 'undefined'
    ? (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '')
    : '';

  // ---------------------------------------------------------------------------
  // Load Google Maps JS SDK (if API key is available)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!apiKeyUsed || googleMapsLoaded || (typeof window !== 'undefined' && window.google?.maps)) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKeyUsed}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleMapsLoaded(true);
    script.onerror = () => console.error('Google Maps SDK failed to load.');
    document.head.appendChild(script);
  }, [apiKeyUsed, googleMapsLoaded]);

  // ---------------------------------------------------------------------------
  // URL param handling (from other pages, e.g. emergency flow)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const searchVal = searchParams.get('search');
    const emergencyVal = searchParams.get('emergency');

    if (!searchVal && emergencyVal !== 'true') return;

    const timer = setTimeout(() => {
      if (searchVal) {
        const validFilters = ['all', 'hospital', 'pharmacy', 'clinic', 'doctor', 'dentist', 'gynecologist', 'orthopedist', 'pediatrician'];
        if (validFilters.includes(searchVal.toLowerCase())) {
          setFilter(searchVal.toLowerCase());
        }
        // Do NOT trigger a location geocode from a facility-type keyword
      }
      if (emergencyVal === 'true') {
        setFilter('hospital');
        setShowEmergencyModal(prev => prev ? prev : true); // don't re-trigger if already open
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [searchParams]);

  // ---------------------------------------------------------------------------
  // On mount: attempt GPS
  // ---------------------------------------------------------------------------

  useEffect(() => {
    requestGpsLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Emergency modal: focus trap + Escape key close
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!showEmergencyModal) return;

    // Move focus into the modal
    const firstFocusable = sosModalRef.current?.querySelector(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeEmergencyModal();
        return;
      }
      // Basic focus trap: Tab / Shift+Tab cycles within the modal
      if (e.key === 'Tab' && sosModalRef.current) {
        const focusable = Array.from(
          sosModalRef.current.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => !el.closest('[aria-hidden]'));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [showEmergencyModal]); // eslint-disable-line react-hooks/exhaustive-deps

  const openEmergencyModal = useCallback((triggerEl) => {
    if (showEmergencyModal) return; // duplicate-open guard
    if (triggerEl) sosOpenBtnRef.current = triggerEl;
    setShowEmergencyModal(true);
  }, [showEmergencyModal]);

  const closeEmergencyModal = useCallback(() => {
    setShowEmergencyModal(false);
    if (searchParams.get('emergency')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('emergency');
      setSearchParams(nextParams, { replace: true });
    }
    // Restore focus to the element that opened the modal
    setTimeout(() => sosOpenBtnRef.current?.focus(), 50);
  }, [searchParams, setSearchParams]);

  // ---------------------------------------------------------------------------
  // Cancel any running fetch (call before starting a new one)
  // ---------------------------------------------------------------------------

  function cancelInFlight() {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    return abortRef.current.signal;
  }

  // ---------------------------------------------------------------------------
  // Core: fetch facilities for a resolved location
  // ---------------------------------------------------------------------------

  async function loadFacilities(lat, lng, radiusM, areaName, signal) {
    if (!isValidCoord(lat, lng)) {
      setSearchError('Invalid coordinates — cannot search for facilities.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setSearchError(null);
    setFacilities([]);          // clear stale results immediately
    setSelectedFacility(null);

    // Assign a request ID to detect stale callbacks
    const reqId = ++_globalRequestId;

    try {
      let fetched;

      if (apiKeyUsed && googleMapsLoaded && window.google?.maps?.places) {
        try {
          fetched = await fetchGooglePlacesFacilities(lat, lng, radiusM);
        } catch (gErr) {
          if (gErr.name === 'AbortError' || signal?.aborted) return;
          console.warn('Google Places failed, falling back to OSM:', gErr);
          const { facilities: osmFacilities } = await fetchOsmFacilities(lat, lng, radiusM, signal);
          fetched = osmFacilities;
        }
      } else {
        const result = await fetchOsmFacilities(lat, lng, radiusM, signal);
        fetched = result.facilities;
      }

      // Stale-request guard
      if (reqId !== _globalRequestId || signal?.aborted) return;

      setFacilities(fetched);

      if (fetched.length === 0) {
        // Not an error, just empty — the empty-state UI will handle this
      }
    } catch (err) {
      if (err.name === 'AbortError' || signal?.aborted) return;
      if (reqId !== _globalRequestId) return;
      setSearchError(apiErrorMessage(err));
      setFacilities([]);
    } finally {
      if (reqId === _globalRequestId) setIsLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // GPS location flow
  // ---------------------------------------------------------------------------

  async function requestGpsLocation() {
    const signal = cancelInFlight();
    setIsLocatingGps(true);
    setLocationError(null);
    setSearchError(null);
    setFacilities([]);

    try {
      const coords = await acquireGpsPosition();
      if (signal.aborted) return;

      setUserLocation(coords);
      setIsDemoLocation(false);

      // Reverse-geocode to get a human-readable name
      const name = await reverseGeocode(coords.lat, coords.lng, signal);
      if (signal.aborted) return;

      const locName = name || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
      setActiveLocationName(locName);
      setManualLocationText(name || '');
      setIsLocatingGps(false);

      await loadFacilities(coords.lat, coords.lng, searchRadius, locName, signal);
    } catch (gpsErr) {
      if (gpsErr.name === 'AbortError' || signal.aborted) return;

      // Fall back to demo location — clearly labeled
      const demo = DEFAULT_DEMO_LOCATION;
      setUserLocation({ lat: demo.lat, lng: demo.lng });
      setActiveLocationName(demo.name);
      setManualLocationText('');
      setIsDemoLocation(true);
      setLocationError(gpsErrorMessage(gpsErr));
      setIsLocatingGps(false);

      await loadFacilities(demo.lat, demo.lng, searchRadius, demo.name, signal);
    }
  }

  // ---------------------------------------------------------------------------
  // Manual location search
  // ---------------------------------------------------------------------------

  const handleManualLocationSearch = useCallback(async (e, forcedQuery) => {
    if (e) e.preventDefault();
    const rawQuery = (forcedQuery !== undefined ? forcedQuery : manualLocationText).trim();
    const query = enforceMaxLength(rawQuery, 250);

    if (!query) {
      setLocationError('Please enter a city, area, or coordinates to search.');
      return;
    }

    const signal = cancelInFlight();
    setIsResolvingLocation(true);
    setLocationError(null);
    setSearchError(null);
    setFacilities([]);

    try {
      const resolved = await forwardGeocode(query, signal);
      if (signal.aborted) return;

      if (!resolved) {
        setLocationError(`Could not find "${query}". Try a different city name or enter coordinates (e.g. 28.57, 77.32).`);
        setIsResolvingLocation(false);
        setIsLoading(false);
        return;
      }

      setUserLocation({ lat: resolved.lat, lng: resolved.lng });
      setActiveLocationName(resolved.name);
      setIsDemoLocation(false);
      setIsResolvingLocation(false);

      await loadFacilities(resolved.lat, resolved.lng, searchRadius, resolved.name, signal);
    } catch (err) {
      if (err.name === 'AbortError' || signal.aborted) return;
      if (err.code === 'INVALID_COORDS') {
        setLocationError(err.message);
      } else {
        setLocationError('Geocoding failed. Check your internet connection and try again.');
      }
      setIsResolvingLocation(false);
      setIsLoading(false);
    }
  }, [manualLocationText, searchRadius]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Radius change (re-fetch same location)
  // ---------------------------------------------------------------------------

  const handleRadiusChange = useCallback((newRadius) => {
    setSearchRadius(newRadius);
    if (userLocation) {
      const signal = cancelInFlight();
      loadFacilities(userLocation.lat, userLocation.lng, newRadius, activeLocationName, signal);
    }
  }, [userLocation, activeLocationName]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Filtered/sorted list
  // ---------------------------------------------------------------------------

  const filteredFacilities = useMemo(() => {
    let list = facilities.filter(loc => {
      // Category filter
      if (filter !== 'all') {
        const matchesCategory = (() => {
          if (filter === 'gynecologist')
            return loc.speciality?.includes('gynaecology') || loc.speciality?.includes('gynecology') || loc.name.toLowerCase().includes('gynec');
          if (filter === 'orthopedist')
            return loc.speciality?.includes('orthopaedics') || loc.speciality?.includes('orthopedics') || loc.name.toLowerCase().includes('ortho');
          if (filter === 'dentist')
            return loc.type === 'dentist' || loc.speciality?.includes('dentist') || loc.name.toLowerCase().includes('dent');
          if (filter === 'pediatrician')
            return loc.speciality?.includes('paediatrics') || loc.speciality?.includes('pediatrics') || loc.name.toLowerCase().includes('pediatr') || loc.name.toLowerCase().includes('child');
          return loc.type === filter || loc.name.toLowerCase().includes(filter.toLowerCase());
        })();
        if (!matchesCategory) return false;
      }

      // Keyword search within the loaded list
      if (facilitySearchTerm.trim()) {
        const term = facilitySearchTerm.toLowerCase().trim();
        const matches =
          loc.name.toLowerCase().includes(term) ||
          (loc.speciality && loc.speciality.toLowerCase().includes(term)) ||
          (loc.address && loc.address.toLowerCase().includes(term)) ||
          (loc.type && loc.type.toLowerCase().includes(term));
        if (!matches) return false;
      }

      // Open-now filter (skip facilities whose open status is unknown)
      if (openNowOnly && loc.isOpen !== true) return false;

      return true;
    });

    if (sortBy === 'rating') {
      return [...list].sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
    }
    return [...list].sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }, [facilities, filter, facilitySearchTerm, openNowOnly, sortBy]);

  // ---------------------------------------------------------------------------
  // Count helpers for chip labels
  // ---------------------------------------------------------------------------

  const getCategoryCount = (cat) => {
    return facilities.filter(loc => {
      if (cat === 'all') return true;
      if (cat === 'gynecologist') return loc.speciality?.includes('gynaecology') || loc.speciality?.includes('gynecology') || loc.name.toLowerCase().includes('gynec');
      if (cat === 'orthopedist') return loc.speciality?.includes('orthopaedics') || loc.speciality?.includes('orthopedics') || loc.name.toLowerCase().includes('ortho');
      if (cat === 'dentist') return loc.type === 'dentist' || loc.speciality?.includes('dentist') || loc.name.toLowerCase().includes('dent');
      if (cat === 'pediatrician') return loc.speciality?.includes('paediatrics') || loc.speciality?.includes('pediatrics') || loc.name.toLowerCase().includes('pediatr') || loc.name.toLowerCase().includes('child');
      return loc.type === cat || loc.name.toLowerCase().includes(cat.toLowerCase());
    }).length;
  };

  const getChipLabel = (label, cat) => {
    if (isLoading || facilities.length === 0) return label;
    return `${label} (${getCategoryCount(cat)})`;
  };

  // ---------------------------------------------------------------------------
  // Map URL helpers
  // ---------------------------------------------------------------------------

  const getGoogleMapsEmbedUrl = () => {
    let q;
    if (selectedFacility) {
      if (selectedFacility.lat && selectedFacility.lng) {
        q = `${selectedFacility.lat},${selectedFacility.lng}`;
      } else {
        q = `${selectedFacility.name}, ${selectedFacility.address || activeLocationName || ''}`;
      }
    } else {
      const cat = filter === 'all' ? 'hospitals and clinics' : (filter === 'pharmacy' ? 'pharmacy chemist' : `${filter} clinic`);
      q = activeLocationName ? `${cat} in ${activeLocationName}` : (userLocation ? `${cat} near ${userLocation.lat},${userLocation.lng}` : `${cat} near me`);
    }

    if (apiKeyUsed) {
      return `https://www.google.com/maps/embed/v1/search?key=${apiKeyUsed}&q=${encodeURIComponent(q)}&zoom=14`;
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  };

  const getGoogleMapsDirectUrl = () => {
    let q;
    if (selectedFacility) {
      q = (selectedFacility.lat && selectedFacility.lng)
        ? `${selectedFacility.lat},${selectedFacility.lng}`
        : `${selectedFacility.name}, ${selectedFacility.address || ''}`;
    } else {
      const cat = filter === 'all' ? 'hospitals and medical clinics' : filter;
      q = activeLocationName ? `${cat} in ${activeLocationName}` : (userLocation ? `${cat} near ${userLocation.lat},${userLocation.lng}` : `${cat} near me`);
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  };

  const getDirectionsUrl = (loc) => {
    let url;
    if (loc.directionsUrl) {
      // Add user origin if available
      if (userLocation?.lat && userLocation?.lng) {
        url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${loc.lat},${loc.lng}&travelmode=driving`;
      } else {
        url = loc.directionsUrl;
      }
    } else {
      const dest = (loc.lat && loc.lng && isValidCoord(loc.lat, loc.lng))
        ? `${loc.lat},${loc.lng}`
        : encodeURIComponent(`${loc.name}, ${loc.address || activeLocationName || ''}`);
      const origin = (userLocation?.lat && userLocation?.lng) ? `&origin=${userLocation.lat},${userLocation.lng}` : '';
      url = `https://www.google.com/maps/dir/?api=1${origin}&destination=${dest}&travelmode=driving`;
    }
    return sanitizeUrl(url);
  };

  const handleOpenDirections = (e, loc) => {
    e.stopPropagation();
    window.open(getDirectionsUrl(loc), '_blank', 'noopener,noreferrer');
  };

  const handleCopyLocation = (e, loc) => {
    e.stopPropagation();
    const url = getDirectionsUrl(loc);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      setCopiedId(loc.id);
      setTimeout(() => setCopiedId(null), 2200);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="nearby-container container">
      {/* Emergency Modal — accessible dialog */}
      {showEmergencyModal && (
        <div
          className="emergency-sos-overlay"
          role="presentation"
          onClick={closeEmergencyModal}
        >
          <div
            ref={sosModalRef}
            className="emergency-sos-modal glass animate-scale-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby={sosModalTitleId}
            onClick={e => e.stopPropagation()}
          >
            <div className="emergency-system-status">
              <span className="status-indicator-text">{t('sosContactStatus')}</span>
            </div>
            <div className="sos-radar-animation" aria-hidden="true">
              <div className="radar-wave wave-1"></div>
              <div className="radar-wave wave-2"></div>
              <div className="radar-wave wave-3"></div>
              <div className="radar-core"><AlertOctagon size={28} color="white" /></div>
            </div>
            <h2 id={sosModalTitleId} className="sos-title">{t('emergencyAlert')}</h2>
            <p className="sos-desc">{t('emergencyGuidelines')}</p>
            <a
              href="tel:108"
              className="sos-call-btn"
              aria-label="Call ambulance on 108. Availability varies by state."
            >
              <Phone size={22} className="phone-icon-pulse" aria-hidden="true" />
              <div className="sos-call-text-wrapper">
                <span className="call-title">{t('sosAmbulanceTitle')}</span>
                <span className="call-number">{t('sosAmbulanceDetail')}</span>
              </div>
            </a>
            <a
              href="tel:112"
              className="sos-call-btn sos-police-btn"
              aria-label="Call national emergency helpline on 112. Works across all of India."
            >
              <Phone size={22} aria-hidden="true" />
              <div className="sos-call-text-wrapper">
                <span className="call-title">{t('sosPoliceTitle')}</span>
                <span className="call-number">{t('sosPoliceDetail')}</span>
              </div>
            </a>
            <div className="sos-instructions-grid">
              <div className="sos-step-card glass">
                <div className="step-icon-container text-rose" aria-hidden="true"><HeartPulse size={20} /></div>
                <div className="step-content">
                  <span className="step-badge">CRITICAL ACTION 1</span>
                  <p className="step-text">{t('sosStep1').replace(/^\d+\.\s*/, '')}</p>
                </div>
              </div>
              <div className="sos-step-card glass">
                <div className="step-icon-container text-amber" aria-hidden="true"><ShieldAlert size={20} /></div>
                <div className="step-content">
                  <span className="step-badge">CRITICAL ACTION 2</span>
                  <p className="step-text">{t('sosStep2').replace(/^\d+\.\s*/, '')}</p>
                </div>
              </div>
              <div className="sos-step-card glass">
                <div className="step-icon-container text-emerald" aria-hidden="true"><Phone size={20} /></div>
                <div className="step-content">
                  <span className="step-badge">CRITICAL ACTION 3</span>
                  <p className="step-text">{t('sosStep3').replace(/^\d+\.\s*/, '')}</p>
                </div>
              </div>
            </div>
            <button
              className="btn sos-close-btn"
              onClick={closeEmergencyModal}
              aria-label="Close emergency dialog and proceed to hospital directory"
            >
              {language === 'en' ? 'Proceed to Nearby Hospital Directory →' : 'आस-पास के अस्पताल सूची पर जाएं →'}
            </button>
          </div>
        </div>
      )}

      {/* Emergency Quick Action Strip — always visible, no network required */}
      <div className="nearby-sos-strip glass" role="region" aria-label="Emergency contacts">
        <div className="sos-strip-left">
          <div className="sos-pulse-icon" aria-hidden="true"><AlertOctagon size={18} /></div>
          <div className="sos-strip-text">
            <strong>Critical Medical Emergency?</strong>
            <span>Ambulance&nbsp;<strong>108</strong> &nbsp;·&nbsp; National Emergency&nbsp;<strong>112</strong></span>
          </div>
        </div>
        <div className="sos-strip-actions">
          <a
            href="tel:108"
            className="sos-strip-call"
            aria-label="Call ambulance on 108"
          >
            <Phone size={14} aria-hidden="true" /><span>Call 108</span>
          </a>
          <a
            href="tel:112"
            className="sos-strip-call sos-strip-call--secondary"
            aria-label="Call national emergency helpline on 112"
          >
            <Phone size={14} aria-hidden="true" /><span>Call 112</span>
          </a>
          <button
            id="sos-protocol-btn"
            type="button"
            onClick={(e) => openEmergencyModal(e.currentTarget)}
            className="sos-strip-guide"
            aria-expanded={showEmergencyModal}
            aria-haspopup="dialog"
          >
            <ShieldAlert size={14} aria-hidden="true" /><span>Emergency Protocol</span>
          </button>
        </div>
      </div>

      <div className="nearby-header">
        <div className="nearby-hero-badge"><Crosshair size={14} /><span>Live Healthcare GPS Radar</span></div>
        <h1 className="page-title">{t('nearbyTitle') || 'Nearby Services Locator'}</h1>
        <p className="page-subtitle">
          {t('nearbySubtitle') || 'Find verified clinics, 24/7 pharmacies, hospitals, and medical practitioners around your location.'}
        </p>

        {/* Location Search Form */}
        <form onSubmit={handleManualLocationSearch} className="location-search-container glass">
          <div className="location-input-wrapper">
            <MapPin size={18} className="search-pin-icon" />
            <input
              type="text"
              placeholder="Search city or area (e.g. Kanpur, Bengaluru, Connaught Place)..."
              value={manualLocationText}
              onChange={e => setManualLocationText(e.target.value)}
            />
            {manualLocationText && (
              <button
                type="button"
                className="input-clear-btn"
                onClick={() => setManualLocationText('')}
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
              onChange={e => handleRadiusChange(parseInt(e.target.value))}
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
              <><Search size={16} /><span>Search</span></>
            )}
          </button>

          <button
            type="button"
            onClick={requestGpsLocation}
            className={`gps-btn ${isLocatingGps ? 'locating' : ''}`}
            title={t('useGpsLocation') || 'Use GPS Location'}
            disabled={isLoading || isLocatingGps}
          >
            {isLocatingGps ? <Loader2 size={16} className="spinner" /> : <Navigation size={16} />}
            <span>{t('useGpsLocation') || 'My Live GPS'}</span>
          </button>
        </form>

        {/* Demo-location notice — shown when GPS failed / not available */}
        {isDemoLocation && (
          <div className="demo-location-notice" role="alert">
            <Info size={15} />
            <span>
              <strong>Demo location:</strong> Showing results for {activeLocationName}. This is <em>not</em> your actual position.
              Search your city above to see real nearby facilities.
            </span>
          </div>
        )}

        {/* Target bar */}
        <div className="active-target-bar">
          <div className="target-pill">
            <span className={`target-dot ${isDemoLocation ? 'target-dot-demo' : ''}`}></span>
            <span className="target-label">{isDemoLocation ? 'Demo Area:' : 'Target Area:'}</span>
            <strong className="target-name">{activeLocationName || 'Detecting...'}</strong>
            <span className="target-dist">({searchRadius / 1000} km radius)</span>
          </div>
          <div className="target-stats-quick">
            <span className="stats-metric"><strong>{facilities.length}</strong> facilities found</span>
            <span className="stats-divider">•</span>
            <span className="stats-open-metric">
              <span className="mini-green-dot"></span>
              <strong>{facilities.filter(l => l.isOpen === true).length}</strong> Open Now
            </span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="filter-chips-wrapper">
          <div className="filter-chips">
            {[
              { id: 'all',          label: 'All Services',   icon: <Sparkles size={14} className="chip-icon" />,    cls: '' },
              { id: 'hospital',     label: 'Hospitals',      icon: <Building2 size={14} className="chip-icon" />,   cls: 'chip-hospital' },
              { id: 'pharmacy',     label: 'Pharmacies 24x7',icon: <Pill size={14} className="chip-icon" />,        cls: 'chip-pharmacy' },
              { id: 'clinic',       label: 'Clinics',        icon: <Stethoscope size={14} className="chip-icon" />, cls: 'chip-clinic' },
              { id: 'doctor',       label: 'Doctors',        icon: <Activity size={14} className="chip-icon" />,    cls: 'chip-doctor' },
              { id: 'gynecologist', label: 'Gynecology',     icon: null,                                             cls: '' },
              { id: 'orthopedist',  label: 'Orthopedics',    icon: null,                                             cls: '' },
              { id: 'pediatrician', label: 'Pediatrics',     icon: null,                                             cls: '' },
              { id: 'dentist',      label: 'Dentists',       icon: null,                                             cls: 'chip-dentist' },
            ].map(({ id, label, icon, cls }) => (
              <button
                key={id}
                className={`chip ${cls} ${filter === id ? 'active' : ''}`}
                onClick={() => { setFilter(id); setSelectedFacility(null); }}
              >
                {icon}
                <span>{getChipLabel(label, id)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Toolbar */}
      <div className="results-toolbar">
        <div className="results-count-text">
          <span>Showing</span>
          <strong>{filteredFacilities.length}</strong>
          <span>facilities</span>
          {filter !== 'all' && <span className="active-filter-badge">{filter}</span>}
          {isDemoLocation && <span className="demo-badge-inline">demo location</span>}
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
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="sort-dropdown">
              <option value="distance">Nearest First</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="nearby-grid">
        <div className="locations-list">
          {/* Location / GPS error banner */}
          {locationError && (
            <div className="location-notice-banner error" role="alert">
              <AlertTriangle size={16} />
              <span>{locationError}</span>
            </div>
          )}

          {/* Facility search / API error banner */}
          {searchError && !isLoading && (
            <div className="location-notice-banner error" role="alert">
              <WifiOff size={16} />
              <span>{searchError}</span>
              <button
                type="button"
                className="retry-btn"
                onClick={() => userLocation && loadFacilities(userLocation.lat, userLocation.lng, searchRadius, activeLocationName, cancelInFlight())}
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="loading-state glass">
              <div className="loading-pulse-ring">
                <Loader2 className="spinner" size={36} />
              </div>
              <h4>Locating Healthcare Facilities...</h4>
              <p>Querying verified medical data for {activeLocationName || 'your area'}.</p>
            </div>

          ) : !userLocation ? (
            /* No location yet, no error — initial state */
            <div className="empty-state glass">
              <MapPin size={40} className="empty-icon" />
              <h4>Set Your Location</h4>
              <p>Click <strong>My Live GPS</strong> or enter a city above to find nearby facilities.</p>
            </div>

          ) : filteredFacilities.length === 0 && !searchError ? (
            /* Loaded but empty */
            <div className="empty-state glass">
              <MapPin size={40} className="empty-icon" />
              {facilities.length === 0 ? (
                <>
                  <h4>No facilities found in this area</h4>
                  <p>
                    OpenStreetMap has no mapped medical facilities within {searchRadius / 1000} km of{' '}
                    <strong>{activeLocationName}</strong>.
                    Try a wider radius or search a nearby city.
                  </p>
                </>
              ) : (
                <>
                  <h4>No facilities match your filters</h4>
                  <p>Try widening your radius or toggling off &quot;Open Now Only&quot;.</p>
                </>
              )}
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => { setFilter('all'); setFacilitySearchTerm(''); setOpenNowOnly(false); }}
              >
                Reset All Filters
              </button>
            </div>

          ) : (
            /* Facility cards */
            filteredFacilities.map((loc, index) => {
              const isSelected = selectedFacility?.id === loc.id;
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
                  <div className={`card-accent-stripe ${loc.type}`}></div>

                  {isSelected && (
                    <div className="loc-selected-badge">
                      <Check size={12} /><span>Active on Map</span>
                    </div>
                  )}

                  {/* Header */}
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
                        {/* Source badge — show where data came from */}
                        <span className="source-badge" title={`Data source: ${loc.source === 'google' ? 'Google Places' : 'OpenStreetMap'}`}>
                          <ShieldCheck size={11} />
                          <span>{loc.source === 'google' ? 'Google Places' : 'OpenStreetMap'}</span>
                        </span>
                      </div>
                      <h3 title={loc.name}>{loc.name}</h3>
                    </div>

                    {/* Open status — show "Unknown" when we don't know */}
                    <div className={`status-pill ${loc.isOpen === true ? 'status-open' : loc.isOpen === false ? 'status-closed' : 'status-unknown'}`}>
                      {loc.isOpen === true && <span className="status-ping"></span>}
                      <span className="status-dot"></span>
                      <span className="status-label">
                        {loc.isOpen === true ? 'Open Now' : loc.isOpen === false ? 'Closed' : 'Hours Unknown'}
                      </span>
                    </div>
                  </div>

                  {/* Data pills */}
                  <div className="loc-data-pills">
                    {loc.distance && (
                      <span className="data-pill distance-pill" title="Distance from searched location">
                        <Compass size={12} className="pill-icon" />
                        <span>{loc.distance}</span>
                      </span>
                    )}
                    {/* Only show rating if the source actually provided one */}
                    {loc.rating != null && (
                      <span className="data-pill rating-pill" title="Rating from data source">
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

                  {/* Details box */}
                  <div className="loc-details-box">
                    {loc.address && (
                      <div className="detail-data-item">
                        <div className="detail-icon-wrap"><MapPin size={13} /></div>
                        <div className="detail-content">
                          <span className="detail-label">Address</span>
                          <span className="detail-text" title={loc.address}>{loc.address}</span>
                        </div>
                      </div>
                    )}
                    {loc.openingHours && (
                      <div className="detail-data-item">
                        <div className="detail-icon-wrap"><Clock size={13} /></div>
                        <div className="detail-content">
                          <span className="detail-label">Working Hours</span>
                          <span className="detail-text">{loc.openingHours}</span>
                        </div>
                      </div>
                    )}
                    {loc.phone && (
                      <div className="detail-data-item">
                        <div className="detail-icon-wrap"><Phone size={13} /></div>
                        <div className="detail-content">
                          <span className="detail-label">Contact</span>
                          <a
                            href={`tel:${loc.phone.replace(/[^\d+]/g, '')}`}
                            onClick={e => e.stopPropagation()}
                            className="detail-phone-link"
                          >
                            {loc.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="loc-actions">
                    <a
                      href={getDirectionsUrl(loc)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => handleOpenDirections(e, loc)}
                      className="btn btn-primary btn-sm loc-dir-btn"
                      title={`Get Google Maps directions to ${loc.name}`}
                    >
                      <Navigation size={14} className="dir-nav-icon" />
                      <span>Directions</span>
                      <ArrowUpRight size={13} className="dir-arrow-icon" />
                    </a>

                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setSelectedFacility(loc); }}
                      className={`btn btn-sm loc-map-btn ${isSelected ? 'btn-primary is-active' : 'btn-outline'}`}
                    >
                      <Map size={14} />
                      <span>{isSelected ? 'On Map' : 'View on Map'}</span>
                    </button>

                    {loc.phone && (
                      <a
                        href={`tel:${loc.phone.replace(/[^\d+]/g, '')}`}
                        onClick={e => e.stopPropagation()}
                        className="btn btn-outline btn-sm loc-call-btn"
                        title={`Call ${loc.name}`}
                      >
                        <Phone size={14} />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={e => handleCopyLocation(e, loc)}
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

        {/* Map panel */}
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
                <p>Click &quot;My Live GPS&quot; or search your city above to view live Google Maps.</p>
                <button className="btn btn-primary gps-action-btn" onClick={requestGpsLocation} disabled={isLoading || isLocatingGps}>
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
                        <RotateCcw size={13} /><span>All Nearby</span>
                      </button>
                    )}
                    <a
                      href={getGoogleMapsDirectUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="map-top-btn map-external-link"
                      title="Open in full Google Maps"
                    >
                      <span>{t('openInGoogleMaps') || 'Open in Google Maps'}</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
                <div className="map-iframe-container">
                  <iframe
                    key={`${selectedFacility ? selectedFacility.id : 'all'}-${userLocation.lat.toFixed(4)}-${userLocation.lng.toFixed(4)}-${filter}-${searchRadius}`}
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
