export default function DailyGoalWidget({ completed, total }: { completed: number, total: number }) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const isGoalReached = percentage >= 80;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 20px',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-muted)' }}>Progreso Diario</h2>
      
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `4px solid ${isGoalReached ? 'var(--accent-color)' : 'var(--border-color)'}`,
        transition: 'border-color 0.5s ease'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <span style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: '32px', 
            color: isGoalReached ? 'var(--accent-color)' : 'var(--text-main)'
          }}>
            {percentage}%
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {typeof completed === 'number' ? Number(completed.toFixed(1)) : completed} de {total}
          </span>
        </div>
      </div>
      
      {isGoalReached && (
        <p style={{
          marginTop: '16px',
          color: 'var(--accent-color)',
          fontSize: '14px',
          fontWeight: 500,
          fontFamily: 'var(--font-sans)',
          letterSpacing: '0.5px'
        }}>
          ¡Meta Cumplida!
        </p>
      )}
    </div>
  );
}
