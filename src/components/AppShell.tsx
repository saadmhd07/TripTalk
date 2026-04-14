import type { ReactNode } from 'react';
import { Compass, History, LogOut, Plus, UserCircle2 } from 'lucide-react';

interface AppShellProps {
  activeSection: 'explorer' | 'history' | 'profile' | 'conversation';
  userEmail: string;
  children: ReactNode;
  onGoExplorer: () => void;
  onGoHistory: () => void;
  onGoProfile: () => void;
  onNewConversation: () => void;
  onSignOut: () => void;
}

function navClass(isActive: boolean): string {
  return isActive
    ? 'bg-orange-100 text-orange-700'
    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900';
}

export function AppShell({
  activeSection,
  userEmail,
  children,
  onGoExplorer,
  onGoHistory,
  onGoProfile,
  onNewConversation,
  onSignOut,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.14),_transparent_22%),linear-gradient(180deg,#fff8f2_0%,#f8fafc_100%)]">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={onGoExplorer}
              className="text-left"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-orange-500">TripTalk</p>
              <p className="text-lg text-gray-900">Cultural Conversation MVP</p>
            </button>

            <nav className="hidden items-center gap-2 rounded-2xl bg-white/80 p-1 shadow-sm lg:flex">
              <button
                type="button"
                onClick={onGoExplorer}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 transition ${navClass(
                  activeSection === 'explorer'
                )}`}
              >
                <Compass className="h-4 w-4" />
                Explorer
              </button>
              <button
                type="button"
                onClick={onGoHistory}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 transition ${navClass(
                  activeSection === 'history'
                )}`}
              >
                <History className="h-4 w-4" />
                Historique
              </button>
              <button
                type="button"
                onClick={onGoProfile}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 transition ${navClass(
                  activeSection === 'profile'
                )}`}
              >
                <UserCircle2 className="h-4 w-4" />
                Profil
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNewConversation}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-3 text-white shadow-lg transition hover:shadow-xl"
            >
              <Plus className="h-4 w-4" />
              Nouvelle conversation
            </button>
            <div className="hidden rounded-2xl bg-white px-4 py-3 text-right shadow-sm md:block">
              <p className="text-xs uppercase tracking-wide text-gray-400">Connecté</p>
              <p className="text-sm text-gray-700">{userEmail}</p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
