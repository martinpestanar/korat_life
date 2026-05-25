import { FiCheckCircle, FiCircle, FiEdit2 } from 'react-icons/fi';

export interface Subtask {
  id: string;
  title: string;
  is_completed: boolean;
  daily_block_id: string;
  project_milestone_id?: string | null;
}

export interface TimeBlock {
  id: string;
  start_time: string;
  end_time: string;
  title: string;
  is_completed: boolean;
  notes?: string;
  pillar_id?: string;
  period?: string;
  template_id?: string | null;
  date?: string;
  subtasks?: Subtask[];
  pillars?: {
    id: string;
    name: string;
    label: string;
  };
}

interface TimeBlockCardProps {
  block: TimeBlock;
  onToggleComplete: (id: string, currentStatus: boolean) => void;
  onOpenNotes: (block: TimeBlock) => void;
}

export default function TimeBlockCard({ block, onToggleComplete, onOpenNotes }: TimeBlockCardProps) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      border: '1px solid var(--border-color)',
      transition: 'background-color 0.2s',
      opacity: block.is_completed ? 0.7 : 1
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <span style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: '13px', 
            color: 'var(--text-muted)' 
          }}>
            {block.start_time.slice(0, 5)} - {block.end_time.slice(0, 5)}
            {block.pillars && (
              <span style={{ fontStyle: 'italic', marginLeft: '8px', color: 'var(--accent-color)' }}>
                · Pilar {block.pillars.label.charAt(0) + block.pillars.label.slice(1).toLowerCase()}
              </span>
            )}
          </span>
          <h3 style={{ 
            fontFamily: 'var(--font-sans)', 
            fontSize: '16px', 
            fontWeight: 500,
            textDecoration: block.is_completed ? 'line-through' : 'none',
            color: 'var(--text-main)'
          }}>
            {block.title}
          </h3>
        </div>
        
        <button 
          onClick={() => onToggleComplete(block.id, block.is_completed)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: block.is_completed ? 'var(--accent-color)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px'
          }}
        >
          {block.is_completed ? <FiCheckCircle size={24} /> : <FiCircle size={24} />}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={() => onOpenNotes(block)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            padding: '4px 8px',
            borderRadius: '6px'
          }}
        >
          <FiEdit2 size={14} />
          <span>{block.notes ? 'Ver Notas' : 'Añadir Notas'}</span>
        </button>
      </div>
    </div>
  );
}
