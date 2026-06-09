<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Rute;
use App\Models\Checkpoint;
use Illuminate\Support\Facades\DB;

class RuteSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | RUTE A (contoh sebelumnya bisa kamu pertahankan)
        |--------------------------------------------------------------------------
        */

        $ruteA = Rute::create([
            'nama_rute' => 'Rute A'
        ]);

        $ruteA_cp = Checkpoint::whereIn('nama', [
            'Masjid Daarul Hikmah',
            'Masjid Kampus Undip',
            'Bunderan Undip',
            'TK Pertiwi 3'
        ])->get();

        $urutan = 1;
        foreach ($ruteA_cp as $cp) {
            DB::table('rute_checkpoint')->insert([
                'id_rute' => $ruteA->id,
                'id_checkpoint' => $cp->id,
                'urutan' => $urutan++,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | RUTE B (opsional)
        |--------------------------------------------------------------------------
        */

        $ruteB = Rute::create([
            'nama_rute' => 'Rute B'
        ]);

        $ruteB_cp = Checkpoint::whereIn('nama', [
            'Indomaret Tegalsari',
            'Kali Stom',
            'Masjid Kampus Undip'
        ])->get();

        $urutan = 1;
        foreach ($ruteB_cp as $cp) {
            DB::table('rute_checkpoint')->insert([
                'id_rute' => $ruteB->id,
                'id_checkpoint' => $cp->id,
                'urutan' => $urutan++,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | 🔥 RUTE C (yang kamu minta)
        | Rumah → Indomaret → Kali Stom → Masjid Al Ijtihad
        |--------------------------------------------------------------------------
        */

        $ruteC = Rute::create([
            'nama_rute' => 'Rute C'
        ]);

        $ruteC_cp = Checkpoint::whereIn('nama', [
            'Rumah',
            'Indomaret Tegalsari',
            'Kali Stom',
            'Masjid Al Ijtihad'
        ])->get();

        $urutan = 1;
        foreach ($ruteC_cp as $cp) {
            DB::table('rute_checkpoint')->insert([
                'id_rute' => $ruteC->id,
                'id_checkpoint' => $cp->id,
                'urutan' => $urutan++,
            ]);
        }
    }
}