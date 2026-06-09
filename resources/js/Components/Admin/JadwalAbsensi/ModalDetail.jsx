import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { FormInput } from '@/Components/Admin/FormInput';
import { StatusBadge } from './StatusBadge';
import { ConfirmDialog } from './ConfirmDialog'; // ← tambah import

function Select({ value, onChange, children }) {
    return (
        <select value={value} onChange={onChange}
            className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none border"
            style={{ borderColor: '#c7e8f8', color: '#0F2A44' }}>
            {children}
        </select>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-xs shrink-0" style={{ color: '#94a3b8' }}>{label}</span>
            <span className="text-xs font-semibold text-right" style={{ color: '#0F2A44' }}>{value}</span>
        </div>
    );
}

export function ModalDetail({ open, onClose, jadwal, absensi, petugas, rutes }) {
    const [editMode,  setEditMode]  = useState(false);
    const [editUser,  setEditUser]  = useState('');
    const [editRute,  setEditRute]  = useState('');

    // ← state untuk confirm dialog
    const [confirm, setConfirm] = useState({ open: false, message: '', onConfirm: null });

    useMemo(() => {
        if (absensi) {
            setEditUser(absensi.user?.id ?? '');
            setEditRute(absensi.rute?.id ?? '');
        }
        setEditMode(false);
    }, [absensi]);

    if (!open || !jadwal || !absensi) return null;

    const handleUpdate = () => {
        router.put(route('admin.jadwal.absensi.update', absensi.id), {
            id_user: editUser, id_rute: editRute,
        }, { onSuccess: () => { setEditMode(false); onClose(); } });
    };

    // ← ganti confirm() dengan ConfirmDialog
    const handleHapusMingguIni = () => {
        setConfirm({
            open: true,
            message: `Hapus jadwal ${absensi.user?.nama} pada ${jadwal.tanggal}?`,
            onConfirm: () => {
                setConfirm(c => ({ ...c, open: false }));
                router.delete(route('admin.jadwal.absensi.destroy', absensi.id), { onSuccess: onClose });
            },
        });
    };

    const handleHapusTemplate = () => {
        setConfirm({
            open: true,
            message: `Hapus semua jadwal berulang ${absensi.user?.nama} dari minggu ini ke depan?`,
            onConfirm: () => {
                setConfirm(c => ({ ...c, open: false }));
                router.delete(route('admin.jadwal.template.destroy'), {
                    data: {
                        id_pos_jaga : jadwal.pos_jaga?.id,
                        id_shift    : jadwal.shift?.id,
                        id_user     : absensi.user?.id,
                        from_date   : jadwal.tanggal,
                    },
                    onSuccess: onClose,
                });
            },
        });
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">

                    <div className="flex items-center justify-between px-6 py-4 border-b"
                        style={{ borderColor: '#e0f2fe' }}>
                        <div>
                            <h2 className="text-base font-bold" style={{ color: '#0F2A44' }}>Detail Jadwal</h2>
                            <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>{jadwal.tanggal}</p>
                        </div>
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
                            style={{ color: '#94a3b8' }}>✕</button>
                    </div>

                    <div className="px-6 py-5 space-y-3">
                        <div className="rounded-xl p-3 space-y-2"
                            style={{ background: '#f8fafc', border: '1.5px solid #c7e8f8' }}>
                            <InfoRow label="Pos Jaga" value={jadwal.pos_jaga?.nama} />
                            <InfoRow label="Shift"    value={jadwal.shift?.nama} />
                            <InfoRow label="Jam"      value={`${jadwal.shift?.jam_masuk} – ${jadwal.shift?.jam_pulang}`} />
                        </div>

                        <div className="h-px" style={{ background: '#e0f2fe' }} />

                        {editMode ? (
                            <div className="space-y-3">
                                <FormInput label="Petugas">
                                    <Select value={editUser} onChange={e => setEditUser(e.target.value)}>
                                        {petugas.map(u => <option key={u.id} value={u.id}>{u.nama}</option>)}
                                    </Select>
                                </FormInput>
                                <FormInput label="Rute">
                                    <Select value={editRute} onChange={e => setEditRute(e.target.value)}>
                                        {rutes.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
                                    </Select>
                                </FormInput>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <InfoRow label="Petugas" value={absensi.user?.nama} />
                                <InfoRow label="Rute"    value={absensi.rute?.nama} />
                                <InfoRow label="Status"  value={<StatusBadge status={absensi.status} />} />
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t" style={{ borderColor: '#e0f2fe' }}>
                        {editMode ? (
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setEditMode(false)}
                                    className="px-4 py-2 text-sm rounded-xl border hover:bg-gray-50"
                                    style={{ borderColor: '#c7e8f8', color: '#64748b' }}>
                                    Batal
                                </button>
                                <button onClick={handleUpdate}
                                    className="px-4 py-2 text-sm rounded-xl font-semibold hover:opacity-90"
                                    style={{ background: '#005EA4', color: 'white' }}>
                                    Simpan Perubahan
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setEditMode(true)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-105 transition-transform"
                                    style={{ background: '#e0f2fe' }} title="Edit">
                                    ✏️
                                </button>
                                <button onClick={handleHapusMingguIni}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-105 transition-transform"
                                    style={{ background: '#fde8e8' }} title="Hapus Minggu Ini">
                                    🗑
                                </button>
                                <button onClick={handleHapusTemplate}
                                    className="px-3 py-1.5 text-xs rounded-xl font-semibold hover:opacity-90"
                                    style={{ background: '#fde8e8', color: '#c0392b' }}>
                                    Hapus Template
                                </button>
                                <button onClick={onClose}
                                    className="ml-auto px-4 py-2 text-sm rounded-xl border hover:bg-gray-50"
                                    style={{ borderColor: '#c7e8f8', color: '#64748b' }}>
                                    Tutup
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ← ConfirmDialog muncul di atas ModalDetail (z-[60]) */}
            <ConfirmDialog
                open={confirm.open}
                message={confirm.message}
                onConfirm={confirm.onConfirm}
                onCancel={() => setConfirm(c => ({ ...c, open: false }))}
            />
        </>
    );
}