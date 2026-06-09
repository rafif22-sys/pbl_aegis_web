// resources/js/Components/Admin/PosCard.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faTrash, faLocationDot } from "@fortawesome/free-solid-svg-icons";

// Design tokens
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

export function PosCard({ pos, idx, onEdit, onDelete }) {
    return (
        <div
            className="rounded-2xl overflow-hidden transition-all duration-200"
            style={{
                background: "white",
                borderTop: `1.5px solid ${C.blueBorder}`,
                borderRight: `1.5px solid ${C.blueBorder}`,
                borderBottom: `1.5px solid ${C.blueBorder}`,
                borderLeft: `4px solid ${C.blue}`,
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow   = `0 8px 24px rgba(0,94,164,0.12)`;
                e.currentTarget.style.transform   = "translateY(-2px)";
                e.currentTarget.style.borderTopColor = C.blue;
                e.currentTarget.style.borderRightColor = C.blue;
                e.currentTarget.style.borderBottomColor = C.blue;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow   = "0 1px 4px rgba(0,0,0,0.05)";
                e.currentTarget.style.transform   = "translateY(0)";
                e.currentTarget.style.borderTopColor = C.blueBorder;
                e.currentTarget.style.borderRightColor = C.blueBorder;
                e.currentTarget.style.borderBottomColor = C.blueBorder;
            }}
        >
            <div className="p-4">
                {/* Row: nomor + nama + aksi */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                            style={{ background: C.blueSoft, color: C.blue, border: `1.5px solid ${C.blueBorder}` }}>
                            {pos.urutan}
                        </div>
                        <p className="text-sm font-bold truncate leading-tight" style={{ color: C.navy }}>
                            {pos.nama}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => onEdit(pos)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                            style={{ background: C.blueSoft }} title="Edit">
                            <FontAwesomeIcon icon={faPencil} style={{ fontSize: 10, color: C.blue }} />
                        </button>
                        <button onClick={() => onDelete(pos)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                            style={{ background: C.redSoft }} title="Hapus">
                            <FontAwesomeIcon icon={faTrash} style={{ fontSize: 10, color: C.red }} />
                        </button>
                    </div>
                </div>

                <div style={{ height: 1, background: C.border, marginBottom: 12 }} />

                {/* Alamat */}
                <div className="flex items-start gap-2 mb-3">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: C.blueSoft }}>
                        <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: 9, color: C.blue }} />
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: C.slate,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {pos.alamat || <span style={{ color: "#cbd5e1" }}>Alamat belum diisi</span>}
                    </p>
                </div>

                {/* Koordinat chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {[["Lat", pos.latitude], ["Lng", pos.longitude]].map(([lbl, val]) => (
                        <div key={lbl} className="flex items-center gap-1 px-2 py-1 rounded-lg"
                            style={{ background: C.blueLight, border: `1px solid ${C.blueBorder}` }}>
                            <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: C.blue }}>{lbl}</span>
                            <span className="text-[10px] font-mono font-bold" style={{ color: C.navy }}>
                                {parseFloat(val).toFixed(4)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
