import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.EXPO_FIREBASE_APIKEY,
    authDomain: process.env.EXPO_FIREBASE_AUTHDOMAIN,
    projectId: process.env.EXPO_FIREBASE_PROJECTID,
    storageBucket: process.env.EXPO_FIREBASE_STORAGEBUCKET,
    messagingSenderId: process.env.EXPO_FIREBASE_MESSAGINGSENDERID,
    appId: process.env.EXPO_FIREBASE_APPID,
    measurementId: process.env.EXPO_FIREBASE_MEASUREMENTID
};

let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);