import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import AppStackNavigator from './AppStackNavigator';
import AuthNavigator from './AuthNavigator';

const RootNavigation = () => {
    const user = useSelector((s: RootState) => s.auth);

    if (user === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    const isLoggedIn = !!user.idToken;
    return (
        <NavigationContainer>
            {isLoggedIn ? <AppStackNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
};

export default RootNavigation;
