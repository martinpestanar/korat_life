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
      // 1. Generate blocks for today if they don't exist yet (sequential)
      await supabase.rpc('generate_daily_blocks', { target_date: today });

      // 2. Fetch today's blocks and active challenges in parallel
      const [blocksRes, challengesRes] = await Promise.all([
        supabase
          .from('daily_blocks')
          .select('*, pillars:pillars(id, name, label), subtasks:subtasks(*)')
          .eq('date', today)
          .order('start_time'),
        supabase
          .from('mini_challenges')
          .select('*')
          .eq('active', true)
          .order('started_at')
      ]);

      if (blocksRes.data) {
        setBlocks(blocksRes.data);
        localStorage.setItem('korat_cache_blocks', JSON.stringify(blocksRes.data));
      }

      if (challengesRes.data) {
        setChallenges(challengesRes.data);
        localStorage.setItem('korat_cache_challenges', JSON.stringify(challengesRes.data));
      }
    } catch (err) {
      console.error('Error fetching Hoy data:', err);
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
      // Fetch projects and milestones in parallel
      const [projRes, msRes] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: true }),
        supabase
          .from('project_milestones')
          .select('*')
          .order('created_at', { ascending: true })
      ]);

      if (projRes.data) {
        const combined = projRes.data.map(p => ({
          ...p,
          milestones: msRes.data ? msRes.data.filter(m => m.project_id === p.id) : []
        }));
        setProjects(combined);
        localStorage.setItem('korat_cache_projects', JSON.stringify(combined));
      }
    } catch (err) {
      console.error('Error fetching Projects data:', err);
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
      // Fetch all financial tables and RPCs in parallel
      const [
        finRes,
        incomesRes,
        recRes,
        expensesRes,
        debtsRes,
        closesRes,
        daysRes
      ] = await Promise.all([
        supabase.from('finances').select('*').eq('id', 1).maybeSingle(),
        supabase.from('income_pipeline').select('*').order('due_date'),
        supabase.from('recurring_incomes').select('*').order('amount', { ascending: false }),
        supabase.from('expenses').select('*').order('amount', { ascending: false }),
        supabase.from('debts').select('*').order('due_date'),
        supabase.from('monthly_closes').select('*').order('closed_at', { ascending: false }),
        supabase.rpc('calculate_survival_days')
      ]);

      if (finRes.data) {
        const formattedFin = {
          total_balance: parseFloat(finRes.data.total_balance as any) || 0,
          weekly_burn_rate: parseFloat(finRes.data.weekly_burn_rate as any) || 0,
          bank_balance: parseFloat(finRes.data.bank_balance as any) || 0,
          cash_balance: parseFloat(finRes.data.cash_balance as any) || 0
        };
        setFinances(formattedFin);
        localStorage.setItem('korat_cache_finances', JSON.stringify(formattedFin));
      } else {
        await supabase.from('finances').insert({ id: 1, total_balance: 1000, weekly_burn_rate: 150, bank_balance: 1000, cash_balance: 0 });
      }

      if (incomesRes.data) {
        setIncomes(incomesRes.data);
        localStorage.setItem('korat_cache_incomes', JSON.stringify(incomesRes.data));
      }

      if (recRes.data) {
        setRecurringIncomes(recRes.data);
        localStorage.setItem('korat_cache_recurringIncomes', JSON.stringify(recRes.data));
      }

      if (expensesRes.data) {
        setExpenses(expensesRes.data);
        localStorage.setItem('korat_cache_expenses', JSON.stringify(expensesRes.data));
      }

      if (debtsRes.data) {
        setDebts(debtsRes.data);
        localStorage.setItem('korat_cache_debts', JSON.stringify(debtsRes.data));
      }
      
      if (closesRes.data) {
        setMonthlyCloses(closesRes.data);
        localStorage.setItem('korat_cache_monthlyCloses', JSON.stringify(closesRes.data));
      }

      if (daysRes.data !== null && daysRes.data !== undefined) {
        setSurvivalDays(daysRes.data);
        localStorage.setItem('korat_cache_survivalDays', daysRes.data.toString());
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
