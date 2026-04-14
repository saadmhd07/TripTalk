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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm uppercase tracking-[0.25em] text-orange-500">Profil</p>
          <h1 className="text-4xl text-gray-900">Compte et préférences</h1>
          <p className="mt-2 text-lg text-gray-500">
            Gère ton identité et tes niveaux par langue.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <UserCircle2 className="h-6 w-6 text-orange-500" />
            <h2 className="text-2xl text-gray-900">Identité</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm text-gray-600">Email</span>
              <input
                type="email"
                value={profile?.email ?? ''}
                disabled
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-500 outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-gray-600">Nom affiché</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                placeholder="Comment veux-tu apparaître dans l'app ?"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-gray-600">Langue maternelle</span>
              <input
                type="text"
                value={nativeLanguage}
                onChange={(event) => setNativeLanguage(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                placeholder="ex. Français"
              />
            </label>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-3 text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSavingProfile ? 'Enregistrement...' : 'Enregistrer le profil'}
            </button>
          </form>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Globe2 className="h-6 w-6 text-orange-500" />
            <h2 className="text-2xl text-gray-900">Niveaux par langue</h2>
          </div>

          <div className="space-y-4">
            {loadingLevels && <p className="text-gray-500">Chargement des niveaux...</p>}
            {!loadingLevels && levels.length === 0 && (
              <div className="rounded-2xl bg-orange-50 p-5 text-gray-700">
                Aucun niveau enregistré pour le moment.
              </div>
            )}
            {levels.map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-100 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg text-gray-900">{getLanguageLabel(item.language_code)}</p>
                    <p className="text-sm text-gray-500">{item.language_code.toUpperCase()}</p>
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
                      className={`rounded-xl px-3 py-2 text-sm transition ${
                        item.level === level
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
