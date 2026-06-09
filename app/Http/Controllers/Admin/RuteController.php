<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Rute;
use App\Models\Checkpoint;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RuteController extends Controller
{
    // ── HELPER: Haversine ────────────────────────────────
    private function haversine(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $R    = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a    = sin($dLat / 2) ** 2 +
                cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
                sin($dLon / 2) ** 2;
        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    // ── HELPER: Validasi jarak antar checkpoint ──────────
    private function validasiJarakCheckpoint(array $checkpointIds): ?string
    {
        $checkpoints = Checkpoint::whereIn('id', $checkpointIds)->get()->keyBy('id');
        $ordered     = collect($checkpointIds)
            ->map(fn($id) => $checkpoints[$id] ?? null)
            ->filter()
            ->values();

        for ($i = 0; $i < $ordered->count() - 1; $i++) {
            $a     = $ordered[$i];
            $b     = $ordered[$i + 1];
            $jarak = $this->haversine(
                (float) $a->latitude,  (float) $a->longitude,
                (float) $b->latitude,  (float) $b->longitude,
            );
            if ($jarak > 500) {
                return "Jarak antara '{$a->nama}' dan '{$b->nama}' terlalu jauh (" . round($jarak) . " m). Maksimal 500 m.";
            }
        }

        return null;
    }

    // ── INDEX ────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = Rute::with([
            'checkpoint' => fn($q) => $q
                ->select('checkpoint.id', 'nama', 'latitude', 'longitude')
                ->orderBy('rute_checkpoint.urutan'),
        ]);

        if ($request->filled('search')) {
            $query->where('nama_rute', 'like', '%' . $request->search . '%');
        }

        $rutes = $query->orderBy('nama_rute')->get();

        $allCheckpoints = Checkpoint::select('id', 'nama', 'latitude', 'longitude')
            ->orderBy('nama')
            ->get();

        return Inertia::render('Admin/Rute', [
            'rutes'          => $rutes,
            'allCheckpoints' => $allCheckpoints,
            'filters'        => $request->only(['search']),
        ]);
    }

    // ── STORE ────────────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_rute'      => 'required|string|max:255|unique:rute,nama_rute',
            'checkpoints'    => 'required|array|min:1',
            'checkpoints.*'  => 'exists:checkpoint,id',
        ], [
            'nama_rute.required'   => 'Nama rute wajib diisi.',
            'nama_rute.unique'     => 'Nama rute sudah digunakan.',
            'checkpoints.required' => 'Pilih minimal satu checkpoint.',
            'checkpoints.min'      => 'Pilih minimal satu checkpoint.',
            'checkpoints.*.exists' => 'Checkpoint tidak valid.',
        ]);

        // Validasi jarak antar checkpoint (maks 500 m)
        $errorJarak = $this->validasiJarakCheckpoint($validated['checkpoints']);
        if ($errorJarak) {
            return back()
                ->withErrors(['checkpoints' => $errorJarak])
                ->withInput();
        }

        $rute = Rute::create(['nama_rute' => $validated['nama_rute']]);

        $pivot = [];
        foreach ($validated['checkpoints'] as $urutan => $cpId) {
            $pivot[$cpId] = ['urutan' => $urutan + 1];
        }
        $rute->checkpoint()->sync($pivot);

        return redirect()
            ->route('admin.rute.index', $request->only('search'))
            ->with('success', 'Rute berhasil ditambahkan.');
    }

    // ── UPDATE ───────────────────────────────────────────
    public function update(Request $request, Rute $rute)
    {
        $validated = $request->validate([
            'nama_rute'     => [
                'required', 'string', 'max:255',
                \Illuminate\Validation\Rule::unique('rute', 'nama_rute')->ignore($rute->id),
            ],
            'checkpoints'   => 'required|array|min:1',
            'checkpoints.*' => 'exists:checkpoint,id',
        ], [
            'nama_rute.required'   => 'Nama rute wajib diisi.',
            'nama_rute.unique'     => 'Nama rute sudah digunakan.',
            'checkpoints.required' => 'Pilih minimal satu checkpoint.',
            'checkpoints.min'      => 'Pilih minimal satu checkpoint.',
            'checkpoints.*.exists' => 'Checkpoint tidak valid.',
        ]);

        // Validasi jarak antar checkpoint (maks 500 m)
        $errorJarak = $this->validasiJarakCheckpoint($validated['checkpoints']);
        if ($errorJarak) {
            return back()
                ->withErrors(['checkpoints' => $errorJarak])
                ->withInput();
        }

        $rute->update(['nama_rute' => $validated['nama_rute']]);

        // FIX: Detach dulu semua pivot lama agar tidak bentrok unique constraint
        $rute->checkpoint()->detach();

        $pivot = [];
        foreach ($validated['checkpoints'] as $urutan => $cpId) {
            $pivot[$cpId] = ['urutan' => $urutan + 1];
        }
        $rute->checkpoint()->sync($pivot);

        return redirect()
            ->route('admin.rute.index', $request->only('search'))
            ->with('success', 'Rute berhasil diperbarui.');
    }
    // ── DESTROY ──────────────────────────────────────────
    public function destroy(Request $request, Rute $rute)
    {
        $rute->checkpoint()->detach();
        $rute->delete();

        return redirect()
            ->route('admin.rute.index', $request->only('search'))
            ->with('success', 'Rute berhasil dihapus.');
    }
}