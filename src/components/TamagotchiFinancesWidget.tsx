import { FiTrendingUp, FiShield } from 'react-icons/fi';
import { useData } from '../context/DataContext';

export default function TamagotchiFinancesWidget() {
  const { survivalDays, recurringIncomes } = useData();

  // Calculate MRR from monthly/weekly recurring incomes
  const totalMRR = recurringIncomes.reduce((acc, item) => {
    if (item.frequency === 'monthly') return acc + Number(item.amount);
    if (item.frequency === 'weekly') return acc + (Number(item.amount) * 4.33);
    return acc + Number(item.amount);
  }, 0);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0A2A1E 0%, #104D30 100%)',
      color: 'white',
      borderRadius: '24px',
      padding: '20px',
      boxShadow: '0 8px 24px rgba(10, 42, 30, 0.15)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <FiShield size={16} color="#E6B033" />
          </div>
          <span style={{
            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '1px', color: '#E6B033', fontFamily: 'var(--font-sans)'
          }}>
            Micro-Finanzas & Runway
          </span>
        </div>

        <span style={{
          fontSize: '11px',
          background: 'rgba(255, 255, 255, 0.12)',
          padding: '4px 10px',
          borderRadius: '12px',
          fontFamily: 'var(--font-sans)',
          fontWeight: 600
        }}>
          Tamagotchi Treasury
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Runway Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '12px 14px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-sans)' }}>
            Días de Colchón (Runway)
          </span>
          <div style={{
            fontSize: '22px',
            fontWeight: 800,
            fontFamily: 'var(--font-sans)',
            color: '#FFFFFF',
            margin: '4px 0 2px 0',
            display: 'flex',
            alignItems: 'baseline',
            gap: '4px'
          }}>
            <span>{survivalDays || 0}</span>
            <span style={{ fontSize: '12px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.8)' }}>días</span>
          </div>
          <span style={{ fontSize: '10px', color: '#E6B033', fontWeight: 600 }}>
            {survivalDays > 90 ? '🛡️ Excelente' : survivalDays > 30 ? '🌾 Estable' : '⚠️ Atención'}
          </span>
        </div>

        {/* MRR Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '12px 14px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-sans)' }}>
            MRR Recurrente
          </span>
          <div style={{
            fontSize: '22px',
            fontWeight: 800,
            fontFamily: 'var(--font-sans)',
            color: '#FFFFFF',
            margin: '4px 0 2px 0',
            display: 'flex',
            alignItems: 'baseline',
            gap: '2px'
          }}>
            <span style={{ fontSize: '16px', color: '#E6B033' }}>$</span>
            <span>{Math.round(totalMRR)}</span>
            <span style={{ fontSize: '11px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.8)' }}>/mes</span>
          </div>
          <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <FiTrendingUp size={11} color="#E6B033" /> Flujo activo
          </span>
        </div>
      </div>
    </div>
  );
}
