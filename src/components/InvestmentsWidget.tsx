import { useState, useEffect } from 'react';
import { FiTrendingUp, FiPlus, FiTrash2 } from 'react-icons/fi';

export interface InvestmentGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: 'freedom' | 'emergency' | 'crypto_stocks' | 'saas';
}

const DEFAULT_INVESTMENTS: InvestmentGoal[] = [
  {
    id: 'inv_1',
    name: 'Fondo Libertad Río 2027 🏖️',
    targetAmount: 15000,
    currentAmount: 3200,
    category: 'freedom'
  },
  {
    id: 'inv_2',
    name: 'Colchón de Emergencia (6 Meses) 🛡️',
    targetAmount: 5000,
    currentAmount: 1800,
    category: 'emergency'
  },
  {
    id: 'inv_3',
    name: 'Portafolio de Inversión / Cripto & ETF 📈',
    targetAmount: 10000,
    currentAmount: 1200,
    category: 'crypto_stocks'
  }
];

export default function InvestmentsWidget() {
  const [investments, setInvestments] = useState<InvestmentGoal[]>(() => {
    const cached = localStorage.getItem('korat_personal_investments');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return DEFAULT_INVESTMENTS;
  });

  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');

  useEffect(() => {
    localStorage.setItem('korat_personal_investments', JSON.stringify(investments));
  }, [investments]);

  const totalInvested = investments.reduce((acc, item) => acc + item.currentAmount, 0);
  const totalTarget = investments.reduce((acc, item) => acc + item.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalInvested / totalTarget) * 100) : 0;

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) return;

    const newGoal: InvestmentGoal = {
      id: 'inv_' + Date.now(),
      name: name.trim(),
      targetAmount: parseFloat(targetAmount) || 0,
      currentAmount: parseFloat(currentAmount) || 0,
      category: 'freedom'
    };

    setInvestments(prev => [...prev, newGoal]);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setShowAddForm(false);
  };

  const handleUpdateAmount = (id: string, delta: number) => {
    setInvestments(prev => prev.map(inv => {
      if (inv.id === id) {
        const nextVal = Math.max(0, inv.currentAmount + delta);
        return { ...inv, currentAmount: nextVal };
      }
      return inv;
    }));
  };

  const handleDeleteGoal = (id: string) => {
    setInvestments(prev => prev.filter(inv => inv.id !== id));
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '24px',
      padding: '20px',
      border: '1px solid var(--border-color)',
      boxShadow: '0 4px 20px rgba(10, 42, 30, 0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)' }}>
            <FiTrendingUp size={16} />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-sans)' }}>
              Inversiones & Libertad Financiera
            </span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-sans)', color: 'var(--text-main)', marginTop: '2px' }}>
            ${totalInvested.toLocaleString()} USD
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '6px' }}>
              ({overallProgress}% de meta global)
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <FiPlus size={13} />
          <span>Nueva Meta</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddGoal} style={{
          background: 'var(--bg-app)',
          padding: '14px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <input
            type="text"
            placeholder="Nombre de la meta (ej: Acciones / ETFs)"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              outline: 'none'
            }}
            required
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              placeholder="Meta $ USD"
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                outline: 'none'
              }}
              required
            />
            <input
              type="number"
              placeholder="Ahorrado hoy $ USD"
              value={currentAmount}
              onChange={e => setCurrentAmount(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                fontSize: '12px',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--text-main)',
                color: 'var(--bg-app)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Guardar Meta
            </button>
          </div>
        </form>
      )}

      {/* Investment List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {investments.map(inv => {
          const percent = inv.targetAmount > 0 ? Math.min(100, Math.round((inv.currentAmount / inv.targetAmount) * 100)) : 0;

          return (
            <div key={inv.id} style={{
              padding: '12px 14px',
              borderRadius: '16px',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600, fontFamily: 'var(--font-sans)', color: 'var(--text-main)' }}>
                  {inv.name}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => handleUpdateAmount(inv.id, 50)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: 'var(--accent-green)'
                    }}
                  >
                    +$50
                  </button>

                  <button
                    onClick={() => handleDeleteGoal(inv.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-sans)', color: 'var(--accent-green)' }}>
                  ${inv.currentAmount.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>/ ${inv.targetAmount.toLocaleString()} USD</span>
                </span>

                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--font-sans)' }}>
                  {percent}%
                </span>
              </div>

              {/* Progress track */}
              <div style={{
                height: '6px',
                width: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${percent}%`,
                  background: 'linear-gradient(90deg, var(--accent-green), var(--accent-blue))',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
