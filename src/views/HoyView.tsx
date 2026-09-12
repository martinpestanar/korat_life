import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiTrash2, FiPlay, FiPause, FiRotateCcw, FiVolume2, FiVolumeX, FiCheck } from 'react-icons/fi';
import { type TimeBlock } from '../components/TimeBlockCard';
import BlockNotesModal from '../components/BlockNotesModal';
import BlockFormModal from '../components/BlockFormModal';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import ImmersionModal from '../components/ImmersionModal';
import AltarModal from '../components/AltarModal';
import GamingTracker from '../components/GamingTracker';
import StreakWidget from '../components/StreakWidget';
import AppHeader from '../components/AppHeader';
import { useData } from '../context/DataContext';

// ── Helpers ──
function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Buenos días';
  if (h >= 12 && h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getFormattedDate(): string {
  const now = new Date();
  const dayStr = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  return dayStr.charAt(0).toUpperCase() + dayStr.slice(1);
}

function getPeriod(block: TimeBlock): 'morning' | 'afternoon' | 'night' {
  if (block.period === 'morning' || block.period === 'afternoon' || block.period === 'night') {
    return block.period;
  }
  const hour = parseInt(block.start_time.split(':')[0], 10);
  if (hour < 12) return 'morning';
  if (hour < 19) return 'afternoon';
  return 'night';
}

export default function HoyView() {
  const {
    blocks,
    setBlocks,
    loadingHoy,
    refreshHoy: fetchBlocksAndChallenges
  } = useData();

  // Navigation segment state
  const [activeSegment, setActiveSegment] = useState<'time-blocks' | 'inmersion' | 'anti-ocio'>('time-blocks');

  // Modals & form state
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBlockForForm, setEditingBlockForForm] = useState<TimeBlock | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [blockIdToDelete, setBlockIdToDelete] = useState<string | null>(null);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const loading = loadingHoy && blocks.length === 0;
  const [immersionModalBlock, setImmersionModalBlock] = useState<TimeBlock | null>(null);
  const [isAltarOpen, setIsAltarOpen] = useState(false);

  // Energy closure check-in
  const [energyLevel, setEnergyLevel] = useState<'full' | 'bien' | 'regular' | 'bajo'>('bien');
  const [victoryNote, setVictoryNote] = useState('Deploy backend Stripe sin errores');
  const [isEditingVictory, setIsEditingVictory] = useState(false);

  // ── IN-TAB IMMERSION STATE ──
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'forest' | 'binaural'>('none');
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Anti-Ocio states
  const [antiOcioStats] = useState({
    socialFreeStreak: 5,
    gamingFreeDays: 12,
    allocatedHours: 2.0,
    usedHours: 1.5
  });

  useEffect(() => {
    fetchBlocksAndChallenges();
  }, []);

  // Timer tick for Inmersión tab
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setIsTimerRunning(false);
            if (soundEnabled) playZenChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timeLeft, soundEnabled]);

  const setTimerPreset = (mins: number) => {
    setTimerMinutes(mins);
    setTimeLeft(mins * 60);
    setIsTimerRunning(false);
  };

  const toggleTimer = () => {
    if (timeLeft === 0) setTimeLeft(timerMinutes * 60);
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(timerMinutes * 60);
  };

  const playZenChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playNote = (time: number, freq: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.3, time + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };
      const now = audioCtx.currentTime;
      playNote(now, 523.25, 1.5);
      playNote(now + 0.3, 659.25, 1.5);
      playNote(now + 0.6, 783.99, 2.0);
    } catch (e) {
      console.error(e);
    }
  };

  // Determine current active block based on clock
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  const currentActiveBlock = blocks.find(b => {
    const [startH, startM] = b.start_time.split(':').map(Number);
    const [endH, endM] = b.end_time.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    return currentMins >= startMins && currentMins < endMins;
  }) || (blocks.length > 0 ? blocks[0] : null);

  // Calculate remaining time for active block
  let remainingTimeLabel = '1h 15m';
  let activeBlockProgressPct = 64;
  if (currentActiveBlock) {
    const [startH, startM] = currentActiveBlock.start_time.split(':').map(Number);
    const [endH, endM] = currentActiveBlock.end_time.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    const totalDuration = Math.max(1, endMins - startMins);
    const elapsed = Math.max(0, Math.min(totalDuration, currentMins - startMins));
    activeBlockProgressPct = Math.round((elapsed / totalDuration) * 100);
    const leftMins = Math.max(0, endMins - currentMins);
    const h = Math.floor(leftMins / 60);
    const m = leftMins % 60;
    remainingTimeLabel = h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, is_completed: !currentStatus } : b));
    await supabase.from('daily_blocks').update({ is_completed: !currentStatus }).eq('id', id);
  };

  const handleSaveNotes = async (id: string, notes: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, notes } : b));
    setSelectedBlock(null);
    await supabase.from('daily_blocks').update({ notes }).eq('id', id);
  };

  const handleDeleteBlock = (id: string) => {
    setBlockIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const executeDeleteBlock = async () => {
    if (!blockIdToDelete) return;
    try {
      const { error } = await supabase.from('daily_blocks').delete().eq('id', blockIdToDelete);
      if (error) throw error;
      fetchBlocksAndChallenges();
    } catch (e) {
      console.error(e);
      alert('Error al eliminar el bloque.');
    } finally {
      setIsConfirmOpen(false);
      setBlockIdToDelete(null);
    }
  };

  const handleClearAllBlocks = async () => {
    setIsClearing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error: dbErr } = await supabase.from('daily_blocks').delete().eq('date', today);
      if (dbErr) throw dbErr;
      setBlocks([]);
      fetchBlocksAndChallenges();
    } catch (e: any) {
      console.error('Error al vaciar lienzo:', e);
      alert('Error al vaciar el lienzo: ' + (e.message || e));
    } finally {
      setIsClearing(false);
      setIsClearAllConfirmOpen(false);
    }
  };

  const handleEditBlock = (block: TimeBlock) => {
    setEditingBlockForForm(block);
    setIsFormOpen(true);
  };

  const handleAddBlock = () => {
    setEditingBlockForForm(null);
    setIsFormOpen(true);
  };

  // Group blocks by period
  const morningBlocks = blocks.filter(b => getPeriod(b) === 'morning');
  const afternoonBlocks = blocks.filter(b => getPeriod(b) === 'afternoon');
  const nightBlocks = blocks.filter(b => getPeriod(b) === 'night');

  const formatTimerDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#70796f', fontFamily: 'var(--font-sans)' }}>
        <div style={{ fontSize: '28px', marginBottom: '12px' }}>⏳</div>
        Cargando tu día...
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f6fbf4',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      color: '#181d19',
      fontFamily: 'var(--font-sans)',
      paddingBottom: '110px'
    }}>
      {/* 1. App Header */}
      <AppHeader sectionTitle="Hoy" />

      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: '430px',
        margin: '0 auto',
        padding: '16px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        
        {/* 2. Contextual Date & Streak Header */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#404940'
            }}>
              {getFormattedDate()}
            </span>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#ffdbd2',
              color: '#3c0800',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <span style={{ fontSize: '14px' }}>🔥</span>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em' }}>
                Racha: 19 días
              </span>
            </div>
          </div>
          <h1 style={{
            fontSize: '24px',
            fontFamily: 'var(--font-serif)',
            fontWeight: 600,
            color: '#181d19',
            margin: '4px 0 0 0',
            letterSpacing: '-0.01em',
            lineHeight: 1.2
          }}>
            {getGreeting()}, Alex 🌅
          </h1>
          <p style={{
            fontSize: '13px',
            color: '#404940',
            margin: '2px 0 0 0',
            fontFamily: 'var(--font-sans)'
          }}>
            {activeSegment === 'time-blocks' && `${blocks.length} bloques tácticos asignados para hoy. Máxima claridad.`}
            {activeSegment === 'inmersion' && `Cámara hiperbárica de deep work y foco absoluto.`}
            {activeSegment === 'anti-ocio' && `Blindaje de dopamina y control de distracciones.`}
          </p>
        </section>

        {/* 3. Top Segmented Control (Pills) */}
        <nav style={{
          padding: '4px',
          borderRadius: '9999px',
          backgroundColor: '#ebefe8',
          display: 'flex',
          alignItems: 'center',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <button
            onClick={() => setActiveSegment('time-blocks')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeSegment === 'time-blocks' ? '#ffffff' : 'transparent',
              color: activeSegment === 'time-blocks' ? '#11562a' : '#404940',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              boxShadow: activeSegment === 'time-blocks' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🌅</span>
            <span>Time-Blocks</span>
          </button>
          <button
            onClick={() => setActiveSegment('inmersion')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeSegment === 'inmersion' ? '#ffffff' : 'transparent',
              color: activeSegment === 'inmersion' ? '#11562a' : '#404940',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              boxShadow: activeSegment === 'inmersion' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🧘</span>
            <span>Inmersión</span>
          </button>
          <button
            onClick={() => setActiveSegment('anti-ocio')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeSegment === 'anti-ocio' ? '#ffffff' : 'transparent',
              color: activeSegment === 'anti-ocio' ? '#11562a' : '#404940',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              boxShadow: activeSegment === 'anti-ocio' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🛡️</span>
            <span>Anti-Ocio</span>
          </button>
        </nav>

        {/* ── SUB-PESTAÑA 1: TIME-BLOCKS ── */}
        {activeSegment === 'time-blocks' && (
          <>
            {/* 4. Active Block Hero Card */}
            {currentActiveBlock && (
              <section style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(17,86,42,0.08) 0%, #f0f5ee 50%, #ebefe8 100%)',
                padding: '18px',
                border: '1px solid rgba(46,111,64,0.12)',
                boxShadow: '0 8px 24px -4px rgba(24,29,25,0.06)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#11562a',
                      display: 'inline-block',
                      boxShadow: '0 0 8px #11562a'
                    }} />
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: '#11562a',
                      textTransform: 'uppercase'
                    }}>
                      Bloque en Curso
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(46,111,64,0.12)',
                    color: '#11562a'
                  }}>
                    {currentActiveBlock.start_time.slice(0, 5)} — {currentActiveBlock.end_time.slice(0, 5)}
                  </span>
                </div>

                <h2 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#181d19',
                  margin: '0 0 4px 0',
                  lineHeight: 1.25
                }}>
                  {currentActiveBlock.title}
                </h2>
                <p style={{
                  fontSize: '13px',
                  color: '#404940',
                  margin: '0 0 14px 0',
                  lineHeight: 1.4
                }}>
                  {currentActiveBlock.notes || 'Módulo de pagos Stripe e idempotencia en endpoints críticos.'}
                </p>

                {/* Countdown card & Mini Radial Progress */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(10px)',
                  marginBottom: '14px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px', color: '#11562a' }}>⏳</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '10px', color: '#404940', fontWeight: 600 }}>Tiempo Restante</span>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#181d19' }}>{remainingTimeLabel}</span>
                    </div>
                  </div>

                  {/* Radial Progress Ring */}
                  <div style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="40" height="40" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#dfe4dd"
                        strokeWidth="3.5"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#11562a"
                        strokeDasharray={`${activeBlockProgressPct}, 100`}
                        strokeLinecap="round"
                        strokeWidth="3.5"
                      />
                    </svg>
                    <span style={{ position: 'absolute', fontSize: '10px', fontWeight: 700, color: '#11562a' }}>
                      {activeBlockProgressPct}%
                    </span>
                  </div>
                </div>

                {/* CTA: Entrar en Modo Inmersión */}
                <button
                  onClick={() => setImmersionModalBlock(currentActiveBlock)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '9999px',
                    backgroundColor: '#11562a',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(17,86,42,0.28)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <span>▶</span>
                  <span>Entrar en Modo Inmersión</span>
                </button>
              </section>
            )}

            {/* 5. Tactical Agenda (Agenda Táctica) */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#181d19',
                  margin: 0
                }}>
                  Agenda Táctica
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#404940' }}>
                    {blocks.length} eventos
                  </span>
                  {blocks.length > 0 && (
                    <button
                      onClick={() => setIsClearAllConfirmOpen(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ba1a1a',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Vaciar lienzo"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Mañana */}
              {morningBlocks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', color: '#67431b' }}>🌅</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#67431b' }}>
                      Mañana
                    </span>
                  </div>
                  {morningBlocks.map(block => renderBlockItem(block))}
                </div>
              )}

              {/* Tarde */}
              {afternoonBlocks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', color: '#9a442d' }}>☀️</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9a442d' }}>
                      Tarde
                    </span>
                  </div>
                  {afternoonBlocks.map(block => renderBlockItem(block))}
                </div>
              )}

              {/* Noche */}
              {nightBlocks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', color: '#11562a' }}>🌙</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#11562a' }}>
                      Noche
                    </span>
                  </div>
                  {nightBlocks.map(block => renderBlockItem(block))}
                </div>
              )}

              {blocks.length === 0 && (
                <div style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  borderRadius: '16px',
                  backgroundColor: '#f0f5ee',
                  border: '1px dashed #c0c9bd'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px', color: '#11562a' }}>✦</div>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>
                    Tu día está en blanco
                  </p>
                  <p style={{ fontSize: '12px', color: '#404940', margin: 0 }}>
                    Añade bloques de tiempo para estructurar tu agenda.
                  </p>
                </div>
              )}
            </section>

            {/* 6. Espacio & Ritmo Quote Banner */}
            <div style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              height: '100px',
              backgroundColor: '#2d322d',
              boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center'
            }}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJAi5L6JXOoIuJS5pZ5sSn0IzZI-FMJxlNIVJplEY77xvKC3aLg6NaAW2CY_dTgt5RDRUUScrbbIZfREqUJPaccOym8kvMaSN7jBMi8RONF5wtea9C6ady88HQcc_drzSzY7WKvgIZnG_mMk2Jt-ip4DFQxnRzbzT8DHiKqi7x_tWeA6QLmGJ6g-YmDTWlJvEXB5xpPtFe3sI0NzbyJvJQQyXaMkOgGttwgS4huJ8fEAAomuAzuGYg"
                alt="Espacio y Ritmo"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, rgba(45,50,45,0.92) 0%, rgba(45,50,45,0.6) 60%, transparent 100%)',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#adf3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                  Espacio &amp; Ritmo
                </span>
                <p style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '15px',
                  color: '#edf2eb',
                  margin: 0,
                  lineHeight: 1.3
                }}>
                  "Un día enfocado vence a una semana dispersa."
                </p>
              </div>
            </div>

            {/* 7. Control Anti-Ocio Preview */}
            <section style={{
              borderRadius: '16px',
              backgroundColor: '#ebefe8',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px', color: '#11562a' }}>🛡️</span>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#181d19', margin: 0 }}>
                    Control Anti-Ocio
                  </h3>
                </div>
                <button
                  onClick={() => setActiveSegment('anti-ocio')}
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(17,86,42,0.15)',
                    color: '#11562a',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Ver Módulo Completo →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#404940' }}>
                  <span>Gaming &amp; Redes hoy</span>
                  <span style={{ fontWeight: 700, color: '#181d19' }}>{antiOcioStats.usedHours}h / {antiOcioStats.allocatedHours}h asignadas</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '9999px',
                  backgroundColor: '#dfe4dd',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(antiOcioStats.usedHours / antiOcioStats.allocatedHours) * 100}%`,
                    height: '100%',
                    borderRadius: '9999px',
                    backgroundColor: '#11562a'
                  }} />
                </div>
                <p style={{ fontSize: '11px', color: '#404940', margin: 0, textAlign: 'right' }}>
                  30m restantes para ocio libre hoy.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '4px' }}>
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#404940', fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>
                    <span style={{ color: '#11562a' }}>🚫</span>
                    <span>Sin redes (7h)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#181d19' }}>{antiOcioStats.socialFreeStreak} / 7</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#11562a' }}>71%</span>
                  </div>
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#404940', fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>
                    <span style={{ color: '#9a442d' }}>🎮</span>
                    <span>Cero gaming diurno</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#9a442d' }}>{antiOcioStats.gamingFreeDays} días</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#9a442d' }}>Invicto</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 8. Check-in de Cierre (1-Tap) */}
            <section style={{
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: '1px solid rgba(46,111,64,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#181d19', margin: 0 }}>
                  Check-in de Cierre
                </h3>
                <span style={{ fontSize: '10px', color: '#404940', fontWeight: 600 }}>1 tap</span>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#404940', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Nivel de Energía al Cierre:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {[
                    { key: 'full', emoji: '🔥', label: 'Full' },
                    { key: 'bien', emoji: '🙂', label: 'Bien' },
                    { key: 'regular', emoji: '😐', label: 'Regular' },
                    { key: 'bajo', emoji: '😞', label: 'Bajo' }
                  ].map(opt => {
                    const isSelected = energyLevel === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setEnergyLevel(opt.key as any)}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: isSelected ? '#2e6f40' : '#ebefe8',
                          color: isSelected ? '#ffffff' : '#181d19',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          boxShadow: isSelected ? '0 2px 6px rgba(46,111,64,0.3)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{opt.emoji}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700 }}>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#404940', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Victoria Táctica del Día:
                </label>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#f0f5ee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  {isEditingVictory ? (
                    <input
                      type="text"
                      value={victoryNote}
                      onChange={e => setVictoryNote(e.target.value)}
                      onBlur={() => setIsEditingVictory(false)}
                      onKeyDown={e => { if (e.key === 'Enter') setIsEditingVictory(false); }}
                      autoFocus
                      style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '12px',
                        color: '#181d19',
                        outline: 'none',
                        fontStyle: 'italic'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '12px', color: '#181d19', fontStyle: 'italic' }}>
                      "{victoryNote}"
                    </span>
                  )}
                  <button
                    onClick={() => setIsEditingVictory(!isEditingVictory)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#404940',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    ✏️
                  </button>
                </div>
              </div>
            </section>

            {/* 9. Floating Thumb-Zone Action Button */}
            <div style={{ paddingTop: '4px' }}>
              <button
                onClick={handleAddBlock}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '9999px',
                  backgroundColor: '#11562a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px -4px rgba(17,86,42,0.35)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <FiPlus size={18} />
                <span>Añadir Bloque de Tiempo</span>
              </button>
            </div>
          </>
        )}

        {/* ── SUB-PESTAÑA 2: INMERSIÓN ── */}
        {activeSegment === 'inmersion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Zen Timer & Focus Chamber Card */}
            <section style={{
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #104D30 0%, #0A2A1E 100%)',
              color: '#ffffff',
              padding: '28px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 12px 32px rgba(10,42,30,0.18)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.04)',
                pointerEvents: 'none'
              }} />

              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#adf3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: '8px'
              }}>
                Cámara de Inmersión Profunda
              </span>

              {/* Huge Timer */}
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '56px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                margin: '12px 0 18px',
                textShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }}>
                {formatTimerDisplay(timeLeft)}
              </div>

              {/* Progress Ring / Bar */}
              <div style={{ width: '100%', maxWidth: '280px', height: '6px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginBottom: '22px' }}>
                <div style={{
                  width: `${((timerMinutes * 60 - timeLeft) / (timerMinutes * 60)) * 100}%`,
                  height: '100%',
                  borderRadius: '9999px',
                  backgroundColor: '#adf3b8',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* Preset Selector */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '22px' }}>
                {[15, 25, 45, 60, 90].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setTimerPreset(mins)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '9999px',
                      border: timerMinutes === mins ? '1px solid #adf3b8' : '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: timerMinutes === mins ? 'rgba(173,243,184,0.15)' : 'rgba(255,255,255,0.06)',
                      color: timerMinutes === mins ? '#adf3b8' : '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  onClick={toggleTimer}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '9999px',
                    backgroundColor: isTimerRunning ? '#e07a5f' : '#adf3b8',
                    color: isTimerRunning ? '#ffffff' : '#0A2A1E',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  {isTimerRunning ? <FiPause size={18} /> : <FiPlay size={18} />}
                  <span>{isTimerRunning ? 'Pausar Foco' : 'Iniciar Foco'}</span>
                </button>

                <button
                  onClick={resetTimer}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Reiniciar"
                >
                  <FiRotateCcw size={16} />
                </button>

                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: soundEnabled ? 'rgba(173,243,184,0.15)' : 'rgba(255,255,255,0.1)',
                    border: soundEnabled ? '1px solid #adf3b8' : '1px solid rgba(255,255,255,0.2)',
                    color: soundEnabled ? '#adf3b8' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title={soundEnabled ? 'Sonido activado' : 'Sonido silenciado'}
                >
                  {soundEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
                </button>
              </div>
            </section>

            {/* Ambient Sound Scapes */}
            <section style={{
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              padding: '16px',
              border: '1px solid rgba(46,111,64,0.08)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#404940' }}>
                Atmósfera Sonora &amp; Ondas Binaurales
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { key: 'none', icon: '🤫', label: 'Silencio' },
                  { key: 'rain', icon: '🌧️', label: 'Lluvia Zen' },
                  { key: 'forest', icon: '🌲', label: 'Bosque' },
                  { key: 'binaural', icon: '🧠', label: 'Alfa 432Hz' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setAmbientSound(item.key as any)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '12px',
                      border: ambientSound === item.key ? '1.5px solid #11562a' : '1px solid #dfe4dd',
                      backgroundColor: ambientSound === item.key ? 'rgba(17,86,42,0.08)' : '#f6fbf4',
                      color: ambientSound === item.key ? '#11562a' : '#181d19',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{item.icon}</span>
                    <span style={{ fontSize: '10px', fontWeight: 600 }}>{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Micro-tareas del bloque actual */}
            {currentActiveBlock && (
              <section style={{
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                padding: '16px',
                border: '1px solid rgba(46,111,64,0.08)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#404940' }}>
                    Micro-Tareas: {currentActiveBlock.title}
                  </span>
                  <button
                    onClick={() => setImmersionModalBlock(currentActiveBlock)}
                    style={{ background: 'none', border: 'none', color: '#11562a', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Abrir Pantalla Completa →
                  </button>
                </div>
                {currentActiveBlock.subtasks && currentActiveBlock.subtasks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {currentActiveBlock.subtasks.map(st => (
                      <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                        <span style={{ color: st.is_completed ? '#11562a' : '#c0c9bd' }}>
                          {st.is_completed ? '✓' : '○'}
                        </span>
                        <span style={{ fontSize: '13px', textDecoration: st.is_completed ? 'line-through' : 'none', color: st.is_completed ? '#70796f' : '#181d19' }}>
                          {st.title}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#70796f', margin: 0 }}>
                    No hay sub-tareas creadas para este bloque. Puedes añadir notas o abrir el modal completo.
                  </p>
                )}
              </section>
            )}

          </div>
        )}

        {/* ── SUB-PESTAÑA 3: ANTI-OCIO ── */}
        {activeSegment === 'anti-ocio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <GamingTracker />
            <StreakWidget />
          </div>
        )}

        {/* Altar Trigger Link */}
        <div style={{ textAlign: 'center', paddingTop: '4px' }}>
          <button
            onClick={() => setIsAltarOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#404940',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              opacity: 0.8
            }}
          >
            <span>🪔</span>
            <span>Abrir Altar de Consciencia</span>
          </button>
        </div>

      </main>

      {/* Modals */}
      <BlockNotesModal
        block={selectedBlock}
        onClose={() => setSelectedBlock(null)}
        onSave={handleSaveNotes}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="¿Eliminar bloque?"
        message="¿Estás seguro de que quieres eliminar este bloque diario?"
        onConfirm={executeDeleteBlock}
        onCancel={() => { setIsConfirmOpen(false); setBlockIdToDelete(null); }}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      <ConfirmModal
        isOpen={isClearAllConfirmOpen}
        title="¿Vaciar todo el lienzo?"
        message={isClearing ? "Limpiando el lienzo..." : "¿Estás seguro de que quieres eliminar todos los bloques de hoy?"}
        onConfirm={handleClearAllBlocks}
        onCancel={() => setIsClearAllConfirmOpen(false)}
        confirmText="Sí, vaciar todo"
        cancelText="Cancelar"
      />

      {isFormOpen && (
        <BlockFormModal
          block={editingBlockForForm}
          onClose={() => { setIsFormOpen(false); setEditingBlockForForm(null); }}
          onSave={fetchBlocksAndChallenges}
        />
      )}

      {immersionModalBlock && (
        <ImmersionModal
          block={immersionModalBlock}
          onClose={() => setImmersionModalBlock(null)}
          onRefresh={fetchBlocksAndChallenges}
        />
      )}

      <AltarModal
        isOpen={isAltarOpen}
        onClose={() => setIsAltarOpen(false)}
      />
    </div>
  );

  function renderBlockItem(block: TimeBlock) {
    const isCompleted = block.is_completed;
    const isCurrent = currentActiveBlock?.id === block.id;

    return (
      <div
        key={block.id}
        onClick={() => handleEditBlock(block)}
        style={{
          position: 'relative',
          borderRadius: '12px',
          padding: '14px',
          backgroundColor: isCurrent ? '#ffffff' : '#f0f5ee',
          boxShadow: isCurrent ? '0 4px 14px rgba(24,29,25,0.06)' : '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          opacity: isCompleted ? 0.65 : 1,
          border: isCurrent ? '1px solid rgba(46,111,64,0.2)' : '1px solid transparent',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        {isCurrent && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: '12px',
            bottom: '12px',
            width: '4px',
            backgroundColor: '#11562a',
            borderRadius: '0 4px 4px 0'
          }} />
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0, flex: 1 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleComplete(block.id, isCompleted);
            }}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: isCompleted ? 'rgba(17,86,42,0.15)' : '#ffffff',
              border: isCompleted ? 'none' : '1.5px solid #c0c9bd',
              color: '#11562a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              marginTop: '1px'
            }}
          >
            {isCompleted ? <FiCheck size={14} /> : null}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: isCurrent ? '#11562a' : '#404940' }}>
              {block.start_time.slice(0, 5)} — {block.end_time.slice(0, 5)}
            </span>
            <p style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#181d19',
              margin: '2px 0 0 0',
              textDecoration: isCompleted ? 'line-through' : 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {block.title}
            </p>
            {block.notes && (
              <span style={{
                fontSize: '12px',
                color: '#404940',
                marginTop: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {block.notes}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {isCompleted && (
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#dfe4dd',
              color: '#404940'
            }}>
              Hecho
            </span>
          )}
          {isCurrent && !isCompleted && (
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(17,86,42,0.1)',
              color: '#11562a'
            }}>
              ⏳ En curso
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteBlock(block.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#70796f',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      </div>
    );
  }
}
