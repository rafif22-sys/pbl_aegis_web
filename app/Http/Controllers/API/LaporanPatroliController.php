<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\JadwalAbsensi;
use App\Models\LaporanCheckpoint;
use Carbon\Carbon;
use Illuminate\Http\Request;

class LaporanPatroliController extends Controller
{
    // ──────────────────────────────────────────────────────────────────────────
    // GET /supervisor/laporan/minggu-ini
    // ──────────────────────────────────────────────────────────────────────────
    public function mingguIni(Request $request)
    {
        $mulai = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $akhir = Carbon::now()->endOfWeek(Carbon::SUNDAY);

        return response()->json([
            'status'       => 'success',
            'minggu_mulai' => $mulai->toDateString(),
            'minggu_akhir' => $akhir->toDateString(),
            'data'         => $this->_ringkasanPerHari($mulai, $akhir),
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /supervisor/laporan/riwayat
    // ?tanggal=Y-m-d  &per_page=10  &page=1
    // ──────────────────────────────────────────────────────────────────────────
    public function riwayat(Request $request)
    {
        $request->validate([
            'tanggal'  => 'nullable|date_format:Y-m-d',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $perPage = $request->input('per_page', 10);

        // Semua tanggal unik dari tabel jadwal SEBELUM minggu berjalan (patroli bisa 0)
        $batasAkhir = Carbon::now()->startOfWeek(Carbon::MONDAY)->subDay(); // Minggu kemarin

        $query = \App\Models\Jadwal::query()
            ->select('tanggal')
            ->distinct()
            ->whereDate('tanggal', '<=', $batasAkhir)
            ->orderByDesc('tanggal');

        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal', $request->tanggal);
        }

        $paginated = $query->paginate($perPage);

        $data = collect($paginated->items())->map(
            fn ($row) => $this->_ringkasanSatuHari(Carbon::parse($row->tanggal))
        );

        return response()->json([
            'status' => 'success',
            'data'   => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'data'         => $data,
            ],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /supervisor/laporan/harian/{tanggal}
    // ──────────────────────────────────────────────────────────────────────────
    public function harian(Request $request, string $tanggal)
    {
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggal)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Format tanggal tidak valid (Y-m-d)',
            ], 422);
        }

        $tgl = Carbon::parse($tanggal);

        // id_jadwal_absensi yang punya laporan checkpoint pada hari itu
        $idJadwalAbsensi = LaporanCheckpoint::query()
            ->distinct()
            ->whereHas('jadwal_absensi', fn ($q) => $q->whereDate('jam_masuk', $tgl))
            ->pluck('id_jadwal_absensi');

        $absensiList = JadwalAbsensi::with([
                'user:id,nama,foto_profil',
                'jadwal.posJaga:id,nama',
                'jadwal.shift:id,nama_shift,jam_mulai,jam_selesai',
                'laporanCheckpoint.rute_checkpoint.checkpoint:id,nama,latitude,longitude',
            ])
            ->whereIn('id', $idJadwalAbsensi)
            ->orderByDesc('jam_masuk')
            ->get();

        $totalCheckpoint = $absensiList->sum(fn ($a) => $a->laporanCheckpoint->count());
        $checkpointAman  = $absensiList->sum(
            fn ($a) => $a->laporanCheckpoint->where('kondisi', 'aman')->count()
        );

        $detail = $absensiList->map(function ($absensi) {
                $checkpoints = $absensi->laporanCheckpoint
                ->sortBy('waktu_laporan')   // ← urutkan berdasarkan waktu laporan
                ->values()
                ->map(fn ($lc) => [
                'id'              => $lc->id,
                'nama_checkpoint' => $lc->rute_checkpoint->checkpoint->nama ?? '-',
                'kondisi'         => $lc->kondisi,
                'status'          => $lc->status,
                'catatan'         => $lc->catatan,
                'foto_bukti'      => $lc->foto_bukti ? trim($lc->foto_bukti) : null,
                'waktu_laporan'   => $lc->waktu_laporan
                    ? Carbon::parse($lc->waktu_laporan)->format('H:i')
                    : null,
                'latitude'        => $lc->rute_checkpoint?->checkpoint?->latitude,
                'longitude'       => $lc->rute_checkpoint?->checkpoint?->longitude,
            ]);

            return [
                'id_absensi'       => $absensi->id,
                'petugas'          => [
                    'id'   => $absensi->user->id,
                    'nama' => $absensi->user->nama,
                    'foto_profil' => $absensi->user->foto_profil,
                ],
                'pos_jaga'         => $absensi->jadwal->posJaga->nama  ?? '-',
                'shift'            => $absensi->jadwal->shift->nama_shift   ?? '-',
                'jam_mulai'        => $absensi->jadwal->shift->jam_mulai    ?? '-',
                'jam_selesai'      => $absensi->jadwal->shift->jam_selesai  ?? '-',
                'jam_masuk'        => $absensi->jam_masuk
                    ? Carbon::parse($absensi->jam_masuk)->format('H:i')
                    : null,
                'jam_pulang'       => $absensi->jam_pulang
                    ? Carbon::parse($absensi->jam_pulang)->format('H:i')
                    : null,
                'status'           => $absensi->status,
                'foto_masuk'       => $absensi->foto_masuk,
                'foto_pulang'      => $absensi->foto_pulang,
                'total_checkpoint' => $checkpoints->count(),
                'checkpoints'      => $checkpoints,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data'   => [
                'tanggal'        => $tgl->toDateString(),
                'hari'           => $this->_namaHari($tgl->dayOfWeek),
                'ringkasan'      => [
                    'total_patroli'    => $idJadwalAbsensi->count(), // ← jumlah sesi patroli unik
                    'total_petugas'    => $absensiList->count(),
                    'total_checkpoint' => $totalCheckpoint,
                    'checkpoint_aman'  => $checkpointAman,
                ],
                'detail_petugas' => $detail,
            ],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Ringkasan 7 hari sekaligus — 1 query laporan_checkpoint + 1 query absensi
     */
    private function _ringkasanPerHari(Carbon $mulai, Carbon $akhir): array
    {
        // Ambil semua id_jadwal_absensi yang punya checkpoint dalam rentang
        $idJadwalAbsensi = LaporanCheckpoint::query()
            ->distinct()
            ->whereHas('jadwal_absensi', fn ($q) =>
                $q->whereBetween('jam_masuk', [
                    $mulai->copy()->startOfDay(),
                    $akhir->copy()->endOfDay(),
                ])
            )
            ->pluck('id_jadwal_absensi');

        // Ambil absensi beserta checkpoint, eager-load jadwal untuk tanggal
        $semuaAbsensi = JadwalAbsensi::with(['jadwal:id,tanggal', 'laporanCheckpoint'])
            ->whereIn('id', $idJadwalAbsensi)
            ->get();

        // Group berdasarkan DATE(jam_masuk); fallback ke tanggal jadwal
        $grouped = $semuaAbsensi->groupBy(function ($a) {
            return $a->jam_masuk
                ? Carbon::parse($a->jam_masuk)->toDateString()
                : ($a->jadwal?->tanggal
                    ? Carbon::parse($a->jadwal->tanggal)->toDateString()
                    : null);
        })->filter(fn ($v, $k) => $k !== null);

        $result  = [];
        $current = $mulai->copy();

        while ($current->lte($akhir)) {
            $tglStr  = $current->toDateString();
            $absensi = $grouped->get($tglStr, collect());

            $result[] = [
                'tanggal'          => $tglStr,
                'hari'             => $this->_namaHari($current->dayOfWeek),
                'total_patroli'    => $absensi->count(),   // jumlah sesi patroli unik
                'total_petugas'    => $absensi->pluck('id_user')->unique()->count(),
                'total_checkpoint' => $absensi->sum(fn ($a) => $a->laporanCheckpoint->count()),
            ];

            $current->addDay();
        }

        return $result;
    }

    /**
     * Ringkasan satu hari — dipakai oleh riwayat()
     * Semua tanggal ditampilkan; total_patroli = 0 jika belum ada laporan checkpoint
     */
    private function _ringkasanSatuHari(Carbon $tgl): array
    {
        // id_jadwal_absensi yang sudah submit laporan checkpoint pada hari itu
        $idDenganLaporan = LaporanCheckpoint::query()
            ->distinct()
            ->whereHas('jadwal_absensi', fn ($q) => $q->whereDate('jam_masuk', $tgl))
            ->pluck('id_jadwal_absensi');

        // Total petugas = petugas yang sudah melakukan patroli
        $totalPetugas = JadwalAbsensi::whereIn('id', $idDenganLaporan)
            ->distinct('id_user')
            ->count('id_user');

        // Total checkpoint dari sesi yang sudah laporan
        $totalCheckpoint = JadwalAbsensi::with('laporanCheckpoint')
            ->whereIn('id', $idDenganLaporan)
            ->get()
            ->sum(fn ($a) => $a->laporanCheckpoint->count());

        return [
            'tanggal'          => $tgl->toDateString(),
            'hari'             => $this->_namaHari($tgl->dayOfWeek),
            'total_patroli'    => $idDenganLaporan->count(), // 0 jika belum ada laporan
            'total_petugas'    => $totalPetugas,
            'total_checkpoint' => $totalCheckpoint,
        ];
    }

    private function _namaHari(int $dayOfWeek): string
    {
        return ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][$dayOfWeek];
    }
}