import ProjectList from '../components/ProjectList';

export default function ProyectosView() {
  return (
    <div style={{ paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ padding: '24px 20px 0' }}>
        <h1 style={{ 
          fontSize: '32px', 
          margin: 0, 
          color: 'var(--text-main)',
          fontFamily: 'var(--font-serif)',
          fontWeight: 'normal',
          letterSpacing: '-0.5px'
        }}>
          Mis Proyectos
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px', fontStyle: 'italic', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
          Construyendo mis Productos Mínimos Viables (MVP): el camino más rápido para lanzar mis ideas al mundo sin rodeos técnicos ni complicaciones.
        </p>
      </div>

      <ProjectList />
    </div>
  );
}
