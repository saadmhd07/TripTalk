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
  cupName?: string | null;
}

function AnimatedAvatar({
  visibleAvatar,
  avatarGlowClass,
  portraitMotionClass,
  characterState,
  recorderState,
  cupName,
}: AnimatedAvatarProps) {
  const isSpeaking = characterState === 'speaking';
  const isListening = recorderState === 'recording';
  const stageClass =
    visibleAvatar.avatarId === 'oficial-ramirez'
      ? 'bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(220,232,242,0.96)_52%,rgba(191,207,220,0.9)_100%)]'
      : 'bg-gradient-to-b from-white/18 to-white/5';

  return (
    <div className={`mx-auto w-fit rounded-full p-4 transition-all duration-300 ${avatarGlowClass}`}>
      <div
        className={`relative flex h-56 w-56 items-center justify-center overflow-hidden rounded-full border border-white/70 transition-all duration-300 sm:h-72 sm:w-72 ${stageClass} ${portraitMotionClass}`}
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
            cupName={cupName ?? undefined}
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
  avatarId?: string | null;
  userDisplayName?: string | null;
  userEmail?: string | null;
  actionError?: string | null;
  sessionStatus?: 'active' | 'completed' | 'abandoned';
  isCompletingSession?: boolean;
  onBackToExplorer: () => void;
  onFeedback: () => void;
  onSessionCompleted?: () => void;
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
  avatarId,
  userDisplayName,
  userEmail,
  actionError,
  sessionStatus = 'active',
  isCompletingSession = false,
  onBackToExplorer,
  onFeedback,
  onSessionCompleted,
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
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [isCheckpointComplete, setIsCheckpointComplete] = useState(sessionStatus === 'completed');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const hasAutoPlayedInitialMessageRef = useRef(false);
  const desktopTranscriptRef = useRef<HTMLDivElement | null>(null);
  const mobileTranscriptRef = useRef<HTMLDivElement | null>(null);

  const visibleAvatar = getConversationAvatarPresentation(
    country,
    avatarId || undefined,
    partnerName || undefined,
    partnerRole || undefined
  );
  const cupName =
    userDisplayName?.trim() ||
    userEmail?.split('@')[0]?.replace(/[._-]+/g, ' ').trim() ||
    null;
  const languageLabel = languageCode ? getLanguageLabel(languageCode) : null;
  const focusCopy = getScenarioFocusCopy(scenarioSlug);
  const lastAvatarMessage = useMemo(
    () => [...messages].reverse().find((message) => message.sender === 'avatar') ?? null,
    [messages]
  );

  useEffect(() => {
    setIsCheckpointComplete(sessionStatus === 'completed');
  }, [sessionStatus]);

  useEffect(() => {
    if (isCheckpointComplete) {
      setShowTextFallback(false);
    }
  }, [isCheckpointComplete]);

  function hasAutoPlayedInitialMessage() {
    if (hasAutoPlayedInitialMessageRef.current) {
      return true;
    }

    try {
      return window.sessionStorage.getItem(`triptalk-initial-autoplay:${sessionId}`) === '1';
    } catch {
      return false;
    }
  }

  function markInitialMessageAutoPlayed() {
    hasAutoPlayedInitialMessageRef.current = true;

    try {
      window.sessionStorage.setItem(`triptalk-initial-autoplay:${sessionId}`, '1');
    } catch {
      // Ignore sessionStorage failures and keep the in-memory guard.
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadMessages() {
      try {
        const data = await fetchConversationMessages(sessionId);
        if (!ignore) {
          if (data.length === 0 && introMessage) {
            setMessages([{ sender: 'avatar', text: introMessage }]);
            if (!hasAutoPlayedInitialMessage()) {
              markInitialMessageAutoPlayed();
              void playAvatarSpeech(introMessage);
            }
          } else {
            const mappedMessages = data.map((message) => ({
              sender: message.role === 'user' ? 'user' : 'avatar',
              text: message.content,
            }));
            setMessages(mappedMessages);
            const lastAssistantMessage = [...data]
              .reverse()
              .find((message) => message.role === 'assistant');
            setLastSpokenText(lastAssistantMessage?.content ?? null);

            if (
              data.length === 1 &&
              data[0].role === 'assistant' &&
              !hasAutoPlayedInitialMessage()
            ) {
              markInitialMessageAutoPlayed();
              void playAvatarSpeech(data[0].content);
            }
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

  useEffect(() => {
    const scrollToBottom = (element: HTMLDivElement | null) => {
      if (!element) {
        return;
      }
      element.scrollTop = element.scrollHeight;
    };

    scrollToBottom(desktopTranscriptRef.current);
    scrollToBottom(mobileTranscriptRef.current);
  }, [messages, isLoadingHistory, showTranscript]);

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
    if (recorderState !== 'idle' || isCheckpointComplete) {
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
          await sendMessageContent(transcript, { restoreDraftOnError: true });
        } catch {
          setError('Voice transcription is unavailable right now.');
          setCharacterState('idle');
        } finally {
          setRecorderState('idle');
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

  async function sendMessageContent(content: string, options?: { restoreDraftOnError?: boolean }) {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSending || isCheckpointComplete) {
      return;
    }

    setIsSending(true);
    setError(null);
    setAudioError(null);
    setCharacterState('thinking');

    try {
      const exchange = await sendConversationMessage(sessionId, trimmedContent);
      const assistantReply = exchange.messages.find((message) => message.role === 'assistant');
      const nextMessages = [
        ...messages,
        ...exchange.messages.map((message: MessageApiItem) => ({
          sender: message.role === 'user' ? 'user' : 'avatar',
          text: message.content,
        })),
      ];

      setMessages(nextMessages);
      setDraft('');

      if (assistantReply?.content) {
        if (exchange.session_status === 'completed') {
          setIsCheckpointComplete(true);
          onSessionCompleted?.();
        }
        void playAvatarSpeech(assistantReply.content);
      } else {
        setCharacterState('idle');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      setError(message);
      if (options?.restoreDraftOnError) {
        setDraft(trimmedContent);
        setShowTextFallback(true);
      }
      setCharacterState('idle');
    } finally {
      setIsSending(false);
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessageContent(draft);
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
  const activeStatusCopy =
    isCheckpointComplete
      ? 'Checkpoint complete'
      : recorderState === 'recording'
      ? 'Listening... tap to stop'
      : recorderState === 'transcribing'
      ? 'Transcribing...'
      : isSending
      ? 'Sending your answer...'
      : characterState === 'speaking'
      ? `${visibleAvatar.name} is speaking`
      : characterState === 'thinking'
      ? 'Thinking...'
      : null;
  const showFallbackInput =
    !isCheckpointComplete &&
    (showTextFallback || draft.trim().length > 0 || recorderState === 'transcribing');

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="relative overflow-hidden rounded-[2.4rem] border border-orange-100 bg-[linear-gradient(180deg,#FFF7ED_0%,#FFEED8_55%,#FFE5C2_100%)] p-5 shadow-[0_28px_90px_rgba(154,52,18,0.12)] sm:p-6 xl:h-[calc(100vh-4rem)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.82),transparent_42%)]" />
          <div className="absolute inset-x-24 top-20 h-72 rounded-full bg-orange-200/40 blur-3xl" />
          <div className="absolute -right-10 bottom-8 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />

          <div className="relative flex min-h-[calc(100vh-9rem)] flex-col">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onBackToExplorer}
                    className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:bg-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to scenarios
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTranscript((current) => !current)}
                    className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:bg-white xl:hidden"
                  >
                    <MessageSquareText className="h-4 w-4" />
                    Transcript
                  </button>
                </div>

                <p className="mt-4 text-xs uppercase tracking-[0.3em] text-orange-600">
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
                </div>
              </div>

              <button
                type="button"
                onClick={onFeedback}
                disabled={isCompletingSession}
                className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                {isCompletingSession ? 'Closing session...' : 'End session'}
              </button>
            </header>

            <div className="mt-6 flex flex-1 flex-col justify-between">
              <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-5xl">
                  <div className="relative overflow-hidden rounded-[2.6rem] border border-white/70 bg-white/38 px-6 pb-8 pt-8 text-center shadow-[0_26px_70px_rgba(120,53,15,0.14)] backdrop-blur">
                    <div className="absolute inset-x-10 top-10 h-56 rounded-full bg-white/35 blur-3xl" />
                    <div className="relative">
                      <AnimatedAvatar
                        visibleAvatar={visibleAvatar}
                        avatarGlowClass={avatarGlowClass}
                        portraitMotionClass={portraitMotionClass}
                        characterState={characterState}
                        recorderState={recorderState}
                        cupName={cupName}
                      />

                      <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                        {visibleAvatar.name} • {visibleAvatar.role}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[2rem] border border-orange-100 bg-white/90 p-5 shadow-sm">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
                  <div className="space-y-4">
                    <div className="rounded-[1.8rem] bg-[#FFF8F2] px-5 py-4 text-slate-900 shadow-inner">
                      <p className="text-lg leading-relaxed">
                        {lastAvatarMessage?.text ?? introMessage ?? focusCopy.objective}
                      </p>
                    </div>

                    {vocabularyHints && vocabularyHints.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {vocabularyHints.slice(0, 4).map((hint) => (
                          <span
                            key={hint}
                            className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-orange-700"
                          >
                            {hint}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
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

                    {activeStatusCopy && (
                      <p className="text-center text-sm font-medium text-slate-600">
                        {activeStatusCopy}
                      </p>
                    )}

                    {isCheckpointComplete ? (
                      <div className="space-y-3 text-center">
                        <p className="text-sm font-medium text-emerald-700">
                          Checkpoint complete. You can review your feedback now.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                          {lastSpokenText ? (
                            <button
                              type="button"
                              onClick={() => void playAvatarSpeech(lastSpokenText)}
                              className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-orange-200 bg-white text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
                              aria-label="Replay voice"
                            >
                              <Play className="h-5 w-5" />
                            </button>
                          ) : (
                            <div aria-hidden="true" className="h-14 w-14" />
                          )}
                          <button
                            type="button"
                            onClick={onFeedback}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
                          >
                            <Sparkles className="h-4 w-4" />
                            See feedback
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-[56px_96px_56px] items-center justify-center gap-4">
                          {lastSpokenText ? (
                            <button
                              type="button"
                              onClick={() => void playAvatarSpeech(lastSpokenText)}
                              className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-orange-200 bg-white text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
                              aria-label="Replay voice"
                            >
                              <Play className="h-5 w-5" />
                            </button>
                          ) : (
                            <div aria-hidden="true" className="h-14 w-14" />
                          )}

                          <button
                            type="button"
                            onPointerDown={(event) => {
                              event.preventDefault();
                              if (recorderState === 'idle') {
                                void startVoiceRecording();
                              }
                            }}
                            onPointerUp={(event) => {
                              event.preventDefault();
                              if (recorderState === 'recording') {
                                stopVoiceRecording();
                              }
                            }}
                            onPointerLeave={() => {
                              if (recorderState === 'recording') {
                                stopVoiceRecording();
                              }
                            }}
                            onPointerCancel={() => {
                              if (recorderState === 'recording') {
                                stopVoiceRecording();
                              }
                            }}
                            disabled={recorderState === 'transcribing' || isSending}
                            className={`flex h-24 w-24 items-center justify-center rounded-full border-8 text-white shadow-[0_20px_45px_rgba(249,115,22,0.3)] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              recorderState === 'recording'
                                ? 'border-red-200 bg-red-500 hover:bg-red-600'
                                : 'border-orange-100 bg-gradient-to-br from-orange-500 to-orange-600 hover:scale-[1.02]'
                            }`}
                            aria-label={recorderState === 'recording' ? 'Release to send voice message' : 'Hold to speak'}
                          >
                            {recorderState === 'recording' ? (
                              <Square className="h-8 w-8" />
                            ) : (
                              <Mic className="h-8 w-8" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowTextFallback((current) => !current)}
                            className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-orange-200 bg-white text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
                            aria-label={showFallbackInput ? 'Hide text fallback' : 'Open text fallback'}
                          >
                            <MessageSquareText className="h-5 w-5" />
                          </button>
                        </div>

                        <p className="text-center text-sm text-slate-500">{focusCopy.pressure}</p>
                      </>
                    )}
                  </div>
                </div>

                {showFallbackInput && (
                  <div className="mt-5 rounded-[1.8rem] border border-orange-100 bg-[#FFF8F2] p-4">
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
                        placeholder="Fallback text input if you prefer not to speak..."
                        rows={4}
                        className="w-full resize-none rounded-[1.4rem] border border-orange-100 bg-white px-5 py-4 text-base text-slate-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200/60"
                      />

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-slate-500">
                          {isSending
                            ? 'Sending...'
                            : recorderState === 'transcribing'
                            ? 'Transcribing your answer...'
                            : 'Text is fallback only. Voice is primary.'}
                        </div>

                        <button
                          type="submit"
                          disabled={isSending || recorderState !== 'idle' || !draft.trim()}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                          Send answer
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {showTranscript && (
              <div className="mt-5 rounded-[1.8rem] border border-orange-100 bg-white/88 p-4 xl:hidden">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-orange-600">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  Transcript
                </div>
                <div
                  ref={mobileTranscriptRef}
                  className="max-h-64 space-y-3 overflow-y-auto pr-1"
                >
                  {messages.map((message, index) => (
                    <div
                      key={`${message.sender}-${index}`}
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        message.sender === 'user'
                          ? 'ml-8 bg-[#EEF9F7] text-slate-900'
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
              <div className="mt-5 space-y-3">
                {actionError && <ErrorMessage message={actionError} />}
                {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
                {audioError && <ErrorMessage message={audioError} onRetry={() => setAudioError(null)} />}
              </div>
            )}
          </div>
        </section>

        <aside className="hidden rounded-[2rem] border border-orange-100 bg-white p-5 shadow-sm xl:flex xl:h-[calc(100vh-4rem)] xl:flex-col xl:overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-orange-100 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-orange-500">Transcript</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Conversation log</h3>
            </div>
            <Volume2 className="h-5 w-5 text-gray-400" />
          </div>

          <div
            ref={desktopTranscriptRef}
            className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1"
          >
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
                      ? 'ml-8 bg-[#EEF9F7] text-slate-900'
                      : 'mr-8 bg-orange-50 text-slate-900'
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
