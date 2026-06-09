import { Head, router, usePage } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { StatCard } from "@/Components/Admin/StatCard";

const C = {
    navy: "#0F2A44", blue: "#005EA4", blueSoft: "#e0f2fe",
    blueBorder: "#c7e8f8", slate: "#64748b", slateLight: "#f8fafc",
    green: "#15803d", greenSoft: "#dcfce7", greenBorder: "#86efac",
    red: "#c0392b", redSoft: "#fde8e8", redBorder: "#fca5a5",
};

function Flash() {
    const { flash, errors } = usePage().props;
    if (!flash?.success && !errors?.range) return null;
    return (
        <div className="mb-3 px-4 py-3 rounded-xl text-sm border"
            style={flash?.success
                ? { background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }
                : { background: C.redSoft, borderColor: C.redBorder, color: C.red }}>
            {flash?.success ?? errors?.range}
        </div>
    );
}

function StatusBadge({ status }) {
    const s = status === 'keluar'
        ? { bg: '#dcfce7', border: '#86efac', text: '#15803d' }
        : { bg: C.blueSoft, border: C.blueBorder, text: C.blue };
    return (
        <span className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full border capitalize"
            style={{ background: s.bg, borderColor: s.border, color: s.text }}>
            {status}
        </span>
    );
}

const SUPABASE_URL    = import.meta.env.VITE_SUPABASE_URL    ?? "https://dwyfjwwgrtdspgdaifyv.supabase.co";
const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET ?? "aegis";

function FotoTamu({ url, nama }) {
    const [err, setErr] = useState(false);
    const resolved = !url || err ? null
        : url.startsWith('http') ? url
        : `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${url.replace(/^\//, '')}`;

    if (!resolved) {
        return (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm text-white"
                style={{ background: C.blue }}>
                {nama?.[0]?.toUpperCase() ?? '?'}
            </div>
        );
    }
    return (
        <img src={resolved} alt={nama} onError={() => setErr(true)}
            className="w-10 h-10 rounded-xl object-cover shrink-0"
            style={{ border: `1.5px solid ${C.blueBorder}` }} />
    );
}

