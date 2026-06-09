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
        Schema::create('rute_checkpoint', function (Blueprint $table) {
            $table->id();

            $table->foreignId('id_rute')
                ->constrained('rute')
                ->onDelete('cascade');

            $table->foreignId('id_checkpoint')
                ->constrained('checkpoint')
                ->onDelete('cascade');

            // urutan checkpoint dalam rute
            $table->integer('urutan');

            $table->timestamps();

            // mencegah duplikasi checkpoint dalam 1 rute
            $table->unique(['id_rute', 'id_checkpoint']);

            // opsional: memastikan urutan tidak duplikat dalam 1 rute
            $table->unique(['id_rute', 'urutan']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rute_checkpoint');
    }
};
