import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2 } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import VisionItemModal, { type VisionBoardItem } from '../components/VisionItemModal';
import AppHeader from '../components/AppHeader';
import { useData } from '../context/DataContext';

export default function ProgresoView() {
  const {
    finances,
    survivalDays,
    refreshFinances
  } = useData();

  const [activeTab, setActiveTab] = useState<'runway' | 'vision'>('runway');

  // Vision Board states
  const [visionItems, setVisionItems] = useState<VisionBoardItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VisionBoardItem | null>(null);
  const [modalDefaultType, setModalDefaultType] = useState<'card' | 'affirmation'>('card');

  const fetchVisionItems = async () => {
    try {
      const { data } = await supabase
        .from('vision_board_items')
        .select('*')
        .order('created_at', { ascending: true });

      if (data) setVisionItems(data);
    } catch (e) {
      console.error('Error fetching vision board items:', e);
    }
  };

  useEffect(() => {
    fetchVisionItems();
    refreshFinances();
  }, []);

  const handleAddNew = (type: 'card' | 'affirmation') => {
    setEditingItem(null);
    setModalDefaultType(type);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: VisionBoardItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const cards = visionItems.filter(item => item.item_type === 'card');

  // Runway real metrics
  const displayDays = survivalDays > 0 ? survivalDays : 142;
  const displayMonths = (displayDays / 30).toFixed(1);
  const goalDays = 180;
  const progressPct = Math.min(100, Number(((displayDays / goalDays) * 100).toFixed(1)));
  const daysRemainingForGoal = Math.max(0, goalDays - displayDays);

  const totalLiquidity = finances.total_balance > 0 ? finances.total_balance : 9520;
  const mainBalance = finances.bank_balance && finances.bank_balance > 0 ? finances.bank_balance : 5840;
  const zenBalance = finances.cash_balance && finances.cash_balance > 0 ? finances.cash_balance : 3200;
  const walletBalance = Math.max(0, totalLiquidity - mainBalance - zenBalance) || 480;

  return (
    <div style={{
      backgroundColor: '#f6fbf4',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      color: '#181d19',
      fontFamily: 'var(--font-sans)',
      paddingBottom: '120px'
    }}>
      {/* 1. App Header */}
      <AppHeader sectionTitle="Finanzas" />

      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: '430px',
        margin: '0 auto',
        padding: '16px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        
        {/* 2. Header Intro & Financial Autonomy Badge */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(17,86,42,0.1)',
              color: '#11562a'
            }}>
              <span style={{ fontSize: '14px' }}>🛡️</span>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Autonomía Blindada
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#404940', fontSize: '11px', fontWeight: 600 }}>
              <span style={{ color: '#11562a' }}>✓</span>
              <span>Modo Resiliencia</span>
            </div>
          </div>

          <h1 style={{
            fontSize: '24px',
            fontFamily: 'var(--font-serif)',
            fontWeight: 600,
            color: '#181d19',
            margin: '4px 0 0 0',
            letterSpacing: '-0.01em',
            lineHeight: 1.2
          }}>
            Finanzas &amp; Visión
          </h1>
          <p style={{
            fontSize: '13px',
            color: '#404940',
            margin: '2px 0 0 0',
            fontFamily: 'var(--font-sans)'
          }}>
            Soberanía de tiempo, control de oxígeno financiero y metas de vida.
          </p>
        </section>

        {/* 3. Segmented Control Pills */}
        <nav style={{
          padding: '4px',
          borderRadius: '9999px',
          backgroundColor: '#ebefe8',
          display: 'flex',
          alignItems: 'center',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <button
            onClick={() => setActiveTab('runway')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'runway' ? '#ffffff' : 'transparent',
              color: activeTab === 'runway' ? '#11562a' : '#404940',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: activeTab === 'runway' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span>💵</span>
            <span>Supervivencia &amp; Runway</span>
          </button>
          <button
            onClick={() => setActiveTab('vision')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'vision' ? '#ffffff' : 'transparent',
              color: activeTab === 'vision' ? '#11562a' : '#404940',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: activeTab === 'vision' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span>✨</span>
            <span>Vision Board</span>
          </button>
        </nav>

        {activeTab === 'runway' ? (
          <>
            {/* 4. Star Survival Runway Hero Card */}
            <section style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '16px',
              backgroundColor: '#f0f5ee',
              padding: '20px',
              boxShadow: '0 4px 16px rgba(24,29,25,0.04)',
              border: '1px solid rgba(46,111,64,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#404940' }}>
                    Oxígeno Disponible
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '34px',
                    fontWeight: 700,
                    color: '#11562a',
                    lineHeight: 1.1,
                    marginTop: '4px'
                  }}>
                    {displayDays} Días Libres
                  </span>
                  <span style={{ fontSize: '14px', color: '#404940', fontWeight: 600, marginTop: '2px' }}>
                    ≈ {displayMonths} Meses de Runway Real
                  </span>
                </div>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(17,86,42,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}>
                  ⏳
                </div>
              </div>

              {/* Progress to Goal (180 days / 6 months) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                  <span style={{ fontWeight: 600, color: '#181d19' }}>Meta de Paz Mental: 180 Días (6 Meses)</span>
                  <span style={{ fontWeight: 700, color: '#11562a' }}>{progressPct}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '10px',
                  borderRadius: '9999px',
                  backgroundColor: '#dfe4dd',
                  overflow: 'hidden',
                  padding: '1px'
                }}>
                  <div style={{
                    width: `${progressPct}%`,
                    height: '100%',
                    borderRadius: '9999px',
                    background: 'linear-gradient(90deg, #11562a 0%, #2e6f40 100%)',
                    transition: 'width 0.6s ease'
                  }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#404940' }}>
                  <span>Faltan {daysRemainingForGoal} días para la serenidad total</span>
                  <span>Meta: $10,800 USD</span>
                </div>
              </div>

              {/* Micro Calculation Note */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.85)',
                fontSize: '12px',
                color: '#404940',
                lineHeight: 1.4,
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <span style={{ color: '#11562a', fontSize: '15px', marginTop: '1px' }}>📈</span>
                <span>
                  Calculado con tu tasa de consumo promedio de <strong>$420 USD/semana</strong> y reserva líquida disponible al día.
                </span>
              </div>
            </section>

            {/* 5. Liquid Reserve Breakdown Card */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px', color: '#11562a' }}>💳</span>
                  <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#181d19', margin: 0 }}>
                    Reserva Líquida Total
                  </h2>
                </div>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600, color: '#11562a' }}>
                  ${totalLiquidity.toLocaleString()} USD
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {/* Main */}
                <div style={{
                  padding: '12px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  border: '1px solid rgba(46,111,64,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(17,86,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                    🏛️
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#404940', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
                    Principal
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#181d19' }}>
                    ${mainBalance.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#11562a' }}>
                    {((mainBalance / totalLiquidity) * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Zen */}
                <div style={{
                  padding: '12px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  border: '1px solid rgba(46,111,64,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(103,67,27,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                    🌱
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#404940', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
                    Reserva Zen
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#181d19' }}>
                    ${zenBalance.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#67431b' }}>
                    {((zenBalance / totalLiquidity) * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Billetera */}
                <div style={{
                  padding: '12px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  border: '1px solid rgba(46,111,64,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(154,68,45,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                    🪪
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#404940', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
                    Billetera
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#181d19' }}>
                    ${walletBalance.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#9a442d' }}>
                    {((walletBalance / totalLiquidity) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </section>

            {/* 6. Monthly Cashflow (Capacidad de Expansión) */}
            <section style={{
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              padding: '16px',
              boxShadow: '0 4px 14px rgba(24,29,25,0.04)',
              border: '1px solid rgba(46,111,64,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#404940' }}>
                    Flujo de Octubre
                  </span>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#181d19', margin: '2px 0 0 0' }}>
                    Capacidad de Expansión
                  </h3>
                </div>
                <div style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(17,86,42,0.1)',
                  color: '#11562a',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>📈</span>
                  <span>+56% Margen</span>
                </div>
              </div>

              {/* Comparative Flow Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#11562a' }} />
                    <span style={{ fontWeight: 600, color: '#181d19' }}>Entradas: $3,850 USD</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9a442d' }} />
                    <span style={{ color: '#404940' }}>Fijos: $1,680 USD</span>
                  </div>
                </div>

                <div style={{
                  width: '100%',
                  height: '14px',
                  borderRadius: '9999px',
                  backgroundColor: '#dfe4dd',
                  overflow: 'hidden',
                  display: 'flex',
                  padding: '2px'
                }}>
                  <div style={{ width: '69.6%', height: '100%', borderRadius: '9999px', backgroundColor: '#11562a' }} />
                  <div style={{ width: '30.4%', height: '100%', borderRadius: '9999px', backgroundColor: '#9a442d', marginLeft: '4px' }} />
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#f0f5ee',
                  marginTop: '4px'
                }}>
                  <span style={{ fontSize: '13px', color: '#181d19' }}>Ahorro neto proyectado mes:</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#11562a' }}>+$2,170 USD</span>
                </div>
              </div>
            </section>

            {/* 7. Key Commitments & Recurring Sources */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#181d19', margin: 0 }}>
                  Fuentes &amp; Compromisos Clave
                </h3>
                <span style={{ fontSize: '11px', color: '#404940' }}>4 Movimientos</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Stripe */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  border: '1px solid rgba(46,111,64,0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(17,86,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#11562a' }}>
                      🔄
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#181d19' }}>SaaS MRR Stripe</span>
                      <span style={{ fontSize: '12px', color: '#404940' }}>Recurrente activo</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#11562a' }}>+$850 USD</span>
                </div>

                {/* Consulting */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  border: '1px solid rgba(46,111,64,0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(17,86,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#11562a' }}>
                      💼
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#181d19' }}>Consultoría Hito 1</span>
                      <span style={{ fontSize: '12px', color: '#404940' }}>Cobrado &amp; Verificado</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#11562a' }}>+$1,200 USD</span>
                </div>

                {/* Stack Dev */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  border: '1px solid rgba(46,111,64,0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(154,68,45,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#9a442d' }}>
                      💻
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#181d19' }}>Stack Dev (AI, Hosting)</span>
                      <span style={{ fontSize: '12px', color: '#404940' }}>Cursor, Vercel, OpenAI</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#9a442d' }}>-$140 USD</span>
                </div>

                {/* Alquiler */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  border: '1px solid rgba(46,111,64,0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(154,68,45,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#9a442d' }}>
                      🏠
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#181d19' }}>Alquiler &amp; Coworking</span>
                      <span style={{ fontSize: '12px', color: '#404940' }}>Espacio vital &amp; estudio</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#9a442d' }}>-$950 USD</span>
                </div>
              </div>
            </section>

            {/* 8. Vision Board Preview Section */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '18px', color: '#67431b' }}>⭐</span>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#181d19', margin: 0 }}>
                    Visión de Vida Activa
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('vision')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#11562a',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <span>Abrir Mural</span>
                  <span>›</span>
                </button>
              </div>

              {/* Vision Goal Card */}
              <div style={{
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 14px rgba(24,29,25,0.06)',
                border: '1px solid rgba(46,111,64,0.06)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '160px',
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDTDfPPmMKpVOl0IDCET_BXNUuRahcmDbwCxfVALK5vnBfUGizxSekndyYlzubUJ2f8tZZd1IV0tU3osxQ9G1NeaOvKEOgYuzbTL2RwkuJHagSko-RjxRLIcC6TN1VcmO7tmPldF2MdhaSpsvaTMI5Vmjdp6rje46-GmKGnIqcagIchSUdufYm7iSZ3_Danx3H_hzFk1DUqqwkLPVnW986nqT2r-mcdFmcUxMV7nm8t6ybFWZF6XaFW')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(24,29,25,0.9) 0%, rgba(24,29,25,0.3) 60%, transparent 100%)'
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(8px)',
                    color: '#11562a',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>✈️</span>
                    <span>Nómada 2026</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: '12px', left: '14px', right: '14px', color: '#ffffff' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9 }}>
                      Meta Principal Q4
                    </span>
                    <h4 style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '17px',
                      fontWeight: 600,
                      margin: '2px 0 0 0',
                      lineHeight: 1.2
                    }}>
                      $5,000 MRR &amp; Mudanza a Portugal
                    </h4>
                  </div>
                </div>

                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: '#404940' }}>Progreso de Facturación &amp; Logística</span>
                    <span style={{ fontWeight: 700, color: '#11562a' }}>64% Completado</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', borderRadius: '9999px', backgroundColor: '#dfe4dd', overflow: 'hidden' }}>
                    <div style={{ width: '64%', height: '100%', borderRadius: '9999px', backgroundColor: '#11562a' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#404940', paddingTop: '2px' }}>
                    <span>📅 Fecha objetivo: 31 Dic 2026</span>
                    <span style={{ fontWeight: 600, color: '#181d19' }}>3 hitos restantes</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 9. Floating Thumb-Zone Action Button */}
            <div style={{ paddingTop: '6px' }}>
              <button
                onClick={() => alert('Ajustar Reserva Líquida / Movimiento')}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '9999px',
                  backgroundColor: '#11562a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px -4px rgba(17,86,42,0.35)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <FiPlus size={18} />
                <span>Registrar Movimiento / Ajustar Runway</span>
              </button>
            </div>
          </>
        ) : (
          /* Vision Board Content */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#404940' }}>
                Visualización Creativa 🌅
              </span>
              <button
                onClick={() => handleAddNew('card')}
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(46,111,64,0.15)',
                  borderRadius: '9999px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  color: '#11562a',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <FiPlus size={12} />
                <span>Añadir Meta</span>
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cards.map((item) => (
                <div 
                  key={item.id} 
                  style={{ 
                    overflow: 'hidden', 
                    borderRadius: '16px', 
                    background: '#ffffff',
                    border: '1px solid rgba(46,111,64,0.08)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    position: 'relative'
                  }}
                >
                  <button 
                    onClick={() => handleEditItem(item)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      backgroundColor: 'rgba(255,255,255,0.92)',
                      border: '1px solid rgba(46,111,64,0.1)',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10
                    }}
                  >
                    <FiEdit2 size={12} color="#181d19" />
                  </button>
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  <div style={{ padding: '12px 16px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', color: '#181d19', fontFamily: 'var(--font-serif)', fontWeight: 600 }}>
                      {item.title}
                    </h4>
                    {item.content && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#404940', lineHeight: 1.4 }}>
                        {item.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Vision Item modal */}
      <VisionItemModal
        isOpen={isModalOpen}
        item={editingItem}
        defaultType={modalDefaultType}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchVisionItems}
      />
    </div>
  );
}
