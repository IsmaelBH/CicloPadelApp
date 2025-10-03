import { NativeStackScreenProps } from '@react-navigation/native-stack';
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
import { useSignupMutation } from '../api/authApi';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { setUser } from '../redux/slices/authSlice';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: Props) => {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [triggerSignup, { isLoading }] = useSignupMutation();
    const dispatch = useDispatch();

    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);

    const onSubmit = async () => {
        if (!fullName || !email || !password) {
            Alert.alert('Atención', 'Completá nombre, email y contraseña.');
            return;
        }
        try {
            const response = await triggerSignup({
                email,
                password,
                returnSecureToken: true,
            }).unwrap();

            dispatch(
                setUser({
                    email: response.email,
                    idToken: response.idToken,
                    localId: response.localId,
                    fullName,
                })
            );
        } catch (err: any) {
            let errorMessage = 'Error desconocido';
            if ('data' in err) {
                errorMessage = err.data?.error?.message || errorMessage;
            }
            Alert.alert('Error en registro', errorMessage);
        }
    };

    return (
        <View style={styles.root}>
            {/* Video de fondo */}
            <Video
                source={require('../../assets/videos/padel-loop.mp4')}
                style={StyleSheet.absoluteFill}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
            />
            <View style={styles.overlay} />

            <KeyboardAvoidingView
                style={{ flex: 1, width: '100%' }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.content}>
                            <Image source={require('../../assets/logo.png')} style={styles.logo} />
                            <Text style={styles.title}>Registrarse</Text>

                            <TextInput
                                placeholder="Nombre completo"
                                placeholderTextColor="#bbb"
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                returnKeyType="next"
                                onSubmitEditing={() => emailRef.current?.focus()}
                                blurOnSubmit={false}
                            />
                            <TextInput
                                ref={emailRef}
                                placeholder="Email"
                                placeholderTextColor="#bbb"
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                returnKeyType="next"
                                onSubmitEditing={() => passwordRef.current?.focus()}
                                blurOnSubmit={false}
                            />
                            <TextInput
                                ref={passwordRef}
                                placeholder="Contraseña"
                                placeholderTextColor="#bbb"
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                returnKeyType="done"
                                onSubmitEditing={onSubmit}
                            />

                            <TouchableOpacity style={styles.button} onPress={onSubmit} activeOpacity={0.9}>
                                <Text style={styles.buttonText}>
                                    {isLoading ? 'Cargando...' : 'Crear cuenta'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.link}>¿Ya tienes cuenta? Iniciar sesión</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </View>
    );
};

export default RegisterScreen;

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
        paddingBottom: 24, // espacio extra por teclado
    },
    content: { alignItems: 'center', width: '100%' },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 18,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 26,
        color: '#fff',
        marginBottom: 16,
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.98)',
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 15,
        color: '#111',
        marginBottom: 12,
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#0078D7',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 8,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    link: { color: '#fff', marginTop: 8, textDecorationLine: 'underline' },
});
