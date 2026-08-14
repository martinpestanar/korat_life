import { useState, useEffect } from 'react';
import { FiStar, FiCheck, FiX, FiPlus } from 'react-icons/fi';
import DailyGoalWidget from '../components/DailyGoalWidget';
import SwipeableTimeBlockCard from '../components/SwipeableTimeBlockCard';
import { type TimeBlock } from '../components/TimeBlockCard';
import BlockNotesModal from '../components/BlockNotesModal';
import BlockFormModal from '../components/BlockFormModal';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import ImmersionModal from '../components/ImmersionModal';
import AltarModal from '../components/AltarModal';

const PERIOD_LABELS: Record<string, { label: string; emoji: string; gradient: string; textColor: string }> = {
  morning:   { label: 'Mañana',  emoji: '🌅', gradient: 'linear-gradient(90deg, #FF8C42 0%, #FFB347 100%)', textColor: '#7A3800' },
  afternoon: { label: 'Tarde',   emoji: '☀️', gradient: 'linear-gradient(90deg, #D46A43 0%, #E6B033 100%)', textColor: '#6A2A00' },
  night:     { label: 'Noche',   emoji: '🌙', gradient: 'linear-gradient(90deg, #1D3557 0%, #457B9D 100%)', textColor: '#fff' }
};

