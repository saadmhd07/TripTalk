import { Users, Globe } from 'lucide-react';

interface OnboardingOneProps {
  onNext: () => void;
}

export function OnboardingOne({ onNext }: OnboardingOneProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-2 gap-16 items-center">
          {/* Left: Illustration */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-200 rounded-full blur-3xl opacity-50"></div>
              <div className="relative bg-gradient-to-br from-orange-100 to-rose-100 rounded-3xl p-20">
                <Users className="w-48 h-48 text-orange-500" strokeWidth={1.5} />
                <Globe className="w-24 h-24 text-rose-400 absolute top-8 right-8" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          
          {/* Right: Content */}
          <div className="space-y-8">
            <h2 className="text-gray-800 text-4xl mb-8">
              Bienvenue dans TripTalk
            </h2>
            
            <div className="space-y-6">
              <div className="bg-orange-50 rounded-2xl p-8 shadow-sm">
                <p className="text-gray-800 text-lg">
                  Simule des conversations réelles avec un avatar IA natif.
                </p>
              </div>
              
              <div className="bg-rose-50 rounded-2xl p-8 shadow-sm">
                <p className="text-gray-800 text-lg">
                  Découvre la culture du pays à travers chaque scénario.
                </p>
              </div>
            </div>
            
            <div className="pt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-2 bg-orange-500 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
              <button
                onClick={onNext}
                className="bg-gradient-to-r from-orange-500 to-rose-500 text-white px-12 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all text-lg"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
