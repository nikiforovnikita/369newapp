import React from 'react';
import { cn } from './ui';
import { GlassSurface } from './GlassSurface';
import { formatDurationShort } from '../lib/format';

export interface CoverFlowItem {
  id: string;
  title: string;
  subtitle?: string;
  posterUrl: string;
  palette: string[];
  kind: 'class' | 'program';
  href: string;
  isNew?: boolean;
  level?: number;
  durationSec?: number;
  classCount?: number;
}

interface CoverCardProps {
  item: CoverFlowItem;
  isActive: boolean;
  progress?: number; // 0-1
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Cover card for practices/programs in 3D carousel.
 * Center card shows full info with glass overlay.
 * Side cards show only poster.
 */
export function CoverCard({ item, isActive, progress, onClick, style, className }: CoverCardProps) {
  return (
    <div
      className={cn('coverflow-card absolute cursor-pointer', className)}
      style={{
        ...style,
        width: '260px',
        height: '340px',
      }}
      onClick={onClick}
      role="group"
      aria-roledescription="slide"
      aria-label={isActive ? `${item.title}` : undefined}
      aria-hidden={!isActive}
    >
      {/* Poster */}
      <div
        className="absolute inset-0 rounded-[20px] overflow-hidden"
        style={{ background: item.posterUrl }}
        role="img"
        aria-label={item.title}
      >
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Progress bar */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {item.isNew && (
            <span className="inline-flex items-center h-6 px-2.5 rounded-pill bg-white text-ink text-chip font-semibold shadow-sm">
              New
            </span>
          )}
          {item.level && (
            <GlassSurface strength="soft" radius="999px" className="px-2.5 py-1">
              <span className="text-chip text-white font-medium">Ур. {item.level}</span>
            </GlassSurface>
          )}
          {item.durationSec && (
            <GlassSurface strength="soft" radius="999px" className="px-2.5 py-1">
              <span className="text-chip text-white font-medium">{formatDurationShort(item.durationSec)}</span>
            </GlassSurface>
          )}
          {item.classCount !== undefined && (
            <GlassSurface strength="soft" radius="999px" className="px-2.5 py-1">
              <span className="text-chip text-white font-medium">{item.classCount} классов</span>
            </GlassSurface>
          )}
        </div>
      </div>

      {/* Glass info panel (only for active card) */}
      {isActive && (
        <GlassSurface
          strength="default"
          radius="0 0 20px 20px"
          className="absolute bottom-0 left-0 right-0 h-[38%] flex flex-col justify-end p-4"
        >
          <h3 className="text-title text-white font-semibold line-clamp-2 mb-1 drop-shadow-md">
            {item.title}
          </h3>
          {item.subtitle && (
            <p className="text-body-sm text-white/80 line-clamp-1 drop-shadow-sm">
              {item.subtitle}
            </p>
          )}
        </GlassSurface>
      )}
    </div>
  );
}
