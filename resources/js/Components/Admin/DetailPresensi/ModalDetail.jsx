import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarCheck,
    faXmark,
    faMapMarkerAlt,
    faBusinessTime,
    faSignInAlt,
    faSignOutAlt,
    faCamera,
} from "@fortawesome/free-solid-svg-icons";

function StatusBadge({ status }) {
    const map = {
        hadir:     { label: "Hadir",     bg: "#dcfce7", color: "#16a34a" },
        terlambat: { label: "Terlambat", bg: "#fef3c7", color: "#d97706" },
        alpha:     { label: "Alpha",     bg: "#fee2e2", color: "#dc2626" },
        libur:     { label: "Libur",     bg: "#cffafe", color: "#0891b2" },
        menunggu:  { label: "Menunggu",  bg: "#f1f5f9", color: "#64748b" },
    };
    const s = map[status] ?? map.menunggu;
    return (
        <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: s.bg, color: s.color }}
        >
            {s.label}
        </span>
    );
}

function InfoRow({ icon, label, value, valueColor }) {
    return (
        <div className="flex items-start gap-3">
            <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "#e0f2fe" }}
            >
                <FontAwesomeIcon icon={icon} style={{ fontSize: 11, color: "#005EA4" }} />
            </div>
            <div>
                <p className="text-[10px] uppercase font-semibold tracking-wide" style={{ color: "#94a3b8" }}>
                    {label}
                </p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: valueColor ?? "#0F2A44" }}>
                    {value ?? "—"}
                </p>
            </div>
        </div>
    );
}

