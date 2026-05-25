import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLock, FiPlus, FiTrash2, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { supabase } from '../lib/supabase';

interface Pillar {
  id: string;
  name: string;
  label: string;
}

interface BlockTemplate {
  id: string;
  day_type: 'weekday' | 'saturday' | 'sunday';
  period: 'morning' | 'afternoon' | 'night';
  start_time: string;
  end_time: string;
  title: string;
  notes?: string;
  pillar_id?: string;
  lock_until?: string;
  pillars?: Pillar;
}

export default function DesignModeView() {
  const navigate = useNavigate();
  const [dayTypeFilter, setDayTypeFilter] = useState<'weekday' | 'saturday' | 'sunday'>('weekday');
  const [templates, setTemplates] = useState<BlockTemplate[]>([]);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [_loading, setLoading] = useState(false);
  
  // Form State
  const [editingTemplate, setEditingTemplate] = useState<BlockTemplate | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [pillarId, setPillarId] = useState('');
  const [period, setPeriod] = useState<'morning' | 'afternoon' | 'night'>('morning');

  // Lock status
  const [lockDaysLeft, setLockDaysLeft] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pillars
      const { data: pillarsData } = await supabase.from('pillars').select('*');
      if (pillarsData) setPillars(pillarsData);

      // Fetch templates
      const { data: templatesData } = await supabase
        .from('block_templates')
        .select('*, pillars:pillars(id, name, label)')
        .order('start_time');
      
      if (templatesData) {
        setTemplates(templatesData);
        
        // Calculate lock status for weekdays
        const weekdayTemplates = templatesData.filter(t => t.day_type === 'weekday');
        let maxLockDate: Date | null = null;
        weekdayTemplates.forEach(t => {
          if (t.lock_until) {
            const d = new Date(t.lock_until);
            if (!maxLockDate || d > maxLockDate) {
              maxLockDate = d;
            }
          }
        });

        if (maxLockDate && (maxLockDate as Date) > new Date()) {
          const diffTime = (maxLockDate as Date).getTime() - new Date().getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setLockDaysLeft(diffDays);
        } else {
          setLockDaysLeft(null);
        }
      }
    } catch (err) {
      console.error('Error fetching design data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getFilteredTemplates = () => {
    return templates.filter(t => t.day_type === dayTypeFilter);
  };

  const resetForm = () => {
    setTitle('');
    setStartTime('08:00');
    setEndTime('09:00');
    setNotes('');
    setPillarId('');
    setPeriod('morning');
    setIsAdding(false);
    setEditingTemplate(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce validations for weekdays
    if (dayTypeFilter === 'weekday') {
      if (!title.trim() || !startTime || !endTime || !notes.trim() || !pillarId) {
        alert('Para los bloques de Lunes a Viernes, es obligatorio rellenar: Título, Horario, Notas y el Pilar de Vida.');
        return;
      }
    } else {
      if (!title.trim() || !startTime || !endTime) {
        alert('Por favor rellena el Título y Horario.');
        return;
      }
    }

    // Auto-calculate period from start_time if not explicitly chosen or matching typical hours
    let calculatedPeriod = period;
    const hour = parseInt(startTime.split(':')[0]);
    if (hour < 12) calculatedPeriod = 'morning';
    else if (hour < 19) calculatedPeriod = 'afternoon';
    else calculatedPeriod = 'night';

    try {
      if (editingTemplate) {
        // UPDATE
        const { error } = await supabase
          .from('block_templates')
          .update({
            title,
            start_time: startTime + ':00',
            end_time: endTime + ':00',
            notes,
            pillar_id: pillarId || null,
            period: calculatedPeriod
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        // INSERT
        const { error } = await supabase
          .from('block_templates')
          .insert({
            day_type: dayTypeFilter,
            title,
            start_time: startTime + ':00',
            end_time: endTime + ':00',
            notes,
            pillar_id: pillarId || null,
            period: calculatedPeriod
          });

        if (error) throw error;
      }
      resetForm();
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al guardar la plantilla.');
    }
  };

  const handleEdit = (template: BlockTemplate) => {
    setEditingTemplate(template);
    setTitle(template.title);
    setStartTime(template.start_time.slice(0, 5));
    setEndTime(template.end_time.slice(0, 5));
    setNotes(template.notes || '');
    setPillarId(template.pillar_id || '');
    setPeriod(template.period);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla de bloque?')) return;
    try {
      const { error } = await supabase.from('block_templates').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la plantilla.');
    }
  };

  const handleLockWeekdays = async () => {
    if (!confirm('¿Estás seguro de Activar el Compromiso de 60 Días? Esta acción blindará tu rutina de Lunes a Viernes y no podrás editarla, borrarla ni añadir nuevos bloques por los próximos 60 días.')) return;
    try {
      const lockUntil = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('block_templates')
        .update({ lock_until: lockUntil })
        .eq('day_type', 'weekday');

      if (error) throw error;
      alert('🔒 Compromiso activado. ¡Tu rutina ha sido blindada con éxito!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al activar el compromiso.');
    }
  };

  const isLocked = dayTypeFilter === 'weekday' && lockDaysLeft !== null;

  return (
    <div style={{ padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}
        >
          <FiArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '24px', fontFamily: 'var(--font-serif)', margin: 0 }}>Modo Diseño</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        {(['weekday', 'saturday', 'sunday'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setDayTypeFilter(tab); resetForm(); }}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              padding: '12px 6px',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              fontWeight: dayTypeFilter === tab ? 600 : 400,
              color: dayTypeFilter === tab ? 'var(--text-main)' : 'var(--text-muted)',
              borderBottom: dayTypeFilter === tab ? '2px solid var(--text-main)' : 'none',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            {tab === 'weekday' ? 'Lunes a Viernes' : tab === 'saturday' ? 'Sábado' : 'Domingo'}
          </button>
        ))}
      </div>

      {/* Lock Banner */}
      {isLocked && (
        <div style={{
          backgroundColor: '#F7EFE9',
          border: '1px solid #E5D5C5',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <FiLock size={20} color="var(--accent-color)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'var(--text-main)', fontWeight: 500 }}>
              Rutina blindada.
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--text-muted)' }}>
              Faltan {lockDaysLeft} días para poder editar tus bloques de Lunes a Viernes.
            </p>
          </div>
        </div>
      )}

      {/* Main List */}
      {!isAdding && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {getFilteredTemplates().map(t => (
            <div
              key={t.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {t.start_time.slice(0, 5)} - {t.end_time.slice(0, 5)}
                  {t.pillars && (
                    <span style={{ fontStyle: 'italic', marginLeft: '8px', color: 'var(--accent-color)' }}>
                      · {t.pillars.label}
                    </span>
                  )}
                </span>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 500 }}>{t.title}</h3>
                {t.notes && (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                    Nota: {t.notes}
                  </p>
                )}
              </div>

              {!isLocked && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => handleEdit(t)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '6px' }}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}

          {getFilteredTemplates().length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '24px', marginBottom: '8px' }}>✦</p>
              <p style={{ fontSize: '14px' }}>No hay plantillas creadas para este día.</p>
            </div>
          )}

          {/* Add & Lock Buttons */}
          {!isLocked && (
            <button
              onClick={() => setIsAdding(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: 'var(--text-main)',
                color: 'var(--bg-app)',
                border: 'none',
                borderRadius: '8px',
                padding: '14px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '12px'
              }}
            >
              <FiPlus size={16} />
              <span>Añadir Bloque</span>
            </button>
          )}

          {dayTypeFilter === 'weekday' && !isLocked && getFilteredTemplates().length > 0 && (
            <button
              onClick={handleLockWeekdays}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: 'transparent',
                color: 'var(--accent-color)',
                border: '1px solid var(--accent-color)',
                borderRadius: '8px',
                padding: '14px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              <FiLock size={16} />
              <span>Activar Compromiso de 60 Días</span>
            </button>
          )}
        </div>
      )}

      {/* Add / Edit Form */}
      {isAdding && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>
            {editingTemplate ? 'Editar Bloque' : 'Nuevo Bloque'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Título del Bloque {dayTypeFilter === 'weekday' && '*'}
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Planificación Estratégica"
              style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
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
                style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
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
                style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Notas / Directiva {dayTypeFilter === 'weekday' && '*'}
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas, ritual o enfoque para este bloque..."
              rows={3}
              style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', resize: 'vertical' }}
              required={dayTypeFilter === 'weekday'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Pilar de Vida {dayTypeFilter === 'weekday' && '*'}
            </label>
            <select
              value={pillarId}
              onChange={e => setPillarId(e.target.value)}
              style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
              required={dayTypeFilter === 'weekday'}
            >
              <option value="">Selecciona un pilar...</option>
              {pillars.map(p => (
                <option key={p.id} value={p.id}>
                  Pilar {p.label.charAt(0) + p.label.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={resetForm}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
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
              <FiX size={16} />
              <span>Cancelar</span>
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: 'var(--text-main)',
                color: 'var(--bg-app)',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <FiCheck size={16} />
              <span>Guardar</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
