import React, { useEffect, useState } from 'react';
import {
    Alert,
    StatusBar,
    View,
    Share,
    TouchableOpacity,
    Text,
    StyleSheet,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import ChatAssistant from '../modules/match/ChatAssistant';
import { createMatchAtomic } from '../modules/match/api';

type RouteParams = { code?: string };

export default function MatchScreen() {
    const route = useRoute<any>();
    const deeplinkCode: string | undefined = (route.params as RouteParams)?.code;

    const [chatOpen, setChatOpen] = useState(true);
    const [date] = useState<string>(new Date().toISOString().split('T')[0]);

    // último partido creado para invitar
    const [lastMatch, setLastMatch] = useState<{
        id: string;
        hour: string;
        category: '6ta' | '5ta' | '4ta';
        courtId: 'court_1' | 'court_2' | 'court_3';
    } | null>(null);

    useEffect(() => {
        if (deeplinkCode) setChatOpen(true);
    }, [deeplinkCode]);

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

            Alert.alert(
                'Listo ✅',
                `Partido creado en ${payload.courtId} a las ${payload.hour} (${payload.category}).`
            );
        } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'No se pudo crear el partido');
        }
    };

    const invite = async () => {
        if (!lastMatch) return;

        const courtLabel =
            lastMatch.courtId === 'court_1'
                ? 'Cancha 1'
                : lastMatch.courtId === 'court_2'
                    ? 'Cancha 2'
                    : 'Cancha 3';

        // subrayar el código
        const underlinedCode = lastMatch.id.split('').join('\u0332');

        // deep link directo que abre el Match con ese código
        const deepLink = `ciclopadel://match/${lastMatch.id}`;

        await Share.share({
            message:
                `¡Te invito a jugar pádel en Ciclo!\n\n` +
                `📅 Fecha: ${date}\n🕒 Hora: ${lastMatch.hour}\n🎾 Categoría: ${lastMatch.category}\n📍 ${courtLabel}\n\n` +
                `🔑 Código del partido: ${underlinedCode}\n` +
                `${deepLink}\n\n` +
                `Abrí la app y usá el link o el código para unirte.`,
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
                initialCode={deeplinkCode || undefined} // <- el chat arranca con “unirse por código”
            />

            {lastMatch && (
                <TouchableOpacity style={styles.inviteFab} onPress={invite}>
                    <Text style={styles.inviteFabText}>🔑 Invitar</Text>
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
        backgroundColor: '#FFD700', // “llave amarilla”
        borderRadius: 30,
        paddingVertical: 12,
        paddingHorizontal: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    inviteFabText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 16,
    },
});