export default function ModalDetailPresensi({ data, loading, onClose }) {
    const [fotoZoom, setFotoZoom] = useState(null);

    const statusColorMap = {
        hadir:     "#16a34a",
        terlambat: "#d97706",
        alpha:     "#dc2626",
        libur:     "#0891b2",
        menunggu:  "#64748b",
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 flex items-center justify-center p-4"
                style={{ background: "rgba(15,42,68,0.55)", backdropFilter: "blur(2px)" }}
                onClick={onClose}
            >
                {/* Modal card */}
                <div
                    className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                    style={{
                        background: "white",
                        maxHeight: "95vh",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header — matched to UserModals ModalHeader */}
                    <div
                        className="px-6 py-4 flex items-center justify-between shrink-0"
                        style={{ background: "#0F2A44" }}
                    >
                        <div className="flex items-center gap-2">
                            <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ background: "rgba(59,158,222,0.2)" }}
                            >
                                <FontAwesomeIcon icon={faCalendarCheck} style={{ fontSize: 12, color: "#7dd3fc" }} />
                            </div>
                            <h3 className="text-sm font-semibold text-white">Detail Presensi</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10"
                        >
                            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14, color: "#90c4e8" }} />
                        </button>
                    </div>

                    {/* Body */}
                    <div
                        className="px-5 py-4 flex flex-col gap-4 flex-1 overflow-y-auto"
                        style={{ scrollbarWidth: "thin", scrollbarColor: "#b8dff0 transparent" }}
                    >
                        {/* Loading state */}
                        {loading && (
                            <div className="flex items-center justify-center py-16">
                                <div className="flex flex-col items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-full border-2 animate-spin"
                                        style={{ borderColor: "#c7e8f8", borderTopColor: "#005EA4" }}
                                    />
                                    <p className="text-xs" style={{ color: "#94a3b8" }}>Memuat data...</p>
                                </div>
                            </div>
                        )}

                        {/* Konten */}
                        {!loading && data && (
                            <>
                                {/* Hari & Status */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-base" style={{ color: "#0F2A44" }}>
                                            {data.hari}, {data.tanggal}
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                                            {data.nama_shift}
                                        </p>
                                    </div>
                                    <StatusBadge status={data.status} />
                                </div>

                                <div className="w-full h-[1px]" style={{ background: "#e0f2fe" }} />

                                {/* Info grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoRow
                                        icon={faMapMarkerAlt}
                                        label="Pos Jaga"
                                        value={data.pos_jaga}
                                    />
                                    <InfoRow
                                        icon={faBusinessTime}
                                        label="Jam Shift"
                                        value={data.jam_shift}
                                    />
                                    <InfoRow
                                        icon={faSignInAlt}
                                        label="Jam Masuk"
                                        value={data.jam_masuk}
                                        valueColor={
                                            data.jam_masuk
                                                ? (statusColorMap[data.status] ?? "#0F2A44")
                                                : "#94a3b8"
                                        }
                                    />
                                    <InfoRow
                                        icon={faSignOutAlt}
                                        label="Jam Pulang"
                                        value={data.jam_pulang}
                                        valueColor={data.jam_pulang ? "#0F2A44" : "#94a3b8"}
                                    />
                                </div>

                                <div className="w-full h-[1px]" style={{ background: "#e0f2fe" }} />

                                {/* Foto dokumentasi */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div
                                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                                            style={{ background: "#e0f2fe" }}
                                        >
                                            <FontAwesomeIcon icon={faCamera} style={{ fontSize: 11, color: "#005EA4" }} />
                                        </div>
                                        <p className="font-semibold text-sm" style={{ color: "#0F2A44" }}>
                                            Dokumentasi
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Foto Masuk */}
                                        <div>
                                            <p className="text-[10px] uppercase font-semibold mb-1.5" style={{ color: "#94a3b8" }}>
                                                Foto Masuk
                                            </p>
                                            {data.foto_masuk ? (
                                                <img
                                                    src={data.foto_masuk}
                                                    alt="Foto Masuk"
                                                    className="w-full rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                    style={{ height: 220, border: "1.5px solid #c7e8f8" }}
                                                    onClick={() => setFotoZoom("masuk")}
                                                />
                                            ) : (
                                                <div
                                                    className="w-full rounded-xl flex flex-col items-center justify-center gap-1"
                                                    style={{ height: 220, background: "#f8fafc", border: "1.5px dashed #cbd5e1" }}
                                                >
                                                    <FontAwesomeIcon icon={faCamera} style={{ fontSize: 22, color: "#cbd5e1" }} />
                                                    <p className="text-[10px]" style={{ color: "#94a3b8" }}>Tidak ada foto</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Foto Pulang */}
                                        <div>
                                            <p className="text-[10px] uppercase font-semibold mb-1.5" style={{ color: "#94a3b8" }}>
                                                Foto Pulang
                                            </p>
                                            {data.foto_pulang ? (
                                                <img
                                                    src={data.foto_pulang}
                                                    alt="Foto Pulang"
                                                    className="w-full rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                    style={{ height: 220, border: "1.5px solid #c7e8f8" }}
                                                    onClick={() => setFotoZoom("pulang")}
                                                />
                                            ) : (
                                                <div
                                                    className="w-full rounded-xl flex flex-col items-center justify-center gap-1"
                                                    style={{ height: 220, background: "#f8fafc", border: "1.5px dashed #cbd5e1" }}
                                                >
                                                    <FontAwesomeIcon icon={faCamera} style={{ fontSize: 22, color: "#cbd5e1" }} />
                                                    <p className="text-[10px]" style={{ color: "#94a3b8" }}>Tidak ada foto</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[10px] mt-2 text-center" style={{ color: "#94a3b8" }}>
                                        Klik foto untuk memperbesar
                                    </p>
                                </div>

                                <div className="h-1" />
                            </>
                        )}
                    </div>

                    {/* Footer — matched to UserModals DetailModal footer */}
                    <div
                        className="px-5 py-4 shrink-0"
                        style={{ borderTop: "1.5px solid #e0f2fe" }}
                    >
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-all"
                            style={{ background: "#f1f5f9", color: "#64748b", border: "1.5px solid #e2e8f0" }}
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>

            {/* Zoom foto overlay */}
            {fotoZoom && data && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.85)" }}
                    onClick={() => setFotoZoom(null)}
                >
                    <img
                        src={fotoZoom === "masuk" ? data.foto_masuk : data.foto_pulang}
                        alt="Foto Zoom"
                        className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain"
                    />
                    <button
                        className="absolute top-4 right-4 flex items-center justify-center rounded-full"
                        style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)" }}
                        onClick={() => setFotoZoom(null)}
                    >
                        <FontAwesomeIcon icon={faXmark} style={{ color: "white", fontSize: 16 }} />
                    </button>
                </div>
            )}
        </>
    );
}