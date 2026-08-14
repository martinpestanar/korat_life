import { useState, useEffect } from 'react';
import PersonalFinancesDashboard from '../components/PersonalFinancesDashboard';
import InvestmentsWidget from '../components/InvestmentsWidget';
import { FiDollarSign, FiMusic, FiPlus, FiEdit2 } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import VisionItemModal, { type VisionBoardItem } from '../components/VisionItemModal';

export default function ProgresoView() {
  const [activeTab, setActiveTab] = useState<'finances' | 'vision'>('finances');
  const [countdownDays, setCountdownDays] = useState(0);

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
  }, []);

  // Countdown to Sept 1, 2027
  useEffect(() => {
    const targetDate = new Date('2027-09-01T00:00:00');
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setCountdownDays(diffDays > 0 ? diffDays : 0);
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

  return (
    <div className="page-enter" style={{
      padding: '16px',
      paddingBottom: '120px',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px'
    }}>
      
      {/* Header */}
      <div>
        <h1 style={{ 
          fontSize: '28px', 
          margin: 0, 
          color: 'var(--text-main)',
          fontFamily: 'var(--font-serif)',
          fontWeight: 700
        }}>
          Finanzas & Inversiones
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px', fontFamily: 'var(--font-sans)' }}>
          Control esencial de tu patrimonio, colchón de libertad y metas financieras
        </p>
      </div>

      {/* Tabs Selector */}
      <div style={{
        display: 'flex',
        padding: '4px',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        gap: '4px'
      }}>
        <button
          onClick={() => setActiveTab('finances')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: activeTab === 'finances' ? 'var(--text-main)' : 'transparent',
            color: activeTab === 'finances' ? 'var(--bg-app)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <FiDollarSign size={15} />
          <span>Finanzas & Inversiones</span>
        </button>
        
        <button
          onClick={() => setActiveTab('vision')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: activeTab === 'vision' ? 'var(--text-main)' : 'transparent',
            color: activeTab === 'vision' ? 'var(--bg-app)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <FiMusic size={15} />
          <span>Mural de Sueños</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'finances' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Dashboard de Finanzas Personales */}
          <PersonalFinancesDashboard />

          {/* Widget de Inversiones y Metas */}
          <InvestmentsWidget />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'fadeIn 0.3s ease' }}>
          
          {/* Cuenta Atrás Río */}
          <div style={{
            padding: '20px',
            borderRadius: '20px',
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

          {/* Vision Board */}
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cards.map((item) => (
                <div 
                  key={item.id} 
                  style={{ 
                    overflow: 'hidden', 
                    borderRadius: '16px', 
                    background: 'var(--bg-card)',
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
                      zIndex: 10
                    }}
                  >
                    <FiEdit2 size={12} color="var(--text-main)" />
                  </button>
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                    />
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

        </div>
      )}

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
