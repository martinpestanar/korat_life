import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSliders, FiStar, FiCheck, FiX } from 'react-icons/fi';
import DailyGoalWidget from '../components/DailyGoalWidget';
import PendingDrawer from '../components/PendingDrawer';
import SwipeableTimeBlockCard from '../components/SwipeableTimeBlockCard';
import { type TimeBlock } from '../components/TimeBlockCard';
import BlockNotesModal from '../components/BlockNotesModal';
import PillarsBar from '../components/PillarsBar';
import MiniChallengeCard from '../components/MiniChallengeCard';
import { supabase } from '../lib/supabase';
import ImmersionModal from '../components/ImmersionModal';

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
  const navigate = useNavigate();
  const {
    blocks,
    setBlocks,
    pendingBlocks,
    setPendingBlocks,
    challenges,
    loadingHoy,
    refreshHoy: fetchBlocksAndChallenges
  } = useData();

  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);
  const loading = loadingHoy && blocks.length === 0;
  const [pillarsVersion, setPillarsVersion] = useState(0);
  const [immersionBlock, setImmersionBlock] = useState<TimeBlock | null>(null);

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

  const handleIntegratePending = async (id: string) => {
    const blockToIntegrate = pendingBlocks.find(b => b.id === id);
    if (!blockToIntegrate) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_blocks')
      .insert({
        date: today,
        template_id: blockToIntegrate.template_id,
        period: blockToIntegrate.period,
        start_time: blockToIntegrate.start_time,
        end_time: blockToIntegrate.end_time,
        title: `[Urgente] ${blockToIntegrate.title}`,
        is_completed: false,
        notes: blockToIntegrate.notes
      })
      .select()
      .single();

    if (data) {
      setBlocks(prev => [...prev, data].sort((a, b) => a.start_time.localeCompare(b.start_time)));
      setPendingBlocks(prev => prev.filter(b => b.id !== id));
    }
  };

  const periods = ['morning', 'afternoon', 'night'];
  const blocksByPeriod = periods.reduce<Record<string, TimeBlock[]>>((acc, p) => {
    acc[p] = blocks.filter(b => getPeriod(b) === p);
    return acc;
  }, {});

  if (loading) return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
      Cargando bloques...
    </div>
  );

  return (
    <div style={{ 
      paddingBottom: '80px', 
      display: 'flex', 
      flexDirection: 'column',
      height: (immersionBlock || selectedBlock) ? '100vh' : 'auto',
      overflow: (immersionBlock || selectedBlock) ? 'hidden' : 'visible',
      position: 'relative'
    }}>
      <DailyGoalWidget completed={completedWeight} total={blocks.length} />
      <PillarsBar key={pillarsVersion} />
      <PendingDrawer pendingBlocks={pendingBlocks} onIntegrate={handleIntegratePending} />

      <div style={{ padding: '20px' }}>
        {activeFocus && (
          <div style={{
            backgroundColor: '#FAF5ED',
            border: '1.5px solid var(--accent-color)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '24px',
            boxShadow: '0 4px 15px rgba(204, 101, 67, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiStar size={14} fill="var(--accent-color)" color="var(--accent-color)" />
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

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyItems: 'space-between', gap: '12px' }}>
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
                  backgroundColor: 'var(--accent-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(204, 101, 67, 0.2)',
                  transition: 'transform 0.2s ease'
                }}
                title="Completar meta principal"
              >
                <FiCheck size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '26px', color: 'var(--text-main)', fontFamily: 'var(--font-serif)', margin: 0 }}>
            {getDayLabel()}
          </h1>
          <button
            onClick={() => navigate('/diseno')}
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <FiSliders size={14} />
            <span>Diseño</span>
          </button>
        </div>

        {challenges.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px',
              fontFamily: 'var(--font-sans)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '2px'
            }}>
              Mini Retos Activos
            </h2>
            {challenges.map(challenge => (
              <MiniChallengeCard
                key={challenge.id}
                challenge={challenge}
                onUpdate={fetchBlocksAndChallenges}
              />
            ))}
          </div>
        )}

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

      {immersionBlock && (
        <ImmersionModal
          block={immersionBlock}
          onClose={() => setImmersionBlock(null)}
          onRefresh={fetchBlocksAndChallenges}
        />
      )}
    </div>
  );
}
