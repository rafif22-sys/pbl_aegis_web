<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tamu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BukuTamuController extends Controller
{
    public function index(Request $request)
    {
        $query = Tamu::with('user:id,nama')
            ->orderBy('waktu_masuk', 'desc');

        if ($request->filled('search')) {
            $query->where('nama', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('status') && $request->status !== 'semua') {
            $query->where('status', $request->status);
        }

        if ($request->filled('tanggal')) {
            $query->whereDate('waktu_masuk', $request->tanggal);
        }

        $tamus = $query->paginate(10)->withQueryString();

        $stats = [
            'total'    => Tamu::count(),
            'masuk'    => Tamu::where('status', 'masuk')->count(),
            'keluar'   => Tamu::where('status', 'keluar')->count(),
            'hari_ini' => Tamu::whereDate('waktu_masuk', today())->count(),
        ];

        return Inertia::render('Admin/BukuTamu', [
            'tamus'   => $tamus,
            'stats'   => $stats,
            'filters' => $request->only(['search', 'status', 'tanggal']),
        ]);
    }

    private function deleteFromSupabase(string $path): void
    {
        $supabaseUrl = config('services.supabase.url');
        $supabaseKey = config('services.supabase.key');
        $bucket      = config('services.supabase.bucket', 'aegis');

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$supabaseKey}",
        ])->delete("{$supabaseUrl}/storage/v1/object/{$bucket}/{$path}");

        if (!$response->successful()) {
            Log::warning('Supabase delete gagal di BukuTamu', [
                'path'   => $path,
                'status' => $response->status(),
            ]);
        }
    }

    public function destroy(Tamu $tamu)
    {
        if ($tamu->foto_tamu) {
            $this->deleteFromSupabase($tamu->foto_tamu);
        }

        $tamu->delete();

        return back()->with('success', 'Data tamu berhasil dihapus.');
    }

    public function destroyRange(Request $request)
    {
        $request->validate([
            'dari'   => 'required|date',
            'sampai' => 'required|date|after_or_equal:dari',
        ], [
            'dari.required'            => 'Tanggal mulai wajib diisi.',
            'dari.date'                => 'Tanggal mulai tidak valid.',
            'sampai.required'          => 'Tanggal akhir wajib diisi.',
            'sampai.date'              => 'Tanggal akhir tidak valid.',
            'sampai.after_or_equal'    => 'Tanggal akhir harus sama atau setelah tanggal mulai.',
        ]);

        $tamus = Tamu::whereBetween('waktu_masuk', [
            $request->dari . ' 00:00:00',
            $request->sampai . ' 23:59:59',
        ])->get();

        if ($tamus->isEmpty()) {
            return back()->withErrors(['range' => 'Tidak ada data tamu pada rentang tanggal tersebut.']);
        }

        foreach ($tamus as $tamu) {
            if ($tamu->foto_tamu) {
                $this->deleteFromSupabase($tamu->foto_tamu);
            }
        }

        Tamu::whereBetween('waktu_masuk', [
            $request->dari . ' 00:00:00',
            $request->sampai . ' 23:59:59',
        ])->delete();

        return back()->with('success', "{$tamus->count()} data tamu berhasil dihapus.");
    }
}