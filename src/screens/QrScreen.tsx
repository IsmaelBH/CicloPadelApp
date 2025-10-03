import { useNavigation } from '@react-navigation/native';
import { Audio, ResizeMode, Video } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { resetScan } from '../redux/slices/scanSlice';
import { RootState } from '../redux/store';

const STAMP_SLOTS = 9;

const QrScreen = () => {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch();
    const scanCount = useSelector((state: RootState) => state.scan.count);
    const [modalVisible, setModalVisible] = useState(false);

    // Animación de escala por casillero
    const scales = useRef(
        Array.from({ length: STAMP_SLOTS }, () => new Animated.Value(0))
    ).current;

    // Sonidos
    const stampSoundRef = useRef<Audio.Sound | null>(null);
    const winSoundRef = useRef<Audio.Sound | null>(null);

    // Carga de sonidos al montar
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const { sound: stampSound } = await Audio.Sound.createAsync(
                    require('../../assets/sounds/stamp.mp3')
                );
                const { sound: winSound } = await Audio.Sound.createAsync(
                    require('../../assets/sounds/win.mp3')
                );
                if (mounted) {
                    stampSoundRef.current = stampSound;
                    winSoundRef.current = winSound;
                }
            } catch (e) {
                console.warn('No se pudieron cargar los sonidos:', e);
            }
        })();

        // Estados iniciales de escalas
        for (let i = 0; i < STAMP_SLOTS; i++) {
            if (i < scanCount) scales[i].setValue(1);
            else scales[i].setValue(0);
        }

        return () => {
            stampSoundRef.current?.unloadAsync();
            winSoundRef.current?.unloadAsync();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reproduce el sonido de sello
    const playStamp = async () => {
        try {
            await stampSoundRef.current?.replayAsync();
        } catch (e) {
            // silencioso
        }
    };

    // Reproduce el sonido de victoria
    const playWin = async () => {
        try {
            await winSoundRef.current?.replayAsync();
        } catch (e) {
            // silencioso
        }
    };

    // Responder a cambios de scanCount
    useEffect(() => {
        if (scanCount === 10) {
            // Sonido de victoria + modal
            playWin();
            setModalVisible(true);
            // Mostrar un instante el último sello animado y luego resetear
            setTimeout(() => dispatch(resetScan()), 450);
            return;
        }

        if (scanCount === 0) {
            // Reiniciar escalas al reset
            for (let i = 0; i < STAMP_SLOTS; i++) {
                scales[i].setValue(0);
            }
            return;
        }

        const newIndex = scanCount - 1;
        if (newIndex >= 0 && newIndex < STAMP_SLOTS) {
            // Animación “pop”
            scales[newIndex].setValue(0.2);
            Animated.spring(scales[newIndex], {
                toValue: 1,
                useNativeDriver: true,
                friction: 5,
                tension: 140,
            }).start();
            playStamp();
        }
    }, [scanCount, dispatch, scales]);

    const renderStamps = () => {
        return Array.from({ length: STAMP_SLOTS }).map((_, i) => {
            const filled = i < scanCount;
            return (
                <View key={i} style={styles.stampSlot}>
                    {/* base gris siempre visible */}
                    <View style={styles.stampBase} />
                    {/* logo con animación si está sellado */}
                    {filled && (
                        <Animated.Image
                            source={require('../../assets/logo.png')}
                            style={[styles.stampIcon, { transform: [{ scale: scales[i] }] }]}
                            resizeMode="contain"
                        />
                    )}
                </View>
            );
        });
    };

    return (
        <View style={styles.container}>
            <Video
                source={require('../../assets/videos/padel-loop.mp4')}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
            />
            <View style={styles.overlay} />

            <Image
                source={require('../../assets/logo-2.png')}
                style={styles.logo}
                resizeMode="contain"
            />

            <View style={styles.stampGrid}>{renderStamps()}</View>

            <View style={styles.iconRow}>
                <TouchableOpacity onPress={() => navigation.navigate('QrScannerScreen')}>
                    <Image source={require('../../assets/icons/qr.png')} style={styles.icon} />
                </TouchableOpacity>
            </View>

            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalContainer}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalText}>🎉 ¡Ganaste una cancha gratis! 🎾</Text>
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={styles.modalButton}
                        >
                            <Text style={styles.modalButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default QrScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    video: {
        ...StyleSheet.absoluteFillObject,
        transform: [{ rotate: '180deg' }],
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    logo: {
        width: 200,
        height: 200,
        zIndex: 2,
        marginBottom: 10,
    },
    stampGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '90%',
        justifyContent: 'center',
        zIndex: 2,
        marginTop: 10,
        marginBottom: 30,
    },
    stampSlot: {
        width: '30%',
        aspectRatio: 1,
        margin: '1.5%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    stampBase: {
        width: '70%',
        height: '70%',
        borderWidth: 1,
        borderColor: '#555',
        borderRadius: 8,

    },
    stampIcon: {
        position: 'absolute',
        width: '64%',
        height: '64%',
    },
    iconRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        position: 'absolute',
        bottom: 60,
        zIndex: 2,
    },
    icon: {
        width: 36,
        height: 36,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    modalBox: {
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    modalButton: {
        backgroundColor: '#1e90ff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
