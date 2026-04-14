export type Screen =
  | 'splash'
  | 'onboarding1'
  | 'onboarding2'
  | 'level'
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
