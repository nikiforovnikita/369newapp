import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Settings, Heart, MoreHorizontal, Monitor } from 'lucide-react';
import { cn, Sheet, PillButton, ProgressBar } from '../components/ui';
import { repository } from '../lib/repository';
import { useAppStore } from '../store';
import { formatTime, formatDurationMin } from '../lib/format';
import type { ClassItem } from '../types';

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const saveProgress = useAppStore(s => s.saveProgress);
  const appendSession = useAppStore(s => s.appendSession);
  const progress = useAppStore(s => s.progress);
  const queue = useAppStore(s => s.queue);
  const showToast = useAppStore(s => s.showToast);
  const sessions = useAppStore(s => s.sessions);

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
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>();
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const startTime = useRef(Date.now());
  const watchedSeconds = useRef(0);
  const demoInterval = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!id) return;
    repository.getClass(id).then(c => {
      if (!c) { navigate('/'); return; }
      setCls(c);
      setDuration(c.durationSec);

      // Check for resume position
      const existingProgress = progress[c.id];
      if (existingProgress && !existingProgress.completed && existingProgress.watchedSec > 10 && existingProgress.watchedSec < c.durationSec * 0.95) {
        setShowResume(true);
      }
    });
  }, [id, navigate]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimeout.current) clearTimeout(controlsTimeout.current); };
  }, [playing, resetControlsTimer]);

  // Save progress debounced
  const savePosition = useCallback(() => {
    if (!cls || !videoRef.current) return;
    const pos = videoRef.current.currentTime;
    saveProgress({
      classId: cls.id,
      watchedSec: Math.round(pos),
      totalSec: cls.durationSec,
      completed: pos >= cls.durationSec * 0.95,
      lastPosition: Math.round(pos),
      updatedAt: new Date().toISOString(),
    });
  }, [cls, saveProgress]);

  const debouncedSave = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(savePosition, 5000);
  }, [savePosition]);

  // Demo mode - simulate playback when no video
  useEffect(() => {
    if (!demoMode || !cls) return;
    if (playing) {
      demoInterval.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 1;
          watchedSeconds.current += 1;
          if (next >= cls.durationSec * 0.95) {
            setCompleted(true);
            setPlaying(false);
            if (demoInterval.current) clearInterval(demoInterval.current);
            appendSession({
              id: `s-${Date.now()}`,
              classId: cls.id,
              startedAt: new Date(startTime.current).toISOString(),
              endedAt: new Date().toISOString(),
              watchedSec: Math.round(watchedSeconds.current),
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
            return cls.durationSec;
          }
          return next;
        });
      }, 1000);
    } else {
      if (demoInterval.current) clearInterval(demoInterval.current);
    }
    return () => { if (demoInterval.current) clearInterval(demoInterval.current); };
  }, [demoMode, playing, cls, appendSession, saveProgress]);

  // Time update (real video)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || demoMode) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      watchedSeconds.current += 1;
      debouncedSave();

      // Check completion
      if (video.currentTime >= video.duration * 0.95 && video.duration > 0) {
        setCompleted(true);
        setPlaying(false);
        if (cls) {
          appendSession({
            id: `s-${Date.now()}`,
            classId: cls.id,
            startedAt: new Date(startTime.current).toISOString(),
            endedAt: new Date().toISOString(),
            watchedSec: Math.round(watchedSeconds.current),
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
        }
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [cls, debouncedSave, appendSession, saveProgress, demoMode]);

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
          video.currentTime = Math.max(0, video.currentTime - 5);
          break;
        case 'ArrowRight':
          video.currentTime = Math.min(video.duration, video.currentTime + 5);
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
    if (demoMode) {
      setPlaying(!playing);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => { setDemoMode(true); setPlaying(true); });
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
      savePosition();
    }
  };

  const seek = (time: number) => {
    if (demoMode) {
      setCurrentTime(Math.max(0, Math.min(time, cls?.durationSec || 0)));
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
    savePosition();
  };

  const skipBack = () => seek(Math.max(0, currentTime - 15));
  const skipForward = () => seek(Math.min(duration, currentTime + 15));

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
    if (demoMode) {
      setPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.play().catch(() => { setDemoMode(true); setPlaying(true); });
    }
  };

  if (!cls) return null;

  // Screen off mode
  if (screenOff) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
        <p className="text-white/50 text-body-sm mb-8">Экран выключен</p>
        <button onClick={togglePlay} className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-8">
          {playing ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
        </button>
        <p className="text-white text-display">{formatTime(duration - currentTime)}</p>
        <button onClick={() => setScreenOff(false)} className="mt-8 text-white/50 text-body-sm underline">
          Вернуть экран
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black z-50" onClick={resetControlsTimer}>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        playsInline
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onError={() => { setVideoError(true); setDemoMode(true); setDuration(cls.durationSec); }}
      >
        <source src={cls.videoUrl} type="video/mp4" />
      </video>

      {/* Poster fallback - always show when not playing or at start */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: cls.posterUrl }}>
          <button onClick={togglePlay} className="w-[72px] h-[72px] rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
            <Play className="w-8 h-8 text-ink ml-1" fill="currentColor" />
          </button>
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
            <MoreHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Center play/pause */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button onClick={togglePlay} className="w-[72px] h-[72px] rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {playing ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />}
          </button>
        </div>

        {/* Tap zones for skip */}
        <button onClick={skipBack} className="absolute left-0 top-1/3 bottom-1/3 w-1/3" aria-label="Назад 15 секунд" />
        <button onClick={skipForward} className="absolute right-0 top-1/3 bottom-1/3 w-1/3" aria-label="Вперёд 15 секунд" />

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 safe-bottom">
          {/* Progress bar */}
          <div className="mb-4">
            <input
              type="range"
              min={0}
              max={duration || cls.durationSec || 100}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white text-body-sm">{formatTime(currentTime)}</span>

            <div className="flex items-center gap-3">
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
            </div>

            <span className="text-white text-body-sm">{formatTime(duration)}</span>
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
            <span className="text-white text-3xl">✓</span>
          </div>
          <h2 className="text-h1 text-white mb-2">Практика завершена</h2>
          <p className="text-body text-white/60 mb-8">{formatDurationMin(cls.durationSec)} практики</p>

          <div className="flex gap-6 mb-8">
            <div className="text-center">
              <p className="text-display text-white">{Math.round(sessions.filter(s => new Date(s.startedAt).toDateString() === new Date().toDateString()).reduce((sum, s) => sum + s.watchedSec, 0) / 60)}</p>
              <p className="text-chip text-white/60">мин сегодня</p>
            </div>
            <div className="text-center">
              <p className="text-display text-white">{sessions.filter(s => s.completed).length}</p>
              <p className="text-chip text-white/60">практик</p>
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
    </div>
  );
}
