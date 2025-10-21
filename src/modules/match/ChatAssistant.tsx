// src/modules/match/ChatAssistant.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { Category } from './types';
import { listTurnHours } from './availability';
import { fetchOpenMatches, getMatchByCode, joinMatchAtomic } from './api';

// Tipado local (evitamos error “no exported member Turn”)
type Turn = 'mañana' | 'tarde' | 'noche';

type Props = {
    visible: boolean;
    onClose: () => void;
    date: string;
    onConfirm: (payload: {
        turn: 'mañana' | 'tarde' | 'noche';
        hour: string;
        duration: 90 | 120;
        category: '6ta' | '5ta' | '4ta';
        courtId: 'court_1' | 'court_2' | 'court_3';
    }) => void;
    initialCode?: string;   // 👈 agregado: permite pasar el código (deep link) sin romper tipos
};;

function Chip({
    label,
    onPress,
    selected,
    disabled,
}: {
    label: string;
    onPress?: () => void;
    selected?: boolean;
    disabled?: boolean;
}) {
    return (
        <TouchableOpacity
            disabled={disabled}
            onPress={onPress}
            style={[
                styles.chip,
                selected && styles.chipPrimary,
                disabled && { opacity: 0.4 },
            ]}
        >
            <Text style={[styles.chipText, selected && styles.chipPrimaryText]}>{label}</Text>
        </TouchableOpacity>
    );
}

