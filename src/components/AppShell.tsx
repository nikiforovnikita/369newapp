import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Bell, Home, Search, Play } from 'lucide-react';
import { cn } from '../components/ui';
import { useAppStore } from '../store';
import { ToastContainer } from '../components/ui';

function TopBar() {
  const profile = useAppStore(s => s.profile);
  const initial = profile?.name?.charAt(0)?.toUpperCase() || 'Г';

  return (
    <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-line h-[88px] flex items-center px-5">
      <div className="flex items-center justify-between w-full max-w-screen-xl mx-auto">
        <Link to="/" className="text-h1 font-semibold text-ink tracking-tight">
          sangha
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/profile/subscription"
            className="h-11 px-5 rounded-pill bg-ink text-white text-chip font-semibold flex items-center hover:bg-ink/90 transition-colors"
          >
            Free Trial
          </Link>
          <button
            className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center relative"
            aria-label="Уведомления"
          >
            <Bell className="w-5 h-5 text-ink-2" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-live" />
          </button>
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-body-sm"
            style={{ backgroundColor: profile?.avatarColor || '#E8B4B8' }}
          >
            {initial}
          </div>
        </div>
      </div>
    </header>
  );
}

function BottomTabBar() {
  const location = useLocation();

  const tabs = [
    { id: 'today', label: 'Сегодня', path: '/', icon: Home },
    { id: 'search', label: 'Поиск', path: '/search', icon: Search },
    { id: 'practice', label: 'Практика', path: '/practice', icon: Play },
  ];

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-40 safe-bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="max-w-md mx-auto h-16 rounded-[32px] bg-white/92 backdrop-blur-[20px] shadow-[0_8px_24px_rgba(20,20,15,0.08)] flex items-center justify-around px-4">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 px-4 rounded-2xl transition-all min-w-[72px]',
                isActive ? 'bg-black/[0.06]' : ''
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-ink' : 'text-ink-3')} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={cn('text-[12px]', isActive ? 'font-semibold text-ink' : 'font-normal text-ink-3')}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell() {
  const toasts = useAppStore(s => s.toasts);
  const removeToast = useAppStore(s => s.removeToast);

  return (
    <div className="min-h-dvh bg-bg">
      <TopBar />
      <main className="pb-28">
        <Outlet />
      </main>
      <BottomTabBar />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
