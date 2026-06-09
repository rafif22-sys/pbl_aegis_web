<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JadwalAbsensi;
use App\Models\User;
use App\Models\Jadwal;
use App\Models\Rute;

class JadwalAbsensiSeeder extends Seeder
{
    public function run(): void
    {
        $userIds = [5, 6, 7, 8, 9, 10];

        $users = User::whereIn('id', $userIds)->get();
        $jadwal = Jadwal::all();
        $rute = Rute::all();

        if ($users->isEmpty() || $jadwal->isEmpty() || $rute->isEmpty()) {
            return;
        }

        $statusList = ['menunggu', 'hadir', 'terlambat', 'alpha'];

        for ($i = 0; $i < 15; $i++) {

            $user = $users->random();
            $jadwalItem = $jadwal->random();

            $status = $statusList[array_rand($statusList)];

            // ambil tanggal dari jadwal
            $tanggal = $jadwalItem->tanggal ?? now()->format('Y-m-d');

            // ambil shift name (shift1/shift2/shift3)
            $shiftName = strtolower(str_replace(' ', '', $jadwalItem->shift->nama ?? 'shift1'));

            // slug nama petugas
            $slug = strtolower(str_replace(' ', '_', $user->nama));

            JadwalAbsensi::create([
                'id_user' => $user->id,
                'id_jadwal' => $jadwalItem->id,
                'id_rute' => $rute->random()->id,

                'jam_masuk' => in_array($status, ['hadir', 'terlambat'])
                    ? fake()->time('H:i')
                    : null,

                'jam_pulang' => $status === 'hadir'
                    ? fake()->time('H:i')
                    : null,

                'status' => $status,

                // FOTO MASUK
                'foto_masuk' => in_array($status, ['hadir', 'terlambat'])
                    ? "/foto_absensi/{$tanggal}/{$shiftName}/foto_masuk/{$user->id}_{$slug}.jpg"
                    : null,

                // FOTO PULANG
                'foto_pulang' => $status === 'hadir'
                    ? "/foto_absensi/{$tanggal}/{$shiftName}/foto_pulang/{$user->id}_{$slug}.jpg"
                    : null,

                'latitude' => -7.0 + (rand(0, 1000) / 10000),
                'longitude' => 110.4 + (rand(0, 1000) / 10000),
            ]);
        }
    }
}