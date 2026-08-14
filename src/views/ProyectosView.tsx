import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import TamagotchiHeader from '../components/TamagotchiHeader';
import TamagotchiMissionCard from '../components/TamagotchiMissionCard';
import TamagotchiStatsBars, { type TamagotchiStats } from '../components/TamagotchiStatsBars';
import DailyQuests, { type Quest } from '../components/DailyQuests';
import TamagotchiFinancesWidget from '../components/TamagotchiFinancesWidget';
import ProjectList from '../components/ProjectList';

const INITIAL_QUESTS: Quest[] = [
  {
    id: 'q1',
    text: 'Grabar ráfaga de contenido (3 TikToks / Reels gastronómicos)',
    completed: false,
    category: 'energy'
  },
  {
    id: 'q2',
    text: 'Probar 1 flujo crítico del SaaS / Chatbot (Reservas o Pedidos)',
    completed: false,
    category: 'health'
  },
  {
    id: 'q3',
    text: 'Enviar 3 propuestas de "Prueba 30 días a prueba de balas" a locales',
    completed: false,
    category: 'nutrition'
  },
  {
    id: 'q4',
    text: '30 min de orden / limpieza y caminata al aire libre',
    completed: false,
    category: 'balance'
  }
];

export default function ProyectosView() {
  const { blocks, projects, survivalDays, incomes } = useData();

  // Quests State
  const [quests, setQuests] = useState<Quest[]>(() => {
    const cached = localStorage.getItem('korat_tamagotchi_quests');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { /* fallback */ }
    }
    return INITIAL_QUESTS;
  });

  // Manual Stat Offsets (if user explicitly presses +/- buttons)
  const [manualOffsets, setManualOffsets] = useState<Record<keyof TamagotchiStats, number>>(() => {
    const cached = localStorage.getItem('korat_tamagotchi_manual_offsets');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { /* fallback */ }
    }
    return { energy: 0, nutrition: 0, health: 0, impact: 0, balance: 0 };
  });

  useEffect(() => {
    localStorage.setItem('korat_tamagotchi_quests', JSON.stringify(quests));
  }, [quests]);

  useEffect(() => {
    localStorage.setItem('korat_tamagotchi_manual_offsets', JSON.stringify(manualOffsets));
  }, [manualOffsets]);

  // AUTOMATIC STATS COMPUTATION FROM REAL SYSTEM DATA
  const computeAutomaticStats = (): TamagotchiStats => {
    // 1. ⚡ Energía: Quests de energía completadas + bloques de hoy completados
    const energyQuests = quests.filter(q => q.category === 'energy');
    const energyQuestPercent = energyQuests.length > 0
      ? (energyQuests.filter(q => q.completed).length / energyQuests.length) * 100
      : 50;

    // 2. 🍖 Nutrición: Días de colchón / Runway (hasta 90 días = 100%) + Incomes pendientes cobrados
    const runwayPercent = Math.min(100, Math.round((survivalDays / 90) * 100));
    const collectedIncomes = incomes ? incomes.filter(i => i.status === 'collected').length : 0;
    const incomePercent = incomes && incomes.length > 0 ? (collectedIncomes / incomes.length) * 100 : 50;
    const nutritionBase = Math.round((runwayPercent * 0.7) + (incomePercent * 0.3));

    // 3. 🛠️ Salud del Sistema: Porcentaje de hitos (milestones) completados en todos los proyectos
    let totalMilestones = 0;
    let completedMilestones = 0;
    projects.forEach(p => {
      if (p.milestones && p.milestones.length > 0) {
        totalMilestones += p.milestones.length;
        completedMilestones += p.milestones.filter(m => m.is_completed).length;
      }
    });
    const systemHealthBase = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 75;

    // 4. ❤️ Impacto: Proyectos activos creados para la categoría Gastronomía / Monetización + Quests de nutrición
    const activeProjectsCount = projects.length;
    const impactBase = Math.min(100, Math.max(40, activeProjectsCount * 25));

    // 5. 🧘 Balance del Creador: Bloques de tiempo completados en la vista Hoy + Quests de balance
    let todayBlocksPercent = 60;
    if (blocks && blocks.length > 0) {
      const completedBlocks = blocks.filter(b => b.is_completed).length;
      todayBlocksPercent = Math.round((completedBlocks / blocks.length) * 100);
    }
    const balanceQuests = quests.filter(q => q.category === 'balance');
    const balanceQuestPercent = balanceQuests.length > 0
      ? (balanceQuests.filter(q => q.completed).length / balanceQuests.length) * 100
      : 50;
    const balanceBase = Math.round((todayBlocksPercent * 0.6) + (balanceQuestPercent * 0.4));

    return {
      energy: Math.min(100, Math.max(0, Math.round((energyQuestPercent * 0.6) + 30 + manualOffsets.energy))),
      nutrition: Math.min(100, Math.max(0, Math.round(nutritionBase + manualOffsets.nutrition))),
      health: Math.min(100, Math.max(0, Math.round(systemHealthBase + manualOffsets.health))),
      impact: Math.min(100, Math.max(0, Math.round(impactBase + manualOffsets.impact))),
      balance: Math.min(100, Math.max(0, Math.round(balanceBase + manualOffsets.balance)))
    };
  };

  const stats = computeAutomaticStats();

  // Health Score & Mood
  const healthScore = (stats.energy * 0.25) + (stats.nutrition * 0.25) + (stats.health * 0.20) + (stats.impact * 0.15) + (stats.balance * 0.15);

  const getMood = (): 'on_fire' | 'healthy' | 'hungry' | 'sleeping' => {
    if (healthScore >= 75) return 'on_fire';
    if (healthScore >= 55) return 'healthy';
    if (healthScore >= 35) return 'hungry';
    return 'sleeping';
  };

  const handleUpdateStat = (key: keyof TamagotchiStats, delta: number) => {
    setManualOffsets(prev => ({
      ...prev,
      [key]: prev[key] + delta
    }));
  };

  const handleToggleQuest = (id: string) => {
    setQuests(prev => prev.map(q => q.id === id ? { ...q, completed: !q.completed } : q));
  };

  const handleAddQuest = (text: string, category: Quest['category']) => {
    const newQ: Quest = {
      id: 'q_' + Date.now(),
      text,
      completed: false,
      category
    };
    setQuests(prev => [...prev, newQ]);
  };

  const handleDeleteQuest = (id: string) => {
    setQuests(prev => prev.filter(q => q.id !== id));
  };

  return (
    <div className="page-enter" style={{
      paddingBottom: '120px',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
      paddingLeft: '16px',
      paddingRight: '16px',
      paddingTop: '16px'
    }}>
      {/* 1. Header Tamagotchi Status */}
      <TamagotchiHeader
        healthScore={healthScore}
        overallMood={getMood()}
        agencyName="GastroGrowth OS"
      />

      {/* 2. Mission Card (Esencia Real - Editable) */}
      <TamagotchiMissionCard />

      {/* 3. Barras de Vida (5 Vital Stats - Auto Calculadas + Control Manual) */}
      <TamagotchiStatsBars
        stats={stats}
        onUpdateStat={handleUpdateStat}
      />

      {/* 4. Misiones Diarias (Daily Quests) */}
      <DailyQuests
        quests={quests}
        onToggleQuest={handleToggleQuest}
        onAddQuest={handleAddQuest}
        onDeleteQuest={handleDeleteQuest}
      />

      {/* 5. Micro-Finanzas & Runway Widget */}
      <TamagotchiFinancesWidget />

      {/* 6. Líneas de Crecimiento (Proyectos & MVPs) */}
      <div style={{ marginTop: '8px' }}>
        <ProjectList />
      </div>
    </div>
  );
}
