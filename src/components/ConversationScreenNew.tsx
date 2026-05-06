import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  MessageSquareText,
  Mic,
  Play,
  Send,
  Sparkles,
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
import { CharacterAvatar } from './CharacterAvatar';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';

interface Message {
  sender: 'user' | 'avatar';
  text: string;
}

type CharacterState = 'idle' | 'thinking' | 'speaking';
type RecorderState = 'idle' | 'recording' | 'transcribing';

interface AnimatedAvatarProps {
  visibleAvatar: ReturnType<typeof getConversationAvatarPresentation>;
  avatarGlowClass: string;
  portraitMotionClass: string;
  characterState: CharacterState;
  recorderState: RecorderState;
}

function AnimatedAvatar({
  visibleAvatar,
  avatarGlowClass,
  portraitMotionClass,
  characterState,
  recorderState,
}: AnimatedAvatarProps) {
  const isSpeaking = characterState === 'speaking';
  const isListening = recorderState === 'recording';

  return (
    <div className={`mx-auto w-fit rounded-full p-4 transition-all duration-300 ${avatarGlowClass}`}>
      <div
        className={`relative flex h-56 w-56 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-b from-white/18 to-white/5 transition-all duration-300 sm:h-72 sm:w-72 ${portraitMotionClass}`}
      >
        {visibleAvatar.imageUrl ? (
          <>
            <div
              className={`absolute inset-0 rounded-full ${
                isSpeaking
                  ? 'bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.18),transparent_45%)]'
                  : isListening
                  ? 'bg-[radial-gradient(circle_at_50%_25%,rgba(125,211,252,0.12),transparent_45%)]'
                  : 'bg-transparent'
              }`}
            />
            <img
              src={visibleAvatar.imageUrl}
              alt={visibleAvatar.name}
              className="h-full w-full object-cover object-center scale-[1.16] translate-y-3"
            />
          </>
        ) : visibleAvatar.avatarId ? (
          <CharacterAvatar
            avatarId={visibleAvatar.avatarId}
            name={visibleAvatar.name}
            characterState={characterState}
            recorderState={recorderState}
          />
        ) : (
          <span className="text-7xl sm:text-8xl">{visibleAvatar.emoji}</span>
        )}
      </div>
    </div>
  );
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
  actionError?: string | null;
  isCompletingSession?: boolean;
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
  actionError,
  isCompletingSession = false,
  onBackToExplorer,
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
      ? 'shadow-[0_0_90px_rgba(249,115,22,0.36)] ring-8 ring-orange-200/80'
      : recorderState === 'recording'
      ? 'shadow-[0_0_90px_rgba(245,158,11,0.34)] ring-8 ring-amber-200/85'
      : characterState === 'thinking'
      ? 'shadow-[0_0_70px_rgba(251,191,36,0.22)] ring-8 ring-orange-100'
      : 'shadow-[0_24px_70px_rgba(120,53,15,0.16)] ring-8 ring-white/90';

  const statusLabel =
    characterState === 'speaking'
      ? `${visibleAvatar.name} is speaking`
      : recorderState === 'recording'
      ? 'Listening to your answer'
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
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_340px]">
        <section className="relative overflow-hidden rounded-[2.4rem] border border-orange-100 bg-[linear-gradient(180deg,#FFF8F0_0%,#FFF3E3_48%,#FFE7CC_100%)] p-6 text-slate-900 shadow-[0_28px_90px_rgba(154,52,18,0.12)] sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),transparent_42%)]" />
          <div className="absolute -left-16 top-16 h-56 w-56 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-rose-200/20 blur-3xl" />

          <div className="relative flex h-full flex-col">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <button
                  type="button"
                  onClick={onBackToExplorer}
                  className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:bg-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to scenarios
                </button>
                <p className="mt-5 text-xs uppercase tracking-[0.32em] text-orange-600">
                  {focusCopy.eyebrow}
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                  {scenario}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  {scenarioDescription ?? focusCopy.objective}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {languageLabel && (
                    <span className="rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700">
                      {languageLabel}
                    </span>
                  )}
                  {mode && (
                    <span className="rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700">
                      {mode === 'free' ? 'Free mode' : 'Guided mode'}
                    </span>
                  )}
                  <span className="rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700">
                    Focus: immigration checkpoint
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTranscript((current) => !current)}
                    className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-orange-300 hover:bg-white xl:hidden"
                  >
                    <MessageSquareText className="h-3.5 w-3.5" />
                    Transcript
                  </button>
                </div>
              </div>

              <div className="w-full max-w-sm rounded-[2rem] border border-orange-200 bg-white/88 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-orange-600">Key outcome</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Finish the checkpoint, then review how natural and credible your answers sounded.
                </p>
                <button
                  type="button"
                  onClick={onFeedback}
                  disabled={isCompletingSession}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[1.3rem] bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(249,115,22,0.26)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Sparkles className="h-5 w-5" />
                  {isCompletingSession ? 'Closing session...' : 'Finish and get feedback'}
                </button>
              </div>
            </header>

            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_360px] xl:items-start">
              <div className="relative">
                <div className="absolute inset-x-12 top-10 h-56 rounded-full bg-orange-200/45 blur-3xl" />
                <div className="relative rounded-[2.4rem] border border-white/80 bg-white/70 px-8 pb-8 pt-10 text-center shadow-[0_24px_60px_rgba(120,53,15,0.12)] backdrop-blur">
                  <AnimatedAvatar
                    visibleAvatar={visibleAvatar}
                    avatarGlowClass={avatarGlowClass}
                    portraitMotionClass={portraitMotionClass}
                    characterState={characterState}
                    recorderState={recorderState}
                  />

                  <div className="mx-auto mt-6 max-w-md text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      {visibleAvatar.name} • {visibleAvatar.role}
                    </div>
                  </div>

                  <div className="mx-auto mt-8 max-w-xl rounded-[1.8rem] border border-orange-100 bg-[#FFF8F2] px-6 py-5 text-left shadow-inner">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-orange-600">
                      {visibleAvatar.name} just said
                    </p>
                    <p className="mt-3 text-lg leading-relaxed text-slate-900">
                      {lastAvatarMessage?.text ?? introMessage ?? focusCopy.objective}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[2rem] border border-orange-100 bg-white/88 p-5 text-center shadow-sm">
                  <p className="text-sm uppercase tracking-[0.24em] text-orange-600">Live status</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-900">{statusLabel}</h2>

                  <div className="mt-5 flex items-end justify-center gap-2">
                    {waveformHeights.map((height, index) => (
                      <div
                        key={index}
                        className={`w-3 rounded-full bg-gradient-to-t from-orange-500 via-amber-400 to-orange-200 transition-all duration-300 ${height} ${
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

                  <button
                    type="button"
                    onClick={
                      recorderState === 'recording'
                        ? stopVoiceRecording
                        : () => void startVoiceRecording()
                    }
                    disabled={recorderState === 'transcribing' || isSending}
                    className={`mx-auto mt-6 flex h-24 w-24 items-center justify-center rounded-full border-8 text-white shadow-[0_18px_45px_rgba(249,115,22,0.28)] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      recorderState === 'recording'
                        ? 'border-red-200 bg-red-500 hover:bg-red-600'
                        : 'border-orange-100 bg-gradient-to-br from-orange-500 to-orange-600 hover:scale-[1.02]'
                    }`}
                  >
                    {recorderState === 'recording' ? (
                      <Square className="h-8 w-8" />
                    ) : (
                      <Mic className="h-8 w-8" />
                    )}
                  </button>

                  <p className="mt-4 text-base font-medium text-slate-700">
                    {recorderState === 'recording'
                      ? 'Tap to stop recording'
                      : recorderState === 'transcribing'
                      ? 'Transcribing your answer...'
                      : 'Speak first'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{focusCopy.pressure}</p>
                </div>

                <div className="rounded-[2rem] border border-orange-100 bg-white/92 p-5 text-left shadow-sm">
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
                      placeholder="Type your answer if you prefer, or use the mic..."
                      rows={5}
                      className="w-full resize-none rounded-[1.4rem] border border-orange-100 bg-[#FFF8F2] px-5 py-4 text-base text-slate-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200/60"
                    />

                    <div className="flex flex-wrap gap-2">
                      {vocabularyHints?.slice(0, 3).map((hint) => (
                        <span
                          key={hint}
                          className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700"
                        >
                          {hint}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {lastSpokenText && (
                        <button
                          type="button"
                          onClick={() => void playAvatarSpeech(lastSpokenText)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-3 font-medium text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
                        >
                          <Play className="h-4 w-4" />
                          Replay voice
                        </button>
                      )}

                      <div className="text-sm text-slate-500">
                        {isSending
                          ? 'Sending...'
                          : recorderState === 'transcribing'
                          ? 'Transcribing your answer...'
                          : 'Use voice first, text if needed'}
                      </div>

                      <button
                        type="submit"
                        disabled={isSending || recorderState !== 'idle' || !draft.trim()}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                        Send answer
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className="relative mt-auto space-y-4">
              {showTranscript && (
                <div className="rounded-[1.75rem] border border-orange-100 bg-white/80 p-4 xl:hidden">
                  <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-orange-600">
                    <MessageSquareText className="h-3.5 w-3.5" />
                    Transcript
                  </div>
                  <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
                    {messages.map((message, index) => (
                      <div
                        key={`${message.sender}-${index}`}
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                          message.sender === 'user'
                            ? 'ml-8 bg-orange-50 text-slate-900'
                            : 'mr-8 bg-white text-slate-900'
                        }`}
                      >
                        <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-orange-500/80">
                          {message.sender === 'user' ? 'You' : visibleAvatar.name}
                        </p>
                        <p>{message.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(actionError || error || audioError) && (
                <div className="space-y-3">
                  {actionError && <ErrorMessage message={actionError} />}
                  {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
                  {audioError && <ErrorMessage message={audioError} onRetry={() => setAudioError(null)} />}
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="hidden h-full flex-col rounded-[2rem] border border-orange-100 bg-white p-5 shadow-sm xl:flex">
          <div className="flex items-center justify-between gap-3 border-b border-orange-100 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-orange-500">Transcript</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Conversation log</h3>
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
                  className={`rounded-2xl px-4 py-3 shadow-sm ${
                    message.sender === 'user'
                      ? 'ml-8 bg-[#EEF9F7] text-gray-900'
                      : 'mr-8 bg-orange-50 text-gray-900'
                  }`}
                >
                  <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-gray-400">
                    {message.sender === 'user' ? 'You' : visibleAvatar.name}
                  </p>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              ))}
          </div>

          <div className="mt-5 rounded-[1.75rem] border border-orange-100 bg-[#FFF8F2] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-orange-600">Cultural cue</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {culturalTip ?? 'Listen for local cues, then keep your reply simple and natural.'}
            </p>
            <div className="mt-4 rounded-2xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Pressure line</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{focusCopy.pressure}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
