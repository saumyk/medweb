import React, { useState } from 'react';
import './Telemedicine.css';

const Telemedicine = () => {
  const [activeTab, setActiveTab] = useState('doctor'); // 'doctor' | 'lab'
  const [selectedCity, setSelectedCity] = useState('Delhi NCR');
  const [selectedDoctorCategory, setSelectedDoctorCategory] = useState('All');
  const [selectedLabCategory, setSelectedLabCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const cities = ['Delhi NCR', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow'];

  // All Possible Specialties
  const doctorCategories = [
    { name: 'All', count: 48 },
    { name: 'General Physician', count: 12 },
    { name: 'Dermatologists', count: 8 },
    { name: 'Gynecologists', count: 6 },
    { name: 'Dentists', count: 5 },
    { name: 'Pediatricians', count: 4 },
    { name: 'Orthopedists', count: 3 },
    { name: 'Cardiologists', count: 3 },
    { name: 'Neurologists', count: 2 },
    { name: 'ENT Specialists', count: 3 },
    { name: 'Psychiatrists', count: 2 },
  ];

  // All Possible Lab Categories
  const labCategories = [
    { name: 'All', count: 65 },
    { name: 'Full Body Checkup', count: 10 },
    { name: 'Blood Test', count: 18 },
    { name: 'Diabetes Profile', count: 8 },
    { name: 'Thyroid Care', count: 6 },
    { name: 'Vitamin Profile', count: 5 },
    { name: 'Kidney Function (KFT)', count: 4 },
    { name: 'Liver Function (LFT)', count: 5 },
    { name: 'Urine Test', count: 4 },
    { name: 'COVID & Viral', count: 5 },
  ];

  // 6 Doctors Data
  const [doctorsList, setDoctorsList] = useState([]);

useEffect(() => {
  fetch("https://hapi.fhir.org/baseR4/Appointment")
    .then(res => res.json())
    .then(data => setDoctorsList(data.entry || []));
}, []);


  // 6 Lab Tests Data
 const [labTestsList, setLabTestsList] = useState([]);

useEffect(() => {
  fetch("https://demo.openmrs.org/openmrs/ws/rest/v1/order")   // OpenMRS demo API
    .then(res => res.json())
    .then(data => {
      setLabTestsList(data.results || []);   // lab tests को state में डालो
    });
}, []);


  return (
    <div className="telemedicine-container">
      <div className="telemedicine-content">
        
        {/* Header Section */}
        <div className="telemedicine-header">
          <h1>Medical Services & Consultations</h1>
          <p>Book online doctor consultations or schedule home sample pickup for lab tests in your city.</p>
        </div>

        {/* Primary Service Selector (Main Pills) */}
        <div className="main-tab-group">
          <button
            onClick={() => setActiveTab('doctor')}
            className={`main-tab-btn ${activeTab === 'doctor' ? 'active' : ''}`}
          >
            Doctor Consultation
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`main-tab-btn ${activeTab === 'lab' ? 'active' : ''}`}
          >
            Lab Test Booking (Home Collection)
          </button>
        </div>

        {/* Search Bar & City Selector */}
        <div className="telemedicine-search-box">
          {/* City Selection Dropdown */}
          <div className="city-selector">
            <span className="city-icon">📍</span>
            <select 
              value={selectedCity} 
              onChange={(e) => setSelectedCity(e.target.value)}
              className="city-dropdown"
            >
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder={
                activeTab === 'doctor'
                  ? "Search doctors, specialties (e.g. Dentist, Cardiologist)..."
                  : "Search lab tests, packages (e.g. Blood Test, Full Body)..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="telemedicine-search-input"
            />
          </div>
          <button className="telemedicine-search-btn">Search</button>
        </div>

        {/* Secondary Category Filter Pills */}
        <div className="filter-pills-scroll">
          {activeTab === 'doctor'
            ? doctorCategories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedDoctorCategory(cat.name)}
                  className={`sub-pill-btn ${selectedDoctorCategory === cat.name ? 'active' : ''}`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))
            : labCategories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedLabCategory(cat.name)}
                  className={`sub-pill-btn ${selectedLabCategory === cat.name ? 'active' : ''}`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
        </div>

        {/* Cards Grid Section */}
        {activeTab === 'doctor' ? (
          /* 6 DOCTOR CONSULTATION CARDS */
          <div className="cards-grid">
            {doctorsList.map((doc) => (
              <div className="service-card" key={doc.id}>
                <div className="card-top">
                  <div>
                    <h3 className="card-title">{doc.name}</h3>
                    <span className="badge-category">{doc.specialty}</span>
                  </div>
                  <span className={`badge-status ${doc.statusType}`}>{doc.status}</span>
                </div>
                <p className="card-subtitle">{doc.exp} • {doc.hospital}</p>
                <div className="card-location">📍 {doc.city}</div>
                <div className="card-actions">
                  <button className="btn-primary">Book Appointment</button>
                  <button className="btn-secondary">Start Call</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 6 LAB TEST BOOKING CARDS */
          <div className="cards-grid">
            {labTestsList.map((lab) => (
              <div className="service-card" key={lab.id}>
                <div className="card-top">
                  <div>
                    <h3 className="card-title">{lab.name}</h3>
                    <span className="badge-category">{lab.category}</span>
                  </div>
                  {lab.tag && <span className="badge-tag">{lab.tag}</span>}
                </div>
                <p className="card-subtitle">{lab.desc}</p>
                <div className="card-location">📍 Home Collection available in {selectedCity}</div>
                <div className="card-footer">
                  <div className="price-tag">
                    <span className="old-price">{lab.oldPrice}</span>
                    <span className="new-price">{lab.newPrice}</span>
                  </div>
                  <button className="btn-primary">Book Home Pickup</button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Telemedicine;
