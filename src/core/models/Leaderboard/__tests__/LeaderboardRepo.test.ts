import { collection, getDocs, where } from "firebase/firestore";
import { LeaderboardRepository } from "../LeaderboardRepository";

// Mock the entire firebase/firestore module
jest.mock("firebase/firestore", () => ({
    collection: jest.fn(() => ({
        withConverter: jest.fn().mockReturnThis(), // Allow chaining
    })),
    getDocs: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
}));

describe("LeaderboardRepository", () => {
    it("should fetch users and their completed hikes", async () => {
        // 1. Setup Mock Data
        const mockUserDoc = { id: "u1", data: () => ({ name: "Alice" }) };
        const mockHikeDoc = { data: () => ({ id: "h1", status: "completed" }) };

        // 2. Mock Firestore responses
        // Mock getDocs(userCollection)
        (getDocs as jest.Mock).mockResolvedValueOnce({
            docs: [mockUserDoc],
        });
        // Mock getDocs(hikesQuery)
        (getDocs as jest.Mock).mockResolvedValueOnce({
            docs: [mockHikeDoc],
        });

        // 3. Initialize Repo with a dummy db
        const repo = LeaderboardRepository({ name: 'mockDb' });

        // 4. Execute
        const result = await repo.fetchAllData();

        // 5. Assertions
        expect(result).toBeDefined();
        // Verify that we queried the users collection
        expect(collection).toHaveBeenCalledWith(expect.anything(), "users");
        // Verify that we filtered hikes by 'completed'
        expect(where).toHaveBeenCalledWith("status", "==", "completed");
    });
});