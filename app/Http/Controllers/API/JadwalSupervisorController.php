<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\JadwalAbsensi;
use App\Models\PosJaga;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class JadwalSupervisorController extends Controller
{
    public function mingguan(Request $request): JsonResponse
    {
        $request->validate([
            'tanggal' => 'nullable|date',
        ]);

        $pivot = $request->filled('tanggal')
            ? Carbon::parse($request->tanggal)
            : Carbon::today();

        $mulaiMinggu = $pivot->copy()->startOfWeek(Carbon::MONDAY);
        $akhirMinggu = $pivot->copy()->endOfWeek(Carbon::SUNDAY);

        $data = $this->baseQuery()
            ->whereHas('jadwal', function ($query) use ($mulaiMinggu, $akhirMinggu) {
                $query->whereBetween('tanggal', [
                    $mulaiMinggu->toDateString(),
                    $akhirMinggu->toDateString(),
                ]);
            })
            ->orderBy('id_jadwal')
            ->get()
            ->map(fn (JadwalAbsensi $ja) => $this->formatItem($ja))
            ->values();

        return response()->json([
            'status'       => true,
            'minggu_mulai' => $mulaiMinggu->toDateString(),
            'minggu_akhir' => $akhirMinggu->toDateString(),
            'data'         => $data,
        ]);
    }

    public function riwayatAbsensi(Request $request): JsonResponse
    {
        $request->validate([
            'tanggal' => 'nullable|date',
            'status'  => 'nullable|in:menunggu,hadir,terlambat,alpha,libur',
            'page'    => 'nullable|integer|min:1',
        ]);

        $query = $this->baseQuery()
            ->whereHas('jadwal', fn ($q) => $q->whereDate('tanggal', '<=', Carbon::today()))
            ->where(function ($q) {
                $q->where('status', '!=', 'menunggu')
                    ->orWhereHas('jadwal', fn ($q2) => $q2->whereDate('tanggal', Carbon::today()));
            });

        if ($request->filled('tanggal')) {
            $query->whereHas('jadwal', fn ($q) => $q->whereDate('tanggal', $request->tanggal));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $riwayat = $query
            ->orderByDesc('id')
            ->paginate(15);

        $mapped = $riwayat->through(fn (JadwalAbsensi $ja) => $this->formatItem($ja));

        return response()->json([
            'status' => true,
            'data'   => $mapped,
        ]);
    }

    public function posJaga(): JsonResponse
    {
        try {
            $pos = PosJaga::orderBy('nama', 'asc')->get(['id', 'nama']);
            return response()->json([
                'status' => true,
                'data'   => $pos,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Gagal mengambil master pos jaga: ' . $e->getMessage()
            ], 500);
        }
    }

    private function baseQuery()
    {
        $supervisorId = Auth::id();

        return JadwalAbsensi::with([
            'user:id,nama,foto_profil,role,id_supervisor',
            'jadwal.posJaga',
            'jadwal.shift',
        ])
            ->whereHas('user', function ($query) use ($supervisorId) {
                $query->where('role', 'petugas')
                    ->where('id_supervisor', $supervisorId);
            });
    }

    private function formatItem(JadwalAbsensi $ja): array
    {
        $jadwal  = $ja->jadwal;
        $shift   = $jadwal?->shift;
        $posJaga = $jadwal?->posJaga;
        $tanggal = $jadwal?->tanggal ? Carbon::parse($jadwal->tanggal) : null;
        $user    = $ja->user;

        return [
            'id_jadwal_absensi' => $ja->id,
            'tanggal'           => $tanggal?->toDateString(),
            'hari'              => $tanggal ? $this->formatHari($tanggal) : null,
            'nama_petugas'      => $user?->nama ?? '-',
            'foto_profil'       => $this->resolveMediaUrl($user?->foto_profil),
            'pos_jaga'          => $posJaga?->nama ?? '-',
            'jam_mulai'         => $shift?->jam_mulai ? Carbon::parse($shift->jam_mulai)->format('H:i') : '-',
            'jam_selesai'       => $shift?->jam_selesai ? Carbon::parse($shift->jam_selesai)->format('H:i') : '-',
            'nama_shift'        => $shift?->nama_shift ?? '-',
            'status'            => $ja->status,
            'jam_masuk'         => $ja->jam_masuk?->format('H:i'),
            'jam_pulang'        => $ja->jam_pulang?->format('H:i'),
            
            // Tambahan Payload Foto Absen Petugas Lapangan
            'foto_absensi_masuk'  => $ja->foto_masuk ? $this->resolveMediaUrl($ja->foto_masuk) : null,
            'foto_absensi_pulang' => $ja->foto_pulang ? $this->resolveMediaUrl($ja->foto_pulang) : null,
        ];
    }

    private function formatHari(Carbon $tanggal): string
    {
        return match ($tanggal->dayOfWeekIso) {
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
            default => 'Minggu',
        };
    }

    private function resolveMediaUrl(?string $raw): ?string
    {
        if (!$raw || trim($raw) === '') {
            return null;
        }

        if (str_starts_with($raw, 'http://') || str_starts_with($raw, 'https://')) {
            return $raw;
        }

        $supabaseUrl = config('services.supabase.url');
        $bucket = config('services.supabase.bucket', 'aegis');
        $cleaned = ltrim($raw, '/');

        if (str_contains($cleaned, '/storage/v1/object/public/')) {
            return $cleaned;
        }

        return "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$cleaned}";
    }
}