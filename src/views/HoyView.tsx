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
      // Find block to get template_id
      const blockToDelete = blocks.find(b => b.id === blockIdToDelete);

      // Delete from daily_blocks
      const { error } = await supabase.from('daily_blocks').delete().eq('id', blockIdToDelete);
      if (error) throw error;

      // If it has a template_id, ALSO delete it from block_templates so it doesn't regenerate
      if (blockToDelete && blockToDelete.template_id) {
        const { error: templateErr } = await supabase
          .from('block_templates')
          .delete()
          .eq('id', blockToDelete.template_id);
        
        if (templateErr) throw templateErr;
      }

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
        paddingBottom: '120px', 
        display: 'flex', 
        flexDirection: 'column',
        height: (immersionBlock || selectedBlock) ? '100vh' : 'auto',
        overflow: (immersionBlock || selectedBlock) ? 'hidden' : 'visible',
        position: 'relative'
      }}
    >
      <DailyGoalWidget completed={completedWeight} total={blocks.length} />

      {/* CARD DEL ALTAR DE CONSCIENCIA */}
      <div 
        className="glass-card" 
        onClick={() => setIsAltarOpen(true)}
        style={{
          margin: '0 16px 16px 16px',
          padding: '24px 20px',
          border: '1.5px solid rgba(230, 176, 51, 0.25)',
          background: 'linear-gradient(135deg, #0A2A1E 0%, #05150F 100%)',
          borderRadius: '24px',
          boxShadow: '0 12px 30px rgba(10, 42, 30, 0.15)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 16px 40px rgba(10, 42, 30, 0.25)';
          e.currentTarget.style.borderColor = 'rgba(230, 176, 51, 0.45)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(10, 42, 30, 0.15)';
          e.currentTarget.style.borderColor = 'rgba(230, 176, 51, 0.25)';
        }}
      >
        {/* Decorative corner lines for a sacred altar feeling */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', width: '10px', height: '10px', borderTop: '2px solid var(--accent-light)', borderLeft: '2px solid var(--accent-light)', opacity: 0.6 }} />
        <div style={{ position: 'absolute', top: '12px', right: '12px', width: '10px', height: '10px', borderTop: '2px solid var(--accent-light)', borderRight: '2px solid var(--accent-light)', opacity: 0.6 }} />
        <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '10px', height: '10px', borderBottom: '2px solid var(--accent-light)', borderLeft: '2px solid var(--accent-light)', opacity: 0.6 }} />
        <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '10px', height: '10px', borderBottom: '2px solid var(--accent-light)', borderRight: '2px solid var(--accent-light)', opacity: 0.6 }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(230, 176, 51, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-light)',
            boxShadow: '0 0 15px rgba(230, 176, 51, 0.2)'
          }}>
            <FiHeart size={22} style={{ fill: 'var(--accent-light)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{
              fontSize: '10.5px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              color: 'var(--accent-light)'
            }}>
              Altar de Consciencia
            </span>
            <span style={{
              fontSize: '12px',
              color: 'rgba(248, 246, 240, 0.7)',
              fontFamily: 'var(--font-sans)'
            }}>
              Pacto de Vida y Compromiso
            </span>
          </div>

          <p style={{
            margin: '8px 12px 4px 12px',
            fontSize: '13px',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            lineHeight: 1.5,
            color: '#F8F6F0',
            opacity: 0.85,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            "Hoy, 1 de julio de 2026, me comprometo solemnemente a cuidar mi cuerpo, a hacer ejercicio diariamente, porque me amo y valoro mi templo..."
          </p>

          <span style={{
            fontSize: '10.5px',
            color: 'var(--accent-light)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            borderBottom: '1px solid rgba(230, 176, 51, 0.3)',
            paddingBottom: '2px',
            marginTop: '6px',
            display: 'inline-block'
          }}>
            Tocar para entrar y recordar
          </span>
        </div>
      </div>


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
