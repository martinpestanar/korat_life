import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/reto', icon: 'wb_twilight', label: 'Reto', isMaterial: true },
  { to: '/recreo', icon: 'sports_esports', label: 'Recreo', isMaterial: true },
  { to: '/', icon: 'timer', label: 'Hoy', isMaterial: true },
  { to: '/creador', icon: 'movie', label: 'Creador', isMaterial: true },
  { to: '/progreso', icon: 'finance_mode', label: 'Finanzas', isMaterial: true },
];

export default function BottomNavigation() {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      pointerEvents: 'none'
    }}>
      <div style={{
        padding: '0 16px 12px',
        maxWidth: '420px',
        margin: '0 auto',
        width: '100%'
      }}>
        <nav style={{
          pointerEvents: 'auto',
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '9999px',
          boxShadow: '0 16px 36px -8px rgba(26, 31, 27, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.8)',
          border: '1px solid rgba(46, 111, 64, 0.12)',
          padding: '4px 6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '48px',
                minHeight: '48px',
                flex: 1,
                textDecoration: 'none',
                color: isActive ? '#11562a' : '#404940',
                position: 'relative',
                transition: 'all 0.2s ease'
              })}
            >
              {({ isActive }) => (
                <>
                  <div style={{
                    width: '38px',
                    height: '28px',
                    borderRadius: '9999px',
                    backgroundColor: isActive ? 'rgba(46, 111, 64, 0.12)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    fontSize: '18px'
                  }}>
                    {icon === 'wb_twilight' && '🌅'}
                    {icon === 'sports_esports' && '🎮'}
                    {icon === 'timer' && '⏱️'}
                    {icon === 'movie' && '🎬'}
                    {icon === 'finance_mode' && '📈'}
                  </div>
                  <span style={{
                    fontSize: '10.5px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: '0.02em',
                    marginTop: '2px',
                    lineHeight: 1
                  }}>
                    {label}
                  </span>
                  {isActive && (
                    <span style={{
                      position: 'absolute',
                      bottom: '2px',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: '#11562a'
                    }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
