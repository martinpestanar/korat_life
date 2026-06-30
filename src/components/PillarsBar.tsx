import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Pillar {
  id: string;
  name: string;
  label: string;
  total_xp: number;
}

export default function PillarsBar() {
  const [pillars, setPillars] = useState<Pillar[]>([]);

  useEffect(() => {
    supabase
      .from('pillars')
      .select('*')
      .order('total_xp', { ascending: false })
      .then(({ data }) => { if (data) setPillars(data); });
  }, []);

  const getPlantEmoji = (label: string) => {
    const clean = label.toLowerCase();
    if (clean.includes('salud') || clean.includes('cuerpo') || clean.includes('deporte')) return '🌱';
    if (clean.includes('estudio') || clean.includes('mente') || clean.includes('aprende')) return '🌸';
    if (clean.includes('trabajo') || clean.includes('negocio') || clean.includes('proyec')) return '🌴';
    return '🌿';
  };

  if (pillars.length === 0) return null;

  return (
    <div className="glass-card" style={{
      margin: '16px 16px 8px 16px',
      padding: '20px',
      border: '1px solid var(--border-color)',
      background: '#FFFFFF',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
        <h4 style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          margin: 0
        }}>
          Cultivo de Pilares
        </h4>
        <span style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '12px',
          fontStyle: 'italic',
          color: 'var(--accent-color)'
        }}>
          Jardín de Santa Teresa
        </span>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '4px',
        scrollbarWidth: 'none'
      }}>
        {pillars.map((pillar) => (
          <div 
            key={pillar.id}
            className="leaf-sway"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              backgroundColor: '#FAF9F6',
              padding: '12px 14px',
              borderRadius: '16px',
              border: '1px solid rgba(10, 42, 30, 0.04)',
              minWidth: '95px',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <div style={{ fontSize: '22px', marginBottom: '4px' }}>
              {getPlantEmoji(pillar.label)}
            </div>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              color: 'var(--text-main)',
              letterSpacing: '0.2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%'
            }}>
              {pillar.label}
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '2px',
              marginTop: '4px'
            }}>
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--accent-green)'
              }}>
                {pillar.total_xp}
              </span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>XP</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
