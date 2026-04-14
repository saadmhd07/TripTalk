import { FormEvent, useMemo, useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';

import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

type AuthMode = 'signin' | 'signup';

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () => (mode === 'signin' ? 'Connecte-toi pour continuer' : 'Crée ton compte'),
    [mode]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setError('Supabase n’est pas configuré côté frontend.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          throw signInError;
        }
        onAuthenticated();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        onAuthenticated();
        return;
      }

      setMessage('Compte créé. Vérifie ton email si une confirmation est demandée.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50 p-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 p-12 text-white">
            <p className="mb-6 text-sm uppercase tracking-[0.35em] text-white/80">TripTalk</p>
            <h1 className="mb-6 max-w-md text-5xl">Conversations réalistes, suivi personnel.</h1>
            <p className="max-w-lg text-lg text-white/90">
              Connecte-toi pour sauvegarder tes sessions, retrouver ton historique et suivre ta
              progression.
            </p>
          </div>

          <div className="p-10 lg:p-12">
            <div className="mb-10 flex rounded-2xl bg-orange-50 p-1">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`flex-1 rounded-xl px-4 py-3 text-sm transition ${
                  mode === 'signin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 rounded-xl px-4 py-3 text-sm transition ${
                  mode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Créer un compte
              </button>
            </div>

            <h2 className="mb-2 text-3xl text-gray-900">{title}</h2>
            <p className="mb-8 text-gray-500">
              {isSupabaseConfigured
                ? 'Ton historique et ton feedback seront liés à ton compte.'
                : 'Configure Supabase côté frontend pour activer la vraie authentification.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm text-gray-600">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                  placeholder="toi@example.com"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-gray-600">Mot de passe</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                  placeholder="8 caractères minimum"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !isSupabaseConfigured}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-4 text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mode === 'signin' ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                {isSubmitting
                  ? 'Patiente...'
                  : mode === 'signin'
                    ? 'Se connecter'
                    : 'Créer un compte'}
              </button>

              {message && <p className="text-sm text-emerald-600">{message}</p>}
              {error && <p className="text-sm text-red-500">{error}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
