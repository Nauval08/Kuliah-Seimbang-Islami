import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScheduleEditorModal } from '@/components/ScheduleEditorModal';
import { ScheduleList } from '@/components/ScheduleList';
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
  DAY_SHORT_NAMES,
  getActivityProgress,
  getActivitiesForDate,
  getDateKey,
  isLectureDay,
  WEEK_ORDER,
} from '@/lib/growth';
import type { Activity, DayIndex } from '@/lib/growth';

function createCurrentWeek(): Date[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return WEEK_ORDER.map((day) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + ((day + 6) % 7));
    return date;
  });
}

export default function WeekScreen() {
  const colors = useColors();
  const {
    data,
    updateActivity,
    toggleActivityCompletion,
    addActivity,
    deleteActivity,
  } = useGrowth();
  const week = useMemo(() => createCurrentWeek(), []);
  const todayKey = getDateKey(new Date());
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const selectedDate =
    week.find((date) => getDateKey(date) === selectedKey) ?? week[0];
  const day = selectedDate.getDay() as DayIndex;
  const classDay = isLectureDay(day, data.classDays);
  const activities = getActivitiesForDate(data, selectedDate);
  const selectedProgress = getActivityProgress(data, selectedDate);
  const weeklyProgress = useMemo(
    () =>
      week.reduce(
        (total, date) => {
          const progress = getActivityProgress(data, date);
          return {
            completed: total.completed + progress.completed,
            total: total.total + progress.total,
          };
        },
        { completed: 0, total: 0 },
      ),
    [data, week],
  );
  const [editing, setEditing] = useState<{
    activity: Activity;
    isNew: boolean;
  } | null>(null);

  const openNewActivity = () => {
    setEditing({
      activity: {
        id: `${day}-draft`,
        title: 'Aktivitas baru',
        startTime: '12:00',
        endTime: '12:30',
        category: 'custom',
      },
      isNew: true,
    });
  };

  return (
    <Page>
      <PageHeading
        eyebrow="Ritme mingguan"
        title="Kalender pekan"
        subtitle="Kuliah formal hanya Senin, Rabu, dan Kamis. Pilih hari untuk melihat rencananya."
      />

      <Panel>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <SectionTitle
            title={selectedDate.toLocaleDateString('id-ID', {
              month: 'long',
              year: 'numeric',
            })}
            detail="Pilih tanggal untuk menampilkan jadwalnya."
          />
          <Feather name="calendar" color={colors.primary} size={20} />
        </View>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {week.map((date) => {
            const dateKey = getDateKey(date);
            const selected = dateKey === selectedKey;
            const isToday = dateKey === todayKey;
            const dayIndex = date.getDay() as DayIndex;
            const lecture = isLectureDay(dayIndex, data.classDays);
            return (
              <Pressable
                key={dateKey}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${DAY_NAMES[dayIndex]}, ${date.getDate()} ${lecture ? 'hari kuliah' : 'hari tanpa kuliah'}`}
                onPress={() => setSelectedKey(dateKey)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    minHeight: 76,
                    paddingVertical: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: selected
                      ? colors.primary
                      : isToday
                        ? colors.accent
                        : colors.border,
                    backgroundColor: selected
                      ? colors.primary
                      : colors.background,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? colors.primaryForeground : colors.mutedForeground,
                    fontSize: 9,
                    fontFamily: 'Inter_500Medium',
                  }}
                >
                  {DAY_SHORT_NAMES[dayIndex]}
                </Text>
                <Text
                  style={{
                    color: selected ? colors.primaryForeground : colors.foreground,
                    fontSize: 16,
                    fontFamily: 'Inter_700Bold',
                  }}
                >
                  {date.getDate()}
                </Text>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 4,
                    backgroundColor: selected
                      ? colors.primaryForeground
                      : lecture
                        ? colors.primary
                        : colors.accent,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              backgroundColor: colors.secondary,
              borderRadius: 99,
              paddingHorizontal: 11,
              paddingVertical: 7,
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 5,
                backgroundColor: colors.primary,
              }}
            />
            <Text
              style={{
                color: colors.secondaryForeground,
                fontSize: 11,
                fontFamily: 'Inter_500Medium',
              }}
            >
              Hari kuliah
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              backgroundColor: colors.secondary,
              borderRadius: 99,
              paddingHorizontal: 11,
              paddingVertical: 7,
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 5,
                backgroundColor: colors.accent,
              }}
            />
            <Text
              style={{
                color: colors.secondaryForeground,
                fontSize: 11,
                fontFamily: 'Inter_500Medium',
              }}
            >
              Tanpa kuliah
            </Text>
          </View>
        </View>
      </Panel>

      <Panel>
        <SectionTitle
          title="Rekap pekan ini"
          detail="Lihat konsistensi kegiatan tanpa target beruntun atau penalti saat istirahat."
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: 'Inter_400Regular' }}>
            Kegiatan terlaksana
          </Text>
          <Text style={{ color: colors.primary, fontSize: 17, fontFamily: 'Inter_700Bold' }}>
            {weeklyProgress.completed}/{weeklyProgress.total}
          </Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Kemajuan kegiatan pekan ini"
          accessibilityValue={{
            min: 0,
            max: weeklyProgress.total,
            now: weeklyProgress.completed,
          }}
          style={{
            height: 7,
            borderRadius: 99,
            overflow: 'hidden',
            backgroundColor: colors.secondary,
          }}
        >
          <View
            style={{
              width: `${weeklyProgress.total ? (weeklyProgress.completed / weeklyProgress.total) * 100 : 0}%`,
              height: '100%',
              backgroundColor: colors.primary,
            }}
          />
        </View>
      </Panel>

      <Panel
        style={{
          backgroundColor: classDay ? colors.secondary : colors.card,
        }}
      >
        <View style={{ gap: 5 }}>
          <Text
            style={{
              color: colors.foreground,
              fontSize: 21,
              fontFamily: 'Inter_700Bold',
            }}
          >
            {DAY_NAMES[day]}, {selectedDate.getDate()}
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 13,
              lineHeight: 19,
              fontFamily: 'Inter_400Regular',
            }}
          >
            {classDay
              ? 'Kuliah formal berlangsung dari Magrib hingga pukul 22.00. Tidak ada kewajiban belajar mandiri empat jam.'
              : data.studyDays.includes(day)
                ? `Hari belajar mandiri · target ${data.studyTargetMinutes / 60} jam efektif.`
                : 'Hari tanpa target belajar mandiri. Atur hari target di Pengaturan.'}
          </Text>
          <Text
            style={{
              color: colors.primary,
              fontSize: 12,
              fontFamily: 'Inter_600SemiBold',
            }}
          >
            Kegiatan terlaksana · {selectedProgress.completed}/{selectedProgress.total}
          </Text>
        </View>
        <ScheduleList
          activities={activities}
          day={day}
          completedActivityIds={data.activityCompletions[selectedKey] ?? []}
          onToggleComplete={(activity) =>
            toggleActivityCompletion(selectedKey, activity.id)
          }
          now={
            selectedKey === todayKey
              ? new Date()
              : undefined
          }
          onEdit={(activity) => setEditing({ activity, isNew: false })}
        />
        <ActionButton
          label="Tambah kegiatan"
          icon="plus"
          tone="secondary"
          onPress={openNewActivity}
        />
      </Panel>

      <ScheduleEditorModal
        key={editing ? `${day}-${editing.activity.id}` : 'closed'}
        visible={editing !== null}
        day={day}
        activity={editing?.activity ?? null}
        isNew={editing?.isNew ?? false}
        onClose={() => setEditing(null)}
        onSave={(values) => {
          if (!editing) return;
          if (editing.isNew) {
            const created = addActivity(day);
            updateActivity(day, { ...created, ...values });
          } else {
            updateActivity(day, { ...editing.activity, ...values });
          }
          setEditing(null);
        }}
        onDelete={
          editing && !editing.isNew
            ? () => {
                deleteActivity(day, editing.activity.id);
                setEditing(null);
              }
            : undefined
        }
      />
    </Page>
  );
}
