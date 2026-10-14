import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  ActionButton,
  Chip,
  Field,
  Page,
  Panel,
  SectionTitle,
  SmallLabel,
} from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { DAY_NAMES, durationBetween, formatDuration } from '@/lib/growth';
import type {
  Activity,
  ActivityCategory,
  DayIndex,
  PrayerAnchor,
} from '@/lib/growth';

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  worship: 'Ibadah',
  health: 'Kesehatan',
  food: 'Makan',
  home: 'Rumah & keluarga',
  productive: 'Produktif',
  class: 'Kuliah formal',
  study: 'Belajar mandiri',
  rest: 'Istirahat',
  custom: 'Lainnya',
};

const VALID_TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function ScheduleEditorModal({
  visible,
  day,
  activity,
  isNew = false,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  day: DayIndex;
  activity: Activity | null;
  isNew?: boolean;
  onClose: () => void;
  onSave: (value: Omit<Activity, 'id'>) => void;
  onDelete?: () => void;
}) {
  const colors = useColors();
  const initial = activity ?? {
    id: '',
    title: '',
    startTime: '12:00',
    endTime: '12:30',
    category: 'custom' as const,
  };
  const [title, setTitle] = useState(initial.title);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [startAnchor, setStartAnchor] = useState<PrayerAnchor | undefined>(
    initial.startAnchor,
  );
  const [error, setError] = useState<string | null>(null);
  const duration = durationBetween(startTime, endTime);

  const save = () => {
    if (!title.trim()) {
      setError('Nama kegiatan wajib diisi.');
      return;
    }
    if (!VALID_TIME.test(startTime) || !VALID_TIME.test(endTime)) {
      setError('Gunakan format jam HH:mm, misalnya 08:30.');
      return;
    }
    if (duration <= 0 || duration > 1440) {
      setError('Jam selesai dan mulai belum membentuk durasi yang valid.');
      return;
    }
    setError(null);
    onSave({
      title: title.trim(),
      startTime,
      endTime,
      category: initial.category,
      anchorDurationMinutes:
        startAnchor === 'fajr' ? duration : undefined,
      ...(startAnchor ? { startAnchor } : {}),
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <Page keyboardAware>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1, gap: 3 }}>
            <SmallLabel>{isNew ? 'KEGIATAN BARU' : CATEGORY_LABELS[initial.category]}</SmallLabel>
            <Text
              style={{
                color: colors.foreground,
                fontSize: 24,
                fontFamily: 'Inter_700Bold',
              }}
            >
              {DAY_NAMES[day]}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tutup editor"
            onPress={onClose}
            style={{ padding: 9 }}
          >
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <Panel>
          <SectionTitle
            title="Atur kegiatan"
            detail="Perubahan jadwal ini hanya untuk hari yang dipilih."
          />
          <Field
            label="Nama kegiatan"
            value={title}
            onChangeText={setTitle}
            placeholder="Contoh: Membaca materi"
            maxLength={60}
          />
          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: colors.foreground,
                fontSize: 13,
                fontFamily: 'Inter_600SemiBold',
              }}
            >
              Waktu mulai mengikuti
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip
                label="Jam tetap"
                selected={!startAnchor}
                onPress={() => setStartAnchor(undefined)}
              />
              <Chip
                label="Subuh"
                selected={startAnchor === 'fajr'}
                onPress={() => setStartAnchor('fajr')}
              />
              <Chip
                label="Magrib"
                selected={startAnchor === 'maghrib'}
                onPress={() => setStartAnchor('maghrib')}
              />
            </View>
          </View>
          {!startAnchor ? (
            <Field
              label="Jam mulai (HH:mm)"
              value={startTime}
              onChangeText={setStartTime}
              placeholder="08:30"
            />
          ) : (
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 12,
                lineHeight: 18,
                fontFamily: 'Inter_400Regular',
              }}
            >
              Jam mulai mengikuti jadwal salat lokal. Waktu salat tidak diubah
              oleh kegiatan ini.
            </Text>
          )}
          <Field
            label="Jam selesai (HH:mm)"
            value={endTime}
            onChangeText={setEndTime}
            placeholder="09:30"
          />
          <Text
            style={{
              color: colors.primary,
              fontSize: 13,
              fontFamily: 'Inter_600SemiBold',
            }}
          >
            Durasi terhitung: {formatDuration(duration)}
          </Text>
          {error ? (
            <Text
              style={{
                color: colors.destructive,
                fontSize: 12,
                fontFamily: 'Inter_400Regular',
              }}
            >
              {error}
            </Text>
          ) : null}
          <ActionButton label="Simpan kegiatan" icon="check" onPress={save} />
          {onDelete ? (
            <ActionButton
              label="Hapus kegiatan"
              icon="trash-2"
              tone="danger"
              onPress={onDelete}
            />
          ) : null}
        </Panel>
      </Page>
    </Modal>
  );
}
