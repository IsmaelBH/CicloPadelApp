import { useNavigation } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../api/authApi';
import { setUser } from '../redux/slices/authSlice';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [login, { isLoading, isError, error }] = useLoginMutation();
    const navigation = useNavigation<any>();
    const dispatch = useDispatch();

    const passwordRef = useRef<TextInput>(null);

    const onSubmit = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor completa ambos campos.');
            return;
        }

        try {
            const response: any = await login({ email, password });
            if (response?.data) {
                dispatch(setUser(response.data));
            } else {
                Alert.alert('Error', 'Credenciales incorrectas o problema con el servidor.');
            }
        } catch (e) {
            Alert.alert('Error', 'Hubo un problema al iniciar sesión.');
        }
    };

    return (
        <View style={styles.root}>
            {/* Fondo de video */}
            <Video
                source={require('../../assets/videos/padel-loop.mp4')}
                style={StyleSheet.absoluteFill}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
            />
            {/* Capa oscura */}
            <View style={styles.overlay} />

            <KeyboardAvoidingView
                style={{ flex: 1, width: '100%' }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.content}>
                            <Image source={require('../../assets/logo.png')} style={styles.logo} />

                            <TextInput
                                placeholder="Email"
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor="#bbb"
                                returnKeyType="next"
                                onSubmitEditing={() => passwordRef.current?.focus()}
                                blurOnSubmit={false}
                            />
                            <TextInput
                                ref={passwordRef}
                                placeholder="Contraseña"
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                placeholderTextColor="#bbb"
                                returnKeyType="done"
                                onSubmitEditing={onSubmit}
                            />

                            <TouchableOpacity onPress={onSubmit} style={styles.button} activeOpacity={0.9}>
                                <Text style={styles.buttonText}>
                                    {isLoading ? 'Cargando...' : 'Iniciar sesión'}
                                </Text>
                            </TouchableOpacity>

                            {isError && (
                                <Text style={styles.errorText}>
                                    {(() => {
                                        if ('data' in (error as any)) {
                                            const message = (error as any)?.data?.error?.message;
                                            if (message === 'INVALID_PASSWORD') return 'Contraseña incorrecta.';
                                            if (message === 'EMAIL_NOT_FOUND') return 'Email no registrado.';
                                            return 'Error al iniciar sesión.';
                                        } else {
                                            return 'Error desconocido.';
                                        }
                                    })()}
                                </Text>
                            )}

                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.link}>¿No tienes cuenta? Registrate aquí</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </View>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingBottom: 24, // margen extra para que no tape el botón
    },
    content: {
        alignItems: 'center',
        width: '100%',
    },
    logo: {
        width: 160,
        height: 160,
        resizeMode: 'contain',
        marginBottom: 24,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.98)',
        width: '100%',
        paddingHorizontal: 15,
        paddingVertical: 14,
        marginBottom: 14,
        borderRadius: 12,
        color: '#111',
    },
    button: {
        backgroundColor: '#0078D7',
        paddingVertical: 14,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 8,
    },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    link: {
        color: '#fff',
        marginTop: 8,
        textDecorationLine: 'underline',
    },
    errorText: {
        color: '#ff6b6b',
        textAlign: 'center',
        marginVertical: 8,
    },
});
