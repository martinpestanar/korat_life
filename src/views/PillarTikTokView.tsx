import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSaaS } from '../context/SaaSContext';
import { supabase } from '../lib/supabase';
import type { ContentPost } from '../types/saas';

const COLUMNS: { stage: ContentPost['pipeline_stage']; label: string; icon: string; accent: string; bg: string; border: string }[] = [
  { stage: 'idea',                  label: 'Ideas de Guión', icon: '💡', accent: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
  { stage: 'recording_sony_zve10', label: 'Grabación ZV-E10', icon: '🎥', accent: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
  { stage: 'editing_capcut_pc',    label: 'Edición CapCut',  icon: '✂️', accent: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { stage: 'published',            label: 'Publicado TikTok', icon: '🚀', accent: '#059669', bg: '#ECFDF5', border: '#A7F3D0' }
];

export default function PillarTikTokView() {
  const navigate = useNavigate();
  const { currentProject, allProjects, setCurrentSlug, refreshSaaSData } = useSaaS();
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPostForMetrics, setSelectedPostForMetrics] = useState<ContentPost | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [hook, setHook] = useState('');
  const [problem, setProblem] = useState('');
  const [cta, setCta] = useState('');

  // Metrics form
  const [metricViews, setMetricViews] = useState('');
  const [metricLikes, setMetricLikes] = useState('');
  const [metricDMs, setMetricDMs] = useState('');
  const [metricScore, setMetricScore] = useState('');

  const fetchPosts = async () => {
    if (!currentProject?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('content_posts')
      .select('*')
      .eq('project_id', currentProject.id)
      .order('created_at', { ascending: false });
    if (data) setPosts(data as ContentPost[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [currentProject?.id]);

  const handleCreateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentProject?.id) return;
    await supabase.from('content_posts').insert({
      project_id: currentProject.id,
      title: title.trim(),
      hook: hook.trim(),
      script_body: problem.trim(),
      cta: cta.trim(),
      pipeline_stage: 'idea',
      platform: 'tiktok',
      score: 7.0,
      views: 0,
      likes: 0,
      dms_received: 0
    });
    setTitle('');
    setHook('');
    setProblem('');
    setCta('');
    setIsModalOpen(false);
    fetchPosts();
    refreshSaaSData();
  };

  const handleMoveStage = async (postId: string, newStage: ContentPost['pipeline_stage']) => {
    await supabase.from('content_posts').update({ pipeline_stage: newStage }).eq('id', postId);
    fetchPosts();
  };

  const handleSaveMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostForMetrics) return;
    const viewsNum = parseInt(metricViews, 10) || 0;
    const likesNum = parseInt(metricLikes, 10) || 0;
    const dmsNum = parseInt(metricDMs, 10) || 0;
    let calculatedScore = parseFloat(metricScore);
    if (isNaN(calculatedScore) || calculatedScore === 0) {
      calculatedScore = Math.min(10, Math.round(((likesNum * 0.05) + (dmsNum * 1.2) + (viewsNum * 0.001)) * 10) / 10);
    }
    const isWinner = calculatedScore >= 8.0;

    await supabase.from('content_posts').update({
      views: viewsNum,
      likes: likesNum,
      dms_received: dmsNum,
      score: calculatedScore,
      is_winning_pattern: isWinner
    }).eq('id', selectedPostForMetrics.id);

    setSelectedPostForMetrics(null);
    fetchPosts();
    refreshSaaSData();
  };

  const totalPosts = posts.length;
  const winningPosts = posts.filter(p => p.is_winning_pattern || Number(p.score) >= 8.0).length;
  const publishedPosts = posts.filter(p => p.pipeline_stage === 'published').length;
  const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#F8F9FC',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      color: '#111827'
    }}>
      <div className="kf-pillar-container">

        {/* ─── TOP HEADER ─── */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '4px'
        }}>
          <div>
            <button
              onClick={() => navigate('/korat-flow-engine')}
              style={{
                background: 'none',
                border: 'none',
                color: '#4F46E5',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '4px'
              }}
            >
              ← Korat Flow Engine
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>📱</span>
              <h1 className="kf-pillar-title">
                TikTok & Producción Viral
              </h1>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>+</span>
            <span>Nuevo Guión</span>
          </button>
        </header>

        {/* ─── DUAL MULTI-SAAS SELECTOR (Stitch Pill) ─── */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          padding: '5px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
        }}>
          {allProjects.map(p => {
            const isActive = p.id === currentProject?.id;
            return (
              <button
                key={p.slug}
                onClick={() => setCurrentSlug(p.slug)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: isActive ? '#4F46E5' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#6B7280',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none'
                }}
              >
                <span style={{ fontSize: '15px' }}>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* ─── HERO METRICS CARD (Stitch Style) ─── */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E5E7EB',
          padding: '16px 18px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Embudo de Contenido Orgánico
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#111827', marginTop: '1px' }}>
                Fórmula Gancho 3s + Demo + CTA
              </div>
            </div>

            <div style={{
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              padding: '5px 10px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>⭐</span>
              <span>{winningPosts} Patrones &gt;8.0</span>
            </div>
          </div>

          {/* Mini Grid Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            paddingTop: '6px',
            borderTop: '1px solid #F3F4F6'
          }}>
            <div style={{ backgroundColor: '#F9FAFB', padding: '10px 8px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280' }}>TOTAL</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginTop: '2px' }}>{totalPosts}</div>
            </div>

            <div style={{ backgroundColor: '#F0F9FF', padding: '10px 8px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#0369A1' }}>EN PRODUCCIÓN</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284C7', marginTop: '2px' }}>
                {posts.filter(p => p.pipeline_stage === 'recording_sony_zve10' || p.pipeline_stage === 'editing_capcut_pc').length}
              </div>
            </div>

            <div style={{ backgroundColor: '#ECFDF5', padding: '10px 8px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#047857' }}>PUBLICADOS</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{publishedPosts}</div>
            </div>

            <div style={{ backgroundColor: '#EEF2FF', padding: '10px 8px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#4338CA' }}>VISTAS TOTAL</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#4F46E5', marginTop: '2px' }}>
                {totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews}
              </div>
            </div>
          </div>
        </div>

        {/* ─── KANBAN BOARD ─── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#6B7280', fontSize: '13px' }}>
            📱 Cargando tablero Kanban...
          </div>
        ) : (
          <div className="kf-kanban-grid">
            {COLUMNS.map(col => {
              const colPosts = posts.filter(p => p.pipeline_stage === col.stage);
              return (
                <div
                  key={col.stage}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Column Header */}
                  <div style={{
                    backgroundColor: col.bg,
                    padding: '10px 14px',
                    borderBottom: `1px solid ${col.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '15px' }}>{col.icon}</span>
                      <span style={{ fontSize: '12.5px', fontWeight: 800, color: col.accent }}>
                        {col.label}
                      </span>
                    </div>

                    <span style={{
                      backgroundColor: '#FFFFFF',
                      color: col.accent,
                      border: `1px solid ${col.border}`,
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}>
                      {colPosts.length}
                    </span>
                  </div>

                  {/* Column Cards */}
                  <div style={{
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    minHeight: '120px'
                  }}>
                    {colPosts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 8px', color: '#9CA3AF', fontSize: '11.5px' }}>
                        Sin videos en esta fase
                      </div>
                    ) : (
                      colPosts.map(post => {
                        const isWinner = post.is_winning_pattern || Number(post.score) >= 8.0;
                        return (
                          <div
                            key={post.id}
                            style={{
                              backgroundColor: '#FFFFFF',
                              borderRadius: '14px',
                              border: isWinner ? '1.5px solid #F59E0B' : '1px solid #E5E7EB',
                              boxShadow: isWinner ? '0 3px 10px rgba(245, 158, 11, 0.15)' : '0 1px 3px rgba(0,0,0,0.02)',
                              padding: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: 0, flex: 1, lineHeight: 1.3 }}>
                                {post.title}
                              </h4>
                              {isWinner && (
                                <span style={{
                                  backgroundColor: '#FEF3C7',
                                  color: '#92400E',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  flexShrink: 0
                                }}>
                                  ⭐ WINNER
                                </span>
                              )}
                            </div>

                            {post.hook && (
                              <div style={{
                                backgroundColor: '#F8F9FC',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                color: '#4B5563',
                                fontStyle: 'italic',
                                lineHeight: 1.3
                              }}>
                                🎯 "{post.hook.length > 55 ? post.hook.slice(0, 55) + '...' : post.hook}"
                              </div>
                            )}

                            {/* Performance Footer */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '10.5px',
                              color: '#9CA3AF',
                              paddingTop: '6px',
                              borderTop: '1px dashed #E5E7EB'
                            }}>
                              <span>Score: <strong style={{ color: isWinner ? '#D97706' : '#111827' }}>{post.score || '7.0'}</strong></span>
                              <span>👁 {post.views || 0} · 💬 {post.dms_received || 0}</span>
                            </div>

                            {/* Actions bar */}
                            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                              <select
                                value={post.pipeline_stage}
                                onChange={e => handleMoveStage(post.id, e.target.value as any)}
                                style={{
                                  flex: 1,
                                  fontSize: '11px',
                                  padding: '5px 8px',
                                  borderRadius: '8px',
                                  border: '1px solid #D1D5DB',
                                  backgroundColor: '#fff',
                                  color: '#374151'
                                }}
                              >
                                <option value="idea">💡 Ideas</option>
                                <option value="recording_sony_zve10">🎥 Grabación</option>
                                <option value="editing_capcut_pc">✂️ Edición</option>
                                <option value="published">🚀 Publicado</option>
                              </select>

                              <button
                                onClick={() => {
                                  setSelectedPostForMetrics(post);
                                  setMetricViews(String(post.views || 0));
                                  setMetricLikes(String(post.likes || 0));
                                  setMetricDMs(String(post.dms_received || 0));
                                  setMetricScore(String(post.score || ''));
                                }}
                                style={{
                                  backgroundColor: '#F3F4F6',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '8px',
                                  padding: '5px 8px',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                                title="Editar Métricas"
                              >
                                📊
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── CREATE SCRIPT MODAL ─── */}
        {isModalOpen && (
          <div className="kf-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="kf-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div className="kf-modal-handle" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#111827', margin: 0 }}>
                  📝 Crear Guión de TikTok
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9CA3AF' }}
                >
                  ✕
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '-4px 0 0' }}>
                Para <strong>{currentProject?.name}</strong> · Fórmula: Gancho 3s → Dolor/Demo → CTA
              </p>

              <form onSubmit={handleCreateScript} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                <div>
                  <label className="kf-label">Tema / Título del Video *</label>
                  <input
                    type="text"
                    required
                    className="kf-input"
                    placeholder="Ej. El error que hace perder 20 clientes al mes"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="kf-label">1. Gancho Visual / Verbal (3 Segundos) *</label>
                  <input
                    type="text"
                    required
                    className="kf-input"
                    placeholder="Ej. 'Si tu restaurante aún toma pedidos con comandas de papel...'"
                    value={hook}
                    onChange={e => setHook(e.target.value)}
                  />
                </div>

                <div>
                  <label className="kf-label">2. Dolor del Cliente & Demostración de Software</label>
                  <textarea
                    className="kf-input"
                    placeholder="Explica la fuga de dinero y muestra la pantalla del SaaS en 15s..."
                    value={problem}
                    onChange={e => setProblem(e.target.value)}
                    rows={3}
                    style={{ resize: 'none' }}
                  />
                </div>

                <div>
                  <label className="kf-label">3. Llamado a la Acción (CTA)</label>
                  <input
                    type="text"
                    className="kf-input"
                    placeholder="Ej. 'Comenta MENÚ y te activo una prueba de 7 días'"
                    value={cta}
                    onChange={e => setCta(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '6px' }}>
                  <button type="button" className="kf-btn kf-btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="kf-btn kf-btn-primary">
                    ✓ Guardar en Ideas
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── METRICS MODAL ─── */}
        {selectedPostForMetrics && (
          <div className="kf-overlay" onClick={() => setSelectedPostForMetrics(null)}>
            <div className="kf-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
              <div className="kf-modal-handle" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>📊 Métricas de Rendimiento</h3>
                <button onClick={() => setSelectedPostForMetrics(null)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#9CA3AF' }}>✕</button>
              </div>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '-4px 0 0' }}>
                {selectedPostForMetrics.title}
              </p>

              <form onSubmit={handleSaveMetrics} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label className="kf-label">Vistas</label>
                    <input type="number" className="kf-input" value={metricViews} onChange={e => setMetricViews(e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label className="kf-label">Me Gusta</label>
                    <input type="number" className="kf-input" value={metricLikes} onChange={e => setMetricLikes(e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label className="kf-label">DMs / Leads</label>
                    <input type="number" className="kf-input" value={metricDMs} onChange={e => setMetricDMs(e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label className="kf-label">Score (0-10)</label>
                    <input type="number" step="0.1" min="0" max="10" className="kf-input" placeholder="Auto" value={metricScore} onChange={e => setMetricScore(e.target.value)} />
                  </div>
                </div>

                <div style={{ backgroundColor: '#EEF2FF', borderRadius: '10px', padding: '10px', fontSize: '11.5px', color: '#4338CA' }}>
                  ⚡ Score &gt;= 8.0 activa automáticamente el sello de <strong>Patrón Ganador</strong> y suma +100 XP.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" className="kf-btn kf-btn-secondary" onClick={() => setSelectedPostForMetrics(null)}>Cancelar</button>
                  <button type="submit" className="kf-btn kf-btn-primary">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
