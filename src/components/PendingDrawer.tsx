import { FiAlertCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useState } from 'react';
import type { TimeBlock } from './TimeBlockCard';

export default function PendingDrawer({ pendingBlocks, onIntegrate }: { pendingBlocks: TimeBlock[], onIntegrate: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  if (pendingBlocks.length === 0) return null;

  return (
    <div style={{
      backgroundColor: 'var(--bg-app)',
      borderBottom: '1px solid var(--border-color)',
      padding: '12px 20px',
    }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiAlertCircle size={18} color="var(--accent-color)" />
          <span>{pendingBlocks.length} {pendingBlocks.length === 1 ? 'bloque pendiente' : 'bloques pendientes'} de ayer</span>
        </div>
        {isOpen ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
      </div>

      {isOpen && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {pendingBlocks.map(block => (
            <div key={block.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-card)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              <span>{block.title}</span>
              <button 
                onClick={() => onIntegrate(block.id)}
                style={{
                  backgroundColor: 'var(--text-main)',
                  color: 'var(--bg-app)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Integrar hoy
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
