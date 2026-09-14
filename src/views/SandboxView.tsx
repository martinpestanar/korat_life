import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SandboxView() {
  const navigate = useNavigate();
  const [scratchpad, setScratchpad] = useState(() => {
    return localStorage.getItem('korat_sandbox_notes') || '// 🧪 Korat Sandbox - Espacio de Pruebas Sucias\n// Escribe tus ideas, snippets o prueba estados aquí.';
  });
  const [counter, setCounter] = useState(0);
  const [activeTab, setActiveTab] = useState<'scratchpad' | 'components' | 'system'>('scratchpad');

  useEffect(() => {
    localStorage.setItem('korat_sandbox_notes', scratchpad);
  }, [scratchpad]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-app)',
      padding: '20px 16px 40px 16px',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
      boxSizing: 'border-box'
    }}>
      {/* Top Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            padding: '8px 14px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-main)',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
          }}
        >
          <span>← Volver al Lab</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(212, 106, 67, 0.1)',
          color: 'var(--accent-color)',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 700
        }}>
          <span>🧪 Sandbox Mode</span>
        </div>
      </header>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        backgroundColor: 'rgba(0,0,0,0.04)',
        padding: '4px',
        borderRadius: '14px',
        marginBottom: '16px'
      }}>
        <button
          onClick={() => setActiveTab('scratchpad')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeTab === 'scratchpad' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'scratchpad' ? 'var(--text-main)' : 'var(--text-muted)',
            boxShadow: activeTab === 'scratchpad' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
          }}
        >
          📝 Scratchpad
        </button>
        <button
          onClick={() => setActiveTab('components')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeTab === 'components' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'components' ? 'var(--text-main)' : 'var(--text-muted)',
            boxShadow: activeTab === 'components' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
          }}
        >
          🧩 Componentes
        </button>
        <button
          onClick={() => setActiveTab('system')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeTab === 'system' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'system' ? 'var(--text-main)' : 'var(--text-muted)',
            boxShadow: activeTab === 'system' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
          }}
        >
          ⚙️ Variables
        </button>
      </div>

      {/* Tab 1: Scratchpad */}
      {activeTab === 'scratchpad' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Bloc de notas rápido (auto-guardado local):</span>
            <button
              onClick={() => setScratchpad('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#b91c1c',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Limpiar
            </button>
          </div>
          <textarea
            value={scratchpad}
            onChange={(e) => setScratchpad(e.target.value)}
            placeholder="Escribe notas, estructuras JSON, ideas de features o pruebas..."
            style={{
              flex: 1,
              minHeight: '340px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: 1.5,
              color: 'var(--text-main)',
              outline: 'none',
              resize: 'none',
              boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
            }}
          />
        </div>
      )}

      {/* Tab 2: Components Testbench */}
      {activeTab === 'components' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0' }}>
              Estado & Contador React
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setCounter(c => c - 1)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#F3F4F6',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                -
              </button>
              <span style={{ fontSize: '20px', fontWeight: 700, minWidth: '40px', textAlign: 'center' }}>
                {counter}
              </span>
              <button
                onClick={() => setCounter(c => c + 1)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--accent-color)',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>
          </div>

          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0' }}>
              Botones de Estilo Korat
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn-tropical" style={{ width: '100%' }}>
                Botón Tropical Gradient
              </button>
              <button className="btn-primary" style={{ width: '100%' }}>
                Botón Imperial Green
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: System Variables */}
      {activeTab === 'system' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          fontSize: '12.5px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
            Paleta de Tokens Activa
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '6px', backgroundColor: 'var(--accent-color)' }} />
            <span>--accent-color: #D46A43 (Terracotta)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '6px', backgroundColor: 'var(--text-main)' }} />
            <span>--text-main: #0A2A1E (Imperial Green)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '6px', backgroundColor: 'var(--accent-light)' }} />
            <span>--accent-light: #E6B033 (Ipanema Gold)</span>
          </div>
        </div>
      )}
    </div>
  );
}
