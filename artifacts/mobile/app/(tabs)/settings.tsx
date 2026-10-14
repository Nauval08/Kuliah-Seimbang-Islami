import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { ActionButton, Chip, DaySelector, Field, Page, PageHeading, Panel, SectionTitle } from '@/components/ui';
import { ScheduleEditorModal } from '@/components/ScheduleEditorModal';
import { ScheduleList } from '@/components/ScheduleList';
import { useGrowth } from '@/context/GrowthContext';
import { useColors } from '@/hooks/useColors';
import {
  DAY_NAMES,
  DAY_SHORT_NAMES,
  isLectureDay,
  WEEK_ORDER,
} from '@/lib/growth';
import type { Activity, DayIndex, FitnessLevel } from '@/lib/growth';

const FITNESS_LEVELS: { value: FitnessLevel; label: string; minutes: number }[] = [
  { value: 'pemula', label: 'Pemula', minutes: 30 },
  { value: 'menengah', label: 'Menengah', minutes: 45 },
  { value: 'lanjutan', label: 'Lanjutan', minutes: 60 },
];

function SelectionDays({
  selectedDays,
  disabledDays = [],
  onToggle,
}: {
  selectedDays: DayIndex[];
  disabledDays?: DayIndex[];
  onToggle: (day: DayIndex) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {WEEK_ORDER.map((day) => (
        <Chip
          key={day}
          label={DAY_SHORT_NAMES[day]}
          selected={selectedDays.includes(day)}
          disabled={disabledDays.includes(day)}
          onPress={() => onToggle(day)}
        />
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const {
    data,
    toggleClassDay,
    setStudyTargetMinutes,
    toggleStudyDay,
    toggleWorkoutDay,
    toggleRecoveryDay,
    setFitnessLevel,
    setCoordinates,
    updateActivity,
    addActivity,
    deleteActivity,
  } = useGrowth();
  const [targetDraft, setTargetDraft] = useState(
    String(data.studyTargetMinutes / 60),
  );
  const [targetError, setTargetError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayIndex>(1);
  const [editing, setEditing] = useState<{
    activity: Activity;
    isNew: boolean;
  } | null>(null);
  const [coordinateDraft, setCoordinateDraft] = useState<{
    latitude?: string;
    longitude?: string;
  }>({});
  const latitude =
    coordinateDraft.latitude ??
    (data.coordinates ? String(data.coordinates.latitude) : '');
  const longitude =
    coordinateDraft.longitude ??
    (data.coordinates ? String(data.coordinates.longitude) : '');
  const [coordinateError, setCoordinateError] = useState<string | null>(null);
  const isClassDay = isLectureDay(selectedDay, data.classDays);
  const selectedSchedule = data.schedules[String(selectedDay)] ?? [];

  const saveTarget = () => {
    const hours = Number(targetDraft.replace(',', '.'));
    if (!Number.isFinite(hours) || hours < 0.5 || hours > 12) {
      setTargetError('Target harus di antara 0,5 dan 12 jam.');
      return;
    }
    setStudyTargetMinutes(Math.round(hours * 60));
    setTargetDraft(String(Math.round(hours * 2) / 2));
    setTargetError(null);
  };

  const saveCoordinates = () => {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (
      !latitude.trim() ||
      !longitude.trim() ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      setCoordinateError('Isi koordinat yang valid: lintang −90 hingga 90, bujur −180 hingga 180.');
      return;
    }
    setCoordinates({ latitude: lat, longitude: lon });
    setCoordinateDraft({});
    setCoordinateError(null);
  };

  const openNewActivity = () => {
    setEditing({
      activity: {
        id: `${selectedDay}-draft`,
        title: 'Aktivitas baru',
        startTime: '12:00',
        endTime: '12:30',
        category: 'custom',
      },
      isNew: true,
    });
  };

  return (
    <Page keyboardAware>
      <PageHeading
        eyebrow="Kendali jadwal"
        title="Pengaturan"
        subtitle="Ubah jadwal, target, latihan, hari pemulihan, dan lokasi salat tanpa mengubah kode."
      />

      <Panel>
        <SectionTitle
          title="Hari kuliah formal"
          detail="Tentukan hari kuliah. Hari yang dipilih memakai jadwal pagi–sore khusus kuliah dan tidak mendapat target belajar mandiri."
        />
        <SelectionDays
          selectedDays={data.classDays}
          onToggle={toggleClassDay}
        />
        <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular' }}>
          Saat kategori hari diubah, kerangka jadwal hari tersebut disesuaikan. Kegiatan tambahan yang kamu buat tetap tersimpan.
        </Text>
      </Panel>

      <Panel>
        <SectionTitle
          title="Target belajar mandiri"
          detail="Target hanya berlaku di hari yang dipilih dan tidak diwajibkan saat kuliah."
        />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Jam efektif per hari target"
              value={targetDraft}
              onChangeText={setTargetDraft}
              keyboardType="decimal-pad"
              placeholder="4"
              helper="Pilih 0,5–12 jam. Hanya timer belajar mandiri yang masuk ke target."
            />
          </View>
          <View style={{ paddingBottom: 24 }}>
            <ActionButton
              label="Simpan"
              icon="check"
              compact
              onPress={saveTarget}
            />
          </View>
        </View>
        {targetError ? (
          <Text style={{ color: colors.destructive, fontSize: 12, fontFamily: 'Inter_500Medium' }}>
            {targetError}
          </Text>
        ) : null}
        <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>
          Hari belajar mandiri
        </Text>
        <SelectionDays
          selectedDays={data.studyDays}
          disabledDays={data.classDays}
          onToggle={toggleStudyDay}
        />
        <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular' }}>
          Senin, Rabu, dan Kamis dikunci sebagai hari kuliah. Jadwal belajar mandiri empat jam tidak dibuat pada hari tersebut.
        </Text>
      </Panel>

      <Panel>
        <SectionTitle
          title="Olahraga & pemulihan"
          detail="Latihan tidak dijadwalkan berat setiap hari. Pilih level dan hari pemulihan sesuai kondisi tubuh."
        />
        <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>
          Tingkat latihan
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {FITNESS_LEVELS.map((level) => (
            <Chip
              key={level.value}
              label={`${level.label} · ${level.minutes} mnt`}
              selected={data.fitnessLevel === level.value}
              onPress={() => setFitnessLevel(level.value)}
            />
          ))}
        </View>
        <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>
          Hari latihan
        </Text>
        <SelectionDays
          selectedDays={data.workoutDays}
          onToggle={toggleWorkoutDay}
        />
        <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>
          Hari pemulihan
        </Text>
        <SelectionDays
          selectedDays={data.recoveryDays}
          onToggle={toggleRecoveryDay}
        />
        <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular' }}>
          Hari latihan dan pemulihan saling menggantikan. Menandai pemulihan tubuh pada halaman Hari ini juga mengganti latihan dengan gerak ringan untuk hari tersebut.
        </Text>
      </Panel>

      <Panel>
        <SectionTitle
          title="Jadwal mingguan"
          detail="Atur jam mulai, jam selesai, durasi terhitung, dan nama setiap kegiatan."
        />
        <DaySelector selectedDay={selectedDay} onSelect={setSelectedDay} />
        <View
          style={{
            backgroundColor: isClassDay ? colors.secondary : colors.background,
            borderRadius: 14,
            padding: 12,
            gap: 4,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>
            {DAY_NAMES[selectedDay]} · {isClassDay ? 'Hari kuliah' : 'Tanpa kuliah'}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular' }}>
            {isClassDay
              ? 'Kuliah dimulai mengikuti Magrib dan berakhir pukul 22.00. Tidak ada target belajar mandiri hari ini.'
              : data.studyDays.includes(selectedDay)
                ? `Target belajar mandiri ${data.studyTargetMinutes / 60} jam efektif.`
                : 'Hari ini tidak memiliki target belajar mandiri.'}
          </Text>
        </View>
        <ScheduleList
          activities={selectedSchedule}
          day={selectedDay}
          onEdit={(activity) => setEditing({ activity, isNew: false })}
        />
        <ActionButton
          label="Tambah kegiatan"
          icon="plus"
          tone="secondary"
          onPress={openNewActivity}
        />
      </Panel>

      <Panel>
        <SectionTitle
          title="Lokasi waktu salat"
          detail="Metode Kementerian Agama Republik Indonesia melalui AlAdhan. Salat tidak digeser oleh jadwal lain."
        />
        {data.coordinates ? (
          <Text style={{ color: colors.primary, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
            Lokasi tersimpan · {data.coordinates.latitude.toFixed(4)}, {data.coordinates.longitude.toFixed(4)}
          </Text>
        ) : (
          <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' }}>
            Belum ada lokasi tersimpan. Gunakan lokasi perangkat dari kartu waktu salat di halaman Hari ini atau isi koordinat di bawah.
          </Text>
        )}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Lintang"
              value={latitude}
              onChangeText={(value) =>
                setCoordinateDraft((current) => ({ ...current, latitude: value }))
              }
              keyboardType="decimal-pad"
              placeholder="-6.2088"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Bujur"
              value={longitude}
              onChangeText={(value) =>
                setCoordinateDraft((current) => ({ ...current, longitude: value }))
              }
              keyboardType="decimal-pad"
              placeholder="106.8456"
            />
          </View>
        </View>
        {coordinateError ? (
          <Text style={{ color: colors.destructive, fontSize: 12, lineHeight: 18, fontFamily: 'Inter_500Medium' }}>
            {coordinateError}
          </Text>
        ) : null}
        <ActionButton
          label="Simpan lokasi"
          icon="map-pin"
          tone="secondary"
          onPress={saveCoordinates}
        />
      </Panel>

      <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, textAlign: 'center', fontFamily: 'Inter_400Regular' }}>
        Jadwal, target, catatan, dan sesi timer disimpan di perangkat ini.
      </Text>

      <ScheduleEditorModal
        key={editing ? `${selectedDay}-${editing.activity.id}` : 'closed'}
        visible={editing !== null}
        day={selectedDay}
        activity={editing?.activity ?? null}
        isNew={editing?.isNew ?? false}
        onClose={() => setEditing(null)}
        onSave={(values) => {
          if (!editing) return;
          if (editing.isNew) {
            const created = addActivity(selectedDay);
            updateActivity(selectedDay, { ...created, ...values });
          } else {
            updateActivity(selectedDay, { ...editing.activity, ...values });
          }
          setEditing(null);
        }}
        onDelete={
          editing && !editing.isNew
            ? () => {
                deleteActivity(selectedDay, editing.activity.id);
                setEditing(null);
              }
            : undefined
        }
      />
    </Page>
  );
}
