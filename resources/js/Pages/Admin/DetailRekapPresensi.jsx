import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft, faCalendarCheck, faUserCheck, faUserXmark,
    faClock, faUmbrellaBeach, faEye, faPhone, faVenusMars,
    faLocationDot, faUserTie, faFilterCircleXmark, faFilter,
} from "@fortawesome/free-solid-svg-icons";

import AdminLayout from "@/Layouts/AdminLayout";
import { AvatarInitial } from "@/Components/Admin/AvatarInitial";
import { getFotoUrl } from "@/utils/supabase";
import ModalDetailPresensi from "@/Components/Admin/DetailPresensi/ModalDetail";

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
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: s.bg, color: s.color }}>
            {s.label}
        </span>
    );
}

function PatroliBadge({ status }) {
    const sudah = status === "sudah";
    return (
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: sudah ? "#ede9fe" : "#fff7ed", color: sudah ? "#7c3aed" : "#ea580c" }}>
            {sudah ? "Sudah" : "Belum"}
        </span>
    );
}

const STATUS_OPTIONS = [
    { value: "",          label: "Semua",     bg: "#f1f5f9", color: "#64748b" },
    { value: "hadir",     label: "Hadir",     bg: "#dcfce7", color: "#16a34a" },
    { value: "terlambat", label: "Terlambat", bg: "#fef3c7", color: "#d97706" },
    { value: "alpha",     label: "Alpha",     bg: "#fee2e2", color: "#dc2626" },
    { value: "libur",     label: "Libur",     bg: "#cffafe", color: "#0891b2" },
    { value: "menunggu",  label: "Menunggu",  bg: "#f1f5f9", color: "#64748b" },
];

