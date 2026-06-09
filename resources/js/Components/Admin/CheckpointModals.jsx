// resources/js/Components/Admin/CheckpointModals.jsx

import { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus, faPencil, faTrash, faXmark, faLocationDot,
} from "@fortawesome/free-solid-svg-icons";

import { MapPicker }           from "@/Components/Admin/MapPicker";
import { FormInput, inputStyle } from "@/Components/Admin/FormInput";

// ── Shared colour tokens ──────────────────────────────────
const C = {
    navy:      "#0F2A44",
    blue:      "#005EA4",
    blueSoft:  "#e0f2fe",
    blueText:  "#90c4e8",
    red:       "#c0392b",
    redSoft:   "#fde8e8",
    slate:     "#64748b",
    border:    "#e2e8f0",
    blueBorder:"#c7e8f8",
};

const ic = "rounded-xl px-3 py-2.5 text-sm outline-none transition-all w-full";

// ── Reusable modal overlay ────────────────────────────────
function Overlay({ onClose, disabled, children, maxW = "max-w-2xl" }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,42,68,0.6)", backdropFilter: "blur(2px)" }}
            onClick={(e) => e.target === e.currentTarget && !disabled && onClose()}
        >
            <div
                className={`w-full ${maxW} rounded-2xl overflow-hidden shadow-2xl flex flex-col`}
                style={{ background: "white", maxHeight: "92vh" }}
            >
                {children}
            </div>
        </div>
    );
}

// ── Modal header ──────────────────────────────────────────
function ModalHeader({ icon, title, subtitle, onClose, disabled }) {
    return (
        <div
            className="px-6 py-4 flex items-center justify-between shrink-0"
            style={{ background: C.navy }}
        >
            <div className="flex items-center gap-2.5">
                <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(59,158,222,0.2)" }}
                >
                    <FontAwesomeIcon icon={icon} style={{ fontSize: 13, color: "#7dd3fc" }} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white leading-none">{title}</h3>
                    {subtitle && (
                        <p className="text-[10px] mt-0.5" style={{ color: C.blueText }}>{subtitle}</p>
                    )}
                </div>
            </div>
            <button
                onClick={onClose}
                disabled={disabled}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10"
            >
                <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14, color: "#90c4e8" }} />
            </button>
        </div>
    );
}

// ── CHECKPOINT MODAL (Tambah / Edit) ─────────────────────
/**
 * Props:
 *   mode       — "tambah" | "edit"
 *   checkpoint — data checkpoint yang akan diedit (null saat tambah)
 *   onClose    — callback tutup modal
 *   onSubmit(formData, onSuccess, onError) — callback kirim data
 *
 * Catatan: ID checkpoint di-generate otomatis oleh backend,
 * tidak perlu dikirim dari form maupun ditampilkan di header.
 */
