import { useState, useEffect } from 'react';
import { FiLock, FiUnlock, FiHeart, FiX, FiRefreshCw, FiCompass, FiZap } from 'react-icons/fi';

interface AltarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CITAS_ALIENTO = [
  "Tu consciencia es la que lidera. La mente es solo tu herramienta; úsala con amor.",
  "El verdadero éxito es sentirte en paz, alegre y libre desde adentro, no complacer exigencias sociales.",
  "Hoy eliges cuidar tu cuerpo porque lo amas, no por obligación. Cada entrenamiento es un acto de amor propio.",
  "Tu SaaS Plant-Based es un regalo de amor para una industria que quieres ver prosperar. El dinero llegará como gratitud.",
  "Las compulsiones son ilusiones temporales que dañan tu templo. Tu paz interior es real y duradera.",
  "Fluye libre e impredecible con este cuerpo. La vida es una corta y hermosa aventura.",
  "Elige el camino del amor propio. Tu consciencia y tu cuerpo trabajan juntos en perfecta armonía.",
  "Si sientes ansiedad o temor, respira profundo y regresa a tu centro. Eres libre de los deseos externos.",
  "Cada día sin compulsiones es un día donde tú eres el líder de tu propia vida.",
  "Amas tu cuerpo, por eso lo nutres, lo ejercitas y lo proteges de lo que le hace daño.",
  "Tu negocio es un servicio al mundo. Hazlo con la pureza de tu corazón y la industria prosperará.",
  "No necesitas demostrarle nada a nadie afuera. Tu único compromiso es con tu paz interior."
];

