import { useState, useEffect } from 'react';
import { FiX, FiCheck, FiTrash2 } from 'react-icons/fi';
import { supabase } from '../lib/supabase';

export interface VisionBoardItem {
  id: string;
  title: string;
  content?: string;
  image_url?: string;
  item_type: 'card' | 'affirmation';
}

interface VisionItemModalProps {
  isOpen: boolean;
  item: VisionBoardItem | null; // If null, we are creating
  defaultType?: 'card' | 'affirmation';
  onClose: () => void;
  onSave: () => void;
}

export default function VisionItemModal({
  isOpen,
  item,
  defaultType = 'card',
  onClose,
  onSave
}: VisionItemModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [itemType, setItemType] = useState<'card' | 'affirmation'>('card');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setContent(item.content || '');
      setImageUrl(item.image_url || '');
      setItemType(item.item_type || 'card');
    } else {
      setTitle('');
      setContent('');
      setImageUrl('');
      setItemType(defaultType);
    }
  }, [item, isOpen, defaultType]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      alert('El título es obligatorio.');
      return;
    }
    setLoading(true);

    try {
      if (item) {
        // UPDATE
        const { error } = await supabase
          .from('vision_board_items')
          .update({
            title: title.trim(),
            content: content.trim() || null,
            image_url: itemType === 'card' ? (imageUrl.trim() || null) : null,
            item_type: itemType
          })
          .eq('id', item.id);

        if (error) throw error;
      } else {
        // INSERT
        const { error } = await supabase
          .from('vision_board_items')
          .insert({
            title: title.trim(),
            content: content.trim() || null,
            image_url: itemType === 'card' ? (imageUrl.trim() || null) : null,
            item_type: itemType
          });

        if (error) throw error;
      }
      onSave();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error al guardar el elemento del vision board.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!window.confirm('¿Seguro que quieres eliminar este elemento de tu visión?')) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('vision_board_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      onSave();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error al eliminar el elemento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div 
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
          animation: 'fadeIn 0.2s ease',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', margin: 0, color: 'var(--text-main)' }}>
            {item ? 'Editar Sueño' : 'Añadir a la Visión'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {item && (
              <button
                onClick={handleDelete}
                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', padding: '4px' }}
                title="Eliminar de mi visión"
              >
                <FiTrash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Tipo de Elemento */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Tipo de Elemento
          </label>
          <select
            value={itemType}
            onChange={e => setItemType(e.target.value as 'card' | 'affirmation')}
            style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
          >
            <option value="card">Mural Visual (Tarjeta con Foto)</option>
            <option value="affirmation">Afirmación / Cita Motivadora</option>
          </select>
        </div>

        {/* Título */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Título o Hito
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={itemType === 'card' ? "Ej: Atardecer en Copacabana" : "Ej: 📷 Foco y Creación"}
            style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
          />
        </div>

        {/* Contenido / Afirmación */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
            {itemType === 'card' ? "Descripción o Logro" : "Mensaje de la Afirmación"}
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={itemType === 'card' ? "Cuéntate el por qué de este sueño..." : "Escribe una frase potente para repetir todos los días..."}
            rows={3}
            style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none', resize: 'vertical' }}
          />
        </div>

        {/* Imagen (solo si es card) */}
        {itemType === 'card' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
              URL de la Imagen (Opcional)
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="Enlace de Pinterest, Unsplash, o /vision_rio.png"
              style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: 'var(--text-main)',
              color: 'var(--bg-app)',
              border: 'none',
              borderRadius: '8px',
              padding: '10px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <FiCheck size={16} />
            <span>{loading ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
