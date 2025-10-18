import React, { useState } from 'react';
import { Alert, StatusBar, View, Share, TouchableOpacity, Text, StyleSheet } from 'react-native';
import ChatAssistant from '../modules/match/ChatAssistant';
import { createMatchAtomic } from '../modules/match/api';

export default function MatchScreen() {
    const [chatOpen, setChatOpen] = useState(true);
    const [date] = useState<string>(new Date().toISOString().split('T')[0]);

    // guardamos el último partido creado para invitar
    const [lastMatch, setLastMatch] = useState<{
        id: string;
        hour: string;
        category: '6ta' | '5ta' | '4ta';
        courtId: 'court_1' | 'court_2' | 'court_3';
    } | null>(null);

    const handleAssistantConfirm = async (payload: {
        turn: 'mañana' | 'tarde' | 'noche';
        hour: string;
        duration: 90 | 120;
        category: '6ta' | '5ta' | '4ta';
        courtId: 'court_1' | 'court_2' | 'court_3';
    }) => {
        try {
            const user = { uid: 'demo', name: 'Ismael', photoUrl: null };
            const res = await createMatchAtomic({
                date,
                courtId: payload.courtId,
                start: payload.hour,
                duration: payload.duration,
                category: payload.category,
                creator: user,
            });

            setChatOpen(false);
            setLastMatch({
                id: res.matchId,
                hour: payload.hour,
                category: payload.category,
                courtId: payload.courtId,
            });

            Alert.alert('Listo ✅', `Partido creado en ${payload.courtId} a las ${payload.hour} (${payload.category}).`);
        } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'No se pudo crear el partido');
        }
    };

    const invite = async () => {
        if (!lastMatch) return;
        const courtLabel =
            lastMatch.courtId === 'court_1' ? 'Cancha 1' :
                lastMatch.courtId === 'court_2' ? 'Cancha 2' : 'Cancha 3';

        await Share.share({
            message:
                `¡Te invito a jugar pádel en Ciclo!\n` +
                `Fecha: ${date}\nHora: ${lastMatch.hour}\nCategoría: ${lastMatch.category}\n${courtLabel}\n\n` +
                `Código del partido: ${lastMatch.id}`,
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar barStyle="light-content" />
            <ChatAssistant
                visible={chatOpen}
                onClose={() => setChatOpen(false)}
                date={date}
                onConfirm={handleAssistantConfirm}
            />

            {lastMatch && (
                <TouchableOpacity style={styles.inviteFab} onPress={invite}>
                    <Text style={styles.inviteFabText}>Invitar</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    inviteFab: {
        position: 'absolute',
        right: 18,
        bottom: 28,
        backgroundColor: '#3FA7FF',
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 18,
        elevation: 6,
    },
    inviteFabText: { color: '#0B1118', fontWeight: '800' },
});

