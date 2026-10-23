import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Play, Bookmark, Share2, Download, Heart, ChevronDown, ChevronUp, ListOrdered } from 'lucide-react';
import { PillButton, Avatar, Badge, Carousel, Sheet, IconButton, Skeleton } from '../components/ui';
import { ClassRow } from '../components/domain';
import { repository } from '../lib/repository';
import { useAppStore } from '../store';
import { formatDurationShort, formatDurationMin, formatDateRu } from '../lib/format';
import type { ClassItem, Teacher, Category, Program } from '../types';

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const progress = useAppStore(s => s.progress);
  const favorites = useAppStore(s => s.favorites);
  const addToQueue = useAppStore(s => s.addToQueue);
  const toggleFavorite = useAppStore(s => s.toggleFavorite);
  const showToast = useAppStore(s => s.showToast);

  const [cls, setCls] = useState<ClassItem | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [similar, setSimilar] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Analytics: class_open
    const source = (location.state as any)?.source || 'deep-link';
    console.log('[analytics] class_open', { classId: id, source });

    repository.getClass(id).then(c => {
      if (!c) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCls(c);
      Promise.all([
        repository.getTeachers(),
        repository.getCategories(),
        repository.getClasses({ categoryId: c.categoryId, limit: 20 }),
        repository.getPrograms(),
      ]).then(([t, cats, sim, progs]) => {
        setTeachers(t);
        setCategories(cats);
        setTeacher(t.find(te => te.id === c.teacherId) || null);
        setCategory(cats.find(ca => ca.id === c.categoryId) || null);
        setSimilar(sim.filter(s => s.id !== c.id).slice(0, 6));
        if (c.programId) {
          setProgram(progs.find(p => p.id === c.programId) || null);
        }
        setLoading(false);
      });
    });
  }, [id, location.state]);

  if (loading) {
    return (
      <div className="animate-fade-in-up">
        <div className="sticky top-0 z-30 bg-bg/95 backdrop-blur-md px-5 py-3">
          <div className="w-11 h-11 rounded-full bg-surface-2 animate-pulse" />
        </div>
        <Skeleton variant="hero" className="mx-5 rounded-card" />
        <div className="px-5 mt-4 space-y-3">
          <Skeleton variant="text" className="w-3/4 h-8" />
          <Skeleton variant="text" className="w-1/2 h-5" />
          <Skeleton variant="text" className="w-full h-5" />
          <Skeleton variant="text" className="w-full h-5" />
        </div>
      </div>
    );
  }

  if (notFound || !cls) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 text-center">
        <span className="text-6xl mb-4">🧘</span>
        <h1 className="text-h1 text-ink mb-2">Не нашли эту страницу</h1>
        <p className="text-body text-ink-2 mb-6">Возможно, практика была удалена или перемещена</p>
        <Link to="/">
          <PillButton size="lg">На главную</PillButton>
        </Link>
      </div>
    );
  }

  const clsProgress = progress[cls.id];
  const isFav = favorites.includes(cls.id);
  const hasProgress = clsProgress && !clsProgress.completed && clsProgress.watchedSec >= 10 && clsProgress.watchedSec < cls.durationSec * 0.95;
  const isCompleted = clsProgress?.completed;
  const completedLongAgo = isCompleted && clsProgress && (Date.now() - new Date(clsProgress.updatedAt).getTime()) > 30 * 86400000;

  const teacherMap = new Map(teachers.map(t => [t.id, t]));
  const categoryMap = new Map(categories.map(c => [c.id, c]));

  let buttonLabel = 'Начать практику';
  if (hasProgress) buttonLabel = 'Продолжить';
  else if (isCompleted && completedLongAgo) buttonLabel = 'Пройти заново';
  else if (isCompleted) buttonLabel = 'Пройти заново';

  const handleShare = async () => {
    const url = `${window.location.origin}/#/class/${cls.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: cls.title, url });
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast('Ссылка скопирована', 'success');
      } catch {
        showToast('Не удалось скопировать ссылку', 'error');
      }
    }
  };

  const handleAddToQueue = () => {
    addToQueue(cls.id);
    console.log('[analytics] add_queue', { classId: cls.id });
  };

  const handleToggleFavorite = () => {
    toggleFavorite(cls.id);
    console.log('[analytics]', isFav ? 'unfavorite' : 'favorite', { classId: cls.id });
  };

  const typeLabels: Record<string, string> = {
    yoga: 'Йога',
    breathwork: 'Дыхание',
    meditation: 'Медитация',
    pilates: 'Пилатес',
    stretch: 'Растяжка',
    qigong: 'Цигун',
  };

  return (
    <div className="animate-fade-in-up pb-28">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-bg/95 backdrop-blur-md px-5 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-2" aria-label="Назад">
          <ArrowLeft className="w-5 h-5 text-ink" />
        </button>
        <button onClick={handleToggleFavorite} className="w-11 h-11 flex items-center justify-center rounded-full bg-white border border-line" aria-label="Избранное">
          <Bookmark className={`w-5 h-5 ${isFav ? 'fill-ink text-ink' : 'text-ink-2'}`} />
        </button>
      </div>

      {/* Media block */}
      <div className="px-5 mt-2">
        <div
          className="relative aspect-video rounded-card overflow-hidden"
          style={{ background: cls.posterUrl }}
          role="img"
          aria-label={cls.title}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="inline-flex items-center h-7 px-2.5 rounded-pill bg-black/40 text-white text-chip backdrop-blur-sm">
              Уровень {cls.level}
            </span>
            <span className="inline-flex items-center h-7 px-2.5 rounded-pill bg-black/40 text-white text-chip backdrop-blur-sm">
              {formatDurationShort(cls.durationSec)}
            </span>
            {cls.isNew && <Badge variant="new" />}
          </div>

          {/* Play button */}
          <Link to={`/play/${cls.id}`} className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              aria-label={`Воспроизвести ${cls.title}`}
            >
              <Play className="w-8 h-8 text-ink ml-1" fill="currentColor" />
            </div>
            {hasProgress && clsProgress && (
              <p className="mt-2 text-body-sm text-white/90 bg-black/30 px-3 py-1 rounded-pill backdrop-blur-sm">
                Продолжить с {Math.floor(clsProgress.lastPosition / 60)}:{String(clsProgress.lastPosition % 60).padStart(2, '0')}
              </p>
            )}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 mt-4">
        {/* Title */}
        <h1 className="text-display text-ink line-clamp-3 mb-2">{cls.title}</h1>

        {/* Meta */}
        <p className="text-body text-ink-2 mb-4">
          {typeLabels[cls.type] || cls.type} · {category?.title} · Уровень {cls.level} · {formatDurationMin(cls.durationSec)}
        </p>

        {/* Teacher */}
        {teacher && (
          <Link to={`/search?teacher=${teacher.id}`} className="flex items-center gap-3 mb-6 p-3 rounded-card hover:bg-surface-2 transition-colors">
            <Avatar name={teacher.name} size={44} color={teacher.avatarColor} />
            <div>
              <p className="text-title text-ink">{teacher.name}</p>
              <p className="text-body-sm text-ink-2">{teacher.practiceCount} практик</p>
            </div>
          </Link>
        )}

        {/* Actions */}
        <div className="flex items-center justify-around mb-6 py-2">
          <button onClick={handleAddToQueue} className="flex flex-col items-center gap-1 min-w-[64px]">
            <ListOrdered className="w-6 h-6 text-ink-2" />
            <span className="text-chip text-ink-2">В очередь</span>
          </button>
          <button onClick={handleToggleFavorite} className="flex flex-col items-center gap-1 min-w-[64px]">
            <Heart className={`w-6 h-6 ${isFav ? 'fill-live text-live' : 'text-ink-2'}`} />
            <span className="text-chip text-ink-2">{isFav ? 'В избранном' : 'В избранное'}</span>
          </button>
          <button disabled className="flex flex-col items-center gap-1 min-w-[64px] opacity-50" title="Скоро">
            <Download className="w-6 h-6 text-ink-2" />
            <span className="text-chip text-ink-2">Скачать</span>
          </button>
          <button onClick={handleShare} className="flex flex-col items-center gap-1 min-w-[64px]">
            <Share2 className="w-6 h-6 text-ink-2" />
            <span className="text-chip text-ink-2">Поделиться</span>
          </button>
        </div>

        {/* Description */}
        {cls.description && (
          <div className="mb-6">
            <h2 className="text-title text-ink mb-2">Описание</h2>
            <div className="relative">
              <p className={`text-body text-ink-2 ${expanded ? '' : 'line-clamp-3'}`}>
                {cls.description}
              </p>
              {!expanded && cls.description.length > 150 && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-bg to-transparent" />
              )}
            </div>
            {cls.description.length > 150 && (
              <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 mt-2 text-body-sm text-ink font-medium">
                {expanded ? 'Свернуть' : 'Читать дальше'}
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        )}

        {/* Equipment */}
        {cls.equipment && cls.equipment.length > 0 && (
          <div className="mb-6">
            <h2 className="text-title text-ink mb-2">Что понадобится</h2>
            <div className="flex flex-wrap gap-2">
              {cls.equipment.map(eq => (
                <span key={eq} className="inline-flex items-center h-8 px-3 rounded-pill bg-surface-2 text-body-sm text-ink-2">{eq}</span>
              ))}
            </div>
          </div>
        )}

        {/* In this program */}
        {program && (
          <div className="mb-6">
            <h2 className="text-title text-ink mb-2">В этой программе</h2>
            <Link to={`/program/${program.id}`} className="flex items-center gap-3 p-3 rounded-card bg-surface-2 hover:bg-surface-2/80 transition-colors">
              <div className="w-16 h-20 rounded-row overflow-hidden shrink-0" style={{ background: program.coverUrl }} role="img" aria-label={program.title} />
              <div className="flex-1 min-w-0">
                <p className="text-title text-ink line-clamp-2">{program.title}</p>
                <p className="text-chip text-ink-3">{program.classIds.length} классов</p>
              </div>
            </Link>
          </div>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <div className="mb-6">
            <h2 className="text-title text-ink mb-3">Похожие практики</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
              {similar.map(s => (
                <div key={s.id} className="w-[140px] shrink-0">
                  <Link to={`/class/${s.id}`} className="block">
                    <div
                      className="aspect-square rounded-card overflow-hidden mb-2"
                      style={{ background: s.posterUrl }}
                      role="img"
                      aria-label={s.title}
                    />
                    <p className="text-body-sm text-ink line-clamp-2">{s.title}</p>
                    <p className="text-chip text-ink-3">{formatDurationShort(s.durationSec)}</p>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg/95 backdrop-blur-md border-t border-line px-5 py-3 z-30 safe-bottom">
        <div className="flex items-center gap-3 max-w-screen-xl mx-auto">
          <Link to={`/play/${cls.id}`} className="flex-1">
            <PillButton size="lg" className="w-full">{buttonLabel}</PillButton>
          </Link>
          <button
            onClick={handleToggleFavorite}
            className="w-11 h-11 rounded-full border border-line flex items-center justify-center shrink-0"
            aria-label="Избранное"
          >
            <Heart className={`w-5 h-5 ${isFav ? 'fill-live text-live' : 'text-ink-2'}`} />
          </button>
        </div>
        {isCompleted && completedLongAgo && clsProgress && (
          <p className="text-chip text-ink-3 text-center mt-1">
            Пройдено {formatDateRu(clsProgress.updatedAt)}
          </p>
        )}
      </div>
    </div>
  );
}
