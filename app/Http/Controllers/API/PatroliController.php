<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\JadwalAbsensi;
use App\Models\LaporanCheckpoint;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PatroliController extends Controller
{
    const JARAK_TOLERANSI_METER = 30;

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/petugas/patroli/{idJadwalAbsensi}
    // ─────────────────────────────────────────────────────────────────────
    public function getSesi(Request $request, int $idJadwalAbsensi)
    {
        $user = Auth::user();

        $jadwal = JadwalAbsensi::with([
            'rute.ruteCheckpoints.checkpoint',
            'laporanCheckpoint',
            'jadwal.shift',
        ])
            ->where('id', $idJadwalAbsensi)
            ->where('id_user', $user->id)
            ->first();

        if (!$jadwal) {
            return response()->json([
                'status'  => false,
                'message' => 'Data jadwal tidak ditemukan.',
            ], 404);
        }

        if (!$jadwal->rute) {
            return response()->json([
                'status'  => false,
                'message' => 'Tidak ada rute patroli untuk sesi ini.',
            ], 404);
        }

        $rute  = $jadwal->rute;
        $shift = $jadwal->jadwal?->shift;

        $jamShift = '';
        if ($shift) {
            $jamMasuk  = $shift->jam_mulai   ? $shift->jam_mulai->format('H.i')   : '';
            $jamPulang = $shift->jam_selesai ? $shift->jam_selesai->format('H.i') : '';
            $jamShift  = "{$jamMasuk} - {$jamPulang}";
        }

        $checkpoints = $rute->ruteCheckpoints
            ->sortBy('urutan')
            ->map(function ($rc) use ($jadwal) {
                $cp      = $rc->checkpoint;
                $laporan = $jadwal->laporanCheckpoint
                    ->firstWhere('id_rute_checkpoint', $rc->id);

                return [
                    'id'              => $rc->id,
                    'id_checkpoint'   => $rc->id_checkpoint,
                    'urutan'          => $rc->urutan,
                    'nama_checkpoint' => $cp->nama      ?? '-',
                    'latitude'        => $cp->latitude  ?? null,
                    'longitude'       => $cp->longitude ?? null,
                    'deskripsi'       => $cp->deskripsi ?? null,
                    'laporan'         => $laporan ? [
                        'id'             => $laporan->id,
                        'kondisi'        => $laporan->kondisi,
                        'status'         => $laporan->status,    // 'belum' | 'selesai'
                        'waktu_laporan'  => $laporan->waktu_laporan?->toIso8601String(),
                    ] : null,
                ];
            })
            ->values();

        $polyline = $checkpoints
            ->map(fn($cp) => [
                'latitude'  => $cp['latitude'],
                'longitude' => $cp['longitude'],
            ])
            ->filter(fn($p) => $p['latitude'] && $p['longitude'])
            ->values();

        return response()->json([
            'status' => true,
            'data'   => [
                'id_jadwal_absensi' => $jadwal->id,
                'nama_rute'         => $rute->nama_rute,
                'deskripsi_rute'    => $rute->deskripsi ?? '',
                'nama_shift'        => $shift?->nama_shift ?? '',
                'jam_shift'         => $jamShift,
                'tanggal'           => $jadwal->jadwal?->tanggal
                    ? Carbon::parse($jadwal->jadwal->tanggal)->format('Y-m-d')
                    : '',
                'checkpoints'       => $checkpoints,
                'polyline'          => $polyline,
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/petugas/patroli/{idJadwalAbsensi}/lokasi
    // ─────────────────────────────────────────────────────────────────────
    public function updateLokasi(Request $request, int $idJadwalAbsensi)
    {
        $request->validate([
            'latitude'  => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $user   = Auth::user();
        $jadwal = JadwalAbsensi::where('id', $idJadwalAbsensi)
            ->where('id_user', $user->id)
            ->first();

        if (!$jadwal) {
            return response()->json([
                'status'  => false,
                'message' => 'Data jadwal tidak ditemukan.',
            ], 404);
        }

        $jadwal->update([
            'latitude'  => $request->latitude,
            'longitude' => $request->longitude,
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Lokasi diperbarui.',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/petugas/patroli/{idJadwalAbsensi}/laporan/{idRuteCheckpoint}
    //
    // Body (multipart/form-data):
    //   latitude             required|numeric   (posisi petugas saat simpan lokal)
    //   longitude            required|numeric   (posisi petugas saat simpan lokal)
    //   kondisi              required|string
    //   catatan              nullable|string
    //   waktu_laporan        nullable|string    format: "2026-04-21T08:34:12"
    //   nama_petugas         nullable|string    (untuk subfolder di Supabase bucket)
    //   skip_distance_check  nullable|boolean   (1/true = skip validasi jarak)
    //   foto[]               nullable|image|mimes:jpg,jpeg,png|max:5120  (maks 6 file)
    // ─────────────────────────────────────────────────────────────────────
    public function buatLaporan(Request $request, int $idJadwalAbsensi, int $idRuteCheckpoint)
    {
        $kondisiValid = ['aman', 'kerusakan fasilitas', 'aktivitas mencurigakan', 'kebersihan'];

        $request->validate([
            'latitude'             => 'required|numeric',
            'longitude'            => 'required|numeric',
            'kondisi'              => 'required|string|in:' . implode(',', $kondisiValid),
            'catatan'              => 'nullable|string|max:2000',
            'waktu_laporan'        => 'nullable|string',
            'nama_petugas'         => 'nullable|string|max:100',
            'skip_distance_check'  => 'nullable',
            'foto'                 => 'nullable|array|max:6',
            'foto.*'               => 'image|mimes:jpg,jpeg,png|max:5120',
        ]);

        $user = Auth::user();

        // ── 1. Validasi kepemilikan jadwal ──────────────────────────────
        $jadwal = JadwalAbsensi::with([
            'rute.ruteCheckpoints.checkpoint',
            'jadwal.shift',
        ])
            ->where('id', $idJadwalAbsensi)
            ->where('id_user', $user->id)
            ->first();

        if (!$jadwal) {
            return response()->json([
                'status'  => false,
                'message' => 'Data jadwal tidak ditemukan.',
            ], 404);
        }

        // ── 2. Validasi rute checkpoint ─────────────────────────────────
        $ruteCheckpoint = $jadwal->rute?->ruteCheckpoints
            ->firstWhere('id', $idRuteCheckpoint);

        if (!$ruteCheckpoint) {
            return response()->json([
                'status'  => false,
                'message' => 'Checkpoint tidak ditemukan dalam rute ini.',
            ], 404);
        }

        // ── 3. Cek laporan sudah ada ────────────────────────────────────
        $sudahAda = LaporanCheckpoint::where('id_jadwal_absensi', $idJadwalAbsensi)
            ->where('id_rute_checkpoint', $idRuteCheckpoint)
            ->exists();

        if ($sudahAda) {
            return response()->json([
                'status'  => false,
                'message' => 'Laporan untuk checkpoint ini sudah dibuat.',
            ], 422);
        }

        // ── 4. Validasi jarak petugas → checkpoint ──────────────────────
        // skip_distance_check = true → jarak sudah divalidasi Flutter saat "Simpan Lokal"
        $skipJarak = filter_var($request->input('skip_distance_check', false), FILTER_VALIDATE_BOOLEAN);

        $checkpoint = $ruteCheckpoint->checkpoint;

        if (!$checkpoint->latitude || !$checkpoint->longitude) {
            return response()->json([
                'status'  => false,
                'message' => 'Koordinat checkpoint belum dikonfigurasi.',
            ], 422);
        }

        $jarak = $this->hitungJarak(
            $request->latitude,
            $request->longitude,
            $checkpoint->latitude,
            $checkpoint->longitude,
        );

        Log::info('Patroli: cek jarak checkpoint', [
            'id_user'              => $user->id,
            'id_rute_checkpoint'   => $idRuteCheckpoint,
            'nama_checkpoint'      => $checkpoint->nama,
            'lat_petugas'          => $request->latitude,
            'lng_petugas'          => $request->longitude,
            'lat_checkpoint'       => $checkpoint->latitude,
            'lng_checkpoint'       => $checkpoint->longitude,
            'jarak_meter'          => round($jarak, 2),
            'toleransi'            => self::JARAK_TOLERANSI_METER,
            'skip_distance_check'  => $skipJarak,
        ]);

        // Validasi jarak hanya jika skip_distance_check tidak aktif
        if (!$skipJarak && $jarak > self::JARAK_TOLERANSI_METER) {
            return response()->json([
                'status'  => false,
                'message' => 'Anda berada di luar radius checkpoint "' .
                            $checkpoint->nama . '" (' . round($jarak) . 'm). ' .
                            'Maksimal ' . self::JARAK_TOLERANSI_METER . 'm.',
                'data'    => [
                    'jarak_meter' => round($jarak),
                    'toleransi'   => self::JARAK_TOLERANSI_METER,
                ],
            ], 422);
        }

        $fotoPaths = [];
        if ($request->hasFile('foto')) {
            foreach ($request->file('foto') as $index => $file) {
                $path        = $this->buildFotoPath($jadwal, $user, $checkpoint, $request->input('nama_petugas'), $index + 1);
                $fotoPaths[] = $this->uploadFotoToSupabase($file, $path);
            }
        }

        // ── 6. Parse waktu laporan ──────────────────────────────────────
        $waktuLaporan = now();
        if ($request->filled('waktu_laporan')) {
            try {
                $waktuLaporan = Carbon::parse($request->waktu_laporan);
            } catch (\Exception $e) {
                Log::warning('Patroli: gagal parse waktu_laporan', [
                    'raw'   => $request->waktu_laporan,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // ── 7. Simpan laporan ───────────────────────────────────────────
        // Kembalikan ke format path tunggal (menyimpan path foto pertama)
        $fotoBuktiPath = !empty($fotoPaths) ? $fotoPaths[0] : null;

        Log::info('Patroli: simpan foto_bukti', [
            'foto_paths'      => $fotoPaths,
            'foto_bukti'      => $fotoBuktiPath,
        ]);

        $laporan = LaporanCheckpoint::create([
            'id_jadwal_absensi'  => $idJadwalAbsensi,
            'id_rute_checkpoint' => $idRuteCheckpoint,
            'kondisi'            => $request->kondisi,
            'catatan'            => $request->catatan,
            'foto_bukti'         => $fotoBuktiPath,
            'waktu_laporan'      => $waktuLaporan,
            'status'             => 'selesai',
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Laporan berhasil disimpan.',
            'data'    => [
                'id'            => $laporan->id,
                'kondisi'       => $laporan->kondisi,
                'status'        => $laporan->status,
                'waktu_laporan' => $laporan->waktu_laporan->toIso8601String(),
            ],
        ], 201);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────
    private function hitungJarak(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $r = 6371000;
        $p = M_PI / 180;
        $a = 0.5 - cos(($lat2 - $lat1) * $p) / 2
            + cos($lat1 * $p) * cos($lat2 * $p)
            * (1 - cos(($lng2 - $lng1) * $p)) / 2;

        return 2 * $r * asin(sqrt($a));
    }

    private function uploadFotoToSupabase(\Illuminate\Http\UploadedFile $file, string $path): string
    {
        $supabaseUrl = config('services.supabase.url');
        $supabaseKey = config('services.supabase.key');
        $bucket      = config('services.supabase.bucket', 'aegis');

        if (!$supabaseUrl || !$supabaseKey) {
            throw new \Exception('Konfigurasi Supabase belum lengkap.');
        }

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$supabaseKey}",
            'x-upsert'      => 'true',
        ])->attach(
            'file',
            fopen($file->getRealPath(), 'r'),
            $file->getClientOriginalName(),
            ['Content-Type' => $file->getMimeType()]
        )->post("{$supabaseUrl}/storage/v1/object/{$bucket}/{$path}");

        if (!$response->successful()) {
            Log::error('Supabase upload foto laporan patroli gagal', [
                'path'   => $path,
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new \Exception('Gagal upload foto laporan ke Supabase.');
        }

        return $path;
    }

    /**
     * Build path folder di Supabase bucket:
     * foto_patroli/{tanggal}/{nama_shift}/{nama_petugas}/{nama_checkpoint}/foto_{n}.jpg
     *
     * Contoh: foto_patroli/2026-06-08/pagi-07.00-15.00/budi-santoso/pos-1/foto_1.jpg
     */
    private function buildFotoPath(JadwalAbsensi $jadwal, $user, $checkpoint, ?string $namaPetugasFromRequest, int $index): string
    {
        // Tanggal patroli
        $tanggalRaw = $jadwal->jadwal->tanggal;
        $tanggal = $tanggalRaw instanceof \Carbon\Carbon
            ? $tanggalRaw->format('Y-m-d')
            : Carbon::parse($tanggalRaw)->format('Y-m-d');

        // Nama shift (dari relasi jadwal->shift)
        $shift     = $jadwal->jadwal?->shift;
        $namaShift = $shift ? Str::slug($shift->nama_shift ?? 'shift') : 'shift';

        // Nama petugas: prioritaskan dari request (dikirim Flutter),
        // fallback ke Auth::user()->nama
        $namaPetugas = $namaPetugasFromRequest ?? $user->nama ?? 'petugas';
        $namaPetugas = Str::slug($namaPetugas);

        $namaCheckpoint = Str::slug($checkpoint->nama ?? 'checkpoint');

        return "foto_patroli/{$tanggal}/{$namaShift}/{$namaPetugas}/{$namaCheckpoint}/foto_{$index}.jpg";
    }

    private function publicSupabaseUrl(?string $path): ?string
    {
        if (!$path) return null;

        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        $supabaseUrl = rtrim((string) config('services.supabase.url'), '/');
        $bucket      = config('services.supabase.bucket', 'aegis');

        return "{$supabaseUrl}/storage/v1/object/public/{$bucket}/" . ltrim($path, '/');
    }
}