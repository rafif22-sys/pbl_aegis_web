<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Checkpoint;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CheckpointController extends Controller
{
    // ── INDEX ────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = Checkpoint::query()
            ->select('*')
            ->selectRaw('(SELECT COUNT(*) + 1 FROM checkpoint c2 WHERE c2.id < checkpoint.id) as urutan');

        if ($request->filled('search')) {
            $query->where('nama', 'like', '%' . $request->search . '%');
        }

        $checkpoints = $query
            ->orderBy('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Checkpoint', [
            'checkpoints'    => $checkpoints,
            'allCheckpoints' => Checkpoint::orderBy('id')->get(),
            'filters'        => $request->only(['search']),
        ]);
    }

    // ── STORE ────────────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama'      => 'required|string|max:255',
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ], [
            'nama.required'      => 'Nama checkpoint wajib diisi.',
            'latitude.required'  => 'Latitude wajib diisi.',
            'latitude.numeric'   => 'Latitude harus berupa angka.',
            'latitude.between'   => 'Latitude harus antara -90 dan 90.',
            'longitude.required' => 'Longitude wajib diisi.',
            'longitude.numeric'  => 'Longitude harus berupa angka.',
            'longitude.between'  => 'Longitude harus antara -180 dan 180.',
        ]);

        Checkpoint::create($validated);

        return redirect()
            ->route('admin.checkpoint.index')
            ->with('success', 'Checkpoint berhasil ditambahkan.');
    }

    // ── UPDATE ───────────────────────────────────────────
    public function update(Request $request, Checkpoint $checkpoint)
    {
        $validated = $request->validate([
            'nama'      => 'required|string|max:255',
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ], [
            'nama.required'      => 'Nama checkpoint wajib diisi.',
            'latitude.required'  => 'Latitude wajib diisi.',
            'latitude.numeric'   => 'Latitude harus berupa angka.',
            'latitude.between'   => 'Latitude harus antara -90 dan 90.',
            'longitude.required' => 'Longitude wajib diisi.',
            'longitude.numeric'  => 'Longitude harus berupa angka.',
            'longitude.between'  => 'Longitude harus antara -180 dan 180.',
        ]);

        $checkpoint->update($validated);

        return redirect()
            ->route('admin.checkpoint.index')
            ->with('success', 'Checkpoint berhasil diperbarui.');
    }

    // ── DESTROY ──────────────────────────────────────────
    public function destroy(Checkpoint $checkpoint)
    {
        $checkpoint->delete();

        return redirect()
            ->route('admin.checkpoint.index')
            ->with('success', 'Checkpoint berhasil dihapus.');
    }
}