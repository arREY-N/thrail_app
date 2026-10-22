import { SignUp } from "@/src/core/models/User/interfaces/SignUp.types";
import {
    IEmergencyContact,
    IMedicalProfile,
    IPreference,
    ITutorialProgress,
    IUserDB,
    User,
} from "@/src/core/models/User/interfaces/User.types";
import { toDate, toDateOrNull } from "@/src/core/utility/date";
import {
    FirestoreDataConverter,
    QueryDocumentSnapshot,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";

/**
 * Safely normalizes `onTutorialComplete` from Firestore or partial user initialization.
 * Guarantees existing accounts without the field in Firestore receive `{}` and never crash.
 *
 * @param raw - Raw `onTutorialComplete` value from Firestore or partial User init
 * @returns {ITutorialProgress} Normalized per-tour completion map
 */
export const normalizeTutorialComplete = (raw: unknown): ITutorialProgress => {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const normalized: ITutorialProgress = {};
        for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
            normalized[key] = Boolean(val);
        }
        return normalized;
    }
    if (raw === true) {
        return { all: true };
    }
    return {};
};

export const newPreference = (init?: Partial<IPreference>): IPreference => ({
    experience: '',
    hike_length: [],
    hiked: false,
    location: [],
    province: [],
    ...init,
});

export const newEmergencyContact = (init?: Partial<IEmergencyContact>): IEmergencyContact => {
    return {
        name: '',
        contactNumber: '',
        email: '',
        userId: '',
        chatId: '',
        phoneVerifiedAt: toDateOrNull(init?.phoneVerifiedAt),
        ...init,
    };
};

export const newMedicalProfile = (init?: Partial<IMedicalProfile>): IMedicalProfile => ({
    hasCondition: false,
    details: [],
    ...init,
});

export const newSignUp = (init?: Partial<SignUp>): SignUp => ({
    username: '',
    firstname: '',
    lastname: '',
    email: '',
    phoneNumber: '',
    birthday: init?.birthday ? toDate(init.birthday) : new Date(),
    address: '',
    password: '',
    confirmPassword: '',
    ...init,
    ...(init?.birthday ? { birthday: toDate(init.birthday) } : {}),
});

export const newUser = (init?: Partial<User>): User => {
    return {
        id: '',
        username: '',
        firstname: '',
        lastname: '',
        email: '',
        address: '',
        birthday: init?.birthday ? toDate(init.birthday) : new Date(),
        createdAt: init?.createdAt ? toDate(init.createdAt) : new Date(),
        updatedAt: init?.updatedAt ? toDate(init.updatedAt) : new Date(),
        onBoardingComplete: false,
        onTutorialComplete: normalizeTutorialComplete(init?.onTutorialComplete),
        phoneNumber: '',
        preferences: newPreference(init?.preferences),
        medicalProfile: newMedicalProfile(init?.medicalProfile),
        role: 'user',
        businessId: init?.businessId ?? null,
        fcmTokens: [],
        emergencyContact: newEmergencyContact(init?.emergencyContact),
        phoneVerifiedAt: init?.phoneVerifiedAt ? toDate(init.phoneVerifiedAt) : null,
        profileImage: '',
        profile: init?.profile,
        ...init,
        ...(init?.birthday ? { birthday: toDate(init.birthday) } : {}),
        ...(init?.createdAt ? { createdAt: toDate(init.createdAt) } : {}),
        ...(init?.updatedAt ? { updatedAt: toDate(init.updatedAt) } : {}),
        ...(init?.onTutorialComplete !== undefined
            ? { onTutorialComplete: normalizeTutorialComplete(init.onTutorialComplete) }
            : {}),
        ...(init?.preferences ? { preferences: newPreference(init.preferences) } : {}),
        ...(init?.medicalProfile ? { medicalProfile: newMedicalProfile(init.medicalProfile) } : {}),
        ...(init?.emergencyContact ? { emergencyContact: newEmergencyContact(init.emergencyContact) } : {}),
        ...(init?.businessId !== undefined ? { businessId: init.businessId } : {}),
    };
};

export const editUser = ({ user, updates }: { user: User; updates: Partial<User> }): User => {
    return newUser({ ...user, ...updates });
};

const userFromFirestore = (id: string, data: IUserDB): User => {
    return {
        ...data,
        id,
        businessId: data.businessId ?? null,
        fcmTokens: (data.fcmTokens ?? []).map(token => ({
            ...token,
            lastUpdated: toDate(token.lastUpdated),
        })),
        birthday: toDate(data.birthday),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        onBoardingComplete: Boolean(data.onBoardingComplete),
        onTutorialComplete: normalizeTutorialComplete(data.onTutorialComplete),
        preferences: newPreference(data.preferences),
        profileImage: data.profileImage || '',
        phoneVerifiedAt: data.phoneVerifiedAt ? toDate(data.phoneVerifiedAt) : null,
        profile: data.profile || undefined,
        medicalProfile: {
            ...data.medicalProfile,
            hasCondition: !!data.medicalProfile?.hasCondition,
            details: Array.isArray(data.medicalProfile?.details)
                ? data.medicalProfile.details
                : typeof data.medicalProfile?.details === 'string'
                    ? (data.medicalProfile.details as string).split(/[,\n]+/).map(s => s.trim()).filter(Boolean)
                    : [],
        },
        emergencyContact: newEmergencyContact(data.emergencyContact),
    };
};

const userToFirestore = (user: User): IUserDB => {
    const isNew = user.id === '';

    const mapped: IUserDB = {
        id: user.id,
        fcmTokens: (user.fcmTokens || []).map(token => ({
            ...token,
            lastUpdated: token.lastUpdated instanceof Date ? Timestamp.fromDate(token.lastUpdated) : token.lastUpdated,
        })),
        createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(toDate(user.createdAt)),
        updatedAt: serverTimestamp(),
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        address: user.address,
        birthday: Timestamp.fromDate(toDate(user.birthday)),
        onBoardingComplete: user.onBoardingComplete,
        onTutorialComplete: normalizeTutorialComplete(user.onTutorialComplete),
        phoneNumber: user.phoneNumber,
        preferences: user.preferences,
        medicalProfile: user.medicalProfile,
        role: user.role,
        businessId: user.businessId ?? null,
        emergencyContact: user.emergencyContact ? {
            name: user.emergencyContact.name,
            contactNumber: user.emergencyContact.contactNumber,
            userId: user.emergencyContact.userId || '',
            email: user.emergencyContact.email || '',
            chatId: user.emergencyContact.chatId || '',
            phoneVerifiedAt: user.emergencyContact.phoneVerifiedAt instanceof Date
                ? Timestamp.fromDate(user.emergencyContact.phoneVerifiedAt)
                : (user.emergencyContact.phoneVerifiedAt || null),
        } : user.emergencyContact,
        phoneVerifiedAt: user.phoneVerifiedAt instanceof Date ? Timestamp.fromDate(user.phoneVerifiedAt) : (user.phoneVerifiedAt || null),
        profileImage: user.profileImage,
        ...(user.profile ? { profile: user.profile } : {}),
    };

    return mapped;
};

export const userConverter: FirestoreDataConverter<User> = {
    toFirestore: (user: User) => {
        return userToFirestore(user);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): User => {
        const data = snapshot.data() as IUserDB;
        return userFromFirestore(snapshot.id, data);
    },
};
