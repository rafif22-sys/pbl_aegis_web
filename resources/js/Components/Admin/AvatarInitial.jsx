// resources/js/Components/Admin/AvatarInitial.jsx

export function AvatarInitial({ nama, fotoUrl, size = "sm" }) {
    const dim = size === "lg" ? "w-16 h-16 text-xl" : "w-8 h-8 text-xs";

    if (fotoUrl) {
        return (
            <img
                src={fotoUrl}
                alt={nama}
                className={`${dim} rounded-xl object-cover shrink-0`}
            />
        );
    }

    const initials = (nama ?? "?")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");

    const colors = ["#005EA4", "#0369a1", "#15803d", "#a16207", "#7c3aed", "#0F2A44"];
    const bg     = colors[(nama?.charCodeAt(0) ?? 0) % colors.length];

    return (
        <div
            className={`${dim} rounded-xl flex items-center justify-center shrink-0 text-white font-bold`}
            style={{ background: bg }}
        >
            {initials}
        </div>
    );
}