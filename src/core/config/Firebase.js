import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, initializeAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { Platform } from "react-native";
import { persistence } from "./persistence";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_APIKEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTHDOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECTID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGINGSENDERID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APPID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENTID,
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

if (__DEV__) {
  const emulatorHost = getEmulatorHost();
  console.log(`🚀 Connecting to Firebase at: ${emulatorHost}`);
  connectFirestoreEmulator(db, emulatorHost, 8080);
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
  connectFunctionsEmulator(functions, emulatorHost, 5001);
}
