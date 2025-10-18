import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

// UI (chat)
import ChatAssistant from '../modules/match/ChatAssistant';

// Lógica de match
import { createMatchAtomic } from '../modules/match/api';
import { Category } from '../modules/match/types';

export default function MatchScreen() {
    const [date] = useState<string>(new Date().toISOString().split('T')[0]);
    const [chatOpen, setChatOpen] = useState(true); // 👉 el bot abre de una

    // Simulá slots libres por ahora
    const getFreeSlots = (d: string) => [
        { courtId: 'court_1', start: '09:00' },
        { courtId: 'court_2', start: '10:30' },
        { courtId: 'court_3', start: '12:00' },
    ];

    // 👉 Handler que ahora incluye "creator" (obligatorio para createMatchAtomic)
    const handleCreateMatch = async (args: {
        date: string;
        duration: 90 | 120;
        courtId: string;
        start: string;
        category: Category | string;
    }) => {
        try {
            // TODO: si tenés auth, reemplazá este objeto por el usuario real
            const creator = {
                uid: 'demo-uid',
                name: 'Jugador Demo',
                photoUrl: null as string | null,
            };

            await createMatchAtomic({
                date: args.date,
                duration: args.duration,
                courtId: args.courtId as any,
                start: args.start,
                category: (args.category as Category) ?? '5ta',
                creator,
            });

            console.log('✅ Partido creado:', args);
        } catch (err) {
            console.error('❌ Error creando partido', err);
        }
    };

    return (
        <View style={styles.container}>
            <ChatAssistant
                visible={chatOpen}
                onClose={() => setChatOpen(false)}
                date={date}
                getFreeSlots={getFreeSlots}
                onCreateMatch={handleCreateMatch}
            />

            {/* Cuando cierres el chat, acá irá tu grilla real */}
            {!chatOpen && <View style={{ flex: 1, backgroundColor: '#111' }} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B0B' },
});
