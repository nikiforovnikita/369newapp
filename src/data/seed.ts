import { Category, Teacher, ClassItem, Program, Collection, LiveEvent, PracticeType, Level } from '../types';

export const categories: Category[] = [
  { id: 'yoga', slug: 'yoga', title: 'Йога', icon: '🧘', tint: '#E8F0E8' },
  { id: 'breathwork', slug: 'breathwork', title: 'Дыхание', icon: '🌬️', tint: '#E8EEF5' },
  { id: 'meditation', slug: 'meditation', title: 'Медитация', icon: '🧠', tint: '#F0E8F5' },
  { id: 'pilates', slug: 'pilates', title: 'Пилатес', icon: '💪', tint: '#F5F0E8' },
  { id: 'stretch', slug: 'stretch', title: 'Растяжка', icon: '🤸', tint: '#E8F5F0' },
  { id: 'qigong', slug: 'qigong', title: 'Цигун', icon: '☯️', tint: '#F5E8E8' },
  { id: 'sleep', slug: 'sleep', title: 'Сон и вечерние практики', icon: '🌙', tint: '#E8E8F5' },
  { id: 'beginners', slug: 'beginners', title: 'Для начинающих', icon: '🌱', tint: '#F0F5E8' },
];

export const teachers: Teacher[] = [
  { id: 't1', name: 'Анна Светлова', bio: 'Преподаватель хатха-йоги с 12-летним опытом', avatarColor: '#E8B4B8', practiceCount: 145 },
  { id: 't2', name: 'Дмитрий Волков', bio: 'Мастер дыхательных практик, сертифицированный инструктор', avatarColor: '#B4C8E8', practiceCount: 98 },
  { id: 't3', name: 'Елена Тихая', bio: 'Инструктор медитации и осознанности', avatarColor: '#C8B4E8', practiceCount: 112 },
  { id: 't4', name: 'Михаил Козлов', bio: 'Мастер цигун и тайцзи', avatarColor: '#E8D4B4', practiceCount: 76 },
  { id: 't5', name: 'Ольга Речная', bio: 'Преподаватель пилатеса и функционального тренинга', avatarColor: '#B4E8D4', practiceCount: 134 },
  { id: 't6', name: 'Сергей Лесной', bio: 'Йогатерапевт, специалист по работе с телом', avatarColor: '#D4E8B4', practiceCount: 89 },
  { id: 't7', name: 'Мария Облакова', bio: 'Преподаватель виньяса-флоу и реставративной йоги', avatarColor: '#E8B4D4', practiceCount: 167 },
  { id: 't8', name: 'Алексей Горный', bio: 'Инструктор по растяжке и мобильности', avatarColor: '#B4D4E8', practiceCount: 54 },
  { id: 't9', name: 'Наталья Звёздная', bio: 'Мастер-тренер пилатеса, реабилитолог', avatarColor: '#D4B4E8', practiceCount: 91 },
  { id: 't10', name: 'Игорь Тихонов', bio: 'Преподаватель вечерних практик и йога-нидры', avatarColor: '#E8E4B4', practiceCount: 63 },
];

const posterGradients = [
  'linear-gradient(135deg, #E8F0E8 0%, #B8D4B8 100%)',
  'linear-gradient(135deg, #E8EEF5 0%, #B8C8E8 100%)',
  'linear-gradient(135deg, #F0E8F5 0%, #D4B8E8 100%)',
  'linear-gradient(135deg, #F5F0E8 0%, #E8D4B8 100%)',
  'linear-gradient(135deg, #E8F5F0 0%, #B8E8D4 100%)',
  'linear-gradient(135deg, #F5E8E8 0%, #E8B8B8 100%)',
  'linear-gradient(135deg, #E8E8F5 0%, #B8B8E8 100%)',
  'linear-gradient(135deg, #F0F5E8 0%, #D4E8B8 100%)',
];

function getPoster(idx: number): string {
  return posterGradients[idx % posterGradients.length];
}

