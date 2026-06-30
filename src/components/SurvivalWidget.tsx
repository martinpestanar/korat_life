import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FiCheck, FiPlus, FiTrash2, FiClock, FiX, FiArchive, FiInfo } from 'react-icons/fi';
import InfoDrawer from './InfoDrawer';

import { useData, type IncomeItem, type RecurringIncomeItem } from '../context/DataContext';

export default function SurvivalWidget() {
  const {
    finances,
    setFinances,
    survivalDays: _survivalDays,
    setSurvivalDays,
    incomes,
    recurringIncomes,
    expenses,
    debts,
    monthlyCloses,
    loadingFinances,
    refreshFinances: fetchData
  } = useData();

  const loading = loadingFinances && finances.total_balance === 0;

  // Projection Scenarios and Safety Haircuts
  const [scenario] = useState<'actual' | 'meta'>('actual');
  const [safetyHaircut] = useState<number>(0.6); // 60% risk confidence default (40% haircut)
  const [homeTargetMonthly] = useState<number>(800); // Dynamic target home contribution

  // Step-by-step retrospectiva states
  const [joyProject, setJoyProject] = useState('');
  const [focusLeak, setFocusLeak] = useState('');
  const [habitToPolish, setHabitToPolish] = useState('');
  const [closeStep, setCloseStep] = useState<1 | 2 | 3 | 4>(1);
  const [expandedCloseId, setExpandedCloseId] = useState<string | null>(null);

  // Form toggles & inputs
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incDesc, setIncDesc] = useState('');
  const [incAmount, setIncAmount] = useState('');
  const [incDueDate, setIncDueDate] = useState('');

  const [showRecForm, setShowRecForm] = useState(false);
  const [recDesc, setRecDesc] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recFreq, setRecFreq] = useState<'weekly' | 'monthly'>('weekly');

  // Variable payout state
  const [injectingIncomeId, setInjectingIncomeId] = useState<string | null>(null);
  const [actualPayout, setActualPayout] = useState('');

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expFreq, setExpFreq] = useState<'weekly' | 'monthly'>('weekly');

  const [showDebtForm, setShowDebtForm] = useState(false);
  const [debtDesc, setDebtDesc] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');

  // Closing flow states
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Info Drawer states
  const [infoDrawer, setInfoDrawer] = useState<string | null>(null);
  const openInfo = (key: string) => setInfoDrawer(key);
  const closeInfo = () => setInfoDrawer(null);

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateSubBalance = async (field: 'bank_balance' | 'cash_balance', val: string) => {
    const num = parseFloat(val) || 0;
    const updatedFinances = { ...finances, [field]: num };
    const newTotal = (updatedFinances.bank_balance || 0) + (updatedFinances.cash_balance || 0);
    updatedFinances.total_balance = newTotal;
    
    setFinances(updatedFinances);
    
    await supabase.from('finances').update({ 
      [field]: num,
      total_balance: newTotal
    }).eq('id', 1);
    
    const { data: daysData } = await supabase.rpc('calculate_survival_days');
    if (daysData !== null) setSurvivalDays(daysData);
  };

  // Add Income
  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incDesc.trim() || !incAmount) return;
    try {
      const { error } = await supabase.from('income_pipeline').insert({
        description: incDesc,
        amount: parseFloat(incAmount),
        due_date: incDueDate || null,
        status: 'pending'
      });
      if (error) throw error;
      setIncDesc('');
      setIncAmount('');
      setIncDueDate('');
      setShowIncomeForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Mark income as collected
  const handleCollectIncome = async (item: IncomeItem) => {
    try {
      const { error: incErr } = await supabase
        .from('income_pipeline')
        .update({ status: 'collected' })
        .eq('id', item.id);
      if (incErr) throw incErr;

      const newBalance = finances.total_balance + item.amount;
      const newBankBalance = (finances.bank_balance || 0) + item.amount;
      
      setFinances(prev => ({ 
        ...prev, 
        total_balance: newBalance,
        bank_balance: newBankBalance
      }));
      
      const { error: finErr } = await supabase
        .from('finances')
        .update({ 
          total_balance: newBalance,
          bank_balance: newBankBalance
        })
        .eq('id', 1);
      if (finErr) throw finErr;

      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (!confirm('¿Eliminar este ingreso?')) return;
    await supabase.from('income_pipeline').delete().eq('id', id);
    fetchData();
  };

  // Add Recurring Income
  const handleAddRecurringIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recDesc.trim() || !recAmount) return;
    try {
      const { error } = await supabase.from('recurring_incomes').insert({
        description: recDesc,
        amount: parseFloat(recAmount),
        frequency: recFreq
      });
      if (error) throw error;
      setRecDesc('');
      setRecAmount('');
      setShowRecForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRecurringIncome = async (id: string) => {
    if (!confirm('¿Eliminar este ingreso recurrente?')) return;
    await supabase.from('recurring_incomes').delete().eq('id', id);
    fetchData();
  };

  // Inject Variable Real Payout
  const handleInjectPayout = async (_item: RecurringIncomeItem) => {
    const amount = parseFloat(actualPayout) || 0;
    if (amount <= 0) return;
    
    try {
      const newBankBalance = (finances.bank_balance || 0) + amount;
      const newTotal = newBankBalance + (finances.cash_balance || 0);
      
      setFinances(prev => ({
        ...prev,
        bank_balance: newBankBalance,
        total_balance: newTotal
      }));
      
      await supabase.from('finances').update({
        bank_balance: newBankBalance,
        total_balance: newTotal
      }).eq('id', 1);
      
      setActualPayout('');
      setInjectingIncomeId(null);
      fetchData();
      alert(`¡S/. ${amount} cobrados e inyectados con éxito a tu BCP / Yape!`);
    } catch (e) {
      console.error(e);
    }
  };

  // Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc.trim() || !expAmount) return;
    try {
      const { error } = await supabase.from('expenses').insert({
        description: expDesc,
        amount: parseFloat(expAmount),
        frequency: expFreq
      });
      if (error) throw error;
      setExpDesc('');
      setExpAmount('');
      setShowExpenseForm(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al registrar el gasto');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    fetchData();
  };

  // Add Debt
  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtDesc.trim() || !debtAmount || !debtDueDate) return;
    try {
      const { error } = await supabase.from('debts').insert({
        description: debtDesc,
        total_amount: parseFloat(debtAmount),
        due_date: debtDueDate
      });
      if (error) throw error;
      setDebtDesc('');
      setDebtAmount('');
      setDebtDueDate('');
      setShowDebtForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!confirm('¿Eliminar esta deuda?')) return;
    await supabase.from('debts').delete().eq('id', id);
    fetchData();
  };

  // Perform Monthly Close
  const handlePerformClose = async () => {
    try {
      const { error } = await supabase.rpc('perform_monthly_close', {
        p_joy_project: joyProject.trim() || null,
        p_focus_leak: focusLeak.trim() || null,
        p_habit_to_polish: habitToPolish.trim() || null
      });
      if (error) throw error;

      alert(`🔒 ¡Cierre contable completado con éxito! Se archivó tu balance e historial introspectivo.`);
      setShowCloseModal(false);
      
      // Reset step states
      setJoyProject('');
      setFocusLeak('');
      setHabitToPolish('');
      setCloseStep(1);
      
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Error al realizar el cierre mensual');
    }
  };

  const getDaysLeft = (dueDateStr: string) => {
    const diff = new Date(dueDateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Calculate Unified Rates (Base)
  const weeklyExpensesSum = expenses.filter(e => e.frequency === 'weekly').reduce((acc, e) => acc + e.amount, 0);
  const monthlyExpensesSum = expenses.filter(e => e.frequency === 'monthly').reduce((acc, e) => acc + e.amount, 0);
  const unifiedBurnRate = weeklyExpensesSum + (monthlyExpensesSum / 4.33);

  const weeklyIncomesSum = recurringIncomes.filter(r => r.frequency === 'weekly').reduce((acc, r) => acc + r.amount, 0);
  const monthlyIncomesSum = recurringIncomes.filter(r => r.frequency === 'monthly').reduce((acc, r) => acc + r.amount, 0);
  const unifiedIncomeRate = weeklyIncomesSum + (monthlyIncomesSum / 4.33);

  // Dynamic calculations based on active scenario & safety haircut
  const homeTargetWeekly = homeTargetMonthly / 4.33;
  
  const activeBurnRate = scenario === 'meta' ? (unifiedBurnRate + homeTargetWeekly) : unifiedBurnRate;
  const activeIncomeRate = unifiedIncomeRate * safetyHaircut;
  const activeNetBurnRate = activeBurnRate - activeIncomeRate;
  
  const activeSurvivalDays = activeNetBurnRate <= 0
    ? Infinity
    : Math.max(0, Math.floor(finances.total_balance / (activeNetBurnRate / 7)));

  // Statistics for active closing month
  const collectedIncomesSum = incomes.filter(i => i.status === 'collected').reduce((acc, i) => acc + i.amount, 0);
  const estimatedExpensesMonth = unifiedBurnRate * 4.33;
  const netEarningsMonth = collectedIncomesSum - estimatedExpensesMonth;



  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando finanzas clínicas...</div>;

  return (
    <>
    <div style={{ padding: '0 0 40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 1. Meta Río 2027 */}
      {(() => {
        const rioGoalAmount = 15000; // S/. 15,000 de meta
        const rioProgressPercent = Math.min((finances.total_balance / rioGoalAmount) * 100, 100);
        return (
          <div className="glass-card" style={{
            margin: '20px 20px 0 20px',
            padding: '24px',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FCFAF6 100%)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>
                Meta Río 2027 🇧🇷
              </h2>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {rioProgressPercent.toFixed(0)}% Ahorrado
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
              "Facturando y potenciando mi marca hoy para volver a pisar la arena brasileña y escuchar Bossa Nova después de 10 años."
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>Ahorro Acumulado: S/. {finances.total_balance.toFixed(0)}</span>
              <span>Meta Río: S/. {rioGoalAmount.toLocaleString()}</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(10, 42, 30, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${rioProgressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-light) 0%, var(--accent-color) 100%)', transition: 'width 0.6s ease-out' }} />
            </div>
          </div>
        );
      })()}

      {/* 2. Métricas de Control (3 columnas) */}
      <div className="glass-card" style={{
        margin: '0 20px',
        padding: '20px',
        background: '#FFFFFF',
        border: '1px solid var(--border-color)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>Caja Total</span>
          <span style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: 'var(--accent-green)' }}>S/. {finances.total_balance.toFixed(0)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>Días Respaldo</span>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: activeSurvivalDays <= 15 ? 'var(--accent-color)' : 'var(--accent-green)', fontFamily: 'var(--font-serif)' }}>
            {activeSurvivalDays === Infinity ? '∞' : activeSurvivalDays}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>Gasto / mes</span>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>S/. {estimatedExpensesMonth.toFixed(0)}</span>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* SECCIÓN 1: LIQUIDEZ Y CONTROL DE RIESGOS */}
        <details className="glass-card" style={{ padding: '16px 20px' }}>
          <summary style={{ fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', outline: 'none' }}>
            🔧 Liquidez y Control de Riesgos
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px', cursor: 'default' }} onClick={e => e.stopPropagation()}>
            
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                Liquidez Disponible Global
              </label>
              <span style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', color: 'var(--text-main)' }}>
                S/. {finances.total_balance.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  BCP / Yape (Digital)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: '4px', fontSize: '13px' }}>S/.</span>
                  <input 
                    type="number"
                    value={finances.bank_balance !== undefined ? Number(finances.bank_balance) : ''}
                    onChange={(e) => handleUpdateSubBalance('bank_balance', e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '15px',
                      color: 'var(--text-main)',
                      fontFamily: 'var(--font-serif)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Efectivo en Casa
                </label>
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: '4px', fontSize: '13px' }}>S/.</span>
                  <input 
                    type="number"
                    value={finances.cash_balance !== undefined ? Number(finances.cash_balance) : ''}
                    onChange={(e) => handleUpdateSubBalance('cash_balance', e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '15px',
                      color: 'var(--text-main)',
                      fontFamily: 'var(--font-serif)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 2.5 Escudo de Volatilidad (Volatilidad & Gobernanza de Riesgo) */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                    🛡️ Mi Escudo de Volatilidad
                  </label>
                  <button
                    onClick={() => openInfo('diversification')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0, opacity: 0.7 }}
                  >
                    <FiInfo size={12} />
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-serif)', color: 'var(--text-main)' }}>
                    Nivel de Diversificación:
                  </span>
                  <span style={{
                    fontSize: '9px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 'bold',
                    padding: '3px 8px',
                    borderRadius: '10px',
                    backgroundColor: recurringIncomes.length === 1 
                      ? 'rgba(204, 101, 67, 0.15)' 
                      : recurringIncomes.length === 2 
                        ? 'rgba(212, 172, 13, 0.15)' 
                        : 'rgba(39, 174, 96, 0.15)',
                    color: recurringIncomes.length === 1 
                      ? 'var(--accent-color)' 
                      : recurringIncomes.length === 2 
                        ? '#D4AC0D' 
                        : '#27AE60'
                  }}>
                    {recurringIncomes.length === 0 
                      ? 'Sin ingresos' 
                      : recurringIncomes.length === 1 
                        ? 'Crítico (1 fuente)' 
                        : recurringIncomes.length === 2 
                          ? 'Seguro (2 fuentes)' 
                          : 'Diversificado 🎉'}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>Respaldo Familiar (Casa):</span>
                    <button
                      onClick={() => openInfo('buffer')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0, opacity: 0.7 }}
                    >
                      <FiInfo size={12} />
                    </button>
                  </div>
                  <strong style={{ fontFamily: 'var(--font-serif)' }}>
                    {Math.min(6, (finances.total_balance / (homeTargetMonthly || 1))).toFixed(1)} / 6 <span style={{ fontSize: '9px', fontFamily: 'var(--font-sans)', fontWeight: 'normal', color: 'var(--text-muted)' }}>meses</span>
                  </strong>
                </div>

                {/* Premium sleek progress bar */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'rgba(25, 25, 25, 0.05)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  position: 'relative',
                  marginTop: '4px'
                }}>
                  <div style={{
                    width: `${Math.min(100, (finances.total_balance / ((homeTargetMonthly || 1) * 6)) * 100)}%`,
                    height: '100%',
                    background: finances.total_balance >= homeTargetMonthly * 6 
                      ? 'linear-gradient(90deg, #27AE60 0%, #2ECC71 100%)' 
                      : finances.total_balance >= homeTargetMonthly * 3
                        ? 'linear-gradient(90deg, #D4AC0D 0%, #F1C40F 100%)'
                        : 'linear-gradient(90deg, var(--accent-color) 0%, var(--accent-light) 100%)',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            </div>

          </div>
        </details>

        {/* SECCIÓN 2: INGRESOS & FACTURACIÓN (MARCAS) */}
        <details className="glass-card" style={{ padding: '16px 20px' }} open>
          <summary style={{ fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', outline: 'none' }}>
            💰 Ingresos y Facturación de Marcas
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px', cursor: 'default' }} onClick={e => e.stopPropagation()}>
            
            {/* 3. Recurring Incomes (Flujo de Proyectos con ingresos variables) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', margin: 0 }}>
                  Inbound · Flujo Proyectos (Ingresos Variables)
                </h3>
                <button
                  onClick={() => setShowRecForm(!showRecForm)}
                  style={{
                    background: 'none', border: '1px solid var(--border-color)', borderRadius: '20px',
                    padding: '4px 12px', fontSize: '11px', fontFamily: 'var(--font-sans)',
                    color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <FiPlus size={12} />
                  <span>Nuevo Proyecto</span>
                </button>
              </div>

              {showRecForm && (
                <form onSubmit={handleAddRecurringIncome} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Descripción (ej: Facebook Páginas)"
                    value={recDesc}
                    onChange={e => setRecDesc(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
                    required
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="Monto Promedio S/."
                      value={recAmount}
                      onChange={e => setRecAmount(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
                      required
                    />
                    <select
                      value={recFreq}
                      onChange={e => setRecFreq(e.target.value as 'weekly' | 'monthly')}
                      style={{ flex: 1.2, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
                    >
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    style={{ backgroundColor: 'var(--text-main)', color: 'var(--bg-app)', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Registrar Proyecto
                  </button>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recurringIncomes.map(item => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', fontWeight: 500, margin: 0 }}>{item.description}</h4>
                        <span style={{
                          fontSize: '9px',
                          fontFamily: 'var(--font-sans)',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(39, 174, 96, 0.1)',
                          color: '#27AE60',
                          textTransform: 'uppercase',
                          display: 'inline-block',
                          marginTop: '4px'
                        }}>
                          Promedio {item.frequency === 'weekly' ? 'Semanal' : 'Mensual'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 500 }} title="Monto promedio estimado">
                          S/. {item.amount}
                        </span>
                        <button
                          onClick={() => setInjectingIncomeId(injectingIncomeId === item.id ? null : item.id)}
                          style={{
                            backgroundColor: 'transparent', color: 'var(--accent-color)', border: '1px solid var(--accent-color)',
                            borderRadius: '20px', padding: '2px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 600
                          }}
                        >
                          Cobrar
                        </button>
                        <button
                          onClick={() => handleDeleteRecurringIncome(item.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', opacity: 0.5, display: 'flex' }}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Variable actual payout injector */}
                    {injectingIncomeId === item.id && (
                      <div style={{
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        animation: 'fadeIn 0.2s ease forwards'
                      }}>
                        <input
                          type="number"
                          placeholder="Monto real cobrado S/."
                          value={actualPayout}
                          onChange={e => setActualPayout(e.target.value)}
                          style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
                        />
                        <button
                          onClick={() => handleInjectPayout(item)}
                          style={{
                            backgroundColor: 'var(--text-main)', color: 'var(--bg-app)', border: 'none',
                            borderRadius: '6px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 600
                          }}
                        >
                          Inyectar
                        </button>
                        <button
                          onClick={() => { setInjectingIncomeId(null); setActualPayout(''); }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {recurringIncomes.length === 0 && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0', fontStyle: 'italic', margin: 0 }}>
                    No hay proyectos variables registrados.
                  </p>
                )}
              </div>
            </div>

            {/* 4. One-time Pending Incomes (Inbound Trabajo Extra) */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', margin: 0 }}>
                  Inbound · Trabajo Extra / Pendientes
                </h3>
                <button
                  onClick={() => setShowIncomeForm(!showIncomeForm)}
                  style={{
                    background: 'none', border: '1px solid var(--border-color)', borderRadius: '20px',
                    padding: '4px 12px', fontSize: '11px', fontFamily: 'var(--font-sans)',
                    color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <FiPlus size={12} />
                  <span>Trabajo Extra</span>
                </button>
              </div>

              {showIncomeForm && (
                <form onSubmit={handleAddIncome} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Descripción (ej: Edición video)"
                    value={incDesc}
                    onChange={e => setIncDesc(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
                    required
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="Monto S/."
                      value={incAmount}
                      onChange={e => setIncAmount(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
                      required
                    />
                    <input
                      type="date"
                      value={incDueDate}
                      onChange={e => setIncDueDate(e.target.value)}
                      style={{ flex: 1.2, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{ backgroundColor: 'var(--text-main)', color: 'var(--bg-app)', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Registrar Ingreso
                  </button>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {incomes.map(item => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      opacity: item.status === 'collected' ? 0.6 : 1
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', fontWeight: 500, margin: 0 }}>{item.description}</h4>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '2px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>Vence: {item.due_date ? new Date(item.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'N/A'}</span>
                        <span>·</span>
                        <span style={{ color: item.status === 'collected' ? 'green' : 'var(--accent-color)', textTransform: 'uppercase', fontWeight: 600 }}>{item.status}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 500 }}>
                        S/. {item.amount}
                      </span>
                      {item.status === 'pending' && (
                        <button
                          onClick={() => handleCollectIncome(item)}
                          style={{
                            backgroundColor: 'var(--text-main)', color: 'var(--bg-app)', border: 'none',
                            borderRadius: '50%', width: '28px', height: '28px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s'
                          }}
                          title="Marcar como cobrado"
                        >
                          <FiCheck size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteIncome(item.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', opacity: 0.5 }}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {incomes.length === 0 && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0', fontStyle: 'italic', margin: 0 }}>
                    No hay ingresos planificados en cartera.
                  </p>
                )}
              </div>
            </div>

          </div>
        </details>

        {/* SECCIÓN 3: GASTOS Y OBLIGACIONES */}
        <details className="glass-card" style={{ padding: '16px 20px' }}>
          <summary style={{ fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', outline: 'none' }}>
            💸 Gastos y Obligaciones
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px', cursor: 'default' }} onClick={e => e.stopPropagation()}>
            
            {/* 5. Expenses (Gastos unificados) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', margin: 0 }}>
                  Outbound · Gastos Fijos
                </h3>
                <button
                  onClick={() => setShowExpenseForm(!showExpenseForm)}
                  style={{
                    background: 'none', border: '1px solid var(--border-color)', borderRadius: '20px',
                    padding: '4px 12px', fontSize: '11px', fontFamily: 'var(--font-sans)',
                    color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <FiPlus size={12} />
                  <span>Añadir Gasto</span>
                </button>
              </div>

              {showExpenseForm && (
                <form onSubmit={handleAddExpense} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Descripción (ej: Comida gatos)"
                    value={expDesc}
                    onChange={e => setExpDesc(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
                    required
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="Monto S/."
                      value={expAmount}
                      onChange={e => setExpAmount(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
                      required
                    />
                    <select
                      value={expFreq}
                      onChange={e => setExpFreq(e.target.value as 'weekly' | 'monthly')}
                      style={{ flex: 1.2, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
                    >
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    style={{ backgroundColor: 'var(--text-main)', color: 'var(--bg-app)', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Registrar Gasto
                  </button>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {expenses.map(item => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', fontWeight: 500, margin: 0 }}>{item.description}</h4>
                      <span style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '10px',
                        backgroundColor: item.frequency === 'weekly' ? 'rgba(209, 119, 87, 0.1)' : 'rgba(107, 102, 97, 0.1)',
                        color: item.frequency === 'weekly' ? 'var(--accent-color)' : 'var(--text-muted)',
                        textTransform: 'uppercase',
                        display: 'inline-block',
                        marginTop: '4px'
                      }}>
                        {item.frequency === 'weekly' ? 'Semanal' : 'Mensual'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 500 }}>
                        S/. {item.amount}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(item.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', opacity: 0.5 }}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {expenses.length === 0 && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0', fontStyle: 'italic', margin: 0 }}>
                    No hay gastos fijos registrados.
                  </p>
                )}
              </div>
            </div>

            {/* 6. Debts (Deudas a plazo) */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', margin: 0 }}>
                  Obligaciones · Deudas Activas
                </h3>
                <button
                  onClick={() => setShowDebtForm(!showDebtForm)}
                  style={{
                    background: 'none', border: '1px solid var(--border-color)', borderRadius: '20px',
                    padding: '4px 12px', fontSize: '11px', fontFamily: 'var(--font-sans)',
                    color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <FiPlus size={12} />
                  <span>Registrar Deuda</span>
                </button>
              </div>

              {showDebtForm && (
                <form onSubmit={handleAddDebt} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Descripción (ej: Préstamo primo)"
                    value={debtDesc}
                    onChange={e => setDebtDesc(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
                    required
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="Deuda Total S/."
                      value={debtAmount}
                      onChange={e => setDebtAmount(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
                      required
                    />
                    <input
                      type="date"
                      value={debtDueDate}
                      onChange={e => setDebtDueDate(e.target.value)}
                      style={{ flex: 1.2, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    style={{ backgroundColor: 'var(--text-main)', color: 'var(--bg-app)', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Registrar Obligación
                  </button>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {debts.map(item => {
                  const daysLeft = getDaysLeft(item.due_date);
                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', fontWeight: 500, margin: 0 }}>{item.description}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '11px', color: daysLeft <= 10 ? 'var(--accent-color)' : 'var(--text-muted)' }}>
                          <FiClock size={11} />
                          <span>{daysLeft <= 0 ? '¡Vencida!' : `Faltan ${daysLeft} días`}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 500, color: daysLeft <= 30 ? 'var(--accent-color)' : 'var(--text-main)' }}>
                          S/. {item.total_amount}
                        </span>
                        <button
                          onClick={() => handleDeleteDebt(item.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', opacity: 0.5 }}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {debts.length === 0 && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0', fontStyle: 'italic', margin: 0 }}>
                    Libre de obligaciones financieras activas.
                  </p>
                )}
              </div>
            </div>

          </div>
        </details>

        {/* SECCIÓN 4: HISTORIAL DE CIERRES MENSUALES */}
        <details className="glass-card" style={{ padding: '16px 20px' }}>
          <summary style={{ fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', outline: 'none' }}>
            🔒 Bitácoras de Cierres Contables
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px', cursor: 'default' }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', margin: 0 }}>
                Historial · Cierres Contables
              </h3>
              <button
                onClick={() => setShowCloseModal(true)}
                style={{
                  backgroundColor: 'var(--text-main)', border: 'none', borderRadius: '20px',
                  padding: '6px 14px', fontSize: '11px', fontFamily: 'var(--font-sans)',
                  color: 'var(--bg-app)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  fontWeight: 600
                }}
              >
                <FiArchive size={12} />
                <span>Cierre de Mes</span>
              </button>
            </div>

            {/* Close month preview modal/overlay with multi-step Retrospective */}
            {showCloseModal && (
              <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                backgroundColor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}>
                <div style={{
                  backgroundColor: 'var(--bg-app)',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '400px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                  animation: 'fadeIn 0.3s ease forwards'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Bitácora de Cierre
                      </span>
                      <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', margin: 0 }}>Cierre Contable Mensual</h3>
                    </div>
                    <button 
                      onClick={() => { setShowCloseModal(false); setCloseStep(1); }} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                    >
                      <FiX size={20} />
                    </button>
                  </div>

                  {/* Progress dot indicators */}
                  <div style={{ display: 'flex', gap: '8px', alignSelf: 'center', margin: '4px 0' }}>
                    {[1, 2, 3, 4].map(s => (
                      <div 
                        key={s} 
                        style={{ 
                          width: '24px', 
                          height: '4px', 
                          borderRadius: '2px', 
                          backgroundColor: s === closeStep 
                            ? 'var(--text-main)' 
                            : s < closeStep 
                              ? '#27AE60' 
                              : 'var(--border-color)',
                          transition: 'all 0.3s ease'
                        }} 
                      />
                    ))}
                  </div>

                  {/* STEP 1: JOY PROJECT */}
                  {closeStep === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.25s ease' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Paso 1: Alegría Creativa ✦
                      </span>
                      <label style={{ fontSize: '13.5px', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                        ¿Qué proyecto o logro te dio **más alegría** crear o avanzar durante este mes?
                      </label>
                      <textarea
                        value={joyProject}
                        onChange={e => setJoyProject(e.target.value)}
                        placeholder="Ej: Empecé mi página de Facebook, grabé 5 vídeos geniales, logré terminar mi primer desarrollo..."
                        style={{
                          width: '100%',
                          height: '90px',
                          padding: '12px',
                          border: '1.5px solid var(--border-color)',
                          borderRadius: '8px',
                          fontSize: '13px',
                          background: 'var(--bg-app)',
                          color: 'var(--text-main)',
                          fontFamily: 'var(--font-sans)',
                          outline: 'none',
                          resize: 'none'
                        }}
                      />
                      <button
                        onClick={() => setCloseStep(2)}
                        disabled={!joyProject.trim()}
                        style={{
                          backgroundColor: 'var(--text-main)',
                          color: 'var(--bg-app)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '12px',
                          fontSize: '13px',
                          cursor: joyProject.trim() ? 'pointer' : 'not-allowed',
                          fontWeight: 600,
                          opacity: joyProject.trim() ? 1 : 0.5,
                          transition: 'all 0.2s'
                        }}
                      >
                        Siguiente Paso
                      </button>
                    </div>
                  )}

                  {/* STEP 2: FOCUS LEAKS */}
                  {closeStep === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.25s ease' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Paso 2: Enfoque y Fugas 🧐
                      </span>
                      <label style={{ fontSize: '13.5px', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                        ¿En qué bloque de tiempo o actividad sentiste que **perdiste el enfoque** o procrastinaste más?
                      </label>
                      <textarea
                        value={focusLeak}
                        onChange={e => setFocusLeak(e.target.value)}
                        placeholder="Ej: En las tardes editando vídeos, distracción con redes en el móvil, acostarme muy tarde..."
                        style={{
                          width: '100%',
                          height: '90px',
                          padding: '12px',
                          border: '1.5px solid var(--border-color)',
                          borderRadius: '8px',
                          fontSize: '13px',
                          background: 'var(--bg-app)',
                          color: 'var(--text-main)',
                          fontFamily: 'var(--font-sans)',
                          outline: 'none',
                          resize: 'none'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => setCloseStep(1)}
                          style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            color: 'var(--text-main)',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '12px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Atrás
                        </button>
                        <button
                          onClick={() => setCloseStep(3)}
                          disabled={!focusLeak.trim()}
                          style={{
                            flex: 1.5,
                            backgroundColor: 'var(--text-main)',
                            color: 'var(--bg-app)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px',
                            fontSize: '13px',
                            cursor: focusLeak.trim() ? 'pointer' : 'not-allowed',
                            fontWeight: 600,
                            opacity: focusLeak.trim() ? 1 : 0.5,
                            transition: 'all 0.2s'
                          }}
                        >
                          Siguiente Paso
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: HABIT TO POLISH */}
                  {closeStep === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.25s ease' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Paso 3: Hábitos a Pulir 🚀
                      </span>
                      <label style={{ fontSize: '13.5px', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                        ¿Qué **hábito o rutina clave** te comprometes a pulir o incorporar para el próximo mes?
                      </label>
                      <textarea
                        value={habitToPolish}
                        onChange={e => setHabitToPolish(e.target.value)}
                        placeholder="Ej: Levantarme a las 7 AM para escribir guiones antes de editar, bloquear notificaciones..."
                        style={{
                          width: '100%',
                          height: '90px',
                          padding: '12px',
                          border: '1.5px solid var(--border-color)',
                          borderRadius: '8px',
                          fontSize: '13px',
                          background: 'var(--bg-app)',
                          color: 'var(--text-main)',
                          fontFamily: 'var(--font-sans)',
                          outline: 'none',
                          resize: 'none'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => setCloseStep(2)}
                          style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            color: 'var(--text-main)',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '12px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Atrás
                        </button>
                        <button
                          onClick={() => setCloseStep(4)}
                          disabled={!habitToPolish.trim()}
                          style={{
                            flex: 1.5,
                            backgroundColor: 'var(--text-main)',
                            color: 'var(--bg-app)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px',
                            fontSize: '13px',
                            cursor: habitToPolish.trim() ? 'pointer' : 'not-allowed',
                            fontWeight: 600,
                            opacity: habitToPolish.trim() ? 1 : 0.5,
                            transition: 'all 0.2s'
                          }}
                        >
                          Ver Resumen
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: FINANCIAL SUMMARY & CONFIRM */}
                  {closeStep === 4 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.25s ease' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#27AE60', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Paso 4: Balance y Confirmación 🔒
                      </span>
                      
                      <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        Revisa tus números acumulados antes de archivar de forma permanente:
                      </p>

                      <div style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span>Dinero Cobrado de Trabajo Extra:</span>
                          <strong style={{ fontFamily: 'var(--font-serif)' }}>S/. {collectedIncomesSum}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span>Gasto Estimado Mensual:</span>
                          <strong style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent-color)' }}>S/. {estimatedExpensesMonth.toFixed(1)}</strong>
                        </div>
                        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '4px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                          <span>Balance Neto:</span>
                          <span style={{ fontFamily: 'var(--font-serif)', color: netEarningsMonth >= 0 ? '#27AE60' : 'var(--accent-color)' }}>
                            S/. {netEarningsMonth.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Brief retro review card */}
                      <div style={{ 
                        fontSize: '11.5px', 
                        color: 'var(--text-muted)', 
                        border: '1px dashed var(--border-color)', 
                        borderRadius: '8px', 
                        padding: '12px',
                        backgroundColor: 'rgba(25,25,25,0.01)',
                        maxHeight: '120px',
                        overflowY: 'auto'
                      }}>
                        <div style={{ marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600 }}>✦ Mayor Alegría:</span> {joyProject}
                        </div>
                        <div style={{ marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600 }}>🧐 Fuga de Foco:</span> {focusLeak}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600 }}>🚀 Hábito a Pulir:</span> {habitToPolish}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => setCloseStep(3)}
                          style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            color: 'var(--text-main)',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '12px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Atrás
                        </button>
                        <button
                          onClick={handlePerformClose}
                          style={{
                            flex: 2,
                            backgroundColor: 'var(--text-main)',
                            color: 'var(--bg-app)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <FiArchive size={14} />
                          <span>Confirmar y Archivar Cierre</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {monthlyCloses.map(item => {
                const isExpanded = expandedCloseId === item.id;
                const hasRetro = item.joy_project || item.focus_leak || item.habit_to_polish;
                
                return (
                  <div
                    key={item.id}
                    onClick={() => hasRetro && setExpandedCloseId(isExpanded ? null : item.id)}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: hasRetro ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div>
                        <h4 style={{ fontSize: '14px', fontFamily: 'var(--font-serif)', fontWeight: 500, margin: 0 }}>
                          {item.month_year} {hasRetro && <span style={{ fontSize: '9px', fontFamily: 'var(--font-sans)', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '6px' }}>{isExpanded ? '▲ Ocultar Diario' : '▼ Ver Diario'}</span>}
                        </h4>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '2px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span>Ingresos: S/. {item.total_incomes}</span>
                          <span>·</span>
                          <span>Gastos: S/. {parseFloat(item.total_expenses as any).toFixed(0)}</span>
                        </div>
                      </div>

                      <span style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '15px',
                        fontWeight: 600,
                        color: item.net_savings >= 0 ? '#27AE60' : 'var(--accent-color)'
                      }}>
                        {item.net_savings >= 0 ? '+' : ''}S/. {parseFloat(item.net_savings as any).toFixed(0)}
                      </span>
                    </div>

                    {/* Expanded Retrospective details */}
                    {isExpanded && hasRetro && (
                      <div style={{
                        borderTop: '1px solid var(--border-color)',
                        marginTop: '12px',
                        paddingTop: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        textAlign: 'left',
                        animation: 'fadeIn 0.2s ease forwards'
                      }}>
                        {item.joy_project && (
                          <div>
                            <strong style={{ color: 'var(--accent-color)', fontSize: '11px', display: 'block', marginBottom: '2px' }}>✦ Mayor Alegría Creativa:</strong>
                            <span style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>"{item.joy_project}"</span>
                          </div>
                        )}
                        {item.focus_leak && (
                          <div>
                            <strong style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginBottom: '2px' }}>🧐 Fuga de Enfoque Detectada:</strong>
                            <span style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>"{item.focus_leak}"</span>
                          </div>
                        )}
                        {item.habit_to_polish && (
                          <div>
                            <strong style={{ color: '#27AE60', fontSize: '11px', display: 'block', marginBottom: '2px' }}>🚀 Compromiso de Hábito:</strong>
                            <span style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>"{item.habit_to_polish}"</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {monthlyCloses.length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0', fontStyle: 'italic', margin: 0 }}>
                  No hay cierres históricos de mes registrados.
                </p>
              )}
            </div>

          </div>
        </details>

      </div>
    </div>

    {/* ── Info Drawers ── */}
    <InfoDrawer
      isOpen={infoDrawer === 'survivalDays'}
      onClose={closeInfo}
      title="¿Qué son los Días de Tranquilidad?"
    >
      <p>
        Son la cantidad de días que puedes vivir <strong>sin estresarte</strong> si tus ingresos de internet se detuvieran hoy mismo.
      </p>
      <p>
        Se calcula tomando todo el dinero que tienes disponible (BCP + Efectivo) y dividiéndolo entre lo que gastas cada semana. Si el número es alto, estás en zona segura. Si es bajo, es una señal de que necesitas acelerar tus proyectos o reducir gastos.
      </p>
      <p style={{ color: 'var(--accent-color)', fontWeight: 600 }}>
        🎯 Meta recomendada: superar los 45 días de tranquilidad.
      </p>
    </InfoDrawer>

    <InfoDrawer
      isOpen={infoDrawer === 'safety'}
      onClose={closeInfo}
      title="¿Cómo funciona el nivel de seguridad?"
    >
      <p>
        Tus ingresos de internet (Facebook páginas, proyectos digitales) son variables: un día pueden ser altos y otro día bajos.
      </p>
      <p>
        <strong>Optimista (100%)</strong>: Cuenta todos tus ingresos como si llegarán seguros al 100%. Ideal para ver tu situación perfecta.
      </p>
      <p>
        <strong>Seguro — Recomendado (60%)</strong>: Asume que solo el 60% de tus ingresos llegarán, para cubrir posibles caídas de visitas, penalizaciones o retrasos de pago.
      </p>
      <p>
        <strong>Emergencia (0%)</strong>: Simula que quedas sin ningún ingreso de internet. Te muestra cuánto tiempo te duran solo tus ahorros. Es la prueba de fuego real.
      </p>
    </InfoDrawer>

    <InfoDrawer
      isOpen={infoDrawer === 'diversification'}
      onClose={closeInfo}
      title="¿Por qué diversificar mis fuentes de ingreso?"
    >
      <p>
        Depender de un solo canal (por ejemplo, solo de Facebook Páginas) es arriesgado. Si esa plataforma te penaliza, cambia su algoritmo, o baja tus pagos, perderías todos tus ingresos de un golpe.
      </p>
      <p>
        <strong>Grado D – Riesgo Crítico:</strong> 1 sola fuente de ingreso. Es el punto de mayor vulnerabilidad.
      </p>
      <p>
        <strong>Grado C – Seguridad Inicial:</strong> 2 fuentes independientes. Ya tienes un colchón si una falla.
      </p>
      <p>
        <strong>Grado B/A – Inmune:</strong> 3 o más fuentes. Tu negocio puede aguantar golpes externos sin desmoronarse.
      </p>
      <p style={{ color: '#27AE60', fontWeight: 600 }}>
        🎯 Meta: llegar al Grado B/A añadiendo un nuevo proyecto de ingreso cada 2 meses.
      </p>
    </InfoDrawer>

    <InfoDrawer
      isOpen={infoDrawer === 'buffer'}
      onClose={closeInfo}
      title="¿Qué es el Respaldo Familiar?"
    >
      <p>
        Es la cantidad de meses que podrías seguir aportando dinero a tu casa (tu meta mensual familiar) usando solo tus ahorros actuales, incluso si no generaras ningún ingreso.
      </p>
      <p>
        Piénsalo como un fondo de seguridad familiar: te permite seguir apoyando en casa sin presión, mientras resuelves imprevistos o lanzas nuevos proyectos.
      </p>
      <p>
        <strong>Meta ideal:</strong> tener al menos <strong>6 meses</strong> de cobertura guardados, lo que te da medio año de tranquilidad familiar completa.
      </p>
    </InfoDrawer>
  </>
  );
}