function getPeriod(block: TimeBlock): string {
  if (block.period) return block.period;
  const hour = parseInt(block.start_time.split(':')[0]);
  if (hour < 12) return 'morning';
  if (hour < 19) return 'afternoon';
  return 'night';
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
      const { error: msErr } = await supabase
        .from('project_milestones')
        .update({ is_completed: true })
        .eq('id', activeFocus.milestoneId);
      if (msErr) throw msErr;

      const { data: subtasks } = await supabase
        .from('subtasks')
        .select('id')
        .eq('project_milestone_id', activeFocus.milestoneId);

      if (subtasks && subtasks.length > 0) {
        for (const sub of subtasks) {
          await supabase.from('subtasks').update({ is_completed: true }).eq('id', sub.id);
        }
      }

      localStorage.removeItem('korat_active_focus');
      window.dispatchEvent(new Event('korat_focus_changed'));
      fetchBlocksAndChallenges();
      setPillarsVersion(prev => prev + 1);
      alert(`🎉 ¡Hito completado! Has dado un paso clave. ¡Sigue así!`);
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

  useEffect(() => {
    if (!loading && blocks.length > 0) {
      setTimeout(() => {
        const id = getActiveBlockId();
        if (id) {
          const el = document.getElementById(`block-card-${id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [loading, blocks.length]);

  useEffect(() => {
    if (immersionBlock) {
      const updated = blocks.find(b => b.id === immersionBlock.id);
      if (updated) setImmersionBlock(updated);
    }
  }, [blocks]);

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
      const { error } = await supabase.from('subtasks').insert({ daily_block_id: blockId, title, is_completed: false });
      if (error) throw error;
      fetchBlocksAndChallenges();
    } catch (e) { console.error(e); }
  };

  const handleToggleSubtask = async (_blockId: string, subtaskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('subtasks').update({ is_completed: !currentStatus }).eq('id', subtaskId);
      if (error) throw error;
      fetchBlocksAndChallenges();
      setPillarsVersion(prev => prev + 1);
    } catch (e) { console.error(e); }
  };

  const handleDeleteSubtask = async (_blockId: string, subtaskId: string) => {
    try {
      const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId);
      if (error) throw error;
      fetchBlocksAndChallenges();
      setPillarsVersion(prev => prev + 1);
    } catch (e) { console.error(e); }
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
      const blockToDelete = blocks.find(b => b.id === blockIdToDelete);
      const { error } = await supabase.from('daily_blocks').delete().eq('id', blockIdToDelete);
      if (error) throw error;
      if (blockToDelete && blockToDelete.template_id) {
        const { error: templateErr } = await supabase.from('block_templates').delete().eq('id', blockToDelete.template_id);
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

  // Stagger delay per block across all periods
  let globalBlockIndex = 0;

  if (loading) return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
      <div style={{ fontSize: '28px', marginBottom: '10px' }}>⏳</div>
      Cargando tu día...
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes focusBannerIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fabPulse {
          0%,100% { box-shadow: 0 8px 28px rgba(212,106,67,0.45); }
          50%      { box-shadow: 0 8px 36px rgba(212,106,67,0.65); }
        }
        .fab-btn {
          animation: fabPulse 3s ease-in-out infinite;
          transition: transform 0.18s ease;
        }
        .fab-btn:active { transform: scale(0.92) !important; }
        .period-section { animation: fadeIn 0.28s ease forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        data-pillars-version={pillarsVersion}
        style={{
          paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          height: (immersionBlock || selectedBlock) ? '100vh' : 'auto',
          overflow: (immersionBlock || selectedBlock) ? 'hidden' : 'visible',
          position: 'relative'
        }}
      >
        {/* ── HERO HEADER ── */}
        <DailyGoalWidget completed={completedWeight} total={blocks.length} />

        {/* ── FOCO ACTIVO BANNER (sticky under header) ── */}
        {activeFocus && (
          <div style={{
            margin: '12px 16px 0',
            padding: '14px 16px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(230,176,51,0.12) 0%, rgba(212,106,67,0.08) 100%)',
            border: '1.5px solid rgba(230,176,51,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            animation: 'focusBannerIn 0.35s ease forwards'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              <FiStar size={16} color="#E6B033" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <span style={{
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  color: '#B8820A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  display: 'block',
                  marginBottom: '2px'
                }}>
                  Foco del día
                </span>
                <p style={{
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  margin: 0,
                  fontFamily: 'var(--font-sans)',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {activeFocus.milestoneTitle}
                </p>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                  {activeFocus.projectTitle}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                onClick={handleCompleteActiveFocus}
                style={{
                  background: 'rgba(0, 200, 150, 0.12)',
                  border: '1.5px solid rgba(0,200,150,0.3)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#00A87A',
                  flexShrink: 0
                }}
                title="Completar foco"
              >
                <FiCheck size={16} strokeWidth={2.5} />
              </button>
              <button
                onClick={handleRemoveActiveFocus}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: '44px',
                  minHeight: '44px',
                  justifyContent: 'center'
                }}
              >
                <FiX size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── SWIPE HINT ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '14px 20px 0',
          opacity: 0.6
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(0,200,150,0.1)',
            border: '1px solid rgba(0,200,150,0.2)',
            borderRadius: '20px',
            padding: '4px 10px'
          }}>
            <span style={{ fontSize: '11px' }}>→</span>
            <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-sans)', fontWeight: 700, color: '#00A87A', letterSpacing: '0.3px' }}>Completar</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(29,125,140,0.08)',
            border: '1px solid rgba(29,125,140,0.18)',
            borderRadius: '20px',
            padding: '4px 10px'
          }}>
            <span style={{ fontSize: '11px' }}>←</span>
            <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-sans)', fontWeight: 700, color: '#1D7D8C', letterSpacing: '0.3px' }}>Notas</span>
          </div>
        </div>

        {/* ── SCHEDULE BLOCKS BY PERIOD ── */}
        <div style={{ padding: '20px 16px 0' }}>
          {periods.map(period => {
            const periodBlocks = blocksByPeriod[period];
            if (periodBlocks.length === 0) return null;

            const pInfo = PERIOD_LABELS[period];
            const isCurrentPeriod = (() => {
              const h = new Date().getHours();
              if (period === 'morning') return h >= 5 && h < 12;
              if (period === 'afternoon') return h >= 12 && h < 19;
              return h >= 19 || h < 5;
            })();

            return (
              <div key={period} className="period-section" style={{ marginBottom: '28px' }}>
                {/* Period pill header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: isCurrentPeriod ? '5px 14px' : '5px 12px',
                    borderRadius: '20px',
                    background: isCurrentPeriod ? pInfo.gradient : 'rgba(10,42,30,0.05)',
                    border: isCurrentPeriod ? 'none' : '1px solid rgba(10,42,30,0.08)',
                    transition: 'all 0.3s ease'
                  }}>
                    <span style={{ fontSize: '13px' }}>{pInfo.emoji}</span>
                    <span style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 800,
                      letterSpacing: '1.2px',
                      textTransform: 'uppercase',
                      color: isCurrentPeriod ? pInfo.textColor : 'var(--text-muted)'
                    }}>
                      {pInfo.label}
                    </span>
                    {isCurrentPeriod && (
                      <span style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: pInfo.textColor,
                        opacity: 0.85
                      }} />
                    )}
                  </div>

                  {/* Block count */}
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    opacity: 0.6
                  }}>
                    {periodBlocks.filter(b => b.is_completed).length}/{periodBlocks.length}
                  </span>
                </div>

                {/* Cards */}
                {periodBlocks.map((block) => {
                  const delay = globalBlockIndex * 55;
                  globalBlockIndex++;
                  return (
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
                        animationDelay={delay}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {blocks.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '60px', padding: '0 20px' }}>
              <p style={{ fontSize: '36px', marginBottom: '14px' }}>✦</p>
              <p style={{ fontSize: '17px', fontFamily: 'var(--font-serif)', marginBottom: '8px', color: 'var(--text-main)' }}>
                Tu día está en blanco
              </p>
              <p style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', opacity: 0.6, lineHeight: 1.5 }}>
                Añade bloques de tiempo para empezar a dominar tu día.
              </p>
            </div>
          )}
        </div>

        {/* ── ALTAR DE CONSCIENCIA (al fondo, no interrumpe el flujo) ── */}
        {blocks.length > 0 && (
          <div
            onClick={() => setIsAltarOpen(true)}
            style={{
              margin: '8px 16px 16px',
              padding: '20px',
              border: '1.5px solid rgba(230, 176, 51, 0.2)',
              background: 'linear-gradient(135deg, #0A2A1E 0%, #05150F 100%)',
              borderRadius: '20px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {/* Corner accents */}
            {['topLeft','topRight','bottomLeft','bottomRight'].map(pos => {
              const styles: React.CSSProperties = {
                position: 'absolute',
                width: '9px',
                height: '9px',
                borderColor: 'var(--accent-light)',
                borderStyle: 'solid',
                opacity: 0.5
              };
              if (pos === 'topLeft')     { styles.top = '10px'; styles.left = '10px'; styles.borderWidth = '2px 0 0 2px'; }
              if (pos === 'topRight')    { styles.top = '10px'; styles.right = '10px'; styles.borderWidth = '2px 2px 0 0'; }
              if (pos === 'bottomLeft')  { styles.bottom = '10px'; styles.left = '10px'; styles.borderWidth = '0 0 2px 2px'; }
              if (pos === 'bottomRight') { styles.bottom = '10px'; styles.right = '10px'; styles.borderWidth = '0 2px 2px 0'; }
              return <div key={pos} style={styles} />;
            })}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(230,176,51,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0
              }}>
                🪔
              </div>
              <div style={{ flex: 1 }}>
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: 'var(--accent-light)',
                  display: 'block',
                  marginBottom: '3px'
                }}>
                  Altar de Consciencia
                </span>
                <span style={{
                  fontSize: '12px',
                  color: 'rgba(248,246,240,0.6)',
                  fontFamily: 'var(--font-sans)'
                }}>
                  "Hoy, 13 de agosto de 2026, me comprometo solemnemente a cuidar mi cuerpo, a hacer ejercicio diariamente, porque me amo y valoro mi templo..."
                </span>
              </div>
              <span style={{ fontSize: '16px', opacity: 0.4 }}>›</span>
            </div>
          </div>
        )}

        {/* ── FAB: AÑADIR BLOQUE (fixed, iOS native style) ── */}
        <button
          className="fab-btn"
          onClick={handleAddBlock}
          style={{
            position: 'fixed',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)',
            right: '20px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #D46A43 0%, #E6855C 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            zIndex: 100,
            WebkitTapHighlightColor: 'transparent'
          }}
          title="Añadir Bloque"
        >
          <FiPlus size={26} strokeWidth={2.5} />
        </button>

        {/* ── MODALS ── */}
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
    </>
  );
}
