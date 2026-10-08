import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CivicProvider } from './context/CivicContext';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';

// Pages
import { Home } from './pages/Home';
import { Welcome } from './pages/Welcome';
import { CitizenAuth } from './pages/CitizenAuth';
import { AuthorityAuth } from './pages/AuthorityAuth';
import { Map } from './pages/Map';
import { Report } from './pages/Report';
import { AiAnalysis } from './pages/AiAnalysis';
import { Tracking } from './pages/Tracking';
import { Authority } from './pages/Authority';
import { Profile } from './pages/Profile';

export default function App() {
  return (
    <CivicProvider>
      <BrowserRouter>
        {/* Unified Mobile-Frame Shell with Seamless Momentum Scrolling */}
        <div className="h-screen h-[100dvh] w-full max-w-md mx-auto bg-slate-50 flex flex-col shadow-2xl relative border-x border-slate-200/80 font-sans overflow-hidden">
          {/* Sleek Fixed Header */}
          <Header />

          {/* Primary Viewport: Smooth Native Momentum Scrolling */}
          <main className="flex-1 w-full overflow-y-auto overflow-x-hidden overscroll-y-contain relative">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/auth/citizen" element={<CitizenAuth />} />
              <Route path="/auth/authority" element={<AuthorityAuth />} />
              <Route path="/map" element={<Map />} />
              <Route path="/report" element={<Report />} />
              <Route path="/ai-analysis" element={<AiAnalysis />} />
              <Route path="/tracking" element={<Tracking />} />
              <Route path="/activity" element={<Tracking />} />
              <Route path="/authority" element={<Authority />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>

          {/* Fixed Bottom Navigation */}
          <Navbar />
        </div>
      </BrowserRouter>
    </CivicProvider>
  );
}
