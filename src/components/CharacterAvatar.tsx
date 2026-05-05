import { useEffect, useMemo, useState } from 'react';

type CharacterState = 'idle' | 'thinking' | 'speaking';
type RecorderState = 'idle' | 'recording' | 'transcribing';

interface CharacterAvatarProps {
  avatarId?: string;
  name: string;
  characterState: CharacterState;
  recorderState: RecorderState;
}

type Emotion = 'neutral' | 'smile' | 'surprised' | 'talking';

const emotionStates = {
  neutral: {
    browL: 'M68 90 Q80 85 92 90',
    browR: 'M108 90 Q120 85 132 90',
    blush: 0,
    sweat: false,
    pupils: { lx: 81, ly: 106, rx: 121, ry: 106 },
  },
  smile: {
    browL: 'M68 88 Q80 83 92 88',
    browR: 'M108 88 Q120 83 132 88',
    blush: 0.35,
    sweat: false,
    pupils: { lx: 81, ly: 107, rx: 121, ry: 107 },
  },
  surprised: {
    browL: 'M66 84 Q80 78 92 84',
    browR: 'M108 84 Q120 78 134 84',
    blush: 0,
    sweat: true,
    pupils: { lx: 81, ly: 104, rx: 121, ry: 104 },
  },
  talking: {
    browL: 'M68 90 Q80 85 92 90',
    browR: 'M108 90 Q120 85 132 90',
    blush: 0,
    sweat: false,
    pupils: { lx: 81, ly: 106, rx: 121, ry: 106 },
  },
} as const;

function resolveEmotion(
  characterState: CharacterState,
  recorderState: RecorderState
): Emotion {
  if (characterState === 'speaking') {
    return 'talking';
  }
  if (recorderState === 'recording') {
    return 'surprised';
  }
  if (characterState === 'thinking' || recorderState === 'transcribing') {
    return 'smile';
  }
  return 'neutral';
}

export function CharacterAvatar({
  avatarId,
  name,
  characterState,
  recorderState,
}: CharacterAvatarProps) {
  const [frame, setFrame] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  const emotion = useMemo(
    () => resolveEmotion(characterState, recorderState),
    [characterState, recorderState]
  );

  useEffect(() => {
    if (emotion !== 'talking') {
      setFrame(0);
      return;
    }

    const interval = window.setInterval(() => {
      setFrame((current) => current + 1);
    }, 60);

    return () => window.clearInterval(interval);
  }, [emotion]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIsBlinking(true);
      window.setTimeout(() => setIsBlinking(false), 130);
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  if (avatarId !== 'matias') {
    return null;
  }

  const state = emotionStates[emotion];
  const talkingRy = emotion === 'talking' ? 3 + Math.abs(Math.sin(frame * 0.25)) * 7 : 3;
  const talkingInnerRy = Math.max(1, talkingRy - 2);
  const eyeRy = isBlinking ? 1.6 : emotion === 'surprised' ? 12 : 11;
  const avatarTranslateY =
    emotion === 'talking' ? -1.5 : emotion === 'surprised' ? -2.5 : 0;

  return (
    <svg
      viewBox="0 0 200 220"
      className="h-full w-full"
      role="img"
      aria-label={name}
      style={{ transform: `translateY(${avatarTranslateY}px)` }}
    >
      <rect x="85" y="168" width="30" height="22" rx="4" fill="#C68642" />
      <ellipse cx="100" cy="210" rx="55" ry="22" fill="#2D2D2D" />
      <ellipse cx="100" cy="110" rx="52" ry="60" fill="#C68642" />
      <ellipse cx="100" cy="64" rx="52" ry="26" fill="#1A1A1A" />
      <rect x="48" y="64" width="12" height="36" rx="6" fill="#1A1A1A" />
      <rect x="140" y="64" width="12" height="36" rx="6" fill="#1A1A1A" />
      <ellipse cx="48" cy="112" rx="7" ry="10" fill="#B87333" />
      <ellipse cx="152" cy="112" rx="7" ry="10" fill="#B87333" />

      <g>
        <ellipse cx="80" cy="105" rx="10" ry={eyeRy} fill="white" />
        <ellipse cx="120" cy="105" rx="10" ry={eyeRy} fill="white" />
        {!isBlinking && (
          <>
            <ellipse cx={state.pupils.lx} cy={state.pupils.ly} rx="6" ry="7" fill="#1A1A1A" />
            <ellipse cx={state.pupils.rx} cy={state.pupils.ry} rx="6" ry="7" fill="#1A1A1A" />
          </>
        )}
        <path d={state.browL} stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d={state.browR} stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>

      <path
        d="M97 115 Q100 128 103 115"
        stroke="#A0622A"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      <g transform="translate(100, 148)">
        {emotion === 'neutral' && (
          <path
            d="M-14 0 Q0 4 14 0"
            stroke="#7A3B1E"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {emotion === 'smile' && (
          <>
            <path
              d="M-16 -2 Q0 14 16 -2"
              stroke="#7A3B1E"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M-14 0 Q0 10 14 0 Z" fill="white" opacity="0.92" />
          </>
        )}

        {emotion === 'surprised' && (
          <>
            <ellipse cx="0" cy="4" rx="10" ry="12" fill="#7A3B1E" />
            <ellipse cx="0" cy="4" rx="7" ry="9" fill="#3A1A0A" />
          </>
        )}

        {emotion === 'talking' && (
          <>
            <ellipse cx="0" cy="2" rx="12" ry={talkingRy} fill="#7A3B1E" />
            <ellipse cx="0" cy="3" rx="9" ry={talkingInnerRy} fill="#3A1A0A" />
          </>
        )}
      </g>

      <ellipse cx="68" cy="130" rx="12" ry="7" fill="#E07070" opacity={state.blush} />
      <ellipse cx="132" cy="130" rx="12" ry="7" fill="#E07070" opacity={state.blush} />

      {state.sweat && (
        <g>
          <ellipse cx="148" cy="88" rx="5" ry="7" fill="#88CCFF" opacity="0.8" />
          <path d="M148 81 L145 88 L151 88 Z" fill="#88CCFF" opacity="0.8" />
        </g>
      )}
    </svg>
  );
}
