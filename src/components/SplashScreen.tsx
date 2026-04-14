import { MessageCircle } from 'lucide-react';

interface SplashScreenProps {
  onStart: () => void;
}

export function SplashScreen({ onStart }: SplashScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-400 via-rose-400 to-pink-400">
      <div className="w-full max-w-2xl mx-auto px-8 py-16 text-center">
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-full p-12 shadow-2xl animate-pulse">
            <MessageCircle className="w-32 h-32 text-orange-500" strokeWidth={2} />
          </div>
        </div>
        
        <h1 className="text-white mb-6 text-6xl">
          TripTalk
        </h1>
        
        <p className="text-white/90 text-2xl mb-16 max-w-xl mx-auto">
          Pratique la langue. Découvre le pays.
        </p>
        
        <button
          onClick={onStart}
          className="bg-white text-orange-500 px-16 py-5 rounded-2xl shadow-2xl hover:shadow-3xl transition-all text-xl hover:scale-105"
        >
          Commencer
        </button>
      </div>
    </div>
  );
}
