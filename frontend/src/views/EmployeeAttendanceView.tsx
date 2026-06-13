/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Calendar, Camera, X, CheckCircle, XCircle, Info, AlertTriangle,
  Clock, Timer, UserCheck, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useGetMyProfile } from '../hooks/api/useEmployeeProfile';
import { getAttendances } from '../services/api';

// ============================================================
// TOAST SYSTEM
// ============================================================
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: number; type: ToastType; message: string; }

const TOAST_CONFIG: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: { bg: 'bg-[#B9F0C8]', icon: <CheckCircle  className="w-4 h-4 shrink-0" /> },
  error:   { bg: 'bg-[#F4836C]', icon: <XCircle      className="w-4 h-4 shrink-0" /> },
  info:    { bg: 'bg-[#A8D8F0]', icon: <Info          className="w-4 h-4 shrink-0" /> },
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
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 items-end">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onClose={onClose} />)}
    </div>
  );
}

// ============================================================
// DATA & TYPES
// ============================================================
interface AttendanceRecord {
  id: number;
  date: string;
  dateLabel: string;
  entry: string | null;
  exit: string | null;
  status: string;
  entryPhoto: string | null;
  exitPhoto: string | null;
}

const PAGE_SIZE = 5;

function calcDuration(entry: string | null, exit: string | null): string {
  if (!entry || !exit) return '—';
  const [eh, em] = entry.split(':').map(Number);
  const [xh, xm] = exit.split(':').map(Number);
  const mins = (xh * 60 + xm) - (eh * 60 + em);
  if (mins <= 0) return '—';
  return `${Math.floor(mins / 60)}j ${mins % 60}m`;
}

function getMonthRange(offset: number): { start: string; end: string } {
  const d = new Date();
  d.setMonth(d.getMonth() + offset, 1);
  const year  = d.getFullYear();
  const month = d.getMonth();
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end   = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
  return { start, end };
}

function monthLabel(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m] = dateStr.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

