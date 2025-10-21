// src/modules/match/time.ts
export const DAY_OPEN = '09:00';
export const DAY_CLOSE = '23:00';
export const LEAD_MINUTES = 30;

export type Duration = 90 | 120;
export type Turno = 'mañana' | 'tarde' | 'noche';

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

export function getTurnRange(turno: Turno) {
    // Mañana: 09–12 | Tarde: 12–18 | Noche: 18–23
    if (turno === 'mañana') return { from: '09:00', to: '12:00' };
    if (turno === 'tarde') return { from: '12:00', to: '18:00' };
    return { from: '18:00', to: '23:00' };
}

/**
 * Genera posibles inicios cada 30' DENTRO del turno pedido,
 * respetando horario de hoy con 30' de anticipación.
 */
export function* generateStartsForTurn(
    duration: Duration,
    dateISO: string,
    now: Date,
    turno: Turno
) {
    const step = 30; // minutos
    const { from, to } = getTurnRange(turno);
    const open = toMinutes(from);
    const close = toMinutes(to);

    const isToday = new Date().toISOString().slice(0, 10) === dateISO;
    const nowCut = isToday
        ? Math.ceil((now.getHours() * 60 + now.getMinutes() + LEAD_MINUTES) / step) * step
        : open;

    for (let start = Math.max(open, nowCut); start <= close - duration; start += step) {
        const s = toHHMM(start);
        const e = toHHMM(start + duration);
        if (toMinutes(e) > close) continue;
        yield { start: s, end: e };
    }
}

