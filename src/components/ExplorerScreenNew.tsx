import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

import {
  getCountryPresentation,
  getLanguageLabel,
  getScenarioPresentation,
  LAUNCH_COUNTRY_CODES,
} from '../lib/presentation';
import { fetchCountries, fetchCountryScenarios } from '../lib/triptalk-api';
import type { CountryApiItem, ScenarioApiItem, SelectedScenario } from '../lib/types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface ExplorerScreenProps {
  selectedCountry: string | null;
  selectedCountryId: number | null;
  selectedScenario: SelectedScenario | null;
  error: string | null;
  isStartingSession: boolean;
  onSelectCountry: (name: string, id: number) => void;
  onSelectScenario: (scenario: ScenarioApiItem) => Promise<void>;
  onStartConversation: () => void;
}

export function ExplorerScreenNew({
  selectedCountry,
  selectedCountryId,
  selectedScenario,
  error,
  isStartingSession,
  onSelectCountry,
  onSelectScenario,
  onStartConversation,
}: ExplorerScreenProps) {
  const [countries, setCountries] = useState<CountryApiItem[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioApiItem[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [scenariosError, setScenariosError] = useState<string | null>(null);
  const [scenarioActionId, setScenarioActionId] = useState<number | null>(null);
  const [countryReloadKey, setCountryReloadKey] = useState(0);
  const [scenarioReloadKey, setScenarioReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoadingCountries(true);
      setCountriesError(null);
      try {
        const data = await fetchCountries();
        if (!ignore) {
          setCountries(data);
        }
      } catch (caughtError) {
        if (!ignore) {
          const message =
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load destinations right now.';
          setCountries([]);
          setCountriesError(message);
        }
      } finally {
        if (!ignore) {
          setLoadingCountries(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [countryReloadKey]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (selectedCountryId === null) {
        setScenarios([]);
        setScenariosError(null);
        setLoadingScenarios(false);
        return;
      }

      setLoadingScenarios(true);
      setScenariosError(null);
      try {
        const data = await fetchCountryScenarios(selectedCountryId);
        if (!ignore) {
          setScenarios(data);
        }
      } catch (caughtError) {
        if (!ignore) {
          const message =
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load scenarios right now.';
          setScenarios([]);
          setScenariosError(message);
        }
      } finally {
        if (!ignore) {
          setLoadingScenarios(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [selectedCountryId, scenarioReloadKey]);

  async function handleScenarioPick(scenario: ScenarioApiItem) {
    setScenarioActionId(scenario.id);
    await onSelectScenario(scenario);
    setScenarioActionId(null);
  }

  const countryCodeToFilename: Record<string, string> = {
    'CL': 'chile',
    'US': 'usa',
    'ES': 'spain',
    'MX': 'mexico',
    'FR': 'france',
    'GB': 'uk',
  };

  const countryImageExists = (code: string): boolean => {
    return code in countryCodeToFilename;
  };

  const getCountryImageUrl = (code: string): string => {
    const filename = countryCodeToFilename[code] || code.toLowerCase();
    return `/images/countries/${filename}.jpg`;
  };

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-12">
        <h1 className="mb-3 text-4xl font-bold text-gray-900">
          Get ready before you <span className="text-orange-500">arrive</span>
        </h1>
        <p className="max-w-3xl text-lg text-gray-600">
          Explore countries, rehearse realistic scenarios, and learn the tone, expressions, and
          small cultural cues that make a conversation feel local.
        </p>
      </header>

      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Destinations</h2>

        {loadingCountries && (
          <div className="flex justify-center py-12">
            <LoadingSpinner text="Loading countries..." />
          </div>
        )}

        {countriesError && !loadingCountries && (
          <ErrorMessage
            message={countriesError}
            onRetry={() => setCountryReloadKey((current) => current + 1)}
          />
        )}

        {!loadingCountries && !countriesError && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {countries.map((country) => {
              const presentation = getCountryPresentation(country.name, country.code);
              const isActive = country.id === selectedCountryId;
              const hasImage = countryImageExists(country.code);
              const isFeatured = country.code === 'CL';
              const isLaunchCountry = LAUNCH_COUNTRY_CODES.includes(country.code);

              return (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => {
                    if (isLaunchCountry) {
                      onSelectCountry(country.name, country.id);
                    }
                  }}
                  disabled={!isLaunchCountry}
                  className={`group relative overflow-hidden rounded-2xl transition-all ${
                    !isLaunchCountry
                      ? 'cursor-not-allowed grayscale opacity-55'
                      : isActive
                      ? 'ring-4 ring-orange-500'
                      : 'hover:scale-[1.02] hover:shadow-xl'
                  }`}
                >
                  {hasImage ? (
                    <div className="relative h-64">
                      <img
                        src={getCountryImageUrl(country.code)}
                        alt={country.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 hidden bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  ) : (
                    <div className={`h-64 ${presentation.bgColor}`} />
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-4xl">{presentation.flag}</span>
                      <h3 className="text-2xl font-bold">{country.name}</h3>
                    </div>
                    <p className="text-sm text-white/90">{presentation.tagline}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {isFeatured && (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-orange-600">
                          <Sparkles className="h-4 w-4" />
                          Featured
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium text-white">
                          Selected
                        </span>
                      )}
                      {!isLaunchCountry && (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-700">
                          Soon
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedCountryId !== null && (
        <section className="mb-16">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Scenarios in {selectedCountry}</h2>
            <p className="mt-1 text-gray-600">
              Pick a situation you want to feel ready for.
            </p>
          </div>

          {loadingScenarios && (
            <div className="flex justify-center py-12">
              <LoadingSpinner text="Loading scenarios..." />
            </div>
          )}

          {scenariosError && !loadingScenarios && (
            <div className="mb-6">
              <ErrorMessage
                message={scenariosError}
                onRetry={() => setScenarioReloadKey((current) => current + 1)}
              />
            </div>
          )}

          {!loadingScenarios && !scenariosError && (
            <div className="grid gap-6 md:grid-cols-2">
              {scenarios.map((scenario) => {
                const presentation = getScenarioPresentation(scenario.slug);
                const Icon = presentation.icon;
                const isActive = selectedScenario?.id === scenario.id;
                const isWorking = scenarioActionId === scenario.id;
                const isFeatured = selectedCountry === 'Chile' && scenario.slug === 'aeroport-santiago';

                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => void handleScenarioPick(scenario)}
                    disabled={isStartingSession}
                    className={`rounded-2xl border-2 bg-white p-6 text-left transition-all ${
                      isActive
                        ? 'border-orange-500 shadow-lg'
                        : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`rounded-xl p-3 ${presentation.color}`}>
                        <Icon className={`h-6 w-6 ${presentation.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-gray-900">{scenario.title}</h3>
                          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                            {scenario.mode === 'free' ? 'Free' : 'Guided'}
                          </span>
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            {getLanguageLabel(scenario.language_code)}
                          </span>
                          {isFeatured && (
                            <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                              Recommended first
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{scenario.description}</p>
                        {isWorking && (
                          <p className="mt-3 text-sm text-gray-500">Preparing this conversation...</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedScenario && (
            <div className="mt-8 rounded-2xl border-2 border-orange-200 bg-orange-50 p-6">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Ready to enter this situation?
              </h3>
              <p className="mb-6 text-sm text-gray-700">
                You will practice this scene in {getLanguageLabel(selectedScenario.language_code)}
                {selectedScenario.mode === 'free'
                  ? ' with a more open-ended local conversation.'
                  : ' with a more guided local exchange.'}
              </p>

              <button
                type="button"
                onClick={onStartConversation}
                disabled={isStartingSession}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-4 font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStartingSession ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Starting conversation...
                  </>
                ) : (
                  <>
                    Start Conversation
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-6">
              <ErrorMessage message={error} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
