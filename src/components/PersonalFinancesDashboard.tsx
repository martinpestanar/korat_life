import { useState } from 'react';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';
import { FiShield, FiArrowUpRight, FiArrowDownRight, FiPlus, FiTrash2 } from 'react-icons/fi';

export default function PersonalFinancesDashboard() {
  const {
    finances,
    setFinances,
    survivalDays,
    setSurvivalDays,
    incomes,
    expenses,
    refreshFinances
  } = useData();

  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [bankBalanceInput, setBankBalanceInput] = useState(finances.bank_balance?.toString() || '0');
  const [cashBalanceInput, setCashBalanceInput] = useState(finances.cash_balance?.toString() || '0');

  // Quick Income Form state
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incDesc, setIncDesc] = useState('');
  const [incAmount, setIncAmount] = useState('');

  // Quick Expense Form state
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');

  const totalBalance = (finances.bank_balance || 0) + (finances.cash_balance || 0);

  const handleSaveSubBalances = async () => {
    const bank = parseFloat(bankBalanceInput) || 0;
    const cash = parseFloat(cashBalanceInput) || 0;
    const newTotal = bank + cash;

    setFinances(prev => ({
      ...prev,
      bank_balance: bank,
      cash_balance: cash,
      total_balance: newTotal
    }));

    await supabase.from('finances').update({
      bank_balance: bank,
      cash_balance: cash,
      total_balance: newTotal
    }).eq('id', 1);

    const { data: daysData } = await supabase.rpc('calculate_survival_days');
    if (daysData !== null) setSurvivalDays(daysData);

    setIsEditingBalance(false);
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incDesc.trim() || !incAmount) return;

    await supabase.from('income_pipeline').insert({
      description: incDesc.trim(),
      amount: parseFloat(incAmount),
      status: 'pending'
    });

    setIncDesc('');
    setIncAmount('');
    setShowIncomeForm(false);
    refreshFinances();
  };

  const handleCollectIncome = async (id: string, amount: number) => {
    await supabase.from('income_pipeline').update({ status: 'collected' }).eq('id', id);
    const newTotal = totalBalance + amount;
    const newBank = (finances.bank_balance || 0) + amount;

    setFinances(prev => ({ ...prev, total_balance: newTotal, bank_balance: newBank }));
    await supabase.from('finances').update({ total_balance: newTotal, bank_balance: newBank }).eq('id', 1);
    refreshFinances();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc.trim() || !expAmount) return;

    await supabase.from('expenses').insert({
      description: expDesc.trim(),
      amount: parseFloat(expAmount),
      frequency: 'monthly'
    });

    setExpDesc('');
    setExpAmount('');
    setShowExpenseForm(false);
    refreshFinances();
  };

  const handleDeleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    refreshFinances();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 1. iOS Wallet Net Worth Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0A2A1E 0%, #104D30 100%)',
        color: 'white',
        borderRadius: '24px',
        padding: '22px',
        boxShadow: '0 8px 24px rgba(10, 42, 30, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#E6B033', fontFamily: 'var(--font-sans)' }}>
            Patrimonio Líquido Total
          </span>
          <button
            onClick={() => {
              if (isEditingBalance) handleSaveSubBalances();
              else {
                setBankBalanceInput(finances.bank_balance?.toString() || '0');
                setCashBalanceInput(finances.cash_balance?.toString() || '0');
                setIsEditingBalance(true);
              }
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '12px',
              padding: '4px 10px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isEditingBalance ? 'Guardar' : 'Ajustar'}
          </button>
        </div>

        {!isEditingBalance ? (
          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-sans)', letterSpacing: '-0.5px' }}>
              ${totalBalance.toLocaleString()} <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>USD</span>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Banco / Cuentas</span>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>${(finances.bank_balance || 0).toLocaleString()}</div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Efectivo / Cash</span>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>${(finances.cash_balance || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>Banco ($ USD):</label>
              <input
                type="number"
                value={bankBalanceInput}
                onChange={e => setBankBalanceInput(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>Efectivo ($ USD):</label>
              <input
                type="number"
                value={cashBalanceInput}
                onChange={e => setCashBalanceInput(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Runway & Freedom Gauge Card */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '16px 18px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'rgba(16, 77, 48, 0.1)', color: 'var(--accent-green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FiShield size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
              Colchón de Supervivencia (Runway)
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-sans)', color: 'var(--text-main)' }}>
              {survivalDays} Días <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>de libertad</span>
            </div>
          </div>
        </div>

        <span style={{
          fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px',
          background: survivalDays > 90 ? 'rgba(16, 77, 48, 0.1)' : 'rgba(230, 176, 51, 0.15)',
          color: survivalDays > 90 ? 'var(--accent-green)' : '#9E7200'
        }}>
          {survivalDays > 90 ? '🌾 Seguro' : '⚠️ Acción'}
        </span>
      </div>

      {/* 3. Income Pipeline (Cobros Pendientes) */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '16px 18px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)' }}>
            <FiArrowUpRight size={16} />
            <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
              Cobros Pendientes & Pipeline
            </span>
          </div>

          <button
            onClick={() => setShowIncomeForm(!showIncomeForm)}
            style={{
              background: 'transparent', border: 'none', color: 'var(--accent-green)',
              cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px'
            }}
          >
            <FiPlus size={13} /> Añadir Ingreso
          </button>
        </div>

        {showIncomeForm && (
          <form onSubmit={handleAddIncome} style={{ display: 'flex', gap: '6px', background: 'var(--bg-app)', padding: '10px', borderRadius: '12px' }}>
            <input
              type="text" placeholder="Cliente / Proyecto" value={incDesc}
              onChange={e => setIncDesc(e.target.value)}
              style={{ flex: 2, padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px' }} required
            />
            <input
              type="number" placeholder="$ USD" value={incAmount}
              onChange={e => setIncAmount(e.target.value)}
              style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px' }} required
            />
            <button type="submit" style={{ padding: '6px 10px', borderRadius: '6px', background: 'var(--text-main)', color: 'white', border: 'none', fontSize: '11px', fontWeight: 600 }}>
              +
            </button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {incomes && incomes.filter(i => i.status === 'pending').map(item => (
            <div key={item.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 10px', borderRadius: '10px', background: 'var(--bg-app)'
            }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{item.description}</span>
                <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 700 }}>+${item.amount} USD</div>
              </div>

              <button
                onClick={() => handleCollectIncome(item.id, item.amount)}
                style={{
                  background: 'var(--accent-green)', color: 'white', border: 'none',
                  borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cobrar
              </button>
            </div>
          ))}
          {(!incomes || incomes.filter(i => i.status === 'pending').length === 0) && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin cobros pendientes registrados.</span>
          )}
        </div>
      </div>

      {/* 4. Gastos Fijos (Fixed Expenses) */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '16px 18px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-color)' }}>
            <FiArrowDownRight size={16} />
            <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
              Gastos Fijos Mensuales
            </span>
          </div>

          <button
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            style={{
              background: 'transparent', border: 'none', color: 'var(--accent-color)',
              cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px'
            }}
          >
            <FiPlus size={13} /> Añadir Gasto
          </button>
        </div>

        {showExpenseForm && (
          <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '6px', background: 'var(--bg-app)', padding: '10px', borderRadius: '12px' }}>
            <input
              type="text" placeholder="Concepto (ej: Servidores SaaS)" value={expDesc}
              onChange={e => setExpDesc(e.target.value)}
              style={{ flex: 2, padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px' }} required
            />
            <input
              type="number" placeholder="$ USD" value={expAmount}
              onChange={e => setExpAmount(e.target.value)}
              style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px' }} required
            />
            <button type="submit" style={{ padding: '6px 10px', borderRadius: '6px', background: 'var(--accent-color)', color: 'white', border: 'none', fontSize: '11px', fontWeight: 600 }}>
              +
            </button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {expenses && expenses.map(item => (
            <div key={item.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 10px', borderRadius: '10px', background: 'var(--bg-app)'
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{item.description}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-color)' }}>-${item.amount} USD</span>
                <button onClick={() => handleDeleteExpense(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <FiTrash2 size={12} />
                </button>
              </div>
            </div>
          ))}
          {(!expenses || expenses.length === 0) && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin gastos fijos registrados.</span>
          )}
        </div>
      </div>

    </div>
  );
}
