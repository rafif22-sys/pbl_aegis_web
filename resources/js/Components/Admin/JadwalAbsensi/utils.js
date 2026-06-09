import { MONTHS } from './constants';

export function getWeekDates(startOfWeek) {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        return d;
    });
}

export function toDateStr(d) {
    return d.toISOString().split('T')[0];
}

export function isToday(dateStr) {
    const t = new Date(), d = new Date(dateStr);
    return d.getDate()     === t.getDate()
        && d.getMonth()    === t.getMonth()
        && d.getFullYear() === t.getFullYear();
}

export function formatWeekRange(startOfWeek, endOfWeek) {
    const s = new Date(startOfWeek), e = new Date(endOfWeek);
    return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

export function shiftKey(nama) {
    const n = (nama || '').toLowerCase();
    if (n.includes('pagi'))  return 'pagi';
    if (n.includes('siang')) return 'siang';
    return 'malam';
}