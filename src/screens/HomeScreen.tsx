import { useNavigation } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

const HomeScreen = () => {
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            {/* Fondo de video girado */}
            <Video
                source={require('../../assets/videos/padel-loop.mp4')}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
                volume={0}
                rate={1.0}
            />
            <View style={styles.overlay} />

            {/* Contenido encima del video */}
            <Image
                source={require('../../assets/logo-padel.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            <View style={styles.iconRow}>
                <TouchableOpacity onPress={() => navigation.navigate('QrScreen')}>
                    <Image source={require('../../assets/icons/qr.png')} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Match')}>
                    <Image source={require('../../assets/icons/paleta.png')} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Champions')}>
                    <Image source={require('../../assets/icons/torneo.png')} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <Image source={require('../../assets/icons/profile.png')} style={styles.icon} />
                </TouchableOpacity>


            </View>
        </View>
    );
};

export default HomeScreen;

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
        width: 310,
        height: 310,
        marginBottom: 20,
        zIndex: 2,
    },
    iconRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        position: 'absolute',
        bottom: 60,
        paddingHorizontal: 10,
        zIndex: 2,
    },
    icon: {
        width: 28,
        height: 28,
        marginHorizontal: 10,
    },
});

