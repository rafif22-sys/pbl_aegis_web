// resources/js/Components/Admin/Badges.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMars, faVenus } from "@fortawesome/free-solid-svg-icons";

export function RoleBadge({ role }) {
    const map = {
        admin:      { bg: "#dbeafe", color: "#1d4ed8", label: "Admin" },
        petugas:    { bg: "#dcfce7", color: "#15803d", label: "Petugas" },
        supervisor: { bg: "#fef9c3", color: "#a16207", label: "Supervisor" },
        warga:      { bg: "#e0f2fe", color: "#0369a1", label: "Warga" },
    };
    const s = map[role] ?? { bg: "#f1f5f9", color: "#475569", label: role };
    return (
        <span
            className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize"
            style={{ background: s.bg, color: s.color }}
        >
            {s.label}
        </span>
    );
}

export function JenisKelaminBadge({ value }) {
    if (!value) return <span style={{ color: "#cbd5e1" }}>—</span>;
    const isLaki = value === "laki-laki";
    return (
        <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize"
            style={{
                background: isLaki ? "#dbeafe" : "#fce7f3",
                color:      isLaki ? "#1d4ed8" : "#be185d",
            }}
        >
            <FontAwesomeIcon icon={isLaki ? faMars : faVenus} style={{ fontSize: 9 }} />
            {isLaki ? "Laki-laki" : "Perempuan"}
        </span>
    );
}