import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Telemedicine.css';

const cities = ['Delhi NCR', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Noida'];

const doctorCategories = [
  { name: 'All', count: 6 },
  { name: 'General Physician', count: 2 },
  { name: 'Dermatology', count: 1 },
  { name: 'Gynecology', count: 1 },
  { name: 'Dentistry', count: 1 },
  { name: 'Pediatrics', count: 1 },
];

const labCategories = [
  { name: 'All', count: 5 },
  { name: 'Full Body Checkup', count: 1 },
  { name: 'Blood Test', count: 2 },
  { name: 'Diabetes Profile', count: 1 },
];

const doctors = [
  { id: 'doctor-1', name: 'Dr. A. Sharma', specialty: 'General Physician', exp: '10+ years experience', hospital: 'Sample Medical Center' },
  { id: 'doctor-2', name: 'Dr. N. Gupta', specialty: 'Dermatology', exp: '8 years experience', hospital: 'Sample Medical Center' },
  { id: 'doctor-3', name: 'Dr. R. Iyer', specialty: 'Gynecology', exp: '12 years experience', hospital: 'Sample Medical Center' },
  { id: 'doctor-4', name: 'Dr. P. Singh', specialty: 'Dentistry', exp: '7 years experience', hospital: 'Sample Medical Center' },
  { id: 'doctor-5', name: 'Dr. K. Mehta', specialty: 'Pediatrics', exp: '9 years experience', hospital: 'Sample Medical Center' },
  { id: 'doctor-6', name: 'Dr. S. Khan', specialty: 'General Physician', exp: '6 years experience', hospital: 'Sample Medical Center' },
];

const labTests = [
  { id: 'lab-1', name: 'Full Body Health Checkup', category: 'Full Body Checkup', desc: 'Sample package with 60+ test parameters and home collection.', tag: 'Sample', oldPrice: 'Rs. 1,999', newPrice: 'Rs. 799' },
  { id: 'lab-2', name: 'Complete Blood Count (CBC)', category: 'Blood Test', desc: 'Sample standard blood-profile test.', tag: 'Sample', oldPrice: 'Rs. 499', newPrice: 'Rs. 299' },
  { id: 'lab-3', name: 'Fasting Blood Sugar', category: 'Blood Test', desc: 'Sample blood-sugar screening test.', tag: 'Sample', oldPrice: 'Rs. 249', newPrice: 'Rs. 149' },
  { id: 'lab-4', name: 'HbA1c', category: 'Diabetes Profile', desc: 'Sample three-month blood-sugar average test.', tag: 'Sample', oldPrice: 'Rs. 699', newPrice: 'Rs. 449' },
  { id: 'lab-5', name: 'Vitamin D', category: 'Wellness Test', desc: 'Sample vitamin D screening test.', tag: 'Sample', oldPrice: 'Rs. 1,199', newPrice: 'Rs. 799' },
];

const normalize = (value) => String(value || '').toLowerCase().replace(/s$/, '');

const matchesFilter = (item, query, category, categoryKey) => {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedCategory = normalize(category);
  const itemCategory = normalize(item[categoryKey]);
  const matchesQuery = !normalizedQuery || Object.values(item).some((value) => String(value).toLowerCase().includes(normalizedQuery));
  const matchesCategory = category === 'All' || itemCategory.includes(normalizedCategory) || normalizedCategory.includes(itemCategory);
  return matchesQuery && matchesCategory;
};

const Telemedicine = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('doctor');
  const [selectedCity, setSelectedCity] = useState('Delhi NCR');
  const [selectedDoctorCategory, setSelectedDoctorCategory] = useState('All');
  const [selectedLabCategory, setSelectedLabCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const filteredDoctors = useMemo(
    () => doctors.filter((doctor) => matchesFilter(doctor, searchQuery, selectedDoctorCategory, 'specialty')),
    [searchQuery, selectedDoctorCategory],
  );
  const filteredLabs = useMemo(
    () => labTests.filter((lab) => matchesFilter(lab, searchQuery, selectedLabCategory, 'category')),
    [searchQuery, selectedLabCategory],
  );
  const visibleResultCount = activeTab === 'doctor'
    ? filteredDoctors.length
    : filteredLabs.length;

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setActionMessage('');
  };

  const handleDemoAction = (action) => {
    setActionMessage(`${action} is not connected in demo mode. Please contact a verified provider to complete a real booking or purchase.`);
  };

  const handleSearch = () => {
    if (activeTab === 'medicine') {
      if (!searchQuery.trim()) {
        setActionMessage('Enter a medicine name to look up its current label information.');
        return;
      }
      navigate(`/medicine?search=${encodeURIComponent(searchQuery.trim())}`);
      return;
    }
    setActionMessage(`Showing ${visibleResultCount} matching ${visibleResultCount === 1 ? 'result' : 'results'}.`);
  };

  return (
    <div className="telemedicine-container">
      <div className="telemedicine-content">
        <div className="telemedicine-header">
          <h1>Medical Services, Consultations and Delivery</h1>
          <p>Browse sample care listings or search a medicine by name.</p>
        </div>

        <aside className="telemedicine-demo-notice" role="status">
          <strong>Care listings are demo data only.</strong> Medicine searches use the current label-information lookup. Do not use any result as a substitute for professional medical advice.
        </aside>

        <div className="main-tab-group" role="tablist" aria-label="Telemedicine services">
          <button type="button" onClick={() => switchTab('doctor')} className={`main-tab-btn ${activeTab === 'doctor' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'doctor'}>Doctor Consultation</button>
          <button type="button" onClick={() => switchTab('lab')} className={`main-tab-btn ${activeTab === 'lab' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'lab'}>Lab Test Booking</button>
          <button type="button" onClick={() => switchTab('medicine')} className={`main-tab-btn ${activeTab === 'medicine' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'medicine'}>Medicine Information</button>
        </div>

        <div className="telemedicine-search-box">
          <label className="city-selector" htmlFor="city-select">
            <span className="city-icon" aria-hidden="true">Location</span>
            <select id="city-select" value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)} className="city-dropdown">
              {cities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </label>
          <div className="search-input-wrapper">
            <input
              type="search"
              placeholder={activeTab === 'doctor' ? 'Search sample doctors or specialties...' : activeTab === 'lab' ? 'Search sample lab tests or packages...' : 'Enter a medicine name, for example paracetamol'}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="telemedicine-search-input"
              aria-label={activeTab === 'medicine' ? 'Search medicine information' : 'Search sample listings'}
            />
          </div>
          <button type="button" className="telemedicine-search-btn" onClick={handleSearch}>Search</button>
        </div>

        {actionMessage && <p className="telemedicine-action-message" role="status">{actionMessage}</p>}

        {activeTab !== 'medicine' && <div className="filter-pills-scroll" aria-label="Category filters">
          {activeTab === 'doctor' && doctorCategories.map((category) => <button type="button" key={category.name} onClick={() => setSelectedDoctorCategory(category.name)} className={`sub-pill-btn ${selectedDoctorCategory === category.name ? 'active' : ''}`}>{category.name} ({category.count})</button>)}
          {activeTab === 'lab' && labCategories.map((category) => <button type="button" key={category.name} onClick={() => setSelectedLabCategory(category.name)} className={`sub-pill-btn ${selectedLabCategory === category.name ? 'active' : ''}`}>{category.name} ({category.count})</button>)}
        </div>}

        {activeTab === 'medicine' && (
          <div className="medicine-lookup-panel">
            <div>
              <h2>Search medicine information</h2>
              <p>Search by the generic medicine name to view current label information, uses, warnings, and available manufacturer details.</p>
              <p className="medicine-lookup-note">Exact retailer price and local stock are not shown because they require a licensed pharmacy partner for your selected location.</p>
            </div>
            <div className="medicine-lookup-actions">
              <button type="button" className="rx-upload-btn" onClick={() => navigate('/ocr')}>Read a Prescription</button>
              <button type="button" className="btn-primary" onClick={handleSearch}>Search Medicine</button>
            </div>
          </div>
        )}

        {activeTab === 'doctor' && (
          <div className="cards-grid">
            {filteredDoctors.map((doctor) => (
              <article className="service-card" key={doctor.id}>
                <div className="card-top">
                  <div><h3 className="card-title">{doctor.name}</h3><span className="badge-category">{doctor.specialty}</span></div>
                  <span className="badge-status neutral">Availability to be confirmed</span>
                </div>
                <p className="card-subtitle">{doctor.exp} - {doctor.hospital}</p>
                <div className="card-location">Location: {selectedCity}</div>
                <div className="card-actions">
                  <button type="button" className="btn-primary" onClick={() => handleDemoAction('Appointment booking')}>Book Appointment</button>
                  <button type="button" className="btn-secondary" onClick={() => handleDemoAction('Video calling')}>Start Call</button>
                </div>
              </article>
            ))}
            {filteredDoctors.length === 0 && <p className="telemedicine-empty-state">No sample doctors match your search or category. Try a different filter.</p>}
          </div>
        )}

        {activeTab === 'lab' && (
          <div className="cards-grid">
            {filteredLabs.map((lab) => (
              <article className="service-card" key={lab.id}>
                <div className="card-top">
                  <div><h3 className="card-title">{lab.name}</h3><span className="badge-category">{lab.category}</span></div>
                  <span className="badge-tag">{lab.tag}</span>
                </div>
                <p className="card-subtitle">{lab.desc}</p>
                <div className="card-location">Home collection sample for {selectedCity}</div>
                <div className="card-footer">
                  <div className="price-tag"><span className="old-price">{lab.oldPrice}</span><span className="new-price">{lab.newPrice}</span></div>
                  <button type="button" className="btn-primary" onClick={() => handleDemoAction('Home sample-pickup booking')}>Book Home Pickup</button>
                </div>
              </article>
            ))}
            {filteredLabs.length === 0 && <p className="telemedicine-empty-state">No sample lab tests match your search or category. Try a different filter.</p>}
          </div>
        )}

      </div>
    </div>
  );
};

export default Telemedicine;
