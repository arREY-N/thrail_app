import { Recommendation } from "@/src/core/models/Recommendation/interfaces/Recommendation.types";

/**
 * Sample Recommendation Document for Testing UI & Fallback States.
 *
 * Simulates a scenario where NO TRAILS are predicted to be easy for the user (easy: []).
 * The engine dynamically selects the nearest difficult trail to their easy profile
 * ("Mt. Daraitan" with easyScore: 0.3450) as their "Challenge of the Month".
 */
export const SAMPLE_CHALLENGE_RECOMMENDATION: Recommendation = {
    id: "2026-10",
    createdAt: new Date(),
    updatedAt: new Date(),
    engineConfig: {
        cbf: "GD",
        cf: "GD",
        alpha: 0.85,
        userCount: 15,
    },
    profile: {
        easy: {
            metadata: { type: "user", id: "sample_user", profile: "easy" },
            features: {
                classification: 0.0,
                length: 0.20,      // ~4.8 km baseline
                elevation: 0.20,   // ~500 masl
                gain: 0.22,        // ~300 m gain
                slope: 0.25,       // ~10% slope
                easy: 0.20,        // 2/9 rating
                province: { rizal: 0.85, batangas: 0.15, cavite: 0.0, laguna: 0.0, quezon: 0.0 },
                terrain: { rocky: 0.20, muddy: 0.20, grassland: 0.20, ridges: 0.20 },
                circularity: { out_and_back: 1.0, traverse: 0.0, circular: 0.0 },
                waterforms: { fall: 0.20, river: 0.20, lake: 0.0 },
                tourism: {
                    shelter: 0.20, resting: 0.20, information_board: 0.20, clean_water: 0.20,
                    river: 0.0, lake: 0.0, waterfall: 0.0, monument: 0.0, community: 0.20,
                    viewpoint: 0.20, network_connection: 0.20,
                },
            },
        },
        difficult: {
            metadata: { type: "user", id: "sample_user", profile: "difficult" },
            features: {
                classification: 1.0,
                length: 0.70,
                elevation: 0.70,
                gain: 0.70,
                slope: 0.65,
                easy: 0.70,
                province: { rizal: 0.85, batangas: 0.15, cavite: 0.0, laguna: 0.0, quezon: 0.0 },
                terrain: { rocky: 0.60, muddy: 0.50, grassland: 0.30, ridges: 0.50 },
                circularity: { out_and_back: 0.5, traverse: 0.5, circular: 0.0 },
                waterforms: { fall: 0.40, river: 0.40, lake: 0.0 },
                tourism: {
                    shelter: 0.30, resting: 0.30, information_board: 0.30, clean_water: 0.30,
                    river: 0.10, lake: 0.0, waterfall: 0.10, monument: 0.0, community: 0.10,
                    viewpoint: 0.40, network_connection: 0.20,
                },
            },
        },
    },
    // CRITICAL: Empty easy array triggers Challenge of the Month mode
    easy: [],
    // Difficult list: Mt. Daraitan is closest to the user's easy anchor (lowest easyScore)
    difficult: [
        {
            id: "mock_daraitan",
            trailName: "Mt. Daraitan",
            category: "difficult",
            haveHiked: false,
            score: 0.3120,          // difficult distance score (69% match)
            easyScore: 0.3450,      // closest difficult trail to their easy profile!
            diffScore: 0.3120,
            cbfScore: 0.3120,
            cfScore: 0.0000,
            isChallengeOfMonth: true,
        },
        {
            id: "mock_batulao",
            trailName: "Mt. Batulao",
            category: "difficult",
            haveHiked: false,
            score: 0.3650,
            easyScore: 0.4850,
            diffScore: 0.3650,
            cbfScore: 0.3650,
            cfScore: 0.0000,
        },
        {
            id: "mock_makiling",
            trailName: "Mt. Makiling",
            category: "difficult",
            haveHiked: false,
            score: 0.2840,
            easyScore: 0.6120,      // high endurance challenge, furthest from easy profile
            diffScore: 0.2840,
            cbfScore: 0.2840,
            cfScore: 0.0000,
        },
    ],
    aiReasonings: {
        "mock_daraitan": {
            summary: "None of our active trails are currently predicted to be easy for your baseline. As your Challenge of the Month, Mt. Daraitan (69% profile match) represents the nearest, most accessible challenge to your capabilities. At 8.0 km with +600 m elevation gain, it will push your stamina beyond your comfortable baseline. Please review the physical demands carefully and proceed with proper training, hydration, and caution.",
            physicalFit: "Based on your calibrated baseline average length of 4.8 km, Mt. Daraitan's 8.0 km route represents a +3.2 km endurance challenge. Its +600 m ascent exceeds your +303 m climbing threshold, and its 15% gradient tests technical footwork on limestone terrain.",
            terrainFit: "Mt. Daraitan features rugged limestone scrambles and exposed forested paths. While technical, it has established guide infrastructure with local community marshals at the barangay hall.",
            provinceFit: "Situated in Tanay, Rizal, this trail aligns with your stated regional accessibility preference in Calabarzon.",
            safetyTips: "Hire an accredited local guide at the trailhead, wear supportive trail shoes with aggressive lugs for slick limestone, carry at least 3L of water with electrolyte replenishments, and start before 5:00 AM.",
            generatedAt: new Date().toISOString(),
            source: "algorithmic",
        },
    },
};
