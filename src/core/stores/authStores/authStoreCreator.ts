import { auth, db } from "@/src/core/config/Firebase";
import { SignUp } from "@/src/core/models/User/SignUp";
import { User, userConverter } from "@/src/core/models/User/User";
import { Role } from "@/src/core/models/User/interfaces/User.types";
import { AuthRepository } from "@/src/core/repositories/authRepository";
import { Property } from "@/src/core/types/Property";
import { editProperty } from "@/src/core/utility/editProperty";
import { logger } from "@/src/core/utility/errorFormatter";
import { validateInfo, validateSignUp } from "@/src/core/utility/validate";
import {
    onIdTokenChanged,
    sendPasswordResetEmail,
    signOut,
    Unsubscribe
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { Platform } from "react-native";
import { StateCreator } from "zustand";

type CustomClaims = {
    role: Role | null;
    businessId?: string;
    owner?: string;
};

// Simplified plain object type for storing minimal Firebase Auth properties safely
export interface CleanedAuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
}

export interface AuthState {
    user: CleanedAuthUser | null; // Changed from FirebaseUser to a serializable type
    profile: User | null;
    isLoading: boolean;
    role: Role | null;
    error: string | null;
    _unsubscribe: Unsubscribe | null;
    businessId: string | null;
    account: SignUp;
    remember: boolean;
    isChecking: boolean;
    isHydrated: boolean; // Added to handle initial AsyncStorage loading reliably

    initialize: () => Unsubscribe | undefined;
    signOut: () => Promise<void>;
    reset: () => void;
    logIn: (email: string, password: string) => Promise<void>;
    rememberMe: () => void;
    forgotPassword: (email: string) => Promise<void>;
    validateSignUp: () => Promise<boolean>;
    editAccount: (data: SignUp) => void;
    gmailSignUp: () => Promise<void>;
    signUp: () => Promise<void>;
    validateInfo: () => boolean;
    resetSignUp: () => void;
    setHydrated: (hydrated: boolean) => void;
}

const init = {
    user: null,
    profile: null,
    isLoading: true,
    error: null,
    _unsubscribe: null,
    businessId: null,
    account: new SignUp(),
    remember: true,
    isChecking: false,
    role: null,
    isHydrated: false,
};

