import { auth, db } from "@/src/core/config/Firebase";
import { SignUp } from "@/src/core/models/User/SignUp";
import { User, userConverter } from "@/src/core/models/User/User";
import { Role } from "@/src/core/models/User/User.types";
import { AuthRepository } from "@/src/core/repositories/authRepository";
import { Property } from "@/src/core/types/Property";
import { editProperty } from "@/src/core/utility/editProperty";
import { validateInfo, validateSignUp } from "@/src/core/utility/validate";
import {
	User as FirebaseUser,
	onIdTokenChanged,
	sendPasswordResetEmail,
	signOut,
	Unsubscribe
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { Platform } from "react-native";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type CustomClaims = {
	role: Role | null;
	businessId?: string;
	  owner?: string;
};

export interface AuthState {
	user: FirebaseUser | null;
	profile: User | null;
	isLoading: boolean;
	role: Role | null;
	error: string | null;
	_unsubscribe: Unsubscribe | null;
	businessId: string | null;
	account: SignUp;
	remember: boolean;
	isChecking: boolean;

	signOut: () => Promise<void>;
	reset: () => void;
	logIn: (email: string, password: string) => Promise<void>;
	rememberMe: () => boolean;
	forgotPassword: (email: string) => Promise<void>;
	validateSignUp: () => Promise<boolean>;
	editAccount: (data: SignUp) => void;
	gmailSignUp: () => void;
	gmailLogIn: () => void;
	signUp: () => Promise<void>;
	validateInfo: () => boolean;
	resetSignUp: () => void;
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
};

export const useAuthStore = create<AuthState>()(
	immer((set, get) => ({
		...init,

		resetSignUp: () => set({ account: new SignUp() }),

		reset: () => set({
			...init,
			isLoading: false,
		}),

		
		initialize: () => {
			try {
				const unsubscribeAuth = onIdTokenChanged(auth, async (firebaseUser) => {
					set({ isLoading: true, error: null });
					console.log("init");
					const currentUnsub = get()._unsubscribe;
	
					if (currentUnsub) {
						currentUnsub();
						set({ _unsubscribe: null });
					}
	
					if (firebaseUser) {
						console.log("with user");
	
						const idTokenResult = await firebaseUser.getIdTokenResult(true);
						const userRole = (idTokenResult.claims as CustomClaims)?.role || null;
	
						if (!userRole) {
							console.log("Failed fetching user role");
							setTimeout(() => firebaseUser.getIdToken(true), 2000);
							return;
						}
	
						const businessId =
							(idTokenResult.claims as CustomClaims).businessId ||
							(idTokenResult.claims as CustomClaims).owner ||
							null;
	
						set({
							user: firebaseUser,
							role: userRole,
							businessId,
						});
	
						const ref = doc(db, "users", firebaseUser.uid).withConverter(
							userConverter,
						);
						
						const unsubProfile = onSnapshot(
							ref,
							(snap) => {
								if (snap.exists()) {
									set({
										profile: snap.data(),
										isLoading: false,
									});
								} else {
									console.log("User document does not exists");
								}
							},
							(error) => {
								if (!get().user) return;
								console.log("Firestore listener error: ", error);
							},
						);
						set({ _unsubscribe: unsubProfile });
					} else {
						const currentUnsub = get()._unsubscribe;
	
						if (currentUnsub) {
							currentUnsub();
							set({ 
								_unsubscribe: null,
								profile: null,
								role: null,
								businessId: null,
								user: null,
							});
						}
	
						set({
							...init,
							isLoading: false,
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
			}
		},

		signOut: async () => {
			try {
				set({ isLoading: true, error: null });

				await signOut(auth);
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
			}
		},

		validateSignUp: async () => {
			set({ isChecking: true, error: null });
			try {
				validateSignUp(get().account);

				console.log(get().account);
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
				if (!state.profile) {
					return state;
				}

				return {
					profile: editProperty(state.profile, property),
				};
			});
		},

		editAccount: (data: SignUp) => {
			console.log({ ...data });
			console.log({ ...get().account });

			const current = get().account || new SignUp();
			const updated = current.update(data);

			console.log("merged: ", updated);

			set({ account: updated });
		},

		rememberMe: () => {
			set((state) => {
				return {
				error: "Function to be added soon",
				remember: !state.remember,
				};
			});

			return get().remember;
		},

		gmailSignUp: async () => {
			try {
				if(Platform.OS === 'web') {
					await AuthRepository.webSignUpWithGoogle();
				} else {
					await AuthRepository.signUpWithGoogle();
				}
			} catch (error) {
				console.error("Google sign-in error:", error);
			}
		},

		gmailLogIn: async () => {
			try {
				if(Platform.OS === 'web') {
					await AuthRepository.webSignUpWithGoogle();
				} else {
					await AuthRepository.signUpWithGoogle();
				}
			} catch (error) {
				console.error("Google sign-in error:", error);
				set({
					error: (error as Error).message || "Failed signing in with Google",	
				})
			}
		},

		forgotPassword: async (email: string) => {
			try {
				set({ isLoading: true, error: null });

				const actionCodeSettings = {
					url: 'https://thrail.firebaseapp.com/login', 
					handleCodeInApp: true, 
					iOS: {
						bundleId: 'com.thesis.thrail',
					},
					android: {
						packageName: 'com.thesis.thrail',
						installApp: true,
						minimumVersion: '12',
					},
				};

				await sendPasswordResetEmail(auth, email, actionCodeSettings);

			} catch (error) {
				console.log("Forgot password error:", error);
				set({ isLoading: false, error: (error as Error).message || "Failed to initiate password reset" });
			} 
		},
	})),
);