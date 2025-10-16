export type Category = '6ta' | '5ta' | '4ta';

export interface Court {
    id: 'court_1' | 'court_2' | 'court_3';
    name: string;
    active: boolean;
}

export interface FixedBooking {
    id: string;
    courtId: Court['id'];
    // uno u otro:
    weekday?: number | null; // 0..6
    date?: string | null;    // 'YYYY-MM-DD'
    start: string;           // 'HH:mm'
    duration: 90 | 120;
    note?: string | null;
    category?: Category | null;
}

export interface MatchPlayer {
    uid: string;
    name: string;
    photoUrl?: string | null;
    joinedAt: number; // unix
}

export interface MatchDoc {
    id: string;
    date: string;                 // 'YYYY-MM-DD'
    courtId: Court['id'];
    start: string;                // 'HH:mm'
    end: string;                  // 'HH:mm'
    duration: 90 | 120;
    category: Category;
    status: 'en_formacion' | 'completa' | 'cancelado';
    players: MatchPlayer[];
    createdBy: string;
    createdAt: number;            // unix
}
