import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ProjectCard, { type Project } from './ProjectCard';
import { FiPlus, FiX } from 'react-icons/fi';

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [targetIncome, setTargetIncome] = useState('');

  const fetchProjects = async () => {
    try {
      const { data: projData } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true });

      const { data: msData } = await supabase
        .from('project_milestones')
        .select('*')
        .order('created_at', { ascending: true });

      if (projData) {
        const combined = projData.map(p => ({
          ...p,
          milestones: msData ? msData.filter(m => m.project_id === p.id) : []
        }));
        setProjects(combined);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category.trim()) return;

    try {
      const { error } = await supabase.from('projects').insert({
        title: title.trim(),
        category: category.trim(),
        target_income_usd: parseFloat(targetIncome) || null
      });

      if (error) throw error;

      // Reset form
      setTitle('');
      setCategory('');
      setTargetIncome('');
      setShowAddForm(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
      alert('Error al agregar el proyecto');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: '14px' }}>Cargando proyectos...</div>;

  return (
    <div style={{ padding: '16px 20px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ 
          fontSize: '20px', 
          color: 'var(--text-main)', 
          fontFamily: 'var(--font-serif)', 
          margin: 0,
          fontWeight: 'normal'
        }}>
          Líneas de Crecimiento
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            background: 'none', border: '1.5px solid var(--border-color)', borderRadius: '24px',
            padding: '6px 16px', fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 600,
            color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <FiPlus size={12} strokeWidth={2.5} />
          <span>Nueva Línea</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddProject} style={{ backgroundColor: 'var(--bg-app)', border: '1.5px solid var(--border-color)', borderRadius: '16px', padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.01)' }}>
          <h3 style={{ fontSize: '15px', fontFamily: 'var(--font-serif)', margin: 0, fontWeight: 600 }}>Nueva Línea de Crecimiento</h3>
          
          <input
            type="text"
            placeholder="Título (ej: Facebook Páginas)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ padding: '10px 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none', fontFamily: 'var(--font-sans)' }}
            required
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Categoría (ej: Monetización)"
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none', fontFamily: 'var(--font-sans)' }}
              required
            />
            <input
              type="number"
              placeholder="Meta USD ($/mes)"
              value={targetIncome}
              onChange={e => setTargetIncome(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none', fontFamily: 'var(--font-sans)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'transparent', border: '1.5px solid var(--border-color)', borderRadius: '8px', padding: '10px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            >
              <FiX size={14} />
              <span>Cancelar</span>
            </button>
            <button
              type="submit"
              style={{ flex: 1, backgroundColor: 'var(--text-main)', color: 'var(--bg-app)', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-sans)' }}
            >
              Crear Línea
            </button>
          </div>
        </form>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} onUpdate={fetchProjects} />
        ))}
        {projects.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px 0', fontStyle: 'italic' }}>
            No hay proyectos activos registrados.
          </p>
        )}
      </div>
    </div>
  );
}
