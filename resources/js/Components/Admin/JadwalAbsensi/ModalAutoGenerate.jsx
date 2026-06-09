import { useState } from 'react';
import { router } from '@inertiajs/react';
import { formatWeekRange } from './utils';

const RULES = [
    {
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                <polyline points="21 3 21 9 15 9"/>
            </svg>
        ),
        text: 'Rotasi libur otomatis — 1 petugas libur per hari per pos',
    },
    {
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="7" r="4"/>
                <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                <path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
            </svg>
        ),
        text: 'Setiap shift diisi minimal 2 petugas',
    },
    {
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
            </svg>
        ),
        text: 'Petugas dibagi merata ke masing-masing pos jaga',
    },
    {
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        ),
        text: 'Jadwal yang sudah ada tidak akan ditimpa',
    },
];

export function ModalAutoGenerate({ open, onClose, weekOffset, startOfWeek, endOfWeek }) {
    const [processing, setProcessing] = useState(false);

    if (!open) return null;

    // Langsung generate tanpa confirm
    const handleGenerate = () => {
        setProcessing(true);
        router.post(
            route('admin.jadwal.auto-generate'),
            { week_offset: weekOffset },
            {
                onSuccess: () => { setProcessing(false); onClose(); },
                onError:   () => { setProcessing(false); },
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b"
                    style={{ borderColor: '#e0f2fe' }}>
                    <div>
                        <h2 className="text-base font-bold" style={{ color: '#0F2A44' }}>
                            Generate Jadwal Otomatis
                        </h2>
                        <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
                            Buat jadwal minggu ini secara otomatis
                        </p>
                    </div>
                    <button onClick={onClose} disabled={processing}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                        style={{ color: '#94a3b8' }}>✕</button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">

                    {/* Periode */}
                    <div className="rounded-xl px-4 py-3 border"
                        style={{ background: '#f0f9ff', borderColor: '#c7e8f8' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: '#0F2A44' }}>
                            Periode Minggu Ini
                        </p>
                        <p className="text-sm font-bold" style={{ color: '#005EA4' }}>
                            {formatWeekRange(startOfWeek, endOfWeek)}
                        </p>
                    </div>

                    {/* Aturan */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold" style={{ color: '#0F2A44' }}>
                            Aturan penjadwalan:
                        </p>
                        {RULES.map((rule, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-xs"
                                style={{ color: '#64748b' }}>
                                <span className="mt-0.5 shrink-0 rounded-md p-1"
                                    style={{ background: '#e0f2fe', color: '#005EA4' }}>
                                    {rule.icon}
                                </span>
                                <span className="leading-relaxed">{rule.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Warning */}
                    <div className="rounded-xl px-4 py-3 border text-xs flex items-start gap-2"
                        style={{ background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                            strokeLinejoin="round" className="shrink-0 mt-0.5">
                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        Pastikan data petugas, shift, rute, dan pos jaga sudah lengkap sebelum generate.
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t flex justify-end gap-2"
                    style={{ borderColor: '#e0f2fe' }}>
                    <button onClick={onClose} disabled={processing}
                        className="px-4 py-2 text-sm rounded-xl border hover:bg-gray-50 disabled:opacity-40"
                        style={{ borderColor: '#c7e8f8', color: '#64748b' }}>
                        Batal
                    </button>
                    <button onClick={handleGenerate} disabled={processing}
                        className="px-5 py-2 text-sm rounded-xl font-semibold hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
                        style={{ background: '#005EA4', color: 'white' }}>
                        {processing ? (
                            <>
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                </svg>
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="3"/>
                                    <path d="M16 2v4M8 2v4M3 10h18"/>
                                </svg>
                                Generate Sekarang
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}