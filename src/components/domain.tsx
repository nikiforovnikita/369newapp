import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, MoreHorizontal, Heart, Play, ChevronRight } from 'lucide-react';
import { cn, Badge, ProgressBar, Avatar } from './ui';
import { formatDurationShort } from '../lib/format';
import type { ClassItem, Program, Collection, Teacher } from '../types';
import { useAppStore } from '../store';

// ProgramCard
export function ProgramCard({ program, teacher }: { program: Program; teacher?: Teacher }) {
  const progress = useAppStore(s => s.progress);
  const classProgress = program.classIds.filter(id => progress[id]?.completed).length;

  return (
    <Link to={`/program/${program.id}`} className="block w-[160px] shrink-0 scroll-snap-start">
      <div className="relative aspect-[4/5] rounded-card overflow-hidden mb-2" style={{ background: program.coverUrl }}>
        {program.isNew && (
          <div className="absolute top-2 left-2">
            <Badge variant="new" />
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <span className="inline-flex items-center h-6 px-2 rounded-pill bg-black/50 text-white text-chip">
            {program.classIds.length} классов
          </span>
        </div>
      </div>
      <p className="text-eyebrow text-ink-3 mb-0.5">
        {program.level === 1 ? 'Уровень 1' : program.level === 2 ? 'Уровень 2' : 'Уровень 3'}
      </p>
      <h3 className="text-title text-ink line-clamp-2">{program.title}</h3>
      {teacher && <p className="text-body-sm text-ink-2 truncate">{teacher.name}</p>}
    </Link>
  );
}

// CollectionCard
export function CollectionCard({ collection }: { collection: Collection }) {
  const [saved, setSaved] = useState(false);

  return (
    <Link to={`/collection/${collection.id}`} className="block w-[160px] shrink-0 scroll-snap-start">
      <div className="relative aspect-square rounded-card overflow-hidden mb-2" style={{ background: collection.coverUrl }}>
        {collection.isNew && (
          <div className="absolute top-2 left-2">
            <Badge variant="new" />
          </div>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSaved(!saved); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center"
          aria-label="Сохранить"
        >
          <Bookmark className={cn('w-4 h-4', saved ? 'fill-ink text-ink' : 'text-ink-2')} />
        </button>
      </div>
      <h3 className="text-title text-ink line-clamp-2">{collection.title}</h3>
      <p className="text-body-sm text-ink-2">{collection.items.length} практик</p>
    </Link>
  );
}

// HeroCard
export function HeroCard({ cls, teacher, categoryTitle }: { cls: ClassItem; teacher?: Teacher; categoryTitle?: string }) {
  return (
    <Link to={`/class/${cls.id}`} className="block">
      <div className="relative aspect-[2/1] rounded-card overflow-hidden mb-3" style={{ background: cls.posterUrl }}>
        {cls.isNew && (
          <div className="absolute top-3 left-3">
            <Badge variant="new" />
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <h3 className="text-h2 text-white drop-shadow-md">{cls.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center h-6 px-2 rounded-pill bg-white/20 text-white text-chip backdrop-blur-sm">
                Уровень {cls.level}
              </span>
              <span className="inline-flex items-center h-6 px-2 rounded-pill bg-white/20 text-white text-chip backdrop-blur-sm">
                {formatDurationShort(cls.durationSec)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {teacher && <Avatar name={teacher.name} size={32} color={teacher.avatarColor} />}
        <div>
          <p className="text-body-sm text-ink">{teacher?.name}</p>
          {categoryTitle && <p className="text-chip text-ink-3">{categoryTitle}</p>}
        </div>
      </div>
    </Link>
  );
}

// ClassRow
export function ClassRow({ cls, teacher, categoryTitle, onMore }: { cls: ClassItem; teacher?: Teacher; categoryTitle?: string; onMore?: () => void }) {
  return (
    <Link to={`/class/${cls.id}`} className="flex items-center gap-3 py-3 group">
      <div className="w-24 h-24 rounded-row overflow-hidden shrink-0 relative" style={{ background: cls.posterUrl }}>
        {cls.isNew && (
          <div className="absolute top-1 left-1">
            <Badge variant="new" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-title text-ink line-clamp-2 group-hover:text-ink-2 transition-colors">{cls.title}</h3>
        <p className="text-body-sm text-ink-2 mt-0.5">
          {teacher?.name}{categoryTitle && ` · ${categoryTitle}`}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-chip text-ink-3">Уровень {cls.level}</span>
          <span className="text-chip text-ink-3">·</span>
          <span className="text-chip text-ink-3">{formatDurationShort(cls.durationSec)}</span>
        </div>
      </div>
      {onMore && (
        <button onClick={(e) => { e.preventDefault(); onMore(); }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-2">
          <MoreHorizontal className="w-5 h-5 text-ink-3" />
        </button>
      )}
    </Link>
  );
}

// ContinueCard
export function ContinueCard({ cls, progress }: { cls: ClassItem; progress: { watchedSec: number; totalSec: number } }) {
  const remaining = Math.max(0, Math.round((progress.totalSec - progress.watchedSec) / 60));

  return (
    <Link to={`/play/${cls.id}`} className="block w-[280px] shrink-0 scroll-snap-start">
      <div className="relative aspect-video rounded-card overflow-hidden mb-2" style={{ background: cls.posterUrl }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-ink ml-0.5" fill="currentColor" />
          </div>
        </div>
        <ProgressBar value={progress.watchedSec} max={progress.totalSec} className="absolute bottom-0 left-0 right-0 h-1" />
      </div>
      <p className="text-body-sm text-ink-2">Осталось {remaining} мин</p>
      <h3 className="text-title text-ink line-clamp-1">{cls.title}</h3>
    </Link>
  );
}

// LiveBanner
export function LiveBanner({ event, isLive }: { event: { id: string; title: string; coverUrl: string; startsAt: string; durationMin: number }; isLive: boolean }) {
  const minutesUntil = Math.max(0, Math.round((new Date(event.startsAt).getTime() - Date.now()) / 60000));

  return (
    <Link to={`/live/${event.id}`} className="flex items-center gap-3 p-3 rounded-card bg-surface-2 mb-4">
      <div className="w-[120px] h-20 rounded-media overflow-hidden shrink-0 relative" style={{ background: event.coverUrl }}>
        {isLive && (
          <div className="absolute top-1.5 left-1.5">
            <Badge variant="live" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm text-ink-2">
          {isLive ? 'Сейчас в эфире' : `Через ${minutesUntil} мин`}
        </p>
        <h3 className="text-title text-ink line-clamp-1">{event.title}</h3>
        <span className="inline-flex items-center mt-1 h-7 px-3 rounded-pill bg-ink text-white text-chip font-medium">
          Присоединиться
        </span>
      </div>
    </Link>
  );
}
