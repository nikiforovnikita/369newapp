import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Clock, X, GripVertical, BarChart3, MoreVertical, Download, Trash2 } from 'lucide-react';
import { Tabs, PillButton, IconButton, EmptyState, Sheet, Avatar, ProgressBar } from '../components/ui';
import { ClassRow } from '../components/domain';
import { useAppStore } from '../store';
import { repository } from '../lib/repository';
import { getGroupLabel, formatTime, downloadCSV } from '../lib/format';
import type { ClassItem, Teacher, Category, Session } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableQueueItem({ item, cls, teacher, onRemove }: { item: any; cls: ClassItem; teacher?: Teacher; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 py-3 border-b border-line">
      <button {...attributes} {...listeners} className="w-10 h-10 flex items-center justify-center cursor-grab" aria-label="Перетащить">
        <GripVertical className="w-5 h-5 text-ink-3" />
      </button>
      <Link to={`/class/${cls.id}`} className="w-[120px] h-[90px] rounded-media overflow-hidden shrink-0" style={{ background: cls.posterUrl }} />
      <div className="flex-1 min-w-0">
        <p className="text-title text-ink line-clamp-1">{cls.title}</p>
        <p className="text-body-sm text-ink-2">{teacher?.name}</p>
        {cls.programId && <p className="text-chip text-ink-3">Часть программы</p>}
      </div>
      <button onClick={onRemove} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-2" aria-label="Удалить">
        <X className="w-5 h-5 text-ink-3" />
      </button>
    </div>
  );
}

