<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

// import relasi
use App\Models\JadwalAbsensi;


class LaporanCheckpoint extends Model
{
    use HasFactory;

    protected $table = 'laporan_checkpoint';

    protected $fillable = [
        'id_jadwal_absensi',
        'id_rute_checkpoint',
        'kondisi',
        'foto_bukti',
        'catatan',
        'status',
        'waktu_laporan', 
    ];

    protected $casts = [
        'catatan'       => 'string',
        'waktu_laporan' => 'datetime',
    ];


    public function jadwal_absensi()
    {
        return $this->belongsTo(JadwalAbsensi::class, 'id_jadwal_absensi');
    }

    /**
     * 🔹 Laporan terkait 1 checkpoint
     */
    public function rute_checkpoint()
    {
        return $this->belongsTo(RuteCheckpoint::class, 'id_rute_checkpoint');
    }
}