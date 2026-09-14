import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSaaS } from '../context/SaaSContext';
import { supabase } from '../lib/supabase';
import { formatPenAndUsd } from '../lib/currencyUtils';

export default function SettingsView() {
  const navigate = useNavigate();
  const { currentSlug, currentProject, allProjects, setCurrentSlug, refreshSaaSData } = useSaaS();
  const [saving, setSaving] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);

  // 2 Planes: Freemium / Piloto y Pro IA
  const [freemiumPrice, setFreemiumPrice] = useState('0');
  const [freemiumFeatures, setFreemiumFeatures] = useState(
    '1 usuario\nGestión esencial\nPrueba piloto de 14 días'
  );

  const [proPrice, setProPrice] = useState('189');
  const [proFeatures, setProFeatures] = useState(
    'Usuarios ilimitados\nBot de WhatsApp con IA\nAutomatizaciones completas\nSoporte prioritario'
  );

  useEffect(() => {
    if (currentProject?.pricing_plans && currentProject.pricing_plans.length > 0) {
      const freePlan = currentProject.pricing_plans.find(p =>
        p.name.toLowerCase().includes('free') || p.name.toLowerCase().includes('starter') || p.price === 0
      );
      const proPlan = currentProject.pricing_plans.find(p =>
        p.name.toLowerCase().includes('pro') || p.price > 0
      );

      if (freePlan) {
        setFreemiumPrice(String(freePlan.price ?? 0));
        if (freePlan.features?.length) {
          setFreemiumFeatures(freePlan.features.join('\n'));
        }
      } else {
        setFreemiumPrice('0');
      }

      if (proPlan) {
        setProPrice(String(proPlan.price ?? (currentSlug === 'nilah-ia' ? 189 : 149)));
        if (proPlan.features?.length) {
          setProFeatures(proPlan.features.join('\n'));
        }
      }
    } else {
      // Valores por defecto realistas para Perú / LATAM
      setFreemiumPrice('0');
      if (currentSlug === 'nilah-ia') {
        setProPrice('189');
        setFreemiumFeatures('1 usuario\nAgenda básica\nPrueba piloto de 14 días');
        setProFeatures('Bot WhatsApp IA para citas\nRecordatorios automáticos anti no-show\nHistorial de clientes y fichas técnicas\nSoporte prioritario');
      } else {
        setProPrice('149');
        setFreemiumFeatures('1 salón o local\nMenú QR digital básico\nPrueba de 14 días');
        setProFeatures('Comandas automáticas por WhatsApp\nPanel de cocina en tiempo real\nControl de stock crítico\nSoporte prioritario');
      }
    }
  }, [currentProject?.id, currentSlug]);

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject?.id) return;
    setSaving(true);

    const parseFeatures = (text: string) =>
      text
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

    const plans = [
      {
        name: 'Plan Freemium (Piloto)',
        price: parseFloat(freemiumPrice) || 0,
        currency: 'PEN',
        billing: 'mensual',
        features: parseFeatures(freemiumFeatures)
      },
      {
        name: 'Plan Pro IA',
        price: parseFloat(proPrice) || (currentSlug === 'nilah-ia' ? 189 : 149),
        currency: 'PEN',
        billing: 'mensual',
        features: parseFeatures(proFeatures)
      }
    ];

    await supabase.from('saas_projects').update({
      pricing_plans: plans,
      updated_at: new Date().toISOString()
    }).eq('id', currentProject.id);

    setSaving(false);
    setSavedAlert(true);
    await refreshSaaSData();
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const freeConversion = formatPenAndUsd(parseFloat(freemiumPrice) || 0);
  const proConversion = formatPenAndUsd(parseFloat(proPrice) || 0);

  return (
    <div className="kf-pillar-container">
      {/* Top Header */}
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
            <span style={{ fontSize: '22px' }}>💎</span>
            <h1 className="kf-pillar-title" style={{ margin: 0 }}>
              Precios & Monetización (Perú / LATAM)
            </h1>
          </div>
        </div>

        {savedAlert && (
          <div style={{
            backgroundColor: '#DCFCE7',
            color: '#166534',
            padding: '6px 14px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 800,
            boxShadow: '0 2px 8px rgba(22, 101, 52, 0.15)'
          }}>
            ✓ Precios actualizados en Supabase
          </div>
        )}
      </header>

      {/* Switcher de Negocio */}
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
              type="button"
              onClick={() => setCurrentSlug(p.slug)}
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: isActive ? '#4F46E5' : 'transparent',
                color: isActive ? '#FFFFFF' : '#4B5563',
                fontWeight: isActive ? 800 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '16px' }}>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Formulario de Precios: Modelo 2 Planes */}
      <form onSubmit={handleSavePricing} className="kf-card" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '18px' }}>{currentProject?.icon}</span>
            <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Estrategia de 2 Planes para {currentProject?.name} ({currentProject?.niche})
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            Precios calibrados para el mercado peruano en <strong>Soles (S/)</strong> y convertidos automáticamente a dólares de referencia.
            La experiencia y niveles del fundador se gestionan internamente en Supabase.
          </p>
        </div>

        {/* 2 Tarjetas: Plan Freemium y Plan Pro */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '18px',
          alignItems: 'stretch'
        }}>

          {/* PLAN 1: FREEMIUM / PILOTO */}
          <div style={{
            backgroundColor: '#F9FAFB',
            borderRadius: '18px',
            border: '1px solid #E5E7EB',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: '#E5E7EB',
                  color: '#374151',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase'
                }}>
                  Entrada / Validación
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280' }}>
                  {freeConversion.usdFormatted}
                </span>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
                Plan Freemium / Piloto
              </h3>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 16px' }}>
                Pensado para vencer la fricción en salones y restaurantes con pilotos de adopción rápida.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label className="kf-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Precio Mensual (Soles PEN)</span>
                  <span style={{ color: '#4F46E5', fontWeight: 700 }}>{freeConversion.penFormatted}</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '12px', fontWeight: 700, color: '#6B7280' }}>S/</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="kf-input"
                    style={{ paddingLeft: '34px', fontWeight: 800, fontSize: '18px' }}
                    value={freemiumPrice}
                    onChange={(e) => setFreemiumPrice(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="kf-label">Beneficios incluidos (1 por línea)</label>
                <textarea
                  rows={4}
                  className="kf-input"
                  style={{ fontSize: '12.5px', lineHeight: 1.5, resize: 'vertical' }}
                  value={freemiumFeatures}
                  onChange={(e) => setFreemiumFeatures(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* PLAN 2: PRO IA (DESTACADO) */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            border: '2px solid #4F46E5',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(79, 70, 229, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
            position: 'relative'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: '#EEF2FF',
                  color: '#4F46E5',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase'
                }}>
                  ⭐ Plan Recomendado
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#4F46E5' }}>
                  {proConversion.usdFormatted}
                </span>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
                Plan Pro IA
              </h3>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 16px' }}>
                Plan recurrente con bot autónomo de IA y automatización completa para cobrar cada mes.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label className="kf-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Precio Mensual (Soles PEN)</span>
                  <span style={{ color: '#4F46E5', fontWeight: 800 }}>{proConversion.penFormatted}</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '12px', fontWeight: 700, color: '#4F46E5' }}>S/</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="kf-input"
                    style={{ paddingLeft: '34px', fontWeight: 800, fontSize: '18px', borderColor: '#4F46E5' }}
                    value={proPrice}
                    onChange={(e) => setProPrice(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="kf-label">Beneficios incluidos (1 por línea)</label>
                <textarea
                  rows={4}
                  className="kf-input"
                  style={{ fontSize: '12.5px', lineHeight: 1.5, resize: 'vertical' }}
                  value={proFeatures}
                  onChange={(e) => setProFeatures(e.target.value)}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Botón de Guardado */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #E5E7EB' }}>
          <button
            type="submit"
            disabled={saving}
            className="kf-btn kf-btn-primary"
            style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 800 }}
          >
            {saving ? 'Guardando...' : `💾 Guardar Precios para ${currentProject?.name}`}
          </button>
        </div>
      </form>
    </div>
  );
}
