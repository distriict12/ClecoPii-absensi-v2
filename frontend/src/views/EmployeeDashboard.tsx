/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '../types';
import {
  XCircle, MapPinOff, MapPin, Camera, CheckCircle, Clock,
  Loader2, X, Info, AlertTriangle, Timer, LogOut,
} from 'lucide-react';
import {
  cn, checkButtonAbsenDibuka, checkAbsenStatus, checkInRadius
} from '../lib/utils';
import { createAttendance, updateAttendance } from '../services/api';
import { useGetMyProfile } from '../hooks/api/useEmployeeProfile';

// ============================================================
// TOAST SYSTEM
// ============================================================
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: number; type: ToastType; message: string; }

const TOAST_CONFIG: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: { bg: 'bg-[#B9F0C8]', icon: <CheckCircle className="w-4 h-4 shrink-0" /> },
  error:   { bg: 'bg-[#F4836C]', icon: <XCircle     className="w-4 h-4 shrink-0" /> },
  info:    { bg: 'bg-[#A8D8F0]', icon: <Info         className="w-4 h-4 shrink-0" /> },
  warning: { bg: 'bg-[#F9E07A]', icon: <AlertTriangle className="w-4 h-4 shrink-0" /> },
};

let _toastId = 0;

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: number) => void }) {
  const cfg = TOAST_CONFIG[toast.type];
  useEffect(() => {
    const t = setTimeout(() => onClose(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onClose]);
  return (
    <div
      className={`flex items-center gap-3 min-w-[280px] max-w-sm ${cfg.bg} border-4 border-on-surface shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] px-4 py-3 font-bold text-on-surface text-sm`}
      style={{ animation: 'toastSlideIn 0.2s ease-out' }}
    >
      {cfg.icon}
      <span className="flex-1">{toast.message}</span>
      <button onClick={() => onClose(toast.id)} className="shrink-0 border-2 border-on-surface w-6 h-6 flex items-center justify-center hover:bg-black/10 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[100] flex flex-col gap-3 items-end">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onClose={onClose} />)}
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================
function getCountdownMinutes(jamMasuk: string, currentTime: string): number | null {
  if (!jamMasuk || jamMasuk === '00:00') return null;
  const [mh, mm] = jamMasuk.split(':').map(Number);
  const [ch, cm] = currentTime.split(':').map(Number);
  const openMin = mh * 60 + mm - 15;
  const nowMin  = ch * 60 + cm;
  const diff    = openMin - nowMin;
  return diff > 0 ? diff : null;
}

function formatDateYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseWorkDays(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try { return JSON.parse(trimmed); } catch { /* fallback */ }
    }
    return trimmed.split(',').map(h => h.trim()).filter(Boolean);
  }
  return [];
}

// ============================================================
// MAIN COMPONENT
// ============================================================
interface EmployeeDashboardProps { user: User; }

