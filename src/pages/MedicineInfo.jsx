import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Globe,
  Loader2,
  FileWarning,
  FlaskConical,
  Factory,
  ShieldAlert,
  Pill,
  AlertTriangle,
  Ban,
  Activity,
  BookOpen,
  HeartPulse,
  Wine,
  Baby,
  Info,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../components/LanguageContext';
import { lookupMedicine } from '../utils/medicineLookup';
import { getSpellingCorrection, getQuickSuggestions } from '../utils/medicineSearchEngine';
import { enforceMaxLength } from '../utils/security';
import './MedicineInfo.css';

const QUICK_SEARCHES = ['Dolo 650', 'Combiflam', 'Amoxicillin', 'Cetirizine', 'Tylenol', 'Panadol', 'Lipitor', 'Paxlovid'];

const Section = ({ id, title, icon: Icon, tone = 'default', children }) => (
  <section id={`med-sec-${id}`} className={`med-panel med-panel--${tone}`}>
    <div className="med-panel-head">
      <span className={`med-panel-icon med-panel-icon--${tone}`}>
        <Icon size={18} />
      </span>
      <h3>{title}</h3>
    </div>
    <div className="med-panel-body">{children}</div>
  </section>
);

const MedicineInfo = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [didYouMean, setDidYouMean] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeSection, setActiveSection] = useState('');
  const contentRef = useRef(null);
  const requestIdRef = useRef(0);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = enforceMaxLength(searchQuery.trim(), 250);
    if (!query || isSearching) return;
    fetchMedicineData(query);
  };

  const fetchMedicineData = async (query) => {
    const currentId = ++requestIdRef.current;
    setIsSearching(true);
    setResult(null);
    setError(null);
    setDidYouMean(null);
    setSuggestions([]);
    setActiveSection('');

    try {
      const data = await lookupMedicine(query);
      if (currentId === requestIdRef.current) {
        setResult(data);
      }
    } catch (err) {
      if (currentId === requestIdRef.current) {
        console.error(err);
        const correction = getSpellingCorrection(query);
        const quick = getQuickSuggestions(query, 3);
        setDidYouMean(correction.hasCorrection ? correction.didYouMean : null);
        setSuggestions(quick);
        setError(
          `We couldn't find official label information for "${query}". Check the spelling, try the generic (INN) name, or ask a pharmacist.`
        );
      }
    } finally {
      if (currentId === requestIdRef.current) {
        setIsSearching(false);
      }
    }
  };

  useEffect(() => {
    const searchVal = searchParams.get('search');
    if (searchVal && searchVal.trim()) {
      const cleanVal = searchVal.trim();
      const timer = setTimeout(() => {
        setSearchQuery(cleanVal);
        fetchMedicineData(cleanVal);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const sections = useMemo(() => {
    if (!result) return [];
    return [
      result.boxedWarning && { id: 'boxed', label: 'Boxed warning', icon: ShieldAlert },
      result.description?.length > 0 && { id: 'uses', label: 'Uses', icon: BookOpen },
      result.doNotUse?.length > 0 && { id: 'avoid', label: 'Do not use', icon: Ban },
      result.precautions?.length > 0 && { id: 'precautions', label: 'Precautions', icon: AlertTriangle },
      result.interactions?.length > 0 && { id: 'interactions', label: 'Interactions', icon: Activity },
      result.risks?.length > 0 && { id: 'effects', label: 'Side effects', icon: HeartPulse },
      result.dosage && { id: 'dosage', label: 'Dosage', icon: Pill },
      result.pharmacokinetics && { id: 'works', label: 'How it works', icon: FlaskConical },
      result.seekHelp && { id: 'seek-help', label: 'Seek help', icon: ShieldAlert },
      { id: 'safety', label: 'Safety', icon: Wine },
      { id: 'sources', label: 'Sources', icon: Info },
    ].filter(Boolean);
  }, [result]);

  useEffect(() => {
    if (!result || !sections.length) return;
    const initialId = sections[0].id;
    const raf = requestAnimationFrame(() => {
      setActiveSection(initialId);
    });

    const ids = sections.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveSection(visible[0].target.id.replace('med-sec-', ''));
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.1, 0.4] }
    );

    ids.forEach((id) => {
      const el = document.getElementById(`med-sec-${id}`);
      if (el) observer.observe(el);
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [result, sections]);

  const scrollToSection = (id) => {
    const el = document.getElementById(`med-sec-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  const renderTextBlock = (items) => {
    if (!items || (Array.isArray(items) && items.length === 0)) return null;
    if (Array.isArray(items)) {
      return (
        <ul className="med-bullet-list">
          {items.map((item, idx) => (
            <li key={idx}>
              <ChevronRight size={16} className="med-bullet-icon" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }
    return <p className="med-body-text">{items}</p>;
  };

  return (
    <div className="med-page">
      <div className="med-hero">
        <div className="med-hero-glow" aria-hidden />
        <div className="med-hero-inner container">
          <p className="med-eyebrow">Indian & Global Medicines · Official Labels · Free Public APIs</p>
          <h1 className="med-hero-title">{t('medTitle')}</h1>
          <p className="med-hero-sub">{t('medSubtitle')}</p>

          <form onSubmit={handleSearch} className="med-search-bar">
            <div className="med-search-field">
              <Search className="med-search-icon" size={20} aria-hidden />
              <input
                type="text"
                placeholder={t('medInputPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="med-search-input"
                aria-label="Search medicine"
              />
            </div>
            <button
              type="submit"
              className="med-search-btn"
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? <Loader2 className="spinner" size={18} /> : t('search')}
            </button>
          </form>

          {!result && !isSearching && !error && (
            <div className="med-quick-row">
              <span className="med-quick-label">Popular</span>
              {QUICK_SEARCHES.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="med-quick-chip"
                  onClick={() => {
                    setSearchQuery(name);
                    fetchMedicineData(name);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="med-body container" ref={contentRef}>
        <AnimatePresence mode="wait">
          {isSearching && (
            <motion.div
              key="loading"
              className="med-state med-state--loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="med-loader-ring">
                <Loader2 className="spinner" size={28} />
              </div>
              <p>{t('searchingMed')}</p>
              <span className="med-state-hint">Checking CDSCO, RxNorm, openFDA, and global registries…</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && !isSearching && (
            <motion.div
              key="error"
              className="med-state med-state--error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FileWarning size={28} />
              <p>{error}</p>
              {(didYouMean || suggestions.length > 0) && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Did you mean:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                    {didYouMean && (
                      <button
                        type="button"
                        className="med-quick-chip"
                        onClick={() => {
                          setSearchQuery(didYouMean);
                          fetchMedicineData(didYouMean);
                        }}
                      >
                        {didYouMean}
                      </button>
                    )}
                    {suggestions.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        className="med-quick-chip"
                        onClick={() => {
                          setSearchQuery(s.name);
                          fetchMedicineData(s.name);
                        }}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && !isSearching && (
            <motion.div
              key="result"
              className="med-result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <article className="med-monograph">
                <header className="med-mono-header">
                  <div className="med-mono-main">
                    <div className="med-mono-badges">
                      <span className="med-cat-badge">{result.category}</span>
                      {result.market && (
                        <span className="med-cat-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Globe size={12} /> {result.market}
                        </span>
                      )}
                      {result.ingredients?.length > 1 && (
                        <span className="med-combo-badge">Combination</span>
                      )}
                    </div>
                    <h2 className="med-drug-name">{result.name}</h2>
                    {result.searchedName &&
                      result.searchedName.toLowerCase() !== result.name.toLowerCase() && (
                        <p className="med-resolved-note">
                          Searched &ldquo;{result.searchedName}&rdquo; · showing resolved
                          ingredient label
                        </p>
                      )}

                    <div className="med-meta-grid">
                      <div className="med-meta-item">
                        <FlaskConical size={16} />
                        <div>
                          <span className="med-meta-label">Active ingredient(s)</span>
                          <strong>{result.formula}</strong>
                        </div>
                      </div>
                      <div className="med-meta-item">
                        <Factory size={16} />
                        <div>
                          <span className="med-meta-label">{t('medManufacturer')}</span>
                          <strong>{result.manufacturer}</strong>
                        </div>
                      </div>
                    </div>

                    {result.ingredients?.length > 1 && (
                      <div className="med-ingredient-row">
                        {result.ingredients.map((ing) => (
                          <span key={ing} className="med-ing-chip">
                            {ing}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </header>

                <div className="med-safety-strip">
                  <div className={`med-safety-tile status-${result.safety.alcohol.toLowerCase()}`}>
                    <Wine size={18} />
                    <div>
                      <span>{t('alcoholSafety')}</span>
                      <strong>{result.safety.alcohol}</strong>
                    </div>
                  </div>
                  <div className={`med-safety-tile status-${result.safety.pregnancy.toLowerCase()}`}>
                    <Baby size={18} />
                    <div>
                      <span>{t('pregnancySafety')}</span>
                      <strong>{result.safety.pregnancy}</strong>
                    </div>
                  </div>
                  {result.lactationDetail && (
                    <div className="med-safety-tile status-unknown">
                      <HeartPulse size={18} />
                      <div>
                        <span>Lactation</span>
                        <strong>See label</strong>
                      </div>
                    </div>
                  )}
                </div>
              </article>

              {sections.length > 0 && (
                <nav className="med-toc" aria-label="Medicine sections">
                  <div className="med-toc-track">
                    {sections.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        className={`med-toc-item${activeSection === id ? ' is-active' : ''}`}
                        onClick={() => scrollToSection(id)}
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    ))}
                  </div>
                </nav>
              )}

              <div className="med-panels">
                {result.boxedWarning && (
                  <Section id="boxed" title="Boxed warning" icon={ShieldAlert} tone="danger">
                    <div className="med-alert med-alert--danger">
                      <p>{result.boxedWarning}</p>
                    </div>
                  </Section>
                )}

                {result.description?.length > 0 && (
                  <Section id="uses" title={t('medDescription')} icon={BookOpen} tone="teal">
                    {renderTextBlock(result.description)}
                  </Section>
                )}

                {result.doNotUse?.length > 0 && (
                  <Section id="avoid" title="Do not use / contraindications" icon={Ban} tone="danger">
                    {renderTextBlock(result.doNotUse)}
                  </Section>
                )}

                {result.precautions?.length > 0 && (
                  <Section
                    id="precautions"
                    title="Precautions & warnings"
                    icon={AlertTriangle}
                    tone="warn"
                  >
                    {renderTextBlock(result.precautions)}
                  </Section>
                )}

                {result.interactions?.length > 0 && (
                  <Section id="interactions" title="Drug interactions" icon={Activity} tone="blue">
                    {renderTextBlock(result.interactions)}
                  </Section>
                )}

                {result.risks?.length > 0 && (
                  <Section id="effects" title={t('medRisks')} icon={HeartPulse} tone="amber">
                    <p className="med-panel-lead">
                      From the official label. Ask a doctor if effects persist or worry you.
                    </p>
                    <div className="med-effect-grid">
                      {result.risks.map((risk, idx) => (
                        <div key={idx} className="med-effect-card">
                          {risk}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {result.dosage && (
                  <Section id="dosage" title={t('medDosage')} icon={Pill} tone="teal">
                    <p className="med-body-text">{result.dosage}</p>
                  </Section>
                )}

                {result.pharmacokinetics && (
                  <Section id="works" title="How it works" icon={FlaskConical} tone="default">
                    <p className="med-body-text">{result.pharmacokinetics}</p>
                  </Section>
                )}

                {result.seekHelp && (
                  <Section id="seek-help" title={t('whenSeekHelp')} icon={ShieldAlert} tone="danger">
                    <div className="med-alert med-alert--danger">
                      <strong>Stop use / seek help (from label)</strong>
                      <p>{result.seekHelp}</p>
                    </div>
                  </Section>
                )}

                <Section id="safety" title={t('medSafety')} icon={Wine} tone="default">
                  <div className="med-safety-details">
                    <div className="med-safety-detail">
                      <div className="med-safety-detail-top">
                        <Wine size={16} />
                        <strong>{t('alcoholSafety')}</strong>
                        <span
                          className={`safety-status-badge status-${result.safety.alcohol.toLowerCase()}`}
                        >
                          {result.safety.alcohol}
                        </span>
                      </div>
                      {result.safety.alcoholNote && (
                        <p>{result.safety.alcoholNote}</p>
                      )}
                    </div>
                    <div className="med-safety-detail">
                      <div className="med-safety-detail-top">
                        <Baby size={16} />
                        <strong>{t('pregnancySafety')}</strong>
                        <span
                          className={`safety-status-badge status-${result.safety.pregnancy.toLowerCase()}`}
                        >
                          {result.safety.pregnancy}
                        </span>
                      </div>
                      {result.safety.pregnancyNote && (
                        <p>{result.safety.pregnancyNote}</p>
                      )}
                    </div>
                    {result.lactationDetail && (
                      <div className="med-safety-detail">
                        <div className="med-safety-detail-top">
                          <HeartPulse size={16} />
                          <strong>Lactation</strong>
                        </div>
                        <p>{result.lactationDetail}</p>
                      </div>
                    )}
                  </div>
                </Section>

                <Section id="sources" title="Sources" icon={Info} tone="default">
                  <div className="med-source-chips">
                    {(result.sources || []).map((src) => (
                      <span key={src} className="med-source-chip">
                        {src}
                      </span>
                    ))}
                  </div>
                  <p className="med-disclaimer">{result.disclaimer}</p>
                </Section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MedicineInfo;
