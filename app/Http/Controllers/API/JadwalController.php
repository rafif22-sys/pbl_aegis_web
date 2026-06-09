<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Jadwal;
use App\Models\JadwalAbsensi;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class JadwalController extends Controller
{
    public function mingguan(Request $request)
    {
        $request->validate([
            'tanggal' => 'nullable|date',
        ]);

        $userId = Auth::id();

        $pivot       = $request->filled('tanggal')
            ? Carbon::parse($request->tanggal)
            : Carbon::today();

        $mulaiMinggu = $pivot->copy()->startOfWeek(Carbon::MONDAY);
        $akhirMinggu = $pivot->copy()->endOfWeek(Carbon::SUNDAY);

        $jadwalAbsensi = JadwalAbsensi::with([
            'jadwal.posJaga',
            'jadwal.shift',
        ])
            ->where('id_user', $userId)
            ->whereHas('jadwal', function ($q) use ($mulaiMinggu, $akhirMinggu) {
                $q->whereBetween('tanggal', [
                    $mulaiMinggu->toDateString(),
                    $akhirMinggu->toDateString(),
                ]);
            })
            ->orderBy('id_jadwal')
            ->get();

        $data = $jadwalAbsensi->map(function (JadwalAbsensi $ja) {
            $jadwal  = $ja->jadwal;
            $posJaga = $jadwal->posJaga;
            $shift   = $jadwal->shift;
            $tanggal = Carbon::parse($jadwal->tanggal);

            return [
                'id_jadwal_absensi' => $ja->id,
                'tanggal'           => $tanggal->toDateString(),
                'hari'              => $tanggal->locale('id')->translatedFormat('l'),
                'pos_jaga'          => $posJaga?->nama ?? '-',
                'jam_mulai'         => $shift?->jam_mulai             // ← format H:i
                    ? Carbon::parse($shift->jam_mulai)->format('H:i')
                    : '-',
                'jam_selesai'       => $shift?->jam_selesai           // ← format H:i
                    ? Carbon::parse($shift->jam_selesai)->format('H:i')
                    : '-',
                'nama_shift'        => $shift?->nama_shift ?? '-',
                'status'            => $ja->status,
                'jam_masuk'         => $ja->jam_masuk?->format('H:i'),
                'jam_pulang'        => $ja->jam_pulang?->format('H:i'),
            ];
        });

        return response()->json([
            'status'       => true,
            'minggu_mulai' => $mulaiMinggu->toDateString(),
            'minggu_akhir' => $akhirMinggu->toDateString(),
            'data'         => $data,
        ]);
    }

    public function riwayatAbsensi(Request $request)
    {
        $request->validate([
            'tanggal' => 'nullable|date',
            'status'  => 'nullable|in:menunggu,hadir,terlambat,alpha,libur',
        ]);

        $userId = Auth::id();
        $today  = Carbon::today()->toDateString();

        $query = JadwalAbsensi::with([
            'jadwal.posJaga',
            'jadwal.shift',
        ])
            ->where('id_user', $userId)
            ->whereHas('jadwal', fn($q) =>
                $q->whereDate('tanggal', '<=', $today)
            )
            ->where(function ($q) use ($today) {
                $q->where('status', '!=', 'menunggu')
                ->orWhereHas('jadwal', fn($q2) =>
                    $q2->whereDate('tanggal', $today)
                );
            });

        if ($request->filled('tanggal')) {
            $query->whereHas('jadwal', fn($q) =>
                $q->whereDate('tanggal', $request->tanggal)
            );
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $riwayat = $query
            ->orderByDesc('id')
            ->paginate(15);

        $mapped = $riwayat->through(function (JadwalAbsensi $ja) {
            $jadwal  = $ja->jadwal;
            $shift   = $jadwal->shift;
            $tanggal = Carbon::parse($jadwal->tanggal);

            return [
                'id_jadwal_absensi' => $ja->id,
                'tanggal'           => $tanggal->toDateString(),
                'hari'              => $tanggal->locale('id')->translatedFormat('l'),
                'pos_jaga'          => $jadwal->posJaga?->nama ?? '-',
                'jam_mulai'         => $shift?->jam_mulai
                    ? Carbon::parse($shift->jam_mulai)->format('H:i')
                    : '-',
                'jam_selesai'       => $shift?->jam_selesai
                    ? Carbon::parse($shift->jam_selesai)->format('H:i')
                    : '-',
                'nama_shift'        => $shift?->nama_shift ?? '-',
                'status'            => $ja->status,
                'jam_masuk'         => $ja->jam_masuk?->format('H:i'),
                'jam_pulang'        => $ja->jam_pulang?->format('H:i'),
            ];
        });

        return response()->json([
            'status' => true,
            'data'   => $mapped,
        ]);
    }

    public function showAbsensi(int $id)
    {
        $userId = Auth::id();

        $ja = JadwalAbsensi::with([
            'jadwal.posJaga',
            'jadwal.shift',
            'rute',
        ])
            ->where('id_user', $userId)
            ->findOrFail($id);

        $jadwal  = $ja->jadwal;
        $shift   = $jadwal->shift;
        $tanggal = Carbon::parse($jadwal->tanggal);

        return response()->json([
            'status' => true,
            'data'   => [
                'id_jadwal_absensi' => $ja->id,
                'tanggal'           => $tanggal->toDateString(),
                'hari'              => $tanggal->locale('id')->translatedFormat('l'),
                'pos_jaga'          => $jadwal->posJaga?->nama ?? '-',
                'alamat_pos'        => $jadwal->posJaga?->alamat ?? null,
                'jam_mulai'         => $shift?->jam_mulai             // ← format H:i
                    ? Carbon::parse($shift->jam_mulai)->format('H:i')
                    : '-',
                'jam_selesai'       => $shift?->jam_selesai           // ← format H:i
                    ? Carbon::parse($shift->jam_selesai)->format('H:i')
                    : '-',
                'nama_shift'        => $shift?->nama_shift ?? '-',
                'status'            => $ja->status,
                'jam_masuk'         => $ja->jam_masuk?->format('H:i'),
                'jam_pulang'        => $ja->jam_pulang?->format('H:i'),
                'foto_masuk'        => $ja->foto_masuk,
                'foto_pulang'       => $ja->foto_pulang,
                'latitude'          => $ja->latitude,
                'longitude'         => $ja->longitude,
                'rute'              => $ja->rute?->nama_rute ?? null,
            ],
        ]);
    }
}