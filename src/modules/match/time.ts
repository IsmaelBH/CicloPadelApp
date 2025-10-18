// src/modules/match/time.ts
export const DAY_OPEN = '09:00';
export const DAY_CLOSE = '23:00';
export const LEAD_MINUTES = 30;
export type Duration = 90 | 120;

export type Shift = 'mañana' | 'tarde' | 'noche';

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

export function getShiftRange(shift: Shift): { start: string; end: string } {
    if (shift === 'mañana') return { start: '09:00', end: '12:00' };
    if (shift === 'tarde') return { start: '12:00', end: '18:00' };
    return { start: '18:00', end: '23:00' }; // noche
}

export function* generateStarts(duration: Duration, dateISO: string, now: Date) {
    const open = toMinutes(DAY_OPEN);
    const close = toMinutes(DAY_CLOSE);
    const step = 30; // minutos

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

export function* generateStartsByShift(
    duration: Duration,
    dateISO: string,
    now: Date,
    shift: Shift
) {
    const { start, end } = getShiftRange(shift);
    const sMin = toMinutes(start);
    const eMin = toMinutes(end);

    const base = Array.from(generateStarts(duration, dateISO, now));
    for (const it of base) {
        const st = toMinutes(it.start);
        const en = toMinutes(it.end);
        if (st >= sMin && en <= eMin) yield it;
    }
}
