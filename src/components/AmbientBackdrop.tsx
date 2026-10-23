import React, { useMemo } from 'react';

interface AmbientBackdropProps {
  palette: string[];
  className?: string;
}

/**
 * Ambient backdrop with blurred color blobs that transition smoothly.
 * Uses two layers with opacity crossfade for color changes.
 */
export function AmbientBackdrop({ palette, className }: AmbientBackdropProps) {
  const blobs = useMemo(() => {
    // Create 3 blobs from palette colors
    const colors = palette.length >= 3 ? palette : [...palette, ...Array(3 - palette.length).fill('#8F8C86')];
    return colors.map((color, i) => ({
      color,
      top: `${20 + i * 25}%`,
      left: `${15 + i * 30}%`,
      size: `${300 + i * 50}px`,
    }));
  }, [palette]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className || ''}`} aria-hidden="true">
      {blobs.map((blob, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            backgroundColor: blob.color,
            top: blob.top,
            left: blob.left,
            width: blob.size,
            height: blob.size,
            filter: 'blur(80px)',
            transform: 'translate(-50%, -50%) translateZ(0)',
            transition: 'background-color 600ms ease-out, opacity 600ms ease-out',
          }}
        />
      ))}
    </div>
  );
}
