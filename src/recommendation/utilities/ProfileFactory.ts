import { Profile } from "@/src/recommendation/interfaces/Profile";
import { FirestoreDataConverter, QueryDocumentSnapshot } from "firebase/firestore";

export const newProfile = (init?: Partial<Profile>): Profile => {
    return {
        metadata: {
            type: "user",
            id: "",
            ...init?.metadata,
        },
        features: {
            classification: 0,
            length: 0,
            elevation: 0,
            gain: 0,
            easy: 0,
            slope: 0,
            province: {
                cavite: 0,
                laguna: 0,
                batangas: 0,
                rizal: 0,
                quezon: 0,
                ...init?.features?.province,
            },
            terrain: {
                muddy: 0,
                rocky: 0,
                grassland: 0,
                ridges: 0,
                ...init?.features?.terrain,
            },
            circularity: {
                out_and_back: 0,
                traverse: 0,
                circular: 0,
                ...init?.features?.circularity,
            },
            waterforms: {
                fall: null,
                river: null,
                lake: null,
                ...init?.features?.waterforms,
            },
            tourism: {
                shelter: null,
                resting: null,
                information_board: null,
                clean_water: null,
                river: null,
                lake: null,
                waterfall: null,
                monument: null,
                community: null,
                viewpoint: null,
                network_connection: null,
                ...init?.features?.tourism,
            },
            ...init?.features,
        },
    };
};

const profileFromFirestore = (id: string, data: Profile): Profile => {
    return {
        ...data,
        metadata: {
            ...data.metadata,
            id: id || data.metadata?.id || "",
        },
    };
};

const profileToFirestore = (profile: Profile): Profile => {
    return {
        metadata: {
            type: profile.metadata?.type || "user",
            id: profile.metadata?.id || "",
            ...(profile.metadata?.profile ? { profile: profile.metadata.profile } : {}),
        },
        features: {
            classification: profile.features?.classification ?? 0,
            length: profile.features?.length ?? 0,
            elevation: profile.features?.elevation ?? 0,
            gain: profile.features?.gain ?? 0,
            easy: profile.features?.easy ?? 0,
            slope: profile.features?.slope ?? 0,
            province: {
                cavite: profile.features?.province?.cavite ?? 0,
                laguna: profile.features?.province?.laguna ?? 0,
                batangas: profile.features?.province?.batangas ?? 0,
                rizal: profile.features?.province?.rizal ?? 0,
                quezon: profile.features?.province?.quezon ?? 0,
            },
            terrain: {
                muddy: profile.features?.terrain?.muddy ?? 0,
                rocky: profile.features?.terrain?.rocky ?? 0,
                grassland: profile.features?.terrain?.grassland ?? 0,
                ridges: profile.features?.terrain?.ridges ?? 0,
            },
            circularity: {
                out_and_back: profile.features?.circularity?.out_and_back ?? 0,
                traverse: profile.features?.circularity?.traverse ?? 0,
                circular: profile.features?.circularity?.circular ?? 0,
            },
            waterforms: {
                fall: profile.features?.waterforms?.fall ?? null,
                river: profile.features?.waterforms?.river ?? null,
                lake: profile.features?.waterforms?.lake ?? null,
            },
            tourism: {
                shelter: profile.features?.tourism?.shelter ?? null,
                resting: profile.features?.tourism?.resting ?? null,
                information_board: profile.features?.tourism?.information_board ?? null,
                clean_water: profile.features?.tourism?.clean_water ?? null,
                river: profile.features?.tourism?.river ?? null,
                lake: profile.features?.tourism?.lake ?? null,
                waterfall: profile.features?.tourism?.waterfall ?? null,
                monument: profile.features?.tourism?.monument ?? null,
                community: profile.features?.tourism?.community ?? null,
                viewpoint: profile.features?.tourism?.viewpoint ?? null,
                network_connection: profile.features?.tourism?.network_connection ?? null,
            },
        },
    };
};

export const profileConverter: FirestoreDataConverter<Profile> = {
    toFirestore: (profile: Profile) => {
        return profileToFirestore(profile);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Profile => {
        const data = snapshot.data() as Profile;
        return profileFromFirestore(snapshot.id, data);
    },
};
