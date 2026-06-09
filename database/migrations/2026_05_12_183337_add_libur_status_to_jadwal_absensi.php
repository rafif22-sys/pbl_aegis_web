<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // PostgreSQL: ubah constraint CHECK, bukan MODIFY COLUMN
        DB::statement("
            ALTER TABLE jadwal_absensi 
            DROP CONSTRAINT IF EXISTS jadwal_absensi_status_check
        ");

        DB::statement("
            ALTER TABLE jadwal_absensi 
            ADD CONSTRAINT jadwal_absensi_status_check 
            CHECK (status IN ('menunggu','hadir','terlambat','alpha','libur'))
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE jadwal_absensi 
            DROP CONSTRAINT IF EXISTS jadwal_absensi_status_check
        ");

        DB::statement("
            ALTER TABLE jadwal_absensi 
            ADD CONSTRAINT jadwal_absensi_status_check 
            CHECK (status IN ('menunggu','hadir','terlambat','alpha'))
        ");
    }
};