import React, { useState, useEffect } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import type { TimeBlock } from './TimeBlockCard';

interface Pillar {
  id: string;
  name: string;
  label: string;
}

interface BlockFormModalProps {
  block?: TimeBlock | null; // If provided, we are editing
  onClose: () => void;
  onSave: () => void;
}

export default function BlockFormModal({ block, onClose, onSave }: BlockFormModalProps) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [pillarId, setPillarId] = useState('');
  const [period, setPeriod] = useState<'morning' | 'afternoon' | 'night'>('morning');
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPillars = async () => {
      const { data } = await supabase.from('pillars').select('*');
      if (data) setPillars(data);
    };
    fetchPillars();
  }, []);

  useEffect(() => {
    if (block) {
      setTitle(block.title);
      setStartTime(block.start_time.slice(0, 5));
      setEndTime(block.end_time.slice(0, 5));
      setNotes(block.notes || '');
      setPillarId(block.pillar_id || '');
      if (block.period === 'morning' || block.period === 'afternoon' || block.period === 'night') {
        setPeriod(block.period);
      } else {
        setPeriod('morning');
      }
    } else {
      setTitle('');
      setStartTime('08:00');
      setEndTime('09:00');
      setNotes('');
      setPillarId('');
      setPeriod('morning');
    }
  }, [block]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) {
      alert('Por favor rellena el Título y Horario.');
      return;
    }

    setLoading(true);

    // Auto-calculate period from start_time
    let calculatedPeriod = period;
    const hour = parseInt(startTime.split(':')[0]);
    if (hour < 12) calculatedPeriod = 'morning';
    else if (hour < 19) calculatedPeriod = 'afternoon';
    else calculatedPeriod = 'night';

    try {
      if (block) {
        // UPDATE daily block directly
        const { error } = await supabase
          .from('daily_blocks')
          .update({
            title,
            start_time: startTime + ':00',
            end_time: endTime + ':00',
            notes: notes || null,
            pillar_id: pillarId || null,
            period: calculatedPeriod
          })
          .eq('id', block.id);

        if (error) throw error;
      } else {
        // INSERT daily block directly for today
        const today = new Date().getFullYear() + '-' + 
                      String(new Date().getMonth() + 1).padStart(2, '0') + '-' + 
                      String(new Date().getDate()).padStart(2, '0');

        const { error } = await supabase
          .from('daily_blocks')
          .insert({
            date: today,
            title,
            start_time: startTime + ':00',
            end_time: endTime + ':00',
            notes: notes || null,
            pillar_id: pillarId || null,
            period: calculatedPeriod,
            is_completed: false
          });

        if (error) throw error;
      }
      onSave();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al guardar el bloque.');
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
      zIndex: 1000,
      padding: '20px'
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '450px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
          animation: 'fadeIn 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '20px', fontFamily: 'var(--font-serif)', margin: 0, color: 'var(--text-main)' }}>
            {block ? 'Editar Bloque' : 'Nuevo Bloque Diario'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
          >
            <FiX size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Título del Bloque *
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Planificación Estratégica"
            style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Hora Inicio *
            </label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
              required
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Hora Fin *
            </label>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Notas / Directiva
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notas, ritual o enfoque para este bloque..."
            rows={3}
            style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', resize: 'none', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Pilar de Vida
          </label>
          <select
            value={pillarId}
            onChange={e => setPillarId(e.target.value)}
            style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none' }}
          >
            <option value="">Ninguno</option>
            {pillars.map(p => (
              <option key={p.id} value={p.id}>
                Pilar {p.label.charAt(0) + p.label.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '12px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: 'var(--text-main)',
              color: 'var(--bg-app)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '14px',
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
      </form>
    </div>
  );
}
