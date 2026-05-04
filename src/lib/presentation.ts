import {
  Building2,
  Car,
  Coffee,
  Globe2,
  Home,
  MessageSquare,
  Plane,
  Users,
} from 'lucide-react';

type IconComponent = typeof Plane;

export const FEATURED_COUNTRY_CODE = 'CL';
export const FEATURED_COUNTRY_NAME = 'Chile';
export const FEATURED_SCENARIO_SLUG = 'aeroport-santiago';

const countryOverrides: Record<
  string,
  {
    flag: string;
    description: string;
    image: string;
    gradient: string;
  }
> = {
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
};

const countryFlagByCode: Record<string, string> = {
  CL: '🇨🇱',
  US: '🇺🇸',
  FR: '🇫🇷',
  ES: '🇪🇸',
  JP: '🇯🇵',
  DE: '🇩🇪',
  IT: '🇮🇹',
  PT: '🇵🇹',
  CA: '🇨🇦',
  CH: '🇨🇭',
  MA: '🇲🇦',
};

export function getCountryPresentation(countryName: string, countryCode?: string) {
  const override = countryOverrides[countryName];
  if (override) {
    return override;
  }

  return {
    flag: countryCode ? countryFlagByCode[countryCode.toUpperCase()] ?? '🌍' : '🌍',
    description: `Explore des scénarios réalistes liés à ${countryName}.`,
    image:
      'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    gradient: 'from-slate-700/80 to-emerald-600/80',
  };
}

const scenarioSlugPresentation: Record<
  string,
  {
    icon: IconComponent;
    color: string;
    iconColor: string;
  }
> = {
  'aeroport-santiago': {
    icon: Plane,
    color: 'bg-sky-50 text-sky-700',
    iconColor: 'text-sky-500',
  },
  'taxi-uber-santiago': {
    icon: Car,
    color: 'bg-amber-50 text-amber-700',
    iconColor: 'text-amber-500',
  },
  'conversation-libre-chili': {
    icon: Home,
    color: 'bg-emerald-50 text-emerald-700',
    iconColor: 'text-emerald-500',
  },
  'immigration-usa': {
    icon: Building2,
    color: 'bg-blue-50 text-blue-700',
    iconColor: 'text-blue-500',
  },
  'order-coffee': {
    icon: Coffee,
    color: 'bg-orange-50 text-orange-700',
    iconColor: 'text-orange-500',
  },
  'free-talk-usa': {
    icon: Users,
    color: 'bg-purple-50 text-purple-700',
    iconColor: 'text-purple-500',
  },
};

export function getScenarioPresentation(slug: string) {
  return (
    scenarioSlugPresentation[slug] ?? {
      icon: MessageSquare,
      color: 'bg-slate-50 text-slate-700',
      iconColor: 'text-slate-500',
    }
  );
}

export function getScenarioFocusCopy(slug: string) {
  if (slug === FEATURED_SCENARIO_SLUG) {
    return {
      eyebrow: 'Flagship arrival simulation',
      objective: 'Handle your first minutes in Santiago without freezing.',
      pressure: 'Airport staff, documents, directions, transport, first local cues.',
    };
  }

  return {
    eyebrow: 'Immersive practice',
    objective: 'Practice a realistic situation before it happens for real.',
    pressure: 'Stay natural, keep the exchange moving, and notice the local cues.',
  };
}

const avatarOverrides: Record<
  string,
  {
    name: string;
    emoji: string;
    imageUrl?: string;
    bgColor: string;
    role: string;
    mouth?: {
      xPercent: number;
      yPercent: number;
      widthPercent: number;
      heightPercent: number;
    };
  }
> = {
  Chile: {
    name: 'Matías',
    emoji: '👨🏻',
    imageUrl: '/images/characters/matias-v2.png',
    bgColor: 'bg-gradient-to-br from-red-400 to-blue-500',
    role: 'Guide local chilien',
    mouth: {
      xPercent: 50,
      yPercent: 67.5,
      widthPercent: 18,
      heightPercent: 7.5,
    },
  },
  USA: {
    name: 'Emily',
    emoji: '👩🏼',
    bgColor: 'bg-gradient-to-br from-blue-500 to-red-400',
    role: 'Guide locale américaine',
  },
};

