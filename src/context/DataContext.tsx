import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { type Project } from '../components/ProjectCard';
import { type TimeBlock } from '../components/TimeBlockCard';
import { type MiniChallenge } from '../components/MiniChallengeCard';
import { getLocalDateString } from '../lib/dateUtils';

export interface FinanceData {
  total_balance: number;
  weekly_burn_rate: number;
  bank_balance?: number;
  cash_balance?: number;
}

export interface IncomeItem {
  id: string;
  description: string;
  amount: number;
  status: 'pending' | 'collected';
  due_date: string;
}

export interface RecurringIncomeItem {
  id: string;
  description: string;
  amount: number;
  frequency: 'weekly' | 'monthly';
}

export interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  frequency: 'weekly' | 'monthly';
}

export interface DebtItem {
  id: string;
  description: string;
  total_amount: number;
  due_date: string;
}

export interface MonthlyClose {
  id: string;
  month_year: string;
  total_incomes: number;
  total_expenses: number;
  net_savings: number;
  closed_at: string;
  joy_project?: string | null;
  focus_leak?: string | null;
  habit_to_polish?: string | null;
}

interface DataContextType {
  // Hoy
  blocks: TimeBlock[];
  challenges: MiniChallenge[];
  setBlocks: React.Dispatch<React.SetStateAction<TimeBlock[]>>;
  setChallenges: React.Dispatch<React.SetStateAction<MiniChallenge[]>>;
  loadingHoy: boolean;
  refreshHoy: () => Promise<void>;

  // Projects
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  loadingProjects: boolean;
  refreshProjects: () => Promise<void>;

  // Finances
  finances: FinanceData;
  setFinances: React.Dispatch<React.SetStateAction<FinanceData>>;
  survivalDays: number;
  setSurvivalDays: React.Dispatch<React.SetStateAction<number>>;
  incomes: IncomeItem[];
  setIncomes: React.Dispatch<React.SetStateAction<IncomeItem[]>>;
  recurringIncomes: RecurringIncomeItem[];
  setRecurringIncomes: React.Dispatch<React.SetStateAction<RecurringIncomeItem[]>>;
  expenses: ExpenseItem[];
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseItem[]>>;
  debts: DebtItem[];
  setDebts: React.Dispatch<React.SetStateAction<DebtItem[]>>;
  monthlyCloses: MonthlyClose[];
  setMonthlyCloses: React.Dispatch<React.SetStateAction<MonthlyClose[]>>;
  loadingFinances: boolean;
  refreshFinances: () => Promise<void>;

  // Global loading & Online status
  initialLoading: boolean;
  isOnline: boolean;
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Online Status State
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Hoy States (Loaded from cache if available)
  const [blocks, setBlocks] = useState<TimeBlock[]>(() => {
    const cached = localStorage.getItem('korat_cache_blocks');
    if (cached) {
      const parsed = JSON.parse(cached);
      const today = getLocalDateString();
      if (parsed.length > 0 && parsed[0].date === today) {
        return parsed;
      }
    }
    return [];
  });
  const [challenges, setChallenges] = useState<MiniChallenge[]>(() => {
    const cached = localStorage.getItem('korat_cache_challenges');
    return cached ? JSON.parse(cached) : [];
  });
  const [loadingHoy, setLoadingHoy] = useState(true);

