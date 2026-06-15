/**
 * generateRekapPDF.js
 * Generate PDF rekap presensi bulanan menggunakan jsPDF.
 * Logo diambil dari Supabase Storage lokal.
 *
 * Install: npm install jspdf @supabase/supabase-js
 */

import { jsPDF } from "jspdf";
import { createClient } from "@supabase/supabase-js";

// ── Konfigurasi Supabase Lokal ────────────────────────────────────────────────
const SUPABASE_URL  = "http://127.0.0.1:54321";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Konstanta ─────────────────────────────────────────────────────────────────

const BULAN_LABEL = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember",
];

const C = {
    navy:       [15,  42,  68],
    blue:       [0,   94,  164],
    blueLight:  [199, 232, 248],
    bluePale:   [224, 242, 254],
    blueBg:     [240, 249, 255],
    white:      [255, 255, 255],
    slate:      [148, 163, 184],
    green:      [22,  163, 74],
    greenBg:    [220, 252, 231],
    red:        [220, 38,  38],
    redBg:      [254, 226, 226],
    amber:      [217, 119, 6],
    amberBg:    [254, 243, 199],
    cyan:       [8,   145, 178],
    cyanBg:     [207, 250, 254],
};

// ── Helper: ambil logo dari Supabase Storage lokal ───────────────────────────

async function fetchLogoAsDataURL() {
    try {
        const { data, error } = await supabase.storage
            .from("logo")
            .download("new_logo.png");

        if (error) {
            console.warn("[RekapPDF] Gagal mengunduh logo:", error.message);
            return null;
        }

        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror  = () => reject(new Error("FileReader error"));
            reader.readAsDataURL(data);
        });
    } catch (err) {
        console.warn("[RekapPDF] Error saat fetch logo:", err);
        return null;
    }
}

// ── Fungsi utama ──────────────────────────────────────────────────────────────

/**
 * @param {Object} params
 * @param {Array}  params.data          - Array rekap petugas
 * @param {Object} params.stats         - { total_petugas, rata_hadir, total_alpha, total_terlambat }
 * @param {number} params.bulan         - 1–12
 * @param {number} params.tahun         - e.g. 2026
 * @param {string} [params.supervisor]  - label filter supervisor (opsional)
 */
