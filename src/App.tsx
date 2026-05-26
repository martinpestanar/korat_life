import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import BottomNavigation from './components/BottomNavigation';
import InstallBanner from './components/InstallBanner';
import HoyView from './views/HoyView';
import EnfoqueView from './views/EnfoqueView';
import ProyectosView from './views/ProyectosView';
import ProgresoView from './views/ProgresoView';
import DesignModeView from './views/DesignModeView';
import { DataProvider, useData } from './context/DataContext';
import './index.css';

function AnimatedRoutes() {
  const { initialLoading, isOnline } = useData();
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

  if (initialLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-main)',
        fontFamily: 'var(--font-serif)',
        gap: '16px'
      }}>
        <div style={{
          fontSize: '28px',
          fontWeight: 'normal',
          letterSpacing: '1.5px',
          animation: 'pulse 1.8s ease-in-out infinite',
          color: 'var(--text-main)'
        }}>
          Korat Life
        </div>
        <div style={{
          width: '40px',
          height: '2px',
          backgroundColor: 'var(--accent-color)',
          borderRadius: '1px',
          animation: 'expand 1.8s ease-in-out infinite'
        }} />
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.5; transform: scale(0.98); }
            50% { opacity: 1; transform: scale(1); }
          }
          @keyframes expand {
            0%, 100% { width: 12px; opacity: 0.2; }
            50% { width: 50px; opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {!isOnline && (
        <div style={{
          backgroundColor: 'var(--accent-color)',
          color: '#fff',
          fontSize: '11px',
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          textAlign: 'center',
          padding: '6px 12px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          animation: 'fadeIn 0.25s ease',
          letterSpacing: '0.3px'
        }}>
          <span>Modo sin conexión · Datos guardados localmente</span>
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Routes location={location}>
          <Route path="/" element={<HoyView />} />
          <Route path="/enfoque" element={<EnfoqueView />} />
          <Route path="/proyectos" element={<ProyectosView />} />
          <Route path="/progreso" element={<ProgresoView />} />
          <Route path="/diseno" element={<DesignModeView />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <AnimatedRoutes />
        <BottomNavigation />
        <InstallBanner />
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
