<?php
// app/Http/Controllers/Api/ForgotPasswordController.php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Mail\OtpMail;
use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class ForgotPasswordController extends Controller
{
    // ── STEP 1: Kirim OTP ke email ────────────────────────
    public function sendOtp(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', $request->email)
                    ->whereIn('role', ['petugas', 'supervisor', 'warga'])
                    ->first();

        // Selalu balas 200 agar email valid/tidak valid tidak bocor
        if (! $user) {
            return response()->json([
                'message' => 'Jika email terdaftar, kode OTP akan dikirimkan.',
            ]);
        }

        // Hapus OTP lama milik email ini
        PasswordResetOtp::where('email', $request->email)->delete();

        // Generate OTP 6 digit
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        PasswordResetOtp::create([
            'email'      => $request->email,
            'otp'        => Hash::make($otp),   // simpan hash, bukan plain
            'expires_at' => now()->addMinutes(10),
        ]);

        Mail::to($user->email)->send(new OtpMail($otp, $user->nama));

        return response()->json([
            'message' => 'Jika email terdaftar, kode OTP akan dikirimkan.',
        ]);
    }

    // ── STEP 2: Verifikasi OTP ────────────────────────────
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'otp'   => ['required', 'string', 'size:6'],
        ]);

        $record = PasswordResetOtp::where('email', $request->email)
                                  ->where('is_used', false)
                                  ->latest()
                                  ->first();

        if (! $record || ! Hash::check($request->otp, $record->otp)) {
            return response()->json(['message' => 'Kode OTP tidak valid.'], 422);
        }

        if (! $record->isValid()) {
            return response()->json(['message' => 'Kode OTP sudah kadaluarsa.'], 422);
        }

        // Tandai OTP terverifikasi (belum di-consume, baru di-verify)
        // Gunakan ID sebagai reset_token sementara yang dikirim ke Flutter
        $resetToken = encrypt($record->id . '|' . $request->email);

        return response()->json([
            'message'      => 'OTP valid.',
            'reset_token'  => $resetToken,
        ]);
    }

    // ── STEP 3: Reset password ────────────────────────────
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'reset_token'           => ['required', 'string'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
            // 'password_confirmation' otomatis dicek oleh 'confirmed'
        ]);

        // Dekripsi reset_token
        try {
            [$recordId, $email] = explode('|', decrypt($request->reset_token));
        } catch (\Throwable) {
            return response()->json(['message' => 'Token tidak valid.'], 422);
        }

        $record = PasswordResetOtp::find($recordId);

        if (! $record || $record->email !== $email || $record->is_used || ! $record->isValid()) {
            return response()->json(['message' => 'Token sudah kadaluarsa atau tidak valid.'], 422);
        }

        $user = User::where('email', $email)->first();
        if (! $user) {
            return response()->json(['message' => 'Pengguna tidak ditemukan.'], 404);
        }

        // Update password
        $user->update(['password' => Hash::make($request->password)]);

        // Tandai OTP sudah dipakai & hapus semua token aktif (paksa login ulang)
        $record->update(['is_used' => true]);
        $user->tokens()->delete();

        return response()->json(['message' => 'Password berhasil diperbarui.']);
    }
}