import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Compass,
  MessageSquareText,
  Mic,
  Play,
  Send,
  Square,
  Volume2,
} from 'lucide-react';

import {
  getConversationAvatarPresentation,
  getLanguageLabel,
  getScenarioFocusCopy,
} from '../lib/presentation';
import {
  fetchConversationMessages,
  fetchConversationSpeech,
  sendConversationMessage,
  transcribeConversationAudio,
} from '../lib/triptalk-api';
import type { MessageApiItem } from '../lib/types';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';

interface Message {
  sender: 'user' | 'avatar';
  text: string;
}

type CharacterState = 'idle' | 'thinking' | 'speaking';
type RecorderState = 'idle' | 'recording' | 'transcribing';

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
  const [characterState, setCharacterState] = useState<CharacterState>('idle');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [lastSpokenText, setLastSpokenText] = useState<string | null>(null);
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const visibleAvatar = getConversationAvatarPresentation(
    country,
    partnerName || undefined,
    partnerRole || undefined
  );
  const languageLabel = languageCode ? getLanguageLabel(languageCode) : null;
  const focusCopy = getScenarioFocusCopy(scenarioSlug);
  const lastAvatarMessage = useMemo(
    () => [...messages].reverse().find((message) => message.sender === 'avatar') ?? null,
    [messages]
  );

  useEffect(() => {
    let ignore = false;

    async function loadMessages() {
      try {
        const data = await fetchConversationMessages(sessionId);
        if (!ignore) {
          if (data.length === 0 && introMessage) {
            setMessages([{ sender: 'avatar', text: introMessage }]);
            void playAvatarSpeech(introMessage);
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

  useEffect(() => {
    return () => {
      stopAudioPlayback();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  function stopAudioPlayback() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }

  async function playAvatarSpeech(text: string) {
    if (!text.trim()) {
      return;
    }

    stopAudioPlayback();
    setAudioError(null);
    setCharacterState('speaking');

    try {
      const audioBlob = await fetchConversationSpeech(sessionId, text);
      const nextUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(nextUrl);

      audioRef.current = audio;
      audioUrlRef.current = nextUrl;
      setLastSpokenText(text);

      audio.onended = () => {
        setCharacterState('idle');
      };
      audio.onerror = () => {
        setCharacterState('idle');
        setAudioError('Voice playback is unavailable right now.');
      };

      await audio.play();
    } catch {
      setCharacterState('idle');
      setAudioError('Voice playback is unavailable right now.');
    }
  }

  async function startVoiceRecording() {
    if (recorderState !== 'idle') {
      return;
    }

    setError(null);
    setAudioError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        recordedChunksRef.current = [];
        mediaRecorderRef.current = null;

        if (audioBlob.size === 0) {
          setRecorderState('idle');
          return;
        }

        setRecorderState('transcribing');
        setCharacterState('thinking');

        try {
          const transcript = await transcribeConversationAudio(sessionId, audioBlob, languageCode);
          setDraft(transcript);
        } catch {
          setError('Voice transcription is unavailable right now.');
        } finally {
          setRecorderState('idle');
          setCharacterState('idle');
        }
      };

      mediaRecorder.start();
      setRecorderState('recording');
      setCharacterState('thinking');
    } catch {
      setError('Microphone access is unavailable right now.');
      setRecorderState('idle');
      setCharacterState('idle');
    }
  }

  function stopVoiceRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);
    setAudioError(null);
    setCharacterState('thinking');

    try {
      const createdMessages = await sendConversationMessage(sessionId, content);
      const assistantReply = createdMessages.find((message) => message.role === 'assistant');

      setMessages((prev) => [
        ...prev,
        ...createdMessages.map((message: MessageApiItem) => ({
          sender: message.role === 'user' ? 'user' : 'avatar',
          text: message.content,
        })),
      ]);
      setDraft('');

      if (assistantReply?.content) {
        void playAvatarSpeech(assistantReply.content);
      } else {
        setCharacterState('idle');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      setError(message);
      setCharacterState('idle');
    } finally {
      setIsSending(false);
    }
  }

  const avatarGlowClass =
    characterState === 'speaking'
      ? 'shadow-[0_0_80px_rgba(249,115,22,0.38)] ring-8 ring-orange-200/70'
      : recorderState === 'recording'
      ? 'shadow-[0_0_70px_rgba(14,165,233,0.35)] ring-8 ring-sky-200/80'
      : characterState === 'thinking'
      ? 'shadow-[0_0_60px_rgba(56,189,248,0.24)] ring-8 ring-sky-100'
      : 'shadow-[0_20px_60px_rgba(15,23,42,0.18)] ring-8 ring-white/80';

  const statusLabel =
    characterState === 'speaking'
      ? 'Matías is speaking'
      : recorderState === 'recording'
      ? 'Listening to you'
      : recorderState === 'transcribing'
      ? 'Turning your voice into text'
      : characterState === 'thinking'
      ? 'Thinking about the next reply'
      : 'Ready when you are';

  const waveformHeights =
    characterState === 'speaking'
      ? ['h-8', 'h-14', 'h-20', 'h-12', 'h-16', 'h-10']
      : recorderState === 'recording'
      ? ['h-10', 'h-16', 'h-12', 'h-18', 'h-14', 'h-9']
      : characterState === 'thinking'
      ? ['h-4', 'h-7', 'h-5', 'h-8', 'h-6', 'h-4']
      : ['h-2', 'h-3', 'h-4', 'h-3', 'h-2', 'h-2'];

  const portraitMotionClass =
    characterState === 'speaking'
      ? 'translate-y-0 scale-[1.015]'
      : recorderState === 'recording'
      ? '-translate-y-1 scale-[1.01]'
      : characterState === 'thinking'
      ? 'translate-y-0 scale-[1.005]'
      : 'translate-y-0 scale-100';

  return (
    <div className="mx-auto h-[calc(100vh-4rem)] max-w-7xl">
      <div className="grid h-full gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-[#06172B] via-[#0A2A48] to-[#123E64] p-6 text-white shadow-[0_30px_90px_rgba(2,12,27,0.28)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_42%)]" />
          <div className="absolute -left-16 top-24 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute -right-10 bottom-10 h-48 w-48 rounded-full bg-orange-300/10 blur-3xl" />

          <div className="relative flex h-full flex-col">
            <header className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">{focusCopy.eyebrow}</p>
                <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{scenario}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
                  {scenarioDescription ?? focusCopy.objective}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {languageLabel && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                      {languageLabel}
                    </span>
                  )}
                  {mode && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                      {mode === 'free' ? 'Free mode' : 'Guided mode'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowTranscript((current) => !current)}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/15 xl:hidden"
                  >
                    <MessageSquareText className="h-3.5 w-3.5" />
                    Transcript
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onFeedback}
                className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/15"
              >
                Get Feedback
              </button>
            </header>

            <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
              <div className="relative w-full max-w-xl">
                <div className="absolute inset-x-16 top-14 h-56 rounded-full bg-cyan-300/10 blur-3xl" />
                <div className="relative mx-auto rounded-[2rem] border border-white/10 bg-white/8 px-8 pb-7 pt-10 backdrop-blur">
                  <div className={`mx-auto w-fit rounded-full p-4 transition-all duration-300 ${avatarGlowClass}`}>
                    <div
                      className={`flex h-56 w-56 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-b from-white/18 to-white/5 transition-all duration-300 sm:h-72 sm:w-72 ${portraitMotionClass}`}
                    >
                      {visibleAvatar.imageUrl ? (
                        <img
                          src={visibleAvatar.imageUrl}
                          alt={visibleAvatar.name}
                          className="h-full w-full object-cover object-center scale-[1.18] translate-y-2"
                        />
                      ) : (
                        <span className="text-7xl sm:text-8xl">{visibleAvatar.emoji}</span>
                      )}
                    </div>
                  </div>

                  <div className="mx-auto mt-6 max-w-md text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/55 px-4 py-1.5 text-xs font-medium text-white ring-1 ring-white/10 backdrop-blur">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      {visibleAvatar.name} • {visibleAvatar.role}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 max-w-2xl">
                <p className="text-sm uppercase tracking-[0.26em] text-cyan-200">Live status</p>
                <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{statusLabel}</h2>

                <div className="mt-6 flex items-end justify-center gap-2">
                  {waveformHeights.map((height, index) => (
                    <div
                      key={index}
                      className={`w-3 rounded-full bg-gradient-to-t from-orange-400 via-orange-300 to-cyan-200 transition-all duration-300 ${height} ${
                        characterState === 'speaking'
                          ? index % 2 === 0
                            ? 'animate-pulse'
                            : ''
                          : recorderState === 'recording'
                          ? index % 3 === 0
                            ? 'animate-pulse'
                            : ''
                          : ''
                      }`}
                    />
                  ))}
                </div>

                <div className="mt-8 rounded-[1.75rem] bg-white/10 p-5 text-left backdrop-blur">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-cyan-200">
                    <Compass className="h-3.5 w-3.5" />
                    Scene intent
                  </div>
                  <p className="mt-3 text-base leading-relaxed text-white">
                    {lastAvatarMessage?.text ?? introMessage ?? focusCopy.objective}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-auto space-y-4">
              {showTranscript && (
                <div className="rounded-[1.75rem] bg-white/10 p-4 backdrop-blur xl:hidden">
                  <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-cyan-200">
                    <MessageSquareText className="h-3.5 w-3.5" />
                    Transcript
                  </div>
                  <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
                    {messages.map((message, index) => (
                      <div
                        key={`${message.sender}-${index}`}
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          message.sender === 'user'
                            ? 'ml-8 bg-white/15 text-white'
                            : 'mr-8 bg-slate-950/40 text-slate-100'
                        }`}
                      >
                        <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-cyan-200/80">
                          {message.sender === 'user' ? 'You' : visibleAvatar.name}
                        </p>
                        <p>{message.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-[1.9rem] bg-white/12 p-4 backdrop-blur">
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
                    placeholder="Speak, or type a short reply if you need to..."
                    rows={3}
                    className="w-full resize-none rounded-[1.5rem] border border-white/10 bg-slate-950/25 px-5 py-4 text-base text-white placeholder:text-slate-300/70 outline-none transition-colors focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-200/30"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {vocabularyHints?.slice(0, 3).map((hint) => (
                        <span
                          key={hint}
                          className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white"
                        >
                          {hint}
                        </span>
                      ))}
                    </div>

                    <div className="text-sm text-slate-200">
                      {recorderState === 'recording'
                        ? 'Recording... tap stop when you are done'
                        : recorderState === 'transcribing'
                        ? 'Transcribing your answer...'
                        : isSending
                        ? 'Sending...'
                        : 'Voice first, text if needed'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={
                          recorderState === 'recording'
                            ? stopVoiceRecording
                            : () => void startVoiceRecording()
                        }
                        disabled={recorderState === 'transcribing' || isSending}
                        className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          recorderState === 'recording'
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-white text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {recorderState === 'recording' ? (
                          <>
                            <Square className="h-4 w-4" />
                            Stop recording
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4" />
                            Speak
                          </>
                        )}
                      </button>

                      {lastSpokenText && (
                        <button
                          type="button"
                          onClick={() => void playAvatarSpeech(lastSpokenText)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 font-medium text-white transition-colors hover:bg-white/15"
                        >
                          <Play className="h-4 w-4" />
                          Replay voice
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSending || recorderState !== 'idle' || !draft.trim()}
                      className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-medium text-white shadow-sm transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      Send answer
                    </button>
                  </div>
                </form>
              </div>

              {(error || audioError) && (
                <div className="space-y-3">
                  {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
                  {audioError && <ErrorMessage message={audioError} onRetry={() => setAudioError(null)} />}
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="hidden h-full flex-col rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-gray-200 xl:flex">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-orange-500">Transcript</p>
              <h3 className="mt-2 text-xl font-semibold text-gray-900">Secondary panel</h3>
            </div>
            <Volume2 className="h-5 w-5 text-gray-400" />
          </div>

          <div className="mt-5 flex-1 space-y-4 overflow-y-auto pr-1">
            {isLoadingHistory && (
              <div className="flex h-full items-center justify-center">
                <LoadingSpinner text="Loading conversation..." />
              </div>
            )}

            {!isLoadingHistory &&
              messages.map((message, index) => (
                <div
                  key={`${message.sender}-${index}`}
                  className={`rounded-2xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'ml-8 bg-[#EEF9F7] text-gray-900'
                      : 'mr-8 bg-slate-50 text-gray-900'
                  }`}
                >
                  <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-gray-400">
                    {message.sender === 'user' ? 'You' : visibleAvatar.name}
                  </p>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              ))}
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Cultural cue</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              {culturalTip ?? 'Listen for local cues, then keep your reply simple and natural.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
