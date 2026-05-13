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
  completeConversationSession,
  createConversationSession,
  fetchConversationSession,
  fetchMyConversationHistory,
  fetchMyProfile,
} from './lib/triptalk-api';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { clearTokenCache } from './lib/auth-cache';
import type {
  Country,
  ConversationSessionHistoryApiResponse,
  Screen,
  SelectedScenario,
  UserProfileApiResponse,
} from './lib/types';

type AppRoute = {
  screen: Screen;
  sessionId: string | null;
};

function parseAppRoute(pathname: string): AppRoute {
  const normalized = pathname.replace(/\/+$/, '') || '/';

  if (normalized === '/history') {
    return { screen: 'history', sessionId: null };
  }

  if (normalized === '/profile') {
    return { screen: 'profile', sessionId: null };
  }

  if (normalized.startsWith('/conversation/')) {
    return {
      screen: 'conversation',
      sessionId: decodeURIComponent(normalized.replace('/conversation/', '')),
    };
  }

  if (normalized.startsWith('/feedback/')) {
    return {
      screen: 'feedback',
      sessionId: decodeURIComponent(normalized.replace('/feedback/', '')),
    };
  }

  return { screen: 'explorer', sessionId: null };
}

function buildPathForRoute(route: AppRoute): string {
  switch (route.screen) {
    case 'history':
      return '/history';
    case 'profile':
      return '/profile';
    case 'conversation':
      return route.sessionId ? `/conversation/${encodeURIComponent(route.sessionId)}` : '/explorer';
    case 'feedback':
      return route.sessionId ? `/feedback/${encodeURIComponent(route.sessionId)}` : '/explorer';
    case 'explorer':
    default:
      return '/explorer';
  }
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window === 'undefined' ? { screen: 'explorer', sessionId: null } : parseAppRoute(window.location.pathname)
  );
  const [selectedCountry, setSelectedCountry] = useState<Country>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<SelectedScenario | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeSessionStatus, setActiveSessionStatus] = useState<'active' | 'completed' | 'abandoned' | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfileApiResponse | null>(null);
  const [profileReady, setProfileReady] = useState(!isSupabaseConfigured);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [historyItems, setHistoryItems] = useState<ConversationSessionHistoryApiResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isCompletingSession, setIsCompletingSession] = useState(false);
  const [isHydratingRoute, setIsHydratingRoute] = useState(false);

  const currentScreen = route.screen;
  const activeSessionId = route.sessionId ?? sessionId;

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

  function navigateTo(nextRoute: AppRoute, options?: { replace?: boolean }) {
    const nextPath = buildPathForRoute(nextRoute);

    if (typeof window !== 'undefined') {
      const method = options?.replace ? 'replaceState' : 'pushState';
      if (window.location.pathname !== nextPath) {
        window.history[method](null, '', nextPath);
      }
    }

    setRoute(nextRoute);
  }

  function resetFlowState() {
    setSelectedCountry(null);
    setSelectedCountryId(null);
    setSelectedScenario(null);
    setSessionId(null);
    setActiveSessionStatus(null);
    setProfile(null);
    setProfileError(null);
    setProfileReady(!isSupabaseConfigured);
    setIsStartingSession(false);
    setHistoryItems([]);
    setHistoryLoading(false);
    setHistoryError(null);
    setIsCompletingSession(false);
    setIsHydratingRoute(false);
    navigateTo({ screen: 'explorer', sessionId: null }, { replace: true });
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
    const handlePopState = () => {
      setRoute(parseAppRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.location.pathname === '/' && authReady && (!isSupabaseConfigured || session)) {
      navigateTo({ screen: 'explorer', sessionId: null }, { replace: true });
    }
  }, [authReady, session]);

  useEffect(() => {
    if (currentScreen === 'history') {
      void loadHistory();
    }
  }, [currentScreen]);

  useEffect(() => {
    if (currentScreen !== 'conversation' && currentScreen !== 'feedback') {
      setIsHydratingRoute(false);
      return;
    }

    if (!route.sessionId) {
      navigateTo({ screen: 'explorer', sessionId: null }, { replace: true });
      return;
    }

    if (sessionId === route.sessionId && selectedScenario && selectedCountry) {
      setIsHydratingRoute(false);
      return;
    }

    let ignore = false;

    async function hydrateSessionRoute() {
      setIsHydratingRoute(true);
      setProfileError(null);

      try {
        const detail = await fetchConversationSession(route.sessionId!);
        if (ignore) {
          return;
        }

        setSessionId(detail.id);
        setActiveSessionStatus(detail.status);
        setSelectedCountry(detail.country_name);
        setSelectedCountryId(null);
        setSelectedScenario({
          id: detail.scenario_id,
          slug: '',
          title: detail.scenario_title,
          description: '',
          language_code: detail.language_code,
          mode: detail.mode,
          intro_message: detail.intro_message,
          cultural_tip: detail.cultural_tip,
          vocabulary_hints: detail.vocabulary_hints,
          partner_name: detail.partner_name,
          partner_role: detail.partner_role,
          avatar_id: detail.avatar_id,
        });
      } catch {
        if (!ignore) {
          setProfileError("Impossible de charger la session demandée.");
          navigateTo({ screen: 'explorer', sessionId: null }, { replace: true });
        }
      } finally {
        if (!ignore) {
          setIsHydratingRoute(false);
        }
      }
    }

    void hydrateSessionRoute();

    return () => {
      ignore = true;
    };
  }, [currentScreen, route.sessionId, sessionId, selectedScenario, selectedCountry]);

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

  async function handleStartConversation() {
    if (!selectedScenario) {
      setProfileError("Impossible de retrouver le scénario sélectionné.");
      return;
    }

    try {
      setIsStartingSession(true);
      const createdSession = await createConversationSession(selectedScenario.id);
      setSessionId(createdSession.id);
      setActiveSessionStatus('active');
      navigateTo({ screen: 'conversation', sessionId: createdSession.id });
    } catch {
      setProfileError("Impossible de démarrer cette conversation.");
    } finally {
      setIsStartingSession(false);
    }
  }

  const handleCountrySelect = (country: string, countryId: number) => {
    setSelectedCountry(country);
    setSelectedCountryId(countryId);
    setSelectedScenario(null);
    setProfileError(null);
  };

  const handleScenarioSelect = async (scenario: SelectedScenario) => {
    setSelectedScenario(scenario);
    setProfileError(null);
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
    navigateTo({ screen: 'history', sessionId: null });
  }

  function openProfile() {
    navigateTo({ screen: 'profile', sessionId: null });
  }

  function openExplorer() {
    navigateTo({ screen: 'explorer', sessionId: null });
  }

  function openConversation() {
    if (sessionId && selectedScenario) {
      navigateTo({ screen: 'conversation', sessionId });
      return;
    }

    navigateTo({ screen: 'explorer', sessionId: null });
  }

  function startNewConversation() {
    setSelectedCountry(null);
    setSelectedCountryId(null);
    setSelectedScenario(null);
    setSessionId(null);
    setActiveSessionStatus(null);
    setProfileError(null);
    setIsCompletingSession(false);
    navigateTo({ screen: 'explorer', sessionId: null });
  }

  async function handleOpenFeedback() {
    if (!sessionId) {
      setProfileError("Impossible de retrouver la session active.");
      return;
    }

    try {
      setIsCompletingSession(true);
      setProfileError(null);
      await completeConversationSession(sessionId);
      setActiveSessionStatus('completed');
      navigateTo({ screen: 'feedback', sessionId });
    } catch {
      setProfileError("Impossible de terminer la session pour générer le feedback.");
    } finally {
      setIsCompletingSession(false);
    }
  }

  function handleOpenConversationFromHistory(item: ConversationSessionHistoryApiResponse) {
    setSelectedCountry(item.country_name);
    setSelectedScenario({
      id: item.scenario_id,
      slug: '',
      title: item.scenario_title,
      description: '',
      language_code: item.language_code,
      mode: item.mode,
      intro_message: item.intro_message,
      cultural_tip: item.cultural_tip,
      vocabulary_hints: item.vocabulary_hints,
      partner_name: item.partner_name,
      partner_role: item.partner_role,
      avatar_id: item.avatar_id,
    });
    setSessionId(item.id);
    setActiveSessionStatus(item.status);
    navigateTo({ screen: 'conversation', sessionId: item.id });
  }

  function handleOpenFeedbackFromHistory(item: ConversationSessionHistoryApiResponse) {
    setSelectedCountry(item.country_name);
    setSelectedScenario({
      id: item.scenario_id,
      slug: '',
      title: item.scenario_title,
      description: '',
      language_code: item.language_code,
      mode: item.mode,
      intro_message: item.intro_message,
      cultural_tip: item.cultural_tip,
      vocabulary_hints: item.vocabulary_hints,
      partner_name: item.partner_name,
      partner_role: item.partner_role,
      avatar_id: item.avatar_id,
    });
    setSessionId(item.id);
    setActiveSessionStatus(item.status);
    navigateTo({ screen: 'feedback', sessionId: item.id });
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
        onGoConversation={openConversation}
        onGoHistory={openHistory}
        onGoProfile={openProfile}
        onSignOut={() => void handleSignOut()}
      />
      <main className="ml-60 flex-1 p-8">
      {isHydratingRoute && (currentScreen === 'conversation' || currentScreen === 'feedback') && (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-gray-500">Chargement de la session...</div>
        </div>
      )}
      {currentScreen === 'profile' && (
        <ProfileScreen
          profile={profile}
          onProfileUpdated={setProfile}
        />
      )}
      {currentScreen === 'explorer' && !isHydratingRoute && (
        <ExplorerScreen
          selectedCountry={selectedCountry}
          selectedCountryId={selectedCountryId}
          selectedScenario={selectedScenario}
          error={profileError}
          isStartingSession={isStartingSession}
          onSelectCountry={handleCountrySelect}
          onSelectScenario={(scenario) => void handleScenarioSelect(scenario)}
          onStartConversation={() => void handleStartConversation()}
        />
      )}
      {currentScreen === 'history' && !isHydratingRoute && (
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
      {currentScreen === 'conversation' && !isHydratingRoute && selectedCountry && selectedScenario && activeSessionId && (
        <ConversationScreen 
          country={selectedCountry}
          scenarioSlug={selectedScenario.slug}
          scenario={selectedScenario.title}
          scenarioDescription={selectedScenario?.description}
          sessionId={activeSessionId}
          languageCode={selectedScenario?.language_code}
          mode={selectedScenario?.mode}
          introMessage={selectedScenario?.intro_message}
          culturalTip={selectedScenario?.cultural_tip}
          vocabularyHints={parseVocabularyHints(selectedScenario?.vocabulary_hints)}
          partnerName={selectedScenario?.partner_name}
          partnerRole={selectedScenario?.partner_role}
          avatarId={selectedScenario?.avatar_id}
          userDisplayName={profile?.display_name}
          userEmail={profile?.email ?? session?.user.email}
          actionError={profileError}
          sessionStatus={activeSessionStatus ?? 'active'}
          onBackToExplorer={openExplorer}
          onFeedback={() => void handleOpenFeedback()}
          onSessionCompleted={() => setActiveSessionStatus('completed')}
          isCompletingSession={isCompletingSession}
        />
      )}
      {currentScreen === 'feedback' && !isHydratingRoute && activeSessionId && (
        <FeedbackScreen 
          sessionId={activeSessionId}
          onRetry={() => navigateTo({ screen: 'conversation', sessionId: activeSessionId })}
          onNewScenario={openExplorer}
          onChangeCountry={startNewConversation}
        />
      )}
      </main>
    </div>
  );
}
