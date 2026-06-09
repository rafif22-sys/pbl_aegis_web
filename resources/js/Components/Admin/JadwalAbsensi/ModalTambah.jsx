import { useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import { FormInput, inputStyle } from '@/Components/Admin/FormInput';

function Select({ value, onChange, children, error }) {
    return (
        <select
            value={value}
            onChange={onChange}
            className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none transition-all"
            style={inputStyle(error)}
        >
            {children}
        </select>
    );
}

export function ModalTambah({ open, onClose, posJagas, shifts, petugas, rutes, defaultTanggal, defaultShiftId }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        id_pos_jaga : posJagas[0]?.id ?? '',
        id_shift    : shifts[0]?.id   ?? '',
        id_user     : petugas[0]?.id  ?? '',
        id_rute     : rutes[0]?.id    ?? '',
        tanggal     : defaultTanggal  ?? '',
        scope       : 'week',
    });

    useMemo(() => {
        if (!open) return;
        setData(prev => ({
            ...prev,
            id_shift : defaultShiftId ? Number(defaultShiftId) : (shifts[0]?.id ?? ''),
            tanggal  : defaultTanggal ?? prev.tanggal,
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, defaultShiftId, defaultTanggal]);

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.jadwal.store'), {
            onSuccess: () => { reset(); onClose(); },
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

                <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10"
                    style={{ borderColor: '#e0f2fe' }}>
                    <div>
                        <h2 className="text-base font-bold" style={{ color: '#0F2A44' }}>Tambah Jadwal</h2>
                        <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
                            Isi form untuk menambah jadwal patroli
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
                        style={{ color: '#94a3b8' }}>✕</button>
                </div>

                <form onSubmit={submit} className="px-6 py-5 space-y-4">
                    <FormInput label="Pos Jaga" required error={errors.id_pos_jaga}>
                        <Select value={data.id_pos_jaga}
                            onChange={e => setData('id_pos_jaga', e.target.value)}
                            error={errors.id_pos_jaga}>
                            {posJagas.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                        </Select>
                    </FormInput>

                    <FormInput label="Shift" required error={errors.id_shift}>
                        <Select value={data.id_shift}
                            onChange={e => setData('id_shift', Number(e.target.value))}
                            error={errors.id_shift}>
                            {shifts.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.nama} ({s.jam_masuk} – {s.jam_pulang})
                                </option>
                            ))}
                        </Select>
                    </FormInput>

                    <FormInput label="Petugas" required error={errors.id_user}>
                        <Select value={data.id_user}
                            onChange={e => setData('id_user', e.target.value)}
                            error={errors.id_user}>
                            {petugas.map(u => <option key={u.id} value={u.id}>{u.nama}</option>)}
                        </Select>
                    </FormInput>

                    <FormInput label="Rute Patroli" required error={errors.id_rute}>
                        <Select value={data.id_rute}
                            onChange={e => setData('id_rute', e.target.value)}
                            error={errors.id_rute}>
                            {rutes.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
                        </Select>
                    </FormInput>

                    <FormInput label="Tanggal" required error={errors.tanggal}>
                        <input type="date" value={data.tanggal}
                            onChange={e => setData('tanggal', e.target.value)}
                            className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none transition-all"
                            style={inputStyle(errors.tanggal)} />
                    </FormInput>

                    <FormInput label="Terapkan ke">
                        <Select value={data.scope} onChange={e => setData('scope', e.target.value)}>
                            <option value="week">Minggu ini saja</option>
                            <option value="template">Template berulang (12 minggu ke depan)</option>
                        </Select>
                    </FormInput>

                    {data.scope === 'template' && (
                        <div className="rounded-xl px-4 py-3 text-xs border"
                            style={{ background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e' }}>
                            ⚠️ Jadwal akan dibuat otomatis untuk 12 minggu ke depan pada hari yang sama setiap minggunya.
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 text-sm rounded-xl border transition-colors hover:bg-gray-50"
                            style={{ borderColor: '#c7e8f8', color: '#64748b' }}>
                            Batal
                        </button>
                        <button type="submit" disabled={processing}
                            className="px-5 py-2 text-sm rounded-xl font-semibold transition-colors hover:opacity-90 disabled:opacity-60"
                            style={{ background: '#005EA4', color: 'white' }}>
                            {processing ? 'Menyimpan...' : 'Simpan Jadwal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}