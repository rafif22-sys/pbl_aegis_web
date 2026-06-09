// resources/js/Pages/Admin/RiwayatSos.jsx

import { Head, router } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AdminLayout from "@/Layouts/AdminLayout";
import { formatWaktu } from "@/utils/dateHelpers";
import { getFotoUrl } from "@/utils/supabase";

// ─────────────────────────────────────────────────────────
// Konfigurasi jenis keadaan
// ─────────────────────────────────────────────────────────
const BLUE       = "#005EA4";
const BLUE_BG    = "#e0f2fe";
const BLUE_DARK  = "#0F2A44";

const JENIS_CONFIG = {
    kebakaran: {
        label: "Kebakaran",
        color: BLUE,
        bg: BLUE_BG,
        markerColor: "#ef4444",
        // Icon api untuk marker (path SVG flame)
        markerSvgPath: `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>`,
        svg: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
        ),
    },
    pencurian: {
        label: "Pencurian",
        color: BLUE,
        bg: BLUE_BG,
        markerColor: "#ef4444",
        // Icon gembok
        markerSvgPath: `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>`,
        svg: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
            </svg>
        ),
    },
    "bencana alam": {
        label: "Bencana Alam",
        color: BLUE,
        bg: BLUE_BG,
        markerColor: "#ef4444",
        // Awan besar + petir zigzag di bawah
        markerSvgPath: `<path d="M19 18a3.5 3.5 0 0 0 0-7h-1A7 7 0 1 0 5 17.9"/><polyline points="13 11 11 15 14 15 12 20"/>`,
        svg: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 18a3.5 3.5 0 0 0 0-7h-1A7 7 0 1 0 5 17.9"/>
                <polyline points="13 11 11 15 14 15 12 20"/>
            </svg>
        ),
    },
    "hewan liar": {
        label: "Hewan Liar",
        color: BLUE,
        bg: BLUE_BG,
        markerColor: "#ef4444",
        // Icon kaki hewan
        markerSvgPath: `<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>`,
        svg: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/>
                <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
            </svg>
        ),
    },
    lainnya: {
        label: "Lainnya",
        color: BLUE,
        bg: BLUE_BG,
        markerColor: "#ef4444",
        // Icon segitiga warning
        markerSvgPath: `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
        svg: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
        ),
    },
};

function getJenisCfg(jenis) {
    if (!jenis) return JENIS_CONFIG.lainnya;
    const key = jenis.toLowerCase();
    return JENIS_CONFIG[key] ?? JENIS_CONFIG.lainnya;
}

// ─────────────────────────────────────────────────────────
// Leaflet custom marker SVG per jenis — dengan icon jenis di dalam
// ─────────────────────────────────────────────────────────
function makeIcon(color, markerSvgPath) {
    // Lingkaran penuh seperti pada gambar referensi
    const size = 38;
    const r = 19;
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <defs>
                <filter id="sh" x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.32)"/>
                </filter>
            </defs>
            <circle cx="${r}" cy="${r}" r="${r - 1}" fill="${color}" filter="url(#sh)"/>
            <circle cx="${r}" cy="${r}" r="${r - 3}" fill="none" stroke="white" stroke-width="1.5" opacity="0.35"/>
            <g transform="translate(9, 9) scale(0.833)" stroke="white" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" fill="none">
                ${markerSvgPath}
            </g>
        </svg>`;
    return L.divIcon({
        html: `<div style="width:${size}px;height:${size}px">${svg}</div>`,
        className: "",
        iconSize: [size, size],
        iconAnchor: [r, r],
        popupAnchor: [0, -(r + 6)],
    });
}

// ─────────────────────────────────────────────────────────
// FlyTo helper
// ─────────────────────────────────────────────────────────
function MapController({ flyTarget }) {
    const map = useMap();
    useEffect(() => {
        if (flyTarget) {
            map.flyTo([flyTarget.lat, flyTarget.lng], 17, { duration: 1.2 });
        }
    }, [flyTarget]);
    return null;
}

