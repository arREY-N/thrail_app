import { db } from "@/src/core/config/Firebase";
import { LeaderboardRepository } from "@/src/core/models/Leaderboard/repositories/LeaderboardRepository";
import { OfferRepository } from "@/src/core/models/Offer/repositories/OfferRepository";

export const LeadberboardRepo = LeaderboardRepository(db);
export const OfferRepo = OfferRepository(db);
