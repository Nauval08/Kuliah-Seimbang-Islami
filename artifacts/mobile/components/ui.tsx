import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { DAY_NAMES, DAY_SHORT_NAMES } from '@/lib/growth';
import type { DayIndex } from '@/lib/growth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export function Page({
  children,
  keyboardAware = false,
}: React.PropsWithChildren<{ keyboardAware?: boolean }>) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const contentStyle = [
    styles.pageContent,
    {
      paddingTop: Math.max(insets.top, Platform.OS === 'web' ? 67 : 12) + 12,
      paddingBottom:
        (Platform.OS === 'web' ? 34 : insets.bottom) + 112,
    },
  ];

  if (keyboardAware) {
    return (
      <KeyboardAwareScrollViewCompat
        style={[styles.page, { backgroundColor: colors.background }]}
        contentContainerStyle={contentStyle}
        keyboardShouldPersistTaps="handled"
        bottomOffset={28}
      >
        {children}
      </KeyboardAwareScrollViewCompat>
    );
  }

  return (
    <ScrollView
      style={[styles.page, { backgroundColor: colors.background }]}
      contentContainerStyle={contentStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function PageHeading({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.heading}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text>
      ) : null}
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function Panel({
  children,
  style,
}: React.PropsWithChildren<{ style?: object }>) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius + 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      {detail ? (
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

type FeatherName = React.ComponentProps<typeof Feather>['name'];

export function ActionButton({
  label,
  onPress,
  icon,
  tone = 'primary',
  disabled = false,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  icon?: FeatherName;
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  compact?: boolean;
}) {
  const colors = useColors();
  const primary = tone === 'primary';
  const danger = tone === 'danger';
  const ghost = tone === 'ghost';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        compact && styles.actionCompact,
        {
          backgroundColor: primary
            ? colors.primary
            : danger
              ? colors.destructive
              : ghost
                ? 'transparent'
                : colors.secondary,
          borderColor: ghost ? colors.border : 'transparent',
          opacity: disabled ? 0.45 : pressed ? 0.78 : 1,
        },
      ]}
    >
      {icon ? (
        <Feather
          name={icon}
          size={17}
          color={
            primary || danger
              ? colors.primaryForeground
              : ghost
                ? colors.foreground
                : colors.secondaryForeground
          }
        />
      ) : null}
      <Text
        style={[
          styles.actionText,
          {
            color:
              primary || danger
                ? colors.primaryForeground
                : ghost
                  ? colors.foreground
                  : colors.secondaryForeground,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected = false,
  disabled = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.secondary,
          borderColor: selected ? colors.primary : colors.border,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          {
            color: selected ? colors.primaryForeground : colors.secondaryForeground,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function DaySelector({
  selectedDay,
  onSelect,
  disabledDays = [],
}: {
  selectedDay: DayIndex;
  onSelect: (day: DayIndex) => void;
  disabledDays?: DayIndex[];
}) {
  const colors = useColors();
  const weekOrder: DayIndex[] = [1, 2, 3, 4, 5, 6, 0];
  return (
    <View style={styles.daySelector}>
      {weekOrder.map((day) => {
        const selected = day === selectedDay;
        const disabled = disabledDays.includes(day);
        return (
          <Pressable
            key={day}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onSelect(day)}
            style={({ pressed }) => [
              styles.dayButton,
              {
                backgroundColor: selected ? colors.primary : colors.card,
                borderColor: selected ? colors.primary : colors.border,
                opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.dayShort,
                { color: selected ? colors.primaryForeground : colors.foreground },
              ]}
            >
              {DAY_SHORT_NAMES[day]}
            </Text>
            <Text
              style={[
                styles.dayLong,
                {
                  color: selected
                    ? colors.primaryForeground
                    : colors.mutedForeground,
                },
              ]}
            >
              {DAY_NAMES[day].slice(0, 3)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  helper,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
  helper?: string;
  maxLength?: number;
}) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        multiline={multiline}
        maxLength={maxLength}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            backgroundColor: colors.background,
            borderColor: colors.input,
            color: colors.foreground,
          },
        ]}
      />
      {helper ? (
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

export function SmallLabel({ children }: React.PropsWithChildren) {
  const colors = useColors();
  return (
    <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  pageContent: {
    paddingHorizontal: 20,
    gap: 18,
  },
  heading: { gap: 7, marginBottom: 2 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
  },
  pageTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: 'Inter_700Bold',
  },
  body: { fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular' },
  panel: {
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sectionHeading: { gap: 4, marginBottom: -5 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  caption: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  action: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionCompact: { minHeight: 38, paddingHorizontal: 12, borderRadius: 13 },
  actionText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  chip: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  daySelector: { flexDirection: 'row', justifyContent: 'space-between', gap: 7 },
  dayButton: {
    flex: 1,
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dayShort: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  dayLong: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  field: { gap: 7 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 13,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  multiline: { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 },
  smallLabel: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular' },
});
