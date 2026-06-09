<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Informasi;
use App\Models\User;
use Carbon\Carbon;

class InformasiSeeder extends Seeder
{
    public function run(): void
    {
        // Ambil hanya admin & supervisor sebagai pengirim
        $pengirim = User::whereIn('role', ['admin', 'supervisor'])->get();

        if ($pengirim->isEmpty()) {
            return;
        }

        $data = [
            'Jadwal patroli malam dimulai pukul 22.00 WIB.',
            'Harap semua petugas melakukan absensi sebelum bertugas.',
            'Peningkatan keamanan wilayah A mulai diberlakukan hari ini.',
            'Laporan kejadian wajib diisi setelah patroli selesai.',
            'Koordinasi supervisor dan petugas dilakukan setiap pagi.',
            'Pengecekan CCTV dilakukan setiap 3 jam.',
            'Dilarang meninggalkan pos tanpa izin atasan.',
            'Update sistem akan dilakukan malam ini pukul 01.00 WIB.',
            'Harap waspada terhadap tamu tidak dikenal.',
            'Rapat evaluasi mingguan diadakan setiap hari Jumat.',
        ];

        foreach ($data as $pesan) {
            Informasi::create([
                'id_user' => $pengirim->random()->id,
                'pesan' => $pesan,
                'waktu_kirim' => Carbon::now()->subHours(rand(1, 72)),
            ]);
        }
    }
}