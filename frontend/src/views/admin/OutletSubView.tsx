/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'leaflet/dist/leaflet.css';

import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Plus, Edit, Trash2, MapPin, Navigation, AlertTriangle, CheckCircle, XCircle, Info, X, Crosshair, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

import { 
  useGetOutlets, 
  useCreateOutlet, 
  useUpdateOutlet, 
  useDeleteOutlet 
} from '../../hooks/api/useOutlet';

// ============================================================
// FIX: Leaflet default marker icon rusak di Vite
// ============================================================
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl:     markerShadow,
});

// ============================================================
// TOAST SYSTEM
// ============================================================
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: number; type: ToastType; message: string; }

const TOAST_CONFIG: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: { bg: 'bg-[#B9F0C8]', icon: <CheckCircle  className="w-4 h-4 shrink-0" /> },
  error:   { bg: 'bg-[#F4836C]', icon: <XCircle      className="w-4 h-4 shrink-0" /> },
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
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 items-end">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onClose={onClose} />)}
    </div>
  );
}

// ============================================================
// LEAFLET HELPERS
// ============================================================
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], map.getZoom(), { duration: 1 });
  }, [lat, lng, map]);
  return null;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
const DEFAULT_LAT = -6.2088;
const DEFAULT_LNG = 106.8456;
const DEFAULT_ZOOM = 14;

