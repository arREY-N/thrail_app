import { GenerateUserProfile } from "../CreateProfile";

jest.mock("@/src/core/models/Trail/Trail", () => ({
    useTrailStore: { getState: () => ({ fetchTrailByName: jest.fn() }) },
}));
jest.mock("@/src/recommendation/utilities/NormalizeTrails", () => ({
    buildTrailProfiles: jest.fn(() => []),
    resolveProvinceFeatures: (provinces: string[] = []) => {
        const lower = provinces.map((p) => p.toLowerCase());
        const flag = (k: string) => (lower.includes(k) ? 1 : 0);
        return {
            cavite: flag("cavite"),
            laguna: flag("laguna"),
            batangas: flag("batangas"),
            rizal: flag("rizal"),
            quezon: flag("quezon"),
        };
    },
}));

const trailProfile = (overrides: any = {}) => ({
    metadata: { type: "trail", id: "t1" },
    features: {
        classification: 0,
        length: 0.2,
        elevation: 0.3,
        gain: 0.4,
        easy: 0.5,
        slope: 0.6,
        province: { cavite: 0, laguna: 0, batangas: 0, rizal: 1, quezon: 0 },
        terrain: { muddy: 0.5, rocky: 0, grassland: 0, ridges: 0 },
        circularity: { out_and_back: 1, traverse: 0, circular: 0 },
        waterforms: { fall: 0.4, river: null, lake: null },
        tourism: {
            shelter: 0.5, resting: null, information_board: null, clean_water: null,
            river: null, lake: null, waterfall: null, monument: null,
            community: null, viewpoint: null, network_connection: null,
        },
        ...overrides,
    },
});

const makeUser = (medical: boolean, location: string[] = []) =>
    ({
        id: "u1",
        medicalProfile: { hasCondition: medical },
        preferences: { province: ["Rizal"], location },
    }) as any;

const trails = [{ id: "t1", general: { name: "Mt. Test", address: "Rizal", mountain: ["Mt. Test"] }, profile: trailProfile() }] as any;

describe("medical scope", () => {
    it("beginner: scales physical and terrain only", () => {
        const { easy, difficult } = GenerateUserProfile(makeUser(true));
        for (const k of ["length", "elevation", "gain", "easy", "slope"] as const) {
            expect(easy.features[k]).toBeCloseTo(0.2, 5);
            expect(difficult.features[k]).toBeCloseTo(0.6, 5);
        }
        expect(easy.features.terrain.muddy).toBeCloseTo(0.2, 5);
        expect(difficult.features.terrain.ridges).toBeCloseTo(0.6, 5);
        expect(easy.features.circularity.circular).toBeCloseTo(0.25, 5);
        expect(difficult.features.circularity.circular).toBeCloseTo(0.75, 5);
        expect(easy.features.waterforms.lake).toBeCloseTo(0.25, 5);
        expect(difficult.features.waterforms.fall).toBeCloseTo(0.75, 5);
        expect(easy.features.tourism.shelter).toBeCloseTo(0.2, 5);
        expect(difficult.features.tourism.shelter).toBeCloseTo(0.4, 5);
        expect(easy.features.classification).toBe(0);
        expect(difficult.features.classification).toBe(1);
    });

    it("beginner twins differ only on physical and terrain", () => {
        const a = GenerateUserProfile(makeUser(true));
        const b = GenerateUserProfile(makeUser(false));
        expect(a.easy.features.circularity).toEqual(b.easy.features.circularity);
        expect(a.difficult.features.waterforms).toEqual(b.difficult.features.waterforms);
        expect(a.easy.features.tourism).toEqual(b.easy.features.tourism);
        expect(a.easy.features.province).toEqual(b.easy.features.province);
        expect(a.easy.features.length).not.toEqual(b.easy.features.length);
    });

    it("experienced twins differ only on physical and terrain", () => {
        const a = GenerateUserProfile(makeUser(true, ["Mt. Test"]), trails);
        const b = GenerateUserProfile(makeUser(false, ["Mt. Test"]), trails);
        for (const anchor of ["easy", "difficult"] as const) {
            expect(a[anchor].features.circularity).toEqual(b[anchor].features.circularity);
            expect(a[anchor].features.waterforms).toEqual(b[anchor].features.waterforms);
            expect(a[anchor].features.tourism).toEqual(b[anchor].features.tourism);
            expect(a[anchor].features.province).toEqual(b[anchor].features.province);
        }
        expect(a.easy.features.length).toBeCloseTo(0.2 * 0.5 * 0.8, 5);
        expect(b.easy.features.length).toBeCloseTo(0.2 * 0.5, 5);
        expect(a.difficult.features.slope).toBeCloseTo(0.6 * 1.35 * 0.8, 5);
        // observed terrain scaled, unobserved terrain falls back to the scaled base
        expect(a.easy.features.terrain.muddy).toBeCloseTo(0.5 * 0.5 * 0.8, 5);
        expect(a.easy.features.terrain.rocky).toBeCloseTo(0.2, 5);
        // unobserved route/water/amenities use unscaled bases
        expect(a.easy.features.circularity.traverse).toBeCloseTo(0.25, 5);
        expect(a.easy.features.waterforms.lake).toBeCloseTo(0.25, 5);
        expect(a.easy.features.tourism.viewpoint).toBeCloseTo(0.2, 5);
        // observed route/water/amenities use the unscaled factor
        expect(a.easy.features.circularity.out_and_back).toBeCloseTo(0.5, 5);
        expect(a.easy.features.waterforms.fall).toBeCloseTo(0.4 * 0.5, 5);
        expect(a.difficult.features.tourism.shelter).toBeCloseTo(0.5 * 1.35, 5);
    });
});

