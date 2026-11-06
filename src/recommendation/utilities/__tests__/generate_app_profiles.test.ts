jest.mock("@/src/core/models/Trail/Trail", () => ({
    useTrailStore: { getState: () => ({ fetchTrailByName: jest.fn() }) },
}));

import fs from "fs";
import path from "path";
import { GenerateUserProfile } from "@/src/recommendation/utilities/CreateProfile";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "scripts", "simulation", "output");

describe("Step 4: Generate App Profiles", () => {
    it("generates app profiles for all 24 simulated users and writes app_profiles.json", () => {
        const trailsPath = path.join(OUTPUT_DIR, "trails.json");
        const usersSpecPath = path.join(OUTPUT_DIR, "users_spec.json");

        expect(fs.existsSync(trailsPath)).toBe(true);
        expect(fs.existsSync(usersSpecPath)).toBe(true);

        const trails = JSON.parse(fs.readFileSync(trailsPath, "utf-8"));
        const usersSpec = JSON.parse(fs.readFileSync(usersSpecPath, "utf-8"));

        expect(trails.length).toBe(8);
        expect(usersSpec.length).toBe(24);

        const appUsers: any[] = [];

        for (const userSpec of usersSpec) {
            const userProfile = GenerateUserProfile(userSpec, trails);

            expect(userProfile).toBeDefined();
            expect(userProfile.easy).toBeDefined();
            expect(userProfile.difficult).toBeDefined();
            expect(userProfile.easy.features).toBeDefined();
            expect(userProfile.difficult.features).toBeDefined();

            appUsers.push({
                id: userSpec.id,
                experience: userSpec.experience,
                medical: userSpec.medical,
                province_pattern: userSpec.province_pattern,
                medicalProfile: userSpec.medicalProfile,
                preferences: userSpec.preferences,
                profile: {
                    easy: userProfile.easy,
                    difficult: userProfile.difficult,
                },
            });
        }

        expect(appUsers.length).toBe(24);

        const outPath = path.join(OUTPUT_DIR, "app_profiles.json");
        fs.writeFileSync(outPath, JSON.stringify(appUsers, null, 2), "utf-8");
        expect(fs.existsSync(outPath)).toBe(true);

        console.log(`Successfully generated and wrote 24 app profiles to ${outPath}`);
    });
});

