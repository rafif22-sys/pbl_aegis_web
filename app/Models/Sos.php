<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sos extends Model
{
    use HasFactory;

    protected $table = 'sos';

    protected $fillable = [
        'id_user',
        'latitude',
        'longitude',
        'jenis_keadaan',
        'deskripsi',
        'waktu_kirim',
        'status',
        'bantuan_warga',
        'dikonfirmasi_oleh',
        'waktu_konfirmasi',
        'penanganan',
    ];

    protected $casts = [
        'latitude'         => 'float',
        'longitude'        => 'float',
        'waktu_kirim'      => 'datetime',
        'waktu_konfirmasi' => 'datetime', 
        'bantuan_warga'    => 'boolean',
    ];

    // Relasi pelapor (yang kirim SOS)
    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    // Relasi petugas yang mengkonfirmasi ← tambah
    public function konfirmator()
    {
        return $this->belongsTo(User::class, 'dikonfirmasi_oleh');
    }
}