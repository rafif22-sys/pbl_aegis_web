<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            CheckpointSeeder::class,
            RuteSeeder::class,
            PosJagaSeeder::class,
            UserSeeder::class,
            TamuSeeder::class,
            InformasiSeeder::class,
            SosSeeder::class,
            ShiftSeeder::class,
            JadwalAbsensiSeeder::class,
            JadwalSeeder::class,
            LaporanCheckpointSeeder::class,
        ]);
    }
}