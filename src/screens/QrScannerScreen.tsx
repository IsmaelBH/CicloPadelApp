import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { addScan } from '../redux/slices/scanSlice';

type QRData = {
    type: string;
    data: string;
};

export default function QrScannerScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const navigation = useNavigation();
    const dispatch = useDispatch();

    useEffect(() => {
        requestPermission();
    }, []);

    const handleBarCodeScanned = ({ type, data }: QRData) => {
        setScanned(true);

        if (data.toUpperCase() === 'PADDEL-VALID-QR') {
            dispatch(addScan());
            Alert.alert('✅ Código válido', '¡1 partido sumado!', [
                {
                    text: 'OK',
                    onPress: () => {
                        setScanned(false);
                        navigation.goBack();
                    },
                },
            ]);
        } else {
            Alert.alert('❌ Código inválido', 'Intentá con otro QR', [
                { text: 'OK', onPress: () => setScanned(false) },
            ]);
        }
    };

    if (!permission?.granted) {
        return (
            <View style={styles.center}>
                <Text>Se necesita permiso para usar la cámara.</Text>
                <Button title="Permitir" onPress={requestPermission} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
            />

            {/* Overlay oscura con hueco central */}
            <View style={styles.overlay}>
                <View style={styles.scannerFrame} />
            </View>

            {/* Botón para volver */}
            <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    scannerFrame: {
        width: 250,
        height: 250,
        borderColor: '#fff',
        borderWidth: 2,
        borderRadius: 10,
        backgroundColor: 'transparent',
    },
    closeButton: {
        position: 'absolute',
        bottom: 40,
        right: 30,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 30,
        padding: 10,
    },
});