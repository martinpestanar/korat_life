import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { SaaSProject, GamificationStats } from '../types/saas';

interface SaaSContextType {
  currentSlug: string;
  currentProject: SaaSProject | null;
  allProjects: SaaSProject[];
  founderStats: GamificationStats | null;
  setCurrentSlug: (slug: string) => void;
  toggleSaaS: () => void;
  loading: boolean;
  refreshSaaSData: () => Promise<void>;
}

const DEFAULT_PROJECTS: SaaSProject[] = [
  {
    id: '75d54348-1076-46d7-85f0-44a5c7491af8',
    slug: 'nilah-ia',
    name: 'Nilah IA',
    niche: 'Salones de Belleza',
    icon: '💅',
    accent_color: '#4F46E5',
    description: 'SaaS de gestión y reservas con IA para salones de belleza.',
    mrr_target: 2000,
    current_mrr: 0
  },
  {
    id: '2cd13fbb-fa1d-4c79-8d0d-219e18bfda55',
    slug: 'suna-gourmet',
    name: 'Suna Gourmet / Vegi',
    niche: 'Restaurantes',
    icon: '🍽️',
    accent_color: '#10B981',
    description: 'SaaS operativo y menús dinámicos para restaurantes.',
    mrr_target: 2000,
    current_mrr: 0
  }
];

const SaaSContext = createContext<SaaSContextType | undefined>(undefined);

export const SaaSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSlug, setCurrentSlugState] = useState<string>(() => {
    return localStorage.getItem('korat_active_saas_slug') || 'nilah-ia';
  });
  const [allProjects, setAllProjects] = useState<SaaSProject[]>(DEFAULT_PROJECTS);
  const [founderStats, setFounderStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  const setCurrentSlug = (slug: string) => {
    setCurrentSlugState(slug);
    localStorage.setItem('korat_active_saas_slug', slug);
  };

  const toggleSaaS = () => {
    const nextSlug = currentSlug === 'nilah-ia' ? 'suna-gourmet' : 'nilah-ia';
    setCurrentSlug(nextSlug);
  };

  const refreshSaaSData = useCallback(async () => {
    try {
      // 1. Fetch SaaS Projects
      const { data: projectsData, error: projErr } = await supabase
        .from('saas_projects')
        .select('*')
        .order('created_at', { ascending: true });

      if (!projErr && projectsData && projectsData.length > 0) {
        setAllProjects(projectsData as SaaSProject[]);
      }

      // 2. Fetch Founder Gamification Stats
      const { data: statsData, error: statsErr } = await supabase
        .from('gamification_stats')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (!statsErr && statsData) {
        setFounderStats(statsData as GamificationStats);
      }
    } catch (err) {
      console.warn('Usando configuración local de proyectos SaaS:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSaaSData();
  }, [refreshSaaSData]);

  const currentProject = allProjects.find(p => p.slug === currentSlug) || allProjects[0] || null;

  return (
    <SaaSContext.Provider
      value={{
        currentSlug,
        currentProject,
        allProjects,
        founderStats,
        setCurrentSlug,
        toggleSaaS,
        loading,
        refreshSaaSData
      }}
    >
      {children}
    </SaaSContext.Provider>
  );
};

export function useSaaS(): SaaSContextType {
  const context = useContext(SaaSContext);
  if (!context) {
    throw new Error('useSaaS debe usarse dentro de un SaaSProvider');
  }
  return context;
}
