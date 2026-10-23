import { formatDuration, format as formatDate, differenceInDays, startOfDay, isToday, isYesterday, subDays, startOfWeek, endOfWeek, eachDayOfInterval, eachHourOfInterval, startOfHour } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Session, LiveEvent, LiveStatus } from '../types';

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDurationMin(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h} ч ${rem} мин` : `${h} ч`;
}

export function formatDurationShort(sec: number): string {
  const m = Math.round(sec / 60);
  return `${m} мин`;
}

export function formatDateRu(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDate(d, 'd MMMM', { locale: ru });
}

export function formatDateFull(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDate(d, 'd MMMM yyyy', { locale: ru });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

export function getLiveStatus(event: LiveEvent, now: Date = new Date()): LiveStatus {
  const start = new Date(event.startsAt).getTime();
  const end = start + event.durationMin * 60000;
  const nowMs = now.getTime();

  if (nowMs >= end) return 'ended';
  if (nowMs >= start) return 'live';
  if (start - nowMs < 3600000) return 'soon';
  return 'upcoming';
}

export function getGroupLabel(date: Date): string {
  if (isToday(date)) return 'Сегодня';
  if (isYesterday(date)) return 'Вчера';
  const weekAgo = subDays(new Date(), 7);
  if (date > weekAgo) return 'На этой неделе';
  return 'Ранее';
}

// Analytics metrics
export function minutesByDay(sessions: Session[], days: number): { date: string; minutes: number }[] {
  const result: { date: string; minutes: number }[] = [];
  const today = startOfDay(new Date());

  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(today, i);
    const dayStr = formatDate(day, 'yyyy-MM-dd');
    const daySessions = sessions.filter(s => {
      const sd = startOfDay(new Date(s.startedAt));
      return sd.getTime() === day.getTime();
    });
    const minutes = Math.round(daySessions.reduce((sum, s) => sum + s.watchedSec, 0) / 60);
    result.push({ date: dayStr, minutes });
  }
  return result;
}

export function minutesByCategory(sessions: Session[], classMap: Map<string, { categoryId: string; type: string }>): { category: string; minutes: number }[] {
  const map = new Map<string, number>();
  sessions.forEach(s => {
    const cls = classMap.get(s.classId);
    if (cls) {
      const key = cls.categoryId;
      map.set(key, (map.get(key) || 0) + s.watchedSec / 60);
    }
  });
  return Array.from(map.entries()).map(([category, minutes]) => ({ category, minutes: Math.round(minutes) }));
}

export function streakDays(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  const today = startOfDay(new Date());
  const days = new Set(sessions.map(s => formatDate(startOfDay(new Date(s.startedAt)), 'yyyy-MM-dd')));

  let streak = 0;
  let checkDate = today;

  while (days.has(formatDate(checkDate, 'yyyy-MM-dd'))) {
    streak++;
    checkDate = subDays(checkDate, 1);
  }
  return streak;
}

export function averageDuration(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  const total = sessions.reduce((sum, s) => sum + s.watchedSec, 0);
  return Math.round(total / sessions.length / 60);
}

export function minutesByHour(sessions: Session[]): number[] {
  const hours = new Array(24).fill(0);
  sessions.forEach(s => {
    const hour = new Date(s.startedAt).getHours();
    hours[hour] += s.watchedSec / 60;
  });
  return hours.map(m => Math.round(m));
}

export function totalMinutesInRange(sessions: Session[], rangeDays: number): number {
  const cutoff = subDays(new Date(), rangeDays);
  return Math.round(
    sessions.filter(s => new Date(s.startedAt) >= cutoff).reduce((sum, s) => sum + s.watchedSec, 0) / 60
  );
}

export function completedCount(sessions: Session[]): number {
  return sessions.filter(s => s.completed).length;
}

export function favoriteCategory(sessions: Session[], classMap: Map<string, { categoryId: string }>): string {
  const counts = new Map<string, number>();
  sessions.forEach(s => {
    const cls = classMap.get(s.classId);
    if (cls) {
      counts.set(cls.categoryId, (counts.get(cls.categoryId) || 0) + 1);
    }
  });
  let max = 0;
  let fav = '';
  counts.forEach((v, k) => { if (v > max) { max = v; fav = k; } });
  return fav;
}

export function generateICS(event: LiveEvent): string {
  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + event.durationMin * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sangha//RU',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:Sangha: ${event.title}`,
    'DESCRIPTION:Присоединяйтесь к живому эфиру',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadCSV(sessions: Session[], classMap: Map<string, { title: string; categoryId: string }>): void {
  const rows = ['date,class,category,minutes,completed'];
  sessions.forEach(s => {
    const cls = classMap.get(s.classId);
    if (cls) {
      rows.push(`${formatDate(new Date(s.startedAt), 'yyyy-MM-dd')},${cls.title},${cls.categoryId},${Math.round(s.watchedSec / 60)},${s.completed}`);
    }
  });
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sangha-analytics.csv';
  a.click();
  URL.revokeObjectURL(url);
}
