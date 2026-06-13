/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Calendar, Download, Camera, ChevronDown, X,
  CheckCircle, XCircle, Info, AlertTriangle,
  Users, Clock, UserX, Timer, Search, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';

import { useGetAttendances } from '../../hooks/api/useAttendance';
import { useGetOutletsForDropdown } from '../../hooks/api/useEmployee';

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
  name: string;
  outlet: string;
  entry: string | null;
  exit: string | null;
  status: 'tepat' | 'telat' | 'absen';
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

// [FIX] Export ke XLSX sungguhan menggunakan SheetJS (bukan CSV)
function exportXLSX(records: AttendanceRecord[], startDate: string, endDate: string) {
  const formatData = records.map(r => ({
    'Tanggal':        r.dateLabel,
    'Nama Karyawan':  r.name,
    'Outlet':         r.outlet,
    'Jam Masuk':      r.entry  || '--:--',
    'Jam Keluar':     r.exit   || '--:--',
    'Durasi':         calcDuration(r.entry, r.exit),
    'Status':         r.status.toUpperCase(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(formatData);

  // Atur lebar kolom agar rapi di Excel
  worksheet['!cols'] = [
    { wch: 15 }, // Tanggal
    { wch: 25 }, // Nama Karyawan
    { wch: 20 }, // Outlet
    { wch: 12 }, // Jam Masuk
    { wch: 12 }, // Jam Keluar
    { wch: 12 }, // Durasi
    { wch: 12 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Absensi');

  const filename = `Laporan_Absensi_${startDate}_sd_${endDate}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
function SummaryCard({ label, value, sub, color, icon }: {
  label: string; value: number | string; sub?: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className={`flex-1 min-w-[130px] border-4 border-on-surface shadow-hard p-3 ${color} flex flex-col gap-1`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        {icon}
      </div>
      <span className="text-3xl font-black leading-none">{value}</span>
      {sub && <span className="text-[10px] font-bold opacity-70">{sub}</span>}
    </div>
  );
}

function StatusBadge({ status }: { status: 'tepat' | 'telat' | 'absen' }) {
  const cfg = {
    tepat: 'bg-[#4ade80] text-[#064e3b]',
    telat: 'bg-[#f87171] text-[#450a0a]',
    absen: 'bg-on-surface text-on-primary',
  }[status];
  return (
    <span className={cn('inline-block px-2 py-0.5 border-2 border-on-surface text-[9px] font-black uppercase shadow-[1px_1px_0px_0px_#000]', cfg)}>
      {status}
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
        <div className="p-4 bg-surface-container-lowest flex justify-center">
          <img src={photoUrl} alt={label} className="max-h-[60vh] border-4 border-on-surface shadow-hard object-contain" />
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
export default function AttendanceSubView() {
  const { data: resAttendances, isLoading: loadingAtt } = useGetAttendances();
  const { data: resOutlets } = useGetOutletsForDropdown();

  const rawAttendances = resAttendances?.data || [];
  const dbOutlets      = resOutlets?.data     || [];

  const [startDate,   setStartDate]   = useState('2026-05-01');
  const [endDate,     setEndDate]     = useState('2026-05-31');
  const [outlet,      setOutlet]      = useState('Semua Outlet');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [photoModal,  setPhotoModal]  = useState<{ url: string; label: string } | null>(null);
  const [toasts,      setToasts]      = useState<Toast[]>([]);

  const showToast  = useCallback((type: ToastType, message: string) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);
  const closeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const mappedRecords: AttendanceRecord[] = useMemo(() => {
    return rawAttendances.map((d: any) => ({
      id:         d.id,
      date:       d.date        || '',
      dateLabel:  d.date_label  || d.date || '',
      name:       d.employee_name || 'Tanpa Nama',
      outlet:     d.outlet_name   || '-',
      entry:      d.entry_time ? d.entry_time.substring(0, 5) : null,
      exit:       d.exit_time  ? d.exit_time.substring(0, 5)  : null,
      status:     d.status     || 'absen',
      entryPhoto: d.entry_photo || null,
      exitPhoto:  d.exit_photo  || null,
    }));
  }, [rawAttendances]);

  const filtered = useMemo(() => mappedRecords.filter(r => {
    const inDate   = r.date >= startDate && r.date <= endDate;
    const inOutlet = outlet === 'Semua Outlet' || r.outlet === outlet;
    const inSearch = !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase());
    return inDate && inOutlet && inSearch;
  }), [mappedRecords, startDate, endDate, outlet, searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [filtered.length]);

  const summary = useMemo(() => ({
    total: filtered.length,
    tepat: filtered.filter(r => r.status === 'tepat').length,
    telat: filtered.filter(r => r.status === 'telat').length,
    absen: filtered.filter(r => r.status === 'absen').length,
  }), [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pct        = (n: number) => summary.total ? `${Math.round(n / summary.total * 100)}% dari total` : '0%';

  // [FIX] Export ke XLSX sungguhan
  const handleExport = () => {
    if (!filtered.length) { showToast('warning', 'Tidak ada data untuk diekspor.'); return; }
    exportXLSX(filtered, startDate, endDate);
    showToast('success', `${filtered.length} baris berhasil diekspor ke Excel.`);
  };

  const openPhoto = (url: string | null, label: string) => {
    if (!url) { showToast('info', 'Foto bukti belum tersedia untuk record ini.'); return; }
    setPhotoModal({ url, label });
  };

  return (
    <>
      <style>{`@keyframes toastSlideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      <ToastContainer toasts={toasts} onClose={closeToast} />

      {photoModal && (
        <PhotoModal photoUrl={photoModal.url} label={photoModal.label} onClose={() => setPhotoModal(null)} />
      )}

      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-on-surface uppercase tracking-tight">Absensi Log</h2>
            <p className="text-sm font-medium text-on-surface-variant mt-0.5">Rekap catatan kehadiran seluruh karyawan.</p>
          </div>
          {/* [FIX] Label tombol dari "Ekspor CSV" → "Ekspor Excel" */}
          <button
            onClick={handleExport}
            className="bg-tertiary text-on-tertiary font-black py-3 px-5 border-4 border-on-surface shadow-hard hover:translate-x-[-4px] hover:translate-y-[-4px] active:translate-x-0 active:translate-y-0 transition-all flex items-center gap-2 text-sm uppercase tracking-wider"
          >
            <Download className="w-4 h-4 stroke-[3px]" />
            Ekspor Excel
          </button>
        </div>

        {/* Summary Cards */}
        <div className="flex flex-wrap gap-3">
          <SummaryCard label="Total Absensi" value={summary.total} color="bg-surface-container"  icon={<Users  className="w-4 h-4" />} sub="rekap periode dipilih" />
          <SummaryCard label="Tepat Waktu"   value={summary.tepat} color="bg-[#B9F0C8]"          icon={<Clock  className="w-4 h-4" />} sub={`${pct(summary.tepat)} — periode ini`} />
          <SummaryCard label="Telat Masuk"   value={summary.telat} color="bg-[#F9E07A]"          icon={<Timer  className="w-4 h-4" />} sub={`${pct(summary.telat)} — periode ini`} />
          <SummaryCard label="Tidak Hadir"   value={summary.absen} color="bg-[#F4836C]"          icon={<UserX  className="w-4 h-4" />} sub={`${pct(summary.absen)} — periode ini`} />
        </div>

        {/* Filter */}
        <div className="bg-surface-container p-4 border-4 border-on-surface shadow-hard-lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">Filter Data</p>
          <div className="flex flex-wrap gap-3 items-end">

            <div className="flex-1 min-w-[140px]">
              <label className="block text-[10px] font-black mb-1 uppercase tracking-widest">Tanggal Mulai</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                <input className="neu-input w-full pl-10 font-bold" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="block text-[10px] font-black mb-1 uppercase tracking-widest">Tanggal Akhir</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                <input className="neu-input w-full pl-10 font-bold" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="block text-[10px] font-black mb-1 uppercase tracking-widest">Outlet</label>
              <div className="relative">
                <select className="neu-input w-full appearance-none pr-10 font-bold cursor-pointer uppercase text-sm" value={outlet} onChange={e => setOutlet(e.target.value)}>
                  <option value="Semua Outlet">Semua Outlet</option>
                  {dbOutlets.map((o: any) => <option key={o.id} value={o.name}>{o.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            <div className="flex-1 min-w-[160px]">
              <label className="block text-[10px] font-black mb-1 uppercase tracking-widest">Cari Nama</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                <input
                  className="neu-input w-full pl-10 font-bold"
                  type="text"
                  placeholder="Ketik nama karyawan..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Tabel */}
        <div className="bg-surface border-4 border-on-surface shadow-hard-xl overflow-hidden flex flex-col">

          <div className="bg-on-surface text-on-primary px-4 py-3 border-b-4 border-on-surface flex justify-between items-center">
            <span className="font-black uppercase tracking-tight text-sm">Catatan Kehadiran</span>
            <span className="text-xs bg-surface text-on-surface px-3 py-1 border-2 border-on-surface font-black uppercase">
              {filtered.length} Data
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-surface-container-high border-b-4 border-on-surface font-black uppercase tracking-widest text-[10px]">
                  <th className="p-3 border-r-4 border-on-surface">Tanggal</th>
                  <th className="p-3 border-r-4 border-on-surface">Nama Karyawan</th>
                  <th className="p-3 border-r-4 border-on-surface">Outlet</th>
                  <th className="p-3 border-r-4 border-on-surface text-center">Jam Masuk</th>
                  <th className="p-3 border-r-4 border-on-surface text-center">Jam Keluar</th>
                  <th className="p-3 border-r-4 border-on-surface text-center">Durasi</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="font-bold">

                {loadingAtt && (
                  <tr><td colSpan={7} className="p-6 text-center font-bold animate-pulse text-sm">Memuat data absensi...</td></tr>
                )}

                {!loadingAtt && paginated.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-on-surface-variant">
                        <div className="border-4 border-on-surface bg-surface-container p-5 shadow-hard">
                          <Search className="w-10 h-10 opacity-40" />
                        </div>
                        <p className="font-black uppercase text-sm">Tidak ada data ditemukan</p>
                        <p className="text-xs font-bold">Belum ada absensi atau coba ubah filter tanggal</p>
                      </div>
                    </td>
                  </tr>
                )}

                {paginated.map(record => (
                  <tr key={record.id} className="border-b-4 border-on-surface hover:bg-surface-container-lowest transition-colors">
                    <td className="p-3 border-r-4 border-on-surface whitespace-nowrap text-sm">{record.dateLabel}</td>
                    <td className="p-3 border-r-4 border-on-surface font-black uppercase text-sm">{record.name}</td>
                    <td className="p-3 border-r-4 border-on-surface text-sm uppercase">{record.outlet}</td>

                    {/* Jam Masuk */}
                    <td className="p-3 border-r-4 border-on-surface">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn('text-xl font-black', !record.entry && 'text-on-surface-variant')}>
                          {record.entry || '--:--'}
                        </span>
                        <button
                          onClick={() => openPhoto(record.entryPhoto, `Bukti Masuk — ${record.name} (${record.dateLabel})`)}
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
                          onClick={() => openPhoto(record.exitPhoto, `Bukti Keluar — ${record.name} (${record.dateLabel})`)}
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

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="border-t-4 border-on-surface px-4 py-3 bg-surface-container flex items-center justify-between gap-4 flex-wrap">
              <span className="text-xs font-bold text-on-surface-variant uppercase">
                Hal. {currentPage} dari {totalPages} &nbsp;·&nbsp; {filtered.length} total data
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 border-4 border-on-surface shadow-hard bg-surface flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                  <button key={pg} onClick={() => setCurrentPage(pg)} className={cn('w-8 h-8 border-4 border-on-surface font-black text-sm transition-all', pg === currentPage ? 'bg-on-surface text-on-primary' : 'bg-surface hover:bg-primary-container shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5')}>
                    {pg}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 border-4 border-on-surface shadow-hard bg-surface flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0">
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