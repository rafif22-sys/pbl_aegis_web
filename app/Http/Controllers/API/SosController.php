<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Sos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SosController extends Controller
{
    /**
     * Kirim SOS baru
     * POST /api/sos
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'latitude'      => 'required|numeric|between:-90,90',
            'longitude'     => 'required|numeric|between:-180,180',
            'jenis_keadaan' => 'required|string|in:kebakaran,pencurian,hewan liar,bencana alam,lainnya',
            'deskripsi'     => 'required_if:jenis_keadaan,lainnya|nullable|string|max:1000',
            'bantuan_warga' => 'nullable|boolean',
            'penanganan' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $butuhWarga    = $request->boolean('bantuan_warga', false);
        $suffixBantuan = $butuhWarga
            ? 'pengirim memerlukan bantuan satpam dan warga segera.'
            : 'pengirim memerlukan bantuan satpam segera.';

        $labelKeadaan = [
            'kebakaran'    => 'kebakaran',
            'pencurian'    => 'pencurian',
            'hewan liar'   => 'hewan liar',
            'bencana alam' => 'bencana alam',
        ];

        if ($request->jenis_keadaan === 'lainnya') {
            $deskripsi = "Terdapat {$request->deskripsi} pada lokasi tersebut, {$suffixBantuan}";
        } else {
            $label     = $labelKeadaan[$request->jenis_keadaan];
            $deskripsi = "Terdapat {$label} pada lokasi tersebut, {$suffixBantuan}";
        }

        $sos = Sos::create([
            'id_user'       => $request->user()->id,
            'latitude'      => $request->latitude,
            'longitude'     => $request->longitude,
            'jenis_keadaan' => $request->jenis_keadaan,
            'deskripsi'     => $deskripsi,
            'waktu_kirim'   => now(),
            'status'        => 'menunggu bantuan',
            'bantuan_warga' => $butuhWarga,
        ]);

        app(\App\Services\FcmService::class)->sendSosNotification($sos);

        return response()->json([
            'success' => true,
            'message' => 'SOS berhasil dikirim.',
            'data'    => $sos->load('user:id,nama,foto_profil'),
        ], 201);
    }

    /**
     * Update status SOS (oleh petugas/supervisor)
     * PATCH /api/petugas/sos/{id}
     * PATCH /api/supervisor/sos/{id}
     */
    public function update(Request $request, $id)
    {
        $sos = Sos::find($id);

        if (!$sos) {
            return response()->json([
                'success' => false,
                'message' => 'Data SOS tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status'            => 'sometimes|required|in:menunggu bantuan,selesai',
            'bantuan_warga'     => 'sometimes|required|boolean',
            'deskripsi'         => 'sometimes|nullable|string|max:1000',
            'latitude_petugas'  => 'required_if:status,selesai|numeric|between:-90,90',
            'longitude_petugas' => 'required_if:status,selesai|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        if ($request->status === 'selesai') {
            $jarak = $this->hitungJarak(
                $sos->latitude,
                $sos->longitude,
                $request->latitude_petugas,
                $request->longitude_petugas,
            );

            $batasMeter = 30;

            if ($jarak > $batasMeter) {
                return response()->json([
                    'success' => false,
                    'message' => "Anda harus berada di lokasi kejadian untuk mengkonfirmasi SOS. "
                               . "Jarak Anda saat ini: " . round($jarak) . " meter.",
                    'data'    => [
                        'jarak_meter' => round($jarak),
                        'batas_meter' => $batasMeter,
                    ],
                ], 422);
            }
        }

        $updateData = $request->only(['status', 'bantuan_warga', 'deskripsi', 'penanganan']);

        // ← Catat siapa yang konfirmasi & kapan jika status selesai
        if ($request->status === 'selesai') {
            $updateData['dikonfirmasi_oleh'] = $request->user()->id;
            $updateData['waktu_konfirmasi']  = now();
        }

        $sos->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Data SOS berhasil diperbarui.',
            'data'    => $sos->fresh()->load(
                'user:id,nama,foto_profil',
                'konfirmator:id,nama,foto_profil' // ← relasi petugas konfirmator
            ),
        ]);
    }

    /**
     * Detail satu SOS
     * GET /api/sos/{id}
     */
    public function show($id)
    {
        $sos = Sos::with(
            'user:id,nama,foto_profil',
            'konfirmator:id,nama,foto_profil' // ← tambah
        )->find($id);

        if (!$sos) {
            return response()->json([
                'success' => false,
                'message' => 'Data SOS tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $sos,
        ]);
    }

    /**
     * List semua SOS
     * GET /api/sos
     */
    public function index(Request $request)
    {
        $query = Sos::with(
            'user:id,nama,foto_profil',
            'konfirmator:id,nama,foto_profil' // ← tambah
        )->latest('waktu_kirim');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->get(),
        ]);
    }

    /**
     * Hitung jarak Haversine (meter)
     */
    private function hitungJarak(
        float $lat1, float $lon1,
        float $lat2, float $lon2,
    ): float {
        $r    = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a    = sin($dLat / 2) ** 2
              + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        return $r * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}