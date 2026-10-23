import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, TrendingUp, Clock, Flame, Award, Download, Target } from 'lucide-react';
import { ChipRow, Chip, PillButton, Sheet, ProgressBar, EmptyState } from '../components/ui';
import { repository } from '../lib/repository';
import { useAppStore } from '../store';
import { minutesByDay, minutesByCategory, streakDays, averageDuration, minutesByHour, totalMinutesInRange, completedCount, favoriteCategory, downloadCSV } from '../lib/format';
import type { ClassItem, Category } from '../types';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const range = parseInt(searchParams.get('range') || '7');
  const sessions = useAppStore(s => s.sessions);
  const profile = useAppStore(s => s.profile);
  const showToast = useAppStore(s => s.showToast);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goalSheet, setGoalSheet] = useState(false);

  useEffect(() => {
    Promise.all([repository.getClasses(), repository.getCategories()]).then(([c, cat]) => {
      setClasses(c);
      setCategories(cat);
    });
  }, []);

  const classMap = useMemo(() => new Map(classes.map(c => [c.id, { categoryId: c.categoryId, type: c.type }])), [classes]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const filteredSessions = useMemo(() => {
    if (range === 0) return sessions; // all
    const cutoff = Date.now() - range * 86400000;
    return sessions.filter(s => new Date(s.startedAt).getTime() >= cutoff);
  }, [sessions, range]);

  const prevSessions = useMemo(() => {
    const cutoff = Date.now() - range * 86400000;
    const prevCutoff = cutoff - range * 86400000;
    return sessions.filter(s => {
      const t = new Date(s.startedAt).getTime();
      return t >= prevCutoff && t < cutoff;
    });
  }, [sessions, range]);

  const currentMinutes = totalMinutesInRange(filteredSessions, range || 365);
  const prevMinutes = totalMinutesInRange(prevSessions, range || 365);
  const delta = currentMinutes - prevMinutes;

  const stats = useMemo(() => ({
    completed: completedCount(filteredSessions),
    avgDuration: averageDuration(filteredSessions),
    streak: streakDays(filteredSessions),
    favCategory: favoriteCategory(filteredSessions, classMap),
  }), [filteredSessions, classMap]);

  const dayData = useMemo(() => minutesByDay(filteredSessions, range || 30), [filteredSessions, range]);
  const categoryData = useMemo(() => minutesByCategory(filteredSessions, classMap), [filteredSessions, classMap]);
  const hourData = useMemo(() => minutesByHour(filteredSessions), [filteredSessions]);
  const peakHour = useMemo(() => {
    const maxIdx = hourData.indexOf(Math.max(...hourData));
    return maxIdx;
  }, [hourData]);

  const weeklyGoal = profile?.weeklyGoal || 120;
  const weekMinutes = totalMinutesInRange(sessions, 7);
  const goalProgress = Math.min(100, (weekMinutes / weeklyGoal) * 100);

  const handleExport = () => {
    const cMap = new Map(classes.map(c => [c.id, { title: c.title, categoryId: c.categoryId }]));
    downloadCSV(filteredSessions, cMap);
    showToast('CSV экспортирован', 'success');
  };

  const ranges = [
    { id: 7, label: '7 дней' },
    { id: 30, label: '30 дней' },
    { id: 0, label: 'Всё время' },
  ];

  if (sessions.length === 0) {
    return (
      <div className="px-5 pt-4">
        <h1 className="text-h1 text-ink mb-6">Аналитика</h1>
        <EmptyState title="Нет данных" description="Начните практиковать, чтобы увидеть статистику" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up px-5 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-h1 text-ink">Аналитика</h1>
        <button onClick={handleExport} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-2" aria-label="Экспорт">
          <Download className="w-5 h-5 text-ink-2" />
        </button>
      </div>

      {/* Period selector */}
      <ChipRow className="mb-6">
        {ranges.map(r => (
          <Chip key={r.id} variant="filter" selected={range === r.id} onClick={() => setSearchParams({ range: String(r.id) })}>
            {r.label}
          </Chip>
        ))}
      </ChipRow>

      {/* Total minutes */}
      <div className="mb-6">
        <p className="text-display text-ink">{currentMinutes}</p>
        <div className="flex items-center gap-2">
          <p className="text-body text-ink-2">минут практики</p>
          {delta !== 0 && (
            <span className={`inline-flex items-center gap-0.5 text-chip ${delta > 0 ? 'text-success' : 'text-live'}`}>
              {delta > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(delta)} мин
            </span>
          )}
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="p-4 rounded-card bg-surface-2">
          <Flame className="w-5 h-5 text-ink-3 mb-2" />
          <p className="text-h2 text-ink">{stats.completed}</p>
          <p className="text-chip text-ink-3">завершено</p>
        </div>
        <div className="p-4 rounded-card bg-surface-2">
          <Clock className="w-5 h-5 text-ink-3 mb-2" />
          <p className="text-h2 text-ink">{stats.avgDuration}</p>
          <p className="text-chip text-ink-3">мин средняя</p>
        </div>
        <div className="p-4 rounded-card bg-surface-2">
          <TrendingUp className="w-5 h-5 text-ink-3 mb-2" />
          <p className="text-h2 text-ink">{stats.streak}</p>
          <p className="text-chip text-ink-3">дней серия</p>
        </div>
        <div className="p-4 rounded-card bg-surface-2">
          <Award className="w-5 h-5 text-ink-3 mb-2" />
          <p className="text-h2 text-ink">{categoryMap.get(stats.favCategory)?.title || '—'}</p>
          <p className="text-chip text-ink-3">любимая</p>
        </div>
      </div>

      {/* Weekly goal */}
      <div className="p-4 rounded-card bg-surface-2 mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-ink-2" />
            <span className="text-title text-ink">Недельная цель</span>
          </div>
          <button onClick={() => setGoalSheet(true)} className="text-chip text-ink-2 hover:text-ink">Изменить</button>
        </div>
        <p className="text-body text-ink-2 mb-2">{weekMinutes} из {weeklyGoal} мин</p>
        <ProgressBar value={weekMinutes} max={weeklyGoal} className="h-2" />
      </div>

      {/* Charts */}
      {/* Bar chart - minutes by day */}
      <div className="mb-8">
        <h2 className="text-title text-ink mb-3">Минуты по дням</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="minutes" fill="#14140F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut by category */}
      {categoryData.length > 0 && (
        <div className="mb-8">
          <h2 className="text-title text-ink mb-3">По категориям</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="minutes" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                  {categoryData.map((_: any, i: number) => (
                    <Cell key={i} fill={['#14140F', '#6F6C66', '#9A968E', '#D8D3C7', '#E9E5DC', '#8F8C86', '#2F8F5B', '#E5484D'][i % 8]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {categoryData.map(d => (
              <span key={d.category} className="text-chip text-ink-2">
                {categoryMap.get(d.category)?.title || d.category}: {d.minutes} мин
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="mb-8">
        <h2 className="text-title text-ink mb-3">Активность по часам</h2>
        <p className="text-body-sm text-ink-3 mb-3">Пиковый час: {peakHour}:00</p>
        <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
          {hourData.map((val: number, i: number) => {
            const max = Math.max(...hourData, 1);
            const intensity = val / max;
            const bg = intensity === 0 ? '#F7F5EF' : intensity < 0.33 ? '#E9E5DC' : intensity < 0.66 ? '#9A968E' : '#14140F';
            return (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: bg }} title={`${i}:00 — ${val} мин`} />
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="mb-8">
        <h2 className="text-title text-ink mb-3">Достижения</h2>
        <div className="grid grid-cols-5 gap-2">
          {[
            { icon: '🧘', label: 'Первая практика', done: sessions.length > 0 },
            { icon: '🔥', label: '7 дней подряд', done: stats.streak >= 7, progress: `${Math.min(stats.streak, 7)}/7` },
            { icon: '💯', label: '50 практик', done: stats.completed >= 50, progress: `${Math.min(stats.completed, 50)}/50` },
            { icon: '⏰', label: '10 часов', done: currentMinutes >= 600, progress: `${Math.min(currentMinutes, 600)}/600` },
            { icon: '🌟', label: 'Все категории', done: categoryData.length >= 5, progress: `${Math.min(categoryData.length, 5)}/5` },
          ].map((a, i) => (
            <div key={i} className={`flex flex-col items-center p-2 rounded-card ${a.done ? 'bg-surface-2' : 'bg-surface-2 opacity-50'}`}>
              <span className="text-2xl mb-1">{a.icon}</span>
              <span className="text-[10px] text-ink-3 text-center leading-tight">{a.label}</span>
              {!a.done && a.progress && <span className="text-[10px] text-ink-3 mt-0.5">{a.progress}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Goal Sheet */}
      <Sheet open={goalSheet} onClose={() => setGoalSheet(false)} title="Недельная цель">
        <div className="space-y-2">
          {[60, 120, 180, 300].map(mins => (
            <button
              key={mins}
              onClick={() => { useAppStore.getState().updateProfile({ weeklyGoal: mins }); setGoalSheet(false); }}
              className={`w-full p-4 rounded-card text-left text-body border ${weeklyGoal === mins ? 'border-ink bg-surface-2' : 'border-line'}`}
            >
              {mins} минут в неделю
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
