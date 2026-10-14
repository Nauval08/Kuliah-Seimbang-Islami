import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { ActionButton, Panel } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useGrowth } from '@/context/GrowthContext';
import { fetchPrayerTimes } from '@/lib/prayer';
import { getDateKey } from '@/lib/growth';
import type { Coordinates } from '@/lib/growth';

const PRAYER_LABELS = [
  ['fajr', 'Subuh'],
  ['dhuhr', 'Zuhur'],
  ['asr', 'Asar'],
  ['maghrib', 'Magrib'],
  ['isha', 'Isya'],
] as const;

export function PrayerCard({ date = new Date() }: { date?: Date }) {
  const colors = useColors();
  const router = useRouter();
  const { data, savePrayerTimes, setCoordinates } = useGrowth();
  const dateKey = getDateKey(date);
  const requestDate = useMemo(
    () => new Date(`${dateKey}T12:00:00`),
    [dateKey],
  );
  const prayer = data.prayerByDate[dateKey];
  const savedCoordinates = data.coordinates;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionLocked, setPermissionLocked] = useState(false);

  const fetchForCoordinates = useCallback(
    async (coordinates: Coordinates) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPrayerTimes(requestDate, coordinates);
        savePrayerTimes(result);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Waktu salat gagal dimuat.',
        );
      } finally {
        setLoading(false);
      }
    },
    [requestDate, savePrayerTimes],
  );

  useEffect(() => {
    if (!savedCoordinates) return;
    const cached = data.prayerByDate[dateKey];
    const isSameLocation =
      cached &&
      Math.abs(cached.coordinates.latitude - savedCoordinates.latitude) < 0.001 &&
      Math.abs(cached.coordinates.longitude - savedCoordinates.longitude) < 0.001;
    if (!isSameLocation) void fetchForCoordinates(savedCoordinates);
  }, [data.prayerByDate, dateKey, fetchForCoordinates, savedCoordinates]);

  const useDeviceLocation = async () => {
    setError(null);
    setLoading(true);
    try {
      let coordinates: Coordinates;
      if (Platform.OS === 'web') {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          throw new Error('Lokasi perangkat tidak tersedia di peramban ini.');
        }
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 60000,
            });
          },
        );
        coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } else {
        let permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        setPermissionLocked(!permission.granted && !permission.canAskAgain);
        if (!permission.granted) {
          throw new Error(
            permission.canAskAgain
              ? 'Izinkan akses lokasi untuk menghitung waktu salat setempat.'
              : 'Izin lokasi ditolak. Atur koordinat secara manual di Pengaturan atau buka pengaturan perangkat.',
          );
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }
      setCoordinates(coordinates);
      await fetchForCoordinates(coordinates);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Lokasi belum berhasil didapatkan.',
      );
    } finally {
      setLoading(false);
    }
  };

  const openDeviceSettings = () => {
    void Linking.openSettings().catch(() => {
      setError('Pengaturan perangkat tidak dapat dibuka dari aplikasi.');
    });
  };

  return (
    <Panel>
      <View style={{ gap: 3 }}>
        <Text
          style={{
            color: colors.foreground,
            fontSize: 17,
            fontFamily: 'Inter_600SemiBold',
          }}
        >
          Waktu salat setempat
        </Text>
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 11,
            fontFamily: 'Inter_400Regular',
          }}
        >
          Kemenag RI · AlAdhan · {prayer?.timezone ?? 'lokasi perangkat'}
        </Text>
      </View>

      {prayer ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PRAYER_LABELS.map(([key, label]) => (
            <View
              key={key}
              style={{
                minWidth: '30%',
                flexGrow: 1,
                padding: 11,
                gap: 5,
                borderRadius: 14,
                backgroundColor:
                  key === 'maghrib' ? colors.secondary : colors.background,
              }}
            >
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: 11,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                {label}
              </Text>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 17,
                  fontFamily: 'Inter_700Bold',
                }}
              >
                {prayer.times[key]}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 13,
            lineHeight: 20,
            fontFamily: 'Inter_400Regular',
          }}
        >
          Atur lokasi untuk memuat waktu Subuh, Zuhur, Asar, Magrib, dan Isya.
        </Text>
      )}

      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 12,
              fontFamily: 'Inter_400Regular',
            }}
          >
            Memuat waktu salat...
          </Text>
        </View>
      ) : null}

      {error ? (
        <View style={{ gap: 8 }}>
          <Text
            style={{
              color: colors.destructive,
              fontSize: 12,
              lineHeight: 18,
              fontFamily: 'Inter_400Regular',
            }}
          >
            {error}
          </Text>
          {permissionLocked && Platform.OS !== 'web' ? (
            <ActionButton
              label="Buka pengaturan perangkat"
              icon="settings"
              tone="secondary"
              onPress={openDeviceSettings}
            />
          ) : null}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 9 }}>
        <View style={{ flex: 1 }}>
          <ActionButton
            label={savedCoordinates ? 'Perbarui lokasi & waktu' : 'Gunakan lokasi perangkat'}
            icon="crosshair"
            compact
            tone="secondary"
            onPress={() => void useDeviceLocation()}
            disabled={loading}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ActionButton
            label="Atur koordinat"
            icon="map-pin"
            compact
            tone="ghost"
            onPress={() => router.push('/settings')}
          />
        </View>
      </View>
    </Panel>
  );
}
