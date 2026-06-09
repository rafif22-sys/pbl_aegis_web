<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tamu;
use App\Models\User;
use Carbon\Carbon;

class TamuSeeder extends Seeder
{
    public function run(): void
    {
        // Ambil beberapa user (petugas/admin/warga bebas input tamu)
        $users = User::all();

        if ($users->isEmpty()) {
            return;
        }

        $dataTamu = [
            [
                'nama' => 'Budi Santoso',
                'alamat' => 'Semarang',
                'keperluan' => 'Bertemu petugas',
                'foto_tamu' => 'tamu1.jpg',
            ],
            [
                'nama' => 'Siti Aminah',
                'alamat' => 'Demak',
                'keperluan' => 'Mengurus laporan',
                'foto_tamu' => 'tamu2.jpg',
            ],
            [
                'nama' => 'Andi Pratama',
                'alamat' => 'Kudus',
                'keperluan' => 'Kunjungan keluarga',
                'foto_tamu' => 'tamu3.jpg',
            ],
            [
                'nama' => 'Rina Lestari',
                'alamat' => 'Solo',
                'keperluan' => 'Interview kerja',
                'foto_tamu' => 'tamu4.jpg',
            ],
            [
                'nama' => 'Dewi Anggraini',
                'alamat' => 'Pati',
                'keperluan' => 'Pengantaran dokumen',
                'foto_tamu' => 'tamu5.jpg',
            ],
            [
                'nama' => 'Agus Salim',
                'alamat' => 'Jepara',
                'keperluan' => 'Rapat warga',
                'foto_tamu' => 'tamu6.jpg',
            ],
            [
                'nama' => 'Maya Sari',
                'alamat' => 'Magelang',
                'keperluan' => 'Kunjungan kerja',
                'foto_tamu' => 'tamu7.jpg',
            ],
            [
                'nama' => 'Fajar Nugroho',
                'alamat' => 'Salatiga',
                'keperluan' => 'Survey lokasi',
                'foto_tamu' => 'tamu8.jpg',
            ],
            [
                'nama' => 'Nur Halimah',
                'alamat' => 'Brebes',
                'keperluan' => 'Silaturahmi',
                'foto_tamu' => 'tamu9.jpg',
            ],
            [
                'nama' => 'Eko Prasetyo',
                'alamat' => 'Tegal',
                'keperluan' => 'Pengambilan barang',
                'foto_tamu' => 'tamu10.jpg',
            ],
        ];

        foreach ($dataTamu as $index => $tamu) {
            Tamu::create([
                'id_user' => $users->random()->id, // random user input tamu
                'nama' => $tamu['nama'],
                'alamat' => $tamu['alamat'],
                'keperluan' => $tamu['keperluan'],
                'foto_tamu' => $tamu['foto_tamu'],
                'waktu_masuk' => Carbon::now()->subDays(rand(1, 10)),
                'waktu_keluar' => rand(0, 1) ? Carbon::now()->subDays(rand(0, 5)) : null,
                'status' => rand(0, 1) ? 'masuk' : 'keluar',
            ]);
        }
    }
}