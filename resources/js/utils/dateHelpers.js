// resources/js/utils/dateHelpers.js

/**
 * Normalises any date value to YYYY-MM-DD string.
 * Handles ISO strings with time component, dd-mm-yyyy, and dd/mm/yyyy.
 */
export function normalizeDate(val) {
    if (!val) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    if (/^\d{4}-\d{2}-\d{2}T/.test(val)) return val.substring(0, 10);
    const parts = val.split(/[-/]/);
    if (parts.length === 3 && parts[0].length === 2) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return val;
}

/**
 * Returns a human-readable Indonesian date string, or null when val is empty.
 */
export function formatDateDisplay(val) {
    const d = normalizeDate(val);
    if (!d) return null;
    return new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
        day:   "2-digit",
        month: "long",
        year:  "numeric",
    });
}

/**
 * Formats a full datetime to a short Indonesian locale string.
 */
export function formatWaktu(waktu) {
    if (!waktu) return "-";
    return new Date(waktu).toLocaleString("id-ID", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

/**
 * Formats a message timestamp: "Hari ini, HH:MM" / "Kemarin, HH:MM" / full date.
 */
export function formatWaktuPesan(waktu) {
    if (!waktu) return "-";
    if (typeof waktu === "string" && waktu.includes("T")) {
        const d   = new Date(waktu);
        const now = new Date();

        const sameDay = (a, b) =>
            a.getDate()     === b.getDate()     &&
            a.getMonth()    === b.getMonth()    &&
            a.getFullYear() === b.getFullYear();

        const kemarin = new Date(now);
        kemarin.setDate(now.getDate() - 1);

        const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

        if (sameDay(d, now))     return `Hari ini, ${jam}`;
        if (sameDay(d, kemarin)) return `Kemarin, ${jam}`;

        return d.toLocaleString("id-ID", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    }
    return waktu;
}