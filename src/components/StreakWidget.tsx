import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FiAward, FiCheckCircle } from 'react-icons/fi';

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

  const todayStr = new Date().toISOString().split('T')[0];
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
    if (days >= 90) return 'Inmunidad Absoluta ✦';
    if (days >= 60) return 'Gran Dominio Mental';
    if (days >= 30) return 'Desintoxicación Completada';
    if (days >= 15) return 'Hábito Consolidado';
    if (days >= 7) return 'Racha Inicial Activa';
    return 'Primeros Pasos de Enfoque';
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: '13px' }}>Cargando racha...</div>;

  const currentVal = streak?.current_streak || 0;
  const progressPercent = Math.min((currentVal / 90) * 100, 100);

  return (
    <div style={{
      backgroundColor: '#FAF5ED',
      borderRadius: '16px',
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      border: '1.5px solid rgba(204, 101, 67, 0.25)',
      boxShadow: 'inset 0 1px 3px rgba(204,101,67,0.02)'
    }}>
      <span style={{
        fontSize: '9px',
        color: 'var(--accent-color)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '2.5px',
        backgroundColor: 'rgba(204, 101, 67, 0.08)',
        padding: '2px 10px',
        borderRadius: '10px',
        marginBottom: '16px'
      }}>
        Racha de Sobriedad
      </span>

      {/* Premium minimal ring progress indicator */}
      <div style={{
        position: 'relative',
        width: '160px',
        height: '160px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1.5px solid var(--border-color)',
        marginBottom: '20px',
        backgroundColor: 'var(--bg-app)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.01)'
      }}>
        {/* Glow indicator line */}
        <div style={{
          position: 'absolute',
          inset: '-1.5px',
          borderRadius: '50%',
          border: '2.5px solid var(--accent-color)',
          clipPath: `polygon(50% 50%, -50% -50%, ${150 - (progressPercent / 100) * 200}% -50%, 150% 150%, -50% 150%)`,
          opacity: currentVal > 0 ? 0.8 : 0.1,
          transition: 'all 0.5s ease'
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '56px',
            lineHeight: 1,
            color: 'var(--accent-color)',
            fontWeight: 'normal'
          }}>
            {currentVal}
          </span>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginTop: '4px'
          }}>
            de 90 días
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <p style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '16px',
          color: 'var(--text-main)',
          fontWeight: 'normal',
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
          Máximo histórico: {streak?.max_streak || 0} días
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
          backgroundColor: isCheckedInToday ? 'rgba(25,25,25,0.06)' : 'var(--text-main)',
          color: isCheckedInToday ? 'var(--text-muted)' : 'var(--bg-app)',
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          fontWeight: 600,
          cursor: isCheckedInToday ? 'default' : 'pointer',
          transition: 'all 0.25s ease',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: isCheckedInToday ? 'none' : '0 4px 12px rgba(0,0,0,0.08)'
        }}
      >
        {isCheckedInToday ? (
          <>
            <FiCheckCircle size={16} />
            <span>Día completado con éxito ✦</span>
          </>
        ) : (
          <span>Marcar Día Completado</span>
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
