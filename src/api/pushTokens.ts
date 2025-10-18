// src/api/pushTokens.ts
import * as Notifications from 'expo-notifications';
import { db } from '../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function registerPushToken(uid: string) {
    const perms = await Notifications.requestPermissionsAsync();
    if (!perms.granted) return null;
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await setDoc(doc(db, 'users', uid), { expoPushToken: token }, { merge: true });
    return token;
}
