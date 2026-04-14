import { useEffect, useState } from 'react';
import { CheckCircle2, Lightbulb, BookOpen, RotateCcw, List, Globe, TrendingUp, Award } from 'lucide-react';

import { apiFetch } from '../lib/api';

interface FeedbackScreenProps {
  sessionId: string;
  onRetry: () => void;
  onNewScenario: () => void;
  onChangeCountry: () => void;
}

interface FeedbackApiResponse {
  id: number;
  session_id: string;
  global_score: number;
  vocabulary_score: number | null;
  fluency_score: number | null;
  strengths: string[];
  improvements: string[];
  cultural_tip: string | null;
  created_at: string;
}

export function FeedbackScreen({ sessionId, onRetry, onNewScenario, onChangeCountry }: FeedbackScreenProps) {
  const [feedback, setFeedback] = useState<FeedbackApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadFeedback() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch(`/conversation-sessions/${sessionId}/feedback`);
        if (!response.ok) {
          throw new Error('Failed to load feedback');
        }
        const data: FeedbackApiResponse = await response.json();
        if (!ignore) {
          setFeedback(data);
        }
      } catch {
        if (!ignore) {
          setError('Impossible de charger le feedback.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadFeedback();

    return () => {
      ignore = true;
    };
  }, [sessionId]);

  const globalScore = feedback?.global_score ?? 0;
  const vocabularyScore = feedback?.vocabulary_score ?? 0;
  const fluencyScore = feedback?.fluency_score ?? 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" strokeWidth={2} />
          </div>
          <h2 className="text-gray-800 text-5xl mb-3">
            Bravo !
          </h2>
          <p className="text-gray-500 text-xl">
            Voici ton feedback personnalisé
          </p>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column - Stats */}
          <div className="col-span-3 space-y-6">
            <div className="bg-gradient-to-br from-green-400 to-emerald-400 rounded-3xl shadow-lg p-6 text-white">
              <Award className="w-10 h-10 mb-4" strokeWidth={2} />
              <h4 className="text-3xl mb-2">{globalScore}%</h4>
              <p className="text-white/90">Score global</p>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-orange-500" strokeWidth={2} />
                <h4 className="text-gray-800 text-lg">Progression</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Vocabulaire</span>
                    <span className="text-gray-800">{vocabularyScore}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-orange-500 rounded-full" style={{width: `${vocabularyScore}%`}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Fluidité</span>
                    <span className="text-gray-800">{fluencyScore}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full" style={{width: `${fluencyScore}%`}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Feedback */}
          <div className="col-span-6 space-y-6">
            {/* Linguistic Feedback */}
            <div className="bg-blue-50 rounded-3xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-7 h-7 text-blue-600" strokeWidth={2} />
                <h3 className="text-blue-800 text-2xl">
                  Feedback linguistique
                </h3>
              </div>
              
              <div className="space-y-4">
                {loading && <div className="bg-white rounded-2xl p-5 text-gray-500">Chargement du feedback...</div>}
                {error && <div className="bg-white rounded-2xl p-5 text-red-500">{error}</div>}
                {!loading && !error && feedback?.strengths.map((strength, index) => (
                  <div key={`strength-${index}`} className="bg-white rounded-2xl p-5">
                    <p className="text-gray-700 text-base mb-1">
                      <span className="text-blue-600 text-xl">✓</span> {strength}
                    </p>
                  </div>
                ))}
                {!loading && !error && feedback?.improvements.map((improvement, index) => (
                  <div key={`improvement-${index}`} className="bg-white rounded-2xl p-5">
                    <p className="text-gray-700 text-base">
                      <span className="text-orange-500 text-xl">→</span> {improvement}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cultural Advice */}
            <div className="bg-orange-50 rounded-3xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <Lightbulb className="w-7 h-7 text-orange-600" strokeWidth={2} />
                <h3 className="text-orange-800 text-2xl">
                  Conseil culturel
                </h3>
              </div>
              
              <div className="bg-white rounded-2xl p-5">
                <p className="text-gray-700 text-base leading-relaxed">
                  {loading
                    ? 'Chargement du conseil culturel...'
                    : error
                      ? 'Le conseil culturel est indisponible pour le moment.'
                      : feedback?.cultural_tip}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="col-span-3 space-y-4">
            <button
              onClick={onRetry}
              className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-lg hover:scale-105"
            >
              <RotateCcw className="w-6 h-6" strokeWidth={2} />
              Refaire
            </button>
            
            <button
              onClick={onNewScenario}
              className="w-full bg-white text-gray-700 py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 flex items-center justify-center gap-3 text-lg hover:scale-105"
            >
              <List className="w-6 h-6" strokeWidth={2} />
              Autre scénario
            </button>
            
            <button
              onClick={onChangeCountry}
              className="w-full bg-white text-gray-700 py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 flex items-center justify-center gap-3 text-lg hover:scale-105"
            >
              <Globe className="w-6 h-6" strokeWidth={2} />
              Changer de pays
            </button>

            <div className="mt-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl shadow-lg p-6">
              <h4 className="text-gray-800 text-lg mb-3">Prochain défi</h4>
              <p className="text-gray-600 text-sm mb-4">
                Essaie le scénario &quot;Commander dans un café&quot; pour pratiquer les expressions de la vie quotidienne
              </p>
              <button className="w-full bg-white text-purple-700 py-3 rounded-xl shadow-md hover:shadow-lg transition-all text-sm">
                Commencer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
