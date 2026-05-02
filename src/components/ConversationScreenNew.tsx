import { FormEvent, useEffect, useState } from 'react';
import { Compass, Send } from 'lucide-react';

import {
  getConversationAvatarPresentation,
  getLanguageLabel,
  getScenarioFocusCopy,
} from '../lib/presentation';
import { fetchConversationMessages, sendConversationMessage } from '../lib/triptalk-api';
import type { MessageApiItem } from '../lib/types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface Message {
  sender: 'user' | 'avatar';
  text: string;
}

interface ConversationScreenNewProps {
  country: string;
  scenarioSlug: string;
  scenario: string;
  scenarioDescription?: string | null;
  sessionId: string;
  languageCode?: string;
  mode?: string;
  introMessage?: string | null;
  culturalTip?: string | null;
  vocabularyHints?: string[] | null;
  partnerName?: string | null;
  partnerRole?: string | null;
  onBackToExplorer: () => void;
  onFeedback: () => void;
}

export function ConversationScreenNew({
  country,
  scenarioSlug,
  scenario,
  scenarioDescription,
  sessionId,
  languageCode,
  mode,
  introMessage,
  culturalTip,
  vocabularyHints,
  partnerName,
  partnerRole,
  onFeedback,
}: ConversationScreenNewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const visibleAvatar = getConversationAvatarPresentation(
    country,
    partnerName || undefined,
    partnerRole || undefined
  );
  const languageLabel = languageCode ? getLanguageLabel(languageCode) : null;
  const focusCopy = getScenarioFocusCopy(scenarioSlug);

  useEffect(() => {
    let ignore = false;

    async function loadMessages() {
      try {
        const data = await fetchConversationMessages(sessionId);
        if (!ignore) {
          if (data.length === 0 && introMessage) {
            setMessages([{ sender: 'avatar', text: introMessage }]);
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
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to load conversation. Please refresh the page.';
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
  }, [sessionId, introMessage]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const createdMessages = await sendConversationMessage(sessionId, content);
      setMessages((prev) => [
        ...prev,
        ...createdMessages.map((message: MessageApiItem) => ({
          sender: message.role === 'user' ? 'user' : 'avatar',
          text: message.content,
        })),
      ]);
      setDraft('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      setError(message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mx-auto grid h-[calc(100vh-4rem)] max-w-6xl gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="hidden rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 xl:block">
        <p className="text-xs uppercase tracking-[0.28em] text-orange-500">{focusCopy.eyebrow}</p>
        <h2 className="mt-3 text-2xl font-semibold text-gray-900">{scenario}</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          {scenarioDescription ?? focusCopy.objective}
        </p>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Compass className="h-4 w-4 text-orange-500" />
            What to aim for
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{focusCopy.objective}</p>
        </div>

        {culturalTip && (
          <div className="mt-4 rounded-2xl bg-orange-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-500">Cultural cue</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">{culturalTip}</p>
          </div>
        )}

        {vocabularyHints && vocabularyHints.length > 0 && (
          <div className="mt-4 rounded-2xl bg-blue-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-500">Useful words</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {vocabularyHints.slice(0, 4).map((hint) => (
                <span
                  key={hint}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100"
                >
                  {hint}
                </span>
              ))}
            </div>
          </div>
        )}
      </aside>

      <div className="flex h-full flex-col">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-md ${visibleAvatar.bgColor}`}>
              {visibleAvatar.emoji}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{visibleAvatar.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{visibleAvatar.role}</span>
                {languageLabel && (
                  <>
                    <span>•</span>
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      {languageLabel}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {mode && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-gray-200">
                {mode === 'free' ? 'Free mode' : 'Guided mode'}
              </span>
            )}
            <button
              type="button"
              onClick={onFeedback}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
            >
              Get Feedback
            </button>
          </div>
        </header>

        <div className="mb-6 flex-1 overflow-y-auto rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          {isLoadingHistory && (
            <div className="flex h-full items-center justify-center">
              <LoadingSpinner text="Loading conversation..." />
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-[#A3D9D3] text-gray-900'
                      : 'bg-orange-500 text-white'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl bg-orange-500 px-4 py-3">
                  <LoadingSpinner size="sm" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSendMessage(event as any);
                }
              }}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 placeholder-gray-500 outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {isSending ? 'Sending...' : 'Stay concise, practical, and keep the exchange moving'}
              </p>
              <button
                type="submit"
                disabled={isSending || !draft.trim()}
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            </div>
            {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
          </form>
        </div>
      </div>
    </div>
  );
}
