import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Minimize, Monitor, Check } from 'lucide-react';
import { cn, Sheet, PillButton } from '../components/ui';
import { repository } from '../lib/repository';
import { useAppStore } from '../store';
import { formatTime, formatDurationMin } from '../lib/format';
import type { ClassItem } from '../types';

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const saveProgress = useAppStore(s => s.saveProgress);
  const appendSession = useAppStore(s => s.appendSession);
  const progress = useAppStore(s => s.progress);
  const queue = useAppStore(s => s.queue);
  const sessions = useAppStore(s => s.sessions);
  const showToast = useAppStore(s => s.showToast);

  const [cls, setCls] = useState<ClassItem | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showResume, setShowResume] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [screenOff, setScreenOff] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [skipIndicator, setSkipIndicator] = useState<{ direction: 'left' | 'right'; visible: boolean }>({ direction: 'left', visible: false });

  const startTimeRef = useRef(Date.now());
  const watchedSecondsRef = useRef(0);
  const lastSaveTimeRef = useRef(0);

  // Load class
  useEffect(() => {
    if (!id) return;

    const source = (location.state as any)?.source || 'deep-link';
    console.log('[analytics] play', { classId: id, source });

    repository.getClass(id).then(c => {
      if (!c) {
        navigate('/');
        return;
      }
      setCls(c);
      setDuration(c.durationSec);

      // Check for resume position
      const existingProgress = progress[c.id];
      if (existingProgress && !existingProgress.completed && existingProgress.watchedSec >= 10 && existingProgress.watchedSec < c.durationSec * 0.95) {
        setShowResume(true);
      }
    });
  }, [id, navigate, location.state, progress]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing && !showResume && !completed) setShowControls(false);
    }, 3000);
  }, [playing, showResume, completed]);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [playing, resetControlsTimer]);

  // Save progress
  const savePosition = useCallback(() => {
    if (!cls || !videoRef.current) return;
    const pos = videoRef.current.currentTime;
    const now = Date.now();

    // Debounce saves (5 seconds)
    if (now - lastSaveTimeRef.current < 5000) return;
    lastSaveTimeRef.current = now;

    try {
      saveProgress({
        classId: cls.id,
        watchedSec: Math.round(watchedSecondsRef.current),
        totalSec: cls.durationSec,
        completed: pos >= cls.durationSec * 0.95,
        lastPosition: Math.round(pos),
        updatedAt: new Date().toISOString(),
      });
    } catch {
      showToast('Не удалось сохранить прогресс', 'error');
    }
  }, [cls, saveProgress, showToast]);

  // Time update
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      watchedSecondsRef.current += 1;

      // Debounced save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(savePosition, 5000);

      // Check completion
      if (video.currentTime >= video.duration * 0.95 && video.duration > 0 && !completed) {
        setCompleted(true);
        setPlaying(false);
        console.log('[analytics] complete', { classId: cls?.id, positionSec: video.currentTime, durationSec: video.duration });

        // Save session
        if (cls) {
          try {
            appendSession({
              id: `s-${Date.now()}`,
              classId: cls.id,
              startedAt: new Date(startTimeRef.current).toISOString(),
              endedAt: new Date().toISOString(),
              watchedSec: Math.round(watchedSecondsRef.current),
              totalSec: cls.durationSec,
              completed: true,
            });
            saveProgress({
              classId: cls.id,
              watchedSec: cls.durationSec,
              totalSec: cls.durationSec,
              completed: true,
              lastPosition: 0,
              updatedAt: new Date().toISOString(),
            });
          } catch {
            showToast('Не удалось сохранить сессию', 'error');
          }
        }
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [cls, savePosition, appendSession, saveProgress, completed, showToast]);

  // Save on pause/unmount
  useEffect(() => {
    const handleVisibility = () => { if (document.hidden) savePosition(); };
    const handleBeforeUnload = () => savePosition();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      savePosition();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [savePosition]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, video.currentTime - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(video.duration, video.currentTime + 5));
          break;
        case 'ArrowUp':
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          setVolume(video.volume);
          break;
        case 'ArrowDown':
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          setVolume(video.volume);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          video.muted = !video.muted;
          setMuted(video.muted);
          break;
        case 'Escape':
          navigate(-1);
          break;
      }
      resetControlsTimer();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate, resetControlsTimer]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPlaying(true);
      console.log('[analytics] play', { classId: cls?.id, positionSec: video.currentTime, durationSec: video.duration });
    } else {
      video.pause();
      setPlaying(false);
      savePosition();
      console.log('[analytics] pause', { classId: cls?.id, positionSec: video.currentTime, durationSec: video.duration });
    }
  };

  const seek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
    console.log('[analytics] seek', { classId: cls?.id, positionSec: time, durationSec: video.duration });
    // Save after seek (400ms delay)
    setTimeout(savePosition, 400);
  };

  const skipBack = () => {
    seek(Math.max(0, currentTime - 15));
    setSkipIndicator({ direction: 'left', visible: true });
    setTimeout(() => setSkipIndicator({ direction: 'left', visible: false }), 500);
  };

  const skipForward = () => {
    seek(Math.min(duration, currentTime + 15));
    setSkipIndicator({ direction: 'right', visible: true });
    setTimeout(() => setSkipIndicator({ direction: 'right', visible: false }), 500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleResume = (resume: boolean) => {
    setShowResume(false);
    if (resume && cls) {
      const existingProgress = progress[cls.id];
      if (existingProgress) {
        seek(existingProgress.lastPosition);
      }
    }
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  const handleTapZone = (side: 'left' | 'right') => {
    if (side === 'left') {
      skipBack();
    } else {
      skipForward();
    }
  };

  if (!cls) return null;

  // Screen off mode
  if (screenOff) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50" onClick={() => setScreenOff(false)}>
        <button onClick={togglePlay} className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-8">
          {playing ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
        </button>
        <p className="text-white text-display">{formatTime(duration - currentTime)}</p>
        <p className="text-white/50 text-body-sm mt-4">Нажмите для возврата</p>
      </div>
    );
  }

  // Stats for completion overlay
  const todaySessions = sessions.filter(s => new Date(s.startedAt).toDateString() === new Date().toDateString());
  const todayMinutes = Math.round(todaySessions.reduce((sum, s) => sum + s.watchedSec, 0) / 60);
  const weekMinutes = Math.round(sessions.filter(s => Date.now() - new Date(s.startedAt).getTime() < 7 * 86400000).reduce((sum, s) => sum + s.watchedSec, 0) / 60);

  // Streak calculation
  const streakDays = (() => {
    const today = new Date();
    const days = new Set(sessions.map(s => new Date(s.startedAt).toDateString()));
    let streak = 0;
    let checkDate = today;
    while (days.has(checkDate.toDateString())) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    }
    return streak;
  })();

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black z-50" onClick={resetControlsTimer}>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        playsInline
        preload="metadata"
        poster={cls.posterUrl}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onError={() => setVideoError(true)}
      >
        <source src={cls.videoUrl} type="video/mp4" />
      </video>

      {/* Video error overlay */}
      {videoError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
          <p className="text-white text-h2 mb-4">Не удалось загрузить видео</p>
          <PillButton variant="outline" size="lg" onClick={() => { setVideoError(false); videoRef.current?.load(); }}>
            Повторить
          </PillButton>
        </div>
      )}

      {/* Controls overlay */}
      <div className={cn('absolute inset-0 transition-opacity duration-300', showControls ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
        {/* Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-4 safe-top">
          <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10" aria-label="Закрыть">
            <X className="w-5 h-5 text-white" />
          </button>
          <p className="text-white text-title text-center flex-1 mx-4 line-clamp-1">{cls.title}</p>
          <button onClick={() => setShowMenu(true)} className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10" aria-label="Меню">
            <span className="text-white text-h2">⋯</span>
          </button>
        </div>

        {/* Center play/pause */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button onClick={togglePlay} className="w-[72px] h-[72px] rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {playing ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />}
          </button>
        </div>

        {/* Tap zones for skip */}
        <button onClick={() => handleTapZone('left')} className="absolute left-0 top-1/3 bottom-1/3 w-1/3" aria-label="Назад 15 секунд" />
        <button onClick={() => handleTapZone('right')} className="absolute right-0 top-1/3 bottom-1/3 w-1/3" aria-label="Вперёд 15 секунд" />

        {/* Skip indicators */}
        {skipIndicator.visible && (
          <div className={cn('absolute top-1/2 -translate-y-1/2 text-white text-h1 font-bold animate-pulse', skipIndicator.direction === 'left' ? 'left-8' : 'right-8')}>
            {skipIndicator.direction === 'left' ? '−15' : '+15'}
          </div>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 safe-bottom">
          {/* Progress bar */}
          <div className="mb-4">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white text-chip">{formatTime(currentTime)}</span>

            <div className="flex items-center gap-2">
              <button onClick={skipBack} className="w-10 h-10 flex items-center justify-center" aria-label="Назад 15 сек">
                <SkipBack className="w-5 h-5 text-white" />
              </button>
              <button onClick={skipForward} className="w-10 h-10 flex items-center justify-center" aria-label="Вперёд 15 сек">
                <SkipForward className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted; }} className="w-10 h-10 flex items-center justify-center" aria-label="Звук">
                {muted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </button>
              <button onClick={() => setSpeed(speed >= 1.5 ? 0.5 : speed + 0.25)} className="w-10 h-10 flex items-center justify-center" aria-label="Скорость">
                <span className="text-white text-chip font-semibold">{speed}x</span>
              </button>
              <button onClick={toggleFullscreen} className="w-10 h-10 flex items-center justify-center" aria-label="Полный экран">
                <Maximize className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => setScreenOff(true)} className="w-10 h-10 flex items-center justify-center" aria-label="Экран выключен">
                <Monitor className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => setShowQueue(true)} className="w-10 h-10 flex items-center justify-center" aria-label="Очередь">
                <span className="text-white text-chip">≡</span>
              </button>
            </div>

            <span className="text-white text-chip">{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Resume sheet */}
      <Sheet open={showResume} onClose={() => handleResume(false)} title="Продолжить просмотр?">
        <p className="text-body text-ink-2 mb-4">
          Вы остановились на {progress[cls.id] ? formatTime(progress[cls.id].lastPosition) : '0:00'}. Продолжить с этой позиции?
        </p>
        <div className="flex gap-3">
          <PillButton variant="outline" size="lg" onClick={() => handleResume(false)} className="flex-1">Сначала</PillButton>
          <PillButton size="lg" onClick={() => handleResume(true)} className="flex-1">Продолжить</PillButton>
        </div>
      </Sheet>

      {/* Completion overlay */}
      {completed && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-h1 text-white mb-2">Практика завершена</h2>
          <p className="text-body text-white/60 mb-8">{formatDurationMin(cls.durationSec)} · {cls.type}</p>

          <div className="flex gap-6 mb-8">
            <div className="text-center">
              <p className="text-display text-white">{todaySessions.length}</p>
              <p className="text-chip text-white/60">практик сегодня</p>
            </div>
            <div className="text-center">
              <p className="text-display text-white">{weekMinutes}</p>
              <p className="text-chip text-white/60">минут за неделю</p>
            </div>
            <div className="text-center">
              <p className="text-display text-white">{streakDays}</p>
              <p className="text-chip text-white/60">дней серия</p>
            </div>
          </div>

          <div className="flex gap-3">
            {queue.length > 1 && (
              <PillButton size="lg" onClick={() => {
                const next = queue.find(q => q.id !== cls.id);
                if (next) navigate(`/play/${next.id}`);
              }}>
                Следующая из очереди
              </PillButton>
            )}
            <PillButton variant="outline" size="lg" onClick={() => navigate('/')}>Готово</PillButton>
          </div>
        </div>
      )}

      {/* Menu sheet */}
      <Sheet open={showMenu} onClose={() => setShowMenu(false)} title="Настройки">
        <div className="space-y-4">
          <div>
            <p className="text-eyebrow text-ink-3 mb-2">СКОРОСТЬ</p>
            <div className="flex gap-2">
              {[0.5, 0.75, 1, 1.25, 1.5].map(s => (
                <button key={s} onClick={() => { setSpeed(s); if (videoRef.current) videoRef.current.playbackRate = s; }} className={cn('h-10 px-4 rounded-pill text-chip font-medium border', speed === s ? 'bg-ink text-white border-ink' : 'border-line text-ink-2')}>
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </Sheet>

      {/* Queue sheet */}
      <Sheet open={showQueue} onClose={() => setShowQueue(false)} title="Очередь">
        <div className="space-y-2">
          {queue.length === 0 ? (
            <p className="text-body text-ink-2 text-center py-8">Очередь пуста</p>
          ) : (
            queue.map((item, i) => (
              <Link
                key={item.id}
                to={`/play/${item.id}`}
                onClick={() => setShowQueue(false)}
                className={cn('flex items-center gap-3 p-3 rounded-card', item.id === cls.id ? 'bg-surface-2 border border-ink' : 'hover:bg-surface-2')}
              >
                <span className="text-chip text-ink-3 w-6">{i + 1}</span>
                <p className="text-body text-ink flex-1 line-clamp-1">
                  {item.id === cls.id ? cls.title : `Практика ${item.id}`}
                </p>
                {item.id === cls.id && <span className="text-chip text-ink font-medium">Сейчас</span>}
              </Link>
            ))
          )}
        </div>
      </Sheet>
    </div>
  );
}