export const authStoreCreator: StateCreator<AuthState, [["zustand/immer", never]]> = (set, get) => ({
    ...init,

    resetSignUp: () => set({ account: new SignUp() }),

    reset: () => set({
        ...init,
        isLoading: false,
    }),

    setHydrated: (hydrated) => set({ isHydrated: hydrated }),

    initialize: () => {
        try {
            const unsubscribeAuth = onIdTokenChanged(auth, async (firebaseUser) => {
                set({ error: null });

                if (!get().user) {
                    set({ isLoading: true });
                }
                console.log("init");
                const currentUnsub = get()._unsubscribe;

                if (currentUnsub) {
                    currentUnsub();
                    set({ _unsubscribe: null });
                }

                console.log('line 90')

                if (firebaseUser) {

                    try {
                        console.log("with user");

                        const idTokenResult = await firebaseUser.getIdTokenResult(false);

                        console.log('worked');

                        const businessId =
                            (idTokenResult.claims as CustomClaims).businessId ||
                            (idTokenResult.claims as CustomClaims).owner ||
                            null;

                        const ref = doc(db, "users", firebaseUser.uid).withConverter(
                            userConverter,
                        );

                        // Map only serializable string properties to the store state slice
                        const cleanedUser: CleanedAuthUser = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                        };

                        const unsubProfile = onSnapshot(
                            ref,
                            (snap) => {
                                if (snap.exists()) {
                                    console.log('snap exists');
                                    set({
                                        user: cleanedUser,
                                        role: snap.data().role,
                                        profile: snap.data(),
                                        isLoading: false, // Disables loading layout once cached profile loads
                                        businessId,
                                    });
                                } else {
                                    if (!snap.metadata.fromCache) {
                                        console.log("User document does not exist on server");
                                        set({ isLoading: false, error: "User document does not exist" });
                                    } else {
                                        console.log("Profile loading from cache temporarily empty...");

                                        // FIX: If we have a fallback profile restored safely via Zustand's AsyncStorage 
                                        // rehydration layer, turn off the loading spinner so the hiker can see their cached data layout!
                                        if (get().profile) {
                                            set({ isLoading: false });
                                        }
                                    }
                                }
                            },
                            (error) => {
                                console.log("Firestore snapshot handled error: ", error);
                                if (get().profile) {
                                    set({ isLoading: false });
                                }
                            },
                        );
                        set({ _unsubscribe: unsubProfile });
                    } catch (error) {
                        console.error("Error fetching user profile:", error);
                        set({ error: (error as Error).message || "Error fetching user profile", isLoading: false });
                        return;
                    }
                } else {
                    console.log("no user");
                    const currentUnsub = get()._unsubscribe;

                    if (currentUnsub) {
                        currentUnsub();
                    }

                    set({
                        ...init,
                        _unsubscribe: null,
                        isLoading: false,
                        isHydrated: get().isHydrated // Keep hydration status intact
                    });
                }
            });

            return unsubscribeAuth;
        } catch (error) {
            console.error("Error initializing auth:", error);
            set({
                error: (error as Error).message || "Error initializing authentication",
                isLoading: false,
            });
        }
    },

    logIn: async (email: string, password: string) => {
        try {
            set({ isChecking: true, error: null, isLoading: true });
            await AuthRepository.logIn({ email, password });
            set({ isChecking: false, error: null });
        } catch (err) {
            console.log(err);
            set({
                error: (err as Error).message ?? "Error logging in",
                isLoading: false,
            });
            throw new Error((err as Error).message ?? "Error logging in");
        }
    },

    signOut: async () => {
        try {
            set({ isLoading: true, error: null });
            await signOut(auth);

            const currentUnsub = get()._unsubscribe;

            if (currentUnsub) {
                currentUnsub();
            }
        } catch (err) {
            set({
                error: (err as Error).message ?? "Failed signing out",
                isLoading: false,
            });
        }
    },

    signUp: async () => {
        try {
            set({ isLoading: true, error: null });
            await AuthRepository.signUp(get().account);
        } catch (err) {
            set({
                error: (err as Error).message || "Failed signing up",
                isLoading: false,
            });
            throw new Error((err as Error).message || "Failed signing up");
        }
    },

    validateSignUp: async () => {
        set({ isChecking: true, error: null });
        try {
            validateSignUp(get().account);
            console.log(get().account);
            if (__DEV__) {
                logger('authStoreCreator', 'credential bypassed, only for development mode');
                set({ isChecking: false, error: null });
                return true;
            }
            await AuthRepository.checkUserCredentials(get().account);
            set({ isChecking: false, error: null });
            return true;
        } catch (err) {
            set({
                error: (err as Error).message || "Failed checking user credentials",
                isChecking: false,
            });
            return false;
        }
    },

    validateInfo: () => {
        try {
            set({ isLoading: true, error: null });
            validateInfo(get().account);
            set({ isLoading: false });
            return true;
        } catch (err) {
            set({
                error: (err as Error).message || "Failed checking user information",
                isLoading: false,
            });
            return false;
        }
    },

    edit: (property: Property) => {
        set((state) => {
            if (!state.profile) return;
            state.profile = editProperty(state.profile, property);
        });
    },

    editAccount: (data: SignUp) => {
        const current = get().account || new SignUp();
        const updated = current.update(data);
        set({ account: updated });
    },

    rememberMe: () => {

    },

    gmailSignUp: async () => {
        try {
            set({ isChecking: true, error: null, isLoading: true });

            if (Platform.OS === 'web') {
                await AuthRepository.webSignUpWithGoogle();
            } else {
                await AuthRepository.signUpWithGoogle();
            }

            set({ isChecking: false, error: null });
        } catch (error) {
            console.error("Google sign-in error:", error);
            set({
                isLoading: false,
                error: (error as Error).message || "Failed signing up with Google",
            })
        }
    },

    forgotPassword: async (email: string) => {
        try {
            set({ isLoading: true, error: null });

            const actionCodeSettings = {
                url: 'https://thrail.firebaseapp.com/login',
                handleCodeInApp: true,
                iOS: { bundleId: 'com.thesis.thrail' },
                android: {
                    packageName: 'com.thesis.thrail',
                    installApp: true,
                    minimumVersion: '12',
                },
            };

            await sendPasswordResetEmail(auth, email, actionCodeSettings);
            set({ isLoading: false, error: null });
        } catch (error) {
            console.log("Forgot password error:", error);
            set({ isLoading: false, error: (error as Error).message || "Failed to initiate password reset" });
        }
    },
});