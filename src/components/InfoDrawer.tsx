import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

interface InfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function InfoDrawer({ isOpen, onClose, title, children }: InfoDrawerProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(25, 25, 25, 0.35)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 900,
          animation: 'fadeIn 0.2s ease'
        }}
      />

      {/* Drawer Panel */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        backgroundColor: '#FAF5ED',
        borderRadius: '24px 24px 0 0',
        padding: '20px 24px calc(32px + env(safe-area-inset-bottom))',
        zIndex: 901,
        boxShadow: '0 -8px 40px rgba(25, 25, 25, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        <style>{`
          @keyframes slideUp {
            from { transform: translateX(-50%) translateY(100%); }
            to   { transform: translateX(-50%) translateY(0); }
          }
        `}</style>

        {/* Handle bar */}
        <div style={{
          width: '36px',
          height: '4px',
          borderRadius: '2px',
          backgroundColor: 'var(--border-color)',
          margin: '-4px auto 4px'
        }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '20px',
            fontWeight: 'normal',
            color: 'var(--text-main)',
            margin: 0,
            lineHeight: 1.3,
            flex: 1,
            paddingRight: '12px'
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(25, 25, 25, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              flexShrink: 0
            }}
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />

        {/* Content */}
        <div style={{
          fontSize: '14px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1.65,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {children}
        </div>
      </div>
    </>
  );
}