const classNames: { title: string; type: PracticeType; categoryId: string; level: Level; duration: number; teacherId: string; tags: string[] }[] = [
  { title: 'Утренняя виньяса', type: 'yoga', categoryId: 'yoga', level: 2, duration: 1800, teacherId: 't7', tags: ['утро', 'энергия'] },
  { title: 'Хатха для начинающих', type: 'yoga', categoryId: 'yoga', level: 1, duration: 2400, teacherId: 't1', tags: ['начинающие', 'база'] },
  { title: 'Вечерняя реставрация', type: 'yoga', categoryId: 'yoga', level: 1, duration: 3600, teacherId: 't7', tags: ['вечер', 'расслабление'] },
  { title: 'Силовая йога', type: 'yoga', categoryId: 'yoga', level: 3, duration: 2700, teacherId: 't6', tags: ['сила', 'интенсив'] },
  { title: 'Йога для спины', type: 'yoga', categoryId: 'yoga', level: 1, duration: 1500, teacherId: 't6', tags: ['спина', 'здоровье'] },
  { title: 'Кундалини пробуждение', type: 'yoga', categoryId: 'yoga', level: 2, duration: 2100, teacherId: 't1', tags: ['энергия', 'дух'] },
  { title: 'Инь-йога глубокая', type: 'yoga', categoryId: 'yoga', level: 2, duration: 3000, teacherId: 't7', tags: ['глубокая', 'соединительная ткань'] },
  { title: 'Приветствие солнцу', type: 'yoga', categoryId: 'yoga', level: 1, duration: 900, teacherId: 't1', tags: ['утро', 'разминка'] },
  { title: 'Йога для шеи и плеч', type: 'yoga', categoryId: 'yoga', level: 1, duration: 1200, teacherId: 't6', tags: ['шея', 'офис'] },
  { title: 'Баланс и устойчивость', type: 'yoga', categoryId: 'yoga', level: 2, duration: 1800, teacherId: 't1', tags: ['баланс', 'концентрация'] },
  { title: 'Дыхание 4-7-8', type: 'breathwork', categoryId: 'breathwork', level: 1, duration: 600, teacherId: 't2', tags: ['расслабление', 'сон'] },
  { title: 'Пранаяма для энергии', type: 'breathwork', categoryId: 'breathwork', level: 2, duration: 900, teacherId: 't2', tags: ['энергия', 'утро'] },
  { title: 'Квадратное дыхание', type: 'breathwork', categoryId: 'breathwork', level: 1, duration: 480, teacherId: 't2', tags: ['стресс', 'фокус'] },
  { title: 'Огненное дыхание', type: 'breathwork', categoryId: 'breathwork', level: 3, duration: 720, teacherId: 't2', tags: ['интенсив', 'энергия'] },
  { title: 'Дыхание перед сном', type: 'breathwork', categoryId: 'breathwork', level: 1, duration: 600, teacherId: 't2', tags: ['вечер', 'сон'] },
  { title: 'Холодное дыхание', type: 'breathwork', categoryId: 'breathwork', level: 2, duration: 900, teacherId: 't2', tags: ['бодрость', 'иммунитет'] },
  { title: 'Медитация осознанности', type: 'meditation', categoryId: 'meditation', level: 1, duration: 1200, teacherId: 't3', tags: ['осознанность', 'база'] },
  { title: 'Сканирование тела', type: 'meditation', categoryId: 'meditation', level: 1, duration: 1800, teacherId: 't3', tags: ['расслабление', 'тело'] },
  { title: 'Медитация на дыхание', type: 'meditation', categoryId: 'meditation', level: 1, duration: 900, teacherId: 't3', tags: ['дыхание', 'фокус'] },
  { title: 'Визуализация цели', type: 'meditation', categoryId: 'meditation', level: 2, duration: 1500, teacherId: 't3', tags: ['визуализация', 'мотивация'] },
  { title: 'Метта — любящая доброта', type: 'meditation', categoryId: 'meditation', level: 2, duration: 1800, teacherId: 't3', tags: ['сострадание', 'сердце'] },
  { title: 'Медитация для сна', type: 'meditation', categoryId: 'meditation', level: 1, duration: 2400, teacherId: 't3', tags: ['сон', 'вечер'] },
  { title: 'Walking meditation', type: 'meditation', categoryId: 'meditation', level: 1, duration: 1200, teacherId: 't3', tags: ['движение', 'осознанность'] },
  { title: 'Звуковая медитация', type: 'meditation', categoryId: 'meditation', level: 2, duration: 1800, teacherId: 't3', tags: ['звуки', 'расслабление'] },
  { title: 'Пилатес для кора', type: 'pilates', categoryId: 'pilates', level: 2, duration: 2700, teacherId: 't5', tags: ['кор', 'сила'] },
  { title: 'Пилатес мат', type: 'pilates', categoryId: 'pilates', level: 1, duration: 2400, teacherId: 't5', tags: ['база', 'мат'] },
  { title: 'Пилатес для осанки', type: 'pilates', categoryId: 'pilates', level: 1, duration: 1800, teacherId: 't9', tags: ['осанка', 'спина'] },
  { title: 'Силовой пилатес', type: 'pilates', categoryId: 'pilates', level: 3, duration: 3000, teacherId: 't5', tags: ['сила', 'интенсив'] },
  { title: 'Пилатес и растяжка', type: 'pilates', categoryId: 'pilates', level: 1, duration: 2100, teacherId: 't9', tags: ['гибкость', 'расслабление'] },
  { title: 'Утренняя растяжка', type: 'stretch', categoryId: 'stretch', level: 1, duration: 1200, teacherId: 't8', tags: ['утро', 'разминка'] },
  { title: 'Глубокая растяжка', type: 'stretch', categoryId: 'stretch', level: 2, duration: 2400, teacherId: 't8', tags: ['глубокая', 'гибкость'] },
  { title: 'Растяжка для офиса', type: 'stretch', categoryId: 'stretch', level: 1, duration: 600, teacherId: 't8', tags: ['офис', 'быстро'] },
  { title: 'Шпагат за 30 дней', type: 'stretch', categoryId: 'stretch', level: 2, duration: 1800, teacherId: 't8', tags: ['шпагат', 'прогресс'] },
  { title: 'Растяжка бёдер', type: 'stretch', categoryId: 'stretch', level: 1, duration: 1500, teacherId: 't8', tags: ['бёдра', 'мобильность'] },
  { title: 'Цигун для здоровья', type: 'qigong', categoryId: 'qigong', level: 1, duration: 1800, teacherId: 't4', tags: ['здоровье', 'энергия'] },
  { title: 'Пять тибетских жемчужин', type: 'qigong', categoryId: 'qigong', level: 2, duration: 2100, teacherId: 't4', tags: ['традиция', 'сила'] },
  { title: 'Цигун для начинающих', type: 'qigong', categoryId: 'qigong', level: 1, duration: 1500, teacherId: 't4', tags: ['база', 'простые'] },
  { title: 'Медленный цигун', type: 'qigong', categoryId: 'qigong', level: 1, duration: 2400, teacherId: 't4', tags: ['медленный', 'расслабление'] },
  { title: 'Йога-нидра', type: 'meditation', categoryId: 'sleep', level: 1, duration: 3600, teacherId: 't10', tags: ['сон', 'глубокое расслабление'] },
  { title: 'Вечерняя практика', type: 'yoga', categoryId: 'sleep', level: 1, duration: 2400, teacherId: 't10', tags: ['вечер', 'мягкая'] },
  { title: 'Звуки для сна', type: 'meditation', categoryId: 'sleep', level: 1, duration: 3600, teacherId: 't10', tags: ['звуки', 'засыпание'] },
  { title: 'Первый шаг в йогу', type: 'yoga', categoryId: 'beginners', level: 1, duration: 1800, teacherId: 't1', tags: ['начало', 'основы'] },
  { title: 'Медитация для новичков', type: 'meditation', categoryId: 'beginners', level: 1, duration: 600, teacherId: 't3', tags: ['начало', '5 минут'] },
  { title: 'Дыхание для начинающих', type: 'breathwork', categoryId: 'beginners', level: 1, duration: 480, teacherId: 't2', tags: ['начало', 'простое'] },
  { title: 'Мягкий пилатес', type: 'pilates', categoryId: 'beginners', level: 1, duration: 1800, teacherId: 't9', tags: ['начало', 'мягкий'] },
  { title: 'Лёгкая растяжка', type: 'stretch', categoryId: 'beginners', level: 1, duration: 900, teacherId: 't8', tags: ['начало', 'мягкая'] },
  { title: 'Введение в цигун', type: 'qigong', categoryId: 'beginners', level: 1, duration: 1200, teacherId: 't4', tags: ['начало', 'введение'] },
  { title: 'Виньяса-флоу средняя', type: 'yoga', categoryId: 'yoga', level: 2, duration: 2700, teacherId: 't7', tags: ['флоу', 'средний'] },
  { title: 'Аштанга первичная серия', type: 'yoga', categoryId: 'yoga', level: 3, duration: 3600, teacherId: 't6', tags: ['аштанга', 'интенсив'] },
  { title: 'Йога для бегунов', type: 'yoga', categoryId: 'yoga', level: 2, duration: 1800, teacherId: 't6', tags: ['спорт', 'восстановление'] },
  { title: 'Капоэйя-йога', type: 'yoga', categoryId: 'yoga', level: 2, duration: 2100, teacherId: 't7', tags: ['динамика', 'сила'] },
  { title: 'Дыхание Вим Хофа', type: 'breathwork', categoryId: 'breathwork', level: 3, duration: 1200, teacherId: 't2', tags: ['интенсив', 'холод'] },
  { title: 'Осознанный обед', type: 'meditation', categoryId: 'meditation', level: 1, duration: 600, teacherId: 't3', tags: ['внимание', 'еда'] },
  { title: 'Пилатес с кольцом', type: 'pilates', categoryId: 'pilates', level: 2, duration: 2400, teacherId: 't5', tags: ['оборудование', 'тонус'] },
  { title: 'Растяжка после тренировки', type: 'stretch', categoryId: 'stretch', level: 1, duration: 900, teacherId: 't8', tags: ['спорт', 'восстановление'] },
  { title: 'Цигун пять элементов', type: 'qigong', categoryId: 'qigong', level: 2, duration: 2700, teacherId: 't4', tags: ['элементы', 'традиция'] },
  { title: 'Быстрая медитация', type: 'meditation', categoryId: 'meditation', level: 1, duration: 300, teacherId: 't3', tags: ['быстро', '5 минут'] },
  { title: 'Пилатес для тазового дна', type: 'pilates', categoryId: 'pilates', level: 1, duration: 1500, teacherId: 't9', tags: ['здоровье', 'женское'] },
  { title: 'Йога для глаз', type: 'yoga', categoryId: 'yoga', level: 1, duration: 600, teacherId: 't1', tags: ['глаза', 'офис'] },
  { title: 'Танцевальная медитация', type: 'meditation', categoryId: 'meditation', level: 2, duration: 2400, teacherId: 't3', tags: ['движение', 'свобода'] },
];



