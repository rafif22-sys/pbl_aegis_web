<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JadwalAbsensi;
use App\Models\LaporanCheckpoint;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LaporanPatroliController extends Controller
{
    public function index(Request $request)
    {
        $tanggal  = $request->input('tanggal', now()->toDateString());
        $modeAll  = $request->boolean('semua', false);

        // ── Query id_jadwal_absensi yang punya laporan checkpoint ──
        $baseQuery = LaporanCheckpoint::query();

        if (!$modeAll) {
            $baseQuery->whereHas('jadwal_absensi', function ($q) use ($tanggal) {
                $q->whereDate('jam_masuk', $tanggal);
            });
        }

        $idJadwalAbsensi = $baseQuery->distinct()->pluck('id_jadwal_absensi');

        // ── Ambil data JadwalAbsensi ──
        $absensiList = JadwalAbsensi::with([
                'user',
                'rute',
                'jadwal.shift',
                'laporanCheckpoint.rute_checkpoint.checkpoint',
            ])
            ->whereIn('id', $idJadwalAbsensi)
            ->orderByDesc('jam_masuk')
            ->get();

        // ── Hitung summary kondisi dari laporan_checkpoint yang ter-filter ──
        $semuaCheckpoint = LaporanCheckpoint::whereIn('id_jadwal_absensi', $idJadwalAbsensi)->get();

        $kondisiList = [
            'aman',
            'kerusakan fasilitas',
            'aktivitas mencurigakan',
            'kebersihan',
        ];

        $summary = [
            'total_patroli' => $absensiList->count(),
            'kondisi'       => collect($kondisiList)->mapWithKeys(function ($k) use ($semuaCheckpoint) {
                return [$k => $semuaCheckpoint->filter(fn($lc) => strtolower($lc->kondisi) === $k)->count()];
            })->toArray(),
        ];

        // ── Map laporan ──
        $laporan = $absensiList->map(function ($absensi) {
            $checkpoints     = $absensi->laporanCheckpoint;
            $totalCheckpoint = $checkpoints->count();

            $adaIsu = $checkpoints->contains(
                fn($lc) => strtolower($lc->kondisi) !== 'aman'
            );

            $detailCheckpoint = $checkpoints->map(function ($lc) {
                return [
                    'id'              => $lc->id,
                    'nama_checkpoint' => optional($lc->rute_checkpoint?->checkpoint)->nama ?? '—',
                    'urutan'          => $lc->rute_checkpoint?->urutan ?? 0,
                    'kondisi'         => $lc->kondisi,
                    'catatan'         => $lc->catatan,
                    'status'          => $lc->status,
                    'foto_bukti'      => $lc->foto_bukti
                                         ? env('SUPABASE_URL') . '/storage/v1/object/public/' . env('SUPABASE_BUCKET') . '/' . ltrim($lc->foto_bukti, '/')
                                         : null,
                    'waktu_laporan'   => $lc->waktu_laporan
                                         ? $lc->waktu_laporan->format('d/m/Y H:i')
                                         : null,
                    'selesai'         => (bool) $lc->selesai,
                    'penanganan'      => $lc->penanganan,
                ];
            })->sortBy('urutan')->values();

            return [
                'id'                => $absensi->id,
                'nama_petugas'      => $absensi->user?->nama ?? '—',
                'nama_rute'         => $absensi->rute?->nama_rute ?? '—',
                'nama_shift'        => $absensi->jadwal?->shift?->nama_shift ?? '—',
                'jam_masuk'         => $absensi->jam_masuk?->format('d/m H:i'),
                'jam_pulang'        => $absensi->jam_pulang?->format('d/m H:i'),
                'hari_tanggal' => $absensi->jam_masuk
                    ? $absensi->jam_masuk->isoFormat('ddd, D MMM Y')
                    : ($absensi->jadwal?->tanggal
                        ? $absensi->jadwal->tanggal->isoFormat('ddd, D MMM Y')  // ← fallback ke tanggal jadwal
                        : '—'),
                'jumlah_checkpoint' => $totalCheckpoint,
                'kondisi_count' => [
                    'aman'                   => $checkpoints->filter(fn($lc) => strtolower($lc->kondisi) === 'aman')->count(),
                    'kebersihan'             => $checkpoints->filter(fn($lc) => strtolower($lc->kondisi) === 'kebersihan')->count(),
                    'aktivitas mencurigakan' => $checkpoints->filter(fn($lc) => strtolower($lc->kondisi) === 'aktivitas mencurigakan')->count(),
                    'kerusakan fasilitas'    => $checkpoints->filter(fn($lc) => strtolower($lc->kondisi) === 'kerusakan fasilitas')->count(),
                ],
                'status_absensi'    => $absensi->status,
                'detail_checkpoint' => $detailCheckpoint,
            ];
        });

        return Inertia::render('Admin/LaporanPatroli', [
            'laporan' => $laporan,
            'tanggal' => $tanggal,
            'semua'   => $modeAll,
            'summary' => $summary,
            'auth'    => ['user' => $request->user()],
        ]);
    }
}