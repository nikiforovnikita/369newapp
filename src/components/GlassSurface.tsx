import React from 'react';
import { cn } from './ui';

interface GlassSurfaceProps {
  strength?: 'soft' | 'default' | 'strong';
  radius?: string;
  as?: 'div' | 'button' | 'a';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function GlassSurface({
  strength = 'default',
  radius = '20px',
  as: Component = 'div',
  className,
  style,
  children,
  href,
  onClick,
}: GlassSurfaceProps) {
  const strengthClass = strength === 'strong' ? 'glass-strong' : strength === 'soft' ? 'glass-soft' : 'glass';

  const props: any = {
    className: cn('glass relative', strengthClass, className),
    style: { borderRadius: radius, ...style },
    onClick,
  };

  if (Component === 'a' && href) {
    props.href = href;
  }

  return <Component {...props}>{children}</Component>;
}
