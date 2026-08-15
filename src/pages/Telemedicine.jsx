import React, { useState } from 'react';
import './Telemedicine.css';

const Telemedicine = () => {
  const [activeTab, setActiveTab] = useState('doctor'); // 'doctor' | 'lab'
  const [selectedDoctorCategory, setSelectedDoctorCategory] = useState('All');
  const [selectedLabCategory, setSelectedLabCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const doctorCategories = [
    { name: 'All', count: 12 },
    { name: 'General Physician', count: 4 },
    { name: 'Gynecologists', count: 2 },
    { name: 'Orthopedists', count: 2 },
    { name: 'Pediatricians', count: 1 },
    { name: 'Dentists', count: 3 },
  ];

  const labCategories = [
    { name: 'All', count: 15 },
    { name: 'Full Body Checkup', count: 3 },
    { name: 'Blood Test', count: 6 },
    { name: 'Diabetes Profile', count: 2 },
    { name: 'Thyroid Care', count: 2 },
    { name: 'COVID/Flu', count: 2 },
  ];

  return (
    <div className="telemedicine-container">
      <div className="telemedicine-content">
        
        {/* Header Section */}
        <div className="telemedicine-header">
          <h1>Medical Services & Consultations</h1>
          <p>Book online doctor consultations or schedule home sample pickup for lab tests.</p>
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

        {/* Search Bar */}
        <div className="telemedicine-search-box">
          <input
            type="text"
            placeholder={
              activeTab === 'doctor'
                ? "Search doctors, specialties..."
                : "Search lab tests, health packages..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="telemedicine-search-input"
          />
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

        {/* Content Section: Cards */}
        {activeTab === 'doctor' ? (
          /* DOCTOR CONSULTATION CARDS */
          <div className="cards-grid">
            <div className="service-card">
              <div className="card-top">
                <div>
                  <h3 className="card-title">Dr. Sarah Sharma</h3>
                  <span className="badge-category">GYNECOLOGIST</span>
                </div>
                <span className="badge-status online">● Online</span>
              </div>
              <p className="card-subtitle">12+ Years Experience • Max Hospital</p>
              <div className="card-actions">
                <button className="btn-primary">Book Appointment</button>
                <button className="btn-secondary">Start Call</button>
              </div>
            </div>

            <div className="service-card">
              <div className="card-top">
                <div>
                  <h3 className="card-title">Dr. Rajesh Verma</h3>
                  <span className="badge-category">DENTIST</span>
                </div>
                <span className="badge-status offline">Available 4 PM</span>
              </div>
              <p className="card-subtitle">8+ Years Experience • Dental Care Clinic</p>
              <div className="card-actions">
                <button className="btn-primary">Book Appointment</button>
                <button className="btn-secondary">Start Call</button>
              </div>
            </div>
          </div>
        ) : (
          /* LAB TEST BOOKING CARDS */
          <div className="cards-grid">
            <div className="service-card">
              <div className="card-top">
                <div>
                  <h3 className="card-title">Full Body Checkup (Advanced)</h3>
                  <span className="badge-category">LAB TEST</span>
                </div>
                <span className="badge-tag">POPULAR</span>
              </div>
              <p className="card-subtitle">Includes 63 Tests (CBC, Kidney, Liver, Lipid, Thyroid)</p>
              <div className="card-footer">
                <div className="price-tag">
                  <span className="old-price">₹1,999</span>
                  <span className="new-price">₹799</span>
                </div>
                <button className="btn-primary">Book Home Pickup</button>
              </div>
            </div>

            <div className="service-card">
              <div className="card-top">
                <div>
                  <h3 className="card-title">Diabetes Profile</h3>
                  <span className="badge-category">LAB TEST</span>
                </div>
              </div>
              <p className="card-subtitle">Includes HbA1c, Fasting Blood Sugar, Urine Sugar</p>
              <div className="card-footer">
                <div className="price-tag">
                  <span className="old-price">₹999</span>
                  <span className="new-price">₹449</span>
                </div>
                <button className="btn-primary">Book Home Pickup</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Telemedicine;
