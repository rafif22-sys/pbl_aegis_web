// resources/js/Components/Admin/CheckpointTable.jsx
//


import { router } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus, faPencil, faTrash,
    faMagnifyingGlass, faChevronLeft, faChevronRight,
    faLocationDot,
} from "@fortawesome/free-solid-svg-icons";

// ── Colour tokens (sama dengan CheckpointModals) ──────────
const C = {
    navy:      "#0F2A44",
    blue:      "#005EA4",
    blueSoft:  "#e0f2fe",
    blueBorder:"#c7e8f8",
    red:       "#c0392b",
    redSoft:   "#fde8e8",
    slate:     "#64748b",
};

// ── Sub-komponen kecil ────────────────────────────────────
function IdBadge({ id }) {
    return (
        <span
            className="text-xs font-bold px-2.5 py-1 rounded-lg"
            style={{ background: C.blueSoft, color: C.blue }}
        >
           {id}
        </span>
    );
}

/**
 * CheckpointTable
 *
 * Props:
 *   checkpoints  — hasil paginate dari Inertia ({ data, current_page, last_page, ... })
 *                  atau array biasa jika tidak di-paginate
 *   activeRow    — id checkpoint yang sedang aktif / di-highlight
 *   search       — nilai search saat ini
 *   onSearch     — callback(value) saat input search berubah
 *   onRowClick   — callback(checkpoint) saat baris diklik
 *   onAdd        — callback buka modal tambah
 *   onEdit       — callback(cp, globalIndex) buka modal edit
 *   onDelete     — callback(cp) buka modal hapus
 */
