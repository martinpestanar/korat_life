import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FiLock, FiUnlock, FiUser, FiUsers } from 'react-icons/fi';

export default function GamingTracker() {
  const [primoGames, setPrimoGames] = useState(0);
  const [soloGames, setSoloGames] = useState(0);
  const [empireXp, setEmpireXp] = useState(0); // Focus/Empire XP balance to preview
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchGamesAndXp = async () => {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay() || 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek + 1);
      monday.setHours(0, 0, 0, 0);

      const { data: logs } = await supabase
        .from('gaming_logs')
        .select('game_type')
        .gte('created_at', monday.toISOString());
      
      if (logs) {
        setPrimoGames(logs.filter(d => d.game_type === 'primo').length);
        setSoloGames(logs.filter(d => d.game_type === 'solo').length);
      }

      // Fetch Empire Pillar XP for game unlock feedback
      const { data: pillar } = await supabase
        .from('pillars')
        .select('total_xp')
        .eq('name', 'imperio')
        .single();
      
      if (pillar) {
        setEmpireXp(pillar.total_xp);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGamesAndXp();
  }, []);

  const totalGames = primoGames + soloGames;
  const isSoloBlocked = soloGames >= 2;
  const isTotalBlocked = totalGames >= 6;

  // Solo games require at least 50 XP in Imperio pillar to trigger the RPC checks
  const hasSufficientXpForSolo = empireXp >= 50;

  const addGame = async (type: 'solo' | 'primo') => {
    if (isTotalBlocked || (type === 'solo' && isSoloBlocked)) return;
    setErrorMessage(null);

    if (type === 'solo') {
      const { data, error: _error } = await supabase.rpc('log_solo_game_with_xp_check');
      if (_error || (data && !data.success)) {
        setErrorMessage(data?.message || 'Error de saldo de enfoque.');
        return;
      }
      setSoloGames(prev => prev + 1);
      fetchGamesAndXp();
    } else {
      setPrimoGames(prev => prev + 1);
      await supabase.from('gaming_logs').insert({ game_type: type });
      fetchGamesAndXp();
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: '13px' }}>Cargando bitácora de juego...</div>;

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      borderRadius: '16px',
      padding: '28px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '16px', color: 'var(--text-main)', fontFamily: 'var(--font-serif)', margin: 0 }}>
          Control de Ocio: LoL
        </h2>
        <span style={{
          fontSize: '9px',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '10px',
          backgroundColor: isTotalBlocked ? 'rgba(179,57,37,0.1)' : 'rgba(39, 174, 96, 0.1)',
          color: isTotalBlocked ? '#B33925' : '#27AE60',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {isTotalBlocked ? <FiLock size={10} /> : <FiUnlock size={10} />}
          {isTotalBlocked ? 'Semana Cerrada' : 'Cupos Libres'}
        </span>
      </div>

      {/* Dynamic Focus Energy feedback panel */}
      <div style={{
        backgroundColor: '#FAF5ED',
        border: '1.5px dashed rgba(204, 101, 67, 0.25)',
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Energía del Imperio (Enfoque)
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'var(--text-main)' }}>
            Saldo Disponible: <strong style={{ color: 'var(--accent-color)' }}>{empireXp} XP</strong>
          </span>
        </div>
        <div style={{
          fontSize: '9px',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: '8px',
          backgroundColor: hasSufficientXpForSolo ? 'rgba(39, 174, 96, 0.12)' : 'rgba(204, 101, 67, 0.12)',
          color: hasSufficientXpForSolo ? '#27AE60' : 'var(--accent-color)'
        }}>
          {hasSufficientXpForSolo ? 'Habilitado esta Semana' : 'Semana Bloqueada (Bajo XP)'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Primo Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 500 }}>
              <FiUsers size={14} color="var(--accent-color)" />
              Partidas con Primo (Tribu)
            </span>
            <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-muted)' }}>
              {primoGames} <span style={{ fontSize: '10px' }}>/ 6</span>
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(25,25,25,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${Math.min((primoGames / 6) * 100, 100)}%`, 
              height: '100%', 
              backgroundColor: isTotalBlocked ? '#B33925' : 'var(--accent-color)',
              borderRadius: '3px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* Solo Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 500 }}>
              <FiUser size={14} color="var(--text-main)" />
              Partidas Solo (Imperio)
            </span>
            <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-muted)' }}>
              {soloGames} <span style={{ fontSize: '10px' }}>/ 2</span>
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(25,25,25,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${Math.min((soloGames / 2) * 100, 100)}%`, 
              height: '100%', 
              backgroundColor: (isSoloBlocked || isTotalBlocked) ? '#B33925' : 'var(--text-main)',
              borderRadius: '3px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      </div>

      {(isSoloBlocked || isTotalBlocked || errorMessage) && (
        <div style={{ animation: 'fadeIn 0.2s ease forwards' }}>
           <p style={{
             color: '#B33925',
             fontSize: '12px',
             fontFamily: 'var(--font-sans)',
             textAlign: 'center',
             backgroundColor: 'rgba(179, 57, 37, 0.08)',
             border: '1px solid rgba(179, 57, 37, 0.15)',
             padding: '10px',
             borderRadius: '8px',
             lineHeight: 1.4,
             margin: 0
           }}>
             {errorMessage 
               ? errorMessage
               : (isTotalBlocked 
                 ? '⚠️ Has alcanzado tu límite máximo semanal (6 partidas totales). ¡Toca desconectarse del PC!' 
                 : '🔒 Has completado tus 2 partidas Solo de la semana. Solo se permiten partidas recreativas con Primo.')}
           </p>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => addGame('primo')}
          disabled={isTotalBlocked}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isTotalBlocked ? 'rgba(25,25,25,0.06)' : 'var(--accent-color)',
            color: isTotalBlocked ? 'var(--text-muted)' : 'white',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isTotalBlocked ? 'default' : 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: isTotalBlocked ? 'none' : '0 4px 12px rgba(204,101,67,0.1)'
          }}
        >
          <FiUsers size={14} />
          <span>+1 Con Primo</span>
        </button>
        
        <button
          onClick={() => addGame('solo')}
          disabled={isSoloBlocked || isTotalBlocked || !hasSufficientXpForSolo}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: (isSoloBlocked || isTotalBlocked || !hasSufficientXpForSolo) ? 'rgba(25,25,25,0.06)' : 'var(--text-main)',
            color: (isSoloBlocked || isTotalBlocked || !hasSufficientXpForSolo) ? 'var(--text-muted)' : 'white',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: (isSoloBlocked || isTotalBlocked || !hasSufficientXpForSolo) ? 'default' : 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: (isSoloBlocked || isTotalBlocked || !hasSufficientXpForSolo) ? 'none' : '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <FiUser size={14} />
          <span>+1 Solo (-50 XP)</span>
        </button>
      </div>
    </div>
  );
}
