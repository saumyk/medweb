import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import VoiceAssistant from './components/VoiceAssistant';
import Home from './pages/Home';
import AIAssistant from './pages/AIAssistant';
import MedicineInfo from './pages/MedicineInfo';
import Nearby from './pages/Nearby';
import SymptomsChecker from './pages/SymptomsChecker';
import PrescriptionOCR from './pages/PrescriptionOCR';
import HealthDashboard from './pages/HealthDashboard';
import { LanguageProvider } from './components/LanguageContext';
import { AuthProvider } from './components/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
      <div className="app">
        {/* Global ambient glowing backdrops for rich aesthetics */}
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
        <div className="ambient-orb orb-3"></div>

        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/assistant" element={<AIAssistant />} />
            <Route path="/medicine" element={<MedicineInfo />} />
            <Route path="/symptoms" element={<SymptomsChecker />} />
            <Route path="/nearby" element={<Nearby />} />
            <Route path="/ocr" element={<PrescriptionOCR />} />
            <Route path="/dashboard" element={<HealthDashboard />} />
          </Routes>
        </main>
        <VoiceAssistant />
      </div>
    </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