export default function OutletSubView() {
  const { data: resOutlets, isLoading: loadingOutlets } = useGetOutlets();
  const { mutate: createOutlet, isPending: creating } = useCreateOutlet();
  const { mutate: updateOutlet, isPending: updating } = useUpdateOutlet();
  const { mutate: deleteOutlet, isPending: deleting } = useDeleteOutlet();

  const outlets = resOutlets?.data || [];

  const [showForm, setShowForm]                   = useState(false);
  const [isEditMode, setIsEditMode]               = useState(false);
  const [editingId, setEditingId]                 = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId]               = useState<number | null>(null);

  const [formName, setFormName]     = useState('');
  const [formAddr, setFormAddr]     = useState('');
  const [formLat,  setFormLat]      = useState(DEFAULT_LAT.toString());
  const [formLng,  setFormLng]      = useState(DEFAULT_LNG.toString());
  const [formRad,  setFormRad]      = useState(50);
  const [isLocating, setIsLocating] = useState(false);

  const mapLat = parseFloat(formLat) || DEFAULT_LAT;
  const mapLng = parseFloat(formLng) || DEFAULT_LNG;

  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);
  const closeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const openAddForm = () => {
    setIsEditMode(false); setEditingId(null);
    setFormName(''); setFormAddr('');
    setFormLat(DEFAULT_LAT.toString()); setFormLng(DEFAULT_LNG.toString());
    setFormRad(50); setShowForm(true);
  };

  const openEditForm = (outlet: any) => {
    setIsEditMode(true); setEditingId(outlet.id);
    setFormName(outlet.name || ''); setFormAddr(outlet.addr || '');
    setFormLat(outlet.lat || DEFAULT_LAT.toString()); setFormLng(outlet.lng || DEFAULT_LNG.toString());
    setFormRad(outlet.rad || 50); setShowForm(true);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setFormLat(lat.toFixed(6)); setFormLng(lng.toFixed(6));
  };

  const handleMarkerDrag = (e: L.DragEndEvent) => {
    const { lat, lng } = (e.target as L.Marker).getLatLng();
    setFormLat(lat.toFixed(6)); setFormLng(lng.toFixed(6));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) { showToast('warning', 'Browser kamu tidak mendukung geolokasi.'); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormLat(pos.coords.latitude.toFixed(6));
        setFormLng(pos.coords.longitude.toFixed(6));
        setIsLocating(false);
        showToast('success', 'Lokasi saat ini berhasil dideteksi.');
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) showToast('error', 'Izin lokasi ditolak. Aktifkan di ikon gembok URL browser.');
        else if (err.code === 2) showToast('warning', 'Posisi tidak tersedia. Pastikan GPS aktif.');
        else showToast('warning', 'Waktu deteksi habis. Coba lagi.');
      },
      { timeout: 15000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  };

  const handleSimpan = () => {
    if (!formName.trim()) { showToast('warning', 'Nama outlet tidak boleh kosong.'); return; }
    if (!formLat || !formLng) { showToast('warning', 'Koordinat lokasi belum diisi.'); return; }

    const payloadData = {
      name: formName, addr: formAddr,
      lat: formLat.toString(), lng: formLng.toString(),
      rad: Number(formRad),
    };

    if (isEditMode && editingId) {
      updateOutlet({ id: editingId, data: payloadData }, {
        onSuccess: () => { setShowForm(false); showToast('success', 'Data outlet berhasil diperbarui.'); },
        onError: () => showToast('error', 'Gagal memperbarui outlet.')
      });
    } else {
      createOutlet(payloadData, {
        onSuccess: () => { setShowForm(false); showToast('success', 'Outlet baru berhasil ditambahkan.'); },
        onError: () => showToast('error', 'Gagal menambah outlet baru.')
      });
    }
  };

  const confirmDelete = (id: number) => { setDeletingId(id); setShowDeleteConfirm(true); };

  const handleHapus = () => {
    if (!deletingId) return;
    deleteOutlet(deletingId, {
      onSuccess: () => { setShowDeleteConfirm(false); setDeletingId(null); showToast('success', 'Outlet berhasil dihapus.'); },
      onError: () => showToast('error', 'Gagal menghapus outlet. Pastikan tidak ada karyawan di outlet ini.')
    });
  };

  return (
    <>
      <style>{`
        @keyframes toastSlideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        .leaflet-control { z-index: 10 !important; }
        .outlet-map-wrapper .leaflet-container { border-radius: 0; }
      `}</style>

      <ToastContainer toasts={toasts} onClose={closeToast} />

      {/* gap-10 → gap-6 */}
      <div className="flex flex-col gap-6">

        {/* Header — text-5xl → text-3xl, text-lg → text-sm, padding tombol dikecilkan */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-on-surface uppercase tracking-tight">Cabang Outlet</h2>
            <p className="text-sm font-medium text-on-surface-variant mt-0.5">Kelola cabang operasional dan lokasi geofence.</p>
          </div>
          <button
            onClick={openAddForm}
            className="bg-primary-fixed text-on-surface font-black py-3 px-5 border-4 border-on-surface shadow-hard hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-hard-lg active:translate-x-0 active:translate-y-0 transition-all flex items-center gap-2 text-sm uppercase tracking-wider"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            Tambah Outlet
          </button>
        </div>

        {/* Tabel — padding p-4 → p-3 */}
        <div className="bg-surface border-4 border-on-surface shadow-hard-lg overflow-hidden">
          <div className="bg-on-surface text-on-primary p-3 border-b-4 border-on-surface flex justify-between items-center">
            <h3 className="text-base font-bold uppercase tracking-tight">Daftar Outlet Aktif</h3>
            <span className="text-xs bg-surface text-on-surface px-3 py-1 border-2 border-on-surface font-black uppercase">
              {outlets.length} Outlet
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[580px]">
              <thead>
                <tr className="border-b-4 border-on-surface bg-surface-container font-black uppercase tracking-widest text-[10px]">
                  <th className="p-3 border-r-4 border-on-surface w-[40%]">Nama & Alamat</th>
                  <th className="p-3 border-r-4 border-on-surface w-[25%]">Koordinat</th>
                  <th className="p-3 border-r-4 border-on-surface w-[15%] text-center">Radius</th>
                  <th className="p-3 w-[20%] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-surface font-medium">
                
                {loadingOutlets && (
                  <tr><td colSpan={4} className="p-6 text-center font-bold animate-pulse text-sm">Memuat data outlet...</td></tr>
                )}

                {!loadingOutlets && outlets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-on-surface-variant font-bold uppercase text-sm">
                      Belum ada outlet. Klik "Tambah Outlet" untuk memulai.
                    </td>
                  </tr>
                )}

                {outlets.map((outlet: any, i: number) => (
                  <tr key={outlet.id} className={cn("border-b-4 border-on-surface", i % 2 !== 0 && "bg-surface-container-low")}>
                    <td className="p-3 border-r-4 border-on-surface">
                      <div className="font-black text-sm mb-0.5 uppercase">{outlet.name}</div>
                      <div className="text-xs text-on-surface-variant line-clamp-1">{outlet.addr || '—'}</div>
                    </td>
                    <td className="p-3 border-r-4 border-on-surface font-mono text-[10px]">
                      <div className="flex items-center gap-1.5"><span className="text-tertiary font-black">LAT:</span> {outlet.lat}</div>
                      <div className="flex items-center gap-1.5"><span className="text-secondary font-black">LNG:</span> {outlet.lng}</div>
                    </td>
                    <td className="p-3 border-r-4 border-on-surface text-center">
                      <span className="inline-block bg-primary-fixed border-4 border-on-surface px-2.5 py-0.5 font-black font-mono text-xs shadow-[2px_2px_0px_0px_#000]">
                        {outlet.rad}M
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditForm(outlet)}
                          className="w-8 h-8 bg-surface-container border-4 border-on-surface shadow-hard hover:bg-primary-container hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center justify-center"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(outlet.id)}
                          className="w-8 h-8 bg-[#F4836C] border-4 border-on-surface shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL FORM — padding px-8 → px-6, pt-8 → pt-6, section p-6 → p-5 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/80 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto border-4 border-on-surface bg-surface shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
            <div className="h-3 bg-primary-fixed border-b-4 border-on-surface w-full" />
            <div className="px-6 pt-6 pb-2">
              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <MapPin className="w-6 h-6 stroke-[3px]" />
                {isEditMode ? 'Edit Data Outlet' : 'Form Tambah Outlet'}
              </h3>
            </div>

            <div className="px-6 pb-4 space-y-5">
              {/* SECTION 1 */}
              <div className="bg-surface-container-lowest p-5 border-4 border-on-surface shadow-hard relative mt-5">
                <div className="absolute top-0 left-5 -translate-y-1/2 bg-primary-fixed text-on-surface px-3 py-1 border-4 border-on-surface font-black uppercase text-xs">
                  1. Identitas Outlet
                </div>
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-1">Nama Outlet</label>
                    <input className="neu-input w-full font-bold uppercase" placeholder="Contoh: Cabang Senopati" type="text" value={formName} onChange={e => setFormName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-1">Alamat Lengkap</label>
                    <textarea className="neu-input w-full resize-none font-bold" placeholder="Nama jalan, nomor, kelurahan, kecamatan..." rows={2} value={formAddr} onChange={e => setFormAddr(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* SECTION 2 */}
              <div className="bg-surface-container-lowest p-5 border-4 border-on-surface shadow-hard relative mt-5">
                <div className="absolute top-0 left-5 -translate-y-1/2 bg-secondary-fixed text-on-surface px-3 py-1 border-4 border-on-surface font-black uppercase text-xs">
                  2. Lokasi & Geofence
                </div>
                <div className="space-y-3 pt-2">
                  {/* PETA */}
                  <div className="outlet-map-wrapper border-4 border-on-surface overflow-hidden" style={{ height: '220px', zIndex: 0 }}>
                    <MapContainer center={[mapLat, mapLng]} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }} zoomControl={true}>
                      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapClickHandler onMapClick={handleMapClick} />
                      <MapFlyTo lat={mapLat} lng={mapLng} />
                      <Marker position={[mapLat, mapLng]} draggable={true} eventHandlers={{ dragend: handleMarkerDrag }} />
                      <Circle center={[mapLat, mapLng]} radius={formRad} pathOptions={{ color: '#000000', fillColor: '#F9E07A', fillOpacity: 0.25, weight: 3, dashArray: '6 4' }} />
                    </MapContainer>
                  </div>

                  <p className="text-[10px] font-bold text-on-surface-variant italic">✦ Klik pada peta untuk memindahkan pin. Atau seret marker langsung.</p>

                  <button type="button" onClick={handleUseMyLocation} disabled={isLocating} className="w-full bg-secondary-fixed text-on-surface font-black py-2.5 border-4 border-on-surface shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLocating ? <><Crosshair className="w-4 h-4 animate-spin" /> Mendeteksi Lokasi...</> : <><Navigation className="w-4 h-4 fill-current" /> Gunakan Lokasi Saya</>}
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider mb-1">Latitude</label>
                      <input className="neu-input w-full font-mono text-xs" placeholder="-6.2000" type="text" value={formLat} onChange={e => setFormLat(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider mb-1">Longitude</label>
                      <input className="neu-input w-full font-mono text-xs" placeholder="106.8166" type="text" value={formLng} onChange={e => setFormLng(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black uppercase tracking-wider">Radius Geofence</label>
                      <span className="text-sm font-black border-4 border-on-surface px-3 py-0.5 bg-primary-fixed shadow-[2px_2px_0px_0px_#000]">{formRad}M</span>
                    </div>
                    <input className="w-full cursor-pointer accent-on-surface" max="99999" min="0" step="1" type="range" value={formRad} onChange={e => setFormRad(Number(e.target.value))} />
                    <div className="flex justify-between text-[10px] font-black text-on-surface-variant">
                      <span>0M</span><span>99999M</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t-4 border-on-surface p-5 bg-surface-container">
              <button onClick={() => setShowForm(false)} className="font-bold py-2.5 px-6 border-4 border-transparent hover:border-on-surface transition-all bg-surface text-sm" type="button">Batal</button>
              <button onClick={handleSimpan} disabled={creating || updating} className="bg-primary-fixed text-on-surface font-black py-3 px-8 border-4 border-on-surface shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg transition-all uppercase tracking-widest text-sm flex items-center gap-2 disabled:opacity-50" type="button">
                {(creating || updating) && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditMode ? 'Update Outlet' : 'Simpan Outlet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-on-surface/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
            <h3 className="text-xl font-black mb-3 uppercase flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-[#F9E07A]" />Konfirmasi Hapus</h3>
            <p className="font-bold text-on-surface-variant mb-6 text-sm">Apakah Anda yakin ingin menghapus outlet ini? Semua data lokasi dan geofence akan ikut terhapus dan tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="font-bold py-2 px-5 border-4 border-transparent hover:border-on-surface transition-all bg-surface text-sm">Batal</button>
              <button onClick={handleHapus} disabled={deleting} className="bg-[#F4836C] flex items-center gap-2 font-black py-2 px-5 border-4 border-on-surface shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg transition-all uppercase text-sm disabled:opacity-50">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />} Ya, Hapus!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}