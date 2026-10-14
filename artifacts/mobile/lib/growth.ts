export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type ActivityCategory =
  | 'worship'
  | 'health'
  | 'food'
  | 'home'
  | 'productive'
  | 'class'
  | 'study'
  | 'rest'
  | 'custom';
export type PrayerAnchor = 'fajr' | 'maghrib';
export type FitnessLevel = 'pemula' | 'menengah' | 'lanjutan';
export type SessionKind = 'mandiri' | 'kuliah';

export interface Activity {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: ActivityCategory;
  startAnchor?: PrayerAnchor;
  anchorDurationMinutes?: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PrayerTimes {
  dateKey: string;
  coordinates: Coordinates;
  timezone: string;
  fetchedAt: string;
  times: {
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  };
}

export interface StudyNote {
  id: string;
  kind: SessionKind;
  title: string;
  content: string;
  createdAt: string;
}

export interface StudySession {
  id: string;
  kind: SessionKind;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
}

export interface ActiveStudySession {
  kind: SessionKind;
  startedAt: string;
}

export interface GrowthData {
  schedules: Record<string, Activity[]>;
  classDays: DayIndex[];
  studyTargetMinutes: number;
  studyDays: DayIndex[];
  workoutDays: DayIndex[];
  recoveryDays: DayIndex[];
  fitnessLevel: FitnessLevel;
  coordinates: Coordinates | null;
  prayerByDate: Record<string, PrayerTimes>;
  notes: StudyNote[];
  sessions: StudySession[];
  activeSession: ActiveStudySession | null;
  recoveryDates: string[];
}

export const DAY_NAMES = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

export const DAY_SHORT_NAMES = [
  'Min',
  'Sen',
  'Sel',
  'Rab',
  'Kam',
  'Jum',
  'Sab',
] as const;

export const WEEK_ORDER: DayIndex[] = [1, 2, 3, 4, 5, 6, 0];
export const LECTURE_DAYS: DayIndex[] = [1, 3, 4];

export function isLectureDay(
  day: number,
  lectureDays: DayIndex[] = LECTURE_DAYS,
): day is DayIndex {
  return lectureDays.includes(day as DayIndex);
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function timeToMinutes(time: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function addMinutes(time: string, minutes: number): string {
  const total = (timeToMinutes(time) + minutes + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(
    total % 60,
  ).padStart(2, '0')}`;
}

export function durationBetween(start: string, end: string): number {
  const difference = timeToMinutes(end) - timeToMinutes(start);
  return difference > 0 ? difference : difference + 1440;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} menit`;
  if (!remainder) return `${hours} jam`;
  return `${hours} jam ${remainder} menit`;
}

function activity(
  day: number,
  id: string,
  title: string,
  startTime: string,
  endTime: string,
  category: ActivityCategory,
  startAnchor?: PrayerAnchor,
): Activity {
  return {
    id: `${day}-${id}`,
    title,
    startTime,
    endTime,
    category,
    ...(startAnchor ? { startAnchor } : {}),
  };
}

export function createScheduleForDay(
  day: DayIndex,
  workout: boolean,
  recovery: boolean,
  study: boolean,
  studyTargetMinutes: number,
  lecture: boolean = isLectureDay(day),
): Activity[] {
  const movement = workout
    ? activity(
        day,
        'movement',
        'Latihan kebugaran',
        '05:45',
        addMinutes('05:45', workoutDuration('pemula')),
        'health',
      )
    : activity(
        day,
        'movement',
        recovery ? 'Mobilitas ringan & pemulihan' : 'Gerak ringan',
        '05:45',
        '06:00',
        'health',
      );

  const morningEnd = workout ? '06:30' : '06:00';
  const schedule: Activity[] = [
    {
      ...activity(
      day,
      'worship',
      'Ibadah pagi',
      '05:00',
      '05:30',
      'worship',
      'fajr',
      ),
      anchorDurationMinutes: 30,
    },
    movement,
    activity(day, 'breakfast', 'Sarapan', morningEnd, addMinutes(morningEnd, 30), 'food'),
    activity(
      day,
      'hygiene',
      'Mandi & kebersihan diri',
      addMinutes(morningEnd, 30),
      addMinutes(morningEnd, 60),
      'home',
    ),
    activity(day, 'focus-am', 'Aktivitas produktif', '08:30', '11:30', 'productive'),
    activity(day, 'lunch', 'Makan siang', '11:30', '12:15', 'food'),
    activity(day, 'rest-midday', 'Istirahat', '12:15', '13:15', 'rest'),
  ];

  if (lecture) {
    schedule.push(
      activity(day, 'focus-pm', 'Produktivitas & persiapan tugas', '13:15', '15:00', 'productive'),
      activity(day, 'household', 'Membantu pekerjaan rumah', '15:00', '15:40', 'home'),
      activity(day, 'reset', 'Istirahat & persiapan berangkat', '15:40', '17:35', 'rest'),
      activity(day, 'lecture', 'Kuliah formal', '18:00', '22:00', 'class', 'maghrib'),
      activity(day, 'sleep', 'Istirahat & tidur setelah kuliah', '22:15', '05:15', 'rest'),
    );
  } else {
    schedule.push(
      activity(day, 'focus-pm', 'Aktivitas produktif', '13:15', '15:00', 'productive'),
      activity(day, 'family', 'Membantu keluarga', '15:30', '16:30', 'home'),
      activity(day, 'cleaning', 'Menjaga kebersihan rumah', '16:30', '17:00', 'home'),
    );
    if (study) {
      const start = addMinutes('22:00', -studyTargetMinutes);
      schedule.push(
        activity(day, 'study', 'Belajar IT mandiri', start, '22:00', 'study'),
      );
    }
    schedule.push(
      activity(day, 'sleep', 'Istirahat & tidur', '22:00', '05:00', 'rest'),
    );
  }

  return schedule;
}

export function workoutDuration(level: FitnessLevel): number {
  if (level === 'lanjutan') return 60;
  if (level === 'menengah') return 45;
  return 30;
}

export function createDefaultGrowthData(): GrowthData {
  const classDays: DayIndex[] = [...LECTURE_DAYS];
  const studyDays: DayIndex[] = [0, 2, 5, 6];
  const workoutDays: DayIndex[] = [2, 6];
  const recoveryDays: DayIndex[] = [0, 1, 3, 4, 5];
  const schedules: Record<string, Activity[]> = {};

  for (let day = 0; day < 7; day += 1) {
    const dayIndex = day as DayIndex;
    schedules[String(day)] = createScheduleForDay(
      dayIndex,
      workoutDays.includes(dayIndex),
      recoveryDays.includes(dayIndex),
      studyDays.includes(dayIndex),
      240,
      isLectureDay(dayIndex, classDays),
    );
  }

  return {
    schedules,
    classDays,
    studyTargetMinutes: 240,
    studyDays,
    workoutDays,
    recoveryDays,
    fitnessLevel: 'pemula',
    coordinates: null,
    prayerByDate: {},
    notes: [],
    sessions: [],
    activeSession: null,
    recoveryDates: [],
  };
}

export function getActivitiesForDate(
  data: GrowthData,
  date: Date,
): Activity[] {
  const day = date.getDay() as DayIndex;
  const dateKey = getDateKey(date);
  const prayer = data.prayerByDate[dateKey];
  const inRecovery = data.recoveryDates.includes(dateKey);

  return [...(data.schedules[String(day)] ?? [])]
    .map((item) => {
      if (inRecovery && item.id.endsWith('-movement')) {
        return {
          ...item,
          title: 'Pemulihan tubuh · gerak ringan',
          endTime: addMinutes(item.startTime, 15),
        };
      }
      if (!item.startAnchor || !prayer) return item;
      const startTime =
        item.startAnchor === 'fajr'
          ? prayer.times.fajr
          : prayer.times.maghrib;
      return {
        ...item,
        startTime,
        ...(item.startAnchor === 'fajr'
          ? {
              endTime: addMinutes(
                startTime,
                item.anchorDurationMinutes ?? 30,
              ),
            }
          : {}),
      };
    })
    .sort((left, right) => {
      const leftTime = left.startAnchor ? left.startTime : left.startTime;
      const rightTime = right.startAnchor ? right.startTime : right.startTime;
      return timeToMinutes(leftTime) - timeToMinutes(rightTime);
    });
}
