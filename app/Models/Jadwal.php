<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Jadwal extends Model
{
    protected $table = 'jadwal';

    protected $fillable = [
        'id_pos_jaga',
        'id_shift',
        'tanggal',
    ];

    protected $casts = [
        'tanggal' => 'date', 
    ];

    
    public function posJaga()
    {
        return $this->belongsTo(PosJaga::class, 'id_pos_jaga');
    }

    
    public function shift()
    {
        return $this->belongsTo(Shift::class, 'id_shift');
    }

    public function jadwalAbsensi()
    {
        return $this->hasMany(JadwalAbsensi::class, 'id_jadwal');
    }
}