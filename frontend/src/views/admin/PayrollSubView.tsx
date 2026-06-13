/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Wallet, Users, AlertTriangle, Search, FileText,
  Calendar, ChevronDown, Download, X,
  CheckCircle, XCircle, Info, Clock,
  ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';

import { useGetPayrolls } from '../../hooks/api/usePayroll';
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
interface PayrollRecord {
  id: number;
  name: string;
  outlet: string;
  tipe_gaji: 'Bulanan' | 'Harian';
  target_hari_kerja: number;
  hadir_hari: number;
  frekuensi_telat: number;
  gaji_pokok: number;
  bonus: number;
  pot_absen: number;
  pot_telat: number;
  gaji_bersih: number;
}

const TIPE = ['Semua Tipe', 'Bulanan', 'Harian'];
const PAGE_SIZE = 5;

function fmtRp(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
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
// EXPORT FUNCTIONS
// ============================================================
function exportExcel(records: PayrollRecord[], periodeLabel: string) {
  if (!records || records.length === 0) return;
  const formatData = records.map(r => {
    const bolos = Math.max(0, r.target_hari_kerja - r.hadir_hari);
    return {
      "Nama Karyawan": r.name,
      "Outlet": r.outlet,
      "Tipe Gaji": r.tipe_gaji,
      "Target (Hari)": r.target_hari_kerja,
      "Hadir (Hari)": r.hadir_hari,
      "Bolos (Hari)": bolos,
      "Frekuensi Telat": `${r.frekuensi_telat}x`,
      "Gaji Pokok (Rp)": r.gaji_pokok,
      "Bonus Rajin (Rp)": r.bonus,
      "Potongan Absen (Rp)": bolos * r.pot_absen,
      "Potongan Telat (Rp)": r.frekuensi_telat * r.pot_telat,
      "Gaji Bersih (Rp)": r.gaji_bersih
    };
  });
  const worksheet = XLSX.utils.json_to_sheet(formatData);
  worksheet['!cols'] = [
    { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 22 },
    { wch: 22 }, { wch: 25 }
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap_Gaji");
  const safePeriode = periodeLabel.replace(/[^a-zA-Z0-9-]/g, '_');
  XLSX.writeFile(workbook, `Laporan_Gaji_${safePeriode}.xlsx`);
}

function printSlipGaji(r: PayrollRecord, periodeLabel: string) {
  const bolos         = Math.max(0, r.target_hari_kerja - r.hadir_hari);
  const potAbsenTotal = bolos * r.pot_absen;
  const potTelatTotal = r.frekuensi_telat * r.pot_telat;
  const gajiBersih    = r.gaji_bersih;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Slip Gaji — ${r.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Courier New', monospace; }
    body { background: #fff; padding: 32px; color: #000; }
    .header { border: 4px solid #000; padding: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
    .header p { font-size: 11px; font-weight: bold; text-transform: uppercase; margin-top: 4px; color: #555; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; }
    .meta-item { border: 2px solid #000; padding: 8px 12px; }
    .meta-item label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #666; display: block; margin-bottom: 2px; }
    .meta-item span { font-size: 13px; font-weight: 900; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #000; color: #fff; padding: 8px 12px; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; text-align: left; border: 2px solid #000; }
    td { padding: 8px 12px; border: 2px solid #000; font-size: 12px; font-weight: bold; }
    .plus { color: #166534; }
    .minus { color: #991b1b; }
    .total-row td { background: #000; color: #fff; font-size: 14px; font-weight: 900; }
    .footer { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .sign-box { border: 2px solid #000; padding: 12px; }
    .sign-box label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 48px; }
    .sign-box .line { border-top: 2px solid #000; padding-top: 4px; font-size: 10px; font-weight: bold; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Slip Gaji Karyawan</h1>
    <p>Periode: ${periodeLabel}</p>
  </div>
  <div class="meta">
    <div class="meta-item"><label>Nama Karyawan</label><span>${r.name}</span></div>
    <div class="meta-item"><label>Outlet</label><span>${r.outlet}</span></div>
    <div class="meta-item"><label>Tipe Gaji</label><span>${r.tipe_gaji}</span></div>
    <div class="meta-item"><label>Target Hari Kerja</label><span>${r.target_hari_kerja} Hari</span></div>
    <div class="meta-item"><label>Hadir</label><span>${r.hadir_hari} Hari</span></div>
    <div class="meta-item"><label>Tidak Hadir</label><span>${bolos} Hari</span></div>
  </div>
  <table>
    <thead><tr><th>Keterangan</th><th style="text-align:right">Jumlah</th></tr></thead>
    <tbody>
      <tr><td class="plus">+ Gaji Pokok</td><td style="text-align:right" class="plus">${fmtRp(r.gaji_pokok)}</td></tr>
      <tr><td class="plus">+ Bonus Rajin</td><td style="text-align:right" class="plus">${fmtRp(r.bonus)}</td></tr>
      <tr><td class="minus">- Potongan Tidak Hadir (${bolos} hr x ${fmtRp(r.pot_absen)})</td><td style="text-align:right" class="minus">- ${fmtRp(potAbsenTotal)}</td></tr>
      <tr><td class="minus">- Potongan Telat (${r.frekuensi_telat}x x ${fmtRp(r.pot_telat)})</td><td style="text-align:right" class="minus">- ${fmtRp(potTelatTotal)}</td></tr>
      <tr class="total-row"><td>GAJI BERSIH</td><td style="text-align:right">${fmtRp(gajiBersih)}</td></tr>
    </tbody>
  </table>
  <div class="footer">
    <div class="sign-box"><label>Tanda Tangan Karyawan</label><div class="line">${r.name}</div></div>
    <div class="sign-box"><label>Tanda Tangan HRD / Admin</label><div class="line">______________________</div></div>
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function PayrollSubView() {
  const today = getMonthRange(0);

  const [startDate,   setStartDate]   = useState(today.start);
  const [endDate,     setEndDate]     = useState(today.end);
  const [outlet,      setOutlet]      = useState('Semua Outlet');
  const [tipe,        setTipe]        = useState('Semua Tipe');
  const [search,      setSearch]      = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts,      setToasts]      = useState<Toast[]>([]);

  const { data: resPayrolls, isLoading: loadingPayroll } = useGetPayrolls(startDate, endDate);
  const { data: resOutlets } = useGetOutletsForDropdown();

  const dbOutlets   = resOutlets?.data  || [];
  const rawPayrolls = resPayrolls?.data || [];

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);
  const closeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const mappedRecords: PayrollRecord[] = useMemo(() => {
    return rawPayrolls.map((d: any) => ({
      id: d.id,
      name: d.employee_name || 'Tanpa Nama',
      outlet: d.outlet_name || '-',
      tipe_gaji: d.salary_type || 'Bulanan',
      target_hari_kerja: d.target_hari_kerja || 0,
      hadir_hari: d.hadir_hari || 0,
      frekuensi_telat: d.frekuensi_telat || 0,
      gaji_pokok: d.gaji_pokok || 0,
      bonus: d.bonus_rajin || 0,
      pot_absen: d.potongan_absen || 0,
      pot_telat: d.potongan_telat || 0,
      gaji_bersih: d.gaji_bersih || 0,
    }));
  }, [rawPayrolls]);

  const applyShortcut = (offset: number) => {
    const r = getMonthRange(offset);
    setStartDate(r.start); setEndDate(r.end);
  };

  const validatePeriode = () => {
    if (startDate && endDate && startDate > endDate) {
      showToast('warning', 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir!');
      return false;
    }
    return true;
  };

  const filtered = useMemo(() => mappedRecords.filter(r => {
    const inOutlet = outlet === 'Semua Outlet' || r.outlet === outlet;
    const inTipe   = tipe   === 'Semua Tipe'   || r.tipe_gaji === tipe;
    const inSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
    return inOutlet && inTipe && inSearch;
  }), [mappedRecords, outlet, tipe, search]);

  useEffect(() => setCurrentPage(1), [filtered.length]);

  const kpi = useMemo(() => {
    const totalPayroll  = filtered.reduce((s, r) => s + r.gaji_bersih, 0);
    const totalPotongan = filtered.reduce((s, r) => {
      const bolos = Math.max(0, r.target_hari_kerja - r.hadir_hari);
      return s + bolos * r.pot_absen + r.frekuensi_telat * r.pot_telat;
    }, 0);
    return { totalPayroll, totalPotongan, totalKaryawan: filtered.length };
  }, [filtered]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const periodeLabel = `${monthLabel(startDate)} - ${monthLabel(endDate)}` || `${startDate} s/d ${endDate}`;

  const handleExportExcel = () => {
    if (!filtered.length) { showToast('warning', 'Tidak ada data untuk diekspor.'); return; }
    exportExcel(filtered, periodeLabel);
    showToast('success', `${filtered.length} data berhasil diekspor ke Excel.`);
  };

  const handleSlipGaji = (r: PayrollRecord) => {
    printSlipGaji(r, periodeLabel);
    showToast('info', `Membuka slip gaji ${r.name}...`);
  };

  return (
    <>
      <style>{`@keyframes toastSlideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      <ToastContainer toasts={toasts} onClose={closeToast} />

      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface mb-0.5 tracking-tight">PENGGAJIAN</h1>
            <p className="text-sm font-medium text-on-surface-variant">Kelola dan distribusikan gaji karyawan.</p>
          </div>
          <button onClick={handleExportExcel} className="bg-tertiary text-on-tertiary font-black py-3 px-5 border-4 border-on-surface shadow-hard hover:translate-x-[-4px] hover:translate-y-[-4px] active:translate-x-0 active:translate-y-0 transition-all flex items-center gap-2 text-sm uppercase tracking-wider">
            <Download className="w-4 h-4 stroke-[3px]" /> Ekspor Excel
          </button>
        </div>

        {/* Filter Periode */}
        <div className="bg-surface-container p-4 border-4 border-on-surface shadow-hard-lg flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Filter Periode</p>
            <div className="flex gap-1.5 flex-wrap">
              {[{ label: 'Bulan Lalu', offset: -1 }, { label: 'Bulan Ini', offset: 0 }].map(s => (
                <button key={s.label} onClick={() => applyShortcut(s.offset)} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border-2 border-on-surface bg-surface shadow-[2px_2px_0px_0px_#000] hover:bg-primary-fixed hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[10px] font-black mb-1 uppercase tracking-widest">Mulai Periode</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                <input className="neu-input w-full pl-10 font-bold" type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setTimeout(() => validatePeriode(), 100); }} />
              </div>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-[10px] font-black mb-1 uppercase tracking-widest">Akhir Periode</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                <input className="neu-input w-full pl-10 font-bold" type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setTimeout(() => validatePeriode(), 100); }} />
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

            <div className="flex-1 min-w-[140px]">
              <label className="block text-[10px] font-black mb-1 uppercase tracking-widest">Tipe Gaji</label>
              <div className="relative">
                <select className="neu-input w-full appearance-none pr-10 font-bold cursor-pointer" value={tipe} onChange={e => setTipe(e.target.value)}>
                  {TIPE.map(t => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>
          <p className="text-xs font-bold text-on-surface-variant">Periode aktif: <span className="font-black text-on-surface">{periodeLabel}</span></p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface border-4 border-on-surface shadow-hard-lg p-4 flex flex-col gap-1.5 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-xl transition-all">
            <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-on-surface-variant">
              <Wallet className="w-4 h-4" /> Total Penggajian
            </div>
            <div className="text-2xl font-black text-on-surface leading-tight">{fmtRp(kpi.totalPayroll)}</div>
            <div className="text-xs font-bold text-on-surface-variant uppercase">{periodeLabel}</div>
          </div>
          <div className="bg-primary-fixed border-4 border-on-surface shadow-hard-lg p-4 flex flex-col gap-1.5 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-xl transition-all">
            <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><Users className="w-4 h-4" /> Karyawan Diproses</div>
            <div className="text-4xl font-black">{kpi.totalKaryawan}</div>
            <div className="text-xs font-bold uppercase">Sesuai filter aktif</div>
          </div>
          <div className="bg-[#F4836C] border-4 border-on-surface shadow-hard-lg p-4 flex flex-col gap-1.5 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-xl transition-all">
            <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><AlertTriangle className="w-4 h-4" /> Total Potongan</div>
            <div className="text-2xl font-black leading-tight">- {fmtRp(kpi.totalPotongan)}</div>
            <div className="text-xs font-bold uppercase">Absen + keterlambatan</div>
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-surface border-4 border-on-surface shadow-hard-xl overflow-hidden flex flex-col">
          <div className="border-b-4 border-on-surface bg-surface-container-low p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <h2 className="text-base font-black uppercase tracking-tight">Rekap Gaji Karyawan</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              <input className="neu-input w-full pl-10 font-bold" placeholder="Cari nama karyawan..." type="text" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="border-b-4 border-on-surface bg-surface-container font-black uppercase tracking-widest text-[10px]">
                  <th className="p-3 border-r-4 border-on-surface">Karyawan</th>
                  <th className="p-3 border-r-4 border-on-surface">Outlet</th>
                  <th className="p-3 border-r-4 border-on-surface text-center">Kehadiran</th>
                  <th className="p-3 border-r-4 border-on-surface text-center">Keterlambatan</th>
                  <th className="p-3 border-r-4 border-on-surface text-right">Gaji Bersih</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="font-bold">

                {loadingPayroll && (
                  <tr><td colSpan={6} className="p-6 text-center font-bold animate-pulse text-sm">Menghitung kalkulasi gaji...</td></tr>
                )}

                {!loadingPayroll && paginated.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-on-surface-variant">
                        <div className="border-4 border-on-surface bg-surface-container p-5 shadow-hard"><Search className="w-10 h-10 opacity-40" /></div>
                        <p className="font-black uppercase text-sm">Tidak ada data ditemukan</p>
                        <p className="text-xs font-bold">Coba ubah filter atau kata kunci pencarian</p>
                      </div>
                    </td>
                  </tr>
                )}

                {paginated.map((row) => {
                  const bolos       = Math.max(0, row.target_hari_kerja - row.hadir_hari);
                  const gajiBersih  = row.gaji_bersih;
                  const potTotal    = bolos * row.pot_absen + row.frekuensi_telat * row.pot_telat;
                  const adaPotongan = potTotal > 0;

                  return (
                    <tr key={row.id} className={cn('border-b-4 border-on-surface hover:bg-surface-container-lowest transition-colors', adaPotongan && 'bg-[#F4836C]/5')}>
                      <td className="p-3 border-r-4 border-on-surface">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 border-2 border-on-surface bg-primary-fixed flex items-center justify-center font-black text-xs shrink-0">
                            {row.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-black uppercase text-sm">{row.name}</div>
                            <div className="text-[10px] font-bold text-on-surface-variant border border-on-surface px-1.5 py-0.5 inline-block mt-0.5">{row.tipe_gaji}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 border-r-4 border-on-surface text-sm uppercase">{row.outlet}</td>
                      <td className="p-3 border-r-4 border-on-surface text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn('inline-block border-2 border-on-surface px-2.5 py-0.5 font-black text-xs shadow-[2px_2px_0px_0px_#000]', bolos === 0 ? 'bg-[#4ade80]' : 'bg-[#F9E07A]')}>
                            {row.hadir_hari}/{row.target_hari_kerja} Hari
                          </span>
                          {bolos > 0 && <span className="text-[10px] font-black text-[#991b1b]">Bolos {bolos}x</span>}
                        </div>
                      </td>
                      <td className="p-3 border-r-4 border-on-surface text-center">
                        <span className={cn('inline-block border-2 border-on-surface px-2.5 py-0.5 font-black text-xs shadow-[2px_2px_0px_0px_#000]', row.frekuensi_telat > 0 ? 'bg-[#F4836C] text-white' : 'bg-surface')}>
                          {row.frekuensi_telat > 0 ? `Telat ${row.frekuensi_telat}x` : 'Tepat Waktu'}
                        </span>
                      </td>
                      <td className="p-3 border-r-4 border-on-surface text-right">
                        <div className="text-lg font-black">{fmtRp(gajiBersih)}</div>
                        <div className="text-[10px] font-bold text-on-surface-variant mt-0.5 space-y-0.5 text-right">
                          <div className="text-[#166534]">+ {fmtRp(row.gaji_pokok)}</div>
                          {row.bonus > 0 && <div className="text-[#166534]">+ {fmtRp(row.bonus)} bonus</div>}
                          {bolos > 0 && <div className="text-[#991b1b]">- {fmtRp(bolos * row.pot_absen)} absen</div>}
                          {row.frekuensi_telat > 0 && <div className="text-[#991b1b]">- {fmtRp(row.frekuensi_telat * row.pot_telat)} telat</div>}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleSlipGaji(row)} className="bg-secondary-container text-on-surface border-4 border-on-surface px-3 py-1.5 font-black shadow-[2px_2px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 mx-auto text-xs uppercase tracking-widest">
                          <FileText className="w-3.5 h-3.5" /> Slip Gaji
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="border-t-4 border-on-surface bg-surface-container px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
              <span className="text-xs font-bold text-on-surface-variant uppercase">Hal. {currentPage} dari {totalPages} &nbsp;·&nbsp; {filtered.length} karyawan</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 border-4 border-on-surface shadow-hard bg-surface flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                  <button key={pg} onClick={() => setCurrentPage(pg)} className={cn('w-8 h-8 border-4 border-on-surface font-black text-sm transition-all', pg === currentPage ? 'bg-on-surface text-on-primary' : 'bg-surface hover:bg-primary-fixed shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5')}>{pg}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 border-4 border-on-surface shadow-hard bg-surface flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
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