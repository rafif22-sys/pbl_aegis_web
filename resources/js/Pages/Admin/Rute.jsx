// resources/js/Pages/Admin/Rute.jsx
import { Head, router } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus, faChevronLeft, faChevronRight,
    faRoute, faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";

import AdminLayout from "@/Layouts/AdminLayout";
import { RuteMap } from "@/Components/Admin/RuteMap";
import { RuteCard } from "@/Components/Admin/RuteCard";
import { DetailModal, RuteModal, DeleteModal } from "@/Components/Admin/RuteModals";

// ── Design tokens (selaras Checkpoint & ManajemenUser) ───
const C = {
    navy: "#0F2A44",
    blue: "#005EA4",
    blueSoft: "#e0f2fe",
    blueBorder: "#c7e8f8",
    blueLight: "#E7F8FF",
    blueText: "#90c4e8",
    red: "#c0392b",
    redSoft: "#fde8e8",
    slate: "#64748b",
    slateLight: "#f8fafc",
    border: "#e2e8f0",
    green: "#15803d",
    greenSoft: "#dcfce7",
};

const getRouteColor = (_idx) => "#005EA4";

// ── HALAMAN UTAMA ────────────────────────────────────────
export default function RuteJaga({ rutes, allCheckpoints, auth, filters }) {
    const [modalMode, setModalMode] = useState(null);
    const [editRute, setEditRute] = useState(null);
    const [deleteRute, setDeleteRute] = useState(null);
    const [detailRute, setDetailRute] = useState(null);
    const [detailIndex, setDetailIndex] = useState(null);
    const [activeRow, setActiveRow] = useState(null);
    const [search, setSearch] = useState(filters?.search ?? "");

    const mapRef = useRef(null);
    const isFirstRender = useRef(true);
    const skipEffect = useRef(false);

    // Debounce search
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        if (skipEffect.current) { skipEffect.current = false; return; }
        const t = setTimeout(() => {
            router.get(route("admin.rute.index"), { search }, { preserveState: true, replace: true });
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const handleRowClick = (rute) => {
        setActiveRow(rute.id);
        mapRef.current?.focusRute(rute.id);
    };

    const handleTambah = (data, onSuccess, onError) => {
        router.post(route("admin.rute.store"), data, {
            onSuccess: () => {
                setModalMode(null);
                onSuccess();
                skipEffect.current = true;
                setSearch("");
            },
            onError: (e) => onError(e),
        });
    };

    const handleEdit = (data, onSuccess, onError) => {
        router.put(route("admin.rute.update", editRute.id), data, {
            onSuccess: () => { setModalMode(null); setEditRute(null); onSuccess(); },
            onError: (e) => onError(e),
        });
    };

    const handleDelete = (onFinish) => {
        router.delete(route("admin.rute.destroy", deleteRute.id), {
            onSuccess: () => { setDeleteRute(null); setActiveRow(null); },
            onFinish: () => onFinish(),
        });
    };

    const openEdit = (rute) => { setEditRute(rute); setModalMode("edit"); };
    const openDetail = (rute, idx) => { setDetailRute(rute); setDetailIndex(idx); };

    const list = rutes?.data ?? rutes ?? [];
    const paginated = rutes?.last_page > 1 ? rutes : null;

    return (
        <>
            <Head title="Rute Patroli" />
            <AdminLayout auth={auth} activeMenu="Rute Patroli" title="Rute Patroli">

                <div className="flex gap-4 flex-1 min-h-0">

                    {/* ── KIRI: Peta ── */}
                    <div
                        className="flex-1 rounded-2xl overflow-hidden shadow-sm shrink-0 min-h-0"
                        style={{
                            border: `1.5px solid ${C.blueBorder}`,
                            minWidth: 0,
                            maxWidth: "55%",
                            background: "#e5e7eb",
                        }}
                    >
                        {/* Badge rute aktif */}
                        {activeRow && (() => {
                            const idx = list.findIndex(r => r.id === activeRow);
                            const rute = list[idx];
                            if (!rute) return null;
                            const color = getRouteColor(idx);
                            return (
                                <div
                                    className="absolute z-10 m-3 px-3 py-2 rounded-xl flex items-center gap-2 shadow-md"
                                    style={{
                                        background: "rgba(255,255,255,0.96)",
                                        border: `1.5px solid ${color}55`,
                                        maxWidth: 220, top: 0, left: 0,
                                    }}
                                >
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold truncate" style={{ color: C.navy }}>
                                            {rute.nama_rute}
                                        </p>
                                        <p className="text-[9px]" style={{ color: C.slate }}>
                                            {rute.checkpoint?.length ?? 0} checkpoint · mengikuti jalan
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}
                        <RuteMap ref={mapRef} rutes={list} activeRuteId={activeRow} />
                    </div>

                    {/* ── KANAN: Card List ── */}
                    <div
                        className="flex flex-col rounded-2xl overflow-hidden shadow-sm"
                        style={{
                            background: "white",
                            border: `1.5px solid ${C.blueBorder}`,
                            width: "45%",
                            minWidth: 320,
                            flexShrink: 0,
                        }}
                    >
                        {/* Toolbar */}
                        <div
                            className="px-4 py-3 shrink-0 flex items-center gap-3"
                            style={{ borderBottom: `1.5px solid #005EA4`, background: "#005EA4" }}
                        >
                            <div className="flex items-center gap-2 flex-1">
                                <FontAwesomeIcon icon={faRoute} style={{ fontSize: 13, color: "white" }} />
                                <h2 className="font-semibold text-sm" style={{ color: "white" }}>Daftar Rute</h2>
                                {/* Total rute badge */}
                                {list.length > 0 && (
                                    <span
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                        style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                                    >
                                        {list.length}
                                    </span>
                                )}
                            </div>

                            <p className="text-[10px] hidden lg:block" style={{ color: "rgba(255,255,255,0.7)" }}>
                                Klik card untuk fokus peta
                            </p>

                            {/* Search */}
                            <div
                                className="flex items-center gap-2 rounded-xl px-3 py-2"
                                style={{ background: "rgba(255,255,255,0.15)", width: 160, border: `1px solid rgba(255,255,255,0.3)` }}
                            >
                                <FontAwesomeIcon icon={faMagnifyingGlass}
                                    style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", flexShrink: 0 }} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari rute..."
                                    className="text-xs outline-none flex-1 min-w-0 placeholder-white/70"
                                    style={{ background: "transparent", color: "white", border: "none" }}
                                />
                            </div>

                            {/* Tambah */}
                            <button
                                onClick={() => setModalMode("tambah")}
                                className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80 transition-all shrink-0 shadow-sm hover:scale-105"
                                style={{ background: "white" }}
                                title="Tambah Rute"
                            >
                                <FontAwesomeIcon icon={faPlus} style={{ fontSize: 13, color: "#005EA4" }} />
                            </button>
                        </div>

                        {/* Card List */}
                        <div
                            className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5"
                            style={{ scrollbarWidth: "thin", scrollbarColor: "#b8dff0 transparent" }}
                        >
                            {list.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 py-16 text-xs" style={{ color: "#94a3b8" }}>
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                        style={{ background: C.blueSoft }}
                                    >
                                        <FontAwesomeIcon icon={faRoute} style={{ fontSize: 24, color: C.blueBorder }} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-semibold text-sm" style={{ color: "#cbd5e1" }}>
                                            Belum ada rute jaga
                                        </p>
                                        <p className="text-[11px] mt-1" style={{ color: "#d1d5db" }}>
                                            Klik tombol + untuk menambah rute baru
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                list.map((rute, i) => (
                                    <RuteCard
                                        key={rute.id}
                                        rute={rute}
                                        index={i}
                                        isActive={activeRow === rute.id}
                                        onClick={() => handleRowClick(rute)}
                                        onDetail={() => openDetail(rute, i)}
                                        onEdit={() => openEdit(rute)}
                                        onDelete={() => setDeleteRute(rute)}
                                    />
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {paginated && (
                            <div
                                className="px-4 py-3 shrink-0 flex items-center justify-between"
                                style={{ borderTop: `1.5px solid #e0f2fe` }}
                            >
                                <span className="text-xs" style={{ color: C.slate }}>
                                    Halaman{" "}
                                    <span className="font-semibold" style={{ color: C.navy }}>{rutes.current_page}</span>
                                    {" / "}
                                    <span className="font-semibold" style={{ color: C.navy }}>{rutes.last_page}</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => router.get(rutes.prev_page_url, {}, { preserveState: true })}
                                        disabled={!rutes.prev_page_url}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
                                        style={{ background: C.blueSoft, color: C.blue }}
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 10 }} />
                                    </button>
                                    {Array.from({ length: Math.min(rutes.last_page, 5) }, (_, i) => i + 1).map((page) => (
                                        <button key={page}
                                            onClick={() => router.get(route("admin.rute.index"), { page }, { preserveState: true })}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold"
                                            style={page === rutes.current_page
                                                ? { background: C.blue, color: "white" }
                                                : { background: "#f1f5f9", color: C.slate }}>
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => router.get(rutes.next_page_url, {}, { preserveState: true })}
                                        disabled={!rutes.next_page_url}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
                                        style={{ background: C.blueSoft, color: C.blue }}
                                    >
                                        <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 10 }} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </AdminLayout>

            {/* ── Modals ── */}
            {detailRute && (
                <DetailModal
                    rute={detailRute}
                    ruteIndex={detailIndex}
                    onClose={() => setDetailRute(null)}
                    onEdit={() => openEdit(detailRute)}
                />
            )}
            {modalMode === "tambah" && (
                <RuteModal
                    mode="tambah"
                    rute={null}
                    allCheckpoints={allCheckpoints}
                    onClose={() => setModalMode(null)}
                    onSubmit={handleTambah}
                />
            )}
            {modalMode === "edit" && editRute && (
                <RuteModal
                    mode="edit"
                    rute={editRute}
                    allCheckpoints={allCheckpoints}
                    onClose={() => { setModalMode(null); setEditRute(null); }}
                    onSubmit={handleEdit}
                />
            )}
            {deleteRute && (
                <DeleteModal
                    rute={deleteRute}
                    onClose={() => setDeleteRute(null)}
                    onConfirm={handleDelete}
                />
            )}
        </>
    );
}