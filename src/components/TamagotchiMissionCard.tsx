import { useState } from 'react';
import { FiCompass, FiChevronDown, FiChevronUp, FiEdit2, FiCheck, FiX } from 'react-icons/fi';

const DEFAULT_QUOTE = "Impulsando el crecimiento de la gastronomía real a través de la tecnología y la automatización, liberando tiempo para los creadores y construyendo un impacto ético y consciente en cada mesa.";
const DEFAULT_DESC = "Motor de Crecimiento Consciente para la Gastronomía: Tu misión es rescatar a los dueños de restaurantes y cafeterías del caos operativo mediante automatización e IA. Cuando sus métricas mejoran, no solo ganas dinero: haces florecer proyectos reales.";

export default function TamagotchiMissionCard() {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [quote, setQuote] = useState(() => {
    return localStorage.getItem('korat_tamagotchi_mission_quote') || DEFAULT_QUOTE;
  });

  const [desc, setDesc] = useState(() => {
    return localStorage.getItem('korat_tamagotchi_mission_desc') || DEFAULT_DESC;
  });

  const [editQuote, setEditQuote] = useState(quote);
  const [editDesc, setEditDesc] = useState(desc);

  const handleSave = () => {
    setQuote(editQuote);
    setDesc(editDesc);
    localStorage.setItem('korat_tamagotchi_mission_quote', editQuote);
    localStorage.setItem('korat_tamagotchi_mission_desc', editDesc);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditQuote(quote);
    setEditDesc(desc);
    setIsEditing(false);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(16, 77, 48, 0.08) 0%, rgba(29, 125, 140, 0.06) 100%)',
      border: '1px solid rgba(16, 77, 48, 0.15)',
      borderRadius: '20px',
      padding: '18px 20px',
      position: 'relative',
      boxShadow: '0 4px 16px rgba(10, 42, 30, 0.02)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'var(--accent-green)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FiCompass size={15} />
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'var(--accent-green)',
            fontFamily: 'var(--font-sans)'
          }}>
            Esencia del Emprendimiento
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {!isEditing ? (
            <button
              onClick={() => {
                setEditQuote(quote);
                setEditDesc(desc);
                setIsEditing(true);
                setExpanded(true);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Editar esencia"
            >
              <FiEdit2 size={15} />
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <FiX size={14} />
              </button>
              <button
                onClick={handleSave}
                style={{
                  background: 'var(--accent-green)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '3px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                <FiCheck size={14} /> Guardar
              </button>
            </>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {expanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
          </button>
        </div>
      </div>

      {!isEditing ? (
        <>
          <blockquote style={{
            margin: '6px 0 0 0',
            fontSize: '13.5px',
            lineHeight: 1.55,
            color: 'var(--text-main)',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            borderLeft: '2.5px solid var(--accent-green)',
            paddingLeft: '12px'
          }}>
            "{quote}"
          </blockquote>

          {expanded && (
            <div style={{
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px dashed rgba(16, 77, 48, 0.2)',
              fontSize: '12.5px',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.6
            }}>
              <p style={{ margin: 0 }}>{desc}</p>
            </div>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
              Frase Principal:
            </label>
            <textarea
              value={editQuote}
              onChange={e => setEditQuote(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                background: 'var(--bg-card)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
              Descripción / Propósito Ampliado:
            </label>
            <textarea
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '12.5px',
                fontFamily: 'var(--font-sans)',
                background: 'var(--bg-card)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
