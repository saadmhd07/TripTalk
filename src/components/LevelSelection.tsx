import { TrendingUp, BarChart3, Sparkles } from 'lucide-react';

interface LevelSelectionProps {
  selectedLevel: 'Débutant' | 'Intermédiaire' | 'Avancé' | null;
  onSelect: (level: 'Débutant' | 'Intermédiaire' | 'Avancé') => void;
  isSaving?: boolean;
  error?: string | null;
}

export function LevelSelection({
  selectedLevel,
  onSelect,
  isSaving = false,
  error = null,
}: LevelSelectionProps) {
  const levels = [
    {
      name: 'Débutant' as const,
      icon: Sparkles,
      color: 'from-green-400 to-emerald-400',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      description: 'Je commence mon apprentissage'
    },
    {
      name: 'Intermédiaire' as const,
      icon: BarChart3,
      color: 'from-orange-400 to-amber-400',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      description: 'Je peux tenir des conversations simples'
    },
    {
      name: 'Avancé' as const,
      icon: TrendingUp,
      color: 'from-purple-400 to-violet-400',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      description: 'Je maîtrise bien la langue'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-gray-800 text-5xl mb-4">
            Choisis ton niveau
          </h2>
          <p className="text-gray-500 text-xl">
            Tu pourras toujours le modifier plus tard
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-8">
          {levels.map((level) => {
            const Icon = level.icon;
            return (
              <button
                key={level.name}
                onClick={() => onSelect(level.name)}
                disabled={isSaving}
                className={`${level.bgColor} rounded-3xl p-10 shadow-lg transition-all text-center hover:scale-105 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-70 ${
                  selectedLevel === level.name ? 'ring-2 ring-orange-400 ring-offset-4' : ''
                }`}
              >
                <div className="flex flex-col items-center gap-6">
                  <div className={`bg-gradient-to-br ${level.color} rounded-2xl p-6`}>
                    <Icon className="w-16 h-16 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className={`${level.textColor} text-2xl mb-3`}>
                      {level.name}
                    </h3>
                    <p className="text-gray-600 text-base">
                      {level.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          {selectedLevel && (
            <p className="text-sm text-gray-500">
              Niveau enregistré : <span className="font-medium text-gray-700">{selectedLevel}</span>
            </p>
          )}
          {isSaving && <p className="mt-2 text-sm text-gray-500">Enregistrement du niveau...</p>}
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
