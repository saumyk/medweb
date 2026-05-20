import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ScanPrescription from './pages/ScanPrescription';
import MedicineInfo from './pages/MedicineInfo';
import Nearby from './pages/Nearby';
import SymptomsChecker from './pages/SymptomsChecker';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scan" element={<ScanPrescription />} />
          <Route path="/medicine" element={<MedicineInfo />} />
          <Route path="/symptoms" element={<SymptomsChecker />} />
          <Route path="/nearby" element={<Nearby />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
