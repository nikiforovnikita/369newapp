import { categories, teachers, classes, programs, collections, liveEvents } from '../data/seed';
import type { ClassItem, ClassQuery, Collection, LiveEvent, Profile, Progress, QueueItem, Session, Settings, Subscription, Teacher, Category, Program } from '../types';

const PREFIX = 'pk:';
const SCHEMA_VERSION = 1;

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setItem(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      // Trim history and events
      const sessions = getItem<Session[]>('user:sessions', []);
      setItem('user:sessions', sessions.slice(-100));
    }
  }
}

// Initialize catalog
function initCatalog(): void {
  const version = getItem<number>('catalog:version', 0);
  if (version < SCHEMA_VERSION) {
    setItem('catalog:categories', categories);
    setItem('catalog:teachers', teachers);
    setItem('catalog:classes', classes);
    setItem('catalog:programs', programs);
    setItem('catalog:collections', collections);
    setItem('catalog:liveEvents', liveEvents);
    setItem('catalog:version', SCHEMA_VERSION);
  }
}

// Memory cache
const cache: Record<string, unknown> = {};

function cachedGet<T>(key: string, fallback: T): T {
  if (cache[key] !== undefined) return cache[key] as T;
  const val = getItem<T>(key, fallback);
  cache[key] = val;
  return val;
}

function cachedSet(key: string, value: unknown): void {
  cache[key] = value;
  setItem(key, value);
}

// Initialize on import
initCatalog();

// Ring buffer helpers
function ringBufferPush<T>(arr: T[], item: T, max: number): T[] {
  const result = [...arr, item];
  if (result.length > max) return result.slice(result.length - max);
  return result;
}

