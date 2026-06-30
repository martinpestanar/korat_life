import { useState, useEffect } from 'react';
import { FiStar, FiCheck, FiX, FiPlus, FiMusic, FiCheckCircle, FiVideo, FiClock, FiHeart } from 'react-icons/fi';
import DailyGoalWidget from '../components/DailyGoalWidget';
import SwipeableTimeBlockCard from '../components/SwipeableTimeBlockCard';
import { type TimeBlock } from '../components/TimeBlockCard';
import BlockNotesModal from '../components/BlockNotesModal';
import BlockFormModal from '../components/BlockFormModal';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import ImmersionModal from '../components/ImmersionModal';
import { getDailyCultureItem } from '../lib/rioCultureData';
import AltarModal from '../components/AltarModal';

const PERIOD_LABELS: Record<string, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  night: 'Noche'
};

function getPeriod(block: TimeBlock): string {
  if (block.period) return block.period;
  const hour = parseInt(block.start_time.split(':')[0]);
  if (hour < 12) return 'morning';
  if (hour < 19) return 'afternoon';
  return 'night';
}

function getDayLabel(): string {
  const now = new Date();
  return now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(/^./, c => c.toUpperCase());
}

import { useData } from '../context/DataContext';

export default function HoyView() {
  const {
    blocks,
    setBlocks,
    loadingHoy,
    refreshHoy: fetchBlocksAndChallenges
  } = useData();

  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBlockForForm, setEditingBlockForForm] = useState<TimeBlock | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [blockIdToDelete, setBlockIdToDelete] = useState<string | null>(null);
  const loading = loadingHoy && blocks.length === 0;
  const [pillarsVersion, setPillarsVersion] = useState(0);
  const [immersionBlock, setImmersionBlock] = useState<TimeBlock | null>(null);
  const [isAltarOpen, setIsAltarOpen] = useState(false);

  // Estados para Brisa do Dia (Cultura de Río / Portugués)
  const [cultureItem] = useState(() => getDailyCultureItem());
  const [isTunedIn, setIsTunedIn] = useState(() => {
    const lastTune = localStorage.getItem('korat_last_tune_date');
    return lastTune === new Date().toDateString();
  });

  const handleTuneIn = async () => {
    if (isTunedIn) return;
    try {
      // 1. Obtener pilar conciencia (estudio/mente)
      const { data } = await supabase.from('pillars').select('total_xp').eq('name', 'conciencia').single();
      if (data) {
        // 2. Sumar +10 XP
        await supabase.from('pillars').update({ total_xp: data.total_xp + 10 }).eq('name', 'conciencia');
      }
      localStorage.setItem('korat_last_tune_date', new Date().toDateString());
      setIsTunedIn(true);
      setPillarsVersion(prev => prev + 1); // Forzar recarga visual de pilares
    } catch (e) {
      console.error('Error al sintonizar con la vibra:', e);
    }
  };

  // --- ESTADOS Y HANDLERS PARA MOTOR DE PROPÓSITO & GUARDIÁN 5H ---
  interface OfflineTask {
    text: string;
    completed: boolean;
  }

  const [pcHoursUsed, setPcHoursUsed] = useState<number>(() => {
    const cached = localStorage.getItem('korat_pc_hours_used');
    return cached ? Number(cached) : 0;
  });
  const [videosRecorded, setVideosRecorded] = useState<number>(() => {
    const cached = localStorage.getItem('korat_videos_recorded_today');
    return cached ? Number(cached) : 0;
  });
  const [offlineTasks, setOfflineTasks] = useState<OfflineTask[]>(() => {
    const cached = localStorage.getItem('korat_offline_tasks');
    return cached ? JSON.parse(cached) : [];
  });
  const [newTaskInput, setNewTaskInput] = useState('');

  // Daily Reset Effect for PC Hours and Video counts
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const lastReset = localStorage.getItem('korat_last_focus_reset_date');
    if (lastReset !== todayStr) {
      setPcHoursUsed(0);
      setVideosRecorded(0);
      localStorage.setItem('korat_pc_hours_used', '0');
      localStorage.setItem('korat_videos_recorded_today', '0');
      localStorage.setItem('korat_last_focus_reset_date', todayStr);
    }
  }, []);

  const handleUpdatePcHours = (val: number) => {
    const newVal = Math.max(0, Math.min(5, val));
    setPcHoursUsed(newVal);
    localStorage.setItem('korat_pc_hours_used', newVal.toString());
  };

  const handleRecordVideo = async () => {
    const newVal = videosRecorded + 1;
    setVideosRecorded(newVal);
    localStorage.setItem('korat_videos_recorded_today', newVal.toString());

    // Otorgar XP a pilar imperio (trabajo/negocios/marca)
    try {
      const { data } = await supabase.from('pillars').select('total_xp').eq('name', 'imperio').single();
      if (data) {
        await supabase.from('pillars').update({ total_xp: data.total_xp + 10 }).eq('name', 'imperio');
        setPillarsVersion(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error al registrar XP del video:', err);
    }
  };

  const handleDecrementVideo = async () => {
    if (videosRecorded <= 0) return;
    const newVal = videosRecorded - 1;
    setVideosRecorded(newVal);
    localStorage.setItem('korat_videos_recorded_today', newVal.toString());

    // Restar XP a pilar imperio (trabajo/negocios/marca)
    try {
      const { data } = await supabase.from('pillars').select('total_xp').eq('name', 'imperio').single();
      if (data) {
        await supabase.from('pillars').update({ total_xp: Math.max(0, data.total_xp - 10) }).eq('name', 'imperio');
        setPillarsVersion(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error al restar XP del video:', err);
    }
  };

  const handleAddOfflineTask = () => {
    if (!newTaskInput.trim()) return;
    const newTasks = [...offlineTasks, { text: newTaskInput.trim(), completed: false }];
    setOfflineTasks(newTasks);
    localStorage.setItem('korat_offline_tasks', JSON.stringify(newTasks));
    setNewTaskInput('');
  };

  const handleToggleOfflineTask = (index: number) => {
    const newTasks = offlineTasks.map((t, i) => i === index ? { ...t, completed: !t.completed } : t);
    setOfflineTasks(newTasks);
    localStorage.setItem('korat_offline_tasks', JSON.stringify(newTasks));
  };

  const handleRemoveOfflineTask = (index: number) => {
    const newTasks = offlineTasks.filter((_, i) => i !== index);
    setOfflineTasks(newTasks);
    localStorage.setItem('korat_offline_tasks', JSON.stringify(newTasks));
  };

  interface ActiveFocus {
    milestoneId: string;
    milestoneTitle: string;
    projectId: string;
    projectTitle: string;
    category: string;
  }

  const [activeFocus, setActiveFocus] = useState<ActiveFocus | null>(() => {
    try {
      const stored = localStorage.getItem('korat_active_focus');
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  });

  useEffect(() => {
    const handleFocusUpdate = () => {
      try {
        const stored = localStorage.getItem('korat_active_focus');
        setActiveFocus(stored ? JSON.parse(stored) : null);
      } catch (_) {
        setActiveFocus(null);
      }
    };
    window.addEventListener('korat_focus_changed', handleFocusUpdate);
    return () => window.removeEventListener('korat_focus_changed', handleFocusUpdate);
  }, []);

  const handleCompleteActiveFocus = async () => {
    if (!activeFocus) return;
    try {
      // 1. Completar en Supabase
      const { error: msErr } = await supabase
        .from('project_milestones')
        .update({ is_completed: true })
        .eq('id', activeFocus.milestoneId);

      if (msErr) throw msErr;

      // 2. Completar subtarea de rutina asociada si existe
      const { data: subtasks } = await supabase
        .from('subtasks')
        .select('id')
        .eq('project_milestone_id', activeFocus.milestoneId);

      if (subtasks && subtasks.length > 0) {
        for (const sub of subtasks) {
          await supabase
            .from('subtasks')
            .update({ is_completed: true })
            .eq('id', sub.id);
        }
      }

      // 3. Limpiar local storage y lanzar evento de cambio
      localStorage.removeItem('korat_active_focus');
      window.dispatchEvent(new Event('korat_focus_changed'));
      
      // 4. Refrescar
      fetchBlocksAndChallenges();
      setPillarsVersion(prev => prev + 1);

      alert(`🎉 ¡Hito completado! Has dado un paso clave para lanzar tu MVP. ¡Sigue así!`);
    } catch (e) {
      console.error(e);
      alert('Error al completar el hito.');
    }
  };

  const handleRemoveActiveFocus = () => {
    localStorage.removeItem('korat_active_focus');
    window.dispatchEvent(new Event('korat_focus_changed'));
  };



  useEffect(() => { fetchBlocksAndChallenges(); }, []);

  // Helper to determine if a block is active now
  const getActiveBlockId = () => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const active = blocks.find(b => {
      const [startH, startM] = b.start_time.split(':').map(Number);
      const [endH, endM] = b.end_time.split(':').map(Number);
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;
      return currentMins >= startMins && currentMins < endMins;
    });
    return active ? active.id : null;
  };

  const activeBlockId = getActiveBlockId();

  // Scroll to active block upon loading blocks
  useEffect(() => {
    if (!loading && blocks.length > 0) {
      // Small timeout to allow render layout reflow
      setTimeout(() => {
        const id = getActiveBlockId();
        if (id) {
          const el = document.getElementById(`block-card-${id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 500);
    }
  }, [loading, blocks.length]);

  // Synchronize immersion block in real-time if blocks list updates
  useEffect(() => {
    if (immersionBlock) {
      const updated = blocks.find(b => b.id === immersionBlock.id);
      if (updated) {
        setImmersionBlock(updated);
      }
    }
  }, [blocks]);

  // Compute weighted daily completion progress
  const completedWeight = blocks.reduce((acc, b) => {
    if (b.subtasks && b.subtasks.length > 0) {
      const completedSub = b.subtasks.filter((s: any) => s.is_completed).length;
      return acc + (completedSub / b.subtasks.length);
    }
    return acc + (b.is_completed ? 1 : 0);
  }, 0);

  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, is_completed: !currentStatus } : b));
    await supabase.from('daily_blocks').update({ is_completed: !currentStatus }).eq('id', id);
    setPillarsVersion(prev => prev + 1);
  };

  const handleAddSubtask = async (blockId: string, title: string) => {
    try {
      const { error } = await supabase.from('subtasks').insert({
        daily_block_id: blockId,
        title,
        is_completed: false
      });
      if (error) throw error;
      fetchBlocksAndChallenges();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSubtask = async (_blockId: string, subtaskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ is_completed: !currentStatus })
        .eq('id', subtaskId);
      if (error) throw error;
      fetchBlocksAndChallenges();
      setPillarsVersion(prev => prev + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubtask = async (_blockId: string, subtaskId: string) => {
    try {
      const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId);
      if (error) throw error;
      fetchBlocksAndChallenges();
      setPillarsVersion(prev => prev + 1);
    } catch (e) {
      console.error(e);
    }
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
      setPillarsVersion(prev => prev + 1);
    } catch (e) {
      console.error(e);
      alert('Error al eliminar el bloque.');
    } finally {
      setIsConfirmOpen(false);
      setBlockIdToDelete(null);
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



  const periods = ['morning', 'afternoon', 'night'];
  const blocksByPeriod = periods.reduce<Record<string, TimeBlock[]>>((acc, p) => {
    acc[p] = blocks.filter(b => getPeriod(b) === p);
    return acc;
  }, {});

  // Calculate planned PC hours based on blocks requires_pc duration
  const plannedPcHours = blocks.reduce((acc, b) => {
    if (!b.requires_pc) return acc;
    const [startH, startM] = b.start_time.split(':').map(Number);
    const [endH, endM] = b.end_time.split(':').map(Number);
    let durationHours = (endH + endM / 60) - (startH + startM / 60);
    if (durationHours < 0) durationHours += 24; // Handle overnight blocks
    return acc + durationHours;
  }, 0);

  // Auto-sync subtasks of blocks that have requires_pc as true
  const pcBlocksSubtasks = blocks
    .filter(b => b.requires_pc && b.subtasks && b.subtasks.length > 0)
    .flatMap(b => b.subtasks!.map(s => ({
      id: s.id,
      title: s.title,
      completed: s.is_completed,
      blockTitle: b.title,
      daily_block_id: b.id
    })));

  if (loading) return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
      Cargando bloques...
    </div>
  );

  return (
    <div 
      data-pillars-version={pillarsVersion}
      style={{ 
        paddingBottom: '80px', 
        display: 'flex', 
        flexDirection: 'column',
        height: (immersionBlock || selectedBlock) ? '100vh' : 'auto',
        overflow: (immersionBlock || selectedBlock) ? 'hidden' : 'visible',
        position: 'relative'
      }}
    >
      <DailyGoalWidget completed={completedWeight} total={blocks.length} />

      {/* WIDGET MOTOR DE PROPÓSITO & GUARDIÁN 5H */}
      <div className="glass-card" style={{
        margin: '0 16px 16px 16px',
        padding: '20px',
        border: '1px solid var(--border-color)',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF9F5 100%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiHeart size={14} color="var(--accent-color)" />
            <h4 style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              margin: 0
            }}>
              Motor de Propósito & Foco 5H
            </h4>
          </div>
          <span style={{ fontSize: '9.5px', color: 'var(--accent-color)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
            Río 2027
          </span>
        </div>

        {/* Sección 1: Propósito / Marca y Ayuda del Corazón */}
        <div style={{ backgroundColor: 'rgba(212, 106, 67, 0.03)', border: '1px solid rgba(212, 106, 67, 0.08)', borderRadius: '12px', padding: '14px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-main)', lineHeight: 1.4 }}>
            "Servir y ayudar a dueños de negocios desde el corazón es tu motor principal. Graba videos aportando valor."
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>
                Videos hoy: <strong>{videosRecorded}</strong>
              </span>
              {videosRecorded > 0 && (
                <button
                  onClick={handleDecrementVideo}
                  title="Restar video (corregir error)"
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-color)',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: 'var(--accent-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    padding: 0
                  }}
                >
                  -
                </button>
              )}
            </div>
            <button
              onClick={handleRecordVideo}
              style={{
                background: 'linear-gradient(135deg, var(--accent-color), var(--accent-light))',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 6px rgba(212, 106, 67, 0.15)'
              }}
            >
              <FiVideo size={11} />
              <span>Grabar Video (+10 XP)</span>
            </button>
          </div>
        </div>

        {/* Sección 2: Límite de 5 Horas de PC */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
              <FiClock size={12} />
              <span>Límite de PC (Max 5h/día)</span>
            </span>
            <strong style={{ fontSize: '12px', fontFamily: 'var(--font-serif)', color: pcHoursUsed >= 5 ? 'var(--accent-color)' : 'var(--accent-green)' }}>
              Uso: {pcHoursUsed}h / Planeado: {plannedPcHours}h
            </strong>
          </div>

          {/* Selector de Horas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => handleUpdatePcHours(pcHoursUsed - 0.5)}
              style={{ flex: 1, padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}
            >
              -30 min
            </button>
            <div style={{ flex: 3, height: '8px', backgroundColor: 'rgba(25,25,25,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${(pcHoursUsed / 5) * 100}%`,
                height: '100%',
                background: pcHoursUsed >= 5 
                  ? 'var(--accent-color)' 
                  : 'linear-gradient(90deg, var(--accent-green) 0%, #2ECC71 100%)',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <button 
              onClick={() => handleUpdatePcHours(pcHoursUsed + 0.5)}
              style={{ flex: 1, padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}
            >
              +30 min
            </button>
          </div>

          {/* Advertencia si lo planificado supera las 5 horas */}
          {plannedPcHours > 5 && (
            <div style={{
              marginTop: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(204, 101, 67, 0.05)',
              border: '1px solid rgba(204, 101, 67, 0.15)',
              fontSize: '11px',
              color: 'var(--accent-color)',
              lineHeight: 1.4
            }}>
              ⚠️ Has planificado <strong>{plannedPcHours}h</strong> de PC hoy. Intenta reajustar tus bloques a un máximo de 5 horas para evitar la fatiga y proteger tu enfoque.
            </div>
          )}

          {/* Bloqueo / Advertencia de 5 horas */}
          {pcHoursUsed >= 5 && (
            <div style={{
              marginTop: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(204, 101, 67, 0.08)',
              border: '1px solid rgba(204, 101, 67, 0.2)',
              fontSize: '11px',
              lineHeight: 1.4,
              color: 'var(--accent-color)'
            }}>
              <strong>⚠️ ¡Límite alcanzado! Apaga la computadora hoy.</strong> Usa tu cuaderno 📓, tu celular 📱 o tu cámara Sony 📷 para continuar tus tareas y planear tu siguiente sesión.
            </div>
          )}
        </div>

        {/* Sección 3: Planificación Offline (Plan de Vuelo) */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
              Plan de Vuelo PC (Proyectos)
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Planifica antes de abrir la PC 📓
            </span>
          </div>

          {/* Input para nueva tarea offline */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Notas rápidas, Sony ZV-E10..."
              value={newTaskInput}
              onChange={e => setNewTaskInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddOfflineTask()}
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '12px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                background: 'var(--bg-app)',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
            <button
              onClick={handleAddOfflineTask}
              style={{
                backgroundColor: 'var(--text-main)',
                color: 'var(--bg-app)',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Añadir
            </button>
          </div>

          {/* Lista de tareas de planificación offline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* 1. Tareas de Agenda Sincronizadas */}
            {pcBlocksSubtasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Subtareas Sincronizadas (Desde Agenda 💻)
                </span>
                {pcBlocksSubtasks.map((t) => (
                  <div 
                    key={t.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'rgba(45, 115, 232, 0.02)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px dashed rgba(45, 115, 232, 0.15)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <button
                        onClick={() => handleToggleSubtask(t.daily_block_id, t.id, t.completed)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: t.completed ? 'var(--accent-green)' : 'var(--text-muted)',
                          display: 'flex'
                        }}
                      >
                        <FiCheckCircle size={16} style={{ fill: t.completed ? 'rgba(46, 204, 113, 0.1)' : 'none' }} />
                      </button>
                      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                        <span style={{
                          fontSize: '12px',
                          color: t.completed ? 'var(--text-muted)' : 'var(--text-main)',
                          textDecoration: t.completed ? 'line-through' : 'none',
                          fontFamily: 'var(--font-sans)',
                          lineHeight: 1.3
                        }}>
                          {t.title}
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                          Bloque: {t.blockTitle}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Tareas Rápidas/Offline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {pcBlocksSubtasks.length > 0 && (
                <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Notas / Pendientes Rápidos 📓
                </span>
              )}
              {offlineTasks.map((t, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#FAF9F6',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <button
                      onClick={() => handleToggleOfflineTask(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: t.completed ? 'var(--accent-green)' : 'var(--text-muted)',
                        display: 'flex'
                      }}
                    >
                      <FiCheckCircle size={16} style={{ fill: t.completed ? 'rgba(46, 204, 113, 0.1)' : 'none' }} />
                    </button>
                    <span style={{
                      fontSize: '12px',
                      color: t.completed ? 'var(--text-muted)' : 'var(--text-main)',
                      textDecoration: t.completed ? 'line-through' : 'none',
                      fontFamily: 'var(--font-sans)',
                      lineHeight: 1.3,
                      textAlign: 'left'
                    }}>
                      {t.text}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveOfflineTask(idx)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-color)', opacity: 0.5, cursor: 'pointer', padding: '4px' }}
                  >
                    <FiX size={13} />
                  </button>
                </div>
              ))}

              {offlineTasks.length === 0 && pcBlocksSubtasks.length === 0 && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic', margin: '4px 0' }}>
                  Escribe en tu cuaderno y planifica qué harás en tus 5 horas.
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* BRISA DO DIA WIDGET */}
      <div className="glass-card" style={{
        margin: '0 16px 16px 16px',
        padding: '20px',
        border: '1px solid var(--border-color)',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FCFAF5 100%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiMusic size={12} color="var(--accent-color)" />
            <h4 style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              margin: 0
            }}>
              Brisa do Dia
            </h4>
          </div>
          <span style={{
            fontSize: '9.5px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            color: 'var(--accent-blue)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {cultureItem.vibe}
          </span>
        </div>

        <div style={{ margin: '12px 0' }}>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '15px',
            fontStyle: 'italic',
            lineHeight: 1.5,
            color: 'var(--text-main)',
            margin: '0 0 6px 0'
          }}>
            "{cultureItem.phrase}"
          </p>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontFamily: 'var(--font-sans)' }}>
            👉 {cultureItem.translation}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            {cultureItem.source}
          </span>
          <button
            onClick={handleTuneIn}
            disabled={isTunedIn}
            style={{
              background: isTunedIn ? 'rgba(16, 77, 48, 0.1)' : 'linear-gradient(135deg, var(--accent-color), var(--accent-light))',
              color: isTunedIn ? 'var(--accent-green)' : 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              cursor: isTunedIn ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: isTunedIn ? 'none' : '0 2px 8px rgba(212, 106, 67, 0.2)'
            }}
          >
            {isTunedIn ? (
              <>
                <FiCheckCircle size={12} />
                <span>Sintonizado +10 XP</span>
              </>
            ) : (
              <span>Sintonizar Vibe</span>
            )}
          </button>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {activeFocus && (
          <div className="glass-card" style={{
            padding: '18px 20px',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid var(--border-color)',
            background: '#FFFFFF',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiStar size={13} color="var(--accent-color)" />
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Foco Activo de Hoy
                </span>
              </div>
              <button 
                onClick={handleRemoveActiveFocus}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                title="Quitar Foco"
              >
                <FiX size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  {activeFocus.projectTitle} · {activeFocus.category}
                </span>
                <p style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                  {activeFocus.milestoneTitle}
                </p>
              </div>
              <button
                onClick={handleCompleteActiveFocus}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--accent-green)',
                  border: '1px solid rgba(16, 77, 48, 0.2)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
                title="Completar meta principal"
              >
                <FiCheck size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', color: 'var(--text-main)', fontFamily: 'var(--font-serif)', margin: 0 }}>
              {getDayLabel()}
            </h1>
            <button
              onClick={() => setIsAltarOpen(true)}
              title="Abrir Altar de Consciencia"
              style={{
                background: 'rgba(212, 106, 67, 0.08)',
                border: '1px solid rgba(212, 106, 67, 0.15)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.background = 'rgba(212, 106, 67, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'rgba(212, 106, 67, 0.08)';
              }}
            >
              <FiHeart size={15} style={{ fill: 'rgba(212, 106, 67, 0.1)' }} />
            </button>
          </div>
          <button
            onClick={handleAddBlock}
            style={{
              background: 'var(--text-main)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              color: 'var(--bg-app)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              fontWeight: 600
            }}
          >
            <FiPlus size={14} />
            <span>Añadir Bloque</span>
          </button>
        </div>



        {/* Swipe micro-hint — compact, visual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', opacity: 0.45 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.5px' }}>
            <span style={{ fontSize: '12px' }}>→</span>
            <span>Completar</span>
          </div>
          <div style={{ width: '1px', height: '10px', backgroundColor: 'var(--border-color)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.5px' }}>
            <span style={{ fontSize: '12px' }}>←</span>
            <span>Notas</span>
          </div>
        </div>

        {periods.map(period => (
          blocksByPeriod[period].length > 0 && (
            <div key={period} style={{ marginBottom: '28px' }}>
              <h2 style={{
                fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px',
                fontFamily: 'var(--font-sans)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '2px'
              }}>
                {PERIOD_LABELS[period]}
              </h2>
              {blocksByPeriod[period].map(block => (
                <div key={block.id} id={`block-card-${block.id}`}>
                  <SwipeableTimeBlockCard
                    block={block}
                    onToggleComplete={handleToggleComplete}
                    onOpenNotes={setSelectedBlock}
                    onAddSubtask={handleAddSubtask}
                    onToggleSubtask={handleToggleSubtask}
                    onDeleteSubtask={handleDeleteSubtask}
                    onStartImmersion={setImmersionBlock}
                    isActive={activeBlockId === block.id}
                    onEditBlock={handleEditBlock}
                    onDeleteBlock={handleDeleteBlock}
                  />
                </div>
              ))}
            </div>
          )
        ))}

        {blocks.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '60px' }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>✦</p>
            <p style={{ fontSize: '16px' }}>No hay bloques para hoy.</p>
          </div>
        )}
      </div>

      <BlockNotesModal
        block={selectedBlock}
        onClose={() => setSelectedBlock(null)}
        onSave={handleSaveNotes}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="¿Eliminar bloque?"
        message="¿Estás seguro de que quieres eliminar este bloque diario? Esta acción no se puede deshacer."
        onConfirm={executeDeleteBlock}
        onCancel={() => { setIsConfirmOpen(false); setBlockIdToDelete(null); }}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {isFormOpen && (
        <BlockFormModal
          block={editingBlockForForm}
          onClose={() => { setIsFormOpen(false); setEditingBlockForForm(null); }}
          onSave={fetchBlocksAndChallenges}
        />
      )}

      {immersionBlock && (
        <ImmersionModal
          block={immersionBlock}
          onClose={() => setImmersionBlock(null)}
          onRefresh={fetchBlocksAndChallenges}
        />
      )}

      <AltarModal
        isOpen={isAltarOpen}
        onClose={() => setIsAltarOpen(false)}
      />
    </div>
  );
}
