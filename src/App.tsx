import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { AuthScreen } from './components/AuthScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { ExplorerScreenNew as ExplorerScreen } from './components/ExplorerScreenNew';
import { Sidebar } from './components/Sidebar';
import { ConversationScreenNew as ConversationScreen } from './components/ConversationScreenNew';
import { FeedbackScreen } from './components/FeedbackScreen';
import { ProfileScreen } from './components/ProfileScreen';
import {
  createConversationSession,
  fetchMyConversationHistory,
  fetchMyLanguageLevel,
  fetchMyProfile,
  updateMyLanguageLevel,
} from './lib/triptalk-api';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { clearTokenCache } from './lib/auth-cache';
import type {
  Country,
  ConversationSessionHistoryApiResponse,
  Level,
  Screen,
  SelectedScenario,
  UserProfileApiResponse,
} from './lib/types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('explorer');
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
  const [isPreparingScenario, setIsPreparingScenario] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);
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
    setCurrentScreen('explorer');
    setSelectedLevel(null);
    setSelectedCountry(null);
    setSelectedCountryId(null);
    setSelectedScenario(null);
    setSessionId(null);
    setProfile(null);
    setProfileError(null);
    setProfileReady(!isSupabaseConfigured);
    setIsPreparingScenario(false);
    setIsStartingSession(false);
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

  const handleLevelSelect = (level: Exclude<Level, null>) => {
    setSelectedLevel(level);
    setProfileError(null);
  };

  async function handleStartConversation() {
    if (!selectedScenario) {
      setProfileError("Impossible de retrouver le scénario sélectionné.");
      return;
    }
    if (!selectedLevel) {
      setProfileError('Choisis un niveau avant de démarrer.');
      return;
    }

    try {
      setIsStartingSession(true);
      await updateMyLanguageLevel(selectedScenario.language_code, selectedLevel);
      const createdSession = await createConversationSession(selectedScenario.id, selectedLevel);
      setSessionId(createdSession.id);
      setCurrentScreen('conversation');
    } catch {
      setProfileError("Impossible d'enregistrer le niveau pour cette langue.");
    } finally {
      setIsStartingSession(false);
    }
  }

  const handleCountrySelect = (country: string, countryId: number) => {
    setSelectedCountry(country);
    setSelectedCountryId(countryId);
    setSelectedScenario(null);
    setSelectedLevel(null);
    setProfileError(null);
  };

  const handleScenarioSelect = async (scenario: SelectedScenario) => {
    setSelectedScenario(scenario);
    setProfileError(null);
    setIsPreparingScenario(true);

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
    } finally {
      setIsPreparingScenario(false);
    }
  };

  async function handleSignOut() {
    if (!supabase) {
      return;
    }
    clearTokenCache();
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
    setCurrentScreen('explorer');
  }

  function startNewConversation() {
    setSelectedLevel(null);
    setSelectedCountry(null);
    setSelectedCountryId(null);
    setSelectedScenario(null);
    setSessionId(null);
    setProfileError(null);
    setCurrentScreen('explorer');
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

  return (
    <div className="flex min-h-screen bg-[#FFF8F2]">
      <Sidebar
        activeSection={getActiveSection()}
        userEmail={profile?.email ?? session?.user.email ?? ''}
        onGoExplorer={openExplorer}
        onGoConversation={openExplorer}
        onGoHistory={openHistory}
        onGoProfile={openProfile}
        onSignOut={() => void handleSignOut()}
      />
      <main className="ml-60 flex-1 p-8">
      {currentScreen === 'profile' && (
        <ProfileScreen
          profile={profile}
          onProfileUpdated={setProfile}
        />
      )}
      {currentScreen === 'explorer' && (
        <ExplorerScreen
          selectedCountry={selectedCountry}
          selectedCountryId={selectedCountryId}
          selectedScenario={selectedScenario}
          selectedLevel={selectedLevel}
          error={profileError}
          isPreparingScenario={isPreparingScenario}
          isStartingSession={isStartingSession}
          onSelectCountry={handleCountrySelect}
          onSelectScenario={(scenario) => void handleScenarioSelect(scenario)}
          onSelectLevel={handleLevelSelect}
          onStartConversation={() => void handleStartConversation()}
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
      {currentScreen === 'conversation' && (
        <ConversationScreen 
          country={selectedCountry!}
          scenario={selectedScenario!.title}
          sessionId={sessionId!}
          languageCode={selectedScenario?.language_code}
          mode={selectedScenario?.mode}
          introMessage={selectedScenario?.intro_message}
          culturalTip={selectedScenario?.cultural_tip}
          vocabularyHints={parseVocabularyHints(selectedScenario?.vocabulary_hints)}
          partnerName={selectedScenario?.partner_name}
          partnerRole={selectedScenario?.partner_role}
          onBackToExplorer={openExplorer}
          onFeedback={() => setCurrentScreen('feedback')}
        />
      )}
      {currentScreen === 'feedback' && (
        <FeedbackScreen 
          sessionId={sessionId!}
          onRetry={() => setCurrentScreen('conversation')}
          onNewScenario={openExplorer}
          onChangeCountry={startNewConversation}
        />
      )}
      </main>
    </div>
  );
}