export default function EmployeeDashboard({ user }: EmployeeDashboardProps) {

  // ── Waktu Realtime ───────────────────────────────────────
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentTime    = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const currentSeconds = String(now.getSeconds()).padStart(2, '0');

  const HARI_ID  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const BULAN_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const currentDay  = HARI_ID[now.getDay()];
  const currentDate = `${now.getDate()} ${BULAN_ID[now.getMonth()]} ${now.getFullYear()}`;
  const queryDate   = formatDateYMD(now);

  // ── Fetch Profil ─────────────────────────────────────────
  const { data: resProfile, isLoading: loadingProfile } = useGetMyProfile();
  const dbEmployee = resProfile?.data;

  // ── Geolocation ──────────────────────────────────────────
  const [userLocation,  setUserLocation]  = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) { setLocationError('Geolocation tidak didukung browser ini.'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationError(null); },
      err => { setLocationError(err.message); },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  // ── Absensi State ────────────────────────────────────────
  const [sudahAbsen,   setSudahAbsen]   = useState(false);
  const [statusAbsen,  setStatusAbsen]  = useState<'tepat' | 'telat' | null>(null);
  const [sudahKeluar,  setSudahKeluar]  = useState(false);
  const [waktuMasuk,   setWaktuMasuk]   = useState<string | null>(null);
  const [waktuKeluar,  setWaktuKeluar]  = useState<string | null>(null);
  const [attendanceId, setAttendanceId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (dbEmployee?.today_attendance) {
      const att = dbEmployee.today_attendance;
      setSudahAbsen(true);
      setStatusAbsen(att.status);
      setAttendanceId(att.id);
      if (att.exit_time && att.exit_time !== '') {
        setSudahKeluar(true);
        setWaktuKeluar(att.exit_time);
      }
    }
  }, [dbEmployee]);

  // ── Camera ───────────────────────────────────────────────
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (!mounted) { mediaStream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = mediaStream;
        setCameraReady(true);
        setCameraError(null);
      } catch (err) {
        if (!mounted) return;
        setCameraError('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.');
      }
    };
    startCamera();
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setCameraReady(false);
    };
  }, []);

  useEffect(() => {
    if (cameraReady && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraReady]);

  // ── Toast ────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);
  const closeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Data Karyawan ─────────────────────────────────────────
  const jamMasuk         = dbEmployee?.start_time || '00:00';
  const jamKeluar        = dbEmployee?.end_time   || '00:00';
  const hariKerjaArr     = parseWorkDays(dbEmployee?.work_days);
  const targetLat        = parseFloat(dbEmployee?.outlet?.lat    ?? '0') || 0;
  const targetLng        = parseFloat(dbEmployee?.outlet?.lng    ?? '0') || 0;
  const targetRadius     = parseFloat(dbEmployee?.outlet?.radius ?? '50') || 50;
  const targetOutletName = dbEmployee?.outlet?.name    || 'Memuat...';
  const targetOutletAddr = dbEmployee?.outlet?.address || '-';

  // ── Logic Checks ─────────────────────────────────────────
  const isHariKerja    = hariKerjaArr.includes(currentDay);
  // [FIX] Teruskan jamKeluar — window absen ditutup tepat saat jam keluar
  const isButtonDibuka  = checkButtonAbsenDibuka(jamMasuk, jamKeluar, currentTime);
  // Cek apakah jam sekarang sudah melewati jam keluar (absen ditutup)
  const isAbsenDitutup  = !sudahAbsen && (() => {
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    return toMin(currentTime) > toMin(jamKeluar);
  })();
  const isInRadius     = userLocation
    ? checkInRadius(userLocation.lat, userLocation.lng, targetLat, targetLng, targetRadius)
    : false;
  const localStatus    = checkAbsenStatus(jamMasuk, currentTime);
  const countdownMenit = getCountdownMinutes(jamMasuk, currentTime);

  const canClockIn  = !!dbEmployee && isHariKerja && isButtonDibuka && isInRadius && !sudahAbsen && cameraReady;
  const canClockOut = !!dbEmployee && sudahAbsen && !sudahKeluar && isInRadius && cameraReady && !!attendanceId;

  // ── Capture foto ─────────────────────────────────────────
  const capturePhoto = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // ── Handler Absen Masuk ───────────────────────────────────
  const handleClockIn = async () => {
    if (!canClockIn || !userLocation || !dbEmployee?.id) return;
    setIsSubmitting(true);
    try {
      const photoBase64 = capturePhoto();
      const finalStatus = checkAbsenStatus(jamMasuk, currentTime);
      const res = await createAttendance({
        employee_id:  dbEmployee.id,
        date:         queryDate,
        entry_time:   currentTime,
        status:       finalStatus,
        location_lat: userLocation.lat.toString(),
        location_lng: userLocation.lng.toString(),
        entry_photo:  photoBase64 ?? '',
      });
      setSudahAbsen(true);
      setStatusAbsen(res?.data?.status || finalStatus);
      setAttendanceId(res?.data?.id ?? null);
      setWaktuMasuk(currentTime);
      showToast('success', `Absen masuk berhasil! Status: ${finalStatus.toUpperCase()}`);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Gagal absen masuk. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Handler Absen Keluar ──────────────────────────────────
  const handleClockOut = async () => {
    if (!canClockOut || !attendanceId) return;
    setIsSubmitting(true);
    try {
      const photoBase64 = capturePhoto();
      await updateAttendance(attendanceId, {
        exit_time:  currentTime,
        exit_photo: photoBase64 ?? '',
      });
      setSudahKeluar(true);
      setWaktuKeluar(currentTime);
      showToast('success', `Absen keluar berhasil! Jam: ${currentTime}`);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Gagal absen keluar. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center p-16 gap-3 font-black uppercase text-on-surface-variant">
        <Loader2 className="w-7 h-7 animate-spin" />
        <span className="text-sm tracking-widest">Memuat profil...</span>
      </div>
    );
  }

  const isClockOutMode = sudahAbsen && !sudahKeluar;
  const isSelesai      = sudahAbsen && sudahKeluar;

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <ToastContainer toasts={toasts} onClose={closeToast} />

      {/* gap-6 tetap — sudah compact */}
      <div className="flex flex-col gap-5">

        {/* Jam Real-time — p-6→p-4, text-6xl→text-5xl, text-3xl→text-2xl, text-2xl→text-xl */}
        <div className="bg-on-surface text-on-primary border-4 border-on-surface shadow-hard-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <p className="text-xs font-black uppercase tracking-widest opacity-60">{currentDay}, {currentDate}</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-5xl font-black leading-none tracking-tight">{currentTime}</span>
              <span className="text-2xl font-black opacity-40 leading-none mb-0.5">{currentSeconds}</span>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1">
            <p className="text-xs font-black uppercase tracking-widest opacity-60">Jadwal Shift</p>
            <p className="text-xl font-black">{jamMasuk} — {jamKeluar}</p>
            <p className="text-xs font-bold opacity-60 uppercase">{targetOutletName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Kolom Kiri — gap-4→gap-3 */}
          <div className="col-span-1 lg:col-span-5 flex flex-col gap-3">

            {/* Greeting + Status — p-6→p-4, text-4xl→text-3xl, mb-6→mb-4 */}
            <div className="bg-surface p-4 border-4 border-on-surface shadow-hard-lg">
              <h1 className="text-3xl font-black text-on-surface tracking-tight">
                Halo, {(dbEmployee?.name || user.name).split(' ')[0]}!
              </h1>
              <p className="text-sm font-bold text-on-surface-variant mt-0.5 mb-4">{targetOutletName}</p>

              {isSelesai ? (
                <div className="border-4 border-on-surface bg-[#B9F0C8] p-3 flex items-center gap-3 shadow-hard">
                  <CheckCircle className="w-5 h-5 text-[#166534] shrink-0" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest">Absensi Selesai</p>
                    <p className="font-black text-base">Masuk {waktuMasuk ?? dbEmployee?.today_attendance?.entry_time ?? '-'} · Keluar {waktuKeluar}</p>
                  </div>
                </div>
              ) : sudahAbsen ? (
                <div className={cn('border-4 border-on-surface p-3 flex items-center gap-3 shadow-hard', statusAbsen === 'tepat' ? 'bg-[#B9F0C8]' : 'bg-[#F9E07A]')}>
                  {statusAbsen === 'tepat'
                    ? <CheckCircle className="w-5 h-5 text-[#166534] shrink-0" />
                    : <Clock       className="w-5 h-5 text-[#854d0e] shrink-0" />
                  }
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest">Sudah Absen Masuk</p>
                    <p className="font-black text-base">{statusAbsen === 'tepat' ? 'Tepat Waktu ✓' : 'Terlambat'} · Belum Keluar</p>
                  </div>
                </div>
              ) : (
                <div className="border-4 border-on-surface bg-error-container p-3 flex items-center gap-3 shadow-hard">
                  <XCircle className="w-5 h-5 text-error shrink-0" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-on-error-container">Status Absensi</p>
                    <p className="font-black text-base text-on-error-container">Belum Absen</p>
                  </div>
                </div>
              )}
            </div>

            {/* Warning / Info cards — p-4→p-3 */}
            {!sudahAbsen && !isHariKerja && (
              <div className="bg-surface-container border-4 border-on-surface shadow-hard p-3 flex items-start gap-3">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black uppercase mb-0.5">Bukan Hari Kerja</p>
                  <p className="text-sm font-bold text-on-surface-variant">Hari ini ({currentDay}) bukan jadwal kerja Anda.</p>
                </div>
              </div>
            )}

            {/* Info card: absensi sudah ditutup (lewat jam keluar) */}
            {isAbsenDitutup && isHariKerja && (
              <div className="bg-[#F4836C] border-4 border-on-surface shadow-hard p-3 flex items-start gap-3">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-white" />
                <div>
                  <p className="text-xs font-black uppercase mb-0.5">Absensi Hari Ini Ditutup</p>
                  <p className="text-sm font-bold text-on-surface-variant">
                    Batas absen masuk adalah pukul <span className="font-black text-on-surface">{jamKeluar}</span>. Sudah terlewat.
                  </p>
                </div>
              </div>
            )}

            {!sudahAbsen && isHariKerja && !isButtonDibuka && countdownMenit !== null && (
              <div className="bg-[#A8D8F0] border-4 border-on-surface shadow-hard p-3 flex items-start gap-3">
                <Timer className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black uppercase mb-0.5">Absensi Belum Dibuka</p>
                  <p className="text-sm font-bold text-on-surface-variant">
                    Dibuka dalam <span className="font-black text-on-surface">{countdownMenit} menit</span> lagi
                  </p>
                </div>
              </div>
            )}

            {!isInRadius && !isSelesai && (sudahAbsen ? !sudahKeluar : isButtonDibuka) && (
              <div className="bg-[#F9E07A] border-4 border-on-surface shadow-hard p-3 flex items-start gap-3">
                <MapPinOff className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black uppercase mb-0.5">Di Luar Radius Outlet</p>
                  <p className="text-sm font-bold text-on-surface-variant">
                    Anda harus berada dalam radius <span className="font-black text-on-surface">{targetRadius}m</span> dari outlet.
                  </p>
                </div>
              </div>
            )}

            {!sudahAbsen && isHariKerja && isButtonDibuka && isInRadius && (
              <div className="bg-[#B9F0C8] border-4 border-on-surface shadow-hard p-3 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-[#166634] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black uppercase mb-0.5 text-[#166634]">Siap Absen!</p>
                  <p className="text-sm font-bold text-on-surface-variant">
                    Lokasi valid. Status:&nbsp;
                    <span className={cn('font-black', localStatus === 'tepat' ? 'text-[#166634]' : 'text-[#991b1b]')}>
                      {localStatus === 'tepat' ? 'TEPAT WAKTU' : 'TERLAMBAT'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {isClockOutMode && isInRadius && (
              <div className="bg-[#A8D8F0] border-4 border-on-surface shadow-hard p-3 flex items-start gap-3">
                <LogOut className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black uppercase mb-0.5">Siap Absen Keluar</p>
                  <p className="text-sm font-bold text-on-surface-variant">Lokasi valid. Ambil foto untuk absen keluar.</p>
                </div>
              </div>
            )}

            {locationError && (
              <div className="bg-surface-container border-4 border-on-surface shadow-hard p-3 flex items-start gap-3">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-error" />
                <div>
                  <p className="text-xs font-black uppercase mb-0.5">Lokasi Tidak Tersedia</p>
                  <p className="text-xs font-bold text-on-surface-variant">Aktifkan izin lokasi di browser untuk melanjutkan absensi.</p>
                </div>
              </div>
            )}
          </div>

          {/* Kolom Kanan: Kamera — p-5→p-4 */}
          <div className="col-span-1 lg:col-span-7">
            <div className="bg-surface border-4 border-on-surface shadow-hard-lg p-4 flex flex-col h-full gap-3">

              {/* Header panel */}
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-black uppercase tracking-tight">
                  {isSelesai ? 'Absensi Selesai' : isClockOutMode ? 'Clock Out' : 'Clock In'}
                </h2>
                <div className={cn(
                  'flex items-center gap-2 border-2 border-on-surface px-3 py-1 text-xs font-black uppercase',
                  cameraError ? 'bg-[#F4836C]' : cameraReady ? 'bg-[#B9F0C8]' : 'bg-[#F9E07A]'
                )}>
                  <span className={cn(
                    'w-2 h-2 rounded-full border border-on-surface',
                    cameraError ? 'bg-red-700' : cameraReady ? 'bg-green-700' : 'bg-yellow-700'
                  )} />
                  {cameraError ? 'Kamera Error' : cameraReady ? 'Kamera Aktif' : 'Memuat...'}
                </div>
              </div>

              {/* Kamera / Selesai Panel — minHeight 280→240 */}
              <div
                className="relative bg-inverse-surface border-4 border-on-surface overflow-hidden flex items-center justify-center"
                style={{ minHeight: '240px' }}
              >
                {isSelesai ? (
                  <div className="absolute inset-0 bg-[#B9F0C8] flex flex-col items-center justify-center gap-3 p-6">
                    <CheckCircle className="w-16 h-16 text-[#166534]" />
                    <div className="text-center">
                      <p className="text-xs font-black uppercase tracking-widest text-[#166534] mb-1">Absensi Hari Ini Selesai</p>
                      <p className="font-black text-xl text-on-surface">
                        {waktuMasuk ?? '-'} — {waktuKeluar}
                      </p>
                      <p className="text-sm font-bold text-on-surface-variant mt-1">Sampai jumpa besok!</p>
                    </div>
                  </div>
                ) : cameraReady && !cameraError ? (
                  <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                ) : (
                  <div className="absolute inset-0 bg-surface-container flex flex-col items-center justify-center gap-3 p-6">
                    <Camera className="w-12 h-12 text-on-surface-variant opacity-30" />
                    <p className="text-sm font-bold text-on-surface-variant text-center">
                      {cameraError ?? 'Memuat kamera...'}
                    </p>
                    {cameraError && (
                      <p className="text-xs font-bold text-on-surface-variant text-center opacity-70">
                        Buka Pengaturan browser → Izinkan Kamera untuk situs ini
                      </p>
                    )}
                  </div>
                )}

                {cameraReady && !isSelesai && (
                  <div className="relative z-10 w-36 h-44 border-4 border-primary border-dashed shadow-[0px_0px_0px_9999px_rgba(0,0,0,0.45)]" />
                )}

                {!isSelesai && (
                  <div className={cn(
                    'absolute bottom-3 left-3 right-3 p-2 border-4 border-on-surface shadow-hard flex items-center gap-2',
                    isInRadius ? 'bg-[#B9F0C8]' : 'bg-surface'
                  )}>
                    <MapPin className={cn('w-4 h-4 shrink-0', isInRadius ? 'text-[#166634]' : 'text-error')} />
                    <span className="text-xs font-bold text-on-surface truncate">
                      {locationError
                        ? 'Lokasi tidak tersedia'
                        : isInRadius
                          ? `${targetOutletAddr} — Dalam Radius`
                          : `${targetOutletAddr} — Luar Radius`
                      }
                    </span>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              {/* Tombol aksi — py-4→py-3 */}
              <div className="flex gap-3 mt-auto">
                {isSelesai ? (
                  <div className="flex-1 bg-[#B9F0C8] border-4 border-on-surface py-3 text-sm font-black text-on-surface shadow-hard flex items-center justify-center gap-2 uppercase tracking-wide">
                    <CheckCircle className="w-4 h-4" /> Absensi Hari Ini Selesai
                  </div>
                ) : isClockOutMode ? (
                  <>
                    <button
                      onClick={() => window.location.reload()}
                      className="flex-1 bg-surface border-4 border-on-surface py-3 text-sm font-bold text-on-surface shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg transition-all uppercase tracking-wide"
                    >
                      Segarkan
                    </button>
                    <button
                      disabled={!canClockOut || isSubmitting}
                      onClick={handleClockOut}
                      className={cn(
                        'flex-[2] border-4 border-on-surface py-3 text-sm font-bold shadow-hard flex items-center justify-center gap-2 uppercase tracking-wide transition-all',
                        canClockOut && !isSubmitting
                          ? 'bg-[#F9E07A] text-on-surface hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg cursor-pointer'
                          : 'bg-surface-variant text-outline cursor-not-allowed opacity-50'
                      )}
                    >
                      {isSubmitting
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                        : <><LogOut  className="w-4 h-4" /> Ambil Foto (Absen Keluar)</>
                      }
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      disabled={sudahAbsen}
                      onClick={() => window.location.reload()}
                      className="flex-1 bg-surface border-4 border-on-surface py-3 text-sm font-bold text-on-surface shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg transition-all uppercase tracking-wide disabled:opacity-50"
                    >
                      Segarkan
                    </button>
                    <button
                      disabled={!canClockIn || isSubmitting}
                      onClick={handleClockIn}
                      className={cn(
                        'flex-[2] border-4 border-on-surface py-3 text-sm font-bold shadow-hard flex items-center justify-center gap-2 uppercase tracking-wide transition-all',
                        canClockIn && !isSubmitting
                          ? 'bg-primary text-on-primary hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg cursor-pointer'
                          : 'bg-surface-variant text-outline cursor-not-allowed opacity-50'
                      )}
                    >
                      {isSubmitting
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                        : <><Camera  className="w-4 h-4" /> Ambil Foto (Absen Masuk)</>
                      }
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}