import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Web3Provider from './providers/Web3Provider';
import AnamnesisLayout from './layouts/AnamnesisLayout';
import AnamnesisLandingPage from './pages/AnamnesisLandingPage';
import OverviewPage from './pages/OverviewPage';
import LiveDemoPage from './pages/LiveDemoPage';
import AuditTrailPage from './pages/AuditTrailPage';
import SystemPage from './pages/SystemPage';
import './styles/anamnesis.css';

export default function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <Routes>
          {/* Landing Page — standalone, full-width, scrollable, no sidebar */}
          <Route path="/" element={<AnamnesisLandingPage />} />

          {/* Dashboard — sidebar layout */}
          <Route path="/dashboard" element={<AnamnesisLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="demo" element={<LiveDemoPage />} />
            <Route path="audit" element={<AuditTrailPage />} />
            <Route path="system" element={<SystemPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Web3Provider>
  );
}
