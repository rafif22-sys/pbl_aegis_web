// resources/js/Components/Admin/UserModals.jsx
import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUserPlus, faPencil, faTrash, faXmark, faEye, faEyeSlash,
    faUpload, faMars, faVenus, faIdCard, faPhone, faEnvelope,
    faMapMarkerAlt, faCake, faCalendarCheck, faUserShield, faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";

import { AvatarInitial }          from "@/Components/Admin/AvatarInitial";
import { RoleBadge, JenisKelaminBadge } from "@/Components/Admin/Badges";
import { FormInput, inputStyle }  from "@/Components/Admin/FormInput";
import { getFotoUrl }             from "@/utils/supabase";
import { normalizeDate, formatDateDisplay } from "@/utils/dateHelpers";

// ── Shared role colour map ────────────────────────────────
const roleMap = {
    admin:      { bg: "#dbeafe", color: "#1d4ed8", label: "Admin" },
    petugas:    { bg: "#dcfce7", color: "#15803d", label: "Petugas" },
    supervisor: { bg: "#fef9c3", color: "#a16207", label: "Supervisor" },
    warga:      { bg: "#e0f2fe", color: "#0369a1", label: "Warga" },
};

// ── Modal overlay wrapper ─────────────────────────────────
function ModalOverlay({ onClose, children, maxW = "max-w-md" }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,42,68,0.55)", backdropFilter: "blur(2px)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className={`w-full ${maxW} rounded-2xl overflow-hidden shadow-2xl flex flex-col`}
                style={{ background: "white", maxHeight: "90vh" }}
            >
                {children}
            </div>
        </div>
    );
}

// ── Modal header ──────────────────────────────────────────
function ModalHeader({ icon, title, onClose }) {
    return (
        <div
            className="px-6 py-4 flex items-center justify-between shrink-0"
            style={{ background: "#0F2A44" }}
        >
            <div className="flex items-center gap-2">
                <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(59,158,222,0.2)" }}
                >
                    <FontAwesomeIcon icon={icon} style={{ fontSize: 12, color: "#7dd3fc" }} />
                </div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
            </div>
            <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10"
            >
                <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14, color: "#90c4e8" }} />
            </button>
        </div>
    );
}

