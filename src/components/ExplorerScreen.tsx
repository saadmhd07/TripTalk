import { useEffect, useState } from 'react';
import { Globe2, Sparkles, Wand2 } from 'lucide-react';

import {
  getCountryPresentation,
  getCulturalSummary,
  getLanguageLabel,
  getScenarioPresentation,
} from '../lib/presentation';
import { fetchCountries, fetchCountryScenarios } from '../lib/triptalk-api';
import type { Country, CountryApiItem, Level, ScenarioApiItem, SelectedScenario } from '../lib/types';

interface ExplorerScreenProps {
  selectedCountry: Country;
  selectedCountryId: number | null;
  selectedScenario: SelectedScenario | null;
  selectedLevel: Level;
  error: string | null;
  isPreparingScenario: boolean;
  isStartingSession: boolean;
  onSelectCountry: (country: string, countryId: number) => void;
  onSelectScenario: (scenario: ScenarioApiItem) => Promise<void>;
  onSelectLevel: (level: Exclude<Level, null>) => void;
  onStartConversation: () => void;
}

const levelOptions: Exclude<Level, null>[] = ['Débutant', 'Intermédiaire', 'Avancé'];

export function ExplorerScreen({
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

    async function loadCountries() {
      setLoadingCountries(true);
      try {
        const data = await fetchCountries();
        if (!ignore) {
          setCountries(data);
        }
      } finally {
        if (!ignore) {
          setLoadingCountries(false);
        }
      }
    }

    void loadCountries();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (loadingCountries || selectedCountryId !== null || countries.length === 0) {
      return;
    }

    const firstCountry = countries[0];
    onSelectCountry(firstCountry.name, firstCountry.id);
  }, [countries, loadingCountries, onSelectCountry, selectedCountryId]);

  useEffect(() => {
    if (!selectedCountryId) {
      setScenarios([]);
      return;
    }

    let ignore = false;

    async function loadScenarios() {
      setLoadingScenarios(true);
      try {
        const data = await fetchCountryScenarios(selectedCountryId);
        if (!ignore) {
          setScenarios(data);
        }
      } finally {
        if (!ignore) {
          setLoadingScenarios(false);
        }
      }
    }

    void loadScenarios();

    return () => {
      ignore = true;
    };
  }, [selectedCountryId]);

  const selectedCountryItem =
    countries.find((country) => country.id === selectedCountryId) ?? null;
  const countryPresentation = selectedCountryItem
    ? getCountryPresentation(selectedCountryItem.name, selectedCountryItem.code)
    : null;
  const culturalSummary = selectedCountry ? getCulturalSummary(selectedCountry) : null;

  async function handleScenarioPick(scenario: ScenarioApiItem) {
    setScenarioActionId(scenario.id);
    try {
      await onSelectScenario(scenario);
    } finally {
      setScenarioActionId(null);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-180px)] gap-10 xl:grid-cols-[270px_minmax(0,1.7fr)_340px] xl:gap-12 2xl:grid-cols-[290px_minmax(0,1.9fr)_360px] 2xl:gap-14">
      <section className="rounded-[2rem] bg-white p-5 shadow-sm xl:sticky xl:top-28 xl:h-fit">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
            <Globe2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl text-gray-900">Pays</h2>
            <p className="text-sm text-gray-500">Choisis ton univers culturel</p>
          </div>
        </div>

        <div className="space-y-3">
          {loadingCountries && <p className="text-sm text-gray-500">Chargement des pays...</p>}
          {!loadingCountries &&
            countries.map((country) => {
              const presentation = getCountryPresentation(country.name, country.code);
              const isActive = country.id === selectedCountryId;

              return (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => onSelectCountry(country.name, country.id)}
                  className={`w-full rounded-3xl border px-4 py-5 text-left transition ${
                    isActive
                      ? 'border-orange-300 bg-orange-50 shadow-sm'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-3xl">{presentation.flag}</span>
                    <div>
                      <p className="text-lg text-gray-900">{country.name}</p>
                      <p className="text-sm text-gray-500">{getLanguageLabel(country.language)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{presentation.description}</p>
                </button>
              );
            })}
        </div>
      </section>

      <section className="space-y-8">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
          {countryPresentation ? (
            <div className="relative min-h-[320px]">
              <img
                src={countryPresentation.image}
                alt={selectedCountry ?? 'Destination'}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${countryPresentation.gradient}`} />
              <div className="relative flex min-h-[320px] flex-col justify-between p-9 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-3 text-sm uppercase tracking-[0.3em] text-white/75">Explorer</p>
                    <p className="text-6xl">{countryPresentation.flag}</p>
                  </div>
                  {selectedCountryItem && (
                    <div className="rounded-2xl bg-white/15 px-4 py-3 text-right backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-wide text-white/70">Langue principale</p>
                      <p className="mt-1 text-base">{getLanguageLabel(selectedCountryItem.language)}</p>
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-6xl">{selectedCountry}</h1>
                  <p className="mt-4 max-w-3xl text-xl text-white/85">{countryPresentation.description}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-gray-200 bg-white text-center">
              <h1 className="text-3xl text-gray-900">Explorer</h1>
              <p className="mt-3 max-w-lg text-gray-500">
                Choisis un pays à gauche pour découvrir ses scénarios guidés et libres.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl text-gray-900">Scénarios</h2>
              <p className="text-sm text-gray-500">
                {selectedCountry
                  ? `Choisis une situation pour ${selectedCountry}.`
                  : 'Sélectionne un pays pour charger les scénarios.'}
              </p>
            </div>
          </div>

          <div className="grid gap-6 2xl:grid-cols-2">
            {selectedCountryId === null && (
              <p className="rounded-2xl bg-gray-50 p-5 text-gray-500 2xl:col-span-2">
                Aucun pays sélectionné pour le moment.
              </p>
            )}
            {selectedCountryId !== null && loadingScenarios && (
              <p className="rounded-2xl bg-gray-50 p-5 text-gray-500 2xl:col-span-2">Chargement des scénarios...</p>
            )}
            {selectedCountryId !== null &&
              !loadingScenarios &&
              scenarios.map((scenario) => {
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
                    className={`w-full rounded-3xl border p-6 text-left transition ${
                      isActive
                        ? 'border-orange-300 bg-orange-50 shadow-sm'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`rounded-2xl p-4 ${presentation.color}`}>
                        <Icon className={`h-7 w-7 ${presentation.iconColor}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="text-xl text-gray-900">{scenario.title}</h3>
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                            {scenario.mode === 'free' ? 'Libre' : 'Guidé'}
                          </span>
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                            {getLanguageLabel(scenario.language_code)}
                          </span>
                        </div>
                        <p className="text-gray-600">{scenario.description}</p>
                        {isWorking && (
                          <p className="mt-3 text-sm text-gray-500">
                            Chargement des paramètres de session...
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </section>

      <aside className="space-y-7 xl:sticky xl:top-28 xl:h-fit">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl text-gray-900">Préparation</h2>
              <p className="text-sm text-gray-500">Ajuste la session avant de démarrer</p>
            </div>
          </div>

          {!selectedScenario && (
            <p className="rounded-2xl bg-gray-50 p-5 text-gray-500">
              Sélectionne un scénario pour préparer la conversation.
            </p>
          )}

          {selectedScenario && (
            <div className="space-y-5">
              <div className="rounded-3xl bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 p-5 text-white shadow-lg">
                <p className="text-sm uppercase tracking-wide text-white/70">
                  {selectedScenario.mode === 'free' ? 'Conversation libre' : 'Scénario guidé'}
                </p>
                <h3 className="mt-2 text-2xl">{selectedScenario.title}</h3>
                <p className="mt-3 text-white/85">
                  Langue : {getLanguageLabel(selectedScenario.language_code)}
                </p>
              </div>

              <div>
                <p className="mb-3 text-sm uppercase tracking-wide text-gray-400">Niveau pour cette langue</p>
                <div className="grid grid-cols-3 gap-2">
                  {levelOptions.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => onSelectLevel(level)}
                      disabled={isStartingSession}
                      className={`rounded-2xl px-3 py-3 text-sm transition ${
                        selectedLevel === level
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={onStartConversation}
                disabled={isStartingSession || selectedLevel === null}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-4 text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStartingSession ? 'Démarrage...' : 'Démarrer la conversation'}
              </button>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}
        </section>

        {selectedCountry && culturalSummary && (
          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl text-gray-900">Repères culturels</h2>
            <p className="mt-2 text-sm text-gray-500">Quelques clés avant de te lancer</p>
            <div className="mt-5 space-y-3">
              {culturalSummary.keywords.map((keyword, index) => {
                const Icon = keyword.icon;
                return (
                  <div key={index} className={`${keyword.color} rounded-2xl p-4`}>
                    <div className="mb-3 inline-flex rounded-xl bg-white/80 p-2">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base text-gray-900">{keyword.title}</h3>
                    <p className="mt-2 text-sm text-gray-700">{keyword.text}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}