export async function generateRekapPDF({ data, stats, bulan, tahun, supervisor }) {

    const logoDataURL = await fetchLogoAsDataURL();

    const doc    = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const PW     = doc.internal.pageSize.getWidth();   // 297
    const PH     = doc.internal.pageSize.getHeight();  // 210
    const MARGIN = 14;
    const CW     = PW - MARGIN * 2;

    const periodeLabel = `${BULAN_LABEL[bulan - 1]} ${tahun}`;
    let y = MARGIN;

    // ── Helpers ───────────────────────────────────────────────────────────────

    const setFill = (arr) => doc.setFillColor(...arr);
    const setDraw = (arr) => doc.setDrawColor(...arr);
    const setTxt  = (arr) => doc.setTextColor(...arr);
    const setFont = (size, style = "normal") => {
        doc.setFontSize(size);
        doc.setFont("helvetica", style);
    };

    const rect = (x, xw, yy, h, arr, rounded = 0) => {
        setFill(arr);
        if (rounded) doc.roundedRect(x, yy, xw, h, rounded, rounded, "F");
        else         doc.rect(x, yy, xw, h, "F");
    };

    const text = (str, x, yy, opts = {}) => {
        doc.text(String(str ?? "—"), x, yy, opts);
    };

    const pill = (val, x, yy, bgArr, txtArr, w = 22, h = 6) => {
        rect(x - w / 2, w, yy - h * 0.72, h, bgArr, 2);
        setTxt(txtArr);
        setFont(7, "bold");
        text(String(val), x, yy, { align: "center" });
    };

    const newPageIfNeeded = (needed = 10) => {
        if (y + needed > PH - MARGIN) {
            doc.addPage();
            y = MARGIN;
            drawTableHeader(y);
            y += 8;
        }
    };

    // ── Header dokumen ────────────────────────────────────────────────────────

    const HEADER_H = 30;
    rect(0, PW, 0, HEADER_H, C.navy);

    const LOGO_X = MARGIN;
    const LOGO_Y = 4;
    const LOGO_W = 22;
    const LOGO_H = 22;

    if (logoDataURL) {
        const formatMatch = logoDataURL.match(/^data:image\/(\w+);base64,/);
        const imgFormat   = formatMatch ? formatMatch[1].toUpperCase() : "PNG";
        try {
            doc.addImage(logoDataURL, imgFormat, LOGO_X, LOGO_Y, LOGO_W, LOGO_H);
        } catch (imgErr) {
            console.warn("[RekapPDF] Gagal menambahkan gambar ke PDF:", imgErr);
            _drawIconFallback();
        }
    } else {
        _drawIconFallback();
    }

    function _drawIconFallback() {
        rect(LOGO_X, LOGO_W, LOGO_Y, LOGO_H, C.blue, 3);
        setTxt(C.blueLight);
        setFont(14, "bold");
        text("✓", LOGO_X + LOGO_W / 2, LOGO_Y + LOGO_H * 0.62, { align: "center" });
    }

    const TEXT_X = LOGO_X + LOGO_W + 4;

    setTxt(C.white);
    setFont(13, "bold");
    text("REKAP PRESENSI BULANAN", TEXT_X, 12);

    setFont(8.5, "normal");
    setTxt(C.blueLight);
    text(
        `Periode: ${periodeLabel}${supervisor ? "  |  Supervisor: " + supervisor : ""}`,
        TEXT_X,
        19,
    );

    const now      = new Date();
    const tglCetak = now.toLocaleDateString("id-ID", {
        day: "2-digit", month: "long", year: "numeric",
    });
    setFont(7.5, "normal");
    setTxt(C.slate.map(v => Math.min(v + 60, 255)));
    text(`Dicetak: ${tglCetak}`, PW - MARGIN, 12, { align: "right" });

    y = HEADER_H + 4;

    // ── Stat summary bar ──────────────────────────────────────────────────────

    const statW  = CW / 4;
    const statH  = 16;
    const statItems = [
        { label: "Total Petugas",       value: stats?.total_petugas   ?? 0,    bg: C.blue,    txt: C.white,  valTxt: C.white  },
        { label: "Rata-rata Kehadiran", value: `${stats?.rata_hadir  ?? 0}%`,  bg: C.bluePale, txt: C.navy,  valTxt: C.blue   },
        { label: "Total Alpha",         value: stats?.total_alpha     ?? 0,    bg: C.redBg,   txt: C.red,    valTxt: C.red    },
        { label: "Total Terlambat",     value: stats?.total_terlambat ?? 0,    bg: C.amberBg, txt: C.amber,  valTxt: C.amber  },
    ];

    statItems.forEach(({ label, value, bg, txt, valTxt }, i) => {
        const sx = MARGIN + i * statW;
        rect(sx, statW - 2, y, statH, bg, 3);

        setTxt(valTxt);
        setFont(12, "bold");
        text(value, sx + (statW - 2) / 2, y + 7.5, { align: "center" });

        setTxt(txt);
        setFont(6.5, "normal");
        text(label.toUpperCase(), sx + (statW - 2) / 2, y + 13, { align: "center" });
    });

    y += statH + 6;

    // ── Definisi kolom tabel ──────────────────────────────────────────────────
    //
    // Kolom "Lama Telat" menampilkan total_keterlambatan dari backend.
    // Format yang dikirim controller: null (tidak pernah telat) | "Xj Ym" | "Xj" | "Ym"
    //
    const cols = [
        { label: "No",           w: 8,  align: "center" },
        { label: "Nama Petugas", w: 34, align: "left"   },
        { label: "Supervisor",   w: 30, align: "center" },
        { label: "Total Jadwal", w: 20, align: "center" },
        { label: "Hadir",        w: 15, align: "center" },
        { label: "Terlambat",    w: 18, align: "center" },
        { label: "Lama Telat",   w: 24, align: "center" }, // ← total durasi keterlambatan sebulan
        { label: "Alpha",        w: 15, align: "center" },
        { label: "Libur",        w: 15, align: "center" },
        { label: "% Hadir",      w: 18, align: "center" },
    ];

    const totalColW = cols.reduce((s, c) => s + c.w, 0);
    const scale     = CW / totalColW;
    let xCursor     = MARGIN;
    cols.forEach(c => { c.x = xCursor; c.w = c.w * scale; xCursor += c.w; });

    // ── Header tabel ──────────────────────────────────────────────────────────

    const drawTableHeader = (yy) => {
        rect(MARGIN, CW, yy, 8, C.blue);
        setTxt(C.white);
        setFont(7, "bold");
        cols.forEach(c => {
            text(c.label, c.x + c.w / 2, yy + 5.2, { align: "center" });
        });
        setDraw(C.blueLight);
        doc.setLineWidth(0.1);
        doc.line(MARGIN, yy + 8, MARGIN + CW, yy + 8);
    };

    drawTableHeader(y);
    y += 8;

    // ── Baris data ────────────────────────────────────────────────────────────

    const ROW_H = 9;

    data.forEach((row, i) => {
        newPageIfNeeded(ROW_H + 1);

        const isOdd  = i % 2 === 1;
        const bgRow  = isOdd ? C.blueBg : C.white;
        rect(MARGIN, CW, y, ROW_H, bgRow);

        const targetJadwal = Math.max(0, (row.total_jadwal ?? 0) - (row.jumlah_libur ?? 0));
        const pctHadir     = targetJadwal > 0
            ? Math.round(((row.jumlah_hadir ?? 0) / targetJadwal) * 100)
            : 0;

        const pctColor = pctHadir >= 80 ? C.green   : pctHadir >= 60 ? C.amber   : C.red;
        const pctBg    = pctHadir >= 80 ? C.greenBg : pctHadir >= 60 ? C.amberBg : C.redBg;

        // total_keterlambatan: null = tidak pernah telat; "Xj Ym" = ada keterlambatan
        const lamaTelat = row.total_keterlambatan ?? null;

        const cy = y + ROW_H / 2 + 1.5;

        cols.forEach((c, ci) => {
            const cx = c.x + c.w / 2;
            switch (ci) {
                case 0: // No
                    setTxt(C.slate); setFont(7, "normal");
                    text(i + 1, cx, cy, { align: "center" });
                    break;

                case 1: // Nama Petugas
                    setTxt(C.navy); setFont(7.5, "bold");
                    text(row.nama ?? "—", c.x + 2, cy, { maxWidth: c.w - 4 });
                    break;

                case 2: // Supervisor
                    if (row.supervisor) {
                        pill(row.supervisor, cx, cy, C.amberBg, C.amber, c.w - 4);
                    } else {
                        setTxt(C.slate); setFont(7, "normal");
                        text("—", cx, cy, { align: "center" });
                    }
                    break;

                case 3: // Total Jadwal
                    setTxt(C.navy); setFont(8, "bold");
                    text(row.total_jadwal ?? 0, cx, cy, { align: "center" });
                    break;

                case 4: // Hadir (termasuk terlambat)
                    pill(row.jumlah_hadir ?? 0, cx, cy, C.greenBg, C.green, 14);
                    break;

                case 5: // Terlambat (jumlah hari)
                    pill(row.jumlah_terlambat ?? 0, cx, cy, C.amberBg, C.amber, 18);
                    break;

                case 6: // Lama Telat — nilai "Xj Ym" dari backend, null jika tidak pernah telat
                    if (lamaTelat) {
                        pill(lamaTelat, cx, cy, C.amberBg, C.amber, c.w - 4);
                    } else {
                        setTxt(C.slate); setFont(7, "normal");
                        text("—", cx, cy, { align: "center" });
                    }
                    break;

                case 7: // Alpha
                    pill(row.jumlah_alpha ?? 0, cx, cy, C.redBg, C.red, 14);
                    break;

                case 8: // Libur
                    pill(row.jumlah_libur ?? 0, cx, cy, C.cyanBg, C.cyan, 14);
                    break;

                case 9: // % Hadir
                    pill(`${pctHadir}%`, cx, cy, pctBg, pctColor, 16);
                    break;
            }
        });

        setDraw(C.bluePale);
        doc.setLineWidth(0.1);
        doc.line(MARGIN, y + ROW_H, MARGIN + CW, y + ROW_H);

        y += ROW_H;
    });

    // ── Footer setiap halaman ─────────────────────────────────────────────────

    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        rect(0, PW, PH - 8, 8, C.navy);
        setTxt(C.blueLight);
        setFont(6.5, "normal");
        text(`Rekap Presensi – ${periodeLabel}`, MARGIN, PH - 3);
        text(`Halaman ${p} / ${totalPages}`, PW - MARGIN, PH - 3, { align: "right" });
    }

    // ── Simpan ────────────────────────────────────────────────────────────────
    doc.save(`rekap-presensi-${periodeLabel.replace(" ", "-").toLowerCase()}.pdf`);
}