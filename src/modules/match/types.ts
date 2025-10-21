// src/types.ts

// --- Dominio base ---
export type Category = '6ta' | '5ta' | '4ta';
export type Turn = 'mañana' | 'tarde' | 'noche';

export interface Court {
    id: 'court_1' | 'court_2' | 'court_3';
    name: string;
    active: boolean;
}

export interface FixedBooking {
    id: string;
    courtId: Court['id'];
    weekday?: number | null;   // 0..6
    date?: string | null;      // 'YYYY-MM-DD'
    start: string;             // 'HH:mm'
    duration: 90 | 120;
    note?: string | null;
    category?: Category | null;
}

export interface MatchPlayer {
    uid: string;
    name: string;
    photoUrl?: string | null;
    joinedAt: number;          // unix seconds
}

export interface MatchDoc {
    id: string;
    date: string;              // 'YYYY-MM-DD'
    courtId: Court['id'];
    start: string;             // 'HH:mm'
    end: string;               // 'HH:mm'
    duration: 90 | 120;
    category: Category;
    status: 'en_formacion' | 'completa' | 'cancelado';
    players: MatchPlayer[];
    createdBy: string;
    createdAt: number;
}

// --- Tipos auxiliares para UI / Assistant ---

// Slot horario calculado por availability (para pintar la lista de horas)
export type HourSlot = {
    label: string;             // ej. "09:00"
    value: string;             // ej. "09:00"
    disabled?: boolean;
    reason?: string;
};

// Payload que devuelve el ChatAssistant al confirmar la reserva
export interface AssistantConfirmPayload {
    turn: Turn;
    hour: string;              // 'HH:mm'
    duration: 90 | 120;
    category: Category;
    courtId: Court['id'];
}

// Estructura de partido "abierto" para listados (join por código / abiertos)
export interface OpenMatchSummary {
    id: string;
    date: string;              // 'YYYY-MM-DD'
    hour: string;              // 'HH:mm' (alias de start)
    category: Category;
    courtId: Court['id'];
    playersCount: number;      // 0..4
    status: 'en_formacion' | 'completa';
}

// --- Tipos de payload para API (create / join) ---

export interface CreateMatchPayload {
    date: string;
    courtId: Court['id'];
    start: string;             // 'HH:mm'
    duration: 90 | 120;
    category: Category;
    creator: { uid: string; name: string; photoUrl?: string | null };
}

export interface JoinMatchPayload {
    matchId: string;
    user: { uid: string; name: string; photoUrl?: string | null; category: Category };
}
