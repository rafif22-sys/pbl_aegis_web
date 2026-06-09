// resources/js/Layouts/AdminLayout.jsx
import { router, usePage } from "@inertiajs/react";  // ← tambahkan usePage
import { Icon }            from "@/Components/Admin/Icons";
import { menuItems }       from "@/Components/Admin/menuItems";
import { RealtimeClock }   from "@/Components/Admin/RealtimeClock";
import { SUPABASE_LOGO }   from "@/utils/supabase";

/**
 * AdminLayout wraps every admin page with:
 *   - a fixed sidebar (navigation + logout)
 *   - a top header (greeting / role badge / clock / logo)
 *   - a scrollable main content area (children)
 *
 * Props:
 *   activeMenu  – string matching one of menuItems[].label
 *   title       – header title text
 *   children    – page content
 *
 * NOTE: auth diambil otomatis dari usePage().props
 * yang di-share via HandleInertiaRequests.php
 * sehingga setiap halaman tidak perlu kirim auth secara manual
 */
export default function AdminLayout({ activeMenu, title, children }) {

    // ← auth diambil dari Inertia shared props, bukan dari props komponen
    const { auth } = usePage().props;

    const handleLogout    = () => router.post(route("logout"));
    const handleMenuClick = (label) => {
        const item = menuItems.find((m) => m.label === label);
        if (item) router.visit(route(item.route));
    };

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: "#E7F8FF" }}>

            {/* ── SIDEBAR ────────────────────────────────────── */}
            <aside
                className="w-64 flex flex-col justify-between py-5 px-3 shrink-0"
                style={{ background: "white", borderRight: "1px solid #c7e8f8" }}
            >
                <div>
                    <p
                        className="text-[11px] font-bold tracking-widest px-3 mb-4 mt-1"
                        style={{ color: "#0F2A44" }}
                    >
                        NAVIGASI
                    </p>

                    <nav className="flex flex-col gap-0.5">
                        {menuItems.map(({ label, icon }) => {
                            const isActive = activeMenu === label;
                            return (
                                <button
                                    key={label}
                                    onClick={() => handleMenuClick(label)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all w-full"
                                    style={{
                                        background: isActive ? "#e0f2fe"  : "transparent",
                                        color:      isActive ? "#005EA4"  : "#64748b",
                                        fontWeight: isActive ? 600        : 400,
                                    }}
                                >
                                    <span
                                        className="w-1 h-4 rounded-full shrink-0 transition-all"
                                        style={{ background: isActive ? "#005EA4" : "transparent" }}
                                    />
                                    {icon(isActive ? "#005EA4" : "#94a3b8")}
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tombol Logout */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 mx-1"
                    style={{ background: "#fde8e8", color: "#c0392b" }}
                >
                    <Icon.Logout />
                    Keluar
                </button>
            </aside>

            {/* ── MAIN AREA ───────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">

                {/* ── Header ── */}
                <header
                    className="px-6 py-4 shrink-0 relative overflow-hidden rounded-2xl"
                    style={{ background: "#0F2A44" }}
                >
                    {/* Decorative circles */}
                    <div
                        className="absolute -right-8 -top-8 w-32 h-32 rounded-full pointer-events-none"
                        style={{ background: "rgba(59,158,222,0.08)" }}
                    />
                    <div
                        className="absolute right-20 -bottom-6 w-20 h-20 rounded-full pointer-events-none"
                        style={{ background: "rgba(59,158,222,0.05)" }}
                    />

                    <div className="flex items-center gap-4 relative z-10">

                        {/* Greeting & role badge */}
                        <div className="flex-1">
                            <h1 className="text-lg font-bold text-white leading-tight">
                                {title ?? `Halo, ${auth?.user?.nama ?? "Admin"}`}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span
                                    className="text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold"
                                    style={{ background: "rgba(59,158,222,0.2)", color: "#7dd3fc" }}
                                >
                                    {auth?.user?.role ?? "admin"}
                                </span>
                                <span
                                    className="text-[10px]"
                                    style={{ color: "rgba(255,255,255,0.3)" }}
                                >
                                    •
                                </span>
                                <span
                                    className="text-[10px]"
                                    style={{ color: "rgba(255,255,255,0.4)" }}
                                >
                                    Website Admin AEGIS
                                </span>
                            </div>
                        </div>

                        {/* Jam realtime */}
                        <div className="hidden md:block">
                            <RealtimeClock />
                        </div>

                        {/* Divider */}
                        <div
                            className="w-px h-10 self-center"
                            style={{ background: "rgba(255,255,255,0.1)" }}
                        />

                        {/* Logo */}
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                            style={{ background: "rgba(255,255,255,0.08)" }}
                        >
                            <img
                                src={SUPABASE_LOGO}
                                alt="Logo AEGIS"
                                className="w-12 h-12 object-contain"
                            />
                        </div>
                    </div>

                    {/* Bottom gradient line */}
                    <div
                        className="absolute bottom-0 left-6 right-6 h-px"
                        style={{ background: "linear-gradient(90deg, transparent, #3b9ede55, transparent)" }}
                    />
                </header>

                {/* ── Page Content ── */}
                <main className="flex-1 overflow-hidden flex flex-col min-h-0">
                    {children}
                </main>
            </div>
        </div>
    );
}