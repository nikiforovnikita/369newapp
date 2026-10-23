import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Check } from 'lucide-react';
import { PillButton, ChipRow, Chip, ProgressBar, Avatar, Badge, Sheet } from '../components/ui';
import { ClassRow } from '../components/domain';
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
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    repository.getCategories().then(cats => {
      const cat = cats.find(c => c.slug === slug);
      if (!cat) { navigate('/404'); return; }
      setCategory(cat);
      repository.getClasses({ categoryId: cat.id, sort: 'new' }).then(setClasses);
    });
    repository.getTeachers().then(setTeachers);
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

  const totalDuration = filteredClasses.reduce((sum, c) => sum + c.durationSec, 0);

  return (
    <div className="animate-fade-in-up">
      {/* Hero */}
      <div className="px-5 pt-4 pb-6" style={{ backgroundColor: category.tint }}>
        <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center rounded-full bg-white/50 mb-4" aria-label="Назад">
          <ArrowLeft className="w-5 h-5 text-ink" />
        </button>
        <span className="text-5xl mb-3 block">{category.icon}</span>
        <h1 className="text-h1 text-ink mb-2">{category.title}</h1>
        <p className="text-body text-ink-2">{classes.length} практик · {formatDurationMin(totalDuration)} всего</p>
      </div>

      <div className="px-5 pt-4">
        <ChipRow className="mb-4">
          <Chip variant="filter" selected={!filter} onClick={() => setFilter('')}>Все</Chip>
          <Chip variant="filter" selected={filter === 'beginners'} onClick={() => setFilter(filter === 'beginners' ? '' : 'beginners')}>Для начинающих</Chip>
          <Chip variant="filter" selected={filter === '10'} onClick={() => setFilter(filter === '10' ? '' : '10')}>10 мин</Chip>
          <Chip variant="filter" selected={filter === '30'} onClick={() => setFilter(filter === '30' ? '' : '30')}>30 мин</Chip>
          <Chip variant="filter" selected={filter === 'morning'} onClick={() => setFilter(filter === 'morning' ? '' : 'morning')}>Утро</Chip>
          <Chip variant="filter" selected={filter === 'evening'} onClick={() => setFilter(filter === 'evening' ? '' : 'evening')}>Вечер</Chip>
        </ChipRow>

        <div className="divide-y divide-line">
          {filteredClasses.map(cls => (
            <ClassRow key={cls.id} cls={cls} teacher={teacherMap.get(cls.teacherId)} />
          ))}
        </div>

        {filteredClasses.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-bg/95 backdrop-blur-md border-t border-line px-5 py-3 z-30 safe-bottom">
            <Link to={`/class/${filteredClasses[0].id}`} className="block">
              <PillButton size="lg" className="w-full">
                Начать практику · {formatDurationMin(filteredClasses[0].durationSec)}
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
  const [program, setProgram] = useState<Program | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);

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
      });
    });
  }, [id, navigate]);

  if (!program) return null;

  const completedCount = program.classIds.filter(cid => progress[cid]?.completed).length;
  const totalDuration = classes.reduce((sum, c) => sum + c.durationSec, 0);
  const allDone = completedCount === program.classIds.length;
  const nextClass = classes.find(c => !progress[c.id]?.completed) || classes[0];
  const buttonLabel = completedCount === 0 ? 'Начать' : allDone ? 'Пройти снова' : 'Продолжить';

  useEffect(() => {
    if (allDone && completedCount > 0) {
      setCompleteOpen(true);
    }
  }, [allDone, completedCount]);

  return (
    <div className="animate-fade-in-up">
      {/* Cover */}
      <div className="relative h-[200px] flex items-end" style={{ background: program.coverUrl }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-5 w-11 h-11 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm" aria-label="Назад">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="relative px-5 pb-4 w-full">
          <p className="text-eyebrow text-white/70 mb-1">ПРОГРАММА · УРОВЕНЬ {program.level}</p>
          <h1 className="text-h1 text-white">{program.title}</h1>
          <p className="text-body-sm text-white/80 mt-1">
            {teacher?.name} · {program.classIds.length} классов · {formatDurationMin(totalDuration)}
          </p>
        </div>
      </div>

      <div className="px-5 pt-4">
        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-body-sm text-ink-2">Пройдено {completedCount} из {program.classIds.length}</span>
            <span className="text-body-sm text-ink-2">{Math.round((completedCount / program.classIds.length) * 100)}%</span>
          </div>
          <ProgressBar value={completedCount} max={program.classIds.length} className="h-2" />
        </div>

        {/* CTA */}
        <Link to={`/class/${nextClass.id}`} className="block mb-6">
          <PillButton size="lg" className="w-full">{buttonLabel}</PillButton>
        </Link>

        {/* Description */}
        {program.description && (
          <p className="text-body text-ink-2 mb-6">{program.description}</p>
        )}

        {/* Class list */}
        <div>
          {classes.map((cls, i) => {
            const isCompleted = progress[cls.id]?.completed;
            const isNext = cls.id === nextClass?.id && !allDone;

            return (
              <Link key={cls.id} to={`/class/${cls.id}`} className={`flex items-center gap-3 py-3 ${isCompleted ? 'opacity-50' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-chip font-semibold ${isNext ? 'border-2 border-ink text-ink' : isCompleted ? 'bg-success text-white' : 'bg-surface-2 text-ink-3'}`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-title text-ink line-clamp-1">{cls.title}</p>
                  <p className="text-chip text-ink-3">{formatDurationMin(cls.durationSec)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Completion sheet */}
      <Sheet open={completeOpen} onClose={() => setCompleteOpen(false)} title="Программа завершена!">
        <div className="text-center py-4">
          <span className="text-5xl mb-4 block">🎉</span>
          <p className="text-body text-ink-2 mb-6">
            Вы прошли все {program.classIds.length} классов программы «{program.title}»
          </p>
          <PillButton size="lg" className="w-full" onClick={() => setCompleteOpen(false)}>Отлично!</PillButton>
        </div>
      </Sheet>
    </div>
  );
}

export function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

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
      });
    });
  }, [id, navigate]);

  if (!collection) return null;

  const teacherMap = new Map(teachers.map(t => [t.id, t]));
  const firstClass = classes[0];

  return (
    <div className="animate-fade-in-up">
      {/* Hero */}
      <div className="relative h-[140px] flex items-end" style={{ background: collection.coverUrl }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-5 w-11 h-11 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm" aria-label="Назад">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="relative px-5 pb-4 w-full">
          <h1 className="text-h1 text-white">{collection.title}</h1>
          <p className="text-body-sm text-white/80">{collection.items.length} практик · {collection.createdBy}</p>
        </div>
      </div>

      <div className="px-5 pt-4">
        {firstClass && (
          <Link to={`/class/${firstClass.id}`} className="block mb-6">
            <PillButton size="lg" className="w-full">Начать коллекцию</PillButton>
          </Link>
        )}

        <div className="divide-y divide-line">
          {classes.map(cls => (
            <Link key={cls.id} to={`/class/${cls.id}`} className="flex items-center gap-3 py-3">
              <div className="w-16 h-16 rounded-row overflow-hidden shrink-0" style={{ background: cls.posterUrl }} />
              <div className="flex-1 min-w-0">
                <p className="text-title text-ink line-clamp-1">{cls.title}</p>
                <p className="text-body-sm text-ink-2">{teacherMap.get(cls.teacherId)?.name}</p>
              </div>
            </Link>
          ))}
          {programs.map(prog => (
            <Link key={prog.id} to={`/program/${prog.id}`} className="flex items-center gap-3 py-3">
              <div className="w-16 h-16 rounded-row overflow-hidden shrink-0" style={{ background: prog.coverUrl }} />
              <div className="flex-1 min-w-0">
                <p className="text-title text-ink line-clamp-1">{prog.title}</p>
                <p className="text-body-sm text-ink-2">Программа · {prog.classIds.length} классов</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
