import { FiCompass, FiTarget, FiBarChart2, FiBookOpen } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', icon: FiCompass, label: 'Hoy' },
  { to: '/enfoque', icon: FiTarget, label: 'Enfoque' },
  { to: '/proyectos', icon: FiBookOpen, label: 'Proyectos' },
  { to: '/progreso', icon: FiBarChart2, label: 'Finanzas' },
];

export default function BottomNavigation() {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      width: '100%',
      maxWidth: '430px',
      backgroundColor: 'var(--bg-app)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '10px 0 calc(10px + env(safe-area-inset-bottom))',
      zIndex: 1000
    }}>
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
            gap: '4px',
            flex: 1,
            padding: '4px 0',
            position: 'relative',
            transition: 'color 0.2s ease'
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '32px',
                  height: '2px',
                  backgroundColor: 'var(--accent-color)',
                  borderRadius: '0 0 2px 2px',
                  transition: 'all 0.2s ease'
                }} />
              )}
              <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-sans)',
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.5px'
              }}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
