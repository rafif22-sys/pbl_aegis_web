// resources/js/Components/Admin/RuteModals.jsx
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus, faPencil, faTrash, faXmark,
    faRoute, faLocationDot, faGripVertical,
    faArrowUp, faArrowDown
} from "@fortawesome/free-solid-svg-icons";
import { FormInput, inputStyle } from "./FormInput";

// Design tokens
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

const ic = "rounded-xl px-3 py-2.5 text-sm outline-none transition-all w-full";
const inputCls = (hasError) => ({
    background: C.slateLight,
    border: `1.5px solid ${hasError ? "#ef4444" : C.blueBorder}`,
    color: C.navy,
});

export function DetailModal({ rute, ruteIndex, onClose, onEdit }) {
    const color = getRouteColor(ruteIndex);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,42,68,0.6)", backdropFilter: "blur(2px)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                style={{ background: "white", maxHeight: "85vh" }}
            >
                <div className="px-6 py-4 flex items-center justify-between shrink-0"
                    style={{ background: C.navy }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(59,158,222,0.2)" }}>
                            <FontAwesomeIcon icon={faRoute} style={{ fontSize: 12, color: "#7dd3fc" }} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white leading-none">{rute.nama_rute}</h3>
                            <p className="text-[10px] mt-0.5" style={{ color: C.blueText }}>
                                {rute.checkpoint?.length ?? 0} checkpoint
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10">
                        <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14, color: "#90c4e8" }} />
                    </button>
                </div>

                <div className="h-1 shrink-0" style={{ background: color }} />

                <div className="flex-1 overflow-y-auto px-5 py-4"
                    style={{ scrollbarWidth: "thin", scrollbarColor: "#b8dff0 transparent" }}>
                    {(!rute.checkpoint || rute.checkpoint.length === 0) ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-xs" style={{ color: "#94a3b8" }}>
                            <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: 24, color: C.blueBorder }} />
                            Belum ada checkpoint di rute ini
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {rute.checkpoint.map((cp, idx) => (
                                <div key={cp.id}
                                    className="flex items-center gap-3 p-3 rounded-xl"
                                    style={{ background: idx % 2 === 0 ? C.blueSoft : "#f0f9ff", border: `1px solid ${C.blueBorder}` }}>
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs text-white"
                                        style={{ background: color }}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate" style={{ color: C.navy }}>{cp.nama}</p>
                                        <p className="text-[10px] font-mono mt-0.5" style={{ color: C.slate }}>
                                            {parseFloat(cp.latitude).toFixed(5)}, {parseFloat(cp.longitude).toFixed(5)}
                                        </p>
                                    </div>
                                    {idx < rute.checkpoint.length - 1 && (
                                        <FontAwesomeIcon icon={faArrowDown}
                                            style={{ fontSize: 9, color: C.blueBorder }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-5 py-4 flex gap-3 shrink-0"
                    style={{ borderTop: `1.5px solid ${C.blueBorder}` }}>
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-all"
                        style={{ background: "#f1f5f9", color: C.slate, border: `1.5px solid ${C.border}` }}>
                        Tutup
                    </button>
                    <button onClick={() => { onClose(); onEdit(); }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        style={{ background: C.blue }}>
                        <FontAwesomeIcon icon={faPencil} style={{ fontSize: 11 }} />
                        Edit Rute
                    </button>
                </div>
            </div>
        </div>
    );
}

function hitungJarak(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) *
              Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function RuteModal({ mode, rute, allCheckpoints, onClose, onSubmit }) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [namaRute, setNamaRute] = useState(rute?.nama_rute ?? "");

    const initSelected = () => {
        if (!rute?.checkpoint?.length) return [];
        return [...rute.checkpoint]
            .sort((a, b) => (a.pivot?.urutan ?? 0) - (b.pivot?.urutan ?? 0))
            .map(cp => cp.id);
    };

    const [selected, setSelected] = useState(initSelected);
    // eslint-disable-next-line no-unused-vars
    const [dragIdx, setDragIdx] = useState(null);

    const available = (allCheckpoints ?? []).filter(cp => !selected.includes(cp.id));
    const selectedDetails = selected.map(id => (allCheckpoints ?? []).find(cp => cp.id === id)).filter(Boolean);

    const addCp = (id) => {
        if (selected.length === 0) {
            setSelected(prev => [...prev, id]);
            return;
        }

        // Cek jarak dengan checkpoint terakhir
        const lastId = selected[selected.length - 1];
        const lastCp = (allCheckpoints ?? []).find(cp => cp.id === lastId);
        const newCp  = (allCheckpoints ?? []).find(cp => cp.id === id);

        if (lastCp && newCp) {
            const jarak = hitungJarak(
                parseFloat(lastCp.latitude),  parseFloat(lastCp.longitude),
                parseFloat(newCp.latitude),   parseFloat(newCp.longitude),
            );
            if (jarak > 500) {
                setErrors(prev => ({
                    ...prev,
                    checkpoints: `Jarak antara "${lastCp.nama}" dan "${newCp.nama}" terlalu jauh (${Math.round(jarak)} m). Maksimal 500 m.`,
                }));
                return;
            }
        }

        setErrors(prev => ({ ...prev, checkpoints: undefined }));
        setSelected(prev => [...prev, id]);
    };
    const removeCp = (id) => setSelected(prev => prev.filter(x => x !== id));
    const validateUrutan = (newSelected) => {
        const details = newSelected.map(id => (allCheckpoints ?? []).find(cp => cp.id === id)).filter(Boolean);
        for (let i = 0; i < details.length - 1; i++) {
            const a = details[i], b = details[i + 1];
            const jarak = hitungJarak(
                parseFloat(a.latitude), parseFloat(a.longitude),
                parseFloat(b.latitude), parseFloat(b.longitude),
            );
            if (jarak > 500) {
                setErrors(prev => ({
                    ...prev,
                    checkpoints: `Jarak antara "${a.nama}" dan "${b.nama}" terlalu jauh (${Math.round(jarak)} m). Maksimal 500 m.`,
                }));
                return false;
            }
        }
        setErrors(prev => ({ ...prev, checkpoints: undefined }));
        return true;
    };

    const moveUp = (idx) => {
        if (idx === 0) return;
        const a = [...selected];
        [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]];
        if (validateUrutan(a)) setSelected(a);
    };

    const moveDown = (idx) => {
        if (idx === selected.length - 1) return;
        const a = [...selected];
        [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]];
        if (validateUrutan(a)) setSelected(a);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = {};
        if (!namaRute.trim()) errs.nama_rute = "Nama rute wajib diisi.";
        if (!selected.length) errs.checkpoints = "Pilih minimal satu checkpoint.";
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setProcessing(true);
        onSubmit(
            { nama_rute: namaRute, checkpoints: selected },
            () => { setProcessing(false); setErrors({}); },
            (e) => { setProcessing(false); setErrors(e); }
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,42,68,0.6)", backdropFilter: "blur(2px)" }}
            onClick={(e) => e.target === e.currentTarget && !processing && onClose()}
        >
            <div
                className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                style={{ background: "white", maxHeight: "92vh" }}
            >
                <div className="px-6 py-4 flex items-center justify-between shrink-0"
                    style={{ background: C.navy }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(59,158,222,0.2)" }}>
                            <FontAwesomeIcon icon={mode === "tambah" ? faPlus : faPencil}
                                style={{ fontSize: 12, color: "#7dd3fc" }} />
                        </div>
                        <h3 className="text-sm font-semibold text-white">
                            {mode === "tambah" ? "Tambah Rute Baru" : "Edit Rute"}
                        </h3>
                    </div>
                    <button onClick={onClose} disabled={processing}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10">
                        <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14, color: "#90c4e8" }} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto p-5 flex flex-col gap-5"
                    style={{ scrollbarWidth: "thin", scrollbarColor: "#b8dff0 transparent" }}>

                    <FormInput label="Nama Rute" required error={errors?.nama_rute}>
                        <input
                            type="text"
                            value={namaRute}
                            onChange={(e) => setNamaRute(e.target.value)}
                            placeholder="Contoh: Rute Patroli Blok A"
                            className={ic}
                            style={inputCls(errors?.nama_rute)}
                        />
                    </FormInput>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold" style={{ color: C.navy }}>
                            Tambah Checkpoint ke Rute <span style={{ color: "#ef4444" }}>*</span>
                        </label>

                        {available.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {available.map(cp => (
                                    <button
                                        key={cp.id}
                                        type="button"
                                        onClick={() => addCp(cp.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-all"
                                        style={{ background: C.blueSoft, color: C.blue, border: `1px solid ${C.blueBorder}` }}
                                    >
                                        <FontAwesomeIcon icon={faPlus} style={{ fontSize: 9 }} />
                                        {cp.nama}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[11px]" style={{ color: "#94a3b8" }}>
                                {(allCheckpoints ?? []).length === 0
                                    ? "Belum ada checkpoint. Buat checkpoint terlebih dahulu."
                                    : "Semua checkpoint sudah ditambahkan."}
                            </p>
                        )}
                        {errors?.checkpoints && (
                            <p className="text-[10px]" style={{ color: "#ef4444" }}>{errors.checkpoints}</p>
                        )}
                    </div>

                    {selectedDetails.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold" style={{ color: C.navy }}>
                                    Urutan Checkpoint dalam Rute
                                </label>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                    style={{ background: C.blueSoft, color: C.blue }}>
                                    {selectedDetails.length} titik
                                </span>
                            </div>

                            <div className="flex flex-col gap-1.5 p-3 rounded-xl"
                                style={{ background: "#f8fafc", border: `1.5px solid ${C.blueBorder}` }}>
                                {selectedDetails.map((cp, idx) => (
                                    <div key={cp.id}
                                        className="flex items-center gap-2 p-2.5 rounded-xl bg-white"
                                        style={{ border: `1px solid ${C.blueBorder}` }}>
                                        <FontAwesomeIcon icon={faGripVertical}
                                            style={{ fontSize: 11, color: "#cbd5e1", cursor: "grab", flexShrink: 0 }} />
                                        <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
                                            style={{ background: C.blue }}>
                                            {idx + 1}
                                        </span>
                                        <span className="flex-1 text-xs font-medium truncate" style={{ color: C.navy }}>
                                            {cp.nama}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button type="button" onClick={() => moveUp(idx)}
                                                disabled={idx === 0}
                                                className="w-6 h-6 rounded-lg flex items-center justify-center disabled:opacity-20 hover:opacity-70 transition-all"
                                                style={{ background: C.blueSoft }}>
                                                <FontAwesomeIcon icon={faArrowUp}
                                                    style={{ fontSize: 9, color: C.blue }} />
                                            </button>
                                            <button type="button" onClick={() => moveDown(idx)}
                                                disabled={idx === selectedDetails.length - 1}
                                                className="w-6 h-6 rounded-lg flex items-center justify-center disabled:opacity-20 hover:opacity-70 transition-all"
                                                style={{ background: C.blueSoft }}>
                                                <FontAwesomeIcon icon={faArrowDown}
                                                    style={{ fontSize: 9, color: C.blue }} />
                                            </button>
                                        </div>
                                        <button type="button" onClick={() => removeCp(cp.id)}
                                            className="w-6 h-6 rounded-lg flex items-center justify-center hover:opacity-70 transition-all"
                                            style={{ background: C.redSoft }}>
                                            <FontAwesomeIcon icon={faXmark}
                                                style={{ fontSize: 10, color: C.red }} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} disabled={processing}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold hover:opacity-80 disabled:opacity-50 transition-all"
                            style={{ background: "#f1f5f9", color: C.slate, border: `1.5px solid ${C.border}` }}>
                            Batal
                        </button>
                        <button type="submit" disabled={processing}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all"
                            style={{ background: C.blue }}>
                            {processing
                                ? <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Menyimpan...
                                </span>
                                : mode === "tambah" ? "Simpan Rute" : "Simpan Perubahan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function DeleteModal({ rute, onClose, onConfirm }) {
    const [processing, setProcessing] = useState(false);
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,42,68,0.6)", backdropFilter: "blur(2px)" }}
            onClick={(e) => e.target === e.currentTarget && !processing && onClose()}
        >
            <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: "white" }}>
                <div className="p-6 flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: C.redSoft }}>
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: 22, color: C.red }} />
                    </div>
                    <div>
                        <h3 className="font-bold text-base" style={{ color: C.navy }}>Hapus Rute?</h3>
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.slate }}>
                            Anda akan menghapus rute{" "}
                            <span className="font-semibold" style={{ color: C.navy }}>{rute?.nama_rute}</span>{" "}
                            beserta seluruh data checkpoint-nya. Tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>
                    <div className="flex gap-2 w-full">
                        <button onClick={onClose} disabled={processing}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 disabled:opacity-50"
                            style={{ background: "#f1f5f9", color: C.slate, border: `1.5px solid ${C.border}` }}>
                            Batal
                        </button>
                        <button
                            onClick={() => { setProcessing(true); onConfirm(() => setProcessing(false)); }}
                            disabled={processing}
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
