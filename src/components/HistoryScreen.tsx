import { Clock3, Globe, MessageSquare, RefreshCcw } from 'lucide-react';

import { getCountryPresentation, getLanguageLabel } from '../lib/presentation';
import type { ConversationSessionHistoryApiResponse } from '../lib/types';

interface HistoryScreenProps {
  items: ConversationSessionHistoryApiResponse[];
  isLoading: boolean;
  error: string | null;
  onOpenConversation: (item: ConversationSessionHistoryApiResponse) => void;
  onOpenFeedback: (item: ConversationSessionHistoryApiResponse) => void;
  onRefresh: () => void;
  onStartNew: () => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function HistoryScreen({
  items,
  isLoading,
  error,
  onOpenConversation,
  onOpenFeedback,
  onRefresh,
  onStartNew,
}: HistoryScreenProps) {
  return (
    <div className="min-h-screen bg-neutral-50 px-8 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.25em] text-orange-500">TripTalk</p>
            <h1 className="text-4xl text-gray-900">Historique</h1>
            <p className="mt-2 text-lg text-gray-500">
              Retrouve tes conversations passées et leurs feedbacks.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-gray-900"
            >
              <RefreshCcw className="h-4 w-4" />
              Actualiser
            </button>
            <button
              type="button"
              onClick={onStartNew}
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-3 text-white shadow-lg transition hover:shadow-xl"
            >
              Nouvelle conversation
            </button>
          </div>
        </div>

        {isLoading && <p className="text-gray-500">Chargement de l'historique...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!isLoading && !error && items.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-lg text-gray-700">Aucune conversation enregistrée pour le moment.</p>
          </div>
        )}

        <div className="space-y-5">
          {items.map((item) => {
            const country = getCountryPresentation(item.country_name, item.country_code);
            return (
              <div key={item.id} className="overflow-hidden rounded-3xl bg-white shadow-sm">
                <div className={`bg-gradient-to-r ${country.gradient} px-6 py-5 text-white`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{country.flag}</div>
                      <div>
                        <h2 className="text-2xl">{item.scenario_title}</h2>
                        <p className="text-white/85">{item.country_name}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-white/20 px-3 py-1">
                        {item.mode === 'free' ? 'Libre' : 'Guidé'}
                      </span>
                      <span className="rounded-full bg-white/20 px-3 py-1">
                        {getLanguageLabel(item.language_code)}
                      </span>
                      {item.level_at_start && (
                        <span className="rounded-full bg-white/20 px-3 py-1">{item.level_at_start}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 px-6 py-5 lg:grid-cols-[1fr_auto]">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        {formatDate(item.started_at)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {item.status === 'completed' ? 'Terminée' : 'Active'}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {item.has_feedback ? 'Feedback disponible' : 'Pas encore de feedback'}
                      </span>
                    </div>
                    <p className="text-gray-700">
                      {item.last_message_preview ?? 'Aucun message enregistré pour cette session.'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenConversation(item)}
                      className="rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-3 text-white shadow-lg transition hover:shadow-xl"
                    >
                      Ouvrir
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenFeedback(item)}
                      disabled={!item.has_feedback}
                      className="rounded-2xl border border-gray-200 px-5 py-3 text-gray-700 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Feedback
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
