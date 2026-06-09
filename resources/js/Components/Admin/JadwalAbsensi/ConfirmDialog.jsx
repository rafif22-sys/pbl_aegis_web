export function ConfirmDialog({ open, message, onConfirm, onCancel }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="px-6 py-5">
                    <p className="text-sm leading-relaxed" style={{ color: '#0F2A44' }}>
                        {message}
                    </p>
                </div>
                <div className="px-6 py-4 border-t flex justify-end gap-2"
                    style={{ borderColor: '#e0f2fe' }}>
                    <button onClick={onCancel}
                        className="px-4 py-2 text-sm rounded-xl border hover:bg-gray-50"
                        style={{ borderColor: '#c7e8f8', color: '#64748b' }}>
                        Batal
                    </button>
                    <button onClick={onConfirm}
                        className="px-4 py-2 text-sm rounded-xl font-semibold hover:opacity-90"
                        style={{ background: '#dc2626', color: 'white' }}>
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}