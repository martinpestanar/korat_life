import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalDateString } from '../lib/dateUtils';

export interface MiniChallenge {
  id: string;
  title: string;
  duration_days: number;
  current_day: number;
  xp_reward: number;
  active: boolean;
  last_check_in: string | null;
}

export default function MiniChallengeCard({
  challenge,
  onUpdate
}: {
  challenge: MiniChallenge;
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const todayStr = getLocalDateString();
  const isCheckedToday = challenge.last_check_in === todayStr;
  const progress = Math.min(challenge.current_day / challenge.duration_days, 1);

  const handleCheckIn = async () => {
    if (isCheckedToday || loading) return;
    setLoading(true);

    const { data } = await supabase.rpc('check_in_mini_challenge', { challenge_id: challenge.id });

    if (data?.completed) {
      setFeedback(`+${challenge.xp_reward} XP · Reto completado 🎯`);
    } else if (data?.success) {
      setFeedback(`Día ${data.day} de ${challenge.duration_days} ✓`);
    } else {
      setFeedback(data?.message || '');
    }

    setTimeout(() => setFeedback(''), 3000);
    setLoading(false);
    onUpdate();
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '10px',
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: '13px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            color: 'var(--text-main)',
            margin: 0
          }}>
            {challenge.title}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Día {challenge.current_day} · {challenge.duration_days} días · +{challenge.xp_reward} XP
          </p>
        </div>

        <button
          onClick={handleCheckIn}
          disabled={isCheckedToday || loading}
          style={{
            background: 'none',
            border: `1px solid ${isCheckedToday ? 'var(--accent-color)' : 'var(--border-color)'}`,
            borderRadius: '6px',
            padding: '4px 10px',
            cursor: isCheckedToday ? 'default' : 'pointer',
            fontSize: '11px',
            color: isCheckedToday ? 'var(--accent-color)' : 'var(--text-muted)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            marginLeft: '12px'
          }}
        >
          {isCheckedToday ? 'Hecho ✓' : 'Check-in'}
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', height: '2px', backgroundColor: 'var(--border-color)', borderRadius: '1px' }}>
        <div style={{
          width: `${progress * 100}%`,
          height: '100%',
          backgroundColor: 'var(--accent-color)',
          borderRadius: '1px',
          transition: 'width 0.4s ease'
        }} />
      </div>

      {feedback && (
        <p style={{
          fontSize: '11px',
          color: 'var(--accent-color)',
          margin: 0,
          fontFamily: 'var(--font-sans)',
          animation: 'fadeIn 0.2s ease'
        }}>
          {feedback}
        </p>
      )}
    </div>
  );
}
