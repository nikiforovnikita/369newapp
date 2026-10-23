import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Pause, Heart, MoreHorizontal } from 'lucide-react';
import { cn } from './ui';
import { GlassSurface } from './GlassSurface';
import type { CoverFlowItem } from './CoverCard';

interface CarouselDockProps {
  item: CoverFlowItem;
  isPlaying?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay?: () => void;
  className?: string;
}

/**
 * Control dock for carousel: navigation, play/pause, favorites.
 * Glass capsule with dark mini-capsule showing current item info.
 */
export function CarouselDock({ item, isPlaying, onPrev, onNext, onTogglePlay, className }: CarouselDockProps) {
  const navigate = useNavigate();

  return (
    <GlassSurface
      strength="strong"
      radius="32px"
      className={cn('flex items-center gap-3 px-4 h-16 animate-fade-in-up', className)}
      style={{ animationDelay: '120ms' }}
    >
      {/* Left: navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Предыдущая"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {onTogglePlay && (
          <button
            onClick={onTogglePlay}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white text-ink hover:bg-white/90 transition-colors"
            aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
        )}

        <button
          onClick={onNext}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Следующая"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Center: current item info */}
      <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-[20px] bg-[rgba(20,20,15,.55)] backdrop-blur-md min-w-0">
        <div
          className="w-10 h-10 rounded-[10px] shrink-0"
          style={{ background: item.posterUrl }}
          role="img"
          aria-label={item.title}
        />
        <div className="flex-1 min-w-0">
          <p className="text-body-sm text-white font-medium line-clamp-1">{item.title}</p>
          {item.subtitle && (
            <p className="text-chip text-white/60 line-clamp-1">{item.subtitle}</p>
          )}
        </div>
        <button
          onClick={() => navigate(item.href)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0"
          aria-label="Подробнее"
        >
          <MoreHorizontal className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        <button
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="В избранное"
        >
          <Heart className="w-5 h-5 text-white" />
        </button>
      </div>
    </GlassSurface>
  );
}
