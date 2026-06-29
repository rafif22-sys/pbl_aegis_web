<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Jadwal;
use App\Models\JadwalAbsensi;
use App\Models\PosJaga;
use App\Models\Shift;
use App\Models\Rute;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Services\JadwalAutoSchedulerService;

class JadwalController extends Controller
{
    public function index(Request $request)
    {
        $weekOffset = (int) $request->get('week_offset', 0);
        $startOfWeek = Carbon::now()->startOfWeek(Carbon::MONDAY)->addWeeks($weekOffset);
        $endOfWeek   = $startOfWeek->copy()->endOfWeek(Carbon::SUNDAY);

        $filterPos   = $request->get('pos_jaga_id');
        $filterShift = $request->get('shift_id');

        $jadwals = Jadwal::with([
                'posJaga',
                'shift',
                'jadwalAbsensi.user',
                'jadwalAbsensi.rute',
            ])
            ->whereBetween('tanggal', [$startOfWeek->toDateString(), $endOfWeek->toDateString()])
            ->when($filterPos,   fn($q) => $q->where('id_pos_jaga', $filterPos))
            ->when($filterShift, fn($q) => $q->where('id_shift', $filterShift))
            ->orderBy('tanggal')
            ->get()
            ->map(fn($j) => [
                'id'      => $j->id,
                'tanggal' => $j->tanggal->format('Y-m-d'), // ← tambah ->format('Y-m-d')
                'hari'    => Carbon::parse($j->tanggal)->dayOfWeekIso - 1,
                'pos_jaga'    => $j->posJaga ? ['id' => $j->posJaga->id, 'nama' => $j->posJaga->nama] : null,
                'shift'       => $j->shift ? [
                    'id'         => $j->shift->id,
                    'nama'       => $j->shift->nama_shift,
                    'jam_masuk'  => $j->shift->jam_mulai   ? Carbon::parse($j->shift->jam_mulai)->format('H:i')   : null,
                    'jam_pulang' => $j->shift->jam_selesai ? Carbon::parse($j->shift->jam_selesai)->format('H:i') : null,
                ] : null,
                'absensi'     => $j->jadwalAbsensi->map(fn($a) => [
                    'id'     => $a->id,
                    'status' => $a->status,
                    'pulang_cepat' => (bool) $a->pulang_cepat,
                    'user'   => $a->user ? ['id' => $a->user->id, 'nama' => $a->user->nama] : null,
                    'rute'   => $a->rute ? ['id' => $a->rute->id, 'nama' => $a->rute->nama_rute] : null,
                ])->values()->toArray(),
            ]);

        $posJagas = PosJaga::orderBy('nama')->get(['id', 'nama']);
        $shifts   = Shift::orderBy('jam_mulai')->get(['id', 'nama_shift', 'jam_mulai', 'jam_selesai']);
        $rutes    = Rute::orderBy('nama_rute')->get(['id', 'nama_rute']);
        $petugas  = User::where('role', 'petugas')->orderBy('nama')->get(['id', 'nama']);

        $shiftsNormalized = $shifts->map(fn($s) => [
            'id'         => $s->id,
            'nama'       => $s->nama_shift,
            'jam_masuk'  => $s->jam_mulai   ? Carbon::parse($s->jam_mulai)->format('H:i')   : null,
            'jam_pulang' => $s->jam_selesai ? Carbon::parse($s->jam_selesai)->format('H:i') : null,
        ]);
        $rutesNormalized = $rutes->map(fn($r) => ['id' => $r->id, 'nama' => $r->nama_rute]);

        $stats = [
            'total_jadwal'  => $jadwals->count(),
            'total_petugas' => $jadwals->flatMap(fn($j) => collect($j['absensi'])->pluck('user.id'))->unique()->filter()->count(),
            'total_rute'    => $jadwals->flatMap(fn($j) => collect($j['absensi'])->pluck('rute.id'))->unique()->filter()->count(),
            'shift_terisi'  => $jadwals->pluck('shift.id')->unique()->filter()->count(),
        ];

        return Inertia::render('Admin/JadwalAbsensi', [
            'jadwals'     => $jadwals,
            'posJagas'    => $posJagas,
            'shifts'      => $shiftsNormalized,
            'rutes'       => $rutesNormalized,
            'petugas'     => $petugas,
            'stats'       => $stats,
            'weekOffset'  => $weekOffset,
            'startOfWeek' => $startOfWeek->toDateString(),
            'endOfWeek'   => $endOfWeek->toDateString(),
            'filters'     => [
                'pos_jaga_id' => $filterPos,
                'shift_id'    => $filterShift,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_pos_jaga' => 'required|exists:pos_jaga,id',
            'id_shift'    => 'required|exists:shift,id',   // ← tabel shift
            'id_user'     => 'required|exists:users,id',
            'id_rute'     => 'required|exists:rute,id',    // ← tabel rute
            'tanggal'     => 'required|date',
            'scope'       => 'required|in:week,template',
        ]);

        DB::beginTransaction();

        try {
            $tanggals = [$validated['tanggal']];

            if ($validated['scope'] === 'template') {
                $base     = Carbon::parse($validated['tanggal']);
                $tanggals = [];
                for ($i = 0; $i < 12; $i++) {
                    $tanggals[] = $base->copy()->addWeeks($i)->toDateString();
                }
            }

            foreach ($tanggals as $tgl) {
                $jadwal = Jadwal::firstOrCreate(
                    [
                        'id_pos_jaga' => $validated['id_pos_jaga'],
                        'id_shift'    => $validated['id_shift'],
                        'tanggal'     => $tgl,
                    ]
                );

                // ← 'tanggal' dihapus, diambil dari relasi ke tabel jadwal
                JadwalAbsensi::firstOrCreate(
                    [
                        'id_jadwal' => $jadwal->id,
                        'id_user'   => $validated['id_user'],
                    ],
                    [
                        'id_rute' => $validated['id_rute'],
                        'status'  => 'menunggu',
                    ]
                );
            }

            DB::commit();

            return redirect()->back()->with('success', 'Jadwal berhasil disimpan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal menyimpan jadwal: ' . $e->getMessage());
        }
    }

    public function update(Request $request, JadwalAbsensi $absensi)
    {
        $validated = $request->validate([
            'id_user' => 'sometimes|exists:users,id',
            'id_rute' => 'sometimes|exists:rute,id',  // ← tabel rute
            'pulang_cepat' => 'sometimes|boolean',
        ]);

        $absensi->update($validated);

        return redirect()->back()->with('success', 'Jadwal berhasil diperbarui.');
    }

    public function autoGenerate(Request $request)
    {
        set_time_limit(120); // ← tambah ini

        $validated = $request->validate([
            'week_offset' => 'integer|min:0|max:52',
        ]);

        try {
            $service = new JadwalAutoSchedulerService();
            $result  = $service->generate($validated['week_offset'] ?? 0);
            return redirect()->back()->with('success', $result['message']);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function togglePulangCepat(Request $request, JadwalAbsensi $absensi)
    {
        $validated = $request->validate([
            'pulang_cepat' => 'required|boolean',
        ]);

        $absensi->update(['pulang_cepat' => $validated['pulang_cepat']]);

        return redirect()->back()->with('success',
            $validated['pulang_cepat'] ? 'Petugas ditandai pulang cepat.' : 'Tanda pulang cepat dihapus.'
        );
    }

    public function toggleLibur(Request $request, JadwalAbsensi $absensi)
    {
        if ($absensi->status === JadwalAbsensi::STATUS_LIBUR) {
            $absensi->update(['status' => JadwalAbsensi::STATUS_MENUNGGU]);
            return redirect()->back()->with('success', 'Libur dibatalkan. Petugas kembali ke shift asal.');
        } else {
            $absensi->update(['status' => JadwalAbsensi::STATUS_LIBUR]);
            return redirect()->back()->with('success', 'Petugas berhasil diliburkan.');
        }
    }

   public function tukarLibur(Request $request)
    {
        $validated = $request->validate([
            'id_absensi_libur_a' => 'required|exists:jadwal_absensi,id',
            'id_absensi_libur_b' => 'required|exists:jadwal_absensi,id',
        ]);

        DB::beginTransaction();
        try {
            $absensiA = JadwalAbsensi::with('jadwal.shift')->findOrFail($validated['id_absensi_libur_a']);
            $absensiB = JadwalAbsensi::with('jadwal.shift')->findOrFail($validated['id_absensi_libur_b']);

            // Validasi: keduanya harus libur
            if ($absensiA->status !== JadwalAbsensi::STATUS_LIBUR) {
                return redirect()->back()->with('error', 'Petugas pertama harus berstatus libur.');
            }
            if ($absensiB->status !== JadwalAbsensi::STATUS_LIBUR) {
                return redirect()->back()->with('error', 'Petugas kedua harus berstatus libur.');
            }

            $userA    = $absensiA->id_user;
            $userB    = $absensiB->id_user;
            $tanggalA = $absensiA->jadwal->tanggal;
            $tanggalB = $absensiB->jadwal->tanggal;

            if ($tanggalA === $tanggalB) {
                return redirect()->back()->with('error', 'Kedua petugas libur di hari yang sama, tidak perlu ditukar.');
            }

            // Ambil SEMUA id_jadwal di kedua tanggal tersebut
            $jadwalIds = Jadwal::whereIn('tanggal', [$tanggalA, $tanggalB])->pluck('id');

            // Ambil SEMUA jadwal absensi milik A di kedua tanggal (termasuk libur dan tugas)
            $semuaAbsensiA = JadwalAbsensi::whereIn('id_jadwal', $jadwalIds)
                ->where('id_user', $userA)
                ->get();

            // Ambil SEMUA jadwal absensi milik B di kedua tanggal (termasuk libur dan tugas)
            $semuaAbsensiB = JadwalAbsensi::whereIn('id_jadwal', $jadwalIds)
                ->where('id_user', $userB)
                ->get();

            // Pindahkan semua record A → ganti id_user menjadi B
            foreach ($semuaAbsensiA as $a) {
                $a->update(['id_user' => $userB]);
            }

            // Pindahkan semua record B → ganti id_user menjadi A
            foreach ($semuaAbsensiB as $b) {
                $b->update(['id_user' => $userA]);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Hari libur berhasil ditukar.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal menukar libur: ' . $e->getMessage());
        }
    }

    public function destroyAbsensi(JadwalAbsensi $absensi)
    {
        $jadwalId = $absensi->id_jadwal;
        $absensi->delete();

        $jadwal = Jadwal::find($jadwalId);
        if ($jadwal && $jadwal->jadwalAbsensi()->count() === 0) {
            $jadwal->delete();
        }

        return redirect()->back()->with('success', 'Jadwal berhasil dihapus.');
    }

    public function destroyTemplate(Request $request)
    {
        $validated = $request->validate([
            'id_pos_jaga' => 'required|exists:pos_jaga,id',
            'id_shift'    => 'required|exists:shift,id',  // ← tabel shift
            'id_user'     => 'required|exists:users,id',
            'from_date'   => 'required|date',
        ]);

        DB::beginTransaction();

        try {
            $jadwals = Jadwal::where('id_pos_jaga', $validated['id_pos_jaga'])
                ->where('id_shift', $validated['id_shift'])
                ->where('tanggal', '>=', $validated['from_date'])
                ->pluck('id');

            JadwalAbsensi::whereIn('id_jadwal', $jadwals)
                ->where('id_user', $validated['id_user'])
                ->delete();

            Jadwal::whereIn('id', $jadwals)
                ->whereDoesntHave('jadwalAbsensi')
                ->delete();

            DB::commit();

            return redirect()->back()->with('success', 'Template jadwal berhasil dihapus.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal menghapus template: ' . $e->getMessage());
        }
    }
}