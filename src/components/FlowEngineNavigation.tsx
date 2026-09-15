import { NavLink, useNavigate } from 'react-router-dom';
import { useSaaS } from '../context/SaaSContext';

interface FlowEngineNavigationProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ENGINE_NAV_ITEMS = [
  {
    to: '/korat-flow-engine',
    label: 'Inicio',
    emoji: '🏠',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  {
    to: '/korat-flow-engine/software',
    label: 'Software',
    emoji: '💻',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    )
  },
  {
    to: '/korat-flow-engine/tiktok',
    label: 'Contenido',
    emoji: '📱',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
      </svg>
    )
  },
  {
    to: '/korat-flow-engine/ventas',
    label: 'Ventas',
    emoji: '📈',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    )
  }
];

export default function FlowEngineNavigation({
  collapsed = false,
  onToggleCollapse
}: FlowEngineNavigationProps) {
  const navigate = useNavigate();
  const { founderStats, currentProject } = useSaaS();
  const level = founderStats?.founder_level || 1;
  const currentXP = founderStats?.founder_xp || 0;
  const xpThresholds: Record<number, number> = { 1: 500, 2: 1200, 3: 2500, 4: 5000, 5: 7500, 6: 12000, 7: 15000 };
  const targetXP = xpThresholds[level] || 500;
  const prevXP = xpThresholds[level - 1] || 0;
  const xpPct = Math.min(Math.round(((currentXP - prevXP) / (targetXP - prevXP)) * 100), 100);

  return (
    <>
      {/* ─── DESKTOP SIDEBAR (≥ 1024px) ─── */}
      <aside
        className="flow-engine-sidebar"
        style={{
          width: collapsed ? '72px' : '244px',
          minHeight: '100vh',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: collapsed ? '20px 12px' : '20px 14px',
          boxSizing: 'border-box',
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          flexShrink: 0,
          zIndex: 40
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

          {/* ── Brand Header ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            marginBottom: '20px',
            minHeight: '40px'
          }}>
            {!collapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0,
                  position: 'relative',
                  boxShadow: '0 2px 8px rgba(79,70,229,0.3)'
                }}>
                  🚀
                  <span style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    backgroundColor: '#10B981',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    border: '2px solid #FFFFFF'
                  }} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    Korat Flow
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-hint)', marginTop: '1px' }}>
                    {currentProject?.name || 'Solo SaaS Builder'}
                  </div>
                </div>
              </div>
            )}

            {collapsed && (
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', boxShadow: '0 2px 8px rgba(79,70,229,0.3)'
              }}>
                🚀
              </div>
            )}

            {onToggleCollapse && !collapsed && (
              <button
                onClick={onToggleCollapse}
                title="Colapsar Menú"
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  width: '26px', height: '26px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-hint)',
                  fontSize: '10px',
                  flexShrink: 0
                }}
              >
                ◀
              </button>
            )}
            {onToggleCollapse && collapsed && (
              <button
                onClick={onToggleCollapse}
                title="Expandir Menú"
                style={{
                  position: 'absolute',
                  top: '22px', right: '-14px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  width: '26px', height: '26px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-hint)',
                  fontSize: '10px',
                  boxShadow: 'var(--shadow-sm)',
                  zIndex: 10
                }}
              >
                ▶
              </button>
            )}
          </div>

          {/* ── XP Mini Bar (only when expanded) ── */}
          {!collapsed && (
            <div style={{
              backgroundColor: 'var(--bg-app)',
              borderRadius: '12px',
              padding: '10px 12px',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Nivel {level}</span>
                <span style={{ color: 'var(--indigo)', fontWeight: 800 }}>
                  {currentXP.toLocaleString('es-ES')} XP
                </span>
              </div>
              <div className="kf-progress-track">
                <div className="kf-progress-fill kf-progress-indigo" style={{ width: `${xpPct}%` }} />
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-hint)', marginTop: '4px', textAlign: 'right' }}>
                {xpPct}% al Nivel {level + 1}
              </div>
            </div>
          )}

          {/* ── Nav Links ── */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {ENGINE_NAV_ITEMS.map(({ to, label, iconSvg }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/korat-flow-engine'}
                title={collapsed ? label : undefined}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '11px 0' : '10px 12px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  backgroundColor: isActive ? 'var(--indigo-light)' : 'transparent',
                  color: isActive ? 'var(--indigo)' : 'var(--text-muted)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13.5px',
                  transition: 'var(--transition)',
                  gap: '10px',
                  borderLeft: isActive && !collapsed ? '3px solid var(--indigo)' : '3px solid transparent'
                })}
              >
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {iconSvg}
                </div>
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}

            {/* Productividad (Korat Life) */}
            <NavLink
              to="/korat-flow-engine/hoy"
              title={collapsed ? 'Productividad (Hoy)' : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '11px 0' : '10px 12px',
                borderRadius: '12px',
                textDecoration: 'none',
                backgroundColor: isActive ? '#E8F5E9' : 'transparent',
                color: isActive ? '#1b5e20' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13.5px',
                transition: 'var(--transition)',
                gap: '10px',
                borderLeft: isActive && !collapsed ? '3px solid #2e7d32' : '3px solid transparent'
              })}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {!collapsed && <span>Productividad (Hoy)</span>}
            </NavLink>

            {/* Ajustes */}
            <NavLink
              to="/korat-flow-engine/ajustes"
              title={collapsed ? 'Ajustes' : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '11px 0' : '10px 12px',
                borderRadius: '12px',
                textDecoration: 'none',
                backgroundColor: isActive ? 'var(--indigo-light)' : 'transparent',
                color: isActive ? 'var(--indigo)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13.5px',
                transition: 'var(--transition)',
                gap: '10px',
                borderLeft: isActive && !collapsed ? '3px solid var(--indigo)' : '3px solid transparent'
              })}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              {!collapsed && <span>Ajustes</span>}
            </NavLink>
          </nav>
        </div>

        {/* ── Sidebar Footer ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
          {!collapsed && (
            <div style={{
              fontSize: '11px',
              color: 'var(--text-hint)',
              textAlign: 'center',
              padding: '8px 0',
              borderTop: '1px solid var(--border)'
            }}>
              Korat Flow Engine v1.0
            </div>
          )}
          <button
            onClick={() => navigate('/')}
            title="Hub de Apps"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '8px',
              padding: collapsed ? '10px 0' : '9px 12px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-muted)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            <span>←</span>
            {!collapsed && <span>Hub de Apps</span>}
          </button>
        </div>
      </aside>

      {/* ─── MOBILE BOTTOM BAR (< 1024px) ─── */}
      <div
        className="flow-engine-bottom-bar"
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 100,
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)'
        }}
      >
        <div style={{ padding: '0 12px 4px', maxWidth: '440px', margin: '0 auto' }}>
          <nav style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.10)',
            border: '1px solid var(--border)',
            padding: '8px 8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '2px',
            alignItems: 'center'
          }}>
            {ENGINE_NAV_ITEMS.map(({ to, label, iconSvg }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/korat-flow-engine'}
                style={({ isActive }) => ({
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 4px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  backgroundColor: isActive ? 'var(--indigo-light)' : 'transparent',
                  color: isActive ? 'var(--indigo)' : 'var(--text-hint)',
                  transition: 'var(--transition)',
                  gap: '3px'
                })}
              >
                {({ isActive }) => (
                  <>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isActive ? 'var(--indigo)' : 'var(--text-hint)'
                    }}>
                      {iconSvg}
                    </div>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: isActive ? 800 : 500,
                      lineHeight: 1
                    }}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}

            {/* Hoy (Productividad) en bottom bar */}
            <NavLink
              to="/korat-flow-engine/hoy"
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 4px',
                borderRadius: '12px',
                textDecoration: 'none',
                backgroundColor: isActive ? '#E8F5E9' : 'transparent',
                color: isActive ? '#1b5e20' : 'var(--text-hint)',
                transition: 'var(--transition)',
                gap: '3px'
              })}
            >
              {({ isActive }) => (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span style={{ fontSize: '9.5px', fontWeight: isActive ? 800 : 500, lineHeight: 1 }}>
                    Hoy
                  </span>
                </>
              )}
            </NavLink>

            {/* Ajustes en bottom bar */}
            <NavLink
              to="/korat-flow-engine/ajustes"
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 4px',
                borderRadius: '12px',
                textDecoration: 'none',
                backgroundColor: isActive ? 'var(--indigo-light)' : 'transparent',
                color: isActive ? 'var(--indigo)' : 'var(--text-hint)',
                transition: 'var(--transition)',
                gap: '3px'
              })}
            >
              {({ isActive }) => (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  <span style={{ fontSize: '9.5px', fontWeight: isActive ? 800 : 500, lineHeight: 1 }}>
                    Ajustes
                  </span>
                </>
              )}
            </NavLink>
          </nav>
        </div>
      </div>
    </>
  );
}
