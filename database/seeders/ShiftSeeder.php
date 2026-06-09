<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Shift;

class ShiftSeeder extends Seeder
{
    public function run(): void
    {
        $shifts = [
            [
                'nama_shift' => 'Shift 1',
                'jam_mulai' => '06:00',
                'jam_selesai' => '14:00',
            ],
            [
                'nama_shift' => 'Shift 2',
                'jam_mulai' => '14:00',
                'jam_selesai' => '22:00',
            ],
            [
                'nama_shift' => 'Shift 3',
                'jam_mulai' => '22:00',
                'jam_selesai' => '06:00',
            ],
        ];

        foreach ($shifts as $shift) {
            Shift::create($shift);
        }
    }
}