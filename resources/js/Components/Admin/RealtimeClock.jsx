// resources/js/Components/Admin/RealtimeClock.jsx
import { useState, useEffect } from "react";

export function RealtimeClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const jam = time.toLocaleTimeString("id-ID", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const tgl = time.toLocaleDateString("id-ID", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });

    return (
        <div className="text-right">
            <p className="text-lg font-bold text-white leading-none tracking-widest">{jam}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "#90c4e8" }}>{tgl}</p>
        </div>
    );
}