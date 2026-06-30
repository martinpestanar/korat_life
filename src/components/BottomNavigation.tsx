import { FiCompass, FiTarget, FiBarChart2, FiBookOpen, FiVideo } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', icon: FiCompass, label: 'Hoy' },
  { to: '/enfoque', icon: FiTarget, label: 'Enfoque' },
  { to: '/proyectos', icon: FiBookOpen, label: 'Proyectos' },
  { to: '/creador', icon: FiVideo, label: 'Creador' },
  { to: '/progreso', icon: FiBarChart2, label: 'Finanzas' },
];

export default function BottomNavigation() {
  return (
    <nav style={{
      position: 'fixed',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '398px',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(46, 111, 64, 0.15)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '12px 6px',
      borderRadius: '24px',
      boxShadow: '0 8px 30px rgba(29, 59, 45, 0.08)',
      zIndex: 1000,
      transition: 'all 0.3s ease'
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
            color: isActive ? 'var(--accent-green)' : 'var(--text-muted)',
            gap: '4px',
            flex: 1,
            padding: '4px 0',
            position: 'relative',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: '-4px',
                  width: '6px',
                  height: '6px',
                  backgroundColor: 'var(--accent-color)',
                  borderRadius: '50%',
                  boxShadow: '0 0 8px var(--accent-light)',
                  animation: 'fadeIn 0.2s ease-out'
                }} />
              )}
              <div style={{
                transform: isActive ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
                transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-sans)',
                fontWeight: isActive ? 600 : 500,
                letterSpacing: '0.3px',
                transition: 'all 0.25s ease'
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
