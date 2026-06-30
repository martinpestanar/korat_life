import { useState, useEffect } from 'react';
import SurvivalWidget from '../components/SurvivalWidget';
import PillarsBar from '../components/PillarsBar';
import { FiTarget, FiMusic, FiBookOpen, FiEdit2, FiPlus } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import VisionItemModal, { type VisionBoardItem } from '../components/VisionItemModal';

export default function ProgresoView() {
  const [activeTab, setActiveTab] = useState<'balance' | 'vision'>('balance');
  const [countdownDays, setCountdownDays] = useState(0);

  // Estados para items personalizables de Vision Board
  const [visionItems, setVisionItems] = useState<VisionBoardItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VisionBoardItem | null>(null);
  const [modalDefaultType, setModalDefaultType] = useState<'card' | 'affirmation'>('card');

  // Carga elementos de vision board
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
  }, []);

  // Calcula la cuenta atrás a Septiembre 1, 2027
  useEffect(() => {
    const targetDate = new Date('2027-09-01T00:00:00');
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setCountdownDays(diffDays > 0 ? diffDays : 0);
  }, []);

  // Frase en portugués aleatoria del día
  const [portuguesePhrase] = useState(() => {
    const phrases = [
      { pt: "Tudo bem, cara de capivara?", es: "¿Todo bien, cara de carpincho? (Modismo carioca amigable)", vibe: "Cotidiana" },
      { pt: "A pressa é a inimiga da perfeição.", es: "La prisa es la enemiga de la perfección.", vibe: "Sabiduría" },
      { pt: "Quem não arrisca, não petisca.", es: "El que no arriesga, no gana.", vibe: "Motivación" },
      { pt: "Estou com saudades do mar do Rio.", es: "Extraño el mar de Río.", vibe: "Vibe" },
      { pt: "Devagar se vai longe.", es: "Despacio se llega lejos.", vibe: "Disciplina" }
    ];
    // Obtenemos una frase basada en el día actual
    const day = new Date().getDate();
    return phrases[day % phrases.length];
  });

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
  const affirmations = visionItems.filter(item => item.item_type === 'affirmation');

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ 
          fontSize: '28px', 
          margin: 0, 
          color: 'var(--text-main)',
          fontFamily: 'var(--font-serif)'
        }}>
          Progreso & Visión
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Tus metas reales y tu brújula inspiradora
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="glass-card" style={{
        display: 'flex',
        padding: '4px',
        background: 'rgba(255,255,255,0.7)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        gap: '4px'
      }}>
        <button
          onClick={() => setActiveTab('balance')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'balance' ? 'var(--text-main)' : 'transparent',
            color: activeTab === 'balance' ? 'var(--bg-app)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '12.5px',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <FiTarget size={14} />
          <span>Balance & Pilares</span>
        </button>
        <button
          onClick={() => setActiveTab('vision')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'vision' ? 'var(--text-main)' : 'transparent',
            color: activeTab === 'vision' ? 'var(--bg-app)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '12.5px',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <FiMusic size={14} />
          <span>Mural de Sueños</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'balance' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <PillarsBar />
          <SurvivalWidget />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>
          
          {/* Cuenta Atrás Río */}
          <div className="glass-card" style={{
            padding: '20px',
            border: '1px solid var(--border-color)',
            background: 'linear-gradient(135deg, #FFFDF9 0%, #FAF5EB 100%)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent-color)' }}>
              Destino: Río de Janeiro (Septiembre 2027) ✈️
            </span>
            <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--text-main)', margin: '4px 0' }}>
              {countdownDays} <span style={{ fontSize: '18px', fontWeight: 500, fontFamily: 'var(--font-sans)', color: 'var(--text-muted)' }}>días</span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
              "10 años después, volverás más sabio, más fuerte y libre financieramente."
            </p>
          </div>

          {/* Galería de Imágenes del Vision Board */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                Visualización Creativa 🌅
              </span>
              <button
                onClick={() => handleAddNew('card')}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  color: 'var(--accent-color)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FiPlus size={12} />
                <span>Añadir Meta</span>
              </button>
            </div>
            
            {/* Collage Flex / Masonry */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cards.map((item) => (
                <div 
                  key={item.id} 
                  className="glass-card" 
                  style={{ 
                    overflow: 'hidden', 
                    padding: 0, 
                    border: '1px solid var(--border-color)',
                    position: 'relative'
                  }}
                >
                  <button 
                    onClick={() => handleEditItem(item)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                    }}
                  >
                    <FiEdit2 size={12} color="var(--text-main)" />
                  </button>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100px', background: 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      Sin Imagen
                    </div>
                  )}
                  <div style={{ padding: '12px 16px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>{item.title}</h4>
                    {item.content && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {item.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Portugués del Día */}
          <div className="glass-card" style={{
            padding: '16px',
            border: '1px solid var(--border-color)',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFD 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiBookOpen size={13} color="var(--accent-blue)" />
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
                Português do Dia · Conexão Vibe
              </span>
            </div>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--accent-blue)', fontFamily: 'var(--font-sans)', fontWeight: 700 }}>
                "{portuguesePhrase.pt}"
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: 'var(--text-main)', fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
                {portuguesePhrase.es}
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '8px', backgroundColor: 'rgba(45, 115, 232, 0.08)', color: 'var(--accent-blue)' }}>
                Categoría: {portuguesePhrase.vibe}
              </span>
            </div>
          </div>

          {/* Tarjetas de Afirmación */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                Afirmaciones Cariocas ☀️
              </span>
              <button
                onClick={() => handleAddNew('affirmation')}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  color: 'var(--accent-color)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FiPlus size={12} />
                <span>Añadir Afirmación</span>
              </button>
            </div>
            
            {affirmations.map((item) => (
              <div 
                key={item.id} 
                className="glass-card" 
                style={{ 
                  padding: '14px', 
                  border: '1px solid var(--border-color)',
                  position: 'relative',
                  textAlign: 'left'
                }}
              >
                <button 
                  onClick={() => handleEditItem(item)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FiEdit2 size={11} color="var(--text-muted)" />
                </button>
                <strong style={{ fontSize: '12.5px', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  {item.title}
                </strong>
                {item.content && (
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    "{item.content}"
                  </span>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Vision Item modal (Add/Edit) */}
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
