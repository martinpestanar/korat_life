import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FiAward, FiCheckCircle } from 'react-icons/fi';
import { getLocalDateString } from '../lib/dateUtils';

interface StreakData {
  current_streak: number;
  max_streak: number;
  last_check_in: string | null;
}

export default function StreakWidget() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const fetchStreak = async () => {
    try {
      const { data } = await supabase
        .from('habit_streaks')
        .select('*')
        .eq('habit_name', 'sober_90')
        .single();
      
      if (data) {
        setStreak({
          current_streak: data.current_streak,
          max_streak: data.max_streak,
          last_check_in: data.last_check_in
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, []);

  const todayStr = getLocalDateString();
  const isCheckedInToday = streak?.last_check_in === todayStr;

  const handleCheckIn = async () => {
    if (isCheckedInToday) return;

    setStreak(prev => prev ? {
      ...prev,
      current_streak: prev.current_streak + 1,
      max_streak: Math.max(prev.max_streak, prev.current_streak + 1),
      last_check_in: todayStr
    } : null);

    await supabase.rpc('increment_streak', { h_name: 'sober_90', check_date: todayStr });
    fetchStreak();
  };

  const handleReset = async () => {
    setStreak(prev => prev ? { ...prev, current_streak: 0, last_check_in: null } : null);
    setShowConfirmReset(false);

    await supabase
      .from('habit_streaks')
      .update({ current_streak: 0, last_check_in: null })
      .eq('habit_name', 'sober_90');
      
    fetchStreak();
  };

  // Determine dynamic habit level description
  const getStreakLevel = (days: number) => {
    if (days >= 90) return '☀ Inmunidad de Carnaval ✦';
    if (days >= 60) return '🌊 Energía de Ipanema';
    if (days >= 30) return '🏡 Amanecer en Santa Teresa';
    if (days >= 15) return '🌿 Brisa de Copacabana';
    if (days >= 7) return '🌱 Primer Rayo de Sol';
    return '🍂 Semilla bajo el Sol';
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: '13px' }}>Cargando racha...</div>;

  const currentVal = streak?.current_streak || 0;
  const progressPercent = Math.min((currentVal / 90) * 100, 100);

  return (
    <div className="glass-card" style={{
      padding: '28px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      border: '1px solid var(--border-color)',
      background: '#FFFFFF',
    }}>
      <span style={{
        fontSize: '9px',
        color: 'var(--accent-color)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '2px',
        borderBottom: '1.5px solid var(--accent-light)',
        paddingBottom: '2px',
        marginBottom: '20px'
      }}>
        Luz de Río · Disciplina
      </span>

      {/* Sun/Dial progress indicator */}
      <div className={`sun-pulse`} style={{
        position: 'relative',
        width: '140px',
        height: '140px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAF9F6',
        border: '1px solid rgba(10, 42, 30, 0.06)',
        boxShadow: 'inset 0 2px 8px rgba(10, 42, 30, 0.02)',
        marginBottom: '20px',
        transition: 'all 0.4s ease'
      }}>
        {/* Fine gold circular progress overlay */}
        <div style={{
          position: 'absolute',
          inset: '-1px',
          borderRadius: '50%',
          border: '2px solid var(--accent-light)',
          clipPath: `polygon(50% 50%, -50% -50%, ${150 - (progressPercent / 100) * 200}% -50%, 150% 150%, -50% 150%)`,
          opacity: currentVal > 0 ? 0.95 : 0.05,
          transition: 'all 0.5s ease',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '48px',
            lineHeight: 1,
            color: 'var(--text-main)',
            fontWeight: 'normal',
          }}>
            {currentVal}
          </span>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '9px',
            color: 'var(--text-muted)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginTop: '2px'
          }}>
            días de sol
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '17px',
          fontStyle: 'italic',
          color: 'var(--text-main)',
          margin: 0
        }}>
          {getStreakLevel(currentVal)}
        </p>
        <span style={{ 
          fontFamily: 'var(--font-sans)', 
          fontSize: '11.5px', 
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          marginTop: '6px'
        }}>
          <FiAward size={12} color="var(--accent-color)" />
          Brillo máximo: {streak?.max_streak || 0} días
        </span>
      </div>

      <button
        onClick={handleCheckIn}
        disabled={isCheckedInToday}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          border: 'none',
          background: isCheckedInToday 
            ? 'rgba(46, 111, 64, 0.1)' 
            : 'linear-gradient(135deg, var(--accent-color), var(--accent-light))',
          color: isCheckedInToday ? 'var(--accent-green)' : 'white',
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          fontWeight: 700,
          cursor: isCheckedInToday ? 'default' : 'pointer',
          transition: 'all 0.25s ease',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: isCheckedInToday ? 'none' : '0 4px 15px rgba(231, 111, 81, 0.25)'
        }}
      >
        {isCheckedInToday ? (
          <>
            <FiCheckCircle size={16} />
            <span>¡Tu sol brilla hoy en la terraza! ✦</span>
          </>
        ) : (
          <span>Encender mi Sol Hoy</span>
        )}
      </button>

      {showConfirmReset ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%', animation: 'fadeIn 0.2s ease forwards' }}>
          <span style={{ color: 'var(--text-main)', fontSize: '12.5px', fontFamily: 'var(--font-sans)' }}>¿Seguro que deseas reiniciar tu racha a 0?</span>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button 
              onClick={() => setShowConfirmReset(false)}
              style={{ flex: 1, padding: '10px', background: 'none', border: '1.5px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}
            >
              Cancelar
            </button>
            <button 
              onClick={handleReset}
              style={{ flex: 1.2, padding: '10px', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}
            >
              Sí, reiniciar a 0
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirmReset(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            textDecoration: 'underline',
            fontSize: '12.5px',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            opacity: 0.8
          }}
        >
          Reiniciar Racha
        </button>
      )}
    </div>
  );
}
