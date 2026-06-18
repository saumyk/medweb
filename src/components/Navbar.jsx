import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Stethoscope, MapPin, Activity, Search, Moon, Sun, Home as HomeIcon, Bot, Camera, HeartPulse, Globe, AlertOctagon } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const navLinks = [
    { name: t('aiAssistant'), path: '/assistant', icon: <Bot size={20} /> },
    { name: t('medicineInfo'), path: '/medicine', icon: <Search size={20} /> },
    { name: t('symptoms'), path: '/symptoms', icon: <Activity size={20} /> },
    { name: t('nearby'), path: '/nearby', icon: <MapPin size={20} /> },
    { name: t('ocr'), path: '/ocr', icon: <Camera size={20} /> },
    { name: t('dashboard'), path: '/dashboard', icon: <HeartPulse size={20} /> },
  ];

  const mobileLinks = [
    { name: t('home'), path: '/', icon: <HomeIcon size={20} /> },
    { name: t('aiAssistant'), path: '/assistant', icon: <Bot size={20} /> },
    { name: t('ocr'), path: '/ocr', icon: <Camera size={20} /> },
    { name: t('dashboard'), path: '/dashboard', icon: <HeartPulse size={20} /> },
    { name: t('nearby'), path: '/nearby', icon: <MapPin size={20} /> },
  ];

  return (
    <>
      <nav className="navbar glass">
        <div className="container navbar-container">
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">
              <Stethoscope size={28} color="white" />
            </div>
            <span className="logo-text gradient-text">MedWeb</span>
          </Link>
          
          <div className="navbar-right">
            <div className="navbar-links">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>
            
            <button 
              className="lang-toggle btn-icon-text" 
              onClick={toggleLanguage}
              title="Change Language / भाषा बदलें"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', borderRadius: '1.5rem', background: 'rgba(15, 118, 110, 0.08)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', transition: 'all 0.2s' }}
            >
              <Globe size={16} />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            <button 
              className="theme-toggle btn-icon" 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <button 
              className="sos-nav-btn"
              onClick={() => navigate('/nearby?emergency=true')}
              title={t('emergencyBtn')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.45rem 0.9rem', borderRadius: '1.5rem', background: 'var(--error)', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '750', color: 'white', boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)', animation: 'pulse-sos-btn 1.6s infinite ease-in-out' }}
            >
              <AlertOctagon size={16} />
              <span>SOS</span>
            </button>
          </div>
        </div>
      </nav>

      <nav className="bottom-nav-bar glass">
        {mobileLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`bottom-nav-link ${location.pathname === link.path ? 'active' : ''}`}
          >
            <div className="bottom-nav-icon">
              {link.icon}
            </div>
            <span className="bottom-nav-label">{link.name}</span>
          </Link>
        ))}
      </nav>
    </>
  );
};

export default Navbar;
