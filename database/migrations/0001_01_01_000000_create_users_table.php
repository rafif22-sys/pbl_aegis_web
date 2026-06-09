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
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // self relation (supervisor)
            $table->foreignId('id_supervisor')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('nama');
            $table->enum('jenis_kelamin', ['laki-laki', 'perempuan'])->nullable();

            $table->string('email')->unique();
            $table->string('password');

            $table->enum('role', ['admin', 'supervisor', 'petugas', 'warga']);

            $table->date('tanggal_lahir');
            $table->text('alamat');
            $table->string('no_hp', 20);

            $table->date('tanggal_bergabung')->nullable();
            $table->string('wilayah_pengawasan')->nullable();

            $table->string('foto_profil');


            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
