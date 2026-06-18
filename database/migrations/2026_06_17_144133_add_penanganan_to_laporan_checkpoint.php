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
            $table->boolean('selesai')->default(false)->after('status');
            $table->text('penanganan')->nullable()->after('selesai');
        });
    }

    public function down(): void
    {
        Schema::table('laporan_checkpoint', function (Blueprint $table) {
            $table->dropColumn(['selesai', 'penanganan']);
        });
    }
};
