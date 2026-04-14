import { getCulturalSummary } from '../lib/presentation';

interface CulturalSummaryProps {
  country: string;
  onNext: () => void;
}

export function CulturalSummary({ country, onNext }: CulturalSummaryProps) {
  const info = getCulturalSummary(country);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-9xl mb-6">{info.flag}</div>
          <h2 className="text-gray-800 text-5xl mb-4">
            Découvre la culture du {country}
          </h2>
          <p className="text-gray-500 text-xl">
            Quelques clés avant de commencer
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-8 mb-12">
          {info.keywords.map((keyword, index) => {
            const Icon = keyword.icon;
            return (
              <div
                key={index}
                className={`${keyword.color} rounded-3xl p-8 shadow-lg`}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <Icon className="w-12 h-12" strokeWidth={2} />
                  <div>
                    <h4 className="text-xl mb-3">
                      {keyword.title}
                    </h4>
                    <p className="text-gray-700 text-base">
                      {keyword.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={onNext}
            className="bg-gradient-to-r from-orange-500 to-rose-500 text-white px-16 py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all text-lg hover:scale-105"
          >
            Voir les scénarios
          </button>
        </div>
      </div>
    </div>
  );
}