// ── DETAIL MODAL ──────────────────────────────────────────
export function DetailModal({ user, supervisors, onClose, onEdit }) {
    const fotoUrl        = getFotoUrl(user.foto_profil);
    const supervisorNama = supervisors?.find((s) => s.id === user.id_supervisor)?.nama ?? null;
    const roleInfo       = roleMap[user.role] ?? { bg: "#f1f5f9", color: "#475569", label: user.role };
    const isPetugasOrSupervisor = ["petugas", "supervisor"].includes(user.role);

    const DetailRow = ({ icon, label, value, accent }) => (
        <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: "1px solid #f0f9ff" }}>
            <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: accent ?? "#e0f2fe" }}
            >
                <FontAwesomeIcon
                    icon={icon}
                    style={{ fontSize: 11, color: accent ? "white" : "#005EA4" }}
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium" style={{ color: "#94a3b8" }}>{label}</p>
                <p
                    className="text-xs font-semibold mt-0.5 break-words"
                    style={{ color: value ? "#0F2A44" : "#cbd5e1" }}
                >
                    {value || "—"}
                </p>
            </div>
        </div>
    );

    return (
        <ModalOverlay onClose={onClose}>
            <ModalHeader icon={faIdCard} title="Detail Pengguna" onClose={onClose} />

            {/* Body */}
            <div
                className="flex-1 overflow-y-auto"
                style={{ scrollbarWidth: "thin", scrollbarColor: "#b8dff0 transparent" }}
            >
                {/* Profile hero */}
                <div
                    className="px-6 py-5 flex items-center gap-4"
                    style={{
                        background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
                        borderBottom: "1.5px solid #c7e8f8",
                    }}
                >
                    <AvatarInitial nama={user.nama} fotoUrl={fotoUrl} size="lg" />
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate" style={{ color: "#0F2A44" }}>{user.nama}</p>
                        <p className="text-[11px] mt-0.5 truncate" style={{ color: "#64748b" }}>{user.email}</p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span
                                className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full"
                                style={{ background: roleInfo.bg, color: roleInfo.color }}
                            >
                                {roleInfo.label}
                            </span>
                            {user.jenis_kelamin && <JenisKelaminBadge value={user.jenis_kelamin} />}
                        </div>
                    </div>
                </div>

                {/* Detail rows */}
                <div className="px-6 py-2">
                    <p className="text-[10px] font-bold tracking-widest mt-3 mb-1" style={{ color: "#94a3b8" }}>
                        INFORMASI KONTAK
                    </p>
                    <DetailRow icon={faEnvelope}     label="Email"  value={user.email} />
                    <DetailRow icon={faPhone}        label="No. HP" value={user.no_hp} />
                    <DetailRow icon={faMapMarkerAlt} label="Alamat" value={user.alamat} />

                    <p className="text-[10px] font-bold tracking-widest mt-4 mb-1" style={{ color: "#94a3b8" }}>
                        DATA PRIBADI
                    </p>
                    <DetailRow icon={faCake} label="Tanggal Lahir" value={formatDateDisplay(user.tanggal_lahir)} />

                    {isPetugasOrSupervisor && (
                        <>
                            <p className="text-[10px] font-bold tracking-widest mt-4 mb-1" style={{ color: "#94a3b8" }}>
                                DATA KEPEGAWAIAN
                            </p>
                            <DetailRow
                                icon={faCalendarCheck}
                                label="Tanggal Bergabung"
                                value={formatDateDisplay(user.tanggal_bergabung)}
                            />
                            {user.role === "supervisor" && (
                                <DetailRow
                                    icon={faLayerGroup}
                                    label="Wilayah Pengawasan"
                                    value={user.wilayah_pengawasan}
                                />
                            )}
                            {user.role === "petugas" && supervisorNama && (
                                <DetailRow
                                    icon={faUserShield}
                                    label="Supervisor Pengawas"
                                    value={supervisorNama}
                                />
                            )}
                        </>
                    )}
                </div>
                <div className="h-4" />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex gap-3 shrink-0" style={{ borderTop: "1.5px solid #e0f2fe" }}>
                <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-all"
                    style={{ background: "#f1f5f9", color: "#64748b", border: "1.5px solid #e2e8f0" }}
                >
                    Tutup
                </button>
                <button
                    onClick={() => { onClose(); onEdit(user); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    style={{ background: "#005EA4" }}
                >
                    <FontAwesomeIcon icon={faPencil} style={{ fontSize: 11 }} />
                    Edit Data
                </button>
            </div>
        </ModalOverlay>
    );
}

// ── USER FORM MODAL (Tambah / Edit) ───────────────────────
export function UserModal({ mode, user, supervisors, onClose, onSubmit, processing, errors }) {
    const [showPass, setShowPass]       = useState(false);
    const [previewFoto, setPreviewFoto] = useState(
        user?.foto_profil ? getFotoUrl(user.foto_profil) : null
    );
    const [fotoError, setFotoError]     = useState(null);
    const fileRef = useRef(null);

    const [formData, setFormData] = useState({
        nama:                  user?.nama               ?? "",
        email:                 user?.email              ?? "",
        role:                  user?.role               ?? "petugas",
        jenis_kelamin:         user?.jenis_kelamin      ?? "",
        alamat:                user?.alamat             ?? "",
        no_hp:                 user?.no_hp              ?? "",
        tanggal_lahir:         normalizeDate(user?.tanggal_lahir),
        tanggal_bergabung:     normalizeDate(user?.tanggal_bergabung),
        wilayah_pengawasan:    user?.wilayah_pengawasan ?? "",
        id_supervisor:         user?.id_supervisor      ?? "",
        foto_profil:           null,
        password:              "",
        password_confirmation: "",
    });

    const set = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));

    useEffect(() => {
        if (formData.role !== "supervisor") set("wilayah_pengawasan", "");
        if (formData.role !== "petugas")    set("id_supervisor", "");
    }, [formData.role]);

    const isPetugasOrSupervisor = ["petugas", "supervisor"].includes(formData.role);

    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        set("foto_profil", file);
        setPreviewFoto(URL.createObjectURL(file));
        setFotoError(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === "tambah" && !formData.foto_profil) {
            setFotoError("Foto profil wajib diunggah.");
            fileRef.current?.focus();
            return;
        }
        const fd = new FormData();
        Object.entries(formData).forEach(([k, v]) => {
            if (k === "foto_profil") {
                if (v !== null) fd.append(k, v);
            } else if (k === "password" || k === "password_confirmation") {
                if (v !== "") fd.append(k, v);
            } else {
                fd.append(k, v ?? "");
            }
        });
        if (mode === "edit") fd.append("_method", "PUT");
        onSubmit(fd);
    };

    const roleOptions = [
        { value: "petugas",    label: "Petugas" },
        { value: "supervisor", label: "Supervisor" },
        { value: "warga",      label: "Warga" },
    ];

    const ic          = "rounded-xl px-3 py-2.5 text-sm outline-none transition-all w-full";
    const fotoErrorMsg = errors?.foto_profil ?? fotoError;

    return (
        <ModalOverlay onClose={onClose} maxW="max-w-2xl">
            <ModalHeader
                icon={mode === "tambah" ? faUserPlus : faPencil}
                title={mode === "tambah" ? "Tambah User Baru" : "Edit Data User"}
                onClose={onClose}
            />

            <form
                onSubmit={handleSubmit}
                encType="multipart/form-data"
                className="flex-1 overflow-y-auto p-6 flex flex-col gap-5"
                style={{ scrollbarWidth: "thin", scrollbarColor: "#b8dff0 transparent" }}
            >
                {/* Foto */}
                <FormInput label="Foto Profil" required={mode === "tambah"} error={fotoErrorMsg}>
                    <div className="flex items-center gap-4">
                        <div
                            className="w-20 h-20 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                            style={{
                                background: "#e0f2fe",
                                border: `1.5px solid ${fotoErrorMsg ? "#ef4444" : "#c7e8f8"}`,
                            }}
                        >
                            {previewFoto
                                ? <img src={previewFoto} alt="preview" className="w-full h-full object-cover" />
                                : <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                                    stroke={fotoErrorMsg ? "#ef4444" : "#94a3b8"} strokeWidth="1.5">
                                    <circle cx="12" cy="8" r="4" />
                                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                  </svg>
                            }
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-80"
                                style={{
                                    background: fotoErrorMsg ? "#fef2f2" : "#e0f2fe",
                                    color:      fotoErrorMsg ? "#ef4444" : "#005EA4",
                                    border:     `1.5px solid ${fotoErrorMsg ? "#ef4444" : "#c7e8f8"}`,
                                }}
                            >
                                <FontAwesomeIcon icon={faUpload} style={{ fontSize: 11 }} />
                                {previewFoto ? "Ganti Foto" : "Pilih Foto"}
                            </button>
                            <p className="text-[10px]" style={{ color: "#94a3b8" }}>
                                Format: JPG, PNG, WEBP • Maksimal 2MB
                                {mode === "tambah" && <span style={{ color: "#ef4444" }}> — wajib diisi</span>}
                            </p>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/jpg,image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleFotoChange}
                            />
                        </div>
                    </div>
                </FormInput>

                {/* Nama & Email */}
                <div className="grid grid-cols-2 gap-4">
                    <FormInput label="Nama Lengkap" required error={errors?.nama}>
                        <input type="text" value={formData.nama}
                            onChange={(e) => set("nama", e.target.value)}
                            placeholder="Masukkan nama lengkap"
                            className={ic} style={inputStyle(errors?.nama)} />
                    </FormInput>
                    <FormInput label="Email" required error={errors?.email}>
                        <input type="email" value={formData.email}
                            onChange={(e) => set("email", e.target.value)}
                            placeholder="contoh@email.com"
                            className={ic} style={inputStyle(errors?.email)} />
                    </FormInput>
                </div>

                {/* Jenis Kelamin */}
                <FormInput label="Jenis Kelamin" error={errors?.jenis_kelamin}>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { value: "laki-laki", label: "Laki-laki", icon: faMars,  active: "#dbeafe", activeText: "#1d4ed8" },
                            { value: "perempuan", label: "Perempuan", icon: faVenus, active: "#fce7f3", activeText: "#be185d" },
                        ].map((opt) => {
                            const isSelected = formData.jenis_kelamin === opt.value;
                            return (
                                <button key={opt.value} type="button"
                                    onClick={() => set("jenis_kelamin", isSelected ? "" : opt.value)}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                    style={isSelected
                                        ? { background: opt.active, color: opt.activeText, border: `1.5px solid ${opt.activeText}` }
                                        : { background: "#f8fafc", color: "#64748b", border: "1.5px solid #c7e8f8" }}
                                >
                                    <FontAwesomeIcon icon={opt.icon} style={{ fontSize: 13 }} />
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </FormInput>

                {/* Tanggal Lahir */}
                <FormInput label="Tanggal Lahir" error={errors?.tanggal_lahir}>
                    <input type="date" value={formData.tanggal_lahir}
                        onChange={(e) => set("tanggal_lahir", e.target.value)}
                        className={ic} style={inputStyle(errors?.tanggal_lahir)} />
                </FormInput>

                {/* No HP */}
                <FormInput label="No. HP" error={errors?.no_hp}>
                    <input type="text" value={formData.no_hp}
                        onChange={(e) => set("no_hp", e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className={ic} style={inputStyle(errors?.no_hp)} />
                </FormInput>

                {/* Alamat */}
                <FormInput label="Alamat" error={errors?.alamat}>
                    <input type="text" value={formData.alamat}
                        onChange={(e) => set("alamat", e.target.value)}
                        placeholder="Masukkan alamat lengkap"
                        className={ic} style={inputStyle(errors?.alamat)} />
                </FormInput>

                {/* Role */}
                <FormInput label="Jabatan / Role" required error={errors?.role}>
                    <div className="grid grid-cols-3 gap-3">
                        {roleOptions.map((r) => (
                            <button key={r.value} type="button"
                                onClick={() => set("role", r.value)}
                                className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                                style={formData.role === r.value
                                    ? { background: "#005EA4", color: "white", border: "1.5px solid #005EA4" }
                                    : { background: "#f8fafc", color: "#64748b", border: "1.5px solid #c7e8f8" }}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </FormInput>

                {/* Tanggal Bergabung */}
                {isPetugasOrSupervisor && (
                    <FormInput label="Tanggal Bergabung" required error={errors?.tanggal_bergabung}>
                        <input type="date" value={formData.tanggal_bergabung}
                            onChange={(e) => set("tanggal_bergabung", e.target.value)}
                            className={ic} style={inputStyle(errors?.tanggal_bergabung)} />
                    </FormInput>
                )}

                {/* Supervisor */}
                {formData.role === "petugas" && (
                    <FormInput label="Supervisor Pengawas" required error={errors?.id_supervisor}>
                        <select value={formData.id_supervisor}
                            onChange={(e) => set("id_supervisor", e.target.value)}
                            className={ic} style={inputStyle(errors?.id_supervisor)}>
                            <option value="">— Pilih Supervisor —</option>
                            {(supervisors ?? []).map((s) => (
                                <option key={s.id} value={s.id}>{s.nama}</option>
                            ))}
                        </select>
                    </FormInput>
                )}

                {/* Wilayah */}
                {formData.role === "supervisor" && (
                    <FormInput label="Wilayah Pengawasan" required error={errors?.wilayah_pengawasan}>
                        <input type="text" value={formData.wilayah_pengawasan}
                            onChange={(e) => set("wilayah_pengawasan", e.target.value)}
                            placeholder="Contoh: Blok A"
                            className={ic} style={inputStyle(errors?.wilayah_pengawasan)} />
                    </FormInput>
                )}

                {/* Password */}
                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        label={mode === "edit" ? "Password Baru (opsional)" : "Password"}
                        required={mode === "tambah"}
                        error={errors?.password}
                    >
                        <div className="relative">
                            <input type={showPass ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) => set("password", e.target.value)}
                                placeholder={mode === "edit" ? "Kosongkan jika tidak diubah" : "Min. 8 karakter"}
                                className={ic + " pr-10"} style={inputStyle(errors?.password)} />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: "#94a3b8" }}>
                                <FontAwesomeIcon icon={showPass ? faEyeSlash : faEye} style={{ fontSize: 13 }} />
                            </button>
                        </div>
                    </FormInput>
                    <FormInput label="Konfirmasi Password" error={errors?.password_confirmation}>
                        <input type={showPass ? "text" : "password"}
                            value={formData.password_confirmation}
                            onChange={(e) => set("password_confirmation", e.target.value)}
                            placeholder="Ulangi password"
                            className={ic} style={inputStyle(errors?.password_confirmation)} />
                    </FormInput>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                    <button type="button" onClick={onClose}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold hover:opacity-80"
                        style={{ background: "#f1f5f9", color: "#64748b", border: "1.5px solid #e2e8f0" }}>
                        Batal
                    </button>
                    <button type="submit" disabled={processing}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        style={{ background: "#005EA4" }}>
                        {processing
                            ? <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Menyimpan...
                              </span>
                            : mode === "tambah" ? "Tambah User" : "Simpan Perubahan"
                        }
                    </button>
                </div>
            </form>
        </ModalOverlay>
    );
}

// ── DELETE MODAL ──────────────────────────────────────────
export function DeleteModal({ user, onClose, onConfirm, processing }) {
    return (
        <ModalOverlay onClose={onClose} maxW="max-w-sm">
            <div className="p-6 flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#fde8e8" }}>
                    <FontAwesomeIcon icon={faTrash} style={{ fontSize: 22, color: "#c0392b" }} />
                </div>
                <div>
                    <h3 className="font-bold text-base" style={{ color: "#0F2A44" }}>Hapus User?</h3>
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#64748b" }}>
                        Anda akan menghapus akun{" "}
                        <span className="font-semibold" style={{ color: "#0F2A44" }}>{user?.nama}</span>.
                        Tindakan ini tidak dapat dibatalkan.
                    </p>
                </div>
                <div className="flex gap-2 w-full">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80"
                        style={{ background: "#f1f5f9", color: "#64748b", border: "1.5px solid #e2e8f0" }}>
                        Batal
                    </button>
                    <button onClick={onConfirm} disabled={processing}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        style={{ background: "#c0392b" }}>
                        {processing ? "Menghapus..." : "Ya, Hapus"}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}