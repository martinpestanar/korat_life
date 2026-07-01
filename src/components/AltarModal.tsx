import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiLock, FiUnlock, FiHeart, FiX, FiRefreshCw, FiZap, FiEdit3, FiCheck } from 'react-icons/fi';

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

const DEFAULT_DECLARATION = `«Hoy, 1 de julio de 2026, me comprometo solemnemente a cuidar mi cuerpo y a hacer ejercicio diariamente, porque me amo y valoro mi templo.

En segundo lugar, dedicaré mi tiempo con amor a mi proyecto: mi primer negocio de SaaS Plant-Based, entregándolo a esta industria que tanto deseo ver prosperar. Quiero ayudar de corazón a este sector, e incluso si al principio lo hago de forma gratuita, estaré profundamente agradecido si en el futuro esto me permite generar ingresos.

Asimismo, elijo dejar atrás las compulsiones que dañan mi cuerpo y desgastan mi energía, como la pornografía, la masturbación y el jugar League of Legends en soledad. Decido vivir día a día con el objetivo real de sentirme bien, alegre, en paz y lleno de amor desde mi interior.

No permitiré que los deseos externos ni las exigencias sociales nublen mi camino o me generen ansiedad y temor. Elijo que este cuerpo y mi consciencia trabajen en perfecta unión y amor para liderar esta corta vida, sin permitir que la mente tome el control. La mente es una hermosa herramienta y debe ser usada con amor para propósitos e ideales elevados. Mi verdadero propósito es fluir de manera libre e impredecible con este cuerpo, hacia donde nos lleve la aventura.»`;

export default function AltarModal({ isOpen, onClose }: AltarModalProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [currentQuote, setCurrentQuote] = useState('');
  const [isPressing, setIsPressing] = useState(false);

  // Estados para la edición
  const [declaration, setDeclaration] = useState(() => {
    const saved = localStorage.getItem('korat_pacto_declaration');
    return saved || DEFAULT_DECLARATION;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [canEdit, setCanEdit] = useState(true);

  // Verificar si la fecha actual es anterior al 1 de Julio de 2026 (límite: medianoche del 30 de junio)
  useEffect(() => {
    const checkEditWindow = () => {
      const now = new Date();
      // El límite es el 1 de Julio de 2026 a las 00:00:00
      const limit = new Date(2026, 6, 1, 0, 0, 0); // Mes 6 es Julio en JS (0-indexed)
      setCanEdit(now.getTime() < limit.getTime());
    };
    checkEditWindow();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsLocked(true);
      setUnlockProgress(0);
      setIsEditing(false);
      getRandomQuote();
    }
  }, [isOpen]);

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
          return prev + 5;
        });
      }, 50);
    } else {
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

  const handleSaveDeclaration = () => {
    localStorage.setItem('korat_pacto_declaration', declaration);
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(10, 42, 30, 0.45)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: '20px',
      animation: 'fadeIn 0.25s ease'
    }}>
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
        {/* Header */}
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
            /* VISTA DE BLOQUEO */
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

              {/* Botón interactivo candado */}
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
                  userSelect: 'none'
                }}
              >
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
            /* ALTAR DESBLOQUEADO */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: '24px'
            }}>
              
              <div style={{
                background: 'linear-gradient(135deg, #0A2A1E 0%, #05150F 100%)',
                borderRadius: '20px',
                padding: '24px 20px',
                border: '1.5px solid var(--accent-light)',
                boxShadow: '0 12px 35px rgba(10, 42, 30, 0.35)',
                maxHeight: '320px',
                overflowY: 'auto',
                position: 'relative'
              }}>
                {/* Bordes premium */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', width: '8px', height: '8px', borderTop: '1.5px solid var(--accent-light)', borderLeft: '1.5px solid var(--accent-light)', opacity: 0.7 }} />
                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', borderTop: '1.5px solid var(--accent-light)', borderRight: '1.5px solid var(--accent-light)', opacity: 0.7 }} />
                <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '8px', height: '8px', borderBottom: '1.5px solid var(--accent-light)', borderLeft: '1.5px solid var(--accent-light)', opacity: 0.7 }} />
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '8px', height: '8px', borderBottom: '1.5px solid var(--accent-light)', borderRight: '1.5px solid var(--accent-light)', opacity: 0.7 }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ width: '20px', height: '1px', backgroundColor: 'rgba(230, 176, 51, 0.4)' }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-light)', fontFamily: 'var(--font-sans)' }}>
                    Pacto de Vida y Propósito
                  </span>
                  {canEdit ? (
                    isEditing ? (
                      <button 
                        onClick={handleSaveDeclaration}
                        style={{ background: 'none', border: 'none', color: '#2ECC71', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700 }}
                        title="Guardar pacto"
                      >
                        <FiCheck size={14} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsEditing(true)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700 }}
                        title="Editar pacto (Disponible hasta medianoche)"
                      >
                        <FiEdit3 size={14} />
                      </button>
                    )
                  ) : (
                    <div style={{ width: '20px', height: '1px', backgroundColor: 'rgba(230, 176, 51, 0.4)' }} />
                  )}
                </div>

                {isEditing ? (
                  <textarea
                    value={declaration}
                    onChange={(e) => setDeclaration(e.target.value)}
                    style={{
                      width: '100%',
                      height: '220px',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(230, 176, 51, 0.3)',
                      borderRadius: '10px',
                      color: '#F8F6F0',
                      fontFamily: 'var(--font-serif)',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      padding: '12px',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                ) : (
                  <p style={{
                    fontSize: '13.5px',
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    lineHeight: 1.7,
                    color: '#F8F6F0',
                    textAlign: 'justify',
                    letterSpacing: '0.2px',
                    margin: 0,
                    opacity: 0.95,
                    whiteSpace: 'pre-line'
                  }}>
                    {declaration}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', opacity: 0.8 }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-serif)', color: 'var(--accent-light)', fontStyle: 'italic', borderTop: '0.5px solid rgba(230, 176, 51, 0.2)', paddingTop: '6px', width: '140px', textAlign: 'center', letterSpacing: '1px' }}>
                    Consciencia y Presencia
                  </div>
                </div>
              </div>

              {/* Frase de aliento */}
              <div 
                className="quote-container"
                key={currentQuote}
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
                
                <p style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', fontWeight: 600, lineHeight: 1.45, color: 'var(--text-main)', margin: 0 }}>
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
                >
                  <FiRefreshCw size={11} />
                  <span>Quiero más aliento</span>
                </button>
              </div>

              {/* Volver a bloquear */}
              <button
                onClick={() => {
                  setIsLocked(true);
                  setUnlockProgress(0);
                  setIsEditing(false);
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
    </div>,
    document.body
  );
}
