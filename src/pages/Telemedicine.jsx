import React, { useState, useEffect } from 'react';
import './Telemedicine.css';

const Telemedicine = () => {
  const [activeTab, setActiveTab] = useState('doctor'); // 'doctor' | 'lab' | 'medicine'
  const [selectedCity, setSelectedCity] = useState('Delhi NCR');
  const [selectedDoctorCategory, setSelectedDoctorCategory] = useState('All');
  const [selectedLabCategory, setSelectedLabCategory] = useState('All');
  const [selectedMedicineCategory, setSelectedMedicineCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // States for dynamic data
  const [doctorsList, setDoctorsList] = useState([]);
  const [labTestsList, setLabTestsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fixed Syntax Error: Kanpur aur Noida ko quotes mein kiya
  const cities = ['Delhi NCR', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Noida'];

  const doctorCategories = [
    { name: 'All', count: 48 },
    { name: 'General Physician', count: 12 },
    { name: 'Dermatologists', count: 8 },
    { name: 'Gynecologists', count: 6 },
    { name: 'Dentists', count: 5 },
    { name: 'Pediatricians', count: 4 },
  ];

  const labCategories = [
    { name: 'All', count: 65 },
    { name: 'Full Body Checkup', count: 10 },
    { name: 'Blood Test', count: 18 },
    { name: 'Diabetes Profile', count: 8 },
  ];

  const medicineCategories = [
    { name: 'All', count: 120 },
    { name: 'Prescription Drugs', count: 45 },
    { name: 'OTC & Wellness', count: 35 },
    { name: 'Diabetes Care', count: 15 },
  ];

  const medicinesList = [
    {
      id: 101,
      name: 'Dolo 650mg Tablet',
      category: 'Prescription Drugs',
      desc: 'Strip of 15 tablets • Paracetamol',
      oldPrice: '₹34',
      newPrice: '₹28',
      discount: '18% OFF',
      rxRequired: true,
      deliveryTime: 'Express Delivery (2 Hours)'
    },
    {
      id: 102,
      name: 'Revital H Daily Health Supplement',
      category: 'OTC & Wellness',
      desc: 'Bottle of 30 capsules • Multivitamins',
      oldPrice: '₹310',
      newPrice: '₹248',
      discount: '20% OFF',
      rxRequired: false,
      deliveryTime: 'Delivered Tomorrow'
    }
  ];

  // Fallback Doctor Data
  const fallbackDoctors = [
    { id: 1, name: 'Dr. Sharma', specialty: 'General Physician', status: 'Available', statusType: 'online', exp: '10+ Yrs Exp', hospital: 'Apollo Hospital', city: selectedCity },
    { id: 2, name: 'Dr. Anjali Gupta', specialty: 'Dermatologist', status: 'Busy', statusType: 'offline', exp: '8 Yrs Exp', hospital: 'Max Healthcare', city: selectedCity }
  ];

  // Fallback Lab Data
  const fallbackLabs = [
    { id: 101, name: 'Full Body Health Checkup', category: 'Full Body Checkup', desc: 'Includes 60+ parameters with free home sample pickup', tag: 'Popular', oldPrice: '₹1,999', newPrice: '₹799' },
    { id: 102, name: 'Complete Blood Count (CBC)', category: 'Blood Test', desc: 'Standard blood profile check', tag: 'Verified', oldPrice: '₹499', newPrice: '₹299' }
  ];

  // Doctor Fetch API with Fallback
  useEffect(() => {
    setLoading(true);
    fetch("https://hapi.fhir.org/baseR4/Appointment?_count=6")
      .then((res) => {
        if (!res.ok) throw new Error("API Network Response Failed");
        return res.json();
      })
      .then((data) => {
        const formattedDocs = (data.entry || []).map((item, idx) => ({
          id: item.resource?.id || idx,
          name: item.resource?.description || `Dr. Consultant #${idx + 1}`,
          specialty: item.resource?.serviceType?.[0]?.text || 'General Physician',
          status: item.resource?.status || 'available',
          statusType: 'online',
          exp: 'Verified Doctor',
          hospital: 'City Medical Center',
          city: selectedCity,
        }));
        setDoctorsList(formattedDocs.length ? formattedDocs : fallbackDoctors);
      })
      .catch((err) => {
        console.error("Doctor API Error, using fallback data:", err);
        setDoctorsList(fallbackDoctors);
      })
      .finally(() => setLoading(false));
  }, [selectedCity]);

  // Lab Tests Fetch API with Fallback
  useEffect(() => {
    fetch("https://demo.openmrs.org/openmrs/ws/rest/v1/order?v=default")
      .then((res) => {
        if (!res.ok) throw new Error("API Network Response Failed");
        return res.json();
      })
      .then((data) => {
        const formattedLabs = (data.results || []).map((item, idx) => ({
          id: item.uuid || idx,
          name: item.display || "Diagnostic Test",
          category: item.orderType?.display || "General Test",
          desc: item.instructions || "Includes standard home sample collection",
          tag: "Verified",
          oldPrice: "₹999",
          newPrice: "₹499",
        }));
        setLabTestsList(formattedLabs.length ? formattedLabs : fallbackLabs);
      })
      .catch((err) => {
        console.error("Lab API Error, using fallback data:", err);
        setLabTestsList(fallbackLabs);
      });
  }, []);

  return (
    <div className="telemedicine-container">
      <div className="telemedicine-content">
        
        {/* Header Section */}
        <div className="telemedicine-header">
          <h1>Medical Services, Consultations & Delivery</h1>
          <p>Book doctor consultations, home sample pickup for lab tests, or order medicines to your doorstep.</p>
        </div>

        {/* Primary Service Selector */}
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
            Lab Test Booking
          </button>
          <button
            onClick={() => setActiveTab('medicine')}
            className={`main-tab-btn ${activeTab === 'medicine' ? 'active' : ''}`}
          >
            Medicine Delivery 🚚
          </button>
        </div>

        {/* Search Bar & City Selector */}
        <div className="telemedicine-search-box">
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
                  ? "Search doctors, specialties..."
                  : activeTab === 'lab'
                  ? "Search lab tests, packages..."
                  : "Search medicines, healthcare products..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="telemedicine-search-input"
            />
          </div>
          <button className="telemedicine-search-btn">Search</button>
        </div>

        {/* Category Filter Pills */}
        <div className="filter-pills-scroll">
          {activeTab === 'doctor' &&
            doctorCategories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedDoctorCategory(cat.name)}
                className={`sub-pill-btn ${selectedDoctorCategory === cat.name ? 'active' : ''}`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}

          {activeTab === 'lab' &&
            labCategories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedLabCategory(cat.name)}
                className={`sub-pill-btn ${selectedLabCategory === cat.name ? 'active' : ''}`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}

          {activeTab === 'medicine' &&
            medicineCategories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedMedicineCategory(cat.name)}
                className={`sub-pill-btn ${selectedMedicineCategory === cat.name ? 'active' : ''}`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
        </div>

        {/* Prescription Upload Banner */}
        {activeTab === 'medicine' && (
          <div style={{
            background: '#f0fdf4',
            border: '1px dashed #16a34a',
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <strong style={{ color: '#15803d', fontSize: '16px' }}>Have a Doctor's Prescription?</strong>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#166534' }}>
                Upload your prescription and our pharmacist will place the order for you.
              </p>
            </div>
            <button style={{
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Upload Prescription 📄
            </button>
          </div>
        )}

        {/* Dynamic Cards Grid Section */}
        {activeTab === 'doctor' && (
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
        )}

        {activeTab === 'lab' && (
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

        {activeTab === 'medicine' && (
          <div className="cards-grid">
            {medicinesList.map((med) => (
              <div className="service-card" key={med.id}>
                <div className="card-top">
                  <div>
                    <h3 className="card-title">{med.name}</h3>
                    <span className="badge-category">{med.category}</span>
                  </div>
                  {med.rxRequired && (
                    <span className="badge-tag" style={{ background: '#fee2e2', color: '#dc2626' }}>
                      Rx Required
                    </span>
                  )}
                </div>
                <p className="card-subtitle">{med.desc}</p>
                <div className="card-location">⚡ {med.deliveryTime} in {selectedCity}</div>
                <div className="card-footer">
                  <div className="price-tag">
                    <span className="old-price">{med.oldPrice}</span>
                    <span className="new-price">{med.newPrice}</span>
                    <small style={{ color: '#16a34a', marginLeft: '6px', fontWeight: 'bold' }}>{med.discount}</small>
                  </div>
                  <button className="btn-primary">Add to Cart 🛒</button>
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
