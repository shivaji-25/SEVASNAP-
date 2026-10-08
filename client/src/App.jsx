import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CivicProvider } from './context/CivicContext';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';

// Pages
import { Home } from './pages/Home';
import { Map } from './pages/Map';
import { Report } from './pages/Report';
import { AiAnalysis } from './pages/AiAnalysis';
import { Tracking } from './pages/Tracking';
import { Authority } from './pages/Authority';

export default function App() {
  return (
    <CivicProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto shadow-2xl relative border-x border-slate-200/80 font-sans">
          {/* Mobile Header */}
          <Header />

          {/* Main Mobile Screen Viewport */}
          <main className="flex-1 w-full overflow-y-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/map" element={<Map />} />
              <Route path="/report" element={<Report />} />
              <Route path="/ai-analysis" element={<AiAnalysis />} />
              <Route path="/tracking" element={<Tracking />} />
              <Route path="/authority" element={<Authority />} />
            </Routes>
          </main>

          {/* Mobile Bottom Navigation */}
          <Navbar />
        </div>
      </BrowserRouter>
    </CivicProvider>
  );
}
