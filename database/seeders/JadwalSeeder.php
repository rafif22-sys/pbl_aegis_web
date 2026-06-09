<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Jadwal;
use App\Models\PosJaga;
use App\Models\Shift;
use Carbon\Carbon;

class JadwalSeeder extends Seeder
{
    public function run(): void
    {
        $posJaga = PosJaga::all();
        $shift = Shift::all();

        if ($posJaga->isEmpty() || $shift->isEmpty()) {
            return;
        }

        // buat 10 jadwal acak
        for ($i = 0; $i < 10; $i++) {
            Jadwal::create([
                'id_pos_jaga' => $posJaga->random()->id,
                'id_shift' => $shift->random()->id,
                'tanggal' => Carbon::now()->addDays(rand(0, 14)),
            ]);
        }
    }
}