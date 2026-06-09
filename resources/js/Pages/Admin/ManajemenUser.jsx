// resources/js/Pages/Admin/ManajemenUser.jsx
import { Head, router } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPersonMilitaryPointing, faPeopleRoof, faUserTie,
    faUserPlus, faPencil, faTrash,
    faMagnifyingGlass, faChevronLeft, faChevronRight, faEye,
} from "@fortawesome/free-solid-svg-icons";

import AdminLayout  from "@/Layouts/AdminLayout";
import { StatCard } from "@/Components/Admin/StatCard";
import { RoleBadge, JenisKelaminBadge } from "@/Components/Admin/Badges";
import { AvatarInitial } from "@/Components/Admin/AvatarInitial";
import { DetailModal, UserModal, DeleteModal } from "@/Components/Admin/UserModals";
import { getFotoUrl } from "@/utils/supabase";

const ROLE_FILTERS = ["semua", "petugas", "supervisor", "warga"];

export default function ManajemenUser({ users, stats, auth, filters, supervisors }) {
    const [modalMode,  setModalMode]  = useState(null);   // "tambah" | "edit" | null
    const [editUser,   setEditUser]   = useState(null);
    const [deleteUser, setDeleteUser] = useState(null);
    const [detailUser, setDetailUser] = useState(null);
    const [search,     setSearch]     = useState(filters?.search ?? "");
    const [filterRole, setFilterRole] = useState(filters?.role   ?? "semua");
    const [processing, setProcessing] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    // Debounced search / filter
    const isFirstRender = useRef(true);
    const skipEffect   = useRef(false);
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        if (skipEffect.current)    { skipEffect.current = false;    return; } // ← tambah ini
        const timer = setTimeout(() => {
            router.get(
                route("admin.users.index"),
                { search, role: filterRole === "semua" ? "" : filterRole },
                { preserveState: true, replace: true }
            );
        }, 400);
        return () => clearTimeout(timer);
    }, [search, filterRole]);

    const resetFilters = () => {
        skipEffect.current = true; // ← tambah ini
        setSearch("");
        setFilterRole("semua");
    };

    // ── CRUD handlers ──
    const handleTambah = (formData) => {
        setProcessing(true);
        router.post(route("admin.users.store"), formData, {
            forceFormData: true,
            onSuccess: () => { setModalMode(null); setProcessing(false); setFormErrors({}); resetFilters(); },
            onError:   (e) => { setFormErrors(e); setProcessing(false); },
        });
    };

    const handleEdit = (formData) => {
        setProcessing(true);
        router.post(route("admin.users.update", editUser.id), formData, {
            forceFormData: true,
            onSuccess: () => { setModalMode(null); setEditUser(null); setProcessing(false); setFormErrors({}); resetFilters(); },
            onError:   (e) => { setFormErrors(e); setProcessing(false); },
        });
    };

    const handleDelete = () => {
        setProcessing(true);
        router.delete(route("admin.users.destroy", deleteUser.id), {
            onSuccess: () => { setDeleteUser(null); setProcessing(false); resetFilters(); },
            onFinish:  () => setProcessing(false),
        });
    };

    const openEdit = (user) => { setEditUser(user); setModalMode("edit"); setFormErrors({}); };

    // ── Stat cards ──
    const statCards = [
        {
            label: "Total Petugas",    value: stats?.petugas    ?? 0,
            blue: true,
            icon:   <FontAwesomeIcon icon={faPersonMilitaryPointing} style={{ fontSize: 26, color: "white" }} />,
            accent: "#fbbf24",
        },
        {
            label: "Total Supervisor", value: stats?.supervisor ?? 0,
            blue: false,
            icon:   <FontAwesomeIcon icon={faUserTie} style={{ fontSize: 26, color: "#005EA4" }} />,
            accent: "#005EA4",
        },
        {
            label: "Total Warga",      value: stats?.warga      ?? 0,
            blue: true,
            icon:   <FontAwesomeIcon icon={faPeopleRoof} style={{ fontSize: 26, color: "white" }} />,
            accent: "#34d399",
        },
    ];

    return (
        <>
            <Head title="Manajemen Pengguna" />
            <AdminLayout auth={auth} activeMenu="Manajemen Pengguna" title="Manajemen Pengguna">

                <div className="flex flex-col gap-3 flex-1 min-h-0">

                    {/* Stat Cards */}
                    <div className="grid grid-cols-3 gap-4 shrink-0">
                        {statCards.map((c) => <StatCard key={c.label} {...c} />)}
                    </div>

                    {/* Table Card */}
                    <div
                        className="flex-1 rounded-2xl overflow-hidden flex flex-col min-h-0 shadow-sm"
                        style={{ background: "white", border: "1.5px solid #c7e8f8" }}
                    >
                        {/* Toolbar */}
                        <div
                            className="px-5 py-3 shrink-0 flex items-center gap-3 flex-wrap"
                            style={{ borderBottom: "1.5px solid #e0f2fe" }}
                        >
                            <div className="flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#005EA4" strokeWidth="2">
                                    <circle cx="12" cy="8" r="4" />
                                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                </svg>
                                <h2 className="font-semibold text-sm" style={{ color: "#0F2A44" }}>Daftar Pengguna</h2>
                            </div>

                            {/* Search */}
                            <div className="relative min-w-[200px] max-w-xs">
                                <FontAwesomeIcon icon={faMagnifyingGlass}
                                    style={{ fontSize: 11, color: "#94a3b8", position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                                <input
                                    type="text" value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama atau email..."
                                    className="w-full text-xs rounded-xl pl-8 pr-3 py-2 outline-none"
                                    style={{ background: "#f8fafc", border: "1.5px solid #c7e8f8", color: "#0F2A44" }}
                                    onFocus={(e) => (e.target.style.borderColor = "#005EA4")}
                                    onBlur={(e)  => (e.target.style.borderColor = "#c7e8f8")}
                                />
                            </div>

                            {/* Role filter */}
                            <div className="flex items-center gap-1.5">
                                {ROLE_FILTERS.map((r) => (
                                    <button key={r} onClick={() => setFilterRole(r)}
                                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all"
                                        style={filterRole === r
                                            ? { background: "#005EA4", color: "white" }
                                            : { background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => { setModalMode("tambah"); setFormErrors({}); }}
                                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 shrink-0"
                                style={{ background: "#005EA4" }}
                            >
                                <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: 11 }} />
                                Tambah User Baru
                            </button>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-y-auto"
                            style={{ scrollbarWidth: "thin", scrollbarColor: "#b8dff0 transparent" }}>
                            <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
                                <colgroup>
                                    <col style={{ width: "18%" }} />
                                    <col style={{ width: "8%"  }} />
                                    <col style={{ width: "10%" }} />
                                    <col style={{ width: "10%" }} />
                                    <col style={{ width: "9%"  }} />
                                    <col style={{ width: "12%" }} />
                                    <col style={{ width: "14%" }} />
                                </colgroup>
                                <thead className="sticky top-0 z-10">
                                    <tr style={{ background: "#005EA4", color: "white" }}>
                                        {["Nama", "Jabatan", "Jenis Kelamin", "Email", "No. HP", "Alamat", "Aksi"].map((h, i) => (
                                            <th
                                                key={h}
                                                className={`px-3 py-3 font-semibold text-xs ${i === 0 || i === 5 ? "text-left px-5" : "text-center"}`}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!users?.data || users.data.length === 0) ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-xs" style={{ color: "#94a3b8" }}>
                                                <div className="flex flex-col items-center gap-2">
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c7e8f8" strokeWidth="1.5">
                                                        <circle cx="12" cy="8" r="4" />
                                                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                                    </svg>
                                                    Tidak ada data pengguna
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        users.data.map((user, i) => (
                                            <tr
                                                key={user.id}
                                                style={{
                                                    background:   i % 2 === 1 ? "#f0f9ff" : "white",
                                                    borderBottom: "1px solid #e0f2fe",
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = "#dbeeff")}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 1 ? "#f0f9ff" : "white")}
                                            >
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <AvatarInitial nama={user.nama} fotoUrl={getFotoUrl(user.foto_profil)} />
                                                        <p className="font-semibold text-xs truncate" style={{ color: "#0F2A44" }}>
                                                            {user.nama}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <RoleBadge role={user.role} />
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <JenisKelaminBadge value={user.jenis_kelamin} />
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="text-xs truncate block" style={{ color: "#475569" }}>
                                                        {user.email || <span style={{ color: "#cbd5e1" }}>—</span>}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className="text-xs" style={{ color: "#475569" }}>
                                                        {user.no_hp || <span style={{ color: "#cbd5e1" }}>—</span>}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className="text-xs truncate block" style={{ color: "#475569" }} title={user.alamat ?? ""}>
                                                        {user.alamat || <span style={{ color: "#cbd5e1" }}>—</span>}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button onClick={() => setDetailUser(user)}
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-105 transition-transform"
                                                            style={{ background: "#f0fdf4" }} title="Detail">
                                                            <FontAwesomeIcon icon={faEye} style={{ fontSize: 11, color: "#15803d" }} />
                                                        </button>
                                                        <button onClick={() => openEdit(user)}
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-105 transition-transform"
                                                            style={{ background: "#e0f2fe" }} title="Edit">
                                                            <FontAwesomeIcon icon={faPencil} style={{ fontSize: 11, color: "#005EA4" }} />
                                                        </button>
                                                        <button onClick={() => setDeleteUser(user)}
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-105 transition-transform"
                                                            style={{ background: "#fde8e8" }} title="Hapus">
                                                            <FontAwesomeIcon icon={faTrash} style={{ fontSize: 11, color: "#c0392b" }} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {users?.last_page > 1 && (
                            <div
                                className="px-5 py-3 shrink-0 flex items-center justify-between"
                                style={{ borderTop: "1.5px solid #e0f2fe" }}
                            >
                                <span className="text-xs" style={{ color: "#64748b" }}>
                                    Halaman{" "}
                                    <span className="font-semibold" style={{ color: "#0F2A44" }}>{users.current_page}</span>
                                    {" "}dari{" "}
                                    <span className="font-semibold" style={{ color: "#0F2A44" }}>{users.last_page}</span>
                                    <span className="ml-2" style={{ color: "#94a3b8" }}>({users.total} pengguna)</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => router.get(users.prev_page_url, {}, { preserveState: true })}
                                        disabled={!users.prev_page_url}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
                                        style={{ background: "#e0f2fe", color: "#005EA4" }}
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 10 }} />
                                    </button>
                                    {Array.from({ length: Math.min(users.last_page, 5) }, (_, i) => i + 1).map((page) => (
                                        <button key={page}
                                            onClick={() => router.get(route("admin.users.index"), { page }, { preserveState: true })}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold"
                                            style={page === users.current_page
                                                ? { background: "#005EA4", color: "white" }
                                                : { background: "#f1f5f9", color: "#64748b" }}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => router.get(users.next_page_url, {}, { preserveState: true })}
                                        disabled={!users.next_page_url}
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

            {/* Modals */}
            {detailUser && (
                <DetailModal
                    user={detailUser}
                    supervisors={supervisors}
                    onClose={() => setDetailUser(null)}
                    onEdit={openEdit}
                />
            )}
            {modalMode === "tambah" && (
                <UserModal
                    mode="tambah" user={null} supervisors={supervisors}
                    onClose={() => setModalMode(null)}
                    onSubmit={handleTambah}
                    processing={processing} errors={formErrors}
                />
            )}
            {modalMode === "edit" && editUser && (
                <UserModal
                    mode="edit" user={editUser} supervisors={supervisors}
                    onClose={() => { setModalMode(null); setEditUser(null); }}
                    onSubmit={handleEdit}
                    processing={processing} errors={formErrors}
                />
            )}
            {deleteUser && (
                <DeleteModal
                    user={deleteUser}
                    onClose={() => setDeleteUser(null)}
                    onConfirm={handleDelete}
                    processing={processing}
                />
            )}
        </>
    );
}