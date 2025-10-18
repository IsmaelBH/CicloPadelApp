// src/screens/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Alert,
    TouchableOpacity,
    FlatList,
    ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { logout } from '../redux/slices/authSlice';
import { PROFILE_IMAGE_KEY } from '../constants/storageKeys';
import { MaterialIcons } from '@expo/vector-icons';
import { getDatabase, ref, onValue } from 'firebase/database';

// Firestore para "Mis reservas"
import { db } from '../firebase/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';

type MiniMatch = {
    id: string;
    date: string;
    start: string;
    end?: string;
    duration: number;
    courtId: 'court_1' | 'court_2' | 'court_3' | string;
    category: '6ta' | '5ta' | '4ta' | string;
    status: 'en_formacion' | 'completa' | 'cancelado' | string;
    players?: Array<{ uid: string }>;
};

export default function ProfileScreen() {
    const { email, fullName, uid } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [myMatches, setMyMatches] = useState<MiniMatch[]>([]);

    // Cargar imagen guardada
    useEffect(() => {
        const loadImage = async () => {
            const savedUri = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
            if (savedUri) setImageUri(savedUri);
        };
        loadImage();
    }, []);

    // Realtime DB: compras
    useEffect(() => {
        if (!uid) return;
        const dbRT = getDatabase();
        const dbRef = ref(dbRT, `purchases/${uid}`);
        const unsubscribe = onValue(dbRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const parsed = Object.values(data);
                setPurchases((parsed as any[]).reverse());
            } else {
                setPurchases([]);
            }
        });
        return () => unsubscribe();
    }, [uid]);

    // Firestore: mis reservas (playersUids array-contains uid)
    useEffect(() => {
        if (!uid) return;
        const qy = query(
            collection(db, 'matches'),
            where('playersUids', 'array-contains', uid),
            // 👇 OJO: sin orderBy para no requerir índice
        );
        const unsub = onSnapshot(qy, (snap) => {
            const rows: MiniMatch[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
            // orden en memoria: fecha DESC, hora DESC
            rows.sort((a, b) => {
                if (a.date === b.date) return (b.start ?? '').localeCompare(a.start ?? '');
                return (b.date ?? '').localeCompare(a.date ?? '');
            });
            setMyMatches(rows);
        });
        return () => unsub();
    }, [uid]);


    const openCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Acceso denegado', 'Por favor habilita la cámara desde ajustes.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            const sourceUri = result.assets[0].uri;
            const fileName = sourceUri.split('/').pop() || `profile_${Date.now()}.jpg`;
            const newPath = FileSystem.documentDirectory + fileName;

            try {
                await FileSystem.copyAsync({ from: sourceUri, to: newPath });
                await AsyncStorage.setItem(PROFILE_IMAGE_KEY, newPath);
                setImageUri(newPath);
            } catch {
                Alert.alert('Error', 'No se pudo guardar la imagen');
            }
        }
    };

    const renderPurchaseCard = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <Text style={styles.dateText}>📅 {new Date(item.date).toLocaleDateString()}</Text>
            <Text style={styles.totalText}>💰 Total: ${item.total}</Text>
            {item.items?.map((prod: any, idx: number) => (
                <Text key={idx} style={styles.productText}>
                    • {prod.name} x{prod.quantity}
                </Text>
            ))}
        </View>
    );

    const renderMatchCard = (m: MiniMatch) => (
        <View key={m.id} style={styles.matchCard}>
            <Text style={styles.matchTitle}>
                {m.date} • {m.start} ({m.duration} min)
            </Text>
            <Text style={styles.matchSub}>
                {String(m.courtId).toUpperCase()} • Cat. {m.category} • {m.players?.length ?? 0}/4
            </Text>
            <Text style={[styles.matchBadge, m.status === 'completa' ? styles.badgeOk :
                m.status === 'cancelado' ? styles.badgeCancel : styles.badgeOpen]}>
                {m.status === 'completa' ? 'Confirmado' : m.status === 'cancelado' ? 'Cancelado' : 'En formación'}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
                {/* Avatar */}
                <View style={styles.profileImageContainer}>
                    <Image
                        source={imageUri ? { uri: imageUri } : require('../../assets/logo.png')}
                        style={styles.profileImage}
                    />
                    <TouchableOpacity style={styles.cameraIcon} onPress={openCamera}>
                        <MaterialIcons name="photo-camera" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Datos */}
                {fullName ? (
                    <>
                        <Text style={styles.label}>Nombre:</Text>
                        <Text style={styles.info}>{fullName}</Text>
                    </>
                ) : null}
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.info}>{email}</Text>

                {/* Mis reservas */}
                <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Mis reservas</Text>
                {myMatches.length === 0 ? (
                    <Text style={styles.emptyText}>Aún no tenés partidos reservados.</Text>
                ) : (
                    <View style={{ gap: 10 }}>
                        {myMatches.map(renderMatchCard)}
                    </View>
                )}

                {/* Compras */}
                {purchases.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Historial de compras</Text>
                        <FlatList
                            data={purchases}
                            keyExtractor={(_, index) => index.toString()}
                            renderItem={renderPurchaseCard}
                            scrollEnabled={false}
                        />
                    </>
                )}
            </ScrollView>

            <TouchableOpacity style={styles.logoutContainer} onPress={() => dispatch(logout())}>
                <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20 },
    profileImageContainer: { position: 'relative', alignItems: 'center', marginTop: 60 },
    profileImage: { width: 140, height: 140, borderRadius: 70 },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 110,
        backgroundColor: '#555',
        borderRadius: 20,
        padding: 6,
    },

    label: { color: '#aaa', fontSize: 16, marginTop: 20 },
    info: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 4 },

    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
    emptyText: { color: '#9aa', marginTop: 8 },

    logoutContainer: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center' },
    logoutText: { color: '#64b5f6', fontSize: 14, textDecorationLine: 'underline', marginBottom: 20 },

    // Compras
    card: { backgroundColor: '#222', borderRadius: 10, padding: 12, marginTop: 12 },
    dateText: { color: '#ccc', fontSize: 14, marginBottom: 4 },
    totalText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
    productText: { color: '#aaa', fontSize: 14 },

    // Partidos
    matchCard: { backgroundColor: '#151515', borderRadius: 12, padding: 12 },
    matchTitle: { color: '#fff', fontWeight: '800' },
    matchSub: { color: '#9aa', marginTop: 2 },
    matchBadge: {
        marginTop: 8,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        fontSize: 12,
        overflow: 'hidden',
        color: '#fff',
    },
    badgeOk: { backgroundColor: '#23a55a' },
    badgeOpen: { backgroundColor: '#2b3a55' },
    badgeCancel: { backgroundColor: '#b3261e' },
});
