// resources/js/Components/Admin/menuItems.js
import { Icon } from "./Icons";

export const menuItems = [
    { label: "Dashboard",          icon: Icon.Dashboard,      route: "admin.dashboard" },
    { label: "Manajemen Pengguna", icon: Icon.User,           route: "admin.users.index" },
    { label: "Manajemen Jadwal",   icon: Icon.Jadwal,         route: "admin.jadwal.index" },
    { label: "Checkpoint",         icon: Icon.Checkpoint,     route: "admin.checkpoint.index" },
    { label: "Pos Jaga",           icon: Icon.PosJaga,        route: "admin.pos-jaga.index" },
    { label: "Rute Patroli",       icon: Icon.Rute,           route: "admin.rute.index" },
    { label: "Buku Tamu",          icon: Icon.BukuTamu,       route: "admin.buku-tamu.index" },
    { label: "Riwayat SOS",        icon: Icon.Sos,            route: "admin.sos.index" },
    { label: "Rekap Presensi",     icon: Icon.RekapPresensi,  route: "admin.rekap-presensi.index" },
    { label: "Laporan Patroli",    icon: Icon.LaporanPatroli, route: "admin.laporan-patroli.index" },
];