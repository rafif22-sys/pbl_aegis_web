// resources/js/Components/Admin/StatCard.jsx

export function StatCard({ label, value, blue, icon, accent }) {
    return (
        <div
            className="rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
            style={{
                background: blue ? "#005EA4" : "white",
                color:      blue ? "white"   : "#0F2A44",
                border:     blue ? "none"    : "1.5px solid #c7e8f8",
            }}
        >
            <div
                className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                style={{ background: accent }}
            />
            <div className="shrink-0 ml-1 w-8 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <p className="text-xs font-medium opacity-80">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}