import { db } from "@/src/core/config/Firebase";
import { LeaderboardRepository } from "@/src/core/models/Leaderboard/repositories/LeaderboardRepository";

export const LeadberboardRepo = LeaderboardRepository(db);

