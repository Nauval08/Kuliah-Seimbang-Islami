import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { PrayerCard } from '@/components/PrayerCard';
import { ScheduleList } from '@/components/ScheduleList';
import { ScheduleEditorModal } from '@/components/ScheduleEditorModal';
import {
  ActionButton,
  Page,
  PageHeading,
  Panel,
  SectionTitle,
} from '@/components/ui';
import { useGrowth } from '@/context/GrowthContext';
import { useColors } from '@/hooks/useColors';
import {
  DAY_NAMES,
  getActivitiesForDate,
  getDateKey,
  isLectureDay,
} from '@/lib/growth';
import type { Activity, DayIndex } from '@/lib/growth';

function currentStudySeconds(
  sessions: ReturnType<typeof useGrowth>['data']['sessions'],
  active: ReturnType<typeof useGrowth>['data']['activeSession'],
  dateKey: string,
): number {
  const saved = sessions
    .filter(
      (session) =>
        session.kind === 'mandiri' &&
        getDateKey(new Date(session.startedAt)) === dateKey,
    )
    .reduce((total, session) => total + session.durationSeconds, 0);
  if (
    active?.kind === 'mandiri' &&
    getDateKey(new Date(active.startedAt)) === dateKey
  ) {
    return (
      saved +
      Math.max(0, Math.floor((Date.now() - Date.parse(active.startedAt)) / 1000))
    );
  }
  return saved;
}

