import { useState, useEffect, useRef } from 'react';
import { FiX, FiPlay, FiPause, FiCheckSquare, FiSquare } from 'react-icons/fi';
import { supabase } from '../lib/supabase';

interface Subtask {
  id: string;
  daily_block_id: string;
  title: string;
  is_completed: boolean;
}

interface Pillar {
  id: string;
  name: string;
  label: string;
}

interface TimeBlock {
  id: string;
  start_time: string;
  end_time: string;
  title: string;
  is_completed: boolean;
  notes?: string;
  pillar_id?: string;
  pillars?: Pillar;
  subtasks?: Subtask[];
}

interface ImmersionModalProps {
  block: TimeBlock;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ImmersionModal({ block, onClose, onRefresh }: ImmersionModalProps) {
  // Calculate block duration in minutes
  const getDurationMinutes = () => {
    const [startH, startM] = block.start_time.split(':').map(Number);
    const [endH, endM] = block.end_time.split(':').map(Number);
    let diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff <= 0) diff = 60; // fallback to 60 mins
    return diff;
  };

  const durationMinutes = getDurationMinutes();
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [localSubtasks, setLocalSubtasks] = useState<Subtask[]>(block.subtasks || []);
  const [posture, setPosture] = useState<'desktop' | 'couch'>('desktop');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Zen chime player using Web Audio API
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
      playNote(now, 523.25, 1.5); // C5
      playNote(now + 0.3, 659.25, 1.5); // E5
      playNote(now + 0.6, 783.99, 2.0); // G5
    } catch (e) {
      console.error('AudioContext error:', e);
    }
  };

  useEffect(() => {
    if (isRunning) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      timerRef.current = setInterval(() => {
        if (endTimeRef.current) {
          const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining === 0) {
            setIsRunning(false);
            setIsFinished(true);
            playZenChime();
            handleCompleteBlock();
          }
        }
      }, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Handle visibility change (coming back to PWA from background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && endTimeRef.current) {
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) {
          setIsRunning(false);
          setIsFinished(true);
          playZenChime();
          handleCompleteBlock();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning]);

  const handleCompleteBlock = async () => {
    // Settle block completion
    try {
      await supabase.from('daily_blocks').update({ is_completed: true, completion_percentage: 100 }).eq('id', block.id);
      // Auto-complete all subtasks
      if (localSubtasks.length > 0) {
        await supabase.from('subtasks').update({ is_completed: true }).eq('daily_block_id', block.id);
        setLocalSubtasks(prev => prev.map(s => ({ ...s, is_completed: true })));
      }
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSubtask = async (subtaskId: string, currentStatus: boolean) => {
    setLocalSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, is_completed: !currentStatus } : s));
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ is_completed: !currentStatus })
        .eq('id', subtaskId);
      if (error) throw error;
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const formattedMins = mins.toString().padStart(2, '0');
    const formattedSecs = secs.toString().padStart(2, '0');
    
    if (hrs > 0) {
      return `${hrs}:${formattedMins}:${formattedSecs}`;
    }
    return `${formattedMins}:${formattedSecs}`;
  };

  const progressFraction = (timeLeft / (durationMinutes * 60));

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      height: '100%',
      zIndex: 9999,
      backgroundColor: 'var(--bg-app)',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px 24px 40px',
      overflow: 'hidden',
      animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Modo Inmersión
          </span>
          <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', color: 'var(--text-main)', margin: 0 }}>
            {block.title}
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Main Timer Display */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '24px 0 32px', borderBottom: '1px solid var(--border-color)' }}>
        
        {/* Ring & Time */}
        <div style={{
          position: 'relative',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-color)',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.01)'
        }}>
          {/* Accent circle indicator */}
          <div style={{
            position: 'absolute',
            inset: '-1px',
            borderRadius: '50%',
            border: '2px solid var(--accent-color)',
            clipPath: `polygon(50% 50%, -50% -50%, ${150 - progressFraction * 200}% -50%, 150% 150%, -50% 150%)`,
            opacity: isRunning ? 0.8 : 0.2,
            transition: 'clip-path 0.5s linear, opacity 0.5s'
          }} />

          <span style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '52px',
            color: isRunning ? 'var(--accent-color)' : 'var(--text-main)',
            transition: 'color 0.3s ease',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Action button & posture toggle */}
        {!isFinished ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setIsRunning(!isRunning)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: isRunning ? 'transparent' : 'var(--text-main)',
                color: isRunning ? 'var(--text-main)' : 'var(--bg-app)',
                border: isRunning ? '1px solid var(--text-main)' : 'none',
                borderRadius: '24px',
                padding: '12px 32px',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            >
              {isRunning ? (
                <>
                  <FiPause size={14} />
                  <span>Pausar Enfoque</span>
                </>
              ) : (
                <>
                  <FiPlay size={14} />
                  <span>Iniciar Enfoque</span>
                </>
              )}
            </button>

            {/* Posture conmutador */}
            <div style={{
              display: 'flex',
              backgroundColor: 'rgba(25, 25, 25, 0.05)',
              padding: '2px',
              borderRadius: '12px',
              fontSize: '10px',
              fontFamily: 'var(--font-sans)',
              width: '180px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
              marginTop: '4px'
            }}>
              <button
                onClick={() => setPosture('desktop')}
                style={{
                  flex: 1,
                  border: 'none',
                  borderRadius: '10px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '9.5px',
                  transition: 'all 0.2s ease',
                  backgroundColor: posture === 'desktop' ? 'var(--bg-app)' : 'transparent',
                  color: posture === 'desktop' ? 'var(--text-main)' : 'var(--text-muted)',
                  boxShadow: posture === 'desktop' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Escritorio 🖥️
              </button>
              <button
                onClick={() => setPosture('couch')}
                style={{
                  flex: 1,
                  border: 'none',
                  borderRadius: '10px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '9.5px',
                  transition: 'all 0.2s ease',
                  backgroundColor: posture === 'couch' ? 'var(--bg-app)' : 'transparent',
                  color: posture === 'couch' ? 'var(--text-main)' : 'var(--text-muted)',
                  boxShadow: posture === 'couch' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Sofá / Puff 🛋️
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease forwards' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--accent-color)', marginBottom: '8px' }}>
              ✦ ¡Enfoque Completado!
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-muted)' }}>
              Has alimentado tu pilar {block.pillars?.label || 'Enfoque'} con +10 XP ({posture === 'couch' ? 'Modo Sofá 🛋️' : 'Modo Escritorio 🖥️'}).
            </p>
          </div>
        )}
      </div>

      {/* Subtasks checklist */}
      <div style={{ marginTop: '28px' }}>
        <h3 style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          Lista de Enfoque
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '160px', paddingRight: '4px' }}>
          {localSubtasks.map(s => (
            <div
              key={s.id}
              onClick={() => toggleSubtask(s.id, s.is_completed)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 0',
                cursor: 'pointer',
                userSelect: 'none',
                opacity: s.is_completed ? 0.5 : 1
              }}
            >
              {s.is_completed ? (
                <FiCheckSquare size={18} color="var(--accent-color)" />
              ) : (
                <FiSquare size={18} color="var(--text-muted)" />
              )}
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                color: 'var(--text-main)',
                textDecoration: s.is_completed ? 'line-through' : 'none',
                transition: 'all 0.2s'
              }}>
                {s.title}
              </span>
            </div>
          ))}

          {localSubtasks.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No hay subtareas registradas para este bloque.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
