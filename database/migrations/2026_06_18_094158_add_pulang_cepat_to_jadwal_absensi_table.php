<?php
// database/migrations/xxxx_add_pulang_cepat_to_jadwal_absensi_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jadwal_absensi', function (Blueprint $table) {
            $table->boolean('pulang_cepat')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('jadwal_absensi', function (Blueprint $table) {
            $table->dropColumn('pulang_cepat');
        });
    }
};