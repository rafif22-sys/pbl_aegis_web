<?php

use App\Http\Controllers\API\AbsensiController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ForgotPasswordController;
use App\Http\Controllers\API\JadwalController;
use App\Http\Controllers\API\SosController;
use App\Http\Controllers\API\TamuController;
use App\Http\Controllers\API\PesanController;
use App\Http\Controllers\API\PatroliController;
use Illuminate\Support\Facades\Route;

// ── Auth API (Flutter) ──────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [ForgotPasswordController::class, 'sendOtp']);
    Route::post('/verify-otp',      [ForgotPasswordController::class, 'verifyOtp']);
    Route::post('/reset-password',  [ForgotPasswordController::class, 'resetPassword']);
});

// ── Protected API Routes ────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
    });

    // ── Petugas Routes ──────────────────────────────────
    Route::middleware('role:petugas')->prefix('petugas')->name('petugas.')->group(function () {
        Route::patch('/sos/{id}', [SosController::class, 'update'])->name('sos.update');

        Route::prefix('jadwal')->name('jadwal.')->group(function () {
            Route::get('/mingguan', [JadwalController::class, 'mingguan'])->name('mingguan');
            Route::get('/absensi', [JadwalController::class, 'riwayatAbsensi'])->name('absensi.index');
        });

        Route::prefix('absensi')->group(function () {
            Route::get('hari-ini', [AbsensiController::class, 'hariIni']);
            Route::post('masuk',   [AbsensiController::class, 'absenMasuk']);
            Route::post('pulang',  [AbsensiController::class, 'absenPulang']);
        });

        Route::prefix('patroli')->name('patroli.')->group(function () {
            Route::get( '/{idJadwalAbsensi}',        [PatroliController::class, 'getSesi'])      ->name('sesi');
            Route::post('/{idJadwalAbsensi}/lokasi', [PatroliController::class, 'updateLokasi']) ->name('lokasi');
            Route::post('/{idJadwalAbsensi}/laporan/{idRuteCheckpoint}',         [PatroliController::class, 'buatLaporan'])  ->name('laporan');
            // Route::get('/absensi/{id}', [JadwalController::class, 'showAbsensi'])->name('absensi.show');
        });
    });

    // ── Buku Tamu Routes ────────────────────────────────
    // GET — semua role bisa lihat
    Route::middleware('role:petugas,supervisor,warga')->group(function () {
        Route::get('/tamu', [TamuController::class, 'index'])->name('tamu.index');
    });

    // 2. Hak Akses TULIS (Hanya boleh dilakukan Petugas lapangan)
    Route::middleware('role:petugas')->group(function () {
        Route::post('/tamu', [TamuController::class, 'store'])->name('tamu.store');
        Route::patch('/tamu/{id}', [TamuController::class, 'update'])->name('tamu.update');
        Route::put('/tamu/{id}', [TamuController::class, 'update'])->name('tamu.put');
    });

    // ── Supervisor Routes ───────────────────────────────
    Route::middleware('role:supervisor')->prefix('supervisor')->name('supervisor.')->group(function () {
        Route::patch('/sos/{id}', [SosController::class, 'update'])->name('sos.update');
        Route::post('/pesan', [PesanController::class, 'store']);
    });

    // ── Warga Routes ────────────────────────────────────
    Route::middleware('role:warga')->prefix('warga')->name('warga.')->group(function () {
        // Route::post('/laporan', [WargaLaporanController::class, 'store']);
    });

    // ── Shared (semua role mobile bisa akses) ───────────
    Route::middleware('role:petugas,supervisor,warga')->group(function () {
        Route::post('/sos', [SosController::class, 'store'])->name('sos.store');
        Route::get('/sos/{id}', [SosController::class, 'show'])->name('sos.show');
        Route::get('/sos', [SosController::class, 'index'])->name('sos.index');
    });

    Route::middleware('role:petugas,supervisor')->group(function () {
        Route::get('/pesan/unread-count', [PesanController::class, 'unreadCount'])->name('pesan.unread-count');
        Route::get('/pesan', [PesanController::class, 'index'])->name('pesan.index');
        Route::post('/pesan/mark-read', [PesanController::class, 'markRead'])->name('pesan.mark-read');
        Route::post('/pesan/{id}/favorit', [PesanController::class, 'toggleFavorit'])->name('pesan.favorit');
    });

    Route::post('/user/fcm-token', [AuthController::class, 'saveFcmToken']);
});
