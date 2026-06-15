// resources/js/Components/Admin/Icons.jsx

export const Icon = {
    Dashboard: (c) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
            <rect x="3"  y="3"  width="8" height="8" rx="1.5" />
            <rect x="13" y="3"  width="8" height="8" rx="1.5" />
            <rect x="3"  y="13" width="8" height="8" rx="1.5" />
            <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
    ),
    User: (c) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
    ),
    Jadwal: (c) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    ),
    Checkpoint: (c) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
            <path d="M12 2C8.1 2 5 5.1 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.9-3.1-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
        </svg>
    ),
    PosJaga: (c) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
            <circle cx="12" cy="8" r="3" />
            <path d="M6 21v-1a6 6 0 0 1 12 0v1" />
            <path d="M3 11l9-9 9 9" />
        </svg>
    ),
    Rute: (c) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
            <circle cx="5"  cy="6"  r="2" />
            <circle cx="19" cy="6"  r="2" />
            <circle cx="12" cy="18" r="2" />
            <path d="M7 6h10M19 8l-7 8M5 8l7 8" />
        </svg>
    ),
    BukuTamu: (c) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    ),
    // ← Perbaikan: Sos sekarang menerima warna c seperti icon lainnya
    Sos: (c) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    // ← Icon baru untuk Rekap Presensi (ikon clipboard + centang)
    RekapPresensi: (c) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    ),

    LaporanPatroli: (c) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M9 13h6M9 17h4" />
            <circle cx="9" cy="9" r="1" fill={c} />
        </svg>
    ),
    
    // ── Icon yang tidak masuk menu (tidak perlu parameter warna) ──────────
    Logout: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    Send: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    ),
};