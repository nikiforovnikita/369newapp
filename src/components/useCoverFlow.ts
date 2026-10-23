import { useState, useRef, useCallback, useEffect } from 'react';
import { snapIndex } from './coverflow.math';

interface UseCoverFlowOptions {
  totalItems: number;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

export function useCoverFlow({ totalItems, initialIndex = 0, onIndexChange }: UseCoverFlowOptions) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<number | null>(null);
  const dragStartXRef = useRef(0);
  const lastXRef = useRef(0);
  const velocityRef = useRef(0);
  const containerWidthRef = useRef(0);

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(totalItems - 1, index));
    setActiveIndex(clamped);
    onIndexChange?.(clamped);
  }, [totalItems, onIndexChange]);

  const goNext = useCallback(() => {
    goTo(activeIndex + 1);
  }, [activeIndex, goTo]);

  const goPrev = useCallback(() => {
    goTo(activeIndex - 1);
  }, [activeIndex, goTo]);

  const handlePointerDown = useCallback((e: React.PointerEvent, containerWidth: number) => {
    dragStartRef.current = activeIndex;
    dragStartXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    velocityRef.current = 0;
    containerWidthRef.current = containerWidth;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [activeIndex]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragStartRef.current === null) return;

    const deltaX = e.clientX - dragStartXRef.current;
    const cardWidth = containerWidthRef.current / 3;
    const offset = -deltaX / cardWidth;

    // Calculate velocity
    const currentVelocity = e.clientX - lastXRef.current;
    velocityRef.current = currentVelocity / cardWidth;
    lastXRef.current = e.clientX;

    setDragOffset(offset);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (dragStartRef.current === null) return;

    const newIndex = snapIndex(dragStartRef.current + dragOffset, velocityRef.current);
    goTo(newIndex);

    dragStartRef.current = null;
    setDragOffset(0);
    setIsDragging(false);
    velocityRef.current = 0;
  }, [dragOffset, goTo]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  }, [goPrev, goNext]);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      const delta = e.deltaX || e.deltaY;
      if (Math.abs(delta) > 50) {
        if (delta > 0) goNext();
        else goPrev();
      }
    }
  }, [goNext, goPrev]);

  // Get effective index during drag
  const effectiveIndex = activeIndex + dragOffset;

  return {
    activeIndex,
    effectiveIndex,
    isDragging,
    goTo,
    goNext,
    goPrev,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown,
    handleWheel,
  };
}
