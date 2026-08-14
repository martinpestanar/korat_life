import { useState, useRef, useCallback, useEffect } from 'react';
import { FiCheckCircle, FiCircle, FiEdit2, FiPlay, FiTrash2, FiSquare, FiCheckSquare, FiFileText } from 'react-icons/fi';
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
  onEditBlock?: (block: TimeBlock) => void;
  onDeleteBlock?: (id: string) => void;
  animationDelay?: number;
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
  isActive = false,
  onEditBlock,
  onDeleteBlock,
  animationDelay = 0
}: SwipeableTimeBlockCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [justCompleted, setJustCompleted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const startXRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  // Auto-expand active block
  useEffect(() => {
    if (isActive) setIsExpanded(true);
  }, [isActive]);

  // Determine block typology
  const titleLower = block.title.toLowerCase();
  const notesLower = (block.notes || '').toLowerCase();

  let type: 'santuario' | 'hybrid' | 'enfoque' = 'enfoque';
  let targetIncome: string | null = null;

  if (
    titleLower.includes('meditación') ||
    titleLower.includes('estiramientos') ||
    titleLower.includes('limpieza') ||
    titleLower.includes('ukelele') ||
    titleLower.includes('indie folk') ||
    titleLower.includes('almuerzo')
  ) {
    type = 'santuario';
  } else if (
    titleLower.includes('inglés') ||
    titleLower.includes('estudio') ||
    notesLower.includes('sofá') ||
    notesLower.includes('puff')
  ) {
    type = 'hybrid';
  }

  if (titleLower.includes('lashista')) {
    targetIncome = 'Meta: S/. 600/mes';
  } else if (titleLower.includes('suna app')) {
    targetIncome = 'Meta: S/. 400/mes';
  }

  const cardStyle = {
    santuario: {
      bg: 'linear-gradient(135deg, rgba(255, 241, 224, 0.95) 0%, rgba(255,255,255,0.92) 100%)',
      borderColor: 'rgba(231, 111, 81, 0.22)',
      leftAccent: '#E87040',
      badgeColor: '#C8562A',
      badgeBg: 'rgba(231, 111, 81, 0.1)',
      label: '🌅 Sin Pantallas'
    },
    hybrid: {
      bg: 'linear-gradient(135deg, rgba(218, 244, 242, 0.95) 0%, rgba(255,255,255,0.92) 100%)',
      borderColor: 'rgba(29, 138, 153, 0.22)',
      leftAccent: '#1D7D8C',
      badgeColor: '#155F6A',
      badgeBg: 'rgba(29, 138, 153, 0.1)',
      label: '🛋️ Modo Relajado'
    },
    enfoque: {
      bg: 'linear-gradient(135deg, rgba(245, 250, 245, 0.95) 0%, rgba(255,255,255,0.92) 100%)',
      borderColor: 'rgba(46, 111, 64, 0.18)',
      leftAccent: '#2E6F40',
      badgeColor: '#1A5C30',
      badgeBg: 'rgba(46, 111, 64, 0.08)',
      label: '💻 Enfoque Profundo'
    }
  }[type];

  const getSwipeColor = () => {
    if (translateX > 20) return `rgba(0, 200, 150, ${Math.min(translateX / SWIPE_THRESHOLD, 1) * 0.2})`;
    if (translateX < -20) return `rgba(29, 125, 140, ${Math.min(-translateX / SWIPE_THRESHOLD, 1) * 0.15})`;
    return 'transparent';
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
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
      if (!block.is_completed) {
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 600);
      }
    } else if (translateX <= -SWIPE_THRESHOLD) {
      onOpenNotes(block);
    } else if (Math.abs(translateX) < 4) {
      setIsExpanded(prev => !prev);
    }

    setTranslateX(0);
    startXRef.current = null;
  }, [isDragging, translateX, block, onToggleComplete, onOpenNotes]);

  const handleCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete(block.id, block.is_completed);
    if (!block.is_completed) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
  };

  const hasNotes = block.notes && block.notes.trim().length > 0;
  const subtaskCount = block.subtasks?.length ?? 0;
  const subtaskDone = block.subtasks?.filter(s => s.is_completed).length ?? 0;

  return (
    <>
      <style>{`
        @keyframes cardSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes checkBounce {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.35); }
          70%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes completedFlash {
          0%   { background-color: rgba(0, 200, 150, 0.12); }
          100% { background-color: transparent; }
        }
        @keyframes activeGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(212, 106, 67, 0.0), 0 2px 12px rgba(10,42,30,0.06); }
          50%      { box-shadow: 0 0 0 3px rgba(212, 106, 67, 0.18), 0 4px 20px rgba(212,106,67,0.12); }
        }
        .check-bounce { animation: checkBounce 0.35s ease forwards; }
        .completed-flash { animation: completedFlash 0.6s ease forwards; }
        .card-slide-in {
          opacity: 0;
          animation: cardSlideIn 0.3s ease forwards;
        }
        .active-glow {
          animation: activeGlow 2.8s ease-in-out infinite;
        }
      `}</style>

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          marginBottom: '10px',
          borderRadius: '18px',
          overflow: 'hidden',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.01s'
        }}
        className={mounted ? 'card-slide-in' : ''}
      >
        {/* Swipe reveal layer */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: getSwipeColor(),
          borderRadius: '18px',
          transition: isDragging ? 'none' : 'background-color 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: translateX > 0 ? 'flex-start' : 'flex-end',
          padding: '0 22px',
          pointerEvents: 'none'
        }}>
          {translateX > 40 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', opacity: Math.min(translateX / SWIPE_THRESHOLD, 1) }}>
              <FiCheckCircle size={26} color="#00C896" />
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#00C896', fontFamily: 'var(--font-sans)', letterSpacing: '0.5px' }}>COMPLETAR</span>
            </div>
          )}
          {translateX < -40 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', opacity: Math.min(-translateX / SWIPE_THRESHOLD, 1) }}>
              <FiFileText size={24} color="#1D7D8C" />
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#1D7D8C', fontFamily: 'var(--font-sans)', letterSpacing: '0.5px' }}>NOTAS</span>
            </div>
          )}
        </div>

        {/* Main Card */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={isActive ? 'active-glow' : ''}
          style={{
            background: justCompleted
              ? 'linear-gradient(135deg, rgba(0,200,150,0.1) 0%, rgba(255,255,255,0.95) 100%)'
              : cardStyle.bg,
            borderRadius: '18px',
            padding: '16px 16px 16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            border: isActive
              ? '1.5px solid rgba(212, 106, 67, 0.55)'
              : `1.5px solid ${cardStyle.borderColor}`,
            borderLeft: isActive
              ? `4px solid #D46A43`
              : `4px solid ${cardStyle.leftAccent}`,
            opacity: block.is_completed ? 0.55 : 1,
            filter: block.is_completed ? 'grayscale(15%)' : 'none',
            transform: `translateX(${translateX}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.3s, background 0.4s',
            cursor: 'grab',
            userSelect: 'none',
            touchAction: 'pan-y',
            position: 'relative',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          {/* Top row: time + badges + check */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: 0 }}>

              {/* Time + active badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.2px'
                }}>
                  {block.start_time.slice(0, 5)} – {block.end_time.slice(0, 5)}
                </span>

                {block.pillars && (
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    color: 'var(--accent-color)',
                    fontStyle: 'italic'
                  }}>
                    · {block.pillars.label.charAt(0) + block.pillars.label.slice(1).toLowerCase()}
                  </span>
                )}

                {isActive && (
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: '20px',
                    backgroundColor: '#D46A43',
                    color: '#fff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.7px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    flexShrink: 0
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#fff',
                      animation: 'activeGlow 1.8s ease-in-out infinite'
                    }} />
                    Ahora
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                fontWeight: 600,
                textDecoration: block.is_completed ? 'line-through' : 'none',
                color: 'var(--text-main)',
                margin: 0,
                lineHeight: 1.3
              }}>
                {block.title}
              </h3>

              {/* Chips row — simplified to max 2 chips */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '20px',
                  backgroundColor: cardStyle.badgeBg,
                  color: cardStyle.badgeColor
                }}>
                  {cardStyle.label}
                </span>

                {block.requires_pc !== undefined && (
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    backgroundColor: block.requires_pc ? 'rgba(46, 115, 232, 0.08)' : 'rgba(107, 102, 97, 0.07)',
                    color: block.requires_pc ? '#2D73E8' : 'var(--text-muted)'
                  }}>
                    {block.requires_pc ? '💻 PC' : '📓 Offline'}
                  </span>
                )}

                {targetIncome && (
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    color: '#27AE60'
                  }}>
                    {targetIncome}
                  </span>
                )}

                {/* Subtask mini counter — only when collapsed */}
                {!isExpanded && !isActive && subtaskCount > 0 && (
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    backgroundColor: subtaskDone === subtaskCount ? 'rgba(0,200,150,0.12)' : 'rgba(10,42,30,0.05)',
                    color: subtaskDone === subtaskCount ? '#00A87A' : 'var(--text-muted)'
                  }}>
                    ✓ {subtaskDone}/{subtaskCount}
                  </span>
                )}

                {/* Notes indicator — only when collapsed and has notes */}
                {!isExpanded && !isActive && hasNotes && (
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(29, 125, 140, 0.08)',
                    color: '#1D7D8C'
                  }}>
                    📝 Nota
                  </span>
                )}
              </div>
            </div>

            {/* Actions: play + check */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '10px' }}>
              <button
                onClick={(e) => { e.stopPropagation(); onStartImmersion && onStartImmersion(block); }}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--accent-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  borderRadius: '50%',
                  minWidth: '44px',
                  minHeight: '44px'
                }}
                title="Iniciar Modo Inmersión"
              >
                <FiPlay size={18} />
              </button>

              <button
                onClick={handleCheckClick}
                onPointerDown={(e) => e.stopPropagation()}
                className={justCompleted ? 'check-bounce' : ''}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: block.is_completed ? '#00C896' : 'rgba(10,42,30,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  borderRadius: '50%',
                  minWidth: '44px',
                  minHeight: '44px',
                  transition: 'color 0.25s ease'
                }}
              >
                {block.is_completed
                  ? <FiCheckCircle size={26} />
                  : <FiCircle size={26} />
                }
              </button>
            </div>
          </div>

          {/* ──── EXPANDED CONTENT ──── */}
          {(isActive || isExpanded) && (
            <div style={{
              borderTop: '1px solid rgba(10,42,30,0.07)',
              paddingTop: '12px',
              marginTop: '2px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              animation: 'cardSlideIn 0.22s ease forwards'
            }}>

              {/* ── NOTES PREVIEW INLINE ── */}
              {hasNotes && (
                <div
                  onClick={(e) => { e.stopPropagation(); onOpenNotes(block); }}
                  style={{
                    background: 'rgba(29, 125, 140, 0.06)',
                    border: '1px solid rgba(29, 125, 140, 0.14)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                    <FiFileText size={12} color="#1D7D8C" />
                    <span style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 700,
                      color: '#1D7D8C',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px'
                    }}>
                      Notas guardadas
                    </span>
                  </div>
                  <p style={{
                    fontSize: '13px',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--text-main)',
                    margin: 0,
                    lineHeight: 1.45,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {block.notes}
                  </p>
                  <span style={{
                    fontSize: '10px',
                    color: '#1D7D8C',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    display: 'block',
                    marginTop: '5px'
                  }}>
                    Tocar para editar →
                  </span>
                </div>
              )}

              {/* No notes placeholder */}
              {!hasNotes && (
                <div
                  onClick={(e) => { e.stopPropagation(); onOpenNotes(block); }}
                  style={{
                    background: 'rgba(10,42,30,0.03)',
                    border: '1px dashed rgba(10,42,30,0.12)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FiFileText size={13} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                  <span style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic'
                  }}>
                    Sin notas · toca para añadir
                  </span>
                </div>
              )}

              {/* Subtasks */}
              {block.subtasks && block.subtasks.length > 0 && block.subtasks.map((s: Subtask) => (
                <div key={s.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: s.is_completed ? 0.55 : 1,
                  minHeight: '44px',
                  padding: '0 2px'
                }}>
                  <div
                    onClick={(e) => { e.stopPropagation(); onToggleSubtask && onToggleSubtask(block.id, s.id, s.is_completed); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, minHeight: '44px' }}
                  >
                    {s.is_completed
                      ? <FiCheckSquare size={17} color="#00C896" />
                      : <FiSquare size={17} color="var(--text-muted)" />
                    }
                    <span style={{
                      fontSize: '13.5px',
                      fontFamily: 'var(--font-sans)',
                      textDecoration: s.is_completed ? 'line-through' : 'none',
                      color: 'var(--text-main)',
                      lineHeight: 1.3
                    }}>
                      {s.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSubtask && onDeleteSubtask(block.id, s.id); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      opacity: 0.45,
                      cursor: 'pointer',
                      padding: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: '44px',
                      minWidth: '44px',
                      justifyContent: 'center'
                    }}
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              ))}

              {/* Add subtask */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newSubtaskTitle.trim()) return;
                  onAddSubtask && onAddSubtask(block.id, newSubtaskTitle);
                  setNewSubtaskTitle('');
                }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Añadir subtarea..."
                  style={{
                    flex: 1,
                    border: 'none',
                    borderBottom: '1.5px solid var(--border-color)',
                    background: 'none',
                    padding: '8px 0',
                    fontSize: '13px',
                    color: 'var(--text-main)',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)',
                    minHeight: '44px'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-color)',
                    cursor: 'pointer',
                    fontSize: '22px',
                    fontWeight: 300,
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '44px',
                    minHeight: '44px'
                  }}
                >
                  +
                </button>
              </form>

              {/* Action bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '4px',
                borderTop: '1px solid rgba(10,42,30,0.05)',
                paddingTop: '8px'
              }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onEditBlock && onEditBlock(block); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    minHeight: '44px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600
                  }}
                >
                  <FiEdit2 size={13} />
                  <span>Editar</span>
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteBlock && onDeleteBlock(block.id); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#D46A43',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    minHeight: '44px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600
                  }}
                >
                  <FiTrash2 size={13} />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
