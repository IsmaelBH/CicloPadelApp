import { addMinutes, generateStarts, overlaps } from './time';
import { Category, Court, FixedBooking, MatchDoc } from './types';

interface Params {
    date: string;                        // 'YYYY-MM-DD'
    duration: 90 | 120;
    courtId?: Court['id'];               // si no, todas
    category: Category;                  // la del usuario (filtrado visual)
    now?: Date;
}

export function computeAvailability(params: {
    date: string,
    duration: 90 | 120,
    courtIds: Court['id'][],
    matches: MatchDoc[],                 // ya filtrados por date
    fixed: FixedBooking[],               // ya filtrados por date/weekday resuelto
    now?: Date
}) {
    const { date, duration, courtIds, matches, fixed, now = new Date() } = params;
    const result: Record<Court['id'], Array<{ start: string; end: string }>> = {
        court_1: [], court_2: [], court_3: []
    };

    for (const courtId of courtIds) {
        const mOfCourt = matches.filter(m => m.courtId === courtId && m.status !== 'cancelado');
        const fOfCourt = fixed.filter(f => f.courtId === courtId);

        outer:
        for (const { start, end } of generateStarts(duration, date, now)) {
            // solape con matches
            for (const m of mOfCourt) {
                if (overlaps(start, end, m.start, m.end)) continue outer;
            }
            // solape con fixedBookings
            for (const f of fOfCourt) {
                const fEnd = addMinutes(f.start, f.duration);
                if (overlaps(start, end, f.start, fEnd)) continue outer;
            }
            result[courtId].push({ start, end });
        }
    }

    return result;
}
