import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, MapPin, Activity, Search, Moon, Sun, Home as HomeIcon, Bot, Camera, HeartPulse, AlertOctagon, Menu, X, LogOut } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { user, loginWithGoogle, logout } = useAuth();
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

            {/* Direct Login Button (only when logged out) */}
            {!user && (
              <button 
                className="nav-direct-login-btn"
                onClick={loginWithGoogle}
                title="Sign in with Google"
              >
                <svg className="google-icon" viewBox="0 0 24 24" width="13" height="13" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Login</span>
              </button>
            )}

            {/* Merged Menu / Profile Trigger Button */}
            <button 
              className={`hamburger-menu-btn ${user && !isHubOpen ? 'profile-active' : 'btn-icon'} ${isHubOpen ? 'active' : ''}`}
              onClick={() => setIsHubOpen(!isHubOpen)}
              title={isHubOpen ? "Close Menu" : (user ? "User Menu" : "Open Menu")}
            >
              {isHubOpen ? (
                <X size={22} />
              ) : user ? (
                <img 
                  src={user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                  alt="Profile" 
                  className="nav-menu-profile-avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Menu size={22} />
              )}
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

              {/* User Profile / Auth Section */}
              <div className="hub-profile-section">
                {user ? (
                  <div className="hub-profile-card logged-in glass-card">
                    <div className="profile-info-row">
                      <img 
                        src={user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                        alt={user.user_metadata?.full_name || 'User'} 
                        className="profile-avatar"
                        referrerPolicy="no-referrer"
                      />
                      <div className="profile-meta">
                        <span className="profile-welcome">{language === 'en' ? 'Welcome back,' : 'आपका स्वागत है,'}</span>
                        <h3 className="profile-name">{user.user_metadata?.full_name || user.email}</h3>
                        <div className="profile-badges">
                          <span className="badge-cloud">☁️ Cloud Connected</span>
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-outline signout-btn" onClick={logout}>
                      <LogOut size={16} />
                      <span>{language === 'en' ? 'Sign Out' : 'साइन आउट'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="hub-profile-card logged-out glass-card">
                    <div className="login-prompt">
                      <h4>{language === 'en' ? 'Sync Your Dashboard' : 'अपने डैशबोर्ड को सिंक करें'}</h4>
                      <p>
                        {language === 'en' 
                          ? 'Sign in with Google to securely back up and access your health logs across all your devices.' 
                          : 'अपने हेल्थ लॉग्स को सुरक्षित रूप से बैकअप करने और अपने सभी उपकरणों पर एक्सेस करने के लिए Google के साथ साइन इन करें।'}
                      </p>
                    </div>
                    <button className="google-signin-btn" onClick={loginWithGoogle}>
                      <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                      <span>{language === 'en' ? 'Continue with Google' : 'Google के साथ आगे बढ़ें'}</span>
                    </button>
                  </div>
                )}
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
