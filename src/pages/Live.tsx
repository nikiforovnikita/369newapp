import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Bell, BellRing, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { PillButton, ChipRow, Chip, Badge, IconButton, Sheet } from '../components/ui';
import { repository } from '../lib/repository';
import { useAppStore } from '../store';
import { getLiveStatus, formatDateRu, generateICS } from '../lib/format';
import { format } from 'date-fns';
import type { LiveEvent, Category, Teacher } from '../types';

export function LivePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date') || '';
  const reminders = useAppStore(s => s.reminders);
  const setReminder = useAppStore(s => s.setReminder);
  const removeReminder = useAppStore(s => s.removeReminder);

  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    Promise.all([
      repository.getLiveEvents(),
      repository.getTeachers(),
      repository.getCategories(),
    ]).then(([e, t, c]) => {
      setEvents(e);
      setTeachers(t);
      setCategories(c);
    });
  }, []);

  const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Generate 7 days
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      result.push(d);
    }
    return result;
  }, []);

  const selectedDate = dateParam ? new Date(dateParam) : days[0];

  // Filter events by date
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const eventDate = new Date(e.startsAt);
      return format(eventDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    }).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [events, selectedDate]);

  // Currently live
  const liveNow = useMemo(() => {
    return events.find(e => getLiveStatus(e) === 'live');
  }, [events]);

  const handleCalendar = (event: LiveEvent) => {
    const ics = generateICS(event);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sangha-${event.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="sticky top-[88px] z-30 bg-bg/95 backdrop-blur-md px-5 pt-3 pb-2">
        <h1 className="text-h1 text-ink mb-3">Расписание эфиров</h1>

        {/* Day selector */}
        <ChipRow>
          {days.map(d => {
            const isSelected = format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            return (
              <Chip key={d.toISOString()} variant="filter" selected={isSelected} onClick={() => setSearchParams({ date: format(d, 'yyyy-MM-dd') })}>
                {format(d, 'EEE, d MMM', { locale: undefined }).replace(/^\w/, c => c.toUpperCase())}
              </Chip>
            );
          })}
        </ChipRow>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Live now */}
        {liveNow && (
          <Link to={`/live/${liveNow.id}`} className="block">
            <div className="relative aspect-video rounded-card overflow-hidden mb-2" style={{ background: `linear-gradient(135deg, #2d1b1b, #4a2020)` }}>
              <div className="absolute top-3 left-3">
                <Badge variant="live" />
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-h2 text-white">{liveNow.title}</h3>
                <p className="text-body-sm text-white/70">{teacherMap.get(liveNow.hostId)?.name}</p>
              </div>
            </div>
          </Link>
        )}

        {/* Events list */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-body text-ink-2">Нет эфиров на этот день</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map(event => {
              const status = getLiveStatus(event);
              const isReminder = reminders.includes(event.id);
              const startTime = format(new Date(event.startsAt), 'HH:mm');

              return (
                <div key={event.id} className={`flex items-center gap-3 ${status === 'ended' ? 'opacity-55' : ''}`}>
                  <div className="w-[60px] text-center shrink-0">
                    <p className="text-title text-ink">{startTime}</p>
                    <p className="text-chip text-ink-3">{event.durationMin} мин</p>
                  </div>
                  <Link to={`/live/${event.id}`} className={`flex-1 flex items-center gap-3 p-3 rounded-card border ${status === 'live' ? 'border-live border-l-[3px]' : 'border-line'} hover:border-line-strong transition-colors`}>
                    <div className="w-16 h-16 rounded-media overflow-hidden shrink-0" style={{ background: event.coverUrl }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-title text-ink line-clamp-1">{event.title}</p>
                      <p className="text-body-sm text-ink-2">{teacherMap.get(event.hostId)?.name}</p>
                      {status === 'live' && <Badge variant="live" />}
                      {status === 'soon' && <span className="text-chip text-live">Скоро</span>}
                    </div>
                  </Link>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => isReminder ? removeReminder(event.id) : setReminder(event.id)}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-2"
                      aria-label="Напоминание"
                    >
                      {isReminder ? <BellRing className="w-5 h-5 text-ink" /> : <Bell className="w-5 h-5 text-ink-3" />}
                    </button>
                    <button onClick={() => handleCalendar(event)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-2" aria-label="В календарь">
                      <Calendar className="w-5 h-5 text-ink-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function LiveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [countdown, setCountdown] = useState('');
  const reminders = useAppStore(s => s.reminders);
  const setReminder = useAppStore(s => s.setReminder);
  const removeReminder = useAppStore(s => s.removeReminder);

  useEffect(() => {
    if (!id) return;
    repository.getLiveEvents().then(events => {
      const e = events.find(ev => ev.id === id);
      if (e) {
        setEvent(e);
        repository.getTeachers().then(t => setTeacher(t.find(te => te.id === e.hostId) || null));
      }
    });
  }, [id]);

  useEffect(() => {
    if (!event) return;
    const interval = setInterval(() => {
      const diff = new Date(event.startsAt).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('В эфире');
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(hours > 0 ? `${hours}ч ${mins}мин` : `${mins}мин ${secs}сек`);
    }, 1000);
    return () => clearInterval(interval);
  }, [event]);

  if (!event) return null;

  const status = getLiveStatus(event);
  const isReminder = reminders.includes(event.id);

  return (
    <div className="animate-fade-in-up">
      <div className="px-5 pt-3">
        <button onClick={() => window.history.back()} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-2 mb-4" aria-label="Назад">
          <ArrowLeft className="w-5 h-5 text-ink" />
        </button>

        <div className="relative aspect-video rounded-card overflow-hidden mb-4" style={{ background: event.coverUrl }}>
          {status === 'live' && (
            <div className="absolute top-3 left-3"><Badge variant="live" /></div>
          )}
          {status !== 'live' && status !== 'ended' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <p className="text-display text-white" aria-live="polite">{countdown}</p>
            </div>
          )}
        </div>

        <h1 className="text-h1 text-ink mb-2">{event.title}</h1>
        <p className="text-body text-ink-2 mb-1">{teacher?.name}</p>
        <p className="text-body-sm text-ink-3 mb-6">
          {formatDateRu(event.startsAt)} в {format(new Date(event.startsAt), 'HH:mm')} · {event.durationMin} мин
        </p>

        {status === 'live' && (
          <PillButton size="lg" className="w-full">Присоединиться к эфиру</PillButton>
        )}
        {status === 'upcoming' || status === 'soon' ? (
          <PillButton variant={isReminder ? 'outline' : 'solid'} size="lg" className="w-full" onClick={() => isReminder ? removeReminder(event.id) : setReminder(event.id)}>
            {isReminder ? '✓ Напоминание установлено' : 'Установить напоминание'}
          </PillButton>
        ) : null}
        {status === 'ended' && (
          <p className="text-body text-ink-3 text-center py-4">Эфир завершён</p>
        )}
      </div>
    </div>
  );
}
