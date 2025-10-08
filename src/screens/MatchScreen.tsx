import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Modal,
    Pressable, ScrollView,
    StyleSheet,
    Text, TouchableOpacity,
    View
} from 'react-native';
import { createMatchAtomic, fetchDayFixed } from '../../modules/match/api';
import { computeAvailability } from '../../modules/match/availability';
import { useDayMatches } from '../../modules/match/hooks';
import { Category, MatchDoc } from '../../modules/match/types';
import { db } from '../firebase/firebase';

const COURTS = ['court_1', 'court_2', 'court_3'] as const;

function addDays(d: Date, days: number) {
    const n = new Date(d);
    n.setDate(n.getDate() + days);
    return n;
}
function toISO(d: Date) {
    return d.toISOString().slice(0, 10);
}

export default function MatchScreen() {
    const [date, setDate] = useState<string>(toISO(new Date()));
    const [duration, setDuration] = useState<90 | 120>(90);
    const [category, setCategory] = useState<Category>('5ta');

    const matchesToday = useDayMatches(date);

    const [fixedToday, setFixedToday] = useState<any[]>([]);
    useEffect(() => {
        (async () => {
            const f = await fetchDayFixed(date);
            setFixedToday(f);
        })();
    }, [date]);

    const availability = useMemo(() => computeAvailability({
        date,
        duration,
        courtIds: COURTS as any,
        matches: matchesToday as any,
        fixed: fixedToday as any,
    }), [date, duration, matchesToday, fixedToday]);

    // ------- MODAL DE CONFIRMACIÓN -------
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMatch, setModalMatch] = useState<MatchDoc | null>(null);

    const courtLabel = (id: typeof COURTS[number]) =>
        id === 'court_1' ? 'Cancha 1' : id === 'court_2' ? 'Cancha 2' : 'Cancha 3';

    const handleCreate = async (courtId: any, start: string) => {
        try {
            // TODO: reemplazar por usuario real desde tu auth
            const user = { uid: 'demo', name: 'Ismael', photoUrl: null };
            const res = await createMatchAtomic({ date, courtId, start, duration, category, creator: user });
            if (res.ok) {
                // Buscar el match recién creado y mostrar modal
                const mRef = doc(db, 'matches', res.matchId!);
                const mSnap = await getDoc(mRef);
                if (mSnap.exists()) {
                    const match = { id: mSnap.id, ...(mSnap.data() as any) } as MatchDoc;
                    setModalMatch(match);
                    setModalVisible(true);
                } else {
                    Alert.alert('Match creado', 'Sos Player 1.'); // fallback
                }
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerRow}>
                <Text style={styles.title}>Match — {date}</Text>
                <View style={styles.dateRow}>
                    <TouchableOpacity onPress={() => setDate(toISO(new Date()))}>
                        <Text style={styles.chip}>Hoy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setDate(toISO(addDays(new Date(), 1)))}>
                        <Text style={styles.chip}>Mañana</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Filtros */}
            <View style={styles.filters}>
                <TouchableOpacity onPress={() => setDuration(90)}>
                    <Text style={[styles.chip, duration === 90 && styles.chipActive]}>90</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDuration(120)}>
                    <Text style={[styles.chip, duration === 120 && styles.chipActive]}>120</Text>
                </TouchableOpacity>

                {(['6ta', '5ta', '4ta'] as Category[]).map(c => (
                    <TouchableOpacity key={c} onPress={() => setCategory(c)}>
                        <Text style={[styles.chip, category === c && styles.chipActive]}>{c}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Canchas */}
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                {COURTS.map((courtId) => (
                    <View key={courtId} style={styles.courtCard}>
                        <Text style={styles.courtTitle}>{courtLabel(courtId)}</Text>

                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={availability[courtId]}
                            keyExtractor={(it) => `${courtId}-${it.start}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => handleCreate(courtId, item.start)} style={styles.slot}>
                                    <Text style={styles.slotText}>{item.start} — {item.end}</Text>
                                    <Text style={styles.slotSub}>{category} • {duration}’</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={styles.empty}>Sin huecos</Text>}
                        />
                    </View>
                ))}
            </ScrollView>

            {/* MODAL: detalle del match creado / unión */}
            <Modal
                transparent
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        {/* Imagen de la cancha */}
                        <Image
                            source={require('../../assets/images/court.jpg')}
                            style={styles.modalImage}
                            resizeMode="cover"
                        />
                        <Text style={styles.modalTitle}>Partido creado</Text>
                        {modalMatch && (
                            <>
                                <Text style={styles.modalSubtitle}>
                                    {courtLabel(modalMatch.courtId as any)} • {modalMatch.start}–{modalMatch.end} • {modalMatch.category}
                                </Text>

                                <View style={styles.playersRow}>
                                    {modalMatch.players.map((p) => (
                                        <View key={p.uid} style={styles.playerChip}>
                                            {p.photoUrl ? (
                                                <Image source={{ uri: p.photoUrl }} style={styles.avatar} />
                                            ) : (
                                                <View style={styles.avatarFallback}>
                                                    <Text style={styles.avatarInitial}>
                                                        {p.name?.[0]?.toUpperCase() || 'P'}
                                                    </Text>
                                                </View>
                                            )}
                                            <Text numberOfLines={1} style={styles.playerName}>{p.name}</Text>
                                        </View>
                                    ))}
                                    {Array.from({ length: Math.max(0, 4 - (modalMatch.players?.length || 0)) }).map((_, i) => (
                                        <View key={`empty-${i}`} style={[styles.playerChip, { opacity: 0.4 }]}>
                                            <View style={styles.avatarFallback}>
                                                <Text style={styles.avatarInitial}>?</Text>
                                            </View>
                                            <Text style={styles.playerName}>Libre</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}

                        <Pressable style={styles.primaryBtn} onPress={() => setModalVisible(false)}>
                            <Text style={styles.primaryBtnText}>Entendido</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ---------- STYLES (tema oscuro) ----------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B0B0B',
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    title: {
        color: '#F5F5F5',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    dateRow: { flexDirection: 'row', gap: 8 },
    filters: {
        flexDirection: 'row',
        gap: 8,
        marginVertical: 12,
        flexWrap: 'wrap',
    },
    chip: {
        color: '#E0E0E0',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#2E2E2E',
        borderRadius: 10,
        backgroundColor: '#131313',
    },
    chipActive: {
        borderColor: '#3FA7FF',
        backgroundColor: '#0E2233',
        color: '#E8F3FF',
        fontWeight: '700',
    },
    courtCard: {
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 12,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#1F1F1F',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 2,
    },
    courtTitle: {
        color: '#F0F0F0',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    slot: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#303030',
        borderRadius: 12,
        marginRight: 10,
        backgroundColor: '#161616',
    },
    slotText: {
        color: '#F5F5F5',
        fontSize: 14,
        fontWeight: '700',
    },
    slotSub: {
        color: '#9BB6FF',
        fontSize: 12,
        marginTop: 2,
    },
    empty: { color: '#666', fontStyle: 'italic' },

    // Modal
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 18,
    },
    modalCard: {
        width: '100%',
        backgroundColor: '#0F0F0F',
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#222',
    },
    modalImage: { width: '100%', height: 160 },
    modalTitle: {
        color: '#EAEAEA',
        fontSize: 18,
        fontWeight: '800',
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    modalSubtitle: {
        color: '#AAB7C7',
        fontSize: 13,
        paddingHorizontal: 16,
        marginTop: 4,
    },
    playersRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    playerChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: '#171A1F',
        borderWidth: 1,
        borderColor: '#293041',
    },
    avatar: { width: 28, height: 28, borderRadius: 14 },
    avatarFallback: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#2B3447', alignItems: 'center', justifyContent: 'center'
    },
    avatarInitial: { color: '#E8F3FF', fontWeight: '800' },
    playerName: { color: '#D9E4FF', maxWidth: 90 },

    primaryBtn: {
        marginHorizontal: 16,
        marginBottom: 16,
        marginTop: 6,
        backgroundColor: '#3FA7FF',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    primaryBtnText: { color: '#0B1118', fontWeight: '800' },
});
