// src/modules/match/availability.ts
export type Turn = 'mañana' | 'tarde' | 'noche';

type Slot = { start: string; end: string };

const TURN_WINDOWS: Record<Turn, Slot> = {
    mañana: { start: '09:00', end: '12:00' },
    tarde: { start: '12:00', end: '18:00' },
    noche: { start: '18:00', end: '23:00' },
};

// Dada una hora "HH:mm", devuelve el turno correspondiente
export function getTurnFromHour(hour: string): Turn {
    const [h, m] = hour.split(':').map(Number);
    const mins = h * 60 + m;
    const inRange = (a: string, b: string) => {
        const [ah, am] = a.split(':').map(Number);
        const [bh, bm] = b.split(':').map(Number);
        const A = ah * 60 + am;
        const B = bh * 60 + bm;
        return mins >= A && mins < B;
    };
    if (inRange('09:00', '12:00')) return 'mañana';
    if (inRange('12:00', '18:00')) return 'tarde';
    return 'noche';
}

/**
 * Genera horas cada 30' dentro del turno elegido.
 * - Filtra horas pasadas si `date` es hoy
 * - Aplica anticipo mínimo de 30 minutos
 */
export function listTurnHours(
    turn: Turn,
    date: string,
    now: Date = new Date()
): string[] {
    const { start, end } = TURN_WINDOWS[turn];

    const toMin = (hhmm: string) => {
        const [h, m] = hhmm.split(':').map(Number);
        return h * 60 + m;
    };
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fromMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

    const startMin = toMin(start);
    const endMin = toMin(end);

    // si es hoy, filtramos lo pasado con 30' de anticipo
    const isSameDate =
        new Date(date).toISOString().slice(0, 10) ===
        new Date(now).toISOString().slice(0, 10);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const minAllowed = isSameDate ? nowMin + 30 : -Infinity;

    const slots: string[] = [];
    for (let m = startMin; m < endMin; m += 30) {
        if (m >= minAllowed) slots.push(fromMin(m));
    }
    return slots;
}
