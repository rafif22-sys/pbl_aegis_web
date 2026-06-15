<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JadwalAbsensi;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DetailPresensiController extends Controller
{
    public function index(Request $request, $id)
    {
        $bulan   = (int) $request->input('bulan', now()->month);
        $tahun   = (int) $request->input('tahun', now()->year);
        $tanggal = $request->input('tanggal');
        $status  = $request->input('status');

        $user = User::with('supervisor')
            ->select('id', 'nama', 'email', 'no_hp', 'jenis_kelamin', 'alamat', 'foto_profil', 'id_supervisor')
            ->findOrFail($id);

        $jadwalAbsensi = JadwalAbsensi::with([
                'jadwal.posJaga',
                'jadwal.shift',
                'laporanCheckpoint',
            ])
            ->where('id_user', $id)
            ->whereHas('jadwal', function ($q) use ($bulan, $tahun, $tanggal) {
                $q->whereMonth('tanggal', $bulan)
                  ->whereYear('tanggal', $tahun);

                if ($tanggal) {
                    $q->whereDate('tanggal', $tanggal);
                }
            })
            ->when($status, fn ($q) => $q->where('status', $status))
            ->get()
            ->map(function ($item) {
                return [
                    'id'             => $item->id,
                    'tanggal'        => $item->jadwal->tanggal->format('Y-m-d'),
                    'hari'           => $item->jadwal->tanggal->translatedFormat('l'),
                    'status'         => $item->status,
                    'shift'          => $item->jadwal->shift->nama_shift ?? '-',
                    'jam_shift'      => trim(($item->jadwal->shift->jam_mulai ?? '') . ' - ' . ($item->jadwal->shift->jam_selesai ?? '')),
                    'pos_jaga'       => $item->jadwal->posJaga->nama ?? '-',
                    'jam_masuk'      => $item->jam_masuk ? $item->jam_masuk->format('H:i:s') : null,
                    'jam_pulang'     => $item->jam_pulang ? $item->jam_pulang->format('H:i:s') : null,
                    'status_patroli' => $item->laporanCheckpoint->isNotEmpty() ? 'sudah' : 'belum',
                ];
            })
            ->sortBy('tanggal')
            ->values();

        // Stats dihitung dari seluruh bulan, tanpa filter tanggal/status
        $statsQuery = JadwalAbsensi::where('id_user', $id)
            ->whereHas('jadwal', function ($q) use ($bulan, $tahun) {
                $q->whereMonth('tanggal', $bulan)
                  ->whereYear('tanggal', $tahun);
            })
            ->get();

        $stats = [
            'hadir'     => $statsQuery->where('status', JadwalAbsensi::STATUS_HADIR)->count(),
            'terlambat' => $statsQuery->where('status', JadwalAbsensi::STATUS_TERLAMBAT)->count(),
            'alpha'     => $statsQuery->where('status', JadwalAbsensi::STATUS_ALPHA)->count(),
            'libur'     => $statsQuery->where('status', JadwalAbsensi::STATUS_LIBUR)->count(),
        ];

        return Inertia::render('Admin/DetailRekapPresensi', [
            'auth'    => ['user' => $request->user()],
            'petugas' => [
                'id'            => $user->id,
                'nama'          => $user->nama,
                'email'         => $user->email,
                'no_hp'         => $user->no_hp,
                'jenis_kelamin' => $user->jenis_kelamin,
                'alamat'        => $user->alamat,
                'foto_profil'   => $user->foto_profil,
                'supervisor'    => $user->supervisor?->nama,
            ],
            'absensi' => $jadwalAbsensi,
            'stats'   => $stats,
            'filters' => [
                'bulan'   => $bulan,
                'tahun'   => $tahun,
                'tanggal' => $tanggal,
                'status'  => $status,
            ],
        ]);
    }

    public function show(Request $request, $id, $absensi)
    {
        $user = User::select('id', 'nama', 'email', 'foto_profil')
            ->findOrFail($id);

        $jadwalAbsensi = JadwalAbsensi::with([
                'jadwal.posJaga',
                'jadwal.shift',
                'rute',
                'laporanCheckpoint.checkpoint',
            ])
            ->where('id_user', $id)
            ->findOrFail($absensi);

        return Inertia::render('Admin/DetailPresensiHarian', [
            'auth'     => ['user' => $request->user()],
            'petugas'  => $user,
            'absensi'  => $jadwalAbsensi,
        ]);
    }

    public function detail(Request $request, $id, $absensi)
    {
        $ja = JadwalAbsensi::with([
                'jadwal.shift',
                'jadwal.posJaga',
            ])
            ->where('id_user', $id)
            ->findOrFail($absensi);

        $jadwal  = $ja->jadwal;
        $shift   = $jadwal->shift;
        $posJaga = $jadwal->posJaga;
        $tanggal = \Carbon\Carbon::parse($jadwal->tanggal);

        $jamMulai   = $tanggal->copy()->setTime($shift->jam_mulai->hour, $shift->jam_mulai->minute);
        $jamSelesai = $tanggal->copy()->setTime($shift->jam_selesai->hour, $shift->jam_selesai->minute);
        if ($shift->jam_selesai->format('H:i') < $shift->jam_mulai->format('H:i')) {
            $jamSelesai->addDay();
        }

        $supabaseUrl = rtrim((string) config('services.supabase.url'), '/');
        $bucket      = config('services.supabase.bucket', 'aegis');

        $fotoMasukUrl  = $ja->foto_masuk
            ? "{$supabaseUrl}/storage/v1/object/public/{$bucket}/" . ltrim($ja->foto_masuk, '/')
            : null;
        $fotoPulangUrl = $ja->foto_pulang
            ? "{$supabaseUrl}/storage/v1/object/public/{$bucket}/" . ltrim($ja->foto_pulang, '/')
            : null;

        return response()->json([
            'status' => true,
            'data'   => [
                'tanggal'     => $tanggal->format('Y-m-d'),
                'hari'        => $tanggal->locale('id')->translatedFormat('l'),
                'pos_jaga'    => $posJaga?->nama ?? '-',
                'nama_shift'  => $shift->nama_shift,
                'jam_shift'   => $jamMulai->format('H:i') . ' - ' . $jamSelesai->format('H:i'),
                'status'      => $ja->status,
                'jam_masuk'   => $ja->jam_masuk?->format('H:i:s'),
                'jam_pulang'  => $ja->jam_pulang?->format('H:i:s'),
                'foto_masuk'  => $fotoMasukUrl,
                'foto_pulang' => $fotoPulangUrl,
            ],
        ]);
    }
}