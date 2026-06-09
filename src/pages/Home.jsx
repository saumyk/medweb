import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Activity, ShieldAlert, Search, Wifi, Battery, Signal } from 'lucide-react';
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
              Your Smart <span className="gradient-text">Medical AI</span> Companion
            </h1>
            <p className="hero-subtitle">
              Consult our AI Assistant, get step-by-step self-care steps, check medicine details, and know exactly when to seek immediate medical help.
            </p>
            <div className="hero-actions">
              <Link to="/assistant" className="btn btn-primary btn-lg">
                <Bot size={20} />
                Consult AI Assistant
              </Link>
              <Link to="/symptoms" className="btn btn-outline btn-lg">
                Check Symptoms
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
          <h2 className="section-title">Everything you need</h2>
          <div className="features-grid">
            <FeatureCard 
              icon={<Bot size={32} />}
              title="Medical AI Assistant"
              desc="Ask health questions and get instant, structured medical guidelines and advice."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Activity size={32} />}
              title="Self-Care Guides"
              desc="Access easy-to-follow instructions and steps for managing minor ailments at home."
              delay={0.2}
            />
            <FeatureCard 
              icon={<ShieldAlert size={32} />}
              title="Severity Advisor"
              desc="Understand symptoms and know warning signs that indicate you need emergency help."
              delay={0.3}
            />
            <FeatureCard 
              icon={<Search size={32} />}
              title="Medicine & Nearby"
              desc="Check safe dosages, safety advice, pricing, and locate doctors or pharmacies."
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
