import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';

// ── Icon Components ──────────────────────────────────────
const Icon = ({ path, className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const icons = {
    petugas:    'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
    warga:      'M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z',
    supervisor: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z',
    rute:       'M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z',
    checkpoint: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
    pos_jaga:   'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
    send:       'M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5',
    clock:      'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    map:        'M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z',
    book:       'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
    info:       'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z',
};

// ── Stat Card ────────────────────────────────────────────
function StatCard({ label, value, iconKey, color }) {
    const colorMap = {
        blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500',   border: 'border-blue-100',  val: 'text-blue-700'  },
        green:  { bg: 'bg-green-50',  icon: 'text-green-500',  border: 'border-green-100', val: 'text-green-700' },
        amber:  { bg: 'bg-amber-50',  icon: 'text-amber-500',  border: 'border-amber-100', val: 'text-amber-700' },
        purple: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-100',val: 'text-purple-700'},
        rose:   { bg: 'bg-rose-50',   icon: 'text-rose-500',   border: 'border-rose-100',  val: 'text-rose-700'  },
        teal:   { bg: 'bg-teal-50',   icon: 'text-teal-500',   border: 'border-teal-100',  val: 'text-teal-700'  },
    };
    const c = colorMap[color] ?? colorMap.blue;

    return (
        <div className={`flex items-center gap-4 rounded-xl border ${c.border} ${c.bg} p-4 shadow-sm`}>
            <div className={`rounded-lg bg-white p-2.5 shadow-sm ${c.icon}`}>
                <Icon path={icons[iconKey]} className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
                <p className={`text-2xl font-bold ${c.val}`}>{value}</p>
            </div>
        </div>
    );
}

// ── Bubble pesan ─────────────────────────────────────────
function ChatBubble({ msg, isMe }) {
    const roleColor = {
        admin:      'bg-indigo-100 text-indigo-700',
        petugas:    'bg-green-100 text-green-700',
        supervisor: 'bg-amber-100 text-amber-700',
        warga:      'bg-sky-100 text-sky-700',
    };

    return (
        <div className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 uppercase">
                {msg.pengirim?.[0] ?? '?'}
            </div>

            <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className="flex items-center gap-1.5">
                    {!isMe && <span className="text-xs font-semibold text-gray-700">{msg.pengirim}</span>}
                    {msg.role && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${roleColor[msg.role] ?? 'bg-gray-100 text-gray-600'}`}>
                            {msg.role}
                        </span>
                    )}
                    {isMe && <span className="text-xs font-semibold text-gray-700">{msg.pengirim}</span>}
                </div>

                <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                    isMe
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                }`}>
                    {msg.pesan}
                </div>

                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Icon path={icons.clock} className="w-3 h-3" />
                    {msg.waktu}
                </span>
            </div>
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────
export default function Dashboard({ stats, buku_tamu, rute_patroli, informasi }) {
    const { auth } = usePage().props;
    const currentUserId = auth?.user?.id;
    const currentUserRole = auth?.user?.role;

    const chatEndRef = useRef(null);
    const [activeTab, setActiveTab] = useState('informasi');

    // Form kirim pesan via Inertia
    const { data, setData, post, processing, reset, errors } = useForm({ pesan: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!data.pesan.trim()) return;
        post(route('admin.informasi.kirim'), {
            preserveScroll: true,
            onSuccess: () => reset('pesan'),
        });
    };

    // Scroll ke bawah chat saat informasi berubah
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [informasi]);

    const statItems = [
        { label: 'Petugas',    value: stats.petugas,    iconKey: 'petugas',    color: 'blue'   },
        { label: 'Warga',      value: stats.warga,      iconKey: 'warga',      color: 'green'  },
        { label: 'Supervisor', value: stats.supervisor, iconKey: 'supervisor', color: 'amber'  },
        { label: 'Rute',       value: stats.rute,       iconKey: 'rute',       color: 'purple' },
        { label: 'Checkpoint', value: stats.checkpoint, iconKey: 'checkpoint', color: 'rose'   },
        { label: 'Pos Jaga',   value: stats.pos_jaga,   iconKey: 'pos_jaga',   color: 'teal'   },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard Admin
                </h2>
            }
        >
            <Head title="Dashboard Admin" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* ── Stat Cards ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {statItems.map((s) => (
                            <StatCard key={s.label} {...s} />
                        ))}
                    </div>

                    {/* ── Konten Bawah ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                        {/* Kiri: Tab Buku Tamu + Rute */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            {/* Tab header */}
                            <div className="flex border-b border-gray-100">
                                {[
                                    { key: 'buku_tamu', label: 'Buku Tamu', icon: icons.book },
                                    { key: 'rute',      label: 'Rute Patroli', icon: icons.map },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                                            activeTab === tab.key
                                                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Icon path={tab.icon} className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab content */}
                            <div className="flex-1 overflow-y-auto" style={{ maxHeight: '480px' }}>
                                {activeTab === 'buku_tamu' && (
                                    <div className="divide-y divide-gray-50">
                                        {buku_tamu.length === 0 ? (
                                            <p className="p-6 text-center text-sm text-gray-400">Belum ada data tamu.</p>
                                        ) : buku_tamu.map((tamu) => (
                                            <div key={tamu.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{tamu.nama}</p>
                                                        <p className="text-xs text-gray-500">{tamu.alamat}</p>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5">
                                                        {new Date(tamu.waktu_masuk).toLocaleString('id-ID', {
                                                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-indigo-600 mt-1">
                                                    Keperluan: {tamu.keperluan}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'rute' && (
                                    <div className="divide-y divide-gray-50">
                                        {rute_patroli.length === 0 ? (
                                            <p className="p-6 text-center text-sm text-gray-400">Belum ada rute patroli.</p>
                                        ) : rute_patroli.map((rute) => (
                                            <div key={rute.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                                <p className="text-sm font-semibold text-gray-800">{rute.nama}</p>
                                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{rute.deskripsi || '—'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Kanan: Panel Informasi / Chat */}
                        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            {/* Header panel */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                                <Icon path={icons.info} className="w-5 h-5 text-indigo-500" />
                                <h3 className="font-semibold text-gray-800 text-sm">Informasi & Komunikasi</h3>
                                <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                                    {informasi.length} pesan
                                </span>
                            </div>

                            {/* Chat area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30" style={{ maxHeight: '400px' }}>
                                {informasi.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                                        <Icon path={icons.info} className="w-10 h-10 mb-2 opacity-40" />
                                        <p className="text-sm">Belum ada informasi.</p>
                                    </div>
                                ) : informasi.map((msg) => (
                                    <ChatBubble
                                        key={msg.id}
                                        msg={msg}
                                        isMe={msg.id_user === currentUserId || msg.role === currentUserRole && msg.pengirim === auth?.user?.nama}
                                    />
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input kirim pesan */}
                            <form
                                onSubmit={handleSubmit}
                                className="flex items-end gap-2 px-4 py-3 border-t border-gray-100 bg-white"
                            >
                                <div className="flex-1">
                                    <textarea
                                        value={data.pesan}
                                        onChange={(e) => setData('pesan', e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSubmit(e);
                                            }
                                        }}
                                        placeholder="Tulis informasi atau pesan…"
                                        rows={2}
                                        className={`w-full resize-none rounded-xl border text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${
                                            errors.pesan ? 'border-red-400 focus:ring-red-300' : 'border-gray-200'
                                        }`}
                                    />
                                    {errors.pesan && (
                                        <p className="text-xs text-red-500 mt-1">{errors.pesan}</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={processing || !data.pesan.trim()}
                                    className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Icon path={icons.send} className="w-4 h-4" />
                                    {processing ? 'Mengirim…' : 'Kirim'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}