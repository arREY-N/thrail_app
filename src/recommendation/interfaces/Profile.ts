export interface ProfileTourism {
    shelter: number | null;
    resting: number | null;
    information_board: number | null;
    clean_water: number | null;
    river: number | null;
    lake: number | null;
    waterfall: number | null;
    monument: number | null;
    community: number | null;
    viewpoint: number | null;
    network_connection: number | null;
}

export interface ProfileWaterforms {
    fall: number | null;
    river: number | null;
    lake: number | null;
}

export interface Profile {
    metadata: {
        type: 'user' | 'trail';
        id: string;
        profile?: 'easy' | 'difficult';
    };
    features: {
        classification: number;
        length: number;
        elevation: number;
        gain: number;
        province: {
            cavite: number;
            laguna: number;
            batangas: number;
            rizal: number;
            quezon: number;
        };
        terrain: {
            muddy: number;
            rocky: number;
            grassland: number;
            ridges: number;
        };
        circularity: {
            out_and_back: number;
            traverse: number;
            circular: number;
        };
        waterforms: ProfileWaterforms;
        tourism: ProfileTourism;
        easy: number;
        slope: number;
    };
}

export interface UserProfiles {
    easy: Profile;
    difficult: Profile;
}

/**
 *  Sembrano
 *  metadata: {
        type: 'trail';
        id: o1Oc3DAYGScmQWMOMlwu;
    },
    features: {
        length: 7.5;
        elevation: 745;
        gain: 704;
        easy: 4/9;
        slope: 9.3;
        terrain: {
            dusty: 0.5;
            muddy: 0.5;
            rocky: 0.2;
            grassland: 0.2;
            ridges: 0.2;
        },
        province: {
            cavite: 0;
            laguna: 0;
            batangas: 0;
            rizal: 1;
            quezon: 0;
        },
        landforms: {
            ridges: ,
            valleys: ,
            hills: ,
            canyons: ,
            forest: ,
            rock_formations: ,
            limestone: ,
            cave: ,
            spring: ,
        },
        waterforms: {
            fall: 0,
            river: 0,
            lake: 0
        },
        circularity: {
            out_and_back: 1,
            traverse: 0,
            circular: 0,
        },
        tourism: {
            shelters: ,
            info_boards: ,
            cultural_sites: ,
        }
    }
 */