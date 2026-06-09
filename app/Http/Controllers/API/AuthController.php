<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthController extends Controller
{
    // ── Login API (Flutter) ─────────────────────────────
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah.',
            ], 401);
        }

        $allowedRoles = ['petugas', 'warga', 'supervisor'];
        if (! in_array($user->role, $allowedRoles)) {
            return response()->json([
                'message' => 'Akun ini tidak memiliki akses ke aplikasi mobile.',
            ], 403);
        }

        // Hapus FCM token dari user lain yang pakai HP yang sama
        if ($request->filled('fcm_token')) {
            User::where('fcm_token', $request->fcm_token)
                ->where('id', '!=', $user->id)
                ->update(['fcm_token' => null]);

            // Langsung simpan token ke user yang login
            $user->update(['fcm_token' => $request->fcm_token]);
        }

        $user->tokens()->where('name', $request->device_name)->delete();
        $token = $user->createToken('mobile-app', [$user->role]);

        return response()->json([
            'message' => 'Login berhasil.',
            'token'   => $token->plainTextToken,
            'user'    => $this->formatUser($user),
        ], 200);
    }

    // ── Get profil user yang sedang login ───────────────
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->formatUser($request->user()),
        ]);
    }

    public function saveFcmToken(Request $request): JsonResponse
    {
        $request->validate([
            'fcm_token' => ['required', 'string', 'max:500'],
        ]);

        $request->user()->update([
            'fcm_token' => $request->fcm_token,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'FCM token berhasil disimpan.',
        ]);
    }

    // ── Logout API ──────────────────────────────────────
    public function logout(Request $request): JsonResponse
    {
        // Hapus FCM token saat logout
        $request->user()->update(['fcm_token' => null]);
        
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }
    // ── Logout semua device ─────────────────────────────
    public function logoutAll(Request $request): JsonResponse
    {
        $request->user()->update(['fcm_token' => null]);
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Semua sesi berhasil dihapus.',
        ]);
    }

    // ── Format response user ────────────────────────────
    private function formatUser(User $user): array
    {
        $supabaseUrl = config('services.supabase.url');
        $bucket      = config('services.supabase.bucket', 'aegis');

        $data = [
            'id'               => $user->id,
            'nama'             => $user->nama,
            'email'            => $user->email,
            'role'             => $user->role,
            'tanggal_lahir'    => $user->tanggal_lahir?->format('Y-m-d'),
            'alamat'           => $user->alamat,
            'no_hp'            => $user->no_hp,
            'foto_profil'      => $user->foto_profil
                ? "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$user->foto_profil}"
                : null,
            'tanggal_bergabung'  => $user->tanggal_bergabung?->format('Y-m-d'),
            'wilayah_pengawasan' => $user->wilayah_pengawasan,
        ];

        if ($user->role === 'petugas' && $user->id_supervisor) {
            $data['supervisor'] = [
                'id'   => $user->supervisor->id,
                'nama' => $user->supervisor->nama,
            ];
        }

        return $data;
    }
}