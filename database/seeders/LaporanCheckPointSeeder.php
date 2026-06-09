<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LaporanCheckpoint;
use App\Models\JadwalAbsensi;
use App\Models\RuteCheckpoint;

class LaporanCheckpointSeeder extends Seeder
{
    public function run(): void
    {
        $jadwalAbsensi = JadwalAbsensi::all();
        $checkpoints = RuteCheckpoint::all();

        if ($jadwalAbsensi->isEmpty() || $checkpoints->isEmpty()) {
            return;
        }

        $kondisiList = [
            'aman',
            'kerusakan fasilitas',
            'aktivitas mencurigakan',
            'kebersihan'
        ];

        $catatanList = [
            'Kondisi normal, tidak ada kejadian.',
            'Ditemukan kerusakan ringan pada fasilitas.',
            'Ada aktivitas mencurigakan di sekitar area.',
            'Area perlu dibersihkan segera.',
            null
        ];

        for ($i = 0; $i < 20; $i++) {

            $jadwal = $jadwalAbsensi->random();
            $checkpoint = $checkpoints->random();

            // ambil data relasi
            $user = $jadwal->user ?? null;
            $shift = $jadwal->jadwal->shift->nama ?? 'shift1';
            $tanggal = $jadwal->jadwal->tanggal ?? now()->format('Y-m-d');

            $petugas = $user
                ? strtolower(str_replace(' ', '_', $user->nama))
                : 'unknown';

            $titik = strtolower(str_replace(' ', '', $checkpoint->nama ?? 'titik'));

            LaporanCheckpoint::create([
                'id_jadwal_absensi' => $jadwal->id,
                'id_rute_checkpoint' => $checkpoint->id,

                'kondisi' => $kondisiList[array_rand($kondisiList)],

                // FOTO BUKTI (FORMAT BARU)
                'foto_bukti' =>
                    "/foto_bukti/{$tanggal}/{$shift}/{$petugas}/{$titik}/foto1.jpg",

                'catatan' => $catatanList[array_rand($catatanList)],

                'status' => rand(0, 1) ? 'belum' : 'selesai',
            ]);
        }
    }
}