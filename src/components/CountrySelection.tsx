import { useEffect, useState } from 'react';

import { apiFetch } from '../lib/api';

interface CountrySelectionProps {
  onSelect: (country: 'Chile' | 'USA', countryId: number) => void;
}

interface CountryApiItem {
  id: number;
  code: string;
  name: string;
  language: string;
  is_active: boolean;
}

export function CountrySelection({ onSelect }: CountrySelectionProps) {
  const [countries, setCountries] = useState<CountryApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadCountries() {
      const response = await apiFetch('/countries');
      const data: CountryApiItem[] = await response.json();
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

  const countryPresentation = {
    Chile: {
      flag: '🇨🇱',
      description: 'Espagnol chilien avec expressions locales typiques',
      image: 'https://images.unsplash.com/photo-1593985437133-03d5e1435c03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDaGlsZSUyMFNhbnRpYWdvJTIwY2l0eXNjYXBlfGVufDF8fHx8MTc2NTIzMjU1N3ww&ixlib=rb-4.1.0&q=80&w=1080',
      gradient: 'from-red-500/90 to-blue-600/90'
    },
    USA: {
      flag: '🇺🇸',
      description: 'Anglais américain avec culture et expressions US',
      image: 'https://images.unsplash.com/photo-1542223616-9de9adb5e3e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVU0ElMjBBbWVyaWNhbiUyMGNpdHlzY2FwZXxlbnwxfHx8fDE3NjUyMzI1NTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      gradient: 'from-blue-600/90 to-red-500/90'
    }
  } as const;

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
          )})}
        </div>
      </div>
    </div>
  );
}
