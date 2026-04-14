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
export type CountryName = 'Chile' | 'USA';
export type Country = CountryName | null;

export interface SelectedScenario {
  id: number;
  title: string;
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
  difficulty: string;
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
