import { FiActivity } from 'react-icons/fi';

interface TamagotchiHeaderProps {
  healthScore: number;
  overallMood: 'on_fire' | 'healthy' | 'hungry' | 'sleeping';
  agencyName?: string;
}

export default function TamagotchiHeader({
  healthScore,
  overallMood,
  agencyName = 'GastroGrowth OS'
}: TamagotchiHeaderProps) {
  
  const getMoodDetails = () => {
    switch (overallMood) {
      case 'on_fire':
        return {
          emoji: '🔥',
          title: '¡EN LLAMA!',
          subtitle: 'Crecimiento exponencial activado',
          bgColor: 'rgba(212, 106, 67, 0.12)',
          borderColor: 'rgba(212, 106, 67, 0.4)',
          textColor: '#D46A43',
          avatarBg: 'linear-gradient(135deg, #D46A43, #E6B033)'
        };
      case 'healthy':
        return {
          emoji: '🌿',
          title: 'Saludable & Vital',
          subtitle: 'Tu negocio responde a tu alimento',
          bgColor: 'rgba(16, 77, 48, 0.12)',
          borderColor: 'rgba(16, 77, 48, 0.3)',
          textColor: '#104D30',
          avatarBg: 'linear-gradient(135deg, #104D30, #1D7D8C)'
        };
      case 'hungry':
        return {
          emoji: '🥗',
          title: 'Necesita Nutrición',
          subtitle: 'Faltan prospectos o visibilidad hoy',
          bgColor: 'rgba(230, 176, 51, 0.15)',
          borderColor: 'rgba(230, 176, 51, 0.4)',
          textColor: '#9E7200',
          avatarBg: 'linear-gradient(135deg, #E6B033, #D46A43)'
        };
      default:
        return {
          emoji: '💤',
          title: 'Modo Reposo',
          subtitle: 'Alimenta a tu Tamagotchi con acción',
          bgColor: 'rgba(104, 124, 114, 0.12)',
          borderColor: 'rgba(104, 124, 114, 0.3)',
          textColor: '#687C72',
          avatarBg: 'linear-gradient(135deg, #687C72, #0A2A1E)'
        };
    }
  };

  const mood = getMoodDetails();

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '24px',
      padding: '20px',
      border: '1px solid var(--border-color)',
      boxShadow: '0 8px 24px rgba(10, 42, 30, 0.04)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative subtle background glow */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '120px',
        height: '120px',
        background: mood.avatarBg,
        filter: 'blur(40px)',
        opacity: 0.25,
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        
        {/* Avatar & Mood Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            position: 'relative',
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: mood.avatarBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
            border: '2px solid white'
          }}>
            <span>{mood.emoji}</span>
            {/* Animated status dot */}
            <span style={{
              position: 'absolute',
              bottom: '-3px',
              right: '-3px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: healthScore > 70 ? '#104D30' : healthScore > 40 ? '#E6B033' : '#D46A43',
              border: '2px solid var(--bg-card)'
            }} />
          </div>

          <div>
            <span style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)'
            }}>
              {agencyName} • Tamagotchi OS
            </span>
            <h2 style={{
              fontSize: '20px',
              margin: '2px 0 0 0',
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-main)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              Negocio Vivo
            </h2>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              margin: 0,
              fontStyle: 'italic'
            }}>
              {mood.subtitle}
            </p>
          </div>
        </div>

        {/* Health Score Pill */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'end',
          padding: '8px 12px',
          borderRadius: '16px',
          background: mood.bgColor,
          border: `1px solid ${mood.borderColor}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: mood.textColor }}>
            <FiActivity size={14} />
            <span style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-sans)' }}>
              {Math.round(healthScore)}%
            </span>
          </div>
          <span style={{
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: mood.textColor,
            letterSpacing: '0.5px'
          }}>
            Vitalidad
          </span>
        </div>

      </div>
    </div>
  );
}
