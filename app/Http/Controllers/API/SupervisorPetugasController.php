<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SupervisorPetugasController extends Controller
{
    /**
     * Mengambil daftar petugas yang berada di bawah pengawasan supervisor yang sedang login.
     */
    public function index(Request $request)
    {
        try {
            $supervisorId = $request->user()->id;
            
            $petugas = User::where('role', 'petugas')
                ->where('id_supervisor', $supervisorId)
                ->get();
                
            $petugas = $petugas->map(function ($p) {
                // Hitung Total Kehadiran
                $p->total_kehadiran = DB::table('jadwal_absensi')
                    ->where('id_user', $p->id)
                    ->whereIn('status', ['hadir', 'terlambat'])
                    ->count();

                // Hitung Patroli Selesai (Join tabel laporan_checkpoint dan jadwal_absensi)
                $p->patroli_selesai = DB::table('laporan_checkpoint')
                    ->join('jadwal_absensi', 'laporan_checkpoint.id_jadwal_absensi', '=', 'jadwal_absensi.id')
                    ->where('jadwal_absensi.id_user', $p->id)
                    ->where('laporan_checkpoint.status', 'selesai')
                    ->count();

                return $p;
            });
            
            return response()->json([
                'success' => true,
                'message' => 'Berhasil mengambil daftar petugas',
                'data' => $petugas
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Crash Backend: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }
}
