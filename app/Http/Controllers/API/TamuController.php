<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Tamu;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

class TamuController extends Controller
{

    public function index()
    {
        $tamu = Tamu::with('user:id,nama,foto_profil')
            ->latest('waktu_masuk')
            ->get()
            ->map(fn (Tamu $item) => $this->formatTamu($item));

        return response()->json([
            'success' => true,
            'data'    => $tamu,
        ]);
    }


    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama'            => 'required|string|max:255',
            'alamat'          => 'required|string|max:1000',
            'keperluan'       => 'required|string|max:255',
            'foto_tamu'       => 'required|image|max:5120',
            'status'          => 'nullable|in:masuk,keluar',
            'estimasi_keluar' => 'nullable|date_format:Y-m-d H:i',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $fotoTamu = $request->file('foto_tamu');
            $path = $this->uploadToSupabase(
                $fotoTamu,
                $this->buildFotoPath($request->nama, $fotoTamu->getClientOriginalExtension())
            );

            // Parse "yyyy-MM-dd HH:mm" dari Flutter → Carbon
            // Sertakan timezone agar jam tidak geser saat disimpan ke DB
            $waktuKeluar = null;
            if ($request->filled('estimasi_keluar')) {
                $waktuKeluar = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $request->estimasi_keluar,
                    'Asia/Jakarta'      // sesuaikan dengan APP_TIMEZONE di .env
                )->setSecond(0);
            }

            $tamu = Tamu::create([
                'id_user'      => $request->user()->id,
                'nama'         => $request->nama,
                'alamat'       => $request->alamat,
                'keperluan'    => $request->keperluan,
                'foto_tamu'    => $path,
                'waktu_masuk'  => now(),
                'waktu_keluar' => $waktuKeluar,
                'status'       => $request->input('status', 'masuk'),
            ]);

        } catch (\Throwable $e) {
            Log::error('Gagal menyimpan data tamu', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data tamu berhasil disimpan.',
            'data'    => $this->formatTamu($tamu->load('user:id,nama,foto_profil')),
        ], 201);
    }


    public function update(Request $request, $id)
    {
        $tamu = Tamu::find($id);

        if (! $tamu) {
            return response()->json([
                'success' => false,
                'message' => 'Data tamu tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status'       => 'required|in:masuk,keluar',
            'waktu_keluar' => 'nullable|date',
            'jam_keluar'   => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $updateData = ['status' => $request->status];

        if ($request->status === 'keluar') {
            // Pakai waktu_keluar dari Flutter jika ada, fallback ke now()
            // Ini menimpa estimasi dengan jam aktual keluar
            $updateData['waktu_keluar'] = $request->filled('waktu_keluar')
                ? $request->date('waktu_keluar')
                : now();
        }

        $tamu->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Data tamu berhasil diperbarui.',
            'data'    => $this->formatTamu($tamu->fresh()->load('user:id,nama,foto_profil')),
        ]);
    }

    private function formatTamu(Tamu $tamu): array
    {
        $fotoTamu = $this->publicSupabaseUrl($tamu->foto_tamu);

        $adaWaktuKeluar = $tamu->waktu_keluar instanceof Carbon
            ? true
            : ($tamu->waktu_keluar !== null);

        $isEstimasi  = $tamu->status === 'masuk' && $adaWaktuKeluar;
        $waktuKeluar = $tamu->waktu_keluar?->toIso8601String();

        return [
            'id'              => $tamu->id,
            'id_user'         => $tamu->id_user,
            'nama'            => $tamu->nama,
            'alamat'          => $tamu->alamat,
            'keperluan'       => $tamu->keperluan,
            'foto_tamu'       => $fotoTamu,
            'waktu_masuk'     => $tamu->waktu_masuk?->toIso8601String(),
            // PERBAIKAN: selalu kirim waktu_keluar apa adanya dari DB
            'waktu_keluar'    => $waktuKeluar,
            // estimasi_keluar tetap ada untuk info tambahan
            'estimasi_keluar' => $isEstimasi ? $waktuKeluar : null,
            'status'          => $tamu->status,
            'user'            => $tamu->relationLoaded('user') && $tamu->user ? [
                'id'          => $tamu->user->id,
                'nama'        => $tamu->user->nama,
                'foto_profil' => $tamu->user->foto_profil,
            ] : null,
        ];
    }

    private function uploadToSupabase(UploadedFile $file, string $path): string
    {
        $supabaseUrl = config('services.supabase.url');
        $supabaseKey = config('services.supabase.key');
        $bucket      = config('services.supabase.bucket', 'aegis');

        if (! $supabaseUrl || ! $supabaseKey) {
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

        if (! $response->successful()) {
            Log::error('Supabase upload foto tamu gagal', [
                'path'   => $path,
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);

            throw new \Exception('Gagal upload foto tamu.');
        }

        return $path;
    }


    private function buildFotoPath(string $nama, string $extension): string
    {
        $safeExtension = $extension ?: 'jpg';
        return 'foto_tamu/' . Str::slug($nama) . '_' . Str::random(10) . ".{$safeExtension}";
    }


    private function publicSupabaseUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        $supabaseUrl = rtrim((string) config('services.supabase.url'), '/');
        $bucket      = config('services.supabase.bucket', 'aegis');

        $prefix = "storage/v1/object/public/{$bucket}/";
        if (Str::startsWith($path, $prefix)) {
            return "{$supabaseUrl}/{$path}";
        }

        return "{$supabaseUrl}/storage/v1/object/public/{$bucket}/" . ltrim($path, '/');
    }
}