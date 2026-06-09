import { SHIFT_COLOR } from './constants';
import { shiftKey } from './utils';
import { StatusBadge } from './StatusBadge';

export function JadwalCard({ absensi, shiftNama, onClick }) {
    const isLibur = absensi.status === 'libur';
    const c = isLibur
        ? { bg: '#f8fafc', border: '#cbd5e1', text: '#64748b', sub: '#94a3b8' }
        : SHIFT_COLOR[shiftKey(shiftNama)];

    return (
        <div
            onClick={onClick}
            className="rounded-lg border px-2 py-1.5 mb-1 cursor-pointer transition-all hover:shadow-sm hover:scale-[1.01]"
            style={{ background: c.bg, borderColor: c.border }}
        >
            <div className="mb-0.5">
                <p className="text-[11px] font-semibold truncate" style={{ color: c.text }}>
                    {absensi.user?.nama ?? '—'}
                </p>
            </div>
            <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] truncate" style={{ color: c.sub }}>
                    {isLibur ? '— libur —' : (absensi.rute?.nama ?? '—')}
                </p>
                <StatusBadge status={absensi.status} />
            </div>
        </div>
    );
}