function DetailModal({ tamu, onClose, onDelete }) {
    if (!tamu) return null;

    const formatWaktu = (val) => {
        if (!val) return '-';
        const d = new Date(val);
        const pad = n => String(n).padStart(2, '0');
        const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const fotoUrl = !tamu.foto_tamu ? null
        : tamu.foto_tamu.startsWith('http') ? tamu.foto_tamu
        : `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${tamu.foto_tamu.replace(/^\//, '')}`;

    const isKeluar = tamu.status === 'keluar';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,42,68,0.6)", backdropFilter: "blur(2px)" }}
            onClick={e => e.target === e.currentTarget && onClose()}>

            <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                style={{ background: "white", maxHeight: '90vh' }}>

                {/* ── Header ── */}
                <div className="px-6 py-4 flex items-center justify-between shrink-0"
                    style={{ background: C.navy }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(59,158,222,0.2)" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white leading-none">Detail Tamu</h3>
                            <p className="text-[10px] mt-0.5" style={{ color: "#90c4e8" }}>Informasi lengkap tamu</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10"
                        style={{ color: "#90c4e8" }}>✕</button>
                </div>

                <div className="h-1 shrink-0" style={{ background: C.blue }} />

                {/* ── Body: foto kiri + data kanan ── */}
                <div className="flex overflow-hidden">

                    {/* Kolom kiri — foto + nama & ID di bawah */}
                    <div className="w-52 shrink-0 flex flex-col"
                        style={{ borderRight: `1.5px solid ${C.blueBorder}`, background: C.slateLight }}>
                        <div className="w-full overflow-hidden shrink-0" style={{ aspectRatio: '3/4', maxHeight: 300 }}>
                            {fotoUrl ? (
                                <img src={fotoUrl} alt={tamu.nama} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
                                    style={{ background: `linear-gradient(160deg, ${C.blue}, #0284c7)` }}>
                                    {tamu.nama?.[0]?.toUpperCase() ?? '?'}
                                </div>
                            )}
                        </div>

                        {/* Nama & ID berdampingan mengisi sisa ruang */}
                        <div className="flex-1 flex flex-col justify-center px-4 py-3 gap-2"
                            style={{ borderTop: `1.5px solid ${C.blueBorder}` }}>
                            <div className="flex items-start justify-between gap-2">
                                <p className="font-bold text-base leading-tight" style={{ color: C.navy }}>{tamu.nama}</p>
                                <p className="font-bold text-base shrink-0" style={{ color: C.blue }}>
                                    #{String(tamu.id).padStart(4, '0')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Kolom kanan — semua data */}
                    <div className="flex-1 overflow-y-auto flex flex-col"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#b8dff0 transparent' }}>

                        {/* Status bar */}
                        <div className="px-4 py-2.5 flex items-center justify-between shrink-0"
                            style={{
                                background: isKeluar ? '#f0fdf4' : C.blueSoft,
                                borderBottom: `1.5px solid ${isKeluar ? '#86efac' : C.blueBorder}`,
                            }}>
                            <span className="text-xs font-semibold" style={{ color: isKeluar ? '#166534' : C.blue }}>
                                Status Kunjungan
                            </span>
                            <span className="text-xs font-bold px-3 py-1 rounded-full"
                                style={{
                                    background: isKeluar ? '#dcfce7' : 'white',
                                    color: isKeluar ? '#15803d' : C.blue,
                                    border: `1.5px solid ${isKeluar ? '#86efac' : C.blueBorder}`,
                                }}>
                                {isKeluar ? 'Keluar' : 'Masuk'}
                            </span>
                        </div>

                        <div className="px-4 py-3 flex flex-col gap-3">

                            {/* Alamat */}
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: C.slate }}>Alamat</p>
                                <div className="flex items-start gap-2">
                                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                                        style={{ background: C.blueSoft }}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                            <polyline points="9 22 9 12 15 12 15 22"/>
                                        </svg>
                                    </div>
                                    <p className="text-sm" style={{ color: C.navy }}>{tamu.alamat}</p>
                                </div>
                            </div>

                            {/* Keperluan */}
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: C.slate }}>Keperluan</p>
                                <div className="rounded-lg px-3 py-2"
                                    style={{ background: C.blueSoft, border: `1.5px solid ${C.blueBorder}` }}>
                                    <p className="text-sm" style={{ color: C.navy }}>{tamu.keperluan}</p>
                                </div>
                            </div>

                            {/* Dicatat Oleh */}
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: C.slate }}>Dicatat Oleh</p>
                                <p className="text-sm font-semibold" style={{ color: C.navy }}>
                                    {tamu.user?.nama ?? '-'}
                                </p>
                            </div>

                            {/* Waktu Kunjungan */}
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: C.slate }}>Waktu Kunjungan</p>
                                <div className="rounded-lg overflow-hidden"
                                    style={{ border: `1.5px solid ${C.blueBorder}` }}>
                                    <div className="flex items-center gap-2.5 px-3 py-2.5"
                                        style={{ borderBottom: `1px solid ${C.blueBorder}` }}>
                                        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                                            style={{ background: '#dcfce7' }}>
                                            <div className="w-2 h-2 rounded-full" style={{ background: '#16a34a' }} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase" style={{ color: C.slate }}>Masuk</p>
                                            <p className="text-xs font-bold" style={{ color: C.navy }}>{formatWaktu(tamu.waktu_masuk)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 px-3 py-2.5">
                                        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                                            style={{ background: tamu.waktu_keluar ? C.redSoft : '#f1f5f9' }}>
                                            <div className="w-2 h-2 rounded-full"
                                                style={{ background: tamu.waktu_keluar ? C.red : '#cbd5e1' }} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase" style={{ color: C.slate }}>Keluar</p>
                                            <p className="text-xs font-bold" style={{ color: C.navy }}>{formatWaktu(tamu.waktu_keluar)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="px-6 py-4 flex gap-3 shrink-0"
                    style={{ borderTop: `1.5px solid ${C.blueBorder}` }}>
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-all"
                        style={{ background: C.blueSoft, color: C.blue, border: `1.5px solid ${C.blueBorder}` }}>
                        Tutup
                    </button>
                    <button onClick={() => { onClose(); onDelete(tamu); }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        style={{ background: C.red }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M9 6V4h6v2"/>
                        </svg>
                        Hapus Data
                    </button>
                </div>
            </div>
        </div>
    );
}

function DeleteSingleModal({ tamu, onClose }) {
    const [processing, setProcessing] = useState(false);
    if (!tamu) return null;

    const handleDelete = () => {
        setProcessing(true);
        router.delete(route('admin.buku-tamu.destroy', tamu.id), {
            onFinish: () => { setProcessing(false); onClose(); },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,42,68,0.6)", backdropFilter: "blur(2px)" }}
            onClick={e => e.target === e.currentTarget && !processing && onClose()}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: "white" }}>
                <div className="p-6 flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: C.redSoft }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-base" style={{ color: C.navy }}>Hapus Data Tamu?</h3>
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.slate }}>
                            Anda akan menghapus data tamu{" "}
                            <span className="font-semibold" style={{ color: C.navy }}>{tamu.nama}</span>.
                            Tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>
                    <div className="flex gap-2 w-full">
                        <button onClick={onClose} disabled={processing}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 disabled:opacity-50"
                            style={{ background: '#f1f5f9', color: C.slate, border: `1.5px solid #e2e8f0` }}>
                            Batal
                        </button>
                        <button onClick={handleDelete} disabled={processing}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                            style={{ background: C.red }}>
                            {processing ? 'Menghapus...' : 'Ya, Hapus'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DeleteRangeModal({ open, onClose }) {
    const [dari,    setDari]    = useState('');
    const [sampai,  setSampai]  = useState('');
    const [processing, setProcessing] = useState(false);
    const { errors } = usePage().props;

    if (!open) return null;

    const handleDelete = () => {
        if (!dari || !sampai) return;
        setProcessing(true);
        router.delete(route('admin.buku-tamu.destroy-range'), {
            data: { dari, sampai },
            onSuccess: () => { onClose(); setDari(''); setSampai(''); },
            onFinish:  () => setProcessing(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,42,68,0.6)", backdropFilter: "blur(2px)" }}
            onClick={e => e.target === e.currentTarget && !processing && onClose()}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: "white" }}>

                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between" style={{ background: C.navy }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(239,68,68,0.2)" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14H6L5 6"/>
                                <path d="M9 6V4h6v2"/>
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white leading-none">Hapus per Rentang Tanggal</h3>
                            <p className="text-[10px] mt-0.5" style={{ color: "#90c4e8" }}>
                                Hapus semua data tamu pada periode tertentu
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={processing}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10"
                        style={{ color: "#90c4e8" }}>✕</button>
                </div>

                <div className="px-6 py-5 flex flex-col gap-4">

                    {/* Warning */}
                    <div className="rounded-xl px-4 py-3 text-xs border"
                        style={{ background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e' }}>
                        ⚠️ Semua data tamu pada rentang tanggal ini akan dihapus permanen dan tidak dapat dipulihkan.
                    </div>

                    {/* Dari */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: C.navy }}>
                            Dari Tanggal <span style={{ color: C.red }}>*</span>
                        </label>
                        <input type="date" value={dari} onChange={e => setDari(e.target.value)}
                            className="text-sm rounded-xl px-3 py-2.5 outline-none transition-all"
                            style={{ background: C.slateLight, border: `1.5px solid ${errors?.dari ? '#ef4444' : C.blueBorder}`, color: C.navy }} />
                        {errors?.dari && <p className="text-[10px]" style={{ color: '#ef4444' }}>{errors.dari}</p>}
                    </div>

                    {/* Sampai */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: C.navy }}>
                            Sampai Tanggal <span style={{ color: C.red }}>*</span>
                        </label>
                        <input type="date" value={sampai} onChange={e => setSampai(e.target.value)}
                            min={dari}
                            className="text-sm rounded-xl px-3 py-2.5 outline-none transition-all"
                            style={{ background: C.slateLight, border: `1.5px solid ${errors?.sampai ? '#ef4444' : C.blueBorder}`, color: C.navy }} />
                        {errors?.sampai && <p className="text-[10px]" style={{ color: '#ef4444' }}>{errors.sampai}</p>}
                    </div>

                    {errors?.range && (
                        <p className="text-xs px-3 py-2 rounded-xl"
                            style={{ background: C.redSoft, color: C.red, border: `1px solid ${C.redBorder}` }}>
                            {errors.range}
                        </p>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button onClick={onClose} disabled={processing}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 disabled:opacity-50"
                            style={{ background: '#f1f5f9', color: C.slate, border: `1.5px solid #e2e8f0` }}>
                            Batal
                        </button>
                        <button onClick={handleDelete} disabled={processing || !dari || !sampai}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ background: C.red }}>
                            {processing ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Menghapus...
                                </>
                            ) : 'Hapus Data'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BukuTamu({ tamus, stats, filters }) {
    const [search,      setSearch]      = useState(filters?.search  ?? '');
    const [status,      setStatus]      = useState(filters?.status  ?? 'semua');
    const [tanggal,     setTanggal]     = useState(filters?.tanggal ?? '');
    const [detail,      setDetail]      = useState(null);
    const [deleteSingle, setDeleteSingle] = useState(null);
    const [deleteRange, setDeleteRange] = useState(false);
    const isFirst = useRef(true);

    useEffect(() => {
        if (isFirst.current) { isFirst.current = false; return; }
        const t = setTimeout(() => applyFilter(), 400);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const applyFilter = () => {
        router.get(route('admin.buku-tamu.index'), {
            search:  search  || undefined,
            status:  status !== 'semua' ? status : undefined,
            tanggal: tanggal || undefined,
        }, { preserveState: true, replace: true });
    };

    const formatWaktu = (val) => {
        if (!val) return '-';
        const d = new Date(val);
        const pad = n => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const list = tamus?.data ?? [];
    const meta = tamus;

    const statCards = [
        {
            label: 'Total Tamu', value: stats.total, sub: 'semua waktu', blue: true,
            icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>, accent: '#fbbf24',
        },
        {
            label: 'Tamu Masuk', value: stats.masuk, sub: 'belum keluar', blue: false,
            icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#005EA4" strokeWidth="1.8">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>, accent: '#005EA4',
        },
        {
            label: 'Tamu Keluar', value: stats.keluar, sub: 'sudah keluar', blue: true,
            icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>, accent: '#34d399',
        },
        {
            label: 'Hari Ini', value: stats.hari_ini, sub: 'tamu hari ini', blue: false,
            icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#005EA4" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="3"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>, accent: '#7c3aed',
        },
    ];

    return (
        <>
            <Head title="Buku Tamu" />
            <AdminLayout activeMenu="Buku Tamu" title="Buku Tamu">
                <div className="flex flex-col gap-3 flex-1 min-h-0">
                    <Flash />

                    {/* Stat Cards */}
                    <div className="grid grid-cols-4 gap-4 shrink-0">
                        {statCards.map(c => <StatCard key={c.label} {...c} />)}
                    </div>

                    {/* Table Card */}
                    <div className="flex-1 rounded-2xl overflow-hidden flex flex-col min-h-0 shadow-sm"
                        style={{ background: 'white', border: `1.5px solid ${C.blueBorder}` }}>

                        {/* Toolbar */}
                        <div className="px-5 py-3 shrink-0 flex items-center gap-3 flex-wrap"
                            style={{ borderBottom: `1.5px solid ${C.blueBorder}` }}>

                            <div className="flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                </svg>
                                <h2 className="font-semibold text-sm" style={{ color: C.navy }}>Daftar Tamu</h2>
                            </div>

                            {/* Search */}
                            <div className="relative min-w-[200px] max-w-xs flex-1">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.slate} strokeWidth="2"
                                    style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
                                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                                </svg>
                                <input
                                    type="text" value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama tamu..."
                                    className="w-full text-xs rounded-xl pl-8 pr-8 py-2 outline-none transition-colors border-0 ring-0 focus:ring-0"
                                    style={{ background: C.slateLight, border: `1.5px solid ${C.blueBorder}`, color: C.navy }}
                                    onFocus={(e) => (e.target.style.borderColor = C.blue)}
                                    onBlur={(e)  => (e.target.style.borderColor = C.blueBorder)}
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} style={{ color: C.slate, position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Filter Status */}
                            <select value={status} onChange={e => setStatus(e.target.value)}
                                className="text-xs rounded-xl px-3 py-2 outline-none"
                                style={{ background: C.slateLight, border: `1.5px solid ${C.blueBorder}`, color: C.navy }}>
                                <option value="semua">Semua Status</option>
                                <option value="masuk">Masuk</option>
                                <option value="keluar">Keluar</option>
                            </select>

                            {/* Filter Tanggal */}
                            <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
                                className="text-xs rounded-xl px-3 py-2 outline-none"
                                style={{ background: C.slateLight, border: `1.5px solid ${C.blueBorder}`, color: C.navy }} />

                            <button onClick={applyFilter}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90"
                                style={{ background: C.blue }}>
                                Terapkan
                            </button>

                            {(search || status !== 'semua' || tanggal) && (
                                <button onClick={() => {
                                    setSearch(''); setStatus('semua'); setTanggal('');
                                    router.get(route('admin.buku-tamu.index'), {}, { preserveState: true, replace: true });
                                }} className="text-xs px-3 py-2 rounded-xl hover:opacity-70"
                                    style={{ background: C.redSoft, color: C.red }}>
                                    Reset
                                </button>
                            )}

                            {/* Tombol Hapus Range */}
                            <button onClick={() => setDeleteRange(true)}
                                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 shrink-0"
                                style={{ background: C.red }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-1 14H6L5 6"/>
                                    <path d="M9 6V4h6v2"/>
                                </svg>
                                Hapus per Tanggal
                            </button>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-auto"
                            style={{ scrollbarWidth: 'thin', scrollbarColor: '#b8dff0 transparent' }}>
                            <table className="w-full text-sm" style={{ minWidth: 750 }}>
                                <thead className="sticky top-0 z-10">
                                    <tr style={{ background: C.blue, color: 'white' }}>
                                        {['#','Foto','Nama','Alamat','Keperluan','Dicatat Oleh','Waktu Masuk','Waktu Keluar','Status','Aksi'].map(h => (
                                            <th key={h} className="px-4 py-3 text-center text-xs font-semibold whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                                        style={{ background: C.blueSoft }}>
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.blueBorder} strokeWidth="2">
                                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                                            <circle cx="9" cy="7" r="4"/>
                                                        </svg>
                                                    </div>
                                                    <p className="text-xs font-semibold" style={{ color: '#cbd5e1' }}>Tidak ada data tamu</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : list.map((tamu, i) => (
                                        <tr key={tamu.id}
                                            className="transition-colors hover:bg-blue-50 cursor-pointer"
                                            style={{ background: i % 2 === 1 ? '#f0f9ff' : 'white', borderBottom: `1px solid ${C.blueBorder}` }}
                                            onClick={() => setDetail(tamu)}>
                                            <td className="px-4 py-3 text-center text-xs" style={{ color: C.slate }}>
                                                {(meta.current_page - 1) * meta.per_page + i + 1}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center">
                                                    <FotoTamu url={tamu.foto_tamu} nama={tamu.nama} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs font-semibold" style={{ color: C.navy }}>{tamu.nama}</td>
                                            <td className="px-4 py-3 text-center text-xs" style={{ color: C.slate, maxWidth: 140 }}>
                                                <span className="block truncate">{tamu.alamat}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs" style={{ color: C.slate, maxWidth: 140 }}>
                                                <span className="block truncate">{tamu.keperluan}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs" style={{ color: C.slate }}>{tamu.user?.nama ?? '-'}</td>
                                            <td className="px-4 py-3 text-center text-xs whitespace-nowrap" style={{ color: C.slate }}>{formatWaktu(tamu.waktu_masuk)}</td>
                                            <td className="px-4 py-3 text-center text-xs whitespace-nowrap" style={{ color: C.slate }}>{formatWaktu(tamu.waktu_keluar)}</td>
                                            <td className="px-4 py-3 text-center"><StatusBadge status={tamu.status} /></td>
                                            <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => setDeleteSingle(tamu)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-105 transition-transform mx-auto"
                                                    style={{ background: C.redSoft }}
                                                    title="Hapus">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6"/>
                                                        <path d="M19 6l-1 14H6L5 6"/>
                                                        <path d="M9 6V4h6v2"/>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {meta?.last_page > 1 && (
                            <div className="px-5 py-3 shrink-0 flex items-center justify-between"
                                style={{ borderTop: `1.5px solid ${C.blueBorder}` }}>
                                <span className="text-xs" style={{ color: C.slate }}>
                                    Halaman{' '}
                                    <span className="font-semibold" style={{ color: C.navy }}>{meta.current_page}</span>
                                    {' / '}
                                    <span className="font-semibold" style={{ color: C.navy }}>{meta.last_page}</span>
                                    {' · '}{meta.total} data
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => router.get(meta.prev_page_url, {}, { preserveState: true })}
                                        disabled={!meta.prev_page_url}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
                                        style={{ background: C.blueSoft, color: C.blue }}>←</button>
                                    {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => i + 1).map(page => (
                                        <button key={page}
                                            onClick={() => router.get(route('admin.buku-tamu.index'), { page, ...filters }, { preserveState: true })}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold"
                                            style={page === meta.current_page
                                                ? { background: C.blue, color: 'white' }
                                                : { background: '#f1f5f9', color: C.slate }}>
                                            {page}
                                        </button>
                                    ))}
                                    <button onClick={() => router.get(meta.next_page_url, {}, { preserveState: true })}
                                        disabled={!meta.next_page_url}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
                                        style={{ background: C.blueSoft, color: C.blue }}>→</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </AdminLayout>

            <DetailModal tamu={detail} onClose={() => setDetail(null)} onDelete={setDeleteSingle} />
            <DeleteSingleModal tamu={deleteSingle} onClose={() => setDeleteSingle(null)} />
            <DeleteRangeModal open={deleteRange} onClose={() => setDeleteRange(false)} />
        </>
    );
}