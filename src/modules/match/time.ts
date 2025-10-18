export const DAY_OPEN = '09:00';
export const DAY_CLOSE = '23:00';
export const LEAD_MINUTES = 30; // hoy, no ofrecer inicios antes de +30'
export type Duration = 90 | 120;

const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
};
const toHHMM = (mins: number) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
};

export function addMinutes(hhmm: string, minutes: number) {
    return toHHMM(toMinutes(hhmm) + minutes);
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
    const aS = toMinutes(aStart), aE = toMinutes(aEnd);
    const bS = toMinutes(bStart), bE = toMinutes(bEnd);
    return aS < bE && aE > bS;
}

export function* generateStarts(duration: Duration, dateISO: string, now: Date) {
    const open = toMinutes(DAY_OPEN);
    const close = toMinutes(DAY_CLOSE);
    const step = 30;

    const isToday = new Date().toISOString().slice(0, 10) === dateISO;
    const leadCut = isToday
        ? Math.ceil((now.getHours() * 60 + now.getMinutes() + LEAD_MINUTES) / step) * step
        : open;

    for (let start = Math.max(open, leadCut); start <= close - duration; start += step) {
        const s = toHHMM(start);
        const e = toHHMM(start + duration);
        if (toMinutes(e) > close) continue;
        yield { start: s, end: e };
    }
}
