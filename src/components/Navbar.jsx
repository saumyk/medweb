import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, MapPin, Activity, Search, Moon, Sun, Home as HomeIcon, Bot, Camera, HeartPulse, AlertOctagon, Menu, X } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isHubOpen, setIsHubOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Lock body scroll when the fullscreen overlay menu is open
  useEffect(() => {
    if (isHubOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isHubOpen]);



  const hubFeatures = [
    { 
      name: t('home'), 
      path: '/', 
      icon: <HomeIcon size={24} />, 
      desc: language === 'en' ? 'Return to the landing page & overview' : 'मुख्य पृष्ठ और अवलोकन पर वापस जाएं',
      colorClass: 'blue' 
    },
    { 
      name: t('aiAssistant'), 
      path: '/assistant', 
      icon: <Bot size={24} />, 
      desc: language === 'en' ? 'Consult our AI medical assistant' : 'हमारे एआई चिकित्सा सहायक से परामर्श करें',
      colorClass: 'teal' 
    },
    { 
      name: t('ocr'), 
      path: '/ocr', 
      icon: <Camera size={24} />, 
      desc: language === 'en' ? 'Extract medicines from prescription photo' : 'पर्ची की फोटो से दवाएं निकालें',
      colorClass: 'purple' 
    },
    { 
      name: t('dashboard'), 
      path: '/dashboard', 
      icon: <HeartPulse size={24} />, 
      desc: language === 'en' ? 'Log and visualize vitals & symptoms' : 'विटल्स और लक्षणों को रिकॉर्ड करें',
      colorClass: 'rose' 
    },
    { 
      name: t('medicineInfo'), 
      path: '/medicine', 
      icon: <Search size={24} />, 
      desc: language === 'en' ? 'Lookup drug database and safety info' : 'दवा डेटाबेस और सुरक्षा जानकारी खोजें',
      colorClass: 'amber' 
    },
    { 
      name: t('symptoms'), 
      path: '/symptoms', 
      icon: <Activity size={24} />, 
      desc: language === 'en' ? 'Check symptoms care guidelines' : 'लक्षण देखभाल दिशानिर्देशों की जांच करें',
      colorClass: 'cyan' 
    },
    { 
      name: t('nearby'), 
      path: '/nearby', 
      icon: <MapPin size={24} />, 
      desc: language === 'en' ? 'Find hospital, doctor, or pharmacy' : 'अस्पताल, डॉक्टर या फार्मेसी खोजें',
      colorClass: 'emerald' 
    },
    { 
      name: t('emergencyBtn'), 
      path: '/nearby?emergency=true', 
      icon: <AlertOctagon size={24} />, 
      desc: language === 'en' ? 'Trigger emergency SOS protocols' : 'आपातकालीन एसओएस प्रोटोकॉल सक्रिय करें',
      colorClass: 'red' 
    },
  ];

  const handleLinkClick = (path) => {
    setIsHubOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Top sticky branding bar */}
      <nav className="navbar glass">
        <div className="container navbar-container">
          <Link to="/" className="navbar-logo" onClick={() => setIsHubOpen(false)}>
            <div className="logo-icon">
              <Stethoscope size={28} color="white" />
            </div>
            <span className="logo-text gradient-text">MedWeb</span>
          </Link>
          
          <div className="navbar-right">
            <button 
              className="sos-nav-btn"
              onClick={() => navigate('/nearby?emergency=true')}
              title={t('emergencyBtn')}
            >
              <AlertOctagon size={16} />
              <span>SOS</span>
            </button>

            {/* Top right Hamburger Menu Button (synchronized with bottom bar toggle) */}
            <button 
              className={`hamburger-menu-btn btn-icon ${isHubOpen ? 'active' : ''}`}
              onClick={() => setIsHubOpen(!isHubOpen)}
              title={isHubOpen ? "Close Menu" : "Open Menu"}
            >
              {isHubOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>



      {/* Fullscreen Hub Menu Overlay */}
      <AnimatePresence>
        {isHubOpen && (
          <motion.div 
            className="hub-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setIsHubOpen(false)}
          >
            <motion.div 
              className="hub-content glass"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="hub-header">
                <div className="hub-logo">
                  <div className="logo-icon">
                    <Stethoscope size={26} color="white" />
                  </div>
                  <span className="logo-text gradient-text">MedWeb Health Hub</span>
                </div>
                <button className="hub-close-btn" onClick={() => setIsHubOpen(false)}>
                  <X size={22} />
                </button>
              </div>

              {/* Grid of all features */}
              <div className="hub-body">
                <div className="hub-features-grid">
                  {hubFeatures.map((feat, index) => (
                    <motion.div
                      key={feat.name}
                      className={`hub-feature-card glass-card border-${feat.colorClass}`}
                      onClick={() => handleLinkClick(feat.path)}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      whileHover={{ y: -6, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`feature-card-icon-box gradient-${feat.colorClass}`}>
                        {feat.icon}
                      </div>
                      <div className="feature-card-details">
                        <h4>{feat.name}</h4>
                        <p>{feat.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="hub-footer">
                <div className="hub-divider"></div>
                <div className="hub-controls-row">
                  {/* Theme Selector Segmented Control */}
                  <div className="hub-control-group">
                    <span className="control-group-title">
                      {language === 'en' ? 'Theme Mode' : 'थीम का प्रकार'}
                    </span>
                    <div className="theme-segment-control">
                      <button 
                        className={`theme-segment-btn ${theme === 'light' ? 'active' : ''}`}
                        onClick={() => setTheme('light')}
                      >
                        <Sun size={15} />
                        <span>{language === 'en' ? 'Light' : 'लाइट'}</span>
                      </button>
                      <button 
                        className={`theme-segment-btn ${theme === 'dark' ? 'active' : ''}`}
                        onClick={() => setTheme('dark')}
                      >
                        <Moon size={15} />
                        <span>{language === 'en' ? 'Dark' : 'डार्क'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Language Selector Segmented Control */}
                  <div className="hub-control-group">
                    <span className="control-group-title">
                      {language === 'en' ? 'Language' : 'भाषा चयन'}
                    </span>
                    <div className="language-segment-control">
                      <button 
                        className={`lang-segment-btn ${language === 'en' ? 'active' : ''}`}
                        onClick={() => setLanguage('en')}
                      >
                        EN
                      </button>
                      <button 
                        className={`lang-segment-btn ${language === 'hi' ? 'active' : ''}`}
                        onClick={() => setLanguage('hi')}
                      >
                        हिन्दी
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
