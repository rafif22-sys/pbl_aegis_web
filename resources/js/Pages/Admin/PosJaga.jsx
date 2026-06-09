// resources/js/Pages/Admin/PosJaga.jsx

import { Head, router } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Icon } from "@/Components/Admin/Icons";
import {
    faPlus, faMagnifyingGlass, faChevronLeft, faChevronRight,
    faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

import AdminLayout from "@/Layouts/AdminLayout";
import { PosCard } from "@/Components/Admin/PosCard";
import { PosJagaModal, DeleteModal } from "@/Components/Admin/PosJagaModals";

// ── Design tokens ────────────────────────────────────────
const C = {
    navy:       "#0F2A44",
    blue:       "#005EA4",
    blueSoft:   "#e0f2fe",
    blueBorder: "#c7e8f8",
    blueLight:  "#f0f9ff",
    red:        "#c0392b",
    redSoft:    "#fde8e8",
    slate:      "#64748b",
    border:     "#e2e8f0",
    slateLight: "#f8fafc",
};

// ── Empty State ──────────────────────────────────────────
function EmptyState({ hasSearch }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                    style={{ background: C.blueSoft }}>
                    <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: 32, color: C.blueBorder }} />
                </div>
                <div className="absolute -inset-2 rounded-3xl border-2 border-dashed opacity-20"
                    style={{ borderColor: C.blue }} />
            </div>
            <div className="text-center">
                <p className="font-bold text-sm" style={{ color: "#94a3b8" }}>
                    {hasSearch ? "Pos jaga tidak ditemukan" : "Belum ada pos jaga"}
                </p>
                <p className="text-xs mt-1" style={{ color: "#cbd5e1" }}>
                    {hasSearch ? "Coba kata kunci yang berbeda" : "Klik tombol + untuk menambah pos jaga baru"}
                </p>
            </div>
        </div>
    );
}

