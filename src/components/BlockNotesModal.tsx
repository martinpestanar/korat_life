import type { TimeBlock } from './TimeBlockCard';
import { FiX } from 'react-icons/fi';
import { useState, useEffect } from 'react';

export default function BlockNotesModal({ 
  block, 
  onClose, 
  onSave 
}: { 
  block: TimeBlock | null, 
  onClose: () => void, 
  onSave: (id: string, notes: string) => void 
}) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (block) {
      setNotes(block.notes || '');
    }
  }, [block]);

  if (!block) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 9999,
          backdropFilter: 'blur(2px)'
        }} 
      />
      
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        backgroundColor: 'var(--bg-app)',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        padding: '24px 24px calc(24px + 64px + env(safe-area-inset-bottom))',
        zIndex: 10000,
        boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxHeight: '85vh'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', margin: 0 }}>
            Notas: {block.title}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <FiX size={24} />
          </button>
        </div>

        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe tus notas de trabajo aquí..."
          style={{
            width: '100%',
            height: '200px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '16px',
            fontFamily: 'var(--font-sans)',
            fontSize: '15px',
            color: 'var(--text-main)',
            resize: 'none',
            outline: 'none'
          }}
        />

        <button 
          onClick={() => onSave(block.id, notes)}
          style={{
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '16px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            marginTop: '8px',
            backgroundColor: 'var(--accent-color)',
            color: 'white'
          }}
        >
          Guardar Notas
        </button>
      </div>
    </>
  );
}
