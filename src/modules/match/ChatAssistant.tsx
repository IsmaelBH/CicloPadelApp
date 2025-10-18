import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList } from 'react-native';
import { MotiView } from 'moti';
import { Category } from './types';

interface ChatAssistantProps {
    visible: boolean;
    onClose: () => void;
    date: string;
    getFreeSlots: (date: string) => Array<{ courtId: string; start: string }>;
    onCreateMatch: (args: {
        date: string;
        duration: 90 | 120;
        courtId: string;
        start: string;
        category: Category | string;
    }) => void;
}

type Msg = { id: number; text: string; from: 'bot' | 'user' };

export default function ChatAssistant({
    visible,
    onClose,
    date,
    getFreeSlots,
    onCreateMatch,
}: ChatAssistantProps) {
    const [messages, setMessages] = useState<Msg[]>([]);
    const [step, setStep] = useState(0);
    const [typing, setTyping] = useState(true);

    useEffect(() => {
        if (visible) startConversation();
    }, [visible]);

    const pushBot = (text: string, delay = 1100) => {
        setTyping(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now(), text, from: 'bot' }]);
            setTyping(false);
        }, delay);
    };

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return '¡Buen día! ☀️';
        if (h < 19) return '¡Buenas tardes! 👋';
        return '¡Buenas noches! 🌙';
    };

    const startConversation = () => {
        setMessages([]);
        setStep(0);
        setTyping(true);

        pushBot(greeting(), 600);
        setTimeout(() => {
            pushBot('¿Con ganas de jugar hoy? 😎', 900);
            setStep(1);
        }, 1600);
    };

    const handleOption = (option: string) => {
        // Helper para agregar mensaje del usuario
        const pushUser = (text: string) =>
            setMessages(prev => [...prev, { id: Date.now(), text, from: 'user' }]);

        if (step === 1) {
            pushUser(option);
            pushBot('¡Genial! ¿Qué turno preferís?', 700);
            setStep(2);
            return;
        }

        if (step === 2) {
            pushUser(option);
            pushBot('Buscando horarios disponibles…');
            setTimeout(() => {
                const slots = getFreeSlots(date);
                if (slots.length === 0) {
                    pushBot('No hay horarios en ese rango. Probemos con otro turno.');
                    return;
                }
                pushBot(
                    'Encontré estos:\n' +
                    slots.map(s => `• ${labelCourt(s.courtId)} — ${s.start}`).join('\n'),
                    800
                );
                setStep(3);
            }, 1200);
            return;
        }

        if (step === 3) {
            // El usuario elige uno de los slots mostrados (por ahora free text)
            pushUser(option);
            pushBot('Perfecto. ¿En qué categoría jugás? 🎾', 700);
            setStep(4);
            return;
        }

        if (step === 4) {
            pushUser(option);
            pushBot('¡Excelente! Armando tu partido…', 700);

            // Para el demo, tomamos el primer slot disponible
            const [first] = getFreeSlots(date);
            const courtId = first?.courtId ?? 'court_1';
            const start = first?.start ?? '09:00';

            onCreateMatch({
                date,
                duration: 90,
                courtId,
                start,
                category: (option as Category) ?? '5ta',
            });

            setTimeout(() => {
                pushBot('✅ Partido creado. Te avisamos cuando se complete.');
                setTimeout(() => onClose(), 1600);
            }, 1200);
        }
    };

    if (!visible) return null;

    return (
        <View style={styles.container}>
            <FlatList
                data={messages}
                keyExtractor={item => String(item.id)}
                renderItem={({ item }) => (
                    <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 350 }}
                        style={[styles.msg, item.from === 'bot' ? styles.bot : styles.user]}
                    >
                        <Text style={item.from === 'bot' ? styles.botText : styles.userText}>{item.text}</Text>
                    </MotiView>
                )}
                contentContainerStyle={{ paddingBottom: 14 }}
            />

            {typing && (
                <View style={styles.typingRow}>
                    <Image source={require('../../../assets/icons/bot.png')} style={styles.avatar} />
                    <Text style={styles.typingText}>escribiendo…</Text>
                </View>
            )}

            <View style={styles.options}>
                {step === 1 && (
                    <>
                        <Btn label="¡Sí, claro!" onPress={() => handleOption('¡Sí, claro!')} />
                        <BtnOutline label="Más tarde" onPress={onClose} />
                    </>
                )}

                {step === 2 && (
                    <>
                        <Btn label="Mañana" onPress={() => handleOption('Turno mañana')} />
                        <Btn label="Tarde" onPress={() => handleOption('Turno tarde')} />
                        <Btn label="Noche" onPress={() => handleOption('Turno noche')} />
                    </>
                )}

                {step === 4 && (
                    <>
                        <Btn label="6ta" onPress={() => handleOption('6ta')} />
                        <Btn label="5ta" onPress={() => handleOption('5ta')} />
                        <Btn label="4ta" onPress={() => handleOption('4ta')} />
                    </>
                )}
            </View>
        </View>
    );
}

const Btn = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
        <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
);

const BtnOutline = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.btnOutline} onPress={onPress}>
        <Text style={styles.btnOutlineText}>{label}</Text>
    </TouchableOpacity>
);

const labelCourt = (id: string) =>
    id === 'court_1' ? 'Cancha 1' : id === 'court_2' ? 'Cancha 2' : 'Cancha 3';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B0B', padding: 16 },
    msg: { marginVertical: 6, padding: 12, borderRadius: 12, maxWidth: '85%' },
    bot: { backgroundColor: '#1E88E5', alignSelf: 'flex-start' },
    user: { backgroundColor: '#E0E0E0', alignSelf: 'flex-end' },
    botText: { color: '#fff' },
    userText: { color: '#000' },
    typingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    avatar: { width: 28, height: 28, marginRight: 8 },
    typingText: { color: '#9AA3AF' },
    options: { marginTop: 12 },
    btn: {
        backgroundColor: '#1E88E5',
        padding: 12,
        borderRadius: 10,
        marginBottom: 8,
    },
    btnText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
    btnOutline: {
        borderWidth: 1,
        borderColor: '#1E88E5',
        padding: 12,
        borderRadius: 10,
        marginBottom: 8,
    },
    btnOutlineText: { color: '#1E88E5', textAlign: 'center', fontWeight: '700' },
});
