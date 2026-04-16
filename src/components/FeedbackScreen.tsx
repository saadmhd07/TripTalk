import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Globe,
  Lightbulb,
  List,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';

import { fetchSessionFeedback } from '../lib/triptalk-api';
import type { FeedbackApiResponse } from '../lib/types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface FeedbackScreenProps {
  sessionId: string;
  onRetry: () => void;
  onNewScenario: () => void;
  onChangeCountry: () => void;
}

export function FeedbackScreen({ sessionId, onRetry, onNewScenario, onChangeCountry }: FeedbackScreenProps) {
  const [feedback, setFeedback] = useState<FeedbackApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadFeedback() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSessionFeedback(sessionId);
        if (!ignore) {
          setFeedback(data);
        }
      } catch {
        if (!ignore) {
          setError('Impossible de charger le feedback.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadFeedback();

    return () => {
      ignore = true;
    };
  }, [sessionId]);

  const globalScore = feedback?.global_score ?? 0;
  const vocabularyScore = feedback?.vocabulary_score ?? 0;
  const fluencyScore = feedback?.fluency_score ?? 0;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <button
              type="button"
              onClick={onRetry}
              className="mb-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la conversation
            </button>
            <div className="flex items-center gap-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl text-gray-900">Feedback de session</h1>
                <p className="mt-1 text-gray-500">
                  Un récapitulatif clair de ta performance linguistique et culturelle.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-emerald-400 to-green-500 px-6 py-5 text-white shadow-lg">
            <p className="text-xs uppercase tracking-[0.25em] text-white/75">Score global</p>
            <p className="mt-2 text-5xl">{globalScore}%</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
        <aside className="space-y-6">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg text-gray-900">Progression</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-600">Vocabulaire</span>
                  <span className="text-gray-900">{vocabularyScore}%</span>
                </div>
                <div className="h-3 rounded-full bg-gray-200">
                  <div className="h-3 rounded-full bg-orange-500" style={{ width: `${vocabularyScore}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-600">Fluidité</span>
                  <span className="text-gray-900">{fluencyScore}%</span>
                </div>
                <div className="h-3 rounded-full bg-gray-200">
                  <div className="h-3 rounded-full bg-blue-500" style={{ width: `${fluencyScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Award className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg text-gray-900">Lecture rapide</h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              Utilise ce feedback pour identifier ce que tu fais déjà bien, puis choisis un seul axe
              d'amélioration pour la prochaine session.
            </p>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-[2rem] bg-blue-50 p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl text-blue-900">Feedback linguistique</h2>
            </div>

            <div className="space-y-4">
              {loading && (
                <div className="flex justify-center py-12">
                  <LoadingSpinner text="Génération du feedback..." />
                </div>
              )}
              {error && <ErrorMessage message={error} />}

              {!loading && !error && feedback?.strengths.map((strength, index) => (
                <div key={`strength-${index}`} className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-gray-700">
                    <span className="mr-2 text-blue-600">✓</span>
                    {strength}
                  </p>
                </div>
              ))}

              {!loading && !error && feedback?.improvements.map((improvement, index) => (
                <div key={`improvement-${index}`} className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-gray-700">
                    <span className="mr-2 text-orange-500">→</span>
                    {improvement}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-orange-50 p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <Lightbulb className="h-6 w-6 text-orange-600" />
              <h2 className="text-2xl text-orange-900">Conseil culturel</h2>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="leading-relaxed text-gray-700">
                {loading
                  ? 'Chargement du conseil culturel...'
                  : error
                    ? 'Le conseil culturel est indisponible pour le moment.'
                    : feedback?.cultural_tip}
              </p>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <button
            type="button"
            onClick={onRetry}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-4 text-white shadow-lg transition hover:shadow-xl"
          >
            <RotateCcw className="h-5 w-5" />
            Revenir à la conversation
          </button>

          <button
            type="button"
            onClick={onNewScenario}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
          >
            <List className="h-5 w-5" />
            Choisir un autre scénario
          </button>

          <button
            type="button"
            onClick={onChangeCountry}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
          >
            <Globe className="h-5 w-5" />
            Changer de pays
          </button>

          <div className="rounded-[2rem] bg-gradient-to-br from-purple-100 to-pink-100 p-6 shadow-sm">
            <h3 className="text-lg text-gray-900">Prochain réflexe</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Repars sur une nouvelle session en gardant une amélioration précise en tête, plutôt
              que d'essayer de tout corriger d'un coup.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