export const classes: ClassItem[] = classNames.map((c, i) => ({
  id: `c${i + 1}`,
  title: c.title,
  teacherId: c.teacherId,
  categoryId: c.categoryId,
  type: c.type,
  level: c.level,
  durationSec: c.duration,
  posterUrl: getPoster(i),
  videoUrl: '/media/sample.mp4',
  tags: c.tags,
  isNew: i < 12,
  publishedAt: new Date(Date.now() - (60 - i) * 86400000).toISOString(),
  description: `Практика «${c.title}» — это тщательно составленная последовательность, которая поможет вам укрепить тело и успокоить ум. Подходит для ${c.level === 1 ? 'начинающих' : c.level === 2 ? 'продолжающих' : 'продвинутых'} практиков.`,
  equipment: c.type === 'yoga' ? ['Коврик', 'Блок'] : c.type === 'pilates' ? ['Коврик', 'Кольцо'] : ['Коврик'],
}));

export const programs: Program[] = [
  { id: 'p1', title: '30 дней йоги', coverUrl: getPoster(0), teacherId: 't1', categoryIds: ['yoga', 'beginners'], level: 1, classIds: ['c2', 'c5', 'c8', 'c42', 'c9'], isNew: true, description: 'Месячная программа для формирования привычки ежедневной практики' },
  { id: 'p2', title: 'Гибкое тело', coverUrl: getPoster(1), teacherId: 't8', categoryIds: ['stretch', 'yoga'], level: 2, classIds: ['c30', 'c31', 'c33', 'c34'], description: 'Программа для развития гибкости и мобильности суставов' },
  { id: 'p3', title: 'Дыхательная перезагрузка', coverUrl: getPoster(2), teacherId: 't2', categoryIds: ['breathwork'], level: 1, classIds: ['c11', 'c12', 'c13', 'c14', 'c15'], isNew: true, description: 'Научитесь управлять своим состоянием через дыхание' },
  { id: 'p4', title: 'Ум и спокойствие', coverUrl: getPoster(3), teacherId: 't3', categoryIds: ['meditation'], level: 1, classIds: ['c17', 'c18', 'c19', 'c22'], description: 'Путь к внутреннему покою через ежедневную медитацию' },
  { id: 'p5', title: 'Сильный кор', coverUrl: getPoster(4), teacherId: 't5', categoryIds: ['pilates'], level: 2, classIds: ['c25', 'c26', 'c28', 'c54'], description: 'Укрепите мышцы кора за 4 недели' },
  { id: 'p6', title: 'Цигун: путь энергии', coverUrl: getPoster(5), teacherId: 't4', categoryIds: ['qigong'], level: 1, classIds: ['c35', 'c36', 'c37', 'c38'], description: 'Древняя практика для здоровья и долголетия' },
  { id: 'p7', title: 'Идеальный сон', coverUrl: getPoster(6), teacherId: 't10', categoryIds: ['sleep', 'meditation'], level: 1, classIds: ['c39', 'c40', 'c41'], isNew: true, description: 'Вечерние ритуалы для глубокого и качественного сна' },
  { id: 'p8', title: 'Йога для офиса', coverUrl: getPoster(7), teacherId: 't6', categoryIds: ['yoga', 'stretch'], level: 1, classIds: ['c5', 'c9', 'c32', 'c59'], description: 'Быстрые практики для тех, кто много сидит' },
  { id: 'p9', title: 'Продвинутая виньяса', coverUrl: getPoster(0), teacherId: 't7', categoryIds: ['yoga'], level: 3, classIds: ['c1', 'c4', 'c48', 'c49'], description: 'Динамичная практика для опытных йогов' },
  { id: 'p10', title: 'Первые шаги', coverUrl: getPoster(1), teacherId: 't1', categoryIds: ['beginners'], level: 1, classIds: ['c42', 'c43', 'c44', 'c45', 'c46', 'c47'], isNew: true, description: 'Всё, что нужно для начала практики' },
];

