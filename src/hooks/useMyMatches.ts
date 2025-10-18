// src/hooks/useMyMatches.ts
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { MatchDoc } from '../modules/match/types';

export function useMyMatches(uid: string) {
    const [items, setItems] = useState<MatchDoc[]>([]);
    useEffect(() => {
        const qy = query(collection(db, 'matches'), where('playersUids', 'array-contains', uid));
        const unsub = onSnapshot(qy, (snap) => {
            const rows = snap.docs.map((d) => d.data() as any as MatchDoc);
            setItems(rows);
        });
        return () => unsub();
    }, [uid]);
    return items;
}