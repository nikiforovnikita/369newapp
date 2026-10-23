import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { SearchField, ChipRow, Chip, Tabs, SectionHeader, PillButton, Sheet, EmptyState, Skeleton, Avatar } from '../components/ui';
import { ClassRow, ProgramCard, CollectionCard } from '../components/domain';
import { repository } from '../lib/repository';
import type { ClassItem, Category, Program, Collection, Teacher } from '../types';

export function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
  
  // Filter state
  const [filterLevels, setFilterLevels] = useState<string[]>(level ? level.split(',') : []);
  const [filterDur, setFilterDur] = useState(dur);
  const [filterCategories, setFilterCategories] = useState<string[]>(category ? [category] : []);
  const [filterTeacher, setFilterTeacher] = useState('');
  
  // Recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('pk:user:recentSearches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Pagination
  const [visibleCount, setVisibleCount] = useState(12);

  // Auto-focus if came from Today
  const autoFocus = location.state?.fromToday || false;

  useEffect(() => {
    repository.getCategories().then(setCategories);
    repository.getTeachers().then(setTeachers);
  }, []);

  const search = useCallback(async () => {
    setLoading(true);
    const params: any = { sort: sort as any, limit: 100 };
    if (q) params.q = q;
    if (filterCategories.length === 1) params.categoryId = filterCategories[0];
    if (filterLevels.length === 1) params.level = parseInt(filterLevels[0]) as any;
    if (filterDur) {
      const [min, max] = filterDur.split('-').map(Number);
      if (min) params.minDurSec = min * 60;
      if (max && max !== 90) params.maxDurSec = max * 60;
    }
    if (filterTeacher) params.teacherId = filterTeacher;

    const [cls, progs, cols] = await Promise.all([
      repository.getClasses(params),
      repository.getPrograms(),
      repository.getCollections(),
    ]);
    setResults(cls);
    setPrograms(progs);
    setCollections(cols);
    setLoading(false);
  }, [q, filterCategories, filterLevels, filterDur, filterTeacher, sort]);

  useEffect(() => {
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  // Save to recent searches
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 8);
    setRecentSearches(updated);
    try {
      localStorage.setItem('pk:user:recentSearches', JSON.stringify(updated));
    } catch {}
  };

  const removeRecentSearch = (query: string) => {
    const updated = recentSearches.filter(s => s !== query);
    setRecentSearches(updated);
    try {
      localStorage.setItem('pk:user:recentSearches', JSON.stringify(updated));
    } catch {}
  };

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  };

  const handleSearch = (value: string) => {
    setLocalQ(value);
    updateParam('q', value);
    if (value && value !== q) {
      saveRecentSearch(value);
    }
  };

  const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Count active filters
  const activeFilters = useMemo(() => {
    let count = 0;
    if (filterLevels.length > 0) count++;
    if (filterDur) count++;
    if (filterCategories.length > 0) count++;
    if (filterTeacher) count++;
    return count;
  }, [filterLevels, filterDur, filterCategories, filterTeacher]);

  // Active filter chips
  const activeFilterChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];
    filterLevels.forEach(l => {
      chips.push({
        id: `level-${l}`,
        label: `Уровень ${l}`,
        onRemove: () => setFilterLevels(filterLevels.filter(x => x !== l)),
      });
    });
    if (filterDur) {
      chips.push({
        id: 'dur',
        label: `${filterDur.replace('-', '–')} мин`,
        onRemove: () => setFilterDur(''),
      });
    }
    filterCategories.forEach(c => {
      const cat = categoryMap.get(c);
      chips.push({
        id: `cat-${c}`,
        label: cat?.title || c,
        onRemove: () => setFilterCategories(filterCategories.filter(x => x !== c)),
      });
    });
    if (filterTeacher) {
      const teacher = teacherMap.get(filterTeacher);
      chips.push({
        id: 'teacher',
        label: teacher?.name || 'Преподаватель',
        onRemove: () => setFilterTeacher(''),
      });
    }
    return chips;
  }, [filterLevels, filterDur, filterCategories, filterTeacher, categoryMap, teacherMap]);

  const tabs = [
    { id: 'classes', label: 'Практики' },
    { id: 'programs', label: 'Программы' },
    { id: 'collections', label: 'Коллекции' },
    { id: 'teachers', label: 'Преподаватели' },
  ];

  // Filter programs and collections
  const filteredPrograms = useMemo(() => {
    let progs = programs;
    if (filterCategories.length > 0) {
      progs = progs.filter(p => p.categoryIds.some(c => filterCategories.includes(c)));
    }
    if (filterLevels.length > 0) {
      progs = progs.filter(p => filterLevels.includes(String(p.level)));
    }
    if (q) {
      progs = progs.filter(p => p.title.toLowerCase().includes(q.toLowerCase()));
    }
    return progs;
  }, [programs, filterCategories, filterLevels, q]);

  const filteredCollections = useMemo(() => {
    if (q) {
      return collections.filter(c => c.title.toLowerCase().includes(q.toLowerCase()));
    }
    return collections;
  }, [collections, q]);

  const filteredTeachers = useMemo(() => {
    if (q) {
      return teachers.filter(t => t.name.toLowerCase().includes(q.toLowerCase()));
    }
    return teachers;
  }, [teachers, q]);

  const handleResetFilters = () => {
    setFilterLevels([]);
    setFilterDur('');
    setFilterCategories([]);
    setFilterTeacher('');
    setSearchParams({});
    setLocalQ('');
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (localQ) params.set('q', localQ);
    if (filterCategories.length > 0) params.set('category', filterCategories.join(','));
    if (filterLevels.length > 0) params.set('level', filterLevels.join(','));
    if (filterDur) params.set('dur', filterDur);
    if (filterTeacher) params.set('teacher', filterTeacher);
    setSearchParams(params);
    setFilterOpen(false);
  };

  const showMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  const visibleResults = results.slice(0, visibleCount);
  const hasMore = results.length > visibleCount;

  return (
    <div className="animate-fade-in-up">
      <div className="sticky top-[88px] z-30 bg-bg/95 backdrop-blur-md px-5 pt-3 pb-2 space-y-3">
        <SearchField
          value={localQ}
          onChange={handleSearch}
          placeholder="Практики, преподаватели, программы"
          autoFocus={autoFocus}
        />
        <ChipRow>
          {categories.map(cat => (
            <Chip
              key={cat.id}
              variant="filter"
              selected={filterCategories.includes(cat.id)}
              onClick={() => {
                if (filterCategories.includes(cat.id)) {
                  setFilterCategories(filterCategories.filter(c => c !== cat.id));
                } else {
                  setFilterCategories([...filterCategories, cat.id]);
                }
              }}
            >
              {cat.icon} {cat.title}
            </Chip>
          ))}
        </ChipRow>
        <div className="flex items-center justify-between">
          <Tabs tabs={tabs} active={tab} onChange={(id) => updateParam('tab', id)} />
          <button
            onClick={() => setFilterOpen(true)}
            className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-2"
            aria-label="Фильтры"
          >
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
        {/* Active filter chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeFilterChips.map(chip => (
              <span key={chip.id} className="inline-flex items-center gap-1 h-8 pl-3 pr-1 rounded-pill bg-surface-2 text-body-sm text-ink">
                {chip.label}
                <button onClick={chip.onRemove} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-line" aria-label="Удалить фильтр">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Empty state - no query */}
        {!q && filterCategories.length === 0 && (
          <>
            <SectionHeader title="Популярные категории" />
            <div className="grid grid-cols-2 gap-3 mb-8">
              {categories.slice(0, 6).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategories([cat.id])}
                  className="flex items-center gap-3 p-4 rounded-card border border-line hover:border-line-strong transition-colors"
                  style={{ backgroundColor: cat.tint }}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-title text-ink">{cat.title}</span>
                </button>
              ))}
            </div>

            {recentSearches.length > 0 && (
              <>
                <SectionHeader title="Последние запросы" />
                <div className="space-y-2 mb-8">
                  {recentSearches.map(search => (
                    <div key={search} className="flex items-center justify-between p-3 rounded-card bg-surface-2">
                      <button onClick={() => handleSearch(search)} className="text-body text-ink flex-1 text-left">
                        {search}
                      </button>
                      <button onClick={() => removeRecentSearch(search)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-line" aria-label="Удалить">
                        <X className="w-4 h-4 text-ink-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Results */}
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
                  <EmptyState
                    title="Ничего не нашлось"
                    description="Попробуйте другое слово или сбросьте фильтры"
                    action={
                      <PillButton variant="outline" onClick={handleResetFilters}>Сбросить фильтры</PillButton>
                    }
                  />
                ) : (
                  <>
                    <div className="divide-y divide-line">
                      {visibleResults.map(cls => (
                        <ClassRow
                          key={cls.id}
                          cls={cls}
                          teacher={teacherMap.get(cls.teacherId)}
                          categoryTitle={categoryMap.get(cls.categoryId)?.title}
                        />
                      ))}
                    </div>
                    {hasMore && (
                      <div className="mt-6 text-center">
                        <PillButton variant="outline" size="lg" onClick={showMore}>
                          Показать ещё
                        </PillButton>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {tab === 'programs' && (
              <>
                <p className="text-body-sm text-ink-3 mb-3" aria-live="polite">
                  {filteredPrograms.length} {filteredPrograms.length === 1 ? 'программа' : filteredPrograms.length < 5 ? 'программы' : 'программ'}
                </p>
                {filteredPrograms.length === 0 ? (
                  <EmptyState title="Ничего не нашлось" description="Попробуйте другое слово или сбросьте фильтры" />
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredPrograms.map(p => (
                      <ProgramCard key={p.id} program={p} teacher={teacherMap.get(p.teacherId)} />
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'collections' && (
              <>
                <p className="text-body-sm text-ink-3 mb-3" aria-live="polite">
                  {filteredCollections.length} {filteredCollections.length === 1 ? 'коллекция' : filteredCollections.length < 5 ? 'коллекции' : 'коллекций'}
                </p>
                {filteredCollections.length === 0 ? (
                  <EmptyState title="Ничего не нашлось" description="Попробуйте другое слово или сбросьте фильтры" />
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredCollections.map(c => (
                      <CollectionCard key={c.id} collection={c} />
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'teachers' && (
              <>
                <p className="text-body-sm text-ink-3 mb-3" aria-live="polite">
                  {filteredTeachers.length} {filteredTeachers.length === 1 ? 'преподаватель' : 'преподавателей'}
                </p>
                {filteredTeachers.length === 0 ? (
                  <EmptyState title="Ничего не нашлось" description="Попробуйте другое слово или сбросьте фильтры" />
                ) : (
                  <div className="space-y-3">
                    {filteredTeachers.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setFilterTeacher(t.id); }}
                        className="flex items-center gap-3 w-full p-3 rounded-card hover:bg-surface-2 transition-colors"
                      >
                        <Avatar name={t.name} size={44} color={t.avatarColor} />
                        <div className="text-left flex-1">
                          <p className="text-title text-ink">{t.name}</p>
                          <p className="text-body-sm text-ink-2">{t.practiceCount} практик</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Filter Sheet */}
      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Фильтры">
        <div className="space-y-6">
          <div>
            <p className="text-eyebrow text-ink-3 mb-2">УРОВЕНЬ</p>
            <div className="flex flex-wrap gap-2">
              {['1', '2', '3'].map(l => (
                <Chip
                  key={l}
                  variant="filter"
                  selected={filterLevels.includes(l)}
                  onClick={() => {
                    if (filterLevels.includes(l)) {
                      setFilterLevels(filterLevels.filter(x => x !== l));
                    } else {
                      setFilterLevels([...filterLevels, l]);
                    }
                  }}
                >
                  Уровень {l}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="text-eyebrow text-ink-3 mb-2">ДЛИТЕЛЬНОСТЬ</p>
            <div className="flex flex-wrap gap-2">
              {['10-15', '15-30', '30-45', '45-60', '60-90'].map(d => (
                <Chip
                  key={d}
                  variant="filter"
                  selected={filterDur === d}
                  onClick={() => setFilterDur(filterDur === d ? '' : d)}
                >
                  {d.split('-')[0]}–{d.split('-')[1]} мин
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="text-eyebrow text-ink-3 mb-2">КАТЕГОРИЯ</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <Chip
                  key={cat.id}
                  variant="filter"
                  selected={filterCategories.includes(cat.id)}
                  onClick={() => {
                    if (filterCategories.includes(cat.id)) {
                      setFilterCategories(filterCategories.filter(c => c !== cat.id));
                    } else {
                      setFilterCategories([...filterCategories, cat.id]);
                    }
                  }}
                >
                  {cat.icon} {cat.title}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="text-eyebrow text-ink-3 mb-2">ПРЕПОДАВАТЕЛЬ</p>
            <input
              type="text"
              placeholder="Поиск преподавателя..."
              value={filterTeacher ? teacherMap.get(filterTeacher)?.name || '' : ''}
              onChange={(e) => {
                const name = e.target.value.toLowerCase();
                if (!name) {
                  setFilterTeacher('');
                } else {
                  const found = teachers.find(t => t.name.toLowerCase().includes(name));
                  if (found) setFilterTeacher(found.id);
                }
              }}
              className="w-full h-12 px-4 rounded-card bg-surface-2 text-body outline-none focus:ring-2 focus:ring-ink/20"
            />
            {filterTeacher && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-body-sm text-ink">{teacherMap.get(filterTeacher)?.name}</span>
                <button onClick={() => setFilterTeacher('')} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-2">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-line">
            <PillButton
              variant="ghost"
              size="lg"
              onClick={() => {
                setFilterLevels([]);
                setFilterDur('');
                setFilterCategories([]);
                setFilterTeacher('');
              }}
              className="flex-1"
            >
              Сбросить
            </PillButton>
            <PillButton size="lg" onClick={handleApplyFilters} className="flex-1">
              Показать {results.length}
            </PillButton>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
