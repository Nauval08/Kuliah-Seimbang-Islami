import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { Activity, DayIndex } from '@/lib/growth';

const ICON_BY_CATEGORY: Record<Activity['category'], React.ComponentProps<typeof Feather>['name']> = {
  worship: 'sunrise',
  health: 'activity',
  food: 'coffee',
  home: 'home',
  productive: 'target',
  class: 'book-open',
  study: 'book',
  rest: 'moon',
  custom: 'circle',
};

function isCurrentActivity(activity: Activity, date: Date): boolean {
  const current = date.getHours() * 60 + date.getMinutes();
  const start = Number(activity.startTime.slice(0, 2)) * 60 + Number(activity.startTime.slice(3));
  const end = Number(activity.endTime.slice(0, 2)) * 60 + Number(activity.endTime.slice(3));
  return start < end ? current >= start && current < end : current >= start || current < end;
}

export function ScheduleList({
  activities,
  day,
  now,
  onEdit,
}: {
  activities: Activity[];
  day: DayIndex;
  now?: Date;
  onEdit?: (activity: Activity) => void;
}) {
  const colors = useColors();
  if (!activities.length) {
    return (
      <Text
        style={{
          color: colors.mutedForeground,
          fontSize: 13,
          fontFamily: 'Inter_400Regular',
        }}
      >
        Belum ada kegiatan. Tambahkan jadwal dari Pengaturan.
      </Text>
    );
  }

  return (
    <View style={{ gap: 9 }}>
      {activities.map((activity) => {
        const active = now ? isCurrentActivity(activity, now) : false;
        const startLabel = activity.startAnchor
          ? activity.startAnchor === 'maghrib'
            ? 'Magrib'
            : 'Subuh'
          : activity.startTime;
        const row = (
          <View
            style={{
              minHeight: 64,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderRadius: 15,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: active ? colors.secondary : colors.background,
              borderWidth: active ? 1 : 0,
              borderColor: colors.primary,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 13,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: active ? colors.primary : colors.secondary,
              }}
            >
              <Feather
                name={ICON_BY_CATEGORY[activity.category]}
                size={17}
                color={active ? colors.primaryForeground : colors.primary}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                numberOfLines={2}
                style={{
                  color: colors.foreground,
                  fontSize: 13,
                  lineHeight: 18,
                  fontFamily: 'Inter_600SemiBold',
                }}
              >
                {activity.title}
              </Text>
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: 11,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                {startLabel} – {activity.endTime}
                {active ? ' · sedang berlangsung' : ''}
              </Text>
            </View>
            {onEdit ? (
              <Feather name="edit-2" size={15} color={colors.mutedForeground} />
            ) : null}
          </View>
        );

        return onEdit ? (
          <Pressable
            key={`${day}-${activity.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Ubah ${activity.title}`}
            onPress={() => onEdit(activity)}
            style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
          >
            {row}
          </Pressable>
        ) : (
          <View key={`${day}-${activity.id}`}>{row}</View>
        );
      })}
    </View>
  );
}
