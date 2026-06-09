<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sos;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SosController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $jenis  = $request->input('jenis');

        $query = Sos::with(['user', 'konfirmator'])
            ->orderBy('waktu_kirim', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('jenis_keadaan', 'ilike', "%{$search}%")
                  ->orWhere('deskripsi', 'ilike', "%{$search}%")
                  ->orWhereHas('user', fn($u) => $u->where('nama', 'ilike', "%{$search}%"));
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($jenis) {
            $query->whereRaw('LOWER(jenis_keadaan) = ?', [strtolower($jenis)]);
        }

        $sos = $query->paginate(15)->withQueryString();

        // Tambahkan foto_url ke tiap user
        $supabaseUrl = config('services.supabase.url');
        $bucket      = config('services.supabase.bucket');

        $sos->getCollection()->transform(function ($item) use ($supabaseUrl, $bucket) {
            if ($item->user) {
                $item->user->foto_url = $item->user->foto_profil
                    ? "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$item->user->foto_profil}"
                    : null;
            }
            return $item;
        });

        // Summary: hitung per jenis & status
        $summary = [
            'total'        => Sos::count(),
            'dikonfirmasi' => Sos::whereNotNull('dikonfirmasi_oleh')->count(),
            'kebakaran'    => Sos::whereRaw('LOWER(jenis_keadaan) = ?', ['kebakaran'])->count(),
            'pencurian'    => Sos::whereRaw('LOWER(jenis_keadaan) = ?', ['pencurian'])->count(),
            'bencana_alam' => Sos::whereRaw('LOWER(jenis_keadaan) = ?', ['bencana alam'])->count(),
            'hewan_liar'   => Sos::whereRaw('LOWER(jenis_keadaan) = ?', ['hewan liar'])->count(),
            'lainnya'      => Sos::whereRaw(
                'LOWER(jenis_keadaan) NOT IN (?, ?, ?, ?)',
                ['kebakaran', 'pencurian', 'bencana alam', 'hewan liar']
            )->count(),
        ];

        return Inertia::render('Admin/RiwayatSos', [
            'sos'     => $sos,
            'filters' => ['search' => $search, 'status' => $status, 'jenis' => $jenis],
            'summary' => $summary,
        ]);
    }

    /**
     * Hapus satu data SOS.
     */
    public function destroy(Sos $sos)
    {
        $sos->delete();

        return redirect()->back()->with('success', 'Laporan SOS berhasil dihapus.');
    }

    /**
     * Hapus data SOS berdasarkan rentang tanggal (waktu_kirim).
     */
    public function destroyRange(Request $request)
    {
        $request->validate([
            'from' => ['required', 'date'],
            'to'   => ['required', 'date', 'after_or_equal:from'],
        ]);

        $count = Sos::whereBetween('waktu_kirim', [
            $request->date('from')->startOfDay(),
            $request->date('to')->endOfDay(),
        ])->delete();

        return redirect()->back()->with('success', "Berhasil menghapus {$count} laporan SOS.");
    }
}