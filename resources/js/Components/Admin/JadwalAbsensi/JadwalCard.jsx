import { router } from '@inertiajs/react';
import { SHIFT_COLOR } from './constants';
import { shiftKey } from './utils';
import { StatusBadge } from './StatusBadge';

export function JadwalCard({ absensi, shiftNama, onClick }) {
    const isLibur = absensi.status === 'libur';
    const c = isLibur
        ? { bg: '#f8fafc', border: '#cbd5e1', text: '#64748b', sub: '#94a3b8' }
        : SHIFT_COLOR[shiftKey(shiftNama)];

    // Warna override jika pulang cepat aktif
    const cardBg     = absensi.pulang_cepat ? '#fff7ed' : c.bg;
    const cardBorder = absensi.pulang_cepat ? '#fb923c' : c.border;

    const handlePulangCepat = (e) => {
        e.stopPropagation();
        router.patch(
            route('admin.jadwal.pulangCepat', absensi.id),
            { pulang_cepat: e.target.checked },
            { preserveState: true, replace: true }
        );
    };

    return (
        <div
            onClick={onClick}
            className="rounded-lg border px-2 py-1.5 mb-1 cursor-pointer transition-all hover:shadow-sm hover:scale-[1.01]"
            style={{ background: cardBg, borderColor: cardBorder }}
        >
            {/* Nama petugas */}
            <div className="mb-0.5">
                <p className="text-[11px] font-semibold truncate" style={{ color: c.text }}>
                    {absensi.user?.nama ?? '—'}
                </p>
            </div>

            {/* Rute + status badge */}
            <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] truncate" style={{ color: c.sub }}>
                    {isLibur ? '— libur —' : (absensi.rute?.nama ?? '—')}
                </p>
                <StatusBadge status={absensi.status} />
            </div>

            {/* Checkbox pulang cepat — hanya muncul jika bukan libur */}
            {!isLibur && (
                <label
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 mt-1.5 cursor-pointer select-none w-fit"
                >
                    <input
                        type="checkbox"
                        checked={!!absensi.pulang_cepat}
                        onChange={handlePulangCepat}
                        className="cursor-pointer"
                        style={{ accentColor: '#ea580c' }}
                    />
                    <span className="text-[9px] font-semibold"
                        style={{ color: absensi.pulang_cepat ? '#ea580c' : '#94a3b8' }}>
                        Pulang Cepat
                    </span>
                    {absensi.pulang_cepat && (
                        <span className="text-[9px]">⚡</span>
                    )}
                </label>
            )}
        </div>
    );
}