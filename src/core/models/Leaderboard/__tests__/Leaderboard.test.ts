import { HikeRepository, UserRepository } from "@/src/core/hook/repo/init";
import { createInitialHike } from "@/src/core/models/Hike/Hike";
import { collectUserHikingData, generateLeaderboard } from "@/src/core/models/Leaderboard/Leaderboard";
import { HikeSummaryInDB } from "@/src/core/models/Leaderboard/interfaces/ILeaderboard";

// Add this to your test file
jest.mock("@/src/core/config/Firebase", () => ({
    db: {}, // Mock the database instance
    auth: {}, // Mock the auth instance
}));

jest.mock("@/src/core/config/persistence.native", () => ({
    persistence: undefined, // Or a dummy object if your app needs it
}));

jest.mock("@/src/core/hook/repo/init", () => ({
	HikeRepository: {
		fetchAllUserHike: jest.fn(),
	},
    UserRepository: {
        fetchAll: jest.fn(),
    },
}));

describe("Monthly leaderboard document", () => {
	it("build a collection to show the summary of hiking records of each user in a month", async () => {
		const expectedLeaderboard: Record<string, HikeSummaryInDB> = {
			u1: {
				totalDistance: 300,
				totalElevation: 75,
				totalHikes: 2,
				rank: 1,
                username: "user1",
                firstname: "User",
                lastname: "One",
                email: "user1@example.com",
                profileImage: "",
			},
			u2: {
				totalDistance: 210,
				totalElevation: 50,
				totalHikes: 2,
				rank: 2,
                username: "user2",
                firstname: "User",
                lastname: "Two",
                email: "user2@example.com",
                profileImage: "",
			},
			u3: {
				totalDistance: 90,
				totalElevation: 15,
				totalHikes: 1,
				rank: 3,
                username: "user3",
                firstname: "User",
                lastname: "Three",
                email: "user3@example.com",
                profileImage: "",
			},
			u4: {
				totalDistance: 90,
				totalElevation: 15,
				totalHikes: 1,
				rank: 3,
                username: "user4",
                firstname: "User",
                lastname: "Four",
                email: "user4@example.com",
                profileImage: "",
			},
			u5: {
				totalDistance: 80,
				totalElevation: 10,
				totalHikes: 1,
				rank: 4,
                username: "user5",
                firstname: "User",
                lastname: "Five",
                email: "user5@example.com",
                profileImage: "",
			},
		};

		const leaderboard = await generateLeaderboard();

		expect(leaderboard).toEqual(expectedLeaderboard);
	});

    it("fetches each user, summarizes only completed hikes from the previous month, and skips invalid hikes", async () => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2026, 6, 8, 12, 0, 0, 0));

		const users = [
			{
				id: "u1",
				username: "user1",
				firstname: "User",
				lastname: "One",
				email: "user1@example.com",
				profileImage: "",
			},
			{
				id: "u2",
				username: "user2",
				firstname: "User",
				lastname: "Two",
				email: "user2@example.com",
				profileImage: "",
			},
			{
				id: "u3",
				username: "user3",
				firstname: "User",
				lastname: "Three",
				email: "user3@example.com",
				profileImage: "",
			},
		];

		const june10 = new Date(2026, 5, 10, 9, 0, 0, 0);
		const june12 = new Date(2026, 5, 12, 9, 0, 0, 0);
		const june15 = new Date(2026, 5, 15, 9, 0, 0, 0);
		const july2 = new Date(2026, 6, 2, 9, 0, 0, 0);
		const may20 = new Date(2026, 4, 20, 9, 0, 0, 0);

		const user1Hikes = [
			createInitialHike({
				status: "completed",
				startTime: june10,
				distance: 100,
				elevation: 25,
			}),
			createInitialHike({
				status: "completed",
				startTime: june12,
				distance: 200,
				elevation: 30,
			}),
			createInitialHike({
				status: "started",
				startTime: june15,
				distance: 999,
				elevation: 999,
			}),
			createInitialHike({
				status: "completed",
				startTime: july2,
				distance: 500,
				elevation: 500,
			}),
		];

		const user2Hikes = [
			createInitialHike({
				status: "completed",
				startTime: june15,
				distance: 80,
				elevation: 20,
			}),
			createInitialHike({
				status: "completed",
				startTime: may20,
				distance: 300,
				elevation: 70,
			}),
			createInitialHike({
				status: "started",
				startTime: june12,
				distance: 60,
				elevation: 15,
			}),
		];

		const user3Hikes = [
			createInitialHike({
				status: "started",
				startTime: june10,
				distance: 40,
				elevation: 10,
			}),
		];

		(UserRepository.fetchAll as jest.Mock).mockResolvedValue(users);
		(HikeRepository.fetchAllUserHike as jest.Mock)
			.mockResolvedValueOnce(user1Hikes)
			.mockResolvedValueOnce(user2Hikes)
			.mockResolvedValueOnce(user3Hikes);

		const summary = await collectUserHikingData();

		expect(UserRepository.fetchAll).toHaveBeenCalledTimes(1);
		expect(HikeRepository.fetchAllUserHike).toHaveBeenCalledTimes(3);
		expect(HikeRepository.fetchAllUserHike).toHaveBeenNthCalledWith(1, "u1");
		expect(HikeRepository.fetchAllUserHike).toHaveBeenNthCalledWith(2, "u2");
		expect(HikeRepository.fetchAllUserHike).toHaveBeenNthCalledWith(3, "u3");

		expect(summary).toEqual([
			{
				userId: "u1",
				username: "user1",
				firstname: "User",
				lastname: "One",
				email: "user1@example.com",
				profileImage: "",
				totalDistance: 300,
				totalElevation: 55,
				totalHikes: 2,
			},
			{
				userId: "u2",
				username: "user2",
				firstname: "User",
				lastname: "Two",
				email: "user2@example.com",
				profileImage: "",
				totalDistance: 80,
				totalElevation: 20,
				totalHikes: 1,
			},
		]);

		jest.useRealTimers();
	});
});