// SummaryCard — angka text-4xl → text-3xl, padding p-4→p-3
function SummaryCard({ label, value, color, icon }: {
  label: string; value: number | string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className={`flex-1 min-w-[120px] border-4 border-on-surface shadow-hard p-3 ${color} flex flex-col gap-1`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        {icon}
      </div>
      <span className="text-3xl font-black leading-none">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    tepat: 'bg-[#4ade80] text-[#064e3b]',
    telat: 'bg-[#f87171] text-[#450a0a]',
    bolos: 'bg-on-surface text-on-primary',
  };
  const activeCfg = cfg[status?.toLowerCase()] || cfg['tepat'];
  return (
    <span className={cn('inline-block px-2 py-0.5 border-2 border-on-surface text-[9px] font-black uppercase shadow-[1px_1px_0px_0px_#000]', activeCfg)}>
      {status || 'TEPAT'}
    </span>
  );
}

function PhotoModal({ photoUrl, label, onClose }: { photoUrl: string; label: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/80 backdrop-blur-sm">
      <div className="w-full max-w-lg border-4 border-on-surface bg-surface shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b-4 border-on-surface bg-primary-container">
          <span className="font-black uppercase text-sm tracking-wider flex items-center gap-2">
            <Camera className="w-4 h-4" /> {label}
          </span>
          <button onClick={onClose} className="border-2 border-on-surface w-8 h-8 flex items-center justify-center hover:bg-on-surface hover:text-on-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 bg-surface-container-lowest">
          <img src={photoUrl} alt={label} className="w-full border-4 border-on-surface shadow-hard object-cover" />
        </div>
        <div className="px-5 py-3 border-t-4 border-on-surface bg-surface-container flex justify-end">
          <button onClick={onClose} className="font-bold py-2 px-6 border-4 border-on-surface shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg transition-all bg-surface uppercase text-xs">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function EmployeeAttendanceView() {
  const today = getMonthRange(0);

  const [startDate,   setStartDate]   = useState(today.start);
  const [endDate,     setEndDate]     = useState(today.end);
  const [currentPage, setCurrentPage] = useState(1);
  const [photoModal,  setPhotoModal]  = useState<{ url: string; label: string } | null>(null);
  const [toasts,      setToasts]      = useState<Toast[]>([]);

  const { data: resProfile } = useGetMyProfile();
  const dbEmployee = resProfile?.data;
  const [records, setRecords]         = useState<AttendanceRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (!dbEmployee?.id) return;
    let isMounted = true;

    const fetchHistory = async () => {
      setIsLoadingData(true);
      try {
        const res = await getAttendances();

        let allData: any[] = [];
        if (Array.isArray(res)) allData = res;
        else if (res?.data && Array.isArray(res.data)) allData = res.data;

        const myData = allData.filter((item: any) => {
          const empId = item.employee_id || item.EmployeeID || item.employeeId;
          return String(empId) === String(dbEmployee.id);
        });

        const formatted: AttendanceRecord[] = myData.map((item: any) => {
          const rawDate  = item.date || item.Date || '';
          const cleanDate = rawDate.split('T')[0];
          const d = new Date(cleanDate);
          const dateLabel = isNaN(d.getTime())
            ? cleanDate
            : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

          return {
            id: item.id || item.ID,
            date: cleanDate,
            dateLabel,
            entry: item.time_in || item.entry_time || item.TimeIn || item.EntryTime || null,
            exit:  item.exit_time || item.time_out || item.ExitTime || item.TimeOut || null,
            status: (item.status || item.Status || 'tepat').toLowerCase(),
            entryPhoto: item.photo_in || item.entry_photo || item.PhotoIn || item.EntryPhoto || null,
            exitPhoto:  item.exit_photo || item.photo_out || item.ExitPhoto || item.PhotoOut || null,
          };
        });

        formatted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (isMounted) setRecords(formatted);
      } catch (error) {
        console.error("Gagal menarik data:", error);
        if (isMounted) showToast('error', 'Gagal memuat data riwayat absensi.');
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    };

    fetchHistory();
    return () => { isMounted = false; };
  }, [dbEmployee?.id]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const closeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const applyShortcut = (offset: number) => {
    const r = getMonthRange(offset);
    setStartDate(r.start); setEndDate(r.end);
  };

  const filtered = useMemo(() => records.filter(r => {
    return r.date >= startDate && r.date <= endDate;
  }), [records, startDate, endDate]);

  useEffect(() => { setCurrentPage(1); }, [filtered.length]);

  const summary = useMemo(() => ({
    total: filtered.length,
    tepat: filtered.filter(r => r.status === 'tepat').length,
    telat: filtered.filter(r => r.status === 'telat').length,
    bolos: filtered.filter(r => r.status === 'bolos').length,
  }), [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const periodeLabel = `${monthLabel(startDate)} - ${monthLabel(endDate)}`;

  const openPhoto = (url: string | null, label: string) => {
    if (!url) { showToast('info', 'Foto bukti belum tersedia untuk record ini.'); return; }
    setPhotoModal({ url, label });
  };

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <ToastContainer toasts={toasts} onClose={closeToast} />

      {photoModal && (
        <PhotoModal photoUrl={photoModal.url} label={photoModal.label} onClose={() => setPhotoModal(null)} />
      )}

      {/* gap-8 → gap-6 */}
      <div className="flex flex-col gap-6">

        {/* Header — text-5xl → text-3xl, text-lg → text-sm */}
        <div>
          <h2 className="text-3xl font-black text-on-surface uppercase tracking-tight">Riwayat Absensi</h2>
          <p className="text-sm font-medium text-on-surface-variant mt-0.5">Lihat history kehadiran Anda.</p>
        </div>

        {/* Summary Cards — angka text-4xl→text-3xl, padding p-4→p-3, ikon w-5→w-4, gap-4→gap-3 */}
        <div className="flex flex-wrap gap-3">
          <SummaryCard label="Total Absensi" value={summary.total} color="bg-surface-container" icon={<UserCheck className="w-4 h-4" />} />
          <SummaryCard label="Tepat Waktu"   value={summary.tepat} color="bg-[#B9F0C8]"         icon={<Clock     className="w-4 h-4" />} />
          <SummaryCard label="Telat Masuk"   value={summary.telat} color="bg-[#F9E07A]"         icon={<Timer     className="w-4 h-4" />} />
          <SummaryCard label="Tidak Hadir"   value={summary.bolos} color="bg-[#F4836C]"         icon={<XCircle   className="w-4 h-4" />} />
        </div>

        {/* Filter — padding p-6→p-4, gap-4→gap-3, input min-w dikecilkan */}
        <div className="bg-surface-container p-4 border-4 border-on-surface shadow-hard-lg flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Filter Periode</p>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: 'Bulan Lalu', offset: -1 },
                { label: 'Bulan Ini',  offset:  0 },
              ].map(s => (
                <button
                  key={s.label}
                  onClick={() => applyShortcut(s.offset)}
                  className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border-2 border-on-surface bg-surface shadow-[2px_2px_0px_0px_#000] hover:bg-primary-fixed hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[10px] font-black mb-1 uppercase tracking-widest">Mulai Periode</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                <input className="neu-input w-full pl-10 font-bold" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="block text-[10px] font-black mb-1 uppercase tracking-widest">Akhir Periode</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                <input className="neu-input w-full pl-10 font-bold" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          <p className="text-xs font-bold text-on-surface-variant">
            Periode aktif: <span className="font-black text-on-surface">{periodeLabel}</span>
          </p>
        </div>

        {/* Tabel — padding p-4→p-3, jam text-2xl→text-xl, tombol kamera w-9→w-8 */}
        <div className="bg-surface border-4 border-on-surface shadow-hard-xl overflow-hidden flex flex-col">

          <div className="bg-on-surface text-on-primary px-4 py-3 border-b-4 border-on-surface flex justify-between items-center">
            <span className="font-black uppercase tracking-tight text-sm">Catatan Kehadiran</span>
            <span className="text-xs bg-surface text-on-surface px-3 py-1 border-2 border-on-surface font-black uppercase">
              {filtered.length} Data
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[620px]">
              <thead>
                <tr className="bg-surface-container-high border-b-4 border-on-surface font-black uppercase tracking-widest text-[10px]">
                  <th className="p-3 border-r-4 border-on-surface">Tanggal</th>
                  <th className="p-3 border-r-4 border-on-surface text-center">Jam Masuk</th>
                  <th className="p-3 border-r-4 border-on-surface text-center">Jam Keluar</th>
                  <th className="p-3 border-r-4 border-on-surface text-center">Durasi</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="font-bold">

                {isLoadingData && (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex items-center justify-center py-12 gap-3 text-on-surface-variant">
                        <Loader2 className="w-7 h-7 animate-spin" />
                        <span className="font-black uppercase text-sm">Menarik Data Riwayat...</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoadingData && paginated.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-on-surface-variant">
                        <div className="border-4 border-on-surface bg-surface-container p-5 shadow-hard">
                          <Calendar className="w-10 h-10 opacity-40" />
                        </div>
                        <p className="font-black uppercase text-sm">Tidak ada data ditemukan</p>
                        <p className="text-xs font-bold">Coba ubah rentang tanggal bulan ini</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoadingData && paginated.map(record => (
                  <tr key={record.id} className="border-b-4 border-on-surface hover:bg-surface-container-lowest transition-colors">

                    <td className="p-3 border-r-4 border-on-surface whitespace-nowrap text-sm font-black">{record.dateLabel}</td>

                    {/* Jam Masuk */}
                    <td className="p-3 border-r-4 border-on-surface">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn('text-xl font-black', !record.entry && 'text-on-surface-variant')}>
                          {record.entry || '--:--'}
                        </span>
                        <button
                          onClick={() => openPhoto(record.entryPhoto, `Bukti Masuk — ${record.dateLabel}`)}
                          className={cn(
                            'w-8 h-8 border-4 border-on-surface flex items-center justify-center transition-all',
                            record.entryPhoto
                              ? 'bg-surface-container hover:bg-primary-container shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer'
                              : 'bg-surface-container opacity-30 cursor-not-allowed'
                          )}
                        >
                          <Camera className="w-3.5 h-3.5 stroke-[2.5px]" />
                        </button>
                      </div>
                    </td>

                    {/* Jam Keluar */}
                    <td className="p-3 border-r-4 border-on-surface">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn('text-xl font-black', !record.exit && 'text-on-surface-variant')}>
                          {record.exit || '--:--'}
                        </span>
                        <button
                          onClick={() => openPhoto(record.exitPhoto, `Bukti Keluar — ${record.dateLabel}`)}
                          className={cn(
                            'w-8 h-8 border-4 border-on-surface flex items-center justify-center transition-all',
                            record.exitPhoto
                              ? 'bg-surface-container hover:bg-primary-container shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer'
                              : 'bg-surface-container opacity-30 cursor-not-allowed'
                          )}
                        >
                          <Camera className="w-3.5 h-3.5 stroke-[2.5px]" />
                        </button>
                      </div>
                    </td>

                    {/* Durasi */}
                    <td className="p-3 border-r-4 border-on-surface text-center">
                      <span className="font-black text-sm">{calcDuration(record.entry, record.exit)}</span>
                    </td>

                    {/* Status */}
                    <td className="p-3 text-center">
                      <StatusBadge status={record.status} />
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination — w-9→w-8, gap-2→gap-1.5 */}
          {filtered.length > 0 && (
            <div className="border-t-4 border-on-surface px-4 py-3 bg-surface-container flex items-center justify-between gap-4 flex-wrap">
              <span className="text-xs font-bold text-on-surface-variant uppercase">
                Hal. {currentPage} dari {totalPages} &nbsp;·&nbsp; {filtered.length} total data
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 border-4 border-on-surface shadow-hard bg-surface flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={cn(
                      'w-8 h-8 border-4 border-on-surface font-black text-sm transition-all',
                      pg === currentPage
                        ? 'bg-on-surface text-on-primary'
                        : 'bg-surface hover:bg-primary-container shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5'
                    )}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 border-4 border-on-surface shadow-hard bg-surface flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}