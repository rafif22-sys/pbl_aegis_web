// resources/js/Pages/Admin/RekapPresensi.jsx
import { Head, router } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarCheck,
    faUserCheck,
    faUserXmark,
    faClock,
    faMagnifyingGlass,
    faChevronLeft,
    faChevronRight,
    faEye,
    faFilter,
    faFilePdf,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import AdminLayout from "@/Layouts/AdminLayout";
import { StatCard } from "@/Components/Admin/StatCard";
import { AvatarInitial } from "@/Components/Admin/AvatarInitial";
import { getFotoUrl } from "@/utils/supabase";
import { generateRekapPDF } from "@/utils/generateRekapPDF";

// ── Komponen Badge status kecil ──────────────────────────────────────────────
function StatusPill({ value, label, color, bg }) {
    return (
        <div
            className="flex flex-col items-center justify-center rounded-xl px-3 py-1.5 min-w-[52px]"
            style={{ background: bg }}
        >
            <span className="text-base font-bold leading-tight" style={{ color }}>
                {value}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color }}>
                {label}
            </span>
        </div>
    );
}

// ── Komponen baris tabel ─────────────────────────────────────────────────────
function RekapRow({ rekap, index, onDetail }) {
    const [hover, setHover] = useState(false);

    const targetJadwal = Math.max(0, rekap.total_jadwal - (rekap.jumlah_libur || 0));
    const kehadiranPct =
        targetJadwal > 0
            ? Math.round((rekap.jumlah_hadir / targetJadwal) * 100)
            : 0;

    const barColor =
        kehadiranPct >= 80
            ? "#22c55e"
            : kehadiranPct >= 60
            ? "#f59e0b"
            : "#ef4444";

    return (
        <tr
            style={{
                background: hover
                    ? "#dbeeff"
                    : index % 2 === 1
                    ? "#f0f9ff"
                    : "white",
                borderBottom: "1px solid #e0f2fe",
                transition: "background 0.15s",
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {/* Nama */}
            <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                    <AvatarInitial
                        nama={rekap.nama}
                        fotoUrl={getFotoUrl(rekap.foto_profil)}
                    />
                    <div className="min-w-0">
                        <p className="font-semibold text-xs truncate" style={{ color: "#0F2A44" }}>
                            {rekap.nama}
                        </p>
                        <p className="text-[10px] truncate" style={{ color: "#94a3b8" }}>
                            {rekap.email ?? "—"}
                        </p>
                    </div>
                </div>
            </td>

            {/* Supervisor */}
            <td className="px-3 py-3 text-center">
                {rekap.supervisor ? (
                    <span
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: "#fef9c3", color: "#a16207" }}
                    >
                        {rekap.supervisor}
                    </span>
                ) : (
                    <span style={{ color: "#cbd5e1" }}>—</span>
                )}
            </td>

            {/* Kehadiran + progress bar */}
            <td className="px-3 py-3">
                <div className="flex flex-col gap-1 items-center">
                    <span className="text-sm font-bold" style={{ color: "#0F2A44" }}>
                        {rekap.jumlah_hadir}
                        <span className="text-[10px] font-normal ml-0.5" style={{ color: "#94a3b8" }}>
                            / {targetJadwal}
                        </span>
                    </span>
                    <div
                        className="w-full rounded-full overflow-hidden"
                        style={{ height: 5, background: "#e2e8f0", minWidth: 60 }}
                    >
                        <div
                            style={{
                                width: `${kehadiranPct}%`,
                                height: "100%",
                                background: barColor,
                                borderRadius: 99,
                                transition: "width 0.4s ease",
                            }}
                        />
                    </div>
                    <span className="text-[10px]" style={{ color: barColor }}>
                        {kehadiranPct}%
                    </span>
                </div>
            </td>

            {/* Libur */}
            <td className="px-3 py-3 text-center">
                <StatusPill value={rekap.jumlah_libur || 0} label="Libur"     color="#0891b2" bg="#cffafe" />
            </td>

            {/* Alpha */}
            <td className="px-3 py-3 text-center">
                <StatusPill value={rekap.jumlah_alpha}      label="Alpha"     color="#dc2626" bg="#fee2e2" />
            </td>

            {/* Terlambat */}
            <td className="px-3 py-3 text-center">
                <StatusPill value={rekap.jumlah_terlambat}  label="Terlambat" color="#d97706" bg="#fef3c7" />
            </td>

            {/* Aksi */}
            <td className="px-3 py-3 text-center">
                <button
                    onClick={() => onDetail(rekap)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
                    style={{ background: "#e0f2fe", color: "#005EA4" }}
                >
                    <FontAwesomeIcon icon={faEye} style={{ fontSize: 11 }} />
                    Detail
                </button>
            </td>
        </tr>
    );
}

// ── Halaman utama ─────────────────────────────────────────────────────────────
export default function RekapPresensi({
    auth,
    rekap,
    stats,
    supervisors,
    filters,
}) {
    const [search,       setSearch]       = useState(filters?.search        ?? "");
    const [supervisorId, setSupervisorId] = useState(filters?.supervisor_id ?? "");
    const [bulan,        setBulan]        = useState(filters?.bulan         ?? new Date().getMonth() + 1);
    const [tahun,        setTahun]        = useState(filters?.tahun         ?? new Date().getFullYear());
    const [pdfLoading,   setPdfLoading]   = useState(false);

    const isFirstRender = useRef(true);
    const skipEffect    = useRef(false);

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        if (skipEffect.current)    { skipEffect.current = false;    return; }
        const timer = setTimeout(() => {
            router.get(
                route("admin.rekap-presensi.index"),
                { search, supervisor_id: supervisorId, bulan, tahun },
                { preserveState: true, replace: true }
            );
        }, 400);
        return () => clearTimeout(timer);
    }, [search, supervisorId, bulan, tahun]);

    const handleDetail = (petugas) => {
        router.visit(route("admin.rekap-presensi.detail", { id: petugas.id, bulan, tahun }));
    };

    // ── Generate PDF ──────────────────────────────────────────────────────────
    const handleGeneratePDF = async () => {
        setPdfLoading(true);
        try {
            // Ambil semua data (tanpa pagination) dari server
            const res = await fetch(
                route("admin.rekap-presensi.export") +
                `?bulan=${bulan}&tahun=${tahun}` +
                (supervisorId ? `&supervisor_id=${supervisorId}` : "") +
                (search       ? `&search=${encodeURIComponent(search)}` : ""),
                { headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" } }
            );
            const json = await res.json();

            const supervisorLabel = supervisors?.find(s => String(s.id) === String(supervisorId))?.nama ?? null;

            generateRekapPDF({
                data:       json.data,
                stats:      json.stats,
                bulan,
                tahun,
                supervisor: supervisorLabel,
            });
        } catch (e) {
            console.error("PDF error:", e);
            alert("Gagal membuat PDF. Coba lagi.");
        } finally {
            setPdfLoading(false);
        }
    };

    const BULAN_LABEL = [
        "Januari","Februari","Maret","April","Mei","Juni",
        "Juli","Agustus","September","Oktober","November","Desember",
    ];

    const statCards = [
        {
            label: "Total Petugas",
            value: stats?.total_petugas ?? 0,
            blue: true,
            icon: <FontAwesomeIcon icon={faUserCheck}    style={{ fontSize: 26, color: "white"    }} />,
            accent: "#fbbf24",
        },
        {
            label: "Rata-rata Kehadiran",
            value: `${stats?.rata_hadir ?? 0}%`,
            blue: false,
            icon: <FontAwesomeIcon icon={faCalendarCheck} style={{ fontSize: 26, color: "#005EA4" }} />,
            accent: "#005EA4",
        },
        {
            label: "Total Alpha",
            value: stats?.total_alpha ?? 0,
            blue: true,
            icon: <FontAwesomeIcon icon={faUserXmark}    style={{ fontSize: 26, color: "white"    }} />,
            accent: "#ef4444",
        },
        {
            label: "Total Terlambat",
            value: stats?.total_terlambat ?? 0,
            blue: false,
            icon: <FontAwesomeIcon icon={faClock}        style={{ fontSize: 26, color: "#005EA4" }} />,
            accent: "#f59e0b",
        },
    ];

    return (
        <>
            <Head title="Rekap Presensi" />
            <AdminLayout auth={auth} activeMenu="Rekap Presensi" title="Rekap Presensi">
                <div className="flex flex-col gap-3 flex-1 min-h-0">

                    {/* Stat Cards */}
                    <div className="grid grid-cols-4 gap-4 shrink-0">
                        {statCards.map((c) => <StatCard key={c.label} {...c} />)}
                    </div>

                    {/* Tabel Card */}
                    <div
                        className="flex-1 rounded-2xl overflow-hidden flex flex-col min-h-0 shadow-sm"
                        style={{ background: "white", border: "1.5px solid #c7e8f8" }}
                    >
                        {/* Toolbar */}
                        <div
                            className="px-5 py-3 shrink-0 flex items-center gap-3 flex-wrap"
                            style={{ borderBottom: "1.5px solid #e0f2fe" }}
                        >
                            {/* Judul */}
                            <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faCalendarCheck} style={{ fontSize: 13, color: "#005EA4" }} />
                                <h2 className="font-semibold text-sm" style={{ color: "#0F2A44" }}>
                                    Rekap Kehadiran Petugas
                                </h2>
                            </div>

                            {/* Search */}
                            <div className="relative min-w-[180px] max-w-xs">
                                <FontAwesomeIcon
                                    icon={faMagnifyingGlass}
                                    style={{ fontSize: 11, color: "#94a3b8", position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
                                />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama petugas..."
                                    className="w-full text-xs rounded-xl pl-8 pr-3 py-2 outline-none"
                                    style={{ background: "#f8fafc", border: "1.5px solid #c7e8f8", color: "#0F2A44" }}
                                    onFocus={(e) => (e.target.style.borderColor = "#005EA4")}
                                    onBlur={(e)  => (e.target.style.borderColor = "#c7e8f8")}
                                />
                            </div>

                            {/* Filter Supervisor */}
                            <div className="flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faFilter} style={{ fontSize: 10, color: "#94a3b8" }} />
                                <select
                                    value={supervisorId}
                                    onChange={(e) => setSupervisorId(e.target.value)}
                                    className="text-xs rounded-xl px-3 py-2 outline-none"
                                    style={{
                                        background: "#f8fafc",
                                        border: "1.5px solid #c7e8f8",
                                        color: supervisorId ? "#0F2A44" : "#94a3b8",
                                        minWidth: 140,
                                    }}
                                >
                                    <option value="">Semua Supervisor</option>
                                    {(supervisors ?? []).map((sv) => (
                                        <option key={sv.id} value={sv.id}>{sv.nama}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filter Bulan + Tahun */}
                            <div className="flex items-center gap-2">
                                <select
                                    value={bulan}
                                    onChange={(e) => setBulan(Number(e.target.value))}
                                    className="text-xs rounded-xl px-3 py-2 outline-none"
                                    style={{ background: "#f8fafc", border: "1.5px solid #c7e8f8", color: "#0F2A44", minWidth: 110 }}
                                >
                                    {BULAN_LABEL.map((b, i) => (
                                        <option key={i + 1} value={i + 1}>{b}</option>
                                    ))}
                                </select>
                                <select
                                    value={tahun}
                                    onChange={(e) => setTahun(Number(e.target.value))}
                                    className="text-xs rounded-xl px-3 py-2 outline-none"
                                    style={{ background: "#f8fafc", border: "1.5px solid #c7e8f8", color: "#0F2A44", minWidth: 80 }}
                                >
                                    {[2024, 2025, 2026].map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Tombol Generate PDF */}
                            <button
                                onClick={handleGeneratePDF}
                                disabled={pdfLoading}
                                className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                                style={{ background: "#dc2626", color: "white" }}
                            >
                                <FontAwesomeIcon
                                    icon={pdfLoading ? faSpinner : faFilePdf}
                                    style={{ fontSize: 12 }}
                                    className={pdfLoading ? "animate-spin" : ""}
                                />
                                {pdfLoading ? "Membuat PDF..." : "Export PDF"}
                            </button>
                        </div>

                        {/* Table */}
                        <div
                            className="flex-1 overflow-y-auto"
                            style={{ scrollbarWidth: "thin", scrollbarColor: "#b8dff0 transparent" }}
                        >
                            <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
                                <colgroup>
                                    <col style={{ width: "16%" }} />
                                    <col style={{ width: "15%" }} />
                                    <col style={{ width: "23%" }} />
                                    <col style={{ width: "11%" }} />
                                    <col style={{ width: "11%" }} />
                                    <col style={{ width: "12%" }} />
                                    <col style={{ width: "12%" }} />
                                </colgroup>
                                <thead className="sticky top-0 z-10">
                                    <tr style={{ background: "#005EA4", color: "white" }}>
                                        {[
                                            { label: "Nama Petugas", align: "left",   cls: "px-5" },
                                            { label: "Supervisor",   align: "center", cls: "px-3" },
                                            { label: "Kehadiran",    align: "center", cls: "px-3" },
                                            { label: "Libur",        align: "center", cls: "px-3" },
                                            { label: "Alpha",        align: "center", cls: "px-3" },
                                            { label: "Terlambat",    align: "center", cls: "px-3" },
                                            { label: "Aksi",         align: "center", cls: "px-3" },
                                        ].map((h) => (
                                            <th key={h.label} className={`${h.cls} py-3 font-semibold text-xs text-${h.align}`}>
                                                {h.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {!rekap?.data || rekap.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-14 text-center text-xs" style={{ color: "#94a3b8" }}>
                                                <div className="flex flex-col items-center gap-2">
                                                    <FontAwesomeIcon icon={faCalendarCheck} style={{ fontSize: 28, color: "#c7e8f8" }} />
                                                    Tidak ada data presensi untuk periode ini
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        rekap.data.map((row, i) => (
                                            <RekapRow key={row.id} rekap={row} index={i} onDetail={handleDetail} />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {rekap?.last_page > 1 && (
                            <div
                                className="px-5 py-3 shrink-0 flex items-center justify-between"
                                style={{ borderTop: "1.5px solid #e0f2fe" }}
                            >
                                <span className="text-xs" style={{ color: "#64748b" }}>
                                    Halaman{" "}
                                    <span className="font-semibold" style={{ color: "#0F2A44" }}>{rekap.current_page}</span>
                                    {" "}dari{" "}
                                    <span className="font-semibold" style={{ color: "#0F2A44" }}>{rekap.last_page}</span>
                                    <span className="ml-2" style={{ color: "#94a3b8" }}>({rekap.total} petugas)</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => router.get(rekap.prev_page_url, {}, { preserveState: true })}
                                        disabled={!rekap.prev_page_url}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
                                        style={{ background: "#e0f2fe", color: "#005EA4" }}
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 10 }} />
                                    </button>
                                    {Array.from({ length: Math.min(rekap.last_page, 5) }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => router.get(route("admin.rekap-presensi.index"), { page }, { preserveState: true })}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold"
                                            style={page === rekap.current_page
                                                ? { background: "#005EA4", color: "white" }
                                                : { background: "#f1f5f9", color: "#64748b" }}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => router.get(rekap.next_page_url, {}, { preserveState: true })}
                                        disabled={!rekap.next_page_url}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
                                        style={{ background: "#e0f2fe", color: "#005EA4" }}
                                    >
                                        <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 10 }} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </AdminLayout>
        </>
    );
}