export default function ChatAssistant({ visible, onClose, date, onConfirm }: Props) {
    // flujo
    const [step, setStep] = useState<
        'home' | 'turn' | 'hour' | 'duration' | 'category' | 'summary' | 'join-code' | 'open-list'
    >('home');

    const [turn, setTurn] = useState<Turn>('mañana');
    const [hour, setHour] = useState<string>('');
    const [duration, setDuration] = useState<90 | 120>(90);
    const [category, setCategory] = useState<Category>('6ta');
    const [courtId, setCourtId] = useState<'court_1' | 'court_2' | 'court_3'>('court_1');

    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState('');
    const [openMatches, setOpenMatches] = useState<any[]>([]);
    const scrollRef = useRef<ScrollView>(null);

    // reset básico al abrir
    useEffect(() => {
        if (!visible) return;
        setStep('home');
        setTurn('mañana');
        setHour('');
        setDuration(90);
        setCategory('6ta');
        setCourtId('court_1');
        setCode('');
        setOpenMatches([]);
    }, [visible]);

    // autoscroll
    useEffect(() => {
        const t = setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 50);
        return () => clearTimeout(t);
    }, [step, hour, duration, category, openMatches.length]);

    // horas válidas del turno (sin horas pasadas)
    const hoursForTurn = useMemo<string[]>(() => {
        return listTurnHours(turn, date);
    }, [turn, date]);

    // navegación
    const goCreate = () => setStep('turn');
    const goJoinCode = () => setStep('join-code');
    const goOpenList = async () => {
        try {
            setLoading(true);
            const res = await fetchOpenMatches({ date });
            setOpenMatches(res);
            setStep('open-list');
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'No se pudo cargar la lista');
        } finally {
            setLoading(false);
        }
    };

    // picks
    const pickTurn = (t: Turn) => {
        setTurn(t);
        setHour('');
        setStep('hour');
    };
    const pickHour = (h: string) => {
        setHour(h);
        setStep('duration');
    };
    const pickDuration = (d: 90 | 120) => {
        setDuration(d);
        setStep('category');
    };
    const pickCategory = (c: Category) => {
        setCategory(c);
        setStep('summary');
    };
    const confirm = () => {
        onConfirm({ turn, hour, duration, category, courtId });
    };

    // join por código
    const tryJoinByCode = async () => {
        const clean = code.trim();
        if (!clean) return;
        try {
            setLoading(true);
            const match = await getMatchByCode(clean);
            if (!match) {
                Alert.alert('Ups', 'No se encontró un partido con ese código.');
                return;
            }
            const res = await joinMatchAtomic({
                matchId: match.id,
                user: { uid: 'demo', name: 'Ismael', photoUrl: null, category },
            });
            Alert.alert('Listo ✅', res.status === 'completa' ? 'Se completó el partido.' : 'Te sumaste al partido.');
            onClose();
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'No se pudo unir al partido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                {/* tarjeta centrada (diseño anterior) */}
                <View style={styles.card}>
                    {/* header */}
                    <View style={styles.header}>
                        <Image source={require('../../../assets/icons/bot.png')} style={styles.avatar} />
                        <View>
                            <Text style={styles.title}>Ciclo Asistente</Text>
                            <Text style={styles.subtitle}>te ayuda a armar tu partido</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* conversación */}
                    <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 10 }}>
                        {step === 'home' && (
                            <>
                                <View style={styles.row}>
                                    <View style={styles.bubbleBot}>
                                        <Text style={styles.bubbleBotText}>¿Con ganas de jugar?</Text>
                                    </View>
                                </View>
                                <View style={styles.row}>
                                    <Chip label="🎾 Crear partido" onPress={goCreate} />
                                    <Chip label="🔎 Buscar por código" onPress={goJoinCode} />
                                    <Chip label="📋 Ver abiertos" onPress={goOpenList} />
                                </View>
                            </>
                        )}

                        {step === 'turn' && (
                            <>
                                <View style={styles.row}>
                                    <View style={styles.bubbleBot}>
                                        <Text style={styles.bubbleBotText}>¿Qué turno preferís para {date}?</Text>
                                    </View>
                                </View>
                                <View style={styles.row}>
                                    <Chip label="Mañana (09–12)" onPress={() => pickTurn('mañana')} />
                                    <Chip label="Tarde (12–18)" onPress={() => pickTurn('tarde')} />
                                    <Chip label="Noche (18–23)" onPress={() => pickTurn('noche')} />
                                </View>
                            </>
                        )}

                        {step === 'hour' && (
                            <>
                                <View style={styles.row}>
                                    <View style={styles.bubbleBot}>
                                        <Text style={styles.bubbleBotText}>Elegí la hora:</Text>
                                    </View>
                                </View>
                                <View style={styles.rowWrap}>
                                    {hoursForTurn.map((h) => (
                                        <Chip key={h} label={h} selected={hour === h} onPress={() => pickHour(h)} />
                                    ))}
                                </View>
                            </>
                        )}

                        {step === 'duration' && (
                            <>
                                <View style={styles.row}>
                                    <View style={styles.bubbleBot}>
                                        <Text style={styles.bubbleBotText}>¿Cuánto querés jugar?</Text>
                                    </View>
                                </View>
                                <View style={styles.row}>
                                    <Chip label="90 min" selected={duration === 90} onPress={() => pickDuration(90)} />
                                    <Chip label="120 min" selected={duration === 120} onPress={() => pickDuration(120)} />
                                </View>
                            </>
                        )}

                        {step === 'category' && (
                            <>
                                <View style={styles.row}>
                                    <View style={styles.bubbleBot}>
                                        <Text style={styles.bubbleBotText}>Elegí tu categoría</Text>
                                    </View>
                                </View>
                                <View style={styles.row}>
                                    <Chip label="6ta" selected={category === '6ta'} onPress={() => pickCategory('6ta')} />
                                    <Chip label="5ta" selected={category === '5ta'} onPress={() => pickCategory('5ta')} />
                                    <Chip label="4ta" selected={category === '4ta'} onPress={() => pickCategory('4ta')} />
                                </View>
                            </>
                        )}

                        {step === 'summary' && (
                            <>
                                <View style={styles.row}>
                                    <View style={styles.bubbleBot}>
                                        <Text style={styles.bubbleBotText}>
                                            Listo, te reservo {date} {hour} • {duration}’ • {category}.{'\n'}
                                            Cancha sugerida: {courtId.replace('court_', 'Cancha ')}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.row}>
                                    <TouchableOpacity style={styles.primaryBtn} onPress={confirm}>
                                        <Text style={styles.primaryBtnText}>Confirmar</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {step === 'join-code' && (
                            <>
                                <View style={styles.row}>
                                    <View style={styles.bubbleBot}>
                                        <Text style={styles.bubbleBotText}>Ingresá el código del partido</Text>
                                    </View>
                                </View>
                                <View style={styles.row}>
                                    <TextInput
                                        value={code}
                                        onChangeText={setCode}
                                        placeholder="Ej: 9F2A1C"
                                        placeholderTextColor="#88A"
                                        style={styles.input}
                                        autoCapitalize="characters"
                                    />
                                </View>
                                <View style={styles.row}>
                                    <TouchableOpacity style={styles.primaryBtn} onPress={tryJoinByCode}>
                                        {loading ? <ActivityIndicator color="#0B1118" /> : <Text style={styles.primaryBtnText}>Unirme</Text>}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {step === 'open-list' && (
                            <>
                                <View style={styles.row}>
                                    <View style={styles.bubbleBot}>
                                        <Text style={styles.bubbleBotText}>Partidos abiertos hoy</Text>
                                    </View>
                                </View>
                                {loading && (
                                    <View style={[styles.row, { justifyContent: 'center' }]}>
                                        <ActivityIndicator color="#3FA7FF" />
                                    </View>
                                )}
                                {!loading && openMatches.length === 0 && (
                                    <View style={styles.row}>
                                        <Text style={{ color: '#9fb3c8' }}>No hay partidos abiertos por ahora.</Text>
                                    </View>
                                )}
                                {!loading &&
                                    openMatches.map((m) => (
                                        <View key={m.id} style={styles.cardListItem}>
                                            <Text style={styles.itemTitle}>
                                                {m.hour} • {m.category} • {String(m.players?.length ?? 1)}/4
                                            </Text>
                                            <Text style={styles.itemSub}>{m.courtId?.replace('court_', 'Cancha ')}</Text>
                                            <View style={{ height: 8 }} />
                                            <TouchableOpacity
                                                style={styles.joinBtn}
                                                onPress={async () => {
                                                    try {
                                                        setLoading(true);
                                                        const res = await joinMatchAtomic({
                                                            matchId: m.id,
                                                            user: { uid: 'demo', name: 'Ismael', photoUrl: null, category },
                                                        });
                                                        Alert.alert(
                                                            'Listo ✅',
                                                            res.status === 'completa' ? 'Se completó el partido.' : 'Te sumaste al partido.'
                                                        );
                                                        onClose();
                                                    } catch (e: any) {
                                                        Alert.alert('Error', e?.message ?? 'No se pudo unir al partido');
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                            >
                                                <Text style={styles.joinBtnText}>Sumarme</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                            </>
                        )}
                    </ScrollView>

                    {/* footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.footerClose}>Cerrar</Text>
                        </TouchableOpacity>
                        {/* tres puntitos estáticos (sin animationDelay para evitar error) */}
                        <View style={styles.typingDots}>
                            <View style={styles.dot} />
                            <View style={styles.dot} />
                            <View style={styles.dot} />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(2,10,20,0.72)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    card: {
        width: '100%',
        maxWidth: 720,
        height: '80%',
        backgroundColor: '#0B1118',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: '#14202d',
        overflow: 'hidden',
    },
    header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8 },
    avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 10 },
    title: { color: '#E6F1FF', fontSize: 18, fontWeight: '800' },
    subtitle: { color: '#9fb3c8', fontSize: 12, marginTop: 2 },
    divider: { height: 1, backgroundColor: '#14202d', marginVertical: 8 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8, alignItems: 'center' },
    rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
    bubbleBot: {
        backgroundColor: '#132333',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        maxWidth: '90%',
    },
    bubbleBotText: { color: '#E6F1FF', fontSize: 15, lineHeight: 20 },
    chip: {
        backgroundColor: '#111922',
        borderWidth: 1,
        borderColor: '#1f2e3b',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
    },
    chipText: { color: '#cfe3ff', fontWeight: '700' },
    chipPrimary: { backgroundColor: '#3FA7FF22', borderColor: '#4db3ff' },
    chipPrimaryText: { color: '#4db3ff' },
    input: {
        flex: 1,
        minWidth: '70%',
        backgroundColor: '#101922',
        borderWidth: 1,
        borderColor: '#1f2e3b',
        borderRadius: 10,
        color: '#E6F1FF',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    primaryBtn: { backgroundColor: '#3FA7FF', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 },
    primaryBtnText: { color: '#0B1118', fontWeight: '800' },
    footer: {
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#14202d',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    footerClose: { color: '#9fb3c8', fontWeight: '700' },
    typingDots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4db3ff', opacity: 0.7 },
    cardListItem: {
        backgroundColor: '#101922',
        borderWidth: 1,
        borderColor: '#1f2e3b',
        borderRadius: 12,
        padding: 12,
        marginVertical: 6,
    },
    itemTitle: { color: '#E6F1FF', fontWeight: '800' },
    itemSub: { color: '#9fb3c8', marginTop: 2, fontSize: 12 },
    joinBtn: {
        alignSelf: 'flex-start',
        backgroundColor: '#3FA7FF',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
    },
    joinBtnText: { color: '#0B1118', fontWeight: '800' },
});