export const collections: Collection[] = [
  { id: 'col1', title: 'Утренний ритуал', coverUrl: getPoster(0), items: [{ kind: 'class', id: 'c8' }, { kind: 'class', id: 'c12' }, { kind: 'class', id: 'c30' }], createdBy: 'Редакция' },
  { id: 'col2', title: 'Антистресс', coverUrl: getPoster(2), items: [{ kind: 'class', id: 'c11' }, { kind: 'class', id: 'c17' }, { kind: 'program', id: 'p3' }], createdBy: 'Редакция', isNew: true },
  { id: 'col3', title: 'Для спины', coverUrl: getPoster(4), items: [{ kind: 'class', id: 'c5' }, { kind: 'class', id: 'c27' }, { kind: 'class', id: 'c31' }], createdBy: 'Редакция' },
  { id: 'col4', title: 'Быстрые практики', coverUrl: getPoster(6), items: [{ kind: 'class', id: 'c8' }, { kind: 'class', id: 'c13' }, { kind: 'class', id: 'c32' }, { kind: 'class', id: 'c57' }], createdBy: 'Редакция' },
  { id: 'col5', title: 'Вечернее расслабление', coverUrl: getPoster(3), items: [{ kind: 'class', id: 'c3' }, { kind: 'class', id: 'c39' }, { kind: 'class', id: 'c15' }], createdBy: 'Редакция' },
  { id: 'col6', title: 'Сила и гибкость', coverUrl: getPoster(5), items: [{ kind: 'program', id: 'p2' }, { kind: 'program', id: 'p5' }], createdBy: 'Редакция', isNew: true },
  { id: 'col7', title: 'Энергия на весь день', coverUrl: getPoster(7), items: [{ kind: 'class', id: 'c1' }, { kind: 'class', id: 'c14' }, { kind: 'class', id: 'c35' }], createdBy: 'Редакция' },
  { id: 'col8', title: 'Медитации для сна', coverUrl: getPoster(6), items: [{ kind: 'class', id: 'c22' }, { kind: 'class', id: 'c39' }, { kind: 'class', id: 'c41' }], createdBy: 'Редакция' },
];

