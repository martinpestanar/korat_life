export interface SaaSProject {
  id: string;
  slug: 'nilah-ia' | 'suna-gourmet' | string;
  name: string;
  niche: string;
  icon: string;
  accent_color: string;
  description: string;
  mrr_target: number;
  current_mrr: number;
  pricing_plans?: {
    name: string;
    price: number;
    billing: string;
    features: string[];
  }[];
}

export interface SoftwareFeature {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  layer: 'n8n' | 'frontend' | 'backend' | 'infrastructure'; // n8n (Flujos WhatsApp/IA), frontend (App/Panel PWA), backend (Supabase BD/Auth)
  status: 'backlog' | 'in_progress' | 'review' | 'frozen_100';
  issue_type?: 'feature' | 'hotfix' | 'refactor';
  appetite?: 'small' | 'medium' | 'large'; // Shape Up: Small (1-2 days), Medium (1 week), Large (2-3 weeks)
  lifecycle?: 'core_essential' | 'ai_differentiator' | 'polish_needed' | 'deprecated_kill'; // Clasificación de valor
  confidence_level?: 'ready_100' | 'needs_polish' | 'broken_risky' | 'zombie'; // Semáforo de confianza
  submodules?: {
    name: string;
    status: 'ok' | 'testing' | 'deprecated';
    notes?: string;
    deploy_status?: 'development' | 'staged' | 'production';
  }[];
  dod_checklist: { task: string; done: boolean }[];
  is_frozen: boolean;
  progress_percentage: number;
  git_branch?: string;   // Ej: "main", "feature/bot-wp", "dev/recordatorios"
  deploy_status?: 'development' | 'staged' | 'production';
  created_at: string;
  updated_at?: string;
}

export interface ContentPost {
  id: string;
  project_id: string;
  title: string;
  hook?: string;
  script_body?: string;
  cta?: string;
  pipeline_stage: 'idea' | 'scripting' | 'recording_sony_zve10' | 'editing_capcut_pc' | 'published';
  platform: 'tiktok' | 'reels' | 'youtube_shorts';
  views: number;
  likes?: number;
  dms_received: number;
  score: number;
  is_winning_pattern: boolean;
  notes?: string;
  created_at: string;
}

export interface CRMLead {
  id: string;
  project_id: string;
  business_name: string;
  contact_name?: string;
  phone?: string;
  ig_handle?: string;
  lead_source: 'cold_ig_dm' | 'inbound_tiktok' | 'referral' | 'walk_in' | 'ads';
  pipeline_stage: 'prospect' | 'script_sent' | 'responded' | 'demo_scheduled' | 'closed_won' | 'closed_lost';
  scripts_sent: { script_name: string; sent_at: string; response_received: boolean; notes?: string }[];
  response_rate: number;
  monthly_deal_value: number;
  is_pilot_project?: boolean;
  pilot_notes?: string;
  onboarding_status?: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

export interface GamificationStats {
  id: string;
  founder_xp: number;
  founder_level: number;
  accumulated_mrr: number;
  first_hire_mrr_goal: number;
  total_features_frozen: number;
  total_closed_deals: number;
  total_winning_videos: number;
  updated_at: string;
}

export interface SystemSettings {
  id: string;
  key: string;
  value: any;
  updated_at: string;
}
