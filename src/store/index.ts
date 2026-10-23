import { create } from 'zustand';
import type { Profile, Settings, Subscription, Progress, Session, QueueItem } from '../types';
import { repository } from '../lib/repository';

interface AppState {
  profile: Profile | null;
  settings: Settings | null;
  subscription: Subscription | null;
  progress: Record<string, Progress>;
  sessions: Session[];
  queue: QueueItem[];
  favorites: string[];
  reminders: string[];
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];

  // Actions
  loadUser: () => Promise<void>;
  updateProfile: (p: Partial<Profile>) => Promise<void>;
  updateSettings: (s: Partial<Settings>) => Promise<void>;
  saveProgress: (p: Progress) => Promise<void>;
  appendSession: (s: Session) => Promise<void>;
  addToQueue: (classId: string) => Promise<void>;
  removeFromQueue: (classId: string) => Promise<void>;
  reorderQueue: (queue: QueueItem[]) => Promise<void>;
  toggleFavorite: (classId: string) => Promise<boolean>;
  setReminder: (eventId: string) => Promise<void>;
  removeReminder: (eventId: string) => Promise<void>;
  startTrial: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  clearHistory: () => Promise<void>;
  clearQueue: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  profile: null,
  settings: null,
  subscription: null,
  progress: {},
  sessions: [],
  queue: [],
  favorites: [],
  reminders: [],
  toasts: [],

  loadUser: async () => {
    const [profile, settings, subscription, progress, sessions, queue, favorites, reminders] = await Promise.all([
      repository.getProfile(),
      repository.getSettings(),
      repository.getSubscription(),
      repository.getAllProgress(),
      repository.getHistory(),
      repository.getQueue(),
      repository.getFavorites(),
      repository.getReminders(),
    ]);
    set({ profile, settings, subscription, progress, sessions, queue, favorites, reminders });
  },

  updateProfile: async (p) => {
    const updated = await repository.updateProfile(p);
    set({ profile: updated });
  },

  updateSettings: async (s) => {
    const updated = await repository.updateSettings(s);
    set({ settings: updated });
  },

  saveProgress: async (p) => {
    await repository.saveProgress(p);
    set(state => ({ progress: { ...state.progress, [p.classId]: p } }));
  },

  appendSession: async (s) => {
    await repository.appendSession(s);
    set(state => ({ sessions: [...state.sessions, s] }));
  },

  addToQueue: async (classId) => {
    await repository.addToQueue(classId);
    const queue = await repository.getQueue();
    set({ queue });
    get().showToast('Добавлено в очередь', 'success');
  },

  removeFromQueue: async (classId) => {
    await repository.removeFromQueue(classId);
    const queue = await repository.getQueue();
    set({ queue });
  },

  reorderQueue: async (queue) => {
    await repository.reorderQueue(queue);
    set({ queue });
  },

  toggleFavorite: async (classId) => {
    const added = await repository.toggleFavorite(classId);
    const favorites = await repository.getFavorites();
    set({ favorites });
    get().showToast(added ? 'Добавлено в избранное' : 'Удалено из избранного', 'success');
    return added;
  },

  setReminder: async (eventId) => {
    await repository.setReminder(eventId);
    const reminders = await repository.getReminders();
    set({ reminders });
    get().showToast('Напоминание установлено', 'success');
  },

  removeReminder: async (eventId) => {
    await repository.removeReminder(eventId);
    const reminders = await repository.getReminders();
    set({ reminders });
  },

  startTrial: async () => {
    await repository.startTrial();
    const subscription = await repository.getSubscription();
    set({ subscription });
  },

  showToast: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 3000);
  },

  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },

  clearHistory: async () => {
    set({ sessions: [], progress: {} });
    // We need to update localStorage too
    localStorage.setItem('pk:user:sessions', JSON.stringify([]));
    localStorage.setItem('pk:user:progress', JSON.stringify({}));
  },

  clearQueue: async () => {
    set({ queue: [] });
    localStorage.setItem('pk:user:queue', JSON.stringify([]));
  },
}));
