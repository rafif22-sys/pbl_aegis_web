<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Sos;
use App\Models\User;
use Carbon\Carbon;

class SosSeeder extends Seeder
{
    public function run(): void
    {
        $warga = User::where('role', 'warga')->get();

        if ($warga->isEmpty()) {
            return;
        }

        $jenis = [
            'kebakaran',
            'pencurian',
            'hewan liar',
            'bencana alam',
            'lainnya'
        ];

        for ($i = 0; $i < 10; $i++) {

            $jenisKeadaan = $jenis[array_rand($jenis)];

            Sos::create([
                'id_user' => $warga->random()->id,

                'latitude' => -7.0 + (rand(0, 1000) / 10000),
                'longitude' => 110.4 + (rand(0, 1000) / 10000),

                'jenis_keadaan' => $jenisKeadaan,

                // hanya isi kalau "lainnya"
                'deskripsi' => $jenisKeadaan === 'lainnya'
                    ? 'Kejadian tidak terklasifikasi, membutuhkan penanganan khusus.'
                    : null,

                'waktu_kirim' => Carbon::now()->subMinutes(rand(10, 1000)),

                'status' => rand(0, 1) ? 'menunggu bantuan' : 'selesai',

                'bantuan_warga' => (bool) rand(0, 1),
            ]);
        }
    }
}