// ─────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────
function UserAvatar({ user, size = 6 }) {
    const fotoUrl = user?.foto_url ?? getFotoUrl(user?.foto_profil);
    const initial = (user?.nama ?? "?")[0].toUpperCase();
    const cls = size === 9 ? "w-9 h-9 text-sm" : "w-6 h-6 text-[10px]";
    if (fotoUrl) {
        return (
            <img src={fotoUrl} alt={user?.nama ?? ""}
                className={`${cls} rounded-full object-cover shrink-0`}
                onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }} />
        );
    }
    return (
        <div className={`${cls} rounded-full flex items-center justify-center shrink-0 font-bold text-white`}
            style={{ background: "#005EA4" }}>
            {initial}
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Status Badge — hanya selesai & menunggu bantuan
// ─────────────────────────────────────────────────────────
const STATUS_CFG = {
    selesai:           { label: "Selesai",           bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
    "menunggu bantuan": { label: "Menunggu Bantuan", bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
};

function StatusBadge({ status }) {
    const c = STATUS_CFG[status] ?? { label: status ?? "-", bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" };
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: c.bg, color: c.color }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
            {c.label}
        </span>
    );
}

// ─────────────────────────────────────────────────────────
// Detail Modal
// ─────────────────────────────────────────────────────────
function DetailModal({ sos, onClose }) {
    if (!sos) return null;
    const cfg = getJenisCfg(sos.jenis_keadaan);
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: "rgba(15,42,68,0.55)", backdropFilter: "blur(3px)" }}
            onClick={onClose}>
            <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                style={{ background: "white" }}
                onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between"
                    style={{ background: "#0F2A44" }}>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.svg}
                        </div>
                        <h3 className="text-sm font-semibold text-white">Detail Laporan SOS</h3>
                    </div>
                    <button onClick={onClose} className="text-white opacity-50 hover:opacity-100 text-xl leading-none">×</button>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-4">

                    {/* Pelapor */}
                    <div className="flex items-center gap-3">
                        <UserAvatar user={sos.user} size={9} />
                        <div>
                            <p className="text-sm font-semibold" style={{ color: "#0F2A44" }}>{sos.user?.nama ?? "-"}</p>
                            <p className="text-xs" style={{ color: "#64748b" }}>{sos.bantuan_warga ? "Warga" : "Petugas"}</p>
                        </div>
                    </div>

                    <hr style={{ borderColor: "#e0f2fe" }} />

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: "Jenis Keadaan", value: (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
                                    style={{ background: cfg.bg, color: cfg.color }}>
                                    {cfg.svg} {cfg.label}
                                </span>
                            )},
                            { label: "Status",        value: <StatusBadge status={sos.status} /> },
                            { label: "Waktu Kirim",   value: formatWaktu(sos.waktu_kirim) },
                            { label: "Bantuan Warga", value: sos.bantuan_warga ? "Ya" : "Tidak" },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>{label}</p>
                                <p className="text-sm font-medium" style={{ color: "#0F2A44" }}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Lokasi */}
                    <div className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: "#f1f5f9" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#005EA4" strokeWidth="2">
                            <path d="M12 2C8.1 2 5 5.1 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.9-3.1-7-7-7z"/>
                            <circle cx="12" cy="9" r="2.5"/>
                        </svg>
                        <p className="text-xs" style={{ color: "#0F2A44" }}>
                            {sos.latitude != null ? `${Number(sos.latitude).toFixed(6)}, ${Number(sos.longitude).toFixed(6)}` : "Lokasi tidak tersedia"}
                        </p>
                    </div>

                    {/* Deskripsi */}
                    {sos.deskripsi && (
                        <div>
                            <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>Deskripsi</p>
                            <p className="text-sm rounded-xl px-3 py-2.5 leading-relaxed"
                                style={{ background: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0" }}>
                                {sos.deskripsi}
                            </p>
                        </div>
                    )}

                    {/* Penanganan */}
                    {(sos.konfirmator || sos.penanganan) && (
                        <>
                            <hr style={{ borderColor: "#e0f2fe" }} />
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>Penanganan</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {sos.konfirmator && (
                                        <div>
                                            <p className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>Dikonfirmasi Oleh</p>
                                            <p className="text-sm font-medium" style={{ color: "#0F2A44" }}>{sos.konfirmator.nama}</p>
                                        </div>
                                    )}
                                    {sos.waktu_konfirmasi && (
                                        <div>
                                            <p className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>Waktu Konfirmasi</p>
                                            <p className="text-sm font-medium" style={{ color: "#0F2A44" }}>{formatWaktu(sos.waktu_konfirmasi)}</p>
                                        </div>
                                    )}
                                </div>
                                {sos.penanganan && (
                                    <div className="mt-3">
                                        <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>Catatan Penanganan</p>
                                        <p className="text-sm rounded-xl px-3 py-2.5 leading-relaxed"
                                            style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
                                            {sos.penanganan}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Stat Card kecil untuk jenis keadaan
// ─────────────────────────────────────────────────────────
function JenisStatCard({ jenisCfg, value, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all flex-1"
            style={{
                background: isActive ? "#005EA4" : "white",
                border: `1.5px solid ${isActive ? "#005EA4" : "#e0f2fe"}`,
                color: isActive ? "white" : "#0F2A44",
            }}
        >
            <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                    background: isActive ? "rgba(255,255,255,0.18)" : "#e0f2fe",
                    color: isActive ? "white" : "#005EA4",
                }}
            >
                {jenisCfg.svg}
            </div>
            <div className="text-left min-w-0">
                <p className="text-base font-bold leading-none">{value}</p>
                <p className="text-[10px] mt-0.5 font-medium leading-tight truncate"
                    style={{ opacity: isActive ? 0.85 : undefined, color: isActive ? "white" : "#64748b" }}>
                    {jenisCfg.label}
                </p>
            </div>
        </button>
    );
}

// ─────────────────────────────────────────────────────────
// Peta SOS
// ─────────────────────────────────────────────────────────
function SosMap({ items, activeId, flyTarget, onMarkerClick }) {
    const defaultCenter = [-7.05, 110.437];
    const validItems = items.filter(s => s.latitude != null && s.longitude != null);

    return (
        <MapContainer
            center={defaultCenter} zoom={14}
            style={{ width: "100%", height: "100%" }}
            zoomControl={true}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
            />
            <MapController flyTarget={flyTarget} />
            {validItems.map((item) => {
                const cfg = getJenisCfg(item.jenis_keadaan);
                // Gunakan icon dengan SVG path jenis keadaan
                const icon = makeIcon(cfg.markerColor, cfg.markerSvgPath);
                return (
                    <Marker
                        key={item.id}
                        position={[item.latitude, item.longitude]}
                        icon={icon}
                        eventHandlers={{ click: () => onMarkerClick(item) }}
                    >
                        <Popup>
                            <div style={{ minWidth: 180 }}>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span style={{ color: cfg.color }}>{cfg.svg}</span>
                                    <strong style={{ fontSize: 12, color: "#0F2A44" }}>{cfg.label}</strong>
                                </div>
                                <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>
                                    {item.user?.nama ?? "-"}
                                </p>
                                <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>
                                    {formatWaktu(item.waktu_kirim)}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function RiwayatSos({ sos, auth, filters, summary }) {
    const [search,        setSearch]        = useState(filters?.search ?? "");
    const [statusFilter,  setStatusFilter]  = useState(filters?.status ?? "");
    const [jenisFilter,   setJenisFilter]   = useState(filters?.jenis  ?? "");
    const [detailSos,     setDetailSos]     = useState(null);
    const [activeRow,     setActiveRow]     = useState(null);
    const [flyTarget,     setFlyTarget]     = useState(null);
    const [deleteTarget,  setDeleteTarget]  = useState(null);   // single delete
    const [showRange,     setShowRange]     = useState(false);  // range delete modal
    const [rangeFrom,     setRangeFrom]     = useState("");
    const [rangeTo,       setRangeTo]       = useState("");
    const [deleting,      setDeleting]      = useState(false);
    const isFirstRender   = useRef(true);

    // Debounced filter → Inertia GET
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const t = setTimeout(() => {
            router.get(
                route("admin.sos.index"),
                { search, status: statusFilter, jenis: jenisFilter },
                { preserveState: true, replace: true }
            );
        }, 400);
        return () => clearTimeout(t);
    }, [search, statusFilter, jenisFilter]);

    const list = sos?.data ?? [];
    const meta = sos;

    // Klik baris tabel → fly peta
    const handleRowClick = (item) => {
        if (item.latitude == null || item.longitude == null) return;
        setActiveRow(item.id);
        setFlyTarget({ lat: item.latitude, lng: item.longitude, id: item.id });
    };

    // Klik marker peta → highlight baris
    const handleMarkerClick = (item) => {
        setActiveRow(item.id);
        setDetailSos(item);
    };

    // Summary fallback
    const S = summary ?? {};

    // Status hanya 2 pilihan
    const STATUS_OPTIONS = [
        { value: "",                   label: "Semua Status" },
        { value: "selesai",            label: "Selesai" },
        { value: "menunggu bantuan",   label: "Menunggu Bantuan" },
    ];

    const jenisCards = [
        { key: "kebakaran",     cfg: JENIS_CONFIG.kebakaran,      value: S.kebakaran    ?? 0 },
        { key: "pencurian",     cfg: JENIS_CONFIG.pencurian,      value: S.pencurian    ?? 0 },
        { key: "bencana alam",  cfg: JENIS_CONFIG["bencana alam"],value: S.bencana_alam ?? 0 },
        { key: "hewan liar",    cfg: JENIS_CONFIG["hewan liar"],  value: S.hewan_liar   ?? 0 },
        { key: "lainnya",       cfg: JENIS_CONFIG.lainnya,        value: S.lainnya      ?? 0 },
    ];

    // ── Delete single
    const handleDeleteOne = (item, e) => {
        e.stopPropagation();
        setDeleteTarget(item);
    };

    const confirmDeleteOne = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route("admin.sos.destroy", deleteTarget.id), {
            preserveState: true,
            onFinish: () => { setDeleting(false); setDeleteTarget(null); },
        });
    };

    // ── Delete by range
    const confirmDeleteRange = () => {
        if (!rangeFrom || !rangeTo) return;
        setDeleting(true);
        router.delete(route("admin.sos.destroy-range"), {
            data: { from: rangeFrom, to: rangeTo },
            preserveState: true,
            onFinish: () => { setDeleting(false); setShowRange(false); setRangeFrom(""); setRangeTo(""); },
        });
    };

    return (
        <>
            <Head title="Riwayat SOS" />
            <AdminLayout auth={auth} activeMenu="Riwayat SOS" title="Riwayat SOS">

                <div className="flex flex-col flex-1 min-h-0 gap-3">

                    {/* ── STAT CARDS ROW ── */}
                    <div className="grid grid-cols-5 gap-3 shrink-0">
                        {/* Total SOS + Dikonfirmasi */}
                        <div className="col-span-2 rounded-2xl shadow-sm grid grid-cols-2 overflow-hidden"
                            style={{ border: "1.5px solid #c7e8f8" }}>
                            {/* Total */}
                            <div className="flex items-center gap-3 px-4 py-3"
                                style={{ background: "#005EA4", color: "white" }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: "rgba(255,255,255,0.15)" }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold leading-none">{S.total ?? 0}</p>
                                    <p className="text-xs mt-0.5" style={{ opacity: 0.8 }}>Total Laporan SOS</p>
                                </div>
                            </div>
                            {/* Dikonfirmasi */}
                            <div className="flex items-center gap-3 px-4 py-3"
                                style={{ background: "#005EA4", color: "white", borderLeft: "1px solid rgba(255,255,255,0.15)" }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: "rgba(255,255,255,0.15)" }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold leading-none">{S.dikonfirmasi ?? 0}</p>
                                    <p className="text-xs mt-0.5" style={{ opacity: 0.8 }}>Dikonfirmasi</p>
                                </div>
                            </div>
                        </div>

                        {/* Per-jenis stat cards */}
                        <div className="col-span-3 rounded-2xl px-3 py-2.5 shadow-sm flex items-stretch gap-2"
                            style={{ background: "white", border: "1.5px solid #c7e8f8" }}>
                            <div className="flex items-center shrink-0 pr-2" style={{ borderRight: "1px solid #e0f2fe" }}>
                                <p className="text-xs font-semibold whitespace-nowrap" style={{ color: "#94a3b8" }}>Filter Jenis</p>
                            </div>
                            {jenisCards.map(({ key, cfg, value }) => (
                                <JenisStatCard
                                    key={key}
                                    jenisCfg={cfg}
                                    value={value}
                                    isActive={jenisFilter === key}
                                    onClick={() => setJenisFilter(jenisFilter === key ? "" : key)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ── MAP + TABLE ROW ── */}
                    <div className="flex gap-3 flex-1 min-h-0">

                        {/* Peta — lebih sempit */}
                        <div className="rounded-2xl overflow-hidden shadow-sm shrink-0"
                            style={{
                                border: "1.5px solid #c7e8f8",
                                width: "40%",   // ← sesuai lebar card biru col-span-2 dari grid-cols-5
                                minWidth: 0,
                                background: "#e5e7eb",
                                zIndex: 0,
                            }}>
                            <SosMap
                                items={list}
                                activeId={activeRow}
                                flyTarget={flyTarget}
                                onMarkerClick={handleMarkerClick}
                            />
                        </div>

                        {/* Panel tabel — lebih lebar otomatis */}
                        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden shadow-sm min-h-0 min-w-0"
                            style={{ background: "white", border: "1.5px solid #c7e8f8" }}>

                            {/* Toolbar */}
                            <div className="px-3 py-2.5 shrink-0 flex items-center gap-2 flex-wrap"
                                style={{ borderBottom: "1.5px solid #e0f2fe" }}>

                                {/* Icon + title */}
                                <div className="flex items-center gap-1.5 mr-1">
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ background: "#fee2e2" }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                        </svg>
                                    </div>
                                    <h2 className="font-semibold text-xs" style={{ color: "#0F2A44" }}>Daftar SOS</h2>
                                    <p className="text-[10px]" style={{ color: "#94a3b8" }}>Klik baris untuk fokus ke peta</p>
                                </div>

                                {/* Search */}
                                <div className="relative flex-1" style={{ minWidth: 120 }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                                    </svg>
                                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Cari..."
                                        className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg outline-none"
                                        style={{ background: "#f8fafc", border: "1px solid #c7e8f8", color: "#0F2A44" }} />
                                </div>

                                {/* Status filter — hanya 2 opsi */}
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                    className="text-xs rounded-lg px-2 py-1.5 outline-none shrink-0"
                                    style={{ background: "#f8fafc", border: "1px solid #c7e8f8", color: "#0F2A44" }}>
                                    {STATUS_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>

                                {/* Hapus range */}
                                <button
                                    onClick={() => setShowRange(true)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 hover:opacity-80 transition-opacity"
                                    style={{ background: "#fee2e2", color: "#dc2626" }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                    </svg>
                                    Hapus Range
                                </button>
                            </div>

                            {/* Table */}
                            <div className="flex-1 overflow-y-auto min-h-0"
                                style={{ scrollbarWidth: "thin", scrollbarColor: "#b8dff0 transparent" }}>
                                <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
                                    <colgroup>
                                        <col style={{ width: "24%" }} />
                                        <col style={{ width: "20%" }} />
                                        <col style={{ width: "20%" }} />
                                        <col style={{ width: "22%" }} />
                                        <col style={{ width: "14%" }} />
                                    </colgroup>
                                    <thead className="sticky top-0 z-10">
                                        <tr style={{ background: "#005EA4", color: "white" }}>
                                            {["Pelapor", "Jenis", "Waktu", "Status", "Aksi"].map((h, i) => (
                                                <th key={i} className="px-2.5 py-2.5 text-center font-semibold">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {list.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center" style={{ color: "#cbd5e1" }}>
                                                    <div className="flex flex-col items-center gap-2">
                                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                                        </svg>
                                                        <span className="text-xs">Tidak ada data</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            list.map((item, i) => {
                                                const jcfg = getJenisCfg(item.jenis_keadaan);
                                                const isActive = activeRow === item.id;
                                                return (
                                                    <tr key={item.id}
                                                        onClick={() => handleRowClick(item)}
                                                        className="cursor-pointer transition-colors"
                                                        style={{
                                                            background: isActive ? "#dbeeff" : i % 2 === 1 ? "#f8fbff" : "white",
                                                            borderLeft: isActive ? `3px solid #005EA4` : "3px solid transparent",
                                                            borderBottom: "1px solid #f0f9ff",
                                                        }}>

                                                        {/* Pelapor */}
                                                        <td className="px-2.5 py-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <UserAvatar user={item.user} size={6} />
                                                                <span className="font-medium truncate" style={{ color: "#0F2A44" }} title={item.user?.nama}>
                                                                    {item.user?.nama ?? "-"}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Jenis */}
                                                        <td className="px-2.5 py-2 text-center">
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md font-semibold text-[10px]"
                                                                style={{ background: jcfg.bg, color: jcfg.color }}>
                                                                {jcfg.label}
                                                            </span>
                                                        </td>

                                                        {/* Waktu */}
                                                        <td className="px-2.5 py-2 text-center" style={{ color: "#64748b" }}>
                                                            {formatWaktu(item.waktu_kirim)}
                                                        </td>

                                                        {/* Status */}
                                                        <td className="px-2.5 py-2 text-center">
                                                            <StatusBadge status={item.status} />
                                                        </td>

                                                        {/* Aksi */}
                                                        <td className="px-2 py-2 text-center">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setDetailSos(item); }}
                                                                    title="Lihat Detail"
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-md"
                                                                    style={{ background: "#f0fdf4", color: "#15803d" }}>
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                                        <circle cx="12" cy="12" r="3"/>
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDeleteOne(item, e)}
                                                                    title="Hapus"
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-md"
                                                                    style={{ background: "#fde8e8", color: "#c0392b" }}>
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                                                        <path d="M10 11v6"/><path d="M14 11v6"/>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {meta && meta.last_page > 1 && (
                                <div className="px-3 py-2 shrink-0 flex items-center justify-between"
                                    style={{ borderTop: "1.5px solid #e0f2fe" }}>
                                    <p className="text-[10px]" style={{ color: "#94a3b8" }}>
                                        {meta.from}–{meta.to} / {meta.total}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button disabled={!meta.prev_page_url}
                                            onClick={() => meta.prev_page_url && router.get(meta.prev_page_url, { search, status: statusFilter, jenis: jenisFilter }, { preserveState: true })}
                                            className="px-2 py-1 rounded text-[10px] disabled:opacity-40"
                                            style={{ background: "#e0f2fe", color: "#005EA4" }}>←</button>
                                        <span className="text-[10px] px-1" style={{ color: "#0F2A44" }}>
                                            {meta.current_page}/{meta.last_page}
                                        </span>
                                        <button disabled={!meta.next_page_url}
                                            onClick={() => meta.next_page_url && router.get(meta.next_page_url, { search, status: statusFilter, jenis: jenisFilter }, { preserveState: true })}
                                            className="px-2 py-1 rounded text-[10px] disabled:opacity-40"
                                            style={{ background: "#e0f2fe", color: "#005EA4" }}>→</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AdminLayout>

            {/* Detail Modal */}
            {detailSos && <DetailModal sos={detailSos} onClose={() => setDetailSos(null)} />}

            {/* ── Konfirmasi Hapus Satu ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ background: "rgba(15,42,68,0.55)", backdropFilter: "blur(3px)" }}
                    onClick={() => setDeleteTarget(null)}>
                    <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden bg-white"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="px-5 py-4 flex items-center gap-2" style={{ background: "#0F2A44" }}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#fee2e2" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-white">Hapus Laporan SOS</h3>
                        </div>
                        <div className="p-5">
                            <p className="text-sm" style={{ color: "#334155" }}>
                                Yakin ingin menghapus laporan SOS dari <strong>{deleteTarget.user?.nama ?? "-"}</strong>?
                                Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex gap-2 mt-4 justify-end">
                                <button onClick={() => setDeleteTarget(null)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                    style={{ background: "#f1f5f9", color: "#64748b" }}>
                                    Batal
                                </button>
                                <button onClick={confirmDeleteOne} disabled={deleting}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                                    style={{ background: "#dc2626", color: "white" }}>
                                    {deleting ? "Menghapus..." : "Ya, Hapus"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Hapus Range Tanggal ── */}
            {showRange && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ background: "rgba(15,42,68,0.55)", backdropFilter: "blur(3px)" }}
                    onClick={() => setShowRange(false)}>
                    <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden bg-white"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="px-5 py-4 flex items-center gap-2" style={{ background: "#0F2A44" }}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#fee2e2" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-white">Hapus Data Berdasarkan Tanggal</h3>
                        </div>
                        <div className="p-5 flex flex-col gap-3">
                            <p className="text-xs" style={{ color: "#64748b" }}>
                                Semua laporan SOS dalam rentang tanggal berikut akan dihapus permanen.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium block mb-1" style={{ color: "#0F2A44" }}>Dari Tanggal</label>
                                    <input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)}
                                        className="w-full text-xs rounded-lg px-2.5 py-1.5 outline-none"
                                        style={{ background: "#f8fafc", border: "1px solid #c7e8f8", color: "#0F2A44" }} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium block mb-1" style={{ color: "#0F2A44" }}>Sampai Tanggal</label>
                                    <input type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)}
                                        className="w-full text-xs rounded-lg px-2.5 py-1.5 outline-none"
                                        style={{ background: "#f8fafc", border: "1px solid #c7e8f8", color: "#0F2A44" }} />
                                </div>
                            </div>
                            <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
                                ⚠️ Tindakan ini permanen dan tidak dapat dibatalkan.
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setShowRange(false)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                    style={{ background: "#f1f5f9", color: "#64748b" }}>
                                    Batal
                                </button>
                                <button onClick={confirmDeleteRange} disabled={deleting || !rangeFrom || !rangeTo}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                                    style={{ background: "#dc2626", color: "white" }}>
                                    {deleting ? "Menghapus..." : "Hapus Data"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}