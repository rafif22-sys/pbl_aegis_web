<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PosJaga extends Model
{
    use HasFactory;

    protected $table = 'pos_jaga';

    protected $fillable = [
        'nama',
        'alamat',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    // 🔹 1 PosJaga punya banyak jadwal absensi
    public function jadwalAbsensi()
    {
        return $this->hasMany(Jadwal::class, 'id_pos_jaga');
    }
}