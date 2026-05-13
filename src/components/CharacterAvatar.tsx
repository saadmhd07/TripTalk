import { useEffect, useMemo, useState } from 'react';

type CharacterState = 'idle' | 'thinking' | 'speaking';
type RecorderState = 'idle' | 'recording' | 'transcribing';

interface CharacterAvatarProps {
  avatarId?: string;
  name: string;
  cupName?: string;
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

const bakeryEmotionStates = {
  neutral: {
    browL: 'M76 92 Q88 87 100 92',
    browR: 'M120 92 Q132 87 144 92',
    blush: 0.18,
    sweat: false,
    pupils: { lx: 89, ly: 109, rx: 133, ry: 109 },
  },
  smile: {
    browL: 'M76 90 Q88 85 100 90',
    browR: 'M120 90 Q132 85 144 90',
    blush: 0.3,
    sweat: false,
    pupils: { lx: 89, ly: 110, rx: 133, ry: 110 },
  },
  surprised: {
    browL: 'M74 85 Q88 78 100 85',
    browR: 'M120 85 Q132 78 146 85',
    blush: 0.18,
    sweat: true,
    pupils: { lx: 89, ly: 106, rx: 133, ry: 106 },
  },
  talking: {
    browL: 'M76 92 Q88 87 100 92',
    browR: 'M120 92 Q132 87 144 92',
    blush: 0.18,
    sweat: false,
    pupils: { lx: 89, ly: 109, rx: 133, ry: 109 },
  },
} as const;

const chileBaristaEmotionStates = {
  neutral: {
    browL: 'M76 89 Q88 84 100 89',
    browR: 'M120 89 Q132 84 144 89',
    blush: 0,
    sweat: false,
    pupils: { lx: 89, ly: 107, rx: 133, ry: 107 },
  },
  smile: {
    browL: 'M76 87 Q88 82 100 87',
    browR: 'M120 87 Q132 82 144 87',
    blush: 0.35,
    sweat: false,
    pupils: { lx: 89, ly: 108, rx: 133, ry: 108 },
  },
  surprised: {
    browL: 'M74 82 Q88 75 100 82',
    browR: 'M120 82 Q132 75 146 82',
    blush: 0,
    sweat: true,
    pupils: { lx: 89, ly: 104, rx: 133, ry: 104 },
  },
  talking: {
    browL: 'M76 89 Q88 84 100 89',
    browR: 'M120 89 Q132 84 144 89',
    blush: 0,
    sweat: false,
    pupils: { lx: 89, ly: 107, rx: 133, ry: 107 },
  },
} as const;

const parisServerEmotionStates = {
  neutral: {
    browL: 'M77 90 Q88 87 100 90',
    browR: 'M120 90 Q132 87 143 90',
    blush: 0,
    sweat: false,
    pupils: { lx: 89, ly: 107, rx: 133, ry: 107 },
  },
  smile: {
    browL: 'M77 88 Q88 85 100 88',
    browR: 'M120 88 Q132 85 143 88',
    blush: 0.25,
    sweat: false,
    pupils: { lx: 89, ly: 108, rx: 133, ry: 108 },
  },
  surprised: {
    browL: 'M75 84 Q88 78 100 84',
    browR: 'M120 84 Q132 78 145 84',
    blush: 0,
    sweat: true,
    pupils: { lx: 89, ly: 104, rx: 133, ry: 104 },
  },
  talking: {
    browL: 'M77 90 Q88 87 100 90',
    browR: 'M120 90 Q132 87 143 90',
    blush: 0,
    sweat: false,
    pupils: { lx: 89, ly: 107, rx: 133, ry: 107 },
  },
} as const;

const nycBaristaEmotionStates = {
  neutral: {
    browL: 'M76 90 Q88 85 101 90',
    browR: 'M119 90 Q132 85 144 90',
    blush: 0,
    sweat: false,
    pupils: { lx: 89, ly: 108, rx: 133, ry: 108 },
  },
  smile: {
    browL: 'M76 88 Q88 83 101 88',
    browR: 'M119 88 Q132 83 144 88',
    blush: 0.4,
    sweat: false,
    pupils: { lx: 89, ly: 109, rx: 133, ry: 109 },
  },
  surprised: {
    browL: 'M74 83 Q88 76 101 83',
    browR: 'M119 83 Q132 76 146 83',
    blush: 0,
    sweat: true,
    pupils: { lx: 89, ly: 105, rx: 133, ry: 105 },
  },
  talking: {
    browL: 'M76 90 Q88 85 101 90',
    browR: 'M119 90 Q132 85 144 90',
    blush: 0,
    sweat: false,
    pupils: { lx: 89, ly: 108, rx: 133, ry: 108 },
  },
} as const;

const hotelReceptionistEmotionStates = {
  neutral: {
    browL: 'M77 90 Q88 86 101 90',
    browR: 'M119 90 Q132 86 143 90',
    blush: 0,
    sweat: false,
    pupils: { lx: 89, ly: 108, rx: 133, ry: 108 },
  },
  smile: {
    browL: 'M77 88 Q88 84 101 88',
    browR: 'M119 88 Q132 84 143 88',
    blush: 0.35,
    sweat: false,
    pupils: { lx: 89, ly: 109, rx: 133, ry: 109 },
  },
  surprised: {
    browL: 'M75 84 Q88 78 101 84',
    browR: 'M119 84 Q132 78 145 84',
    blush: 0,
    sweat: true,
    pupils: { lx: 89, ly: 105, rx: 133, ry: 105 },
  },
  talking: {
    browL: 'M77 90 Q88 86 101 90',
    browR: 'M119 90 Q132 86 143 90',
    blush: 0,
    sweat: false,
    pupils: { lx: 89, ly: 108, rx: 133, ry: 108 },
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
  cupName,
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
  const normalizedCupName = (cupName || name || '?').trim().toUpperCase().slice(0, 8) || '?';

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

  if (avatarId === 'nathalie') {
    const bakeryState = bakeryEmotionStates[emotion];
    const bakeryEyeRy = isBlinking ? 1.4 : emotion === 'surprised' ? 11 : 10;
    const bakeryPupilRy = isBlinking ? 0 : 7;
    const bakeryTranslateY =
      emotion === 'talking' ? -1 : emotion === 'surprised' ? -2 : 0;

    return (
      <svg
        viewBox="0 0 220 280"
        className="h-full w-full"
        role="img"
        aria-label={name}
        style={{ transform: `translateY(${bakeryTranslateY}px)` }}
      >
        <ellipse cx="110" cy="268" rx="65" ry="20" fill="#4a4a4a" />
        <path
          d="M55 215 Q58 188 74 176 L110 188 L146 176 Q162 188 165 215 Q162 255 110 265 Q58 255 55 215Z"
          fill="#2c3e6b"
        />
        <path d="M82 180 L110 192 L138 180 L142 215 Q138 250 110 258 Q82 250 78 215Z" fill="#f5f0e8" />
        <path
          d="M82 180 L78 215 Q82 250 110 258 Q138 250 142 215 L138 180"
          stroke="#ddd5c0"
          strokeWidth="1.5"
          fill="none"
        />
        <path d="M96 180 Q90 168 88 158" stroke="#f5f0e8" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M124 180 Q130 168 132 158" stroke="#f5f0e8" strokeWidth="4" fill="none" strokeLinecap="round" />
        <rect x="96" y="218" width="28" height="18" rx="4" fill="#ede6d4" stroke="#ddd5c0" strokeWidth="0.5" />
        <path
          d="M148 195 Q162 178 170 155 Q174 144 168 140 Q162 136 156 148 Q148 165 142 185Z"
          fill="#c8a06a"
          stroke="#a07040"
          strokeWidth="1"
        />
        <path d="M155 172 Q162 162 165 155" stroke="#a07040" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M152 180 Q158 170 162 162" stroke="#a07040" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />

        <rect x="97" y="168" width="26" height="22" rx="5" fill="#E8C49A" />
        <ellipse cx="110" cy="112" rx="50" ry="56" fill="#E8C49A" />
        <ellipse cx="110" cy="68" rx="50" ry="22" fill="#6B3A2A" />
        <rect x="60" y="68" width="10" height="35" rx="5" fill="#6B3A2A" />
        <rect x="150" y="68" width="10" height="35" rx="5" fill="#6B3A2A" />
        <ellipse cx="110" cy="62" rx="26" ry="14" fill="#7A4430" />
        <path d="M62 85 Q56 100 60 118" stroke="#6B3A2A" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M158 85 Q164 100 160 118" stroke="#6B3A2A" strokeWidth="8" fill="none" strokeLinecap="round" />
        <rect x="125" y="70" width="14" height="5" rx="2" fill="#c0392b" />
        <ellipse cx="60" cy="114" rx="7" ry="9" fill="#D4A870" />
        <ellipse cx="160" cy="114" rx="7" ry="9" fill="#D4A870" />
        <circle cx="60" cy="122" r="3" fill="#c0392b" />
        <circle cx="160" cy="122" r="3" fill="#c0392b" />

        <g>
          <ellipse cx="88" cy="108" rx="10" ry={bakeryEyeRy} fill="white" />
          <ellipse cx="132" cy="108" rx="10" ry={bakeryEyeRy} fill="white" />
          {!isBlinking && (
            <>
              <ellipse
                cx={bakeryState.pupils.lx}
                cy={bakeryState.pupils.ly}
                rx="6"
                ry={bakeryPupilRy}
                fill="#3A2010"
              />
              <ellipse
                cx={bakeryState.pupils.rx}
                cy={bakeryState.pupils.ry}
                rx="6"
                ry={bakeryPupilRy}
                fill="#3A2010"
              />
              <circle cx="91" cy="107" r="2" fill="white" opacity="0.7" />
              <circle cx="135" cy="107" r="2" fill="white" opacity="0.7" />
            </>
          )}
          <path d={bakeryState.browL} stroke="#5A2E18" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d={bakeryState.browR} stroke="#5A2E18" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M78 102 Q76 99 75 97" stroke="#3A2010" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M82 100 Q81 97 81 95" stroke="#3A2010" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M138 100 Q139 97 139 95" stroke="#3A2010" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M142 102 Q144 99 145 97" stroke="#3A2010" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>

        <path d="M106 118 Q110 127 114 118" stroke="#C4956A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <circle cx="106" cy="120" r="1.5" fill="#C4956A" opacity="0.5" />
        <circle cx="114" cy="120" r="1.5" fill="#C4956A" opacity="0.5" />
        <ellipse cx="76" cy="128" rx="12" ry="7" fill="#E07080" opacity={bakeryState.blush} />
        <ellipse cx="144" cy="128" rx="12" ry="7" fill="#E07080" opacity={bakeryState.blush} />

        <g transform="translate(110, 148)">
          {emotion === 'neutral' && (
            <>
              <path d="M-12 0 Q0 5 12 0" stroke="#C06060" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M-8 0 Q0 3 8 0" stroke="#E09090" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
            </>
          )}
          {emotion === 'smile' && (
            <>
              <path d="M-14 -2 Q0 13 14 -2" stroke="#C06060" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M-12 0 Q0 11 12 0 Z" fill="white" opacity="0.92" />
              <ellipse cx="-34" cy="-18" rx="12" ry="7" fill="#E07080" opacity="0.3" />
              <ellipse cx="34" cy="-18" rx="12" ry="7" fill="#E07080" opacity="0.3" />
            </>
          )}
          {emotion === 'surprised' && (
            <>
              <ellipse cx="0" cy="4" rx="8" ry="10" fill="#C06060" />
              <ellipse cx="0" cy="5" rx="5" ry="7" fill="#8B2040" />
            </>
          )}
          {emotion === 'talking' && (
            <>
              <ellipse cx="0" cy="2" rx="10" ry={talkingRy} fill="#C06060" />
              <ellipse cx="0" cy="3" rx="7" ry={talkingInnerRy} fill="#8B2040" />
            </>
          )}
        </g>

        {bakeryState.sweat && (
          <g>
            <ellipse cx="156" cy="90" rx="5" ry="7" fill="#88CCFF" opacity="0.8" />
            <path d="M156 83 L153 90 L159 90 Z" fill="#88CCFF" opacity="0.8" />
          </g>
        )}
      </svg>
    );
  }

  if (avatarId === 'carlos') {
    const baristaState = chileBaristaEmotionStates[emotion];
    const baristaEyeRy = isBlinking ? 1.4 : emotion === 'surprised' ? 11 : 10;
    const baristaPupilRy = isBlinking ? 0 : 7;
    const baristaTranslateY =
      emotion === 'talking' ? -1 : emotion === 'surprised' ? -2 : 0;

    return (
      <svg
        viewBox="0 0 220 280"
        className="h-full w-full"
        role="img"
        aria-label={name}
        style={{ transform: `translateY(${baristaTranslateY}px)` }}
      >
        <ellipse cx="110" cy="268" rx="65" ry="20" fill="#1a1a1a" />
        <path
          d="M52 215 Q56 186 73 174 L110 187 L147 174 Q164 186 168 215 Q164 256 110 266 Q56 256 52 215Z"
          fill="#1c1c1c"
        />
        <path d="M80 178 L110 192 L140 178 L144 216 Q140 252 110 260 Q80 252 76 216Z" fill="#4a5e3a" />
        <path
          d="M80 178 L76 216 Q80 252 110 260 Q140 252 144 216 L140 178"
          stroke="#3a4e2a"
          strokeWidth="1.5"
          fill="none"
        />
        <path d="M94 178 Q88 165 86 154" stroke="#4a5e3a" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M126 178 Q132 165 134 154" stroke="#4a5e3a" strokeWidth="5" fill="none" strokeLinecap="round" />
        <rect x="94" y="215" width="32" height="20" rx="4" fill="#3a4e2a" stroke="#2a3e1a" strokeWidth="0.5" />
        <text x="110" y="228" textAnchor="middle" fontSize="8" fill="#8aaa6a" fontFamily="sans-serif">
          ☕
        </text>
        <rect x="46" y="195" width="22" height="18" rx="3" fill="white" stroke="#ddd" strokeWidth="0.5" />
        <rect x="46" y="195" width="22" height="7" rx="2" fill="#c8a06a" />
        <path d="M68 201 Q74 201 74 207 Q74 213 68 213" stroke="#ddd" strokeWidth="1.5" fill="none" />
        <path d="M52 192 Q54 187 52 183" stroke="#aaa" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M57 191 Q59 185 57 181" stroke="#aaa" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M62 192 Q64 187 62 183" stroke="#aaa" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />

        <rect x="97" y="167" width="26" height="22" rx="5" fill="#B07840" />
        <ellipse cx="110" cy="110" rx="50" ry="57" fill="#B07840" />
        <ellipse cx="110" cy="65" rx="50" ry="21" fill="#1A1A1A" />
        <rect x="60" y="65" width="10" height="28" rx="5" fill="#1A1A1A" />
        <rect x="150" y="65" width="10" height="28" rx="5" fill="#1A1A1A" />
        <path
          d="M64 72 Q72 65 80 72 Q88 79 96 72 Q104 65 112 72 Q120 79 128 72 Q136 65 144 72 Q152 79 156 74"
          stroke="#2a2a2a"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="110" cy="148" rx="26" ry="10" fill="#0f0f0f" opacity="0.15" />
        <path d="M88 142 Q110 152 132 142" stroke="#1a1a1a" strokeWidth="1" fill="none" opacity="0.2" />
        <ellipse cx="60" cy="112" rx="7" ry="9" fill="#9A6830" />
        <ellipse cx="160" cy="112" rx="7" ry="9" fill="#9A6830" />
        <circle cx="60" cy="119" r="2.5" fill="#c8a06a" />

        <g>
          <ellipse cx="88" cy="106" rx="10" ry={baristaEyeRy} fill="white" />
          <ellipse cx="132" cy="106" rx="10" ry={baristaEyeRy} fill="white" />
          {!isBlinking && (
            <>
              <ellipse
                cx={baristaState.pupils.lx}
                cy={baristaState.pupils.ly}
                rx="6"
                ry={baristaPupilRy}
                fill="#1A1A1A"
              />
              <ellipse
                cx={baristaState.pupils.rx}
                cy={baristaState.pupils.ry}
                rx="6"
                ry={baristaPupilRy}
                fill="#1A1A1A"
              />
              <circle cx="91" cy="105" r="2" fill="white" opacity="0.7" />
              <circle cx="135" cy="105" r="2" fill="white" opacity="0.7" />
            </>
          )}
          <path d={baristaState.browL} stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d={baristaState.browR} stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>

        <path d="M106 118 Q110 128 114 118" stroke="#8A5820" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="106" cy="120" r="1.5" fill="#8A5820" opacity="0.4" />
        <circle cx="114" cy="120" r="1.5" fill="#8A5820" opacity="0.4" />
        <ellipse cx="75" cy="126" rx="12" ry="7" fill="#D06040" opacity={baristaState.blush} />
        <ellipse cx="145" cy="126" rx="12" ry="7" fill="#D06040" opacity={baristaState.blush} />

        <g transform="translate(110, 146)">
          {emotion === 'neutral' && (
            <path d="M-13 0 Q0 6 13 0" stroke="#7A3810" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}
          {emotion === 'smile' && (
            <>
              <path d="M-15 -2 Q0 13 15 -2" stroke="#7A3810" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M-13 0 Q0 11 13 0 Z" fill="white" opacity="0.92" />
            </>
          )}
          {emotion === 'surprised' && (
            <>
              <ellipse cx="0" cy="4" rx="9" ry="11" fill="#7A3810" />
              <ellipse cx="0" cy="5" rx="6" ry="8" fill="#3A1000" />
            </>
          )}
          {emotion === 'talking' && (
            <>
              <ellipse cx="0" cy="2" rx="11" ry={talkingRy} fill="#7A3810" />
              <ellipse cx="0" cy="3" rx="8" ry={talkingInnerRy} fill="#3A1000" />
            </>
          )}
        </g>

        {baristaState.sweat && (
          <g>
            <ellipse cx="156" cy="86" rx="5" ry="7" fill="#88CCFF" opacity="0.8" />
            <path d="M156 79 L153 86 L159 86 Z" fill="#88CCFF" opacity="0.8" />
          </g>
        )}
      </svg>
    );
  }

  if (avatarId === 'etienne') {
    const serverState = parisServerEmotionStates[emotion];
    const serverEyeRy = isBlinking ? 1.3 : emotion === 'surprised' ? 10 : 8;
    const serverPupilRy = isBlinking ? 0 : 6;
    const serverTranslateY =
      emotion === 'talking' ? -1 : emotion === 'surprised' ? -2 : 0;

    return (
      <svg
        viewBox="0 0 220 290"
        className="h-full w-full"
        role="img"
        aria-label={name}
        style={{ transform: `translateY(${serverTranslateY}px)` }}
      >
        <ellipse cx="110" cy="275" rx="65" ry="18" fill="#1a1a1a" />
        <path
          d="M54 220 Q57 192 74 178 L110 190 L146 178 Q163 192 166 220 Q163 260 110 270 Q57 260 54 220Z"
          fill="#111111"
        />
        <path d="M68 178 L110 190 L152 178 L156 215 Q152 250 110 260 Q68 250 64 215Z" fill="#1a1a1a" />
        <path d="M94 175 L110 194 L126 175 L119 170 L110 182 L101 170Z" fill="#f5f5f0" />
        <path d="M101 175 L110 192 L119 175 L116 172 L110 183 L104 172Z" fill="#eeede8" />
        <path d="M103 170 L107 173 L110 170 L113 173 L117 170 L113 166 L110 169 L107 166Z" fill="#1a1a1a" />
        <ellipse cx="110" cy="170" rx="3" ry="2" fill="#2a2a2a" />

        <ellipse cx="156" cy="188" rx="18" ry="5" fill="#c8c0a8" stroke="#a8a090" strokeWidth="0.5" />
        <path
          d="M153 188 Q151 178 153 172 Q155 168 157 172 Q159 178 157 188Z"
          fill="#d8f0ff"
          stroke="#a8c8e0"
          strokeWidth="0.5"
          opacity="0.8"
        />
        <path d="M153 172 Q155 168 157 172" stroke="#a8c8e0" strokeWidth="0.5" fill="none" />
        <line x1="155" y1="172" x2="155" y2="188" stroke="#a8c8e0" strokeWidth="0.5" />
        <path
          d="M153 182 Q155 180 157 182 Q158 186 157 188 Q155 189 153 188 Q152 186 153 182Z"
          fill="#8B1a2a"
          opacity="0.7"
        />

        <rect x="97" y="166" width="26" height="20" rx="5" fill="#D4A878" />
        <ellipse cx="110" cy="108" rx="50" ry="57" fill="#D4A878" />
        <ellipse cx="110" cy="63" rx="50" ry="20" fill="#2a1f14" />
        <rect x="60" y="63" width="9" height="28" rx="4" fill="#2a1f14" />
        <rect x="151" y="63" width="9" height="28" rx="4" fill="#2a1f14" />
        <path d="M68 63 Q68 72 64 82" stroke="#1a1208" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M68 63 Q90 58 130 62 Q148 64 156 70" stroke="#3a2a18" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M72 67 Q94 62 132 66 Q148 68 155 73" stroke="#2a1f14" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
        <ellipse cx="60" cy="110" rx="7" ry="9" fill="#BA8858" />
        <ellipse cx="160" cy="110" rx="7" ry="9" fill="#BA8858" />

        <g>
          <ellipse cx="88" cy="106" rx="10" ry={serverEyeRy} fill="white" />
          <ellipse cx="132" cy="106" rx="10" ry={serverEyeRy} fill="white" />
          <path d="M78 100 Q88 97 98 100 Q88 103 78 100Z" fill="#D4A878" opacity="0.4" />
          <path d="M122 100 Q132 97 142 100 Q132 103 122 100Z" fill="#D4A878" opacity="0.4" />
          {!isBlinking && (
            <>
              <ellipse
                cx={serverState.pupils.lx}
                cy={serverState.pupils.ly}
                rx="6"
                ry={serverPupilRy}
                fill="#2a1a0a"
              />
              <ellipse
                cx={serverState.pupils.rx}
                cy={serverState.pupils.ry}
                rx="6"
                ry={serverPupilRy}
                fill="#2a1a0a"
              />
              <circle cx="91" cy="105" r="1.8" fill="white" opacity="0.6" />
              <circle cx="135" cy="105" r="1.8" fill="white" opacity="0.6" />
            </>
          )}
          <path d={serverState.browL} stroke="#2a1f14" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d={serverState.browR} stroke="#2a1f14" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>

        <path d="M107 116 L107 128 Q109 132 113 128 L113 116" stroke="#BA8858" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M104 130 Q107 133 110 132 Q113 133 116 130" stroke="#BA8858" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M98 140 Q104 143 110 142 Q116 143 122 140" stroke="#2a1f14" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <ellipse cx="75" cy="124" rx="12" ry="7" fill="#D06060" opacity={serverState.blush} />
        <ellipse cx="145" cy="124" rx="12" ry="7" fill="#D06060" opacity={serverState.blush} />

        <g transform="translate(110, 150)">
          {emotion === 'neutral' && (
            <>
              <path d="M-10 0 Q0 2 10 0" stroke="#8A4830" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M-6 -1 Q0 1 6 -1" stroke="#8A4830" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4" />
            </>
          )}
          {emotion === 'smile' && (
            <>
              <path d="M-13 -1 Q0 11 13 -1" stroke="#8A4830" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M-11 0 Q0 9 11 0 Z" fill="white" opacity="0.92" />
            </>
          )}
          {emotion === 'surprised' && (
            <>
              <ellipse cx="0" cy="4" rx="8" ry="10" fill="#8A4830" />
              <ellipse cx="0" cy="5" rx="5" ry="7" fill="#3A1800" />
            </>
          )}
          {emotion === 'talking' && (
            <>
              <ellipse cx="0" cy="2" rx="10" ry={talkingRy} fill="#8A4830" />
              <ellipse cx="0" cy="3" rx="7" ry={talkingInnerRy} fill="#3A1800" />
            </>
          )}
        </g>

        {serverState.sweat && (
          <g>
            <ellipse cx="156" cy="86" rx="5" ry="7" fill="#88CCFF" opacity="0.8" />
            <path d="M156 79 L153 86 L159 86 Z" fill="#88CCFF" opacity="0.8" />
          </g>
        )}
      </svg>
    );
  }

  if (avatarId === 'maya') {
    const baristaState = nycBaristaEmotionStates[emotion];
    const baristaEyeRy = isBlinking ? 1.4 : emotion === 'surprised' ? 12 : 11;
    const baristaPupilRy = isBlinking ? 0 : 8;
    const baristaTranslateY =
      emotion === 'talking' ? -1 : emotion === 'surprised' ? -2 : 0;

    return (
      <svg
        viewBox="0 0 220 285"
        className="h-full w-full"
        role="img"
        aria-label={name}
        style={{ transform: `translateY(${baristaTranslateY}px)` }}
      >
        <ellipse cx="110" cy="272" rx="65" ry="18" fill="#2d4a3e" />
        <path
          d="M52 218 Q56 188 74 176 L110 189 L146 176 Q164 188 168 218 Q164 258 110 268 Q56 258 52 218Z"
          fill="#2d4a3e"
        />
        <path d="M80 180 L110 193 L140 180 L144 218 Q140 254 110 262 Q80 254 76 218Z" fill="#8B5E3C" />
        <path
          d="M80 180 L76 218 Q80 254 110 262 Q140 254 144 218 L140 180"
          stroke="#6B4428"
          strokeWidth="1.5"
          fill="none"
        />
        <path d="M94 180 Q84 165 82 154" stroke="#8B5E3C" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M126 180 Q136 165 138 154" stroke="#8B5E3C" strokeWidth="5" fill="none" strokeLinecap="round" />
        <rect x="93" y="218" width="34" height="20" rx="4" fill="#6B4428" stroke="#4a2e10" strokeWidth="0.5" />
        <text x="110" y="231" textAnchor="middle" fontSize="7" fill="#c8a06a" fontFamily="sans-serif" fontWeight="bold">
          GW
        </text>

        <path d="M44 185 L48 210 L66 210 L70 185Z" fill="#ffffff" stroke="#ddd" strokeWidth="0.5" />
        <path d="M45 193 L69 193 L68 200 L46 200Z" fill="#2d5a3e" />
        <text x="57" y="199" textAnchor="middle" fontSize="5.5" fill="white" fontFamily="sans-serif" fontWeight="bold">
          {normalizedCupName}
        </text>
        <path d="M43 185 Q57 180 71 185" stroke="#ccc" strokeWidth="2" fill="#f0f0f0" strokeLinecap="round" />
        <path d="M60 182 Q62 170 61 158" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />

        <rect x="153" y="100" width="4" height="18" rx="2" fill="#1a1a1a" transform="rotate(15, 155, 109)" />
        <rect x="153" y="100" width="4" height="5" rx="1" fill="#e74c3c" transform="rotate(15, 155, 109)" />
        <rect x="97" y="168" width="26" height="22" rx="5" fill="#C49A6C" />
        <ellipse cx="110" cy="110" rx="50" ry="57" fill="#C49A6C" />
        <ellipse cx="110" cy="65" rx="50" ry="20" fill="#2a1a0a" />
        <rect x="60" y="65" width="10" height="26" rx="5" fill="#2a1a0a" />
        <rect x="150" y="65" width="10" height="26" rx="5" fill="#2a1a0a" />
        <ellipse cx="110" cy="54" rx="22" ry="14" fill="#3a2a14" />
        <ellipse cx="110" cy="50" rx="16" ry="10" fill="#2a1a0a" />
        <path d="M62 74 Q58 86 60 100" stroke="#2a1a0a" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M158 74 Q162 88 160 102" stroke="#2a1a0a" strokeWidth="6" fill="none" strokeLinecap="round" />
        <ellipse cx="110" cy="56" rx="8" ry="4" fill="none" stroke="#ff6b6b" strokeWidth="2" />
        <ellipse cx="60" cy="112" rx="7" ry="9" fill="#AA8050" />
        <ellipse cx="160" cy="112" rx="7" ry="9" fill="#AA8050" />
        <circle cx="60" cy="106" r="2.5" fill="#c8c8c8" />
        <circle cx="60" cy="112" r="2" fill="#c8a06a" />
        <circle cx="60" cy="118" r="2.5" fill="#c8c8c8" />

        <g>
          <ellipse cx="88" cy="107" rx="11" ry={baristaEyeRy} fill="white" />
          <ellipse cx="132" cy="107" rx="11" ry={baristaEyeRy} fill="white" />
          {!isBlinking && (
            <>
              <ellipse
                cx={baristaState.pupils.lx}
                cy={baristaState.pupils.ly}
                rx="7"
                ry={baristaPupilRy}
                fill="#3a2010"
              />
              <ellipse
                cx={baristaState.pupils.rx}
                cy={baristaState.pupils.ry}
                rx="7"
                ry={baristaPupilRy}
                fill="#3a2010"
              />
              <circle cx="91" cy="106" r="2.5" fill="white" opacity="0.8" />
              <circle cx="135" cy="106" r="2.5" fill="white" opacity="0.8" />
            </>
          )}
          <path d={baristaState.browL} stroke="#2a1a0a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d={baristaState.browR} stroke="#2a1a0a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>

        <path d="M106 118 Q110 128 114 118" stroke="#A07040" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="116" cy="120" r="2" fill="#c8c8c8" />
        <circle cx="82" cy="124" r="1.2" fill="#A07040" opacity="0.3" />
        <circle cx="86" cy="128" r="1" fill="#A07040" opacity="0.25" />
        <circle cx="134" cy="124" r="1.2" fill="#A07040" opacity="0.3" />
        <circle cx="130" cy="128" r="1" fill="#A07040" opacity="0.25" />
        <ellipse cx="75" cy="126" rx="13" ry="8" fill="#D06040" opacity={baristaState.blush} />
        <ellipse cx="145" cy="126" rx="13" ry="8" fill="#D06040" opacity={baristaState.blush} />

        <g transform="translate(110, 148)">
          {emotion === 'neutral' && (
            <>
              <path d="M-13 0 Q0 8 13 0" stroke="#9A4830" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M-11 1 Q0 7 11 1 Z" fill="white" opacity="0.7" />
            </>
          )}
          {emotion === 'smile' && (
            <>
              <path d="M-16 -3 Q0 15 16 -3" stroke="#9A4830" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M-14 -1 Q0 13 14 -1 Z" fill="white" />
            </>
          )}
          {emotion === 'surprised' && (
            <>
              <ellipse cx="0" cy="5" rx="9" ry="11" fill="#9A4830" />
              <ellipse cx="0" cy="6" rx="6" ry="8" fill="#3A1000" />
            </>
          )}
          {emotion === 'talking' && (
            <>
              <ellipse cx="0" cy="2" rx="11" ry={talkingRy} fill="#9A4830" />
              <ellipse cx="0" cy="3" rx="8" ry={talkingInnerRy} fill="#3A1000" />
            </>
          )}
        </g>

        {baristaState.sweat && (
          <g>
            <ellipse cx="156" cy="86" rx="5" ry="7" fill="#88CCFF" opacity="0.8" />
            <path d="M156 79 L153 86 L159 86 Z" fill="#88CCFF" opacity="0.8" />
          </g>
        )}
      </svg>
    );
  }

  if (avatarId === 'ashley') {
    const receptionistState = hotelReceptionistEmotionStates[emotion];
    const receptionistEyeRy = isBlinking ? 1.4 : emotion === 'surprised' ? 11 : 10;
    const receptionistPupilRy = isBlinking ? 0 : 7;
    const receptionistTranslateY =
      emotion === 'talking' ? -1 : emotion === 'surprised' ? -2 : 0;

    return (
      <svg
        viewBox="0 0 220 285"
        className="h-full w-full"
        role="img"
        aria-label={name}
        style={{ transform: `translateY(${receptionistTranslateY}px)` }}
      >
        <ellipse cx="110" cy="272" rx="65" ry="18" fill="#1a2744" />
        <path
          d="M52 218 Q56 188 74 176 L110 190 L146 176 Q164 188 168 218 Q164 258 110 268 Q56 258 52 218Z"
          fill="#1e2f55"
        />
        <path d="M95 176 L110 194 L125 176 L118 171 L110 184 L102 171Z" fill="#f8f6f0" />
        <path d="M102 176 L110 191 L118 176 L115 173 L110 183 L105 173Z" fill="#f0ede6" />
        <path d="M107 177 L110 200 L113 177 L111 174 L109 174Z" fill="#b8962e" />
        <path d="M108 185 L110 200 L112 185 L111 182 L109 182Z" fill="#9a7a20" />
        <rect x="58" y="195" width="38" height="22" rx="3" fill="#c9a84c" />
        <rect x="60" y="197" width="34" height="18" rx="2" fill="#f5e6b0" />
        <text x="77" y="206" textAnchor="middle" fontSize="5.5" fill="#7a5c10" fontFamily="sans-serif" fontWeight="bold">
          ASHLEY
        </text>
        <text x="77" y="213" textAnchor="middle" fontSize="4.5" fill="#9a7a30" fontFamily="sans-serif">
          FRONT DESK
        </text>
        <rect x="50" y="225" width="120" height="12" rx="3" fill="#e8e4dc" stroke="#ccc8c0" strokeWidth="0.5" />
        {Array.from({ length: 8 }).map((_, index) => (
          <rect
            key={index}
            x={54 + index * 10}
            y="227"
            width="8"
            height="5"
            rx="1"
            fill="#d0ccc4"
          />
        ))}
        <rect x="134" y="227" width="28" height="5" rx="1" fill="#c0bbb4" />

        <rect x="97" y="167" width="26" height="22" rx="5" fill="#D4956A" />
        <ellipse cx="110" cy="108" rx="50" ry="57" fill="#D4956A" />
        <ellipse cx="110" cy="63" rx="50" ry="20" fill="#8B6914" />
        <rect x="60" y="63" width="10" height="30" rx="5" fill="#8B6914" />
        <rect x="150" y="63" width="10" height="30" rx="5" fill="#8B6914" />
        <path d="M62 68 Q90 58 138 62 Q152 64 158 72" stroke="#a07c20" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M62 74 Q90 64 138 68 Q150 70 156 78" stroke="#7a5c10" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
        <ellipse cx="110" cy="168" rx="18" ry="8" fill="#8B6914" opacity="0.6" />
        <path d="M92 168 Q110 178 128 168" stroke="#7a5c10" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
        <ellipse cx="60" cy="112" rx="7" ry="9" fill="#BA7848" />
        <ellipse cx="160" cy="112" rx="7" ry="9" fill="#BA7848" />
        <circle cx="60" cy="118" r="3" fill="#f0ece4" stroke="#d8d4cc" strokeWidth="0.5" />
        <circle cx="160" cy="118" r="3" fill="#f0ece4" stroke="#d8d4cc" strokeWidth="0.5" />

        <g>
          <ellipse cx="88" cy="107" rx="11" ry={receptionistEyeRy} fill="white" />
          <ellipse cx="132" cy="107" rx="11" ry={receptionistEyeRy} fill="white" />
          {!isBlinking && (
            <>
              <ellipse
                cx={receptionistState.pupils.lx}
                cy={receptionistState.pupils.ly}
                rx="7"
                ry={receptionistPupilRy}
                fill="#3a5c2a"
              />
              <ellipse
                cx={receptionistState.pupils.rx}
                cy={receptionistState.pupils.ry}
                rx="7"
                ry={receptionistPupilRy}
                fill="#3a5c2a"
              />
              <circle cx="91" cy="106" r="2.5" fill="white" opacity="0.75" />
              <circle cx="135" cy="106" r="2.5" fill="white" opacity="0.75" />
            </>
          )}
          <path d={receptionistState.browL} stroke="#6a4a10" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d={receptionistState.browR} stroke="#6a4a10" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>

        <path d="M107 118 Q110 128 113 118" stroke="#B07040" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <circle cx="107" cy="120" r="1.4" fill="#B07040" opacity="0.35" />
        <circle cx="113" cy="120" r="1.4" fill="#B07040" opacity="0.35" />
        <ellipse cx="76" cy="126" rx="13" ry="7" fill="#E07070" opacity="0.14" />
        <ellipse cx="144" cy="126" rx="13" ry="7" fill="#E07070" opacity="0.14" />
        <ellipse cx="76" cy="126" rx="13" ry="7" fill="#E07070" opacity={receptionistState.blush} />
        <ellipse cx="144" cy="126" rx="13" ry="7" fill="#E07070" opacity={receptionistState.blush} />

        <g transform="translate(110, 148)">
          {emotion === 'neutral' && (
            <>
              <path d="M-14 -1 Q0 11 14 -1" stroke="#A05040" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M-12 0 Q0 9 12 0 Z" fill="white" opacity="0.85" />
            </>
          )}
          {emotion === 'smile' && (
            <>
              <path d="M-16 -3 Q0 15 16 -3" stroke="#A05040" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M-14 -1 Q0 13 14 -1 Z" fill="white" />
            </>
          )}
          {emotion === 'surprised' && (
            <>
              <ellipse cx="0" cy="5" rx="9" ry="11" fill="#A05040" />
              <ellipse cx="0" cy="6" rx="6" ry="8" fill="#3A1000" />
            </>
          )}
          {emotion === 'talking' && (
            <>
              <ellipse cx="0" cy="2" rx="11" ry={talkingRy} fill="#A05040" />
              <ellipse cx="0" cy="3" rx="8" ry={talkingInnerRy} fill="#3A1000" />
            </>
          )}
        </g>

        {receptionistState.sweat && (
          <g>
            <ellipse cx="156" cy="86" rx="5" ry="7" fill="#88CCFF" opacity="0.8" />
            <path d="M156 79 L153 86 L159 86 Z" fill="#88CCFF" opacity="0.8" />
          </g>
        )}
      </svg>
    );
  }

  return null;
}
