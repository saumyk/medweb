import { useLanguage } from './LanguageContext';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer glass">
      <div className="container footer-container">
        <div className="footer-top">
          <Link to="/" className="footer-logo">
            <span className="logo-text gradient-text">MedWeb</span>
          </Link>
          <div className="footer-links">
            <Link to="/assistant">{t('aiAssistant')}</Link>
            <Link to="/ocr">{t('ocr')}</Link>
            <Link to="/medicine">{t('medicineInfo')}</Link>
            <Link to="/dashboard">{t('dashboard')}</Link>
          </div>
        </div>
        
        <div className="footer-divider"></div>
        
        <div className="footer-bottom">
          <p className="footer-disclaimer">
            <strong>⚠️ {t('notMedicalAdvice')}:</strong> {t('disclaimer')}
          </p>
          <p className="footer-copy">
            &copy; {currentYear} MedWeb. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
