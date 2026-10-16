import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import {
  addMinutes,
  createScheduleForDay,
  createDefaultGrowthData,
  durationBetween,
  isLectureDay,
  workoutDuration,
} from '@/lib/growth';
import type {
  Activity,
  ActiveStudySession,
  Coordinates,
  DayIndex,
  FitnessLevel,
  GrowthData,
  PrayerTimes,
  SessionKind,
  StudyNote,
  StudySession,
} from '@/lib/growth';

const STORAGE_KEY = 'my-daily-growth-v1';

interface GrowthContextValue {
  data: GrowthData;
  isReady: boolean;
  saveError: string | null;
  updateActivity: (day: DayIndex, activity: Activity) => void;
  toggleActivityCompletion: (dateKey: string, activityId: string) => void;
  addActivity: (day: DayIndex) => Activity;
  deleteActivity: (day: DayIndex, id: string) => void;
  toggleClassDay: (day: DayIndex) => void;
  setStudyTargetMinutes: (minutes: number) => void;
  toggleStudyDay: (day: DayIndex) => void;
  toggleWorkoutDay: (day: DayIndex) => void;
  toggleRecoveryDay: (day: DayIndex) => void;
  setFitnessLevel: (level: FitnessLevel) => void;
  setCoordinates: (coordinates: Coordinates) => void;
  savePrayerTimes: (prayer: PrayerTimes) => void;
  toggleDateRecovery: (dateKey: string) => void;
  addNote: (note: Pick<StudyNote, 'kind' | 'title' | 'content'>) => void;
  deleteNote: (id: string) => void;
  startSession: (kind: SessionKind) => void;
  stopSession: () => void;
}

const GrowthContext = createContext<GrowthContextValue | null>(null);

function normalizeStoredData(value: unknown): GrowthData {
  const defaults = createDefaultGrowthData();
  if (!value || typeof value !== 'object') return defaults;
  const incoming = value as Partial<GrowthData>;
  const incomingSchedules =
    incoming.schedules && typeof incoming.schedules === 'object'
      ? incoming.schedules
      : {};

  const schedules = { ...defaults.schedules };
  for (let day = 0; day < 7; day += 1) {
    const savedDay = incomingSchedules[String(day)];
    if (Array.isArray(savedDay)) schedules[String(day)] = savedDay;
  }
  const savedCompletions =
    incoming.activityCompletions &&
    typeof incoming.activityCompletions === 'object'
      ? incoming.activityCompletions
      : {};
  const activityCompletions = Object.fromEntries(
    Object.entries(savedCompletions).flatMap(([dateKey, ids]) =>
      Array.isArray(ids)
        ? [[dateKey, ids.filter((id): id is string => typeof id === 'string')]]
        : [],
    ),
  );

  return {
    ...defaults,
    ...incoming,
    schedules,
    activityCompletions,
    classDays: Array.isArray(incoming.classDays)
      ? incoming.classDays
      : defaults.classDays,
    studyDays: Array.isArray(incoming.studyDays)
      ? incoming.studyDays
      : defaults.studyDays,
    workoutDays: Array.isArray(incoming.workoutDays)
      ? incoming.workoutDays
      : defaults.workoutDays,
    recoveryDays: Array.isArray(incoming.recoveryDays)
      ? incoming.recoveryDays
      : defaults.recoveryDays,
    prayerByDate:
      incoming.prayerByDate && typeof incoming.prayerByDate === 'object'
        ? incoming.prayerByDate
        : {},
    notes: Array.isArray(incoming.notes) ? incoming.notes : [],
    sessions: Array.isArray(incoming.sessions) ? incoming.sessions : [],
    recoveryDates: Array.isArray(incoming.recoveryDates)
      ? incoming.recoveryDates
      : [],
    activeSession: incoming.activeSession ?? null,
  };
}

function syncStudyEvents(
  schedules: Record<string, Activity[]>,
  days: DayIndex[],
  targetMinutes: number,
  classDays: DayIndex[],
): Record<string, Activity[]> {
  const next = { ...schedules };
  for (let day = 0; day < 7; day += 1) {
    const dayIndex = day as DayIndex;
    const activities = [...(next[String(day)] ?? [])].filter(
      (item) => item.category !== 'study',
    );
    if (days.includes(dayIndex) && !isLectureDay(dayIndex, classDays)) {
      const startTime = addMinutes('22:00', -targetMinutes);
      activities.push({
        id: `${day}-study`,
        title: 'Belajar IT mandiri',
        startTime,
        endTime: '22:00',
        category: 'study',
      });
    }
    next[String(day)] = activities;
  }
  return next;
}

