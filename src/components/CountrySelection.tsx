import { useEffect, useState } from 'react';

interface CountrySelectionProps {
  onSelect: (country: 'Chile' | 'USA', countryId: number) => void;
}
import { fetchCountries } from '../lib/triptalk-api';
import { countryPresentation } from '../lib/presentation';
import type { CountryApiItem } from '../lib/types';

export function CountrySelection({ onSelect }: CountrySelectionProps) {
  const [countries, setCountries] = useState<CountryApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadCountries() {
      const data = await fetchCountries();
      if (!ignore) {
        setCountries(data);
        setLoading(false);
      }
    }

    loadCountries().catch(() => {
      if (!ignore) {
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  const visibleCountries = countries.filter(
    (country): country is CountryApiItem & { name: 'Chile' | 'USA' } =>
      country.name === 'Chile' || country.name === 'USA'
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-gray-800 text-5xl mb-4">
            Choisis ton pays
          </h2>
          <p className="text-gray-500 text-xl">
            Chaque pays a ses propres scénarios culturels
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-10">
          {loading && <p className="col-span-2 text-center text-gray-500">Chargement des pays...</p>}
          {!loading && visibleCountries.map((country) => {
            const presentation = countryPresentation[country.name];
            return (
              <div
                key={country.name}
                className="relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all group h-[500px]"
              >
                <div className="absolute inset-0">
                  <img
                    src={presentation.image}
                    alt={country.name}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${presentation.gradient}`}></div>
                </div>

                <div className="relative h-full p-10 flex flex-col justify-between">
                  <div>
                    <div className="text-8xl mb-6">{presentation.flag}</div>
                    <h3 className="text-white text-4xl mb-4">
                      {country.name}
                    </h3>
                    <p className="text-white/90 text-lg">
                      {presentation.description}
                    </p>
                  </div>

                  <button
                    onClick={() => onSelect(country.name, country.id)}
                    className="w-full bg-white text-gray-800 py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all text-lg hover:scale-105"
                  >
                    Choisir ce pays
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
