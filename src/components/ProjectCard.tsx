import { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiTrendingUp, FiStar, FiCalendar, FiTarget } from 'react-icons/fi';
import { supabase } from '../lib/supabase';

export interface Milestone {
  id: string;
  title: string;
  is_completed: boolean;
}

export interface Project {
  id: string;
  title: string;
  category: string;
  target_income_usd: number | null;
  mvp_definition?: string | null;
  days_limit?: number | null;
  milestones: Milestone[];
}

export default function ProjectCard({ project, onUpdate }: { project: Project, onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [activeFocusId, setActiveFocusId] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('korat_active_focus');
      if (stored) {
        return JSON.parse(stored).milestoneId;
      }
    } catch (_) {}
    return null;
  });

  useEffect(() => {
    const handleFocusUpdate = () => {
      try {
        const stored = localStorage.getItem('korat_active_focus');
        if (stored) {
          setActiveFocusId(JSON.parse(stored).milestoneId);
        } else {
          setActiveFocusId(null);
        }
      } catch (_) {}
    };
    window.addEventListener('korat_focus_changed', handleFocusUpdate);
    return () => window.removeEventListener('korat_focus_changed', handleFocusUpdate);
  }, []);

  const handleSetAsActiveFocus = (milestone: Milestone) => {
    const focusData = {
      milestoneId: milestone.id,
      milestoneTitle: milestone.title,
      projectId: project.id,
      projectTitle: project.title,
      category: project.category
    };
    localStorage.setItem('korat_active_focus', JSON.stringify(focusData));
    window.dispatchEvent(new Event('korat_focus_changed'));
  };

  const handleUnsetFocus = () => {
    localStorage.removeItem('korat_active_focus');
    window.dispatchEvent(new Event('korat_focus_changed'));
  };
  
  // Edit form states
  const [editTitle, setEditTitle] = useState(project.title);
  const [editCategory, setEditCategory] = useState(project.category);
  const [editTargetIncome, setEditTargetIncome] = useState(project.target_income_usd?.toString() || '');
  const [editMvpDefinition, setEditMvpDefinition] = useState(project.mvp_definition || '');
  const [editDaysLimit, setEditDaysLimit] = useState(project.days_limit?.toString() || '');
  
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  
  const totalMilestones = project.milestones.length;
  const completedMilestones = project.milestones.filter(m => m.is_completed).length;
  const progressPercentage = totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100);

  const handleSendToDailyRoutine = async (milestone: Milestone) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch daily blocks for today
      const { data: todayBlocks } = await supabase
        .from('daily_blocks')
        .select('id, title')
        .eq('date', today);

      if (!todayBlocks || todayBlocks.length === 0) {
        alert('Aún no tienes bloques de rutina generados para el día de hoy. Entra primero a la pestaña "Hoy" para crearlos.');
        return;
      }

      // Search for the daily block that matches this project
      const blockKeyword = project.title.toLowerCase().includes('lashista') ? 'lashista' : 'suna';
      const targetBlock = todayBlocks.find(b => b.title.toLowerCase().includes(blockKeyword));

      if (!targetBlock) {
        alert(`No encontré un bloque de trabajo para "${project.title.slice(0, 15)}" en tu rutina de hoy para poder vincular la tarea.`);
        return;
      }

      // Check if subtask already exists for that block
      const { data: existing } = await supabase
        .from('subtasks')
        .select('*')
        .eq('daily_block_id', targetBlock.id)
        .eq('title', milestone.title);

      if (existing && existing.length > 0) {
        alert('Esta tarea ya ha sido vinculada a tu rutina de hoy.');
        return;
      }

      // Add to subtasks
      const { error } = await supabase
        .from('subtasks')
        .insert({
          daily_block_id: targetBlock.id,
          title: milestone.title,
          is_completed: false,
          project_milestone_id: milestone.id
        });

      if (error) throw error;
      alert(`🚀 Hito vinculado a tu rutina. ¡Aparecerá en el bloque "${targetBlock.title}"!`);
    } catch (e) {
      console.error(e);
      alert('Error al vincular el hito con tu rutina.');
    }
  };

  const handleToggleMilestone = async (milestoneId: string, currentStatus: boolean) => {
    await supabase.from('project_milestones').update({ is_completed: !currentStatus }).eq('id', milestoneId);
    onUpdate();
  };

  const handleAddMilestone = async () => {
    if (!newMilestoneTitle.trim()) return;
    await supabase.from('project_milestones').insert({
      project_id: project.id,
      title: newMilestoneTitle.trim(),
      is_completed: false
    });
    setNewMilestoneTitle('');
    onUpdate();
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    await supabase.from('project_milestones').delete().eq('id', milestoneId);
    onUpdate();
  };

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitle.trim() || !editCategory.trim()) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: editTitle.trim(),
          category: editCategory.trim(),
          target_income_usd: parseFloat(editTargetIncome) || null,
          mvp_definition: editMvpDefinition.trim() || null,
          days_limit: parseInt(editDaysLimit) || null
        })
        .eq('id', project.id);

      if (error) throw error;
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar la línea de crecimiento');
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar esta línea de crecimiento por completo junto con sus hitos?')) return;

    try {
      const { error } = await supabase.from('projects').delete().eq('id', project.id);
      if (error) throw error;
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar la línea de crecimiento');
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-app)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
      border: '1.5px solid var(--border-color)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.01)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      position: 'relative'
    }}>
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} onClick={e => e.stopPropagation()}>
          <h3 style={{ fontSize: '15px', fontFamily: 'var(--font-serif)', margin: 0, fontWeight: 600 }}>Editar Línea de Crecimiento</h3>
          
          <input
            type="text"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            placeholder="Título del proyecto"
            style={{ padding: '10px 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none', fontFamily: 'var(--font-sans)' }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={editCategory}
              onChange={e => setEditCategory(e.target.value)}
              placeholder="Categoría"
              style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none', fontFamily: 'var(--font-sans)' }}
            />
            <input
              type="number"
              value={editTargetIncome}
              onChange={e => setEditTargetIncome(e.target.value)}
              placeholder="Meta $/mes"
              style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none', fontFamily: 'var(--font-sans)' }}
            />
          </div>

          <textarea
            value={editMvpDefinition}
            onChange={e => setEditMvpDefinition(e.target.value)}
            placeholder="Definición del MVP en palabras sencillas..."
            rows={3}
            style={{ padding: '10px 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}
          />

          <input
            type="number"
            value={editDaysLimit}
            onChange={e => setEditDaysLimit(e.target.value)}
            placeholder="Días de límite para el lanzamiento"
            style={{ padding: '10px 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none', fontFamily: 'var(--font-sans)' }}
          />

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              onClick={handleDeleteProject}
              style={{
                marginRight: 'auto', background: 'none', border: 'none', color: 'var(--accent-color)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600
              }}
            >
              <FiTrash2 size={13} />
              <span>Eliminar Proyecto</span>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
              style={{
                background: 'none', border: '1.5px solid var(--border-color)', borderRadius: '8px',
                padding: '6px 12px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <FiX size={13} />
              <span>Cancelar</span>
            </button>

            <button
              onClick={handleSaveEdit}
              style={{
                backgroundColor: 'var(--text-main)', color: 'var(--bg-app)', border: 'none', borderRadius: '8px',
                padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <FiCheck size={13} />
              <span>Guardar</span>
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setExpanded(!expanded)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <span style={{ fontSize: '10px', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              {project.category}
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-serif)', margin: 0, lineHeight: 1.3 }}>
              {project.title}
            </h3>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {project.target_income_usd !== null && project.target_income_usd > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', background: 'rgba(25, 25, 25, 0.04)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                  <FiTarget size={12} />
                  <span>Meta: S/. {(project.target_income_usd * 3.75).toFixed(0)}/mes</span>
                </div>
              )}
              {project.days_limit != null && project.days_limit > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', background: 'rgba(204, 101, 67, 0.06)', border: '1px solid rgba(204, 101, 67, 0.15)', color: 'var(--accent-color)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                  <FiCalendar size={12} />
                  <span>Lanzamiento: {project.days_limit} días</span>
                </div>
              )}
            </div>

            {project.mvp_definition && (
              <div style={{
                backgroundColor: 'rgba(241, 236, 228, 0.4)',
                borderLeft: '2.5px solid var(--accent-color)',
                padding: '10px 12px',
                borderRadius: '0 8px 8px 0',
                marginTop: '10px'
              }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', margin: 0, lineHeight: 1.45 }}>
                  <strong>MVP (Lanzamiento Mínimo):</strong> {project.mvp_definition}
                </p>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setIsEditing(true)}
              style={{ background: 'none', border: '1.5px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
              title="Editar proyecto"
            >
              <FiEdit2 size={13} />
            </button>
            <div 
              onClick={() => setExpanded(!expanded)} 
              style={{ border: '1.5px solid var(--border-color)', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', transition: 'all 0.2s ease' }}
            >
              {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </div>
          </div>
        </div>
      )}

      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
        <div style={{ flex: 1, height: '5px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${progressPercentage}%`, 
            height: '100%', 
            background: progressPercentage === 100
              ? 'linear-gradient(90deg, #27AE60 0%, #2ECC71 100%)'
              : progressPercentage >= 50
                ? 'linear-gradient(90deg, var(--accent-color) 0%, #D4963A 100%)'
                : 'linear-gradient(90deg, var(--accent-color) 0%, var(--accent-light) 100%)',
            borderRadius: '3px',
            transition: 'width 0.4s ease'
          }} />
        </div>
        <span style={{ fontSize: '11px', color: progressPercentage === 100 ? '#27AE60' : 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontWeight: 700, minWidth: '32px', textAlign: 'right' }}>
          {completedMilestones}/{totalMilestones}
        </span>
      </div>

      {expanded && !isEditing && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ borderTop: '1.5px solid var(--border-color)' }} />
          
          {project.milestones.map((m, idx) => {
            const isFocus = activeFocusId === m.id;
            return (
              <div 
                key={m.id} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0px',
                  borderRadius: '12px',
                  backgroundColor: m.is_completed
                    ? 'rgba(39, 174, 96, 0.04)'
                    : isFocus
                      ? 'rgba(204, 101, 67, 0.05)'
                      : idx % 2 === 0 ? 'rgba(25, 25, 25, 0.02)' : 'transparent',
                  border: m.is_completed
                    ? '1px solid rgba(39, 174, 96, 0.18)'
                    : isFocus
                      ? '1.5px solid rgba(204, 101, 67, 0.3)'
                      : '1px solid var(--border-color)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Milestone Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px' }}>
                  <button 
                    onClick={() => handleToggleMilestone(m.id, m.is_completed)}
                    style={{
                      background: m.is_completed ? 'rgba(39, 174, 96, 0.12)' : 'transparent',
                      border: m.is_completed ? '1.5px solid rgba(39, 174, 96, 0.35)' : '1.5px solid var(--border-color)',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      width: '22px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: m.is_completed ? '#27AE60' : 'var(--border-color)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {m.is_completed ? <FiCheck size={13} strokeWidth={3} /> : null}
                  </button>
                  <span style={{ 
                    fontSize: '13px', 
                    color: m.is_completed ? 'var(--text-muted)' : 'var(--text-main)',
                    textDecoration: m.is_completed ? 'line-through' : 'none',
                    fontFamily: 'var(--font-sans)',
                    lineHeight: 1.4,
                    fontWeight: isFocus ? 600 : 400,
                    flex: 1,
                    opacity: m.is_completed ? 0.6 : 1
                  }}>
                    {m.title}
                  </span>
                  {isFocus && (
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--accent-color)',
                      background: 'rgba(204, 101, 67, 0.1)',
                      padding: '2px 7px',
                      borderRadius: '20px',
                      letterSpacing: '0.5px',
                      flexShrink: 0
                    }}>FOCO</span>
                  )}
                </div>

                {/* Action Row */}
                {!m.is_completed && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    padding: '7px 12px',
                    borderTop: '1px solid rgba(25, 25, 25, 0.04)',
                    backgroundColor: 'rgba(25, 25, 25, 0.02)'
                  }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => isFocus ? handleUnsetFocus() : handleSetAsActiveFocus(m)}
                        style={{
                          background: isFocus ? 'var(--accent-color)' : 'transparent',
                          border: '1.5px solid',
                          borderColor: isFocus ? 'var(--accent-color)' : 'var(--border-color)',
                          borderRadius: '20px',
                          padding: '3px 10px',
                          fontSize: '10px',
                          fontFamily: 'var(--font-sans)',
                          color: isFocus ? 'white' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 600,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <FiStar size={10} fill={isFocus ? 'white' : 'none'} />
                        <span>{isFocus ? 'Activo' : 'Foco'}</span>
                      </button>

                      <button
                        onClick={() => handleSendToDailyRoutine(m)}
                        style={{
                          background: 'transparent',
                          border: '1.5px solid var(--border-color)',
                          borderRadius: '20px',
                          padding: '3px 10px',
                          fontSize: '10px',
                          fontFamily: 'var(--font-sans)',
                          color: 'var(--accent-color)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 600,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <FiTrendingUp size={10} />
                        <span>Hoy</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteMilestone(m.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--text-muted)',
                        opacity: 0.5,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s ease'
                      }}
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <input 
              type="text"
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              placeholder="Añadir hito..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-color)',
                backgroundColor: 'transparent',
                fontSize: '13px',
                color: 'var(--text-main)',
                outline: 'none',
                fontFamily: 'var(--font-sans)'
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
            />
            <button 
              onClick={handleAddMilestone}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--text-main)',
                color: 'var(--bg-app)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease'
              }}
            >
              <FiPlus size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
