import React, { useRef, useState, useEffect, useCallback, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Search, X, ChevronLeft, ChevronRight, Bell, MoreHorizontal, Play, Pause, Heart, Bookmark, GripVertical, Check } from 'lucide-react';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// PillButton
interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  as?: 'button' | 'a';
  href?: string;
}

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ variant = 'solid', size = 'md', loading, className, children, as = 'button', href, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-semibold rounded-pill transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
    const variants = {
      solid: 'bg-ink text-white hover:bg-ink/90',
      outline: 'border border-line-strong text-ink hover:bg-surface-2',
      ghost: 'text-ink-2 hover:text-ink hover:bg-surface-2',
    };
    const sizes = {
      sm: 'h-9 px-4 text-chip',
      md: 'h-11 px-5 text-body-sm',
      lg: 'h-[52px] px-6 text-body',
    };

    const classes = cn(base, variants[variant], sizes[size], className);

    if (as === 'a') {
      return <a href={href} className={classes}>{children}</a>;
    }

    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {loading ? <span className="animate-pulse">...</span> : children}
      </button>
    );
  }
);

// IconButton
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 32 | 40 | 44;
  label: string;
}

export function IconButton({ size = 40, label, className, children, ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-colors hover:bg-surface-2 active:scale-95',
        size === 32 && 'w-8 h-8',
        size === 40 && 'w-10 h-10',
        size === 44 && 'w-11 h-11',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Chip
interface ChipProps {
  children: React.ReactNode;
  variant?: 'filter' | 'info';
  selected?: boolean;
  onClick?: () => void;
}

export function Chip({ children, variant = 'filter', selected, onClick }: ChipProps) {
  if (variant === 'info') {
    return (
      <span className="inline-flex items-center h-7 px-3 rounded-pill bg-chip-solid text-white text-chip whitespace-nowrap">
        {children}
      </span>
    );
  }
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center h-12 px-4 rounded-pill text-chip whitespace-nowrap transition-all border',
        selected
          ? 'bg-ink text-white border-ink'
          : 'bg-transparent text-ink-2 border-line hover:border-line-strong'
      )}
    >
      {children}
    </button>
  );
}

// ChipRow
interface ChipRowProps {
  children: React.ReactNode;
  className?: string;
}

export function ChipRow({ children, className }: ChipRowProps) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto scrollbar-hide py-1 relative', className)}>
      <div className="flex gap-2 px-5 -mx-5">
        {children}
      </div>
      {/* Fade masks on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-bg to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-5 bg-gradient-to-l from-bg to-transparent pointer-events-none" />
    </div>
  );
}

// SearchField
interface SearchFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onClick?: () => void;
}

export function SearchField({ value, onChange, placeholder = 'Поиск практик...', autoFocus, onClick }: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  return (
    <div className="relative" onClick={onClick}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-3" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-14 pl-12 pr-12 rounded-[28px] bg-surface-2 text-body placeholder:text-ink-3 outline-none focus:ring-2 focus:ring-ink/20"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-line-strong"
          aria-label="Очистить"
        >
          <X className="w-3.5 h-3.5 text-ink-2" />
        </button>
      )}
    </div>
  );
}

// SectionHeader
interface SectionHeaderProps {
  title: string;
  action?: { label: string; onClick: () => void };
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-h2 text-ink">{title}</h2>
      {action && (
        <button onClick={action.onClick} className="text-body-sm text-ink-2 hover:text-ink font-medium">
          {action.label}
        </button>
      )}
    </div>
  );
}

// Carousel
interface CarouselProps {
  children: React.ReactNode;
  className?: string;
}

export function Carousel({ children, className }: CarouselProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={cn('flex gap-3 overflow-x-auto scrollbar-hide scroll-snap-x pb-2 -mx-5 px-5', className)}
    >
      {children}
    </div>
  );
}

// Badge
export function Badge({ variant, count }: { variant: 'new' | 'live'; count?: number }) {
  if (variant === 'new') {
    return (
      <span className="inline-flex items-center h-6 px-2.5 rounded-pill bg-white text-ink text-chip font-semibold shadow-sm">
        New
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-pill bg-live text-white text-chip font-semibold">
      <span className="w-2 h-2 rounded-full bg-white animate-pulse-live" />
      LIVE
    </span>
  );
}

// Skeleton
export function Skeleton({ variant = 'card', className }: { variant?: 'card' | 'row' | 'hero' | 'text'; className?: string }) {
  const shapes = {
    card: 'aspect-[4/5] rounded-card',
    row: 'w-24 h-24 rounded-row',
    hero: 'aspect-[2/1] rounded-card',
    text: 'h-5 rounded-sm',
  };
  return (
    <div className={cn('relative overflow-hidden bg-surface-2', shapes[variant], className)}>
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}

// EmptyState
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="text-4xl mb-4">🧘</div>
      <h3 className="text-title text-ink mb-2">{title}</h3>
      {description && <p className="text-body-sm text-ink-2 mb-6">{description}</p>}
      {action}
    </div>
  );
}

// Toast
export function ToastContainer({ toasts, onRemove }: { toasts: { id: string; message: string; type: string }[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none" role="status">
      {toasts.map(t => (
        <div
          key={t.id}
          className="pointer-events-auto px-4 py-3 rounded-card bg-ink text-white text-body-sm shadow-lg animate-fade-in-up"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// Sheet (Bottom Sheet)
interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Sheet({ open, onClose, children, title }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [startY, setStartY] = useState(0);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [open, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) setDragY(diff);
  };

  const handleTouchEnd = () => {
    if (dragY > 80) onClose();
    setDragY(0);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-fade-in-up"
        style={{ transform: dragY > 0 ? `translateY(${dragY}px)` : undefined }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sticky top-0 bg-white pt-3 pb-2 px-5 border-b border-line">
          <div className="w-10 h-1 rounded-full bg-line-strong mx-auto mb-3" />
          {title && <h3 className="text-title text-ink">{title}</h3>}
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

// Avatar
export function Avatar({ name, size = 44, color = '#E8B4B8' }: { name: string; size?: 32 | 44 | 64; color?: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}

// ProgressBar
export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn('h-[3px] bg-line rounded-full overflow-hidden', className)}>
      <div className="h-full bg-ink rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

// Tabs
interface TabsProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-line">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative px-4 py-3 text-body-sm font-medium transition-colors',
            active === tab.id ? 'text-ink' : 'text-ink-3'
          )}
        >
          {tab.label}
          {active === tab.id && (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-ink rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

// Switch
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <span className="text-body text-ink">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'w-12 h-7 rounded-full transition-colors relative',
          checked ? 'bg-ink' : 'bg-line-strong'
        )}
      >
        <span className={cn(
          'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        )} />
      </button>
    </label>
  );
}
