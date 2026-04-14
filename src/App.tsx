import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { AuthScreen } from './components/AuthScreen';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingOne } from './components/OnboardingOne';
import { OnboardingTwo } from './components/OnboardingTwo';
import { LevelSelection } from './components/LevelSelection';
import { HistoryScreen } from './components/HistoryScreen';
import { AppShell } from './components/AppShell';
import { CountrySelection } from './components/CountrySelection';
import { CulturalSummary } from './components/CulturalSummary';
import { ScenarioSelection } from './components/ScenarioSelection';
import { ConversationScreen } from './components/ConversationScreen';
import { FeedbackScreen } from './components/FeedbackScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { getLanguageLabel } from './lib/presentation';
import {
  createConversationSession,
  fetchMyConversationHistory,
  fetchMyLanguageLevel,
  fetchMyProfile,
  updateMyLanguageLevel,
  updateMyProfile,
} from './lib/triptalk-api';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import type {
  Country,
  ConversationSessionHistoryApiResponse,
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
  const [historyItems, setHistoryItems] = useState<ConversationSessionHistoryApiResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

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
    setHistoryItems([]);
    setHistoryLoading(false);
    setHistoryError(null);
  }

  function getActiveSection(): 'explorer' | 'history' | 'profile' | 'conversation' {
    if (currentScreen === 'history') {
      return 'history';
    }

    if (currentScreen === 'profile') {
      return 'profile';
    }

    if (currentScreen === 'conversation' || currentScreen === 'feedback') {
      return 'conversation';
    }

    return 'explorer';
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

  async function loadHistory() {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const items = await fetchMyConversationHistory();
      setHistoryItems(items);
    } catch {
      setHistoryError("Impossible de charger l'historique.");
    } finally {
      setHistoryLoading(false);
    }
  }

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

  function openHistory() {
    void loadHistory();
    setCurrentScreen('history');
  }

  function openProfile() {
    setCurrentScreen('profile');
  }

  function openExplorer() {
    setCurrentScreen(selectedCountry ? 'scenario' : 'country');
  }

  function startNewConversation() {
    setSelectedLevel(null);
    setSelectedCountry(null);
    setSelectedCountryId(null);
    setSelectedScenario(null);
    setSessionId(null);
    setProfileError(null);
    setLevelContext('scenario');
    setCurrentScreen('country');
  }

  function handleOpenConversationFromHistory(item: ConversationSessionHistoryApiResponse) {
    setSelectedCountry(item.country_name);
    setSelectedScenario({
      id: item.scenario_id,
      title: item.scenario_title,
      language_code: item.language_code,
      mode: item.mode,
      intro_message: item.intro_message,
      cultural_tip: item.cultural_tip,
      vocabulary_hints: item.vocabulary_hints,
      partner_name: item.partner_name,
      partner_role: item.partner_role,
    });
    setSessionId(item.id);
    setCurrentScreen('conversation');
  }

  function handleOpenFeedbackFromHistory(item: ConversationSessionHistoryApiResponse) {
    setSelectedCountry(item.country_name);
    setSelectedScenario({
      id: item.scenario_id,
      title: item.scenario_title,
      language_code: item.language_code,
      mode: item.mode,
      intro_message: item.intro_message,
      cultural_tip: item.cultural_tip,
      vocabulary_hints: item.vocabulary_hints,
      partner_name: item.partner_name,
      partner_role: item.partner_role,
    });
    setSessionId(item.id);
    setCurrentScreen('feedback');
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

  if (currentScreen === 'splash') {
    return <SplashScreen onStart={() => setCurrentScreen('onboarding1')} />;
  }

  if (currentScreen === 'onboarding1') {
    return <OnboardingOne onNext={() => setCurrentScreen('onboarding2')} />;
  }

  if (currentScreen === 'onboarding2') {
    return <OnboardingTwo onNext={() => setCurrentScreen('country')} />;
  }

  return (
    <AppShell
      activeSection={getActiveSection()}
      userEmail={profile?.email ?? session?.user.email ?? ''}
      onGoExplorer={openExplorer}
      onGoHistory={openHistory}
      onGoProfile={openProfile}
      onNewConversation={startNewConversation}
      onSignOut={() => void handleSignOut()}
    >
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
      {currentScreen === 'profile' && (
        <ProfileScreen
          profile={profile}
          onProfileUpdated={setProfile}
        />
      )}
      {currentScreen === 'history' && (
        <HistoryScreen
          items={historyItems}
          isLoading={historyLoading}
          error={historyError}
          onOpenConversation={handleOpenConversationFromHistory}
          onOpenFeedback={handleOpenFeedbackFromHistory}
          onRefresh={() => void loadHistory()}
          onStartNew={startNewConversation}
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
    </AppShell>
  );
}
