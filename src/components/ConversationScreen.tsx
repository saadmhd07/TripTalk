import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Languages, Lightbulb, Send, Sparkles, Target, TrendingUp } from 'lucide-react';

import {
  getConversationAvatarPresentation,
  getCulturalTip,
  getDefaultConversationGreeting,
  getLanguageLabel,
  getVocabularyHints,
} from '../lib/presentation';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { fetchConversationMessages, sendConversationMessage } from '../lib/triptalk-api';
import type { CountryName } from '../lib/types';

interface ConversationScreenProps {
  country: CountryName;
  scenario: string;
  sessionId: string;
  languageCode?: string | null;
  mode?: string | null;
  introMessage?: string | null;
  culturalTip?: string | null;
  vocabularyHints?: string[] | null;
  partnerName?: string | null;
  partnerRole?: string | null;
  onBackToExplorer: () => void;
  onFeedback: () => void;
}

interface Message {
  sender: 'user' | 'avatar';
  text: string;
}

export function ConversationScreen({
  country,
  scenario,
  sessionId,
  languageCode,
  mode,
  introMessage,
  culturalTip,
  vocabularyHints,
  partnerName,
  partnerRole,
  onBackToExplorer,
  onFeedback,
}: ConversationScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const avatar = getConversationAvatarPresentation(country);
  const visibleAvatar = {
    ...avatar,
    name: partnerName || avatar.name,
    role: partnerRole || avatar.role,
  };
  const visibleCulturalTip = culturalTip || getCulturalTip(country);
  const visibleVocabularyHints =
    vocabularyHints && vocabularyHints.length > 0 ? vocabularyHints : getVocabularyHints(country);
  const languageLabel = languageCode ? getLanguageLabel(languageCode) : null;

  useEffect(() => {
    let ignore = false;

    async function loadMessages() {
      setIsLoadingHistory(true);
      setError(null);

      try {
        const data = await fetchConversationMessages(sessionId);
        if (!ignore) {
          if (data.length === 0) {
            setMessages([
              {
                sender: 'avatar',
                text: introMessage || getDefaultConversationGreeting(country),
              },
            ]);
          } else {
            setMessages(
              data.map((message) => ({
                sender: message.role === 'user' ? 'user' : 'avatar',
                text: message.content,
              }))
            );
          }
        }
      } catch (err) {
        if (!ignore) {
          const message = err instanceof Error ? err.message : 'Failed to load conversation. Please refresh the page.';
          setError(message);
        }
      } finally {
        if (!ignore) {
          setIsLoadingHistory(false);
        }
      }
    }

    void loadMessages();

    return () => {
      ignore = true;
    };
  }, [country, introMessage, sessionId]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const exchange = await sendConversationMessage(sessionId, content);
      setMessages((prev) => [
        ...prev,
        ...exchange.messages.map((message) => ({
          sender: message.role === 'user' ? 'user' : 'avatar',
          text: message.content,
        })),
      ]);
      setDraft('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      setError(message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <button
              type="button"
              onClick={onBackToExplorer}
              className="mb-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à l'explorer
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl text-gray-900">{scenario}</h1>
              {mode && (
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-orange-700">
                  {mode === 'free' ? 'Libre' : 'Guidé'}
                </span>
              )}
              {languageLabel && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {languageLabel}
                </span>
              )}
            </div>
            <p className="mt-2 text-gray-500">
              Conversation avec {visibleAvatar.name} • {country}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-gray-700">
              Session active
            </div>
            <button
              type="button"
              onClick={onFeedback}
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-3 text-white shadow-lg transition hover:shadow-xl"
            >
              Voir le feedback
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="hidden space-y-6 xl:block">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className={`${visibleAvatar.bgColor} mx-auto mb-5 flex h-32 w-32 items-center justify-center rounded-full text-6xl shadow-xl`}>
              {visibleAvatar.emoji}
            </div>
            <div className="text-center">
              <h2 className="text-2xl text-gray-900">{visibleAvatar.name}</h2>
              <p className="mt-1 text-gray-500">{visibleAvatar.role}</p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="text-xs uppercase tracking-wide text-orange-500">Pays</p>
                <p className="mt-1 text-gray-900">{country}</p>
              </div>
              {languageLabel && (
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-blue-500">Langue</p>
                  <p className="mt-1 text-gray-900">{languageLabel}</p>
                </div>
              )}
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-500">Mode</p>
                <p className="mt-1 text-gray-900">{mode === 'free' ? 'Conversation libre' : 'Scénario guidé'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Target className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg text-gray-900">Objectif</h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              Pratique une conversation naturelle, garde le rythme de l'échange et ose rebondir sur les réponses.
            </p>
          </div>
        </aside>

        <section className="flex min-h-[680px] flex-col overflow-hidden rounded-[2rem] bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-400">Conversation</p>
                <p className="text-gray-600">Réponds naturellement et garde l'échange vivant.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2 text-sm text-gray-600">
                <Languages className="h-4 w-4" />
                {languageLabel ?? 'Langue'}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {isLoadingHistory && (
              <div className="flex h-full items-center justify-center">
                <LoadingSpinner text="Chargement de la conversation..." />
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-3xl px-5 py-4 shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="mb-2 text-xs uppercase tracking-wide opacity-70">
                    {message.sender === 'user' ? 'Toi' : visibleAvatar.name}
                  </p>
                  <p className="text-base leading-relaxed">{message.text}</p>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-3xl bg-gray-100 px-5 py-4 shadow-sm">
                  <p className="mb-2 text-xs uppercase tracking-wide text-gray-500 opacity-70">
                    {visibleAvatar.name}
                  </p>
                  <LoadingSpinner size="sm" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 px-6 py-5">
            <form onSubmit={handleSendMessage} className="space-y-4">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSendMessage(event as any);
                  }
                }}
                placeholder="Écris ta réponse ici... (Enter to send, Shift+Enter for new line)"
                rows={4}
                className="w-full resize-none rounded-3xl border border-gray-200 px-5 py-4 text-base text-gray-800 shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-gray-500">
                  {isSending
                    ? 'Envoi du message...'
                    : 'Envoie un message texte pour continuer la conversation.'}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onFeedback}
                    className="rounded-2xl border border-gray-200 px-5 py-3 text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
                  >
                    Feedback
                  </button>
                  <button
                    type="submit"
                    disabled={isSending || !draft.trim()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-5 w-5" strokeWidth={2} />
                    Envoyer
                  </button>
                </div>
              </div>
              {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
            </form>
          </div>
        </section>

        <aside className="hidden space-y-6 xl:block">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Lightbulb className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg text-gray-900">Conseil culturel</h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">{visibleCulturalTip}</p>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-orange-100 to-rose-100 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg text-gray-900">Vocabulaire clé</h3>
            </div>
            <div className="space-y-2">
              {visibleVocabularyHints.map((hint) => (
                <div key={hint} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-sm text-gray-700">{hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <h3 className="text-lg text-gray-900">Rythme de session</h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              Réponds en phrases simples mais naturelles. Si tu bloques, reformule plus court puis relance la discussion.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
