export type Screen =
  | 'splash'
  | 'onboarding1'
  | 'onboarding2'
  | 'level'
  | 'history'
  | 'country'
  | 'cultural'
  | 'scenario'
  | 'conversation'
  | 'feedback';

export type Level = 'Débutant' | 'Intermédiaire' | 'Avancé' | null;
export type CountryName = string;
export type Country = CountryName | null;

export interface SelectedScenario {
  id: number;
  title: string;
  language_code: string;
  mode: string;
  intro_message?: string | null;
  cultural_tip?: string | null;
  vocabulary_hints?: string | null;
  partner_name?: string | null;
  partner_role?: string | null;
}

export interface CountryApiItem {
  id: number;
  code: string;
  name: string;
  language: string;
  is_active: boolean;
}

export interface ScenarioApiItem {
  id: number;
  country_id: number;
  slug: string;
  title: string;
  description: string;
  language_code: string;
  difficulty: string;
  mode: string;
  intro_message: string | null;
  cultural_tip: string | null;
  vocabulary_hints: string | null;
  partner_name: string | null;
  partner_role: string | null;
  is_active: boolean;
}

export interface MessageApiItem {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface FeedbackApiResponse {
  id: number;
  session_id: string;
  global_score: number;
  vocabulary_score: number | null;
  fluency_score: number | null;
  strengths: string[];
  improvements: string[];
  cultural_tip: string | null;
  created_at: string;
}

export interface ConversationSessionHistoryApiResponse {
  id: string;
  scenario_id: number;
  scenario_title: string;
  country_name: string;
  country_code: string;
  language_code: string;
  mode: string;
  status: 'active' | 'completed' | 'abandoned';
  level_at_start: string | null;
  intro_message: string | null;
  cultural_tip: string | null;
  vocabulary_hints: string | null;
  partner_name: string | null;
  partner_role: string | null;
  last_message_preview: string | null;
  has_feedback: boolean;
  started_at: string;
  ended_at: string | null;
}

export interface UserProfileApiResponse {
  id: string;
  email: string | null;
  display_name: string | null;
  native_language: string | null;
  target_language: string | null;
  level: string | null;
}

export interface UserProfileUpdatePayload {
  display_name?: string | null;
  native_language?: string | null;
  target_language?: string | null;
  level?: string | null;
}

export interface UserLanguageLevelApiResponse {
  id: string;
  user_id: string;
  language_code: string;
  level: string;
}
