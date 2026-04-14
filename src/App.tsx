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
import { createConversationSession } from './lib/triptalk-api';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import type { Country, Level, Screen, SelectedScenario } from './lib/types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [selectedLevel, setSelectedLevel] = useState<Level>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<SelectedScenario | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);

  function resetFlowState() {
    setCurrentScreen('splash');
    setSelectedLevel(null);
    setSelectedCountry(null);
    setSelectedCountryId(null);
    setSelectedScenario(null);
    setSessionId(null);
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

  const handleLevelSelect = (level: Level) => {
    setSelectedLevel(level);
    setCurrentScreen('country');
  };

  const handleCountrySelect = (country: Exclude<Country, null>, countryId: number) => {
    setSelectedCountry(country);
    setSelectedCountryId(countryId);
    setCurrentScreen('cultural');
  };

  const handleScenarioSelect = async (scenario: SelectedScenario) => {
    const session = await createConversationSession(scenario.id);
    setSelectedScenario(scenario);
    setSessionId(session.id);
    setCurrentScreen('conversation');
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

  return (
    <div className="min-h-screen bg-neutral-50">
      {session && (
        <div className="absolute right-6 top-6 z-10 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-gray-400">Connecté</p>
            <p className="text-sm text-gray-700">{session.user.email}</p>
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
        <OnboardingTwo onNext={() => setCurrentScreen('level')} />
      )}
      {currentScreen === 'level' && (
        <LevelSelection onSelect={handleLevelSelect} />
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
          onSelect={handleScenarioSelect}
        />
      )}
      {currentScreen === 'conversation' && (
        <ConversationScreen 
          country={selectedCountry!}
          scenario={selectedScenario!.title}
          sessionId={sessionId!}
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
