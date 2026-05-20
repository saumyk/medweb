import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, Scan, Clock, MapPin } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-content">
          <motion.div 
            className="hero-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="badge">AI-Powered Healthcare</div>
            <h1 className="hero-title">
              Understand Your <span className="gradient-text">Prescriptions</span> Instantly
            </h1>
            <p className="hero-subtitle">
              Scan doctor handwritten notes, translate to English & Hindi, and understand exactly what your medicines do. Your digital health companion.
            </p>
            <div className="hero-actions">
              <Link to="/scan" className="btn btn-primary btn-lg">
                <Scan size={20} />
                Scan Prescription
              </Link>
              <Link to="/nearby" className="btn btn-outline btn-lg">
                Find Pharmacies
                <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            className="hero-image-wrapper"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="hero-image-card glass shadow-lg">
              <div className="mockup-header">
                <div className="dot red"></div>
                <div className="dot yellow"></div>
                <div className="dot green"></div>
              </div>
              <div className="mockup-body">
                <div className="scan-animation">
                  <div className="scanner-line"></div>
                  <FileText className="doc-icon" size={80} color="var(--primary)" />
                </div>
                <div className="mockup-result">
                  <div className="result-item">
                    <span className="med-name">Paracetamol 500mg</span>
                    <span className="med-purpose badge-blue">Fever/Pain Relief</span>
                  </div>
                  <div className="result-item">
                    <span className="med-name">Amoxicillin 250mg</span>
                    <span className="med-purpose badge-green">Antibiotic</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Everything you need</h2>
          <div className="features-grid">
            <FeatureCard 
              icon={<Scan size={32} />}
              title="Smart OCR Scanning"
              desc="Our advanced AI decodes even the messiest doctor handwriting."
              delay={0.1}
            />
            <FeatureCard 
              icon={<FileText size={32} />}
              title="Bilingual Translation"
              desc="Get simple, easy-to-understand explanations in English and Hindi."
              delay={0.2}
            />
            <FeatureCard 
              icon={<Clock size={32} />}
              title="Medical History"
              desc="Safely store and access your past prescriptions anytime."
              delay={0.3}
            />
            <FeatureCard 
              icon={<MapPin size={32} />}
              title="Nearby Services"
              desc="Quickly find nearby hospitals and pharmacies."
              delay={0.4}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, delay }) => {
  return (
    <motion.div 
      className="feature-card glass"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </motion.div>
  );
};

export default Home;
