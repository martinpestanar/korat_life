import { useState, useRef, useCallback } from 'react';
import { FiCheckCircle, FiCircle, FiEdit2, FiPlay, FiTrash2, FiSquare, FiCheckSquare } from 'react-icons/fi';
import type { TimeBlock, Subtask } from './TimeBlockCard';

interface SwipeableTimeBlockCardProps {
  block: TimeBlock;
  onToggleComplete: (id: string, currentStatus: boolean) => void;
  onOpenNotes: (block: TimeBlock) => void;
  onAddSubtask?: (blockId: string, title: string) => void;
  onToggleSubtask?: (blockId: string, subtaskId: string, currentStatus: boolean) => void;
  onDeleteSubtask?: (blockId: string, subtaskId: string) => void;
  onStartImmersion?: (block: TimeBlock) => void;
  isActive?: boolean;
}

const SWIPE_THRESHOLD = 80;

export default function SwipeableTimeBlockCard({
  block,
  onToggleComplete,
  onOpenNotes,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onStartImmersion,
  isActive = false
}: SwipeableTimeBlockCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const startXRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine block tipology
  const titleLower = block.title.toLowerCase();
  const notesLower = (block.notes || '').toLowerCase();
  
  let type: 'santuario' | 'hybrid' | 'enfoque' = 'enfoque';
  let targetIncome: string | null = null;
  
  if (titleLower.includes('meditación') || 
      titleLower.includes('estiramientos') || 
      titleLower.includes('limpieza') || 
      titleLower.includes('ukelele') || 
      titleLower.includes('indie folk') || 
      titleLower.includes('almuerzo')) {
    type = 'santuario';
  } else if (titleLower.includes('inglés') || titleLower.includes('estudio') || notesLower.includes('sofá') || notesLower.includes('puff')) {
    type = 'hybrid';
  }
  
  if (titleLower.includes('lashista')) {
    targetIncome = 'Meta: S/. 600/mes';
  } else if (titleLower.includes('suna app')) {
    targetIncome = 'Meta: S/. 400/mes';
  }

  const cardStyle = {
    santuario: {
      backgroundColor: '#FAF5ED',
      borderColor: 'rgba(204, 101, 67, 0.25)',
      badgeColor: 'var(--accent-color)',
      badgeBg: 'rgba(204, 101, 67, 0.08)',
      label: '🌅 Santuario · Sin Computadora'
    },
    hybrid: {
      backgroundColor: '#EAE4D9',
      borderColor: 'var(--border-color)',
      badgeColor: 'var(--text-muted)',
      badgeBg: 'rgba(25, 25, 25, 0.06)',
      label: '🛋️ Modo Sofá / Puff'
    },
    enfoque: {
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--border-color)',
      badgeColor: 'var(--text-main)',
      badgeBg: 'rgba(25, 25, 25, 0.08)',
      label: '💻 Enfoque Profundo'
    }
  }[type];

  const getSwipeColor = () => {
    if (translateX > 20) return `rgba(209, 119, 87, ${Math.min(translateX / SWIPE_THRESHOLD, 1) * 0.25})`;
    if (translateX < -20) return `rgba(107, 102, 97, ${Math.min(-translateX / SWIPE_THRESHOLD, 1) * 0.15})`;
    return 'transparent';
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Prevent swipe drag if typing in subtask input or clicking buttons
    const target = e.target as HTMLElement;
    if (target.closest('input') || target.closest('button') || target.closest('form')) return;

    startXRef.current = e.clientX;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || startXRef.current === null) return;
    const delta = e.clientX - startXRef.current;
    setTranslateX(Math.max(-SWIPE_THRESHOLD * 1.5, Math.min(SWIPE_THRESHOLD * 1.5, delta)));
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (translateX >= SWIPE_THRESHOLD) {
      onToggleComplete(block.id, block.is_completed);
    } else if (translateX <= -SWIPE_THRESHOLD) {
      onOpenNotes(block);
    }

    setTranslateX(0);
    startXRef.current = null;
  }, [isDragging, translateX, block, onToggleComplete, onOpenNotes]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', marginBottom: '12px', borderRadius: '12px', overflow: 'hidden' }}
    >
      {/* Background reveal layer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: getSwipeColor(),
        borderRadius: '12px',
        transition: isDragging ? 'none' : 'background-color 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: translateX > 0 ? 'flex-start' : 'flex-end',
        padding: '0 20px',
        pointerEvents: 'none'
      }}>
        {translateX > 40 && (
          <FiCheckCircle size={24} color="var(--accent-color)" style={{ opacity: Math.min(translateX / SWIPE_THRESHOLD, 1) }} />
        )}
        {translateX < -40 && (
          <FiEdit2 size={20} color="var(--text-muted)" style={{ opacity: Math.min(-translateX / SWIPE_THRESHOLD, 1) }} />
        )}
      </div>

      {/* Card */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          backgroundColor: cardStyle.backgroundColor,
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          border: isActive ? '1.5px solid var(--accent-color)' : `1.5px solid ${cardStyle.borderColor}`,
          opacity: block.is_completed ? 0.7 : 1,
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 0.3s',
          cursor: 'grab',
          userSelect: 'none',
          touchAction: 'pan-y',
          boxShadow: isActive 
            ? '0 0 12px rgba(204, 101, 67, 0.15)' 
            : type === 'santuario' 
              ? 'inset 0 1px 3px rgba(204,101,67,0.02)' 
              : 'none',
          position: 'relative'
        }}
      >
        {isActive && (
          <style>{`
            @keyframes pulseActiveBorder {
              0% { border-color: rgba(204, 101, 67, 0.4); box-shadow: 0 0 8px rgba(204, 101, 67, 0.1); }
              50% { border-color: var(--accent-color); box-shadow: 0 0 16px rgba(204, 101, 67, 0.25); }
              100% { border-color: rgba(204, 101, 67, 0.4); box-shadow: 0 0 8px rgba(204, 101, 67, 0.1); }
            }
          `}</style>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <span style={{ 
              fontFamily: 'var(--font-serif)', 
              fontSize: '13px', 
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap'
            }}>
              <span>{block.start_time.slice(0, 5)} - {block.end_time.slice(0, 5)}</span>
              {block.pillars && (
                <span style={{ fontStyle: 'italic', color: 'var(--accent-color)' }}>
                  · {block.pillars.label.charAt(0) + block.pillars.label.slice(1).toLowerCase()}
                </span>
              )}
              {isActive && (
                <span style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(204, 101, 67, 0.12)',
                  color: 'var(--accent-color)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  animation: 'pulseActiveBorder 2.5s infinite ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--accent-color)' }} />
                  Realizando Ahora
                </span>
              )}
              <span style={{
                fontSize: '9px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '8px',
                backgroundColor: cardStyle.badgeBg,
                color: cardStyle.badgeColor,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {cardStyle.label}
              </span>
              {targetIncome && (
                <span style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 'bold',
                  padding: '1px 6px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(39, 174, 96, 0.12)',
                  color: '#27AE60'
                }}>
                  {targetIncome}
                </span>
              )}
            </span>
            <h3 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 500,
              textDecoration: block.is_completed ? 'line-through' : 'none',
              color: 'var(--text-main)',
              margin: 0
            }}>
              {block.title}
            </h3>
            {type === 'santuario' && (
              <span style={{ fontSize: '11px', color: 'var(--accent-color)', fontStyle: 'italic', marginTop: '2px' }}>
                Desconéctate de la pantalla. Momento de conexión analógica obligatoria.
              </span>
            )}
            {type === 'hybrid' && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                🛋️ Si te sientes saturado, puedes realizar este bloque desde tu móvil recostado en el puff.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onStartImmersion && onStartImmersion(block); }}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--accent-color)', display: 'flex', alignItems: 'center', padding: '4px'
              }}
              title="Iniciar Modo Inmersión"
            >
              <FiPlay size={18} />
            </button>
            <button
              onClick={() => onToggleComplete(block.id, block.is_completed)}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: block.is_completed ? 'var(--accent-color)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', padding: '4px'
              }}
            >
              {block.is_completed ? <FiCheckCircle size={24} /> : <FiCircle size={24} />}
            </button>
          </div>
        </div>

        {/* Subtasks checklist */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {block.subtasks && block.subtasks.map((s: Subtask) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: s.is_completed ? 0.6 : 1 }}>
              <div
                onClick={(e) => { e.stopPropagation(); onToggleSubtask && onToggleSubtask(block.id, s.id, s.is_completed); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}
              >
                {s.is_completed ? (
                  <FiCheckSquare size={16} color="var(--accent-color)" />
                ) : (
                  <FiSquare size={16} color="var(--text-muted)" />
                )}
                <span style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  textDecoration: s.is_completed ? 'line-through' : 'none',
                  color: 'var(--text-main)'
                }}>
                  {s.title}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteSubtask && onDeleteSubtask(block.id, s.id); }}
                onPointerDown={(e) => e.stopPropagation()}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', opacity: 0.5, cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
              >
                <FiTrash2 size={12} />
              </button>
            </div>
          ))}

          {/* Add subtask input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newSubtaskTitle.trim()) return;
              onAddSubtask && onAddSubtask(block.id, newSubtaskTitle);
              setNewSubtaskTitle('');
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}
          >
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Añadir subtarea..."
              style={{
                flex: 1,
                border: 'none',
                borderBottom: '1px solid var(--border-color)',
                background: 'none',
                padding: '4px 0',
                fontSize: '13px',
                color: 'var(--text-main)',
                outline: 'none',
                fontFamily: 'var(--font-sans)'
              }}
            />
            <button
              type="submit"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', fontSize: '14px', fontWeight: 600 }}
            >
              +
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            onClick={() => onOpenNotes(block)}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: '6px', fontSize: '13px', padding: '4px 8px', borderRadius: '6px'
            }}
          >
            <FiEdit2 size={14} />
            <span>{block.notes ? 'Ver Notas' : 'Añadir Notas'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
