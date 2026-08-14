import { useEffect, useState } from 'react';

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { text: 'Buenos días', emoji: '☀️' };
  if (h >= 12 && h < 19) return { text: 'Buenas tardes', emoji: '🌅' };
  return { text: 'Buenas noches', emoji: '🌙' };
}

function getDayLabel(): string {
  return new Date()
    .toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(/^./, c => c.toUpperCase());
}

function getProgressColor(pct: number): { bar: string; glow: string } {
  if (pct >= 80) return {
    bar: 'linear-gradient(90deg, #E6B033 0%, #FFD166 100%)',
    glow: 'rgba(230, 176, 51, 0.55)'
  };
  if (pct >= 50) return {
    bar: 'linear-gradient(90deg, #00C896 0%, #00E5A8 100%)',
    glow: 'rgba(0, 200, 150, 0.45)'
  };
  return {
    bar: 'linear-gradient(90deg, #D46A43 0%, #E6855C 100%)',
    glow: 'rgba(212, 106, 67, 0.4)'
  };
}

export default function DailyGoalWidget({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const [displayPct, setDisplayPct] = useState(0);
  const isGoalReached = pct >= 80;
  const greeting = getGreeting();
  const { bar: barColor, glow } = getProgressColor(pct);

  // Animate bar on mount / change
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setTimeout(() => setDisplayPct(pct), 80);
    });
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  return (
    <>
      <style>{`
        @keyframes heroFadeDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes barGrow {
          from { width: 0%; }
        }
        @keyframes celebratePulse {
          0%,100% { box-shadow: 0 0 0px transparent; }
          50%      { box-shadow: 0 0 18px ${glow}; }
        }
        .hero-bar-fill {
          transition: width 0.85s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .hero-wrapper {
          animation: heroFadeDown 0.35s ease forwards;
        }
      `}</style>

      <div
        className="hero-wrapper"
        style={{
          background: 'linear-gradient(180deg, #0A2A1E 0%, #143D28 55%, #F8F6F0 100%)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingBottom: '28px',
        }}
      >
        {/* Greeting row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <p style={{
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              color: 'rgba(248, 246, 240, 0.65)',
              letterSpacing: '0.3px',
              margin: 0,
              marginBottom: '4px'
            }}>
              {greeting.emoji} {greeting.text}
            </p>
            <h1 style={{
              fontSize: '26px',
              fontFamily: 'var(--font-serif)',
              fontWeight: 700,
              color: '#F8F6F0',
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: '-0.3px'
            }}>
              {getDayLabel()}
            </h1>
          </div>

          {/* Compact % badge */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            flexShrink: 0,
            animation: isGoalReached ? 'celebratePulse 2.5s ease-in-out infinite' : 'none'
          }}>
            <span style={{
              fontSize: '20px',
              fontFamily: 'var(--font-serif)',
              fontWeight: 700,
              color: isGoalReached ? '#E6B033' : '#F8F6F0',
              lineHeight: 1
            }}>
              {displayPct}
            </span>
            <span style={{
              fontSize: '9px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              color: 'rgba(248,246,240,0.55)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '7px',
          borderRadius: '100px',
          background: 'rgba(255,255,255,0.10)',
          overflow: 'hidden',
          marginBottom: '10px'
        }}>
          <div
            className="hero-bar-fill"
            style={{
              width: `${displayPct}%`,
              height: '100%',
              borderRadius: '100px',
              background: barColor,
              boxShadow: displayPct > 5 ? `0 0 10px ${glow}` : 'none'
            }}
          />
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: '12px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            color: 'rgba(248, 246, 240, 0.5)'
          }}>
            {typeof completed === 'number' ? Number(completed.toFixed(1)) : completed} de {total} bloques
          </span>

          {isGoalReached && (
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              color: '#E6B033',
              letterSpacing: '0.4px'
            }}>
              ✦ ¡Meta del día cumplida!
            </span>
          )}
        </div>
      </div>
    </>
  );
}
