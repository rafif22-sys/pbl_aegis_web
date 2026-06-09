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
        Schema::create('sos', function (Blueprint $table) {
           $table->id();

            // 1 user bisa kirim banyak SOS
            $table->foreignId('id_user')
                ->constrained('users')
                ->onDelete('cascade');

            // lokasi kejadian
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);

            // jenis keadaan darurat
            $table->enum('jenis_keadaan', [
                'kebakaran',
                'pencurian',
                'hewan liar',
                'bencana alam',
                'lainnya'
            ]);

            $table->text('deskripsi')->nullable();

            $table->dateTime('waktu_kirim');

            // status penanganan
            $table->enum('status', [
                'menunggu bantuan',
                'selesai'
            ])->default('menunggu bantuan');

            // apakah warga sudah membantu
            $table->boolean('bantuan_warga')->default(false);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sos');
    }
};
