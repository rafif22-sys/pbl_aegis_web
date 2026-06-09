// resources/js/Components/Admin/LogBubble.jsx
import { RoleBadge } from "@/Components/Admin/Badges";
import { formatWaktuPesan } from "@/utils/dateHelpers";

export function LogBubble({ log, isMe }) {
    const waktuTampil = formatWaktuPesan(log.waktu_iso ?? log.waktu);

    return (
        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
            {!isMe && (
                <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-xs font-semibold" style={{ color: "#005EA4" }}>
                        {log.pengirim}
                    </span>
                    {log.role && <RoleBadge role={log.role} />}
                </div>
            )}
            <div
                className="px-3 py-1.5 text-xs max-w-[90%] leading-relaxed"
                style={{
                    background:   isMe ? "#0F2A44" : "#f1f5f9",
                    color:        isMe ? "white"   : "#0F2A44",
                    borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                }}
            >
                {log.pesan}
            </div>
            <span className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>
                {waktuTampil}
            </span>
        </div>
    );
}