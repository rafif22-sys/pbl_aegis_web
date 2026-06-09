<?php

namespace App\Services;

use App\Models\User;
use App\Models\Sos;
use App\Models\Informasi;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmService
{
    private string $projectId;
    private string $serviceAccountPath;

    public function __construct()
    {
        $this->projectId          = (string) config('services.firebase.project_id', '');
        $this->serviceAccountPath = storage_path('aegis-7b556-firebase-adminsdk-fbsvc-cda5d9b622.json');
    }

    /**
     * Kirim notifikasi SOS ke semua user yang punya FCM token
     */
    public function sendSosNotification(Sos $sos): void
    {
        $tokens = User::whereNotNull('fcm_token')
            ->where('id', '!=', $sos->id_user)
            ->pluck('fcm_token')
            ->unique()
            ->values()
            ->toArray();

        if (empty($tokens)) return;

        $jenisLabel = [
            'kebakaran'    => 'Kebakaran',
            'pencurian'    => 'Pencurian',
            'hewan liar'   => 'Hewan Liar',
            'bencana alam' => 'Bencana Alam',
            'lainnya'      => 'Darurat',
        ];

        $judul = '🚨 SOS ' . ($jenisLabel[$sos->jenis_keadaan] ?? 'Darurat');
        $body  = $sos->deskripsi;
        $data  = [
            'sos_id'    => (string) $sos->id,
            'jenis'     => $sos->jenis_keadaan,
            'latitude'  => (string) $sos->latitude,
            'longitude' => (string) $sos->longitude,
            'type'      => 'sos_baru',
            'title'     => $judul,
            'body'      => $body,
        ];

        $accessToken = $this->getAccessToken();
        if (!$accessToken) return;

        foreach ($tokens as $token) {
            $this->kirimKeToken($token, $judul, $body, $data, $accessToken);
        }

        Log::info('FCM SOS - jumlah token: ' . count($tokens));
    }

    /**
     * Kirim notifikasi informasi baru
     * - Admin → semua petugas & supervisor
     * - Supervisor → petugas yang diawasi supervisor tersebut
     */
    public function sendInformasiNotification(Informasi $informasi): void
    {
        $pengirim = $informasi->user;
        if (!$pengirim) return;

        $tokens = collect();

        if ($pengirim->role === 'admin') {
            $tokens = User::whereNotNull('fcm_token')
                ->whereIn('role', ['petugas', 'supervisor'])
                ->where('id', '!=', $pengirim->id)
                ->pluck('fcm_token')
                ->unique()
                ->values();

        } elseif ($pengirim->role === 'supervisor') {
            $tokens = User::whereNotNull('fcm_token')
                ->where('role', 'petugas')
                ->where('id_supervisor', $pengirim->id)
                ->pluck('fcm_token')
                ->unique()
                ->values();
        }

        if ($tokens->isEmpty()) return;

        $namaPengirim = match ($pengirim->role) {
            'admin'      => 'Admin',
            'supervisor' => 'Supervisor',
            default      => $pengirim->nama,
        };

        $judul = '📢 Informasi Baru dari ' . $namaPengirim;
        $body  = strlen($informasi->pesan) > 100
            ? substr($informasi->pesan, 0, 100) . '...'
            : $informasi->pesan;

        $data = [
            'informasi_id'  => (string) $informasi->id,
            'type'          => 'informasi_baru',
            'pengirim'      => $namaPengirim,
            'role_pengirim' => $pengirim->role,
            'title'         => $judul,
            'body'          => $body,
        ];

        $accessToken = $this->getAccessToken();
        if (!$accessToken) return;

        foreach ($tokens as $token) {
            $this->kirimKeToken($token, $judul, $body, $data, $accessToken);
        }

        Log::info('FCM Informasi - jumlah token: ' . count($tokens));
    }

    /**
     * Kirim satu notifikasi ke satu device
     */
    private function kirimKeToken(
        string $token,
        string $judul,
        string $body,
        array  $data,
        string $accessToken,
    ): void {
        try {
            // Tentukan channel_id berdasarkan type
            $channelId = ($data['type'] ?? '') === 'informasi_baru'
                ? 'info_channel'
                : 'sos_channel';

            $response = Http::withToken($accessToken)
                ->timeout(10)
                ->post(
                    "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send",
                    [
                        'message' => [
                            'token'   => $token,
                            'data'    => $data,
                            'android' => [
                                'priority' => 'high',
                            ],
                        ],
                    ]
                );

            if (!$response->successful()) {
                Log::warning('FCM gagal', [
                    'token'  => substr($token, 0, 20) . '...',
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);

                if ($response->status() === 404) {
                    User::where('fcm_token', $token)
                        ->update(['fcm_token' => null]);
                }
            }
        } catch (\Throwable $e) {
            Log::error('FCM exception: ' . $e->getMessage());
        }
    }

    /**
     * Ambil access token dari Google OAuth2 via Service Account
     */
    private function getAccessToken(): ?string
    {
        try {
            $serviceAccount = json_decode(
                file_get_contents($this->serviceAccountPath),
                true
            );

            $now   = time();
            $claim = [
                'iss'   => $serviceAccount['client_email'],
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                'aud'   => 'https://oauth2.googleapis.com/token',
                'iat'   => $now,
                'exp'   => $now + 3600,
            ];

            $jwt = $this->buatJwt($claim, $serviceAccount['private_key']);

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ]);

            return $response->json('access_token');

        } catch (\Throwable $e) {
            Log::error('FCM getAccessToken error: ' . $e->getMessage());
            return null;
        }
    }

    private function buatJwt(array $claim, string $privateKey): string
    {
        $header  = $this->base64url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $payload = $this->base64url(json_encode($claim));
        $data    = "{$header}.{$payload}";

        openssl_sign($data, $signature, $privateKey, 'SHA256');

        return "{$data}." . $this->base64url($signature);
    }

    private function base64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}