/**
 * Pure math functions for 3D CoverFlow carousel.
 * All functions take `d = index - activeIndex` (fractional during drag).
 */

export interface CoverFlowTransform {
  rotateY: number;
  scale: number;
  translateX: number;
  translateZ: number;
  opacity: number;
  zIndex: number;
  blur: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute rotation around Y axis.
 * Cards to the left rotate positively (towards viewer), right negatively.
 * Clamped to ±38° for neighbors, 0 for center.
 */
export function rotateY(d: number): number {
  const clamped = clamp(-d, -1, 1);
  return clamped * 38;
}

/**
 * Scale factor: center = 1, neighbors ~0.82, further cards smaller.
 */
export function scale(d: number): number {
  const absD = Math.abs(d);
  return 1 - 0.18 * Math.min(absD, 2.5) / 2.5;
}

/**
 * Horizontal translation. Compressed for |d| > 2 to prevent overflow.
 */
export function translateX(d: number, cardWidth: number): number {
  const compression = Math.abs(d) > 2 ? 0.5 : 1;
  return d * 0.62 * cardWidth * compression;
}

/**
 * Depth translation: center = 0, pushed back by 120px per step.
 */
export function translateZ(d: number): number {
  return -Math.abs(d) * 120;
}

/**
 * Opacity: center = 1, fades to 0.34 at |d| = 3.
 */
export function opacity(d: number): number {
  const absD = Math.abs(d);
  return 1 - 0.22 * Math.min(absD, 3);
}

/**
 * Z-index: center = 100, decreases by 10 per step.
 */
export function zIndex(d: number): number {
  return Math.round(100 - Math.abs(d) * 10);
}

/**
 * Blur amount for non-center cards (mobile capped at 2px).
 */
export function blur(d: number, isMobile: boolean = false): number {
  const b = Math.min(Math.abs(d), 2) * 1.5;
  return isMobile ? Math.min(b, 2) : b;
}

/**
 * Compute full transform for a card at offset d from active index.
 */
export function computeTransform(d: number, cardWidth: number, isMobile: boolean = false): CoverFlowTransform {
  return {
    rotateY: rotateY(d),
    scale: scale(d),
    translateX: translateX(d, cardWidth),
    translateZ: translateZ(d),
    opacity: opacity(d),
    zIndex: zIndex(d),
    blur: blur(d, isMobile),
  };
}

/**
 * Convert transform object to CSS transform string.
 */
export function transformToCSS(t: CoverFlowTransform): string {
  return `translateX(${t.translateX}px) translateZ(${t.translateZ}px) rotateY(${t.rotateY}deg) scale(${t.scale})`;
}

/**
 * Snap index from fractional position, considering velocity.
 */
export function snapIndex(fractional: number, velocity: number = 0): number {
  const threshold = 0.5;
  const velocityBoost = velocity * 0.3;
  const target = fractional + velocityBoost;
  return Math.round(target);
}
