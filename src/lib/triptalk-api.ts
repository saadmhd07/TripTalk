import { apiFetch } from './api';
import type {
  CountryApiItem,
  FeedbackApiResponse,
  MessageApiItem,
  ScenarioApiItem,
  UserLanguageLevelApiResponse,
  UserProfileApiResponse,
  UserProfileUpdatePayload,
} from './types';

export async function fetchCountries(): Promise<CountryApiItem[]> {
  const response = await apiFetch('/countries');
  if (!response.ok) {
    throw new Error('Failed to load countries');
  }
  return response.json();
}

export async function fetchCountryScenarios(countryId: number): Promise<ScenarioApiItem[]> {
  const response = await apiFetch(`/countries/${countryId}/scenarios`);
  if (!response.ok) {
    throw new Error('Failed to load scenarios');
  }
  return response.json();
}

export async function createConversationSession(
  scenarioId: number,
  levelAtStart?: string | null
): Promise<{ id: string }> {
  const response = await apiFetch('/conversation-sessions', {
    method: 'POST',
    body: JSON.stringify({ scenario_id: scenarioId, level_at_start: levelAtStart ?? null }),
  });
  if (!response.ok) {
    throw new Error('Failed to create conversation session');
  }
  return response.json();
}

export async function fetchConversationMessages(sessionId: string): Promise<MessageApiItem[]> {
  const response = await apiFetch(`/conversation-sessions/${sessionId}/messages`);
  if (!response.ok) {
    throw new Error('Failed to load messages');
  }
  return response.json();
}

export async function sendConversationMessage(
  sessionId: string,
  content: string
): Promise<MessageApiItem[]> {
  const response = await apiFetch(`/conversation-sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  return response.json();
}

export async function fetchSessionFeedback(sessionId: string): Promise<FeedbackApiResponse> {
  const response = await apiFetch(`/conversation-sessions/${sessionId}/feedback`);
  if (!response.ok) {
    throw new Error('Failed to load feedback');
  }
  return response.json();
}

export async function fetchMyProfile(): Promise<UserProfileApiResponse> {
  const response = await apiFetch('/me');
  if (!response.ok) {
    throw new Error('Failed to load user profile');
  }
  return response.json();
}

export async function updateMyProfile(
  payload: UserProfileUpdatePayload
): Promise<UserProfileApiResponse> {
  const response = await apiFetch('/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to update user profile');
  }
  return response.json();
}

export async function fetchMyLanguageLevel(
  languageCode: string
): Promise<UserLanguageLevelApiResponse | null> {
  const response = await apiFetch(`/me/language-levels/${languageCode}`);
  if (!response.ok) {
    throw new Error('Failed to load language level');
  }
  return response.json();
}

export async function updateMyLanguageLevel(
  languageCode: string,
  level: string
): Promise<UserLanguageLevelApiResponse> {
  const response = await apiFetch(`/me/language-levels/${languageCode}`, {
    method: 'PUT',
    body: JSON.stringify({ level }),
  });
  if (!response.ok) {
    throw new Error('Failed to update language level');
  }
  return response.json();
}
