// resources/js/Components/Admin/RuteCard.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRoute, faLocationDot, faEye, faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";

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

export function RuteCard({ rute, index, isActive, onClick, onDetail, onEdit, onDelete }) {
    const color = getRouteColor(index);
    const checkpoints = rute.checkpoint ?? [];
    const cpCount = checkpoints.length;

    const MAX_SHOWN = 4;
    const shownCps = checkpoints.slice(0, MAX_SHOWN);
    const hasMore = cpCount > MAX_SHOWN;

    return (
        <div
            onClick={onClick}
            style={{
                background: isActive ? "#EFF8FF" : "white",
                borderTop: `1.5px solid ${isActive ? color : C.blueBorder}`,
                borderRight: `1.5px solid ${isActive ? color : C.blueBorder}`,
                borderBottom: `1.5px solid ${isActive ? color : C.blueBorder}`,
                borderLeft: isActive ? `1.5px solid ${color}` : `4px solid ${color}`,
                borderRadius: 14,
                padding: "12px 14px",
                cursor: "pointer",
                transition: "all 0.18s ease",
                boxShadow: isActive
                    ? `0 4px 16px ${color}22`
                    : "0 1px 4px rgba(0,0,0,0.05)",
            }}
            onMouseEnter={(e) => {
                if (!isActive) {
                    e.currentTarget.style.background = "#F5FBFF";
                    e.currentTarget.style.boxShadow = `0 4px 12px ${color}18`;
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive) {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
                }
            }}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${color}18` }}
                    >
                        <FontAwesomeIcon icon={faRoute} style={{ fontSize: 13, color }} />
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className="text-sm font-bold truncate"
                                style={{ color: C.navy }}
                            >
                                {rute.nama_rute}
                            </span>
                            <span
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                                style={{ background: C.greenSoft, color: C.green }}
                            >
                                <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: 8 }} />
                                {cpCount} Checkpoint
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => onDetail()}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                        style={{ background: C.greenSoft }}
                        title="Lihat Detail"
                    >
                        <FontAwesomeIcon icon={faEye} style={{ fontSize: 11, color: C.green }} />
                    </button>
                    <button
                        onClick={() => onEdit()}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                        style={{ background: C.blueSoft }}
                        title="Edit"
                    >
                        <FontAwesomeIcon icon={faPencil} style={{ fontSize: 11, color: C.blue }} />
                    </button>
                    <button
                        onClick={() => onDelete()}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                        style={{ background: C.redSoft }}
                        title="Hapus"
                    >
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: 11, color: C.red }} />
                    </button>
                </div>
            </div>

            {cpCount > 0 && (
                <div
                    className="mt-2.5 flex items-center flex-wrap gap-1"
                    style={{ paddingLeft: 40 }}
                >
                    {shownCps.map((cp, idx) => (
                        <div key={cp.id} className="flex items-center gap-1">
                            <span
                                className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                                style={{
                                    background: idx === 0
                                        ? `${color}18`
                                        : idx === shownCps.length - 1 && !hasMore
                                            ? `${color}28`
                                            : "#f1f5f9",
                                    color: idx === 0 || (idx === shownCps.length - 1 && !hasMore)
                                        ? color
                                        : C.slate,
                                    fontWeight: idx === 0 || (idx === shownCps.length - 1 && !hasMore)
                                        ? 700
                                        : 500,
                                    border: `1px solid ${idx === 0 || (idx === shownCps.length - 1 && !hasMore) ? `${color}40` : C.border}`,
                                }}
                            >
                                {cp.nama}
                            </span>

                            {(idx < shownCps.length - 1 || hasMore) && (
                                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                                    <path d="M1 5h10M8 1l4 4-4 4" stroke={`${color}80`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                    ))}

                    {hasMore && (
                        <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                            style={{
                                background: `${color}10`,
                                color,
                                border: `1px solid ${color}30`,
                            }}
                        >
                            +{cpCount - MAX_SHOWN} lainnya
                        </span>
                    )}
                </div>
            )}

            {cpCount === 0 && (
                <p
                    className="text-[10px] mt-2 italic"
                    style={{ color: "#94a3b8", paddingLeft: 40 }}
                >
                    Belum ada checkpoint
                </p>
            )}
        </div>
    );
}
