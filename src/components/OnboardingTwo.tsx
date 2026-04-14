import { Mic } from 'lucide-react';

interface OnboardingTwoProps {
  onNext: () => void;
}

export function OnboardingTwo({ onNext }: OnboardingTwoProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-2 gap-16 items-center">
          {/* Left: Illustration */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-rose-200 rounded-full blur-3xl opacity-50"></div>
              <div className="relative bg-gradient-to-br from-rose-100 to-pink-100 rounded-full p-24">
                <Mic className="w-48 h-48 text-rose-500" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          
          {/* Right: Content */}
          <div className="space-y-8">
            <h2 className="text-gray-800 text-4xl mb-4">
              Accès au microphone
            </h2>
            <p className="text-gray-600 text-xl max-w-lg">
              Pour pratiquer tes conversations, nous avons besoin d&apos;accéder à ton microphone.
            </p>
            
            <div className="pt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-12 h-2 bg-rose-500 rounded-full"></div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={onNext}
                  className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-12 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all text-lg"
                >
                  Autoriser le micro
                </button>
                <button
                  onClick={onNext}
                  className="text-gray-500 px-8 py-4 hover:text-gray-700 transition-colors text-lg"
                >
                  Passer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
