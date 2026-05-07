import { Clock3, Globe, MessageSquare, Plus, RefreshCcw } from 'lucide-react';

import { getCountryPresentation, getLanguageLabel } from '../lib/presentation';
import type { ConversationSessionHistoryApiResponse } from '../lib/types';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';

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
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-12 flex items-end justify-between">
        <div>
          <h1 className="mb-3 text-4xl font-bold text-gray-900">
            Conversation <span className="text-orange-500">History</span>
          </h1>
          <p className="text-lg text-gray-600">
            Review your past conversations and feedback.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={onStartNew}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </button>
        </div>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Loading history..." />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onRetry={onRefresh} />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-200">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <MessageSquare className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">No conversations yet</h3>
          <p className="mb-6 text-gray-600">Start your first conversation to practice a new language!</p>
          <button
            type="button"
            onClick={onStartNew}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            Start Conversation
          </button>
        </div>
      )}

      {/* Conversations List */}
      {!isLoading && !error && items.length > 0 && (
        <div className="space-y-4">
          {items.map((item) => {
            const country = getCountryPresentation(item.country_name, item.country_code);
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md"
              >
                {/* Card Header */}
                <div className={`bg-gradient-to-r ${country.gradient} px-6 py-4`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{country.flag}</div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{item.scenario_title}</h3>
                        <p className="text-sm text-white/90">{item.country_name}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                        {item.mode === 'free' ? 'Free' : 'Guided'}
                      </span>
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                        {getLanguageLabel(item.language_code)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex items-center justify-between gap-6 px-6 py-5">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        {formatDate(item.started_at)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {item.status === 'completed' ? 'Completed' : 'Active'}
                      </span>
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {item.has_feedback ? 'Feedback available' : 'No feedback yet'}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700">
                      {item.last_message_preview ?? 'No messages recorded for this session.'}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenConversation(item)}
                      className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenFeedback(item)}
                      disabled={!item.has_feedback}
                      className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Feedback
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
