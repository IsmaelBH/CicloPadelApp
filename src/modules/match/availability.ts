// src/modules/match/availability.ts
import { addMinutes, overlaps } from './time';
import { Category, FixedBooking, MatchDoc } from './types';
import { fetchDayFixed, fetchDayMatches } from './api';

type Turn = 'mañana' | 'tarde' | 'noche';
type CourtId = 'court_1' | 'court_2' | 'court_3';

const TURN_RANGES: Record<Turn, { start: string; end: string }> = {
    mañana: { start: '09:00', end: '12:00' },
    tarde: { start: '12:00', end: '18:00' },
    noche: { start: '18:00', end: '23:00' },
};

function toMins(hhmm: string) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}
function toHHMM(mins: number) {
    const h = String(Math.floor(mins / 60)).padStart(2, '0');
    const m = String(mins % 60).padStart(2, '0');
    return `${h}:${m}`;
}

function generateStartsInRange(rangeStart: string, rangeEnd: string, duration: 90 | 120) {
    const step = 30; // cada media hora
    const out: Array<{ start: string; end: string }> = [];
    for (let t = toMins(rangeStart); t + duration <= toMins(rangeEnd); t += step) {
        const start = toHHMM(t);
        const end = toHHMM(t + duration);
        out.push({ start, end });
    }
    return out;
}

export async function getFreeHoursByTurn(params: {
    date: string;
    duration: 90 | 120;
    turn: Turn;
    category?: Category; // por si luego querés filtrar por categoría
}) {
    const { date, duration, turn } = params;

    const [matches, fixed] = await Promise.all([
        fetchDayMatches(date),
        fetchDayFixed(date),
    ]);

    // Pre-indexado por cancha
    const byCourt: Record<CourtId, { matches: MatchDoc[]; fixed: FixedBooking[] }> = {
        court_1: { matches: [], fixed: [] },
        court_2: { matches: [], fixed: [] },
        court_3: { matches: [], fixed: [] },
    };

    for (const m of matches) byCourt[m.courtId].matches.push(m);
    for (const f of fixed) byCourt[f.courtId].fixed.push(f);

    const range = TURN_RANGES[turn];

    // Por cada cancha verificamos qué inicios están libres; devolvemos tuplas (courtId, start)
    const options: Array<{ courtId: CourtId; start: string; end: string }> = [];

    (Object.keys(byCourt) as CourtId[]).forEach((courtId) => {
        const starts = generateStartsInRange(range.start, range.end, duration);

        starts.forEach(({ start, end }) => {
            // check fijos
            const hitFixed = byCourt[courtId].fixed.some((f) => {
                const fEnd = addMinutes(f.start, f.duration);
                return overlaps(start, end, f.start, fEnd);
            });
            if (hitFixed) return;

            // check matches (no cancelados)
            const hitMatch = byCourt[courtId].matches.some((m) => {
                if (m.status === 'cancelado') return false;
                return overlaps(start, end, m.start, m.end);
            });
            if (hitMatch) return;

            options.push({ courtId, start, end });
        });
    });

    return options.sort((a, b) => a.start.localeCompare(b.start));
}

