<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\LaporanCheckpoint;

class JadwalAbsensi extends Model
{
    use HasFactory;

    protected $table = 'jadwal_absensi';

    // ← Tambah konstanta status
    const STATUS_MENUNGGU  = 'menunggu';
    const STATUS_HADIR     = 'hadir';
    const STATUS_TERLAMBAT = 'terlambat';
    const STATUS_ALPHA     = 'alpha';
    const STATUS_LIBUR     = 'libur';  // ← baru

    protected $fillable = [
        'id_user',
        'id_jadwal',
        'id_rute',
        'jam_masuk',
        'jam_pulang',
        'status',
        'pulang_cepat',
        'foto_masuk',
        'foto_pulang',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'jam_masuk'  => 'datetime', 
        'jam_pulang' => 'datetime',
        'latitude'   => 'float',
        'longitude'  => 'float',
        'pulang_cepat',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function rute()
    {
        return $this->belongsTo(Rute::class, 'id_rute');
    }

    public function jadwal()
    {
        return $this->belongsTo(Jadwal::class, 'id_jadwal');
    }

    public function laporanCheckpoint()
    {
        return $this->hasMany(LaporanCheckpoint::class, 'id_jadwal_absensi');
    }
}