import { FormEvent, useEffect, useState } from 'react';
import { Save, UserCircle2 } from 'lucide-react';

import { updateMyProfile } from '../lib/triptalk-api';
import type { UserProfileApiResponse } from '../lib/types';

interface ProfileScreenProps {
  profile: UserProfileApiResponse | null;
  onProfileUpdated: (profile: UserProfileApiResponse) => void;
}

export function ProfileScreen({ profile, onProfileUpdated }: ProfileScreenProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [nativeLanguage, setNativeLanguage] = useState(profile?.native_language ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
    setNativeLanguage(profile?.native_language ?? '');
  }, [profile]);

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

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-12">
        <h1 className="mb-3 text-4xl font-bold text-gray-900">
          Your <span className="text-orange-500">Profile</span>
        </h1>
        <p className="text-lg text-gray-600">
          Manage the account details tied to your TripTalk sessions.
        </p>
      </header>

      <div className="max-w-3xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
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
