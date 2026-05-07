import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Globe,
  List,
  RefreshCcw,
  RotateCcw,
  ScanSearch,
  Sparkles,
  UserRoundSearch,
} from 'lucide-react';

import { fetchSessionFeedback, regenerateSessionFeedback } from '../lib/triptalk-api';
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
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLanguageNotes, setShowLanguageNotes] = useState(false);

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

  async function handleRegenerateFeedback() {
    setIsRegenerating(true);
    setError(null);

    try {
      const nextFeedback = await regenerateSessionFeedback(sessionId);
      setFeedback(nextFeedback);
    } catch {
      setError('Impossible de régénérer le feedback.');
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top,rgba(255,237,213,0.82),rgba(255,251,245,0.96)_42%,rgba(255,255,255,1)_78%)] shadow-[0_30px_70px_rgba(251,146,60,0.12)]">
      <div className="mx-auto max-w-[1500px] px-6 py-6 sm:px-8 sm:py-8">
        <div className="mb-8 flex flex-col gap-5 border-b border-orange-100/80 pb-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <button
              type="button"
              onClick={onRetry}
              className="mb-4 inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white/90 px-3 py-2 text-sm text-slate-700 transition hover:border-orange-300 hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la conversation
            </button>
            <p className="text-[0.68rem] uppercase tracking-[0.34em] text-orange-500">Situation Review</p>
            <h1 className="mt-3 max-w-2xl text-3xl leading-tight text-slate-950 sm:text-4xl">
              Ce qui se serait probablement passé
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Un débrief centré sur l’issue probable de la scène, l’impression laissée, et ce qui
              te ferait sonner plus local la prochaine fois.
            </p>
          </div>

          <div className="w-full rounded-[1.75rem] border border-orange-200 bg-white/90 px-5 py-4 shadow-sm sm:max-w-[220px] xl:w-[220px] xl:text-right">
            <p className="text-[0.68rem] uppercase tracking-[0.3em] text-orange-500">Readiness</p>
            <p className="mt-2 text-4xl text-slate-950">{loading ? '...' : feedback?.readiness_score ?? 0}</p>
            <p className="mt-1 text-xs text-slate-500">Indice secondaire, pas une note scolaire.</p>
          </div>
        </div>

        <div>
          {loading && (
            <div className="flex justify-center py-16">
              <LoadingSpinner text="Génération du feedback..." />
            </div>
          )}

          {error && <ErrorMessage message={error} />}

          {!loading && !error && feedback && (
            <div className="grid gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                <section className="rounded-[2.2rem] border border-emerald-200 bg-white/95 px-6 py-7 shadow-[0_20px_45px_rgba(16,185,129,0.10)] sm:px-8 sm:py-8">
                  <p className="text-[0.68rem] uppercase tracking-[0.32em] text-emerald-600">Verdict de situation</p>
                  <p className="mt-5 max-w-5xl text-3xl leading-tight text-slate-950 sm:text-4xl xl:text-5xl">
                    {feedback.situation_verdict}
                  </p>
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="rounded-[2rem] border border-orange-100 bg-white/90 p-6 shadow-sm">
                    <div className="mb-3 flex items-center gap-3 text-slate-950">
                      <UserRoundSearch className="h-5 w-5 text-orange-500" />
                      <h2 className="text-lg">Comment tu as probablement été perçu</h2>
                    </div>
                    <p className="text-base leading-relaxed text-slate-700">
                      {feedback.perceived_impression}
                    </p>
                  </section>

                  <section className="rounded-[2rem] border border-orange-100 bg-white/90 p-6 shadow-sm">
                    <div className="mb-3 flex items-center gap-3 text-slate-950">
                      <ScanSearch className="h-5 w-5 text-orange-500" />
                      <h2 className="text-lg">Le moment clé</h2>
                    </div>
                    <p className="text-base leading-relaxed text-slate-700">{feedback.key_moment}</p>
                  </section>
                </div>

                <article className="rounded-[2rem] border border-orange-100 bg-white/90 p-6 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setShowLanguageNotes((value) => !value)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <div className="flex items-center gap-3 text-slate-950">
                      <Sparkles className="h-5 w-5 text-orange-500" />
                      <h2 className="text-lg">Pour que ça sonne vraiment local la prochaine fois</h2>
                    </div>
                    <span className="text-sm text-slate-500">
                      {showLanguageNotes ? 'Masquer' : 'Afficher'}
                    </span>
                  </button>

                  {showLanguageNotes && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {feedback.natural_response_tips.map((tip, index) => (
                        <div
                          key={`tip-${index}`}
                          className="rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-sm leading-relaxed text-slate-700"
                        >
                          {tip}
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                <article className="rounded-[2rem] border border-orange-100 bg-white/90 p-6 shadow-sm">
                  <p className="text-[0.68rem] uppercase tracking-[0.32em] text-orange-500">Code culturel du contexte</p>
                  <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-700">
                    {feedback.cultural_code}
                  </p>
                </article>
              </div>

              <aside className="space-y-6 xl:col-span-4 xl:pl-2">
                <div className="xl:sticky xl:top-8 xl:space-y-6">
                  <article className="rounded-[2rem] border border-slate-900 bg-slate-950 p-6 text-white shadow-lg">
                    <p className="text-[0.68rem] uppercase tracking-[0.32em] text-orange-300">Prochaine étape</p>
                    <p className="mt-4 text-lg leading-relaxed">{feedback.next_step}</p>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm text-orange-200">
                      <ChevronRight className="h-4 w-4" />
                      Garde un seul axe pour la prochaine tentative.
                    </div>
                  </article>

                  <button
                    type="button"
                    onClick={() => void handleRegenerateFeedback()}
                    disabled={isRegenerating}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-orange-200 bg-white px-5 py-4 text-gray-700 transition hover:border-orange-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRegenerating ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Régénération...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="h-5 w-5" />
                        Régénérer le feedback
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onRetry}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-5 text-lg text-white shadow-lg transition hover:shadow-xl"
                  >
                    <RotateCcw className="h-5 w-5" />
                    Rejouer la scène
                  </button>

                  <div className="space-y-4">
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
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
