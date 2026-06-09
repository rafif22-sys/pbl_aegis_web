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
        Schema::create('tamu', function (Blueprint $table) {
            $table->id();

            // relasi ke users (1 user bisa input banyak tamu)
            $table->foreignId('id_user')
                ->constrained('users')
                ->onDelete('cascade');

            $table->string('nama');
            $table->text('alamat');
            $table->string('keperluan');

            $table->string('foto_tamu');

            $table->dateTime('waktu_masuk');
            $table->dateTime('waktu_keluar')->nullable();

            $table->enum('status', ['masuk', 'keluar'])->default('masuk');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tamu');
    }
};
