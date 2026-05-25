import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import BottomNavigation from './components/BottomNavigation';
import InstallBanner from './components/InstallBanner';
import HoyView from './views/HoyView';
import EnfoqueView from './views/EnfoqueView';
import ProyectosView from './views/ProyectosView';
import ProgresoView from './views/ProgresoView';
import DesignModeView from './views/DesignModeView';
import './index.css';

function AnimatedRoutes() {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.classList.remove('page-enter');
    // Force reflow
    void el.offsetWidth;
    el.classList.add('page-enter');
  }, [location.pathname]);

  return (
    <div ref={containerRef} style={{ flex: 1, overflowY: 'auto' }}>
      <Routes location={location}>
        <Route path="/" element={<HoyView />} />
        <Route path="/enfoque" element={<EnfoqueView />} />
        <Route path="/proyectos" element={<ProyectosView />} />
        <Route path="/progreso" element={<ProgresoView />} />
        <Route path="/diseno" element={<DesignModeView />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
      <BottomNavigation />
      <InstallBanner />
    </BrowserRouter>
  );
}

export default App;