function generateLiveEvents(): LiveEvent[] {
  const now = Date.now();
  const events: LiveEvent[] = [
    // 2 ended
    { id: 'l1', title: 'Утренняя медитация', hostId: 't3', coverUrl: getPoster(2), startsAt: new Date(now - 3 * 3600000).toISOString(), durationMin: 30, categoryId: 'meditation', level: 1 },
    { id: 'l2', title: 'Дыхательная практика', hostId: 't2', coverUrl: getPoster(1), startsAt: new Date(now - 1 * 3600000).toISOString(), durationMin: 20, categoryId: 'breathwork', level: 1 },
    // 1 live now
    { id: 'l3', title: 'Виньяса-флоу', hostId: 't7', coverUrl: getPoster(0), startsAt: new Date(now - 5 * 60000).toISOString(), durationMin: 30, categoryId: 'yoga', level: 2 },
    // Upcoming
    { id: 'l4', title: 'Цигун на природе', hostId: 't4', coverUrl: getPoster(5), startsAt: new Date(now + 2 * 3600000).toISOString(), durationMin: 45, categoryId: 'qigong', level: 1 },
    { id: 'l5', title: 'Растяжка после работы', hostId: 't8', coverUrl: getPoster(4), startsAt: new Date(now + 5 * 3600000).toISOString(), durationMin: 30, categoryId: 'stretch', level: 1 },
    { id: 'l6', title: 'Йога-нидра', hostId: 't10', coverUrl: getPoster(6), startsAt: new Date(now + 24 * 3600000).toISOString(), durationMin: 60, categoryId: 'sleep', level: 1 },
    { id: 'l7', title: 'Силовой пилатес', hostId: 't5', coverUrl: getPoster(7), startsAt: new Date(now + 48 * 3600000).toISOString(), durationMin: 45, categoryId: 'pilates', level: 2 },
    { id: 'l8', title: 'Медитация благодарности', hostId: 't3', coverUrl: getPoster(3), startsAt: new Date(now + 72 * 3600000).toISOString(), durationMin: 30, categoryId: 'meditation', level: 1 },
    { id: 'l9', title: 'Хатха-йога', hostId: 't1', coverUrl: getPoster(0), startsAt: new Date(now + 96 * 3600000).toISOString(), durationMin: 60, categoryId: 'yoga', level: 1 },
    { id: 'l10', title: 'Дыхание для энергии', hostId: 't2', coverUrl: getPoster(1), startsAt: new Date(now + 120 * 3600000).toISOString(), durationMin: 30, categoryId: 'breathwork', level: 2 },
    { id: 'l11', title: 'Вечерняя практика', hostId: 't10', coverUrl: getPoster(6), startsAt: new Date(now + 144 * 3600000).toISOString(), durationMin: 45, categoryId: 'sleep', level: 1 },
    { id: 'l12', title: 'Мобильность суставов', hostId: 't6', coverUrl: getPoster(4), startsAt: new Date(now + 168 * 3600000).toISOString(), durationMin: 30, categoryId: 'stretch', level: 1 },
  ];
  return events;
}

export const liveEvents: LiveEvent[] = generateLiveEvents();
