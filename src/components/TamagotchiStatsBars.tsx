import React from 'react';
import { FiZap, FiShoppingBag, FiCpu, FiHeart, FiSmile, FiPlus, FiMinus } from 'react-icons/fi';

export interface TamagotchiStats {
  energy: number;     // 0 - 100
  nutrition: number;  // 0 - 100
  health: number;     // 0 - 100
  impact: number;     // 0 - 100
  balance: number;    // 0 - 100
}

interface TamagotchiStatsBarsProps {
  stats: TamagotchiStats;
  onUpdateStat: (key: keyof TamagotchiStats, delta: number) => void;
}

export default function TamagotchiStatsBars({ stats, onUpdateStat }: TamagotchiStatsBarsProps) {

  const pillarsConfig: Array<{
    key: keyof TamagotchiStats;
    name: string;
    icon: React.ReactNode;
    subtitle: string;
    color: string;
    barColor: string;
  }> = [
    {
      key: 'energy',
      name: '⚡ Energía',
      subtitle: 'Creación & Visibilidad (TikToks/Impactos)',
      icon: <FiZap size={16} />,
      color: '#D46A43',
      barColor: 'linear-gradient(90deg, #D46A43, #E6B033)'
    },
    {
      key: 'nutrition',
      name: '🍖 Nutrición',
      subtitle: 'Prospección & Clientes (Ventas / Caja)',
      icon: <FiShoppingBag size={16} />,
      color: '#104D30',
      barColor: 'linear-gradient(90deg, #104D30, #1D7D8C)'
    },
    {
      key: 'health',
      name: '🛠️ Salud',
      subtitle: 'Estabilidad SaaS & Chatbot',
      icon: <FiCpu size={16} />,
      color: '#1D7D8C',
      barColor: 'linear-gradient(90deg, #1D7D8C, #104D30)'
    },
    {
      key: 'impact',
      name: '❤️ Impacto',
      subtitle: 'Locales Digitalizados & Propósito',
      icon: <FiHeart size={16} />,
      color: '#C0392B',
      barColor: 'linear-gradient(90deg, #E74C3C, #D46A43)'
    },
    {
      key: 'balance',
      name: '🧘 Balance Creador',
      subtitle: 'Mente, Cuerpo & Descanso',
      icon: <FiSmile size={16} />,
      color: '#8E44AD',
      barColor: 'linear-gradient(90deg, #9B59B6, #1D7D8C)'
    }
  ];

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '24px',
      padding: '20px',
      border: '1px solid var(--border-color)',
      boxShadow: '0 4px 20px rgba(10, 42, 30, 0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{
          fontSize: '17px',
          fontFamily: 'var(--font-serif)',
          margin: 0,
          color: 'var(--text-main)',
          fontWeight: 700
        }}>
          5 Barras de Vida (Stats)
        </h3>
        <span style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans)',
          fontStyle: 'italic'
        }}>
          Actualización diaria
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {pillarsConfig.map(pillar => {
          const val = Math.min(100, Math.max(0, stats[pillar.key]));

          return (
            <div key={pillar.key} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '16px',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-sans)', color: 'var(--text-main)' }}>
                    {pillar.name}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Quick adjuster buttons */}
                  <button
                    onClick={() => onUpdateStat(pillar.key, -10)}
                    style={{
                      width: '24px', height: '24px', borderRadius: '6px',
                      border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <FiMinus size={12} />
                  </button>
                  
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-sans)',
                    color: pillar.color,
                    minWidth: '36px',
                    textAlign: 'right'
                  }}>
                    {val}%
                  </span>

                  <button
                    onClick={() => onUpdateStat(pillar.key, 10)}
                    style={{
                      width: '24px', height: '24px', borderRadius: '6px',
                      border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-main)'
                    }}
                  >
                    <FiPlus size={12} />
                  </button>
                </div>
              </div>

              {/* Subtitle */}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                {pillar.subtitle}
              </div>

              {/* Bar track */}
              <div style={{
                height: '8px',
                width: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginTop: '4px'
              }}>
                <div style={{
                  height: '100%',
                  width: `${val}%`,
                  background: pillar.barColor,
                  borderRadius: '4px',
                  transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
