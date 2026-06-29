import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { ConfirmDialog } from './ConfirmDialog';

function InfoRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-xs shrink-0" style={{ color: '#94a3b8' }}>{label}</span>
            <span className="text-xs font-semibold text-right" style={{ color: '#0F2A44' }}>{value}</span>
        </div>
    );
}

const DAYS   = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

function formatTanggal(dateStr) {
    const d = new Date(dateStr);
    return `${DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function ModalTukarLibur({ open, onClose, absensiLibur, jadwalLibur, jadwals }) {
    const [selectedLiburId, setSelectedLiburId] = useState('');
    const [processing, setProcessing]           = useState(false);
    const [confirm, setConfirm]                 = useState({ open: false, message: '', onConfirm: null, confirmText: 'Ya', confirmColor: '#005EA4' });

    useMemo(() => {
        if (open) setSelectedLiburId('');
    }, [open]);

    if (!open || !absensiLibur || !jadwalLibur) return null;

    // Kumpulkan semua petugas libur lain di minggu yang sama
    // (beda hari, sama pos jaga)
    const pilihanLibur = jadwals
        .filter(j =>
            j.pos_jaga?.id === jadwalLibur.pos_jaga?.id &&
            j.tanggal !== jadwalLibur.tanggal
        )
        .flatMap(j =>
            j.absensi
                .filter(ab =>
                    ab.status === 'libur' &&
                    ab.id !== absensiLibur.id
                )
                .map(ab => ({ ...ab, tanggal: j.tanggal }))
        )
        .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

    const selectedLibur = pilihanLibur.find(p => String(p.id) === String(selectedLiburId));

    const handleSubmit = () => {
        if (!selectedLiburId) return;
        setProcessing(true);
        router.post(route('admin.jadwal.tukar-libur'), {
            id_absensi_libur_a : absensiLibur.id,
            id_absensi_libur_b : selectedLiburId,
        }, {
            onSuccess: () => { setProcessing(false); onClose(); },
            onError:   () => { setProcessing(false); },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b"
                    style={{ borderColor: '#e0f2fe' }}>
                    <div>
                        <h2 className="text-base font-bold" style={{ color: '#0F2A44' }}>Tukar Hari Libur</h2>
                        <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
                            Tukar hari libur antara dua petugas
                        </p>
                    </div>
                    <button onClick={onClose} disabled={processing}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                        style={{ color: '#94a3b8' }}>✕</button>
                </div>

                <div className="px-6 py-5 space-y-4">

                    {/* Info petugas A yang libur */}
                    <div>
                        <p className="text-[10px] font-semibold uppercase mb-2" style={{ color: '#94a3b8' }}>
                            Petugas A (libur)
                        </p>
                        <div className="rounded-xl p-3 space-y-2"
                            style={{ background: '#fef2f2', border: '1.5px solid #fca5a5' }}>
                            <InfoRow label="Nama"     value={absensiLibur.user?.nama ?? '—'} />
                            <InfoRow label="Libur di" value={formatTanggal(jadwalLibur.tanggal)} />
                            <InfoRow label="Pos Jaga" value={jadwalLibur.pos_jaga?.nama ?? '—'} />
                        </div>
                    </div>

                    {/* Pilih petugas B yang juga libur */}
                    <div>
                        <p className="text-[10px] font-semibold uppercase mb-2" style={{ color: '#94a3b8' }}>
                            Tukar Dengan Petugas B (libur di hari lain)
                        </p>

                        {pilihanLibur.length === 0 ? (
                            <div className="rounded-xl px-4 py-3 text-xs text-center"
                                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#94a3b8' }}>
                                Tidak ada petugas lain yang sedang libur minggu ini.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1"
                                style={{ scrollbarWidth: 'thin' }}>
                                {pilihanLibur.map(p => {
                                    const isSelected = String(p.id) === String(selectedLiburId);
                                    return (
                                        <button key={p.id}
                                            onClick={() => setSelectedLiburId(String(p.id))}
                                            className="w-full text-left rounded-xl px-3 py-2.5 border transition-all"
                                            style={{
                                                background  : isSelected ? '#eff6ff' : '#f8fafc',
                                                borderColor : isSelected ? '#005EA4' : '#e2e8f0',
                                            }}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold" style={{ color: '#0F2A44' }}>
                                                    {p.user?.nama ?? '—'}
                                                </span>
                                                {isSelected && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                        stroke="#005EA4" strokeWidth="2.5"
                                                        strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12"/>
                                                    </svg>
                                                )}
                                            </div>
                                            <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>
                                                Libur di {formatTanggal(p.tanggal)}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Preview hasil tukar */}
                    {selectedLibur && (
                        <div className="rounded-xl px-4 py-3 border text-xs space-y-2"
                            style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
                            <p className="font-semibold text-[10px] uppercase" style={{ color: '#166534' }}>
                                Hasil setelah ditukar:
                            </p>
                            <div className="flex items-start gap-2" style={{ color: '#166534' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                    strokeLinejoin="round" className="mt-0.5 shrink-0">
                                    <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/>
                                </svg>
                                <div className="space-y-1">
                                    <p>
                                        <span className="font-semibold">{absensiLibur.user?.nama}</span>
                                        {' '}libur di {formatTanggal(selectedLibur.tanggal)},
                                        semua tugasnya diambil oleh{' '}
                                        <span className="font-semibold">{selectedLibur.user?.nama}</span>
                                    </p>
                                    <p>
                                        <span className="font-semibold">{selectedLibur.user?.nama}</span>
                                        {' '}libur di {formatTanggal(jadwalLibur.tanggal)},
                                        semua tugasnya diambil oleh{' '}
                                        <span className="font-semibold">{absensiLibur.user?.nama}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t flex justify-end gap-2"
                    style={{ borderColor: '#e0f2fe' }}>
                    <button onClick={onClose} disabled={processing}
                        className="px-4 py-2 text-sm rounded-xl border hover:bg-gray-50 disabled:opacity-40"
                        style={{ borderColor: '#c7e8f8', color: '#64748b' }}>
                        Tutup
                    </button>
                    <button onClick={() => {
                        setConfirm({
                            open: true,
                            message: `Batalkan hari libur untuk ${absensiLibur.user?.nama}? Petugas akan dikembalikan ke shift.`,
                            confirmText: 'Ya, Batalkan Libur',
                            confirmColor: '#b45309',
                            onConfirm: () => {
                                setConfirm(c => ({ ...c, open: false }));
                                setProcessing(true);
                                router.post(route('admin.jadwal.absensi.toggle-libur', absensiLibur.id), {}, {
                                    onSuccess: () => { setProcessing(false); onClose(); },
                                    onError: () => { setProcessing(false); },
                                });
                            }
                        });
                    }} disabled={processing}
                        className="px-4 py-2 text-sm rounded-xl font-semibold hover:opacity-90 disabled:opacity-40"
                        style={{ background: '#fef3c7', color: '#b45309' }}>
                        Batalkan Libur
                    </button>
                    <button onClick={handleSubmit}
                        disabled={!selectedLiburId || processing}
                        className="px-5 py-2 text-sm rounded-xl font-semibold hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
                        style={{ background: '#005EA4', color: 'white' }}>
                        {processing ? (
                            <>
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                </svg>
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/>
                                </svg>
                                Tukar Libur
                            </>
                        )}
                    </button>
                </div>
            </div>

            <ConfirmDialog
                open={confirm.open}
                message={confirm.message}
                onConfirm={confirm.onConfirm}
                onCancel={() => setConfirm(c => ({ ...c, open: false }))}
                confirmText={confirm.confirmText}
                confirmColor={confirm.confirmColor}
            />
        </div>
    );
}