import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { SearchField, ChipRow, Chip, Tabs, SectionHeader, PillButton, Sheet, EmptyState, Skeleton } from '../components/ui';
import { ClassRow, ProgramCard, CollectionCard } from '../components/domain';
import { repository } from '../lib/repository';
import { Avatar } from '../components/ui';
import type { ClassItem, Category, Program, Collection, Teacher } from '../types';

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const level = searchParams.get('level') || '';
  const dur = searchParams.get('dur') || '';
  const sort = searchParams.get('sort') || 'new';
  const tab = searchParams.get('tab') || 'classes';

  const [localQ, setLocalQ] = useState(q);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [results, setResults] = useState<ClassItem[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterLevel, setFilterLevel] = useState(level);
  const [filterDur, setFilterDur] = useState(dur);
  const [filterCategory, setFilterCategory] = useState(category);

  useEffect(() => {
    repository.getCategories().then(setCategories);
    repository.getTeachers().then(setTeachers);
  }, []);

  const search = useCallback(async () => {
    setLoading(true);
    const params: any = { sort: sort as any, limit: 24 };
    if (q) params.q = q;
    if (category) params.categoryId = category;
    if (level) params.level = parseInt(level) as any;
    if (dur) {
      const [min, max] = dur.split('-').map(Number);
      if (min) params.minDurSec = min * 60;
      if (max) params.maxDurSec = max * 60;
    }

    const [cls, progs, cols] = await Promise.all([
      repository.getClasses(params),
      repository.getPrograms(),
      repository.getCollections(),
    ]);
    setResults(cls);
    setPrograms(progs);
    setCollections(cols);
    setLoading(false);
  }, [q, category, level, dur, sort]);

  useEffect(() => {
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  };

  const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const activeFilters = [filterLevel, filterDur, filterCategory].filter(Boolean).length;

  const tabs = [
    { id: 'classes', label: 'Практики' },
    { id: 'programs', label: 'Программы' },
    { id: 'collections', label: 'Коллекции' },
    { id: 'teachers', label: 'Преподаватели' },
  ];

  const filteredPrograms = category ? programs.filter(p => p.categoryIds.includes(category)) : programs;
  const filteredCollections = collections; // Show all for now
  const filteredTeachers = q ? teachers.filter(t => t.name.toLowerCase().includes(q.toLowerCase())) : teachers;

  return (
    <div className="animate-fade-in-up">
      <div className="sticky top-[88px] z-30 bg-bg/95 backdrop-blur-md px-5 pt-3 pb-2 space-y-3">
        <SearchField value={localQ} onChange={(v) => { setLocalQ(v); updateParam('q', v); }} autoFocus />
        <ChipRow>
          {categories.map(cat => (
            <Chip key={cat.id} variant="filter" selected={category === cat.id} onClick={() => updateParam('category', category === cat.id ? '' : cat.id)}>
              {cat.icon} {cat.title}
            </Chip>
          ))}
        </ChipRow>
        <div className="flex items-center justify-between">
          <Tabs tabs={tabs} active={tab} onChange={(id) => updateParam('tab', id)} />
          <button onClick={() => setFilterOpen(true)} className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-2">
            <SlidersHorizontal className="w-5 h-5 text-ink-2" />
            {activeFilters > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-ink text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilters}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-5 mt-4">
        {!q && !category && (
          <>
            <SectionHeader title="Популярные категории" />
            <div className="grid grid-cols-2 gap-3 mb-8">
              {categories.slice(0, 6).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => updateParam('category', cat.id)}
                  className="flex items-center gap-3 p-4 rounded-card border border-line hover:border-line-strong transition-colors"
                  style={{ backgroundColor: cat.tint }}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-title text-ink">{cat.title}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="row" className="w-full h-24" />)}
          </div>
        ) : (
          <>
            {tab === 'classes' && (
              <>
                <p className="text-body-sm text-ink-3 mb-3" aria-live="polite">
                  {results.length} {results.length === 1 ? 'практика' : results.length < 5 ? 'практики' : 'практик'}
                </p>
                {results.length === 0 ? (
                  <EmptyState title="Ничего не найдено" description="Попробуйте изменить запрос или фильтры" action={
                    <PillButton variant="outline" onClick={() => setSearchParams({})}>Сбросить фильтры</PillButton>
                  } />
                ) : (
                  <div className="divide-y divide-line">
                    {results.map(cls => (
                      <ClassRow key={cls.id} cls={cls} teacher={teacherMap.get(cls.teacherId)} categoryTitle={categoryMap.get(cls.categoryId)?.title} />
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'programs' && (
              <div className="grid grid-cols-2 gap-4">
                {filteredPrograms.map(p => (
                  <ProgramCard key={p.id} program={p} teacher={teacherMap.get(p.teacherId)} />
                ))}
              </div>
            )}

            {tab === 'collections' && (
              <div className="grid grid-cols-2 gap-4">
                {filteredCollections.map(c => (
                  <CollectionCard key={c.id} collection={c} />
                ))}
              </div>
            )}

            {tab === 'teachers' && (
              <div className="space-y-3">
                {filteredTeachers.map(t => (
                  <button key={t.id} onClick={() => { updateParam('q', t.name); }} className="flex items-center gap-3 w-full p-3 rounded-card hover:bg-surface-2 transition-colors">
                    <Avatar name={t.name} size={44} color={t.avatarColor} />
                    <div className="text-left">
                      <p className="text-title text-ink">{t.name}</p>
                      <p className="text-body-sm text-ink-2">{t.practiceCount} практик</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter Sheet */}
      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Фильтры">
        <div className="space-y-6">
          <div>
            <p className="text-eyebrow text-ink-3 mb-2">Уровень</p>
            <ChipRow>
              {[1, 2, 3].map(l => (
                <Chip key={l} variant="filter" selected={filterLevel === String(l)} onClick={() => setFilterLevel(filterLevel === String(l) ? '' : String(l))}>
                  Уровень {l}
                </Chip>
              ))}
            </ChipRow>
          </div>
          <div>
            <p className="text-eyebrow text-ink-3 mb-2">Длительность</p>
            <ChipRow>
              {['10-15', '15-30', '30-45', '45-60', '60-90'].map(d => (
                <Chip key={d} variant="filter" selected={filterDur === d} onClick={() => setFilterDur(filterDur === d ? '' : d)}>
                  {d.split('-')[0]}–{d.split('-')[1]} мин
                </Chip>
              ))}
            </ChipRow>
          </div>
          <div>
            <p className="text-eyebrow text-ink-3 mb-2">Категория</p>
            <ChipRow>
              {categories.map(cat => (
                <Chip key={cat.id} variant="filter" selected={filterCategory === cat.id} onClick={() => setFilterCategory(filterCategory === cat.id ? '' : cat.id)}>
                  {cat.icon} {cat.title}
                </Chip>
              ))}
            </ChipRow>
          </div>
          <div className="flex gap-3 pt-4 border-t border-line">
            <PillButton variant="outline" size="lg" onClick={() => { setFilterLevel(''); setFilterDur(''); setFilterCategory(''); }} className="flex-1">
              Сбросить
            </PillButton>
            <PillButton size="lg" onClick={() => {
              updateParam('level', filterLevel);
              updateParam('dur', filterDur);
              updateParam('category', filterCategory);
              setFilterOpen(false);
            }} className="flex-1">
              Показать {results.length}
            </PillButton>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
