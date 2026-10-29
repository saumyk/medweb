import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import VoiceAssistant from './components/VoiceAssistant';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import AIAssistant from './pages/AIAssistant';
import MedicineInfo from './pages/MedicineInfo';
import Nearby from './pages/Nearby';
import SymptomsChecker from './pages/SymptomsChecker';
import PrescriptionOCR from './pages/PrescriptionOCR';
import HealthDashboard from './pages/HealthDashboard';
import Telemedicine from './pages/Telemedicine';
import ArogyaAgentConsole from './components/ArogyaAgentConsole';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import { LanguageProvider } from './components/LanguageContext';
import { AuthProvider } from './components/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/assistant" element={<AIAssistant />} />
                <Route path="/medicine" element={<MedicineInfo />} />
                <Route path="/global-medicine-search" element={<Navigate to="/medicine" replace />} />
                <Route path="/global-medicine" element={<Navigate to="/medicine" replace />} />
                <Route path="/symptoms" element={<SymptomsChecker />} />
                <Route path="/nearby" element={<Nearby />} />
                <Route path="/ocr" element={<PrescriptionOCR />} />
                <Route path="/dashboard" element={<HealthDashboard />} />
                <Route path="/telemedicine" element={<Telemedicine />} />
                
                {/* Multi-Agent Engine */}
                <Route path="/agent" element={<ArogyaAgentConsole />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Common alias route redirects */}
                <Route path="/medicines" element={<Navigate to="/medicine" replace />} />
                <Route path="/symptom" element={<Navigate to="/symptoms" replace />} />
                <Route path="/prescriptions" element={<Navigate to="/ocr" replace />} />
                <Route path="/prescription" element={<Navigate to="/ocr" replace />} />
                <Route path="/consultation" element={<Navigate to="/telemedicine" replace />} />
                <Route path="/sos" element={<Navigate to="/nearby?emergency=true" replace />} />

                {/* 404 Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </main>
          <Footer />
          <ErrorBoundary>
            <VoiceAssistant />
          </ErrorBoundary>
        </div>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
