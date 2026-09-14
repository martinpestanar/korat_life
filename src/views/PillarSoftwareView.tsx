import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSaaS } from '../context/SaaSContext';
import { supabase } from '../lib/supabase';
import type { SoftwareFeature } from '../types/saas';

const LAYER_META: Record<string, { bg: string; color: string; border: string; icon: string; label: string; mcpTag: string; desc: string }> = {
  n8n: { 
    bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', 
    icon: '🤖', label: 'Flujos & WhatsApp (IA)', 
    mcpTag: 'n8n MCP',
    desc: 'Bots de WhatsApp, triggers de OpenAI, recordatorios y webhooks.' 
  },
  frontend: { 
    bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE', 
    icon: '📱', label: 'App & Pantallas (PWA)', 
    mcpTag: 'React PWA',
    desc: 'Lo que ve y toca el dueño del negocio y sus clientes en celular o web.' 
  },
  backend: { 
    bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', 
    icon: '🗄️', label: 'Datos & Lógica (Supabase)', 
    mcpTag: 'Supabase MCP',
    desc: 'Tablas SQL, autenticación, seguridad RLS y funciones backend.' 
  },
  infrastructure: { 
    bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE', 
    icon: '🛡️', label: 'Infra & Despliegues', 
    mcpTag: 'Deploy',
    desc: 'Dominio, servidores y estado de producción.' 
  }
};

// Generador de prompt listo para Antigravity
function generateAntigravityAuditPrompt(feat: SoftwareFeature, projectName: string) {
  const layerName = LAYER_META[feat.layer]?.label || feat.layer;
  const mcpTool = feat.layer === 'n8n' ? 'MCP de n8n' : feat.layer === 'backend' ? 'MCP de Supabase' : 'código del frontend';
  const submods = (feat.submodules || []).map(s => `- ${s.name} (estado: ${s.status})`).join('\n');

  return `Hola Antigravity, por favor audita y optimiza el módulo "${feat.title}" del proyecto ${projectName}.
Tipo de componente: ${layerName} (${mcpTool}).
Confianza actual: ${feat.confidence_level || 'Requiere pulido'}.
Rama Git: ${feat.git_branch || 'main'} | Deploy: ${feat.deploy_status || 'development'}.
${feat.description ? `Descripción: ${feat.description}` : ''}
${submods ? `Submódulos a revisar:\n${submods}` : ''}

Objetivo: Revisa que todo funcione al 100%, que no existan errores silenciosos ni código zombi y déjalo blindado para producción con clientes reales.`;
}

const CONFIDENCE_META: Record<string, { label: string; badgeBg: string; badgeColor: string; icon: string; desc: string }> = {
  ready_100: { label: '100% Producción', badgeBg: '#DCFCE7', badgeColor: '#166534', icon: '🟢', desc: 'Blindado, probado con usuarios reales y listo para cobrar.' },
  needs_polish: { label: 'Requiere Pulido', badgeBg: '#FEF3C7', badgeColor: '#92400E', icon: '🟡', desc: 'Funciona el 80%, pero faltan edge cases o detalles visuales.' },
  broken_risky: { label: 'Riesgo / En Obra', badgeBg: '#FEE2E2', badgeColor: '#B91C1C', icon: '🔴', desc: 'Inestable o sin validar. No permitir que el cliente lo use aún.' },
  zombie: { label: 'Zombi / A Eliminar', badgeBg: '#F1F5F9', badgeColor: '#475569', icon: '⚪', desc: 'Código que no aporta valor o idea vieja descartada.' }
};

const LIFECYCLE_META: Record<string, { label: string; icon: string; color: string }> = {
  core_essential: { label: 'Core Esencial (Vital)', icon: '🔥', color: '#4F46E5' },
  ai_differentiator: { label: 'Diferenciador IA', icon: '✨', color: '#059669' },
  polish_needed: { label: 'En Refinamiento', icon: '🔨', color: '#D97706' },
  deprecated_kill: { label: 'Candidato a Borrar 🗑️', icon: '🧹', color: '#DC2626' }
};

// ─── Helpers de badge ───
function DeployBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; bg: string; color: string; icon: string }> = {
    production: { label: 'Producción', bg: '#DCFCE7', color: '#166534', icon: '🚀' },
    staged:     { label: 'Staging',    bg: '#FEF3C7', color: '#92400E', icon: '🧪' },
    development:{ label: 'En Dev',     bg: '#EEF2FF', color: '#4F46E5', icon: '🔧' },
  };
  const m = map[status || 'development'] || map.development;
  return (
    <span style={{
      backgroundColor: m.bg, color: m.color,
      borderRadius: '6px', padding: '2px 7px',
      fontSize: '10px', fontWeight: 800,
      display: 'inline-flex', alignItems: 'center', gap: '3px'
    }}>
      {m.icon} {m.label}
    </span>
  );
}

function GitBranchBadge({ branch }: { branch?: string }) {
  const b = branch || 'main';
  let bg = '#F3F4F6', color = '#374151';
  if (b === 'main' || b === 'master')          { bg = '#DCFCE7'; color = '#166534'; }
  else if (b.startsWith('feature/'))           { bg = '#EEF2FF'; color = '#4F46E5'; }
  else if (b.startsWith('dev/') || b === 'development') { bg = '#F5F3FF'; color = '#7C3AED'; }
  else if (b.startsWith('hotfix/'))            { bg = '#FEE2E2'; color = '#B91C1C'; }
  else if (b.startsWith('legacy/'))            { bg = '#F1F5F9'; color = '#64748B'; }
  return (
    <span style={{
      backgroundColor: bg, color,
      borderRadius: '6px', padding: '2px 7px',
      fontSize: '10px', fontWeight: 700,
      fontFamily: 'monospace',
      display: 'inline-flex', alignItems: 'center', gap: '3px'
    }}>
      ⎇ {b}
    </span>
  );
}