function updateMovement(
  schedules: Record<string, Activity[]>,
  day: DayIndex,
  workout: boolean,
  recovery: boolean,
  fitnessLevel: FitnessLevel,
): Record<string, Activity[]> {
  const next = { ...schedules };
  const dayActivities = [...(next[String(day)] ?? [])];
  const movementId = `${day}-movement`;
  const current = dayActivities.find((item) => item.id === movementId);
  const nextMovement: Activity = workout
    ? {
        id: movementId,
        title: 'Latihan kebugaran',
        startTime: '05:45',
        endTime: addMinutes('05:45', workoutDuration(fitnessLevel)),
        category: 'health',
      }
    : {
        id: movementId,
        title: recovery ? 'Mobilitas ringan & pemulihan' : 'Gerak ringan',
        startTime: '05:45',
        endTime: '06:00',
        category: 'health',
      };

  if (current) {
    next[String(day)] = dayActivities.map((item) =>
      item.id === movementId ? nextMovement : item,
    );
  } else {
    next[String(day)] = [...dayActivities, nextMovement];
  }
  return next;
}

export function GrowthProvider({ children }: React.PropsWithChildren) {
  const [data, setData] = useState<GrowthData>(createDefaultGrowthData);
  const [isReady, setIsReady] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
        if (stored) {
          try {
            setData(normalizeStoredData(JSON.parse(stored) as unknown));
          } catch {
            setSaveError('Jadwal tersimpan tidak bisa dibaca. Data awal dimuat.');
          }
        }
        setIsReady(true);
      })
      .catch(() => {
        if (!mounted) return;
        setSaveError('Penyimpanan lokal tidak dapat dibaca.');
        setIsReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      .then(() => setSaveError(null))
      .catch(() => setSaveError('Perubahan belum berhasil disimpan di perangkat.'));
  }, [data, isReady]);

  const replaceData = useCallback((update: (current: GrowthData) => GrowthData) => {
    setData((current) => update(current));
  }, []);

  const updateActivity = useCallback(
    (day: DayIndex, activity: Activity) => {
      replaceData((current) => {
        if (activity.category === 'study' && isLectureDay(day, current.classDays)) {
          return current;
        }
        const schedules = {
          ...current.schedules,
          [String(day)]: (current.schedules[String(day)] ?? []).map((item) =>
            item.id === activity.id ? activity : item,
          ),
        };
        if (activity.category === 'study') {
          const studyTargetMinutes = durationBetween(
            activity.startTime,
            activity.endTime,
          );
          const studyDays = current.studyDays.includes(day)
            ? current.studyDays
            : [...current.studyDays, day];
          const syncedSchedules = syncStudyEvents(
            schedules,
            studyDays,
            studyTargetMinutes,
            current.classDays,
          );
          syncedSchedules[String(day)] = (
            syncedSchedules[String(day)] ?? []
          ).map((item) => (item.id === activity.id ? activity : item));
          return {
            ...current,
            studyDays,
            studyTargetMinutes,
            schedules: syncedSchedules,
          };
        }
        return { ...current, schedules };
      });
    },
    [replaceData],
  );

  const toggleActivityCompletion = useCallback(
    (dateKey: string, activityId: string) => {
      replaceData((current) => {
        const completions = new Set(
          current.activityCompletions[dateKey] ?? [],
        );
        if (completions.has(activityId)) {
          completions.delete(activityId);
        } else {
          completions.add(activityId);
        }
        const activityCompletions = { ...current.activityCompletions };
        if (completions.size) {
          activityCompletions[dateKey] = [...completions];
        } else {
          delete activityCompletions[dateKey];
        }
        return { ...current, activityCompletions };
      });
    },
    [replaceData],
  );

  const addActivity = useCallback(
    (day: DayIndex) => {
      const created: Activity = {
        id: `${day}-custom-${Date.now()}`,
        title: 'Aktivitas baru',
        startTime: '12:00',
        endTime: '12:30',
        category: 'custom',
      };
      replaceData((current) => ({
        ...current,
        schedules: {
          ...current.schedules,
          [String(day)]: [...(current.schedules[String(day)] ?? []), created],
        },
      }));
      return created;
    },
    [replaceData],
  );

  const deleteActivity = useCallback(
    (day: DayIndex, id: string) => {
      replaceData((current) => {
        const item = (current.schedules[String(day)] ?? []).find(
          (activity) => activity.id === id,
        );
        const schedules = {
          ...current.schedules,
          [String(day)]: (current.schedules[String(day)] ?? []).filter(
            (activity) => activity.id !== id,
          ),
        };
        if (item?.category === 'study') {
          return {
            ...current,
            schedules,
            studyDays: current.studyDays.filter((value) => value !== day),
          };
        }
        return { ...current, schedules };
      });
    },
    [replaceData],
  );

  const toggleClassDay = useCallback(
    (day: DayIndex) => {
      replaceData((current) => {
        const classDays = current.classDays.includes(day)
          ? current.classDays.filter((value) => value !== day)
          : [...current.classDays, day];
        const studyDays = current.studyDays.filter(
          (value) => !classDays.includes(value),
        );
        const schedules = syncStudyEvents(
          current.schedules,
          studyDays,
          current.studyTargetMinutes,
          classDays,
        );
        const existing = current.schedules[String(day)] ?? [];
        const defaults = createScheduleForDay(
          day,
          current.workoutDays.includes(day),
          current.recoveryDays.includes(day),
          studyDays.includes(day),
          current.studyTargetMinutes,
          classDays.includes(day),
        );
        const mergedDefaults = defaults.map((item) => {
          const saved = existing.find((value) => value.id === item.id);
          return saved ? { ...item, ...saved } : item;
        });
        const custom = existing.filter((item) =>
          item.id.includes('-custom-'),
        );
        schedules[String(day)] = [
          ...mergedDefaults,
          ...custom.filter(
            (item) => !mergedDefaults.some((value) => value.id === item.id),
          ),
        ];
        return { ...current, classDays, studyDays, schedules };
      });
    },
    [replaceData],
  );

  const setStudyTargetMinutes = useCallback(
    (minutes: number) => {
      const targetMinutes = Math.max(30, Math.min(720, Math.round(minutes / 30) * 30));
      replaceData((current) => ({
        ...current,
        studyTargetMinutes: targetMinutes,
        schedules: syncStudyEvents(
          current.schedules,
          current.studyDays,
          targetMinutes,
          current.classDays,
        ),
      }));
    },
    [replaceData],
  );

  const toggleStudyDay = useCallback(
    (day: DayIndex) => {
      replaceData((current) => {
        if (isLectureDay(day, current.classDays)) return current;
        const studyDays = current.studyDays.includes(day)
          ? current.studyDays.filter((value) => value !== day)
          : [...current.studyDays, day];
        return {
          ...current,
          studyDays,
          schedules: syncStudyEvents(
            current.schedules,
            studyDays,
            current.studyTargetMinutes,
            current.classDays,
          ),
        };
      });
    },
    [replaceData],
  );

  const toggleWorkoutDay = useCallback(
    (day: DayIndex) => {
      replaceData((current) => {
        const workout = !current.workoutDays.includes(day);
        const workoutDays = workout
          ? [...current.workoutDays, day]
          : current.workoutDays.filter((value) => value !== day);
        const recoveryDays = workout
          ? current.recoveryDays.filter((value) => value !== day)
          : current.recoveryDays;
        return {
          ...current,
          workoutDays,
          recoveryDays,
          schedules: updateMovement(
            current.schedules,
            day,
            workout,
            recoveryDays.includes(day),
            current.fitnessLevel,
          ),
        };
      });
    },
    [replaceData],
  );

  const toggleRecoveryDay = useCallback(
    (day: DayIndex) => {
      replaceData((current) => {
        const recovery = !current.recoveryDays.includes(day);
        const recoveryDays = recovery
          ? [...current.recoveryDays, day]
          : current.recoveryDays.filter((value) => value !== day);
        const workoutDays = recovery
          ? current.workoutDays.filter((value) => value !== day)
          : current.workoutDays;
        return {
          ...current,
          recoveryDays,
          workoutDays,
          schedules: updateMovement(
            current.schedules,
            day,
            workoutDays.includes(day),
            recovery,
            current.fitnessLevel,
          ),
        };
      });
    },
    [replaceData],
  );

  const setFitnessLevel = useCallback(
    (level: FitnessLevel) => {
      replaceData((current) => {
        let schedules = current.schedules;
        for (const day of current.workoutDays) {
          const movement = (schedules[String(day)] ?? []).find((item) =>
            item.id.endsWith('-movement'),
          );
          if (!movement) continue;
          schedules = {
            ...schedules,
            [String(day)]: (schedules[String(day)] ?? []).map((item) =>
              item.id === movement.id
                ? {
                    ...item,
                    endTime: addMinutes(
                      item.startTime,
                      workoutDuration(level),
                    ),
                  }
                : item,
            ),
          };
        }
        return { ...current, fitnessLevel: level, schedules };
      });
    },
    [replaceData],
  );

  const setCoordinates = useCallback(
    (coordinates: Coordinates) =>
      replaceData((current) => ({ ...current, coordinates })),
    [replaceData],
  );

  const savePrayerTimes = useCallback(
    (prayer: PrayerTimes) =>
      replaceData((current) => ({
        ...current,
        prayerByDate: {
          ...current.prayerByDate,
          [prayer.dateKey]: prayer,
        },
      })),
    [replaceData],
  );

  const toggleDateRecovery = useCallback(
    (dateKey: string) =>
      replaceData((current) => ({
        ...current,
        recoveryDates: current.recoveryDates.includes(dateKey)
          ? current.recoveryDates.filter((value) => value !== dateKey)
          : [...current.recoveryDates, dateKey],
      })),
    [replaceData],
  );

  const addNote = useCallback(
    (note: Pick<StudyNote, 'kind' | 'title' | 'content'>) =>
      replaceData((current) => ({
        ...current,
        notes: [
          {
            ...note,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
          },
          ...current.notes,
        ],
      })),
    [replaceData],
  );

  const deleteNote = useCallback(
    (id: string) =>
      replaceData((current) => ({
        ...current,
        notes: current.notes.filter((note) => note.id !== id),
      })),
    [replaceData],
  );

  const startSession = useCallback((kind: SessionKind) => {
    if (dataRef.current.activeSession) return;
    const activeSession: ActiveStudySession = {
      kind,
      startedAt: new Date().toISOString(),
    };
    replaceData((current) => ({ ...current, activeSession }));
  }, [replaceData]);

  const stopSession = useCallback(() => {
    const activeSession = dataRef.current.activeSession;
    if (!activeSession) return;
    const endedAt = new Date();
    const durationSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - Date.parse(activeSession.startedAt)) / 1000),
    );
    const session: StudySession = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: activeSession.kind,
      startedAt: activeSession.startedAt,
      endedAt: endedAt.toISOString(),
      durationSeconds,
    };
    replaceData((current) => {
      if (!current.activeSession) return current;
      const next = {
        ...current,
        activeSession: null,
        sessions: [session, ...current.sessions],
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
        setSaveError('Sesi selesai, tetapi gagal disimpan di perangkat.');
      });
      return next;
    });
  }, [replaceData]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') stopSession();
    });
    return () => subscription.remove();
  }, [stopSession]);

  const value = useMemo<GrowthContextValue>(
    () => ({
      data,
      isReady,
      saveError,
      updateActivity,
      toggleActivityCompletion,
      addActivity,
      deleteActivity,
      toggleClassDay,
      setStudyTargetMinutes,
      toggleStudyDay,
      toggleWorkoutDay,
      toggleRecoveryDay,
      setFitnessLevel,
      setCoordinates,
      savePrayerTimes,
      toggleDateRecovery,
      addNote,
      deleteNote,
      startSession,
      stopSession,
    }),
    [
      data,
      isReady,
      saveError,
      updateActivity,
      toggleActivityCompletion,
      addActivity,
      deleteActivity,
      toggleClassDay,
      setStudyTargetMinutes,
      toggleStudyDay,
      toggleWorkoutDay,
      toggleRecoveryDay,
      setFitnessLevel,
      setCoordinates,
      savePrayerTimes,
      toggleDateRecovery,
      addNote,
      deleteNote,
      startSession,
      stopSession,
    ],
  );

  return <GrowthContext.Provider value={value}>{children}</GrowthContext.Provider>;
}

export function useGrowth(): GrowthContextValue {
  const context = useContext(GrowthContext);
  if (!context) {
    throw new Error('useGrowth harus digunakan di dalam GrowthProvider.');
  }
  return context;
}
