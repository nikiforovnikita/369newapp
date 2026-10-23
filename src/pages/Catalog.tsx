import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Check, Share2 } from 'lucide-react';
import { PillButton, ChipRow, Chip, ProgressBar, Avatar, Badge, Sheet } from '../components/ui';
import { ClassRow, ProgramCard } from '../components/domain';
import { repository } from '../lib/repository';
import { useAppStore } from '../store';
import { formatDurationMin } from '../lib/format';
import type { Category, ClassItem, Program, Collection, Teacher } from '../types';

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    repository.getCategories().then(cats => {
      const cat = cats.find(c => c.slug === slug);
      if (!cat) { navigate('/404'); return; }
      setCategory(cat);
      Promise.all([
        repository.getClasses({ categoryId: cat.id, sort: 'new' }),
        repository.getTeachers(),
        repository.getPrograms(),
      ]).then(([cls, t, progs]) => {
        setClasses(cls);
        setTeachers(t);
        setPrograms(progs.filter(p => p.categoryIds.includes(cat.id)));
        setLoading(false);
      });
    });
  }, [slug, navigate]);

  const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);

  const filteredClasses = useMemo(() => {
    if (!filter) return classes;
    if (filter === 'beginners') return classes.filter(c => c.level === 1);
    if (filter === '10') return classes.filter(c => c.durationSec <= 600);
    if (filter === '30') return classes.filter(c => c.durationSec >= 1800 && c.durationSec <= 2400);
    if (filter === 'morning') return classes.filter(c => c.tags.includes('утро'));
    if (filter === 'evening') return classes.filter(c => c.tags.includes('вечер'));
    return classes;
  }, [classes, filter]);

  if (!category) return null;

  if (loading) {
    return (
      <div className="px-5 pt-4 space-y-4">
        <div className="h-[200px] rounded-card bg-surface-2 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-card bg-surface-2 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const totalDuration = filteredClasses.reduce((sum, c) => sum + c.durationSec, 0);
  const minDuration = Math.min(...filteredClasses.map(c => c.durationSec));
  const maxDuration = Math.max(...filteredClasses.map(c => c.durationSec));

  const firstUnviewedClass = filteredClasses.find(c => {
    const progress = useAppStore.getState().progress[c.id];
    return !progress?.completed;
  }) || filteredClasses[0];

  return (
    <div className="animate-fade-in-up">
      {/* Hero */}
      <div className="relative px-5 pt-4 pb-6" style={{ backgroundColor: category.tint }}>
        <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-2 mb-4" aria-label="Назад">
          <ArrowLeft className="w-5 h-5 text-ink" />
        </button>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-display text-ink mb-2">{category.title}</h1>
            <p className="text-body text-ink-2 line-clamp-2">
              Практики для развития тела и духа. Выберите подходящую практику и начните прямо сейчас.
            </p>
          </div>
          <span className="text-6xl ml-4">{category.icon}</span>
        </div>
        <p className="text-body text-ink-2 mt-3">
          {filteredClasses.length} практик · от {formatDurationMin(minDuration)} до {formatDurationMin(maxDuration)}
        </p>
      </div>

      <div className="px-5 pt-4 pb-28">
        <ChipRow className="mb-4">
          <Chip variant="filter" selected={!filter} onClick={() => setFilter('')}>Все</Chip>
          <Chip variant="filter" selected={filter === 'beginners'} onClick={() => setFilter(filter === 'beginners' ? '' : 'beginners')}>Для начинающих</Chip>
          <Chip variant="filter" selected={filter === '10'} onClick={() => setFilter(filter === '10' ? '' : '10')}>10 мин</Chip>
          <Chip variant="filter" selected={filter === '30'} onClick={() => setFilter(filter === '30' ? '' : '30')}>30 мин</Chip>
          <Chip variant="filter" selected={filter === 'morning'} onClick={() => setFilter(filter === 'morning' ? '' : 'morning')}>Утро</Chip>
          <Chip variant="filter" selected={filter === 'evening'} onClick={() => setFilter(filter === 'evening' ? '' : 'evening')}>Вечер</Chip>
        </ChipRow>

        {/* Programs carousel */}
        {programs.length > 0 && (
          <section className="mb-6">
            <h2 className="text-h2 text-ink mb-3">Программы</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
              {programs.map(p => (
                <ProgramCard key={p.id} program={p} teacher={teacherMap.get(p.teacherId)} />
              ))}
            </div>
          </section>
        )}

        {/* Classes list */}
        <div className="divide-y divide-line">
          {filteredClasses.map(cls => (
            <ClassRow key={cls.id} cls={cls} teacher={teacherMap.get(cls.teacherId)} />
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-body text-ink-2">Нет практик по выбранным фильтрам</p>
          </div>
        )}

        {/* Fixed CTA */}
        {firstUnviewedClass && (
          <div className="fixed bottom-0 left-0 right-0 bg-bg/95 backdrop-blur-md border-t border-line px-5 py-3 z-30 safe-bottom">
            <Link to={`/class/${firstUnviewedClass.id}`} className="block">
              <PillButton size="lg" className="w-full">
                Начать практику · {formatDurationMin(firstUnviewedClass.durationSec)}
              </PillButton>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProgramPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const progress = useAppStore(s => s.progress);
  const showToast = useAppStore(s => s.showToast);
  const [program, setProgram] = useState<Program | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    repository.getProgram(id).then(p => {
      if (!p) { navigate('/404'); return; }
      setProgram(p);
      Promise.all([
        repository.getTeachers(),
        repository.getClasses(),
      ]).then(([t, allClasses]) => {
        setTeacher(t.find(te => te.id === p.teacherId) || null);
        setClasses(p.classIds.map(cid => allClasses.find(c => c.id === cid)).filter(Boolean) as ClassItem[]);
        setLoading(false);
      });
    });
  }, [id, navigate]);

  if (!program) return null;

  if (loading) {
    return (
      <div className="px-5 pt-4 space-y-4">
        <div className="aspect-[2/1] rounded-card bg-surface-2 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-card bg-surface-2 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const completedCount = program.classIds.filter(cid => progress[cid]?.completed).length;
  const totalDuration = classes.reduce((sum, c) => sum + c.durationSec, 0);
  const allDone = completedCount === program.classIds.length && completedCount > 0;
  const nextClass = classes.find(c => !progress[c.id]?.completed) || classes[0];
  const buttonLabel = completedCount === 0 ? 'Начать программу' : allDone ? 'Пройти снова' : 'Продолжить программу';

  useEffect(() => {
    if (allDone) {
      setCompleteOpen(true);
    }
  }, [allDone]);

  const handleShare = async () => {
    const url = `${window.location.origin}/#/program/${program.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: program.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Ссылка скопирована', 'success');
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Cover */}
      <div className="relative aspect-[2/1] flex items-end" style={{ background: program.coverUrl }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-5 w-11 h-11 flex items-center justify-center rounded-full bg-surface-2/80 backdrop-blur-sm" aria-label="Назад">
          <ArrowLeft className="w-5 h-5 text-ink" />
        </button>
        <div className="relative px-5 pb-4 w-full">
          <p className="text-eyebrow text-white/70 mb-1">ПРОГРАММА · УРОВЕНЬ {program.level}</p>
          <h1 className="text-display text-white line-clamp-3">{program.title}</h1>
          <p className="text-body-sm text-white/80 mt-1">
            {teacher?.name} · {program.classIds.length} классов · {formatDurationMin(totalDuration)}
          </p>
        </div>
      </div>

      <div className="px-5 pt-4 pb-28">
        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-body-sm text-ink-2">Пройдено {completedCount} из {program.classIds.length}</span>
            <span className="text-body-sm text-ink-2">{Math.round((completedCount / program.classIds.length) * 100)}%</span>
          </div>
          <ProgressBar value={completedCount} max={program.classIds.length} className="h-[3px]" />
        </div>

        {/* CTA */}
        <Link to={`/class/${nextClass.id}`} className="block mb-6">
          <PillButton size="lg" className="w-full">{buttonLabel}</PillButton>
        </Link>

        {/* Description */}
        {program.description && (
          <div className="mb-6">
            <p className={`text-body text-ink-2 ${expanded ? '' : 'line-clamp-2'}`}>
              {program.description}
            </p>
            {program.description.length > 100 && (
              <button onClick={() => setExpanded(!expanded)} className="text-body-sm text-ink font-medium mt-2">
                {expanded ? 'Свернуть' : 'Читать дальше'}
              </button>
            )}
          </div>
        )}

        {/* Class list */}
        <div>
          {classes.map((cls, i) => {
            const isCompleted = progress[cls.id]?.completed;
            const isNext = cls.id === nextClass?.id && !allDone;

            return (
              <Link key={cls.id} to={`/class/${cls.id}`} className={`flex items-center gap-3 py-3 ${isCompleted ? 'opacity-60' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-chip font-semibold ${isNext ? 'border-2 border-ink text-ink' : isCompleted ? 'bg-success text-white' : 'bg-surface-2 text-ink-3'}`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <div className="w-16 h-16 rounded-row overflow-hidden shrink-0" style={{ background: cls.posterUrl }} />
                <div className="flex-1 min-w-0">
                  <p className="text-title text-ink line-clamp-1">{cls.title}</p>
                  <p className="text-chip text-ink-3">{formatDurationMin(cls.durationSec)} · Уровень {cls.level}</p>
                </div>
                {isNext && <Play className="w-5 h-5 text-ink shrink-0" />}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Completion sheet */}
      <Sheet open={completeOpen} onClose={() => setCompleteOpen(false)} title="Программа завершена!">
        <div className="text-center py-4">
          <div className="relative mb-4">
            <span className="text-6xl">🎉</span>
            {/* Confetti animation */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: ['#E5484D', '#2F8F5B', '#14140F', '#E8D4B4'][i % 4],
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                  }}
                />
              ))}
            </div>
          </div>
          <p className="text-body text-ink-2 mb-6">
            Вы прошли все {program.classIds.length} классов программы «{program.title}»
          </p>
          <div className="flex gap-3">
            <PillButton variant="outline" size="lg" onClick={handleShare} className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Поделиться
            </PillButton>
            <PillButton size="lg" onClick={() => setCompleteOpen(false)} className="flex-1">Отлично!</PillButton>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

export function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToQueue = useAppStore(s => s.addToQueue);
  const showToast = useAppStore(s => s.showToast);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    repository.getCollection(id).then(col => {
      if (!col) { navigate('/404'); return; }
      setCollection(col);
      Promise.all([
        repository.getClasses(),
        repository.getPrograms(),
        repository.getTeachers(),
      ]).then(([allClasses, allPrograms, t]) => {
        setTeachers(t);
        const resolvedClasses = col.items.filter(i => i.kind === 'class').map(i => allClasses.find(c => c.id === i.id)).filter(Boolean) as ClassItem[];
        const resolvedPrograms = col.items.filter(i => i.kind === 'program').map(i => allPrograms.find(p => p.id === i.id)).filter(Boolean) as Program[];
        setClasses(resolvedClasses);
        setPrograms(resolvedPrograms);
        setLoading(false);
      });
    });
  }, [id, navigate]);

  if (!collection) return null;

  if (loading) {
    return (
      <div className="px-5 pt-4 space-y-4">
        <div className="h-[140px] rounded-card bg-surface-2 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-card bg-surface-2 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const teacherMap = new Map(teachers.map(t => [t.id, t]));
  const firstClass = classes[0];

  const handleStartCollection = async () => {
    // Add first 5 items to queue
    const itemsToAdd = [...classes.slice(0, 5), ...programs.slice(0, Math.max(0, 5 - classes.length))];
    for (const cls of itemsToAdd) {
      await addToQueue(cls.id);
    }
    if (firstClass) {
      navigate(`/play/${firstClass.id}`);
    }
    showToast('Добавлено в очередь', 'success');
  };

  return (
    <div className="animate-fade-in-up">
      {/* Hero */}
      <div className="px-5 pt-4 pb-6">
        <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-2 mb-4" aria-label="Назад">
          <ArrowLeft className="w-5 h-5 text-ink" />
        </button>
        <div className="flex items-start gap-4">
          <div className="w-[140px] h-[140px] rounded-card overflow-hidden shrink-0" style={{ background: collection.coverUrl }} />
          <div className="flex-1 min-w-0">
            <h1 className="text-h1 text-ink mb-1">{collection.title}</h1>
            <p className="text-body-sm text-ink-2">{collection.items.length} элементов · {collection.createdBy}</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-28">
        <button onClick={handleStartCollection} className="w-full mb-6">
          <PillButton size="lg" className="w-full">Начать коллекцию</PillButton>
        </button>

        <div className="divide-y divide-line">
          {classes.map(cls => (
            <Link key={cls.id} to={`/class/${cls.id}`} className="flex items-center gap-3 py-3">
              <div className="w-24 h-24 rounded-row overflow-hidden shrink-0" style={{ background: cls.posterUrl }} />
              <div className="flex-1 min-w-0">
                <p className="text-title text-ink line-clamp-2">{cls.title}</p>
                <p className="text-body-sm text-ink-2">{teacherMap.get(cls.teacherId)?.name}</p>
              </div>
            </Link>
          ))}
          {programs.map(prog => (
            <Link key={prog.id} to={`/program/${prog.id}`} className="flex items-center gap-3 py-3">
              <div className="w-[96px] h-[120px] rounded-row overflow-hidden shrink-0" style={{ background: prog.coverUrl }} />
              <div className="flex-1 min-w-0">
                <p className="text-title text-ink line-clamp-2">{prog.title}</p>
                <p className="text-body-sm text-ink-2">Программа · {prog.classIds.length} классов · {formatDurationMin(prog.classIds.reduce((sum, cid) => {
                  const cls = classes.find(c => c.id === cid);
                  return sum + (cls?.durationSec || 0);
                }, 0))}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
