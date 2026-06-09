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
        Schema::create('jadwal_absensi', function (Blueprint $table) {
            $table->id();

            // relasi ke user (1 user banyak jadwal)
            $table->foreignId('id_user')
                ->constrained('users')
                ->onDelete('cascade');

            $table->foreignId('id_jadwal')
                ->constrained('jadwal')
                ->onDelete('cascade');

            $table->foreignId('id_rute')
                ->constrained('rute')
                ->onDelete('cascade');


            $table->time('jam_masuk')->nullable();
            $table->time('jam_pulang')->nullable();

            $table->enum('status', [
                'menunggu',
                'hadir',
                'terlambat',
                'alpha'
            ])->default('menunggu');

            $table->string('foto_masuk')->nullable();
            $table->string('foto_pulang')->nullable();

            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jadwal_absensi');
    }
};
