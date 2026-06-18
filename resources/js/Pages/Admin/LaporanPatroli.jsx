// resources/js/Pages/Admin/LaporanPatroli.jsx
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";

const C = {
    navy:    "#0F2A44",
    blue:    "#005EA4",
    skyBg:   "#e0f2fe",
    skyBdr:  "#c7e8f8",
    slate:   "#64748b",
    textMain:"#334155",
};

/* ── Konfigurasi kondisi (label, warna) ── */
const KONDISI_CONFIG = {
    "aman": {
        label: "Aman",
        bg: "#dcfce7", color: "#15803d", dot: "#22c55e",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
            </svg>
        ),
    },
    "kerusakan fasilitas": {
        label: "Kerusakan Fasilitas",
        short: "Rusak",
        bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        ),
    },
    "aktivitas mencurigakan": {
        label: "Aktivitas Mencurigakan",
        short: "Curiga",
        bg: "#fef9c3", color: "#a16207", dot: "#eab308",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a16207" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
    },
    "kebersihan": {
        label: "Kebersihan",
        short: "Bersih",
        bg: "#ede9fe", color: "#6d28d9", dot: "#8b5cf6",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
        ),
    },
};

/* ── Summary Cards ── */
function SummaryCards({ summary }) {
    return (
        <div className="grid grid-cols-5 gap-3 mb-4 shrink-0">
            <div
                className="rounded-2xl p-4 flex items-center gap-3 shadow-sm"
                style={{ background: C.blue, color: "white" }}
            >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,255,255,0.15)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                </div>
                <div>
                    <p className="text-[10px] font-semibold tracking-wide opacity-80">TOTAL PATROLI</p>
                    <p className="text-2xl font-bold leading-tight">{summary.total_patroli}</p>
                </div>
            </div>

            {Object.entries(KONDISI_CONFIG).map(([key, cfg]) => (
                <div
                    key={key}
                    className="rounded-2xl p-4 flex items-center gap-3 shadow-sm"
                    style={{ background: "white", border: `1.5px solid ${C.skyBdr}` }}
                >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: cfg.bg }}>
                        {cfg.icon}
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold tracking-wide" style={{ color: C.slate }}>
                            {cfg.label.toUpperCase()}
                        </p>
                        <p className="text-2xl font-bold leading-tight" style={{ color: C.navy }}>
                            {summary.kondisi[key] ?? 0}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Badge status absensi ── */
function StatusAbsensiBadge({ status }) {
    const map = {
        hadir:     { bg: "#dcfce7", color: "#15803d", label: "Hadir",     dot: "#22c55e" },
        terlambat: { bg: "#fef9c3", color: "#a16207", label: "Terlambat", dot: "#eab308" },
        alpha:     { bg: "#fee2e2", color: "#b91c1c", label: "Alpha",     dot: "#ef4444" },
        libur:     { bg: "#f1f5f9", color: "#475569", label: "Libur",     dot: "#94a3b8" },
        menunggu:  { bg: "#f1f5f9", color: "#475569", label: "Menunggu",  dot: "#94a3b8" },
    };
    const s = map[status?.toLowerCase()] ?? { bg: "#f1f5f9", color: "#64748b", label: status ?? "—", dot: "#94a3b8" };
    return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: s.bg, color: s.color }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block", flexShrink: 0 }} />
            {s.label}
        </span>
    );
}

/*
 * ── KondisiCountRow ──
 * layout="grid"  → dipakai di dialog detail, label panjang, grid 2 kolom
 * layout="col"   → dipakai di tabel, chip mini horizontal 2×2 agar tidak tumpuk
 */