export function getConversationAvatarPresentation(
  countryName: string,
  partnerName?: string,
  partnerRole?: string
) {
  const fallback = avatarOverrides[countryName] ?? {
    name: countryName,
    emoji: '🧑',
    imageUrl: undefined,
    bgColor: 'bg-gradient-to-br from-slate-500 to-teal-500',
    role: 'Partenaire de conversation local',
  };

  return {
    ...fallback,
    name: partnerName || fallback.name,
    role: partnerRole || fallback.role,
  };
}

export const languageLabelPresentation: Record<string, string> = {
  en: 'Anglais',
  es: 'Espagnol',
  fr: 'Français',
  de: 'Allemand',
  it: 'Italien',
  pt: 'Portugais',
  ja: 'Japonais',
  ar: 'Arabe',
};

export function getLanguageLabel(languageCode: string): string {
  return languageLabelPresentation[languageCode.toLowerCase()] ?? languageCode.toUpperCase();
}

export function getDefaultConversationGreeting(countryName: string): string {
  if (countryName === 'Chile') {
    return '¡Hola! ¿Cómo estás? Bienvenido a Chile, cachai.';
  }

  if (countryName === 'USA') {
    return 'Hey! How are you doing? Welcome to the States!';
  }

  return `Hello! Welcome to ${countryName}. Ready to start talking?`;
}

export function getCulturalTip(countryName: string): string {
  if (countryName === 'Chile') {
    return 'Au Chili, on utilise beaucoup "cachai" (tu vois) et "po" pour renforcer les phrases.';
  }

  if (countryName === 'USA') {
    return "Aux USA, montrer de l'enthousiasme dans la conversation est très apprécié. N'hésite pas à utiliser \"awesome\" ou \"cool\"!";
  }

  return `Observe le ton, la politesse et les expressions locales propres à ${countryName}.`;
}

export function getVocabularyHints(countryName: string): string[] {
  if (countryName === 'Chile') {
    return ['cachai = tu vois', 'po = particule', 'weón = mec'];
  }

  if (countryName === 'USA') {
    return ['awesome = génial', 'for sure = bien sûr', 'no worries = pas de souci'];
  }

  return ['Observe les expressions locales', 'Repère les formules de politesse', 'Note le vocabulaire du quotidien'];
}

export function getCulturalSummary(countryName: string) {
  if (countryName === 'Chile') {
    return {
      flag: '🇨🇱',
      keywords: [
        {
          icon: MessageSquare,
          title: 'Expressions typiques',
          text: 'Cachai, po, weón - des mots très fréquents au Chili',
          color: 'bg-red-50 text-red-700',
        },
        {
          icon: Users,
          title: 'Ton amical',
          text: 'Les Chiliens sont chaleureux et directs dans leurs échanges',
          color: 'bg-blue-50 text-blue-700',
        },
        {
          icon: Globe2,
          title: 'Conseil pratique',
          text: 'Le tutoiement est très courant, même avec des inconnus',
          color: 'bg-orange-50 text-orange-700',
        },
      ],
    };
  }

  if (countryName === 'USA') {
    return {
      flag: '🇺🇸',
      keywords: [
        {
          icon: MessageSquare,
          title: 'Expressions courantes',
          text: "What's up, awesome, no worries - le vocabulaire du quotidien",
          color: 'bg-blue-50 text-blue-700',
        },
        {
          icon: Users,
          title: 'Attitude positive',
          text: "L'enthousiasme et la politesse sont très valorisés",
          color: 'bg-red-50 text-red-700',
        },
        {
          icon: Globe2,
          title: 'Conseil pratique',
          text: 'Le small talk est important, même avec des inconnus',
          color: 'bg-purple-50 text-purple-700',
        },
      ],
    };
  }

  return {
    flag: '🌍',
    keywords: [
      {
        icon: MessageSquare,
        title: 'Expressions locales',
        text: `Découvre le vocabulaire courant utilisé dans ${countryName}.`,
        color: 'bg-slate-50 text-slate-700',
      },
      {
        icon: Users,
        title: 'Codes sociaux',
        text: `Observe le ton et les habitudes de conversation propres à ${countryName}.`,
        color: 'bg-teal-50 text-teal-700',
      },
      {
        icon: Globe2,
        title: 'Conseil pratique',
        text: `Utilise la conversation pour te familiariser avec ${countryName} avant d'y être.`,
        color: 'bg-orange-50 text-orange-700',
      },
    ],
  };
}
