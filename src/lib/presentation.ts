import { Building2, Car, Coffee, Home, Plane, Users } from 'lucide-react';

import type { CountryName } from './types';

export const countryPresentation = {
  Chile: {
    flag: '🇨🇱',
    description: 'Espagnol chilien avec expressions locales typiques',
    image:
      'https://images.unsplash.com/photo-1593985437133-03d5e1435c03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDaGlsZSUyMFNhbnRpYWdvJTIwY2l0eXNjYXBlfGVufDF8fHx8MTc2NTIzMjU1N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-red-500/90 to-blue-600/90',
  },
  USA: {
    flag: '🇺🇸',
    description: 'Anglais américain avec culture et expressions US',
    image:
      'https://images.unsplash.com/photo-1542223616-9de9adb5e3e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVU0ElMjBBbWVyaWNhbiUyMGNpdHlzY2FwZXxlbnwxfHx8fDE3NjUyMzI1NTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-blue-600/90 to-red-500/90',
  },
} as const;

export const scenarioPresentation = {
  Chile: [
    {
      slug: 'aeroport-santiago',
      icon: Plane,
      color: 'bg-sky-50 text-sky-700',
      iconColor: 'text-sky-500',
    },
    {
      slug: 'taxi-uber-santiago',
      icon: Car,
      color: 'bg-amber-50 text-amber-700',
      iconColor: 'text-amber-500',
    },
    {
      slug: 'conversation-libre-chili',
      icon: Home,
      color: 'bg-emerald-50 text-emerald-700',
      iconColor: 'text-emerald-500',
    },
  ],
  USA: [
    {
      slug: 'immigration-usa',
      icon: Building2,
      color: 'bg-blue-50 text-blue-700',
      iconColor: 'text-blue-500',
    },
    {
      slug: 'order-coffee',
      icon: Coffee,
      color: 'bg-orange-50 text-orange-700',
      iconColor: 'text-orange-500',
    },
    {
      slug: 'free-talk-usa',
      icon: Users,
      color: 'bg-purple-50 text-purple-700',
      iconColor: 'text-purple-500',
    },
  ],
} as const satisfies Record<CountryName, readonly {
  slug: string;
  icon: typeof Plane;
  color: string;
  iconColor: string;
}[]>;

export const conversationAvatarPresentation = {
  Chile: {
    name: 'Matías',
    emoji: '👨🏻',
    bgColor: 'bg-gradient-to-br from-red-400 to-blue-500',
    role: 'Guide local chilien',
  },
  USA: {
    name: 'Emily',
    emoji: '👩🏼',
    bgColor: 'bg-gradient-to-br from-blue-500 to-red-400',
    role: 'Guide locale américaine',
  },
} as const satisfies Record<CountryName, {
  name: string;
  emoji: string;
  bgColor: string;
  role: string;
}>;

export const languageLabelPresentation: Record<string, string> = {
  en: 'Anglais',
  es: 'Espagnol',
  fr: 'Français',
  de: 'Allemand',
  it: 'Italien',
  pt: 'Portugais',
  ja: 'Japonais',
};

export function getLanguageLabel(languageCode: string): string {
  return languageLabelPresentation[languageCode.toLowerCase()] ?? languageCode.toUpperCase();
}