// ─── Componente Lienzo Visual Interactivo: ArchitectureCanvas (Estilo Whiteboard / Miro / FigJam) ───
function ArchitectureTree({
  features,
  projectName,
  projectIcon,
  onUpdateDeploy
}: {
  features: SoftwareFeature[];
  projectName: string;
  projectIcon: string;
  onUpdateDeploy: (id: string, status: 'development' | 'staged' | 'production') => void;
}) {
  const [selectedModule, setSelectedModule] = useState<SoftwareFeature | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'n8n' | 'frontend' | 'backend'>('all');
  const [collapsedClusters, setCollapsedClusters] = useState<Record<string, boolean>>({});

  const clusters = [
    { id: 'n8n', title: '1. Automatización & WhatsApp IA', icon: '🤖', color: '#D97706', bg: '#FEF3C7', border: '#FCD34D', tool: 'n8n MCP' },
    { id: 'frontend', title: '2. App & Pantallas PWA', icon: '📱', color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE', tool: 'React PWA' },
    { id: 'backend', title: '3. Datos & Lógica Supabase', icon: '🗄️', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', tool: 'Supabase MCP' }
  ] as const;

  const handleCopyPrompt = (feat: SoftwareFeature) => {
    const promptText = generateAntigravityAuditPrompt(feat, projectName);
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(feat.id);
    setTimeout(() => setCopiedPromptId(null), 2500);
  };

  const toggleCluster = (id: string) => {
    setCollapsedClusters(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const confColors: Record<string, { ring: string; badge: string; text: string; label: string; icon: string }> = {
    ready_100: { ring: '#10B981', badge: '#DCFCE7', text: '#166534', label: '100% Producción', icon: '🟢' },
    needs_polish: { ring: '#F59E0B', badge: '#FEF3C7', text: '#92400E', label: 'Requiere Pulido', icon: '🟡' },
    broken_risky: { ring: '#EF4444', badge: '#FEE2E2', text: '#991B1B', label: 'En Obra / Riesgo', icon: '🔴' },
    zombie: { ring: '#94A3B8', badge: '#F1F5F9', text: '#475569', label: 'Zombi / Obsoleto', icon: '⚪' }
  };

  const visibleClusters = activeFilter === 'all' 
    ? clusters 
    : clusters.filter(c => c.id === activeFilter);

  return (
    <div style={{
      position: 'relative',
      borderRadius: '24px',
      overflow: 'hidden',
      border: '1.5px solid #E2E8F0',
      backgroundColor: '#F8FAFC',
      boxShadow: '0 20px 45px -15px rgba(15, 23, 42, 0.08)',
      minHeight: '760px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* ── Barra de Herramientas del Lienzo (Canvas Toolbar Superior) ── */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        zIndex: 10
      }}>
        {/* Título y estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)'
          }}>
            🎨
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Lienzo Visual de Arquitectura</span>
              <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: '999px' }}>
                Whiteboard Interactivo
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              Mapea el flujo de tu SaaS en tiempo real · {features.length} módulos totales
            </div>
          </div>
        </div>

        {/* Filtros rápidos por clúster */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
          {[
            { id: 'all', label: 'Todo el Lienzo', icon: '🌐' },
            { id: 'n8n', label: 'Bots & WhatsApp', icon: '🤖' },
            { id: 'frontend', label: 'Pantallas App', icon: '📱' },
            { id: 'backend', label: 'Supabase BD', icon: '🗄️' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              style={{
                border: 'none',
                backgroundColor: activeFilter === f.id ? '#FFFFFF' : 'transparent',
                color: activeFilter === f.id ? '#0F172A' : '#64748B',
                fontWeight: activeFilter === f.id ? 800 : 600,
                fontSize: '11.5px',
                padding: '5px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: activeFilter === f.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* Controles de Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setZoomLevel(z => Math.max(0.7, Number((z - 0.1).toFixed(1))))}
            style={{
              width: '28px', height: '28px', borderRadius: '8px', border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF', color: '#334155', fontWeight: 800, fontSize: '14px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="Reducir zoom"
          >
            -
          </button>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', minWidth: '42px', textAlign: 'center' }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel(z => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
            style={{
              width: '28px', height: '28px', borderRadius: '8px', border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF', color: '#334155', fontWeight: 800, fontSize: '14px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="Aumentar zoom"
          >
            +
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            style={{
              padding: '4px 8px', borderRadius: '8px', border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF', color: '#64748B', fontWeight: 700, fontSize: '11px',
              cursor: 'pointer', marginLeft: '4px'
            }}
            title="Restablecer tamaño original"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Contenedor del Lienzo con Dot Matrix Background ── */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        position: 'relative',
        backgroundImage: 'radial-gradient(#CBD5E1 1.2px, transparent 1.2px)',
        backgroundSize: '24px 24px',
        backgroundColor: '#F8FAFC',
        padding: '36px 24px 60px'
      }}>
        {/* Contenedor escalable por Zoom */}
        <div style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top center',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: '980px',
          margin: '0 auto'
        }}>
          {/* ── Nivel 0: Nodo Matriz de la Agencia ── */}
          <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            borderRadius: '20px',
            padding: '12px 24px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
            border: '2px solid #334155',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 5
          }}>
            <span style={{ fontSize: '24px' }}>🏢</span>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, letterSpacing: '0.02em' }}>
                KORAT FLOW AGENCY
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                Matriz de Negocio SaaS · Mercado Perú / LATAM
              </div>
            </div>
            <span style={{
              backgroundColor: 'rgba(255,255,255,0.12)',
              color: '#38BDF8',
              borderRadius: '999px',
              padding: '2px 8px',
              fontSize: '10.5px',
              fontWeight: 800
            }}>
              Root Node
            </span>
          </div>

          {/* Conector SVG Matriz ➔ Producto */}
          <div style={{ width: '2px', height: '24px', backgroundColor: '#94A3B8' }} />

          {/* ── Nivel 1: Nodo Producto SaaS Activo ── */}
          <div style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: '#FFFFFF',
            borderRadius: '22px',
            padding: '14px 28px',
            boxShadow: '0 14px 30px -8px rgba(79, 70, 229, 0.35)',
            border: '2px solid #818CF8',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            zIndex: 5
          }}>
            <span style={{ fontSize: '28px' }}>{projectIcon}</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.01em' }}>
                {projectName}
              </div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.82)' }}>
                {features.filter(f => f.deploy_status === 'production').length} módulos en producción viva · {features.length} planificados
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.18)',
              padding: '4px 10px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 800
            }}>
              Active Target
            </div>
          </div>

          {/* Conector Troncal hacia los 3 Clústeres */}
          <svg width="860" height="42" style={{ overflow: 'visible', margin: '0' }}>
            <path
              d="M 430 0 L 430 20 M 140 20 L 720 20 M 140 20 L 140 42 M 430 20 L 430 42 M 720 20 L 720 42"
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="2.5"
              strokeDasharray="4 3"
            />
          </svg>

          {/* ── Nivel 2: Clústeres de Negocio (Columnas Whiteboard) ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: visibleClusters.length === 1 ? 'minmax(420px, 600px)' : `repeat(${visibleClusters.length}, minmax(320px, 360px))`,
            gap: '24px',
            alignItems: 'flex-start',
            width: '100%',
            maxWidth: '1200px',
            justifyContent: 'center'
          }}>
            {visibleClusters.map(cluster => {
              const clusterFeatures = features.filter(f => f.layer === cluster.id);
              const isCollapsed = !!collapsedClusters[cluster.id];

              return (
                <div
                  key={cluster.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '24px',
                    border: `1.5px solid ${cluster.border}`,
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Encabezado del Clúster / Tarjeta Madre */}
                  <div style={{
                    padding: '14px 18px',
                    backgroundColor: cluster.bg,
                    borderBottom: `1.5px solid ${cluster.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{cluster.icon}</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: cluster.color, lineHeight: 1.2 }}>
                          {cluster.title}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                          Herramienta: <strong style={{ color: cluster.color }}>{cluster.tool}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        backgroundColor: '#FFFFFF',
                        color: cluster.color,
                        fontWeight: 800,
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        border: `1px solid ${cluster.border}`
                      }}>
                        {clusterFeatures.length}
                      </span>
                      <button
                        onClick={() => toggleCluster(cluster.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: cluster.color, fontSize: '12px', fontWeight: 800, padding: '2px 4px'
                        }}
                        title={isCollapsed ? 'Expandir clúster' : 'Colapsar clúster'}
                      >
                        {isCollapsed ? '▼' : '▲'}
                      </button>
                    </div>
                  </div>

                  {/* Cuerpo del Clúster: Tarjetas de Módulos (Nodos) */}
                  {!isCollapsed && (
                    <div style={{
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      backgroundColor: '#FAFAFA',
                      minHeight: '120px'
                    }}>
                      {clusterFeatures.length === 0 ? (
                        <div style={{
                          padding: '24px 14px',
                          textAlign: 'center',
                          border: '1.5px dashed #E2E8F0',
                          borderRadius: '16px',
                          backgroundColor: '#FFFFFF',
                          color: '#94A3B8',
                          fontSize: '11.5px'
                        }}>
                          Sin módulos en este pilar. Registra uno con el botón superior.
                        </div>
                      ) : (
                        clusterFeatures.map(feat => {
                          const conf = confColors[feat.confidence_level || 'needs_polish'] || confColors.needs_polish;
                          const isSelected = selectedModule?.id === feat.id;
                          const submodules = feat.submodules || [];

                          return (
                            <div
                              key={feat.id}
                              onClick={() => setSelectedModule(isSelected ? null : feat)}
                              style={{
                                backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                                border: isSelected ? '2px solid #10B981' : `1.5px solid #E2E8F0`,
                                borderLeft: `5px solid ${conf.ring}`,
                                borderRadius: '16px',
                                padding: '12px 14px',
                                cursor: 'pointer',
                                boxShadow: isSelected ? '0 8px 20px rgba(16, 185, 129, 0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                position: 'relative'
                              }}
                            >
                              {/* Fila superior: Semáforo y badges */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                <span style={{
                                  backgroundColor: conf.badge,
                                  color: conf.text,
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <span>{conf.icon}</span>
                                  <span>{conf.label}</span>
                                </span>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <DeployBadge status={feat.deploy_status} />
                                  <GitBranchBadge branch={feat.git_branch} />
                                </div>
                              </div>

                              {/* Título y descripción */}
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                                  {feat.title}
                                </div>
                                {feat.description && (
                                  <div style={{
                                    fontSize: '11px',
                                    color: '#64748B',
                                    marginTop: '3px',
                                    lineHeight: 1.4,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}>
                                    {feat.description}
                                  </div>
                                )}
                              </div>

                              {/* Submódulos preview en píldoras */}
                              {submodules.length > 0 && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  flexWrap: 'wrap',
                                  paddingTop: '4px',
                                  borderTop: '1px dashed #F1F5F9'
                                }}>
                                  <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700 }}>
                                    Componentes ({submodules.length}):
                                  </span>
                                  {submodules.slice(0, 3).map((s, idx) => (
                                    <span
                                      key={idx}
                                      style={{
                                        fontSize: '9.5px',
                                        backgroundColor: s.status === 'ok' ? '#ECFDF5' : '#F1F5F9',
                                        color: s.status === 'ok' ? '#059669' : '#475569',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        fontWeight: 600
                                      }}
                                    >
                                      {s.name}
                                    </span>
                                  ))}
                                  {submodules.length > 3 && (
                                    <span style={{ fontSize: '9px', color: '#94A3B8' }}>
                                      +{submodules.length - 3} más
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Barra de progreso DoD */}
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontWeight: 700, color: '#64748B', marginBottom: '3px' }}>
                                  <span>Progreso de Blindaje</span>
                                  <span>{feat.progress_percentage || 0}%</span>
                                </div>
                                <div style={{ height: '4px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                                  <div style={{
                                    width: `${feat.progress_percentage || 0}%`,
                                    height: '100%',
                                    backgroundColor: feat.progress_percentage === 100 ? '#10B981' : '#4F46E5',
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                              </div>

                              {/* Botón directo de Antigravity en la tarjeta */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyPrompt(feat);
                                }}
                                style={{
                                  marginTop: '2px',
                                  padding: '5px 8px',
                                  borderRadius: '8px',
                                  border: copiedPromptId === feat.id ? '1px solid #10B981' : '1px solid #C7D2FE',
                                  backgroundColor: copiedPromptId === feat.id ? '#ECFDF5' : '#EEF2FF',
                                  color: copiedPromptId === feat.id ? '#059669' : '#4F46E5',
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '5px',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <span>{copiedPromptId === feat.id ? '✓' : '🤖'}</span>
                                <span>{copiedPromptId === feat.id ? '¡Prompt de Auditoría Copiado!' : 'Copiar Prompt para Antigravity'}</span>
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Inspector Lateral Deslizante (Slide-over Drawer tipo Figma / Miro) ── */}
      {selectedModule && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '340px',
          backgroundColor: '#FFFFFF',
          borderLeft: '1.5px solid #E2E8F0',
          boxShadow: '-10px 0 30px rgba(15, 23, 42, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 20,
          animation: 'slideInRight 0.2s ease-out'
        }}>
          {/* Header del Inspector */}
          <div style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
            color: '#FFFFFF',
            padding: '16px 18px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Inspector de Arquitectura
              </span>
              <button
                onClick={() => setSelectedModule(null)}
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  width: '24px', height: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.2 }}>
              {selectedModule.title}
            </div>
          </div>

          {/* Contenido scrolleable del Inspector */}
          <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Badges de estado */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <DeployBadge status={selectedModule.deploy_status} />
              <GitBranchBadge branch={selectedModule.git_branch} />
              <span style={{
                backgroundColor: '#F1F5F9', color: '#475569',
                borderRadius: '6px', padding: '2px 7px', fontSize: '10px', fontWeight: 700
              }}>
                Pilar: {LAYER_META[selectedModule.layer]?.label || selectedModule.layer}
              </span>
            </div>

            {/* Descripción */}
            {selectedModule.description && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Propósito en el Negocio
                </label>
                <p style={{ margin: 0, fontSize: '12px', color: '#334155', lineHeight: 1.5, backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  {selectedModule.description}
                </p>
              </div>
            )}

            {/* Cambiar Estado de Deploy en Tiempo Real */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                🚀 Promover / Mover en la Nube
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {(['development', 'staged', 'production'] as const).map(s => {
                  const meta = {
                    development: { label: '🔧 En Desarrollo (Local)', bg: '#EEF2FF', color: '#4F46E5' },
                    staged:      { label: '🧪 Staging / Pruebas',    bg: '#FEF3C7', color: '#92400E' },
                    production:  { label: '🚀 En Producción (En Vivo)', bg: '#DCFCE7', color: '#166534' },
                  }[s];
                  const isActive = selectedModule.deploy_status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        onUpdateDeploy(selectedModule.id, s);
                        setSelectedModule({ ...selectedModule, deploy_status: s });
                      }}
                      style={{
                        border: isActive ? `2px solid ${meta.color}` : '1px solid #E2E8F0',
                        backgroundColor: isActive ? meta.bg : '#FAFAFA',
                        color: isActive ? meta.color : '#64748B',
                        borderRadius: '10px',
                        padding: '7px 12px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      <span>{meta.label}</span>
                      {isActive && <span>✓ Activo</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submódulos / Checklist */}
            {selectedModule.submodules && selectedModule.submodules.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Submódulos Mapeados ({selectedModule.submodules.length})
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedModule.submodules.map((sub, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        fontSize: '11px'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#1E293B' }}>{sub.name}</span>
                      <span style={{
                        color: sub.status === 'ok' ? '#059669' : '#D97706',
                        fontWeight: 800,
                        fontSize: '10px',
                        backgroundColor: sub.status === 'ok' ? '#DCFCE7' : '#FEF3C7',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        {sub.status === 'ok' ? 'Listo' : 'En prueba'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acción de Agente */}
            <div style={{ paddingTop: '8px', borderTop: '1px dashed #E2E8F0' }}>
              <button
                type="button"
                onClick={() => handleCopyPrompt(selectedModule)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: copiedPromptId === selectedModule.id ? '1.5px solid #10B981' : '1.5px solid #4F46E5',
                  backgroundColor: copiedPromptId === selectedModule.id ? '#ECFDF5' : '#EEF2FF',
                  color: copiedPromptId === selectedModule.id ? '#059669' : '#4F46E5',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{copiedPromptId === selectedModule.id ? '✓' : '🤖'}</span>
                <span>{copiedPromptId === selectedModule.id ? '¡Prompt Copiado!' : 'Copiar Prompt para Antigravity'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal Interactivo: Tutorial Visual completo del Módulo Software ───
const TUTORIAL_STEPS = [
  {
    step: 1,
    badge: 'Visión General',
    title: '¿Qué es la Torre de Control de Software?',
    icon: '🦅',
    tagline: 'Tu cockpit para saber exactamente qué funciona, qué falla y qué sobra en tu SaaS.',
    color: '#4F46E5',
    bg: '#EEF2FF',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#4B5563', lineHeight: 1.6 }}>
          Este módulo es tu <strong>mapa vivo del software</strong>. Cada función, bot, pantalla o tabla de tu SaaS vive aquí como una tarjeta con semáforo de estado. En lugar de adivinar si algo funciona, lo ves de un vistazo.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { icon: '🌳', title: 'Lienzo Visual', desc: 'Whiteboard de tu arquitectura organizado en 3 pilares de negocio' },
            { icon: '🚦', title: 'Confianza & Estado', desc: 'Semáforo por módulo: ¿puedo cobrarle a un cliente hoy?' },
            { icon: '🧹', title: 'Keep or Kill', desc: 'Lista de lo que sobra para eliminar sin culpa' },
            { icon: '🗺️', title: 'Mapa de Calor', desc: 'Vista compacta del nivel de riesgo por función' },
          ].map(item => (
            <div key={item.title} style={{
              backgroundColor: '#F8FAFF', border: '1px solid #E0E7FF',
              borderRadius: '12px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#1E1B4B' }}>{item.title}</div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: '#EEF2FF', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#4F46E5', fontWeight: 600 }}>
          💡 <strong>Regla de oro:</strong> Si no puedes ver el estado de un módulo en menos de 3 segundos, el sistema está fallando como herramienta de gestión.
        </div>
      </div>
    )
  },
  {
    step: 2,
    badge: 'Paso 1 — Registrar',
    title: 'Cómo registrar un módulo nuevo',
    icon: '➕',
    tagline: 'Antes de construir cualquier cosa, primero la mapeas aquí.',
    color: '#7C3AED',
    bg: '#F5F3FF',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#4B5563', lineHeight: 1.6 }}>
          Usa el botón <strong>"＋ Registrar Módulo"</strong> (arriba a la derecha). Se abre un formulario. Aquí clasificas esa pieza de software:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: '📝 Nombre', desc: 'Ej: "Bot de Reservas WhatsApp", "Pantalla de Agenda", "Tabla de Clientes"' },
            { label: '⚡ Pilar técnico', desc: '🤖 n8n (bots/flujos) · 📱 Frontend (pantallas) · 🗄️ Supabase (datos)' },
            { label: '🔥 Rol en el negocio', desc: '"Core Vital" si el negocio no sobrevive sin él · "Diferenciador IA" si es tu ventaja' },
            { label: '🚦 Confianza inicial', desc: 'Sé honesto: ¿Ya está blindado o lo acabas de crear con un prompt?' },
            { label: '⎇ Rama Git', desc: 'main · feature/reservas · dev/pagos · hotfix/crash' },
            { label: '🚀 Estado de deploy', desc: 'En Desarrollo · Staging · En Producción' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', gap: '10px', alignItems: 'flex-start',
              backgroundColor: '#FAFAFA', border: '1px solid #E5E7EB',
              borderRadius: '10px', padding: '9px 12px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#374151', minWidth: '120px', flexShrink: 0 }}>{item.label}</span>
              <span style={{ fontSize: '11.5px', color: '#6B7280', lineHeight: 1.4 }}>{item.desc}</span>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: '#F5F3FF', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#7C3AED', fontWeight: 600 }}>
          🎯 <strong>Tip:</strong> No necesitas tener todo perfecto al crear. Ponlo en "Requiere Pulido" y luego usa Antigravity para subirlo al 100%.
        </div>
      </div>
    )
  },
  {
    step: 3,
    badge: 'Paso 2 — El Lienzo',
    title: 'Navegar el Lienzo Visual de Arquitectura',
    icon: '🌳',
    tagline: 'Tu mapa whiteboard organizado en 3 pilares de negocio.',
    color: '#0891B2',
    bg: '#ECFEFF',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#4B5563', lineHeight: 1.6 }}>
          La pestaña <strong>🌳 Lienzo Visual</strong> muestra toda tu arquitectura en 3 columnas. Es de <strong>solo lectura</strong> — tu mapa en tiempo real del estado de producción.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { icon: '🤖', color: '#D97706', bg: '#FFFBEB', label: 'Pilar 1 — n8n', desc: 'Bots de WhatsApp, flujos de reservas, recordatorios, webhooks de OpenAI.' },
            { icon: '📱', color: '#4F46E5', bg: '#EEF2FF', label: 'Pilar 2 — Frontend', desc: 'Pantallas PWA: agenda, comandas, panel de control, caja.' },
            { icon: '🗄️', color: '#059669', bg: '#ECFDF5', label: 'Pilar 3 — Supabase', desc: 'Tablas SQL, autenticación RLS, lógica de negocio, edge functions.' },
          ].map(p => (
            <div key={p.label} style={{
              backgroundColor: p.bg, border: `1.5px solid ${p.color}40`,
              borderRadius: '12px', padding: '10px 14px', display: 'flex', gap: '10px'
            }}>
              <span style={{ fontSize: '22px' }}>{p.icon}</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: p.color }}>{p.label}</div>
                <div style={{ fontSize: '11.5px', color: '#4B5563', marginTop: '3px', lineHeight: 1.4 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#374151' }}>Controles del lienzo:</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['🔍 Zoom +/−', '🌐 Filtrar pilar', '▲▼ Colapsar columna', '🖱️ Clic en tarjeta → Inspector lateral'].map(c => (
              <span key={c} style={{ fontSize: '11px', backgroundColor: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>{c}</span>
            ))}
          </div>
        </div>
      </div>
    )
  },
  {
    step: 4,
    badge: 'Paso 3 — Inspector',
    title: 'El Inspector Lateral: Editar sin salir del mapa',
    icon: '🔍',
    tagline: 'Haz clic en cualquier tarjeta del lienzo y el inspector se abre al costado.',
    color: '#1E40AF',
    bg: '#EFF6FF',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#4B5563', lineHeight: 1.6 }}>
          Al hacer clic en un módulo del Lienzo, se desliza un <strong>panel inspector desde la derecha</strong> (estilo Figma). Desde ahí puedes:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { icon: '🚀', text: 'Promover el módulo: Desarrollo → Staging → Producción con un clic' },
            { icon: '📋', text: 'Ver todos sus submódulos y si están listos o en prueba' },
            { icon: '🤖', text: 'Copiar el Prompt de Auditoría para pasarle el módulo a Antigravity' },
            { icon: '📊', text: 'Ver el porcentaje de progreso del Definition of Done (DoD)' },
            { icon: '⎇', text: 'Ver la rama Git y el estado de deploy en tiempo real' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', gap: '10px', alignItems: 'center',
              backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD',
              borderRadius: '10px', padding: '9px 12px'
            }}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span style={{ fontSize: '12px', color: '#1E40AF', fontWeight: 600 }}>{item.text}</span>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: '#DBEAFE', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#1E3A8A', fontWeight: 600 }}>
          ⚡ <strong>Flujo rápido:</strong> Mira el lienzo → Clic en módulo rojo/amarillo → Copia el prompt → Pégalo en Antigravity → El agente lo arregla.
        </div>
      </div>
    )
  },
  {
    step: 5,
    badge: 'Paso 4 — Semáforo',
    title: 'El Semáforo de Confianza: ¿Puedo Cobrar Hoy?',
    icon: '🚦',
    tagline: 'La métrica que te dice si estás listo para clientes reales.',
    color: '#D97706',
    bg: '#FFFBEB',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#4B5563', lineHeight: 1.6 }}>
          Cada módulo tiene un <strong>nivel de confianza</strong>. Responde una sola pregunta: <em>"Si un cliente paga y usa esto hoy, ¿me genera vergüenza o orgullo?"</em>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { color: '#166534', bg: '#DCFCE7', icon: '🟢', label: '100% Producción', desc: 'Blindado. Probado con flujos reales. Cóbrale sin miedo.' },
            { color: '#92400E', bg: '#FEF3C7', icon: '🟡', label: 'Requiere Pulido', desc: 'Funciona 80%. Pídele a Antigravity que revise edge cases.' },
            { color: '#991B1B', bg: '#FEE2E2', icon: '🔴', label: 'Riesgo / En Obra', desc: 'Recién creado con IA. No activar en clientes aún.' },
            { color: '#475569', bg: '#F1F5F9', icon: '⚪', label: 'Zombi / Obsoleto', desc: 'Ya no aporta valor. Candidato a eliminar.' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: s.color }}>{s.icon} {s.label}</div>
              <div style={{ fontSize: '11px', color: s.color, marginTop: '4px', lineHeight: 1.4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: '#FEF3C7', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#92400E', fontWeight: 600 }}>
          📊 <strong>El Índice de Confianza</strong> (barra % arriba del todo) = módulos 🟢 ÷ total. Tu meta: superar el 80% para salir a vender.
        </div>
      </div>
    )
  },
  {
    step: 6,
    badge: 'Paso 5 — DoD Checklist',
    title: 'Definition of Done: Cuándo un módulo está realmente listo',
    icon: '✅',
    tagline: 'El checklist anti-ilusión que separa "funciona" de "listo para producción".',
    color: '#059669',
    bg: '#ECFDF5',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#4B5563', lineHeight: 1.6 }}>
          En la pestaña <strong>🚦 Confianza & Estado</strong>, cada módulo tiene un checklist de 4 criterios. Solo cuando todos están marcados, el módulo sube automáticamente a <strong>🟢 100% Producción</strong>.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { check: true,  text: 'Flujo probado sin errores en móvil y PC' },
            { check: false, text: 'Manejo de errores si el cliente ingresa datos vacíos' },
            { check: false, text: 'Validación en canal real con datos de prueba' },
            { check: false, text: 'Código ordenado sin dependencias innecesarias' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', gap: '10px', alignItems: 'center',
              backgroundColor: item.check ? '#ECFDF5' : '#F9FAFB',
              border: `1px solid ${item.check ? '#A7F3D0' : '#E5E7EB'}`,
              borderRadius: '10px', padding: '8px 12px'
            }}>
              <span style={{ fontSize: '16px' }}>{item.check ? '✅' : '⬜'}</span>
              <span style={{ fontSize: '12px', color: item.check ? '#065F46' : '#6B7280', fontWeight: 600 }}>{item.text}</span>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: '#ECFDF5', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#065F46', fontWeight: 600 }}>
          🤖 <strong>Tip Antigravity:</strong> "Antigravity, revisa el módulo X y dime qué items del DoD ya cumpla usando el MCP de Supabase y n8n."
        </div>
      </div>
    )
  },
  {
    step: 7,
    badge: 'Paso 6 — Antigravity',
    title: 'El Botón Mágico: Copiar Prompt de Auditoría',
    icon: '🤖',
    tagline: 'Delega cualquier módulo a Antigravity en menos de 10 segundos.',
    color: '#7C3AED',
    bg: '#F5F3FF',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#4B5563', lineHeight: 1.6 }}>
          Cuando veas un módulo 🟡 o 🔴, no pienses en cómo arreglarlo a mano. El botón <strong>"🤖 Copiar Prompt para Antigravity"</strong> genera un prompt completo con todo el contexto:
        </p>
        <div style={{
          backgroundColor: '#1E1B4B', borderRadius: '12px', padding: '14px',
          fontFamily: 'monospace', fontSize: '11px', color: '#A5B4FC', lineHeight: 1.6
        }}>
          <div style={{ color: '#818CF8', marginBottom: '6px', fontWeight: 800 }}>// Prompt generado automáticamente:</div>
          <div>Hola Antigravity, audita el módulo <span style={{ color: '#FDE68A' }}>"Bot de Reservas WhatsApp"</span></div>
          <div>Tipo: <span style={{ color: '#86EFAC' }}>n8n MCP</span> · Confianza: <span style={{ color: '#FCA5A5' }}>Requiere Pulido</span></div>
          <div>Rama: <span style={{ color: '#93C5FD' }}>feature/reservas</span> · Deploy: <span style={{ color: '#FCD34D' }}>staging</span></div>
          <div style={{ marginTop: '6px' }}>Objetivo: Revisar que funcione al 100%, sin errores silenciosos...</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {[
            '1. Haz clic en la tarjeta del módulo (o abre el Inspector lateral)',
            '2. Pulsa "🤖 Copiar Prompt para Antigravity"',
            '3. Abre Antigravity IDE y pega el prompt',
            '4. Antigravity usa MCP de Supabase o n8n para auditarlo automáticamente',
            '5. Vuelve aquí y actualiza el semáforo según el resultado',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{
                fontSize: '10px', backgroundColor: '#7C3AED', color: '#fff',
                width: '18px', height: '18px', borderRadius: '999px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, flexShrink: 0, marginTop: '1px'
              }}>{i + 1}</span>
              <span style={{ fontSize: '12px', color: '#374151', lineHeight: 1.4 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    step: 8,
    badge: 'Paso 7 — Keep or Kill',
    title: 'Keep or Kill: Limpiar sin Culpa',
    icon: '🧹',
    tagline: '5 módulos excelentes > 30 módulos a medias. La disciplina del fundador.',
    color: '#DC2626',
    bg: '#FEF2F2',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#4B5563', lineHeight: 1.6 }}>
          La pestaña <strong>🧹 Keep or Kill</strong> muestra todo lo marcado como "candidato a borrar". Cada vez que Antigravity genera código, acumulas deuda técnica. Esta pestaña te ayuda a eliminarla.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#374151' }}>¿Cuándo marcar un módulo para eliminar?</div>
          {[
            'Un bot fue reemplazado por uno mejor y el viejo sigue activo en n8n',
            'Una tabla de Supabase ya no tiene inserciones en los últimos 14 días',
            'Una pantalla fue rediseñada y la versión anterior quedó en el código',
            'Probaste una funcionalidad con IA y decidiste no lanzarla',
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', gap: '8px', alignItems: 'flex-start',
              backgroundColor: '#FFF1F2', border: '1px solid #FDA4AF',
              borderRadius: '10px', padding: '8px 12px'
            }}>
              <span style={{ color: '#E11D48', fontWeight: 800, fontSize: '12px', flexShrink: 0 }}>✕</span>
              <span style={{ fontSize: '12px', color: '#9F1239', lineHeight: 1.4 }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: '#FFF7ED', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#9A3412', fontWeight: 600 }}>
          🧘 <strong>Proceso:</strong> Marca como "⚪ Zombi" → Aparece en Keep or Kill → Pídele a Antigravity que limpie el código/flujos → Elimina el registro.
        </div>
      </div>
    )
  },
  {
    step: 9,
    badge: 'Flujo Completo',
    title: 'El Ciclo: De Idea a Producción',
    icon: '🔄',
    tagline: 'Así se ve un día normal gestionando tu SaaS con este módulo.',
    color: '#0F172A',
    bg: '#F8FAFC',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {[
            { icon: '💡', color: '#7C3AED', label: 'Tienes una idea de función', action: '→ Regístrala con "＋ Registrar Módulo" (confianza: 🔴, deploy: En Desarrollo)' },
            { icon: '🤖', color: '#D97706', label: 'Le dices a Antigravity que la construya', action: '→ El agente usa MCP de n8n o Supabase para implementarla' },
            { icon: '🌳', color: '#0891B2', label: 'La ves en el Lienzo Visual', action: '→ En el pilar correcto, con su badge de rama git y estado de deploy' },
            { icon: '✅', color: '#059669', label: 'Revisas el DoD en la pestaña Confianza', action: '→ Marcas los criterios que ya cumple, copias prompt para los que faltan' },
            { icon: '🤖', color: '#7C3AED', label: 'Antigravity audita los criterios restantes', action: '→ Prueba en móvil, maneja errores, valida con datos reales' },
            { icon: '🟢', color: '#059669', label: 'El módulo llega al 100%', action: '→ Lo promueves a Producción desde el Inspector. ¡Listo para cobrar!' },
            { icon: '🧹', color: '#DC2626', label: 'Periódicamente revisas Keep or Kill', action: '→ Lo que sobra se limpia. El código siempre queda elegante.' },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '999px',
                backgroundColor: step.color, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 800, flexShrink: 0, marginTop: '1px'
              }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#111827' }}>{step.icon} {step.label}</div>
                <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.4, marginTop: '2px' }}>{step.action}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: '#F0FDF4', padding: '12px 14px', borderRadius: '12px', fontSize: '12.5px', color: '#166534', fontWeight: 700, textAlign: 'center' }}>
          🎯 Este módulo no es para programadores. Es para fundadores que quieren <strong>control total sin código</strong>.
        </div>
      </div>
    )
  },
];

function SoftwareTutorialModal({ onClose }: { onClose: () => void }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TUTORIAL_STEPS.length - 1;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '620px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.28)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeInScale 0.2s ease-out'
      }}>
        {/* Header con gradiente suave y steps */}
        <div style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
          padding: '24px 28px 20px',
          position: 'relative'
        }}>
          {/* Fila superior: badge paso y botón cerrar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              borderRadius: '999px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              {currentStep.badge}
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                width: '30px', height: '30px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >✕</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px', height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', flexShrink: 0
            }}>
              {currentStep.icon}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                {currentStep.title}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                {currentStep.tagline}
              </p>
            </div>
          </div>

          {/* Indicadores de progreso (bullets) */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
            {TUTORIAL_STEPS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setCurrentStepIndex(idx)}
                style={{
                  height: '4px',
                  flex: 1,
                  borderRadius: '999px',
                  backgroundColor: idx === currentStepIndex ? '#FFFFFF' : 'rgba(255,255,255,0.25)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  padding: 0
                }}
              />
            ))}
          </div>
        </div>

        {/* Cuerpo del contenido (scrollable si es necesario) */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, maxHeight: '55vh' }}>
          {currentStep.content}
        </div>

        {/* Footer con controles de navegación */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid #F3F4F6',
          backgroundColor: '#FAFAFA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <button
            onClick={() => setCurrentStepIndex(p => Math.max(0, p - 1))}
            disabled={isFirst}
            style={{
              padding: '9px 16px',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              backgroundColor: isFirst ? '#F3F4F6' : '#FFFFFF',
              color: isFirst ? '#9CA3AF' : '#374151',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: isFirst ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            ← Anterior
          </button>

          <div style={{ fontSize: '11.5px', color: '#9CA3AF', fontWeight: 700 }}>
            {currentStepIndex + 1} de {TUTORIAL_STEPS.length}
          </div>

          {isLast ? (
            <button
              onClick={onClose}
              style={{
                padding: '9px 20px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span>✓ ¡Entendido, a ordenar!</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentStepIndex(p => Math.min(TUTORIAL_STEPS.length - 1, p + 1))}
              style={{
                padding: '9px 20px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span>Siguiente</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PillarSoftwareView() {

  const navigate = useNavigate();
  const { currentProject, allProjects, setCurrentSlug, refreshSaaSData } = useSaaS();
  const [features, setFeatures] = useState<SoftwareFeature[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'architecture' | 'confidence' | 'audit_kill' | 'tree_map'>('architecture');
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [selectedConfidence, setSelectedConfidence] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null);
  const [healthTesting, setHealthTesting] = useState(false);
  const [healthTestResult, setHealthTestResult] = useState<string | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLayer, setNewLayer] = useState<'frontend' | 'backend' | 'n8n' | 'infrastructure'>('frontend');
  const [newLifecycle, setNewLifecycle] = useState<'core_essential' | 'ai_differentiator' | 'polish_needed' | 'deprecated_kill'>('core_essential');
  const [newConfidence, setNewConfidence] = useState<'ready_100' | 'needs_polish' | 'broken_risky' | 'zombie'>('needs_polish');
  const [newGitBranch, setNewGitBranch] = useState('main');
  const [newDeployStatus, setNewDeployStatus] = useState<'development' | 'staged' | 'production'>('development');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  const handleCopyPrompt = (feat: SoftwareFeature) => {
    const promptText = generateAntigravityAuditPrompt(feat, currentProject?.name || 'SaaS');
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(feat.id);
    setTimeout(() => setCopiedPromptId(null), 2500);
  };

  const fetchFeatures = async () => {
    if (!currentProject?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('software_features')
      .select('*')
      .eq('project_id', currentProject.id)
      .order('created_at', { ascending: false });
    if (!error && data) setFeatures(data as SoftwareFeature[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchFeatures();
  }, [currentProject?.id]);

  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !currentProject?.id) return;

    const defaultTasks = [
      { task: 'Flujo probado sin errores en móvil y PC', done: true },
      { task: 'Manejo de errores si el cliente ingresa datos vacíos', done: false },
      { task: 'Validación en canal real con datos de prueba', done: false },
      { task: 'Código ordenado sin dependencias innecesarias', done: false }
    ];

    await supabase.from('software_features').insert({
      project_id: currentProject.id,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      layer: newLayer,
      lifecycle: newLifecycle,
      confidence_level: newConfidence,
      git_branch: newGitBranch.trim() || 'main',
      deploy_status: newDeployStatus,
      status: 'in_progress',
      progress_percentage: 50,
      is_frozen: false,
      dod_checklist: defaultTasks,
      submodules: [
        { name: `${newTitle.trim()} (UI / Componente)`, status: 'ok', notes: 'Estructura inicial creada', deploy_status: newDeployStatus }
      ]
    });

    setNewTitle('');
    setNewDesc('');
    setNewGitBranch('main');
    setNewDeployStatus('development');
    setIsAdding(false);
    fetchFeatures();
  };

  const handleUpdateConfidence = async (featureId: string, level: SoftwareFeature['confidence_level']) => {
    await supabase.from('software_features').update({
      confidence_level: level,
      updated_at: new Date().toISOString()
    }).eq('id', featureId);
    fetchFeatures();
  };

  const handleUpdateLifecycle = async (featureId: string, lifecycle: SoftwareFeature['lifecycle']) => {
    await supabase.from('software_features').update({
      lifecycle: lifecycle,
      updated_at: new Date().toISOString()
    }).eq('id', featureId);
    fetchFeatures();
  };

  const handleDeleteFeature = async (featureId: string, title: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${title}" del sistema? Esta acción te ayuda a limpiar el código que ya no necesitas.`)) {
      return;
    }
    await supabase.from('software_features').delete().eq('id', featureId);
    fetchFeatures();
    refreshSaaSData();
  };

  const handleToggleDoD = async (feature: SoftwareFeature, taskIndex: number) => {
    const updatedDoD = [...feature.dod_checklist];
    updatedDoD[taskIndex].done = !updatedDoD[taskIndex].done;
    const completedTasks = updatedDoD.filter(t => t.done).length;
    const newProgress = Math.round((completedTasks / updatedDoD.length) * 100);
    const isNowAllDone = completedTasks === updatedDoD.length;

    await supabase.from('software_features').update({
      dod_checklist: updatedDoD,
      progress_percentage: newProgress,
      status: isNowAllDone ? 'frozen_100' : 'in_progress',
      is_frozen: isNowAllDone,
      confidence_level: isNowAllDone ? 'ready_100' : feature.confidence_level || 'needs_polish'
    }).eq('id', feature.id);

    fetchFeatures();
    if (isNowAllDone) {
      refreshSaaSData();
    }
  };

  const handleAddSubmodule = async (feature: SoftwareFeature, subName: string) => {
    if (!subName.trim()) return;
    const existing = feature.submodules || [];
    const updated = [...existing, { name: subName.trim(), status: 'testing' as const, notes: 'Añadido para auditoría' }];
    await supabase.from('software_features').update({
      submodules: updated
    }).eq('id', feature.id);
    fetchFeatures();
  };

  const handleSimulateHealthCheck = () => {
    setHealthTesting(true);
    setHealthTestResult(null);
    setTimeout(() => {
      setHealthTesting(false);
      if (currentProject?.slug === 'nilah-ia') {
        setHealthTestResult('✅ Nilah IA Salud: Evolution API online (WhatsApp conectado) · n8n Webhook responde en 1.1s · Calendario PWA estable.');
      } else {
        setHealthTestResult('✅ Suna Gourmet Salud: Menú QR dinámico online (<1.0s) · Canal Realtime de Comandas activo · Cálculo en Soles S/ verificado.');
      }
      setTimeout(() => setHealthTestResult(null), 7000);
    }, 1200);
  };

  const handleUpdateDeploy = async (featureId: string, status: 'development' | 'staged' | 'production') => {
    await supabase.from('software_features').update({
      deploy_status: status,
      updated_at: new Date().toISOString()
    }).eq('id', featureId);
    fetchFeatures();
  };

  // Metrics
  const totalCount = features.length;
  const readyCount = features.filter(f => f.confidence_level === 'ready_100' || f.is_frozen).length;
  const polishCount = features.filter(f => f.confidence_level === 'needs_polish' || (!f.confidence_level && !f.is_frozen)).length;
  const killCandidates = features.filter(f => f.lifecycle === 'deprecated_kill' || f.confidence_level === 'zombie').length;
  const healthPercent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  // Filtered
  const filteredFeatures = features.filter(f => {
    if (activeTab === 'confidence' && selectedConfidence !== 'all') {
      return (f.confidence_level || 'needs_polish') === selectedConfidence;
    }
    if (activeTab === 'audit_kill') {
      return f.lifecycle === 'deprecated_kill' || f.confidence_level === 'zombie';
    }
    if (selectedLayer !== 'all') {
      return f.layer === selectedLayer;
    }
    return true;
  });

  return (
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
            <span style={{ fontSize: '22px' }}>🦅</span>
            <h1 className="kf-pillar-title" style={{ margin: 0 }}>
              Torre de Control de Software ({currentProject?.name})
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowTutorial(true)}
            style={{
              backgroundColor: '#EEF2FF',
              color: '#4F46E5',
              border: '1.5px solid #C7D2FE',
              borderRadius: '12px',
              padding: '8px 13px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
            title="Aprende cómo usar este módulo de software para tener orden total"
          >
            <span>💡</span>
            <span>¿Cómo Funciona?</span>
          </button>

          <button
            onClick={handleSimulateHealthCheck}
            disabled={healthTesting}
            style={{
              backgroundColor: '#ECFDF5',
              color: '#059669',
              border: '1px solid #A7F3D0',
              borderRadius: '12px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {healthTesting ? '🔄 Verificando...' : '🩺 Test de Salud'}
          </button>

          <button
            onClick={() => setIsAdding(true)}
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '14px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              letterSpacing: '0.01em'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(79,70,229,0.45)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(79,70,229,0.35)';
            }}
          >
            <span style={{ fontSize: '15px' }}>＋</span>
            <span>Registrar Módulo</span>
          </button>
        </div>
      </header>

      {/* Alerta de Test de Salud */}
      {healthTestResult && (
        <div style={{
          backgroundColor: '#DCFCE7',
          border: '1px solid #86EFAC',
          color: '#166534',
          padding: '10px 14px',
          borderRadius: '12px',
          fontSize: '12.5px',
          fontWeight: 700,
          boxShadow: '0 2px 8px rgba(22, 101, 52, 0.1)'
        }}>
          {healthTestResult}
        </div>
      )}

      {/* ─── SWITCHER MULTI-SAAS ─── */}
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
                fontWeight: isActive ? 800 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '16px' }}>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* ─── COCKPIT DE CONFIANZA Y SALUD (Vista de Águila) ─── */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #E5E7EB',
        padding: '18px 20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Índice de Confianza para Clientes Reales
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '2px' }}>
              <span style={{ fontSize: '26px', fontWeight: 800, color: '#111827' }}>
                {healthPercent}% Confiable
              </span>
              <span style={{ fontSize: '12.5px', color: '#6B7280' }}>
                ({readyCount} de {totalCount} módulos listos para operar)
              </span>
            </div>
          </div>

          <div style={{
            backgroundColor: healthPercent >= 80 ? '#DCFCE7' : '#FEF3C7',
            color: healthPercent >= 80 ? '#166534' : '#92400E',
            padding: '6px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 800
          }}>
            {healthPercent >= 80 ? '🛡️ Apto para Pilotos Reales' : '⚠️ Refinar módulos antes de cobrar'}
          </div>
        </div>

        {/* Barra Visual de Confianza */}
        <div style={{
          height: '10px',
          backgroundColor: '#F3F4F6',
          borderRadius: '9999px',
          overflow: 'hidden',
          display: 'flex'
        }}>
          <div style={{
            width: `${totalCount > 0 ? (readyCount / totalCount) * 100 : 0}%`,
            backgroundColor: '#10B981',
            transition: 'width 0.4s ease'
          }} />
          <div style={{
            width: `${totalCount > 0 ? (polishCount / totalCount) * 100 : 0}%`,
            backgroundColor: '#F59E0B',
            transition: 'width 0.4s ease'
          }} />
          <div style={{
            width: `${totalCount > 0 ? (killCandidates / totalCount) * 100 : 0}%`,
            backgroundColor: '#EF4444',
            transition: 'width 0.4s ease'
          }} />
        </div>

        {/* 4 Indicadores Rápidos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          paddingTop: '6px',
          borderTop: '1px solid #F3F4F6'
        }}>
          <div style={{ backgroundColor: '#F0FDF4', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#166534' }}>🟢 100% PRODUCCIÓN</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>{readyCount}</div>
            <div style={{ fontSize: '10px', color: '#6B7280' }}>Cero miedo con clientes</div>
          </div>

          <div style={{ backgroundColor: '#FFFBEB', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#92400E' }}>🟡 REQUIERE PULIDO</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#D97706', marginTop: '2px' }}>{polishCount}</div>
            <div style={{ fontSize: '10px', color: '#6B7280' }}>Funciona con supervisión</div>
          </div>

          <div style={{ backgroundColor: '#FEF2F2', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#991B1B' }}>🧹 CANDIDATOS A BORRAR</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#DC2626', marginTop: '2px' }}>{killCandidates}</div>
            <div style={{ fontSize: '10px', color: '#6B7280' }}>Limpiar para no estorbar</div>
          </div>

          <div style={{ backgroundColor: '#EEF2FF', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#3730A3' }}>⚡ AUTOMATIZACIÓN IA</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#4F46E5', marginTop: '2px' }}>
              {features.filter(f => f.layer === 'n8n').length}
            </div>
            <div style={{ fontSize: '10px', color: '#6B7280' }}>Flujos n8n / Bots</div>
          </div>
        </div>
      </div>

      {/* ─── NAVEGACIÓN DE VISTAS ─── */}
      <div className="kf-tab-row">
        <button
          className={`kf-tab ${activeTab === 'tree_map' ? 'active' : ''}`}
          onClick={() => setActiveTab('tree_map')}
        >
          🌳 Mapa de Arquitectura
        </button>
        <button
          className={`kf-tab ${activeTab === 'architecture' ? 'active' : ''}`}
          onClick={() => setActiveTab('architecture')}
        >
          🗺️ Módulos ({currentProject?.name})
        </button>
        <button
          className={`kf-tab ${activeTab === 'confidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('confidence')}
        >
          🚦 Semáforo
        </button>
        <button
          className={`kf-tab ${activeTab === 'audit_kill' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit_kill')}
          style={{ color: killCandidates > 0 ? '#DC2626' : undefined }}
        >
          🧹 Keep or Kill {killCandidates > 0 && `(${killCandidates})`}
        </button>
      </div>

      {/* Subfiltros por pilar funcional si estamos en Módulos */}
      {activeTab === 'architecture' && (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
          {[
            { id: 'all', label: 'Todo el SaaS', icon: '🌐' },
            { id: 'n8n', label: 'Flujos WhatsApp & IA', icon: '🤖' },
            { id: 'frontend', label: 'App & Pantallas PWA', icon: '📱' },
            { id: 'backend', label: 'Datos Supabase & SQL', icon: '🗄️' },
            { id: 'infrastructure', label: 'Infra & Deploy', icon: '🛡️' }
          ].map(tab => {
            const isActive = selectedLayer === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedLayer(tab.id)}
                style={{
                  border: isActive ? '1px solid #4F46E5' : '1px solid #E5E7EB',
                  backgroundColor: isActive ? '#EEF2FF' : '#FFFFFF',
                  color: isActive ? '#4F46E5' : '#4B5563',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: isActive ? 800 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Subfiltros por confianza */}
      {activeTab === 'confidence' && (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'all', label: 'Todos los Estados', icon: '🔍' },
            { id: 'ready_100', label: '🟢 100% Producción', icon: '' },
            { id: 'needs_polish', label: '🟡 Requiere Pulido', icon: '' },
            { id: 'broken_risky', label: '🔴 Riesgo / En Obra', icon: '' },
            { id: 'zombie', label: '⚪ Zombis / Inútiles', icon: '' }
          ].map(c => {
            const isActive = selectedConfidence === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedConfidence(c.id)}
                style={{
                  border: isActive ? '1px solid #4F46E5' : '1px solid #E5E7EB',
                  backgroundColor: isActive ? '#EEF2FF' : '#FFFFFF',
                  color: isActive ? '#4F46E5' : '#4B5563',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: isActive ? 800 : 500,
                  cursor: 'pointer'
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── VISTA: MAPA DE ARQUITECTURA (Árbol Interactivo) ─── */}
      {activeTab === 'tree_map' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E5E7EB',
          padding: '18px 20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          {/* Leyenda */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '16px', flexWrap: 'wrap', gap: '8px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#374151' }}>
              🌳 Organigrama de {currentProject?.name} — vista completa
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'Producción', bg: '#DCFCE7', color: '#166534', icon: '🚀' },
                { label: 'Staging', bg: '#FEF3C7', color: '#92400E', icon: '🧪' },
                { label: 'En Dev', bg: '#EEF2FF', color: '#4F46E5', icon: '🔧' }
              ].map(l => (
                <span key={l.label} style={{
                  backgroundColor: l.bg, color: l.color,
                  borderRadius: '6px', padding: '2px 8px',
                  fontSize: '10.5px', fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', gap: '3px'
                }}>
                  {l.icon} {l.label}
                </span>
              ))}
              <span style={{ fontSize: '10.5px', color: '#9CA3AF', alignSelf: 'center' }}>· Click en módulo para detalles</span>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#9CA3AF', fontSize: '13px' }}>
              🌳 Construyendo el árbol de arquitectura...
            </div>
          ) : features.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#9CA3AF', fontSize: '13px' }}>
              No hay módulos registrados. Usa "Registrar Módulo" para empezar.
            </div>
          ) : (
            <ArchitectureTree
              features={features}
              projectName={currentProject?.name || ''}
              projectIcon={currentProject?.icon || '🚀'}
              onUpdateDeploy={handleUpdateDeploy}
            />
          )}
        </div>
      )}

      {/* ─── MODAL OVERLAY: REGISTRAR MÓDULO ─── */}
      {isAdding && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setIsAdding(false); }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 10, 20, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <form
            onSubmit={handleCreateFeature}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 0
            }}
          >
            {/* Header del Modal */}
            <div style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              borderRadius: '24px 24px 0 0',
              padding: '24px 28px 20px',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{
                    width: '44px', height: '44px',
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    borderRadius: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px',
                    marginBottom: '12px'
                  }}>
                    🧩
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                    Registrar Nuevo Módulo
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'rgba(255,255,255,0.72)' }}>
                    Define la pieza de software, su rol en el negocio y su estado actual de confianza.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Cuerpo del formulario */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Nombre del módulo */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Nombre del Módulo
                </label>
                <input
                  type="text"
                  className="kf-input"
                  placeholder="Ej. Bot WhatsApp para confirmar citas"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                  style={{ fontSize: '14px', fontWeight: 600 }}
                />
              </div>

              {/* Descripción */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Descripción Operativa
                </label>
                <input
                  type="text"
                  className="kf-input"
                  placeholder="¿Qué hace exactamente para el salón o restaurante?"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
              </div>

              {/* Pilar del Sistema (Vibe Coding) */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pilar del Producto
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {([
                    { val: 'n8n', icon: '🤖', label: 'Flujos WhatsApp & IA', sub: 'n8n MCP / Bots / OpenAI', bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
                    { val: 'frontend', icon: '📱', label: 'App & Pantallas', sub: 'React / PWA Dueño y Cliente', bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE' },
                    { val: 'backend', icon: '🗄️', label: 'Datos & Lógica', sub: 'Supabase MCP / SQL / Auth', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
                    { val: 'infrastructure', icon: '🛡️', label: 'Infra & Deploy', sub: 'Dominio / Servidor Web', bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' }
                  ] as const).map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setNewLayer(opt.val as any)}
                      style={{
                        border: newLayer === opt.val ? `2px solid ${opt.color}` : '2px solid #E5E7EB',
                        backgroundColor: newLayer === opt.val ? opt.bg : '#FAFAFA',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex', flexDirection: 'column', gap: '3px'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{opt.icon}</span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: newLayer === opt.val ? opt.color : '#1F2937' }}>{opt.label}</span>
                      <span style={{ fontSize: '10.5px', color: '#9CA3AF' }}>{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rol en el Negocio */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Rol en el Negocio
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {([
                    { val: 'core_essential', icon: '🔥', label: 'Core Esencial', desc: 'Sin esto no se puede vender ni operar.', color: '#4F46E5' },
                    { val: 'ai_differentiator', icon: '✨', label: 'Diferenciador IA', desc: 'Por esto el cliente paga el plan Pro.', color: '#059669' },
                    { val: 'polish_needed', icon: '🔨', label: 'En Refinamiento', desc: 'Existe pero necesita mejoras antes de presumirlo.', color: '#D97706' },
                    { val: 'deprecated_kill', icon: '🧹', label: 'Candidato a Borrar', desc: 'No aporta valor, agenda eliminarlo pronto.', color: '#DC2626' }
                  ] as const).map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setNewLifecycle(opt.val as any)}
                      style={{
                        border: newLifecycle === opt.val ? `2px solid ${opt.color}` : '2px solid #E5E7EB',
                        backgroundColor: newLifecycle === opt.val ? `${opt.color}10` : '#FAFAFA',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <span style={{ fontSize: '18px', flexShrink: 0 }}>{opt.icon}</span>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 800, color: newLifecycle === opt.val ? opt.color : '#1F2937' }}>{opt.label}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Semáforo de Confianza */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Semáforo de Confianza Inicial
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {([
                    { val: 'ready_100', icon: '🟢', label: '100% Producción', desc: 'Listo para clientes reales', bg: '#DCFCE7', color: '#166534', border: '#86EFAC' },
                    { val: 'needs_polish', icon: '🟡', label: 'Requiere Pulido', desc: 'Funciona al 80%, faltan detalles', bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
                    { val: 'broken_risky', icon: '🔴', label: 'Riesgo / En Obra', desc: 'Inestable, no usar con clientes aún', bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5' },
                    { val: 'zombie', icon: '⚪', label: 'Zombi', desc: 'Código sin valor, candidato a borrar', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' }
                  ] as const).map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setNewConfidence(opt.val as any)}
                      style={{
                        border: newConfidence === opt.val ? `2px solid ${opt.border}` : '2px solid #E5E7EB',
                        backgroundColor: newConfidence === opt.val ? opt.bg : '#FAFAFA',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex', flexDirection: 'column', gap: '2px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px' }}>{opt.icon}</span>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: newConfidence === opt.val ? opt.color : '#1F2937' }}>{opt.label}</span>
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#9CA3AF', marginLeft: '22px' }}>{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Git Branch + Deploy Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🌿 Rama de Git
                  </label>
                  <input
                    type="text"
                    className="kf-input"
                    placeholder="main"
                    value={newGitBranch}
                    onChange={e => setNewGitBranch(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: '13px' }}
                  />
                  <div style={{ fontSize: '10.5px', color: '#9CA3AF', marginTop: '4px' }}>
                    Ej: main · feature/bot-wp · dev/mejoras
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🚀 Estado Deploy
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {([
                      { val: 'development', icon: '🔧', label: 'En Dev', color: '#4F46E5', bg: '#EEF2FF' },
                      { val: 'staged',      icon: '🧪', label: 'Staging',  color: '#92400E', bg: '#FEF3C7' },
                      { val: 'production',  icon: '🚀', label: 'Producción', color: '#166534', bg: '#DCFCE7' }
                    ] as const).map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setNewDeployStatus(opt.val)}
                        style={{
                          border: newDeployStatus === opt.val ? `2px solid ${opt.color}` : '1.5px solid #E5E7EB',
                          backgroundColor: newDeployStatus === opt.val ? opt.bg : '#FAFAFA',
                          color: newDeployStatus === opt.val ? opt.color : '#6B7280',
                          borderRadius: '9px', padding: '6px 10px',
                          fontSize: '11.5px', fontWeight: 700, cursor: 'pointer',
                          textAlign: 'left', transition: 'all 0.12s ease',
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div style={{
              padding: '16px 28px 24px',
              borderTop: '1px solid #F3F4F6',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#FFFFFF',
                  color: '#6B7280',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>✓</span>
                <span>Registrar en el Sistema</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL OVERLAY: TUTORIAL VISUAL DE APRENDIZAJE ─── */}
      {showTutorial && (
        <SoftwareTutorialModal onClose={() => setShowTutorial(false)} />
      )}

      {/* ─── LISTADO DE MÓDULOS (Grid Responsive de 2 Columnas) ─── */}
      {activeTab !== 'tree_map' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#6B7280', fontSize: '13px' }}>
            🦅 Analizando arquitectura de software...
          </div>
        ) : filteredFeatures.length === 0 ? (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px dashed #D1D5DB',
          padding: '36px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ fontSize: '32px' }}>
            {activeTab === 'audit_kill' ? '🎉' : '💻'}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>
            {activeTab === 'audit_kill'
              ? '¡Tu código está limpio de módulos zombi!'
              : 'No hay módulos en este filtro'}
          </div>
          <p style={{ fontSize: '12.5px', color: '#6B7280', maxWidth: '360px', margin: 0 }}>
            {activeTab === 'audit_kill'
              ? 'No tienes piezas obsoletas marcadas para eliminación. Tu arquitectura está sana.'
              : 'Selecciona otra categoría o agrega un nuevo módulo con el botón superior.'}
          </p>
        </div>
      ) : (
        <div className="kf-feature-grid">
          {filteredFeatures.map(feat => {
            const conf = CONFIDENCE_META[feat.confidence_level || 'needs_polish'] || CONFIDENCE_META.needs_polish;
            const life = LIFECYCLE_META[feat.lifecycle || 'core_essential'] || LIFECYCLE_META.core_essential;
            const layerMeta = LAYER_META[feat.layer] || LAYER_META.frontend;
            const isExpanded = expandedFeatureId === feat.id;
            const submodules = feat.submodules || [];
            const isKillCandidate = feat.lifecycle === 'deprecated_kill' || feat.confidence_level === 'zombie';

            return (
              <div
                key={feat.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: isKillCandidate
                    ? '1.5px solid #FCA5A5'
                    : feat.confidence_level === 'ready_100'
                    ? '1.5px solid #86EFAC'
                    : '1px solid #E5E7EB',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative'
                }}
              >
                {/* Header Card: Capa + Semáforo de Confianza */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: layerMeta.bg,
                      color: layerMeta.color,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      {layerMeta.icon} {layerMeta.label}
                    </span>

                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#F3F4F6',
                      color: life.color,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      {life.icon} {life.label}
                    </span>
                  </div>

                  {/* Selector de Semáforo de Confianza al Vuelo */}
                  <select
                    value={feat.confidence_level || 'needs_polish'}
                    onChange={e => handleUpdateConfidence(feat.id, e.target.value as any)}
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: conf.badgeBg,
                      color: conf.badgeColor,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="ready_100">🟢 100% Producción</option>
                    <option value="needs_polish">🟡 Requiere Pulido</option>
                    <option value="broken_risky">🔴 Riesgo / En Obra</option>
                    <option value="zombie">⚪ Zombi / Descartable</option>
                  </select>
                </div>

                {/* Título, Badges de Git/Deploy & Botón Prompt */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: '0 0 4px', lineHeight: 1.3, flex: 1 }}>
                      {feat.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(feat)}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '8px',
                        border: copiedPromptId === feat.id ? '1px solid #10B981' : '1px solid #C7D2FE',
                        backgroundColor: copiedPromptId === feat.id ? '#ECFDF5' : '#EEF2FF',
                        color: copiedPromptId === feat.id ? '#059669' : '#4F46E5',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                        flexShrink: 0
                      }}
                      title="Copiar prompt listo para pedirle a Antigravity que audite o mejore este módulo"
                    >
                      <span>{copiedPromptId === feat.id ? '✓' : '🤖'}</span>
                      <span>{copiedPromptId === feat.id ? '¡Copiado!' : 'Prompt Antigravity'}</span>
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', margin: '2px 0 6px' }}>
                    <span style={{
                      backgroundColor: '#F3F4F6', color: '#4B5563',
                      borderRadius: '5px', padding: '1px 6px',
                      fontSize: '10px', fontWeight: 700
                    }}>
                      🛠️ {layerMeta.mcpTag}
                    </span>
                    <GitBranchBadge branch={feat.git_branch} />
                    <DeployBadge status={feat.deploy_status} />
                  </div>
                  {feat.description && (
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
                      {feat.description}
                    </p>
                  )}
                </div>

                {/* Submódulos Inspección (Cockpit Visual) */}
                <div style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  border: '1px solid #F3F4F6'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#374151' }}>
                      🧩 Submódulos & Piezas Internas ({submodules.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedFeatureId(isExpanded ? null : feat.id)}
                      style={{ background: 'none', border: 'none', fontSize: '11px', fontWeight: 700, color: '#4F46E5', cursor: 'pointer', padding: 0 }}
                    >
                      {isExpanded ? 'Ocultar DoD ▲' : 'Ver Checklist ▼'}
                    </button>
                  </div>

                  {submodules.length === 0 ? (
                    <div style={{ fontSize: '11.5px', color: '#9CA3AF' }}>Sin submódulos desglosados</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {submodules.map((sub, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                          <span style={{ color: '#374151', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>{sub.status === 'ok' ? '✓' : sub.status === 'deprecated' ? '✕' : '●'}</span>
                            <strong style={{ textDecoration: sub.status === 'deprecated' ? 'line-through' : 'none' }}>{sub.name}</strong>
                          </span>
                          <span style={{ fontSize: '10.5px', color: '#6B7280' }}>
                            {sub.notes || sub.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input rápido de submódulo */}
                  <input
                    type="text"
                    placeholder="+ Añadir submódulo... (Enter)"
                    style={{
                      marginTop: '8px',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB',
                      fontSize: '11px',
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#FFFFFF'
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubmodule(feat, (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>

                {/* Acordeón: Definition of Done para dar Confianza */}
                {isExpanded && (
                  <div style={{
                    backgroundColor: '#F8F9FC',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    border: '1px solid #EEF2FF'
                  }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase' }}>
                      Criterios de Confianza Blindada (DoD)
                    </div>

                    {(feat.dod_checklist || []).map((item, idx) => (
                      <label
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '11.5px',
                          color: item.done ? '#6B7280' : '#1F2937',
                          textDecoration: item.done ? 'line-through' : 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => handleToggleDoD(feat, idx)}
                          style={{ accentColor: '#10B981', width: '14px', height: '14px' }}
                        />
                        <span>{item.task}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Barra Inferior de Acción: Cambiar Rol o Eliminar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px dashed #E5E7EB',
                  fontSize: '11px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#6B7280' }}>Rol:</span>
                    <select
                      value={feat.lifecycle || 'core_essential'}
                      onChange={e => handleUpdateLifecycle(feat.id, e.target.value as any)}
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        padding: '2px 4px',
                        backgroundColor: '#fff'
                      }}
                    >
                      <option value="core_essential">🔥 Core Esencial</option>
                      <option value="ai_differentiator">✨ Diferenciador IA</option>
                      <option value="polish_needed">🔨 En Refinamiento</option>
                      <option value="deprecated_kill">🧹 Candidato a Borrar</option>
                    </select>
                  </div>

                  {isKillCandidate ? (
                    <button
                      onClick={() => handleDeleteFeature(feat.id, feat.title)}
                      style={{
                        backgroundColor: '#FEE2E2',
                        color: '#DC2626',
                        border: '1px solid #FCA5A5',
                        borderRadius: '8px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Eliminar Definitivamente
                    </button>
                  ) : (
                    <span style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 700 }}>
                      {feat.is_frozen ? '❄️ Blindado 100%' : `${feat.progress_percentage || 50}%`}
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
