import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

export function checkAbsenStatus(jamMasuk: string, jamSekarang: string): 'tepat' | 'telat' {
  if (!jamMasuk || !jamSekarang) return 'telat';

  const [jamMasukHH, jamMasukMM] = jamMasuk.split(':').map(Number);
  const [jamSekarangHH, jamSekarangMM] = jamSekarang.split(':').map(Number);
  
  const masukMinutes = jamMasukHH * 60 + jamMasukMM;
  let sekarangMinutes = jamSekarangHH * 60 + jamSekarangMM;
  
  // [FIX SHIFT TENGAH MALAM]
  if (jamMasukHH === 0 && jamSekarangHH === 23) {
    sekarangMinutes -= 24 * 60; 
  }

  const batasToleransi = masukMinutes + 15;
  
  if (sekarangMinutes > batasToleransi) {
    return 'telat';
  }
  
  return 'tepat';
}

export function checkInRadius(
  userLat: number,
  userLng: number,
  outletLat: number,
  outletLng: number,
  radius: number
): boolean {
  const R = 6371e3;
  const φ1 = (userLat * Math.PI) / 180;
  const φ2 = (outletLat * Math.PI) / 180;
  const Δφ = ((outletLat - userLat) * Math.PI) / 180;
  const Δλ = ((outletLng - userLng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  return distance <= radius;
}

/**
 * Cek apakah button absen masuk bisa dibuka.
 * Window absen = mulai 15 menit sebelum jam masuk, tutup tepat saat jam keluar.
 * 
 * @param jamMasuk   - Jam masuk kerja (format "HH:MM")
 * @param jamKeluar  - Jam keluar kerja / akhir shift (format "HH:MM")
 * @param jamSekarang - Jam sekarang (format "HH:MM")
 * @returns true jika masih dalam window absen, false jika di luar window
 */
export function checkButtonAbsenDibuka(
  jamMasuk: string,
  jamKeluar: string,
  jamSekarang: string
): boolean {
  if (!jamMasuk || !jamKeluar || !jamSekarang) return false;

  const toMin = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const masukMin   = toMin(jamMasuk);
  const keluarMin  = toMin(jamKeluar);
  let   sekarangMin = toMin(jamSekarang);

  // [FIX SHIFT TENGAH MALAM] — shift yang dimulai jam 00:xx
  if (toMin(jamMasuk.split(':')[0] + ':00') === 0 && toMin(jamSekarang.split(':')[0] + ':00') === 23 * 60) {
    sekarangMin -= 24 * 60;
  }

  const batasAwal  = masukMin - 15; // 15 menit sebelum jam masuk
  const batasAkhir = keluarMin;     // tepat jam keluar — lewat ini ditutup

  return sekarangMin >= batasAwal && sekarangMin <= batasAkhir;
}

export function getCurrentTime(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function getCurrentDayName(): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[new Date().getDay()];
}