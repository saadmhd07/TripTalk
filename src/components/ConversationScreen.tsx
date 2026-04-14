import { FormEvent, useEffect, useState } from 'react';
import { Lightbulb, Send, Target, TrendingUp } from 'lucide-react';

import {
  getConversationAvatarPresentation,
  getCulturalTip,
  getDefaultConversationGreeting,
  getVocabularyHints,
} from '../lib/presentation';
import { fetchConversationMessages, sendConversationMessage } from '../lib/triptalk-api';
import type { CountryName } from '../lib/types';

interface ConversationScreenProps {
  country: CountryName;
  scenario: string;
  sessionId: string;
  introMessage?: string | null;
  culturalTip?: string | null;
  vocabularyHints?: string[] | null;
  partnerName?: string | null;
  partnerRole?: string | null;
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
  introMessage,
  culturalTip,
  vocabularyHints,
  partnerName,
  partnerRole,
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
      } catch {
        if (!ignore) {
          setError("Impossible de charger l'historique.");
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
      const createdMessages = await sendConversationMessage(sessionId, content);
      setMessages((prev) => [
        ...prev,
        ...createdMessages.map((message) => ({
          sender: message.role === 'user' ? 'user' : 'avatar',
          text: message.content,
        })),
      ]);
      setDraft('');
    } catch {
      setError("Impossible d'envoyer le message.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-12 gap-8 h-[calc(100vh-4rem)]">
          {/* Left Panel - Avatar */}
          <div className="col-span-3 bg-white rounded-3xl shadow-lg p-8 flex flex-col items-center justify-center">
            <div className={`${visibleAvatar.bgColor} w-40 h-40 rounded-full flex items-center justify-center text-7xl shadow-2xl mb-6`}>
              {visibleAvatar.emoji}
            </div>
            <h3 className="text-gray-800 text-2xl mb-2">{visibleAvatar.name}</h3>
            <p className="text-gray-500 text-center mb-8">{visibleAvatar.role}</p>
            
            <div className="w-full space-y-4">
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <Target className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-700">Objectif du jour</p>
                <p className="text-xs text-gray-500 mt-1">Conversation naturelle</p>
              </div>
              
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-700">Progression</p>
                <p className="text-xs text-gray-500 mt-1">3/5 phrases</p>
              </div>
            </div>
          </div>

          {/* Center Panel - Conversation */}
          <div className="col-span-6 bg-white rounded-3xl shadow-lg flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-gray-800 text-2xl">{scenario}</h2>
              <p className="text-gray-500 mt-1">Pratique la conversation naturelle</p>
            </div>

            {/* Messages */}
            <div className="flex-1 px-8 py-6 space-y-6 overflow-y-auto">
              {isLoadingHistory && (
                <p className="text-center text-gray-500">Chargement de la conversation...</p>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-6 py-4 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-base leading-relaxed">{message.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="p-8 border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="space-y-4">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Écris ta réponse ici..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-gray-200 px-5 py-4 text-base text-gray-800 shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-gray-500">
                    {isSending ? 'Envoi du message...' : 'Envoie un message texte pour continuer la conversation.'}
                  </p>
                  <button
                    type="submit"
                    disabled={isSending || !draft.trim()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-5 w-5" strokeWidth={2} />
                    Envoyer
                  </button>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </form>
            </div>
          </div>

          {/* Right Panel - Context Info */}
          <div className="col-span-3 space-y-6">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb className="w-6 h-6 text-orange-500" />
                <h4 className="text-gray-800 text-lg">Conseil culturel</h4>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {visibleCulturalTip}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-100 to-rose-100 rounded-3xl shadow-lg p-6">
              <h4 className="text-gray-800 text-lg mb-4">Vocabulaire clé</h4>
              <div className="space-y-2">
                {visibleVocabularyHints.map((hint) => (
                  <div key={hint} className="bg-white rounded-xl p-3">
                    <p className="text-sm">{hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onFeedback}
              className="w-full bg-white text-gray-700 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 text-base"
            >
              Voir le feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
