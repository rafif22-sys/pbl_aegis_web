// resources/js/Components/Admin/PosJagaModals.jsx
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus, faPencil, faTrash, faXmark,
    faCircleInfo, faFloppyDisk,
} from "@fortawesome/free-solid-svg-icons";
import { FormInput, inputStyle } from "./FormInput";

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

const ic = "rounded-xl px-3 py-2.5 text-sm outline-none transition-all w-full";
const iStyle = (err) => ({
    background: C.slateLight,
    border: `1.5px solid ${err ? "#ef4444" : C.blueBorder}`,
    color: C.navy,
});

export function PosJagaModal({ mode, pos, onClose, onSubmit, processing, errors }) {
    const [form, setForm] = useState({
        nama:      pos?.nama      ?? "",
        alamat:    pos?.alamat    ?? "",
        latitude:  pos?.latitude  ?? "",
        longitude: pos?.longitude ?? "",
    });
    const [localErrors, setLocalErrors] = useState({});
    const allErrors = { ...localErrors, ...errors };

    const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

    const handleSubmit = () => {
        const errs = {};
        if (!form.nama.trim())  errs.nama      = "Nama wajib diisi.";
        if (!form.alamat.trim()) errs.alamat    = "Alamat wajib diisi.";
        if (!form.latitude)     errs.latitude   = "Latitude wajib diisi.";
        if (!form.longitude)    errs.longitude  = "Longitude wajib diisi.";
        if (Object.keys(errs).length) { setLocalErrors(errs); return; }
        setLocalErrors({});
        onSubmit(form);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,42,68,0.65)", backdropFilter: "blur(3px)" }}
            onClick={(e) => e.target === e.currentTarget && !processing && onClose()}>
            <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                style={{ background: "white", maxHeight: "92vh" }}>

                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between shrink-0"
                    style={{ background: C.navy }}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(96,165,250,0.15)" }}>
                            <FontAwesomeIcon icon={mode === "tambah" ? faPlus : faPencil}
                                style={{ fontSize: 13, color: "#7dd3fc" }} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white leading-none">
                                {mode === "tambah" ? "Tambah Pos Jaga" : "Edit Pos Jaga"}
                            </h3>
                            <p className="text-[10px] mt-0.5" style={{ color: "#90c4e8" }}>
                                {mode === "tambah" ? "Isi detail pos jaga baru" : `Mengubah: ${pos?.nama}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={processing}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all">
                        <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14, color: "#90c4e8" }} />
                    </button>
                </div>
                <div className="h-1 shrink-0"
                    style={{ background: "linear-gradient(90deg, #005EA4, #38bdf8)" }} />

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4"
                    style={{ scrollbarWidth: "thin", scrollbarColor: "#b8dff0 transparent" }}>

                    <FormInput label="Nama Pos Jaga" required error={allErrors?.nama}>
                        <input type="text" value={form.nama} onChange={set("nama")}
                            placeholder="Contoh: Pos Jaga Blok A"
                            className={ic} style={iStyle(allErrors?.nama)}
                            onFocus={(e) => (e.target.style.borderColor = C.blue)}
                            onBlur={(e)  => (e.target.style.borderColor = allErrors?.nama ? "#ef4444" : C.blueBorder)}
                        />
                    </FormInput>

                    <FormInput label="Alamat" required error={allErrors?.alamat}>
                        <textarea value={form.alamat} onChange={set("alamat")}
                            placeholder="Contoh: Jl. Raya Utara No. 12, RT 03/RW 04"
                            rows={2} className={ic}
                            style={{ ...iStyle(allErrors?.alamat), resize: "none" }}
                            onFocus={(e) => (e.target.style.borderColor = C.blue)}
                            onBlur={(e)  => (e.target.style.borderColor = allErrors?.alamat ? "#ef4444" : C.blueBorder)}
                        />
                    </FormInput>

                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                        style={{ background: "#f0f9ff", border: `1px solid ${C.blueBorder}` }}>
                        <FontAwesomeIcon icon={faCircleInfo}
                            style={{ fontSize: 11, color: C.blue, marginTop: 1, flexShrink: 0 }} />
                        <p className="text-[10px] leading-relaxed" style={{ color: C.slate }}>
                            Koordinat bisa didapat dari Google Maps — klik lokasi lalu salin angka latitude &amp; longitude.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <FormInput label="Latitude" required error={allErrors?.latitude}>
                            <input type="number" step="any" value={form.latitude} onChange={set("latitude")}
                                placeholder="-7.01234"
                                className={ic} style={iStyle(allErrors?.latitude)}
                                onFocus={(e) => (e.target.style.borderColor = C.blue)}
                                onBlur={(e)  => (e.target.style.borderColor = allErrors?.latitude ? "#ef4444" : C.blueBorder)}
                            />
                        </FormInput>
                        <FormInput label="Longitude" required error={allErrors?.longitude}>
                            <input type="number" step="any" value={form.longitude} onChange={set("longitude")}
                                placeholder="110.43210"
                                className={ic} style={iStyle(allErrors?.longitude)}
                                onFocus={(e) => (e.target.style.borderColor = C.blue)}
                                onBlur={(e)  => (e.target.style.borderColor = allErrors?.longitude ? "#ef4444" : C.blueBorder)}
                            />
                        </FormInput>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} disabled={processing}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 disabled:opacity-50 transition-all"
                            style={{ background: "#f1f5f9", color: C.slate, border: `1.5px solid ${C.border}` }}>
                            Batal
                        </button>
                        <button onClick={handleSubmit} disabled={processing}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            style={{ background: C.blue }}>
                            {processing
                                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menyimpan...</>
                                : <><FontAwesomeIcon icon={faFloppyDisk} style={{ fontSize: 11 }} /> {mode === "tambah" ? "Simpan" : "Simpan Perubahan"}</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function DeleteModal({ pos, onClose, onConfirm, processing }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,42,68,0.65)", backdropFilter: "blur(3px)" }}
            onClick={(e) => e.target === e.currentTarget && !processing && onClose()}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: "white" }}>
                <div className="p-6 flex flex-col items-center gap-4 text-center">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: C.redSoft }}>
                            <FontAwesomeIcon icon={faTrash} style={{ fontSize: 24, color: C.red }} />
                        </div>
                        <div className="absolute -inset-1.5 rounded-2xl border-2 border-dashed opacity-30"
                            style={{ borderColor: C.red }} />
                    </div>
                    <div>
                        <h3 className="font-bold text-base" style={{ color: C.navy }}>Hapus Pos Jaga?</h3>
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.slate }}>
                            Anda akan menghapus{" "}
                            <span className="font-semibold" style={{ color: C.navy }}>"{pos?.nama}"</span>.{" "}
                            Tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>
                    <div className="flex gap-2 w-full">
                        <button onClick={onClose} disabled={processing}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 disabled:opacity-50"
                            style={{ background: "#f1f5f9", color: C.slate, border: `1.5px solid ${C.border}` }}>
                            Batal
                        </button>
                        <button onClick={onConfirm} disabled={processing}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                            style={{ background: C.red }}>
                            {processing ? "Menghapus..." : "Ya, Hapus"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
