import { useEffect, useState } from 'react';
import { ArrowRight, Globe2, Sparkles } from 'lucide-react';

import {
  getCountryPresentation,
  getLanguageLabel,
  getScenarioPresentation,
} from '../lib/presentation';
import { fetchCountries, fetchCountryScenarios } from '../lib/triptalk-api';
import type { CountryApiItem, Level, ScenarioApiItem, SelectedScenario } from '../lib/types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface ExplorerScreenProps {
  selectedCountry: string | null;
  selectedCountryId: number | null;
  selectedScenario: SelectedScenario | null;
  selectedLevel: Level;
  error: string | null;
  isPreparingScenario: boolean;
  isStartingSession: boolean;
  onSelectCountry: (name: string, id: number) => void;
  onSelectScenario: (scenario: ScenarioApiItem) => Promise<void>;
  onSelectLevel: (level: Level) => void;
  onStartConversation: () => void;
}

export function ExplorerScreenNew({
  selectedCountry,
  selectedCountryId,
  selectedScenario,
  selectedLevel,
  error,
  isPreparingScenario,
  isStartingSession,
  onSelectCountry,
  onSelectScenario,
  onSelectLevel,
  onStartConversation,
}: ExplorerScreenProps) {
  const [countries, setCountries] = useState<CountryApiItem[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [scenarios, setScenarios] = useState<ScenarioApiItem[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [scenarioActionId, setScenarioActionId] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await fetchCountries();
        if (!ignore) {
          setCountries(data);
          setLoadingCountries(false);
        }
      } catch {
        if (!ignore) {
          setLoadingCountries(false);
        }
      }
    }

    if (countries.length === 0) {
      void load();
    }

    return () => {
      ignore = true;
    };
  }, []); // Load only once on mount

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (selectedCountryId === null) {
        return;
      }

      setLoadingScenarios(true);
      try {
        const data = await fetchCountryScenarios(selectedCountryId);
        if (!ignore) {
          setScenarios(data);
          setLoadingScenarios(false);
        }
      } catch {
        if (!ignore) {
          setLoadingScenarios(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [selectedCountryId]);

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
      {/* Hero Header */}
      <header className="mb-12">
        <h1 className="mb-3 text-4xl font-bold text-gray-900">
          Get ready before you <span className="text-orange-500">arrive</span>
        </h1>
        <p className="text-lg text-gray-600">
          Practice realistic local conversations, pick up cultural cues, and build confidence
          before landing in a new country.
        </p>
      </header>

      {/* Recommended Countries */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Recommended for you</h2>

        {loadingCountries && (
          <div className="flex justify-center py-12">
            <LoadingSpinner text="Loading countries..." />
          </div>
        )}

        {!loadingCountries && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {countries.map((country) => {
              const presentation = getCountryPresentation(country.name, country.code);
              const isActive = country.id === selectedCountryId;
              const hasImage = countryImageExists(country.code);

              return (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => onSelectCountry(country.name, country.id)}
                  className={`group relative overflow-hidden rounded-2xl transition-all ${
                    isActive
                      ? 'ring-4 ring-orange-500'
                      : 'hover:scale-[1.02] hover:shadow-xl'
                  }`}
                >
                  {/* Image or gradient background */}
                  {hasImage ? (
                    <div className="relative h-64">
                      <img
                        src={getCountryImageUrl(country.code)}
                        alt={country.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          // Fallback to gradient if image fails
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent hidden`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  ) : (
                    <div className={`h-64 ${presentation.bgColor}`} />
                  )}

                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-4xl">{presentation.flag}</span>
                      <h3 className="text-2xl font-bold">{country.name}</h3>
                    </div>
                    <p className="text-sm text-white/90">{presentation.tagline}</p>

                    {isActive && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-orange-600">
                        <Sparkles className="h-4 w-4" />
                        Selected
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Scenarios Section - Only shows after country selected */}
      {selectedCountryId !== null && (
        <section className="mb-16">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Rehearse your first situations in {selectedCountry}
            </h2>
            <p className="mt-1 text-gray-600">Choose a moment you want to feel ready for</p>
          </div>

          {loadingScenarios && (
            <div className="flex justify-center py-12">
              <LoadingSpinner text="Loading scenarios..." />
            </div>
          )}

          {!loadingScenarios && (
            <div className="grid gap-6 md:grid-cols-2">
              {scenarios.map((scenario) => {
                const presentation = getScenarioPresentation(scenario.slug);
                const Icon = presentation.icon;
                const isActive = selectedScenario?.id === scenario.id;
                const isWorking = scenarioActionId === scenario.id && isPreparingScenario;

                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => void handleScenarioPick(scenario)}
                    disabled={isPreparingScenario}
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
                        </div>
                        <p className="text-sm text-gray-600">{scenario.description}</p>
                        {isWorking && (
                          <p className="mt-3 text-sm text-gray-500">
                            Loading session parameters...
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Level Selection - Only shows after scenario selected */}
          {selectedScenario && (
            <div className="mt-8 rounded-2xl border-2 border-orange-200 bg-orange-50 p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Choose your level for this session
              </h3>
              <div className="mb-6 grid grid-cols-3 gap-3">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onSelectLevel(level)}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      selectedLevel === level
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onStartConversation}
                disabled={isStartingSession || !selectedLevel}
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