function formatClock(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}j ${String(minutes).padStart(2, '0')}m`;
}

export default function TodayScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    data,
    isReady,
    saveError,
    toggleDateRecovery,
    updateActivity,
    addActivity,
    deleteActivity,
  } = useGrowth();
  const [now, setNow] = useState(() => new Date());
  const [editing, setEditing] = useState<{
    day: DayIndex;
    activity: Activity;
    isNew: boolean;
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  const dateKey = getDateKey(now);
  const day = now.getDay() as DayIndex;
  const isClassDay = isLectureDay(day, data.classDays);
  const isRecovery = data.recoveryDates.includes(dateKey);
  const studyDay = data.studyDays.includes(day) && !isClassDay;
  const todaysActivities = useMemo(
    () => getActivitiesForDate(data, now),
    [data, now],
  );
  const dailySeconds = currentStudySeconds(
    data.sessions,
    data.activeSession,
    dateKey,
  );
  const dailyTarget = studyDay ? data.studyTargetMinutes * 60 : 0;
  const progress = dailyTarget ? Math.min(1, dailySeconds / dailyTarget) : 0;

  const openNewActivity = () => {
    const draft: Activity = {
      id: `${day}-draft`,
      title: 'Aktivitas baru',
      startTime: '12:00',
      endTime: '12:30',
      category: 'custom',
    };
    setEditing({ day, activity: draft, isNew: true });
  };

  return (
    <Page>
      <PageHeading
        eyebrow="My Daily Growth"
        title={`Selamat ${now.getHours() < 11 ? 'pagi' : now.getHours() < 15 ? 'siang' : now.getHours() < 18 ? 'sore' : 'malam'}`}
        subtitle={now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      />

      <Panel
        style={{
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          padding: 19,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <View style={{ flex: 1, gap: 5 }}>
            <Text
              style={{
                color: colors.primaryForeground,
                fontSize: 12,
                fontFamily: 'Inter_500Medium',
              }}
            >
              HARI INI · {DAY_NAMES[day].toUpperCase()}
            </Text>
            <Text
              style={{
                color: colors.primaryForeground,
                fontSize: 23,
                lineHeight: 28,
                fontFamily: 'Inter_700Bold',
              }}
            >
              {isClassDay ? 'Hari kuliah' : 'Hari tanpa kuliah'}
            </Text>
            <Text
              style={{
                color: colors.primaryForeground,
                opacity: 0.82,
                fontSize: 12,
                lineHeight: 18,
                fontFamily: 'Inter_400Regular',
              }}
            >
              {isClassDay
                ? 'Kuliah formal dimulai saat Magrib. Belajar mandiri bukan kewajiban hari ini.'
                : studyDay
                  ? 'Target belajar mandiri hanya berlaku pada hari yang kamu pilih.'
                  : 'Hari ini tidak memiliki target belajar mandiri.'}
            </Text>
          </View>
          <Feather
            name={isClassDay ? 'book-open' : 'sun'}
            size={28}
            color={colors.primaryForeground}
          />
        </View>
        {studyDay ? (
          <View style={{ gap: 8, marginTop: 6 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: colors.primaryForeground,
                  fontSize: 12,
                  fontFamily: 'Inter_500Medium',
                }}
              >
                Belajar efektif hari ini
              </Text>
              <Text
                style={{
                  color: colors.primaryForeground,
                  fontSize: 12,
                  fontFamily: 'Inter_600SemiBold',
                }}
              >
                {formatClock(dailySeconds)} / {data.studyTargetMinutes / 60}j
              </Text>
            </View>
            <View
              style={{
                height: 7,
                borderRadius: 99,
                overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.25)',
              }}
            >
              <View
                style={{
                  width: `${progress * 100}%`,
                  height: '100%',
                  backgroundColor: colors.primaryForeground,
                }}
              />
            </View>
          </View>
        ) : null}
      </Panel>

      {saveError ? (
        <Panel>
          <Text
            style={{
              color: colors.destructive,
              fontSize: 13,
              lineHeight: 19,
              fontFamily: 'Inter_500Medium',
            }}
          >
            {saveError}
          </Text>
        </Panel>
      ) : null}

      <PrayerCard date={now} />

      <Panel>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <SectionTitle
            title="Rencana hari ini"
            detail={
              isReady
                ? 'Kegiatan menyesuaikan jenis harinya.'
                : 'Memuat jadwal tersimpan...'
            }
          />
          <Link href="/week" asChild>
            <Pressable
              accessibilityRole="link"
              style={({ pressed }) => ({
                opacity: pressed ? 0.65 : 1,
                padding: 5,
              })}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 12,
                  fontFamily: 'Inter_600SemiBold',
                }}
              >
                Pekan
              </Text>
            </Pressable>
          </Link>
        </View>
        <ScheduleList
          activities={todaysActivities}
          day={day}
          now={now}
          onEdit={(activity) => setEditing({ day, activity, isNew: false })}
        />
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <ActionButton
            label="Tambah kegiatan"
            icon="plus"
            tone="secondary"
            compact
            onPress={openNewActivity}
          />
          <ActionButton
            label={isRecovery ? 'Pemulihan aktif' : 'Tandai pemulihan'}
            icon={isRecovery ? 'check-circle' : 'heart'}
            tone={isRecovery ? 'primary' : 'ghost'}
            compact
            onPress={() => toggleDateRecovery(dateKey)}
          />
        </View>
        {isRecovery ? (
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 11,
              lineHeight: 17,
              fontFamily: 'Inter_400Regular',
            }}
          >
            Latihan hari ini diganti dengan gerak ringan dan pemulihan.
          </Text>
        ) : null}
      </Panel>

      <ActionButton
        label={data.activeSession ? 'Lanjutkan sesi belajar' : 'Buka timer belajar'}
        icon="play"
        onPress={() => router.push('/study')}
      />

      <ScheduleEditorModal
        key={editing ? `${editing.day}-${editing.activity.id}` : 'closed'}
        visible={editing !== null}
        day={editing?.day ?? day}
        activity={editing?.activity ?? null}
        isNew={editing?.isNew ?? false}
        onClose={() => setEditing(null)}
        onSave={(values) => {
          if (!editing) return;
          if (editing.isNew) {
            const created = addActivity(editing.day);
            updateActivity(editing.day, { ...created, ...values });
          } else {
            updateActivity(editing.day, { ...editing.activity, ...values });
          }
          setEditing(null);
        }}
        onDelete={
          editing && !editing.isNew
            ? () => {
                deleteActivity(editing.day, editing.activity.id);
                setEditing(null);
              }
            : undefined
        }
      />
    </Page>
  );
}
