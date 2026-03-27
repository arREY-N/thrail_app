import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, initializeAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { Platform } from "react-native";
import { persistence } from "./persistence";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_APIKEY || "dummy-api-key",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTHDOMAIN ||
    "dummy-domain.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECTID || "dummy-project",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGEBUCKET ||
    "dummy-bucket.appspot.com",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGINGSENDERID || "1234567890",
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APPID || "1:1234567890:web:abcdef123456",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENTID || "G-DUMMY123",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = persistence
  ? initializeAuth(app, { persistence })
  : getAuth(app);

export const db = getFirestore(app);
export const functions = getFunctions(app);
export { app };

const getEmulatorHost = () => {
  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_EMULATOR_HOST || "10.0.2.2";
  }
  return "localhost";
};

export const USE_EMULATORS = true;

if (__DEV__ && USE_EMULATORS) {
  const emulatorHost = getEmulatorHost();
  console.log(`🚀 Connecting to Firebase at: ${emulatorHost}`);
  connectFirestoreEmulator(db, emulatorHost, 8080);
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
  connectFunctionsEmulator(functions, emulatorHost, 5001);
}
