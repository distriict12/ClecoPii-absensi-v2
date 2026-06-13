import { useState, useEffect, useCallback } from 'react';
import { 
  UserPlus, Edit, Trash2, ChevronDown, AlertTriangle, 
  CheckCircle, XCircle, Info, X, Loader2, RotateCcw, EyeOff
} from 'lucide-react';

import { 
  useGetEmployees, 
  useCreateEmployee, 
  useUpdateEmployee, 
  useDeleteEmployee,
  useReactivateEmployee,
  useGetOutletsForDropdown
} from '../../hooks/api/useEmployee';

// ============================================================
// TOAST SYSTEM
// ============================================================
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: number; type: ToastType; message: string; }

const TOAST_CONFIG: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: { bg: 'bg-[#B9F0C8]', icon: <CheckCircle className="w-4 h-4 shrink-0" /> },
  error:   { bg: 'bg-[#F4836C]', icon: <XCircle className="w-4 h-4 shrink-0" /> },
  info:    { bg: 'bg-[#A8D8F0]', icon: <Info className="w-4 h-4 shrink-0" /> },
  warning: { bg: 'bg-[#F9E07A]', icon: <AlertTriangle className="w-4 h-4 shrink-0" /> },
};

let _toastId = 0;

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: number) => void }) {
  const cfg = TOAST_CONFIG[toast.type];
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);
  return (
    <div className={`flex items-center gap-3 min-w-[280px] max-w-sm ${cfg.bg} border-4 border-on-surface shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] px-4 py-3 font-bold text-on-surface text-sm`} style={{ animation: 'toastSlideIn 0.2s ease-out' }}>
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
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 items-end">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onClose={onClose} />)}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function EmployeeSubView() {
  // Toggle untuk tampilkan karyawan nonaktif
  const [showInactive, setShowInactive] = useState(false);

  const { data: resEmployees, isLoading: loadingEmployees } = useGetEmployees(showInactive);
  const { data: resOutlets } = useGetOutletsForDropdown();
  
  const { mutate: createEmployee, isPending: creating } = useCreateEmployee();
  const { mutate: updateEmployee, isPending: updating } = useUpdateEmployee();
  const { mutate: deleteEmployee, isPending: deleting } = useDeleteEmployee();
  const { mutate: reactivateEmployee, isPending: reactivating } = useReactivateEmployee();

  const employees = resEmployees?.data || [];
  const outlets = resOutlets?.data || [];

  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deactivateName, setDeactivateName] = useState('');

  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);
  const closeToast = useCallback((id: number) => { setToasts(prev => prev.filter(t => t.id !== id)); }, []);

  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [pin, setPin] = useState('');
  const [outletId, setOutletId] = useState('');
  const [salaryType, setSalaryType] = useState('Bulanan');
  const [gajiPokok, setGajiPokok] = useState('');
  const [potonganTelat, setPotonganTelat] = useState('');
  const [potonganAbsen, setPotonganAbsen] = useState('');
  const [bonusRajin, setBonusRajin] = useState('');
  const [targetHariKerja, setTargetHariKerja] = useState('22');
  const [jamMasuk, setJamMasuk] = useState("08:00");
  const [jamKeluar, setJamKeluar] = useState("17:00");
  const [selectedDays, setSelectedDays] = useState(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']);

  const handleJamChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const digits = value.replace(/[^0-9]/g, '');
    let formatted = digits;
    if (digits.length >= 3) formatted = digits.slice(0, 2) + ':' + digits.slice(2, 4);
    if (formatted.length === 5) {
      const [hh, mm] = formatted.split(':').map(Number);
      if (hh > 23 || mm > 59) return;
    }
    setter(formatted);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const resetForm = () => {
    setName(''); setPosition(''); setEmployeeCode(''); setPin(''); setOutletId('');
    setSalaryType('Bulanan'); setGajiPokok(''); setPotonganTelat(''); setPotonganAbsen('');
    setBonusRajin(''); setTargetHariKerja('22'); setJamMasuk('08:00'); setJamKeluar('17:00');
    setSelectedDays(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']);
    setEditId(null);
  };

  const openEditForm = (emp: any) => {
    setIsEditMode(true);
    setEditId(emp.id);
    setName(emp.name || '');
    setPosition(emp.position || '');
    setEmployeeCode(emp.employee_code || '');
    setPin('');
    setOutletId(emp.outlet_id?.toString() || '');
    setSalaryType(emp.salary_type || 'Bulanan');
    setGajiPokok(emp.gaji_pokok?.toString() || '0');
    setPotonganTelat(emp.potongan_telat?.toString() || '0');
    setPotonganAbsen(emp.potongan_absen?.toString() || '0');
    setBonusRajin(emp.bonus_rajin?.toString() || '0');
    setJamMasuk(emp.jam_masuk ? emp.jam_masuk.substring(0, 5) : "08:00");
    setJamKeluar(emp.jam_keluar ? emp.jam_keluar.substring(0, 5) : "17:00");
    setSelectedDays(emp.working_days ? emp.working_days.split(',') : []);
    setTargetHariKerja(emp.target_hari_kerja?.toString() || '22');
    setShowForm(true);
  };

  const handleSimpan = () => {
    const payloadData = {
      name, position, employee_code: employeeCode, pin,
      outlet_id: parseInt(outletId) || 0,
      salary_type: salaryType,
      gaji_pokok: parseFloat(gajiPokok) || 0,
      potongan_telat: parseFloat(potonganTelat) || 0,
      potongan_absen: parseFloat(potonganAbsen) || 0,
      bonus_rajin: parseFloat(bonusRajin) || 0,
      jam_masuk: jamMasuk + ":00",
      jam_keluar: jamKeluar + ":00",
      working_days: selectedDays.join(','),
      target_hari_kerja: parseInt(targetHariKerja) || 22
    };

    if (isEditMode && editId) {
      updateEmployee(
        { id: editId, data: payloadData },
        {
          onSuccess: () => { setShowForm(false); showToast('success', 'Data karyawan berhasil diperbarui.'); resetForm(); },
          onError: () => showToast('error', 'Gagal memperbarui karyawan.')
        }
      );
    } else {
      createEmployee(payloadData, {
        onSuccess: () => { setShowForm(false); showToast('success', 'Karyawan baru berhasil ditambahkan.'); resetForm(); },
        onError: () => showToast('error', 'Gagal menambah karyawan. Mungkin PIN/Kode sudah terpakai.')
      });
    }
  };

  const handleNonaktifkan = () => {
    if (!editId) return;
    deleteEmployee(editId, {
      onSuccess: () => {
        setShowDeactivateConfirm(false);
        setEditId(null);
        setDeactivateName('');
        showToast('success', `Karyawan "${deactivateName}" berhasil dinonaktifkan.`);
      },
      onError: (err: any) => {
        setShowDeactivateConfirm(false);
        showToast('error', err?.response?.data?.message || 'Gagal menonaktifkan karyawan.');
      }
    });
  };

  const handleAktifkanKembali = (emp: any) => {
    reactivateEmployee(emp.id, {
      onSuccess: () => showToast('success', `Karyawan "${emp.name}" berhasil diaktifkan kembali.`),
      onError: (err: any) => showToast('error', err?.response?.data?.message || 'Gagal mengaktifkan karyawan.')
    });
  };

  const formatRp = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);

  // Hitung jumlah nonaktif untuk badge info
  const inactiveCount = employees.filter((e: any) => !e.is_active).length;
  const activeCount   = employees.filter((e: any) => e.is_active).length;

  return (
    <>
      <style>{`@keyframes toastSlideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      <ToastContainer toasts={toasts} onClose={closeToast} />

      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface mb-0.5 tracking-tight">DAFTAR KARYAWAN</h1>
            <p className="text-sm font-medium text-on-surface-variant">Kelola data personal dan finansial staf.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle tampilkan nonaktif */}
            <button
              onClick={() => setShowInactive(prev => !prev)}
              className={`flex items-center gap-2 py-3 px-4 border-4 border-on-surface font-bold text-sm shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg transition-all ${showInactive ? 'bg-on-surface text-on-primary' : 'bg-surface text-on-surface'}`}
            >
              <EyeOff className="w-4 h-4" />
              {showInactive ? 'Sembunyikan Nonaktif' : `Tampilkan Nonaktif`}
              {!showInactive && inactiveCount > 0 && (
                <span className="bg-[#F4836C] text-white text-[10px] font-black px-1.5 py-0.5 border-2 border-on-surface">
                  {inactiveCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { resetForm(); setIsEditMode(false); setShowForm(true); }}
              className="bg-secondary-fixed text-on-surface font-bold py-3 px-5 border-4 border-on-surface shadow-hard hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-hard-lg active:translate-x-0 active:translate-y-0 transition-all flex items-center gap-2 text-sm"
            >
              <UserPlus className="w-4 h-4" /> Tambah Karyawan
            </button>
          </div>
        </div>

        {/* Info karyawan aktif/nonaktif */}
        {showInactive && (
          <div className="bg-[#A8D8F0] border-2 border-on-surface p-3 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <p className="text-xs font-bold">
              Menampilkan <span className="font-black">{activeCount} aktif</span> dan <span className="font-black">{inactiveCount} nonaktif</span>. Row yang redup adalah karyawan nonaktif.
            </p>
          </div>
        )}

        {/* Tabel */}
        <div className="bg-surface border-4 border-on-surface shadow-hard-lg overflow-x-auto relative">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-primary-container border-b-4 border-on-surface">
              <tr>
                <th className="p-3 font-bold text-on-surface border-r-4 border-on-surface uppercase tracking-wider text-xs">Nama & ID</th>
                <th className="p-3 font-bold text-on-surface border-r-4 border-on-surface uppercase tracking-wider text-xs">Posisi</th>
                <th className="p-3 font-bold text-on-surface border-r-4 border-on-surface uppercase tracking-wider text-xs text-right">Gaji Pokok</th>
                <th className="p-3 font-bold text-on-surface border-r-4 border-on-surface uppercase tracking-wider text-xs text-center">Tipe Gaji</th>
                <th className="p-3 font-bold text-on-surface text-center uppercase tracking-wider text-xs">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-on-surface font-medium">

              {loadingEmployees && (
                <tr><td colSpan={5} className="p-6 text-center font-bold animate-pulse text-sm">Memuat data karyawan...</td></tr>
              )}

              {!loadingEmployees && employees.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center font-bold text-sm">Belum ada data karyawan.</td></tr>
              )}

              {employees.map((emp: any) => {
                const isInactive = !emp.is_active;
                return (
                  <tr
                    key={emp.id}
                    className={`border-b-4 border-on-surface transition-colors ${
                      isInactive
                        ? 'opacity-50 bg-surface-container'
                        : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <td className="p-3 border-r-4 border-on-surface uppercase">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className={`font-bold text-sm ${isInactive ? 'line-through' : ''}`}>{emp.name}</div>
                          <div className="text-on-surface-variant text-xs mt-0.5 flex items-center gap-2">
                            ID: {emp.employee_code}
                            {isInactive && (
                              <span className="bg-[#F4836C] text-white text-[9px] font-black px-1.5 py-0.5 border border-on-surface no-underline" style={{ textDecoration: 'none' }}>
                                NONAKTIF
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 border-r-4 border-on-surface uppercase font-bold text-sm">{emp.position}</td>
                    <td className="p-3 border-r-4 border-on-surface font-bold text-right text-sm">{formatRp(emp.gaji_pokok)}</td>
                    <td className="p-3 border-r-4 border-on-surface text-center text-sm">{emp.salary_type}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        {isInactive ? (
                          // Karyawan nonaktif: hanya tombol Aktifkan Kembali
                          <button
                            onClick={() => handleAktifkanKembali(emp)}
                            disabled={reactivating}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#B9F0C8] border-4 border-on-surface shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg transition-all text-xs font-black uppercase disabled:opacity-50"
                            title="Aktifkan kembali"
                          >
                            {reactivating
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <RotateCcw className="w-3.5 h-3.5" />
                            }
                            Aktifkan
                          </button>
                        ) : (
                          // Karyawan aktif: tombol edit + nonaktifkan
                          <>
                            <button
                              onClick={() => openEditForm(emp)}
                              className="p-1.5 bg-surface-container border-4 border-on-surface shadow-hard hover:bg-primary-container transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditId(emp.id);
                                setDeactivateName(emp.name);
                                setShowDeactivateConfirm(true);
                              }}
                              className="p-1.5 bg-[#F4836C] border-4 border-on-surface shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg transition-all"
                              title="Nonaktifkan karyawan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MODAL FORM TAMBAH / EDIT */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/80 backdrop-blur-sm">
            <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto border-4 border-on-surface bg-surface shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-5 lg:p-8 relative">
              <h3 className="text-2xl font-black mb-6 uppercase tracking-tight">
                {isEditMode ? 'Form Edit Karyawan' : 'Form Tambah Karyawan'}
              </h3>
              <div className="flex flex-col lg:flex-row gap-6">

                {/* 1. DATA PRIBADI */}
                <div className="flex-1 bg-surface-container-lowest p-5 border-4 border-on-surface shadow-hard relative mt-4 lg:mt-0">
                  <div className="absolute top-0 left-5 -translate-y-1/2 bg-secondary-fixed text-on-surface px-3 py-1 border-4 border-on-surface font-black uppercase text-xs">1. Data Pribadi</div>
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider mb-1">Nama Lengkap</label>
                      <input className="neu-input w-full uppercase" type="text" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider mb-1">Jabatan / Posisi</label>
                      <input className="neu-input w-full" type="text" value={position} onChange={(e) => setPosition(e.target.value)} />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-black uppercase tracking-wider mb-1 text-center">ID Karyawan</label>
                        <input className="neu-input w-full text-center uppercase font-bold" type="text" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-black uppercase tracking-wider mb-1 text-center">
                          {isEditMode ? 'PIN (Isi jika ganti)' : 'PIN Login'}
                        </label>
                        <input className="neu-input w-full text-center font-bold" type="text" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider mb-1">Penempatan Outlet</label>
                      <div className="relative">
                        <select className="neu-input w-full appearance-none pr-10 cursor-pointer font-bold" value={outletId} onChange={(e) => setOutletId(e.target.value)}>
                          <option value="">Pilih Outlet...</option>
                          {outlets.map((o: any) => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. DATA FINANSIAL */}
                <div className="flex-1 bg-surface-container-lowest p-5 border-4 border-on-surface shadow-hard relative mt-4 lg:mt-0">
                  <div className="absolute top-0 left-5 -translate-y-1/2 bg-primary-container text-on-surface px-3 py-1 border-4 border-on-surface font-black uppercase text-xs">2. Data Finansial</div>
                  <div className="space-y-3 pt-2">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-black uppercase tracking-wider mb-1">Tipe Gaji</label>
                        <div className="relative">
                          <select className="neu-input w-full appearance-none pr-10 cursor-pointer font-bold" value={salaryType} onChange={(e) => setSalaryType(e.target.value)}>
                            <option value="Bulanan">Bulanan</option>
                            <option value="Harian">Harian</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-black uppercase tracking-wider mb-1">Gaji Pokok</label>
                        <input className="neu-input w-full font-bold" type="text" inputMode="numeric" value={gajiPokok} onChange={(e) => setGajiPokok(e.target.value.replace(/[^0-9]/g, ''))} />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-black uppercase tracking-wider mb-1">Pot. Telat</label>
                        <input className="neu-input w-full" type="text" inputMode="numeric" value={potonganTelat} onChange={(e) => setPotonganTelat(e.target.value.replace(/[^0-9]/g, ''))} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-black uppercase tracking-wider mb-1">Pot. Absen</label>
                        <input className="neu-input w-full" type="text" inputMode="numeric" value={potonganAbsen} onChange={(e) => setPotonganAbsen(e.target.value.replace(/[^0-9]/g, ''))} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider mb-1">Bonus Rajin</label>
                      <input className="neu-input w-full font-bold" type="text" inputMode="numeric" value={bonusRajin} onChange={(e) => setBonusRajin(e.target.value.replace(/[^0-9]/g, ''))} />
                    </div>
                  </div>
                </div>

                {/* 3. JADWAL RUTIN */}
                <div className="flex-1 bg-surface-container-lowest p-5 border-4 border-on-surface shadow-hard relative mt-4 lg:mt-0">
                  <div className="absolute top-0 left-5 -translate-y-1/2 bg-tertiary-fixed text-on-surface px-3 py-1 border-4 border-on-surface font-black uppercase text-xs">3. Jadwal Rutin</div>
                  <div className="space-y-3 pt-2">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-black uppercase tracking-wider mb-1 text-center">Masuk (24H)</label>
                        <input className="neu-input w-full text-center font-bold tracking-widest" type="text" inputMode="numeric" placeholder="HH:MM" maxLength={5} value={jamMasuk} onChange={(e) => handleJamChange(e.target.value, setJamMasuk)} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-black uppercase tracking-wider mb-1 text-center">Keluar (24H)</label>
                        <input className="neu-input w-full text-center font-bold tracking-widest" type="text" inputMode="numeric" placeholder="HH:MM" maxLength={5} value={jamKeluar} onChange={(e) => handleJamChange(e.target.value, setJamKeluar)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider mb-2 text-center">Seleksi Hari Kerja</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                          <button key={day} type="button" onClick={() => toggleDay(day)} className={`py-1.5 text-[10px] font-black uppercase border-2 border-on-surface shadow-[2px_2px_0px_0px_#000] transition-all ${selectedDays.includes(day) ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface opacity-50'}`}>{day}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider mb-1">Target Hari Kerja/Bulan</label>
                      <input className="neu-input w-full font-bold" type="text" inputMode="numeric" value={targetHariKerja} onChange={(e) => setTargetHariKerja(e.target.value.replace(/[^0-9]/g, ''))} />
                    </div>
                  </div>
                </div>

              </div>
              <div className="mt-6 flex justify-end gap-3 border-t-4 border-on-surface pt-5">
                <button onClick={() => setShowForm(false)} className="font-bold py-2.5 px-6 border-4 border-transparent hover:border-on-surface transition-all bg-surface text-sm" type="button">Batal</button>
                <button onClick={handleSimpan} disabled={creating || updating} className="bg-primary text-on-primary font-black py-3 px-8 border-4 border-on-surface shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg transition-all uppercase tracking-widest text-sm flex items-center gap-2 disabled:opacity-50" type="button">
                  {(creating || updating) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isEditMode ? 'Update Data' : 'Simpan Data'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL KONFIRMASI NONAKTIFKAN */}
        {showDeactivateConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-on-surface/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-surface border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 relative">
              <h3 className="text-xl font-black mb-3 uppercase flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-[#F9E07A]" />
                Nonaktifkan Karyawan
              </h3>
              <p className="font-bold text-on-surface-variant mb-2 text-sm">
                Karyawan <span className="font-black text-on-surface uppercase">"{deactivateName}"</span> akan dinonaktifkan.
              </p>
              <div className="bg-[#A8D8F0] border-2 border-on-surface p-3 mb-5">
                <p className="text-xs font-bold text-on-surface">
                  ℹ️ Data absensi dan riwayat gaji tetap tersimpan. Karyawan bisa diaktifkan kembali kapan saja.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowDeactivateConfirm(false); setDeactivateName(''); }}
                  className="font-bold py-2 px-5 border-4 border-transparent hover:border-on-surface transition-all bg-surface text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleNonaktifkan}
                  disabled={deleting}
                  className="bg-[#F4836C] flex items-center gap-2 font-black py-2 px-5 border-4 border-on-surface shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg transition-all uppercase text-sm disabled:opacity-50"
                >
                  {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ya, Nonaktifkan
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}