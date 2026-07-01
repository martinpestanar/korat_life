import { useState } from 'react';
import StreakWidget from '../components/StreakWidget';
import GamingTracker from '../components/GamingTracker';
import MiniChallengeCard from '../components/MiniChallengeCard';
import ManageChallengesModal from '../components/ManageChallengesModal';
import { useData } from '../context/DataContext';
import { FiSliders } from 'react-icons/fi';

export default function EnfoqueView() {
  const { challenges, refreshHoy } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div style={{ padding: '20px', paddingBottom: '120px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            margin: 0, 
            color: 'var(--text-main)',
            fontFamily: 'var(--font-serif)'
          }}>
            Enfoque
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Protección de energía y disciplina
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: 'none',
            border: '1px solid var(--border-color)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <FiSliders size={14} />
          <span>Retos</span>
        </button>
      </div>

      {/* Mini Retos Activos */}
      {challenges.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{
            fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px',
            fontFamily: 'var(--font-sans)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '2px'
          }}>
            Mini Retos Activos
          </h2>
          {challenges.map(challenge => (
            <MiniChallengeCard
              key={challenge.id}
              challenge={challenge}
              onUpdate={refreshHoy}
            />
          ))}
        </div>
      )}

      <StreakWidget />
      
      <div style={{ borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

      <GamingTracker />

      <ManageChallengesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={refreshHoy}
      />
    </div>
  );
}
