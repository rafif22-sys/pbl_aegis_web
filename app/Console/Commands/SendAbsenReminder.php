<?php

namespace App\Console\Commands;

use App\Models\Jadwal;
use App\Services\FcmService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendAbsenReminder extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'absensi:send-reminder';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kirim notifikasi pengingat absen masuk dan pulang kepada petugas';

    /**
     * Execute the console command.
     */
    public function handle(FcmService $fcmService)
    {
        $now = Carbon::now();

        // Ambil jadwal hari ini (dan kemarin untuk shift malam yang selesainya hari ini)
        // Kita cek dari jadwal_absensi dan jadwal
        // Lebih baik ambil jadwal yang tanggalnya hari ini atau kemarin
        $jadwals = Jadwal::with(['shift', 'jadwalAbsensi.user'])
            ->whereIn('tanggal', [$now->toDateString(), $now->copy()->subDay()->toDateString()])
            ->get();

        $countMasuk = 0;
        $countPulang = 0;

        foreach ($jadwals as $jadwal) {
            if (!$jadwal->shift) continue;

            $jamMulai   = $jadwal->shift->jam_mulai;
            $jamSelesai = $jadwal->shift->jam_selesai;

            $waktuMulai = Carbon::parse($jadwal->tanggal)->setTime($jamMulai->hour, $jamMulai->minute);
            $waktuSelesai = Carbon::parse($jadwal->tanggal)->setTime($jamSelesai->hour, $jamSelesai->minute);

            // Jika shift malam
            if ($jamSelesai->format('H:i') < $jamMulai->format('H:i')) {
                $waktuSelesai->addDay();
            }

            $waktuBukaMasuk = $waktuMulai->copy()->subMinutes(15);
            $waktuBukaPulang = $waktuSelesai->copy();

            // Cek apakah sekarang adalah tepat menit di mana akses dibuka
            $isWaktuMasuk = $now->format('Y-m-d H:i') === $waktuBukaMasuk->format('Y-m-d H:i');
            $isWaktuPulang = $now->format('Y-m-d H:i') === $waktuBukaPulang->format('Y-m-d H:i');

            if (!$isWaktuMasuk && !$isWaktuPulang) {
                continue; // Belum waktunya untuk jadwal ini
            }

            foreach ($jadwal->jadwalAbsensi as $absensi) {
                if (!$absensi->user || !$absensi->user->fcm_token) continue;

                if ($isWaktuMasuk && is_null($absensi->jam_masuk) && !in_array($absensi->status, ['libur', 'alpha'])) {
                    $fcmService->sendAbsenReminder($absensi->user, 'masuk');
                    $countMasuk++;
                }

                if ($isWaktuPulang && !is_null($absensi->jam_masuk) && is_null($absensi->jam_pulang) && !in_array($absensi->status, ['libur', 'alpha'])) {
                    $fcmService->sendAbsenReminder($absensi->user, 'pulang');
                    $countPulang++;
                }
            }
        }

        $this->info("Pengingat terkirim: {$countMasuk} absen masuk, {$countPulang} absen pulang.");
    }
}
