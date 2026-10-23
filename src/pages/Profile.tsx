import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Bell, Download, Trash2, Info, LogOut } from 'lucide-react';
import { Avatar, PillButton, Switch, Sheet, EmptyState } from '../components/ui';
import { useAppStore } from '../store';
import { repository } from '../lib/repository';
import { formatDateFull } from '../lib/format';

const avatarColors = ['#E8B4B8', '#B4C8E8', '#C8B4E8', '#E8D4B4', '#B4E8D4', '#D4E8B4'];

export function ProfilePage() {
  const navigate = useNavigate();
  const profile = useAppStore(s => s.profile);
  const settings = useAppStore(s => s.settings);
  const subscription = useAppStore(s => s.subscription);
  const sessions = useAppStore(s => s.sessions);
  const updateProfile = useAppStore(s => s.updateProfile);
  const updateSettings = useAppStore(s => s.updateSettings);
  const showToast = useAppStore(s => s.showToast);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editColor, setEditColor] = useState(profile?.avatarColor || avatarColors[0]);

  const totalMinutes = Math.round(sessions.reduce((sum, s) => sum + s.watchedSec, 0) / 60);
  const totalSessions = sessions.length;

  const handleSave = () => {
    updateProfile({ name: editName, avatarColor: editColor });
    setEditOpen(false);
    showToast('Профиль обновлён', 'success');
  };

  const handleReset = async () => {
    if (confirm('Вы уверены? Все данные будут удалены.')) {
      await repository.clearAll();
      await useAppStore.getState().loadUser();
      showToast('Профиль сброшен', 'success');
      navigate('/');
    }
  };

  if (!profile) return null;

  return (
    <div className="animate-fade-in-up px-5 pt-4">
      <h1 className="text-h1 text-ink mb-6">Профиль</h1>

      {/* Avatar & name */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={profile.name} size={64} color={profile.avatarColor} />
        <div>
          <h2 className="text-h2 text-ink">{profile.name}</h2>
          <p className="text-body-sm text-ink-2">Практикует с {formatDateFull(profile.createdAt)}</p>
        </div>
      </div>

      <button onClick={() => { setEditName(profile.name); setEditColor(profile.avatarColor); setEditOpen(true); }} className="w-full text-left p-4 rounded-card bg-surface-2 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-body text-ink">Редактировать профиль</span>
          <ChevronRight className="w-5 h-5 text-ink-3" />
        </div>
      </button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 rounded-card bg-surface-2">
          <p className="text-h2 text-ink">{totalMinutes}</p>
          <p className="text-chip text-ink-3">минут</p>
        </div>
        <div className="text-center p-3 rounded-card bg-surface-2">
          <p className="text-h2 text-ink">{totalSessions}</p>
          <p className="text-chip text-ink-3">практик</p>
        </div>
        <div className="text-center p-3 rounded-card bg-surface-2">
          <p className="text-h2 text-ink">{profile.weeklyGoal}</p>
          <p className="text-chip text-ink-3">цель/нед</p>
        </div>
      </div>

      {/* Subscription card */}
      <Link to="/profile/subscription" className="block p-4 rounded-card bg-surface-2 border border-line mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-title text-ink">
              {subscription?.status === 'trial' ? 'Пробный период' : subscription?.status === 'active' ? 'Подписка активна' : 'Бесплатный план'}
            </p>
            {subscription?.status === 'trial' && subscription.trialEndsAt && (
              <p className="text-body-sm text-ink-2">До {formatDateFull(subscription.trialEndsAt)}</p>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-ink-3" />
        </div>
      </Link>

      {/* Settings */}
      <div className="mb-6">
        <h2 className="text-title text-ink mb-3">Настройки</h2>
        <div className="divide-y divide-line">
          <Switch checked={settings?.notifications ?? true} onChange={(v) => updateSettings({ notifications: v })} label="Уведомления" />
          <Switch checked={settings?.autoplay ?? false} onChange={(v) => updateSettings({ autoplay: v })} label="Автовоспроизведение" />
          <Switch checked={settings?.sound ?? true} onChange={(v) => updateSettings({ sound: v })} label="Звук" />
          <Switch checked={settings?.liveReminders ?? true} onChange={(v) => updateSettings({ liveReminders: v })} label="Напоминания об эфирах" />
        </div>
      </div>

      {/* Links */}
      <div className="space-y-2 mb-8">
        <button onClick={() => showToast('Функция в разработке', 'info')} className="flex items-center gap-3 w-full p-3 rounded-card hover:bg-surface-2">
          <Download className="w-5 h-5 text-ink-2" />
          <span className="text-body text-ink flex-1 text-left">Экспорт данных</span>
          <span className="text-chip text-ink-3">скоро</span>
        </button>
        <button onClick={() => showToast('Sangha v1.0 — приложение для практики')} className="flex items-center gap-3 w-full p-3 rounded-card hover:bg-surface-2">
          <Info className="w-5 h-5 text-ink-2" />
          <span className="text-body text-ink flex-1 text-left">О приложении</span>
        </button>
        <button onClick={handleReset} className="flex items-center gap-3 w-full p-3 rounded-card hover:bg-surface-2">
          <Trash2 className="w-5 h-5 text-live" />
          <span className="text-body text-live flex-1 text-left">Сбросить профиль</span>
        </button>
      </div>

      {/* Edit Sheet */}
      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="Редактировать профиль">
        <div className="space-y-6">
          <div>
            <label className="text-eyebrow text-ink-3 mb-2 block">Имя</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full h-12 px-4 rounded-card bg-surface-2 text-body outline-none focus:ring-2 focus:ring-ink/20"
              placeholder="Ваше имя"
            />
          </div>
          <div>
            <label className="text-eyebrow text-ink-3 mb-2 block">Цвет аватара</label>
            <div className="flex gap-3">
              {avatarColors.map(color => (
                <button
                  key={color}
                  onClick={() => setEditColor(color)}
                  className={`w-10 h-10 rounded-full border-2 ${editColor === color ? 'border-ink' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <PillButton size="lg" className="w-full" onClick={handleSave}>Сохранить</PillButton>
        </div>
      </Sheet>
    </div>
  );
}

export function SubscriptionPage() {
  const navigate = useNavigate();
  const subscription = useAppStore(s => s.subscription);
  const startTrial = useAppStore(s => s.startTrial);
  const showToast = useAppStore(s => s.showToast);
  const [plan, setPlan] = useState<'month' | 'year'>('year');

  const benefits = [
    'Более 500 практик',
    'Новые программы каждую неделю',
    'Живые эфиры с преподавателями',
    'Персональные рекомендации',
    'Скачивание для офлайн',
    'Без рекламы',
  ];

  const handleSubscribe = () => {
    showToast('Это демо. Платёжная система не подключена.', 'info');
  };

  return (
    <div className="animate-fade-in-up px-5 pt-4">
      <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-2 mb-4" aria-label="Назад">
        ←
      </button>

      <h1 className="text-h1 text-ink mb-2">Sangha Premium</h1>
      <p className="text-body text-ink-2 mb-6">Полный доступ ко всем практикам</p>

      {/* Benefits */}
      <div className="space-y-3 mb-8">
        {benefits.map(b => (
          <div key={b} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center shrink-0">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-body text-ink">{b}</span>
          </div>
        ))}
      </div>

      {/* Plan toggle */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setPlan('month')}
          className={`flex-1 p-4 rounded-card border text-center ${plan === 'month' ? 'border-ink bg-surface-2' : 'border-line'}`}
        >
          <p className="text-title text-ink">Месяц</p>
          <p className="text-body text-ink-2">799 ₽</p>
        </button>
        <button
          onClick={() => setPlan('year')}
          className={`flex-1 p-4 rounded-card border text-center relative ${plan === 'year' ? 'border-ink bg-surface-2' : 'border-line'}`}
        >
          <span className="absolute -top-2 right-2 inline-flex items-center h-5 px-2 rounded-pill bg-success text-white text-[10px] font-bold">−37%</span>
          <p className="text-title text-ink">Год</p>
          <p className="text-body text-ink-2">5 990 ₽</p>
        </button>
      </div>

      <PillButton size="lg" className="w-full mb-4" onClick={handleSubscribe}>
        Попробовать 7 дней бесплатно
      </PillButton>

      <p className="text-chip text-ink-3 text-center">
        После пробного периода {plan === 'month' ? '799 ₽/мес' : '5 990 ₽/год'}. Отменить можно в любой момент.
      </p>

      <div className="flex justify-center gap-4 mt-6">
        <button className="text-chip text-ink-3 underline">Условия использования</button>
        <button className="text-chip text-ink-3 underline">Политика конфиденциальности</button>
      </div>
    </div>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const updateProfile = useAppStore(s => s.updateProfile);
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState(15);
  const [weeklyGoal, setWeeklyGoal] = useState(120);
  const [categories, setCategories] = useState<{ id: string; title: string; icon: string; tint: string }[]>([]);

  useEffect(() => {
    repository.getCategories().then(setCategories);
  }, []);

  const steps = [
    { title: 'Что вас интересует?', desc: 'Выберите направления' },
    { title: 'Ваш опыт', desc: 'Это поможет подобрать практики' },
    { title: 'Сколько минут в день?', desc: 'Рекомендуем начать с малого' },
    { title: 'Цель на неделю', desc: 'Сколько минут хотите практиковать' },
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      updateProfile({
        interests,
        experience,
        dailyMinutes,
        weeklyGoal,
        onboardingDone: true,
      });
      navigate('/');
    }
  };

  const handleSkip = () => {
    updateProfile({ onboardingDone: true });
    navigate('/');
  };

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <div className="flex-1 px-5 pt-12 pb-8 flex flex-col">
        {/* Progress */}
        <div className="flex gap-1 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-ink' : 'bg-line'}`} />
          ))}
        </div>

        <h1 className="text-display text-ink mb-2">{steps[step].title}</h1>
        <p className="text-body text-ink-2 mb-8">{steps[step].desc}</p>

        <div className="flex-1">
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setInterests(interests.includes(cat.id) ? interests.filter(i => i !== cat.id) : [...interests, cat.id])}
                  className={`p-4 rounded-card border text-left transition-all ${interests.includes(cat.id) ? 'border-ink bg-surface-2' : 'border-line'}`}
                  style={{ backgroundColor: interests.includes(cat.id) ? cat.tint : undefined }}
                >
                  <span className="text-2xl mb-2 block">{cat.icon}</span>
                  <span className="text-title text-ink">{cat.title}</span>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-3">
              {['Начинающий', 'Занимаюсь регулярно', 'Продвинутый'].map(exp => (
                <button
                  key={exp}
                  onClick={() => setExperience(exp)}
                  className={`h-14 px-6 rounded-pill border text-body font-medium transition-all ${experience === exp ? 'bg-ink text-white border-ink' : 'border-line text-ink'}`}
                >
                  {exp}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-wrap gap-3">
              {[5, 10, 15, 20, 30, 45].map(mins => (
                <button
                  key={mins}
                  onClick={() => setDailyMinutes(mins)}
                  className={`h-12 px-5 rounded-pill border text-body-sm font-medium transition-all ${dailyMinutes === mins ? 'bg-ink text-white border-ink' : 'border-line text-ink'}`}
                >
                  {mins} мин
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div>
              <input
                type="range"
                min={30}
                max={300}
                step={30}
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                className="w-full h-2 appearance-none bg-line rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink"
              />
              <p className="text-h2 text-ink text-center mt-4">{weeklyGoal} минут в неделю</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div className="px-5 pb-8 safe-bottom">
        <PillButton size="lg" className="w-full mb-3" onClick={handleNext}>
          {step < 3 ? 'Далее' : 'Начать практику'}
        </PillButton>
        <button onClick={handleSkip} className="w-full text-center text-body-sm text-ink-3">
          Пропустить
        </button>
      </div>
    </div>
  );
}
