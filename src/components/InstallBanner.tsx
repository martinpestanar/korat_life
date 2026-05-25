import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Only show on mobile browsers, not in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;

    if (isStandalone) return;

    const ua = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const ios = /iPhone|iPad|iPod/i.test(ua);

    if (isMobile) {
      setIsIOS(ios);
      // Show after 3s delay so it doesn't interrupt first load
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '76px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 40px)',
      maxWidth: '390px',
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '16px',
      padding: '16px 20px',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-color)', fontFamily: 'var(--font-serif)', fontSize: '18px'
          }}>
            ✦
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              Instalar Korat Life
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Acceso instantáneo desde tu inicio
            </p>
          </div>
        </div>
        <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
          <FiX size={18} />
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
        {isIOS ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
            En Safari, toca el botón <strong>Compartir</strong> ↑ y luego <strong>"Agregar a pantalla de inicio"</strong>.
          </p>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
            En Chrome, toca el menú <strong>⋮</strong> y luego <strong>"Agregar a pantalla de inicio"</strong>.
          </p>
        )}
      </div>
    </div>
  );
}
