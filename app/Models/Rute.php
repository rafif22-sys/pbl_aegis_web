<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

// import relasi
use App\Models\Checkpoint;
use App\Models\RuteCheckpoint;

class Rute extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Nama tabel
     */
    protected $table = 'rute';

    protected $fillable = [
        'nama_rute',
    ];
   
    public function checkpoint()
    {
        return $this->belongsToMany(
            Checkpoint::class,
            'rute_checkpoint',   // tabel pivot
            'id_rute',           // FK ke rute
            'id_checkpoint'      // FK ke checkpoint
        )->withPivot('urutan')
         ->wherePivot('urutan', '>', 0)
         ->orderBy('pivot_urutan'); // otomatis urut
    }

    public function jadwal_absensi()
    {
        return $this->hasMany(JadwalAbsensi::class, 'id_rute');
    }

    public function ruteCheckpoints()
    {
        return $this->hasMany(RuteCheckpoint::class, 'id_rute')
                    ->where('urutan', '>', 0)
                    ->orderBy('urutan');
    }
}