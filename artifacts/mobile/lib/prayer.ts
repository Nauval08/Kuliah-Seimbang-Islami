import { getDateKey } from '@/lib/growth';
import type { Coordinates, PrayerTimes } from '@/lib/growth';

interface AladhanResponse {
  code?: number;
  status?: string;
  data?: {
    timings?: Record<string, string>;
    meta?: {
      timezone?: string;
    };
  };
}

function formatApiDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function cleanPrayerTime(value: string | undefined, name: string): string {
  const time = value?.match(/\b([01]\d|2[0-3]):([0-5]\d)\b/)?.[0];
  if (!time) {
    throw new Error(`Waktu salat ${name} tidak tersedia dari sumber.`);
  }
  return time;
}

export async function fetchPrayerTimes(
  date: Date,
  coordinates: Coordinates,
): Promise<PrayerTimes> {
  const { latitude, longitude } = coordinates;
  const pathDate = formatApiDate(date);
  const url =
    `https://api.aladhan.com/v1/timings/${pathDate}` +
    `?latitude=${encodeURIComponent(latitude)}` +
    `&longitude=${encodeURIComponent(longitude)}&method=20`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Waktu salat belum dapat dimuat. Coba lagi nanti.');
  }

  const result = (await response.json()) as AladhanResponse;
  const timings = result.data?.timings;
  if (result.code !== 200 || !timings) {
    throw new Error('Sumber waktu salat mengirim data yang tidak lengkap.');
  }

  return {
    dateKey: getDateKey(date),
    coordinates,
    timezone: result.data?.meta?.timezone ?? 'Waktu lokal',
    fetchedAt: new Date().toISOString(),
    times: {
      fajr: cleanPrayerTime(timings.Fajr, 'Subuh'),
      dhuhr: cleanPrayerTime(timings.Dhuhr, 'Zuhur'),
      asr: cleanPrayerTime(timings.Asr, 'Asar'),
      maghrib: cleanPrayerTime(timings.Maghrib ?? timings.Sunset, 'Magrib'),
      isha: cleanPrayerTime(timings.Isha, 'Isya'),
    },
  };
}
