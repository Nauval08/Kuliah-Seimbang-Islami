import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import { ActionButton, Chip, Field, Page, PageHeading, Panel, SectionTitle } from '@/components/ui';
import { useGrowth } from '@/context/GrowthContext';
import { useColors } from '@/hooks/useColors';
import { DAY_NAMES, getDateKey, isLectureDay } from '@/lib/growth';
import type { SessionKind } from '@/lib/growth';

function formatTimer(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours && minutes) return `${hours} jam ${minutes} menit`;
  if (hours) return `${hours} jam`;
  return `${minutes} menit`;
}

function sessionTypeLabel(kind: SessionKind): string {
  return kind === 'mandiri' ? 'Belajar mandiri' : 'Kuliah formal';
}

export default function StudyScreen() {
  const colors = useColors();
  const {
    data,
    startSession,
    stopSession,
    addNote,
    deleteNote,
  } = useGrowth();
  const [now, setNow] = useState(() => new Date());
  const [selectedKind, setSelectedKind] = useState<SessionKind>('mandiri');
  const [noteKind, setNoteKind] = useState<SessionKind>('mandiri');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayKey = getDateKey(now);
  const day = now.getDay();
  const classDay = isLectureDay(day, data.classDays);
  const todaySelfStudy = data.sessions
    .filter(
      (session) =>
        session.kind === 'mandiri' &&
        getDateKey(new Date(session.startedAt)) === todayKey,
    )
    .reduce((total, session) => total + session.durationSeconds, 0);
  const todayFormalClass = data.sessions
    .filter(
      (session) =>
        session.kind === 'kuliah' &&
        getDateKey(new Date(session.startedAt)) === todayKey,
    )
    .reduce((total, session) => total + session.durationSeconds, 0);
  const activeSeconds = data.activeSession
    ? Math.max(
        0,
        Math.floor((now.getTime() - Date.parse(data.activeSession.startedAt)) / 1000),
      )
    : 0;
  const selfStudyTotal =
    todaySelfStudy +
    (data.activeSession?.kind === 'mandiri' ? activeSeconds : 0);
  const formalClassTotal =
    todayFormalClass +
    (data.activeSession?.kind === 'kuliah' ? activeSeconds : 0);

  const saveNote = () => {
    if (!noteTitle.trim()) {
      setFormError('Isi judul materi terlebih dahulu.');
      return;
    }
    addNote({
      kind: noteKind,
      title: noteTitle.trim(),
      content: noteContent.trim(),
    });
    setNoteTitle('');
    setNoteContent('');
    setFormError(null);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      'Hapus catatan?',
      'Catatan materi ini akan dihapus dari perangkat.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => deleteNote(id) },
      ],
    );
  };

  return (
    <Page keyboardAware>
      <PageHeading
        eyebrow="Belajar IT"
        title="Sesi yang terukur"
        subtitle="Timer mencatat durasi nyata. Waktu kuliah formal dipisahkan dari target belajar mandiri."
      />

      <Panel
        style={{
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          padding: 20,
        }}
      >
        <Text
          style={{
            color: colors.primaryForeground,
            fontSize: 12,
            fontFamily: 'Inter_500Medium',
          }}
        >
          {data.activeSession
            ? `${sessionTypeLabel(data.activeSession.kind).toUpperCase()} SEDANG BERJALAN`
            : 'PILIH JENIS SESI'}
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          style={{
            color: colors.primaryForeground,
            fontSize: 46,
            lineHeight: 56,
            letterSpacing: 1,
            fontFamily: 'Inter_700Bold',
          }}
        >
          {formatTimer(activeSeconds)}
        </Text>
        {data.activeSession ? (
          <Text
            style={{
              color: colors.primaryForeground,
              opacity: 0.82,
              fontSize: 12,
              fontFamily: 'Inter_400Regular',
            }}
          >
            Dimulai pukul{' '}
            {new Date(data.activeSession.startedAt).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip
              label="Mandiri"
              selected={selectedKind === 'mandiri'}
              onPress={() => setSelectedKind('mandiri')}
            />
            <Chip
              label="Kuliah formal"
              selected={selectedKind === 'kuliah'}
              onPress={() => setSelectedKind('kuliah')}
            />
          </View>
        )}
        <ActionButton
          label={data.activeSession ? 'Selesaikan & simpan sesi' : 'Mulai timer'}
          icon={data.activeSession ? 'square' : 'play'}
          tone="secondary"
          onPress={() => {
            if (data.activeSession) {
              stopSession();
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              startSession(selectedKind);
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }}
        />
        {data.activeSession ? (
          <Text
            style={{
              color: colors.primaryForeground,
              opacity: 0.78,
              fontSize: 11,
              lineHeight: 17,
              fontFamily: 'Inter_400Regular',
            }}
          >
            Sesi otomatis disimpan saat dihentikan atau aplikasi masuk ke latar belakang.
          </Text>
        ) : null}
      </Panel>

      <Panel>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <SectionTitle
            title="Rekap hari ini"
            detail={`${DAY_NAMES[day]}${classDay ? ' · hari kuliah' : ''}`}
          />
          <Link href="/settings" asChild>
            <Pressable
              accessibilityRole="link"
              style={({ pressed }) => ({
                padding: 5,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Feather name="sliders" size={18} color={colors.primary} />
            </Pressable>
          </Link>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.background,
              padding: 13,
              borderRadius: 14,
              gap: 5,
            }}
          >
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: 'Inter_400Regular' }}>
              Mandiri efektif
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 19, fontFamily: 'Inter_700Bold' }}>
              {formatDuration(selfStudyTotal)}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.background,
              padding: 13,
              borderRadius: 14,
              gap: 5,
            }}
          >
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: 'Inter_400Regular' }}>
              Kuliah formal
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 19, fontFamily: 'Inter_700Bold' }}>
              {formatDuration(formalClassTotal)}
            </Text>
          </View>
        </View>
        {classDay ? (
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 12,
              lineHeight: 18,
              fontFamily: 'Inter_400Regular',
            }}
          >
            Hari kuliah tidak memiliki kewajiban belajar mandiri. Target empat jam hanya berlaku di hari yang dipilih.
          </Text>
        ) : null}
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 11,
            lineHeight: 17,
            fontFamily: 'Inter_400Regular',
          }}
        >
          Timer mencatat waktu mulai hingga selesai; hanya sesi mandiri yang masuk ke target efektif.
        </Text>
      </Panel>

      <Panel>
        <SectionTitle
          title="Catatan materi"
          detail="Pisahkan materi yang dibahas di kelas dari belajar mandiri."
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip
            label="Kuliah formal"
            selected={noteKind === 'kuliah'}
            onPress={() => setNoteKind('kuliah')}
          />
          <Chip
            label="Belajar mandiri"
            selected={noteKind === 'mandiri'}
            onPress={() => setNoteKind('mandiri')}
          />
        </View>
        <Field
          label="Judul materi"
          value={noteTitle}
          onChangeText={setNoteTitle}
          placeholder="Contoh: Dasar jaringan komputer"
          maxLength={80}
        />
        <Field
          label="Ringkasan atau catatan"
          value={noteContent}
          onChangeText={setNoteContent}
          placeholder="Catat topik, pertanyaan, atau poin penting..."
          multiline
          maxLength={2000}
        />
        {formError ? (
          <Text
            style={{
              color: colors.destructive,
              fontSize: 12,
              fontFamily: 'Inter_500Medium',
            }}
          >
            {formError}
          </Text>
        ) : null}
        <ActionButton label="Simpan materi" icon="bookmark" onPress={saveNote} />
      </Panel>

      {data.notes.length ? (
        <Panel>
          <SectionTitle title="Materi tersimpan" detail={`${data.notes.length} catatan`} />
          {data.notes.map((note) => (
            <View
              key={note.id}
              style={{
                backgroundColor: colors.background,
                borderRadius: 14,
                padding: 13,
                gap: 7,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: 'Inter_600SemiBold' }}>
                    {note.title}
                  </Text>
                  <Text style={{ color: colors.primary, fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>
                    {sessionTypeLabel(note.kind).toUpperCase()} ·{' '}
                    {new Date(note.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Hapus catatan ${note.title}`}
                  onPress={() => confirmDelete(note.id)}
                  hitSlop={8}
                  style={({ pressed }) => ({ padding: 3, opacity: pressed ? 0.6 : 1 })}
                >
                  <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
              {note.content ? (
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: 12,
                    lineHeight: 18,
                    fontFamily: 'Inter_400Regular',
                  }}
                >
                  {note.content}
                </Text>
              ) : null}
            </View>
          ))}
        </Panel>
      ) : null}

      {data.sessions.length ? (
        <Panel>
          <SectionTitle title="Sesi tercatat" detail="Durasi dihitung dari waktu mulai dan selesai." />
          {data.sessions.slice(0, 8).map((session) => (
            <View
              key={session.id}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 4,
              }}
            >
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.foreground, fontSize: 12, fontFamily: 'Inter_500Medium' }}>
                  {sessionTypeLabel(session.kind)}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, fontFamily: 'Inter_400Regular' }}>
                  {new Date(session.startedAt).toLocaleString('id-ID', {
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text style={{ color: colors.primary, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                {formatDuration(session.durationSeconds)}
              </Text>
            </View>
          ))}
        </Panel>
      ) : null}
    </Page>
  );
}