// ── HALAMAN UTAMA ────────────────────────────────────────
export default function PosJagaPage({ posJaga, auth, filters }) {
    const [modalMode,  setModalMode]  = useState(null);
    const [editPos,    setEditPos]    = useState(null);
    const [deletePos,  setDeletePos]  = useState(null);
    const [search,     setSearch]     = useState(filters?.search ?? "");
    const [processing, setProcessing] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const isFirstRender = useRef(true);
    const skipEffect    = useRef(false);

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        if (skipEffect.current)    { skipEffect.current = false;    return; }
        const t = setTimeout(() => {
            router.get(route("admin.pos-jaga.index"), { search }, { preserveState: true, replace: true });
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const resetSearch = () => setSearch("");

    const handleTambah = (formData) => {
        setProcessing(true);
        router.post(route("admin.pos-jaga.store"), formData, {
            onSuccess: () => { setModalMode(null); setProcessing(false); setFormErrors({}); skipEffect.current = true; resetSearch(); },
            onError:   (e) => { setFormErrors(e); setProcessing(false); },
        });
    };

    const handleEdit = (formData) => {
        setProcessing(true);
        router.put(route("admin.pos-jaga.update", editPos.id), formData, {
            onSuccess: () => { setModalMode(null); setEditPos(null); setProcessing(false); setFormErrors({}); skipEffect.current = true; resetSearch(); },
            onError:   (e) => { setFormErrors(e); setProcessing(false); },
        });
    };

    const handleDelete = () => {
        setProcessing(true);
        router.delete(route("admin.pos-jaga.destroy", deletePos.id), {
            onSuccess: () => { setDeletePos(null); setProcessing(false); },
            onFinish:  () => setProcessing(false),
        });
    };

    const openEdit = (pos) => { setEditPos(pos); setModalMode("edit"); setFormErrors({}); };

    const list      = posJaga?.data ?? posJaga ?? [];
    const paginated = (posJaga?.last_page ?? 1) > 1;

    return (
        <>
            <Head title="Pos Jaga" />
            <AdminLayout auth={auth} activeMenu="Pos Jaga" title="Pos Jaga">
                <div className="flex flex-col gap-4 flex-1 min-h-0">

                    {/* ── Card Grid (bersatu dengan Header) ── */}
                    <div className="flex flex-col flex-1 min-h-0 rounded-2xl overflow-hidden"
                        style={{ background:"white", border:`1.5px solid ${C.blueBorder}` }}>

                        {/* Toolbar Header */}
                        <div className="px-4 py-3 flex items-center gap-3 shrink-0"
                             style={{ borderBottom: `1.5px solid #005EA4`, background: "#005EA4" }}>
                            <div className="flex items-center gap-2 flex-1">
                                {Icon.PosJaga("white")}
                                <h2 className="font-semibold text-white text-sm">Daftar Pos Jaga</h2>
                                <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                                >
                                    {posJaga?.total ?? list.length}
                                </span>
                            </div>

                            {/* Search (desktop) */}
                            <div className="relative hidden sm:block" style={{ width: 180 }}>
                                <FontAwesomeIcon icon={faMagnifyingGlass}
                                    style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
                                <input type="text" value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama atau alamat..."
                                    className="w-full text-xs rounded-xl pl-8 pr-3 py-2 outline-none placeholder-white/70"
                                    style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white" }}
                                />
                            </div>

                            <button
                                onClick={() => { setModalMode("tambah"); setFormErrors({}); }}
                                className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80 transition-all shrink-0 shadow-sm hover:scale-105"
                                style={{ background: "white" }}
                                title="Tambah Pos"
                            >
                                <FontAwesomeIcon icon={faPlus} style={{ fontSize: 13, color: "#005EA4" }} />
                            </button>
                        </div>

                        {/* Search mobile */}
                        <div className="sm:hidden relative m-4 mb-0">
                            <FontAwesomeIcon icon={faMagnifyingGlass}
                                style={{ fontSize:11, color:"#94a3b8", position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }} />
                            <input type="text" value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau alamat..."
                                className="w-full text-xs rounded-xl pl-8 pr-3 py-2.5 outline-none"
                                style={{ background:"#f8fafc", border:`1px solid ${C.blueBorder}`, color:C.navy }}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-4"
                            style={{ scrollbarWidth:"thin", scrollbarColor:"#b8dff0 transparent" }}>
                            {list.length === 0 ? (
                                <EmptyState hasSearch={!!search} />
                            ) : (
                                <div className="grid gap-3"
                                    style={{ gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))" }}>
                                    {list.map((pos, i) => (
                                        <PosCard key={pos.id} pos={pos} idx={i}
                                            onEdit={openEdit} onDelete={setDeletePos} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {paginated && (
                            <div className="px-5 py-3 shrink-0 flex items-center justify-between"
                                style={{ borderTop:`1.5px solid #e0f2fe` }}>
                                <span className="text-xs" style={{ color:C.slate }}>
                                    Halaman{" "}
                                    <span className="font-semibold" style={{ color:C.navy }}>{posJaga.current_page}</span>
                                    {" / "}
                                    <span className="font-semibold" style={{ color:C.navy }}>{posJaga.last_page}</span>
                                    <span className="ml-2" style={{ color:"#94a3b8" }}>({posJaga.total} pos jaga)</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => router.get(posJaga.prev_page_url, {}, { preserveState:true })}
                                        disabled={!posJaga.prev_page_url}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
                                        style={{ background:C.blueSoft, color:C.blue }}>
                                        <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize:10 }} />
                                    </button>
                                    {Array.from({ length:Math.min(posJaga.last_page, 5) }, (_, i) => i+1).map((page) => (
                                        <button key={page}
                                            onClick={() => router.get(route("admin.pos-jaga.index"), { page }, { preserveState:true })}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold"
                                            style={page === posJaga.current_page
                                                ? { background:C.blue, color:"white" }
                                                : { background:"#f1f5f9", color:C.slate }}>
                                            {page}
                                        </button>
                                    ))}
                                    <button onClick={() => router.get(posJaga.next_page_url, {}, { preserveState:true })}
                                        disabled={!posJaga.next_page_url}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
                                        style={{ background:C.blueSoft, color:C.blue }}>
                                        <FontAwesomeIcon icon={faChevronRight} style={{ fontSize:10 }} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </AdminLayout>

            {modalMode === "tambah" && (
                <PosJagaModal mode="tambah" pos={null}
                    onClose={() => setModalMode(null)}
                    onSubmit={handleTambah}
                    processing={processing} errors={formErrors} />
            )}
            {modalMode === "edit" && editPos && (
                <PosJagaModal mode="edit" pos={editPos}
                    onClose={() => { setModalMode(null); setEditPos(null); }}
                    onSubmit={handleEdit}
                    processing={processing} errors={formErrors} />
            )}
            {deletePos && (
                <DeleteModal pos={deletePos}
                    onClose={() => setDeletePos(null)}
                    onConfirm={handleDelete}
                    processing={processing} />
            )}
        </>
    );
}