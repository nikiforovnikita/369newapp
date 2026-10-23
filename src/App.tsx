import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { useAppStore } from './store';
import { TodayPage } from './pages/Today';
import { SearchPage } from './pages/Search';
import { PracticePage } from './pages/Practice';
import { ClassDetailPage } from './pages/ClassDetail';
import { PlayerPage } from './pages/Player';
import { LivePage, LiveDetailPage } from './pages/Live';
import { AnalyticsPage } from './pages/Analytics';
import { ProfilePage, SubscriptionPage, OnboardingPage } from './pages/Profile';
import { CategoryPage, ProgramPage, CollectionPage } from './pages/Catalog';
import { DevPage, NotFoundPage } from './pages/Dev';

function AppContent() {
  const profile = useAppStore(s => s.profile);
  const loadUser = useAppStore(s => s.loadUser);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    // Redirect logic
    if (profile === null) {
      // Still loading
      return;
    }

    const isOnboarding = location.pathname === '/onboarding';
    const isPlayer = location.pathname.startsWith('/play/');

    // If no profile and not on onboarding/player, redirect to onboarding
    if (!profile.onboardingDone && !isOnboarding && !isPlayer) {
      navigate('/onboarding', { replace: true });
      return;
    }

    // If profile done and on onboarding, redirect to home
    if (profile.onboardingDone && isOnboarding) {
      navigate('/', { replace: true });
      return;
    }
  }, [profile, location.pathname, navigate]);

  // Loading state
  if (profile === null) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-h1 text-ink mb-2">sangha</p>
          <p className="text-body-sm text-ink-3">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Player - fullscreen, no shell */}
      <Route path="/play/:id" element={<PlayerPage />} />

      {/* Onboarding - no shell */}
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Main app with shell */}
      <Route element={<AppShell />}>
        <Route path="/" element={<TodayPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/program/:id" element={<ProgramPage />} />
        <Route path="/collection/:id" element={<CollectionPage />} />
        <Route path="/class/:id" element={<ClassDetailPage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/live/:id" element={<LiveDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/subscription" element={<SubscriptionPage />} />
        <Route path="/dev" element={<DevPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