  // Projects States (Loaded from cache if available)
  const [projects, setProjects] = useState<Project[]>(() => {
    const cached = localStorage.getItem('korat_cache_projects');
    return cached ? JSON.parse(cached) : [];
  });
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Finances States (Loaded from cache if available)
  const [finances, setFinances] = useState<FinanceData>(() => {
    const cached = localStorage.getItem('korat_cache_finances');
    return cached ? JSON.parse(cached) : { total_balance: 0, weekly_burn_rate: 0 };
  });
  const [survivalDays, setSurvivalDays] = useState<number>(() => {
    const cached = localStorage.getItem('korat_cache_survivalDays');
    return cached ? parseInt(cached, 10) : 0;
  });
  const [incomes, setIncomes] = useState<IncomeItem[]>(() => {
    const cached = localStorage.getItem('korat_cache_incomes');
    return cached ? JSON.parse(cached) : [];
  });
  const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncomeItem[]>(() => {
    const cached = localStorage.getItem('korat_cache_recurringIncomes');
    return cached ? JSON.parse(cached) : [];
  });
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const cached = localStorage.getItem('korat_cache_expenses');
    return cached ? JSON.parse(cached) : [];
  });
  const [debts, setDebts] = useState<DebtItem[]>(() => {
    const cached = localStorage.getItem('korat_cache_debts');
    return cached ? JSON.parse(cached) : [];
  });
  const [monthlyCloses, setMonthlyCloses] = useState<MonthlyClose[]>(() => {
    const cached = localStorage.getItem('korat_cache_monthlyCloses');
    return cached ? JSON.parse(cached) : [];
  });
  const [loadingFinances, setLoadingFinances] = useState(true);

  // If there's already cached data, we don't block the UI with an initial loader
  const [initialLoading, setInitialLoading] = useState(() => {
    const hasCache = localStorage.getItem('korat_cache_blocks') || localStorage.getItem('korat_cache_projects');
    return !hasCache;
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch Hoy Data
  const refreshHoy = async () => {
    if (!navigator.onLine) {
      setLoadingHoy(false);
      return;
    }
    try {
      const today = getLocalDateString();
      // 1. Generate blocks for today if they don't exist yet
      await supabase.rpc('generate_daily_blocks', { target_date: today });
      // 2. Always sync existing blocks with latest template data (titles, notes, times, pillar)
      await supabase.rpc('sync_daily_blocks_from_templates', { target_date: today });

      const { data: todayBlocks } = await supabase
        .from('daily_blocks')
        .select('*, pillars:pillars(id, name, label), subtasks:subtasks(*)')
        .eq('date', today)
        .order('start_time');

      if (todayBlocks) {
        setBlocks(todayBlocks);
        localStorage.setItem('korat_cache_blocks', JSON.stringify(todayBlocks));
      }

      // Yesterday's pending blocks are no longer fetched or rolled over as whole blocks.
      // Uncompleted subtasks are rolled over automatically inside generate_daily_blocks RPC.

      const { data: challengesData } = await supabase
        .from('mini_challenges')
        .select('*')
        .eq('active', true)
        .order('started_at');
        
      if (challengesData) {
        setChallenges(challengesData);
        localStorage.setItem('korat_cache_challenges', JSON.stringify(challengesData));
      }
    } catch (err) {
      console.error('Error fetching Hoy data (offline?):', err);
    } finally {
      setLoadingHoy(false);
    }
  };

  // Fetch Projects Data
  const refreshProjects = async () => {
    if (!navigator.onLine) {
      setLoadingProjects(false);
      return;
    }
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
        localStorage.setItem('korat_cache_projects', JSON.stringify(combined));
      }
    } catch (err) {
      console.error('Error fetching Projects data (offline?):', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Fetch Finances Data
  const refreshFinances = async () => {
    if (!navigator.onLine) {
      setLoadingFinances(false);
      return;
    }
    try {
      // 1. Fetch finances
      const { data: finData } = await supabase.from('finances').select('*').eq('id', 1).single();
      if (finData) {
        const formattedFin = {
          total_balance: parseFloat(finData.total_balance as any) || 0,
          weekly_burn_rate: parseFloat(finData.weekly_burn_rate as any) || 0,
          bank_balance: parseFloat(finData.bank_balance as any) || 0,
          cash_balance: parseFloat(finData.cash_balance as any) || 0
        };
        setFinances(formattedFin);
        localStorage.setItem('korat_cache_finances', JSON.stringify(formattedFin));
      } else {
        await supabase.from('finances').insert({ id: 1, total_balance: 1000, weekly_burn_rate: 150, bank_balance: 1000, cash_balance: 0 });
      }

      // 2. Fetch one-time incomes
      const { data: incomesData } = await supabase.from('income_pipeline').select('*').order('due_date');
      if (incomesData) {
        setIncomes(incomesData);
        localStorage.setItem('korat_cache_incomes', JSON.stringify(incomesData));
      }

      // 3. Fetch recurring incomes
      const { data: recData } = await supabase.from('recurring_incomes').select('*').order('amount', { ascending: false });
      if (recData) {
        setRecurringIncomes(recData);
        localStorage.setItem('korat_cache_recurringIncomes', JSON.stringify(recData));
      }

      // 4. Fetch expenses
      const { data: expensesData } = await supabase.from('expenses').select('*').order('amount', { ascending: false });
      if (expensesData) {
        setExpenses(expensesData);
        localStorage.setItem('korat_cache_expenses', JSON.stringify(expensesData));
      }

      // 5. Fetch debts
      const { data: debtsData } = await supabase.from('debts').select('*').order('due_date');
      if (debtsData) {
        setDebts(debtsData);
        localStorage.setItem('korat_cache_debts', JSON.stringify(debtsData));
      }

      // 6. Fetch monthly closes history
      const { data: closesData } = await supabase.from('monthly_closes').select('*').order('closed_at', { ascending: false });
      if (closesData) {
        setMonthlyCloses(closesData);
        localStorage.setItem('korat_cache_monthlyCloses', JSON.stringify(closesData));
      }

      // 7. Fetch calculated survival days via RPC
      const { data: daysData } = await supabase.rpc('calculate_survival_days');
      if (daysData !== null) {
        setSurvivalDays(daysData);
        localStorage.setItem('korat_cache_survivalDays', daysData.toString());
      }
    } catch (err) {
      console.error('Error fetching Finances data (offline?):', err);
    } finally {
      setLoadingFinances(false);
    }
  };

  const refreshAll = async () => {
    // If there is cache, don't set loading screen
    const hasCache = localStorage.getItem('korat_cache_blocks') || localStorage.getItem('korat_cache_projects');
    if (!hasCache) {
      setInitialLoading(true);
    }
    // Fetch all in parallel
    await Promise.all([
      refreshHoy(),
      refreshProjects(),
      refreshFinances()
    ]);
    setInitialLoading(false);
  };

  // Initial load
  useEffect(() => {
    refreshAll();
  }, []);

  return (
    <DataContext.Provider value={{
      blocks,
      setBlocks,
      challenges,
      setChallenges,
      loadingHoy,
      refreshHoy,
      projects,
      setProjects,
      loadingProjects,
      refreshProjects,
      finances,
      setFinances,
      survivalDays,
      setSurvivalDays,
      incomes,
      setIncomes,
      recurringIncomes,
      setRecurringIncomes,
      expenses,
      setExpenses,
      debts,
      setDebts,
      monthlyCloses,
      setMonthlyCloses,
      loadingFinances,
      refreshFinances,
      initialLoading,
      isOnline,
      refreshAll
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
