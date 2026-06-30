import { useState, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import ContentDetailDrawer, { type YoutubeContent } from '../components/ContentDetailDrawer';
import IosAlertModal from '../components/IosAlertModal';

const COLUMNS = ['Ideas', 'Guion', 'Grabando', 'Editando', 'Listo'];

const COLUMN_COLORS: Record<string, string> = {
  Ideas: '#FFF9E6',
  Guion: '#F3EAF8',
  Grabando: '#E5F6F8',
  Editando: '#E6F8EA',
  Listo: '#FAF8F5'
};

const COLUMN_LABELS: Record<string, string> = {
  Ideas: '💡 Ideas',
  Guion: '✍️ Guion',
  Grabando: '🎥 Grabando',
  Editando: '✂️ Editando',
  Listo: '✅ Publicado'
};

export default function CreadorView() {
  const [contents, setContents] = useState<YoutubeContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<YoutubeContent | null>(null);
  
  // Estados para Modal iOS
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [targetColumn, setTargetColumn] = useState('Ideas');

  const fetchContents = async () => {
    try {
      const { data } = await supabase
        .from('youtube_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setContents(data);
    } catch (e) {
      console.error('Error fetching youtube content:', e);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const handleCreateNew = (columnStatus: string) => {
    setTargetColumn(columnStatus);
    setIsPromptOpen(true);
  };

  const handleConfirmCreate = async (title?: string) => {
    setIsPromptOpen(false);
    if (!title || !title.trim()) return;

    try {
      const { data, error } = await supabase
        .from('youtube_content')
        .insert({
          title: title.trim(),
          status: targetColumn
        })
        .select()
        .single();

      if (error) throw error;
      fetchContents();
      if (data) {
        setSelectedContent(data);
      }
    } catch (e) {
      console.error(e);
      alert('Error al crear la tarjeta.');
    }
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100vh', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ 
            fontSize: '26px', 
            margin: 0, 
            color: 'var(--text-main)',
            fontFamily: 'var(--font-serif)'
          }}>
            Producción de YouTube
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Gestiona guiones, ideas y contenido de tu marca
          </p>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '20px',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {COLUMNS.map((col) => {
          const colContents = contents.filter(c => c.status === col);
          return (
            <div
              key={col}
              style={{
                flex: '0 0 280px',
                scrollSnapAlign: 'start',
                backgroundColor: 'rgba(255,255,255,0.4)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxHeight: '100%',
                overflowY: 'auto'
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>
                  {COLUMN_LABELS[col]} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>({colContents.length})</span>
                </span>
                <button
                  onClick={() => handleCreateNew(col)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                >
                  <FiPlus size={16} />
                </button>
              </div>

              {/* Column Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {colContents.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedContent(item)}
                    className="glass-card"
                    style={{
                      padding: '14px',
                      backgroundColor: COLUMN_COLORS[col],
                      border: '1.5px solid var(--border-color)',
                      cursor: 'pointer',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'transform 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4, fontFamily: 'var(--font-sans)' }}>
                      {item.title}
                    </span>
                    
                    {/* Badge details */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(0,0,0,0.04)',
                        color: 'var(--text-muted)'
                      }}>
                        {item.content_type || 'Video largo'}
                      </span>
                      {item.content_line && (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(46, 111, 64, 0.08)',
                          color: 'var(--accent-green)'
                        }}>
                          {item.content_line}
                        </span>
                      )}
                      {item.thumbnail_ready && (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(45, 115, 232, 0.08)',
                          color: '#2D73E8'
                        }}>
                          🖼️ Miniatura
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {colContents.length === 0 && (
                  <div 
                    onClick={() => handleCreateNew(col)}
                    style={{
                      border: '1.5px dashed var(--border-color)',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'rgba(0,0,0,0.01)'
                    }}
                  >
                    <span>Sin contenido</span>
                    <span style={{ fontSize: '9px', color: 'var(--accent-color)', fontWeight: 600 }}>+ Añadir idea</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notion Drawer */}
      <ContentDetailDrawer
        content={selectedContent}
        onClose={() => setSelectedContent(null)}
        onSave={fetchContents}
      />

      {/* iOS Prompt Modal */}
      <IosAlertModal
        isOpen={isPromptOpen}
        title="Nuevo Contenido"
        message="Introduce el título para esta nueva idea o video:"
        type="prompt"
        placeholder="Título del video..."
        confirmText="Aceptar"
        cancelText="Cancelar"
        onConfirm={handleConfirmCreate}
        onCancel={() => setIsPromptOpen(false)}
      />
    </div>
  );
}
