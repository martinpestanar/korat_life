import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Colores exactos del sistema Stitch de Google
const C = {
  surface: '#f6fbf4',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f5ee',
  surfaceContainer: '#ebefe8',
  surfaceContainerHigh: '#e5e9e3',
  surfaceContainerHighest: '#dfe4dd',
  surfaceVariant: '#dfe4dd',
  primary: '#11562a',
  primaryContainer: '#2e6f40',
  onPrimary: '#ffffff',
  onSurface: '#181d19',
  onSurfaceVariant: '#404940',
  secondary: '#9a442d',
  secondaryContainer: '#fc9174',
  secondaryFixed: '#ffdbd2',
  tertiary: '#67431b',
  tertiaryFixed: '#ffdcbd',
  outline: '#70796f',
  outlineVariant: '#c0c9bd',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
};

export default function GimnasiaMentalView() {
  const [currentXp, setCurrentXp] = useState(120);
  const maxXp = 140;
  const [streakDays, setStreakDays] = useState(6);
  const [activeCategory, setActiveCategory] = useState<'todas' | 'profesion' | 'calculo' | 'logica' | 'jefe_final'>('todas');

  // Estados interactivos para cada tarjeta de Stitch
  const [m1Revealed, setM1Revealed] = useState(false);
  const [m1Completed, setM1Completed] = useState(false);

  const [m2Selected, setM2Selected] = useState<number | null>(null);
  const [m2Feedback, setM2Feedback] = useState(false);
  const [m2Completed, setM2Completed] = useState(false);

  const [m3Selected, setM3Selected] = useState<'A' | 'B' | null>(null);
  const [m3Feedback, setM3Feedback] = useState(false);
  const [m3Completed, setM3Completed] = useState(false);

  const [bossRevealed, setBossRevealed] = useState(false);
  const [bossCompleted, setBossCompleted] = useState(false);

  // Modo Sesión Interactiva 3 Minutos (Duolingo Style)
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [sessionStep, setSessionStep] = useState(0);
  const [sessionSuccess, setSessionSuccess] = useState(false);

  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const cardBossRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data } = await supabase.from('mental_gym_progress').select('*').limit(1).maybeSingle();
      if (data) {
        if (data.current_xp) setCurrentXp(data.current_xp);
        if (data.streak_days) setStreakDays(data.streak_days);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2600);
  };

  const addXp = async (amount: number) => {
    const next = Math.min(maxXp, currentXp + amount);
    setCurrentXp(next);
    triggerToast(`+${amount} XP ganados 🌟`);
    try {
      await supabase.from('mental_gym_progress').upsert({
        current_xp: next,
        current_level: 1,
        streak_days: streakDays
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleM2Option = (opt: number, isCorrect: boolean) => {
    setM2Selected(opt);
    if (isCorrect) {
      setM2Feedback(true);
      if (!m2Completed) {
        setM2Completed(true);
        addXp(10);
      }
    } else {
      setTimeout(() => {
        setM2Selected(null);
      }, 1000);
    }
  };

  const handleM3Option = (opt: 'A' | 'B', isCorrect: boolean) => {
    setM3Selected(opt);
    if (isCorrect) {
      setM3Feedback(true);
    } else {
      setTimeout(() => {
        setM3Selected(null);
      }, 1000);
    }
  };

  const startSessionModal = () => {
    setSessionStep(0);
    setSessionSuccess(false);
    setIsSessionOpen(true);
  };

  const xpPercent = Math.min(100, Math.round((currentXp / maxXp) * 100));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.surface, fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative' }}>

      {/* Toast Notification */}
      <div style={{
        position: 'fixed',
        top: '72px',
        left: '50%',
        transform: `translateX(-50%) translateY(${showToast ? 0 : -20}px)`,
        opacity: showToast ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'none',
        zIndex: 100,
        backgroundColor: 'rgba(226,230,224,0.95)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '12px 16px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: '360px',
        width: 'calc(100% - 32px)',
      }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontSize: 14 }}>✓</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.onSurface }}>{toastMsg}</span>
      </div>

      {/* ====== MODAL INTERACTIVO DE SESIÓN RÁPIDA (3 MINUTOS) ====== */}
      {isSessionOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(24, 29, 25, 0.82)',
          backdropFilter: 'blur(16px)',
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: C.surfaceContainerLowest,
            borderRadius: 24,
            padding: 24,
            maxWidth: 390,
            width: '100%',
            boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'relative'
          }}>
            {!sessionSuccess ? (
              <>
                {/* Header Modal */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <button
                    onClick={() => setIsSessionOpen(false)}
                    style={{ background: 'none', border: 'none', fontSize: 18, color: C.onSurfaceVariant, cursor: 'pointer', padding: 4 }}
                  >
                    ✕
                  </button>
                  <div style={{ flex: 1, height: 8, backgroundColor: C.surfaceContainerHigh, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${((sessionStep + 1) / 3) * 100}%`,
                      backgroundColor: C.primary,
                      borderRadius: 999,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>
                    {sessionStep + 1}/3
                  </span>
                </div>

                {/* Paso 1: WhatsApp Header */}
                {sessionStep === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        📱 PROFESIÓN · PASO 1
                      </span>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: C.onSurface, margin: '4px 0 0', lineHeight: 1.35 }}>
                        ¿Cuál es el header HTTP requerido para autenticar con WhatsApp Cloud API en Meta?
                      </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { text: 'Authorization: Bearer <TOKEN>', correct: true },
                        { text: 'X-API-Key: <TOKEN>', correct: false },
                        { text: 'Authentication: Basic <TOKEN>', correct: false },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (item.correct) {
                              addXp(10);
                              setM1Completed(true);
                              setSessionStep(1);
                            } else {
                              triggerToast('Incorrecto, prueba de nuevo');
                            }
                          }}
                          style={{
                            textAlign: 'left',
                            padding: '12px 14px',
                            borderRadius: 12,
                            border: 'none',
                            backgroundColor: C.surfaceContainerHigh,
                            color: C.onSurface,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          {item.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paso 2: Cálculo Rápido */}
                {sessionStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        🔢 CÁLCULO RÁPIDO · PASO 2
                      </span>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: C.onSurface, margin: '4px 0 0', lineHeight: 1.35 }}>
                        Si cobras un Retainer de $1,200 USD y dedicas 15 horas al mes, ¿cuál es tu tarifa horaria efectiva?
                      </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {[
                        { label: '$60/h', correct: false },
                        { label: '$80/h', correct: true },
                        { label: '$95/h', correct: false },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (item.correct) {
                              addXp(10);
                              setM2Completed(true);
                              setSessionStep(2);
                            } else {
                              triggerToast('Calcula: $1,200 ÷ 15 = ?');
                            }
                          }}
                          style={{
                            padding: '14px 8px',
                            borderRadius: 12,
                            border: 'none',
                            backgroundColor: C.surfaceContainerHigh,
                            color: C.onSurface,
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paso 3: Lógica Stripe */}
                {sessionStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: C.tertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        🧠 LÓGICA CRM · PASO 3
                      </span>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: C.onSurface, margin: '4px 0 0', lineHeight: 1.35 }}>
                        En un webhook de Stripe (customer.subscription.deleted), ¿qué acción debe ejecutar tu backend?
                      </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { text: 'A) Eliminar al usuario inmediatamente de la base de datos.', correct: false },
                        { text: 'B) Revocar permisos, marcar "churned" y disparar encuesta de salida.', correct: true },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (item.correct) {
                              addXp(10);
                              setM3Completed(true);
                              setSessionSuccess(true);
                            } else {
                              triggerToast('¡No elimines datos! Recuerda preservar historiales.');
                            }
                          }}
                          style={{
                            textAlign: 'left',
                            padding: '12px 14px',
                            borderRadius: 12,
                            border: 'none',
                            backgroundColor: C.surfaceContainerHigh,
                            color: C.onSurface,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            lineHeight: 1.35
                          }}
                        >
                          {item.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Pantalla de Victoria de la Sesión */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, padding: '10px 0' }}>
                <span style={{ fontSize: 52 }}>🏆</span>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: C.onSurface, margin: 0, fontFamily: "'Playfair Display', serif" }}>
                    ¡Entrenamiento Completado!
                  </h2>
                  <p style={{ fontSize: 13, color: C.onSurfaceVariant, margin: '4px 0 0' }}>
                    Agilidad mental al día. Tu racha y XP están asegurados.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                  <div style={{ flex: 1, padding: 12, borderRadius: 14, backgroundColor: C.surfaceContainerLow }}>
                    <span style={{ fontSize: 10, color: C.onSurfaceVariant, fontWeight: 700, textTransform: 'uppercase' }}>XP Ganados</span>
                    <strong style={{ display: 'block', fontSize: 20, color: C.primary, marginTop: 2 }}>+30 XP</strong>
                  </div>
                  <div style={{ flex: 1, padding: 12, borderRadius: 14, backgroundColor: C.surfaceContainerLow }}>
                    <span style={{ fontSize: 10, color: C.onSurfaceVariant, fontWeight: 700, textTransform: 'uppercase' }}>Racha Activa</span>
                    <strong style={{ display: 'block', fontSize: 20, color: C.secondary, marginTop: 2 }}>🔥 {streakDays} días</strong>
                  </div>
                </div>

                <button
                  onClick={() => setIsSessionOpen(false)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 999,
                    backgroundColor: C.primary,
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    marginTop: 6
                  }}
                >
                  Continuar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== CONTENEDOR PRINCIPAL ====== */}
      <div style={{ padding: '16px 20px 120px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: 430, margin: '0 auto' }}>

        {/* ====== 1. GAMIFIED STATUS HEADER CARD (Stitch Exact Replica) ====== */}
        <section style={{
          backgroundColor: C.surfaceContainerLow,
          borderRadius: 16,
          padding: '16px',
          boxShadow: '0 4px 16px rgba(17,86,42,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26, lineHeight: 1 }}>🌰</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em' }}>NIVEL ACTIVO</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.onSurface, lineHeight: 1.25 }}>Nivel 1: Semilla — Cimientos</span>
              </div>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              backgroundColor: '#dfe4dd',
              padding: '4px 10px',
              borderRadius: 999,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}>
              <span style={{ fontSize: 13 }}>🔥</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: C.secondary }}>{streakDays} días</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: C.onSurfaceVariant, fontWeight: 500 }}>Progreso a Nivel 2</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.primary }}>{currentXp} / {maxXp} XP</span>
                <span style={{ fontSize: 13 }}>🎖️</span>
              </div>
            </div>

            <div style={{ width: '100%', height: 10, backgroundColor: C.surfaceVariant, borderRadius: 999, overflow: 'hidden', padding: 1 }}>
              <div style={{
                height: '100%',
                width: `${xpPercent}%`,
                backgroundColor: C.primaryContainer,
                borderRadius: 999,
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }} />
            </div>
          </div>

          {/* Motivational banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(223,228,221,0.55)',
            padding: '8px 12px',
            borderRadius: 10,
            marginTop: 2
          }}>
            <span style={{ fontSize: 16 }}>🧠</span>
            <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: 0, lineHeight: 1.35 }}>
              ¡Gimnasia mental al día! Tu agilidad cognitiva está en el top 8%.
            </p>
          </div>
        </section>

        {/* ====== 2. CATEGORY FILTER PILLS ====== */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {[
            { id: 'todas', label: 'Todas', count: 4 },
            { id: 'profesion', label: '📱 Profesión' },
            { id: 'calculo', label: '🔢 Cálculo Rápido' },
            { id: 'logica', label: '🧠 Lógica CRM' },
            { id: 'jefe_final', label: '👑 Jefe de Nivel' },
          ].map(cat => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: 'none',
                  backgroundColor: active ? C.primary : C.surfaceContainerHigh,
                  color: active ? C.onPrimary : C.onSurfaceVariant,
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  boxShadow: active ? '0 2px 6px rgba(17,86,42,0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{cat.label}</span>
                {cat.count !== undefined && (
                  <span style={{
                    backgroundColor: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                    color: active ? '#fff' : C.onSurfaceVariant,
                    padding: '1px 6px',
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700
                  }}>{cat.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ====== 3. THE TREE PATH / ÁRBOL DEL CAMINO (Stitch Replica) ====== */}
        <section style={{
          backgroundColor: C.surfaceContainerLow,
          borderRadius: 16,
          padding: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: C.primary, fontSize: 16, fontWeight: 700 }}>🌱</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.onSurface }}>El Árbol del Camino</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em' }}>MUNDO 1</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, paddingTop: 4 }}>
            {/* Nodo 1: Semilla */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 3 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: C.primary,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 2px 8px rgba(17,86,42,0.25)'
              }}>
                <span style={{ fontSize: 18 }}>🌰</span>
                <span style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: C.secondary,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 800
                }}>✓</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.onSurface }}>Semilla</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.primary }}>85%</span>
            </div>

            {/* Nodo 2: Brote */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 3, opacity: 0.85 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: C.surfaceContainerHighest,
                color: C.onSurfaceVariant,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <span style={{ fontSize: 18, filter: 'grayscale(0.6)' }}>🌱</span>
                <span style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: C.surfaceVariant,
                  color: C.onSurfaceVariant,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8
                }}>🔒</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: C.onSurfaceVariant }}>Brote</span>
              <span style={{ fontSize: 10, color: C.onSurfaceVariant }}>140 XP</span>
            </div>

            {/* Nodo 3: Raíces */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 3, opacity: 0.55 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: C.surfaceContainerHighest,
                color: C.onSurfaceVariant,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <span style={{ fontSize: 18, filter: 'grayscale(0.8)' }}>🌿</span>
                <span style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: C.surfaceVariant,
                  color: C.onSurfaceVariant,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8
                }}>🔒</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: C.onSurfaceVariant }}>Raíces</span>
              <span style={{ fontSize: 10, color: C.onSurfaceVariant }}>220 XP</span>
            </div>

            {/* Nodo 4: Maestría */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 3, opacity: 0.45 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: C.surfaceContainerHighest,
                color: C.tertiary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <span style={{ fontSize: 18, filter: 'grayscale(1)' }}>🌲</span>
                <span style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: C.surfaceVariant,
                  color: C.onSurfaceVariant,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8
                }}>🔒</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: C.onSurfaceVariant }}>Maestría</span>
              <span style={{ fontSize: 10, color: C.onSurfaceVariant }}>Nivel 7</span>
            </div>
          </div>
        </section>

        {/* ====== 4. MISSION CARDS (Stitch Exact Cards) ====== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* --- Mission 1: Profesión WhatsApp Cloud API --- */}
          {(activeCategory === 'todas' || activeCategory === 'profesion') && (
            <article
              ref={card1Ref}
              style={{
                backgroundColor: C.surfaceContainerLowest,
                borderRadius: 16,
                padding: 16,
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                position: 'relative',
                overflow: 'hidden',
                opacity: m1Completed ? 0.78 : 1
              }}
            >
              {m1Completed && (
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: C.primary,
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700
                }}>
                  <span>✓</span> Hecho
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 6,
                    backgroundColor: C.surfaceContainerHigh,
                    color: C.onSurfaceVariant,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    📱 PROFESIÓN
                  </span>
                  <span style={{ fontSize: 11, color: C.onSurfaceVariant }}>2 min</span>
                </div>

                {!m1Completed && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.primary,
                    backgroundColor: 'rgba(173,243,184,0.4)',
                    padding: '2px 8px',
                    borderRadius: 999
                  }}>
                    +10 XP
                  </span>
                )}
              </div>

              <p style={{ fontSize: 14, fontWeight: 700, color: C.onSurface, margin: 0, lineHeight: 1.35 }}>
                ¿Cuál es el encabezado HTTP requerido para autenticar con el API de WhatsApp Cloud en Meta Graph?
              </p>

              {m1Revealed && (
                <div style={{
                  backgroundColor: C.surfaceContainerLow,
                  borderRadius: 10,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: C.primary, fontSize: 16 }}>✓</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.onSurface }}>Respuesta Técnica:</span>
                      <code style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>Authorization: Bearer &lt;TOKEN&gt;</code>
                      <p style={{ fontSize: 11, color: C.onSurfaceVariant, margin: '4px 0 0', lineHeight: 1.4 }}>
                        Requiere los permisos de alcance <code style={{ color: C.onSurface }}>whatsapp_business_messaging</code> configurados en tu App de Meta Developers.
                      </p>
                    </div>
                  </div>

                  {!m1Completed && (
                    <button
                      onClick={() => { setM1Completed(true); addXp(10); }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 999,
                        backgroundColor: C.primary,
                        color: '#fff',
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        marginTop: 4,
                        boxShadow: '0 2px 6px rgba(17,86,42,0.2)'
                      }}
                    >
                      <span>🎖️</span>
                      <span>Marcar Entendido (+10 XP)</span>
                    </button>
                  )}
                </div>
              )}

              {!m1Revealed && (
                <button
                  onClick={() => setM1Revealed(true)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 999,
                    backgroundColor: C.surfaceContainerHigh,
                    color: C.onSurface,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <span>👁️</span>
                  <span>Ver Respuesta</span>
                </button>
              )}
            </article>
          )}

          {/* --- Mission 2: Cálculo Rápido --- */}
          {(activeCategory === 'todas' || activeCategory === 'calculo') && (
            <article
              ref={card2Ref}
              style={{
                backgroundColor: C.surfaceContainerLowest,
                borderRadius: 16,
                padding: 16,
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                position: 'relative',
                overflow: 'hidden',
                opacity: m2Completed ? 0.78 : 1
              }}
            >
              {m2Completed && (
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: C.primary,
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700
                }}>
                  <span>✓</span> Hecho
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 6,
                    backgroundColor: 'rgba(255,219,210,0.6)',
                    color: C.secondary,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    🔢 CÁLCULO RÁPIDO
                  </span>
                  <span style={{ fontSize: 11, color: C.onSurfaceVariant }}>1 min</span>
                </div>

                {!m2Completed && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.primary,
                    backgroundColor: 'rgba(173,243,184,0.4)',
                    padding: '2px 8px',
                    borderRadius: 999
                  }}>
                    +10 XP
                  </span>
                )}
              </div>

              <p style={{ fontSize: 14, fontWeight: 700, color: C.onSurface, margin: 0, lineHeight: 1.35 }}>
                Si cobras un Retainer de $1,200 USD y dedicas 15 horas al mes, ¿cuál es tu tarifa horaria efectiva?
              </p>

              {/* 3 Pill Options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, paddingTop: 2 }}>
                {[
                  { label: '$60/h', val: 60, correct: false },
                  { label: '$80/h', val: 80, correct: true },
                  { label: '$95/h', val: 95, correct: false },
                ].map((opt) => {
                  const isChosen = m2Selected === opt.val;
                  const isCorrectChosen = isChosen && opt.correct;
                  const isWrongChosen = isChosen && !opt.correct;

                  return (
                    <button
                      key={opt.val}
                      onClick={() => handleM2Option(opt.val, opt.correct)}
                      style={{
                        padding: '10px 4px',
                        borderRadius: 8,
                        border: 'none',
                        backgroundColor: isCorrectChosen ? C.primaryContainer : isWrongChosen ? C.error : C.surfaceContainerHigh,
                        color: isChosen ? '#fff' : C.onSurface,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {m2Feedback && (
                <div style={{
                  fontSize: 12,
                  color: C.onSurfaceVariant,
                  backgroundColor: C.surfaceContainerLow,
                  padding: '8px 10px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ color: C.primary, fontSize: 14 }}>✓</span>
                  <span>¡Exacto! $1,200 ÷ 15 = $80 USD/hora neta.</span>
                </div>
              )}
            </article>
          )}

          {/* --- Mission 3: Lógica CRM --- */}
          {(activeCategory === 'todas' || activeCategory === 'logica') && (
            <article
              ref={card3Ref}
              style={{
                backgroundColor: C.surfaceContainerLowest,
                borderRadius: 16,
                padding: 16,
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                position: 'relative',
                overflow: 'hidden',
                opacity: m3Completed ? 0.78 : 1
              }}
            >
              {m3Completed && (
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: C.primary,
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700
                }}>
                  <span>✓</span> Hecho
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 6,
                    backgroundColor: 'rgba(255,220,189,0.6)',
                    color: C.tertiary,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    🧠 LÓGICA CRM
                  </span>
                  <span style={{ fontSize: 11, color: C.onSurfaceVariant }}>2 min</span>
                </div>

                {!m3Completed && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.primary,
                    backgroundColor: 'rgba(173,243,184,0.4)',
                    padding: '2px 8px',
                    borderRadius: 999
                  }}>
                    +10 XP
                  </span>
                )}
              </div>

              <p style={{ fontSize: 14, fontWeight: 700, color: C.onSurface, margin: 0, lineHeight: 1.35 }}>
                En un webhook de Stripe (<code style={{ color: C.secondary, fontSize: 12, fontWeight: 700 }}>customer.subscription.deleted</code>), ¿qué acción debe ejecutar tu backend de inmediato?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => handleM3Option('A', false)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: m3Selected === 'A' ? C.error : C.surfaceContainerHigh,
                    color: m3Selected === 'A' ? '#fff' : C.onSurface,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    lineHeight: 1.35
                  }}
                >
                  A) Eliminar inmediatamente al usuario de la base de datos PostgreSQL.
                </button>

                <button
                  onClick={() => handleM3Option('B', true)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: m3Selected === 'B' ? C.primaryContainer : C.surfaceContainerHigh,
                    color: m3Selected === 'B' ? '#fff' : C.onSurface,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    lineHeight: 1.35
                  }}
                >
                  B) Revocar permisos del workspace, marcar estado "churned" y disparar encuesta de salida.
                </button>
              </div>

              {m3Feedback && (
                <div style={{
                  fontSize: 12,
                  color: C.onSurfaceVariant,
                  backgroundColor: C.surfaceContainerLow,
                  padding: '8px 10px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: C.primary, fontSize: 14 }}>✓</span>
                    <span>¡Correcto! Preservar historiales y degradar permisos.</span>
                  </div>
                  {!m3Completed && (
                    <button
                      onClick={() => { setM3Completed(true); addXp(10); }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        backgroundColor: C.primary,
                        color: '#fff',
                        border: 'none',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Cobrar +10 XP
                    </button>
                  )}
                </div>
              )}
            </article>
          )}

          {/* --- Mission 4: JEFE DE NIVEL --- */}
          {(activeCategory === 'todas' || activeCategory === 'jefe_final') && (
            <article
              ref={cardBossRef}
              style={{
                backgroundColor: C.surfaceContainerLow,
                borderRadius: 16,
                padding: 16,
                boxShadow: '0 4px 16px rgba(154,68,45,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                position: 'relative',
                overflow: 'hidden',
                opacity: bossCompleted ? 0.78 : 1
              }}
            >
              {bossCompleted && (
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: C.secondary,
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700
                }}>
                  <span>✓</span> Completado
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 6,
                    backgroundColor: C.secondary,
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <span>⚔️</span> JEFE DE NIVEL
                  </span>
                  <span style={{ fontSize: 11, color: C.onSurfaceVariant }}>Arquitectura</span>
                </div>

                {!bossCompleted && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: C.secondary,
                    backgroundColor: 'rgba(252,145,116,0.4)',
                    padding: '2px 8px',
                    borderRadius: 999
                  }}>
                    +20 XP
                  </span>
                )}
              </div>

              <div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 600, color: C.onSurface, margin: 0, lineHeight: 1.25 }}>
                  Fallback Offline para POS
                </h3>
                <p style={{ fontSize: 13, color: C.onSurfaceVariant, margin: '4px 0 0', lineHeight: 1.4 }}>
                  Diseña la estrategia de resiliencia para el Punto de Venta de <i>Vegan Kitchen</i> cuando se pierde la conexión local con internet en pleno turno del mediodía.
                </p>
              </div>

              {bossRevealed && (
                <div style={{
                  backgroundColor: C.surfaceContainerLowest,
                  borderRadius: 10,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.onSurface }}>Arquitectura recomendada:</span>
                  <div style={{ fontSize: 12, color: C.onSurfaceVariant, display: 'flex', flexDirection: 'column', gap: 3, lineHeight: 1.4 }}>
                    <span>1. Almacenamiento transitorio en <b>IndexedDB</b> con UUID v4 cliente.</span>
                    <span>2. Cola de sincronización background con <b>Service Workers</b> y reintentos exponenciales.</span>
                    <span>3. Resolución optimista de stock con reconciliación en servidor al restaurar red.</span>
                  </div>

                  {!bossCompleted && (
                    <button
                      onClick={() => { setBossCompleted(true); addXp(20); }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 999,
                        backgroundColor: C.secondary,
                        color: '#fff',
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        marginTop: 4,
                        boxShadow: '0 2px 6px rgba(154,68,45,0.25)'
                      }}
                    >
                      <span>🎖️</span>
                      <span>Completar Desafío (+20 XP)</span>
                    </button>
                  )}
                </div>
              )}

              {!bossRevealed && (
                <button
                  onClick={() => setBossRevealed(true)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 999,
                    backgroundColor: C.surfaceContainerHighest,
                    color: C.onSurface,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <span>👁️</span>
                  <span>Revisar Criterios de Diseño</span>
                </button>
              )}
            </article>
          )}

        </div>

        {/* ====== 5. THUMB ZONE FLOATING WORKOUT BUTTON ====== */}
        <div style={{ position: 'sticky', bottom: 88, zIndex: 40, display: 'flex', justifyContent: 'center', padding: '0 8px' }}>
          <button
            onClick={startSessionModal}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 999,
              backgroundColor: C.primary,
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 8px 24px rgba(17,86,42,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'transform 0.15s ease'
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span style={{ fontSize: 18 }}>⚡</span>
            <span>Entrenar Rápido (Sesión 3 min)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
