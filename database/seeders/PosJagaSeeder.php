<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PosJaga;

class PosJagaSeeder extends Seeder
{
    public function run(): void
    {
        PosJaga::insert([
            [
                'nama' => 'Pos Jaga Utama', //MST Polines
                'alamat' => 'Jalan Prof Soedarto',
                'latitude' => -7.053299588326611, 
                'longitude' => 110.43487825996934,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Pos Jaga Tengah',//rumah rafif
                'alamat' => 'Jalan Tegalsari Timur IX',
                'latitude' => -7.011030004631268, 
                'longitude' => 110.42826020383119,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Pos Jaga Selatan', // TK Pertiwi 3
                'alamat' => 'Jalan Tembalang Baru V',
                'latitude' => -7.0561620883693665, 
                'longitude' => 110.43419458679499,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}