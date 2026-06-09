<?php

namespace App\Console\Commands;

use App\Models\JadwalAbsensi;
use App\Models\Jadwal;
use Carbon\Carbon;
use Illuminate\Console\Command;

class MarkAlphaAbsensi extends Command
{
    protected $signature   = 'absensi:mark-alpha';
    protected $description = 'Tandai absensi alpha 30 menit setelah shift selesai';

    public function handle()
    {
        $now = Carbon::now();

        $jadwals = Jadwal::with(['shift', 'jadwalAbsensi'])
            ->whereDate('tanggal', '<=', $now->toDateString())
            ->get();

        $count = 0;

        foreach ($jadwals as $jadwal) {
            if (!$jadwal->shift) continue;

            // Langsung pakai Carbon object dari cast, ambil hour & minute saja
            $jamMulai   = $jadwal->shift->jam_mulai;   // sudah Carbon
            $jamSelesai = $jadwal->shift->jam_selesai; // sudah Carbon

            // Gabungkan tanggal jadwal + jam selesai shift + 30 menit
            $jamCek = Carbon::parse($jadwal->tanggal)
                ->setTime($jamSelesai->hour, $jamSelesai->minute)
                ->addMinutes(30);

            // Shift malam: jam selesai < jam mulai → selesai keesokan harinya
            if ($jamSelesai->format('H:i') < $jamMulai->format('H:i')) {
                $jamCek->addDay();
            }

            // Belum waktunya dicek → skip
            if ($now->lessThan($jamCek)) continue;

            foreach ($jadwal->jadwalAbsensi as $absensi) {
                // Skip status selain menunggu & hadir
                if (!in_array($absensi->status, ['menunggu', 'hadir'])) continue;

                $isAlpha = false;

                if ($absensi->status === 'menunggu') {
                    // Tidak ada jam masuk sama sekali → alpha
                    $isAlpha = true;
                } elseif ($absensi->status === 'hadir') {
                    // Ada jam masuk tapi tidak ada jam pulang → alpha
                    if (is_null($absensi->jam_pulang)) {
                        $isAlpha = true;
                    }
                }

                if ($isAlpha) {
                    $absensi->update(['status' => 'alpha']);
                    $count++;
                }
            }
        }

        $this->info("Berhasil menandai {$count} absensi sebagai alpha.");
    }
}