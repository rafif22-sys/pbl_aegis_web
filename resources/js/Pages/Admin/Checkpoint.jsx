// resources/js/Pages/Admin/Checkpoint.jsx
//


import { Head, router } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";

import AdminLayout                from "@/Layouts/AdminLayout";
import { MainMap }                from "@/Components/Admin/MainMap";
import { CheckpointTable }        from "@/Components/Admin/CheckpointTable";
import { CheckpointModal, CheckpointDeleteModal } from "@/Components/Admin/CheckpointModals";

export default function Checkpoint({ checkpoints, auth, filters, allCheckpoints }) {
    // ── UI state ──────────────────────────────────────────
    const [modalMode,        setModalMode]        = useState(null);  // "tambah" | "edit" | null
    const [editCheckpoint,   setEditCheckpoint]   = useState(null);
    const [deleteCheckpoint, setDeleteCheckpoint] = useState(null);
    const [activeRow,        setActiveRow]        = useState(null);  // id baris aktif di tabel
    const [search,           setSearch]           = useState(filters?.search ?? "");

    // Ref ke peta utama — digunakan untuk memanggil flyTo
    const mapRef        = useRef(null);
    const isFirstRender = useRef(true);
    const skipEffect    = useRef(false);

    // ── Debounced search → Inertia GET ───────────────────
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        if (skipEffect.current)    { skipEffect.current = false;    return; } // ← tambah
        const t = setTimeout(() => {
            router.get(
                route("admin.checkpoint.index"),
                { search },
                { preserveState: true, replace: true }
            );
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    // ── Reset search → reload semua data ─────────────────
    const resetSearch = () => {
        setSearch("");
    };

    // ── Handlers CRUD ─────────────────────────────────────
    const handleTambah = (formData, onSuccess, onError) => {
        router.post(route("admin.checkpoint.store"), formData, {
            onSuccess: () => {
                setModalMode(null);
                onSuccess();
                skipEffect.current = true; // ← set SEBELUM setSearch
                resetSearch();
            },
            onError: (e) => onError(e),
        });
    };

    const handleEdit = (formData, onSuccess, onError) => {
        router.put(route("admin.checkpoint.update", editCheckpoint.id), formData, {
            onSuccess: () => { setModalMode(null); setEditCheckpoint(null); onSuccess(); },
            onError:   (e) => onError(e),
        });
    };

    const handleDelete = (onFinish) => {
        router.delete(route("admin.checkpoint.destroy", deleteCheckpoint.id), {
            onSuccess: () => { setDeleteCheckpoint(null); setActiveRow(null); },
            onFinish:  () => onFinish(),
        });
    };

    // ── Helper: buka modal edit ───────────────────────────
    const openEdit = (cp) => {
        setEditCheckpoint(cp);
        setModalMode("edit");
    };

    // ── Handler: klik baris tabel → flyTo peta ───────────
    const handleRowClick = (cp) => {
        const lat = parseFloat(cp.latitude);
        const lng = parseFloat(cp.longitude);
        if (isNaN(lat) || isNaN(lng)) return;
        setActiveRow(cp.id);
        mapRef.current?.flyTo(lat, lng, cp.id);
    };

    // Normalise data list (array atau paginator)
    const list = allCheckpoints ?? [];  // peta selalu pakai semua data

    return (
        <>
            <Head title="Checkpoint" />

            <AdminLayout auth={auth} activeMenu="Checkpoint" title="Checkpoint">
                <div className="flex gap-4 flex-1 min-h-0">

                    {/* ── Peta utama ── */}
                    <div
                        className="flex-1 rounded-2xl overflow-hidden shadow-sm shrink-0 min-h-0"
                        style={{
                            border:     "1.5px solid #c7e8f8",
                            minWidth:   0,
                            maxWidth:   "55%",
                            background: "#e5e7eb",
                        }}
                    >
                        <MainMap ref={mapRef} checkpoints={list} />
                    </div>

                    {/* ── Panel tabel kanan ── */}
                    <CheckpointTable
                        checkpoints={checkpoints}
                        activeRow={activeRow}
                        search={search}
                        onSearch={setSearch}
                        onRowClick={handleRowClick}
                        onAdd={() => setModalMode("tambah")}
                        onEdit={openEdit}
                        onDelete={setDeleteCheckpoint}
                    />
                </div>
            </AdminLayout>

            {/* ── Modals ── */}
            {modalMode === "tambah" && (
                <CheckpointModal
                    mode="tambah"
                    checkpoint={null}
                    onClose={() => setModalMode(null)}
                    onSubmit={handleTambah}
                />
            )}
            {modalMode === "edit" && editCheckpoint && (
                <CheckpointModal
                    mode="edit"
                    checkpoint={editCheckpoint}
                    onClose={() => { setModalMode(null); setEditCheckpoint(null); }}
                    onSubmit={handleEdit}
                />
            )}
            {deleteCheckpoint && (
                <CheckpointDeleteModal
                    checkpoint={deleteCheckpoint}
                    onClose={() => setDeleteCheckpoint(null)}
                    onConfirm={handleDelete}
                />
            )}
        </>
    );
}