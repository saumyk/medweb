import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  MapPin,
  Activity,
  Search,
  Moon,
  Sun,
  Home as HomeIcon,
  Bot,
  Camera,
  HeartPulse,
  AlertOctagon,
  X,
  LogOut,
  Cpu,
  ChevronRight,
  User,
  Shield,
  Languages,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  LoaderCircle,
} from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { user, loginWithGoogle, loginWithPassword, signUpWithPassword, sendPasswordReset, logout } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [navQuery, setNavQuery] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

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

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsHubOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const menuSections = [
    {
      id: 'main',
      items: [
        { name: t('home'), path: '/', icon: <HomeIcon size={20} /> },
        { name: t('medicineInfo'), path: '/medicine', icon: <Search size={20} /> },
        { name: t('dashboard'), path: '/dashboard', icon: <HeartPulse size={20} /> },
        { name: t('nearby'), path: '/nearby', icon: <MapPin size={20} /> },
        { name: t('aiAssistant'), path: '/assistant', icon: <Bot size={20} /> },
        { name: t('symptoms'), path: '/symptoms', icon: <Activity size={20} /> },
        { name: t('ocr'), path: '/ocr', icon: <Camera size={20} /> },
        { name: t('telemedicine'), path: '/telemedicine', icon: <Stethoscope size={20} /> },
        { name: 'Agent Engine', path: '/agent', icon: <Cpu size={20} /> },
        {
          name: t('emergencyBtn'),
          path: '/nearby?emergency=true',
          icon: <AlertOctagon size={20} />,
          accent: 'danger',
        },
      ],
    },
  ];

  const accountSection = {
    items: user
      ? [
          {
            name: language === 'en' ? 'My Health Dashboard' : 'मेरा हेल्थ डैशबोर्ड',
            path: '/dashboard',
            icon: <HeartPulse size={20} />,
          },
          {
            name: language === 'en' ? 'Sign Out' : 'साइन आउट',
            action: 'logout',
            icon: <LogOut size={20} />,
          },
        ]
      : [],
  };

  const handleNavSearch = (e) => {
    e.preventDefault();
    const q = navQuery.trim();
    setIsHubOpen(false);
    navigate(q ? `/medicine?search=${encodeURIComponent(q)}` : '/medicine');
  };

  const handleMenuItemClick = (item) => {
    if (item.action === 'logout') {
      setIsHubOpen(false);
      logout();
      return;
    }
    if (item.path) {
      setIsHubOpen(false);
      navigate(item.path);
    }
  };

  const openAuthDialog = () => {
    setIsHubOpen(false);
    setAuthMode('signin');
    setAuthMessage('');
    setIsAuthOpen(true);
  };

  const closeAuthDialog = () => {
    if (!isAuthSubmitting) {
      setIsAuthOpen(false);
      setAuthMessage('');
      setAuthPassword('');
    }
  };

  const handlePasswordAuth = async (event) => {
    event.preventDefault();
    setAuthMessage('');

    if (!authEmail.trim()) {
      setAuthMessage('Enter your email address.');
      return;
    }

    if (authMode !== 'forgot' && !authPassword) {
      setAuthMessage('Enter your password.');
      return;
    }

    setIsAuthSubmitting(true);
    const { data, error } = authMode === 'forgot'
      ? await sendPasswordReset(authEmail.trim())
      : authMode === 'signin'
        ? await loginWithPassword(authEmail.trim(), authPassword)
        : await signUpWithPassword(authEmail.trim(), authPassword);
    setIsAuthSubmitting(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    if (authMode === 'forgot') {
      setAuthMessage('If an account exists for this email, a password-reset link has been sent.');
      return;
    }

    if (authMode === 'signup' && !data?.session) {
      setAuthMessage('Account created. Check your email to confirm your address, then sign in.');
      return;
    }

    setIsAuthOpen(false);
    setAuthPassword('');
  };

  return (
    <>
      <motion.nav
        className="navbar glass"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.05 }}
      >
        <div className="container navbar-container">
          <motion.div
            className="navbar-left"
            initial={{ x: -12, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              className={`hamburger-menu-btn ${isHubOpen ? 'active' : ''}`}
              onClick={() => {
                setIsHubOpen((open) => !open);
              }}
              aria-expanded={isHubOpen}
              aria-label={isHubOpen ? 'Close menu' : 'Open menu'}
              title={language === 'en' ? 'Menu' : 'मेनू'}
            >
              <span className="hb-bars" aria-hidden="true">
                <span className="hb-bar hb-bar--top" />
                <span className="hb-bar hb-bar--mid" />
                <span className="hb-bar hb-bar--bot" />
              </span>
            </button>
            <Link to="/" className="navbar-logo" onClick={() => setIsHubOpen(false)}>
              <motion.div
                className="logo-icon"
                whileHover={{ rotate: -8, scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              >
                <Stethoscope size={22} color="white" />
              </motion.div>
              <span className="logo-text">ArogyaAI</span>
            </Link>
          </motion.div>

          <motion.form
            className="navbar-search"
            onSubmit={handleNavSearch}
            role="search"
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Search size={16} className="navbar-search-icon" />
            <input
              type="search"
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              placeholder={language === 'en' ? 'Search medicines, symptoms, doctors...' : 'दवाएं, लक्षण, डॉक्टर खोजें...'}
              aria-label={language === 'en' ? 'Search' : 'खोजें'}
            />
          </motion.form>

          <motion.div
            className="navbar-right"
            initial={{ x: 12, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              className="sos-nav-btn"
              onClick={() => navigate('/nearby?emergency=true')}
              title={t('emergencyBtn')}
            >
              <AlertOctagon size={15} />
              <span>SOS</span>
            </button>
          </motion.div>
        </div>
      </motion.nav>

      {/* Side drawer menu (Tata 1mg–style) */}
      <AnimatePresence>
        {isHubOpen && (
          <motion.div
            className="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            onClick={() => setIsHubOpen(false)}
            role="presentation"
          >
            <motion.aside
              className="drawer-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              aria-label={language === 'en' ? 'Main menu' : 'मुख्य मेनू'}
            >
              {/* ── PREMIUM HEADER ── */}
              <div className="drawer-header">
                <div className="drawer-header-mesh" aria-hidden="true" />
                <button
                  type="button"
                  className="drawer-header-account"
                  onClick={() => {
                    if (user) { handleMenuItemClick({ path: '/dashboard' }); }
                    else { openAuthDialog(); }
                  }}
                >
                  <span className="drawer-avatar-ring">
                    {user ? (
                      <img
                        src={user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
                        alt=""
                        className="drawer-header-avatar"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="drawer-header-avatar drawer-header-avatar--guest">
                        <User size={22} />
                      </span>
                    )}
                    {user && <span className="drawer-avatar-online" />}
                  </span>
                  <span className="drawer-header-copy">
                    <span className="drawer-header-hello">
                      {language === 'en' ? (user ? 'Welcome back,' : 'Hello, Guest') : (user ? 'वापसी पर स्वागत,' : 'नमस्ते, अतिथि')}
                    </span>
                    <span className="drawer-header-name">
                      {user ? (user.user_metadata?.full_name || user.email) : (language === 'en' ? 'Login / Sign up' : 'लॉगिन / साइन अप')}
                    </span>
                    {user && (
                      <span className="drawer-header-badge">
                        <Shield size={10} />
                        {language === 'en' ? 'Synced' : 'सिंक'}
                      </span>
                    )}
                  </span>
                  <ChevronRight size={16} className="drawer-header-chevron" />
                </button>
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setIsHubOpen(false)}
                  aria-label="Close menu"
                >
                  <span className="drawer-close-x" aria-hidden="true">
                    <span /><span />
                  </span>
                </button>
              </div>

              {/* ── SCROLLABLE CONTENT ── */}
              <div className="drawer-scroll">
                {menuSections.map((section, si) => (
                  <motion.div
                    key={section.id}
                    className="drawer-section"
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + si * 0.07, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ul className="drawer-list">
                      {section.items.map((item, ii) => {
                        const isActive = item.path &&
                          location.pathname === item.path.split('?')[0] &&
                          (!item.path.includes('?') || location.search.includes(item.path.split('?')[1]));
                        return (
                          <motion.li
                            key={item.name}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + si * 0.07 + ii * 0.04, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <button
                              type="button"
                              className={`drawer-list-item ${
                                item.accent === 'danger' ? 'drawer-list-item--danger' : ''
                              } ${isActive ? 'drawer-list-item--active' : ''}`}
                              onClick={() => handleMenuItemClick(item)}
                            >
                              <span className={`drawer-list-icon ${item.accent === 'danger' ? 'drawer-list-icon--danger' : ''}`}>
                                {item.icon}
                              </span>
                              <span className="drawer-list-label">{item.name}</span>
                              {isActive
                                ? <span className="drawer-active-dot" />
                                : <ChevronRight size={15} className="drawer-row-chevron" />
                              }
                            </button>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </motion.div>
                ))}

                {accountSection.items.length > 0 && (
                  <motion.div
                    className="drawer-section"
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.34, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ul className="drawer-list">
                      {accountSection.items.map((item) => (
                        <li key={item.name}>
                          <button
                            type="button"
                            className={`drawer-list-item ${item.action === 'logout' ? 'drawer-list-item--logout' : ''}`}
                            onClick={() => handleMenuItemClick(item)}
                          >
                            <span className="drawer-list-icon">{item.icon}</span>
                            <span className="drawer-list-label">{item.name}</span>
                            <ChevronRight size={15} className="drawer-row-chevron" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

              </div>

              <div className="drawer-footer">
                <span className="drawer-settings-title">
                  {language === 'en' ? 'Preferences' : 'प्राथमिकताएँ'}
                </span>
                <div className="drawer-settings-actions">
                  <button
                    type="button"
                    className={`drawer-preference drawer-preference--language ${language === 'hi' ? 'is-active' : ''}`}
                    onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                    aria-pressed={language === 'hi'}
                    aria-label={language === 'en' ? 'Language: English. Switch to Hindi' : 'भाषा: हिन्दी। अंग्रेज़ी में बदलें'}
                    title={language === 'en' ? 'Switch language' : 'भाषा बदलें'}
                  >
                    <span className="drawer-preference-icon" aria-hidden="true">
                      <Languages size={20} />
                    </span>
                    <span className="drawer-preference-copy">
                      <span className="drawer-preference-label">{language === 'en' ? 'Language' : 'भाषा'}</span>
                      <span className="drawer-preference-value">{language === 'en' ? 'English' : 'हिन्दी'}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`drawer-preference drawer-preference--theme ${theme === 'dark' ? 'is-active' : ''}`}
                    onClick={() => setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light')}
                    aria-pressed={theme === 'dark'}
                    aria-label={language === 'en'
                      ? `Theme: ${theme}. Switch to ${theme === 'light' ? 'dark' : 'light'} mode`
                      : `थीम: ${theme === 'light' ? 'लाइट' : 'डार्क'}। ${theme === 'light' ? 'डार्क' : 'लाइट'} मोड में बदलें`}
                    title={language === 'en' ? 'Toggle theme' : 'थीम बदलें'}
                  >
                    <span className="drawer-preference-icon" aria-hidden="true">
                      {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                    </span>
                    <span className="drawer-preference-copy">
                      <span className="drawer-preference-label">{language === 'en' ? 'Appearance' : 'रूप'}</span>
                      <span className="drawer-preference-value">
                        {language === 'en' ? (theme === 'light' ? 'Light mode' : 'Dark mode') : (theme === 'light' ? 'लाइट मोड' : 'डार्क मोड')}
                      </span>
                    </span>
                  </button>
                </div>
              </div>

            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAuthOpen && (
          <motion.div
            className="auth-dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthDialog}
            role="presentation"
          >
            <motion.section
              className="auth-dialog"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-dialog-title"
            >
              <button type="button" className="auth-dialog-close" onClick={closeAuthDialog} aria-label="Close sign in dialog">
                <X size={20} />
              </button>
              <div className="auth-dialog-heading">
                <span className="auth-dialog-icon"><User size={22} /></span>
                <h2 id="auth-dialog-title">{authMode === 'signin' ? 'Welcome back' : authMode === 'signup' ? 'Create your account' : 'Reset your password'}</h2>
                <p>{authMode === 'signin' ? 'Sign in to securely sync your health records.' : authMode === 'signup' ? 'Save and securely sync your health records.' : 'We will email you a secure link to choose a new password.'}</p>
              </div>

              <form className="auth-form" onSubmit={handlePasswordAuth}>
                <label htmlFor="auth-email">Email address</label>
                <div className="auth-input-wrap">
                  <Mail size={17} aria-hidden="true" />
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    placeholder="you@example.com"
                    disabled={isAuthSubmitting}
                    required
                  />
                </div>

                {authMode !== 'forgot' && (
                  <>
                    <label htmlFor="auth-password">Password</label>
                    <div className="auth-input-wrap">
                      <LockKeyhole size={17} aria-hidden="true" />
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                        value={authPassword}
                        onChange={(event) => setAuthPassword(event.target.value)}
                        placeholder={authMode === 'signup' ? 'At least 6 characters' : 'Your password'}
                        minLength={authMode === 'signup' ? 6 : undefined}
                        disabled={isAuthSubmitting}
                        required
                      />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {authMode === 'signin' && (
                      <button type="button" className="auth-forgot-btn" onClick={() => {
                        setAuthMode('forgot');
                        setAuthMessage('');
                        setAuthPassword('');
                      }}>
                        Forgot password?
                      </button>
                    )}
                  </>
                )}

                {authMessage && <p className="auth-message" role="status">{authMessage}</p>}

                <button type="submit" className="auth-submit-btn" disabled={isAuthSubmitting}>
                  {isAuthSubmitting && <LoaderCircle size={17} className="animate-spin" />}
                  {authMode === 'signin' ? 'Sign in with email' : authMode === 'signup' ? 'Create account' : 'Send reset link'}
                </button>
              </form>

              {authMode !== 'forgot' && <>
                <div className="auth-divider"><span>or</span></div>

                <button type="button" className="auth-google-btn" onClick={loginWithGoogle} disabled={isAuthSubmitting}>
                  <span className="google-mark" aria-hidden="true">G</span>
                  Continue with Google
                </button>
              </>}

              <p className="auth-mode-switch">
                {authMode === 'signin' ? "New to ArogyaAI?" : authMode === 'signup' ? 'Already have an account?' : 'Remembered your password?'}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode((mode) => mode === 'signin' ? 'signup' : 'signin');
                    setAuthMessage('');
                    setAuthPassword('');
                  }}
                >
                  {authMode === 'signin' ? 'Create an account' : 'Sign in'}
                </button>
              </p>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
