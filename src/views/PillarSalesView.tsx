import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSaaS } from '../context/SaaSContext';
import { supabase } from '../lib/supabase';
import type { CRMLead } from '../types/saas';
import { formatPenAndUsd } from '../lib/currencyUtils';

interface ScriptStat {
  script_name: string;
  times_sent: number;
  responses_received: number;
  response_rate_percent: number;
  demos_scheduled: number;
  deals_won: number;
  conversion_rate_percent: number;
}

const PIPELINE_STAGES: { stage: CRMLead['pipeline_stage']; label: string; icon: string; accent: string; bg: string; border: string }[] = [
  { stage: 'prospect',       label: 'Leads Nuevos',     icon: '📥', accent: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
  { stage: 'demo_scheduled', label: 'Demo Agendada',   icon: '📅', accent: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
  { stage: 'responded',      label: 'Propuesta Enviada', icon: '📝', accent: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { stage: 'closed_won',     label: 'Cliente Cerrado ✓', icon: '🎉', accent: '#059669', bg: '#ECFDF5', border: '#A7F3D0' }
];

export default function PillarSalesView() {
  const navigate = useNavigate();
  const { currentProject, allProjects, setCurrentSlug, refreshSaaSData } = useSaaS();
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [scriptStats, setScriptStats] = useState<ScriptStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'pilots' | 'copylab'>('pipeline');

  // New lead form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [leadSource, setLeadSource] = useState<'cold_ig_dm' | 'inbound_tiktok' | 'referral' | 'walk_in' | 'ads'>('cold_ig_dm');
  const [dealValue, setDealValue] = useState('189');
  const [isPilot, setIsPilot] = useState(false);
  const [pilotNotes, setPilotNotes] = useState('');

  // Script Dispatch Test state
  const [selectedLeadForScript, setSelectedLeadForScript] = useState<CRMLead | null>(null);
  const [selectedScriptName, setSelectedScriptName] = useState('Script A: Problema de Cancelaciones');
  const [scriptResponseReceived, setScriptResponseReceived] = useState(true);

  const fetchSalesData = async () => {
    if (!currentProject?.id) return;
    setLoading(true);

    try {
      const { data: leadsData } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });

      if (leadsData) setLeads(leadsData as CRMLead[]);

      const { data: rpcData, error: rpcErr } = await supabase
        .rpc('calculate_script_effectiveness', { p_project_id: currentProject.id });

      if (!rpcErr && rpcData) {
        setScriptStats(rpcData as ScriptStat[]);
      }
    } catch (err) {
      console.error('Error cargando ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [currentProject?.id]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !currentProject?.id) return;

    await supabase.from('crm_leads').insert({
      project_id: currentProject.id,
      business_name: businessName.trim(),
      contact_name: contactName.trim() || undefined,
      phone: phone.trim() || undefined,
      lead_source: leadSource,
      pipeline_stage: 'prospect',
      monthly_deal_value: parseFloat(dealValue) || 149,
      is_pilot_project: isPilot,
      pilot_notes: pilotNotes.trim() || undefined,
      onboarding_status: isPilot ? 'in_progress' : 'pending',
      response_rate: 0,
      scripts_sent: []
    });

    setBusinessName('');
    setContactName('');
    setPhone('');
    setDealValue('149');
    setIsPilot(false);
    setPilotNotes('');
    setIsModalOpen(false);
    fetchSalesData();
  };

  const handleUpdateStage = async (leadId: string, newStage: CRMLead['pipeline_stage']) => {
    await supabase
      .from('crm_leads')
      .update({ pipeline_stage: newStage })
      .eq('id', leadId);

    fetchSalesData();
    if (newStage === 'closed_won') {
      refreshSaaSData();
    }
  };

  const handleSendScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForScript) return;

    const existingScripts = selectedLeadForScript.scripts_sent || [];
    const newEntry = {
      script_name: selectedScriptName,
      sent_at: new Date().toISOString(),
      response_received: scriptResponseReceived
    };
    const updatedScripts = [...existingScripts, newEntry];
    const positiveResponses = updatedScripts.filter(s => s.response_received).length;
    const responseRate = Math.round((positiveResponses / updatedScripts.length) * 100);

    await supabase
      .from('crm_leads')
      .update({
        scripts_sent: updatedScripts,
        response_rate: responseRate,
        pipeline_stage: scriptResponseReceived ? 'demo_scheduled' : 'script_sent'
      })
      .eq('id', selectedLeadForScript.id);

    setSelectedLeadForScript(null);
    fetchSalesData();
    refreshSaaSData();
  };

  const pilotLeads = leads.filter(l => l.is_pilot_project);
  const closedLeads = leads.filter(l => l.pipeline_stage === 'closed_won');
  const totalWonMRR = closedLeads.reduce((acc, l) => acc + Number(l.monthly_deal_value || 0), 0);
  const conversionRate = leads.length > 0 ? Math.round((closedLeads.length / leads.length) * 100) : 0;

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
              <span style={{ fontSize: '20px' }}>💼</span>
              <h1 className="kf-pillar-title">
                Ventas, Clientes & MRR
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
            <span>Nuevo Prospecto</span>
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

        {/* ─── HERO REVENUE CARD (Stitch Style) ─── */}
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
                Embudo Comercial & Conversión ({currentProject?.name})
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
                  {formatPenAndUsd(totalWonMRR).penFormatted}
                </span>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#4F46E5', backgroundColor: '#EEF2FF', padding: '2px 7px', borderRadius: '6px' }}>
                  {formatPenAndUsd(totalWonMRR).usdFormatted} / mes
                </span>
              </div>
            </div>

            <div style={{
              backgroundColor: '#DCFCE7',
              color: '#166534',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '12.5px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>🎉</span>
              <span>{conversionRate}% Conversión</span>
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
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280' }}>PROSPECTOS</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginTop: '2px' }}>{leads.length}</div>
            </div>

            <div style={{ backgroundColor: '#F0F9FF', padding: '10px 8px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#0369A1' }}>🌟 PILOTOS</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284C7', marginTop: '2px' }}>{pilotLeads.length}</div>
            </div>

            <div style={{ backgroundColor: '#ECFDF5', padding: '10px 8px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#047857' }}>CLIENTES CERRADOS</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{closedLeads.length}</div>
            </div>

            <div style={{ backgroundColor: '#EEF2FF', padding: '10px 8px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#4338CA' }}>XP POR CIERRE</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#4F46E5', marginTop: '2px' }}>+300</div>
            </div>
          </div>
        </div>

        {/* ─── TABS FILTER ─── */}
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          {[
            { id: 'pipeline', label: '📊 Pipeline Kanban', count: leads.length },
            { id: 'pilots',   label: '🌟 Proyectos Piloto', count: pilotLeads.length },
            { id: 'copylab',  label: '💬 Laboratorio Copys A/B', count: scriptStats.length }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  border: isActive ? '1px solid #4F46E5' : '1px solid #E5E7EB',
                  backgroundColor: isActive ? '#EEF2FF' : '#FFFFFF',
                  color: isActive ? '#4F46E5' : '#4B5563',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isActive ? '0 1px 4px rgba(79, 70, 229, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  backgroundColor: isActive ? '#4F46E5' : '#F3F4F6',
                  color: isActive ? '#FFFFFF' : '#6B7280',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '8px'
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── TAB 1: KANBAN PIPELINE ─── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#6B7280', fontSize: '13px' }}>
            💼 Cargando datos comerciales...
          </div>
        ) : activeTab === 'pipeline' ? (
          <div className="kf-kanban-grid">
            {PIPELINE_STAGES.map(col => {
              const stageLeads = leads.filter(l => l.pipeline_stage === col.stage);
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
                      {stageLeads.length}
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
                    {stageLeads.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 8px', color: '#9CA3AF', fontSize: '11.5px' }}>
                        Sin prospectos aquí
                      </div>
                    ) : (
                      stageLeads.map(lead => {
                        const isWon = lead.pipeline_stage === 'closed_won';
                        return (
                          <div
                            key={lead.id}
                            style={{
                              backgroundColor: '#FFFFFF',
                              borderRadius: '14px',
                              border: isWon ? '1.5px solid #10B981' : '1px solid #E5E7EB',
                              boxShadow: isWon ? '0 3px 10px rgba(16, 185, 129, 0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
                              padding: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                              <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#111827', margin: 0, flex: 1, lineHeight: 1.3 }}>
                                {lead.business_name}
                              </h4>
                              {lead.is_pilot_project && (
                                <span style={{
                                  backgroundColor: '#EEF2FF',
                                  color: '#4F46E5',
                                  fontSize: '9.5px',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  flexShrink: 0
                                }}>
                                  PILOTO
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '11.5px', color: '#6B7280', lineHeight: 1.3 }}>
                              {lead.contact_name || 'Sin contacto directo'} · {lead.phone || lead.lead_source}
                            </div>

                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '10.5px',
                              color: '#9CA3AF',
                              paddingTop: '6px',
                              borderTop: '1px dashed #E5E7EB'
                            }}>
                              <span>Plan: <strong style={{ color: '#059669' }}>{formatPenAndUsd(lead.monthly_deal_value || 0).penFormatted}</strong> <span style={{ fontSize: '9.5px' }}>({formatPenAndUsd(lead.monthly_deal_value || 0).usdFormatted})</span></span>
                              <span>Resp: {lead.response_rate}%</span>
                            </div>

                            {/* Actions bar */}
                            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                              <select
                                value={lead.pipeline_stage}
                                onChange={e => handleUpdateStage(lead.id, e.target.value as any)}
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
                                <option value="prospect">📥 Lead Nuevo</option>
                                <option value="demo_scheduled">📅 Demo Agendada</option>
                                <option value="responded">📝 Propuesta</option>
                                <option value="closed_won">🎉 Cerrado (+300 XP)</option>
                                <option value="closed_lost">❌ Perdido</option>
                              </select>

                              <button
                                onClick={() => setSelectedLeadForScript(lead)}
                                style={{
                                  backgroundColor: '#F3F4F6',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '8px',
                                  padding: '5px 8px',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                                title="Enviar Copy A/B"
                              >
                                💬
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
        ) : activeTab === 'pilots' ? (
          /* ─── TAB 2: PILOTOS ─── */
          <div className="kf-pilot-grid">
            {pilotLeads.length === 0 ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px dashed #D1D5DB',
                padding: '32px',
                textAlign: 'center',
                color: '#6B7280'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌟</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Sin proyectos piloto activos</div>
                <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
                  Al registrar un prospecto puedes tildar la casilla de Proyecto Piloto.
                </div>
              </div>
            ) : (
              pilotLeads.map(pilot => (
                <div
                  key={pilot.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #C7D2FE',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>🌟</span>
                      <div>
                        <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#111827', margin: 0 }}>
                          {pilot.business_name}
                        </h4>
                        <span style={{ fontSize: '11.5px', color: '#6B7280' }}>
                          {pilot.contact_name || 'Gerencia'} · {pilot.phone || 'Sin teléfono'}
                        </span>
                      </div>
                    </div>

                    <span style={{
                      backgroundColor: '#EEF2FF',
                      color: '#4F46E5',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      {pilot.onboarding_status?.toUpperCase() || 'EN MARCHA'}
                    </span>
                  </div>

                  {pilot.pilot_notes && (
                    <div style={{ backgroundColor: '#F8F9FC', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#374151' }}>
                      📝 {pilot.pilot_notes}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#6B7280', paddingTop: '4px', borderTop: '1px dashed #E5E7EB' }}>
                    <span>Fase: <strong style={{ color: '#111827' }}>{pilot.pipeline_stage}</strong></span>
                    <span>Valor Acordado: <strong style={{ color: '#059669' }}>${pilot.monthly_deal_value} USD/m</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* ─── TAB 3: COPY LAB ─── */
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E5E7EB',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>
                💬 Laboratorio de Efectividad de Scripts A/B
              </h3>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>
                Mide qué mensaje genera mayor tasa de respuesta positiva y agenda de demos.
              </p>
            </div>

            {scriptStats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: '12px' }}>
                Aún no hay estadísticas. Usa el botón 💬 en el Kanban para registrar envíos a prospectos.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {scriptStats.map((stat, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#F8F9FC',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>{stat.script_name}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                        {stat.times_sent}x enviado · {stat.responses_received} respuestas · {stat.deals_won} cierres
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '9.5px', color: '#9CA3AF', fontWeight: 700 }}>RESPUESTA</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#059669' }}>{stat.response_rate_percent}%</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '9.5px', color: '#9CA3AF', fontWeight: 700 }}>CIERRE</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#4F46E5' }}>{stat.conversion_rate_percent}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── CREATE LEAD MODAL ─── */}
        {isModalOpen && (
          <div className="kf-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="kf-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
              <div className="kf-modal-handle" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>➕ Registrar Prospecto</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#9CA3AF' }}>✕</button>
              </div>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '-4px 0 0' }}>
                Para <strong>{currentProject?.name}</strong>
              </p>

              <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                <div>
                  <label className="kf-label">Nombre del Negocio / Local *</label>
                  <input
                    type="text"
                    required
                    className="kf-input"
                    placeholder="Ej. Salón Elegance Studio"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="kf-label">Dueño / Contacto</label>
                    <input
                      type="text"
                      className="kf-input"
                      placeholder="Nombre del encargado"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="kf-label">WhatsApp / Teléfono</label>
                    <input
                      type="text"
                      className="kf-input"
                      placeholder="+54 9 11..."
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="kf-label">Canal de Origen</label>
                    <select
                      className="kf-input kf-select"
                      value={leadSource}
                      onChange={e => setLeadSource(e.target.value as any)}
                    >
                      <option value="cold_ig_dm">Cold IG DM</option>
                      <option value="inbound_tiktok">Inbound TikTok</option>
                      <option value="referral">Referido</option>
                      <option value="walk_in">Visita Presencial</option>
                    </select>
                  </div>
                  <div>
                    <label className="kf-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Cuota Plan (Soles S/)</span>
                      <span style={{ color: '#4F46E5', fontWeight: 700 }}>
                        {formatPenAndUsd(parseFloat(dealValue) || 0).usdFormatted}
                      </span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: '10px', fontWeight: 700, color: '#6B7280' }}>S/</span>
                      <input
                        type="number"
                        className="kf-input"
                        style={{ paddingLeft: '32px', fontWeight: 700 }}
                        value={dealValue}
                        onChange={e => setDealValue(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600, color: '#4F46E5', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isPilot}
                    onChange={e => setIsPilot(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#4F46E5' }}
                  />
                  ¿Es un Proyecto Piloto de Implementación?
                </label>

                {isPilot && (
                  <div>
                    <label className="kf-label">Notas de Piloto</label>
                    <textarea
                      className="kf-input"
                      placeholder="Plazos de prueba, sucursal, etc."
                      value={pilotNotes}
                      onChange={e => setPilotNotes(e.target.value)}
                      rows={2}
                      style={{ resize: 'none' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
                  <button type="button" className="kf-btn kf-btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="kf-btn kf-btn-primary">
                    ✓ Guardar Prospecto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── DISPATCH SCRIPT MODAL ─── */}
        {selectedLeadForScript && (
          <div className="kf-overlay" onClick={() => setSelectedLeadForScript(null)}>
            <div className="kf-modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
              <div className="kf-modal-handle" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>💬 Enviar Copy A/B</h3>
                <button onClick={() => setSelectedLeadForScript(null)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#9CA3AF' }}>✕</button>
              </div>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '-4px 0 0' }}>
                Destinatario: <strong>{selectedLeadForScript.business_name}</strong>
              </p>

              <form onSubmit={handleSendScript} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                <div>
                  <label className="kf-label">Script / Enfoque Comercial</label>
                  <select
                    className="kf-input kf-select"
                    value={selectedScriptName}
                    onChange={e => setSelectedScriptName(e.target.value)}
                  >
                    <option value="Script A: Problema de Cancelaciones">Script A: Cancelaciones de Citas</option>
                    <option value="Script B: Ahorro de 4h al día">Script B: Ahorro 4h Diarias</option>
                    <option value="Script C: Auditoría Gratuita 15min">Script C: Auditoría Gratuita</option>
                  </select>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600, color: '#059669', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={scriptResponseReceived}
                    onChange={e => setScriptResponseReceived(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
                  />
                  ¿El cliente respondió positivamente? (Avanza a Demo)
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
                  <button type="button" className="kf-btn kf-btn-secondary" onClick={() => setSelectedLeadForScript(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="kf-btn kf-btn-primary">
                    ✓ Guardar y Recalcular
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
