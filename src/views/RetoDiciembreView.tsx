import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FiCheckCircle, FiCircle, FiAward, FiAlertCircle, FiZap, FiShield } from 'react-icons/fi';

// ─────────────────────────────────────────
// SISTEMA DE XP DIARIO
// ─────────────────────────────────────────
interface DayRank {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  message: string;
}

interface DayScoreResult {
  rawScore: number;   // 0 - 120
  xpEarned: number;   // XP positivo
  xpPenalty: number;  // XP perdido
  netXP: number;      // xpEarned - xpPenalty
  rank: DayRank;
  breakdown: Array<{ label: string; xp: number; achieved: boolean }>;
  penalties: Array<{ label: string; xp: number; triggered: boolean }>;
}

interface WeekItem {
  id: string;
  week_number: number;
  title: string;
  subtitle: string;
  date_range: string;
  checklist: Array<{ task: string; done: boolean }>;
  is_completed: boolean;
}

interface JournalEntry {
  entry_date: string;
  energy: 'full' | 'bien' | 'regular' | 'bajo' | null;
  hours_applied: number;
  outreach_connections: number;
  outreach_comments: number;
  outreach_posts: number;
  interviews_scheduled: number;
  linkedin_published: boolean;
  tiktok_published: boolean;
  saas_content_published: boolean;
  key_learning: string;
}

interface PortfolioCaseItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  stack: string[];
  status: 'planificado' | 'en_progreso' | 'demo_grabado' | 'publicado';
  loom_url: string;
  github_url: string;
  linkedin_post_url: string;
  order_index: number;
  checklist: Array<{ task: string; done: boolean }>;
}

interface OpportunityItem {
  id: string;
  title: string;
  company?: string;
  contact_person?: string;
  linkedin_url?: string;
  category: 'empleo' | 'freelance' | 'saas_restaurantes';
  status: 'contactado' | 'en_conversacion' | 'propuesta_enviada' | 'cerrado_ganado' | 'cerrado_perdido';
  next_step: string;
  last_contact_date?: string;
  next_followup_date?: string;
}

interface WinItem {
  id: string;
  title: string;
  impact_notes: string;
  win_date: string;
}

interface InterviewKpis {
  score: number;
  streak: number;
  total_connections: number;
  total_comments: number;
  total_posts: number;
  total_hours: number;
  interviews_scheduled: number;
  active_opportunities: number;
  completed_cases: number;
}

// Colores del sistema Stitch exactos
const C = {
  surface: '#f6fbf4',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f5ee',
  surfaceContainer: '#ebefe8',
  surfaceContainerHigh: '#e5e9e3',
  surfaceContainerHighest: '#dfe4dd',
  surfaceVariant: '#dfe4dd',
  primary: '#11562a',
  primaryContainer: '#2e6f40',
  onPrimary: '#ffffff',
  onSurface: '#181d19',
  onSurfaceVariant: '#404940',
  secondary: '#9a442d',
  secondaryContainer: '#fc9174',
  tertiary: '#67431b',
  tertiaryFixed: '#ffdcbd',
  onTertiaryFixedVariant: '#623f18',
  tertiaryContainer: '#825a31',
  onTertiaryContainer: '#ffd8b4',
  outline: '#70796f',
  outlineVariant: '#c0c9bd',
};

// ─────────────────────────────────────────
// CALCULADOR DE XP DIARIO
// ─────────────────────────────────────────
function calculateDayScore(journal: JournalEntry, isWarmup: boolean): DayScoreResult {
  const breakdown = [
    {
      label: '3 Conexiones Tech / Recruiters (+5 XP c/u)',
      xp: Math.min(journal.outreach_connections, 3) * 5,
      achieved: journal.outreach_connections >= 3,
    },
    {
      label: '2 Comentarios de Autoridad Técnica (+5 XP c/u)',
      xp: Math.min(journal.outreach_comments, 2) * 5,
      achieved: journal.outreach_comments >= 2,
    },
    {
      label: '1 Publicación de Autoridad en LinkedIn/TikTok (+15 XP)',
      xp: (journal.linkedin_published || journal.tiktok_published) ? 15 : 0,
      achieved: journal.linkedin_published || journal.tiktok_published,
    },
    {
      label: `Horas de Foco (${journal.hours_applied}h × 5 XP, máx 30)`,
      xp: Math.min(Math.floor(journal.hours_applied) * 5, 30),
      achieved: journal.hours_applied >= 6,
    },
    {
      label: 'Check-in del Día Completado (+20 XP)',
      xp: 20,
      achieved: true,
    },
    {
      label: '¡Entrevista de Trabajo Agendada! (+20 XP Bono 🌟)',
      xp: journal.interviews_scheduled > 0 ? 20 : 0,
      achieved: journal.interviews_scheduled > 0,
    },
  ];

  const xpEarned = breakdown.reduce((sum, b) => sum + b.xp, 0);
  const rawScore = Math.min(120, xpEarned);

  const penalties = [
    {
      label: 'Sin prospección hoy (0 conexiones y 0 comentarios) (-15 XP)',
      xp: 15,
      triggered: !isWarmup && journal.outreach_connections === 0 && journal.outreach_comments === 0,
    },
    {
      label: 'Menos de 2 horas de foco aplicado (-10 XP)',
      xp: 10,
      triggered: !isWarmup && journal.hours_applied < 2,
    },
  ];

  const xpPenalty = penalties.filter(p => p.triggered).reduce((sum, p) => sum + p.xp, 0);
  const netXP = xpEarned - xpPenalty;

  let rank: DayRank;
  if (rawScore >= 90) {
    rank = { label: 'Rango S · Día Imparable', emoji: '🌟', color: '#7c4f00', bgColor: 'rgba(255,220,100,0.15)', borderColor: '#f5c842', message: '¡Ejecutaste al máximo! Hoy sumaste puntos reales hacia tu meta.' };
  } else if (rawScore >= 70) {
    rank = { label: 'Rango A · Día Sólido', emoji: '🟢', color: C.primary, bgColor: 'rgba(17,86,42,0.08)', borderColor: C.primaryContainer, message: 'Buen ritmo. Mantén la consistencia y el acumulado te dará resultados.' };
  } else if (rawScore >= 50) {
    rank = { label: 'Rango B · En la Batalla', emoji: '🟡', color: '#7a5c00', bgColor: 'rgba(250,200,50,0.10)', borderColor: '#e0a800', message: 'Día irregular. Mañana sube la intensidad en prospección y foco.' };
  } else {
    rank = { label: 'Rango C · Alerta de Disciplina', emoji: '🔴', color: '#c0392b', bgColor: 'rgba(192,57,43,0.08)', borderColor: '#e74c3c', message: isWarmup ? 'Modo calentamiento: sin penalización. Úsalo para configurar tu rutina.' : 'El reto exige consistencia. Mañana es una nueva oportunidad.' };
  }

  return { rawScore, xpEarned, xpPenalty, netXP, rank, breakdown, penalties };
}

