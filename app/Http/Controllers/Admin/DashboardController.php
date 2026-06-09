<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Checkpoint;
use App\Models\Informasi;
use App\Models\PosJaga;
use App\Models\Rute;
use App\Models\Tamu;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use App\Services\FcmService;


class DashboardController extends Controller
{
    public function index(): Response
    {
        $userId = Auth::id();
        $cacheKey = 'informasi_last_read_' . $userId;
        $lastRead = cache()->get($cacheKey);

        if (!$lastRead) {
            $unreadCount = 0;
        } else {
            $unreadCount = Informasi::where('id_user', '!=', $userId)
                ->where('waktu_kirim', '>', $lastRead)
                ->count();
        }

        // Selalu perbarui cache setiap buka halaman → badge hilang setelah refresh
        cache()->forever($cacheKey, now());

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'petugas'    => User::where('role', 'petugas')->count(),
                'warga'      => User::where('role', 'warga')->count(),
                'supervisor' => User::where('role', 'supervisor')->count(),
                'rute'       => Rute::count(),
                'checkpoint' => Checkpoint::count(),
                'pos_jaga'   => PosJaga::count(),
            ],

            'buku_tamu' => Tamu::latest('waktu_masuk')
                ->limit(10)
                ->get(['id', 'nama', 'alamat', 'keperluan', 'waktu_masuk']),

            'rute_patroli' => Rute::with([
                'checkpoint' => fn ($q) => $q->orderBy('rute_checkpoint.urutan'),
            ])
            ->latest()
            ->get()
            ->map(fn ($rute) => [
                'id'        => $rute->id,
                'nama'      => $rute->nama_rute,
                'deskripsi' => $rute->checkpoint->pluck('nama')->join(' > '),
            ]),

            'unread_count' => $unreadCount,

            'informasi' => Informasi::with('user')
                ->latest('waktu_kirim')
                ->limit(50)
                ->get()
                ->reverse()
                ->values()
                ->map(fn ($info) => [
                    'id'          => $info->id,
                    'id_pengirim' => $info->id_user,
                    'pengirim'    => $info->user->nama ?? 'Unknown',
                    'role'        => $info->user->role ?? '',
                    'pesan'       => $info->pesan,
                    'waktu_iso'   => $info->waktu_kirim->toISOString(),
                ]),
        ]);
    }

    public function kirimPesan(Request $request)
    {
        $request->validate([
            'pesan' => ['required', 'string', 'max:1000'],
        ]);

        $informasi = Informasi::create([
            'id_user'     => Auth::id(),
            'pesan'       => $request->pesan,
            'waktu_kirim' => now(),
        ]);

        // Load relasi user untuk FcmService
        $informasi->load('user');

        // Trigger notifikasi FCM
        try {
            app(FcmService::class)->sendInformasiNotification($informasi);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('FCM informasi gagal: ' . $e->getMessage());
        }

        cache()->forever('informasi_last_read_' . Auth::id(), now());

        return back();
    }
}