function KondisiCountRow({ kondisiCount, layout = 'col' }) {
    // stroke + paths dipisah dari icon JSX agar bisa dipakai di SVG ukuran bebas
    const items = [
        { key: 'aman',                   ...KONDISI_CONFIG['aman'],                   short: 'Aman',   label: 'Aman',
          stroke: '#15803d', paths: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></> },
        { key: 'kebersihan',             ...KONDISI_CONFIG['kebersihan'],             short: 'Kbrshn', label: 'Kebersihan',
          stroke: '#6d28d9', paths: <><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></> },
        { key: 'aktivitas mencurigakan', ...KONDISI_CONFIG['aktivitas mencurigakan'], short: 'Curiga', label: 'Aktivitas Mencurigakan',
          stroke: '#a16207', paths: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></> },
        { key: 'kerusakan fasilitas',    ...KONDISI_CONFIG['kerusakan fasilitas'],    short: 'Rusak',  label: 'Kerusakan Fasilitas',
          stroke: '#b91c1c', paths: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/> },
    ];

    const aktif = items.filter(({ key }) => (kondisiCount?.[key] ?? 0) > 0);

    if (aktif.length === 0) return <span className="text-xs" style={{ color: C.slate }}>—</span>;

    /* Dialog detail: label panjang + icon kecil native, grid 2 kolom */
    if (layout === 'grid') {
        return (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {aktif.map(({ key, label, bg, color, stroke, paths }) => (
                    <span key={key}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: bg, color, lineHeight: 1 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
                            {paths}
                        </svg>
                        {label}: {kondisiCount[key]}
                    </span>
                ))}
            </div>
        );
    }

    /* Tabel: grid 2×2 chip kecil — icon native + singkatan + angka */
    return (
        <div className="grid grid-cols-2 gap-x-1 gap-y-1 justify-items-start mx-auto" style={{ width: 'fit-content' }}>
            {aktif.map(({ key, short, bg, color, stroke, paths }) => (
                <span key={key}
                    className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap"
                    style={{ background: bg, color, lineHeight: 1 }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
                        {paths}
                    </svg>
                    {short} {kondisiCount[key]}
                </span>
            ))}
        </div>
    );
}

/* ── Badge kondisi checkpoint ── */
function KondisiBadge({ kondisi }) {
    const cfg = KONDISI_CONFIG[kondisi?.toLowerCase()];
    return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: cfg?.bg ?? "#f1f5f9", color: cfg?.color ?? "#64748b" }}>
            {kondisi ?? "—"}
        </span>
    );
}

