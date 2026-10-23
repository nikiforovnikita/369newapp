export type Level = 1 | 2 | 3;

export type PracticeType = 'yoga' | 'breathwork' | 'meditation' | 'pilates' | 'stretch' | 'qigong';

export interface Teacher {
  id: string;
  name: string;
  bio: string;
  avatarColor: string;
  practiceCount: number;
}

export interface Category {
  id: string;
  slug: string;
  title: string;
  icon: string;
  tint: string;
}

export interface ClassItem {
  id: string;
  title: string;
  subtitle?: string;
  teacherId: string;
  categoryId: string;
  type: PracticeType;
  level: Level;
  durationSec: number;
  posterUrl: string;
  videoUrl: string;
  tags: string[];
  isNew?: boolean;
  programId?: string;
  publishedAt: string;
  description?: string;
  equipment?: string[];
}

export interface Program {
  id: string;
  title: string;
  coverUrl: string;
  teacherId: string;
  categoryIds: string[];
  level: Level;
  classIds: string[];
  isNew?: boolean;
  description?: string;
}

export interface Collection {
  id: string;
  title: string;
  coverUrl: string;
  items: { kind: 'class' | 'program'; id: string }[];
  createdBy: string;
  isNew?: boolean;
}

export interface LiveEvent {
  id: string;
  title: string;
  hostId: string;
  coverUrl: string;
  startsAt: string;
  durationMin: number;
  categoryId: string;
  level: Level;
}

export interface Progress {
  classId: string;
  watchedSec: number;
  totalSec: number;
  completed: boolean;
  lastPosition: number;
  updatedAt: string;
}

export interface Session {
  id: string;
  classId: string;
  startedAt: string;
  endedAt: string;
  watchedSec: number;
  totalSec: number;
  completed: boolean;
}

export interface Profile {
  id: string;
  name: string;
  avatarColor: string;
  interests: string[];
  experience: string;
  dailyMinutes: number;
  weeklyGoal: number;
  createdAt: string;
  onboardingDone: boolean;
}

export interface Settings {
  notifications: boolean;
  autoplay: boolean;
  sound: boolean;
  liveReminders: boolean;
}

export interface Subscription {
  status: 'free' | 'trial' | 'active';
  trialEndsAt?: string;
  plan?: 'month' | 'year';
}

export interface QueueItem {
  kind: 'class';
  id: string;
  position: number;
}

export interface UserState {
  profile: Profile;
  settings: Settings;
  subscription: Subscription;
  progress: Record<string, Progress>;
  sessions: Session[];
  queue: QueueItem[];
  favorites: string[];
  reminders: string[];
}

export type LiveStatus = 'upcoming' | 'soon' | 'live' | 'ended';

export interface ClassQuery {
  q?: string;
  categoryId?: string;
  teacherId?: string;
  type?: PracticeType;
  level?: Level;
  minDurSec?: number;
  maxDurSec?: number;
  isNew?: boolean;
  programId?: string;
  sort?: 'new' | 'popular' | 'duration';
  limit?: number;
  offset?: number;
}