export function CheckpointTable({
    checkpoints,
    activeRow,
    search,
    onSearch,
    onRowClick,
    onAdd,
    onEdit,
    onDelete,
}) {
    // Normalise: terima array atau Laravel paginator
    const isPaginated = checkpoints?.last_page > 1;
    const list        = checkpoints?.data ?? checkpoints ?? [];

    return (
        <div
            className="flex flex-col rounded-2xl overflow-hidden shadow-sm"
            style={{
                background: "white",
                border:     `1.5px solid ${C.blueBorder}`,
                width:       "45%",
                minWidth:    320,
                flexShrink:  0,
            }}
        >
            {/* ── Toolbar ── */}
            <div
                className="px-4 py-3 shrink-0 flex items-center gap-3"
                style={{ borderBottom: `1.5px solid #e0f2fe` }}
            >
                <div className="flex items-center gap-2 flex-1">
                    <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: 13, color: C.blue }} />
                    <h2 className="font-semibold text-sm" style={{ color: C.navy }}>
                        Daftar Checkpoint
                    </h2>
                </div>

                <p className="text-[10px] hidden lg:block" style={{ color: "#94a3b8" }}>
                    Klik baris untuk fokus ke peta
                </p>

                {/* Search */}
                <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: "#f8fafc", width: 190 }}
                >
                    <FontAwesomeIcon
                        icon={faMagnifyingGlass}
                        style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="Cari lokasi..."
                        className="text-xs outline-none flex-1 min-w-0"
                        style={{ background: "transparent", color: C.navy, border: "none" }}
                    />
                </div>

                {/* Tombol Tambah */}
                <button
                    onClick={onAdd}
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80 transition-all shrink-0"
                    style={{ background: C.blue }}
                    title="Tambah Checkpoint"
                >
                    <FontAwesomeIcon icon={faPlus} style={{ fontSize: 13, color: "white" }} />
                </button>
            </div>

            {/* ── Tabel ── */}
            <div
                className="flex-1 overflow-y-auto"
                style={{ scrollbarWidth: "thin", scrollbarColor: "#b8dff0 transparent" }}
            >
                <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
                    <colgroup>
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "28%" }} />
                        <col style={{ width: "18%" }} />
                        <col style={{ width: "18%" }} />
                        <col style={{ width: "20%" }} />
                    </colgroup>
                    <thead className="sticky top-0 z-10">
                        <tr style={{ background: C.blue, color: "white" }}>
                            {["No.", "Nama", "Latitude", "Longitude", "Aksi"].map((h, i) => (
                                <th
                                    key={h}
                                    className={`px-3 py-3 font-semibold text-xs ${i === 1 ? "text-left" : "text-center"}`}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {list.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-xs" style={{ color: "#94a3b8" }}>
                                    <div className="flex flex-col items-center gap-2">
                                        <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: 24, color: C.blueBorder }} />
                                        Belum ada checkpoint
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            list.map((cp, i) => {
                                
                                const isActive = activeRow === cp.id;

                                return (
                                    <tr
                                        key={cp.id}
                                        onClick={() => onRowClick(cp)}
                                        style={{
                                            background:   isActive ? "#bfdbfe" : i % 2 === 1 ? "#f0f9ff" : "white",
                                            borderBottom: "1px solid #e0f2fe",
                                            cursor:       "pointer",
                                            borderLeft:   isActive ? `3px solid ${C.blue}` : "3px solid transparent",
                                            transition:   "background 0.15s",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) e.currentTarget.style.background = "#dbeeff";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = isActive
                                                ? "#bfdbfe"
                                                : i % 2 === 1 ? "#f0f9ff" : "white";
                                        }}
                                    >
                                        {/* ID */}
                                        <td className="px-3 py-3 text-center">
                                            <IdBadge id={cp.urutan} />
                                        </td>

                                        {/* Nama */}
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                                    style={{ background: isActive ? C.blue : C.blueBorder }}
                                                />
                                                <span
                                                    className="text-xs truncate"
                                                    style={{ color: C.navy, fontWeight: isActive ? 700 : 500 }}
                                                >
                                                    {cp.nama}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Latitude */}
                                        <td className="px-3 py-3 text-center">
                                            <span className="text-xs font-mono" style={{ color: "#475569" }}>
                                                {parseFloat(cp.latitude).toFixed(5)}
                                            </span>
                                        </td>

                                        {/* Longitude */}
                                        <td className="px-3 py-3 text-center">
                                            <span className="text-xs font-mono" style={{ color: "#475569" }}>
                                                {parseFloat(cp.longitude).toFixed(5)}
                                            </span>
                                        </td>

                                        {/* Aksi — stopPropagation agar tidak trigger onRowClick */}
                                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => onEdit(cp)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-105 transition-transform"
                                                    style={{ background: C.blueSoft }}
                                                    title="Edit"
                                                >
                                                    <FontAwesomeIcon icon={faPencil} style={{ fontSize: 11, color: C.blue }} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(cp)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-105 transition-transform"
                                                    style={{ background: C.redSoft }}
                                                    title="Hapus"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} style={{ fontSize: 11, color: C.red }} />
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

            {/* ── Pagination ── */}
            {isPaginated && (
                <div
                    className="px-4 py-3 shrink-0 flex items-center justify-between"
                    style={{ borderTop: `1.5px solid #e0f2fe` }}
                >
                    <span className="text-xs" style={{ color: C.slate }}>
                        Halaman{" "}
                        <span className="font-semibold" style={{ color: C.navy }}>{checkpoints.current_page}</span>
                        {" / "}
                        <span className="font-semibold" style={{ color: C.navy }}>{checkpoints.last_page}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => router.get(checkpoints.prev_page_url, {}, { preserveState: true })}
                            disabled={!checkpoints.prev_page_url}
                            className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
                            style={{ background: C.blueSoft, color: C.blue }}
                        >
                            <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 10 }} />
                        </button>

                        {Array.from({ length: Math.min(checkpoints.last_page, 5) }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => router.get(route("admin.checkpoint.index"), { page }, { preserveState: true })}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold"
                                style={
                                    page === checkpoints.current_page
                                        ? { background: C.blue,    color: "white" }
                                        : { background: "#f1f5f9", color: C.slate }
                                }
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => router.get(checkpoints.next_page_url, {}, { preserveState: true })}
                            disabled={!checkpoints.next_page_url}
                            className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
                            style={{ background: C.blueSoft, color: C.blue }}
                        >
                            <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 10 }} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}