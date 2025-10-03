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

export default function ProfileScreen() {
    const { email, fullName, uid } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [purchases, setPurchases] = useState<any[]>([]);

    useEffect(() => {
        const loadImage = async () => {
            const savedUri = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
            if (savedUri) setImageUri(savedUri);
        };
        loadImage();
    }, []);

    useEffect(() => {
        if (!uid) return;

        const db = getDatabase();
        const dbRef = ref(db, `purchases/${uid}`);

        const unsubscribe = onValue(dbRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const parsed = Object.values(data);
                setPurchases(parsed.reverse());
            } else {
                setPurchases([]);
            }
        });

        return () => unsubscribe();
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
            } catch (error) {
                Alert.alert('Error', 'No se pudo guardar la imagen');
            }
        }
    };

    const renderPurchaseCard = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <Text style={styles.dateText}>📅 {new Date(item.date).toLocaleDateString()}</Text>
            <Text style={styles.totalText}>💰 Total: ${item.total}</Text>
            {item.items.map((prod: any, idx: number) => (
                <Text key={idx} style={styles.productText}>
                    • {prod.name} x{prod.quantity}
                </Text>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
                <View style={styles.profileImageContainer}>
                    <Image
                        source={imageUri ? { uri: imageUri } : require('../../assets/logo.png')}
                        style={styles.profileImage}
                    />
                    <TouchableOpacity style={styles.cameraIcon} onPress={openCamera}>
                        <MaterialIcons name="photo-camera" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {fullName && (
                    <>
                        <Text style={styles.label}>Nombre:</Text>
                        <Text style={styles.info}>{fullName}</Text>
                    </>
                )}
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.info}>{email}</Text>

                {purchases.length > 0 && (
                    <>
                        <Text style={[styles.label, { marginTop: 30 }]}>Historial de compras:</Text>
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
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 20,
    },
    profileImageContainer: {
        position: 'relative',
        alignItems: 'center',
        marginTop: 60,
    },
    profileImage: {
        width: 140,
        height: 140,
        borderRadius: 70,
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 110,
        backgroundColor: '#555',
        borderRadius: 20,
        padding: 6,
    },
    label: {
        color: '#aaa',
        fontSize: 16,
        marginTop: 20,
    },
    info: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 4,
    },
    logoutContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    logoutText: {
        color: '#64b5f6',
        fontSize: 14,
        textDecorationLine: 'underline',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#222',
        borderRadius: 10,
        padding: 12,
        marginTop: 12,
    },
    dateText: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 4,
    },
    totalText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    productText: {
        color: '#aaa',
        fontSize: 14,
    },
});
