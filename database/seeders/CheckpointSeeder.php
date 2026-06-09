<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Checkpoint;

class CheckpointSeeder extends Seeder
{
    public function run(): void
    {
        Checkpoint::insert([
            [
                'nama' => 'Masjid Daarul Hikmah',
                'latitude' => -7.052550930830115, 
                'longitude' => 110.43551767421363 ,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Masjid Kampus Undip',
                'latitude' => -7.055119291117716, 
                'longitude' =>  110.43697610635375,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Bunderan Undip',
                'latitude' => -7.056022748291888, 
                'longitude' => 110.43917092480885,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'TK Pertiwi 3',
                'latitude' => -7.056219514860055, 
                'longitude' => 110.43422514850012,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Rumah',
                'latitude' => -7.011035209447329, 
                'longitude' => 110.42826097816669,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'nama' => 'Indomaret Tegalsari',
                'latitude' => -7.010641544823571, 
                'longitude' => 110.42698313948932,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'nama' => 'Kali Stom',
                'latitude' => -7.012101734187521, 
                'longitude' => 110.42683261771396,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'nama' => 'Masjid Al Ijtihad',
                'latitude' => -7.0111928520060625, 
                'longitude' => 110.42755762953482,
                'created_at' => now(),
                'updated_at' => now(),
            ],


        ]);
    }
}