import { useLanguage } from './LanguageContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      className="footer glass"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: 'spring', stiffness: 180, damping: 24 }}
    >
      <div className="container footer-container">
        <motion.div
          className="footer-top"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link to="/" className="footer-logo">
            <span className="logo-text gradient-text">ArogyaAI</span>
          </Link>
          <div className="footer-links">
            <Link to="/assistant">{t('aiAssistant')}</Link>
            <Link to="/ocr">{t('ocr')}</Link>
            <Link to="/medicine">{t('medicineInfo')}</Link>
            <Link to="/dashboard">{t('dashboard')}</Link>
          </div>
        </motion.div>
        
        <motion.div
          className="footer-divider"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        ></motion.div>
        
        <motion.div
          className="footer-bottom"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="footer-disclaimer">
            <strong>⚠️ {t('notMedicalAdvice')}:</strong> {t('disclaimer')}
          </p>
          <p className="footer-copy">
            &copy; {currentYear} ArogyaAI. All rights reserved.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;
