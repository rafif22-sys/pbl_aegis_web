<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\JadwalAbsensi;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AbsensiController extends Controller
{
    // ── Helper: ambil jadwal absensi hari ini milik user ──────────────────
    private function getJadwalHariIni(): ?JadwalAbsensi
    {
        $now = Carbon::now();

        $shiftSemalam = JadwalAbsensi::with(['jadwal.shift', 'jadwal.posJaga', 'rute.checkpoint', 'user'])
            ->where('id_user', Auth::id())
            ->whereNotIn('status', ['libur', 'alpha'])
            ->whereNotNull('jam_masuk')
            ->whereNull('jam_pulang')
            ->whereHas('jadwal', fn($q) =>
                $q->whereDate('tanggal', Carbon::yesterday())
            )
            ->whereHas('jadwal.shift', function ($q) {
                // PostgreSQL: cast ke time untuk perbandingan
                $q->whereRaw('jam_selesai::time < jam_mulai::time');
            })
            ->first();

        if ($shiftSemalam) {
            $shift      = $shiftSemalam->jadwal->shift;
            $tanggal    = Carbon::parse($shiftSemalam->jadwal->tanggal);
            $jamSelesai = $tanggal->copy()
                ->setTime($shift->jam_selesai->hour, $shift->jam_selesai->minute)
                ->addDay();

            $batasPulang = $jamSelesai->copy()->addMinutes(30);

            if ($now->lessThanOrEqualTo($batasPulang)) {
                return $shiftSemalam;
            }
        }

        // Fallback: cari jadwal hari ini seperti biasa
        return JadwalAbsensi::with(['jadwal.shift', 'jadwal.posJaga', 'rute.checkpoint', 'user'])
            ->where('id_user', Auth::id())
            ->whereHas('jadwal', fn($q) =>
                $q->whereDate('tanggal', Carbon::today())
            )
            ->whereNotIn('status', ['libur'])
            ->first();
    }

    // ── GET /petugas/absensi/hari-ini ──────────────────────────────────────
    public function hariIni()
    {
        $ja = $this->getJadwalHariIni();

        if (!$ja) {
            return response()->json([
                'status'  => false,
                'message' => 'Tidak ada jadwal hari ini',
                'data'    => null,
            ]);
        }

        return response()->json([
            'status' => true,
            'data'   => $this->formatAbsensi($ja),
        ]);
    }

    // ── POST /petugas/absensi/masuk ────────────────────────────────────────
    public function absenMasuk(Request $request)
    {
        $request->validate([
            'foto'      => 'required|image|mimes:jpg,jpeg,png|max:5120',
            'latitude'  => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $ja = $this->getJadwalHariIni();

        if (!$ja) {
            return response()->json(['status' => false, 'message' => 'Tidak ada jadwal hari ini'], 422);
        }
        if ($ja->jam_masuk) {
            return response()->json(['status' => false, 'message' => 'Sudah melakukan absen masuk'], 422);
        }

        $shift    = $ja->jadwal->shift;
        $now      = Carbon::now();
        $jamMulai = Carbon::parse($ja->jadwal->tanggal)
            ->setTime($shift->jam_mulai->hour, $shift->jam_mulai->minute);

        // Bisa absen 15 menit sebelum shift
        $bolehMasuk = $jamMulai->copy()->subMinutes(15);
        if ($now->lessThan($bolehMasuk)) {
            return response()->json([
                'status'  => false,
                'message' => 'Belum waktunya absen. Absen masuk dibuka pukul ' . $bolehMasuk->format('H:i'),
            ], 422);
        }

        // Cek radius 50 meter
        $posJaga = $ja->jadwal->posJaga;
        if ($posJaga?->latitude && $posJaga?->longitude) {
            $jarak = $this->hitungJarak(
                $request->latitude, $request->longitude,
                $posJaga->latitude, $posJaga->longitude
            );
            if ($jarak > 50) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Anda berada di luar radius pos jaga (' . round($jarak) . 'm). Maksimal 50m.',
                ], 422);
            }
        }

        $fotoPath = $this->uploadFotoToSupabase(
            $request->file('foto'),
            $this->buildFotoPath($ja, 'masuk')
        );

        $ja->update([
            'jam_masuk'  => $now,
            'foto_masuk' => $fotoPath,
            'latitude'   => $request->latitude,
            'longitude'  => $request->longitude,
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Absen masuk berhasil',
            'data'    => $this->formatAbsensi($ja->fresh(['jadwal.shift', 'jadwal.posJaga', 'rute'])),
        ]);
    }

    // ── POST /petugas/absensi/pulang ───────────────────────────────────────
    public function absenPulang(Request $request)
    {
        $request->validate([
            'foto'      => 'required|image|mimes:jpg,jpeg,png|max:5120',
            'latitude'  => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $ja = $this->getJadwalHariIni();

        if (!$ja) {
            return response()->json(['status' => false, 'message' => 'Tidak ada jadwal hari ini'], 422);
        }
        if (!$ja->jam_masuk) {
            return response()->json(['status' => false, 'message' => 'Belum melakukan absen masuk'], 422);
        }
        if ($ja->jam_pulang) {
            return response()->json(['status' => false, 'message' => 'Sudah melakukan absen pulang'], 422);
        }

        $shift      = $ja->jadwal->shift;
        $now        = Carbon::now();
        $jamSelesai = Carbon::parse($ja->jadwal->tanggal)
            ->setTime($shift->jam_selesai->hour, $shift->jam_selesai->minute);

        // Handle shift malam (melewati tengah malam)
        $isShiftMalam = $shift->jam_selesai->format('H:i') < $shift->jam_mulai->format('H:i');
        if ($isShiftMalam) {
            $jamSelesai->addDay();
        }

        $batasAkhir = $jamSelesai->copy()->addMinutes(30);

        // ── Cek waktu pulang — dilewati jika pulang cepat diizinkan ──────────
        if (!(bool) $ja->pulang_cepat) {
            if ($now->lessThan($jamSelesai)) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Belum waktunya absen pulang. Dibuka pukul ' . $jamSelesai->format('H:i'),
                ], 422);
            }
            if ($now->greaterThan($batasAkhir)) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Batas waktu absen pulang sudah lewat (maks ' . $batasAkhir->format('H:i') . ')',
                ], 422);
            }
        }

        // ── Cek radius — tetap berlaku meski pulang cepat ────────────────────
        $posJaga = $ja->jadwal->posJaga;
        if ($posJaga?->latitude && $posJaga?->longitude) {
            $jarak = $this->hitungJarak(
                $request->latitude, $request->longitude,
                $posJaga->latitude, $posJaga->longitude
            );
            if ($jarak > 50) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Anda berada di luar radius pos jaga (' . round($jarak) . 'm). Maksimal 50m.',
                ], 422);
            }
        }

        // ── Cek patroli — dilewati jika pulang cepat diizinkan ───────────────
        if ($ja->rute && !(bool) $ja->pulang_cepat) {
            $jumlahCheckpoint = $ja->rute->checkpoint()->count();
            $jumlahDilaporkan = $ja->laporanCheckpoint()->count();

            if ($jumlahCheckpoint > 0 && $jumlahDilaporkan < $jumlahCheckpoint) {
                return response()->json([
                    'status'  => false,
                    'message' => "Belum bisa absen pulang. Selesaikan patroli terlebih dahulu ($jumlahDilaporkan/$jumlahCheckpoint checkpoint dilaporkan).",
                ], 422);
            }
        }

        $jamMulai = Carbon::parse($ja->jadwal->tanggal)
            ->setTime($shift->jam_mulai->hour, $shift->jam_mulai->minute);

        $jamMasuk = Carbon::parse($ja->jam_masuk);

        Log::info('Debug status absen pulang', [
            'tanggal_jadwal'   => $ja->jadwal->tanggal,
            'jam_mulai_shift'  => $shift->jam_mulai->format('H:i'),
            'jamMulai_parsed'  => $jamMulai->toDateTimeString(),
            'jamMasuk_raw'     => $ja->jam_masuk,
            'jamMasuk_parsed'  => $jamMasuk->toDateTimeString(),
            'jamMasuk_tz'      => Carbon::parse($ja->jam_masuk)->timezone(config('app.timezone'))->toDateTimeString(),
            'selisih_menit'    => $jamMasuk->diffInMinutes($jamMulai, false),
            'is_terlambat'     => $jamMasuk->greaterThan($jamMulai->copy()->addMinute()),
            'pulang_cepat'     => (bool) $ja->pulang_cepat,   // ← log tambahan
        ]);

        // Toleransi 1 menit untuk menghindari selisih detik kecil
        $statusAkhir = $jamMasuk->greaterThan($jamMulai->copy()->addMinute())
            ? JadwalAbsensi::STATUS_TERLAMBAT
            : JadwalAbsensi::STATUS_HADIR;

        $fotoPath = $this->uploadFotoToSupabase(
            $request->file('foto'),
            $this->buildFotoPath($ja, 'pulang')
        );

        $ja->update([
            'jam_pulang'  => $now,
            'foto_pulang' => $fotoPath,
            'status'      => $statusAkhir,
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Absen pulang berhasil. Status: ' . $statusAkhir,
            'data'    => $this->formatAbsensi($ja->fresh(['jadwal.shift', 'jadwal.posJaga', 'rute.checkpoint'])),
        ]);
    }

    // ── Format response ────────────────────────────────────────────────────
    private function formatAbsensi(JadwalAbsensi $ja): array
    {
        $jadwal     = $ja->jadwal;
        $shift      = $jadwal->shift;
        $posJaga    = $jadwal->posJaga;
        $tanggal    = Carbon::parse($jadwal->tanggal);

        $jamMulai   = $tanggal->copy()->setTime($shift->jam_mulai->hour, $shift->jam_mulai->minute);
        $jamSelesai = $tanggal->copy()->setTime($shift->jam_selesai->hour, $shift->jam_selesai->minute);

        if ($shift->jam_selesai->format('H:i') < $shift->jam_mulai->format('H:i')) {
            $jamSelesai->addDay();
        }

        $now         = Carbon::now();
        $bolehMasuk  = $jamMulai->copy()->subMinutes(15);
        $batasPulang = $jamSelesai->copy()->addMinutes(30);

        return [
            'id_jadwal_absensi'  => $ja->id,
            'tanggal'            => $tanggal->format('Y-m-d'),
            'hari'               => $tanggal->locale('id')->translatedFormat('l'),
            'pos_jaga'           => $posJaga?->nama ?? '-',
            'pos_jaga_lat'       => $posJaga?->latitude,
            'pos_jaga_lng'       => $posJaga?->longitude,
            'nama_shift'         => $shift->nama_shift,
            'jam_mulai'          => $jamMulai->format('H:i'),
            'jam_selesai'        => $jamSelesai->format('H:i'),
            'status'             => $ja->status,
            'jam_masuk'          => $ja->jam_masuk?->format('H:i'),
            'jam_pulang'         => $ja->jam_pulang?->format('H:i'),
            'foto_masuk'         => $this->publicSupabaseUrl($ja->foto_masuk),
            'foto_pulang'        => $this->publicSupabaseUrl($ja->foto_pulang),
            'rute' => $ja->rute ? [
                'id'                => $ja->rute->id,
                'nama_rute'         => $ja->rute->nama_rute,
                'jumlah_checkpoint' => $ja->rute->checkpoint->count(),
                'jumlah_dilaporkan' => $ja->laporanCheckpoint()->count(),
            ] : null,
            'pulang_cepat'       => (bool) $ja->pulang_cepat,   // ← tambah ini
            'boleh_absen_masuk'  => $now->greaterThanOrEqualTo($bolehMasuk) && !$ja->jam_masuk,
            'boleh_absen_pulang' => $ja->jam_masuk && !$ja->jam_pulang
                && (
                    // kondisi normal: sudah waktunya pulang
                    ($now->greaterThanOrEqualTo($jamSelesai) && $now->lessThanOrEqualTo($batasPulang))
                    ||
                    // ← kondisi pulang cepat: admin mengizinkan, sudah masuk
                    ((bool) $ja->pulang_cepat)
                ),
            'waktu_buka_masuk'   => $bolehMasuk->format('H:i'),
            'waktu_buka_pulang'  => $jamSelesai->format('H:i'),
            'batas_pulang'       => $batasPulang->format('H:i'),
        ];
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
            Log::error('Supabase upload foto absensi gagal', [
                'path'   => $path,
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new \Exception('Gagal upload foto absensi ke Supabase.');
        }

        return $path;
    }

    // ── Bangun path foto: foto_absensi/{tanggal}/{pos}/{shift}/{nama}/{file} ──
    private function buildFotoPath(JadwalAbsensi $ja, string $tipe): string
    {
        $tanggal     = Carbon::parse($ja->jadwal->tanggal)->format('Y-m-d');
        $posJaga     = Str::slug($ja->jadwal->posJaga?->nama      ?? 'unknown');
        $namaShift   = Str::slug($ja->jadwal->shift?->nama_shift  ?? 'unknown');
        $namaPetugas = Str::slug($ja->user?->nama                 ?? 'petugas');
        $namaFile    = $tipe === 'masuk' ? 'fotomasuk.jpg' : 'fotopulang.jpg';

        return "foto_absensi/{$tanggal}/{$posJaga}/{$namaShift}/{$namaPetugas}/{$namaFile}";
    }

    // ── Public URL dari path — sama dengan TamuController ─────────────────
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

    // ── Hitung jarak Haversine (meter) ─────────────────────────────────────
    private function hitungJarak(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $r = 6371000;
        $p = M_PI / 180;
        $a = 0.5 - cos(($lat2 - $lat1) * $p) / 2
            + cos($lat1 * $p) * cos($lat2 * $p)
            * (1 - cos(($lng2 - $lng1) * $p)) / 2;
        return 2 * $r * asin(sqrt($a));
    }
}