export function CheckpointModal({ mode, checkpoint, onClose, onSubmit }) {
    const [processing, setProcessing] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const [formData, setFormData] = useState({
        nama:      checkpoint?.nama      ?? "",
        latitude:  checkpoint?.latitude  ?? "",
        longitude: checkpoint?.longitude ?? "",
    });

    const set = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));

    const handleMapPick = useCallback((lat, lng) => {
        set("latitude",  lat);
        set("longitude", lng);
    }, []);

    const validate = () => {
        const errs = {};
        if (!formData.nama.trim()) errs.nama      = "Nama checkpoint wajib diisi.";
        if (!formData.latitude)    errs.latitude  = "Latitude wajib diisi (klik peta atau isi manual).";
        if (!formData.longitude)   errs.longitude = "Longitude wajib diisi (klik peta atau isi manual).";
        return errs;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setFormErrors(errs); return; }

        setProcessing(true);
        onSubmit(
            formData,
            ()       => { setProcessing(false); setFormErrors({}); },
            (errors) => { setProcessing(false); setFormErrors(errors); }
        );
    };

    return (
        <Overlay onClose={onClose} disabled={processing}>
            <ModalHeader
                icon={mode === "tambah" ? faPlus : faPencil}
                title={mode === "tambah" ? "Tambah Checkpoint Baru" : "Edit Checkpoint"}
                subtitle={mode === "edit" && checkpoint?.nama ? `Mengedit: ${checkpoint.nama}` : null}
                onClose={onClose}
                disabled={processing}
            />

            <form
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto p-5 flex flex-col gap-4"
                style={{ scrollbarWidth: "thin", scrollbarColor: "#b8dff0 transparent" }}
            >
                {/* Map Picker */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: C.navy }}>
                        Pilih Lokasi di Peta <span style={{ color: "#ef4444" }}>*</span>
                        <span className="ml-2 font-normal" style={{ color: C.slate }}>
                            — klik pada peta untuk menentukan titik
                        </span>
                    </label>
                    <MapPicker
                        lat={formData.latitude}
                        lng={formData.longitude}
                        onPick={handleMapPick}
                        height={240}
                        interactive
                    />
                    {(formData.latitude || formData.longitude) && (
                        <p
                            className="text-[11px] px-3 py-1.5 rounded-lg"
                            style={{ background: C.blueSoft, color: C.blue }}
                        >
                            📍 {formData.latitude}, {formData.longitude}
                        </p>
                    )}
                </div>

                {/* Nama */}
                <FormInput label="Nama Checkpoint" required error={formErrors?.nama}>
                    <input
                        type="text"
                        value={formData.nama}
                        onChange={(e) => set("nama", e.target.value)}
                        placeholder="Contoh: Gedung Lama Timur, Gerbang Timur..."
                        className={ic}
                        style={inputStyle(formErrors?.nama)}
                    />
                </FormInput>

                {/* Koordinat manual */}
                <div className="grid grid-cols-2 gap-3">
                    <FormInput label="Latitude" required error={formErrors?.latitude}>
                        <input
                            type="number" step="any"
                            value={formData.latitude}
                            onChange={(e) => set("latitude", e.target.value)}
                            placeholder="-7.005100"
                            className={ic}
                            style={inputStyle(formErrors?.latitude)}
                        />
                    </FormInput>
                    <FormInput label="Longitude" required error={formErrors?.longitude}>
                        <input
                            type="number" step="any"
                            value={formData.longitude}
                            onChange={(e) => set("longitude", e.target.value)}
                            placeholder="110.438100"
                            className={ic}
                            style={inputStyle(formErrors?.longitude)}
                        />
                    </FormInput>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                    <button
                        type="button" onClick={onClose} disabled={processing}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold hover:opacity-80 disabled:opacity-50"
                        style={{ background: "#f1f5f9", color: C.slate, border: `1.5px solid ${C.border}` }}
                    >
                        Batal
                    </button>
                    <button
                        type="submit" disabled={processing}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        style={{ background: C.blue }}
                    >
                        {processing
                            ? <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Menyimpan...
                              </span>
                            : mode === "tambah" ? "Simpan Checkpoint" : "Simpan Perubahan"
                        }
                    </button>
                </div>
            </form>
        </Overlay>
    );
}

// ── CHECKPOINT DELETE MODAL ───────────────────────────────
/**
 * Props:
 *   checkpoint        — data checkpoint yang akan dihapus
 *   onClose           — callback tutup modal
 *   onConfirm(onFinish) — callback konfirmasi hapus
 */
export function CheckpointDeleteModal({ checkpoint, onClose, onConfirm }) {
    const [processing, setProcessing] = useState(false);

    const handleConfirm = () => {
        setProcessing(true);
        onConfirm(() => setProcessing(false));
    };

    return (
        <Overlay onClose={onClose} disabled={processing} maxW="max-w-sm">
            <div className="p-6 flex flex-col items-center gap-4 text-center">
                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: C.redSoft }}
                >
                    <FontAwesomeIcon icon={faTrash} style={{ fontSize: 22, color: C.red }} />
                </div>
                <div>
                    <h3 className="font-bold text-base" style={{ color: C.navy }}>Hapus Checkpoint?</h3>
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.slate }}>
                        Anda akan menghapus checkpoint{" "}
                        <span className="font-semibold" style={{ color: C.navy }}>
                            {checkpoint?.nama}
                        </span>.{" "}
                        Tindakan ini tidak dapat dibatalkan.
                    </p>
                </div>
                <div className="flex gap-2 w-full">
                    <button
                        onClick={onClose} disabled={processing}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 disabled:opacity-50"
                        style={{ background: "#f1f5f9", color: C.slate, border: `1.5px solid ${C.border}` }}
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleConfirm} disabled={processing}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        style={{ background: C.red }}
                    >
                        {processing ? "Menghapus..." : "Ya, Hapus"}
                    </button>
                </div>
            </div>
        </Overlay>
    );
}