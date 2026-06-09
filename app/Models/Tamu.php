<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tamu extends Model
{
    use HasFactory;

    protected $table = 'tamu';

    protected $fillable = [
        'id_user',
        'nama',
        'alamat',
        'keperluan',
        'foto_tamu',
        'waktu_masuk',
        'waktu_keluar',
        'status',
    ];

    protected $casts = [
        'waktu_masuk' => 'datetime',
        'waktu_keluar' => 'datetime',
    ];

    
    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }
}