import { db } from '@/src/firebase/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { MatchDoc } from './types';

export function useDayMatches(date: string) {
    const [items, setItems] = useState<MatchDoc[]>([]);
    useEffect(() => {
        const qy = query(collection(db, 'matches'), where('date', '==', date));
        const unsub = onSnapshot(qy, snap => {
            setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
        });
        return () => unsub();
    }, [date]);
    return items;
}
