import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { Platform } from 'react-native';

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_APIKEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTHDOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECTID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGEBUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGINGSENDERID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APPID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENTID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export { app };

const functions = getFunctions();

if (__DEV__) {
    let emulatorHost;

    if (Platform.OS === 'android') {
        // Android emulators need this special IP to see your computer
        emulatorHost = '10.0.2.2';
    } else if (Platform.OS === 'ios') {
        // iOS simulators can use localhost
        emulatorHost = 'localhost';
    } else {
        // Web browsers use localhost
        emulatorHost = 'localhost';
    }

    console.log(`🚀 Auto-detected environment. Connecting to Firebase at: ${emulatorHost}`);

    connectFirestoreEmulator(db, emulatorHost, 8080);
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
    connectFunctionsEmulator(functions, emulatorHost, 5001);
}