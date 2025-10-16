import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';

import { createMatchAtomic, fetchDayFixed, joinMatchAtomic } from '../modules/match/api';
import { buildDayGrid } from '../modules/match/dayGrid';
import { useDayMatches } from '../modules/match/hooks';
import { Category } from '../modules/match/types';

const COURTS = ['court_1', 'court_2', 'court_3'] as const;

function addDays(d: Date, days: number) { const n = new Date(d); n.setDate(n.getDate() + days); return n; }
function toISO(d: Date) { return d.toISOString().slice(0, 10); }
const courtLabel = (id: typeof COURTS[number]) => id === 'court_1' ? 'Cancha 1' : id === 'court_2' ? 'Cancha 2' : 'Cancha 3';

export default function MatchScreen() {
    const [date, setDate] = useState<string>(toISO(new Date()));
    const [duration, setDuration] = useState<90 | 120>(90);

    // UID persistente local para pruebas (hasta conectar auth real)
    const [myUid, setMyUid] = useState<string | null>(null);
    const [myName] = useState('Jugador'); // si tenés Redux, traé nombre/foto reales
    const [myPhoto] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            let uid = await AsyncStorage.getItem('TEST_UID');
            if (!uid) {
                uid = 'u_' + Math.random().toString(36).slice(2, 10);
                await AsyncStorage.setItem('TEST_UID', uid);
            }
            setMyUid(uid);
        })();
    }, []);

    const matchesToday = useDayMatches(date);
    const [fixedToday, setFixedToday] = useState<any[]>([]);
    useEffect(() => { (async () => setFixedToday(await fetchDayFixed(date)))(); }, [date]);

    const grid = useMemo(
        () => buildDayGrid({ date, duration, courtIds: COURTS as any, matches: matchesToday as any, fixed: fixedToday as any }),
        [date, duration, matchesToday, fixedToday]
    );

    // Picker
    const [pendingSlot, setPendingSlot] = useState<{ courtId: any; start: string } | null>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickCategory, setPickCategory] = useState<Category>('5ta');

    // Feedback
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [feedbackText, setFeedbackText] = useState<string>('');

    const onPressFree = (courtId: any, start: string) => {
        setPendingSlot({ courtId, start });
        setPickCategory('5ta');
        setPickerVisible(true);
    };

    const confirmCreate = async () => {
        if (!pendingSlot || !myUid) return;
        try {
            const user = { uid: myUid, name: myName, photoUrl: myPhoto };
            const res = await createMatchAtomic({
                date, courtId: pendingSlot.courtId, start: pendingSlot.start, duration, category: pickCategory, creator: user,
            });
            setPickerVisible(false);
            if (res.ok) { setFeedbackText('Partido creado. Sos Player 1.'); setFeedbackVisible(true); }
        } catch (e: any) {
            setPickerVisible(false);
            Alert.alert('Error', e.message);
        }
    };

    const handleJoin = async (matchId: string, category: Category) => {
        if (!myUid) return;
        try {
            const user = { uid: myUid, name: myName, photoUrl: myPhoto, category };
            const res = await joinMatchAtomic({ matchId, user });
            if (res.already) {
                setFeedbackText('Ya eras parte de este partido.');
            } else {
                setFeedbackText(res.status === 'completa' ? '¡Partido completo!' : 'Te uniste al partido.');
            }
            setFeedbackVisible(true);
        } catch (e: any) {
            Alert.alert('No se pudo unir', e.message);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Match — {date}</Text>
                <View style={styles.dateRow}>
                    <TouchableOpacity onPress={() => setDate(toISO(new Date()))}><Text style={styles.chip}>Hoy</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setDate(toISO(addDays(new Date(), 1)))}><Text style={styles.chip}>Mañana</Text></TouchableOpacity>
                </View>
            </View>

            <View style={styles.filters}>
                <TouchableOpacity onPress={() => setDuration(90)}><Text style={[styles.chip, duration === 90 && styles.chipActive]}>90</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setDuration(120)}><Text style={[styles.chip, duration === 120 && styles.chipActive]}>120</Text></TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
                {COURTS.map((courtId) => (
                    <View key={courtId} style={styles.courtCol}>
                        <Text style={styles.courtTitle}>{courtLabel(courtId)}</Text>
                        {grid[courtId].map((item) => {
                            if (item.state === 'fixed') {
                                return (
                                    <View key={`${courtId}-${item.start}`} style={[styles.slotRow, styles.fixed]}>
                                        <Text style={styles.slotHour}>{item.start}–{item.end}</Text>
                                        <Text style={styles.badge}>Fijo</Text>
                                    </View>
                                );
                            }
                            if (item.state === 'match_full') {
                                return (
                                    <View key={`${courtId}-${item.start}`} style={[styles.slotRow, styles.full]}>
                                        <Text style={styles.slotHour}>{item.start}–{item.end}</Text>
                                        <View style={styles.right}>
                                            <Text style={styles.catChip}>{item.match?.category}</Text>
                                            <Text style={styles.count}>4/4</Text>
                                            <Text style={styles.badge}>Completo</Text>
                                        </View>
                                    </View>
                                );
                            }
                            if (item.state === 'match_open') {
                                const players = Array.isArray(item.match?.players) ? item.match!.players : [];
                                return (
                                    <TouchableOpacity
                                        key={`${courtId}-${item.start}`}
                                        style={[styles.slotRow, styles.open]}
                                        onPress={() => handleJoin(item.match!.id, item.match!.category as Category)}
                                    >
                                        <Text style={styles.slotHour}>{item.start}–{item.end}</Text>
                                        <View style={styles.right}>
                                            <View style={styles.avatarsRow}>
                                                {players.slice(0, 4).map((p: any) =>
                                                    p.photoUrl ? (
                                                        <Image key={p.uid} source={{ uri: p.photoUrl }} style={styles.avatar} />
                                                    ) : (
                                                        <View key={p.uid} style={styles.avatarFallback}>
                                                            <Text style={styles.avatarInitial}>{p.name?.[0]?.toUpperCase() || 'P'}</Text>
                                                        </View>
                                                    )
                                                )}
                                                {Array.from({ length: Math.max(0, 4 - (players.length || 0)) }).map((_, i) => (
                                                    <View key={`empty-${i}`} style={[styles.avatarFallback, { opacity: 0.35 }]}>
                                                        <Text style={styles.avatarInitial}>?</Text>
                                                    </View>
                                                ))}
                                            </View>
                                            <Text style={styles.catChip}>{item.match?.category}</Text>
                                            <Text style={styles.count}>{players.length}/4</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }
                            // libre
                            return (
                                <TouchableOpacity key={`${courtId}-${item.start}`} style={[styles.slotRow, styles.free]} onPress={() => onPressFree(courtId, item.start)}>
                                    <Text style={styles.slotHour}>{item.start}–{item.end}</Text>
                                    <Text style={styles.badge}>Libre</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </ScrollView>

            {/* Picker categoría */}
            <Modal transparent visible={pickerVisible} animationType="fade" onRequestClose={() => setPickerVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.pickerCard}>
                        <Text style={styles.modalTitle}>Elegí categoría</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                            {(['6ta', '5ta', '4ta'] as Category[]).map((c) => (
                                <TouchableOpacity key={c} onPress={() => setPickCategory(c)}>
                                    <Text style={[styles.chip, pickCategory === c && styles.chipActive]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Pressable style={styles.primaryBtn} onPress={confirmCreate}><Text style={styles.primaryBtnText}>Confirmar</Text></Pressable>
                        <TouchableOpacity onPress={() => setPickerVisible(false)}><Text style={{ color: '#9aa', textAlign: 'center', marginTop: 8 }}>Cancelar</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Feedback */}
            <Modal transparent visible={feedbackVisible} animationType="fade" onRequestClose={() => setFeedbackVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.feedbackCard}>
                        <Text style={styles.modalTitle}>{feedbackText}</Text>
                        <Pressable style={styles.primaryBtn} onPress={() => setFeedbackVisible(false)}><Text style={styles.primaryBtnText}>Ok</Text></Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B0B', padding: 16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
    title: { color: '#F5F5F5', fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },
    dateRow: { flexDirection: 'row', gap: 8 },
    filters: { flexDirection: 'row', gap: 8, marginVertical: 10 },
    chip: { color: '#E0E0E0', paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2E2E2E', borderRadius: 10, backgroundColor: '#131313' },
    chipActive: { borderColor: '#3FA7FF', backgroundColor: '#0E2233', color: '#E8F3FF', fontWeight: '700' },
    courtCol: { backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 12, paddingTop: 10, marginBottom: 12, borderWidth: 1, borderColor: '#1f1f1f' },
    courtTitle: { color: '#F0F0F0', fontSize: 16, fontWeight: '700', marginBottom: 8 },
    slotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#1b1b1b' },
    slotHour: { color: '#f5f5f5', fontWeight: '700' },
    badge: { color: '#bbb' },
    right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    catChip: { color: '#E8F3FF', backgroundColor: '#0E2233', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
    count: { color: '#9BB6FF', fontWeight: '600' },
    avatarsRow: { flexDirection: 'row', gap: 6, marginRight: 4 },
    avatar: { width: 22, height: 22, borderRadius: 11 },
    avatarFallback: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#2B3447', alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { color: '#E8F3FF', fontWeight: '800', fontSize: 12 },
    free: {}, open: { backgroundColor: '#121722' }, full: { opacity: 0.55 }, fixed: { opacity: 0.6 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 18 },
    pickerCard: { width: '90%', backgroundColor: '#0F0F0F', borderRadius: 16, borderWidth: 1, borderColor: '#222', padding: 16 },
    feedbackCard: { width: '80%', backgroundColor: '#0F0F0F', borderRadius: 16, borderWidth: 1, borderColor: '#222', padding: 16, alignItems: 'center' },
    modalTitle: { color: '#EAEAEA', fontSize: 18, fontWeight: '800', textAlign: 'center' },
    primaryBtn: { marginTop: 14, backgroundColor: '#3FA7FF', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    primaryBtnText: { color: '#0B1118', fontWeight: '800' },
});
