import { useNavigate } from 'react-router-dom';

export default function KoratLabView() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8F6F0',
      color: '#0A2A1E',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Centered Launcher Container */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        
        {/* Minimalist Header / Brand */}
        <header style={{
          textAlign: 'center',
          marginBottom: '8px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '18px',
            backgroundColor: '#11562a',
            color: '#aaefb4',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-serif)',
            fontSize: '28px',
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(17, 86, 42, 0.18)',
            marginBottom: '16px'
          }}>
            K
          </div>
          <h1 style={{
            fontSize: '30px',
            fontWeight: 800,
            letterSpacing: '-0.7px',
            color: '#0A2A1E',
            margin: '0 0 6px 0'
          }}>
            Korat Hub
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#687C72',
            margin: 0,
            lineHeight: 1.4
          }}>
            Selecciona el entorno de trabajo al que deseas ingresar:
          </p>
        </header>

        {/* Portal Cards */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          
          {/* TARJETA 1: Korat Flow Engine */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1.5px solid rgba(17, 86, 42, 0.15)',
            padding: '24px 20px',
            boxShadow: '0 10px 30px rgba(10, 42, 30, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(17, 86, 42, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}>
                  ⚡
                </div>
                <div>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    margin: 0,
                    color: '#0A2A1E'
                  }}>
                    Korat Flow Engine
                  </h2>
                </div>
              </div>

              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#104D30',
                backgroundColor: 'rgba(16, 77, 48, 0.08)',
                padding: '4px 9px',
                borderRadius: '10px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                CENTRO OPERATIVO
              </span>
            </div>

            <p style={{
              fontSize: '13.5px',
              color: '#687C72',
              lineHeight: 1.45,
              margin: 0
            }}>
              Plataforma de control del fundador: Gamificación, 3 Pilares (Software, TikTok, Ventas) y gestión de proyectos.
            </p>

            <button
              onClick={() => navigate('/korat-flow-engine')}
              style={{
                width: '100%',
                backgroundColor: '#11562a',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 20px',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(17, 86, 42, 0.25)',
                transition: 'all 0.2s ease',
                marginTop: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0d4220';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#11562a';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>🚀</span>
              <span>Entrar a Korat Flow Engine</span>
            </button>
          </div>

          {/* TARJETA 2: Laboratorio / Sandbox */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1.5px solid rgba(212, 106, 67, 0.18)',
            padding: '24px 20px',
            boxShadow: '0 10px 30px rgba(10, 42, 30, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(212, 106, 67, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}>
                  🧪
                </div>
                <div>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    margin: 0,
                    color: '#0A2A1E'
                  }}>
                    Laboratorio / Sandbox
                  </h2>
                </div>
              </div>

              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#D46A43',
                backgroundColor: 'rgba(212, 106, 67, 0.1)',
                padding: '4px 9px',
                borderRadius: '10px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                PRUEBAS & EXPERIMENTOS
              </span>
            </div>

            <p style={{
              fontSize: '13.5px',
              color: '#687C72',
              lineHeight: 1.45,
              margin: 0
            }}>
              Entorno aislado para probar componentes, llamadas a APIs y snippets de código en sucio.
            </p>

            <button
              onClick={() => navigate('/lab')}
              style={{
                width: '100%',
                backgroundColor: '#D46A43',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 20px',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(212, 106, 67, 0.25)',
                transition: 'all 0.2s ease',
                marginTop: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#be5934';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#D46A43';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>🧪</span>
              <span>Abrir Laboratorio</span>
            </button>
          </div>

        </div>

        {/* Minimalist Footer */}
        <footer style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#687C72',
          opacity: 0.8,
          marginTop: '8px'
        }}>
          Korat Hub · Launcher v2.0 · Mobile-First & Desktop Optimized
        </footer>

      </div>
    </div>
  );
}
