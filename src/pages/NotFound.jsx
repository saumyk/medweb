import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Home, Search, Bot, Activity, MapPin, HeartPulse, Camera, HelpCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '../components/LanguageContext';
import './NotFound.css';

const NotFound = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/medicine?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const navLinks = [
    { name: t('home'), path: '/', icon: <Home size={18} />, desc: language === 'en' ? 'Main landing page' : 'मुख्य पृष्ठ' },
    { name: t('medicineInfo'), path: '/medicine', icon: <Search size={18} />, desc: language === 'en' ? 'Drug directory & dosages' : 'दवा निर्देशिका और खुराक' },
    { name: t('symptoms'), path: '/symptoms', icon: <Activity size={18} />, desc: language === 'en' ? 'Triage & self-care' : 'लक्षण जांच और देखभाल' },
    { name: t('aiAssistant'), path: '/assistant', icon: <Bot size={18} />, desc: language === 'en' ? 'Interactive AI chat' : 'एआई चैट परामर्श' },
    { name: t('dashboard'), path: '/dashboard', icon: <HeartPulse size={18} />, desc: language === 'en' ? 'Track vitals & logs' : 'विटल्स और स्वास्थ्य रिकॉर्ड' },
    { name: t('nearby'), path: '/nearby', icon: <MapPin size={18} />, desc: language === 'en' ? 'Find hospitals & clinics' : 'निकटतम अस्पताल और क्लिनिक' },
    { name: t('ocr'), path: '/ocr', icon: <Camera size={18} />, desc: language === 'en' ? 'Prescription scanner' : 'पर्ची ओसीआर स्कैनर' },
  ];

  return (
    <div className="not-found-page container">
      <div className="not-found-card glass shadow-lg">
        <div className="not-found-badge">
          <HelpCircle size={16} />
          <span>404 · Page Not Found</span>
        </div>

        <h1 className="not-found-title">
          {language === 'en' ? "We couldn't find that page" : 'यह पृष्ठ उपलब्ध नहीं है'}
        </h1>
        <p className="not-found-subtitle">
          {language === 'en'
            ? 'The link you clicked may be broken, or the page may have been moved. Try searching or jump to one of our core healthcare tools below.'
            : 'जो लिंक आपने खोला है वह शायद पुराना है या हटा दिया गया है। नीचे दिए गए किसी भी मुख्य विकल्प को चुनें या खोजें।'}
        </p>

        <form className="not-found-search" onSubmit={handleSearchSubmit}>
          <Search size={18} className="not-found-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder={language === 'en' ? 'Search medicines or health topics...' : 'दवाएं या स्वास्थ्य विषय खोजें...'}
            aria-label={language === 'en' ? 'Search medicines' : 'दवा खोजें'}
          />
          <button type="submit" className="btn btn-primary btn-sm">
            <span>{t('search')}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        <div className="not-found-grid">
          {navLinks.map((item) => (
            <Link key={item.path} to={item.path} className="not-found-link glass">
              <span className="not-found-link-icon">{item.icon}</span>
              <div className="not-found-link-text">
                <span className="not-found-link-name">{item.name}</span>
                <span className="not-found-link-desc">{item.desc}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            <Home size={18} />
            <span>{t('backToHome')}</span>
          </Link>
          <Link to="/nearby?emergency=true" className="btn btn-emergency-hotline">
            <span>Emergency SOS (112)</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

