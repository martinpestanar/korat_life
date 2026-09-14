import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import FlowEngineNavigation from './components/FlowEngineNavigation';
import InstallBanner from './components/InstallBanner';
import KoratLabView from './views/KoratLabView';
import SandboxView from './views/SandboxView';
import KoratFlowEngineView from './views/KoratFlowEngineView';
import PillarSoftwareView from './views/PillarSoftwareView';
import PillarTikTokView from './views/PillarTikTokView';
import PillarSalesView from './views/PillarSalesView';
import SettingsView from './views/SettingsView';
import HoyView from './views/HoyView';
import EnfoqueView from './views/EnfoqueView';
import ProyectosView from './views/ProyectosView';
import ProgresoView from './views/ProgresoView';
import CreadorView from './views/CreadorView';
import RetoDiciembreView from './views/RetoDiciembreView';
import GimnasiaMentalView from './views/GimnasiaMentalView';
import { DataProvider, useData } from './context/DataContext';
import { SaaSProvider } from './context/SaaSContext';
import './index.css';

function MainLayout() {
  const { initialLoading, isOnline } = useData();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Engine navigation is active exclusively inside /korat-flow-engine
  const isEngine = location.pathname.startsWith('/korat-flow-engine') || location.pathname.startsWith('/app');
  const isHubOrLab = location.pathname === '/' || location.pathname.startsWith('/sandbox') || location.pathname.startsWith('/lab');
  const showEngineNav = isEngine && !isHubOrLab;

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
        backgroundColor: '#FAF8F5',
        color: '#0A2A1E',
        fontFamily: 'var(--font-serif)',
        gap: '16px'
      }}>
        <div style={{
          fontSize: '32px',
          fontWeight: 'normal',
          letterSpacing: '1.5px',
          animation: 'pulse 1.8s ease-in-out infinite',
          color: '#11562a'
        }}>
          Korat Hub
        </div>
        <div style={{
          width: '40px',
          height: '2px',
          backgroundColor: '#D46A43',
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
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: 'var(--bg-app)' }}>
      {/* Desktop Collapsible Sidebar & Mobile Fixed Bottom Bar */}
      {showEngineNav && (
        <FlowEngineNavigation
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Main Content Area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}
      >
        {!isOnline && (
          <div style={{
            backgroundColor: '#D46A43',
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

        <div style={{ flex: 1 }}>
          <Routes location={location}>
            {/* 1. Portal de Entrada / App Launcher Raíz */}
            <Route path="/" element={<KoratLabView />} />

            {/* 2. Laboratorio / Sandbox */}
            <Route path="/lab" element={<SandboxView />} />
            <Route path="/sandbox" element={<SandboxView />} />

            {/* 3. Korat Flow Engine - Pantalla Principal & Pilares */}
            <Route path="/korat-flow-engine" element={<KoratFlowEngineView />} />
            <Route path="/korat-flow-engine/software" element={<PillarSoftwareView />} />
            <Route path="/korat-flow-engine/tiktok" element={<PillarTikTokView />} />
            <Route path="/korat-flow-engine/ventas" element={<PillarSalesView />} />
            <Route path="/korat-flow-engine/ajustes" element={<SettingsView />} />
            
            {/* Rutas de rutinas y módulos complementarios */}
            <Route path="/korat-flow-engine/hoy" element={<HoyView />} />
            <Route path="/korat-flow-engine/reto" element={<RetoDiciembreView />} />
            <Route path="/korat-flow-engine/recreo" element={<GimnasiaMentalView />} />
            <Route path="/korat-flow-engine/enfoque" element={<EnfoqueView />} />
            <Route path="/korat-flow-engine/proyectos" element={<ProyectosView />} />
            <Route path="/korat-flow-engine/creador" element={<CreadorView />} />
            <Route path="/korat-flow-engine/progreso" element={<ProgresoView />} />

            {/* Redirecciones automáticas para compatibilidad */}
            <Route path="/app" element={<Navigate to="/korat-flow-engine" replace />} />
            <Route path="/app/*" element={<Navigate to="/korat-flow-engine" replace />} />
            <Route path="/reto" element={<Navigate to="/korat-flow-engine/reto" replace />} />
            <Route path="/recreo" element={<Navigate to="/korat-flow-engine/recreo" replace />} />
            <Route path="/enfoque" element={<Navigate to="/korat-flow-engine/enfoque" replace />} />
            <Route path="/proyectos" element={<Navigate to="/korat-flow-engine/proyectos" replace />} />
            <Route path="/creador" element={<Navigate to="/korat-flow-engine/creador" replace />} />
            <Route path="/progreso" element={<Navigate to="/korat-flow-engine/progreso" replace />} />
          </Routes>
        </div>

        <InstallBanner />
      </div>
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <SaaSProvider>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </SaaSProvider>
    </DataProvider>
  );
}

export default App;
