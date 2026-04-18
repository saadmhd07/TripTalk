import { Compass, History, MessageSquare, TrendingUp, UserCircle2, LogOut } from 'lucide-react';

interface SidebarProps {
  activeSection: 'explorer' | 'conversation' | 'history' | 'profile';
  userEmail: string;
  onGoExplorer: () => void;
  onGoConversation: () => void;
  onGoHistory: () => void;
  onGoProfile: () => void;
  onSignOut: () => void;
}

export function Sidebar({
  activeSection,
  userEmail,
  onGoExplorer,
  onGoConversation,
  onGoHistory,
  onGoProfile,
  onSignOut,
}: SidebarProps) {
  const navItems = [
    { id: 'explorer', label: 'Explorer', icon: Compass, onClick: onGoExplorer },
    // Chat is context-aware - only accessible when in conversation
    { id: 'conversation', label: 'Chat', icon: MessageSquare, onClick: onGoConversation, disabled: activeSection !== 'conversation' },
    { id: 'history', label: 'History', icon: History, onClick: onGoHistory },
    { id: 'profile', label: 'Profile', icon: UserCircle2, onClick: onGoProfile },
  ];

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="border-b border-gray-200 px-6 py-5">
        <button
          type="button"
          onClick={onGoExplorer}
          className="text-left"
        >
          <p className="text-sm font-bold uppercase tracking-wider text-orange-500">TripTalk</p>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const isDisabled = 'disabled' in item && item.disabled;

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              disabled={isDisabled}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-50 text-orange-600'
                  : isDisabled
                  ? 'cursor-not-allowed text-gray-400'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-600">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{userEmail}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
