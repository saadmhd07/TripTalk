import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { AuthScreen } from './components/AuthScreen';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingOne } from './components/OnboardingOne';
import { OnboardingTwo } from './components/OnboardingTwo';
import { LevelSelection } from './components/LevelSelection';
import { CountrySelection } from './components/CountrySelection';
import { CulturalSummary } from './components/CulturalSummary';
import { ScenarioSelection } from './components/ScenarioSelection';
import { ConversationScreen } from './components/ConversationScreen';
import { FeedbackScreen } from './components/FeedbackScreen';
import { getLanguageLabel } from './lib/presentation';
import {
  createConversationSession,
  fetchMyLanguageLevel,
  fetchMyProfile,
  updateMyLanguageLevel,
  updateMyProfile,
} from './lib/triptalk-api';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import type {
  Country,
  Level,
  Screen,
  SelectedScenario,
  UserProfileApiResponse,
} from './lib/types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [selectedLevel, setSelectedLevel] = useState<Level>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<SelectedScenario | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfileApiResponse | null>(null);
  const [profileReady, setProfileReady] = useState(!isSupabaseConfigured);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingLevel, setIsSavingLevel] = useState(false);
  const [levelContext, setLevelContext] = useState<'onboarding' | 'scenario'>('onboarding');

  function parseVocabularyHints(raw: string | null | undefined): string[] | null {
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : null;
    } catch {
      return null;
    }
  }

  function resetFlowState() {
    setCurrentScreen('splash');
    setSelectedLevel(null);
    setSelectedCountry(null);
    setSelectedCountryId(null);
    setSelectedScenario(null);
    setSessionId(null);
    setProfile(null);
    setProfileError(null);
    setProfileReady(!isSupabaseConfigured);
    setIsSavingLevel(false);
    setLevelContext('onboarding');
  }

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured && !session) {
      setProfile(null);
      setProfileReady(true);
      setProfileError(null);
      return;
    }

    let ignore = false;

    async function loadProfile() {
      setProfileReady(false);
      setProfileError(null);

      try {
        const nextProfile = await fetchMyProfile();
        if (ignore) {
          return;
        }

        setProfile(nextProfile);
      } catch {
        if (!ignore) {
          setProfileError('Impossible de charger le profil utilisateur.');
          setProfile(null);
        }
      } finally {
        if (!ignore) {
          setProfileReady(true);
        }
      }
    }

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, [session]);

  const handleLevelSelect = async (level: Exclude<Level, null>) => {
    setSelectedLevel(level);
    setProfileError(null);
    if (levelContext === 'onboarding') {
      setCurrentScreen('country');
      return;
    }

    if (!selectedScenario) {
      setProfileError("Impossible de retrouver le scénario sélectionné.");
      return;
    }

    try {
      setIsSavingLevel(true);
      await updateMyLanguageLevel(selectedScenario.language_code, level);
      const createdSession = await createConversationSession(selectedScenario.id, level);
      setSessionId(createdSession.id);
      setCurrentScreen('conversation');
    } catch {
      setProfileError("Impossible d'enregistrer le niveau pour cette langue.");
    } finally {
      setIsSavingLevel(false);
    }
  };

  const handleCountrySelect = (country: Exclude<Country, null>, countryId: number) => {
    setSelectedCountry(country);
    setSelectedCountryId(countryId);
    setCurrentScreen('cultural');
  };

  const handleScenarioSelect = async (scenario: SelectedScenario) => {
    setSelectedScenario(scenario);
    setProfileError(null);
    setLevelContext('scenario');

    try {
      const languageLevel = await fetchMyLanguageLevel(scenario.language_code);
      const nextLevel = languageLevel?.level;
      if (
        nextLevel === 'Débutant' ||
        nextLevel === 'Intermédiaire' ||
        nextLevel === 'Avancé'
      ) {
        setSelectedLevel(nextLevel);
      } else {
        setSelectedLevel(null);
      }
    } catch {
      setSelectedLevel(null);
      setProfileError("Impossible de charger le niveau pour cette langue.");
    }

    setCurrentScreen('level');
  };

  async function handleSignOut() {
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
    resetFlowState();
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-gray-500">
        Initialisation de la session...
      </div>
    );
  }

  if (isSupabaseConfigured && !session) {
    return <AuthScreen onAuthenticated={() => undefined} />;
  }

  if (!profileReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-gray-500">
        Chargement du profil...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {session && (
        <div className="absolute right-6 top-6 z-10 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-gray-400">Connecté</p>
            <p className="text-sm text-gray-700">{profile?.email ?? session.user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
          >
            Déconnexion
          </button>
        </div>
      )}
      {currentScreen === 'splash' && (
        <SplashScreen onStart={() => setCurrentScreen('onboarding1')} />
      )}
      {currentScreen === 'onboarding1' && (
        <OnboardingOne onNext={() => setCurrentScreen('onboarding2')} />
      )}
      {currentScreen === 'onboarding2' && (
        <OnboardingTwo onNext={() => setCurrentScreen('country')} />
      )}
      {currentScreen === 'level' && (
        <LevelSelection
          selectedLevel={selectedLevel}
          onSelect={(level) => void handleLevelSelect(level)}
          isSaving={isSavingLevel}
          error={profileError}
          languageLabel={
            selectedScenario?.language_code
              ? getLanguageLabel(selectedScenario.language_code)
              : undefined
          }
          scenarioTitle={levelContext === 'scenario' ? selectedScenario?.title : undefined}
        />
      )}
      {currentScreen === 'country' && (
        <CountrySelection onSelect={handleCountrySelect} />
      )}
      {currentScreen === 'cultural' && (
        <CulturalSummary 
          country={selectedCountry!} 
          onNext={() => setCurrentScreen('scenario')} 
        />
      )}
      {currentScreen === 'scenario' && (
        <ScenarioSelection 
          country={selectedCountry!}
          countryId={selectedCountryId!}
          onSelect={(scenario) => void handleScenarioSelect(scenario)}
        />
      )}
      {currentScreen === 'conversation' && (
        <ConversationScreen 
          country={selectedCountry!}
          scenario={selectedScenario!.title}
          sessionId={sessionId!}
          introMessage={selectedScenario?.intro_message}
          culturalTip={selectedScenario?.cultural_tip}
          vocabularyHints={parseVocabularyHints(selectedScenario?.vocabulary_hints)}
          partnerName={selectedScenario?.partner_name}
          partnerRole={selectedScenario?.partner_role}
          onFeedback={() => setCurrentScreen('feedback')}
        />
      )}
      {currentScreen === 'feedback' && (
        <FeedbackScreen 
          sessionId={sessionId!}
          onRetry={() => setCurrentScreen('conversation')}
          onNewScenario={() => setCurrentScreen('scenario')}
          onChangeCountry={() => setCurrentScreen('country')}
        />
      )}
    </div>
  );
}
