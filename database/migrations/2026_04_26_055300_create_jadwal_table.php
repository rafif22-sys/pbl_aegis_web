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
        Schema::create('jadwal', function (Blueprint $table) {
            $table->id();

            // relasi ke pos_jaga
            $table->foreignId('id_pos_jaga')
                ->constrained('pos_jaga')
                ->onDelete('cascade');

            // relasi ke shift
            $table->foreignId('id_shift')
                ->constrained('shift')
                ->onDelete('cascade');

            $table->date('tanggal');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jadwal');
    }
};