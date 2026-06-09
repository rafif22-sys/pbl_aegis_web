<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PosJaga;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PosJagaController extends Controller
{
    // ── INDEX ────────────────────────────────────────────
    public function index(Request $request)
    {
        $table = (new PosJaga())->getTable(); // → "pos_jaga"

        $query = PosJaga::query()
            ->select('*')
            ->selectRaw("(SELECT COUNT(*) + 1 FROM {$table} p2 WHERE p2.id < {$table}.id) as urutan");

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nama',   'like', '%' . $request->search . '%')
                  ->orWhere('alamat', 'like', '%' . $request->search . '%');
            });
        }

        $posJaga = $query
            ->orderBy('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/PosJaga', [
            'posJaga' => $posJaga,
            'filters' => $request->only(['search']),
        ]);
    }

    // ── STORE ────────────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama'      => 'required|string|max:255',
            'alamat'    => 'required|string|max:500',
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ], [
            'nama.required'      => 'Nama pos jaga wajib diisi.',
            'alamat.required'    => 'Alamat wajib diisi.',
            'latitude.required'  => 'Latitude wajib diisi.',
            'latitude.numeric'   => 'Latitude harus berupa angka.',
            'latitude.between'   => 'Latitude harus antara -90 dan 90.',
            'longitude.required' => 'Longitude wajib diisi.',
            'longitude.numeric'  => 'Longitude harus berupa angka.',
            'longitude.between'  => 'Longitude harus antara -180 dan 180.',
        ]);

        PosJaga::create($validated);

        return redirect()
            ->route('admin.pos-jaga.index')
            ->with('success', 'Pos jaga berhasil ditambahkan.');
    }

    // ── UPDATE ───────────────────────────────────────────
    public function update(Request $request, PosJaga $posJaga)
    {
        $validated = $request->validate([
            'nama'      => 'required|string|max:255',
            'alamat'    => 'required|string|max:500',
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ], [
            'nama.required'      => 'Nama pos jaga wajib diisi.',
            'alamat.required'    => 'Alamat wajib diisi.',
            'latitude.required'  => 'Latitude wajib diisi.',
            'latitude.numeric'   => 'Latitude harus berupa angka.',
            'latitude.between'   => 'Latitude harus antara -90 dan 90.',
            'longitude.required' => 'Longitude wajib diisi.',
            'longitude.numeric'  => 'Longitude harus berupa angka.',
            'longitude.between'  => 'Longitude harus antara -180 dan 180.',
        ]);

        $posJaga->update($validated);

        return redirect()
            ->route('admin.pos-jaga.index')
            ->with('success', 'Pos jaga berhasil diperbarui.');
    }

    // ── DESTROY ──────────────────────────────────────────
    public function destroy(PosJaga $posJaga)
    {
        $posJaga->delete();

        return redirect()
            ->route('admin.pos-jaga.index')
            ->with('success', 'Pos jaga berhasil dihapus.');
    }
}