import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSaaS } from '../context/SaaSContext';
import { supabase } from '../lib/supabase';
import type { SoftwareFeature, ContentPost, CRMLead } from '../types/saas';
import { formatPenAndUsd } from '../lib/currencyUtils';

export default function KoratFlowEngineView() {
  const navigate = useNavigate();
  const { currentSlug, currentProject, allProjects, setCurrentSlug, founderStats, refreshSaaSData } = useSaaS();

  const [features, setFeatures] = useState<SoftwareFeature[]>([]);
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [missionDone, setMissionDone] = useState(false);

  useEffect(() => {
    async function fetchPillars() {
      if (!currentProject?.id) return;
      try {
        const [featRes, postRes, leadRes] = await Promise.all([
          supabase.from('software_features').select('*').eq('project_id', currentProject.id),
          supabase.from('content_posts').select('*').eq('project_id', currentProject.id),
          supabase.from('crm_leads').select('*').eq('project_id', currentProject.id)
        ]);
        if (featRes.data) setFeatures(featRes.data as SoftwareFeature[]);
        if (postRes.data) setPosts(postRes.data as ContentPost[]);
        if (leadRes.data) setLeads(leadRes.data as CRMLead[]);
      } catch (err) {
        console.error('Error cargando métricas:', err);
      }
    }
    fetchPillars();
  }, [currentProject?.id]);

  // Gamificación Interna (Supabase Driven) - Nivel 7: Agencia SaaS Korat Flow Saludable
  const level = founderStats?.founder_level || 1;
  const currentXP = founderStats?.founder_xp || 0;
  const xpThresholds: Record<number, number> = { 1: 300, 2: 800, 3: 1500, 4: 2500, 5: 4000, 6: 6000, 7: 6000 };
  const targetXP = xpThresholds[level] || 6000;
  const prevXP = level > 1 ? (xpThresholds[level - 1] || 0) : 0;
  const xpRange = Math.max(targetXP - prevXP, 1);
  const xpProgress = Math.max(currentXP - prevXP, 0);
  const xpPercentage = level >= 7 ? 100 : Math.min(Math.round((xpProgress / xpRange) * 100), 100);

  const levelTitles: Record<number, string> = {
    1: 'Setup Inicial',
    2: 'Código Estable',
    3: 'Creador Activo',
    4: 'Pilotos Operativos',
    5: 'Primera Venta S/',
    6: 'Tracción & MRR',
    7: 'Agencia SaaS Saludable 👑'
  };

  const currentMRR = Number(founderStats?.accumulated_mrr || 0);
  const hireGoal = Number(founderStats?.first_hire_mrr_goal || 6000);
  const mrrPct = Math.min(Math.round((currentMRR / hireGoal) * 100), 100);

  const mrrFormatted = formatPenAndUsd(currentMRR);
  const goalFormatted = formatPenAndUsd(hireGoal);

  // Pillars
  const totalFeatures = features.length;
  const frozenFeatures = features.filter(f => f.is_frozen || f.status === 'frozen_100').length;
  const freezePct = totalFeatures > 0 ? Math.round((frozenFeatures / totalFeatures) * 100) : 0;

  const totalPosts = posts.length;
  const winningPosts = posts.filter(p => p.is_winning_pattern || Number(p.score) > 8.0).length;
  const publishedPosts = posts.filter(p => p.pipeline_stage === 'published').length;
  const editingPosts = posts.filter(p => p.pipeline_stage === 'editing_capcut_pc').length;

  const totalLeads = leads.length;
  const closedLeads = leads.filter(l => l.pipeline_stage === 'closed_won').length;
  const demoLeads = leads.filter(l => l.pipeline_stage === 'demo_scheduled').length;
  const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

  const missionText = totalFeatures === 0
    ? `Completar la checklist de Definition of Done para el primer módulo de ${currentProject?.name}`
    : winningPosts === 0
    ? `Grabar guión con Sony ZV-E10 y editar en CapCut PC buscando Score > 8.0`
    : `Enviar Script A/B a prospectos para agendar ${demoLeads + 2} demos esta semana`;

  const xpImpact = totalFeatures === 0 ? '+150 XP · Desbloquea módulo DoD' : '+100 XP · Desbloquea 1 demo automatizada';

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#F8F9FC',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      color: '#111827',
    }}>
      <div className="kf-pillar-container" style={{ paddingBottom: '100px' }}>

        {/* ─── TOP HEADER ─── */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 0 12px',
          backgroundColor: '#F8F9FC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Avatar */}
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#E0E7FF',
              border: '2px solid #C7D2FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              position: 'relative'
            }}>
              👤
              <span style={{
                position: 'absolute',
                bottom: '0px',
                right: '0px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                border: '2px solid #F8F9FC'
              }} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>
                Korat Flow
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Solo SaaS Builder</span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}
          >
            🔔
          </button>
        </header>

        {/* ─── MAIN SCROLL AREA ─── */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}>

          {/* ─── MULTI-SAAS SELECTOR ─── */}
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
              const isActive = p.slug === currentSlug;
              return (
                <button
                  key={p.slug}
                  onClick={() => setCurrentSlug(p.slug)}
                  style={{
                    padding: '10px 12px',
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

          {/* ─── DASHBOARD TOP CARDS (XP + MRR + Copiloto) ─── */}
          <div className="kf-dashboard-top">

          {/* ─── LEVEL & XP CARD ─── */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E5E7EB',
            padding: '18px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            {/* Level Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>
                    Fundador · Nivel {level}
                  </span>
                  <span style={{
                    backgroundColor: '#4F46E5',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {levelTitles[level]?.split(' ')[0] || 'Pro'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                  Experiencia acumulada
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                padding: '5px 10px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700
              }}>
                🔥 12 días
              </div>
            </div>

            {/* XP Bar */}
            <div style={{ marginBottom: '6px' }}>
              <div style={{
                height: '8px',
                backgroundColor: '#E5E7EB',
                borderRadius: '9999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${xpPercentage}%`,
                  background: 'linear-gradient(90deg, #4F46E5 0%, #818CF8 100%)',
                  borderRadius: '9999px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11.5px',
              color: '#6B7280'
            }}>
              <span>Nivel {level}</span>
              <span style={{ color: '#4F46E5', fontWeight: 700 }}>
                {currentXP.toLocaleString('es-ES')} / {targetXP.toLocaleString('es-ES')} XP
              </span>
              <span>Nivel {level + 1}</span>
            </div>
            <div style={{
              fontSize: '11px',
              color: '#9CA3AF',
              textAlign: 'center',
              marginTop: '4px'
            }}>
              Faltan {(targetXP - currentXP).toLocaleString('es-ES')} XP para Nivel {level + 1}
            </div>
          </div>

          {/* ─── MRR CARD ─── */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E5E7EB',
            padding: '18px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '14px'
            }}>
              <div>
                <div style={{ fontSize: '11.5px', color: '#6B7280', fontWeight: 600, marginBottom: '4px' }}>
                  Ingresos Recurrentes (MRR Agencia)
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color: '#111827',
                    letterSpacing: '-0.5px',
                    lineHeight: 1
                  }}>
                    {mrrFormatted.penFormatted}
                  </span>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#4F46E5',
                    backgroundColor: '#EEF2FF',
                    padding: '2px 7px',
                    borderRadius: '6px'
                  }}>
                    {mrrFormatted.usdFormatted}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '4px' }}>
                  Meta Nivel 7: {goalFormatted.penFormatted} <span style={{ color: '#9CA3AF' }}>({goalFormatted.usdFormatted})</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{
                  backgroundColor: '#DCFCE7',
                  color: '#166534',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '8px',
                  marginBottom: '4px'
                }}>
                  ● LATAM / Perú
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#4F46E5' }}>
                  {mrrPct}%
                </div>
              </div>
            </div>

            {/* MRR Progress */}
            <div style={{
              height: '8px',
              backgroundColor: '#E5E7EB',
              borderRadius: '9999px',
              overflow: 'hidden',
              marginBottom: '8px'
            }}>
              <div style={{
                height: '100%',
                width: `${mrrPct}%`,
                background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
                borderRadius: '9999px',
                transition: 'width 0.5s ease'
              }} />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10.5px',
              color: '#9CA3AF'
            }}>
              <span>S/ 0</span>
              <span style={{ color: '#4F46E5', fontWeight: 700 }}>
                Salud Agencia: 1er Colaborador (SDR / Soporte)
              </span>
              <span>{goalFormatted.penFormatted}</span>
            </div>
          </div>

          {/* ─── COPILOTO IA CARD ─── */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E5E7EB',
            padding: '18px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            {/* Status Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'
                }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>
                  Copiloto IA en Línea
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                color: '#6B7280',
                fontWeight: 600
              }}>
                {currentProject?.name} Ops AI v2.4
              </span>
            </div>

            {/* Priority Task */}
            <div style={{
              backgroundColor: '#F5F3FF',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  ⚡
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                  Prioridad de hoy:
                </span>
              </div>

              <p style={{
                fontSize: '13.5px',
                color: '#374151',
                lineHeight: 1.45,
                margin: '0 0 10px 0',
                textDecoration: missionDone ? 'line-through' : 'none'
              }}>
                {missionText}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#E0E7FF',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '11.5px',
                color: '#3730A3',
                fontWeight: 700
              }}>
                ⚡ {xpImpact}
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => setMissionDone(!missionDone)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                border: 'none',
                background: missionDone
                  ? '#F3F4F6'
                  : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: missionDone ? '#6B7280' : '#FFFFFF',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: missionDone ? 'none' : '0 4px 14px rgba(79, 70, 229, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{missionDone ? '↩' : '⚡'}</span>
              <span>{missionDone ? 'Deshacer Misión' : 'Ejecutar Misión Diaria'}</span>
            </button>
          </div>

          </div> {/* end kf-dashboard-top */}

          {/* ─── PILARES OPERACIONALES ─── */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>
                Pilares Operacionales
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#4F46E5',
                  backgroundColor: '#EEF2FF',
                  padding: '3px 8px',
                  borderRadius: '8px'
                }}>
                  3 de 3 activos
                </span>
                <span style={{ fontSize: '11.5px', color: '#6B7280', fontWeight: 600 }}>
                  Auditoría →
                </span>
              </div>
            </div>

            <div className="kf-pillar-cards-grid">

              {/* PILAR 1: SOFTWARE */}
              <div
                onClick={() => navigate('/korat-flow-engine/software')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1px solid #E5E7EB',
                  padding: '16px 18px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#EEF2FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      💻
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                        Producto & Automatizaciones
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#6B7280' }}>
                        Core SaaS n8n & Back-end
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#DCFCE7',
                    color: '#166534',
                    padding: '3px 9px',
                    borderRadius: '8px'
                  }}>
                    ● Estable
                  </span>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#6B7280',
                    marginBottom: '5px'
                  }}>
                    <span>Despliegue de Sprint</span>
                    <span style={{ fontWeight: 700, color: '#374151' }}>{freezePct}% Desplegado</span>
                  </div>
                  <div style={{
                    height: '6px',
                    backgroundColor: '#E5E7EB',
                    borderRadius: '9999px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${freezePct || 78}%`,
                      backgroundColor: '#4F46E5',
                      borderRadius: '9999px'
                    }} />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11.5px'
                }}>
                  <span style={{ color: '#6B7280' }}>
                    ⏱ {totalFeatures - frozenFeatures || 2} funciones pendientes de sellado
                  </span>
                  <span style={{
                    color: '#4F46E5',
                    fontWeight: 700,
                    fontSize: '11px'
                  }}>
                    n8n + Webhook
                  </span>
                </div>
              </div>

              {/* PILAR 2: TIKTOK */}
              <div
                onClick={() => navigate('/korat-flow-engine/tiktok')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1px solid #E5E7EB',
                  padding: '16px 18px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#FFF7ED',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      📱
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                        Marketing & Contenido
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#6B7280' }}>
                        Tracción Orgánica TikTok
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    padding: '3px 9px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}>
                    🔥 Racha: {winningPosts || 5} Días
                  </span>
                </div>

                <div style={{
                  backgroundColor: '#F0FDF4',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontSize: '11.5px', color: '#16A34A', fontWeight: 700, marginBottom: '3px' }}>
                    En producción activa
                  </div>
                  <div style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>
                    Hook: '{posts[0]?.hook?.slice(0, 35) || 'Cómo automaticé mi SaaS'}...'
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11.5px'
                }}>
                  <span style={{ color: '#6B7280' }}>
                    {editingPosts || 1} video en fase de edición
                  </span>
                  <span style={{
                    backgroundColor: '#DCFCE7',
                    color: '#166534',
                    fontWeight: 700,
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {publishedPosts > 0 ? 'Ver borrador →' : 'Listo para publicar hoy'}
                  </span>
                </div>
              </div>

              {/* PILAR 3: VENTAS */}
              <div
                onClick={() => navigate('/korat-flow-engine/ventas')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1px solid #E5E7EB',
                  padding: '16px 18px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#F0FDF4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      📈
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                        Pipeline & Clientes
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#6B7280' }}>
                        Conversión B2B Directa
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#4F46E5'
                  }}>
                    {conversionRate}% cierre
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    backgroundColor: '#F8F9FC',
                    borderRadius: '12px',
                    padding: '10px 12px'
                  }}>
                    <div style={{ fontSize: '10.5px', color: '#6B7280', fontWeight: 600 }}>
                      AGENDADAS
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginTop: '2px' }}>
                      {demoLeads || 3}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Demos</div>
                    <div style={{ fontSize: '10.5px', color: '#9CA3AF', marginTop: '1px' }}>Esta semana</div>
                  </div>
                  <div style={{
                    backgroundColor: '#F8F9FC',
                    borderRadius: '12px',
                    padding: '10px 12px'
                  }}>
                    <div style={{ fontSize: '10.5px', color: '#6B7280', fontWeight: 600 }}>
                      POR CONTACTAR
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginTop: '2px' }}>
                      {Math.max(totalLeads - demoLeads - closedLeads, 2)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Leads</div>
                    <div style={{ fontSize: '10.5px', color: '#9CA3AF', marginTop: '1px' }}>
                      {leads[0]?.business_name?.slice(0, 12) || 'SaKin & Spa'}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11.5px'
                }}>
                  <span style={{ color: '#6B7280' }}>
                    Leads: {leads[0]?.business_name || 'Salón Glamour'} & {leads[1]?.business_name || 'Spa Elite'}
                  </span>
                  <span style={{
                    color: '#4F46E5',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '11px'
                  }}>
                    ⏱ Contacto hoy
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ─── FAB CTA ─── */}
          <button
            onClick={() => navigate('/korat-flow-engine/ventas')}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              marginBottom: '8px'
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span>
            <span>Registrar Evento / Venta</span>
            <span style={{
              marginLeft: 'auto',
              fontSize: '10.5px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '2px 6px',
              borderRadius: '6px',
              fontWeight: 600
            }}>
              &lt; 3 seg
            </span>
          </button>

          <div style={{ height: '8px' }} />
        </main>
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
