import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { type Project } from '../components/ProjectCard';
import { type TimeBlock } from '../components/TimeBlockCard';
import { type MiniChallenge } from '../components/MiniChallengeCard';

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
  pendingBlocks: TimeBlock[];
  challenges: MiniChallenge[];
  // Hoy Setters
  setBlocks: React.Dispatch<React.SetStateAction<TimeBlock[]>>;
  setPendingBlocks: React.Dispatch<React.SetStateAction<TimeBlock[]>>;
  setChallenges: React.Dispatch<React.SetStateAction<MiniChallenge[]>>;
  loadingHoy: boolean;
  refreshHoy: () => Promise<void>;

  // Projects Setters
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  loadingProjects: boolean;
  refreshProjects: () => Promise<void>;

  // Finances Setters
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

  // Global loading
  initialLoading: boolean;
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Hoy States
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [pendingBlocks, setPendingBlocks] = useState<TimeBlock[]>([]);
  const [challenges, setChallenges] = useState<MiniChallenge[]>([]);
  const [loadingHoy, setLoadingHoy] = useState(true);

  // Projects States
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Finances States
  const [finances, setFinances] = useState<FinanceData>({ total_balance: 0, weekly_burn_rate: 0 });
  const [survivalDays, setSurvivalDays] = useState<number>(0);
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncomeItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [monthlyCloses, setMonthlyCloses] = useState<MonthlyClose[]>([]);
  const [loadingFinances, setLoadingFinances] = useState(true);

  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch Hoy Data
  const refreshHoy = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await supabase.rpc('generate_daily_blocks', { target_date: today });

      const { data: todayBlocks } = await supabase
        .from('daily_blocks')
        .select('*, pillars:pillars(id, name, label), subtasks:subtasks(*)')
        .eq('date', today)
        .order('start_time');

      if (todayBlocks) setBlocks(todayBlocks);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { data: yesterdayPending } = await supabase
        .from('daily_blocks')
        .select('*, pillars:pillars(id, name, label), subtasks:subtasks(*)')
        .eq('date', yesterday.toISOString().split('T')[0])
        .eq('is_completed', false)
        .order('start_time');

      if (yesterdayPending) setPendingBlocks(yesterdayPending);

      const { data: challengesData } = await supabase
        .from('mini_challenges')
        .select('*')
        .eq('active', true)
        .order('started_at');
        
      if (challengesData) setChallenges(challengesData);
    } catch (err) {
      console.error('Error fetching Hoy data:', err);
    } finally {
      setLoadingHoy(false);
    }
  };

  // Fetch Projects Data
  const refreshProjects = async () => {
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
      console.error('Error fetching Projects data:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Fetch Finances Data
  const refreshFinances = async () => {
    try {
      // 1. Fetch finances
      const { data: finData } = await supabase.from('finances').select('*').eq('id', 1).single();
      if (finData) {
        setFinances({
          total_balance: parseFloat(finData.total_balance as any) || 0,
          weekly_burn_rate: parseFloat(finData.weekly_burn_rate as any) || 0,
          bank_balance: parseFloat(finData.bank_balance as any) || 0,
          cash_balance: parseFloat(finData.cash_balance as any) || 0
        });
      } else {
        await supabase.from('finances').insert({ id: 1, total_balance: 1000, weekly_burn_rate: 150, bank_balance: 1000, cash_balance: 0 });
      }

      // 2. Fetch one-time incomes
      const { data: incomesData } = await supabase.from('income_pipeline').select('*').order('due_date');
      if (incomesData) setIncomes(incomesData);

      // 3. Fetch recurring incomes
      const { data: recData } = await supabase.from('recurring_incomes').select('*').order('amount', { ascending: false });
      if (recData) setRecurringIncomes(recData);

      // 4. Fetch expenses
      const { data: expensesData } = await supabase.from('expenses').select('*').order('amount', { ascending: false });
      if (expensesData) setExpenses(expensesData);

      // 5. Fetch debts
      const { data: debtsData } = await supabase.from('debts').select('*').order('due_date');
      if (debtsData) setDebts(debtsData);

      // 6. Fetch monthly closes history
      const { data: closesData } = await supabase.from('monthly_closes').select('*').order('closed_at', { ascending: false });
      if (closesData) setMonthlyCloses(closesData);

      // 7. Fetch calculated survival days via RPC
      const { data: daysData } = await supabase.rpc('calculate_survival_days');
      if (daysData !== null) setSurvivalDays(daysData);
    } catch (err) {
      console.error('Error fetching Finances data:', err);
    } finally {
      setLoadingFinances(false);
    }
  };

  const refreshAll = async () => {
    setInitialLoading(true);
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
      pendingBlocks,
      setPendingBlocks,
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
