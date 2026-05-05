import { useEffect, useMemo, useState } from 'react';

type CharacterState = 'idle' | 'thinking' | 'speaking';
type RecorderState = 'idle' | 'recording' | 'transcribing';

interface CharacterAvatarProps {
  avatarId?: string;
  name: string;
  characterState: CharacterState;
  recorderState: RecorderState;
}

function getSpeakingMouthPath(frame: number) {
  const frames = [
    'M 131 202 Q 160 211 189 202 Q 182 214 160 216 Q 138 214 131 202 Z',
    'M 129 201 Q 160 220 191 201 Q 184 227 160 230 Q 136 227 129 201 Z',
    'M 133 198 Q 160 226 187 198 Q 183 238 160 241 Q 137 238 133 198 Z',
    'M 135 200 Q 160 214 185 200 Q 179 221 160 223 Q 141 221 135 200 Z',
  ];
  return frames[frame % frames.length];
}

function getListeningMouthPath(frame: number) {
  return frame % 2 === 0
    ? 'M 136 205 Q 160 210 184 205'
    : 'M 136 206 Q 160 212 184 206';
}

function getThinkingMouthPath(frame: number) {
  return frame % 2 === 0
    ? 'M 138 205 Q 160 202 182 205'
    : 'M 138 206 Q 160 203 182 206';
}

function getIdleMouthPath() {
  return 'M 136 204 Q 160 212 184 204';
}

export function CharacterAvatar({
  avatarId,
  name,
  characterState,
  recorderState,
}: CharacterAvatarProps) {
  const [frame, setFrame] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const isAnimated =
      characterState === 'speaking' ||
      characterState === 'thinking' ||
      recorderState === 'recording' ||
      recorderState === 'transcribing';

    if (!isAnimated) {
      setFrame(0);
      return;
    }

    const interval = window.setInterval(() => {
      setFrame((current) => current + 1);
    }, characterState === 'speaking' ? 180 : 420);

    return () => window.clearInterval(interval);
  }, [characterState, recorderState]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIsBlinking(true);
      window.setTimeout(() => setIsBlinking(false), 140);
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  const mouthPath = useMemo(() => {
    if (characterState === 'speaking') {
      return getSpeakingMouthPath(frame);
    }
    if (recorderState === 'recording') {
      return getListeningMouthPath(frame);
    }
    if (characterState === 'thinking' || recorderState === 'transcribing') {
      return getThinkingMouthPath(frame);
    }
    return getIdleMouthPath();
  }, [characterState, recorderState, frame]);

  const leftEyeHeight = isBlinking ? 2 : recorderState === 'recording' ? 16 : 14;
  const rightEyeHeight = isBlinking ? 2 : recorderState === 'recording' ? 16 : 14;
  const browTilt = characterState === 'thinking' ? -4 : recorderState === 'recording' ? 3 : 0;
  const faceOffset = characterState === 'speaking' ? -2 : recorderState === 'recording' ? -1 : 0;

  if (avatarId !== 'matias') {
    return null;
  }

  return (
    <svg
      viewBox="0 0 320 320"
      className="h-full w-full"
      role="img"
      aria-label={name}
    >
      <defs>
        <linearGradient id="matias-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5d85a8" />
          <stop offset="100%" stopColor="#355671" />
        </linearGradient>
        <linearGradient id="matias-skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ecb077" />
          <stop offset="100%" stopColor="#da8d53" />
        </linearGradient>
        <linearGradient id="matias-jacket" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#223753" />
          <stop offset="100%" stopColor="#17253a" />
        </linearGradient>
        <linearGradient id="matias-inner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#843827" />
          <stop offset="100%" stopColor="#5d2318" />
        </linearGradient>
      </defs>

      <circle cx="160" cy="160" r="148" fill="url(#matias-bg)" />
      <circle cx="160" cy="120" r="76" fill="rgba(255,255,255,0.08)" />

      <g transform={`translate(0 ${faceOffset})`}>
        <path
          d="M 67 292 C 80 238 117 223 160 223 C 203 223 240 238 253 292 L 212 292 C 206 267 186 253 160 253 C 134 253 114 267 108 292 Z"
          fill="url(#matias-jacket)"
        />
        <path
          d="M 105 292 C 115 248 132 226 160 226 C 188 226 205 248 215 292 L 188 292 C 183 270 174 258 160 258 C 146 258 137 270 132 292 Z"
          fill="url(#matias-inner)"
        />
        <path
          d="M 137 292 C 141 258 148 234 160 234 C 172 234 179 258 183 292 Z"
          fill="#f5efe7"
        />

        <path
          d="M 100 110 C 100 74 126 50 160 50 C 194 50 220 74 220 110 L 220 174 C 220 211 192 235 160 235 C 128 235 100 211 100 174 Z"
          fill="url(#matias-skin)"
        />
        <path
          d="M 121 175 C 129 188 143 197 160 197 C 177 197 191 188 199 175"
          fill="none"
          stroke="#c87645"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 145 160 C 150 169 170 169 175 160"
          fill="none"
          stroke="#c87b49"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 130 148 C 136 145 144 145 150 148"
          fill="none"
          stroke="#d88c59"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 170 148 C 176 145 184 145 190 148"
          fill="none"
          stroke="#d88c59"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <ellipse cx="136" cy="146" rx="13" ry={leftEyeHeight} fill="#fffdf8" />
        <ellipse cx="184" cy="146" rx="13" ry={rightEyeHeight} fill="#fffdf8" />
        {!isBlinking && (
          <>
            <circle cx="136" cy="147" r="6.4" fill="#4b2f1f" />
            <circle cx="184" cy="147" r="6.4" fill="#4b2f1f" />
            <circle cx="138" cy="145" r="1.6" fill="#ffffff" />
            <circle cx="186" cy="145" r="1.6" fill="#ffffff" />
          </>
        )}

        <path
          d={`M 118 ${128 + browTilt} Q 136 ${118 + browTilt} 154 ${128 + browTilt}`}
          fill="none"
          stroke="#2f1b14"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d={`M 166 ${128 + browTilt} Q 184 ${118 + browTilt} 202 ${128 + browTilt}`}
          fill="none"
          stroke="#2f1b14"
          strokeWidth="7"
          strokeLinecap="round"
        />

        <path
          d={mouthPath}
          fill={characterState === 'speaking' ? '#6b1f22' : 'none'}
          stroke="#7b342b"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {characterState === 'speaking' && (
          <path
            d="M 141 202 Q 160 209 179 202"
            fill="none"
            stroke="#f5d3c0"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        )}

        <path
          d="M 106 84 C 110 49 137 33 167 35 C 198 36 223 54 224 90 C 213 72 200 66 188 64 C 178 48 161 42 140 46 C 127 48 114 57 106 84 Z"
          fill="#2f1e17"
        />
        <path
          d="M 105 84 C 96 102 96 131 102 145 C 97 122 103 107 114 98 Z"
          fill="#2f1e17"
        />
        <path
          d="M 215 87 C 223 100 225 130 219 144 C 223 121 220 105 209 96 Z"
          fill="#2f1e17"
        />

        <path
          d="M 123 178 C 128 193 138 204 150 210"
          fill="none"
          stroke="#65453a"
          strokeWidth="3.4"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M 197 178 C 192 193 182 204 170 210"
          fill="none"
          stroke="#65453a"
          strokeWidth="3.4"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M 148 206 Q 160 214 172 206"
          fill="none"
          stroke="#65453a"
          strokeWidth="3.4"
          strokeLinecap="round"
          opacity="0.9"
        />
      </g>
    </svg>
  );
}