/* ── Dialog Detail ── */
function DetailDialog({ laporan, onClose }) {
    const [fotoZoom, setFotoZoom] = useState(null);

    if (!laporan) return null;
    const checkpoints = laporan.detail_checkpoint ?? [];

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{ background: "rgba(15,42,68,0.55)", backdropFilter: "blur(2px)" }}
                onClick={onClose}
            >
                <div
                    className="relative rounded-2xl shadow-2xl flex flex-col"
                    style={{ background: "white", width: "min(560px, 95vw)", maxHeight: "88vh", border: `1.5px solid ${C.skyBdr}` }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-5 py-4 rounded-t-2xl flex items-start justify-between shrink-0"
                        style={{ background: C.navy }}>
                        <div>
                            <p className="text-xs font-semibold tracking-widest" style={{ color: "#90c4e8" }}>DETAIL PATROLI</p>
                            <h2 className="text-base font-bold text-white mt-0.5">{laporan.nama_petugas}</h2>
                        </div>
                        <button onClick={onClose} className="text-white opacity-60 hover:opacity-100 transition-opacity mt-0.5">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Info ringkas */}
                    <div className="grid grid-cols-3 gap-3 px-5 py-3 shrink-0"
                        style={{ borderBottom: `1.5px solid ${C.skyBdr}` }}>
                        {[
                            { label: "Rute",   value: laporan.nama_rute },
                            { label: "Shift",  value: laporan.nama_shift },
                            { label: "Status", badge: <StatusAbsensiBadge status={laporan.status_absensi} /> },
                        ].map(({ label, value, badge }) => (
                            <div key={label}>
                                <p className="text-[10px] font-semibold tracking-wide mb-1" style={{ color: C.slate }}>{label.toUpperCase()}</p>
                                {badge ? badge : <p className="text-sm font-semibold" style={{ color: C.navy }}>{value || "—"}</p>}
                            </div>
                        ))}
                    </div>

                    {/* Kondisi summary */}
                    <div className="px-5 pt-3 pb-2 shrink-0 flex items-start gap-3 flex-wrap">
                        <div className="flex items-start gap-2 pt-0.5">
                            <span className="text-xs font-semibold mt-0.5" style={{ color: C.slate }}>Kondisi:</span>
                            <KondisiCountRow kondisiCount={laporan.kondisi_count} layout="grid" />
                        </div>
                        <span className="ml-auto text-xs mt-0.5" style={{ color: C.slate }}>
                            {laporan.jumlah_checkpoint} checkpoint dilaporkan
                        </span>
                    </div>

                    {/* Daftar checkpoint */}
                    <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0" style={{ scrollbarWidth: "thin" }}>
                        {checkpoints.length === 0 ? (
                            <div className="flex flex-col items-center py-10 gap-2">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                                    <path d="M12 2C8.1 2 5 5.1 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.9-3.1-7-7-7z" />
                                    <circle cx="12" cy="9" r="2.5" />
                                </svg>
                                <p className="text-xs text-gray-400">Belum ada laporan checkpoint.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5 mt-2">
                                {checkpoints.map((cp, idx) => {
                                    const cfg = KONDISI_CONFIG[cp.kondisi?.toLowerCase()];
                                    return (
                                        <div key={cp.id} className="rounded-xl p-3"
                                            style={{ border: `1.5px solid ${cfg?.bg ?? C.skyBdr}`, background: cfg ? cfg.bg + "55" : "#f8fbff" }}>

                                            {/* ── Header: nomor, nama, badge kondisi ── */}
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                                                    style={{ background: C.blue, color: "white" }}>{idx + 1}</span>
                                                <span className="text-xs font-semibold flex-1" style={{ color: C.navy }}>{cp.nama_checkpoint}</span>
                                                <KondisiBadge kondisi={cp.kondisi} />
                                            </div>

                                            {/* ── Waktu & catatan ── */}
                                            {cp.waktu_laporan && (
                                                <p className="text-[10px] ml-7 mb-1" style={{ color: C.slate }}>
                                                    🕐 {cp.waktu_laporan}
                                                </p>
                                            )}
                                            {cp.catatan && (
                                                <p className="text-xs ml-7 leading-relaxed" style={{ color: C.textMain }}>{cp.catatan}</p>
                                            )}

                                            {/* ── Foto bukti ── */}
                                            {cp.foto_bukti && (
                                                <div className="ml-7 mt-2 flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                                                    {(cp.foto_bukti.match(/foto_\d+\.[a-zA-Z]+$/) ? [1, 2, 3, 4, 5, 6] : [1]).map(num => {
                                                        const url = cp.foto_bukti.replace(/foto_\d+(\.[a-zA-Z]+)$/, `foto_${num}$1`);
                                                        return (
                                                            <div key={num} onClick={() => setFotoZoom(url)} className="block shrink-0 cursor-pointer">
                                                                <img
                                                                    src={url}
                                                                    alt={`Foto Bukti ${num}`}
                                                                    className="h-16 w-20 object-cover rounded-lg shadow-sm hover:opacity-80 transition-opacity"
                                                                    style={{ border: `1.5px solid ${C.skyBdr}` }}
                                                                    onError={(e) => e.target.style.display = 'none'}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* ── Status penanganan (hanya jika bukan aman) ── */}
                                            {cp.kondisi?.toLowerCase() !== 'aman' && (
                                                <div className="ml-7 mt-2.5 rounded-lg p-2.5"
                                                    style={{
                                                        background: cp.selesai ? "#f0fdf4" : "#fff7ed",
                                                        border: `1px solid ${cp.selesai ? "#bbf7d0" : "#fed7aa"}`,
                                                    }}>
                                                    {/* Status badge */}
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-[10px]">{cp.selesai ? "✅" : "⏳"}</span>
                                                        <span className="text-[10px] font-bold"
                                                            style={{ color: cp.selesai ? "#15803d" : "#c2410c" }}>
                                                            {cp.selesai ? "Penanganan Selesai" : "Belum Ditangani"}
                                                        </span>
                                                    </div>
                                                    {/* Isi penanganan */}
                                                    {cp.penanganan ? (
                                                        <div>
                                                            <p className="text-[10px] font-semibold mb-0.5"
                                                                style={{ color: "#64748b" }}>
                                                                Tindakan yang dilakukan:
                                                            </p>
                                                            <p className="text-[11px] leading-relaxed"
                                                                style={{ color: "#334155" }}>
                                                                {cp.penanganan}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[10px] italic"
                                                            style={{ color: cp.selesai ? "#86efac" : "#fdba74" }}>
                                                            {cp.selesai ? "Selesai tanpa catatan penanganan." : "Supervisor belum mencatat penanganan."}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Zoom foto overlay */}
            {fotoZoom && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.85)" }}
                    onClick={() => setFotoZoom(null)}
                >
                    <img
                        src={fotoZoom}
                        alt="Foto Zoom"
                        className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain"
                    />
                    <button
                        className="absolute top-4 right-4 flex items-center justify-center rounded-full"
                        style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)" }}
                        onClick={() => setFotoZoom(null)}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            )}
        </>
    );
}

/* ── Komponen utama ── */
export default function LaporanPatroli({ laporan, tanggal, semua, summary, auth }) {
    const [selectedLaporan, setSelectedLaporan] = useState(null);
    const [inputTanggal, setInputTanggal]       = useState(semua ? '' : (tanggal ?? ''));
    const [filterKondisi, setFilterKondisi]     = useState("");

    const handleTanggalChange = (e) => {
        const val = e.target.value;
        setInputTanggal(val);
        if (val) {
            router.get(route("admin.laporan-patroli.index"), { tanggal: val, semua: false }, { preserveState: true, preserveScroll: true });
        } else {
            router.get(route("admin.laporan-patroli.index"), { semua: true }, { preserveState: true, preserveScroll: true });
        }
    };

    const handleReset = () => {
        setInputTanggal('');
        setFilterKondisi("");
        router.get(route("admin.laporan-patroli.index"), { semua: true }, { preserveState: true, preserveScroll: true });
    };

    const laporanFiltered = filterKondisi
        ? laporan.filter(row => (row.kondisi_count?.[filterKondisi] ?? 0) > 0)
        : laporan;

    return (
        <>
            <Head title="Laporan Patroli" />
            <AdminLayout auth={auth} activeMenu="Laporan Patroli" title="Laporan Patroli">

                {/* ── Summary Cards ── */}
                <SummaryCards summary={summary} />

                {/* ── Tabel ── */}
                <div className="rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0"
                    style={{ background: "white", border: `1.5px solid ${C.skyBdr}` }}>

                    {/* Toolbar */}
                    <div className="px-5 py-3 shrink-0 flex items-center gap-3 flex-wrap"
                        style={{ borderBottom: `1.5px solid ${C.skyBdr}` }}>

                        <div className="flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            <h2 className="font-semibold text-sm shrink-0" style={{ color: C.navy }}>
                                {semua
                                    ? "Semua Data Patroli"
                                    : `Data Patroli — ${new Date(tanggal + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`
                                }
                            </h2>
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            <select
                                value={filterKondisi}
                                onChange={(e) => setFilterKondisi(e.target.value)}
                                className="text-xs rounded-xl px-3 py-2 outline-none"
                                style={{
                                    background: "#f8fafc",
                                    border: `1.5px solid ${C.skyBdr}`,
                                    color: filterKondisi ? C.navy : C.slate,
                                    minWidth: 150,
                                }}
                            >
                                <option value="">Semua Kondisi</option>
                                <option value="aman">Aman</option>
                                <option value="kebersihan">Kebersihan</option>
                                <option value="aktivitas mencurigakan">Aktivitas Mencurigakan</option>
                                <option value="kerusakan fasilitas">Kerusakan Fasilitas</option>
                            </select>

                            <input
                                type="date"
                                value={inputTanggal}
                                onChange={handleTanggalChange}
                                className="text-xs rounded-xl px-3 py-2 outline-none"
                                style={{
                                    background: "#f8fafc",
                                    border: `1.5px solid ${C.skyBdr}`,
                                    color: inputTanggal ? C.navy : C.slate,
                                }}
                            />

                            {(inputTanggal || filterKondisi) && (
                                <button
                                    onClick={handleReset}
                                    className="text-xs px-3 py-2 rounded-xl hover:opacity-70 font-semibold transition-opacity inline-flex items-center gap-1.5"
                                    style={{ background: "#fee2e2", color: "#dc2626", border: "1.5px solid #fca5a5" }}
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
                            <colgroup>
                                <col style={{ width: "4%"  }} />
                                <col style={{ width: "14%" }} />
                                <col style={{ width: "13%" }} />
                                <col style={{ width: "12%" }} />
                                <col style={{ width: "10%" }} />
                                <col style={{ width: "11%" }} />
                                <col style={{ width: "7%"  }} />
                                <col style={{ width: "18%" }} />
                                <col style={{ width: "11%" }} />
                            </colgroup>
                            <thead>
                                <tr style={{ background: C.blue, color: "white" }}>
                                    {["No", "Nama Petugas", "Nama Rute", "Hari/Tanggal", "Shift", "Status", "CP", "Kondisi", "Aksi"].map((h) => (
                                        <th key={h} className="px-3 py-3 text-center font-semibold text-xs tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {laporanFiltered.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                </svg>
                                                <p className="text-sm text-gray-400">
                                                    {filterKondisi
                                                        ? `Tidak ada patroli dengan kondisi "${KONDISI_CONFIG[filterKondisi]?.label}".`
                                                        : "Tidak ada laporan patroli."
                                                    }
                                                </p>
                                                {filterKondisi && (
                                                    <button
                                                        onClick={() => setFilterKondisi("")}
                                                        className="text-xs font-semibold hover:underline mt-1"
                                                        style={{ color: C.blue }}
                                                    >
                                                        Hapus filter
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    laporanFiltered.map((row, i) => (
                                        <tr key={row.id}
                                            style={{ background: i % 2 === 1 ? "#dbeeff" : "white", color: C.navy }}>
                                            <td className="px-3 py-3 text-center text-xs font-semibold" style={{ color: C.slate }}>{i + 1}</td>
                                            <td className="px-3 py-3 text-center font-medium text-xs">{row.nama_petugas}</td>
                                            <td className="px-3 py-3 text-center text-xs">{row.nama_rute}</td>
                                            <td className="px-3 py-3 text-center text-xs font-semibold" style={{ color: C.navy }}>
                                                {row.hari_tanggal ?? '—'}
                                            </td>
                                            <td className="px-3 py-3 text-center text-xs">{row.nama_shift}</td>
                                            <td className="px-3 py-3 text-center">
                                                <StatusAbsensiBadge status={row.status_absensi} />
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                                                    style={{ background: C.skyBg, color: C.blue }}>
                                                    {row.jumlah_checkpoint}
                                                </span>
                                            </td>
                                            <td className="px-2 py-3 text-center">
                                                <KondisiCountRow kondisiCount={row.kondisi_count} />
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <button
                                                    onClick={() => setSelectedLaporan(row)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
                                                    style={{ background: C.skyBg, color: C.blue }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                    Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </AdminLayout>

            {selectedLaporan && (
                <DetailDialog laporan={selectedLaporan} onClose={() => setSelectedLaporan(null)} />
            )}
        </>
    );
}