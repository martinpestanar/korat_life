import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FiX, FiTrash2, FiEdit2 } from 'react-icons/fi';
import type { MiniChallenge } from './MiniChallengeCard';

interface Pillar {
  id: string;
  name: string;
  label: string;
}

export default function ManageChallengesModal({
  isOpen,
  onClose,
  onRefresh
}: {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [challenges, setChallenges] = useState<MiniChallenge[]>([]);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [xpReward, setXpReward] = useState(100);
  const [pillarId, setPillarId] = useState('');

  const fetchChallengesAndPillars = async () => {
    setLoading(true);
    try {
      const { data: chData } = await supabase
        .from('mini_challenges')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: pData } = await supabase
        .from('pillars')
        .select('*');

      if (chData) setChallenges(chData);
      if (pData) {
        setPillars(pData);
        if (pData.length > 0 && !pillarId) {
          setPillarId(pData[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChallengesAndPillars();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setTitle('');
    setDurationDays(7);
    setXpReward(100);
    if (pillars.length > 0) {
      setPillarId(pillars[0].id);
    }
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !pillarId) return;

    try {
      if (isEditing && currentId) {
        await supabase
          .from('mini_challenges')
          .update({
            title,
            duration_days: durationDays,
            xp_reward: xpReward,
            pillar_id: pillarId
          })
          .eq('id', currentId);
      } else {
        await supabase
          .from('mini_challenges')
          .insert({
            title,
            duration_days: durationDays,
            xp_reward: xpReward,
            pillar_id: pillarId,
            current_day: 0,
            active: false
          });
      }
      resetForm();
      fetchChallengesAndPillars();
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditClick = (ch: MiniChallenge & { pillar_id?: string }) => {
    setIsEditing(true);
    setCurrentId(ch.id);
    setTitle(ch.title);
    setDurationDays(ch.duration_days);
    setXpReward(ch.xp_reward);
    setPillarId(ch.pillar_id || (pillars.length > 0 ? pillars[0].id : ''));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este reto?')) return;
    try {
      await supabase.from('mini_challenges').delete().eq('id', id);
      fetchChallengesAndPillars();
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (ch: MiniChallenge) => {
    const nextActive = !ch.active;
    try {
      await supabase
        .from('mini_challenges')
        .update({
          active: nextActive,
          // If activating, reset day counter and start date to today
          ...(nextActive ? { current_day: 0, started_at: new Date().toISOString().split('T')[0], last_check_in: null } : {})
        })
        .eq('id', ch.id);
      
      fetchChallengesAndPillars();
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-app)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        animation: 'slideUp 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-main)',
            margin: 0
          }}>
            Administrar Mini Retos
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Editor Form */}
          <form onSubmit={handleSave} style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '14px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              color: 'var(--text-main)',
              margin: 0
            }}>
              {isEditing ? 'Editar Reto' : 'Crear Reto Personalizado'}
            </h3>

            <input
              type="text"
              placeholder="Ej: 7 días sin cafeína por la tarde"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Días</label>
                <input
                  type="number"
                  min={1}
                  value={durationDays}
                  onChange={e => setDurationDays(parseInt(e.target.value) || 7)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>XP Recompensa</label>
                <input
                  type="number"
                  min={10}
                  value={xpReward}
                  onChange={e => setXpReward(parseInt(e.target.value) || 100)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Pilar Vinculado</label>
              <select
                value={pillarId}
                onChange={e => setPillarId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                {pillars.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  backgroundColor: 'var(--text-main)',
                  color: 'var(--bg-app)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {isEditing ? 'Guardar Cambios' : 'Crear Reto'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    backgroundColor: 'none',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              color: 'var(--text-main)',
              margin: '8px 0 4px 0'
            }}>
              Tus Retos
            </h3>

            {loading && challenges.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cargando retos...</p>
            ) : challenges.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                No tienes retos guardados. Crea uno arriba.
              </p>
            ) : (
              challenges.map(ch => {
                const pillar = pillars.find(p => p.id === (ch as any).pillar_id);
                return (
                  <div key={ch.id} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: ch.active ? 'rgba(204, 101, 67, 0.04)' : 'transparent',
                    borderColor: ch.active ? 'var(--accent-color)' : 'var(--border-color)',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: 'var(--text-main)',
                          margin: 0
                        }}>
                          {ch.title}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                          {pillar ? pillar.label : ''} · {ch.duration_days} días · +{ch.xp_reward} XP
                        </p>
                      </div>

                      {/* Switch and action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => handleToggleActive(ch)}
                          style={{
                            backgroundColor: ch.active ? 'var(--accent-color)' : 'var(--border-color)',
                            color: ch.active ? 'white' : 'var(--text-muted)',
                            border: 'none',
                            borderRadius: '20px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontWeight: 500
                          }}
                        >
                          {ch.active ? 'Activo' : 'Activar'}
                        </button>

                        <button
                          onClick={() => handleEditClick(ch)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          <FiEdit2 size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(ch.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
