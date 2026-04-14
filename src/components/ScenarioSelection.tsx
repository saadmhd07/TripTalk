import { useEffect, useState } from 'react';

import { scenarioPresentation } from '../lib/presentation';
import { fetchCountryScenarios } from '../lib/triptalk-api';
import type { CountryName, ScenarioApiItem } from '../lib/types';

interface ScenarioSelectionProps {
  country: CountryName;
  countryId: number;
  onSelect: (scenario: { id: number; title: string }) => Promise<void>;
}

export function ScenarioSelection({ country, countryId, onSelect }: ScenarioSelectionProps) {
  const [scenarios, setScenarios] = useState<ScenarioApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingTitle, setSubmittingTitle] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadScenarios() {
      setLoading(true);
      const data = await fetchCountryScenarios(countryId);
      if (!ignore) {
        setScenarios(data);
        setLoading(false);
      }
    }

    loadScenarios().catch(() => {
      if (!ignore) {
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [countryId]);

  const presentationMap = Object.fromEntries(
    scenarioPresentation[country].map((item) => [item.slug, item])
  );

  async function handleSelect(scenario: ScenarioApiItem) {
    setSubmittingTitle(scenario.title);
    try {
      await onSelect({ id: scenario.id, title: scenario.title });
    } finally {
      setSubmittingTitle(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-gray-800 text-5xl mb-4">
            Choisis un scénario
          </h2>
          <p className="text-gray-500 text-xl">
            Mets-toi en situation réelle
          </p>
        </div>
        
        <div className="space-y-6">
          {loading && <p className="text-center text-gray-500">Chargement des scénarios...</p>}
          {!loading && scenarios.map((scenario) => {
            const presentation = presentationMap[scenario.slug] ?? scenarioPresentation[country][0];
            const Icon = presentation.icon;
            return (
              <button
                key={scenario.id}
                onClick={() => void handleSelect(scenario)}
                disabled={submittingTitle !== null}
                className={`w-full ${presentation.color} rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all text-left hover:scale-102 disabled:opacity-70`}
              >
                <div className="flex items-center gap-8">
                  <div className="flex-shrink-0">
                    <div className="bg-white rounded-2xl p-6 shadow-md">
                      <Icon className={`w-14 h-14 ${presentation.iconColor}`} strokeWidth={2} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl mb-2">
                      {scenario.title}
                    </h3>
                    <p className="text-gray-600 text-lg">
                      {scenario.description}
                    </p>
                    {submittingTitle === scenario.title && (
                      <p className="mt-3 text-sm text-gray-500">Création de la session...</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
