import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { computeTransform, transformToCSS } from './coverflow.math';
import { useCoverFlow } from './useCoverFlow';
import { CoverCard, type CoverFlowItem } from './CoverCard';
import { CarouselDock } from './CarouselDock';
import { AmbientBackdrop } from './AmbientBackdrop';
import { cn } from './ui';

interface CoverFlowProps {
  items: CoverFlowItem[];
  className?: string;
  progressMap?: Record<string, number>; // classId -> progress 0-1
}

/**
 * 3D CoverFlow carousel with glassmorphism cards.
 * Features:
 * - Center card larger, neighbors rotated and pushed back
 * - Glass surfaces with blur, highlights, and edges
 * - Ambient backdrop that changes color with active card
 * - Drag, keyboard, and wheel navigation
 * - Accessible: role="region", aria-roledescription="carousel"
 */
export function CoverFlow({ items, className, progressMap }: CoverFlowProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const {
    activeIndex,
    effectiveIndex,
    isDragging,
    goNext,
    goPrev,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown,
    handleWheel,
  } = useCoverFlow({
    totalItems: items.length,
    initialIndex: 0,
  });

  // Measure container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        setIsMobile(window.innerWidth < 768);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Wheel handler
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => handleWheel(e);
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [handleWheel]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-body text-ink-2">
        Нет элементов для отображения
      </div>
    );
  }

  const activeItem = items[activeIndex];
  const cardWidth = isMobile ? 240 : 260;

  // Visible range: 2 cards on each side
  const visibleRange = 2;
  const visibleItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => Math.abs(index - activeIndex) <= visibleRange);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Карусель практик"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Ambient backdrop */}
      <AmbientBackdrop palette={activeItem.palette} className="absolute inset-0" />

      {/* Dark overlay for light theme */}
      <div className="absolute inset-0 bg-[#14140F] rounded-[28px]" />

      {/* Carousel container */}
      <div
        className="relative coverflow-container flex items-center justify-center"
        style={{ height: '400px' }}
        onPointerDown={(e) => handlePointerDown(e, containerWidth)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {visibleItems.map(({ item, index }) => {
          const d = index - effectiveIndex;
          const transform = computeTransform(d, cardWidth, isMobile);
          const isActive = Math.abs(d) < 0.5;
          const progress = progressMap?.[item.id];

          return (
            <CoverCard
              key={item.id}
              item={item}
              isActive={isActive}
              progress={progress}
              onClick={() => {
                if (isActive) {
                  navigate(item.href);
                } else {
                  // Navigate to this card
                  const { goTo } = useCoverFlow({ totalItems: items.length });
                  // Actually just set active index via the hook
                }
              }}
              style={{
                transform: transformToCSS(transform),
                opacity: transform.opacity,
                zIndex: transform.zIndex,
                filter: transform.blur > 0 ? `blur(${transform.blur}px)` : undefined,
                left: '50%',
                top: '50%',
                marginLeft: `-${cardWidth / 2}px`,
                marginTop: '-170px',
              }}
            />
          );
        })}
      </div>

      {/* Control dock */}
      <div className="relative px-4 pb-4">
        <CarouselDock
          item={activeItem}
          onPrev={goPrev}
          onNext={goNext}
        />
      </div>
    </div>
  );
}
