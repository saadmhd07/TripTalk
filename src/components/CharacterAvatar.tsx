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

const officerEmotionStates = {
  neutral: {
    browL: 'M78 93 Q90 89 102 93',
    browR: 'M118 93 Q130 89 142 93',
    blush: 0,
    sweat: false,
    pupils: { lx: 91, ly: 109, rx: 131, ry: 109 },
  },
  smile: {
    browL: 'M78 91 Q90 87 102 91',
    browR: 'M118 91 Q130 87 142 91',
    blush: 0.3,
    sweat: false,
    pupils: { lx: 91, ly: 110, rx: 131, ry: 110 },
  },
  surprised: {
    browL: 'M76 86 Q90 80 102 86',
    browR: 'M118 86 Q130 80 144 86',
    blush: 0,
    sweat: true,
    pupils: { lx: 91, ly: 106, rx: 131, ry: 106 },
  },
  talking: {
    browL: 'M78 93 Q90 89 102 93',
    browR: 'M118 93 Q130 89 142 93',
    blush: 0,
    sweat: false,
    pupils: { lx: 91, ly: 109, rx: 131, ry: 109 },
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

  const state = emotionStates[emotion];
  const talkingRy = emotion === 'talking' ? 3 + Math.abs(Math.sin(frame * 0.25)) * 7 : 3;
  const talkingInnerRy = Math.max(1, talkingRy - 2);
  const eyeRy = isBlinking ? 1.6 : emotion === 'surprised' ? 12 : 11;
  const avatarTranslateY =
    emotion === 'talking' ? -1.5 : emotion === 'surprised' ? -2.5 : 0;

  if (avatarId === 'matias') {
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

  if (avatarId === 'oficial-ramirez') {
    const officerState = officerEmotionStates[emotion];
    const officerEyeRy = isBlinking ? 1.4 : emotion === 'surprised' ? 11 : 10;
    const officerPupilRy = isBlinking ? 0 : 6;
    const officerTranslateY =
      emotion === 'talking' ? -1 : emotion === 'surprised' ? -2 : 0;

    return (
      <svg
        viewBox="0 0 220 270"
        className="h-full w-full"
        role="img"
        aria-label={name}
        style={{ transform: `translateY(${officerTranslateY}px)` }}
      >
        <ellipse cx="110" cy="258" rx="70" ry="22" fill="#2C3E50" />
        <path
          d="M50 205 Q55 182 72 172 L110 184 L148 172 Q165 182 170 205 Q166 248 110 258 Q54 248 50 205Z"
          fill="#2C3E50"
        />
        <path d="M96 172 L110 192 L124 172 L117 168 L110 180 L103 168Z" fill="#ECF0F1" />
        <path d="M107 176 L110 198 L113 176 L111 173 L109 173Z" fill="#1A252F" />
        <rect x="52" y="178" width="28" height="6" rx="2" fill="#C0392B" />
        <rect x="52" y="186" width="28" height="6" rx="2" fill="#C0392B" />
        <rect x="140" y="178" width="28" height="6" rx="2" fill="#C0392B" />
        <rect x="140" y="186" width="28" height="6" rx="2" fill="#C0392B" />
        <rect x="58" y="196" width="36" height="22" rx="3" fill="#C0392B" />
        <rect x="60" y="198" width="32" height="18" rx="2" fill="#922B21" />
        <text x="76" y="208" textAnchor="middle" fontSize="6" fill="#F5B7B1" fontWeight="bold">
          PDI
        </text>
        <text x="76" y="215" textAnchor="middle" fontSize="5" fill="#F5B7B1">
          CHILE
        </text>
        <rect x="148" y="210" width="20" height="14" rx="2" fill="#7F8C8D" />
        <rect x="150" y="212" width="16" height="10" rx="1" fill="#C0392B" opacity="0.7" />
        <text x="158" y="220" textAnchor="middle" fontSize="5" fill="white" fontWeight="bold">
          ✓
        </text>
        <rect x="98" y="168" width="24" height="20" rx="4" fill="#A0724A" />
        <ellipse cx="110" cy="112" rx="50" ry="58" fill="#A0724A" />
        <ellipse cx="110" cy="66" rx="50" ry="20" fill="#1A1A1A" />
        <rect x="60" y="66" width="9" height="26" rx="4" fill="#1A1A1A" />
        <rect x="151" y="66" width="9" height="26" rx="4" fill="#1A1A1A" />
        <path d="M60 74 Q110 52 160 74 L157 80 Q110 62 63 80Z" fill="#1A252F" />
        <rect x="58" y="74" width="104" height="9" rx="2" fill="#1A252F" />
        <rect x="72" y="70" width="76" height="7" rx="2" fill="#2C3E50" />
        <rect x="96" y="64" width="28" height="13" rx="2" fill="#C0392B" />
        <ellipse cx="110" cy="70" rx="10" ry="5" fill="#922B21" />
        <text x="110" y="73" textAnchor="middle" fontSize="6" fill="#F5B7B1" fontWeight="bold">
          PDI
        </text>
        <path d="M58 83 Q110 92 162 83" stroke="#1A252F" strokeWidth="3" fill="none" />
        <ellipse cx="60" cy="114" rx="7" ry="10" fill="#8A6035" />
        <ellipse cx="160" cy="114" rx="7" ry="10" fill="#8A6035" />

        <g>
          <ellipse cx="90" cy="108" rx="10" ry={officerEyeRy} fill="white" />
          <ellipse cx="130" cy="108" rx="10" ry={officerEyeRy} fill="white" />
          {!isBlinking && (
            <>
              <ellipse
                cx={officerState.pupils.lx}
                cy={officerState.pupils.ly}
                rx="6"
                ry={officerPupilRy}
                fill="#1A1A1A"
              />
              <ellipse
                cx={officerState.pupils.rx}
                cy={officerState.pupils.ry}
                rx="6"
                ry={officerPupilRy}
                fill="#1A1A1A"
              />
            </>
          )}
          <path
            d={officerState.browL}
            stroke="#1A1A1A"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={officerState.browR}
            stroke="#1A1A1A"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        <path
          d="M107 120 Q110 132 113 120"
          stroke="#7A4A20"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M79 101 Q81 98 84 101" stroke="#7A4A20" strokeWidth="1" fill="none" opacity="0.4" />
        <path d="M136 101 Q138 98 141 101" stroke="#7A4A20" strokeWidth="1" fill="none" opacity="0.4" />

        <g transform="translate(110, 148)">
          {emotion === 'neutral' && (
            <path
              d="M-13 0 Q0 3 13 0"
              stroke="#5A2E0A"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {emotion === 'smile' && (
            <>
              <path
                d="M-14 -1 Q0 12 14 -1"
                stroke="#5A2E0A"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <path d="M-12 0 Q0 10 12 0 Z" fill="white" opacity="0.92" />
            </>
          )}

          {emotion === 'surprised' && (
            <>
              <ellipse cx="0" cy="4" rx="8" ry="10" fill="#5A2E0A" />
              <ellipse cx="0" cy="5" rx="5" ry="7" fill="#2A0E00" />
            </>
          )}

          {emotion === 'talking' && (
            <>
              <ellipse cx="0" cy="2" rx="10" ry={talkingRy} fill="#5A2E0A" />
              <ellipse cx="0" cy="3" rx="7" ry={talkingInnerRy} fill="#2A0E00" />
            </>
          )}
        </g>

        <ellipse cx="76" cy="132" rx="11" ry="7" fill="#D06060" opacity={officerState.blush} />
        <ellipse cx="144" cy="132" rx="11" ry="7" fill="#D06060" opacity={officerState.blush} />

        {officerState.sweat && (
          <g>
            <ellipse cx="158" cy="88" rx="5" ry="7" fill="#88CCFF" opacity="0.8" />
            <path d="M158 81 L155 88 L161 88 Z" fill="#88CCFF" opacity="0.8" />
          </g>
        )}
      </svg>
    );
  }

  return null;
}
