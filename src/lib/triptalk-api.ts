import { apiFetch } from './api';
import { ErrorMessages, parseApiError, parseNetworkError, formatErrorMessage } from './errors';
import type {
  ConversationSessionHistoryApiResponse,
  CountryApiItem,
  FeedbackApiResponse,
  MessageApiItem,
  ScenarioApiItem,
  UserLanguageLevelApiResponse,
  UserProfileApiResponse,
  UserProfileUpdatePayload,
} from './types';

export async function fetchCountries(): Promise<CountryApiItem[]> {
  try {
    const response = await apiFetch('/countries');
    if (!response.ok) {
      const error = await parseApiError(response);
      throw new Error(formatErrorMessage(error));
    }
    return response.json();
  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch')) {
      const netError = parseNetworkError();
      throw new Error(formatErrorMessage(netError));
    }
    throw error;
  }
}

export async function fetchCountryScenarios(countryId: number): Promise<ScenarioApiItem[]> {
  try {
    const response = await apiFetch(`/countries/${countryId}/scenarios`);
    if (!response.ok) {
      const error = await parseApiError(response);
      throw new Error(formatErrorMessage(error));
    }
    return response.json();
  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch')) {
      const netError = parseNetworkError();
      throw new Error(formatErrorMessage(netError));
    }
    throw error;
  }
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

export async function completeConversationSession(
  sessionId: string
): Promise<{ id: string; status: 'active' | 'completed' | 'abandoned' }> {
  const response = await apiFetch(`/conversation-sessions/${sessionId}/complete`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to complete conversation session');
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
  try {
    const response = await apiFetch(`/conversation-sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      const error = await parseApiError(response);
      throw new Error(formatErrorMessage(error));
    }
    return response.json();
  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch')) {
      const netError = parseNetworkError();
      throw new Error(formatErrorMessage(netError));
    }
    throw error;
  }
}

export async function fetchConversationSpeech(
  sessionId: string,
  text: string
): Promise<Blob> {
  const response = await apiFetch(`/conversation-sessions/${sessionId}/speech`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error('Failed to synthesize speech');
  }
  return response.blob();
}

export async function transcribeConversationAudio(
  sessionId: string,
  audioBlob: Blob,
  language?: string
): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  if (language) {
    formData.append('language', language);
  }

  const response = await apiFetch(`/conversation-sessions/${sessionId}/transcription`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error('Failed to transcribe audio');
  }
  const data = await response.json();
  return data.text as string;
}

export async function fetchSessionFeedback(sessionId: string): Promise<FeedbackApiResponse> {
  const response = await apiFetch(`/conversation-sessions/${sessionId}/feedback`);
  if (!response.ok) {
    throw new Error('Failed to load feedback');
  }
  return response.json();
}

export async function fetchMyConversationHistory(): Promise<ConversationSessionHistoryApiResponse[]> {
  const response = await apiFetch('/me/conversation-sessions');
  if (!response.ok) {
    throw new Error('Failed to load conversation history');
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

export async function fetchMyLanguageLevels(): Promise<UserLanguageLevelApiResponse[]> {
  const response = await apiFetch('/me/language-levels');
  if (!response.ok) {
    throw new Error('Failed to load language levels');
  }
  return response.json();
}