export default function AltarModal({ isOpen, onClose }: AltarModalProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [currentQuote, setCurrentQuote] = useState('');
  const [isPressing, setIsPressing] = useState(false);

  useEffect(() => {
    // Escoger una cita inicial aleatoria
    if (isOpen) {
      setIsLocked(true);
      setUnlockProgress(0);
      getRandomQuote();
    }
  }, [isOpen]);

  // Manejar el progreso de desbloqueo al mantener presionado
  useEffect(() => {
    let interval: any;
    if (isPressing && isLocked) {
      interval = setInterval(() => {
        setUnlockProgress((prev) => {
          if (prev >= 100) {
            setIsLocked(false);
            setIsPressing(false);
            clearInterval(interval);
            return 100;
          }
          return prev + 5; // Aumenta 5% cada 50ms (1 segundo en total)
        });
      }, 50);
    } else {
      // Si deja de presionar y no está desbloqueado, va reduciendo el progreso
      interval = setInterval(() => {
        setUnlockProgress((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 8;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPressing, isLocked]);

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * CITAS_ALIENTO.length);
    setCurrentQuote(CITAS_ALIENTO[randomIndex]);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(10, 42, 30, 0.45)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px',
      animation: 'fadeIn 0.25s ease'
    }}>
      {/* Estilos locales para animaciones */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(212, 106, 67, 0.2)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 10px rgba(212, 106, 67, 0.5)); }
        }
        @keyframes pageFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .altar-content {
          animation: pageFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .quote-container {
          animation: pageFadeIn 0.4s ease forwards;
        }
      `}</style>

      <div 
        className="altar-content"
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid rgba(10, 42, 30, 0.08)',
          boxShadow: '0 20px 40px rgba(10, 42, 30, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header con botón cerrar */}
        <div style={{
          padding: '16px 20px 10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(10, 42, 30, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiHeart size={14} color="var(--accent-color)" />
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--text-muted)'
            }}>
              Altar de Consciencia
            </span>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          
          {isLocked ? (
            /* VISTA DE BLOQUEO CON EL CANDADO */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              padding: '20px 0',
              textAlign: 'center',
              gap: '24px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', color: 'var(--text-main)' }}>
                  Acceso al Altar
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4, padding: '0 16px' }}>
                  Mantén presionado el candado por 1 segundo para desbloquear tu compromiso y conectar con tu consciencia.
                </p>
              </div>

              {/* Botón de Candado Interactivo */}
              <div 
                onMouseDown={() => setIsPressing(true)}
                onMouseUp={() => setIsPressing(false)}
                onMouseLeave={() => setIsPressing(false)}
                onTouchStart={() => setIsPressing(true)}
                onTouchEnd={() => setIsPressing(false)}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-app)',
                  boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05), 0 4px 10px rgba(0,0,0,0.02)',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none'
                }}
              >
                {/* Círculo de progreso de desbloqueo SVG */}
                <svg style={{
                  position: 'absolute',
                  inset: 0,
                  transform: 'rotate(-90deg)',
                  width: '100px',
                  height: '100px'
                }}>
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="transparent"
                    stroke="rgba(10, 42, 30, 0.04)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="transparent"
                    stroke="var(--accent-color)"
                    strokeWidth="4"
                    strokeDasharray={276.4}
                    strokeDashoffset={276.4 - (276.4 * unlockProgress) / 100}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.05s ease' }}
                  />
                </svg>

                {/* Ícono de Candado con animación */}
                <div style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-color)',
                  boxShadow: '0 4px 12px rgba(212, 106, 67, 0.15)',
                  animation: isPressing ? 'none' : 'pulseGlow 2.5s ease-in-out infinite'
                }}>
                  <FiLock size={30} style={{ transform: isPressing ? 'scale(0.92)' : 'none', transition: 'transform 0.1s ease' }} />
                </div>
              </div>

              {/* Barra indicadora discreta */}
              <div style={{
                height: '4px',
                width: '60px',
                backgroundColor: 'rgba(0,0,0,0.05)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${unlockProgress}%`,
                  backgroundColor: 'var(--accent-color)',
                  transition: 'width 0.05s ease'
                }} />
              </div>
            </div>
          ) : (
            /* ALTAR DESBLOQUEADO - DECLARACIÓN Y CITAS */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: '20px'
            }}>
              
              {/* Bloque de Declaración Principal */}
              <div style={{
                backgroundColor: 'var(--bg-app)',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid rgba(10, 42, 30, 0.04)',
                maxHeight: '220px',
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <FiCompass size={13} color="var(--accent-green)" />
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                    Mi Declaración de Propósito
                  </span>
                </div>
                <p style={{
                  fontSize: '12.5px',
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                  color: 'var(--text-main)',
                  textAlign: 'justify'
                }}>
                  «Hoy, 29 de junio de 2026, me comprometo solemnemente a cuidar mi cuerpo y a hacer ejercicio diariamente, porque me amo y valoro mi templo. En segundo lugar, dedicaré mi tiempo con amor a mi proyecto: mi primer negocio de SaaS Plant-Based, entregándolo a esta industria que tanto deseo ver prosperar. Quiero ayudar de corazón a este sector, e incluso si al principio lo hago de forma gratuita, estaré profundamente agradecido si en el futuro esto me permite generar ingresos. Asimismo, elijo dejar atrás las compulsiones que dañan mi cuerpo y desgastan mi energía, como la pornografía, la masturbación y el jugar League of Legends en soledad. Decido vivir día a día con el objetivo real de sentirme bien, alegre, en paz y lleno de amor desde mi interior. No permitiré que los deseos externos ni las exigencias sociales nublen mi camino o me generen ansiedad y temor. Elijo que este cuerpo y mi consciencia trabajen en perfecta unión y amor para liderar esta corta vida, sin permitir que la mente tome el control. La mente es una hermosa herramienta y debe ser usada con amor para propósitos e ideales elevados. Mi verdadero propósito es fluir de manera libre e impredecible con este cuerpo, hacia donde nos lleve la aventura.»
                </p>
              </div>

              {/* Bloque de Cita de Aliento / Generador Aleatorio */}
              <div 
                className="quote-container"
                key={currentQuote} // Forza animación al cambiar cita
                style={{
                  backgroundColor: 'rgba(212, 106, 67, 0.03)',
                  border: '1px solid rgba(212, 106, 67, 0.08)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiZap size={13} color="var(--accent-light)" style={{ fill: 'rgba(230, 176, 51, 0.2)' }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-color)' }}>
                    Brisa de Aliento
                  </span>
                </div>
                
                <p style={{
                  fontSize: '14px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  lineHeight: 1.45,
                  color: 'var(--text-main)',
                  margin: 0
                }}>
                  "{currentQuote}"
                </p>

                <button
                  onClick={getRandomQuote}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease',
                    marginTop: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)'}
                >
                  <FiRefreshCw size={11} />
                  <span>Quiero más aliento</span>
                </button>
              </div>

              {/* Botón para volver a bloquear */}
              <button
                onClick={() => {
                  setIsLocked(true);
                  setUnlockProgress(0);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '4px',
                  opacity: 0.7
                }}
              >
                <FiUnlock size={11} />
                <span>Volver a proteger altar</span>
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
