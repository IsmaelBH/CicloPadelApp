// modules/match/api.ts
import {
    collection, doc, getDocs, query,
    runTransaction,
    where,
} from 'firebase/firestore';
import { db } from '../../src/firebase/firebase';
import { addMinutes, overlaps } from './time';
import { Category, Court, FixedBooking, MatchDoc } from './types';

// ✅ EXPORTAR si lo necesitás en otros lados
export async function fetchDayMatches(date: string): Promise<MatchDoc[]> {
    const q = query(collection(db, 'matches'), where('date', '==', date));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as MatchDoc[];
}

// ✅ EXPORTAR (lo pedís en MatchScreen)
export async function fetchDayFixed(date: string): Promise<FixedBooking[]> {
    const weekday = new Date(date).getDay();
    const res: FixedBooking[] = [];

    const q1 = query(collection(db, 'fixedBookings'), where('weekday', '==', weekday));
    (await getDocs(q1)).forEach(d => res.push({ id: d.id, ...(d.data() as any) }));

    const q2 = query(collection(db, 'fixedBookings'), where('date', '==', date));
    (await getDocs(q2)).forEach(d => res.push({ id: d.id, ...(d.data() as any) }));

    return res;
}

// (lo demás igual)
export async function createMatchAtomic(params: {
    date: string,
    courtId: Court['id'],
    start: string,
    duration: 90 | 120,
    category: Category,
    creator: { uid: string; name: string; photoUrl?: string | null }
}) {
    const { date, courtId, start, duration, category, creator } = params;
    const end = addMinutes(start, duration);

    return runTransaction(db, async (tx) => {
        const [matches, fixed] = await Promise.all([
            fetchDayMatches(date),
            fetchDayFixed(date),
        ]);

        for (const m of matches.filter(m => m.courtId === courtId && m.status !== 'cancelado')) {
            if (overlaps(start, end, m.start, m.end)) throw new Error('Horario ocupado en esta cancha.');
        }
        for (const f of fixed.filter(f => f.courtId === courtId)) {
            const fEnd = addMinutes(f.start, f.duration);
            if (overlaps(start, end, f.start, fEnd)) throw new Error('Horario fijo ocupa este rango.');
        }

        const ref = doc(collection(db, 'matches'));
        const match: MatchDoc = {
            id: ref.id,
            date, courtId, start, end, duration,
            category,
            status: 'en_formacion',
            players: [{
                uid: creator.uid,
                name: creator.name,
                photoUrl: creator.photoUrl ?? null,
                joinedAt: Math.floor(Date.now() / 1000),
            }],
            createdBy: creator.uid,
            createdAt: Date.now(),
        };
        tx.set(ref, match);
        return { ok: true, matchId: ref.id };
    });
}
