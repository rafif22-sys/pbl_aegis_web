<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ubah kolom foto_bukti dari string/varchar(255) menjadi text
     * agar bisa menyimpan JSON array berisi banyak path foto patroli.
     *
     * Sebelumnya hanya menyimpan 1 path (max 255 char),
     * sekarang perlu menyimpan JSON seperti:
     * ["foto_patroli/2026-06-17/shift-1/petugas/checkpoint/foto_1.jpg",
     *  "foto_patroli/2026-06-17/shift-1/petugas/checkpoint/foto_2.jpg", ...]
     */
    public function up(): void
    {
        Schema::table('laporan_checkpoint', function (Blueprint $table) {
            $table->text('foto_bukti')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('laporan_checkpoint', function (Blueprint $table) {
            // Kembalikan ke string jika rollback (data mungkin terpotong)
            $table->string('foto_bukti')->nullable()->change();
        });
    }
};
