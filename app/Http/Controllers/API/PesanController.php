<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Informasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class PesanController extends Controller
{
    /**
     * List pesan untuk aplikasi mobile.
     * GET /api/pesan?filter=semua|belum_dibaca|favorit
     */
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'filter' => 'nullable|in:semua,belum_dibaca,favorit',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $userId = $user->id;
        $userRole = strtolower($user->role ?? '');
        $filter = $request->query('filter', 'semua');
        $lastRead = Cache::get($this->lastReadKey($userId));
        $favoriteIds = $this->favoriteIds($userId);

        // 1. Buat Query Dasar
        $query = Informasi::with('user:id,nama,role')->latest('waktu_kirim');

        // 2. Filter Berdasarkan Role
        if ($userRole === 'petugas') {
            // Petugas HANYA melihat pesan dari Admin ATAU Supervisornya sendiri
            $idSupervisor = $user->id_supervisor;
            $query->whereHas('user', function ($q) use ($idSupervisor) {
                $q->where('role', 'admin')
                  ->orWhere('id', $idSupervisor);
            });
        } elseif ($userRole === 'supervisor') {
            // Supervisor melihat pesan dari Admin ATAU pesan yang dia kirim sendiri
            $query->whereHas('user', function ($q) use ($userId) {
                $q->where('role', 'admin')
                  ->orWhere('id', $userId);
            });
        }

        // 3. Eksekusi Query dan Format
        $pesan = $query->get()
            ->map(fn (Informasi $item) => $this->formatPesan($item, $userId, $lastRead, $favoriteIds));

        if ($filter === 'belum_dibaca') {
            $pesan = $pesan->where('isUnread', true)->values();
        }

        if ($filter === 'favorit') {
            $pesan = $pesan->where('isStarred', true)->values();
        }

        return response()->json([
            'success' => true,
            'data' => $pesan->values(),
        ]);
    }

    /**
     * Menyimpan pesan baru dari Supervisor.
     * POST /api/supervisor/pesan
     */
    public function store(Request $request)
    {
        // 1. Validasi input dari Flutter
        $validator = Validator::make($request->all(), [
            'pesan' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Pesan tidak boleh kosong.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // 2. Simpan ke database tabel informasi
            $informasi = new Informasi();
            $informasi->id_user = $request->user()->id; // Mengambil ID supervisor yang sedang login
            $informasi->pesan = $request->pesan;
            $informasi->waktu_kirim = now();
            $informasi->save();

            // Load user untuk FcmService
            $informasi->load('user');

            // Trigger notifikasi FCM
            try {
                app(\App\Services\FcmService::class)->sendInformasiNotification($informasi);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('FCM informasi gagal: ' . $e->getMessage());
            }

            // 3. Beri jawaban sukses ke Flutter
            return response()->json([
                'success' => true,
                'message' => 'Pesan berhasil dikirim.',
                'data' => $informasi
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan pesan: ' . $e->getMessage()
            ], 500);
        }
    }   

    private function formatPesan(Informasi $informasi, int $userId, $lastRead, array $favoriteIds): array
    {
        $role = strtolower((string) ($informasi->user->role ?? ''));
        $waktuKirim = $informasi->waktu_kirim;

        return [
            'id'               => $informasi->id,
            'sender'           => $this->namaPengirim($informasi),
            'role'             => $role, // ← tambah ini
            'time'             => $waktuKirim?->locale('id')->translatedFormat('d F Y | H.i'),
            'content'          => $informasi->pesan,
            'isStarred'        => in_array((int) $informasi->id, $favoriteIds, true),
            'isUnread'         => $this->isUnread($informasi, $userId, $lastRead),
            'hasLeftIndicator' => $role === 'supervisor',
        ];
    }

    /**
     * Toggle favorit sebuah pesan
     * POST /api/pesan/{id}/favorit
     */
    public function toggleFavorit(Request $request, $id)
    {
        $userId      = $request->user()->id;
        $favoriteIds = $this->favoriteIds($userId);

        $id = (int) $id;
        if (in_array($id, $favoriteIds, true)) {
            $favoriteIds = array_values(array_filter($favoriteIds, fn($fid) => $fid !== $id));
        } else {
            $favoriteIds[] = $id;
        }

        Cache::put($this->favoriteKey($userId), $favoriteIds);

        return response()->json(['success' => true, 'favorited' => in_array($id, $favoriteIds, true)]);
    }

    /**
     * Tandai semua pesan sudah dibaca
     * POST /api/pesan/mark-read
     */
    public function markRead(Request $request)
    {
        Cache::put($this->lastReadKey($request->user()->id), now());
        return response()->json(['success' => true]);
    }

    public function unreadCount(Request $request)
    {
        $user = $request->user();
        $userId = $user->id;
        $userRole = strtolower($user->role ?? '');
        $lastRead = Cache::get($this->lastReadKey($userId));

        // 1. Buat Query Dasar
        $query = Informasi::latest('waktu_kirim');

        // 2. Filter Berdasarkan Role (Sama persis seperti di index)
        if ($userRole === 'petugas') {
            $idSupervisor = $user->id_supervisor;
            $query->whereHas('user', function ($q) use ($idSupervisor) {
                $q->where('role', 'admin')
                  ->orWhere('id', $idSupervisor);
            });
        } elseif ($userRole === 'supervisor') {
            $query->whereHas('user', function ($q) use ($userId) {
                $q->where('role', 'admin')
                  ->orWhere('id', $userId);
            });
        }

        // 3. Hitung jumlah yang belum dibaca
        $count = $query->get()
            ->filter(fn($item) => $this->isUnread($item, $userId, $lastRead))
            ->count();

        return response()->json(['success' => true, 'count' => $count]);
    }

    private function namaPengirim(Informasi $informasi): string
    {
        $role = strtolower((string) ($informasi->user->role ?? ''));
        $nama = $informasi->user->nama ?? 'Unknown';

        if ($role === 'system' || $role === 'aegis') {
            return 'AEGIS';
        }

        return $nama;
    }

    private function isUnread(Informasi $informasi, int $userId, $lastRead): bool
    {
        if ($informasi->id_user === $userId) {
            return false;
        }

        if (! $lastRead) {
            return true;
        }

        return $informasi->waktu_kirim?->greaterThan($lastRead) ?? false;
    }

    private function favoriteIds(int $userId): array
    {
        return array_map('intval', Cache::get($this->favoriteKey($userId), []));
    }

    private function lastReadKey(int $userId): string
    {
        return "pesan_last_read_{$userId}";
    }

    private function favoriteKey(int $userId): string
    {
        return "pesan_favorites_{$userId}";
    }
}
