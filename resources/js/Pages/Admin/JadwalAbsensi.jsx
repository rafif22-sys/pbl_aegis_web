import { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { StatCard } from '@/Components/Admin/StatCard';
import { DAYS, SHIFT_COLOR } from '@/Components/Admin/JadwalAbsensi/constants';
import { getWeekDates, toDateStr, isToday, formatWeekRange } from '@/Components/Admin/JadwalAbsensi/utils';
import { JadwalCard } from '@/Components/Admin/JadwalAbsensi/JadwalCard';
import { ModalTambah } from '@/Components/Admin/JadwalAbsensi/ModalTambah';
import { ModalDetail } from '@/Components/Admin/JadwalAbsensi/ModalDetail';
import { ModalAutoGenerate } from '@/Components/Admin/JadwalAbsensi/ModalAutoGenerate';
import { ModalTukarLibur } from '@/Components/Admin/JadwalAbsensi/ModalTukarLibur';

function Flash() {
    const { flash } = usePage().props;
    if (!flash?.success && !flash?.error) return null;
    return (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm border"
            style={flash.success
                ? { background: '#f0fdf4', borderColor: '#86efac', color: '#166634' }
                : { background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
            {flash.success ?? flash.error}
        </div>
    );
}

export default function JadwalAbsensi({
    jadwals, posJagas, shifts, petugas, rutes, stats,
    weekOffset, startOfWeek, endOfWeek, filters,
}) {
    const [localOffset,      setLocalOffset]      = useState(weekOffset);
    const [filterPos,        setFilterPos]        = useState(filters.pos_jaga_id ?? '');
    const [filterShift,      setFilterShift]      = useState(filters.shift_id    ?? '');
    const [showTambah,       setShowTambah]       = useState(false);
    const [defaultTanggal,   setDefaultTanggal]   = useState('');
    const [defaultShiftId,   setDefaultShiftId]   = useState('');
    const [showDetail,       setShowDetail]       = useState(false);
    const [detailJadwal,     setDetailJadwal]     = useState(null);
    const [detailAbsensi,    setDetailAbsensi]    = useState(null);
    const [showAutoGenerate, setShowAutoGenerate] = useState(false);

    // ← state tukar libur
    const [showTukarLibur,    setShowTukarLibur]    = useState(false);
    const [tukarAbsensiLibur, setTukarAbsensiLibur] = useState(null);
    const [tukarJadwalLibur,  setTukarJadwalLibur]  = useState(null);

    const weekDates = useMemo(() => getWeekDates(startOfWeek), [startOfWeek]);

    const changeWeek = (dir) => {
        const next = localOffset + dir;
        setLocalOffset(next);
        router.get(route('admin.jadwal.index'),
            { week_offset: next, pos_jaga_id: filterPos || undefined, shift_id: filterShift || undefined },
            { preserveState: true, replace: true });
    };

    const applyFilter = (pos, shift) => {
        router.get(route('admin.jadwal.index'),
            { week_offset: localOffset, pos_jaga_id: pos || undefined, shift_id: shift || undefined },
            { preserveState: true, replace: true });
    };

    const onFilterPos   = (val) => { setFilterPos(val);   applyFilter(val, filterShift); };
    const onFilterShift = (val) => { setFilterShift(val); applyFilter(filterPos, val);   };

    const openAddFromCell = (tanggal, shiftId) => {
        setDefaultTanggal(tanggal);
        setDefaultShiftId(shiftId);
        setShowTambah(true);
    };

    const openDetail = (jadwal, ab) => {
        setDetailJadwal(jadwal);
        setDetailAbsensi(ab);
        setShowDetail(true);
    };

    // ← handler buka modal tukar libur
    const openTukarLibur = (jadwal, ab) => {
        setTukarJadwalLibur(jadwal);
        setTukarAbsensiLibur(ab);
        setShowTukarLibur(true);
    };

    const statCards = [
        {
            label: 'Total Jadwal',  value: stats.total_jadwal,  sub: 'minggu ini',
            blue: true,  accent: '#fbbf24',
            icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                    <rect x="3" y="4" width="18" height="18" rx="3"/>
                    <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
            ),
        },
        {
            label: 'Petugas Aktif', value: stats.total_petugas, sub: 'terjadwal minggu ini',
            blue: false, accent: '#005EA4',
            icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#005EA4" strokeWidth="1.8">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
            ),
        },
        {
            label: 'Rute Dipakai',  value: stats.total_rute,    sub: 'jalur berbeda',
            blue: true,  accent: '#34d399',
            icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="5"  cy="6"  r="2"/><circle cx="19" cy="6"  r="2"/><circle cx="12" cy="18" r="2"/>
                    <path d="M7 6h10M19 8l-7 8M5 8l7 8"/>
                </svg>
            ),
        },
        {
            label: 'Shift Terisi',  value: stats.shift_terisi,  sub: 'dari semua shift',
            blue: false, accent: '#7c3aed',
            icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#005EA4" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 7v5l3 3"/>
                </svg>
            ),
        },
    ];

    return (
        <>
            <Head title="Jadwal Absensi" />
            <AdminLayout activeMenu="Manajemen Jadwal" title="Jadwal Absensi">
                <div className="flex flex-col gap-3 flex-1 min-h-0">
                    <Flash />

                    <div className="grid grid-cols-4 gap-4 shrink-0">
                        {statCards.map(c => <StatCard key={c.label} {...c} />)}
                    </div>

                    <div className="flex-1 rounded-2xl overflow-hidden flex flex-col min-h-0 shadow-sm"
                        style={{ background: 'white', border: '1.5px solid #c7e8f8' }}>

                        {/* Toolbar */}
                        <div className="px-5 py-3 shrink-0 flex items-center gap-3 flex-wrap"
                            style={{ borderBottom: '1.5px solid #e0f2fe' }}>
                            <div className="flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#005EA4" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="3"/>
                                    <path d="M16 2v4M8 2v4M3 10h18"/>
                                </svg>
                                <h2 className="font-semibold text-sm" style={{ color: '#0F2A44' }}>
                                    Jadwal Mingguan Patroli
                                </h2>
                            </div>

                            <select value={filterPos} onChange={e => onFilterPos(e.target.value)}
                                className="text-xs rounded-xl px-3 py-2 outline-none transition-all"
                                style={{ background: '#f8fafc', border: '1.5px solid #c7e8f8', color: '#0F2A44' }}>
                                <option value="">Semua Pos Jaga</option>
                                {posJagas.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                            </select>

                            <select value={filterShift} onChange={e => onFilterShift(e.target.value)}
                                className="text-xs rounded-xl px-3 py-2 outline-none transition-all"
                                style={{ background: '#f8fafc', border: '1.5px solid #c7e8f8', color: '#0F2A44' }}>
                                <option value="">Semua Shift</option>
                                {shifts.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                            </select>

                            <div className="flex items-center gap-2">
                                <button onClick={() => changeWeek(-1)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-105 transition-transform"
                                    style={{ background: '#e0f2fe', color: '#005EA4' }}>←</button>
                                <span className="text-xs font-semibold min-w-[180px] text-center"
                                    style={{ color: '#0F2A44' }}>
                                    {formatWeekRange(startOfWeek, endOfWeek)}
                                </span>
                                <button onClick={() => changeWeek(1)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-105 transition-transform"
                                    style={{ background: '#e0f2fe', color: '#005EA4' }}>→</button>
                            </div>

                            <button onClick={() => setShowAutoGenerate(true)}
                                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 shrink-0"
                                style={{ background: '#059669', color: 'white' }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="3"/>
                                    <path d="M16 2v4M8 2v4M3 10h18"/>
                                </svg>
                                Generate Otomatis
                            </button>

                            <button onClick={() => { setDefaultTanggal(''); setDefaultShiftId(''); setShowTambah(true); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 shrink-0"
                                style={{ background: '#005EA4' }}>
                                + Tambah Jadwal
                            </button>
                        </div>

                        {/* Legend */}
                        <div className="px-5 py-2 flex items-center gap-4 shrink-0"
                            style={{ borderBottom: '1px solid #f0f9ff' }}>
                            {[
                                [SHIFT_COLOR.pagi,  'Shift Pagi'],
                                [SHIFT_COLOR.siang, 'Shift Siang'],
                                [SHIFT_COLOR.malam, 'Shift Malam'],
                            ].map(([c, label]) => (
                                <div key={label} className="flex items-center gap-1.5 text-[10px]"
                                    style={{ color: '#64748b' }}>
                                    <span className="w-2.5 h-2.5 rounded border"
                                        style={{ background: c.bg, borderColor: c.border }} />
                                    {label}
                                </div>
                            ))}
                            <div className="ml-auto flex items-center gap-1.5 text-[10px]"
                                style={{ color: '#1d4ed8' }}>
                                ℹ️ Klik sel untuk tambah · Klik kartu untuk detail · Klik libur untuk tukar
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="flex-1 overflow-auto"
                            style={{ scrollbarWidth: 'thin', scrollbarColor: '#b8dff0 transparent' }}>
                            <div style={{ minWidth: 700 }}>

                                {/* Header hari */}
                                <div className="grid sticky top-0 z-10"
                                    style={{ gridTemplateColumns: '110px repeat(7, 1fr)', background: '#005EA4' }}>
                                    <div className="px-3 py-3 text-xs font-semibold text-white">Shift</div>
                                    {weekDates.map((d, i) => {
                                        const ds    = toDateStr(d);
                                        const today = isToday(ds);
                                        return (
                                            <div key={i}
                                                className="px-2 py-3 text-center text-xs font-medium border-l"
                                                style={{
                                                    borderColor : 'rgba(255,255,255,0.15)',
                                                    background  : today ? 'rgba(255,255,255,0.15)' : 'transparent',
                                                    color       : 'white',
                                                }}>
                                                <span className="block text-lg font-bold mb-0.5 leading-none">
                                                    {d.getDate()}
                                                </span>
                                                {DAYS[i]}
                                                {today && (
                                                    <span className="block text-[9px] mt-0.5 font-semibold"
                                                        style={{ color: '#fbbf24' }}>
                                                        HARI INI
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Baris shift */}
                                {shifts.map((shift, si) => (
                                    <div key={shift.id} className="grid"
                                        style={{
                                            gridTemplateColumns : '110px repeat(7, 1fr)',
                                            borderBottom        : si < shifts.length - 1 ? '1px solid #e0f2fe' : 'none',
                                        }}>
                                        <div className="px-3 py-3 flex flex-col gap-0.5 border-r"
                                            style={{ background: '#f8fafc', borderColor: '#c7e8f8' }}>
                                            <span className="text-xs font-bold" style={{ color: '#0F2A44' }}>
                                                {shift.nama}
                                            </span>
                                            <span className="text-[10px]" style={{ color: '#94a3b8' }}>
                                                {shift.jam_masuk} – {shift.jam_pulang}
                                            </span>
                                        </div>

                                        {weekDates.map((d, di) => {
                                            const dateStr      = toDateStr(d);
                                            const today        = isToday(dateStr);
                                            const matchJadwals = jadwals.filter(j =>
                                                j.tanggal === dateStr && j.shift?.id === shift.id
                                            );
                                            return (
                                                <div key={di}
                                                    onClick={() => openAddFromCell(dateStr, shift.id)}
                                                    className="border-l min-h-[90px] p-2 cursor-pointer transition-colors"
                                                    style={{ borderColor: '#e0f2fe', background: today ? '#f0f9ff' : 'white' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = today ? '#dbeeff' : '#f8fafc'}
                                                    onMouseLeave={e => e.currentTarget.style.background = today ? '#f0f9ff' : 'white'}>

                                                    {matchJadwals.flatMap(j =>
                                                        j.absensi
                                                            .filter(ab => ab.status !== 'libur')
                                                            .map(ab => (
                                                                <JadwalCard key={ab.id}
                                                                    absensi={ab}
                                                                    shiftNama={shift.nama}
                                                                    onClick={(e) => { e.stopPropagation(); openDetail(j, ab); }}
                                                                />
                                                            ))
                                                    )}

                                                    <div className="flex items-center justify-center h-6 mt-1 rounded-lg border border-dashed text-sm transition-colors"
                                                        style={{ borderColor: '#c7e8f8', color: '#c7e8f8' }}
                                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#005EA4'; e.currentTarget.style.color = '#005EA4'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#c7e8f8'; e.currentTarget.style.color = '#c7e8f8'; }}>
                                                        +
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}

                                {/* Baris Libur */}
                                <div className="grid" style={{ gridTemplateColumns: '110px repeat(7, 1fr)' }}>
                                    <div className="px-3 py-3 flex flex-col gap-0.5 border-r border-t"
                                        style={{ background: '#f8fafc', borderColor: '#c7e8f8' }}>
                                        <div className="flex items-center gap-1">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                                strokeLinejoin="round" style={{ color: '#475569' }}>
                                                <path d="M2 12h20M2 12a10 10 0 0 1 20 0M12 2v2M4.93 4.93l1.41 1.41M19.07 4.93l-1.41 1.41"/>
                                                <path d="M12 22v-4"/>
                                            </svg>
                                            <span className="text-xs font-bold" style={{ color: '#475569' }}>Libur</span>
                                        </div>
                                        <span className="text-[10px]" style={{ color: '#94a3b8' }}>klik untuk tukar</span>
                                    </div>

                                    {weekDates.map((d, di) => {
                                        const dateStr   = toDateStr(d);
                                        const today     = isToday(dateStr);
                                        const liburList = jadwals
                                            .filter(j => j.tanggal === dateStr)
                                            .flatMap(j => j.absensi
                                                .filter(ab => ab.status === 'libur')
                                                .map(ab => ({
                                                    ...ab,
                                                    // sertakan jadwal induknya untuk openTukarLibur
                                                    _jadwal: j,
                                                }))
                                            );

                                        return (
                                            <div key={di} className="border-l border-t min-h-[60px] p-2"
                                                style={{ borderColor: '#e0f2fe', background: today ? '#f0f9ff' : 'white' }}>
                                                {liburList.length === 0 ? (
                                                    <p className="text-[10px] text-center mt-2" style={{ color: '#cbd5e1' }}>—</p>
                                                ) : (
                                                    liburList.map(ab => (
                                                        <div key={ab.id}
                                                            onClick={() => openTukarLibur(ab._jadwal, ab)}
                                                            className="rounded-lg border px-2 py-1 mb-1 text-[11px] font-semibold truncate cursor-pointer hover:shadow-sm hover:scale-[1.01] transition-all"
                                                            style={{ background: '#f1f5f9', borderColor: '#94a3b8', color: '#475569' }}>
                                                            <div className="flex items-center gap-1">
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                                                                    stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M2 12h20M2 12a10 10 0 0 1 20 0M12 2v2M4.93 4.93l1.41 1.41M19.07 4.93l-1.41 1.41"/>
                                                                    <path d="M12 22v-4"/>
                                                                </svg>
                                                                {ab.user?.nama ?? '—'}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <ModalTambah
                    open={showTambah} onClose={() => setShowTambah(false)}
                    posJagas={posJagas} shifts={shifts} petugas={petugas} rutes={rutes}
                    defaultTanggal={defaultTanggal} defaultShiftId={defaultShiftId}
                />
                <ModalDetail
                    open={showDetail} onClose={() => setShowDetail(false)}
                    jadwal={detailJadwal} absensi={detailAbsensi}
                    petugas={petugas} rutes={rutes}
                />
                <ModalAutoGenerate
                    open={showAutoGenerate} onClose={() => setShowAutoGenerate(false)}
                    weekOffset={localOffset} startOfWeek={startOfWeek} endOfWeek={endOfWeek}
                />
                <ModalTukarLibur
                    open={showTukarLibur} onClose={() => setShowTukarLibur(false)}
                    absensiLibur={tukarAbsensiLibur}
                    jadwalLibur={tukarJadwalLibur}
                    jadwals={jadwals}
                />
            </AdminLayout>
        </>
    );
}