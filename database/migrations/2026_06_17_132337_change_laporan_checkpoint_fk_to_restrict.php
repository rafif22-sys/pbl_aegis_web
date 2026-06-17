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
        Schema::table('laporan_checkpoint', function (Blueprint $table) {
            // Drop constraint lama
            $table->dropForeign(['id_rute_checkpoint']);

            // Buat ulang dengan restrict — laporan tidak ikut terhapus
            $table->foreign('id_rute_checkpoint')
                ->references('id')
                ->on('rute_checkpoint')
                ->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::table('laporan_checkpoint', function (Blueprint $table) {
            $table->dropForeign(['id_rute_checkpoint']);
            $table->foreign('id_rute_checkpoint')
                ->references('id')
                ->on('rute_checkpoint')
                ->onDelete('cascade');
        });
    }
};