// Semanas predeterminadas si la base de datos está cargando o vacía
const DEFAULT_WEEKS: WeekItem[] = [
  {
    id: 'w1',
    week_number: 1,
    title: 'Semana 1: Cimientos, Portafolio & Setup',
    subtitle: 'Publicar el primer caso de estudio insignia y configurar el funnel de prospección.',
    date_range: 'Sep 13 - Sep 19',
    checklist: [
      { task: 'Publicar caso de estudio n8n + WhatsApp Bot en LinkedIn', done: true },
      { task: 'Optimizar titular de perfil de LinkedIn con propuesta de valor No-Code', done: true },
      { task: 'Enviar 5 mensajes personalizados de conexión a Founders/Tech Leads', done: false },
      { task: 'Grabar demo en video de 3 minutos de automatización con Supabase', done: false }
    ],
    is_completed: false
  },
  {
    id: 'w2',
    week_number: 2,
    title: 'Semana 2: Lead Scoring & Demos Técnicas',
    subtitle: 'Flujo de lead scoring automatizado con Supabase Webhooks y WhatsApp.',
    date_range: 'Sep 20 - Sep 26',
    checklist: [
      { task: 'Publicar arquitectura de base de datos relacional en PostgreSQL', done: false },
      { task: 'Contactar 10 agencias que buscan especialistas de automatización', done: false }
    ],
    is_completed: false
  }
];

