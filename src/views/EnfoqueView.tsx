import StreakWidget from '../components/StreakWidget';
import GamingTracker from '../components/GamingTracker';

export default function EnfoqueView() {
  return (
    <div style={{ padding: '20px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ marginBottom: '8px' }}>
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

      <StreakWidget />
      
      <div style={{ borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

      <GamingTracker />
    </div>
  );
}
