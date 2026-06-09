import { STATUS_STYLE } from './constants';

export function StatusBadge({ status }) {
    const s = STATUS_STYLE[status] ?? STATUS_STYLE.menunggu;
    return (
        <span
            className="inline-block text-[9px] font-medium px-1.5 py-0 rounded-full border"
            style={{ background: s.bg, borderColor: s.border, color: s.text }}
        >
            {(status ?? 'menunggu').replace('_', ' ')}
        </span>
    );
}