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

  if (pillars.length === 0) return null;

  return (
    <div style={{
      padding: '16px 20px',
      borderBottom: '1px solid var(--border-color)',
      overflowX: 'auto'
    }}>
      <p style={{
        fontSize: '10px',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-sans)',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        marginBottom: '10px'
      }}>
        Pilares · Puntos de Enfoque
      </p>

      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '0',
        minWidth: 'max-content',
        width: '100%'
      }}>
        {pillars.map((pillar, i) => (
          <div key={pillar.id} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <div style={{
                width: '1px',
                height: '28px',
                backgroundColor: 'var(--border-color)',
                margin: '0 16px',
                flexShrink: 0
              }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{
                fontSize: '9px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                letterSpacing: '1.5px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase'
              }}>
                {pillar.label}
              </span>
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '18px',
                color: pillar.total_xp >= 200 ? 'var(--accent-color)' : 'var(--text-main)',
                lineHeight: 1,
                transition: 'color 0.4s ease'
              }}>
                {pillar.total_xp}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '2px' }}>xp</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