export const repository = {
  // Catalog
  async getCategories(): Promise<Category[]> {
    return cachedGet<Category[]>('catalog:categories', categories);
  },

  async getTeachers(): Promise<Teacher[]> {
    return cachedGet<Teacher[]>('catalog:teachers', teachers);
  },

  async getClass(id: string): Promise<ClassItem | null> {
    const all = cachedGet<ClassItem[]>('catalog:classes', classes);
    return all.find(c => c.id === id) || null;
  },

  async getClasses(query: ClassQuery = {}): Promise<ClassItem[]> {
    let result = cachedGet<ClassItem[]>('catalog:classes', classes);

    if (query.q) {
      const q = query.q.toLowerCase();
      const allTeachers = cachedGet<Teacher[]>('catalog:teachers', teachers);
      const teacherNames = new Map(allTeachers.map(t => [t.id, t.name.toLowerCase()]));
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)) ||
        teacherNames.get(c.teacherId)?.includes(q)
      );
    }
    if (query.categoryId) result = result.filter(c => c.categoryId === query.categoryId);
    if (query.teacherId) result = result.filter(c => c.teacherId === query.teacherId);
    if (query.type) result = result.filter(c => c.type === query.type);
    if (query.level) result = result.filter(c => c.level === query.level);
    if (query.minDurSec) result = result.filter(c => c.durationSec >= query.minDurSec!);
    if (query.maxDurSec) result = result.filter(c => c.durationSec <= query.maxDurSec!);
    if (query.isNew) result = result.filter(c => c.isNew);
    if (query.programId) result = result.filter(c => c.programId === query.programId);

    if (query.sort === 'new') result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    if (query.sort === 'duration') result.sort((a, b) => a.durationSec - b.durationSec);

    if (query.offset) result = result.slice(query.offset);
    if (query.limit) result = result.slice(0, query.limit);

    return result;
  },

  async getProgram(id: string): Promise<Program | null> {
    const all = cachedGet<Program[]>('catalog:programs', programs);
    return all.find(p => p.id === id) || null;
  },

  async getPrograms(): Promise<Program[]> {
    return cachedGet<Program[]>('catalog:programs', programs);
  },

  async getCollection(id: string): Promise<Collection | null> {
    const all = cachedGet<Collection[]>('catalog:collections', collections);
    return all.find(c => c.id === id) || null;
  },

  async getCollections(): Promise<Collection[]> {
    return cachedGet<Collection[]>('catalog:collections', collections);
  },

  async getLiveEvents(): Promise<LiveEvent[]> {
    return cachedGet<LiveEvent[]>('catalog:liveEvents', liveEvents);
  },

  // Profile
  async getProfile(): Promise<Profile> {
    return cachedGet<Profile>('user:profile', {
      id: 'u1',
      name: 'Гость',
      avatarColor: '#E8B4B8',
      interests: [],
      experience: '',
      dailyMinutes: 15,
      weeklyGoal: 120,
      createdAt: new Date().toISOString(),
      onboardingDone: false,
    });
  },

  async updateProfile(profile: Partial<Profile>): Promise<Profile> {
    const current = await this.getProfile();
    const updated = { ...current, ...profile };
    cachedSet('user:profile', updated);
    return updated;
  },

  // Settings
  async getSettings(): Promise<Settings> {
    return cachedGet<Settings>('user:settings', {
      notifications: true,
      autoplay: false,
      sound: true,
      liveReminders: true,
    });
  },

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    cachedSet('user:settings', updated);
    return updated;
  },

  // Progress
  async getProgress(classId: string): Promise<Progress | null> {
    const all = cachedGet<Record<string, Progress>>('user:progress', {});
    return all[classId] || null;
  },

  async getAllProgress(): Promise<Record<string, Progress>> {
    return cachedGet<Record<string, Progress>>('user:progress', {});
  },

  async saveProgress(progress: Progress): Promise<void> {
    const all = cachedGet<Record<string, Progress>>('user:progress', {});
    all[progress.classId] = progress;
    cachedSet('user:progress', all);
  },

  // Queue
  async getQueue(): Promise<QueueItem[]> {
    return cachedGet<QueueItem[]>('user:queue', []);
  },

  async addToQueue(classId: string): Promise<void> {
    const queue = await this.getQueue();
    if (queue.some(q => q.id === classId)) return;
    queue.push({ kind: 'class', id: classId, position: queue.length });
    cachedSet('user:queue', queue);
  },

  async removeFromQueue(classId: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter(q => q.id !== classId).map((q, i) => ({ ...q, position: i }));
    cachedSet('user:queue', filtered);
  },

  async reorderQueue(queue: QueueItem[]): Promise<void> {
    cachedSet('user:queue', queue.map((q, i) => ({ ...q, position: i })));
  },

  // Favorites
  async getFavorites(): Promise<string[]> {
    return cachedGet<string[]>('user:favorites', []);
  },

  async toggleFavorite(classId: string): Promise<boolean> {
    const favs = await this.getFavorites();
    const idx = favs.indexOf(classId);
    if (idx >= 0) {
      favs.splice(idx, 1);
      cachedSet('user:favorites', favs);
      return false;
    } else {
      favs.push(classId);
      cachedSet('user:favorites', favs);
      return true;
    }
  },

  // History
  async getHistory(): Promise<Session[]> {
    return cachedGet<Session[]>('user:sessions', []);
  },

  async appendSession(session: Session): Promise<void> {
    const sessions = cachedGet<Session[]>('user:sessions', []);
    const updated = ringBufferPush(sessions, session, 500);
    cachedSet('user:sessions', updated);
  },

  // Reminders
  async setReminder(eventId: string): Promise<void> {
    const reminders = cachedGet<string[]>('user:reminders', []);
    if (!reminders.includes(eventId)) {
      reminders.push(eventId);
      cachedSet('user:reminders', reminders);
    }
  },

  async removeReminder(eventId: string): Promise<void> {
    const reminders = cachedGet<string[]>('user:reminders', []);
    cachedSet('user:reminders', reminders.filter(r => r !== eventId));
  },

  async getReminders(): Promise<string[]> {
    return cachedGet<string[]>('user:reminders', []);
  },

  // Subscription
  async getSubscription(): Promise<Subscription> {
    return cachedGet<Subscription>('user:subscription', { status: 'free' });
  },

  async startTrial(): Promise<Subscription> {
    const sub: Subscription = {
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
    cachedSet('user:subscription', sub);
    return sub;
  },

  // Dev utilities
  async reseed(): Promise<void> {
    setItem('catalog:categories', categories);
    setItem('catalog:teachers', teachers);
    setItem('catalog:classes', classes);
    setItem('catalog:programs', programs);
    setItem('catalog:collections', collections);
    setItem('catalog:liveEvents', liveEvents);
    setItem('catalog:version', SCHEMA_VERSION);
    // Clear cache
    Object.keys(cache).forEach(k => { if (k.startsWith('catalog:')) delete cache[k]; });
  },

  async generateHistory(): Promise<void> {
    const allClasses = cachedGet<ClassItem[]>('catalog:classes', classes);
    const sessions: Session[] = [];
    const progress: Record<string, Progress> = {};

    for (let day = 30; day >= 0; day--) {
      const numSessions = Math.floor(Math.random() * 3) + 1;
      for (let s = 0; s < numSessions; s++) {
        const cls = allClasses[Math.floor(Math.random() * allClasses.length)];
        const dayStart = Date.now() - day * 86400000;
        const hour = Math.floor(Math.random() * 14) + 6;
        const startedAt = new Date(dayStart + hour * 3600000).toISOString();
        const completed = Math.random() > 0.2;
        const watchedSec = completed ? cls.durationSec : Math.floor(cls.durationSec * (0.3 + Math.random() * 0.5));

        sessions.push({
          id: `gen-${day}-${s}`,
          classId: cls.id,
          startedAt,
          endedAt: new Date(new Date(startedAt).getTime() + watchedSec * 1000).toISOString(),
          watchedSec,
          totalSec: cls.durationSec,
          completed,
        });

        progress[cls.id] = {
          classId: cls.id,
          watchedSec,
          totalSec: cls.durationSec,
          completed,
          lastPosition: completed ? 0 : watchedSec,
          updatedAt: startedAt,
        };
      }
    }

    cachedSet('user:sessions', sessions.slice(-500));
    cachedSet('user:progress', progress);
  },

  async clearAll(): Promise<void> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
    Object.keys(cache).forEach(k => delete cache[k]);
    initCatalog();
  },
};

// Listen for storage events (tab sync)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith(PREFIX)) {
      const cacheKey = e.key.slice(PREFIX.length);
      delete cache[cacheKey];
    }
  });
}
