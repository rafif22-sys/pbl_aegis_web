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

                foreach ($tanggals as $dayIndex => $tanggal) {
                    $totalOffset  = ($weekOffset * 7) + $dayIndex;
                    $totalPetugas = $petugas->count();
                    $liburIndex   = $totalOffset % $totalPetugas;

                    $petugasList  = $petugas->values();
                    $petugasLibur = $petugasList[$liburIndex];
                    $petugasAktif = $petugasList->filter(
                        fn($p, $i) => $i !== $liburIndex
                    )->values();

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

                        if (!in_array($petugasLibur->id, $existingLibur)) {
                            $toInsert[] = [
                                'id_jadwal'  => $jadwalLibur->id,
                                'id_user'    => $petugasLibur->id,
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
        $chunks = $petugas->chunk(7);

        foreach ($chunks as $chunkIndex => $chunk) {
            $posIndex = min($chunkIndex, $jumlahPos - 1);
            if (!isset($result[$posIndex])) {
                $result[$posIndex] = collect();
            }
            $result[$posIndex] = $result[$posIndex]->merge($chunk);
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