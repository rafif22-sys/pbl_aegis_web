<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('laporan_checkpoint', function (Blueprint $table) {
            $table->id();

            // relasi ke jadwal_absensi
            $table->foreignId('id_jadwal_absensi')
                ->constrained('jadwal_absensi')
                ->onDelete('cascade');

            // relasi ke checkpoint
            $table->foreignId('id_rute_checkpoint')
                ->constrained('rute_checkpoint')
                ->onDelete('cascade');

            // kondisi di lapangan
            $table->enum('kondisi', [
                'aman',
                'kerusakan fasilitas',
                'aktivitas mencurigakan',
                'kebersihan'
            ]);

            $table->string('foto_bukti');
            $table->text('catatan')->nullable();

            $table->enum('status', [
                'belum',
                'selesai'
            ])->default('belum');

            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('laporan_checkpoint');
    }
};
