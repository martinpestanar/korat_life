import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiCheck, FiTrash2, FiCalendar, FiLink, FiClock } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import IosAlertModal from './IosAlertModal';

export interface YoutubeContent {
  id: string;
  title: string;
  status: string;
  objective?: string;
  title_options?: string;
  script?: string;
  thumbnail_idea?: string;
  content_type?: string;
  content_line?: string;
  thumbnail_ready?: boolean;
  release_day?: string;
  publish_date?: string;
  recording_date?: string;
  video_url?: string;
  estimated_duration?: string;
}

interface ContentDetailDrawerProps {
  content: YoutubeContent | null;
  onClose: () => void;
  onSave: () => void;
}

export default function ContentDetailDrawer({ content, onClose, onSave }: ContentDetailDrawerProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('Ideas');
  const [objective, setObjective] = useState('');
  const [titleOptions, setTitleOptions] = useState('');
  const [script, setScript] = useState('');
  const [thumbnailIdea, setThumbnailIdea] = useState('');
  const [contentType, setContentType] = useState('Video largo');
  const [contentLine, setContentLine] = useState('Vlogs');
  const [thumbnailReady, setThumbnailReady] = useState(false);
  const [releaseDay, setReleaseDay] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [recordingDate, setRecordingDate] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (content) {
      setTitle(content.title || '');
      setStatus(content.status || 'Ideas');
      setObjective(content.objective || '');
      setTitleOptions(content.title_options || '');
      setScript(content.script || '');
      setThumbnailIdea(content.thumbnail_idea || '');
      setContentType(content.content_type || 'Video largo');
      setContentLine(content.content_line || 'Vlogs');
      setThumbnailReady(content.thumbnail_ready || false);
      setReleaseDay(content.release_day || '');
      setPublishDate(content.publish_date || '');
      setRecordingDate(content.recording_date || '');
      setVideoUrl(content.video_url || '');
      setEstimatedDuration(content.estimated_duration || '');
    }
  }, [content]);

  const handleSave = async () => {
    if (!content) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('youtube_content')
        .update({
          title,
          status,
          objective: objective || null,
          title_options: titleOptions || null,
          script: script || null,
          thumbnail_idea: thumbnailIdea || null,
          content_type: contentType,
          content_line: contentLine,
          thumbnail_ready: thumbnailReady,
          release_day: releaseDay || null,
          publish_date: publishDate || null,
          recording_date: recordingDate || null,
          video_url: videoUrl || null,
          estimated_duration: estimatedDuration || null
        })
        .eq('id', content.id);

      if (error) throw error;
      onSave();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error al guardar el contenido.');
    } finally {
      setLoading(false);
    }
  };

  // Estado para Modal de Confirmación iOS
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsConfirmOpen(false);
    if (!content) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('youtube_content')
        .delete()
        .eq('id', content.id);

      if (error) throw error;
      onSave();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error al eliminar el contenido.');
    } finally {
      setLoading(false);
    }
  };
  if (!content) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'flex-end',
      zIndex: 3000,
    }}>
      <div 
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '100%',
          backgroundColor: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 25px rgba(0, 0, 0, 0.08)',
          animation: 'slideInRight 0.3s ease-out',
          position: 'relative'
        }}
      >
        {/* Style for slideIn Animation */}
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Drawer Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'rgba(255,255,255,0.4)',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🎬</span>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
              Propiedades del Video
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleDelete}
              title="Eliminar contenido"
              style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', padding: '6px' }}
            >
              <FiTrash2 size={18} />
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '6px' }}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Título */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título del video o idea..."
            style={{
              fontSize: '22px',
              fontFamily: 'var(--font-serif)',
              fontWeight: 'bold',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--text-main)',
              padding: '4px 0',
              borderBottom: '1.5px solid transparent',
              transition: 'border-bottom-color 0.2s'
            }}
            onFocus={e => e.target.style.borderBottomColor = 'var(--border-color)'}
            onBlur={e => e.target.style.borderBottomColor = 'transparent'}
          />

          {/* Estado en Tablero */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Estado</span>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '13px' }}
            >
              <option value="Ideas">Ideas</option>
              <option value="Guion">Guion</option>
              <option value="Grabando">Grabando</option>
              <option value="Editando">Editando</option>
              <option value="Listo">Publicado</option>
            </select>
          </div>

          {/* Tipo de Contenido */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Tipo de Contenido</span>
            <select
              value={contentType}
              onChange={e => setContentType(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '13px' }}
            >
              <option value="Video largo">Video largo</option>
              <option value="Short">Short</option>
            </select>
          </div>

          {/* Línea de Contenido */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Línea de Contenido</span>
            <select
              value={contentLine}
              onChange={e => setContentLine(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '13px' }}
            >
              <option value="Vlogs">Vlogs</option>
              <option value="n8n + Supabase">n8n + Supabase</option>
              <option value="Video Coding Restaurantes">Video Coding Restaurantes</option>
              <option value="Mente & Enfoque">Mente & Enfoque</option>
            </select>
          </div>

          {/* Miniatura Lista (Checkbox) */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Miniatura Lista</span>
            <input
              type="checkbox"
              checked={thumbnailReady}
              onChange={e => setThumbnailReady(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
            />
          </div>

          {/* Fechas de Grabación y Publicación */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiCalendar size={13} /> Grabación
            </span>
            <input
              type="date"
              value={recordingDate}
              onChange={e => setRecordingDate(e.target.value)}
              style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiCalendar size={13} /> Publicación
            </span>
            <input
              type="date"
              value={publishDate}
              onChange={e => setPublishDate(e.target.value)}
              style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '13px' }}
            />
          </div>

          {/* URL del Video */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiLink size={13} /> URL Video
            </span>
            <input
              type="text"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="Enlace de YouTube o Drive..."
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '13px' }}
            />
          </div>

          {/* Duración Estimada */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiClock size={13} /> Duración Est.
            </span>
            <input
              type="text"
              value={estimatedDuration}
              onChange={e => setEstimatedDuration(e.target.value)}
              placeholder="Ej: 12:30"
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '13px' }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

          {/* Objetivo del Video */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Objetivo del Video
            </label>
            <textarea
              value={objective}
              onChange={e => setObjective(e.target.value)}
              placeholder="¿Qué quieres lograr con este video? Romper miedos, enseñar algo concreto..."
              rows={3}
              style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none', resize: 'vertical' }}
            />
          </div>

          {/* Opciones de Título */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Opciones de Título
            </label>
            <textarea
              value={titleOptions}
              onChange={e => setTitleOptions(e.target.value)}
              placeholder="1. Curiosidad: ...&#10;2. Beneficio Directo: ...&#10;3. SEO: ..."
              rows={4}
              style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none', resize: 'vertical' }}
            />
          </div>

          {/* Guion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Guion / Estructura del Contenido
            </label>
            <textarea
              value={script}
              onChange={e => setScript(e.target.value)}
              placeholder="· Intro: ...&#10;· Punto 1: ...&#10;· Punto 2: ...&#10;· CTA: ..."
              rows={8}
              style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none', resize: 'vertical' }}
            />
          </div>

          {/* Idea de Miniatura */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Idea de Miniatura
            </label>
            <textarea
              value={thumbnailIdea}
              onChange={e => setThumbnailIdea(e.target.value)}
              placeholder="Descripción visual de la miniatura, textos, colores..."
              rows={3}
              style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none', resize: 'vertical' }}
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '12px',
          backgroundColor: 'rgba(255,255,255,0.4)',
          backdropFilter: 'blur(8px)'
        }}>
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
            Cerrar sin guardar
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
            <span>{loading ? 'Guardando...' : 'Guardar en Notion'}</span>
          </button>
        </div>

      </div>

      {/* iOS Confirm Delete Modal */}
      <IosAlertModal
        isOpen={isConfirmOpen}
        title="¿Eliminar Contenido?"
        message="Esta acción no se puede deshacer. ¿Seguro que quieres borrar este video?"
        type="confirm"
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>,
    document.body
  );
}
