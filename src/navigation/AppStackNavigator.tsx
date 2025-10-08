// src/navigation/AppStackNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// Screens
import HomeScreen from '../screens/HomeScreen';
import MatchScreen from '../screens/MatchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import QrScannerScreen from '../screens/QrScannerScreen';
import QrScreen from '../screens/QrScreen';

export type AppStackParamList = {
  Home: undefined;
  Match: undefined;
  Store: undefined;
  QrScreen: undefined;
  QrScannerScreen: undefined;
  Profile: undefined;
  Cart: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Match" component={MatchScreen} />
      <Stack.Screen name="QrScreen" component={QrScreen} />
      <Stack.Screen name="QrScannerScreen" component={QrScannerScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
