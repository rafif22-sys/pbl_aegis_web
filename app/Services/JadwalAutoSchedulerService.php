<?php

namespace App\Services;

use App\Models\Jadwal;
use App\Models\JadwalAbsensi;
use App\Models\PosJaga;
use App\Models\Shift;
use App\Models\Rute;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class JadwalAutoSchedulerService
{
    public function generate(int $weekOffset = 0): array
    {
        $startOfWeek = Carbon::now()
            ->startOfWeek(Carbon::MONDAY)
            ->addWeeks($weekOffset);

        // ── Ambil semua data master sekaligus (4 query total) ─────────────
        $shifts = Shift::orderBy('jam_mulai')->get();
        if ($shifts->count() < 3) {
            throw new \Exception('Minimal 3 shift harus tersedia.');
        }

        $rutes = Rute::all();
        if ($rutes->isEmpty()) {
            throw new \Exception('Tidak ada rute tersedia.');
        }

        $posJagas = PosJaga::orderBy('id')->get();
        if ($posJagas->isEmpty()) {
            throw new \Exception('Tidak ada pos jaga tersedia.');
        }

        $semuaPetugas  = User::where('role', 'petugas')->orderBy('id')->get();
        $petugasPerPos = $this->bagikanPetugasKePos($semuaPetugas, $posJagas->count());

        // ── Siapkan semua tanggal dalam seminggu ──────────────────────────
        $tanggals = [];
        for ($d = 0; $d < 7; $d++) {
            $tanggals[] = $startOfWeek->copy()->addDays($d)->toDateString();
        }

        $created = 0;
        $skipped = 0;

        DB::beginTransaction();
        try {
            foreach ($posJagas as $posIndex => $pos) {
                $petugas = $petugasPerPos[$posIndex] ?? collect();
                if ($petugas->isEmpty()) continue;

                // ── Ambil semua jadwal pos ini untuk seminggu (1 query) ───
                $existingJadwals = Jadwal::where('id_pos_jaga', $pos->id)
                    ->whereIn('tanggal', $tanggals)
                    ->get()
                    ->keyBy(fn($j) => $j->tanggal->format('Y-m-d') . '_' . $j->id_shift);

                // ── Siapkan jadwal yang perlu dibuat ──────────────────────
                $jadwalToCreate = [];
                $allShiftIds    = $shifts->pluck('id')->toArray();

                foreach ($tanggals as $tanggal) {
                    foreach ($allShiftIds as $shiftId) {
                        $key = $tanggal . '_' . $shiftId;
                        if (!$existingJadwals->has($key)) {
                            $jadwalToCreate[] = [
                                'id_pos_jaga' => $pos->id,
                                'id_shift'    => $shiftId,
                                'tanggal'     => $tanggal,
                                'created_at'  => now(),
                                'updated_at'  => now(),
                            ];
                        }
                    }
                }

                // ── Insert jadwal baru sekaligus (1 query) ────────────────
                if (!empty($jadwalToCreate)) {
                    Jadwal::insert($jadwalToCreate);
                }

                // ── Ambil ulang semua jadwal pos ini (1 query) ────────────
                $allJadwals = Jadwal::where('id_pos_jaga', $pos->id)
                    ->whereIn('tanggal', $tanggals)
                    ->get()
                    ->keyBy(fn($j) => $j->tanggal->format('Y-m-d') . '_' . $j->id_shift);

                $jadwalIds = $allJadwals->pluck('id')->toArray();

                // ── Ambil semua absensi yang sudah ada (1 query) ──────────
                $existingAbsensi = JadwalAbsensi::whereIn('id_jadwal', $jadwalIds)
                    ->get(['id_jadwal', 'id_user'])
                    ->groupBy('id_jadwal')
                    ->map(fn($rows) => $rows->pluck('id_user')->toArray());

                // ── Proses tiap hari, kumpulkan insert ────────────────────
                $toInsert = [];
                $now      = now();

                // ── Tentukan jadwal libur untuk minggu ini (tiap petugas tepat 1 hari)
                $liburPerHari = [];
                for ($d = 0; $d < 7; $d++) {
                    $liburPerHari[$d] = collect();
                }

                // Distribusikan 1 hari libur untuk setiap petugas
                // Bergeser setiap minggu berdasarkan weekOffset
                foreach ($petugas->values() as $index => $p) {
                    $dayOff = ($index + $weekOffset) % 7;
                    $liburPerHari[$dayOff]->push($p);
                }

                foreach ($tanggals as $dayIndex => $tanggal) {
                    $petugasLibur = $liburPerHari[$dayIndex];
                    $petugasAktif = $petugas->reject(fn($p) => $petugasLibur->contains('id', $p->id))->values();

                    $totalOffset  = ($weekOffset * 7) + $dayIndex;

                    $distribusi = $this->bagikanKeShift($petugasAktif, $shifts, $totalOffset);

                    // Petugas aktif → shift masing-masing
                    foreach ($distribusi as $shiftId => $anggota) {
                        $key    = $tanggal . '_' . $shiftId;
                        $jadwal = $allJadwals->get($key);
                        if (!$jadwal) continue;

                        $existingUsers = $existingAbsensi->get($jadwal->id, []);

                        foreach ($anggota as $p) {
                            if (in_array($p->id, $existingUsers)) {
                                $skipped++;
                                continue;
                            }

                            $rute         = $rutes[$p->id % $rutes->count()];
                            $toInsert[]   = [
                                'id_jadwal'  => $jadwal->id,
                                'id_user'    => $p->id,
                                'id_rute'    => $rute->id,
                                'status'     => JadwalAbsensi::STATUS_MENUNGGU,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ];
                            $created++;
                        }
                    }

                    // Petugas libur → shift pertama sebagai placeholder
                    $keyLibur    = $tanggal . '_' . $shifts->first()->id;
                    $jadwalLibur = $allJadwals->get($keyLibur);

                    if ($jadwalLibur) {
                        $existingLibur = $existingAbsensi->get($jadwalLibur->id, []);

                        foreach ($petugasLibur as $pLibur) {
                            if (!in_array($pLibur->id, $existingLibur)) {
                                $toInsert[] = [
                                    'id_jadwal'  => $jadwalLibur->id,
                                    'id_user'    => $pLibur->id,
                                    'id_rute'    => $rutes->first()->id,
                                    'status'     => JadwalAbsensi::STATUS_LIBUR,
                                    'created_at' => $now,
                                    'updated_at' => $now,
                                ];
                                $created++;
                            } else {
                                $skipped++;
                            }
                        }
                    }
                }

                // ── Insert semua absensi pos ini sekaligus (1 query) ──────
                if (!empty($toInsert)) {
                    JadwalAbsensi::insert($toInsert);
                }
            }

            DB::commit();

            return [
                'success' => true,
                'message' => "Jadwal berhasil dibuat: {$created} entri baru, {$skipped} sudah ada.",
                'created' => $created,
                'skipped' => $skipped,
                'periode' => $startOfWeek->format('d M Y') . ' s/d ' .
                             $startOfWeek->copy()->endOfWeek()->format('d M Y'),
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    // ── Bagi petugas ke pos, masing-masing minimal 7 orang ───────────────────

    private function bagikanPetugasKePos(Collection $petugas, int $jumlahPos): array
    {
        $result = [];
        for ($i = 0; $i < $jumlahPos; $i++) {
            $result[$i] = collect();
        }

        $withSupervisor = $petugas->filter(fn($p) => !is_null($p->id_supervisor));
        $withoutSupervisor = $petugas->filter(fn($p) => is_null($p->id_supervisor));

        // Buat array kumpulan grup (tiap elemen adalah Collection petugas)
        $allGroups = [];

        foreach ($withSupervisor->groupBy('id_supervisor') as $group) {
            $allGroups[] = $group;
        }

        // Urutkan grup dari yang terbesar ke terkecil
        usort($allGroups, fn($a, $b) => $b->count() <=> $a->count());

        // Tambahkan petugas tanpa supervisor satu per satu agar bisa menyeimbangkan
        foreach ($withoutSupervisor as $p) {
            $allGroups[] = collect([$p]);
        }

        // Distribusikan grup ke pos yang jumlah anggotanya paling sedikit
        foreach ($allGroups as $group) {
            $minIndex = 0;
            $minCount = PHP_INT_MAX;
            for ($i = 0; $i < $jumlahPos; $i++) {
                $count = $result[$i]->count();
                if ($count < $minCount) {
                    $minCount = $count;
                    $minIndex = $i;
                }
            }
            $result[$minIndex] = $result[$minIndex]->merge($group);
        }

        return $result;
    }

    // ── Bagi petugas aktif ke shift dengan rotasi harian ─────────────────────

    private function bagikanKeShift(
        Collection $petugasAktif,
        Collection $shifts,
        int $totalOffset
    ): array {
        $jumlahShift  = $shifts->count();
        $total        = $petugasAktif->count();
        $basePerShift = intdiv($total, $jumlahShift);
        $sisa         = $total % $jumlahShift;

        $slotPerShift = [];
        for ($i = 0; $i < $jumlahShift; $i++) {
            $slotPerShift[$i] = $basePerShift + ($i < $sisa ? 1 : 0);
        }

        $rotateBy = $total > 0 ? ($totalOffset * $basePerShift) % $total : 0;

        $rotated = $petugasAktif
            ->slice($rotateBy)
            ->merge($petugasAktif->slice(0, $rotateBy))
            ->values();

        $result = [];
        $offset = 0;

        foreach ($shifts as $i => $shift) {
            $jumlah             = $slotPerShift[$i];
            $result[$shift->id] = $rotated->slice($offset, $jumlah)->values();
            $offset            += $jumlah;
        }

        return $result;
    }
}