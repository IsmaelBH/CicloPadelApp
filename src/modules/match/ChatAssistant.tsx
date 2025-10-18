// src/modules/match/ChatAssistant.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
    Modal, View, Text, TouchableOpacity, ScrollView,
    StyleSheet, Image, Animated, Easing, Platform, StatusBar
} from 'react-native';
import { Category } from './types';
import { getFreeHoursByTurn } from './availability';

type Turn = 'mañana' | 'tarde' | 'noche';
type CourtId = 'court_1' | 'court_2' | 'court_3';

type Props = {
    visible: boolean;
    onClose: () => void;
    date: string;
    // Ya no pedimos la duración aquí; el usuario la elige en el chat
    onConfirm: (payload: {
        turn: Turn;
        hour: string;
        duration: 90 | 120;
        category: Category;
        courtId: CourtId;
    }) => void;
};

export default function ChatAssistant({ visible, onClose, date, onConfirm }: Props) {
    const [step, setStep] =
        useState<'intro' | 'turn' | 'duration' | 'hour' | 'category' | 'court' | 'summary'>('intro');

    const [turn, setTurn] = useState<Turn | null>(null);
    const [duration, setDuration] = useState<90 | 120 | null>(null);
    const [hour, setHour] = useState<string | null>(null);
    const [category, setCategory] = useState<Category | null>(null);
    const [court, setCourt] = useState<CourtId | null>(null);

    const [loadingHours, setLoadingHours] = useState(false);
    const [freeOptions, setFreeOptions] =
        useState<Array<{ courtId: CourtId; start: string; end: string }>>([]);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            fadeAnim.setValue(0);
            setStep('intro');
            setTurn(null);
            setDuration(null);
            setHour(null);
            setCategory(null);
            setCourt(null);
            setFreeOptions([]);

            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 280,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [visible, fadeAnim]);

    // cada vez que tenemos turn + duration, cargamos horas libres reales
    useEffect(() => {
        (async () => {
            if (!turn || !duration) return;
            setLoadingHours(true);
            try {
                const opts = await getFreeHoursByTurn({ date, duration, turn });
                setFreeOptions(opts);
            } finally {
                setLoadingHours(false);
            }
        })();
    }, [date, turn, duration]);

    const headerTopPadding = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

    const handleConfirm = () => {
        if (turn && hour && duration && category && court) {
            Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true })
                .start(() => {
                    onConfirm({ turn, hour, duration, category, courtId: court });
                });
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'intro':
                return (
                    <View style={s.messageContainer}>
                        <Text style={s.bot}>Ciclo Asistente 🤖</Text>
                        <Text style={s.msg}>¡Buen día! ¿Con ganas de jugar?</Text>
                        <View style={s.btnRow}>
                            <TouchableOpacity style={s.chip} onPress={() => setStep('turn')}>
                                <Text style={s.chipText}>Sí, claro</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.chipSecondary}
                                onPress={() => Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(onClose)}>
                                <Text style={s.chipText}>No por ahora</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 'turn':
                return (
                    <View style={s.messageContainer}>
                        <Text style={s.bot}>Genial 😎</Text>
                        <Text style={s.msg}>¿Qué turno preferís?</Text>
                        <View style={s.btnRow}>
                            {(['mañana', 'tarde', 'noche'] as Turn[]).map((t) => (
                                <TouchableOpacity key={t} style={s.chip} onPress={() => { setTurn(t); setStep('duration'); }}>
                                    <Text style={s.chipText}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 'duration':
                return (
                    <View style={s.messageContainer}>
                        <Text style={s.bot}>Turno: {turn}</Text>
                        <Text style={s.msg}>Elegí la duración</Text>
                        <View style={s.btnRow}>
                            {[90, 120].map((d) => (
                                <TouchableOpacity key={d} style={s.chip}
                                    onPress={() => { setDuration(d as 90 | 120); setStep('hour'); }}>
                                    <Text style={s.chipText}>{d} min</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 'hour':
                return (
                    <View style={s.messageContainer}>
                        <Text style={s.bot}>Duración: {duration} min</Text>
                        <Text style={s.msg}>Elegí la hora libre:</Text>

                        {loadingHours ? (
                            <Text style={[s.msg, { opacity: 0.7 }]}>Buscando disponibilidad…</Text>
                        ) : freeOptions.length === 0 ? (
                            <Text style={s.msg}>No hay horarios libres en este turno.</Text>
                        ) : (
                            <ScrollView style={{ maxHeight: 260 }}>
                                {freeOptions.map((opt) => (
                                    <TouchableOpacity key={`${opt.courtId}-${opt.start}`} style={s.option}
                                        onPress={() => { setHour(opt.start); setCourt(opt.courtId); setStep('category'); }}>
                                        <Text style={s.optionText}>
                                            {opt.start} • {String(opt.courtId).replace('_', ' ').toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                );

            case 'category':
                return (
                    <View style={s.messageContainer}>
                        <Text style={s.bot}>Hora: {hour} • {String(court).replace('_', ' ').toUpperCase()}</Text>
                        <Text style={s.msg}>¿En qué categoría jugás?</Text>
                        <View style={s.btnRow}>
                            {(['6ta', '5ta', '4ta'] as Category[]).map((c) => (
                                <TouchableOpacity key={c} style={s.chip} onPress={() => { setCategory(c); setStep('summary'); }}>
                                    <Text style={s.chipText}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 'summary':
                return (
                    <View style={s.messageContainer}>
                        <Text style={s.bot}>Confirmemos 🎾</Text>
                        <Text style={s.msg}>
                            {`Fecha: ${date}\nTurno: ${turn}\nHora: ${hour}\nDuración: ${duration} min\nCategoría: ${category}\nCancha: ${court}`}
                        </Text>
                        <View style={s.btnRow}>
                            <TouchableOpacity style={s.chip} onPress={handleConfirm}>
                                <Text style={s.chipText}>Confirmar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.chipSecondary} onPress={() => setStep('hour')}>
                                <Text style={s.chipText}>Cambiar hora</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
        }
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
                <View style={[s.card, { paddingTop: 16 + (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0) }]}>
                    <View style={s.header}>
                        <Image source={require('../../../assets/icons/bot.png')} style={s.avatar} />
                        <View>
                            <Text style={s.title}>Ciclo Asistente</Text>
                            <Text style={s.subtitle}>Te ayuda a armar tu partido</Text>
                        </View>
                    </View>
                    <View style={s.divider} />
                    <ScrollView style={{ flex: 1 }}>{renderStep()}</ScrollView>
                </View>
            </Animated.View>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center' },
    card: { width: '92%', height: '86%', backgroundColor: '#101010', borderRadius: 20, paddingHorizontal: 18, paddingBottom: 18, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    avatar: { width: 44, height: 44, marginRight: 10 },
    title: { fontSize: 18, fontWeight: '800', color: '#fff' },
    subtitle: { fontSize: 13, color: '#A7B0BA' },
    divider: { height: 1, backgroundColor: '#242424', marginVertical: 8 },

    messageContainer: { marginVertical: 10 },
    bot: { color: '#3FA7FF', fontWeight: 'bold', marginBottom: 5 },
    msg: { color: '#fff', marginBottom: 10, fontSize: 15 },

    btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { backgroundColor: '#3FA7FF', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, margin: 4 },
    chipSecondary: { backgroundColor: '#1F1F1F', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, margin: 4 },
    chipText: { color: '#fff', fontWeight: '700' },

    option: { backgroundColor: '#161616', padding: 12, borderRadius: 12, marginVertical: 5 },
    optionText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});
