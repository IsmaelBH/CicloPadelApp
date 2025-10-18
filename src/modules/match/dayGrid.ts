import { addMinutes, generateStarts, overlaps } from './time';
import { Court, FixedBooking, MatchDoc } from './types';

export type SlotState = 'fixed' | 'match_open' | 'match_full' | 'free';

export interface GridItem {
    start: string;
    end: string;
    state: SlotState;
    match?: Pick<MatchDoc, 'id' | 'category' | 'status' | 'players' | 'start' | 'end'>;
    fixed?: { start: string; end: string; note?: string | null };
}

export function buildDayGrid(params: {
    date: string;
    duration: 90 | 120;
    courtIds: Court['id'][];
    matches: MatchDoc[];
    fixed: FixedBooking[];
    now?: Date;
}) {
    const { date, duration, courtIds, matches, fixed, now = new Date() } = params;

    const byCourt: Record<Court['id'], GridItem[]> = {
        court_1: [], court_2: [], court_3: [],
    };

    for (const courtId of courtIds) {
        const mOfCourt = matches.filter(m => m.courtId === courtId);
        const fOfCourt = fixed.filter(f => f.courtId === courtId);

        for (const { start, end } of generateStarts(duration, date, now)) {
            // fijo
            const fixedHit = fOfCourt.find(f => {
                const fEnd = addMinutes(f.start, f.duration);
                return overlaps(start, end, f.start, fEnd);
            });
            if (fixedHit) {
                byCourt[courtId].push({
                    start,
                    end,
                    state: 'fixed',
                    fixed: {
                        start: fixedHit.start,
                        end: addMinutes(fixedHit.start, fixedHit.duration), // <- FIX correcto
                        note: fixedHit.note ?? null,
                    },
                });
                continue;
            }

            // match
            const matchHit = mOfCourt.find(m => overlaps(start, end, m.start, m.end));
            if (matchHit) {
                byCourt[courtId].push({
                    start,
                    end,
                    state: matchHit.status === 'completa' ? 'match_full' : 'match_open',
                    match: {
                        id: matchHit.id,
                        category: matchHit.category,
                        status: matchHit.status,
                        players: Array.isArray(matchHit.players) ? matchHit.players : [],
                        start: matchHit.start,
                        end: matchHit.end,
                    },
                });
                continue;
            }

            // libre
            byCourt[courtId].push({ start, end, state: 'free' });
        }
    }

    return byCourt;
}
