<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JadwalAbsensi;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RekapPresensiController extends Controller
{
    /**
     * Halaman utama — daftar semua petugas + ringkasan kehadiran bulan ini.
     */
    public function index(Request $request)
    {
        $bulan        = (int) $request->get('bulan',        now()->month);
        $tahun        = (int) $request->get('tahun',        now()->year);
        $search       = $request->get('search',        '');
        $supervisorId = $request->get('supervisor_id', '');

        // ── Rekap per petugas ─────────────────────────────────────────────────
        $rekapQuery = User::query()
            ->from('users as u')
            ->where('u.role', 'petugas')
            ->select([
                'u.id',
                'u.nama',
                'u.email',
                'u.foto_profil',
                'sv.nama as supervisor',
                DB::raw('COUNT(ja.id)                                                         AS total_jadwal'),
                DB::raw("SUM(CASE WHEN ja.status = 'hadir' THEN 1 ELSE 0 END)  AS jumlah_hadir"),
                DB::raw("SUM(CASE WHEN ja.status = 'libur'                THEN 1 ELSE 0 END)  AS jumlah_libur"),
                DB::raw("SUM(CASE WHEN ja.status = 'alpha'                THEN 1 ELSE 0 END)  AS jumlah_alpha"),
                DB::raw("SUM(CASE WHEN ja.status = 'terlambat'            THEN 1 ELSE 0 END)  AS jumlah_terlambat"),
            ])
            ->leftJoin('jadwal_absensi as ja', function ($join) use ($bulan, $tahun) {
                $join->on('ja.id_user', '=', 'u.id')
                    ->whereExists(function ($sub) use ($bulan, $tahun) {
                        $sub->select(DB::raw(1))
                            ->from('jadwal')
                            ->whereColumn('jadwal.id', 'ja.id_jadwal')
                            ->whereMonth('jadwal.tanggal', $bulan)
                            ->whereYear('jadwal.tanggal',  $tahun);
                    });
            })
            ->leftJoin('users as sv', 'sv.id', '=', 'u.id_supervisor')
            ->groupBy('u.id', 'u.nama', 'u.email', 'u.foto_profil', 'sv.nama');

        if ($search) {
            $rekapQuery->where('u.nama', 'like', "%{$search}%");
        }

        if ($supervisorId) {
            $rekapQuery->where('u.id_supervisor', $supervisorId);
        }

        $rekap = $rekapQuery
            ->orderBy('u.nama')
            ->paginate(15)
            ->withQueryString();

        // ── Stat cards ────────────────────────────────────────────────────────
        $statsRaw = DB::table('users as u')
            ->where('u.role', 'petugas')
            ->select([
                DB::raw('COUNT(DISTINCT u.id)                                                        AS total_petugas'),
                DB::raw('COUNT(ja.id)                                                                AS total_jadwal'),
                DB::raw("SUM(CASE WHEN ja.status = 'hadir' THEN 1 ELSE 0 END)         AS total_hadir"),
                DB::raw("SUM(CASE WHEN ja.status = 'libur'                THEN 1 ELSE 0 END)         AS total_libur"),
                DB::raw("SUM(CASE WHEN ja.status = 'alpha'                THEN 1 ELSE 0 END)         AS total_alpha"),
                DB::raw("SUM(CASE WHEN ja.status = 'terlambat'            THEN 1 ELSE 0 END)         AS total_terlambat"),
            ])
            ->leftJoin('jadwal_absensi as ja', function ($join) use ($bulan, $tahun) {
                $join->on('ja.id_user', '=', 'u.id')
                    ->whereExists(function ($sub) use ($bulan, $tahun) {
                        $sub->select(DB::raw(1))
                            ->from('jadwal')
                            ->whereColumn('jadwal.id', 'ja.id_jadwal')
                            ->whereMonth('jadwal.tanggal', $bulan)
                            ->whereYear('jadwal.tanggal',  $tahun);
                    });
            })
            ->first();

        $totalAktif = max(0, $statsRaw->total_jadwal - $statsRaw->total_libur);
        $rataHadir = $totalAktif > 0
            ? round(($statsRaw->total_hadir / $totalAktif) * 100)
            : 0;

        $stats = [
            'total_petugas'   => (int) $statsRaw->total_petugas,
            'rata_hadir'      => $rataHadir,
            'total_alpha'     => (int) $statsRaw->total_alpha,
            'total_terlambat' => (int) $statsRaw->total_terlambat,
        ];

        // ── Dropdown supervisor ───────────────────────────────────────────────
        $supervisors = User::where('role', 'supervisor')
            ->select('id', 'nama')
            ->orderBy('nama')
            ->get();

        return Inertia::render('Admin/RekapPresensi', [
            'rekap'       => $rekap,
            'stats'       => $stats,
            'supervisors' => $supervisors,
            'filters'     => [
                'search'        => $search,
                'supervisor_id' => $supervisorId,
                'bulan'         => $bulan,
                'tahun'         => $tahun,
            ],
            'auth' => ['user' => $request->user()],
        ]);
    }

    public function export(Request $request)
    {
        $bulan        = (int) $request->input('bulan', now()->month);
        $tahun        = (int) $request->input('tahun', now()->year);
        $search       = $request->input('search');
        $supervisorId = $request->input('supervisor_id');

        $query = User::with('supervisor')
            ->where('role', 'petugas')
            ->when($search, fn ($q) => $q->where('nama', 'like', "%{$search}%"))
            ->when($supervisorId, fn ($q) => $q->where('id_supervisor', $supervisorId));

        $users = $query->get();

        $data = $users->map(function ($user) use ($bulan, $tahun) {
            $jadwal = JadwalAbsensi::with(['jadwal.shift'])
                ->where('id_user', $user->id)
                ->whereHas('jadwal', fn ($q) =>
                    $q->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)
                )
                ->get();

            // ── Hitung total menit keterlambatan ──────────────────────────────
            $totalMenitTerlambat = 0;
            foreach ($jadwal as $j) {
                if (
                    $j->status === JadwalAbsensi::STATUS_TERLAMBAT
                    && $j->jam_masuk
                    && $j->jadwal
                    && $j->jadwal->shift
                ) {
                    $waktuMasuk  = \Carbon\Carbon::parse($j->jam_masuk);
                    $tanggal     = \Carbon\Carbon::parse($j->jadwal->tanggal);
                    $shiftMulai  = $j->jadwal->shift->jam_mulai;

                    $jam   = $shiftMulai instanceof \Carbon\Carbon
                        ? $shiftMulai->hour
                        : (int) substr((string) $shiftMulai, 0, 2);
                    $menit = $shiftMulai instanceof \Carbon\Carbon
                        ? $shiftMulai->minute
                        : (int) substr((string) $shiftMulai, 3, 2);

                    $waktuMulaiShift = $tanggal->copy()->setTime($jam, $menit);

                    if ($waktuMasuk->greaterThan($waktuMulaiShift)) {
                        $totalMenitTerlambat += $waktuMulaiShift->diffInMinutes($waktuMasuk);
                    }
                }
            }

            // ── Format keterlambatan → "Xj Ym" ───────────────────────────────
            $jamLate   = (int) floor($totalMenitTerlambat / 60);
            $menitLate = $totalMenitTerlambat % 60;

            if ($jamLate === 0 && $menitLate === 0) {
                $formatKeterlambatan = null; // tidak pernah terlambat → null (bukan '-')
            } else {
                $parts = [];
                if ($jamLate  > 0) $parts[] = "{$jamLate}j";
                if ($menitLate > 0) $parts[] = "{$menitLate}m";
                $formatKeterlambatan = implode(' ', $parts);
            }

            // ── FIX: jumlah_hadir hanya mencakup status 'hadir' (terlambat dihitung terpisah) ───
            $jumlahHadir = $jadwal->where('status', JadwalAbsensi::STATUS_HADIR)->count();

            return [
                'id'                  => $user->id,
                'nama'                => $user->nama,
                'email'               => $user->email,
                'foto_profil'         => $user->foto_profil,
                'supervisor'          => $user->supervisor?->nama,
                'total_jadwal'        => $jadwal->count(),
                'jumlah_hadir'        => $jumlahHadir,         // ✅ sudah termasuk terlambat
                'jumlah_terlambat'    => $jadwal->where('status', JadwalAbsensi::STATUS_TERLAMBAT)->count(),
                'jumlah_alpha'        => $jadwal->where('status', JadwalAbsensi::STATUS_ALPHA)->count(),
                'jumlah_libur'        => $jadwal->where('status', JadwalAbsensi::STATUS_LIBUR)->count(),
                'total_keterlambatan' => $formatKeterlambatan, // null | "Xj Ym"
            ];
        });

        // ── Stats ringkasan ───────────────────────────────────────────────────
        $totalPetugas   = $data->count();
        $totalAlpha     = $data->sum('jumlah_alpha');
        $totalTerlambat = $data->sum('jumlah_terlambat');

        $rataHadir = 0;
        $counted   = $data->filter(fn ($r) => ($r['total_jadwal'] - $r['jumlah_libur']) > 0);
        if ($counted->isNotEmpty()) {
            $rataHadir = (int) round(
                $counted->avg(fn ($r) => (
                    $r['jumlah_hadir'] / max(1, $r['total_jadwal'] - $r['jumlah_libur'])
                ) * 100)
            );
        }

        return response()->json([
            'data'  => $data->values(),
            'stats' => [
                'total_petugas'   => $totalPetugas,
                'rata_hadir'      => $rataHadir,
                'total_alpha'     => $totalAlpha,
                'total_terlambat' => $totalTerlambat,
            ],
        ]);
    }
}

    /**
     * Halaman detail rekap satu petugas — semua absensi pada bulan tertentu.
     */
    // public function detail(Request $request, int $id)
    // {
    //     $bulan = (int) $request->get('bulan', now()->month);
    //     $tahun = (int) $request->get('tahun', now()->year);

    //     // Validasi: user harus bertipe petugas
    //     $petugas = User::where('role', 'petugas')->findOrFail($id);

    //     // Ambil semua jadwal absensi bulan ini dengan eager load
    //     $absensiCollection = JadwalAbsensi::with([
    //             'jadwal.shift',
    //             'jadwal.posJaga',
    //             'rute',
    //         ])
    //         ->where('id_user', $id)
    //         ->whereHas('jadwal', function ($q) use ($bulan, $tahun) {
    //             $q->whereMonth('tanggal', $bulan)
    //                 ->whereYear('tanggal',  $tahun);
    //         })
    //         // Urutkan berdasarkan tanggal jadwal
    //         ->orderBy(
    //             DB::table('jadwal')
    //                 ->select('tanggal')
    //                 ->whereColumn('jadwal.id', 'jadwal_absensi.id_jadwal')
    //                 ->limit(1)
    //         )
    //         ->get();

    //     // Petakan ke array bersih
    //     $absensi = $absensiCollection->map(fn ($row) => [
    //         'id'          => $row->id,
    //         'tanggal'     => $row->jadwal?->tanggal?->format('Y-m-d'),
    //         'shift'       => $row->jadwal?->shift?->nama   ?? '—',
    //         'pos_jaga'    => $row->jadwal?->posJaga?->nama ?? '—',
    //         'rute'        => $row->rute?->nama             ?? '—',
    //         'jam_masuk'   => $row->jam_masuk?->format('H:i'),
    //         'jam_pulang'  => $row->jam_pulang?->format('H:i'),
    //         'status'      => $row->status,
    //         'foto_masuk'  => $row->foto_masuk,
    //         'foto_pulang' => $row->foto_pulang,
    //     ]);

    //     // Ringkasan statistik bulan ini
    //     $ringkasan = [
    //         'total_jadwal'     => $absensiCollection->count(),
    //         'jumlah_hadir'     => $absensiCollection->whereIn('status', [
    //                                 JadwalAbsensi::STATUS_HADIR,
    //                                 JadwalAbsensi::STATUS_TERLAMBAT,
    //                               ])->count(),
    //         'jumlah_alpha'     => $absensiCollection->where('status', JadwalAbsensi::STATUS_ALPHA)->count(),
    //         'jumlah_terlambat' => $absensiCollection->where('status', JadwalAbsensi::STATUS_TERLAMBAT)->count(),
    //         'jumlah_libur'     => $absensiCollection->where('status', JadwalAbsensi::STATUS_LIBUR)->count(),
    //     ];

    //     return Inertia::render('Admin/RekapPresensiDetail', [
    //         'petugas' => [
    //             'id'          => $petugas->id,
    //             'nama'        => $petugas->nama,
    //             'email'       => $petugas->email,
    //             'foto_profil' => $petugas->foto_profil,
    //             // Gunakan relasi supervisor() yang sudah ada di model User
    //             'supervisor'  => $petugas->supervisor?->nama,
    //         ],
    //         'absensi'   => $absensi,
    //         'ringkasan' => $ringkasan,
    //         'bulan'     => $bulan,
    //         'tahun'     => $tahun,
    //         'auth'      => ['user' => $request->user()],
    //     ]);
    // }
