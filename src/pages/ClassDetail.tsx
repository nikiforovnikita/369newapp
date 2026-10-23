import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Play, Bookmark, Share2, Download, MoreHorizontal, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { PillButton, Avatar, Badge, Carousel, Sheet, IconButton } from '../components/ui';
import { ClassRow, HeroCard } from '../components/domain';
import { repository } from '../lib/repository';
import { useAppStore } from '../store';
import { formatDurationShort } from '../lib/format';
import type { ClassItem, Teacher, Category } from '../types';

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const progress = useAppStore(s => s.progress);
  const favorites = useAppStore(s => s.favorites);
  const addToQueue = useAppStore(s => s.addToQueue);
  const toggleFavorite = useAppStore(s => s.toggleFavorite);
  const showToast = useAppStore(s => s.showToast);

  const [cls, setCls] = useState<ClassItem | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [similar, setSimilar] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    repository.getClass(id).then(c => {
      if (!c) { navigate('/404'); return; }
      setCls(c);
      Promise.all([
        repository.getTeachers(),
        repository.getCategories(),
        repository.getClasses({ categoryId: c.categoryId, limit: 6 }),
      ]).then(([t, cats, sim]) => {
        setTeachers(t);
        setCategories(cats);
        setTeacher(t.find(te => te.id === c.teacherId) || null);
        setCategory(cats.find(ca => ca.id === c.categoryId) || null);
        setSimilar(sim.filter(s => s.id !== c.id).slice(0, 5));
      });
    });
  }, [id, navigate]);

  if (!cls) return null;

  const clsProgress = progress[cls.id];
  const isFav = favorites.includes(cls.id);
  const hasProgress = clsProgress && !clsProgress.completed && clsProgress.watchedSec > 10;
  const teacherMap = new Map(teachers.map(t => [t.id, t]));
  const categoryMap = new Map(categories.map(c => [c.id, c]));

  const buttonLabel = hasProgress ? 'Продолжить' : clsProgress?.completed ? 'Пройти заново' : 'Начать';

  const handleShare = async () => {
    const url = `${window.location.origin}/class/${cls.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: cls.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Ссылка скопирована', 'success');
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Back button */}
      <div className="sticky top-0 z-30 bg-bg/95 backdrop-blur-md px-5 py-3">
        <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-2" aria-label="Назад">
          <ArrowLeft className="w-5 h-5 text-ink" />
        </button>
      </div>

      {/* Media */}
      <div className="px-5">
        <div className="relative aspect-video rounded-card overflow-hidden mb-4" style={{ background: cls.posterUrl }}>
          <Link to={`/play/${cls.id}`} className="absolute inset-0 flex items-center justify-center">
            <div className="w-[72px] h-[72px] rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <Play className="w-8 h-8 text-ink ml-1" fill="currentColor" />
            </div>
          </Link>
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="inline-flex items-center h-7 px-2.5 rounded-pill bg-black/40 text-white text-chip backdrop-blur-sm">
              Уровень {cls.level}
            </span>
            <span className="inline-flex items-center h-7 px-2.5 rounded-pill bg-black/40 text-white text-chip backdrop-blur-sm">
              {formatDurationShort(cls.durationSec)}
            </span>
            {cls.isNew && <Badge variant="new" />}
          </div>
        </div>

        {hasProgress && (
          <p className="text-body-sm text-ink-2 mb-2">
            Продолжить с {Math.floor((clsProgress?.lastPosition || 0) / 60)}:{String((clsProgress?.lastPosition || 0) % 60).padStart(2, '0')}
          </p>
        )}

        {/* Title & Meta */}
        <h1 className="text-h1 text-ink mb-2">{cls.title}</h1>
        <div className="flex items-center gap-3 mb-4">
          {teacher && (
            <Link to={`/search?q=${teacher.name}`} className="flex items-center gap-2">
              <Avatar name={teacher.name} size={32} color={teacher.avatarColor} />
              <span className="text-body-sm text-ink">{teacher.name}</span>
              <span className="text-chip text-ink-3">· {teacher.practiceCount} практик</span>
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mb-6">
          <PillButton variant="outline" size="sm" onClick={() => addToQueue(cls.id)}>В очередь</PillButton>
          <PillButton variant="outline" size="sm" onClick={() => toggleFavorite(cls.id)}>
            {isFav ? '♥ В избранном' : '♡ В избранное'}
          </PillButton>
          <PillButton variant="outline" size="sm" disabled>Скачать</PillButton>
          <IconButton label="Поделиться" size={40} onClick={handleShare}>
            <Share2 className="w-4 h-4 text-ink-2" />
          </IconButton>
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className={`text-body text-ink-2 ${expanded ? '' : 'line-clamp-3'}`}>
            {cls.description}
          </p>
          {cls.description && cls.description.length > 100 && (
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 mt-2 text-body-sm text-ink font-medium">
              {expanded ? 'Свернуть' : 'Читать далее'}
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Equipment */}
        {cls.equipment && cls.equipment.length > 0 && (
          <div className="mb-6">
            <p className="text-eyebrow text-ink-3 mb-2">ЧТО ПОНАДОБИТСЯ</p>
            <div className="flex flex-wrap gap-2">
              {cls.equipment.map(eq => (
                <span key={eq} className="inline-flex items-center h-8 px-3 rounded-pill bg-surface-2 text-body-sm text-ink-2">{eq}</span>
              ))}
            </div>
          </div>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <div className="mb-6">
            <h2 className="text-h2 text-ink mb-3">Похожие практики</h2>
            <div className="divide-y divide-line">
              {similar.map(s => (
                <ClassRow key={s.id} cls={s} teacher={teacherMap.get(s.teacherId)} categoryTitle={categoryMap.get(s.categoryId)?.title} />
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
            onClick={() => toggleFavorite(cls.id)}
            className="w-11 h-11 rounded-full border border-line flex items-center justify-center"
            aria-label="Избранное"
          >
            <Heart className={`w-5 h-5 ${isFav ? 'fill-live text-live' : 'text-ink-2'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
