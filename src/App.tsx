import React, { useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Loading state
  if (!profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-h1 text-ink mb-2">sangha</p>
          <p className="text-body-sm text-ink-3">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if not done
  if (!profile.onboardingDone) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
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
