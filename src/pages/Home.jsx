import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, ShieldAlert, Wifi, Battery, Signal } from 'lucide-react';
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
                    <span className="chat-bot-name">ArogyaAI</span>
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
                  <span className="input-placeholder">Message ArogyaAI...</span>
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

      
      

    </div>
  );
};

export default Home;
