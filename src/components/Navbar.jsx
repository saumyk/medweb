import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, FileText, History, MapPin, Activity, Search, Moon, Sun } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navLinks = [
    { name: 'Scan Prescription', path: '/scan', icon: <FileText size={20} /> },
    { name: 'Medicine Info', path: '/medicine', icon: <Search size={20} /> },
    { name: 'Symptoms', path: '/symptoms', icon: <Activity size={20} /> },
    { name: 'Nearby', path: '/nearby', icon: <MapPin size={20} /> },
  ];

  return (
    <nav className="navbar glass">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Stethoscope size={28} color="white" />
          </div>
          <span className="logo-text gradient-text">MedWeb</span>
        </Link>
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
          
          <button 
            className="theme-toggle btn-icon" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
