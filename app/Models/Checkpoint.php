<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

// import model relasi

use App\Models\Rute;

class Checkpoint extends Model
{
    use HasFactory;

    protected $table = 'checkpoint';
    
    protected $fillable = [
        'nama',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function rute()
    {
        return $this->belongsToMany(
            Rute::class,
            'rute_checkpoint',   // nama tabel pivot
            'id_checkpoint',     // foreign key di pivot ke checkpoint
            'id_rute'            // foreign key di pivot ke rute
        )->withPivot('urutan'); // ambil field tambahan
    }
}