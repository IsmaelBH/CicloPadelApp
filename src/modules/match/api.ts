// src/modules/match/api.ts
import { db } from '../../firebase/firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    query,
    runTransaction,
    where,
    orderBy,
} from 'firebase/firestore';
import { addMinutes, overlaps } from './time';
import { Category, Court, FixedBooking, MatchDoc } from './types';

// ---- Lectura: matches del día ----
export async function fetchDayMatches(date: string): Promise<MatchDoc[]> {
    const qy = query(
        collection(db, 'matches'),
        where('date', '==', date)
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as MatchDoc[];
}

// ---- Lectura: fijos aplicables (por weekday y date exacta) ----
export async function fetchDayFixed(date: string): Promise<FixedBooking[]> {
    const weekday = new Date(date).getDay();
    const res: FixedBooking[] = [];

    const q1 = query(collection(db, 'fixedBookings'), where('weekday', '==', weekday));
    (await getDocs(q1)).forEach(d => res.push({ id: d.id, ...(d.data() as any) }));

    const q2 = query(collection(db, 'fixedBookings'), where('date', '==', date));
    (await getDocs(q2)).forEach(d => res.push({ id: d.id, ...(d.data() as any) }));

    return res;
}

// ---- Crear partido (atomic) ----
export async function createMatchAtomic(params: {
    date: string;
    courtId: Court['id'];
    start: string;
    duration: 90 | 120;
    category: Category;
    creator: { uid: string; name: string; photoUrl?: string | null };
}) {
    const { date, courtId, start, duration, category, creator } = params;
    const end = addMinutes(start, duration);

    return runTransaction(db, async (tx) => {
        const [matches, fixed] = await Promise.all([
            fetchDayMatches(date),
            fetchDayFixed(date),
        ]);

        for (const m of matches.filter(m => m.courtId === courtId && m.status !== 'cancelado')) {
            if (overlaps(start, end, m.start, m.end)) {
                throw new Error('Horario ocupado en esta cancha.');
            }
        }
        for (const f of fixed.filter(f => f.courtId === courtId)) {
            const fEnd = addMinutes(f.start, f.duration);
            if (overlaps(start, end, f.start, fEnd)) {
                throw new Error('Horario fijo ocupa este rango.');
            }
        }

        const ref = doc(collection(db, 'matches'));
        const match: MatchDoc = {
            id: ref.id,
            date,
            courtId,
            start,
            end,
            duration,
            category,
            status: 'en_formacion',
            players: [
                {
                    uid: creator.uid,
                    name: creator.name,
                    photoUrl: creator.photoUrl ?? null,
                    joinedAt: Math.floor(Date.now() / 1000),
                },
            ],
            createdBy: creator.uid,
            createdAt: Date.now(),
        };

        tx.set(ref, match);
        return { ok: true, matchId: ref.id };
    });
}

// ---- Unirse a partido (atomic, tope 4) ----
export async function joinMatchAtomic(params: {
    matchId: string;
    user: { uid: string; name: string; photoUrl?: string | null; category: Category };
}) {
    const { matchId, user } = params;

    return runTransaction(db, async (tx) => {
        const mRef = doc(db, 'matches', matchId);
        const snap = await tx.get(mRef);
        if (!snap.exists()) throw new Error('Match no encontrado');
        const m = snap.data() as MatchDoc;

        const players = Array.isArray(m.players) ? [...m.players] : [];

        if (m.category !== user.category) throw new Error('Categoría distinta al partido.');
        if (m.status === 'completa') throw new Error('El partido ya está completo.');
        if (players.find(p => p.uid === user.uid)) {
            return { ok: true, matchId, status: m.status };
        }
        if (players.length >= 4) throw new Error('El partido ya está completo.');

        players.push({
            uid: user.uid,
            name: user.name,
            photoUrl: user.photoUrl ?? null,
            joinedAt: Math.floor(Date.now() / 1000),
        });

        const status = players.length >= 4 ? 'completa' : 'en_formacion';
        tx.update(mRef, { players, status });

        return { ok: true, matchId, status };
    });
}

// ---- Buscar partido por código (id) ----
export async function getMatchByCode(matchId: string): Promise<MatchDoc | null> {
    if (!matchId) return null;
    const ref = doc(db, 'matches', matchId.trim());
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as any) } as MatchDoc;
}

// ---- Listar partidos abiertos (en formación) ----
export async function fetchOpenMatches(options?: {
    date?: string; // si no viene, trae de hoy en adelante (simple)
}) {
    // Para simplificar, si viene date filtramos; si no, devolvemos todos "en_formacion"
    const base = collection(db, 'matches');
    const qy = options?.date
        ? query(base, where('date', '==', options.date), where('status', '==', 'en_formacion'), orderBy('start', 'asc'))
        : query(base, where('status', '==', 'en_formacion'));

    const snap = await getDocs(qy);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as MatchDoc[];
}