export default function DetailRekapPresensi({ auth, petugas, absensi, stats, filters }) {
    const BULAN_LABEL = [
        "Januari","Februari","Maret","April","Mei","Juni",
        "Juli","Agustus","September","Oktober","November","Desember",
    ];

    const [modalData,    setModalData]    = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const handleLihatDetail = async (absensiId) => {
        setModalLoading(true);
        setModalData(null);
        try {
            const res = await fetch(
                route("admin.rekap-presensi.detail.absensi", { id: petugas.id, absensi: absensiId }),
                { headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" } }
            );
            const json = await res.json();
            if (json.status) setModalData(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setModalLoading(false);
        }
    };

    const applyFilter = (extra = {}) => {
        router.visit(route("admin.rekap-presensi.detail", { id: petugas.id }), {
            data: {
                bulan:  filters.bulan,
                tahun:  filters.tahun,
                ...(filters.tanggal ? { tanggal: filters.tanggal } : {}),
                ...(filters.status  ? { status:  filters.status  } : {}),
                ...extra,
            },
            preserveState: false,
            preserveScroll: true,
        });
    };

    const handleTanggalChange = (e) => {
        const val = e.target.value;
        applyFilter(val ? { tanggal: val } : { tanggal: undefined });
    };

    const handleStatusChange = (val) => {
        applyFilter(val ? { status: val } : { status: undefined });
    };

    const handleReset = () => {
        router.visit(route("admin.rekap-presensi.detail", { id: petugas.id }), {
            data: { bulan: filters.bulan, tahun: filters.tahun },
            preserveState: false,
            preserveScroll: true,
        });
    };

    const hasFilter = filters?.tanggal || filters?.status;

    const maxHari  = new Date(filters?.tahun, filters?.bulan, 0).getDate();
    const bulanStr = String(filters?.bulan).padStart(2, "0");
    const minDate  = `${filters?.tahun}-${bulanStr}-01`;
    const maxDate  = `${filters?.tahun}-${bulanStr}-${String(maxHari).padStart(2, "0")}`;

    return (
        <>
            <Head title={`Detail Presensi - ${petugas?.nama ?? ""}`} />
            <AdminLayout auth={auth} activeMenu="Rekap Presensi" title="Detail Rekap Presensi">
                <div className="flex flex-col gap-3 flex-1 min-h-0">

                    {/* Header / back */}
                    <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => router.visit(route("admin.rekap-presensi.index"))}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity"
                            style={{ background: "#e0f2fe", color: "#005EA4" }}>
                            <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 11 }} />
                            Kembali
                        </button>
                        <span className="text-xs" style={{ color: "#64748b" }}>
                            Periode:{" "}
                            <span className="font-semibold" style={{ color: "#0F2A44" }}>
                                {BULAN_LABEL[(filters?.bulan ?? 1) - 1]} {filters?.tahun}
                            </span>
                        </span>
                    </div>

                    {/* Profil Petugas & Statistik */}
                    <div className="rounded-2xl shadow-sm flex flex-col p-5 shrink-0"
                        style={{ background: "white", border: "1.5px solid #c7e8f8" }}>
                        <div className="flex items-center gap-4 mb-4">
                            <AvatarInitial nama={petugas?.nama} fotoUrl={getFotoUrl(petugas?.foto_profil)} size={56} />
                            <div className="min-w-0">
                                <p className="font-bold text-lg truncate" style={{ color: "#0F2A44" }}>{petugas?.nama}</p>
                                <p className="text-xs truncate" style={{ color: "#94a3b8" }}>{petugas?.email ?? "—"}</p>
                            </div>
                        </div>
                        <div className="w-full h-[1.5px] bg-[#e0f2fe] mb-4 shrink-0" />
                        <div className="grid grid-cols-4 gap-x-4 gap-y-6">
                            {[
                                { icon: faVenusMars,     label: "Jenis Kelamin", value: petugas?.jenis_kelamin,          bg: "#e0f2fe", color: "#005EA4" },
                                { icon: faPhone,         label: "No. HP",        value: petugas?.no_hp,                  bg: "#e0f2fe", color: "#005EA4" },
                                { icon: faUserCheck,     label: "Hadir",         value: `${stats?.hadir ?? 0} Hari`,     bg: "#dcfce7", color: "#16a34a", bold: true },
                                { icon: faUserXmark,     label: "Alpha",         value: `${stats?.alpha ?? 0} Hari`,     bg: "#fee2e2", color: "#dc2626", bold: true },
                                { icon: faUserTie,       label: "Supervisor",    value: petugas?.supervisor,             bg: "#e0f2fe", color: "#005EA4" },
                                { icon: faLocationDot,   label: "Alamat",        value: petugas?.alamat,                 bg: "#e0f2fe", color: "#005EA4" },
                                { icon: faClock,         label: "Terlambat",     value: `${stats?.terlambat ?? 0} Hari`, bg: "#fef3c7", color: "#d97706", bold: true },
                                { icon: faUmbrellaBeach, label: "Libur",         value: `${stats?.libur ?? 0} Hari`,     bg: "#cffafe", color: "#0891b2", bold: true },
                            ].map(({ icon, label, value, bg, color, bold }) => (
                                <div key={label} className="flex items-center gap-2 min-w-0">
                                    <div className="flex items-center justify-center rounded-lg shrink-0"
                                        style={{ width: 28, height: 28, background: bg, color }}>
                                        <FontAwesomeIcon icon={icon} style={{ fontSize: 12 }} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase font-semibold tracking-wide leading-none mb-0.5"
                                            style={{ color: "#94a3b8" }}>{label}</p>
                                        <p className={`text-xs ${bold ? "font-bold" : "font-medium"} truncate leading-none`}
                                            style={{ color: "#0F2A44" }}>{value ?? "—"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tabel Riwayat */}
                    <div className="flex-1 rounded-2xl overflow-hidden flex flex-col min-h-0 shadow-sm"
                        style={{ background: "white", border: "1.5px solid #c7e8f8" }}>

                        {/* Toolbar header */}
                        <div className="px-5 py-3 shrink-0 flex items-center gap-3 flex-wrap"
                            style={{ borderBottom: "1.5px solid #e0f2fe" }}>

                            <FontAwesomeIcon icon={faCalendarCheck} style={{ fontSize: 13, color: "#005EA4" }} />
                            <h2 className="font-semibold text-sm shrink-0" style={{ color: "#0F2A44" }}>
                                Riwayat Presensi
                            </h2>

                            {/* Filter Status */}
                            <div className="flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faFilter} style={{ fontSize: 10, color: "#94a3b8" }} />
                                <select
                                    value={filters?.status ?? ""}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className="text-xs rounded-xl px-3 py-2 outline-none"
                                    style={{
                                        background: "#f8fafc",
                                        border: "1.5px solid #c7e8f8",
                                        color: filters?.status ? "#0F2A44" : "#94a3b8",
                                        minWidth: 130,
                                    }}
                                >
                                    {STATUS_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.value === "" ? "Semua Status" : opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Filter Tanggal */}
                            <input
                                key={filters?.tanggal ?? "no-date"}
                                type="date"
                                defaultValue={filters?.tanggal ?? ""}
                                onChange={handleTanggalChange}
                                min={minDate}
                                max={maxDate}
                                className="text-xs rounded-xl px-3 py-2 outline-none"
                                style={{
                                    background: "#f8fafc",
                                    border: "1.5px solid #c7e8f8",
                                    color: filters?.tanggal ? "#0F2A44" : "#94a3b8",
                                }}
                            />

                            {/* Reset */}
                            {hasFilter && (
                                <button
                                    onClick={handleReset}
                                    className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold hover:opacity-80 transition-opacity"
                                    style={{ background: "#fee2e2", color: "#dc2626", border: "1.5px solid #fca5a5" }}
                                >
                                    <FontAwesomeIcon icon={faFilterCircleXmark} style={{ fontSize: 11 }} />
                                    Reset
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto"
                            style={{ scrollbarWidth: "thin", scrollbarColor: "#b8dff0 transparent" }}>
                            <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
                                <colgroup>
                                    <col style={{ width: "16%" }} />
                                    <col style={{ width: "10%" }} />
                                    <col style={{ width: "10%" }} />
                                    <col style={{ width: "13%" }} />
                                    <col style={{ width: "10%" }} />
                                    <col style={{ width: "12%" }} />
                                    <col style={{ width: "12%" }} />
                                    <col style={{ width: "17%" }} />
                                </colgroup>
                                <thead className="sticky top-0 z-10">
                                    <tr style={{ background: "#005EA4", color: "white" }}>
                                        {[
                                            { label: "Hari / Tanggal", align: "left",   cls: "px-5" },
                                            { label: "Status",         align: "center", cls: "px-3" },
                                            { label: "Shift",          align: "center", cls: "px-3" },
                                            { label: "Pos Jaga",       align: "center", cls: "px-3" },
                                            { label: "Patroli",        align: "center", cls: "px-3" },
                                            { label: "Jam Masuk",      align: "center", cls: "px-3" },
                                            { label: "Jam Pulang",     align: "center", cls: "px-3" },
                                            { label: "Aksi",           align: "center", cls: "px-3" },
                                        ].map((h) => (
                                            <th key={h.label}
                                                className={`${h.cls} py-3 font-semibold text-xs text-${h.align}`}>
                                                {h.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {!absensi || absensi.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-14 text-center text-xs"
                                                style={{ color: "#94a3b8" }}>
                                                <div className="flex flex-col items-center gap-2">
                                                    <FontAwesomeIcon icon={faCalendarCheck}
                                                        style={{ fontSize: 28, color: "#c7e8f8" }} />
                                                    {filters?.tanggal
                                                        ? `Tidak ada data presensi untuk tanggal ${filters.tanggal}`
                                                        : filters?.status
                                                        ? `Tidak ada data dengan status "${STATUS_OPTIONS.find(s => s.value === filters.status)?.label}"`
                                                        : "Tidak ada data presensi untuk periode ini"}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        absensi.map((item, i) => (
                                            <tr key={item.id}
                                                style={{ background: i % 2 === 1 ? "#f0f9ff" : "white", borderBottom: "1px solid #e0f2fe" }}>
                                                <td className="px-5 py-3">
                                                    <p className="font-semibold text-xs" style={{ color: "#0F2A44" }}>
                                                        {item.hari}, {item.tanggal}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <StatusBadge status={item.status} />
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <p className="text-xs font-medium" style={{ color: "#0F2A44" }}>
                                                        {item.shift ?? "—"}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3 text-center text-xs" style={{ color: "#0F2A44" }}>
                                                    {item.pos_jaga ?? "—"}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <PatroliBadge status={item.status_patroli} />
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <p className="text-xs font-medium"
                                                        style={{ color: item.jam_masuk ? "#0F2A44" : "#94a3b8" }}>
                                                        {item.jam_masuk ?? "—"}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <p className="text-xs font-medium"
                                                        style={{ color: item.jam_pulang ? "#0F2A44" : "#94a3b8" }}>
                                                        {item.jam_pulang ?? "—"}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <button
                                                        onClick={() => handleLihatDetail(item.id)}
                                                        disabled={modalLoading}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-50"
                                                        style={{ background: "#e0f2fe", color: "#005EA4" }}
                                                    >
                                                        <FontAwesomeIcon icon={faEye} style={{ fontSize: 11 }} />
                                                        {modalLoading ? "..." : "Detail"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AdminLayout>

            {/* Modal */}
            {(modalData || modalLoading) && (
                <ModalDetailPresensi
                    data={modalData}
                    loading={modalLoading}
                    onClose={() => { setModalData(null); setModalLoading(false); }}
                />
            )}
        </>
    );
}