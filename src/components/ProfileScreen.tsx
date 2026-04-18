import { FormEvent, useEffect, useState } from 'react';
import { Globe2, Save, Sparkles, UserCircle2 } from 'lucide-react';

import { getLanguageLabel } from '../lib/presentation';
import { fetchMyLanguageLevels, updateMyLanguageLevel, updateMyProfile } from '../lib/triptalk-api';
import type {
  Level,
  UserLanguageLevelApiResponse,
  UserProfileApiResponse,
} from '../lib/types';

interface ProfileScreenProps {
  profile: UserProfileApiResponse | null;
  onProfileUpdated: (profile: UserProfileApiResponse) => void;
}

const levelOptions: Exclude<Level, null>[] = ['Débutant', 'Intermédiaire', 'Avancé'];

export function ProfileScreen({ profile, onProfileUpdated }: ProfileScreenProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [nativeLanguage, setNativeLanguage] = useState(profile?.native_language ?? '');
  const [levels, setLevels] = useState<UserLanguageLevelApiResponse[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [savingLanguageCode, setSavingLanguageCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
    setNativeLanguage(profile?.native_language ?? '');
  }, [profile]);

  useEffect(() => {
    let ignore = false;

    async function loadLevels() {
      setLoadingLevels(true);
      setError(null);

      try {
        const data = await fetchMyLanguageLevels();
        if (!ignore) {
          setLevels(data);
        }
      } catch {
        if (!ignore) {
          setError('Impossible de charger les niveaux par langue.');
        }
      } finally {
        if (!ignore) {
          setLoadingLevels(false);
        }
      }
    }

    void loadLevels();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProfile(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await updateMyProfile({
        display_name: displayName || null,
        native_language: nativeLanguage || null,
      });
      onProfileUpdated(updated);
      setMessage('Profil mis à jour.');
    } catch {
      setError("Impossible d'enregistrer le profil.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleLevelChange(languageCode: string, level: string) {
    setSavingLanguageCode(languageCode);
    setError(null);
    setMessage(null);

    try {
      const updated = await updateMyLanguageLevel(languageCode, level);
      setLevels((current) => {
        const rest = current.filter((item) => item.language_code !== languageCode);
        return [...rest, updated].sort((a, b) => a.language_code.localeCompare(b.language_code));
      });
      setMessage(`Niveau ${getLanguageLabel(languageCode)} mis à jour.`);
    } catch {
      setError("Impossible d'enregistrer ce niveau.");
    } finally {
      setSavingLanguageCode(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-12">
        <h1 className="mb-3 text-4xl font-bold text-gray-900">
          Your <span className="text-orange-500">Profile</span>
        </h1>
        <p className="text-lg text-gray-600">
          Manage your identity and language proficiency levels.
        </p>
      </header>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Identity Card */}
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-orange-100 p-3">
              <UserCircle2 className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Identity</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={profile?.email ?? ''}
                disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-500 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                placeholder="How do you want to appear in the app?"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Native Language</label>
              <input
                type="text"
                value={nativeLanguage}
                onChange={(event) => setNativeLanguage(event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                placeholder="e.g. French"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Language Levels Card */}
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3">
              <Globe2 className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Language Levels</h2>
          </div>

          <div className="space-y-4">
            {loadingLevels && (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-gray-500">Loading levels...</p>
              </div>
            )}
            {!loadingLevels && levels.length === 0 && (
              <div className="rounded-xl bg-orange-50 p-5 text-center text-sm text-gray-600">
                No levels saved yet. Start a conversation to set your first level!
              </div>
            )}
            {levels.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {getLanguageLabel(item.language_code)}
                    </p>
                    <p className="text-xs text-gray-500">{item.language_code.toUpperCase()}</p>
                  </div>
                  <Sparkles className="h-5 w-5 text-orange-400" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {levelOptions.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => void handleLevelChange(item.language_code, level)}
                      disabled={savingLanguageCode === item.language_code}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        item.level === level
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {(message || error) && (
        <div className="mt-6">
          {message && (
            <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