export function PracticePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'queue';
  const queue = useAppStore(s => s.queue);
  const favorites = useAppStore(s => s.favorites);
  const sessions = useAppStore(s => s.sessions);
  const removeFromQueue = useAppStore(s => s.removeFromQueue);
  const reorderQueue = useAppStore(s => s.reorderQueue);
  const toggleFavorite = useAppStore(s => s.toggleFavorite);
  const clearHistory = useAppStore(s => s.clearHistory);
  const showToast = useAppStore(s => s.showToast);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manageOpen, setManageOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    Promise.all([
      repository.getClasses(),
      repository.getTeachers(),
      repository.getCategories(),
    ]).then(([c, t, cat]) => {
      setClasses(c);
      setTeachers(t);
      setCategories(cat);
    });
  }, []);

  const classMap = useMemo(() => new Map(classes.map(c => [c.id, c])), [classes]);
  const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const queueItems = useMemo(() =>
    queue.map(q => ({ ...q, cls: classMap.get(q.id) })).filter(q => q.cls),
    [queue, classMap]
  );

  const favoriteClasses = useMemo(() =>
    favorites.map(id => classMap.get(id)).filter(Boolean) as ClassItem[],
    [favorites, classMap]
  );

  // Group sessions
  const groupedSessions = useMemo(() => {
    const groups: Record<string, Session[]> = {};
    const sorted = [...sessions].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    sorted.forEach(s => {
      const label = getGroupLabel(new Date(s.startedAt));
      if (!groups[label]) groups[label] = [];
      groups[label].push(s);
    });
    return groups;
  }, [sessions]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex(q => q.id === active.id);
      const newIndex = queue.findIndex(q => q.id === over.id);
      const newQueue = arrayMove(queue, oldIndex, newIndex);
      reorderQueue(newQueue);
    }
  };

  const handleExport = () => {
    const cMap = new Map(classes.map(c => [c.id, { title: c.title, categoryId: c.categoryId }]));
    downloadCSV(sessions, cMap);
    showToast('Экспортировано', 'success');
  };

  const tabs = [
    { id: 'queue', label: 'Очередь' },
    { id: 'favorites', label: 'Избранное' },
    { id: 'history', label: 'История' },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="sticky top-[88px] z-30 bg-bg/95 backdrop-blur-md px-5 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-h1 text-ink">Практика</h1>
          <div className="flex items-center gap-2">
            <Link to="/analytics">
              <IconButton label="Аналитика" size={40}>
                <BarChart3 className="w-5 h-5 text-ink-2" />
              </IconButton>
            </Link>
            <IconButton label="Управлять" size={40} onClick={() => setManageOpen(true)}>
              <MoreVertical className="w-5 h-5 text-ink-2" />
            </IconButton>
          </div>
        </div>
        <Tabs tabs={tabs} active={tab} onChange={(id) => setSearchParams({ tab: id })} />
      </div>

      <div className="px-5 mt-4">
        {tab === 'queue' && (
          <>
            {queueItems.length === 0 ? (
              <EmptyState title="Очередь пуста" description="Добавьте практики из каталога" />
            ) : (
              <>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={queue.map(q => q.id)} strategy={verticalListSortingStrategy}>
                    <div>
                      {queueItems.map(item => (
                        <SortableQueueItem
                          key={item.id}
                          item={item}
                          cls={item.cls!}
                          teacher={teacherMap.get(item.cls!.teacherId)}
                          onRemove={() => removeFromQueue(item.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <div className="mt-6">
                  <PillButton size="lg" className="w-full" onClick={() => { if (queueItems[0]) window.location.href = `/play/${queueItems[0].id}`; }}>
                    Начать очередь
                  </PillButton>
                </div>
              </>
            )}
          </>
        )}

        {tab === 'favorites' && (
          <>
            {favoriteClasses.length === 0 ? (
              <EmptyState title="Нет избранного" description="Нажмите ♡ чтобы добавить практику" />
            ) : (
              <div className="divide-y divide-line">
                {favoriteClasses.map(cls => (
                  <ClassRow
                    key={cls.id}
                    cls={cls}
                    teacher={teacherMap.get(cls.teacherId)}
                    categoryTitle={categoryMap.get(cls.categoryId)?.title}
                    onMore={() => toggleFavorite(cls.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <>
            {sessions.length === 0 ? (
              <EmptyState title="История пуста" description="Начните практиковать, чтобы видеть историю" />
            ) : (
              <div>
                {Object.entries(groupedSessions).map(([label, sess]) => (
                  <div key={label} className="mb-6">
                    <div className="sticky top-[180px] bg-bg/95 backdrop-blur-sm py-2 z-10">
                      <p className="text-eyebrow text-ink-3">{label}</p>
                    </div>
                    <div className="divide-y divide-line">
                      {sess.map(s => {
                        const cls = classMap.get(s.classId);
                        if (!cls) return null;
                        return (
                          <Link key={s.id} to={`/class/${s.id}`} className="flex items-center gap-3 py-3">
                            <div className="w-16 h-16 rounded-row overflow-hidden shrink-0" style={{ background: cls.posterUrl }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-title text-ink line-clamp-1">{cls.title}</p>
                              <p className="text-body-sm text-ink-2">
                                {formatTime(s.watchedSec)} из {formatTime(s.totalSec)}
                                {s.completed ? ' ✓' : ''}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Manage Sheet */}
      <Sheet open={manageOpen} onClose={() => setManageOpen(false)} title="Управлять">
        <div className="space-y-2">
          <button onClick={() => { useAppStore.getState().clearQueue(); setManageOpen(false); showToast('Очередь очищена'); }} className="flex items-center gap-3 w-full p-3 rounded-card hover:bg-surface-2">
            <Trash2 className="w-5 h-5 text-ink-2" />
            <span className="text-body text-ink">Очистить очередь</span>
          </button>
          <button onClick={() => { setConfirmClear(true); setManageOpen(false); }} className="flex items-center gap-3 w-full p-3 rounded-card hover:bg-surface-2">
            <Trash2 className="w-5 h-5 text-ink-2" />
            <span className="text-body text-ink">Очистить историю</span>
          </button>
          <button onClick={() => { handleExport(); setManageOpen(false); }} className="flex items-center gap-3 w-full p-3 rounded-card hover:bg-surface-2">
            <Download className="w-5 h-5 text-ink-2" />
            <span className="text-body text-ink">Экспорт в JSON</span>
          </button>
        </div>
      </Sheet>

      {/* Confirm Clear */}
      <Sheet open={confirmClear} onClose={() => setConfirmClear(false)} title="Очистить историю?">
        <p className="text-body text-ink-2 mb-6">Это действие нельзя отменить. Все данные о просмотренных практиках будут удалены.</p>
        <div className="flex gap-3">
          <PillButton variant="outline" size="lg" onClick={() => setConfirmClear(false)} className="flex-1">Отмена</PillButton>
          <PillButton size="lg" onClick={() => { clearHistory(); setConfirmClear(false); showToast('История очищена'); }} className="flex-1">Очистить</PillButton>
        </div>
      </Sheet>
    </div>
  );
}
