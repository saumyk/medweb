import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Camera,
  HeartPulse,
  Search,
  ShieldAlert,
  Stethoscope,
  MapPin,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Wifi,
  Battery,
  Mic
} from 'lucide-react';
import { useLanguage } from '../components/LanguageContext';
import './Home.css';

const Home = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [phoneQuery, setPhoneQuery] = useState('');

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    const query = phoneQuery.trim();
    if (query) {
      navigate(`/assistant?q=${encodeURIComponent(query)}`);
    } else {
      navigate('/assistant');
    }
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-content">
          <motion.div 
            className="hero-text"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="hero-badge">
              <ShieldCheck size={15} />
              <span>{t('heroBadge') || 'Clinical Decision Support'}</span>
            </div>

            <h1 className="hero-title">
              {t('heroTitlePre') || 'Intelligent, Trusted '}<span className="hero-highlight">Healthcare Platform</span>{t('heroTitlePost') || ' for India'}
            </h1>

            <p className="hero-subtitle">
              {t('heroSubtitle') || 'Instant clinical guidance, verified medicine monographs with NPPA ceiling prices, AI symptom triage, and emergency hospital discovery.'}
            </p>

            <div className="hero-actions">
              <Link to="/assistant" className="btn btn-primary btn-lg">
                <Bot size={18} />
                {t('consultBtn') || 'Consult Arogya AI'}
              </Link>
              <Link to="/symptoms" className="btn btn-outline btn-lg">
                {t('checkSymptomsBtn') || 'Check Symptoms'}
                <ArrowRight size={18} />
              </Link>
            </div>

            {/* Standards & Regulatory Compliance Strip */}
            <div className="hero-trust-strip">
              <div className="trust-item">
                <CheckCircle2 size={15} className="trust-icon" />
                <span>CDSCO Schedules & NPPA Sahi Daam</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={15} className="trust-icon" />
                <span>RxNorm & US FDA Monographs</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={15} className="trust-icon" />
                <span>112 / 108 Emergency Protocol</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="hero-phone-wrapper"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="phone-mockup-frame">
              {/* Dynamic Island / Camera Notch */}
              <div className="phone-notch-island"></div>

              {/* Status Bar */}
              <div className="phone-status-bar">
                <span className="phone-time">09:41</span>
                <div className="phone-status-icons">
                  <span className="phone-signal-bars" aria-label="Signal">
                    <span></span><span></span><span></span><span></span>
                  </span>
                  <Wifi size={13} className="phone-wifi-icon" />
                  <Battery size={15} className="phone-battery-icon" />
                </div>
              </div>

              {/* Phone App Header */}
              <div className="phone-app-header">
                <div className="phone-bot-avatar">
                  <Bot size={18} color="#ffffff" />
                </div>
                <div className="phone-bot-info">
                  <h4 className="phone-bot-name">ArogyaAI</h4>
                  <span className="phone-online-status">
                    <span className="phone-online-dot"></span>
                    Online
                  </span>
                </div>
              </div>

              {/* Phone Chat Body */}
              <div className="phone-chat-body">
                {/* User Message */}
                <div className="phone-msg-user">
                  <p>I have a mild fever and throat irritation. What should I do?</p>
                </div>

                {/* Bot Response Card */}
                <div className="phone-msg-bot-card">
                  <p className="phone-card-intro">
                    Here are some <strong>Self-Care Steps</strong>:
                  </p>
                  <ul className="phone-card-bullets">
                    <li>Stay hydrated with warm water.</li>
                    <li>Gargle with warm saline water twice daily.</li>
                  </ul>

                  {/* Red Flag Warning Box */}
                  <div className="phone-red-flag-box">
                    <ShieldAlert size={16} className="red-flag-icon" />
                    <p className="red-flag-text">
                      <strong>Red Flag:</strong> Seek immediate medical help if you experience breathing difficulties or chest pressure.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Message Input Bar */}
              <form onSubmit={handlePhoneSubmit} className="phone-input-bar">
                <input
                  type="text"
                  value={phoneQuery}
                  onChange={(e) => setPhoneQuery(e.target.value)}
                  placeholder="Message ArogyaAI..."
                  className="phone-input-field"
                  aria-label="Message ArogyaAI"
                />
                <button 
                  type="button" 
                  className="phone-mic-btn"
                  onClick={() => navigate('/assistant')}
                  title="Voice Assistant"
                  aria-label="Voice Assistant"
                >
                  <Mic size={15} />
                </button>
                <button 
                  type="submit" 
                  className="phone-send-btn"
                  title="Send message to ArogyaAI"
                  aria-label="Send message to ArogyaAI"
                >
                  <ArrowRight size={13} />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-heading">
            <span className="section-eyebrow">Comprehensive Healthcare Tools</span>
            <h2>{t('featuresTitle') || 'Everything you need to manage your health safely'}</h2>
            <p className="features-sub">Designed for clinical reliability, data security, and immediate ease of use.</p>
          </div>

          <div className="features-grid">
            <FeatureCard 
              icon={<Bot size={24} />}
              title={t('aiAssistantTitle') || 'AI Health Assistant'}
              desc={t('aiAssistantSubtitle') || 'Evidence-based clinical guidance, lifestyle care steps, and dietary advice.'}
              path="/assistant"
            />

            <FeatureCard 
              icon={<Activity size={24} />}
              title={t('symptoms') || 'Symptom Checker'}
              desc="Intelligent triage that analyzes symptom combinations and flags red-flag warnings."
              path="/symptoms"
            />

            <FeatureCard
              icon={<Camera size={24} />}
              title={t('cardOcrTitle') || 'Prescription Scanner'}
              desc={t('cardOcrDesc') || 'Neural OCR extracts prescribed medications, detects duplicate salts, and builds dosage schedules.'}
              path="/ocr"
            />

            <FeatureCard
              icon={<MapPin size={24} />}
              title={t('nearby') || 'Nearby Healthcare Facilities'}
              desc="Locate verified hospitals, diagnostic labs, and pharmacies with live driving directions."
              path="/nearby"
            />

            <FeatureCard
              icon={<HeartPulse size={24} />}
              title={t('cardDashboardTitle') || 'Health Vitals Dashboard'}
              desc={t('cardDashboardDesc') || 'Track blood pressure, heart rate, and blood sugar with private, encrypted storage.'}
              path="/dashboard"
            />

            <FeatureCard
              icon={<Search size={24} />}
              title={t('medTitle') || 'Medicine Knowledge Base & Global Search'}
              desc={language === 'hi' ? 'भारतीय और वैश्विक दवाओं के आधिकारिक मोनोग्राफ, सुरक्षा रेटिंग, सीडीएससीओ और एफडीए डेटा देखें।' : 'Search authentic Indian & global medicine monographs, CDSCO schedules, and FDA/RxNorm package data.'}
              path="/medicine"
            />

            <FeatureCard
              icon={<Stethoscope size={24} />}
              title="Telemedicine Services"
              desc="Browse verified doctor specialties and diagnostic health packages across Indian cities."
              path="/telemedicine"
            />

            <FeatureCard
              icon={<ShieldAlert size={24} />}
              title={t('cardSosTitle') || 'Emergency SOS Protocol'}
              desc={t('cardSosDesc') || 'One-tap integration with India national emergency services (112 / 108) and nearest emergency rooms.'}
              path="/nearby?emergency=true"
              isEmergency
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, path, isEmergency }) => {
  return (
    <Link to={path} className={`feature-card glass ${isEmergency ? 'feature-card--emergency' : ''}`}>
      <div className={`feature-icon-wrapper ${isEmergency ? 'icon-emergency' : ''}`}>
        {icon}
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{desc}</p>
      <span className="feature-link-label">
        Access tool <ArrowRight size={14} className="feature-arrow" />
      </span>
    </Link>
  );
};

export default Home;
