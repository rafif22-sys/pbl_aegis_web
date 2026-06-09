<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    
    protected $table = 'users';

    
    protected $fillable = [
        'id_supervisor',
        'nama',
        'jenis_kelamin',
        'email',
        'password',
        'role',
        'tanggal_lahir',
        'alamat',
        'no_hp',
        'tanggal_bergabung',
        'wilayah_pengawasan',
        'foto_profil',
        'fcm_token',
    ];

    /**
     * Hidden field
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Casting
     */
    protected function casts(): array
    {
        return [
            'tanggal_lahir' => 'date',
            'tanggal_bergabung' => 'date',
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    

    
    public function tamu()
    {
        return $this->hasMany(Tamu::class, 'id_user');
    }

    
    public function sos()
    {
        return $this->hasMany(Sos::class, 'id_user');
    }

    
    public function informasi()
    {
        return $this->hasMany(Informasi::class, 'id_user');
    }


    public function jadwalAbsensi()
    {
        return $this->hasMany(JadwalAbsensi::class, 'id_user');
    }

    /*
    |--------------------------------------------------------------------------
    | SELF RELATION (Supervisor)
    |--------------------------------------------------------------------------
    */

  
    public function supervisor()
    {
        return $this->belongsTo(User::class, 'id_supervisor');
    }

    
    public function petugas()
    {
        return $this->hasMany(User::class, 'id_supervisor');
    }
}