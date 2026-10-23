import React from 'react';
import { Link } from 'react-router-dom';
import { PillButton } from '../components/ui';
import { repository } from '../lib/repository';
import { useAppStore } from '../store';

export function DevPage() {
  const showToast = useAppStore(s => s.showToast);
  const loadUser = useAppStore(s => s.loadUser);

  const handleReseed = async () => {
    await repository.reseed();
    showToast('Каталог пересоздан', 'success');
  };

  const handleGenerateHistory = async () => {
    await repository.generateHistory();
    await loadUser();
    showToast('История за 30 дней сгенерирована', 'success');
  };

  const handleClearAll = async () => {
    if (confirm('Удалить все данные?')) {
      await repository.clearAll();
      await loadUser();
      showToast('Все данные удалены', 'success');
    }
  };

  return (
    <div className="px-5 pt-4">
      <h1 className="text-h1 text-ink mb-2">Dev Tools</h1>
      <p className="text-body text-ink-2 mb-6">Инструменты для разработки и тестирования</p>

      <div className="space-y-3">
        <PillButton variant="outline" size="lg" className="w-full" onClick={handleReseed}>
          Пересидить каталог
        </PillButton>

        <PillButton variant="outline" size="lg" className="w-full" onClick={handleGenerateHistory}>
          Сгенерировать историю за 30 дней
        </PillButton>

        <PillButton variant="outline" size="lg" className="w-full text-live border-live" onClick={handleClearAll}>
          Очистить всё
        </PillButton>
      </div>

      <div className="mt-8">
        <h2 className="text-title text-ink mb-3">Ссылки</h2>
        <div className="space-y-2">
          <Link to="/" className="block p-3 rounded-card bg-surface-2 text-body text-ink">Today (/)</Link>
          <Link to="/search" className="block p-3 rounded-card bg-surface-2 text-body text-ink">Search (/search)</Link>
          <Link to="/practice" className="block p-3 rounded-card bg-surface-2 text-body text-ink">Practice (/practice)</Link>
          <Link to="/live" className="block p-3 rounded-card bg-surface-2 text-body text-ink">Live (/live)</Link>
          <Link to="/analytics" className="block p-3 rounded-card bg-surface-2 text-body text-ink">Analytics (/analytics)</Link>
          <Link to="/profile" className="block p-3 rounded-card bg-surface-2 text-body text-ink">Profile (/profile)</Link>
          <Link to="/onboarding" className="block p-3 rounded-card bg-surface-2 text-body text-ink">Onboarding (/onboarding)</Link>
          <Link to="/category/yoga" className="block p-3 rounded-card bg-surface-2 text-body text-ink">Category: Yoga</Link>
          <Link to="/program/p1" className="block p-3 rounded-card bg-surface-2 text-body text-ink">Program: 30 дней йоги</Link>
          <Link to="/collection/col1" className="block p-3 rounded-card bg-surface-2 text-body text-ink">Collection: Утренний ритуал</Link>
          <Link to="/class/c1" className="block p-3 rounded-card bg-surface-2 text-body text-ink">Class: c1</Link>
          <Link to="/play/c1" className="block p-3 rounded-card bg-surface-2 text-body text-ink">Player: c1</Link>
          <Link to="/live/l3" className="block p-3 rounded-card bg-surface-2 text-body text-ink">Live Event: l3</Link>
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 text-center">
      <span className="text-6xl mb-4">🧘</span>
      <h1 className="text-h1 text-ink mb-2">Страница не найдена</h1>
      <p className="text-body text-ink-2 mb-6">Такой страницы не существует</p>
      <Link to="/">
        <PillButton size="lg">На главную</PillButton>
      </Link>
    </div>
  );
}
