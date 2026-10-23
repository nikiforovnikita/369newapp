import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { SearchField, ChipRow, Chip, SectionHeader, Carousel, Skeleton, EmptyState, PillButton } from '../components/ui';
import { ProgramCard, CollectionCard, HeroCard, ClassRow, ContinueCard, LiveBanner } from '../components/domain';
import { CoverFlow } from '../components/CoverFlow';
import type { CoverFlowItem } from '../components/CoverCard';
import { getGreeting, getLiveStatus } from '../lib/format';
import { repository } from '../lib/repository';
import { useAppStore } from '../store';
import type { ClassItem, Category, Program, Collection, Teacher, LiveEvent } from '../types';

export function TodayPage() {
  const navigate = useNavigate();
  const profile = useAppStore(s => s.profile);
  const progress = useAppStore(s => s.progress);
  const sessions = useAppStore(s => s.sessions);

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [durationFilter, setDurationFilter] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const [cats, cls, progs, cols, tchrs, lives] = await Promise.all([
        repository.getCategories(),
        repository.getClasses({ sort: 'new', limit: 30 }),
        repository.getPrograms(),
        repository.getCollections(),
        repository.getTeachers(),
        repository.getLiveEvents(),
      ]);
      setCategories(cats);
      setClasses(cls);
      setPrograms(progs);
      setCollections(cols);
      setTeachers(tchrs);
      setLiveEvents(lives);
      setLoading(false);
    }
    load();
  }, []);

  const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Weekly minutes
  const weekMinutes = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    return Math.round(sessions.filter(s => new Date(s.startedAt).getTime() > weekAgo).reduce((sum, s) => sum + s.watchedSec, 0) / 60);
  }, [sessions]);

  // Continue section
  const continueClasses = useMemo(() => {
    return Object.entries(progress)
      .filter(([, p]) => !p.completed && p.watchedSec > 10 && p.watchedSec < p.totalSec * 0.95)
      .slice(0, 5)
      .map(([classId, p]) => {
        const cls = classes.find(c => c.id === classId);
        return cls ? { cls, progress: p } : null;
      })
      .filter(Boolean) as { cls: ClassItem; progress: { watchedSec: number; totalSec: number } }[];
  }, [progress, classes]);

  // Live banner
  const liveBanner = useMemo(() => {
    const now = new Date();
    const liveOrSoon = liveEvents.find(e => {
      const status = getLiveStatus(e, now);
      return status === 'live' || status === 'soon';
    });
    return liveOrSoon;
  }, [liveEvents]);

  // New programs
  const newPrograms = useMemo(() => programs.filter(p => p.isNew).slice(0, 8), [programs]);

  // Recommendations (not viewed in 14 days)
  const recommended = useMemo(() => {
    const twoWeeksAgo = Date.now() - 14 * 86400000;
    return classes
      .filter(c => !c.isNew && (!progress[c.id] || new Date(progress[c.id].updatedAt).getTime() < twoWeeksAgo))
      .slice(0, 5);
  }, [classes, progress]);

  // New in library
  const newInLibrary = useMemo(() => classes.filter(c => c.isNew).slice(0, 6), [classes]);

  // Duration filter
  const durationOptions = [10, 15, 20, 30];
  const filteredByDuration = useMemo(() => {
    if (!durationFilter) return classes.slice(0, 4);
    const minSec = durationFilter * 60;
    const maxSec = (durationFilter + 5) * 60;
    return classes.filter(c => c.durationSec >= minSec && c.durationSec <= maxSec).slice(0, 4);
  }, [classes, durationFilter]);

  if (loading) {
    return (
      <div className="px-5 pt-4 space-y-6">
        <Skeleton variant="text" className="w-48 h-10" />
        <Skeleton variant="text" className="w-64 h-5" />
        <Skeleton variant="hero" />
        <div className="flex gap-3">
          <Skeleton variant="card" className="w-[160px]" />
          <Skeleton variant="card" className="w-[160px]" />
          <Skeleton variant="card" className="w-[160px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Sticky search + filters */}
      <div className="sticky top-[88px] z-30 bg-bg/95 backdrop-blur-md px-5 pt-3 pb-2">
        <div onClick={() => navigate('/search', { state: { fromToday: true } })} className="cursor-pointer">
          <SearchField value="" onChange={() => {}} placeholder="Поиск практик..." />
        </div>
        <div className="mt-3">
          <ChipRow>
            <Chip variant="filter" selected={!selectedCategory} onClick={() => setSelectedCategory(null)}>Фильтры</Chip>
            {categories.map(cat => (
              <Chip key={cat.id} variant="filter" selected={selectedCategory === cat.id} onClick={() => setSelectedCategory(cat.id)}>
                {cat.icon} {cat.title}
              </Chip>
            ))}
          </ChipRow>
        </div>
      </div>

      <div className="px-5 space-y-8 mt-4">
        {/* Greeting */}
        <div>
          <h1 className="text-display text-ink">{getGreeting()}, {profile?.name || 'Гость'}</h1>
          <p className="text-body text-ink-2 mt-1">{weekMinutes} мин практики на этой неделе</p>
        </div>

        {/* Live Banner */}
        {liveBanner && (
          <LiveBanner
            event={liveBanner}
            isLive={getLiveStatus(liveBanner) === 'live'}
            onReminder={() => {
              const reminders = useAppStore.getState().reminders;
              if (reminders.includes(liveBanner.id)) {
                useAppStore.getState().removeReminder(liveBanner.id);
              } else {
                useAppStore.getState().setReminder(liveBanner.id);
              }
            }}
          />
        )}

        {/* Continue */}
        {continueClasses.length > 0 && (
          <section className="pb-6">
            <SectionHeader title="Продолжить" />
            <Carousel>
              {continueClasses.map(({ cls, progress: p }) => (
                <ContinueCard key={cls.id} cls={cls} progress={p} />
              ))}
            </Carousel>
          </section>
        )}

        {/* New Programs - CoverFlow */}
        {newPrograms.length > 0 && (
          <section className="pb-6 -mx-5">
            <div className="px-5 mb-3">
              <SectionHeader title="Новые программы" action={{ label: 'Все', onClick: () => navigate('/search') }} />
            </div>
            <CoverFlow
              items={newPrograms.map((p, i) => {
                const teacher = teacherMap.get(p.teacherId);
                return {
                  id: p.id,
                  title: p.title,
                  subtitle: teacher?.name,
                  posterUrl: p.coverUrl,
                  palette: p.palette || ['#8F8C86', '#6F6C66', '#9A968E'],
                  kind: 'program' as const,
                  href: `/program/${p.id}`,
                  isNew: p.isNew,
                  level: p.level,
                  classCount: p.classIds.length,
                };
              })}
              className="h-[480px]"
            />
          </section>
        )}

        {/* Collections */}
        <section className="pb-6">
          <SectionHeader title="Коллекции" action={{ label: 'Все', onClick: () => navigate('/search') }} />
          <Carousel>
            {collections.slice(0, 6).map(c => (
              <CollectionCard key={c.id} collection={c} />
            ))}
          </Carousel>
          <div className="mt-4">
            <PillButton variant="outline" size="lg" onClick={() => navigate('/search')} className="w-full">
              Смотреть все коллекции
            </PillButton>
          </div>
        </section>

        {/* Recommended */}
        {recommended.length > 0 && (
          <section>
            <SectionHeader title="Рекомендуем вам" />
            <div className="space-y-4">
              {recommended.slice(0, 2).map(cls => (
                <HeroCard
                  key={cls.id}
                  cls={cls}
                  teacher={teacherMap.get(cls.teacherId)}
                  categoryTitle={categoryMap.get(cls.categoryId)?.title}
                />
              ))}
            </div>
          </section>
        )}

        {/* Duration filter */}
        <section>
          <SectionHeader title="Всего 10–15 минут" />
          <ChipRow className="mb-3">
            {durationOptions.map(d => (
              <Chip key={d} variant="filter" selected={durationFilter === d} onClick={() => setDurationFilter(durationFilter === d ? null : d)}>
                {d} мин
              </Chip>
            ))}
          </ChipRow>
          <div className="divide-y divide-line">
            {filteredByDuration.map(cls => (
              <ClassRow
                key={cls.id}
                cls={cls}
                teacher={teacherMap.get(cls.teacherId)}
                categoryTitle={categoryMap.get(cls.categoryId)?.title}
              />
            ))}
          </div>
        </section>

        {/* New in library */}
        <section>
          <SectionHeader title="Новое в библиотеке" />
          <div className="divide-y divide-line">
            {newInLibrary.map(cls => (
              <ClassRow
                key={cls.id}
                cls={cls}
                teacher={teacherMap.get(cls.teacherId)}
                categoryTitle={categoryMap.get(cls.categoryId)?.title}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
