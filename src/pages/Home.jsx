import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, ShieldAlert, Search, Wifi, Battery, Signal, Camera, HeartPulse, Globe } from 'lucide-react';
import { useLanguage } from '../components/LanguageContext';
import './Home.css';

const Home = () => {
  const { t } = useLanguage();

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
            <div className="badge">{t('heroBadge')}</div>
            <h1 className="hero-title">
              {t('heroTitlePre')}<span className="gradient-text">Medical AI</span>{t('heroTitlePost')}
            </h1>
            <p className="hero-subtitle">
              {t('heroSubtitle')}
            </p>
            <div className="hero-actions">
              <Link to="/assistant" className="btn btn-primary btn-lg">
                <Bot size={20} />
                {t('consultBtn')}
              </Link>
              <Link to="/symptoms" className="btn btn-outline btn-lg">
                {t('checkSymptomsBtn')}
                <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>

          <motion.div 
            className="hero-image-wrapper"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Smartphone device mockup */}
            <div className="phone-mockup glass shadow-lg">
              {/* Phone Hardware Decorations */}
              <div className="phone-notch"></div>
              
              <div className="phone-status-bar">
                <span className="phone-time">09:41</span>
                <div className="phone-status-icons">
                  <Signal size={12} className="phone-status-icon" />
                  <Wifi size={12} className="phone-status-icon" />
                  <Battery size={14} className="phone-status-icon phone-battery-icon" />
                </div>
              </div>
              
              {/* Phone Screen: Chat Interface */}
              <div className="phone-screen-content">
                <div className="mockup-header-chat">
                  <div className="chat-avatar">
                    <Bot size={20} color="white" />
                  </div>
                  <div className="chat-status-info">
                    <span className="chat-bot-name">MedWeb AI</span>
                    <span className="chat-status-text"><span className="status-dot-active"></span>Online</span>
                  </div>
                </div>
                
                <div className="mockup-body-chat">
                  <div className="chat-bubble user-bubble">
                    <p>I have a mild fever and throat irritation. What should I do?</p>
                  </div>
                  <div className="chat-bubble bot-bubble">
                    <p>Here are some <strong>Self-Care Steps</strong>:</p>
                    <ul>
                      <li>Stay hydrated with warm water.</li>
                      <li>Gargle with warm saline water twice daily.</li>
                    </ul>
                    <div className="warning-box-chat">
                      <ShieldAlert size={14} className="text-warning-chat" />
                      <span><strong>Red Flag:</strong> Seek immediate medical help if you experience breathing difficulties or chest pressure.</span>
                    </div>
                  </div>
                </div>

                <div className="mockup-input-chat">
                  <span className="input-placeholder">Message MedWeb AI...</span>
                  <div className="input-actions">
                    <span className="input-action-icon">🎙️</span>
                    <span className="input-send-btn">➔</span>
                  </div>
                </div>
              </div>
              
              <div className="phone-home-indicator"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">{t('featuresTitle')}</h2>
          <div className="features-grid">
            <FeatureCard 
              icon={<Bot size={32} />}
              title={t('aiAssistantTitle')}
              desc={t('aiAssistantSubtitle')}
              delay={0.1}
              path="/assistant"
            />
            <FeatureCard 
              icon={<Camera size={32} />}
              title={t('cardOcrTitle')}
              desc={t('cardOcrDesc')}
              delay={0.2}
              path="/ocr"
            />
            <FeatureCard 
              icon={<HeartPulse size={32} />}
              title={t('cardDashboardTitle')}
              desc={t('cardDashboardDesc')}
              delay={0.3}
              path="/dashboard"
            />
            <FeatureCard 
              icon={<ShieldAlert size={32} />}
              title={t('cardSosTitle')}
              desc={t('cardSosDesc')}
              delay={0.4}
              path="/nearby?emergency=true"
            />
            <FeatureCard 
              icon={<Search size={32} />}
              title={t('medTitle')}
              desc={t('medSubtitle')}
              delay={0.5}
              path="/medicine"
            />
            <FeatureCard 
              icon={<Globe size={32} />}
              title={t('cardLangTitle')}
              desc={t('cardLangDesc')}
              delay={0.6}
              path=""
              isAction={true}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, delay, path, isAction }) => {
  const { language, setLanguage } = useLanguage();
  
  const handleCardClick = (e) => {
    if (isAction) {
      e.preventDefault();
      setLanguage(language === 'en' ? 'hi' : 'en');
    }
  };

  const cardContent = (
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

  return path ? (
    <Link to={path} className="feature-card-link">
      {cardContent}
    </Link>
  ) : (
    <div onClick={handleCardClick} className="feature-card-link" style={{ cursor: 'pointer' }}>
      {cardContent}
    </div>
  );
};

export default Home;
