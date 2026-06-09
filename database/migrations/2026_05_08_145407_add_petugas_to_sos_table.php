<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sos', function (Blueprint $table) {
            $table->unsignedBigInteger('dikonfirmasi_oleh')
                ->nullable()
                ->after('bantuan_warga');

            $table->timestamp('waktu_konfirmasi')
                ->nullable()
                ->after('dikonfirmasi_oleh');

            $table->foreign('dikonfirmasi_oleh')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sos', function (Blueprint $table) {
            $table->dropForeign(['dikonfirmasi_oleh']);
            $table->dropColumn(['dikonfirmasi_oleh', 'waktu_konfirmasi']);
        });
    }
};