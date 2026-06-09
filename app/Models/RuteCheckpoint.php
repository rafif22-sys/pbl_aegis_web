<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RuteCheckpoint extends Model
{
    use HasFactory;

    protected $table = 'rute_checkpoint';

    protected $fillable = [
        'id_rute',
        'id_checkpoint',
        'urutan',
    ];

   
    public function rute()
    {
        return $this->belongsTo(Rute::class, 'id_rute');
    }

    public function checkpoint()
    {
        return $this->belongsTo(Checkpoint::class, 'id_checkpoint');
    }

    public function laporan_checkpoint()
    {
        return $this->hasMany(LaporanCheckpoint::class, 'id_rute_checkpoint');
    }
}