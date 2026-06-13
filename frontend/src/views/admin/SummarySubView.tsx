/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import {
  CheckCircle, Clock, AlertTriangle, Users, ChevronDown, Loader2, RefreshCw,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';

import { useGetSummary } from '../../hooks/api/useSummary';
import { useGetOutletsForDropdown } from '../../hooks/api/useEmployee';

// ============================================================
// HELPERS
// ============================================================
function getTodayLabel(): string {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, val));
}

// ============================================================
// CUSTOM TOOLTIP
// ============================================================
function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const hadir = payload.find((p: any) => p.dataKey === 'hadir')?.value ?? 0;
  const total = payload.find((p: any) => p.dataKey === 'total')?.value ?? 0;
  const percent = total > 0 ? Math.round((hadir / total) * 100) : 0;
  return (
    <div className="bg-surface border-4 border-on-surface p-3 shadow-[4px_4px_0px_0px_#000] text-xs font-bold z-50">
      <p className="font-black uppercase mb-1">{label}</p>
      <p>Hadir: <span className="text-[#ffe600] font-black">{hadir}</span></p>
      <p>Total: <span className="font-black">{total}</span></p>
      <p>Tingkat: <span className="font-black">{percent}%</span></p>
    </div>
  );
}

// ============================================================
// EMPTY / ERROR STATE
// ============================================================
function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="w-full h-full border-4 border-on-surface bg-surface-container flex items-center justify-center font-black uppercase text-on-surface-variant text-sm min-h-[120px]">
      {message}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function SummarySubView() {
  const todayLabel = useMemo(() => getTodayLabel(), []);

  const [outletFilter, setOutletFilter] = useState('Semua Outlet');

  const { data: resOutlets } = useGetOutletsForDropdown();
  const {
    data: resSummary,
    isLoading,
    isError,
    refetch,
  } = useGetSummary(outletFilter);

  const dbOutlets: any[] = resOutlets?.data ?? [];

  const rawData = resSummary?.data;

  const kpi = {
    hadir:          rawData?.kpi?.hadir          ?? 0,
    belum_absen:    rawData?.kpi?.belum_absen     ?? 0,
    telat:          rawData?.kpi?.telat           ?? 0,
    total_karyawan: rawData?.kpi?.total_karyawan  ?? 0,
  };

  const pieData: any[] = rawData?.pie_data ?? [
    { name: 'Hadir Tepat', value: 0, color: '#ffe600' },
    { name: 'Hadir Telat', value: 0, color: '#bb0058' },
    { name: 'Belum Absen', value: 0, color: '#e2e2e2' },
  ];
  const barData: any[] = rawData?.bar_data ?? [];

  const pctTepat = kpi.total_karyawan > 0
    ? clamp(Math.round((kpi.hadir / kpi.total_karyawan) * 100))
    : 0;

  const pieTotal = kpi.hadir + kpi.telat + kpi.belum_absen;
  const getPiePct = (rawVal: number) =>
    pieTotal > 0 ? Math.round((rawVal / pieTotal) * 100) : 0;

  return (
    // gap-10 → gap-6
    <div className="flex flex-col gap-6 relative">

      {/* ── Loading Overlay ── */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 bg-on-surface text-on-primary p-6 shadow-hard border-4 border-on-surface">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="font-black uppercase tracking-widest text-xs">Memuat Data...</span>
          </div>
        </div>
      )}

      {/* ── Error State ── */}
      {isError && !isLoading && (
        <div className="border-4 border-on-surface bg-[#F4836C] p-4 flex items-center justify-between gap-4 shadow-hard">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="font-black uppercase text-sm">Gagal memuat data. Periksa koneksi dan coba lagi.</span>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 border-4 border-on-surface bg-surface px-4 py-2 font-black uppercase text-xs shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-on-surface uppercase tracking-tight">Ringkasan Hari Ini</h2>
          <p className="text-sm font-medium text-on-surface-variant capitalize">{todayLabel}</p>
        </div>
        <div className="relative w-full sm:w-56">
          <select
            className="appearance-none w-full bg-surface border-4 border-on-surface shadow-hard font-bold text-on-surface py-2 px-4 pr-10 focus:outline-none focus:bg-primary-container/20 transition-colors uppercase text-sm"
            value={outletFilter}
            onChange={(e) => setOutletFilter(e.target.value)}
          >
            <option value="Semua Outlet">Semua Outlet</option>
            {dbOutlets.map((o: any) => (
              <option key={o.id} value={o.name}>{o.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── KPI Cards — padding p-6→p-4, angka text-5xl→text-4xl, mb-4→mb-2, gap-6→gap-4 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-primary-container border-4 border-on-surface shadow-hard-lg p-4 flex flex-col hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-xl transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Hadir</span>
            <CheckCircle className="w-6 h-6 text-on-surface" />
          </div>
          <div className="text-4xl font-black text-on-surface mb-1">{kpi.hadir}</div>
          <div className="text-xs font-bold text-on-surface/70">Dari {kpi.total_karyawan} karyawan</div>
        </div>

        <div className="bg-[#A8D8F0] border-4 border-on-surface shadow-hard-lg p-4 flex flex-col hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-xl transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Belum Absen</span>
            <Clock className="w-6 h-6 text-on-surface" />
          </div>
          <div className="text-4xl font-black text-on-surface mb-1">{kpi.belum_absen}</div>
          <div className="text-xs font-bold text-on-surface/70">Shift hari ini</div>
        </div>

        <div className="bg-[#F9E07A] border-4 border-on-surface shadow-hard-lg p-4 flex flex-col hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-xl transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Telat</span>
            <AlertTriangle className="w-6 h-6 text-on-surface" />
          </div>
          <div className="text-4xl font-black text-on-surface mb-1">{kpi.telat}</div>
          <div className="text-xs font-bold text-on-surface/70">Perlu perhatian</div>
        </div>

        <div className="bg-secondary-container border-4 border-on-surface shadow-hard-lg p-4 flex flex-col hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-xl transition-all text-on-secondary-container">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Total Karyawan</span>
            <Users className="w-6 h-6" />
          </div>
          <div className="text-4xl font-black mb-1">{kpi.total_karyawan}</div>
          <div className="text-xs font-bold opacity-70">Aktif bekerja</div>
        </div>
      </div>

      {/* ── Charts — gap-10→gap-6 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Donut Chart — padding p-6→p-4 */}
        <div className="lg:col-span-1 bg-surface border-4 border-on-surface shadow-hard-lg p-4 flex flex-col">
          <h3 className="text-lg font-black text-on-surface border-b-4 border-on-surface pb-2 mb-4">
            Proporsi Kehadiran
          </h3>
          <div className="relative flex items-center justify-center" style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="#1a1c1c"
                  strokeWidth={3}
                  startAngle={90}
                  endAngle={-270}
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '3px solid #1a1c1c', borderRadius: 0, fontWeight: 'bold', fontSize: 12 }}
                  formatter={(val: any) => [`${val}%`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-on-surface leading-none">{pctTepat}%</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mt-0.5">Tepat</span>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            {pieData.map((entry: any) => (
              <div key={entry.name} className="flex items-center justify-between border-2 border-on-surface p-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-on-surface shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs font-black uppercase">{entry.name}</span>
                </div>
                <span className="text-xs font-black">{getPiePct(entry.value)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart — padding p-6→p-4 */}
        <div className="lg:col-span-2 bg-surface border-4 border-on-surface shadow-hard-lg p-4 flex flex-col">
          <div className="flex justify-between items-center border-b-4 border-on-surface pb-2 mb-3">
            <h3 className="text-lg font-black text-on-surface">Kehadiran per Outlet</h3>
            <span className="bg-on-surface text-on-primary px-3 py-1 text-[10px] font-black border-2 border-on-surface uppercase tracking-widest">
              Hari Ini
            </span>
          </div>
          <div className="flex items-center gap-6 mb-2 px-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-on-surface bg-[#ffe600]" />
              <span className="text-[10px] font-black uppercase">Hadir</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-on-surface bg-[#e2e2e2]" />
              <span className="text-[10px] font-black uppercase">Total Karyawan</span>
            </div>
          </div>
          <div className="flex-1 w-full" style={{ minHeight: '240px' }}>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 12, left: 0, bottom: 4 }} barCategoryGap="30%" barGap={4}>
                  <XAxis dataKey="name" stroke="#1a1c1c" fontSize={11} fontWeight="bold" axisLine={{ strokeWidth: 3 }} tickLine={false} />
                  <YAxis stroke="#1a1c1c" fontSize={11} fontWeight="bold" axisLine={{ strokeWidth: 3 }} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#000', fillOpacity: 0.04 }} content={<CustomBarTooltip />} />
                  <Bar dataKey="total" fill="#e2e2e2" stroke="#1a1c1c" strokeWidth={3} label={{ position: 'top', fontSize: 11, fontWeight: 'bold', fill: '#1a1c1c' }} />
                  <Bar dataKey="hadir" fill="#ffe600" stroke="#1a1c1c" strokeWidth={3} label={{ position: 'top', fontSize: 11, fontWeight: 'bold', fill: '#1a1c1c' }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message={isLoading ? 'Memuat...' : 'Belum ada data outlet'} />
            )}
          </div>
          {barData.length > 0 && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 border-t-4 border-on-surface pt-3">
              {barData.map((d: any) => (
                <div key={d.name} className="flex flex-col items-center border-2 border-on-surface p-2 bg-surface-container">
                  <span className="text-[10px] font-black uppercase truncate w-full text-center">{d.name}</span>
                  <span className="text-lg font-black mt-0.5">
                    {d.hadir ?? 0}
                    <span className="text-xs font-bold text-on-surface-variant">/{d.total ?? 0}</span>
                  </span>
                  <span className="text-[10px] font-bold text-on-surface-variant">
                    {(d.total ?? 0) > 0 ? Math.round(((d.hadir ?? 0) / d.total) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}