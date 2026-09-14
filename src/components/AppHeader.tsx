import { useState } from 'react';
import { useSaaS } from '../context/SaaSContext';

interface AppHeaderProps {
  sectionTitle?: string;
  avatarUrl?: string;
  hasNotification?: boolean;
}

export default function AppHeader({
  sectionTitle = 'Hoy',
  hasNotification = true
}: AppHeaderProps) {
  const { currentProject, allProjects, setCurrentSlug } = useSaaS();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      backgroundColor: 'rgba(246, 251, 244, 0.9)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 4px 20px -4px rgba(24, 29, 25, 0.05)',
      borderBottom: '1px solid rgba(46, 111, 64, 0.08)',
      paddingTop: 'env(safe-area-inset-top, 0px)'
    }}>
      <div style={{
        height: '64px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '430px',
        margin: '0 auto',
        position: 'relative'
      }}>
        {/* Logo & Section Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#11562a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#aaefb4',
            fontFamily: 'var(--font-serif)',
            fontSize: '17px',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(17, 86, 42, 0.25)'
          }}>
            K
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '17px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#11562a',
              lineHeight: 1
            }}>
              Korat Life
            </span>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '9.5px',
              fontWeight: 700,
              color: '#404940',
              opacity: 0.8,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              lineHeight: 1,
              marginTop: '2px'
            }}>
              {sectionTitle}
            </span>
          </div>
        </div>

        {/* Multi-SaaS Switcher & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          
          {/* Multi-SaaS Selector Pill */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid rgba(17, 86, 42, 0.18)',
                borderRadius: '16px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                fontSize: '11px',
                fontWeight: 700,
                color: '#11562a',
                fontFamily: 'var(--font-sans)'
              }}
              title="Cambiar Producto SaaS"
            >
              <span style={{ fontSize: '14px' }}>{currentProject?.icon || '🚀'}</span>
              <span style={{
                maxWidth: '85px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {currentProject?.name || 'SaaS'}
              </span>
              <span style={{ fontSize: '9px', opacity: 0.7 }}>▾</span>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid rgba(17, 86, 42, 0.15)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                  padding: '6px',
                  width: '180px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: '#687C72',
                  textTransform: 'uppercase',
                  padding: '4px 8px',
                  letterSpacing: '0.04em'
                }}>
                  Productos Activos
                </div>
                {allProjects.map((p) => {
                  const isSelected = p.slug === currentProject?.slug;
                  return (
                    <button
                      key={p.slug}
                      onClick={() => {
                        setCurrentSlug(p.slug);
                        setDropdownOpen(false);
                      }}
                      style={{
                        backgroundColor: isSelected ? 'rgba(17, 86, 42, 0.08)' : 'transparent',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        fontFamily: 'var(--font-sans)'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{p.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: isSelected ? '#11562a' : '#0A2A1E',
                          lineHeight: 1.2
                        }}>
                          {p.name}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          color: '#687C72',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {p.niche}
                        </div>
                      </div>
                      {isSelected && (
                        <span style={{ fontSize: '12px', color: '#11562a', fontWeight: 'bold' }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Hub/Lab button */}
          <a
            href="/"
            title="Ir a Korat Lab (Hub)"
            style={{
              textDecoration: 'none',
              backgroundColor: 'rgba(17, 86, 42, 0.08)',
              color: '#11562a',
              padding: '5px 9px',
              borderRadius: '16px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid rgba(17, 86, 42, 0.15)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🧪</span>
            <span>Hub</span>
          </a>

          {/* User Profile Avatar with indicator */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#11562a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(17,86,42,0.25)',
              color: '#ffffff'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            {hasNotification && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                backgroundColor: '#9a442d',
                border: '2px solid #f6fbf4'
              }} />
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