export default function RetoDiciembreView() {
  const [activeTab, setActiveTab] = useState<'semanas' | 'diario' | 'oportunidades' | 'victorias'>('semanas');
  const [daysRemaining, setDaysRemaining] = useState(91);
  const [currentDayOfReto, setCurrentDayOfReto] = useState(1);
  const [weeks, setWeeks] = useState<WeekItem[]>(DEFAULT_WEEKS);
  const [activeWeek, setActiveWeek] = useState<WeekItem | null>(DEFAULT_WEEKS[0]);
  
  const [todayJournal, setTodayJournal] = useState<JournalEntry>({
    entry_date: new Date().toISOString().split('T')[0],
    energy: null,
    hours_applied: 0,
    outreach_connections: 0,
    outreach_comments: 0,
    outreach_posts: 0,
    interviews_scheduled: 0,
    linkedin_published: false,
    tiktok_published: false,
    saas_content_published: false,
    key_learning: ''
  });

  const [_portfolioCases, setPortfolioCases] = useState<PortfolioCaseItem[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [wins, setWins] = useState<WinItem[]>([]);
  const [kpis, setKpis] = useState<InterviewKpis>({
    score: 0,
    streak: 0,
    total_connections: 0,
    total_comments: 0,
    total_posts: 0,
    total_hours: 0,
    interviews_scheduled: 0,
    active_opportunities: 0,
    completed_cases: 0
  });
  const [totalXP, setTotalXP] = useState(0);
  const [isWarmup, setIsWarmup] = useState(true);

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState({ title: '¡Avance registrado!', desc: 'La victoria ha sido agregada a tu bitácora de guerra.' });
  const [savingJournal, setSavingJournal] = useState(false);

  // Modal de Cierre de Jornada con Score
  const [showDayModal, setShowDayModal] = useState(false);
  const [dayResult, setDayResult] = useState<DayScoreResult | null>(null);

  // Modal / Form para nueva oportunidad
  const [showOppForm, setShowOppForm] = useState(false);
  const [newOppTitle, setNewOppTitle] = useState('');
  const [newOppCompany, setNewOppCompany] = useState('');
  const [newOppCat, setNewOppCat] = useState<'empleo' | 'freelance' | 'saas_restaurantes'>('empleo');

  // Modal / Form para nueva victoria
  const [showWinForm, setShowWinForm] = useState(false);
  const [newWinTitle, setNewWinTitle] = useState('');

  useEffect(() => {
    const retoStart = new Date('2026-09-13T00:00:00');
    const retoEnd = new Date('2026-12-13T23:59:59');
    const now = new Date();

    // Antes del 13 Sep = Modo Calentamiento (sin penalizaciones)
    setIsWarmup(now < retoStart);

    const elapsed = Math.max(0, Math.floor((now.getTime() - retoStart.getTime()) / 86400000));
    const remaining = Math.max(0, Math.ceil((retoEnd.getTime() - now.getTime()) / 86400000));
    
    setCurrentDayOfReto(now < retoStart ? 1 : elapsed + 1);
    setDaysRemaining(remaining > 0 ? remaining : 91);

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [weeksRes, journalRes, oppsRes, winsRes, casesRes, kpisRes, xpRes] = await Promise.all([
        supabase.from('diciembre_weeks').select('*').order('week_number'),
        supabase.from('diciembre_daily_journal').select('*').eq('entry_date', todayStr).maybeSingle(),
        supabase.from('diciembre_pipeline').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('diciembre_wins').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('diciembre_portfolio_cases').select('*').order('order_index'),
        supabase.rpc('get_interview_readiness_kpis'),
        supabase.from('diciembre_daily_journal').select('net_xp').not('net_xp', 'is', null),
      ]);

      if (weeksRes.data && weeksRes.data.length > 0) {
        setWeeks(weeksRes.data);
        const active = weeksRes.data.find((w: WeekItem) => !w.is_completed) || weeksRes.data[0];
        setActiveWeek(active);
      }
      if (journalRes.data) setTodayJournal(prev => ({ ...prev, ...journalRes.data }));
      if (oppsRes.data) setOpportunities(oppsRes.data);
      if (winsRes.data) setWins(winsRes.data);
      if (casesRes.data) setPortfolioCases(casesRes.data);
      if (kpisRes.data) setKpis(kpisRes.data);
      if (xpRes.data) {
        const total = xpRes.data.reduce((acc: number, row: any) => acc + (row.net_xp || 0), 0);
        setTotalXP(total);
      }
    } catch (e) {
      console.error('Error fetching reto data:', e);
    }
  };

  const totalRetoDays = 91;
  const globalProgress = Math.min(100, Math.max(1, Math.round((currentDayOfReto / totalRetoDays) * 100)));
  const completedWeeks = weeks.filter(w => w.is_completed).length;
  const currentWeekNum = Math.min(13, completedWeeks + 1);

  // Score en tiempo real (se actualiza con cada cambio del journal)
  const liveScore = calculateDayScore(todayJournal, isWarmup);

  const handleToggleTask = async (weekId: string, taskIndex: number) => {
    const w = weeks.find(x => x.id === weekId) || activeWeek;
    if (!w) return;
    const updated = w.checklist.map((t, i) => i === taskIndex ? { ...t, done: !t.done } : t);
    const allDone = updated.length > 0 && updated.every(t => t.done);
    const updatedWeeks = weeks.map(x => x.id === weekId ? { ...x, checklist: updated, is_completed: allDone } : x);
    setWeeks(updatedWeeks);
    if (activeWeek?.id === weekId) {
      setActiveWeek({ ...activeWeek, checklist: updated, is_completed: allDone });
    }
    try {
      await supabase.from('diciembre_weeks').update({ checklist: updated, is_completed: allDone }).eq('id', weekId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveJournal = async () => {
    setSavingJournal(true);
    const todayStr = new Date().toISOString().split('T')[0];
    const result = calculateDayScore(todayJournal, isWarmup);
    try {
      await supabase.from('diciembre_daily_journal').upsert({
        entry_date: todayStr,
        energy: todayJournal.energy,
        hours_applied: todayJournal.hours_applied,
        outreach_connections: todayJournal.outreach_connections,
        outreach_comments: todayJournal.outreach_comments,
        outreach_posts: todayJournal.outreach_posts,
        interviews_scheduled: todayJournal.interviews_scheduled,
        linkedin_published: todayJournal.linkedin_published,
        tiktok_published: todayJournal.tiktok_published,
        saas_content_published: todayJournal.saas_content_published,
        key_learning: todayJournal.key_learning,
        // Columnas de XP (añadir a la tabla si no existen)
        day_raw_score: result.rawScore,
        day_rank: result.rank.label,
        xp_earned: result.xpEarned,
        xp_penalty: result.xpPenalty,
        net_xp: result.netXP,
      }, { onConflict: 'entry_date' });
      // Refrescar XP total acumulado
      const { data: xpRows } = await supabase.from('diciembre_daily_journal').select('net_xp').not('net_xp', 'is', null);
      if (xpRows) setTotalXP(xpRows.reduce((acc: number, r: any) => acc + (r.net_xp || 0), 0));
      setDayResult(result);
      setShowDayModal(true);
      refreshKpis();
    } catch (e) {
      console.error('Error saving journal:', e);
      triggerToast('Error al guardar', 'Revisa tu conexión e inténtalo de nuevo.');
    }
    setSavingJournal(false);
  };

  const refreshKpis = async () => {
    const { data } = await supabase.rpc('get_interview_readiness_kpis');
    if (data) setKpis(data);
  };

  const handleCreateOpp = async () => {
    if (!newOppTitle.trim()) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('diciembre_pipeline').insert([{
      title: newOppTitle.trim(),
      company: newOppCompany.trim(),
      category: newOppCat,
      status: 'contactado',
      next_step: 'Enviar mensaje de valor / caso de estudio',
      notes: '',
      last_contact_date: todayStr
    }]).select();

    if (data) {
      setOpportunities([data[0], ...opportunities]);
      setNewOppTitle('');
      setNewOppCompany('');
      setShowOppForm(false);
      triggerToast('¡Oportunidad agregada!', 'Nueva conversación registrada en tu pipeline.');
      refreshKpis();
    }
  };

  const handleRegisterWin = async () => {
    if (!newWinTitle.trim()) return;
    const { data } = await supabase.from('diciembre_wins').insert([{
      title: newWinTitle.trim(),
      impact_notes: 'Registrado desde el centro de mando',
      category: 'victoria'
    }]).select();

    if (data) {
      setWins([data[0], ...wins]);
      setNewWinTitle('');
      setShowWinForm(false);
      triggerToast('¡Victoria registrada!', 'Ha sido guardada en tu bitácora de guerra 🏆');
    }
  };

  const triggerToast = (title: string, desc: string) => {
    setToastMsg({ title, desc });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3200);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.surface, fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative' }}>

      {/* Micro Interaction Toast Modal (Stitch style) */}
      <div style={{
        position: 'fixed',
        top: '72px',
        left: '50%',
        transform: `translateX(-50%) translateY(${showToast ? '0px' : '-12px'})`,
        opacity: showToast ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'none',
        zIndex: 60,
        backgroundColor: 'rgba(223, 228, 221, 0.95)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        padding: '14px 18px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.14)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '390px',
        width: 'calc(100% - 32px)',
      }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontSize: 18 }}>✓</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <strong style={{ fontSize: 14, color: C.onSurface, lineHeight: 1.2 }}>{toastMsg.title}</strong>
          <span style={{ fontSize: 12, color: C.onSurfaceVariant, marginTop: 2 }}>{toastMsg.desc}</span>
        </div>
      </div>

      {/* ──── MODAL CIERRE DE JORNADA (BOTTOM SHEET) ──── */}
      {showDayModal && dayResult && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 80, backgroundColor: 'rgba(24,29,25,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px 24px' }}
          onClick={() => setShowDayModal(false)}
        >
          <div
            style={{ backgroundColor: C.surfaceContainerLowest, borderRadius: '24px 24px 20px 20px', padding: '24px 20px 28px', maxWidth: 420, width: '100%', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', border: `1.5px solid ${dayResult.rank.borderColor}`, display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 8 }}>{dayResult.rank.emoji}</div>
              <p style={{ fontSize: 10, fontWeight: 700, color: dayResult.rank.color, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                {isWarmup ? '🧪 Modo Calentamiento · ' : ''}{dayResult.rank.label}
              </p>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: C.onSurface, margin: '6px 0 4px', letterSpacing: '-0.02em' }}>Cierre de Jornada</h2>
              <p style={{ fontSize: 13, color: C.onSurfaceVariant, margin: 0 }}>{dayResult.rank.message}</p>
            </div>

            {/* XP Balance: 3 columnas */}
            <div style={{ borderRadius: '14px', backgroundColor: dayResult.rank.bgColor, border: `1px solid ${dayResult.rank.borderColor}`, padding: '14px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: 9, color: C.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>XP Ganado</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: C.primary, display: 'block', lineHeight: 1.1 }}>+{dayResult.xpEarned}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: 9, color: dayResult.xpPenalty > 0 ? '#c0392b' : C.onSurfaceVariant, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Penalización</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: dayResult.xpPenalty > 0 ? '#c0392b' : C.onSurfaceVariant, display: 'block', lineHeight: 1.1 }}>{dayResult.xpPenalty > 0 ? `-${dayResult.xpPenalty}` : '—'}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: 9, color: dayResult.netXP >= 0 ? C.primary : '#c0392b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>XP Neto</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: dayResult.netXP >= 0 ? C.primary : '#c0392b', display: 'block', lineHeight: 1.1 }}>{dayResult.netXP >= 0 ? `+${dayResult.netXP}` : dayResult.netXP}</span>
              </div>
            </div>

            {/* Desglose */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Desglose de XP</span>
              {dayResult.breakdown.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11 }}>{b.achieved ? '✅' : '⭕'}</span>
                    <span style={{ fontSize: 11, color: b.achieved ? C.onSurface : C.onSurfaceVariant }}>{b.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: b.xp > 0 ? C.primary : C.outlineVariant, flexShrink: 0 }}>{b.xp > 0 ? `+${b.xp}` : '0'}</span>
                </div>
              ))}
            </div>

            {/* Penalizaciones activas */}
            {dayResult.penalties.filter(p => p.triggered).length > 0 && (
              <div style={{ borderRadius: 12, backgroundColor: 'rgba(192,57,43,0.07)', border: '1px solid rgba(192,57,43,0.2)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#c0392b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>⚠️ Penalizaciones Aplicadas</span>
                {dayResult.penalties.filter(p => p.triggered).map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#c0392b' }}>🔴 {p.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#c0392b', flexShrink: 0 }}>-{p.xp}</span>
                  </div>
                ))}
              </div>
            )}

            {/* XP Total Acumulado */}
            <div style={{ borderRadius: 12, backgroundColor: 'rgba(17,86,42,0.06)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: C.primary, fontWeight: 600 }}>⚡ XP Acumulado en el Reto</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: C.primary }}>{totalXP}</span>
            </div>

            <button onClick={() => setShowDayModal(false)}
              style={{ width: '100%', padding: '13px', borderRadius: 14, backgroundColor: C.primary, color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              💪 ¡Entendido! A por el siguiente día
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '16px 20px 120px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: 430, margin: '0 auto' }}>

        {/* ====== RETO HEADER CARD (100% STITCH DESIGN) ====== */}
        <section style={{
          backgroundColor: C.surfaceContainerLowest,
          borderRadius: '16px',
          padding: '18px 16px',
          boxShadow: '0 4px 20px rgba(24,29,25,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Ambient Glow */}
          <div style={{ position: 'absolute', right: -24, bottom: -24, width: 128, height: 128, borderRadius: '50%', backgroundColor: 'rgba(173,243,184,0.30)', filter: 'blur(30px)', pointerEvents: 'none' }} />

          {/* Top Pill Badges — calentamiento automático si es antes del Dom 13 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 999,
              backgroundColor: isWarmup ? 'rgba(103,67,27,0.10)' : C.surfaceContainer,
              color: isWarmup ? C.tertiary : C.onSurfaceVariant,
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>
              {isWarmup ? '🧪 Calentamiento · Sin penalizaciones' : '🏁 Meta: 13 Dic 2026'}
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: 999,
              backgroundColor: 'rgba(252,145,116,0.30)',
              color: '#7c2e19',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}>
              ⏳ {daysRemaining} días restantes
            </span>
          </div>

          {/* Main Titles */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Camino a Diciembre
            </span>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '34px', fontWeight: 600, color: C.onSurface, margin: '2px 0 0', lineHeight: 1.15, letterSpacing: '-0.015em' }}>
              Día {currentDayOfReto} <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', fontWeight: 400, color: C.onSurfaceVariant }}>de {totalRetoDays}</span>
            </h1>
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 500, color: C.primary, margin: '2px 0 0' }}>
              Semana {currentWeekNum} de 13
            </p>
          </div>

          {/* Mini-pills: XP Total · Racha · Score */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
            <div style={{ flex: 1, borderRadius: 10, backgroundColor: 'rgba(17,86,42,0.07)', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <FiZap size={13} color={C.primary} />
              <div>
                <span style={{ fontSize: 9, color: C.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>XP Total</span>
                <strong style={{ fontSize: 13, color: C.primary }}>{totalXP} XP</strong>
              </div>
            </div>
            <div style={{ flex: 1, borderRadius: 10, backgroundColor: 'rgba(154,68,45,0.07)', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13 }}>🔥</span>
              <div>
                <span style={{ fontSize: 9, color: C.secondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>Racha</span>
                <strong style={{ fontSize: 13, color: C.secondary }}>{kpis.streak} días</strong>
              </div>
            </div>
            <div style={{ flex: 1, borderRadius: 10, backgroundColor: 'rgba(17,86,42,0.07)', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13 }}>🎯</span>
              <div>
                <span style={{ fontSize: 9, color: C.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>Score</span>
                <strong style={{ fontSize: 13, color: C.primary }}>{kpis.score}%</strong>
              </div>
            </div>
          </div>

          {/* Mini Progress Gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontWeight: 700, color: C.onSurfaceVariant, letterSpacing: '0.06em' }}>
              <span>Progreso Global del Reto</span>
              <span style={{ color: C.primary, fontWeight: 700 }}>{globalProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: C.surfaceContainerHigh, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${globalProgress}%`, backgroundColor: C.primary, borderRadius: 999, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        </section>

        {/* ====== SEGMENTED CONTROL SUPERIOR (4 TABS LIMPIAS IDÉNTICAS A STITCH) ====== */}
        <nav aria-label="Navegación Reto" style={{
          backgroundColor: C.surfaceContainerLow,
          padding: '4px',
          borderRadius: 999,
          display: 'flex',
          gap: '4px',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
          width: '100%'
        }}>
          {[
            { key: 'semanas', emoji: '🗂️', label: 'Semanas' },
            { key: 'diario', emoji: '📆', label: 'Diario' },
            { key: 'oportunidades', emoji: '🤝', label: 'Oportunidades' },
            { key: 'victorias', emoji: '🏆', label: 'Victorias' },
          ].map(tab => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                type="button"
                style={{
                  flex: 1,
                  padding: '7px 6px',
                  borderRadius: 999,
                  border: 'none',
                  backgroundColor: active ? C.surfaceContainerLowest : 'transparent',
                  color: active ? C.primary : C.onSurfaceVariant,
                  fontWeight: active ? 700 : 500,
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <span style={{ fontSize: '14px' }}>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ====== TAB 1: SEMANAS (CONTENIDO PRINCIPAL STITCH) ====== */}
        {activeTab === 'semanas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Active Week Card */}
            {activeWeek && (() => {
              const done = activeWeek.checklist.filter(t => t.done).length;
              const total = activeWeek.checklist.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <article style={{
                  backgroundColor: C.surfaceContainerLowest,
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 4px 16px rgba(24,29,25,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  position: 'relative'
                }}>
                  {/* Status & Date */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '3px 10px',
                      borderRadius: 999,
                      backgroundColor: 'rgba(17,86,42,0.1)',
                      color: C.primary,
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.06em'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: C.primary, display: 'inline-block' }} />
                      En Curso
                    </span>
                    <span style={{ fontSize: '11px', color: C.onSurfaceVariant, fontWeight: 500 }}>{activeWeek.date_range}</span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: C.onSurface, margin: 0, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                      {activeWeek.title}
                    </h2>
                    {activeWeek.subtitle && (
                      <p style={{ fontSize: '13px', color: C.onSurfaceVariant, margin: '4px 0 0', lineHeight: 1.4 }}>
                        {activeWeek.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Weekly Progress Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em' }}>
                      <span style={{ color: C.onSurfaceVariant }}>Ejecución semanal</span>
                      <strong style={{ color: C.primary }}>{pct}% ({done}/{total})</strong>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: C.surfaceContainer, borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: C.primary, borderRadius: 999, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>

                  {/* Interactive Checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    {activeWeek.checklist.map((task, idx) => (
                      <label
                        key={idx}
                        onClick={() => handleToggleTask(activeWeek.id, idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          backgroundColor: C.surfaceContainerLow,
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease',
                          userSelect: 'none'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => {}}
                          style={{ marginTop: '2px', accentColor: C.primary, width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span style={{
                          fontSize: '13px',
                          color: task.done ? C.onSurfaceVariant : C.onSurface,
                          textDecoration: task.done ? 'line-through' : 'none',
                          opacity: task.done ? 0.7 : 1,
                          lineHeight: 1.35,
                          flex: 1,
                          fontWeight: task.done ? 400 : 500
                        }}>
                          {task.task}
                        </span>
                        {task.done ? (
                          <FiCheckCircle size={18} color={C.primary} style={{ flexShrink: 0, marginTop: '1px' }} />
                        ) : (
                          <FiCircle size={18} color={C.outlineVariant} style={{ flexShrink: 0, marginTop: '1px' }} />
                        )}
                      </label>
                    ))}
                  </div>
                </article>
              );
            })()}

            {/* Visual Showcase Snapshot (Foco Táctico) */}
            <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', backgroundColor: C.surfaceContainerLowest, display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: '112px', width: '100%' }}>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7fUH9vnxh5B8vWB-9TRQ4Rb39-LCnrgNLLIRh5jg8Pq1G15nMbh4fHUI1BrFSdf4A6cHV5REGjGzZo9Sjk_luKCfDLhRZl_291Qgha01Ur74etrmfREyjXc-d1zid5T2sMQ-oJ-qd7Hv2dIpIsBtHM8TZPyINrtal7ZRtcmSQ5bOcJ6sIvvgV8JykAAkr0FufmP0WqL-qVOFN35C0h-kl7JP-lrkvtEcLmKoHQBqzSUJWiKYQ_6Y0"
                  alt="Foco Táctico"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #ffffff 0%, rgba(255,255,255,0.4) 40%, transparent 100%)' }} />
                <span style={{ position: 'absolute', top: '10px', left: '10px', padding: '3px 8px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', fontSize: '10px', fontWeight: 700, color: C.onSurfaceVariant, letterSpacing: '0.04em' }}>
                  Foco Táctico
                </span>
              </div>
              <div style={{ padding: '8px 14px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: C.onSurfaceVariant, fontWeight: 500 }}>Siguiente hito clave: Lanzamiento Beta Privada</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: C.primary }}>Día 28</span>
              </div>
            </div>

            {/* Quick Journal Preview Widget */}
            <article style={{ backgroundColor: C.surfaceContainerLowest, borderRadius: '16px', padding: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '18px' }}>📖</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: C.onSurface, margin: 0 }}>Journal Diario · Hoy</h3>
                </div>
                <span style={{ fontSize: '10px', color: C.onSurfaceVariant, fontWeight: 500 }}>Actualizado hoy</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {/* Energy Stat */}
                <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: C.surfaceContainerLow, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: C.onSurfaceVariant, fontWeight: 700, letterSpacing: '0.04em' }}>Energía Personal</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '18px' }}>🔥</span>
                    <strong style={{ fontSize: '15px', color: C.onSurface }}>Full Focus</strong>
                  </div>
                </div>

                {/* Deep Work Hours */}
                <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: C.surfaceContainerLow, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: C.onSurfaceVariant, fontWeight: 700, letterSpacing: '0.04em' }}>Tiempo Aplicado</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                    <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 700, color: C.primary, lineHeight: 1 }}>{todayJournal.hours_applied || '5.5'}</span>
                    <span style={{ fontSize: '10px', color: C.onSurfaceVariant, fontWeight: 600 }}>horas hoy</span>
                  </div>
                </div>
              </div>

              {/* Content Publish Tracker */}
              <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: C.surfaceContainerLow, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: C.onSurfaceVariant, fontWeight: 700, letterSpacing: '0.04em' }}>Publicaciones y Difusión</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', paddingTop: '2px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: C.primary, fontWeight: 700, padding: '4px 8px', borderRadius: '6px', backgroundColor: C.surfaceContainerLowest, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    ✓ LinkedIn
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: C.primary, fontWeight: 700, padding: '4px 8px', borderRadius: '6px', backgroundColor: C.surfaceContainerLowest, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    ✓ TikTok
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: C.tertiary, fontWeight: 700, padding: '4px 8px', borderRadius: '6px', backgroundColor: C.surfaceContainerLowest, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    ⏳ SaaS Blog
                  </span>
                </div>
              </div>
            </article>

            {/* 13 Weeks Strategic Roadmap (Stitch exact layout) */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: C.onSurface, margin: 0 }}>Ruta Estratégica (13 Semanas)</h3>
                <span style={{ fontSize: '11px', color: C.onSurfaceVariant, fontWeight: 600 }}>{completedWeeks} completadas</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Semanas 1 a 3 */}
                <div style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: C.surfaceContainerLowest, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(17,86,42,0.15)', color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', fontWeight: 700 }}>
                      ✓
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: C.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Semanas 1 – 3: Cimientos &amp; Demos Técnicas</span>
                      <span style={{ fontSize: '11px', color: C.onSurfaceVariant, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Chatbot WhatsApp, Lead Scoring en Supabase &amp; RAG</span>
                    </div>
                  </div>
                  <span style={{ flexShrink: 0, padding: '2px 8px', borderRadius: 999, backgroundColor: C.primaryContainer, color: '#fff', fontSize: '10px', fontWeight: 700, marginLeft: '8px' }}>
                    En Curso
                  </span>
                </div>

                {/* Semanas 4 a 8 */}
                <div style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: C.surfaceContainerLow, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.85 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: C.tertiaryFixed, color: C.onTertiaryFixedVariant, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>
                      ⚡
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: C.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Semanas 4 – 8: Outbound &amp; Conversaciones</span>
                      <span style={{ fontSize: '11px', color: C.onSurfaceVariant, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Prospección a agencias y startups con demos en vivo</span>
                    </div>
                  </div>
                  <span style={{ flexShrink: 0, padding: '2px 8px', borderRadius: 999, backgroundColor: C.surfaceVariant, color: C.onSurfaceVariant, fontSize: '10px', fontWeight: 600, marginLeft: '8px' }}>
                    Fase 2
                  </span>
                </div>

                {/* Semanas 9 a 13 */}
                <div style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: C.surfaceContainerLow, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.75 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: C.surfaceVariant, color: C.onSurfaceVariant, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>
                      🎯
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: C.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Semanas 9 – 13: Entrevistas &amp; Cierre</span>
                      <span style={{ fontSize: '11px', color: C.onSurfaceVariant, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Entrevista técnica superada y oferta de empleo firmada</span>
                    </div>
                  </div>
                  <span style={{ flexShrink: 0, padding: '2px 8px', borderRadius: 999, backgroundColor: C.surfaceVariant, color: C.onSurfaceVariant, fontSize: '10px', fontWeight: 600, marginLeft: '8px' }}>
                    Meta 13 Dic
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ====== TAB 2: DIARIO (SCORECARD 3-2-1 & CHECK-IN DIARIO) ====== */}
        {activeTab === 'diario' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Banner Modo Calentamiento */}
            {isWarmup && (
              <div style={{ borderRadius: 14, backgroundColor: 'rgba(103,67,27,0.07)', border: `1px solid ${C.tertiaryFixed}`, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiShield size={20} color={C.tertiary} style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: 13, color: C.tertiary, display: 'block' }}>🧪 Modo Calentamiento Activo</strong>
                  <span style={{ fontSize: 11, color: C.onSurfaceVariant }}>Viernes y Sábado: registra sin penalizaciones. El sistema estricto arranca el <strong>Domingo 13 de Septiembre</strong>.</span>
                </div>
              </div>
            )}

            {/* Live Score Card — se actualiza en tiempo real */}
            <div style={{
              borderRadius: '16px', padding: '14px 16px',
              backgroundColor: liveScore.rank.bgColor, border: `1.5px solid ${liveScore.rank.borderColor}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
            }}>
              <div>
                <span style={{ fontSize: 9, fontWeight: 700, color: liveScore.rank.color, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>Score del Día · En Vivo</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: liveScore.rank.color, display: 'block', lineHeight: 1 }}>{liveScore.rawScore} pts</span>
                <span style={{ fontSize: 11, color: liveScore.rank.color, fontWeight: 600 }}>{liveScore.rank.emoji} {liveScore.rank.label}</span>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: liveScore.rank.color, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>XP Neto
                  {isWarmup && <span style={{ fontSize: 9, opacity: 0.7 }}> (sin pen.)</span>}
                </span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: liveScore.netXP >= 0 ? C.primary : '#c0392b', display: 'block', lineHeight: 1 }}>
                  {liveScore.netXP >= 0 ? `+${liveScore.netXP}` : liveScore.netXP}
                </span>
                {!isWarmup && liveScore.xpPenalty > 0 && (
                  <span style={{ fontSize: 10, color: '#c0392b', fontWeight: 600 }}>⚠️ -{liveScore.xpPenalty} pen.</span>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: C.surfaceContainerLowest, borderRadius: 16, padding: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <span style={{ fontSize: 10, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Motor de Entrevistas</span>
                <h2 style={{ fontSize: 20, margin: '4px 0 0', color: C.onSurface, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>Scorecard Diario 3-2-1</h2>
                <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '4px 0 0' }}>La rutina diaria para asegurar conversaciones con recruiters y founders.</p>
              </div>

              {/* 3-2-1 Steppers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* 3 Conexiones */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, backgroundColor: C.surfaceContainerLow }}>
                  <div>
                    <strong style={{ fontSize: 13, color: C.onSurface, display: 'block' }}>3 Conexiones Tech / Recruiters</strong>
                    <span style={{ fontSize: 11, color: C.onSurfaceVariant }}>Mensaje personalizado a founders/leads</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => setTodayJournal(p => ({ ...p, outreach_connections: Math.max(0, p.outreach_connections - 1) }))}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.outlineVariant}`, backgroundColor: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >-</button>
                    <span style={{ fontSize: 15, fontWeight: 700, minWidth: 28, textAlign: 'center', color: todayJournal.outreach_connections >= 3 ? C.primary : C.onSurface }}>
                      {todayJournal.outreach_connections}/3
                    </span>
                    <button
                      onClick={() => setTodayJournal(p => ({ ...p, outreach_connections: p.outreach_connections + 1 }))}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', backgroundColor: C.primary, color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >+</button>
                  </div>
                </div>

                {/* 2 Comentarios */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, backgroundColor: C.surfaceContainerLow }}>
                  <div>
                    <strong style={{ fontSize: 13, color: C.onSurface, display: 'block' }}>2 Comentarios de Valor Técnico</strong>
                    <span style={{ fontSize: 11, color: C.onSurfaceVariant }}>Aportes en posts sobre n8n / Supabase</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => setTodayJournal(p => ({ ...p, outreach_comments: Math.max(0, p.outreach_comments - 1) }))}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.outlineVariant}`, backgroundColor: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >-</button>
                    <span style={{ fontSize: 15, fontWeight: 700, minWidth: 28, textAlign: 'center', color: todayJournal.outreach_comments >= 2 ? C.primary : C.onSurface }}>
                      {todayJournal.outreach_comments}/2
                    </span>
                    <button
                      onClick={() => setTodayJournal(p => ({ ...p, outreach_comments: p.outreach_comments + 1 }))}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', backgroundColor: C.primary, color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >+</button>
                  </div>
                </div>

                {/* 1 Post */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, backgroundColor: C.surfaceContainerLow }}>
                  <div>
                    <strong style={{ fontSize: 13, color: C.onSurface, display: 'block' }}>1 Publicación de Autoridad</strong>
                    <span style={{ fontSize: 11, color: C.onSurfaceVariant }}>Build in public / Lección técnica</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => setTodayJournal(p => ({ ...p, outreach_posts: Math.max(0, p.outreach_posts - 1) }))}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.outlineVariant}`, backgroundColor: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >-</button>
                    <span style={{ fontSize: 15, fontWeight: 700, minWidth: 28, textAlign: 'center', color: todayJournal.outreach_posts >= 1 ? C.primary : C.onSurface }}>
                      {todayJournal.outreach_posts}/1
                    </span>
                    <button
                      onClick={() => setTodayJournal(p => ({ ...p, outreach_posts: p.outreach_posts + 1 }))}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', backgroundColor: C.primary, color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >+</button>
                  </div>
                </div>

                {/* Entrevista Agendada */}
                <div
                  onClick={() => setTodayJournal(p => ({ ...p, interviews_scheduled: p.interviews_scheduled > 0 ? 0 : 1 }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 12,
                    backgroundColor: todayJournal.interviews_scheduled > 0 ? 'rgba(17,86,42,0.12)' : C.surfaceContainerLow,
                    border: todayJournal.interviews_scheduled > 0 ? `2px solid ${C.primary}` : `1px dashed ${C.outlineVariant}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>📞</span>
                    <div>
                      <strong style={{ fontSize: 13, color: C.onSurface }}>¡Entrevista de Trabajo Agendada Hoy!</strong>
                      <span style={{ fontSize: 11, color: C.onSurfaceVariant, display: 'block' }}>Suma +10 pts directos a tu Interview Score</span>
                    </div>
                  </div>
                  {todayJournal.interviews_scheduled > 0 ? (
                    <FiCheckCircle size={22} color={C.primary} />
                  ) : (
                    <FiCircle size={22} color={C.outlineVariant} />
                  )}
                </div>
              </div>

              {/* Selector de Energía */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.onSurface, display: 'block', marginBottom: 6 }}>Nivel de Energía</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { key: 'full', emoji: '🔥', label: 'Full' },
                    { key: 'bien', emoji: '🙂', label: 'Bien' },
                    { key: 'regular', emoji: '😐', label: 'Regular' },
                    { key: 'bajo', emoji: '😞', label: 'Bajo' },
                  ].map(e => {
                    const sel = todayJournal.energy === e.key;
                    return (
                      <button key={e.key} onClick={() => setTodayJournal(p => ({ ...p, energy: e.key as any }))}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 4px', borderRadius: 12, border: sel ? `2px solid ${C.primary}` : `1px solid ${C.outlineVariant}`, backgroundColor: sel ? 'rgba(17,86,42,0.06)' : C.surfaceContainerLow, cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit' }}>
                        <span style={{ fontSize: 20 }}>{e.emoji}</span>
                        <span style={{ fontSize: 11, fontWeight: sel ? 700 : 500, color: C.onSurface }}>{e.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slider de Horas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.onSurface }}>Horas de Foco & Aplicación (Meta: 7h)</label>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.primary, fontFamily: "'Playfair Display', serif" }}>{todayJournal.hours_applied}h</span>
                </div>
                <input type="range" min={0} max={12} step={0.5} value={todayJournal.hours_applied}
                  onChange={e => setTodayJournal(p => ({ ...p, hours_applied: parseFloat(e.target.value) }))}
                  style={{ width: '100%', accentColor: C.primary }} />
              </div>

              {/* Publicaciones */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.onSurface, display: 'block', marginBottom: 6 }}>Publicaciones Realizadas Hoy</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setTodayJournal(p => ({ ...p, linkedin_published: !p.linkedin_published }))}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: `1px solid ${todayJournal.linkedin_published ? C.primary : C.outlineVariant}`, backgroundColor: todayJournal.linkedin_published ? 'rgba(17,86,42,0.08)' : C.surfaceContainerLow, color: todayJournal.linkedin_published ? C.primary : C.onSurfaceVariant, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {todayJournal.linkedin_published ? '✓' : '+'} LinkedIn
                  </button>
                  <button onClick={() => setTodayJournal(p => ({ ...p, tiktok_published: !p.tiktok_published }))}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: `1px solid ${todayJournal.tiktok_published ? C.primary : C.outlineVariant}`, backgroundColor: todayJournal.tiktok_published ? 'rgba(17,86,42,0.08)' : C.surfaceContainerLow, color: todayJournal.tiktok_published ? C.primary : C.onSurfaceVariant, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {todayJournal.tiktok_published ? '✓' : '+'} TikTok
                  </button>
                  <button onClick={() => setTodayJournal(p => ({ ...p, saas_content_published: !p.saas_content_published }))}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: `1px solid ${todayJournal.saas_content_published ? C.primary : C.outlineVariant}`, backgroundColor: todayJournal.saas_content_published ? 'rgba(17,86,42,0.08)' : C.surfaceContainerLow, color: todayJournal.saas_content_published ? C.primary : C.onSurfaceVariant, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {todayJournal.saas_content_published ? '✓' : '+'} SaaS Blog
                  </button>
                </div>
              </div>

              {/* Aprendizaje */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.onSurface }}>Aprendizaje clave / Lección del día</label>
                <textarea rows={2} placeholder="¿Qué insight técnico o lección de prospección te llevas hoy?" value={todayJournal.key_learning}
                  onChange={e => setTodayJournal(p => ({ ...p, key_learning: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${C.outlineVariant}`, fontFamily: 'inherit', fontSize: 13, backgroundColor: C.surfaceContainerLow, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              </div>

              <button onClick={handleSaveJournal} disabled={savingJournal}
                style={{ padding: '13px', borderRadius: 14, backgroundColor: C.primary, color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.2s', opacity: savingJournal ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {savingJournal ? '⏳ Calculando Score...' : '⚡ Cerrar Jornada & Calcular XP'}
              </button>
            </div>
          </div>
        )}

        {/* ====== TAB 3: OPORTUNIDADES & FOLLOW-UPS ====== */}
        {activeTab === 'oportunidades' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 10, color: C.onSurfaceVariant, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pipeline Activo</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: C.onSurface }}>Prospección & Seguimientos</h3>
              </div>
              <button onClick={() => setShowOppForm(!showOppForm)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 999, border: `1px solid ${C.primary}`, backgroundColor: 'transparent', color: C.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Nueva Oportunidad
              </button>
            </div>

            {showOppForm && (
              <div style={{ backgroundColor: C.surfaceContainerLowest, borderRadius: 14, padding: 14, border: `1px solid ${C.primary}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="text" placeholder="Posición / Contacto (ej. Tech Lead Automation)" value={newOppTitle} onChange={e => setNewOppTitle(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.outlineVariant}`, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                <input type="text" placeholder="Empresa / Agencia" value={newOppCompany} onChange={e => setNewOppCompany(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.outlineVariant}`, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['empleo', 'freelance', 'saas_restaurantes'] as const).map(cat => (
                    <button key={cat} onClick={() => setNewOppCat(cat)}
                      style={{ flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: newOppCat === cat ? `1.5px solid ${C.primary}` : `1px solid ${C.outlineVariant}`, backgroundColor: newOppCat === cat ? 'rgba(17,86,42,0.08)' : '#fff', color: C.onSurface, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {cat === 'empleo' ? '💼 Empleo' : cat === 'freelance' ? '💻 Freelance' : '🌱 SaaS'}
                    </button>
                  ))}
                </div>
                <button onClick={handleCreateOpp}
                  style={{ padding: '9px', backgroundColor: C.primary, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Guardar en Pipeline
                </button>
              </div>
            )}

            {opportunities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: C.onSurfaceVariant, fontSize: 13, backgroundColor: C.surfaceContainerLowest, borderRadius: 16 }}>
                No hay oportunidades registradas todavía. ¡Agrega tu primera prospección!
              </div>
            ) : opportunities.map(o => {
              const isFollowupDue = o.next_followup_date && o.next_followup_date <= todayStr && o.status !== 'cerrado_ganado' && o.status !== 'cerrado_perdido';

              return (
                <div key={o.id} style={{
                  backgroundColor: C.surfaceContainerLowest,
                  borderRadius: 14,
                  padding: 14,
                  border: isFollowupDue ? `1.5px solid #d32f2f` : `1px solid ${C.outlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  {isFollowupDue && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#d32f2f', fontSize: 11, fontWeight: 700 }}>
                      <FiAlertCircle size={14} /> Toca hacer Follow-up (han pasado +3 días)
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, backgroundColor: o.category === 'empleo' ? '#F3EAF8' : o.category === 'freelance' ? '#E5F6F8' : '#E6F8EA', color: '#333', textTransform: 'uppercase' }}>
                      {o.category}
                    </span>
                    <select value={o.status} onChange={async e => {
                      const ns = e.target.value as any;
                      setOpportunities(p => p.map(x => x.id === o.id ? { ...x, status: ns } : x));
                      await supabase.from('diciembre_pipeline').update({ status: ns }).eq('id', o.id);
                      refreshKpis();
                    }} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 8, border: `1px solid ${C.outlineVariant}`, backgroundColor: C.surfaceContainerLow, color: C.onSurface, outline: 'none', fontFamily: 'inherit' }}>
                      <option value="contactado">Contactado</option>
                      <option value="en_conversacion">En conversación</option>
                      <option value="propuesta_enviada">Propuesta enviada</option>
                      <option value="cerrado_ganado">✅ Ganado / Contratado</option>
                      <option value="cerrado_perdido">❌ Perdido</option>
                    </select>
                  </div>

                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: C.onSurface }}>{o.title}</h4>
                    {o.company && <p style={{ fontSize: 12, color: C.primary, margin: '2px 0 0', fontWeight: 600 }}>🏢 {o.company}</p>}
                  </div>

                  {o.next_step && <p style={{ fontSize: 12, color: C.secondary, margin: 0, fontWeight: 500 }}>👉 {o.next_step}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* ====== TAB 4: VICTORIAS ====== */}
        {activeTab === 'victorias' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: C.onSurfaceVariant, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Muro de Victorias</span>
              <button onClick={() => setShowWinForm(!showWinForm)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, border: `1px solid ${C.secondary}`, backgroundColor: 'transparent', color: C.secondary, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <FiAward size={13} /> Nueva Victoria
              </button>
            </div>

            {showWinForm && (
              <div style={{ backgroundColor: C.surfaceContainerLowest, borderRadius: 14, padding: 14, border: `1px solid ${C.secondary}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="text" placeholder="Logro o feedback positivo del día" value={newWinTitle} onChange={e => setNewWinTitle(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.outlineVariant}`, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                <button onClick={handleRegisterWin}
                  style={{ padding: '9px', backgroundColor: C.secondary, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Inmortalizar Victoria
                </button>
              </div>
            )}

            {wins.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: C.onSurfaceVariant, fontSize: 13, backgroundColor: C.surfaceContainerLowest, borderRadius: 16, border: `1px dashed ${C.outlineVariant}` }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
                <p style={{ margin: 0, fontWeight: 600, color: C.onSurface }}>Tu Muro de Victorias está listo</p>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>Cada respuesta positiva de un recruiter o demo técnica terminada merece estar aquí.</p>
              </div>
            ) : wins.map(w => (
              <div key={w.id} style={{ backgroundColor: C.surfaceContainerLowest, borderRadius: 14, padding: 14, border: `1px solid rgba(154,68,45,0.15)`, display: 'flex', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(154,68,45,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏆</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: C.onSurface }}>{w.title}</h4>
                  {w.impact_notes && <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '3px 0 0' }}>{w.impact_notes}</p>}
                  <span style={{ fontSize: 10, color: C.secondary, marginTop: 4, display: 'block', fontWeight: 600 }}>{w.win_date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ====== THUMB-ZONE FLOATING ACTION BUTTON (STICKY ABOVE FOOTER) ====== */}
      <div style={{ position: 'sticky', bottom: 84, zIndex: 40, display: 'flex', justifyContent: 'center', padding: '0 8px', pointerEvents: 'none' }}>
        <button
          onClick={() => { setActiveTab('victorias'); setShowWinForm(true); }}
          style={{
            pointerEvents: 'all',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            borderRadius: 999,
            backgroundColor: C.primary,
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.01em',
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 8px 24px rgba(17,86,42,0.3)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <span style={{ fontSize: 18 }}>🏆</span>
          <span>+ Registrar Victoria / Avance</span>
        </button>
      </div>
    </div>
  );
}
