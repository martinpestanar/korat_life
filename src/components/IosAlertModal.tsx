import { useState, useEffect } from 'react';

interface IosAlertModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  type?: 'confirm' | 'prompt';
  placeholder?: string;
  initialValue?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: (inputValue?: string) => void;
  onCancel: () => void;
}

export default function IosAlertModal({
  isOpen,
  title,
  message,
  type = 'confirm',
  placeholder = '',
  initialValue = '',
  confirmText = 'OK',
  cancelText = 'Cancelar',
  isDestructive = false,
  onConfirm,
  onCancel
}: IosAlertModalProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1300,
      padding: '20px',
      animation: 'fadeIn 0.15s ease-out'
    }}>
      <div 
        style={{
          width: '270px',
          backgroundColor: 'rgba(245, 245, 245, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
          animation: 'iosScaleIn 0.2s cubic-bezier(0.1, 0.8, 0.25, 1)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          border: '0.5px solid rgba(0, 0, 0, 0.12)',
          overflow: 'hidden'
        }}
      >
        {/* Style for Animations */}
        <style>{`
          @keyframes iosScaleIn {
            from { transform: scale(1.1); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>

        {/* Content Section */}
        <div style={{ padding: '18px 16px', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#000', lineHeight: 1.3 }}>
            {title}
          </h3>
          {message && (
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#000', opacity: 0.8, lineHeight: 1.35, fontWeight: 400 }}>
              {message}
            </p>
          )}

          {/* Input for Prompt Mode */}
          {type === 'prompt' && (
            <input
              type="text"
              placeholder={placeholder}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') onConfirm(inputValue);
              }}
              style={{
                marginTop: '14px',
                width: '100%',
                backgroundColor: '#FFF',
                border: '0.5px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '13px',
                color: '#000',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          )}
        </div>

        {/* Divider line */}
        <div style={{ height: '0.5px', backgroundColor: 'rgba(0, 0, 0, 0.15)' }} />

        {/* Actions Button Grid */}
        <div style={{ display: 'flex', width: '100%', height: '44px' }}>
          {/* Cancel Button */}
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: '17px',
              color: '#007AFF',
              fontFamily: 'inherit',
              fontWeight: 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}
          >
            {cancelText}
          </button>

          {/* Vertical divider */}
          <div style={{ width: '0.5px', backgroundColor: 'rgba(0, 0, 0, 0.15)' }} />

          {/* Confirm Button */}
          <button
            onClick={() => onConfirm(inputValue)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: '17px',
              color: isDestructive ? '#FF3B30' : '#007AFF',
              fontFamily: 'inherit',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}
